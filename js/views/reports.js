/* Báo cáo: RPT-01 (tổng quan tòa), RPT-02 (kinh doanh & hiệu suất), RPT-03 (lương & chia lợi nhuận). */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;

  function periods6(p) { var i = TH.PERIODS.indexOf(p); return TH.PERIODS.slice(Math.max(0, i - 5), i + 1); }
  function prevPeriod(p) { var i = TH.PERIODS.indexOf(p); return i > 0 ? TH.PERIODS[i - 1] : null; }
  function scopeBuildings() { var s = TH.scope(); return TH.db.buildings.filter(function (b) { return TH.inScope(b.id) && (s === 'ALL' || b.id === s); }); }
  function snapshotOf(p) {
    if (!TH.db.snapshots[p] && TH.db.periodApprovals[p]) TH.db.snapshots[p] = makeSnapshot(p, TH.db.periodApprovals[p]);
    return TH.db.snapshots[p];
  }
  function makeSnapshot(p, meta) {
    var data = {};
    TH.db.buildings.forEach(function (b) { data[b.id] = C.summary(p, b.id); });
    data.ALL = C.summary(p, 'ALL');
    return { by: meta.by, at: meta.at, data: JSON.parse(JSON.stringify(data)) };
  }
  TH.reportSnapshot = snapshotOf;
  function delta(cur, prev) {
    if (prev === undefined || prev === null) return '';
    var d = cur - prev;
    if (Math.abs(d) < 1) return '<span class="muted">0</span>';
    return '<span class="' + (d > 0 ? 'pos' : 'neg') + '">' + (d > 0 ? '+' : '−') + F.short(Math.abs(d)) + '</span>';
  }
  function periodBadge(p) {
    if (TH.periodLocked(p)) return TH.badge('Kỳ ' + F.period(p) + ' · đã khóa', 'neutral', { icon: 'lock' });
    if (TH.db.periodApprovals[p]) return TH.badge('Kỳ ' + F.period(p) + ' · đã duyệt', 'success', { dot: true });
    return TH.badge('Kỳ ' + F.period(p) + ' · đang mở', 'warning', { dot: true });
  }
  TH.periodBadge = periodBadge;

  /* =========================================================
     RPT-01 — Báo cáo tòa: thu, nợ, chi phí, lãi
     ========================================================= */
  TH.views['RPT-01'] = {
    render: function () {
      var p = TH.store.state.period, scope = TH.scope(), sm = C.summary(p, scope);
      var bs = scopeBuildings();
      var snap = TH.has('F045.C') ? snapshotOf(p) : null;
      var locked = TH.periodLocked(p);

      var kpis = '<div class="grid-5 overview-kpis u-mb-16">' +
        TH.kpi({ label: 'Lãi dòng tiền tạm tính', value: F.short(sm.profit), neg: sm.profit < 0, accent: true, foot: TH.openBadge('D-07', 'DRAFT') + ' Thu − chi đã duyệt; chưa phải LN ròng' }) +
        TH.kpi({ label: 'Doanh thu đã xác nhận', value: F.short(sm.billed), href: TH.router.href('INV-02'), foot: sm.invoices + ' hóa đơn đã xác nhận' }) +
        TH.kpi({ label: 'Thu thực đã xác nhận', value: F.short(sm.collected), href: TH.router.href('PAY-02'), foot: '<span class="warn-text">' + F.short(sm.pending) + ' chờ xác nhận</span>' }) +
        TH.kpi({ label: 'Công nợ', value: F.short(sm.debt), href: TH.router.href('PAY-02'), foot: 'Hóa đơn trừ phiếu thu đã xác nhận' }) +
        TH.kpi({ label: 'Chi phí đã duyệt', value: F.short(sm.expenses), href: TH.router.href('EXP-01'), foot: F.short(sm.expensesPending) + ' chờ duyệt / nháp' }) +
        '</div>';

      var alerts = '';
      if (sm.notBilled.length && p === TH.CURRENT_PERIOD) alerts += '<div class="alert alert-warning">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>' + sm.notBilled.map(function (b) { return esc(b.name); }).join(', ') + ' chưa lập hóa đơn.</b><span>Chưa tính doanh thu và công nợ kỳ ' + F.period(p) + '. <a href="' + TH.router.href('INV-01') + '">Lập hóa đơn ' + I('arrowRight', 'ic-sm') + '</a></span></div></div>';

      var pendingReceipts = TH.db.receipts.filter(function (r) { var inv = C.invoice(r.invoiceId); return r.status === 'pending' && inv && TH.inScope(inv.buildingId) && (scope === 'ALL' || inv.buildingId === scope); }).length;
      var pendingReadings = TH.db.readings.filter(function (r) { var room = C.room(r.roomId); return room && r.period === p && r.status !== 'confirmed' && TH.inScope(room.buildingId) && (scope === 'ALL' || room.buildingId === scope); }).length;
      var expiryCount = C.expiring(TH.expiryDays(), scope).length;
      var tasks = '<div class="overview-tasks"><h2>Cần xử lý</h2>' +
        '<a class="task-row" href="' + TH.router.href('PAY-01') + '"><strong>' + pendingReceipts + '</strong><span>Phiếu thu chờ xác nhận</span>' + I('chevronRight', 'ic-sm') + '</a>' +
        '<a class="task-row" href="' + TH.router.href('METER-01') + '"><strong>' + pendingReadings + '</strong><span>Chỉ số chưa xác nhận</span>' + I('chevronRight', 'ic-sm') + '</a>' +
        '<a class="task-row" href="' + TH.router.href('CON-03') + '"><strong>' + expiryCount + '</strong><span>Hợp đồng sắp hết hạn</span>' + I('chevronRight', 'ic-sm') + '</a></div>';

      var drill = TH.has('F045.B');
      var rows = bs.map(function (b) { var s = C.summary(p, b.id); s.b = b; return s; });
      var table = TH.table({
        label: 'Báo cáo theo tòa',
        cols: [
          { key: 'b', label: 'Tòa', render: function (r) { return '<div class="cell-main">' + esc(r.b.name) + '</div><div class="cell-sub">' + r.occupied + '/' + r.rooms + ' phòng đang thuê · ' + F.pct(r.occupancy, 0) + '</div>'; } },
          { key: 'billed', label: 'Doanh thu', num: true, render: function (r) { return r.invoices ? F.money(r.billed) : '<span class="muted small">Chưa lập hóa đơn</span>'; } },
          { key: 'collected', label: 'Thu thực', num: true, render: function (r) { return F.money(r.collected); } },
          { key: 'debt', label: 'Công nợ', num: true, render: function (r) { return r.debt ? '<span class="neg">' + F.money(r.debt) + '</span>' : F.money(0); } },
          { key: 'expenses', label: 'Chi đã duyệt', num: true, render: function (r) { return F.money(r.expenses); } },
          { key: 'profit', label: 'Lãi tạm tính', num: true, render: function (r) { return '<b class="' + (r.profit < 0 ? 'neg' : '') + '">' + F.money(r.profit) + '</b>'; } },
          { key: 'snap', label: 'Lệch bản chốt', num: true, gate: 'F045.C', render: function (r) { var sn = snap && snap.data[r.b.id]; return sn ? delta(r.profit, sn.profit) : '<span class="muted small">Chưa duyệt kỳ</span>'; } },
          { key: 'dd', label: '', gate: 'F045.B', render: function (r) { return '<button type="button" class="btn btn-xs" data-act="rpt.drill" data-id="' + r.b.id + '">' + I('chevronRight', 'ic-sm') + 'Chi tiết</button>'; } },
        ],
        rows: rows,
        rowAttrs: function (r) { return drill ? 'class="is-clickable" data-act="rpt.drill" data-id="' + r.b.id + '"' : ''; },
        foot: bs.length > 1 ? { _label: '<b>Tổng (' + bs.length + ' tòa)</b>', billed: F.money(sm.billed), collected: F.money(sm.collected), debt: F.money(sm.debt), expenses: F.money(sm.expenses), profit: F.money(sm.profit) } : null,
      });

      var chart = TH.chart.bars({
        label: 'Thu thực, chi phí và lãi tạm tính theo tòa',
        categories: rows.map(function (r) { return r.b.short; }),
        series: [{ label: 'Thu thực', values: rows.map(function (r) { return r.collected; }) }, { label: 'Chi đã duyệt', values: rows.map(function (r) { return r.expenses; }) }, { label: 'Lãi tạm tính', values: rows.map(function (r) { return r.profit; }), color: 'var(--chart-3)' }],
        height: 200, width: 560,
      });

      var trendPs = periods6(p);
      var trend = TH.gate('F046.B', '<div class="card">' + TH.cardHd(I('trend', 'ic-sm') + 'Xu hướng 6 kỳ' + TH.up('F046.B'), 'Kéo tự động từ hóa đơn, phiếu thu, chi phí đã duyệt') + '<div class="card-bd">' +
        TH.chart.lines({ label: 'Xu hướng doanh thu, thu thực, chi phí', categories: trendPs.map(F.period), series: [
          { label: 'Doanh thu', values: trendPs.map(function (x) { return C.summary(x, scope).billed; }), color: 'var(--chart-3)' },
          { label: 'Thu thực', values: trendPs.map(function (x) { return C.summary(x, scope).collected; }), color: 'var(--chart-1)' },
          { label: 'Chi đã duyệt', values: trendPs.map(function (x) { return C.summary(x, scope).expenses; }), color: 'var(--chart-2)' },
        ] }) + '</div></div>', { label: 'Xu hướng 3–6 tháng, kéo nguồn tự động', lines: 5 });

      var oldDebtCollected = sm.collected - C.sum(C.receiptsReceivedIn(p, scope).filter(function (r) { return C.invoice(r.invoiceId).period === p; }), function (r) { return r.amount; });
      var split = TH.gate('F048.B', '<div class="card">' + TH.cardHd(I('split', 'ic-sm') + 'Doanh thu thuộc kỳ vs dòng tiền' + TH.up('F048.B'), 'Tách hai góc nhìn để không nhầm số') + '<div class="card-bd">' +
        TH.kv([['Doanh thu thuộc kỳ ' + F.period(p), '<span class="tnum">' + F.money(sm.billed) + '</span>'], ['Đã thu cho hóa đơn kỳ này', '<span class="tnum">' + F.money(sm.collectedForPeriod) + '</span>'], ['Thu nợ kỳ trước (dòng tiền)', '<span class="tnum">' + F.money(oldDebtCollected) + '</span>'], ['Dòng tiền thu trong kỳ', '<b class="tnum">' + F.money(sm.collected) + '</b>']]) + '</div></div>', { label: 'Phân tách doanh thu thuộc kỳ và dòng tiền', lines: 4 });

      var adjust = TH.gate('F048.C', '<div class="card">' + TH.cardHd(I('sliders', 'ic-sm') + 'Điều chỉnh / loại trừ theo nguồn' + TH.up('F048.C'), 'Cọc và thu trước không phải doanh thu kỳ') + '<div class="card-bd">' +
        TH.table({ compact: true, cols: [{ key: 'k', label: 'Khoản' }, { key: 'v', label: 'Số tiền', num: true, render: function (r) { return F.money(r.v); } }, { key: 'n', label: 'Xử lý', render: function (r) { return '<span class="small muted">' + esc(r.n) + '</span>'; } }],
          rows: [{ k: 'Tiền cọc nhận trong kỳ', v: 0, n: 'Loại trừ — cọc không là doanh thu' }, { k: 'Thu trước kỳ sau', v: 0, n: 'Chuyển kỳ sau' }, { k: 'Thu nợ kỳ trước', v: oldDebtCollected, n: 'Giữ trong dòng tiền, ghi chú nguồn' }] }) + '</div></div>', { label: 'Điều chỉnh/loại trừ cọc, thu trước', lines: 4 });

      var snapCard = TH.gate('F045.C', '<div class="card">' + TH.cardHd(I('stamp', 'ic-sm') + 'Bản chốt sau duyệt kỳ' + TH.up('F045.C'), snap ? 'Duyệt bởi ' + esc(C.staffName(snap.by)) + ' · ' + F.date(snap.at) : 'Kỳ chưa duyệt — chưa có bản chốt', snap ? '' : TH.permBtn('report.all', '<button type="button" class="btn btn-sm btn-primary" data-act="rpt.approve">' + I('check', 'ic-sm') + 'Duyệt kỳ</button>', 'Duyệt kỳ · 403')) + '<div class="card-bd">' +
        (snap ? TH.table({ compact: true, cols: [{ key: 'k', label: 'Chỉ tiêu' }, { key: 's', label: 'Bản chốt', num: true, render: function (r) { return F.money(r.s); } }, { key: 'c', label: 'Hiện tại', num: true, render: function (r) { return F.money(r.c); } }, { key: 'd', label: 'Sai lệch', num: true, render: function (r) { return delta(r.c, r.s); } }],
          rows: [['Doanh thu', 'billed'], ['Thu thực', 'collected'], ['Công nợ', 'debt'], ['Chi đã duyệt', 'expenses'], ['Lãi tạm tính', 'profit']].map(function (x) { return { k: x[0], s: snap.data[scope][x[1]], c: sm[x[1]] }; }) }) +
          (Math.abs(snap.data[scope].profit - sm.profit) > 0 ? '<div class="alert alert-warning u-mt-12">' + I('alert', 'ic-sm') + '<div class="alert-body">Số liệu thay đổi sau khi duyệt kỳ — cần giải trình hoặc duyệt lại.</div></div>' : '')
          : '<p class="small muted">Duyệt kỳ để lưu bản chốt số liệu; mọi thay đổi sau đó được theo dõi sai lệch.</p>') + '</div></div>', { label: 'Bản chốt sau duyệt kỳ + theo dõi sai lệch', lines: 5 });

      var pp = prevPeriod(p), ps = pp ? C.summary(pp, scope) : null;
      var role = TH.ROLES[TH.store.state.role];
      var hist = TH.gate('F045.D', '<div class="card">' + TH.cardHd(I('history', 'ic-sm') + 'Đối chiếu kỳ lịch sử & theo vai trò' + TH.up('F045.D'), 'Đang xem với vai trò ' + esc(role.label) + ' · phạm vi ' + esc(TH.scopeLabel())) + '<div class="card-bd">' +
        (ps ? TH.table({ compact: true, cols: [{ key: 'k', label: 'Chỉ tiêu' }, { key: 'a', label: 'Kỳ ' + F.period(pp), num: true, render: function (r) { return F.money(r.a); } }, { key: 'b', label: 'Kỳ ' + F.period(p), num: true, render: function (r) { return F.money(r.b); } }, { key: 'd', label: 'Chênh', num: true, render: function (r) { return delta(r.b, r.a); } }],
          rows: [['Doanh thu', 'billed'], ['Thu thực', 'collected'], ['Chi đã duyệt', 'expenses'], ['Lãi tạm tính', 'profit']].map(function (x) { return { k: x[0], a: ps[x[1]], b: sm[x[1]] }; }) }) : '<p class="small muted">Không có kỳ trước trong dữ liệu mẫu.</p>') +
        '</div></div>', { label: 'Đối chiếu theo kỳ lịch sử và theo vai trò', lines: 5 });

      var net = TH.gate('F048.D', '<div class="card">' + TH.cardHd(I('calculator', 'ic-sm') + 'Lợi nhuận ròng theo rule' + TH.up('F048.D'), 'Rule LN-01 v0.1 · gắn phiên bản kỳ chốt', TH.openBadge('D-07')) + '<div class="card-bd">' +
        TH.kv([['Lãi dòng tiền tạm tính', F.money(sm.profit)], ['(−) Phân bổ chi phí chung (mô phỏng 2% doanh thu)', F.money(-Math.round(sm.billed * 0.02))], ['(±) Điều chỉnh cọc / thu trước', F.money(0)], ['Lợi nhuận ròng theo rule (dự thảo)', '<b>' + F.money(sm.profit - Math.round(sm.billed * 0.02)) + '</b>']]) + '<p class="small muted u-mt-8">Chưa gồm ' + F.money(sm.expensesPending) + ' chi phí chờ duyệt.</p>' +
        '<div class="row u-mt-12">' + (locked ? TH.badge('Đã chốt phiên bản kỳ ' + F.period(p), 'neutral', { icon: 'lock' }) : TH.permBtn('report.all', '<button type="button" class="btn btn-sm" data-act="rpt.lock">' + I('lock', 'ic-sm') + 'Khóa kỳ & chốt phiên bản</button>', 'Khóa kỳ · 403')) + '</div>' +
        '</div></div>', { label: 'Lợi nhuận ròng gắn rule, phiên bản kỳ chốt', lines: 5 });

      var actions = TH.exportBtn('rpt1.xlsx', 'Xuất Excel (.xlsx)') + '<button type="button" class="btn" data-act="rpt1.print">' + I('printer', 'ic-sm') + 'In / lưu PDF</button>';

      return TH.pageHeader({ screen: 'RPT-01', title: 'Tổng quan vận hành', status: periodBadge(p), desc: esc(TH.scopeLabel()) + ' · thu, chi và công nợ từ chứng từ đã xác nhận · ' + bs.length + ' tòa · ' + sm.occupied + '/' + sm.rooms + ' phòng đang thuê.', actions: actions }) +
        kpis +
        '<div class="overview-grid"><div class="card overview-chart">' + TH.cardHd('Dòng tiền theo tòa', 'Thu thực, chi đã duyệt và lãi tạm tính · ' + F.period(p)) + '<div class="card-bd">' + chart + '</div></div><aside class="overview-rail" aria-label="Công việc cần xử lý">' + alerts + tasks + '</aside></div>' +
        '<div class="card card-flush overview-table overview-section">' + TH.cardHd('Kết quả theo tòa', esc(TH.scopeLabel()) + (drill ? ' · chọn tòa để xem chứng từ' : '')) + table + '</div>' +
        '<div class="grid-2 overview-section">' + trend + split + '</div>' +
        '<div class="grid-2 overview-section">' + adjust + hist + '</div>' +
        '<div class="overview-snapshot">' + snapCard + '</div>' +
        net;
    },
    dialogs: [function () { drillRender('TH-CG'); }],
  };
  function drillRender(bId) {
    var p = TH.store.state.period, b = C.building(bId);
    var invs = C.invoicesIn(p, bId);
    return {
      title: I('building') + ' ' + esc(b.name) + ' · Kỳ ' + F.period(p) + TH.up('F045.B'),
      sub: 'Drill-down hóa đơn/phòng — mở từng chứng từ nguồn',
      body: TH.gate('F045.B', TH.table({
        cols: [
          { key: 'room', label: 'Phòng', render: function (i) { return TH.roomLink(i.roomId); } },
          { key: 'id', label: 'Hóa đơn', render: function (i) { return '<a href="' + TH.router.href('INV-03', i.id) + '" data-close>' + i.id + '</a>'; } },
          { key: 'total', label: 'Tổng', num: true, render: function (i) { return F.money(i.total); } },
          { key: 'paid', label: 'Đã thu', num: true, render: function (i) { return F.money(C.paid(i.id)); } },
          { key: 'debt', label: 'Còn nợ', num: true, render: function (i) { var d = C.debt(i); return d ? '<span class="neg">' + F.money(d) + '</span>' : '0'; } },
          { key: 'st', label: 'Trạng thái', render: function (i) { return TH.status(C.payState(i)); } },
        ], rows: invs, empty: { title: 'Chưa có hóa đơn kỳ này', text: 'Tòa chưa lập hóa đơn cho kỳ đang xem.' },
      }), { label: 'Drill-down hóa đơn/phòng' }),
      foot: '<button type="button" class="btn" data-close>Đóng</button>',
    };
  }
  TH.act['rpt.drill'] = function (el) {
    if (!TH.has('F045.B')) return;
    var id = el.dataset.id;
    TH.modal.open({ key: 'drill', size: 'lg', render: function () { return drillRender(id); } });
  };
  TH.act['rpt.approve'] = function () {
    var p = TH.store.state.period;
    TH.confirm({ title: 'Duyệt kỳ ' + F.period(p) + '?', body: '<p>Lưu bản chốt số liệu hiện tại của tất cả tòa. Mọi thay đổi sau đó sẽ hiện ở cột <b>Lệch bản chốt</b>.</p>', ok: 'Duyệt & lưu bản chốt' }).then(function (ok) {
      if (!ok) return;
      TH.db.periodApprovals[p] = { by: TH.me().id, at: TH.TODAY };
      TH.db.snapshots[p] = makeSnapshot(p, TH.db.periodApprovals[p]);
      if (TH.pnlSnapshotCreate) TH.pnlSnapshotCreate(p);
      TH.log('Duyệt kỳ', 'Kỳ ' + F.period(p), 'Lưu bản chốt báo cáo', 'period');
      TH.store.persist(); TH.app.refresh();
      TH.toast('Đã duyệt kỳ ' + F.period(p), 'Bản chốt đã lưu. Thay đổi sau đó sẽ được theo dõi sai lệch.');
    });
  };
  TH.act['rpt.lock'] = function () {
    var p = TH.store.state.period;
    TH.confirm({ title: 'Khóa kỳ ' + F.period(p) + '?', body: '<p>Sau khi khóa, chứng từ trong kỳ chỉ thay đổi qua <b>biên bản điều chỉnh</b> có audit. (Thao tác demo, có thể khôi phục dữ liệu.)</p>', ok: 'Khóa kỳ', danger: true }).then(function (ok) {
      if (!ok) return;
      if (!TH.db.periodApprovals[p]) { TH.db.periodApprovals[p] = { by: TH.me().id, at: TH.TODAY }; TH.db.snapshots[p] = makeSnapshot(p, TH.db.periodApprovals[p]); if (TH.pnlSnapshotCreate) TH.pnlSnapshotCreate(p); }
      TH.db.periodLocks[p] = { locked: true, by: TH.me().id, at: TH.TODAY };
      TH.log('Khóa kỳ', 'Kỳ ' + F.period(p), 'Chốt phiên bản báo cáo', 'period');
      TH.store.persist(); TH.app.refresh();
      TH.toast('Đã khóa kỳ ' + F.period(p), 'Phiên bản báo cáo đã chốt.');
    });
  };
  TH.act['rpt1.xlsx'] = function () {
    var p = TH.store.state.period, bs = scopeBuildings();
    var rows = bs.map(function (b) { var s = C.summary(p, b.id); return [b.name, s.rooms, s.occupied, s.billed, s.collected, s.debt, s.expenses, s.profit]; });
    var t = C.summary(p, TH.scope());
    var invs = [];
    bs.forEach(function (b) { C.invoicesIn(p, b.id).forEach(function (i) { invs.push([b.short, i.roomId, i.id, TH.statusLabel(i.status), i.total, C.paid(i.id), C.debt(i)]); }); });
    TH.exportXlsx('TIMEHOUSE_RPT-01_ky_' + p, [
      { name: 'Tong hop', title: 'Báo cáo tòa — ' + TH.scopeLabel(), note: 'DRAFT · dữ liệu minh họa · Lãi dòng tiền tạm tính = thu thực đã xác nhận − chi đã duyệt (không phải LN ròng kế toán)',
        columns: [{ label: 'Tòa', width: 26 }, { label: 'Số phòng', type: 'number', width: 10 }, { label: 'Đang thuê', type: 'number', width: 10 }, { label: 'Doanh thu', type: 'money' }, { label: 'Thu thực', type: 'money' }, { label: 'Công nợ', type: 'money' }, { label: 'Chi đã duyệt', type: 'money' }, { label: 'Lãi tạm tính', type: 'money' }],
        rows: rows, totals: ['Tổng', t.rooms, t.occupied, t.billed, t.collected, t.debt, t.expenses, t.profit] },
      { name: 'Hoa don', title: 'Hóa đơn kỳ ' + F.period(p), columns: [{ label: 'Tòa' }, { label: 'Phòng' }, { label: 'Mã hóa đơn', width: 20 }, { label: 'Trạng thái' }, { label: 'Tổng', type: 'money' }, { label: 'Đã thu', type: 'money' }, { label: 'Còn nợ', type: 'money' }], rows: invs },
    ]);
    TH.toast('Đã xuất Excel', 'TIMEHOUSE_RPT-01_ky_' + p + '.xlsx');
  };
  TH.act['rpt1.print'] = function () {
    var p = TH.store.state.period, bs = scopeBuildings(), t = C.summary(p, TH.scope());
    TH.printDoc('<div class="print-doc"><div class="pd-head"><div><h1>Báo cáo tòa: thu, nợ, chi phí, lãi</h1><div>' + esc(TH.scopeLabel()) + '</div></div><div><span class="pd-stamp">DESIGN DRAFT · DỮ LIỆU MINH HỌA</span></div></div>' +
      '<table><thead><tr><th>Tòa</th><th class="num">Doanh thu</th><th class="num">Thu thực</th><th class="num">Công nợ</th><th class="num">Chi đã duyệt</th><th class="num">Lãi tạm tính</th></tr></thead><tbody>' +
      bs.map(function (b) { var s = C.summary(p, b.id); return '<tr><td>' + esc(b.name) + '</td><td class="num">' + F.money(s.billed) + '</td><td class="num">' + F.money(s.collected) + '</td><td class="num">' + F.money(s.debt) + '</td><td class="num">' + F.money(s.expenses) + '</td><td class="num">' + F.money(s.profit) + '</td></tr>'; }).join('') +
      '<tr><td><b>Tổng</b></td><td class="num"><b>' + F.money(t.billed) + '</b></td><td class="num"><b>' + F.money(t.collected) + '</b></td><td class="num"><b>' + F.money(t.debt) + '</b></td><td class="num"><b>' + F.money(t.expenses) + '</b></td><td class="num"><b>' + F.money(t.profit) + '</b></td></tr></tbody></table>' +
      '<p class="u-mt-12">Lãi dòng tiền tạm tính = thu thực đã xác nhận − chi đã duyệt; không phải lợi nhuận ròng kế toán. Chính sách D-07 đang OPEN.</p></div>');
  };

  /* =========================================================
     RPT-02 — Báo cáo kinh doanh & hiệu suất
     ========================================================= */
  TH.views['RPT-02'] = {
    scan: function () { return [{ ui: { cmp: 'building' } }, { ui: { cmp: 'team' } }, { ui: { cmp: 'period' } }]; },
    render: function () {
      var p = TH.store.state.period, scope = TH.scope(), bs = scopeBuildings();
      var sm = C.summary(p, scope), ms = C.milestones(p, scope);
      var contracts = TH.db.contracts.filter(function (c) { return c.status === 'active' && TH.inScope(c.buildingId) && (scope === 'ALL' || c.buildingId === scope); });
      var expiring = C.expiring(TH.expiryDays(), scope).length;
      var kpis = '<div class="grid-4 u-mb-16">' +
        TH.kpi({ label: 'Tòa · phòng', icon: 'building', value: bs.length + '<small> tòa · ' + sm.rooms + ' phòng</small>', foot: sm.occupied + ' đang thuê' }) +
        TH.kpi({ label: 'Tỷ lệ lấp đầy', icon: 'door', value: F.pct(sm.occupancy, 0), href: TH.router.href('ROOM-01'), foot: (sm.rooms - sm.occupied) + ' phòng trống/đang sửa' }) +
        TH.kpi({ label: 'Hợp đồng còn hiệu lực', icon: 'contract', value: String(contracts.length), href: TH.router.href('CON-03'), foot: expiring + ' HĐ hết hạn trong ' + TH.expiryDays() + ' ngày' }) +
        TH.kpi({ label: 'Doanh thu / Thu thực', icon: 'receipt', value: F.short(sm.billed) + '<small> / ' + F.short(sm.collected) + '</small>', href: TH.router.href('PAY-02'), foot: 'Tỷ lệ thu ' + F.pct(sm.billed ? sm.collectedForPeriod / sm.billed : 0, 0) }) + '</div>';

      var msTable = TH.perfTable(p, bs, { buckets: true });

      var trendPs = periods6(p);
      var trend = TH.gate('F046.B', '<div class="card">' + TH.cardHd(I('trend', 'ic-sm') + 'Xu hướng 6 kỳ' + TH.up('F046.B'), 'Doanh thu và thu thực') + '<div class="card-bd">' +
        TH.chart.lines({ categories: trendPs.map(F.period), series: [{ label: 'Doanh thu', values: trendPs.map(function (x) { return C.summary(x, scope).billed; }) }, { label: 'Thu thực', values: trendPs.map(function (x) { return C.summary(x, scope).collected; }), color: 'var(--chart-3)' }] }) + '</div></div>', { label: 'Biểu đồ xu hướng 3–6 tháng', lines: 5 });

      var byMgr = TH.gate('F047.B', '<div class="card card-flush">' + TH.cardHd(I('users', 'ic-sm') + 'Theo người phụ trách' + TH.up('F047.B')) + TH.table({ compact: true, cols: [
        { key: 'n', label: 'Người phụ trách', render: function (r) { return TH.personCell(C.staffName(r.managerId), esc(C.building(r.buildingId).short)); } },
        { key: 'c', label: 'Thu thực', num: true, render: function (r) { return F.money(r.ms.m5 + r.ms.m10 + r.ms.m15 + r.ms.late); } },
        { key: 'w', label: 'D · quy đổi', num: true, render: function (r) { return F.money(Math.round(TH.perfTier(C.perfBuilding(p, r.buildingId)).D)); } },
        { key: 'r', label: 'HS thực tế', num: true, render: function (r) { var h = C.perfBuilding(p, r.buildingId); return h.invoices ? TH.hsCell(TH.perfTier(h).hs) : '—'; } },
      ], rows: C.performance(p).filter(function (r) { return TH.inScope(r.buildingId) && (scope === 'ALL' || r.buildingId === scope); }) }) + '</div>', { label: 'Báo cáo theo người phụ trách', lines: 4 });

      var cmp = TH.store.ui('RPT-02', 'cmp', 'building');
      var cmpBody;
      if (cmp === 'period') {
        cmpBody = TH.table({ compact: true, cols: [{ key: 'p', label: 'Kỳ', render: function (x) { return 'Kỳ ' + F.period(x); } }, { key: 'b', label: 'Doanh thu', num: true, render: function (x) { return F.money(C.summary(x, scope).billed); } }, { key: 'c', label: 'Thu thực', num: true, render: function (x) { return F.money(C.summary(x, scope).collected); } }, { key: 'o', label: 'Lấp đầy', num: true, render: function (x) { return F.pct(C.summary(x, scope).occupancy, 0); } }], rows: trendPs.slice(-3) });
      } else if (cmp === 'team') {
        cmpBody = TH.table({ compact: true, cols: [{ key: 'n', label: 'Nhóm', render: function (t) { return esc(t.name); } }, { key: 'b', label: 'Tòa', render: function (t) { return t.bs.map(function (b) { return b.short; }).join(', ') || '—'; } }, { key: 'v', label: 'Doanh thu', num: true, render: function (t) { return F.money(C.sum(t.bs, function (b) { return C.summary(p, b.id).billed; })); } }, { key: 'w', label: 'D · quy đổi HS', num: true, render: function (t) { return F.money(Math.round(C.sum(t.bs, function (b) { return TH.perfTier(C.perfBuilding(p, b.id)).D; }))); } }],
          rows: TH.db.teams.filter(function (t) { return t.id !== 'BO'; }).map(function (t) { return { name: t.name, bs: TH.db.buildings.filter(function (b) { var m = C.staff(b.managerId); return m && m.team === t.id; }) }; }) });
      } else {
        cmpBody = TH.table({ compact: true, cols: [{ key: 'n', label: 'Tòa', render: function (b) { return esc(b.short); } }, { key: 'o', label: 'Lấp đầy', num: true, render: function (b) { return F.pct(C.summary(p, b.id).occupancy, 0); } }, { key: 'v', label: 'Doanh thu', num: true, render: function (b) { return F.money(C.summary(p, b.id).billed); } }, { key: 'r', label: 'Tỷ lệ thu', num: true, render: function (b) { var s = C.summary(p, b.id); return s.billed ? F.pct(s.collectedForPeriod / s.billed, 0) : '—'; } }], rows: TH.db.buildings.filter(function (b) { return TH.inScope(b.id); }) });
      }
      var compare = TH.gate('F046.C', '<div class="card card-flush">' + TH.cardHd(I('compare', 'ic-sm') + 'So sánh' + TH.up('F046.C'), null, '<div class="seg">' + [['building', 'Tòa'], ['team', 'Nhóm'], ['period', 'Kỳ']].map(function (o) { return '<button type="button" aria-pressed="' + (cmp === o[0]) + '" data-act="ui.set" data-screen="RPT-02" data-key="cmp" data-val="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>') + cmpBody + '</div>', { label: 'So sánh tòa, nhóm, kỳ', lines: 4 });

      var snap = snapshotOf(p);
      var origVsApproved = TH.gate('F047.C', '<div class="card">' + TH.cardHd(I('stamp', 'ic-sm') + 'Mốc gốc vs phiên bản duyệt' + TH.up('F047.C')) + '<div class="card-bd">' +
        (snap ? TH.kv([['Thu thực tại bản chốt', F.money(snap.data[scope].collected)], ['Thu thực hiện tại', F.money(sm.collected)], ['Chênh lệch', delta(sm.collected, snap.data[scope].collected) || '0']]) : '<p class="small muted">Kỳ ' + F.period(p) + ' chưa duyệt — chưa có phiên bản để so sánh. Duyệt kỳ ở RPT-01.</p>') + '</div></div>', { label: 'So sánh mốc gốc và phiên bản duyệt', lines: 3 });

      var edits = TH.db.receiptEdits.filter(function (e) { return e.period === p && TH.inScope(C.room(e.receiptRoom).buildingId); });
      var explain = TH.gate('F047.D', '<div class="card">' + TH.cardHd(I('history', 'ic-sm') + 'Giải trình sửa ngày thực nhận' + TH.up('F047.D'), 'Thay đổi received_at / backdate ảnh hưởng mốc') + '<div class="card-bd">' +
        (edits.length ? '<ul class="timeline">' + edits.map(function (e) { return '<li><b>' + esc(e.receiptRoom) + '</b>: ' + F.date(e.from) + ' → ' + F.date(e.to) + ' <span class="badge badge-info">Sau 15 → Mốc 15</span><div>' + esc(e.reason) + '</div><div class="when">' + esc(C.staffName(e.by)) + ' · ' + F.date(e.at) + '</div></li>'; }).join('') + '</ul>' : '<p class="small muted">Không có thay đổi ngày thực nhận trong kỳ.</p>') + '</div></div>', { label: 'Giải trình thay đổi do sửa received_at/backdate', lines: 3 });

      var tplSel = TH.gate('F046.D', '<label class="sr-only" for="rpt2-tpl">Mẫu báo cáo</label><select id="rpt2-tpl" class="select select-sm u-w-auto" data-ui="RPT-02.tpl">' + TH.db.reportTemplates.filter(function (t) { return !t.report; }).map(function (t) { return '<option value="' + t.id + '"' + (TH.store.ui('RPT-02', 'tpl', 'MAU-01') === t.id ? ' selected' : '') + '>' + esc(t.name) + ' · v' + t.version + (t.status === 'draft' ? ' (nháp)' : '') + '</option>'; }).join('') + '</select>' + TH.up('F046.D'), { mode: 'btn', label: 'Mẫu báo cáo quản trị', size: '' });

      return TH.pageHeader({ screen: 'RPT-02', status: periodBadge(p), desc: esc(TH.scopeLabel()) + ' · ' + 'Tổng hợp toàn công ty: tòa, nhóm, kỳ, mốc thu 5/10/15, lấp đầy và hợp đồng. Số thu thực tách bạch với doanh thu quy đổi tính hiệu suất.', actions: tplSel + TH.exportBtn('rpt2.xlsx', 'Xuất Excel (.xlsx)') }) +
        kpis +
        '<div class="card card-flush u-mb-16">' + TH.cardHd(I('target', 'ic-sm') + 'Thu theo mốc 5/10/15 & hiệu suất tòa', 'A = M5 × 100% + (M10 − M5) × 90% + (M15 − M10) × 70% · D = A − A × B + C · HS = D ÷ giá niêm yết', TH.openBadge('D-04')) + msTable +
        '<div class="card-ft">' + TH.perfFormulaNote() + '</div></div>' +
        '<div class="grid-2 u-mb-16">' + trend + byMgr + '</div>' +
        '<div class="grid-3">' + compare + origVsApproved + explain + '</div>';
    },
  };
  TH.act['rpt2.xlsx'] = function () {
    var p = TH.store.state.period;
    var bs = scopeBuildings();
    TH.exportXlsx('TIMEHOUSE_RPT-02_ky_' + p, [{ name: 'Moc 5-10-15', title: 'Báo cáo kinh doanh & hiệu suất — ' + TH.scopeLabel(), note: 'DRAFT · trọng số 100/90/70/0 chờ chốt (D-04)',
      columns: [{ label: 'Tòa', width: 26 }, { label: 'Lấp đầy', type: 'pct' }, { label: 'Doanh thu', type: 'money' }, { label: '≤5 (100%)', type: 'money' }, { label: '≤10 (90%)', type: 'money' }, { label: '≤15 (70%)', type: 'money' }, { label: 'Sau 15 (0%)', type: 'money' }, { label: 'A · quy đổi 3 mốc', type: 'money' }],
      rows: bs.map(function (b) { var s = C.summary(p, b.id), m = C.milestones(p, b.id); return [b.name, s.occupancy, s.billed, m.m5, m.m10, m.m15, m.late, Math.round(m.weighted)]; }) }, TH.perfSheet(p, bs)]);
    TH.toast('Đã xuất Excel', 'TIMEHOUSE_RPT-02_ky_' + p + '.xlsx');
  };

  /* =========================================================
     RPT-03 — Báo cáo lương & chia lợi nhuận
     ========================================================= */
  TH.views['RPT-03'] = {
    scan: function () { return [{ ui: { tab: 'salary' } }, { ui: { tab: 'share' } }]; },
    render: function () {
      var p = TH.store.state.period, scope = TH.scope();
      var tabs = [{ id: 'salary', label: 'Bảng lương nháp', icon: 'calculator' }, { id: 'share', label: 'Chia lợi nhuận theo tòa', icon: 'pie' }];
      var tab = TH.resolveTab('RPT-03', tabs);
      var pay = C.payroll(p), appr = TH.db.payrollStatus[p] || { status: 'draft' };
      var content;
      if (tab === 'salary') {
        content = TH.table({ cols: [
          { key: 'n', label: 'Nhân viên', render: function (r) { return TH.personCell(r.staff.name, esc(r.staff.title)); } },
          { key: 'b', label: 'Lương cố định', num: true, render: function (r) { return F.money(r.base); } },
          { key: 'a', label: 'Phụ cấp', num: true, render: function (r) { return F.money(r.allowance); } },
          { key: 'hs', label: 'Hiệu suất', num: true, render: function (r) { return r.buildings.length ? F.pct(r.hs / 100, 1) + '<div class="cell-sub">' + r.rooms + ' phòng</div>' : '<span class="muted">—</span>'; } },
          { key: 'p', label: 'Lương HS', num: true, render: function (r) { return r.perf ? F.money(r.perf) : '<span class="muted">0</span>'; } },
          { key: 'l', label: 'Trưởng nhóm', num: true, render: function (r) { return r.lead ? F.money(r.lead) : '<span class="muted">0</span>'; } },
          { key: 'd', label: 'Điều chỉnh', num: true, render: function (r) { return r.adj ? '<span class="' + (r.adj < 0 ? 'neg' : 'pos') + '">' + F.money(r.adj) + '</span>' : '<span class="muted">0</span>'; } },
          { key: 't', label: 'Tổng nháp', num: true, render: function (r) { return '<b>' + F.money(r.total) + '</b>'; } },
        ], rows: pay, foot: { _label: '<b>Tổng (' + pay.length + ' NV)</b>', t: '<b>' + F.money(C.sum(pay, function (r) { return r.total; })) + '</b>' } });
      } else {
        var bs = scopeBuildings(), rows = [];
        bs.forEach(function (b) { var al = C.allocation(b.id, p); al.rows.forEach(function (r) { rows.push({ b: b, r: r, base: al.base }); }); });
        content = TH.table({ cols: [
          { key: 'b', label: 'Tòa', render: function (x) { return esc(x.b.short); } },
          { key: 'h', label: 'Cổ đông', render: function (x) { return esc(x.r.holder.name); } },
          { key: 'ra', label: 'Tỷ lệ', num: true, render: function (x) { return x.r.share.ratio + '%'; } },
          { key: 'base', label: 'Lãi tạm tính tòa', num: true, render: function (x) { return F.money(x.base); } },
          { key: 'a', label: 'Lợi nhuận chia (nháp)', num: true, render: function (x) { return x.base > 0 ? '<b>' + F.money(x.r.amount) + '</b>' : '<span class="muted small">Không chia (lãi ≤ 0)</span>'; } },
        ], rows: rows });
      }
      var src = TH.gate('F049.B', '<div class="card">' + TH.cardHd(I('database', 'ic-sm') + 'Nguồn tự động' + TH.up('F049.B'), 'Kéo từ bảng phiếu thu/chi phí/đội nhóm/cổ phần') + '<div class="card-bd">' +
        TH.kv([['Phiếu thu đã xác nhận', C.receiptsReceivedIn(p, scope).length + ' phiếu'], ['Chi phí đã duyệt', C.expensesIn(p, scope, 'approved').length + ' khoản'], ['Phân công / đội', TH.db.assignments.filter(function (a) { return !a.to; }).length + ' phân công'], ['Bảng tỷ lệ cổ phần', TH.db.shares.filter(function (s) { return !s.to; }).length + ' dòng hiệu lực']]) + '</div></div>', { label: 'Tự kéo từ receipt/cost/team/share', lines: 4 });
      var flow = TH.gate('F049.C', '<div class="card">' + TH.cardHd(I('fileCheck', 'ic-sm') + 'Quy trình duyệt' + TH.up('F049.C')) + '<div class="card-bd"><div class="stepper">' +
        [['draft', 'Nháp'], ['pending', 'Chờ duyệt'], ['confirmed', 'Đã duyệt']].map(function (s, i, arr) { var order = ['draft', 'pending', 'confirmed'], cur = order.indexOf(appr.status), me = order.indexOf(s[0]); return '<div class="step ' + (me < cur ? 'is-done' : me === cur ? 'is-current' : '') + '"><span class="n">' + (me < cur ? '✓' : i + 1) + '</span>' + s[1] + '</div>' + (i < arr.length - 1 ? '<span class="step-line"></span>' : ''); }).join('') +
        '</div><p class="small muted u-mt-12">Trạng thái bảng lương kỳ ' + F.period(p) + ' lấy từ SAL-01. Duyệt tại màn Lương.</p></div></div>', { label: 'Bảng lương/CP có quy trình duyệt', lines: 3 });
      var tpl = TH.gate('F049.D', '<div class="card">' + TH.cardHd(I('sheet', 'ic-sm') + 'Mẫu kết quả gần nguồn T8' + TH.up('F049.D')) + '<div class="card-bd"><p class="small">Bố cục xuất theo mẫu kết quả tháng 08/2026 đã được khách xác nhận (cột, thứ tự, làm tròn).</p><div class="row u-mt-8">' + TH.badge('Mẫu T8/2026 · đã xác nhận', 'success') + TH.openBadge('D-06') + '</div></div></div>', { label: 'Mẫu kết quả gần nguồn tháng 8', lines: 3 });

      return TH.pageHeader({ screen: 'RPT-03', status: TH.badge('Nháp — đối chiếu bằng Excel', 'draft', { dot: true }), desc: esc(TH.scopeLabel()) + ' · ' + 'Hai biểu báo cáo nháp: lương theo nhân viên/kỳ và lợi nhuận chia theo cổ đông/tòa. Lương và phân bổ cổ phần không tự tạo chi tiền.', actions: '<button type="button" class="btn" data-act="rpt3.preview">' + I('eye', 'ic-sm') + 'Xem trước</button>' + TH.exportBtn('rpt3.xlsx', 'Xuất Excel 2 biểu (.xlsx)') }) +
        '<div class="grid-main-side"><div class="card card-flush">' + TH.tabs('RPT-03', tabs, tab) + content + '</div><div class="stack">' + src + flow + tpl + '</div></div>';
    },
  };
  TH.act['rpt3.xlsx'] = function () {
    var p = TH.store.state.period, pay = C.payroll(p), rows = [];
    scopeBuildings().forEach(function (b) { var al = C.allocation(b.id, p); al.rows.forEach(function (r) { rows.push([b.name, r.holder.name, r.share.ratio / 100, al.base, al.base > 0 ? r.amount : 0]); }); });
    TH.exportXlsx('TIMEHOUSE_RPT-03_ky_' + p, [
      { name: 'Luong nhap', title: 'Bảng lương nháp kỳ ' + F.period(p), note: 'NHÁP · đối chiếu bằng Excel · không tạo chi tiền', columns: [{ label: 'Mã NV' }, { label: 'Họ tên', width: 24 }, { label: 'Lương cơ bản', type: 'money' }, { label: 'Phụ cấp', type: 'money' }, { label: 'Hiệu suất', type: 'pct' }, { label: 'Lương HS', type: 'money' }, { label: 'Trưởng nhóm', type: 'money' }, { label: 'Điều chỉnh', type: 'money' }, { label: 'Tổng nháp', type: 'money' }], rows: pay.map(function (r) { return [r.staff.id, r.staff.name, r.base, r.allowance, r.buildings.length ? r.hs / 100 : null, r.perf, r.lead, r.adj, r.total]; }) },
      { name: 'Chia loi nhuan', title: 'Lợi nhuận chia theo tòa kỳ ' + F.period(p), note: 'NHÁP · phân bổ không đồng nghĩa đã chi tiền', columns: [{ label: 'Tòa', width: 24 }, { label: 'Cổ đông', width: 26 }, { label: 'Tỷ lệ', type: 'pct' }, { label: 'Lãi tạm tính tòa', type: 'money' }, { label: 'Lợi nhuận chia', type: 'money' }], rows: rows },
    ]);
    TH.toast('Đã xuất Excel', '2 biểu: lương nháp & chia lợi nhuận');
  };
  TH.act['rpt3.preview'] = function () {
    var p = TH.store.state.period, pay = C.payroll(p);
    TH.modal.open({ key: 'rpt3prev', size: 'lg', render: function () {
      return { title: 'Xem trước báo cáo lương & chia lợi nhuận', sub: 'Kỳ ' + F.period(p) + ' · bản nháp', body: '<div class="alert alert-draft u-mb-12">' + I('stamp', 'ic-sm') + '<div class="alert-body">NHÁP — số liệu chờ đối chiếu Excel; chính sách lương (D-06) và chia lãi (D-07) đang OPEN.</div></div>' +
        TH.kv([['Tổng lương nháp', F.money(C.sum(pay, function (r) { return r.total; }))], ['Tổng lãi tạm tính phân bổ', F.money(C.sum(scopeBuildings(), function (b) { return Math.max(0, C.allocation(b.id, p).base); }))], ['Số nhân viên', pay.length], ['Số tòa', scopeBuildings().length]]),
        foot: '<button type="button" class="btn" data-close>Đóng</button><button type="button" class="btn btn-primary" data-act="rpt3.xlsx">' + I('download', 'ic-sm') + 'Xuất Excel (.xlsx)</button>' };
    } });
  };
})();
