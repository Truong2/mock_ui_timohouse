/* METER-01 — Bảng điện nước theo tòa/kỳ. F018–F021. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;
  var S = 'METER-01';

  function invoiced(roomId, p) { return TH.db.invoices.some(function (i) { return i.roomId === roomId && i.period === p && i.status === 'confirmed'; }); }
  /* Nhập theo tòa: chọn tòa trước, bảng chỉ gồm phòng đang ở (phòng trống mở thêm khi cần chốt số) */
  function buildingsIn() { return TH.buildingOptions(false).filter(function (o) { return TH.inScope(o.id); }).map(function (o) { return o.id; }); }
  function pickB() {
    var bs = buildingsIn(), s = TH.scope();
    if (s !== 'ALL' && bs.indexOf(s) > -1) return s;
    if (bs.length === 1) return bs[0];
    var b = TH.store.ui(S, 'b', null);
    return b && bs.indexOf(b) > -1 ? b : null;
  }
  function occupied(room) { return room.status === 'occupied' || !!C.contractOfRoom(room.id); }
  // bId = null → mọi tòa trong phạm vi; withVacant = có cả phòng trống
  function rowsFor(p, bId, withVacant) {
    return TH.db.rooms.filter(function (r) { return TH.inScope(r.buildingId) && (!bId || r.buildingId === bId) && (withVacant || occupied(r)); }).map(function (room) {
      var rd = C.reading(room.id, p);
      var form = 'mtr-' + p;
      var e = TH.store.draft(form, room.id + '.e'), w = TH.store.draft(form, room.id + '.w');
      var view = rd ? Object.assign({}, rd) : null;
      var dirty = false;
      if (view && e !== undefined && e !== '' && String(e) !== String(view.elecCur)) { view.elecCur = +e; dirty = true; }
      if (view && w !== undefined && w !== '' && String(w) !== String(view.waterCur)) { view.waterCur = +w; dirty = true; }
      var issue = C.readingIssue(view, room);
      return { room: room, rd: rd, view: view, issue: issue, dirty: dirty, locked: invoiced(room.id, p), b: C.building(room.buildingId), occ: occupied(room) };
    });
  }
  function counts(rows) {
    var c = { ok: 0, issue: 0, missing: 0, pending: 0 };
    rows.forEach(function (r) { var s = stateOf(r); if (s === 'confirmed') c.ok++; else if (s === 'missing' || s === 'none') c.missing++; else if (s === 'error' || s === 'review') c.issue++; else c.pending++; });
    return c;
  }
  // Tiến độ chốt số các phòng đang ở của 1 tòa
  function progressOf(p, id) {
    var rs = rowsFor(p, id, false), c = counts(rs);
    c.total = rs.length; c.done = !c.missing && !c.issue && !c.pending;
    return c;
  }
  function progBadges(c) {
    return (c.missing ? TH.badge('Thiếu ' + c.missing, 'danger') : '') + (c.issue ? TH.badge(c.issue + ' cần kiểm tra', 'warning') : '') +
      (!c.missing && !c.issue ? (c.pending ? TH.badge(c.pending + ' chưa xác nhận', 'draft') : TH.badge('Đủ số', 'success')) : '');
  }
  // Chưa chọn tòa: danh sách tòa (tìm kiếm, lọc chưa xong; tòa chưa xong xếp trước) — mở rộng được khi có nhiều tòa
  function buildingList(p) {
    var q = TH.store.ui(S, 'q', ''), f = TH.store.ui(S, 'f', 'all');
    var all = buildingsIn().map(function (id) { return { b: C.building(id), c: progressOf(p, id) }; });
    var todoN = all.filter(function (x) { return !x.c.done; }).length;
    var list = all.filter(function (x) { return (f !== 'todo' || !x.c.done) && TH.match(q, [x.b.name, x.b.short, x.b.id, x.b.address || '']); })
      .sort(function (x, y) { return (x.c.done - y.c.done) || x.b.name.localeCompare(y.b.name, 'vi'); });
    return '<div class="card card-flush">' + TH.cardHd(I('building', 'ic-sm') + 'Chọn tòa để nhập chỉ số kỳ ' + F.period(p), 'Mỗi lần nhập theo một tòa; bảng chỉ gồm các phòng đang ở. Phòng trống mở thêm khi cần chốt số.') +
      '<div class="toolbar">' + TH.searchBox(S, 'Tìm tòa theo tên, mã, địa chỉ') + TH.chips(S, 'f', [{ id: 'all', label: 'Tất cả', count: all.length }, { id: 'todo', label: 'Chưa xong', count: todoN }], f) + '</div>' +
      TH.table({ label: 'Danh sách tòa nhập chỉ số', cols: [
        { key: 'b', label: 'Tòa', render: function (x) { return '<div class="cell-main">' + esc(x.b.name) + '</div><div class="cell-sub mono">' + esc(x.b.id) + '</div>'; } },
        { key: 'n', label: 'Phòng đang ở', num: true, render: function (x) { return String(x.c.total); } },
        { key: 'pg', label: 'Đã xác nhận', render: function (x) { var pct = x.c.total ? Math.round(x.c.ok / x.c.total * 100) : 0; return '<div class="row u-gap-8 u-nowrap"><div class="progress" style="width:120px"><span style="width:' + pct + '%"></span></div><span class="small tnum">' + x.c.ok + '/' + x.c.total + '</span></div>'; } },
        { key: 'st', label: 'Tình trạng', render: function (x) { return '<div class="row u-gap-4">' + progBadges(x.c) + '</div>'; } },
        { key: 'go', label: '', render: function (x) { return '<button type="button" class="btn btn-sm' + (x.c.done ? '' : ' btn-primary') + '" data-act="mtr.pickB" data-b="' + x.b.id + '">' + (x.c.done ? 'Xem' : 'Nhập chỉ số') + I('chevronRight', 'ic-sm') + '</button>'; } },
      ], rows: list, rowAttrs: function (x) { return 'class="is-clickable" data-act="mtr.pickB" data-b="' + x.b.id + '" tabindex="0"'; }, empty: { title: 'Không có tòa phù hợp', text: 'Đổi từ khóa hoặc bỏ lọc “Chưa xong”.' } }) + '</div>';
  }
  // Đã chọn tòa: ô chọn tòa (dropdown, kèm tiến độ trong từng lựa chọn) + nút quay về danh sách
  function buildingSwitch(p, bId) {
    var bs = buildingsIn();
    if (bs.length < 2) return '';
    var opts = bs.map(function (id) { var c = progressOf(p, id); return { id: id, label: C.building(id).name + ' — ' + c.ok + '/' + c.total + (c.done ? ' · đủ số' : c.missing ? ' · thiếu ' + c.missing : c.issue ? ' · cần kiểm tra' : ' · chưa xác nhận') }; });
    return '<div class="row mtr-bswitch">' + TH.uiSelect(S, 'b', opts, bId, 'Tòa đang nhập', 'mtr-bsel') +
      '<button type="button" class="btn btn-sm btn-ghost" data-act="ui.set" data-screen="' + S + '" data-key="b" data-val="">' + I('list', 'ic-sm') + 'Danh sách tòa</button></div>';
  }
  function stateOf(r) {
    if (!r.rd) return 'none';
    if (r.issue && (r.issue.level === 'missing' || r.issue.level === 'error')) return r.issue.level;
    if (r.rd.status === 'review') return 'review';
    if (r.dirty) return 'draft';
    return r.rd.status;
  }
  function stBadge(r) {
    var s = stateOf(r);
    if (s === 'error') return TH.badge('Cần kiểm tra', 'danger', { icon: 'alert', tip: r.issue.text });
    if (s === 'missing') return TH.status('missing');
    if (s === 'review') return TH.badge('Chờ duyệt bất thường', 'warning', { dot: true });
    if (s === 'draft') return TH.status('draft');
    return TH.status('confirmed');
  }

  /* CR-BILL: công tơ điện chung (sheet "Điện vệ sinh chung") — nhập chỉ số chung theo kỳ, phân bổ theo số người/phòng đang ở, số người sửa theo tháng */
  function commonCard(p, bId) {
    var ms = C.commonMeters(bId), canEdit = TH.can('meter.edit'), R = TH.billRules();
    if (!ms.length) return '<div class="card">' + TH.cardHd(I('split', 'ic-sm') + 'Công tơ điện chung') + '<div class="card-bd small muted">Tòa chưa khai báo công tơ chung. Khi có (WC chung, hành lang…), chỉ số chung được chia cho người/phòng đang ở và vào dòng “Điện chung” của hóa đơn.</div></div>';
    return ms.map(function (m) {
      var sh = C.commonShare(m, p), rd = sh.reading, prevRd = C.commonReading(m.id, TH.addMonthsYm(p, -1));
      var prev = rd ? rd.prev : prevRd ? prevRd.cur : 0, active = m.from <= p;
      var locked = TH.db.invoices.some(function (i) { return i.period === p && i.status === 'confirmed' && m.rooms.indexOf(i.roomId) > -1; });
      var curIn = canEdit && active && !TH.periodLocked(p) ? '<label class="sr-only" for="cm-' + m.id + '">Số mới công tơ chung</label><input id="cm-' + m.id + '" class="input-cell" inputmode="numeric" value="' + (rd && rd.cur !== null ? rd.cur : '') + '" data-act-change="mtr.common" data-id="' + m.id + '">' : (rd && rd.cur !== null ? F.num(rd.cur) : '—');
      var unitLbl = m.method === 'per_person' ? 'người' : 'phòng';
      var table = TH.table({ compact: true, label: 'Phân bổ điện chung ' + m.name, cols: [
        { key: 'r', label: 'Phòng', render: function (x) { var ct = x.contractId && C.contract(x.contractId), k = ct && C.customer(ct.customerId); return '<b>' + TH.roomLink(x.roomId) + '</b><div class="cell-sub">' + (k ? esc(k.name) : 'Phòng trống') + '</div>'; } },
        { key: 'u', label: m.method === 'per_person' ? 'Số người kỳ này' : 'Suất', num: true, render: function (x) {
          if (!x.contractId) return '<span class="muted">0</span>';
          if (m.method !== 'per_person' || !canEdit) return F.num(x.units);
          var ct = C.contract(x.contractId), changed = (ct.peopleLog || []).some(function (l) { return l.from === p; });
          return '<label class="sr-only" for="pp-' + x.roomId + '">Số người ' + x.roomId + '</label><input id="pp-' + x.roomId + '" class="input-cell" style="width:64px" inputmode="numeric" value="' + x.units + '" data-act-change="mtr.people" data-id="' + x.contractId + '">' + (changed ? '<div class="cell-sub">HĐ ghi ' + ct.people + '</div>' : '');
        } },
        { key: 'a', label: 'Tiền điện chung', num: true, render: function (x) { return x.amount ? '<b>' + F.money(x.amount) + '</b>' : '<span class="muted">0</span>'; } },
      ], rows: sh.rows, foot: { _label: '<b>Tổng</b>', u: '<b>' + sh.units + '</b>', a: '<b>' + F.money(sh.amount - sh.loss) + '</b>' } });
      return '<div class="card card-flush">' + TH.cardHd(I('split', 'ic-sm') + 'Công tơ điện chung · ' + esc(m.name), '<span class="mono">' + esc(m.code) + '</span> · ' + esc(TH.COMMON_METHODS[m.method]) + ' · ' + F.money(m.price) + '/kWh · áp dụng từ ' + F.period(m.from), TH.openBadge('D-03', 'ĐỀ XUẤT')) +
        '<div class="card-bd"><div class="row" style="gap:16px;flex-wrap:wrap;align-items:flex-end"><div class="field" style="max-width:160px"><label>Số cũ</label><div class="tnum"><b>' + F.num(prev) + '</b></div></div><div class="field" style="max-width:160px"><label for="cm-' + m.id + '">Số mới kỳ ' + F.period(p) + '</label>' + curIn + '</div>' +
        '<div class="field"><label>Tiêu thụ</label><div class="tnum"><b>' + F.num(sh.kwh) + ' kWh</b> × ' + F.money(m.price) + ' = <b>' + F.money(sh.amount) + '</b></div></div>' +
        '<div class="field"><label>Mỗi ' + unitLbl + '</label><div class="tnum"><b>' + F.money(Math.round(sh.perUnit)) + '</b> <span class="muted small">÷ ' + sh.base + ' ' + unitLbl + '</span></div></div></div>' +
        (!active ? '<div class="small muted u-mt-8">Kỳ này chưa áp dụng phân bổ (từ ' + F.period(m.from) + ').</div>' : '') +
        (sh.vacant ? '<div class="small muted u-mt-8">' + sh.vacant + ' phòng trống: ' + (R.commonVacant === 'loss' ? 'công ty chịu ' + F.money(sh.loss) + ' (vào “Điện nước không thu được”)' : 'phần điện chung chia hết cho người đang ở') + ' — quy tắc ở INV-01.</div>' : '') +
        (locked ? '<div class="alert alert-neutral u-mt-8">' + I('lock', 'ic-sm') + '<div class="alert-body">Có hóa đơn kỳ ' + F.period(p) + ' đã xác nhận trong nhóm phòng này — sửa chỉ số/số người chỉ đổi hóa đơn nháp, không sửa hồi tố.</div></div>' : '') +
        '</div>' + table + '<div class="card-ft"><span class="small muted">' + esc(m.note || '') + ' Số người sửa theo tháng (QL khai báo) — dùng cho cả nước tính theo người.</span></div></div>';
    }).join('');
  }
  TH.onChange['mtr.common'] = function (el) {
    var p = TH.store.state.period, m = C.commonMeters().find(function (x) { return x.id === el.dataset.id; }), v = String(el.value).replace(/\D/g, '');
    var rd = C.commonReading(m.id, p), prevRd = C.commonReading(m.id, TH.addMonthsYm(p, -1));
    if (!rd) { rd = { meterId: m.id, period: p, prev: prevRd ? prevRd.cur : 0, cur: null, status: 'draft', enteredBy: null, enteredAt: null, note: '' }; TH.db.commonReadings.push(rd); }
    if (v !== '' && +v < rd.prev) { TH.toast('Số mới nhỏ hơn số cũ', 'Kiểm tra lại chỉ số công tơ chung.', 'danger'); TH.app.refresh(); return; }
    rd.cur = v === '' ? null : +v; rd.status = v === '' ? 'draft' : 'confirmed'; rd.enteredBy = TH.me().id; rd.enteredAt = TH.TODAY;
    TH.refreshDrafts(m.buildingId, p);
    TH.log('Nhập chỉ số công tơ chung', m.code, 'Kỳ ' + F.period(p) + ': ' + rd.prev + ' → ' + rd.cur, 'meter', m.buildingId);
    TH.app.refresh();
    TH.toast('Đã lưu chỉ số công tơ chung', esc(m.name) + ' · hóa đơn nháp đã tính lại điện chung.');
  };
  TH.onChange['mtr.people'] = function (el) {
    var p = TH.store.state.period, ct = C.contract(el.dataset.id), n = +String(el.value).replace(/\D/g, '');
    if (!n) { TH.toast('Số người phải lớn hơn 0', '', 'danger'); TH.app.refresh(); return; }
    ct.peopleLog = (ct.peopleLog || []).filter(function (l) { return l.from !== p; }).concat([{ from: p, people: n, note: 'QL khai báo kỳ ' + F.period(p), by: TH.me().id, at: TH.TODAY }]);
    TH.refreshDrafts(ct.buildingId, p);
    TH.log('Khai báo số người theo kỳ', ct.roomId, 'Kỳ ' + F.period(p) + ': ' + n + ' người', 'meter', ct.buildingId);
    TH.app.refresh();
    TH.toast('Đã cập nhật số người ' + ct.roomId, n + ' người từ kỳ ' + F.period(p) + ' — điện chung/nước theo người tính lại ở hóa đơn nháp.');
  };

  TH.views[S] = {
    scan: function () { return [{ ui: { b: null } }, { ui: { b: null, f: 'todo' } }, { ui: { b: 'TH-CG' } }, { ui: { b: 'TH-TX', vacant: true } }]; },
    render: function () {
      var p = TH.store.state.period, bId = pickB(), showVac = !!TH.store.ui(S, 'vacant', false);
      var rows = bId ? rowsFor(p, bId, showVac) : [];
      var vacantN = bId ? TH.db.rooms.filter(function (r) { return r.buildingId === bId && !occupied(r); }).length : 0;
      var kpiRows = bId ? rows.filter(function (r) { return r.occ; }) : rowsFor(p, null, false);
      var bulk = TH.has('F019.B'), monitor = TH.has('F019.C');
      var cnt = counts(kpiRows);
      var form = 'mtr-' + p;
      var numIn = function (r, k) {
        var cur = k === 'e' ? r.view.elecCur : r.view.waterCur;
        var bad = r.issue && ((r.issue.level === 'missing' && (cur === null || cur === '')) || (r.issue.level === 'error' && (k === 'e' ? +r.view.elecCur < r.view.elecPrev : +r.view.waterCur < r.view.waterPrev)));
        return '<label class="sr-only" for="m-' + r.room.id + k + '">Số mới ' + (k === 'e' ? 'điện' : 'nước') + ' ' + r.room.id + '</label><input id="m-' + r.room.id + k + '" class="input-cell' + (bad ? ' is-invalid' : '') + '" inputmode="numeric" value="' + (cur === null || cur === undefined ? '' : cur) + '" data-draft="' + form + '.' + r.room.id + '.' + k + '" data-live>';
      };
      var cols = [
        { key: 'room', label: 'Phòng', render: function (r) { var ct = C.contractOfRoom(r.room.id), k = ct && C.customer(ct.customerId); return '<div class="cell-main">' + TH.roomLink(r.room.id) + '</div><div class="cell-sub">' + (k ? esc(k.name) : TH.statusLabel(r.room.status)) + '</div>'; } },
        { key: 'mt', label: 'Công tơ', render: function (r) { return '<span class="small mono">' + esc(r.room.meters[0].code) + '<br>' + esc(r.room.meters[1].code) + '</span>'; } },
        { key: 'eo', label: 'Điện cũ', num: true, render: function (r) { return r.view ? F.num(r.view.elecPrev) : '—'; } },
        { key: 'en', label: 'Điện mới', num: true, render: function (r) { return !r.view ? '—' : bulk && !r.locked ? numIn(r, 'e') : (r.view.elecCur === null ? '<span class="neg">—</span>' : F.num(r.view.elecCur)); } },
        { key: 'ek', label: 'kWh', num: true, render: function (r) { return r.view && r.view.elecCur !== null ? '<b>' + F.num(r.view.elecCur - r.view.elecPrev) + '</b>' : '—'; } },
        { key: 'wo', label: 'Nước cũ', num: true, render: function (r) { return r.view ? F.num(r.view.waterPrev) : '—'; } },
        { key: 'wn', label: 'Nước mới', num: true, render: function (r) { return !r.view ? '—' : bulk && !r.locked ? numIn(r, 'w') : (r.view.waterCur === null ? '<span class="neg">—</span>' : F.num(r.view.waterCur)); } },
        { key: 'wk', label: 'm³', num: true, render: function (r) { return r.view && r.view.waterCur !== null ? '<b class="' + (r.view.waterCur < r.view.waterPrev ? 'neg' : '') + '">' + F.num(r.view.waterCur - r.view.waterPrev) + '</b>' : '—'; } },
        { key: 'pr', label: 'Đơn giá Đ / N', num: true, render: function (r) { return '<span class="small">' + F.num(r.b.elecPrice) + ' / ' + F.num(r.b.waterPrice) + '</span>'; } },
        { key: 'am', label: 'Thành tiền', num: true, render: function (r) { var v = r.view; if (!v || v.elecCur === null || v.waterCur === null || (r.issue && r.issue.level === 'error')) return '<span class="muted">—</span>'; return F.money((v.elecCur - v.elecPrev) * r.b.elecPrice + (v.waterCur - v.waterPrev) * r.b.waterPrice); } },
        { key: 'st', label: 'Trạng thái', render: function (r) { return stBadge(r) + (r.locked ? '<div class="cell-sub">' + I('lock', 'ic-sm') + ' đã dùng ở hóa đơn</div>' : ''); } },
        { key: 'mon', label: 'Giám sát', gate: 'F019.C', render: function (r) { return r.issue ? '<span class="row-flag ' + (r.issue.level === 'spike' ? 'warn-text' : 'neg') + '" data-tip="' + esc(r.issue.text) + '">' + I('activity', 'ic-sm') + esc(r.issue.level === 'spike' ? 'Đột biến' : r.issue.level === 'missing' ? 'Thiếu số' : 'Số lùi') + '</span>' + (r.rd && r.rd.approvedBy ? '<div class="cell-sub">Duyệt: ' + esc(C.staffName(r.rd.approvedBy)) + '</div>' : '') : '<span class="muted small">Bình thường</span>'; } },
        { key: 'act', label: '', render: function (r) {
          if (!r.rd || r.locked) return '';
          var out = '';
          if (!bulk) out += TH.permBtn('meter.edit', '<button type="button" class="btn btn-xs" data-act="mtr.edit" data-id="' + r.room.id + '">' + I('edit', 'ic-sm') + 'Nhập</button>', '403');
          if (monitor && stateOf(r) === 'review') out += TH.permBtn('meter.approve', '<button type="button" class="btn btn-xs btn-soft" data-act="mtr.approve" data-id="' + r.room.id + '">Duyệt</button>', 'Duyệt · 403');
          return '<div class="row-actions">' + out + '</div>';
        } },
      ];
      var dirtyN = rowsFor(p, null, true).filter(function (r) { return r.dirty; }).length, dirtyHere = rows.filter(function (r) { return r.dirty; }).length;
      var bulkBar = bulk ? '<div class="toolbar u-tint-teal">' + TH.tierPill('B') + '<span class="small"><b>Nhập hàng loạt theo tòa</b> — nhập trực tiếp số mới trên bảng; số cũ tự lấy từ kỳ trước. Đổi tòa không mất số đã gõ.</span><span class="grow"></span>' +
        (dirtyN ? TH.badge(dirtyN + ' dòng chưa lưu' + (dirtyN > dirtyHere ? ' (' + (dirtyN - dirtyHere) + ' ở tòa khác)' : ''), 'draft') : '') + '<button type="button" class="btn btn-sm" data-act="mtr.discard"' + (dirtyN ? '' : ' disabled') + '>Bỏ thay đổi</button>' +
        TH.permBtn('meter.edit', '<button type="button" class="btn btn-sm btn-primary" data-act="mtr.saveAll"' + (dirtyN ? '' : ' disabled') + '>' + I('check', 'ic-sm') + 'Lưu ' + (dirtyN || '') + ' dòng</button>', 'Lưu · 403') + '</div>'
        : '<div class="toolbar">' + TH.tierPill('A') + '<span class="small">Nhập và lưu số theo từng phòng. Số cũ tự lấy từ kỳ trước; tháng đầu nhập tay.</span><span class="grow"></span>' + TH.gate('F019.B', '', { mode: 'btn', label: 'Nhập hàng loạt theo tòa', size: 'btn-sm' }) + '</div>';
      TH.app.guard = dirtyN ? { tier: 'B', dirty: true, label: 'Nhập chỉ số hàng loạt' } : null;

      var extras = TH.db.extraFees.filter(function (e) { return e.period === p && C.room(e.roomId).buildingId === bId; });
      var feeCard = '<div class="card card-flush">' + TH.cardHd(I('plus', 'ic-sm') + 'Phí phát sinh kỳ ' + F.period(p), 'Nhập thủ công trước khi xác nhận hóa đơn (A)', TH.permBtn('meter.edit', '<button type="button" class="btn btn-sm" data-act="mtr.fee">' + I('plus', 'ic-sm') + 'Thêm dòng phí</button>', 'Thêm · 403')) +
        TH.table({ compact: true, cols: [
          { key: 'r', label: 'Phòng', render: function (e) { return TH.roomLink(e.roomId); } },
          { key: 'n', label: 'Mô tả', render: function (e) { return esc(e.name) + '<div class="cell-sub">' + esc(e.source) + '</div>'; } },
          { key: 'a', label: 'Thành tiền', num: true, render: function (e) { return F.money(e.qty * e.price); } },
          { key: 's', label: 'Trạng thái', render: function (e) { return TH.status(e.status); } },
          { key: 'ap', label: 'Duyệt', gate: 'F021.C', render: function (e) { return e.status === 'draft' ? TH.permBtn('meter.approve', '<button type="button" class="btn btn-xs btn-soft" data-act="mtr.feeOk" data-id="' + e.id + '">Duyệt</button>', '403') : '<span class="small muted">' + esc(C.staffName('NV-002')) + '</span>'; } },
          { key: 'x', label: '', render: function (e) { return e.status === 'draft' ? '<button type="button" class="btn btn-xs btn-ghost" data-act="mtr.feeDel" data-id="' + e.id + '" aria-label="Xóa nháp">' + I('trash', 'ic-sm') + '</button>' : ''; } },
        ], rows: extras, empty: { title: 'Chưa có phí phát sinh', text: 'Không phát sinh phí tự động nếu chưa có nguồn.' } }) +
        TH.gate('F021.D', '<div class="card-ft"><span class="small">' + TH.tierPill('D') + ' Quy tắc hiệu lực phí: mỗi dòng gắn kỳ áp dụng; lịch sử thay đổi được lưu trong audit.</span></div>', { label: 'Quy tắc hiệu lực, lịch sử thay phí', lines: 1 }) + '</div>';

      var bsIn = bId ? [C.building(bId)] : [];
      var priceCard = '<div class="card">' + TH.cardHd(I('zap', 'ic-sm') + 'Đơn giá áp dụng', '(số mới − số cũ) × đơn giá cố định', TH.gate('F020.B', TH.permBtn('master.edit', '<button type="button" class="btn btn-sm" data-act="mtr.price">' + I('settings', 'ic-sm') + 'Đơn giá theo tòa/kỳ' + TH.up('F020.B') + '</button>', '403'), { mode: 'btn', label: 'Đơn giá theo tòa/kỳ', size: 'btn-sm' })) + '<div class="card-bd">' +
        TH.kv(bsIn.map(function (b) { return [b.short, F.money(b.elecPrice) + '/kWh · ' + F.money(b.waterPrice) + '/m³']; })) +
        '<div class="u-mt-12">' + TH.gate('F020.C', '<div class="alert alert-draft">' + I('layers', 'ic-sm') + '<div class="alert-body"><b>Thang giá / định mức ' + TH.up('F020.C') + '</b><span>Chỉ áp dụng khi có thang giá đã phê duyệt. Hiện chưa chốt (D-03).</span></div></div>', { label: 'Thang giá/định mức đã phê duyệt', lines: 1 }) + '</div></div></div>';

      var meterCard = '<div class="card">' + TH.cardHd(I('gauge', 'ic-sm') + 'Công tơ', 'Gói A: 1 điện + 1 nước / phòng (giả định)', TH.gate('F018.B', TH.permBtn('meter.edit', '<button type="button" class="btn btn-sm" data-act="mtr.swap">' + I('refresh', 'ic-sm') + 'Thay công tơ' + TH.up('F018.B') + '</button>', '403'), { mode: 'btn', label: 'Thay/đổi công tơ có ngày', size: 'btn-sm' })) + '<div class="card-bd stack-sm">' +
        TH.gate('F018.C', '<div><div class="section-title">Lịch sử thay công tơ & số reset ' + TH.up('F018.C') + '</div><ul class="timeline">' + TH.db.meterChanges.map(function (m) { return '<li><b>' + esc(m.roomId) + '</b> · ' + (m.type === 'elec' ? 'Điện' : 'Nước') + ': chốt cũ ' + F.num(m.oldFinal) + ' → mới bắt đầu ' + F.num(m.newStart) + '<div class="when">' + F.date(m.at) + ' · ' + esc(m.note) + '</div></li>'; }).join('') + '</ul></div>', { label: 'Lịch sử thay công tơ, xử lý số reset', lines: 2 }) +
        TH.gate('F018.D', '<div class="alert alert-draft">' + I('split', 'ic-sm') + '<div class="alert-body"><b>Nhiều công tơ / phòng ' + TH.up('F018.D') + '</b><span>Công tơ chung (WC, hành lang…) nhập ở thẻ “Công tơ điện chung”, chia theo số người hoặc số phòng đang ở.</span></div></div>', { label: 'Nhiều công tơ/phòng với quy tắc phân bổ', lines: 1 }) + '</div></div>';

      var util = C.sum(TH.db.expenses.filter(function (e) { return e.period === p && e.category === 'utility' && e.buildingId === bId; }), function (e) { return e.amount; });
      var billedUtil = C.sum(TH.db.invoices.filter(function (i) { return i.period === p && i.buildingId === bId; }), function (i) { return C.sum(i.lines.filter(function (l) { return l.type === 'elec' || l.type === 'water' || l.type === 'common'; }), function (l) { return l.amount; }); });
      var recon = TH.gate('F020.D', '<div class="card">' + TH.cardHd(I('compare', 'ic-sm') + 'Đối chiếu công tơ nguồn vs thu' + TH.up('F020.D')) + '<div class="card-bd">' + TH.kv([['Mã HĐ điện (EVN) theo tòa', '<span class="mono small">' + bsIn.map(function (b) { return b.short + ' ' + (b.evnCode || '—'); }).join(' · ') + '</span>'], ['HĐ điện nước tổng (chi phí)', F.money(util)], ['Điện nước đã lập hóa đơn', F.money(billedUtil)], ['Chênh lệch', '<b class="' + (billedUtil - util >= 0 ? 'pos' : 'neg') + '">' + F.money(billedUtil - util) + '</b>']]) + '</div></div>', { label: 'Đối chiếu hóa đơn công tơ nguồn vs thu', lines: 3 });
      var snap = TH.gate('F019.D', '<div class="card">' + TH.cardHd(I('stamp', 'ic-sm') + 'Bản chốt chỉ số sau chốt kỳ' + TH.up('F019.D')) + '<div class="card-bd">' + (TH.periodLocked(p) ? TH.badge('Kỳ ' + F.period(p) + ' đã chốt — chỉ số đóng băng', 'neutral', { icon: 'lock' }) : '<p class="small">Kỳ đang mở: ' + cnt.ok + '/' + kpiRows.length + ' phòng đang ở đã xác nhận. Bản chốt tạo khi khóa kỳ ở RPT-01; sửa sau chốt cần biên bản.</p>') + '</div></div>', { label: 'Bản chốt chỉ số sau chốt kỳ và đối chiếu', lines: 2 });

      return TH.pageHeader({ screen: S, status: TH.periodBadge(p), desc: 'Chốt số ngày 01 của kỳ. Hóa đơn bị khóa nếu còn chỉ số bắt buộc chưa xác nhận.',
          actions: '<button type="button" class="btn" data-act="mtr.preview">' + I('eye', 'ic-sm') + 'Xem trước tiền điện nước</button><a class="btn btn-primary" href="' + TH.router.href('INV-01') + '">' + I('receipt', 'ic-sm') + 'Sang lập hóa đơn</a>' }) +
        '<div class="grid-4 u-mb-16">' + TH.kpi({ label: 'Phòng đang ở', icon: 'door', value: String(kpiRows.length), foot: bId ? esc(C.building(bId).name) + (vacantN ? ' · ' + vacantN + ' phòng trống ' + (showVac ? 'đang hiện' : 'đang ẩn') : '') : esc(TH.scopeLabel()) + ' · chưa chọn tòa' }) + TH.kpi({ label: 'Đã xác nhận', icon: 'checkCircle', value: String(cnt.ok) }) +
        TH.kpi({ label: 'Thiếu số', icon: 'alertCircle', value: String(cnt.missing), neg: cnt.missing > 0, foot: cnt.missing ? 'Cần nhập trước khi chốt hóa đơn' : 'Đủ số' }) + TH.kpi({ label: 'Cần kiểm tra / duyệt', icon: 'alert', value: String(cnt.issue), neg: cnt.issue > 0, foot: 'Số mới < số cũ hoặc bất thường' }) + '</div>' +
        (bId ? '<div class="card card-flush u-mb-16">' + TH.cardHd(I('gauge', 'ic-sm') + 'Chỉ số kỳ ' + F.period(p) + ' · ' + esc(C.building(bId).name), kpiRows.length + ' phòng đang ở' + (showVac && vacantN ? ' + ' + vacantN + ' phòng trống' : '') + ' · ' + progBadges(progressOf(p, bId)), buildingSwitch(p, bId)) + bulkBar +
          TH.table({ label: 'Bảng chỉ số điện nước', cols: cols, rows: rows, rowAttrs: function (r) { var s = stateOf(r); return s === 'error' || s === 'missing' ? 'class="u-row-alert"' : !r.occ ? 'class="u-row-muted"' : ''; }, empty: { title: 'Tòa chưa có phòng đang ở', text: 'Mở phòng trống nếu cần chốt số.' } }) +
          (vacantN ? '<div class="card-ft"><button type="button" class="btn btn-sm btn-ghost" data-act="mtr.vacant">' + I('eye', 'ic-sm') + (showVac ? 'Ẩn ' : 'Hiện ') + vacantN + ' phòng trống</button><span class="small muted">Phòng trống chỉ cần chốt số khi bàn giao hoặc kiểm tra; không tính cho khách.</span></div>' : '') + '</div>' +
          '<div class="u-mb-16">' + TH.gate('F018.D', commonCard(p, bId), { label: 'Công tơ điện chung — phân bổ theo người/phòng', lines: 3 }) + '</div>' +
          '<div class="grid-2 u-mb-16">' + feeCard + priceCard + '</div>' +
          '<div class="grid-3">' + meterCard + recon + snap + '</div>'
        : buildingList(p));
    },
    dialogs: [function () { editForm('TX-102'); }, function () { feeForm(); }],
  };

  /* Dialog nhập chỉ số 1 phòng (A) */
  function editForm(roomId) {
    var p = TH.store.state.period, rd = C.reading(roomId, p), form = 'mtr1-' + roomId;
    var e = TH.store.draft(form, 'e', rd.elecCur === null ? '' : rd.elecCur), w = TH.store.draft(form, 'w', rd.waterCur === null ? '' : rd.waterCur);
    var view = Object.assign({}, rd, { elecCur: e === '' ? null : +e, waterCur: w === '' ? null : +w });
    var issue = C.readingIssue(view, C.room(roomId));
    return { title: 'Nhập chỉ số · ' + esc(roomId), sub: 'Kỳ ' + F.period(p) + ' · số cũ tự lấy từ kỳ trước',
      body: '<div class="stack"><div class="form-grid">' +
        TH.field({ label: 'Điện — số cũ', value: rd.elecPrev, readonly: true, id: 'mo-e' }) + TH.field({ form: form, name: 'e', label: 'Điện — số mới', def: rd.elecCur === null ? '' : rd.elecCur, num: true, inputmode: 'numeric', live: true, invalid: issue && issue.level === 'error' && view.elecCur < rd.elecPrev }) +
        TH.field({ label: 'Nước — số cũ', value: rd.waterPrev, readonly: true, id: 'mo-w' }) + TH.field({ form: form, name: 'w', label: 'Nước — số mới', def: rd.waterCur === null ? '' : rd.waterCur, num: true, inputmode: 'numeric', live: true, invalid: issue && issue.level === 'error' && view.waterCur < rd.waterPrev }) + '</div>' +
        (issue ? '<div class="alert alert-' + (issue.level === 'spike' ? 'warning' : 'danger') + '">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>' + esc(issue.text) + '</b><span>' + (issue.level === 'error' ? 'Không tính âm: kiểm tra lại số hoặc ghi nhận thay công tơ.' : issue.level === 'missing' ? 'Nhập đủ số mới để lưu.' : 'Có thể lưu; gói C sẽ chuyển người duyệt.') + '</span></div></div>' : '<div class="alert alert-success">' + I('checkCircle', 'ic-sm') + '<div class="alert-body">Tiêu thụ: ' + F.num(view.elecCur - rd.elecPrev) + ' kWh · ' + F.num(view.waterCur - rd.waterPrev) + ' m³</div></div>') +
        TH.field({ form: form, name: 'note', label: 'Ghi chú', def: rd.note || '' }) + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="mtr.save1" data-id="' + roomId + '"' + (issue && issue.level !== 'spike' ? ' disabled' : '') + '>' + I('check', 'ic-sm') + 'Lưu chỉ số</button>' };
  }
  function commitReading(rd, e, w, note) {
    rd.elecCur = +e; rd.waterCur = +w;
    if (note !== undefined) rd.note = note;
    rd.enteredBy = TH.me().id; rd.enteredAt = TH.TODAY;
    var issue = C.readingIssue(rd, C.room(rd.roomId));
    rd.status = issue && issue.level === 'spike' && TH.has('F019.C') ? 'review' : 'confirmed';
    return issue;
  }
  TH.act['mtr.edit'] = function (el) { var id = el.dataset.id; TH.modal.open({ key: 'mtr1', size: 'sm', render: function () { return editForm(id); } }); };
  TH.act['mtr.save1'] = function (el) {
    var id = el.dataset.id, p = TH.store.state.period, rd = C.reading(id, p), form = 'mtr1-' + id;
    var e = TH.store.draft(form, 'e', rd.elecCur), w = TH.store.draft(form, 'w', rd.waterCur);
    var probe = C.readingIssue(Object.assign({}, rd, { elecCur: e === '' ? null : +e, waterCur: w === '' ? null : +w }), C.room(id));
    if (probe && probe.level !== 'spike') { TH.toast('Chưa lưu', esc(probe.text), 'danger'); return; }
    commitReading(rd, e, w, TH.store.draft(form, 'note', rd.note));
    TH.log('Nhập chỉ số', id, 'Kỳ ' + F.period(p), 'meter', C.room(id).buildingId);
    TH.store.clearDraft(form); TH.modal.close('mtr1', { silent: true }); TH.app.refresh();
    TH.toast('Đã lưu chỉ số ' + id, rd.status === 'review' ? 'Bất thường — chờ người duyệt (C).' : 'Đã xác nhận.');
  };
  TH.act['mtr.saveAll'] = function () {
    var p = TH.store.state.period, rows = rowsFor(p, null, true).filter(function (r) { return r.dirty; });
    var bad = rows.filter(function (r) { return r.issue && r.issue.level !== 'spike'; });
    var ok = rows.filter(function (r) { return !(r.issue && r.issue.level !== 'spike'); });
    var form = 'mtr-' + p;
    ok.forEach(function (r) {
      commitReading(r.rd, r.view.elecCur, r.view.waterCur);
      TH.store.setDraft(form, r.room.id + '.e', undefined); TH.store.setDraft(form, r.room.id + '.w', undefined);
    });
    if (ok.length) TH.log('Nhập chỉ số hàng loạt', ok.length + ' phòng', 'Kỳ ' + F.period(p), 'meter');
    TH.app.refresh();
    if (bad.length) TH.toast('Đã lưu ' + ok.length + ' dòng, ' + bad.length + ' dòng còn lỗi', bad.map(function (r) { return esc(r.room.id + ': ' + r.issue.text); }).join('<br>'), 'warning');
    else TH.toast('Đã lưu ' + ok.length + ' dòng chỉ số', 'Phòng thiếu số/lỗi được giữ lại để kiểm tra.');
  };
  TH.act['mtr.pickB'] = function (el) { TH.store.setUi(S, 'b', el.dataset.b); TH.app.refresh(); };
  TH.act['mtr.vacant'] = function () { TH.store.setUi(S, 'vacant', !TH.store.ui(S, 'vacant', false)); TH.app.refresh(); };
  TH.act['mtr.discard'] = function () { TH.store.clearDraft('mtr-' + TH.store.state.period); TH.app.guard = null; TH.app.refresh(); };
  TH.act['mtr.approve'] = function (el) {
    var rd = C.reading(el.dataset.id, TH.store.state.period);
    rd.status = 'confirmed'; rd.approvedBy = TH.me().id;
    TH.log('Duyệt chỉ số bất thường', rd.roomId, '', 'meter'); TH.app.refresh();
    TH.toast('Đã duyệt chỉ số ' + rd.roomId, 'Người duyệt: ' + esc(TH.me().name));
  };
  TH.act['mtr.preview'] = function () {
    var p = TH.store.state.period, bId = pickB();
    TH.modal.open({ key: 'mtrprev', size: 'md', render: function () {
      var rows = rowsFor(p, bId, true).filter(function (r) { return r.view && r.view.elecCur !== null && r.view.waterCur !== null && !(r.issue && r.issue.level === 'error'); });
      var tot = C.sum(rows, function (r) { return (r.view.elecCur - r.view.elecPrev) * r.b.elecPrice + (r.view.waterCur - r.view.waterPrev) * r.b.waterPrice; });
      return { title: 'Xem trước tiền điện nước · Kỳ ' + F.period(p) + (bId ? ' · ' + esc(C.building(bId).short) : ''), sub: 'Chưa ghi hóa đơn — chỉ để soát', body: TH.table({ compact: true, cols: [{ key: 'r', label: 'Phòng', render: function (r) { return r.room.id; } }, { key: 'e', label: 'Điện', num: true, render: function (r) { return F.money((r.view.elecCur - r.view.elecPrev) * r.b.elecPrice); } }, { key: 'w', label: 'Nước', num: true, render: function (r) { return F.money((r.view.waterCur - r.view.waterPrev) * r.b.waterPrice); } }], rows: rows, foot: { _label: 'Tổng', w: '<b>' + F.money(tot) + '</b>' } }), foot: '<button type="button" class="btn" data-close>Đóng</button>' };
    } });
  };
  function feeForm() {
    var form = 'mtr-fee', tplOn = TH.has('F021.B');
    var bId = pickB(), rooms = TH.db.rooms.filter(function (r) { return TH.inScope(r.buildingId) && (!bId || r.buildingId === bId) && occupied(r); });
    return { title: 'Thêm dòng phí phát sinh', sub: 'Kỳ ' + F.period(TH.store.state.period) + ' · nhập thủ công trước khi xác nhận hóa đơn',
      body: '<div class="stack">' + TH.gate('F021.B', '<div><div class="section-title">Mẫu nhóm phí thường dùng ' + TH.up('F021.B') + '</div><div class="row u-gap-6">' + [['Vệ sinh điều hòa', 200000], ['Thay bóng đèn', 30000], ['Sửa vòi nước', 150000], ['Phí thẻ từ', 50000]].map(function (t) { return '<button type="button" class="filter-chip" data-act="mtr.tpl" data-n="' + esc(t[0]) + '" data-p="' + t[1] + '">' + esc(t[0]) + ' · ' + F.short(t[1]) + '</button>'; }).join('') + '</div></div>', { mode: 'block', ghost: 'self', label: 'Mẫu nhóm phí thường dùng' }) +
        '<div class="form-grid">' + TH.field({ form: form, name: 'room', label: 'Phòng', type: 'select', options: rooms.map(function (r) { return r.id; }), def: rooms[0] && rooms[0].id }) + TH.field({ form: form, name: 'qty', label: 'Số lượng', def: '1', num: true }) +
        TH.field({ form: form, required: true, name: 'name', label: 'Mô tả', def: '', span: true }) + TH.field({ form: form, required: true, name: 'price', label: 'Đơn giá (đ)', def: '', num: true }) + TH.field({ form: form, name: 'source', label: 'Chứng từ nguồn', def: 'Phiếu yêu cầu #', placeholder: 'Bắt buộc có nguồn' }) + '</div>' +
        (tplOn ? '' : '') + TH.gate('F021.C', '<div class="alert alert-neutral">' + I('shieldCheck', 'ic-sm') + '<div class="alert-body">' + TH.tierPill('C') + ' Dòng phí từ 500.000 ₫ cần người có quyền duyệt trước khi vào hóa đơn.</div></div>', { mode: 'mini', label: 'Duyệt dòng phí nhạy cảm' }) + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="mtr.feeSave">Thêm (nháp)</button>' };
  }
  TH.act['mtr.fee'] = function () { TH.modal.open({ key: 'mtrfee', size: 'md', render: feeForm }); };
  TH.act['mtr.tpl'] = function (el) { TH.store.setDraft('mtr-fee', 'name', el.dataset.n); TH.store.setDraft('mtr-fee', 'price', el.dataset.p); TH.modal.rerenderAll(); };
  TH.act['mtr.feeSave'] = function () {
    var g = function (k, d) { return TH.store.draft('mtr-fee', k, d); };
    var name = (g('name', '') || '').trim(), price = +String(g('price', '')).replace(/\D/g, '');
    var errs = {}; if (!name) errs.name = 'Nhập mô tả phí.'; if (!price) errs.price = 'Nhập đơn giá lớn hơn 0.';
    if (!TH.formErrors('mtr-fee', errs)) { TH.modal.rerenderAll(); return; }
    var room = g('room', TH.db.rooms.find(function (r) { return TH.inScope(r.buildingId) && r.status === 'occupied'; }).id);
    var rec = { id: 'PS-' + Date.now().toString().slice(-6), roomId: room, period: TH.store.state.period, name: name, qty: +g('qty', 1) || 1, price: price, status: TH.has('F021.C') ? 'draft' : 'confirmed', source: g('source', '—') };
    TH.db.extraFees.push(rec);
    TH.log('Thêm phí phát sinh', room, name + ' · ' + F.money(price), 'meter');
    TH.store.clearDraft('mtr-fee'); TH.modal.close('mtrfee', { silent: true }); TH.app.refresh();
    TH.toast('Đã thêm phí phát sinh', esc(room + ' · ' + name) + (rec.status === 'draft' ? ' — chờ duyệt (C)' : ''));
  };
  TH.act['mtr.feeOk'] = function (el) { var f = TH.db.extraFees.find(function (x) { return x.id === el.dataset.id; }); f.status = 'confirmed'; TH.log('Duyệt phí phát sinh', f.roomId, f.name, 'meter'); TH.app.refresh(); TH.toast('Đã duyệt dòng phí', esc(f.name)); };
  TH.act['mtr.feeDel'] = function (el) {
    TH.confirm({ title: 'Xóa dòng phí nháp?', body: '<p>Chỉ xóa được dòng phí đang ở trạng thái Nháp.</p>', ok: 'Xóa', danger: true }).then(function (ok) {
      if (!ok) return; TH.db.extraFees = TH.db.extraFees.filter(function (x) { return x.id !== el.dataset.id; }); TH.app.refresh(); TH.toast('Đã xóa dòng phí nháp', '');
    });
  };
  TH.act['mtr.price'] = function () {
    TH.modal.open({ key: 'mtrprice', size: 'md', render: function () {
      return { title: 'Đơn giá điện nước theo tòa/kỳ' + TH.up('F020.B'), sub: 'Áp dụng từ kỳ chọn; kỳ đã chốt không đổi',
        body: TH.table({ compact: true, cols: [{ key: 'n', label: 'Tòa', render: function (b) { return esc(b.name); } }, { key: 'e', label: 'Điện (đ/kWh)', num: true, render: function (b) { return F.num(b.elecPrice); } }, { key: 'w', label: 'Nước (đ/m³)', num: true, render: function (b) { return F.num(b.waterPrice); } }, { key: 'f', label: 'Từ kỳ', render: function () { return F.period(TH.CURRENT_PERIOD); } }], rows: TH.db.buildings }) + '<p class="small muted u-mt-12">Bản demo hiển thị cấu hình hiện có; thay đổi đơn giá cần chốt (D-03).</p>',
        foot: '<button type="button" class="btn" data-close>Đóng</button>' };
    } });
  };
  TH.act['mtr.swap'] = function () {
    TH.modal.open({ key: 'mtrswap', size: 'sm', render: function () {
      var form = 'mtr-swap';
      return { title: 'Thay công tơ' + TH.up('F018.B'), sub: 'Ghi ngày thay, số chốt công tơ cũ và số đầu công tơ mới',
        body: '<div class="form-grid">' + TH.field({ form: form, name: 'room', label: 'Phòng', type: 'select', options: TH.db.rooms.filter(function (r) { var b = pickB(); return TH.inScope(r.buildingId) && (!b || r.buildingId === b); }).map(function (r) { return r.id; }) }) + TH.field({ form: form, name: 'type', label: 'Loại', type: 'select', options: [{ id: 'elec', label: 'Điện' }, { id: 'water', label: 'Nước' }] }) +
          TH.field({ form: form, name: 'at', label: 'Ngày thay', type: 'date', def: TH.TODAY }) + TH.field({ form: form, name: 'old', label: 'Số chốt công tơ cũ', num: true, def: '' }) + TH.field({ form: form, name: 'new', label: 'Số đầu công tơ mới', num: true, def: '0' }) + '</div>',
        foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="mtr.swapSave">Lưu</button>' };
    } });
  };
  TH.act['mtr.swapSave'] = function () {
    var g = function (k, d) { return TH.store.draft('mtr-swap', k, d); };
    var room = g('room', TH.db.rooms.find(function (r) { return TH.inScope(r.buildingId); }).id);
    TH.db.meterChanges.unshift({ roomId: room, type: g('type', 'elec'), at: g('at', TH.TODAY), oldCode: '—', newCode: '—', oldFinal: +g('old', 0) || 0, newStart: +g('new', 0) || 0, note: 'Ghi nhận trong demo' });
    TH.log('Thay công tơ', room, '', 'meter');
    TH.store.clearDraft('mtr-swap'); TH.modal.close('mtrswap', { silent: true }); TH.app.refresh(); TH.toast('Đã ghi nhận thay công tơ', esc(room));
  };
})();
