/* Thu tiền: PAY-01 (ghi nhận / báo đã thu), PAY-APP (QL tòa xác nhận, kế toán hậu kiểm), PAY-02 (tiến độ thu theo mẫu Excel + công nợ & mốc 5/10/15). F029–F033 + CR-PAY. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;
  var SEQ = ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)'];

  function inv(r) { return C.invoice(r.invoiceId); }
  function msPreview(dateIso, invObj) { return C.milestone({ status: 'confirmed', receivedAt: dateIso }, invObj); }
  /* CR-PAY: QL tòa xác nhận thu tiền của tòa trong phạm vi; kế toán/Admin hậu kiểm (không chặn công nợ) */
  function canConfirm(r) { var i = inv(r); return TH.can('receipt.confirm') && !!i && TH.inScope(i.buildingId); }
  function auditBadge(r) {
    if (r.status !== 'confirmed') return '<span class="muted small">—</span>';
    if (!r.audit) return TH.badge('Chưa hậu kiểm', 'neutral');
    return r.audit.state === 'ok' ? TH.badge('Đã đối soát', 'success', { icon: 'check', tip: C.staffName(r.audit.by) + ' · ' + F.date(r.audit.at) + (r.audit.stmt ? ' · ' + r.audit.stmt : '') })
      : TH.badge('Sai lệch', 'danger', { icon: 'alert', tip: r.audit.note || '' });
  }
  function dupOf(r) {
    return TH.db.receipts.filter(function (x) { return x !== r && x.invoiceId === r.invoiceId && x.status !== 'rejected' && (x.amount === r.amount || x.evidence === r.evidence); });
  }

  /* ---------------- PAY-01 ---------------- */
  TH.views['PAY-01'] = {
    render: function () {
      var S = 'PAY-01', p = TH.store.state.period, st = TH.has('F029.B') ? TH.store.ui(S, 'st', 'pending') : 'all';
      var all = TH.db.receipts.filter(function (r) { var i = inv(r); return TH.inScope(i.buildingId) && (TH.has('F029.B') ? i.period === p : (i.period === p || r.status === 'pending')); })
        .sort(function (a, b) { return (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || (a.reportedAt < b.reportedAt ? 1 : -1); });
      var q = TH.store.ui(S, 'q', '');
      var rows = all.filter(function (r) { var i = inv(r); return (st === 'all' || (st === 'unaudited' ? r.status === 'confirmed' && !r.audit : r.status === st)) && TH.match(q, [r.id, i.roomId, i.id, C.staffName(r.reportedBy), r.method || '']); });
      var pg = TH.paginate(S, rows, 10);
      var sel = TH.store.ui(S, 'sel', []), canBatch = TH.has('F030.B') && TH.can('receipt.confirm');
      var table = TH.table({
        label: 'Báo đã thu',
        mobile: { identity: 'id', primary: 'a', visible: ['ck', 'id', 'inv', 'a', 's', 'x'] },
        cols: [
          { key: 'ck', label: '', labelHtml: '<span class="sr-only">Chọn</span>', gate: 'F030.B', cls: 'cell-check', tdCls: 'cell-check', render: function (r) { return r.status === 'pending' && canBatch && canConfirm(r) ? '<input type="checkbox" aria-label="Chọn ' + r.id + '" data-act="pay.sel" data-id="' + r.id + '"' + (sel.indexOf(r.id) > -1 ? ' checked' : '') + '>' : ''; } },
          { key: 'id', label: 'Phiếu', render: function (r) { return '<span class="mono">' + r.id + '</span><div class="cell-sub">' + esc(r.method) + '</div>'; } },
          { key: 'ql', label: 'Người ghi nhận', render: function (r) { return TH.personCell(C.staffName(r.reportedBy), esc(C.building(inv(r).buildingId).short)); } },
          { key: 'inv', label: 'Hóa đơn', render: function (r) { return '<a class="mono" href="' + TH.router.href('INV-03', r.invoiceId) + '">' + r.invoiceId + '</a><div class="cell-sub">Phòng ' + esc(inv(r).roomId) + ' · còn nợ ' + F.short(C.debt(inv(r))) + '</div>'; } },
          { kind: 'money', key: 'a', label: 'Số báo thu', num: true, render: function (r) { return '<b>' + F.money(r.amount) + '</b>'; } },
          { kind: 'date', key: 'd', label: 'Ngày báo · thực nhận', render: function (r) { return F.date(r.reportedAt) + '<div class="cell-sub">Nhận ' + F.date(r.receivedAt) + '</div>'; } },
          { key: 'ev', label: 'Chứng từ', render: function (r) { return '<span class="small">' + I('paperclip', 'ic-sm') + ' ' + esc(r.evidence) + '</span>'; } },
          { kind: 'status', key: 's', label: 'Trạng thái', render: function (r) { return TH.statusOf('receipt', r.status) + (r.status === 'rejected' ? '<div class="cell-sub neg">' + esc(r.rejectReason) + '</div>' : r.confirmedBy ? '<div class="cell-sub">' + esc(C.staffName(r.confirmedBy)) + '</div>' : ''); } },
          { key: 'dup', label: 'Chống trùng', gate: 'F029.C', render: function (r) { var d = dupOf(r); return d.length ? TH.badge('Nghi trùng ' + d.length, 'danger', { icon: 'alert', tip: 'Trùng hóa đơn và số tiền/chứng từ với ' + d.map(function (x) { return x.id; }).join(', ') }) : '<span class="muted small">—</span>'; } },
          { key: 'log', label: 'Trao đổi', gate: 'F029.D', render: function (r) { return '<span class="small">' + (r.status === 'rejected' ? '2 tin' : r.status === 'pending' ? '1 tin' : '—') + '</span>'; } },
          { key: 'au', label: 'Hậu kiểm', render: auditBadge },
          { key: 'x', label: '', render: function (r) {
            if (r.status === 'confirmed') return TH.can('receipt.audit') ? '<a class="btn btn-xs" href="' + TH.router.href('PAY-APP', r.id) + '">' + (r.audit ? 'Xem' : 'Hậu kiểm') + '</a>' : '';
            if (r.status !== 'pending') return '';
            if (!TH.can('receipt.confirm')) return '<span class="forbidden-chip" data-tip="CR-PAY: QL tòa xác nhận thu; văn phòng xem tiến độ và hậu kiểm">' + I('ban', 'ic-sm') + 'QL tòa xác nhận</span>';
            if (!canConfirm(r)) return '<span class="forbidden-chip">Ngoài tòa phụ trách</span>';
            return '<a class="btn btn-xs btn-primary" href="' + TH.router.href('PAY-APP', r.id) + '">Xác nhận</a>';
          } },
        ],
        rows: pg.rows,
        empty: { title: 'Không có báo thu', text: 'Chưa có báo thu ở trạng thái đang lọc.' },
      });
      var batchBar = canBatch && sel.length ? '<div class="toolbar u-tint-teal">' + TH.tierPill('B') + '<b class="small">' + sel.length + ' báo thu đã chọn · ' + F.money(C.sum(sel.map(function (id) { return TH.db.receipts.find(function (x) { return x.id === id; }); }), function (r) { return r.amount; })) + '</b><span class="grow"></span><button type="button" class="btn btn-sm btn-primary" data-act="pay.batch">' + I('check', 'ic-sm') + 'Xác nhận theo danh sách đã kiểm</button><button type="button" class="btn btn-sm btn-ghost" data-act="pay.selClear">Bỏ chọn</button></div>' : '';
      var progress = TH.gate('F029.B', '<div class="card u-mb-16">' + TH.cardHd(I('activity', 'ic-sm') + 'Tiến độ thu kỳ ' + F.period(p) + TH.up('F029.B')) + '<div class="card-bd"><div class="grid-3">' + TH.db.buildings.filter(function (b) { return TH.inScope(b.id); }).map(function (b) {
        var s = C.summary(p, b.id), pct = s.billed ? s.collectedForPeriod / s.billed : 0;
        return '<div><div class="row-between small"><b>' + esc(b.short) + '</b><span class="tnum">' + F.pct(pct, 0) + '</span></div><div class="progress" style="margin:6px 0"><span style="width:' + pct * 100 + '%"></span></div><div class="small muted tnum">' + F.short(s.collectedForPeriod) + ' / ' + F.short(s.billed) + (s.pending ? ' · ' + F.short(s.pending) + ' chờ xác nhận' : '') + '</div></div>';
      }).join('') + '</div></div></div>', { label: 'Theo dõi tiến độ thu theo kỳ', lines: 2 });
      var filters = TH.has('F029.B') ? TH.chips(S, 'st', [{ id: 'pending', label: 'Chờ xác nhận', count: all.filter(function (r) { return r.status === 'pending'; }).length }, { id: 'confirmed', label: 'Đã xác nhận', count: all.filter(function (r) { return r.status === 'confirmed'; }).length }, { id: 'unaudited', label: 'Chưa hậu kiểm', count: all.filter(function (r) { return r.status === 'confirmed' && !r.audit; }).length }, { id: 'rejected', label: 'Từ chối', count: all.filter(function (r) { return r.status === 'rejected'; }).length }, { id: 'all', label: 'Tất cả', count: all.length }], st) + TH.up('F029.B')
        : '<span class="small muted">Danh sách báo thu kỳ ' + F.period(p) + ' (chờ xác nhận lên đầu)</span><span class="grow"></span>' + TH.gate('F029.B', '', { mode: 'btn', label: 'Lọc theo kỳ & trạng thái', size: 'btn-sm' });
      return TH.pageHeader({ screen: S, desc: 'Phiếu thu có hiệu lực sau khi quản lý tòa xác nhận. Văn phòng đối soát chứng từ và sao kê.',
        actions: [{ label: 'Tiến độ thu', icon: 'activity', href: TH.router.href('PAY-02') }, { label: TH.can('receipt.confirm') ? 'Ghi nhận thu' : 'Báo đã thu', icon: 'handCoins', act: 'pay.report', primary: true, permission: 'receipt.report' }] }) +
        TH.summaryBlock('Tiến độ thu theo tòa', '', progress) + '<div class="card card-flush"><div class="toolbar">' + TH.searchBox(S, 'Tìm phiếu thu, phòng, hóa đơn, người báo…') + '<div class="filter-options" role="group" aria-label="Trạng thái phiếu thu">' + filters + '</div></div>' + batchBar + table + TH.pager(S, pg) + '</div>';
    },
    dialogs: [function () { return reportForm(); }],
  };
  function reportForm() {
    var form = 'pay-rep';
    var open = TH.db.invoices.filter(function (i) { return i.status === 'confirmed' && C.debt(i) > 0 && TH.inScope(i.buildingId); });
    var invId = TH.store.draft(form, 'inv', open[0] && open[0].id), invObj = C.invoice(invId);
    var amount = +String(TH.store.draft(form, 'amount', invObj ? C.debt(invObj) : '')).replace(/\D/g, '');
    var date = TH.store.draft(form, 'date', TH.TODAY);
    var dup = invObj ? TH.db.receipts.filter(function (x) { return x.invoiceId === invObj.id && x.status === 'pending'; }) : [];
    var over = invObj && amount > C.debt(invObj), direct = invObj && TH.can('receipt.confirm') && TH.inScope(invObj.buildingId);
    var ms = invObj && date ? msPreview(date, invObj) : null;
    return {
      title: direct ? 'Ghi nhận thu tiền' : 'Báo đã thu', sub: direct ? 'PAY-01 · QL tòa xác nhận: phiếu thu có hiệu lực ngay, giảm công nợ và tính mốc theo ngày thực nhận' : 'PAY-01 · Báo thu chờ QL tòa xác nhận — chưa giảm công nợ',
      body: '<div class="stack"><div class="form-grid">' +
        TH.field({ form: form, name: 'inv', label: 'Hóa đơn còn nợ', type: 'select', options: open.map(function (i) { return { id: i.id, label: i.id + ' · ' + i.roomId + ' · nợ ' + F.money(C.debt(i)) }; }), def: open[0] && open[0].id, span: true }) +
        TH.field({ form: form, name: 'amount', label: 'Số tiền báo thu', num: true, inputmode: 'numeric', def: invObj ? String(C.debt(invObj)) : '', live: true, hint: over ? '<span class="warn-text">Vượt số còn nợ ' + F.money(amount - C.debt(invObj)) + ' — phân bổ cho hóa đơn còn nợ khác của phòng (kỳ cũ trước), phần dư ghi <b>Thừa</b>, trừ vào kỳ sau</span>' : '' }) +
        TH.field({ form: form, name: 'date', label: 'Ngày khách trả (thực nhận)', type: 'date', def: TH.TODAY, live: true, hint: ms ? 'Dự kiến tính ' + ms.label + ' · ' + F.pct(ms.weight, 0) + ' (sau khi xác nhận)' : '' }) +
        TH.field({ form: form, name: 'method', label: 'Hình thức', type: 'select', options: ['Chuyển khoản', 'Tiền mặt'], def: 'Chuyển khoản' }) +
        '<div class="field"><span class="field-label">Chứng từ</span><div class="row">' + TH.fileOf('ck_bao_thu_' + (invObj ? invObj.roomId : '') + '.png') + '</div></div></div>' +
        (dup.length ? TH.gate('F029.C', '<div class="alert alert-danger">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Có báo thu đang chờ cho hóa đơn này ' + TH.up('F029.C') + '</b><span>' + dup.map(function (d) { return d.id + ' · ' + F.money(d.amount) + ' · ' + F.date(d.reportedAt); }).join('<br>') + '</span><span>Kiểm tra trùng yêu cầu/nguồn tiền trước khi gửi.</span></div></div>', { label: 'Chống trùng yêu cầu/nguồn tiền', lines: 1 }) : '') +
        TH.field({ form: form, name: 'note', label: 'Ghi chú', def: '' }) + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="pay.reportSave"' + (invObj && amount ? '' : ' disabled') + '>' + I(direct ? 'check' : 'send', 'ic-sm') + (direct ? 'Xác nhận đã thu' : 'Gửi báo thu') + '</button>',
    };
  }
  TH.act['pay.report'] = function () { TH.modal.open({ key: 'pay-rep', size: 'md', render: reportForm }); };
  TH.act['pay.reportFor'] = function (el) {
    TH.store.clearDraft('pay-rep');
    TH.store.setDraft('pay-rep', 'inv', el.dataset.id); TH.store.setDraft('pay-rep', 'amount', String(C.debt(C.invoice(el.dataset.id))));
    if (el.tagName !== 'A') { TH.modal.open({ key: 'pay-rep', size: 'md', render: reportForm }); return; }
    TH.go('PAY-01');
    setTimeout(function () { TH.modal.open({ key: 'pay-rep', size: 'md', render: reportForm }); }, 30);
  };
  TH.act['pay.reportSave'] = function () {
    var g = function (k, d) { return TH.store.draft('pay-rep', k, d); };
    var invObj = C.invoice(g('inv'));
    if (!invObj || invObj.status !== 'confirmed' || !TH.inScope(invObj.buildingId) || !TH.can('receipt.report')) return;
    var amount = +String(g('amount', C.debt(invObj))).replace(/\D/g, '');
    if (!amount || !isFinite(amount)) { TH.toast('Chưa ghi nhận', 'Nhập số tiền lớn hơn 0.', 'warning'); return; }
    var requestId = g('_requestId');
    if (!requestId) { requestId = 'TH-RECV-' + Date.now() + '-' + Math.random().toString(36).slice(2); TH.store.setDraft('pay-rep', '_requestId', requestId); }
    if (TH.db.receipts.some(function (r) { return r.clientRequest === requestId; })) return;
    var direct = TH.can('receipt.confirm') && TH.inScope(invObj.buildingId);
    /* Vượt nợ hóa đơn đang chọn → phân bổ FIFO sang hóa đơn còn nợ khác của phòng (kỳ cũ trước); phần còn lại ghi vào hóa đơn mới nhất = Thừa */
    var others = TH.db.invoices.filter(function (i) { return i !== invObj && i.roomId === invObj.roomId && i.status === 'confirmed' && C.debt(i) > 0; }).sort(function (a, b) { return a.period < b.period ? -1 : 1; });
    if (!TH.has('F031.D')) others = [];
    var targets = [invObj].concat(others), left = amount, parts = [];
    targets.forEach(function (t, n) { if (left <= 0) return; var a = n === targets.length - 1 ? left : Math.min(left, C.debt(t)); if (a > 0) { parts.push({ inv: t, amount: a }); left -= a; } });
    if (left > 0) parts[parts.length - 1].amount += left;
    var ids = parts.map(function (pt) {
      var id = TH.recordActions.id('PT');
      var r = { id: id, invoiceId: pt.inv.id, amount: pt.amount, reportedBy: TH.me().id, reportedAt: TH.TODAY, receivedAt: g('date', TH.TODAY), method: g('method', 'Chuyển khoản'), evidence: 'ck_bao_thu_' + invObj.roomId + '.png', status: 'pending', confirmedBy: null, confirmedAt: null, note: (g('note', '') + (parts.length > 1 ? ' · phân bổ FIFO 1 lần thu ' + F.money(amount) : '')).trim().replace(/^· /, '') };
      r.clientRequest = requestId;
      TH.db.receipts.push(r);
      if (direct) confirmReceipt(r); else TH.log('Báo đã thu', id, pt.inv.id + ' · ' + F.money(pt.amount), 'receipt', pt.inv.buildingId);
      return id;
    });
    var id = ids.join(', ');
    TH.store.clearDraft('pay-rep'); TH.modal.close('pay-rep', { silent: true }); TH.app.refresh();
    var bal = C.balance(parts[parts.length - 1].inv);
    if (direct) TH.toast('Đã xác nhận thu ' + id, F.money(amount) + (parts.length > 1 ? ' · phân bổ ' + parts.length + ' hóa đơn (kỳ cũ trước)' : '') + (bal > 0 ? ' · Thừa ' + F.money(bal) + ' (trừ vào kỳ sau)' : '') + ' · công nợ, mốc 5/10/15 và tiến độ thu đã cập nhật.');
    else TH.toast('Đã gửi báo thu ' + id, 'Chờ QL tòa xác nhận — công nợ chưa giảm.', 'info');
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
    if (!r || r.status !== 'pending' || !canConfirm(r)) return false;
    var invObj = inv(r), amt = r.amount; // CR-PAY: không cắt phần vượt nợ — phần thừa hiện "Thừa" và trừ vào nợ cũ kỳ sau
    if (receivedAt && receivedAt !== r.receivedAt) {
      TH.db.receiptEdits.push({ receiptRoom: invObj.roomId, period: invObj.period, from: r.receivedAt, to: receivedAt, by: TH.me().id, at: TH.TODAY + ' 10:00', reason: 'Điều chỉnh khi xác nhận theo chứng từ' });
      r.receivedAt = receivedAt;
    }
    r.amount = amt; r.status = 'confirmed'; r.confirmedBy = TH.me().id; r.confirmedAt = TH.TODAY;
    var ms = C.milestone(r, invObj);
    TH.log('Xác nhận phiếu thu', r.id, invObj.roomId + ' · ' + F.money(amt) + ' · thực nhận ' + F.date(r.receivedAt) + ' (' + (ms ? ms.label : '') + ')', 'receipt', invObj.buildingId);
    return true;
  }

  /* ---------------- PAY-APP ---------------- */
  TH.views['PAY-APP'] = {
    modal: { size: 'lg' },
    scanParam: 'PT-2610-087',
    render: function (rt) {
      var r = TH.db.receipts.find(function (x) { return x.id === rt.param; }) || TH.db.receipts.find(function (x) { return x.status === 'pending'; });
      if (!r) return { title: 'Xác nhận phiếu thu', body: TH.state('empty', { title: 'Không có báo thu chờ xác nhận' }), foot: '<button class="btn" data-close>Đóng</button>' };
      var invObj = inv(r), form = 'app-' + r.id;
      var recv = TH.store.draft(form, 'recv', r.receivedAt), ms = msPreview(recv, invObj);
      var canApprove = canConfirm(r), pending = r.status === 'pending', canAudit = TH.can('receipt.audit') && r.status === 'confirmed';
      var dups = dupOf(r);
      var others = TH.db.receipts.filter(function (x) { return x.status === 'pending' && x !== r && TH.inScope(inv(x).buildingId); });
      var left = '<div class="stack">' +
        '<div class="grid-2">' + TH.kpi({ label: 'Số tiền báo thu', value: F.money(r.amount) }) + TH.kpi({ label: 'Hóa đơn còn nợ', value: F.money(C.debt(invObj)), foot: 'Tổng ' + F.money(invObj.total) + ' · đã thu ' + F.money(C.paid(invObj.id)) }) + '</div>' +
        TH.kv([['Hóa đơn', '<a href="' + TH.router.href('INV-03', invObj.id) + '" data-close>' + invObj.id + '</a> · phòng ' + invObj.roomId], ['Khách', esc(C.customer(invObj.customerId).name)], ['Người báo', esc(C.staffName(r.reportedBy)) + ' · ' + F.date(r.reportedAt)], ['Hình thức', esc(r.method)], ['Ghi chú', esc(r.note || '—')]]) +
        '<div class="card u-tint"><div class="card-bd row u-gap-12">' + TH.fileOf(r.evidence) + TH.simBadge('Ảnh chứng từ minh họa') + '</div></div>' +
        (pending ? TH.field({ form: form, name: 'recv', label: 'Ngày thực nhận (ghi nhận)', type: 'date', def: r.receivedAt, live: true, hint: 'Mốc tính theo ngày thực nhận đã xác nhận: <b>' + (ms ? ms.label + ' · ' + F.pct(ms.weight, 0) : '—') + '</b> ' + TH.openBadge('D-04') }) : '') +
        (pending && recv !== r.receivedAt ? TH.gate('F032.C', '<div class="alert alert-warning">' + I('history', 'ic-sm') + '<div class="alert-body"><b>Điều chỉnh ngày tiền ' + TH.up('F032.C') + '</b><span>Đổi từ ' + F.date(r.receivedAt) + ' → ' + F.date(recv) + '. Thay đổi được ghi log và hiển thị ở báo cáo giải trình (RPT-02).</span></div></div>', { label: 'Soát backdate/điều chỉnh ngày tiền', lines: 1 }) : '') +
        TH.gate('F030.C', '<div class="alert ' + (dups.length ? 'alert-danger' : 'alert-success') + '">' + I(dups.length ? 'alert' : 'checkCircle', 'ic-sm') + '<div class="alert-body"><b>Kiểm tra trùng số tiền/phiếu & tranh chấp ' + TH.up('F030.C') + '</b><span>' + (dups.length ? 'Trùng với ' + dups.map(function (d) { return d.id + ' (' + TH.statusLabel(d.status) + ')'; }).join(', ') : 'Không phát hiện phiếu thu trùng.') + '</span></div></div>', { label: 'Kiểm tra số tiền/phiếu thu trùng và tranh chấp', lines: 1 }) +
        TH.gate('F030.D', '<div class="card"><div class="card-hd"><div class="card-title">' + I('compare', 'ic-sm') + 'Đối soát sao kê (nhập thủ công)' + TH.up('F030.D') + '</div><span class="small muted">Không kết nối bank API</span></div><div class="card-bd">' + TH.field({ form: form, name: 'stmt', label: 'Mã giao dịch trên sao kê', def: '', placeholder: 'VD: FT26290xxxx' }) + '<div class="small muted u-mt-8">' + (TH.store.draft(form, 'stmt', '') ? TH.badge('Đã khớp sao kê', 'success') : 'Chưa nhập mã giao dịch') + '</div></div></div>', { label: 'Đối soát với sao kê nhập thủ công', lines: 2 }) +
        (canAudit ? '<div class="card"><div class="card-hd"><div class="card-title">' + I('shieldCheck', 'ic-sm') + 'Hậu kiểm (văn phòng)</div>' + auditBadge(r) + '</div><div class="card-bd stack-sm">' +
          (r.audit ? '<div class="small">' + esc(C.staffName(r.audit.by)) + ' · ' + F.date(r.audit.at) + (r.audit.stmt ? ' · mã sao kê <span class="mono">' + esc(r.audit.stmt) + '</span>' : '') + (r.audit.note ? '<br>' + esc(r.audit.note) : '') + '</div>' : '') +
          TH.field({ form: form, name: 'astmt', label: 'Mã giao dịch trên sao kê', def: r.audit && r.audit.stmt || '', placeholder: 'VD: FT26290xxxx' }) + TH.field({ form: form, name: 'anote', label: 'Ghi chú (bắt buộc khi sai lệch)', def: '' }) +
          '<div class="small muted">Hậu kiểm không đổi công nợ; phiếu sai lệch chuyển lại QL tòa sửa/hủy.</div></div></div>' : '') +
        (pending ? TH.field({ form: form, name: 'reason', label: 'Lý do (bắt buộc khi từ chối)', def: '' }) : '<div class="alert alert-neutral">' + I('info', 'ic-sm') + '<div class="alert-body">Phiếu đã ' + TH.statusLabel(r.status).toLowerCase() + (r.confirmedBy ? ' bởi ' + esc(C.staffName(r.confirmedBy)) + ' ngày ' + F.date(r.confirmedAt) : '') + '.</div></div>') + '</div>';
      var hist = TH.gate('F030.C', '', { mode: 'mini', label: '' });
      var side = '<div class="stack">' +
        TH.gate('F029.B', '<div class="card"><div class="card-hd"><div class="card-title small">Báo thu chờ khác ' + TH.up('F029.B') + '</div></div><div class="card-bd" style="padding:8px">' + (others.length ? others.slice(0, 6).map(function (x) { return '<a class="menu-item" href="' + TH.router.href('PAY-APP', x.id) + '"><span class="mono small">' + x.id + '</span><span class="muted u-ml-auto">' + F.short(x.amount) + '</span></a>'; }).join('') : '<span class="small muted">Không còn.</span>') + '</div></div>', { label: 'Lọc nhanh theo kỳ/tòa', lines: 2 }) +
        TH.gate('F032.D', '<div class="card"><div class="card-hd"><div class="card-title small">Đối soát & khóa kỳ ' + TH.up('F032.D') + '</div></div><div class="card-bd small">' + (TH.periodLocked(invObj.period) ? TH.badge('Kỳ đã khóa — cần biên bản', 'neutral', { icon: 'lock' }) : 'Kỳ ' + F.period(invObj.period) + ' đang mở. Sau khi chốt mốc, thay đổi được đối chiếu phiên bản.') + '</div></div>', { label: 'Chốt mốc và đối chiếu phiên bản', lines: 2 }) +
        TH.gate('F029.D', '<div class="card"><div class="card-hd"><div class="card-title small">Nhật ký trao đổi ' + TH.up('F029.D') + '</div></div><div class="card-bd"><ul class="timeline"><li>' + esc(C.staffName(r.reportedBy)) + ': ' + esc(r.note || 'Đã gửi báo thu kèm chứng từ.') + '<div class="when">' + F.date(r.reportedAt) + '</div></li>' + (r.rejectReason ? '<li>' + esc(C.staffName(r.confirmedBy)) + ': ' + esc(r.rejectReason) + '<div class="when">' + F.date(r.confirmedAt) + '</div></li>' : '') + '</ul></div></div>', { label: 'Nhật ký giao tiếp duyệt', lines: 2 }) + hist + '</div>';
      var foot = '<button type="button" class="btn" data-close>Đóng</button><span class="spacer"></span>';
      if (pending) {
        if (!canApprove) foot += '<span class="forbidden-chip" data-tip="CR-PAY: QL tòa của tòa này xác nhận thu; văn phòng hậu kiểm">' + I('ban', 'ic-sm') + 'QL tòa xác nhận thu</span>';
        else foot += '<button type="button" class="btn btn-danger" data-act="app.reject" data-id="' + r.id + '">' + I('xCircle', 'ic-sm') + 'Từ chối</button><button type="button" class="btn btn-primary" data-act="app.ok" data-id="' + r.id + '">' + I('check', 'ic-sm') + 'Xác nhận thực thu</button>';
      } else if (canAudit) foot += '<button type="button" class="btn btn-danger" data-act="app.audit" data-v="bad" data-id="' + r.id + '">' + I('alert', 'ic-sm') + 'Sai lệch — trả QL</button><button type="button" class="btn btn-primary" data-act="app.audit" data-v="ok" data-id="' + r.id + '">' + I('check', 'ic-sm') + 'Đã đối soát</button>';
      return { title: 'Xác nhận phiếu thu <span class="screen-id">PAY-APP</span>', sub: esc(r.id) + ' · ' + TH.statusLabel(r.status) + ' · chỉ phiếu đã xác nhận mới giảm công nợ',
        body: '<div class="grid-main-side" style="grid-template-columns:minmax(0,1fr) 260px">' + left + side + '</div>', foot: foot };
    },
  };
  TH.act['app.ok'] = function (el) {
    var r = TH.db.receipts.find(function (x) { return x.id === el.dataset.id; }), form = 'app-' + r.id;
    if (!confirmReceipt(r, TH.store.draft(form, 'recv', r.receivedAt))) return;
    TH.store.clearDraft(form);
    TH.modal.close(TH.modal.top().key);
    TH.app.refresh();
    TH.toast('Đã xác nhận thực thu ' + r.id, F.money(r.amount) + ' · công nợ, mốc 5/10/15, lương nháp và báo cáo đã cập nhật.');
  };
  TH.act['app.audit'] = function (el) {
    var r = TH.db.receipts.find(function (x) { return x.id === el.dataset.id; }), form = 'app-' + r.id, ok = el.dataset.v === 'ok';
    var note = (TH.store.draft(form, 'anote', '') || '').trim(), stmt = (TH.store.draft(form, 'astmt', r.audit && r.audit.stmt || '') || '').trim();
    if (!TH.formErrors(form, !ok && !note ? { anote: 'Ghi rõ chênh lệch để quản lý tòa xử lý.' } : {})) { TH.modal.rerenderAll(); var f = document.getElementById('f-' + form + '-anote'); if (f) f.focus(); return; }
    r.audit = { state: ok ? 'ok' : 'mismatch', by: TH.me().id, at: TH.TODAY, stmt: stmt, note: note };
    TH.log(ok ? 'Hậu kiểm phiếu thu — khớp' : 'Hậu kiểm phiếu thu — sai lệch', r.id, (stmt ? stmt + ' · ' : '') + note, 'receipt', inv(r).buildingId);
    var top = TH.modal.top(); TH.store.clearDraft(form); if (top) TH.modal.close(top.key); TH.app.refresh();
    TH.toast(ok ? 'Đã đối soát ' + r.id : 'Đã trả QL tòa ' + r.id, ok ? 'Khớp sao kê.' : esc(note), ok ? 'success' : 'warning');
  };
  TH.act['app.reject'] = function (el) {
    var r = TH.db.receipts.find(function (x) { return x.id === el.dataset.id; }), form = 'app-' + r.id;
    var reason = (TH.store.draft(form, 'reason', '') || '').trim();
    if (!TH.formErrors(form, reason ? {} : { reason: 'Nhập lý do để người báo thu xử lý lại.' })) { TH.modal.rerenderAll(); var f = document.getElementById('f-' + form + '-reason'); if (f) f.focus(); return; }
    r.status = 'rejected'; r.rejectReason = reason; r.confirmedBy = TH.me().id; r.confirmedAt = TH.TODAY;
    TH.log('Từ chối báo thu', r.id, reason, 'receipt', inv(r).buildingId);
    TH.store.clearDraft(form); TH.modal.close(TH.modal.top().key); TH.app.refresh();
    TH.toast('Đã từ chối báo thu', esc(reason), 'warning');
  };

  /* ---------------- PAY-02 ---------------- */
  /* CR-PAY: Tiến độ thu theo workbook "Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026": sheet cập nhật thu tiền (theo QL, theo tòa),
     BÁO CÁO CHECK THU TIỀN (theo phòng), DS phòng phá hđ, ĐIỆN NƯỚC PHÒNG TRỐNG/KHÔNG THU ĐƯỢC; tab cuối giữ bảng mốc theo hóa đơn + hiệu suất. */
  var P2 = 'PAY-02';
  var P2_TABS = [
    { id: 'mgr', label: 'Theo quản lý', icon: 'users' },
    { id: 'bld', label: 'Theo tòa', icon: 'building' },
    { id: 'room', label: 'Theo phòng', icon: 'door' },
    { id: 'new', label: 'Vào ở & giữ chỗ', icon: 'sparkles' },
    { id: 'break', label: 'Chấm dứt trước hạn', icon: 'alertCircle' },
    { id: 'loss', label: 'Điện nước không thu được', icon: 'zap' },
    { id: 'inv', label: 'Hiệu suất thu tiền', icon: 'receipt' },
  ];
  var pctOf = function (x) { return x === null || x === undefined ? '<span class="muted">—</span>' : F.pct(x, 1); };
  var moneyOr = function (n, cls) { return n ? '<span class="' + (cls || '') + '">' + F.money(n) + '</span>' : '<span class="muted">0</span>'; };
  var signed = function (n) { return n < 0 ? '<b class="neg">' + F.money(n).replace('-', '−') + '</b>' : n > 0 ? '<b class="pos">+' + F.money(n) + '</b>' : '<span class="muted">0</span>'; };
  function billBadge(st) { var m = TH.BILL_STATES[st] || [st, 'neutral']; return TH.badge(m[0], m[1], { dot: true }); }
  function p2Buildings() {
    var scope = TH.scope(), lead = TH.has('F032.B') ? TH.store.ui(P2, 'lead', 'ALL') : 'ALL';
    return TH.db.buildings.filter(function (b) { return TH.inScope(b.id) && (scope === 'ALL' || b.id === scope) && (lead === 'ALL' || b.managerId === lead); });
  }
  function p2Bills(p, bs) { var out = []; bs.forEach(function (b) { out = out.concat(C.roomBills(p, b.id)); }); return out; }
  /* Hóa đơn cũ nhất còn nợ của phòng — ghi nhận thu trả nợ cũ trước (FIFO) */
  function oldestDebtInv(roomId) { return TH.db.invoices.filter(function (i) { return i.roomId === roomId && i.status === 'confirmed' && C.debt(i) > 0; }).sort(function (a, b) { return a.period < b.period ? -1 : 1; })[0]; }
  function bldTable(p, rows, tot) {
    return TH.table({
      label: 'Cập nhật thu tiền theo tòa nhà',
      cols: [
        { key: 'b', label: 'Mã tòa', render: function (r) { return '<b>' + esc(C.building(r.buildingId).short) + '</b><div class="cell-sub">' + r.rooms + ' phòng' + (r.broken ? ' · ' + r.broken + ' phá HĐ' : '') + '</div>'; } },
        { key: 'm', label: 'Quản lý', render: function (r) { return esc(C.staffName(r.managerId)); } },
        { kind: 'money', key: 'due', label: 'DT phải thu', num: true, render: function (r) { return F.money(r.due); } },
        { kind: 'money', key: 'paid', label: 'DT thu được', num: true, render: function (r) { return '<b>' + F.money(r.paid) + '</b>' + (r.pending ? '<div class="cell-sub warn-text">+' + F.short(r.pending) + ' chờ xác nhận</div>' : ''); } },
        { key: 'dep', label: 'Trong đó cọc mới', num: true, render: function (r) { return moneyOr(r.deposit); } },
        { key: 'bd', label: 'DT phá hợp đồng', num: true, render: function (r) { return moneyOr(r.brokenDue, 'neg'); } },
        { key: 'bp', label: 'Phá hợp đồng thu được', num: true, render: function (r) { return moneyOr(r.brokenPaid); } },
        { key: 'rate', label: 'Tỉ lệ thu', num: true, render: function (r) { return pctOf(r.rate); } },
        { key: 'bs', label: 'Tỉ lệ phá hợp đồng', num: true, render: function (r) { return pctOf(r.brokenShare); } },
        { kind: 'money', key: 'c5', label: 'Lũy kế M5', num: true, render: function (r) { return F.money(r.cum5); } },
        { kind: 'money', key: 'c10', label: 'Lũy kế M10', num: true, render: function (r) { return F.money(r.cum10); } },
        { kind: 'money', key: 'c15', label: 'Lũy kế M15', num: true, render: function (r) { return F.money(r.cum15); } },
        { kind: 'money', key: 'm1', label: 'DT mốc 1 · 100%', num: true, render: function (r) { return F.money(r.m1); } },
        { kind: 'money', key: 'm2', label: 'DT mốc 2 · 90%', num: true, render: function (r) { return F.money(Math.round(r.m2)); } },
        { kind: 'money', key: 'm3', label: 'DT mốc 3 · 70%', num: true, render: function (r) { return F.money(Math.round(r.m3)); } },
        { kind: 'money', key: 'mt', label: 'Tổng 3 mốc', num: true, render: function (r) { return '<b class="pos">' + F.money(Math.round(r.msTotal)) + '</b>'; } },
      ],
      rows: rows,
      rowAttrs: function (r) { return 'class="is-clickable" tabindex="0" data-act="pay2.rooms" data-b="' + r.buildingId + '" data-tip="Xem check thu tiền từng phòng"'; },
      foot: { _label: '<b>Tổng</b>', due: '<b>' + F.money(tot.due) + '</b>', paid: '<b>' + F.money(tot.paid) + '</b>', dep: F.money(tot.deposit), bd: F.money(tot.brokenDue), bp: F.money(tot.brokenPaid), rate: pctOf(tot.rate), bs: pctOf(tot.brokenShare), c5: F.money(tot.cum5), c10: F.money(tot.cum10), c15: F.money(tot.cum15), m1: F.money(tot.m1), m2: F.money(Math.round(tot.m2)), m3: F.money(Math.round(tot.m3)), mt: '<b>' + F.money(Math.round(tot.msTotal)) + '</b>' },
      empty: { title: 'Không có tòa trong phạm vi' },
    });
  }
  function mgrTable(p, rows, tot) {
    return TH.table({
      label: 'Cập nhật thu tiền theo quản lý',
      cols: [
        { key: 'm', label: 'Quản lý', render: function (r) { return TH.personCell(C.staffName(r.managerId), r.buildings.map(function (id) { return C.building(id).short; }).join(', ')); } },
        { kind: 'money', key: 'due', label: 'Tổng DT phải thu', num: true, render: function (r) { return F.money(r.due); } },
        { kind: 'money', key: 'paid', label: 'Thực thu', num: true, render: function (r) { return '<b>' + F.money(r.paid) + '</b>'; } },
        { kind: 'money', key: 'after', label: 'Phải thu sau phá hợp đồng', num: true, render: function (r) { return r.afterBreak > 0 ? '<b class="neg">' + F.money(r.afterBreak) + '</b>' : '<span class="muted">' + F.money(r.afterBreak) + '</span>'; } },
        { key: 'rate', label: 'Tỉ lệ', num: true, render: function (r) { return pctOf(r.rate); } },
        { key: 'bd', label: 'DT phá hợp đồng', num: true, render: function (r) { return moneyOr(r.brokenDue, 'neg'); } },
        { key: 'bp', label: 'DT phá hợp đồng thu được', num: true, render: function (r) { return moneyOr(r.brokenPaid); } },
        { key: 'br', label: 'Tỉ lệ thu được', num: true, render: function (r) { return pctOf(r.brokenRate); } },
        { key: 'bs', label: 'Phá hợp đồng / phải thu', num: true, render: function (r) { return pctOf(r.brokenShare); } },
      ],
      rows: rows,
      foot: { _label: '<b>Tổng hệ thống</b>', due: '<b>' + F.money(tot.due) + '</b>', paid: '<b>' + F.money(tot.paid) + '</b>', after: '<b>' + F.money(tot.afterBreak) + '</b>', rate: pctOf(tot.rate), bd: F.money(tot.brokenDue), bp: F.money(tot.brokenPaid), br: pctOf(tot.brokenRate), bs: pctOf(tot.brokenShare) },
      empty: { title: 'Không có quản lý trong phạm vi' },
    });
  }
  function roomTab(p, bs, bills) {
    var bSel = TH.store.ui(P2, 'b', 'ALL'), st = TH.store.ui(P2, 'st', 'all'), q = TH.store.ui(P2, 'q', '');
    if (bSel !== 'ALL' && !bs.some(function (b) { return b.id === bSel; })) bSel = 'ALL';
    var inB = bills.filter(function (x) { return bSel === 'ALL' || x.buildingId === bSel; });
    var rows = inB.filter(function (x) { var k = x.contract && C.customer(x.contract.customerId); return (st === 'all' || x.state === st) && TH.match(q, [x.roomId, k ? k.name : '', C.staffName(x.managerId)]); });
    var order = ['unpaid', 'short', 'over', 'full', 'deposit', 'nobill', 'empty'];
    var chips = TH.chips(P2, 'st', [{ id: 'all', label: 'Tất cả', count: inB.length }].concat(order.filter(function (k) { return inB.some(function (x) { return x.state === k; }); }).map(function (k) { return { id: k, label: TH.BILL_STATES[k][0], count: inB.filter(function (x) { return x.state === k; }).length }; })), st);
    var bSelHtml = bs.length > 1 ? TH.uiSelect(P2, 'b', [{ id: 'ALL', label: 'Mọi tòa' }].concat(bs.map(function (b) { return { id: b.id, label: b.name }; })), bSel, 'Lọc tòa') : '';
    var tot = C.collectOf(rows, p);
    var table = TH.table({
      label: 'Báo cáo check thu tiền theo phòng',
      cols: [
        { key: 'r', label: 'Mã phòng', render: function (x) { var k = x.contract && C.customer(x.contract.customerId); return '<b>' + TH.roomLink(x.roomId) + '</b><div class="cell-sub">' + (k ? esc(k.name) : TH.statusLabel(x.room.status)) + '</div>'; } },
        { key: 'm', label: 'Quản lý', render: function (x) { return esc(C.staffName(x.managerId)); } },
        { kind: 'money', key: 'i', label: 'Hóa đơn kỳ', num: true, render: function (x) { return (x.invoice ? '<a class="tnum" href="' + TH.router.href('INV-03', x.invoice.id) + '">' + F.money(x.invTotal) + '</a>' : '<span class="muted">—</span>') + (x.oldDebt ? '<div class="cell-sub ' + (x.oldDebt > 0 ? 'neg' : 'pos') + '">Nợ cũ ' + (x.oldDebt > 0 ? '' : '−') + F.short(Math.abs(x.oldDebt)) + '</div>' : '') + (x.depositIn ? '<div class="cell-sub">Cọc ' + F.short(x.depositIn) + '</div>' : ''); } },
        { key: 'ky', label: 'Kỳ thanh toán', num: true, render: function (x) { return x.payCycle === null ? '<span class="muted">—</span>' : '<b>' + x.payCycle + '</b>' + (x.prepaidTo ? '<div class="cell-sub">' + (x.payCycle ? 'đến ' : 'đã trả đến ') + F.period(x.prepaidTo) + '</div>' : ''); } },
        { kind: 'money', key: 'due', label: 'Số tiền cần đóng', num: true, render: function (x) { return '<b>' + F.money(x.due) + '</b>'; } },
        { kind: 'money', key: 'paid', label: 'Số tiền đã đóng', num: true, render: function (x) { return F.money(x.paid) + (x.pending ? '<div class="cell-sub warn-text">+' + F.short(x.pending) + ' chờ xác nhận</div>' : ''); } },
        { key: 'bal', label: 'Công nợ', num: true, render: function (x) { return signed(x.balance); } },
        { key: 's', label: 'Tình trạng', render: function (x) { return billBadge(x.state) + (x.broken ? ' ' + TH.badge('Phá HĐ', 'danger') : ''); } },
        { key: 'd', label: 'Ngày thanh toán', render: function (x) { return x.lastPaidAt ? F.date(x.lastPaidAt) : '<span class="muted">—</span>'; } },
        { key: 'n', label: 'Ghi chú', wrap: true, render: function (x) {
          if (x.broken) return '<span class="small">' + esc(TH.BREAK_REASONS[x.broken.reason] || '') + ' · ' + F.date(x.broken.at) + '</span>';
          var notes = x.receipts.filter(function (c) { return c.kind === 'cur'; }).map(function (c) { var r = TH.db.receipts.find(function (y) { return y.id === c.id; }); return r && r.note; }).filter(Boolean);
          if (x.state === 'deposit') return '<span class="small">Giữ chỗ / cọc khách mới</span>';
          if (x.state === 'nobill') return '<span class="small">Chưa lập hóa đơn kỳ (INV-01)</span>';
          return notes.length ? '<span class="small">' + esc(notes.join('; ')) + '</span>' : '<span class="muted small">—</span>';
        } },
        { key: 'x', label: '', render: function (x) {
          var out = '', di = oldestDebtInv(x.roomId);
          if (di && TH.can('receipt.report')) out += '<button type="button" class="btn btn-xs" data-act="pay.reportFor" data-id="' + di.id + '" data-tip="Ghi nhận thu (trả hóa đơn cũ nhất trước)">' + I('handCoins', 'ic-sm') + 'Thu</button>';
          var ct = C.contractOfRoom(x.roomId);
          if (ct && !x.broken && TH.can('contract.break') && TH.inScope(x.buildingId)) out += '<button type="button" class="btn btn-xs btn-ghost btn-icon" data-act="pay.break" data-id="' + ct.id + '" data-tip="Ghi nhận phá HĐ" aria-label="Ghi nhận phá HĐ ' + esc(x.roomId) + '">' + I('xCircle', 'ic-sm') + '</button>';
          return out ? '<div class="row u-gap-6 u-nowrap">' + out + '</div>' : '';
        } },
      ],
      rows: rows,
      rowAttrs: function (x) { return x.state === 'unpaid' || x.broken ? 'class="u-row-alert"' : ''; },
      foot: { _label: '<b>Tổng (' + rows.length + ' phòng)</b>', due: '<b>' + F.money(tot.due) + '</b>', paid: '<b>' + F.money(tot.paid) + '</b>', bal: signed(tot.paid - tot.due) },
      empty: { title: 'Không có phòng phù hợp', text: 'Đổi bộ lọc tình trạng hoặc tòa.' },
    });
    return '<div class="card card-flush"><div class="toolbar">' + TH.searchBox(P2, 'Tìm phòng, khách, QL…') + bSelHtml + '<span class="grow"></span>' + chips + '</div>' + table +
      '<div class="card-ft"><span class="small muted">Cần đóng = hóa đơn kỳ + nợ cũ (thừa kỳ trước làm giảm)' + (TH.billRules().depositInCollect === 'no' ? '' : ' + cọc khách mới') + '; Công nợ = Đã đóng − Cần đóng. Kỳ TT = số tháng tiền phòng thu ở kỳ này (0 = đã trả trước). Tình trạng theo công thức cột “Tình trạng” của file hóa đơn: Chưa TT · Thiếu · Đủ · Thừa · Đóng cọc · Trống.</div></span></div>';
  }
  function breakTab(p, list) {
    var tot = { chase: C.sum(list, function (x) { return x.chase; }), paid: C.sum(list, function (x) { return x.paid; }), dt: C.sum(list, function (x) { return x.dtBroken; }) };
    return '<div class="card card-flush">' + TH.cardHd(I('alertCircle', 'ic-sm') + 'Danh sách phòng phá HĐ · kỳ ' + F.period(p), list.length + ' phòng · phải thu = tiền điện kỳ (cọc bị giữ bù tiền phòng)', TH.can('contract.break') ? '<button type="button" class="btn btn-sm" data-act="ui.set" data-screen="' + P2 + '" data-key="tab" data-val="room">' + I('xCircle', 'ic-sm') + 'Ghi nhận phá HĐ từ bảng check</button>' : '') +
      TH.table({
        label: 'Danh sách phòng phá hợp đồng',
        cols: [
          { key: 'i', label: 'STT', num: true, render: function (x, i) { return i + 1; } },
          { key: 'r', label: 'Mã phòng', render: function (x) { return '<b>' + TH.roomLink(x.bc.roomId) + '</b><div class="cell-sub">' + (x.customer ? '<a href="' + TH.router.href('CUS-02', x.customer.id) + '">' + esc(x.customer.name) + '</a>' : '') + '</div>'; } },
          { key: 'm', label: 'Quản lý', render: function (x) { return esc(C.staffName(x.managerId)); } },
          { key: 's', label: 'Ngày vào ở', render: function (x) { return x.start ? F.date(x.start) : '—'; } },
          { key: 'n', label: 'Số tháng ở', num: true, render: function (x) { return x.months === null ? '—' : x.months; } },
          { key: 'why', label: 'Lý do phá hợp đồng', render: function (x) { return esc(TH.BREAK_REASONS[x.bc.reason] || x.bc.reason) + '<div class="cell-sub">' + F.date(x.bc.at) + '</div>'; } },
          { key: 'ph', label: 'SĐT', render: function (x) { return '<span class="mono">' + esc(x.phone) + '</span>'; } },
          { kind: 'money', key: 'chase', label: 'Tổng phải thu (tiền điện)', num: true, render: function (x) { return x.invoice ? '<b>' + F.money(x.chase) + '</b>' : '<span class="muted" data-tip="Không có hóa đơn kỳ trên hệ thống">—</span>'; } },
          { key: 'paid', label: 'Tổng đã thu', num: true, render: function (x) { return moneyOr(x.paid, 'pos'); } },
          { kind: 'money', key: 'dt', label: 'DT phá hợp đồng (cần đóng)', num: true, render: function (x) { return x.invoice ? F.money(x.dtBroken) : '<span class="muted">—</span>'; } },
          { key: 'dep', label: 'Hồ sơ cọc', render: function (x) { var hc = x.deposit; if (!hc) return '<span class="muted small">—</span>'; var s = TH.DEPOSIT_STATES[hc.state] || [hc.state, 'neutral']; return TH.badge(s[0], s[1]) + (hc.forfeitAmount ? '<div class="cell-sub">Giữ ' + F.short(hc.forfeitAmount) + '</div>' : ''); } },
        ],
        rows: list,
        foot: { _label: '<b>Tổng</b>', chase: '<b>' + F.money(tot.chase) + '</b>', paid: '<b>' + F.money(tot.paid) + '</b>', dt: F.money(tot.dt) },
        empty: { title: 'Không có phòng phá HĐ trong kỳ', text: 'Ghi nhận phá HĐ từ tab Check theo phòng hoặc hồ sơ khách (CUS-02).' },
      }) + '<div class="card-ft"><span class="small muted">Theo sheet “DS phòng phá hđ”: hóa đơn kỳ của phòng phá HĐ vẫn giữ để tính <b>DT phá HĐ</b>; tổng phải thu truy thu = tiền điện kỳ đó. SĐT đã che. Mức giữ cọc theo hồ sơ cọc được duyệt (không tự ghi mất cọc).</div></span></div>';
  }
  /* CR-BILL: sheet "PHÒNG MỚI THÁNG …" — khách mới trong kỳ (hóa đơn đầu: tiền phòng lẻ ngày + DV + cọc) và phòng mới nhận cọc giữ chỗ */
  function newTab(p, list) {
    var tot = { rent: C.sum(list, function (x) { return x.rentAmount; }), dep: C.sum(list, function (x) { return x.deposit; }), svc: C.sum(list, function (x) { return x.svc; }), due: C.sum(list, function (x) { return x.bill.due; }), paid: C.sum(list, function (x) { return x.bill.paid; }) };
    return '<div class="card card-flush">' + TH.cardHd(I('sparkles', 'ic-sm') + 'Phòng mới kỳ ' + F.period(p), list.filter(function (x) { return x.kind === 'new'; }).length + ' khách mới · ' + list.filter(function (x) { return x.kind === 'hold'; }).length + ' giữ chỗ') +
      TH.table({
        label: 'Danh sách phòng mới trong kỳ',
        cols: [
          { key: 'r', label: 'Mã phòng', render: function (x) { return '<b>' + TH.roomLink(x.room.id) + '</b><div class="cell-sub">' + (x.customer ? '<a href="' + TH.router.href('CUS-02', x.customer.id) + '">' + esc(x.customer.name) + '</a>' : TH.badge('Giữ chỗ', 'info')) + '</div>'; } },
          { key: 'm', label: 'Quản lý', render: function (x) { return esc(C.staffName(x.managerId)); } },
          { key: 'ky', label: 'Kỳ thanh toán', num: true, render: function (x) { return x.cycle ? String(x.cycle.start ? x.cycle.months : 0) : '<span class="muted">—</span>'; } },
          { kind: 'money', key: 'pr', label: 'Giá chốt', num: true, render: function (x) { return x.rent === null ? '<span class="muted">—</span>' : '<b>' + F.money(x.rent) + '</b>' + (x.listRent !== x.rent ? '<div class="cell-sub">niêm yết ' + F.short(x.listRent) + '</div>' : ''); } },
          { key: 'd', label: 'Ngày ở', render: function (x) { return x.occ ? '<b class="small">' + x.occ.days + '/' + x.occ.base + ' ngày</b><div class="cell-sub">từ ' + F.date(x.occ.from) + '</div>' : '<span class="small muted">' + esc(x.note) + '</span>'; } },
          { kind: 'money', key: 'ra', label: 'Tiền phòng kỳ này', num: true, render: function (x) { return x.kind === 'hold' ? '<span class="muted">—</span>' : F.money(x.rentAmount) + (x.est ? '<div class="cell-sub">dự kiến · chưa lập HĐ</div>' : ''); } },
          { key: 'dep', label: 'Cọc', num: true, render: function (x) { return moneyOr(x.deposit); } },
          { kind: 'money', key: 'svc', label: 'Dịch vụ + điện nước', num: true, render: function (x) { return x.kind === 'hold' ? '<span class="muted">—</span>' : F.money(x.svc) + (x.est ? '<div class="cell-sub">dự kiến</div>' : ''); } },
          { kind: 'money', key: 'due', label: 'Tổng cần đóng', num: true, render: function (x) { return '<b>' + F.money(x.bill.due) + '</b>'; } },
          { kind: 'money', key: 'paid', label: 'Tổng đã đóng', num: true, render: function (x) { return F.money(x.bill.paid); } },
          { key: 's', label: 'Tình trạng', render: function (x) { return billBadge(x.bill.state) + '<div class="cell-sub">' + signed(x.bill.balance) + '</div>'; } },
          { key: 'n', label: 'Ghi chú', wrap: true, render: function (x) { return x.kind === 'new' ? '<span class="small">' + esc(x.note || '—') + '</span>' : '<span class="small muted">Chưa vào ở — chưa lập hóa đơn</span>'; } },
        ],
        rows: list,
        foot: { _label: '<b>Tổng</b>', ra: F.money(tot.rent), dep: F.money(tot.dep), svc: F.money(tot.svc), due: '<b>' + F.money(tot.due) + '</b>', paid: '<b>' + F.money(tot.paid) + '</b>' },
        empty: { title: 'Không có phòng mới trong kỳ', text: 'HĐ bắt đầu tính tiền trong kỳ và phòng nhận cọc giữ chỗ hiện ở đây.' },
      }) + '<div class="card-ft"><span class="small muted">Theo sheet “PHÒNG MỚI THÁNG …”: tiền phòng kỳ đầu tính lẻ theo ngày ở (quy tắc ' + esc(TH.BILL_RULE_LABELS.prorateBase.options[TH.billRules().prorateBase]) + '); Tổng cần đóng = hóa đơn đầu' + (TH.billRules().depositInCollect === 'no' ? '' : ' + cọc') + '. Giá chốt khác niêm yết ghi ở hợp đồng. ' + TH.openBadge('D-03', 'chờ duyệt rule') + '</div></span></div>';
  }
  function lossTab(p, list) {
    var sumE = C.sum(list, function (x) { return x.elec.amount; }), sumW = C.sum(list, function (x) { return x.water.amount; }), sumL = C.sum(list, function (x) { return x.lost; });
    return '<div class="card card-flush">' + TH.cardHd(I('zap', 'ic-sm') + 'Điện nước phòng trống / không thu được · kỳ ' + F.period(p), list.length + ' phòng · thất thoát ' + F.money(sumL)) +
      TH.table({
        label: 'Điện nước phòng trống và không thu được',
        cols: [
          { key: 'r', label: 'Phòng', render: function (x) { return '<b>' + (x.kind === 'common' ? esc(x.room.id) : TH.roomLink(x.room.id)) + '</b><div class="cell-sub">' + esc(C.building(x.room.buildingId).short) + '</div>'; } },
          { key: 'e0', label: 'Điện · CS cũ', num: true, render: function (x) { return F.num(x.elec.prev); } },
          { key: 'e1', label: 'CS mới', num: true, render: function (x) { return F.num(x.elec.cur); } },
          { key: 'eq', label: 'SL (kWh)', num: true, render: function (x) { return F.num(x.elec.qty); } },
          { kind: 'money', key: 'ep', label: 'Đơn giá', num: true, render: function (x) { return F.money(x.elec.price); } },
          { kind: 'money', key: 'ea', label: 'Thành tiền điện', num: true, render: function (x) { return F.money(x.elec.amount); } },
          { key: 'w0', label: 'Nước · CS cũ', num: true, render: function (x) { return F.num(x.water.prev); } },
          { key: 'w1', label: 'CS mới', num: true, render: function (x) { return F.num(x.water.cur); } },
          { key: 'wq', label: 'SL (m³)', num: true, render: function (x) { return F.num(x.water.qty); } },
          { kind: 'money', key: 'wp', label: 'Đơn giá', num: true, render: function (x) { return F.money(x.water.price); } },
          { kind: 'money', key: 'wa', label: 'Thành tiền nước', num: true, render: function (x) { return F.money(x.water.amount); } },
          { key: 'n', label: 'Ghi chú', render: function (x) { return TH.badge(x.note, x.kind === 'broken' ? 'danger' : x.kind === 'maintenance' || x.kind === 'common' ? 'warning' : 'info'); } },
          { kind: 'money', key: 'l', label: 'Không thu được', num: true, render: function (x) { return '<b class="neg">' + F.money(x.lost) + '</b>'; } },
        ],
        rows: list,
        foot: { _label: '<b>Tổng</b>', ea: '<b>' + F.money(sumE) + '</b>', wa: '<b>' + F.money(sumW) + '</b>', l: '<b class="neg">' + F.money(sumL) + '</b>' },
        empty: { title: 'Không có điện nước thất thoát trong kỳ', text: 'Phòng trống không tiêu thụ và phòng phá HĐ đã thu đủ điện nước.' },
      }) + '<div class="card-ft"><span class="small muted">Theo sheet “ĐIỆN NƯỚC PHÒNG TRỐNG/KHÔNG THU ĐƯỢC”: <b>PT</b> = phòng trống/đang sửa có tiêu thụ (công ty chịu); <b>Phá HĐ</b> = phần điện nước khách phá HĐ chưa trả (sau khi trừ tiền khách đã đóng).</div></span></div>';
  }
  function invTab(p, bs) {
    var S = P2, scope = TH.scope(), lead = TH.has('F032.B') ? TH.store.ui(S, 'lead', 'ALL') : 'ALL';
    var invs = C.invoicesIn(p, scope).filter(function (i) { return i.status === 'confirmed' && TH.inScope(i.buildingId) && (lead === 'ALL' || C.building(i.buildingId).managerId === lead); });
    var ms = { m5: 0, m10: 0, m15: 0, late: 0, weighted: 0 };
    var rows = invs.map(function (i) {
      var row = { inv: i, m5: 0, m10: 0, m15: 0, late: 0, w: 0 };
      C.receiptsOf(i.id).forEach(function (r) { var m = C.milestone(r, i); if (!m || m.key === 'other') return; row[m.key] += r.amount; row.w += r.amount * m.weight; });
      ['m5', 'm10', 'm15', 'late'].forEach(function (k) { ms[k] += row[k]; }); ms.weighted += row.w;
      return row;
    });
    var coll = ms.m5 + ms.m10 + ms.m15 + ms.late, debt = C.sum(invs, function (i) { return C.debt(i); });
    var table = TH.table({
      label: 'Công nợ và mốc 5/10/15',
      cols: [
        { key: 'r', label: 'Tòa / phòng', render: function (x) { return '<b>' + TH.roomLink(x.inv.roomId) + '</b><div class="cell-sub">' + esc(C.building(x.inv.buildingId).short) + '</div>'; } },
        { key: 'i', label: 'Hóa đơn', render: function (x) { return '<a class="mono small" href="' + TH.router.href('INV-03', x.inv.id) + '">' + x.inv.id + '</a><div class="cell-sub">' + F.money(x.inv.total) + '</div>'; } },
        { kind: 'money', key: 'm5', label: '≤5 · 100%', num: true, render: function (x) { return x.m5 ? F.money(x.m5) : '<span class="muted">—</span>'; } },
        { kind: 'money', key: 'm10', label: '≤10 · 90%', num: true, render: function (x) { return x.m10 ? F.money(x.m10) : '<span class="muted">—</span>'; } },
        { kind: 'money', key: 'm15', label: '≤15 · 70%', num: true, render: function (x) { return x.m15 ? F.money(x.m15) : '<span class="muted">—</span>'; } },
        { kind: 'money', key: 'late', label: 'Sau 15 · 0%', num: true, render: function (x) { return x.late ? F.money(x.late) : '<span class="muted">—</span>'; } },
        { kind: 'money', key: 'c', label: 'Thực thu', num: true, render: function (x) { var pe = C.pending(x.inv.id); return '<b>' + F.money(x.m5 + x.m10 + x.m15 + x.late) + '</b>' + (pe ? '<div class="cell-sub warn-text">+' + F.short(pe) + ' chờ xác nhận</div>' : ''); } },
        { kind: 'money', key: 'd', label: 'Còn nợ', num: true, render: function (x) { var d = C.debt(x.inv); return d ? '<b class="neg">' + F.money(d) + '</b>' : '<span class="muted">0</span>'; } },
        { kind: 'money', key: 'w', label: 'Quy đổi 3 mốc (A)', num: true, render: function (x) { return '<span class="pos">' + F.money(Math.round(x.w)) + '</span>'; } },
      ],
      rows: rows,
      rowAttrs: function (x) { return 'class="is-clickable" tabindex="0" data-href="' + TH.router.href('INV-03', x.inv.id) + '"'; },
      foot: { _label: '<b>Tổng</b>', m5: F.money(ms.m5), m10: F.money(ms.m10), m15: F.money(ms.m15), late: F.money(ms.late), c: '<b>' + F.money(coll) + '</b>', d: '<b class="neg">' + F.money(debt) + '</b>', w: '<b>' + F.money(Math.round(ms.weighted)) + '</b>' },
      empty: { title: 'Không có hóa đơn đã xác nhận', text: 'Kỳ/tòa đang chọn chưa có hóa đơn xác nhận.' },
    });
    var overdue = TH.db.invoices.filter(function (i) { return i.status === 'confirmed' && C.debt(i) > 0 && i.dueAt < TH.TODAY && TH.inScope(i.buildingId) && (scope === 'ALL' || i.buildingId === scope); });
    var overdueCard = TH.gate('F031.B', '<div class="card card-flush">' + TH.cardHd(I('alertCircle', 'ic-sm') + 'Quá hạn' + TH.up('F031.B'), overdue.length + ' hóa đơn · ' + F.money(C.sum(overdue, function (i) { return C.debt(i); })), '<button type="button" class="btn btn-sm" data-act="pay.csv">' + I('download', 'ic-sm') + 'Xuất CSV</button>') +
      TH.table({ compact: true, cols: [{ key: 'r', label: 'Phòng', render: function (i) { return i.roomId; } }, { key: 'p', label: 'Kỳ', render: function (i) { return F.period(i.period); } }, { key: 'd', label: 'Quá hạn', num: true, render: function (i) { return -C.daysTo(i.dueAt) + ' ngày'; } }, { key: 'n', label: 'Còn nợ', num: true, render: function (i) { return '<b class="neg">' + F.money(C.debt(i)) + '</b>'; } }], rows: overdue }) + '</div>', { label: 'Danh sách quá hạn và CSV', lines: 3 });
    var snapCard = TH.gate('F032.B', '<div class="card">' + TH.cardHd(I('stamp', 'ic-sm') + 'Bản chốt tự động mỗi mốc' + TH.up('F032.B')) + '<div class="card-bd">' + TH.table({ compact: true, cols: [{ key: 'k', label: 'Mốc' }, { key: 'v', label: 'Lũy kế đã xác nhận', num: true }, { key: 'a', label: 'Chụp lúc' }], rows: [{ k: 'Ngày 05', v: F.money(ms.m5), a: '05/10 23:59' }, { k: 'Ngày 10', v: F.money(ms.m5 + ms.m10), a: '10/10 23:59' }, { k: 'Ngày 15', v: F.money(ms.m5 + ms.m10 + ms.m15), a: '15/10 23:59' }] }) + '</div></div>', { label: 'Tự chốt số liệu mỗi mốc, lọc trưởng nhóm', lines: 3 });
    var edits = TH.db.receiptEdits.filter(function (e) { return e.period === p && TH.inScope(C.room(e.receiptRoom).buildingId); });
    var backdate = TH.gate('F032.C', '<div class="card">' + TH.cardHd(I('history', 'ic-sm') + 'Soát backdate & điều chỉnh' + TH.up('F032.C'), null, TH.gate('F031.C', '<button type="button" class="btn btn-sm" data-act="pay.adjust">' + I('edit', 'ic-sm') + 'Phiếu điều chỉnh' + TH.up('F031.C') + '</button>', { mode: 'btn', label: 'Phiếu điều chỉnh', size: 'btn-sm' })) + '<div class="card-bd">' + (edits.length ? '<ul class="timeline">' + edits.map(function (e) { return '<li><b>' + esc(e.receiptRoom) + '</b>: thực nhận ' + F.date(e.from) + ' → ' + F.date(e.to) + '<div class="when">' + esc(C.staffName(e.by)) + ' · ' + esc(e.reason) + '</div></li>'; }).join('') + '</ul>' : '<span class="small muted">Không có điều chỉnh ngày tiền trong kỳ.</span>') + '</div></div>', { label: 'Soát backdate/điều chỉnh sau khóa', lines: 3 });
    var debtors = {};
    TH.db.invoices.filter(function (i) { return i.status === 'confirmed' && C.debt(i) > 0 && TH.inScope(i.buildingId); }).forEach(function (i) { (debtors[i.customerId] = debtors[i.customerId] || []).push(i); });
    var multi = Object.keys(debtors).filter(function (k) { return debtors[k].length > 1; });
    var alloc = TH.gate('F031.D', '<div class="card">' + TH.cardHd(I('split', 'ic-sm') + 'Phân bổ 1 phiếu thu cho nhiều hóa đơn' + TH.up('F031.D')) + '<div class="card-bd">' + (multi.length ? multi.map(function (k) { return '<div class="small u-mb-8"><b>' + esc(C.customer(k).name) + '</b> nợ ' + debtors[k].length + ' hóa đơn: ' + debtors[k].map(function (i) { return i.id + ' (' + F.short(C.debt(i)) + ')'; }).join(', ') + '<br><span class="muted">Phiếu thu mới được phân bổ hóa đơn cũ trước (FIFO).</span></div>'; }).join('') : '<span class="small muted">Không có khách nợ nhiều hóa đơn.</span>') + '</div></div>', { label: 'Phân bổ 1 phiếu thu cho nhiều hóa đơn cùng khách', lines: 3 });
    var formula = '<div class="card card-flush">' + TH.cardHd(I('calculator', 'ic-sm') + 'Hiệu suất theo tòa', 'HS% = [A − A × B + C] ÷ tổng giá niêm yết · tạm tính & thực tế', TH.openBadge('D-04')) +
      TH.perfTable(p, bs) +
      '<div class="card-bd stack-sm">' +
      TH.gate('F033.B', '', { mode: 'mini', label: 'Hỗ trợ lấy và giải thích đầu vào hiệu suất' }) +
      TH.gate('F033.C', '', { mode: 'mini', label: 'Soát ngoại lệ và đối chiếu đầu vào hiệu suất' }) +
      TH.gate('F033.D', '<div class="small">' + TH.tierPill('D') + ' Công thức <b>HS-01 v0.4</b> (A/B/C/D theo note khách 20/10/2026) · nhánh cọc mới & đóng 3 tháng chờ chốt.</div>', { mode: 'mini', label: 'Phiên bản công thức & kiểm thử' }) +
      TH.perfFormulaNote() + '<div class="small muted">A của hiệu suất chỉ tính phiếu thu của hóa đơn kỳ nhận trong tháng; “Tổng 3 mốc” ở tab Theo tòa tính trên mọi khoản đã đóng (gồm trả nợ cũ, cọc) như file Excel. Thu sau ngày 15 vẫn giảm nợ nhưng không tính vào A.</div></div></div>';
    return '<div class="card u-mb-16"><div class="card-bd"><div class="row-between u-mb-12"><b class="small">Thực thu hóa đơn kỳ theo mốc ngày nhận</b><span class="small muted">Quy đổi A = ' + F.money(Math.round(ms.weighted)) + '</span></div>' +
      TH.chart.stack([{ label: '≤ ngày 5 (100%)', value: ms.m5, color: SEQ[0] }, { label: '≤ ngày 10 (90%)', value: ms.m10, color: SEQ[1] }, { label: '≤ ngày 15 (70%)', value: ms.m15, color: SEQ[2] }, { label: 'Sau 15 (0%)', value: ms.late, color: SEQ[3] }]) + '</div></div>' +
      '<div class="card card-flush u-mb-16">' + table + '</div>' +
      '<div class="u-mb-16">' + formula + '</div>' +
      '<div class="grid-2 u-mb-16">' + overdueCard + snapCard + '</div>' +
      '<div class="grid-2">' + backdate + alloc + '</div>';
  }
  TH.views['PAY-02'] = {
    scan: function () { return P2_TABS.map(function (t) { return { ui: { tab: t.id } }; }).concat([{ ui: { tab: 'room', st: 'short' } }, { ui: { tab: 'room', b: 'TH-DD' } }]); },
    dialogs: [function () { var ct = TH.db.contracts.find(function (c) { return c.status === 'active' && TH.inScope(c.buildingId); }); if (ct) return breakForm(ct.id); }],
    render: function () {
      var S = P2, p = TH.store.state.period, bs = p2Buildings();
      var tab = TH.resolveTab(S, P2_TABS);
      var bills = p2Bills(p, bs), tot = C.collectOf(bills, p);
      var bRows = bs.map(function (b) { return C.collectBuilding(p, b.id); });
      var lead = TH.has('F032.B') ? TH.store.ui(S, 'lead', 'ALL') : 'ALL';
      var leadSel = TH.gate('F032.B', TH.uiSelect(S, 'lead', [{ id: 'ALL', label: 'Mọi trưởng nhóm/QL' }].concat(TH.db.buildings.filter(function (b) { return TH.inScope(b.id); }).map(function (b) { return { id: b.managerId, label: C.staffName(b.managerId) }; }).filter(function (o, i, a) { return a.findIndex(function (x) { return x.id === o.id; }) === i; })), lead, 'Lọc trưởng nhóm', 'sel-inline') + TH.up('F032.B'), { mode: 'btn', label: 'Lọc trưởng nhóm', size: 'btn-sm' });
      var lockBtn = TH.gate('F032.D', TH.permBtn('report.all', '<button type="button" class="btn" data-act="pay.lockMs">' + I('lock', 'ic-sm') + 'Chốt mốc' + TH.up('F032.D') + '</button>', '403'), { mode: 'btn', label: 'Chốt mốc & đối chiếu phiên bản' });
      var stamp = TH.TODAY.slice(0, 7) === p ? 'Cập nhật thu tiền ngày ' + F.date(TH.TODAY) : 'Kỳ ' + F.period(p);
      var kpis = '<div class="grid-5 u-mb-16">' +
        TH.kpi({ label: 'Tổng DT phải thu', icon: 'receipt', value: F.short(tot.due), foot: tot.rooms + ' phòng · gồm nợ cũ' + (TH.billRules().depositInCollect === 'no' ? '' : ' & cọc mới ' + F.short(tot.deposit)) }) +
        TH.kpi({ label: 'Thực thu', icon: 'checkCircle', value: F.short(tot.paid), foot: 'Tỉ lệ ' + (tot.rate === null ? '—' : F.pct(tot.rate, 1)) + (tot.pending ? ' · ' + F.short(tot.pending) + ' chờ xác nhận' : '') }) +
        TH.kpi({ label: 'Phải thu sau phá hợp đồng', icon: 'wallet', value: F.short(tot.afterBreak), neg: tot.afterBreak > 0, foot: 'Phải thu − thực thu − (DT phá HĐ − thu được)' }) +
        TH.kpi({ label: 'DT phá hợp đồng', icon: 'alertCircle', value: F.short(tot.brokenDue), foot: tot.broken + ' phòng · thu được ' + F.short(tot.brokenPaid) + (tot.brokenShare ? ' · ' + F.pct(tot.brokenShare, 1) + ' phải thu' : ''), href: TH.router.href('PAY-02') }) +
        TH.kpi({ label: 'Tổng 3 mốc', icon: 'target', value: F.short(Math.round(tot.msTotal)), accent: true, foot: 'M5 ' + F.short(tot.cum5) + ' · M10 ' + F.short(tot.cum10) + ' · M15 ' + F.short(tot.cum15) }) + '</div>';
      var body;
      if (tab === 'mgr') body = '<div class="card card-flush">' + TH.cardHd(I('users', 'ic-sm') + 'Cập nhật thu tiền theo quản lý', stamp) + mgrTable(p, C.collectManagers(p, bs.map(function (b) { return b.id; })), tot) + '<div class="card-ft"><span class="small muted">Phải thu sau phá HĐ = Tổng phải thu − Thực thu − (DT phá HĐ − DT phá HĐ thu được) · Tỉ lệ = Thực thu ÷ Phải thu · Tỉ lệ thu được = Phá HĐ thu được ÷ DT phá HĐ.</div></span></div>';
      else if (tab === 'bld') body = '<div class="card card-flush">' + TH.cardHd(I('building', 'ic-sm') + 'Cập nhật thu tiền theo tòa nhà', stamp + ' · bấm dòng để xem từng phòng') + bldTable(p, bRows, tot) + '<div class="card-ft"><span class="small muted">Lũy kế M5/M10/M15 = tiền đã đóng có ngày thực nhận ≤ ngày 5/10/15 của kỳ. DT mốc 1 = M5 · mốc 2 = (M10 − M5) × 90% · mốc 3 = (M15 − M10) × 70%. ' + TH.openBadge('D-04') + '</div></span></div>';
      else if (tab === 'room') body = roomTab(p, bs, bills);
      else if (tab === 'new') body = newTab(p, C.newRooms(p, TH.scope()).filter(function (x) { return bs.some(function (b) { return b.id === x.buildingId; }); }));
      else if (tab === 'break') body = breakTab(p, C.breakList(p, TH.scope()).filter(function (x) { return bs.some(function (b) { return b.id === x.bc.buildingId; }); }));
      else if (tab === 'loss') body = lossTab(p, C.utilityLoss(p, TH.scope()).filter(function (x) { return bs.some(function (b) { return b.id === x.room.buildingId; }); }));
      else body = invTab(p, bs);
      return TH.pageHeader({ screen: S, title: 'Tiến độ thu tiền', status: TH.periodBadge(p), desc: 'Theo file “Hoá đơn tiền nhà tháng 9…”: QL tòa xác nhận thu, văn phòng theo dõi tiến độ theo quản lý, theo tòa và từng phòng. Chỉ tiền đã xác nhận mới tính; báo thu chờ xác nhận hiển thị riêng.',
          actions: leadSel + lockBtn + TH.exportBtn('pay2.xlsx', 'Xuất báo cáo (.xlsx)') + '<a class="btn" href="' + TH.router.href('PAY-01') + '">' + I('handCoins', 'ic-sm') + 'Phiếu thu</a>' }) +
        kpis + '<div class="u-mb-12">' + TH.tabs(S, P2_TABS, tab) + '</div>' + TH.tabPanel(S, tab, body);
    },
  };

  /* Ghi nhận phá HĐ (CR-PAY): HĐ kết thúc trước hạn, phòng trống, hóa đơn kỳ giữ làm DT phá HĐ, mở hồ sơ cọc chờ duyệt giữ cọc */
  function breakForm(ctId) {
    var form = 'pay-break', ct = C.contract(ctId), k = C.customer(ct.customerId), p = TH.store.state.period;
    var inv = TH.db.invoices.find(function (i) { return i.roomId === ct.roomId && i.period === p && i.status === 'confirmed'; });
    var rd = C.reading(ct.roomId, p), elec = inv ? C.sum(inv.lines.filter(function (l) { return l.type === 'elec'; }), function (l) { return l.amount; }) : 0;
    return {
      title: 'Ghi nhận phá HĐ · ' + esc(ct.roomId), sub: esc(k.name) + ' · ' + esc(ct.id) + ' · vào ở ' + F.date(ct.start),
      body: '<div class="stack"><div class="form-grid">' +
        TH.field({ form: form, name: 'at', label: 'Ngày khách đi / phá hợp đồng', type: 'date', def: TH.TODAY }) +
        TH.field({ form: form, name: 'reason', label: 'Lý do', type: 'select', options: Object.keys(TH.BREAK_REASONS).map(function (id) { return { id: id, label: TH.BREAK_REASONS[id] }; }), def: 'runaway' }) +
        TH.field({ form: form, name: 'note', label: 'Ghi chú', def: '', span: true }) + '</div>' +
        '<div class="alert alert-warning">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Sau khi ghi nhận</b><span>HĐ chuyển <b>Phá hợp đồng</b>, phòng chuyển <b>Trống</b>. Hóa đơn kỳ ' + F.period(p) + (inv ? ' (' + F.money(inv.total) + ') giữ nguyên làm <b>DT phá HĐ</b>; truy thu tiền điện ' + F.money(elec) : ' chưa lập — không có DT phá HĐ') + '. ' +
        'Mở hồ sơ cọc ' + F.money(ct.deposit) + ' chờ duyệt mức giữ (Điều ' + '4.3/7.1, không tự ghi mất cọc).' + (rd ? ' Chỉ số kỳ: điện ' + rd.elecPrev + ' → ' + (rd.elecCur === null ? '?' : rd.elecCur) + '.' : '') + '</span></div></div></div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-danger" data-act="pay.breakSave" data-id="' + ct.id + '">' + I('xCircle', 'ic-sm') + 'Ghi nhận phá HĐ</button>',
    };
  }
  TH.act['pay.break'] = function (el) { var id = el.dataset.id; TH.store.clearDraft('pay-break'); TH.modal.open({ key: 'pay-break', size: 'md', render: function () { return breakForm(id); } }); };
  TH.act['pay.breakSave'] = function (el) {
    var ct = C.contract(el.dataset.id), g = function (k, d) { return TH.store.draft('pay-break', k, d); }, p = TH.store.state.period;
    var at = g('at', TH.TODAY), reason = g('reason', 'runaway'), note = g('note', '');
    var period = at.slice(0, 7) > p ? at.slice(0, 7) : p;
    Object.assign(ct, { status: 'terminated', endedAt: at, endKind: 'tenant_request', endReason: (TH.BREAK_REASONS[reason] || '') + (note ? ' — ' + note : '') });
    var room = C.room(ct.roomId), prev = room.status;
    room.status = 'vacant';
    TH.db.roomEvents.push({ roomId: room.id, at: at, from: prev, to: 'vacant', by: TH.me().id, note: 'Khách phá HĐ' });
    TH.db.breakCases = TH.db.breakCases || [];
    var id = 'PHD-' + period.slice(2, 4) + period.slice(5) + '-' + String(TH.db.breakCases.length + 1).padStart(2, '0');
    TH.db.breakCases.push({ id: id, roomId: room.id, contractId: ct.id, customerId: ct.customerId, buildingId: ct.buildingId, period: period, at: at, reason: reason, note: note, reportedBy: TH.me().id, reportedAt: TH.TODAY });
    if (!C.depositCase(ct.id)) TH.db.depositCases.push({ id: TH.recordActions.id('HC'), contractId: ct.id, customerId: ct.customerId, amount: ct.deposit, state: 'pending_approval', handoverAt: at, dueAt: TH.addDays(at, (ct.terms && ct.terms.refundDays) || 10), deductions: [], forfeitAmount: ct.deposit, forfeitBasis: 'Điều 4.3 & 7.1 HĐ — khách đơn phương chấm dứt (đề xuất giữ toàn bộ cọc)', refundAmount: 0, proposedBy: TH.me().id, proposedAt: TH.TODAY, approvedBy: null, approvedAt: null, paidBy: null, paidAt: null, txnRef: null, note: 'Phá HĐ ' + F.date(at) + ' — chờ duyệt mức giữ cọc' });
    TH.log('Ghi nhận phá HĐ', ct.id, room.id + ' · ' + (TH.BREAK_REASONS[reason] || '') + ' · ' + F.date(at), 'contract', ct.buildingId);
    TH.store.clearDraft('pay-break'); TH.modal.close('pay-break', { silent: true });
    TH.store.setUi(P2, 'tab', 'break'); TH.app.refresh();
    TH.toast('Đã ghi nhận phá HĐ ' + room.id, 'HĐ kết thúc, phòng trống; hồ sơ cọc chờ duyệt mức giữ.', 'warning');
  };
  TH.act['pay2.rooms'] = function (el) { TH.store.setUi(P2, 'b', el.dataset.b); TH.store.setUi(P2, 'st', 'all'); TH.store.setUi(P2, 'tab', 'room'); TH.app.refresh(); };
  TH.act['pay.csv'] = function () {
    var rows = TH.db.invoices.filter(function (i) { return i.status === 'confirmed' && C.debt(i) > 0 && i.dueAt < TH.TODAY && TH.inScope(i.buildingId); });
    TH.exportCsv('qua_han_' + TH.TODAY, ['Số hóa đơn', 'Phòng', 'Kỳ', 'Hạn', 'Còn nợ'], rows.map(function (i) { return [i.id, i.roomId, F.period(i.period), F.date(i.dueAt), C.debt(i)]; }));
    TH.toast('Đã xuất CSV', rows.length + ' hóa đơn quá hạn');
  };
  TH.act['pay2.xlsx'] = function () {
    var p = TH.store.state.period, bs = p2Buildings(), invs = C.invoicesIn(p, TH.scope()).filter(function (i) { return i.status === 'confirmed' && TH.inScope(i.buildingId); });
    var mg = C.collectManagers(p, bs.map(function (b) { return b.id; })), bills = p2Bills(p, bs), tot = C.collectOf(bills, p);
    var br = C.breakList(p, TH.scope()), loss = C.utilityLoss(p, TH.scope()), nr = C.newRooms(p, TH.scope());
    var money = function (label) { return { label: label, type: 'money' }; }, pct = function (label) { return { label: label, type: 'pct' }; };
    TH.exportXlsx('Cap_nhat_thu_tien_ky_' + p, [
      { name: 'Theo quan ly', title: 'Cập nhật thu tiền theo quản lý — kỳ ' + F.period(p), note: 'Dữ liệu minh họa · chỉ tiền đã xác nhận', columns: [{ label: 'Quản lý', width: 24 }, money('Tổng DT phải thu'), money('Thực thu'), money('DT phải thu sau phá HĐ'), pct('Tỉ lệ'), money('DT phá HĐ'), money('DT phá HĐ thu được'), pct('Tỷ lệ thu được'), pct('Tỷ lệ phá HĐ / phải thu')],
        rows: mg.map(function (r) { return [C.staffName(r.managerId), r.due, r.paid, r.afterBreak, r.rate, r.brokenDue, r.brokenPaid, r.brokenRate, r.brokenShare]; }).concat([['TỔNG HỆ THỐNG', tot.due, tot.paid, tot.afterBreak, tot.rate, tot.brokenDue, tot.brokenPaid, tot.brokenRate, tot.brokenShare]]) },
      { name: 'Theo toa', title: 'Cập nhật thu tiền theo tòa nhà — kỳ ' + F.period(p), note: 'Mốc 2 = (M10 − M5) × 90% · mốc 3 = (M15 − M10) × 70%', columns: [{ label: 'Mã tòa' }, { label: 'Quản lý', width: 24 }, money('DT phải thu'), money('DT thu được'), money('DT phá HĐ'), money('DT phá HĐ thu được'), pct('Tỉ lệ thu'), pct('Tỉ lệ phá HĐ'), money('Ngày M5'), money('Ngày M10'), money('Ngày M15'), money('DT mốc 1'), money('DT mốc 2'), money('DT mốc 3'), money('Tổng 3 mốc')],
        rows: bs.map(function (b) { var r = C.collectBuilding(p, b.id); return [b.short, C.staffName(r.managerId), r.due, r.paid, r.brokenDue, r.brokenPaid, r.rate, r.brokenShare, r.cum5, r.cum10, r.cum15, r.m1, Math.round(r.m2), Math.round(r.m3), Math.round(r.msTotal)]; }) },
      { name: 'Check thu tien', title: 'Báo cáo check thu tiền — kỳ ' + F.period(p), note: 'Công nợ = Đã đóng − Cần đóng', columns: [{ label: 'Mã phòng' }, { label: 'Quản lý', width: 24 }, { label: 'Kỳ thanh toán', type: 'number' }, money('Số tiền cần đóng'), money('Số tiền đã đóng'), money('Công nợ'), { label: 'Tình trạng' }, { label: 'Ngày thanh toán' }, { label: 'Ghi chú', width: 30 }],
        rows: bills.map(function (x) { return [x.roomId, C.staffName(x.managerId), x.payCycle === null ? '' : x.payCycle, x.due, x.paid, x.balance, TH.BILL_STATES[x.state][0], x.lastPaidAt ? F.date(x.lastPaidAt) : '', x.broken ? 'Phá HĐ · ' + (TH.BREAK_REASONS[x.broken.reason] || '') : x.oldDebt ? 'Nợ cũ ' + F.money(x.oldDebt) : '']; }) },
      { name: 'Phong moi', title: 'Phòng mới — kỳ ' + F.period(p), note: 'Tiền phòng kỳ đầu tính lẻ theo ngày ở · quy tắc đề xuất chờ duyệt', columns: [{ label: 'Mã phòng' }, { label: 'Khách', width: 22 }, { label: 'Quản lý', width: 24 }, { label: 'Kỳ thanh toán', type: 'number' }, money('Giá niêm yết'), money('Giá chốt'), { label: 'Ngày ở', type: 'number' }, money('Tiền phòng kỳ này'), money('Cọc'), money('DV + điện nước'), money('Tổng cần đóng'), money('Tổng đã đóng'), { label: 'Tình trạng' }, { label: 'Ghi chú', width: 30 }],
        rows: nr.map(function (x) { return [x.room.id, x.customer ? x.customer.name : 'Giữ chỗ', C.staffName(x.managerId), x.cycle ? (x.cycle.start ? x.cycle.months : 0) : '', x.listRent, x.rent || 0, x.occ ? x.occ.days : '', x.rentAmount, x.deposit, x.svc, x.bill.due, x.bill.paid, TH.BILL_STATES[x.bill.state][0], x.note]; }) },
      { name: 'DS phong pha HD', title: 'Danh sách phòng phá HĐ — kỳ ' + F.period(p), note: 'Tổng phải thu = tiền điện kỳ · SĐT đã che', columns: [{ label: 'STT' }, { label: 'Mã phòng' }, { label: 'Quản lý', width: 24 }, { label: 'Ngày vào ở' }, { label: 'Số tháng ở', type: 'number' }, { label: 'Lý do phá hợp đồng', width: 26 }, { label: 'SĐT' }, money('Tổng phải thu'), money('Tổng đã thu')],
        rows: br.map(function (x, i) { return [i + 1, x.bc.roomId, C.staffName(x.managerId), x.start ? F.date(x.start) : '', x.months, TH.BREAK_REASONS[x.bc.reason] || '', x.phone, x.chase, x.paid]; }) },
      { name: 'Dien nuoc khong thu', title: 'Điện nước phòng trống / không thu được — kỳ ' + F.period(p), note: 'PT = phòng trống', columns: [{ label: 'Phòng' }, { label: 'Điện CS cũ', type: 'number' }, { label: 'CS mới', type: 'number' }, { label: 'SL', type: 'number' }, money('Đơn giá'), money('Thành tiền'), { label: 'Nước CS cũ', type: 'number' }, { label: 'CS mới', type: 'number' }, { label: 'SL', type: 'number' }, money('Đơn giá'), money('Thành tiền'), { label: 'Ghi chú' }, money('Không thu được')],
        rows: loss.map(function (x) { return [x.room.id, x.elec.prev, x.elec.cur, x.elec.qty, x.elec.price, x.elec.amount, x.water.prev, x.water.cur, x.water.qty, x.water.price, x.water.amount, x.note, x.lost]; }) },
      { name: 'Cong no moc', title: 'Công nợ & mốc 5/10/15 theo hóa đơn — ' + TH.scopeLabel(), note: 'DRAFT · mốc theo ngày thực nhận đã xác nhận (D-04)', columns: [{ label: 'Phòng' }, { label: 'Hóa đơn', width: 18 }, money('Tổng'), money('≤5'), money('≤10'), money('≤15'), money('Sau 15'), money('Còn nợ')],
        rows: invs.map(function (i) { var o = { m5: 0, m10: 0, m15: 0, late: 0 }; C.receiptsOf(i.id).forEach(function (r) { var m = C.milestone(r, i); if (m && o[m.key] !== undefined) o[m.key] += r.amount; }); return [i.roomId, i.id, i.total, o.m5, o.m10, o.m15, o.late, C.debt(i)]; }) },
      TH.perfSheet(p, bs)]);
    TH.toast('Đã xuất báo cáo', '.xlsx · 8 sheet: theo QL, theo tòa, check phòng, phòng mới, phá HĐ, điện nước không thu được, công nợ mốc, hiệu suất');
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
