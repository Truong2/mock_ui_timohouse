const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime, metrics, root } = require('./dataset-runtime.cjs');
const out = path.join(root, 'docs/qa/dataset');
const { TH } = runtime();
let checks = 0;
function check(ok, message) { checks++; assert.ok(ok, message); }
function equal(a, b, message) { checks++; assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), message); }
function write(name, value) { fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + '\n'); }
const fresh = TH.db;
equal(fresh, TH.seed(), 'Seed is deterministic, including fixed report snapshots');
check(fresh.buildings.length === 3 && fresh.rooms.length === 18, 'Scope 3 buildings / 18 rooms');
equal(TH.PERIODS, ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'], 'Six periods');
check(fresh.dataset.version === 'excel-demo-v2' && TH.DATA_SCHEMA === 13, 'Dataset version and schema');
const index = Object.fromEntries(Object.entries(fresh).filter(([, v]) => Array.isArray(v)).map(([k, rows]) => [k, new Map(rows.filter(x => x.id).map(x => [x.id, x]))]));
for (const [table, rows] of Object.entries(fresh).filter(([, v]) => Array.isArray(v))) {
  const ids = rows.filter(x => x.id).map(x => x.id); check(new Set(ids).size === ids.length, 'Unique IDs: ' + table);
  for (const row of rows) for (const [fk, target] of Object.entries({ buildingId: 'buildings', ownerId: 'owners', roomId: 'rooms', customerId: 'customers', contractId: 'contracts', invoiceId: 'invoices', expenseId: 'expenses', serviceContractId: 'serviceContracts', technicianId: 'staff', staffId: 'staff', managerId: 'staff', leaseId: 'leases', extraFeeId: 'extraFees' })) {
    if (row[fk] && !(table === 'audit' && fk === 'buildingId' && row[fk] === 'ALL')) check(index[target].has(row[fk]), `${table}.${fk}: ${row[fk]}`);
  }
}
for (const inv of fresh.invoices) {
  const c = index.contracts.get(inv.contractId);
  check(c.roomId === inv.roomId && c.customerId === inv.customerId && c.buildingId === inv.buildingId, 'Invoice chain ' + inv.id);
  check(inv.period >= c.start.slice(0, 7) && inv.period <= (c.endedAt || c.end).slice(0, 7), 'Invoice within contract ' + inv.id);
  check(inv.total === inv.lines.reduce((n, l) => n + l.amount, 0), 'Invoice sum ' + inv.id);
}
for (const room of fresh.rooms) {
  const contracts = fresh.contracts.filter(c => c.roomId === room.id).sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < contracts.length; i++) check((contracts[i - 1].endedAt || contracts[i - 1].end) < contracts[i].start, 'No overlapping rental history ' + room.id);
}
for (const r of fresh.readings) {
  const invalid = r.elecCur === null || r.waterCur === null || r.elecCur < r.elecPrev || r.waterCur < r.waterPrev;
  check(!invalid || (r.period === '2026-10' && ['102G1', '201G1'].includes(r.roomId) && r.status !== 'confirmed'), 'Meter anomaly must stay unconfirmed ' + r.roomId);
}
for (const e of fresh.expenses.filter(e => ['utility', 'internet'].includes(e.category))) {
  check(fresh.supplierBills.filter(b => b.expenseId === e.id).reduce((n, b) => n + b.amount, 0) === e.amount, 'Supplier bill conservation ' + e.id);
}
for (const job of fresh.repairJobs.filter(j => j.expenseId)) check(job.payer === 'company' && job.lines.reduce((n, l) => n + l.qty * l.unitPrice, 0) === index.expenses.get(job.expenseId).amount, 'Repair ledger ' + job.id);
for (const c of fresh.commissions) check(Math.round(c.rent * c.rate) === c.amount && (!c.expenseId || c.amount === index.expenses.get(c.expenseId).amount), 'Commission ' + c.id);
for (const d of fresh.depositCases) {
  if (d.state === 'refunded') {
    check(!!d.paidAt && !!d.paidBy && !!d.txnRef && d.approvedBy !== d.proposedBy, 'Refund needs actual disbursement ' + d.id);
    check(fresh.deposits.some(x => x.type === 'refund' && x.contractId === d.contractId && x.amount === d.refundAmount), 'Refund ledger ' + d.id);
  }
  if (d.state === 'pending_approval') check(!d.paidAt, 'Pending refund not paid');
}
check(TH.calc.roomBill('101T17', '2026-05').balance === 100000, 'Excel positive balance = overpayment');
for (const r of fresh.reportRuns) {
  check(r.groupKey === r.type + '|' + r.period + '|' + r.buildingIds.slice().sort().join('+'), 'Report version group ' + r.id);
  for (const [mode, cols] of Object.entries(r.snapshot.vals)) for (const [col, vals] of Object.entries(cols)) {
    const actual = TH.calc.pnl(r.period, r.snapshot.cols[col].ids, mode);
    for (const [key, value] of Object.entries(vals)) {
      const live = key.startsWith('r:') ? actual.ratios[key.slice(2)] : actual[key];
      check(value === null ? !Number.isFinite(live) : Math.abs(value - live) < 1e-8, 'Fixed snapshot matches source ' + r.id + '/' + key);
    }
  }
}
// Excel-shaped master data: building code = T/S/G + number, room code = room number + building code.
for (const b of fresh.buildings) check(TH.BUILDING_CODE_RE.test(b.id) && b.type === b.id.charAt(0), 'Excel building code ' + b.id);
equal(fresh.buildings.map(b => b.type).sort(), ['G', 'S', 'T'], 'One building per house type T/S/G');
for (const r of fresh.rooms) check(r.id === r.no + r.buildingId && r.meters.every(m => m.code.endsWith(r.id)), 'Excel room code ' + r.id);
const allIds = new Map();
for (const [table, rows] of Object.entries(fresh).filter(([, v]) => Array.isArray(v))) for (const row of rows) if (row && row.id) {
  check(!allIds.has(row.id) || allIds.get(row.id) === table, 'ID unique across tables: ' + row.id + ' (' + table + ' / ' + allIds.get(row.id) + ')');
  allIds.set(row.id, table);
}
const invKeys = fresh.invoices.map(i => i.roomId + '|' + i.period);
check(new Set(invKeys).size === invKeys.length, 'At most one invoice per room and period');
// Teams follow the org chart: office → ops departments / sales; leaders and members exist.
const teams = new Map(fresh.teams.map(t => [t.id, t]));
for (const t of fresh.teams) {
  check(['office', 'ops', 'sales'].includes(t.kind) && index.staff.has(t.leaderId) && (!t.parent || teams.has(t.parent)), 'Team structure ' + t.id);
}
for (const s of fresh.staff) check(teams.has(s.team) && s.lunch + s.fuel === s.allowance, 'Staff team and allowance split ' + s.id);
for (const b of fresh.buildings) {
  const main = fresh.assignments.filter(a => a.buildingId === b.id && a.role === TH.ROLE_MAIN && a.main && !a.to);
  check(main.length === 1 && main[0].staffId === b.managerId, 'Building manager = active main assignment ' + b.id);
}
// Shares: 5% steps summing to 100 per building and period.
for (const p of TH.PERIODS) for (const b of fresh.buildings) {
  const rows = TH.calc.sharesFor(b.id, p);
  check(rows.reduce((n, s) => n + s.ratio, 0) === 100 && rows.every(s => s.ratio % 5 === 0), 'Shares 100% in 5% steps ' + b.id + ' ' + p);
}
// Commission = rate × agreed rent; one per new (non-successor) contract; in-window rows link the marketing expense.
for (const c of fresh.commissions) {
  const ct = index.contracts.get(c.contractId);
  check(ct.rent === c.rent && c.period === ct.start.slice(0, 7) && !ct.previousContractId && [0.25, 0.3, 0.35, 0.5].includes(c.rate), 'Commission source ' + c.id);
  check(TH.PERIODS.includes(c.period) === !!c.expenseId, 'Commission expense only inside demo periods ' + c.id);
  if (c.staffId) check(index.staff.get(c.staffId).joinedAt <= ct.start, 'Commission sale already employed ' + c.id);
}
const ctCommissions = fresh.commissions.map(c => c.contractId);
check(new Set(ctCommissions).size === ctCommissions.length, 'One commission per contract');
for (const e of fresh.expenses.filter(e => e.category === 'commission' && /^Hoa hồng/.test(e.description))) check(fresh.commissions.some(c => c.expenseId === e.id), 'Commission expense has ledger row ' + e.id);
for (const f of fresh.extraFees) check(fresh.repairJobs.some(j => j.extraFeeId === f.id && j.payer === 'customer' && j.lines.reduce((n, l) => n + l.qty * l.unitPrice, 0) === f.qty * f.price), 'Customer-paid repair = extra fee ' + f.id);
// Personal data stays synthetic and masked.
for (const k of fresh.customers) check(k.phone.includes('•') && k.idNo.includes('•'), 'Masked customer ' + k.id);
for (const s of fresh.staff) check(s.phone.includes('•'), 'Masked staff ' + s.id);
// Tenant contracts follow the full template (Hop_dong_thue_phong_demo_day_du.pdf) and agree with source records.
const room = id => index.rooms.get(id), bld = id => index.buildings.get(id);
for (const ct of fresh.contracts) {
  const k = index.customers.get(ct.customerId), T = ct.terms, H = ct.handover, P = ct.prepaid, r = room(ct.roomId);
  check(ct.id.startsWith('HĐ-' + ct.roomId + '/'), 'Contract code from room ' + ct.id);
  check(ct.signedAt < ct.start && TH.dayDiff(ct.signedAt, ct.start) <= 5, 'Signed shortly before start ' + ct.id);
  check(!!(ct.partyA && ct.partyA.name && ct.partyA.idNo.includes('•') && ct.partyA.phone), 'Bên A filled ' + ct.id);
  check(!!(k.name && k.dob && k.phone && k.idNo && k.idPlace && k.permAddress), 'Bên B filled ' + ct.id);
  check(T.template === 'DAYDU' && T.refundDays === 10 && T.noticeDays === 30 && T.transferFee === 200000 && T.lateFeePerDay === 200000 && T.lateGraceDays === 3 && T.warrantyDays === 10, 'Template terms ' + ct.id);
  check(T.peopleMax >= ct.people && T.payAccount === TH.calc.payAccount(ct.buildingId), 'Điều 1.2 / 4.4.2 ' + ct.id);
  check(T.transferNote === TH.roomNo(r) + ' - ' + ct.buildingId + ' - ' + TH.unaccent(k.name).toUpperCase(), 'Điều 4.4.3 transfer note ' + ct.id);
  check(H && H.assets.length === TH.HANDOVER_ASSETS.length && H.billingFrom >= ct.start, 'Điều 2.2 / 3.2 handover ' + ct.id);
  if (ct.id !== 'HĐ-202G1/26') check(P && P.total === ct.deposit + ct.rent && P.beforeSign + P.atSign === P.total, 'Điều 4.1 prepaid = deposit + first rent ' + ct.id);
  check(ct.deposit > 0 && (ct.deposit === ct.rent || ct.priceNote || ct.status !== 'active'), 'Điều 4.3 deposit one month ' + ct.id);
  const p0 = ct.start.slice(0, 7);
  if (TH.PERIODS.includes(p0)) {
    const rd = fresh.readings.find(x => x.roomId === ct.roomId && x.period === p0);
    check(rd && rd.elecPrev === H.elecStart && rd.waterPrev === H.waterStart, 'Điều 4.2 meter start = first reading ' + ct.id);
    const dep = fresh.deposits.filter(d => d.roomId === ct.roomId && d.type === 'in' && d.period >= TH.addMonthsYm(p0, -1) && d.period <= p0);
    check(dep.length === 1 && dep[0].amount === ct.deposit, 'Điều 4.3 deposit ledger ' + ct.id);
  }
  const vehicles = (k.vehicles || []).filter(v => v.from <= ct.start || v.from === ct.start);
  const ebLine = ct.priceList.find(l => l.code === 'PARK_EBIKE');
  if (T.vehiclesDeclared !== null && T.vehiclesDeclared !== undefined) check(vehicles.filter(v => v.type === 'Xe máy' && v.from === ct.start).length === T.vehiclesDeclared, 'Điều 1.2 motorbikes ' + ct.id);
  check(vehicles.filter(v => v.type === 'Xe đạp điện' && v.from === ct.start).length === (ebLine.qty || 0), 'Điều 1.2 e-bikes = PARK_EBIKE line ' + ct.id);
  for (const inv of fresh.invoices.filter(i => i.contractId === ct.id)) {
    const rent = inv.lines.find(l => l.type === 'rent');
    if (rent) check(rent.price === ct.rent, 'Điều 4.1 rent = invoice rent line ' + inv.id);
    for (const l of inv.lines.filter(l => l.type === 'fixed')) {
      const pl = ct.priceList.find(x => x.code === l.code && x.active);
      check(pl && pl.price === l.price && (pl.method !== 'per_person' || l.qty === ct.people), 'Điều 4.4 fee = invoice line ' + inv.id + ' ' + l.code);
    }
    const e = inv.lines.find(l => l.type === 'elec'), w = inv.lines.find(l => l.type === 'water');
    if (e) check(e.price === ct.priceList.find(x => x.code === 'ELEC').price, 'Điều 4.4 electricity price ' + inv.id);
    if (w) check(w.price === ct.priceList.find(x => x.code === 'WATER').price, 'Điều 4.4 water price ' + inv.id);
  }
}
for (const r of fresh.receipts.filter(r => r.method === 'Chuyển khoản')) {
  const inv = index.invoices.get(r.invoiceId);
  check(r.transferNote === index.contracts.get(inv.contractId).terms.transferNote, 'Receipt transfer note follows contract ' + r.id);
}
check(JSON.stringify(fresh).length < 3.5e6, 'Dataset fits browser storage budget');
const baselineFile = path.join(out, 'baseline-schema13.json');
const financial = metrics(TH);
if (fs.existsSync(baselineFile)) {
  const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  equal(financial, baseline.metrics, 'Financial engine matches baseline schema 13 (re-capture with node tools/dataset-runtime.cjs after intended changes)');
}
const performance = [], payroll = [], shares = [], billRows = [];
for (const p of TH.PERIODS) {
  payroll.push({ period: p, rows: TH.calc.payroll(p) });
  for (const b of fresh.buildings) {
    performance.push(TH.calc.perfBuilding(p, b.id));
    const v = TH.calc.pnl(p, b.id, 'tong');
    shares.push({ period: p, buildingId: b.id, data: TH.calc.shareSplit(p, b.id, v) });
  }
  for (const room of fresh.rooms) {
    const bill = TH.calc.roomBill(room.id, p);
    billRows.push({ roomId: room.id, period: p, due: bill.due, paid: bill.paid, balance: bill.balance, state: bill.state, oldDebt: bill.oldDebt });
  }
}
const previews = fresh.contracts.filter(c => c.status === 'active' && c.buildingId === TH.DEMO.building.unbilled).map(c => TH.buildInvoice(fresh, c, '2026-10', 'draft'));
write('dataset.json', fresh);
write('formula-rules.json', TH.dataset.rules);
write('engine-results.json', { financial, performance, payroll, shares, billRows, previews, common: TH.calc.commonShare('CTC-G1-01', '2026-10'), forecasts: fresh.forecastPlans.map(p => ({ planId: p.id, ...TH.dataset.forecast(p) })) });
write('structural-results.json', { passed: checks, failed: 0, datasetVersion: TH.dataset.version, schema: TH.DATA_SCHEMA, counts: { buildings: fresh.buildings.length, invoices: fresh.invoices.length, receipts: fresh.receipts.length, rooms: fresh.rooms.length, contracts: fresh.contracts.length, commissions: fresh.commissions.length, repairJobs: fresh.repairJobs.length, staff: fresh.staff.length, teams: fresh.teams.length, scenarios: fresh.dataset.scenarios.length, reports: fresh.reportRuns.length } });
console.log(JSON.stringify({ passed: checks, failed: 0 }));
