/* CR-RPT-01 — Báo cáo theo mẫu khách: RPT-04 (doanh thu theo tòa, mẫu G1) · RPT-05 (báo cáo kinh doanh tháng). Số liệu: js/pnl.js. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;
  var COMPACT = ['total', 'depIn', 'depRefund', 'rent', 'svc', 'cRent', 'gv', 'cpbh', 'tcp', 'lng', 'lnr'];
  var COMPACT_RATIOS = ['lnr_dt', 'lng_dt', 'gv_dt', 'cpbh_dt'];
  var POOL_LABEL = { gm: 'Lương quản lý tổng', opsHead: 'Lương trưởng phòng vận hành', source: 'Lương nhân viên nguồn', sales: 'Lương NVKD', acct: 'Lương kế toán', repairStaff: 'Lương sửa chữa', security: 'Lương bảo vệ', office: 'Thuê và DV văn phòng', marketing: 'Marketing chung' };
  var DERIVED = ['total', 'svc', 'gv', 'cpbh', 'tcp', 'lng', 'lnr'];

  function prevP(p, n) { var i = TH.PERIODS.indexOf(p) - (n || 1); return i >= 0 ? TH.PERIODS[i] : null; }
  function periods6(p) { var i = TH.PERIODS.indexOf(p); return TH.PERIODS.slice(Math.max(0, i - 5), i + 1); }
  function mm(p) { return String(+p.slice(5)) + '/' + p.slice(0, 4); }
  function num(x) { return F.money(x).replace(/\s₫$/, ''); }
  function cellVal(line, x) {
    if (line.count) return x ? '<span class="tnum">' + x + '</span>' : '<span class="muted">0</span>';
    if (!x) return '<span class="muted">0</span>';
    return '<span class="tnum' + (x < 0 ? ' neg' : '') + '">' + num(x) + '</span>';
  }
  function ratioVal(r, x) {
    if (isNaN(x) || !isFinite(x)) return '<span class="muted">—</span>';
    return '<span class="tnum' + (x < 0 ? ' neg' : '') + '">' + (r.times ? x.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' lần' : F.pct(x, 1)) + '</span>';
  }
  function delta(cur, prev) {
    if (prev === undefined || prev === null) return '<span class="muted small">—</span>';
    var d = cur - prev;
    if (Math.abs(d) < 1) return '<span class="muted small">0</span>';
    return '<span class="small ' + (d > 0 ? 'pos' : 'neg') + '">' + (d > 0 ? '+' : '−') + num(Math.abs(d)) + '</span>';
  }
  function lockTip(incId) { var inc = TH.inc(incId), p = TH.PACKAGES[inc.tier]; return 'Có từ ' + p.name + ' · ' + p.price + ' — ' + inc.fid + ': ' + inc.text; }
  function lineTags(line) {
    return (line.alloc ? ' <span class="rpt-tag" data-tip="Chi phí chung toàn công ty phân bổ theo số phòng (bảng phân bổ kỳ)">PB</span>' : '') +
      (line.payroll ? ' <span class="rpt-tag" data-tip="Tính từ công thức lương HS / trưởng nhóm (SAL-01)">SAL</span>' : '') +
      (line.split ? ' <span class="rpt-tag" data-tip="Phí dịch vụ chung chia đều 3 dòng vệ sinh / thang máy / máy giặt như sổ của khách">÷3</span>' : '');
  }
  function scopeIds() { var s = TH.scope(); return TH.db.buildings.filter(function (b) { return TH.inScope(b.id) && (s === 'ALL' || b.id === s); }).map(function (b) { return b.id; }); }
  function periodSelect(id) {
    var s = TH.store.state;
    return '<label class="sr-only" for="' + id + '">Kỳ</label><select id="' + id + '" class="select select-sm u-w-auto" data-global="period">' + TH.PERIODS.slice().reverse().map(function (p) { return '<option value="' + p + '"' + (p === s.period ? ' selected' : '') + '>Kỳ ' + F.period(p) + '</option>'; }).join('') + '</select>';
  }
  function templateBadge(text) { return '<span class="badge badge-teal" data-tip="Bố cục và tên dòng giữ đúng file mẫu khách gửi ngày 20/10/2026">' + I('sheet', 'ic-sm') + esc(text) + '</span>'; }
  function crBadge() { return '<span class="badge badge-info" data-tip="' + esc(TH.CR_RPT.id + ' · ' + TH.CR_RPT.title + ' (' + F.date(TH.CR_RPT.date) + '). Xem Decision log §6.') + '">' + esc(TH.CR_RPT.id) + '</span>'; }

  /* Cảnh báo dữ liệu chưa đủ của kỳ */
  function dataAlerts(v, p) {
    var items = [];
    if (v.unbilledList && v.unbilledList.length) items.push('<b>' + v.unbilledList.map(function (b) { return esc(b.short); }).join(', ') + '</b> chưa lập hóa đơn kỳ — doanh thu tiền phòng/dịch vụ đang là 0. <a href="' + TH.router.href('INV-01') + '">Lập hóa đơn (INV-01)</a>');
    if (v.pendingExp) items.push(F.money(v.pendingExp) + ' chi phí chờ duyệt/nháp chưa tính' + (v.pendingRent ? (v.accrued ? ' (tiền thuê nhà đã tính DỰ KIẾN ' + F.money(v.accrued) + ' theo HĐ — R-07)' : ' (gồm tiền thuê nhà ' + F.money(v.pendingRent) + ')') : '') + '. <a href="' + TH.router.href('EXP-01') + '">Duyệt chi (EXP-01)</a>');
    if (v.pool && v.pool.status === 'draft') items.push('Bảng phân bổ chi phí chung kỳ ' + F.period(p) + ' đang <b>nháp</b>.');
    if (!items.length) return '';
    var pp = prevP(p);
    return '<div class="alert alert-warning u-mb-16">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Số liệu kỳ ' + F.period(p) + ' chưa đủ để chốt</b><ul class="rpt-alert-list">' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      (pp && TH.periodLocked(pp) ? '<div class="u-mt-8"><button type="button" class="btn btn-sm" data-act="rptx.period" data-p="' + pp + '">' + I('history', 'ic-sm') + 'Xem kỳ ' + F.period(pp) + ' (đã khóa)</button></div>' : '') + '</div></div>';
  }
  TH.act['rptx.period'] = function (el) { TH.store.set('period', el.dataset.p); TH.app.refresh(); };

  /* Bản chốt P&L theo kỳ duyệt (C) — tạo lúc duyệt kỳ; kỳ đã duyệt từ trước được tạo lười */
  TH.pnlSnapshotCreate = function (p) {
    var db = TH.db, data = {};
    db.pnlSnaps = db.pnlSnaps || {};
    db.buildings.forEach(function (b) {
      var v = C.pnl(p, b.id, 'tong'), o = {};
      TH.PNL_LINES.forEach(function (l) { if (l.k) o[l.k] = v[l.k]; });
      data[b.id] = o;
    });
    db.pnlSnaps[p] = { at: (db.periodApprovals[p] || {}).at || TH.TODAY, data: data };
    return db.pnlSnaps[p];
  };
  function snapOf(p) {
    var db = TH.db; db.pnlSnaps = db.pnlSnaps || {};
    if (!db.pnlSnaps[p] && db.periodApprovals[p]) TH.pnlSnapshotCreate(p);
    return db.pnlSnaps[p] || null;
  }

  /* Bảng chỉ tiêu dùng chung: cols [{ label, num, gate, cell(line) }] */
  function stmt(o) {
    var show = TH.store.state.showLocked;
    var cols = o.cols.filter(function (c) { return !c.gate || TH.has(c.gate) || show; });
    var head = '<th scope="col" class="rpt-label">' + esc(o.firstLabel || 'Chỉ tiêu') + '</th>' + cols.map(function (c) {
      var locked = c.gate && !TH.has(c.gate);
      var cls = (c.num ? 'num ' : '') + (locked ? 'is-ghost ' : '') + (c.cls || '');
      var lbl = locked ? '<button type="button" class="gate-mini th-lock" data-locked="' + c.gate + '" data-tip="' + esc(lockTip(c.gate)) + '">' + I('lock', 'ic-sm') + esc(c.label) + ' ' + TH.tierPill(TH.tierOf(c.gate)) + '</button>'
        : (c.labelHtml || esc(c.label)) + (c.gate ? TH.up(c.gate) : '');
      return '<th scope="col" class="' + cls + '">' + lbl + '</th>';
    }).join('');
    var n = cols.length + 1, body = '';
    o.lines.forEach(function (line) {
      if (line.sec) { body += '<tr class="rpt-sec"><th colspan="' + n + '" scope="rowgroup">' + esc(line.sec) + '</th></tr>'; return; }
      if (line.grp) { body += '<tr class="rpt-grp"><td colspan="' + n + '">' + esc(line.grp) + '</td></tr>'; return; }
      var attrs = o.rowAttrs ? o.rowAttrs(line) : '';
      var cls = (line.strong ? 'rpt-strong ' : '') + (line.result ? 'rpt-result ' : '') + (line.ratio ? 'rpt-ratio ' : '');
      var hint = o.hint ? o.hint(line) : line.hint;
      body += '<tr class="' + cls + '" ' + attrs + '><th scope="row" class="rpt-label' + (line.indent ? ' rpt-ind' : '') + '">' + esc(o.labelOf ? o.labelOf(line) : line.label) + (hint ? ' <span class="rpt-hint" data-tip="' + esc(hint) + '" tabindex="0">' + I('info', 'ic-sm') + '</span>' : '') + lineTags(line) + '</th>' +
        cols.map(function (c) {
          var locked = c.gate && !TH.has(c.gate);
          return '<td class="' + (c.num ? 'num ' : '') + (locked ? 'is-ghost ' : '') + (c.tdCls || '') + '">' + (locked ? '<span class="ghost-bar" aria-hidden="true"></span>' : c.cell(line)) + '</td>';
        }).join('') + '</tr>';
    });
    return '<div class="table-wrap"><table class="table table-compact rpt-table' + (o.matrix ? ' rpt-matrix' : '') + '" aria-label="' + esc(o.label) + '"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }
  function ratioLines(keys) {
    return [{ sec: 'Tỷ lệ' }].concat(TH.PNL_RATIOS.filter(function (r) { return !keys || keys.indexOf(r.k) > -1; }).map(function (r) { return Object.assign({ ratio: true }, r); }));
  }

  /* =========================================================
     RPT-04 — Báo cáo doanh thu theo tòa (mẫu G1)
     ========================================================= */
  function rpt4Building() {
    var opts = TH.buildingOptions(false), cur = TH.store.ui('RPT-04', 'b', null);
    if (!cur || !opts.some(function (o) { return o.id === cur; })) cur = TH.scope() !== 'ALL' && opts.some(function (o) { return o.id === TH.scope(); }) ? TH.scope() : (opts[0] && opts[0].id);
    return { cur: cur, opts: opts };
  }
  /* CR-RPT-02: RPT-04 mở luồng "Báo cáo theo mẫu Excel" (form tạo điền sẵn tòa/kỳ, không tự tạo báo cáo). Các thẻ phân tích theo gói
     (phân bổ chung, đối chiếu dòng tiền, snapshot duyệt kỳ, 3 kỳ lịch sử, khóa kỳ) hiển thị trong màn xem trước qua TH.rptExtras.rpt4. */
  function lockCard(p) {
    return TH.gate('F048.D', '<div class="row" style="gap:8px;align-items:center">' + (TH.periodLocked(p) ? TH.badge('Đã chốt phiên bản kỳ ' + F.period(p), 'neutral', { icon: 'lock' }) : TH.permBtn('report.all', '<button type="button" class="btn btn-sm" data-act="rpt.lock">' + I('lock', 'ic-sm') + 'Khóa kỳ & chốt' + TH.up('F048.D') + '</button>', 'Khóa kỳ · 403')) + '<span class="small muted">Tạo báo cáo không tự khóa kỳ.</span></div>', { mode: 'btn', label: 'Khóa kỳ & chốt phiên bản' });
  }
  function rpt4Extras(p, bId) {
    var b = C.building(bId), v = C.pnl(p, bId, 'tong');
    var p1 = prevP(p), p2 = prevP(p, 2), v1 = p1 ? C.pnl(p1, bId, 'tong') : null, v2 = p2 ? C.pnl(p2, bId, 'tong') : null;
    var snap = TH.has('F045.C') ? snapOf(p) : null, sn = snap && snap.data[bId];
    var KEYS = ['total', 'rent', 'svc', 'gv', 'cpbh', 'lng', 'lnr'];
    var hist = '<div class="card card-flush">' + TH.cardHd(I('history', 'ic-sm') + 'Bản chốt duyệt kỳ & lịch sử ' + esc(b.short)) + stmt({ label: 'So sánh kỳ ' + b.short, firstLabel: 'Chỉ tiêu', lines: TH.PNL_LINES.filter(function (l) { return KEYS.indexOf(l.k) > -1; }), cols: [
      { label: 'Hiện tại', num: true, cell: function (l) { return cellVal(l, v[l.k]); } },
      { label: 'Bản chốt duyệt kỳ', num: true, gate: 'F045.C', cell: function (l) { return sn ? '<div class="tnum small">' + num(sn[l.k]) + '</div>' + delta(v[l.k], sn[l.k]) : '<span class="muted small">Chưa duyệt kỳ</span>'; } },
      { label: 'Tháng ' + (p1 ? mm(p1) : '—'), num: true, gate: 'F045.D', cell: function (l) { return v1 ? cellVal(l, v1[l.k]) : '<span class="muted">—</span>'; } },
      { label: 'Tháng ' + (p2 ? mm(p2) : '—'), num: true, gate: 'F045.D', cell: function (l) { return v2 ? cellVal(l, v2[l.k]) : '<span class="muted">—</span>'; } },
    ] }) + '</div>';
    var pool = v.pool, poolCard = '';
    if (pool) {
      var ratio = v.rooms / pool.portfolioRooms;
      poolCard = '<div class="card">' + TH.cardHd(I('split', 'ic-sm') + 'Chi phí chung phân bổ', v.rooms + '/' + pool.portfolioRooms + ' phòng toàn công ty · ' + F.pct(ratio, 2), TH.badge(pool.status === 'approved' ? 'Kế toán đã nhập' : 'Nháp', pool.status === 'approved' ? 'success' : 'draft', { dot: true })) + '<div class="card-bd">' +
        TH.table({ compact: true, label: 'Chi phí chung', cols: [{ key: 'l', label: 'Khoản' }, { key: 'a', label: 'Toàn công ty', num: true, render: function (r) { return num(r.a); } }, { key: 'b', label: 'Phân bổ ' + esc(b.short), num: true, render: function (r) { return '<b>' + num(Math.round(r.a * ratio)) + '</b>'; } }],
          rows: Object.keys(POOL_LABEL).map(function (k) { return { l: POOL_LABEL[k], a: pool.lines[k] || 0 }; }) }) +
        '<div class="row u-mt-12 u-gap-8">' + (TH.periodLocked(p) ? TH.badge('Kỳ đã khóa', 'neutral', { icon: 'lock' }) : TH.permBtn('report.all', '<button type="button" class="btn btn-sm" data-act="rpt4.pool">' + I('edit', 'ic-sm') + 'Sửa bảng phân bổ kỳ</button>', 'Sửa bảng phân bổ · 403')) + '<span class="small muted">Sửa xong bấm Tính lại preview.</span></div>' +
        TH.gate('F043.C', '<div class="rpt-rule">' + I('checkCircle', 'ic-sm') + '<div><b>Rule PB-01 v1 · theo số phòng' + TH.up('F043.C') + '</b><div class="small muted">Lương quản lý tòa và trưởng nhóm tự kéo từ bảng lương kỳ ' + F.period(p) + ' (' + esc(TH.statusLabel((TH.db.payrollStatus[p] || { status: 'draft' }).status)) + ').</div></div></div>', { label: 'Chi phí chung theo rule, kéo từ lương đã duyệt', lines: 2 }) +
        '</div></div>';
    }
    var sm = C.summary(p, bId);
    var cash = TH.gate('F048.B', '<div class="card">' + TH.cardHd(I('wallet', 'ic-sm') + 'Đối chiếu dòng tiền' + TH.up('F048.B'), 'Doanh thu theo mẫu ≠ tiền đã thu') + '<div class="card-bd">' +
      TH.kv([['Tổng doanh thu (mẫu)', '<b class="tnum">' + F.money(v.total) + '</b>'], ['Doanh thu hóa đơn kỳ', '<span class="tnum">' + F.money(v.rent + v.svc) + '</span>'], ['Đã thu cho hóa đơn kỳ', '<span class="tnum">' + F.money(sm.collectedForPeriod) + '</span>'], ['Còn nợ hóa đơn kỳ', '<span class="tnum ' + (sm.debtPeriod ? 'neg' : '') + '">' + F.money(sm.debtPeriod) + '</span>'], ['Thu thực trong kỳ (gồm nợ cũ)', '<span class="tnum">' + F.money(sm.collected) + '</span>'], ['Cọc ròng (mới + bỏ − hoàn)', '<span class="tnum">' + F.money(v.depIn + v.depForfeit - v.depRefund) + '</span>']]) +
      '</div></div>', { label: 'Phân tách doanh thu thuộc kỳ và dòng tiền', lines: 4 });
    return '<div class="u-mb-12">' + lockCard(p) + '</div><div class="u-mb-16">' + hist + '</div><div class="grid-2 rpt-grid u-mb-16">' + (poolCard || '<div></div>') + cash + '</div>';
  }
  TH.views['RPT-04'] = {
    render: function () {
      var sel = rpt4Building();
      if (!sel.cur) return TH.state('empty', { title: 'Không có tòa trong phạm vi', text: 'Vai trò hiện tại chưa được gán tòa nào.' });
      return TH.pageHeader({ screen: 'RPT-04', status: TH.periodBadge(TH.store.state.period) + templateBadge('Mẫu G1 · T8/2026') + crBadge(), desc: 'Mẫu <b>“BÁO CÁO KINH DOANH G1 THÁNG 8/2026”</b>: tạo bản báo cáo theo tòa qua luồng xem trước → xác nhận; xem lại và tải Excel từ bản đã tạo.' }) +
        TH.reportLegacy('RPT-04', { b: sel.cur });
    },
    dialogs: [function () { return drill4Render('T17', TH.CURRENT_PERIOD, 'rent'); }, function () { return poolRender(TH.CURRENT_PERIOD); }],
  };

  var KIND = { invoice: ['Hóa đơn', 'teal'], arising: ['Tiền phòng phát sinh', 'teal'], deposit: ['Cọc', 'info'], expense: ['Chi phí', 'warning'], pool: ['Phân bổ', 'neutral'], payroll: ['Lương', 'draft'], contract: ['Hợp đồng', 'teal'], room: ['Phòng', 'neutral'], break: ['Phá HĐ', 'danger'] };
  function srcLink(s) {
    if (s.kind === 'invoice') return '<a href="' + TH.router.href('INV-03', s.id) + '" data-close>' + esc(s.id) + '</a>';
    if (s.kind === 'contract') return '<a href="' + TH.router.href('CON-02', s.id) + '" data-close>' + esc(s.id) + '</a>';
    if (s.kind === 'room') return '<a href="' + TH.router.href('ROOM-02', s.id) + '" data-close>' + esc(s.id) + '</a>';
    if (s.kind === 'expense') return '<a href="' + TH.router.href('EXP-01') + '" data-close>' + esc(s.id) + '</a>';
    if (s.kind === 'payroll') return '<a href="' + TH.router.href('SAL-01') + '" data-close>' + esc(s.id) + '</a>';
    if (s.kind === 'pool') return esc(POOL_LABEL[s.id] || s.id);
    return esc(s.id);
  }
  function drill4Render(bId, p, k) {
    var v = C.pnl(p, bId, 'tong'), line = TH.PNL_LINES.find(function (l) { return l.k === k; }) || { label: k };
    var src = v.src[k] || [];
    return {
      title: I('sheet') + ' ' + esc(line.label) + TH.up('F045.B'),
      sub: esc(C.building(bId).name) + ' · kỳ ' + F.period(p) + ' · ' + (line.count ? v[k] + ' phòng' : F.money(v[k])),
      body: TH.gate('F045.B', TH.table({ compact: true, label: 'Nguồn ' + line.label, cols: [
        { key: 'k', label: 'Loại', render: function (s) { var m = KIND[s.kind] || [s.kind, 'neutral']; return TH.badge(m[0], m[1]); } },
        { key: 'id', label: 'Chứng từ', render: srcLink },
        { key: 'r', label: 'Phòng', render: function (s) { return s.room ? esc(s.room) : '<span class="muted">—</span>'; } },
        { key: 't', label: 'Diễn giải', render: function (s) { return '<span class="small">' + esc(s.text || '') + '</span>'; } },
        { kind: 'money', key: 'a', label: 'Số tiền', num: true, render: function (s) { return s.amount !== undefined ? F.money(s.amount) : '<span class="muted">—</span>'; } },
      ], rows: src, empty: { title: 'Không có chứng từ', text: 'Dòng này bằng 0 trong kỳ đang xem.' } }), { label: 'Drill-down từng dòng về chứng từ nguồn' }),
      foot: '<span class="small muted">' + src.length + ' bản ghi nguồn</span><span class="spacer"></span><button type="button" class="btn" data-close>Đóng</button>',
    };
  }
  TH.act['rpt4.drill'] = function (el) {
    if (!TH.has('F045.B')) return;
    var p = TH.store.state.period, bId = rpt4Building().cur, k = el.dataset.k;
    TH.modal.open({ key: 'rpt4drill', size: 'lg', render: function () { return drill4Render(bId, p, k); } });
  };

  function poolRender(p) {
    var pool = TH.db.costPools[p], form = 'pool-' + p;
    return {
      title: I('split') + ' Bảng phân bổ chi phí chung · kỳ ' + F.period(p),
      sub: 'Tổng toàn công ty (' + pool.portfolioRooms + ' phòng). Hệ thống chia về từng tòa theo số phòng.',
      body: '<div class="form-grid">' + Object.keys(POOL_LABEL).map(function (k) { return TH.field({ form: form, name: k, label: POOL_LABEL[k] + ' (đ/kỳ)', def: String(pool.lines[k] || 0), num: true, inputmode: 'numeric' }); }).join('') + '</div>' +
        '<p class="small muted u-mt-12">Gói A: nhập tay theo kỳ. Gói C: lương kéo từ bảng lương đã duyệt theo quy tắc phân bổ có phiên bản.</p>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><span class="spacer"></span><button type="button" class="btn btn-primary" data-act="rpt4.poolSave" data-p="' + p + '">' + I('check', 'ic-sm') + 'Lưu bảng phân bổ</button>',
    };
  }
  TH.act['rpt4.pool'] = function () {
    if (!TH.can('report.all')) return;
    var p = TH.store.state.period;
    TH.modal.open({ key: 'rpt4pool', size: 'md', render: function () { return poolRender(p); } });
  };
  TH.act['rpt4.poolSave'] = function (el) {
    var p = el.dataset.p, pool = TH.db.costPools[p], form = 'pool-' + p;
    Object.keys(POOL_LABEL).forEach(function (k) { var x = +String(TH.store.draft(form, k, pool.lines[k] || 0)).replace(/\D/g, ''); if (!isNaN(x)) pool.lines[k] = x; });
    pool.enteredBy = TH.me().id; pool.enteredAt = TH.TODAY;
    TH.store.clearDraft(form);
    TH.log('Sửa bảng phân bổ chi phí chung', 'Kỳ ' + F.period(p), 'Nhập tay theo kỳ', 'report');
    TH.modal.close('rpt4pool', { silent: true });
    TH.store.persist(); TH.app.refresh();
    TH.toast('Đã lưu bảng phân bổ', 'Báo cáo RPT-04/RPT-05 đã tính lại.');
  };

  function statementRows(v, extraCols) {
    var rows = [];
    TH.PNL_LINES.forEach(function (l) {
      if (l.sec) { rows.push({ c: [l.sec.toUpperCase()], bold: true }); return; }
      if (l.grp) { rows.push({ c: ['', l.grp], bold: true }); return; }
      var lab = l.indent ? ['', l.label] : [l.label, ''];
      rows.push({ c: lab.concat([v[l.k]]).concat(extraCols ? extraCols(l) : []), bold: l.strong });
    });
    rows.push({ c: [] });
    TH.PNL_RATIOS.forEach(function (r) { var x = v.ratios[r.k]; rows.push({ c: [r.label, '', isFinite(x) ? Math.round(x * 10000) / 10000 : null], pct: !r.times }); });
    return rows;
  }
  TH.act['rpt4.xlsx'] = function () {
    var p = TH.store.state.period, bId = rpt4Building().cur, b = C.building(bId), v = C.pnl(p, bId, 'tong'), share = C.shareSplit(p, bId, v);
    var srcRows = [];
    TH.PNL_LINES.forEach(function (l) { if (!l.k || DERIVED.indexOf(l.k) > -1) return; (v.src[l.k] || []).forEach(function (s) { srcRows.push([l.label, (KIND[s.kind] || [s.kind])[0], s.id, s.room || '', s.text || '', s.amount !== undefined ? s.amount : null]); }); });
    var fname = 'TIMEHOUSE_RPT-04_' + b.id + '_ky_' + p;
    TH.exportXlsx(fname, [
      { name: 'BAO CAO THANG ' + +p.slice(5), title: 'BÁO CÁO KINH DOANH ' + b.short.toUpperCase() + ' THÁNG ' + mm(p), note: 'DRAFT · dữ liệu minh họa · bố cục theo mẫu G1 (docs/G1.31.8.26.xlsx) · ' + TH.CR_RPT.id,
        columns: [{ label: 'Chỉ tiêu', width: 30 }, { label: '', width: 34 }, { label: 'Số tiền (đ)', type: 'money', width: 18 }, { label: 'Ghi chú', width: 30 }],
        rows: statementRows(v, function (l) { return [(v.notes[l.k] || []).join(', ')]; }) },
      { name: 'CHIA CO PHAN', title: 'BẢNG CHIA CỔ PHẦN ' + b.short.toUpperCase() + ' · kỳ ' + F.period(p), note: 'Công thức tái hiện mẫu G1 (R-08): Vốn = tỷ lệ × tiền thuê nhà kỳ; Tổng nhận = Vốn + LN ròng — không phải lệnh chi/hoàn vốn · D-07 chưa chốt',
        columns: [{ label: 'Cổ đông', width: 30 }, { label: 'Tỷ lệ %', type: 'number', width: 10 }, { label: 'Vốn', type: 'money' }, { label: 'LN gộp', type: 'money' }, { label: 'LN ròng', type: 'money' }, { label: 'Tổng nhận', type: 'money' }],
        rows: share.rows.map(function (r) { return [r.holder.name, r.ratio, r.capital, r.lng, r.lnr, r.total]; }), totals: ['Tổng', share.ratio, share.capital, share.lng, share.lnr, share.total] },
      { name: 'NGUON SO LIEU', title: 'Nguồn từng dòng · ' + b.name + ' · kỳ ' + F.period(p), columns: [{ label: 'Dòng báo cáo', width: 30 }, { label: 'Loại', width: 12 }, { label: 'Chứng từ', width: 20 }, { label: 'Phòng', width: 10 }, { label: 'Diễn giải', width: 40 }, { label: 'Số tiền', type: 'money' }], rows: srcRows },
    ]);
    TH.toast('Đã xuất Excel theo mẫu G1', fname + '.xlsx · 3 sheet');
  };
  TH.act['rpt4.print'] = function () {
    var p = TH.store.state.period, bId = rpt4Building().cur, b = C.building(bId), v = C.pnl(p, bId, 'tong');
    TH.printDoc('<div class="print-doc"><div class="pd-head"><div><h1>BÁO CÁO KINH DOANH ' + esc(b.short.toUpperCase()) + ' THÁNG ' + mm(p) + '</h1><div>' + esc(b.name) + ' · theo mẫu G1</div></div><div><span class="pd-stamp">DESIGN DRAFT · DỮ LIỆU MINH HỌA</span></div></div>' +
      '<table><tbody>' + TH.PNL_LINES.map(function (l) {
        if (l.sec) return '<tr><td colspan="3"><b>' + esc(l.sec.toUpperCase()) + '</b></td></tr>';
        if (l.grp) return '<tr><td colspan="3"><i>' + esc(l.grp) + '</i></td></tr>';
        var t = (l.indent ? '&nbsp;&nbsp;&nbsp;' : '') + esc(l.label);
        return '<tr><td>' + (l.strong ? '<b>' + t + '</b>' : t) + '</td><td class="num">' + (l.count ? v[l.k] : num(v[l.k])) + '</td><td>' + esc((v.notes[l.k] || []).join(', ')) + '</td></tr>';
      }).join('') + TH.PNL_RATIOS.map(function (r) { var x = v.ratios[r.k]; return '<tr><td>' + esc(r.label) + '</td><td class="num">' + (isFinite(x) ? (r.times ? x.toFixed(2) : F.pct(x, 1)) : '—') + '</td><td></td></tr>'; }).join('') + '</tbody></table></div>');
  };

  /* =========================================================
     RPT-05 — Báo cáo kinh doanh tháng (mẫu tổng hợp)
     ========================================================= */
  function rpt5Entities(ids, byGroup) {
    if (byGroup) return TH.db.buildingGroups.map(function (g) { var m = g.buildings.filter(function (x) { return ids.indexOf(x) > -1; }); return { id: g.id, label: g.short, sub: g.name, ids: m }; }).filter(function (e) { return e.ids.length; });
    return ids.map(function (id) { var b = C.building(id); return { id: id, label: b.short, sub: b.name, ids: [id], building: true }; });
  }
  /* CR-RPT-02: RPT-05 mở luồng "Báo cáo theo mẫu Excel"; xu hướng 6 kỳ, biên lợi nhuận, so kỳ trước, khóa kỳ hiển thị trong màn xem trước (TH.rptExtras.rpt5). */
  function rpt5Extras(p, ids) {
    var mode = 'kd', pp = prevP(p), tot = C.pnl(p, ids, mode), totPrev = pp ? C.pnl(pp, ids, mode) : null;
    var trendPs = periods6(p);
    var trend = TH.gate('F046.B', '<div class="card">' + TH.cardHd(I('trend', 'ic-sm') + 'Xu hướng 6 kỳ' + TH.up('F046.B'), 'Doanh thu, LNG, LNR · chế độ kinh doanh') + '<div class="card-bd">' +
      TH.chart.lines({ label: 'Xu hướng doanh thu, lợi nhuận gộp, lợi nhuận ròng', categories: trendPs.map(F.period), series: [
        { label: 'Tổng doanh thu', values: trendPs.map(function (x) { return C.pnl(x, ids, mode).total; }) },
        { label: 'LNG', values: trendPs.map(function (x) { return C.pnl(x, ids, mode).lng; }), color: 'var(--chart-3)' },
        { label: 'LNR', values: trendPs.map(function (x) { return C.pnl(x, ids, mode).lnr; }), color: 'var(--chart-2)' },
      ] }) + '</div></div>', { label: 'Biểu đồ xu hướng 3–6 tháng', lines: 5 });
    var warnRows = rpt5Entities(ids, false).map(function (e) { var v = C.pnl(p, e.ids, mode); return { e: e, v: v, r: v.ratios.lnr_dt }; });
    var warn = TH.gate('F046.C', '<div class="card card-flush">' + TH.cardHd(I('alert', 'ic-sm') + 'Biên lợi nhuận theo tòa' + TH.up('F046.C'), 'LNR/DT < 10% cảnh báo · so kỳ ' + (pp ? F.period(pp) : '—') + ': LNR ' + (totPrev ? F.money(totPrev.lnr) + ' → ' + F.money(tot.lnr) : '—')) +
      TH.table({ compact: true, label: 'Biên lợi nhuận', cols: [
        { key: 'n', label: 'Tòa', render: function (x) { return '<span class="cell-main">' + esc(x.e.label) + '</span>'; } },
        { key: 'd', label: 'Doanh thu', num: true, render: function (x) { return num(x.v.total); } },
        { key: 'l', label: 'LNR', num: true, render: function (x) { return '<span class="' + (x.v.lnr < 0 ? 'neg' : '') + '">' + num(x.v.lnr) + '</span>'; } },
        { key: 'r', label: 'LNR/DT', num: true, render: function (x) { return isFinite(x.r) ? ratioVal({}, x.r) : '<span class="muted">Không áp dụng</span>'; } },
        { key: 's', label: 'Đánh giá', render: function (x) { return !isFinite(x.r) ? TH.badge('Chưa có doanh thu', 'neutral') : x.r < 0 ? TH.badge('Lỗ', 'danger', { icon: 'alert' }) : x.r < 0.1 ? TH.badge('Biên thấp', 'warning', { icon: 'alert' }) : TH.badge('Đạt', 'success', { icon: 'check' }); } },
      ], rows: warnRows }) + '</div>', { label: 'Cảnh báo biên lợi nhuận, so kỳ trước', lines: 4 });
    return '<div class="u-mb-12">' + lockCard(p) + '</div><div class="grid-2 u-mb-16">' + trend + warn + '</div>';
  }
  TH.rptExtras = { rpt4: rpt4Extras, rpt5: rpt5Extras };
  TH.views['RPT-05'] = {
    render: function () {
      if (!scopeIds().length) return TH.state('empty', { title: 'Không có tòa trong phạm vi', text: 'Đổi scope tòa trên thanh trên cùng.' });
      return TH.pageHeader({ screen: 'RPT-05', status: TH.periodBadge(TH.store.state.period) + templateBadge('Mẫu BCKD · T8/2026') + crBadge(), desc: 'Mẫu <b>“BÁO CÁO KINH DOANH THÁNG 8”</b>: chọn các tòa → xem trước các sheet Kinh doanh, Tổng và từng nhóm nhà → xác nhận tạo một bản tổng hợp.' }) +
        TH.reportLegacy('RPT-05', {});
    },
  };
  TH.act['rpt5.open'] = function (el) { TH.store.setUi('RPT-04', 'b', el.dataset.b); TH.store.setUi('REPORTS', 'legacy', null); TH.go('RPT-04'); };

  function matrixSheet(name, title, p, ids, mode, ents) {
    var tot = C.pnl(p, ids, mode), vs = ents.map(function (x) { return C.pnl(p, x.ids, mode); });
    var rows = [];
    TH.PNL_LINES.forEach(function (l) {
      if (l.sec) { rows.push({ c: [l.sec.toUpperCase()], bold: true }); return; }
      if (l.grp) { rows.push({ c: ['', l.grp], bold: true }); return; }
      var lb = mode === 'kd' && l.labelKd ? l.labelKd : l.label;
      rows.push({ c: (l.indent ? ['', lb] : [lb, '']).concat([tot[l.k]]).concat(vs.map(function (v) { return v[l.k]; })), bold: l.strong });
    });
    rows.push({ c: [] });
    TH.PNL_RATIOS.forEach(function (r) {
      var f = function (v) { var x = v.ratios[r.k]; return isFinite(x) ? Math.round(x * 10000) / 10000 : null; };
      rows.push({ c: [r.label, '', f(tot)].concat(vs.map(f)), pct: !r.times });
    });
    return { name: name, title: title, note: 'DRAFT · dữ liệu minh họa · bố cục theo “BÁO CÁO KINH DOANH THÁNG 8” · ' + (mode === 'kd' ? 'P&L đề xuất: loại cọc mới/hoàn cọc/mua sắm, tiền thuê chủ nhà theo HĐ (R-01/R-07)' : 'chế độ quản trị theo mẫu (gồm dòng tiền cọc, mua sắm)') + ' · ' + TH.CR_RPT.id,
      columns: [{ label: 'Chỉ tiêu', width: 28 }, { label: '', width: 34 }, { label: 'TỔNG', type: 'money', width: 18 }].concat(ents.map(function (e) { return { label: e.label, type: 'money', width: 16 }; })), rows: rows };
  }
  TH.act['rpt5.xlsx'] = function () {
    var p = TH.store.state.period, ids = scopeIds(), m = +p.slice(5), ents = rpt5Entities(ids, false);
    var sheets = [
      matrixSheet('BAO CAO KINH DOANH T' + m, 'BÁO CÁO KINH DOANH THÁNG ' + mm(p), p, ids, 'kd', ents),
      matrixSheet('BAO CAO TONG T' + m, 'BÁO CÁO TỔNG THÁNG ' + mm(p), p, ids, 'tong', ents),
    ];
    TH.db.buildingGroups.forEach(function (g) {
      var gi = g.buildings.filter(function (x) { return ids.indexOf(x) > -1; });
      if (gi.length) sheets.push(matrixSheet('BC DT T' + m + ' ' + g.short.toUpperCase(), 'BÁO CÁO DOANH THU THÁNG ' + mm(p) + ' · ' + g.name.toUpperCase(), p, gi, 'tong', rpt5Entities(gi, false)));
    });
    var fname = 'TIMEHOUSE_RPT-05_ky_' + p;
    TH.exportXlsx(fname, sheets);
    TH.toast('Đã xuất Excel theo mẫu', fname + '.xlsx · ' + sheets.length + ' sheet (kinh doanh, tổng, theo nhóm nhà)');
  };
  TH.act['rpt5.print'] = function () {
    var p = TH.store.state.period, ids = scopeIds(), mode = TH.store.ui('RPT-05', 'mode', 'kd') === 'tong' ? 'tong' : 'kd', ents = rpt5Entities(ids, false);
    var tot = C.pnl(p, ids, mode), vs = ents.map(function (x) { return C.pnl(p, x.ids, mode); });
    TH.printDoc('<div class="print-doc"><div class="pd-head"><div><h1>' + (mode === 'kd' ? 'BÁO CÁO KINH DOANH' : 'BÁO CÁO TỔNG') + ' THÁNG ' + mm(p) + '</h1><div>' + esc(TH.scopeLabel()) + '</div></div><div><span class="pd-stamp">DESIGN DRAFT · DỮ LIỆU MINH HỌA</span></div></div>' +
      '<table><thead><tr><th>Chỉ tiêu</th><th class="num">TỔNG</th>' + ents.map(function (e) { return '<th class="num">' + esc(e.label) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      TH.PNL_LINES.map(function (l) {
        if (l.sec || l.grp) return '<tr><td colspan="' + (ents.length + 2) + '"><b>' + esc(l.sec || l.grp) + '</b></td></tr>';
        var f = function (v) { return '<td class="num">' + (l.count ? v[l.k] : num(v[l.k])) + '</td>'; };
        return '<tr><td>' + (l.strong ? '<b>' + esc(l.label) + '</b>' : esc(l.label)) + '</td>' + f(tot) + vs.map(f).join('') + '</tr>';
      }).join('') + '</tbody></table></div>');
  };
})();
