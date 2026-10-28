/* Chủ nhà: OWN-01 (danh sách tóm tắt), OWN-02 (chi tiết theo tab), OWN-IMP (import theo mẫu). F001–F003, F013.
   CR-BLD-01 (note.md): trường theo mẫu HĐ thuê nhà, hợp đồng thuê tòa, hình ảnh sổ đỏ, sửa inline từng nhóm. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;

  function buildingsOf(ownerId) { return TH.db.buildings.filter(function (b) { return b.ownerId === ownerId; }); }
  function lastChange(o) {
    var a = TH.db.audit.find(function (x) { return x.kind === 'owner' && x.entity === o.id; });
    return a ? { at: a.at, by: a.by } : { at: o.createdAt, by: 'NV-001' };
  }
  function dupMatches(d, selfId) {
    var name = (d.name || '').trim().toLowerCase(), phone = (d.phone || '').replace(/\D/g, '');
    if (!name && !phone) return [];
    return TH.db.owners.filter(function (o) {
      if (o.id === selfId) return false;
      var on = o.name.toLowerCase(), last = name.split(' ').slice(-1)[0];
      var nameHit = name && (on === name || (last.length > 2 && on.split(' ').slice(-1)[0] === last && on.split(' ')[0] === name.split(' ')[0]));
      var phoneHit = phone.length >= 4 && o.phone.replace(/\D/g, '').slice(-3) === phone.slice(-3);
      return nameHit || phoneHit;
    }).map(function (o) { return { o: o, why: (name && o.name.toLowerCase() === name ? 'Trùng tên' : 'Tên/SĐT tương tự') }; });
  }
  function dupPanel(d, selfId) {
    var dups = dupMatches(d, selfId);
    return TH.gate('F001.B', '<div class="alert ' + (dups.length ? 'alert-warning' : 'alert-success') + '">' + I(dups.length ? 'alert' : 'checkCircle', 'ic-sm') + '<div class="alert-body"><b>Kiểm tra trùng tên/số liên hệ ' + TH.up('F001.B') + '</b>' +
      (dups.length ? dups.map(function (x) { return '<span>' + esc(x.why) + ': <a href="' + TH.router.href('OWN-02', x.o.id) + '" data-close>' + esc(x.o.id + ' · ' + x.o.name) + '</a> (' + esc(x.o.phone) + ')</span>'; }).join('') : '<span>Không phát hiện hồ sơ trùng.</span>') + '</div></div>', { label: 'Kiểm tra trùng tên/số liên hệ trước khi lưu', ghost: 'self' });
  }
  var digits = function (v) { return +String(v === null || v === undefined ? '' : v).replace(/[^\d]/g, '') || 0; };
  TH.digits = digits;
  function monthsBetween(a, b) { return (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5, 7) - +a.slice(5, 7)) + (+b.slice(8, 10) >= +a.slice(8, 10) - 1 ? 1 : 0); }

  /* ---------------- Hợp đồng thuê tòa (dùng chung OWN-02 & BLD-02) ---------------- */
  TH.leaseOf = function (bId) { return TH.db.leases.find(function (l) { return l.buildingId === bId && l.status === 'active'; }); };
  TH.leaseById = function (id) { return TH.db.leases.find(function (l) { return l.id === id; }); };
  function holdBadge(l) {
    if (l.status !== 'active') return TH.badge('Đã kết thúc', 'neutral');
    var d = C.daysTo(l.holdTo);
    if (d < 0) return TH.badge('Hết thời gian giữ giá', 'warning', { dot: true });
    return d <= 90 ? TH.badge('Còn ' + d + ' ngày giữ giá', 'warning', { dot: true }) : TH.badge('Đang giữ giá', 'success', { dot: true });
  }
  TH.SECTIONS.lease = {
    perm: 'lease.edit',
    title: function (id) { var l = TH.leaseById(id), b = C.building(l.buildingId); return I('contract', 'ic-sm') + 'Hợp đồng thuê tòa · ' + esc(b ? b.short : l.buildingId); },
    sub: function (id) { var l = TH.leaseById(id); return '<span class="mono">' + esc(l.id) + '</span> · ' + (l.status === 'active' ? 'đang hiệu lực' : 'đã kết thúc'); },
    readonly: function (id) { return TH.leaseById(id).status !== 'active'; },
    values: function (id) { var l = TH.leaseById(id); return { rent: l.rent, deposit: l.deposit, handover: l.handover, start: l.start, end: l.end, holdFrom: l.holdFrom, holdTo: l.holdTo, payCycle: l.payCycle, payTo: l.payTo, referrer: l.referrer, enteredBy: l.enteredBy, note: l.note }; },
    fields: function () {
      return [
        { name: 'rent', label: 'Giá thuê (đ/tháng)', num: true, inputmode: 'numeric', required: true, hint: 'Thuật ngữ đã chốt: giá thuê. Đơn vị theo HĐ: đồng/tháng.' },
        { name: 'deposit', label: 'Tiền đặt cọc (đ)', num: true, inputmode: 'numeric' },
        { name: 'handover', label: 'Ngày giao nhà', type: 'date' },
        { name: 'start', label: 'Thời hạn thuê từ ngày', type: 'date', required: true },
        { name: 'end', label: 'Đến ngày (kết thúc hợp đồng)', type: 'date', required: true },
        { name: 'holdFrom', label: 'Giữ giá từ ngày', type: 'date' },
        { name: 'holdTo', label: 'Giữ giá đến ngày', type: 'date' },
        { name: 'payCycle', label: 'Chu kỳ thanh toán', type: 'select', options: [{ id: '1', label: 'Hằng tháng' }, { id: '3', label: '03 tháng/lần' }, { id: '6', label: '06 tháng/lần' }, { id: '12', label: '12 tháng/lần' }] },
        { name: 'payTo', label: 'Hạn trả: từ ngày 01 đến ngày', num: true, inputmode: 'numeric', hint: 'Của tháng đầu mỗi kỳ (mẫu HĐ: 01–10)' },
        { name: 'referrer', label: 'Người giới thiệu nguồn nhà', hint: 'Người cung cấp/giới thiệu nguồn nhà — có thể ngoài công ty' },
        { name: 'enteredBy', label: 'Người nhập dữ liệu', type: 'select', options: TH.db.staff.filter(function (s) { return s.status === 'active' && (s.role === 'admin' || s.role === 'accountant' || s.role === 'manager'); }).map(function (s) { return { id: s.id, label: s.name + ' · ' + s.title }; }), hint: 'Tách riêng với người giới thiệu (ques.md §3)' },
        { name: 'note', label: 'Ghi chú', type: 'textarea', span: true },
      ];
    },
    validate: function (v) {
      if (digits(v.rent) <= 0) return 'Nhập giá thuê lớn hơn 0.';
      if (!v.start || !v.end || v.end <= v.start) return 'Ngày kết thúc HĐ phải sau ngày bắt đầu.';
      if (v.holdFrom && v.holdTo && v.holdTo < v.holdFrom) return 'Thời gian giữ giá: ngày kết thúc phải sau ngày bắt đầu.';
      var d = digits(v.payTo); if (d < 1 || d > 28) return 'Hạn trả trong khoảng ngày 01–28 của tháng đầu kỳ.';
      return null;
    },
    save: function (id, v, changed) {
      var l = TH.leaseById(id);
      Object.assign(l, { rent: digits(v.rent), deposit: digits(v.deposit), handover: v.handover, start: v.start, end: v.end, holdFrom: v.holdFrom, holdTo: v.holdTo, payCycle: +v.payCycle, payTo: digits(v.payTo), referrer: v.referrer, enteredBy: v.enteredBy, note: v.note });
      l.termMonths = monthsBetween(l.start, l.end);
      if (changed.length) l.versions.push({ v: l.versions.length + 1, at: TH.TODAY, by: TH.me().id, note: 'Sửa: ' + changed.map(function (k) { return LEASE_LABEL[k] || k; }).join(', ') });
      var b = C.building(l.buildingId);
      if (b && l.status === 'active') b.ownerRent = l.rent;
    },
    log: function (id) { var l = TH.leaseById(id); return ['Sửa HĐ thuê tòa', l.ownerId, l.id, 'owner', l.buildingId]; },
    view: function (id) {
      var l = TH.leaseById(id), b = C.building(l.buildingId), o = C.owner(l.ownerId);
      var left = C.daysTo(l.end);
      return '<div class="grid-2 sec-grid">' + TH.kv([
        ['Chủ nhà (bên cho thuê)', '<a href="' + TH.router.href('OWN-02', o.id) + '">' + esc(o.name) + '</a>'],
        ['Tòa', b ? '<a href="' + TH.router.href('BLD-02', b.id) + '">' + esc(b.name) + '</a>' : esc(l.buildingId)],
        ['Giá thuê', '<b>' + F.money(l.rent) + '</b>/tháng'],
        ['Tiền đặt cọc', F.money(l.deposit) + ' <span class="small muted">(' + (l.rent ? Math.round(l.deposit / l.rent * 10) / 10 : 0) + ' tháng)</span>'],
        ['Ngày giao nhà', F.date(l.handover)],
        ['Thời hạn', F.date(l.start) + ' → ' + F.date(l.end) + ' <span class="small muted">· ' + l.termMonths + ' tháng' + (l.status === 'active' ? ' · còn ' + Math.max(0, Math.round(left / 30.4)) + ' tháng' : '') + '</span>'],
      ]) + TH.kv([
        ['Thời gian giữ giá', F.date(l.holdFrom) + ' → ' + F.date(l.holdTo) + ' ' + holdBadge(l)],
        ['Thanh toán', (l.payCycle === 1 ? 'Hằng tháng' : 'Theo kỳ ' + String(l.payCycle).padStart(2, '0') + ' tháng/lần') + ', ngày ' + String(l.payFrom || 1).padStart(2, '0') + '–' + String(l.payTo).padStart(2, '0') + ' tháng đầu kỳ · <b>' + F.money(l.rent * l.payCycle) + '</b>/kỳ'],
        ['Người giới thiệu nguồn nhà', esc(l.referrer || '—')],
        ['Người nhập dữ liệu', esc(C.staffName(l.enteredBy)) + (l.enteredAt ? ' <span class="small muted">· ' + F.date(l.enteredAt) + '</span>' : '')],
        ['Ghi chú', esc(l.note || '—')],
        ['Bản hợp đồng', l.file ? TH.fileOf(l.file) : '—'],
      ]) + '</div>';
    },
  };
  var LEASE_LABEL = { rent: 'giá thuê', deposit: 'tiền cọc', handover: 'ngày giao nhà', start: 'ngày bắt đầu', end: 'ngày kết thúc', holdFrom: 'giữ giá từ', holdTo: 'giữ giá đến', payCycle: 'chu kỳ thanh toán', payTo: 'hạn trả', referrer: 'người giới thiệu', enteredBy: 'người nhập', note: 'ghi chú' };
  /* Card HĐ thuê + lịch sử phiên bản (F003.B) */
  TH.leaseBlock = function (l) {
    return TH.section('lease', l.id) +
      TH.gate('F003.B', '<div class="card u-mt-12">' + TH.cardHd(I('history', 'ic-sm') + 'Lịch sử hợp đồng · ' + esc(l.id) + TH.up('F003.B'), 'Mỗi lần lưu thay đổi tạo một phiên bản; không sửa lịch sử') + '<div class="card-bd"><ul class="timeline">' +
        l.versions.slice().reverse().map(function (v) { return '<li><b>v' + v.v + '</b> — ' + esc(v.note) + '<div class="when">' + esc(C.staffName(v.by)) + ' · ' + F.date(v.at) + '</div></li>'; }).join('') + '</ul></div></div>', { label: 'Lịch sử hợp đồng/chủ nhà của tòa', lines: 2 });
  };

  /* ---------------- Tài liệu (sổ đỏ, HĐ thuê, PCCC, ĐKKD) — F013 ---------------- */
  TH.DOC_KINDS = ['Sổ đỏ', 'HĐ thuê tòa', 'PCCC', 'ĐKKD', 'Khác'];
  TH.docTable = function (screen, docs, opts) {
    opts = opts || {};
    var q = TH.has('F013.B') ? TH.store.ui(screen, 'dq', '') : '';
    var rows = docs.filter(function (d) { return d.status !== 'archived' && TH.match(q, [d.kind, d.file, TH.buildingName(d.buildingId), d.leaseId || '']); });
    var search = TH.gate('F013.B', '<div class="input-wrap">' + I('search') + '<label class="sr-only" for="dq-' + screen + '">Tìm tài liệu</label><input id="dq-' + screen + '" class="input input-sm" type="search" placeholder="Tìm theo loại, tên tệp, tòa, số HĐ…" value="' + esc(q) + '" data-ui="' + screen + '.dq" autocomplete="off"></div>' + TH.up('F013.B'), { mode: 'btn', label: 'Tìm tài liệu theo hợp đồng/tòa', size: 'btn-sm' });
    return '<div class="card card-flush">' + TH.cardHd(I('folder', 'ic-sm') + (opts.title || 'Tài liệu đính kèm'), opts.sub || 'Lưu file gắn hồ sơ (F013.A) · tệp minh họa, không tải thật',
        TH.permBtn('master.edit', '<button type="button" class="btn btn-sm" data-act="bdoc.upload" data-b="' + esc(opts.buildingId || '') + '" data-owner="' + esc(opts.ownerId || '') + '" data-kind="' + esc(opts.kind || '') + '">' + I('upload', 'ic-sm') + 'Tải lên</button>', 'Tải lên · 403')) +
      '<div class="toolbar">' + search + '<span class="small muted tnum">' + rows.length + ' tài liệu</span></div>' +
      TH.table({ compact: true, label: 'Tài liệu', cols: [
        { key: 'k', label: 'Loại', render: function (d) { return TH.badge(d.kind, d.kind === 'Sổ đỏ' ? 'teal' : d.kind === 'PCCC' ? 'warning' : 'info'); } },
        { key: 'f', label: 'Tệp', render: function (d) { return TH.fileOf(d.file); } },
        { key: 'b', label: 'Tòa liên quan', render: function (d) { return d.buildingId ? '<a href="' + TH.router.href('BLD-02', d.buildingId) + '">' + esc(TH.buildingName(d.buildingId)) + '</a>' + (d.leaseId ? '<div class="cell-sub mono">' + esc(d.leaseId) + '</div>' : '') : '—'; } },
        { kind: 'date', key: 'u', label: 'Tải lên', render: function (d) { return F.date(d.uploadedAt) + '<div class="cell-sub">' + esc(C.staffName(d.by)) + '</div>'; } },
        { key: 'a', label: 'Quyền xem', gate: 'F013.C', render: function (d) { return '<span class="small">' + esc(d.access || 'Admin') + '</span>'; } },
        { key: 'v', label: 'Phiên bản', gate: 'F013.D', render: function (d) { return 'v' + (d.version || 1) + '<div class="cell-sub">' + (2 + (d.id.charCodeAt(d.id.length - 1) % 5)) + ' lượt xem</div>'; } },
      ], rows: rows, empty: { title: 'Chưa có tài liệu', text: q ? 'Không khớp “' + esc(q) + '”.' : 'Dùng “Tải lên” để đính kèm minh chứng.' } }) + '</div>';
  };
  /* Hình ảnh sổ đỏ — thể hiện rõ tòa tương ứng (note.md §2.1) */
  TH.redBookGallery = function (docs) {
    var imgs = docs.filter(function (d) { return d.kind === 'Sổ đỏ'; });
    if (!imgs.length) return '<div class="small muted">Chưa có hình ảnh sổ đỏ.</div>';
    return '<div class="doc-thumbs">' + imgs.map(function (d) {
      var b = C.building(d.buildingId), g = b && b.gcn;
      return '<figure class="doc-thumb"><div class="doc-thumb-img" aria-hidden="true">' + I('fileScan') + '<span>' + esc(d.file.split('.').pop().toUpperCase()) + '</span></div><figcaption><b>' + esc(b ? b.short : '—') + '</b><span class="small muted">' + esc(d.file) + '</span>' + (g ? '<span class="small">GCN ' + esc(g.no) + ' · ' + esc(g.issuer) + ' · ' + F.date(g.date) + '</span>' : '') + '</figcaption></figure>';
    }).join('') + '</div>';
  };
  function docForm() {
    var form = 'bdoc-up', o = TH.store.draft(form, '_owner', ''), b = TH.store.draft(form, '_b', '');
    var bs = o ? buildingsOf(o) : TH.db.buildings.filter(function (x) { return TH.inScope(x.id); });
    return {
      title: 'Tải lên tài liệu', sub: 'F013.A · Lưu file gắn hồ sơ chủ nhà/tòa (mô phỏng, không tải tệp thật)',
      body: '<div class="stack"><div class="form-grid">' +
        TH.field({ form: form, name: 'kind', label: 'Loại tài liệu', type: 'select', def: TH.store.draft(form, '_kind', '') || 'Sổ đỏ', options: TH.DOC_KINDS }) +
        TH.field({ form: form, name: 'b', label: 'Tòa liên quan', type: 'select', def: b || (bs[0] && bs[0].id) || '', options: bs.map(function (x) { return { id: x.id, label: x.name }; }) }) +
        '</div><div class="dropzone" style="padding:20px">' + I('upload') + '<div><b>Kéo thả hoặc chọn tệp</b><div class="small muted">Ảnh JPG/PNG hoặc PDF · mô phỏng</div></div></div></div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="bdoc.save">' + I('check', 'ic-sm') + 'Lưu tài liệu</button>',
    };
  }
  TH.act['bdoc.upload'] = function (el) {
    TH.store.clearDraft('bdoc-up');
    TH.store.setDraft('bdoc-up', '_owner', el.dataset.owner || ''); TH.store.setDraft('bdoc-up', '_b', el.dataset.b || ''); TH.store.setDraft('bdoc-up', '_kind', el.dataset.kind || '');
    TH.modal.open({ key: 'bdoc', size: 'sm', render: docForm });
  };
  TH.act['bdoc.save'] = function () {
    var form = 'bdoc-up', kind = TH.store.draft(form, 'kind', TH.store.draft(form, '_kind', '') || 'Sổ đỏ');
    var bs = TH.store.draft(form, '_owner', '') ? buildingsOf(TH.store.draft(form, '_owner', '')) : TH.db.buildings;
    var bId = TH.store.draft(form, 'b', TH.store.draft(form, '_b', '') || (bs[0] && bs[0].id)), b = C.building(bId);
    if (!TH.formErrors(form, b ? {} : { b: 'Chọn tòa liên quan cho tài liệu.' })) { TH.modal.rerenderAll(); return; }
    var n = TH.db.bldDocs.length + 1;
    var slug = { 'Sổ đỏ': 'so_do', 'HĐ thuê tòa': 'HDT', PCCC: 'PCCC', 'ĐKKD': 'DKKD', 'Khác': 'tai_lieu' }[kind] || 'tai_lieu';
    var lease = TH.leaseOf(bId);
    var doc = { id: TH.recordActions.id('TLT'), ownerId: b.ownerId, buildingId: bId, leaseId: kind === 'HĐ thuê tòa' && lease ? lease.id : null, kind: kind, file: slug + '_' + bId.slice(3) + '_' + TH.TODAY.replace(/-/g, '') + (kind === 'Sổ đỏ' ? '.jpg' : '.pdf'), uploadedAt: TH.TODAY, by: TH.me().id, version: 1, access: 'Admin, Kế toán' };
    TH.db.bldDocs.push(doc);
    if (kind === 'PCCC') { b.fire.file = doc.file; }
    if (kind === 'ĐKKD') { b.bizReg.file = doc.file; }
    TH.log('Tải lên tài liệu', b.ownerId, kind + ' · ' + b.short, 'owner', bId);
    TH.store.clearDraft(form); TH.modal.close('bdoc', { silent: true }); TH.app.refresh();
    TH.toast('Đã lưu tài liệu', esc(kind + ' · ' + b.short + ' · ' + doc.file));
  };

  /* ---------------- OWN-01 · danh sách tóm tắt ---------------- */
  TH.views['OWN-01'] = {
    render: function () {
      var S = 'OWN-01', q = TH.store.ui(S, 'q', ''), st = TH.store.ui(S, 'status', 'all');
      var all = TH.db.owners.filter(function (o) { return TH.store.state.role !== 'manager' || buildingsOf(o.id).some(function (b) { return TH.inScope(b.id); }); });
      var rows = all.filter(function (o) { return (st === 'all' || o.status === st) && TH.match(q, [o.id, o.name, o.phone, o.email]); });
      var pg = TH.paginate(S, rows, 10);
      var table = TH.table({
        label: 'Danh sách chủ nhà',
        cols: [
          { key: 'id', label: 'Mã chủ nhà', render: function (o) { return '<span class="mono">' + o.id + '</span>'; } },
          { key: 'name', label: 'Họ tên', render: function (o) { return '<div class="cell-main"><a href="' + TH.router.href('OWN-02', o.id) + '">' + esc(o.name) + '</a></div>' + (o.kind === 'org' ? '<div class="cell-sub">Pháp nhân</div>' : ''); } },
          { key: 'phone', label: 'Liên hệ', render: function (o) { return esc(o.phone) + '<div class="cell-sub">' + esc(o.email) + '</div>'; } },
          { key: 'b', label: 'Số tòa liên quan', num: true, render: function (o) { var n = buildingsOf(o.id).length; return n ? '<b>' + n + '</b>' : '<span class="muted">0</span>'; } },
          { kind: 'status', key: 'status', label: 'Trạng thái', render: function (o) { return TH.status(o.status); } },
          { kind: 'date', key: 'chg', label: 'Sửa/đổi liên kết gần nhất', gate: 'F001.C', render: function (o) { var c = lastChange(o); return F.date(c.at) + '<div class="cell-sub">' + esc(C.staffName(c.by)) + '</div>'; } },
          { key: 'ver', label: 'Hiệu lực · phiên bản', gate: 'F001.D', render: function (o) { return 'Từ ' + F.date(o.createdAt) + '<div class="cell-sub">v' + (1 + TH.db.audit.filter(function (a) { return a.kind === 'owner' && a.entity === o.id; }).length) + '</div>'; } },
          { key: 'go', label: '', render: function (o) { return '<a class="btn btn-sm btn-ghost" href="' + TH.router.href('OWN-02', o.id) + '">Xem chi tiết' + I('chevronRight', 'ic-sm') + '</a>'; } },
        ],
        rows: pg.rows,
        rowAttrs: function (o) { return 'class="is-clickable" data-href="' + TH.router.href('OWN-02', o.id) + '" tabindex="0"'; },
        empty: { title: 'Không có chủ nhà phù hợp', text: q ? 'Không có kết quả cho “' + esc(q) + '”.' : 'Thêm chủ nhà hoặc import từ Excel mẫu.' },
      });
      var counts = { all: all.length, active: all.filter(function (o) { return o.status === 'active'; }).length, inactive: all.filter(function (o) { return o.status === 'inactive'; }).length };
      var actions = TH.gate('F002.B', '<button type="button" class="btn" data-act="imp.open" data-screen="OWN-IMP">' + I('upload', 'ic-sm') + 'Nhập từ Excel</button>', { mode: 'btn' }) +
        TH.permBtn('master.edit', '<button type="button" class="btn btn-primary" data-act="own.add">' + I('plus', 'ic-sm') + 'Thêm chủ nhà</button>', 'Thêm · 403');
      var recon = TH.gate('F003.D', '<div class="card">' + TH.cardHd(I('compare', 'ic-sm') + 'Đối chiếu chủ nhà theo kỳ' + TH.up('F003.D'), 'Liên kết tòa hiệu lực ↔ chi phí trả chủ nhà kỳ ' + F.period(TH.store.state.period)) +
        TH.table({ compact: true, cols: [
          { key: 'b', label: 'Tòa', render: function (b) { return esc(b.short); } },
          { key: 'o', label: 'Chủ hiệu lực', render: function (b) { return esc(C.owner(b.ownerId).name); } },
          { kind: 'money', key: 'r', label: 'Giá thuê theo hợp đồng', num: true, render: function (b) { return F.money(b.ownerRent); } },
          { kind: 'money', key: 'e', label: 'Chi phí ghi nhận', num: true, render: function (b) { return F.money(C.sum(TH.db.expenses.filter(function (e) { return e.buildingId === b.id && e.period === TH.store.state.period && e.category === 'owner_rent'; }), function (e) { return e.amount; })); } },
          { kind: 'status', key: 's', label: 'Khớp', render: function (b) { var e = TH.db.expenses.find(function (x) { return x.buildingId === b.id && x.period === TH.store.state.period && x.category === 'owner_rent'; }); return e ? (e.amount === b.ownerRent ? TH.badge('Khớp', 'success') : TH.badge('Lệch', 'danger')) + ' ' + TH.status(e.status) : TH.badge('Chưa ghi', 'warning'); } },
        ], rows: TH.db.buildings.filter(function (b) { return TH.inScope(b.id); }) }) + '</div>', { label: 'Nhật ký/đối chiếu theo kỳ', lines: 4 });

      return TH.pageHeader({ screen: S, actions: actions, desc: 'Danh sách chỉ hiện thông tin chính để nhận diện và chọn hồ sơ. Nhấn tên hoặc “Xem chi tiết” để mở đầy đủ: thông tin chung, hợp đồng thuê, tòa liên quan, tài liệu.' }) +
        '<div class="card card-flush u-mb-16"><div class="toolbar">' + TH.searchBox(S, 'Tìm mã, tên, liên hệ…') + TH.chips(S, 'status', [{ id: 'all', label: 'Tất cả', count: counts.all }, { id: 'active', label: 'Đang hoạt động', count: counts.active }, { id: 'inactive', label: 'Ngừng hoạt động', count: counts.inactive }], st) + '</div>' + table + TH.pager(S, pg) + '</div>' + recon;
    },
    dialogs: [function () { return ownerForm('new'); }],
  };

  /* Form thêm chủ nhà (modal) — sửa chủ nhà đã có làm tại tab Thông tin chung */
  function ownerForm(id) {
    var form = 'own-' + id, o = id === 'new' ? null : C.owner(id);
    var d = { name: TH.store.draft(form, 'name', o ? o.name : ''), phone: TH.store.draft(form, 'phone', o ? o.phone : '') };
    var err = TH.store.draft(form, '_err', '');
    return {
      title: (o ? 'Sửa chủ nhà ' + esc(o.id) : 'Thêm chủ nhà') + ' <span class="screen-id">OWN-01</span>',
      sub: 'Trường theo mẫu HĐ thuê nhà (Bên cho thuê) · bắt buộc chờ Data Dictionary (D-01)',
      body: '<div class="stack">' + (err ? '<div class="alert alert-danger">' + I('xCircle', 'ic-sm') + '<div class="alert-body">' + esc(err) + '</div></div>' : '') +
        '<div class="form-grid">' +
        TH.field({ form: form, name: 'id', label: 'Mã chủ nhà', def: o ? o.id : TH.recordActions.id('CN'), readonly: true, hint: 'Sinh tự động' }) +
        TH.field({ form: form, name: 'kind', label: 'Loại', type: 'select', def: o ? o.kind : 'person', options: [{ id: 'person', label: 'Cá nhân' }, { id: 'org', label: 'Pháp nhân' }] }) +
        TH.field({ form: form, name: 'name', label: 'Họ tên / tên pháp nhân', def: o ? o.name : '', required: true, invalid: err && !d.name, live: true }) +
        TH.field({ form: form, name: 'phone', label: 'Số điện thoại', def: o ? o.phone : '', required: true, placeholder: '09xx xxx xxx', live: true }) +
        TH.field({ form: form, name: 'idNo', label: 'CCCD số', def: '', hint: 'Lưu dạng mask, ví dụ 0010••••6218' }) +
        TH.field({ form: form, name: 'idDate', label: 'Ngày cấp', type: 'date', def: '' }) +
        TH.field({ form: form, name: 'email', label: 'Email', def: '' }) +
        TH.field({ form: form, name: 'taxCode', label: 'Mã số thuế', def: '' }) +
        TH.field({ form: form, name: 'permAddress', label: 'Hộ khẩu thường trú', def: '', span: true }) +
        TH.field({ form: form, name: 'note', label: 'Ghi chú', type: 'textarea', def: '', span: true }) +
        TH.gate('F001.D', TH.field({ form: form, name: 'from', label: 'Kỳ hiệu lực từ', type: 'month', def: TH.store.state.period, labelExtra: TH.up('F001.D'), hint: 'Lưu thành phiên bản mới, giữ phiên bản cũ.' }), { mode: 'block', ghost: 'self', label: 'Nhập liệu theo kỳ hiệu lực' }) +
        '</div>' + dupPanel(d, o && o.id) + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="own.save" data-id="' + id + '">' + I('check', 'ic-sm') + 'Lưu</button>',
    };
  }
  TH.act['own.add'] = function () { TH.modal.open({ key: 'own-form', size: 'md', render: function () { return ownerForm('new'); } }); };
  TH.act['own.save'] = function (el) {
    var form = 'own-new';
    var g = function (k, def) { return TH.store.draft(form, k, def); };
    var name = (g('name', '') || '').trim(), phone = (g('phone', '') || '').trim();
    if (!name || !phone) { TH.store.setDraft(form, '_err', 'Nhập đủ họ tên và số điện thoại.'); TH.app.refresh(); return; }
    var addr = g('permAddress', '') || '—';
    var o = { id: g('id', TH.recordActions.id('CN')), kind: g('kind', 'person'), name: name, phone: phone, email: g('email', '') || '—', address: addr, permAddress: addr, idNo: g('idNo', ''), idDate: g('idDate', ''), idPlace: '', taxCode: g('taxCode', '') || '—', bank: { no: '', name: '', holder: '' }, status: 'active', note: g('note', ''), createdAt: TH.TODAY };
    if (TH.db.owners.some(function (x) { return x.id === o.id; })) { TH.toast('Mã chủ nhà đã tồn tại', 'Chọn mã duy nhất trước khi lưu.', 'danger'); return; }
    TH.db.owners.push(o); TH.log('Thêm chủ nhà', o.id, o.name, 'owner');
    TH.store.clearDraft(form);
    TH.modal.close('own-form', { silent: true });
    TH.app.refresh();
    TH.toast('Đã thêm chủ nhà', esc(o.id + ' · ' + o.name) + ' · <a href="' + TH.router.href('OWN-02', o.id) + '">Mở chi tiết</a>');
  };

  /* Nhóm "Thông tin chung" của chủ nhà — theo mẫu HĐ (Bên A: họ tên, CCCD, ngày/nơi cấp, điện thoại, hộ khẩu thường trú) + STK nhận tiền */
  TH.SECTIONS.ownInfo = {
    perm: 'lease.edit',
    title: 'Thông tin chung',
    sub: 'Theo mẫu “Hợp đồng thuê nhà 2026” — Bên cho thuê (Bên A)',
    values: function (id) { var o = C.owner(id); return { kind: o.kind || 'person', name: o.name, rep: o.rep || '', idNo: o.idNo || '', idDate: o.idDate || '', idPlace: o.idPlace || '', phone: o.phone, email: o.email, permAddress: o.permAddress || '', address: o.address, taxCode: o.taxCode, bankNo: (o.bank || {}).no || '', bankName: (o.bank || {}).name || '', bankHolder: (o.bank || {}).holder || '', status: o.status, note: o.note }; },
    fields: function (id) {
      var form = TH.secForm('ownInfo', id), v = this.values(id);
      return [
        { name: 'kind', label: 'Loại', type: 'select', options: [{ id: 'person', label: 'Cá nhân' }, { id: 'org', label: 'Pháp nhân' }] },
        { name: 'status', label: 'Trạng thái', type: 'select', options: [{ id: 'active', label: 'Đang hoạt động' }, { id: 'inactive', label: 'Ngừng hoạt động' }] },
        { name: 'name', label: 'Họ tên / tên pháp nhân', required: true, live: true },
        { name: 'rep', label: 'Người đại diện (pháp nhân)', hint: 'Bỏ trống nếu là cá nhân' },
        { name: 'idNo', label: 'CCCD số', hint: 'Hiển thị dạng mask (D-01)' },
        { name: 'idDate', label: 'Ngày cấp', type: 'date' },
        { name: 'idPlace', label: 'Nơi cấp' },
        { name: 'phone', label: 'Điện thoại', required: true, live: true },
        { name: 'email', label: 'Email' },
        { name: 'taxCode', label: 'Mã số thuế' },
        { name: 'permAddress', label: 'Hộ khẩu thường trú', span: true },
        { name: 'address', label: 'Địa chỉ liên hệ', span: true },
        { name: 'bankNo', label: 'Số tài khoản nhận tiền thuê', hint: 'Lưu dạng mask' },
        { name: 'bankName', label: 'Ngân hàng' },
        { name: 'bankHolder', label: 'Chủ tài khoản', span: true },
        { name: 'note', label: 'Ghi chú', type: 'textarea', span: true },
        { html: '<div class="span-2">' + dupPanel({ name: TH.store.draft(form, 'name', v.name), phone: TH.store.draft(form, 'phone', v.phone) }, id) + '</div>' },
        { html: TH.gate('F001.D', TH.field({ form: form, name: '_from', label: 'Kỳ hiệu lực từ', type: 'month', def: TH.store.state.period, labelExtra: TH.up('F001.D'), hint: 'Lưu thành phiên bản mới, giữ phiên bản cũ.' }), { mode: 'block', ghost: 'self', label: 'Nhập liệu theo kỳ hiệu lực' }) },
      ];
    },
    validate: function (v) { return !v.name || !v.phone ? 'Nhập đủ họ tên và số điện thoại.' : null; },
    save: function (id, v) {
      var o = C.owner(id);
      Object.assign(o, { kind: v.kind, name: v.name, rep: v.rep, idNo: v.idNo, idDate: v.idDate, idPlace: v.idPlace, phone: v.phone, email: v.email || '—', permAddress: v.permAddress, address: v.address || '—', taxCode: v.taxCode || '—', status: v.status, note: v.note, bank: { no: v.bankNo, name: v.bankName, holder: v.bankHolder } });
    },
    log: function (id) { return ['Sửa chủ nhà', id, 'Thông tin chung', 'owner']; },
    view: function (id, v) {
      return '<div class="grid-2 sec-grid">' + TH.kv([
        ['Mã chủ nhà', '<span class="mono">' + esc(id) + '</span> · ' + (v.kind === 'org' ? 'Pháp nhân' : 'Cá nhân')],
        ['Họ tên', '<b>' + esc(v.name) + '</b>'],
      ].concat(v.kind === 'org' ? [['Người đại diện', esc(v.rep || '—')]] : []).concat([
        ['CCCD số', '<span class="mono">' + esc(v.idNo || '—') + '</span>'],
        ['Ngày cấp · nơi cấp', F.date(v.idDate) + (v.idPlace ? ' · ' + esc(v.idPlace) : '')],
        ['Hộ khẩu thường trú', esc(v.permAddress || '—')],
        ['Mã số thuế', esc(v.taxCode)],
      ])) + TH.kv([
        ['Điện thoại', esc(v.phone)],
        ['Email', esc(v.email)],
        ['Địa chỉ liên hệ', esc(v.address)],
        ['Tài khoản nhận tiền', v.bankNo ? '<span class="mono">' + esc(v.bankNo) + '</span> · ' + esc(v.bankName) + '<div class="small muted">' + esc(v.bankHolder) + '</div>' : '—'],
        ['Trạng thái', TH.status(v.status)],
        ['Ghi chú', esc(v.note || '—')],
      ]) + '</div>';
    },
  };

  /* ---------------- OWN-02 · chi tiết theo tab ---------------- */
  TH.views['OWN-02'] = {
    scanParam: 'CN-001',
    scan: function () { return ['info', 'lease', 'bld', 'docs', 'linkHist', 'audit', 'versions'].map(function (t) { return { ui: { tab: t }, param: 'CN-001' }; }); },
    render: function (r) {
      var o = C.owner(r.param || 'CN-001');
      if (!o) return TH.pageHeader({ screen: 'OWN-02' }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy chủ nhà', text: 'Mã “' + esc(r.param) + '” không có trong dữ liệu.' }) + '</div>';
      var S = 'OWN-02', bs = buildingsOf(o.id);
      var leases = TH.db.leases.filter(function (l) { return l.ownerId === o.id; }).sort(function (a, b) { return a.status === b.status ? (a.start < b.start ? 1 : -1) : a.status === 'active' ? -1 : 1; });
      var docs = TH.db.bldDocs.filter(function (d) { return d.ownerId === o.id; });
      var tabs = [
        { id: 'info', label: 'Thông tin chung', icon: 'user' },
        { id: 'lease', label: 'Hợp đồng thuê tòa', icon: 'contract', count: leases.length },
        { id: 'bld', label: 'Tòa nhà liên quan', icon: 'building', count: bs.length },
        { id: 'docs', label: 'Tài liệu', icon: 'folder', count: docs.length },
        { id: 'linkHist', label: 'Lịch sử chủ nhà của tòa', gate: 'F003.B' },
        { id: 'audit', label: 'Lịch sử thay đổi', gate: 'F001.C' },
        { id: 'versions', label: 'Phiên bản', gate: 'F001.D' },
      ];
      var tab = TH.resolveTab(S, tabs);
      var body;
      if (tab === 'info') {
        body = TH.section('ownInfo', o.id);
      } else if (tab === 'lease') {
        body = leases.length ? '<div class="stack">' + leases.map(TH.leaseBlock).join('') + '</div>' :
          '<div class="card">' + TH.state('empty', { title: 'Chưa có hợp đồng thuê tòa', text: 'Gắn tòa cho chủ nhà để tạo hợp đồng thuê, sau đó cập nhật điều khoản theo mẫu.' }) + '</div>';
      } else if (tab === 'bld') {
        body = '<div class="card card-flush">' + TH.cardHd(I('building', 'ic-sm') + 'Tòa nhà liên quan', 'Gói A: 1 chủ nhà chính / tòa · nhấn để mở chi tiết tòa') +
          TH.table({ cols: [
            { key: 'n', label: 'Tòa', render: function (b) { return '<a href="' + TH.router.href('BLD-02', b.id) + '"><b>' + esc(b.name) + '</b></a><div class="cell-sub">' + esc(b.address) + '</div>'; } },
            { key: 'role', label: 'Vai trò', render: function (b) { var l = TH.db.ownerLinks.find(function (x) { return x.buildingId === b.id && x.ownerId === o.id && !x.to; }); return TH.badge(l ? l.role : 'Chủ sở hữu', 'teal'); } },
            { key: 'hd', label: 'Hợp đồng thuê', render: function (b) { var l = TH.leaseOf(b.id); return l ? '<span class="mono small">' + esc(l.id) + '</span><div class="cell-sub">đến ' + F.date(l.end) + '</div>' : '<span class="muted">—</span>'; } },
            { kind: 'money', key: 'rent', label: 'Giá thuê/tháng', num: true, render: function (b) { return F.money(b.ownerRent); } },
            { key: 'r', label: 'Số phòng', num: true, render: function (b) { return TH.db.rooms.filter(function (x) { return x.buildingId === b.id; }).length; } },
            { key: 'go', label: '', render: function (b) { return '<a class="btn btn-sm btn-ghost" href="' + TH.router.href('BLD-02', b.id) + '">Mở tòa' + I('chevronRight', 'ic-sm') + '</a>'; } },
          ], rows: bs, rowAttrs: function (b) { return 'class="is-clickable" tabindex="0" data-href="' + TH.router.href('BLD-02', b.id) + '"'; }, empty: { title: 'Chưa gắn tòa', text: 'Dùng “Gắn tòa” để liên kết.' } }) + '</div>';
      } else if (tab === 'docs') {
        body = '<div class="card u-mb-16">' + TH.cardHd(I('fileScan', 'ic-sm') + 'Hình ảnh sổ đỏ', 'Ảnh GCN quyền sở hữu nhà ở và QSDĐ — thể hiện tòa tương ứng') + '<div class="card-bd">' + TH.redBookGallery(docs) + '</div></div>' +
          TH.docTable(S, docs, { ownerId: o.id, title: 'Tài liệu hồ sơ & hợp đồng', sub: 'Sổ đỏ, HĐ thuê tòa, PCCC, ĐKKD của các tòa liên quan' });
      } else if (tab === 'linkHist') {
        var links = TH.db.ownerLinks.filter(function (l) { return l.ownerId === o.id || bs.some(function (b) { return b.id === l.buildingId; }); });
        body = '<div class="card">' + TH.cardHd('Lịch sử chủ nhà của tòa' + TH.up('F003.B'), 'Đổi liên kết không sửa lịch sử') + TH.table({ cols: [
          { key: 'b', label: 'Tòa', render: function (l) { return esc(TH.buildingName(l.buildingId)); } },
          { key: 'o', label: 'Chủ nhà', render: function (l) { return esc(C.owner(l.ownerId).name); } },
          { key: 'r', label: 'Vai trò', render: function (l) { return esc(l.role); } },
          { kind: 'date', key: 'f', label: 'Từ', render: function (l) { return F.date(l.from); } },
          { key: 't', label: 'Đến', render: function (l) { return l.to ? F.date(l.to) : TH.badge('Hiện tại', 'success'); } },
        ], rows: links }) + TH.gate('F003.D', '<div class="card-ft"><span class="small">' + TH.tierPill('D') + ' Quan hệ theo thời gian được dùng để đối chiếu chi phí trả chủ nhà trên báo cáo từng kỳ (xem OWN-01 › Đối chiếu).</span></div>', { mode: 'block', label: 'Quan hệ theo thời gian và đối chiếu báo cáo', lines: 1 }) + '</div>';
      } else if (tab === 'audit') {
        var au = TH.db.audit.filter(function (a) { return a.entity === o.id; });
        body = '<div class="card"><div class="card-hd"><div class="card-title">Lịch sử thay đổi ' + TH.up('F001.C') + '</div><span class="small muted">Chỉ người có quyền theo tòa được xem</span></div><div class="card-bd"><ul class="timeline">' +
          au.map(function (a) { return '<li><b>' + esc(a.action) + '</b> — ' + esc(a.detail) + '<div class="when">' + esc(C.staffName(a.by)) + ' · ' + F.date(a.at) + '</div></li>'; }).join('') +
          '<li><b>Tạo hồ sơ</b><div class="when">' + esc(C.staffName('NV-001')) + ' · ' + F.date(o.createdAt) + '</div></li></ul></div></div>';
      } else {
        body = '<div class="card"><div class="card-hd"><div class="card-title">Phiên bản theo kỳ hiệu lực ' + TH.up('F001.D') + '</div></div>' + TH.table({ cols: [
          { kind: 'date', key: 'v', label: 'Phiên bản', render: function (v) { return '<b>v' + v.v + '</b>'; } }, { key: 'f', label: 'Hiệu lực từ', render: function (v) { return F.date(v.from); } }, { key: 'c', label: 'Nội dung', render: function (v) { return esc(v.note); } }, { key: 's', label: '', render: function (v) { return v.cur ? TH.badge('Đang áp dụng', 'success') : TH.badge('Lưu trữ', 'neutral'); } },
        ], rows: [{ v: 2, from: '2026-01-01', note: 'Cập nhật địa chỉ liên hệ & mã số thuế', cur: true }, { v: 1, from: o.createdAt, note: 'Bản khởi tạo', cur: false }] }) + '</div>';
      }
      var actions = TH.permBtn('master.edit', '<button type="button" class="btn" data-act="own.link" data-id="' + o.id + '">' + I('link', 'ic-sm') + 'Gắn tòa</button>', 'Gắn tòa · 403') +
        (o.status === 'active' ? TH.permBtn('master.edit', '<button type="button" class="btn btn-danger" data-act="own.disable" data-id="' + o.id + '">' + I('ban', 'ic-sm') + 'Vô hiệu</button>', 'Vô hiệu · 403') : '');
      return TH.pageHeader({ screen: S, title: o.name, crumbs: [['Chủ nhà', TH.router.href('OWN-01')], [o.id]], status: TH.status(o.status), actions: actions,
          facts: TH.detailFacts([['Mã chủ nhà', '<span class="mono">' + esc(o.id) + '</span>'], ['Loại', o.kind === 'org' ? 'Tổ chức' : 'Cá nhân'], ['Điện thoại', esc(o.phone || '—')], ['Số tòa', String(TH.db.buildings.filter(function (x) { return x.ownerId === o.id; }).length)]]) }) +
        '<div class="card tab-card u-mb-16">' + TH.tabs(S, tabs, tab) + '</div>' + TH.tabPanel(S, tab, body);
    },
    dialogs: [function () { return linkForm('CN-001'); }],
  };
  function linkForm(ownerId) {
    var form = 'own-link-' + ownerId, bId = TH.store.draft(form, 'b', 'TH-DD');
    var b = C.building(bId), cur = b && C.owner(b.ownerId);
    return {
      title: 'Gắn tòa cho ' + esc(C.owner(ownerId).name), sub: 'OWN-02 · Gắn chủ nhà với tòa (F003)',
      body: '<div class="stack">' + TH.field({ form: form, name: 'b', label: 'Tòa', type: 'select', def: 'TH-DD', options: TH.db.buildings.map(function (x) { return { id: x.id, label: x.name }; }) }) +
        TH.field({ form: form, name: 'from', label: 'Ngày hiệu lực', type: 'date', def: TH.TODAY }) +
        TH.gate('F003.C', TH.field({ form: form, name: 'role', label: 'Vai trò', type: 'select', def: 'Chủ sở hữu', options: ['Chủ sở hữu', 'Đại diện ủy quyền', 'Đồng sở hữu'], labelExtra: TH.up('F003.C') + ' ' + TH.openBadge('', 'nếu chốt') }), { ghost: 'self', label: 'Nhiều vai trò sở hữu/đại diện' }) +
        (cur && cur.id !== ownerId ? '<div class="alert alert-warning">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Tòa đang có chủ chính: ' + esc(cur.name) + '.</b><span>Gói A cho phép 1 chủ nhà chính/tòa. Đổi liên kết đóng liên kết và hợp đồng thuê cũ tại ngày hiệu lực, tạo hợp đồng mới để cập nhật điều khoản — <b>không sửa lịch sử</b>.</span></div></div>' : '') + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="own.link.save" data-id="' + ownerId + '">Lưu liên kết</button>',
    };
  }
  TH.act['own.link'] = function (el) { var id = el.dataset.id; TH.modal.open({ key: 'own-link', size: 'sm', render: function () { return linkForm(id); } }); };
  TH.act['own.link.save'] = function (el) {
    var id = el.dataset.id, form = 'own-link-' + id, bId = TH.store.draft(form, 'b', 'TH-DD'), from = TH.store.draft(form, 'from', TH.TODAY);
    var b = C.building(bId);
    if (b.ownerId === id) { TH.toast('Không có thay đổi', 'Tòa đã gắn với chủ nhà này.', 'info'); TH.modal.close('own-link', { silent: true }); return; }
    TH.db.ownerLinks.forEach(function (l) { if (l.buildingId === bId && !l.to) l.to = TH.addDays(from, -1); });
    TH.db.ownerLinks.push({ buildingId: bId, ownerId: id, role: TH.has('F003.C') ? TH.store.draft(form, 'role', 'Chủ sở hữu') : 'Chủ sở hữu', from: from, to: null });
    var old = TH.leaseOf(bId);
    if (old) { old.status = 'ended'; old.end = TH.addDays(from, -1); old.versions.push({ v: old.versions.length + 1, at: TH.TODAY, by: TH.me().id, note: 'Kết thúc do đổi chủ nhà' }); }
    TH.db.leases.push({ id: 'HĐT-' + bId.slice(3) + '-' + from.slice(0, 4) + (old && old.id.slice(-4) === from.slice(0, 4) ? 'b' : ''), buildingId: bId, ownerId: id, rent: b.ownerRent, deposit: b.ownerRent, handover: from, start: from, end: TH.addDays(from.slice(0, 4) * 1 + 5 + from.slice(4), -1), termMonths: 60, holdFrom: from, holdTo: from, payCycle: old ? old.payCycle : 3, payFrom: 1, payTo: 10, referrer: '', enteredBy: TH.me().id, enteredAt: TH.TODAY, note: 'Tạo khi đổi chủ nhà — cập nhật điều khoản theo HĐ mới.', file: null, status: 'active', versions: [{ v: 1, at: TH.TODAY, by: TH.me().id, note: 'Tạo khi đổi chủ nhà (kế thừa giá thuê)' }] });
    b.ownerId = id;
    TH.log('Đổi liên kết chủ nhà', id, b.name + ' từ ' + F.date(from), 'owner', bId);
    TH.store.clearDraft(form); TH.modal.close('own-link', { silent: true }); TH.app.refresh();
    TH.toast('Đã gắn tòa', esc(b.name) + ' · liên kết và HĐ thuê cũ được giữ trong lịch sử; cập nhật điều khoản ở tab Hợp đồng thuê');
  };
  TH.act['own.disable'] = function (el) {
    var o = C.owner(el.dataset.id), bs = buildingsOf(o.id);
    if (bs.length) { TH.toast('Không thể vô hiệu', 'Chủ nhà còn ' + bs.length + ' tòa liên kết hiệu lực. Đổi liên kết trước.', 'danger'); return; }
    TH.confirm({ title: 'Vô hiệu chủ nhà ' + esc(o.id) + '?', body: '<p>Hồ sơ được giữ lại (không xóa cứng) và ẩn khỏi lựa chọn mới.</p>', ok: 'Vô hiệu', danger: true }).then(function (ok) {
      if (!ok) return; o.status = 'inactive'; TH.log('Vô hiệu chủ nhà', o.id, '', 'owner'); TH.app.refresh(); TH.toast('Đã vô hiệu', esc(o.name));
    });
  };

  /* ---------------- OWN-IMP ---------------- */
  var impCfg = {
    screen: 'OWN-IMP', kind: 'owner', template: 'mau_chu_nha_TIMEHOUSE.xlsx', sampleFile: 'chu_nha_dot3.xlsx',
    columns: [{ key: 'id', label: 'Mã chủ' }, { key: 'name', label: 'Tên' }, { key: 'phone', label: 'Liên hệ' }, { key: 'address', label: 'Địa chỉ' }],
    inc: { preview: 'F002.B', upsert: 'F002.C', history: 'F002.D' },
    sample: function () {
      var exists = function (id) { return TH.db.owners.some(function (o) { return o.id === id; }); };
      return [
        { line: 2, data: { id: 'CN-101', name: 'Phạm Thị Hạnh', phone: '0915 ••• 220', address: 'Long Biên, Hà Nội' }, errors: [] },
        { line: 3, data: { id: 'CN-102', name: 'Công ty CP Ánh Dương (minh họa)', phone: '024 ••• 1199', address: 'Hoàng Mai, Hà Nội' }, errors: [] },
        { line: 4, data: { id: 'CN-103', name: '', phone: '0938 ••• 412', address: 'Tây Hồ, Hà Nội' }, errors: ['Thiếu tên'] },
        { line: 5, data: { id: 'CN-002', name: 'Trần Thị Bình', phone: '0912 ••• 604', address: 'Đống Đa, Hà Nội (mới)' }, errors: [], dup: true },
        { line: 6, data: { id: 'CN-104', name: 'Đinh Văn Lực', phone: 'abc', address: 'Hà Đông, Hà Nội' }, errors: ['Số liên hệ không hợp lệ'] },
      ].map(function (r) { if (r.dup === undefined) r.dup = exists(r.data.id) && !r.errors.length; return r; });
    },
    commit: function (rows, policy) {
      var n = 0;
      rows.forEach(function (r) {
        var ex = C.owner(r.data.id);
        if (ex) { if (policy === 'update') { ex.name = r.data.name; ex.phone = r.data.phone; ex.address = r.data.address; n++; } return; }
        if (TH.db.owners.some(function (o) { return o.id === r.data.id; })) return;
        TH.db.owners.push({ id: r.data.id, kind: 'person', name: r.data.name, phone: r.data.phone, email: '—', address: r.data.address, permAddress: r.data.address, idNo: '', idDate: '', idPlace: '', taxCode: '—', bank: { no: '', name: '', holder: '' }, status: 'active', note: 'Nhập từ Excel mẫu', createdAt: TH.TODAY });
        n++;
      });
      return n;
    },
  };
  TH.registerImport(impCfg);
  TH.views['OWN-IMP'] = {
    modal: { size: 'xl' },
    scan: function () { return [{ ui: { step: 'upload' } }, { ui: { step: 'check' } }, { ui: { step: 'done' } }]; },
    render: function () { return TH.importFlow(impCfg); },
  };
})();
