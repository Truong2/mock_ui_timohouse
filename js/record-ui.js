/* CR-CRUD: accessible row actions and forms using the existing design system. */
(function () {
  'use strict';
  var R = TH.recordActions, C = TH.calc, F = TH.fmt, esc = TH.esc;
  var labels = { name: 'Tên', phone: 'Số điện thoại', email: 'Email', address: 'Địa chỉ', permAddress: 'Địa chỉ thường trú', taxCode: 'Mã số thuế', note: 'Ghi chú', short: 'Tên ngắn', area: 'Khu vực / diện tích', floors: 'Số tầng', landArea: 'Diện tích đất (m²)', buildArea: 'Diện tích xây dựng (m²)', floorArea: 'Diện tích sàn (m²)', floor: 'Tầng', dob: 'Ngày sinh', idNo: 'Số giấy tờ', relation: 'Quan hệ với khách đứng tên', occupation: 'Nghề nghiệp', hometown: 'Quê quán', scanFile: 'Tên file hợp đồng', file: 'Tên file', referrer: 'Người giới thiệu', result: 'Kết quả liên hệ', moveOutAt: 'Ngày chuyển đi', callbackAt: 'Ngày gọi lại', from: 'Hiệu lực từ', to: 'Hiệu lực đến', role: 'Vai trò', qty: 'Số lượng', unit: 'Đơn vị', location: 'Vị trí', condition: 'Tình trạng', kind: 'Loại', dueAt: 'Hạn thanh toán', amount: 'Số tiền (đ)', docNo: 'Số chứng từ', elecPrev: 'Điện kỳ trước', elecCur: 'Điện kỳ này', waterPrev: 'Nước kỳ trước', waterCur: 'Nước kỳ này', price: 'Đơn giá (đ)', source: 'Căn cứ', receivedAt: 'Ngày thực nhận', method: 'Phương thức', evidence: 'Chứng từ / mã giao dịch', refundAmount: 'Số tiền hoàn (đ)', forfeitAmount: 'Số tiền giữ (đ)', description: 'Mô tả', category: 'Nhóm chi / khoản', date: 'Ngày', title: 'Chức vụ', team: 'Đội nhóm', leaderId: 'Trưởng nhóm', reason: 'Lý do / căn cứ', type: 'Loại', ratio: 'Tỷ lệ (%)', capital: 'Vốn (đ)', templateId: 'Mẫu tin', day: 'Ngày nhắc trong tháng', body: 'Nội dung mẫu tin', username: 'Tên đăng nhập', plate: 'Biển số', brand: 'Hãng xe', color: 'Màu xe' };
  var names = { view: 'Xem', edit: 'Sửa', delete: 'Xóa nhập nhầm', restore: 'Khôi phục', archive: 'Ngừng hoạt động', activate: 'Kích hoạt lại', cancel: 'Hủy', withdraw: 'Rút yêu cầu', submit: 'Gửi duyệt', approve: 'Duyệt điều chỉnh', reject: 'Trả lại', correct: 'Lập điều chỉnh', end: 'Kết thúc', invalidate: 'Đánh dấu hết hiệu lực', terms: 'Điều chỉnh giá theo kỳ' };
  var screenTypes = {
    'OWN-01': ['owner'], 'OWN-02': ['owner', 'lease', 'leaseDraft', 'document'], 'BLD-01': ['building', 'leaseDraft'], 'BLD-02': ['building', 'lease', 'leaseDraft', 'assignment', 'asset', 'document', 'landlordPay'],
    'ROOM-01': ['room'], 'ROOM-02': ['room', 'reading'], 'CUS-01': ['customer'], 'CUS-02': ['customer', 'occupant', 'vehicle', 'contract', 'depositCase', 'deposit', 'customerDocument'],
    'CON-01': ['contract', 'contractDraft'], 'CON-02': ['contract', 'contractDraft'], 'CON-03': ['followup'], 'CON-FOLLOW': ['followup'], 'METER-01': ['reading', 'fee'],
    'INV-01': ['invoice', 'billAdjustment'], 'INV-02': ['invoice'], 'INV-03': ['invoice'], 'PAY-01': ['receipt'], 'PAY-APP': ['receipt'], 'PAY-02': ['receipt'],
    'EXP-01': ['expense', 'landlordPay'], 'HR-01': ['staff', 'team', 'assignment'], 'HR-ASSIGN': ['assignment'], 'SAL-01': ['salaryInput', 'salaryAdjustment'], 'SAL-ADJ': ['salaryAdjustment'],
    'SHARE-01': ['share', 'shareholder'], 'SHARE-RESULT': ['share'], 'OA-01': ['oaTemplate', 'oaSchedule'], 'OA-02': ['message'], 'SYS-01': ['user'], 'REPORTS': ['report'],
    'RPT-01': ['invoice', 'expense'], 'RPT-02': ['receipt'], 'RPT-03': ['salaryAdjustment', 'share'], 'RPT-04': ['invoice', 'expense', 'deposit'], 'RPT-05': ['invoice', 'expense'], 'RPT-06': ['reading', 'expense', 'customer']
  };
  Object.assign(names, { run: 'Chạy mô phỏng', transfer: 'Điều chuyển', unlink: 'Gỡ liên kết', approve: 'Duyệt' });
  Object.assign(labels, { base: 'Lương cơ bản (đ)', allowance: 'Phụ cấp (đ)', rent: 'Giá thuê (đ/tháng)', deposit: 'Tiền cọc (đ)', start: 'Ngày bắt đầu', end: 'Ngày kết thúc', buildingId: 'Tòa nhà', ownerId: 'Chủ nhà', customerId: 'Khách thuê', roomId: 'Phòng' });
  var currentScreen = null, bypassTable = false;
  R.availableActions = function (type, r) {
    if (type === 'contractDraft' || type === 'leaseDraft') return r.status === 'draft' ? ['view', 'edit', 'approve', 'delete'] : ['view'];
    if (type === 'oaTemplate' && r.status === 'draft') return ['view', 'edit', 'approve', 'delete'];
    if (type === 'correction') return r.status === 'pending' ? ['view', 'approve', 'reject', 'withdraw'] : ['draft', 'rejected'].indexOf(r.status) >= 0 ? ['view', 'submit', 'delete'] : ['view'];
    if (type === 'report') return ['view', 'invalidate'];
    if (type === 'oaSchedule') return ['view', 'edit', 'run', r.status === 'inactive' ? 'activate' : 'archive', 'delete'];
    if (type === 'document' || type === 'customerDocument') return ['view', 'edit', r.status === 'archived' ? 'activate' : 'unlink', 'delete'];
    if (type === 'assignment') return ['view', 'edit', 'transfer', 'end', 'delete'];
    if (type === 'depositCase' && r.state === 'pending_approval') return ['view', 'withdraw'];
    if (type === 'depositCase' && ['approved', 'refunded', 'settled', 'forfeited', 'transferred'].indexOf(r.state) >= 0) return ['view'];
    if (type === 'message') return ['view', 'cancel'];
    if (R.isPosted(type, r)) return ['view', 'correct'].concat(type === 'invoice' ? ['cancel'] : []);
    if (r.status === 'cancelled') return ['view'];
    if (r.status === 'pending' && ['receipt', 'expense', 'billAdjustment'].indexOf(type) >= 0) return ['view', 'edit', 'withdraw'];
    var arr = ['view', 'edit'];
    if (['contract', 'lease', 'room'].indexOf(type) >= 0 && r.status !== 'draft') arr.push('terms');
    if (['contract', 'lease', 'assignment', 'vehicle'].indexOf(type) >= 0 && r.status !== 'draft' && r.status !== 'pending') arr.push('end');
    else if (['owner', 'building', 'room', 'customer', 'staff', 'team', 'asset', 'user', 'oaSchedule', 'shareholder'].indexOf(type) >= 0) arr.push(['inactive', 'retired'].indexOf(r.status) >= 0 ? 'activate' : 'archive');
    if (['receipt', 'expense', 'billAdjustment'].indexOf(type) >= 0 && ['draft', 'rejected'].indexOf(r.status) >= 0) arr.push('submit');
    arr.push('delete'); return arr;
  };
  /* Thao tác dòng hiển thị dạng icon (nhãn ở tooltip); thứ tự ưu tiên: Sửa → Xem → menu ⋯ */
  var ICONS = { view: 'eye', edit: 'edit', delete: 'trash', restore: 'rotateCcw', archive: 'ban', activate: 'rotateCcw', cancel: 'xCircle', withdraw: 'rotateCcw', submit: 'send', approve: 'check', reject: 'x', correct: 'sliders', terms: 'contract', end: 'ban', invalidate: 'ban', run: 'play', transfer: 'arrowRight', unlink: 'link', draft: 'edit', rejected: 'x' };
  function button(type, r, action, text) {
    var check = R.inspect(type, r.id, action);
    return '<button type="button" class="btn btn-sm' + (['delete', 'cancel', 'archive', 'end', 'invalidate'].indexOf(action) >= 0 ? ' btn-danger' : '') + '" data-act="rec.open" data-type="' + type + '" data-id="' + esc(r.id) + '" data-action="' + action + '"' + (action === 'edit' ? ' data-priority="60"' : action === 'view' ? ' data-priority="50"' : '') + (!check.allowed ? ' data-tip="' + esc(check.reason) + '"' : '') + '>' + TH.icon(ICONS[action] || 'more', 'ic-sm') + esc(text || names[action]) + '</button>';
  }
  R.rowButtons = function (type, r) { return R.availableActions(type, r).map(function (action) { return button(type, r, action); }).join(''); };
  var originalTable = TH.table;
  TH.table = function (o) {
    if (bypassTable || !currentScreen || !o.rows || !o.rows.length) return originalTable(o);
    var types = screenTypes[currentScreen] || [], refs = new Map();
    types.forEach(function (t) { R.list(t).forEach(function (r) { refs.set(r, { type: t, record: r }); }); });
    function ref(row) { return refs.get(row) || (row.k && refs.get(row.k)) || (row.id && types.map(function (t) { var r = R.get(t, row.id); return r && { type: t, record: r }; }).find(Boolean)); }
    if (!o.rows.every(function (row) { return !!ref(row); })) return originalTable(o);
    var opts = Object.assign({}, o, { cols: o.cols.slice() });
    var ix = opts.cols.findIndex(function (c, i, all) { return c.kind === 'actions' || (!c.label && (/^(x|go|act|actions)$/.test(c.key) || i === all.length - 1)); });
    var col = { key: '_record', kind: 'actions', label: 'Thao tác', render: function (row) { var x = ref(row); return R.rowButtons(x.type, x.record); } };
    if (ix >= 0) { var old = opts.cols[ix]; col.key = old.key; col.render = function (row) { var x = ref(row); return R.rowButtons(x.type, x.record) + (old.render ? old.render(row) : ''); }; opts.cols[ix] = col; } else opts.cols.push(col);
    if (opts.mobile) opts.mobile = Object.assign({}, opts.mobile, { visible: opts.mobile.visible.concat([col.key]) });
    return originalTable(opts);
  };
  function input(form, type, r, key) {
    if (type === 'user' && key === 'scope') return '<div class="field field-span"><span class="field-label">Phạm vi tòa</span>' + TH.db.buildings.map(function (b) { return '<label class="check"><input type="checkbox" data-draft="' + form + '.scope-' + b.id + '"' + (TH.store.draft(form, 'scope-' + b.id, (r.scope || []).indexOf(b.id) >= 0) ? ' checked' : '') + '>' + esc(b.short) + '</label>'; }).join('') + '</div>';
    var val = r[key] === undefined || r[key] === null ? '' : r[key], opts = { form: form, name: key, label: labels[key] || key, def: val };
    if (typeof val === 'number' || /^(amount|price|qty|ratio|capital|elecPrev|elecCur|waterPrev|waterCur|refundAmount|forfeitAmount|day|floor|floors|landArea|buildArea|floorArea)$/.test(key)) { opts.num = true; opts.inputmode = 'decimal'; }
    if (/^(dob|moveOutAt|callbackAt|receivedAt|dueAt|date)$/.test(key)) opts.type = 'date';
    if (key === 'from' || key === 'to') opts.type = type === 'landlordPay' ? 'month' : 'date';
    if (/^(note|reason|description|body|address|permAddress)$/.test(key)) { opts.type = 'textarea'; opts.span = true; }
    if (type === 'contractDraft' && ['rent', 'deposit'].indexOf(key) >= 0) { opts.num = true; opts.inputmode = 'numeric'; }
    if (['start', 'end'].indexOf(key) >= 0) opts.type = 'date';
    if (['rent', 'deposit', 'payCycle', 'payTo'].indexOf(key) >= 0) { opts.num = true; opts.inputmode = 'numeric'; }
    var extraLabels = { rent: 'Giá thuê (đ/tháng)', deposit: 'Tiền cọc (đ)', start: 'Ngày bắt đầu', end: 'Ngày kết thúc', payCycle: 'Chu kỳ thanh toán (tháng)', payTo: 'Ngày hạn trả (1–28)' }; if (extraLabels[key]) opts.label = extraLabels[key];
    var choices;
    if (key === 'buildingId') { opts.label = 'Tòa nhà'; choices = TH.db.buildings.filter(function (b) { return TH.inScope(b.id) && b.status !== 'inactive'; }).map(function (b) { return { id: b.id, label: b.name }; }); }
    if (key === 'ownerId') { opts.label = 'Chủ nhà'; choices = TH.db.owners.filter(function (b) { return b.status !== 'inactive'; }).map(function (b) { return { id: b.id, label: b.name }; }); }
    if (key === 'customerId') { opts.label = 'Khách thuê'; choices = TH.db.customers.filter(function (k) { return k.status !== 'inactive'; }).map(function (k) { return { id: k.id, label: k.name }; }); if (r.customerData) choices.unshift({ id: 'OCR', label: 'Khách mới từ OCR · ' + r.customerData.name }); }
    if (key === 'roomId') { opts.label = 'Phòng'; choices = TH.db.rooms.filter(function (k) { return TH.inScope(k.buildingId) && k.status !== 'inactive'; }).map(function (k) { return { id: k.id, label: k.id }; }); }
    if (type === 'user' && key === 'role') choices = Object.keys(TH.ROLES).map(function (k) { return { id: k, label: TH.ROLES[k].label }; });
    if (type === 'expense' && key === 'category') choices = Object.keys(TH.EXPENSE_CATS).map(function (k) { return { id: k, label: TH.EXPENSE_CATS[k] }; });
    if (key === 'team') choices = TH.db.teams.filter(function (t) { return t.status !== 'inactive'; }).map(function (t) { return { id: t.id, label: t.name }; });
    if (key === 'leaderId') choices = TH.db.staff.filter(function (s) { return s.status === 'active'; }).map(function (s) { return { id: s.id, label: s.name }; });
    if (key === 'templateId') choices = TH.db.oaTemplates.filter(function (s) { return s.status === 'approved'; }).map(function (s) { return { id: s.id, label: s.name }; });
    if (key === 'result') choices = [{ id: 'extend', label: 'Gia hạn' }, { id: 'move_out', label: 'Chuyển đi' }, { id: 'no_answer', label: 'Chưa phản hồi' }];
    if (choices) { opts.type = 'select'; opts.options = choices; if (!val && choices.length) opts.def = choices[0].id; }
    return TH.field(opts);
  }
  function details(type, r) {
    var d = R.definitions[type], fields = [['Mã', esc(r.id)], ['Trạng thái', esc(TH.statusLabel(r.status || r.state || 'active'))]];
    d.fields.forEach(function (k) { fields.push([labels[k] || k, esc(r[k] === undefined ? '—' : r[k])]); });
    if (R.isPosted(type, r)) fields.push(['Giá trị sau điều chỉnh', F.money(R.effectiveAmount(type, r))]);
    if (type === 'correction') fields = [['Chứng từ nguồn', button(r.sourceType, { id: r.sourceId }, 'view', r.sourceId)], ['Kỳ nguồn', esc(r.sourcePeriod)], ['Kỳ ghi nhận', esc(r.targetPeriod)], ['Số tiền cũ', F.money(r.beforeAmount)], ['Số tiền đúng', F.money(r.amount)], ['Chênh lệch', F.money(r.delta)], ['Giao dịch tiền', r.mode === 'cash' ? esc((r.transactionDate || '') + ' · ' + r.evidence) : r.mode === 'allocation' ? 'Chuyển phân bổ · ' + esc(r.targetInvoiceId) : 'Sửa ghi nhận; không phát sinh thu / chi tiền'], ['Lý do', esc(r.reason)], ['Trạng thái', esc(r.status)]];
    if (type === 'report') fields.push(['Hiệu lực', r.invalidatedAt ? 'Hết hiệu lực: ' + esc(r.invalidationReason) : 'Đang có hiệu lực']);
    var history = (TH.db.recordHistory || []).filter(function (h) { return h.type === type && h.recordId === r.id; }).slice(0, 12), target = d.detail || d.screen;
    return TH.kv(fields) + (target ? '<a class="btn btn-sm" href="' + TH.router.href(target, d.detail ? r.id : undefined) + '">Mở màn nghiệp vụ</a>' : '') + (history.length ? '<h3 class="u-mt-16">Lịch sử thay đổi</h3><ul class="timeline">' + history.map(function (h) { return '<li>' + esc(names[h.action] || h.action) + ' · ' + esc(C.staffName(h.by)) + '<div class="when">' + esc(h.at) + ' · ' + esc(h.reason) + '</div></li>'; }).join('') + '</ul>' : '');
  }
  R.open = function (type, id, action) {
    R.init(); var check = R.inspect(type, id, action), r = check.record, d = R.definitions[type];
    if (!r) { TH.toast('Không thể mở', esc(check.reason), 'warning'); return; }
    if (!check.allowed) {
      TH.modal.open({ key: 'rec-blocked', size: 'md', render: function () { return { title: 'Chưa thể ' + (names[action] || '').toLowerCase(), body: '<p>' + esc(check.reason) + '</p>' + check.related.map(function (x) { var t = Object.keys(R.definitions).find(function (k) { return R.definitions[k].collection === x.collection; }); return t ? '<div class="u-mt-8">' + button(t, { id: x.id }, 'view', 'Mở ' + x.id) + '</div>' : ''; }).join(''), foot: '<button type="button" class="btn" data-close>Đóng</button>' }; } }); return;
    }
    var key = 'rec-' + type + '-' + id, form = key + '-' + action; TH.store.clearDraft(form);
    TH.modal.open({ key: key, size: 'md', recordForm: form, render: function () {
      var fresh = R.inspect(type, id, action), html = '', err = TH.store.draft(form, '_error', '');
      if (err) html += '<div class="alert alert-danger" role="alert">' + esc(err) + '</div>';
      html += '<p class="small muted">' + esc(d.label + ' · ' + id) + '</p>';
      var impacts = { delete: 'Bản ghi sẽ rời danh sách đang dùng và được giữ trong Đã xóa để khôi phục. Không xóa các hồ sơ liên quan.', archive: 'Ngừng dùng cho nghiệp vụ mới; dữ liệu và lịch sử đã phát sinh được giữ lại.', end: 'Kết thúc theo ngày hiệu lực; giữ các ghi nhận và phân công trước đó.', cancel: type === 'invoice' ? 'Hóa đơn sẽ ngừng tính phải thu. Chứng từ gốc và lý do hủy được giữ trong lịch sử.' : 'Tin đang chờ sẽ bị hủy và không gửi trong mô phỏng.', restore: 'Đưa bản ghi trở lại danh sách sau khi kiểm tra mã trùng và các hồ sơ cha.' };
      if (impacts[action]) html += '<p>' + esc(impacts[action]) + '</p>';
      if (action === 'edit') {
        var adapter = R.formAdapter(type);
        html += '<div class="form-grid">' + (adapter ? adapter.fields(id).filter(function (f) { return f.name && f.name !== 'status'; }).map(function (f) { return TH.field(Object.assign({}, f, { form: form, def: adapter.values(id)[f.name] })); }).join('') : d.fields.map(function (k) { return input(form, type, r, k); }).join('')) + '</div>';
        if (type === 'invoice') html += '<h3>Dòng hóa đơn nháp</h3>' + r.lines.map(function (l, i) { return '<div class="form-grid">' + TH.field({ form: form, name: 'line-' + i, label: l.name + ' · thành tiền (đ)', num: true, def: l.amount }) + '</div>'; }).join('');
      }
      else if (action === 'correct') {
        var periods = R.openPeriods().filter(function (p) { return p >= R.period(type, r); });
        html += TH.kv([['Giá trị hiện tại', F.money(R.effectiveAmount(type, r))], ['Kỳ nguồn', esc(R.period(type, r))]]) + '<div class="form-grid">' + TH.field({ form: form, name: 'targetPeriod', label: 'Ghi nhận trong kỳ đang mở', type: 'select', options: periods, def: R.defaultPeriod(R.period(type, r)) }) + TH.field({ form: form, name: 'amount', label: 'Tổng giá trị đúng sau điều chỉnh (đ)', num: true, def: R.effectiveAmount(type, r), live: true }) +
          (type === 'invoice' ? TH.field({ form: form, name: 'lineIndex', label: 'Dòng ghi nhận phần chênh lệch', type: 'select', options: [{ id: '-1', label: 'Khoản phát sinh / giảm trừ mới' }].concat(r.lines.map(function (l, i) { return { id: String(i), label: l.name }; })), def: '0' }) + TH.field({ form: form, name: 'lineName', label: 'Diễn giải khoản mới (nếu bổ sung)', def: 'Khoản phát sinh' }) : '') +
          (['receipt', 'deposit', 'landlordPay'].indexOf(type) >= 0 ? TH.field({ form: form, name: 'mode', label: 'Bản chất điều chỉnh', type: 'select', options: [{ id: 'recording', label: 'Sửa số ghi nhận sai' }, { id: 'cash', label: 'Có giao dịch tiền thực tế' }].concat(type === 'receipt' ? [{ id: 'allocation', label: 'Chuyển phần giảm sang hóa đơn khác' }] : []), def: 'recording' }) : '') + (type === 'receipt' ? TH.field({ form: form, name: 'targetInvoiceId', label: 'Hóa đơn nhận phân bổ (khi chuyển)', type: 'select', options: [{ id: '', label: '— Không chuyển —' }].concat(TH.db.invoices.filter(function (i) { return i.id !== r.invoiceId && i.customerId === C.invoice(r.invoiceId).customerId && i.status === 'confirmed' && TH.inScope(i.buildingId); }).map(function (i) { return { id: i.id, label: i.id }; })) }) : '') + TH.field({ form: form, name: 'evidence', label: 'Chứng từ / mã giao dịch', def: '' }) + '</div><p class="small">Chênh lệch dự kiến: <b>' + F.money(Number(TH.store.draft(form, 'amount', R.effectiveAmount(type, r))) - R.effectiveAmount(type, r)) + '</b>. Chỉ ghi nhận sau khi người khác duyệt; chứng từ gốc giữ nguyên.</p>';
      } else if (action === 'terms') {
        html += '<div class="form-grid">' + TH.field({ form: form, name: 'rent', label: 'Giá thuê mới (đ)', num: true, def: R.rateAt(r, TH.store.state.period) }) + TH.field({ form: form, name: 'effectiveFrom', label: 'Hiệu lực từ kỳ', type: 'month', def: R.defaultPeriod() }) + '</div>';
        if (type === 'contract') html += '<h3>Đơn giá phí áp dụng cùng kỳ</h3><div class="form-grid">' + R.contractAt(r, TH.store.state.period).priceList.filter(function (l) { return l.active; }).map(function (l) { return TH.field({ form: form, name: 'fee-' + l.code, label: (TH.feeType(l.code) || { name: l.code }).name + ' (đ)', num: true, def: l.price }); }).join('') + '</div>';
      }
      else if (action === 'transfer') html += '<div class="form-grid">' + TH.field({ form: form, name: 'staffId', label: 'Nhân sự nhận phân công', type: 'select', options: TH.db.staff.filter(function (s) { return s.status === 'active' && s.id !== r.staffId; }).map(function (s) { return { id: s.id, label: s.name }; }) }) + TH.field({ form: form, name: 'date', label: 'Ngày hiệu lực', type: 'date', def: TH.TODAY }) + '</div>';
      else html += details(type, r);
      if (action === 'end') html += TH.field({ form: form, name: 'date', label: 'Ngày kết thúc có hiệu lực', type: 'date', def: TH.TODAY });
      if (action === 'correct' && ['receipt', 'deposit', 'landlordPay', 'expense'].indexOf(type) >= 0) html += TH.field({ form: form, name: 'date', label: 'Ngày giao dịch (khi có thu / chi thực tế)', type: 'date', def: TH.TODAY });
      if (action === 'correct' && type === 'expense') { var effective = R.effectiveExpense(r); html += '<h3>Khoản thay thế sau khi đảo</h3><div class="form-grid">' + TH.field({ form: form, name: 'replacementCategory', label: 'Nhóm chi đúng', type: 'select', options: Object.keys(TH.EXPENSE_CATS).map(function (k) { return { id: k, label: TH.EXPENSE_CATS[k] }; }), def: effective.category }) + TH.field({ form: form, name: 'replacementDescription', label: 'Diễn giải đúng', def: effective.description }) + TH.field({ form: form, name: 'replacementDocNo', label: 'Số chứng từ thay thế', def: effective.docNo }) + '</div><p class="small">Đảo phần đang ghi nhận rồi lập khoản thay thế. Có thể sửa phân loại ngay cả khi tổng tiền không đổi.</p>'; }
      if (['view', 'edit', 'restore', 'activate'].indexOf(action) < 0) html += TH.field({ form: form, name: 'reason', label: 'Lý do / căn cứ', type: 'textarea', required: true, def: action === 'approve' ? r.reason || '' : '' });
      return { title: (names[action] || action) + ' · ' + d.label, body: html, foot: '<button type="button" class="btn" data-close>' + (action === 'view' ? 'Đóng' : 'Hủy chỉnh sửa') + '</button>' + (action === 'view' ? '' : '<button type="button" class="btn btn-primary" data-act="rec.save" data-type="' + type + '" data-id="' + esc(id) + '" data-action="' + action + '" data-form="' + esc(form) + '" data-modal="' + esc(key) + '"' + (!fresh.allowed ? ' disabled title="' + esc(fresh.reason) + '"' : '') + '>' + (action === 'edit' ? 'Lưu thay đổi' : action === 'correct' ? 'Gửi duyệt điều chỉnh' : esc(names[action])) + '</button>') };
    } });
  };
  TH.act['rec.open'] = function (el) { R.open(el.dataset.type, el.dataset.id, el.dataset.action || 'view'); };
  TH.act['rec.save'] = function (el) {
    var ds = el.dataset, draft = TH.store.draft(ds.form) || {}, values = {};
    R.definitions[ds.type].fields.forEach(function (k) { if (draft[k] !== undefined) { var r = R.get(ds.type, ds.id); values[k] = r && typeof r[k] === 'number' ? Number(draft[k]) : draft[k]; } });
    var payload = Object.assign({}, draft, { values: values });
    if (ds.action === 'edit' && R.formAdapter(ds.type)) { payload.adapter = true; payload.values = Object.assign({}, draft); }
    if (ds.type === 'user' && ds.action === 'edit') payload.values.scope = TH.db.buildings.filter(function (b) { return TH.store.draft(ds.form, 'scope-' + b.id, (R.get('user', ds.id).scope || []).indexOf(b.id) >= 0); }).map(function (b) { return b.id; });
    if (ds.type === 'invoice' && ds.action === 'edit') payload.lines = R.get('invoice', ds.id).lines.map(function (l, i) { return Object.assign({}, l, { amount: draft['line-' + i] === undefined ? l.amount : Number(draft['line-' + i]) }); });
    if (ds.action === 'correct') { var r = R.get(ds.type, ds.id); if (payload.targetPeriod === undefined) payload.targetPeriod = R.defaultPeriod(R.period(ds.type, r)); if (payload.amount === undefined) payload.amount = R.effectiveAmount(ds.type, r); }
    if (ds.action === 'correct' && payload.mode === 'cash' && !payload.date) payload.date = TH.TODAY;
    if (ds.action === 'correct' && ds.type === 'expense') { var effective = R.effectiveExpense(R.get('expense', ds.id)); payload.replacement = { category: draft.replacementCategory === undefined ? effective.category : draft.replacementCategory, description: draft.replacementDescription === undefined ? effective.description : draft.replacementDescription, docNo: draft.replacementDocNo === undefined ? effective.docNo : draft.replacementDocNo }; }
    if (ds.action === 'terms' && !payload.effectiveFrom) payload.effectiveFrom = R.defaultPeriod();
    if (ds.action === 'terms') { var source = R.get(ds.type, ds.id); if (payload.rent === undefined) payload.rent = R.rateAt(source, TH.store.state.period); if (ds.type === 'contract') payload.priceList = R.contractAt(source, payload.effectiveFrom).priceList.map(function (l) { return Object.assign({}, l, { price: draft['fee-' + l.code] === undefined ? l.price : Number(draft['fee-' + l.code]) }); }); }
    if (ds.action === 'transfer') { var select = document.querySelector('[data-draft="' + ds.form + '.staffId"]'); if (!payload.staffId && select) payload.staffId = select.value; if (!payload.date) payload.date = TH.TODAY; }
    var result = R.execute(ds.type, ds.id, ds.action, payload);
    if (!result.ok) { TH.store.setDraft(ds.form, '_error', result.error); TH.modal.rerenderAll(); return; }
    TH.store.clearDraft(ds.form); TH.modal.close(ds.modal, { silent: true }); TH.app.refresh(); var durable = TH.store.flushChecked(); if (durable) TH.toast('Đã ' + (names[ds.action] || '').toLowerCase(), esc(ds.id));
  };
  function listDialog(screen, mode, type) {
    R.init(); var types = screenTypes[screen] || [], chosen = type || types[0], d = R.definitions[chosen]; if (!d) return;
    TH.modal.open({ key: 'rec-list', size: 'lg', render: function () {
      var entries = mode === 'trash' ? TH.db.recordTrash.filter(function (x) { return types.indexOf(x.type) >= 0 && R.visible(x.type, x.record); }).map(function (x) { return { type: x.type, record: x.record }; }) : mode === 'corrections' ? R.list('correction').filter(function (r) { return R.visible('correction', r) && types.indexOf(r.sourceType) >= 0; }).map(function (r) { return { type: 'correction', record: r }; }) : R.list(chosen).filter(function (r) { return R.visible(chosen, r); }).map(function (r) { return { type: chosen, record: r }; });
      var tabs = mode === 'records' ? '<div class="row rec-type-tabs">' + types.map(function (t) { return '<button type="button" class="btn btn-sm" data-act="rec.list" data-screen="' + screen + '" data-mode="records" data-type="' + t + '" aria-pressed="' + (t === chosen) + '">' + esc(R.definitions[t].label) + '</button>'; }).join('') + '</div>' : '';
      bypassTable = true; var table;
      try { table = TH.table({ label: 'Quản lý bản ghi', cols: [{ key: 'id', label: 'Mã / nội dung', render: function (x) { return '<b>' + esc(x.record.id) + '</b><div class="cell-sub">' + esc(x.record.name || x.record.description || x.record.reason || x.record.sourceId || '') + '</div>'; } }, { key: 'state', label: 'Trạng thái', render: function (x) { return esc(x.record.deletedAt ? 'Đã xóa' : TH.statusLabel(x.record.status || x.record.state || 'active')); } }, { key: 'x', kind: 'actions', label: 'Thao tác', render: function (x) { return mode === 'trash' ? button(x.type, x.record, 'restore') : R.rowButtons(x.type, x.record); } }], rows: entries }); } finally { bypassTable = false; }
      return { title: mode === 'trash' ? 'Đã xóa · có thể khôi phục' : mode === 'corrections' ? 'Phiếu điều chỉnh' : 'Quản lý · ' + d.label, body: tabs + table, foot: (mode === 'records' && ['team', 'oaTemplate', 'oaSchedule', 'shareholder', 'leaseDraft'].indexOf(chosen) >= 0 ? '<button type="button" class="btn" data-act="rec.create" data-type="' + chosen + '">Thêm ' + esc(d.label.toLowerCase()) + '</button>' : '') + '<button type="button" class="btn" data-close>Đóng</button>' };
    } });
  }
  TH.act['rec.list'] = function (el) { listDialog(el.dataset.screen, el.dataset.mode || 'records', el.dataset.type); };
  TH.act['rec.create'] = function (el) {
    var type = el.dataset.type, d = R.definitions[type], form = 'rec-create'; TH.store.clearDraft(form);
    TH.modal.open({ key: form, size: 'md', recordForm: form, render: function () { return { title: 'Thêm ' + d.label, body: '<div class="form-grid">' + d.fields.map(function (k) { return input(form, type, {}, k); }).join('') + '</div><p role="alert" class="neg">' + esc(TH.store.draft(form, '_error', '')) + '</p>', foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="rec.createSave" data-type="' + type + '">Lưu</button>' }; } });
  };
  TH.act['rec.createSave'] = function (el) { var values = Object.assign({}, TH.store.draft('rec-create') || {}); document.querySelectorAll('[data-draft^="rec-create."]').forEach(function (input) { var k = input.dataset.draft.slice(11); if (values[k] === undefined) values[k] = input.value; }); var result = R.create(el.dataset.type, values); if (!result.ok) { TH.store.setDraft('rec-create', '_error', result.error); TH.modal.rerenderAll(); return; } TH.store.clearDraft('rec-create'); TH.modal.close('rec-create', { silent: true }); TH.app.refresh(); TH.toast('Đã tạo', esc(result.record.id)); };
  var toolsUsed = {};
  function toolButtons(screen) {
    var b = function (mode, icon, label) { return '<button type="button" class="btn" data-overflow="1" data-act="rec.list" data-screen="' + screen + '" data-mode="' + mode + '">' + TH.icon(icon, 'ic-sm') + label + '</button>'; };
    return b('records', 'database', 'Quản lý bản ghi') + b('trash', 'trash', 'Đã xóa') + b('corrections', 'fileClock', 'Phiếu điều chỉnh') +
      (screen === 'SHARE-01' && TH.can('share.edit') ? '<button type="button" class="btn" data-overflow="1" data-act="rec.shareTable">' + TH.icon('pie', 'ic-sm') + 'Thêm / sửa bảng tỷ lệ</button>' : '');
  }
  /* Gọi từ TH.pageHeader: đưa thao tác dữ liệu của màn đang render vào menu ⋯ của tiêu đề trang */
  TH.recordTools = function (screen) {
    if (!screen || screen !== currentScreen || !screenTypes[screen]) return '';
    toolsUsed[screen] = true; return toolButtons(screen);
  };
  Object.keys(screenTypes).forEach(function (screen) {
    var view = TH.views[screen]; if (!view) return; var render = view.render;
    view.render = function () {
      var prev = currentScreen; currentScreen = screen; var result;
      try { result = render.apply(this, arguments); } finally { currentScreen = prev; }
      /* Màn có tiêu đề trang: các thao tác dữ liệu đã nằm trong menu ⋯ của tiêu đề. Màn không có (hộp thoại) → một nút ⋯ gọn */
      var bar = toolsUsed[screen] ? '' : '<div class="record-tools" aria-label="Thao tác dữ liệu">' + TH.actionGroup({ context: 'card', html: toolButtons(screen) }) + '</div>';
      delete toolsUsed[screen];
      if (typeof result === 'string') return bar + result;
      if (result && result.body) return Object.assign({}, result, { body: bar + result.body }); return result;
    };
  });
  var ag = TH.actionGroup;
  TH.actionGroup = function (o) { if (o && o.context === 'row' && o.html && o.html.indexOf('data-act="rec.open"') >= 0) return ag(Object.assign({}, o, { maxVisible: 2 })); return ag(o); };
  var oldClose = TH.modal.close;
  TH.modal.close = function (key, options) {
    var m = TH.modal.stack.find(function (x) { return x.key === key; }) || (!key && TH.modal.stack[TH.modal.stack.length - 1]);
    var form = m && m.spec && m.spec.recordForm, dirty = form && Object.keys(TH.store.draft(form) || {}).some(function (k) { return k.charAt(0) !== '_'; });
    if (dirty && !(options && options.silent)) { TH.confirm({ title: 'Bỏ thay đổi chưa lưu?', body: '<p>Dữ liệu đã lưu sẽ được giữ nguyên.</p>', ok: 'Bỏ thay đổi', cancel: 'Tiếp tục chỉnh sửa', danger: true }).then(function (ok) { if (ok) { TH.store.clearDraft(form); oldClose(key, { silent: true }); } }); return; }
    return oldClose.apply(this, arguments);
  };
})();
