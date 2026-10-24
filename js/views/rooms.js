/* Phòng: ROOM-01 (danh sách), ROOM-02 (hồ sơ), ROOM-IMP (import theo tòa). F007–F009 (+F018). */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;

  /* ---------------- ROOM-01 ---------------- */
  TH.views['ROOM-01'] = {
    render: function () {
      var S = 'ROOM-01', q = TH.store.ui(S, 'q', ''), st = TH.store.ui(S, 'st', 'all');
      var all = TH.db.rooms.filter(function (r) { return TH.inScope(r.buildingId); });
      var rows = all.filter(function (r) { var c = C.contractOfRoom(r.id); return (st === 'all' || r.status === st) && TH.match(q, [r.id, c ? C.customer(c.customerId).name : '', c ? c.id : '']); });
      var pg = TH.paginate(S, rows, 12);
      var cnt = function (k) { return all.filter(function (r) { return r.status === k; }).length; };
      var table = TH.table({
        label: 'Danh sách phòng',
        mobile: { identity: 'id', primary: 'p', visible: ['id', 'b', 'p', 's', 'k'] },
        cols: [
          { key: 'id', label: 'Mã phòng', render: function (r) { return '<a class="cell-main" href="' + TH.router.href('ROOM-02', r.id) + '">' + r.id + '</a>'; } },
          { key: 'b', label: 'Tòa', render: function (r) { return esc(C.building(r.buildingId).short); } },
          { key: 'f', label: 'Tầng', num: true, render: function (r) { return r.floor; } },
          { kind: 'money', key: 'p', label: 'Giá niêm yết', num: true, render: function (r) { return F.money(r.rent); } },
          { kind: 'status', key: 's', label: 'Trạng thái', render: function (r) { return TH.statusOf('room', r.status); } },
          { key: 'k', label: 'Khách / hợp đồng', render: function (r) { var c = C.contractOfRoom(r.id); return c ? esc(C.customer(c.customerId).name) + '<div class="cell-sub mono">' + esc(c.id) + '</div>' : '<span class="muted">—</span>'; } },
          { key: 'chk', label: 'Kiểm đổi trạng thái', gate: 'F007.B', render: function (r) { var c = C.contractOfRoom(r.id); return c ? TH.badge('Khóa theo HĐ đến ' + F.date(c.end), 'info', { icon: 'lock' }) : '<span class="muted small">Tự do</span>'; } },
          { key: 'ev', label: 'Đổi trạng thái gần nhất', gate: 'F007.C', render: function (r) { var e = TH.db.roomEvents.find(function (x) { return x.roomId === r.id; }); return e ? F.date(e.at) + '<div class="cell-sub">' + TH.statusLabel(e.from) + ' → ' + TH.statusLabel(e.to) + '</div>' : '<span class="muted small">—</span>'; } },
          { key: 'pr', label: 'Giá hiệu lực từ', gate: 'F007.D', render: function (r) { var h = TH.db.priceHistory.filter(function (x) { return x.roomId === r.id; }).pop(); return h ? F.date(h.from) : '<span class="muted small">Ban đầu</span>'; } },
        ],
        rows: pg.rows,
        empty: { title: 'Không có phòng phù hợp', text: 'Đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.' },
        rowAttrs: function (r) { return 'class="is-clickable" tabindex="0" data-href="' + TH.router.href('ROOM-02', r.id) + '"'; },
      });
      return TH.pageHeader({ screen: S, actions: '<button type="button" class="btn" data-act="imp.open" data-screen="ROOM-IMP">' + I('upload', 'ic-sm') + 'Nhập từ Excel</button>' + TH.permBtn('master.edit', '<button type="button" class="btn btn-primary" data-act="room.add">' + I('plus', 'ic-sm') + 'Thêm phòng</button>', 'Thêm · 403') }) +
        '<div class="card card-flush"><div class="toolbar">' + TH.searchBox(S, 'Tìm mã phòng, khách, số HĐ…') + TH.chips(S, 'st', [{ id: 'all', label: 'Tất cả', count: all.length }, { id: 'occupied', label: 'Đang thuê', count: cnt('occupied') }, { id: 'vacant', label: 'Trống', count: cnt('vacant') }, { id: 'maintenance', label: 'Đang sửa', count: cnt('maintenance') }], st) + '</div>' + table + TH.pager(S, pg) + '</div>';
    },
    dialogs: [function () { return roomForm('new'); }],
  };
  function roomForm(id) {
    var room = id === 'new' ? null : C.room(id), form = 'room-' + id;
    var newSt = TH.store.draft(form, 'status', room ? room.status : 'vacant');
    var conflict = room && room.status === 'occupied' && newSt !== 'occupied' && C.contractOfRoom(room.id);
    var bOpts = TH.buildingOptions(false);
    return { title: room ? 'Sửa phòng ' + esc(room.id) : 'Thêm phòng', sub: 'CRUD + trạng thái cơ bản',
      body: '<div class="stack"><div class="form-grid">' +
        (room ? TH.field({ label: 'Tòa', value: TH.buildingName(room.buildingId), readonly: true, id: 'rf-b' }) : TH.field({ form: form, name: 'b', label: 'Tòa', type: 'select', options: bOpts })) +
        (room ? TH.field({ label: 'Mã phòng', value: room.id, readonly: true, id: 'rf-id' }) : TH.field({ form: form, required: true, name: 'code', label: 'Số phòng', def: '', placeholder: 'VD: 402', required: true })) +
        TH.field({ form: form, name: 'floor', label: 'Tầng', def: room ? room.floor : '4', num: true }) + TH.field({ form: form, name: 'area', label: 'Diện tích (m²)', def: room ? room.area : '25', num: true }) +
        TH.field({ form: form, name: 'rent', label: 'Giá niêm yết (đ)', def: room ? room.rent : '', num: true }) +
        TH.field({ form: form, name: 'status', label: 'Trạng thái', type: 'select', options: ['vacant', 'occupied', 'maintenance', 'reserved'].map(function (s) { return { id: s, label: TH.statusLabel(s) }; }), def: room ? room.status : 'vacant' }) + '</div>' +
        (conflict ? TH.gate('F007.B', '<div class="alert alert-danger">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Phòng đang có hợp đồng hiệu lực ' + TH.up('F007.B') + '</b><span>' + esc(conflict.id) + ' đến ' + F.date(conflict.end) + '. Không đổi trạng thái khi HĐ đang thuê.</span></div></div>', { label: 'Kiểm tra đổi trạng thái theo hợp đồng đang thuê', lines: 1 }) : '') + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="room.save" data-id="' + id + '"' + (conflict && TH.has('F007.B') ? ' disabled' : '') + '>Lưu</button>' };
  }
  TH.act['room.add'] = function () { TH.modal.open({ key: 'room-form', size: 'md', render: function () { return roomForm('new'); } }); };
  TH.act['room.edit'] = function (el) { var id = el.dataset.id; TH.modal.open({ key: 'room-form', size: 'md', render: function () { return roomForm(id); } }); };
  TH.act['room.save'] = function (el) {
    var id = el.dataset.id, form = 'room-' + id, g = function (k, d) { return TH.store.draft(form, k, d); };
    if (id === 'new') {
      var b = g('b', TH.buildingOptions(false)[0].id), code = (g('code', '') || '').trim(), rid = b.slice(3) + '-' + code;
      if (!TH.formErrors(form, !code ? { code: 'Nhập số phòng.' } : C.room(rid) ? { code: 'Phòng ' + rid + ' đã tồn tại trong tòa.' } : {})) { TH.modal.rerenderAll(); return; }
      TH.db.rooms.push({ id: rid, code: rid, buildingId: b, floor: +g('floor', 1), area: +g('area', 20), rent: +String(g('rent', 0)).replace(/\D/g, ''), status: g('status', 'vacant'), meters: [{ type: 'elec', code: 'Đ-' + rid.replace('-', '') }, { type: 'water', code: 'N-' + rid.replace('-', '') }] });
      TH.log('Thêm phòng', rid, '', 'room', b); TH.toast('Đã thêm phòng', esc(rid));
    } else {
      var r = C.room(id), ns = g('status', r.status), nr = +String(g('rent', r.rent)).replace(/\D/g, '');
      if (ns !== r.status) { TH.db.roomEvents.unshift({ roomId: id, at: TH.TODAY, from: r.status, to: ns, by: TH.me().id, note: 'Cập nhật trong demo' }); r.status = ns; }
      if (nr && nr !== r.rent) { TH.db.priceHistory.push({ roomId: id, from: TH.TODAY, rent: nr }); r.rent = nr; }
      r.floor = +g('floor', r.floor); r.area = +g('area', r.area);
      TH.log('Sửa phòng', id, '', 'room', r.buildingId); TH.toast('Đã lưu phòng', esc(id));
    }
    TH.store.clearDraft(form); TH.modal.close('room-form', { silent: true }); TH.app.refresh();
  };

  /* ---------------- ROOM-02 ---------------- */
  TH.views['ROOM-02'] = {
    scanParam: 'CG-201',
    scan: function () { return ['overview', 'tenant', 'contract', 'meter', 'timeline', 'periods'].map(function (t) { return { ui: { tab: t }, param: 'CG-201' }; }); },
    render: function (rt) {
      var r = C.room(rt.param || 'CG-201');
      if (!r) return TH.pageHeader({ screen: 'ROOM-02' }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy phòng' }) + '</div>';
      if (!TH.inScope(r.buildingId)) return TH.pageHeader({ screen: 'ROOM-02', title: 'Phòng ' + r.id }) + '<div class="card">' + TH.state('forbidden', { text: 'Phòng thuộc tòa ngoài phạm vi vai trò hiện tại.' }) + '</div>';
      var S = 'ROOM-02', c = C.contractOfRoom(r.id), k = c && C.customer(c.customerId), b = C.building(r.buildingId);
      var tabs = [{ id: 'overview', label: 'Thông tin phòng' }, { id: 'tenant', label: 'Khách thuê' }, { id: 'contract', label: 'Hợp đồng thuê' }, { id: 'meter', label: 'Chỉ số & phí', gate: 'F009.B' }, { id: 'timeline', label: 'Nhật ký hoạt động', gate: 'F009.C' }, { id: 'periods', label: 'Lịch sử theo kỳ', gate: 'F009.D' }];
      var tab = TH.resolveTab(S, tabs);
      var invs = TH.db.invoices.filter(function (i) { return i.roomId === r.id; }).sort(function (a, z) { return a.period < z.period ? 1 : -1; });
      var body;
      if (tab === 'overview') {
        body = '<div class="grid-2"><div class="card"><div class="card-hd"><div class="card-title">Chi tiết phòng</div></div><div class="card-bd">' + TH.kv([['Mã phòng', '<b>' + r.id + '</b>'], ['Tòa', '<a href="' + TH.router.href('BLD-02', b.id) + '">' + esc(b.name) + '</a>'], ['Tầng · diện tích', r.floor + ' · ' + r.area + ' m²'], ['Giá niêm yết', F.money(r.rent)], ['Trạng thái', TH.statusOf('room', r.status)], ['Công tơ', esc(r.meters.map(function (m) { return m.code; }).join(' · ')) + ' <span class="small muted">(1 điện + 1 nước)</span>']]) + '</div></div>' +
          '<div class="card card-flush">' + TH.cardHd('Hóa đơn gần đây') + TH.table({ compact: true, cols: [{ key: 'p', label: 'Kỳ', render: function (i) { return F.period(i.period); } }, { key: 'id', label: 'Hóa đơn', render: function (i) { return '<a class="mono small" href="' + TH.router.href('INV-03', i.id) + '">' + i.id + '</a>'; } }, { key: 't', label: 'Tổng', num: true, render: function (i) { return F.money(i.total); } }, { key: 's', label: 'Trạng thái', render: function (i) { return TH.status(C.payState(i)); } }], rows: invs.slice(0, 4), empty: { title: 'Chưa có hóa đơn', text: '' } }) + '</div></div>';
      } else if (tab === 'tenant') {
        body = '<div class="card"><div class="card-bd">' + (k ? TH.kv([['Khách', '<a href="' + TH.router.href('CUS-02', k.id) + '">' + esc(k.name) + '</a>'], ['Liên hệ', esc(k.phone)], ['Giấy tờ', esc(k.idType + ' ' + k.idNo)], ['Zalo OA', k.oaLinked ? TH.badge('Đã liên kết', 'success') : TH.badge('Chưa liên kết', 'neutral')]]) : TH.state('empty', { title: 'Phòng chưa có khách', text: 'Tạo hợp đồng để gán khách.' })) + '</div></div>';
      } else if (tab === 'contract') {
        body = '<div class="card"><div class="card-bd">' + (c ? TH.kv([['Số HĐ', '<a href="' + TH.router.href('CON-02', c.id) + '">' + esc(c.id) + '</a>'], ['Giá thuê', F.money(c.rent)], ['Cọc', F.money(c.deposit)], ['Hiệu lực', F.date(c.start) + ' → ' + F.date(c.end)], ['Phí cố định', c.fees.map(function (f) { return esc(f.name) + ' ' + F.money(f.price * f.qty); }).join(' · ')]]) : TH.state('empty', { title: 'Chưa có hợp đồng hiệu lực' })) + '</div></div>';
      } else if (tab === 'meter') {
        var rds = TH.db.readings.filter(function (x) { return x.roomId === r.id; }).slice().reverse();
        body = '<div class="grid-main-side"><div class="card card-flush">' + TH.cardHd('Chỉ số điện nước' + TH.up('F009.B')) + TH.table({ compact: true, cols: [{ key: 'p', label: 'Kỳ', render: function (x) { return F.period(x.period); } }, { key: 'e', label: 'Điện', num: true, render: function (x) { return x.elecCur === null ? '—' : F.num(x.elecPrev) + ' → ' + F.num(x.elecCur); } }, { key: 'ek', label: 'kWh', num: true, render: function (x) { return x.elecCur === null ? '—' : '<b>' + (x.elecCur - x.elecPrev) + '</b>'; } }, { key: 'w', label: 'Nước', num: true, render: function (x) { return x.waterCur === null ? '—' : F.num(x.waterPrev) + ' → ' + F.num(x.waterCur); } }, { key: 's', label: 'Trạng thái', render: function (x) { return TH.status(x.status === 'review' ? 'pending' : x.status); } }], rows: rds }) + '</div>' +
          '<div class="card"><div class="card-hd"><div class="card-title">Phí phát sinh</div></div><div class="card-bd small">' + (TH.db.extraFees.filter(function (e) { return e.roomId === r.id; }).map(function (e) { return '<div class="row-between" style="padding:4px 0"><span>' + esc(e.name) + ' · ' + F.period(e.period) + '</span><b class="tnum">' + F.money(e.qty * e.price) + '</b></div>'; }).join('') || '<span class="muted">Không có.</span>') + '</div></div></div>';
      } else if (tab === 'timeline') {
        var flt = TH.store.ui(S, 'tl', 'all');
        var ev = [];
        TH.db.roomEvents.filter(function (e) { return e.roomId === r.id; }).forEach(function (e) { ev.push({ at: e.at, kind: 'room', text: 'Trạng thái ' + TH.statusLabel(e.from) + ' → ' + TH.statusLabel(e.to) + ' · ' + e.note }); });
        invs.forEach(function (i) { ev.push({ at: i.issuedAt, kind: 'invoice', text: 'Hóa đơn ' + i.id + ' · ' + F.money(i.total) }); C.receiptsOf(i.id).filter(function (x) { return x.status === 'confirmed'; }).forEach(function (x) { ev.push({ at: x.receivedAt, kind: 'receipt', text: 'Thu ' + F.money(x.amount) + ' (' + x.method + ')' }); }); });
        if (c) ev.push({ at: c.start, kind: 'contract', text: 'Bắt đầu HĐ ' + c.id });
        ev = ev.filter(function (e) { return flt === 'all' || e.kind === flt; }).sort(function (a, z) { return a.at < z.at ? 1 : -1; }).slice(0, 14);
        body = '<div class="card"><div class="toolbar">' + TH.chips(S, 'tl', [{ id: 'all', label: 'Tất cả' }, { id: 'invoice', label: 'Hóa đơn' }, { id: 'receipt', label: 'Thu tiền' }, { id: 'room', label: 'Khai thác' }, { id: 'contract', label: 'Hợp đồng' }], flt) + TH.up('F009.C') + '</div><div class="card-bd"><ul class="timeline">' + ev.map(function (e) { return '<li>' + esc(e.text) + '<div class="when">' + F.date(e.at) + '</div></li>'; }).join('') + '</ul></div></div>';
      } else {
        body = '<div class="card card-flush">' + TH.cardHd('Lịch sử đầy đủ theo kỳ' + TH.up('F009.D')) + TH.table({ cols: [{ key: 'p', label: 'Kỳ', render: function (p) { return F.period(p); } }, { key: 'k', label: 'Khách', render: function (p) { var i = invs.find(function (x) { return x.period === p; }); return i ? esc(C.customer(i.customerId).name) : '<span class="muted">Trống</span>'; } }, { key: 'b', label: 'Hóa đơn', num: true, render: function (p) { var i = invs.find(function (x) { return x.period === p; }); return i ? F.money(i.total) : '—'; } }, { key: 'pd', label: 'Đã thu', num: true, render: function (p) { var i = invs.find(function (x) { return x.period === p; }); return i ? F.money(C.paid(i.id)) : '—'; } }, { key: 'e', label: 'kWh', num: true, render: function (p) { var x = C.reading(r.id, p); return x && x.elecCur !== null ? x.elecCur - x.elecPrev : '—'; } }, { key: 'g', label: 'Giá niêm yết', num: true, render: function (p) { var h = TH.db.priceHistory.filter(function (x) { return x.roomId === r.id && x.from <= p + '-28'; }).pop(); return F.money(h ? h.rent : r.rent); } }], rows: TH.PERIODS.slice().reverse() }) + '</div>';
      }
      var hist = TH.gate('F007.C', '<div class="card u-mt-16"><div class="card-hd"><div class="card-title">Lịch sử trạng thái phòng ' + TH.up('F007.C') + '</div></div><div class="card-bd"><ul class="timeline">' + (TH.db.roomEvents.filter(function (e) { return e.roomId === r.id; }).map(function (e) { return '<li>' + TH.statusLabel(e.from) + ' → <b>' + TH.statusLabel(e.to) + '</b> · ' + esc(e.note) + '<div class="when">' + F.date(e.at) + ' · ' + esc(C.staffName(e.by)) + '</div></li>'; }).join('') || '<li class="muted">Chưa đổi trạng thái.</li>') + '</ul>' +
        TH.gate('F007.D', '<div class="small u-mt-8">' + TH.tierPill('D') + ' Giá theo hiệu lực: ' + (TH.db.priceHistory.filter(function (x) { return x.roomId === r.id; }).map(function (x) { return F.money(x.rent) + ' từ ' + F.date(x.from); }).join(' → ') || 'chưa thay đổi') + '</div>', { mode: 'mini', label: 'Theo dõi giá qua hiệu lực' }) + '</div></div>', { label: 'Event lịch sử trạng thái phòng', lines: 2 });
      var ctR = C.contractOfRoom(r.id), kR = ctR && C.customer(ctR.customerId);
      return TH.pageHeader({ screen: 'ROOM-02', title: 'Phòng ' + r.id, crumbs: [['Phòng', TH.router.href('ROOM-01')], [r.id]], status: TH.statusOf('room', r.status),
          facts: TH.detailFacts([['Tòa', esc(b.name)], ['Tầng · diện tích', 'Tầng ' + r.floor + ' · ' + r.area + ' m²'], ['Giá niêm yết', F.money(r.rent) + '/tháng'], ['Khách hiện tại', kR ? '<a href="' + TH.router.href('CUS-02', ctR.id) + '">' + esc(kR.name) + '</a>' : '<span class="muted">Phòng trống</span>']]),
          actions: '<a class="btn" href="' + TH.router.href('METER-01') + '">' + I('zap', 'ic-sm') + 'Chỉ số điện nước</a>' + TH.permBtn('master.edit', '<button type="button" class="btn btn-primary" data-act="room.edit" data-id="' + r.id + '">' + I('edit', 'ic-sm') + 'Sửa phòng</button>', 'Sửa · 403') }) +
        '<div class="card tab-card u-mb-16">' + TH.tabs(S, tabs, tab) + '</div>' + TH.tabPanel(S, tab, body) + hist;
    },
  };

  /* ---------------- ROOM-IMP ---------------- */
  var impCfg = {
    screen: 'ROOM-IMP', kind: 'room', template: 'mau_phong_theo_toa.xlsx', sampleFile: 'phong_bo_sung_T10.xlsx',
    columns: [{ key: 'b', label: 'Mã tòa' }, { key: 'code', label: 'Mã phòng' }, { key: 'floor', label: 'Tầng', num: true }, { key: 'rent', label: 'Giá', num: true }, { key: 'status', label: 'Trạng thái' }],
    inc: { preview: 'F008.B', upsert: 'F008.C', history: 'F008.D' },
    sample: function () {
      return [
        { line: 2, data: { b: 'TH-CG', code: '402', floor: 4, rent: 6200000, status: 'Trống' }, errors: [] },
        { line: 3, data: { b: 'TH-TX', code: '302', floor: 3, rent: 4700000, status: 'Trống' }, errors: [] },
        { line: 4, data: { b: 'TH-CG', code: '201', floor: 2, rent: 5400000, status: 'Đang thuê' }, errors: [], dup: true },
        { line: 5, data: { b: 'TH-XX', code: '101', floor: 1, rent: 3000000, status: 'Trống' }, errors: ['Mã tòa không tồn tại'] },
        { line: 6, data: { b: 'TH-DD', code: '303', floor: 3, rent: '', status: 'Trống' }, errors: ['Thiếu giá'] },
      ];
    },
    commit: function (rows, policy) {
      var n = 0;
      rows.forEach(function (r) {
        var id = r.data.b.slice(3) + '-' + r.data.code, ex = C.room(id);
        if (ex) { if (policy === 'update') { TH.db.priceHistory.push({ roomId: id, from: TH.TODAY, rent: r.data.rent }); ex.rent = r.data.rent; n++; } return; }
        TH.db.rooms.push({ id: id, code: id, buildingId: r.data.b, floor: r.data.floor, area: 25, rent: r.data.rent, status: 'vacant', meters: [{ type: 'elec', code: 'Đ-' + id.replace('-', '') }, { type: 'water', code: 'N-' + id.replace('-', '') }] });
        n++;
      });
      return n;
    },
  };
  TH.registerImport(impCfg);
  TH.views['ROOM-IMP'] = { modal: { size: 'xl' }, scan: function () { return [{ ui: { step: 'upload' } }, { ui: { step: 'check' } }, { ui: { step: 'done' } }]; }, render: function () {
    var out = TH.importFlow(impCfg);
    out.body += TH.gate('F008.D', '<div class="alert alert-neutral u-mt-12">' + I('layers', 'ic-sm') + '<div class="alert-body">' + TH.tierPill('D') + ' Nhập nhiều tòa trong một tệp có thống kê batch: TH-CG 2 dòng · TH-TX 1 · TH-DD 1 · không xác định 1.</div></div>', { mode: 'mini', label: 'Nhập nhiều tòa có thống kê theo lô' });
    return out;
  } };
})();
