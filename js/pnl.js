/*
 * Báo cáo theo mẫu khách (CR-RPT-01) — tính P&L tòa/kỳ đúng bố cục:
 *   docs/G1.31.8.26.xlsx → sheet "BÁO CÁO THÁNG 8" (báo cáo doanh thu từng tòa + bảng chia cổ phần)
 *   docs/bao_cao/BÁO CÁO KINH DOANH THÁNG 8.xlsx → "BÁO CÁO TỔNG / BÁO CÁO KINH DOANH / BC DT NHÀ …"
 * Mọi số đi từ bản ghi gốc (hóa đơn đã xác nhận, cọc, chi phí đã duyệt, bảng phân bổ chi phí chung, lương HS).
 */
var TH = window.TH = window.TH || {};
(function () {
  var C = TH.calc;
  function db() { return TH.db; }
  var sum = C.sum;

  /* Thứ tự dòng = thứ tự trong sheet mẫu. kind: sec (tiêu đề nhóm), grp (nhóm con), money, count, pct */
  TH.PNL_LINES = [
    { sec: 'Doanh thu' },
    { k: 'total', label: 'Tổng doanh thu tháng', strong: true, hint: 'DT tiền phòng + DT dịch vụ + cọc phòng mới + cọc khách bỏ − hoàn cọc', hintKd: 'DT tiền phòng + DT dịch vụ + cọc khách bỏ − hoàn cọc (không gồm cọc phòng mới)' },
    { k: 'depIn', label: 'Cọc phòng mới', indent: 1, notes: true },
    { k: 'depForfeit', label: 'Cọc khách bỏ không ở', indent: 1, notes: true },
    { k: 'depRefund', label: 'Hoàn cọc', indent: 1, notes: true, minus: true },
    { k: 'cntBroke', label: 'Tổng số phòng phá HĐ', indent: 1, count: true, notes: true },
    { k: 'cntNew', label: 'Tổng số phòng mới', indent: 1, count: true, notes: true },
    { k: 'cntVacant', label: 'Tổng số phòng trống', indent: 1, count: true, notes: true },
    { k: 'rent', label: 'Doanh thu tiền phòng' },
    { grp: 'Doanh thu dịch vụ' },
    { k: 'elec', label: 'Doanh thu điện', indent: 1 },
    { k: 'water', label: 'Doanh thu nước', indent: 1 },
    { k: 'clean', label: 'Doanh thu phí vệ sinh', indent: 1, split: true },
    { k: 'net', label: 'Doanh thu mạng', indent: 1 },
    { k: 'ev', label: 'Doanh thu xe điện', indent: 1 },
    { k: 'lift', label: 'Doanh thu phí thang máy / DV khác', indent: 1, split: true },
    { k: 'wash', label: 'Doanh thu máy giặt', indent: 1, split: true },
    { k: 'svc', label: 'Doanh thu tổng dịch vụ nhà', strong: true },
    { sec: 'Giá vốn' },
    { k: 'cRent', label: 'Tiền thuê nhà 1 tháng' },
    { k: 'equip', label: 'Mua sắm thêm thiết bị', notes: true },
    { grp: 'Giá gốc dịch vụ' },
    { k: 'cElec', label: 'Điện', indent: 1 },
    { k: 'cWater', label: 'Nước', indent: 1 },
    { k: 'cNet', label: 'Mạng', indent: 1 },
    { k: 'cWaste', label: 'Phí thu rác', indent: 1 },
    { k: 'cEnv', label: 'Phí môi trường', indent: 1 },
    { k: 'cLift', label: 'Phí bảo trì thang máy', indent: 1 },
    { k: 'gv', label: 'Giá vốn (GV)', strong: true },
    { sec: 'Chi phí vận hành' },
    { k: 'mgr', label: 'Lương quản lý', payroll: true },
    { k: 'gm', label: 'Lương quản lý tổng', alloc: true },
    { k: 'opsHead', label: 'Lương trưởng phòng vận hành', alloc: true },
    { k: 'lead', label: 'Lương trưởng nhóm vận hành', payroll: true },
    { k: 'source', label: 'Lương nhân viên nguồn', alloc: true },
    { k: 'sales', label: 'Lương NVKD', alloc: true },
    { k: 'cleanStaff', label: 'Lương vệ sinh' },
    { k: 'acct', label: 'Lương kế toán', alloc: true },
    { k: 'repairStaff', label: 'Lương sửa chữa', alloc: true },
    { k: 'security', label: 'Lương bảo vệ', alloc: true },
    { k: 'office', label: 'Thuê và DV văn phòng', alloc: true },
    { sec: 'Chi phí bán hàng phát sinh' },
    { k: 'mkt', label: 'Phí marketing / hoa hồng', notes: true, alloc: true },
    { k: 'repair', label: 'Sửa chữa, thay thế, bảo trì', notes: true },
    { k: 'other', label: 'Chi phí khác', notes: true },
    { k: 'cpbh', label: 'Tổng chi phí bán hàng (CPBH)', strong: true },
    { k: 'tcp', label: 'TỔNG CHI PHÍ (TCP)', strong: true },
    { k: 'lng', label: 'Lợi nhuận gộp (LNG)', strong: true, result: true, hint: 'DT − GV' },
    { k: 'lnr', label: 'Lợi nhuận ròng (LNR)', strong: true, result: true, hint: 'DT − TCP' },
  ];
  TH.PNL_RATIOS = [
    { k: 'lnr_dt', label: 'Tỷ lệ LNR / DT' }, { k: 'lng_dt', label: 'Tỷ lệ LNG / DT' }, { k: 'lnr_gv', label: 'Tỷ lệ LNR / GV' },
    { k: 'lnr_lng', label: 'Tỷ lệ LNR / LNG' }, { k: 'cp_lng', label: 'CP / LNG', times: true }, { k: 'gv_dt', label: 'GV / DT' },
    { k: 'cpbh_dt', label: 'CPBH / DT' }, { k: 'tcp_dt', label: 'TCP / DT' }, { k: 'luong_cpbh', label: 'Lương / CPBH' },
    { k: 'hh_cpbh', label: 'HH / CPBH' }, { k: 'cpk_cpbh', label: 'CPK / CPBH' }, { k: 'dtdv_gdv', label: 'DT dịch vụ / giá nhập DV', times: true },
    { k: 'dtn_gtn', label: 'DT tiền nhà / giá thuê nhà', times: true },
  ];
  var MONEY_KEYS = TH.PNL_LINES.filter(function (l) { return l.k && !l.count; }).map(function (l) { return l.k; });
  var COUNT_KEYS = TH.PNL_LINES.filter(function (l) { return l.count; }).map(function (l) { return l.k; });
  var POOL_MAP = { gm: 'gm', opsHead: 'opsHead', source: 'source', sales: 'sales', acct: 'acct', repairStaff: 'repairStaff', security: 'security', office: 'office', marketing: 'mkt' };
  var EXP_MAP = { owner_rent: 'cRent', equipment: 'equip', internet: 'cNet', waste: 'cWaste', elevator: 'cLift', cleaning: 'cleanStaff', commission: 'mkt', repair: 'repair', supplies: 'other', other: 'other' };

  /* Trạng thái phòng tại cuối kỳ theo lịch sử roomEvents */
  C.roomStateAt = function (room, period) {
    var cut = period + '-28';
    var ev = db().roomEvents.filter(function (e) { return e.roomId === room.id; }).sort(function (a, b) { return a.at < b.at ? -1 : 1; });
    var before = ev.filter(function (e) { return e.at < cut; });
    if (before.length) return before[before.length - 1].to;
    var after = ev.filter(function (e) { return e.at >= cut; });
    return after.length ? after[0].from : room.status;
  };

  function blank() {
    var v = { notes: {}, src: {} };
    MONEY_KEYS.concat(COUNT_KEYS).forEach(function (k) { v[k] = 0; v.notes[k] = []; v.src[k] = []; });
    return v;
  }
  function add(v, k, amount, src, note) {
    v[k] += amount;
    if (src) v.src[k].push(src);
    if (note && v.notes[k].indexOf(note) === -1) v.notes[k].push(note);
  }
  function lineKey(l) {
    if (l.type === 'rent') return 'rent';
    if (l.type === 'elec') return 'elec';
    if (l.type === 'water') return 'water';
    if (l.type === 'extra') return 'lift';
    if (l.code === 'NET') return 'net';
    if (l.code === 'PARK') return 'ev';
    return 'svcSplit';
  }

  /* P&L cơ sở của 1 tòa (chưa áp chế độ báo cáo) */
  function base(period, bId) {
    var b = C.building(bId), v = blank();
    var rooms = db().rooms.filter(function (r) { return r.buildingId === bId; });
    v.b = b; v.period = period; v.rooms = rooms.length; v.buildings = [bId];

    /* Doanh thu từ hóa đơn đã xác nhận của kỳ */
    var invs = C.invoicesIn(period, bId).filter(function (i) { return i.status === 'confirmed'; });
    invs.forEach(function (inv) {
      var per = {};
      inv.lines.forEach(function (l) {
        var k = lineKey(l);
        if (k === 'svcSplit') {
          var a = Math.round(l.amount / 3);
          per.clean = (per.clean || 0) + a; per.lift = (per.lift || 0) + a; per.wash = (per.wash || 0) + l.amount - 2 * a;
        } else per[k] = (per[k] || 0) + l.amount;
      });
      Object.keys(per).forEach(function (k) { add(v, k, per[k], { kind: 'invoice', id: inv.id, room: inv.roomId, amount: per[k] }); });
    });
    v.invoices = invs.length;
    v.unbilled = !db().invoices.some(function (i) { return i.buildingId === bId && i.period === period; });
    v.draftInvoices = C.invoicesIn(period, bId).filter(function (i) { return i.status === 'draft'; }).length;
    /* Tiền phòng phát sinh ngoài hóa đơn tháng (đã thu đủ) — cũng là thành phần C của hiệu suất */
    (db().arisingRent || []).filter(function (a) { return a.buildingId === bId && a.period === period && a.paidFull; }).forEach(function (a) {
      add(v, 'rent', a.amount, { kind: 'arising', id: a.id, room: a.roomId, amount: a.amount, text: a.note }, a.roomId);
    });

    /* Cọc */
    (db().deposits || []).filter(function (d) { return d.buildingId === bId && d.period === period && d.status === 'confirmed'; }).forEach(function (d) {
      var k = d.type === 'in' ? 'depIn' : d.type === 'forfeit' ? 'depForfeit' : 'depRefund';
      add(v, k, d.amount, { kind: 'deposit', id: d.id, room: d.roomId, amount: d.amount, text: d.note }, d.roomId);
      if (d.breach) add(v, 'cntBroke', 1, { kind: 'deposit', id: d.id, room: d.roomId, text: d.note }, d.roomId);
    });
    db().contracts.filter(function (c) { return c.buildingId === bId && c.start.slice(0, 7) === period; }).forEach(function (c) {
      add(v, 'cntNew', 1, { kind: 'contract', id: c.id, room: c.roomId, text: 'Bắt đầu ' + TH.fmt.date(c.start) }, c.roomId);
    });
    rooms.forEach(function (r) {
      var st = C.roomStateAt(r, period);
      if (st !== 'occupied') add(v, 'cntVacant', 1, { kind: 'room', id: r.id, room: r.id, text: TH.statusLabel(st) }, r.id);
    });

    /* Chi phí đã duyệt */
    C.expensesIn(period, bId, 'approved').forEach(function (e) {
      var s = { kind: 'expense', id: e.id, amount: e.amount, text: e.description, room: e.roomId };
      if (e.category === 'utility') {
        var el = e.elec !== undefined ? e.elec : Math.round(e.amount * 0.8);
        add(v, 'cElec', el, Object.assign({}, s, { amount: el })); add(v, 'cWater', e.amount - el, Object.assign({}, s, { amount: e.amount - el }));
        return;
      }
      var k = EXP_MAP[e.category] || 'other';
      add(v, k, e.amount, s, k === 'mkt' || k === 'repair' || k === 'equip' || k === 'other' ? (e.roomId || e.description) : null);
    });
    v.pendingExp = sum(db().expenses.filter(function (e) { return e.period === period && e.buildingId === bId && (e.status === 'pending' || e.status === 'draft'); }), function (e) { return e.amount; });
    v.pendingRent = sum(db().expenses.filter(function (e) { return e.period === period && e.buildingId === bId && e.category === 'owner_rent' && e.status !== 'approved'; }), function (e) { return e.amount; });

    /* Chi phí chung phân bổ theo số phòng */
    var pool = db().costPools && db().costPools[period];
    if (pool) {
      var ratio = rooms.length / pool.portfolioRooms;
      Object.keys(POOL_MAP).forEach(function (pk) {
        var a = Math.round((pool.lines[pk] || 0) * ratio);
        add(v, POOL_MAP[pk], a, { kind: 'pool', id: pk, amount: a, text: TH.fmt.money(pool.lines[pk]) + ' × ' + rooms.length + '/' + pool.portfolioRooms + ' phòng' });
      });
      v.pool = pool;
    }

    /* Lương QL tòa (lương HS theo phòng) + lương trưởng nhóm theo phòng — nguồn SAL-01 */
    var mgr = C.staff(b.managerId), pol = db().salaryPolicy;
    if (mgr) {
      var hs = C.perfBuilding(period, bId);
      var pp = C.perfPay(mgr, hs.D, hs.listed, rooms.length, period);
      add(v, 'mgr', pp.pay, { kind: 'payroll', id: mgr.id, amount: pp.pay, text: mgr.name + ' · HS ' + TH.fmt.pct(pp.hs / 100, 1) + ' × ' + rooms.length + ' phòng' });
      var team = db().teams.find(function (t) { return t.id === mgr.team && t.id !== 'BO'; });
      if (team) {
        var lead = rooms.length * pol.leaderPerRoom, leader = C.staff(team.leaderId);
        add(v, 'lead', lead, { kind: 'payroll', id: team.leaderId, amount: lead, text: (leader ? leader.name : '') + ' · ' + rooms.length + ' phòng × ' + TH.fmt.money(pol.leaderPerRoom) });
      }
    }
    return v;
  }

  function merge(list) {
    var v = blank();
    v.buildings = []; v.rooms = 0; v.invoices = 0; v.pendingExp = 0; v.pendingRent = 0; v.draftInvoices = 0; v.unbilledList = [];
    list.forEach(function (x) {
      MONEY_KEYS.concat(COUNT_KEYS).forEach(function (k) {
        v[k] += x[k];
        v.src[k] = v.src[k].concat(x.src[k]);
        x.notes[k].forEach(function (n) { if (v.notes[k].indexOf(n) === -1) v.notes[k].push(n); });
      });
      v.buildings = v.buildings.concat(x.buildings); v.rooms += x.rooms; v.invoices += x.invoices; v.pendingExp += x.pendingExp; v.pendingRent += x.pendingRent; v.draftInvoices += x.draftInvoices;
      if (x.unbilled) v.unbilledList.push(x.b);
      v.pool = v.pool || x.pool;
      v.period = x.period;
    });
    return v;
  }
  function div(a, b) { return b ? a / b : NaN; }
  function finalize(v, mode) {
    v.mode = mode || 'tong';
    if (v.mode === 'kd') { v.depInHidden = v.depIn; v.equipHidden = v.equip; v.depIn = 0; v.equip = 0; }
    v.svc = v.elec + v.water + v.clean + v.net + v.ev + v.lift + v.wash;
    v.total = v.rent + v.svc + v.depIn + v.depForfeit - v.depRefund;
    v.gdv = v.cElec + v.cWater + v.cNet + v.cWaste + v.cEnv + v.cLift;
    v.gv = v.cRent + v.equip + v.gdv;
    v.salary = v.mgr + v.gm + v.opsHead + v.lead + v.source + v.sales + v.cleanStaff + v.acct + v.repairStaff + v.security;
    v.cpbh = v.salary + v.office + v.mkt + v.repair + v.other;
    v.tcp = v.gv + v.cpbh;
    v.lng = v.total - v.gv;
    v.lnr = v.total - v.tcp;
    v.ratios = {
      lnr_dt: div(v.lnr, v.total), lng_dt: div(v.lng, v.total), lnr_gv: div(v.lnr, v.gv), lnr_lng: div(v.lnr, v.lng), cp_lng: div(v.tcp, v.lng),
      gv_dt: div(v.gv, v.total), cpbh_dt: div(v.cpbh, v.total), tcp_dt: div(v.tcp, v.total), luong_cpbh: div(v.salary, v.cpbh),
      hh_cpbh: div(v.mkt, v.cpbh), cpk_cpbh: div(v.other, v.cpbh), dtdv_gdv: div(v.svc, v.gdv), dtn_gtn: div(v.rent, v.cRent),
    };
    return v;
  }

  /**
   * C.pnl(period, scope, mode)
   *   scope: mã tòa | 'ALL' | mảng mã tòa · mode: 'tong' (BÁO CÁO TỔNG — gồm cọc mới & mua sắm) | 'kd' (BÁO CÁO KINH DOANH — loại 2 khoản này)
   */
  C.pnl = function (period, scope, mode) {
    var ids = Array.isArray(scope) ? scope : scope && scope !== 'ALL' ? [scope] : db().buildings.map(function (b) { return b.id; });
    var parts = ids.map(function (id) { return base(period, id); });
    var v = ids.length === 1 && !Array.isArray(scope) ? parts[0] : merge(parts);
    if (ids.length === 1 && !Array.isArray(scope)) v.unbilledList = v.unbilled ? [v.b] : [];
    return finalize(v, mode);
  };
  C.pnlRatio = function (v, k) { return v.ratios[k]; };

  /* Bảng chia cổ phần theo mẫu G1: Vốn = tỷ lệ × tiền thuê nhà kỳ; LN gộp/ròng theo tỷ lệ; Tổng nhận = Vốn + LN ròng */
  C.shareSplit = function (period, bId, v) {
    v = v || C.pnl(period, bId, 'tong');
    var rows = C.sharesFor(bId, period).map(function (s) {
      var r = s.ratio / 100;
      return { share: s, holder: C.shareholder(s.shareholderId), ratio: s.ratio, capital: Math.round(v.cRent * r), lng: Math.round(v.lng * r), lnr: Math.round(v.lnr * r), total: Math.round(v.cRent * r + v.lnr * r) };
    });
    return { rows: rows, ratio: sum(rows, function (r) { return r.ratio; }), capital: sum(rows, function (r) { return r.capital; }), lng: sum(rows, function (r) { return r.lng; }), lnr: sum(rows, function (r) { return r.lnr; }), total: sum(rows, function (r) { return r.total; }), lnr_gv: v.ratios.lnr_gv, cp_lng: v.ratios.cp_lng };
  };
})();
