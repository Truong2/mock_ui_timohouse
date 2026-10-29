// Run through Playwright browser_run_code_unsafe with filename, or the existing QA runner.
async (host) => {
  const context = await host.context().browser().newContext();
  const page = await context.newPage(), checks = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  function check(name, value) { checks.push({ name, pass: !!value }); if (!value) throw Error(name); }
  try {
    await page.goto('http://127.0.0.1:8779/index.html?previewPackage=A#/demo/own-01');
    await page.waitForFunction(() => window.TH && TH.recordActions && TH.db.recordTrash);
    const domain = await page.evaluate(() => {
      const results = [], R = TH.recordActions, C = TH.calc;
      const assert = (name, value) => { results.push({ name, pass: !!value }); if (!value) throw Error(name); };
      const reset = (pkg = 'A') => { TH.db = TH.seed(); Object.assign(TH.store.state, { role: 'admin', pkg, period: '2026-10', building: 'ALL', ui: {}, drafts: {} }); R.init(); };
      reset();
      TH.db.owners.push({ id: 'CN-CRUD', name: 'Chủ nhà kiểm thử', phone: '0900000000', status: 'active' });
      assert('edit owner', R.execute('owner', 'CN-CRUD', 'edit', { values: { name: 'Tên đã sửa' } }).ok);
      assert('delete requires reason', !R.execute('owner', 'CN-CRUD', 'delete').ok);
      assert('soft delete owner', R.execute('owner', 'CN-CRUD', 'delete', { reason: 'Tạo trùng' }).ok && !C.owner('CN-CRUD'));
      assert('trash preserves data', R.trash('owner', 'CN-CRUD').record.name === 'Tên đã sửa');
      assert('restore owner', R.execute('owner', 'CN-CRUD', 'restore').ok && C.owner('CN-CRUD').name === 'Tên đã sửa');
      assert('linked owner blocked', !R.execute('owner', 'CN-001', 'delete', { reason: 'Sai' }).ok);
      assert('linked building blocked', !R.execute('building', 'T17', 'delete', { reason: 'Sai' }).ok);
      assert('self admin lock blocked', !R.execute('user', 'U-01', 'archive', { reason: 'Sai' }).ok);
      assert('self admin demotion blocked', !R.execute('user', 'U-01', 'edit', { values: { role: 'manager' } }).ok);
      TH.store.state.role = 'manager';
      assert('scope blocks direct handler', !R.execute('room', '101S9', 'edit', { values: { floor: 5 } }).ok);
      TH.store.state.role = 'hr';
      assert('role blocks direct financial edit', !R.execute('expense', TH.db.expenses[0].id, 'edit', { values: { amount: 1 } }).ok);
      for (const pkg of ['A', 'B', 'C', 'D']) {
        reset(pkg);
        const exp = TH.db.expenses.find(x => x.period === '2026-09' && x.category === 'repair' && x.status === 'approved');
        const oldSource = JSON.stringify(exp), past = JSON.stringify(C.pnl('2026-09', exp.buildingId, 'kd')), oldCurrent = C.pnl('2026-10', exp.buildingId, 'kd').lnr;
        assert(pkg + ' locked edit blocked', !R.execute('expense', exp.id, 'edit', { values: { amount: 1 } }).ok);
        const correction = R.execute('expense', exp.id, 'correct', { targetPeriod: '2026-10', amount: exp.amount - 100000, reason: 'Sửa chứng từ', mode: 'recording' });
        assert(pkg + ' correction allowed', correction.ok);
        assert(pkg + ' no money before approval', C.pnl('2026-10', exp.buildingId, 'kd').lnr === oldCurrent);
        assert(pkg + ' self approval blocked', !R.execute('correction', correction.record.id, 'approve').ok);
        TH.store.state.role = 'accountant';
        assert(pkg + ' independent approval', R.execute('correction', correction.record.id, 'approve').ok);
        assert(pkg + ' old source unchanged', JSON.stringify(exp) === oldSource);
        assert(pkg + ' locked pnl unchanged', JSON.stringify(C.pnl('2026-09', exp.buildingId, 'kd')) === past);
        assert(pkg + ' current pnl reconciles', C.pnl('2026-10', exp.buildingId, 'kd').lnr === oldCurrent + 100000);
        assert(pkg + ' double approval blocked', !R.execute('correction', correction.record.id, 'approve').ok);
      }
      reset();
      const receipt = TH.db.receipts.find(x => C.invoice(x.invoiceId).period === '2026-09' && x.status === 'confirmed');
      const invoice = C.invoice(receipt.invoiceId), pastSummary = JSON.stringify(C.summary('2026-09', invoice.buildingId)), paid = C.paid(invoice.id);
      const cr = R.execute('receipt', receipt.id, 'correct', { targetPeriod: '2026-10', amount: receipt.amount - 100000, reason: 'Ghi dư', mode: 'recording' });
      assert('receipt correction created', cr.ok); TH.store.state.role = 'accountant';
      assert('receipt correction approved', R.execute('correction', cr.record.id, 'approve').ok);
      assert('receipt updates balance once', C.paid(invoice.id) === paid - 100000);
      assert('receipt correction keeps old period', JSON.stringify(C.summary('2026-09', invoice.buildingId)) === pastSummary);
      reset();
      const inv = TH.db.invoices.find(x => x.period === '2026-09' && x.status === 'confirmed'), invBefore = JSON.stringify(inv), debtBefore = C.balance(inv);
      const ci = R.execute('invoice', inv.id, 'correct', { targetPeriod: '2026-10', amount: inv.total - 50000, lineIndex: 0, reason: 'Giảm tiền phòng' });
      assert('invoice correction created', ci.ok); TH.store.state.role = 'accountant';
      assert('invoice correction approved', R.execute('correction', ci.record.id, 'approve').ok);
      assert('invoice source immutable', JSON.stringify(inv) === invBefore);
      assert('invoice correction balances', C.balance(inv) === debtBefore + 50000);
      assert('invoice correction reaches room collection', C.roomBill(inv.roomId, '2026-10').invTotal === C.sum(TH.db.invoices.filter(i => i.roomId === inv.roomId && i.period === '2026-10' && i.status === 'confirmed'), i => i.total));
      reset();
      const e = TH.db.expenses.find(x => x.status === 'draft' && x.period === '2026-10');
      if (e) { assert('draft expense edit', R.execute('expense', e.id, 'edit', { values: { description: 'Chi phí đã sửa' } }).ok); assert('draft expense delete', R.execute('expense', e.id, 'delete', { reason: 'Nhập nhầm' }).ok); }
      assert('legacy import blocked', !R.rollbackImport(TH.db.importBatches[0].id).ok);
      reset();
      return results;
    });
    checks.push(...domain);
    // Actual UI save and persistence, not just domain functions.
    await page.evaluate(() => TH.app.refresh());
    await page.locator('[data-act="rec.open"][data-type="owner"][data-id="CN-001"][data-action="edit"]').first().click();
    const modal = page.locator('.overlay').last();
    await modal.getByLabel(/Họ tên \/ tên pháp nhân/).fill('Nguyễn Văn An — kiểm thử');
    await modal.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await page.reload();
    check('UI edit persists after reload', await page.evaluate(() => TH.calc.owner('CN-001').name === 'Nguyễn Văn An — kiểm thử'));
    const renders = await page.evaluate(() => {
      const out = [];
      for (const pkg of ['A', 'B', 'C', 'D']) {
        TH.store.state.pkg = pkg;
        for (const id of ['OWN-01', 'BLD-01', 'ROOM-01', 'CUS-01', 'CON-01', 'METER-01', 'INV-01', 'INV-02', 'PAY-01', 'PAY-02', 'EXP-01', 'HR-01', 'SAL-01', 'SHARE-01', 'OA-01', 'OA-02', 'SYS-01', 'REPORTS']) {
          try { const html = TH.views[id].render({ screen: id, param: null }); if (!html) throw Error('empty'); out.push({ name: 'render '+pkg+' '+id, pass: true }); } catch (e) { out.push({ name: 'render '+pkg+' '+id+': '+e.message, pass: false }); }
        }
      }
      TH.store.state.pkg = 'A'; return out;
    });
    checks.push(...renders); check('all screen renders', renders.every(r => r.pass));
    await page.setViewportSize({ width: 375, height: 812 }); await page.evaluate(() => TH.app.refresh());
    check('mobile no document overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    check('no runtime errors', errors.length === 0);
    return { pass: true, checks: checks.length, results: checks, errors };
  } catch (e) { return { pass: false, failure: e.message, results: checks, errors }; }
  finally { await context.close(); }
}
