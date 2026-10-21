/* OCR hợp đồng khách thuê theo MẪU ĐẦY ĐỦ (docs/tenplate/Hop_dong_thue_phong_demo_day_du.pdf) — CR-CUS-02 (21/10/2026).
   Dùng chung cho OCR-CON (tạo HĐ mới từ bản scan) và CUS-02 › Hợp đồng (đọc lại cho hồ sơ thuê đã có).
   Giá trị OCR là mô phỏng theo số liệu của mẫu; mọi field/bảng phải được người dùng xác nhận; không tự ghi dữ liệu, không tự lập hóa đơn. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt;
  var C = function () { return TH.calc; };
  var digits = function (v) { return +String(v === null || v === undefined ? '' : v).replace(/\D/g, '') || 0; };
  var fmtNum = function (n) { return String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };

  var GROUPS = { hd: 'Hợp đồng', b: 'Bên B — khách thuê', d1: 'Điều 1 — phòng, số người, số xe', d3: 'Điều 3 — giao nhận & thời hạn', d4: 'Điều 4 — giá, tiền đã nộp, chỉ số, cọc', fee: 'Điều 4.4 — biểu phí dịch vụ', other: 'Điều khoản khác (chỉ lưu để hiển thị)' };
  /* Trường trích xuất theo từng Điều của mẫu đầy đủ. conf < 0,85 = field cần soát kỹ (F011.B / F012.B) */
  var FIELDS = [
    { key: 'code', group: 'hd', label: 'Số hợp đồng', ocr: 'DEMO-TH-2026-001', conf: 0.97 },
    { key: 'signedAt', group: 'hd', label: 'Ngày lập / ký', ocr: '2026-09-17', conf: 0.93 },
    { key: 'customer', group: 'b', label: 'Họ tên đầy đủ', ocr: 'Trần Minh An', conf: 0.94 },
    { key: 'dob', group: 'b', label: 'Ngày sinh', ocr: '1998-06-15', conf: 0.9 },
    { key: 'phone', group: 'b', label: 'Số điện thoại đang dùng', ocr: '0988 ••• 456', conf: 0.92 },
    { key: 'idNo', group: 'b', label: 'Số CCCD (mask)', ocr: '0010•••••001', conf: 0.9 },
    { key: 'idPlace', group: 'b', label: 'Nơi cấp', ocr: 'Cục Cảnh sát QLHC về TTXH', conf: 0.84 },
    { key: 'permAddress', group: 'b', label: 'Hộ khẩu thường trú', ocr: '123 Minh Khai, phường Vĩnh Tuy, Hà Nội', conf: 0.79 },
    { key: 'room', group: 'd1', label: '1.1 Phòng số', ocr: 'CG-401', conf: 0.95 },
    { key: 'people', group: 'd1', label: '1.2 Số người ở', ocr: '2', conf: 0.96, num: true },
    { key: 'peopleMax', group: 'd1', label: '1.2 Số người tối đa', ocr: '2', conf: 0.9, num: true },
    { key: 'vehicles', group: 'd1', label: '1.2 Số xe máy', ocr: '1', conf: 0.94, num: true },
    { key: 'handoverAt', group: 'd3', label: '3.1 Ngày giao nhận phòng', ocr: '2026-11-01', conf: 0.9 },
    { key: 'billingFrom', group: 'd3', label: '3.2 Ngày bắt đầu tính tiền', ocr: '2026-11-01', conf: 0.9 },
    { key: 'termMonths', group: 'd3', label: '3.3 Thời hạn (tháng)', ocr: '12', conf: 0.95, num: true },
    { key: 'start', group: 'd3', label: '3.3 Từ ngày', ocr: '2026-11-01', conf: 0.9 },
    { key: 'end', group: 'd3', label: '3.3 Đến ngày', ocr: '2027-10-31', conf: 0.88 },
    { key: 'autoRenew', group: 'd3', label: '3.4 Gia hạn mặc nhiên', ocr: 'Thêm 12 tháng nếu không báo trước 30 ngày', conf: 0.86 },
    { key: 'rent', group: 'd4', label: '4.1 Giá thuê (đ/tháng)', ocr: '4.500.000', conf: 0.72, num: true },
    { key: 'prepaidBefore', group: 'd4', label: '4.1 Đã thanh toán trước khi ký', ocr: '1.000.000', conf: 0.88, num: true },
    { key: 'prepaidAtSign', group: 'd4', label: '4.1 Đóng thêm khi ký', ocr: '8.000.000', conf: 0.87, num: true },
    { key: 'elecStart', group: 'd4', label: '4.2 Chỉ số điện (kWh)', ocr: '1.250', conf: 0.83, num: true },
    { key: 'waterStart', group: 'd4', label: '4.2 Chỉ số nước (m³)', ocr: '85', conf: 0.87, num: true },
    { key: 'deposit', group: 'd4', label: '4.3 Tiền cọc duy trì HĐ', ocr: '4.500.000', conf: 0.91, num: true },
    { key: 'refundDays', group: 'd4', label: '4.3 Hoàn cọc trong (ngày)', ocr: '10', conf: 0.9, num: true },
    { key: 'transferFee', group: 'd4', label: '4.3 Phí nhượng phòng', ocr: '200.000', conf: 0.85, num: true },
    { key: 'payWindow', group: 'd4', label: '4.4.1 Hạn thanh toán', ocr: 'Từ ngày 25 đến ngày 30 của kỳ trước', conf: 0.9 },
    { key: 'bank', group: 'd4', label: '4.4.2 Tài khoản nhận (mask)', ocr: 'BIDV •••8058', conf: 0.9 },
    { key: 'feeNet', group: 'fee', label: 'Internet (đ/tháng)', ocr: '100.000', conf: 0.93, num: true },
    { key: 'feeElec', group: 'fee', label: 'Điện (đ/số)', ocr: '4.000', conf: 0.95, num: true },
    { key: 'feeWater', group: 'fee', label: 'Nước (đ/người)', ocr: '120.000', conf: 0.88, num: true },
    { key: 'feeEbike', group: 'fee', label: 'Xe đạp điện (đ/xe)', ocr: '150.000', conf: 0.78, num: true },
    { key: 'feeSvc', group: 'fee', label: 'Dịch vụ chung (đ/người)', ocr: '120.000', conf: 0.86, num: true },
    { key: 'feeEv', group: 'fee', label: 'Xe điện dịch vụ SM (đ/xe)', ocr: '400.000', conf: 0.71, num: true },
    { key: 'lateFee', group: 'other', label: '4.4.4 Phạt chậm nộp (đ/ngày)', ocr: '200.000', conf: 0.9, num: true },
    { key: 'lateGrace', group: 'other', label: '4.4.4 Chậm trả tối đa (ngày)', ocr: '3', conf: 0.9, num: true },
    { key: 'warrantyDays', group: 'other', label: '5.2.4 Bảo hành thiết bị (ngày)', ocr: '10', conf: 0.9, num: true },
    { key: 'noticeDays', group: 'other', label: '6.2.11 Báo trước khi chấm dứt (ngày)', ocr: '30', conf: 0.92, num: true },
  ];
  var ASSETS = TH.HANDOVER_ASSETS; // Điều 2.2 — danh mục 30 tài sản bàn giao định nghĩa ở js/data.js (cần có trước khi seed)
  var ASSET_COLS = [{ key: 'name', label: 'Tài sản', readonly: true }, { key: 'qty', label: 'SL', num: true }, { key: 'condition', label: 'Tình trạng' }];

  function fieldByKey(fields, k) { return fields.find(function (f) { return f.key === k; }); }
  function reader(form, fields) { return function (k) { var f = fieldByKey(fields, k); return TH.store.draft(form, k, f ? f.ocr : ''); }; }
  function vals(form, fields) { var o = {}; fields.forEach(function (f) { o[f.key] = TH.store.draft(form, f.key, f.ocr); }); return o; }
  function assetsOf(form) {
    return ASSETS.map(function (a, i) {
      var dk = function (c) { return TH.store.draft(form, 'tbl_assets_' + i + '_' + c, a[c]); };
      return { group: a.group, name: a.name, unit: a.unit, qty: digits(dk('qty')), condition: String(dk('condition') || a.condition) };
    });
  }
  function corrections(form, fields) {
    var n = fields.filter(function (f) { return String(TH.store.draft(form, f.key, f.ocr)) !== String(f.ocr); }).length;
    ASSETS.forEach(function (a, i) { ['qty', 'condition'].forEach(function (c) { if (String(TH.store.draft(form, 'tbl_assets_' + i + '_' + c, a[c])) !== String(a[c])) n++; }); });
    return n;
  }
  function tableCfg() { return { key: 'assets', title: 'Điều 2.2 — Tài sản trong phòng bàn giao (' + ASSETS.length + ' dòng)', columns: ASSET_COLS, rows: ASSETS }; }
  function templates() { return TH.db.ocrTemplates.filter(function (t) { return t.kind === 'contract'; }); }
  function monthsBetween(a, b) { return Math.max(0, Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000 / 30.44)); }

  /* Khi đọc lại cho HĐ đã có: trường định danh/thời hạn lấy từ hồ sơ hiện tại (để thấy "Khác" nếu sửa), biểu phí & điều khoản lấy từ mẫu */
  function fieldsFor(ct) {
    if (!ct) return FIELDS;
    var k = C().customer(ct.customerId) || {}, T = ct.terms || {}, H = ct.handover || {}, P = ct.prepaid || {};
    var moto = (k.vehicles || []).filter(function (v) { return v.type === 'Xe máy' && v.status !== 'ended'; }).length;
    var o = { code: ct.id, signedAt: ct.signedAt, customer: k.name, dob: k.dob, phone: k.phone, idNo: k.idNo, idPlace: k.idPlace, permAddress: k.permAddress, room: ct.roomId, people: String(ct.people), peopleMax: String(T.peopleMax || ct.people), vehicles: String(T.vehiclesDeclared !== undefined && T.vehiclesDeclared !== null ? T.vehiclesDeclared : moto),
      handoverAt: H.at || ct.start, billingFrom: H.billingFrom || ct.start, termMonths: String(monthsBetween(ct.start, TH.addDays(ct.end, 1))), start: ct.start, end: ct.end,
      rent: fmtNum(ct.rent), deposit: fmtNum(ct.deposit), prepaidBefore: P.beforeSign !== undefined ? fmtNum(P.beforeSign) : undefined, prepaidAtSign: P.atSign !== undefined ? fmtNum(P.atSign) : undefined,
      elecStart: H.elecStart !== undefined ? fmtNum(H.elecStart) : undefined, waterStart: H.waterStart !== undefined ? String(H.waterStart) : undefined };
    return FIELDS.map(function (f) { return o[f.key] !== undefined && o[f.key] !== null && o[f.key] !== '' ? Object.assign({}, f, { ocr: String(o[f.key]) }) : f; });
  }

  /* F012.C — so khớp phòng – khách – hợp đồng */
  function checks(v, o) {
    var out = [], room = C().room(v('room')), rent = digits(v('rent')), ct = o.ct;
    if (o.mode === 'new') {
      if (!room) out.push({ level: 'danger', text: 'Phòng “' + esc(v('room')) + '” không tồn tại.' });
      else {
        if (room.status !== 'vacant') out.push({ level: 'danger', text: 'Phòng ' + room.id + ' không trống — có thể xung đột hợp đồng hiện hành.' });
        else out.push({ level: 'ok', text: 'Phòng ' + room.id + ' đang trống, không có HĐ xung đột.' });
        if (rent && rent !== room.rent) out.push({ level: 'warning', text: 'Giá thuê OCR ' + F.money(rent) + ' lệch giá niêm yết ' + F.money(room.rent) + ' (' + (rent > room.rent ? '+' : '') + F.money(rent - room.rent) + ').' });
      }
      var k = TH.db.customers.find(function (x) { return x.name.toLowerCase() === String(v('customer')).toLowerCase(); });
      out.push(k ? { level: 'ok', text: 'Khách khớp hồ sơ ' + k.id + '.' } : { level: 'warning', text: 'Chưa có hồ sơ khách “' + esc(v('customer')) + '” — sẽ tạo khi duyệt hợp đồng (hoặc OCR giấy tờ ở OCR-CUS).' });
      if (TH.db.contracts.some(function (c) { return c.id === v('code'); })) out.push({ level: 'danger', text: 'Mã hợp đồng đã tồn tại.' });
    } else {
      if (!room || room.id !== ct.roomId) out.push({ level: 'danger', text: 'Phòng trong bản scan (' + esc(v('room')) + ') khác phòng của hồ sơ thuê (' + ct.roomId + ').' });
      else out.push({ level: 'ok', text: 'Đúng phòng ' + ct.roomId + ' của hồ sơ thuê.' });
      var kk = C().customer(ct.customerId);
      if (kk && kk.name.toLowerCase() !== String(v('customer')).toLowerCase()) out.push({ level: 'warning', text: 'Tên Bên B “' + esc(v('customer')) + '” khác hồ sơ khách ' + kk.id + ' (' + esc(kk.name) + ').' });
      var declared = digits(v('vehicles')), have = TH.vehiclesOf(ct, 'Xe máy', 'active').length;
      if (declared !== have) out.push({ level: 'warning', text: 'HĐ khai ' + declared + ' xe máy nhưng hồ sơ có ' + have + ' xe máy đã xác nhận — xe thiếu sẽ tạo ở trạng thái chờ xác nhận.' });
      if (rent && rent !== ct.rent) out.push({ level: 'warning', text: 'Giá thuê trong bản scan ' + F.money(rent) + ' khác giá HĐ ' + F.money(ct.rent) + ' — giá HĐ chỉ đổi qua phụ lục.' });
    }
    var people = digits(v('people')), pmax = digits(v('peopleMax'));
    if (pmax && people > pmax) out.push({ level: 'danger', text: 'Số người ở (' + people + ') vượt số người tối đa (' + pmax + ') ghi tại Điều 1.2.' });
    var rd = TH.db.readings.filter(function (r) { return r.roomId === v('room') && r.elecCur !== null; }).sort(function (a, b) { return a.period < b.period ? 1 : -1; })[0];
    if (rd) {
      var e = digits(v('elecStart')), w = digits(v('waterStart'));
      if (e && e !== rd.elecCur) out.push({ level: 'warning', text: 'Chỉ số điện bàn giao ' + fmtNum(e) + ' kWh khác chỉ số công tơ gần nhất ' + fmtNum(rd.elecCur) + ' (kỳ ' + F.period(rd.period) + ') — kiểm tra lại trước khi dùng làm mốc đầu.' });
      if (w && w !== rd.waterCur) out.push({ level: 'warning', text: 'Chỉ số nước bàn giao ' + w + ' m³ khác chỉ số gần nhất ' + rd.waterCur + ' (kỳ ' + F.period(rd.period) + ').' });
    }
    var tm = digits(v('termMonths'));
    if (v('start') && v('end') && tm && Math.abs(monthsBetween(v('start'), TH.addDays(v('end'), 1)) - tm) > 0) out.push({ level: 'warning', text: 'Thời hạn ' + tm + ' tháng không khớp khoảng ' + F.date(v('start')) + ' → ' + F.date(v('end')) + '.' });
    return out;
  }

  function buildTerms(v) {
    var base = TH.CONTRACT_TERMS.DAYDU;
    return { template: 'DAYDU', templateName: base.name, refundDays: digits(v('refundDays')) || base.refundDays, autoRenew: true, autoRenewMonths: base.autoRenewMonths, noticeDays: digits(v('noticeDays')) || base.noticeDays, earlyTermination: 'forfeit_all',
      transferFee: digits(v('transferFee')), lateFeePerDay: digits(v('lateFee')), lateGraceDays: digits(v('lateGrace')), payNoticeDay: 25, payWindow: v('payWindow') || base.payWindow, payAccount: v('bank') || base.payAccount, warrantyDays: digits(v('warrantyDays')) || base.warrantyDays,
      peopleMax: digits(v('peopleMax')) || null, vehiclesDeclared: digits(v('vehicles')), source: base.source, signedAt: v('signedAt') || TH.TODAY };
  }
  function buildPriceList(v, from, basis) {
    var mk = function (code, method, price, extra) { return Object.assign({ code: code, method: method, price: price, active: method !== 'na', from: from, basis: basis, note: '' }, extra || {}); };
    return [
      mk('ELEC', 'by_meter', digits(v('feeElec'))),
      mk('WATER', 'per_person', digits(v('feeWater'))),
      mk('NET', 'per_room', digits(v('feeNet'))),
      mk('ELEV', 'na', 0, { note: 'Không có dòng riêng trong HĐ — diễn giải trong Dịch vụ chung' }),
      mk('SVC', 'per_person', digits(v('feeSvc')), { note: 'Máy giặt, điện chung, thu rác, vệ sinh chung' }),
      mk('PARK_MOTO', 'per_vehicle', 0, { qtySource: 'vehicles', note: 'Điều 1: ' + digits(v('vehicles')) + ' xe máy — HĐ không có dòng phí, giữ 0 đ để đối chiếu' }),
      mk('PARK_EBIKE', 'per_vehicle', digits(v('feeEbike')), { qtySource: 'vehicles', note: 'Chỉ thu khi đăng ký sử dụng' }),
      mk('PARK_EV', 'per_vehicle', digits(v('feeEv')), { qtySource: 'vehicles', note: 'Xe điện dịch vụ xanh SM — chỉ thu khi đăng ký' }),
      mk('EVCHG', 'na', 0, { note: 'Không có trong HĐ — không suy đơn giá kWh từ phí xe điện' }),
    ];
  }
  function handoverOf(v, assets, file) {
    return { at: v('handoverAt'), billingFrom: v('billingFrom'), elecStart: digits(v('elecStart')), waterStart: digits(v('waterStart')), assets: assets.map(function (a) { return { group: a.group, name: a.name, qty: a.qty, unit: a.unit, condition: a.condition }; }), source: 'OCR HĐ ' + v('code') + ' · xác nhận ' + TH.TODAY, file: file || null };
  }
  function prepaidOf(v) {
    var before = digits(v('prepaidBefore')), at = digits(v('prepaidAtSign')), dep = digits(v('deposit')), total = before + at;
    return { beforeSign: before, atSign: at, total: total, allocation: 'Cọc ' + F.money(dep) + ' + tiền phòng kỳ đầu ' + F.money(Math.max(0, total - dep)) + (total - dep !== digits(v('rent')) ? ' (khác giá thuê — cần kiểm tra)' : '') };
  }

  /* Bản scan minh họa theo bố cục mẫu đầy đủ (Điều 1–4 có ô OCR; Điều 5–7 rút gọn ở các khoản được lưu) */
  function docHtml(box, v, o) {
    var room = C().room(v('room')), b = room ? C().building(room.buildingId) : null, me = C().staff('NV-001');
    var tbl = function (from, to) { return ASSETS.slice(from, to).map(function (a, j) { var i = from + j; return '<tr><td>' + esc(a.name) + '</td><td class="doc-c">' + box('tbl_assets_' + i + '_qty', a.qty + (a.unit && a.unit !== '—' && a.unit !== 'cái' ? ' ' + a.unit : '')) + '</td><td>' + box('tbl_assets_' + i + '_condition', a.condition) + '</td></tr>'; }).join(''); };
    return '<span class="sim-mark">' + TH.simBadge('Bản scan minh họa theo mẫu đầy đủ') + '</span><div class="doc-c" style="font-size:12px">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br><b>Độc lập – Tự do – Hạnh phúc</b><br>***</div>' +
      '<h4>HỢP ĐỒNG CHO THUÊ PHÒNG</h4><div class="doc-c">HĐ số: ' + box('code', v('code')) + '</div>' +
      '<p>Hôm nay, ngày ' + box('signedAt', F.date(v('signedAt'))) + '. Tại địa chỉ: ' + esc(b ? b.name + ', ' + b.address : 'Tòa TimeHouse') + '. Chúng tôi gồm:</p>' +
      '<p><b>BÊN CHO THUÊ PHÒNG (BÊN A):</b> Đại diện: ' + esc(me ? me.name : 'Phạm Minh Đức') + ' — Số CCCD: 0010••••••110 — Nơi cấp: Cục Cảnh sát — SĐT: 0903 ••• 110.</p>' +
      '<p><b>BÊN THUÊ PHÒNG (BÊN B):</b> Họ tên đầy đủ: ' + box('customer', v('customer')) + ' — Ngày sinh: ' + box('dob', F.date(v('dob'))) + ' — Các số điện thoại đang dùng: ' + box('phone', v('phone')) + ' — Số CCCD: ' + box('idNo', v('idNo')) + ' — Nơi cấp: ' + box('idPlace', v('idPlace')) + ' — Hộ khẩu thường trú: ' + box('permAddress', v('permAddress')) + '.</p>' +
      '<p><b>ĐIỀU 1: ĐỐI TƯỢNG CHO THUÊ VÀ MỤC ĐÍCH SỬ DỤNG.</b> 1.1. Bên A đồng ý cho bên B thuê phòng số: ' + box('room', v('room')) + (b ? ' – ' + esc(b.name) : '') + '. 1.2. Bên B sử dụng phòng trên với mục đích để ở. Số lượng: ' + box('people', String(v('people')).padStart(2, '0') + ' người') + '. Số người tối đa là ' + box('peopleMax', String(v('peopleMax')).padStart(2, '0') + ' người') + '; nếu thêm người phải thông báo trước và được bên A đồng ý; người mới đến ở quá 5 ngày thì tính thêm người. Số xe: ' + box('vehicles', String(v('vehicles')).padStart(2, '0') + ' xe máy') + '.</p>' +
      '<p><b>ĐIỀU 2: BÀN GIAO TÀI SẢN.</b> 2.1. Tài sản chung (thang bộ, thang máy, sân phơi, máy bơm, máy giặt chung, chiếu sáng, bể nước, camera…) sử dụng bình thường; hỏng hóc do lỗi bên B thì bên B sửa chữa/bồi thường. 2.2. Tài sản trong phòng đã bàn giao, hoạt động bình thường:</p>' +
      '<table class="doc-table"><thead><tr><th>Tên nội thất</th><th>Số lượng</th><th>Tình trạng</th></tr></thead><tbody>' + tbl(0, 15) + '</tbody></table>' +
      '<table class="doc-table"><thead><tr><th>Tên thiết bị</th><th>Số lượng</th><th>Tình trạng</th></tr></thead><tbody>' + tbl(15, ASSETS.length) + '</tbody></table>' +
      '<p><b>ĐIỀU 3: THỜI ĐIỂM GIAO NHẬN PHÒNG VÀ THỜI HẠN CHO THUÊ.</b> 3.1. Thời điểm giao nhận phòng ở là ngày ' + box('handoverAt', F.date(v('handoverAt'))) + '. 3.2. Thời điểm tính tiền phòng ở là ngày ' + box('billingFrom', F.date(v('billingFrom'))) + '. 3.3. Thời hạn hợp đồng là: ' + box('termMonths', v('termMonths') + ' tháng') + ' tính từ ngày ' + box('start', F.date(v('start'))) + ' đến ngày ' + box('end', F.date(v('end'))) + '. 3.4. Trước 30 ngày hết hạn, nếu hai bên không có ý kiến gì thì hợp đồng ' + box('autoRenew', 'mặc nhiên kéo dài thêm mỗi lần 12 tháng') + ' và tự gia hạn mỗi lần kết thúc thời hạn.</p>' +
      '<p><b>ĐIỀU 4: GIÁ CẢ VÀ PHƯƠNG THỨC THANH TOÁN.</b> 4.1. Giá cho thuê phòng là: ' + box('rent', v('rent') + 'đ/tháng') + '. Số tiền đã thanh toán trước khi ký hợp đồng: ' + box('prepaidBefore', v('prepaidBefore') + 'đ') + '. Số tiền đóng thêm vào thời điểm ký hợp đồng: ' + box('prepaidAtSign', v('prepaidAtSign') + 'đ') + '. 4.2. Các khoản phí dịch vụ — Số điện: ' + box('elecStart', v('elecStart') + ' kWh') + '; Số nước: ' + box('waterStart', v('waterStart') + ' m³') + '. 4.3. Tiền đặt cọc duy trì hợp đồng là 01 tháng tiền nhà: ' + box('deposit', v('deposit') + 'đ') + '. Tiền đặt cọc được bên A trả lại hoàn toàn khi bên B chuyển ra đúng thời hạn và không có phát sinh; bên A thanh toán trong vòng ' + box('refundDays', v('refundDays') + ' ngày') + ' kể từ ngày bên B bàn giao phòng và chìa khóa. Nếu bên B vi phạm hợp đồng hoặc đơn phương chấm dứt trước thời hạn thì phải thanh toán đầy đủ tiền dịch vụ đã sử dụng và mất toàn bộ tiền đặt cọc. Nhượng lại hợp đồng chịu phí nhượng phòng ' + box('transferFee', v('transferFee') + 'đ') + '.</p>' +
      '<p>4.4. Phương thức thanh toán: ngày 25 hàng tháng bên A gửi thông báo tiền phòng kỳ tiếp theo và tiền dịch vụ đã dùng. 4.4.1 Thời hạn thanh toán: ' + box('payWindow', v('payWindow')) + '. 4.4.2 Chuyển khoản đến tài khoản ghi trên thông báo tiền phòng — ' + box('bank', v('bank')) + '.</p>' +
      '<table class="doc-table"><tbody><tr><td>Internet</td><td>' + box('feeNet', v('feeNet') + 'đ /tháng') + '</td><td>Xe đạp điện</td><td>' + box('feeEbike', v('feeEbike') + 'đ /xe') + '</td></tr><tr><td>Điện</td><td>' + box('feeElec', v('feeElec') + 'đ /số') + '</td><td>Dịch vụ chung (máy giặt, điện chung, thu rác, vệ sinh chung)</td><td>' + box('feeSvc', v('feeSvc') + 'đ /người') + '</td></tr><tr><td>Nước</td><td>' + box('feeWater', v('feeWater') + 'đ /người') + '</td><td>Xe điện dịch vụ xanh SM</td><td>' + box('feeEv', v('feeEv') + '/xe') + '</td></tr></tbody></table>' +
      '<p>4.4.3 Nội dung chuyển khoản: ' + esc(String(v('room')) + ' - ' + String(v('customer')).toUpperCase()) + '. 4.4.4 Chậm trả tiền thì bên B chịu phạt ' + box('lateFee', v('lateFee') + ' đồng') + ' cho một ngày nộp muộn, tính từ ngày mùng 1 tháng sau đó; thời hạn chậm trả không quá ' + box('lateGrace', String(v('lateGrace')).padStart(2, '0') + ' ngày') + '; hết hạn coi như bên B vi phạm hợp đồng.</p>' +
      '<p><b>ĐIỀU 5–7 (rút gọn).</b> 5.2.4 Bên A bảo hành đồ đạc và trang thiết bị trong vòng ' + box('warrantyDays', v('warrantyDays') + ' ngày') + ' kể từ ngày bàn giao. 6.2.11 Khi chấm dứt hợp đồng, bên B báo trước ít nhất ' + box('noticeDays', v('noticeDays') + ' ngày') + ' và bàn giao lại phòng như Điều 2. 7.1 Vi phạm hợp đồng, nội quy hoặc đơn phương chấm dứt trước thời hạn thì mất toàn bộ tiền đặt cọc. 7.2 Hợp đồng lập thành 02 bản, có giá trị từ ngày ký.</p>' +
      '<div class="doc-sig"><div>ĐẠI DIỆN BÊN A<br>(Ký và ghi rõ họ tên)<br><br><i style="color:#94a3b8">(đã ký)</i></div><div>ĐẠI DIỆN BÊN B<br>(Ký và ghi rõ họ tên)<br><br><i style="color:#94a3b8">(đã ký)</i></div></div>';
  }

  function sideExtra(v, o) {
    var people = digits(v('people')) || 1, moto = digits(v('vehicles'));
    var rows = [
      { a: 'Internet ' + F.money(digits(v('feeNet'))) + '/tháng', b: 'NET · theo phòng', q: '1 phòng', c: F.money(digits(v('feeNet'))) },
      { a: 'Điện ' + F.money(digits(v('feeElec'))) + '/số', b: 'ELEC · theo chỉ số', q: 'từ ' + v('elecStart') + ' kWh', c: '<span class="muted small">theo sử dụng</span>' },
      { a: 'Nước ' + F.money(digits(v('feeWater'))) + '/người', b: 'WATER · theo người', q: people + ' người', c: F.money(digits(v('feeWater')) * people) },
      { a: 'Dịch vụ chung ' + F.money(digits(v('feeSvc'))) + '/người', b: 'SVC · theo người', q: people + ' người', c: F.money(digits(v('feeSvc')) * people) },
      { a: 'Xe máy (Điều 1) — không có dòng phí', b: 'PARK_MOTO · 0 đ/xe', q: moto + ' xe', c: F.money(0) },
      { a: 'Xe đạp điện ' + F.money(digits(v('feeEbike'))) + '/xe', b: 'PARK_EBIKE · theo xe đã xác nhận', q: 'khi đăng ký', c: '<span class="muted small">0 ₫ khi chưa có xe</span>' },
      { a: 'Xe điện SM ' + F.money(digits(v('feeEv'))) + '/xe', b: 'PARK_EV · theo xe đã xác nhận', q: 'khi đăng ký', c: '<span class="muted small">không suy ra kWh sạc</span>' },
    ];
    return TH.gate('F012.B', '<div class="card"><div class="card-hd"><div class="card-title">' + I('layers', 'ic-sm') + 'Map biểu phí (Điều 4.4) → dòng phí theo HĐ' + TH.up('F012.B') + '</div></div>' + TH.table({ compact: true, cols: [{ key: 'a', label: 'Dòng trong HĐ' }, { key: 'b', label: 'Dòng phí · cách tính' }, { key: 'q', label: 'SL' }, { key: 'c', label: 'Dự kiến/tháng', num: true }], rows: rows }) + '<div class="card-bd small muted">Thang máy: diễn giải trong Dịch vụ chung; sạc theo kWh: không có trong HĐ. Hai mục này PENDING_APPROVAL (K-05).</div></div>', { label: 'Tối đa 2 mẫu HĐ, map phí cố định', lines: 2 }) +
      TH.gate('F012.D', '<div class="card"><div class="card-hd"><div class="card-title">' + I('folder', 'ic-sm') + 'Thư viện mẫu' + TH.up('F012.D') + '</div></div>' + TH.table({ compact: true, cols: [{ key: 'name', label: 'Mẫu' }, { key: 'fields', label: 'Field', num: true }, { key: 'acc', label: 'Chính xác', num: true, render: function (t) { return F.pct(t.accuracy, 0); } }, { key: 'st', label: '', render: function (t) { return TH.status(t.status === 'approved' ? 'approved' : 'draft'); } }], rows: templates() }) + '</div>', { label: 'Nhiều mẫu cố định đã duyệt', lines: 2 });
  }

  function workspace(o) {
    var v = reader(o.form, o.fields);
    return TH.ocrWorkspace({
      screen: 'OCR-CON', form: o.form, docTitle: o.docTitle, fields: o.fields, groups: GROUPS, tables: [tableCfg()],
      inc: { conf: 'F012.B', tpl: 'F012.B', match: 'F012.C', log: 'F012.D' },
      templates: templates(), matchTitle: 'So khớp phòng – khách – hợp đồng',
      confirmAct: o.confirmAct, confirmLabel: o.confirmLabel,
      checks: function () { return checks(v, o); },
      sideExtra: function () { return sideExtra(v, o); },
      docHtml: function (box) { return docHtml(box, v, o); },
    });
  }

  /* Áp kết quả đã xác nhận vào HỒ SƠ THUÊ đã có (CUS-02): khách, điều khoản, bàn giao, tiền đã nộp, dòng phí (hiệu lực kỳ sau), xe khai báo */
  function applyToContract(ct, v, assets, opts) {
    opts = opts || {};
    var k = C().customer(ct.customerId), me = TH.me().id, today = TH.TODAY, from = TH.addMonthsYm(today.slice(0, 7), 1);
    var labels = { phone: 'Số điện thoại', permAddress: 'Địa chỉ thường trú' };
    Object.keys(labels).forEach(function (f) { var nv = String(v(f) || '').trim(); if (nv && nv !== (k[f] || '')) { TH.db.customerHistory.unshift({ customerId: k.id, at: today, field: labels[f], before: k[f] || '—', after: nv, by: me }); k[f] = nv; } });
    if (v('dob')) k.dob = v('dob');
    if (v('idPlace')) k.idPlace = v('idPlace');
    ct.people = digits(v('people')) || ct.people;
    ct.terms = buildTerms(v);
    ct.handover = handoverOf(v, assets, opts.file || ct.scanFile);
    ct.prepaid = prepaidOf(v);
    ct.priceList = buildPriceList(v, from, 'OCR xác nhận ' + today + ' · ' + C().staffName(me));
    TH.syncFees(ct);
    var declared = digits(v('vehicles')), have = (k.vehicles || []).filter(function (x) { return x.type === 'Xe máy' && x.status !== 'ended'; }).length, added = 0;
    k.vehicles = k.vehicles || [];
    for (var j = have; j < declared; j++) { k.vehicles.push({ id: 'XE-' + k.id.slice(3) + '-ocr' + (j + 1), type: 'Xe máy', plate: null, brand: '', color: '', status: 'pending', from: today, to: null, feeCode: 'PARK_MOTO', note: 'Khai từ HĐ (Điều 1) — cần bổ sung biển số và xác nhận đăng ký' }); added++; }
    ct.versions.push({ v: ct.versions.length + 1, at: today, by: me, note: 'Đọc hợp đồng (OCR mẫu đầy đủ) — đã xác nhận, ' + (opts.corrections || 0) + ' mục sửa tay; dòng phí hiệu lực từ kỳ ' + F.period(from) });
    TH.db.ocrJobs.unshift({ id: 'OCR-' + String(TH.db.ocrJobs.length + 1).padStart(4, '0'), kind: 'contract', target: 'update', contractId: ct.id, file: opts.file || ct.scanFile, status: 'confirmed', fields: opts.vals || {}, assets: assets, by: me, at: today, corrections: opts.corrections || 0, used: true });
    TH.log('Đọc hợp đồng (OCR) → hồ sơ thuê', ct.id, (opts.corrections || 0) + ' mục sửa tay' + (added ? ' · ' + added + ' xe chờ xác nhận' : ''), 'contract', ct.buildingId);
    return { from: from, added: added };
  }

  var openCt = null;
  TH.act['cus.ctOcr'] = function (el) {
    var ct = C().contract(el.dataset.ct); if (!ct) return;
    var form = 'ocr-con-' + ct.id, file = (TH.db.documents.filter(function (d) { return d.contractId === ct.id && /Hợp đồng/.test(d.kind); }).slice(-1)[0] || { file: ct.scanFile }).file;
    openCt = ct.id; TH.store.clearDraft(form);
    TH.modal.open({ key: 'ctocr', size: 'full', render: function () { var c = C().contract(openCt); return workspace({ form: form, fields: fieldsFor(c), mode: 'update', ct: c, confirmAct: 'ctocr.confirm', confirmLabel: 'Xác nhận & áp vào hồ sơ thuê', docTitle: file }); } });
  };
  TH.act['ctocr.confirm'] = function () {
    var ct = C().contract(openCt); if (!ct) return;
    var form = 'ocr-con-' + ct.id, fields = fieldsFor(ct), v = reader(form, fields);
    var r = applyToContract(ct, v, assetsOf(form), { vals: vals(form, fields), corrections: corrections(form, fields) });
    TH.store.clearDraft(form); TH.app.guard = null; TH.modal.close('ctocr', { silent: true }); TH.app.refresh();
    TH.toast('Đã áp kết quả OCR vào hồ sơ ' + esc(ct.id), 'Dòng phí hiệu lực từ kỳ ' + F.period(r.from) + '; hóa đơn đã lập không đổi' + (r.added ? '; ' + r.added + ' xe máy chờ xác nhận đăng ký' : '') + '.');
  };

  TH.CONTRACT_OCR = { fields: FIELDS, groups: GROUPS, assets: ASSETS, templates: templates, reader: reader, vals: vals, assetsOf: assetsOf, corrections: corrections, tableCfg: tableCfg, fieldsFor: fieldsFor, checks: checks, buildTerms: buildTerms, buildPriceList: buildPriceList, handoverOf: handoverOf, prepaidOf: prepaidOf, docHtml: docHtml, workspace: workspace, applyToContract: applyToContract, fmtNum: fmtNum };
})();
