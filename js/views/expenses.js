/* Chi phí: EXP-01 — danh sách & nhập chi phí. F034–F036. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;
  var S = 'EXP-01';

  function dupOf(e) { return TH.db.expenses.filter(function (x) { return x !== e && x.buildingId === e.buildingId && x.docNo === e.docNo && x.status !== 'rejected' && e.category !== 'owner_rent'; }); }

  TH.views[S] = {
    render: function () {
      var p = TH.store.state.period, st = TH.store.ui(S, 'st', 'all'), cat = TH.store.ui(S, 'cat', 'all');
      var all = TH.db.expenses.filter(function (e) { return e.period === p && TH.inScope(e.buildingId); });
      var rows = all.filter(function (e) { return (st === 'all' || e.status === st) && (cat === 'all' || e.category === cat); }).sort(function (a, b) { var o = { pending: 0, draft: 1, approved: 2, rejected: 3 }; return o[a.status] - o[b.status]; });
      var pg = TH.paginate(S, rows, 12);
      var me = TH.me().id, sepRoles = TH.has('F034.C');
      var sum = function (s) { return C.sum(all.filter(function (e) { return e.status === s; }), function (e) { return e.amount; }); };
      var table = TH.table({
        label: 'Danh sách chi phí',
        cols: [
          { key: 'id', label: 'Mã', render: function (e) { return '<span class="mono small">' + e.id + '</span><div class="cell-sub">' + F.date(e.date) + '</div>'; } },
          { key: 'b', label: 'Tòa', render: function (e) { return esc(C.building(e.buildingId).short); } },
          { key: 'c', label: 'Nhóm chi', render: function (e) { return esc(TH.EXPENSE_CATS[e.category]); } },
          { key: 'd', label: 'Mô tả', render: function (e) { return esc(e.description) + '<div class="cell-sub">' + I('paperclip', 'ic-sm') + ' ' + esc(e.docNo) + '</div>'; } },
          { key: 'a', label: 'Giá trị', num: true, render: function (e) { return '<b>' + F.money(e.amount) + '</b>'; } },
          { key: 'u', label: 'Người nhập / duyệt', render: function (e) { return esc(C.staffName(e.createdBy)) + '<div class="cell-sub">' + (e.approvedBy ? esc(C.staffName(e.approvedBy)) : '—') + '</div>'; } },
          { key: 's', label: 'Trạng thái', render: function (e) { return TH.status(e.status) + (e.reason ? '<div class="cell-sub neg">' + esc(e.reason) + '</div>' : ''); } },
          { key: 'dup', label: 'Kiểm trùng', gate: 'F035.C', render: function (e) { var d = dupOf(e); return d.length ? TH.badge('Trùng số HĐ ' + e.docNo, 'danger', { icon: 'alert', tip: 'Trùng chứng từ với ' + d.map(function (x) { return x.id; }).join(', ') }) : '<span class="muted small">—</span>'; } },
          { key: 'pay', label: 'Phải trả', gate: 'F036.C', render: function (e) { return e.category === 'owner_rent' ? (e.paid ? TH.badge('Đã trả', 'success') : TH.badge('Đến hạn ' + F.date(e.dueAt), 'warning')) : '<span class="muted small">—</span>'; } },
          { key: 'x', label: '', render: function (e) {
            var o = '';
            if (e.status === 'pending') {
              if (!TH.can('expense.approve')) o = TH.permBtn('expense.approve', '', 'Duyệt · 403');
              else if (sepRoles && e.createdBy === me) o = '<span class="forbidden-chip" data-tip="Tách người nhập/người duyệt (C)">Không tự duyệt</span>';
              else o = '<button type="button" class="btn btn-xs btn-soft" data-act="exp.approve" data-id="' + e.id + '">Duyệt</button><button type="button" class="btn btn-xs btn-ghost" data-act="exp.reject" data-id="' + e.id + '">Từ chối</button>';
            } else if (e.status === 'draft') o = '<button type="button" class="btn btn-xs" data-act="exp.edit" data-id="' + e.id + '">Sửa nháp</button><button type="button" class="btn btn-xs btn-soft" data-act="exp.submit" data-id="' + e.id + '">Gửi duyệt</button>';
            else if (e.status === 'approved' && TH.has('F035.D')) o = '<button type="button" class="btn btn-xs btn-ghost" data-act="exp.reverse" data-id="' + e.id + '" data-tip="Nhật ký sửa sau duyệt & reversal (D)">' + I('rotateCcw', 'ic-sm') + 'Reversal</button>';
            return '<div class="row-actions">' + o + '</div>';
          } },
        ],
        rows: pg.rows,
        foot: { _label: '<b>' + rows.length + ' khoản</b>', a: '<b>' + F.money(C.sum(rows, function (e) { return e.amount; })) + '</b>' },
        empty: { title: 'Không có chi phí', text: 'Chưa có khoản chi trong kỳ/tòa đang xem.' },
      });
      var bs = TH.db.buildings.filter(function (b) { return TH.inScope(b.id); });
      var schedule = TH.gate('F036.B', '<div class="card">' + TH.cardHd(I('calendar', 'ic-sm') + 'Lịch phải trả chủ nhà' + TH.up('F036.B'), 'Sinh từ điều khoản HĐ thuê tòa · chi tiết ở BLD-02 › Lịch thanh toán') + TH.table({ compact: true, cols: [
        { key: 'b', label: 'Tòa', render: function (b) { return '<a href="' + TH.router.href('BLD-02', b.id) + '">' + esc(b.short) + '</a>'; } },
        { key: 'o', label: 'Chủ nhà', render: function (b) { return esc(C.owner(b.ownerId).name); } },
        { key: 'r', label: 'Kỳ trả', num: true, render: function (b) { var l = TH.leaseOf(b.id); return l ? F.money(l.rent * l.payCycle) + '<div class="cell-sub">' + l.payCycle + ' tháng/lần</div>' : '—'; } },
        { key: 'd', label: 'Hạn kế tiếp', render: function (b) { var c = TH.has('F036.C'), n = TH.db.landlordPays.filter(function (x) { return x.buildingId === b.id && (c ? x.amount > x.paid : x.dueAt >= TH.TODAY); }).sort(function (a, c2) { return a.dueAt < c2.dueAt ? -1 : 1; })[0]; return n ? F.date(n.dueAt) + (c ? ' ' + TH.landlordPayState(n).b : '') : (c ? TH.badge('Đã trả đủ', 'success') : '<span class="muted">—</span>'); } },
      ], rows: bs }) + '</div>', { label: 'Tự sinh lịch phải trả từ điều khoản thuê tòa', lines: 3 });
      var payable = TH.gate('F036.D', '<div class="card">' + TH.cardHd(I('compare', 'ic-sm') + 'Đối chiếu phải trả & cost center' + TH.up('F036.D')) + '<div class="card-bd">' + TH.kv(bs.map(function (b) { var e = all.filter(function (x) { return x.buildingId === b.id; }); return ['CC-' + b.id.slice(3) + ' · ' + b.short, F.money(C.sum(e.filter(function (x) { return x.status === 'approved'; }), function (x) { return x.amount; })) + ' đã duyệt · ' + F.money(C.sum(e.filter(function (x) { return x.category === 'owner_rent' && !x.paid; }), function (x) { return x.amount; })) + ' phải trả']; })) + '</div></div>', { label: 'Đối chiếu payable + cost center', lines: 3 });
      var shared = TH.gate('F034.D', '<div class="card">' + TH.cardHd(I('split', 'ic-sm') + 'Chi phí chung phân bổ nhiều tòa' + TH.up('F034.D'), 'Theo tỷ lệ số phòng đã duyệt (mô phỏng)') + '<div class="card-bd">' + (function () { var total = 3000000, rooms = C.sum(TH.db.buildings, function (b) { return TH.db.rooms.filter(function (r) { return r.buildingId === b.id; }).length; }); return '<div class="small" style="margin-bottom:8px">Phần mềm & kế toán dịch vụ: <b>' + F.money(total) + '</b></div>' + TH.kv(TH.db.buildings.map(function (b) { var n = TH.db.rooms.filter(function (r) { return r.buildingId === b.id; }).length; return [b.short + ' (' + n + ' phòng)', F.money(Math.round(total * n / rooms / 1000) * 1000)]; })); })() + '<div class="small muted" style="margin-top:8px">Chưa ghi vào báo cáo cho đến khi tỷ lệ được duyệt.</div></div></div>', { label: 'Chi phí chung phân bổ nhiều tòa theo tỷ lệ', lines: 3 });
      var revLog = TH.gate('F035.D', '<div class="card">' + TH.cardHd(I('history', 'ic-sm') + 'Nhật ký sửa sau duyệt & reversal' + TH.up('F035.D')) + '<div class="card-bd"><ul class="timeline">' + (TH.db.audit.filter(function (a) { return a.kind === 'expense'; }).slice(0, 4).map(function (a) { return '<li>' + esc(a.action) + ' · ' + esc(a.entity) + '<div class="when">' + esc(C.staffName(a.by)) + ' · ' + F.date(a.at) + '</div></li>'; }).join('') || '<li class="muted">Chưa có.</li>') + '</ul></div></div>', { label: 'Nhật ký sửa sau duyệt và reversal', lines: 3 });
      var filters = TH.has('F035.B') ? TH.chips(S, 'st', [{ id: 'all', label: 'Tất cả', count: all.length }, { id: 'pending', label: 'Chờ duyệt', count: all.filter(function (e) { return e.status === 'pending'; }).length }, { id: 'draft', label: 'Nháp' }, { id: 'approved', label: 'Đã duyệt' }, { id: 'rejected', label: 'Từ chối' }], st) + TH.up('F035.B') : '<span class="small muted">Trạng thái: nháp / chờ duyệt / đã duyệt</span>' + TH.gate('F035.B', '', { mode: 'btn', label: 'Danh sách duyệt theo kỳ', size: 'btn-sm' });
      return TH.pageHeader({ screen: S, status: TH.periodBadge(p), desc: 'Báo cáo chỉ cộng chi phí đã duyệt. Tiền trả chủ nhà là một nhóm chi phí; không xóa được chi phí đã tính báo cáo.',
          actions: TH.gate('F034.B', TH.permBtn('expense.create', '<button type="button" class="btn" data-act="exp.import">' + I('upload', 'ic-sm') + 'Import Excel' + TH.up('F034.B') + '</button>', '403'), { mode: 'btn', label: 'Import Excel mẫu chi phí' }) + TH.exportBtn('exp.xlsx', 'Xuất (.xlsx)') + TH.permBtn('expense.create', '<button type="button" class="btn btn-primary" data-act="exp.new">' + I('plus', 'ic-sm') + 'Tạo chi phí</button>', 'Tạo · 403') }) +
        '<div class="grid-4" style="margin-bottom:16px">' + TH.kpi({ label: 'Đã duyệt (vào báo cáo)', icon: 'checkCircle', value: F.short(sum('approved')), accent: true, href: TH.router.href('RPT-01') }) + TH.kpi({ label: 'Chờ duyệt', icon: 'clock', value: F.short(sum('pending')) }) + TH.kpi({ label: 'Nháp', icon: 'edit', value: F.short(sum('draft')) }) + TH.kpi({ label: 'Từ chối', icon: 'xCircle', value: F.short(sum('rejected')) }) + '</div>' +
        '<div class="card card-flush" style="margin-bottom:16px"><div class="toolbar">' + filters + '<span class="grow"></span>' + TH.uiSelect(S, 'cat', [{ id: 'all', label: 'Mọi nhóm chi' }].concat(Object.keys(TH.EXPENSE_CATS).map(function (k) { return { id: k, label: TH.EXPENSE_CATS[k] }; })), cat, 'Nhóm chi') + '</div>' + table + TH.pager(S, pg) + '</div>' +
        '<div class="grid-2" style="margin-bottom:16px">' + schedule + payable + '</div><div class="grid-2">' + shared + revLog + '</div>';
    },
    dialogs: [function () { expForm('new'); }],
  };
  function expForm(id) {
    var e = id === 'new' ? null : TH.db.expenses.find(function (x) { return x.id === id; }), form = 'exp-' + id;
    var bs = TH.buildingOptions(false);
    var doc = TH.store.draft(form, 'docNo', e ? e.docNo : ''), b = TH.store.draft(form, 'b', e ? e.buildingId : bs[0].id);
    var dup = doc ? TH.db.expenses.filter(function (x) { return x.docNo === doc && x.buildingId === b && x !== e && x.status !== 'rejected'; }) : [];
    return { title: e ? 'Sửa chi phí nháp ' + esc(e.id) : 'Tạo chi phí', sub: 'Form thủ công theo tòa · kỳ ' + F.period(TH.store.state.period),
      body: '<div class="stack"><div class="form-grid">' + TH.field({ form: form, name: 'b', label: 'Tòa', type: 'select', options: bs, def: e ? e.buildingId : bs[0].id }) + TH.field({ form: form, name: 'cat', label: 'Nhóm chi', type: 'select', options: Object.keys(TH.EXPENSE_CATS).map(function (k) { return { id: k, label: TH.EXPENSE_CATS[k] }; }), def: e ? e.category : 'repair' }) +
        TH.field({ form: form, name: 'desc', label: 'Mô tả', def: e ? e.description : '', span: true }) + TH.field({ form: form, name: 'amount', label: 'Giá trị (đ)', num: true, def: e ? e.amount : '' }) + TH.field({ form: form, name: 'docNo', label: 'Số hóa đơn / chứng từ', def: e ? e.docNo : '', live: true }) +
        '<div class="field span-2"><span class="field-label">Ảnh chứng từ</span>' + TH.fileOf(e ? e.file : 'chungtu_moi.jpg') + '</div></div>' +
        (dup.length ? TH.gate('F035.C', '<div class="alert alert-danger">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Trùng chứng từ theo tòa và số hóa đơn ' + TH.up('F035.C') + '</b><span>' + dup.map(function (x) { return esc(x.id + ' · ' + x.description + ' · ' + F.money(x.amount)); }).join('<br>') + '</span></div></div>', { label: 'Kiểm trùng chứng từ', lines: 1 }) : '') + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn" data-act="exp.save" data-id="' + id + '" data-st="draft">Lưu nháp</button><button type="button" class="btn btn-primary" data-act="exp.save" data-id="' + id + '" data-st="pending">Gửi duyệt</button>' };
  }
  TH.act['exp.new'] = function () { TH.modal.open({ key: 'exp-form', size: 'md', render: function () { return expForm('new'); } }); };
  TH.act['exp.edit'] = function (el) { var id = el.dataset.id; TH.modal.open({ key: 'exp-form', size: 'md', render: function () { return expForm(id); } }); };
  TH.act['exp.save'] = function (el) {
    var id = el.dataset.id, form = 'exp-' + id, g = function (k, d) { return TH.store.draft(form, k, d); };
    var e = id === 'new' ? null : TH.db.expenses.find(function (x) { return x.id === id; });
    var amount = +String(g('amount', e ? e.amount : '')).replace(/\D/g, ''), desc = (g('desc', e ? e.description : '') || '').trim();
    if (!amount || !desc) { TH.toast('Thiếu thông tin', 'Nhập mô tả và giá trị.', 'danger'); return; }
    var rec = { buildingId: g('b', e ? e.buildingId : TH.buildingOptions(false)[0].id), category: g('cat', e ? e.category : 'repair'), description: desc, amount: amount, docNo: g('docNo', e ? e.docNo : '') || '—', status: el.dataset.st };
    if (e) Object.assign(e, rec);
    else { var p = TH.store.state.period; e = Object.assign({ id: 'CP-' + p.slice(2, 4) + p.slice(5) + '-' + String(TH.db.expenses.length + 1).padStart(3, '0'), period: p, date: TH.TODAY, createdBy: TH.me().id, approvedBy: null, approvedAt: null, file: 'chungtu_moi.jpg', reason: '' }, rec); TH.db.expenses.push(e); }
    TH.log(el.dataset.st === 'draft' ? 'Lưu nháp chi phí' : 'Gửi duyệt chi phí', e.id, desc + ' · ' + F.money(amount), 'expense', e.buildingId);
    TH.store.clearDraft(form); TH.modal.close('exp-form', { silent: true }); TH.app.refresh(); TH.toast(el.dataset.st === 'draft' ? 'Đã lưu nháp' : 'Đã gửi duyệt', esc(e.id));
  };
  TH.act['exp.submit'] = function (el) { var e = TH.db.expenses.find(function (x) { return x.id === el.dataset.id; }); e.status = 'pending'; TH.log('Gửi duyệt chi phí', e.id, '', 'expense', e.buildingId); TH.app.refresh(); TH.toast('Đã gửi duyệt', esc(e.id)); };
  TH.act['exp.approve'] = function (el) {
    var e = TH.db.expenses.find(function (x) { return x.id === el.dataset.id; });
    var d = dupOf(e);
    var go = function () { e.status = 'approved'; e.approvedBy = TH.me().id; e.approvedAt = TH.TODAY; if (e.category === 'owner_rent') e.paid = false; TH.log('Duyệt chi phí', e.id, e.description + ' · ' + F.money(e.amount), 'expense', e.buildingId); TH.app.refresh(); TH.toast('Đã duyệt chi phí', esc(e.id) + ' · báo cáo đã cập nhật'); };
    if (d.length && TH.has('F035.C')) TH.confirm({ title: 'Chứng từ nghi trùng', body: '<p>' + esc(e.docNo) + ' trùng với ' + d.map(function (x) { return x.id; }).join(', ') + '. Vẫn duyệt?</p>', ok: 'Vẫn duyệt', danger: true }).then(function (ok) { if (ok) go(); });
    else go();
  };
  TH.act['exp.reject'] = function (el) {
    var e = TH.db.expenses.find(function (x) { return x.id === el.dataset.id; });
    TH.confirm({ title: 'Từ chối chi phí ' + e.id + '?', body: '<p>Lý do được lưu: <b>' + (dupOf(e).length ? 'Trùng chứng từ ' + esc(e.docNo) : 'Chứng từ chưa hợp lệ') + '</b>.</p>', ok: 'Từ chối', danger: true }).then(function (ok) {
      if (!ok) return; e.status = 'rejected'; e.reason = dupOf(e).length ? 'Trùng chứng từ ' + e.docNo : 'Chứng từ chưa hợp lệ'; e.approvedBy = TH.me().id; TH.log('Từ chối chi phí', e.id, e.reason, 'expense', e.buildingId); TH.app.refresh(); TH.toast('Đã từ chối', esc(e.reason), 'warning');
    });
  };
  TH.act['exp.reverse'] = function (el) {
    var e = TH.db.expenses.find(function (x) { return x.id === el.dataset.id; });
    TH.confirm({ title: 'Lập bút toán đảo (reversal)?', body: '<p>Chi phí đã tính báo cáo không bị xóa; hệ thống tạo khoản âm ' + F.money(-e.amount) + ' có liên kết và lý do.</p>', ok: 'Lập reversal' }).then(function (ok) {
      if (!ok) return;
      TH.db.expenses.push(Object.assign({}, e, { id: e.id + '-R', amount: -e.amount, description: 'Đảo: ' + e.description, status: 'approved', approvedBy: TH.me().id, approvedAt: TH.TODAY, date: TH.TODAY }));
      TH.log('Reversal chi phí', e.id, F.money(-e.amount), 'expense', e.buildingId); TH.app.refresh(); TH.toast('Đã lập reversal', esc(e.id + '-R'));
    });
  };
  TH.act['exp.import'] = function () { TH.toast('Import Excel chi phí (mô phỏng)', 'Tệp “chi_phi_T10.xlsx”: 6 dòng hợp lệ đã đưa vào trạng thái Nháp để duyệt.', 'info'); };
  TH.act['exp.xlsx'] = function () {
    var p = TH.store.state.period, rows = TH.db.expenses.filter(function (e) { return e.period === p && TH.inScope(e.buildingId); });
    TH.exportXlsx('Chi_phi_ky_' + p, [{ name: 'Chi phi', title: 'Chi phí kỳ ' + F.period(p) + ' — ' + TH.scopeLabel(), note: 'Báo cáo chỉ cộng chi phí đã duyệt', columns: [{ label: 'Mã', width: 14 }, { label: 'Tòa', width: 18 }, { label: 'Nhóm chi', width: 26 }, { label: 'Mô tả', width: 32 }, { label: 'Chứng từ' }, { label: 'Giá trị', type: 'money' }, { label: 'Trạng thái' }],
      rows: rows.map(function (e) { return [e.id, C.building(e.buildingId).name, TH.EXPENSE_CATS[e.category], e.description, e.docNo, e.amount, TH.statusLabel(e.status)]; }) }]);
    TH.toast('Đã xuất chi phí', rows.length + ' khoản · .xlsx');
  };
})();
