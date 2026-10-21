// CR-PAY — thu tiền theo file "Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx". Chạy bằng Playwright browser_run_code (filename)
// với demo local (python -m http.server 8779 --bind 127.0.0.1). Dữ liệu seed bị thay đổi trong lúc chạy.
async (page) => {
  const results = [];
  const check = (id, ok, evidence) => { results.push({ id, pass: !!ok, evidence }); if (!ok) throw new Error(id + ': ' + JSON.stringify(evidence)); };
  const read = (fn, arg) => page.evaluate(fn, arg);
  await page.goto('http://127.0.0.1:8779/index.html?previewPackage=D&v=' + Date.now() + '#/demo/pay-02');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => window.TH && TH.db && TH.calc.collectBuilding);
  const reset = role => read(r => { TH.modal.stack.slice().forEach(m => TH.modal.close(m.key, { silent: true })); TH.db = TH.seed(); Object.assign(TH.store.state, { building: 'ALL', period: '2026-10', ui: {}, drafts: {}, editing: null, role: r }); TH.app.guard = null; TH.app.refresh(); }, role);
  await reset('admin');

  // QA-PAY-01 — theo tòa: phải thu/thu được = Σ bảng check phòng; mốc 1/2/3 đúng công thức; phải thu sau phá HĐ
  const q1 = await read(() => {
    const C = TH.calc, p = '2026-10';
    return ['TH-CG', 'TH-DD', 'TH-TX'].map(id => {
      const r = C.collectBuilding(p, id), bills = C.roomBills(p, id);
      return { id, due: r.due, sumDue: bills.reduce((s, x) => s + x.due, 0), paid: r.paid, sumPaid: bills.reduce((s, x) => s + x.paid, 0),
        m1: r.m1 === r.cum5, m2: Math.abs(r.m2 - (r.cum10 - r.cum5) * 0.9) < 1, m3: Math.abs(r.m3 - (r.cum15 - r.cum10) * 0.7) < 1,
        after: r.afterBreak === r.due - r.paid - (r.brokenDue - r.brokenPaid), bd: r.brokenDue, bp: r.brokenPaid };
    });
  });
  check('QA-PAY-01', q1.every(x => x.due === x.sumDue && x.paid === x.sumPaid && x.m1 && x.m2 && x.m3 && x.after) && q1[1].bd === 5723400 && q1[1].bp === 3000000, q1);

  // QA-PAY-02 — theo QL: tổng hệ thống = Σ tòa
  const q2 = await read(() => {
    const C = TH.calc, p = '2026-10', ids = ['TH-CG', 'TH-DD', 'TH-TX'];
    const mg = C.collectManagers(p, ids), sys = C.collectOf([].concat(...ids.map(id => C.roomBills(p, id))), p);
    return { n: mg.length, due: mg.reduce((s, x) => s + x.due, 0), sysDue: sys.due, paid: mg.reduce((s, x) => s + x.paid, 0), sysPaid: sys.paid, after: sys.afterBreak };
  });
  check('QA-PAY-02', q2.n === 3 && q2.due === q2.sysDue && q2.paid === q2.sysPaid, q2);

  // QA-PAY-03 — tình trạng theo công thức Excel; nợ cũ CG-302 (thiếu kỳ 09); TX-202 giữ chỗ = Đóng cọc; TX kỳ 10 chưa lập HĐ
  const q3 = await read(() => { const C = TH.calc, b = id => C.roomBill(id, '2026-10'); return { cg101: b('CG-101').state, cg302: [b('CG-302').state, b('CG-302').oldDebt > 0, b('CG-302').due === b('CG-302').invTotal + b('CG-302').oldDebt], dd201: b('DD-201').state, tx202: b('TX-202').state, tx101: b('TX-101').state, cg401: b('CG-401').state }; });
  check('QA-PAY-03', q3.cg101 === 'full' && q3.cg302[0] === 'unpaid' && q3.cg302[1] && q3.cg302[2] && q3.dd201 === 'short' && q3.tx202 === 'deposit' && q3.tx101 === 'nobill' && q3.cg401 === 'empty', q3);

  // QA-PAY-04 — DS phòng phá HĐ: phải thu = tiền điện kỳ, đã thu = đã đóng, SĐT che; hồ sơ cọc chờ duyệt, không ghi mất cọc
  const q4 = await read(() => { const x = TH.calc.breakList('2026-10')[0], inv = TH.calc.invoice('INV-2610-DD201'); return { room: x.bc.roomId, chase: x.chase, elec: inv.lines.find(l => l.type === 'elec').amount, paid: x.paid, masked: /•/.test(x.phone), dep: x.deposit.state, ledger: TH.db.deposits.filter(d => d.roomId === 'DD-201').length, months: x.months }; });
  check('QA-PAY-04', q4.room === 'DD-201' && q4.chase === q4.elec && q4.paid === 3000000 && q4.masked && q4.dep === 'pending_approval' && q4.ledger === 0 && q4.months === 8, q4);

  // QA-PAY-05 — điện nước phòng trống/không thu được: phòng trống, đang sửa có tiêu thụ (TX-202 có khách mới 20/10 nên không còn PT); DD-201 đã đóng đủ phần điện nước nên không vào danh sách
  const q5 = await read(() => TH.calc.utilityLoss('2026-10').map(x => x.room.id + ':' + x.note + ':' + (x.lost === x.elec.amount + x.water.amount)));
  check('QA-PAY-05', q5.join() === 'CG-401:PT:true,DD-302:Đang sửa:true', q5);

  // QA-PAY-06 — QL tòa ghi nhận thu = xác nhận ngay; vượt nợ phân bổ FIFO, phần dư = Thừa
  await reset('manager');
  const q6 = await read(() => {
    const C = TH.calc, i9 = C.invoice('INV-2609-CG302'), i10 = C.invoice('INV-2610-CG302'), amt = C.debt(i9) + C.debt(i10) + 100000;
    TH.act['pay.reportFor']({ tagName: 'BUTTON', dataset: { id: i9.id } });
    TH.store.setDraft('pay-rep', 'amount', String(amt)); TH.store.setDraft('pay-rep', 'date', '2026-10-20');
    TH.act['pay.reportSave']();
    const b = C.roomBill('CG-302', '2026-10'), mine = TH.db.receipts.filter(r => r.reportedAt === TH.TODAY && r.reportedBy === 'NV-003');
    return { state: b.state, bal: b.balance, d9: C.debt(i9), bal10: C.balance(i10), n: mine.length, allConfirmed: mine.every(r => r.status === 'confirmed' && r.confirmedBy === 'NV-003') };
  });
  check('QA-PAY-06', q6.state === 'over' && q6.bal === 100000 && q6.d9 === 0 && q6.bal10 === 100000 && q6.n === 2 && q6.allConfirmed, q6);

  // QA-PAY-07 — QL xác nhận báo thu chờ (CG-202); ngoài tòa phụ trách không xác nhận được
  const rid = await read(() => { const r = TH.db.receipts.find(x => x.status === 'pending' && TH.calc.invoice(x.invoiceId).roomId === 'CG-202'); location.hash = TH.router.href('PAY-APP', r.id); return r.id; });
  await page.waitForSelector('[data-act="app.ok"]');
  await page.locator('[data-act="app.ok"]').click(); await page.waitForTimeout(200);
  const q7 = await read(id => { const r = TH.db.receipts.find(x => x.id === id); return { ok: true, status: r.status, by: r.confirmedBy, ddInScope: TH.inScope('TH-DD') }; }, rid);
  check('QA-PAY-07', q7.ok && q7.status === 'confirmed' && q7.by === 'NV-003' && !q7.ddInScope, q7);

  // QA-PAY-08 — kế toán: không xác nhận thu, chỉ hậu kiểm (không đổi công nợ)
  await reset('accountant');
  await read(() => { location.hash = TH.router.href('PAY-APP', TH.db.receipts.find(x => x.status === 'pending').id); });
  await page.waitForSelector('[role=dialog] .forbidden-chip');
  const noConfirm = await read(() => !document.querySelector('[data-act="app.ok"]'));
  const q8 = await read(noConfirm => {
    TH.modal.stack.slice().forEach(m => TH.modal.close(m.key, { silent: true }));
    const r = TH.db.receipts.find(x => x.status === 'confirmed' && TH.calc.invoice(x.invoiceId).period === '2026-10'), inv = TH.calc.invoice(r.invoiceId), before = TH.calc.debt(inv);
    TH.store.setDraft('app-' + r.id, 'astmt', 'FT26290001'); TH.act['app.audit']({ dataset: { id: r.id, v: 'ok' } });
    const r2 = TH.db.receipts.find(x => x.status === 'confirmed' && x !== r && !x.audit);
    TH.act['app.audit']({ dataset: { id: r2.id, v: 'bad' } });
    return { noConfirm, audit: r.audit.state, stmt: r.audit.stmt, debtSame: TH.calc.debt(inv) === before, badBlocked: !r2.audit };
  }, noConfirm);
  check('QA-PAY-08', q8.noConfirm && q8.audit === 'ok' && q8.stmt === 'FT26290001' && q8.debtSame && q8.badBlocked, q8);

  // QA-PAY-09 — ghi nhận phá HĐ CG-302 (chưa thu): HĐ kết thúc, phòng trống, vào DS phá HĐ + điện nước không thu được, CUS-01 lọc Phá HĐ
  await reset('manager');
  const q9 = await read(() => {
    const C = TH.calc, ct = C.contractOfRoom('CG-302');
    TH.act['pay.break']({ dataset: { id: ct.id } }); TH.store.setDraft('pay-break', 'at', '2026-10-20'); TH.store.setDraft('pay-break', 'reason', 'runaway');
    TH.act['pay.breakSave']({ dataset: { id: ct.id } });
    const loss = C.utilityLoss('2026-10').find(x => x.room.id === 'CG-302');
    return { ct: ct.status, room: C.room('CG-302').status, list: C.breakList('2026-10').map(x => x.bc.roomId), loss: loss && loss.note, dep: C.depositCase(ct.id).state, tag: C.tenancyStates(ct).tags.some(t => t.id === 'broken'), cnt: TH.calc.pnl('2026-10', 'TH-CG', 'tong').cntBroke };
  });
  check('QA-PAY-09', q9.ct === 'terminated' && q9.room === 'vacant' && q9.list.includes('CG-302') && q9.loss === 'Phá HĐ' && q9.dep === 'pending_approval' && q9.tag && q9.cnt === 1, q9);

  // QA-PAY-10 — mẫu hóa đơn: 12 dòng, Mã KH, nội dung CK, tài khoản nhóm nhà; tổng = cần đóng; phiếu hoàn cọc = cọc − khoản
  await reset('admin');
  const q10 = await read(() => {
    const inv = TH.calc.invoice('INV-2610-CG302'), x = TH.billRows(inv), html = TH.invoiceDoc(inv);
    const hc = TH.db.depositCases.find(c => c.id === 'HC-2609-01'), rd = TH.refundDoc(hc);
    return { rows: x.rows.length, total: x.total, due: TH.calc.roomBill('CG-302', '2026-10').due, code: html.includes('CG302A001'), ck: html.includes('CG-302</b>'), acc: html.includes('VPBank •••1201'), refund: rd.includes('6.200.000') && rd.includes('Sửa chữa') };
  });
  check('QA-PAY-10', q10.rows === 12 && q10.total === q10.due && q10.code && q10.ck && q10.acc && q10.refund, q10);

  // QA-PAY-11 — UI: 7 tab PAY-02 (CR-BILL thêm Phòng mới), bảng theo tòa có cột mốc; 375px không tràn ngang trang
  await read(() => { TH.store.setUi('PAY-02', 'tab', 'bld'); location.hash = '#/demo/pay-02'; });
  await page.waitForSelector('table[aria-label="Cập nhật thu tiền theo tòa nhà"]');
  const q11 = await read(() => { return { tabs: document.querySelectorAll('.tabs .tab').length, cols: Array.from(document.querySelectorAll('table[aria-label="Cập nhật thu tiền theo tòa nhà"] thead th')).map(t => t.textContent.trim()) }; });
  await page.setViewportSize({ width: 375, height: 800 }); await page.waitForTimeout(250);
  const over = await read(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.setViewportSize({ width: 1440, height: 900 });
  check('QA-PAY-11', q11.tabs === 7 && q11.cols.includes('DT mốc 2 · 90%') && q11.cols.includes('Lũy kế M15') && over <= 0, { q11, over });

  const smoke = await read(() => { TH.db = TH.seed(); Object.assign(TH.store.state, { building: 'ALL', ui: {}, drafts: {}, editing: null, role: 'admin' }); const r = TH.qaSmoke(); TH.store.flush(); TH.app.refresh(); return { total: r.total, fails: r.fails.length }; });
  check('SMOKE', smoke.total >= 1048 && smoke.fails === 0, smoke);
  return { passed: results.length, results };
}
