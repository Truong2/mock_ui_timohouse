/* Tòa nhà: BLD-01 (danh sách tóm tắt), BLD-02 (chi tiết theo tab), BLD-IMP (import). F004–F006 (+F003, F013, F033, F036).
   CR-BLD-01 (note.md): hồ sơ tòa (m², tầng, phòng, tình trạng, PCCC/ĐKKD), 4 vai trò nhân sự, 2 nhóm tài sản,
   thời gian vận hành, hiệu suất A/B/C/D theo mốc 5/10/15, lợi nhuận, lịch thanh toán cho chủ nhà; sửa inline từng nhóm. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;
  var digits = function (v) { return TH.digits(v); };

  function roomsOf(bId) { return TH.db.rooms.filter(function (r) { return r.buildingId === bId; }); }
  function shortAddr(a) { return (a || '').split(',').slice(0, 2).join(','); }
  function opStatus(b) {
    if (b.opTo && b.opTo < TH.TODAY) return TH.badge('Đã dừng vận hành', 'neutral', { dot: true });
    return TH.badge('Đang vận hành', 'success', { dot: true });
  }
  function docsOf(bId, kind) { return TH.db.bldDocs.filter(function (d) { return d.buildingId === bId && (!kind || d.kind === kind); }); }

  /* ---------------- BLD-01 · danh sách tóm tắt ---------------- */
  TH.views['BLD-01'] = {
    render: function () {
      var S = 'BLD-01', q = TH.store.ui(S, 'q', ''), area = TH.store.ui(S, 'area', 'all');
      var all = TH.db.buildings.filter(function (b) { return TH.inScope(b.id); });
      var rows = all.filter(function (b) { return (area === 'all' || b.area === area) && TH.match(q, [b.id, b.name, b.address, C.owner(b.ownerId).name]); });
      var table = TH.table({
        label: 'Danh sách tòa',
        mobile: { identity: 'n', primary: 'cap', visible: ['n', 'ad', 's', 'cap', 'go'] },
        cols: [
          { key: 'n', label: 'Mã / tên tòa', render: function (b) { return '<div class="cell-main"><a href="' + TH.router.href('BLD-02', b.id) + '">' + esc(b.name) + '</a></div><div class="cell-sub"><span class="mono">' + b.id + '</span></div>'; } },
          { key: 'ad', label: 'Địa chỉ', render: function (b) { return '<span class="small">' + esc(shortAddr(b.address)) + '</span>'; } },
          { key: 'o', label: 'Chủ nhà', render: function (b) { return '<a href="' + TH.router.href('OWN-02', b.ownerId) + '">' + esc(C.owner(b.ownerId).name) + '</a>'; } },
          { key: 'r', label: 'Số phòng', num: true, render: function (b) { return '<b>' + roomsOf(b.id).length + '</b>'; } },
          { key: 's', label: 'Trạng thái', render: function (b) { return opStatus(b) + (b.fire && b.fire.status === 'none' ? '<div style="margin-top:4px">' + TH.badge('PCCC chưa cập nhật', 'warning', { icon: 'shieldAlert' }) + '</div>' : ''); } },
          { key: 'cap', label: 'Đang thuê · công suất', gate: 'F004.B', num: true, render: function (b) { var rs = roomsOf(b.id), o = rs.filter(function (r) { return r.status === 'occupied'; }).length; return o + '/' + rs.length + ' · <b>' + F.pct(o / rs.length, 0) + '</b>'; } },
          { key: 'snap', label: 'Snapshot kỳ', gate: 'F004.D', render: function (b) { return TH.periodLocked('2026-09') ? '<span class="small">Kỳ 09/2026 · ' + roomsOf(b.id).length + ' phòng</span>' : '—'; } },
          { key: 'go', label: '', render: function (b) { return '<a class="btn btn-sm btn-ghost" href="' + TH.router.href('BLD-02', b.id) + '">Xem chi tiết' + I('chevronRight', 'ic-sm') + '</a>'; } },
        ],
        rows: rows,
        rowAttrs: function (b) { return 'class="is-clickable" tabindex="0" data-href="' + TH.router.href('BLD-02', b.id) + '"'; },
        empty: { title: 'Không có tòa phù hợp', text: 'Đổi từ khóa hoặc khu vực.' },
      });
      var areas = [{ id: 'all', label: 'Mọi khu vực' }].concat(all.map(function (b) { return { id: b.area, label: b.area }; }));
      var roomBoard = TH.canScreen('ROOM-01') && rows.length ? '<section class="card room-board" aria-labelledby="room-board-title"><div class="card-hd"><div><h2 id="room-board-title" class="card-title">Sơ đồ phòng</h2><p class="card-sub">Tình trạng hiện tại · chọn phòng để mở hồ sơ</p></div><div class="room-legend">' +
        ['occupied', 'vacant', 'maintenance', 'reserved'].map(function (status) { return '<span><i class="room-swatch room-' + status + '"></i>' + esc(TH.statusLabel(status)) + '</span>'; }).join('') + '</div></div><div class="room-board-body">' + rows.map(function (b) {
          return '<div class="room-board-row"><a class="room-building" href="' + TH.router.href('BLD-02', b.id) + '">' + esc(b.short) + '</a><div class="room-slots">' + roomsOf(b.id).map(function (r) {
            var text = esc(r.code || r.id.split('-').slice(1).join('-')), name = 'Phòng ' + r.id + ' · ' + TH.statusLabel(r.status) + ' · ' + b.short;
            return TH.canScreen('ROOM-02') ? '<a class="room-slot room-' + esc(r.status) + '" href="' + TH.router.href('ROOM-02', r.id) + '" aria-label="' + esc(name) + '" title="' + esc(name) + '">' + text + '</a>' : '<span class="room-slot room-' + esc(r.status) + '" title="' + esc(name) + '">' + text + '</span>';
          }).join('') + '</div></div>';
        }).join('') + '</div></section>' : '';
      return TH.pageHeader({ screen: S, desc: 'Thông tin tòa, công suất phòng và tình trạng vận hành.', actions: '<button type="button" class="btn" data-act="imp.open" data-screen="BLD-IMP">' + I('upload', 'ic-sm') + 'Import Excel</button>' + TH.permBtn('master.edit', '<button type="button" class="btn btn-primary" data-act="bld.add">' + I('plus', 'ic-sm') + 'Thêm tòa</button>', 'Thêm · 403') }) +
        '<div class="card card-flush"><div class="toolbar">' + TH.searchBox(S, 'Tìm mã, tên, địa chỉ, chủ nhà…') + TH.uiSelect(S, 'area', areas, area, 'Khu vực') + '</div>' + table + '</div>' + roomBoard;
    },
    dialogs: [function () { bldForm(); }],
  };
  function bldForm() {
    var form = 'bld-new';
    return { title: 'Thêm tòa', sub: 'BLD-01 · CRUD tòa cơ bản; chủ nhà phải tồn tại. Hồ sơ chi tiết bổ sung tại trang chi tiết.',
      body: '<div class="form-grid">' + TH.field({ form: form, name: 'id', label: 'Mã tòa', def: 'TH-' }) + TH.field({ form: form, name: 'name', label: 'Tên tòa', def: '', required: true }) +
        TH.field({ form: form, name: 'area', label: 'Khu vực', def: '' }) + TH.field({ form: form, name: 'owner', label: 'Chủ nhà', type: 'select', options: TH.db.owners.filter(function (o) { return o.status === 'active'; }).map(function (o) { return { id: o.id, label: o.id + ' · ' + o.name }; }) }) +
        TH.field({ form: form, name: 'manager', label: 'Nhân viên vận hành chính', type: 'select', options: TH.db.staff.filter(function (s) { return s.role === 'manager'; }).map(function (s) { return { id: s.id, label: s.name }; }) }) + TH.field({ form: form, name: 'rent', label: 'Giá thuê tòa (đ/tháng)', def: '', num: true, inputmode: 'numeric' }) +
        TH.field({ form: form, name: 'floors', label: 'Số tầng', def: '3', num: true }) + TH.field({ form: form, name: 'floorArea', label: 'Tổng diện tích sàn (m²)', def: '', num: true, hint: 'Đất / xây dựng nhập ở trang chi tiết' }) +
        TH.field({ form: form, name: 'address', label: 'Địa chỉ', def: '', span: true }) + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="bld.save">Lưu tòa</button>' };
  }
  function newBuilding(o) {
    return Object.assign({ elecPrice: 3800, elecBuyPrice: null, waterPrice: 30000, waterMethod: 'meter_m3', ownerRent: 0, openedAt: TH.TODAY, status: 'active', landArea: null, buildArea: null, floorArea: null, condition: 'Chưa đánh giá', conditionAt: null, conditionBy: null, conditionNote: '', elevator: false, gcn: null,
      fire: { status: 'none', docType: '', docNo: '', issuedAt: '', issuer: '', validTo: null, holder: '', file: null, note: '' }, bizReg: { status: 'none', holder: '', regNo: '', issuer: '', issuedAt: '', file: null, note: '' }, opFrom: TH.TODAY, opTo: null }, o);
  }
  TH.act['bld.add'] = function () { TH.modal.open({ key: 'bld-form', size: 'md', render: bldForm }); };
  TH.act['bld.save'] = function () {
    var g = function (k, d) { return TH.store.draft('bld-new', k, d); };
    var id = (g('id', '') || '').trim().toUpperCase(), name = (g('name', '') || '').trim();
    if (!name || id.length < 4) { TH.toast('Thiếu thông tin', 'Nhập mã tòa và tên tòa.', 'danger'); return; }
    if (C.building(id)) { TH.toast('Trùng mã tòa', esc(id) + ' đã tồn tại.', 'danger'); return; }
    var owner = g('owner', TH.db.owners.find(function (o) { return o.status === 'active'; }).id), mgr = g('manager', 'NV-003'), rent = digits(g('rent', 0));
    TH.db.buildings.push(newBuilding({ id: id, name: name, short: name.replace('TimeHouse ', ''), area: g('area', '') || '—', address: g('address', '') || '—', ownerId: owner, managerId: mgr, floors: +g('floors', 3) || 3, floorArea: digits(g('floorArea', '')) || null, ownerRent: rent }));
    TH.db.ownerLinks.push({ buildingId: id, ownerId: owner, role: 'Chủ sở hữu', from: TH.TODAY, to: null });
    TH.db.leases.push({ id: 'HĐT-' + id.slice(3) + '-' + TH.TODAY.slice(0, 4), buildingId: id, ownerId: owner, rent: rent, deposit: rent, handover: TH.TODAY, start: TH.TODAY, end: TH.addDays((+TH.TODAY.slice(0, 4) + 5) + TH.TODAY.slice(4), -1), termMonths: 60, holdFrom: TH.TODAY, holdTo: TH.TODAY, payCycle: 3, payFrom: 1, payTo: 10, referrer: '', enteredBy: TH.me().id, enteredAt: TH.TODAY, note: 'Tạo cùng hồ sơ tòa — cập nhật điều khoản theo HĐ.', file: null, status: 'active', versions: [{ v: 1, at: TH.TODAY, by: TH.me().id, note: 'Khởi tạo' }] });
    TH.db.assignments.push({ id: 'PC-' + Date.now().toString().slice(-4), staffId: mgr, buildingId: id, role: TH.ROLE_MAIN, main: true, from: TH.TODAY, to: null });
    TH.log('Thêm tòa', id, name, 'building', id);
    TH.store.clearDraft('bld-new'); TH.modal.close('bld-form', { silent: true }); TH.app.refresh(); TH.toast('Đã thêm tòa', esc(id + ' · ' + name) + ' · <a href="' + TH.router.href('BLD-02', id) + '">Mở chi tiết</a>');
  };

  /* ---------------- Nhóm thông tin sửa inline ---------------- */
  TH.SECTIONS.bldInfo = {
    title: 'Thông tin chung',
    sub: 'Địa chỉ, diện tích, số tầng, số phòng, tình trạng, đơn giá điện nước',
    values: function (id) {
      var b = C.building(id);
      return { name: b.name, area: b.area, address: b.address, landArea: b.landArea || '', buildArea: b.buildArea || '', floorArea: b.floorArea || '', floors: b.floors, roomsDeclared: b.roomsDeclared || roomsOf(id).length,
        condition: b.condition || 'Chưa đánh giá', conditionAt: b.conditionAt || '', conditionBy: b.conditionBy || '', conditionNote: b.conditionNote || '', elevator: b.elevator ? 'yes' : 'no',
        elecPrice: b.elecPrice || '', elecBuyPrice: b.elecBuyPrice || '', waterMethod: b.waterMethod || 'meter_m3', waterPrice: b.waterPrice || '', evnCode: b.evnCode || '', waterCode: b.waterCode || '', netCode: b.netCode || '' };
    },
    fields: function () {
      var staff = TH.db.staff.filter(function (s) { return s.status === 'active' && s.role !== 'hr'; }).map(function (s) { return { id: s.id, label: s.name + ' · ' + s.title }; });
      return [
        { name: 'name', label: 'Tên tòa', required: true },
        { name: 'area', label: 'Khu vực' },
        { name: 'address', label: 'Địa chỉ đầy đủ', span: true, required: true },
        { name: 'landArea', label: 'Diện tích đất (m²)', num: true, inputmode: 'decimal', hint: 'Để trống nếu chưa có chứng từ' },
        { name: 'buildArea', label: 'Diện tích xây dựng (m²)', num: true, inputmode: 'decimal' },
        { name: 'floorArea', label: 'Tổng diện tích sàn (m²)', num: true, inputmode: 'decimal' },
        { name: 'floors', label: 'Số tầng', num: true, inputmode: 'numeric' },
        { name: 'roomsDeclared', label: 'Tổng số phòng', num: true, inputmode: 'numeric', hint: 'Đối chiếu với số phòng đã tạo ở danh mục phòng' },
        { name: 'elevator', label: 'Thang máy', type: 'select', options: [{ id: 'yes', label: 'Có' }, { id: 'no', label: 'Không' }] },
        { name: 'condition', label: 'Tình trạng tòa nhà', type: 'select', options: TH.BLD_CONDITIONS, hint: 'Đánh giá tay, không tự tính theo tuổi nhà (G-06)' },
        { name: 'conditionAt', label: 'Ngày đánh giá', type: 'date' },
        { name: 'conditionBy', label: 'Người đánh giá', type: 'select', options: [{ id: '', label: '—' }].concat(staff) },
        { name: 'conditionNote', label: 'Ghi chú / minh chứng đánh giá' },
        { name: 'elecPrice', label: 'Giá bán điện (đ/kWh)', num: true, inputmode: 'numeric', hint: 'Theo biểu phí HĐ khách thuê' },
        { name: 'elecBuyPrice', label: 'Giá mua điện (đ/kWh)', num: true, inputmode: 'numeric', hint: 'Giá đầu vào trả chủ nhà/EVN — tách với giá bán (D-03)' },
        { name: 'waterMethod', label: 'Cách tính nước', type: 'select', options: Object.keys(TH.WATER_METHODS).map(function (k) { return { id: k, label: TH.WATER_METHODS[k] }; }) },
        { name: 'waterPrice', label: 'Đơn giá nước', num: true, inputmode: 'numeric', hint: 'Đơn vị theo cách tính đã chọn' },
        { name: 'evnCode', label: 'Mã HĐ điện' },
        { name: 'waterCode', label: 'Mã HĐ nước' },
        { name: 'netCode', label: 'Mã HĐ mạng' },
      ];
    },
    validate: function (v) {
      if (!v.name || !v.address) return 'Nhập tên tòa và địa chỉ.';
      var bad = ['landArea', 'buildArea', 'floorArea'].filter(function (k) { return v[k] !== '' && !(+String(v[k]).replace(',', '.') > 0); });
      if (bad.length) return 'Diện tích phải là số dương (m²) hoặc để trống.';
      if (digits(v.floors) < 1) return 'Số tầng tối thiểu là 1.';
      if (digits(v.elecPrice) <= 0 || digits(v.waterPrice) <= 0) return 'Đơn giá điện, nước phải lớn hơn 0.';
      return null;
    },
    save: function (id, v) {
      var b = C.building(id), m2 = function (x) { return x === '' ? null : +String(x).replace(',', '.'); };
      Object.assign(b, { name: v.name, short: v.name.replace('TimeHouse ', ''), area: v.area, address: v.address, landArea: m2(v.landArea), buildArea: m2(v.buildArea), floorArea: m2(v.floorArea), floors: digits(v.floors), roomsDeclared: digits(v.roomsDeclared),
        condition: v.condition, conditionAt: v.conditionAt || null, conditionBy: v.conditionBy || null, conditionNote: v.conditionNote, elevator: v.elevator === 'yes',
        elecPrice: digits(v.elecPrice), elecBuyPrice: digits(v.elecBuyPrice) || null, waterMethod: v.waterMethod, waterPrice: digits(v.waterPrice), evnCode: v.evnCode, waterCode: v.waterCode, netCode: v.netCode });
    },
    log: function (id) { return ['Sửa tòa', id, 'Thông tin chung', 'building', id]; },
    view: function (id, v) {
      var counted = roomsOf(id).length;
      var m2 = function (x) { return x ? F.num(x) + ' m²' : '<span class="muted">Chưa cập nhật</span>'; };
      var condTone = /^Mới|Khá mới/.test(v.condition) ? 'success' : /Cũ/.test(v.condition) ? 'warning' : v.condition === 'Chưa đánh giá' ? 'neutral' : 'info';
      return '<div class="grid-2 sec-grid">' + TH.kv([
        ['Mã tòa', '<span class="mono">' + esc(id) + '</span>'],
        ['Tên', '<b>' + esc(v.name) + '</b>'],
        ['Địa chỉ', esc(v.address)],
        ['Khu vực', esc(v.area)],
        ['Diện tích đất', m2(v.landArea)],
        ['Diện tích xây dựng', m2(v.buildArea)],
        ['Tổng diện tích sàn', m2(v.floorArea)],
        ['Số tầng', esc(String(v.floors))],
      ]) + TH.kv([
        ['Số phòng', '<b>' + v.roomsDeclared + '</b>' + (+v.roomsDeclared !== counted ? ' ' + TH.badge('Danh mục có ' + counted + ' phòng', 'warning') : ' <span class="small muted">(khớp danh mục phòng)</span>')],
        ['Tình trạng', TH.badge(v.condition, condTone) + (v.conditionAt ? '<div class="small muted">' + F.date(v.conditionAt) + ' · ' + esc(C.staffName(v.conditionBy)) + (v.conditionNote ? ' · ' + esc(v.conditionNote) : '') + '</div>' : '')],
        ['Thang máy', v.elevator === 'yes' ? 'Có' : 'Không'],
        ['Điện: bán · mua', F.money(v.elecPrice) + '/kWh · ' + (v.elecBuyPrice ? F.money(v.elecBuyPrice) + '/kWh' : '<span class="muted">chưa nhập giá mua</span>') + ' ' + TH.openBadge('', 'D-03')],
        ['Nước', esc(TH.WATER_METHODS[v.waterMethod] || v.waterMethod) + ' · ' + F.money(v.waterPrice) + (v.waterMethod !== 'meter_m3' ? ' <span class="small warn-text">hóa đơn demo vẫn tính theo m³ — chờ D-03</span>' : '')],
        ['Mã HĐ điện · nước · mạng', '<span class="mono small">' + esc(v.evnCode || '—') + ' · ' + esc(v.waterCode || '—') + ' · ' + esc(v.netCode || '—') + '</span>'],
      ]) + '</div>';
    },
  };
  TH.SECTIONS.bldOps = {
    title: 'Thời gian vận hành',
    sub: 'Từ ngày — đến ngày',
    values: function (id) { var b = C.building(id); return { opFrom: b.opFrom || b.openedAt, opTo: b.opTo || '' }; },
    fields: function () { return [{ name: 'opFrom', label: 'Ngày bắt đầu vận hành', type: 'date', required: true }, { name: 'opTo', label: 'Ngày kết thúc vận hành', type: 'date', hint: 'Để trống nếu đang vận hành' }]; },
    validate: function (v) { return !v.opFrom ? 'Nhập ngày bắt đầu vận hành.' : v.opTo && v.opTo < v.opFrom ? 'Ngày kết thúc phải sau ngày bắt đầu.' : null; },
    save: function (id, v) { var b = C.building(id); b.opFrom = v.opFrom; b.openedAt = v.opFrom; b.opTo = v.opTo || null; },
    log: function (id) { return ['Sửa thời gian vận hành', id, '', 'building', id]; },
    view: function (id, v) {
      var end = v.opTo || TH.TODAY, m = (+end.slice(0, 4) - +v.opFrom.slice(0, 4)) * 12 + (+end.slice(5, 7) - +v.opFrom.slice(5, 7));
      return TH.kv([['Từ ngày', F.date(v.opFrom)], ['Đến ngày', v.opTo ? F.date(v.opTo) : '<span class="muted">Đang vận hành</span>'], ['Thời gian', m + ' tháng' + (v.opTo ? '' : ' tính đến ' + F.date(TH.TODAY))]]);
    },
  };
  function proofSection(key, field, label, icon) {
    TH.SECTIONS[key] = {
      title: I(icon, 'ic-sm') + label,
      sub: field === 'fire' ? 'Loại hồ sơ theo yêu cầu áp dụng thực tế — không mặc định mọi tòa cùng một giấy (G-07)' : 'Chủ thể đăng ký thực tế, có thể khác chủ nhà (G-07)',
      values: function (id) {
        var x = C.building(id)[field] || {};
        return field === 'fire' ? { status: x.status || 'none', docType: x.docType || '', docNo: x.docNo || '', issuedAt: x.issuedAt || '', issuer: x.issuer || '', validTo: x.validTo || '', holder: x.holder || '', note: x.note || '' }
          : { status: x.status || 'none', holder: x.holder || '', regNo: x.regNo || '', issuer: x.issuer || '', issuedAt: x.issuedAt || '', note: x.note || '' };
      },
      fields: function () {
        var f = [{ name: 'status', label: 'Trạng thái', type: 'select', options: Object.keys(TH.DOC_STATES).map(function (k) { return { id: k, label: TH.DOC_STATES[k][0] }; }) }];
        if (field === 'fire') f = f.concat([
          { name: 'docType', label: 'Loại hồ sơ', placeholder: 'VD: biên bản nghiệm thu, GCN thẩm duyệt, hồ sơ kiểm tra' },
          { name: 'docNo', label: 'Số văn bản' }, { name: 'issuedAt', label: 'Ngày cấp', type: 'date' }, { name: 'issuer', label: 'Cơ quan cấp' },
          { name: 'validTo', label: 'Hiệu lực đến (nếu có)', type: 'date' }, { name: 'holder', label: 'Chủ thể' },
        ]);
        else f = f.concat([
          { name: 'holder', label: 'Cá nhân / pháp nhân đứng tên', hint: 'Không tự lấy chủ nhà làm mặc định' }, { name: 'regNo', label: 'MST / số đăng ký' },
          { name: 'issuer', label: 'Cơ quan cấp' }, { name: 'issuedAt', label: 'Ngày cấp', type: 'date' },
        ]);
        f.push({ name: 'note', label: 'Ghi chú', span: true });
        return f;
      },
      save: function (id, v) { var b = C.building(id); b[field] = Object.assign({}, b[field], v, { validTo: v.validTo || null }); },
      log: function (id) { return ['Sửa ' + label, id, '', 'building', id]; },
      view: function (id, v) {
        var files = docsOf(id, field === 'fire' ? 'PCCC' : 'ĐKKD'), st = TH.DOC_STATES[v.status] || TH.DOC_STATES.none;
        var rows = field === 'fire' ? [['Loại hồ sơ', esc(v.docType || '—')], ['Số · ngày cấp', esc(v.docNo || '—') + (v.issuedAt ? ' · ' + F.date(v.issuedAt) : '')], ['Cơ quan cấp', esc(v.issuer || '—')], ['Hiệu lực đến', v.validTo ? F.date(v.validTo) : '—'], ['Chủ thể', esc(v.holder || '—')]]
          : [['Đứng tên', v.holder ? esc(v.holder) : TH.openBadge('', 'chưa xác định')], ['MST / số ĐK', esc(v.regNo || '—')], ['Cơ quan · ngày cấp', esc(v.issuer || '—') + (v.issuedAt ? ' · ' + F.date(v.issuedAt) : '')]];
        return '<div class="stack-sm"><div class="row" style="gap:8px">' + TH.badge(st[0], st[1], { icon: v.status === 'verified' ? 'checkCircle' : v.status === 'none' ? 'alert' : 'info' }) + (v.note ? '<span class="small">' + esc(v.note) + '</span>' : '') + '</div>' +
          TH.kv(rows) +
          (files.length ? files.map(function (d) { return TH.fileOf(d.file); }).join('') : '<div class="small muted">Chưa có tài liệu minh chứng.</div>') +
          TH.permBtn('master.edit', '<button type="button" class="btn btn-sm" data-act="bdoc.upload" data-b="' + id + '" data-kind="' + (field === 'fire' ? 'PCCC' : 'ĐKKD') + '">' + I('upload', 'ic-sm') + 'Tải minh chứng</button>', 'Tải lên · 403') + '</div>';
      },
    };
  }
  proofSection('bldFire', 'fire', 'PCCC', 'shieldCheck');
  proofSection('bldBiz', 'bizReg', 'Đăng ký kinh doanh', 'stamp');

  /* ---------------- Tab: Nhân sự (4 vai trò) ---------------- */
  function staffTab(b) {
    var asg = TH.db.assignments.filter(function (a) { return a.buildingId === b.id; });
    var cur = asg.filter(function (a) { return !a.to; });
    var cards = TH.BLD_ROLES.map(function (role) {
      var people = cur.filter(function (a) { return a.role === role.id; });
      var addBtn = TH.permBtn('master.edit', '<button type="button" class="btn btn-sm" data-act="bld.assign" data-id="' + b.id + '" data-role="' + esc(role.id) + '">' + I(people.length && role.tier === 'A' ? 'refresh' : 'plus', 'ic-sm') + (people.length && role.tier === 'A' ? 'Đổi' : 'Thêm') + '</button>', '403');
      var list = people.length ? people.map(function (a) {
        var s = C.staff(a.staffId), n = TH.db.assignments.filter(function (x) { return x.staffId === a.staffId && !x.to; }).map(function (x) { return x.buildingId; }).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).length;
        return '<div class="staff-row">' + TH.personCell(s.name, esc(s.title) + ' · ' + esc(s.phone)) + '<div class="staff-meta">' + (a.main ? TH.badge('Chính', 'teal') : TH.badge('Phụ', 'neutral')) + (a.note ? ' <span class="small muted">' + esc(a.note) + '</span>' : '') + ' ' + TH.badge('Đang hiệu lực', 'success', { dot: true }) +
          (n > 1 ? ' <span class="small muted" data-tip="Một nhân sự có thể phụ trách nhiều tòa — quy tắc giới hạn chờ chốt">Phụ trách ' + n + ' tòa</span>' : '') +
          (TH.has('F006.C') ? '<div class="small muted">Hiệu lực từ ' + F.date(a.from) + '</div>' : '') + '</div>' +
          (role.tier === 'A' && a.main ? '' : TH.permBtn('master.edit', '<button type="button" class="btn btn-sm btn-ghost btn-icon" data-act="asg.end" data-id="' + a.id + '" aria-label="Kết thúc phân công ' + esc(s.name) + '" data-tip="Kết thúc phân công (giữ lịch sử)">' + I('x', 'ic-sm') + '</button>', '')) + '</div>';
      }).join('') : '<div class="small muted">Chưa phân công.</div>';
      var card = '<div class="card role-card">' + TH.cardHd(esc(role.id) + ' <span class="small muted">· ' + role.short + '</span>' + (role.tier !== 'A' ? TH.up('F006.B') : ''), esc(role.hint), addBtn) + '<div class="card-bd stack-sm">' + list + '</div></div>';
      return role.tier === 'A' ? card : TH.gate('F006.B', card, { label: 'Phân công nhiều người theo vai trò (' + role.id + ')', lines: 2 });
    }).join('');
    return '<div class="grid-2" style="margin-bottom:16px">' + cards + '</div>' +
      '<div class="grid-2">' + TH.gate('F004.C', '<div class="card"><div class="card-hd"><div class="card-title">Lịch sử phân công ' + TH.up('F004.C') + '</div></div><div class="card-bd"><ul class="timeline">' + asg.slice().reverse().map(function (a) { return '<li><b>' + esc(C.staffName(a.staffId)) + '</b> · ' + esc(a.role) + (a.main ? ' (chính)' : '') + '<div class="when">' + F.date(a.from) + ' → ' + (a.to ? F.date(a.to) : 'nay') + '</div></li>'; }).join('') + '</ul></div></div>', { label: 'Lịch sử phân công quản lý', lines: 3 }) +
      TH.gate('F006.D', '<div class="card"><div class="card-hd"><div class="card-title">Tách vai trò doanh thu ' + TH.up('F006.D') + '</div></div><div class="card-bd">' + TH.kv([['Người tạo báo thu', esc(C.staffName(b.managerId))], ['Người cập nhật', esc(C.staffName(b.managerId))], ['Người xác nhận doanh thu', esc(C.staffName('NV-002')) + ' (Kế toán)']]) + '</div></div>', { label: 'Tách người tạo/cập nhật/xác nhận doanh thu', lines: 3 }) + '</div>' +
      '<p class="small muted" style="margin-top:12px">' + I('info', 'ic-sm') + ' Chọn nhân sự từ danh sách nhân viên (HR-01). Đề xuất G-08: nhiều người cùng vai trò, một người phụ trách nhiều tòa, mỗi vai trò một người <b>chính</b> tại một thời điểm; quyền truy cập hệ thống cấu hình riêng (SYS-01). PROPOSED.</p>';
  }
  function assignForm(bId) {
    var form = 'bld-asg-' + bId, role = TH.store.draft(form, 'role', TH.ROLE_MAIN);
    var roleDef = TH.BLD_ROLES.find(function (r) { return r.id === role; }) || TH.BLD_ROLES[0];
    var staff = TH.db.staff.filter(function (s) { return s.status === 'active' && (s.role === 'manager' || s.role === 'staff'); });
    return { title: 'Phân công nhân sự · ' + esc(TH.buildingName(bId)), sub: 'BLD-02 › Nhân sự · F006',
      body: '<div class="stack"><div class="form-grid">' +
        TH.gate('F006.B', TH.field({ form: form, name: 'role', label: 'Vai trò', type: 'select', options: TH.BLD_ROLES.map(function (r) { return r.id; }), def: TH.ROLE_MAIN, labelExtra: TH.up('F006.B') }), { ghost: 'self', label: 'Phân công nhiều người theo vai trò' }) +
        TH.field({ form: form, name: 'staff', label: 'Nhân sự (từ danh sách nhân viên)', type: 'select', options: staff.map(function (s) { var n = TH.db.assignments.filter(function (a) { return a.staffId === s.id && !a.to; }).map(function (a) { return a.buildingId; }).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).length; return { id: s.id, label: s.name + ' · ' + s.title + (n ? ' · đang phụ trách ' + n + ' tòa' : '') }; }) }) +
        (TH.has('F006.B') ? TH.field({ form: form, name: 'main', label: 'Chính / Phụ', type: 'select', def: 'yes', options: [{ id: 'yes', label: 'Chính — thay người phụ trách chính hiện tại của vai trò' }, { id: 'no', label: 'Phụ — hỗ trợ' }], hint: 'Mỗi vai trò chỉ một người chính tại một thời điểm (đề xuất G-08)' }) : '') +
        TH.gate('F006.C', TH.field({ form: form, name: 'from', label: 'Hiệu lực từ ngày', type: 'date', def: TH.TODAY, labelExtra: TH.up('F006.C') }), { ghost: 'self', label: 'Hiệu lực theo ngày' }) + '</div>' +
        '<div class="alert alert-neutral">' + I('info', 'ic-sm') + '<div class="alert-body">' + (roleDef.tier === 'A' ? 'Gói A: thay nhân viên vận hành phụ trách chính. Người này chỉ xem/báo thu đúng tòa được giao.' : esc(roleDef.id) + ': có thể thêm nhiều người; giới hạn số người chờ chốt.') + '</div></div></div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="bld.assignSave" data-id="' + bId + '">' + I('check', 'ic-sm') + 'Lưu thay đổi</button>' };
  }
  TH.act['bld.assign'] = function (el) {
    var id = el.dataset.id, form = 'bld-asg-' + id;
    TH.store.clearDraft(form);
    if (el.dataset.role) TH.store.setDraft(form, 'role', el.dataset.role);
    var r = TH.BLD_ROLES.find(function (x) { return x.id === el.dataset.role; });
    var pref = r ? TH.db.staff.find(function (s) { return s.status === 'active' && (r.id === TH.ROLE_MAIN ? s.role === 'manager' : s.title === r.id); }) : null;
    if (pref) TH.store.setDraft(form, 'staff', pref.id);
    TH.modal.open({ key: 'bld-asg', size: 'md', render: function () { return assignForm(id); } });
  };
  TH.act['bld.assignSave'] = function (el) {
    var bId = el.dataset.id, form = 'bld-asg-' + bId, b = C.building(bId);
    var staff = TH.store.draft(form, 'staff', TH.db.staff.find(function (s) { return s.role === 'manager'; }).id);
    var role = TH.has('F006.B') ? TH.store.draft(form, 'role', TH.ROLE_MAIN) : TH.ROLE_MAIN;
    var from = TH.has('F006.C') ? TH.store.draft(form, 'from', TH.TODAY) : TH.TODAY;
    var main = !TH.has('F006.B') || TH.store.draft(form, 'main', 'yes') === 'yes';
    if (TH.db.assignments.some(function (a) { return a.buildingId === bId && a.staffId === staff && a.role === role && !a.to; }) && !main) { TH.toast('Đã có phân công', esc(C.staffName(staff) + ' đang là ' + role + ' của tòa.'), 'info'); return; }
    if (main) { TH.db.assignments.forEach(function (a) { if (a.buildingId === bId && a.role === role && a.main && !a.to) a.to = TH.addDays(from, -1); }); if (role === TH.ROLE_MAIN) b.managerId = staff; }
    TH.db.assignments.push({ id: 'PC-' + Date.now().toString().slice(-5), staffId: staff, buildingId: bId, role: role, main: main, from: from, to: null });
    TH.log('Phân công nhân sự tòa', bId, C.staffName(staff) + ' · ' + role + (main ? ' (chính)' : ''), 'building', bId);
    TH.store.clearDraft(form); TH.modal.close('bld-asg', { silent: true }); TH.app.refresh(); TH.toast('Đã lưu phân công', esc(C.staffName(staff) + ' · ' + role));
  };

  /* ---------------- Tab: Tài sản (2 danh sách) ---------------- */
  var ASSET_COND = ['Mới', 'Tốt', 'Bình thường', 'Cũ', 'Cần thay', 'Hỏng'];
  function assetTable(b, group) {
    var rows = TH.db.assets.filter(function (a) { return a.buildingId === b.id && a.group === group; });
    var inv = group === 'invest';
    return '<div class="card card-flush">' + TH.cardHd(I(inv ? 'plus' : 'owner', 'ic-sm') + (inv ? 'Tài sản đầu tư thêm' : 'Tài sản chủ nhà'), rows.length + ' dòng · ' + C.sum(rows, function (a) { return a.qty; }) + ' đơn vị' + (inv ? ' · nguyên giá ' + F.money(C.sum(rows, function (a) { return a.value || 0; })) : ' · bàn giao từ chủ nhà'),
        TH.permBtn('master.edit', '<button type="button" class="btn btn-sm" data-act="asset.add" data-b="' + b.id + '" data-group="' + group + '">' + I('plus', 'ic-sm') + 'Thêm</button>', '403')) +
      TH.table({ compact: true, label: inv ? 'Tài sản đầu tư thêm' : 'Tài sản chủ nhà', cols: [
        { key: 'n', label: 'Mã · tên tài sản', render: function (a) { return '<div class="cell-main">' + esc(a.name) + '</div><div class="cell-sub"><span class="mono">' + esc(a.id) + '</span>' + (a.note ? ' · ' + esc(a.note) : '') + '</div>'; } },
        { key: 'q', label: 'Số lượng', num: true, render: function (a) { return a.qty + ' <span class="small muted">' + esc(a.unit || '') + '</span>'; } },
        { key: 'l', label: 'Vị trí', render: function (a) { return esc(a.location || '—'); } },
        { key: 'c', label: 'Tình trạng', render: function (a) { return TH.badge(a.condition, /Hỏng|Cần thay/.test(a.condition) ? 'danger' : a.condition === 'Cũ' ? 'warning' : 'success') + '<div class="cell-sub">' + F.date(a.since) + '</div>'; } },
        { key: 'o', label: 'Bên sở hữu / chịu chi', render: function (a) { return '<span class="small">' + esc(a.payer || '—') + '</span><div class="cell-sub">' + (a.expenseId ? '<a class="mono" href="' + TH.router.href('EXP-01') + '">' + esc(a.expenseId) + '</a>' : esc(a.source || '')) + '</div>'; } },
      ].concat(inv ? [{ key: 'v', label: 'Nguyên giá', num: true, render: function (a) { return a.value ? F.money(a.value) + '<div class="cell-sub">' + (a.lifeMonths ? 'dùng ' + a.lifeMonths + ' tháng' : 'chưa có thời hạn SD') + '</div>' : '—'; } }] : []).concat([
        { key: 'x', label: '', render: function (a) { return TH.permBtn('master.edit', '<button type="button" class="btn btn-sm btn-ghost" data-act="asset.edit" data-id="' + a.id + '">' + I('edit', 'ic-sm') + 'Sửa</button>', ''); } },
      ]), rows: rows, empty: { title: 'Chưa có tài sản', text: 'Dùng “Thêm” để ghi nhận.' } }) + '</div>';
  }
  function assetForm(id, bId, group) {
    var a = id ? TH.db.assets.find(function (x) { return x.id === id; }) : null, form = 'asset-' + (id || 'new');
    group = a ? a.group : group;
    var g = TH.store.draft(form, 'group', group);
    return { title: (a ? 'Sửa tài sản ' + esc(a.id) : 'Thêm tài sản') + ' · ' + esc(TH.buildingName(a ? a.buildingId : bId)), sub: 'BLD-02 › Tài sản · trường chi tiết chờ chốt (note.md §4)',
      body: '<div class="form-grid">' +
        TH.field({ form: form, name: 'group', label: 'Nhóm', type: 'select', def: group, options: [{ id: 'owner', label: 'Tài sản chủ nhà' }, { id: 'invest', label: 'Tài sản đầu tư thêm' }] }) +
        TH.field({ form: form, name: 'name', label: 'Tên tài sản', def: a ? a.name : '', required: true }) +
        TH.field({ form: form, name: 'qty', label: 'Số lượng', def: a ? a.qty : 1, num: true, inputmode: 'numeric' }) +
        TH.field({ form: form, name: 'unit', label: 'Đơn vị', def: a ? a.unit : 'cái' }) +
        TH.field({ form: form, name: 'location', label: 'Vị trí', def: a ? a.location : '' }) +
        TH.field({ form: form, name: 'condition', label: 'Tình trạng', type: 'select', def: a ? a.condition : 'Tốt', options: ASSET_COND }) +
        TH.field({ form: form, name: 'since', label: 'Ngày ghi nhận', type: 'date', def: a ? a.since : TH.TODAY }) +
        TH.field({ form: form, name: 'payer', label: 'Bên sở hữu / bên chịu chi', def: a ? a.payer || '' : (group === 'invest' ? 'Công ty vận hành' : 'Chủ nhà') }) +
        TH.field({ form: form, name: 'source', label: 'Nguồn chứng từ', def: a ? a.source || '' : '', placeholder: 'Biên bản bàn giao, phiếu chi…' }) +
        (g === 'invest' ? TH.field({ form: form, name: 'purchaseDate', label: 'Ngày mua', type: 'date', def: a ? a.purchaseDate || a.since : TH.TODAY }) + TH.field({ form: form, name: 'value', label: 'Nguyên giá (đ)', def: a ? a.value || '' : '', num: true, inputmode: 'numeric' }) + TH.field({ form: form, name: 'lifeMonths', label: 'Thời hạn sử dụng (tháng)', def: a ? a.lifeMonths || '' : '', num: true, inputmode: 'numeric', hint: 'Khấu hao chỉ áp khi có chính sách được duyệt' }) : '') +
        TH.field({ form: form, name: 'note', label: 'Ghi chú', def: a ? a.note : '', span: true }) + '</div>' +
        (a ? '<div class="section-title" style="margin-top:12px">Nhật ký sửa / di chuyển / thanh lý</div><ul class="timeline">' + (TH.db.audit.filter(function (x) { return x.entity === a.id; }).map(function (x) { return '<li><b>' + esc(x.action) + '</b> — ' + esc(x.detail) + '<div class="when">' + esc(C.staffName(x.by)) + ' · ' + F.date(x.at) + '</div></li>'; }).join('') || '') + '<li>Ghi nhận ban đầu<div class="when">' + esc(C.staffName(a.updatedBy || 'NV-001')) + ' · ' + F.date(a.since) + '</div></li></ul>' : ''),
      foot: (a ? TH.permBtn('master.edit', '<button type="button" class="btn btn-danger" data-act="asset.remove" data-id="' + a.id + '">' + I('trash', 'ic-sm') + 'Xóa</button>', '') : '') + '<span class="spacer"></span><button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="asset.save" data-id="' + (id || '') + '" data-b="' + (bId || '') + '" data-group="' + group + '">' + I('check', 'ic-sm') + 'Lưu thay đổi</button>' };
  }
  TH.act['asset.add'] = function (el) { var b = el.dataset.b, g = el.dataset.group; TH.store.clearDraft('asset-new'); TH.modal.open({ key: 'asset', size: 'md', render: function () { return assetForm(null, b, g); } }); };
  TH.act['asset.edit'] = function (el) { var id = el.dataset.id; TH.store.clearDraft('asset-' + id); TH.modal.open({ key: 'asset', size: 'md', render: function () { return assetForm(id); } }); };
  TH.act['asset.save'] = function (el) {
    var id = el.dataset.id, a = id ? TH.db.assets.find(function (x) { return x.id === id; }) : null, form = 'asset-' + (id || 'new');
    var g = function (k, d) { return TH.store.draft(form, k, d); };
    var grp = g('group', a ? a.group : el.dataset.group);
    var rec = { group: grp, name: (g('name', a ? a.name : '') || '').trim(), qty: digits(g('qty', a ? a.qty : 1)) || 1, unit: g('unit', a ? a.unit : 'cái'), location: g('location', a ? a.location : ''), condition: g('condition', a ? a.condition : 'Tốt'), since: g('since', a ? a.since : TH.TODAY), payer: g('payer', a ? a.payer : (grp === 'invest' ? 'Công ty vận hành' : 'Chủ nhà')), source: g('source', a ? a.source : ''), note: g('note', a ? a.note : ''), updatedBy: TH.me().id };
    if (rec.group === 'invest') { rec.value = digits(g('value', a ? a.value : 0)) || null; rec.purchaseDate = g('purchaseDate', a ? a.purchaseDate || a.since : TH.TODAY); rec.lifeMonths = digits(g('lifeMonths', a ? a.lifeMonths : '')) || null; }
    var moved = a && rec.location !== a.location ? 'di chuyển ' + (a.location || '—') + ' → ' + rec.location : '';
    if (!rec.name) { TH.toast('Thiếu tên tài sản', 'Nhập tên tài sản trước khi lưu.', 'danger'); return; }
    var bId = a ? a.buildingId : el.dataset.b;
    if (a) Object.assign(a, rec);
    else { a = Object.assign({ id: 'TS-' + bId.slice(3) + '-' + String(TH.db.assets.filter(function (x) { return x.buildingId === bId; }).length + 1).padStart(2, '0'), buildingId: bId }, rec); TH.db.assets.push(a); }
    TH.log(id ? 'Sửa tài sản' : 'Thêm tài sản', a.id, a.name + ' · ' + (a.group === 'invest' ? 'đầu tư thêm' : 'chủ nhà') + (moved ? ' · ' + moved : ''), 'building', bId);
    TH.store.clearDraft(form); TH.modal.close('asset', { silent: true }); TH.app.refresh(); TH.toast('Đã lưu tài sản', esc(a.name));
  };
  TH.act['asset.remove'] = function (el) {
    var a = TH.db.assets.find(function (x) { return x.id === el.dataset.id; });
    TH.confirm({ title: 'Xóa tài sản ' + esc(a.name) + '?', body: '<p>Dòng tài sản bị xóa khỏi danh sách; thao tác được ghi audit.</p>', ok: 'Xóa', danger: true }).then(function (ok) {
      if (!ok) return;
      TH.db.assets = TH.db.assets.filter(function (x) { return x !== a; });
      TH.log('Thanh lý / xóa tài sản', a.id, a.name, 'building', a.buildingId);
      TH.modal.close('asset', { silent: true }); TH.app.refresh(); TH.toast('Đã xóa tài sản', esc(a.name));
    });
  };

  /* ---------------- Tab: Vận hành & kết quả ---------------- */
  function opsTab(b) {
    var p = TH.store.state.period, r = C.perfBuilding(p, b.id), t = TH.perfTier(r);
    var v = C.pnl(p, b.id, 'tong');
    var ps = TH.PERIODS.slice(-6);
    var kpis = '<div class="grid-4" style="margin-bottom:16px">' +
      TH.kpi({ label: TH.hsName() + ' thực tế', icon: 'target', value: r.invoices ? (r.closed ? F.pct(t.hs, 1) : 'Chờ mốc 15') : '—', accent: true, foot: r.invoices ? 'Sau 3 mốc 5/10/15 · kỳ ' + F.period(p) + (r.closed && !TH.periodLocked(p) ? ' · chưa khóa kỳ' : '') : 'Kỳ chưa lập hóa đơn' }) +
      TH.kpi({ label: TH.hsName() + ' tạm tính', icon: 'clock', value: r.invoices ? F.pct(t.hsProv, 1) : '—', foot: TH.perfProvLabel() }) +
      TH.kpi({ label: 'Tỷ lệ lấp đầy', icon: 'door', value: F.pct(r.occ, 0), foot: r.occupied + '/' + r.rentable + ' phòng cho thuê được · KPI riêng' }) +
      TH.kpi({ label: 'Lợi nhuận ròng (LNR)', icon: 'pie', value: F.short(v.lnr), neg: v.lnr < 0, href: TH.router.href('RPT-04'), foot: 'Theo mẫu G1 · ' + TH.openBadge('', 'định nghĩa chờ chốt') }) + '</div>';
    var steps = '<div class="card">' + TH.cardHd(I('calculator', 'ic-sm') + 'Cách tính hiệu suất kỳ ' + F.period(p), 'Doanh thu tiền phòng quy đổi ÷ tổng giá niêm yết', TH.openBadge('D-04')) + '<div class="card-bd">' + (r.invoices ? TH.perfSteps(r) : TH.state('empty', { title: 'Kỳ chưa có hóa đơn đã xác nhận', text: 'Hiệu suất tính khi kỳ có hóa đơn và phiếu thu đã xác nhận.' })) + '</div></div>';
    var kd = C.pnl(p, b.id, 'kd');
    var profit = '<div class="card">' + TH.cardHd(I('pie', 'ic-sm') + 'Lợi nhuận kỳ ' + F.period(p), 'Hai chế độ tách rời (G-04 · đề xuất): kinh doanh (P&L) và theo mẫu quản trị G1', '<a class="btn btn-sm" href="' + TH.router.href('RPT-04') + '">' + I('external', 'ic-sm') + 'Mở báo cáo</a>') + '<div class="card-bd">' +
      '<div class="table-wrap"><table class="table table-compact"><thead><tr><th>Chỉ tiêu</th><th class="num">Kinh doanh</th><th class="num">Theo mẫu</th></tr></thead><tbody>' +
      [['Doanh thu', 'total'], ['Giá vốn (GV)', 'gv'], ['Lợi nhuận gộp (LNG)', 'lng'], ['CPBH / CPVH', 'cpbh'], ['Lợi nhuận ròng (LNR)', 'lnr']].map(function (x) { return '<tr><td class="nw">' + x[0] + '</td><td class="num tnum' + (x[1] === 'lnr' && kd.lnr < 0 ? ' neg' : '') + '">' + (x[1] === 'lnr' || x[1] === 'lng' ? '<b>' + F.money(kd[x[1]]) + '</b>' : F.money(kd[x[1]])) + '</td><td class="num tnum">' + F.money(v[x[1]]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      (kd.accrued ? '<div class="small muted" style="margin-top:6px">Kinh doanh gồm tiền thuê nhà <b>dự kiến</b> ' + F.money(kd.accrued) + ' theo HĐ (phiếu chi chưa duyệt — R-07).</div>' : '') +
      (v.pendingRent || v.unbilled ? '<div class="alert alert-warning" style="margin-top:10px">' + I('alert', 'ic-sm') + '<div class="alert-body">' + (v.unbilled ? 'Kỳ chưa lập hóa đơn. ' : '') + (v.pendingRent ? 'Tiền thuê nhà ' + F.money(v.pendingRent) + ' chờ duyệt chi — chế độ theo mẫu chưa tính vào giá vốn.' : '') + '</div></div>' : '') +
      '<p class="small muted" style="margin-top:8px">Kinh doanh: loại cọc mới/hoàn cọc/mua sắm, tiền thuê chủ nhà theo tháng sử dụng. Theo mẫu: tái hiện G1 (gồm dòng tiền cọc, chỉ chi đã duyệt). Định nghĩa chính thức chờ duyệt (G-04, R-01…R-07).</p></div></div>';
    var hist = TH.gate('F004.D', '<div class="card card-flush">' + TH.cardHd(I('history', 'ic-sm') + 'Theo kỳ' + TH.up('F004.D'), 'Snapshot 6 kỳ gần nhất: hiệu suất, lấp đầy, lợi nhuận') + TH.table({ compact: true, cols: [
      { key: 'p', label: 'Kỳ', render: function (x) { return 'Kỳ ' + F.period(x.p) + (TH.periodLocked(x.p) ? ' ' + I('lock', 'ic-sm') : ''); } },
      { key: 'h', label: TH.hsName() + ' thực tế', num: true, render: function (x) { return x.r.invoices ? TH.hsCell(x.t.hs) : '<span class="muted small">chưa lập HĐơn</span>'; } },
      { key: 'hp', label: TH.hsName() + ' tạm tính', num: true, render: function (x) { return x.r.invoices ? TH.hsCell(x.t.hsProv, true) : '—'; } },
      { key: 'o', label: 'Lấp đầy', num: true, render: function (x) { return F.pct(x.r.occ, 0); } },
      { key: 'l', label: 'LNR', num: true, render: function (x) { return '<span class="' + (x.v.lnr < 0 ? 'neg' : '') + '">' + F.money(x.v.lnr) + '</span>'; } },
    ], rows: ps.slice().reverse().map(function (x) { var rr = C.perfBuilding(x, b.id); return { p: x, r: rr, t: TH.perfTier(rr), v: C.pnl(x, b.id, 'tong') }; }) }) + '</div>', { label: 'Snapshot dữ liệu tòa theo kỳ báo cáo', lines: 4 });
    return kpis + '<div class="grid-main-side" style="margin-bottom:16px">' + steps + '<div class="stack">' + TH.section('bldOps', b.id) + profit + '</div></div>' + hist;
  }

  /* ---------------- Tab: Lịch thanh toán cho chủ nhà (F036) ---------------- */
  function payState(x) {
    var left = x.amount - x.paid;
    if (left <= 0) return { k: 'paid', b: TH.badge('Đã trả', 'success', { dot: true }) };
    if (x.dueAt < TH.TODAY) return { k: 'overdue', b: TH.badge(x.paid ? 'Quá hạn · trả một phần' : 'Quá hạn', 'danger', { dot: true }) };
    if (C.daysTo(x.dueAt) <= 15) return { k: 'soon', b: TH.badge('Sắp đến hạn', 'warning', { dot: true }) };
    return { k: 'future', b: TH.badge(x.paid ? 'Trả trước một phần' : 'Chưa đến hạn', 'neutral', { dot: true }) };
  }
  TH.landlordPayState = payState;
  function payTab(b) {
    var l = TH.leaseOf(b.id), rows = TH.db.landlordPays.filter(function (x) { return x.buildingId === b.id; }).sort(function (a, c) { return a.from < c.from ? 1 : -1; });
    var owed = C.sum(rows.filter(function (x) { return x.dueAt <= TH.TODAY; }), function (x) { return x.amount - x.paid; });
    var trackPaid = TH.has('F036.C');
    var next = rows.filter(function (x) { return trackPaid ? x.amount > x.paid : x.dueAt >= TH.TODAY; }).sort(function (a, c) { return a.dueAt < c.dueAt ? -1 : 1; })[0];
    var expRent = function (x) { var ms = []; for (var m = x.from; m <= x.to; m = TH.addMonthsYm(m, 1)) ms.push(m); return C.sum(TH.db.expenses.filter(function (e) { return e.buildingId === b.id && e.category === 'owner_rent' && ms.indexOf(e.period) > -1; }), function (e) { return e.amount; }); };
    var head = '<div class="grid-3" style="margin-bottom:16px">' +
      TH.kpi({ label: 'Mỗi kỳ phải trả', icon: 'calendar', value: l ? F.short(l.rent * l.payCycle) : '—', foot: l ? (l.payCycle === 1 ? 'Hằng tháng' : String(l.payCycle).padStart(2, '0') + ' tháng/lần') + ' · ngày 01–' + String(l.payTo).padStart(2, '0') + ' tháng đầu kỳ' : 'Chưa có HĐ thuê' }) +
      TH.gate('F036.C', TH.kpi({ label: 'Còn phải trả đến hôm nay', icon: 'wallet', value: F.short(owed), neg: owed > 0, foot: owed > 0 ? 'Có kỳ quá hạn' : 'Không có khoản quá hạn' }), { label: 'Tách phải trả/chưa trả', lines: 2 }) +
      TH.kpi({ label: 'Kỳ đến hạn gần nhất', icon: 'clock', value: next ? F.date(next.dueAt) : '—', foot: next ? F.period(next.from) + ' → ' + F.period(next.to) + ' · ' + F.money(trackPaid ? next.amount - next.paid : next.amount) : (trackPaid ? 'Đã trả hết các kỳ' : 'Chưa có kỳ sắp tới — thêm kỳ trả') }) + '</div>';
    var table = '<div class="card card-flush">' + TH.cardHd(I('calendar', 'ic-sm') + 'Lịch thanh toán cho chủ nhà', (l ? 'Theo ' + esc(l.id) + ' · ' + esc(C.owner(l.ownerId).name) + ' · ' + F.date(l.start) + ' → ' + F.date(l.end) + (l.file ? ' · bản HĐ ' + esc(l.file) : '') + ((l.appendices || []).length ? ' · ' + l.appendices.length + ' phụ lục' : '') : 'Chưa có HĐ thuê tòa'),
        TH.permBtn('lease.edit', '<button type="button" class="btn btn-sm" data-act="lpay.add" data-b="' + b.id + '">' + I('plus', 'ic-sm') + 'Thêm kỳ trả</button>', '403') +
        TH.gate('F036.B', TH.permBtn('lease.edit', '<button type="button" class="btn btn-sm btn-soft" data-act="lpay.gen" data-b="' + b.id + '">' + I('wand', 'ic-sm') + 'Sinh lịch từ HĐ' + TH.up('F036.B') + '</button>', '403'), { mode: 'btn', label: 'Tự sinh lịch phải trả từ điều khoản thuê tòa', size: 'btn-sm' })) +
      TH.table({ compact: true, label: 'Lịch thanh toán cho chủ nhà', cols: [
        { key: 'k', label: 'Kỳ thanh toán', render: function (x) { return '<b>' + F.period(x.from) + ' → ' + F.period(x.to) + '</b><div class="cell-sub mono">' + esc(x.id) + (x.source === 'auto' ? ' · tự sinh' : '') + '</div>'; } },
        { key: 'd', label: 'Hạn trả', render: function (x) { return F.date(x.dueAt); } },
        { key: 'a', label: 'Phải trả', num: true, render: function (x) { return F.money(x.amount); } },
        { key: 'p', label: 'Đã trả', num: true, gate: 'F036.C', render: function (x) { return x.paid ? F.money(x.paid) + '<div class="cell-sub">' + F.date(x.paidAt) + (x.docNo ? ' · ' + esc(x.docNo) : '') + '</div>' : '<span class="muted">0</span>'; } },
        { key: 'r', label: 'Còn lại', num: true, gate: 'F036.C', render: function (x) { var r = x.amount - x.paid; return r > 0 ? '<b class="' + (x.dueAt < TH.TODAY ? 'neg' : '') + '">' + F.money(r) + '</b>' : '<span class="muted">0</span>'; } },
        { key: 's', label: 'Trạng thái', gate: 'F036.C', render: function (x) { return payState(x).b; } },
        { key: 'ap', label: 'Duyệt chi', gate: 'F036.C', render: function (x) { return x.approval === 'approved' ? TH.badge('Đã duyệt', 'success') : x.approval === 'pending' ? TH.badge('Chờ duyệt', 'warning') : '<span class="muted small">—</span>'; } },
        { key: 'e', label: 'Chi phí đã ghi', num: true, gate: 'F036.D', render: function (x) { var e = expRent(x); return F.money(e) + '<div class="cell-sub">' + (e === x.amount ? TH.badge('Khớp', 'success') : TH.badge('Lệch ' + F.short(x.amount - e), 'warning')) + '</div>'; } },
        { key: 'n', label: 'Ghi chú / chứng từ', render: function (x) { return '<span class="small">' + esc(x.note || '') + '</span>'; } },
        { key: 'x', label: '', render: function (x) { return x.amount > x.paid ? TH.gate('F036.C', TH.permBtn('lease.edit', '<button type="button" class="btn btn-sm" data-act="lpay.pay" data-id="' + x.id + '">' + I('check', 'ic-sm') + 'Ghi nhận trả</button>', ''), { mode: 'btn', label: 'Ghi nhận đã trả', size: 'btn-sm' }) : ''; } },
      ], rows: rows, empty: { title: 'Chưa có lịch thanh toán', text: 'Thêm kỳ trả thủ công' + (TH.has('F036.B') ? ' hoặc sinh lịch từ hợp đồng.' : '.') } }) +
      '<div class="card-ft"><span class="small muted">' + I('info', 'ic-sm') + ' Căn cứ điều khoản thanh toán trong HĐ thuê tòa' + (l ? ' (tòa này: ' + (l.payCycle === 1 ? 'hằng tháng' : String(l.payCycle).padStart(2, '0') + ' tháng/lần') + ', ngày 01–' + String(l.payTo).padStart(2, '0') + ' tháng đầu kỳ)' : '') + '. Lịch lấy từ HĐ & phụ lục có hiệu lực, không dùng một chu kỳ chung cho mọi tòa (G-10).</span></div></div>';
    var recon = TH.gate('F036.D', '<div class="card" style="margin-top:16px">' + TH.cardHd(I('compare', 'ic-sm') + 'Đối chiếu phải trả ↔ chi phí' + TH.up('F036.D'), 'Lịch trả theo HĐ so với chi phí “Tiền thuê trả chủ nhà” đã ghi theo tháng') + '<div class="card-bd small">Cột “Chi phí đã ghi” cộng chi phí từng tháng trong kỳ trả; lệch khi tháng chưa ghi hoặc chi phí chờ duyệt. Cost center: tòa ' + esc(b.short) + '.</div></div>', { label: 'Đối chiếu payable + cost center', lines: 2 });
    /* G-10 (đề xuất): nhắc nội bộ trước hạn 7 ngày, 3 ngày, ngày đến hạn và khi quá hạn — bật/tắt được */
    var rc = TH.db.landlordReminder || {}, open = rows.filter(function (x) { return x.amount > x.paid; });
    var remList = [];
    open.forEach(function (x) {
      var d = C.daysTo(x.dueAt);
      if (d < 0 && rc.overdue) remList.push([x, 'Quá hạn ' + (-d) + ' ngày', 'danger']);
      else if (d === 0 && rc.due) remList.push([x, 'Đến hạn hôm nay', 'warning']);
      else if (d > 0 && d <= 3 && rc.before3) remList.push([x, 'Còn ' + d + ' ngày (mốc 3 ngày)', 'warning']);
      else if (d > 3 && d <= 7 && rc.before7) remList.push([x, 'Còn ' + d + ' ngày (mốc 7 ngày)', 'info']);
    });
    var tg = function (k, lbl) { return '<label class="switch" style="margin-right:12px"><input type="checkbox" data-act-change="lrem.toggle" data-key="' + k + '"' + (rc[k] ? ' checked' : '') + (TH.can('lease.edit') ? '' : ' disabled') + '><span class="switch-track"></span><span class="small">' + lbl + '</span></label>'; };
    var remind = TH.gate('F036.B', '<div class="card" style="margin-top:16px">' + TH.cardHd(I('bell', 'ic-sm') + 'Nhắc lịch trả chủ nhà' + TH.up('F036.B'), esc(rc.channel || 'Thông báo nội bộ') + ' · ' + TH.openBadge('', 'PROPOSED')) + '<div class="card-bd stack-sm"><div class="row" style="flex-wrap:wrap;gap:8px">' + tg('before7', 'Trước 7 ngày') + tg('before3', 'Trước 3 ngày') + tg('due', 'Ngày đến hạn') + tg('overdue', 'Khi quá hạn') + '</div>' +
      (remList.length ? '<ul class="timeline">' + remList.map(function (r) { return '<li>' + TH.badge(r[1], r[2]) + ' <b>' + F.period(r[0].from) + ' → ' + F.period(r[0].to) + '</b> · hạn ' + F.date(r[0].dueAt) + (TH.has('F036.C') ? ' · còn ' + F.money(r[0].amount - r[0].paid) : '') + '</li>'; }).join('') + '</ul>' : '<div class="small muted">Không có nhắc lịch đang kích hoạt.</div>') +
      '<div class="small muted">Mô phỏng — không gửi thật. Áp dụng cho mọi tòa; kênh gửi chờ chốt.</div></div></div>', { label: 'Nhắc lịch trả chủ nhà (tự động hóa)', lines: 3 });
    return head + table + remind + recon;
  }
  TH.onChange['lrem.toggle'] = function (el) {
    TH.db.landlordReminder = TH.db.landlordReminder || {};
    TH.db.landlordReminder[el.dataset.key] = el.checked;
    TH.log('Cấu hình nhắc lịch trả chủ nhà', 'NHAC-LICH', el.dataset.key + ' = ' + (el.checked ? 'bật' : 'tắt'), 'expense');
    TH.store.persist(); TH.app.refresh();
  };
  function lpayForm(bId) {
    var form = 'lpay-' + bId, l = TH.leaseOf(bId), last = TH.db.landlordPays.filter(function (x) { return x.buildingId === bId; }).sort(function (a, c) { return a.to < c.to ? 1 : -1; })[0];
    var from = last ? TH.addMonthsYm(last.to, 1) : TH.store.state.period, cyc = l ? l.payCycle : 3;
    return { title: 'Thêm kỳ trả · ' + esc(TH.buildingName(bId)), sub: 'F036.A · nhập tay kỳ thanh toán cho chủ nhà',
      body: '<div class="form-grid">' + TH.field({ form: form, name: 'from', label: 'Từ tháng', type: 'month', def: from }) + TH.field({ form: form, name: 'to', label: 'Đến tháng', type: 'month', def: TH.addMonthsYm(from, cyc - 1) }) +
        TH.field({ form: form, name: 'dueAt', label: 'Hạn trả', type: 'date', def: from + '-' + String(l ? l.payTo : 10).padStart(2, '0') }) + TH.field({ form: form, name: 'amount', label: 'Số tiền phải trả (đ)', def: l ? l.rent * cyc : '', num: true, inputmode: 'numeric' }) +
        TH.field({ form: form, name: 'note', label: 'Ghi chú', def: '', span: true }) + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="lpay.save" data-b="' + bId + '">' + I('check', 'ic-sm') + 'Lưu thay đổi</button>' };
  }
  TH.act['lpay.add'] = function (el) { var b = el.dataset.b; TH.store.clearDraft('lpay-' + b); TH.modal.open({ key: 'lpay', size: 'md', render: function () { return lpayForm(b); } }); };
  TH.act['lpay.save'] = function (el) {
    var bId = el.dataset.b, form = 'lpay-' + bId, l = TH.leaseOf(bId);
    var last = TH.db.landlordPays.filter(function (x) { return x.buildingId === bId; }).sort(function (a, c) { return a.to < c.to ? 1 : -1; })[0];
    var defFrom = last ? TH.addMonthsYm(last.to, 1) : TH.store.state.period, cyc = l ? l.payCycle : 3;
    var g = function (k, d) { return TH.store.draft(form, k, d); };
    var from = g('from', defFrom), to = g('to', TH.addMonthsYm(defFrom, cyc - 1)), amount = digits(g('amount', l ? l.rent * cyc : 0));
    if (!amount || to < from) { TH.toast('Kiểm tra lại', 'Số tiền phải > 0 và “đến tháng” không trước “từ tháng”.', 'danger'); return; }
    if (TH.db.landlordPays.some(function (x) { return x.buildingId === bId && !(x.to < from || x.from > to); })) { TH.toast('Trùng kỳ trả', 'Khoảng tháng này đã có trong lịch.', 'danger'); return; }
    TH.db.landlordPays.push({ id: 'LT-' + bId.slice(3) + '-' + from.slice(2, 4) + from.slice(5), leaseId: l ? l.id : null, buildingId: bId, ownerId: C.building(bId).ownerId, from: from, to: to, dueAt: g('dueAt', from + '-10'), amount: amount, paid: 0, paidAt: null, docNo: '', note: g('note', ''), source: 'manual', approval: 'none' });
    TH.log('Thêm kỳ trả chủ nhà', bId, F.period(from) + ' → ' + F.period(to), 'expense', bId);
    TH.store.clearDraft(form); TH.modal.close('lpay', { silent: true }); TH.app.refresh(); TH.toast('Đã thêm kỳ trả', F.period(from) + ' → ' + F.period(to) + ' · ' + F.money(amount));
  };
  TH.act['lpay.gen'] = function (el) {
    var bId = el.dataset.b, l = TH.leaseOf(bId);
    if (!l) { TH.toast('Chưa có hợp đồng thuê', 'Cần HĐ thuê tòa còn hiệu lực để sinh lịch.', 'danger'); return; }
    var horizon = TH.addMonthsYm(TH.TODAY.slice(0, 7), 12), added = [];
    var last = TH.db.landlordPays.filter(function (x) { return x.buildingId === bId; }).sort(function (a, c) { return a.to < c.to ? 1 : -1; })[0];
    var m = last ? TH.addMonthsYm(last.to, 1) : l.start.slice(0, 7);
    while (m <= horizon && m <= l.end.slice(0, 7)) {
      var to = TH.addMonthsYm(m, l.payCycle - 1);
      TH.db.landlordPays.push({ id: 'LT-' + bId.slice(3) + '-' + m.slice(2, 4) + m.slice(5), leaseId: l.id, buildingId: bId, ownerId: l.ownerId, from: m, to: to, dueAt: m + '-' + String(l.payTo).padStart(2, '0'), amount: l.rent * l.payCycle, paid: 0, paidAt: null, docNo: '', note: '', source: 'auto', approval: 'none' });
      added.push(m); m = TH.addMonthsYm(to, 1);
    }
    TH.log('Sinh lịch trả chủ nhà từ HĐ', bId, added.length + ' kỳ · ' + l.id, 'expense', bId);
    TH.app.refresh();
    TH.toast(added.length ? 'Đã sinh ' + added.length + ' kỳ trả' : 'Lịch đã đủ', added.length ? 'Theo ' + esc(l.id) + ': ' + l.payCycle + ' tháng/lần, hạn ngày ' + l.payTo + ' tháng đầu kỳ, ' + F.money(l.rent * l.payCycle) + '/kỳ' : 'Đã có lịch đến ' + F.period(horizon) + '.', added.length ? 'success' : 'info');
  };
  TH.act['lpay.pay'] = function (el) {
    var x = TH.db.landlordPays.find(function (p) { return p.id === el.dataset.id; }), form = 'lpay-pay-' + x.id;
    TH.store.clearDraft(form);
    TH.modal.open({ key: 'lpay-pay', size: 'sm', render: function () {
      return { title: 'Ghi nhận đã trả · ' + esc(x.id), sub: 'F036.C · kỳ ' + F.period(x.from) + ' → ' + F.period(x.to) + ' · còn ' + F.money(x.amount - x.paid),
        body: '<div class="stack">' + TH.field({ form: form, name: 'amount', label: 'Số tiền trả (đ)', def: x.amount - x.paid, num: true, inputmode: 'numeric' }) + TH.field({ form: form, name: 'date', label: 'Ngày trả', type: 'date', def: TH.TODAY }) + TH.field({ form: form, name: 'doc', label: 'Số chứng từ (UNC/phiếu chi)', def: 'UNC-' + x.buildingId.slice(3) + '-' + TH.TODAY.slice(5).replace('-', '') }) + '</div>',
        foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="lpay.paySave" data-id="' + x.id + '">' + I('check', 'ic-sm') + 'Lưu thay đổi</button>' };
    } });
  };
  TH.act['lpay.paySave'] = function (el) {
    var x = TH.db.landlordPays.find(function (p) { return p.id === el.dataset.id; }), form = 'lpay-pay-' + x.id;
    var a = digits(TH.store.draft(form, 'amount', x.amount - x.paid));
    if (a <= 0 || a > x.amount - x.paid) { TH.toast('Số tiền không hợp lệ', 'Từ 1 đến ' + F.money(x.amount - x.paid) + '.', 'danger'); return; }
    x.paid += a; x.approval = 'approved'; x.paidAt = TH.store.draft(form, 'date', TH.TODAY); x.docNo = TH.store.draft(form, 'doc', 'UNC-' + x.buildingId.slice(3) + '-' + TH.TODAY.slice(5).replace('-', ''));
    TH.log('Ghi nhận trả chủ nhà', x.buildingId, x.id + ' · ' + F.money(a), 'expense', x.buildingId);
    TH.store.clearDraft(form); TH.modal.close('lpay-pay', { silent: true }); TH.app.refresh(); TH.toast('Đã ghi nhận', F.money(a) + ' · còn ' + F.money(x.amount - x.paid));
  };

  /* ---------------- BLD-02 · chi tiết theo tab ---------------- */
  var TABS = ['info', 'owner', 'staff', 'rooms', 'assets', 'docs', 'ops', 'pay'];
  TH.views['BLD-02'] = {
    scanParam: 'TH-CG',
    scan: function () { return TABS.map(function (t) { return { ui: { tab: t }, param: 'TH-CG' }; }); },
    render: function (r) {
      var b = C.building(r.param || 'TH-CG');
      if (!b) return TH.pageHeader({ screen: 'BLD-02' }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy tòa' }) + '</div>';
      if (!TH.inScope(b.id)) return TH.pageHeader({ screen: 'BLD-02', title: b.name }) + '<div class="card">' + TH.state('forbidden', { text: 'Tòa ngoài phạm vi được cấp cho vai trò hiện tại.' }) + '</div>';
      var S = 'BLD-02', rooms = roomsOf(b.id), occ = rooms.filter(function (x) { return x.status === 'occupied'; }).length;
      var lease = TH.leaseOf(b.id), docs = docsOf(b.id);
      var payAlert = TH.has('F036.C') && TH.db.landlordPays.some(function (x) { return x.buildingId === b.id && x.amount > x.paid && x.dueAt < TH.TODAY; });
      var tabs = [
        { id: 'info', label: 'Thông tin chung', icon: 'building' },
        { id: 'owner', label: 'Chủ nhà & hợp đồng thuê tòa', icon: 'contract' },
        { id: 'staff', label: 'Nhân sự', icon: 'users', count: TH.db.assignments.filter(function (a) { return a.buildingId === b.id && !a.to; }).length },
        { id: 'rooms', label: 'Phòng', icon: 'door', count: rooms.length },
        { id: 'assets', label: 'Tài sản', icon: 'layers', count: TH.db.assets.filter(function (a) { return a.buildingId === b.id; }).length },
        { id: 'docs', label: 'Hồ sơ & minh chứng', icon: 'shieldCheck' },
        { id: 'ops', label: 'Vận hành & kết quả', icon: 'activity' },
        { id: 'pay', label: 'Thanh toán chủ nhà', icon: 'calendar' },
      ];
      var tab = TH.resolveTab(S, tabs);
      var body;
      if (tab === 'info') {
        body = '<div class="grid-main-side">' + TH.section('bldInfo', b.id) + '<div class="stack">' +
          TH.gate('F004.B', '<div class="grid-2">' + TH.kpi({ label: 'Số phòng', value: String(rooms.length), foot: 'Tổng hợp từ dữ liệu phòng ' + TH.up('F004.B') }) + TH.kpi({ label: 'Công suất', value: F.pct(occ / rooms.length, 0), foot: occ + ' đang thuê' }) + '</div>', { label: 'Tổng hợp số phòng/công suất', lines: 2 }) +
          '<div class="card">' + TH.cardHd('Tóm tắt', null) + '<div class="card-bd">' + TH.kv([['Chủ nhà', '<a href="' + TH.router.href('OWN-02', b.ownerId) + '">' + esc(C.owner(b.ownerId).name) + '</a>'], ['Giá thuê tòa', F.money(b.ownerRent) + '/tháng'], ['NV vận hành chính', esc(C.staffName(b.managerId))], ['Vận hành', opStatus(b) + ' <span class="small muted">từ ' + F.date(b.opFrom || b.openedAt) + '</span>'], ['PCCC', TH.badge(TH.DOC_STATES[b.fire.status][0], TH.DOC_STATES[b.fire.status][1])], ['ĐKKD', TH.badge(TH.DOC_STATES[b.bizReg.status][0], TH.DOC_STATES[b.bizReg.status][1])]]) + '</div></div></div></div>';
      } else if (tab === 'owner') {
        var o = C.owner(b.ownerId);
        body = '<div class="grid-main-side"><div class="stack">' + (lease ? TH.leaseBlock(lease) : '<div class="card">' + TH.state('empty', { title: 'Chưa có hợp đồng thuê tòa' }) + '</div>') + '</div><div class="stack">' +
          '<div class="card">' + TH.cardHd(I('owner', 'ic-sm') + 'Chủ nhà', null, '<a class="btn btn-sm" href="' + TH.router.href('OWN-02', o.id) + '">Mở hồ sơ' + I('chevronRight', 'ic-sm') + '</a>') + '<div class="card-bd">' + TH.kv([['Họ tên', '<b>' + esc(o.name) + '</b>'], ['Điện thoại', esc(o.phone)], ['CCCD', '<span class="mono">' + esc(o.idNo || '—') + '</span>'], ['Tài khoản nhận tiền', o.bank && o.bank.no ? '<span class="mono">' + esc(o.bank.no) + '</span> · ' + esc(o.bank.name) : '—']]) + '<p class="small muted" style="margin-top:8px">Sửa thông tin chủ nhà tại hồ sơ chủ nhà; hợp đồng bên trái dùng chung bản ghi với tab “Hợp đồng thuê” của chủ nhà.</p></div></div>' +
          TH.gate('F003.B', '<div class="card"><div class="card-hd"><div class="card-title">Lịch sử chủ nhà ' + TH.up('F003.B') + '</div></div><div class="card-bd"><ul class="timeline">' + TH.db.ownerLinks.filter(function (l) { return l.buildingId === b.id; }).slice().reverse().map(function (l) { return '<li><b>' + esc(C.owner(l.ownerId).name) + '</b> · ' + esc(l.role) + '<div class="when">' + F.date(l.from) + ' → ' + (l.to ? F.date(l.to) : 'nay') + '</div></li>'; }).join('') + '</ul></div></div>', { label: 'Lịch sử chủ nhà của tòa', lines: 3 }) + '</div></div>';
      } else if (tab === 'staff') {
        body = staffTab(b);
      } else if (tab === 'rooms') {
        body = '<div class="card card-flush">' + TH.table({ cols: [
          { key: 'c', label: 'Phòng', render: function (x) { return TH.roomLink(x.id); } }, { key: 'f', label: 'Tầng', num: true, render: function (x) { return x.floor; } }, { key: 'a', label: 'Diện tích', num: true, render: function (x) { return x.area + ' m²'; } },
          { key: 'p', label: 'Giá niêm yết', num: true, render: function (x) { return F.money(x.rent); } }, { key: 's', label: 'Trạng thái', render: function (x) { return TH.status(x.status); } },
          { key: 'k', label: 'Khách', render: function (x) { var c = C.contractOfRoom(x.id); return c ? esc(C.customer(c.customerId).name) : '<span class="muted">—</span>'; } },
        ], rows: rooms, rowAttrs: function (x) { return 'class="is-clickable" data-href="' + TH.router.href('ROOM-02', x.id) + '"'; }, foot: { _label: '<b>' + rooms.length + ' phòng</b>', p: '<b>' + F.money(C.sum(rooms, function (x) { return x.rent; })) + '</b>' } }) + '<div class="card-ft"><span class="small muted">Tổng giá niêm yết là mẫu số tính hiệu suất (tab Vận hành & kết quả).</span></div></div>';
      } else if (tab === 'assets') {
        body = '<div class="stack">' + assetTable(b, 'owner') + assetTable(b, 'invest') + '</div><p class="small muted" style="margin-top:12px">' + I('info', 'ic-sm') + ' Trường theo đề xuất G-09 (PROPOSED): mã, tên, nhóm, vị trí, số lượng, đơn vị, tình trạng, ngày ghi nhận, bên sở hữu/chịu chi, nguồn chứng từ, người cập nhật; tài sản đầu tư thêm có ngày mua, nguyên giá, thời hạn sử dụng. Mở “Sửa” để xem nhật ký.</p>';
      } else if (tab === 'docs') {
        body = '<div class="grid-2" style="margin-bottom:16px">' + TH.section('bldFire', b.id) + TH.section('bldBiz', b.id) + '</div>' +
          '<div class="card" style="margin-bottom:16px">' + TH.cardHd(I('fileScan', 'ic-sm') + 'Sổ đỏ (GCN)', b.gcn ? 'GCN ' + esc(b.gcn.no) + ' · ' + esc(b.gcn.issuer) + ' cấp ' + F.date(b.gcn.date) : 'Chưa nhập số GCN') + '<div class="card-bd">' + TH.redBookGallery(docs) + '</div></div>' +
          TH.docTable(S, docs, { buildingId: b.id, ownerId: b.ownerId, title: 'Tài liệu đính kèm của tòa' });
      } else if (tab === 'ops') {
        body = opsTab(b);
      } else {
        body = payTab(b);
      }
      var alerts = (b.fire.status === 'none' ? '<div class="alert alert-warning" style="margin-bottom:12px">' + I('shieldAlert', 'ic-sm') + '<div class="alert-body"><b>Hồ sơ PCCC chưa cập nhật.</b><span>' + esc(b.fire.note || '') + ' · <a href="#" data-act="ui.set" data-screen="BLD-02" data-key="tab" data-val="docs">Mở Hồ sơ & minh chứng</a></span></div></div>' : '') +
        (payAlert && tab !== 'pay' ? '<div class="alert alert-danger" style="margin-bottom:12px">' + I('alertCircle', 'ic-sm') + '<div class="alert-body"><b>Có kỳ trả chủ nhà quá hạn.</b><span><a href="#" data-act="ui.set" data-screen="BLD-02" data-key="tab" data-val="pay">Xem lịch thanh toán</a></span></div></div>' : '');
      return TH.pageHeader({ screen: 'BLD-02', title: b.name, crumbs: [['Tòa nhà', TH.router.href('BLD-01')], [b.id]], status: opStatus(b),
          actions: '<a class="btn" href="' + TH.router.href('RPT-04') + '" data-act="bld.rpt" data-id="' + b.id + '">' + I('chart', 'ic-sm') + 'Báo cáo tòa</a>' }) +
        alerts + '<div class="card tab-card" style="margin-bottom:16px">' + TH.tabs(S, tabs, tab) + '</div>' + body;
    },
    dialogs: [function () { assignForm('TH-CG'); }, function () { assetForm('TS-CG-01'); }, function () { lpayForm('TH-CG'); }],
  };
  TH.act['bld.rpt'] = function (el) { TH.store.setUi('RPT-04', 'b', el.dataset.id); TH.go('RPT-04'); };

  /* ---------------- BLD-IMP ---------------- */
  var impCfg = {
    screen: 'BLD-IMP', kind: 'building', template: 'mau_toa_nha_TIMEHOUSE.xlsx', sampleFile: 'toa_nha_dot2.xlsx',
    columns: [{ key: 'id', label: 'Mã tòa' }, { key: 'owner', label: 'Mã chủ' }, { key: 'name', label: 'Tên tòa' }, { key: 'address', label: 'Địa chỉ' }],
    inc: { preview: 'F005.B', upsert: 'F005.C', history: 'F005.D' },
    sample: function () {
      var linkCheck = TH.has('F005.B');
      return [
        { line: 2, data: { id: 'TH-HM', owner: 'CN-001', name: 'TimeHouse Hoàng Mai', address: 'Số 7 đường Mẫu Mới, Hoàng Mai' }, errors: [] },
        { line: 3, data: { id: 'TH-LB', owner: 'CN-099', name: 'TimeHouse Long Biên', address: 'Số 2 ngõ Thử Nghiệm, Long Biên' }, errors: [linkCheck ? 'Mã chủ CN-099 không tồn tại (lỗi liên kết)' : 'Chủ nhà không tồn tại'] },
        { line: 4, data: { id: 'TH-CG', owner: 'CN-001', name: 'TimeHouse Cầu Giấy', address: 'Số 18, ngõ 75 đường Minh Họa (cập nhật)' }, errors: [], dup: true },
      ];
    },
    commit: function (rows, policy) {
      var n = 0;
      rows.forEach(function (r) {
        var ex = C.building(r.data.id);
        if (ex) { if (policy === 'update') { ex.address = r.data.address; n++; } return; }
        TH.db.buildings.push(newBuilding({ id: r.data.id, name: r.data.name, short: r.data.name.replace('TimeHouse ', ''), area: 'Hoàng Mai', address: r.data.address, ownerId: r.data.owner, managerId: 'NV-003', floors: 3 }));
        n++;
      });
      return n;
    },
  };
  TH.registerImport(impCfg);
  TH.views['BLD-IMP'] = { modal: { size: 'xl' }, scan: function () { return [{ ui: { step: 'upload' } }, { ui: { step: 'check' } }, { ui: { step: 'done' } }]; }, render: function () { return TH.importFlow(impCfg); } };
})();
