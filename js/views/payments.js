/* Thu tiền: PAY-01 (báo đã thu), PAY-APP (kế toán xác nhận), PAY-02 (công nợ & mốc 5/10/15). F029–F033. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;
  var SEQ = ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)'];

  function inv(r) { return C.invoice(r.invoiceId); }
  function msPreview(dateIso, invObj) { return C.milestone({ status: 'confirmed', receivedAt: dateIso }, invObj); }
  function dupOf(r) {
    return TH.db.receipts.filter(function (x) { return x !== r && x.invoiceId === r.invoiceId && x.status !== 'rejected' && (x.amount === r.amount || x.evidence === r.evidence); });
  }

  /* ---------------- PAY-01 ---------------- */
  TH.views['PAY-01'] = {
    render: function () {
      var S = 'PAY-01', p = TH.store.state.period, st = TH.has('F029.B') ? TH.store.ui(S, 'st', 'pending') : 'all';
      var all = TH.db.receipts.filter(function (r) { var i = inv(r); return TH.inScope(i.buildingId) && (TH.has('F029.B') ? i.period === p : (i.period === p || r.status === 'pending')); })
        .sort(function (a, b) { return (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || (a.reportedAt < b.reportedAt ? 1 : -1); });
      var rows = all.filter(function (r) { return st === 'all' || r.status === st; });
      var pg = TH.paginate(S, rows, 10);
      var sel = TH.store.ui(S, 'sel', []), canBatch = TH.has('F030.B') && TH.can('receipt.confirm');
      var me = TH.me().id;
      var table = TH.table({
        label: 'Báo đã thu',
        cols: [
          { key: 'ck', label: '', labelHtml: '<span class="sr-only">Chọn</span>', gate: 'F030.B', cls: 'cell-check', tdCls: 'cell-check', render: function (r) { return r.status === 'pending' && canBatch && r.reportedBy !== me ? '<input type="checkbox" aria-label="Chọn ' + r.id + '" data-act="pay.sel" data-id="' + r.id + '"' + (sel.indexOf(r.id) > -1 ? ' checked' : '') + '>' : ''; } },
          { key: 'id', label: 'Phiếu', render: function (r) { return '<span class="mono">' + r.id + '</span><div class="cell-sub">' + esc(r.method) + '</div>'; } },
          { key: 'ql', label: 'QL tòa (người báo)', render: function (r) { return TH.personCell(C.staffName(r.reportedBy), esc(C.building(inv(r).buildingId).short)); } },
          { key: 'inv', label: 'Hóa đơn', render: function (r) { return '<a class="mono" href="' + TH.router.href('INV-03', r.invoiceId) + '">' + r.invoiceId + '</a><div class="cell-sub">Phòng ' + esc(inv(r).roomId) + ' · còn nợ ' + F.short(C.debt(inv(r))) + '</div>'; } },
          { key: 'a', label: 'Số báo thu', num: true, render: function (r) { return '<b>' + F.money(r.amount) + '</b>'; } },
          { key: 'd', label: 'Ngày báo · thực nhận', render: function (r) { return F.date(r.reportedAt) + '<div class="cell-sub">Nhận ' + F.date(r.receivedAt) + '</div>'; } },
          { key: 'ev', label: 'Chứng từ', render: function (r) { return '<span class="small">' + I('paperclip', 'ic-sm') + ' ' + esc(r.evidence) + '</span>'; } },
          { key: 's', label: 'Trạng thái', render: function (r) { return TH.status(r.status) + (r.status === 'rejected' ? '<div class="cell-sub neg">' + esc(r.rejectReason) + '</div>' : r.confirmedBy ? '<div class="cell-sub">' + esc(C.staffName(r.confirmedBy)) + '</div>' : ''); } },
          { key: 'dup', label: 'Chống trùng', gate: 'F029.C', render: function (r) { var d = dupOf(r); return d.length ? TH.badge('Nghi trùng ' + d.length, 'danger', { icon: 'alert', tip: 'Trùng hóa đơn và số tiền/chứng từ với ' + d.map(function (x) { return x.id; }).join(', ') }) : '<span class="muted small">—</span>'; } },
          { key: 'log', label: 'Trao đổi', gate: 'F029.D', render: function (r) { return '<span class="small">' + (r.status === 'rejected' ? '2 tin' : r.status === 'pending' ? '1 tin' : '—') + '</span>'; } },
          { key: 'x', label: '', render: function (r) {
            if (r.status !== 'pending') return '';
            if (!TH.can('receipt.confirm')) return TH.permBtn('receipt.confirm', '', 'Duyệt · 403');
            if (r.reportedBy === me) return '<span class="forbidden-chip" data-tip="Người báo thu không được tự duyệt">Không tự duyệt</span>';
            return '<a class="btn btn-xs btn-primary" href="' + TH.router.href('PAY-APP', r.id) + '">Xác nhận</a>';
          } },
        ],
        rows: pg.rows,
        empty: { title: 'Không có báo thu', text: 'Chưa có báo thu ở trạng thái đang lọc.' },
      });
      var batchBar = canBatch && sel.length ? '<div class="toolbar" style="background:var(--teal-25)">' + TH.tierPill('B') + '<b class="small">' + sel.length + ' báo thu đã chọn · ' + F.money(C.sum(sel.map(function (id) { return TH.db.receipts.find(function (x) { return x.id === id; }); }), function (r) { return r.amount; })) + '</b><span class="grow"></span><button type="button" class="btn btn-sm btn-primary" data-act="pay.batch">' + I('check', 'ic-sm') + 'Xác nhận theo danh sách đã kiểm</button><button type="button" class="btn btn-sm btn-ghost" data-act="pay.selClear">Bỏ chọn</button></div>' : '';
      var progress = TH.gate('F029.B', '<div class="card" style="margin-bottom:16px">' + TH.cardHd(I('activity', 'ic-sm') + 'Tiến độ thu kỳ ' + F.period(p) + TH.up('F029.B')) + '<div class="card-bd"><div class="grid-3">' + TH.db.buildings.filter(function (b) { return TH.inScope(b.id); }).map(function (b) {
        var s = C.summary(p, b.id), pct = s.billed ? s.collectedForPeriod / s.billed : 0;
        return '<div><div class="row-between small"><b>' + esc(b.short) + '</b><span class="tnum">' + F.pct(pct, 0) + '</span></div><div class="progress" style="margin:6px 0"><span style="width:' + pct * 100 + '%"></span></div><div class="small muted tnum">' + F.short(s.collectedForPeriod) + ' / ' + F.short(s.billed) + (s.pending ? ' · ' + F.short(s.pending) + ' chờ XN' : '') + '</div></div>';
      }).join('') + '</div></div></div>', { label: 'Theo dõi tiến độ thu theo kỳ', lines: 2 });
      var filters = TH.has('F029.B') ? TH.chips(S, 'st', [{ id: 'pending', label: 'Chờ xác nhận', count: all.filter(function (r) { return r.status === 'pending'; }).length }, { id: 'confirmed', label: 'Đã xác nhận', count: all.filter(function (r) { return r.status === 'confirmed'; }).length }, { id: 'rejected', label: 'Từ chối', count: all.filter(function (r) { return r.status === 'rejected'; }).length }, { id: 'all', label: 'Tất cả', count: all.length }], st) + TH.up('F029.B')
        : '<span class="small muted">Danh sách báo thu kỳ ' + F.period(p) + ' (chờ xác nhận lên đầu)</span><span class="grow"></span>' + TH.gate('F029.B', '', { mode: 'btn', label: 'Lọc theo kỳ & trạng thái', size: 'btn-sm' });
      return TH.pageHeader({ screen: S, desc: 'Quản lý tòa báo đã thu kèm chứng từ. Báo thu <b>không giảm công nợ</b> cho đến khi kế toán/Admin xác nhận thực thu.',
        actions: TH.permBtn('receipt.report', '<button type="button" class="btn btn-primary" data-act="pay.report">' + I('handCoins', 'ic-sm') + 'Báo đã thu</button>', 'Báo thu · 403') }) +
        progress + '<div class="card card-flush"><div class="toolbar">' + filters + '</div>' + batchBar + table + TH.pager(S, pg) + '</div>';
    },
    dialogs: [function () { reportForm(); }],
  };
  function reportForm() {
    var form = 'pay-rep';
    var open = TH.db.invoices.filter(function (i) { return i.status === 'confirmed' && C.debt(i) > 0 && TH.inScope(i.buildingId); });
    var invId = TH.store.draft(form, 'inv', open[0] && open[0].id), invObj = C.invoice(invId);
    var amount = +String(TH.store.draft(form, 'amount', invObj ? C.debt(invObj) : '')).replace(/\D/g, '');
    var date = TH.store.draft(form, 'date', TH.TODAY);
    var dup = invObj ? TH.db.receipts.filter(function (x) { return x.invoiceId === invObj.id && x.status === 'pending'; }) : [];
    var over = invObj && amount > C.debt(invObj);
    var ms = invObj && date ? msPreview(date, invObj) : null;
    return {
      title: 'Báo đã thu', sub: 'PAY-01 · Báo thu không làm giảm công nợ cho đến khi được xác nhận',
      body: '<div class="stack"><div class="form-grid">' +
        TH.field({ form: form, name: 'inv', label: 'Hóa đơn còn nợ', type: 'select', options: open.map(function (i) { return { id: i.id, label: i.id + ' · ' + i.roomId + ' · nợ ' + F.money(C.debt(i)) }; }), def: open[0] && open[0].id, span: true }) +
        TH.field({ form: form, name: 'amount', label: 'Số tiền báo thu', num: true, inputmode: 'numeric', def: invObj ? String(C.debt(invObj)) : '', live: true, invalid: over, error: over ? 'Vượt số còn nợ — không cho âm dư nợ' : '' }) +
        TH.field({ form: form, name: 'date', label: 'Ngày khách trả (thực nhận)', type: 'date', def: TH.TODAY, live: true, hint: ms ? 'Dự kiến tính ' + ms.label + ' · ' + F.pct(ms.weight, 0) + ' (sau khi xác nhận)' : '' }) +
        TH.field({ form: form, name: 'method', label: 'Hình thức', type: 'select', options: ['Chuyển khoản', 'Tiền mặt'], def: 'Chuyển khoản' }) +
        '<div class="field"><span class="field-label">Chứng từ</span><div class="row">' + TH.fileOf('ck_bao_thu_' + (invObj ? invObj.roomId : '') + '.png') + '</div></div></div>' +
        (dup.length ? TH.gate('F029.C', '<div class="alert alert-danger">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Có báo thu đang chờ cho hóa đơn này ' + TH.up('F029.C') + '</b><span>' + dup.map(function (d) { return d.id + ' · ' + F.money(d.amount) + ' · ' + F.date(d.reportedAt); }).join('<br>') + '</span><span>Kiểm tra trùng yêu cầu/nguồn tiền trước khi gửi.</span></div></div>', { label: 'Chống trùng yêu cầu/nguồn tiền', lines: 1 }) : '') +
        TH.field({ form: form, name: 'note', label: 'Ghi chú', def: '' }) + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="pay.reportSave"' + (invObj && amount && !over ? '' : ' disabled') + '>' + I('send', 'ic-sm') + 'Gửi báo thu</button>',
    };
  }
  TH.act['pay.report'] = function () { TH.modal.open({ key: 'pay-rep', size: 'md', render: reportForm }); };
  TH.act['pay.reportFor'] = function (el) {
    TH.store.setDraft('pay-rep', 'inv', el.dataset.id); TH.store.setDraft('pay-rep', 'amount', String(C.debt(C.invoice(el.dataset.id))));
    TH.go('PAY-01');
    setTimeout(function () { TH.modal.open({ key: 'pay-rep', size: 'md', render: reportForm }); }, 30);
  };
  TH.act['pay.reportSave'] = function () {
    var g = function (k, d) { return TH.store.draft('pay-rep', k, d); };
    var invObj = C.invoice(g('inv')), amount = +String(g('amount', C.debt(invObj))).replace(/\D/g, '');
    var id = 'PT-' + invObj.period.slice(2, 4) + invObj.period.slice(5) + '-' + String(TH.db.receipts.length + 1).padStart(3, '0');
    TH.db.receipts.push({ id: id, invoiceId: invObj.id, amount: amount, reportedBy: TH.me().id, reportedAt: TH.TODAY, receivedAt: g('date', TH.TODAY), method: g('method', 'Chuyển khoản'), evidence: 'ck_bao_thu_' + invObj.roomId + '.png', status: 'pending', confirmedBy: null, confirmedAt: null, note: g('note', '') });
    TH.log('Báo đã thu', id, invObj.id + ' · ' + F.money(amount), 'receipt', invObj.buildingId);
    TH.store.clearDraft('pay-rep'); TH.modal.close('pay-rep', { silent: true }); TH.app.refresh();
    TH.toast('Đã gửi báo thu ' + id, 'Chờ kế toán/Admin xác nhận — công nợ chưa giảm.', 'info');
  };
  TH.act['pay.sel'] = function (el, ev) { ev.stopPropagation(); var s = TH.store.ui('PAY-01', 'sel', []).slice(), i = s.indexOf(el.dataset.id); if (i > -1) s.splice(i, 1); else s.push(el.dataset.id); TH.store.setUi('PAY-01', 'sel', s); TH.app.refresh(); };
  TH.act['pay.selClear'] = function () { TH.store.setUi('PAY-01', 'sel', []); TH.app.refresh(); };
  TH.act['pay.batch'] = function () {
    var ids = TH.store.ui('PAY-01', 'sel', []);
    TH.confirm({ title: 'Xác nhận ' + ids.length + ' báo thu?', body: '<p>Chỉ xác nhận danh sách đã kiểm chứng từ. Ngày thực nhận giữ theo báo thu.</p>', ok: 'Xác nhận ' + ids.length + ' phiếu' }).then(function (ok) {
      if (!ok) return;
      ids.forEach(function (id) { confirmReceipt(TH.db.receipts.find(function (x) { return x.id === id; })); });
      TH.store.setUi('PAY-01', 'sel', []); TH.app.refresh();
      TH.toast('Đã xác nhận ' + ids.length + ' phiếu thu', 'Công nợ, mốc 5/10/15 và báo cáo đã cập nhật.');
    });
  };
  function confirmReceipt(r, receivedAt) {
    var invObj = inv(r);
    var amt = Math.min(r.amount, C.debt(invObj));
    if (receivedAt && receivedAt !== r.receivedAt) {
      TH.db.receiptEdits.push({ receiptRoom: invObj.roomId, period: invObj.period, from: r.receivedAt, to: receivedAt, by: TH.me().id, at: TH.TODAY + ' 10:00', reason: 'Điều chỉnh khi xác nhận theo chứng từ' });
      r.receivedAt = receivedAt;
    }
    r.amount = amt; r.status = 'confirmed'; r.confirmedBy = TH.me().id; r.confirmedAt = TH.TODAY;
    var ms = C.milestone(r, invObj);
    TH.log('Xác nhận phiếu thu', r.id, invObj.roomId + ' · ' + F.money(amt) + ' · thực nhận ' + F.date(r.receivedAt) + ' (' + (ms ? ms.label : '') + ')', 'receipt', invObj.buildingId);
  }

  /* ---------------- PAY-APP ---------------- */
  TH.views['PAY-APP'] = {
    modal: { size: 'lg' },
    scanParam: 'PT-2610-087',
    render: function (rt) {
      var r = TH.db.receipts.find(function (x) { return x.id === rt.param; }) || TH.db.receipts.find(function (x) { return x.status === 'pending'; });
      if (!r) return { title: 'Xác nhận phiếu thu kế toán', body: TH.state('empty', { title: 'Không có báo thu chờ xác nhận' }), foot: '<button class="btn" data-close>Đóng</button>' };
      var invObj = inv(r), form = 'app-' + r.id;
      var recv = TH.store.draft(form, 'recv', r.receivedAt), ms = msPreview(recv, invObj);
      var canApprove = TH.can('receipt.confirm'), self = r.reportedBy === TH.me().id, pending = r.status === 'pending';
      var dups = dupOf(r);
      var others = TH.db.receipts.filter(function (x) { return x.status === 'pending' && x !== r && TH.inScope(inv(x).buildingId); });
      var left = '<div class="stack">' +
        '<div class="grid-2">' + TH.kpi({ label: 'Số tiền báo thu', value: F.money(r.amount) }) + TH.kpi({ label: 'Hóa đơn còn nợ', value: F.money(C.debt(invObj)), foot: 'Tổng ' + F.money(invObj.total) + ' · đã thu ' + F.money(C.paid(invObj.id)) }) + '</div>' +
        TH.kv([['Hóa đơn', '<a href="' + TH.router.href('INV-03', invObj.id) + '" data-close>' + invObj.id + '</a> · phòng ' + invObj.roomId], ['Khách', esc(C.customer(invObj.customerId).name)], ['Người báo', esc(C.staffName(r.reportedBy)) + ' · ' + F.date(r.reportedAt)], ['Hình thức', esc(r.method)], ['Ghi chú', esc(r.note || '—')]]) +
        '<div class="card" style="background:var(--n-50)"><div class="card-bd row" style="gap:12px">' + TH.fileOf(r.evidence) + TH.simBadge('Ảnh chứng từ minh họa') + '</div></div>' +
        (pending ? TH.field({ form: form, name: 'recv', label: 'Ngày thực nhận (ghi nhận)', type: 'date', def: r.receivedAt, live: true, hint: 'Mốc tính theo ngày thực nhận đã xác nhận: <b>' + (ms ? ms.label + ' · ' + F.pct(ms.weight, 0) : '—') + '</b> ' + TH.openBadge('D-04') }) : '') +
        (pending && recv !== r.receivedAt ? TH.gate('F032.C', '<div class="alert alert-warning">' + I('history', 'ic-sm') + '<div class="alert-body"><b>Điều chỉnh ngày tiền ' + TH.up('F032.C') + '</b><span>Đổi từ ' + F.date(r.receivedAt) + ' → ' + F.date(recv) + '. Thay đổi được ghi log và hiển thị ở báo cáo giải trình (RPT-02).</span></div></div>', { label: 'Soát backdate/điều chỉnh ngày tiền', lines: 1 }) : '') +
        TH.gate('F030.C', '<div class="alert ' + (dups.length ? 'alert-danger' : 'alert-success') + '">' + I(dups.length ? 'alert' : 'checkCircle', 'ic-sm') + '<div class="alert-body"><b>Kiểm tra trùng số tiền/phiếu & tranh chấp ' + TH.up('F030.C') + '</b><span>' + (dups.length ? 'Trùng với ' + dups.map(function (d) { return d.id + ' (' + TH.statusLabel(d.status) + ')'; }).join(', ') : 'Không phát hiện phiếu thu trùng.') + '</span></div></div>', { label: 'Kiểm tra số tiền/phiếu thu trùng và tranh chấp', lines: 1 }) +
        TH.gate('F030.D', '<div class="card"><div class="card-hd"><div class="card-title">' + I('compare', 'ic-sm') + 'Đối soát sao kê (nhập thủ công)' + TH.up('F030.D') + '</div><span class="small muted">Không kết nối bank API</span></div><div class="card-bd">' + TH.field({ form: form, name: 'stmt', label: 'Mã giao dịch trên sao kê', def: '', placeholder: 'VD: FT26290xxxx' }) + '<div class="small muted" style="margin-top:6px">' + (TH.store.draft(form, 'stmt', '') ? TH.badge('Đã khớp sao kê', 'success') : 'Chưa nhập mã giao dịch') + '</div></div></div>', { label: 'Đối soát với sao kê nhập thủ công', lines: 2 }) +
        (pending ? TH.field({ form: form, name: 'reason', label: 'Lý do (bắt buộc khi từ chối)', def: '' }) : '<div class="alert alert-neutral">' + I('info', 'ic-sm') + '<div class="alert-body">Phiếu đã ' + TH.statusLabel(r.status).toLowerCase() + (r.confirmedBy ? ' bởi ' + esc(C.staffName(r.confirmedBy)) + ' ngày ' + F.date(r.confirmedAt) : '') + '.</div></div>') + '</div>';
      var hist = TH.gate('F030.C', '', { mode: 'mini', label: '' });
      var side = '<div class="stack">' +
        TH.gate('F029.B', '<div class="card"><div class="card-hd"><div class="card-title small">Báo thu chờ khác ' + TH.up('F029.B') + '</div></div><div class="card-bd" style="padding:8px">' + (others.length ? others.slice(0, 6).map(function (x) { return '<a class="menu-item" href="' + TH.router.href('PAY-APP', x.id) + '"><span class="mono small">' + x.id + '</span><span class="muted" style="margin-left:auto">' + F.short(x.amount) + '</span></a>'; }).join('') : '<span class="small muted">Không còn.</span>') + '</div></div>', { label: 'Lọc nhanh theo kỳ/tòa', lines: 2 }) +
        TH.gate('F032.D', '<div class="card"><div class="card-hd"><div class="card-title small">Đối soát & khóa kỳ ' + TH.up('F032.D') + '</div></div><div class="card-bd small">' + (TH.periodLocked(invObj.period) ? TH.badge('Kỳ đã khóa — cần biên bản', 'neutral', { icon: 'lock' }) : 'Kỳ ' + F.period(invObj.period) + ' đang mở. Sau khi chốt mốc, thay đổi được đối chiếu phiên bản.') + '</div></div>', { label: 'Chốt mốc và đối chiếu phiên bản', lines: 2 }) +
        TH.gate('F029.D', '<div class="card"><div class="card-hd"><div class="card-title small">Nhật ký trao đổi ' + TH.up('F029.D') + '</div></div><div class="card-bd"><ul class="timeline"><li>' + esc(C.staffName(r.reportedBy)) + ': ' + esc(r.note || 'Đã gửi báo thu kèm chứng từ.') + '<div class="when">' + F.date(r.reportedAt) + '</div></li>' + (r.rejectReason ? '<li>' + esc(C.staffName(r.confirmedBy)) + ': ' + esc(r.rejectReason) + '<div class="when">' + F.date(r.confirmedAt) + '</div></li>' : '') + '</ul></div></div>', { label: 'Nhật ký giao tiếp duyệt', lines: 2 }) + hist + '</div>';
      var foot = '<button type="button" class="btn" data-close>Đóng</button><span class="spacer"></span>';
      if (pending) {
        if (!canApprove) foot += TH.permBtn('receipt.confirm', '', 'Chỉ Kế toán/Admin xác nhận · 403');
        else if (self) foot += '<span class="forbidden-chip">' + I('ban', 'ic-sm') + 'Người báo thu không được tự duyệt</span>';
        else foot += '<button type="button" class="btn btn-danger" data-act="app.reject" data-id="' + r.id + '">' + I('xCircle', 'ic-sm') + 'Từ chối</button><button type="button" class="btn btn-primary" data-act="app.ok" data-id="' + r.id + '">' + I('check', 'ic-sm') + 'Xác nhận thực thu</button>';
      }
      return { title: 'Xác nhận phiếu thu kế toán <span class="screen-id">PAY-APP</span>', sub: esc(r.id) + ' · ' + TH.statusLabel(r.status) + ' · chỉ phiếu đã xác nhận mới giảm công nợ',
        body: '<div class="grid-main-side" style="grid-template-columns:minmax(0,1fr) 260px">' + left + side + '</div>', foot: foot };
    },
  };
  TH.act['app.ok'] = function (el) {
    var r = TH.db.receipts.find(function (x) { return x.id === el.dataset.id; }), form = 'app-' + r.id;
    confirmReceipt(r, TH.store.draft(form, 'recv', r.receivedAt));
    TH.store.clearDraft(form);
    TH.modal.close(TH.modal.top().key);
    TH.app.refresh();
    TH.toast('Đã xác nhận thực thu ' + r.id, F.money(r.amount) + ' · công nợ, mốc 5/10/15, lương nháp và báo cáo đã cập nhật.');
  };
  TH.act['app.reject'] = function (el) {
    var r = TH.db.receipts.find(function (x) { return x.id === el.dataset.id; }), form = 'app-' + r.id;
    var reason = (TH.store.draft(form, 'reason', '') || '').trim();
    if (!reason) { TH.toast('Cần lý do từ chối', 'Nhập lý do để người báo thu xử lý lại.', 'danger'); var f = document.getElementById('f-' + form + '-reason'); if (f) f.focus(); return; }
    r.status = 'rejected'; r.rejectReason = reason; r.confirmedBy = TH.me().id; r.confirmedAt = TH.TODAY;
    TH.log('Từ chối báo thu', r.id, reason, 'receipt', inv(r).buildingId);
    TH.store.clearDraft(form); TH.modal.close(TH.modal.top().key); TH.app.refresh();
    TH.toast('Đã từ chối báo thu', esc(reason), 'warning');
  };

  /* ---------------- PAY-02 ---------------- */
  TH.views['PAY-02'] = {
    render: function () {
      var S = 'PAY-02', p = TH.store.state.period, scope = TH.scope();
      var lead = TH.has('F032.B') ? TH.store.ui(S, 'lead', 'ALL') : 'ALL';
      var invs = C.invoicesIn(p, scope).filter(function (i) { return i.status === 'confirmed' && (lead === 'ALL' || C.building(i.buildingId).managerId === lead); });
      var ms = { m5: 0, m10: 0, m15: 0, late: 0, weighted: 0 };
      var rows = invs.map(function (i) {
        var row = { inv: i, m5: 0, m10: 0, m15: 0, late: 0, w: 0 };
        C.receiptsOf(i.id).forEach(function (r) { var m = C.milestone(r, i); if (!m || m.key === 'other') return; row[m.key] += r.amount; row.w += r.amount * m.weight; });
        ['m5', 'm10', 'm15', 'late'].forEach(function (k) { ms[k] += row[k]; }); ms.weighted += row.w;
        return row;
      });
      var pbs = TH.db.buildings.filter(function (b) { return TH.inScope(b.id) && (scope === 'ALL' || b.id === scope) && (lead === 'ALL' || b.managerId === lead); });
      var perfRows = pbs.map(function (b) { var r = C.perfBuilding(p, b.id); r.t = TH.perfTier(r); return r; });
      var perfD = C.sum(perfRows, function (r) { return r.t.D; }), perfN = C.sum(perfRows, function (r) { return r.listed; });
      var billed = C.sum(invs, function (i) { return i.total; }), coll = ms.m5 + ms.m10 + ms.m15 + ms.late, debt = C.sum(invs, function (i) { return C.debt(i); }), pend = C.sum(invs, function (i) { return C.pending(i.id); });
      var table = TH.table({
        label: 'Công nợ và mốc 5/10/15',
        cols: [
          { key: 'r', label: 'Tòa / phòng', render: function (x) { return '<b>' + TH.roomLink(x.inv.roomId) + '</b><div class="cell-sub">' + esc(C.building(x.inv.buildingId).short) + '</div>'; } },
          { key: 'i', label: 'Hóa đơn', render: function (x) { return '<a class="mono small" href="' + TH.router.href('INV-03', x.inv.id) + '">' + x.inv.id + '</a><div class="cell-sub">' + F.money(x.inv.total) + '</div>'; } },
          { key: 'm5', label: '≤5 · 100%', num: true, render: function (x) { return x.m5 ? F.money(x.m5) : '<span class="muted">—</span>'; } },
          { key: 'm10', label: '≤10 · 90%', num: true, render: function (x) { return x.m10 ? F.money(x.m10) : '<span class="muted">—</span>'; } },
          { key: 'm15', label: '≤15 · 70%', num: true, render: function (x) { return x.m15 ? F.money(x.m15) : '<span class="muted">—</span>'; } },
          { key: 'late', label: 'Sau 15 · 0%', num: true, render: function (x) { return x.late ? F.money(x.late) : '<span class="muted">—</span>'; } },
          { key: 'c', label: 'Thực thu', num: true, render: function (x) { var pe = C.pending(x.inv.id); return '<b>' + F.money(x.m5 + x.m10 + x.m15 + x.late) + '</b>' + (pe ? '<div class="cell-sub warn-text">+' + F.short(pe) + ' chờ XN</div>' : ''); } },
          { key: 'd', label: 'Còn nợ', num: true, render: function (x) { var d = C.debt(x.inv); return d ? '<b class="neg">' + F.money(d) + '</b>' : '<span class="muted">0</span>'; } },
          { key: 'w', label: 'Quy đổi 3 mốc (A)', num: true, render: function (x) { return '<span class="pos">' + F.money(Math.round(x.w)) + '</span>'; } },
        ],
        rows: rows,
        rowAttrs: function (x) { return 'class="is-clickable" tabindex="0" data-href="' + TH.router.href('INV-03', x.inv.id) + '"'; },
        foot: { _label: '<b>Tổng</b>', m5: F.money(ms.m5), m10: F.money(ms.m10), m15: F.money(ms.m15), late: F.money(ms.late), c: '<b>' + F.money(coll) + '</b>', d: '<b class="neg">' + F.money(debt) + '</b>', w: '<b>' + F.money(Math.round(ms.weighted)) + '</b>' },
        empty: { title: 'Không có hóa đơn đã xác nhận', text: 'Kỳ/tòa đang chọn chưa có hóa đơn xác nhận.' },
      });

      var overdue = TH.db.invoices.filter(function (i) { return i.status === 'confirmed' && C.debt(i) > 0 && i.dueAt < TH.TODAY && TH.inScope(i.buildingId) && (scope === 'ALL' || i.buildingId === scope); });
      var overdueCard = TH.gate('F031.B', '<div class="card card-flush">' + TH.cardHd(I('alertCircle', 'ic-sm') + 'Quá hạn' + TH.up('F031.B'), overdue.length + ' hóa đơn · ' + F.money(C.sum(overdue, function (i) { return C.debt(i); })), '<button type="button" class="btn btn-sm" data-act="pay.csv">' + I('download', 'ic-sm') + 'Xuất CSV</button>') +
        TH.table({ compact: true, cols: [{ key: 'r', label: 'Phòng', render: function (i) { return i.roomId; } }, { key: 'p', label: 'Kỳ', render: function (i) { return F.period(i.period); } }, { key: 'd', label: 'Quá hạn', num: true, render: function (i) { return -C.daysTo(i.dueAt) + ' ngày'; } }, { key: 'n', label: 'Còn nợ', num: true, render: function (i) { return '<b class="neg">' + F.money(C.debt(i)) + '</b>'; } }], rows: overdue }) + '</div>', { label: 'Danh sách quá hạn và CSV', lines: 3 });

      var snapCard = TH.gate('F032.B', '<div class="card">' + TH.cardHd(I('stamp', 'ic-sm') + 'Snapshot tự động mỗi mốc' + TH.up('F032.B')) + '<div class="card-bd">' + TH.table({ compact: true, cols: [{ key: 'k', label: 'Mốc' }, { key: 'v', label: 'Lũy kế đã xác nhận', num: true }, { key: 'a', label: 'Chụp lúc' }], rows: [{ k: 'Ngày 05', v: F.money(ms.m5), a: '05/10 23:59' }, { k: 'Ngày 10', v: F.money(ms.m5 + ms.m10), a: '10/10 23:59' }, { k: 'Ngày 15', v: F.money(ms.m5 + ms.m10 + ms.m15), a: '15/10 23:59' }] }) + '</div></div>', { label: 'Tự snapshot mỗi mốc, lọc trưởng nhóm', lines: 3 });

      var edits = TH.db.receiptEdits.filter(function (e) { return e.period === p && TH.inScope(C.room(e.receiptRoom).buildingId); });
      var backdate = TH.gate('F032.C', '<div class="card">' + TH.cardHd(I('history', 'ic-sm') + 'Soát backdate & điều chỉnh' + TH.up('F032.C'), null, TH.gate('F031.C', '<button type="button" class="btn btn-sm" data-act="pay.adjust">' + I('edit', 'ic-sm') + 'Phiếu điều chỉnh' + TH.up('F031.C') + '</button>', { mode: 'btn', label: 'Phiếu điều chỉnh', size: 'btn-sm' })) + '<div class="card-bd">' + (edits.length ? '<ul class="timeline">' + edits.map(function (e) { return '<li><b>' + esc(e.receiptRoom) + '</b>: thực nhận ' + F.date(e.from) + ' → ' + F.date(e.to) + '<div class="when">' + esc(C.staffName(e.by)) + ' · ' + esc(e.reason) + '</div></li>'; }).join('') + '</ul>' : '<span class="small muted">Không có điều chỉnh ngày tiền trong kỳ.</span>') + '</div></div>', { label: 'Soát backdate/điều chỉnh sau khóa', lines: 3 });

      var debtors = {};
      TH.db.invoices.filter(function (i) { return i.status === 'confirmed' && C.debt(i) > 0 && TH.inScope(i.buildingId); }).forEach(function (i) { (debtors[i.customerId] = debtors[i.customerId] || []).push(i); });
      var multi = Object.keys(debtors).filter(function (k) { return debtors[k].length > 1; });
      var alloc = TH.gate('F031.D', '<div class="card">' + TH.cardHd(I('split', 'ic-sm') + 'Phân bổ 1 phiếu thu cho nhiều hóa đơn' + TH.up('F031.D')) + '<div class="card-bd">' + (multi.length ? multi.map(function (k) { return '<div class="small" style="margin-bottom:8px"><b>' + esc(C.customer(k).name) + '</b> nợ ' + debtors[k].length + ' hóa đơn: ' + debtors[k].map(function (i) { return i.id + ' (' + F.short(C.debt(i)) + ')'; }).join(', ') + '<br><span class="muted">Phiếu thu mới được phân bổ hóa đơn cũ trước (FIFO).</span></div>'; }).join('') : '<span class="small muted">Không có khách nợ nhiều hóa đơn.</span>') + '</div></div>', { label: 'Phân bổ 1 phiếu thu cho nhiều HĐơn cùng khách', lines: 3 });

      var formula = '<div class="card card-flush">' + TH.cardHd(I('calculator', 'ic-sm') + 'Hiệu suất theo tòa', 'HS% = [A − A × B + C] ÷ tổng giá niêm yết · tạm tính & thực tế', TH.openBadge('D-04')) +
        TH.perfTable(p, pbs) +
        '<div class="card-bd stack-sm">' +
        TH.gate('F033.B', '', { mode: 'mini', label: 'Tách tỷ lệ dịch vụ B = DV phải thu ÷ DT phải thu' }) +
        TH.gate('F033.C', '', { mode: 'mini', label: 'Cộng thu thêm C: tiền phòng phát sinh đã thu đủ + khách bỏ cọc' }) +
        TH.gate('F033.D', '<div class="small">' + TH.tierPill('D') + ' Công thức <b>HS-01 v0.4</b> (A/B/C/D theo note khách 20/10/2026) · nhánh cọc mới & đóng 3 tháng chờ chốt.</div>', { mode: 'mini', label: 'Version công thức & kiểm thử' }) +
        TH.perfFormulaNote() + '<div class="small muted">Thu sau ngày 15 vẫn giảm nợ nhưng không tính vào A. Chi tiết từng bước ở BLD-02 › Vận hành & kết quả.</div></div></div>';
      var leadSel = TH.gate('F032.B', TH.uiSelect(S, 'lead', [{ id: 'ALL', label: 'Mọi trưởng nhóm/QL' }].concat(TH.db.buildings.filter(function (b) { return TH.inScope(b.id); }).map(function (b) { return { id: b.managerId, label: C.staffName(b.managerId) }; })), lead, 'Lọc trưởng nhóm') + TH.up('F032.B'), { mode: 'btn', label: 'Lọc trưởng nhóm', size: 'btn-sm' });
      var lockBtn = TH.gate('F032.D', TH.permBtn('report.all', '<button type="button" class="btn" data-act="pay.lockMs">' + I('lock', 'ic-sm') + 'Chốt mốc' + TH.up('F032.D') + '</button>', '403'), { mode: 'btn', label: 'Chốt mốc & đối chiếu phiên bản' });
      return TH.pageHeader({ screen: S, status: TH.periodBadge(p), desc: 'Theo ngày thực nhận đã xác nhận. Nợ = hóa đơn đã xác nhận − phiếu thu đã xác nhận; báo thu chờ xác nhận chưa được trừ.',
          actions: lockBtn + TH.exportBtn('pay2.xlsx', 'Xuất báo cáo (.xlsx)') + '<a class="btn" href="' + TH.router.href('PAY-01') + '">' + I('handCoins', 'ic-sm') + 'Nguồn phiếu thu</a>' }) +
        '<div class="grid-5" style="margin-bottom:16px">' + TH.kpi({ label: 'Hóa đơn kỳ', icon: 'receipt', value: F.short(billed), foot: invs.length + ' hóa đơn đã xác nhận' }) + TH.kpi({ label: 'Thực thu', icon: 'checkCircle', value: F.short(coll), href: TH.router.href('PAY-01') }) +
        TH.kpi({ label: 'Chờ xác nhận', icon: 'clock', value: F.short(pend), foot: 'Chưa giảm nợ', href: TH.router.href('PAY-01') }) + TH.kpi({ label: 'Còn nợ', icon: 'wallet', value: F.short(debt), neg: debt > 0 }) +
        TH.kpi({ label: 'Hiệu suất (D ÷ niêm yết)', icon: 'target', value: perfN ? F.pct(perfD / perfN, 1) : '—', accent: true, foot: 'D = ' + F.short(perfD) + ' · ' + TH.openBadge('D-04', 'DRAFT') }) + '</div>' +
        '<div class="card" style="margin-bottom:16px"><div class="card-bd">' + '<div class="row-between" style="margin-bottom:10px"><b class="small">Thực thu theo mốc ngày nhận</b>' + leadSel + '</div>' +
        TH.chart.stack([{ label: '≤ ngày 5 (100%)', value: ms.m5, color: SEQ[0] }, { label: '≤ ngày 10 (90%)', value: ms.m10, color: SEQ[1] }, { label: '≤ ngày 15 (70%)', value: ms.m15, color: SEQ[2] }, { label: 'Sau 15 (0%)', value: ms.late, color: SEQ[3] }]) + '</div></div>' +
        '<div class="card card-flush" style="margin-bottom:16px">' + table + '</div>' +
        '<div style="margin-bottom:16px">' + formula + '</div>' +
        '<div class="grid-2" style="margin-bottom:16px">' + overdueCard + snapCard + '</div>' +
        '<div class="grid-2">' + backdate + alloc + '</div>';
    },
  };
  TH.act['pay.csv'] = function () {
    var rows = TH.db.invoices.filter(function (i) { return i.status === 'confirmed' && C.debt(i) > 0 && i.dueAt < TH.TODAY && TH.inScope(i.buildingId); });
    TH.exportCsv('qua_han_' + TH.TODAY, ['Số HĐơn', 'Phòng', 'Kỳ', 'Hạn', 'Còn nợ'], rows.map(function (i) { return [i.id, i.roomId, F.period(i.period), F.date(i.dueAt), C.debt(i)]; }));
    TH.toast('Đã xuất CSV', rows.length + ' hóa đơn quá hạn');
  };
  TH.act['pay2.xlsx'] = function () {
    var p = TH.store.state.period, invs = C.invoicesIn(p, TH.scope()).filter(function (i) { return i.status === 'confirmed'; });
    TH.exportXlsx('Cong_no_moc_5_10_15_ky_' + p, [{ name: 'Cong no', title: 'Công nợ & mốc 5/10/15 — ' + TH.scopeLabel(), note: 'DRAFT · mốc theo ngày thực nhận đã xác nhận (D-04)', columns: [{ label: 'Phòng' }, { label: 'Hóa đơn', width: 18 }, { label: 'Tổng', type: 'money' }, { label: '≤5', type: 'money' }, { label: '≤10', type: 'money' }, { label: '≤15', type: 'money' }, { label: 'Sau 15', type: 'money' }, { label: 'Còn nợ', type: 'money' }],
      rows: invs.map(function (i) { var o = { m5: 0, m10: 0, m15: 0, late: 0 }; C.receiptsOf(i.id).forEach(function (r) { var m = C.milestone(r, i); if (m && o[m.key] !== undefined) o[m.key] += r.amount; }); return [i.roomId, i.id, i.total, o.m5, o.m10, o.m15, o.late, C.debt(i)]; }) }, TH.perfSheet(p, TH.db.buildings.filter(function (b) { return TH.inScope(b.id) && (TH.scope() === 'ALL' || b.id === TH.scope()); }))]);
    TH.toast('Đã xuất báo cáo', '.xlsx · ' + invs.length + ' hóa đơn');
  };
  TH.act['pay.lockMs'] = function () { TH.log('Chốt mốc 5/10/15', 'Kỳ ' + F.period(TH.store.state.period), 'Lưu phiên bản đối chiếu', 'receipt'); TH.app.refresh(); TH.toast('Đã chốt mốc 5/10/15', 'Thay đổi sau chốt được đối chiếu với phiên bản này.'); };
  TH.act['pay.adjust'] = function () {
    TH.modal.open({ key: 'payadj', size: 'sm', render: function () {
      var form = 'payadj';
      return { title: 'Phiếu điều chỉnh công nợ' + TH.up('F031.C'), sub: 'Có lý do và cần duyệt',
        body: '<div class="stack">' + TH.field({ form: form, name: 'inv', label: 'Hóa đơn', type: 'select', options: TH.db.invoices.filter(function (i) { return i.status === 'confirmed' && C.debt(i) > 0 && TH.inScope(i.buildingId); }).map(function (i) { return i.id; }) }) + TH.field({ form: form, name: 'amt', label: 'Số tiền điều chỉnh', num: true, def: '' }) + TH.field({ form: form, name: 'reason', label: 'Lý do', type: 'textarea', def: '' }) + '</div>',
        foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="pay.adjustSave">Gửi duyệt</button>' };
    } });
  };
  TH.act['pay.adjustSave'] = function () { TH.log('Tạo phiếu điều chỉnh', TH.store.draft('payadj', 'inv', ''), TH.store.draft('payadj', 'reason', ''), 'receipt'); TH.store.clearDraft('payadj'); TH.modal.close('payadj', { silent: true }); TH.app.refresh(); TH.toast('Đã gửi duyệt phiếu điều chỉnh', 'Công nợ chỉ đổi sau khi phiếu được duyệt.', 'info'); };
})();
