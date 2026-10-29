/* CR-RPT-02 — Báo cáo theo mẫu Excel (docs/TIMEHOUSE_REPORT_WORKFLOW_PLAN.md).
 * Luồng: danh sách bản đã tạo → chọn loại/tháng/tòa → xem trước (draft) → xác nhận → bản lưu bất biến (ReportRun) → tải Excel / tạo phiên bản mới.
 * Áp dụng RPT-04 (mỗi tòa một bản) và RPT-05 (một bản tổng hợp các tòa chọn). Số liệu tính một lần bằng C.pnl / C.shareSplit, preview và Excel
 * dựng từ cùng snapshot; mọi ô số truy được công thức → thành phần → nguồn (TH.reports.trace). */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc, S = 'REPORTS';
  var ENGINE = 'RPT-ENGINE v1 · pnl.js schema 12';
  /* CR-RPT-03: báo cáo gom theo nhóm (tab màn danh sách); loại báo cáo khai báo nhóm, gói, mẫu. Loại bổ sung đăng ký qua TH.reports.register (js/views/opsreports.js). */
  var GROUPS = [
    { id: 'fin', label: 'Báo cáo tài chính', icon: 'chart' },
    { id: 'ops', label: 'Báo cáo vận hành', icon: 'building' },
    { id: 'cus', label: 'Báo cáo khách hàng', icon: 'users' },
  ];
  var TYPES = {
    'RPT-04': { label: 'Doanh thu theo tòa (mẫu G1)', tpl: 'MAU-G1 · v1 (G1.31.8.26.xlsx)', per: 'building', group: 'fin', tier: 'A', desc: 'Mẫu G1: doanh thu, cọc, phòng, giá vốn, chi phí, lợi nhuận và chia cổ phần từng tòa.' },
    'RPT-05': { label: 'Báo cáo kinh doanh tháng', tpl: 'MAU-BCKD', per: 'set', group: 'fin', tier: 'A', desc: 'Báo cáo tổng và báo cáo kinh doanh: cột Tổng, từng tòa, nhóm nhà.' },
  };
  var BASE_TYPES = ['RPT-04', 'RPT-05'];
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
  var KIND = { invoice: ['Hóa đơn', 'teal'], prepaid: ['Trả trước', 'teal'], arising: ['Tiền phòng phát sinh', 'teal'], deposit: ['Cọc', 'info'], expense: ['Chi phí', 'warning'], pool: ['Phân bổ chung', 'neutral'], payroll: ['Lương', 'draft'], contract: ['Hợp đồng', 'teal'], room: ['Phòng', 'neutral'], break: ['Phá HĐ', 'danger'], lease: ['HĐ thuê tòa', 'neutral'], estimate: ['Ước tính', 'warning'] };
  /* Nhóm minh chứng để rà soát trong preview (theo loại nguồn) */
  var EVIDENCE = { invoice: 'Hóa đơn và tiền đã thu', prepaid: 'Hóa đơn và tiền đã thu', arising: 'Hóa đơn và tiền đã thu', expense: 'Chi phí và chứng từ chi', deposit: 'Sổ cọc', contract: 'Hợp đồng và hồ sơ khách', room: 'Phòng và trạng thái phòng', break: 'Hợp đồng và hồ sơ khách', lease: 'Hợp đồng thuê tòa', payroll: 'Lương và phân bổ chung', pool: 'Lương và phân bổ chung', estimate: 'Số ước tính chưa có chứng từ' };
  var TOL = 1; // đồng — chênh lệch làm tròn cho phép

  /* ---------- Công thức: thành phần × hệ số ----------
   * sum:   { kind:'sum', parts:[[chỉ tiêu, hệ số], …] }          → Σ hệ số × giá trị (làm tròn đồng)
   * ratio: { kind:'ratio', num:[[…]], den:[[…]] }                 → Σ tử ÷ Σ mẫu (mẫu 0 → không áp dụng)
   * Công thức chuẩn của RPT-04/RPT-05 = DEF/RATIO (đúng finalize() của pnl.js); loại bổ sung khai báo formulas riêng.
   * Phần sửa lưu theo yêu cầu báo cáo (req.formulas[k] = { parts|num/den, reason, by, at }) và đi cùng bản lưu. */
  function stdFormulas(type) {
    var t = TYPES[type];
    if (t && t.formulas) return t.formulas;
    var o = {};
    Object.keys(DEF).forEach(function (k) { o[k] = { kind: 'sum', parts: DEF[k].parts.map(function (p) { return p.slice(); }), text: DEF[k].text }; });
    Object.keys(RATIO).forEach(function (k) { o['r:' + k] = { kind: 'ratio', num: [[RATIO[k][0], 1]], den: [[RATIO[k][1], 1]] }; });
    return o;
  }
  function effFormulas(type, ov) {
    var std = stdFormulas(type), o = {};
    Object.keys(std).forEach(function (k) {
      var e = ov && ov[k];
      o[k] = e ? { kind: std[k].kind, parts: e.parts, num: e.num, den: e.den, edited: true, reason: e.reason || '', by: e.by || null, at: e.at || null, std: deep(std[k]) } : deep(std[k]);
    });
    return o;
  }
  function formulaDeps(f) { return (f.kind === 'ratio' ? (f.num || []).concat(f.den || []) : f.parts || []).map(function (p) { return p[0]; }); }
  function formulaOrder(eff) {
    var out = [], seen = {}, busy = {};
    var visit = function (k) { if (seen[k] || !eff[k]) return; if (busy[k]) throw new Error('Công thức vòng lặp ở ' + k); busy[k] = 1; formulaDeps(eff[k]).forEach(visit); busy[k] = 0; seen[k] = 1; out.push(k); };
    Object.keys(eff).forEach(visit);
    return out;
  }
  function sumParts(parts, vv) { return (parts || []).reduce(function (a, p) { return a + p[1] * (vv[p[0]] || 0); }, 0); }
  function evalFormula(f, vv) {
    if (f.kind === 'ratio') { var d = sumParts(f.den, vv); return d ? sumParts(f.num, vv) / d : null; }
    return Math.round(sumParts(f.parts, vv));
  }
  /* Tính lại chỉ tiêu dẫn xuất trên mọi cột của bản số liệu theo công thức đang dùng */
  function applyFormulas(snap, eff) {
    var order = formulaOrder(eff);
    Object.keys(snap.vals).forEach(function (mode) { Object.keys(snap.vals[mode]).forEach(function (ck) { var vv = snap.vals[mode][ck]; order.forEach(function (k) { vv[k] = evalFormula(eff[k], vv); }); }); });
  }
  function hasEdits(ov) { return !!ov && Object.keys(ov).length > 0; }
  function editedKeys(snap) { var f = snap.formulas || {}; return Object.keys(f).filter(function (k) { return f[k].edited; }); }
  function wText(w) { var a = Math.abs(w); return a === 1 ? '' : a.toLocaleString('vi-VN', { maximumFractionDigits: 4 }) + ' × '; }
  function partsText(parts, snap, mode) {
    if (!parts || !parts.length) return '0';
    return parts.map(function (p, i) { return (i ? (p[1] < 0 ? ' − ' : ' + ') : (p[1] < 0 ? '− ' : '')) + wText(p[1]) + labelOf(p[0], mode, snap); }).join('');
  }
  function formulaText(f, snap, mode, forceGen) {
    if (!f) return '';
    if (f.text && !f.edited && !forceGen) return f.text;
    if (f.kind === 'ratio') return '(' + partsText(f.num, snap, mode) + ') ÷ (' + partsText(f.den, snap, mode) + ')';
    return partsText(f.parts, snap, mode);
  }

  function deep(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }
  function hash(str) { var h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(16); }
  function keyOf(ids) { return 'S:' + ids.slice().sort().join('+'); }
  /* Thứ tự hiển thị tòa theo danh mục tòa (T17, S9, G1), không theo bảng chữ cái; khóa/nhóm phiên bản vẫn dùng thứ tự sắp xếp */
  function ordered(ids) { var order = TH.db.buildings.map(function (b) { return b.id; }); return ids.slice().sort(function (a, b) { return order.indexOf(a) - order.indexOf(b) || (a < b ? -1 : a > b ? 1 : 0); }); }
  function mm(p) { return String(+p.slice(5)) + '/' + p.slice(0, 4); }
  function groupOf(bId) { return (TH.db.buildingGroups || []).find(function (g) { return g.buildings.indexOf(bId) > -1; }) || null; }
  function now() { var d = new Date(); return TH.TODAY + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  /* Route theo plan: #/demo/reports · /new · /preview/<draftId> · /view/<runId> (không mã hóa dấu /) */
  function href(sub) { return '#/demo/reports' + (sub ? '/' + sub : ''); }
  function goSub(sub) { TH.router.go(href(sub)); }
  /* Loại báo cáo dùng được: đúng gói (tier), đúng quyền riêng (perm) và vai trò được mở màn tương ứng */
  function canType(t) {
    var d = TYPES[t];
    if (!d || !TH.has(d.tier || 'A')) return false;
    if (d.perm && !TH.can(d.perm)) return false;
    return TH.canScreen(BASE_TYPES.indexOf(t) > -1 ? t : S);
  }
  function lockReason(t) {
    var d = TYPES[t];
    if (!TH.has(d.tier || 'A')) return 'Có từ ' + TH.PACKAGES[d.tier].name + ' · ' + TH.PACKAGES[d.tier].price;
    if (d.perm && !TH.can(d.perm)) return 'Vai trò hiện tại không được tạo loại báo cáo này';
    return canType(t) ? '' : 'Vai trò hiện tại không được mở loại báo cáo này';
  }
  function canEditFormula() { return TH.can('report.all'); }
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
    ids = ordered(ids);
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
  /* Loại bổ sung: chỉ tiêu nguồn = Σ minh chứng; cột Tổng = Σ tòa; chỉ tiêu dẫn xuất = công thức đang dùng */
  function verifyGeneric(snap) {
    var errors = [], eff = snap.formulas || {}, md = snap.mdefs || {};
    Object.keys(snap.vals).forEach(function (mode) {
      Object.keys(snap.vals[mode]).forEach(function (ck) {
        var vv = snap.vals[mode][ck], col = snap.cols[ck];
        Object.keys(md).forEach(function (k) {
          var d = md[k], x = vv[k];
          if (eff[k] && eff[k].kind === 'ratio') { if (x !== null && !isFinite(x)) errors.push('Tỷ lệ không hữu hạn: ' + d.label + ' · ' + col.label); return; }
          if (!(typeof x === 'number' && isFinite(x))) { errors.push('Giá trị không hữu hạn: ' + d.label + ' · ' + col.label); return; }
          if (eff[k]) { var s = Math.round(sumParts(eff[k].parts, vv)); if (Math.abs(s - x) > TOL) errors.push('Công thức không đối chiếu được: ' + d.label + ' · ' + col.label); return; }
          if (col.ids.length > 1) { var t = col.ids.reduce(function (a, b) { return a + (snap.vals[mode][keyOf([b])][k] || 0); }, 0); if (Math.abs(t - x) > TOL) errors.push('Cột ' + col.label + ' ≠ Σ tòa ở ' + d.label); return; }
          if (d.src) { var src = ((snap.src[mode] || {})[col.ids[0]] || {})[k] || [], e = src.reduce(function (a, z) { return a + (z.amount || 0); }, 0); if (Math.abs(e - x) > TOL) errors.push('Nguồn không khớp: ' + d.label + ' · ' + col.label + ' (nguồn ' + e + ' / báo cáo ' + x + ')'); }
        });
      });
    });
    return errors;
  }
  function verify(snap) {
    if (BASE_TYPES.indexOf(snap.type) === -1) return verifyGeneric(snap);
    var errors = [], eff = snap.formulas || stdFormulas(snap.type);
    Object.keys(snap.vals).forEach(function (mode) {
      Object.keys(snap.vals[mode]).forEach(function (ck) {
        var vv = snap.vals[mode][ck], col = snap.cols[ck];
        Object.keys(vv).forEach(function (k) { if (k.indexOf('r:') !== 0 && !(typeof vv[k] === 'number' && isFinite(vv[k]))) errors.push('Giá trị không hữu hạn: ' + k + ' · ' + col.label + ' (' + mode + ')'); });
        Object.keys(eff).forEach(function (k) { if (eff[k].kind !== 'sum') return; var s = sumParts(eff[k].parts, vv); if (Math.abs(s - vv[k]) > TOL) errors.push('Tổng không đối chiếu được: ' + k + ' · ' + col.label + ' lệch ' + (vv[k] - s)); });
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

  /* ---------- Minh chứng: gom bản ghi nguồn theo nhóm để rà soát ----------
   * Mỗi nhóm: số bản ghi, số chỉ tiêu dùng, kiểm tra tự động (error chặn tích rà soát; warn chỉ nhắc). */
  function evidence(items) {
    var groups = {}, order = [];
    items.forEach(function (it, ii) {
      var mode = it.vals.tong ? 'tong' : Object.keys(it.vals)[0];
      Object.keys(it.src[mode] || {}).forEach(function (b) {
        Object.keys(it.src[mode][b]).forEach(function (k) {
          it.src[mode][b][k].forEach(function (x) {
            var gid = EVIDENCE[x.kind] ? EVIDENCE[x.kind] : 'Bản ghi khác', g = groups[gid];
            if (!g) { g = groups[gid] = { id: 'ev' + order.length, label: gid, recs: {}, metrics: {}, item: ii }; order.push(gid); }
            var rk = x.kind + ':' + (x.id || x.text);
            if (!g.recs[rk]) g.recs[rk] = { x: x, metrics: [], b: b, item: ii };
            if (g.recs[rk].metrics.indexOf(k) === -1) g.recs[rk].metrics.push(k);
            g.metrics[k] = 1;
          });
        });
      });
    });
    return order.map(function (gid) {
      var g = groups[gid], recs = Object.keys(g.recs).map(function (k) { return g.recs[k]; }), checks = [];
      var open = recs.filter(function (r) { return ['pending', 'draft'].indexOf(r.x.status) > -1; });
      if (open.length) checks.push({ level: 'warn', text: open.length + ' bản ghi chưa xác nhận/duyệt: ' + open.slice(0, 4).map(function (r) { return r.x.id; }).join(', ') + (open.length > 4 ? '…' : '') });
      var est = recs.filter(function (r) { return r.x.kind === 'estimate'; });
      if (est.length) checks.push({ level: 'warn', text: est.length + ' khoản ước tính, chưa có chứng từ — kiểm tra căn cứ ước tính' });
      var dup = recs.filter(function (r) { return r.x.dupOf; });
      if (dup.length) checks.push({ level: 'warn', text: dup.length + ' chứng từ nghi trùng đã loại khỏi tổng: ' + dup.map(function (r) { return r.x.id + ' (trùng ' + r.x.dupOf + ')'; }).join(', ') });
      var seen = {}, dupIn = [];
      recs.forEach(function (r) { if (r.x.kind !== 'expense' || !r.x.docNo || !r.x.amount || r.x.dupOf) return; var key = (r.x.buildingId || r.b) + '|' + r.x.docNo + '|' + r.x.amount; if (seen[key]) dupIn.push(r.x.id + ' = ' + seen[key]); else seen[key] = r.x.id; });
      if (dupIn.length) checks.push({ level: 'error', text: 'Chứng từ trùng số và số tiền đang cộng hai lần: ' + dupIn.join(', ') + ' — xử lý ở chi phí rồi tính lại preview' });
      var miss = recs.filter(function (r) { return (r.x.lines || []).some(function (l) { return l.missingBasis; }); });
      if (miss.length) checks.push({ level: 'warn', text: miss.length + ' hóa đơn thiếu căn cứ lịch sử của dòng tính tiền' });
      if (!checks.length) checks.push({ level: 'ok', text: 'Đối chiếu tự động đạt: nguồn khớp chỉ tiêu, không có bản ghi chờ duyệt' });
      return { id: g.id, label: g.label, n: recs.length, metrics: Object.keys(g.metrics), recs: recs, checks: checks, blocked: checks.some(function (c) { return c.level === 'error'; }) };
    });
  }
  function reviewState(d) {
    var ev = evidence(d.items), rv = d.review || {}, sn = d.seen || {}, ed = Object.keys(d.request.formulas || {});
    var groups = ev.map(function (g) { return Object.assign({}, g, { seen: !!sn[g.id], done: !!rv[g.id] && !g.blocked, by: rv[g.id] ? rv[g.id].by : null, at: rv[g.id] ? rv[g.id].at : null }); });
    if (ed.length) groups.push({ id: 'formula', label: 'Công thức đã sửa', n: ed.length, metrics: ed, recs: [], checks: ed.map(function (k) { var f = d.request.formulas[k]; return { level: f.reason ? 'warn' : 'error', text: labelOf(k, 'tong', d.items[0]) + (f.reason ? ' — lý do: ' + f.reason : ' — thiếu lý do sửa') }; }), blocked: ed.some(function (k) { return !d.request.formulas[k].reason; }), seen: !!sn.formula, done: !!rv.formula, by: rv.formula ? rv.formula.by : null, at: rv.formula ? rv.formula.at : null });
    return { groups: groups, pending: groups.filter(function (g) { return !g.done; }) };
  }

  /* ---------- API ---------- */
  function validate(req) {
    if (!req || !TYPES[req.type]) return 'Chọn loại báo cáo.';
    if (req.previousRunId && !TH.has('F045.D')) return 'Tạo phiên bản báo cáo có từ gói D.';
    if (req.type === 'RPT-05' && req.tpl && req.tpl !== 'MAU-BCKD' && !TH.has('F046.D')) return 'Chọn phiên bản mẫu báo cáo có từ gói D.';
    if (!canType(req.type)) return lockReason(req.type) ? lockReason(req.type) + ' — không tạo được ' + TYPES[req.type].label + '.' : 'Vai trò hiện tại không được tạo ' + req.type + ' (403).';
    if (req.editOf) { var src = runOf(req.editOf); if (!src || src.deletedAt) return 'Bản báo cáo cần sửa không còn hoặc đã xóa.'; }
    if (hasEdits(req.formulas)) { try { formulaOrder(effFormulas(req.type, req.formulas)); } catch (e) { return e.message; } }
    if (TH.PERIODS.indexOf(req.period) === -1) return 'Kỳ báo cáo không hợp lệ.';
    if (!req.buildingIds || !req.buildingIds.length) return 'Chọn ít nhất một tòa.';
    var allow = allowedIds(), bad = req.buildingIds.filter(function (b) { return allow.indexOf(b) === -1 || !C.building(b); });
    if (bad.length) return 'Tòa ngoài quyền truy cập: ' + bad.join(', ') + ' (403).';
    return null;
  }
  function buildDraftItems(req) {
    var ids = ordered(req.buildingIds), t = TYPES[req.type], eff = effFormulas(req.type, req.formulas);
    var items = req.type === 'RPT-04' ? ids.map(function (b) { return buildItem('RPT-04', req.period, [b]); }) : req.type === 'RPT-05' ? [buildItem('RPT-05', req.period, ids, req.tpl)] : [t.build(req.period, ids)];
    items.forEach(function (it) {
      it.formulas = eff; it.group = t.group;
      if (!it.sheets.some(function (s) { return s.kind === 'calc'; })) it.sheets.push({ id: 'calc', name: 'CONG THUC', title: 'Công thức, quy tắc lọc và căn cứ tính', kind: 'calc' });
      if (BASE_TYPES.indexOf(req.type) === -1 || hasEdits(req.formulas)) applyFormulas(it, eff);
    });
    return items;
  }
  function assess(req, items) {
    var errors = [], t = TYPES[req.type];
    items.forEach(function (it) { verify(it).forEach(function (e) { errors.push((it.type === 'RPT-04' ? it.labels[it.buildingIds[0]].short + ': ' : '') + e); }); });
    var w = businessWarnings(req.type, req.period, req.buildingIds, items);
    if (t.warn) w = w.filter(function (x) { return t.warn.indexOf(x.code) > -1; });
    if (hasEdits(req.formulas)) w.push({ code: 'FORMULA', text: Object.keys(req.formulas).length + ' công thức khác công thức chuẩn: ' + Object.keys(req.formulas).map(function (k) { return labelOf(k, 'tong', items[0]); }).join(', ') + '. Bản lưu và Excel ghi rõ công thức đã sửa.' });
    return { errors: errors, warnings: w, fp: fingerprint(req, items) };
  }
  function draftOf(id) { return (TH.db.reportDrafts || []).find(function (d) { return d.id === id; }) || null; }
  function runOf(id) { return (TH.db.reportRuns || []).find(function (r) { return r.id === id; }) || null; }
  function groupKey(type, p, ids) { return type + '|' + p + '|' + ids.slice().sort().join('+'); }

  TH.reports = {
    TYPES: TYPES, GROUPS: GROUPS, BASE_TYPES: BASE_TYPES, DEF: DEF, RATIO: RATIO, ENGINE: ENGINE,
    canType: canType, canSee: canSee, keyOf: keyOf, lockReason: lockReason,
    draft: draftOf, run: runOf, evidence: evidence, reviewState: reviewState, stdFormulas: stdFormulas, effFormulas: effFormulas, applyFormulas: applyFormulas,
    /* Đăng ký loại báo cáo bổ sung: { label, group, tier, tpl, desc, per:'set', modes, mdefs, formulas, filters, warn, perm, build(period, ids) } */
    register: function (id, def) { TYPES[id] = def; },
    preview: function (request, opts) {
      opts = opts || {};
      var req = { type: request.type, period: request.period, buildingIds: ordered(request.buildingIds || []), tpl: request.tpl || 'MAU-BCKD', previousRunId: request.previousRunId || null, editOf: request.editOf || null, formulas: deep(request.formulas) || {} };
      var err = validate(req);
      if (err) return { ok: false, error: err };
      var items = buildDraftItems(req), a = assess(req, items);
      var d = { id: 'NHAP-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), request: req, items: items, errors: a.errors, warnings: a.warnings, fp: a.fp, ack: false, review: {}, seen: {}, runIds: null, stale: false, diff: null, createdBy: TH.me().id, createdAt: now() };
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
      /* Số thay đổi → xem và rà soát lại từ đầu; không đổi thì giữ phần đã rà soát */
      Object.assign(d, { items: items, errors: a.errors, warnings: a.warnings, fp: a.fp, ack: false, stale: false, diff: diff, recalcAt: now(), review: diff.length ? {} : (d.review || {}), seen: diff.length ? {} : (d.seen || {}) });
      TH.store.persist();
      return d;
    },
    /* Sửa công thức của bản xem trước: parts|num/den null = khôi phục công thức chuẩn */
    setFormula: function (id, k, f) {
      var d = draftOf(id); if (!d || d.runIds) return { ok: false, error: 'Không tìm thấy bản xem trước.' };
      if (!canEditFormula()) return { ok: false, error: 'Chỉ kế toán/quản trị được sửa công thức (403).' };
      var std = stdFormulas(d.request.type)[k]; if (!std) return { ok: false, error: 'Chỉ tiêu không có công thức.' };
      var next = deep(d.request.formulas) || {};
      if (!f) delete next[k];
      else {
        var parts = std.kind === 'ratio' ? (f.num || []).concat(f.den || []) : f.parts || [];
        if (!parts.length || (std.kind === 'ratio' && (!(f.num || []).length || !(f.den || []).length))) return { ok: false, error: 'Công thức cần ít nhất một thành phần' + (std.kind === 'ratio' ? ' ở tử số và mẫu số.' : '.') };
        if (parts.some(function (p) { return !isFinite(p[1]); })) return { ok: false, error: 'Hệ số phải là số.' };
        var same = JSON.stringify(std.kind === 'ratio' ? [f.num, f.den] : f.parts) === JSON.stringify(std.kind === 'ratio' ? [std.num, std.den] : std.parts);
        if (same) delete next[k];
        else {
          if (!(f.reason || '').trim()) return { ok: false, error: 'Ghi lý do sửa công thức.' };
          next[k] = std.kind === 'ratio' ? { num: f.num, den: f.den } : { parts: f.parts };
          Object.assign(next[k], { reason: f.reason.trim(), by: TH.me().id, at: now() });
        }
      }
      try { formulaOrder(effFormulas(d.request.type, next)); } catch (e) { return { ok: false, error: e.message + ' — chọn thành phần khác.' }; }
      d.request.formulas = next;
      var r = TH.reports.recalc(id);
      if (r) { r.review = {}; TH.store.persist(); }
      TH.log('Sửa công thức báo cáo (xem trước)', d.id, labelOf(k, 'tong', d.items[0]) + (f ? ' · ' + f.reason : ' · khôi phục chuẩn'), 'report');
      return { ok: true, draft: r };
    },
    /* Ghi nhận đã mở xem bản ghi của nhóm minh chứng — điều kiện để tích “Đã rà soát” */
    markSeen: function (id, gid) {
      var d = draftOf(id); if (!d || d.runIds) return false;
      d.seen = d.seen || {};
      if (!d.seen[gid]) { d.seen[gid] = { by: TH.me().id, at: now() }; TH.store.persist(); }
      return true;
    },
    setReview: function (id, gid, on) {
      var d = draftOf(id); if (!d || d.runIds) return { ok: false, error: 'Không tìm thấy bản xem trước.' };
      var g = reviewState(d).groups.find(function (x) { return x.id === gid; }); if (!g) return { ok: false, error: 'Không có nhóm minh chứng này.' };
      if (g.blocked) return { ok: false, error: 'Nhóm còn lỗi kiểm tra tự động — xử lý nguồn rồi tính lại preview.' };
      if (on && !g.seen) return { ok: false, error: 'Mở xem minh chứng của nhóm trước khi tích đã rà soát.' };
      d.review = d.review || {};
      if (on) d.review[gid] = { by: TH.me().id, at: now() }; else delete d.review[gid];
      TH.store.persist();
      return { ok: true };
    },
    remove: function (runId, reason) {
      var r = runOf(runId); if (!r || !canSee(r)) return { ok: false, error: 'Bản báo cáo không tồn tại hoặc ngoài quyền.' };
      if (!TH.can('report.all')) return { ok: false, error: 'Chỉ kế toán/quản trị được xóa bản báo cáo (403).' };
      if (r.deletedAt) return { ok: false, error: 'Bản này đã xóa.' };
      if (!(reason || '').trim()) return { ok: false, error: 'Ghi lý do xóa.' };
      Object.assign(r, { deletedAt: now(), deletedBy: TH.me().id, deleteReason: reason.trim() });
      TH.store.persist();
      TH.log('Xóa bản báo cáo', r.id, reason.trim(), 'report');
      return { ok: true };
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
      var rs = reviewState(d);
      if (rs.pending.length) return { ok: false, reason: 'review', error: 'Còn ' + rs.pending.length + ' nhóm minh chứng chưa rà soát: ' + rs.pending.map(function (g) { return g.label; }).join(', ') + '.' };
      var runs = TH.db.reportRuns = TH.db.reportRuns || [], at = now(), me = TH.me().id, ids = [];
      var review = { by: me, at: at, groups: rs.groups.map(function (g) { return { id: g.id, label: g.label, n: g.n, checks: g.checks.map(function (c) { return { level: c.level, text: c.text }; }), by: g.by, at: g.at, seenAt: ((d.seen || {})[g.id] || {}).at || null }; }) };
      /* Sửa ở gói A–C: cập nhật vào cùng bản ghi, giữ nhật ký sửa. Gói D đi đường phiên bản mới (previousRunId). */
      var target = d.request.editOf && !d.request.previousRunId ? runOf(d.request.editOf) : null;
      if (target && d.items.length === 1) {
        var it0 = d.items[0];
        target.edits = (target.edits || []).concat([{ at: at, by: me, draftId: d.id, formulas: Object.keys(d.request.formulas || {}).length, note: 'Sửa từ xem trước ' + d.id }]);
        Object.assign(target, { snapshot: deep(it0), warnings: deep(d.warnings), acknowledged: d.warnings.length > 0, fp: d.fp, template: it0.template, engine: it0.engine, schema: TH.DATA_SCHEMA, formulas: deep(d.request.formulas) || {}, review: review, updatedAt: at, updatedBy: me, group: TYPES[target.type].group });
        d.runIds = [target.id];
        var res0 = TH.store.flushChecked();
        target.storage = res0.durable ? 'local' : 'session';
        TH.log('Sửa bản báo cáo', target.id, TYPES[target.type].label + ' · kỳ ' + F.period(target.period), 'report');
        return { ok: true, runIds: [target.id], durable: res0.durable, edited: true };
      }
      d.items.forEach(function (it) {
        var gk = groupKey(it.type, it.period, it.buildingIds), same = runs.filter(function (r) { return r.groupKey === gk; });
        var ver = same.reduce(function (m, r) { return Math.max(m, r.version); }, 0) + 1, prev = same.sort(function (a, b) { return b.version - a.version; })[0];
        var rid = 'BC' + it.type.slice(4) + '-' + it.period.replace('-', '') + '-' + it.buildingIds.map(function (b) { return TH.bTag(b); }).join('.') + '-v' + ver;
        runs.push({ id: rid, type: it.type, period: it.period, buildingIds: it.buildingIds.slice(), groupKey: gk, version: ver, prevId: prev ? prev.id : null, fromRunId: d.request.previousRunId || null,
          createdBy: me, createdAt: at, template: it.template, engine: it.engine || ENGINE, schema: TH.DATA_SCHEMA, fp: d.fp, warnings: deep(d.warnings), acknowledged: d.warnings.length > 0, snapshot: deep(it), storage: 'pending',
          group: TYPES[it.type].group, formulas: deep(d.request.formulas) || {}, review: review, edits: [] });
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
      var md = mdefOf(snap, m) || {}, eff = snap.formulas || stdFormulas(snap.type), f = eff[m];
      var out = { snap: snap, mode: mode, col: ctx.col, colLabel: col.label, ids: col.ids, metric: m, label: labelOf(m, mode, snap), value: vv[m], count: md.unit === 'count', unit: md.unit || 'money', modeLabel: snap.modeLabels ? snap.modeLabels[mode] : null };
      if (f && f.kind === 'ratio') {
        var r = TH.PNL_RATIOS.find(function (x) { return 'r:' + x.k === m; });
        var pp = function (parts) { return (parts || []).map(function (pt) { return { metric: pt[0], w: pt[1], label: labelOf(pt[0], mode, snap), value: vv[pt[0]] }; }); };
        out.kind = 'ratio'; out.times = r ? !!r.times : md.unit === 'num'; out.numParts = pp(f.num); out.denParts = pp(f.den);
        out.numValue = sumParts(f.num, vv); out.denValue = sumParts(f.den, vv); out.na = !out.denValue || vv[m] === null;
        out.formula = formulaText(f, snap, mode, true); out.edited = !!f.edited; out.reason = f.reason; out.stdText = f.edited ? formulaText(f.std, snap, mode, true) : null;
        return out;
      }
      if (f) {
        out.kind = 'derived'; out.formula = formulaText(f, snap, mode); out.edited = !!f.edited; out.reason = f.reason; out.stdText = f.edited ? formulaText(f.std, snap, mode) : null;
        out.parts = f.parts.map(function (pt) { return { metric: pt[0], sign: pt[1] < 0 ? -1 : 1, w: pt[1], label: labelOf(pt[0], mode, snap), value: vv[pt[0]] }; });
        out.check = Math.round(out.parts.reduce(function (a, x) { return a + x.w * (x.value || 0); }, 0)); return out;
      }
      out.kind = 'leaf'; out.filter = (snap.filters && snap.filters[m]) || FILTER[m] || 'Bản ghi nguồn đã xác nhận / đã duyệt của kỳ thuộc dòng này.';
      if (col.ids.length > 1) { out.contrib = col.ids.map(function (b) { return { b: b, label: snap.labels[b].short, col: keyOf([b]), value: snap.vals[mode][keyOf([b])][m] }; }); out.check = out.contrib.reduce(function (a, x) { return a + x.value; }, 0); return out; }
      var b = col.ids[0], meta = snap.meta[mode][ctx.col];
      out.sources = ((snap.src[mode][b] || {})[m] || []).slice();
      if (mode === 'kd' && (m === 'depIn' || m === 'depRefund' || m === 'equip')) { out.excluded = out.sources; out.sources = []; out.excludedNote = 'Chế độ Kinh doanh loại ' + F.money(meta.hidden[m] || 0) + ' khỏi P&L (R-01/R-03) — các bản ghi dưới đây chỉ vào dòng tiền/tài sản.'; }
      if (m === 'cRent' && mode === 'kd' && meta.accrued) out.sources = out.sources.concat([{ kind: 'lease', id: meta.accrualLease, room: null, amount: meta.accrued, text: 'Tiền thuê nhà DỰ KIẾN theo HĐ thuê tòa — phiếu chi chưa duyệt (R-07, đề xuất)', buildingId: b }]);
      out.check = out.count && BASE_TYPES.indexOf(snap.type) > -1 ? out.sources.length : out.sources.reduce(function (a, x) { return a + (x.amount || 0); }, 0);
      out.notes = (snap.notes[ctx.col] || {})[m] || [];
      return out;
    },
    /* Bộ sheet Excel dựng từ snapshot (dùng chung cho tải Excel) */
    xlsxSheets: function (snap, run) { return toXlsx(snap, run); },
    export: function (runId) {
      var r = runOf(runId); if (!r || !canSee(r)) return null;
      var scope = r.type === 'RPT-04' ? r.buildingIds[0] : (r.buildingIds.length === TH.db.buildings.length ? 'ALL' : r.buildingIds.map(function (b) { return TH.bTag(b); }).join('-'));
      var fname = 'TIMEHOUSE_' + r.type + '_' + scope + '_ky_' + r.period + '_v' + r.version;
      var sheets = toXlsx(r.snapshot, r);
      TH._lastExport = { filename: fname + '.xlsx', sheets: sheets, runId: r.id };
      TH.exportXlsx(fname, sheets);
      return TH._lastExport;
    },
  };
  function labelOf(k, mode, snap) {
    if (snap && snap.mdefs && snap.mdefs[k]) return snap.mdefs[k].label;
    if (k && k.indexOf('r:') === 0) { var r = TH.PNL_RATIOS.find(function (x) { return 'r:' + x.k === k; }); if (r) return r.label; }
    var l = TH.PNL_LINES.find(function (x) { return x.k === k; }); return l ? (mode === 'kd' && l.labelKd ? l.labelKd : l.label) : EXTRA_LABEL[k] || k;
  }
  function mdefOf(snap, k) {
    if (snap.mdefs && snap.mdefs[k]) return snap.mdefs[k];
    var l = TH.PNL_LINES.find(function (x) { return x.k === k; });
    return l ? { label: l.label, unit: l.count ? 'count' : 'money', leaf: !DEF[k] } : null;
  }
  function shareTrace(snap, m) {
    var p = m.split(':'), sh = snap.share, f = p[2], row = p[1] === 'T' ? null : sh.rows[+p[1]];
    var base = sh.base, ratio = row ? row.ratio : sh.ratio, val = row ? row[f] : sh[f];
    var fm = { capital: ['Vốn = tỷ lệ × tiền thuê nhà kỳ', base.cRent], lng: ['LN gộp = tỷ lệ × LNG', base.lng], lnr: ['LN ròng = tỷ lệ × LNR', base.lnr], total: ['Tổng nhận = Vốn + LN ròng', null], ratio: ['Tỷ lệ hiệu lực kỳ (SHARE-01)', null] }[f];
    return { snap: snap, kind: 'share', label: (row ? row.holder : 'Tổng') + ' · ' + { capital: 'Vốn', lng: 'LN gộp', lnr: 'LN ròng', total: 'Tổng nhận', ratio: 'Tỷ lệ' }[f], value: val, formula: fm[0], ratio: ratio, base: fm[1], row: row, restricted: !TH.can('share.view') && !TH.can('report.all') };
  }

  /* ---------- Excel từ snapshot ---------- */
  function toXlsx(snap, run) {
    var stamp = run ? 'Bản ' + run.id + ' · v' + run.version + ' · tạo ' + run.createdAt + ' bởi ' + C.staffName(run.createdBy) + (run.updatedAt ? ' · sửa ' + run.updatedAt + ' bởi ' + C.staffName(run.updatedBy) : '') + ' · ' + run.template + ' · ' + run.engine : 'Xem trước — chưa xác nhận';
    var xval = function (k, x) { var u = (mdefOf(snap, k) || {}).unit; return isRatio(snap, k) ? (x === null || x === undefined ? null : u === 'money' ? Math.round(x) : Math.round(x * 10000) / 10000) : x; };
    var xtype = function (k) { var u = (mdefOf(snap, k) || {}).unit; return isRatio(snap, k) ? (u === 'num' ? 'number' : u === 'money' ? 'money' : 'pct') : u === 'count' || u === 'num' ? 'number' : 'money'; };
    var sheets = snap.sheets.map(function (sh) {
      if (sh.kind === 'grid') {
        return { name: sh.name, title: sh.title, note: stamp + (sh.note ? ' · ' + sh.note : ''), columns: [{ label: sh.rowLabel || 'TÒA', width: 18 }].concat(sh.metrics.map(function (k) { return { label: labelOf(k, sh.mode, snap), type: xtype(k), width: 18 }; })),
          rows: sh.rows.map(function (ck) { var row = [snap.cols[ck].label].concat(sh.metrics.map(function (k) { return xval(k, snap.vals[sh.mode][ck][k]); })); return snap.cols[ck].ids.length > 1 ? { c: row, bold: true } : row; }) };
      }
      if (sh.kind === 'list') {
        var L = (snap.lists || {})[sh.list] || { columns: [], rows: [] };
        return { name: sh.name, title: sh.title, note: stamp + (sh.note ? ' · ' + sh.note : ''), columns: L.columns.map(function (c) { return { label: c.label, type: c.type === 'text' ? undefined : c.type, width: c.width || 16 }; }), rows: L.rows, totals: L.totals || null };
      }
      if (sh.kind === 'src' && BASE_TYPES.indexOf(snap.type) === -1) {
        var rs = [];
        snap.buildingIds.forEach(function (b) { var src = snap.src[sh.mode][b] || {}; srcMetrics(snap).forEach(function (k) { (src[k] || []).forEach(function (x) { rs.push([labelOf(k, sh.mode, snap), snap.labels[b].short, (KIND[x.kind] || [x.kind])[0], x.id || '', x.room || '', (x.text || '') + (x.dupOf ? ' · NGHI TRÙNG ' + x.dupOf + ', không cộng' : ''), x.amount !== undefined ? x.amount : null]); }); }); });
        return { name: sh.name, title: sh.title, note: stamp + ' · nguồn tại thời điểm tạo báo cáo', columns: [{ label: 'Dòng báo cáo', width: 30 }, { label: 'Tòa', width: 12 }, { label: 'Loại', width: 14 }, { label: 'Chứng từ', width: 22 }, { label: 'Phòng', width: 10 }, { label: 'Diễn giải / căn cứ', width: 60 }, { label: 'Đóng góp', type: 'number' }], rows: rs };
      }
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
      calcRows(snap).forEach(function (r) { rows3.push(r.f.edited ? { c: [r.label, r.text, 'ĐÃ SỬA · chuẩn: ' + formulaText(r.f.std, snap, 'tong') + ' · lý do: ' + (r.f.reason || '') + (r.f.by ? ' · ' + C.staffName(r.f.by) + ' ' + (r.f.at || '') : '')], bold: true } : [r.label, r.text, isRatio(snap, r.k) ? 'Mẫu số 0 → không áp dụng' : 'Chuẩn']); });
      var filters = snap.filters || FILTER;
      Object.keys(filters).forEach(function (k) { if (!(snap.formulas || {})[k]) rows3.push([labelOf(k, 'tong', snap), 'Chỉ tiêu nguồn', filters[k]]); });
      if (BASE_TYPES.indexOf(snap.type) > -1) rows3.push(['Quy tắc tính tiền tại lúc tạo', Object.keys(TH.BILL_RULE_LABELS).map(function (k) { return TH.BILL_RULE_LABELS[k].label + ': ' + (TH.BILL_RULE_LABELS[k].options[snap.rules[k]] || snap.rules[k]); }).join(' · '), (snap.rules.status === 'proposed' ? 'ĐỀ XUẤT — chờ khách duyệt (D-03)' : '')]);
      if (run && run.warnings.length) run.warnings.forEach(function (w) { rows3.push(['Cảnh báo đã đọc khi tạo', w.code, w.text]); });
      return { name: sh.name, title: sh.title, note: stamp, columns: [{ label: 'Chỉ tiêu', width: 30 }, { label: 'Công thức', width: 70 }, { label: 'Quy tắc lọc / ghi chú', width: 80 }], rows: rows3 };
    });
    /* Sheet rà soát minh chứng (bản lưu) */
    if (run && run.review) sheets.push({ name: 'RA SOAT MINH CHUNG', title: 'Rà soát minh chứng trước khi tạo · ' + run.id, note: 'Rà soát bởi ' + C.staffName(run.review.by) + ' · ' + run.review.at,
      columns: [{ label: 'Nhóm minh chứng', width: 32 }, { label: 'Số bản ghi', type: 'number' }, { label: 'Kiểm tra tự động', width: 80 }, { label: 'Người rà soát', width: 22 }, { label: 'Lúc', width: 18 }],
      rows: run.review.groups.map(function (g) { return [g.label, g.n, g.checks.map(function (c) { return c.text; }).join(' · '), g.by ? C.staffName(g.by) : '', g.at || '']; }) });
    return sheets;
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
    r = Object.assign({ type: types[0] || 'RPT-04', period: TH.store.state.period, buildingIds: TH.scope() !== 'ALL' ? [TH.scope()] : allow.slice(), tpl: 'MAU-BCKD', previousRunId: null, editOf: null, formulas: {} }, r || {});
    if (types.indexOf(r.type) === -1) r.type = types[0];
    r.buildingIds = (r.buildingIds || []).filter(function (b) { return allow.indexOf(b) > -1; });
    if (!TH.has('F046.D')) { r.tpl = 'MAU-BCKD'; }
    if (!TH.has('F045.D')) r.previousRunId = null;
    return r;
  }
  function setReq(patch) { TH.store.setUi(S, 'req', Object.assign(req(), patch)); }
  TH.reportPrefill = function (type, ctx) {
    ctx = ctx || {};
    TH.store.setUi(S, 'req', { type: type, period: ctx.period || TH.store.state.period, buildingIds: ctx.buildingIds || (TH.scope() !== 'ALL' ? [TH.scope()] : allowedIds()), tpl: ctx.tpl || 'MAU-BCKD', previousRunId: ctx.previousRunId || null, editOf: ctx.editOf || null, formulas: ctx.formulas || {} });
  };
  function typeBadge(t) { return TH.badge(t, t === 'RPT-04' ? 'teal' : BASE_TYPES.indexOf(t) > -1 ? 'info' : 'neutral'); }
  function groupLabel(g) { var x = GROUPS.find(function (y) { return y.id === g; }); return x ? x.label : ''; }
  function scopeLabel(ids) { return ids.length === TH.db.buildings.length ? 'Toàn hệ thống (' + ids.length + ' tòa)' : ids.map(function (b) { var x = C.building(b); return x ? x.short : b; }).join(', '); }
  function forbidden(text) { return TH.pageHeader({ screen: S }) + '<div class="card">' + TH.state('forbidden', { text: text }) + '</div>'; }
  function editCount(r) { return Object.keys(r.formulas || {}).length; }

  /* Bước của luồng tạo (màn tạo = bước 1–2, xem trước = bước 3) */
  var STEPS = ['Chọn loại', 'Kỳ & tòa', 'Xem trước & rà soát', 'Tạo bản lưu'];
  function stepper(cur) {
    return '<ol class="rptf-steps" aria-label="Các bước tạo báo cáo">' + STEPS.map(function (s, i) {
      var n = i + 1;
      return '<li class="' + (n < cur ? 'is-done' : n === cur ? 'is-cur' : '') + '"' + (n === cur ? ' aria-current="step"' : '') + '><span class="rptf-step-n">' + (n < cur ? I('check', 'ic-sm') : n) + '</span><span>' + esc(s) + '</span></li>';
    }).join('') + '</ol>';
  }
  function metaChips(list) { return '<span class="rptf-meta">' + list.filter(Boolean).map(function (x) { return '<span class="rptf-chip">' + I(x[0], 'ic-sm') + esc(x[1]) + '</span>'; }).join('') + '</span>'; }
  function statusBadges(r) {
    var n = editCount(r);
    return (r.deletedAt ? TH.badge('Đã xóa', 'neutral', { icon: 'trash' }) : '') +
      (r.invalidatedAt ? TH.badge('Hết hiệu lực', 'warning', { tip: r.invalidationReason || 'Đã có bản thay thế' }) : '') +
      (n ? TH.badge('Đã sửa ' + n + ' công thức', 'warning', { tip: Object.keys(r.formulas).map(function (k) { return labelOf(k, 'tong', r.snapshot) + ': ' + r.formulas[k].reason; }).join(' · ') }) : TH.badge('Công thức chuẩn', 'success')) +
      (r.review ? TH.badge('Đã rà soát', 'success', { icon: 'shieldCheck', tip: C.staffName(r.review.by) + ' · ' + r.review.at + ' · ' + r.review.groups.length + ' nhóm' }) : TH.badge('Bản cũ · chưa rà soát', 'neutral'));
  }

  /* Thẻ loại báo cáo: 'list' = tile gọn để tạo nhanh; 'pick' = thẻ đầy đủ trong form tạo */
  function typeCard(t, mode, cur) {
    var d = TYPES[t], ok = canType(t), why = lockReason(t), n = (TH.db.reportRuns || []).filter(function (r) { return r.type === t && !r.deletedAt && !r.invalidatedAt && canSee(r); }).length;
    var head = '<div class="rptf-type-hd">' + TH.tierPill(d.tier || 'A', { tip: 'Có từ gói ' + (d.tier || 'A') }) + '<b>' + esc(d.label) + '</b>' + (ok ? '' : I('lock', 'ic-sm')) + '</div>';
    var locked = (!TH.has(d.tier || 'A') ? '<button type="button" class="btn btn-xs" data-act="pkg.try" data-pkg="' + d.tier + '">' + I('eye', 'ic-sm') + 'Xem thử gói ' + d.tier + '</button>' : '') + '<span class="small muted">' + esc(why) + '</span>';
    if (mode === 'list') return '<article class="rptf-type is-compact' + (ok ? '' : ' is-locked') + '">' + head + '<p class="small muted rptf-clamp" title="' + esc((d.desc || '') + ' · Mẫu ' + d.tpl) + '">' + esc(d.desc || '') + '</p>' +
      '<div class="rptf-type-ft">' + (ok ? '<button type="button" class="btn btn-xs btn-primary" data-act="rptf.newType" data-type="' + t + '">' + I('plus', 'ic-sm') + 'Tạo</button><span class="small muted">' + n + ' bản đang dùng</span>' : locked) + '</div></article>';
    var foot = !ok ? locked : '<button type="button" class="btn btn-xs' + (cur ? ' btn-primary' : '') + '" data-act="rptf.pickType" data-type="' + t + '" aria-pressed="' + !!cur + '">' + (cur ? I('check', 'ic-sm') + 'Đang chọn' : 'Chọn loại này') + '</button>';
    return '<article class="rptf-type' + (ok ? '' : ' is-locked') + (cur ? ' is-current' : '') + '">' + head + '<p class="small muted">' + esc(d.desc || '') + '</p><div class="small rptf-type-tpl">' + I('sheet', 'ic-sm') + esc(d.tpl) + '</div><div class="rptf-type-ft">' + foot + '</div></article>';
  }

  /* Bộ lọc nhanh theo trạng thái bản ghi (dải thống kê trên danh sách) */
  var STAT = {
    live: { label: 'Đang dùng', icon: 'sheet', test: function (r) { return !r.deletedAt && !r.invalidatedAt; } },
    invalidated: { label: 'Hết hiệu lực', icon: 'history', tone: 'warning', test: function (r) { return !r.deletedAt && !!r.invalidatedAt; } },
    edited: { label: 'Đã sửa công thức', icon: 'calculator', tone: 'warning', test: function (r) { return !r.deletedAt && editCount(r) > 0; } },
    legacy: { label: 'Bản cũ chưa rà soát', icon: 'alertCircle', test: function (r) { return !r.deletedAt && !r.review; } },
    deleted: { label: 'Đã xóa', icon: 'trash', test: function (r) { return !!r.deletedAt; } },
  };
  function listView() {
    var grp = TH.store.ui(S, 'grp', 'all'), st = TH.store.ui(S, 'st', 'live');
    if (!STAT[st]) st = 'live';
    var q = TH.store.ui(S, 'q', ''), ft = TH.store.ui(S, 'ft', 'all'), fb = TH.store.ui(S, 'fb', 'all'), fp = TH.store.ui(S, 'fp', 'all'), fu = TH.store.ui(S, 'fu', 'all');
    var inGrp = function (t) { return grp === 'all' || (TYPES[t] && TYPES[t].group === grp); };
    var visible = (TH.db.reportRuns || []).filter(canSee);
    var groupRuns = visible.filter(function (r) { return inGrp(r.type); });
    var all = groupRuns.filter(STAT[st].test);
    if (ft !== 'all' && !inGrp(ft)) ft = 'all';
    var rows = all.filter(function (r) {
      return (ft === 'all' || r.type === ft) && (fb === 'all' || r.buildingIds.indexOf(fb) > -1) && (fp === 'all' || r.period === fp) && (fu === 'all' || r.createdBy === fu) &&
        TH.match(q, [r.id, r.type, TYPES[r.type].label, scopeLabel(r.buildingIds), C.staffName(r.createdBy), F.period(r.period)]);
    }).sort(function (a, b) { var x = a.updatedAt || a.createdAt, y = b.updatedAt || b.createdAt; return x < y ? 1 : x > y ? -1 : (b.version - a.version) || (a.id < b.id ? 1 : -1); });
    var typesIn = Object.keys(TYPES).filter(inGrp), creatable = Object.keys(TYPES).filter(canType);
    var cnt = function (g) { return visible.filter(function (r) { return !r.deletedAt && (g === 'all' || TYPES[r.type].group === g); }).length; };
    var tabs = TH.tabs(S, [{ id: 'all', label: 'Tất cả', icon: 'layers', count: cnt('all') }].concat(GROUPS.map(function (g) { return { id: g.id, label: g.label, icon: g.icon, count: cnt(g.id) }; })), grp, 'grp');
    var stats = '<div class="rptf-stats u-mb-12" role="group" aria-label="Lọc nhanh bản báo cáo">' + Object.keys(STAT).map(function (k) {
      var s = STAT[k];
      return '<button type="button" class="rptf-stat' + (s.tone ? ' is-' + s.tone : '') + '" aria-pressed="' + (st === k) + '" data-act="ui.set" data-screen="' + S + '" data-key="st" data-val="' + k + '" data-reset-page="1">' + I(s.icon, 'ic-sm') + '<b class="tnum">' + groupRuns.filter(s.test).length + '</b><span>' + esc(s.label) + '</span></button>';
    }).join('') + '</div>';
    var creators = all.map(function (r) { return r.createdBy; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var filters = '<div class="toolbar rptf-toolbar">' + TH.searchBox(S, 'Tìm mã báo cáo, tòa, người tạo…') +
      TH.uiSelect(S, 'ft', [{ id: 'all', label: 'Mọi loại' }].concat(typesIn.map(function (t) { return { id: t, label: TYPES[t].label }; })), ft, 'Lọc loại', 'sel-inline') +
      TH.uiSelect(S, 'fb', [{ id: 'all', label: 'Mọi tòa' }].concat(allowedIds().map(function (b) { return { id: b, label: C.building(b).name }; })), fb, 'Lọc tòa', 'sel-inline') +
      TH.uiSelect(S, 'fp', [{ id: 'all', label: 'Mọi kỳ' }].concat(TH.PERIODS.slice().reverse().map(function (p) { return { id: p, label: 'Kỳ ' + F.period(p) }; })), fp, 'Lọc kỳ', 'sel-inline') +
      TH.uiSelect(S, 'fu', [{ id: 'all', label: 'Mọi người tạo' }].concat(creators.map(function (u) { return { id: u, label: C.staffName(u) }; })), fu, 'Lọc người tạo', 'sel-inline') + '</div>';
    var canDel = TH.can('report.all');
    var table = TH.table({
      label: 'Danh sách báo cáo đã tạo',
      cols: [
        { key: 't', label: 'Báo cáo', wrap: true, render: function (r) { return '<a class="cell-main" href="' + href('view/' + r.id) + '">' + esc(TYPES[r.type].label) + '</a><div class="cell-sub"><span class="mono">' + esc(r.id) + '</span> · ' + esc(groupLabel(TYPES[r.type].group)) + '</div>' + (r.storage === 'session' ? '<div class="cell-sub warn-text">chỉ lưu trong phiên</div>' : ''); } },
        { kind: 'date', key: 'p', label: 'Kỳ', render: function (r) { return F.period(r.period); } },
        { key: 'b', label: 'Phạm vi tòa', wrap: true, render: function (r) { return esc(scopeLabel(r.buildingIds)); } },
        { key: 's', label: 'Trạng thái', wrap: true, render: function (r) { return '<div class="rptf-badges">' + statusBadges(r) + '</div>' + (r.deletedAt ? '<div class="cell-sub">' + esc(C.staffName(r.deletedBy)) + ': ' + esc(r.deleteReason) + '</div>' : ''); } },
        { key: 'u', label: 'Cập nhật', render: function (r) { return esc(C.staffName(r.updatedBy || r.createdBy)) + '<div class="cell-sub">' + esc(r.updatedAt || r.createdAt) + ' · v' + r.version + ((r.edits || []).length ? ' · sửa ' + r.edits.length + ' lần' : '') + '</div>'; } },
        { key: 'a', label: '', maxActions: 2, render: function (r) {
          var b = '<a class="btn btn-xs" href="' + href('view/' + r.id) + '">' + I('eye', 'ic-sm') + 'Xem</a><button type="button" class="btn btn-xs" data-act="rptf.xlsx" data-id="' + r.id + '" aria-label="Tải Excel ' + r.id + '">' + I('download', 'ic-sm') + 'Tải Excel</button>';
          if (r.deletedAt) return '<div class="row u-gap-6 u-nowrap">' + b + '</div>';
          return '<div class="row u-gap-6 u-nowrap">' + b + '<button type="button" class="btn btn-xs" data-act="rptf.edit" data-id="' + r.id + '" aria-label="Sửa ' + r.id + '">' + I('edit', 'ic-sm') + 'Sửa</button>' +
            (canDel ? '<button type="button" class="btn btn-xs btn-ghost" data-act="rptf.delete" data-id="' + r.id + '" aria-label="Xóa ' + r.id + '">' + I('trash', 'ic-sm') + 'Xóa</button>' : '') + '</div>';
        } },
      ],
      rows: rows,
      empty: { title: st === 'deleted' ? 'Không có bản báo cáo đã xóa' : all.length ? 'Không có báo cáo phù hợp bộ lọc' : 'Chưa có báo cáo nào ở mục này', text: st === 'deleted' ? 'Bản đã xóa vẫn xem và tải được để đối chiếu.' : 'Bấm Tạo ở một loại báo cáo phía trên → chọn kỳ, tòa → Xem trước → rà soát minh chứng → Xác nhận tạo.' },
    });
    var storeNote = TH.store.storageOk ? '' : '<div class="alert alert-warning u-mb-16">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Trình duyệt chặn lưu cục bộ</b><span>Báo cáo tạo trong phiên này chỉ giữ tới khi tải lại trang.</span></div></div>';
    return TH.pageHeader({ screen: S, title: 'Báo cáo', status: '<span class="badge badge-info">' + esc(TH.CR_RPT3 ? TH.CR_RPT3.id : TH.CR_RPT2.id) + '</span>',
      desc: 'Báo cáo đúng mẫu Excel của khách, gom theo nhóm. Tạo mới qua 4 bước: chọn loại → kỳ, tòa → <b>xem trước và rà soát minh chứng</b> → tạo bản lưu.',
      actions: creatable.length ? '<button type="button" class="btn btn-primary" data-act="rptf.new">' + I('plus', 'ic-sm') + 'Tạo báo cáo</button>' : '' }) + storeNote +
      tabs + TH.tabPanel(S, grp,
        '<div class="section-title u-mb-8">Tạo nhanh theo loại</div><div class="rptf-types is-compact u-mb-16">' + typesIn.map(function (t) { return typeCard(t, 'list'); }).join('') + '</div>' + stats +
        '<div class="card card-flush">' + TH.cardHd(I(STAT[st].icon, 'ic-sm') + (st === 'live' ? 'Bản báo cáo đã tạo' : 'Bản báo cáo · ' + STAT[st].label.toLowerCase()), rows.length + '/' + all.length + ' bản · mới cập nhật trước') + filters + table + '</div>', 'grp');
  }

  function newView(opts) {
    opts = opts || {};
    var r = req(), types = Object.keys(TYPES).filter(canType), allow = allowedIds();
    if (!types.length) return forbidden('Vai trò hiện tại không được tạo báo cáo.');
    var err = TH.store.ui(S, 'err', ''), d = TYPES[r.type];
    var ng = TH.store.ui(S, 'ngrp', d.group);
    var grpSeg = '<div class="seg" role="group" aria-label="Nhóm báo cáo">' + GROUPS.map(function (g) { return '<button type="button" aria-pressed="' + (ng === g.id) + '" data-act="ui.set" data-screen="' + S + '" data-key="ngrp" data-val="' + g.id + '">' + esc(g.label) + '</button>'; }).join('') + '</div>';
    var typePick = '<div class="field span-2"><span class="small strong">1. Loại báo cáo trong nhóm</span><div class="rptf-types u-mt-8">' + Object.keys(TYPES).filter(function (t) { return TYPES[t].group === ng; }).map(function (t) { return typeCard(t, 'pick', t === r.type); }).join('') + '</div></div>';
    var perSel = '<div class="field"><label for="rptf-period">2. Tháng</label><select id="rptf-period" class="select" data-act-change="rptf.period">' + TH.PERIODS.slice().reverse().map(function (p) { return '<option value="' + p + '"' + (p === r.period ? ' selected' : '') + '>Kỳ ' + F.period(p) + (TH.periodLocked(p) ? ' · đã khóa' : p === TH.CURRENT_PERIOD ? ' · đang mở' : '') + '</option>'; }).join('') + '</select></div>';
    /* Tòa dạng chip, gom theo nhóm nhà */
    var allOn = allow.length && allow.every(function (b) { return r.buildingIds.indexOf(b) > -1; }), dis = r.editOf ? ' disabled' : '', byG = [];
    allow.forEach(function (b) { var g = groupOf(b), k = g ? g.short : 'Khác', x = byG.find(function (y) { return y.k === k; }); if (!x) byG.push(x = { k: k, ids: [] }); x.ids.push(b); });
    var bList = '<fieldset class="field span-2 rptf-bset"><legend class="small strong u-mb-8">3. Tòa (trong quyền truy cập) · đã chọn ' + r.buildingIds.length + '/' + allow.length + '</legend>' +
      '<label class="rptf-bchip is-all"><input type="checkbox" data-act-change="rptf.all"' + (allOn ? ' checked' : '') + dis + '><span>Chọn tất cả</span></label>' +
      byG.map(function (g) { return '<div class="rptf-bgrp"><span class="small muted">' + esc(g.k) + '</span>' + g.ids.map(function (b) { return '<label class="rptf-bchip"><input type="checkbox" data-act-change="rptf.b" data-b="' + b + '"' + (r.buildingIds.indexOf(b) > -1 ? ' checked' : '') + dis + '><span>' + esc(C.building(b).name) + '</span></label>'; }).join('') + '</div>'; }).join('') + '</fieldset>';
    var tplSel = r.type === 'RPT-05' ? TH.gate('F046.D', '<div class="field"><label for="rptf-tpl">Mẫu báo cáo ' + TH.up('F046.D') + '</label><select id="rptf-tpl" class="select" data-act-change="rptf.tpl">' + TH.db.reportTemplates.filter(function (t) { return t.report === 'RPT-05'; }).map(function (t) { return '<option value="' + t.id + '"' + (t.id === r.tpl ? ' selected' : '') + '>' + esc(t.name) + ' · v' + t.version + (t.status === 'draft' ? ' (nháp)' : '') + '</option>'; }).join('') + '</select></div>', { mode: 'mini', label: 'Mẫu báo cáo có phiên bản' }) : '';
    var n = r.type === 'RPT-04' ? r.buildingIds.length : (r.buildingIds.length ? 1 : 0);
    var explain = r.type === 'RPT-04' ? 'Mỗi tòa chọn có một bản xem trước; xác nhận một lần tạo <b>' + r.buildingIds.length + '</b> bản lưu riêng.' : r.type === 'RPT-05' ? 'Một bản tổng hợp các tòa đã chọn: sheet Kinh doanh, Tổng và từng nhóm nhà có tòa được chọn (chỉ gộp các tòa đã chọn).' : 'Một bản cho các tòa đã chọn: cột từng tòa và cột Tổng, bố cục theo mẫu ' + esc(d.tpl) + '.';
    var src = r.editOf ? runOf(r.editOf) : null, prev = r.previousRunId ? runOf(r.previousRunId) : null, pl = TH.periodLocked(r.period);
    var banner = src ? '<div class="alert alert-info u-mb-16">' + I('edit', 'ic-sm') + '<div class="alert-body"><b>Sửa bản ' + esc(src.id) + '</b><span>Loại, kỳ, tòa giữ theo bản gốc; số tính lại từ nguồn hiện tại với công thức đã lưu (' + (editCount(src) ? editCount(src) + ' công thức đã sửa' : 'công thức chuẩn') + '). ' + (TH.has('F045.D') ? 'Gói D: xác nhận tạo phiên bản mới, bản cũ giữ nguyên.' : 'Xác nhận sẽ cập nhật vào bản này và ghi nhật ký sửa.') + '</span></div></div>'
      : prev ? '<div class="alert alert-info u-mb-16">' + I('history', 'ic-sm') + '<div class="alert-body"><b>Tạo phiên bản mới từ ' + esc(prev.id) + '</b><span>Số tính lại từ nguồn hiện tại; bản cũ giữ nguyên.</span></div></div>' : '';
    var summary = '<div class="card rptf-sum">' + TH.cardHd(I('sheet', 'ic-sm') + 'Bản sẽ tạo', 'Xem trước chưa tạo bản lưu') + '<div class="card-bd">' +
      TH.kv([['Loại', '<b>' + esc(d.label) + '</b> <span class="small muted mono">' + r.type + '</span>'], ['Mẫu', esc(d.tpl)], ['Kỳ', 'Kỳ ' + F.period(r.period) + ' ' + (pl ? TH.badge('Đã khóa', 'neutral', { icon: 'lock' }) : r.period === TH.CURRENT_PERIOD ? TH.badge('Đang mở', 'info') : '')],
        ['Tòa', r.buildingIds.length ? esc(scopeLabel(r.buildingIds)) : '<span class="neg">Chưa chọn tòa</span>'], ['Số bản', '<b>' + n + '</b>' + (r.type === 'RPT-04' && n > 1 ? ' · mỗi tòa một bản' : '')]]) +
      '<p class="small muted rptf-explain">' + explain + (pl ? ' Kỳ đã khóa: vẫn tạo được báo cáo, sửa nguồn vẫn theo khóa kỳ.' : '') + '</p>' +
      '<div class="rptf-next small"><b>Sau khi bấm Xem trước</b><ol><li>Bấm số bất kỳ để xem công thức và chứng từ nguồn.</li><li>Mở từng nhóm minh chứng, kiểm tra rồi tích <b>Đã rà soát</b>.</li><li>Đọc cảnh báo, rồi xác nhận tạo bản lưu.</li></ol></div></div>' +
      '<div class="card-ft"><button type="button" class="btn" data-act="rptf.leave">Hủy</button><span class="spacer"></span><button type="button" class="btn btn-primary" data-act="rptf.preview"' + (n && canType(r.type) ? '' : ' disabled') + '>' + I('eye', 'ic-sm') + 'Xem trước' + (r.type === 'RPT-04' && n > 1 ? ' ' + n + ' báo cáo' : '') + '</button></div></div>';
    return (opts.noHeader ? '' : TH.pageHeader({ screen: S, title: src ? 'Sửa báo cáo ' + src.id : 'Tạo báo cáo', crumbs: [['Báo cáo', TH.router.href(S)], [src ? 'Sửa' : 'Tạo mới']], desc: 'Chọn loại báo cáo, tháng và tòa rồi bấm <b>Xem trước</b>. Xem trước chưa tạo bản lưu.' })) +
      stepper(2) + banner + (err ? '<div class="alert alert-danger u-mb-16">' + I('xCircle', 'ic-sm') + '<div class="alert-body">' + esc(err) + '</div></div>' : '') +
      '<div class="grid-main-side rptf-new"><div class="card"><div class="card-bd">' + (src ? '' : '<div class="u-mb-12">' + grpSeg + '</div>') + '<div class="form-grid">' + (src ? '<div class="field span-2"><span class="small strong">Loại báo cáo</span><div class="u-mt-8">' + typeBadge(r.type) + ' ' + esc(d.label) + '</div></div>' : typePick) + perSel + tplSel + bList + '</div></div></div>' +
      '<div class="rptf-side">' + summary + '</div></div>';
  }

  /* Bảng sheet (preview / bản lưu) — mỗi ô số là nút mở “Nguồn và cách tính” */
  var CELL = null; /* ngữ cảnh tô ô khi dựng sheet: công thức, nhóm đang rà soát, ô đang truy nguồn, ô đổi sau tính lại */
  function cellBtn(where, id, item, mode, col, metric, html, aria) {
    if (!TH.has('F045.B')) return html;
    var cls = 'rptf-cell';
    if (CELL) {
      var f = CELL.eff[metric], c = CELL.snap.cols[col];
      if (f || metric.indexOf('r:') === 0) cls += f && f.edited ? ' is-edited' : ' is-calc';
      if (CELL.hl[metric]) cls += ' is-hl';
      if (CELL.sel && CELL.sel.metric === metric && CELL.sel.col === col && (CELL.sel.mode || 'tong') === (mode || 'tong')) cls += ' is-sel';
      if (c && CELL.changed[mode + '|' + c.label + '|' + metric]) cls += ' is-changed';
    }
    return '<button type="button" class="' + cls + '" data-act="rptf.trace" data-where="' + where + '" data-id="' + esc(id) + '" data-item="' + item + '" data-mode="' + mode + '" data-col="' + esc(col) + '" data-m="' + esc(metric) + '" aria-label="Nguồn và cách tính: ' + esc(aria) + '">' + html + '</button>';
  }
  function fmtVal(l, x) {
    if (l.t === 'r') return x === null || x === undefined ? '<span class="muted" title="Mẫu số 0">Không áp dụng</span>' : '<span class="tnum' + (x < 0 ? ' neg' : '') + '">' + (l.times ? x.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' lần' : F.pct(x, 1)) + '</span>';
    if (l.count) return '<span class="tnum">' + x + '</span>';
    if (!x) return '<span class="tnum muted">0</span>';
    return '<span class="tnum' + (x < 0 ? ' neg' : '') + '">' + F.money(x).replace(/\s₫$/, '') + '</span>';
  }
  function isRatio(snap, k) { var f = (snap.formulas || {})[k]; return !!(f && f.kind === 'ratio') || k.indexOf('r:') === 0; }
  function fmtUnit(snap, k, x) {
    var u = (mdefOf(snap, k) || {}).unit || 'money';
    if (isRatio(snap, k)) return x === null || x === undefined ? '<span class="muted" title="Mẫu số 0">Không áp dụng</span>' : '<span class="tnum' + (x < 0 ? ' neg' : '') + '">' + (u === 'money' ? F.money(Math.round(x)).replace(/\s₫$/, '') : u === 'num' ? x.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : F.pct(x, 1)) + '</span>';
    if (u === 'count' || u === 'num') return '<span class="tnum">' + (x || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '</span>';
    if (!x) return '<span class="tnum muted">0</span>';
    return '<span class="tnum' + (x < 0 ? ' neg' : '') + '">' + F.money(x).replace(/\s₫$/, '') + '</span>';
  }
  function srcMetrics(snap) { return snap.mdefs ? Object.keys(snap.mdefs).filter(function (k) { return snap.mdefs[k].src; }) : TH.PNL_LINES.filter(function (l) { return l.k && !DEF[l.k]; }).map(function (l) { return l.k; }); }
  function calcRows(snap) {
    var eff = snap.formulas || stdFormulas(snap.type), rows = [];
    Object.keys(eff).forEach(function (k) { var f = eff[k]; rows.push({ k: k, label: labelOf(k, 'tong', snap), text: formulaText(f, snap, 'tong'), f: f }); });
    return rows;
  }
  function sheetHtml(where, id, item, snap, sh, nz) {
    if (sh.kind === 'grid') {
      var gh = '<th scope="col" class="rpt-label">' + esc(sh.rowLabel || 'Tòa') + '</th>' + sh.metrics.map(function (k) { return '<th scope="col" class="num">' + esc(labelOf(k, sh.mode, snap)) + '</th>'; }).join('');
      var gb = sh.rows.map(function (ck) { var c = snap.cols[ck], tot = c.ids.length > 1; return '<tr class="' + (tot ? 'rpt-strong' : '') + '"><th scope="row" class="rpt-label">' + esc(c.label) + (c.note ? '<div class="cell-sub warn-text">' + esc(c.note) + '</div>' : '') + '</th>' + sh.metrics.map(function (k) { return '<td class="num' + (tot ? ' rpt-total-col' : '') + '">' + cellBtn(where, id, item, sh.mode, ck, k, fmtUnit(snap, k, snap.vals[sh.mode][ck][k]), labelOf(k, sh.mode, snap) + ' · ' + c.label) + '</td>'; }).join('') + '</tr>'; }).join('');
      return '<div class="table-wrap"><table class="table table-compact rpt-table rpt-matrix" aria-label="' + esc(sh.title) + '"><thead><tr>' + gh + '</tr></thead><tbody>' + gb + '</tbody></table></div>' + (sh.note ? '<p class="small muted rptf-sheet-note">' + esc(sh.note) + '</p>' : '');
    }
    if (sh.kind === 'list') {
      var L = (snap.lists || {})[sh.list] || { columns: [], rows: [] };
      var cell = function (c, v) { if (v === null || v === undefined || v === '') return '<span class="muted">—</span>'; if (c.type === 'money') return '<span class="tnum' + (v < 0 ? ' neg' : '') + '">' + F.money(v).replace(/\s₫$/, '') + '</span>'; if (c.type === 'pct') return F.pct(v, 1); if (c.type === 'number') return '<span class="tnum">' + v.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '</span>'; return esc(String(v)); };
      if (!L.rows.length) return TH.state('empty', { title: sh.empty || 'Không có dòng nào trong kỳ' });
      return '<div class="table-wrap"><table class="table table-compact rpt-table" aria-label="' + esc(sh.title) + '"><thead><tr>' + L.columns.map(function (c) { return '<th scope="col"' + (c.type && c.type !== 'text' ? ' class="num"' : '') + '>' + esc(c.label) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        L.rows.map(function (r) { return '<tr>' + L.columns.map(function (c, i) { return '<td' + (c.type && c.type !== 'text' ? ' class="num"' : '') + '>' + cell(c, r[i]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>' +
        (L.totals ? '<tfoot><tr>' + L.columns.map(function (c, i) { return '<td' + (c.type && c.type !== 'text' ? ' class="num"' : '') + '><b>' + cell(c, L.totals[i]) + '</b></td>'; }).join('') + '</tr></tfoot>' : '') + '</table></div>' + (sh.note ? '<p class="small muted rptf-sheet-note">' + esc(sh.note) + '</p>' : '');
    }
    if (sh.kind === 'stmt') {
      var head = '<th scope="col" class="rpt-label">Chỉ tiêu</th>' + sh.cols.map(function (c) { return '<th scope="col" class="num' + (c.label.indexOf('TỔNG') === 0 ? ' rpt-total-col' : '') + '">' + esc(c.label) + '</th>'; }).join('') + (sh.notesCol ? '<th scope="col">Ghi chú</th>' : '');
      var n = sh.cols.length + 1 + (sh.notesCol ? 1 : 0), body = '';
      sh.lines.forEach(function (l) {
        if (l.t === 'sec') { body += '<tr class="rpt-sec"><th colspan="' + n + '" scope="rowgroup">' + esc(l.label) + '</th></tr>'; return; }
        if (l.t === 'grp') { body += '<tr class="rpt-grp"><td colspan="' + n + '">' + esc(l.label) + '</td></tr>'; return; }
        if (nz && sh.cols.every(function (c) { return !snap.vals[sh.mode][c.key][l.metric]; })) return;
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
      snap.buildingIds.forEach(function (b) { var src = snap.src[sh.mode][b] || {}; srcMetrics(snap).forEach(function (k) { var md = mdefOf(snap, k) || {}; (src[k] || []).forEach(function (x) { rows.push({ l: { label: labelOf(k, sh.mode, snap), count: md.unit === 'count' && BASE_TYPES.indexOf(snap.type) > -1, unit: md.unit }, b: b, x: x }); }); }); });
      return TH.table({ compact: true, label: 'Nguồn số liệu', cols: [
        { key: 'l', label: 'Dòng báo cáo', render: function (r) { return esc(r.l.label); } },
        { key: 'b', label: 'Tòa', render: function (r) { return esc(snap.labels[r.b].short); } },
        { key: 'k', label: 'Loại', render: function (r) { var m = KIND[r.x.kind] || [r.x.kind, 'neutral']; return TH.badge(m[0], m[1]); } },
        { key: 'id', label: 'Chứng từ', render: function (r) { return '<span class="mono small">' + esc(r.x.id || '') + '</span>'; } },
        { key: 't', label: 'Diễn giải / căn cứ', wrap: true, render: function (r) { return '<span class="small">' + esc(r.x.kind === 'payroll' && !canPayroll() ? 'Chi tiết lương bị hạn chế theo quyền' : srcText(r.x)) + '</span>'; } },
        { kind: 'money', key: 'a', label: 'Đóng góp', num: true, render: function (r) { return r.l.count ? '<span class="muted">1 phòng</span>' : r.l.unit === 'count' || r.l.unit === 'num' ? '<span class="tnum">' + (r.x.amount || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '</span>' : F.money(r.x.amount || 0); } },
      ], rows: rows, empty: { title: 'Không có nguồn' } });
    }
    /* Sheet công thức: công thức chuẩn / đang dùng, lý do sửa; bản xem trước cho kế toán/quản trị sửa thành phần × hệ số */
    var canEdit = where === 'draft' && canEditFormula() && !!draftOf(id);
    var fr = calcRows(snap);
    var filters = snap.filters || FILTER;
    var leaves = Object.keys(filters).filter(function (k) { return !(snap.formulas || {})[k]; });
    return TH.table({ compact: true, label: 'Công thức đang dùng', cols: [
        { key: 'a', label: 'Chỉ tiêu', render: function (r) { return '<b>' + esc(r.label) + '</b>'; } },
        { key: 'b', label: 'Công thức đang dùng', wrap: true, render: function (r) { return '<span class="small">' + esc(r.text) + '</span>' + (r.f.edited ? '<div class="cell-sub">Chuẩn: ' + esc(formulaText(r.f.std, snap, 'tong')) + '</div>' : ''); } },
        { key: 'c', label: 'Trạng thái', wrap: true, render: function (r) { return r.f.edited ? TH.badge('Đã sửa', 'warning') + '<div class="cell-sub">' + esc(r.f.reason || 'Thiếu lý do') + (r.f.by ? ' · ' + esc(C.staffName(r.f.by)) + ' · ' + esc(r.f.at || '') : '') + '</div>' : '<span class="small muted">Chuẩn</span>'; } },
        { key: 'd', label: '', render: function (r) { return canEdit ? '<button type="button" class="btn btn-xs" data-act="rptf.formula" data-id="' + esc(id) + '" data-k="' + esc(r.k) + '">' + I('edit', 'ic-sm') + 'Sửa công thức</button>' : ''; } },
      ], rows: fr }) +
      (leaves.length ? '<div class="card-bd small"><b>Quy tắc lọc chỉ tiêu nguồn</b><ul class="rpt-alert-list">' + leaves.map(function (k) { return '<li><b>' + esc(labelOf(k, 'tong', snap)) + ':</b> ' + esc(filters[k]) + '</li>'; }).join('') + '</ul></div>' : '') +
      '<div class="card-bd small">' + (BASE_TYPES.indexOf(snap.type) > -1 ? '<b>Quy tắc tính tiền tại lúc tạo:</b> ' + Object.keys(TH.BILL_RULE_LABELS).map(function (k) { return esc(TH.BILL_RULE_LABELS[k].label) + ': ' + esc(TH.BILL_RULE_LABELS[k].options[snap.rules[k]] || snap.rules[k]); }).join(' · ') + (snap.rules.status === 'proposed' ? ' ' + TH.openBadge('D-03', 'ĐỀ XUẤT') : '') + '<br>' : '') + '<span class="muted">Mẫu ' + esc(snap.template) + ' · ' + esc(snap.engine) + ' · schema ' + snap.schema + (canEdit ? '' : where === 'draft' ? ' · chỉ kế toán/quản trị được sửa công thức' : '') + '</span></div>';
  }
  /* Chú thích màu ô số */
  function legend(opt) {
    if (!TH.has('F045.B')) return '';
    return '<div class="rptf-legend" aria-label="Chú thích ô số"><span><i class="rptf-sw"></i>Số nguồn · bấm xem chứng từ</span><span><i class="rptf-sw is-calc"></i>Tính theo công thức</span><span><i class="rptf-sw is-edited"></i>Công thức đã sửa</span>' +
      ((opt.hl || []).length ? '<span><i class="rptf-sw is-hl"></i>Thuộc nhóm “' + esc(opt.hlLabel || '') + '”</span>' : '') + ((opt.diff || []).length ? '<span><i class="rptf-sw is-changed"></i>Đổi sau tính lại</span>' : '') + '</div>';
  }
  function sheetsBlock(where, id, item, snap, key, opt) {
    opt = opt || {};
    var cur = TH.store.ui(S, key, snap.sheets[0].id);
    if (!snap.sheets.some(function (s) { return s.id === cur; })) cur = snap.sheets[0].id;
    var sh = snap.sheets.find(function (s) { return s.id === cur; }), num = sh.kind === 'stmt' || sh.kind === 'grid', nz = !!TH.store.ui(S, 'nz', '');
    var tabs = TH.tabs(S, snap.sheets.map(function (s) { return { id: s.id, label: s.name, icon: s.kind === 'stmt' || s.kind === 'grid' ? 'sheet' : s.kind === 'share' ? 'pie' : s.kind === 'src' || s.kind === 'list' ? 'list' : 'calculator' }; }), cur, key);
    var modeTxt = snap.modeLabels ? snap.modeLabels[sh.mode] : sh.mode === 'kd' ? 'chế độ Kinh doanh' : 'chế độ Tổng theo mẫu';
    var top = traceStack[traceStack.length - 1], hl = {}, changed = {};
    (opt.hl || []).forEach(function (k) { hl[k] = 1; });
    (opt.diff || []).forEach(function (x) { if ((x.item || 0) === item) changed[x.mode + '|' + x.col + '|' + x.metric] = 1; });
    CELL = { snap: snap, eff: snap.formulas || stdFormulas(snap.type), hl: hl, changed: changed, sel: top && top.id === id && (top.item || 0) === item && TH.store.ui(S, opt.paneKey || 'pane', '') === 'trace' ? top : null };
    var html;
    try { html = sheetHtml(where, id, item, snap, sh, nz); } finally { CELL = null; }
    var tools = num ? '<div class="rptf-sheet-tools">' + legend(opt) + '<span class="spacer"></span>' + (sh.kind === 'stmt' ? TH.switchCtl(S, 'nz', 'Ẩn dòng bằng 0', nz) : '') + '</div>' : '';
    return '<div class="card card-flush u-mb-16">' + TH.cardHd(I('sheet', 'ic-sm') + esc(sh.title), (num ? 'Bấm số để xem nguồn và cách tính' + (sh.mode ? ' · ' + esc(modeTxt) : '') : 'Sheet ' + esc(sh.name)) + ' · ' + snap.sheets.length + ' sheet sẽ xuất') +
      '<div class="rptf-sheet-tabs">' + tabs + '</div>' + tools + TH.tabPanel(S, cur, '<div data-document>' + html + '</div>', key) + '</div>';
  }
  function itemPicker(d, cur) {
    if (d.items.length < 2) return '';
    return '<div class="rptf-items" role="group" aria-label="Chọn tòa xem trước">' + d.items.map(function (it, i) { return '<button type="button" class="filter-chip" aria-pressed="' + (i === cur) + '" data-act="ui.set" data-screen="' + S + '" data-key="item" data-val="' + i + '">' + esc(it.labels[it.buildingIds[0]].name) + '</button>'; }).join('') + '</div>';
  }
  function warnBlock(list, title, tone) {
    if (!list.length) return '';
    return '<div class="alert alert-' + tone + ' u-mb-12">' + I(tone === 'danger' ? 'xCircle' : 'alert', 'ic-sm') + '<div class="alert-body"><b>' + esc(title) + '</b><ul class="rpt-alert-list">' + list.map(function (w) { return '<li>' + esc(typeof w === 'string' ? w : w.text) + (w.href ? ' <a href="' + w.href + '" data-act="rptf.go" data-href="' + w.href + '">Mở nguồn</a>' : '') + '</li>'; }).join('') + '</ul></div></div>';
  }
  function diffVal(v) { return v === null || v === undefined ? '—' : Number.isInteger(v) ? F.money(v) : F.pct(v, 1); }
  var LVL = { ok: ['checkCircle', 'success'], warn: ['alert', 'warning'], error: ['xCircle', 'danger'] };
  function checkList(checks) { return '<ul class="rptf-checklist">' + checks.map(function (c) { var m = LVL[c.level] || LVL.warn; return '<li class="is-' + c.level + '">' + I(m[0], 'ic-sm') + '<span>' + esc(c.text) + '</span></li>'; }).join('') + '</ul>'; }
  function paneBtn(pane, label, key) { return '<button type="button" class="btn btn-xs" data-act="ui.set" data-screen="' + S + '" data-key="' + (key || 'pane') + '" data-val="' + pane + '">' + esc(label) + '</button>'; }

  /* Năm điều kiện tạo bản lưu — dùng cho checklist trong panel và thanh xác nhận */
  function conditions(d, stale, rs) {
    var ed = Object.keys(d.request.formulas || {}), edOk = ed.every(function (k) { return d.request.formulas[k].reason; }), done = rs.groups.length - rs.pending.length;
    return [
      { id: 'err', ok: !d.errors.length, label: d.errors.length ? d.errors.length + ' lỗi số liệu — xem khung đỏ phía trên' : 'Số liệu đối chiếu được (Σ nguồn = chỉ tiêu)', todo: 'sửa ' + d.errors.length + ' lỗi số liệu' },
      { id: 'stale', ok: !stale, label: stale ? 'Dữ liệu nguồn đã đổi sau khi xem trước' : 'Nguồn không đổi từ lúc xem trước', todo: 'tính lại preview' },
      { id: 'ack', ok: !d.warnings.length || !!d.ack, label: d.warnings.length ? d.warnings.length + ' cảnh báo nghiệp vụ' + (d.ack ? ' · đã đọc' : '') : 'Không có cảnh báo nghiệp vụ', todo: 'đọc ' + d.warnings.length + ' cảnh báo', pane: 'warn' },
      { id: 'rv', ok: !rs.pending.length, label: 'Minh chứng đã rà soát ' + done + '/' + rs.groups.length + ' nhóm', todo: 'rà soát ' + rs.pending.length + ' nhóm minh chứng' },
      { id: 'fx', ok: edOk, label: ed.length ? ed.length + ' công thức đã sửa' + (edOk ? ' · có lý do' : ' · thiếu lý do') : 'Dùng công thức chuẩn', todo: 'ghi lý do sửa công thức', pane: 'formula' },
    ];
  }
  function ackBox(d, stale) { return d.warnings.length ? '<label class="check rptf-ack"><input type="checkbox" data-act-change="rptf.ack" data-id="' + d.id + '"' + (d.ack ? ' checked' : '') + (stale ? ' disabled' : '') + '><span>Tôi đã đọc ' + d.warnings.length + ' cảnh báo và vẫn tạo báo cáo</span></label>' : ''; }
  /* Nội dung một nhóm minh chứng khi mở: kiểm tra tự động, bản ghi đầu, ô “Đã rà soát” (chỉ bật sau khi đã xem, nhóm không lỗi) */
  function groupBody(d, g, stale) {
    var recs = g.id === 'formula' ? '' : '<ul class="rptf-recs">' + g.recs.slice(0, 8).map(function (rec) {
      var sn = d.items[rec.item] || d.items[0];
      return srcItemHtml(rec.x, sn, (mdefOf(sn, rec.metrics[0]) || {}).unit || 'money', esc(rec.metrics.map(function (k) { return labelOf(k, 'tong', sn); }).join(', ')) + ' · ' + esc((sn.labels[rec.b] || {}).short || ''));
    }).join('') + '</ul>' + (g.recs.length > 8 ? '<p class="small muted">Còn ' + (g.recs.length - 8) + ' bản ghi — bấm Xem đủ.</p>' : '');
    var tick = '<label class="check"><input type="checkbox" data-act-change="rptf.review" data-id="' + d.id + '" data-g="' + g.id + '"' + (g.done ? ' checked' : '') + (g.blocked || stale || !g.seen ? ' disabled' : '') + '><span>' + (g.blocked ? 'Cần xử lý lỗi rồi tính lại' : 'Đã rà soát nhóm này') + '</span></label>';
    return '<div class="rptf-acc-bd">' + checkList(g.checks) + recs + '<div class="rptf-acc-ft">' +
      (g.id === 'formula' ? paneBtn('formula', 'Mở tab Công thức') : '<button type="button" class="btn btn-xs" data-act="rptf.evidence" data-id="' + d.id + '" data-g="' + g.id + '">' + I('list', 'ic-sm') + 'Xem đủ ' + g.n + ' bản ghi</button>') +
      '<span class="spacer"></span>' + tick + '</div>' + (g.done && g.by ? '<div class="cell-sub">Rà soát: ' + esc(C.staffName(g.by)) + ' · ' + esc(g.at) + '</div>' : '') + '</div>';
  }
  function checkPane(d, stale, rs, conds) {
    var okN = conds.filter(function (c) { return c.ok; }).length, hl = TH.store.ui(S, 'hl', '');
    var extra = { stale: stale ? '<button type="button" class="btn btn-xs" data-act="rptf.recalc" data-id="' + d.id + '">' + I('refresh', 'ic-sm') + 'Tính lại</button>' : '', ack: d.warnings.length ? paneBtn('warn', 'Xem cảnh báo') : '' };
    var cl = '<section class="rptf-pane-sec" aria-label="Điều kiện tạo"><div class="rptf-sec-hd"><b>Điều kiện tạo bản lưu</b><span class="small' + (okN === conds.length ? ' pos' : '') + '">' + okN + '/' + conds.length + '</span></div><progress class="rptf-prog" max="' + conds.length + '" value="' + okN + '" aria-label="Điều kiện đã đạt"></progress>' +
      '<ul class="rptf-conds">' + conds.map(function (c) { return '<li class="' + (c.ok ? 'is-ok' : 'is-todo') + '">' + I(c.ok ? 'checkCircle' : 'alertCircle', 'ic-sm') + '<span>' + esc(c.label) + '</span>' + (extra[c.id] || '') + '</li>'; }).join('') + '</ul>' + ackBox(d, stale) + '</section>';
    var acc = '<section class="rptf-pane-sec" aria-label="Nhóm minh chứng"><div class="rptf-sec-hd"><b>Nhóm minh chứng</b><span class="small muted">mở nhóm → xem bản ghi → tích</span></div><div class="rptf-acc">' + rs.groups.map(function (g) {
      var open = hl === g.id, s = g.blocked ? ['Có lỗi', 'danger'] : g.done ? ['Đã rà soát', 'success'] : g.seen ? ['Đã xem', 'info'] : ['Chưa xem', 'neutral'];
      return '<div class="rptf-acc-it' + (open ? ' is-open' : '') + (g.blocked ? ' is-error' : g.done ? ' is-done' : '') + '"><button type="button" class="rptf-acc-hd" data-act="rptf.group" data-id="' + d.id + '" data-g="' + g.id + '" aria-expanded="' + open + '">' + I(open ? 'chevronDown' : 'chevronRight', 'ic-sm') +
        '<span class="rptf-acc-t"><b>' + esc(g.label) + '</b><span class="small muted">' + (g.id === 'formula' ? g.n + ' công thức' : g.n + ' bản ghi · ' + g.metrics.length + ' chỉ tiêu') + '</span></span>' + TH.badge(s[0], s[1]) + '</button>' + (open ? groupBody(d, g, stale) : '') + '</div>';
    }).join('') + '</div></section>';
    var it = d.items[Math.min(+TH.store.ui(S, 'item', 0) || 0, d.items.length - 1)];
    var diff = d.diff ? '<section class="rptf-pane-sec" aria-label="Kết quả tính lại"><div class="rptf-sec-hd"><b>Tính lại lúc ' + esc(d.recalcAt) + '</b><span class="small muted">' + (d.diff.length ? d.diff.length + ' chỉ tiêu đổi' : 'không đổi') + '</span></div>' +
      (d.diff.length ? '<ul class="rpt-alert-list small">' + d.diff.slice(0, 8).map(function (x) { return '<li>' + esc(labelOf(x.metric, x.mode, it) + ' · ' + x.col + (x.mode === 'kd' && BASE_TYPES.indexOf(d.request.type) > -1 ? ' (KD)' : '')) + ': ' + esc(diffVal(x.before)) + ' → <b>' + esc(diffVal(x.after)) + '</b></li>'; }).join('') + (d.diff.length > 8 ? '<li>… ' + (d.diff.length - 8) + ' chỉ tiêu khác</li>' : '') + '</ul><p class="small muted">Ô thay đổi được viền xanh trên bảng; minh chứng phải xem và rà soát lại.</p>' : '<p class="small muted">Nếu đã sửa hóa đơn ĐÃ XÁC NHẬN thì số không đổi: điều chỉnh đi theo quy trình kỳ sau; quy tắc/điện chung chỉ tính lại hóa đơn nháp.</p>') + '</section>' : '';
    return cl + acc + diff;
  }
  /* Truy nguồn ô ngay trong panel: đường đi drill (breadcrumb), phương trình, chứng từ */
  function tracePane(id) {
    var top = traceStack[traceStack.length - 1];
    if (!top || top.id !== id) return '<section class="rptf-pane-sec">' + TH.state('empty', { title: 'Chưa chọn ô số', text: 'Bấm một số trên bảng bên trái để xem công thức, thành phần và chứng từ nguồn ngay tại đây.' }) + '</section>';
    var r = traceRender(Object.assign({}, top, { inline: true }));
    var crumbs = traceStack.map(function (c, i) { var t = TH.reports.trace(c), lb = t && t.label ? t.label : c.metric; return i === traceStack.length - 1 ? '<b>' + esc(lb) + '</b>' : '<button type="button" class="link-btn" data-act="rptf.tjump" data-i="' + i + '">' + esc(lb) + '</button>'; }).join('<span class="muted" aria-hidden="true"> › </span>');
    return '<section class="rptf-pane-sec rptf-trace-pane" aria-label="Nguồn và cách tính"><nav class="rptf-crumbs small" aria-label="Đường truy nguồn">' + crumbs + '</nav>' + r.body +
      '<div class="rptf-acc-ft">' + (traceStack.length > 1 ? '<button type="button" class="btn btn-xs" data-act="rptf.tback">' + I('chevronLeft', 'ic-sm') + 'Quay lại</button>' : '') + '<span class="spacer"></span><button type="button" class="btn btn-xs btn-ghost" data-act="rptf.tclose">Bỏ chọn ô</button></div></section>';
  }
  function formulaPane(d, snap) {
    var can = !!d && canEditFormula() && !d.runIds, rows = calcRows(snap).sort(function (a, b) { return (b.f.edited ? 1 : 0) - (a.f.edited ? 1 : 0); });
    return '<section class="rptf-pane-sec" aria-label="Công thức"><p class="small muted">' + (d ? (can ? 'Sửa thành phần và hệ số của chỉ tiêu tính; bắt buộc ghi lý do. Bản xem trước tính lại ngay, minh chứng phải rà soát lại.' : 'Chỉ kế toán/quản trị được sửa công thức.') : 'Công thức đã dùng khi tạo bản lưu.') + '</p><ul class="rptf-fx-rows">' +
      rows.map(function (r) { return '<li class="' + (r.f.edited ? 'is-edited' : '') + '"><div class="rptf-fx-hd"><b>' + esc(r.label) + '</b>' + (r.f.edited ? TH.badge('Đã sửa', 'warning') : '') + '<span class="spacer"></span>' + (can ? '<button type="button" class="btn btn-xs" data-act="rptf.formula" data-id="' + d.id + '" data-k="' + esc(r.k) + '">' + I('edit', 'ic-sm') + 'Sửa</button>' : '') + '</div><div class="small">' + esc(r.text) + '</div>' +
        (r.f.edited ? '<div class="cell-sub">Chuẩn: ' + esc(formulaText(r.f.std, snap, 'tong')) + ' · lý do: ' + esc(r.f.reason || '') + (r.f.by ? ' · ' + esc(C.staffName(r.f.by)) : '') + '</div>' : '') + '</li>'; }).join('') + '</ul></section>';
  }
  function warnPane(d, stale) {
    if (!d.warnings.length) return '<section class="rptf-pane-sec">' + TH.state('empty', { title: 'Không có cảnh báo nghiệp vụ' }) + '</section>';
    return '<section class="rptf-pane-sec" aria-label="Cảnh báo nghiệp vụ"><ul class="rptf-warns">' + d.warnings.map(function (w) { return '<li>' + I('alert', 'ic-sm') + '<span>' + esc(w.text) + (w.href ? ' <a href="' + w.href + '" data-act="rptf.go" data-href="' + w.href + '">Mở nguồn</a>' : '') + '</span></li>'; }).join('') + '</ul>' + ackBox(d, stale) + '</section>';
  }
  function paneShell(tabs, cur, key, html) {
    return '<aside class="rptf-pane card card-flush" aria-label="Kiểm tra và truy nguồn"><div class="rptf-pane-tabs">' + TH.tabs(S, tabs, cur, key) + '</div><div class="rptf-pane-bd" aria-live="polite">' + TH.tabPanel(S, cur, html, key) + '</div></aside>';
  }

  function previewView(id) {
    var d = draftOf(id);
    if (!d) return TH.pageHeader({ screen: S, title: 'Xem trước báo cáo', crumbs: [['Báo cáo', TH.router.href(S)], ['Xem trước']] }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy bản xem trước', text: 'Bản xem trước đã hủy hoặc hết hạn. <a href="' + href('new') + '">Tạo lại</a>.' }) + '</div>';
    if (validate(d.request)) return forbidden(validate(d.request));
    if (d.runIds) return TH.pageHeader({ screen: S, title: 'Xem trước đã xác nhận', crumbs: [['Báo cáo', TH.router.href(S)], ['Xem trước']] }) + '<div class="card"><div class="card-bd"><p>Bản xem trước này đã tạo: ' + d.runIds.map(function (r) { return '<a href="' + href('view/' + r) + '">' + esc(r) + '</a>'; }).join(', ') + '. Xác nhận lại không tạo bản trùng.</p></div></div>';
    var stale = d.stale || TH.reports.isStale(d);
    var cur = Math.min(+TH.store.ui(S, 'item', 0) || 0, d.items.length - 1), it = d.items[cur], rq = d.request, T = TYPES[rq.type];
    var rs = reviewState(d), n = d.items.length, conds = conditions(d, stale, rs), missing = conds.filter(function (c) { return !c.ok; }), okN = conds.length - missing.length;
    var editing = rq.editOf ? runOf(rq.editOf) : null, nEd = Object.keys(rq.formulas || {}).length;
    var pane = TH.store.ui(S, 'pane', 'check'); if (['check', 'trace', 'formula', 'warn'].indexOf(pane) < 0) pane = 'check';
    var hg = rs.groups.find(function (g) { return g.id === TH.store.ui(S, 'hl', ''); });
    var head = TH.pageHeader({ screen: S, title: (editing ? 'Sửa ' + editing.id : T.label) + ' · kỳ ' + F.period(rq.period), crumbs: [['Báo cáo', TH.router.href(S)], ['Xem trước']],
      status: TH.badge('Chưa lưu', 'draft', { dot: true }) + (it.locked ? TH.badge('Kỳ đã khóa', 'neutral', { icon: 'lock' }) : ''),
      desc: metaChips([['layers', groupLabel(T.group)], ['sheet', T.tpl], ['building', scopeLabel(rq.buildingIds)], ['clock', 'tính lúc ' + (d.recalcAt || d.createdAt)]]),
      actions: '<button type="button" class="btn" data-act="rptf.back" data-id="' + d.id + '">' + I('chevronLeft', 'ic-sm') + 'Chỉnh lựa chọn</button><button type="button" class="btn" data-act="rptf.recalc" data-id="' + d.id + '">' + I('refresh', 'ic-sm') + 'Tính lại preview</button><button type="button" class="btn btn-ghost" data-act="rptf.cancel" data-id="' + d.id + '">Hủy</button>' });
    var staleBox = stale ? '<div class="alert alert-danger u-mb-12">' + I('refresh', 'ic-sm') + '<div class="alert-body"><b>Dữ liệu nguồn đã thay đổi sau khi xem trước</b><span>Bấm <b>Tính lại preview</b> và xem lại cảnh báo trước khi xác nhận.</span></div></div>' : '';
    var extras = TH.rptExtras && BASE_TYPES.indexOf(rq.type) > -1 ? (rq.type === 'RPT-04' ? TH.rptExtras.rpt4(rq.period, it.buildingIds[0]) : TH.rptExtras.rpt5(rq.period, rq.buildingIds)) : '';
    var verb = editing ? (rq.previousRunId ? 'Xác nhận tạo phiên bản mới' : 'Xác nhận cập nhật ' + editing.id) : 'Xác nhận tạo ' + n + ' báo cáo';
    var paneHtml = pane === 'trace' ? tracePane(d.id) : pane === 'formula' ? formulaPane(d, it) : pane === 'warn' ? warnPane(d, stale) : checkPane(d, stale, rs, conds);
    var side = paneShell([{ id: 'check', label: 'Kiểm tra', count: missing.length || undefined }, { id: 'trace', label: 'Nguồn ô' }, { id: 'formula', label: 'Công thức', count: nEd || undefined }, { id: 'warn', label: 'Cảnh báo', count: d.warnings.length || undefined }], pane, 'pane', paneHtml);
    var main = itemPicker(d, cur) + sheetsBlock('draft', d.id, cur, it, 'sheet', { hl: hg ? hg.metrics : [], hlLabel: hg ? hg.label : '', diff: d.diff || [] }) +
      (extras ? '<details class="card rptf-extras"><summary>' + I('chart', 'ic-sm') + '<b>Phân tích bổ sung theo gói</b><span class="small muted">số liệu hiện tại, không thuộc bản lưu</span></summary><div class="card-bd">' + extras + '</div></details>' : '');
    var foot = '<div class="card rptf-confirm"><div class="card-bd rptf-confirm-row"><progress class="rptf-prog" max="' + conds.length + '" value="' + okN + '" aria-label="Điều kiện tạo đã đạt"></progress><span class="small">' + (missing.length ? '<b class="neg">Chưa tạo được</b> · ' + okN + '/' + conds.length + ' điều kiện. Cần:' : '<b class="pos">Đủ điều kiện tạo</b> · số liệu đối chiếu được, minh chứng đã rà soát.') + '</span>' +
      missing.map(function (c) { return '<button type="button" class="btn btn-xs rptf-todo" data-act="ui.set" data-screen="' + S + '" data-key="pane" data-val="' + (c.pane || 'check') + '">' + I('arrowRight', 'ic-sm') + esc(c.todo) + '</button>'; }).join('') +
      '<span class="spacer"></span><button type="button" class="btn btn-primary" data-act="rptf.confirm" data-id="' + d.id + '"' + (missing.length ? ' disabled' : '') + '>' + I('check', 'ic-sm') + esc(verb) + '</button></div></div>';
    return head + stepper(3) + staleBox + warnBlock(d.errors, 'Lỗi số liệu — chặn tạo báo cáo', 'danger') +
      '<div class="rptf-ws"><div class="rptf-ws-main">' + main + '</div>' + side + '</div>' + foot;
  }
  function runView(id) {
    var r = runOf(id);
    if (!r) return TH.pageHeader({ screen: S, title: 'Bản báo cáo', crumbs: [['Báo cáo', TH.router.href(S)], [id]] }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy bản báo cáo ' + esc(id) }) + '</div>';
    if (!canSee(r)) return forbidden('Bản báo cáo thuộc tòa/loại ngoài quyền hoặc ngoài gói đang xem.');
    var T = TYPES[r.type], group = (TH.db.reportRuns || []).filter(function (x) { return x.groupKey === r.groupKey; }).sort(function (a, b) { return b.version - a.version; });
    var vp = TH.store.ui(S, 'vpane', 'info'); if (['info', 'review', 'hist', 'trace', 'formula'].indexOf(vp) < 0) vp = 'info';
    var meta = TH.kv([['Mã', '<span class="mono">' + esc(r.id) + '</span>'], ['Loại', esc(T.label) + ' <span class="small muted mono">' + r.type + '</span> · ' + esc(groupLabel(T.group))], ['Kỳ', F.period(r.period)], ['Phạm vi', esc(scopeLabel(r.buildingIds))], [TH.has('F045.D') ? 'Phiên bản' : 'Bản lưu', TH.has('F045.D') ? 'v' + r.version + (r.prevId ? ' · bản trước <a href="' + href('view/' + r.prevId) + '">' + esc(r.prevId) + '</a>' : '') + (r.fromRunId && r.fromRunId !== r.prevId ? ' · tạo từ ' + esc(r.fromRunId) : '') : 'Số liệu tại thời điểm tạo' + (r.updatedAt ? ' / sửa gần nhất' : '')],
      ['Người / lúc tạo', esc(C.staffName(r.createdBy)) + ' · ' + esc(r.createdAt)], ['Sửa gần nhất', r.updatedAt ? esc(C.staffName(r.updatedBy)) + ' · ' + esc(r.updatedAt) + ' · ' + r.edits.length + ' lần' : 'Chưa sửa'],
      ['Trạng thái', '<div class="rptf-badges">' + statusBadges(r) + '</div>'],
      ['Mẫu · bộ tính', esc(r.template) + ' · ' + esc(r.engine) + ' · schema ' + r.schema], ['Lưu trữ', r.storage === 'session' ? '<span class="warn-text">Chỉ trong phiên — trình duyệt chặn/đầy bộ nhớ</span>' : 'Trình duyệt (localStorage demo)']]);
    var info = '<section class="rptf-pane-sec">' + meta + '</section><section class="rptf-pane-sec">' + (r.warnings.length ? '<div class="rptf-sec-hd"><b>Cảnh báo đã đọc khi tạo</b><span class="small muted">' + r.warnings.length + '</span></div><ul class="rptf-warns">' + r.warnings.map(function (w) { return '<li>' + I('alert', 'ic-sm') + '<span>' + esc(w.text) + '</span></li>'; }).join('') + '</ul>' : '<p class="small pos">' + I('checkCircle', 'ic-sm') + ' Không có cảnh báo khi tạo.</p>') + '</section>';
    var review = '<section class="rptf-pane-sec">' + (r.review ? '<div class="rptf-sec-hd"><b>Minh chứng đã rà soát khi tạo</b><span class="small muted">' + esc(C.staffName(r.review.by)) + ' · ' + esc(r.review.at) + '</span></div><ul class="rptf-checklist">' + r.review.groups.map(function (g) { return '<li class="is-ok">' + I('checkCircle', 'ic-sm') + '<span><b>' + esc(g.label) + '</b> · ' + g.n + (g.id === 'formula' ? ' công thức' : ' bản ghi') + ' · ' + esc(g.checks.map(function (c) { return c.text; }).join(' · ')) + (g.by ? ' — ' + esc(C.staffName(g.by)) + (g.at ? ' · ' + esc(g.at) : '') : '') + '</span></li>'; }).join('') + '</ul>' : TH.state('empty', { title: 'Bản cũ · chưa có rà soát', text: 'Bản tạo trước khi có bước rà soát minh chứng. Bấm Sửa để rà soát và lưu lại.' })) + '</section>';
    var hist = '<section class="rptf-pane-sec">' + ((r.edits || []).length ? '<div class="rptf-sec-hd"><b>Nhật ký sửa</b><span class="small muted">' + r.edits.length + ' lần</span></div><ul class="timeline">' + r.edits.slice().reverse().map(function (e) { return '<li>' + esc(e.note) + (e.formulas ? ' · ' + e.formulas + ' công thức đã sửa' : '') + '<div class="when">' + esc(C.staffName(e.by)) + ' · ' + esc(e.at) + '</div></li>'; }).join('') + '</ul>' : '<p class="small muted">Chưa sửa lần nào.</p>') + '</section>' +
      (TH.has('F045.D') && group.length > 1 ? '<section class="rptf-pane-sec"><div class="rptf-sec-hd"><b>Các phiên bản cùng nhóm</b><span class="small muted">' + group.length + ' bản</span></div><ul class="timeline">' + group.map(function (x) { return '<li>' + (x.id === r.id ? '<b>' + esc(x.id) + '</b> (đang xem)' : '<a href="' + href('view/' + x.id) + '">' + esc(x.id) + '</a>') + (x.deletedAt ? ' ' + TH.badge('Đã xóa', 'neutral') : '') + '<div class="when">' + esc(C.staffName(x.createdBy)) + ' · ' + esc(x.createdAt) + '</div></li>'; }).join('') + '</ul></section>' : '');
    var paneHtml = vp === 'trace' ? tracePane(r.id) : vp === 'review' ? review : vp === 'hist' ? hist : vp === 'formula' ? formulaPane(null, r.snapshot) : info;
    var side = paneShell([{ id: 'info', label: 'Thông tin' }, { id: 'trace', label: 'Nguồn ô' }, { id: 'review', label: 'Rà soát' }, { id: 'formula', label: 'Công thức', count: editCount(r) || undefined }, { id: 'hist', label: 'Lịch sử', count: ((r.edits || []).length + (group.length > 1 ? group.length - 1 : 0)) || undefined }], vp, 'vpane', paneHtml);
    var del = r.deletedAt ? '<div class="alert alert-danger u-mb-16">' + I('trash', 'ic-sm') + '<div class="alert-body"><b>Bản này đã xóa</b><span>' + esc(C.staffName(r.deletedBy)) + ' · ' + esc(r.deletedAt) + ' · lý do: ' + esc(r.deleteReason) + '. Vẫn xem và tải Excel để đối chiếu; không sửa được.</span></div></div>' : '';
    if (r.invalidatedAt) del += '<div class="alert alert-warning u-mb-16"><div class="alert-body"><b>Bản báo cáo đã hết hiệu lực</b><span>' + esc(r.invalidationReason || '') + (r.supersededBy ? ' · <a href="' + href('view/' + r.supersededBy) + '">Mở bản thay thế ' + esc(r.supersededBy) + '</a>' : '') + '. Số liệu và Excel của bản này được giữ để đối chiếu.</span></div></div>';
    if (r.replacesRunId) del += '<p class="small">Thay thế <a href="' + href('view/' + r.replacesRunId) + '">' + esc(r.replacesRunId) + '</a>.</p>';
    var acts = '<button type="button" class="btn btn-primary" data-act="rptf.xlsx" data-id="' + r.id + '">' + I('download', 'ic-sm') + 'Tải Excel</button>' + (r.deletedAt ? '' :
      '<button type="button" class="btn" data-act="rptf.edit" data-id="' + r.id + '">' + I('edit', 'ic-sm') + (TH.has('F045.D') ? 'Sửa (tạo phiên bản mới)' : 'Sửa') + '</button>' + (TH.can('report.all') ? '<button type="button" class="btn btn-ghost" data-act="rptf.delete" data-id="' + r.id + '">' + I('trash', 'ic-sm') + 'Xóa</button>' : ''));
    return TH.pageHeader({ screen: S, title: T.label + ' · kỳ ' + F.period(r.period), crumbs: [['Báo cáo', TH.router.href(S)], [r.id]], status: r.deletedAt ? TH.badge('Đã xóa', 'neutral', { icon: 'trash' }) : TH.badge('Bản lưu · chỉ đọc', 'success', { icon: 'lock' }),
      desc: metaChips([['sheet', r.id], ['building', scopeLabel(r.buildingIds)], ['clock', 'lưu lúc ' + (r.updatedAt || r.createdAt)]]) + '<span class="small muted rptf-desc-note">Số và nguồn giữ nguyên tại thời điểm tạo/sửa; tải Excel không tính lại.</span>', actions: acts }) + del +
      '<div class="rptf-ws"><div class="rptf-ws-main">' + sheetsBlock('run', r.id, 0, r.snapshot, 'vsheet', { paneKey: 'vpane' }) + '</div>' + side + '</div>';
  }

  TH.views[S] = {
    scan: function () {
      var all = TH.db.buildings.map(function (b) { return b.id; });
      return [{ param: null }, { param: null, ui: { grp: 'fin' } }, { param: null, ui: { grp: 'ops' } }, { param: null, ui: { grp: 'cus' } }, { param: null, ui: { st: 'deleted' } }, { param: null, ui: { st: 'edited' } }, { param: null, ui: { st: 'legacy' } },
        { param: 'new' }, { param: 'new', ui: { req: { type: 'RPT-05', period: '2026-09', buildingIds: all } } },
        { param: 'new', ui: { ngrp: 'ops', req: { type: 'RPT-AMD', period: '2026-09', buildingIds: all } } }, { param: 'new', ui: { ngrp: 'cus', req: { type: 'RPT-SEG', period: '2026-09', buildingIds: all } } }];
    },
    dialogs: [function () { var r = TH.reports.preview({ type: 'RPT-05', period: TH.store.state.period, buildingIds: allowedIds() }, { transient: true }); if (r.ok) { TH._transientDraft = r.draft; return traceRender({ where: 'draft', id: r.draft.id, item: 0, mode: 'kd', col: keyOf(r.draft.items[0].buildingIds), metric: 'rent' }); } },
      function () { var r = TH.reports.preview({ type: 'RPT-04', period: TH.store.state.period, buildingIds: [allowedIds()[0]] }, { transient: true }); if (r.ok) { TH._transientDraft = r.draft; sheetsBlock('draft', r.draft.id, 0, r.draft.items[0], 'sheet'); return traceRender({ where: 'draft', id: r.draft.id, item: 0, mode: 'tong', col: '', metric: 'share:0:total' }); } },
      /* Loại bổ sung: dựng preview (sheet bảng + rà soát), truy nguồn chỉ tiêu dẫn xuất và hộp sửa công thức — chỉ ở gói có loại đó */
      function () {
        var extraTypes = Object.keys(TYPES).filter(function (t) { return BASE_TYPES.indexOf(t) === -1 && canType(t); });
        extraTypes.forEach(function (t) {
          var r = TH.reports.preview({ type: t, period: TH.store.state.period, buildingIds: allowedIds() }, { transient: true });
          if (!r.ok) throw new Error(t + ': ' + r.error);
          if (r.draft.errors.length) throw new Error(t + ': ' + r.draft.errors[0]);
          TH._transientDraft = r.draft;
          var it = r.draft.items[0];
          it.sheets.forEach(function (sh) { sheetHtml('draft', r.draft.id, 0, it, sh); });
          reviewState(r.draft);
          var k = Object.keys(it.formulas)[0];
          traceRender({ where: 'draft', id: r.draft.id, item: 0, mode: Object.keys(it.vals)[0], col: keyOf(it.buildingIds), metric: k });
          formulaModal(r.draft, k);
        });
        return { title: 'Loại báo cáo bổ sung', body: '<p>Đã dựng xem trước, truy nguồn và hộp sửa công thức cho ' + extraTypes.length + ' loại báo cáo của gói.</p>', foot: '<button type="button" class="btn" data-close>Đóng</button>' };
      },
      /* Bàn làm việc xem trước: panel Kiểm tra (mọi nhóm mở), Nguồn ô (inline), Công thức, Cảnh báo; sheet có tô nhóm + ẩn dòng 0 */
      function () {
        var r = TH.reports.preview({ type: 'RPT-05', period: TH.store.state.period, buildingIds: allowedIds() }, { transient: true });
        if (!r.ok) return;
        var d = TH._transientDraft = r.draft, it = d.items[0], rs = reviewState(d), conds = conditions(d, false, rs);
        rs.groups.forEach(function (g) { groupBody(d, g, false); });
        TH.store.state.ui[S] = TH.store.state.ui[S] || {};
        var keep = TH.store.state.ui[S].nz; TH.store.state.ui[S].nz = '1';
        sheetsBlock('draft', d.id, 0, it, 'sheet', { hl: rs.groups[0] ? rs.groups[0].metrics : [], hlLabel: rs.groups[0] ? rs.groups[0].label : '', diff: [{ item: 0, mode: 'kd', col: it.cols[keyOf(it.buildingIds)].label, metric: 'rent' }] });
        TH.store.state.ui[S].nz = keep;
        var keepStack = traceStack; traceStack = [{ where: 'draft', id: d.id, item: 0, mode: 'kd', col: keyOf(it.buildingIds), metric: 'lnr' }];
        var html = checkPane(d, false, rs, conds) + tracePane(d.id) + formulaPane(d, it) + warnPane(d, false);
        traceStack = keepStack;
        return { title: 'Bàn làm việc xem trước', body: html, foot: '' };
      }],
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
  /* Dạng danh sách gọn của một chứng từ nguồn (panel bên phải) */
  function srcItemHtml(x, snap, unit, sub) {
    var m = KIND[x.kind] || [x.kind, 'neutral'], restricted = x.kind === 'payroll' && !canPayroll();
    var amt = x.amount === undefined ? '' : unit === 'count' || unit === 'num' ? (x.amount || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : F.money(x.amount);
    var det = restricted ? 'Chi tiết lương bị hạn chế theo quyền' : x.kind === 'invoice' && x.lines ? x.lines.map(function (l) { return l.name + ' ' + F.money(l.contrib); }).join(' · ') : srcText(x);
    return '<li><div class="rptf-rec-row">' + TH.badge(m[0], m[1]) + '<span class="mono small">' + esc(x.id || '—') + '</span>' + (x.room ? '<span class="small muted">' + esc(x.room) + '</span>' : '') + '<span class="spacer"></span><b class="tnum small">' + amt + '</b></div>' +
      (sub ? '<div class="cell-sub">' + sub + '</div>' : '') + (det ? '<div class="small muted rptf-clamp">' + esc(det) + '</div>' : '') + (x.dupOf ? TH.badge('Nghi trùng ' + x.dupOf + ' · không cộng', 'danger') : '') +
      ((x.lines || []).some(function (l) { return l.missingBasis; }) ? TH.badge('Thiếu căn cứ lịch sử', 'warning') : '') +
      (x.id && x.kind !== 'estimate' ? '<button type="button" class="btn btn-xs btn-ghost" data-act="rptf.open" data-kind="' + esc(x.kind) + '" data-id="' + esc(x.id) + '" data-room="' + esc(x.room || '') + '" data-b="' + esc(x.buildingId || '') + '" data-p="' + esc(snap.period) + '" data-c="' + esc(x.contractId || x.customerId || '') + '">' + I('external', 'ic-sm') + 'Mở dữ liệu hiện tại</button>' : '') + '</li>';
  }
  function srcRowHtml(x, snap, unit) {
    var m = KIND[x.kind] || [x.kind, 'neutral'];
    var amt = x.amount === undefined ? '—' : unit === 'count' || unit === 'num' ? (x.amount || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : F.money(x.amount);
    var restricted = x.kind === 'payroll' && !canPayroll();
    var det = '';
    if (x.kind === 'invoice' && x.lines) det = '<ul class="rptf-lines">' + x.lines.map(function (l) { return '<li>' + esc(l.name) + ' · <b>' + F.money(l.contrib) + '</b>' + (l.contrib !== l.amount ? ' <span class="muted">(dòng ' + F.money(l.amount) + ')</span>' : '') + '<span class="muted">' + esc(basisText(l)) + '</span>' + (l.missingBasis ? ' ' + TH.badge('Thiếu căn cứ lịch sử', 'warning') : '') + (l.type === 'adjust' && l.basis ? ' <span class="muted">· lý do: ' + esc(l.basis.reason || '') + ' · kỳ hiệu lực ' + F.period(l.basis.period) + '</span>' : '') + (l.type === 'common' && l.basis ? ' <span class="muted">· phần phòng trống ' + l.basis.vacant + ' (quy tắc ' + esc(l.basis.rule) + ', thất thoát ' + F.money(l.basis.loss) + ')</span>' : '') + '</li>'; }).join('') + '</ul>';
    else if (!restricted) det = '<div class="small muted">' + esc(srcText(x)) + '</div>';
    if (!restricted && x.sourceRule) det += '<div class="small muted">Dữ liệu mô phỏng · ' + esc(x.sourceRule.title + ' · ' + x.sourceRule.source.file + (x.sourceRule.source.cell ? ' · ' + x.sourceRule.source.cell : '')) + '</div>';
    return '<tr><td>' + TH.badge(m[0], m[1]) + '</td><td><span class="mono small">' + esc(x.id || '—') + '</span>' + (x.kind === 'invoice' && x.invPeriod ? '<div class="cell-sub">kỳ ' + F.period(x.invPeriod) + '</div>' : '') + '</td><td>' + esc(x.room || '—') + '</td><td>' + (restricted ? '<span class="small muted">Chi tiết lương bị hạn chế theo quyền</span>' : det) + (x.dupOf ? ' ' + TH.badge('Nghi trùng ' + x.dupOf + ' · không cộng', 'danger') : '') + '</td><td class="num">' + amt + '</td><td>' +
      (x.id && x.kind !== 'estimate' ? '<button type="button" class="btn btn-xs btn-ghost" data-act="rptf.open" data-kind="' + esc(x.kind) + '" data-id="' + esc(x.id) + '" data-room="' + esc(x.room || '') + '" data-b="' + esc(x.buildingId || '') + '" data-p="' + esc(snap.period) + '" data-c="' + esc(x.contractId || x.customerId || '') + '">Mở dữ liệu hiện tại</button>' : '') + '</td></tr>';
  }
  function traceRender(ctx) {
    var t = TH.reports.trace(ctx);
    if (!t) return { title: 'Không tìm thấy nguồn', body: TH.state('empty', { title: 'Ô không còn trong bản xem trước' }), foot: '<button type="button" class="btn" data-close>Đóng</button>' };
    var snap = t.snap, sheetLbl = (ctx.where === 'run' ? 'Bản lưu ' + ctx.id : 'Xem trước') + ' · kỳ ' + F.period(snap.period);
    var qty = function (x, unit) { return unit === 'count' || unit === 'num' ? (x || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : F.money(x || 0); };
    var val = t.kind === 'ratio' ? (t.na ? 'Không áp dụng' : t.unit === 'money' ? F.money(Math.round(t.value)) : (t.times ? (t.value).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + (t.unit === 'num' ? '' : ' lần') : F.pct(t.value, 2))) : t.count ? t.value + (BASE_TYPES.indexOf(snap.type) > -1 ? ' phòng' : '') : qty(t.value, t.unit);
    var go = function (metric, col, label, v) { return '<button type="button" class="link-btn" data-act="rptf.tdrill" data-m="' + esc(metric) + '" data-col="' + esc(col) + '" aria-label="Xem nguồn ' + esc(label) + '">' + esc(label) + '</button>'; };
    var modeTxt = t.modeLabel || (t.mode === 'kd' ? 'chế độ Kinh doanh' : 'chế độ Tổng');
    /* Phương trình một dòng + đối chiếu: nhìn là biết số đến từ đâu, có khớp nguồn không */
    var term = function (label, v, res) { return '<span class="rptf-eq-t' + (res ? ' is-res' : '') + '"><small>' + esc(label) + '</small><b class="tnum">' + esc(v) + '</b></span>'; };
    var op = function (s) { return '<span class="rptf-eq-op" aria-hidden="true">' + s + '</span>'; };
    var unitOf = function (k) { return (mdefOf(snap, k) || {}).unit; };
    var eq = '';
    if (t.kind === 'derived') eq = t.parts.map(function (x, i) { var w = Math.abs(x.w); return (i || x.w < 0 ? op(x.w < 0 ? '−' : '+') : '') + term((w !== 1 ? w.toLocaleString('vi-VN', { maximumFractionDigits: 4 }) + ' × ' : '') + x.label, qty(x.value, unitOf(x.metric))); }).join('') + op('=') + term(t.label, val, true);
    if (t.kind === 'ratio') eq = term('Tử số', qty(t.numValue, unitOf((t.numParts[0] || {}).metric))) + op('÷') + term('Mẫu số', qty(t.denValue, unitOf((t.denParts[0] || {}).metric))) + op('=') + term(t.label, val, true);
    if (t.kind === 'leaf') eq = term(t.contrib ? 'Σ ' + t.contrib.length + ' tòa' : 'Σ ' + (t.sources || []).length + ' bản ghi nguồn', t.count && BASE_TYPES.indexOf(snap.type) > -1 ? String(t.check) : qty(t.check, t.unit)) + op('=') + term(t.label, val, true);
    var off = t.check !== undefined && Math.abs(t.check - t.value) > TOL;
    var match = t.check !== undefined && t.kind !== 'ratio' ? '<div class="rptf-match">' + (off ? TH.badge('Lệch ' + qty(t.value - t.check, t.unit), 'danger', { icon: 'xCircle' }) : TH.badge('Khớp', 'success', { icon: 'check' })) + '<span class="small muted">' + (t.kind === 'derived' ? 'Tính lại từ thành phần' : t.contrib ? 'Σ các tòa so với cột tổng' : 'Σ chứng từ nguồn so với số trên báo cáo') + '</span></div>' : '';
    var body = (eq ? '<div class="rptf-eq" role="group" aria-label="Phương trình">' + eq + '</div>' : '') + match + '<dl class="kv u-mb-12"><dt>Ngữ cảnh</dt><dd>' + esc(sheetLbl) + (t.colLabel ? ' · cột <b>' + esc(t.colLabel) + '</b>' : '') + (t.mode ? ' · ' + esc(modeTxt) : '') + '</dd><dt>Giá trị</dt><dd><b class="tnum rptf-trace-val">' + esc(val) + '</b></dd>' +
      (t.formula ? '<dt>Công thức' + (t.edited ? ' ' + TH.badge('Đã sửa', 'warning') : '') + '</dt><dd>' + esc(t.formula) + (t.edited ? '<div class="small muted">Chuẩn: ' + esc(t.stdText) + ' · lý do sửa: ' + esc(t.reason || '') + '</div>' : '') + '</dd>' : '') + (t.filter ? '<dt>Quy tắc lọc</dt><dd class="small">' + esc(t.filter) + '</dd>' : '') + '</dl>';
    var partRows = function (parts) { return parts.map(function (x) { return '<tr><td>' + go(x.metric, ctx.col, x.label) + '</td><td class="num">' + (x.w < 0 ? '−' : '+') + ' ' + Math.abs(x.w).toLocaleString('vi-VN', { maximumFractionDigits: 4 }) + '</td><td class="num">' + qty(x.value, (mdefOf(snap, x.metric) || {}).unit) + '</td></tr>'; }).join(''); };
    if (t.kind === 'ratio') body += '<table class="table table-compact" aria-label="Tử số và mẫu số"><thead><tr><th>Thành phần</th><th class="num">Hệ số</th><th class="num">Giá trị</th></tr></thead><tbody><tr class="rpt-grp"><td colspan="3">Tử số = ' + esc(qty(t.numValue)) + '</td></tr>' + partRows(t.numParts) + '<tr class="rpt-grp"><td colspan="3">Mẫu số = ' + esc(qty(t.denValue)) + '</td></tr>' + partRows(t.denParts) + '</tbody></table>' + (t.na ? '<p class="small muted">Mẫu số bằng 0 → chỉ tiêu không áp dụng (không hiển thị 0%).</p>' : '');
    if (t.kind === 'derived') body += '<table class="table table-compact" aria-label="Thành phần"><thead><tr><th>Thành phần</th><th class="num">Hệ số</th><th class="num">Giá trị</th></tr></thead><tbody>' + partRows(t.parts) + '</tbody><tfoot><tr><th>Đối chiếu</th><td></td><td class="num"><b>' + qty(t.check, t.unit) + '</b>' + (Math.abs(t.check - t.value) > TOL ? ' <span class="neg">lệch ' + qty(t.value - t.check, t.unit) + '</span>' : ' ✓') + '</td></tr></tfoot></table>';
    if (t.kind === 'leaf' && t.contrib) body += '<table class="table table-compact" aria-label="Đóng góp từng tòa"><thead><tr><th>Tòa</th><th class="num">Giá trị</th></tr></thead><tbody>' + t.contrib.map(function (x) { return '<tr><td>' + go(t.metric, x.col, x.label) + '</td><td class="num">' + (t.count ? x.value : F.money(x.value)) + '</td></tr>'; }).join('') + '</tbody><tfoot><tr><th>Σ tòa</th><td class="num"><b>' + (t.count ? t.check : F.money(t.check)) + '</b>' + (Math.abs(t.check - t.value) > TOL ? ' <span class="neg">lệch</span>' : ' ✓') + '</td></tr></tfoot></table>';
    if (t.kind === 'leaf' && t.sources && ctx.inline) {
      body += '<div class="rptf-sec-hd"><b>Chứng từ nguồn</b><span class="small muted">' + t.sources.length + ' bản ghi</span></div>' + (t.sources.length ? '<ul class="rptf-recs">' + t.sources.map(function (x) { return srcItemHtml(x, snap, t.unit); }).join('') + '</ul>' : '<p class="small muted">Không có bản ghi nguồn — dòng bằng 0 trong kỳ.</p>');
      if (t.excluded && t.excluded.length) body += '<div class="alert alert-neutral u-mt-8">' + I('info', 'ic-sm') + '<div class="alert-body"><b>' + esc(t.excludedNote) + '</b><span>' + t.excluded.map(function (x) { return esc(x.id + ' ' + F.money(x.amount)); }).join(', ') + '</span></div></div>';
      if (t.notes && t.notes.length) body += '<p class="small muted">Ghi chú dòng: ' + esc(t.notes.join(', ')) + '</p>';
    } else if (t.kind === 'leaf' && t.sources) {
      body += '<div class="table-wrap"><table class="table table-compact" aria-label="Nguồn đóng góp"><thead><tr><th>Loại</th><th>Chứng từ</th><th>Phòng</th><th>Căn cứ (tại thời điểm tạo)</th><th class="num">' + (t.unit === 'money' ? 'Số tiền' : 'Đóng góp') + '</th><th></th></tr></thead><tbody>' + (t.sources.length ? t.sources.map(function (x) { return srcRowHtml(x, snap, t.unit); }).join('') : '<tr><td colspan="6" class="muted small">Không có bản ghi nguồn — dòng bằng 0 trong kỳ.</td></tr>') + '</tbody></table></div>';
      var legacyCount = t.count && BASE_TYPES.indexOf(snap.type) > -1;
      body += '<p class="small u-mt-8">Σ nguồn ' + (legacyCount ? t.check + ' bản ghi' : qty(t.check, t.unit)) + ' · báo cáo ' + (legacyCount ? t.value : qty(t.value, t.unit)) + ' · chênh lệch làm tròn ' + (legacyCount ? t.value - t.check : qty(t.value - t.check, t.unit)) + (Math.abs(t.check - t.value) > TOL ? ' <span class="neg">— không đối chiếu được</span>' : ' ✓') + '</p>';
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
  TH.act['rptf.new'] = function () {
    var r = req(); TH.store.setUi(S, 'err', '');
    var g = TH.store.ui(S, 'grp', 'all');
    if (r.editOf || r.previousRunId || hasEdits(r.formulas)) setReq({ editOf: null, previousRunId: null, formulas: {} });
    if (g !== 'all' && TYPES[req().type].group !== g) { var t = Object.keys(TYPES).find(function (x) { return TYPES[x].group === g && canType(x); }); if (t) setReq({ type: t }); }
    TH.store.setUi(S, 'ngrp', TYPES[req().type].group);
    goSub('new');
  };
  TH.act['rptf.newType'] = function (el) { var t = el.dataset.type; if (!canType(t)) return; TH.store.setUi(S, 'err', ''); setReq({ type: t, editOf: null, previousRunId: null, formulas: {} }); TH.store.setUi(S, 'ngrp', TYPES[t].group); goSub('new'); };
  TH.act['rptf.pickType'] = function (el) { var t = el.dataset.type; if (!canType(t)) return; setReq({ type: t }); TH.app.refresh(); };
  TH.act['rptf.leave'] = function () { setReq({ editOf: null, previousRunId: null, formulas: {} }); TH.store.setUi(S, 'err', ''); goSub(''); };
  /* Sửa bản báo cáo: mở lại preview với loại/kỳ/tòa/công thức của bản đó. Gói D → phiên bản mới; gói A–C → cập nhật cùng bản ghi. */
  TH.act['rptf.edit'] = function (el) {
    var r = runOf(el.dataset.id); if (!r || !canSee(r) || r.deletedAt) return;
    var request = { type: r.type, period: r.period, buildingIds: r.buildingIds, tpl: (r.template || '').split(' ')[0], editOf: r.id, previousRunId: TH.has('F045.D') ? r.id : null, formulas: deep(r.formulas) || {} };
    TH.store.setUi(S, 'req', deep(request));
    var res = TH.reports.preview(request);
    if (!res.ok) { TH.store.setUi(S, 'err', res.error); goSub('new'); return; }
    TH.store.setUi(S, 'item', 0); TH.store.setUi(S, 'sheet', null); resetWorkspace(); goSub('preview/' + res.draft.id);
  };
  TH.act['rptf.delete'] = function (el) {
    var r = runOf(el.dataset.id); if (!r) return;
    TH.modal.open({ key: 'rptf-del', size: 'sm', render: function () {
      return { title: I('trash') + ' Xóa bản báo cáo ' + esc(r.id), sub: esc(TYPES[r.type].label) + ' · kỳ ' + F.period(r.period),
        body: '<p class="small">Bản báo cáo sẽ ẩn khỏi danh sách, vẫn xem và tải lại được ở bộ lọc <b>Đã xóa</b>. Thao tác được ghi nhật ký.</p><div class="field u-mt-12"><label for="rptf-del-reason">Lý do xóa <span class="req">*</span></label><textarea id="rptf-del-reason" class="textarea" rows="3" placeholder="VD: tạo nhầm kỳ, đã có bản thay thế"></textarea></div><p class="small neg u-mt-8" id="rptf-del-err" hidden>Ghi lý do xóa.</p>',
        foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-danger-solid" data-act="rptf.deleteOk" data-id="' + r.id + '">' + I('trash', 'ic-sm') + 'Xóa bản báo cáo</button>' };
    } });
  };
  TH.act['rptf.deleteOk'] = function (el) {
    var box = document.getElementById('rptf-del-reason'), res = TH.reports.remove(el.dataset.id, box ? box.value : '');
    if (!res.ok) { var e = document.getElementById('rptf-del-err'); if (e) { e.hidden = false; e.textContent = res.error; } return; }
    TH.modal.close('rptf-del', { silent: true });
    if (location.hash.indexOf('/view/') > -1) goSub(''); else TH.app.refresh();
    TH.toast('Đã xóa bản báo cáo', esc(el.dataset.id) + ' · xem lại ở bộ lọc Đã xóa', 'info');
  };
  TH.onChange['rptf.review'] = function (el) {
    var res = TH.reports.setReview(el.dataset.id, el.dataset.g, el.checked);
    TH.app.refresh();
    if (res && !res.ok) TH.toast('Chưa tích được', esc(res.error), 'warning');
  };
  /* Danh sách bản ghi của một nhóm minh chứng (mở = đã xem) */
  TH.act['rptf.evidence'] = function (el) {
    var d = draftOf(el.dataset.id); if (!d) return;
    TH.reports.markSeen(d.id, el.dataset.g);
    var g = reviewState(d).groups.find(function (x) { return x.id === el.dataset.g; }); if (!g) return;
    TH.app.refresh();
    TH.modal.open({ key: 'rptf-ev', size: 'lg', render: function () {
      var it = d.items[0];
      return { title: I('list') + ' Minh chứng · ' + esc(g.label), sub: g.n + ' bản ghi · ' + g.metrics.length + ' chỉ tiêu · tại thời điểm xem trước',
        body: '<ul class="rptf-checklist u-mb-12">' + g.checks.map(function (c) { return '<li class="is-' + c.level + '">' + I(c.level === 'ok' ? 'checkCircle' : c.level === 'error' ? 'xCircle' : 'alert', 'ic-sm') + '<span>' + esc(c.text) + '</span></li>'; }).join('') + '</ul>' +
          '<div class="table-wrap"><table class="table table-compact" aria-label="Bản ghi minh chứng"><thead><tr><th>Loại</th><th>Chứng từ</th><th>Phòng</th><th>Căn cứ · dùng cho chỉ tiêu</th><th class="num">Đóng góp</th><th></th></tr></thead><tbody>' +
          g.recs.map(function (rec) { var sn = d.items[rec.item] || it, row = srcRowHtml(rec.x, sn, 'money'); return row.replace('</td><td class="num">', '<div class="cell-sub">' + esc(rec.metrics.map(function (k) { return labelOf(k, 'tong', sn); }).join(', ')) + ' · ' + esc((sn.labels[rec.b] || {}).short || '') + '</div></td><td class="num">'); }).join('') +
          '</tbody></table></div>',
        foot: '<span class="small muted">Đóng góp ghi theo dòng nguồn đầu tiên; bấm số trên sheet để xem đối chiếu từng chỉ tiêu.</span><span class="spacer"></span><button type="button" class="btn" data-close>Đóng</button>' };
    } });
  };
  /* Sửa công thức: thành phần × hệ số (bật/tắt, hệ số âm/thập phân), bắt buộc lý do */
  function formulaCandidates(k, snap, eff) {
    var keys = snap.mdefs ? Object.keys(snap.mdefs) : TH.PNL_LINES.filter(function (l) { return l.k; }).map(function (l) { return l.k; }).concat(['salary', 'gdv']);
    var depends = function (a, b) { var f = eff[a]; if (!f) return false; return formulaDeps(f).some(function (x) { return x === b || depends(x, b); }); };
    return keys.filter(function (x) { return x !== k && x.indexOf('r:') !== 0 && !depends(x, k) && !(eff[x] && eff[x].kind === 'ratio'); });
  }
  function formulaModal(d, k) {
    var it = d.items[0], eff = effFormulas(d.request.type, d.request.formulas), f = eff[k], std = stdFormulas(d.request.type)[k];
    var cands = formulaCandidates(k, it, eff);
    var table = function (side, parts) {
      var w = {}; (parts || []).forEach(function (p) { w[p[0]] = p[1]; });
      var ordered = Object.keys(w).concat(cands.filter(function (x) { return w[x] === undefined; }));
      return '<div class="table-wrap rptf-fx-list"><table class="table table-compact" aria-label="Thành phần ' + (side === 'den' ? 'mẫu số' : side === 'num' ? 'tử số' : '') + '"><thead><tr><th>Dùng</th><th>Thành phần</th><th class="num">Hệ số</th></tr></thead><tbody>' +
        ordered.map(function (x) { var on = w[x] !== undefined; return '<tr><td><input type="checkbox" class="rptf-fx-on" data-act-change="rptf.fxLive" data-id="' + d.id + '" data-k="' + esc(k) + '" data-side="' + side + '" data-c="' + esc(x) + '"' + (on ? ' checked' : '') + ' aria-label="Dùng ' + esc(labelOf(x, 'tong', it)) + '"></td><td>' + esc(labelOf(x, 'tong', it)) + (std && formulaDeps(std).indexOf(x) > -1 ? ' <span class="cell-sub">chuẩn</span>' : '') + '</td><td class="num"><input type="number" step="0.01" class="input input-sm rptf-fx-w" data-act-change="rptf.fxLive" data-id="' + d.id + '" data-k="' + esc(k) + '" data-side="' + side + '" data-c="' + esc(x) + '" value="' + (on ? w[x] : 1) + '" aria-label="Hệ số ' + esc(labelOf(x, 'tong', it)) + '"></td></tr>'; }).join('') + '</tbody></table></div>';
    };
    var body = '<dl class="kv u-mb-12"><dt>Công thức chuẩn</dt><dd>' + esc(formulaText(std, it, 'tong', true)) + '</dd><dt>Đang dùng</dt><dd>' + esc(formulaText(f, it, 'tong', true)) + (f.edited ? ' ' + TH.badge('Đã sửa', 'warning') : '') + '</dd></dl>' +
      (std.kind === 'ratio' ? '<div class="grid-2"><div><div class="section-title">Tử số</div>' + table('num', f.num) + '</div><div><div class="section-title">Mẫu số</div>' + table('den', f.den) + '</div></div>' : table('parts', f.parts)) +
      '<div class="rptf-fx-live" id="rptf-fx-live" aria-live="polite">' + fxLiveHtml(d, k, f) + '</div>' +
      '<div class="field u-mt-12"><label for="rptf-fx-reason">Lý do sửa <span class="req">*</span></label><textarea id="rptf-fx-reason" class="textarea" rows="2" placeholder="VD: khách chốt máy giặt tính 40% vào điện">' + esc(f.edited ? f.reason : '') + '</textarea></div><p class="small neg u-mt-8" id="rptf-fx-err" hidden></p>' +
      '<p class="small muted u-mt-8">Hệ số âm là trừ. Lưu xong preview tính lại mọi cột; nhóm minh chứng phải rà soát lại.</p>';
    return { title: I('calculator') + ' Sửa công thức · ' + esc(labelOf(k, 'tong', it)), sub: esc(TYPES[d.request.type].label) + ' · áp dụng cho bản xem trước này', body: body,
      foot: '<button type="button" class="btn btn-ghost" data-act="rptf.fxReset" data-id="' + d.id + '" data-k="' + esc(k) + '"' + (f.edited ? '' : ' disabled') + '>' + I('rotateCcw', 'ic-sm') + 'Khôi phục chuẩn</button><span class="spacer"></span><button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="rptf.fxSave" data-id="' + d.id + '" data-k="' + esc(k) + '">' + I('check', 'ic-sm') + 'Lưu và tính lại</button>' };
  }
  /* Kết quả xem trước trong hộp sửa công thức: cột Tổng hiện tại → theo thành phần đang chọn (chưa lưu) */
  function fxLiveHtml(d, k, fNew) {
    var it = d.items[0], mode = it.vals.tong ? 'tong' : Object.keys(it.vals)[0], ck = keyOf(it.buildingIds), vv = (it.vals[mode] || {})[ck];
    if (!vv) return '';
    var nv = evalFormula(fNew, vv), same = nv === vv[k] || (nv !== null && vv[k] !== null && Math.abs(nv - vv[k]) <= TOL);
    return '<span class="small muted">Kết quả cột ' + esc((it.cols[ck] || {}).label || 'Tổng') + '</span><span class="rptf-fx-vals">' + fmtUnit(it, k, vv[k]) + '<span aria-hidden="true">→</span><b>' + fmtUnit(it, k, nv) + '</b></span>' + (same ? '<span class="small muted">không đổi</span>' : TH.badge('Sẽ thay đổi', 'warning'));
  }
  TH.onChange['rptf.fxLive'] = function (el) {
    var d = draftOf(el.dataset.id), box = document.getElementById('rptf-fx-live'); if (!d || !box) return;
    var std = stdFormulas(d.request.type)[el.dataset.k];
    var f = std.kind === 'ratio' ? { kind: 'ratio', num: readFx('num'), den: readFx('den') } : { kind: 'sum', parts: readFx('parts') };
    box.innerHTML = fxLiveHtml(d, el.dataset.k, f);
  };
  TH.act['rptf.formula'] = function (el) {
    var d = draftOf(el.dataset.id); if (!d) return;
    if (!canEditFormula()) { TH.toast('Không có quyền (403)', 'Chỉ kế toán/quản trị được sửa công thức.', 'danger'); return; }
    TH.modal.open({ key: 'rptf-fx', size: 'lg', render: function () { return formulaModal(d, el.dataset.k); } });
  };
  function readFx(side) {
    var root = TH.modal.top() ? TH.modal.top().el : document, out = [];
    root.querySelectorAll('.rptf-fx-on[data-side="' + side + '"]').forEach(function (cb) {
      if (!cb.checked) return;
      var w = root.querySelector('.rptf-fx-w[data-side="' + side + '"][data-c="' + cb.dataset.c + '"]');
      out.push([cb.dataset.c, w ? parseFloat(w.value) : 1]);
    });
    return out;
  }
  TH.act['rptf.fxSave'] = function (el) {
    var d = draftOf(el.dataset.id); if (!d) return;
    var k = el.dataset.k, std = stdFormulas(d.request.type)[k], box = document.getElementById('rptf-fx-reason');
    var f = std.kind === 'ratio' ? { num: readFx('num'), den: readFx('den') } : { parts: readFx('parts') };
    f.reason = box ? box.value : '';
    var res = TH.reports.setFormula(d.id, k, f);
    if (!res.ok) { var e = document.getElementById('rptf-fx-err'); if (e) { e.hidden = false; e.textContent = res.error; } return; }
    TH.modal.close('rptf-fx', { silent: true }); TH.app.refresh();
    TH.toast('Đã cập nhật công thức', esc(labelOf(k, 'tong', d.items[0])) + ' · preview đã tính lại; rà soát lại minh chứng trước khi tạo.', 'info');
  };
  TH.act['rptf.fxReset'] = function (el) {
    var res = TH.reports.setFormula(el.dataset.id, el.dataset.k, null);
    if (!res.ok) return;
    TH.modal.close('rptf-fx', { silent: true }); TH.app.refresh();
    TH.toast('Đã khôi phục công thức chuẩn', 'Bản xem trước đã tính lại.', 'info');
  };
  TH.onChange['rptf.type'] = function (el) { setReq({ type: el.value }); TH.app.refresh(); };
  TH.onChange['rptf.period'] = function (el) { setReq({ period: el.value }); TH.app.refresh(); };
  TH.onChange['rptf.tpl'] = function (el) { setReq({ tpl: el.value }); TH.app.refresh(); };
  TH.onChange['rptf.b'] = function (el) { var r = req(), b = el.dataset.b, ids = r.buildingIds.filter(function (x) { return x !== b; }); if (el.checked) ids.push(b); setReq({ buildingIds: ids }); TH.app.refresh(); };
  TH.onChange['rptf.all'] = function (el) { setReq({ buildingIds: el.checked ? allowedIds() : [] }); TH.app.refresh(); };
  TH.act['rptf.preview'] = function () {
    var res = TH.reports.preview(req());
    if (!res.ok) { TH.store.setUi(S, 'err', res.error); TH.app.refresh(); return; }
    TH.store.setUi(S, 'err', ''); TH.store.setUi(S, 'item', 0); TH.store.setUi(S, 'sheet', null); resetWorkspace();
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
    TH.store.setUi(S, 'ft', 'all'); TH.store.setUi(S, 'st', 'live'); TH.store.setUi(S, 'vpane', 'info'); traceStack = [];
    setReq({ editOf: null, previousRunId: null, formulas: {} });
    goSub(res.runIds.length === 1 ? 'view/' + res.runIds[0] : '');
    TH.toast(res.edited ? 'Đã cập nhật ' + res.runIds[0] : 'Đã tạo ' + res.runIds.length + ' báo cáo', esc(res.runIds.join(', ')) + (res.durable ? ' · đã lưu trong trình duyệt' : ' · CHỈ LƯU TRONG PHIÊN — bộ nhớ trình duyệt bị chặn/đầy, tải lại trang sẽ mất'), res.durable ? 'success' : 'warning');
  };
  TH.act['rptf.xlsx'] = function (el) { var x = TH.reports.export(el.dataset.id); if (x) TH.toast('Đã tải Excel', esc(x.filename) + ' · ' + x.sheets.length + ' sheet từ bản lưu'); else TH.toast('Không tải được', 'Bản báo cáo không tồn tại hoặc ngoài quyền.', 'danger'); };
  TH.act['rptf.version'] = function (el) {
    var r = runOf(el.dataset.id); if (!r || !canSee(r)) return;
    var res = TH.reports.preview({ type: r.type, period: r.period, buildingIds: r.buildingIds, tpl: (r.template || '').split(' ')[0], previousRunId: r.id });
    if (!res.ok) { TH.toast('Không tạo được preview', esc(res.error), 'danger'); return; }
    TH.store.setUi(S, 'item', 0); resetWorkspace(); goSub('preview/' + res.draft.id);
  };
  /* Màn rộng: truy nguồn hiện trong panel bên phải (bảng vẫn thấy); màn hẹp hoặc đang mở modal: dùng modal */
  function traceInModal() { var t = TH.modal.top(); return !!t && t.key === 'rptf-trace'; }
  function showTrace() {
    var top = traceStack[traceStack.length - 1], onPage = /#\/demo\/reports\/(preview|view)\//.test(location.hash);
    var wide = !window.matchMedia || window.matchMedia('(min-width: 1100px)').matches;
    if (traceInModal() || !wide || !onPage) { openTrace(); return; }
    TH.store.setUi(S, top.where === 'run' ? 'vpane' : 'pane', 'trace'); TH.app.refresh();
  }
  TH.act['rptf.trace'] = function (el) {
    var ctx = { where: el.dataset.where, id: el.dataset.id, item: +el.dataset.item || 0, mode: el.dataset.mode, col: el.dataset.col, metric: el.dataset.m };
    traceStack = [ctx]; showTrace();
  };
  TH.act['rptf.tdrill'] = function (el) { var top = traceStack[traceStack.length - 1]; traceStack.push(Object.assign({}, top, { metric: el.dataset.m, col: el.dataset.col || top.col })); showTrace(); };
  TH.act['rptf.tback'] = function () { if (traceStack.length > 1) traceStack.pop(); showTrace(); };
  TH.act['rptf.tjump'] = function (el) { traceStack = traceStack.slice(0, (+el.dataset.i || 0) + 1); showTrace(); };
  TH.act['rptf.tclose'] = function () { var top = traceStack[0]; traceStack = []; TH.store.setUi(S, top && top.where === 'run' ? 'vpane' : 'pane', top && top.where === 'run' ? 'info' : 'check'); TH.app.refresh(); };
  /* Mở/đóng nhóm minh chứng: mở = đã xem (điều kiện tích rà soát) + tô các ô thuộc nhóm trên bảng */
  TH.act['rptf.group'] = function (el) {
    var g = el.dataset.g;
    if (TH.store.ui(S, 'hl', '') === g) TH.store.setUi(S, 'hl', '');
    else { TH.store.setUi(S, 'hl', g); TH.reports.markSeen(el.dataset.id, g); }
    TH.app.refresh();
  };
  function resetWorkspace() { traceStack = []; TH.store.setUi(S, 'pane', 'check'); TH.store.setUi(S, 'hl', ''); }
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
