/* Supplemental evidence for the synthetic dataset, using shared UI components. */
(function () {
  var esc = TH.esc, F = TH.fmt;
  function allowed() { return TH.can('view.all'); }
  function deny() { TH.toast('Không đủ quyền', 'Chỉ Admin và Kế toán được đối chiếu toàn bộ dữ liệu mẫu.', 'warning'); }
  function sourceText(r) { return r.source.file + (r.source.sheet ? ' · ' + r.source.sheet : '') + (r.source.cell ? ' · ' + r.source.cell : ''); }
  TH.datasetSourceHtml = function (b) {
    if (!b || !TH.dataset) return '';
    var r = TH.dataset.rule(b.ruleId);
    if (!r) return '';
    return '<div class="alert alert-info u-mt-16"><div class="alert-body"><b>Dữ liệu mô phỏng · ' + esc(r.title) + '</b><p>' + esc(r.formula) + '</p><div class="small">Căn cứ cấu trúc: ' + esc(sourceText(r)) + '</div><div class="small">' + esc(r.difference) + '</div></div></div>';
  };
  TH.act['dataset.review'] = function () {
    if (!allowed()) return deny();
    TH.modal.open({ key: 'dataset-review', kind: 'drawer', render: function () {
      var ds = TH.db.dataset;
      return { title: 'Dữ liệu mô phỏng theo tài liệu', sub: ds ? ds.description : 'Bạn đang dùng dữ liệu đã lưu từ phiên bản trước',
        body: '<div class="stack">' + TH.kv([['Bộ dữ liệu', ds ? ds.version : 'Bản đã lưu trước excel-demo-v1'], ['Quy mô', TH.db.buildings.length + ' tòa · ' + TH.db.rooms.length + ' phòng'], ['Kỳ', '05–10/2026'], ['Căn cứ', '13 workbook · 248 sheet; Word, PDF và sơ đồ tổ chức']]) +
          '<p class="muted">Thông tin và số tiền được tạo cho demo. Công thức chưa chốt vẫn là đề xuất; dữ liệu đang lưu chỉ đổi khi bạn chọn khôi phục.</p>' +
          (ds ? '<div class="section-title">Tình huống nghiệp vụ</div>' + ds.scenarios.map(function (s) {
            return '<div><button type="button" class="btn btn-link" data-act="dataset.scenario" data-id="' + esc(s.id) + '">' + esc(s.title) + '</button><div class="small muted">Kỳ ' + F.period(s.period) + '</div></div>';
          }).join('') : '<div class="alert alert-info">Mở Công cụ demo → Khôi phục để nạp bộ dữ liệu mới khi bạn muốn kết thúc phiên hiện tại.</div>') + '</div>',
        foot: '<button type="button" class="btn" data-close>Đóng</button>' };
    } });
  };
  TH.act['dataset.scenario'] = function (el) {
    if (!allowed()) return deny();
    var s = TH.db.dataset && TH.db.dataset.scenarios.find(function (x) { return x.id === el.dataset.id; });
    if (!s) return;
    TH.modal.open({ key: 'dataset-scenario', size: 'lg', render: function () {
      var r = TH.dataset.rule(s.ruleId), extra = '';
      if (s.id === 'DS-02') extra = TH.table({ cols: [
        { label: 'Tòa', kind: 'identity', render: function (x) { return esc(TH.calc.building(x.buildingId).short); } },
        { label: 'Kỳ', kind: 'date', render: function (x) { return F.period(x.period); } },
        { label: 'Hóa đơn nguồn', render: function (x) { return esc(x.id); } },
        { label: 'Số tiền', kind: 'money', render: function (x) { return F.money(x.amount); } },
        { label: 'Chi phí liên kết', render: function (x) { return esc(x.expenseId); } }
      ], rows: TH.db.supplierBills.filter(function (x) { return x.period === s.period; }), label: 'Hóa đơn dịch vụ đầu vào kỳ ' + F.period(s.period) });
      if (s.id === 'DS-08' || s.id === 'DS-09') {
        var rows = s.id === 'DS-08' ? TH.db.repairJobs : TH.db.commissions;
        extra = rows.map(function (x) {
          var amount = x.lines ? x.lines.reduce(function (n, l) { return n + l.qty * l.unitPrice; }, 0) : x.amount;
          return '<div class="card"><div class="card-bd"><b>' + esc(x.description || ('Hoa hồng ' + x.roomId)) + '</b>' + TH.kv([['Kỳ', F.period(x.period)], ['Số tiền', F.money(amount)], ['Cách tính', x.lines ? x.lines.map(function (l) { return l.name + ': ' + l.qty + ' × ' + F.money(l.unitPrice); }).join('; ') : F.money(x.rent) + ' × ' + F.pct(x.rate)], ['Chi phí liên kết', x.expenseId || (x.extraFeeId ? 'Khách chi · phí phát sinh ' + x.extraFeeId : 'Trước kỳ demo — lịch sử đã chi')], ['Trạng thái', TH.statusLabel((TH.db.expenses.find(function (e) { return e.id === x.expenseId; }) || x).status)]].concat(x.lines
            ? [['Phòng / khu vực', esc(x.roomId || x.area || '—')], ['Kỹ thuật', esc(TH.calc.staffName(x.technicianId))], ['Bên chi', x.payer === 'customer' ? 'Khách' : 'Công ty']]
            : [['Kênh', esc(x.team) + (x.staffId ? ' · ' + esc(TH.calc.staffName(x.staffId)) : '')], ['Thời hạn HĐ', esc(x.term)], ['Khách đóng', esc(x.tenantPaid)], ['Ngày trả HH', x.paidAt ? F.date(x.paidAt) : '—']])) + '</div></div>';
        }).join('');
      }
      if (s.id === 'DS-13') extra = TH.db.forecastPlans.map(function (p) { var v = TH.dataset.forecast(p); return '<div class="card"><div class="card-bd"><b>' + esc(TH.calc.building(p.buildingId).short) + '</b>' + TH.kv([['Cơ sở', 'Báo cáo KD kỳ ' + F.period(p.baselinePeriod)], ['Doanh thu dự kiến', F.money(v.revenue)], ['Chi phí dự kiến', F.money(v.costs)], ['Lợi nhuận dự kiến', F.money(v.profit)]]) + '<p class="small muted">' + esc(p.assumptions) + '</p></div></div>'; }).join('');
      var screen = s.id === 'DS-03' || s.id === 'DS-04' ? 'INV-02' : s.id === 'DS-05' || s.id === 'DS-06' ? 'PAY-02' : s.id === 'DS-10' ? 'SAL-01' : s.id === 'DS-08' || s.id === 'DS-09' ? 'EXP-01' : s.id === 'DS-14' ? 'REPORTS' : s.id === 'DS-07' || s.id === 'DS-16' ? 'CUS-01' : s.id === 'DS-17' ? 'HR-01' : 'BLD-01';
      return { title: s.title, sub: 'Dữ liệu mô phỏng · kỳ ' + F.period(s.period),
        body: '<div class="stack">' + TH.kv([['Công thức', r.formula], ['Ví dụ', r.example], ['Đơn vị', r.unit], ['Làm tròn', r.rounding], ['Căn cứ', sourceText(r)], ['Đối chiếu', r.difference]]) + extra +
          '<details><summary>Bản ghi liên quan</summary><p class="small">' + s.refs.map(esc).join(' · ') + '</p></details></div>',
        foot: '<button type="button" class="btn" data-close>Đóng</button><button type="button" class="btn btn-primary" data-act="dataset.open" data-screen="' + screen + '" data-period="' + s.period + '">Mở màn nghiệp vụ</button>' };
    } });
  };
  TH.act['dataset.open'] = function (el) {
    if (!allowed()) return deny();
    TH.editGuard.run(function () {
      TH.modal.stack.slice().forEach(function (m) { TH.modal.close(m.key, { silent: true }); });
      TH.store.set('period', el.dataset.period); TH.go(el.dataset.screen);
    });
  };
})();
