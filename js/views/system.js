/* Hệ thống: AUTH-01 (đăng nhập / chuyển đơn vị), SYS-01 (phân quyền & phạm vi tòa). F050–F052. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;

  var PERM_GROUPS = [['Dữ liệu gốc', ['Xem', 'Thêm/sửa', 'Import']], ['Thu tiền', ['Báo thu', 'Duyệt thu', 'Duyệt chi']], ['Lương & cổ phần', ['Xem', 'Sửa', 'Duyệt']], ['Báo cáo', ['Tòa', 'Toàn công ty', 'Khóa kỳ']]];
  var ROLE_MATRIX = {
    admin: { 'Dữ liệu gốc': [1, 1, 1], 'Thu tiền': [1, 1, 1], 'Lương & cổ phần': [1, 1, 1], 'Báo cáo': [1, 1, 1] },
    accountant: { 'Dữ liệu gốc': [1, 1, 1], 'Thu tiền': [1, 1, 1], 'Lương & cổ phần': [1, 1, 1], 'Báo cáo': [1, 1, 1] },
    manager: { 'Dữ liệu gốc': [1, 1, 1], 'Thu tiền': [1, 0, 0], 'Lương & cổ phần': [0, 0, 0], 'Báo cáo': [1, 0, 0] },
    hr: { 'Dữ liệu gốc': [0, 0, 0], 'Thu tiền': [0, 0, 0], 'Lương & cổ phần': [1, 1, 0], 'Báo cáo': [0, 0, 0] },
  };

  /* ---------------- AUTH-01 ---------------- */
  TH.views['AUTH-01'] = {
    render: function () {
      var form = 'auth', role = TH.store.draft(form, 'role', TH.store.state.role), me = TH.ROLES[role];
      var scope = me.scope === 'ALL' ? TH.db.buildings : TH.db.buildings.filter(function (b) { return me.scope.indexOf(b.id) > -1; });
      var card = '<div class="card" style="max-width:520px;margin:0 auto"><div class="card-bd stack">' +
        '<div style="text-align:center"><span class="brand-mark" style="margin:0 auto 10px;width:44px;height:44px">' + I('logo') + '</span><div class="brand-name">TIMEHOUSE</div><div class="small muted">Đăng nhập / chuyển đơn vị quản lý · ' + TH.simBadge('Không xác thực thật') + '</div></div>' +
        '<div class="form-grid">' + TH.field({ form: form, name: 'user', label: 'Tên đăng nhập', def: TH.db.users.find(function (u) { return u.role === role; }).username, span: true }) + TH.field({ form: form, name: 'pass', label: 'Mật khẩu', type: 'password', def: '••••••••', span: true }) +
        TH.field({ form: form, name: 'role', label: 'Vai trò', type: 'select', options: Object.keys(TH.ROLES).map(function (k) { return { id: k, label: TH.ROLES[k].label + ' · ' + C.staffName(TH.ROLES[k].staffId) }; }), def: TH.store.state.role }) +
        TH.field({ label: 'Phạm vi tòa', value: scope.length ? scope.map(function (b) { return b.short; }).join(', ') : 'Không gắn tòa', readonly: true, id: 'auth-scope' }) + '</div>' +
        TH.gate('F050.B', '<div class="small">' + TH.tierPill('B') + ' Phân quyền theo chức năng và tòa được áp dụng sau đăng nhập.</div>', { mode: 'mini', label: 'Phân quyền theo chức năng' }) +
        '<div class="alert alert-neutral">' + I('shield', 'ic-sm') + '<div class="alert-body">Quyền xem/sửa/duyệt xác minh phía backend; người báo thu không tự duyệt tiền. Gói demo không đổi vai trò — 403 hiển thị riêng với khóa gói.</div></div>' +
        '<button type="button" class="btn btn-primary btn-lg" data-act="auth.login">' + I('login', 'ic-sm') + 'Đăng nhập với vai trò ' + esc(me.label) + '</button></div></div>';
      var side = '<div class="grid-3" style="margin-top:16px">' +
        TH.gate('F050.C', '<div class="card"><div class="card-bd small"><b>' + TH.tierPill('C') + ' Log duyệt & scope theo tòa</b><ul class="timeline" style="margin-top:8px">' + TH.db.audit.filter(function (a) { return a.kind === 'receipt'; }).slice(0, 3).map(function (a) { return '<li>' + esc(a.action) + ' · ' + esc(a.entity) + '<div class="when">' + esc(C.staffName(a.by)) + ' · ' + F.date(a.at) + '</div></li>'; }).join('') + '</ul></div></div>', { label: 'Log duyệt và scope theo tòa', lines: 3 }) +
        TH.gate('F050.D', '<div class="card"><div class="card-bd small"><b>' + TH.tierPill('D') + ' Phiên bản quyền</b><ul class="timeline" style="margin-top:8px">' + TH.db.permVersions.map(function (v) { return '<li>v' + v.v + ' · ' + esc(v.note) + '<div class="when">' + F.date(v.at) + '</div></li>'; }).join('') + '</ul></div></div>', { label: 'Theo dõi phiên bản quyền', lines: 3 }) +
        TH.gate('F052.B', '<div class="card"><div class="card-bd small"><b>' + TH.tierPill('B') + ' Kiểm thử phục hồi</b><div style="margin-top:6px">Backup gần nhất 20/10 02:00 · restore test đạt 19/10 · dữ liệu đầu kỳ theo mẫu.</div></div></div>', { label: 'Kiểm thử phục hồi và dữ liệu đầu kỳ', lines: 2 }) + '</div>';
      return TH.pageHeader({ screen: 'AUTH-01', desc: 'Chọn vai trò giả lập để xem khác biệt quyền. Vai trò không đổi khi đổi gói.' }) + card + side;
    },
  };
  TH.act['auth.login'] = function () {
    var role = TH.store.draft('auth', 'role', TH.store.state.role);
    TH.store.set('role', role); TH.store.clearDraft('auth');
    TH.go('RPT-01');
    TH.toast('Đã đăng nhập (mô phỏng)', 'Vai trò ' + TH.ROLES[role].label + ' · phạm vi ' + (TH.ROLES[role].scope === 'ALL' ? 'tất cả tòa' : TH.ROLES[role].scope.join(', ') || 'không gắn tòa') + '.');
  };

  /* ---------------- SYS-01 ---------------- */
  TH.views['SYS-01'] = {
    scan: function () { return [{ ui: { tab: 'users' } }, { ui: { tab: 'audit' } }, { ui: { tab: 'ops' } }]; },
    render: function () {
      var S = 'SYS-01';
      var tabs = [{ id: 'users', label: 'Tài khoản & phạm vi', count: TH.db.users.length }, { id: 'audit', label: 'Audit tài chính' }, { id: 'ops', label: 'Sao lưu & vận hành' }];
      var tab = TH.resolveTab(S, tabs);
      var body;
      if (tab === 'users') {
        var sel = TH.store.ui(S, 'user', 'U-03'), u = TH.db.users.find(function (x) { return x.id === sel; }) || TH.db.users[0];
        var fine = TH.has('F050.B');
        body = '<div class="grid-main-side"><div class="card card-flush">' + TH.table({ label: 'Tài khoản', cols: [
          { key: 'u', label: 'Người dùng', render: function (x) { return TH.personCell(C.staffName(x.staffId), esc(x.username)); } },
          { key: 'r', label: 'Vai trò', render: function (x) { return TH.badge(TH.ROLES[x.role] ? TH.ROLES[x.role].label : x.role, 'teal'); } },
          { key: 's', label: 'Tòa được xem/sửa', render: function (x) { return x.scope.length === TH.db.buildings.length ? '<span class="small">Tất cả tòa</span>' : x.scope.length ? x.scope.map(function (b) { return '<span class="badge badge-neutral">' + esc(C.building(b).short) + '</span> '; }).join('') : '<span class="muted small">Không gắn tòa</span>'; } },
          { key: 'sep', label: 'Tách báo thu / duyệt', gate: 'F050.C', render: function (x) { return x.role === 'manager' ? TH.badge('Chỉ báo thu', 'info') : x.role === 'accountant' || x.role === 'admin' ? TH.badge('Duyệt thu & chi', 'success') : '<span class="muted small">—</span>'; } },
          { key: 'eff', label: 'Đội · ca · hiệu lực', gate: 'F050.D', render: function (x) { var s = C.staff(x.staffId); return '<span class="small">' + esc(TH.db.teams.find(function (t) { return t.id === s.team; }).name.split(' ·')[0]) + ' · ca hành chính · từ ' + F.date(s.joinedAt) + '</span>'; } },
          { key: 'st', label: '', render: function (x) { return TH.status(x.status); } },
        ], rows: TH.db.users, rowAttrs: function (x) { return 'class="is-clickable' + (x.id === u.id ? ' is-selected' : '') + '" tabindex="0" data-act="ui.set" data-screen="SYS-01" data-key="user" data-val="' + x.id + '"'; } }) + '</div>' +
          '<div class="stack"><div class="card">' + TH.cardHd(I('key', 'ic-sm') + esc(C.staffName(u.staffId)), esc(TH.ROLES[u.role].label) + ' · ' + esc(u.username)) + '<div class="card-bd stack-sm">' +
          '<div class="section-title">Phạm vi tòa</div><div class="row" style="gap:6px">' + TH.db.buildings.map(function (b) { var on = u.scope.indexOf(b.id) > -1; return '<label class="check"><input type="checkbox"' + (on ? ' checked' : '') + ' data-act-change="sys.scope" data-u="' + u.id + '" data-b="' + b.id + '"' + (u.role === 'admin' ? ' disabled' : '') + '><span>' + esc(b.short) + '</span></label>'; }).join('') + '</div>' +
          '<div class="section-title" style="margin-top:8px">Quyền theo chức năng ' + (fine ? TH.up('F050.B') : '') + '</div>' +
          (fine ? TH.table({ compact: true, cols: [{ key: 'g', label: 'Phân hệ', render: function (g) { return esc(g[0]); } }].concat([0, 1, 2].map(function (i) { return { key: 'c' + i, label: ['Xem/Báo', 'Sửa/Duyệt', 'Import/Khóa'][i], center: true, render: function (g) { var on = ROLE_MATRIX[u.role][g[0]][i]; return '<span class="small">' + esc(g[1][i]) + '</span><br>' + (on ? I('checkCircle', 'ic-sm') : '<span class="muted">—</span>'); } }; })), rows: PERM_GROUPS }) : '<div class="small muted">Gói A: 3 vai trò cố định Admin / Kế toán / QL tòa; quyền kiểm tra bắt buộc ở backend.</div>' + TH.gate('F050.B', '', { mode: 'btn', label: 'Phân quyền theo chức năng và tòa', size: 'btn-sm' })) +
          '<div class="row" style="margin-top:8px">' + TH.permBtn('*', '<button type="button" class="btn btn-sm" data-act="sys.save" data-u="' + u.id + '">' + I('check', 'ic-sm') + 'Lưu phạm vi</button>', '403') + (u.status === 'active' ? '<button type="button" class="btn btn-sm btn-danger" data-act="sys.disable" data-u="' + u.id + '">Vô hiệu</button>' : '<button type="button" class="btn btn-sm" data-act="sys.enable" data-u="' + u.id + '">Kích hoạt lại</button>') + '</div></div></div>' +
          TH.gate('F050.D', '<div class="card">' + TH.cardHd(I('history', 'ic-sm') + 'Phiên bản quyền' + TH.up('F050.D')) + '<div class="card-bd"><ul class="timeline">' + TH.db.permVersions.map(function (v) { return '<li><b>v' + v.v + '</b> · ' + esc(v.note) + '<div class="when">' + esc(C.staffName(v.by)) + ' · ' + F.date(v.at) + '</div></li>'; }).join('') + '</ul></div></div>', { label: 'Theo dõi phiên bản quyền', lines: 3 }) + '</div></div>';
      } else if (tab === 'audit') {
        var fb = TH.has('F051.B') ? TH.store.ui(S, 'ab', 'ALL') : 'ALL', fk = TH.has('F051.B') ? TH.store.ui(S, 'ak', 'all') : 'all';
        var rows = TH.db.audit.filter(function (a) { return (fb === 'ALL' || a.buildingId === fb || a.buildingId === 'ALL') && (fk === 'all' || a.kind === fk); });
        body = '<div class="toolbar">' + (TH.has('F051.B') ? TH.uiSelect(S, 'ab', [{ id: 'ALL', label: 'Mọi tòa' }].concat(TH.db.buildings.map(function (b) { return { id: b.id, label: b.short }; })), fb, 'Tòa') + TH.uiSelect(S, 'ak', [{ id: 'all', label: 'Mọi loại chứng từ' }, { id: 'receipt', label: 'Phiếu thu' }, { id: 'invoice', label: 'Hóa đơn' }, { id: 'expense', label: 'Chi phí' }, { id: 'period', label: 'Kỳ' }, { id: 'meter', label: 'Chỉ số' }], fk, 'Loại') + TH.up('F051.B') : TH.gate('F051.B', '', { mode: 'btn', label: 'Bộ lọc theo tòa và loại chứng từ', size: 'btn-sm' })) + '<span class="grow"></span>' + TH.exportBtn('sys.auditCsv', 'Tải CSV') + '</div>' +
          TH.table({ label: 'Audit', cols: [
            { key: 't', label: 'Thời điểm', render: function (a) { return F.date(a.at); } },
            { key: 'w', label: 'Người thực hiện', render: function (a) { return esc(C.staffName(a.by)); } },
            { key: 'a', label: 'Hành động', render: function (a) { return '<b>' + esc(a.action) + '</b>' + (a.demo ? ' ' + TH.badge('demo', 'neutral') : ''); } },
            { key: 'e', label: 'Đối tượng', render: function (a) { return esc(a.entity) + '<div class="cell-sub">' + esc(a.detail) + '</div>'; } },
            { key: 'm', label: 'Mốc thu / giao dịch', gate: 'F051.C', render: function (a) { return a.kind === 'receipt' ? '<span class="small">' + esc(a.detail.match(/\((.+)\)/) ? a.detail.match(/\((.+)\)/)[1] : 'Giao dịch') + '</span>' : '<span class="muted small">—</span>'; } },
            { key: 'r', label: 'Revision', gate: 'F051.D', render: function (a, i) { return '<span class="mono small">r' + (TH.db.audit.length - i) + '</span>'; } },
          ], rows: rows }) + (TH.has('F051.D') ? '<div class="card-ft"><span class="small">' + TH.tierPill('D') + ' Báo cáo snapshot có revision truy vết: ' + Object.keys(TH.db.snapshots).length + ' snapshot kỳ.</span></div>' : '');
      } else {
        body = '<div class="card-bd grid-2">' +
          '<div class="card"><div class="card-hd"><div class="card-title">' + I('database', 'ic-sm') + 'Sao lưu & staging</div>' + TH.tierPill('A') + '</div><div class="card-bd">' + TH.kv([['Môi trường', 'Staging + Production'], ['Backup gần nhất', '20/10/2026 02:00 (hằng ngày)'], ['Hướng dẫn người dùng', TH.fileOf('huong_dan_su_dung_v1.pdf')]]) + '</div></div>' +
          '<div class="stack">' + TH.gate('F052.B', '<div class="card"><div class="card-bd small"><b>' + TH.tierPill('B') + ' Kiểm thử phục hồi & dữ liệu đầu kỳ</b><br>Restore test gần nhất: 19/10/2026 · đạt · 4 phút. Dữ liệu đầu kỳ nhập theo mẫu: chủ nhà 4, tòa 3, phòng 18.</div></div>', { label: 'Kiểm thử phục hồi và dữ liệu đầu kỳ theo mẫu', lines: 2 }) +
          TH.gate('F052.C', '<div class="card"><div class="card-bd small"><b>' + TH.tierPill('C') + ' Bộ test hồi quy dòng tiền</b><br>Chạy đêm 19/10: 48/48 ca đạt (hóa đơn → thu → công nợ → báo cáo).</div></div>', { label: 'Bộ test hồi quy tự động các dòng tiền', lines: 2 }) +
          TH.gate('F052.D', '<div class="card"><div class="card-bd small"><b>' + TH.tierPill('D') + ' Giám sát batch & cảnh báo OA</b><br>Batch hóa đơn kỳ 10: thành công · Gửi OA: ' + TH.db.messages.filter(function (m) { return m.status === 'failed'; }).length + ' tin lỗi → cảnh báo kế toán.</div></div>', { label: 'Giám sát batch và cảnh báo lỗi gửi OA', lines: 2 }) + '</div></div>';
      }
      return TH.pageHeader({ screen: S, desc: 'Admin phân vai trò, chọn tòa được quản lý. API trả 403 khi gọi vượt scope.', actions: TH.permBtn('*', '<button type="button" class="btn btn-primary" data-act="sys.newUser">' + I('userPlus', 'ic-sm') + 'Tạo tài khoản</button>', 'Tạo · 403') }) +
        '<div class="card card-flush">' + TH.tabs(S, tabs, tab) + body + '</div>';
    },
  };
  TH.onChange['sys.scope'] = function (el) {
    var u = TH.db.users.find(function (x) { return x.id === el.dataset.u; }), i = u.scope.indexOf(el.dataset.b);
    if (el.checked && i === -1) u.scope.push(el.dataset.b); else if (!el.checked && i > -1) u.scope.splice(i, 1);
    if (TH.ROLES[u.role] && TH.ROLES[u.role].scope !== 'ALL') TH.ROLES[u.role].scope = u.scope.slice();
  };
  TH.act['sys.save'] = function (el) { var u = TH.db.users.find(function (x) { return x.id === el.dataset.u; }); TH.db.permVersions.unshift({ v: TH.db.permVersions.length + 1, at: TH.TODAY, by: TH.me().id, note: 'Cập nhật phạm vi ' + u.username + ': ' + (u.scope.join(', ') || 'không tòa') }); TH.log('Cập nhật phạm vi quyền', u.username, u.scope.join(', '), 'system'); TH.app.refresh(); TH.toast('Đã lưu phạm vi', esc(u.username) + ' · ' + (u.scope.join(', ') || 'không gắn tòa')); };
  TH.act['sys.disable'] = function (el) { var u = TH.db.users.find(function (x) { return x.id === el.dataset.u; }); if (u.role === 'admin') { TH.toast('Không vô hiệu Admin duy nhất', '', 'danger'); return; } u.status = 'inactive'; TH.log('Vô hiệu tài khoản', u.username, '', 'system'); TH.app.refresh(); TH.toast('Đã vô hiệu', esc(u.username)); };
  TH.act['sys.enable'] = function (el) { var u = TH.db.users.find(function (x) { return x.id === el.dataset.u; }); u.status = 'active'; TH.app.refresh(); TH.toast('Đã kích hoạt', esc(u.username)); };
  TH.act['sys.newUser'] = function () {
    TH.modal.open({ key: 'sys-new', size: 'sm', render: function () {
      var form = 'sys-new';
      return { title: 'Tạo tài khoản', sub: 'Gán vai trò và phạm vi tòa', body: '<div class="stack">' + TH.field({ form: form, name: 'staff', label: 'Nhân sự', type: 'select', options: TH.db.staff.filter(function (s) { return !TH.db.users.some(function (u) { return u.staffId === s.id; }); }).map(function (s) { return { id: s.id, label: s.name }; }) }) + TH.field({ form: form, name: 'role', label: 'Vai trò', type: 'select', options: Object.keys(TH.ROLES).map(function (k) { return { id: k, label: TH.ROLES[k].label }; }), def: 'manager' }) + '</div>',
        foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="sys.newUserSave">Tạo</button>' };
    } });
  };
  TH.act['sys.newUserSave'] = function () {
    var sid = TH.store.draft('sys-new', 'staff', TH.db.staff.find(function (s) { return !TH.db.users.some(function (u) { return u.staffId === s.id; }); }).id), s = C.staff(sid);
    var u = { id: 'U-' + String(TH.db.users.length + 1).padStart(2, '0'), staffId: sid, username: s.name.split(' ').pop().toLowerCase() + '.' + s.name.split(' ').slice(0, -1).map(function (w) { return w[0].toLowerCase(); }).join(''), role: TH.store.draft('sys-new', 'role', 'manager'), scope: [], status: 'active', perms: null };
    TH.db.users.push(u); TH.log('Tạo tài khoản', u.username, u.role, 'system'); TH.store.clearDraft('sys-new'); TH.modal.close('sys-new', { silent: true }); TH.store.setUi('SYS-01', 'user', u.id); TH.app.refresh(); TH.toast('Đã tạo tài khoản', esc(u.username) + ' · chọn tòa để cấp phạm vi');
  };
  TH.act['sys.auditCsv'] = function () { TH.exportCsv('audit_' + TH.TODAY, ['Thời điểm', 'Người', 'Hành động', 'Đối tượng', 'Chi tiết'], TH.db.audit.map(function (a) { return [a.at, C.staffName(a.by), a.action, a.entity, a.detail]; })); TH.toast('Đã tải audit', TH.db.audit.length + ' dòng · .csv'); };
})();
