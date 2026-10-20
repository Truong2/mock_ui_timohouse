/*
 * Store: package preview, vai trò giả lập, scope tòa/kỳ, bộ lọc, form nháp, dataset demo.
 * Lưu localStorage (có fallback bộ nhớ khi trình duyệt chặn file://). Có schema version.
 */
var TH = window.TH = window.TH || {};

TH.PACKAGES = {
  A: { key: 'A', level: 1, name: 'Gói A', price: '50–60 triệu', mode: 'Cơ bản', desc: 'Đủ 39 màn/52 nhóm ở mức cơ bản: nhập tay, Excel mẫu, OCR có người xác nhận. Có sẵn 2 báo cáo theo mẫu khách: doanh thu theo tòa và báo cáo kinh doanh tháng.' },
  B: { key: 'B', level: 2, name: 'Gói B', price: '70–80 triệu', mode: 'Tự động hóa', desc: 'Toàn bộ A + nâng cấp B: preview import, nhập hàng loạt, nhiều mẫu OCR, nhắc Zalo 3 mốc; báo cáo drill-down về chứng từ và xu hướng 6 kỳ.' },
  C: { key: 'C', level: 3, name: 'Gói C', price: '80–90 triệu', mode: 'Kiểm soát', desc: 'Toàn bộ B + nâng cấp C: duyệt, chống trùng, lịch sử thay đổi, kiểm tra trước khi chốt; báo cáo có snapshot duyệt kỳ, phân bổ chi phí chung theo rule, gộp nhóm nhà.' },
  D: { key: 'D', level: 4, name: 'Gói D', price: '90–100 triệu', mode: 'Báo cáo & truy vết', desc: 'Toàn bộ C + nâng cấp D: audit, khóa kỳ, snapshot, đối chiếu phiên bản; báo cáo đối chiếu lịch sử và mẫu quản trị có version.' },
};
TH.PKG_KEYS = ['A', 'B', 'C', 'D'];

TH.ROLES = {
  admin: { key: 'admin', label: 'Admin', staffId: 'NV-001', scope: 'ALL' },
  accountant: { key: 'accountant', label: 'Kế toán', staffId: 'NV-002', scope: 'ALL' },
  manager: { key: 'manager', label: 'Quản lý tòa', staffId: 'NV-003', scope: ['TH-CG'] },
  hr: { key: 'hr', label: 'Nhân sự', staffId: 'NV-008', scope: [] },
};

/* Quyền theo vai trò — độc lập với gói demo (SRS §2.1 mục 4, 7). */
TH.PERMS = {
  admin: ['*'],
  accountant: ['view.all', 'invoice.confirm', 'receipt.confirm', 'receipt.report', 'expense.create', 'expense.approve', 'salary.view', 'salary.edit', 'share.view', 'share.edit', 'report.all', 'meter.edit', 'meter.approve', 'master.edit', 'lease.edit', 'contract.edit', 'oa.send', 'hr.view', 'deposit.propose', 'deposit.approve', 'deposit.pay', 'vehicle.view'],
  manager: ['view.ops', 'receipt.report', 'meter.edit', 'expense.create', 'master.edit', 'contract.edit', 'invoice.draft', 'oa.send', 'report.building', 'deposit.propose', 'vehicle.view'],
  hr: ['hr.view', 'hr.edit', 'salary.view'],
};
/* Màn nào vai trò nào được mở (ngoài danh sách → 403 Forbidden). */
TH.SCREEN_ACCESS = {
  manager: ['AUTH-01', 'OWN-01', 'OWN-02', 'OWN-IMP', 'BLD-01', 'BLD-02', 'BLD-IMP', 'ROOM-01', 'ROOM-02', 'ROOM-IMP', 'CUS-01', 'CUS-02', 'OCR-CUS', 'CON-01', 'CON-02', 'CON-03', 'OCR-CON', 'CON-FOLLOW', 'METER-01', 'INV-01', 'INV-02', 'INV-03', 'INV-PREV', 'OA-01', 'OA-02', 'PAY-01', 'PAY-02', 'PAY-APP', 'EXP-01', 'RPT-01', 'RPT-02', 'RPT-04'],
  hr: ['AUTH-01', 'HR-01', 'HR-ASSIGN', 'SAL-01', 'SAL-ADJ', 'RPT-03'],
  accountant: null, // tất cả trừ SYS-01
  admin: null,
};

TH.store = (function () {
  var KEY = 'timehouse.demo.v1';
  var mem = null;
  var storageOk = (function () {
    try { localStorage.setItem('__th', '1'); localStorage.removeItem('__th'); return true; } catch (e) { return false; }
  })();

  function read() {
    if (!storageOk) return mem;
    try { var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return mem; }
  }
  function write(obj) {
    mem = obj;
    if (!storageOk) return;
    try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) { /* quota/blocked → giữ trong bộ nhớ */ }
  }

  var state = {
    pkg: 'D', showLocked: true, role: 'admin', building: 'ALL', period: TH.CURRENT_PERIOD,
    tierNotes: true, ui: {}, drafts: {}, dataState: {}, schema: TH.DATA_SCHEMA,
  };

  var saveTimer = null;
  function flush() {
    clearTimeout(saveTimer); saveTimer = null;
    write({ schema: TH.DATA_SCHEMA, pkg: state.pkg, showLocked: state.showLocked, role: state.role, building: state.building, period: state.period, tierNotes: state.tierNotes, ui: state.ui, drafts: state.drafts, db: TH.db });
  }
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 120);
  }

  function validPkg(p) { return p && TH.PACKAGES[String(p).toUpperCase()] ? String(p).toUpperCase() : null; }
  function queryPkg() {
    try { return new URLSearchParams(location.search).get('previewPackage'); } catch (e) { return null; }
  }

  return {
    state: state,
    storageOk: storageOk,
    init: function () {
      var saved = read();
      var fresh = !saved || saved.schema !== TH.DATA_SCHEMA;
      if (!fresh) {
        ['showLocked', 'role', 'building', 'period', 'tierNotes', 'ui', 'drafts'].forEach(function (k) { if (saved[k] !== undefined) state[k] = saved[k]; });
        TH.db = saved.db || TH.seed();
      } else {
        TH.db = TH.seed();
      }
      // Thứ tự lấy gói: query hợp lệ → lựa chọn đã lưu → D
      var q = queryPkg();
      state.pkgFromQuery = !!validPkg(q);
      state.invalidQuery = q && !validPkg(q) ? q : null;
      state.pkg = validPkg(q) || (!fresh && validPkg(saved.pkg)) || 'D';
      if (!TH.PERIODS.includes(state.period)) state.period = TH.CURRENT_PERIOD;
      this.syncUrl();
      persist();
    },
    persist: persist,
    flush: flush,
    level: function (p) { return TH.PACKAGES[p || state.pkg].level; },
    setPkg: function (p) {
      p = validPkg(p);
      if (!p || p === state.pkg) return false;
      state.pkg = p;
      this.syncUrl();
      persist();
      return true;
    },
    /* Cập nhật query previewPackage của entry hiện tại để refresh/Back không quay về gói cũ. */
    syncUrl: function () {
      try {
        var url = new URL(location.href);
        if (url.searchParams.get('previewPackage') !== state.pkg) {
          url.searchParams.set('previewPackage', state.pkg);
          history.replaceState(history.state, '', url.toString());
        }
      } catch (e) { /* file:// cũ không hỗ trợ — bỏ qua */ }
    },
    deepLink: function (pkg) {
      try {
        var url = new URL(location.href);
        url.searchParams.set('previewPackage', pkg || state.pkg);
        return url.toString();
      } catch (e) { return location.href; }
    },
    set: function (key, val) { state[key] = val; persist(); },
    ui: function (screen, key, def) {
      var u = state.ui[screen] || {};
      return u[key] === undefined ? def : u[key];
    },
    setUi: function (screen, key, val) {
      state.ui[screen] = state.ui[screen] || {};
      state.ui[screen][key] = val;
      persist();
    },
    draft: function (form, field, def) {
      var d = state.drafts[form] || {};
      return field ? (d[field] === undefined ? def : d[field]) : d;
    },
    setDraft: function (form, field, val) {
      state.drafts[form] = state.drafts[form] || {};
      state.drafts[form][field] = val;
      persist();
    },
    clearDraft: function (form) { delete state.drafts[form]; persist(); },
    hasDraft: function (form) {
      var d = state.drafts[form];
      return !!d && Object.keys(d).some(function (k) { return d[k] !== '' && d[k] !== null && d[k] !== undefined; });
    },
    reset: function () {
      TH.db = TH.seed();
      state.ui = {}; state.drafts = {}; state.dataState = {};
      state.building = 'ALL'; state.period = TH.CURRENT_PERIOD; state.role = 'admin';
      persist();
    },
  };
})();

/* ---------- Gate & quyền ---------- */
TH.tierOf = function (incId) { return incId.split('.')[1]; };
TH.has = function (incId) {
  if (TH._rec && incId.indexOf('.') > -1) TH._rec(incId);
  var t = incId.indexOf('.') > -1 ? TH.tierOf(incId) : incId;
  return TH.store.level() >= TH.PACKAGES[t].level;
};
TH.inc = function (incId) {
  var fid = incId.split('.')[0], tier = TH.tierOf(incId);
  var f = TH.FEATURES.find(function (x) { return x.id === fid; });
  return { id: incId, fid: fid, tier: tier, text: f ? f[tier] : '', feature: f };
};
TH.can = function (perm) {
  var list = TH.PERMS[TH.store.state.role] || [];
  return list.indexOf('*') > -1 || list.indexOf(perm) > -1;
};
TH.canScreen = function (screenId) {
  var role = TH.store.state.role;
  if (screenId === 'SYS-01') return role === 'admin';
  var allow = TH.SCREEN_ACCESS[role];
  return !allow || allow.indexOf(screenId) > -1;
};
TH.roleScope = function () {
  var r = TH.ROLES[TH.store.state.role];
  return r.scope === 'ALL' ? TH.db.buildings.map(function (b) { return b.id; }) : r.scope;
};
/* Scope tòa hiệu lực (giao giữa lựa chọn topbar và phạm vi vai trò). */
TH.scope = function () {
  var b = TH.store.state.building, allowed = TH.roleScope();
  if (b !== 'ALL' && allowed.indexOf(b) === -1) b = allowed.length === 1 ? allowed[0] : 'ALL';
  if (b === 'ALL' && allowed.length === 1) return allowed[0];
  return b;
};
TH.inScope = function (bId) {
  var s = TH.scope();
  var allowed = TH.roleScope();
  if (allowed.indexOf(bId) === -1 && TH.store.state.role === 'manager') return false;
  return s === 'ALL' || s === bId;
};
TH.me = function () { return TH.calc.staff(TH.ROLES[TH.store.state.role].staffId); };
TH.log = function (action, entity, detail, kind, buildingId) {
  var now = new Date();
  var hh = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  TH.db.audit.unshift({ at: TH.TODAY + ' ' + hh, by: TH.me().id, action: action, entity: entity, detail: detail || '', kind: kind || 'other', buildingId: buildingId || 'ALL', demo: true });
};
