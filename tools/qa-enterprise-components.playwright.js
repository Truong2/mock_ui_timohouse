// Run with Playwright browser_run_code on the local server at 8779.
async (page) => {
  const results = [], errors = [];
  const check = (id, pass, evidence) => { results.push({ id, pass: !!pass, evidence }); if (!pass) throw new Error(id + ': ' + JSON.stringify(evidence)); };
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => route.continue());
  // Chromium local QA must inspect current files, including after rapid consecutive edits.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.clearBrowserCache'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await page.goto('http://127.0.0.1:8779/index.html?previewPackage=D&componentsQa=' + Date.now() + '#/demo/cus-02/KH-003');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => { TH.modal.stack.slice().forEach(m => { TH.modal.close(m.key, { silent: true, noFocus: true }); m.el.remove(); }); TH.db = TH.seed(); Object.assign(TH.store.state, { pkg: 'D', role: 'admin', building: 'ALL', period: '2026-10', ui: {}, drafts: {}, editing: null }); TH.app.guard = null; TH.app.render(); });
  const totals = () => page.evaluate(() => ({ schema: TH.DATA_SCHEMA, kd09: TH.calc.pnl('2026-09', 'ALL', 'kd').lnr, total09: TH.calc.pnl('2026-09', 'ALL', 'tong').lnr, kd10: TH.calc.pnl('2026-10', 'ALL', 'kd').lnr, total10: TH.calc.pnl('2026-10', 'ALL', 'tong').lnr, invoice: TH.calc.invoice('INV-2610-202T17').total }));
  const baseline = await totals();
  check('DOM-PAGE-ORDER', await page.evaluate(() => {
    const view = document.getElementById('view'), nodes = [...view.children];
    return nodes[0].classList.contains('workspace-navigation') && nodes[1].classList.contains('page-hd') && nodes[2].classList.contains('tab-card') && nodes.every(n => getComputedStyle(n).order === '0');
  }), 'Detail navigation, heading, tabs and panel share reading and visual order');
  const tabs = page.locator('#view [role="tab"]');
  const current = await tabs.first().getAttribute('id');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  check('TABS-MANUAL-FOCUS', await tabs.nth(1).evaluate(e => e === document.activeElement && e.getAttribute('aria-selected') === 'false'), 'Arrow changes focus without committing a tab');
  await page.keyboard.press('Enter');
  check('TABS-ACTIVATION', await page.locator('[role="tab"][aria-selected="true"]').getAttribute('id') !== current && await page.locator('#view [role="tab"][tabindex="0"]').count() === 1, 'Enter activates one tab');
  await page.keyboard.press('End');
  check('TABS-END-HOME', await tabs.last().evaluate(e => e === document.activeElement), 'End focuses last available tab');
  await page.keyboard.press('Home'); await page.keyboard.press('Enter');
  await page.locator('[data-act="sec.edit"][data-key="cusInfo"]').click();
  await page.getByLabel('Nghề nghiệp', { exact: true }).fill('Bản nháp QA');
  await page.locator('#view [role="tab"]').nth(1).focus(); await page.keyboard.press('Enter');
  await page.getByRole('dialog').first().waitFor({ timeout: 2000 }).catch(() => {});
  check('TABS-UNSAVED-GUARD', await page.getByRole('dialog').count() === 1, 'Activation keeps the existing save/discard guard');
  await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
  await page.locator('[data-act="sec.cancel"]').click();
  await page.waitForFunction(() => !document.querySelector('.overlay'));
  // Exercise the public contract without calling any business handler.
  const contract = await page.evaluate(() => {
    const holder = document.createElement('div'); holder.id = 'qa-component-fixture'; document.body.appendChild(holder);
    holder.innerHTML = TH.actionGroup({ context: 'row', items: [
      { label: 'Xem', act: 'go' }, { label: 'Sửa', act: 'veh.edit' }, { label: 'Duyệt cọc', act: 'dep.approve' }, { label: 'Mở biểu mẫu QA', act: '_qa.open' }, { label: 'Xóa', act: 'unused.remove', danger: true }
    ] });
    TH.act['_qa.open'] = () => TH.modal.open({ key: 'qa-focus', render: () => ({ title: 'Biểu mẫu QA', body: TH.field({ form: 'qa-focus', name: 'name', label: 'Tên QA' }), foot: '<button type="button" class="btn" data-close>Đóng QA</button>' }) });
    const visible = [...holder.querySelectorAll('.row-actions > .btn')].map(e => e.dataset.act);
    const previous = [TH.store.state.role, TH.store.state.pkg]; TH.store.state.role = 'manager'; TH.store.state.pkg = 'A';
    const restricted = TH.actionGroup({ items: [{ label: 'Duyệt', permission: 'deposit.approve', act: 'dep.approve' }, { label: 'Xuất', gate: 'F031.B', act: 'cus.debtx' }] });
    [TH.store.state.role, TH.store.state.pkg] = previous;
    const disabled = TH.actionGroup({ items: [{ label: 'Xác nhận', primary: true, disabled: true, disabledReason: 'Cần rà soát dữ liệu' }] });
    return { visible, restricted, disabled };
  });
  check('ACTION-BUSINESS-PRIORITY', contract.visible.length === 1 && contract.visible[0] === 'dep.approve', contract.visible);
  check('ACTION-PERMISSION-GATE', /forbidden-chip/.test(contract.restricted) && /data-locked/.test(contract.restricted), 'Permission denial is separate from package lock');
  check('ACTION-DISABLED-REASON', /aria-disabled="true"/.test(contract.disabled) && /aria-description=/.test(contract.disabled), 'Disabled action retains its reason and priority');
  await page.locator('#qa-component-fixture [data-act="amenu.toggle"]').click();
  const menu = await page.locator('#qa-component-fixture [role="menu"]').evaluate(e => {
    const r = e.getBoundingClientRect(); return { topLayer: e.matches(':popover-open'), inside: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, focused: e.contains(document.activeElement) };
  });
  check('MENU-TOP-LAYER', menu.topLayer && menu.inside && menu.focused, menu);
  await page.keyboard.press('End');
  check('MENU-KEYBOARD', await page.locator('#qa-component-fixture .is-danger').evaluate(e => e === document.activeElement), 'End reaches the destructive item');
  await page.keyboard.press('Escape');
  check('MENU-ESCAPE', await page.locator('#qa-component-fixture [data-act="amenu.toggle"]').evaluate(e => e === document.activeElement && e.getAttribute('aria-expanded') === 'false'), 'Escape restores trigger focus');
  await page.locator('#qa-component-fixture [data-act="amenu.toggle"]').click();
  await page.getByRole('menuitem', { name: 'Mở biểu mẫu QA', exact: true }).click();
  await page.waitForFunction(() => TH.modal.top() && TH.modal.top().el.contains(document.activeElement)); // chờ focus ban đầu của dialog (requestAnimationFrame)
  await page.getByLabel('Tên QA', { exact: true }).focus();
  await page.locator('[role="dialog"] .dialog-hd [data-close]').focus(); await page.keyboard.press('Shift+Tab');
  check('MODAL-FOCUS-TRAP', await page.getByRole('button', { name: 'Đóng QA', exact: true }).evaluate(e => e === document.activeElement), 'Shift+Tab wraps within the dialog');
  await page.keyboard.press('Escape');
  check('MODAL-RETURN-TO-MENU', await page.locator('#qa-component-fixture [data-act="amenu.toggle"]').evaluate(e => e === document.activeElement && TH.modal.stack.length === 0), 'Closing a form returns to the menu trigger, not its hidden item');
  await page.locator('.overlay').waitFor({ state: 'detached' });
  const form = await page.evaluate(() => {
    const box = document.getElementById('qa-component-fixture');
    box.innerHTML = TH.field({ form: 'qa-enterprise', name: 'name', label: 'Tên', required: true, hint: 'Nhập tên' }) +
      TH.field({ form: 'qa-enterprise', name: 'note', label: 'Ghi chú', type: 'textarea', readonly: true, def: 'Đã lưu' }) +
      TH.field({ form: 'qa-enterprise', name: 'status', label: 'Trạng thái', type: 'select', readonly: true, options: ['Đã lưu'] });
    TH.formErrors('qa-enterprise', { name: 'Nhập tên', note: 'Kiểm tra ghi chú' });
    box.innerHTML = TH.field({ form: 'qa-enterprise', name: 'name', label: 'Tên', required: true, hint: 'Nhập tên' }) +
      TH.field({ form: 'qa-enterprise', name: 'note', label: 'Ghi chú', type: 'textarea', readonly: true, def: 'Đã lưu' }) +
      TH.field({ form: 'qa-enterprise', name: 'status', label: 'Trạng thái', type: 'select', readonly: true, options: ['Đã lưu'] });
    TH.formSummaries(box);
    const input = box.querySelector('input');
    return { required: input.required, invalid: input.getAttribute('aria-invalid'), descriptions: input.getAttribute('aria-describedby').split(' ').every(id => !!document.getElementById(id)), readonly: box.querySelector('textarea').readOnly, disabled: box.querySelector('select').disabled, links: box.querySelectorAll('.form-error-summary [data-act="field.focus"]').length };
  });
  check('FORM-CONTRACT', form.required && form.invalid === 'true' && form.descriptions && form.readonly && form.disabled && form.links === 2, form);
  await page.locator('#qa-component-fixture .form-error-summary a').first().click();
  check('FORM-ERROR-LINK', await page.locator('#f-qa-enterprise-name').evaluate(e => e === document.activeElement), 'Error summary focuses its field');
  await page.evaluate(() => {
    const box = document.getElementById('qa-component-fixture'); box.innerHTML = '<div data-document><b>DRAFT · HĐ-101T17/25 · F012.B</b></div>'; TH.reviewFilter(box);
  });
  check('DOCUMENT-INTEGRITY', await page.locator('#qa-component-fixture [data-document]').innerText() === 'DRAFT · HĐ-101T17/25 · F012.B', 'The display filter never rewrites source documents');
  await page.evaluate(() => { document.getElementById('qa-component-fixture').remove(); delete TH.act['_qa.open']; });
  const sweep = { variants: 0, dialogs: 0, failures: [] };
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const batch = await page.evaluate(() => {
      const failures = []; let variants = 0, dialogs = 0;
      for (const pkg of ['A', 'B', 'C', 'D']) {
        Object.assign(TH.store.state, { pkg, role: 'admin', drafts: {}, editing: null });
        for (const screen of TH.SCREENS) {
          const view = TH.views[screen.id]; if (!view) continue;
          for (const variant of view.scan ? view.scan() : [{}]) {
            TH.modal.stack.slice().forEach(m => { TH.modal.close(m.key, { silent: true, noFocus: true }); m.el.remove(); });
            TH.store.state.ui = {}; if (variant.ui) TH.store.state.ui[screen.id] = variant.ui;
            history.replaceState(null, '', TH.router.href(screen.id, variant.param || view.scanParam)); TH.app.render(); variants++;
            if (document.documentElement.scrollWidth > innerWidth + 1) failures.push(screen.id + '@' + innerWidth + '/' + pkg + '/page');
            document.querySelectorAll('#view .page-actions > .btn-primary').forEach(button => {
              const r = button.getBoundingClientRect(); if (r.left < 0 || r.right > innerWidth + 1) failures.push(screen.id + '/hidden-primary');
            });
            const inputs = [...document.querySelectorAll('#view input[id],#view select[id],#view textarea[id]')];
            if (new Set(inputs.map(e => e.id)).size !== inputs.length) failures.push(screen.id + '/duplicate-input');
            document.querySelectorAll('#view [role="tablist"]').forEach(list => {
              if (list.querySelectorAll('[role="tab"][tabindex="0"]').length !== 1) failures.push(screen.id + '/roving');
              list.querySelectorAll('[role="tab"]:not([aria-disabled="true"])').forEach(tab => { if (!document.getElementById(tab.getAttribute('aria-controls'))) failures.push(screen.id + '/panel'); });
            });
          }
          TH.modal.stack.slice().forEach(m => { TH.modal.close(m.key, { silent: true, noFocus: true }); m.el.remove(); });
          for (const render of view.dialogs || []) {
            const spec = render();
            if (!spec) { failures.push(screen.id + '/missing-dialog-fixture'); continue; }
            const m = TH.modal.open({ key: 'qa-sweep', render: () => typeof spec === 'string' ? { title: 'Chứng từ', body: spec } : spec }); dialogs++;
            const dialog = m.el.querySelector('[role="dialog"]'), rect = dialog.getBoundingClientRect();
            if (rect.width > innerWidth + 1 || rect.right > innerWidth + 1 || rect.left < -1) failures.push(screen.id + '@' + innerWidth + '/' + pkg + '/dialog');
            TH.modal.close(m.key, { silent: true, noFocus: true }); m.el.remove();
          }
        }
      }
      return { variants, dialogs, failures };
    });
    sweep.variants += batch.variants; sweep.dialogs += batch.dialogs; sweep.failures.push(...batch.failures);
  }
  check('ALL-VARIANTS-DIALOGS', !sweep.failures.length, sweep);
  check('FINANCIAL-REGRESSION', JSON.stringify(await totals()) === JSON.stringify(baseline), baseline);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 720, height: 450 });
  await page.evaluate(() => { TH.store.state.pkg = 'D'; history.replaceState(null, '', TH.router.href('CUS-01')); TH.app.render(); });
  check('ZOOM-REFLOW', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '720 CSS pixels represents 1440px at 200% zoom');
  check('REDUCED-MOTION', await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.shell')).transitionDuration) <= 0.001), 'Shell motion is disabled or reduced to the existing negligible duration');
  await page.emulateMedia({ reducedMotion: null }); await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => { TH.store.state.drafts = {}; TH.store.state.ui = {}; TH.store.flush(); TH.app.render(); });
  check('NO-RUNTIME-ERRORS', !errors.length, errors.slice(0, 5));
  await cdp.detach();
  return { passed: results.length, results };
}
