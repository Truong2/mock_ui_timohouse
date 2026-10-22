// UI-only checks. Run with Playwright browser_run_code_unsafe on the local demo.
async (page) => {
  const results = [];
  const check = (id, pass, evidence) => results.push({ id, pass: !!pass, evidence });
  const screens = ['BLD-01', 'CUS-01', 'ROOM-01', 'INV-02', 'PAY-01'];
  await page.route('**/*', route => route.continue());
  await page.goto('http://127.0.0.1:8080/?previewPackage=D&uiqa=records#/demo/cus-01');
  const saved = await page.evaluate(() => JSON.parse(JSON.stringify({ pkg: TH.store.state.pkg, role: TH.store.state.role, ui: TH.store.state.ui, building: TH.store.state.building, period: TH.store.state.period, showLocked: TH.store.state.showLocked })));
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const go = async screen => {
    await page.evaluate(s => TH.go(s), screen);
    await page.waitForFunction(s => TH.app.route.screen === s, screen);
  };
  try {
    await page.evaluate(() => {
      Object.assign(TH.store.state, { role: 'admin', building: 'ALL', period: '2026-10', showLocked: true });
      ['CUS-01', 'ROOM-01', 'INV-02', 'PAY-01', 'BLD-01'].forEach(s => { TH.store.state.ui[s] = {}; });
      TH.app.refresh();
    });
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const pkg of ['A', 'B', 'C', 'D']) {
        await page.evaluate(k => { TH.store.state.pkg = k; TH.app.refresh(); }, pkg);
        for (const screen of screens) {
          await go(screen);
          const evidence = await page.evaluate(() => {
            const table = document.querySelector('.table-records'), row = table?.querySelector('tbody tr');
            const secondary = row && [...row.querySelectorAll('.mobile-secondary')];
            return { table: !!table, row: !!row, overflow: document.documentElement.scrollWidth - innerWidth, rowOverflow: row ? row.scrollWidth - row.clientWidth : 999, secondaryShown: secondary?.filter(e => getComputedStyle(e).display !== 'none').length, secondaryCount: secondary?.length, toggleVisible: !!row?.querySelector('.mobile-row-toggle')?.getClientRects().length };
          });
          check(`${screen}-${pkg}-${width}`, evidence.table && evidence.row && evidence.overflow <= 1 && (width > 640 ? !evidence.toggleVisible && evidence.secondaryShown === evidence.secondaryCount : evidence.toggleVisible && evidence.secondaryShown === 0 && evidence.rowOverflow <= 1), evidence);
        }
      }
    }
    await page.evaluate(() => { TH.store.state.pkg = 'D'; TH.app.refresh(); });
    await page.setViewportSize({ width: 390, height: 844 });
    for (const screen of screens) {
      await go(screen);
      const toggle = page.locator('.table-records tbody tr .mobile-row-toggle').first();
      await toggle.focus(); await page.keyboard.press('Enter');
      const expanded = await page.locator('.table-records tbody tr').first().evaluate(row => ({ expanded: row.classList.contains('is-expanded'), aria: row.querySelector('.mobile-row-toggle').getAttribute('aria-expanded'), visible: [...row.querySelectorAll('.mobile-secondary')].every(e => getComputedStyle(e).display !== 'none') }));
      check('expand-keyboard-' + screen, expanded.expanded && expanded.aria === 'true' && expanded.visible, expanded);
      await toggle.click();
      check('collapse-' + screen, await toggle.getAttribute('aria-expanded') === 'false', 'Collapsed without navigation');
    }
    for (const [screen, action] of [['INV-02', 'inv.sel'], ['PAY-01', 'pay.sel']]) {
      await go(screen);
      const checkbox = page.locator(`.table-records input[data-act="${action}"]`).first();
      const id = await checkbox.getAttribute('data-id');
      await checkbox.check();
      const selected = await page.evaluate(([s, id]) => ({ selected: TH.store.ui(s, 'sel', []).includes(id), route: TH.app.route.screen }), [screen, id]);
      check('selection-' + screen, selected.selected && selected.route === screen, selected);
      await page.locator(`.table-records input[data-act="${action}"][data-id="${id}"]`).uncheck();
    }
    await go('CUS-01');
    check('summary-phone-closed', !await page.locator('.summary-fold').evaluate(e => e.open), 'Phone default');
    await page.locator('.summary-fold > summary').focus(); await page.keyboard.press('Enter');
    check('summary-keyboard', await page.locator('.summary-fold').evaluate(e => e.open) && await page.locator('.summary-content .kpi').first().isVisible(), 'KPIs available on demand');
    await page.setViewportSize({ width: 1440, height: 900 });
    check('summary-desktop', await page.locator('.summary-fold').evaluate(e => e.open) && await page.locator('.summary-content .kpi').first().isVisible(), 'Resize restores the desktop overview');
    await go('BLD-01');
    const roomBoard = await page.evaluate(() => ({ shown: document.querySelectorAll('.room-slot').length, expected: TH.db.rooms.filter(r => TH.inScope(r.buildingId)).length, names: [...document.querySelectorAll('a.room-slot')].every(e => e.getAttribute('aria-label') && e.getAttribute('href').includes('room-02')) }));
    check('room-board', roomBoard.shown === roomBoard.expected && roomBoard.names, roomBoard);
    await page.locator('a.room-slot').first().click();
    await page.waitForFunction(() => TH.app.route.screen === 'ROOM-02');
    check('room-navigation', await page.evaluate(() => TH.app.route.screen === 'ROOM-02'), 'Room opens existing detail');
    await go('CUS-01');
    await page.locator('#q-CUS-01').fill('khong-co-ket-qua-ui-qa');
    await page.waitForTimeout(350);
    check('empty-search', await page.locator('.table-records .table-empty').count() === 1, 'Empty results keep their message');
    await page.locator('#q-CUS-01').fill(''); await page.waitForTimeout(350);
    const smoke = await page.evaluate(() => { const r = TH.qaSmoke(); return { total: r.total, fails: r.fails }; });
    check('smoke', smoke.total >= 1088 && smoke.fails.length === 0, smoke);
    check('runtime', errors.length === 0, errors);
    return { total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass), smoke };
  } finally {
    page.off('pageerror', onError);
    await page.evaluate(s => { Object.assign(TH.store.state, s); TH.app.refresh(); TH.store.flush(); }, saved);
    await page.setViewportSize({ width: 1440, height: 900 });
  }
}
