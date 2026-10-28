/* Nhân sự: HR-01 (hồ sơ & đội nhóm), HR-ASSIGN (phân công theo tòa). F037–F038. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;
  var S = 'HR-01';

  function activeAsg(staffId) { return TH.db.assignments.filter(function (a) { return a.staffId === staffId && !a.to; }); }
  function teamOf(id) { return TH.db.teams.find(function (t) { return t.id === id; }); }

  TH.views[S] = {
    scan: function () { return [{ ui: { tab: 'list' } }, { ui: { tab: 'org' } }, { ui: { tab: 'hist' } }]; },
    render: function () {
      var q = TH.store.ui(S, 'q', ''), st = TH.store.ui(S, 'st', 'all');
      var tabs = [{ id: 'list', label: 'Danh sách nhân sự' }, { id: 'org', label: 'Sơ đồ tổ chức' }, { id: 'hist', label: 'Lịch sử phân công & chức vụ', gate: 'F037.C' }];
      var tab = TH.resolveTab(S, tabs);
      var all = TH.db.staff;
      var rows = all.filter(function (s) { return (st === 'all' || s.status === st) && TH.match(q, [s.id, s.name, s.title, teamOf(s.team).name]); });
      var pg = TH.paginate(S, rows, 10);
      var body;
      if (tab === 'list') {
        body = '<div class="toolbar">' + TH.searchBox(S, 'Tìm mã NV, tên, chức vụ, đội…') + TH.chips(S, 'st', [{ id: 'all', label: 'Tất cả', count: all.length }, { id: 'active', label: 'Đang làm việc', count: all.filter(function (s) { return s.status === 'active'; }).length }, { id: 'inactive', label: 'Đã nghỉ', count: all.filter(function (s) { return s.status === 'inactive'; }).length }], st) + '</div>' +
          TH.table({ label: 'Danh sách nhân sự', cols: [
            { key: 'id', label: 'Mã NV', render: function (s) { return '<span class="mono">' + s.id + '</span>'; } },
            { key: 'n', label: 'Họ tên', render: function (s) { return TH.personCell(s.name, esc(s.phone)); } },
            { key: 't', label: 'Chức vụ', render: function (s) { return esc(s.title); } },
            { key: 'team', label: 'Đội', render: function (s) { return esc(teamOf(s.team).name); } },
            { key: 'ql', label: 'Quản lý', render: function (s) { var t = teamOf(s.team); return t.leaderId === s.id ? TH.badge('Trưởng nhóm', 'teal') : esc(C.staffName(t.leaderId)); } },
            { key: 'b', label: 'Tòa phụ trách', render: function (s) { var a = activeAsg(s.id); return a.length ? a.map(function (x) { return '<span class="badge badge-neutral" style="margin:1px 2px 1px 0">' + esc(C.building(x.buildingId).short) + (TH.has('F038.C') && a.length > 1 ? ' · ' + esc(x.main ? 'Chính' : (TH.BLD_ROLES.find(function (r) { return r.id === x.role; }) || { short: x.role }).short) : '') + '</span>'; }).join('') : '<span class="muted">—</span>'; } },
            { kind: 'status', key: 's', label: 'Trạng thái', render: function (s) { return TH.status(s.status, s.status === 'inactive' ? 'Đã nghỉ (xóa mềm)' : 'Đang làm việc'); } },
            { key: 'route', label: 'Tuyến quản lý', gate: 'F037.D', render: function (s) { var t = teamOf(s.team); return '<span class="small">' + (t.parent ? esc(C.staffName(teamOf(t.parent === 'OPS' ? 'BO' : t.parent).leaderId)) + ' → ' : '') + esc(C.staffName(t.leaderId)) + '</span>'; } },
            { key: 'x', label: '', render: function (s) { return '<div class="row-actions">' + TH.permBtn('hr.edit', '<button type="button" class="btn btn-xs" data-act="hr.edit" data-id="' + s.id + '">' + I('edit', 'ic-sm') + 'Sửa</button>', '403') + '<a class="btn btn-xs" href="' + TH.router.href('HR-ASSIGN', s.id) + '">' + I('building', 'ic-sm') + 'Phân công</a></div>'; } },
          ], rows: pg.rows }) + TH.pager(S, pg);
      } else if (tab === 'org') {
        var tree = TH.has('F038.B');
        var teamsHtml = TH.db.teams.filter(function (t) { return t.id !== 'BO'; }).map(function (t) {
          var members = all.filter(function (s) { return s.team === t.id && s.status === 'active'; });
          var bs = TH.db.buildings.filter(function (b) { return members.some(function (m) { return activeAsg(m.id).some(function (a) { return a.buildingId === b.id; }); }); });
          return '<div class="card"><div class="card-hd"><div><div class="card-title">' + esc(t.name) + '</div><div class="card-sub">Trưởng nhóm: ' + esc(C.staffName(t.leaderId)) + ' · ' + members.length + ' thành viên</div></div>' + (tree ? TH.badge(bs.map(function (b) { return b.short; }).join(', ') || 'Chưa gắn tòa', 'neutral') : '') + '</div>' +
            (tree ? '<div class="card-bd"><ul class="timeline">' + members.map(function (m) { return '<li><b>' + esc(m.name) + '</b> · ' + esc(m.title) + (t.leaderId === m.id ? ' ' + TH.badge('Trưởng nhóm', 'teal') : '') + '<div class="when">' + (activeAsg(m.id).map(function (a) { return C.building(a.buildingId).short + ' (' + a.role + ')'; }).join(', ') || 'Chưa phân công tòa') + '</div></li>'; }).join('') + '</ul></div>' : '') + '</div>';
        }).join('');
        var orgTable = TH.table({ compact: true, cols: [{ key: 'n', label: 'Nhóm', render: function (t) { return esc(t.name); } }, { key: 'l', label: 'Trưởng nhóm', render: function (t) { return esc(C.staffName(t.leaderId)); } }, { key: 'c', label: 'Thành viên', num: true, render: function (t) { return all.filter(function (s) { return s.team === t.id && s.status === 'active'; }).length; } }, { key: 'b', label: 'Tòa', render: function (t) { return TH.db.buildings.filter(function (b) { var m = C.staff(b.managerId); return m && m.team === t.id; }).map(function (b) { return b.short; }).join(', ') || '—'; } }], rows: TH.db.teams });
        body = '<div class="card-bd stack">' + (tree ? '<div class="row u-gap-6"><b class="small">Cây tổ chức 2–3 cấp</b>' + TH.up('F038.B') + '</div><div class="card u-tint"><div class="card-bd"><b>' + esc(C.staffName('NV-001')) + '</b> · Giám đốc vận hành<div class="small muted">Khối văn phòng: ' + all.filter(function (s) { return s.team === 'BO' && s.id !== 'NV-001'; }).map(function (s) { return esc(s.name) + ' (' + esc(s.title) + ')'; }).join(', ') + '</div></div></div><div class="grid-2">' + teamsHtml + '</div>' : '<div class="row u-gap-6"><b class="small">Danh sách nhóm / trưởng nhóm</b>' + TH.gate('F038.B', '', { mode: 'btn', label: 'Cây tổ chức 2–3 cấp', size: 'btn-sm' }) + '</div>' + orgTable) +
          TH.gate('F038.C', '<div class="alert alert-neutral">' + I('layers', 'ic-sm') + '<div class="alert-body"><b>Phụ trách nhiều tòa ' + TH.up('F038.C') + '</b><span>' + esc(C.staffName('NV-003')) + ' phụ trách ' + activeAsg('NV-003').map(function (a) { return C.building(a.buildingId).short + ' (' + a.role + ')'; }).join(', ') + '. Trưởng nhóm chỉ báo thu ở tòa đã giao.</span></div></div>', { label: 'Cơ chế phụ trách nhiều tòa', lines: 1 }) +
          TH.gate('F038.D', '<div class="alert alert-neutral">' + I('history', 'ic-sm') + '<div class="alert-body"><b>Điều chuyển có hiệu lực lịch sử ' + TH.up('F038.D') + '</b><span>NV-005 nhận TX từ 01/07/2026 thay NV-006; lịch sử giữ nguyên để tính hiệu suất đúng kỳ.</span></div></div>', { label: 'Điều chuyển có hiệu lực lịch sử', lines: 1 }) + '</div>';
      } else {
        body = '<div class="card-bd grid-2"><div><div class="section-title">Lịch sử phân công ' + TH.up('F037.C') + '</div><ul class="timeline">' + TH.db.assignments.slice().reverse().map(function (a) { return '<li><b>' + esc(C.staffName(a.staffId)) + '</b> → ' + esc(C.building(a.buildingId).short) + ' · ' + esc(a.role) + '<div class="when">' + F.date(a.from) + ' → ' + (a.to ? F.date(a.to) : 'nay') + '</div></li>'; }).join('') + '</ul></div>' +
          '<div><div class="section-title">Thay đổi chức vụ</div><ul class="timeline">' + TH.db.titleHistory.map(function (h) { return '<li><b>' + esc(C.staffName(h.staffId)) + '</b>: ' + esc(h.before) + ' → ' + esc(h.after) + '<div class="when">' + F.date(h.at) + '</div></li>'; }).join('') + '</ul></div></div>';
      }
      return TH.pageHeader({ screen: S, actions: TH.gate('F037.B', TH.permBtn('hr.edit', '<button type="button" class="btn" data-act="hr.import">' + I('upload', 'ic-sm') + 'Nhập từ Excel' + TH.up('F037.B') + '</button>', '403'), { mode: 'btn', label: 'Nhập từ Excel nhân viên' }) + '<a class="btn" href="' + TH.router.href('HR-ASSIGN') + '">' + I('building', 'ic-sm') + 'Phân công</a>' + TH.permBtn('hr.edit', '<button type="button" class="btn btn-primary" data-act="hr.add">' + I('userPlus', 'ic-sm') + 'Thêm nhân sự</button>', 'Thêm · 403') }) +
        '<div class="card card-flush">' + TH.tabs(S, tabs, tab) + TH.tabPanel(S, tab, body) + '</div>';
    },
    dialogs: [function () { return staffForm('new'); }],
  };
  function staffForm(id) {
    var s = id === 'new' ? null : C.staff(id), form = 'hr-' + id;
    var hasPay = s && (TH.db.receipts.some(function (r) { return r.reportedBy === s.id; }) || true);
    return { title: s ? 'Sửa nhân sự ' + esc(s.id) : 'Thêm nhân sự', sub: 'CRUD + phân công tòa · xóa mềm',
      body: '<div class="stack"><div class="form-grid">' + TH.field({ form: form, required: true, name: 'name', label: 'Họ tên', def: s ? s.name : '', required: true }) + TH.field({ form: form, name: 'phone', label: 'Điện thoại', def: s ? s.phone : '' }) +
        TH.field({ form: form, name: 'title', label: 'Chức vụ', def: s ? s.title : 'Nhân viên kinh doanh' }) + TH.field({ form: form, name: 'team', label: 'Đội', type: 'select', options: TH.db.teams.map(function (t) { return { id: t.id, label: t.name }; }), def: s ? s.team : 'T1' }) +
        TH.field({ form: form, name: 'role', label: 'Vai trò hệ thống', type: 'select', options: [{ id: 'staff', label: 'Nhân viên' }, { id: 'manager', label: 'Quản lý tòa' }, { id: 'accountant', label: 'Kế toán' }, { id: 'hr', label: 'Nhân sự' }], def: s ? s.role : 'staff' }) + TH.field({ form: form, name: 'status', label: 'Trạng thái', type: 'select', options: [{ id: 'active', label: 'Đang làm việc' }, { id: 'inactive', label: 'Đã nghỉ (xóa mềm)' }], def: s ? s.status : 'active' }) + '</div>' +
        (s ? '<div class="alert alert-neutral">' + I('info', 'ic-sm') + '<div class="alert-body">Không xóa cứng người đã có lương/phiếu thu — chỉ vô hiệu (xóa mềm).</div></div>' : '') + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="hr.save" data-id="' + id + '">Lưu</button>' };
  }
  TH.act['hr.add'] = function () { TH.modal.open({ key: 'hr-form', size: 'md', render: function () { return staffForm('new'); } }); };
  TH.act['hr.edit'] = function (el) { var id = el.dataset.id; TH.modal.open({ key: 'hr-form', size: 'md', render: function () { return staffForm(id); } }); };
  TH.act['hr.save'] = function (el) {
    var id = el.dataset.id, form = 'hr-' + id, g = function (k, d) { return TH.store.draft(form, k, d); };
    var s = id === 'new' ? null : C.staff(id), name = (g('name', s ? s.name : '') || '').trim();
    if (!TH.formErrors(form, name ? {} : { name: 'Nhập họ tên nhân sự.' })) { TH.modal.rerenderAll(); return; }
    var rec = { name: name, phone: g('phone', s ? s.phone : '') || '—', title: g('title', s ? s.title : ''), team: g('team', s ? s.team : 'T1'), role: g('role', s ? s.role : 'staff'), status: g('status', s ? s.status : 'active') };
    if (s) { if (rec.title !== s.title) TH.db.titleHistory.push({ staffId: s.id, at: TH.TODAY, before: s.title, after: rec.title }); Object.assign(s, rec); TH.log('Sửa nhân sự', s.id, '', 'hr'); }
    else { s = Object.assign({ id: TH.recordActions.id('NV'), joinedAt: TH.TODAY, base: 7000000, allowance: 500000 }, rec); TH.db.staff.push(s); TH.log('Thêm nhân sự', s.id, name, 'hr'); }
    TH.store.clearDraft(form); TH.modal.close('hr-form', { silent: true }); TH.app.refresh(); TH.toast(id === 'new' ? 'Đã thêm nhân sự' : 'Đã lưu', esc(s.id + ' · ' + s.name));
  };
  TH.act['hr.import'] = function () { TH.toast('Nhập từ Excel nhân viên (mô phỏng)', 'Tệp “nhan_vien.xlsx”: 8 dòng, mapping đội T1/T2/BO khớp 8/8.', 'info'); };

  /* ---------------- HR-ASSIGN ---------------- */
  TH.views['HR-ASSIGN'] = {
    modal: { size: 'lg' },
    scanParam: 'NV-006',
    render: function (r) {
      var form = 'hr-asg', staffId = r.param && C.staff(r.param) ? r.param : TH.store.draft(form, 'staff', 'NV-006');
      var s = C.staff(staffId) || C.staff('NV-006');
      var cur = activeAsg(s.id);
      var multi = TH.has('F038.C');
      return { title: 'Phân công nhân viên theo tòa <span class="screen-id">HR-ASSIGN</span>', sub: 'Gán trưởng nhóm / thay đổi người phụ trách · trưởng nhóm chỉ báo thu ở tòa đã giao',
        body: '<div class="stack"><div class="form-grid">' +
          TH.field({ form: form, name: 'staff', label: 'Nhân viên', type: 'select', options: TH.db.staff.filter(function (x) { return x.status === 'active' && x.role !== 'admin'; }).map(function (x) { return { id: x.id, label: x.id + ' · ' + x.name }; }), value: s.id }) +
          TH.field({ label: 'Đội', value: teamOf(s.team).name, readonly: true, id: 'asg-team' }) +
          TH.field({ form: form, name: 'b', label: 'Tòa', type: 'select', options: TH.buildingOptions(false) }) +
          TH.field({ form: form, name: 'role', label: 'Vai trò tại tòa', type: 'select', options: [{ id: 'main', label: TH.ROLE_MAIN + ' (phụ trách chính)' }].concat((TH.has('F006.B') ? TH.BLD_ROLES : []).map(function (r) { return { id: r.id, label: r.id }; })), def: 'main' }) +
          TH.gate('F038.D', TH.field({ form: form, name: 'from', label: 'Hiệu lực từ', type: 'date', def: TH.TODAY, labelExtra: TH.up('F038.D') }) + TH.field({ form: form, name: 'to', label: 'Đến (bỏ trống = không hạn)', type: 'date', def: '' }), { ghost: 'self', label: 'Điều chuyển có hiệu lực lịch sử' }) + '</div>' +
          '<div class="card card-flush">' + TH.cardHd('Phân công hiện tại của ' + esc(s.name), multi ? 'Có thể phụ trách nhiều tòa ' + TH.up('F038.C') : 'Gói A: một tòa chính') + TH.table({ compact: true, cols: [{ key: 'b', label: 'Tòa', render: function (a) { return esc(C.building(a.buildingId).name); } }, { key: 'r', label: 'Vai trò', render: function (a) { return esc(a.role) + (a.main ? ' ' + TH.badge('Chính', 'teal') : ''); } }, { key: 'f', label: 'Từ', render: function (a) { return F.date(a.from); } }, { key: 'x', label: '', render: function (a) { return '<button type="button" class="btn btn-xs btn-ghost" data-act="asg.end" data-id="' + a.id + '">Kết thúc</button>'; } }], rows: cur, empty: { title: 'Chưa phân công', text: '' } }) + '</div>' +
          (!multi && cur.length ? '<div class="alert alert-warning">' + I('info', 'ic-sm') + '<div class="alert-body">Gói A: phân công mới sẽ kết thúc phân công hiện tại (một tòa chính). Giữ nhiều tòa là nâng cấp C.</div></div>' : '') + '</div>',
        foot: '<button type="button" class="btn" data-close>Đóng</button>' + TH.permBtn('hr.edit', '<button type="button" class="btn btn-primary" data-act="asg.save">' + I('check', 'ic-sm') + 'Lưu phân công</button>', '403') };
    },
  };
  TH.act['asg.save'] = function () {
    var g = function (k, d) { return TH.store.draft('hr-asg', k, d); };
    var sid = g('staff', 'NV-006'), b = g('b', TH.buildingOptions(false)[0].id), role = g('role', TH.ROLE_MAIN), main = role === 'main';
    if (!TH.can('hr.edit') || !TH.inScope(b)) return;
    if (role !== 'main' && role !== TH.ROLE_MAIN && !TH.requireFeature('F006.B')) return;
    if (main) role = TH.ROLE_MAIN;
    var from = TH.has('F038.D') ? g('from', TH.TODAY) : TH.TODAY, to = TH.has('F038.D') ? (g('to', '') || null) : null;
    if (!TH.has('F038.C')) TH.db.assignments.forEach(function (a) { if (a.staffId === sid && !a.to) a.to = TH.addDays(from, -1); });
    if (main) { TH.db.assignments.forEach(function (a) { if (a.buildingId === b && a.role === TH.ROLE_MAIN && a.main && !a.to) a.to = TH.addDays(from, -1); }); C.building(b).managerId = sid; }
    TH.db.assignments.push({ id: TH.recordActions.id('PC'), staffId: sid, buildingId: b, role: role, main: main || undefined, from: from, to: to });
    TH.log('Phân công nhân viên', sid, C.building(b).short + ' · ' + role, 'hr', b);
    TH.store.clearDraft('hr-asg'); TH.app.refresh(); TH.toast('Đã lưu phân công', esc(C.staffName(sid) + ' → ' + C.building(b).short));
  };
  TH.act['asg.end'] = function (el) { var a = TH.db.assignments.find(function (x) { return x.id === el.dataset.id; }); a.to = TH.TODAY; TH.log('Kết thúc phân công', a.staffId, C.building(a.buildingId).short, 'hr', a.buildingId); TH.app.refresh(); TH.toast('Đã kết thúc phân công', 'Lịch sử được giữ.'); };
})();
