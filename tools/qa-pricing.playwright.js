// Customer presentation, package sharing and feature-preview regression.
async (page) => {
  const results = [], errors = [];
  const check = (id, pass, evidence) => { results.push({ id, pass: !!pass, evidence }); if (!pass) throw new Error(id + ': ' + JSON.stringify(evidence)); };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.clearBrowserCache'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8779/index.html?previewPackage=D&pricingQa=' + Date.now() + '#/');
  await page.waitForFunction(() => window.TH && TH.pricing && TH.db);
  await page.evaluate(() => { TH.store.state.reviewMode = false; TH.store.state.ui.CMP = {q:'',mod:'ALL',only:'all'}; document.body.classList.remove('is-review'); });
  const baseline = await page.evaluate(() => JSON.stringify({ db: TH.db, role: TH.store.state.role, drafts: TH.store.state.drafts, building: TH.store.state.building }));
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const pkg of ['A', 'B', 'C', 'D']) {
      await page.locator('.plan[data-pkg="' + pkg + '"] [data-act="pricing.pick"]').click();
      const r = await page.evaluate(k => {
        const price = TH.PACKAGES[k].price, title = document.getElementById('offer-detail-title');
        const bad = Array.from(document.querySelectorAll('.plan,.offer-detail,.offer-roadmap>li,.offer-share')).filter(el => { const b = el.getBoundingClientRect(); return b.width && (b.left < -1 || b.right > innerWidth + 1); }).length;
        return { key: TH.store.state.pkg, selected: document.querySelectorAll('.plan.is-selected').length,
          price: document.getElementById('offer-detail').innerText.includes(price), steps: document.querySelectorAll('.offer-roadmap>li').length,
          link: document.getElementById('offer-link').value, query: new URL(location.href).searchParams.get('previewPackage'),
          focus: document.activeElement === title, visible: title.getBoundingClientRect().top >= document.querySelector('.l-nav').getBoundingClientRect().bottom,
          overflow: document.documentElement.scrollWidth - innerWidth, bad,
          demo: document.querySelector('[data-offer-demo]').dataset.pkg, screen: document.querySelector('#offer-detail [data-act="landing.open"]').dataset.go,
          scope: document.querySelector('#offer-detail .offer-limits').innerText, foundation: document.querySelector('.plan[data-pkg="' + k + '"] .offer-foundation').textContent,
          baseEnabled: ['F011.A', 'F012.A', 'F026.A', 'F027.A'].every(id => TH.has(id)), reportTypes: ['RPT-04', 'RPT-05'].filter(t => TH.reports.TYPES[t] && TH.reports.TYPES[t].tier === 'A' && TH.reports.canType(t)).join(','),
          upgradeGates: TH.has('F011.B') === (k !== 'A') && TH.has('F027.B') === (k !== 'A') && TH.has('F045.C') === ('CD'.includes(k)) && TH.has('F045.D') === (k === 'D') };
      }, pkg);
      check('PRICE-' + width + '-' + pkg, r.key === pkg && r.selected === 1 && r.price && r.steps === 6 && r.query === pkg && r.focus && r.visible && r.overflow <= 0 && !r.bad && r.demo === pkg && new URL(r.link).searchParams.get('previewPackage') === pkg && new URL(r.link).hash === '#/', r);
      check('SCOPE-' + width + '-' + pkg, r.scope.includes('OCR:') && r.scope.includes('OA:') && r.scope.includes('hai mẫu gốc') && r.foundation.includes('OCR') && r.foundation.includes('OA') && r.baseEnabled && r.reportTypes === 'RPT-04,RPT-05' && r.upgradeGates, { limits: r.scope, baseEnabled: r.baseEnabled, reportTypes: r.reportTypes, upgradeGates: r.upgradeGates });
    }
    const ui = await page.evaluate(() => ({ mobile: getComputedStyle(document.querySelector('.offer-mobile-matrix')).display !== 'none', rows: document.querySelectorAll('.offer-comparison tbody tr').length, localRows: document.querySelectorAll('#offer-mobile-compare dl>div').length, minTargets: Math.min(...Array.from(document.querySelectorAll('.plan .btn,.offer-picker .btn')).filter(b => b.getBoundingClientRect().width).map(b => b.getBoundingClientRect().height)) }));
    check('COMPARE-' + width, ui.mobile === (width <= 900) && ui.rows === 8 && ui.localRows === 8 && ui.minTargets >= 44, ui);
    if (width === 375 || width === 1440) {
      await page.locator('#pham-vi-goi').scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'C:/Users/truon/Downloads/mockup/docs/qa/pricing/detail-' + width + '.png' });
      await page.evaluate(() => document.getElementById('moc-ban-giao').scrollIntoView({ block: 'start' }));
      await page.screenshot({ path: 'C:/Users/truon/Downloads/mockup/docs/qa/pricing/milestones-' + width + '.png' });
    }
  }
  check('DATA-UNCHANGED', await page.evaluate(before => before === JSON.stringify({ db: TH.db, role: TH.store.state.role, drafts: TH.store.state.drafts, building: TH.store.state.building }), baseline), 'Package selection preserves business data, role, scope and drafts');

  // Keyboard selection stays on its button for nearby controls.
  await page.locator('.offer-detail-section [data-act="pricing.pick"][data-pkg="B"]').focus();
  await page.keyboard.press('Enter');
  check('KEYBOARD-PICK', await page.evaluate(() => document.activeElement.dataset.pkg === 'B' && TH.store.state.pkg === 'B' && document.getElementById('offer-live').textContent.includes('B')), 'Enter selects and announces without losing focus');
  const link = await page.locator('#offer-link').inputValue();
  check('SHARE-CLEAN', !link.includes('pricingQa') && !link.includes('shot='), link);
  await page.goto(link);
  check('SHARE-RESTORE', await page.evaluate(() => TH.store.state.pkg === 'B' && document.querySelector('.plan.is-selected').dataset.pkg === 'B'), 'Shared link restores selected offer');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-act="landing.scroll"][data-target="giai-dap"]').first().click();
  await page.locator('#giai-dap summary').first().click();
  check('FAQ-REDUCED-MOTION', await page.locator('#giai-dap details').first().getAttribute('open') !== null, 'Native disclosure and section navigation remain usable');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await page.evaluate(() => TH.act['pkg.compare']());
  let matrix = await page.evaluate(() => ({ columns: document.querySelectorAll('.cmp-table thead th').length, rows: document.querySelectorAll('.cmp-table tbody tr:not(.is-module)').length, text: TH.modal.top().el.innerText }));
  check('CUSTOMER-MATRIX', matrix.columns === 5 && matrix.rows === 52 && !/F0\d\d|UI-ID|QA-B01|UX PROPOSED/.test(matrix.text), { columns: matrix.columns, rows: matrix.rows });
  check('OA-CURRENT-ROLES', !matrix.text.includes('sau kế toán xác nhận') && matrix.text.includes('không gửi lặp hoặc nhắc khoản đã thu đủ'), 'OA stops on confirmed payment without waiting for accountant audit');
  await page.locator('[data-act="pkg.seg"][data-pkg="C"]').click();
  await page.waitForFunction(() => TH.store.state.pkg === 'C' && TH.modal.top().el.querySelector('[data-act="pkg.seg"][data-pkg="C"]').getAttribute('aria-pressed') === 'true');
  check('MATRIX-SWITCH', await page.evaluate(() => TH.modal.top().el.innerText.includes('80–90')), 'Comparison stays in sync when opened on landing');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.evaluate(() => { TH.store.state.reviewMode = true; document.body.classList.add('is-review'); TH.act['pkg.compare'](); });
  check('REVIEW-MATRIX', await page.locator('.cmp-table thead th').count() === 7 && await page.locator('.cmp-table').innerText().then(t => t.includes('F001')), 'Detailed review retains identifiers');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.evaluate(() => { TH.store.state.reviewMode = false; document.body.classList.remove('is-review'); TH.go('RPT-01'); });
  await page.waitForSelector('#pkg-btn');
  await page.click('#pkg-btn');
  await page.locator('[data-act-change="pkg.pick"][value="A"]').check();
  await page.waitForFunction(() => TH.modal.top().el.querySelector('.offer-summary b').textContent === TH.pricing.offers.A.title);
  const drawer = await page.evaluate(() => ({ link: document.getElementById('pkg-link').value, text: TH.modal.top().el.innerText, selected: TH.store.state.pkg }));
  check('DRAWER-SCOPE', drawer.selected === 'A' && new URL(drawer.link).hash === '#/' && !drawer.text.includes('UX PROPOSED') && !drawer.text.includes('QA-B01'), drawer.selected);
  await page.locator('[data-act="pricing.intro"]').click();
  await page.waitForSelector('.landing-pricing');
  check('DRAWER-INTRO', await page.evaluate(() => TH.store.state.pkg === 'A' && TH.modal.stack.length === 0 && document.getElementById('offer-detail').innerText.includes('50–60')), 'Drawer returns to matching offer without changing package');
  await page.evaluate(() => TH.act['landing.open']({ dataset: { pkg: 'D', go: '#/demo/reports' } }));
  await page.waitForFunction(() => TH.app.route.page === 'REPORTS');
  check('DEMO-ROUTE', await page.evaluate(() => TH.store.state.pkg === 'D'), 'Customer CTA opens the selected package and business screen');
  const smoke = await page.evaluate(() => { const r = TH.qaSmoke(); return { total: r.total, fails: r.fails }; });
  check('SMOKE', smoke.total === 1168 && !smoke.fails.length, { total: smoke.total, fails: smoke.fails.length });
  check('CONSOLE', !errors.length, errors);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:8779/index.html?previewPackage=D#/');
  await cdp.detach();
  return { passed: results.length, results };
}
