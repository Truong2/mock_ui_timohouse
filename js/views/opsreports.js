/* CR-RPT-03 — Loại báo cáo bổ sung theo gói, đăng ký vào luồng Báo cáo (js/views/reportflow.js · TH.reports.register).
 *   Nhóm Vận hành: Âm dương điện nước (C) · Lấp đầy và thời gian trống (C) · Sửa chữa & vệ sinh (D)
 *   Nhóm Tài chính: Dự kiến lợi nhuận (D)       Nhóm Khách hàng: Phân khúc khách hàng (D)
 * Bố cục theo file mẫu docs/bao_cao. Mỗi chỉ tiêu nguồn mang danh sách minh chứng (src) cộng ra đúng số; chỉ tiêu dẫn xuất khai báo bằng
 * công thức thành phần × hệ số (sửa được trong preview). Số lấy từ hóa đơn, phiếu thu, chi phí, hợp đồng, phòng, hồ sơ khách — cùng nguồn C.pnl.
 */
(function () {
  if (!TH.reports || !TH.reports.register) return;
  var F = TH.fmt, C = TH.calc, R = TH.reports, ENGINE = 'RPT-ENGINE v1 · báo cáo bổ sung';
  var EXP_KEY = { owner_rent: 'cRent', internet: 'cNet', waste: 'cWaste', elevator: 'cLift', cleaning: 'cleanStaff', commission: 'mkt', repair: 'repair', supplies: 'other', other: 'other', equipment: 'equip' };

  function sum(list, fn) { return list.reduce(function (s, x) { return s + (fn ? fn(x) : x); }, 0); }
  function deep(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }
  function monthDays(p) { return new Date(+p.slice(0, 4), +p.slice(5, 7), 0).getDate(); }
  function prevP(p) { var i = TH.PERIODS.indexOf(p); return i > 0 ? TH.PERIODS[i - 1] : null; }
  function mm(p) { return String(+p.slice(5)) + '/' + p.slice(0, 4); }
  function S(k, w) { return [k, w === undefined ? 1 : w]; }
  function sumF(parts) { return { kind: 'sum', parts: parts }; }
  function ratioF(num, den) { return { kind: 'ratio', num: num, den: den }; }
  function leaf(label, unit) { return { label: label, unit: unit || 'money', leaf: true, src: true }; }
  function der(label, unit) { return { label: label, unit: unit || 'money', leaf: false }; }
  function srcObj(kind, id, amount, o) { return Object.assign({ kind: kind, id: id, amount: amount, room: null, text: '' }, o || {}); }
  function pnlSrc(list) { return (list || []).map(function (s) { return srcObj(s.kind, s.id, s.amount, { room: s.room || null, text: s.text || '' }); }); }

  /* Bản số liệu chung: cột từng tòa + cột TỔNG (= Σ tòa); chỉ tiêu dẫn xuất do công thức tính sau (applyFormulas) */
  function makeSnap(type, p, ids, perBuilding) {
    var d = R.TYPES[type], modes = d.modes || ['tong'], keyOf = R.keyOf;
    var snap = { type: type, period: p, buildingIds: ids.slice(), engine: ENGINE, schema: TH.DATA_SCHEMA, template: d.tpl, labels: {}, groups: {}, cols: {}, vals: {}, meta: {}, src: {}, notes: {}, sheets: [], lists: {},
      mdefs: deep(d.mdefs), filters: d.filters, modeLabels: d.modeLabels || null, rules: deep(TH.billRules()), locked: TH.periodLocked(p) };
    ids.forEach(function (b) { var bb = C.building(b); snap.labels[b] = { short: bb.short, name: bb.name, group: null }; });
    var leaves = Object.keys(d.mdefs).filter(function (k) { return d.mdefs[k].leaf; });
    modes.forEach(function (m) {
      snap.vals[m] = {}; snap.meta[m] = {}; snap.src[m] = {};
      ids.forEach(function (b) {
        var r = perBuilding(b, m), ck = keyOf([b]), vals = {};
        leaves.forEach(function (k) { var list = r.src[k] || []; vals[k] = r.vals && r.vals[k] !== undefined ? r.vals[k] : sum(list, function (x) { return x.amount || 0; }); });
        snap.cols[ck] = { ids: [b], label: snap.labels[b].short, note: r.note || '' };
        snap.vals[m][ck] = vals; snap.src[m][b] = r.src;
      });
      if (ids.length > 1) { var ck = keyOf(ids), t = {}; leaves.forEach(function (k) { t[k] = sum(ids, function (b) { return snap.vals[m][keyOf([b])][k]; }); }); snap.cols[ck] = { ids: ids.slice(), label: 'TỔNG' }; snap.vals[m][ck] = t; }
    });
    return snap;
  }
  function rowsOf(ids) { var k = R.keyOf; return ids.map(function (b) { return k([b]); }).concat(ids.length > 1 ? [k(ids)] : []); }
  function srcSheet(mode) { return { id: 'src', name: 'NGUON SO LIEU', title: 'Nguồn số liệu từng chỉ tiêu', kind: 'src', mode: mode || 'tong' }; }

  /* ================= Âm dương điện nước (gói C) ================= */
  R.register('RPT-AMD', {
    label: 'Âm dương điện nước', group: 'ops', tier: 'C', per: 'set', tpl: 'âm dương điện nước tháng 6/7.xlsx · sheet THÁNG 7.2026 điện / THÁNG 6.2026 nước',
    desc: 'Thu–chi điện, nước theo tòa: phải thu, thực thu, không thu được, tiền trả nhà cung cấp và thất thoát.',
    warn: ['DRAFT_INV', 'UNBILLED', 'PENDING_EXP', 'PENDING_ADJ', 'FORMULA'],
    mdefs: {
      washPaid: leaf('Thực thu máy giặt'), washDue: leaf('Phải thu máy giặt'), washLost: der('Máy giặt không thu được'),
      liftPaid: leaf('Thực thu thang máy + máy sấy + xe điện'), liftDue: leaf('Phải thu thang máy + máy sấy + xe điện'), liftLost: der('Thang máy không thu được'),
      elecPaid: leaf('Thực thu điện'), elecDue: leaf('Phải thu điện'), elecLost: der('Điện không thu được'),
      waterPaid: leaf('Thực thu nước'), waterDue: leaf('Phải thu nước'), waterLost: der('Nước không thu được'),
      elecBase: der('Điện thực thu + ½ máy giặt + thang máy, máy sấy, xe điện (3)'), elecCost: leaf('Điện chi (4)'), elecNet: der('Thu − chi điện (5) = (3) − (4)'),
      waterBase: der('Nước thực thu + ½ máy giặt (6)'), waterCost: leaf('Nước chi (7)'), waterNet: der('Thu − chi nước (8) = (6) − (7)'),
      loss: leaf('Thất thoát phòng trống / phá HĐ'),
    },
    formulas: {
      washLost: sumF([S('washDue'), S('washPaid', -1)]), liftLost: sumF([S('liftDue'), S('liftPaid', -1)]), elecLost: sumF([S('elecDue'), S('elecPaid', -1)]), waterLost: sumF([S('waterDue'), S('waterPaid', -1)]),
      elecBase: sumF([S('elecPaid'), S('washPaid', 0.5), S('liftPaid')]), elecNet: sumF([S('elecBase'), S('elecCost', -1)]),
      waterBase: sumF([S('waterPaid'), S('washPaid', 0.5)]), waterNet: sumF([S('waterBase'), S('waterCost', -1)]),
    },
    filters: {
      washDue: 'Phần máy giặt của phí dịch vụ chung chia 3 (như sổ khách) trên hóa đơn đã xác nhận.', washPaid: 'Phải thu máy giặt × tỷ lệ đã thu của từng hóa đơn (phiếu thu đã xác nhận).',
      liftDue: 'Phần thang máy của phí DV chung chia 3 + phí gửi xe điện + phí phát sinh trên hóa đơn đã xác nhận.', liftPaid: 'Phải thu thang máy/xe điện × tỷ lệ đã thu của hóa đơn.',
      elecDue: 'Dòng điện theo chỉ số + điện chung phân bổ của hóa đơn đã xác nhận.', elecPaid: 'Phải thu điện × tỷ lệ đã thu của hóa đơn.',
      waterDue: 'Dòng nước của hóa đơn đã xác nhận.', waterPaid: 'Phải thu nước × tỷ lệ đã thu của hóa đơn.',
      elecCost: 'Phần điện của hóa đơn công tơ tổng đã duyệt (chi phí “Điện nước tổng”).', waterCost: 'Phần nước của hóa đơn công tơ tổng đã duyệt.',
      loss: 'Điện nước phòng trống, đang sửa, phá HĐ chưa tính được cho khách và điện chung phòng trống (METER-01).',
    },
    build: function (p, ids) {
      var lossRows = [];
      var snap = makeSnap('RPT-AMD', p, ids, function (b) {
        var src = { washDue: [], washPaid: [], liftDue: [], liftPaid: [], elecDue: [], elecPaid: [], waterDue: [], waterPaid: [], elecCost: [], waterCost: [], loss: [] };
        var invs = C.invoicesIn(p, b).filter(function (i) { return i.status === 'confirmed'; });
        invs.forEach(function (inv) {
          var ratio = inv.total > 0 ? Math.min(1, C.paid(inv.id) / inv.total) : 0, parts = { wash: 0, lift: 0, elec: 0, water: 0 };
          inv.lines.forEach(function (l) {
            var k = C.pnlLineKey(l);
            if (k === 'svcSplit') { var a = Math.round(l.amount / 3); parts.wash += l.amount - 2 * a; parts.lift += a; }
            else if (k === 'elec') parts.elec += l.amount; else if (k === 'water') parts.water += l.amount;
            else if (k === 'ev' || (k === 'lift' && l.type === 'extra')) parts.lift += l.amount;
          });
          Object.keys(parts).forEach(function (x) {
            if (!parts[x]) return;
            src[x + 'Due'].push(srcObj('invoice', inv.id, parts[x], { room: inv.roomId, status: inv.status, invPeriod: inv.period, text: 'Phải thu trên hóa đơn' }));
            var paid = Math.round(parts[x] * ratio);
            if (paid) src[x + 'Paid'].push(srcObj('invoice', inv.id, paid, { room: inv.roomId, status: inv.status, invPeriod: inv.period, text: F.money(parts[x]) + ' × đã thu ' + F.pct(ratio, 1) }));
          });
        });
        C.expensesIn(p, b, 'approved').filter(function (e) { return e.category === 'utility'; }).forEach(function (e) {
          var el = e.elec !== undefined ? e.elec : Math.round(e.amount * 0.8), o = { status: e.status, docNo: e.docNo, buildingId: e.buildingId, text: e.description + ' · ' + e.docNo };
          src.elecCost.push(srcObj('expense', e.id, el, o)); src.waterCost.push(srcObj('expense', e.id, e.amount - el, o));
        });
        C.utilityLoss(p, b).forEach(function (x) {
          src.loss.push(srcObj('room', x.room.id, x.lost, { room: x.room.code || x.room.id, text: x.note + ' · điện ' + F.money(x.elec.amount) + ', nước ' + F.money(x.water.amount) }));
          lossRows.push([x.room.code || x.room.id, C.building(b).short, x.note, x.elec.amount, x.water.amount, x.lost]);
        });
        return { src: src, note: invs.length ? '' : 'Chưa có hóa đơn xác nhận' };
      });
      var rows = rowsOf(ids), m = mm(p);
      snap.sheets = [
        { id: 'dien', name: 'THU CHI DIEN', title: 'THU CHI ĐIỆN- NƯỚC THÁNG ' + m + ' · ĐIỆN', kind: 'grid', mode: 'tong', rowLabel: 'TÒA', rows: rows, metrics: ['washPaid', 'washDue', 'washLost', 'liftPaid', 'liftDue', 'liftLost', 'elecPaid', 'elecDue', 'elecLost', 'elecBase', 'elecCost', 'elecNet'], note: 'Máy giặt, thang máy lấy từ phí dịch vụ chung chia 3; ½ máy giặt cộng vào điện, ½ vào nước.' },
        { id: 'nuoc', name: 'THU CHI NUOC', title: 'THU CHI ĐIỆN- NƯỚC THÁNG ' + m + ' · NƯỚC', kind: 'grid', mode: 'tong', rowLabel: 'TÒA', rows: rows, metrics: ['washPaid', 'washDue', 'washLost', 'liftPaid', 'liftDue', 'liftLost', 'waterPaid', 'waterDue', 'waterLost', 'waterBase', 'waterCost', 'waterNet'] },
        { id: 'loss', name: 'THAT THOAT', title: 'Thất thoát điện nước tháng ' + m, kind: 'list', list: 'loss', empty: 'Không có thất thoát điện nước trong kỳ' },
        srcSheet('tong')];
      snap.lists.loss = { columns: [{ label: 'Phòng / công tơ', width: 16 }, { label: 'Tòa', width: 14 }, { label: 'Lý do', width: 28 }, { label: 'Điện', type: 'money' }, { label: 'Nước', type: 'money' }, { label: 'Thất thoát', type: 'money' }], rows: lossRows };
      return snap;
    },
  });

  /* ================= Lấp đầy và thời gian trống (gói C) ================= */
  function occRooms(p, b) {
    var md = monthDays(p);
    return TH.db.rooms.filter(function (r) { return r.buildingId === b; }).map(function (room) {
      var st = C.roomStateAt(room, p), cts = TH.db.contracts.filter(function (c) { return c.roomId === room.id && c.status !== 'draft' && c.status !== 'cancelled'; });
      var days = Math.min(md, sum(cts, function (c) { return C.occupancy(c, p).days; })), vacant = st === 'maintenance' ? 0 : md - days;
      return { room: room, state: st, md: md, days: days, vacant: vacant, lost: Math.round(room.rent * vacant / md), cts: cts.filter(function (c) { return C.occupancy(c, p).days > 0; }) };
    });
  }
  R.register('RPT-OCC', {
    label: 'Lấp đầy và thời gian trống', group: 'ops', tier: 'C', per: 'set', tpl: 'Mẫu TIMEHOUSE theo cách đếm phòng trống của BÁO CÁO KINH DOANH THÁNG 8.xlsx',
    desc: 'Tỷ lệ lấp đầy cuối kỳ và theo ngày, số ngày phòng trống, tiền phòng chưa khai thác theo nhà và toàn hệ thống.',
    warn: ['FORMULA'],
    mdefs: {
      rooms: leaf('Tổng phòng', 'count'), maint: leaf('Đang sửa', 'count'), rentable: der('Phòng khai thác được', 'count'), occEnd: leaf('Đang thuê cuối kỳ', 'count'), vacantEnd: der('Trống cuối kỳ', 'count'),
      rate: der('Lấp đầy cuối kỳ', 'pct'), roomDays: leaf('Ngày-phòng khai thác được', 'count'), occDays: leaf('Ngày có khách', 'count'), rateDays: der('Lấp đầy theo ngày', 'pct'),
      vacantDays: leaf('Tổng ngày trống', 'count'), vacantRooms: leaf('Phòng có ngày trống', 'count'), avgVacant: der('Ngày trống bình quân / phòng trống', 'num'), lostRent: leaf('Tiền phòng chưa khai thác'),
    },
    formulas: {
      rentable: sumF([S('rooms'), S('maint', -1)]), vacantEnd: sumF([S('rentable'), S('occEnd', -1)]),
      rate: ratioF([S('occEnd')], [S('rentable')]), rateDays: ratioF([S('occDays')], [S('roomDays')]), avgVacant: ratioF([S('vacantDays')], [S('vacantRooms')]),
    },
    filters: {
      rooms: 'Mọi phòng của tòa.', maint: 'Phòng đang sửa cuối kỳ (không tính vào phòng khai thác được, như RPT-05).', occEnd: 'Phòng có người thuê tại cuối kỳ (trạng thái phòng theo sự kiện).',
      roomDays: 'Số ngày trong tháng × phòng khai thác được.', occDays: 'Ngày có hợp đồng hiệu lực trong tháng (theo ngày tính tiền/kết thúc hợp đồng).', vacantDays: 'Ngày-phòng khai thác được − ngày có khách.',
      vacantRooms: 'Phòng khai thác được có ít nhất một ngày trống.', lostRent: 'Giá niêm yết × ngày trống ÷ số ngày trong tháng.',
    },
    build: function (p, ids) {
      var vac = [], snap = makeSnap('RPT-OCC', p, ids, function (b) {
        var src = { rooms: [], maint: [], occEnd: [], roomDays: [], occDays: [], vacantDays: [], vacantRooms: [], lostRent: [] };
        occRooms(p, b).forEach(function (r) {
          var o = { room: r.room.code, text: TH.statusLabel(r.state) + ' cuối kỳ · ' + r.days + '/' + r.md + ' ngày có khách' + (r.cts.length ? ' · ' + r.cts.map(function (c) { return c.id; }).join(', ') : '') };
          src.rooms.push(srcObj('room', r.room.id, 1, o));
          if (r.state === 'maintenance') { src.maint.push(srcObj('room', r.room.id, 1, o)); return; }
          if (r.state === 'occupied') src.occEnd.push(srcObj('room', r.room.id, 1, o));
          src.roomDays.push(srcObj('room', r.room.id, r.md, o));
          if (r.days) src.occDays.push(srcObj('room', r.room.id, r.days, o));
          if (r.vacant) { src.vacantDays.push(srcObj('room', r.room.id, r.vacant, o)); src.vacantRooms.push(srcObj('room', r.room.id, 1, o)); src.lostRent.push(srcObj('room', r.room.id, r.lost, o)); vac.push([r.room.code, C.building(b).short, TH.statusLabel(r.state), r.days, r.vacant, r.lost]); }
        });
        return { src: src };
      });
      vac.sort(function (a, b) { return b[4] - a[4]; });
      var ps = TH.PERIODS.slice(0, TH.PERIODS.indexOf(p) + 1).slice(-6);
      var trend = ids.map(function (b) { return [C.building(b).short].concat(ps.map(function (x) { var rs = occRooms(x, b).filter(function (r) { return r.state !== 'maintenance'; }), rd = sum(rs, function (r) { return r.md; }); return rd ? sum(rs, function (r) { return r.days; }) / rd : 0; })); });
      snap.sheets = [
        { id: 'lapday', name: 'LAP DAY', title: 'BÁO CÁO LẤP ĐẦY VÀ THỜI GIAN TRỐNG THÁNG ' + mm(p), kind: 'grid', mode: 'tong', rowLabel: 'TÒA', rows: rowsOf(ids), metrics: ['rooms', 'maint', 'rentable', 'occEnd', 'vacantEnd', 'rate', 'rateDays', 'vacantDays', 'avgVacant', 'lostRent'], note: 'Phòng đang sửa không tính vào phòng khai thác được.' },
        { id: 'trong', name: 'PHONG TRONG', title: 'Phòng có ngày trống tháng ' + mm(p), kind: 'list', list: 'trong', empty: 'Mọi phòng khai thác được đều có khách cả tháng' },
        { id: 'xuhuong', name: 'XU HUONG 6 KY', title: 'Lấp đầy theo ngày ' + ps.length + ' kỳ (tham khảo, tính lại tại lúc tạo)', kind: 'list', list: 'xuhuong' },
        srcSheet('tong')];
      snap.lists.trong = { columns: [{ label: 'Phòng', width: 12 }, { label: 'Tòa', width: 14 }, { label: 'Cuối kỳ', width: 16 }, { label: 'Ngày có khách', type: 'number' }, { label: 'Ngày trống', type: 'number' }, { label: 'Tiền phòng chưa khai thác', type: 'money', width: 20 }], rows: vac };
      snap.lists.xuhuong = { columns: [{ label: 'Tòa', width: 16 }].concat(ps.map(function (x) { return { label: 'Kỳ ' + F.period(x), type: 'pct' }; })), rows: trend };
      return snap;
    },
  });

  /* ================= Sửa chữa & vệ sinh (gói D) ================= */
  R.register('RPT-REP', {
    label: 'Chi phí sửa chữa, vệ sinh', group: 'ops', tier: 'D', per: 'set', tpl: 'sổ sửa chữa tháng 8.xlsx · sheet A Điệp/A Ước 8.26 · THU CHI DỊCH VỤ',
    desc: 'Sổ sửa chữa theo tòa/phòng (tiền công, vật tư, người sửa) và thu–chi vệ sinh, mạng theo tòa.',
    warn: ['PENDING_EXP', 'FORMULA'],
    mdefs: {
      jobs: leaf('Số việc sửa chữa', 'count'), labor: leaf('Tiền công'), materials: leaf('Mua vật tư'), unsplit: leaf('Chưa tách công/vật tư'), repairTotal: der('Tổng chi sửa chữa'),
      cleanIn: leaf('Thu vệ sinh'), cleanOut: leaf('Chi vệ sinh, thu rác'), cleanNet: der('Thu − chi vệ sinh'), netIn: leaf('Thu mạng'), netOut: leaf('Chi mạng'), netNet: der('Thu − chi mạng'),
    },
    formulas: { repairTotal: sumF([S('labor'), S('materials'), S('unsplit')]), cleanNet: sumF([S('cleanIn'), S('cleanOut', -1)]), netNet: sumF([S('netIn'), S('netOut', -1)]) },
    filters: {
      jobs: 'Chi phí “Sửa chữa, bảo trì” của kỳ, không gồm phiếu bị từ chối và phiếu nghi trùng.', labor: 'Dòng tiền công của phiếu sửa chữa gắn với chi phí.', materials: 'Dòng vật tư của phiếu sửa chữa.',
      unsplit: 'Chi phí sửa chữa chưa có phiếu sửa chữa: giữ tổng tiền, chưa tách công/vật tư.', cleanIn: '1/3 phí dịch vụ chung trên hóa đơn đã xác nhận (như RPT-05).',
      cleanOut: 'Chi phí vệ sinh khu chung + phí thu rác đã duyệt.', netIn: 'Dòng Internet trên hóa đơn đã xác nhận.', netOut: 'Chi phí Internet đã duyệt.',
    },
    build: function (p, ids) {
      var log = [];
      var snap = makeSnap('RPT-REP', p, ids, function (b) {
        var src = { jobs: [], labor: [], materials: [], unsplit: [], cleanIn: [], cleanOut: [], netIn: [], netOut: [] };
        TH.db.expenses.filter(function (e) { return e.category === 'repair' && e.status !== 'rejected' && e.period === p && e.buildingId === b; }).sort(function (a, c) { return a.date < c.date ? -1 : 1; }).forEach(function (e) {
          var j = (TH.db.repairJobs || []).find(function (x) { return x.expenseId === (e.correctionId ? e.sourceId : e.id); });
          var original = e.correctionId && TH.db.expenses.find(function (x) { return x.id === e.sourceId; }), factor = original && original.amount ? e.amount / original.amount : 1;
          var part = function (kind) { var value = j ? sum(j.lines.filter(function (l) { return l.kind === kind; }), function (l) { return l.qty * l.unitPrice; }) * factor : 0; return e.correctionId ? Math.round(value) : value; };
          var dup = !e.correctionId && TH.db.expenses.find(function (x) { return x !== e && x.category === 'repair' && x.status !== 'rejected' && x.buildingId === e.buildingId && x.docNo === e.docNo && x.amount === e.amount && x.id < e.id; });
          var tech = j ? j.technicianId : (C.roleStaff(e.buildingId, 'Nhân viên kỹ thuật')[0] || {}).staffId || null;
          var o = { room: e.roomId || null, status: e.status, docNo: e.docNo, buildingId: e.buildingId, text: e.description + ' · ' + e.docNo + ' · ' + F.date(e.date) + (tech ? ' · ' + C.staffName(tech) : ''), dupOf: dup ? dup.id : null };
          var lab = part('labor'), mat = part('materials'), un = j ? (e.correctionId ? e.amount - lab - mat : 0) : e.amount;
          if (dup) { src.unsplit.push(srcObj('expense', e.id, 0, o)); }
          else {
            src.jobs.push(srcObj('expense', e.id, e.correctionId ? 0 : 1, o));
            if (lab) src.labor.push(srcObj('expense', e.id, lab, o));
            if (mat) src.materials.push(srcObj('expense', e.id, mat, o));
            if (un) src.unsplit.push(srcObj('expense', e.id, un, o));
          }
          log.push([F.date(e.date), C.building(b).short, e.roomId || 'Khu chung', e.description, dup ? 0 : lab, dup ? 0 : mat, dup ? 0 : un, tech ? C.staffName(tech) : 'Chưa phân công', (dup ? 'Nghi trùng ' + dup.id : { approved: 'Đã duyệt chi', pending: 'Chờ duyệt', draft: 'Nháp' }[e.status] || e.status) + ' · ' + e.id]);
        });
        var v = C.pnl(p, b, 'tong');
        src.cleanIn = pnlSrc(v.src.clean); src.cleanOut = pnlSrc(v.src.cleanStaff).concat(pnlSrc(v.src.cWaste)); src.netIn = pnlSrc(v.src.net); src.netOut = pnlSrc(v.src.cNet);
        return { src: src };
      });
      snap.sheets = [
        { id: 'sosc', name: 'SO SUA CHUA', title: 'TIMEHOUSE SỬA CHỮA THÁNG ' + mm(p), kind: 'list', list: 'sosc', empty: 'Không có việc sửa chữa trong kỳ', note: 'Phiếu nghi trùng (cùng số chứng từ, cùng số tiền) vẫn liệt kê nhưng không cộng vào tổng.' },
        { id: 'tongsc', name: 'TONG HOP SUA CHUA', title: 'Tổng hợp sửa chữa theo tòa tháng ' + mm(p), kind: 'grid', mode: 'tong', rowLabel: 'TÒA', rows: rowsOf(ids), metrics: ['jobs', 'labor', 'materials', 'unsplit', 'repairTotal'] },
        { id: 'dv', name: 'THU CHI DV', title: 'THU CHI DỊCH VỤ THÁNG ' + mm(p), kind: 'grid', mode: 'tong', rowLabel: 'TÒA', rows: rowsOf(ids), metrics: ['cleanIn', 'cleanOut', 'cleanNet', 'netIn', 'netOut', 'netNet'] },
        srcSheet('tong')];
      snap.lists.sosc = { columns: [{ label: 'NGÀY', width: 12 }, { label: 'TÒA', width: 14 }, { label: 'MÃ PHÒNG', width: 12 }, { label: 'NỘI DUNG SỬA CHỮA', width: 36 }, { label: 'TIỀN CÔNG', type: 'money' }, { label: 'MUA VẬT TƯ', type: 'money' }, { label: 'CHƯA TÁCH CÔNG/VẬT TƯ', type: 'money', width: 20 }, { label: 'NGƯỜI SỬA', width: 20 }, { label: 'GHI CHÚ', width: 24 }],
        rows: log, totals: log.length ? ['Tổng', '', '', '', sum(log, function (x) { return x[4]; }), sum(log, function (x) { return x[5]; }), sum(log, function (x) { return x[6]; }), '', ''] : null };
      return snap;
    },
  });

  /* ================= Dự kiến lợi nhuận (gói D) ================= */
  var FC_COST = [
    ['cRent', 'Tiền thuê nhà'], ['depRefund', 'Hoàn cọc', 1], ['cElec', 'Điện'], ['cWater', 'Nước'], ['cNet', 'Mạng'], ['cWaste', 'Phí thu rác'], ['cEnv', 'Phí môi trường'], ['cLift', 'Phí bảo trì thang máy'],
    ['mgr', 'Lương quản lý'], ['gm', 'Lương quản lý tổng'], ['opsHead', 'Lương trưởng phòng vận hành'], ['lead', 'Lương trưởng nhóm vận hành'], ['source', 'Lương nhân viên nguồn'], ['sales', 'Lương NV phòng kinh doanh'],
    ['cleanStaff', 'Lương vệ sinh'], ['acct', 'Lương kế toán'], ['repairStaff', 'Lương sửa chữa'], ['security', 'Lương bảo vệ'], ['office', 'Thuê và DV văn phòng'], ['mkt', 'Phí marketing'], ['repair', 'Sửa chữa'], ['other', 'Các chi phí khác'], ['equip', 'Mua sắm thiết bị', 1],
  ];
  var REV = ['revConfirmed', 'revDraft', 'revUnbilled', 'revForfeit'], SVC_KEYS = ['rent', 'elec', 'water', 'clean', 'net', 'ev', 'lift', 'wash'];
  var fcDefs = { revConfirmed: leaf('Doanh thu hóa đơn đã xác nhận'), revDraft: leaf('Hóa đơn nháp chưa xác nhận'), revUnbilled: leaf('Phòng chưa lập hóa đơn (ước tính)'), revForfeit: leaf('Cọc khách bỏ không ở'), revTotal: der('Tổng doanh thu dự kiến'),
    depIn: leaf('Cọc mới'), depInPL: leaf('Cọc mới tính vào lợi nhuận (dòng tiền)') };
  FC_COST.forEach(function (c) { fcDefs[c[0]] = leaf(c[1]); });
  Object.assign(fcDefs, { tcp: der('Tổng chi phí'), gv: der('Giá vốn (GV)'), profit: der('Tổng lợi nhuận'), lnrDt: der('LNR / DT', 'pct'), lnrGv: der('LNR / GV', 'pct'),
    paid: leaf('Tổng doanh thu hóa đơn đã thu'), debt: leaf('Công nợ hóa đơn'), collectRate: der('Tỷ lệ đã thu', 'pct'), nrPaid: leaf('Tổng doanh thu phòng mới đã thu'), nrDebt: leaf('Công nợ phòng mới') });
  function pendingRecs(p, b) {
    var out = {};
    var open = TH.db.expenses.filter(function (e) { return e.period === p && e.buildingId === b && (e.status === 'pending' || e.status === 'draft'); });
    open.forEach(function (e) {
      /* Phiếu chờ duyệt trùng số chứng từ + số tiền với phiếu lập trước: liệt kê để rà soát, không cộng vào dự kiến */
      var dup = open.find(function (x) { return x !== e && x.category === e.category && x.docNo === e.docNo && x.amount === e.amount && x.id < e.id; });
      var o = { status: e.status, docNo: e.docNo, buildingId: e.buildingId, text: 'Chờ duyệt · ' + e.description + ' · ' + e.docNo, dupOf: dup ? dup.id : null };
      var add = function (k, a) { (out[k] = out[k] || []).push(srcObj('expense', e.id, dup ? 0 : a, o)); };
      if (e.category === 'utility') { var el = e.elec !== undefined ? e.elec : Math.round(e.amount * 0.8); add('cElec', el); add('cWater', e.amount - el); return; }
      add(EXP_KEY[e.category] || 'other', e.amount);
    });
    return out;
  }
  function fcBuilding(p, b, mode) {
    var act = C.pnl(p, b, 'tong'), pv = prevP(p), prev = pv ? C.pnl(pv, b, 'tong') : null, open = p >= TH.CURRENT_PERIOD, pend = open ? pendingRecs(p, b) : {}, src = {};
    src.revConfirmed = []; SVC_KEYS.forEach(function (k) { src.revConfirmed = src.revConfirmed.concat(pnlSrc(act.src[k]).map(function (x) { x.text = (x.text ? x.text + ' · ' : '') + k; return x; })); });
    src.revDraft = C.invoicesIn(p, b).filter(function (i) { return i.status === 'draft'; }).map(function (i) { return srcObj('invoice', i.id, i.total, { room: i.roomId, status: 'draft', invPeriod: i.period, text: 'Hóa đơn nháp — dự kiến' }); });
    src.revUnbilled = !open ? [] : TH.db.contracts.filter(function (c) { return c.buildingId === b && c.status === 'active' && C.occupancy(c, p).days > 0 && !TH.db.invoices.some(function (i) { return i.roomId === c.roomId && i.period === p; }); }).map(function (c) {
      var occ = C.occupancy(c, p), last = TH.db.invoices.filter(function (i) { return i.roomId === c.roomId && i.status === 'confirmed' && i.period < p; }).sort(function (a, z) { return a.period < z.period ? 1 : -1; })[0];
      var util = last ? sum(last.lines.filter(function (l) { return l.type === 'elec' || l.type === 'water'; }), function (l) { return l.amount; }) : 0, fees = sum(c.fees || [], function (f) { return f.price * f.qty; });
      return srcObj('estimate', c.id, Math.round(c.rent * occ.k) + fees + util, { room: c.roomId, text: 'Tiền phòng ' + occ.days + ' ngày ở + phí cố định ' + F.money(fees) + ' + điện nước kỳ gần nhất ' + F.money(util) });
    });
    src.revForfeit = pnlSrc(act.src.depForfeit);
    src.depIn = pnlSrc(act.src.depIn);
    src.depInPL = mode === 'tong' ? pnlSrc(act.src.depIn) : [];
    FC_COST.forEach(function (c) {
      var k = c[0];
      if (c[2] && mode === 'kd') { src[k] = []; return; }
      if (act[k]) src[k] = pnlSrc(act.src[k]);
      else if (pend[k]) src[k] = pend[k];
      else if (open && k === 'cRent' && act.rentAccrual) src[k] = [srcObj('lease', act.accrualLease, act.rentAccrual, { text: 'Tiền thuê tòa dự kiến theo HĐ thuê tòa — phiếu chi chưa có' })];
      else if (open && prev && prev[k] && !c[2]) src[k] = [srcObj('estimate', 'KY-' + pv, prev[k], { text: 'Ước tính theo số đã ghi nhận kỳ ' + F.period(pv) + ' (kỳ này chưa có chứng từ)' })];
      else src[k] = [];
    });
    var conf = C.invoicesIn(p, b).filter(function (i) { return i.status === 'confirmed'; });
    src.paid = conf.map(function (i) { return srcObj('invoice', i.id, C.paid(i.id), { room: i.roomId, status: i.status, text: 'Đã thu của hóa đơn ' + F.money(i.total) }); }).filter(function (x) { return x.amount; });
    src.debt = conf.map(function (i) { return srcObj('invoice', i.id, C.debt(i), { room: i.roomId, status: i.status, text: 'Còn nợ của hóa đơn ' + F.money(i.total) }); }).filter(function (x) { return x.amount; });
    var nr = C.newRooms(p, b).filter(function (x) { return x.invoice && x.invoice.status === 'confirmed'; });
    src.nrPaid = nr.map(function (x) { return srcObj('invoice', x.invoice.id, C.paid(x.invoice.id), { room: x.room.id, text: 'Phòng mới · đã thu' }); }).filter(function (x) { return x.amount; });
    src.nrDebt = nr.map(function (x) { return srcObj('invoice', x.invoice.id, C.debt(x.invoice), { room: x.room.id, text: 'Phòng mới · còn nợ' }); }).filter(function (x) { return x.amount; });
    return { src: src };
  }
  var costKeys = FC_COST.map(function (c) { return c[0]; });
  R.register('RPT-FC', {
    label: 'Dự kiến lợi nhuận', group: 'fin', tier: 'D', per: 'set', perm: 'report.all', tpl: 'BẢNG DỰ KIẾN LỢI NHUẬN CÁC THÁNG.xlsx · sheet Tháng 9.2026',
    desc: 'Doanh thu, chi phí và lợi nhuận dự kiến của kỳ (kinh doanh và dòng tiền), LNR/DT, LNR/GV, tiến độ thu.',
    warn: ['DRAFT_INV', 'UNBILLED', 'PENDING_EXP', 'POOL_DRAFT', 'PAYROLL', 'FORMULA'],
    modes: ['kd', 'tong'], modeLabels: { kd: 'Lợi nhuận kinh doanh', tong: 'Lợi nhuận dòng tiền' },
    mdefs: fcDefs,
    formulas: {
      revTotal: sumF(REV.map(function (k) { return S(k); })),
      tcp: sumF(costKeys.map(function (k) { return S(k); })),
      gv: sumF(['cRent', 'cElec', 'cWater', 'cNet', 'cWaste', 'cEnv', 'cLift', 'equip'].map(function (k) { return S(k); })),
      profit: sumF([S('revTotal'), S('depInPL'), S('tcp', -1)]),
      lnrDt: ratioF([S('profit')], [S('revTotal')]), lnrGv: ratioF([S('profit')], [S('gv')]), collectRate: ratioF([S('paid')], [S('paid'), S('debt')]),
    },
    filters: {
      revConfirmed: 'Tiền phòng + dịch vụ của hóa đơn đã xác nhận (cùng nguồn RPT-05).', revDraft: 'Tổng hóa đơn nháp của kỳ — dự kiến, chưa xác nhận.', revUnbilled: 'Kỳ đang mở: hợp đồng đang ở chưa có hóa đơn, ước tính tiền phòng theo ngày ở + phí cố định + điện nước kỳ gần nhất.',
      revForfeit: 'Bút toán giữ cọc khách bỏ (đã xác nhận).', depIn: 'Cọc nhận đã xác nhận trong kỳ (chỉ theo dõi ở chế độ kinh doanh).', depInPL: 'Chế độ dòng tiền: cọc mới cộng vào lợi nhuận; chế độ kinh doanh = 0.',
      cRent: 'Đã duyệt → chờ duyệt → theo HĐ thuê tòa → ước tính kỳ trước (kỳ đang mở).', paid: 'Phiếu thu đã xác nhận của hóa đơn kỳ.', debt: 'Phần còn nợ của hóa đơn kỳ.',
      nrPaid: 'Hóa đơn đầu của phòng mới trong kỳ: đã thu.', nrDebt: 'Hóa đơn đầu của phòng mới: còn nợ.',
    },
    build: function (p, ids) {
      var snap = makeSnap('RPT-FC', p, ids, function (b, mode) { return fcBuilding(p, b, mode); });
      var cols = [{ key: R.keyOf(ids), label: ids.length > 1 ? 'TỔNG' : C.building(ids[0]).short }].concat(ids.length > 1 ? ids.map(function (b) { return { key: R.keyOf([b]), label: C.building(b).short }; }) : []);
      var lines = function (mode) {
        var out = [{ t: 'sec', label: 'Doanh thu' }, { t: 'm', metric: 'revTotal', label: fcDefs.revTotal.label, strong: true }];
        REV.forEach(function (k) { out.push({ t: 'm', metric: k, label: fcDefs[k].label, indent: true }); });
        out.push({ t: 'm', metric: 'depIn', label: fcDefs.depIn.label + (mode === 'kd' ? ' (chỉ theo dõi)' : ' (cộng vào lợi nhuận)') });
        out.push({ t: 'sec', label: 'Chi phí' });
        FC_COST.forEach(function (c) { if (!(c[2] && mode === 'kd')) out.push({ t: 'm', metric: c[0], label: c[1], indent: true }); });
        out.push({ t: 'm', metric: 'tcp', label: fcDefs.tcp.label, strong: true }, { t: 'm', metric: 'gv', label: fcDefs.gv.label });
        out.push({ t: 'sec', label: 'Kết quả' }, { t: 'm', metric: 'profit', label: fcDefs.profit.label, strong: true, result: true }, { t: 'r', metric: 'lnrDt', label: 'LNR / DT' }, { t: 'r', metric: 'lnrGv', label: 'LNR / GV' });
        out.push({ t: 'sec', label: 'Tiến độ thu' }, { t: 'm', metric: 'paid', label: fcDefs.paid.label }, { t: 'm', metric: 'debt', label: fcDefs.debt.label }, { t: 'r', metric: 'collectRate', label: 'Tỷ lệ đã thu' }, { t: 'm', metric: 'nrPaid', label: fcDefs.nrPaid.label }, { t: 'm', metric: 'nrDebt', label: fcDefs.nrDebt.label });
        return out;
      };
      var asOf = p >= TH.CURRENT_PERIOD ? 'tính đến ngày ' + F.date(TH.TODAY) : 'số thực tế';
      snap.sheets = [
        { id: 'kd', name: 'DU KIEN LN KINH DOANH', title: 'BẢNG DỰ KIẾN LỢI NHUẬN KINH DOANH THÁNG ' + mm(p) + ' · ' + asOf, kind: 'stmt', mode: 'kd', cols: cols, lines: lines('kd') },
        { id: 'tong', name: 'DU KIEN LN DONG TIEN', title: 'BẢNG DỰ KIẾN LỢI NHUẬN DÒNG TIỀN THÁNG ' + mm(p) + ' · ' + asOf, kind: 'stmt', mode: 'tong', cols: cols, lines: lines('tong') },
        srcSheet('tong')];
      return snap;
    },
  });

  /* ================= Phân khúc khách hàng (gói D) ================= */
  function segOf(k) { var o = (k && k.occupation || '').trim(); return !o ? 'unknown' : /sinh viên|học sinh/i.test(o) ? 'student' : 'worker'; }
  var SEG_LABEL = { student: 'Sinh viên', worker: 'Người đi làm', unknown: 'Chưa cập nhật nghề nghiệp' };
  R.register('RPT-SEG', {
    label: 'Phân khúc khách hàng', group: 'cus', tier: 'D', per: 'set', tpl: 'Mẫu TIMEHOUSE theo yêu cầu báo cáo.xlsx (dòng “báo cáo phân khúc khách hàng”)',
    desc: 'Tỷ lệ khách sinh viên và người đi làm theo tòa, theo nghề nghiệp trên hồ sơ khách; giá thuê bình quân theo phân khúc.',
    warn: ['FORMULA'],
    mdefs: {
      n: leaf('Khách đang thuê', 'count'), student: leaf('Sinh viên', 'count'), worker: leaf('Người đi làm', 'count'), unknown: leaf('Chưa cập nhật nghề nghiệp', 'count'), known: der('Khách có nghề nghiệp', 'count'),
      pStudent: der('% sinh viên', 'pct'), pWorker: der('% người đi làm', 'pct'), rentStudent: leaf('Tổng giá thuê khách sinh viên'), rentWorker: leaf('Tổng giá thuê người đi làm'),
      avgStudent: der('Giá thuê BQ sinh viên', 'money'), avgWorker: der('Giá thuê BQ người đi làm', 'money'),
    },
    formulas: { known: sumF([S('student'), S('worker')]), pStudent: ratioF([S('student')], [S('known')]), pWorker: ratioF([S('worker')], [S('known')]), avgStudent: ratioF([S('rentStudent')], [S('student')]), avgWorker: ratioF([S('rentWorker')], [S('worker')]) },
    filters: { n: 'Khách chính của hợp đồng có ngày ở trong kỳ.', student: 'Nghề nghiệp trên hồ sơ khách chứa “sinh viên” hoặc “học sinh”.', worker: 'Có nghề nghiệp, không phải sinh viên/học sinh.', unknown: 'Hồ sơ khách chưa ghi nghề nghiệp — không tính vào tỷ lệ.', rentStudent: 'Giá thuê trên hợp đồng của khách sinh viên.', rentWorker: 'Giá thuê trên hợp đồng của khách đi làm.' },
    build: function (p, ids) {
      var jobs = {}, list = [];
      var snap = makeSnap('RPT-SEG', p, ids, function (b) {
        var src = { n: [], student: [], worker: [], unknown: [], rentStudent: [], rentWorker: [] };
        TH.db.contracts.filter(function (c) { return c.buildingId === b && c.status !== 'draft' && c.status !== 'cancelled' && C.occupancy(c, p).days > 0; }).forEach(function (c) {
          var k = C.customer(c.customerId), sg = segOf(k), o = { room: c.roomId, customerId: c.customerId, text: (k ? k.name : '') + ' · ' + ((k && k.occupation) || 'chưa ghi nghề nghiệp') };
          src.n.push(srcObj('contract', c.id, 1, o)); src[sg].push(srcObj('contract', c.id, 1, o));
          if (sg === 'student') src.rentStudent.push(srcObj('contract', c.id, c.rent, o)); if (sg === 'worker') src.rentWorker.push(srcObj('contract', c.id, c.rent, o));
          var j = (k && k.occupation || '').trim() || SEG_LABEL.unknown; jobs[j] = jobs[j] || { n: 0, seg: sg }; jobs[j].n++;
          list.push([k ? k.name : '', c.roomId, C.building(b).short, (k && k.occupation) || '', SEG_LABEL[sg], c.rent]);
        });
        return { src: src };
      });
      var total = list.length;
      snap.sheets = [
        { id: 'pk', name: 'PHAN KHUC KHACH', title: 'BÁO CÁO PHÂN KHÚC KHÁCH HÀNG THÁNG ' + mm(p), kind: 'grid', mode: 'tong', rowLabel: 'TÒA', rows: rowsOf(ids), metrics: ['n', 'student', 'worker', 'unknown', 'pStudent', 'pWorker', 'avgStudent', 'avgWorker'], note: 'Tỷ lệ tính trên khách đã có nghề nghiệp.' },
        { id: 'nghe', name: 'THEO NGHE NGHIEP', title: 'Khách theo nghề nghiệp', kind: 'list', list: 'nghe' },
        { id: 'ds', name: 'DS KHACH', title: 'Danh sách khách theo phân khúc', kind: 'list', list: 'ds' },
        srcSheet('tong')];
      snap.lists.nghe = { columns: [{ label: 'Nghề nghiệp', width: 24 }, { label: 'Phân khúc', width: 20 }, { label: 'Số khách', type: 'number' }, { label: 'Tỷ trọng', type: 'pct' }],
        rows: Object.keys(jobs).sort(function (a, b) { return jobs[b].n - jobs[a].n; }).map(function (j) { return [j, SEG_LABEL[jobs[j].seg], jobs[j].n, total ? jobs[j].n / total : 0]; }) };
      snap.lists.ds = { columns: [{ label: 'Khách', width: 24 }, { label: 'Phòng', width: 12 }, { label: 'Tòa', width: 14 }, { label: 'Nghề nghiệp', width: 22 }, { label: 'Phân khúc', width: 18 }, { label: 'Giá thuê', type: 'money' }], rows: list };
      return snap;
    },
  });
})();
