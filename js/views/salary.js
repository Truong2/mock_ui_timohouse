/* Lương: SAL-01 (thiết lập & bảng lương nháp), SAL-ADJ (điều chỉnh kỳ). F039–F041 (+F033). */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;
  var S = 'SAL-01';

  function rows(p) {
    var auto = TH.has('F040.B'), form = 'sal-' + p;
    return C.payroll(p).map(function (r) {
      var manual = TH.store.draft(form, r.staff.id + '.dt');
      var dt = auto || manual === undefined || manual === '' ? Math.round(r.dtD) : +String(manual).replace(/\D/g, '');
      var pp = C.perfPay(r.staff, dt, r.listed, r.rooms, p);
      var base = +TH.store.draft(form, r.staff.id + '.base', r.base), allow = +TH.store.draft(form, r.staff.id + '.allow', r.allowance);
      return Object.assign({}, r, { dt: dt, hs: pp.hs, perRoom: pp.perRoom, perf: pp.pay, base: base, allowance: allow, total: base + allow + pp.pay + r.lead + r.adj, dirty: base !== r.base || allow !== r.allowance });
    });
  }
  TH.salaryRows = rows;

  TH.views[S] = {
    scan: function () { return [{ ui: { tab: 'sheet' } }, { ui: { tab: 'setup' } }]; },
    render: function () {
      var p = TH.store.state.period, list = rows(p), st = TH.db.payrollStatus[p] || { status: 'draft' };
      var locked = st.status === 'locked', form = 'sal-' + p;
      var tabs = [{ id: 'sheet', label: 'Bảng lương nháp', icon: 'calculator' }, { id: 'setup', label: 'Thiết lập mức lương', icon: 'settings' }];
      var tab = TH.resolveTab(S, tabs);
      var auto = TH.has('F040.B'), editable = TH.can('salary.edit') && !locked;
      var content;
      if (tab === 'sheet') {
        content = TH.table({
          label: 'Bảng lương nháp',
          cols: [
            { key: 'n', label: 'Nhân viên', render: function (r) { return TH.personCell(r.staff.name, esc(r.staff.id + ' · ' + r.staff.title)); } },
            { key: 'b', label: 'Lương cố định', num: true, render: function (r) { return F.money(r.base); } },
            { key: 'a', label: 'Phụ cấp (ăn trưa, xăng xe)', num: true, render: function (r) { return F.money(r.allowance); } },
            { key: 'rooms', label: 'Số phòng · DT niêm yết', num: true, render: function (r) { return r.buildings.length ? '<b>' + r.rooms + '</b> · <span class="small">' + F.short(r.listed) + '</span>' : '<span class="muted small">Không phụ trách tòa</span>'; } },
            { key: 'dt', label: auto ? 'DT tiền phòng sau 3 mốc (tự kéo)' : 'DT tiền phòng sau 3 mốc (nhập tay)', labelHtml: auto ? 'DT tiền phòng sau 3 mốc ' + TH.badge('Tự kéo 5/10/15', 'teal') : 'DT tiền phòng sau 3 mốc <span class="small muted">(nhập tay)</span>', num: true, render: function (r) {
              if (!r.buildings.length) return '<span class="muted">—</span>';
              if (auto) return '<a href="' + TH.router.href('PAY-02') + '" data-tip="Nguồn: phiếu thu đã xác nhận theo mốc 5/10/15 tại ' + esc(r.buildings.join(', ')) + ': D = A − A × B + C (đã trừ tỷ lệ dịch vụ, cộng tiền phòng phát sinh và khách bỏ cọc)">' + F.money(r.dt) + '</a>';
              return editable ? '<label class="sr-only" for="dt-' + r.staff.id + '">DT tiền phòng ' + esc(r.staff.name) + '</label><input id="dt-' + r.staff.id + '" class="input-cell" inputmode="numeric" value="' + r.dt + '" data-draft="' + form + '.' + r.staff.id + '.dt" data-live>' : F.money(r.dt);
            } },
            { key: 'hs', label: 'Hiệu suất %', num: true, render: function (r) { return r.buildings.length ? '<b class="' + (r.hs >= 90 ? 'pos' : r.hs < 70 ? 'warn-text' : '') + '">' + F.pct(r.hs / 100, 1) + '</b>' : '<span class="muted">—</span>'; } },
            { key: 'pr', label: 'Mức lương / phòng', num: true, render: function (r) { return r.buildings.length ? F.money(r.perRoom) + '<div class="cell-sub">' + (r.senior ? 'thâm niên ≥ 1 năm' : 'dưới 1 năm') + ' · ' + F.short(r.rate) + '@90%</div>' : '<span class="muted">—</span>'; } },
            { key: 'p', label: 'Lương HS', num: true, render: function (r) { return r.perf ? F.money(r.perf) : '<span class="muted">0</span>'; } },
            { key: 'lead', label: 'Lương trưởng nhóm', num: true, render: function (r) { return r.lead ? F.money(r.lead) + '<div class="cell-sub">' + r.teamRooms + ' phòng × 10.000</div>' : '<span class="muted">0</span>'; } },
            { key: 'tier', label: 'Bậc HS', gate: 'F040.C', render: function (r) { return r.buildings.length ? TH.badge(r.hs >= 90 ? 'Bậc ≥ 90%' : r.hs >= 80 ? 'Bậc 80–90%' : 'Dưới 80%', 'info') : '—'; } },
            { key: 'd', label: 'Điều chỉnh', num: true, render: function (r) { return r.adj ? '<a href="' + TH.router.href('SAL-ADJ', r.staff.id) + '" class="' + (r.adj < 0 ? 'neg' : 'pos') + '">' + F.money(r.adj) + '</a>' : '<span class="muted">0</span>'; } },
            { key: 't', label: 'Tổng nháp', num: true, render: function (r) { return '<b>' + F.money(r.total) + '</b>'; } },
            { key: 'tr', label: 'Truy vết', gate: 'F040.D', render: function (r) { return '<span class="small muted">' + (r.buildings.length ? 'HS-01 v0.3 · ' + r.buildings.join(',') : 'Cố định') + '</span>'; } },
          ],
          rows: list,
          foot: { _label: '<b>Tổng (' + list.length + ' NV)</b>', t: '<b>' + F.money(C.sum(list, function (r) { return r.total; })) + '</b>', p: F.money(C.sum(list, function (r) { return r.perf; })) },
        });
      } else {
        content = TH.table({
          label: 'Thiết lập mức lương',
          cols: [
            { key: 'n', label: 'Nhân viên', render: function (r) { return TH.personCell(r.staff.name, esc(r.staff.title)); } },
            { key: 'b', label: 'Lương tháng', num: true, render: function (r) { return editable ? '<label class="sr-only" for="sb-' + r.staff.id + '">Lương ' + esc(r.staff.name) + '</label><input id="sb-' + r.staff.id + '" class="input-cell" inputmode="numeric" value="' + r.base + '" data-draft="' + form + '.' + r.staff.id + '.base" data-live>' : F.money(r.base); } },
            { key: 'a', label: 'Phụ cấp cố định', num: true, render: function (r) { return editable ? '<label class="sr-only" for="sa-' + r.staff.id + '">Phụ cấp ' + esc(r.staff.name) + '</label><input id="sa-' + r.staff.id + '" class="input-cell" inputmode="numeric" value="' + r.allowance + '" data-draft="' + form + '.' + r.staff.id + '.allow" data-live>' : F.money(r.allowance); } },
            { key: 'e', label: 'Hiệu lực từ', render: function () { return F.period(TH.store.state.period); } },
            { key: 'v', label: 'Phiên bản', gate: 'F039.C', render: function (r) { return r.dirty ? TH.badge('v2 · chờ kế toán', 'draft') : 'v1'; } },
            { key: 'pol', label: 'Bộ chính sách', gate: 'F039.D', render: function (r) { return '<span class="small">' + esc({ admin: 'CS-Quản lý', accountant: 'CS-Văn phòng', manager: 'CS-Vận hành', staff: 'CS-Vận hành', hr: 'CS-Văn phòng' }[r.staff.role] || '—') + '</span>'; } },
          ],
          rows: list,
        }) + '<div class="card-ft"><span class="small muted">Lương đã xác nhận kỳ cũ không đổi theo mức mới.</span>' + (editable ? '<button type="button" class="btn btn-sm btn-primary" data-act="sal.saveSetup"' + (list.some(function (r) { return r.dirty; }) ? '' : ' disabled') + '>Lưu mức lương</button>' : '') + '</div>';
      }
      TH.app.guard = null;
      var flow = [['draft', 'Nháp'], ['preview', 'Duyệt preview'], ['locked', 'Khóa kỳ']];
      var approve = '<div class="card">' + TH.cardHd(I('fileCheck', 'ic-sm') + 'Xác nhận bảng lương', 'Kỳ ' + F.period(p)) + '<div class="card-bd stack-sm">' +
        '<div class="small">' + TH.tierPill('A') + ' Kế toán xác nhận bằng file Excel ngoài hệ thống.</div>' +
        (st.status === 'confirmed' ? TH.badge('Đã xác nhận ngoài hệ thống · ' + F.date(st.at), 'success', { icon: 'check' }) : '') +
        '<div class="row">' + TH.exportBtn('sal.xlsx', 'Xuất Excel (.xlsx)') + (st.status === 'draft' && TH.can('salary.edit') ? '<button type="button" class="btn btn-sm" data-act="sal.extConfirm">Đánh dấu đã xác nhận (Excel)</button>' : '') + '</div>' +
        TH.gate('F041.B', '<div class="divider u-my-8"></div><div class="small">' + TH.tierPill('B') + ' Duyệt bản preview trong phần mềm</div>' + (st.status === 'preview' || locked ? TH.badge('Đã duyệt preview', 'success') : TH.permBtn('salary.edit', '<button type="button" class="btn btn-sm btn-soft" data-act="sal.preview">' + I('eye', 'ic-sm') + 'Duyệt preview</button>', '403')), { mode: 'mini', label: 'Duyệt bản xem trước trong phần mềm' }) +
        TH.gate('F041.C', '<div class="divider u-my-8"></div><div class="small">' + TH.tierPill('C') + ' Khóa kỳ & audit số liệu</div>' + (locked ? TH.badge('Đã khóa kỳ lương', 'neutral', { icon: 'lock' }) : TH.permBtn('salary.edit', '<button type="button" class="btn btn-sm" data-act="sal.lock">' + I('lock', 'ic-sm') + 'Khóa kỳ lương</button>', '403')), { mode: 'mini', label: 'Khóa kỳ/duyệt và nhật ký số liệu' }) +
        TH.gate('F041.D', '<div class="divider u-my-8"></div><div class="small">' + TH.tierPill('D') + ' Phiếu chi lương thủ công & kiểm soát chênh lệch: bảng lương ' + F.money(C.sum(list, function (r) { return r.total; })) + ' vs phiếu chi 0 ₫ → chênh ' + F.money(C.sum(list, function (r) { return r.total; })) + ' (chưa chi).</div>', { mode: 'mini', label: 'Phiếu chi lương thủ công' }) +
        '</div></div>';
      var policy = '<div class="card">' + TH.cardHd(I('calculator', 'ic-sm') + 'Rule tính nháp', null, TH.openBadge('D-06')) + '<div class="card-bd stack-sm">' +
        TH.kv([['Công thức', 'Lương cơ bản + phụ cấp + lương HS + lương trưởng nhóm + điều chỉnh'], ['A · DT sau 3 mốc', 'M5 × 100% + (M10 − M5) × 90% + (M15 − M10) × 70%'], ['B · tỷ lệ dịch vụ', 'DV phải thu ÷ DT phải thu'], ['C · thu thêm', 'Tiền phòng phát sinh đã thu đủ + khoản khách bỏ cọc'], ['Hiệu suất', 'HS% = (A − A × B + C) ÷ tổng giá niêm yết'], ['Mức lương/phòng', 'HS × đơn giá tham chiếu ÷ 90 (' + F.money(TH.db.salaryPolicy.ratePerRoom.senior) + ' thâm niên ≥ 1 năm · ' + F.money(TH.db.salaryPolicy.ratePerRoom.junior) + ' dưới 1 năm)'], ['Lương HS', 'mức lương/phòng × số phòng phụ trách'], ['Trưởng nhóm', F.money(TH.db.salaryPolicy.leaderPerRoom) + ' × số phòng của đội'], ['Nguồn DT', auto ? 'Tự kéo từ mốc 5/10/15 (B)' : 'Nhập tay từ báo cáo PAY-02 (A)']]) +
        '<div class="small muted">Theo tài liệu “Cách tính lương phòng vận hành” và note khách 20/10/2026. Nhánh điều chỉnh khi có cọc mới / đóng tiền theo kỳ 3 tháng và bảng tham chiếu đầy đủ chưa chốt.</div>' +
        TH.gate('F040.B', '', { mode: 'mini', label: 'Tự đưa mốc 5/10/15 vào bản nháp' }) +
        TH.gate('F040.C', '<div class="small">' + TH.tierPill('C') + ' Bậc hiệu suất / thâm niên: Bậc 1 ≤ 15 tr; Bậc 2 > 15 tr (bảng nguồn chờ duyệt).</div>', { mode: 'mini', label: 'Bậc hiệu suất/thâm niên' }) +
        TH.gate('F040.D', '<div class="small">' + TH.tierPill('D') + ' Nhánh công thức: phòng mới, khách trả trước, cọc — ngoại lệ lương đã ký, có truy vết.</div>', { mode: 'mini', label: 'Công thức nhiều nhánh' }) +
        '<div class="alert alert-draft">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Mâu thuẫn trong tài liệu lương (D-06)</b><span>Trang 1 ghi mức lương/phòng = HS × đơn giá ÷ 100, ví dụ lại tính 91 × 110.000 ÷ 90 = 111.222. Bản nháp đang dùng ÷ 90 cho mọi bậc — <b>chưa được chọn chính thức</b>; không dùng số này để trả lương.</span></div></div>' +
        '<div class="small muted">Chưa chốt bảng bậc/đặc lệ thì kế toán review bằng tay.</div></div></div>';
      var actions = TH.gate('F039.B', TH.permBtn('salary.edit', '<button type="button" class="btn" data-act="sal.import">' + I('upload', 'ic-sm') + 'Import bảng lương nguồn' + TH.up('F039.B') + '</button>', '403'), { mode: 'btn', label: 'Import bảng lương nguồn' }) +
        '<a class="btn" href="' + TH.router.href('SAL-ADJ') + '">' + I('edit', 'ic-sm') + 'Điều chỉnh</a>' + TH.exportBtn('sal.xlsx', 'Xuất Excel (.xlsx)');
      return TH.pageHeader({ screen: S, status: TH.badge('Bảng lương ' + { draft: 'nháp', confirmed: 'đã xác nhận (Excel)', preview: 'đã duyệt preview', locked: 'đã khóa' }[st.status], st.status === 'locked' ? 'neutral' : 'draft', { dot: true }), desc: 'Lương cơ bản + phụ cấp + lương hiệu suất (HS% = [A − A × B + C] ÷ tổng giá niêm yết) + lương trưởng nhóm + điều chỉnh kế toán. Bảng lương nháp không tạo chi tiền.', actions: actions }) +
        '<div class="grid-4 u-mb-16">' + TH.kpi({ label: 'Tổng lương nháp', icon: 'calculator', value: F.short(C.sum(list, function (r) { return r.total; })), accent: true }) + TH.kpi({ label: 'Cơ bản + phụ cấp', value: F.short(C.sum(list, function (r) { return r.base + r.allowance; })) }) + TH.kpi({ label: 'Lương HS + trưởng nhóm', value: F.short(C.sum(list, function (r) { return r.perf + r.lead; })), href: TH.router.href('PAY-02'), foot: 'Nguồn: mốc 5/10/15 · HS% = D ÷ giá niêm yết' }) + TH.kpi({ label: 'Điều chỉnh', value: F.short(C.sum(list, function (r) { return r.adj; })), href: TH.router.href('SAL-ADJ') }) + '</div>' +
        '<div class="card card-flush u-mb-16">' + TH.tabs(S, tabs, tab) + content + '</div><div class="grid-2">' + approve + policy + '</div>';
    },
  };
  TH.act['sal.xlsx'] = function () {
    var p = TH.store.state.period, list = rows(p);
    TH.exportXlsx('Bang_luong_nhap_ky_' + p, [{ name: 'Luong nhap', title: 'Bảng hiệu suất & lương nháp kỳ ' + F.period(p), note: 'NHÁP · Kế toán xác nhận ngoài hệ thống · bảng tham chiếu mức lương/phòng chờ chốt (D-06)', columns: [{ label: 'Mã NV' }, { label: 'Họ tên', width: 24 }, { label: 'Chức vụ', width: 22 }, { label: 'Lương cơ bản', type: 'money' }, { label: 'Phụ cấp', type: 'money' }, { label: 'Số phòng', type: 'number', width: 10 }, { label: 'DT niêm yết', type: 'money' }, { label: 'DT tiền phòng sau 3 mốc', type: 'money', width: 22 }, { label: 'Hiệu suất', type: 'pct' }, { label: 'Mức lương/phòng', type: 'money' }, { label: 'Lương HS', type: 'money' }, { label: 'Lương trưởng nhóm', type: 'money' }, { label: 'Điều chỉnh', type: 'money' }, { label: 'Tổng nháp', type: 'money' }, { label: 'Kế toán xác nhận', width: 18 }],
      rows: list.map(function (r) { return [r.staff.id, r.staff.name, r.staff.title, r.base, r.allowance, r.rooms || null, r.listed || null, r.dt || null, r.buildings.length ? r.hs / 100 : null, r.perRoom || null, r.perf, r.lead, r.adj, r.total, '']; }), totals: ['Tổng', '', '', C.sum(list, function (r) { return r.base; }), C.sum(list, function (r) { return r.allowance; }), C.sum(list, function (r) { return r.rooms; }), C.sum(list, function (r) { return r.listed; }), C.sum(list, function (r) { return r.dt; }), null, null, C.sum(list, function (r) { return r.perf; }), C.sum(list, function (r) { return r.lead; }), C.sum(list, function (r) { return r.adj; }), C.sum(list, function (r) { return r.total; }), ''] }]);
    TH.toast('Đã xuất bảng lương nháp', '.xlsx');
  };
  TH.act['sal.extConfirm'] = function () { var p = TH.store.state.period; TH.db.payrollStatus[p] = { status: 'confirmed', by: TH.me().id, at: TH.TODAY, note: 'Xác nhận ngoài hệ thống' }; TH.log('Xác nhận bảng lương (Excel)', 'Kỳ ' + F.period(p), '', 'salary'); TH.app.refresh(); TH.toast('Đã đánh dấu xác nhận', 'Theo file Excel ngoài hệ thống.'); };
  TH.act['sal.preview'] = function () { var p = TH.store.state.period; TH.db.payrollStatus[p] = { status: 'preview', by: TH.me().id, at: TH.TODAY }; TH.log('Duyệt preview bảng lương', 'Kỳ ' + F.period(p), '', 'salary'); TH.app.refresh(); TH.toast('Đã duyệt bản preview', 'Bảng lương vẫn là nháp, chưa chi tiền.'); };
  TH.act['sal.lock'] = function () {
    var p = TH.store.state.period;
    TH.confirm({ title: 'Khóa kỳ lương ' + F.period(p) + '?', body: '<p>Sau khóa, thay đổi phải qua điều chỉnh mới có audit.</p>', ok: 'Khóa kỳ lương' }).then(function (ok) { if (!ok) return; TH.db.payrollStatus[p] = { status: 'locked', by: TH.me().id, at: TH.TODAY }; TH.log('Khóa kỳ lương', 'Kỳ ' + F.period(p), '', 'salary'); TH.app.refresh(); TH.toast('Đã khóa kỳ lương', ''); });
  };
  TH.act['sal.saveSetup'] = function () {
    var p = TH.store.state.period, form = 'sal-' + p;
    rows(p).forEach(function (r) { if (r.dirty) { r.staff.base = r.base; r.staff.allowance = r.allowance; TH.log('Đổi mức lương', r.staff.id, F.money(r.base) + ' + ' + F.money(r.allowance), 'salary'); } TH.store.setDraft(form, r.staff.id + '.base', undefined); TH.store.setDraft(form, r.staff.id + '.allow', undefined); });
    TH.app.refresh(); TH.toast('Đã lưu mức lương', TH.has('F039.C') ? 'Lưu phiên bản mới, chờ kế toán xác nhận.' : 'Áp dụng từ kỳ đang xem.');
  };
  TH.act['sal.import'] = function () { TH.toast('Import bảng lương nguồn (mô phỏng)', 'Tệp “luong_nguon_T10.xlsx” khớp ' + TH.db.staff.filter(function (s) { return s.status === 'active'; }).length + ' nhân viên, 0 lỗi.', 'info'); };

  /* ---------------- SAL-ADJ ---------------- */
  TH.views['SAL-ADJ'] = {
    modal: { size: 'lg' },
    render: function (r) {
      var p = TH.store.state.period, form = 'saladj', locked = (TH.db.payrollStatus[p] || {}).status === 'locked';
      var list = TH.db.salaryAdjustments.filter(function (a) { return a.period === p; });
      var staffOpts = TH.db.staff.filter(function (s) { return s.status === 'active'; }).map(function (s) { return { id: s.id, label: s.id + ' · ' + s.name }; });
      return {
        title: 'Điều chỉnh lương kỳ <span class="screen-id">SAL-ADJ</span>', sub: 'Kỳ ' + F.period(p) + ' · kế toán thêm khoản điều chỉnh kèm lý do',
        body: '<div class="stack">' + TH.table({ compact: true, cols: [
          { key: 'n', label: 'Nhân viên', render: function (a) { return esc(C.staffName(a.staffId)); } },
          { key: 't', label: 'Loại', render: function (a) { return TH.badge(a.type === 'bonus' ? 'Thưởng' : a.type === 'penalty' ? 'Trừ' : 'Khác', a.amount < 0 ? 'danger' : 'success'); } },
          { key: 'a', label: 'Số tiền', num: true, render: function (a) { return '<b class="' + (a.amount < 0 ? 'neg' : 'pos') + '">' + F.money(a.amount) + '</b>'; } },
          { key: 'r', label: 'Lý do', render: function (a) { return esc(a.reason); } },
          { key: 's', label: 'Trạng thái', render: function (a) { return TH.status(a.status); } },
          { key: 'tr', label: 'Truy vết', gate: 'F040.D', render: function (a) { return '<span class="small">' + esc(C.staffName(a.createdBy)) + ' · ' + F.date(a.createdAt) + '</span>'; } },
        ], rows: list, empty: { title: 'Chưa có điều chỉnh', text: 'Thêm khoản điều chỉnh bên dưới.' } }) +
          (locked ? '<div class="alert alert-neutral">' + I('lock', 'ic-sm') + '<div class="alert-body">Kỳ lương đã khóa — điều chỉnh phát sinh tạo bản điều chỉnh mới.</div></div>' : '') +
          '<div class="card"><div class="card-hd"><div class="card-title">Thêm điều chỉnh</div></div><div class="card-bd"><div class="form-grid">' +
          TH.field({ form: form, name: 'staff', label: 'Nhân viên', type: 'select', options: staffOpts, def: r.param && C.staff(r.param) ? r.param : 'NV-003' }) +
          TH.field({ label: 'Kỳ lương', value: 'Kỳ ' + F.period(p), readonly: true, id: 'saladj-p' }) +
          TH.field({ form: form, name: 'type', label: 'Loại điều chỉnh', type: 'select', options: [{ id: 'bonus', label: 'Thưởng' }, { id: 'penalty', label: 'Trừ' }, { id: 'other', label: 'Khác' }], def: 'bonus' }) +
          TH.field({ form: form, required: true, name: 'amount', label: 'Số tiền (đ)', num: true, inputmode: 'numeric', def: '' }) +
          TH.field({ form: form, required: true, name: 'reason', label: 'Lý do', type: 'textarea', span: true, def: '', required: true }) + '</div>' +
          TH.gate('F041.C', '<div class="small u-mt-12">' + TH.tierPill('C') + ' Điều chỉnh sau khi duyệt/khóa được ghi audit số liệu.</div>', { mode: 'mini', label: 'Nhật ký điều chỉnh sau khóa' }) + '</div></div></div>',
        foot: '<button type="button" class="btn" data-close>Đóng</button>' + TH.permBtn('salary.edit', '<button type="button" class="btn btn-primary" data-act="saladj.save">' + I('plus', 'ic-sm') + 'Thêm điều chỉnh</button>', 'Chỉ Kế toán/Admin · 403'),
      };
    },
  };
  TH.act['saladj.save'] = function () {
    var g = function (k, d) { return TH.store.draft('saladj', k, d); };
    var amt = +String(g('amount', '')).replace(/\D/g, ''), reason = (g('reason', '') || '').trim(), type = g('type', 'bonus');
    var errs = {}; if (!amt) errs.amount = 'Nhập số tiền lớn hơn 0.'; if (!reason) errs.reason = 'Nhập lý do điều chỉnh.';
    if (!TH.formErrors('saladj', errs)) { TH.modal.rerenderAll(); return; }
    var rec = { id: 'DC-' + Date.now().toString().slice(-5), staffId: g('staff', 'NV-003'), period: TH.store.state.period, type: type, amount: type === 'penalty' ? -amt : amt, reason: reason, createdBy: TH.me().id, createdAt: TH.TODAY, status: 'draft' };
    TH.db.salaryAdjustments.push(rec);
    TH.log('Thêm điều chỉnh lương', rec.staffId, F.money(rec.amount) + ' · ' + reason, 'salary');
    TH.store.clearDraft('saladj'); TH.app.refresh();
    TH.toast('Đã thêm điều chỉnh', esc(C.staffName(rec.staffId)) + ' · ' + F.money(rec.amount));
  };
})();
