/* Khởi tạo, app shell (sidebar/topbar), điều phối render, sự kiện delegation, công cụ demo. */
var TH = window.TH = window.TH || {};

(function () {
  var I = TH.icon, esc = TH.esc;

  var NAV = [
    { label: 'Tổng quan', items: [['RPT-01', 'dashboard', 'Tổng quan · Báo cáo tòa']] },
    { label: 'Dữ liệu gốc', items: [['OWN-01', 'owner', 'Chủ nhà'], ['BLD-01', 'building', 'Tòa nhà'], ['ROOM-01', 'door', 'Phòng'], ['CUS-01', 'user', 'Khách thuê'], ['CON-01', 'contract', 'Hợp đồng'], ['CON-03', 'fileClock', 'HĐ sắp hết hạn', function () { return TH.calc.expiring(TH.expiryDays(), TH.scope()).length; }]] },
    { label: 'Vận hành kỳ', items: [['METER-01', 'zap', 'Điện nước', function () { return TH.db.readings.filter(function (r) { return r.period === TH.store.state.period && r.status !== 'confirmed' && TH.inScope(TH.calc.room(r.roomId).buildingId); }).length; }], ['INV-01', 'receipt', 'Lập hóa đơn'], ['INV-02', 'invoiceList', 'Hóa đơn & công nợ'], ['OA-01', 'send', 'Zalo OA'], ['OA-02', 'message', 'Lịch sử Zalo']] },
    { label: 'Thu chi', items: [['PAY-01', 'handCoins', 'Báo đã thu', function () { return TH.db.receipts.filter(function (r) { return r.status === 'pending' && TH.inScope(TH.calc.invoice(r.invoiceId).buildingId); }).length; }], ['PAY-02', 'wallet', 'Công nợ & mốc 5/10/15'], ['EXP-01', 'expense', 'Chi phí']] },
    { label: 'Nhân sự & lợi nhuận', items: [['HR-01', 'briefcase', 'Nhân sự & đội nhóm'], ['SAL-01', 'calculator', 'Lương nháp'], ['SHARE-01', 'pie', 'Cổ phần theo tòa']] },
    { label: 'Báo cáo', items: [['RPT-04', 'building', 'Doanh thu theo tòa'], ['RPT-05', 'chart', 'Báo cáo kinh doanh tháng'], ['RPT-02', 'trend', 'Kinh doanh & hiệu suất'], ['RPT-03', 'sheet', 'Lương & chia lợi nhuận']] },
    { label: 'Hệ thống', items: [['SYS-01', 'shield', 'Phân quyền & phạm vi'], ['AUTH-01', 'login', 'Đăng nhập / đổi đơn vị']] },
  ];
  var NAV_PARENT = { 'OWN-02': 'OWN-01', 'BLD-02': 'BLD-01', 'ROOM-02': 'ROOM-01', 'CUS-02': 'CUS-01', 'CON-02': 'CON-01', 'INV-03': 'INV-02' };

  var app = TH.app = { route: null, prevHash: null, shellReady: false };

  /* ---------------- Shell ---------------- */
  function shellHtml() {
    return '<div class="shell" id="shell">' +
      '<aside class="sidebar" id="sidebar" aria-label="Điều hướng phân hệ">' +
      '<a class="brand" href="#/" aria-label="TIMEHOUSE — về trang giới thiệu"><span class="brand-mark">' + I('logo') + '</span><span><div class="brand-name">TIMEHOUSE</div><div class="brand-sub">Quản lý vận hành tòa nhà</div></span></a>' +
      '<nav class="nav" id="nav"></nav>' +
      '<div class="sidebar-foot"><div class="draft-stamp">' + I('stamp', 'ic-sm') + '<span><b>DESIGN DRAFT</b><br>Dữ liệu minh họa · không phải bản nghiệm thu</span></div>' +
      '<a class="nav-item" href="#/demo/screens">' + I('grid') + '<span class="nav-text">Mục lục 39 màn</span></a></div>' +
      '</aside>' +
      '<div class="main"><header class="topbar" id="topbar"></header><main class="content" id="view" tabindex="-1"></main></div>' +
      '</div>';
  }
  function renderNav(active) {
    var html = NAV.map(function (g) {
      return '<div class="nav-group"><div class="nav-label">' + esc(g.label) + '</div>' + g.items.map(function (it) {
        var cnt = it[3] ? it[3]() : 0;
        var forbidden = !TH.canScreen(it[0]);
        return '<a class="nav-item" href="' + TH.router.href(it[0]) + '"' + (it[0] === active ? ' aria-current="page"' : '') + (forbidden ? ' data-tip="403 · Vai trò hiện tại không có quyền mở màn này"' : '') + '>' + I(it[1]) + '<span class="nav-text">' + esc(it[2]) + '</span>' +
          (forbidden ? I('ban', 'ic-sm') : cnt ? '<span class="nav-count">' + cnt + '</span>' : '') + '</a>';
      }).join('') + '</div>';
    }).join('');
    document.getElementById('nav').innerHTML = html;
  }
  function renderTopbar() {
    var s = TH.store.state, p = TH.PACKAGES[s.pkg], role = TH.ROLES[s.role], me = TH.me();
    var bOpts = TH.buildingOptions();
    var scope = TH.scope();
    var initials = me.name.split(' ').slice(-2).map(function (w) { return w[0]; }).join('');
    document.getElementById('topbar').innerHTML =
      '<button type="button" class="btn btn-ghost btn-icon menu-toggle" data-act="nav.toggle" aria-label="Mở menu">' + I('menu') + '</button>' +
      '<div class="topbar-search"><div class="input-wrap">' + I('search') + '<label class="sr-only" for="gsearch">Tìm màn, phòng, khách, hóa đơn</label><input id="gsearch" class="input" type="search" placeholder="Tìm màn, phòng, khách, hóa đơn…" autocomplete="off"></div><kbd>/</kbd><div class="search-results" id="gresults" hidden></div></div>' +
      '<div class="grow"></div>' +
      '<div class="scope-group"><label class="sr-only" for="scope-b">Scope tòa</label><select id="scope-b" class="select scope-building" data-global="building">' +
      bOpts.map(function (o) { return '<option value="' + o.id + '"' + (o.id === scope ? ' selected' : '') + '>' + esc(o.label) + '</option>'; }).join('') + '</select>' +
      '<label class="sr-only" for="scope-p">Kỳ</label><select id="scope-p" class="select scope-period" data-global="period">' +
      TH.PERIODS.slice().reverse().map(function (pp) { return '<option value="' + pp + '"' + (pp === s.period ? ' selected' : '') + '>Kỳ ' + TH.fmt.period(pp) + (pp === TH.CURRENT_PERIOD ? ' · đang mở' : TH.db.periodLocks[pp] ? ' · đã khóa' : '') + '</option>'; }).join('') + '</select></div>' +
      '<button type="button" class="pkg-btn" id="pkg-btn" data-act="pkg.open" aria-haspopup="dialog" data-tip="Cấu hình hiển thị gói (DEMO-PKG-01) — chế độ xem phạm vi báo giá, không đổi quyền/dữ liệu">' + I('settings', 'ic-sm') + '<span>Đang xem:</span><span class="pkg-key">' + p.key + '</span><span>' + p.name + '</span><span class="pkg-price">(' + p.price + ')</span></button>' +
      '<button type="button" class="btn btn-ghost btn-icon" data-act="tools.open" aria-label="Công cụ demo" data-tip="Công cụ demo: vai trò giả lập, trạng thái dữ liệu, khôi phục">' + I('sliders') + '</button>' +
      '<button type="button" class="user-chip" data-act="role.menu" aria-haspopup="menu" data-tip="' + esc(me.name + ' · ' + role.label) + '"><span class="avatar">' + esc(initials) + '</span><span class="u-text"><div class="u-name">' + esc(role.label) + '</div><div class="u-role">Vai trò giả lập</div></span>' + I('chevronDown', 'ic-sm') + '</button>';
  }

  /* ---------------- Render ---------------- */
  /* Chống render lồng nhau: thay DOM làm input đang focus blur → change → refresh lại giữa chừng. */
  function guarded(kind, fn) {
    if (app._busy) { app._pending = app._pending === 'render' ? 'render' : kind; return; }
    app._busy = true;
    try { fn(); } finally {
      app._busy = false;
      if (app._pending) { var p = app._pending; app._pending = null; setTimeout(function () { if (p === 'render') app.render(); else app.refresh(); }, 0); }
    }
  }
  app.render = function () { guarded('render', renderCore); };
  function renderCore() {
    var r = TH.router.parse();
    var navigated = !app.route || location.hash !== app.prevHash;
    app.route = r;
    var root = document.getElementById('app');
    TH.hideTip();
    if (r.landing) {
      closeRouteModals(null);
      app.shellReady = false;
      root.innerHTML = TH.views.landing.render();
      document.title = 'TIMEHOUSE — Bản demo quản lý vận hành tòa nhà';
      if (navigated) window.scrollTo(0, 0);
      app.prevHash = location.hash;
      return;
    }
    if (!app.shellReady) { root.innerHTML = shellHtml(); app.shellReady = true; }
    renderChrome();
    renderPage(navigated);
    handleRouteModal(r);
    if (navigated) {
      document.getElementById('shell').classList.remove('nav-open');
      var sc = document.querySelector('.nav-scrim'); if (sc) sc.remove();
    }
    app.prevHash = location.hash;
    flushNotices();
  }
  function renderChrome() {
    var r = app.route;
    var active = r.extra ? null : (NAV_PARENT[r.page] || r.page);
    renderNav(active);
    renderTopbar();
  }
  function renderPage(navigated) {
    var r = app.route, view = document.getElementById('view');
    var ae = document.activeElement, aid = ae && view.contains(ae) ? ae.id : null;
    var sel = aid && ae.selectionStart !== undefined && ae.type !== 'number' ? [ae.selectionStart, ae.selectionEnd] : null;
    var html;
    if (r.notFound) {
      html = TH.state('empty', { title: 'Không tìm thấy màn “' + esc(r.slug) + '”', text: 'Liên kết không hợp lệ. Mở <a href="#/demo/screens">Mục lục 39 màn</a> để chọn màn đúng.' });
      document.title = 'Không tìm thấy — TIMEHOUSE';
    } else if (r.extra) {
      html = TH.views[r.extra].render(r);
      document.title = TH.EXTRA_ROUTES[r.extra] + ' — TIMEHOUSE demo';
    } else {
      var id = r.page, sc = TH.screen(id), v = TH.views[id];
      document.title = id + ' · ' + sc.title + ' — TIMEHOUSE demo';
      var ds = TH.store.state.dataState[id];
      if (!TH.canScreen(id)) {
        html = TH.pageHeader({ screen: id }) + '<div class="card">' + TH.state('forbidden', { action: '<button class="btn btn-sm" data-act="tools.open">' + I('sliders', 'ic-sm') + 'Đổi vai trò giả lập</button>' }) + '</div>';
      } else if (ds && ds !== 'normal') {
        var banner = '<div class="state-banner">' + I('beaker', 'ic-sm') + '<span>Đang mô phỏng trạng thái dữ liệu: <b>' + { loading: 'Đang tải', empty: 'Không có dữ liệu', error: 'Lỗi API' }[ds] + '</b> (công cụ demo).</span><button type="button" class="btn btn-sm" data-act="state.clear" data-screen="' + id + '">Về dữ liệu mẫu</button></div>';
        var body = ds === 'loading' ? TH.loadingSkeleton() : '<div class="card">' + TH.state(ds, ds === 'error' ? { action: '<button class="btn btn-sm" data-act="state.clear" data-screen="' + id + '">' + I('refresh', 'ic-sm') + 'Thử lại</button>' } : {}) + '</div>';
        html = TH.pageHeader({ screen: id }) + banner + body;
      } else if (v) {
        html = v.render(r);
      } else {
        html = TH.pageHeader({ screen: id }) + '<div class="card">' + TH.state('empty', { title: 'Màn đang hoàn thiện' }) + '</div>';
      }
    }
    view.innerHTML = html;
    if (navigated) {
      view.classList.remove('is-entering'); void view.offsetWidth; view.classList.add('is-entering');
      window.scrollTo(0, 0);
    }
    if (aid) {
      var n = document.getElementById(aid);
      if (n) { n.focus({ preventScroll: true }); if (sel && n.setSelectionRange) try { n.setSelectionRange(sel[0], sel[1]); } catch (e) { /* noop */ } }
    }
    var v2 = r.page && TH.views[r.page];
    if (v2 && v2.mounted) v2.mounted(view, r);
  }
  function closeRouteModals(keep) {
    TH.modal.stack.slice().forEach(function (m) { if (m.key.indexOf('route:') === 0 && m.key !== keep) TH.modal.close(m.key, { silent: true, noFocus: true }); });
  }
  function handleRouteModal(r) {
    if (!r.base) { closeRouteModals(null); return; }
    var key = 'route:' + r.screen + ':' + (r.param || '');
    closeRouteModals(key);
    var v = TH.views[r.screen] || {};
    var spec = {
      key: key, size: (v.modal && v.modal.size) || 'lg', kind: v.modal && v.modal.kind,
      render: function () {
        if (!TH.canScreen(r.screen)) return { title: esc(TH.screen(r.screen).title) + ' <span class="screen-id">' + r.screen + '</span>', body: TH.state('forbidden'), foot: '<button class="btn" data-close>Đóng</button>' };
        return v.render ? v.render(r) : { title: r.screen, body: TH.state('empty', { title: 'Đang hoàn thiện' }) };
      },
      onClose: function () {
        var baseHref = TH.router.href(r.base);
        if (app.cameFrom === baseHref) history.back(); else TH.router.go(baseHref, { replace: true });
      },
    };
    if (TH.modal.isOpen(key)) { TH.modal.stack.find(function (m) { return m.key === key; }).spec = spec; TH.modal.rerenderAll(); }
    else TH.modal.open(spec);
  }
  /* Re-render tại chỗ (đổi gói, đổi dữ liệu) — giữ focus, cuộn, modal đang mở. */
  app.refresh = function () {
    if (!app.route || app.route.landing) { if (app.route) app.render(); return; }
    guarded('refresh', function () {
      renderChrome();
      renderPage(false);
      TH.modal.rerenderAll();
      flushNotices();
    });
  };
  function flushNotices() {
    var seen = {};
    TH.notices.splice(0).forEach(function (n) { if (seen[n.title + n.msg]) return; seen[n.title + n.msg] = 1; TH.toast(n.title, esc(n.msg), 'info'); });
  }

  /* ---------------- Package ---------------- */
  app.guard = null; // view đặt { tier, dirty, label } khi đang mở panel nâng cao có dữ liệu nháp
  app.setPackage = function (p, opts) {
    opts = opts || {};
    var cur = TH.store.state.pkg;
    if (p === cur) return Promise.resolve(false);
    var g = app.guard;
    var go = function () {
      TH.store.setPkg(p);
      app.refresh();
      var btn = document.getElementById('pkg-btn');
      if (btn) { btn.classList.remove('is-flash'); void btn.offsetWidth; btn.classList.add('is-flash'); }
      if (!opts.silent) TH.toast('Đang xem ' + TH.PACKAGES[p].name + ' · ' + TH.PACKAGES[p].price, 'Chỉ đổi phạm vi hiển thị; vai trò, dữ liệu và bản nháp được giữ nguyên.', 'info');
      return true;
    };
    if (g && g.dirty && TH.PACKAGES[p].level < TH.PACKAGES[g.tier].level) {
      return TH.confirm({
        title: 'Đổi sang ' + TH.PACKAGES[p].name + '?',
        body: '<p>Panel <b>' + esc(g.label) + '</b> là nâng cấp từ gói ' + g.tier + ' và đang có dữ liệu chưa lưu.</p><p>Bản nháp được giữ lại trong trình duyệt và hiện lại khi quay về gói ' + g.tier + '. Panel sẽ đóng/chuyển về phần cơ bản.</p>',
        ok: 'Giữ nháp & đổi gói',
      }).then(function (ok) { return ok ? go() : false; });
    }
    return Promise.resolve(go());
  };

  /* ---------------- Upgrade dialog (click phần khóa) ---------------- */
  function openUpgrade(incId) {
    var inc = TH.inc(incId), p = TH.PACKAGES[inc.tier], f = inc.feature;
    TH.modal.open({
      key: 'upgrade', size: 'sm', z: 40,
      render: function () {
        return {
          title: I('lock') + ' Nâng cấp từ ' + p.name,
          sub: p.price + ' · ' + p.mode,
          body: '<div class="stack">' +
            '<div><div class="section-title">' + esc(f.id + ' · ' + f.module) + '</div><div class="strong" style="font-size:15px">' + esc(f.name) + '</div></div>' +
            '<div class="screen-inc">' + TH.tierPill(inc.tier) + '<span><b>Phần nâng cấp:</b> ' + esc(inc.text) + '</span></div>' +
            '<div class="screen-inc">' + TH.tierPill('A') + '<span><b>Phần lõi vẫn dùng được ở mọi gói:</b> ' + esc(f.A) + '</span></div>' +
            (f.limit ? '<div class="alert alert-draft">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Giới hạn/điều kiện</b><span>' + esc(f.limit) + '</span></div></div>' : '') +
            '<div class="alert alert-neutral">' + I('info', 'ic-sm') + '<div class="alert-body">Đây là chế độ xem phạm vi báo giá. Chọn “Xem thử” chỉ đổi gói đang xem trên prototype — không phát sinh thanh toán, không đổi quyền hay dữ liệu.</div></div></div>',
          foot: '<button type="button" class="btn" data-close>Đóng</button><button type="button" class="btn btn-primary" data-act="pkg.try" data-pkg="' + inc.tier + '" autofocus>' + I('eye', 'ic-sm') + 'Xem thử ' + p.name + '</button>',
        };
      },
    });
  }

  /* ---------------- Built-in actions ---------------- */
  var A = TH.act;
  A['ui.set'] = function (el) {
    var apply = function () {
      TH.store.setUi(el.dataset.screen, el.dataset.key, el.dataset.val);
      if (el.dataset.resetPage) TH.store.setUi(el.dataset.screen, 'page', 1);
      app.refresh();
    };
    /* Đổi tab khi đang sửa một nhóm thông tin → hỏi lưu/bỏ/tiếp tục (note.md §7.1) */
    if (el.dataset.key === 'tab' && TH.editing()) { TH.editGuard.run(apply); return; }
    apply();
  };
  /* Sửa inline theo nhóm: Chỉnh sửa / Lưu thay đổi / Hủy */
  A['sec.edit'] = function (el) {
    var key = el.dataset.key, id = el.dataset.id;
    TH.editGuard.run(function () {
      TH.store.clearDraft(TH.secForm(key, id));
      TH.store.state.editing = { key: key, id: id };
      app.refresh();
      setTimeout(function () { var c = document.getElementById('sec-' + key + '-' + id); var f = c && c.querySelector('input:not([readonly]),select,textarea'); if (f) f.focus({ preventScroll: true }); }, 30);
    });
  };
  A['sec.save'] = function () { TH.sectionSave(); };
  A['sec.cancel'] = function () { var had = TH.editGuard.dirty(); TH.sectionEnd(); if (had) TH.toast('Đã hủy chỉnh sửa', 'Giữ nguyên dữ liệu đã lưu trước đó.', 'info'); };
  A['unsaved.pick'] = function (el) {
    var ov = el.closest('.overlay');
    var m = TH.modal.stack.find(function (x) { return x.el === ov; });
    if (ov && ov._resolve) ov._resolve(el.dataset.val);
    if (m) TH.modal.close(m.key, { silent: true });
  };
  A['ui.page'] = function (el) { TH.store.setUi(el.dataset.screen, 'page', +el.dataset.val); app.refresh(); };
  A['go'] = function (el) { TH.router.go(el.dataset.href); };
  A['nav.toggle'] = function () {
    var sh = document.getElementById('shell');
    var open = !sh.classList.contains('nav-open');
    sh.classList.toggle('nav-open', open);
    var sc = document.querySelector('.nav-scrim');
    if (open && !sc) { sc = document.createElement('div'); sc.className = 'nav-scrim'; sc.setAttribute('data-act', 'nav.toggle'); sh.appendChild(sc); }
    else if (!open && sc) sc.remove();
  };
  A['pkg.open'] = function () { TH.openPackageDrawer(); };
  A['pkg.try'] = function (el) { TH.modal.close('upgrade', { silent: true }); app.setPackage(el.dataset.pkg); };
  A['confirm.ok'] = function (el) {
    var ov = el.closest('.overlay');
    var m = TH.modal.stack.find(function (x) { return x.el === ov; });
    if (ov && ov._resolve) ov._resolve(true);
    if (m) TH.modal.close(m.key, { silent: true });
  };
  A['state.clear'] = function (el) { delete TH.store.state.dataState[el.dataset.screen]; app.refresh(); };
  A['print'] = function () { window.print(); };

  A['role.menu'] = function (el) {
    var r = el.getBoundingClientRect();
    var pop = document.createElement('div');
    pop.className = 'popover'; pop.setAttribute('role', 'menu');
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.right = (window.innerWidth - r.right) + 'px';
    pop.innerHTML = '<div class="menu-label">Vai trò giả lập</div>' + Object.keys(TH.ROLES).map(function (k) {
      var ro = TH.ROLES[k], st = TH.calc.staff(ro.staffId);
      return '<button type="button" class="menu-item" role="menuitemradio" aria-checked="' + (k === TH.store.state.role) + '" data-act="role.set" data-val="' + k + '">' + I(k === TH.store.state.role ? 'checkCircle' : 'user', 'ic-sm') + '<span><b>' + esc(ro.label) + '</b><br><span class="small muted">' + esc(st.name) + ' · ' + (ro.scope === 'ALL' ? 'tất cả tòa' : ro.scope.length ? ro.scope.join(', ') : 'không gắn tòa') + '</span></span></button>';
    }).join('') + '<div class="menu-sep"></div><div class="small muted" style="padding:4px 10px 6px">Vai trò không đổi khi đổi gói. 403 hiển thị riêng với khóa gói.</div>';
    openPopover(pop, el);
  };
  A['role.set'] = function (el) {
    closePopover();
    TH.store.set('role', el.dataset.val);
    app.refresh();
    TH.toast('Vai trò giả lập: ' + TH.ROLES[el.dataset.val].label, 'Gói đang xem giữ nguyên ' + TH.PACKAGES[TH.store.state.pkg].name + '.', 'info');
  };

  /* ---------------- Công cụ demo ---------------- */
  A['tools.open'] = function () {
    TH.modal.open({
      key: 'tools', size: 'md',
      render: function () {
        var s = TH.store.state, r = app.route || {}, screen = r.page;
        var ds = screen ? (s.dataState[screen] || 'normal') : 'normal';
        return {
          title: I('sliders') + ' Công cụ demo',
          sub: 'Điều khiển trình diễn — không thuộc 39 màn production',
          body: '<div class="stack">' +
            '<div><div class="section-title">Vai trò giả lập</div><div class="radio-row">' + Object.keys(TH.ROLES).map(function (k) {
              return '<label class="radio-chip"><input type="radio" name="t-role" value="' + k + '"' + (k === s.role ? ' checked' : '') + ' data-act-change="role.pick"><span>' + esc(TH.ROLES[k].label) + '</span></label>';
            }).join('') + '</div><div class="field-hint" style="margin-top:6px">Quản lý tòa chỉ thấy tòa Cầu Giấy, không được tự duyệt thu (403). Nhân sự chỉ mở HR/Lương.</div></div>' +
            (screen ? '<div><div class="section-title">Trạng thái dữ liệu · ' + esc(screen) + '</div><div class="seg" role="group">' + [['normal', 'Dữ liệu mẫu'], ['loading', 'Đang tải'], ['empty', 'Không có dữ liệu'], ['error', 'Lỗi API']].map(function (o) {
              return '<button type="button" aria-pressed="' + (ds === o[0]) + '" data-act="state.set" data-screen="' + screen + '" data-val="' + o[0] + '">' + o[1] + '</button>';
            }).join('') + '</div><div class="field-hint" style="margin-top:6px">Forbidden (403) xem bằng cách đổi vai trò. Draft / Chờ xác nhận / Đã xác nhận / Success có trong luồng nghiệp vụ.</div></div>' : '') +
            '<div class="row"><a class="btn btn-sm" href="#/demo/screens" data-close>' + I('grid', 'ic-sm') + 'Mục lục 39 màn</a><a class="btn btn-sm" href="#/demo/mapping" data-close>' + I('list', 'ic-sm') + 'Kiểm đếm mapping 52 chức năng</a></div>' +
            '<div class="divider"></div><div class="row-between"><div><b>Khôi phục dữ liệu demo</b><div class="small muted">Xóa thao tác demo, bản nháp, bộ lọc. Giữ gói đang xem.</div></div><button type="button" class="btn btn-danger btn-sm" data-act="data.reset">' + I('rotateCcw', 'ic-sm') + 'Khôi phục</button></div>' +
            (TH.store.storageOk ? '' : '<div class="alert alert-warning">' + I('alert', 'ic-sm') + '<div class="alert-body">Trình duyệt chặn localStorage (file://). Trạng thái chỉ giữ trong phiên hiện tại.</div></div>') +
            '</div>',
          foot: '<button type="button" class="btn" data-close>Đóng</button>',
        };
      },
    });
  };
  A['state.set'] = function (el) { TH.store.state.dataState[el.dataset.screen] = el.dataset.val; app.refresh(); };
  A['data.reset'] = function () {
    TH.confirm({ title: 'Khôi phục dữ liệu demo?', body: '<p>Toàn bộ thao tác demo (xác nhận, nháp, bộ lọc) sẽ quay về dataset gốc. Gói đang xem được giữ.</p>', ok: 'Khôi phục', danger: true }).then(function (ok) {
      if (!ok) return;
      TH.store.reset();
      TH.modal.stack.slice().forEach(function (m) { if (m.key.indexOf('route:') !== 0) TH.modal.close(m.key, { silent: true }); });
      app.refresh();
      TH.toast('Đã khôi phục dữ liệu demo', 'Dataset, bản nháp và bộ lọc về trạng thái ban đầu.');
    });
  };
  var CHANGE = TH.onChange;
  CHANGE['role.pick'] = function (el) { TH.store.set('role', el.value); app.refresh(); };

  /* ---------------- Popover ---------------- */
  var pop = null, popOwner = null;
  function openPopover(el, owner) {
    closePopover();
    document.body.appendChild(el);
    pop = el; popOwner = owner;
    var first = el.querySelector('button'); if (first) first.focus();
  }
  function closePopover() { if (pop) { pop.remove(); pop = null; if (popOwner && popOwner.isConnected) popOwner.focus(); popOwner = null; } }
  TH.closePopover = closePopover;

  /* ---------------- Global search ---------------- */
  function searchIndex(q) {
    var out = [];
    var M = function (parts) { return TH.match(q, parts); };
    TH.SCREENS.forEach(function (s) { if (M([s.id, s.title, s.module])) out.push({ href: TH.router.href(s.id), icon: 'grid', label: s.title, meta: s.id }); });
    TH.db.rooms.forEach(function (r) { if (TH.inScope(r.buildingId) && M([r.code, 'phòng'])) out.push({ href: TH.router.href('ROOM-02', r.id), icon: 'door', label: 'Phòng ' + r.code, meta: TH.calc.building(r.buildingId).short }); });
    TH.db.customers.forEach(function (c) { if (M([c.id, c.name])) out.push({ href: TH.router.href('CUS-02', c.id), icon: 'user', label: c.name, meta: c.id }); });
    TH.db.invoices.forEach(function (i) { if (TH.inScope(i.buildingId) && q.length > 3 && M([i.id])) out.push({ href: TH.router.href('INV-03', i.id), icon: 'receipt', label: i.id, meta: TH.fmt.money(i.total) }); });
    TH.db.contracts.forEach(function (c) { if (TH.inScope(c.buildingId) && M([c.id])) out.push({ href: TH.router.href('CON-02', c.id), icon: 'contract', label: c.id, meta: c.roomId }); });
    return out.slice(0, 12);
  }
  function renderSearch(q) {
    var box = document.getElementById('gresults');
    if (!box) return;
    if (!q) { box.hidden = true; return; }
    var res = searchIndex(q);
    box.innerHTML = res.length ? res.map(function (r, i) { return '<a class="menu-item" href="' + r.href + '" data-sr="' + i + '">' + I(r.icon, 'ic-sm') + '<span>' + esc(r.label) + '</span><span class="muted">' + esc(r.meta) + '</span></a>'; }).join('') : '<div class="small muted" style="padding:10px">Không có kết quả cho “' + esc(q) + '”.</div>';
    box.hidden = false;
  }

  /* ---------------- Event delegation ---------------- */
  var debounceT = null;
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (pop && !pop.contains(t) && !(popOwner && popOwner.contains(t))) closePopover();
    var sr = document.getElementById('gresults');
    if (sr && !sr.hidden && !t.closest('.topbar-search')) sr.hidden = true;

    var locked = t.closest('[data-locked]');
    if (locked) { e.preventDefault(); openUpgrade(locked.getAttribute('data-locked')); return; }
    var closeBtn = t.closest('[data-close]');
    if (closeBtn) {
      var ov = closeBtn.closest('.overlay');
      if (ov) {
        var m = TH.modal.stack.find(function (x) { return x.el === ov; });
        if (m) { if (closeBtn.tagName === 'A') { TH.modal.close(m.key, { silent: m.key.indexOf('route:') !== 0 ? false : true }); return; } e.preventDefault(); TH.modal.close(m.key); return; }
      }
    }
    var actEl = t.closest('[data-act]');
    if (actEl && !actEl.disabled && actEl.getAttribute('aria-disabled') !== 'true') {
      var fn = TH.act[actEl.dataset.act];
      if (fn) { e.preventDefault(); fn(actEl, e); return; }
    }
    var row = t.closest('tr[data-href]');
    if (row && !t.closest('a,button,input,select,label,textarea')) { TH.router.go(row.dataset.href); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.global) {
      var gk = t.dataset.global, gv = t.value;
      if (TH.editGuard.dirty()) {
        t.value = TH.store.state[gk];
        TH.editGuard.run(function () { TH.store.set(gk, gv); app.refresh(); });
        return;
      }
      TH.store.set(gk, gv);
      app.refresh();
      return;
    }
    if (t.dataset.actChange && CHANGE[t.dataset.actChange]) { CHANGE[t.dataset.actChange](t); return; }
    if (t.dataset.ui && t.tagName === 'SELECT') {
      var p = t.dataset.ui.split('.');
      TH.store.setUi(p[0], p.slice(1).join('.'), t.value);
      if (t.dataset.resetPage) TH.store.setUi(p[0], 'page', 1);
      app.refresh();
      return;
    }
    if (t.dataset.draft) {
      var d = t.dataset.draft.split('.');
      TH.store.setDraft(d[0], d.slice(1).join('.'), t.type === 'checkbox' ? t.checked : t.value);
      // Ô nhập text có data-live đã refresh qua debounce ở sự kiện input; change (kể cả change-khi-blur) chỉ refresh cho select/checkbox/radio.
      var isText = t.tagName === 'INPUT' && !/checkbox|radio/.test(t.type);
      if (!isText) app.refresh();
    }
  });
  window.addEventListener('pagehide', function () { TH.store.flush(); });
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'gsearch') { renderSearch(t.value.trim()); return; }
    if (t.dataset.ui && t.tagName === 'INPUT') {
      var p = t.dataset.ui.split('.');
      TH.store.setUi(p[0], p.slice(1).join('.'), t.value);
      if (t.dataset.resetPage) TH.store.setUi(p[0], 'page', 1);
      clearTimeout(debounceT);
      debounceT = setTimeout(app.refresh, 160);
      return;
    }
    if (t.dataset.draft && t.type !== 'checkbox' && t.type !== 'radio' && t.tagName !== 'SELECT') {
      var d = t.dataset.draft.split('.');
      TH.store.setDraft(d[0], d.slice(1).join('.'), t.value);
      if (t.dataset.live !== undefined) { clearTimeout(debounceT); debounceT = setTimeout(app.refresh, 220); }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (pop) { closePopover(); return; }
      var sr = document.getElementById('gresults');
      if (sr && !sr.hidden) { sr.hidden = true; return; }
      var top = TH.modal.top();
      if (top) { e.preventDefault(); TH.modal.close(top.key); }
      return;
    }
    TH.modal.trap(e);
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !TH.modal.top()) {
      var g = document.getElementById('gsearch');
      if (g && g.offsetParent) { e.preventDefault(); g.focus(); }
    }
    if (e.key === 'Enter' && e.target.id === 'gsearch') {
      var first = document.querySelector('#gresults a');
      if (first) { location.hash = first.getAttribute('href'); e.target.blur(); document.getElementById('gresults').hidden = true; }
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr[data-href]')) { e.preventDefault(); TH.router.go(e.target.dataset.href); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr[data-act][tabindex]') && TH.act[e.target.dataset.act]) { e.preventDefault(); TH.act[e.target.dataset.act](e.target, e); }
  });
  window.addEventListener('hashchange', function () {
    /* Rời trang khi nhóm thông tin đang sửa còn thay đổi chưa lưu → quay lại, hỏi, rồi mới đi tiếp */
    if (TH.editing()) {
      if (TH.editGuard.dirty()) {
        var target = location.hash;
        history.replaceState(history.state, '', location.href.replace(/#.*$/, '') + (app.prevHash || '#/'));
        TH.editGuard.run(function () { location.hash = target; });
        return;
      }
      TH.sectionEnd(true);
    }
    app.cameFrom = app.prevHash;
    TH.store.syncUrl();
    app.render();
  });

  /* In PDF nội bộ: đưa tài liệu vào vùng in riêng */
  TH.printDoc = function (html) {
    var root = document.getElementById('print-root');
    if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
    root.innerHTML = html;
    document.body.classList.add('printing-doc');
    setTimeout(function () {
      window.print();
      setTimeout(function () { document.body.classList.remove('printing-doc'); }, 300);
    }, 30);
  };

  /* ---------------- Boot ---------------- */
  function boot() {
    TH.store.init();
    app.render();
    if (TH.store.state.invalidQuery) TH.toast('Gói không hợp lệ: “' + TH.store.state.invalidQuery + '”', 'Đã dùng ' + TH.PACKAGES[TH.store.state.pkg].name + ' theo thứ tự ưu tiên (lựa chọn đã lưu → D).', 'warning');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
