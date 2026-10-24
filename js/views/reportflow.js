/* CR-RPT-02 — Báo cáo theo mẫu Excel (docs/TIMEHOUSE_REPORT_WORKFLOW_PLAN.md).
 * Luồng: danh sách bản đã tạo → chọn loại/tháng/tòa → xem trước (draft) → xác nhận → bản lưu bất biến (ReportRun) → tải Excel / tạo phiên bản mới.
 * Áp dụng RPT-04 (mỗi tòa một bản) và RPT-05 (một bản tổng hợp các tòa chọn). Số liệu tính một lần bằng C.pnl / C.shareSplit, preview và Excel
 * dựng từ cùng snapshot; mọi ô số truy được công thức → thành phần → nguồn (TH.reports.trace). */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc, S = 'REPORTS';
  var ENGINE = 'RPT-ENGINE v1 · pnl.js schema 12';
  var TYPES = {
    'RPT-04': { label: 'Doanh thu theo tòa (mẫu G1)', tpl: 'MAU-G1 · v1 (G1.31.8.26.xlsx)', per: 'building' },
    'RPT-05': { label: 'Báo cáo kinh doanh tháng', tpl: 'MAU-BCKD', per: 'set' },
  };
  /* Công thức các chỉ tiêu dẫn xuất — đúng finalize() của js/pnl.js */
  var DEF = {
    total: { text: 'DT tiền phòng + DT dịch vụ + cọc phòng mới + cọc khách bỏ − hoàn cọc', parts: [['rent', 1], ['svc', 1], ['depIn', 1], ['depForfeit', 1], ['depRefund', -1]] },
    svc: { text: 'Điện + nước + vệ sinh + mạng + xe điện + thang máy/DV khác + máy giặt', parts: [['elec', 1], ['water', 1], ['clean', 1], ['net', 1], ['ev', 1], ['lift', 1], ['wash', 1]] },
    gdv: { text: 'Giá gốc dịch vụ: điện + nước + mạng + thu rác + môi trường + thang máy', parts: [['cElec', 1], ['cWater', 1], ['cNet', 1], ['cWaste', 1], ['cEnv', 1], ['cLift', 1]] },
    gv: { text: 'Tiền thuê nhà + mua sắm thiết bị + giá gốc dịch vụ', parts: [['cRent', 1], ['equip', 1], ['gdv', 1]] },
    salary: { text: 'Tổng các dòng lương', parts: [['mgr', 1], ['gm', 1], ['opsHead', 1], ['lead', 1], ['source', 1], ['sales', 1], ['cleanStaff', 1], ['acct', 1], ['repairStaff', 1], ['security', 1]] },
    cpbh: { text: 'Lương + thuê/DV văn phòng + marketing/hoa hồng + sửa chữa + chi phí khác', parts: [['salary', 1], ['office', 1], ['mkt', 1], ['repair', 1], ['other', 1]] },
    tcp: { text: 'Giá vốn + chi phí bán hàng', parts: [['gv', 1], ['cpbh', 1]] },
    lng: { text: 'Doanh thu − giá vốn', parts: [['total', 1], ['gv', -1]] },
    lnr: { text: 'Doanh thu − tổng chi phí', parts: [['total', 1], ['tcp', -1]] },
  };
  var RATIO = { lnr_dt: ['lnr', 'total'], lng_dt: ['lng', 'total'], lnr_gv: ['lnr', 'gv'], lnr_lng: ['lnr', 'lng'], cp_lng: ['tcp', 'lng'], gv_dt: ['gv', 'total'], cpbh_dt: ['cpbh', 'total'], tcp_dt: ['tcp', 'total'], luong_cpbh: ['salary', 'cpbh'], hh_cpbh: ['mkt', 'cpbh'], cpk_cpbh: ['other', 'cpbh'], dtdv_gdv: ['svc', 'gdv'], dtn_gtn: ['rent', 'cRent'] };
  var EXTRA_LABEL = { salary: 'Tổng lương', gdv: 'Giá gốc dịch vụ (tổng)' };
  /* Quy tắc lọc nguồn của từng chỉ tiêu lá */
  var FILTER = {
    rent: 'Dòng tiền phòng của hóa đơn ĐÃ XÁC NHẬN kỳ này (đóng nhiều tháng: chỉ phần tháng đầu) + phần phân bổ từ hóa đơn trả trước kỳ trước + tiền phòng phát sinh đã thu đủ + giảm trừ (số âm). Hóa đơn nháp không tính.',
    elec: 'Dòng điện theo chỉ số + dòng điện chung phân bổ của hóa đơn đã xác nhận (quy tắc schema 12: điện chung vào doanh thu điện).',
    water: 'Dòng nước của hóa đơn đã xác nhận.', net: 'Dòng Internet (mã NET) của hóa đơn đã xác nhận.', ev: 'Dòng gửi xe điện mã PARK (bộ phí cũ) của hóa đơn đã xác nhận.',
    clean: 'Phí dịch vụ chung chia đều 3 phần (vệ sinh / thang máy / máy giặt) như sổ của khách.', wash: 'Phần máy giặt của phí dịch vụ chung chia 3.',
    lift: 'Phần thang máy của phí DV chung chia 3 + phí phát sinh + phụ thu (số dương).',
    depIn: 'Bút toán cọc nhận (đã xác nhận) của kỳ. Chế độ Kinh doanh loại khỏi P&L (R-01).', depForfeit: 'Bút toán giữ cọc khách bỏ (đã xác nhận).', depRefund: 'Bút toán hoàn cọc đã chi. Chế độ Kinh doanh loại khỏi P&L.',
    cntNew: 'Số HĐ có NGÀY BẮT ĐẦU HĐ trong kỳ (định nghĩa P&L). Khác tab Phòng mới ở PAY-02: tab đó lấy ngày bắt đầu tính tiền và có cả dòng giữ chỗ — không đồng nhất hai số.',
    cntBroke: 'Ca phá HĐ ghi nhận trong kỳ ∪ bút toán giữ cọc vi phạm (không đếm trùng cùng phòng).', cntVacant: 'Phòng không có người thuê tại CUỐI KỲ (sự kiện trước ngày 1 tháng sau), loại phòng đang sửa.',
    cRent: 'Chi phí tiền thuê tòa đã duyệt. Chế độ Kinh doanh: chưa duyệt thì tính DỰ KIẾN theo HĐ thuê tòa (R-07).', equip: 'Chi phí mua sắm thiết bị đã duyệt. Chế độ Kinh doanh loại khỏi P&L (R-03).',
    cElec: 'Phần điện của hóa đơn điện nước công tơ tổng đã duyệt.', cWater: 'Phần nước của hóa đơn điện nước công tơ tổng đã duyệt.',
    mgr: 'Lương HS của QL tòa (SAL-01) — HS chưa chuẩn hóa thu trước nhiều tháng (BILL-Q7).', lead: 'Lương trưởng nhóm theo số phòng.',
  };
  var KIND = { invoice: ['Hóa đơn', 'teal'], prepaid: ['Trả trước', 'teal'], arising: ['Tiền phòng phát sinh', 'teal'], deposit: ['Cọc', 'info'], expense: ['Chi phí', 'warning'], pool: ['Phân bổ chung', 'neutral'], payroll: ['Lương', 'draft'], contract: ['Hợp đồng', 'teal'], room: ['Phòng', 'neutral'], break: ['Phá HĐ', 'danger'], lease: ['HĐ thuê tòa', 'neutral'] };
  var TOL = 1; // đồng — chênh lệch làm tròn cho phép

  function deep(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }
  function hash(str) { var h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(16); }
  function keyOf(ids) { return 'S:' + ids.slice().sort().join('+'); }
  function mm(p) { return String(+p.slice(5)) + '/' + p.slice(0, 4); }
  function groupOf(bId) { return (TH.db.buildingGroups || []).find(function (g) { return g.buildings.indexOf(bId) > -1; }) || null; }
  function now() { var d = new Date(); return TH.TODAY + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  /* Route theo plan: #/demo/reports · /new · /preview/<draftId> · /view/<runId> (không mã hóa dấu /) */
  function href(sub) { return '#/demo/reports' + (sub ? '/' + sub : ''); }
  function goSub(sub) { TH.router.go(href(sub)); }
  function canType(t) { return !!TYPES[t] && TH.canScreen(t); }
  function allowedIds() { return TH.roleScope().slice(); }
  function canSee(run) { return canType(run.type) && run.buildingIds.every(function (b) { return allowedIds().indexOf(b) > -1; }); }

  /* ---------- Dựng snapshot cho 1 item ---------- */
  function colVals(v) {
    var o = {};
    TH.PNL_LINES.forEach(function (l) { if (l.k) o[l.k] = v[l.k]; });
    o.salary = v.salary; o.gdv = v.gdv;
    TH.PNL_RATIOS.forEach(function (r) { var x = v.ratios[r.k]; o['r:' + r.k] = isFinite(x) ? x : null; });
    return o;
  }
  function colMeta(v) {
    return { accrued: v.accrued || 0, accrualLease: v.accrualLease || null, hidden: { depIn: v.depInHidden || 0, depRefund: v.depRefundHidden || 0, equip: v.equipHidden || 0 }, rooms: v.rooms };
  }
  function hasBasis(l) {
    if (l.type === 'common' || l.type === 'adjust') return !!l.basis;
    if (l.type === 'rent' && l.k !== undefined && l.k !== 1) return l.raw !== undefined;
    return true;
  }
  function lineContrib(inv, k) {
    var out = [];
    inv.lines.forEach(function (l) {
      var lk = C.pnlLineKey(l), amt = null;
      if (l.type === 'rent' && (l.months || 1) > 1) { if (k === 'rent') amt = C.rentShare(l).first; }
      else if (lk === 'svcSplit') { var a = Math.round(l.amount / 3); if (k === 'clean' || k === 'lift') amt = a; if (k === 'wash') amt = l.amount - 2 * a; }
      else if (lk === k) amt = l.amount;
      if (amt === null) return;
      out.push({ type: l.type, code: l.code || null, name: l.name, qty: l.qty, unit: l.unit, price: l.price, amount: l.amount, contrib: amt, k: l.k, days: l.days, base: l.base, from: l.from, to: l.to, raw: l.raw, roundTo: l.roundTo, rule: l.rule || null,
        months: l.months, cover: l.cover ? l.cover.slice() : null, basis: deep(l.basis) || null, refId: l.refId || null, split: lk === 'svcSplit', missingBasis: !hasBasis(l) });
    });
    return out;
  }
  function enrich(s, k) {
    var o = { kind: s.kind, id: s.id, room: s.room || null, amount: s.amount, text: s.text || '' };
    if (s.kind === 'invoice') { var inv = C.invoice(s.id); if (inv) { o.invPeriod = inv.period; o.status = inv.status; o.total = inv.total; o.lines = lineContrib(inv, k); } }
    if (s.kind === 'prepaid') Object.assign(o, { invPeriod: s.invoicePeriod, cover: (s.cover || []).slice(), lineTotal: s.lineTotal, first: s.first, later: s.later, months: s.months });
    if (s.kind === 'expense') { var e = TH.db.expenses.find(function (x) { return x.id === s.id; }); if (e) Object.assign(o, { category: e.category, catLabel: TH.EXPENSE_CATS[e.category] || e.category, docNo: e.docNo, date: e.date, status: e.status, approvedBy: e.approvedBy, buildingId: e.buildingId, period: e.period }); }
    if (s.kind === 'deposit') { var d = (TH.db.deposits || []).find(function (x) { return x.id === s.id; }); if (d) Object.assign(o, { type: d.type, date: d.date, breach: !!d.breach, contractId: d.contractId || null, customerId: d.customerId || null, status: d.status }); }
    if (s.kind === 'arising') { var a = (TH.db.arisingRent || []).find(function (x) { return x.id === s.id; }); if (a) Object.assign(o, { date: a.date, paidFull: a.paidFull }); }
    if (s.kind === 'break') { var bc = (TH.db.breakCases || []).find(function (x) { return x.id === s.id; }); if (bc) Object.assign(o, { contractId: bc.contractId, at: bc.at, reason: TH.BREAK_REASONS[bc.reason] || bc.reason }); }
    if (s.kind === 'payroll') o.restricted = 'salary';
    var sourceRecord = s.kind === 'invoice' || s.kind === 'prepaid' ? C.invoice(s.id) : s.kind === 'expense' ? e : s.kind === 'deposit' ? d : s.kind === 'arising' ? a : null;
    if (sourceRecord && sourceRecord.sourceBasis) {
      o.sourceBasis = deep(sourceRecord.sourceBasis);
      if (TH.dataset) o.sourceRule = deep(TH.dataset.rule(sourceRecord.sourceBasis.ruleId));
    }
    return o;
  }
  function srcCopy(v) { var out = {}; Object.keys(v.src).forEach(function (k) { out[k] = v.src[k].map(function (s) { return enrich(s, k); }); }); return out; }
  function stmtLines(compact) {
    var COMPACT = ['total', 'depIn', 'depRefund', 'rent', 'svc', 'cRent', 'gv', 'cpbh', 'tcp', 'lng', 'lnr'], CR = ['lnr_dt', 'lng_dt', 'gv_dt', 'cpbh_dt'];
    var out = [];
    TH.PNL_LINES.forEach(function (l) {
      if (compact && !(l.sec || (l.k && COMPACT.indexOf(l.k) > -1))) return;
      if (l.sec) out.push({ t: 'sec', label: l.sec }); else if (l.grp) out.push({ t: 'grp', label: l.grp });
      else out.push({ t: 'm', metric: l.k, label: l.label, labelKd: l.labelKd || null, indent: !!l.indent, strong: !!l.strong, count: !!l.count, result: !!l.result });
    });
    out.push({ t: 'sec', label: 'Tỷ lệ' });
    TH.PNL_RATIOS.forEach(function (r) { if (!compact || CR.indexOf(r.k) > -1) out.push({ t: 'r', metric: 'r:' + r.k, label: r.label, times: !!r.times }); });
    return out;
  }
  function buildItem(type, p, ids, tplId) {
    ids = ids.slice().sort();
    var tpl = TH.db.reportTemplates.find(function (t) { return t.id === tplId && t.report === 'RPT-05'; });
    var snap = { type: type, period: p, buildingIds: ids, engine: ENGINE, schema: TH.DATA_SCHEMA, template: type === 'RPT-04' ? TYPES[type].tpl : (tpl ? tpl.id + ' · v' + tpl.version : 'MAU-BCKD · v1'), compact: !!(tpl && tpl.compact),
      labels: {}, groups: {}, cols: {}, vals: {}, meta: {}, src: {}, notes: {}, sheets: [], share: null, pool: null, rules: deep(TH.billRules()), locked: TH.periodLocked(p) };
    if (TH.db.dataset && TH.dataset) { snap.datasetVersion = TH.db.dataset.version; snap.datasetRules = deep(TH.dataset.rules); }
    ids.forEach(function (b) { var bb = C.building(b), g = groupOf(b); snap.labels[b] = { short: bb.short, name: bb.name, group: g ? g.id : null }; if (g) snap.groups[g.id] = { short: g.short, name: g.name }; });
    var modes = type === 'RPT-04' ? ['tong'] : ['kd', 'tong'];
    var addCol = function (mode, set, label) {
      var key = keyOf(set), v = C.pnl(p, set.length === 1 ? set[0] : set, mode);
      snap.cols[key] = { ids: set.slice().sort(), label: label };
      snap.vals[mode][key] = colVals(v); snap.meta[mode][key] = colMeta(v);
      if (set.length === 1) { snap.src[mode][set[0]] = srcCopy(v); if (type === 'RPT-04') { var n = {}; Object.keys(v.notes).forEach(function (k) { if (v.notes[k].length) n[k] = v.notes[k].slice(); }); snap.notes[key] = n; } }
      if (set.length === 1 && mode === 'tong' && type === 'RPT-04') {
        var share = C.shareSplit(p, set[0], v);
        snap.share = { rows: share.rows.map(function (r) { return { holder: r.holder.name, ratio: r.ratio, capital: r.capital, lng: r.lng, lnr: r.lnr, total: r.total }; }), ratio: share.ratio, capital: share.capital, lng: share.lng, lnr: share.lnr, total: share.total, base: { cRent: v.cRent, lng: v.lng, lnr: v.lnr } };
        if (v.pool) snap.pool = { status: v.pool.status, portfolioRooms: v.pool.portfolioRooms, rooms: v.rooms, rule: v.pool.rule || 'PB-01 · theo số phòng', lines: deep(v.pool.lines) };
      }
    };
    modes.forEach(function (mode) {
      snap.vals[mode] = {}; snap.meta[mode] = {}; snap.src[mode] = {};
      ids.forEach(function (b) { addCol(mode, [b], snap.labels[b].short); });
      if (ids.length > 1) addCol(mode, ids, 'TỔNG');
      if (type === 'RPT-05' && mode === 'tong') Object.keys(snap.groups).forEach(function (gid) { var gi = ids.filter(function (b) { return snap.labels[b].group === gid; }); if (gi.length > 1) addCol(mode, gi, 'TỔNG ' + snap.groups[gid].short); });
    });
    var m = +p.slice(5), lines = stmtLines(snap.compact);
    if (type === 'RPT-04') {
      var b = ids[0], sh = snap.labels[b].short;
      snap.sheets.push({ id: 'bc', name: 'BAO CAO THANG ' + m, title: 'BÁO CÁO KINH DOANH ' + sh.toUpperCase() + ' THÁNG ' + mm(p), mode: 'tong', kind: 'stmt', notesCol: true, cols: [{ key: keyOf([b]), label: 'Tháng ' + mm(p) }], lines: stmtLines(false) });
      snap.sheets.push({ id: 'share', name: 'CHIA CO PHAN', title: 'BẢNG CHIA CỔ PHẦN ' + sh.toUpperCase() + ' · kỳ ' + F.period(p), kind: 'share' });
      snap.sheets.push({ id: 'src', name: 'NGUON SO LIEU', title: 'Nguồn từng dòng · ' + snap.labels[b].name + ' · kỳ ' + F.period(p), kind: 'src', mode: 'tong' });
    } else {
      var all = keyOf(ids), bcols = ids.map(function (b) { return { key: keyOf([b]), label: snap.labels[b].short }; });
      snap.sheets.push({ id: 'kd', name: 'BAO CAO KINH DOANH T' + m, title: 'BÁO CÁO KINH DOANH THÁNG ' + mm(p), mode: 'kd', kind: 'stmt', cols: [{ key: all, label: 'TỔNG' }].concat(bcols), lines: lines });
      snap.sheets.push({ id: 'tong', name: 'BAO CAO TONG T' + m, title: 'BÁO CÁO TỔNG THÁNG ' + mm(p), mode: 'tong', kind: 'stmt', cols: [{ key: all, label: 'TỔNG' }].concat(bcols), lines: lines });
      Object.keys(snap.groups).forEach(function (gid) {
        var gi = ids.filter(function (x) { return snap.labels[x].group === gid; }), g = snap.groups[gid];
        snap.sheets.push({ id: 'g:' + gid, name: 'BC DT T' + m + ' ' + g.short.toUpperCase(), title: 'BÁO CÁO DOANH THU THÁNG ' + mm(p) + ' · ' + g.name.toUpperCase() + ' (' + gi.length + ' tòa đã chọn)', mode: 'tong', kind: 'stmt', group: gid,
          cols: [{ key: keyOf(gi), label: 'TỔNG' }].concat(gi.map(function (x) { return { key: keyOf([x]), label: snap.labels[x].short }; })), lines: lines });
      });
      snap.sheets.push({ id: 'src', name: 'NGUON SO LIEU', title: 'Nguồn số liệu chế độ Tổng · kỳ ' + F.period(p), kind: 'src', mode: 'tong' });
    }
    snap.sheets.push({ id: 'calc', name: 'CONG THUC', title: 'Công thức, quy tắc lọc và căn cứ tính', kind: 'calc' });
    return snap;
  }

  /* ---------- Kiểm tra số liệu (lỗi chặn) & cảnh báo nghiệp vụ ---------- */
  function leafExpected(snap, mode, b, k) {
    var src = (snap.src[mode][b] || {})[k] || [], meta = snap.meta[mode][keyOf([b])];
    var line = TH.PNL_LINES.find(function (l) { return l.k === k; }) || {};
    if (line.count) return src.length;
    if (mode === 'kd' && (k === 'depIn' || k === 'depRefund' || k === 'equip')) return 0;
    var s = src.reduce(function (a, x) { return a + (x.amount || 0); }, 0);
    if (k === 'cRent' && mode === 'kd') s += meta.accrued || 0;
    return s;
  }
  function verify(snap) {
    var errors = [];
    Object.keys(snap.vals).forEach(function (mode) {
      Object.keys(snap.vals[mode]).forEach(function (ck) {
        var vv = snap.vals[mode][ck], col = snap.cols[ck];
        Object.keys(vv).forEach(function (k) { if (k.indexOf('r:') !== 0 && !(typeof vv[k] === 'number' && isFinite(vv[k]))) errors.push('Giá trị không hữu hạn: ' + k + ' · ' + col.label + ' (' + mode + ')'); });
        Object.keys(DEF).forEach(function (k) { var s = DEF[k].parts.reduce(function (a, pt) { return a + pt[1] * (vv[pt[0]] || 0); }, 0); if (Math.abs(s - vv[k]) > TOL) errors.push('Tổng không đối chiếu được: ' + k + ' · ' + col.label + ' lệch ' + (vv[k] - s)); });
        if (col.ids.length > 1) TH.PNL_LINES.forEach(function (l) { if (!l.k || DEF[l.k]) return; var s = col.ids.reduce(function (a, b) { return a + snap.vals[mode][keyOf([b])][l.k]; }, 0); if (Math.abs(s - vv[l.k]) > TOL) errors.push('Cột ' + col.label + ' ≠ Σ tòa ở ' + l.label); });
        else TH.PNL_LINES.forEach(function (l) { if (!l.k || DEF[l.k]) return; var e = leafExpected(snap, mode, col.ids[0], l.k); if (Math.abs(e - vv[l.k]) > TOL) errors.push('Nguồn không khớp: ' + l.label + ' · ' + col.label + ' (nguồn ' + e + ' / báo cáo ' + vv[l.k] + ')'); });
      });
    });
    Object.keys(snap.src).forEach(function (mode) { Object.keys(snap.src[mode]).forEach(function (b) { Object.keys(snap.src[mode][b]).forEach(function (k) { snap.src[mode][b][k].forEach(function (s) {
      if (s.kind === 'invoice' && s.lines) { var t = s.lines.reduce(function (a, x) { return a + x.contrib; }, 0); if (Math.abs(t - s.amount) > TOL) errors.push('Dòng hóa đơn ' + s.id + ' không khớp nguồn ' + k + ' (' + t + ' / ' + s.amount + ')'); }
    }); }); }); });
    return errors;
  }
  function businessWarnings(type, p, ids, items) {
    var w = [], inB = function (x) { return ids.indexOf(x) > -1; };
    var drafts = TH.db.invoices.filter(function (i) { return i.period === p && i.status === 'draft' && inB(i.buildingId); });
    if (drafts.length) w.push({ code: 'DRAFT_INV', text: drafts.length + ' hóa đơn NHÁP kỳ ' + F.period(p) + ' không vào doanh thu (chỉ hóa đơn đã xác nhận): ' + drafts.map(function (i) { return i.roomId; }).join(', '), href: TH.router.href('INV-01') });
    var unbilled = ids.filter(function (b) { return !TH.db.invoices.some(function (i) { return i.buildingId === b && i.period === p && i.status !== 'cancelled'; }); });
    if (unbilled.length) w.push({ code: 'UNBILLED', text: unbilled.map(function (b) { return C.building(b).short; }).join(', ') + ' chưa lập hóa đơn kỳ — doanh thu hóa đơn = 0 (vẫn có phần phân bổ trả trước nếu có).', href: TH.router.href('INV-01') });
    var pend = TH.db.expenses.filter(function (e) { return e.period === p && inB(e.buildingId) && (e.status === 'pending' || e.status === 'draft'); });
    if (pend.length) w.push({ code: 'PENDING_EXP', text: pend.length + ' chi phí chờ duyệt/nháp (' + F.money(C.sum(pend, function (e) { return e.amount; })) + ') chưa tính.', href: TH.router.href('EXP-01') });
    var adj = (TH.db.billAdjusts || []).filter(function (a) { return a.period === p && inB(a.buildingId) && a.status === 'pending'; });
    if (adj.length) w.push({ code: 'PENDING_ADJ', text: adj.length + ' giảm trừ/phụ thu chờ duyệt không vào số ghi nhận: ' + adj.map(function (a) { return a.roomId + ' ' + F.money(a.amount); }).join(', '), href: TH.router.href('INV-01') });
    var pool = TH.db.costPools && TH.db.costPools[p];
    if (pool && pool.status === 'draft') w.push({ code: 'POOL_DRAFT', text: 'Bảng phân bổ chi phí chung kỳ ' + F.period(p) + ' đang nháp.' });
    var pay = (TH.db.payrollStatus || {})[p];
    if (!pay || pay.status !== 'approved') w.push({ code: 'PAYROLL', text: 'Bảng lương kỳ ' + F.period(p) + ' chưa duyệt — dòng lương QL/trưởng nhóm là số tạm tính.' });
    var uses = { prorate: false, common: false, adjust: false, prepaid: false };
    items.forEach(function (it) { Object.keys(it.src).forEach(function (mode) { Object.keys(it.src[mode]).forEach(function (b) { Object.keys(it.src[mode][b]).forEach(function (k) { it.src[mode][b][k].forEach(function (s) {
      if (s.kind === 'prepaid') uses.prepaid = true;
      (s.lines || []).forEach(function (l) { if (l.type === 'common') uses.common = true; if (l.type === 'adjust') uses.adjust = true; if (l.type === 'rent' && l.k !== undefined && l.k !== 1) uses.prorate = true; if (l.months > 1) uses.prepaid = true; });
    }); }); }); }); });
    var ru = Object.keys(uses).filter(function (k) { return uses[k]; });
    if (ru.length && TH.billRules().status === 'proposed') w.push({ code: 'RULES', text: 'Số liệu dùng quy tắc tính tiền ĐỀ XUẤT chờ khách duyệt (' + ru.map(function (k) { return { prorate: 'tính lẻ ngày', common: 'điện chung', adjust: 'giảm trừ/phụ thu', prepaid: 'kỳ TT nhiều tháng' }[k]; }).join(', ') + ') — DECISIONS §9.9 BILL-Q1…Q8.' });
    if (uses.prepaid) w.push({ code: 'BILL-Q7', text: 'Có tiền phòng thu trước nhiều tháng: P&L đã phân bổ mỗi tháng 1 tháng; HS/lương CHƯA chuẩn hóa G-03 (BILL-Q7) nên lương QL có thể cao hơn.' });
    var miss = [];
    items.forEach(function (it) { Object.keys(it.src).forEach(function (mode) { Object.keys(it.src[mode]).forEach(function (b) { Object.keys(it.src[mode][b]).forEach(function (k) { it.src[mode][b][k].forEach(function (s) { (s.lines || []).forEach(function (l) { if (l.missingBasis && miss.indexOf(s.id) === -1) miss.push(s.id); }); }); }); }); }); });
    if (miss.length) w.push({ code: 'NO_BASIS', text: 'Thiếu căn cứ lịch sử cho ' + miss.length + ' hóa đơn (' + miss.slice(0, 4).join(', ') + (miss.length > 4 ? '…' : '') + '): chỉ hiển thị phần đã biết, không dùng công tơ/quy tắc hiện tại làm căn cứ cũ.' });
    return w;
  }
  /* Dấu vân tay nguồn: kết quả tính + nguồn đóng góp + dữ liệu liên quan (hóa đơn kỳ/nháp, quy tắc, điều chỉnh, điện chung/số người, phân bổ, lương, phòng) */
  function fingerprint(req, items) {
    var p = req.period, ids = req.buildingIds, inB = function (x) { return ids.indexOf(x) > -1; };
    var raw = {
      inv: TH.db.invoices.filter(function (i) { return inB(i.buildingId) && (i.period === p || (i.status === 'confirmed' && i.period < p && i.lines.some(function (l) { return (l.cover || []).indexOf(p) > -1; }))); }).map(function (i) { return [i.id, i.status, i.total]; }),
      rules: TH.billRules(), adj: (TH.db.billAdjusts || []).filter(function (a) { return a.period === p && inB(a.buildingId); }),
      common: (TH.db.commonReadings || []).filter(function (r) { return r.period === p; }), people: TH.db.contracts.filter(function (c) { return inB(c.buildingId) && c.peopleLog; }).map(function (c) { return [c.id, c.peopleLog]; }),
      pool: TH.db.costPools && TH.db.costPools[p], pay: (TH.db.payrollStatus || {})[p], sadj: (TH.db.salaryAdjustments || []).filter(function (a) { return a.period === p; }),
      exp: TH.db.expenses.filter(function (e) { return e.period === p && inB(e.buildingId); }).map(function (e) { return [e.id, e.status, e.amount]; }),
      rooms: TH.db.roomEvents.filter(function (e) { var r = C.room(e.roomId); return r && inB(r.buildingId); }).length,
    };
    var core = items.map(function (it) { var s = {}; Object.keys(it.src).forEach(function (m) { s[m] = {}; Object.keys(it.src[m]).forEach(function (b) { s[m][b] = {}; Object.keys(it.src[m][b]).forEach(function (k) { s[m][b][k] = it.src[m][b][k].map(function (x) { return x.kind + ':' + x.id + ':' + x.amount; }); }); }); }); return [it.vals, s]; });
    return hash(JSON.stringify([core, raw]));
  }

  /* ---------- API ---------- */
  function validate(req) {
    if (!req || !TYPES[req.type]) return 'Chọn loại báo cáo.';
    if (req.previousRunId && !TH.has('F045.D')) return 'Tạo phiên bản báo cáo có từ gói D.';
    if (req.type === 'RPT-05' && req.tpl && req.tpl !== 'MAU-BCKD' && !TH.has('F046.D')) return 'Chọn phiên bản mẫu báo cáo có từ gói D.';
    if (!canType(req.type)) return 'Vai trò hiện tại không được tạo ' + req.type + ' (403).';
    if (TH.PERIODS.indexOf(req.period) === -1) return 'Kỳ báo cáo không hợp lệ.';
    if (!req.buildingIds || !req.buildingIds.length) return 'Chọn ít nhất một tòa.';
    var allow = allowedIds(), bad = req.buildingIds.filter(function (b) { return allow.indexOf(b) === -1 || !C.building(b); });
    if (bad.length) return 'Tòa ngoài quyền truy cập: ' + bad.join(', ') + ' (403).';
    return null;
  }
  function buildDraftItems(req) {
    var ids = req.buildingIds.slice().sort();
    return req.type === 'RPT-04' ? ids.map(function (b) { return buildItem('RPT-04', req.period, [b]); }) : [buildItem('RPT-05', req.period, ids, req.tpl)];
  }
  function assess(req, items) {
    var errors = [];
    items.forEach(function (it) { verify(it).forEach(function (e) { errors.push((it.type === 'RPT-04' ? it.labels[it.buildingIds[0]].short + ': ' : '') + e); }); });
    return { errors: errors, warnings: businessWarnings(req.type, req.period, req.buildingIds, items), fp: fingerprint(req, items) };
  }
  function draftOf(id) { return (TH.db.reportDrafts || []).find(function (d) { return d.id === id; }) || null; }
  function runOf(id) { return (TH.db.reportRuns || []).find(function (r) { return r.id === id; }) || null; }
  function groupKey(type, p, ids) { return type + '|' + p + '|' + ids.slice().sort().join('+'); }

  TH.reports = {
    TYPES: TYPES, DEF: DEF, RATIO: RATIO, ENGINE: ENGINE,
    canType: canType, canSee: canSee, keyOf: keyOf,
    draft: draftOf, run: runOf,
    preview: function (request, opts) {
      opts = opts || {};
      var req = { type: request.type, period: request.period, buildingIds: (request.buildingIds || []).slice().sort(), tpl: request.tpl || 'MAU-BCKD', previousRunId: request.previousRunId || null };
      var err = validate(req);
      if (err) return { ok: false, error: err };
      var items = buildDraftItems(req), a = assess(req, items);
      var d = { id: 'NHAP-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), request: req, items: items, errors: a.errors, warnings: a.warnings, fp: a.fp, ack: false, runIds: null, stale: false, diff: null, createdBy: TH.me().id, createdAt: now() };
      if (!opts.transient) {
        TH.db.reportDrafts = (TH.db.reportDrafts || []).filter(function (x) { return x.runIds; }).slice(-6).concat((TH.db.reportDrafts || []).filter(function (x) { return !x.runIds; }).slice(-4)).concat([d]);
        TH.store.persist();
      }
      return { ok: true, draft: d };
    },
    /* Nguồn đã đổi sau khi xem trước? */
    isStale: function (d) { if (d.runIds) return false; var items = buildDraftItems(d.request); return fingerprint(d.request, items) !== d.fp; },
    recalc: function (id) {
      var d = draftOf(id); if (!d || d.runIds) return null;
      var err = validate(d.request); if (err) { d.errors = [err]; return d; }
      var items = buildDraftItems(d.request), a = assess(d.request, items), diff = [];
      items.forEach(function (it, i) {
        var old = d.items[i]; if (!old) return;
        Object.keys(it.vals).forEach(function (mode) { Object.keys(it.vals[mode]).forEach(function (ck) { var nv = it.vals[mode][ck], ov = (old.vals[mode] || {})[ck] || {};
          Object.keys(nv).forEach(function (k) { if (k.indexOf('r:') === 0) return; if (Math.abs((nv[k] || 0) - (ov[k] || 0)) > TOL) diff.push({ item: i, mode: mode, col: it.cols[ck].label, metric: k, before: ov[k] || 0, after: nv[k] }); });
        }); });
      });
      Object.assign(d, { items: items, errors: a.errors, warnings: a.warnings, fp: a.fp, ack: false, stale: false, diff: diff, recalcAt: now() });
      TH.store.persist();
      return d;
    },
    cancel: function (id) { TH.db.reportDrafts = (TH.db.reportDrafts || []).filter(function (d) { return d.id !== id || d.runIds; }); TH.store.persist(); },
    confirm: function (id, o) {
      o = o || {};
      var d = draftOf(id);
      if (!d) return { ok: false, error: 'Không tìm thấy bản xem trước.' };
      if (d.runIds) return { ok: true, runIds: d.runIds.slice(), duplicate: true };
      var err = validate(d.request); if (err) return { ok: false, error: err };
      if (TH.reports.isStale(d)) { d.stale = true; d.ack = false; return { ok: false, reason: 'stale', error: 'Dữ liệu nguồn đã thay đổi sau khi xem trước — bấm Tính lại preview và xem lại cảnh báo.' }; }
      if (d.errors.length) return { ok: false, reason: 'errors', error: 'Còn ' + d.errors.length + ' lỗi số liệu — không tạo báo cáo.' };
      var ack = o.acknowledgeWarnings !== undefined ? o.acknowledgeWarnings : d.ack;
      if (d.warnings.length && !ack) return { ok: false, reason: 'ack', error: 'Cần tích đã đọc ' + d.warnings.length + ' cảnh báo trước khi tạo.' };
      var runs = TH.db.reportRuns = TH.db.reportRuns || [], at = now(), me = TH.me().id, ids = [];
      d.items.forEach(function (it) {
        var gk = groupKey(it.type, it.period, it.buildingIds), same = runs.filter(function (r) { return r.groupKey === gk; });
        var ver = same.reduce(function (m, r) { return Math.max(m, r.version); }, 0) + 1, prev = same.sort(function (a, b) { return b.version - a.version; })[0];
        var rid = 'BC' + it.type.slice(4) + '-' + it.period.replace('-', '') + '-' + it.buildingIds.map(function (b) { return b.slice(3); }).join('.') + '-v' + ver;
        runs.push({ id: rid, type: it.type, period: it.period, buildingIds: it.buildingIds.slice(), groupKey: gk, version: ver, prevId: prev ? prev.id : null, fromRunId: d.request.previousRunId || null,
          createdBy: me, createdAt: at, template: it.template, engine: ENGINE, schema: TH.DATA_SCHEMA, fp: d.fp, warnings: deep(d.warnings), acknowledged: d.warnings.length > 0, snapshot: deep(it), storage: 'pending' });
        ids.push(rid);
      });
      d.runIds = ids;
      var res = TH.store.flushChecked();
      ids.forEach(function (rid) { runOf(rid).storage = res.durable ? 'local' : 'session'; });
      if (!res.durable) TH.store.flushChecked();
      TH.log('Tạo báo cáo theo mẫu', ids.join(', '), d.request.type + ' · kỳ ' + F.period(d.request.period) + (d.warnings.length ? ' · đã đọc ' + d.warnings.length + ' cảnh báo' : ''), 'report');
      return { ok: true, runIds: ids, durable: res.durable };
    },
    snap: function (ctx) {
      if (ctx.where === 'run') { var r = runOf(ctx.id); return r ? r.snapshot : null; }
      var d = draftOf(ctx.id) || (TH._transientDraft && TH._transientDraft.id === ctx.id ? TH._transientDraft : null);
      return d ? d.items[ctx.item || 0] : null;
    },
    /* Truy nguồn 1 ô: công thức → thành phần → đóng góp từng tòa → chứng từ, theo đúng snapshot */
    trace: function (ctx) {
      var snap = TH.reports.snap(ctx); if (!snap) return null;
      var mode = ctx.mode || 'tong', col = snap.cols[ctx.col], m = ctx.metric, vv = snap.vals[mode] && snap.vals[mode][ctx.col];
      if (m.indexOf('share:') === 0) return shareTrace(snap, m);
      if (!col || !vv) return null;
      var line = TH.PNL_LINES.find(function (l) { return l.k === m; });
      var out = { snap: snap, mode: mode, col: ctx.col, colLabel: col.label, ids: col.ids, metric: m, label: line ? (mode === 'kd' && line.labelKd ? line.labelKd : line.label) : EXTRA_LABEL[m] || m, value: vv[m], count: !!(line && line.count) };
      if (m.indexOf('r:') === 0) {
        var rk = m.slice(2), def = RATIO[rk], r = TH.PNL_RATIOS.find(function (x) { return x.k === rk; });
        out.label = r.label; out.kind = 'ratio'; out.times = !!r.times; out.num = { metric: def[0], value: vv[def[0]] }; out.den = { metric: def[1], value: vv[def[1]] };
        out.na = !vv[def[1]] || vv[m] === null; out.formula = labelOf(def[0], mode) + ' ÷ ' + labelOf(def[1], mode);
        return out;
      }
      if (DEF[m]) { out.kind = 'derived'; out.formula = DEF[m].text; out.parts = DEF[m].parts.map(function (pt) { return { metric: pt[0], sign: pt[1], label: labelOf(pt[0], mode), value: vv[pt[0]] }; }); out.check = out.parts.reduce(function (a, x) { return a + x.sign * x.value; }, 0); return out; }
      out.kind = 'leaf'; out.filter = FILTER[m] || 'Bản ghi nguồn đã xác nhận / đã duyệt của kỳ thuộc dòng này.';
      if (col.ids.length > 1) { out.contrib = col.ids.map(function (b) { return { b: b, label: snap.labels[b].short, col: keyOf([b]), value: snap.vals[mode][keyOf([b])][m] }; }); out.check = out.contrib.reduce(function (a, x) { return a + x.value; }, 0); return out; }
      var b = col.ids[0], meta = snap.meta[mode][ctx.col];
      out.sources = ((snap.src[mode][b] || {})[m] || []).slice();
      if (mode === 'kd' && (m === 'depIn' || m === 'depRefund' || m === 'equip')) { out.excluded = out.sources; out.sources = []; out.excludedNote = 'Chế độ Kinh doanh loại ' + F.money(meta.hidden[m] || 0) + ' khỏi P&L (R-01/R-03) — các bản ghi dưới đây chỉ vào dòng tiền/tài sản.'; }
      if (m === 'cRent' && mode === 'kd' && meta.accrued) out.sources = out.sources.concat([{ kind: 'lease', id: meta.accrualLease, room: null, amount: meta.accrued, text: 'Tiền thuê nhà DỰ KIẾN theo HĐ thuê tòa — phiếu chi chưa duyệt (R-07, đề xuất)', buildingId: b }]);
      out.check = out.count ? out.sources.length : out.sources.reduce(function (a, x) { return a + (x.amount || 0); }, 0);
      out.notes = (snap.notes[ctx.col] || {})[m] || [];
      return out;
    },
    /* Bộ sheet Excel dựng từ snapshot (dùng chung cho tải Excel) */
    xlsxSheets: function (snap, run) { return toXlsx(snap, run); },
    export: function (runId) {
      var r = runOf(runId); if (!r || !canSee(r)) return null;
      var scope = r.type === 'RPT-04' ? r.buildingIds[0] : (r.buildingIds.length === TH.db.buildings.length ? 'ALL' : r.buildingIds.map(function (b) { return b.slice(3); }).join('-'));
      var fname = 'TIMEHOUSE_' + r.type + '_' + scope + '_ky_' + r.period + '_v' + r.version;
      var sheets = toXlsx(r.snapshot, r);
      TH._lastExport = { filename: fname + '.xlsx', sheets: sheets, runId: r.id };
      TH.exportXlsx(fname, sheets);
      return TH._lastExport;
    },
  };
  function labelOf(k, mode) { var l = TH.PNL_LINES.find(function (x) { return x.k === k; }); return l ? (mode === 'kd' && l.labelKd ? l.labelKd : l.label) : EXTRA_LABEL[k] || k; }
  function shareTrace(snap, m) {
    var p = m.split(':'), sh = snap.share, f = p[2], row = p[1] === 'T' ? null : sh.rows[+p[1]];
    var base = sh.base, ratio = row ? row.ratio : sh.ratio, val = row ? row[f] : sh[f];
    var fm = { capital: ['Vốn = tỷ lệ × tiền thuê nhà kỳ', base.cRent], lng: ['LN gộp = tỷ lệ × LNG', base.lng], lnr: ['LN ròng = tỷ lệ × LNR', base.lnr], total: ['Tổng nhận = Vốn + LN ròng', null], ratio: ['Tỷ lệ hiệu lực kỳ (SHARE-01)', null] }[f];
    return { snap: snap, kind: 'share', label: (row ? row.holder : 'Tổng') + ' · ' + { capital: 'Vốn', lng: 'LN gộp', lnr: 'LN ròng', total: 'Tổng nhận', ratio: 'Tỷ lệ' }[f], value: val, formula: fm[0], ratio: ratio, base: fm[1], row: row, restricted: !TH.can('share.view') && !TH.can('report.all') };
  }

  /* ---------- Excel từ snapshot ---------- */
  function toXlsx(snap, run) {
    var stamp = run ? 'Bản ' + run.id + ' · v' + run.version + ' · tạo ' + run.createdAt + ' bởi ' + C.staffName(run.createdBy) + ' · ' + run.template + ' · ' + run.engine : 'Xem trước — chưa xác nhận';
    return snap.sheets.map(function (sh) {
      if (sh.kind === 'stmt') {
        var cols = [{ label: 'Chỉ tiêu', width: 30 }, { label: '', width: 34 }].concat(sh.cols.map(function (c) { return { label: c.label, type: 'money', width: 18 }; })).concat(sh.notesCol ? [{ label: 'Ghi chú', width: 30 }] : []);
        var rows = [];
        sh.lines.forEach(function (l) {
          if (l.t === 'sec') { rows.push({ c: [l.label.toUpperCase()], bold: true }); return; }
          if (l.t === 'grp') { rows.push({ c: ['', l.label], bold: true }); return; }
          var lb = sh.mode === 'kd' && l.labelKd ? l.labelKd : l.label, vals = sh.cols.map(function (c) { var x = snap.vals[sh.mode][c.key][l.metric]; return l.t === 'r' ? (x === null ? null : Math.round(x * 10000) / 10000) : x; });
          var notes = sh.notesCol ? [((snap.notes[sh.cols[0].key] || {})[l.metric] || []).join(', ')] : [];
          rows.push({ c: (l.indent ? ['', lb] : [lb, '']).concat(vals).concat(notes), bold: l.strong, pct: l.t === 'r' && !l.times });
        });
        return { name: sh.name, title: sh.title, note: stamp + ' · ' + (sh.mode === 'kd' ? 'chế độ Kinh doanh (P&L đề xuất R-01/R-07)' : 'chế độ Tổng theo mẫu') + ' · ô tỷ lệ trống = không áp dụng (mẫu số 0)', columns: cols, rows: rows };
      }
      if (sh.kind === 'share') {
        var s = snap.share;
        return { name: sh.name, title: sh.title, note: stamp + ' · Vốn = tỷ lệ × tiền thuê nhà kỳ; Tổng nhận = Vốn + LN ròng (R-08, D-07 chưa chốt)', columns: [{ label: 'Cổ đông', width: 30 }, { label: 'Tỷ lệ %', type: 'number', width: 10 }, { label: 'Vốn', type: 'money' }, { label: 'LN gộp', type: 'money' }, { label: 'LN ròng', type: 'money' }, { label: 'Tổng nhận', type: 'money' }],
          rows: s ? s.rows.map(function (r) { return [r.holder, r.ratio, r.capital, r.lng, r.lnr, r.total]; }) : [], totals: s ? ['Tổng', s.ratio, s.capital, s.lng, s.lnr, s.total] : null };
      }
      if (sh.kind === 'src') {
        var rows2 = [];
        snap.buildingIds.forEach(function (b) {
          var src = snap.src[sh.mode][b] || {};
          TH.PNL_LINES.forEach(function (l) { if (!l.k || DEF[l.k]) return; (src[l.k] || []).forEach(function (x) { rows2.push([l.label, snap.labels[b].short, (KIND[x.kind] || [x.kind])[0], x.id, x.room || '', x.kind === 'payroll' && !canPayroll() ? 'Chi tiết lương bị hạn chế' : srcText(x), l.count ? null : (x.amount !== undefined ? x.amount : null)]); }); });
        });
        return { name: sh.name, title: sh.title, note: stamp + ' · nguồn tại thời điểm tạo báo cáo', columns: [{ label: 'Dòng báo cáo', width: 30 }, { label: 'Tòa', width: 12 }, { label: 'Loại', width: 14 }, { label: 'Chứng từ', width: 20 }, { label: 'Phòng', width: 10 }, { label: 'Diễn giải / căn cứ', width: 60 }, { label: 'Số tiền', type: 'money' }], rows: rows2 };
      }
      var rows3 = [];
      (snap.datasetRules || []).forEach(function (r) { rows3.push(['Mô phỏng · ' + r.title, r.formula, r.source.file + (r.source.sheet ? ' · ' + r.source.sheet : '') + (r.source.cell ? ' · ' + r.source.cell : '') + ' · ' + r.status + ' · ' + r.difference]); });
      Object.keys(DEF).forEach(function (k) { rows3.push([labelOf(k, 'tong'), DEF[k].text, '']); });
      Object.keys(RATIO).forEach(function (k) { var r = TH.PNL_RATIOS.find(function (x) { return x.k === k; }); rows3.push([r.label, labelOf(RATIO[k][0], 'tong') + ' ÷ ' + labelOf(RATIO[k][1], 'tong'), 'Mẫu số 0 → không áp dụng']); });
      Object.keys(FILTER).forEach(function (k) { rows3.push([labelOf(k, 'tong'), 'Chỉ tiêu nguồn', FILTER[k]]); });
      rows3.push(['Quy tắc tính tiền tại lúc tạo', Object.keys(TH.BILL_RULE_LABELS).map(function (k) { return TH.BILL_RULE_LABELS[k].label + ': ' + (TH.BILL_RULE_LABELS[k].options[snap.rules[k]] || snap.rules[k]); }).join(' · '), (snap.rules.status === 'proposed' ? 'ĐỀ XUẤT — chờ khách duyệt (D-03)' : '')]);
      if (run && run.warnings.length) run.warnings.forEach(function (w) { rows3.push(['Cảnh báo đã đọc khi tạo', w.code, w.text]); });
      return { name: sh.name, title: sh.title, note: stamp, columns: [{ label: 'Chỉ tiêu', width: 30 }, { label: 'Công thức', width: 70 }, { label: 'Quy tắc lọc / ghi chú', width: 80 }], rows: rows3 };
    });
  }
  function canPayroll() { return TH.can('salary.view'); }
  function srcText(x) {
    var t = x.text || '';
    if (x.kind === 'invoice' && x.lines) t = x.lines.map(function (l) { return l.name + ' ' + F.money(l.contrib) + basisText(l); }).join('; ');
    if (x.kind === 'prepaid') t = 'Hóa đơn ' + x.id + ' kỳ ' + F.period(x.invPeriod) + ' trả trước ' + x.months + ' tháng (' + (x.cover || []).map(F.period).join(', ') + '), tổng ' + F.money(x.lineTotal) + '; kỳ đầu ' + F.money(x.first) + ', mỗi kỳ sau ' + F.money(x.later);
    if (x.kind === 'expense') t = (x.catLabel || '') + ' · ' + t + (x.docNo ? ' · ' + x.docNo : '');
    return t;
  }
  function basisText(l) {
    if (l.type === 'rent' && l.months > 1) return ' (kỳ TT ' + l.months + ' tháng ' + (l.cover || []).map(F.period).join(', ') + ': tổng dòng ' + F.money(l.amount) + ', kỳ này nhận phần tháng đầu)';
    if (l.type === 'rent' && l.k !== undefined && l.k !== 1) return l.raw !== undefined ? ' (' + F.date(l.from) + '–' + F.date(l.to) + ': ' + l.days + '/' + l.base + ' ngày × ' + F.money(l.price) + ' = ' + F.money(Math.round(l.raw)) + ' trước làm tròn, làm tròn ' + F.money(l.roundTo) + ')' : ' (thiếu căn cứ lịch sử)';
    if (l.type === 'common') return l.basis ? ' (' + l.basis.code + ': ' + l.basis.prev + '→' + l.basis.cur + ' = ' + l.basis.kwh + ' kWh × ' + F.money(l.basis.price) + ' = ' + F.money(l.basis.meterAmount) + ' ÷ ' + l.basis.base + ' ' + (l.basis.method === 'per_person' ? 'người' : 'phòng') + ' × ' + l.basis.units + ')' : ' (thiếu căn cứ lịch sử)';
    if (l.type === 'adjust') return l.basis ? ' (' + l.basis.id + ' · ' + l.basis.category + ' · ' + (TH.ADJUST_STATES[l.basis.status] || [l.basis.status])[0] + (l.basis.approvedBy ? ' · duyệt ' + C.staffName(l.basis.approvedBy) : '') + ')' : ' (thiếu căn cứ lịch sử)';
    if (l.split) return ' (1/3 phí DV chung ' + F.money(l.amount) + ')';
    return '';
  }

  /* =========================================================
     Màn REPORTS — danh sách · tạo · xem trước · bản lưu
     ========================================================= */
  function req() {
    var r = TH.store.ui(S, 'req', null);
    var types = Object.keys(TYPES).filter(canType);
    var allow = allowedIds();
    r = Object.assign({ type: types[0] || 'RPT-04', period: TH.store.state.period, buildingIds: TH.scope() !== 'ALL' ? [TH.scope()] : allow.slice(), tpl: 'MAU-BCKD', previousRunId: null }, r || {});
    if (types.indexOf(r.type) === -1) r.type = types[0];
    r.buildingIds = (r.buildingIds || []).filter(function (b) { return allow.indexOf(b) > -1; });
    if (!TH.has('F046.D')) { r.tpl = 'MAU-BCKD'; r.previousRunId = null; }
    return r;
  }
  function setReq(patch) { TH.store.setUi(S, 'req', Object.assign(req(), patch)); }
  TH.reportPrefill = function (type, ctx) {
    ctx = ctx || {};
    TH.store.setUi(S, 'req', { type: type, period: ctx.period || TH.store.state.period, buildingIds: ctx.buildingIds || (TH.scope() !== 'ALL' ? [TH.scope()] : allowedIds()), tpl: ctx.tpl || 'MAU-BCKD', previousRunId: ctx.previousRunId || null });
  };
  function typeBadge(t) { return TH.badge(t, t === 'RPT-04' ? 'teal' : 'info'); }
  function scopeLabel(ids) { return ids.length === TH.db.buildings.length ? 'Toàn hệ thống (' + ids.length + ' tòa)' : ids.map(function (b) { var x = C.building(b); return x ? x.short : b; }).join(', '); }
  function forbidden(text) { return TH.pageHeader({ screen: S }) + '<div class="card">' + TH.state('forbidden', { text: text }) + '</div>'; }

  function listView() {
    var q = TH.store.ui(S, 'q', ''), ft = TH.store.ui(S, 'ft', 'all'), fb = TH.store.ui(S, 'fb', 'all'), fp = TH.store.ui(S, 'fp', 'all'), fu = TH.store.ui(S, 'fu', 'all');
    var all = (TH.db.reportRuns || []).filter(canSee);
    var rows = all.filter(function (r) {
      return (ft === 'all' || r.type === ft) && (fb === 'all' || r.buildingIds.indexOf(fb) > -1) && (fp === 'all' || r.period === fp) && (fu === 'all' || r.createdBy === fu) &&
        TH.match(q, [r.id, r.type, TYPES[r.type].label, scopeLabel(r.buildingIds), C.staffName(r.createdBy), F.period(r.period)]);
    }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : (b.version - a.version) || (a.id < b.id ? 1 : -1); });
    var types = Object.keys(TYPES).filter(canType);
    var creators = all.map(function (r) { return r.createdBy; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var filters = '<div class="toolbar" style="flex-wrap:wrap">' + TH.searchBox(S, 'Tìm mã báo cáo, tòa, người tạo…') +
      TH.uiSelect(S, 'ft', [{ id: 'all', label: 'Mọi loại' }].concat(types.map(function (t) { return { id: t, label: t + ' · ' + TYPES[t].label }; })), ft, 'Lọc loại', 'sel-inline') +
      TH.uiSelect(S, 'fb', [{ id: 'all', label: 'Mọi tòa' }].concat(allowedIds().map(function (b) { return { id: b, label: C.building(b).name }; })), fb, 'Lọc tòa', 'sel-inline') +
      TH.uiSelect(S, 'fp', [{ id: 'all', label: 'Mọi kỳ' }].concat(TH.PERIODS.slice().reverse().map(function (p) { return { id: p, label: 'Kỳ ' + F.period(p) }; })), fp, 'Lọc kỳ', 'sel-inline') +
      TH.uiSelect(S, 'fu', [{ id: 'all', label: 'Mọi người tạo' }].concat(creators.map(function (u) { return { id: u, label: C.staffName(u) }; })), fu, 'Lọc người tạo', 'sel-inline') + '</div>';
    var table = TH.table({
      label: 'Danh sách báo cáo đã tạo',
      cols: [
        { key: 'id', label: 'Mã báo cáo', render: function (r) { return '<a class="mono" href="' + href('view/' + r.id) + '">' + esc(r.id) + '</a>' + (r.storage === 'session' ? '<div class="cell-sub warn-text">chỉ lưu trong phiên</div>' : ''); } },
        { key: 't', label: 'Loại', render: function (r) { return '<span data-tip="' + esc(TYPES[r.type].label) + '">' + typeBadge(r.type) + '</span>'; } },
        { kind: 'date', key: 'p', label: 'Kỳ', render: function (r) { return F.period(r.period); } },
        { key: 'b', label: 'Phạm vi tòa', wrap: true, render: function (r) { return esc(scopeLabel(r.buildingIds)); } },
        { key: 'v', label: 'Phiên bản', num: true, render: function (r) { return '<b>v' + r.version + '</b>' + (r.prevId ? '<div class="cell-sub">trước: v' + (r.version - 1) + '</div>' : ''); } },
        { key: 'c', label: 'Người tạo', render: function (r) { return esc(C.staffName(r.createdBy)) + '<div class="cell-sub">' + esc(r.createdAt) + '</div>'; } },
        { key: 'w', label: 'Cảnh báo', render: function (r) { return r.warnings.length ? TH.badge(r.warnings.length + ' đã đọc', 'warning', { tip: r.warnings.map(function (w) { return w.text; }).join(' · ') }) : TH.badge('Không', 'success'); } },
        { key: 'a', label: '', render: function (r) { return '<div class="row u-gap-6 u-nowrap"><a class="btn btn-xs" href="' + href('view/' + r.id) + '">' + I('eye', 'ic-sm') + 'Xem</a><button type="button" class="btn btn-xs btn-icon" data-act="rptf.xlsx" data-id="' + r.id + '" data-tip="Tải Excel từ bản lưu" aria-label="Tải Excel ' + r.id + '">' + I('download', 'ic-sm') + '</button><button type="button" class="btn btn-xs btn-ghost btn-icon" data-act="rptf.version" data-id="' + r.id + '" data-tip="Tạo phiên bản mới: tính lại từ nguồn hiện tại" aria-label="Tạo phiên bản mới từ ' + r.id + '">' + I('refresh', 'ic-sm') + '</button></div>'; } },
      ],
      rows: rows,
      empty: { title: all.length ? 'Không có báo cáo phù hợp bộ lọc' : 'Chưa có báo cáo nào được tạo', text: 'Bấm “Tạo báo cáo” → chọn loại, tháng, tòa → Xem trước → Xác nhận. Mở link báo cáo không tự tạo bản lưu.' },
    });
    var storeNote = TH.store.storageOk ? '' : '<div class="alert alert-warning u-mb-16">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Trình duyệt chặn lưu cục bộ</b><span>Báo cáo tạo trong phiên này chỉ giữ tới khi tải lại trang.</span></div></div>';
    return TH.pageHeader({ screen: S, status: '<span class="badge badge-info">' + esc(TH.CR_RPT2.id) + '</span>', desc: 'Bản báo cáo <b>RPT-04 · Doanh thu theo tòa</b> và <b>RPT-05 · Báo cáo kinh doanh tháng</b> theo đúng mẫu Excel của khách. Chỉ bấm <b>Xác nhận tạo báo cáo</b> mới sinh bản lưu; bản lưu chỉ đọc, tải Excel từ bản lưu, sửa nguồn rồi tạo phiên bản mới (không ghi đè). Có ở mọi gói A–D.',
      actions: types.length ? '<button type="button" class="btn btn-primary" data-act="rptf.new">' + I('plus', 'ic-sm') + 'Tạo báo cáo</button>' : '' }) + storeNote +
      '<div class="card card-flush">' + TH.cardHd(I('sheet', 'ic-sm') + 'Báo cáo đã tạo', rows.length + '/' + all.length + ' bản · mới nhất trước · hiển thị mọi phiên bản') + filters + table + '</div>';
  }

  function newView(opts) {
    opts = opts || {};
    var r = req(), types = Object.keys(TYPES).filter(canType), allow = allowedIds();
    if (!types.length) return forbidden('Vai trò hiện tại không được tạo báo cáo theo mẫu.');
    var err = TH.store.ui(S, 'err', '');
    var typeSel = '<div class="field"><label for="rptf-type">Loại báo cáo</label><select id="rptf-type" class="select" data-act-change="rptf.type">' + types.map(function (t) { return '<option value="' + t + '"' + (t === r.type ? ' selected' : '') + '>' + t + ' · ' + esc(TYPES[t].label) + '</option>'; }).join('') + '</select></div>';
    var perSel = '<div class="field"><label for="rptf-period">Tháng</label><select id="rptf-period" class="select" data-act-change="rptf.period">' + TH.PERIODS.slice().reverse().map(function (p) { return '<option value="' + p + '"' + (p === r.period ? ' selected' : '') + '>Kỳ ' + F.period(p) + (TH.periodLocked(p) ? ' · đã khóa' : p === TH.CURRENT_PERIOD ? ' · đang mở' : '') + '</option>'; }).join('') + '</select></div>';
    var allOn = allow.length && allow.every(function (b) { return r.buildingIds.indexOf(b) > -1; });
    var bList = '<fieldset class="field span-2"><legend class="small strong u-mb-8">Tòa (trong quyền truy cập)</legend><div class="row" style="gap:12px;flex-wrap:wrap">' +
      '<label class="check"><input type="checkbox" data-act-change="rptf.all"' + (allOn ? ' checked' : '') + '><span><b>Chọn tất cả</b> (' + allow.length + ' tòa được phép)</span></label>' +
      allow.map(function (b) { var bb = C.building(b), g = groupOf(b); return '<label class="check"><input type="checkbox" data-act-change="rptf.b" data-b="' + b + '"' + (r.buildingIds.indexOf(b) > -1 ? ' checked' : '') + '><span>' + esc(bb.name) + (g ? ' <span class="muted small">· ' + esc(g.short) + '</span>' : '') + '</span></label>'; }).join('') + '</div></fieldset>';
    var tplSel = r.type === 'RPT-05' ? TH.gate('F046.D', '<div class="field"><label for="rptf-tpl">Mẫu báo cáo ' + TH.up('F046.D') + '</label><select id="rptf-tpl" class="select" data-act-change="rptf.tpl">' + TH.db.reportTemplates.filter(function (t) { return t.report === 'RPT-05'; }).map(function (t) { return '<option value="' + t.id + '"' + (t.id === r.tpl ? ' selected' : '') + '>' + esc(t.name) + ' · v' + t.version + (t.status === 'draft' ? ' (nháp)' : '') + '</option>'; }).join('') + '</select></div>', { mode: 'mini', label: 'Mẫu báo cáo có phiên bản' }) : '';
    var n = r.type === 'RPT-04' ? r.buildingIds.length : (r.buildingIds.length ? 1 : 0);
    var explain = r.type === 'RPT-04' ? 'Mỗi tòa chọn có một bản xem trước; xác nhận một lần tạo <b>' + r.buildingIds.length + '</b> bản lưu riêng.' : 'Một bản tổng hợp các tòa đã chọn: sheet Kinh doanh, Tổng và từng nhóm nhà có tòa được chọn (chỉ gộp các tòa đã chọn).';
    var prev = r.previousRunId ? runOf(r.previousRunId) : null;
    return (opts.noHeader ? '' : TH.pageHeader({ screen: S, title: 'Tạo báo cáo theo mẫu', crumbs: [['Báo cáo theo mẫu Excel', TH.router.href(S)], ['Tạo mới']], desc: 'Chọn loại → tháng → tòa → <b>Xem trước</b>. Xem trước không tạo bản lưu.' })) +
      (prev ? '<div class="alert alert-info u-mb-16">' + I('history', 'ic-sm') + '<div class="alert-body"><b>Tạo phiên bản mới từ ' + esc(prev.id) + '</b><span>Số tính lại từ nguồn hiện tại; bản cũ giữ nguyên.</span></div></div>' : '') +
      (err ? '<div class="alert alert-danger u-mb-16">' + I('xCircle', 'ic-sm') + '<div class="alert-body">' + esc(err) + '</div></div>' : '') +
      '<div class="card"><div class="card-bd"><div class="form-grid">' + typeSel + perSel + bList + tplSel + '</div>' +
      '<p class="small muted" style="margin:12px 0 0">' + explain + (TH.periodLocked(r.period) ? ' Kỳ ' + F.period(r.period) + ' đã khóa: vẫn tạo được báo cáo, sửa nguồn vẫn theo khóa kỳ.' : '') + '</p></div>' +
      '<div class="card-ft"><a class="btn" href="' + TH.router.href(S) + '">Hủy</a><span class="spacer"></span><button type="button" class="btn btn-primary" data-act="rptf.preview"' + (n ? '' : ' disabled') + '>' + I('eye', 'ic-sm') + 'Xem trước' + (r.type === 'RPT-04' && n > 1 ? ' ' + n + ' báo cáo' : '') + '</button></div></div>';
  }

  /* Bảng sheet (preview / bản lưu) — mỗi ô số là nút mở “Nguồn và cách tính” */
  function cellBtn(where, id, item, mode, col, metric, html, aria) {
    if (!TH.has('F045.B')) return html;
    return '<button type="button" class="rptf-cell" data-act="rptf.trace" data-where="' + where + '" data-id="' + esc(id) + '" data-item="' + item + '" data-mode="' + mode + '" data-col="' + esc(col) + '" data-m="' + esc(metric) + '" aria-label="Nguồn và cách tính: ' + esc(aria) + '">' + html + '</button>';
  }
  function fmtVal(l, x) {
    if (l.t === 'r') return x === null || x === undefined ? '<span class="muted" title="Mẫu số 0">Không áp dụng</span>' : '<span class="tnum' + (x < 0 ? ' neg' : '') + '">' + (l.times ? x.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' lần' : F.pct(x, 1)) + '</span>';
    if (l.count) return '<span class="tnum">' + x + '</span>';
    if (!x) return '<span class="tnum muted">0</span>';
    return '<span class="tnum' + (x < 0 ? ' neg' : '') + '">' + F.money(x).replace(/\s₫$/, '') + '</span>';
  }
  function sheetHtml(where, id, item, snap, sh) {
    if (sh.kind === 'stmt') {
      var head = '<th scope="col" class="rpt-label">Chỉ tiêu</th>' + sh.cols.map(function (c) { return '<th scope="col" class="num' + (c.label.indexOf('TỔNG') === 0 ? ' rpt-total-col' : '') + '">' + esc(c.label) + '</th>'; }).join('') + (sh.notesCol ? '<th scope="col">Ghi chú</th>' : '');
      var n = sh.cols.length + 1 + (sh.notesCol ? 1 : 0), body = '';
      sh.lines.forEach(function (l) {
        if (l.t === 'sec') { body += '<tr class="rpt-sec"><th colspan="' + n + '" scope="rowgroup">' + esc(l.label) + '</th></tr>'; return; }
        if (l.t === 'grp') { body += '<tr class="rpt-grp"><td colspan="' + n + '">' + esc(l.label) + '</td></tr>'; return; }
        var lb = sh.mode === 'kd' && l.labelKd ? l.labelKd : l.label;
        body += '<tr class="' + (l.strong ? 'rpt-strong ' : '') + (l.result ? 'rpt-result ' : '') + (l.t === 'r' ? 'rpt-ratio' : '') + '"><th scope="row" class="rpt-label' + (l.indent ? ' rpt-ind' : '') + '">' + esc(lb) + '</th>' +
          sh.cols.map(function (c) { var x = snap.vals[sh.mode][c.key][l.metric]; return '<td class="num' + (c.label.indexOf('TỔNG') === 0 ? ' rpt-total-col' : '') + '">' + cellBtn(where, id, item, sh.mode, c.key, l.metric, fmtVal(l, x), lb + ' · ' + c.label) + '</td>'; }).join('') +
          (sh.notesCol ? '<td class="rpt-notes"><span class="small muted">' + esc(((snap.notes[sh.cols[0].key] || {})[l.metric] || []).slice(0, 4).join(', ')) + '</span></td>' : '') + '</tr>';
      });
      return '<div class="table-wrap"><table class="table table-compact rpt-table' + (sh.cols.length > 1 ? ' rpt-matrix' : '') + '" aria-label="' + esc(sh.title) + '"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
    }
    if (sh.kind === 'share') {
      var s = snap.share;
      if (!s || !s.rows.length) return TH.state('empty', { title: 'Chưa có cổ đông hiệu lực', text: 'Khai báo tỷ lệ ở SHARE-01.' });
      var c = function (i, f, v, lab) { return cellBtn(where, id, item, 'tong', '', 'share:' + i + ':' + f, f === 'ratio' ? v + '%' : '<span class="tnum' + (v < 0 ? ' neg' : '') + '">' + F.money(v).replace(/\s₫$/, '') + '</span>', lab); };
      return TH.table({ compact: true, label: 'Bảng chia cổ phần', cols: [
        { key: 'h', label: 'Cổ đông', render: function (r) { return '<span class="cell-main">' + esc(r.holder) + '</span>'; } },
        { key: 'ra', label: 'Tỷ lệ', num: true, render: function (r) { return c(r.i, 'ratio', r.ratio, r.holder + ' tỷ lệ'); } },
        { key: 'c', label: 'Vốn', num: true, render: function (r) { return c(r.i, 'capital', r.capital, r.holder + ' vốn'); } },
        { key: 'g', label: 'LN gộp', num: true, render: function (r) { return c(r.i, 'lng', r.lng, r.holder + ' LN gộp'); } },
        { key: 'n', label: 'LN ròng', num: true, render: function (r) { return c(r.i, 'lnr', r.lnr, r.holder + ' LN ròng'); } },
        { key: 't', label: 'Tổng nhận', num: true, render: function (r) { return c(r.i, 'total', r.total, r.holder + ' tổng nhận'); } },
      ], rows: s.rows.map(function (r, i) { return Object.assign({ i: i }, r); }), foot: { _label: '<b>Tổng ' + s.ratio + '%</b>', c: c('T', 'capital', s.capital, 'Tổng vốn'), g: c('T', 'lng', s.lng, 'Tổng LN gộp'), n: c('T', 'lnr', s.lnr, 'Tổng LN ròng'), t: c('T', 'total', s.total, 'Tổng nhận') } }) +
        '<p class="small muted" style="margin:8px 12px">Công thức tái hiện mẫu G1: Vốn = tỷ lệ × tiền thuê nhà kỳ; Tổng nhận = Vốn + LN ròng — không phải lệnh chi (R-08, D-07 chưa chốt).</p>';
    }
    if (sh.kind === 'src') {
      var rows = [];
      snap.buildingIds.forEach(function (b) { var src = snap.src[sh.mode][b] || {}; TH.PNL_LINES.forEach(function (l) { if (!l.k || DEF[l.k]) return; (src[l.k] || []).forEach(function (x) { rows.push({ l: l, b: b, x: x }); }); }); });
      return TH.table({ compact: true, label: 'Nguồn số liệu', cols: [
        { key: 'l', label: 'Dòng báo cáo', render: function (r) { return esc(r.l.label); } },
        { key: 'b', label: 'Tòa', render: function (r) { return esc(snap.labels[r.b].short); } },
        { key: 'k', label: 'Loại', render: function (r) { var m = KIND[r.x.kind] || [r.x.kind, 'neutral']; return TH.badge(m[0], m[1]); } },
        { key: 'id', label: 'Chứng từ', render: function (r) { return '<span class="mono small">' + esc(r.x.id || '') + '</span>'; } },
        { key: 't', label: 'Diễn giải / căn cứ', wrap: true, render: function (r) { return '<span class="small">' + esc(r.x.kind === 'payroll' && !canPayroll() ? 'Chi tiết lương bị hạn chế theo quyền' : srcText(r.x)) + '</span>'; } },
        { kind: 'money', key: 'a', label: 'Số tiền', num: true, render: function (r) { return r.l.count ? '<span class="muted">1 phòng</span>' : F.money(r.x.amount || 0); } },
      ], rows: rows, empty: { title: 'Không có nguồn' } });
    }
    var rr = Object.keys(DEF).map(function (k) { return { a: labelOf(k, 'tong'), b: DEF[k].text, c: '' }; }).concat(Object.keys(RATIO).map(function (k) { var r = TH.PNL_RATIOS.find(function (x) { return x.k === k; }); return { a: r.label, b: labelOf(RATIO[k][0], 'tong') + ' ÷ ' + labelOf(RATIO[k][1], 'tong'), c: 'Mẫu số 0 → Không áp dụng' }; })).concat(Object.keys(FILTER).map(function (k) { return { a: labelOf(k, 'tong'), b: 'Chỉ tiêu nguồn', c: FILTER[k] }; }));
    return TH.table({ compact: true, label: 'Công thức và quy tắc lọc', cols: [{ key: 'a', label: 'Chỉ tiêu', render: function (r) { return '<b>' + esc(r.a) + '</b>'; } }, { key: 'b', label: 'Công thức', wrap: true, render: function (r) { return '<span class="small">' + esc(r.b) + '</span>'; } }, { key: 'c', label: 'Quy tắc lọc / ghi chú', wrap: true, render: function (r) { return '<span class="small muted">' + esc(r.c) + '</span>'; } }], rows: rr }) +
      '<div class="card-bd small"><b>Quy tắc tính tiền tại lúc tạo:</b> ' + Object.keys(TH.BILL_RULE_LABELS).map(function (k) { return esc(TH.BILL_RULE_LABELS[k].label) + ': ' + esc(TH.BILL_RULE_LABELS[k].options[snap.rules[k]] || snap.rules[k]); }).join(' · ') + (snap.rules.status === 'proposed' ? ' ' + TH.openBadge('D-03', 'ĐỀ XUẤT') : '') + '<br><span class="muted">Mẫu ' + esc(snap.template) + ' · ' + esc(snap.engine) + ' · schema ' + snap.schema + '</span></div>';
  }
  function sheetsBlock(where, id, item, snap, key) {
    var cur = TH.store.ui(S, key, snap.sheets[0].id);
    if (!snap.sheets.some(function (s) { return s.id === cur; })) cur = snap.sheets[0].id;
    var sh = snap.sheets.find(function (s) { return s.id === cur; });
    var tabs = TH.tabs(S, snap.sheets.map(function (s) { return { id: s.id, label: s.name, icon: s.kind === 'stmt' ? 'sheet' : s.kind === 'share' ? 'pie' : s.kind === 'src' ? 'list' : 'calculator' }; }), cur, key);
    return '<div class="card card-flush u-mb-16">' + TH.cardHd(I('sheet', 'ic-sm') + esc(sh.title), (sh.kind === 'stmt' ? 'Bấm số để xem nguồn và cách tính · ' + (sh.mode === 'kd' ? 'chế độ Kinh doanh' : 'chế độ Tổng theo mẫu') : 'Sheet ' + esc(sh.name)) + ' · ' + snap.sheets.length + ' sheet sẽ xuất') +
      '<div style="padding:0 12px">' + tabs + '</div>' + TH.tabPanel(S, cur, '<div data-document>' + sheetHtml(where, id, item, snap, sh) + '</div>', key) + '</div>';
  }
  function itemPicker(d, cur) {
    if (d.items.length < 2) return '';
    return '<div class="toolbar" style="flex-wrap:wrap;margin-bottom:12px;border:0;padding:0">' + d.items.map(function (it, i) { return '<button type="button" class="filter-chip" aria-pressed="' + (i === cur) + '" data-act="ui.set" data-screen="' + S + '" data-key="item" data-val="' + i + '">' + esc(it.labels[it.buildingIds[0]].name) + '</button>'; }).join('') + '</div>';
  }
  function warnBlock(list, title, tone) {
    if (!list.length) return '';
    return '<div class="alert alert-' + tone + ' u-mb-12">' + I(tone === 'danger' ? 'xCircle' : 'alert', 'ic-sm') + '<div class="alert-body"><b>' + esc(title) + '</b><ul class="rpt-alert-list">' + list.map(function (w) { return '<li>' + esc(typeof w === 'string' ? w : w.text) + (w.href ? ' <a href="' + w.href + '" data-act="rptf.go" data-href="' + w.href + '">Mở nguồn</a>' : '') + '</li>'; }).join('') + '</ul></div></div>';
  }
  function previewView(id) {
    var d = draftOf(id);
    if (!d) return TH.pageHeader({ screen: S, title: 'Xem trước báo cáo', crumbs: [['Báo cáo theo mẫu Excel', TH.router.href(S)], ['Xem trước']] }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy bản xem trước', text: 'Bản xem trước đã hủy hoặc hết hạn. <a href="' + href('new') + '">Tạo lại</a>.' }) + '</div>';
    if (validate(d.request)) return forbidden(validate(d.request));
    if (d.runIds) return TH.pageHeader({ screen: S, title: 'Xem trước đã xác nhận', crumbs: [['Báo cáo theo mẫu Excel', TH.router.href(S)], ['Xem trước']] }) + '<div class="card"><div class="card-bd"><p>Bản xem trước này đã tạo: ' + d.runIds.map(function (r) { return '<a href="' + href('view/' + r) + '">' + esc(r) + '</a>'; }).join(', ') + '. Xác nhận lại không tạo bản trùng.</p></div></div>';
    var stale = d.stale || TH.reports.isStale(d);
    var cur = Math.min(+TH.store.ui(S, 'item', 0) || 0, d.items.length - 1), it = d.items[cur], rq = d.request;
    var n = d.items.length, canConfirm = !d.errors.length && !stale && (!d.warnings.length || d.ack);
    var head = TH.pageHeader({ screen: S, title: 'Xem trước ' + rq.type + ' · kỳ ' + F.period(rq.period), crumbs: [['Báo cáo theo mẫu Excel', TH.router.href(S)], ['Xem trước']],
      status: TH.badge('Chưa lưu', 'draft', { dot: true }) + (it.locked ? TH.badge('Kỳ đã khóa', 'neutral', { icon: 'lock' }) : ''),
      desc: esc(TYPES[rq.type].label) + ' · ' + esc(scopeLabel(rq.buildingIds)) + ' · tính lúc ' + esc(d.recalcAt || d.createdAt) + '. Số tính từ hóa đơn đã xác nhận, sổ cọc, chi phí đã duyệt, phân bổ chung và lương; preview và Excel dùng cùng một kết quả.',
      actions: '<button type="button" class="btn" data-act="rptf.back" data-id="' + d.id + '">' + I('chevronLeft', 'ic-sm') + 'Chỉnh lựa chọn</button><button type="button" class="btn" data-act="rptf.recalc" data-id="' + d.id + '">' + I('refresh', 'ic-sm') + 'Tính lại preview</button><button type="button" class="btn btn-ghost" data-act="rptf.cancel" data-id="' + d.id + '">Hủy</button>' });
    var staleBox = stale ? '<div class="alert alert-danger u-mb-12">' + I('refresh', 'ic-sm') + '<div class="alert-body"><b>Dữ liệu nguồn đã thay đổi sau khi xem trước</b><span>Bấm <b>Tính lại preview</b> và xem lại cảnh báo trước khi xác nhận.</span></div></div>' : '';
    var diff = d.diff ? '<div class="alert alert-info u-mb-12">' + I('compare', 'ic-sm') + '<div class="alert-body"><b>Tính lại lúc ' + esc(d.recalcAt) + ': ' + (d.diff.length ? d.diff.length + ' chỉ tiêu thay đổi' : 'không có chỉ tiêu thay đổi') + '</b>' + (d.diff.length ? '<ul class="rpt-alert-list">' + d.diff.slice(0, 8).map(function (x) { return '<li>' + esc(labelOf(x.metric, x.mode) + ' · ' + x.col + (x.mode === 'kd' ? ' (KD)' : '')) + ': ' + F.money(x.before) + ' → <b>' + F.money(x.after) + '</b></li>'; }).join('') + (d.diff.length > 8 ? '<li>… ' + (d.diff.length - 8) + ' chỉ tiêu khác</li>' : '') + '</ul>' : '<span>Nếu đã sửa hóa đơn ĐÃ XÁC NHẬN thì số không đổi: điều chỉnh đi theo quy trình kỳ sau; quy tắc/điện chung chỉ tính lại hóa đơn nháp (không vào doanh thu).</span>') + '</div></div>' : '';
    var ack = d.warnings.length ? '<label class="check" style="margin:4px 0 12px"><input type="checkbox" data-act-change="rptf.ack" data-id="' + d.id + '"' + (d.ack ? ' checked' : '') + (stale ? ' disabled' : '') + '><span>Tôi đã đọc ' + d.warnings.length + ' cảnh báo và vẫn tạo báo cáo</span></label>' : '';
    var extras = TH.rptExtras ? (rq.type === 'RPT-04' ? TH.rptExtras.rpt4(rq.period, it.buildingIds[0]) : TH.rptExtras.rpt5(rq.period, rq.buildingIds)) : '';
    var foot = '<div class="card rptf-confirm"><div class="card-bd row" style="gap:12px;flex-wrap:wrap;align-items:center"><span class="small">' + (d.errors.length ? '<b class="neg">Có lỗi số liệu — không tạo được.</b>' : stale ? '<b class="neg">Cần tính lại preview.</b>' : d.warnings.length && !d.ack ? 'Tích đã đọc cảnh báo để tạo.' : 'Sẵn sàng tạo bản lưu chỉ đọc.') + ' Hủy/quay lại không tạo báo cáo.</span><span class="spacer"></span>' +
      '<button type="button" class="btn btn-primary" data-act="rptf.confirm" data-id="' + d.id + '"' + (canConfirm ? '' : ' disabled') + '>' + I('check', 'ic-sm') + 'Xác nhận tạo ' + n + ' báo cáo</button></div></div>';
    return head + staleBox + warnBlock(d.errors, 'Lỗi số liệu — chặn tạo báo cáo', 'danger') + warnBlock(d.warnings, 'Cảnh báo nghiệp vụ (' + d.warnings.length + ')', 'warning') + ack + diff +
      itemPicker(d, cur) + sheetsBlock('draft', d.id, cur, it, 'sheet') +
      (extras ? '<div class="section-title u-my-8">Phân tích bổ sung theo gói <span class="small muted">· số liệu hiện tại, không thuộc bản lưu</span></div>' + extras : '') + foot;
  }
  function runView(id) {
    var r = runOf(id);
    if (!r) return TH.pageHeader({ screen: S, title: 'Bản báo cáo', crumbs: [['Báo cáo theo mẫu Excel', TH.router.href(S)], [id]] }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy bản báo cáo ' + esc(id) }) + '</div>';
    if (!canSee(r)) return forbidden('Bản báo cáo thuộc tòa/loại ngoài quyền của vai trò hiện tại.');
    var group = (TH.db.reportRuns || []).filter(function (x) { return x.groupKey === r.groupKey; }).sort(function (a, b) { return b.version - a.version; });
    var meta = TH.kv([['Mã', '<span class="mono">' + esc(r.id) + '</span>'], ['Loại', typeBadge(r.type) + ' ' + esc(TYPES[r.type].label)], ['Kỳ', F.period(r.period)], ['Phạm vi', esc(scopeLabel(r.buildingIds))], [TH.has('F045.D') ? 'Phiên bản' : 'Bản lưu', TH.has('F045.D') ? 'v' + r.version + (r.prevId ? ' · bản trước <a href="' + href('view/' + r.prevId) + '">' + esc(r.prevId) + '</a>' : '') + (r.fromRunId && r.fromRunId !== r.prevId ? ' · tạo từ ' + esc(r.fromRunId) : '') : 'Số liệu tại thời điểm tạo'],
      ['Người / lúc tạo', esc(C.staffName(r.createdBy)) + ' · ' + esc(r.createdAt)], ['Mẫu · bộ tính', esc(r.template) + ' · ' + esc(r.engine) + ' · schema ' + r.schema], ['Lưu trữ', r.storage === 'session' ? '<span class="warn-text">Chỉ trong phiên — trình duyệt chặn/đầy bộ nhớ</span>' : 'Trình duyệt (localStorage demo)']]);
    var versions = TH.has('F045.D') && group.length > 1 ? '<div class="card">' + TH.cardHd(I('history', 'ic-sm') + 'Các phiên bản cùng nhóm', group.length + ' bản') + '<div class="card-bd"><ul class="timeline">' + group.map(function (x) { return '<li>' + (x.id === r.id ? '<b>' + esc(x.id) + '</b> (đang xem)' : '<a href="' + href('view/' + x.id) + '">' + esc(x.id) + '</a>') + '<div class="when">' + esc(C.staffName(x.createdBy)) + ' · ' + esc(x.createdAt) + '</div></li>'; }).join('') + '</ul></div></div>' : '';
    return TH.pageHeader({ screen: S, title: r.id, crumbs: [['Báo cáo theo mẫu Excel', TH.router.href(S)], [r.id]], status: TH.badge('Bản lưu · chỉ đọc', 'success', { icon: 'lock' }),
      desc: 'Số liệu và nguồn hiển thị <b>tại thời điểm tạo báo cáo</b>; xem lại/tải Excel không tính lại theo dữ liệu hiện tại. Mở bản ghi sống ghi rõ “Mở dữ liệu hiện tại”.',
      actions: '<button type="button" class="btn" data-act="rptf.xlsx" data-id="' + r.id + '">' + I('download', 'ic-sm') + 'Tải Excel</button><button type="button" class="btn btn-primary" data-act="rptf.version" data-id="' + r.id + '">' + I('refresh', 'ic-sm') + 'Tạo phiên bản mới</button>' }) +
      '<div class="grid-main-side u-mb-16"><div class="card"><div class="card-bd">' + meta + '</div></div><div class="stack">' + (r.warnings.length ? warnBlock(r.warnings, 'Cảnh báo đã đọc khi tạo (' + r.warnings.length + ')', 'warning') : '<div class="alert alert-success">' + I('checkCircle', 'ic-sm') + '<div class="alert-body">Không có cảnh báo khi tạo.</div></div>') + versions + '</div></div>' +
      sheetsBlock('run', r.id, 0, r.snapshot, 'vsheet');
  }

  TH.views[S] = {
    scan: function () { return [{ param: null }, { param: 'new' }, { param: 'new', ui: { req: { type: 'RPT-05', period: '2026-09', buildingIds: ['TH-CG', 'TH-DD', 'TH-TX'] } } }]; },
    dialogs: [function () { var r = TH.reports.preview({ type: 'RPT-05', period: TH.store.state.period, buildingIds: allowedIds() }, { transient: true }); if (r.ok) { TH._transientDraft = r.draft; return traceRender({ where: 'draft', id: r.draft.id, item: 0, mode: 'kd', col: keyOf(r.draft.items[0].buildingIds), metric: 'rent' }); } },
      function () { var r = TH.reports.preview({ type: 'RPT-04', period: TH.store.state.period, buildingIds: [allowedIds()[0]] }, { transient: true }); if (r.ok) { TH._transientDraft = r.draft; sheetsBlock('draft', r.draft.id, 0, r.draft.items[0], 'sheet'); return traceRender({ where: 'draft', id: r.draft.id, item: 0, mode: 'tong', col: '', metric: 'share:0:total' }); } }],
    render: function (rt) {
      var p = rt.param || '';
      if (!Object.keys(TYPES).some(canType)) return forbidden('Vai trò hiện tại không được mở báo cáo theo mẫu (RPT-04/RPT-05).');
      if (p === 'new') return newView();
      if (p.indexOf('preview/') === 0) return previewView(p.slice(8));
      if (p.indexOf('view/') === 0) return runView(p.slice(5));
      return listView();
    },
  };
  /* Route cũ RPT-04 / RPT-05 → form tạo có ngữ cảnh điền sẵn (không tự tạo báo cáo khi mở link) + bản đã tạo cùng loại */
  TH.reportLegacy = function (type, ctx) {
    var r = req();
    if (TH.store.ui(S, 'legacy', null) !== type + '|' + TH.store.state.period + '|' + (ctx.b || '')) {
      TH.reportPrefill(type, { period: TH.store.state.period, buildingIds: type === 'RPT-04' ? [ctx.b || r.buildingIds[0] || allowedIds()[0]] : (TH.scope() !== 'ALL' ? [TH.scope()] : allowedIds()) });
      TH.store.state.ui[S].legacy = type + '|' + TH.store.state.period + '|' + (ctx.b || '');
      TH.store.state.ui[S].ft = type;
    }
    var mine = (TH.db.reportRuns || []).filter(function (x) { return x.type === type && canSee(x); }).slice(-5).reverse();
    return '<div class="alert alert-info u-mb-16">' + I('info', 'ic-sm') + '<div class="alert-body"><b>' + type + ' đã chuyển sang luồng “Báo cáo theo mẫu Excel”</b><span>Form dưới đây đã điền sẵn loại, kỳ và tòa từ link. Mở link không tạo báo cáo — bấm Xem trước rồi Xác nhận. <a href="' + TH.router.href(S) + '">Danh sách báo cáo đã tạo</a>.</span></div></div>' +
      newView({ noHeader: true }) +
      (mine.length ? '<div class="card u-mt-16">' + TH.cardHd(I('history', 'ic-sm') + 'Bản ' + type + ' đã tạo gần đây') + '<div class="card-bd"><ul class="timeline">' + mine.map(function (x) { return '<li><a href="' + href('view/' + x.id) + '">' + esc(x.id) + '</a> · ' + esc(scopeLabel(x.buildingIds)) + '<div class="when">' + esc(C.staffName(x.createdBy)) + ' · ' + esc(x.createdAt) + '</div></li>'; }).join('') + '</ul></div></div>' : '');
  };

  /* ---------- Truy nguồn (modal) ---------- */
  var traceStack = [];
  function srcRowHtml(x, snap) {
    var m = KIND[x.kind] || [x.kind, 'neutral'];
    var restricted = x.kind === 'payroll' && !canPayroll();
    var det = '';
    if (x.kind === 'invoice' && x.lines) det = '<ul class="rptf-lines">' + x.lines.map(function (l) { return '<li>' + esc(l.name) + ' · <b>' + F.money(l.contrib) + '</b>' + (l.contrib !== l.amount ? ' <span class="muted">(dòng ' + F.money(l.amount) + ')</span>' : '') + '<span class="muted">' + esc(basisText(l)) + '</span>' + (l.missingBasis ? ' ' + TH.badge('Thiếu căn cứ lịch sử', 'warning') : '') + (l.type === 'adjust' && l.basis ? ' <span class="muted">· lý do: ' + esc(l.basis.reason || '') + ' · kỳ hiệu lực ' + F.period(l.basis.period) + '</span>' : '') + (l.type === 'common' && l.basis ? ' <span class="muted">· phần phòng trống ' + l.basis.vacant + ' (quy tắc ' + esc(l.basis.rule) + ', thất thoát ' + F.money(l.basis.loss) + ')</span>' : '') + '</li>'; }).join('') + '</ul>';
    else if (!restricted) det = '<div class="small muted">' + esc(srcText(x)) + '</div>';
    if (!restricted && x.sourceRule) det += '<div class="small muted">Dữ liệu mô phỏng · ' + esc(x.sourceRule.title + ' · ' + x.sourceRule.source.file + (x.sourceRule.source.cell ? ' · ' + x.sourceRule.source.cell : '')) + '</div>';
    return '<tr><td>' + TH.badge(m[0], m[1]) + '</td><td><span class="mono small">' + esc(x.id || '—') + '</span>' + (x.kind === 'invoice' && x.invPeriod ? '<div class="cell-sub">kỳ ' + F.period(x.invPeriod) + '</div>' : '') + '</td><td>' + esc(x.room || '—') + '</td><td>' + (restricted ? '<span class="small muted">Chi tiết lương bị hạn chế theo quyền</span>' : det) + '</td><td class="num">' + (x.amount !== undefined ? F.money(x.amount) : '—') + '</td><td>' +
      (x.id ? '<button type="button" class="btn btn-xs btn-ghost" data-act="rptf.open" data-kind="' + esc(x.kind) + '" data-id="' + esc(x.id) + '" data-room="' + esc(x.room || '') + '" data-b="' + esc(x.buildingId || '') + '" data-p="' + esc(snap.period) + '" data-c="' + esc(x.contractId || x.customerId || '') + '">Mở dữ liệu hiện tại</button>' : '') + '</td></tr>';
  }
  function traceRender(ctx) {
    var t = TH.reports.trace(ctx);
    if (!t) return { title: 'Không tìm thấy nguồn', body: TH.state('empty', { title: 'Ô không còn trong bản xem trước' }), foot: '<button type="button" class="btn" data-close>Đóng</button>' };
    var snap = t.snap, sheetLbl = (ctx.where === 'run' ? 'Bản lưu ' + ctx.id : 'Xem trước') + ' · kỳ ' + F.period(snap.period);
    var val = t.kind === 'ratio' ? (t.na ? 'Không áp dụng' : (t.times ? (t.value).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' lần' : F.pct(t.value, 2))) : t.count ? t.value + ' phòng' : F.money(t.value);
    var go = function (metric, col, label, v) { return '<button type="button" class="link-btn" data-act="rptf.tdrill" data-m="' + esc(metric) + '" data-col="' + esc(col) + '" aria-label="Xem nguồn ' + esc(label) + '">' + esc(label) + '</button>'; };
    var body = '<dl class="kv u-mb-12"><dt>Ngữ cảnh</dt><dd>' + esc(sheetLbl) + (t.colLabel ? ' · cột <b>' + esc(t.colLabel) + '</b>' : '') + (t.mode ? ' · ' + (t.mode === 'kd' ? 'chế độ Kinh doanh' : 'chế độ Tổng') : '') + '</dd><dt>Giá trị</dt><dd><b class="tnum" style="font-size:18px">' + esc(val) + '</b></dd>' + (t.formula ? '<dt>Công thức</dt><dd>' + esc(t.formula) + '</dd>' : '') + (t.filter ? '<dt>Quy tắc lọc</dt><dd class="small">' + esc(t.filter) + '</dd>' : '') + '</dl>';
    if (t.kind === 'ratio') body += '<table class="table table-compact"><tbody><tr><th>Tử số</th><td>' + go(t.num.metric, ctx.col, labelOf(t.num.metric, t.mode)) + '</td><td class="num">' + F.money(t.num.value) + '</td></tr><tr><th>Mẫu số</th><td>' + go(t.den.metric, ctx.col, labelOf(t.den.metric, t.mode)) + '</td><td class="num">' + F.money(t.den.value) + '</td></tr></tbody></table>' + (t.na ? '<p class="small muted">Mẫu số bằng 0 → chỉ tiêu không áp dụng (không hiển thị 0%).</p>' : '');
    if (t.kind === 'derived') body += '<table class="table table-compact" aria-label="Thành phần"><thead><tr><th>Thành phần</th><th class="num">Dấu</th><th class="num">Giá trị</th></tr></thead><tbody>' + t.parts.map(function (x) { return '<tr><td>' + go(x.metric, ctx.col, x.label) + '</td><td class="num">' + (x.sign < 0 ? '−' : '+') + '</td><td class="num">' + F.money(x.value) + '</td></tr>'; }).join('') + '</tbody><tfoot><tr><th>Đối chiếu</th><td></td><td class="num"><b>' + F.money(t.check) + '</b>' + (Math.abs(t.check - t.value) > TOL ? ' <span class="neg">lệch ' + F.money(t.value - t.check) + '</span>' : ' ✓') + '</td></tr></tfoot></table>';
    if (t.kind === 'leaf' && t.contrib) body += '<table class="table table-compact" aria-label="Đóng góp từng tòa"><thead><tr><th>Tòa</th><th class="num">Giá trị</th></tr></thead><tbody>' + t.contrib.map(function (x) { return '<tr><td>' + go(t.metric, x.col, x.label) + '</td><td class="num">' + (t.count ? x.value : F.money(x.value)) + '</td></tr>'; }).join('') + '</tbody><tfoot><tr><th>Σ tòa</th><td class="num"><b>' + (t.count ? t.check : F.money(t.check)) + '</b>' + (Math.abs(t.check - t.value) > TOL ? ' <span class="neg">lệch</span>' : ' ✓') + '</td></tr></tfoot></table>';
    if (t.kind === 'leaf' && t.sources) {
      body += '<div class="table-wrap"><table class="table table-compact" aria-label="Nguồn đóng góp"><thead><tr><th>Loại</th><th>Chứng từ</th><th>Phòng</th><th>Căn cứ (tại thời điểm tạo)</th><th class="num">Số tiền</th><th></th></tr></thead><tbody>' + (t.sources.length ? t.sources.map(function (x) { return srcRowHtml(x, snap); }).join('') : '<tr><td colspan="6" class="muted small">Không có bản ghi nguồn — dòng bằng 0 trong kỳ.</td></tr>') + '</tbody></table></div>';
      body += '<p class="small u-mt-8">Σ nguồn ' + (t.count ? t.check + ' bản ghi' : F.money(t.check)) + ' · báo cáo ' + (t.count ? t.value : F.money(t.value)) + ' · chênh lệch làm tròn ' + (t.count ? t.value - t.check : F.money(t.value - t.check)) + (Math.abs(t.check - t.value) > TOL ? ' <span class="neg">— không đối chiếu được</span>' : ' ✓') + '</p>';
      if (t.excluded && t.excluded.length) body += '<div class="alert alert-neutral u-mt-8">' + I('info', 'ic-sm') + '<div class="alert-body"><b>' + esc(t.excludedNote) + '</b><span>' + t.excluded.map(function (x) { return esc(x.id + ' ' + F.money(x.amount)); }).join(', ') + '</span></div></div>';
      if (t.notes && t.notes.length) body += '<p class="small muted">Ghi chú dòng: ' + esc(t.notes.join(', ')) + '</p>';
    }
    if (t.kind === 'share') body += t.restricted ? '<p class="small muted">Chi tiết cổ phần bị hạn chế theo quyền.</p>' : '<p class="small">Tỷ lệ <b>' + t.ratio + '%</b>' + (t.base !== null && t.base !== undefined ? ' × ' + F.money(t.base) + ' = <b>' + F.money(Math.round(t.base * t.ratio / 100)) + '</b>' : '') + '. Nguồn tỷ lệ: SHARE-01 (hiệu lực kỳ). Ô tổng = Σ các cổ đông.</p>' + (snap.share ? '<p class="small muted">Căn cứ: tiền thuê nhà ' + F.money(snap.share.base.cRent) + ' · LNG ' + F.money(snap.share.base.lng) + ' · LNR ' + F.money(snap.share.base.lnr) + ' (chế độ Tổng)</p>' : '');
    var draftWarn = '';
    if (ctx.where === 'draft' && t.kind === 'leaf') { var dn = TH.db.invoices.filter(function (i) { return i.period === snap.period && i.status === 'draft' && (t.ids || []).indexOf(i.buildingId) > -1; }).length; if (dn) draftWarn = '<p class="small warn-text">' + dn + ' hóa đơn nháp của kỳ bị loại (chưa xác nhận).</p>'; }
    return { title: I('sheet') + ' Nguồn và cách tính · ' + esc(t.label), sub: esc(sheetLbl), body: body + draftWarn,
      foot: (traceStack.length > 1 ? '<button type="button" class="btn" data-act="rptf.tback">' + I('chevronLeft', 'ic-sm') + 'Quay lại</button>' : '') + '<span class="spacer"></span><button type="button" class="btn" data-close>Đóng</button>' };
  }
  function openTrace() { var ctx = traceStack[traceStack.length - 1]; TH.modal.open({ key: 'rptf-trace', size: 'lg', render: function () { return traceRender(ctx); } }); }
  TH.reportTraceRender = traceRender;

  /* ---------- Hành động ---------- */
  TH.act['rptf.new'] = function () { TH.store.setUi(S, 'err', ''); goSub('new'); };
  TH.onChange['rptf.type'] = function (el) { setReq({ type: el.value }); TH.app.refresh(); };
  TH.onChange['rptf.period'] = function (el) { setReq({ period: el.value }); TH.app.refresh(); };
  TH.onChange['rptf.tpl'] = function (el) { setReq({ tpl: el.value }); TH.app.refresh(); };
  TH.onChange['rptf.b'] = function (el) { var r = req(), b = el.dataset.b, ids = r.buildingIds.filter(function (x) { return x !== b; }); if (el.checked) ids.push(b); setReq({ buildingIds: ids }); TH.app.refresh(); };
  TH.onChange['rptf.all'] = function (el) { setReq({ buildingIds: el.checked ? allowedIds() : [] }); TH.app.refresh(); };
  TH.act['rptf.preview'] = function () {
    var res = TH.reports.preview(req());
    if (!res.ok) { TH.store.setUi(S, 'err', res.error); TH.app.refresh(); return; }
    TH.store.setUi(S, 'err', ''); TH.store.setUi(S, 'item', 0); TH.store.setUi(S, 'sheet', null);
    goSub('preview/' + res.draft.id);
  };
  TH.act['rptf.recalc'] = function (el) { var d = TH.reports.recalc(el.dataset.id); TH.app.refresh(); if (d) TH.toast('Đã tính lại preview', d.diff.length ? d.diff.length + ' chỉ tiêu thay đổi — xem lại cảnh báo.' : 'Không có chỉ tiêu thay đổi.', d.diff.length ? 'info' : 'success'); };
  TH.act['rptf.cancel'] = function (el) { TH.reports.cancel(el.dataset.id); goSub(''); TH.toast('Đã hủy xem trước', 'Không có báo cáo nào được tạo.', 'info'); };
  TH.act['rptf.back'] = function (el) { var d = draftOf(el.dataset.id); if (d) TH.store.setUi(S, 'req', deep(d.request)); goSub('new'); };
  TH.onChange['rptf.ack'] = function (el) { var d = draftOf(el.dataset.id); if (d) { d.ack = el.checked; TH.store.persist(); } TH.app.refresh(); };
  TH.act['rptf.confirm'] = function (el) {
    var d = draftOf(el.dataset.id); if (!d) return;
    if (d.runIds) { goSub('view/' + d.runIds[0]); return; }
    el.disabled = true;
    var res = TH.reports.confirm(d.id, { acknowledgeWarnings: d.ack });
    if (!res.ok) { TH.app.refresh(); TH.toast('Chưa tạo báo cáo', esc(res.error), 'danger'); return; }
    TH.store.setUi(S, 'ft', 'all');
    goSub(res.runIds.length === 1 ? 'view/' + res.runIds[0] : '');
    TH.toast('Đã tạo ' + res.runIds.length + ' báo cáo', esc(res.runIds.join(', ')) + (res.durable ? ' · đã lưu trong trình duyệt' : ' · CHỈ LƯU TRONG PHIÊN — bộ nhớ trình duyệt bị chặn/đầy, tải lại trang sẽ mất'), res.durable ? 'success' : 'warning');
  };
  TH.act['rptf.xlsx'] = function (el) { var x = TH.reports.export(el.dataset.id); if (x) TH.toast('Đã tải Excel', esc(x.filename) + ' · ' + x.sheets.length + ' sheet từ bản lưu'); else TH.toast('Không tải được', 'Bản báo cáo không tồn tại hoặc ngoài quyền.', 'danger'); };
  TH.act['rptf.version'] = function (el) {
    var r = runOf(el.dataset.id); if (!r || !canSee(r)) return;
    var res = TH.reports.preview({ type: r.type, period: r.period, buildingIds: r.buildingIds, tpl: (r.template || '').split(' ')[0], previousRunId: r.id });
    if (!res.ok) { TH.toast('Không tạo được preview', esc(res.error), 'danger'); return; }
    TH.store.setUi(S, 'item', 0); goSub('preview/' + res.draft.id);
  };
  TH.act['rptf.trace'] = function (el) {
    var ctx = { where: el.dataset.where, id: el.dataset.id, item: +el.dataset.item || 0, mode: el.dataset.mode, col: el.dataset.col, metric: el.dataset.m };
    traceStack = [ctx]; openTrace();
  };
  TH.act['rptf.tdrill'] = function (el) { var top = traceStack[traceStack.length - 1]; traceStack.push(Object.assign({}, top, { metric: el.dataset.m, col: el.dataset.col || top.col })); openTrace(); };
  TH.act['rptf.tback'] = function () { if (traceStack.length > 1) traceStack.pop(); openTrace(); };
  /* Mở dữ liệu hiện tại của nguồn: kiểm tra quyền màn + phạm vi tòa; giữ kỳ và đường quay về */
  function liveTarget(d) {
    var k = d.kind;
    if (k === 'invoice' || k === 'prepaid') { var inv = C.invoice(d.id); return inv ? { screen: 'INV-03', param: inv.id, b: inv.buildingId } : null; }
    if (k === 'contract') { var ct = C.contract(d.id); return ct ? { screen: 'CON-02', param: ct.id, b: ct.buildingId } : null; }
    if (k === 'room') { var rm = C.room(d.id); return rm ? { screen: 'ROOM-02', param: rm.id, b: rm.buildingId } : null; }
    if (k === 'break') { var bc = (TH.db.breakCases || []).find(function (x) { return x.id === d.id; }); return bc ? { screen: 'PAY-02', ui: { tab: 'break' }, b: bc.buildingId } : null; }
    if (k === 'deposit') { var dp = (TH.db.deposits || []).find(function (x) { return x.id === d.id; }); return dp ? (dp.contractId && C.contract(dp.contractId) ? { screen: 'CUS-02', param: dp.contractId, ui: { tab: 'fin' }, b: dp.buildingId } : { modal: 'deposit', rec: dp, b: dp.buildingId }) : null; }
    if (k === 'expense') { var e = TH.db.expenses.find(function (x) { return x.id === d.id; }); return e ? { modal: 'expense', rec: e, b: e.buildingId } : null; }
    if (k === 'arising') { var a = (TH.db.arisingRent || []).find(function (x) { return x.id === d.id; }); return a ? { modal: 'arising', rec: a, b: a.buildingId } : null; }
    if (k === 'payroll') return { screen: 'SAL-01', perm: 'salary.view' };
    if (k === 'pool') return { act: 'pool', perm: 'report.all' };
    if (k === 'lease') { var ls = (TH.db.leases || []).find(function (x) { return x.id === d.id; }); return ls ? { screen: 'BLD-02', param: ls.buildingId, b: ls.buildingId } : null; }
    return null;
  }
  TH.act['rptf.open'] = function (el) {
    var d = el.dataset, tg = liveTarget(d);
    if (!tg) { TH.toast('Nguồn không còn trong dữ liệu hiện tại', 'Bản ghi ' + esc(d.id) + ' đã bị xóa — báo cáo vẫn giữ bằng chứng đã lưu.', 'warning'); return; }
    if ((tg.perm && !TH.can(tg.perm)) || (tg.screen && !TH.canScreen(tg.screen)) || (tg.b && !TH.inScope(tg.b))) { TH.toast('Không có quyền (403)', 'Vai trò hiện tại không được mở nguồn này; báo cáo không tự cấp quyền sửa/xem chi tiết.', 'danger'); return; }
    if (tg.modal) {
      var r = tg.rec;
      TH.modal.open({ key: 'rptf-live', size: 'md', render: function () { return { title: 'Dữ liệu hiện tại · ' + esc(r.id), sub: 'Bản ghi sống — có thể khác căn cứ đã lưu trong báo cáo', body: TH.kv(Object.keys(r).filter(function (k) { return typeof r[k] !== 'object'; }).map(function (k) { return [k, esc(String(r[k]))]; })) + (tg.modal === 'expense' ? '<p class="small muted u-mt-8">Duyệt/sửa chi phí ở <a href="' + TH.router.href('EXP-01') + '" data-close>EXP-01</a> (theo quyền và khóa kỳ).</p>' : ''), foot: '<button type="button" class="btn" data-close>Đóng</button>' }; } });
      return;
    }
    TH.store.state.reportReturn = { hash: location.hash, label: (location.hash.indexOf('/view/') > -1 ? 'bản báo cáo ' : 'xem trước báo cáo') };
    TH.store.set('period', d.p || TH.store.state.period);
    if (tg.act === 'pool') { TH.modal.stack.slice().forEach(function (m) { TH.modal.close(m.key, { silent: true }); }); TH.act['rpt4.pool'](); return; }
    if (tg.ui) Object.keys(tg.ui).forEach(function (k) { TH.store.setUi(tg.screen, k, tg.ui[k]); });
    TH.modal.stack.slice().forEach(function (m) { TH.modal.close(m.key, { silent: true }); });
    TH.go(tg.screen, tg.param);
  };
  TH.act['rptf.go'] = function (el) { TH.store.state.reportReturn = { hash: location.hash, label: 'xem trước báo cáo' }; location.hash = el.dataset.href; };
  TH.reportReturnBanner = function () {
    var rr = TH.store.state.reportReturn;
    if (!rr) return '';
    return '<div class="alert alert-info rptf-return u-mb-12">' + I('chevronLeft', 'ic-sm') + '<div class="alert-body"><b>Đang mở dữ liệu nguồn từ ' + esc(rr.label) + '</b><span>Sửa theo quyền và khóa kỳ hiện có; quay về rồi bấm <b>Tính lại preview</b> để thấy chỉ tiêu thay đổi.</span></div><button type="button" class="btn btn-sm" data-act="rptf.return">Quay về báo cáo</button><button type="button" class="btn btn-sm btn-ghost" data-act="rptf.returnClose" aria-label="Ẩn thanh quay về">' + I('x', 'ic-sm') + '</button></div>';
  };
  TH.act['rptf.return'] = function () { var rr = TH.store.state.reportReturn; TH.store.state.reportReturn = null; if (rr) location.hash = rr.hash; };
  TH.act['rptf.returnClose'] = function () { TH.store.state.reportReturn = null; TH.app.refresh(); };
})();
