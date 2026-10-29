// CR-UI-STD — kiểm tra chuẩn UI enterprise trên trình duyệt. Chạy bằng Playwright browser_run_code (filename) với demo local
// (python -m http.server 8779 --bind 127.0.0.1). Kèm `node tools/lint-ui.js` cho phần kiểm tĩnh (hex, cỡ chữ, weight, inline style, nhãn tiếng Anh).
async (page) => {
  const results = [];
  const check = (id, ok, evidence) => { results.push({ id, pass: !!ok, evidence }); if (!ok) throw new Error(id + ': ' + JSON.stringify(evidence).slice(0, 1500)); };
  const read = (fn, arg) => page.evaluate(fn, arg);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8779/index.html?previewPackage=D&v=' + Date.now() + '#/demo/rpt-01');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => window.TH && TH.db && TH.app && TH.uiPolish);
  const reset = (pkg, review) => read(([k, rv]) => {
    TH.modal.stack.slice().forEach(m => TH.modal.close(m.key, { silent: true }));
    TH.db = TH.seed(); TH.db.reportRuns = []; TH.db.reportDrafts = [];
    Object.assign(TH.store.state, { building: 'ALL', period: '2026-10', ui: {}, drafts: {}, editing: null, role: 'admin', pkg: k, reviewMode: rv, showLocked: true, reportReturn: null });
    TH.app.guard = null; TH.app.render();
  }, [pkg, review]);
  const screens = await read(() => TH.SCREENS.filter(s => TH.views[s.id] && !TH.POPUP_BASE[s.id]).map(s => ({ id: s.id, param: TH.views[s.id].scanParam || null })));
  const go = async (s) => { await read(x => { TH.store.state.ui = {}; location.hash = TH.router.href(x.id, x.param || undefined); }, s); await page.waitForTimeout(140); };
  const CODE = '\\b(?:F\\d{3}(?:\\.[A-D])?|[DKGR]-\\d{2}|BILL-Q\\d|PAY-Q\\d|CR-[A-Z]+-\\d+)\\b';

  // UI-STD-01 — chế độ thường: không còn mã nội bộ / mã màn trong ngoặc / pill gói ở nội dung, tooltip, modal; chế độ review: hiện lại
  await reset('D', false);
  const leaks = [];
  for (const s of screens) {
    await go(s);
    const r = await read(([code]) => {
      const re = new RegExp(code), reScr = /\(\s*[A-Z]{2,6}-(?:\d{2}[a-z]?|[A-Z]{3,})\s*\)/;
      const view = document.getElementById('view'), out = [];
      const w = document.createTreeWalker(view, NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) { const p = n.parentElement; if (!p || p.closest('select, textarea, code, .mono, .doc-page, .print-doc, .review-only') || !p.offsetParent) continue; const m = n.nodeValue.match(re) || n.nodeValue.match(reScr); if (m) out.push(m[0] + ' @ ' + n.nodeValue.trim().slice(0, 50)); }
      const tierVisible = Array.from(view.querySelectorAll('.up-tag')).filter(e => e.offsetParent).length;
      return { codes: out.slice(0, 3), tier: tierVisible };
    }, [CODE]);
    if (r.codes.length || r.tier) leaks.push({ s: s.id, ...r });
  }
  await reset('D', true);
  await go({ id: 'INV-01' });
  const reviewOn = await read(([code]) => ({ codes: (document.getElementById('view').innerText.match(new RegExp(code, 'g')) || []).length, tier: Array.from(document.querySelectorAll('#view .up-tag')).filter(e => e.offsetParent).length }), [CODE]);
  check('UI-STD-01', !leaks.length && reviewOn.codes > 0 && reviewOn.tier > 0, { leaks: leaks.slice(0, 6), reviewOn });

  // UI-STD-02 — một màu chính: nút primary, tab đang chọn, link cùng --primary (blue, CR-UI-THEME)
  await reset('D', false);
  await go({ id: 'CUS-01' });
  const color = await read(() => {
    const probe = document.createElement('span'); probe.style.color = 'var(--primary)'; document.body.appendChild(probe);
    const primary = getComputedStyle(probe).color; probe.remove();
    const btn = document.querySelector('.page-actions .btn-primary'), link = document.querySelector('#view .table a:not(.btn), #view .card a:not(.btn)'), tab = document.querySelector('.workspace-tabs a[aria-current="page"], .tab[aria-selected="true"]');
    return { primary, btn: btn && getComputedStyle(btn).backgroundColor, link: link && getComputedStyle(link).color, tab: tab && getComputedStyle(tab).borderBottomColor };
  });
  check('UI-STD-02', color.btn === color.primary && color.link === color.primary && color.tab === color.primary && /rgb\(37, 99, 235\)/.test(color.primary), color);

  // UI-STD-03/04/05/06 — mọi màn: tương phản chữ ≥ 4.5:1 (≥ 3:1 chữ lớn), cỡ chữ ≥ 12px, nút icon có tên, header ≤ 3 nút + "Thêm"
  const contrastBad = [], smallBad = [], ariaBad = [], headerBad = [];
  for (const s of screens) {
    await go(s);
    const r = await read(() => {
      const L = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
      const alpha = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return 1; const p = m[1].split(',').map(Number); return p.length > 3 ? p[3] : 1; };
      const bgOf = el => { for (let e = el; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; if (alpha(b) > 0.9) return b; if (getComputedStyle(e).backgroundImage !== 'none' && e !== el) return null; } return 'rgb(255, 255, 255)'; };
      const view = document.getElementById('view'), cbad = [], sbad = [], abad = [];
      view.querySelectorAll('*').forEach(el => {
        if (!el.offsetParent || el.closest('.gate-ghost, .is-ghost, svg, .doc-page, .print-doc, [inert]') || el.matches(':disabled, [aria-disabled="true"]')) return;
        const own = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.nodeValue.trim());
        if (!own) return;
        const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
        if (fs < 12) sbad.push(el.textContent.trim().slice(0, 30) + ' ' + fs + 'px');
        if (+cs.opacity < 1 || alpha(cs.color) < 0.9) return;
        const bg = bgOf(el); if (!bg) return;
        const a = L(cs.color), b = L(bg), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        const large = fs >= 18 || (fs >= 14 && +cs.fontWeight >= 600);
        if (ratio < (large ? 3 : 4.5)) cbad.push(el.textContent.trim().slice(0, 30) + ' ' + ratio.toFixed(2) + ' ' + cs.color + '/' + bg);
      });
      document.querySelectorAll('#view button, #view a.btn').forEach(b => { if (b.offsetParent && !b.textContent.trim() && !b.getAttribute('aria-label')) abad.push(b.outerHTML.slice(0, 80)); });
      const hdr = Array.from(document.querySelectorAll('#view .page-actions')).map(box => Array.from(box.children).filter(e => e.matches('.btn, .gate-inline, .forbidden-chip') && e.offsetParent).length);
      return { cbad: cbad.slice(0, 3), sbad: sbad.slice(0, 3), abad: abad.slice(0, 3), hdr: Math.max(0, ...hdr) };
    });
    if (r.cbad.length) contrastBad.push({ s: s.id, x: r.cbad });
    if (r.sbad.length) smallBad.push({ s: s.id, x: r.sbad });
    if (r.abad.length) ariaBad.push({ s: s.id, x: r.abad });
    if (r.hdr > 3) headerBad.push({ s: s.id, n: r.hdr });
  }
  check('UI-STD-03 contrast', !contrastBad.length, contrastBad.slice(0, 8));
  check('UI-STD-04 font≥12', !smallBad.length, smallBad.slice(0, 8));
  check('UI-STD-05 icon-label', !ariaBad.length, ariaBad.slice(0, 8));
  check('UI-STD-06 header≤3', !headerBad.length, headerBad);
  await go({ id: 'INV-03', param: 'INV-2610-302T17' });
  const menu = await read(() => ({ items: document.querySelectorAll('.page-actions .action-pop .menu-item').length, btn: !!document.querySelector('.page-actions [data-act="amenu.toggle"][aria-haspopup="menu"]') }));
  await page.click('.page-actions [data-act="amenu.toggle"]'); await page.waitForTimeout(100);
  const opened = await read(() => ({ open: !document.querySelector('.page-actions .action-pop').hidden, focus: document.activeElement.classList.contains('menu-item') }));
  await page.keyboard.press('Escape'); await page.waitForTimeout(80);
  const closed = await read(() => document.querySelector('.page-actions .action-pop').hidden && document.activeElement.matches('[data-act="amenu.toggle"]'));
  check('UI-STD-07 overflow-menu', menu.items >= 2 && menu.btn && opened.open && opened.focus && closed, { menu, opened, closed });

  // UI-STD-08 — danh sách: tìm kiếm + phân trang/empty; cột trạng thái có tiêu đề; cột thao tác ở cuối
  const lists = ['OWN-01', 'BLD-01', 'ROOM-01', 'CUS-01', 'CON-01', 'INV-02', 'PAY-01', 'EXP-01'];
  const listBad = [];
  for (const id of lists) {
    await go({ id });
    const r = await read(() => {
      const view = document.getElementById('view'), table = view.querySelector('.table-wrap table');
      const heads = table ? Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim()) : [];
      const emptyMid = heads.slice(0, -1).some(h => !h);
      return { search: !!view.querySelector('input[type="search"]'), pager: !!view.querySelector('.pager') || !!view.querySelector('.state'), emptyMid };
    });
    if (!r.search || !r.pager || r.emptyMid) listBad.push({ id, ...r });
  }
  check('UI-STD-08 lists', !listBad.length, listBad);

  // UI-STD-09 — form: gửi trống → lỗi tại field (aria-invalid), không toast lỗi
  const formBad = [];
  const forms = [['bld.add', 'bld.save', 'BLD-01'], ['room.add', 'room.save', 'ROOM-01'], ['exp.new', 'exp.save', 'EXP-01'], ['mtr.fee', 'mtr.feeSave', 'METER-01'], ['adj.new', 'adj.save', 'INV-01']];
  for (const [open, save, sc] of forms) {
    await reset('D', false); await go({ id: sc });
    const r = await read(([o, sv]) => {
      document.querySelectorAll('.toast').forEach(t => t.remove());
      if (!TH.act[o]) return { missing: o };
      TH.act[o]({ dataset: { id: 'new' } });
      const btn = document.querySelector('[role=dialog] [data-act="' + sv + '"]');
      if (!btn) return { missing: sv };
      btn.click();
      return { invalid: document.querySelectorAll('[role=dialog] [aria-invalid="true"]').length, err: document.querySelectorAll('[role=dialog] .field-error').length, toast: document.querySelectorAll('.toast-danger').length };
    }, [open, save]);
    if (r.missing || !r.invalid || !r.err || r.toast) formBad.push({ open, ...r });
  }
  // Form phụ: kỳ trả chủ nhà (số tiền 0), từ chối báo thu không lý do → lỗi tại field, phiếu vẫn chờ
  await reset('D', false); await go({ id: 'BLD-02', param: 'T17' });
  const extra = await read(() => {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const inv = () => [...document.querySelectorAll('[role=dialog] [aria-invalid="true"]')].map(e => e.id);
    TH.act['lpay.add']({ dataset: { b: 'T17' } }); TH.store.setDraft('lpay-T17', 'amount', '0');
    document.querySelector('[role=dialog] [data-act="lpay.save"]').click();
    const lpay = inv(); TH.modal.stack.slice().forEach(m => TH.modal.close(m.key, { silent: true }));
    const rc = TH.db.receipts.find(x => x.status === 'pending'); location.hash = TH.router.href('PAY-APP', rc.id);
    return { lpay, rc: rc.id, toast: document.querySelectorAll('.toast-danger').length };
  });
  await page.waitForTimeout(200);
  const rej = await read(id => { document.querySelector('[role=dialog] [data-act="app.reject"]').click(); return { inv: [...document.querySelectorAll('[role=dialog] [aria-invalid="true"]')].map(e => e.id), status: TH.db.receipts.find(x => x.id === id).status, toast: document.querySelectorAll('.toast-danger').length }; }, extra.rc);
  if (!extra.lpay.includes('f-lpay-T17-amount') || extra.toast) formBad.push({ form: 'lpay', ...extra });
  if (!rej.inv.length || rej.status !== 'pending' || rej.toast) formBad.push({ form: 'app.reject', ...rej });
  check('UI-STD-09 field-errors', !formBad.length, formBad);

  // UI-STD-12 — gói A: các gate khóa liền nhau trong cột dọc được gom thành 1 thẻ, nút vẫn mở màn nâng gói
  await reset('A', false);
  const gateBad = [];
  for (const id of ['INV-01', 'OA-01', 'RPT-03']) {
    await go({ id });
    const g = await read(() => ({ groups: document.querySelectorAll('#view .gate-group').length, items: document.querySelectorAll('#view .gate-group-item[data-locked]').length, loose: document.querySelectorAll('#view .stack > .gate-locked + .gate-locked').length }));
    if (!g.groups || g.items < 2 || g.loose) gateBad.push({ id, ...g });
  }
  await go({ id: 'INV-01' }); await page.click('#view .gate-group-item');
  await page.waitForTimeout(200);
  const upg = await read(() => !!document.querySelector('[role=dialog]'));
  check('UI-STD-12 gate-group', !gateBad.length && upg, { gateBad, upg });

  // UI-STD-10 — trạng thái thống nhất: chưa thu = cảnh báo, từ chối = nguy hiểm; detail có dải facts
  await reset('D', false);
  const st = await read(() => ({ unpaid: TH.status('unpaid'), bill: TH.statusOf('bill', 'unpaid'), rej: TH.statusOf('adjust', 'rejected') }));
  const facts = [];
  for (const s of [{ id: 'CUS-02', param: 'HĐ-101T17/25' }, { id: 'CON-02', param: 'HĐ-101T17/25' }, { id: 'ROOM-02', param: '201T17' }, { id: 'BLD-02', param: 'T17' }, { id: 'OWN-02', param: 'CN-001' }]) {
    await go(s); facts.push(await read(() => ({ facts: document.querySelectorAll('#view .detail-facts > div').length, tabCard: !!document.querySelector('#view .tab-card .tabs'), crumbs: document.querySelectorAll('#view .crumbs > a, #view .crumbs > span').length })));
  }
  check('UI-STD-10 status+detail', /badge-warning/.test(st.unpaid) && /badge-warning/.test(st.bill) && /badge-danger/.test(st.rej) && facts.every(f => f.facts >= 4 && f.tabCard && f.crumbs <= 2), { st, facts });

  // UI-STD-11 — không cuộn ngang trang ở 375 / 768 / 1440 (bảng rộng cuộn trong vùng riêng)
  const over = [];
  for (const w of [375, 768, 1440]) {
    await page.setViewportSize({ width: w, height: 860 });
    for (const s of screens) { await go(s); const d = await read(() => document.documentElement.scrollWidth - window.innerWidth); if (d > 0) over.push(s.id + '@' + w + ':' + d); }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  check('UI-STD-11 no-hscroll', !over.length, over.slice(0, 10));

  // ---------- CR-UI-ENT + CR-UI-THEME: topbar trắng, cột thương hiệu + sidebar navy ----------
  const hex2rgb = h => { const v = h.trim().replace('#', ''); return 'rgb(' + [0, 2, 4].map(i => parseInt(v.substr(i, 2), 16)).join(', ') + ')'; };
  await page.setViewportSize({ width: 1440, height: 900 }); await reset('D', false); await go({ id: 'INV-02' });
  const ent = await read(() => {
    const cs = (el, p) => el ? getComputedStyle(el)[p] : null, root = getComputedStyle(document.documentElement);
    const tb = document.querySelector('.topbar'), r = tb.getBoundingClientRect();
    const L = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    /* hàng 1 dòng = --row-h 40: đo hàng tiêu đề (luôn 1 dòng) và padding ô thân bảng */
    const row = document.querySelector('#view .table thead tr').getBoundingClientRect().height, tdPad = cs(document.querySelector('#view .table tbody td'), 'paddingTop');
    return {
      header: { pos: cs(tb, 'position'), left: r.left, width: r.width, top: r.top, bg: cs(tb, 'backgroundColor'), brand: !!document.querySelector('.topbar-brand') && document.querySelector('.topbar-brand').offsetWidth > 0,
        contrastFg: ratio(cs(tb, 'color'), cs(tb, 'backgroundColor')), sbBrandHidden: cs(document.querySelector('#sidebar .brand'), 'display') === 'none' },
      headerBgToken: root.getPropertyValue('--header-bg'), layoutToken: root.getPropertyValue('--bg-layout'),
      /* sidebar navy: chữ mục thường/đang chọn/đếm và cột thương hiệu đạt ≥ 4.5:1 (chữ bán trong suốt được trộn với nền) */
      sider: (() => {
        const sb = document.getElementById('sidebar'), bg = cs(sb, 'backgroundColor');
        const mix = (fg, base) => { const f = fg.match(/[\d.]+/g).map(Number), b = base.match(/[\d.]+/g).map(Number), a = f.length > 3 ? f[3] : 1; return 'rgb(' + [0, 1, 2].map(i => Math.round(f[i] * a + b[i] * (1 - a))).join(', ') + ')'; };
        const pair = el => { if (!el) return null; let b = cs(el, 'backgroundColor'); if (/rgba\(.*, 0\)$/.test(b) || b === 'transparent') b = bg; else b = mix(b, bg); return Math.round(ratio(mix(cs(el, 'color'), b), b) * 100) / 100; };
        const brand = document.querySelector('.topbar-brand');
        return { bg, token: root.getPropertyValue('--sider-bg'), item: pair(sb.querySelector('.nav-item:not([aria-current])')), active: pair(sb.querySelector('.nav-item[aria-current="page"]')),
          count: pair(sb.querySelector('.nav-count')), brandBg: cs(brand, 'backgroundColor'), brand: pair(brand) };
      })(),
      content: { radius: cs(document.getElementById('view'), 'borderTopLeftRadius'), shellBg: cs(document.getElementById('shell'), 'backgroundColor') },
      card: cs(document.querySelector('#view .card'), 'borderTopLeftRadius'),
      sizes: { btn: document.querySelector('#view .page-actions .btn')?.getBoundingClientRect().height, input: document.querySelector('#view .toolbar .input')?.getBoundingClientRect().height,
        title: cs(document.querySelector('#view .page-title'), 'fontSize'), kpi: cs(document.querySelector('#view .kpi-value'), 'fontSize'), headRow: row, tdPad },
      order: (() => { const h = document.querySelector('#view > .page-hd'), w = document.querySelector('#view > .workspace-navigation'); return h && w ? h.getBoundingClientRect().top < w.getBoundingClientRect().top : false; })(),
      crumbs: document.querySelector('#view > .page-hd .crumbs')?.innerText.replace(/\s+/g, ' ').trim(),
    };
  });
  check('UI-ENT-01 header', ent.header.pos === 'fixed' && ent.header.left === 0 && ent.header.top === 0 && ent.header.width >= 1400 && ent.header.bg === hex2rgb(ent.headerBgToken) && ent.header.brand && ent.header.sbBrandHidden && ent.header.contrastFg >= 7, ent.header);
  check('UI-THEME-01 sider-navy', ent.sider.bg === hex2rgb(ent.sider.token) && ent.sider.brandBg === ent.sider.bg && [ent.sider.item, ent.sider.active, ent.sider.brand].every(v => v >= 4.5) && (ent.sider.count === null || ent.sider.count >= 4.5), ent.sider);
  check('UI-ENT-02 layout+card', ent.content.radius === '0px' && ent.content.shellBg === hex2rgb(ent.layoutToken) && ent.card === '8px', { ...ent.content, card: ent.card });
  check('UI-ENT-03 sizes', Math.round(ent.sizes.btn) === 32 && Math.round(ent.sizes.input) === 32 && ent.sizes.title === '20px' && ent.sizes.kpi === '24px' && ent.sizes.headRow <= 41 && ent.sizes.tdPad === '6px', ent.sizes);
  await go({ id: 'CUS-01' }); await page.waitForTimeout(50);
  const cusCrumb = await read(() => document.querySelector('#view > .page-hd .crumbs')?.innerText.replace(/\s+/g, ' ').trim());
  check('UI-ENT-04 page-header', ent.order && /Hóa đơn & thu tiền/.test(ent.crumbs || '') && /Hóa đơn$/.test(ent.crumbs || '') && !!cusCrumb, { order: ent.order, inv: ent.crumbs, cus: cusCrumb });
  const dupBad = [];
  for (const id of ['RPT-01', 'RPT-02', 'RPT-03']) { await go({ id }); const n = await read(() => document.querySelectorAll('#view [data-global]').length); if (n) dupBad.push(id + ':' + n); }
  check('UI-ENT-05 no-dup-scope', !dupBad.length, dupBad);
  await page.setViewportSize({ width: 375, height: 812 }); await go({ id: 'INV-02' });
  const mob = await read(() => ({ bg: getComputedStyle(document.querySelector('.topbar')).backgroundColor, over: document.documentElement.scrollWidth - innerWidth }));
  /* tab headless không chạy khung hình → transition trượt drawer đứng yên; đo ở reduced-motion */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.click('.menu-toggle'); await page.waitForTimeout(300);
  const drw = await read(() => { const b = document.querySelector('#sidebar .brand'); const r = b.getBoundingClientRect(); return { brand: getComputedStyle(b).display !== 'none' && r.width > 0 && r.left >= 0, open: document.getElementById('shell').classList.contains('nav-open') }; });
  await page.keyboard.press('Escape'); await page.emulateMedia({ reducedMotion: null }); await page.setViewportSize({ width: 1440, height: 900 });
  check('UI-ENT-06 mobile', mob.bg === hex2rgb(ent.headerBgToken) && mob.over <= 0 && drw.brand && drw.open, { mob, drw });

  const smoke = await read(() => { TH.db = TH.seed(); Object.assign(TH.store.state, { building: 'ALL', ui: {}, drafts: {}, editing: null, role: 'admin', pkg: 'D', reviewMode: false }); const r = TH.qaSmoke(); TH.store.flush(); TH.app.refresh(); return { total: r.total, fails: r.fails.length }; });
  check('SMOKE', smoke.total >= 1048 && smoke.fails === 0 && !errors.length, { smoke, errors: errors.slice(0, 3) });
  return { passed: results.length, results };
}
