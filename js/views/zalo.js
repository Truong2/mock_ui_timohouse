/* Zalo OA (mô phỏng, provider chưa chốt — D-05): OA-01 cấu hình & gửi, OA-02 lịch sử. F026–F028. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;

  /* Gửi mô phỏng — không gọi provider thật. Trả 'sent' hoặc lý do không gửi. */
  TH.zaloSend = function (inv, tplId) {
    if (!inv || !TH.can('oa.send') || !TH.inScope(inv.buildingId)) return 'Không có quyền gửi hóa đơn này';
    var template = TH.db.oaTemplates.find(function (t) { return t.id === tplId; });
    if (!template || template.status !== 'approved') return 'Mẫu tin chưa được duyệt';
    if (!TH.has('F026.B') && TH.db.oaTemplates.filter(function (t) { return t.status === 'approved' && t.kind !== 'expiry'; }).slice(0, 2).indexOf(template) === -1) { TH.requireFeature('F026.B'); return 'Mẫu ngoài giới hạn gói A'; }
    if (template.kind === 'expiry' && !TH.requireFeature('F026.B')) return 'Mẫu có từ gói B';
    var k = C.customer(inv.customerId), msgId = TH.recordActions.id('ZL');
    var now = TH.TODAY + ' ' + String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0');
    var reason = '';
    if (inv.status !== 'confirmed') reason = 'Hóa đơn chưa xác nhận';
    else if (!k.oaLinked) reason = 'Người nhận chưa liên kết OA';
    else if (tplId === 'TPL-02' && C.debt(inv) <= 0) reason = 'Đã thu đủ — không nhắc';
    else if (TH.db.messages.some(function (m) { return m.invoiceId === inv.id && m.template === tplId && m.at.slice(0, 10) === TH.TODAY && m.status === 'sent'; })) return 'Đã gửi hôm nay — chống trùng';
    TH.db.messages.push({ id: msgId, invoiceId: inv.id, customerId: k.id, template: tplId, at: now, status: reason ? 'skipped' : 'sent', reason: reason, retries: 0, by: TH.me().id });
    if (!reason) TH.log('Gửi Zalo (mô phỏng)', inv.id, TH.db.oaTemplates.find(function (t) { return t.id === tplId; }).name, 'oa', inv.buildingId);
    return reason || 'sent';
  };
  function fill(tpl, inv) {
    return esc(tpl.body).replace('{ky}', F.period(inv.period)).replace('{phong}', inv.roomId).replace('{tong_tien}', F.money(inv.total)).replace('{han}', F.date(inv.dueAt)).replace('{link}', 'timehouse.demo/hd/' + inv.id).replace('{con_no}', F.money(C.debt(inv))).replace('{ngay_het_han}', F.date(C.contract(inv.contractId).end));
  }
  function tplName(id) { var t = TH.db.oaTemplates.find(function (x) { return x.id === id; }); return t ? t.name : id; }

  /* ---------------- OA-01 ---------------- */
  TH.views['OA-01'] = {
    render: function () {
      var S = 'OA-01', p = TH.store.state.period, oa = TH.db.oa;
      var tplId = TH.store.ui(S, 'tpl', 'TPL-01');
      var tpls = TH.db.oaTemplates;
      var allowedTpls = tpls.filter(function (t) { return t.status === 'approved' && (TH.has('F026.B') || t.kind !== 'expiry'); });
      if (!TH.has('F026.B')) allowedTpls = allowedTpls.slice(0, 2);
      if (!allowedTpls.some(function (t) { return t.id === tplId; })) tplId = allowedTpls[0] ? allowedTpls[0].id : '';
      var tpl = tpls.find(function (t) { return t.id === tplId; }) || tpls[0];
      var invs = TH.db.invoices.filter(function (i) { return i.period === p && i.status === 'confirmed' && TH.inScope(i.buildingId); });
      var sel = TH.store.ui(S, 'sel', []);
      if (!TH.has('F027.B') && sel.length > 1) sel = [];
      var eligible = function (i) {
        var k = C.customer(i.customerId);
        if (!k.oaLinked) return 'Chưa liên kết OA';
        if (tpl.id === 'TPL-02' && C.debt(i) <= 0) return 'Đã thu đủ';
        return '';
      };
      var recipients = TH.table({
        compact: true, label: 'Danh sách người nhận',
        cols: [
          { key: 'ck', label: '', labelHtml: '<span class="sr-only">Chọn</span>', cls: 'cell-check', tdCls: 'cell-check', render: function (i) { return eligible(i) ? '' : '<input type="' + (TH.has('F027.B') ? 'checkbox' : 'radio') + '" name="oa-recipient" aria-label="Chọn ' + i.roomId + '" data-act="oa.sel" data-id="' + i.id + '"' + (sel.indexOf(i.id) > -1 ? ' checked' : '') + '>'; } },
          { key: 'r', label: 'Phòng', render: function (i) { return '<b>' + i.roomId + '</b>'; } },
          { key: 'k', label: 'Khách', render: function (i) { return esc(C.customer(i.customerId).name); } },
          { kind: 'money', key: 'd', label: 'Còn nợ', num: true, render: function (i) { return F.money(C.debt(i)); } },
          { key: 'e', label: 'Điều kiện gửi', render: function (i) { var e = eligible(i); return e ? TH.badge(e, 'neutral', { icon: 'ban' }) : TH.badge('Đủ điều kiện', 'success', { icon: 'check' }); } },
          { kind: 'status', key: 'last', label: 'Đã gửi', render: function (i) { var m = TH.db.messages.filter(function (x) { return x.invoiceId === i.id && x.template === tpl.id; }).pop(); return m ? TH.statusOf('message', m.status) + '<div class="cell-sub">' + F.date(m.at) + '</div>' : '<span class="muted small">—</span>'; } },
        ], rows: invs, empty: { title: 'Không có hóa đơn đã xác nhận', text: 'Chỉ gửi hóa đơn đã xác nhận.' },
      });
      var tplRows = tpls.map(function (t) {
        var row = '<div class="row-between" style="padding:10px 0;border-bottom:1px solid var(--n-100)"><div><b class="small">' + esc(t.name) + '</b><div class="small muted">' + esc(t.id) + (TH.has('F026.D') ? ' · v' + t.version : '') + '</div></div>' + TH.status(t.status === 'approved' ? 'approved' : 'draft') + '</div>';
        return t.kind === 'expiry' ? TH.gate('F026.B', row.replace('</b>', '</b> ' + TH.up('F026.B')), { mode: 'block', ghost: 'self', label: 'Mẫu riêng hết hạn hợp đồng' }) : row;
      }).join('');
      var preview = invs[0] ? '<div class="card" style="background:var(--info-soft);border-color:var(--info-line)"><div class="card-bd"><div class="small strong u-mb-8">' + I('message', 'ic-sm') + ' Xem trước · ' + esc(tpl.name) + '</div><div style="background:var(--surface);border-radius:12px;padding:12px 14px;font-size:13px;box-shadow:var(--shadow-sm)">' + fill(tpl, C.invoice(sel[0] || invs[0].id)) + '</div></div></div>' : '';

      var schedule = '<div class="card">' + TH.cardHd(I('calendar', 'ic-sm') + 'Lịch nhắc', 'Phụ thuộc khả năng của OA') + '<div class="card-bd stack">' +
        '<p class="small">' + (TH.has('F027.B') ? 'Tối đa ba mốc nhắc đang hoạt động ' + TH.up('F027.B') : 'Một lịch nhắc đơn giản ' + TH.gate('F027.B', '', { mode: 'btn', label: 'Ba mốc nhắc cấu hình', size: 'btn-sm' })) + '</p>' +
        TH.table({ compact: true, label: 'Lịch nhắc OA', cols: [{ key: 'n', label: 'Lịch', render: function (s) { return esc(s.name); } }, { key: 'd', label: 'Ngày nhắc', render: function (s) { return 'Ngày ' + s.day; } }, { key: 's', label: 'Trạng thái', render: function (s) { return TH.status(s.status); } }], rows: TH.db.oaSchedules || [], empty: { title: 'Chưa có lịch nhắc', text: 'Thêm lịch để chạy mô phỏng.' } }) +
        TH.permBtn('oa.send', '<button type="button" class="btn btn-sm" data-act="rec.create" data-type="oaSchedule">Thêm lịch nhắc</button>', '403') +
        '<p class="small muted">Mọi gói dừng nhắc khoản đã xác nhận thu đủ và chống gửi lặp cùng hóa đơn/mẫu trong ngày.</p>' + TH.gate('F027.C', '<div class="alert alert-neutral">' + I('shieldCheck', 'ic-sm') + '<div class="alert-body"><b>Hàng đợi và xử lý ngoại lệ ' + TH.up('F027.C') + '</b><span>Tin lỗi vào hàng đợi gửi lại (' + TH.db.messages.filter(function (m) { return m.status === 'failed'; }).length + ' tin).</span></div></div>', { label: 'Hàng đợi gửi lại và xử lý ngoại lệ', lines: 1 }) + '</div></div>';
      var sent = TH.db.messages.filter(function (m) { return m.at.slice(0, 7) === p; });
      var stats = TH.gate('F027.D', '<div class="card">' + TH.cardHd(I('chart', 'ic-sm') + 'Trạng thái nhà cung cấp' + TH.up('F027.D')) + '<div class="card-bd">' + TH.kv([['Đã gửi', String(sent.filter(function (m) { return m.status === 'sent'; }).length)], ['Lỗi / bị trả về', String(sent.filter(function (m) { return m.status === 'failed'; }).length)], ['Bỏ qua (không đủ điều kiện)', String(sent.filter(function (m) { return m.status === 'skipped'; }).length)], ['Gửi lại có kiểm soát', 'Tối đa 2 lần / tin']]) + '</div></div>', { label: 'Thống kê gửi/lỗi/bị trả về và gửi lại', lines: 3 });
      var rules = TH.gate('F026.C', '<div class="card">' + TH.cardHd(I('sliders', 'ic-sm') + 'Cá nhân hóa theo tòa' + TH.up('F026.C')) + '<div class="card-bd small">' + TH.db.buildings.filter(function (b) { return TH.inScope(b.id); }).map(function (b) { return '<div class="u-mb-8"><b>' + esc(b.short) + ':</b> chữ ký “QL ' + esc(C.staffName(b.managerId)) + '”, số hotline tòa.</div>'; }).join('') + '</div></div>', { label: 'Quy tắc cá nhân hóa nội dung theo tòa', lines: 2 });
      var consent = TH.gate('F026.D', '<div class="card">' + TH.cardHd(I('history', 'ic-sm') + 'Phiên bản mẫu & lịch sử đồng ý' + TH.up('F026.D')) + '<div class="card-bd small"><ul class="timeline">' + TH.db.customers.filter(function (k) { return k.oaConsentAt; }).slice(0, 4).map(function (k) { return '<li>' + esc(k.name) + ' đồng ý nhận tin<div class="when">' + F.date(k.oaConsentAt) + '</div></li>'; }).join('') + '</ul></div></div>', { label: 'Quản lý phiên bản mẫu và lịch sử đồng ý', lines: 3 });

      return TH.pageHeader({ screen: S, status: TH.openBadge('D-05', 'DRAFT / CHỜ DUYỆT provider'), desc: 'Gửi hóa đơn và nhắc thanh toán qua Zalo OA. Bản demo <b>không gọi provider thật</b>; chỉ gửi tới người nhận đủ điều kiện (đã liên kết OA, hóa đơn đã xác nhận).',
          actions: '<a class="btn" href="' + TH.router.href('OA-02') + '">' + I('history', 'ic-sm') + 'Lịch sử gửi</a>' }) +
        '<div class="grid-main-side"><div class="stack"><div class="card card-flush">' + TH.cardHd(I('send', 'ic-sm') + 'Gửi thủ công · kỳ ' + F.period(p), sel.length + ' người nhận đã chọn',
          '<label class="sr-only" for="oa-tpl">Mẫu</label><select id="oa-tpl" class="select select-sm u-w-auto" data-ui="OA-01.tpl">' + allowedTpls.map(function (t) { return '<option value="' + t.id + '"' + (t.id === tpl.id ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + '</select>' +
          TH.permBtn('oa.send', '<button type="button" class="btn btn-sm btn-primary" data-act="oa.send"' + (sel.length ? '' : ' disabled') + '>' + I('send', 'ic-sm') + 'Gửi ' + (sel.length || '') + '</button>', '403')) + recipients + '</div>' + preview + '</div>' +
        '<div class="stack"><div class="card">' + TH.cardHd(I('message', 'ic-sm') + 'Kết nối OA', null, TH.simBadge()) + '<div class="card-bd">' + TH.kv([['OA', esc(oa.name)], ['Nhà cung cấp', esc(oa.provider) + ' ' + TH.openBadge('D-05')], ['Liên kết người nhận', TH.db.customers.filter(function (k) { return k.oaLinked; }).length + '/' + TH.db.customers.length + ' khách']]) + '</div></div>' +
        '<div class="card">' + TH.cardHd(I('fileCheck', 'ic-sm') + 'Mẫu tin', 'Gói A: 1–2 mẫu được duyệt') + '<div class="card-bd" style="padding-top:4px">' + tplRows + '</div></div>' + schedule + rules + stats + consent + '</div></div>';
    },
  };
  TH.act['oa.sel'] = function (el, ev) { if (ev) ev.stopPropagation(); var s = TH.has('F027.B') ? TH.store.ui('OA-01', 'sel', []).slice() : [], i = s.indexOf(el.dataset.id); if (i > -1) s.splice(i, 1); else s.push(el.dataset.id); TH.store.setUi('OA-01', 'sel', s); TH.app.refresh(); };
  TH.act['oa.send'] = function () {
    var ids = TH.store.ui('OA-01', 'sel', []), tpl = TH.store.ui('OA-01', 'tpl', 'TPL-01'), ok = 0, skip = [];
    if (!TH.can('oa.send') || (ids.length > 1 && !TH.requireFeature('F027.B'))) return;
    if (ids.some(function (id) { var i = C.invoice(id); return !i || !TH.inScope(i.buildingId); })) return;
    ids.forEach(function (id) { var r = TH.zaloSend(C.invoice(id), tpl); if (r === 'sent') ok++; else skip.push(id + ': ' + r); });
    TH.store.setUi('OA-01', 'sel', []); TH.app.refresh();
    TH.toast('Đã gửi ' + ok + ' tin (mô phỏng)', skip.length ? esc(skip.join('; ')) : 'Xem kết quả ở OA-02.', skip.length ? 'warning' : 'success');
  };

  /* ---------------- OA-02 ---------------- */
  TH.views['OA-02'] = {
    scan: function () { return [{ ui: { tab: 'log' } }, { ui: { tab: 'dead' } }]; },
    render: function () {
      var S = 'OA-02', q = TH.has('F028.B') ? TH.store.ui(S, 'q', '') : '', st = TH.store.ui(S, 'st', 'all');
      var tabs = [{ id: 'log', label: 'Nhật ký gửi' }, { id: 'dead', label: 'Tin lỗi cần xử lý', gate: 'F028.C', count: TH.db.messages.filter(function (m) { return m.status === 'failed' && m.retries >= 1; }).length }];
      var tab = TH.resolveTab(S, tabs);
      var all = TH.db.messages.filter(function (m) { var i = C.invoice(m.invoiceId); return i && TH.inScope(i.buildingId); }).slice().reverse();
      var rows = all.filter(function (m) { var i = C.invoice(m.invoiceId); return (st === 'all' || m.status === st) && TH.match(q, [m.invoiceId, i.roomId, C.customer(m.customerId).name]) && (tab === 'log' || (m.status === 'failed' && m.retries >= 1)); });
      var pg = TH.paginate(S, rows, 12);
      var table = TH.table({ label: 'Lịch sử Zalo', cols: [
        { key: 'i', label: 'Hóa đơn', render: function (m) { return '<a class="mono small" href="' + TH.router.href('INV-03', m.invoiceId) + '">' + m.invoiceId + '</a><div class="cell-sub">' + esc(tplName(m.template)) + '</div>'; } },
        { key: 'k', label: 'Người nhận', render: function (m) { return esc(C.customer(m.customerId).name); } },
        { kind: 'date', key: 't', label: 'Thời gian', render: function (m) { return F.date(m.at); } },
        { kind: 'status', key: 's', label: 'Kết quả gửi', render: function (m) { return TH.statusOf('message', m.status); } },
        { key: 'e', label: 'Lỗi / lý do', render: function (m) { return m.reason ? '<span class="small ' + (m.status === 'failed' ? 'neg' : 'muted') + '">' + esc(m.reason) + '</span>' : '<span class="muted">—</span>'; } },
        { key: 'r', label: 'Gửi lại', gate: 'F028.C', render: function (m) { return m.status === 'failed' ? (m.retries >= 2 ? TH.badge('Cần xử lý', 'danger') : TH.permBtn('oa.send', '<button type="button" class="btn btn-xs" data-act="oa.retry" data-id="' + m.id + '">' + I('refresh', 'ic-sm') + 'Thử gửi lại (' + m.retries + '/2)</button>', '403')) : '<span class="muted small">—</span>'; } },
      ], rows: pg.rows, empty: { title: 'Không có tin', text: 'Không có tin nhắn khớp bộ lọc.' } });
      var dash = TH.gate('F028.D', '<div class="grid-4 u-mb-16">' + ['sent', 'failed', 'skipped'].map(function (k) { return TH.kpi({ label: TH.statusLabel(k), value: String(all.filter(function (m) { return m.status === k; }).length) }); }).join('') + TH.kpi({ label: 'Tỷ lệ gửi thành công', value: F.pct(all.length ? all.filter(function (m) { return m.status === 'sent'; }).length / all.length : 0, 0), accent: true, foot: 'Dashboard hiệu quả theo kỳ ' + TH.up('F028.D') }) + '</div>', { label: 'Dashboard hiệu quả gửi theo kỳ', lines: 2 });
      return TH.pageHeader({ screen: S, status: TH.simBadge('Dữ liệu gửi mô phỏng'), actions: TH.exportBtn('oa2.csv', 'Tải nhật ký (.csv)') }) + dash +
        '<div class="card card-flush">' + TH.tabs(S, tabs, tab) + TH.tabPanel(S, tab, '<div class="toolbar">' + (TH.has('F028.B') ? TH.searchBox(S, 'Tìm theo hóa đơn, phòng, khách…') + TH.up('F028.B') : TH.gate('F028.B', '', { mode: 'btn', label: 'Tra cứu theo tòa/kỳ/khách', size: 'btn-sm' })) +
        TH.chips(S, 'st', [{ id: 'all', label: 'Tất cả', count: all.length }, { id: 'sent', label: 'Đã gửi' }, { id: 'failed', label: 'Lỗi gửi' }, { id: 'skipped', label: 'Bỏ qua' }], st) + '</div>' + table + TH.pager(S, pg)) + '</div>';
    },
  };
  TH.act['oa.retry'] = function (el) {
    var m = TH.db.messages.find(function (x) { return x.id === el.dataset.id; });
    m.retries++;
    var k = C.customer(m.customerId);
    if (k.oaLinked && m.retries === 1) { m.status = 'sent'; m.reason = 'Gửi lại thành công (retry ' + m.retries + ')'; }
    else m.reason = (m.reason || 'Lỗi') + ' · retry ' + m.retries;
    TH.log('Gửi lại tin Zalo', m.id, m.status, 'oa'); TH.app.refresh();
    TH.toast(m.status === 'sent' ? 'Gửi lại thành công' : 'Gửi lại vẫn lỗi', esc(m.reason), m.status === 'sent' ? 'success' : 'warning');
  };
  TH.act['oa2.csv'] = function () {
    var rows = TH.db.messages.filter(function (m) { return TH.inScope(C.invoice(m.invoiceId).buildingId); });
    TH.exportCsv('nhat_ky_zalo_' + TH.TODAY, ['Mã tin', 'Hóa đơn', 'Người nhận', 'Mẫu', 'Thời gian', 'Kết quả', 'Lý do'], rows.map(function (m) { return [m.id, m.invoiceId, C.customer(m.customerId).name, tplName(m.template), m.at, TH.statusLabel(m.status), m.reason]; }));
    TH.toast('Đã tải nhật ký', rows.length + ' dòng · .csv');
  };
})();
