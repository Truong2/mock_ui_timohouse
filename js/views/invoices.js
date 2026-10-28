/* Hóa đơn: INV-01, INV-PREV, INV-02, INV-03. F022–F025 (+ dữ liệu chỉ số F018–F021). */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;

  function lineSum(inv, types) { return C.sum(inv.lines.filter(function (l) { return types.indexOf(l.type) > -1; }), function (l) { return l.amount; }); }
  function blockers(inv) {
    var out = [];
    if (!inv.readingOk) out.push('Chỉ số điện nước chưa xác nhận');
    if (inv.lines.some(function (l) { return l.draft && l.type === 'extra'; })) out.push('Còn dòng phí phát sinh chờ duyệt');
    if (inv.lines.some(function (l) { return l.draft && l.type === 'adjust'; })) out.push('Còn giảm trừ/phụ thu chờ duyệt');
    return out;
  }
  /* CR-BILL: cột "Lẻ kỳ" — tròn tháng / số ngày ở lẻ / kỳ TT nhiều tháng / đã trả trước */
  function periodCell(i) {
    var r = i.lines.find(function (l) { return l.type === 'rent'; });
    if (i.prepaidTo) return '<span class="small">Đã trả trước đến ' + F.period(i.prepaidTo) + '</span><div class="cell-sub">Kỳ TT ' + i.cycle.months + ' tháng · không thu tiền phòng</div>';
    var out = [];
    if (r && r.months > 1) out.push('<b class="small">Kỳ TT ' + r.months + ' tháng</b><div class="cell-sub">' + F.period(r.cover[0]) + ' – ' + F.period(r.cover[r.cover.length - 1]) + '</div>');
    if (r && r.k !== undefined && r.k !== 1) out.push('<b class="small">' + r.days + '/' + r.base + ' ngày</b><div class="cell-sub">từ ' + F.date(r.from) + ' · hệ số ' + F.num(r.k) + '</div>');
    return out.length ? out.join('') : '<span class="small muted">Tròn tháng</span>';
  }
  TH.invPeriodCell = periodCell;
  /* CR-BILL: thẻ quy tắc tính tiền (đề xuất, chờ khách duyệt) — đổi chỉ tính lại hóa đơn nháp */
  function rulesCard() {
    var R = TH.billRules(), can = TH.can('billing.rules') && TH.has('F023.B');
    var row = function (key) {
      var L = TH.BILL_RULE_LABELS[key], id = 'rule-' + key;
      var ctl = can ? '<select id="' + id + '" class="select select-sm" data-act-change="bill.rule" data-key="' + key + '">' + Object.keys(L.options).map(function (v) { return '<option value="' + v + '"' + (R[key] === v ? ' selected' : '') + '>' + esc(L.options[v]) + '</option>'; }).join('') + '</select>'
        : '<div class="small" id="' + id + '">' + esc(L.options[R[key]] || R[key]) + '</div>';
      return '<div class="field"><label for="' + id + '">' + esc(L.label) + '</label>' + ctl + '</div>';
    };
    return '<div class="card">' + TH.cardHd(I('settings', 'ic-sm') + 'Quy tắc tính tiền', 'Đề xuất bám file Excel tháng 9/2026', TH.openBadge('D-03', 'CHỜ KHÁCH DUYỆT')) + '<div class="card-bd stack-sm">' +
      TH.gate('F023.B', row('prorateBase') + row('prorateFixed'), { mode: 'mini', label: 'Tính lẻ tiền phòng theo ngày ở' }) + row('depositInCollect') + row('commonVacant') +
      '<div class="small muted">Giảm trừ/phụ thu từ ' + F.money(R.adjustApproveFrom) + ' cần kế toán/admin duyệt. Đổi quy tắc chỉ tính lại hóa đơn nháp; hóa đơn đã xác nhận giữ nguyên.' + (can ? '' : ' Chỉ kế toán/admin chỉnh.') + '</div></div></div>';
  }
  TH.onChange['bill.rule'] = function (el) {
    var key = el.dataset.key, R = TH.billRules();
    R[key] = el.value; R.updatedBy = TH.me().id; R.updatedAt = TH.TODAY;
    TH.db.billRules = R;
    refreshDrafts(null, TH.store.state.period);
    TH.log('Đổi quy tắc tính tiền (đề xuất)', TH.BILL_RULE_LABELS[key].label, TH.BILL_RULE_LABELS[key].options[el.value], 'invoice');
    TH.app.refresh();
    TH.toast('Đã đổi quy tắc', esc(TH.BILL_RULE_LABELS[key].label) + ': ' + esc(TH.BILL_RULE_LABELS[key].options[el.value]) + ' — hóa đơn nháp đã tính lại.');
  };
  /* CR-BILL: giảm trừ / phụ thu ("Thu khác") theo phòng–kỳ */
  function adjKind(a) { return a.kind === 'discount' ? TH.badge('Giảm trừ', 'info') : TH.badge('Phụ thu', 'warning'); }
  function adjCard(p, bs) {
    var list = C.adjustsIn(p).filter(function (a) { return bs.indexOf(a.buildingId) > -1 && TH.inScope(a.buildingId); });
    var canApp = TH.can('invoice.adjust.approve');
    return '<div class="card card-flush">' + TH.cardHd(I('edit', 'ic-sm') + 'Giảm trừ / phụ thu kỳ ' + F.period(p), 'Cột "Thu khác" của file: hỗ trợ DV, CTV bù ngày, thêm người, phạt…', TH.permBtn('invoice.adjust', '<button type="button" class="btn btn-sm" data-act="adj.new">' + I('plus', 'ic-sm') + 'Thêm khoản</button>', '403')) +
      TH.table({ compact: true, label: 'Giảm trừ và phụ thu', cols: [
        { key: 'r', label: 'Phòng', render: function (a) { return '<b>' + TH.roomLink(a.roomId) + '</b>'; } },
        { key: 'k', label: 'Loại', render: function (a) { return adjKind(a); } },
        { key: 'n', label: 'Khoản', wrap: true, render: function (a) { return '<b>' + esc(a.category) + '</b><div class="cell-sub">' + esc(a.reason || '') + '</div>'; } },
        { kind: 'money', key: 'a', label: 'Số tiền', num: true, render: function (a) { return '<b class="' + (a.kind === 'discount' ? 'neg' : '') + '">' + (a.kind === 'discount' ? '−' : '+') + F.money(a.amount) + '</b>'; } },
        { key: 's', label: 'Trạng thái', wrap: true, render: function (a) { var st = TH.ADJUST_STATES[a.status]; return TH.badge(st[0], st[1], { dot: true }) + '<div class="cell-sub">' + esc(C.staffName(a.createdBy)) + (a.approvedBy && a.status !== 'pending' ? (a.approvedBy === a.createdBy ? ' · tự duyệt (dưới ngưỡng)' : ' · duyệt: ' + esc(C.staffName(a.approvedBy))) : '') + '</div>'; } },
        { key: 'x', label: '', render: function (a) { return a.status === 'pending' && canApp ? '<div class="row u-gap-6 u-nowrap"><button type="button" class="btn btn-xs btn-soft" data-act="adj.ok" data-id="' + a.id + '">Duyệt</button><button type="button" class="btn btn-xs btn-ghost" data-act="adj.no" data-id="' + a.id + '">Từ chối</button></div>' : a.status === 'pending' ? '<span class="small muted">Chờ kế toán/admin</span>' : ''; } },
      ], rows: list, empty: { title: 'Không có giảm trừ / phụ thu', text: 'Khoản đã duyệt tự vào hóa đơn nháp của phòng; khoản chờ duyệt giữ hóa đơn ở nháp.' } }) + '</div>';
  }
  TH.adjCard = adjCard;
  function adjForm(roomId) {
    var form = 'adj', p = TH.store.state.period, R = TH.billRules();
    var rooms = TH.db.contracts.filter(function (c) { return c.status === 'active' && TH.inScope(c.buildingId); }).map(function (c) { return c.roomId; }).sort();
    var room = TH.store.draft(form, 'room', roomId || rooms[0]), inv = TH.db.invoices.find(function (i) { return i.roomId === room && i.period === p && i.status === 'confirmed'; });
    var amt = +String(TH.store.draft(form, 'amount', '')).replace(/\D/g, '') || 0;
    return { title: 'Giảm trừ / phụ thu', sub: 'Kỳ ' + F.period(p) + ' · cột "Thu khác" của hóa đơn',
      body: '<div class="stack"><div class="form-grid">' +
        TH.field({ form: form, name: 'room', label: 'Phòng', type: 'select', options: rooms, def: room, live: true }) +
        TH.field({ form: form, name: 'kind', label: 'Loại', type: 'select', options: [{ id: 'discount', label: 'Giảm trừ (trừ vào hóa đơn)' }, { id: 'surcharge', label: 'Phụ thu (cộng vào hóa đơn)' }], def: 'discount' }) +
        TH.field({ form: form, name: 'category', label: 'Khoản', type: 'select', options: TH.ADJUST_CATEGORIES, def: TH.ADJUST_CATEGORIES[0] }) +
        TH.field({ form: form, required: true, name: 'amount', label: 'Số tiền (đ)', def: '', num: true, inputmode: 'numeric', live: true }) +
        TH.field({ form: form, required: true, name: 'reason', label: 'Lý do / căn cứ', def: '', span: true, placeholder: 'VD: khách về quê 10 ngày, hỗ trợ DV chung' }) + '</div>' +
        (inv ? '<div class="alert alert-info">' + I('info', 'ic-sm') + '<div class="alert-body"><b>Hóa đơn kỳ ' + F.period(p) + ' của ' + esc(room) + ' đã xác nhận</b><span>Khoản này ghi vào kỳ ' + F.period(TH.addMonthsYm(p, 1)) + ' (không sửa hóa đơn đã phát hành).</span></div></div>' : '') +
        '<div class="alert alert-neutral">' + I('shieldCheck', 'ic-sm') + '<div class="alert-body">' + (amt >= R.adjustApproveFrom ? '<b>Từ ' + F.money(R.adjustApproveFrom) + ' — chờ kế toán/admin duyệt</b><span>Hóa đơn nháp của phòng bị giữ cho đến khi duyệt.</span>' : '<b>Dưới ' + F.money(R.adjustApproveFrom) + ' — QL tòa duyệt ngay</b><span>Vào hóa đơn nháp của phòng.</span>') + '</div></div></div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button>' + TH.permBtn('invoice.adjust', '<button type="button" class="btn btn-primary" data-act="adj.save">' + I('check', 'ic-sm') + 'Lưu khoản</button>', '403') };
  }
  TH.act['adj.new'] = function (el) { var room = el.dataset.room; TH.store.clearDraft('adj'); TH.modal.open({ key: 'adj', size: 'md', render: function () { return adjForm(room); } }); };
  TH.act['adj.save'] = function () {
    var g = function (k, d) { return TH.store.draft('adj', k, d); }, p = TH.store.state.period, R = TH.billRules();
    var amount = +String(g('amount', '')).replace(/\D/g, '') || 0, reason = (g('reason', '') || '').trim();
    var errs = {}; if (!amount) errs.amount = 'Nhập số tiền lớn hơn 0.'; if (!reason) errs.reason = 'Nhập lý do / căn cứ.';
    if (!TH.formErrors('adj', errs)) { TH.modal.rerenderAll(); return; }
    var ct = TH.db.contracts.find(function (c) { return c.roomId === g('room', '') && c.status === 'active'; });
    if (!TH.formErrors('adj', ct ? {} : { room: 'Chọn phòng đang có hợp đồng hiệu lực.' })) { TH.modal.rerenderAll(); return; }
    var period = p, moved = TH.db.invoices.some(function (i) { return i.roomId === ct.roomId && i.period === p && i.status === 'confirmed'; });
    if (moved) period = TH.addMonthsYm(p, 1);
    var auto = amount < R.adjustApproveFrom;
    var a = { id: TH.recordActions.id('DC'), roomId: ct.roomId, contractId: ct.id, buildingId: ct.buildingId, period: period, kind: g('kind', 'discount'), category: g('category', TH.ADJUST_CATEGORIES[0]), amount: amount,
      reason: reason + (moved ? ' (chuyển từ kỳ ' + F.period(p) + ' — hóa đơn đã xác nhận)' : ''), status: auto ? 'approved' : 'pending', createdBy: TH.me().id, createdAt: TH.TODAY, approvedBy: auto ? TH.me().id : null, approvedAt: auto ? TH.TODAY : null };
    TH.db.billAdjusts = (TH.db.billAdjusts || []).concat([a]);
    refreshDrafts(ct.buildingId, period);
    TH.log((a.kind === 'discount' ? 'Lập giảm trừ' : 'Lập phụ thu'), ct.roomId, a.category + ' · ' + F.money(amount) + (auto ? ' · tự duyệt (dưới ngưỡng)' : ' · chờ duyệt'), 'invoice', ct.buildingId);
    TH.store.clearDraft('adj'); TH.modal.close('adj', { silent: true }); TH.app.refresh();
    TH.toast(auto ? 'Đã ghi khoản vào hóa đơn nháp' : 'Đã gửi duyệt', esc(ct.roomId + ' · ' + a.category + ' ' + F.money(amount)) + (moved ? ' · ghi vào kỳ ' + F.period(period) : ''), auto ? 'success' : 'info');
  };
  function adjDecide(el, ok) {
    var a = (TH.db.billAdjusts || []).find(function (x) { return x.id === el.dataset.id; });
    if (!a || a.status !== 'pending') return;
    if (a.createdBy === TH.me().id && TH.store.state.role !== 'admin') { TH.toast('Không tự duyệt', 'Người lập không duyệt khoản của mình.', 'warning'); return; }
    a.status = ok ? 'approved' : 'rejected'; a.approvedBy = TH.me().id; a.approvedAt = TH.TODAY;
    refreshDrafts(a.buildingId, a.period);
    TH.log(ok ? 'Duyệt giảm trừ/phụ thu' : 'Từ chối giảm trừ/phụ thu', a.roomId, a.category + ' · ' + F.money(a.amount), 'invoice', a.buildingId);
    TH.app.refresh();
    TH.toast(ok ? 'Đã duyệt khoản' : 'Đã từ chối khoản', esc(a.roomId + ' · ' + a.category));
  }
  TH.act['adj.ok'] = function (el) { adjDecide(el, true); };
  TH.act['adj.no'] = function (el) { adjDecide(el, false); };
  /* Nháp được tính lại theo dữ liệu nguồn mới nhất (chỉ số, phí) — hóa đơn đã xác nhận không đổi. */
  function refreshDrafts(bId, p) {
    TH.db.invoices.forEach(function (inv, idx) {
      if (inv.status !== 'draft' || inv.period !== p || (bId && inv.buildingId !== bId)) return;
      var ct = C.contract(inv.contractId);
      var fresh = TH.buildInvoice(TH.db, ct, p, 'draft');
      fresh.id = inv.id; fresh.batch = inv.batch;
      TH.db.invoices[idx] = fresh;
    });
  }
  TH.refreshDrafts = refreshDrafts;
  function targetBuildings() {
    var multi = TH.has('F022.B') && TH.store.ui('INV-01', 'multi', false);
    var s = TH.scope();
    var b = TH.store.ui('INV-01', 'b', s !== 'ALL' ? s : 'TH-TX');
    if (!TH.inScope(b)) b = TH.roleScope()[0];
    return multi ? TH.db.buildings.filter(function (x) { return TH.inScope(x.id); }).map(function (x) { return x.id; }) : [b];
  }
  function singleRoom() { return TH.store.ui('INV-01', 'room', ''); }
  function selectedDrafts(p, bs) {
    return TH.db.invoices.filter(function (i) { return i.period === p && i.status === 'draft' && bs.indexOf(i.buildingId) > -1 && (TH.has('F025.B') || i.roomId === singleRoom()); });
  }

  /* ---------------- INV-01 ---------------- */
  TH.views['INV-01'] = {
    scan: function () { return [{ ui: { multi: false } }, { ui: { multi: true } }, { ui: { multi: false, b: 'TH-CG' } }]; },
    dialogs: [function () { return adjForm(); }],
    render: function () {
      var p = TH.store.state.period, bs = targetBuildings();
      bs.forEach(function (b) { refreshDrafts(b, p); });
      var locked = TH.periodLocked(p);
      var contracts = TH.db.contracts.filter(function (c) { return c.status === 'active' && bs.indexOf(c.buildingId) > -1 && c.start <= TH.monthEnd(p); });
      var invs = TH.db.invoices.filter(function (i) { return i.period === p && bs.indexOf(i.buildingId) > -1; });
      var drafts = invs.filter(function (i) { return i.status === 'draft'; }), confirmed = invs.filter(function (i) { return i.status === 'confirmed'; });
      var toCreate = contracts.filter(function (c) { return !invs.some(function (i) { return i.roomId === c.roomId && i.status !== 'cancelled'; }); });
      var readingsMissing = contracts.filter(function (c) { var rd = C.reading(c.roomId, p); var is = C.readingIssue(rd, C.room(c.roomId)); return !rd || rd.status !== 'confirmed' || (is && is.level !== 'spike'); });
      var multi = TH.has('F022.B') && TH.store.ui('INV-01', 'multi', false);

      var bSel = '<div class="field" style="min-width:240px"><label for="inv1-b">Tòa</label><select id="inv1-b" class="select" data-ui="INV-01.b"' + (multi ? ' disabled' : '') + '>' + TH.buildingOptions(false).map(function (o) { return '<option value="' + o.id + '"' + (o.id === bs[0] && !multi ? ' selected' : '') + '>' + esc(o.label) + '</option>'; }).join('') + '</select></div>';
      var pSel = '<div class="field"><label for="inv1-p">Kỳ</label><select id="inv1-p" class="select" data-global="period">' + TH.PERIODS.slice().reverse().map(function (x) { return '<option value="' + x + '"' + (x === p ? ' selected' : '') + '>Kỳ ' + F.period(x) + '</option>'; }).join('') + '</select></div>';
      if (!TH.has('F022.B')) pSel += '<div class="field"><label for="inv1-room">Phòng / hợp đồng bắt buộc chọn</label><select id="inv1-room" class="select" data-ui="INV-01.room"><option value="">Chọn một phòng</option>' + contracts.map(function (c) { return '<option value="' + esc(c.roomId) + '"' + (c.roomId === singleRoom() ? ' selected' : '') + '>' + esc(c.roomId + ' · ' + c.id) + '</option>'; }).join('') + '</select></div>';
      var multiCtl = TH.gate('F022.B', '<label class="switch" style="align-self:flex-end;padding-bottom:6px"><input type="checkbox" data-act-change="inv.multi"' + (multi ? ' checked' : '') + '><span class="switch-track"></span><span class="small"><b>Lập hàng loạt nhiều tòa</b> ' + TH.up('F022.B') + '</span></label>', { mode: 'btn', label: 'Lập hàng loạt nhiều tòa', size: 'btn-sm' });

      var stepper = '<div class="stepper">' + [['1', 'Chọn tòa/kỳ', true], ['2', 'Sinh nháp', invs.length > 0], ['3', 'Bổ sung phí & soát', drafts.length > 0 && !drafts.some(function (i) { return blockers(i).length; })], ['4', 'Xem trước & xác nhận', confirmed.length > 0 && !drafts.length]].map(function (s, i, arr) {
        return '<div class="step ' + (s[2] ? 'is-done' : '') + '"><span class="n">' + (s[2] ? '✓' : s[0]) + '</span>' + s[1] + '</div>' + (i < arr.length - 1 ? '<span class="step-line"></span>' : '');
      }).join('') + '</div>';

      var pre = TH.gate('F022.C', '<div class="card">' + TH.cardHd(I('shieldCheck', 'ic-sm') + 'Kiểm lỗi trước khi chốt' + TH.up('F022.C')) + '<div class="card-bd stack-sm">' +
        [[contracts.every(function (c) { return c.fees && c.fees.length; }), 'Tất cả hợp đồng có biểu phí cố định'], [readingsMissing.length === 0, readingsMissing.length ? readingsMissing.length + ' phòng thiếu/lỗi chỉ số: ' + readingsMissing.map(function (c) { return c.roomId; }).join(', ') : 'Đủ chỉ số đã xác nhận'], [!TH.db.extraFees.some(function (e) { return e.period === p && e.status === 'draft' && bs.indexOf(C.room(e.roomId).buildingId) > -1; }), 'Không còn phí phát sinh chờ duyệt'], [TH.db.rooms.filter(function (r) { return bs.indexOf(r.buildingId) > -1 && r.status === 'occupied'; }).every(function (r) { return C.contractOfRoom(r.id); }), 'Mọi phòng đang thuê đều có hợp đồng hiện hành']]
          .map(function (c) { return '<div class="row-flag ' + (c[0] ? 'pos' : 'neg') + '">' + I(c[0] ? 'checkCircle' : 'xCircle', 'ic-sm') + esc(c[1]) + '</div>'; }).join('') +
        TH.gate('F024.C', '<div class="small muted u-mt-8">' + TH.tierPill('C') + ' Soát chỉ số bất thường: ' + contracts.filter(function (c) { var is = C.readingIssue(C.reading(c.roomId, p), C.room(c.roomId)); return is && is.level === 'spike'; }).length + ' phòng đột biến cần lưu ý.</div>', { mode: 'mini', label: 'Soát chỉ số bất thường' }) + '</div></div>', { label: 'Kiểm lỗi phòng/hợp đồng thiếu biểu phí trước khi chốt', lines: 4 });

      var batchCard = TH.gate('F022.D', '<div class="card">' + TH.cardHd(I('history', 'ic-sm') + 'Lô lập hóa đơn & nhật ký' + TH.up('F022.D'), 'Chạy lại an toàn: chỉ tạo cho phòng chưa có hóa đơn, không tạo trùng', TH.permBtn('invoice.draft', '<button type="button" class="btn btn-sm" data-act="inv.gen" data-rerun="1"' + (locked ? ' disabled' : '') + '>' + I('refresh', 'ic-sm') + 'Chạy lại batch</button>', '403')) +
        TH.table({ compact: true, cols: [{ key: 'id', label: 'Lô', render: function (b) { return '<span class="mono small">' + b.id + '</span><div class="cell-sub">lần ' + b.run + '</div>'; } }, { key: 'at', label: 'Thời điểm', render: function (b) { return F.date(b.at) + '<div class="cell-sub">' + esc(C.staffName(b.by)) + '</div>'; } }, { key: 'c', label: 'Tạo / bỏ qua', num: true, render: function (b) { return b.created + ' / ' + b.skipped; } }],
          rows: TH.db.batches.filter(function (b) { return b.period === p; }), empty: { title: 'Chưa có lô', text: 'Lô xuất hiện sau khi sinh nháp.' } }) + '</div>', { label: 'Chạy lại lô an toàn, không tạo trùng, có nhật ký', lines: 3 });

      var table = TH.table({
        label: 'Hóa đơn nháp theo phòng',
        cols: [
          { key: 'room', label: 'Phòng', render: function (i) { return TH.roomLink(i.roomId) + '<div class="cell-sub">' + esc(C.customer(i.customerId).name) + '</div>'; } },
          { kind: 'money', key: 'rent', label: 'Tiền phòng', num: true, render: function (i) { return F.money(lineSum(i, ['rent'])); } },
          { kind: 'money', key: 'fix', label: 'Phí cố định', num: true, render: function (i) { return F.money(lineSum(i, ['fixed'])); } },
          { kind: 'money', key: 'ut', label: 'Điện nước', num: true, render: function (i) { var c = lineSum(i, ['common']); return (i.readingOk ? F.money(lineSum(i, ['elec', 'water', 'common'])) : '<span class="neg small">Thiếu chỉ số</span>') + (c ? '<div class="cell-sub">gồm điện chung ' + F.short(c) + '</div>' : ''); } },
          { kind: 'money', key: 'ex', label: 'Phát sinh / thu khác', num: true, render: function (i) { var v = lineSum(i, ['extra', 'adjust']); return v ? F.money(v) : '<span class="muted">0</span>'; } },
          { key: 'pr', label: 'Lẻ kỳ / Kỳ thanh toán', gate: 'F023.B', wrap: true, render: periodCell },
          { key: 'ver', label: 'Biểu phí', gate: 'F023.C', render: function (i) { return '<span class="small">v' + C.contract(i.contractId).versions.length + '</span>'; } },
          { kind: 'money', key: 'tot', label: 'Tổng', num: true, render: function (i) { return '<b>' + F.money(i.total) + '</b>'; } },
          { kind: 'status', key: 'st', label: 'Trạng thái', render: function (i) { var bl = i.status === 'draft' ? blockers(i) : []; return TH.status(i.status) + (bl.length ? '<div class="cell-sub neg">' + I('lock', 'ic-sm') + ' ' + esc(bl.join('; ')) + '</div>' : ''); } },
          { key: 'a', label: '', render: function (i) { return !TH.has('F025.B') && i.status === 'draft' ? '<button type="button" class="btn btn-xs" data-act="inv.previewOne" data-id="' + i.id + '">Xem và xác nhận</button>' : '<a class="btn btn-xs btn-ghost" href="' + TH.router.href('INV-03', i.id) + '" aria-label="Xem hóa đơn">' + I('eye', 'ic-sm') + '</a>'; } },
        ],
        rows: invs,
        foot: invs.length ? { _label: '<b>' + invs.length + ' hóa đơn</b>', tot: '<b>' + F.money(C.sum(invs, function (i) { return i.total; })) + '</b>' } : null,
        empty: { title: 'Chưa có hóa đơn kỳ ' + F.period(p), text: 'Nhấn “Sinh nháp” để tạo hóa đơn nháp cho ' + contracts.length + ' phòng đang thuê.' },
      });

      var genBtn = TH.permBtn('invoice.draft', '<button type="button" class="btn btn-primary" data-act="inv.gen"' + (toCreate.length && !locked ? '' : ' disabled') + '>' + I('sparkles', 'ic-sm') + 'Sinh nháp ' + (toCreate.length ? toCreate.length + ' phòng' : '') + '</button>', 'Sinh nháp · 403');
      if (!TH.has('F022.B')) genBtn = TH.permBtn('invoice.draft', '<button type="button" class="btn btn-primary" data-act="inv.gen"' + (toCreate.some(function (c) { return c.roomId === singleRoom(); }) && !locked ? '' : ' disabled') + '>Lập một hóa đơn nháp</button>', 'Sinh nháp · 403');
      var meterBtn = TH.gate('F024.B', '<button type="button" class="btn" data-act="inv.meters"' + (readingsMissing.length ? '' : ' disabled') + '>' + I('zap', 'ic-sm') + 'Nhập chỉ số tại kỳ' + TH.up('F024.B') + '</button>', { mode: 'btn', label: 'Nhập bảng công tơ tại kỳ hóa đơn' });
      return TH.pageHeader({ screen: 'INV-01', status: TH.periodBadge(p), desc: 'Sinh hóa đơn nháp từng phòng theo tòa từ hợp đồng hiện hành, phí cố định, chỉ số điện nước và phí phát sinh. Không tạo trùng hóa đơn phòng–kỳ.',
          actions: '<button type="button" class="btn" data-act="mtr.fee">' + I('plus', 'ic-sm') + 'Bổ sung phí</button>' + TH.permBtn('invoice.adjust', '<button type="button" class="btn" data-act="adj.new">' + I('edit', 'ic-sm') + 'Giảm trừ / phụ thu</button>', '403') + meterBtn + '<a class="btn btn-primary" href="' + TH.router.href('INV-PREV') + '"' + (drafts.length ? '' : ' aria-disabled="true" data-tip="Chưa có hóa đơn nháp"') + '>' + I('eye', 'ic-sm') + 'Xem trước & xác nhận</a>' }) +
        '<div class="card u-mb-16"><div class="card-bd"><div class="row" style="gap:16px;align-items:flex-end">' + bSel + pSel + multiCtl + '<span class="grow"></span>' + genBtn + '</div><div class="divider"></div>' + stepper + '</div></div>' +
        (locked ? '<div class="alert alert-neutral u-mb-16">' + I('lock', 'ic-sm') + '<div class="alert-body">Kỳ ' + F.period(p) + ' đã khóa — không sinh thêm hóa đơn. Điều chỉnh qua biên bản (D).</div></div>' : '') +
        (readingsMissing.length && !locked ? '<div class="alert alert-warning u-mb-16">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>' + readingsMissing.length + ' phòng chưa đủ chỉ số đã xác nhận: ' + readingsMissing.map(function (c) { return c.roomId; }).join(', ') + '.</b><span>Hóa đơn của các phòng này bị khóa xác nhận. <a href="' + TH.router.href('METER-01') + '">Mở bảng điện nước (METER-01)</a></span></div></div>' : '') +
        '<div class="grid-main-side"><div class="stack"><div class="card card-flush">' + TH.cardHd(I('receipt', 'ic-sm') + 'Hóa đơn kỳ ' + F.period(p), bs.map(TH.buildingName).join(', ') + ' · ' + confirmed.length + ' đã xác nhận, ' + drafts.length + ' nháp') + table + '</div>' + adjCard(p, bs) + '</div><div class="stack">' + rulesCard() + pre + batchCard +
        TH.gate('F023.D', '<div class="card">' + TH.cardHd(I('layers', 'ic-sm') + 'Nhiều đoạn hiệu lực' + TH.up('F023.D')) + '<div class="card-bd small">Hóa đơn tách dòng theo từng đoạn hiệu lực giá trong kỳ (ví dụ phụ lục từ ngày 15) và kiểm chứng tổng = tổng các đoạn. Kỳ này: không có đoạn tách.</div></div>', { label: 'Nhiều đoạn hiệu lực có kiểm chứng', lines: 2 }) +
        TH.gate('F024.D', '<div class="card">' + TH.cardHd(I('compare', 'ic-sm') + 'Đối chiếu công tơ / đơn giá theo phiên bản' + TH.up('F024.D')) + '<div class="card-bd small">Mỗi dòng điện nước trên hóa đơn gắn phiên bản đơn giá (v1 · từ ' + F.period(TH.PERIODS[0]) + ') và chỉ số đã chốt kỳ; sai lệch với công tơ nguồn hiển thị tại METER-01 › Đối chiếu.</div></div>', { label: 'Đối chiếu công tơ/đơn giá theo phiên bản', lines: 2 }) + '</div></div>';
    },
  };
  TH.onChange['inv.multi'] = function (el) { TH.store.setUi('INV-01', 'multi', el.checked); TH.app.refresh(); };
  TH.act['inv.previewOne'] = function (el) { var i = C.invoice(el.dataset.id); if (!i || !TH.inScope(i.buildingId)) return; TH.store.setUi('INV-01', 'b', i.buildingId); TH.store.setUi('INV-01', 'room', i.roomId); TH.go('INV-PREV'); };
  TH.act['inv.gen'] = function (el) {
    if (!TH.can('invoice.draft')) return;
    var p = TH.store.state.period, bs = targetBuildings();
    if (TH.periodLocked(p)) { TH.toast('Kỳ đã khóa', 'Không lập thêm hóa đơn trong kỳ đã khóa.', 'warning'); return; }
    var bulk = TH.has('F022.B');
    if (el && el.dataset.rerun && !TH.requireFeature('F022.D')) return;
    var contracts = TH.db.contracts.filter(function (c) { return c.status === 'active' && bs.indexOf(c.buildingId) > -1 && c.start <= TH.monthEnd(p); });
    if (!bulk) contracts = contracts.filter(function (c) { return c.roomId === singleRoom(); }).slice(0, 1);
    if (!contracts.length) { TH.toast('Chọn một phòng', 'Chọn phòng/hợp đồng trong phạm vi trước khi lập hóa đơn.', 'warning'); return; }
    var created = 0, skipped = 0;
    var bid = 'BATCH-' + p.slice(2, 4) + p.slice(5) + '-' + String(TH.db.batches.filter(function (b) { return b.period === p; }).length + 1).padStart(2, '0');
    contracts.forEach(function (c) {
      if (TH.db.invoices.some(function (i) { return i.roomId === c.roomId && i.period === p && i.status !== 'cancelled'; })) { skipped++; return; }
      var inv = TH.buildInvoice(TH.db, c, p, 'draft'); inv.batch = bid;
      var n = 1; while (C.invoice(inv.id)) { n++; inv.id = inv.id.replace(/-v\d+$/, '') + '-v' + n; }
      TH.db.invoices.push(inv); created++;
    });
    if (bulk) TH.db.batches.unshift({ id: bid, period: p, buildings: bs, at: TH.TODAY + ' 09:30', by: TH.me().id, created: created, skipped: skipped, status: 'draft', run: TH.db.batches.filter(function (b) { return b.period === p; }).length + 1 });
    TH.log(el.dataset.rerun ? 'Chạy lại batch hóa đơn' : 'Sinh hóa đơn nháp', bid, created + ' tạo mới, ' + skipped + ' bỏ qua (đã có)', 'invoice');
    TH.app.refresh();
    TH.toast(created ? 'Đã sinh ' + created + ' hóa đơn nháp' : 'Không tạo thêm hóa đơn', skipped ? skipped + ' phòng đã có hóa đơn kỳ này — bỏ qua, không tạo trùng.' : 'Lô ' + bid);
  };
  TH.act['inv.meters'] = function () {
    TH.modal.open({ key: 'invm', size: 'md', render: function () {
      var p = TH.store.state.period, bs = targetBuildings();
      var rows = TH.db.contracts.filter(function (c) { return c.status === 'active' && bs.indexOf(c.buildingId) > -1; }).map(function (c) { return { c: c, rd: C.reading(c.roomId, p) }; }).filter(function (x) { var is = C.readingIssue(x.rd, C.room(x.c.roomId)); return x.rd && (x.rd.status !== 'confirmed' || (is && is.level !== 'spike')); });
      return { title: 'Nhập chỉ số tại kỳ hóa đơn' + TH.up('F024.B'), sub: 'Các phòng chưa đủ chỉ số kỳ ' + F.period(p),
        body: TH.table({ compact: true, cols: [{ key: 'r', label: 'Phòng', render: function (x) { return x.c.roomId; } }, { key: 'i', label: 'Vấn đề', render: function (x) { var is = C.readingIssue(x.rd, C.room(x.c.roomId)); return '<span class="neg small">' + esc(is ? is.text : 'Chưa xác nhận') + '</span>'; } }, { key: 'a', label: '', render: function (x) { return '<button type="button" class="btn btn-xs" data-act="mtr.edit" data-id="' + x.c.roomId + '">' + I('edit', 'ic-sm') + 'Nhập</button>'; } }], rows: rows, empty: { title: 'Đủ chỉ số', text: 'Tất cả phòng đã có chỉ số xác nhận.' } }),
        foot: '<button type="button" class="btn" data-close>Xong</button>' };
    } });
  };

  /* ---------------- INV-PREV ---------------- */
  TH.views['INV-PREV'] = {
    modal: { size: 'xl' },
    render: function () {
      var p = TH.store.state.period, bs = targetBuildings();
      bs.forEach(function (b) { refreshDrafts(b, p); });
      var drafts = selectedDrafts(p, bs);
      var ready = drafts.filter(function (i) { return !blockers(i).length; });
      var total = C.sum(drafts, function (i) { return i.total; });
      var body = drafts.length ? '<div class="grid-4 u-mb-16">' + TH.kpi({ label: 'Hóa đơn nháp', value: String(drafts.length) }) + TH.kpi({ label: 'Sẵn sàng xác nhận', value: String(ready.length) }) + TH.kpi({ label: 'Bị khóa', value: String(drafts.length - ready.length), neg: drafts.length > ready.length }) + TH.kpi({ label: 'Tổng trước chốt', value: F.short(total) }) + '</div>' +
        TH.table({ cols: [
          { key: 'r', label: 'Phòng / hợp đồng', render: function (i) { return '<b>' + i.roomId + '</b><div class="cell-sub">' + esc(i.contractId) + '</div>'; } },
          { kind: 'money', key: 'rent', label: 'Tiền thuê', num: true, render: function (i) { return F.money(lineSum(i, ['rent'])); } },
          { kind: 'money', key: 'fix', label: 'Cố định', num: true, render: function (i) { return F.money(lineSum(i, ['fixed'])); } },
          { key: 'm', label: 'Công tơ (Đ/N)', render: function (i) { var e = i.lines.find(function (l) { return l.type === 'elec'; }), w = i.lines.find(function (l) { return l.type === 'water'; }); return e ? '<span class="small">' + e.qty + ' kWh · ' + w.qty + ' m³</span>' : '<span class="neg small">' + I('alert', 'ic-sm') + ' thiếu/lỗi</span>'; } },
          { kind: 'money', key: 'ut', label: 'Điện nước', num: true, render: function (i) { return F.money(lineSum(i, ['elec', 'water', 'common'])); } },
          { key: 'pr', label: 'Lẻ kỳ / Kỳ thanh toán', gate: 'F023.B', wrap: true, render: periodCell },
          { kind: 'money', key: 'ex', label: 'Phát sinh / thu khác', num: true, render: function (i) { var ex = i.lines.filter(function (l) { return l.type === 'extra' || l.type === 'adjust'; }); return ex.length ? ex.map(function (l) { return '<span class="small">' + esc(l.name) + ' ' + F.money(l.amount) + (l.draft ? ' ' + TH.badge('chờ duyệt', 'warning') : '') + '</span>'; }).join('<br>') : '<span class="muted">0</span>'; } },
          { kind: 'money', key: 't', label: 'Tổng', num: true, render: function (i) { return '<b>' + F.money(i.total) + '</b>'; } },
          { key: 's', label: 'Kiểm tra', render: function (i) { var bl = blockers(i); return bl.length ? TH.badge('Khóa', 'danger', { icon: 'lock', tip: bl.join('; ') }) : TH.badge('Sẵn sàng', 'success', { icon: 'check' }); } },
        ], rows: drafts, foot: { _label: '<b>Tổng</b>', t: '<b>' + F.money(total) + '</b>' } })
        : TH.state('empty', { title: 'Không có hóa đơn nháp', text: 'Sinh nháp ở INV-01 trước khi xem trước.' });
      return {
        title: 'Xem trước hóa đơn tòa/kỳ <span class="screen-id">INV-PREV</span>',
        sub: bs.map(TH.buildingName).join(', ') + ' · Kỳ ' + F.period(p) + ' · soát chỉ số, phí phát sinh, tổng trước chốt',
        headExtra: '<button type="button" class="pkg-btn" data-act="pkg.open" style="height:32px">' + I('settings', 'ic-sm') + '<span class="pkg-key step-n-sm">' + TH.store.state.pkg + '</span></button>',
        body: body + (drafts.length > ready.length ? '<div class="alert alert-warning u-mt-16">' + I('lock', 'ic-sm') + '<div class="alert-body">Hóa đơn bị khóa sẽ giữ trạng thái Nháp cho đến khi chỉ số/phí được xác nhận. Chỉ xác nhận ' + ready.length + ' hóa đơn sẵn sàng.</div></div>' : ''),
        foot: '<button type="button" class="btn" data-close>Quay lại</button><span class="spacer"></span>' +
          TH.permBtn('invoice.confirm', '<button type="button" class="btn btn-primary" data-act="inv.confirm"' + (ready.length ? '' : ' disabled') + '>' + I('check', 'ic-sm') + 'Xác nhận ' + ready.length + ' hóa đơn</button>', 'Chỉ Kế toán/Admin xác nhận · 403'),
      };
    },
  };
  TH.act['inv.confirm'] = function () {
    if (!TH.can('invoice.confirm')) return;
    var p = TH.store.state.period, bs = targetBuildings();
    if (TH.periodLocked(p)) return;
    var bulk = TH.has('F025.B'), ready = selectedDrafts(p, bs).filter(function (i) { return !blockers(i).length; });
    if (!ready.length) { TH.toast('Chưa chọn hóa đơn sẵn sàng', 'Gói A cần chọn một phòng/hợp đồng trước khi xác nhận.', 'warning'); return; }
    var signature = JSON.stringify(ready);
    TH.confirm({ title: 'Xác nhận ' + ready.length + ' hóa đơn?', body: '<p>Tổng <b>' + F.money(C.sum(ready, function (i) { return i.total; })) + '</b>. Sau khi xác nhận, hóa đơn không bị thay đổi im lặng; công nợ bắt đầu tính.</p>', ok: 'Xác nhận hóa đơn' }).then(function (ok) {
      if (!ok) return;
      if ((bulk && !TH.requireFeature('F025.B')) || !TH.can('invoice.confirm') || TH.periodLocked(p) || ready.some(function (i) { return !TH.inScope(i.buildingId); })) return;
      var current = ready.map(function (i) { return C.invoice(i.id); });
      if (JSON.stringify(current) !== signature || current.some(function (i) { return !i || i.status !== 'draft' || blockers(i).length; })) { TH.toast('Dữ liệu đã thay đổi', 'Mở lại xem trước để xác nhận số liệu mới.', 'warning'); return; }
      ready = current;
      ready.forEach(function (i) { i.status = 'confirmed'; i.confirmedBy = TH.me().id; i.confirmedAt = TH.TODAY; i.issuedAt = TH.TODAY; i.dueAt = TH.addDays(TH.TODAY, 10); });
      TH.db.batches.filter(function (b) { return b.period === p && b.status === 'draft' && TH.db.invoices.filter(function (i) { return i.batch === b.id; }).every(function (i) { return i.status === 'confirmed'; }); }).forEach(function (b) { b.status = 'confirmed'; });
      TH.log('Xác nhận hóa đơn', ready.length + ' hóa đơn kỳ ' + F.period(p), bs.join(', '), 'invoice');
      TH.store.persist();
      var top = TH.modal.top(); if (top && top.key.indexOf('route:INV-PREV') === 0) TH.modal.close(top.key);
      TH.app.refresh();
      TH.toast('Đã xác nhận ' + ready.length + ' hóa đơn', 'Công nợ và báo cáo đã cập nhật. Gửi Zalo tại INV-02/INV-03.');
    });
  };

  /* ---------------- INV-02 ---------------- */
  TH.views['INV-02'] = {
    render: function () {
      var S = 'INV-02', p = TH.store.state.period, q = TH.store.ui(S, 'q', ''), st = TH.store.ui(S, 'st', 'all'), allP = TH.store.ui(S, 'allp', 'cur');
      var base = TH.db.invoices.filter(function (i) { return TH.inScope(i.buildingId) && (allP === 'all' || i.period === p); });
      var rows = base.filter(function (i) {
        var ps = C.payState(i);
        var okSt = st === 'all' || ps === st || (st === 'overdue' && ps === 'partial_overdue') || (st === 'partial' && ps === 'partial_overdue');
        return okSt && TH.match(q, [i.id, i.roomId, C.customer(i.customerId).name]);
      }).sort(function (a, b) { return a.period === b.period ? (a.roomId < b.roomId ? -1 : 1) : (a.period < b.period ? 1 : -1); });
      var pg = TH.paginate(S, rows, 12);
      var cnt = function (k) { return base.filter(function (i) { var s = C.payState(i); return s === k || (k === 'overdue' && s === 'partial_overdue'); }).length; };
      var sel = TH.store.ui(S, 'sel', []);
      var bulkSel = TH.has('F025.B');
      var table = TH.table({
        label: 'Danh sách hóa đơn & công nợ',
        mobile: { identity: 'id', primary: 'd', visible: ['ck', 'id', 'r', 'k', 'd', 's'] },
        cols: [
          { key: 'ck', label: '', labelHtml: '<span class="sr-only">Chọn</span>', gate: 'F025.B', cls: 'cell-check', tdCls: 'cell-check', render: function (i) { return i.status === 'confirmed' ? '<input type="checkbox" aria-label="Chọn ' + i.id + '" data-act="inv.sel" data-id="' + i.id + '"' + (sel.indexOf(i.id) > -1 ? ' checked' : '') + '>' : ''; } },
          { key: 'id', label: 'Số hóa đơn', render: function (i) { return '<a class="mono" href="' + TH.router.href('INV-03', i.id) + '">' + i.id + '</a><div class="cell-sub">Kỳ ' + F.period(i.period) + '</div>'; } },
          { key: 'r', label: 'Phòng', render: function (i) { return TH.roomLink(i.roomId) + '<div class="cell-sub">' + esc(C.building(i.buildingId).short) + '</div>'; } },
          { key: 'k', label: 'Khách', render: function (i) { return esc(C.customer(i.customerId).name); } },
          { kind: 'money', key: 't', label: 'Tổng tiền', num: true, render: function (i) { return F.money(i.total); } },
          { kind: 'money', key: 'pd', label: 'Đã thu', num: true, render: function (i) { var pd = C.paid(i.id), pe = C.pending(i.id); return F.money(pd) + (pe ? '<div class="cell-sub warn-text">+' + F.short(pe) + ' chờ xác nhận</div>' : ''); } },
          { kind: 'money', key: 'd', label: 'Còn nợ', num: true, render: function (i) { var d = C.debt(i); return d ? '<b class="neg">' + F.money(d) + '</b>' : '<span class="muted">' + F.money(0) + '</span>'; } },
          { kind: 'status', key: 's', label: 'Trạng thái', render: function (i) { return TH.status(C.payState(i)); } },
          { key: 'v', label: 'Phiên bản', gate: 'F025.C', render: function (i) { return 'v' + (i.version || 1); } },
          { key: 'l', label: 'Khóa kỳ', gate: 'F025.D', render: function (i) { return TH.periodLocked(i.period) ? TH.badge('Đã khóa', 'neutral', { icon: 'lock' }) : '<span class="muted small">Mở</span>'; } },
        ],
        rows: pg.rows,
        rowAttrs: function (i) { return 'class="is-clickable' + (sel.indexOf(i.id) > -1 ? ' is-selected' : '') + '" tabindex="0" data-href="' + TH.router.href('INV-03', i.id) + '"'; },
        empty: { title: 'Không có hóa đơn phù hợp', text: 'Đổi bộ lọc trạng thái hoặc kỳ.' },
      });
      var sm = { t: C.sum(base.filter(function (i) { return i.status === 'confirmed'; }), function (i) { return i.total; }), pd: C.sum(base, function (i) { return C.paid(i.id); }), d: C.sum(base, function (i) { return C.debt(i); }) };
      var bulkBar = bulkSel && sel.length ? '<div class="toolbar u-tint-teal">' + TH.tierPill('B') + '<b class="small">' + sel.length + ' hóa đơn đã chọn</b><span class="grow"></span><button type="button" class="btn btn-sm" data-act="inv.bulkPdf">' + I('printer', 'ic-sm') + 'Xuất hàng loạt (PDF)</button><button type="button" class="btn btn-sm btn-primary" data-act="inv.bulkSend">' + I('send', 'ic-sm') + 'Gửi danh sách khách (Zalo)</button><button type="button" class="btn btn-sm btn-ghost" data-act="inv.selClear">Bỏ chọn</button></div>' : '';
      return TH.pageHeader({ screen: S, actions: TH.exportBtn('inv2.xlsx', 'Xuất Excel (.xlsx)') + TH.gate('F025.B', '', { mode: 'btn', label: 'Xuất hàng loạt & gửi danh sách' }) + '<a class="btn btn-primary" href="' + TH.router.href('INV-01') + '">' + I('plus', 'ic-sm') + 'Lập hóa đơn</a>' }) +
        TH.summaryBlock('Tổng quan hóa đơn', base.length + ' hóa đơn · ' + F.short(sm.d) + ' còn nợ', '<div class="grid-3 u-mb-16">' + TH.kpi({ label: 'Tổng hóa đơn đã xác nhận', icon: 'receipt', value: F.short(sm.t), foot: esc(allP === 'all' ? 'Mọi kỳ' : 'Kỳ ' + F.period(p)) }) + TH.kpi({ label: 'Đã thu (đã xác nhận)', icon: 'checkCircle', value: F.short(sm.pd) }) + TH.kpi({ label: 'Còn nợ', icon: 'wallet', value: F.short(sm.d), neg: sm.d > 0, foot: 'Nợ = HĐ đã xác nhận − phiếu thu đã xác nhận' }) + '</div>') +
        '<div class="card card-flush"><div class="toolbar">' + TH.searchBox(S, 'Tìm số hóa đơn, phòng, khách…') + TH.uiSelect(S, 'allp', [{ id: 'cur', label: 'Kỳ ' + F.period(p) }, { id: 'all', label: 'Tất cả kỳ' }], allP, 'Kỳ') + '</div>' +
        '<div class="toolbar u-gap-6"><div class="filter-options" role="group" aria-label="Trạng thái hóa đơn">' + TH.chips(S, 'st', [{ id: 'all', label: 'Tất cả', count: base.length }, { id: 'draft', label: 'Nháp', count: cnt('draft') }, { id: 'unpaid', label: 'Chưa thu', count: cnt('unpaid') }, { id: 'reported', label: 'Chờ xác nhận thu', count: cnt('reported') }, { id: 'partial', label: 'Thu một phần', count: cnt('partial') }, { id: 'overdue', label: 'Quá hạn', count: cnt('overdue') }, { id: 'paid', label: 'Đã thu đủ', count: cnt('paid') }], st) + '</div></div>' + bulkBar + table + TH.pager(S, pg) + '</div>';
    },
  };
  TH.act['inv.sel'] = function (el, ev) {
    ev.stopPropagation();
    var sel = TH.store.ui('INV-02', 'sel', []).slice(), i = sel.indexOf(el.dataset.id);
    if (i > -1) sel.splice(i, 1); else sel.push(el.dataset.id);
    TH.store.setUi('INV-02', 'sel', sel); TH.app.refresh();
  };
  TH.act['inv.selClear'] = function () { TH.store.setUi('INV-02', 'sel', []); TH.app.refresh(); };
  TH.act['inv.bulkPdf'] = function () { var ids = TH.store.ui('INV-02', 'sel', []); TH.printDoc(ids.map(function (id) { return invoiceDoc(C.invoice(id)); }).join('<div style="page-break-after:always"></div>')); };
  TH.act['inv.bulkSend'] = function () {
    var ids = TH.store.ui('INV-02', 'sel', []), sent = 0, skip = 0;
    ids.forEach(function (id) { var r = TH.zaloSend(C.invoice(id), 'TPL-01'); if (r === 'sent') sent++; else skip++; });
    TH.store.setUi('INV-02', 'sel', []); TH.app.refresh();
    TH.toast('Gửi Zalo (mô phỏng): ' + sent + ' thành công', skip ? skip + ' hóa đơn bỏ qua/lỗi — xem OA-02.' : 'Xem nhật ký tại OA-02.', skip ? 'warning' : 'success');
  };
  TH.act['inv2.xlsx'] = function () {
    var p = TH.store.state.period, rows = TH.db.invoices.filter(function (i) { return TH.inScope(i.buildingId) && i.period === p; });
    TH.exportXlsx('Hoa_don_cong_no_ky_' + p, [{ name: 'Hoa don', title: 'Hóa đơn & công nợ — ' + TH.scopeLabel(), note: 'Dữ liệu minh họa', columns: [{ label: 'Số hóa đơn', width: 18 }, { label: 'Phòng' }, { label: 'Khách', width: 24 }, { label: 'Trạng thái', width: 22 }, { label: 'Tổng', type: 'money' }, { label: 'Đã thu', type: 'money' }, { label: 'Còn nợ', type: 'money' }],
      rows: rows.map(function (i) { return [i.id, i.roomId, C.customer(i.customerId).name, TH.statusLabel(C.payState(i)), i.total, C.paid(i.id), C.debt(i)]; }) }]);
    TH.toast('Đã xuất Excel', rows.length + ' hóa đơn');
  };

  /* ---------------- INV-03 ---------------- */
  /* CR-PAY: mẫu hóa đơn theo sheet "HĐ (VP/TECH…)" của file Excel tháng 9/2026 — 12 dòng cố định, Mã KH = mã phòng + A001,
     nội dung chuyển khoản = mã phòng, tài khoản nhận theo nhóm nhà (đã che), hạn nộp & phạt chậm chỉ hiển thị. */
  var BILL_ROWS = ['Tiền phòng', 'Tiền cọc phòng (đối với KH mới ở)', 'Điện (số)', 'Nước (khối)', 'DV vệ sinh', 'DV Internet (phòng)', 'DV thang máy (người)', 'DV gửi xe', 'Máy giặt / máy sấy', 'DV combo / DV khác', 'Nợ cũ', 'Điện chung'];
  function billRows(inv) {
    var bill = C.roomBill(inv.roomId, inv.period), rd = C.reading(inv.roomId, inv.period);
    var rows = BILL_ROWS.map(function (n) { return { name: n, newIdx: '', oldIdx: '', qty: '', k: '', price: '', amount: 0, note: [] }; });
    var put = function (i, l) { var r = rows[i]; r.amount += l.amount; if (r.qty === '' && r.price === '') { r.qty = l.qty; r.price = l.price; r.k = l.k !== undefined ? l.k : 1; } else { r.qty = ''; r.price = ''; r.k = ''; } if (l.name && (i === 9 || i === 11)) r.note.push(l.name); };
    if (inv.prepaidTo) rows[0].note.push('Đã trả trước đến ' + F.period(inv.prepaidTo) + ' (kỳ TT ' + inv.cycle.months + ' tháng)');
    inv.lines.forEach(function (l) {
      if (l.type === 'rent') { put(0, l); if (l.k !== 1 || l.months > 1) rows[0].note.push(l.name); return; }
      if (l.type === 'common') return put(11, l);
      if (l.type === 'elec') { put(2, l); if (rd) { rows[2].newIdx = rd.elecCur; rows[2].oldIdx = rd.elecPrev; } return; }
      if (l.type === 'water') { put(3, l); if (rd && l.unit === 'm³') { rows[3].newIdx = rd.waterCur; rows[3].oldIdx = rd.waterPrev; } return; }
      if (l.code === 'NET') return put(5, l);
      if (l.code === 'ELEV') return put(6, l);
      if (l.code === 'PARK' || /^PARK_/.test(l.code || '')) return put(7, l);
      if (l.code === 'WASH') return put(8, l);
      put(9, l);
    });
    if (bill.depositIn) { rows[1].amount = bill.depositIn; rows[1].qty = 1; rows[1].k = 1; rows[1].price = bill.depositIn; }
    if (bill.oldDebt) { rows[10].amount = bill.oldDebt; rows[10].qty = 1; rows[10].k = 1; rows[10].price = bill.oldDebt; }
    return { rows: rows, bill: bill, total: C.sum(rows, function (r) { return r.amount; }) };
  }
  TH.billRows = billRows;
  function invoiceDoc(inv) {
    var b = C.building(inv.buildingId), k = C.customer(inv.customerId), x = billRows(inv), ct = C.contract(inv.contractId), T = (ct && ct.terms) || TH.CONTRACT_TERMS.DAYDU;
    var rd = C.reading(inv.roomId, inv.period), mm = inv.period.slice(5) + '/' + inv.period.slice(0, 4), rl = inv.lines.find(function (l) { return l.type === 'rent'; });
    var cell = function (v, money) { return v === '' || v === null || v === undefined ? '' : money ? F.money(v) : F.num(v); };
    return '<div class="print-doc bill-doc"><div class="pd-head"><div><b>TIMEHOUSE</b><br>' + esc(b.name) + '</div><div class="u-ta-r"><span class="pd-stamp">DỮ LIỆU MINH HỌA</span></div></div>' +
      '<div class="bd-title">HÓA ĐƠN THÁNG ' + mm + '</div>' +
      '<p>Xin thông báo để anh/chị biết tiền thuê phòng tháng ' + mm + ' và tiền dịch vụ tháng ' + mm + ' như sau:</p>' +
      '<div class="bd-meta"><span>Mã KH: <b>' + esc(inv.roomId.replace('-', '')) + 'A001</b></span><span>Phòng số: <b>' + esc(inv.roomId) + '</b></span><span>Khách: <b>' + esc(k.name) + '</b></span><span>Ngày chốt số liệu: <b>' + F.date(rd ? rd.enteredAt : inv.issuedAt) + '</b></span></div>' +
      '<div class="bill-scroll"><table><thead><tr><th class="num">STT</th><th>Nội dung</th><th class="num">Chỉ số mới</th><th class="num">Chỉ số cũ</th><th class="num">Số lượng</th><th class="num">Hệ số (ngày/' + (rl && rl.base ? rl.base : 30) + ')</th><th class="num">Đơn giá</th><th class="num">Thành tiền</th></tr></thead><tbody>' +
      x.rows.map(function (r, i) { return '<tr><td class="num">' + (i + 1) + '</td><td>' + esc(r.name) + (r.note.length ? '<div class="bd-sub">' + esc(r.note.join('; ')) + '</div>' : '') + '</td><td class="num">' + cell(r.newIdx) + '</td><td class="num">' + cell(r.oldIdx) + '</td><td class="num">' + cell(r.qty) + '</td><td class="num">' + cell(r.k) + '</td><td class="num">' + cell(r.price, true) + '</td><td class="num">' + (r.amount ? F.money(r.amount) : '') + '</td></tr>'; }).join('') +
      '<tr class="bd-total"><td colspan="7"><b>TỔNG CỘNG TIỀN THANH TOÁN</b></td><td class="num"><b>' + F.money(x.total) + '</b></td></tr></tbody></table></div>' +
      '<div class="bd-note"><p>Yêu cầu khách hàng thanh toán đầy đủ và đúng hạn: <b>' + esc(T.payWindow || 'từ ngày 25 đến ngày 31') + '</b> (hạn trên hệ thống ' + F.date(inv.dueAt) + '). Thanh toán chậm phạt ' + F.money(T.lateFeePerDay || 200000) + '/ngày — chỉ hiển thị, không tự cộng công nợ.</p>' +
      '<p>Nội dung chuyển khoản: <b class="mono">' + esc(inv.roomId) + '</b> · Tài khoản nhận: <b>' + esc(C.payAccount(inv.buildingId)) + '</b></p>' +
      '<p class="bd-warn">Lưu ý: quý khách chuyển khoản không đúng nội dung, kế toán không đối soát được sẽ tính là chưa thanh toán.</p>' +
      '<p class="small">Đã thu (đã xác nhận): ' + F.money(x.bill.paid) + ' · Công nợ: ' + F.money(x.bill.balance) + ' · Trạng thái: ' + esc(TH.BILL_STATES[x.bill.state][0]) + '</p></div>' +
      '<div class="doc-c u-mt-12"><b>TRÂN TRỌNG THÔNG BÁO</b></div></div>';
  }
  TH.docPreview = function (title, sub, html) {
    TH.modal.open({ key: 'docprev', size: 'lg', render: function () {
      return { title: title, sub: sub, body: '<div class="doc-page doc-bill">' + html + '</div>', foot: '<button type="button" class="btn" data-close>Đóng</button><button type="button" class="btn btn-primary" data-act="doc.print">' + I('printer', 'ic-sm') + 'In / lưu PDF</button>' };
    } });
    TH._docHtml = html;
  };
  TH.act['doc.print'] = function () { if (TH._docHtml) TH.printDoc(TH._docHtml); };
  TH.invoiceDoc = invoiceDoc;
  TH.views['INV-03'] = {
    scanParam: 'INV-2610-CG201',
    dialogs: [function () { return invoiceDoc(C.invoice('INV-2610-CG302')); }],
    render: function (r) {
      var inv = C.invoice(r.param || 'INV-2610-CG201');
      if (!inv) return TH.pageHeader({ screen: 'INV-03' }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy hóa đơn' }) + '</div>';
      if (inv.status === 'draft') refreshDrafts(inv.buildingId, inv.period);
      inv = C.invoice(inv.id);
      var k = C.customer(inv.customerId), recs = C.receiptsOf(inv.id), msgs = TH.db.messages.filter(function (m) { return m.invoiceId === inv.id; });
      var paid = C.paid(inv.id), pend = C.pending(inv.id), debt = C.debt(inv), locked = TH.periodLocked(inv.period);
      var lines = TH.table({ cols: [
        { key: 'n', label: 'Khoản', render: function (l) { return esc(l.name) + (l.draft ? ' ' + TH.badge('chờ duyệt', 'warning') : ''); } },
        { key: 'q', label: 'SL', num: true, render: function (l) { return F.num(l.qty) + ' <span class="muted small">' + esc(l.unit) + '</span>' + (l.k !== undefined && l.k !== 1 ? '<div class="cell-sub">× hệ số ' + F.num(l.k) + (l.days ? ' (' + l.days + '/' + l.base + ' ngày)' : '') + '</div>' : ''); } },
        { kind: 'money', key: 'p', label: 'Đơn giá', num: true, render: function (l) { return F.money(l.price); } },
        { kind: 'money', key: 'a', label: 'Thành tiền', num: true, render: function (l) { return F.money(l.amount); } },
      ], rows: inv.lines, foot: { _label: '<b>Tổng cộng</b>', a: '<b>' + F.money(inv.total) + '</b>' } });
      if (inv.prepaidTo) lines += '<div class="alert alert-info" style="margin:12px 16px">' + I('info', 'ic-sm') + '<div class="alert-body"><b>Đã trả trước tiền phòng đến ' + F.period(inv.prepaidTo) + '</b><span>Khách đóng kỳ TT ' + inv.cycle.months + ' tháng; kỳ này chỉ thu dịch vụ và điện nước.</span></div></div>';
      var zaloOk = inv.status === 'confirmed' && k.oaLinked;
      var actions = TH.permBtn('invoice.adjust', '<button type="button" class="btn" data-act="adj.new" data-room="' + inv.roomId + '"' + (locked ? ' disabled' : '') + ' data-tip="' + (inv.status === 'confirmed' ? 'Hóa đơn đã xác nhận — khoản ghi vào kỳ sau' : 'Vào hóa đơn nháp này') + '">' + I('edit', 'ic-sm') + 'Giảm trừ / phụ thu</button>', '403') + '<button type="button" class="btn" data-act="inv.doc" data-id="' + inv.id + '">' + I('receipt', 'ic-sm') + 'Mẫu hóa đơn</button><button type="button" class="btn" data-act="inv.pdf" data-id="' + inv.id + '">' + I('printer', 'ic-sm') + 'PDF nội bộ</button>' +
        TH.permBtn('oa.send', '<button type="button" class="btn" data-act="inv.zalo" data-id="' + inv.id + '"' + (zaloOk ? '' : ' disabled data-tip="' + (inv.status !== 'confirmed' ? 'Chỉ gửi hóa đơn đã xác nhận' : 'Khách chưa liên kết OA — không đủ điều kiện gửi') + '"') + '>' + I('send', 'ic-sm') + 'Gửi Zalo</button>', '403') +
        '<a class="btn" href="' + TH.router.href('PAY-02') + '">' + I('wallet', 'ic-sm') + 'Xem tiền đã thu</a>' +
        (inv.status === 'confirmed' ? TH.gate('F025.A', TH.permBtn('invoice.confirm', '<button type="button" class="btn btn-danger" data-act="inv.cancel" data-id="' + inv.id + '"' + (paid || locked ? ' disabled data-tip="Chỉ hủy/chỉnh hóa đơn chưa thu, kỳ chưa khóa"' : '') + '>' + I('xCircle', 'ic-sm') + 'Chỉnh/hủy' + TH.up('F025.C') + '</button>', '403'), { mode: 'btn', label: 'Chỉnh/hủy hóa đơn chưa thu' }) : '');
      return TH.pageHeader({ screen: 'INV-03', title: 'Hóa đơn ' + inv.id, crumbs: [['Hóa đơn', TH.router.href('INV-02')], [inv.id]], status: TH.status(C.payState(inv)), actions: actions }) +
        '<div class="grid-main-side"><div class="stack"><div class="card"><div class="card-bd"><div class="row-between"><div><div class="section-title u-m-0">TIMEHOUSE · ' + esc(C.building(inv.buildingId).name) + '</div><div class="money-total u-mt-8">' + F.money(inv.total) + '</div></div>' +
        TH.kv([['Kỳ', F.period(inv.period)], ['Phòng', TH.roomLink(inv.roomId)], ['Khách', '<a href="' + TH.router.href('CUS-02', k.id) + '">' + esc(k.name) + '</a>'], ['Hợp đồng', '<a href="' + TH.router.href('CON-02', inv.contractId) + '">' + esc(inv.contractId) + '</a>'], ['Phát hành / hạn', F.date(inv.issuedAt) + ' · ' + F.date(inv.dueAt)]]) + '</div></div>' + lines + '</div>' +
        (inv.status === 'draft' && blockers(inv).length ? '<div class="alert alert-warning">' + I('lock', 'ic-sm') + '<div class="alert-body"><b>Hóa đơn nháp bị khóa xác nhận</b><span>' + esc(blockers(inv).join('; ')) + '</span></div></div>' : '') +
        TH.gate('F025.D', '<div class="card">' + TH.cardHd(I('stamp', 'ic-sm') + 'Khóa kỳ & biên bản điều chỉnh' + TH.up('F025.D')) + '<div class="card-bd">' + (locked ? '<p class="small">Kỳ ' + F.period(inv.period) + ' đã khóa. Mọi thay đổi lập <b>biên bản điều chỉnh</b> có audit.</p><button type="button" class="btn btn-sm" data-act="inv.adjust" data-id="' + inv.id + '">' + I('edit', 'ic-sm') + 'Lập biên bản điều chỉnh</button>' : '<p class="small muted">Kỳ chưa khóa. Khóa kỳ tại RPT-01.</p>') +
          '<ul class="timeline u-mt-12">' + TH.db.audit.filter(function (a) { return a.entity === inv.id || (a.kind === 'invoice' && a.detail.indexOf(inv.buildingId) > -1); }).slice(0, 4).map(function (a) { return '<li>' + esc(a.action) + '<div class="when">' + esc(C.staffName(a.by)) + ' · ' + F.date(a.at) + '</div></li>'; }).join('') + '<li>Xác nhận hóa đơn<div class="when">' + esc(C.staffName(inv.confirmedBy || 'NV-002')) + ' · ' + F.date(inv.confirmedAt || inv.issuedAt) + '</div></li></ul></div></div>', { label: 'Khóa kỳ, biên bản điều chỉnh và nhật ký', lines: 3 }) + '</div>' +
        '<div class="stack"><div class="card">' + TH.cardHd(I('wallet', 'ic-sm') + 'Thu tiền', 'Thu nhiều lần / 1 hóa đơn; không âm dư nợ') + '<div class="card-bd">' +
        TH.kv([['Đã thu (đã xác nhận)', '<b class="pos tnum">' + F.money(paid) + '</b>'], ['Báo thu chờ xác nhận', '<span class="warn-text tnum">' + F.money(pend) + '</span>'], ['Còn nợ', '<b class="' + (debt ? 'neg' : '') + ' tnum">' + F.money(debt) + '</b>']]) +
        '<div class="progress u-mt-12"><span style="width:' + Math.min(100, paid / inv.total * 100) + '%"></span><span style="width:' + Math.min(100, pend / inv.total * 100) + '%;background:var(--warning-line)"></span></div>' +
        '<ul class="timeline u-mt-16">' + (recs.length ? recs.map(function (rc) { return '<li>' + TH.status(rc.status) + ' <b class="tnum">' + F.money(rc.amount) + '</b> · ' + esc(rc.method) + '<div class="when">Thực nhận ' + F.date(rc.receivedAt) + ' · báo bởi ' + esc(C.staffName(rc.reportedBy)) + (rc.status === 'pending' ? ' · <a href="' + TH.router.href('PAY-APP', rc.id) + '">xác nhận</a>' : '') + '</div></li>'; }).join('') : '<li class="muted">Chưa có báo thu.</li>') + '</ul>' +
        (inv.status === 'confirmed' && debt > 0 ? TH.permBtn('receipt.report', '<a class="btn btn-sm" href="' + TH.router.href('PAY-01') + '" data-act="pay.reportFor" data-id="' + inv.id + '">' + I('handCoins', 'ic-sm') + 'Báo đã thu</a>', '403') : '') + '</div></div>' +
        '<div class="card">' + TH.cardHd(I('send', 'ic-sm') + 'Lịch gửi Zalo', TH.simBadge()) + '<div class="card-bd"><ul class="timeline">' + (msgs.length ? msgs.map(function (m) { return '<li>' + TH.status(m.status) + ' ' + esc(TH.db.oaTemplates.find(function (t) { return t.id === m.template; }).name) + '<div class="when">' + F.date(m.at) + (m.reason ? ' · ' + esc(m.reason) : '') + '</div></li>'; }).join('') : '<li class="muted">Chưa gửi.</li>') + '</ul></div></div></div></div>';
    },
  };
  TH.act['inv.pdf'] = function (el) { TH.printDoc(invoiceDoc(C.invoice(el.dataset.id))); };
  TH.act['inv.doc'] = function (el) { var inv = C.invoice(el.dataset.id); TH.docPreview('Mẫu hóa đơn ' + esc(inv.roomId) + ' · kỳ ' + F.period(inv.period), 'Theo mẫu HĐ trong file hóa đơn tháng 9/2026 · 12 khoản cố định', invoiceDoc(inv)); };
  TH.act['inv.zalo'] = function (el) {
    var inv = C.invoice(el.dataset.id), r = TH.zaloSend(inv, 'TPL-01');
    TH.app.refresh();
    TH.toast(r === 'sent' ? 'Đã gửi hóa đơn qua Zalo (mô phỏng)' : 'Không gửi', r === 'sent' ? 'Xem nhật ký OA-02. Provider chưa chốt (D-05).' : esc(r), r === 'sent' ? 'success' : 'warning');
  };
  TH.act['inv.cancel'] = function (el) {
    var inv = C.invoice(el.dataset.id);
    TH.confirm({ title: 'Hủy hóa đơn ' + inv.id + '?', body: '<p>Chỉ hủy được hóa đơn chưa thu. Hệ thống lưu phiên bản cũ và lý do; có thể lập lại nháp ở INV-01.</p>', ok: 'Hủy hóa đơn', danger: true }).then(function (ok) {
      if (!ok) return;
      inv.status = 'cancelled'; inv.version = (inv.version || 1) + 1;
      TH.db.invoices = TH.db.invoices.filter(function (x) { return x !== inv; }).concat([inv]);
      TH.log('Hủy hóa đơn', inv.id, 'Phiên bản v' + inv.version, 'invoice', inv.buildingId);
      TH.app.refresh(); TH.toast('Đã hủy hóa đơn', esc(inv.id) + ' · lưu phiên bản v' + inv.version);
    });
  };
  TH.act['inv.adjust'] = function (el) { TH.log('Lập biên bản điều chỉnh', el.dataset.id, 'Nháp biên bản', 'invoice'); TH.app.refresh(); TH.toast('Đã tạo biên bản điều chỉnh (nháp)', 'Cần duyệt; hóa đơn gốc giữ nguyên.'); };
})();
