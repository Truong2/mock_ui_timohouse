/* Khách thuê: CUS-01 (danh sách), CUS-02 (hồ sơ & OCR), OCR-CUS (OCR giấy tờ). F010, F011, F013. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;

  function contractOf(k) { return TH.db.contracts.find(function (c) { return c.customerId === k.id && c.status === 'active'; }); }
  function visible(k) { var c = contractOf(k); return !c || TH.inScope(c.buildingId); }

  /* ---------------- CUS-01 ---------------- */
  TH.views['CUS-01'] = {
    render: function () {
      var S = 'CUS-01', q = TH.store.ui(S, 'q', ''), st = TH.store.ui(S, 'st', 'all');
      var all = TH.db.customers.filter(visible);
      var rows = all.filter(function (k) { var c = contractOf(k); return (st === 'all' || (st === 'renting' ? !!c : st === 'nocontract' ? !c : st === 'oa' ? !k.oaLinked : true)) && TH.match(q, [k.id, k.name, k.phone, c ? c.roomId : '']); });
      var pg = TH.paginate(S, rows, 12);
      var table = TH.table({
        label: 'Danh sách khách',
        cols: [
          { key: 'id', label: 'Mã khách', render: function (k) { return '<span class="mono">' + k.id + '</span>'; } },
          { key: 'n', label: 'Tên', render: function (k) { return '<a class="cell-main" href="' + TH.router.href('CUS-02', k.id) + '">' + esc(k.name) + '</a><div class="cell-sub">' + esc(k.idType) + ' ' + esc(k.idNo) + '</div>'; } },
          { key: 'p', label: 'Số liên hệ', render: function (k) { return esc(k.phone); } },
          { key: 'r', label: 'Phòng', render: function (k) { var c = contractOf(k); return c ? TH.roomLink(c.roomId) : '<span class="muted">—</span>'; } },
          { key: 'c', label: 'Hợp đồng', render: function (k) { var c = contractOf(k); return c ? '<a class="mono small" href="' + TH.router.href('CON-02', c.id) + '">' + esc(c.id) + '</a>' : '<span class="muted">Chưa gán</span>'; } },
          { key: 'oa', label: 'Zalo OA', render: function (k) { return k.oaLinked ? TH.badge('Đã liên kết', 'success') : TH.badge('Chưa liên kết', 'neutral'); } },
          { key: 's', label: 'Trạng thái', render: function (k) { return TH.status(contractOf(k) ? 'occupied' : 'active', contractOf(k) ? 'Đang thuê' : 'Chưa có HĐ'); } },
          { key: 'v', label: 'Phiên bản định danh', gate: 'F010.D', render: function (k) { return 'v' + (1 + TH.db.customerHistory.filter(function (h) { return h.customerId === k.id; }).length); } },
        ],
        rows: pg.rows,
        rowAttrs: function (k) { return 'class="is-clickable" tabindex="0" data-href="' + TH.router.href('CUS-02', k.id) + '"'; },
      });
      return TH.pageHeader({ screen: S, actions: '<button type="button" class="btn" data-act="go" data-href="' + TH.router.href('OCR-CUS') + '">' + I('scan', 'ic-sm') + 'OCR giấy tờ</button>' + TH.permBtn('contract.edit', '<button type="button" class="btn btn-primary" data-act="cus.add">' + I('userPlus', 'ic-sm') + 'Thêm khách</button>', 'Thêm · 403') }) +
        '<div class="card card-flush"><div class="toolbar">' + TH.searchBox(S, 'Tìm mã, tên, số liên hệ, phòng…') + TH.chips(S, 'st', [{ id: 'all', label: 'Tất cả', count: all.length }, { id: 'renting', label: 'Đang thuê' }, { id: 'nocontract', label: 'Chưa có HĐ' }, { id: 'oa', label: 'Chưa liên kết OA' }], st) + '</div>' + table + TH.pager(S, pg) + '</div>' +
        '<p class="small muted" style="margin-top:10px">' + I('shield', 'ic-sm') + ' Thông tin định danh được che (mask) trong toàn bộ bản demo.</p>';
    },
    dialogs: [function () { cusForm(); }],
  };
  function cusForm() {
    var form = 'cus-new', name = (TH.store.draft(form, 'name', '') || '').trim(), idNo = (TH.store.draft(form, 'idNo', '') || '').replace(/\D/g, '');
    var dup = idNo.length >= 3 ? TH.db.customers.filter(function (k) { return k.idNo.replace(/\D/g, '').slice(-3) === idNo.slice(-3); }) : [];
    return { title: 'Thêm khách (nhập tay)', sub: 'CUS-01 · có thể dùng OCR giấy tờ để điền nhanh',
      body: '<div class="stack"><div class="form-grid">' + TH.field({ form: form, name: 'name', label: 'Họ tên', def: '', required: true }) + TH.field({ form: form, name: 'dob', label: 'Ngày sinh', type: 'date', def: '' }) +
        TH.field({ form: form, name: 'phone', label: 'Số liên hệ', def: '' }) + TH.field({ form: form, name: 'idNo', label: 'Số giấy tờ', def: '', live: true, hint: 'Lưu dạng mask' }) + '</div>' +
        TH.gate('F010.B', dup.length ? '<div class="alert alert-warning">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Nghi trùng theo số giấy tờ ' + TH.up('F010.B') + '</b><span>' + dup.map(function (k) { return esc(k.id + ' · ' + k.name); }).join(', ') + '</span></div></div>' : '<div class="alert alert-success">' + I('checkCircle', 'ic-sm') + '<div class="alert-body">Kiểm trùng theo trường nhận dạng đã duyệt ' + TH.up('F010.B') + ': chưa phát hiện.</div></div>', { label: 'Kiểm trùng theo trường nhận dạng', ghost: 'self' }) + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="cus.save"' + (name ? '' : ' disabled') + '>Lưu khách</button>' };
  }
  TH.act['cus.add'] = function () { TH.modal.open({ key: 'cus-form', size: 'md', render: cusForm }); };
  TH.act['cus.save'] = function () {
    var g = function (k, d) { return TH.store.draft('cus-new', k, d); };
    var id = 'KH-' + String(TH.db.customers.length + 1).padStart(3, '0'), idNo = String(g('idNo', '')).replace(/\D/g, '');
    TH.db.customers.push({ id: id, name: g('name', ''), dob: g('dob', ''), phone: g('phone', '') || '—', idNo: idNo ? idNo.slice(0, 4) + '•••••' + idNo.slice(-3) : '—', idType: 'CCCD', hometown: '—', oaLinked: false, oaConsentAt: null, status: 'active', createdAt: TH.TODAY });
    TH.log('Thêm khách', id, g('name', ''), 'customer'); TH.store.clearDraft('cus-new'); TH.modal.close('cus-form', { silent: true }); TH.app.refresh(); TH.toast('Đã thêm khách', esc(id));
  };

  /* ---------------- CUS-02 ---------------- */
  TH.views['CUS-02'] = {
    scanParam: 'KH-003',
    scan: function () { return ['profile', 'docs', 'history', 'versions'].map(function (t) { return { ui: { tab: t }, param: 'KH-003' }; }); },
    render: function (r) {
      var k = C.customer(r.param || 'KH-003');
      if (!k) return TH.pageHeader({ screen: 'CUS-02' }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy khách' }) + '</div>';
      if (!visible(k)) return TH.pageHeader({ screen: 'CUS-02', title: k.name }) + '<div class="card">' + TH.state('forbidden', { text: 'Khách thuộc tòa ngoài phạm vi vai trò hiện tại.' }) + '</div>';
      var S = 'CUS-02', c = contractOf(k);
      var tabs = [{ id: 'profile', label: 'Hồ sơ' }, { id: 'docs', label: 'Tài liệu', count: TH.db.documents.filter(function (d) { return d.customerId === k.id; }).length }, { id: 'history', label: 'Lịch sử liên hệ', gate: 'F010.C' }, { id: 'versions', label: 'Phiên bản định danh', gate: 'F010.D' }];
      var tab = TH.resolveTab(S, tabs);
      var body;
      if (tab === 'profile') {
        body = '<div class="grid-2"><div class="card"><div class="card-hd"><div class="card-title">Thông tin khách</div>' + TH.badge('Đã mask định danh', 'neutral', { icon: 'shield' }) + '</div><div class="card-bd">' +
          TH.kv([['Mã khách', '<span class="mono">' + k.id + '</span>'], ['Họ tên', esc(k.name)], ['Ngày sinh', F.date(k.dob)], ['Giấy tờ', esc(k.idType + ' · ' + k.idNo)], ['Quê quán', esc(k.hometown)], ['Số liên hệ', esc(k.phone)], ['Zalo OA', k.oaLinked ? TH.badge('Đã liên kết', 'success') + ' <span class="small muted">đồng ý ' + F.date(k.oaConsentAt) + '</span>' : TH.badge('Chưa liên kết — không gửi tin', 'neutral')]]) + '</div></div>' +
          '<div class="card"><div class="card-hd"><div class="card-title">Hợp đồng</div></div><div class="card-bd">' + (c ? TH.kv([['Số HĐ', '<a href="' + TH.router.href('CON-02', c.id) + '">' + esc(c.id) + '</a>'], ['Phòng', TH.roomLink(c.roomId)], ['Hiệu lực', F.date(c.start) + ' → ' + F.date(c.end)], ['Giá thuê', F.money(c.rent)]]) : TH.state('empty', { title: 'Chưa gán hợp đồng', action: '<a class="btn btn-sm" href="' + TH.router.href('CON-02', 'new') + '">Tạo hợp đồng</a>' })) + '</div></div></div>';
      } else if (tab === 'docs') {
        var dq = TH.has('F013.B') ? TH.store.ui(S, 'dq', '') : '';
        var docs = TH.db.documents.filter(function (d) { return d.customerId === k.id && TH.match(dq, [d.kind, d.file, d.contractId, d.roomId]); });
        body = '<div class="card card-flush"><div class="toolbar">' + (TH.has('F013.B') ? '<div class="input-wrap">' + I('search') + '<label class="sr-only" for="dq">Tìm tài liệu</label><input id="dq" class="input input-sm" data-ui="CUS-02.dq" value="' + esc(dq) + '" placeholder="Tìm theo HĐ/khách/phòng…"></div>' + TH.up('F013.B') : TH.gate('F013.B', '', { mode: 'btn', label: 'Tìm theo HĐ/khách/phòng', size: 'btn-sm' })) + '<span class="grow"></span><button type="button" class="btn btn-sm" data-act="cus.upload" data-id="' + k.id + '">' + I('upload', 'ic-sm') + 'Tải lên</button></div>' +
          TH.table({ cols: [
            { key: 'f', label: 'Tài liệu', render: function (d) { return TH.fileOf(d.file); } },
            { key: 'k', label: 'Loại', render: function (d) { return esc(d.kind); } },
            { key: 'c', label: 'Hợp đồng · phòng', render: function (d) { return esc(d.contractId) + '<div class="cell-sub">' + esc(d.roomId) + '</div>'; } },
            { key: 'u', label: 'Ngày tải', render: function (d) { return F.date(d.uploadedAt); } },
            { key: 'perm', label: 'Quyền xem', gate: 'F013.C', render: function () { return '<span class="small">QL tòa + Kế toán</span>'; } },
            { key: 'v', label: 'Phiên bản · lượt xem', gate: 'F013.D', render: function (d) { return 'v' + d.version + ' · ' + d.views + ' lượt'; } },
            { key: 'a', label: '', render: function (d) { return '<button type="button" class="btn btn-xs" data-act="cus.dl" data-f="' + esc(d.file) + '">' + I('download', 'ic-sm') + 'Tải xuống</button>'; } },
          ], rows: docs, empty: { title: 'Không có tài liệu', text: 'Tải lên giấy tờ hoặc bản scan hợp đồng.' } }) + '</div>';
      } else if (tab === 'history') {
        body = '<div class="card"><div class="card-hd"><div class="card-title">Log lịch sử thông tin liên hệ ' + TH.up('F010.C') + '</div></div><div class="card-bd"><ul class="timeline">' + (TH.db.customerHistory.filter(function (h) { return h.customerId === k.id; }).map(function (h) { return '<li><b>' + esc(h.field) + '</b>: <s class="muted">' + esc(h.before) + '</s> → ' + esc(h.after) + '<div class="when">' + esc(C.staffName(h.by)) + ' · ' + F.date(h.at) + '</div></li>'; }).join('') || '<li class="muted">Chưa có thay đổi.</li>') + '</ul></div></div>';
      } else {
        body = '<div class="card card-flush">' + TH.cardHd('Phiên bản thông tin định danh/hợp đồng' + TH.up('F010.D')) + TH.table({ cols: [{ key: 'v', label: 'Phiên bản', render: function (x) { return '<b>v' + x.v + '</b>'; } }, { key: 'a', label: 'Từ ngày', render: function (x) { return F.date(x.at); } }, { key: 'n', label: 'Nội dung', render: function (x) { return esc(x.n); } }], rows: [{ v: 1, at: k.createdAt, n: 'Tạo từ ' + (k.id === 'KH-003' ? 'OCR CCCD (đã xác nhận)' : 'nhập tay') }].concat(TH.db.customerHistory.filter(function (h) { return h.customerId === k.id; }).map(function (h, i) { return { v: i + 2, at: h.at, n: 'Cập nhật ' + h.field }; })) }) + '</div>';
      }
      return TH.pageHeader({ screen: 'CUS-02', title: k.name, crumbs: [['Khách hàng', TH.router.href('CUS-01')], [k.id]], status: TH.status(c ? 'occupied' : 'active', c ? 'Đang thuê' : 'Chưa có HĐ'),
          actions: '<button type="button" class="btn" data-act="cus.upload" data-id="' + k.id + '">' + I('upload', 'ic-sm') + 'Upload</button><a class="btn btn-primary" href="' + TH.router.href('OCR-CUS', k.id) + '">' + I('scan', 'ic-sm') + 'OCR & review</a>' }) +
        '<div class="card" style="margin-bottom:16px">' + TH.tabs(S, tabs, tab) + '</div>' + body;
    },
  };
  TH.act['cus.upload'] = function (el) {
    var k = C.customer(el.dataset.id);
    TH.db.documents.push({ id: 'TL-' + Date.now().toString().slice(-4), customerId: k.id, contractId: (contractOf(k) || {}).id || '—', roomId: (contractOf(k) || {}).roomId || '—', kind: 'Giấy tờ bổ sung', file: 'giay_to_bo_sung_' + k.id + '.pdf', version: 1, uploadedAt: TH.TODAY, views: 0 });
    TH.log('Tải tài liệu', k.id, 'Giấy tờ bổ sung', 'customer'); TH.store.setUi('CUS-02', 'tab', 'docs'); TH.app.refresh(); TH.toast('Đã lưu tài liệu (mô phỏng)', 'Gắn với hồ sơ ' + esc(k.id));
  };
  TH.act['cus.dl'] = function (el) { TH.toast('Tệp minh họa', esc(el.dataset.f) + ' — bản demo không lưu tệp thật.', 'info'); };

  /* ---------------- OCR-CUS ---------------- */
  var FIELDS = [
    { key: 'name', label: 'Họ và tên', ocr: 'TRƯƠNG THỊ DIỆU LINH', conf: 0.95 },
    { key: 'idNo', label: 'Số CCCD', ocr: '001197••••218', conf: 0.92 },
    { key: 'dob', label: 'Ngày sinh', ocr: '1997-08-14', conf: 0.89 },
    { key: 'sex', label: 'Giới tính', ocr: 'Nữ', conf: 0.98 },
    { key: 'home', label: 'Quê quán', ocr: 'Xã Mẫu Thử, Huyện Ví Dụ, Nam Định', conf: 0.74 },
    { key: 'addr', label: 'Nơi thường trú', ocr: 'Số 9 đường Minh Họa, Hà Nội', conf: 0.79 },
  ];
  var FORM = 'ocr-cus';
  TH.views['OCR-CUS'] = {
    modal: { size: 'full' },
    ocrFields: function () { return FIELDS; },
    render: function () {
      var v = function (k) { return TH.store.draft(FORM, k, FIELDS.find(function (f) { return f.key === k; }).ocr); };
      var out = TH.ocrWorkspace({
        screen: 'OCR-CUS', form: FORM, docTitle: 'cccd_mat_truoc.jpg', fields: FIELDS,
        inc: { conf: 'F011.B', tpl: 'F011.B', match: 'F011.C', log: 'F011.D' },
        templates: TH.db.ocrTemplates.filter(function (t) { return t.kind === 'id'; }).map(function (t) { return Object.assign({}, t, { status: 'approved' }); }),
        matchTitle: 'Cảnh báo trùng hồ sơ / tính hợp lệ',
        confirmAct: 'ocrcus.confirm', confirmLabel: 'Xác nhận & lưu hồ sơ',
        checks: function () {
          var out = [], idTail = String(v('idNo')).replace(/\D/g, '').slice(-3);
          var dup = TH.db.customers.find(function (k) { return k.idNo.replace(/\D/g, '').slice(-3) === idTail; });
          out.push(dup ? { level: 'warning', text: 'Số giấy tờ trùng đuôi với hồ sơ ' + dup.id + ' · ' + esc(dup.name) + ' — kiểm tra trước khi lưu.' } : { level: 'ok', text: 'Không phát hiện hồ sơ trùng số giấy tờ.' });
          var age = 2026 - +String(v('dob')).slice(0, 4);
          out.push(age >= 18 && age < 100 ? { level: 'ok', text: 'Ngày sinh hợp lệ (' + age + ' tuổi).' } : { level: 'danger', text: 'Ngày sinh không hợp lệ theo rule.' });
          return out;
        },
        sideExtra: function () {
          return TH.gate('F011.D', '<div class="card"><div class="card-hd"><div class="card-title">' + I('chart', 'ic-sm') + 'Dashboard lỗi nhận dạng' + TH.up('F011.D') + '</div></div><div class="card-bd">' + TH.kv([['Phiếu OCR tháng 10', '14'], ['Field phải sửa', '9 / 84 (10,7%)'], ['Field hay lỗi nhất', 'Quê quán (dấu tiếng Việt)']]) + '<div class="small muted" style="margin-top:8px">Thư viện mẫu đã duyệt: ' + TH.db.ocrTemplates.filter(function (t) { return t.kind === 'id'; }).length + ' mẫu.</div></div></div>', { label: 'Thư viện mẫu đã duyệt; dashboard lỗi nhận dạng', lines: 3 });
        },
        docHtml: function (box) {
          return '<span class="sim-mark">' + TH.simBadge('Ảnh giấy tờ minh họa') + '</span>' +
            '<div style="border:2px solid #94a3b8;border-radius:14px;padding:18px 20px;background:linear-gradient(135deg,#f8fafc,#e2e8f0);font-family:var(--font);font-size:12.5px;line-height:1.9">' +
            '<div class="doc-c" style="font-weight:700;font-size:12px;letter-spacing:.04em">CĂN CƯỚC CÔNG DÂN (MẪU MINH HỌA)</div>' +
            '<div style="display:grid;grid-template-columns:96px 1fr;gap:16px;margin-top:10px"><div style="width:96px;height:120px;border-radius:8px;background:repeating-linear-gradient(45deg,#cbd5e1,#cbd5e1 6px,#e2e8f0 6px,#e2e8f0 12px);display:grid;place-items:center;color:#64748b;font-size:11px">Ảnh<br>đã ẩn</div><div>' +
            'Số / No.: ' + box('idNo', v('idNo')) + '<br>Họ và tên: ' + box('name', v('name')) + '<br>Ngày sinh: ' + box('dob', F.date(v('dob'))) + ' · Giới tính: ' + box('sex', v('sex')) + '<br>Quê quán: ' + box('home', v('home')) + '<br>Thường trú: ' + box('addr', v('addr')) + '</div></div></div>';
        },
      });
      out.foot = out.foot.replace('Nhập tay (fallback)', 'Nhập tay (fallback)');
      return out;
    },
  };
  TH.act['ocrcus.confirm'] = function () {
    var g = function (k) { return TH.store.draft(FORM, k, FIELDS.find(function (f) { return f.key === k; }).ocr); };
    var name = g('name').toLowerCase().replace(/(^|\s)\S/g, function (s) { return s.toUpperCase(); });
    var id = 'KH-' + String(TH.db.customers.length + 1).padStart(3, '0');
    TH.db.customers.push({ id: id, name: name, dob: g('dob'), phone: '—', idNo: g('idNo'), idType: 'CCCD', hometown: g('home'), oaLinked: false, oaConsentAt: null, status: 'active', createdAt: TH.TODAY });
    TH.db.documents.push({ id: 'TL-' + Date.now().toString().slice(-4), customerId: id, contractId: '—', roomId: '—', kind: 'CCCD (đã mask)', file: 'cccd_mat_truoc.jpg', version: 1, uploadedAt: TH.TODAY, views: 0 });
    TH.log('Xác nhận OCR giấy tờ', id, name, 'customer');
    TH.store.clearDraft(FORM); TH.app.guard = null;
    TH.modal.close(TH.modal.top().key, { silent: true });
    TH.go('CUS-02', id, { replace: true });
    TH.toast('Đã lưu hồ sơ khách ' + id, 'Chỉ dữ liệu đã xác nhận được lưu. Giấy tờ lưu dạng mask.');
  };
})();
