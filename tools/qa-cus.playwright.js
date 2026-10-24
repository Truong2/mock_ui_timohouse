// Run this function with the Playwright browser_run_code tool against the local demo.
async (page) => {
  const results = [];
  const check = (id, ok, evidence) => {
    results.push({ id, pass: !!ok, evidence });
    if (!ok) throw new Error(id + ': ' + JSON.stringify(evidence));
  };
  const read = fn => page.evaluate(fn);
  const go = async (screen, param, tab) => {
    await page.evaluate(({ screen, param, tab }) => {
      if (tab) TH.store.setUi(screen, 'tab', tab);
      TH.go(screen, param);
      TH.app.refresh();
    }, { screen, param, tab });
    await page.waitForFunction(s => TH.app.route.page === s, screen);
  };
  const click = act => page.locator('[data-act="' + act + '"]').click();
  const role = async value => {
    await click('role.menu');
    await page.locator('[data-act="role.set"][data-val="' + value + '"]').click();
  };
  await page.goto('http://127.0.0.1:8779/index.html?previewPackage=D#/demo/cus-01');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    TH.store.flush();
    const saved = JSON.parse(localStorage.getItem('timehouse.demo.v1'));
    saved.schema = 8;
    saved.db.customers[0].name = 'SCHEMA-8-STALE';
    localStorage.setItem('timehouse.demo.v1', JSON.stringify(saved));
  });
  await page.reload();
  const upgraded = await read(() => ({ schema: TH.DATA_SCHEMA, name: TH.db.customers[0].name, contracts: TH.db.contracts.length }));
  check('SCHEMA-UPGRADE', upgraded.schema >= 9 && upgraded.name !== 'SCHEMA-8-STALE' && upgraded.contracts === 20, upgraded);
  await page.evaluate(() => {
    TH.modal.stack.slice().reverse().forEach(m => TH.modal.close(m.key, { silent: true }));
    TH.db = TH.seed();
    Object.assign(TH.store.state, { role: 'admin', building: 'ALL', period: '2026-10', ui: {}, drafts: {}, editing: null });
    TH.app.refresh();
  });
  const initial = await read(() => ({
    schema: TH.DATA_SCHEMA,
    datasetVersion: TH.db.dataset && TH.db.dataset.version,
    kd09: TH.calc.pnl('2026-09', 'ALL', 'kd').lnr,
    total09: TH.calc.pnl('2026-09', 'ALL', 'tong').lnr,
    kd10: TH.calc.pnl('2026-10', 'ALL', 'kd').lnr,
    total10: TH.calc.pnl('2026-10', 'ALL', 'tong').lnr,
    invoice: TH.calc.invoice('INV-2610-CG202').total,
    hs: TH.calc.perfBuilding('2026-09', 'TH-CG').hs,
  }));
  // New totals independently verified in docs/qa/dataset/decimal-results.json.
  const expected = initial.datasetVersion === 'excel-demo-v1' ? [23643400, 14243400, 11430000, 54930000] : [16682599, 7282599, 9655000, 53155000];
  check('REGRESSION', initial.schema >= 9 && initial.kd09 === expected[0] && initial.total09 === expected[1] && initial.kd10 === expected[2] && initial.total10 === expected[3] && initial.invoice === 6069800 && Math.round(initial.hs * 1000) === 723, initial);
  const heads = await read(() => ({ head: TH.calc.areaHead('TH-CG'), lead: TH.calc.teamLead('TH-CG'), tx: TH.calc.areaHead('TH-TX') }));
  check('QA-CUS-01', heads.head && heads.head !== heads.lead && !heads.tx, heads);
  const states = await read(() => TH.calc.tenancyStates(TH.calc.contract('HĐ-DD102/25')));
  check('QA-CUS-02', states.main.id === 'renting' && states.tags.some(t => t.id === 'expiring') && states.tags.some(t => /bàn giao/.test(t.label)), states.tags.map(t => t.label));

  await go('CUS-02', 'HĐ-DD302/25', 'fin');
  await click('dep.review');
  await page.getByLabel('Thấm trần — chờ xác định lỗi bên nào', { exact: true }).fill('500000');
  await click('dep.submit');
  const pending = await read(() => ({ state: TH.db.depositCases.find(c => c.id === 'HC-2610-01').state, ledger: TH.db.deposits.filter(d => d.caseId === 'HC-2610-01').length }));
  check('QA-CUS-03-pending', pending.state === 'pending_approval' && pending.ledger === 0 && await page.locator('[data-act="dep.approve"]').count() === 0, pending);
  await role('accountant');
  await click('dep.approve');
  const approved = await read(() => ({ state: TH.db.depositCases.find(c => c.id === 'HC-2610-01').state, ledger: TH.db.deposits.filter(d => d.caseId === 'HC-2610-01').length }));
  check('QA-CUS-03-approved', approved.state === 'approved' && approved.ledger === 0, approved);
  await click('dep.pay');
  const txn = await page.getByLabel('Mã giao dịch / chứng từ chi').inputValue();
  check('DEFAULT-TXN', /^CK-20261020-\d+$/.test(txn), txn);
  await click('dep.paid');
  const paid = await read(() => {
    TH.act['dep.paid']({ dataset: { id: 'HC-2610-01' } });
    const hc = TH.db.depositCases.find(c => c.id === 'HC-2610-01');
    return { state: hc.state, refund: hc.refundAmount, paidBy: hc.paidBy, rows: TH.db.deposits.filter(d => d.caseId === hc.id).length, kd: TH.calc.pnl('2026-10', 'ALL', 'kd').lnr, total: TH.calc.pnl('2026-10', 'ALL', 'tong').lnr };
  });
  check('QA-CUS-04/17', paid.state === 'refunded' && paid.refund === 3990000 && paid.paidBy === 'NV-002' && paid.rows === 1 && paid.kd === initial.kd10 && paid.total === initial.total10 - 3990000, paid);

  await role('admin');
  await go('CUS-02', 'HĐ-TX202/25', 'fin');
  const early = await read(() => {
    const ct = TH.calc.contract('HĐ-TX202/25');
    const hc = TH.calc.depositCase(ct.id);
    return { labels: TH.calc.tenancyStates(ct).tags.map(t => t.label), basis: hc.forfeitBasis, approver: hc.approvedBy };
  });
  check('QA-CUS-05-seed', early.labels.includes('Phá HĐ') && early.labels.includes('Mất cọc') && early.basis && early.approver, early);
  // Independent hypothetical agreement: partial forfeiture must leave a refundable balance.
  await page.evaluate(() => {
    const hc = TH.db.depositCases.find(c => c.contractId === 'HĐ-TX202/25');
    Object.assign(hc, { state: 'reconciling', forfeitAmount: 0, forfeitBasis: '', refundAmount: null, depositId: null, forfeitId: null });
    TH.app.refresh();
  });
  await click('dep.review');
  await page.getByLabel('Cọc bị giữ — mất cọc (đ)', { exact: true }).fill('1000000');
  await page.getByLabel('Căn cứ giữ cọc (điều khoản / quyết định)', { exact: true }).fill('Biên bản thỏa thuận hoàn một phần — QA demo');
  await click('dep.submit');
  await role('accountant');
  await click('dep.approve');
  check('QA-CUS-05-partial', await read(() => TH.db.depositCases.find(c => c.contractId === 'HĐ-TX202/25').refundAmount) === 3000000, 'Giữ 1.000.000; duyệt hoàn 3.000.000 / cọc 4.000.000');

  await role('admin');
  await go('CUS-02', 'HĐ-DD102/25', 'contract');
  const oldInvoice = await read(() => JSON.stringify(TH.db.invoices));
  // CR-CUS-02: đọc dòng phí qua OCR hợp đồng mẫu đầy đủ (cus.ctOcr thay cho cus.priceOcr)
  await click('cus.ctOcr');
  await click('ocr.all');
  await click('ctocr.confirm');
  const pricing = await read(() => {
    const ct = TH.calc.contract('HĐ-DD102/25');
    const invoice = buildInvoice(TH.db, ct, '2026-11', 'draft');
    return { water: invoice.lines.find(l => l.type === 'water'), sm: ct.priceList.find(l => l.code === 'PARK_EV'), charge: ct.priceList.find(l => l.code === 'EVCHG'), methods: ct.priceList.map(l => l.from), unchanged: JSON.stringify(TH.db.invoices) };
  });
  check('QA-CUS-06/08/09', pricing.water.qty === 2 && pricing.water.price === 120000 && pricing.sm.price === 400000 && pricing.charge.code !== pricing.sm.code && pricing.methods.every(p => p === '2026-11') && pricing.unchanged === oldInvoice, { water: pricing.water, sm: pricing.sm.price, charging: pricing.charge.method, effective: pricing.methods[0], oldInvoicesUnchanged: pricing.unchanged === oldInvoice });
  const vehicles = await read(() => {
    const ct = TH.calc.contract('HĐ-CG101/25');
    return { moto: ct.priceList.find(l => l.code === 'PARK_MOTO'), pending: TH.vehiclesOf(ct, 'Xe điện (dịch vụ SM)', 'pending').length, smQty: TH.priceQty(ct, { code: 'PARK_EV', method: 'per_vehicle', qtySource: 'vehicles' }) };
  });
  check('QA-CUS-07', vehicles.moto.price === 0 && vehicles.moto.active && vehicles.smQty === 0, vehicles);

  await go('CUS-02', 'HĐ-CG101/25', 'stay');
  const pendingVehicle = await read(() => TH.calc.customer('KH-001').vehicles.find(v => v.status === 'pending').id);
  await page.locator('[data-act="veh.confirm"][data-id="' + pendingVehicle + '"]').click();
  check('VEHICLE-CONFIRM', await read(() => TH.calc.customer('KH-001').vehicles.filter(v => v.status === 'pending').length) === 0, pendingVehicle);
  await click('veh.add');
  await page.getByLabel('Biển số (để trống nếu không có)', { exact: true }).fill(await read(() => TH.db.customers.filter(k => k.id !== 'KH-001').flatMap(k => k.vehicles).find(v => v.plate && v.status === 'active' && !v.to).plate));
  await click('veh.save');
  await page.locator('[data-act="veh.confirm"]').click();
  check('VEHICLE-DUPLICATE', await read(() => TH.calc.customer('KH-001').vehicles.slice(-1)[0].status) === 'pending', 'Biển số đang hoạt động ở hồ sơ khác bị chặn xác nhận');

  const terms = await read(() => {
    // CR-CUS-02: bỏ mẫu P302 — mọi HĐ theo mẫu đầy đủ (DAYDU): gia hạn mặc nhiên, hoàn cọc trong 10 ngày
    const p302 = TH.calc.contract('HĐ-DD102/25'), amendment = TH.calc.contract('HĐ-CG102/25'), current = TH.calc.contract('HĐ-CG201/25');
    return { p302: p302.terms, amendment: amendment.renewals[0], previous: current.previousContractId, transfer: TH.calc.depositCase('HĐ-CG201/24').state, count: TH.calc.customerContracts('KH-003').length, notice: TH.calc.contract('HĐ-CG101/25').terms.noticeDays, alert: TH.expiryDays() };
  });
  check('QA-CUS-10/11/12/13/14', terms.p302.template === 'DAYDU' && terms.p302.autoRenew && terms.p302.refundDays === 10 && terms.amendment.mode === 'amendment' && terms.amendment.file && terms.previous === 'HĐ-CG201/24' && terms.transfer === 'transferred' && terms.count === 2 && terms.notice === 30 && terms.alert === 35, terms);
  const historical = await read(() => {
    const k = TH.calc.customer('KH-018');
    const old = k.vehicles.find(v => v.plate);
    return { duplicate: !!TH.calc.plateDup(k, old), nullable: TH.calc.customer('KH-003').vehicles.some(v => !v.plate), masked: TH.maskPlate(old.plate) !== old.plate };
  });
  check('VEHICLE-HISTORY/MASK', !historical.duplicate && historical.nullable && historical.masked, historical);
  await go('CUS-01');
  await page.locator('#q-CUS-01').fill('KH-003');
  await page.waitForFunction(() => document.querySelectorAll('tr[data-href]').length === 2);
  check('TENANCY-ROWS', await page.locator('tr[data-href]').count() === 2, 'KH-003 có hai dòng HĐ');
  await go('CUS-02', 'KH-003', 'stay');
  const beforeHistory = await read(() => TH.db.customerHistory.length);
  await page.locator('[data-act="sec.edit"][data-key="cusInfo"]').click();
  await page.getByLabel('Nghề nghiệp', { exact: true }).fill('QA nghề nghiệp');
  await click('sec.save');
  check('QA-CUS-16-occupation', await read(() => TH.db.customerHistory.length) === beforeHistory, 'Không ghi lịch sử liên hệ khi sửa nghề');
  await page.locator('[data-act="sec.edit"][data-key="cusInfo"]').click();
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0901234567');
  await click('sec.save');
  check('QA-CUS-16-contact', await read(() => TH.db.customerHistory.length) === beforeHistory + 1, 'Sửa SĐT thêm đúng một lịch sử liên hệ; audit chung được ghi khi lưu');

  await go('SYS-01', null, 'ops');
  const count35 = await read(() => TH.calc.expiring(TH.expiryDays(), 'ALL').length);
  await page.locator('#sys-expiry').fill('45');
  await click('settings.expiry');
  const count45 = await read(() => TH.calc.expiring(TH.expiryDays(), 'ALL').length);
  check('K-06', count45 > count35, { count35, count45 });
  await page.locator('#sys-expiry').fill('35');
  await click('settings.expiry');
  await role('manager');
  await go('CUS-02', 'HĐ-CG101/25', 'fin');
  await click('dep.open');
  check('MANAGER-PERMISSIONS', await page.locator('[data-act="dep.handover"]').count() === 1 && await page.locator('[data-act="dep.approve"],[data-act="dep.pay"]').count() === 0, 'QL tòa mở hồ sơ được; không có thao tác duyệt/thực chi');
  await go('CUS-02', 'HĐ-DD302/25', 'fin');
  check('MANAGER-SCOPE', await page.locator('body').innerText().then(t => /ngoài phạm vi/.test(t)), 'DD-302 nằm ngoài phạm vi Cầu Giấy');
  await role('admin');

  const smoke = await read(() => { TH.db = TH.seed(); Object.assign(TH.store.state, { building: 'ALL', ui: {}, drafts: {}, editing: null }); const r = TH.qaSmoke(); TH.store.flush(); TH.app.refresh(); return { total: r.total, fails: r.fails, counts: TH.qaCounts() }; });
  check('SMOKE', smoke.total >= 1048 && smoke.fails.length === 0, smoke);
  return { passed: results.length, results };
}
