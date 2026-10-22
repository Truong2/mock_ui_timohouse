/* Hiệu suất tòa theo mốc thu 5/10/15 (note.md §5.2 · CR-BLD-01) — hiển thị dùng chung cho BLD-02, PAY-02, RPT-02.
   Số liệu từ TH.calc.perfBuilding; phần hiển thị bám gói: A áp trọng số 3 mốc (F033.A), B tách tỷ lệ dịch vụ (F033.B), C cộng thu thêm (F033.C). */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;

  TH.perfTier = function (r) {
    var useB = TH.has('F033.B'), useC = TH.has('F033.C');
    var D = r.A - (useB ? r.A * r.B : 0) + (useC ? r.C : 0);
    var Dp = r.Aprov - (useB ? r.Aprov * r.B : 0) + (useC ? r.C : 0);
    return { useB: useB, useC: useC, D: D, hs: r.listed ? D / r.listed : 0, Dprov: Dp, hsProv: r.listed ? Dp / r.listed : 0 };
  };
  TH.hsCell = function (v, muted) {
    return '<b class="' + (muted ? 'muted' : v >= 0.9 ? 'pos' : v < 0.7 ? 'warn-text' : '') + '">' + F.pct(v, 1) + '</b>';
  };
  /* G-02: thực tế = sau ngày 15 (ghi "chưa khóa kỳ" nếu kỳ còn mở); tạm tính = đến thời điểm xem, chưa áp trọng số */
  TH.perfState = function (r) {
    if (!r.closed) return TH.badge('Chưa qua mốc 15', 'draft', { dot: true });
    return TH.periodLocked(r.period) ? TH.badge('Thực tế · đã khóa kỳ', 'success', { dot: true }) : TH.badge('Thực tế · chưa khóa kỳ', 'warning', { dot: true });
  };
  TH.perfProvLabel = function () { return 'Tạm tính đến ' + F.date(TH.TODAY) + ' — chưa áp trọng số'; };
  /* Gói A chưa tách dịch vụ → chỉ số sơ bộ, không đặt tên giống HS đầy đủ (QA-ANSWERS §6) */
  TH.hsName = function () { return TH.has('F033.B') ? 'Hiệu suất' : 'Chỉ số sơ bộ'; };

  /* Bảng các bước A → D → HS cho một tòa/kỳ */
  TH.perfSteps = function (r) {
    var t = TH.perfTier(r);
    function row(k, label, formula, value, cls) {
      return '<div class="perf-row' + (cls ? ' ' + cls : '') + '"><span class="perf-k">' + k + '</span><div class="perf-t"><b>' + label + '</b>' + (formula ? '<div class="small muted">' + formula + '</div>' : '') + '</div><div class="perf-v tnum">' + value + '</div></div>';
    }
    var cs = [];
    if (r.arising) cs.push('tiền phòng phát sinh ' + F.money(r.arising) + ' (' + r.arisingList.map(function (a) { return esc(a.roomId); }).join(', ') + ')');
    if (r.forfeit) cs.push('khách bỏ cọc ' + F.money(r.forfeit) + ' (' + r.forfeitList.map(function (d) { return esc(d.roomId); }).join(', ') + ')');
    return '<div class="perf-steps">' +
      row('M', 'Doanh thu lũy kế theo mốc', 'Phiếu thu đã xác nhận theo ngày thực nhận: đến ngày 5 · 10 · 15', F.money(r.cum5) + ' · ' + F.money(r.cum10) + ' · ' + F.money(r.cum15)) +
      row('A', 'Doanh thu sau ba mốc', 'M5 × 100% + (M10 − M5) × 90% + (M15 − M10) × 70% · thu sau ngày 15 (' + F.money(r.late) + ') tính 0%', F.money(Math.round(r.A))) +
      TH.gate('F033.B', row('B', 'Tỷ lệ dịch vụ ' + TH.up('F033.B'), 'Dịch vụ phải thu ' + F.money(r.svc) + ' ÷ doanh thu phải thu ' + F.money(r.rev) + ' → trừ A × B = ' + F.money(Math.round(r.A * r.B)), F.pct(r.B, 2)), { label: 'Tách tỷ lệ dịch vụ khỏi doanh thu', lines: 1 }) +
      TH.gate('F033.C', row('C', 'Doanh thu thu thêm ' + TH.up('F033.C'), cs.length ? cs.join(' + ') : 'Không có tiền phòng phát sinh đã thu đủ hoặc khoản khách bỏ cọc trong kỳ', F.money(r.C)), { label: 'Cộng tiền phòng phát sinh và khoản khách bỏ cọc', lines: 1 }) +
      row('D', 'Doanh thu tiền phòng quy đổi', (t.useB ? 'A − A × B' : 'A') + (t.useC ? ' + C' : ''), '<b>' + F.money(Math.round(t.D)) + '</b>', 'is-total') +
      row('N', 'Tổng giá niêm yết', r.rooms + ' phòng của tòa trong kỳ (mọi trạng thái)', F.money(r.listed)) +
      row('HS', TH.hsName() + (t.useB ? ' ' : ' (chưa tách dịch vụ) ') + TH.perfState(r), 'D ÷ tổng giá niêm yết · ' + TH.perfProvLabel() + ': ' + F.pct(t.hsProv, 1), r.closed ? TH.hsCell(t.hs) : '<span class="muted">chờ mốc 15</span>', 'is-total') +
      (r.prepaidList && r.prepaidList.length ? '<div class="perf-row is-warn"><span class="perf-k">TH1</span><div class="perf-t"><b>Thu trước nhiều tháng — số chuẩn hóa ' + TH.openBadge('', 'chờ duyệt G-03') + '</b><div class="small muted">' + r.prepaidList.map(function (x) { return esc(x.roomId) + ' đóng ' + x.months + ' tháng: ' + F.money(x.amount) + ' thuộc tháng sau'; }).join(', ') + '. DT phải thu chuẩn hóa = ' + F.money(r.rev) + ' − ' + F.money(r.prepaidFuture) + ' = <b>' + F.money(r.revNorm) + '</b> (P&L đã phân bổ mỗi tháng 1 tháng tiền phòng; HS chưa áp).</div></div><div class="perf-v tnum">−' + F.money(r.prepaidFuture) + '</div></div>' : '') +
      (r.th1.length ? '<div class="perf-row is-warn"><span class="perf-k">TH1</span><div class="perf-t"><b>Kỳ có cọc mới — cần chuẩn hóa ' + TH.openBadge('', 'chờ chốt G-03') + '</b><div class="small muted">' + r.th1.map(function (d) { return esc(d.roomId) + ' cọc ' + F.money(d.amount); }).join(', ') + '. Theo tài liệu lương: DT phải thu và DT M5 trừ cọc mới và tiền thuê tháng tương lai thu trước; phòng đóng 3 tháng trừ 2 tháng (cộng 1 tháng vào kỳ hưởng). Mockup chưa áp — cần ví dụ có số để chốt.</div></div><div class="perf-v tnum">' + F.money(C.sum(r.th1, function (d) { return d.amount; })) + '</div></div>' : '') +
      '</div>';
  };

  /* Bảng hiệu suất theo tòa (RPT-02, PAY-02) */
  TH.perfTable = function (p, bs, opts) {
    opts = opts || {};
    var rows = bs.map(function (b) { var r = C.perfBuilding(p, b.id); r.b = b; r.t = TH.perfTier(r); return r; });
    var agg = C.perfAgg(p, bs.map(function (b) { return b.id; })), at = { D: C.sum(rows, function (r) { return r.t.D; }), Dprov: C.sum(rows, function (r) { return r.t.Dprov; }) };
    var cols = [{ key: 'b', label: 'Tòa', render: function (r) { return '<div class="cell-main"><a href="' + TH.router.href('BLD-02', r.b.id) + '">' + esc(r.b.short) + '</a></div><div class="cell-sub">QL: ' + esc(C.staffName(r.b.managerId)) + '</div>'; } }];
    if (opts.buckets) cols = cols.concat([
      { key: 'm5', label: '≤ ngày 5 · 100%', num: true, render: function (r) { return F.money(r.m5); } },
      { key: 'm10', label: '≤ ngày 10 · 90%', num: true, render: function (r) { return F.money(r.m10); } },
      { key: 'm15', label: '≤ ngày 15 · 70%', num: true, render: function (r) { return F.money(r.m15); } },
      { key: 'late', label: 'Sau 15 · 0%', num: true, render: function (r) { return F.money(r.late); } },
    ]);
    cols = cols.concat([
      { key: 'A', label: 'A · sau 3 mốc', num: true, render: function (r) { return F.money(Math.round(r.A)); } },
      { key: 'B', label: 'B · tỷ lệ dịch vụ', num: true, gate: 'F033.B', render: function (r) { return r.rev ? F.pct(r.B, 1) : '<span class="muted">—</span>'; } },
      { key: 'C', label: 'C · thu thêm', num: true, gate: 'F033.C', render: function (r) { return r.C ? F.money(r.C) : '<span class="muted">0</span>'; } },
      { key: 'D', label: 'D · quy đổi', num: true, render: function (r) { return '<b class="pos">' + F.money(Math.round(r.t.D)) + '</b>'; } },
      { key: 'N', label: 'Giá niêm yết', num: true, render: function (r) { return F.money(r.listed); } },
      { key: 'hs', label: TH.has('F033.B') ? 'HS thực tế' : 'Chỉ số sơ bộ (chưa tách DV)', num: true, render: function (r) { return r.invoices ? (r.closed ? TH.hsCell(r.t.hs) : '<span class="muted small">chờ mốc 15</span>') : '<span class="muted small">chưa lập hóa đơn</span>'; } },
      { key: 'hp', label: TH.has('F033.B') ? 'HS tạm tính' : 'Sơ bộ tạm tính', num: true, render: function (r) { return r.invoices ? TH.hsCell(r.t.hsProv, true) : '<span class="muted">—</span>'; } },
      { key: 'o', label: 'Lấp đầy (riêng)', num: true, render: function (r) { return F.pct(r.occ, 0) + '<div class="cell-sub">' + r.occupied + '/' + r.rentable + ' phòng cho thuê được</div>'; } },
    ]);
    return TH.table({
      label: 'Hiệu suất theo tòa', cols: cols, rows: rows,
      foot: bs.length > 1 ? { _label: '<b>Tổng</b>', m5: F.money(agg.m5), m10: F.money(agg.m10), m15: F.money(agg.m15), late: F.money(agg.late), A: F.money(Math.round(agg.A)), B: F.pct(agg.B, 1), C: F.money(agg.C), D: '<b>' + F.money(Math.round(at.D)) + '</b>', N: F.money(agg.listed), hs: agg.closed ? TH.hsCell(agg.listed ? at.D / agg.listed : 0) : '—', hp: TH.hsCell(agg.listed ? at.Dprov / agg.listed : 0, true), o: F.pct(agg.occ, 0) } : null,
      empty: { title: 'Không có tòa trong phạm vi' },
    });
  };
  /* Sheet Excel hiệu suất theo tòa (dùng cho PAY-02, RPT-02) */
  TH.perfSheet = function (p, bs) {
    var rows = bs.map(function (b) { var r = C.perfBuilding(p, b.id), t = TH.perfTier(r); return [b.name, r.cum5, r.cum10, r.cum15, r.late, Math.round(r.A), t.useB ? r.B : null, t.useC ? r.C : null, Math.round(t.D), r.listed, r.invoices && r.closed ? t.hs : null, r.invoices ? t.hsProv : null, r.occ]; });
    return { name: 'Hieu suat', title: 'Hiệu suất tòa theo mốc 5/10/15 — kỳ ' + F.period(p), note: 'DRAFT · HS% = [A − A×B + C] ÷ tổng giá niêm yết (note khách 20/10/2026, D-04) · B/C theo gói đang xem',
      columns: [{ label: 'Tòa', width: 26 }, { label: 'DT M5 (lũy kế)', type: 'money' }, { label: 'DT M10 (lũy kế)', type: 'money' }, { label: 'DT M15 (lũy kế)', type: 'money' }, { label: 'Thu sau 15', type: 'money' }, { label: 'A · sau 3 mốc', type: 'money' }, { label: 'B · tỷ lệ dịch vụ', type: 'pct' }, { label: 'C · thu thêm', type: 'money' }, { label: 'D · quy đổi', type: 'money' }, { label: 'Tổng giá niêm yết', type: 'money' }, { label: TH.has('F033.B') ? 'HS thực tế' : 'Chỉ số sơ bộ (chưa tách DV)', type: 'pct' }, { label: 'Tạm tính đến ' + F.date(TH.TODAY) + ' (chưa áp trọng số)', type: 'pct' }, { label: 'Lấp đầy (riêng)', type: 'pct' }],
      rows: rows };
  };
  TH.perfFormulaNote = function () {
    return '<span class="small muted">' + I('info', 'ic-sm') + ' HS% = [A − A × B + C] ÷ tổng giá niêm yết. A: M5/M10/M15 là thu lũy kế đã xác nhận theo ngày thực nhận, trọng số 100/90/70, thu sau 15 = 0 (vẫn giảm công nợ); B, C bật theo gói (B+, C+); làm tròn một lần ở bước cuối. Tạm tính = đến thời điểm xem, chưa áp trọng số. Lấp đầy = phòng đang thuê ÷ phòng cho thuê được, tính riêng. Nhánh TH1 (cọc mới / đóng 3 tháng) chờ chốt — PROPOSED (G-01…G-03).</span>';
  };
})();
