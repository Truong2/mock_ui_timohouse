// CR-BILL — tính lẻ ngày, phòng mới, kỳ TT nhiều tháng, điện chung, giảm trừ/phụ thu (file "Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx").
// Chạy bằng Playwright browser_run_code (filename) với demo local (python -m http.server 8779 --bind 127.0.0.1). Dữ liệu seed bị thay đổi trong lúc chạy.
async (page) => {
  const results = [];
  const check = (id, ok, evidence) => { results.push({ id, pass: !!ok, evidence }); if (!ok) throw new Error(id + ': ' + JSON.stringify(evidence)); };
  const read = (fn, arg) => page.evaluate(fn, arg);
  await page.goto('http://127.0.0.1:8779/index.html?previewPackage=D&v=' + Date.now() + '#/demo/inv-01');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => window.TH && TH.db && TH.calc.newRooms);
  const reset = role => read(r => { TH.modal.stack.slice().forEach(m => TH.modal.close(m.key, { silent: true })); TH.db = TH.seed(); Object.assign(TH.store.state, { building: 'ALL', period: '2026-10', ui: {}, drafts: {}, editing: null, role: r }); TH.app.guard = null; TH.app.refresh(); }, role);
  await reset('admin');

  // QA-BILL-01 — 202G1 vào ở 20/10 → 12/30 ngày; lịch sử 202G1 kết thúc 15/07 → 15/30.
  const q1 = await read(() => {
    const C = TH.calc, ct = C.contractOfRoom('202G1');
    TH.act['inv.gen']({ dataset: {} });
    const inv = TH.db.invoices.find(i => i.roomId === '202G1' && i.period === '2026-10'), rl = inv.lines.find(l => l.type === 'rent');
    const old = TH.db.invoices.filter(i => i.period < '2026-09' && i.sourceBasis?.scenarioId !== 'DS-15').every(i => i.lines.filter(l => l.type === 'rent').every(l => l.k === 1 && l.months === 1 && l.amount === l.price));
    const history = TH.db.invoices.find(i => i.id === 'INV-2607-202G1')?.lines.find(l => l.type === 'rent');
    const historyOK = !TH.db.dataset || (history.days === 15 && history.base === 30 && history.amount === 2000000);
    const row0 = TH.billRows(inv).rows[0];
    return { status: inv.status, days: rl.days, base: rl.base, k: rl.k, amount: rl.amount, expect: Math.round(ct.rent * 12 / 30 / 1000) * 1000, fixedFull: inv.lines.filter(l => l.type === 'fixed').every(l => l.amount === l.qty * l.price), old: old && historyOK, rowK: row0.k };
  });
  check('QA-BILL-01', q1.status === 'draft' && q1.days === 12 && q1.base === 30 && q1.k === 0.4 && q1.amount === q1.expect && q1.amount === 1520000 && q1.fixedFull && q1.old && q1.rowK === 0.4, q1);

  // QA-BILL-02 — đổi quy tắc sang ngày thực của tháng: hóa đơn nháp tính lại ÷31, hóa đơn đã xác nhận giữ nguyên
  const q2 = await read(() => {
    const confirmed = JSON.stringify(TH.db.invoices.filter(i => i.status === 'confirmed').map(i => i.total));
    TH.onChange['bill.rule']({ dataset: { key: 'prorateBase' }, value: 'actual' });
    const inv = TH.db.invoices.find(i => i.roomId === '202G1' && i.period === '2026-10'), rl = inv.lines.find(l => l.type === 'rent');
    const same = JSON.stringify(TH.db.invoices.filter(i => i.status === 'confirmed').map(i => i.total)) === confirmed;
    TH.onChange['bill.rule']({ dataset: { key: 'prorateBase' }, value: 'd30' });
    return { base: rl.base, amount: rl.amount, same, back: TH.db.invoices.find(i => i.roomId === '202G1' && i.period === '2026-10').lines.find(l => l.type === 'rent').amount };
  });
  check('QA-BILL-02', q2.base === 31 && q2.amount === 1471000 && q2.same && q2.back === 1520000, q2);

  // QA-BILL-03 — phòng mới (sheet PHÒNG MỚI): 202G1 giá chốt < niêm yết, cọc 4.000.000; cần đóng gồm cọc khi quy tắc "tính cọc"
  const q3 = await read(() => {
    const x = TH.calc.newRooms('2026-10').find(r => r.room.id === '202G1');
    TH.onChange['bill.rule']({ dataset: { key: 'depositInCollect' }, value: 'no' });
    const off = TH.calc.roomBill('202G1', '2026-10');
    TH.onChange['bill.rule']({ dataset: { key: 'depositInCollect' }, value: 'yes' });
    return { kind: x.kind, list: x.listRent, rent: x.rent, dep: x.deposit, days: x.occ.days, state: x.bill.state, paid: x.bill.paid, offPaid: off.paid, offDep: off.depositIn, offAll: off.depositAll };
  });
  check('QA-BILL-03', q3.kind === 'new' && q3.list === 4000000 && q3.rent === 3800000 && q3.dep === 4000000 && q3.days === 12 && q3.state === 'deposit' && q3.paid === 4000000 && q3.offPaid === 0 && q3.offDep === 0 && q3.offAll === 4000000, q3);

  // QA-BILL-04 — kỳ TT 3 tháng: 301G1 kỳ 09 thu 3 tháng tiền phòng; kỳ 10 không có tiền phòng (đã trả đến 11/2026); P&L mỗi kỳ nhận 1 tháng
  const q4 = await read(() => {
    const C = TH.calc, i9 = C.invoice('INV-2609-301G1'), r9 = i9.lines.find(l => l.type === 'rent');
    const d10 = TH.db.invoices.find(i => i.roomId === '301G1' && i.period === '2026-10');
    const p9 = C.pnl('2026-09', 'G1', 'kd').src.rent.filter(s => s.room === '301G1').reduce((a, s) => a + s.amount, 0);
    const p10 = C.pnl('2026-10', 'G1', 'kd').src.rent.filter(s => s.room === '301G1').reduce((a, s) => a + s.amount, 0);
    const perf = C.perfBuilding('2026-09', 'G1'), bill = C.roomBill('301G1', '2026-10');
    return { qty: r9.qty, amount: r9.amount, cover: r9.cover.join(), noRent: !d10.lines.some(l => l.type === 'rent'), prepaidTo: d10.prepaidTo, p9, p10, future: perf.prepaidFuture, ky10: bill.payCycle, ky9: C.roomBill('301G1', '2026-09').payCycle, row: TH.billRows(i9).rows[0].qty };
  });
  check('QA-BILL-04', q4.qty === 3 && q4.amount === 14700000 && q4.cover === '2026-09,2026-10,2026-11' && q4.noRent && q4.prepaidTo === '2026-11' && q4.p9 === 4900000 && q4.p10 === 4900000 && q4.future === 9800000 && q4.ky10 === 0 && q4.ky9 === 3 && q4.row === 3, q4);

  // QA-BILL-05 — điện chung G1: 126 kWh × 4.000 ÷ số người; tổng phân bổ = tiền công tơ; sửa số người kỳ này → nháp tính lại; dòng 11 mẫu hóa đơn
  const q5 = await read(() => {
    const C = TH.calc, sh = C.commonShare('CTC-G1-01', '2026-10'), sum = sh.rows.reduce((a, r) => a + r.amount, 0);
    const before = TH.db.invoices.find(i => i.roomId === '101G1' && i.period === '2026-10').lines.find(l => l.type === 'common').amount;
    const ct = C.contractOfRoom('101G1');
    TH.onChange['mtr.people']({ dataset: { id: ct.id }, value: String(C.peopleAt(ct, '2026-10') + 1) });
    const inv = TH.db.invoices.find(i => i.roomId === '101G1' && i.period === '2026-10'), after = inv.lines.find(l => l.type === 'common').amount;
    const sh2 = C.commonShare('CTC-G1-01', '2026-10');
    return { kwh: sh.kwh, amount: sh.amount, sum, sum2: sh2.rows.reduce((a, r) => a + r.amount, 0), tx102: sh.rows.find(r => r.roomId === '102G1').units, before, after, row11: TH.billRows(inv).rows[11].amount, prior: TH.db.invoices.filter(i => i.period < '2026-10').some(i => i.lines.some(l => l.type === 'common')) };
  });
  check('QA-BILL-05', q5.kwh === 126 && q5.amount === 504000 && q5.sum === 504000 && q5.sum2 === 504000 && q5.tx102 === 3 && q5.after > q5.before && q5.row11 === q5.after && !q5.prior, q5);

  // QA-BILL-06 — giảm trừ/phụ thu: khoản chờ duyệt chặn xác nhận; QL tự duyệt dưới ngưỡng, từ ngưỡng phải chờ; kế toán duyệt → vào hóa đơn
  await reset('manager');
  const q6 = await read(() => {
    TH.store.setUi('INV-01', 'b', 'T17');
    const mk = (amount, kind) => { TH.act['adj.new']({ dataset: { room: '101T17' } }); TH.store.setDraft('adj', 'room', '101T17'); TH.store.setDraft('adj', 'kind', kind); TH.store.setDraft('adj', 'amount', String(amount)); TH.store.setDraft('adj', 'reason', 'QA'); TH.act['adj.save'](); return TH.db.billAdjusts[TH.db.billAdjusts.length - 1]; };
    const a1 = mk(150000, 'discount'), a2 = mk(700000, 'surcharge');
    return { s1: a1.status, s2: a2.status, p1: a1.period, by: a1.approvedBy };
  });
  await reset('accountant');
  const q6b = await read(() => {
    // Test setup uses an authorized issuer; accountant retains the existing approval role.
    TH.store.state.role = 'admin';
    TH.act['inv.gen']({ dataset: {} });
    TH.store.state.role = 'accountant';
    const d = () => TH.db.invoices.find(i => i.roomId === '301G1' && i.period === '2026-10');
    const before = d(), blocked = before.lines.some(l => l.type === 'adjust' && l.draft), t0 = before.total;
    TH.act['adj.ok']({ dataset: { id: 'TK-2610-03' } });
    const after = d(), line = after.lines.find(l => l.refId === 'TK-2610-03');
    const disc = TH.db.invoices.find(i => i.roomId === '101G1' && i.period === '2026-10').lines.find(l => l.refId === 'TK-2610-01');
    return { blocked, approved: TH.db.billAdjusts.find(a => a.id === 'TK-2610-03').status, draftLine: line.draft, t0, t1: after.total, disc: disc.amount, row9: TH.billRows(after).rows[9].note.some(n => /Phạt vi phạm/.test(n)) };
  });
  check('QA-BILL-06', q6.s1 === 'approved' && q6.s2 === 'pending' && q6.p1 === '2026-11' && q6.by === 'NV-003' && q6b.blocked && q6b.approved === 'approved' && q6b.draftLine === false && q6b.t1 === q6b.t0 && q6b.disc === -120000 && q6b.row9, { q6, q6b });

  // QA-BILL-07 — UI: INV-01 có thẻ quy tắc + giảm trừ, cột Lẻ kỳ; PAY-02 tab Phòng mới; METER-01 G1 có công tơ chung; 375px không tràn ngang
  await reset('admin');
  await read(() => { TH.store.setUi('INV-01', 'b', 'G1'); TH.act['inv.gen']({ dataset: {} }); location.hash = '#/demo/inv-01'; TH.app.refresh(); });
  await page.waitForSelector('#rule-prorateBase');
  const ui1 = await read(() => ({ rules: !!document.querySelector('#rule-prorateBase'), adj: !!document.querySelector('table[aria-label="Giảm trừ và phụ thu"]'), lek: document.body.innerText.includes('12/30 ngày'), prepaid: document.body.innerText.includes('Đã trả trước đến 11/2026') }));
  await page.setViewportSize({ width: 375, height: 800 }); await page.waitForTimeout(250);
  const o1 = await read(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.setViewportSize({ width: 1440, height: 900 });
  await read(() => { TH.store.setUi('PAY-02', 'tab', 'new'); location.hash = '#/demo/pay-02'; });
  await page.waitForSelector('table[aria-label="Danh sách phòng mới trong kỳ"]');
  const ui2 = await read(() => ({ rows: document.querySelectorAll('table[aria-label="Danh sách phòng mới trong kỳ"] tbody tr').length, tx202: document.querySelector('table[aria-label="Danh sách phòng mới trong kỳ"]').innerText.includes('202G1') }));
  await page.setViewportSize({ width: 375, height: 800 }); await page.waitForTimeout(250);
  const o2 = await read(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.setViewportSize({ width: 1440, height: 900 });
  await read(() => { TH.store.setUi('METER-01', 'b', 'G1'); location.hash = '#/demo/meter-01'; });
  await page.waitForSelector('table[aria-label^="Phân bổ điện chung"]');
  const ui3 = await read(() => ({ rows: document.querySelectorAll('table[aria-label^="Phân bổ điện chung"] tbody tr').length, input: !!document.querySelector('[data-act-change="mtr.common"]') }));
  check('QA-BILL-07', ui1.rules && ui1.adj && ui1.lek && ui1.prepaid && o1 <= 0 && ui2.rows === 1 && ui2.tx202 && o2 <= 0 && ui3.rows === 5 && ui3.input, { ui1, o1, ui2, o2, ui3 });

  const smoke = await read(() => { TH.db = TH.seed(); Object.assign(TH.store.state, { building: 'ALL', ui: {}, drafts: {}, editing: null, role: 'admin' }); const r = TH.qaSmoke(); TH.store.flush(); TH.app.refresh(); return { total: r.total, fails: r.fails.length }; });
  check('SMOKE', smoke.total >= 1048 && smoke.fails === 0, smoke);
  return { passed: results.length, results };
}
