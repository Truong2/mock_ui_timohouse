/* CR-NAV-01: chín khu vực nghiệp vụ. Các route/Screen ID SRS giữ nguyên để deep link và QA tiếp tục hoạt động. */
(function () {
  'use strict';
  if (!window.TH || !TH.app || (TH.navigation && TH.navigation.version)) return;
  var I = TH.icon, esc = TH.esc;
  var titles = {
    'RPT-01': 'Tổng quan vận hành', 'BLD-01': 'Tòa nhà', 'ROOM-01': 'Danh sách phòng', 'OWN-01': 'Chủ nhà',
    'CUS-01': 'Hồ sơ thuê phòng', 'CON-01': 'Hợp đồng thuê phòng', 'CON-03': 'Hợp đồng sắp hết hạn',
    'METER-01': 'Chỉ số điện nước & phí dịch vụ', 'INV-01': 'Lập hóa đơn tiền thuê & dịch vụ', 'INV-02': 'Hóa đơn tiền thuê & dịch vụ',
    'PAY-01': 'Phiếu thu & đối soát', 'PAY-02': 'Thu tiền & công nợ', 'EXP-01': 'Chi phí vận hành',
    'OA-01': 'Thông báo & nhắc thanh toán', 'OA-02': 'Lịch sử gửi thông báo', 'HR-01': 'Nhân sự & phân công',
    'SAL-01': 'Bảng lương', 'SHARE-01': 'Cổ đông & phân chia lợi nhuận', 'RPT-02': 'Phân tích hiệu quả kinh doanh',
    'RPT-03': 'Tổng hợp lương & lợi nhuận', 'SYS-01': 'Cài đặt & phân quyền', 'AUTH-01': 'Tài khoản & đơn vị quản lý',
    'REPORTS': 'Báo cáo theo mẫu Excel', 'RPT-04': 'Doanh thu theo tòa', 'RPT-05': 'Báo cáo kinh doanh tháng',
  };
  var groups = [
    { id: 'overview', label: 'Tổng quan', icon: 'dashboard', sections: [
      { id: 'overview', label: 'Tổng quan', screen: 'RPT-01', routes: ['RPT-01'] },
    ] },
    { id: 'properties', label: 'Tòa nhà & phòng', icon: 'building', sections: [
      { id: 'buildings', label: 'Tòa nhà', screen: 'BLD-01', routes: ['BLD-01', 'BLD-02', 'BLD-IMP'] },
      { id: 'rooms', label: 'Phòng', screen: 'ROOM-01', routes: ['ROOM-01', 'ROOM-02', 'ROOM-IMP'] },
      { id: 'owners', label: 'Chủ nhà', screen: 'OWN-01', routes: ['OWN-01', 'OWN-02', 'OWN-IMP'] },
    ] },
    { id: 'tenancies', label: 'Khách thuê & hợp đồng', icon: 'contract', sections: [
      { id: 'customers', label: 'Khách thuê', screen: 'CUS-01', routes: ['CUS-01', 'CUS-02', 'OCR-CUS'] },
      { id: 'contracts', label: 'Hợp đồng thuê phòng', screen: 'CON-01', routes: ['CON-01', 'CON-02', 'CON-03', 'CON-FOLLOW', 'OCR-CON'] },
    ] },
    { id: 'utilities', label: 'Điện nước & dịch vụ', icon: 'zap', sections: [
      { id: 'utilities', label: 'Chỉ số & phí dịch vụ', screen: 'METER-01', routes: ['METER-01'] },
    ] },
    { id: 'billing', label: 'Hóa đơn & thu tiền', icon: 'receipt', sections: [
      { id: 'invoices', label: 'Hóa đơn', screen: 'INV-02', routes: ['INV-02', 'INV-01', 'INV-03', 'INV-PREV'] },
      { id: 'collections', label: 'Thu tiền & công nợ', screen: 'PAY-02', routes: ['PAY-02', 'PAY-01', 'PAY-APP'] },
      { id: 'notices', label: 'Nhắc thanh toán', screen: 'OA-01', routes: ['OA-01', 'OA-02'] },
    ] },
    { id: 'expenses', label: 'Chi phí vận hành', icon: 'expense', sections: [
      { id: 'expenses', label: 'Chi phí', screen: 'EXP-01', routes: ['EXP-01'] },
    ] },
    { id: 'people', label: 'Nhân sự & tiền lương', icon: 'briefcase', sections: [
      { id: 'staff', label: 'Nhân sự & phân công', screen: 'HR-01', routes: ['HR-01', 'HR-ASSIGN'] },
      { id: 'payroll', label: 'Bảng lương', screen: 'SAL-01', routes: ['SAL-01', 'SAL-ADJ'] },
    ] },
    { id: 'equity', label: 'Cổ đông & lợi nhuận', icon: 'pie', sections: [
      { id: 'equity', label: 'Cổ đông & phân chia lợi nhuận', screen: 'SHARE-01', routes: ['SHARE-01', 'SHARE-RESULT'] },
    ] },
    { id: 'reports', label: 'Báo cáo', icon: 'chart', sections: [
      { id: 'reports', label: 'Báo cáo theo mẫu Excel', screen: 'REPORTS', fallback: 'RPT-04', routes: ['REPORTS', 'RPT-04', 'RPT-05'] },
      { id: 'performance', label: 'Hiệu quả kinh doanh', screen: 'RPT-02', routes: ['RPT-02'] },
      { id: 'summary', label: 'Tổng hợp lương & lợi nhuận', screen: 'RPT-03', routes: ['RPT-03'] },
    ] },
  ];
  function screenOf(section) {
    return TH.screen(section.screen) && TH.views[section.screen] ? section.screen : section.fallback || section.screen;
  }
  function available(section) { var s = screenOf(section); return !!(TH.screen(s) && TH.views[s] && TH.canScreen(s)); }
  function visibleSections(group) { return group.sections.filter(available); }
  function locate(screen) {
    for (var i = 0; i < groups.length; i++) {
      for (var j = 0; j < groups[i].sections.length; j++) {
        if (groups[i].sections[j].routes.indexOf(screen) !== -1) return { group: groups[i], section: groups[i].sections[j] };
      }
    }
    return null;
  }
  function mobile() { return window.matchMedia('(max-width: 1080px)').matches; }
  function label(screen) { var sc = TH.screen(screen); return titles[screen] || (sc ? sc.title : screen); }
  function pendingCount(group) {
    if (!TH.db) return 0;
    if (group.id === 'tenancies') return TH.calc.expiring(TH.expiryDays(), TH.scope()).length;
    if (group.id === 'utilities') return TH.db.readings.filter(function (r) {
      var room = TH.calc.room(r.roomId);
      return room && r.period === TH.store.state.period && r.status !== 'confirmed' && TH.inScope(room.buildingId);
    }).length;
    if (group.id === 'billing') return TH.db.receipts.filter(function (r) {
      var inv = TH.calc.invoice(r.invoiceId);
      return inv && r.status === 'pending' && TH.inScope(inv.buildingId);
    }).length;
    return 0;
  }
  function link(screen, text, cls) {
    return '<a class="' + (cls || 'btn btn-sm') + '" href="' + TH.router.href(screen) + '">' + esc(text) + '</a>';
  }
  function contextActions(found, route) {
    var section = found.section.id, screen = route.screen || route.page, out = '';
    if (section === 'contracts' && TH.canScreen('CON-03')) {
      out = link(screen === 'CON-03' ? 'CON-01' : 'CON-03', screen === 'CON-03' ? 'Tất cả hợp đồng' : 'Theo dõi hết hạn');
    } else if (section === 'collections' && TH.canScreen('PAY-01') && TH.canScreen('PAY-02')) {
      out = link(screen === 'PAY-01' || screen === 'PAY-APP' ? 'PAY-02' : 'PAY-01', screen === 'PAY-01' || screen === 'PAY-APP' ? 'Theo dõi thu tiền' : 'Phiếu thu & đối soát');
    } else if (section === 'notices' && TH.canScreen('OA-02')) {
      out = link(screen === 'OA-02' ? 'OA-01' : 'OA-02', screen === 'OA-02' ? 'Gửi thông báo' : 'Lịch sử gửi');
    }
    if (section === 'invoices' && screen !== 'INV-01' && screen !== 'INV-PREV' && TH.can('invoice.draft') && TH.canScreen('INV-01')) out += link('INV-01', 'Lập hóa đơn');
    return out;
  }
  function renderWorkspace(route, found) {
    var old = document.getElementById('workspace-navigation'); if (old) old.remove();
    if (!found || route.notFound || !TH.canScreen(route.page)) return;
    var sections = visibleSections(found.group), actions = contextActions(found, route);
    // A shortcut already present in the page's actions does not need a second row in the workspace.
    if (actions) {
      var actionBox = document.createElement('div'); actionBox.innerHTML = actions;
      actionBox.querySelectorAll('a[href]').forEach(function (a) {
        var present = Array.prototype.some.call(document.querySelectorAll('#view .page-actions a[href]'), function (pageAction) { return pageAction.getAttribute('href') === a.getAttribute('href'); });
        if (present) a.remove();
      });
      actions = actionBox.innerHTML;
    }
    if (sections.length < 2 && !actions) return;
    var box = document.createElement('div'); box.id = 'workspace-navigation'; box.className = 'workspace-navigation';
    box.innerHTML = '<div class="workspace-caption">' + I(found.group.icon, 'ic-sm') + '<span>' + esc(found.group.label) + '</span></div>' +
      '<div class="workspace-row"><nav class="workspace-tabs" aria-label="Danh sách trong ' + esc(found.group.label) + '">' + sections.map(function (s) {
        return '<a href="' + TH.router.href(screenOf(s)) + '"' + (s.id === found.section.id ? ' aria-current="page"' : '') + '>' + esc(s.label) + '</a>';
      }).join('') + '</nav>' + (actions ? '<div class="workspace-actions">' + actions + '</div>' : '') + '</div>';
    var view = document.getElementById('view'), heading = view.querySelector(':scope > .page-hd');
    var returning = view.querySelector('.rptf-return');
    if (heading && !heading.querySelector('.detail-facts')) heading.insertAdjacentElement('afterend', box);
    else if (returning) returning.insertAdjacentElement('afterend', box); else view.insertBefore(box, view.firstChild);
  }
  function syncShell() {
    var shell = document.getElementById('shell'), sidebar = document.getElementById('sidebar'); if (!shell || !sidebar) return;
    var small = mobile(), open = shell.classList.contains('nav-open'), compact = !!TH.store.ui('navigation', 'collapsed', false);
    shell.classList.toggle('nav-compact', compact);
    if (!small && open) { shell.classList.remove('nav-open'); var scrim = shell.querySelector('.nav-scrim'); if (scrim) scrim.remove(); open = false; }
    document.body.classList.toggle('nav-drawer-open', small && open);
    sidebar.inert = small && !open;
    if (small && !open) sidebar.setAttribute('aria-hidden', 'true'); else sidebar.removeAttribute('aria-hidden');
    var menu = document.querySelector('.menu-toggle');
    if (menu) { menu.setAttribute('aria-controls', 'sidebar'); menu.setAttribute('aria-expanded', String(small && open)); menu.setAttribute('aria-label', small && open ? 'Đóng điều hướng' : 'Mở điều hướng'); }
    var button = document.getElementById('nav-compact-toggle');
    if (button) {
      var text = compact ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng';
      button.setAttribute('aria-label', text); button.setAttribute('title', text); button.setAttribute('aria-expanded', String(!compact));
      button.innerHTML = I(compact ? 'chevronRight' : 'chevronLeft') + '<span class="nav-text">Thu gọn</span>';
    }
    if (small && !open && sidebar.contains(document.activeElement)) document.getElementById('view').focus({ preventScroll: true });
  }
  function mount() {
    var route = TH.app.route, nav = document.getElementById('nav');
    if (!route || route.landing || !nav) { document.body.classList.remove('nav-drawer-open'); return; }
    var found = locate(route.screen || route.page);
    nav.setAttribute('aria-label', 'Chín khu vực nghiệp vụ');
    nav.innerHTML = groups.map(function (g) {
      var sections = visibleSections(g); if (!sections.length) return '';
      var count = pendingCount(g), current = found && found.group.id === g.id;
      return '<a class="nav-item workspace-item" data-workspace="' + g.id + '" href="' + TH.router.href(screenOf(sections[0])) + '" aria-label="' + esc(g.label) + '" title="' + esc(g.label) + '"' + (current ? ' aria-current="page"' : '') + '>' +
        I(g.icon) + '<span class="nav-text">' + esc(g.label) + '</span>' + (count ? '<span class="nav-count" aria-label="' + count + ' mục cần theo dõi">' + (count > 99 ? '99+' : count) + '</span>' : '') + '</a>';
    }).join('');
    var foot = document.querySelector('.sidebar-foot');
    if (foot) foot.innerHTML = (TH.canScreen('SYS-01') ? link('SYS-01', 'Cài đặt', 'nav-item nav-settings') : '') +
      '<button type="button" id="nav-compact-toggle" class="nav-item nav-compact-toggle" data-act="nav.compact" aria-controls="sidebar"></button>';
    var settings = foot && foot.querySelector('.nav-settings');
    if (settings) {
      settings.setAttribute('title', 'Cài đặt & phân quyền'); settings.setAttribute('aria-label', 'Cài đặt & phân quyền');
      if (route.page === 'SYS-01') settings.setAttribute('aria-current', 'page');
      settings.innerHTML = I('settings') + '<span class="nav-text">Cài đặt</span>';
    }
    renderWorkspace(route, found); syncShell();
    var view = document.getElementById('view');
    if (view) {
      var header = view.querySelector(':scope > .page-hd'), detail = header && header.querySelector('.detail-facts');
      var objectTabs = view.querySelector(':scope > .tab-card');
      if (detail && objectTabs) header.insertAdjacentElement('afterend', objectTabs);
      view.dataset.pattern = detail ? 'detail' : route.page === 'REPORTS' || route.base ? 'workflow' : 'list';
      if (TH.pageCrumbs) TH.pageCrumbs(view);
    }
    if (!route.extra && !route.notFound) {
      var heading = document.querySelector('#view h1');
      if (heading) {
        var copy = heading.cloneNode(true);
        copy.querySelectorAll('.screen-id, .badge').forEach(function (n) { n.remove(); });
        document.title = copy.textContent.replace(/\s+/g, ' ').trim() + ' — TIMEHOUSE';
      } else if (titles[route.page]) document.title = label(route.page) + ' — TIMEHOUSE';
    }
  }

  // Tên trình bày độc lập với screens.js được sinh từ SRS; giữ nguyên tên/ID nguồn cho mapping và RTM.
  var pageHeader = TH.pageHeader;
  var oldTitles = { 'Tổng quan · Báo cáo tòa': 'Tổng quan vận hành', 'Báo cáo tòa: thu, nợ, chi phí, lãi': 'Tổng quan vận hành', 'Tiến độ thu tiền': 'Thu tiền & công nợ' };
  TH.pageHeader = function (options) {
    var o = Object.assign({}, options), found = locate(o.screen);
    if (titles[o.screen] && ['REPORTS', 'RPT-04', 'RPT-05'].indexOf(o.screen) === -1) o.title = label(o.screen);
    else if (!o.title && titles[o.screen]) o.title = label(o.screen);
    else if (oldTitles[o.title]) o.title = oldTitles[o.title];
    if (!o.crumbs && found) o.crumbs = visibleSections(found.group).length > 1 ? [] : [[found.group.label]];
    return pageHeader(o);
  };
  ['render', 'refresh'].forEach(function (key) {
    var fn = TH.app[key];
    TH.app[key] = function () { var result = fn.apply(this, arguments); mount(); return result; };
  });
  TH.act['nav.compact'] = function () { TH.store.setUi('navigation', 'collapsed', !TH.store.ui('navigation', 'collapsed', false)); syncShell(); };
  var toggle = TH.act['nav.toggle'];
  TH.act['nav.toggle'] = function () {
    toggle.apply(this, arguments); syncShell();
    var shell = document.getElementById('shell');
    if (mobile() && shell && shell.classList.contains('nav-open')) { var first = document.querySelector('#nav a'); if (first) first.focus(); }
    else if (mobile()) { var menu = document.querySelector('.menu-toggle'); if (menu) menu.focus(); }
  };
  var accountMenu = TH.act['role.menu'];
  TH.act['role.menu'] = function () {
    accountMenu.apply(this, arguments);
    var menu = document.querySelector('.popover[role="menu"]');
    if (menu && TH.canScreen('AUTH-01')) menu.insertAdjacentHTML('beforeend', '<div class="menu-sep"></div><a class="menu-item" href="' + TH.router.href('AUTH-01') + '">' + I('login', 'ic-sm') + '<span>Tài khoản & đơn vị quản lý</span></a>');
  };
  function search(q) {
    var box = document.getElementById('gresults'); if (!box || !q) return;
    var out = [], seen = {};
    function add(screen, text, meta, icon, param, aliases) {
      if (!TH.canScreen(screen) || !TH.match(q, [text, meta, screen].concat(aliases || []))) return;
      var href = TH.router.href(screen, param); if (seen[href]) return; seen[href] = true;
      out.push({ href: href, text: text, meta: meta, icon: icon });
    }
    groups.forEach(function (g) {
      var sections = visibleSections(g); if (!sections.length) return;
      add(screenOf(sections[0]), g.label, 'Khu vực nghiệp vụ', g.icon, null, g.sections.map(function (s) { return s.label; }));
      sections.forEach(function (s) { var screen = screenOf(s); add(screen, label(screen), g.label, g.icon, null, [(TH.screen(screen) || {}).title]); });
    });
    ['CON-03', 'INV-01', 'PAY-01', 'OA-02', 'SYS-01', 'AUTH-01'].forEach(function (s) { if (TH.screen(s)) add(s, label(s), 'Danh sách & tác vụ', 'grid', null, [(TH.screen(s) || {}).title]); });
    TH.db.rooms.forEach(function (r) { if (TH.inScope(r.buildingId)) add('ROOM-02', 'Phòng ' + r.code, r.buildingId, 'door', r.id, [r.id]); });
    TH.db.customers.forEach(function (k) { var c = TH.calc.contractOfCustomer(k); if (!c || TH.inScope(c.buildingId)) add('CUS-02', k.name, 'Khách thuê', 'user', k.id, [k.id, k.phone]); });
    TH.db.invoices.forEach(function (i) { if (TH.inScope(i.buildingId)) add('INV-03', i.id, i.roomId, 'receipt', i.id); });
    TH.db.contracts.forEach(function (c) { if (TH.inScope(c.buildingId)) add('CON-02', c.id, c.roomId, 'contract', c.id); });
    box.innerHTML = out.length ? out.slice(0, 12).map(function (r, i) {
      return '<a class="menu-item" href="' + r.href + '" data-sr="' + i + '">' + I(r.icon, 'ic-sm') + '<span>' + esc(r.text) + '</span><span class="muted">' + esc(r.meta) + '</span></a>';
    }).join('') : '<div class="small muted" style="padding:10px">Không có kết quả cho “' + esc(q) + '”.</div>';
    box.hidden = false;
  }
  document.addEventListener('input', function (e) { if (e.target.id === 'gsearch') search(e.target.value.trim()); });
  window.addEventListener('resize', syncShell);
  document.addEventListener('keydown', function (e) {
    var shell = document.getElementById('shell');
    if (e.defaultPrevented || !mobile() || !shell || !shell.classList.contains('nav-open') || TH.modal.top()) return;
    if (e.key === 'Escape') { e.preventDefault(); TH.act['nav.toggle'](); }
    if (e.key === 'Tab') {
      var nodes = Array.from(document.querySelectorAll('#sidebar a[href], #sidebar button')).filter(function (n) { return !n.disabled && n.getClientRects().length; });
      if (!nodes.length) return;
      if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes[nodes.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === nodes[nodes.length - 1]) { e.preventDefault(); nodes[0].focus(); }
    }
  });
  TH.navigation = { version: 1, groups: groups, locate: locate, label: label, refresh: mount };
  if (TH.app.route && !TH.app.route.landing) TH.app.refresh(); else mount();
})();
