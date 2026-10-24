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
check(fresh.dataset.version === 'excel-demo-v1' && TH.DATA_SCHEMA === 12, 'Additive compatibility');
const index = Object.fromEntries(Object.entries(fresh).filter(([, v]) => Array.isArray(v)).map(([k, rows]) => [k, new Map(rows.filter(x => x.id).map(x => [x.id, x]))]));
for (const [table, rows] of Object.entries(fresh).filter(([, v]) => Array.isArray(v))) {
  const ids = rows.filter(x => x.id).map(x => x.id); check(new Set(ids).size === ids.length, 'Unique IDs: ' + table);
  for (const row of rows) for (const [fk, target] of Object.entries({ buildingId: 'buildings', ownerId: 'owners', roomId: 'rooms', customerId: 'customers', contractId: 'contracts', invoiceId: 'invoices', expenseId: 'expenses', serviceContractId: 'serviceContracts', technicianId: 'staff' })) {
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
  check(!invalid || (r.period === '2026-10' && ['TX-102', 'TX-201'].includes(r.roomId) && r.status !== 'confirmed'), 'Meter anomaly must stay unconfirmed ' + r.roomId);
}
for (const e of fresh.expenses.filter(e => ['utility', 'internet'].includes(e.category))) {
  check(fresh.supplierBills.filter(b => b.expenseId === e.id).reduce((n, b) => n + b.amount, 0) === e.amount, 'Supplier bill conservation ' + e.id);
}
for (const job of fresh.repairJobs) check(job.lines.reduce((n, l) => n + l.qty * l.unitPrice, 0) === index.expenses.get(job.expenseId).amount, 'Repair ledger ' + job.id);
for (const c of fresh.commissions) check(Math.round(c.rent * c.rate) === c.amount && c.amount === index.expenses.get(c.expenseId).amount, 'Commission ' + c.id);
for (const d of fresh.depositCases) {
  if (d.state === 'refunded') {
    check(!!d.paidAt && !!d.paidBy && !!d.txnRef && d.approvedBy !== d.proposedBy, 'Refund needs actual disbursement ' + d.id);
    check(fresh.deposits.some(x => x.type === 'refund' && x.contractId === d.contractId && x.amount === d.refundAmount), 'Refund ledger ' + d.id);
  }
  if (d.state === 'pending_approval') check(!d.paidAt, 'Pending refund not paid');
}
check(TH.calc.roomBill('CG-101', '2026-05').balance === 100000, 'Excel positive balance = overpayment');
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
const baseline = JSON.parse(fs.readFileSync(path.join(out, 'baseline-schema12.json'), 'utf8'));
TH.db = baseline.db;
equal(metrics(TH), baseline.metrics, 'Same inputs, same financial engine regression');
TH.db = fresh;
const financial = metrics(TH), differences = [];
// Explain every changed metric by replaying only the five intentional input
// changes on the preserved baseline. This also catches unclassified changes.
const staged = JSON.parse(JSON.stringify(baseline.db));
const stages = [
  ['DS-03', () => {
    const ids = new Set(fresh.invoices.filter(i => i.roomId === 'TX-101').map(i => i.id));
    staged.invoices = staged.invoices.map(i => ids.has(i.id) ? fresh.invoices.find(n => n.id === i.id) : i);
    staged.receipts = staged.receipts.map(r => ids.has(r.invoiceId) ? fresh.receipts.find(n => n.id === r.id) : r);
  }],
  ['DS-05', () => { staged.receipts = staged.receipts.map(r => r.invoiceId === 'INV-2605-CG101' ? fresh.receipts.find(n => n.id === r.id) : r); }],
  ['DS-11', () => { staged.costPools = fresh.costPools; }],
  ['DS-15', () => {
    const ids = new Set(staged.invoices.map(i => i.id)), added = fresh.invoices.filter(i => !ids.has(i.id));
    const newIds = new Set(added.map(i => i.id)); staged.invoices.push(...added);
    staged.receipts.push(...fresh.receipts.filter(r => newIds.has(r.invoiceId)));
  }],
  ['DS-09', () => { staged.expenses.push(fresh.expenses.find(e => e.id === 'CP-DEMO-HH-2610')); }]
];
let previous = baseline.metrics;
const attribution = {};
for (const [reason, apply] of stages) {
  apply(); TH.db = staged; const current = metrics(TH);
  for (const p of TH.PERIODS) for (const b of Object.keys(current[p])) for (const m of ['kd', 'tong']) for (const [k, v] of Object.entries(current[p][b][m])) {
    const delta = v - previous[p][b][m][k];
    if (delta) (attribution[[p, b, m, k].join('|')] ||= []).push({ scenario: reason, delta });
  }
  previous = current;
}
equal(previous, financial, 'All new financial differences explained by five input changes');
TH.db = fresh;
for (const [p, scopes] of Object.entries(financial)) for (const [b, modes] of Object.entries(scopes)) for (const [m, vals] of Object.entries(modes)) {
  for (const [k, v] of Object.entries(vals)) {
    const before = baseline.metrics[p][b][m][k];
    if (before !== v) {
      const reasons = attribution[[p, b, m, k].join('|')];
      check(reasons && Math.abs(reasons.reduce((n, r) => n + r.delta, 0) - (v - before)) < 1e-8, 'Metric delta fully attributed');
      differences.push({ period: p, buildingId: b, mode: m, metric: k, before, after: v, delta: v - before, reasons });
    }
  }
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
const previews = fresh.contracts.filter(c => c.status === 'active' && c.buildingId === 'TH-TX').map(c => TH.buildInvoice(fresh, c, '2026-10', 'draft'));
write('dataset.json', fresh);
write('formula-rules.json', TH.dataset.rules);
write('engine-results.json', { financial, performance, payroll, shares, billRows, previews, common: TH.calc.commonShare('CTC-TX-01', '2026-10'), forecasts: fresh.forecastPlans.map(p => ({ planId: p.id, ...TH.dataset.forecast(p) })) });
write('dataset-diff.json', { reasons: ['DS-03: water per person on TX-101', 'DS-05: May overpayment 100,000 VND', 'DS-11: 18-room cost pool', 'DS-15: historical invoices for ended contracts', 'DS-09: pending commission (excluded from posted expenses)'], differences });
write('structural-results.json', { passed: checks, failed: 0, baselineUnchanged: true, datasetVersion: TH.dataset.version, counts: { invoices: fresh.invoices.length, receipts: fresh.receipts.length, rooms: fresh.rooms.length, scenarios: fresh.dataset.scenarios.length, reports: fresh.reportRuns.length } });
console.log(JSON.stringify({ passed: checks, failed: 0, changedMetrics: differences.length }));
