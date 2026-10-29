async (page) => {
  const results = [], errors = [];
  const check = (id, pass, evidence) => { results.push({ id, pass: !!pass, evidence }); if (!pass) throw new Error(id + ': ' + JSON.stringify(evidence)); };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.clearBrowserCache'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8779/index.html?datasetUi=' + Date.now() + '#/demo/reports');
  await page.waitForFunction(() => window.TH && TH.dataset && TH.reports);
  const reset = async () => page.evaluate(() => {
    TH.modal.stack.slice().reverse().forEach(m => { TH.modal.close(m.key, { silent: true, noFocus: true }); m.el.remove(); });
    TH.db = TH.seed(); Object.assign(TH.store.state, { role: 'admin', pkg: 'D', period: '2026-10', building: 'ALL', ui: {}, drafts: {}, editing: null, reportReturn: null });
    TH.app.guard = null; TH.app.refresh();
  });
  await reset();
  const init = await page.evaluate(() => ({ version: TH.db.dataset.version, schema: TH.DATA_SCHEMA, rooms: TH.db.rooms.length, reports: TH.db.reportRuns.length, scenarios: TH.db.dataset.scenarios.length }));
  check('DATASET-FRESH', init.version === 'excel-demo-v2' && init.schema === 13 && init.rooms === 18 && init.reports === 2 && init.scenarios === 17, init);

  // Schema 13 đổi toàn bộ mã sang kiểu Excel (T17/S9/G1): bản lưu schema 12 cũ được reseed sạch, không lỗi console.
  await page.evaluate(() => {
    localStorage.setItem('timehouse.demo.v1', JSON.stringify({ schema: 12, pkg: 'D', drafts: { 'qa-old': { note: 'Nháp cũ' } }, db: { buildings: [{ id: 'TH-CG' }] } }));
  });
  await page.reload();
  await page.waitForFunction(() => window.TH && TH.db && TH.db.dataset);
  const saved = await page.evaluate(() => ({ ids: TH.db.buildings.map(b => b.id).join(','), version: TH.db.dataset.version, draft: !!TH.store.state.drafts['qa-old'] }));
  check('DATASET-RESEED-OLD-SCHEMA', saved.ids === 'T17,S9,G1' && saved.version === 'excel-demo-v2' && !saved.draft, saved);
  // Leave the app before clearing storage: its pagehide handler flushes the
  // active session, which would otherwise recreate the old save on navigation.
  await page.goto('http://127.0.0.1:8779/docs/qa/dataset/source-inventory.json');
  await page.evaluate(() => { localStorage.removeItem('timehouse.demo.v1'); });
  await page.goto('http://127.0.0.1:8779/index.html?datasetFresh=' + Date.now() + '#/demo/reports');
  check('DATASET-NEW-BROWSER', await page.evaluate(() => TH.db.dataset.version === 'excel-demo-v2'), 'Fresh storage selects the new seed');

  // Dirty inline editing must be resolved before the destructive reset dialog.
  await page.evaluate(() => { TH.go('CUS-02', 'HĐ-101T17/25'); TH.store.setUi('CUS-02', 'tab', 'info'); TH.app.refresh(); });
  await page.locator('[data-act="sec.edit"][data-key="cusInfo"]').click();
  await page.getByLabel('Nghề nghiệp', { exact: true }).fill('Nháp cần giữ');
  await page.evaluate(() => { TH.act['data.reset'](); });
  await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
  await page.locator('[data-act="unsaved.pick"]').first().waitFor({ state: 'detached' });
  check('DATASET-RESET-GUARD', await page.evaluate(() => TH.editGuard.dirty() && TH.db.dataset.version === 'excel-demo-v2'), 'Cancel preserves the current edit');
  await page.evaluate(() => { TH.act['data.reset'](); });
  await page.locator('[data-act="unsaved.pick"][data-val="discard"]').click();
  await page.getByRole('button', { name: 'Khôi phục', exact: true }).click();
  check('DATASET-RESET', await page.evaluate(() => !TH.store.state.editing && !Object.keys(TH.store.state.drafts).length && TH.db.reportRuns.length === 2), 'Reset clears edit state and loads fixed snapshots');

  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => { TH.act['dataset.review'](); });
    const source = await page.locator('[data-act="dataset.scenario"]').count();
    check('DATASET-REVIEW-' + width, source === 17 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { scenarios: source });
    for (const id of ['DS-02', 'DS-08', 'DS-09', 'DS-13']) {
      await page.locator('[data-act="dataset.scenario"][data-id="' + id + '"]').click();
      await page.waitForFunction(() => TH.modal.top().el.contains(document.activeElement));
      const view = await page.evaluate(() => {
        const modal = TH.modal.stack[TH.modal.stack.length - 1];
        return { overflow: document.documentElement.scrollWidth - innerWidth, text: modal.el.innerText.includes('Dữ liệu mô phỏng'), inDialog: modal.el.contains(document.activeElement) };
      });
      check('DATASET-' + id + '-' + width, view.overflow <= 0 && view.text && view.inDialog, view);
      if (id === 'DS-13' && (width === 375 || width === 1440)) await page.screenshot({ path: 'docs/qa/dataset/forecast-' + width + '.png' });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => { TH.store.state.role = 'manager'; TH.act['dataset.review'](); });
  check('DATASET-PERMISSIONS', await page.evaluate(() => !TH.modal.stack.some(m => m.key === 'dataset-review')), 'Manager cannot open portfolio evidence');
  await reset();

  // Fixed snapshots are immutable; new versions share the same version group.
  const snapshot = await page.evaluate(() => {
    const r = TH.db.reportRuns[0], json = JSON.stringify(r.snapshot), old = r.snapshot.vals.tong['S:T17'].total;
    TH.db.invoices.find(i => i.period === '2026-09' && i.buildingId === 'T17').total += 1000;
    const same = JSON.stringify(r.snapshot) === json;
    TH.db = TH.seed();
    const d = TH.reports.preview({ type: r.type, period: r.period, buildingIds: r.buildingIds, previousRunId: r.id }).draft;
    TH.reports.reviewState(d).groups.forEach(g => { TH.reports.markSeen(d.id, g.id); TH.reports.setReview(d.id, g.id, true); });
    const res = TH.reports.confirm(d.id, { acknowledgeWarnings: true });
    const v2 = TH.reports.run(res.runIds[0]);
    return { same, old, version: v2.version, previous: v2.prevId, original: r.id };
  });
  check('DATASET-SNAPSHOT', snapshot.same && snapshot.version === 2 && snapshot.previous === snapshot.original, snapshot);
  await reset();
  const dlPromise = page.waitForEvent('download');
  await page.evaluate(() => { TH.reports.export(TH.db.reportRuns[0].id); });
  const dl = await dlPromise; await dl.saveAs('C:/Users/truon/Downloads/mockup/docs/qa/dataset/report-seed.xlsx');
  check('DATASET-EXPORT', (await dl.failure()) === null, 'Saved report-seed.xlsx through the application export path');
  const forecast = await page.evaluate(() => {
    const before = JSON.stringify(TH.db), rows = TH.db.forecastPlans.map(TH.dataset.forecast);
    return { unchanged: before === JSON.stringify(TH.db), rows: rows.length, valid: rows.every(r => r.status === 'draft' && r.profit === r.revenue - r.costs) };
  });
  check('DATASET-FORECAST-READONLY', forecast.unchanged && forecast.rows === 3 && forecast.valid, forecast);
  const smoke = await page.evaluate(() => { TH.store.state.pkg = 'D'; const r = TH.qaSmoke(); return { total: r.total, fails: r.fails }; });
  check('SMOKE', smoke.total >= 1088 && smoke.fails.length === 0, smoke);
  check('DATASET-CONSOLE', errors.length === 0, errors);
  await page.setViewportSize({ width: 1440, height: 900 });
  await reset(); await page.evaluate(() => { TH.store.flush(); TH.go('REPORTS'); });
  await cdp.detach();
  return { passed: results.length, results };
}
