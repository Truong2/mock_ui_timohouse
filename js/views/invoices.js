/* Hóa đơn: INV-01, INV-PREV, INV-02, INV-03. F022–F025 (+ dữ liệu chỉ số F018–F021). */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;

  function lineSum(inv, types) { return C.sum(inv.lines.filter(function (l) { return types.indexOf(l.type) > -1; }), function (l) { return l.amount; }); }
  function blockers(inv) {
    var out = [];
    if (!inv.readingOk) out.push('Chỉ số điện nước chưa xác nhận');
    if (inv.lines.some(function (l) { return l.draft; })) out.push('Còn dòng phí phát sinh chờ duyệt');
    return out;
  }
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

  /* ---------------- INV-01 ---------------- */
  TH.views['INV-01'] = {
    scan: function () { return [{ ui: { multi: false } }, { ui: { multi: true } }]; },
    render: function () {
      var p = TH.store.state.period, bs = targetBuildings();
      bs.forEach(function (b) { refreshDrafts(b, p); });
      var locked = TH.periodLocked(p);
      var contracts = TH.db.contracts.filter(function (c) { return c.status === 'active' && bs.indexOf(c.buildingId) > -1 && c.start <= p + '-28'; });
      var invs = TH.db.invoices.filter(function (i) { return i.period === p && bs.indexOf(i.buildingId) > -1; });
      var drafts = invs.filter(function (i) { return i.status === 'draft'; }), confirmed = invs.filter(function (i) { return i.status === 'confirmed'; });
      var toCreate = contracts.filter(function (c) { return !invs.some(function (i) { return i.roomId === c.roomId && i.status !== 'cancelled'; }); });
      var readingsMissing = contracts.filter(function (c) { var rd = C.reading(c.roomId, p); var is = C.readingIssue(rd, C.room(c.roomId)); return !rd || rd.status !== 'confirmed' || (is && is.level !== 'spike'); });
      var multi = TH.has('F022.B') && TH.store.ui('INV-01', 'multi', false);

      var bSel = '<div class="field" style="min-width:240px"><label for="inv1-b">Tòa</label><select id="inv1-b" class="select" data-ui="INV-01.b"' + (multi ? ' disabled' : '') + '>' + TH.buildingOptions(false).map(function (o) { return '<option value="' + o.id + '"' + (o.id === bs[0] && !multi ? ' selected' : '') + '>' + esc(o.label) + '</option>'; }).join('') + '</select></div>';
      var pSel = '<div class="field"><label for="inv1-p">Kỳ</label><select id="inv1-p" class="select" data-global="period">' + TH.PERIODS.slice().reverse().map(function (x) { return '<option value="' + x + '"' + (x === p ? ' selected' : '') + '>Kỳ ' + F.period(x) + '</option>'; }).join('') + '</select></div>';
      var multiCtl = TH.gate('F022.B', '<label class="switch" style="align-self:flex-end;padding-bottom:6px"><input type="checkbox" data-act-change="inv.multi"' + (multi ? ' checked' : '') + '><span class="switch-track"></span><span class="small"><b>Lập hàng loạt nhiều tòa</b> ' + TH.up('F022.B') + '</span></label>', { mode: 'btn', label: 'Lập hàng loạt nhiều tòa', size: 'btn-sm' });

      var stepper = '<div class="stepper">' + [['1', 'Chọn tòa/kỳ', true], ['2', 'Sinh nháp', invs.length > 0], ['3', 'Bổ sung phí & soát', drafts.length > 0 && !drafts.some(function (i) { return blockers(i).length; })], ['4', 'Xem trước & xác nhận', confirmed.length > 0 && !drafts.length]].map(function (s, i, arr) {
        return '<div class="step ' + (s[2] ? 'is-done' : '') + '"><span class="n">' + (s[2] ? '✓' : s[0]) + '</span>' + s[1] + '</div>' + (i < arr.length - 1 ? '<span class="step-line"></span>' : '');
      }).join('') + '</div>';

      var pre = TH.gate('F022.C', '<div class="card">' + TH.cardHd(I('shieldCheck', 'ic-sm') + 'Kiểm lỗi trước khi commit' + TH.up('F022.C')) + '<div class="card-bd stack-sm">' +
        [[contracts.every(function (c) { return c.fees && c.fees.length; }), 'Tất cả hợp đồng có biểu phí cố định'], [readingsMissing.length === 0, readingsMissing.length ? readingsMissing.length + ' phòng thiếu/lỗi chỉ số: ' + readingsMissing.map(function (c) { return c.roomId; }).join(', ') : 'Đủ chỉ số đã xác nhận'], [!TH.db.extraFees.some(function (e) { return e.period === p && e.status === 'draft' && bs.indexOf(C.room(e.roomId).buildingId) > -1; }), 'Không còn phí phát sinh chờ duyệt'], [TH.db.rooms.filter(function (r) { return bs.indexOf(r.buildingId) > -1 && r.status === 'occupied'; }).every(function (r) { return C.contractOfRoom(r.id); }), 'Mọi phòng đang thuê đều có hợp đồng hiện hành']]
          .map(function (c) { return '<div class="row-flag ' + (c[0] ? 'pos' : 'neg') + '">' + I(c[0] ? 'checkCircle' : 'xCircle', 'ic-sm') + esc(c[1]) + '</div>'; }).join('') +
        TH.gate('F024.C', '<div class="small muted" style="margin-top:6px">' + TH.tierPill('C') + ' Soát chỉ số bất thường: ' + contracts.filter(function (c) { var is = C.readingIssue(C.reading(c.roomId, p), C.room(c.roomId)); return is && is.level === 'spike'; }).length + ' phòng đột biến cần lưu ý.</div>', { mode: 'mini', label: 'Soát chỉ số bất thường' }) + '</div></div>', { label: 'Kiểm lỗi phòng/HĐ thiếu biểu phí trước commit', lines: 4 });

      var batchCard = TH.gate('F022.D', '<div class="card">' + TH.cardHd(I('history', 'ic-sm') + 'Batch & audit' + TH.up('F022.D'), 'Chạy lại an toàn: chỉ tạo phòng chưa có hóa đơn (idempotent)', TH.permBtn('invoice.draft', '<button type="button" class="btn btn-sm" data-act="inv.gen" data-rerun="1"' + (locked ? ' disabled' : '') + '>' + I('refresh', 'ic-sm') + 'Chạy lại batch</button>', '403')) +
        TH.table({ compact: true, cols: [{ key: 'id', label: 'Batch', render: function (b) { return '<span class="mono small">' + b.id + '</span><div class="cell-sub">lần ' + b.run + '</div>'; } }, { key: 'at', label: 'Thời điểm', render: function (b) { return F.date(b.at) + '<div class="cell-sub">' + esc(C.staffName(b.by)) + '</div>'; } }, { key: 'c', label: 'Tạo / bỏ qua', num: true, render: function (b) { return b.created + ' / ' + b.skipped; } }],
          rows: TH.db.batches.filter(function (b) { return b.period === p; }), empty: { title: 'Chưa có batch', text: 'Batch xuất hiện sau khi sinh nháp.' } }) + '</div>', { label: 'Chạy lại batch an toàn, idempotent + audit', lines: 3 });

      var table = TH.table({
        label: 'Hóa đơn nháp theo phòng',
        cols: [
          { key: 'room', label: 'Phòng', render: function (i) { return TH.roomLink(i.roomId) + '<div class="cell-sub">' + esc(C.customer(i.customerId).name) + '</div>'; } },
          { key: 'rent', label: 'Tiền phòng', num: true, render: function (i) { return F.money(lineSum(i, ['rent'])); } },
          { key: 'fix', label: 'Phí cố định', num: true, render: function (i) { return F.money(lineSum(i, ['fixed'])); } },
          { key: 'ut', label: 'Điện nước', num: true, render: function (i) { return i.readingOk ? F.money(lineSum(i, ['elec', 'water'])) : '<span class="neg small">Thiếu chỉ số</span>'; } },
          { key: 'ex', label: 'Phát sinh', num: true, render: function (i) { var v = lineSum(i, ['extra']); return v ? F.money(v) : '<span class="muted">0</span>'; } },
          { key: 'pr', label: 'Lẻ kỳ', gate: 'F023.B', render: function () { return '<span class="small muted">Tròn tháng</span>'; } },
          { key: 'ver', label: 'Biểu phí', gate: 'F023.C', render: function (i) { return '<span class="small">v' + C.contract(i.contractId).versions.length + '</span>'; } },
          { key: 'tot', label: 'Tổng', num: true, render: function (i) { return '<b>' + F.money(i.total) + '</b>'; } },
          { key: 'st', label: 'Trạng thái', render: function (i) { var bl = i.status === 'draft' ? blockers(i) : []; return TH.status(i.status) + (bl.length ? '<div class="cell-sub neg">' + I('lock', 'ic-sm') + ' ' + esc(bl.join('; ')) + '</div>' : ''); } },
          { key: 'a', label: '', render: function (i) { return '<a class="btn btn-xs btn-ghost" href="' + TH.router.href('INV-03', i.id) + '">' + I('eye', 'ic-sm') + '</a>'; } },
        ],
        rows: invs,
        foot: invs.length ? { _label: '<b>' + invs.length + ' hóa đơn</b>', tot: '<b>' + F.money(C.sum(invs, function (i) { return i.total; })) + '</b>' } : null,
        empty: { title: 'Chưa có hóa đơn kỳ ' + F.period(p), text: 'Nhấn “Sinh nháp” để tạo hóa đơn nháp cho ' + contracts.length + ' phòng đang thuê.' },
      });

      var genBtn = TH.permBtn('invoice.draft', '<button type="button" class="btn btn-primary" data-act="inv.gen"' + (toCreate.length && !locked ? '' : ' disabled') + '>' + I('sparkles', 'ic-sm') + 'Sinh nháp ' + (toCreate.length ? toCreate.length + ' phòng' : '') + '</button>', 'Sinh nháp · 403');
      var meterBtn = TH.gate('F024.B', '<button type="button" class="btn" data-act="inv.meters"' + (readingsMissing.length ? '' : ' disabled') + '>' + I('zap', 'ic-sm') + 'Nhập chỉ số tại kỳ' + TH.up('F024.B') + '</button>', { mode: 'btn', label: 'Nhập bảng công tơ tại kỳ hóa đơn' });
      return TH.pageHeader({ screen: 'INV-01', status: TH.periodBadge(p), desc: 'Sinh hóa đơn nháp từng phòng theo tòa từ hợp đồng hiện hành, phí cố định, chỉ số điện nước và phí phát sinh. Không tạo trùng hóa đơn phòng–kỳ.',
          actions: '<button type="button" class="btn" data-act="mtr.fee">' + I('plus', 'ic-sm') + 'Bổ sung phí</button>' + meterBtn + '<a class="btn btn-primary" href="' + TH.router.href('INV-PREV') + '"' + (drafts.length ? '' : ' aria-disabled="true" data-tip="Chưa có hóa đơn nháp"') + '>' + I('eye', 'ic-sm') + 'Xem trước & xác nhận</a>' }) +
        '<div class="card" style="margin-bottom:16px"><div class="card-bd"><div class="row" style="gap:16px;align-items:flex-end">' + bSel + pSel + multiCtl + '<span class="grow"></span>' + genBtn + '</div><div class="divider"></div>' + stepper + '</div></div>' +
        (locked ? '<div class="alert alert-neutral" style="margin-bottom:16px">' + I('lock', 'ic-sm') + '<div class="alert-body">Kỳ ' + F.period(p) + ' đã khóa — không sinh thêm hóa đơn. Điều chỉnh qua biên bản (D).</div></div>' : '') +
        (readingsMissing.length && !locked ? '<div class="alert alert-warning" style="margin-bottom:16px">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>' + readingsMissing.length + ' phòng chưa đủ chỉ số đã xác nhận: ' + readingsMissing.map(function (c) { return c.roomId; }).join(', ') + '.</b><span>Hóa đơn của các phòng này bị khóa xác nhận. <a href="' + TH.router.href('METER-01') + '">Mở bảng điện nước (METER-01)</a></span></div></div>' : '') +
        '<div class="grid-main-side"><div class="card card-flush">' + TH.cardHd(I('receipt', 'ic-sm') + 'Hóa đơn kỳ ' + F.period(p), bs.map(TH.buildingName).join(', ') + ' · ' + confirmed.length + ' đã xác nhận, ' + drafts.length + ' nháp') + table + '</div><div class="stack">' + pre + batchCard +
        TH.gate('F023.D', '<div class="card">' + TH.cardHd(I('layers', 'ic-sm') + 'Nhiều đoạn hiệu lực' + TH.up('F023.D')) + '<div class="card-bd small">Hóa đơn tách dòng theo từng đoạn hiệu lực giá trong kỳ (ví dụ phụ lục từ ngày 15) và kiểm chứng tổng = tổng các đoạn. Kỳ này: không có đoạn tách.</div></div>', { label: 'Nhiều đoạn hiệu lực có kiểm chứng', lines: 2 }) +
        TH.gate('F024.D', '<div class="card">' + TH.cardHd(I('compare', 'ic-sm') + 'Đối chiếu công tơ / đơn giá theo version' + TH.up('F024.D')) + '<div class="card-bd small">Mỗi dòng điện nước trên hóa đơn gắn phiên bản đơn giá (v1 · từ ' + F.period(TH.PERIODS[0]) + ') và chỉ số đã chốt kỳ; sai lệch với công tơ nguồn hiển thị tại METER-01 › Đối chiếu.</div></div>', { label: 'Đối chiếu công tơ/đơn giá theo version', lines: 2 }) + '</div></div>';
    },
  };
  TH.onChange['inv.multi'] = function (el) { TH.store.setUi('INV-01', 'multi', el.checked); TH.app.refresh(); };
  TH.act['inv.gen'] = function (el) {
    var p = TH.store.state.period, bs = targetBuildings();
    var contracts = TH.db.contracts.filter(function (c) { return c.status === 'active' && bs.indexOf(c.buildingId) > -1 && c.start <= p + '-28'; });
    var created = 0, skipped = 0;
    var bid = 'BATCH-' + p.slice(2, 4) + p.slice(5) + '-' + String(TH.db.batches.filter(function (b) { return b.period === p; }).length + 1).padStart(2, '0');
    contracts.forEach(function (c) {
      if (TH.db.invoices.some(function (i) { return i.roomId === c.roomId && i.period === p && i.status !== 'cancelled'; })) { skipped++; return; }
      var inv = TH.buildInvoice(TH.db, c, p, 'draft'); inv.batch = bid;
      var n = 1; while (C.invoice(inv.id)) { n++; inv.id = inv.id.replace(/-v\d+$/, '') + '-v' + n; }
      TH.db.invoices.push(inv); created++;
    });
    TH.db.batches.unshift({ id: bid, period: p, buildings: bs, at: TH.TODAY + ' 09:30', by: TH.me().id, created: created, skipped: skipped, status: 'draft', run: TH.db.batches.filter(function (b) { return b.period === p; }).length + 1 });
    TH.log(el.dataset.rerun ? 'Chạy lại batch hóa đơn' : 'Sinh hóa đơn nháp', bid, created + ' tạo mới, ' + skipped + ' bỏ qua (đã có)', 'invoice');
    TH.app.refresh();
    TH.toast(created ? 'Đã sinh ' + created + ' hóa đơn nháp' : 'Không tạo thêm hóa đơn', skipped ? skipped + ' phòng đã có hóa đơn kỳ này — bỏ qua, không tạo trùng.' : 'Batch ' + bid);
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
      var drafts = TH.db.invoices.filter(function (i) { return i.period === p && i.status === 'draft' && bs.indexOf(i.buildingId) > -1; });
      var ready = drafts.filter(function (i) { return !blockers(i).length; });
      var total = C.sum(drafts, function (i) { return i.total; });
      var body = drafts.length ? '<div class="grid-4" style="margin-bottom:16px">' + TH.kpi({ label: 'Hóa đơn nháp', value: String(drafts.length) }) + TH.kpi({ label: 'Sẵn sàng xác nhận', value: String(ready.length) }) + TH.kpi({ label: 'Bị khóa', value: String(drafts.length - ready.length), neg: drafts.length > ready.length }) + TH.kpi({ label: 'Tổng trước chốt', value: F.short(total) }) + '</div>' +
        TH.table({ cols: [
          { key: 'r', label: 'Phòng / HĐ', render: function (i) { return '<b>' + i.roomId + '</b><div class="cell-sub">' + esc(i.contractId) + '</div>'; } },
          { key: 'rent', label: 'Tiền thuê', num: true, render: function (i) { return F.money(lineSum(i, ['rent'])); } },
          { key: 'fix', label: 'Cố định', num: true, render: function (i) { return F.money(lineSum(i, ['fixed'])); } },
          { key: 'm', label: 'Công tơ (Đ/N)', render: function (i) { var e = i.lines.find(function (l) { return l.type === 'elec'; }), w = i.lines.find(function (l) { return l.type === 'water'; }); return e ? '<span class="small">' + e.qty + ' kWh · ' + w.qty + ' m³</span>' : '<span class="neg small">' + I('alert', 'ic-sm') + ' thiếu/lỗi</span>'; } },
          { key: 'ut', label: 'Điện nước', num: true, render: function (i) { return F.money(lineSum(i, ['elec', 'water'])); } },
          { key: 'ex', label: 'Phát sinh', num: true, render: function (i) { var ex = i.lines.filter(function (l) { return l.type === 'extra'; }); return ex.length ? ex.map(function (l) { return '<span class="small">' + esc(l.name) + ' ' + F.money(l.amount) + (l.draft ? ' ' + TH.badge('chờ duyệt', 'warning') : '') + '</span>'; }).join('<br>') : '<span class="muted">0</span>'; } },
          { key: 't', label: 'Tổng', num: true, render: function (i) { return '<b>' + F.money(i.total) + '</b>'; } },
          { key: 's', label: '', render: function (i) { var bl = blockers(i); return bl.length ? TH.badge('Khóa', 'danger', { icon: 'lock', tip: bl.join('; ') }) : TH.badge('Sẵn sàng', 'success', { icon: 'check' }); } },
        ], rows: drafts, foot: { _label: '<b>Tổng</b>', t: '<b>' + F.money(total) + '</b>' } })
        : TH.state('empty', { title: 'Không có hóa đơn nháp', text: 'Sinh nháp ở INV-01 trước khi xem trước.' });
      return {
        title: 'Xem trước hóa đơn tòa/kỳ <span class="screen-id">INV-PREV</span>',
        sub: bs.map(TH.buildingName).join(', ') + ' · Kỳ ' + F.period(p) + ' · soát chỉ số, phí phát sinh, tổng trước chốt',
        headExtra: '<button type="button" class="pkg-btn" data-act="pkg.open" style="height:32px">' + I('settings', 'ic-sm') + '<span class="pkg-key" style="width:20px;height:20px;font-size:11px">' + TH.store.state.pkg + '</span></button>',
        body: body + (drafts.length > ready.length ? '<div class="alert alert-warning" style="margin-top:16px">' + I('lock', 'ic-sm') + '<div class="alert-body">Hóa đơn bị khóa sẽ giữ trạng thái Nháp cho đến khi chỉ số/phí được xác nhận. Chỉ xác nhận ' + ready.length + ' hóa đơn sẵn sàng.</div></div>' : ''),
        foot: '<button type="button" class="btn" data-close>Quay lại</button><span class="spacer"></span>' +
          TH.permBtn('invoice.confirm', '<button type="button" class="btn btn-primary" data-act="inv.confirm"' + (ready.length ? '' : ' disabled') + '>' + I('check', 'ic-sm') + 'Xác nhận ' + ready.length + ' hóa đơn</button>', 'Chỉ Kế toán/Admin xác nhận · 403'),
      };
    },
  };
  TH.act['inv.confirm'] = function () {
    var p = TH.store.state.period, bs = targetBuildings();
    var ready = TH.db.invoices.filter(function (i) { return i.period === p && i.status === 'draft' && bs.indexOf(i.buildingId) > -1 && !blockers(i).length; });
    TH.confirm({ title: 'Xác nhận ' + ready.length + ' hóa đơn?', body: '<p>Tổng <b>' + F.money(C.sum(ready, function (i) { return i.total; })) + '</b>. Sau khi xác nhận, hóa đơn không bị thay đổi im lặng; công nợ bắt đầu tính.</p>', ok: 'Xác nhận hóa đơn' }).then(function (ok) {
      if (!ok) return;
      ready.forEach(function (i) { i.status = 'confirmed'; i.confirmedBy = TH.me().id; i.confirmedAt = TH.TODAY; i.issuedAt = TH.TODAY; i.dueAt = TH.addDays(TH.TODAY, 10); });
      TH.db.batches.filter(function (b) { return b.period === p && b.status === 'draft'; }).forEach(function (b) { b.status = 'confirmed'; });
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
        cols: [
          { key: 'ck', label: '', labelHtml: '<span class="sr-only">Chọn</span>', gate: 'F025.B', cls: 'cell-check', tdCls: 'cell-check', render: function (i) { return i.status === 'confirmed' ? '<input type="checkbox" aria-label="Chọn ' + i.id + '" data-act="inv.sel" data-id="' + i.id + '"' + (sel.indexOf(i.id) > -1 ? ' checked' : '') + '>' : ''; } },
          { key: 'id', label: 'Số HĐơn', render: function (i) { return '<a class="mono" href="' + TH.router.href('INV-03', i.id) + '">' + i.id + '</a><div class="cell-sub">Kỳ ' + F.period(i.period) + '</div>'; } },
          { key: 'r', label: 'Phòng', render: function (i) { return TH.roomLink(i.roomId) + '<div class="cell-sub">' + esc(C.building(i.buildingId).short) + '</div>'; } },
          { key: 'k', label: 'Khách', render: function (i) { return esc(C.customer(i.customerId).name); } },
          { key: 't', label: 'Tổng tiền', num: true, render: function (i) { return F.money(i.total); } },
          { key: 'pd', label: 'Đã thu', num: true, render: function (i) { var pd = C.paid(i.id), pe = C.pending(i.id); return F.money(pd) + (pe ? '<div class="cell-sub warn-text">+' + F.short(pe) + ' chờ XN</div>' : ''); } },
          { key: 'd', label: 'Còn nợ', num: true, render: function (i) { var d = C.debt(i); return d ? '<b class="neg">' + F.money(d) + '</b>' : '<span class="muted">0</span>'; } },
          { key: 's', label: 'Trạng thái', render: function (i) { return TH.status(C.payState(i)); } },
          { key: 'v', label: 'Phiên bản', gate: 'F025.C', render: function (i) { return 'v' + (i.version || 1); } },
          { key: 'l', label: 'Khóa kỳ', gate: 'F025.D', render: function (i) { return TH.periodLocked(i.period) ? TH.badge('Đã khóa', 'neutral', { icon: 'lock' }) : '<span class="muted small">Mở</span>'; } },
        ],
        rows: pg.rows,
        rowAttrs: function (i) { return 'class="is-clickable' + (sel.indexOf(i.id) > -1 ? ' is-selected' : '') + '" tabindex="0" data-href="' + TH.router.href('INV-03', i.id) + '"'; },
        empty: { title: 'Không có hóa đơn phù hợp', text: 'Đổi bộ lọc trạng thái hoặc kỳ.' },
      });
      var sm = { t: C.sum(base.filter(function (i) { return i.status === 'confirmed'; }), function (i) { return i.total; }), pd: C.sum(base, function (i) { return C.paid(i.id); }), d: C.sum(base, function (i) { return C.debt(i); }) };
      var bulkBar = bulkSel && sel.length ? '<div class="toolbar" style="background:var(--teal-25)">' + TH.tierPill('B') + '<b class="small">' + sel.length + ' hóa đơn đã chọn</b><span class="grow"></span><button type="button" class="btn btn-sm" data-act="inv.bulkPdf">' + I('printer', 'ic-sm') + 'Xuất hàng loạt (PDF)</button><button type="button" class="btn btn-sm btn-primary" data-act="inv.bulkSend">' + I('send', 'ic-sm') + 'Gửi danh sách khách (Zalo)</button><button type="button" class="btn btn-sm btn-ghost" data-act="inv.selClear">Bỏ chọn</button></div>' : '';
      return TH.pageHeader({ screen: S, actions: TH.exportBtn('inv2.xlsx', 'Xuất Excel (.xlsx)') + TH.gate('F025.B', '', { mode: 'btn', label: 'Xuất hàng loạt & gửi danh sách' }) + '<a class="btn btn-primary" href="' + TH.router.href('INV-01') + '">' + I('plus', 'ic-sm') + 'Lập hóa đơn</a>' }) +
        '<div class="grid-3" style="margin-bottom:16px">' + TH.kpi({ label: 'Tổng hóa đơn đã xác nhận', icon: 'receipt', value: F.short(sm.t), foot: esc(allP === 'all' ? 'Mọi kỳ' : 'Kỳ ' + F.period(p)) }) + TH.kpi({ label: 'Đã thu (đã xác nhận)', icon: 'checkCircle', value: F.short(sm.pd) }) + TH.kpi({ label: 'Còn nợ', icon: 'wallet', value: F.short(sm.d), neg: sm.d > 0, foot: 'Nợ = HĐ đã xác nhận − phiếu thu đã xác nhận' }) + '</div>' +
        '<div class="card card-flush"><div class="toolbar">' + TH.searchBox(S, 'Tìm số HĐơn, phòng, khách…') + TH.uiSelect(S, 'allp', [{ id: 'cur', label: 'Kỳ ' + F.period(p) }, { id: 'all', label: 'Tất cả kỳ' }], allP, 'Kỳ') + '</div>' +
        '<div class="toolbar" style="gap:6px">' + TH.chips(S, 'st', [{ id: 'all', label: 'Tất cả', count: base.length }, { id: 'draft', label: 'Nháp', count: cnt('draft') }, { id: 'unpaid', label: 'Chưa thu', count: cnt('unpaid') }, { id: 'reported', label: 'Chờ xác nhận thu', count: cnt('reported') }, { id: 'partial', label: 'Thu một phần', count: cnt('partial') }, { id: 'overdue', label: 'Quá hạn', count: cnt('overdue') }, { id: 'paid', label: 'Đã thu đủ', count: cnt('paid') }], st) + '</div>' + bulkBar + table + TH.pager(S, pg) + '</div>';
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
    TH.exportXlsx('Hoa_don_cong_no_ky_' + p, [{ name: 'Hoa don', title: 'Hóa đơn & công nợ — ' + TH.scopeLabel(), note: 'Dữ liệu minh họa', columns: [{ label: 'Số HĐơn', width: 18 }, { label: 'Phòng' }, { label: 'Khách', width: 24 }, { label: 'Trạng thái', width: 22 }, { label: 'Tổng', type: 'money' }, { label: 'Đã thu', type: 'money' }, { label: 'Còn nợ', type: 'money' }],
      rows: rows.map(function (i) { return [i.id, i.roomId, C.customer(i.customerId).name, TH.statusLabel(C.payState(i)), i.total, C.paid(i.id), C.debt(i)]; }) }]);
    TH.toast('Đã xuất Excel', rows.length + ' hóa đơn');
  };

  /* ---------------- INV-03 ---------------- */
  function invoiceDoc(inv) {
    var b = C.building(inv.buildingId), k = C.customer(inv.customerId);
    return '<div class="print-doc"><div class="pd-head"><div><h1>HÓA ĐƠN TIỀN PHÒNG</h1><div>' + esc(inv.id) + ' · Kỳ ' + F.period(inv.period) + '</div></div><div style="text-align:right"><b>TIMEHOUSE</b><br>' + esc(b.name) + '<br><span class="pd-stamp">PDF NỘI BỘ · DỮ LIỆU MINH HỌA</span></div></div>' +
      '<div>Khách: <b>' + esc(k.name) + '</b> · Phòng ' + esc(inv.roomId) + ' · Hạn thanh toán ' + F.date(inv.dueAt) + '</div>' +
      '<table><thead><tr><th>Khoản</th><th class="num">SL</th><th class="num">Đơn giá</th><th class="num">Thành tiền</th></tr></thead><tbody>' + inv.lines.map(function (l) { return '<tr><td>' + esc(l.name) + '</td><td class="num">' + F.num(l.qty) + ' ' + esc(l.unit) + '</td><td class="num">' + F.money(l.price) + '</td><td class="num">' + F.money(l.amount) + '</td></tr>'; }).join('') +
      '<tr><td colspan="3"><b>Tổng cộng</b></td><td class="num"><b>' + F.money(inv.total) + '</b></td></tr></tbody></table>' +
      '<p style="margin-top:10px">Đã thu (đã xác nhận): ' + F.money(C.paid(inv.id)) + ' · Còn nợ: ' + F.money(C.debt(inv)) + '</p></div>';
  }
  TH.invoiceDoc = invoiceDoc;
  TH.views['INV-03'] = {
    scanParam: 'INV-2610-CG201',
    render: function (r) {
      var inv = C.invoice(r.param || 'INV-2610-CG201');
      if (!inv) return TH.pageHeader({ screen: 'INV-03' }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy hóa đơn' }) + '</div>';
      if (inv.status === 'draft') refreshDrafts(inv.buildingId, inv.period);
      inv = C.invoice(inv.id);
      var k = C.customer(inv.customerId), recs = C.receiptsOf(inv.id), msgs = TH.db.messages.filter(function (m) { return m.invoiceId === inv.id; });
      var paid = C.paid(inv.id), pend = C.pending(inv.id), debt = C.debt(inv), locked = TH.periodLocked(inv.period);
      var lines = TH.table({ cols: [
        { key: 'n', label: 'Khoản', render: function (l) { return esc(l.name) + (l.draft ? ' ' + TH.badge('chờ duyệt', 'warning') : ''); } },
        { key: 'q', label: 'SL', num: true, render: function (l) { return F.num(l.qty) + ' <span class="muted small">' + esc(l.unit) + '</span>'; } },
        { key: 'p', label: 'Đơn giá', num: true, render: function (l) { return F.money(l.price); } },
        { key: 'a', label: 'Thành tiền', num: true, render: function (l) { return F.money(l.amount); } },
      ], rows: inv.lines, foot: { _label: '<b>Tổng cộng</b>', a: '<b>' + F.money(inv.total) + '</b>' } });
      var zaloOk = inv.status === 'confirmed' && k.oaLinked;
      var actions = '<button type="button" class="btn" data-act="inv.pdf" data-id="' + inv.id + '">' + I('printer', 'ic-sm') + 'PDF nội bộ</button>' +
        TH.permBtn('oa.send', '<button type="button" class="btn" data-act="inv.zalo" data-id="' + inv.id + '"' + (zaloOk ? '' : ' disabled data-tip="' + (inv.status !== 'confirmed' ? 'Chỉ gửi hóa đơn đã xác nhận' : 'Khách chưa liên kết OA — không đủ điều kiện gửi') + '"') + '>' + I('send', 'ic-sm') + 'Gửi Zalo</button>', '403') +
        '<a class="btn" href="' + TH.router.href('PAY-02') + '">' + I('wallet', 'ic-sm') + 'Xem tiền đã thu</a>' +
        (inv.status === 'confirmed' ? TH.gate('F025.C', TH.permBtn('invoice.confirm', '<button type="button" class="btn btn-danger" data-act="inv.cancel" data-id="' + inv.id + '"' + (paid || locked ? ' disabled data-tip="Chỉ hủy/chỉnh hóa đơn chưa thu, kỳ chưa khóa"' : '') + '>' + I('xCircle', 'ic-sm') + 'Chỉnh/hủy' + TH.up('F025.C') + '</button>', '403'), { mode: 'btn', label: 'Chỉnh/hủy hóa đơn chưa thu' }) : '');
      return TH.pageHeader({ screen: 'INV-03', title: 'Hóa đơn ' + inv.id, crumbs: [['Hóa đơn', TH.router.href('INV-02')], [inv.id]], status: TH.status(C.payState(inv)), actions: actions }) +
        '<div class="grid-main-side"><div class="stack"><div class="card"><div class="card-bd"><div class="row-between"><div><div class="section-title" style="margin:0">TIMEHOUSE · ' + esc(C.building(inv.buildingId).name) + '</div><div class="money-total" style="margin-top:6px">' + F.money(inv.total) + '</div></div>' +
        TH.kv([['Kỳ', F.period(inv.period)], ['Phòng', TH.roomLink(inv.roomId)], ['Khách', '<a href="' + TH.router.href('CUS-02', k.id) + '">' + esc(k.name) + '</a>'], ['Hợp đồng', '<a href="' + TH.router.href('CON-02', inv.contractId) + '">' + esc(inv.contractId) + '</a>'], ['Phát hành / hạn', F.date(inv.issuedAt) + ' · ' + F.date(inv.dueAt)]]) + '</div></div>' + lines + '</div>' +
        (inv.status === 'draft' && blockers(inv).length ? '<div class="alert alert-warning">' + I('lock', 'ic-sm') + '<div class="alert-body"><b>Hóa đơn nháp bị khóa xác nhận</b><span>' + esc(blockers(inv).join('; ')) + '</span></div></div>' : '') +
        TH.gate('F025.D', '<div class="card">' + TH.cardHd(I('stamp', 'ic-sm') + 'Khóa kỳ & biên bản điều chỉnh' + TH.up('F025.D')) + '<div class="card-bd">' + (locked ? '<p class="small">Kỳ ' + F.period(inv.period) + ' đã khóa. Mọi thay đổi lập <b>biên bản điều chỉnh</b> có audit.</p><button type="button" class="btn btn-sm" data-act="inv.adjust" data-id="' + inv.id + '">' + I('edit', 'ic-sm') + 'Lập biên bản điều chỉnh</button>' : '<p class="small muted">Kỳ chưa khóa. Khóa kỳ tại RPT-01.</p>') +
          '<ul class="timeline" style="margin-top:12px">' + TH.db.audit.filter(function (a) { return a.entity === inv.id || (a.kind === 'invoice' && a.detail.indexOf(inv.buildingId) > -1); }).slice(0, 4).map(function (a) { return '<li>' + esc(a.action) + '<div class="when">' + esc(C.staffName(a.by)) + ' · ' + F.date(a.at) + '</div></li>'; }).join('') + '<li>Xác nhận hóa đơn<div class="when">' + esc(C.staffName(inv.confirmedBy || 'NV-002')) + ' · ' + F.date(inv.confirmedAt || inv.issuedAt) + '</div></li></ul></div></div>', { label: 'Khóa kỳ, biên bản điều chỉnh và audit', lines: 3 }) + '</div>' +
        '<div class="stack"><div class="card">' + TH.cardHd(I('wallet', 'ic-sm') + 'Thu tiền', 'Thu nhiều lần / 1 hóa đơn; không âm dư nợ') + '<div class="card-bd">' +
        TH.kv([['Đã thu (đã xác nhận)', '<b class="pos tnum">' + F.money(paid) + '</b>'], ['Báo thu chờ xác nhận', '<span class="warn-text tnum">' + F.money(pend) + '</span>'], ['Còn nợ', '<b class="' + (debt ? 'neg' : '') + ' tnum">' + F.money(debt) + '</b>']]) +
        '<div class="progress" style="margin-top:12px"><span style="width:' + Math.min(100, paid / inv.total * 100) + '%"></span><span style="width:' + Math.min(100, pend / inv.total * 100) + '%;background:var(--warning-line)"></span></div>' +
        '<ul class="timeline" style="margin-top:16px">' + (recs.length ? recs.map(function (rc) { return '<li>' + TH.status(rc.status) + ' <b class="tnum">' + F.money(rc.amount) + '</b> · ' + esc(rc.method) + '<div class="when">Thực nhận ' + F.date(rc.receivedAt) + ' · báo bởi ' + esc(C.staffName(rc.reportedBy)) + (rc.status === 'pending' ? ' · <a href="' + TH.router.href('PAY-APP', rc.id) + '">xác nhận</a>' : '') + '</div></li>'; }).join('') : '<li class="muted">Chưa có báo thu.</li>') + '</ul>' +
        (inv.status === 'confirmed' && debt > 0 ? TH.permBtn('receipt.report', '<a class="btn btn-sm" href="' + TH.router.href('PAY-01') + '" data-act="pay.reportFor" data-id="' + inv.id + '">' + I('handCoins', 'ic-sm') + 'Báo đã thu</a>', '403') : '') + '</div></div>' +
        '<div class="card">' + TH.cardHd(I('send', 'ic-sm') + 'Lịch gửi Zalo', TH.simBadge()) + '<div class="card-bd"><ul class="timeline">' + (msgs.length ? msgs.map(function (m) { return '<li>' + TH.status(m.status) + ' ' + esc(TH.db.oaTemplates.find(function (t) { return t.id === m.template; }).name) + '<div class="when">' + F.date(m.at) + (m.reason ? ' · ' + esc(m.reason) : '') + '</div></li>'; }).join('') : '<li class="muted">Chưa gửi.</li>') + '</ul></div></div></div></div>';
    },
  };
  TH.act['inv.pdf'] = function (el) { TH.printDoc(invoiceDoc(C.invoice(el.dataset.id))); };
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
