/* Hợp đồng: CON-01, CON-02, CON-03, OCR-CON, CON-FOLLOW. F012, F014–F017. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;

  function cStatus(c) {
    if (c.status === 'draft') return 'draft';
    if (c.status === 'active' && C.daysTo(c.end) <= TH.expiryDays()) return 'expiring'; // 35 ngày — CR-CUS-01 (note.md §8.2)
    return c.status;
  }
  function custName(c) { var k = C.customer(c.customerId); return k ? k.name : (c.newCustomer || '—'); }

  /* ---------------- CON-01 ---------------- */
  TH.views['CON-01'] = {
    render: function () {
      var S = 'CON-01', q = TH.store.ui(S, 'q', ''), st = TH.store.ui(S, 'st', 'all');
      var all = TH.db.contracts.filter(function (c) { return TH.inScope(c.buildingId); });
      var rows = all.filter(function (c) { var s = cStatus(c); return (st === 'all' || s === st || (st === 'active' && s === 'expiring')) && TH.match(q, [c.id, custName(c), c.roomId]); });
      var pg = TH.paginate(S, rows, 10);
      var cnt = function (k) { return all.filter(function (c) { var s = cStatus(c); return k === 'active' ? (s === 'active' || s === 'expiring') : s === k; }).length; };
      var table = TH.table({
        label: 'Danh sách hợp đồng',
        cols: [
          { key: 'id', label: 'Số HĐ', render: function (c) { return '<a class="mono" href="' + TH.router.href('CON-02', c.id) + '">' + esc(c.id) + '</a>'; } },
          { key: 'k', label: 'Khách', render: function (c) { return TH.personCell(custName(c), esc(c.customerId || 'Khách mới')); } },
          { key: 'r', label: 'Tòa / phòng', render: function (c) { return TH.roomLink(c.roomId) + '<div class="cell-sub">' + esc(C.building(c.buildingId).short) + '</div>'; } },
          { key: 'rent', label: 'Giá thuê', num: true, render: function (c) { return F.money(c.rent); } },
          { key: 'ky', label: 'Kỳ thu', render: function (c) { return 'Ngày ' + String(c.billingDay).padStart(2, '0') + ' hằng tháng'; } },
          { key: 'eff', label: 'Hiệu lực', render: function (c) { return F.date(c.start) + ' → ' + F.date(c.end); } },
          { key: 'end', label: 'Hết hạn', render: function (c) { var d = C.daysTo(c.end); return c.status !== 'active' ? (c.endedAt ? '<span class="muted small">kết thúc ' + F.date(c.endedAt) + '</span>' : '—') : d <= TH.expiryDays() ? '<span class="warn-text strong">còn ' + d + ' ngày</span>' : '<span class="muted">còn ' + d + ' ngày</span>'; } },
          { key: 'st', label: 'Trạng thái', render: function (c) { return TH.status(cStatus(c)); } },
          { key: 'pl', label: 'Phụ lục', gate: 'F014.C', render: function (c) { return c.versions.length > 1 ? TH.badge((c.versions.length - 1) + ' phụ lục', 'info') : '<span class="muted">—</span>'; } },
          { key: 'v', label: 'Phiên bản', gate: 'F014.D', render: function (c) { return 'v' + c.versions.length; } },
        ],
        rows: pg.rows,
        rowAttrs: function (c) { return 'class="is-clickable" tabindex="0" data-href="' + TH.router.href('CON-02', c.id) + '"'; },
        empty: { title: 'Không có hợp đồng phù hợp', text: 'Đổi bộ lọc hoặc tạo hợp đồng mới.' },
      });
      var actions = '<button type="button" class="btn" data-act="con.ocr">' + I('scan', 'ic-sm') + 'OCR hợp đồng</button>' + TH.exportBtn('con.expx', 'Xuất HĐ hết hạn (.xlsx)') +
        TH.permBtn('contract.edit', '<button type="button" class="btn btn-primary" data-act="go" data-href="' + TH.router.href('CON-02', 'new') + '">' + I('plus', 'ic-sm') + 'Tạo hợp đồng</button>', 'Tạo · 403');
      return TH.pageHeader({ screen: S, actions: actions }) +
        '<div class="card card-flush"><div class="toolbar">' + TH.searchBox(S, 'Tìm số HĐ, khách, phòng…') + TH.chips(S, 'st', [{ id: 'all', label: 'Tất cả', count: all.length }, { id: 'active', label: 'Đang hiệu lực', count: cnt('active') }, { id: 'expiring', label: 'Sắp hết hạn', count: cnt('expiring') }, { id: 'draft', label: 'Nháp', count: cnt('draft') }, { id: 'ended', label: 'Đã kết thúc', count: cnt('ended') }, { id: 'terminated', label: 'Phá HĐ', count: cnt('terminated') }], st) + '</div>' + table + TH.pager(S, pg) + '</div>';
    },
  };
  TH.act['con.ocr'] = function () { TH.go('OCR-CON'); };
  TH.act['con.expx'] = function () {
    var list = C.expiring(TH.expiryDays(), TH.scope());
    TH.exportXlsx('HD_sap_het_han_' + TH.TODAY, [{ name: 'Sap het han', title: 'Hợp đồng hết hạn trong ' + TH.expiryDays() + ' ngày — ' + TH.scopeLabel(), note: 'Dữ liệu minh họa', columns: [{ label: 'Số HĐ', width: 18 }, { label: 'Khách', width: 24 }, { label: 'Liên hệ', width: 16 }, { label: 'Phòng' }, { label: 'Tòa', width: 20 }, { label: 'QL tòa', width: 20 }, { label: 'Ngày hết hạn' }, { label: 'Còn (ngày)', type: 'number' }],
      rows: list.map(function (c) { var k = C.customer(c.customerId); return [c.id, k.name, k.phone, c.roomId, C.building(c.buildingId).name, C.staffName(C.building(c.buildingId).managerId), F.date(c.end), C.daysTo(c.end)]; }) }]);
    TH.toast('Đã xuất danh sách', list.length + ' hợp đồng · .xlsx');
  };

  /* ---------------- CON-02 ---------------- */
  var NEW = 'con-new';
  TH.views['CON-02'] = {
    scanParam: 'HĐ-CG201/25',
    scan: function () { return [{ param: 'HĐ-CG201/25', ui: { tab: 'info' } }, { param: 'HĐ-CG201/25', ui: { tab: 'fees' } }, { param: 'HĐ-CG201/25', ui: { tab: 'hist' } }, { param: 'new' }]; },
    render: function (r) {
      if (!r.param || r.param === 'new') return newForm();
      var c = C.contract(r.param);
      if (!c) return TH.pageHeader({ screen: 'CON-02' }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy hợp đồng' }) + '</div>';
      var S = 'CON-02', k = C.customer(c.customerId), room = C.room(c.roomId);
      var tabs = [{ id: 'info', label: 'Hợp đồng' }, { id: 'fees', label: 'Phí cố định', count: c.fees.length }, { id: 'hist', label: 'Lịch sử', gate: 'F014.B' }];
      var tab = TH.resolveTab(S, tabs);
      var body;
      if (tab === 'info') {
        body = '<div class="grid-main-side"><div class="card"><div class="card-hd"><div class="card-title">Điều khoản chính</div>' + (c.status === 'active' ? TH.badge('Bản đã xác nhận — không sửa trực tiếp', 'neutral', { icon: 'lock' }) : c.status === 'ended' || c.status === 'terminated' ? TH.badge((c.status === 'terminated' ? 'Phá HĐ ' : 'Kết thúc ') + F.date(c.endedAt), c.status === 'terminated' ? 'danger' : 'neutral') : '') + '</div><div class="card-bd">' +
          TH.kv([['Số HĐ', '<span class="mono">' + esc(c.id) + '</span>'], ['Khách', k ? '<a href="' + TH.router.href('CUS-02', k.id) + '">' + esc(k.name) + '</a> · ' + esc(k.phone) : esc(custName(c))], ['Phòng', TH.roomLink(c.roomId) + ' · ' + esc(C.building(c.buildingId).name)], ['Giá thuê', '<b class="tnum">' + F.money(c.rent) + '</b>/tháng'], ['Tiền cọc', F.money(c.deposit) + ' <span class="small muted">(không tính doanh thu)</span>'], ['Kỳ', 'Ngày ' + String(c.billingDay).padStart(2, '0') + ' · tròn tháng'], ['Hiệu lực', F.date(c.start) + ' → ' + F.date(c.end)], ['Ngày ký', F.date(c.signedAt)], ['Số người ở', c.people]].concat(c.handover ? [['Bàn giao', F.date(c.handover.at) + ' · điện ' + (c.handover.elecStart || 0) + ' kWh · nước ' + (c.handover.waterStart || 0) + ' m³ · ' + (c.handover.assets || []).length + ' tài sản <a href="#" data-act="cus.open" data-id="' + esc(c.id) + '" data-tab="contract">xem</a>']] : []).concat(c.prepaid ? [['Đã nộp khi ký', F.money(c.prepaid.total) + ' <span class="small muted">(' + esc(c.prepaid.allocation) + ')</span>']] : [])) + '</div></div>' +
          '<div class="stack"><div class="card"><div class="card-hd"><div class="card-title">' + I('paperclip', 'ic-sm') + 'Bản scan</div></div><div class="card-bd">' + TH.fileOf(c.scanFile) + '</div></div>' +
          TH.gate('F014.C', '<div class="card"><div class="card-hd"><div class="card-title">Phụ lục thay đổi giá ' + TH.up('F014.C') + '</div></div><div class="card-bd stack-sm"><p class="small muted">Thay đổi giá có hiệu lực từ tháng; cần duyệt trước khi áp dụng vào hóa đơn.</p>' + TH.permBtn('contract.edit', '<button type="button" class="btn btn-sm" data-act="con.addendum" data-id="' + esc(c.id) + '">' + I('plus', 'ic-sm') + 'Tạo phụ lục</button>', 'Tạo phụ lục · 403') + '</div></div>', { label: 'Phụ lục thay đổi giá có hiệu lực từ tháng', lines: 2 }) +
          TH.gate('F014.D', '<div class="card"><div class="card-hd"><div class="card-title">Phiên bản điều khoản ' + TH.up('F014.D') + '</div></div><div class="card-bd"><ul class="timeline">' + c.versions.slice().reverse().map(function (v) { return '<li><b>v' + v.v + '</b> · ' + esc(v.note) + '<div class="when">' + F.date(v.at) + (v.by ? ' · ' + esc(C.staffName(v.by)) : '') + '</div></li>'; }).join('') + '</ul></div></div>', { label: 'Hợp đồng/điều khoản nhiều phiên bản có audit', lines: 3 }) + '</div></div>';
      } else if (tab === 'fees') {
        var feeCols = [
          { key: 'n', label: 'Loại phí', render: function (f) { return esc(f.name); } },
          { key: 'p', label: 'Đơn giá', num: true, render: function (f) { return F.money(f.price); } },
          { key: 'q', label: 'Số lượng', num: true, render: function (f) { return f.qty + ' ' + esc(f.unit); } },
          { key: 'a', label: 'Thành tiền/tháng', num: true, render: function (f) { return '<b>' + F.money(f.price * f.qty) + '</b>'; } },
          { key: 'eff', label: 'Hiệu lực từ kỳ', gate: 'F015.B', render: function () { return F.period(c.start.slice(0, 7)); } },
        ];
        var total = C.sum(c.fees, function (f) { return f.price * f.qty; });
        body = '<div class="grid-main-side"><div class="card card-flush">' + TH.cardHd('Bộ phí cố định hiện hành', 'Gói A: một bộ phí; lập hóa đơn tự lấy đúng khoản đã xác nhận') + TH.table({ cols: feeCols, rows: c.fees, foot: { _label: 'Tổng phí cố định', a: '<b>' + F.money(total) + '</b>' } }) + '</div><div class="stack">' +
          TH.gate('F015.C', '<div class="card"><div class="card-hd"><div class="card-title">Preview tác động khi đổi biểu phí ' + TH.up('F015.C') + '</div></div><div class="card-bd">' +
            TH.field({ form: 'fee-' + c.id, name: 'svc', label: 'Phí dịch vụ mới (đ/tháng)', def: '180000', num: true, inputmode: 'numeric', live: true }) +
            (function () { var nv = +TH.store.draft('fee-' + c.id, 'svc', '180000') || 0, old = c.fees[0].price; return '<div class="kv" style="margin-top:12px"><dt>Chênh/tháng</dt><dd class="' + (nv - old >= 0 ? 'pos' : 'neg') + '">' + F.money(nv - old) + '</dd><dt>Tác động 6 kỳ còn lại</dt><dd>' + F.money((nv - old) * 6) + '</dd></div>'; })() + '</div></div>', { label: 'Preview tác động khi đổi biểu phí', lines: 3 }) +
          TH.gate('F015.D', '<div class="card"><div class="card-hd"><div class="card-title">Giai đoạn giá & lịch sử ' + TH.up('F015.D') + '</div></div><div class="card-bd"><ul class="timeline"><li>Phí dịch vụ 150.000 ₫ · từ ' + F.period(c.start.slice(0, 7)) + '<div class="when">Giai đoạn 1 · đang áp dụng</div></li><li>Internet 100.000 ₫ · từ ' + F.period(c.start.slice(0, 7)) + '<div class="when">Không đổi</div></li></ul></div></div>', { label: 'Nhiều giai đoạn giá và lịch sử thay đổi', lines: 3 }) + '</div></div>';
      } else {
        body = '<div class="card"><div class="card-hd"><div class="card-title">Lịch sử cơ bản ' + TH.up('F014.B') + '</div></div><div class="card-bd"><ul class="timeline">' +
          '<li>Tạo hợp đồng nháp<div class="when">' + F.date(TH.addDays(c.signedAt, -2)) + ' · ' + esc(C.staffName(C.building(c.buildingId).managerId)) + '</div></li>' +
          '<li>Đính kèm bản scan ' + esc(c.scanFile) + '<div class="when">' + F.date(c.signedAt) + '</div></li>' +
          '<li>Xác nhận hợp đồng<div class="when">' + F.date(c.signedAt) + ' · ' + esc(C.staffName('NV-002')) + '</div></li>' +
          c.versions.slice(1).map(function (v) { return '<li>Phụ lục v' + v.v + ': ' + esc(v.note) + '<div class="when">' + F.date(v.at) + '</div></li>'; }).join('') + '</ul></div></div>';
      }
      return TH.pageHeader({ screen: S, title: 'Hợp đồng ' + c.id, crumbs: [['Hợp đồng', TH.router.href('CON-01')], [c.id]], status: TH.status(cStatus(c)),
        actions: '<a class="btn" href="' + TH.router.href('CUS-02', c.customerId) + '">' + I('user', 'ic-sm') + 'Hồ sơ khách</a>' + (c.status === 'active' ? '<a class="btn" href="' + TH.router.href('CON-FOLLOW', c.id) + '">' + I('phone', 'ic-sm') + 'Ghi kết quả hỏi gia hạn</a>' : '') }) +
        '<div class="card" style="margin-bottom:16px">' + TH.tabs(S, tabs, tab) + '</div>' + body;
    },
    dialogs: [function () { addendumForm('HĐ-CG201/25'); }],
  };

  function ocrDone() { return TH.db.ocrJobs.find(function (j) { return j.kind === 'contract' && j.status === 'confirmed' && !j.used; }); }
  function newForm() {
    var job = ocrDone(), canPrefill = TH.has('F014.B');
    var g = function (k, def) { return TH.store.draft(NEW, k, def); };
    var vacant = TH.db.rooms.filter(function (r) { return r.status === 'vacant' && TH.inScope(r.buildingId); });
    var err = g('_err', '');
    var custOpts = [{ id: '', label: '— Chọn khách —' }].concat(job ? [{ id: 'OCR', label: job.fields.customer + ' (khách mới từ OCR)' }] : []).concat(TH.db.customers.map(function (k) { return { id: k.id, label: k.id + ' · ' + k.name }; }));
    var banner = job ? '<div class="alert alert-success" style="margin-bottom:16px">' + I('fileCheck', 'ic-sm') + '<div class="alert-body"><b>Có kết quả OCR đã xác nhận: ' + esc(job.fields.code) + '</b><span>OCR không tự kích hoạt hợp đồng — dữ liệu chỉ vào form nháp sau khi bạn chọn.</span></div>' +
      (canPrefill ? '<button type="button" class="btn btn-sm btn-primary" data-act="con.prefill">' + I('wand', 'ic-sm') + 'Chuyển vào form' + TH.up('F014.B') + '</button>' : TH.gate('F014.B', '', { mode: 'btn', label: 'Tự chuyển vào form', size: 'btn-sm' })) + '</div>' : '';
    var fees = TH.gate('F012.B', '<div class="alert alert-neutral">' + I('layers', 'ic-sm') + '<div class="alert-body">' + TH.tierPill('B') + ' Phí cố định được map từ bảng phí trong OCR (phí dịch vụ, internet, gửi xe).</div></div>', { mode: 'mini', label: 'Map phí cố định từ OCR' });
    return TH.pageHeader({ screen: 'CON-02', title: 'Tạo hợp đồng', crumbs: [['Hợp đồng', TH.router.href('CON-01')], ['Tạo mới']], status: TH.badge('Nháp', 'draft', { dot: true }),
      actions: '<button type="button" class="btn" data-act="con.ocr">' + I('scan', 'ic-sm') + 'Upload & OCR</button>' }) + banner +
      '<div class="grid-main-side"><div class="card"><div class="card-hd"><div class="card-title">Thông tin hợp đồng</div><span class="small muted">Form 1 hợp đồng / phòng</span></div><div class="card-bd">' +
      (err ? '<div class="alert alert-danger" style="margin-bottom:12px">' + I('xCircle', 'ic-sm') + '<div class="alert-body">' + esc(err) + '</div></div>' : '') +
      '<div class="form-grid">' +
      TH.field({ form: NEW, name: 'customer', label: 'Khách', type: 'select', options: custOpts, required: true }) +
      TH.field({ form: NEW, name: 'room', label: 'Phòng (đang trống)', type: 'select', options: [{ id: '', label: '— Chọn phòng —' }].concat(vacant.map(function (r) { return { id: r.id, label: r.id + ' · ' + C.building(r.buildingId).short + ' · niêm yết ' + F.money(r.rent) }; })), required: true }) +
      TH.field({ form: NEW, name: 'rent', label: 'Giá thuê (đ/tháng)', num: true, inputmode: 'numeric', required: true }) +
      TH.field({ form: NEW, name: 'deposit', label: 'Tiền cọc (đ)', num: true, inputmode: 'numeric' }) +
      TH.field({ form: NEW, name: 'start', label: 'Ngày bắt đầu', type: 'date', required: true }) +
      TH.field({ form: NEW, name: 'end', label: 'Ngày kết thúc', type: 'date', required: true }) +
      TH.field({ form: NEW, name: 'svc', label: 'Phí dịch vụ (đ/tháng)', num: true, def: '150000' }) +
      TH.field({ form: NEW, name: 'net', label: 'Internet (đ/tháng)', num: true, def: '100000' }) +
      '</div><div style="margin-top:12px">' + fees + '</div></div></div>' +
      '<div class="stack"><div class="card"><div class="card-hd"><div class="card-title">' + I('paperclip', 'ic-sm') + 'Bản scan / file OCR</div></div><div class="card-bd">' + (job ? TH.fileOf(job.file) : '<div class="dropzone" style="padding:18px"><span class="small">Chưa có file</span><button type="button" class="btn btn-sm" data-act="con.ocr">' + I('upload', 'ic-sm') + 'Tải bản scan</button></div>') + '</div></div>' +
      '<div class="alert alert-neutral">' + I('info', 'ic-sm') + '<div class="alert-body">Không ký số/pháp lý tự động. Hợp đồng chỉ hiệu lực sau bước <b>Duyệt</b>; phòng chuyển “Đang thuê” khi duyệt.</div></div></div></div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:16px"><a class="btn" href="' + TH.router.href('CON-01') + '">Hủy</a><button type="button" class="btn" data-act="con.saveDraft">' + I('check', 'ic-sm') + 'Lưu nháp</button>' +
      TH.permBtn('contract.edit', '<button type="button" class="btn btn-primary" data-act="con.approve">' + I('fileCheck', 'ic-sm') + 'Duyệt hợp đồng</button>', 'Duyệt · 403') + '</div>';
  }
  TH.act['con.prefill'] = function () {
    var job = ocrDone(); if (!job) return;
    var f = job.fields;
    var set = function (k, v) { TH.store.setDraft(NEW, k, v); };
    set('customer', 'OCR'); set('room', f.room); set('rent', String(f.rent).replace(/\D/g, '')); set('deposit', String(f.deposit).replace(/\D/g, ''));
    var people = +String(f.people || 1).replace(/\D/g, '') || 1;
    set('start', f.start || f.billingFrom); set('end', f.end); set('svc', String((+String(f.feeSvc).replace(/\D/g, '') || 0) * people)); set('net', String(f.feeNet).replace(/\D/g, ''));
    TH.app.refresh(); TH.toast('Đã chuyển dữ liệu OCR vào form', 'Kiểm tra lại trước khi lưu — trạng thái vẫn là Nháp.', 'info');
  };
  function readNew() {
    var g = function (k, d) { return TH.store.draft(NEW, k, d); };
    return { customer: g('customer', ''), room: g('room', ''), rent: +String(g('rent', '')).replace(/\D/g, ''), deposit: +String(g('deposit', '')).replace(/\D/g, ''), start: g('start', ''), end: g('end', ''), svc: +String(g('svc', '150000')).replace(/\D/g, ''), net: +String(g('net', '100000')).replace(/\D/g, '') };
  }
  function validNew(d) {
    if (!d.customer || !d.room || !d.rent || !d.start || !d.end) return 'Nhập đủ khách, phòng, giá thuê và thời hạn.';
    if (d.end <= d.start) return 'Ngày kết thúc phải sau ngày bắt đầu.';
    if (TH.db.contracts.some(function (c) { return c.roomId === d.room && c.status === 'active'; })) return 'Phòng đã có hợp đồng hiệu lực — không cho thuê trùng.';
    return '';
  }
  TH.act['con.saveDraft'] = function () {
    var d = readNew();
    if (!d.room) { TH.store.setDraft(NEW, '_err', 'Chọn phòng trước khi lưu nháp.'); TH.app.refresh(); return; }
    TH.store.setDraft(NEW, '_err', '');
    TH.app.refresh(); TH.toast('Đã lưu nháp', 'Bản nháp được giữ khi đổi gói hoặc chuyển màn.', 'info');
  };
  TH.act['con.approve'] = function () {
    var d = readNew(), e = validNew(d);
    if (e) { TH.store.setDraft(NEW, '_err', e); TH.app.refresh(); return; }
    var job = ocrDone(), cid = d.customer, O = TH.CONTRACT_OCR, jf = job ? job.fields : null, jv = jf ? function (k) { return jf[k]; } : null;
    var dg = function (x) { return +String(x === undefined || x === null ? '' : x).replace(/\D/g, '') || 0; };
    if (cid === 'OCR' && job) {
      /* Khách mới từ OCR mẫu đầy đủ: Bên B + xe máy khai ở Điều 1 (chờ xác nhận đăng ký, chưa tính phí) */
      cid = 'KH-' + String(TH.db.customers.length + 1).padStart(3, '0');
      var veh = [], nMoto = dg(jf.vehicles);
      for (var j = 0; j < nMoto; j++) veh.push({ id: 'XE-' + cid.slice(3) + '-' + (j + 1), type: 'Xe máy', plate: null, brand: '', color: '', status: 'pending', from: d.start, to: null, feeCode: 'PARK_MOTO', note: 'Khai từ HĐ (Điều 1) — cần bổ sung biển số và xác nhận đăng ký' });
      TH.db.customers.push({ id: cid, name: jf.customer, dob: jf.dob || '', phone: jf.phone || '—', idNo: jf.idNo || '—', idType: 'CCCD', idPlace: jf.idPlace || '', hometown: '—', permAddress: jf.permAddress || '', occupation: '', note: '', vehicles: veh, oaLinked: false, oaConsentAt: null, status: 'active', createdAt: TH.TODAY });
    }
    var room = C.room(d.room), bb = C.building(room.buildingId);
    var id = 'HĐ-' + room.id.replace('-', '') + '/' + d.start.slice(2, 4);
    var ct = { id: id, roomId: room.id, buildingId: room.buildingId, customerId: cid, rent: d.rent, deposit: d.deposit || d.rent, start: d.start, end: d.end, signedAt: jf && jf.signedAt ? jf.signedAt : TH.TODAY, people: jf ? dg(jf.people) || 1 : 1, billingDay: 1, status: 'active', scanFile: job ? job.file : 'scan_' + room.id + '.pdf',
      renewals: [], previousContractId: null, endKind: null, note: '', versions: [{ v: 1, at: TH.TODAY, note: job ? 'Bản ký gốc — tạo từ OCR mẫu đầy đủ (' + job.corrections + ' mục sửa tay)' : 'Bản ký gốc', by: TH.me().id }] };
    if (jv) {
      ct.terms = O.buildTerms(jv);
      ct.priceList = O.buildPriceList(jv, d.start.slice(0, 7), 'OCR HĐ ' + jf.code + ' · xác nhận ' + job.at);
      ct.handover = O.handoverOf(jv, job.assets || [], job.file);
      ct.prepaid = O.prepaidOf(jv);
    } else {
      ct.terms = TH.termsOf('DAYDU', d.start);
      ct.priceList = TH.seedPriceList(bb, d.start, 1);
      ct.priceList.forEach(function (l) { if (l.code === 'SVC') l.price = d.svc; if (l.code === 'NET') l.price = d.net; });
    }
    TH.syncFees(ct);
    TH.db.contracts.push(ct);
    TH.db.roomEvents.unshift({ roomId: room.id, at: TH.TODAY, from: room.status, to: 'occupied', by: TH.me().id, note: 'Kích hoạt HĐ ' + id });
    room.status = 'occupied';
    if (job) job.used = true;
    TH.log('Duyệt hợp đồng', id, room.id + ' · ' + F.money(d.rent), 'contract', room.buildingId);
    TH.store.clearDraft(NEW);
    TH.go('CON-02', id);
    TH.toast('Đã duyệt hợp đồng ' + id, 'Phòng ' + room.id + ' chuyển “Đang thuê”. Hóa đơn chỉ sinh khi lập theo kỳ.');
  };
  function addendumForm(cid) {
    var c = C.contract(cid), form = 'adm-' + cid;
    return { title: 'Phụ lục thay đổi giá · ' + esc(cid) + TH.up('F014.C'), sub: 'Hiệu lực từ tháng; cần duyệt trước khi áp dụng',
      body: '<div class="form-grid">' + TH.field({ form: form, name: 'rent', label: 'Giá thuê mới', num: true, def: String(c.rent + 200000) }) + TH.field({ form: form, name: 'from', label: 'Hiệu lực từ kỳ', type: 'month', def: '2026-11' }) + TH.field({ form: form, name: 'reason', label: 'Lý do', type: 'textarea', span: true, def: 'Điều chỉnh giá theo thỏa thuận gia hạn' }) + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="con.addendum.save" data-id="' + esc(cid) + '">Gửi duyệt phụ lục</button>' };
  }
  TH.act['con.addendum'] = function (el) { var id = el.dataset.id; TH.modal.open({ key: 'adm', size: 'sm', render: function () { return addendumForm(id); } }); };
  TH.act['con.addendum.save'] = function (el) {
    var c = C.contract(el.dataset.id), form = 'adm-' + c.id;
    var v = { v: c.versions.length + 1, at: TH.TODAY, by: TH.me().id, note: 'Phụ lục giá ' + F.money(+TH.store.draft(form, 'rent', c.rent + 200000)) + ' từ ' + F.period(TH.store.draft(form, 'from', '2026-11')) + ' (chờ duyệt)' };
    c.versions.push(v);
    TH.log('Tạo phụ lục HĐ', c.id, v.note, 'contract', c.buildingId);
    TH.store.clearDraft(form); TH.modal.close('adm', { silent: true }); TH.app.refresh();
    TH.toast('Đã gửi duyệt phụ lục', 'Giá hiện hành không đổi cho đến khi phụ lục được duyệt.');
  };

  /* ---------------- CON-03 ---------------- */
  function followOf(cid) { return TH.db.followUps.filter(function (f) { return f.contractId === cid; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; })[0]; }
  TH.views['CON-03'] = {
    render: function () {
      var S = 'CON-03', days = +TH.store.ui(S, 'days', String(TH.expiryDays())), grp = TH.has('F016.B') ? TH.store.ui(S, 'grp', 'none') : 'none';
      var list = C.expiring(days, TH.scope());
      var cols = [
        { key: 'id', label: 'Hợp đồng', render: function (c) { return '<a class="mono" href="' + TH.router.href('CON-02', c.id) + '">' + esc(c.id) + '</a><div class="cell-sub">hết hạn ' + F.date(c.end) + '</div>'; } },
        { key: 'd', label: 'Còn', num: true, render: function (c) { var d = C.daysTo(c.end); return '<b class="' + (d <= 20 ? 'neg' : 'warn-text') + '">' + d + ' ngày</b>'; } },
        { key: 'k', label: 'Khách', render: function (c) { return esc(custName(c)); } },
        { key: 'p', label: 'Liên hệ', render: function (c) { var k = C.customer(c.customerId); return esc(k ? k.phone : '—'); } },
        { key: 'r', label: 'Phòng', render: function (c) { return TH.roomLink(c.roomId) + '<div class="cell-sub">' + esc(C.building(c.buildingId).short) + '</div>'; } },
        { key: 'm', label: 'QL tòa', render: function (c) { return esc(C.staffName(C.building(c.buildingId).managerId)); } },
        { key: 'res', label: 'Kết quả gọi', render: function (c) { var f = followOf(c.id); return f ? TH.status(f.result) + (f.callbackAt ? '<div class="cell-sub">Gọi lại ' + F.date(f.callbackAt) + '</div>' : '') : '<span class="muted">—</span>'; } },
        { key: 'asked', label: 'Nhắc / đã hỏi', gate: 'F016.C', render: function (c) { var n = TH.db.followUps.filter(function (f) { return f.contractId === c.id; }).length; return n ? TH.badge('Đã hỏi · ' + n + ' lần', 'success') : TH.badge('Chưa hỏi', 'warning'); } },
        { key: 'a', label: '', render: function (c) { return '<a class="btn btn-xs" href="' + TH.router.href('CON-FOLLOW', c.id) + '">' + I('phone', 'ic-sm') + 'Ghi khảo sát</a>'; } },
      ];
      var tableHtml;
      if (grp === 'manager') {
        var mgrs = {};
        list.forEach(function (c) { var m = C.building(c.buildingId).managerId; (mgrs[m] = mgrs[m] || []).push(c); });
        tableHtml = Object.keys(mgrs).map(function (m) { return '<div class="toolbar" style="background:var(--n-50)"><b>' + esc(C.staffName(m)) + '</b><span class="small muted">' + mgrs[m].length + ' hợp đồng</span></div>' + TH.table({ cols: cols, rows: mgrs[m] }); }).join('') || TH.state('empty');
      } else tableHtml = TH.table({ cols: cols, rows: list, empty: { title: 'Không có hợp đồng sắp hết hạn', text: 'Trong ' + days + ' ngày tới không có hợp đồng nào hết hạn.' } });
      var all = TH.db.followUps.filter(function (f) { return TH.inScope(C.contract(f.contractId).buildingId); });
      var rate = TH.gate('F016.D', '<div class="grid-4" style="margin-bottom:16px">' +
        TH.kpi({ label: 'Đã khảo sát', value: all.length + '<small>/ ' + list.length + '</small>', foot: 'Phân công theo QL tòa' }) +
        TH.kpi({ label: 'Gia hạn', value: String(all.filter(function (f) { return f.result === 'extend'; }).length), foot: 'Tỷ lệ ' + F.pct(all.length ? all.filter(function (f) { return f.result === 'extend'; }).length / all.length : 0, 0) }) +
        TH.kpi({ label: 'Chuyển đi', value: String(all.filter(function (f) { return f.result === 'move_out'; }).length), foot: 'Cần lên kế hoạch cho thuê lại' }) +
        TH.kpi({ label: 'Chưa trả lời', value: String(all.filter(function (f) { return f.result === 'no_answer'; }).length), foot: 'Có lịch gọi lại' }) + '</div>', { label: 'Tổng hợp tỷ lệ gia hạn / chuyển đi', lines: 2 });
      return TH.pageHeader({ screen: S, actions: TH.exportBtn('con.expx', 'Xuất danh sách (.xlsx)') }) + rate +
        '<div class="card card-flush"><div class="toolbar"><span class="small strong">Đến hạn trong</span>' + TH.chips(S, 'days', [30, 35, 45, 60, 90].map(function (d) { return { id: String(d), label: d + ' ngày' + (d === TH.expiryDays() ? ' (cấu hình)' : '') }; }), String(days)) +
        '<span class="grow"></span>' + TH.gate('F016.B', TH.uiSelect(S, 'grp', [{ id: 'none', label: 'Không nhóm' }, { id: 'manager', label: 'Nhóm theo QL tòa' }], grp, 'Nhóm danh sách') + TH.up('F016.B'), { mode: 'btn', label: 'Danh sách theo QL tòa/nhóm', size: 'btn-sm' }) + '</div>' + tableHtml + '</div>';
    },
    scan: function () { return [{ ui: { grp: 'none' } }, { ui: { grp: 'manager' } }]; },
  };

  /* ---------------- CON-FOLLOW ---------------- */
  TH.views['CON-FOLLOW'] = {
    modal: { size: 'md' },
    scanParam: 'HĐ-CG202/25',
    render: function (r) {
      var c = C.contract(r.param) || C.expiring(TH.expiryDays(), 'ALL')[0];
      var form = 'fu-' + c.id, res = TH.store.draft(form, 'result', 'no_answer');
      var hist = TH.db.followUps.filter(function (f) { return f.contractId === c.id; });
      var steps = ['Hỏi khách', 'Ghi kết quả', 'Duyệt gia hạn/đổi giá', 'Cập nhật HĐ / thu hồi phòng'];
      return {
        title: 'Cập nhật kết quả hỏi gia hạn <span class="screen-id">CON-FOLLOW</span>',
        sub: esc(c.id) + ' · ' + esc(custName(c)) + ' · phòng ' + esc(c.roomId) + ' · hết hạn ' + F.date(c.end),
        body: '<div class="stack">' +
          TH.gate('F017.D', '<div class="stepper">' + steps.map(function (s, i) { return '<div class="step ' + (i === 0 ? 'is-done' : i === 1 ? 'is-current' : '') + '"><span class="n">' + (i === 0 ? '✓' : i + 1) + '</span>' + s + '</div>' + (i < 3 ? '<span class="step-line"></span>' : ''); }).join('') + '</div>', { label: 'Quy trình gia hạn/thu hồi theo bước', lines: 1 }) +
          '<div class="form-grid">' + TH.field({ form: form, name: 'at', label: 'Ngày liên hệ', type: 'date', def: TH.TODAY }) + TH.field({ form: form, name: 'by', label: 'Người hỏi', value: TH.me().name, readonly: true }) + '</div>' +
          '<div class="field"><span class="field-label">Phản hồi của khách</span><div class="radio-row">' + [['extend', 'Gia hạn'], ['move_out', 'Chuyển đi'], ['no_answer', 'Chưa trả lời']].map(function (o) { return '<label class="radio-chip"><input type="radio" name="fu-res" value="' + o[0] + '" data-draft="' + form + '.result"' + (res === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>'; }).join('') + '</div></div>' +
          (res === 'move_out' ? TH.field({ form: form, name: 'moveOut', label: 'Dự kiến rời', type: 'date', def: c.end }) : '') +
          TH.gate('F017.B', '<div class="form-grid">' + TH.field({ form: form, name: 'callback', label: 'Lịch hẹn gọi lại', type: 'date', def: TH.addDays(TH.TODAY, 3), labelExtra: TH.up('F017.B') }) + (res === 'extend' ? '<div class="field"><span class="field-label">Nháp gia hạn ' + TH.up('F017.B') + '</span><label class="check"><input type="checkbox" data-draft="' + form + '.draftRenew"' + (TH.store.draft(form, 'draftRenew', true) ? ' checked' : '') + '><span>Tạo nháp gia hạn 12 tháng</span></label></div>' : '<div></div>') + '</div>', { ghost: 'self', label: 'Ghi lịch hẹn gọi lại; tạo nháp gia hạn' }) +
          TH.gate('F017.C', '<div class="alert ' + (res === 'extend' ? 'alert-warning' : 'alert-neutral') + '">' + I('shieldCheck', 'ic-sm') + '<div class="alert-body"><b>Duyệt gia hạn/đổi giá trước khi áp dụng ' + TH.up('F017.C') + '</b><span>' + (res === 'extend' ? 'Kết quả “Gia hạn” sẽ được gửi kế toán/Admin duyệt; hợp đồng gốc không tự sửa.' : 'Chỉ áp dụng khi khách chọn gia hạn — hợp đồng gốc không tự sửa.') + '</span></div></div>', { label: 'Duyệt gia hạn/đổi giá trước khi áp dụng', lines: 1 }) +
          TH.field({ form: form, name: 'note', label: 'Ghi chú cuộc gọi', type: 'textarea', def: '' }) +
          (hist.length ? '<div><div class="section-title">Nhật ký trước đó</div><ul class="timeline">' + hist.map(function (f) { return '<li>' + TH.status(f.result) + ' ' + esc(f.note) + '<div class="when">' + esc(C.staffName(f.by)) + ' · ' + F.date(f.at) + '</div></li>'; }).join('') + '</ul></div>' : '') +
          '<div class="alert alert-neutral">' + I('info', 'ic-sm') + '<div class="alert-body">Kết quả khảo sát không tự sửa hợp đồng gốc.</div></div></div>',
        foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="fu.save" data-id="' + esc(c.id) + '">' + I('check', 'ic-sm') + 'Lưu kết quả</button>',
      };
    },
  };
  TH.act['fu.save'] = function (el) {
    var c = C.contract(el.dataset.id), form = 'fu-' + c.id, g = function (k, d) { return TH.store.draft(form, k, d); };
    var res = g('result', 'no_answer');
    TH.db.followUps.push({ contractId: c.id, at: g('at', TH.TODAY), by: TH.me().id, result: res, moveOutAt: res === 'move_out' ? g('moveOut', c.end) : null, callbackAt: TH.has('F017.B') && res !== 'move_out' ? g('callback', TH.addDays(TH.TODAY, 3)) : null, note: g('note', '') || '—' });
    TH.log('Ghi kết quả hỏi gia hạn', c.id, TH.statusLabel(res), 'contract', c.buildingId);
    TH.store.clearDraft(form);
    TH.modal.close(TH.modal.top().key);
    TH.toast('Đã lưu kết quả: ' + TH.statusLabel(res), res === 'extend' && TH.has('F017.C') ? 'Đã gửi duyệt gia hạn — hợp đồng gốc chưa đổi.' : 'Hợp đồng gốc không thay đổi.');
  };

  /* ---------------- OCR-CON (mẫu đầy đủ — định nghĩa field/bảng/scan ở js/views/ocr-contract.js) ---------------- */
  var OCR_FORM = 'ocr-con';
  TH.views['OCR-CON'] = {
    modal: { size: 'full' },
    ocrFields: function () { return TH.CONTRACT_OCR.fields; },
    ocrTables: function () { return [TH.CONTRACT_OCR.tableCfg()]; },
    render: function () {
      return TH.CONTRACT_OCR.workspace({ form: OCR_FORM, fields: TH.CONTRACT_OCR.fields, mode: 'new', ct: null, confirmAct: 'ocrcon.confirm', confirmLabel: 'Xác nhận kết quả OCR', docTitle: 'hop_dong_CG401_scan.pdf' });
    },
  };
  TH.act['ocrcon.confirm'] = function () {
    var O = TH.CONTRACT_OCR, vals = O.vals(OCR_FORM, O.fields), assets = O.assetsOf(OCR_FORM), corrections = O.corrections(OCR_FORM, O.fields);
    TH.db.ocrJobs.unshift({ id: 'OCR-' + String(TH.db.ocrJobs.length + 1).padStart(4, '0'), kind: 'contract', target: 'new', file: 'hop_dong_CG401_scan.pdf', status: 'confirmed', fields: vals, assets: assets, by: TH.me().id, at: TH.TODAY, corrections: corrections });
    TH.log('Xác nhận kết quả OCR HĐ', vals.code, corrections + ' mục đã sửa · ' + assets.length + ' tài sản bàn giao', 'contract', 'TH-CG');
    TH.store.clearDraft(OCR_FORM);
    TH.app.guard = null;
    TH.modal.close(TH.modal.top().key, { silent: true });
    TH.go('CON-02', 'new', { replace: true });
    TH.toast('Đã xác nhận kết quả OCR', TH.has('F014.B') ? 'Chọn “Chuyển vào form” để tạo hợp đồng nháp.' : 'Đã lưu kèm file. Gói A nhập hợp đồng thủ công vào form.');
  };
})();
