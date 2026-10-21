// CR-NAV-01 — điều hướng theo 9 khu vực; chạy trên server local 8780 bằng browser_run_code.
// Chỉ thay UI/vai trò và nháp kiểm thử; không xác nhận hóa đơn/báo cáo hoặc ghi thay đổi nghiệp vụ.
async (page) => {
  const results = [];
  const check = (id, pass, evidence) => { results.push({ id, pass: !!pass, evidence }); if (!pass) throw new Error(id + ': ' + JSON.stringify(evidence)); };
  const read = (fn, arg) => page.evaluate(fn, arg);
  await page.route('**/*', route => route.continue()); // Không dùng script/CSS cũ từ cache khi kiểm tra working tree.
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('http://127.0.0.1:8780/index.html?previewPackage=D&navqa=' + Date.now() + '#/demo/bld-01');
  await page.waitForFunction(() => window.TH && TH.navigation && TH.app.route);
  const saved = await read(() => ({ role: TH.store.state.role, ui: JSON.parse(JSON.stringify(TH.store.state.ui)), period: TH.store.state.period, building: TH.store.state.building }));
  const go = async (screen, param) => {
    await read(([s, p]) => TH.go(s, p), [screen, param]);
    await page.waitForFunction(s => TH.app.route.screen === s, screen);
    await page.waitForFunction(() => document.querySelectorAll('#nav > a').length > 0);
  };
  try {
    await read(() => { TH.store.state.role = 'admin'; TH.store.setUi('navigation', 'collapsed', false); TH.app.refresh(); });
    await page.waitForFunction(() => Math.abs(document.querySelector('#sidebar').getBoundingClientRect().width - 232) < 1);
    const q1 = await read(() => ({
      modules: [...document.querySelectorAll('#nav > a')].map(a => a.dataset.workspace),
      names: [...document.querySelectorAll('#nav > a')].map(a => a.getAttribute('aria-label')),
      tabs: [...document.querySelectorAll('.workspace-tabs a')].map(a => a.textContent),
      noTruncatedNames: [...document.querySelectorAll('#nav .nav-text')].every(n => n.scrollWidth <= n.clientWidth + 1),
      noScreenCode: getComputedStyle(document.querySelector('.page-title .screen-id')).display === 'none',
      title: document.querySelector('h1').innerText,
    }));
    check('NAV-01', q1.modules.length === 9 && new Set(q1.modules).size === 9 && q1.tabs.join('|') === 'Tòa nhà|Phòng|Chủ nhà' && q1.noTruncatedNames && q1.noScreenCode && q1.title === 'Tòa nhà', q1);

    await page.locator('#nav-compact-toggle').click();
    await page.waitForFunction(() => Math.abs(document.querySelector('#sidebar').getBoundingClientRect().width - 72) < 1);
    const q2 = await read(() => ({ width: document.querySelector('#sidebar').getBoundingClientRect().width, accessible: [...document.querySelectorAll('#nav > a')].every(a => a.getAttribute('aria-label') && a.title), count: document.querySelectorAll('#nav > a').length }));
    await page.reload(); await page.waitForFunction(() => TH.navigation && document.querySelector('#shell').classList.contains('nav-compact'));
    const kept = await read(() => TH.store.ui('navigation', 'collapsed', false));
    check('NAV-02', q2.width === 72 && q2.accessible && q2.count === 9 && kept, { ...q2, persistedAfterReload: kept });
    await page.screenshot({ path: 'C:/Users/truon/Downloads/mockup/docs/qa/navigation/desktop-collapsed.png' });
    await page.locator('#nav-compact-toggle').click();
    await page.waitForFunction(() => Math.abs(document.querySelector('#sidebar').getBoundingClientRect().width - 232) < 1);
    await page.screenshot({ path: 'C:/Users/truon/Downloads/mockup/docs/qa/navigation/desktop-expanded.png' });

    const routes = [
      ['ROOM-02', 'CG-101', 'properties', 'Phòng'], ['OWN-02', 'CN-001', 'properties', 'Chủ nhà'],
      ['CON-03', null, 'tenancies', 'Hợp đồng thuê phòng'], ['INV-01', null, 'billing', 'Hóa đơn'],
      ['INV-03', 'INV-2610-CG202', 'billing', 'Hóa đơn'], ['PAY-01', null, 'billing', 'Thu tiền & công nợ'],
      ['OA-02', null, 'billing', 'Nhắc thanh toán'], ['SAL-01', null, 'people', 'Bảng lương'],
    ];
    const routeResults = [];
    for (const [screen, param, group, section] of routes) {
      await go(screen, param);
      const current = await read(() => ({ group: document.querySelector('#nav > a[aria-current="page"]')?.dataset.workspace, section: document.querySelector('.workspace-tabs a[aria-current="page"]')?.textContent, activeCount: document.querySelectorAll('#nav > a[aria-current="page"]').length }));
      routeResults.push({ screen, ...current });
      check('NAV-03-' + screen, current.group === group && current.section === section && current.activeCount === 1, current);
    }

    await read(() => { TH.store.state.role = 'hr'; TH.app.refresh(); });
    const hr = await read(() => [...document.querySelectorAll('#nav > a')].map(a => ({ id: a.dataset.workspace, allowed: TH.canScreen(a.hash.split('/')[2].toUpperCase()) })));
    check('NAV-04-HR', hr.length === 2 && hr.every(a => a.allowed) && hr.map(a => a.id).sort().join() === 'people,reports', hr);
    await page.locator('#gsearch').fill('chi phí');
    const hrSearch = await page.locator('#gresults').innerText();
    check('NAV-04-SEARCH-PERM', !hrSearch.includes('Chi phí vận hành'), hrSearch);
    await read(() => { TH.store.state.role = 'manager'; TH.app.refresh(); });
    const manager = await read(() => ({ ids: [...document.querySelectorAll('#nav > a')].map(a => a.dataset.workspace), forbidden: [...document.querySelectorAll('.workspace-tabs a')].some(a => !TH.canScreen(a.hash.split('/')[2].toUpperCase())) }));
    check('NAV-04-MANAGER', !manager.ids.includes('people') && !manager.ids.includes('equity') && !manager.forbidden, manager);

    await read(() => { TH.store.state.role = 'admin'; TH.app.refresh(); });
    await go('OWN-02', 'CN-001');
    await page.locator('[data-act="sec.edit"][data-key="ownInfo"]').first().click();
    const name = page.locator('input[data-draft$=".name"]').first();
    await name.fill('Tên QA chưa lưu');
    await page.locator('.workspace-tabs a', { hasText: 'Tòa nhà' }).click();
    await page.getByRole('heading', { name: 'Còn thay đổi chưa lưu' }).waitFor();
    await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
    const stay = await read(() => ({ screen: TH.app.route.screen, dirty: TH.editGuard.dirty() }));
    check('NAV-05-STAY', stay.screen === 'OWN-02' && stay.dirty, stay);
    await page.locator('.workspace-tabs a', { hasText: 'Tòa nhà' }).click();
    await page.getByRole('button', { name: 'Bỏ thay đổi', exact: true }).click();
    await page.waitForFunction(() => TH.app.route.screen === 'BLD-01');
    check('NAV-05-DISCARD', await read(() => TH.calc.owner('CN-001').name !== 'Tên QA chưa lưu'), 'Dữ liệu chủ nhà giữ nguyên sau khi bỏ nháp');

    await page.locator('#gsearch').fill('Báo đã thu');
    const alias = await page.locator('#gresults').innerText();
    check('NAV-06-ALIAS', alias.includes('Phiếu thu & đối soát'), alias);
    await page.locator('#gsearch').fill('');
    await page.locator('[data-workspace="reports"]').click();
    await page.waitForFunction(() => TH.app.route.screen === 'REPORTS');
    check('NAV-07-REPORT-HUB', await read(() => !!TH.reports && document.querySelector('#nav [aria-current="page"]').dataset.workspace === 'reports'), 'Mục Báo cáo mở luồng REPORTS hiện có');
    await read(() => { TH.store.state.reportReturn = { hash: '#/demo/reports', label: 'preview kiểm tra điều hướng' }; });
    await go('INV-03', 'INV-2610-CG202');
    const banner = await read(() => ({ exists: !!document.querySelector('.rptf-return'), first: document.querySelector('#view').firstElementChild.classList.contains('rptf-return') }));
    check('NAV-07-RETURN', banner.exists && banner.first, banner);
    await page.locator('[data-act="rptf.return"]').click();
    await page.waitForFunction(() => TH.app.route.screen === 'REPORTS');

    await go('PAY-02');
    await read(() => { TH.store.setUi('navigation', 'collapsed', true); TH.navigation.refresh(); });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForFunction(() => document.querySelector('#sidebar').inert);
    const closed = await read(() => ({ inert: document.querySelector('#sidebar').inert, overflow: document.documentElement.scrollWidth - innerWidth }));
    await page.locator('.menu-toggle').click();
    const opened = await read(() => ({ inert: document.querySelector('#sidebar').inert, expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded'), focusInNav: !!document.activeElement.closest('#sidebar'), scrollLocked: document.body.classList.contains('nav-drawer-open') }));
    const lastMenuLink = page.locator('#sidebar a[href]').last();
    await lastMenuLink.focus(); await page.keyboard.press('Tab');
    const focusTrapped = await read(() => document.activeElement === document.querySelector('#sidebar a[href]'));
    await page.screenshot({ path: 'C:/Users/truon/Downloads/mockup/docs/qa/navigation/mobile-menu.png' });
    await page.keyboard.press('Escape');
    const escClosed = await read(() => document.querySelector('#sidebar').inert && document.activeElement.classList.contains('menu-toggle'));
    check('NAV-08-DRAWER', closed.inert && closed.overflow <= 0 && !opened.inert && opened.expanded === 'true' && opened.focusInNav && opened.scrollLocked && focusTrapped && escClosed, { closed, opened, focusTrapped, escClosed });
    await page.locator('.menu-toggle').click();
    await page.locator('[data-workspace="properties"]').click();
    await page.waitForFunction(() => TH.app.route.screen === 'BLD-01' && document.querySelector('#sidebar').inert);
    const mobileResult = await read(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, active: document.querySelector('#nav [aria-current="page"]').dataset.workspace }));
    check('NAV-08-NAVIGATE', mobileResult.overflow <= 0 && mobileResult.active === 'properties', mobileResult);
    await page.screenshot({ path: 'C:/Users/truon/Downloads/mockup/docs/qa/navigation/mobile-content.png' });
    await page.locator('.menu-toggle').click();
    await page.locator('#sidebar .brand').click();
    await page.waitForFunction(() => TH.app.route.landing);
    check('NAV-08-LANDING', await read(() => !document.body.classList.contains('nav-drawer-open')), 'Về trang giới thiệu không giữ khóa cuộn của drawer');
    await go('BLD-01');

    await page.setViewportSize({ width: 1440, height: 960 });
    const smoke = await read(() => { TH.store.state.editing = null; const r = TH.qaSmoke(); return { total: r.total, fails: r.fails }; });
    check('NAV-09-SMOKE', smoke.total >= 1048 && smoke.fails.length === 0, smoke);
    return { passed: results.length, results };
  } finally {
    await read(s => { TH.store.state.role = s.role; TH.store.state.ui = s.ui; TH.store.state.period = s.period; TH.store.state.building = s.building; TH.store.state.reportReturn = null; TH.app.refresh(); TH.store.flush(); }, saved);
  }
}
