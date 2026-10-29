/* Khách thuê: CUS-01 (danh sách theo hồ sơ thuê), CUS-02 (hồ sơ thuê: lưu trú / hợp đồng / tài chính), OCR-CUS (OCR giấy tờ).
   F010, F011, F012, F013, F015, F031 — CR-CUS-01 (note.md §8) + áp dụng bộ trả lời CR_CUS_ANSWERS 20/10/2026 (K-01…K-09, PROPOSED). */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;
  function digits(v) { return +String(v === null || v === undefined ? '' : v).replace(/\D/g, '') || 0; }

  function contractOf(k) { return C.contractOfCustomer(k); }
  function visible(k) { var c = contractOf(k); return !c || TH.inScope(c.buildingId); }
  function roomCode(c) { return c ? c.roomId + ' — ' + c.buildingId : ''; }
  function plateHtml(v, full) { return v.plate ? '<span class="mono"' + (full ? '' : ' data-tip="Biển số che một phần — xem đầy đủ ở chi tiết khi có quyền"') + '>' + esc(full ? v.plate : TH.maskPlate(v.plate)) + '</span>' : '<span class="muted small">Không biển số</span>'; }
  function stateHtml(s, o) {
    o = o || {};
    var tags = s.tags.filter(function (t) { return !(o.skipDebt && t.axis === 'debt'); });
    return '<span class="st-cell">' + TH.badge(s.main.label, s.main.tone, { dot: true }) + tags.map(function (t) {
      return TH.badge(t.label + (t.sub && !o.compact ? ' · ' + t.sub : ''), t.tone, t.sub && o.compact ? { tip: t.sub } : {});
    }).join('') + '</span>';
  }
  function hasTag(s, id) { return s.tags.some(function (t) { return t.id === id; }); }
  var FILTERS = {
    renting: function (x) { return x.s.main.id === 'renting'; },
    ended: function (x) { return x.s.main.id === 'ended'; },
    expiring: function (x) { return hasTag(x.s, 'expiring'); },
    broken: function (x) { return hasTag(x.s, 'broken'); },
    refund: function (x) { return x.s.tags.some(function (t) { return t.axis === 'deposit' || t.id === 'refund'; }); },
    debt: function (x) { return x.d.debt > 0; },
    overdue: function (x) { return x.d.overdue > 0; },
    oa: function (x) { return !x.k.oaLinked; },
  };
  /* K-02: một dòng = một hồ sơ thuê (HĐ); khách chưa có HĐ là một dòng riêng */
  function tenancyRows() {
    var rows = [];
    TH.db.contracts.filter(function (c) { return c.status !== 'draft' && TH.inScope(c.buildingId); }).forEach(function (c) {
      var k = C.customer(c.customerId); if (!k) return;
      rows.push({ k: k, ct: c, s: C.tenancyStates(c), d: C.contractDebt(c.id) });
    });
    TH.db.customers.forEach(function (k) { if (!TH.db.contracts.some(function (c) { return c.customerId === k.id && c.status !== 'draft'; })) rows.push({ k: k, ct: null, s: C.tenancyStates(null), d: C.customerDebt(k.id) }); });
    return rows.sort(function (a, b) { var oa = a.ct ? (a.ct.status === 'active' ? 0 : 1) : 2, ob = b.ct ? (b.ct.status === 'active' ? 0 : 1) : 2; return oa - ob || (a.ct && b.ct ? (a.ct.roomId < b.ct.roomId ? -1 : 1) : 0); });
  }
  function rowParam(x) { return x.ct ? x.ct.id : x.k.id; }
  TH.act['cus.open'] = function (el) { if (el.dataset.tab) TH.store.setUi('CUS-02', 'tab', el.dataset.tab); TH.go('CUS-02', el.dataset.id); };

  /* ---------------- CUS-01 ---------------- */
  TH.views['CUS-01'] = {
    scan: function () { return ['all', 'renting', 'ended', 'expiring', 'broken', 'refund', 'debt'].map(function (st) { return { ui: { st: st } }; }); },
    render: function () {
      var S = 'CUS-01', q = TH.store.ui(S, 'q', ''), st = TH.store.ui(S, 'st', 'all');
      if (st === 'overdue' && !TH.has('F031.B')) st = 'all';
      var all = tenancyRows();
      var cnt = function (f) { return all.filter(FILTERS[f]).length; };
      var rows = all.filter(function (x) {
        var c = x.ct, b = c ? C.building(c.buildingId) : null;
        return (st === 'all' || FILTERS[st](x)) && TH.match(q, [x.k.id, x.k.name, x.k.phone, c ? c.id : '', c ? c.roomId : '', c ? c.buildingId : '', b ? b.short : '']);
      });
      var pg = TH.paginate(S, rows, 12);
      var table = TH.table({
        label: 'Danh sách hồ sơ thuê',
        mobile: { identity: 'room', primary: 'debt', visible: ['room', 'debt', 's', 'a'] },
        cols: [
          { key: 'room', label: 'Mã phòng / Mã tòa', render: function (x) { var c = x.ct; return '<a class="cell-main' + (c ? ' mono' : '') + ' nowrap" href="' + TH.router.href('CUS-02', rowParam(x)) + '">' + esc(c ? roomCode(c) : x.k.name) + '</a><div class="cell-sub nowrap">' + (c ? esc(x.k.name) + ' · <span class="mono">' + esc(c.id) + '</span>' : 'Chưa gán phòng · <span class="mono">' + x.k.id + '</span>') + '</div>'; } },
          { key: 'lead', label: 'Trưởng khu vực (TPVH)', gate: 'F006.B', nowrap: true, render: function (x) {
            var c = x.ct; if (!c) return '<span class="muted">—</span>';
            var h = C.areaHead(c.buildingId), l = C.teamLead(c.buildingId);
            return (h ? esc(C.staffName(h)) : '<span class="muted" data-tip="Chưa khai báo Trưởng phòng vận hành phụ trách khu vực của tòa — không lấy Trưởng nhóm thay thế (K-01)">Chưa phân công</span>') + '<div class="cell-sub">Trưởng nhóm: ' + (l ? esc(C.staffName(l)) : '—') + '</div>';
          } },
          { key: 'ops', label: 'NV vận hành', render: function (x) { var c = x.ct; return c ? esc(C.staffName(C.opsStaff(c.buildingId))) : '<span class="muted">—</span>'; } },
          { key: 'debt', label: 'Công nợ', num: true, render: function (x) {
            if (!x.d.debt) return '<span class="muted tnum">0 ₫</span>';
            return '<a class="tnum strong' + (x.d.overdue ? ' neg' : '') + '" href="#" data-act="cus.open" data-id="' + esc(rowParam(x)) + '" data-tab="fin">' + F.money(x.d.debt) + '</a>' + (x.d.overdue ? '<div class="cell-sub neg">quá hạn ' + x.d.overdueCount + ' kỳ</div>' : '');
          } },
          { key: 'oa', label: 'Liên kết Zalo', render: function (x) { return x.k.oaLinked ? TH.badge('Đã liên kết', 'success') : TH.badge('Chưa liên kết', 'neutral'); } },
          { key: 's', label: 'Trạng thái', render: function (x) { return stateHtml(x.s, { compact: true, skipDebt: true }); } },
          { key: 'v', label: 'Phiên bản định danh', gate: 'F010.D', render: function (x) { return 'v' + (1 + TH.db.customerHistory.filter(function (h) { return h.customerId === x.k.id; }).length); } },
          { key: 'a', label: '', kind: 'actions', render: function (x) { return '<button type="button" class="btn btn-xs" data-act="cus.open" data-priority="70" data-id="' + esc(rowParam(x)) + '">' + I('external', 'ic-sm') + 'Mở hồ sơ thuê</button>'; } },
        ],
        rows: pg.rows,
        rowAttrs: function (x) { return 'class="is-clickable" tabindex="0" data-href="' + TH.router.href('CUS-02', rowParam(x)) + '"'; },
        empty: { title: 'Không có hồ sơ phù hợp', text: 'Đổi bộ lọc hoặc từ khóa tìm kiếm.' },
      });
      var debtAll = C.sum(all, function (x) { return x.d.debt; }), overAll = C.sum(all, function (x) { return x.d.overdue; });
      var kpis = '<div class="grid-4 u-mb-16">' +
        TH.kpi({ label: 'Đang thuê', icon: 'users', value: String(cnt('renting')), foot: all.length + ' hồ sơ thuê trong phạm vi (' + cnt('ended') + ' đã kết thúc)' }) +
        TH.kpi({ label: 'Chuẩn bị hết hợp đồng', icon: 'calendar', value: String(cnt('expiring')), foot: 'Nhắc trước ' + TH.expiryDays() + ' ngày (cấu hình)', href: TH.router.href('CON-03') }) +
        TH.kpi({ label: 'Hồ sơ cọc / phá hợp đồng', icon: 'wallet', value: String(cnt('refund')), foot: cnt('broken') + ' phá HĐ · ' + all.filter(function (x) { return x.s.depositCase && TH.DEPOSIT_OPEN.indexOf(x.s.depositCase.state) > -1; }).length + ' đang xử lý cọc' }) +
        TH.kpi({ label: 'Công nợ khách', icon: 'receipt', value: F.short(debtAll), neg: overAll > 0, foot: overAll ? 'Quá hạn ' + F.money(overAll) : 'Không có khoản quá hạn' }) + '</div>';
      var chips = [{ id: 'all', label: 'Tất cả', count: all.length }, { id: 'renting', label: 'Đang thuê', count: cnt('renting') }, { id: 'expiring', label: 'Sắp hết hợp đồng (' + TH.expiryDays() + ' ngày)', count: cnt('expiring') }, { id: 'broken', label: 'Phá hợp đồng', count: cnt('broken') }, { id: 'refund', label: 'Hồ sơ cọc', count: cnt('refund') }, { id: 'ended', label: 'Đã kết thúc', count: cnt('ended') }, { id: 'debt', label: 'Còn nợ', count: cnt('debt') }]
        .concat(TH.has('F031.B') ? [{ id: 'overdue', label: 'Quá hạn', count: cnt('overdue') }] : []).concat([{ id: 'oa', label: 'Chưa liên kết Zalo', count: cnt('oa') }]);
      var actions = [
        { label: 'OCR giấy tờ', icon: 'scan', act: 'go', dataset: { href: TH.router.href('OCR-CUS') } },
        { label: 'Xuất công nợ (.xlsx)', icon: 'download', act: 'cus.debtx', gate: 'F031.B' },
        { label: 'Thêm khách', icon: 'userPlus', act: 'cus.add', primary: true, permission: 'contract.edit' }
      ];
      return TH.pageHeader({ screen: S, actions: actions, desc: 'Theo dõi khách, hợp đồng và công nợ theo từng hồ sơ thuê.' }) + TH.summaryBlock('Tổng quan hồ sơ', all.length + ' hồ sơ · ' + F.short(debtAll) + ' còn nợ', kpis) +
        '<div class="card card-flush customer-list"><div class="toolbar">' + TH.searchBox(S, 'Tìm mã phòng, mã tòa, số HĐ, tên, số liên hệ…') + '<div class="customer-filters" role="group" aria-label="Lọc hồ sơ thuê">' + TH.chips(S, 'st', chips, st) + '</div></div>' + table + TH.pager(S, pg) + '</div>' +
        '<p class="small muted u-mt-12">' + I('shield', 'ic-sm') + ' Thông tin định danh và biển số được che (mask) trong danh sách, tooltip và file xuất. Trạng thái = 1 trạng thái vòng đời + nhãn theo trục (kết thúc, thời hạn, bàn giao, cọc); công nợ tính từ hóa đơn/phiếu thu đã xác nhận. Mô hình là <b>PROPOSED</b> theo bộ trả lời K-01…K-09 (CR-CUS-01), chưa phải khách phê duyệt.</p>';
    },
    dialogs: [function () { return cusForm(); }],
  };
  TH.act['cus.debtx'] = function () {
    var list = tenancyRows().filter(function (x) { return x.d.debt > 0; });
    TH.exportXlsx('Cong_no_khach_' + TH.TODAY, [{ name: 'Cong no', title: 'Công nợ theo hồ sơ thuê — ' + TH.scopeLabel(), note: 'Dữ liệu minh họa · chỉ tính hóa đơn đã xác nhận và phiếu thu đã xác nhận · không xuất biển số/giấy tờ',
      columns: [{ label: 'Mã phòng — tòa', width: 18 }, { label: 'Số hợp đồng', width: 16 }, { label: 'Khách', width: 24 }, { label: 'Liên hệ', width: 16 }, { label: 'NV vận hành', width: 20 }, { label: 'Còn nợ', type: 'money' }, { label: 'Quá hạn', type: 'money' }, { label: 'Số kỳ quá hạn', type: 'number' }],
      rows: list.map(function (x) { var c = x.ct; return [roomCode(c), c ? c.id : '', x.k.name, x.k.phone, c ? C.staffName(C.opsStaff(c.buildingId)) : '', x.d.debt, x.d.overdue, x.d.overdueCount]; }) }]);
    TH.toast('Đã xuất công nợ', list.length + ' hồ sơ còn nợ · .xlsx');
  };
  function cusForm() {
    var form = 'cus-new', name = (TH.store.draft(form, 'name', '') || '').trim(), idNo = (TH.store.draft(form, 'idNo', '') || '').replace(/\D/g, '');
    var dup = idNo.length >= 3 ? TH.db.customers.filter(function (k) { return k.idNo.replace(/\D/g, '').slice(-3) === idNo.slice(-3); }) : [];
    return { title: 'Thêm khách (nhập tay)', sub: 'CUS-01 · có thể dùng OCR giấy tờ để điền nhanh',
      body: '<div class="stack"><div class="form-grid">' + TH.field({ form: form, name: 'name', label: 'Họ tên', def: '', required: true }) + TH.field({ form: form, name: 'dob', label: 'Ngày sinh', type: 'date', def: '' }) +
        TH.field({ form: form, name: 'phone', label: 'Số liên hệ', def: '' }) + TH.field({ form: form, name: 'idNo', label: 'Số giấy tờ', def: '', live: true, hint: 'Lưu dạng mask' }) +
        TH.field({ form: form, name: 'occupation', label: 'Nghề nghiệp', def: '' }) + TH.field({ form: form, name: 'hometown', label: 'Quê quán', def: '' }) + '</div>' +
        TH.gate('F010.B', dup.length ? '<div class="alert alert-warning">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Nghi trùng theo số giấy tờ ' + TH.up('F010.B') + '</b><span>' + dup.map(function (k) { return esc(k.id + ' · ' + k.name); }).join(', ') + '</span></div></div>' : '<div class="alert alert-success">' + I('checkCircle', 'ic-sm') + '<div class="alert-body">Kiểm trùng theo trường nhận dạng đã duyệt ' + TH.up('F010.B') + ': chưa phát hiện.</div></div>', { label: 'Kiểm trùng theo trường nhận dạng', ghost: 'self' }) + '</div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="cus.save"' + (name ? '' : ' disabled') + '>Lưu khách</button>' };
  }
  TH.act['cus.add'] = function () { TH.modal.open({ key: 'cus-form', size: 'md', render: cusForm }); };
  TH.act['cus.save'] = function () {
    var g = function (k, d) { return TH.store.draft('cus-new', k, d); };
    if (!TH.formErrors('cus-new', String(g('name', '')).trim() ? {} : {name:'Nhập họ tên khách.'})) { TH.modal.rerenderAll(); return; }
    var id = TH.recordActions.id('KH'), idNo = String(g('idNo', '')).replace(/\D/g, '');
    TH.db.customers.push({ id: id, name: g('name', ''), dob: g('dob', ''), phone: g('phone', '') || '—', idNo: idNo ? idNo.slice(0, 4) + '•••••' + idNo.slice(-3) : '—', idType: 'CCCD', hometown: g('hometown', '') || '—', occupation: g('occupation', ''), permAddress: '', note: '', vehicles: [], oaLinked: false, oaConsentAt: null, status: 'active', createdAt: TH.TODAY });
    TH.log('Thêm khách', id, g('name', ''), 'customer'); TH.store.clearDraft('cus-new'); TH.modal.close('cus-form', { silent: true }); TH.app.refresh(); TH.toast('Đã thêm khách', esc(id));
  };

  /* ---------------- CUS-02: các nhóm sửa inline (note.md §8.7 → §7.1) ---------------- */
  var INFO_LABELS = { name: 'Họ tên', dob: 'Ngày sinh', phone: 'Số điện thoại', occupation: 'Nghề nghiệp', hometown: 'Quê quán', permAddress: 'Địa chỉ thường trú', note: 'Ghi chú' };
  var CONTACT_FIELDS = ['phone', 'permAddress']; // chỉ thay đổi thông tin LIÊN HỆ mới ghi “Lịch sử thông tin liên hệ” (F010.C); mọi thay đổi khác chỉ vào audit log
  TH.SECTIONS.cusInfo = {
    title: 'Thông tin khách hàng',
    sub: 'Giữ thông tin hồ sơ hiện có + nghề nghiệp',
    perm: 'contract.edit',
    values: function (id) { var k = C.customer(id); return { name: k.name, dob: k.dob || '', phone: k.phone, occupation: k.occupation || '', hometown: k.hometown || '', permAddress: k.permAddress || '', note: k.note || '' }; },
    fields: function (id) {
      var k = C.customer(id);
      return [{ name: 'name', label: 'Họ tên', required: true }, { name: 'dob', label: 'Ngày sinh', type: 'date' },
        { html: TH.field({ name: 'idv', label: 'Giấy tờ (mask — không sửa trực tiếp)', value: k.idType + ' · ' + k.idNo, readonly: true, hint: 'Cập nhật giấy tờ qua OCR & rà soát' }) },
        { name: 'phone', label: 'Số điện thoại', hint: 'Thay đổi được ghi vào lịch sử thông tin liên hệ' }, { name: 'occupation', label: 'Nghề nghiệp', placeholder: 'VD: Nhân viên văn phòng' }, { name: 'hometown', label: 'Quê quán' },
        { name: 'permAddress', label: 'Địa chỉ thường trú', span: true }, { name: 'note', label: 'Ghi chú', type: 'textarea', span: true, rows: 2 }];
    },
    validate: function (v) { return !v.name ? 'Nhập họ tên khách.' : null; },
    save: function (id, v, changed) {
      var k = C.customer(id);
      changed.forEach(function (f) { if (CONTACT_FIELDS.indexOf(f) > -1) TH.db.customerHistory.unshift({ customerId: id, at: TH.TODAY, field: INFO_LABELS[f] || f, before: k[f] || '—', after: v[f] || '—', by: TH.me().id }); });
      Object.keys(INFO_LABELS).forEach(function (f) { k[f] = v[f]; });
    },
    log: function (id, v, changed) { var c = contractOf(C.customer(id)); return ['Sửa thông tin khách', id, (c ? roomCode(c) + ' · ' : '') + changed.map(function (f) { return INFO_LABELS[f] || f; }).join(', '), 'customer', c ? c.buildingId : null]; },
    view: function (id, v) {
      var k = C.customer(id);
      return TH.kv([['Mã khách', '<span class="mono">' + k.id + '</span>'], ['Họ tên', esc(v.name)], ['Ngày sinh', v.dob ? F.date(v.dob) : '—'], ['Giấy tờ', esc(k.idType + ' · ' + k.idNo) + ' ' + TH.badge('Đã mask', 'neutral', { icon: 'shield' })], ['Số điện thoại', esc(v.phone)],
        ['Nghề nghiệp', v.occupation ? esc(v.occupation) : '<span class="muted">Chưa cập nhật</span>'], ['Quê quán', esc(v.hometown || '—')], ['Thường trú', v.permAddress ? esc(v.permAddress) : '<span class="muted">Chưa cập nhật</span>'],
        ['Zalo OA', k.oaLinked ? TH.badge('Đã liên kết', 'success') + ' <span class="small muted">đồng ý ' + F.date(k.oaConsentAt) + '</span>' : TH.badge('Chưa liên kết — không gửi tin', 'neutral')], ['Ghi chú', v.note ? esc(v.note) : '<span class="muted">—</span>']]);
    },
  };

  /* Dòng phí theo từng HĐ (K-05): danh mục theo TH.FEE_TYPES, mỗi HĐ chọn dòng áp dụng + cách tính + hiệu lực + căn cứ; dòng cố định đồng bộ sang bộ phí lập hóa đơn (F015) */
  function priceRows(ct) { return TH.FEE_TYPES.map(function (t) { return Object.assign({ t: t }, ct.priceList.find(function (l) { return l.code === t.code; }) || { code: t.code, price: 0, method: 'na', active: false, note: '' }); }); }
  function estOf(ct, l) { var q = TH.priceQty(ct, l); return l.active && q !== null ? (+l.price || 0) * q : null; }
  function qtyLabel(ct, l) {
    var q = TH.priceQty(ct, l);
    if (!l.active) return '—';
    if (q === null) return '<span class="small muted">theo chỉ số</span>';
    if (l.method === 'per_vehicle') { var t = TH.feeType(l.code), pend = TH.vehiclesOf(ct, t.vehicleType, 'pending').length; return q + ' xe <span class="small muted">' + (l.qtySource === 'manual' ? '(ghi trong HĐ)' : '(đã xác nhận)') + '</span>' + (pend ? '<div class="cell-sub warn-text">' + pend + ' xe chờ xác nhận — chưa tính</div>' : ''); }
    return q + ' ' + (l.method === 'per_person' ? 'người' : 'phòng');
  }
  /* F012.C: so khớp xe đã xác nhận ↔ số xe ghi trong HĐ (chỉ với dòng nhập tay) */
  function parkMismatch(ct) {
    var out = [];
    ct.priceList.forEach(function (l) {
      if (!l.active || l.method !== 'per_vehicle' || l.qtySource !== 'manual') return;
      var t = TH.feeType(l.code), n = TH.vehiclesOf(ct, t.vehicleType, 'active').length, q = +l.qty || 0;
      if (n !== q) out.push(t.name + ': hồ sơ có ' + n + ' ' + t.vehicleType.toLowerCase() + ' đã xác nhận nhưng HĐ ghi ' + q + ' xe');
    });
    return out.length ? out.join('; ') : null;
  }
  TH.SECTIONS.cusPrice = {
    title: 'Dòng phí dịch vụ theo hợp đồng',
    sub: function (id) { return esc(id) + ' · lưu riêng từng HĐ — các HĐ có thể áp dụng mức giá/cách tính khác nhau'; },
    perm: 'contract.edit',
    readonly: function (id) { return C.contract(id).status !== 'active'; },
    values: function (id) {
      var v = {};
      var ct0 = C.contract(id); v.k_cycle = String(ct0.payCycle || 1); v.k_scope = ct0.cycleScope || 'rent';
      priceRows(C.contract(id)).forEach(function (l) { v['p_' + l.code] = l.method === 'na' ? '' : l.price; v['m_' + l.code] = l.method; v['s_' + l.code] = l.method === 'per_vehicle' ? (l.qtySource || 'vehicles') : ''; v['q_' + l.code] = l.method === 'per_vehicle' && l.qtySource === 'manual' ? (l.qty === undefined ? '' : l.qty) : ''; v['n_' + l.code] = l.note || ''; });
      return v;
    },
    fields: function (id) {
      var ct = C.contract(id), form = TH.secForm('cusPrice', id), vals = TH.SECTIONS.cusPrice.values(id);
      var g = function (k) { var d = TH.store.draft(form, k); return d === undefined ? vals[k] : d; };
      var oldFixed = 0, newFixed = 0;
      var rows = TH.FEE_TYPES.map(function (t) {
        var m = g('m_' + t.code), p = g('p_' + t.code), src = g('s_' + t.code) || 'vehicles', qv = g('q_' + t.code);
        var l = { code: t.code, method: m, price: digits(p), qtySource: src, qty: digits(qv), active: m !== 'na' };
        var old = ct.priceList.find(function (x) { return x.code === t.code; }) || {};
        if (old.active && TH.FIXED_METHODS.indexOf(old.method) > -1) oldFixed += (+old.price || 0) * (TH.priceQty(ct, old) || 0);
        if (l.active && TH.FIXED_METHODS.indexOf(m) > -1) newFixed += l.price * (TH.priceQty(ct, l) || 0);
        var qtyCell = m === 'per_vehicle'
          ? '<select class="select select-sm" aria-label="Nguồn số xe ' + esc(t.name) + '" data-draft="' + form + '.s_' + t.code + '"><option value="vehicles"' + (src === 'vehicles' ? ' selected' : '') + '>Xe đã xác nhận (' + TH.vehiclesOf(ct, t.vehicleType, 'active').length + ')</option><option value="manual"' + (src === 'manual' ? ' selected' : '') + '>Nhập tay theo HĐ</option></select>' + (src === 'manual' ? '<input class="input input-sm num" inputmode="numeric" style="max-width:64px;margin-top:4px" aria-label="Số xe ' + esc(t.name) + '" data-draft="' + form + '.q_' + t.code + '" data-live value="' + esc(qv) + '">' : '')
          : '<span class="small muted">' + (m === 'per_person' ? ct.people + ' người' : m === 'per_room' ? '1 phòng' : m === 'na' ? '—' : 'theo chỉ số') + '</span>';
        return '<tr><td><b>' + esc(t.name) + '</b>' + (t.hint ? '<div class="cell-sub">' + esc(t.hint) + '</div>' : '') + '</td>' +
          '<td><select class="select select-sm" aria-label="Cách tính ' + esc(t.name) + '" data-draft="' + form + '.m_' + t.code + '">' + t.methods.map(function (x) { return '<option value="' + x + '"' + (x === m ? ' selected' : '') + '>' + esc(TH.FEE_METHODS[x]) + '</option>'; }).join('') + '</select></td>' +
          '<td>' + (m === 'na' ? '<span class="muted small">—</span>' : '<input class="input input-sm num" inputmode="numeric" aria-label="Đơn giá ' + esc(t.name) + '" data-draft="' + form + '.p_' + t.code + '" data-live value="' + esc(p) + '"><div class="cell-sub">' + esc(TH.feeUnit(t.code, m)) + '</div>') + '</td>' +
          '<td>' + qtyCell + '</td>' +
          '<td><input class="input input-sm" aria-label="Ghi chú ' + esc(t.name) + '" data-draft="' + form + '.n_' + t.code + '" value="' + esc(g('n_' + t.code)) + '"></td></tr>';
      }).join('');
      var preview = TH.gate('F015.C', '<div class="alert alert-neutral u-mt-12">' + I('chart', 'ic-sm') + '<div class="alert-body"><b>Xem trước tác động ' + TH.up('F015.C') + '</b><span>Phí cố định/tháng ' + F.money(oldFixed) + ' → <b>' + F.money(newFixed) + '</b> (' + (newFixed - oldFixed >= 0 ? '+' : '') + F.money(newFixed - oldFixed) + '/tháng). Áp dụng từ kỳ sau khi lưu; hóa đơn đã lập không tính lại.</span></div></div>', { mode: 'mini', label: 'Xem trước tác động khi đổi biểu phí' });
      return [{ html: '<div class="field span-2"><div class="table-wrap"><table class="table table-compact price-edit"><thead><tr><th>Dòng phí</th><th>Cách tính</th><th>Đơn giá</th><th>SL áp dụng</th><th>Ghi chú</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + preview +
        '<div class="field-hint u-mt-8">Cách tính theo mẫu HĐ đã ký của hồ sơ này (' + esc((ct.terms || {}).templateName || '') + '). Thang máy mặc định diễn giải trong Dịch vụ chung; sạc theo kWh cần công tơ phụ — hai mục này <b>PENDING_APPROVAL</b> (K-05). Căn cứ dòng phí: ' + esc((ct.priceList[0] || {}).basis || '') + '.</div></div>' },
        { name: 'k_cycle', label: 'Kỳ thanh toán tiền phòng (cột Kỳ thanh toán)', type: 'select', options: Object.keys(TH.PAY_CYCLES).map(function (k) { return { id: k, label: TH.PAY_CYCLES[k] }; }), hint: 'Áp dụng từ chu kỳ chưa lập hóa đơn; điện nước vẫn lập theo tháng' },
        { name: 'k_scope', label: 'Đóng trước gồm', type: 'select', options: Object.keys(TH.CYCLE_SCOPES).map(function (k) { return { id: k, label: TH.CYCLE_SCOPES[k] }; }), hint: 'Ghi chú file: “2 tháng tiền nhà + dv” hoặc chỉ tiền nhà' }];
    },
    validate: function (v) {
      var bad = TH.FEE_TYPES.filter(function (t) { return v['m_' + t.code] !== 'na' && String(v['p_' + t.code]).replace(/[\s.,]/g, '') !== '' && !/^\d+$/.test(String(v['p_' + t.code]).replace(/[\s.,]/g, '')); });
      return bad.length ? 'Đơn giá phải là số: ' + bad.map(function (t) { return t.name; }).join(', ') + '.' : null;
    },
    save: function (id, v, changed) {
      var ct = C.contract(id), from = TH.addMonthsYm(TH.TODAY.slice(0, 7), 1), codes = {};
      changed.forEach(function (k) { if (/^[mpsqn]_/.test(k)) codes[k.slice(2)] = true; });
      /* CR-BILL: đổi kỳ TT áp từ kỳ sau chu kỳ đang chạy (không cắt chu kỳ đã thu) */
      if (changed.indexOf('k_cycle') > -1 || changed.indexOf('k_scope') > -1) {
        var curC = C.cycleOf(ct, TH.TODAY.slice(0, 7)), nextFrom = TH.addMonthsYm(curC.to, 1);
        ct.payCycle = +v.k_cycle || 1; ct.cycleScope = v.k_scope || 'rent'; ct.cycleFrom = nextFrom;
        ct.versions.push({ v: ct.versions.length + 1, at: TH.TODAY, by: TH.me().id, note: 'Kỳ thanh toán tiền phòng: ' + TH.PAY_CYCLES[ct.payCycle] + ' (' + TH.CYCLE_SCOPES[ct.cycleScope] + ') từ kỳ ' + F.period(nextFrom) });
      }
      ct.priceList = TH.FEE_TYPES.map(function (t) {
        var l = ct.priceList.find(function (x) { return x.code === t.code; }) || { code: t.code, from: from, basis: '' };
        var m = v['m_' + t.code];
        l.method = m; l.active = m !== 'na'; l.price = m === 'na' ? 0 : digits(v['p_' + t.code]); l.note = v['n_' + t.code] || '';
        if (m === 'per_vehicle') { l.qtySource = v['s_' + t.code] || 'vehicles'; if (l.qtySource === 'manual') l.qty = digits(v['q_' + t.code]); else delete l.qty; } else { delete l.qty; delete l.qtySource; }
        if (codes[t.code]) { l.from = from; l.basis = 'Nhập tay ' + TH.TODAY + ' · ' + C.staffName(TH.me().id); }
        return l;
      });
      if (Object.keys(codes).length) {
        TH.syncFees(ct);
        ct.versions.push({ v: ct.versions.length + 1, at: TH.TODAY, by: TH.me().id, note: 'Cập nhật dòng phí (' + Object.keys(codes).map(function (c) { return (TH.feeType(c) || { name: c }).name; }).join(', ') + ') hiệu lực từ kỳ ' + F.period(from) });
      }
    },
    log: function (id) { var ct = C.contract(id); return ['Sửa dòng phí HĐ', id, ct.roomId, 'contract', ct.buildingId]; },
    view: function (id) {
      var ct = C.contract(id), mm = parkMismatch(ct);
      var rows = priceRows(ct), on = rows.filter(function (l) { return l.active; }), off = rows.filter(function (l) { return !l.active; });
      var total = C.sum(on, function (l) { return TH.FIXED_METHODS.indexOf(l.method) > -1 ? estOf(ct, l) || 0 : 0; });
      return TH.table({ compact: true, cols: [
        { key: 'n', label: 'Dòng phí', render: function (l) { return '<b>' + esc(l.t.name) + '</b>' + (l.note ? '<div class="cell-sub" style="max-width:260px;white-space:normal">' + esc(l.note) + '</div>' : ''); } },
        { kind: 'money', key: 'p', label: 'Đơn giá', num: true, render: function (l) { return F.money(l.price) + '<div class="cell-sub">' + esc(TH.feeUnit(l.code, l.method)) + '</div>'; } },
        { key: 'm', label: 'Cách tính', render: function (l) { return esc(TH.FEE_METHODS[l.method]); } },
        { key: 'q', label: 'SL áp dụng', render: function (l) { return qtyLabel(ct, l); } },
        { kind: 'money', key: 'a', label: 'Dự kiến/tháng', num: true, render: function (l) { var e = estOf(ct, l); return e === null ? '<span class="muted small">theo sử dụng</span>' : '<b>' + F.money(e) + '</b>'; } },
        { kind: 'date', key: 'from', label: 'Hiệu lực từ kỳ', gate: 'F015.B', render: function (l) { return F.period(l.from || ct.start.slice(0, 7)) + '<div class="cell-sub">' + esc(l.basis || '') + '</div>'; } },
      ], rows: on, foot: { _label: 'Phí cố định/tháng', a: '<b>' + F.money(total) + '</b>' } }) +
        (function () { var cy = C.cycleOf(ct, TH.store.state.period); return '<p class="small u-m-t8"><b>Kỳ thanh toán tiền phòng:</b> ' + esc(TH.PAY_CYCLES[ct.payCycle || 1]) + (ct.payCycle > 1 ? ' · ' + esc(TH.CYCLE_SCOPES[ct.cycleScope || 'rent']) + ' · từ ' + F.period(ct.cycleFrom) + (cy.months > 1 ? ' · chu kỳ hiện tại ' + F.period(cy.from) + '–' + F.period(cy.to) : '') : '') + '</p>'; })() +
        '<p class="small muted u-m-t8">Dự kiến theo dòng phí — chưa gồm tiền phòng và điện/nước theo chỉ số công tơ. Dòng 0 đ (xe máy) vẫn lưu để đối chiếu số xe đăng ký.' + (off.length ? ' <b>Không áp dụng:</b> ' + off.map(function (l) { return esc(l.t.name) + (l.note ? ' (' + esc(l.note) + ')' : ''); }).join('; ') + '.' : '') + '</p>' +
        (mm ? TH.gate('F012.C', '<div class="alert alert-warning u-mt-12">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>So khớp xe – dòng phí ' + TH.up('F012.C') + '</b><span>' + esc(mm) + ' — kiểm tra trước khi lập hóa đơn; số xe tính phí lấy theo xe đã xác nhận đăng ký.</span></div></div>', { mode: 'mini', label: 'So khớp số xe ↔ dòng phí' }) : '');
    },
  };
  /* Tài sản & chỉ số bàn giao (Điều 2.2 / 4.2) — đọc từ OCR hợp đồng hoặc sửa tay; dùng làm căn cứ khấu trừ khi đối chiếu cọc */
  TH.SECTIONS.cusHandover = {
    title: 'Tài sản & chỉ số bàn giao (Điều 2.2 / 4.2)',
    sub: function (id) { var h = C.contract(id).handover; return h ? (h.assets || []).length + ' tài sản · ' + esc(h.source || 'nhập tay') : 'Chưa đọc từ hợp đồng — có thể nhập tay'; },
    perm: 'contract.edit',
    readonly: function (id) { return C.contract(id).status !== 'active'; },
    values: function (id) {
      var ct = C.contract(id), h = ct.handover || { at: ct.start, billingFrom: ct.start, elecStart: '', waterStart: '', assets: TH.HANDOVER_ASSETS };
      var v = { at: h.at || '', billingFrom: h.billingFrom || '', elecStart: h.elecStart === undefined ? '' : h.elecStart, waterStart: h.waterStart === undefined ? '' : h.waterStart };
      (h.assets || []).forEach(function (a, i) { v['q_' + i] = a.qty; v['c_' + i] = a.condition; });
      return v;
    },
    fields: function (id) {
      var ct = C.contract(id), form = TH.secForm('cusHandover', id), h = ct.handover || { assets: TH.HANDOVER_ASSETS };
      var g = function (k, d) { var x = TH.store.draft(form, k); return x === undefined ? d : x; };
      var rows = (h.assets || []).map(function (a, i) { return '<tr><td>' + esc(a.name) + '<div class="cell-sub">' + (a.group === 'equipment' ? 'Thiết bị' : 'Nội thất') + (a.unit && a.unit !== '—' ? ' · ' + esc(a.unit) : '') + '</div></td><td><input class="input input-sm num" style="max-width:70px" inputmode="numeric" aria-label="SL ' + esc(a.name) + '" data-draft="' + form + '.q_' + i + '" value="' + esc(g('q_' + i, a.qty)) + '"></td><td><input class="input input-sm" aria-label="Tình trạng ' + esc(a.name) + '" data-draft="' + form + '.c_' + i + '" value="' + esc(g('c_' + i, a.condition)) + '"></td></tr>'; }).join('');
      return [{ name: 'at', label: 'Ngày giao nhận phòng (3.1)', type: 'date' }, { name: 'billingFrom', label: 'Ngày bắt đầu tính tiền (3.2)', type: 'date' }, { name: 'elecStart', label: 'Chỉ số điện bàn giao (kWh)', num: true, inputmode: 'numeric' }, { name: 'waterStart', label: 'Chỉ số nước bàn giao (m³)', num: true, inputmode: 'numeric' },
        { html: '<div class="field span-2"><span class="field-label">Tài sản trong phòng (Điều 2.2)</span><div class="table-wrap"><table class="table table-compact price-edit"><thead><tr><th>Tài sản</th><th>SL</th><th>Tình trạng</th></tr></thead><tbody>' + rows + '</tbody></table></div><div class="field-hint">Tình trạng khác “Bình thường” sẽ hiện khi lập khấu trừ hoàn cọc.</div></div>' }];
    },
    save: function (id, v) {
      var ct = C.contract(id), base = ct.handover || { assets: TH.HANDOVER_ASSETS.map(function (a) { return Object.assign({}, a); }), source: 'Nhập tay' };
      ct.handover = { at: v.at, billingFrom: v.billingFrom, elecStart: digits(v.elecStart), waterStart: digits(v.waterStart), source: base.source && /OCR/.test(base.source) ? base.source + ' · sửa tay ' + TH.TODAY : 'Nhập tay ' + TH.TODAY, file: base.file || null,
        assets: (base.assets || []).map(function (a, i) { return { group: a.group, name: a.name, unit: a.unit, qty: v['q_' + i] === undefined ? a.qty : digits(v['q_' + i]), condition: v['c_' + i] === undefined ? a.condition : String(v['c_' + i] || a.condition) }; }) };
    },
    log: function (id) { var ct = C.contract(id); return ['Sửa tài sản/chỉ số bàn giao', id, ct.roomId, 'contract', ct.buildingId]; },
    view: function (id) {
      var ct = C.contract(id), h = ct.handover;
      if (!h) return '<div class="row" style="gap:10px;align-items:center"><span class="muted">Chưa đọc từ hợp đồng.</span>' + (ct.status === 'active' ? TH.permBtn('contract.edit', '<button type="button" class="btn btn-sm" data-act="cus.ctOcr" data-ct="' + esc(ct.id) + '">' + I('scan', 'ic-sm') + 'Đọc từ hợp đồng</button>', '') : '') + '</div>';
      var bad = (h.assets || []).filter(function (a) { return a.condition && !/^bình thường$|^sạch$/i.test(a.condition); });
      return TH.kv([['Giao nhận phòng', F.date(h.at)], ['Bắt đầu tính tiền', F.date(h.billingFrom)], ['Chỉ số bàn giao', (h.elecStart || 0) + ' kWh · ' + (h.waterStart || 0) + ' m³'], ['Nguồn', esc(h.source || '—') + (h.file ? ' · ' + esc(h.file) : '')]]) +
        '<div class="section-title u-mt-12">Tài sản trong phòng · ' + (h.assets || []).length + ' dòng' + (bad.length ? ' · ' + TH.badge(bad.length + ' dòng khác bình thường', 'warning') : '') + '</div>' +
        TH.table({ compact: true, cols: [{ key: 'n', label: 'Tài sản', render: function (a) { return esc(a.name) + '<div class="cell-sub">' + (a.group === 'equipment' ? 'Thiết bị' : 'Nội thất') + '</div>'; } }, { key: 'q', label: 'SL', num: true, render: function (a) { return a.qty + (a.unit && a.unit !== '—' ? ' ' + esc(a.unit) : ''); } }, { key: 'c', label: 'Tình trạng', render: function (a) { return /^bình thường$|^sạch$/i.test(a.condition) ? esc(a.condition) : TH.badge(a.condition, 'warning'); } }], rows: h.assets || [], scroll: true });
    },
  };
  TH.SECTIONS.cusNote = {
    title: 'Ghi chú hợp đồng',
    sub: 'Nhập tay, chỉnh sửa theo quyền',
    perm: 'contract.edit',
    values: function (id) { return { note: C.contract(id).note || '' }; },
    fields: function () { return [{ name: 'note', label: 'Ghi chú', type: 'textarea', span: true, rows: 4, placeholder: 'VD: khách xin đóng tiền ngày 28; đã thống nhất thêm 1 xe đạp điện từ 11/2026…' }]; },
    save: function (id, v) { C.contract(id).note = v.note; },
    log: function (id) { var ct = C.contract(id); return ['Sửa ghi chú HĐ', id, ct.roomId, 'contract', ct.buildingId]; },
    view: function (id, v) { return v.note ? '<p style="white-space:pre-line;margin:0">' + esc(v.note) + '</p>' : '<span class="muted">Chưa có ghi chú.</span>'; },
  };

  /* ---------------- CUS-02 ---------------- */
  function monthsOf(a, b) { return Math.max(1, Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000 / 30.44)); }
  function signLabel(ct) { var n = (ct.renewals || []).length; return n ? TH.badge('Gia hạn lần thứ ' + n, 'info', { icon: 'refresh' }) : ct.previousContractId ? TH.badge('HĐ mới nối tiếp ' + ct.previousContractId, 'info') : TH.badge('Hợp đồng lần đầu', 'neutral'); }
  function ctLink(id, tab) { return '<a class="mono" href="#" data-act="cus.open" data-id="' + esc(id) + '"' + (tab ? ' data-tab="' + tab + '"' : '') + '>' + esc(id) + '</a>'; }
  function termsBlock(c) {
    var T = c.terms || {};
    return TH.kv([
      ['Mẫu HĐ', esc(T.templateName || 'Chưa xác định') + (T.source ? ' <span class="small muted" data-tip="' + esc(T.source) + '">' + I('info', 'ic-sm') + '</span>' : '')],
      ['Gia hạn', T.autoRenew ? 'Mặc nhiên ' + T.autoRenewMonths + ' tháng nếu không báo trước ' + T.noticeDays + ' ngày (Điều 3.4) — chỉ áp dụng khi đã kiểm tra thông báo chấm dứt' : '<b>Phải xác nhận bằng văn bản</b> trước khi hết hạn — không tự gia hạn'],
      ['Khách báo trước', T.noticeDays ? T.noticeDays + ' ngày <span class="small muted">(nghĩa vụ theo HĐ)</span>' : '<span class="muted">HĐ không ghi</span>'],
      ['Cảnh báo vận hành', TH.expiryDays() + ' ngày trước hết hạn <span class="small muted">(cấu hình doanh nghiệp K-06 — khác mốc báo trước của HĐ)</span>'],
      ['Hoàn cọc', T.refundDays ? 'Trong ' + T.refundDays + ' ngày sau bàn giao (Điều 4.3)' : '<span class="muted">HĐ không ghi thời hạn — chưa xác định hạn, không tự báo quá hạn</span>'],
      ['Chấm dứt trước hạn', T.earlyTermination === 'forfeit_all' ? 'HĐ ghi mất toàn bộ cọc (Điều 4.3/7.1) — mức giữ cọc vẫn phải được duyệt theo hồ sơ' : '<span class="muted">HĐ không ghi — xử lý theo quyết định đã duyệt</span>'],
      ['Lịch thanh toán', T.payWindow ? 'Thông báo ngày ' + (T.payNoticeDay || 25) + ' · nộp ' + esc(T.payWindow) + (T.payAccount ? ' · chuyển khoản ' + esc(T.payAccount) + ' (theo thông báo)' : '') : '<span class="muted">HĐ không ghi</span>'],
      ['Phí nhượng phòng', T.transferFee ? F.money(T.transferFee) + ' <span class="small muted">(Điều 4.3 — chỉ hiển thị)</span>' : '<span class="muted">HĐ không ghi</span>'],
      ['Chậm nộp', T.lateFeePerDay ? F.money(T.lateFeePerDay) + '/ngày sau ' + (T.lateGraceDays || 0) + ' ngày (Điều 4.4.4) ' + TH.badge('Chỉ hiển thị — không tính vào công nợ', 'draft') : '<span class="muted">HĐ không ghi</span>'],
      ['Bảo hành thiết bị', T.warrantyDays ? T.warrantyDays + ' ngày kể từ bàn giao (Điều 5.2.4)' : '<span class="muted">HĐ không ghi</span>'],
    ]);
  }
  function occupantsCard(ct) {
    if (!ct) return '';
    var rows = TH.recordActions.list('occupant').filter(function (p) { return p.contractId === ct.id; });
    return '<div class="card card-flush">' + TH.cardHd('Người ở cùng', rows.length + ' hồ sơ · hợp đồng ' + esc(ct.id),
      ct.status === 'active' ? TH.permBtn('contract.edit', '<button type="button" class="btn btn-sm" data-act="cus.occupantAdd" data-ct="' + esc(ct.id) + '">' + I('plus', 'ic-sm') + 'Thêm người</button>', 'Thêm người · 403') : '') +
      TH.table({ compact: true, mobile: { identity: 'name', primary: 'dates', visible: ['name', 'relation', 'dates'] }, cols: [
        { key: 'name', label: 'Họ tên', render: function (p) { return '<b>' + esc(p.name) + '</b><div class="cell-sub">' + (p.dob ? F.date(p.dob) : 'Chưa có ngày sinh') + (p.idNo ? ' · Giấy tờ ••••' + esc(String(p.idNo).slice(-4)) : '') + '</div>'; } },
        { key: 'relation', label: 'Quan hệ', render: function (p) { return esc(p.relation || '—'); } },
        { key: 'phone', label: 'Điện thoại', render: function (p) { return esc(p.phone || '—'); } },
        { key: 'dates', label: 'Thời gian ở', render: function (p) { return F.date(p.from) + (p.to ? ' → ' + F.date(p.to) : ' → nay'); } },
      ], rows: rows, empty: { title: 'Chưa khai báo người ở cùng', text: 'Thêm hồ sơ để lưu thông tin từng người ở cùng theo hợp đồng này.' } }) +
      '<div class="card-bd"><p class="small muted u-m-0">Hồ sơ người ở cùng không tự thay đổi số người tính phí. Khai báo số người theo kỳ tại màn Điện nước để áp dụng cho kỳ mới.</p></div></div>';
  }
  function stayTab(k, c) {
    var left = TH.section('cusInfo', k.id);
    var term = c ? '<div class="card"><div class="card-hd"><div class="card-title">' + I('calendar', 'ic-sm') + 'Thời gian hợp đồng</div>' + signLabel(c) + '</div><div class="card-bd">' +
      TH.kv([['Phòng / tòa', TH.roomLink(c.roomId) + ' · ' + esc(C.building(c.buildingId).name)], ['Số HĐ', '<a class="mono" href="' + TH.router.href('CON-02', c.id) + '">' + esc(c.id) + '</a>' + (c.previousContractId ? ' <span class="small muted">nối tiếp ' + ctLink(c.previousContractId) + '</span>' : '') + (c.nextContractId ? ' <span class="small muted">→ HĐ mới ' + ctLink(c.nextContractId) + '</span>' : '')],
        ['Ngày bắt đầu', F.date(c.start)], ['Ngày kết thúc', F.date(c.end) + (c.status === 'active' ? ' <span class="small ' + (C.daysTo(c.end) <= TH.expiryDays() ? 'warn-text strong' : 'muted') + '">còn ' + C.daysTo(c.end) + ' ngày</span>' : '')],
        ['Thời hạn', monthsOf(c.start, TH.addDays(c.end, 1)) + ' tháng' + ((c.renewals || []).length ? ' <span class="small muted">(kỳ hiện hành ' + F.date(c.renewals[c.renewals.length - 1].from) + ' → ' + F.date(c.end) + ')</span>' : '')],
        ['Số người ở', c.people + ' người']].concat(c.status !== 'active' ? [['Kết thúc', F.date(c.endedAt) + ' · ' + esc(TH.END_KINDS[c.endKind] || '') + (c.endReason ? '<div class="small muted">' + esc(c.endReason) + '</div>' : '')]] : [])) +
      '<div class="section-title u-mt-16">Lần ký / gia hạn</div><ul class="timeline"><li>' + (c.previousContractId ? 'Ký HĐ mới (mã mới) nối tiếp ' + esc(c.previousContractId) : 'Ký hợp đồng lần đầu') + '<div class="when">' + F.date(c.signedAt) + ' · hiệu lực từ ' + F.date(c.start) + '</div></li>' +
      (c.renewals || []).map(function (r) { return '<li><b>Gia hạn lần ' + r.n + '</b>: ' + F.date(r.from) + ' → ' + F.date(r.to) + ' · ' + esc(TH.RENEWAL_MODES[r.mode] || r.mode) + (r.evidence ? '<div class="small muted">' + esc(r.evidence) + '</div>' : '') + (r.file ? '<div>' + TH.fileOf(r.file) + '</div>' : '') + '<div class="when">' + esc(C.staffName(r.by)) + ' · ' + F.date(r.at) + '</div></li>'; }).join('') +
      (c.status !== 'active' ? '<li><b>' + (C.isEarlyEnd(c) ? 'Kết thúc trước hạn' : 'Kết thúc hợp đồng') + '</b> · ' + esc(TH.END_KINDS[c.endKind] || '') + '<div class="when">' + F.date(c.endedAt) + '</div></li>' : '') + '</ul>' +
      '<div class="row u-mt-16 u-gap-8"><span class="section-title u-m-0">Điều khoản áp dụng (theo HĐ đã ký)</span><button type="button" class="btn btn-xs btn-ghost" data-act="cus.terms" data-ct="' + esc(c.id) + '" aria-label="Xem điều khoản áp dụng của hợp đồng ' + esc(c.id) + '">' + I('eye', 'ic-sm') + 'Xem</button></div>' +
      '<p class="small muted u-m-t8">Ngày/thời hạn của bản đã xác nhận chỉ đổi qua phụ lục, gia hạn có chứng từ hoặc HĐ mới (F014, K-09).</p>' +
      (c.status === 'active' ? '<div class="u-mt-12">' + TH.actionGroup({ context: 'card', html: '<a class="btn btn-sm" href="' + TH.router.href('CON-FOLLOW', c.id) + '">' + I('phone', 'ic-sm') + 'Ghi kết quả hỏi gia hạn</a><a class="btn btn-sm" href="' + TH.router.href('CON-02', c.id) + '">' + I('external', 'ic-sm') + 'Mở hợp đồng</a>' }) + '</div>' : '') +
      '</div></div>' : '<div class="card"><div class="card-bd">' + TH.state('empty', { title: 'Chưa gán hợp đồng', action: '<a class="btn btn-sm" href="' + TH.router.href('CON-02', 'new') + '">Tạo hợp đồng</a>' }) + '</div></div>';
    var full = TH.can('vehicle.view');
    var dups = (k.vehicles || []).map(function (v) { return { v: v, d: C.plateDup(k, v) }; }).filter(function (x) { return x.d; });
    var mm = c ? parkMismatch(c) : null;
    var veh = '<div class="card card-flush">' + TH.cardHd(I('key', 'ic-sm') + 'Phương tiện', (k.vehicles || []).filter(function (v) { return v.status === 'active'; }).length + ' xe đã xác nhận · ' + (k.vehicles || []).filter(function (v) { return v.status === 'pending'; }).length + ' chờ xác nhận', TH.permBtn('contract.edit', '<button type="button" class="btn btn-sm" data-act="veh.add" data-k="' + k.id + '">' + I('plus', 'ic-sm') + 'Thêm xe</button>', 'Thêm · 403')) +
      TH.table({ compact: true, cols: [
        { key: 't', label: 'Loại xe', render: function (v) { return esc(v.type) + (v.brand ? '<div class="cell-sub">' + esc(v.brand) + '</div>' : ''); } },
        { key: 'p', label: 'Biển số', render: function (v) { return plateHtml(v, full); } },
        { key: 'c', label: 'Màu', render: function (v) { return esc(v.color || '—'); } },
        { kind: 'date', key: 'eff', label: 'Đăng ký', render: function (v) { return F.date(v.from) + (v.to ? ' → ' + F.date(v.to) : ''); } },
        { key: 's', label: 'Trạng thái', render: function (v) { var S = TH.VEHICLE_STATES[v.status] || [v.status, 'neutral']; return TH.badge(S[0], S[1], { dot: true }); } },
        { key: 'f', label: 'Dòng phí', render: function (v) { var t = TH.feeType(v.feeCode); return t ? '<span class="small">' + esc(t.name) + '</span>' : '<span class="muted small">—</span>'; } },
        { key: 'a', label: '', render: function (v) { return TH.permBtn('contract.edit', '<div class="row u-gap-4 u-nowrap">' + (v.status === 'pending' ? '<button type="button" class="btn btn-xs btn-primary" data-act="veh.confirm" data-k="' + k.id + '" data-id="' + v.id + '">' + I('check', 'ic-sm') + 'Xác nhận</button>' : '') + '<button type="button" class="btn btn-xs" data-act="veh.edit" data-k="' + k.id + '" data-id="' + v.id + '">' + I('edit', 'ic-sm') + 'Sửa</button></div>', ''); } },
      ], rows: k.vehicles || [], empty: { title: 'Chưa khai báo xe', text: 'Thêm xe để đối chiếu dòng phí gửi xe / sạc xe điện.' } }) +
      '<div class="card-bd stack-sm">' +
      (full ? '' : '<div class="small muted">' + I('shield', 'ic-sm') + ' Biển số che một phần — vai trò hiện tại không có quyền xem đầy đủ.</div>') +
      TH.gate('F010.B', dups.length ? '<div class="alert alert-warning">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Trùng biển số trong khoảng đăng ký ' + TH.up('F010.B') + '</b><span>' + dups.map(function (x) { return esc(TH.maskPlate(x.v.plate) + ' — đang đăng ký ở ' + x.d.customer.id + ' (' + F.date(x.d.vehicle.from) + (x.d.vehicle.to ? ' → ' + F.date(x.d.vehicle.to) : ' → nay') + ')'); }).join('; ') + '</span></div></div>' : '<div class="small muted row u-gap-6">' + I('checkCircle', 'ic-sm') + ' Kiểm trùng biển số ' + TH.up('F010.B') + ': không có khoảng đăng ký chồng lấn (xe bán lại giữa hai hồ sơ liên tiếp không báo trùng).</div>', { mode: 'mini', label: 'Kiểm trùng biển số theo khoảng đăng ký' }) +
      (mm ? TH.gate('F012.C', '<div class="alert alert-warning">' + I('alert', 'ic-sm') + '<div class="alert-body"><b>Lệch với dòng phí HĐ ' + TH.up('F012.C') + '</b><span>' + esc(mm) + '.</span></div></div>', { mode: 'mini', label: 'So khớp số xe ↔ dòng phí' }) : '') + '</div></div>';
    return '<div class="grid-2">' + left + '<div class="stack">' + term + occupantsCard(c) + veh + '</div></div>';
  }
  function contractTab(k, all, ct) {
    if (!ct) return '<div class="card"><div class="card-bd">' + TH.state('empty', { title: 'Chưa có hợp đồng', action: '<a class="btn btn-sm" href="' + TH.router.href('CON-02', 'new') + '">Tạo hợp đồng</a>' }) + '</div></div>';
    var S = 'CUS-02';
    var picker = all.length > 1 ? '<div class="toolbar" style="margin-bottom:12px;padding:0">' + TH.uiSelect(S, 'ct', all.map(function (c) { return { id: c.id, label: c.id + ' · ' + c.roomId + ' · ' + TH.statusLabel(c.status === 'active' ? 'occupied' : c.status) + ' · ' + F.date(c.start) + ' → ' + F.date(c.end) }; }), ct.id, 'Chọn hợp đồng') + '<span class="small muted">Trạng thái, dòng phí và tài chính thể hiện theo từng hợp đồng</span></div>' : '';
    var files = TH.db.documents.filter(function (d) { return d.contractId === ct.id && d.kind !== 'CCCD (đã mask)'; });
    var job = TH.db.ocrJobs.find(function (j) { return j.kind === 'contract' && j.contractId === ct.id; });
    var summary = '<div class="card"><div class="card-hd"><div class="card-title">Hợp đồng ' + esc(ct.id) + '</div>' + TH.status(ct.status === 'active' && C.daysTo(ct.end) <= TH.expiryDays() ? 'expiring' : ct.status) + '</div><div class="card-bd">' +
      TH.kv([['Phòng — tòa', '<b class="mono">' + esc(roomCode(ct)) + '</b>'], ['Giá thuê', '<b class="tnum">' + F.money(ct.rent) + '</b>/tháng' + (ct.listRent && ct.listRent !== ct.rent ? ' <span class="small muted">(niêm yết ' + F.money(ct.listRent) + ')</span>' : '') + (ct.priceNote ? '<div class="cell-sub">' + esc(ct.priceNote) + '</div>' : '') + (ct.payCycle > 1 ? '<div class="cell-sub">Đóng ' + esc(TH.PAY_CYCLES[ct.payCycle]) + '</div>' : '')], ['Tiền cọc', F.money(ct.deposit)], ['Đã nộp khi ký', ct.prepaid ? F.money(ct.prepaid.total) + '<div class="small muted">' + esc(ct.prepaid.allocation) + '</div>' : '<span class="muted">Chưa đọc từ HĐ</span>'], ['Hiệu lực', F.date(ct.start) + ' → ' + F.date(ct.end)], ['Số người / xe (Điều 1)', ct.people + ' người · ' + ((ct.terms || {}).vehiclesDeclared !== undefined && (ct.terms || {}).vehiclesDeclared !== null ? ct.terms.vehiclesDeclared + ' xe máy khai báo' : 'chưa đọc số xe') + ' · ' + TH.vehiclesOf(ct, null, 'active').length + ' xe đã xác nhận'], ['Lần ký', signLabel(ct)], ['Mẫu HĐ', esc((ct.terms || {}).templateName || '—')]]) +
      '<a class="btn btn-sm u-mt-12" href="' + TH.router.href('CON-02', ct.id) + '">Mở CON-02</a></div></div>';
    var fileCard = '<div class="card card-flush">' + TH.cardHd(I('paperclip', 'ic-sm') + 'File hợp đồng', 'Gắn với khách, phòng và tòa tương ứng', '<div class="row u-gap-6"><button type="button" class="btn btn-sm" data-act="cus.ctDoc" data-ct="' + esc(ct.id) + '">' + I('eye', 'ic-sm') + 'Xem bản hợp đồng theo mẫu</button>' + (ct.status === 'active' ? TH.permBtn('contract.edit', '<button type="button" class="btn btn-sm" data-act="cus.ctUpload" data-ct="' + esc(ct.id) + '">' + I('upload', 'ic-sm') + 'Tải lên</button>', 'Tải lên · 403') : '') + '</div>') +
      '<div class="card-bd stack-sm">' + (files.map(function (d) { return '<div class="row" style="justify-content:space-between;flex-wrap:nowrap">' + TH.fileOf(d.file) + '<span class="small muted u-ta-r">' + esc(d.kind) + '<br>' + F.date(d.uploadedAt) + ' · v' + d.version + '</span></div>'; }).join('') || '<span class="muted small">Chưa có file hợp đồng.</span>') + '</div></div>';
    var ocrCard = ct.status === 'active' ? '<div class="card"><div class="card-hd"><div class="card-title">' + I('scan', 'ic-sm') + 'Đọc hợp đồng (OCR mẫu đầy đủ)</div></div><div class="card-bd stack-sm">' +
      '<p class="small muted u-m-0">Đọc bản scan theo mẫu <b>Hợp đồng cho thuê phòng — bản đầy đủ</b>: Bên B, Điều 1 (người/xe), Điều 2.2 (tài sản bàn giao), Điều 3 (giao nhận, thời hạn), Điều 4 (giá, tiền đã nộp, chỉ số, cọc, biểu phí). OCR chỉ điền <b>nháp để xác nhận</b>; không tự ghi dữ liệu, không tự lập hóa đơn.</p>' +
      '<div class="row">' + TH.permBtn('contract.edit', '<button type="button" class="btn btn-sm btn-primary" data-act="cus.ctOcr" data-ct="' + esc(ct.id) + '"' + (files.length ? '' : ' disabled') + '>' + I('scan', 'ic-sm') + 'Đọc hợp đồng</button>', 'Đọc HĐ · 403') +
      TH.permBtn('contract.edit', '<button type="button" class="btn btn-sm" data-act="sec.edit" data-key="cusPrice" data-id="' + esc(ct.id) + '">' + I('edit', 'ic-sm') + 'Nhập tay dòng phí</button>', '') + '</div>' +
      '<div class="small muted">' + (TH.has('F012.B') ? 'Gói ' + TH.store.state.pkg + ': ' + (TH.has('F012.C') ? 'có độ tin cậy từng field, so khớp phòng–khách–HĐ' : 'có độ tin cậy từng field') + (TH.has('F012.D') ? ', log sửa tay' : '') + '.' : 'Gói A: 1 mẫu HĐ đầy đủ, mỗi field/bảng phải xác nhận; chưa có độ tin cậy / so khớp.') + '</div>' +
      (job ? TH.gate('F012.D', '<div class="small">' + I('history', 'ic-sm') + ' Lần đọc gần nhất ' + F.date(job.at) + ' · ' + esc(C.staffName(job.by)) + ' · <b>' + job.corrections + '</b> mục đã sửa tay ' + TH.up('F012.D') + '</div>', { fallback: '<div class="small muted">' + I('history', 'ic-sm') + ' Lần đọc gần nhất ' + F.date(job.at) + '</div>' }) : '') +
      '</div></div>' : '';
    var hist = TH.gate('F015.D', '<div class="card"><div class="card-hd"><div class="card-title">Lịch sử dòng phí / phiên bản ' + TH.up('F015.D') + '</div></div><div class="card-bd"><ul class="timeline">' + ct.versions.slice().reverse().map(function (v) { return '<li><b>v' + v.v + '</b> · ' + esc(v.note) + '<div class="when">' + F.date(v.at) + (v.by ? ' · ' + esc(C.staffName(v.by)) : '') + '</div></li>'; }).join('') + '</ul></div></div>', { label: 'Nhiều giai đoạn giá và lịch sử thay đổi', lines: 3 });
    return picker + '<div class="grid-main-side"><div class="stack">' + TH.section('cusPrice', ct.id) + TH.section('cusHandover', ct.id) + TH.section('cusNote', ct.id) + '</div><div class="stack">' + summary + fileCard + ocrCard + hist + '</div></div>';
  }
  TH.act['cus.ctUpload'] = function (el) {
    var ct = C.contract(el.dataset.ct), n = TH.db.documents.filter(function (d) { return d.contractId === ct.id && d.kind === 'Hợp đồng thuê phòng'; }).length;
    TH.db.documents.push({ id: TH.recordActions.id('TL'), customerId: ct.customerId, contractId: ct.id, roomId: ct.roomId, kind: 'Hợp đồng thuê phòng', file: 'hop_dong_' + ct.roomId + '_' + TH.TODAY.replace(/-/g, '') + (n ? '_v' + (n + 1) : '') + '.pdf', version: n + 1, uploadedAt: TH.TODAY, views: 0 });
    TH.log('Tải file hợp đồng', ct.id, ct.roomId + ' · ' + ct.buildingId, 'contract', ct.buildingId);
    TH.app.refresh(); TH.toast('Đã lưu file hợp đồng (mô phỏng)', 'Gắn với ' + esc(ct.customerId) + ' · ' + esc(roomCode(ct)) + (TH.has('F012.B') ? '. Chọn “Tự đọc dòng phí” để nhận dạng.' : '. Dòng phí nhập tay ở gói hiện tại.'));
  };

  /* Phương tiện (K-08): biển số lưu thật (nullable), có khoảng đăng ký + trạng thái; xe mới khai → chờ xác nhận, chưa tính phí */
  var VEH_FEE = { 'Xe máy': 'PARK_MOTO', 'Xe đạp điện': 'PARK_EBIKE', 'Xe điện (dịch vụ SM)': 'PARK_EV', 'Ô tô': null };
  function vehForm(kid, vid) {
    var k = C.customer(kid), v = vid ? (k.vehicles || []).find(function (x) { return x.id === vid; }) : null, form = 'veh-' + kid + '-' + (vid || 'new');
    var full = TH.can('vehicle.view');
    return { title: (v ? 'Sửa xe' : 'Thêm xe') + ' · ' + esc(k.name), sub: 'CUS-02 › Thông tin lưu trú › Phương tiện' + (v ? ' · ' + esc((TH.VEHICLE_STATES[v.status] || [v.status])[0]) : ' · xe mới ở trạng thái chờ xác nhận đăng ký'),
      body: '<div class="form-grid">' + TH.field({ form: form, name: 'type', label: 'Loại xe', type: 'select', def: v ? v.type : 'Xe máy', options: TH.VEHICLE_TYPES }) +
        TH.field({ form: form, name: 'plate', label: 'Biển số (để trống nếu không có)', def: v ? (full ? v.plate || '' : TH.maskPlate(v.plate)) : '', placeholder: 'VD: 29B1-123.45', readonly: !!(v && !full), hint: full ? 'Lưu giá trị thật để so khớp/chống trùng; danh sách hiển thị dạng che' : 'Không có quyền xem/sửa biển số đầy đủ' }) +
        TH.field({ form: form, name: 'brand', label: 'Nhãn hiệu / kiểu xe', def: v ? v.brand || '' : '' }) + TH.field({ form: form, name: 'color', label: 'Màu', def: v ? v.color : '' }) +
        TH.field({ form: form, name: 'from', label: 'Ngày đăng ký', type: 'date', def: v ? v.from : TH.TODAY }) + TH.field({ form: form, name: 'note', label: 'Ghi chú', def: v ? v.note : '' }) + '</div>',
      foot: (v ? (v.status === 'pending' ? '<button type="button" class="btn btn-danger" data-act="veh.remove" data-k="' + kid + '" data-id="' + vid + '">' + I('trash', 'ic-sm') + 'Xóa khai báo</button>' : v.status === 'active' ? '<button type="button" class="btn" data-act="veh.end" data-k="' + kid + '" data-id="' + vid + '">' + I('xCircle', 'ic-sm') + 'Ngừng sử dụng</button>' : '') : '') + '<span class="spacer"></span><button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="veh.save" data-k="' + kid + '" data-id="' + (vid || '') + '">' + I('check', 'ic-sm') + 'Lưu xe</button>' };
  }
  TH.act['veh.add'] = function (el) { var kid = el.dataset.k; TH.store.clearDraft('veh-' + kid + '-new'); TH.modal.open({ key: 'veh', size: 'sm', render: function () { return vehForm(kid); } }); };
  TH.act['veh.edit'] = function (el) { var kid = el.dataset.k, id = el.dataset.id; TH.store.clearDraft('veh-' + kid + '-' + id); TH.modal.open({ key: 'veh', size: 'sm', render: function () { return vehForm(kid, id); } }); };
  TH.act['veh.save'] = function (el) {
    var k = C.customer(el.dataset.k), id = el.dataset.id, v = id ? k.vehicles.find(function (x) { return x.id === id; }) : null, form = 'veh-' + k.id + '-' + (id || 'new');
    var g = function (f, d) { return TH.store.draft(form, f, d); };
    var plateIn = String(g('plate', v ? v.plate || '' : '')).trim().toUpperCase();
    var plate = v && !TH.can('vehicle.view') ? v.plate : (plateIn || null);
    var type = g('type', v ? v.type : 'Xe máy');
    var rec = { type: type, plate: plate, brand: g('brand', v ? v.brand : ''), color: g('color', v ? v.color : ''), from: g('from', v ? v.from : TH.TODAY), note: g('note', v ? v.note : ''), feeCode: VEH_FEE[type] || null };
    k.vehicles = k.vehicles || [];
    if (v) Object.assign(v, rec); else { v = Object.assign({ id: 'XE-' + k.id.slice(3) + '-' + (k.vehicles.length + 1) + '-' + Date.now().toString().slice(-3), status: 'pending', to: null }, rec); k.vehicles.push(v); }
    var dup = C.plateDup(k, v), c = contractOf(k);
    TH.log(id ? 'Sửa phương tiện' : 'Khai báo phương tiện', k.id, rec.type + (rec.plate ? ' · ' + TH.maskPlate(rec.plate) : ''), 'customer', c ? c.buildingId : null);
    TH.store.clearDraft(form); TH.modal.close('veh', { silent: true }); TH.app.refresh();
    TH.toast(id ? 'Đã lưu phương tiện' : 'Đã khai báo xe — chờ xác nhận đăng ký', esc(rec.type) + (dup ? ' · trùng biển số với ' + esc(dup.customer.id) + ' trong khoảng đăng ký' : ''), dup ? 'warning' : 'success');
  };
  TH.act['veh.confirm'] = function (el) {
    var k = C.customer(el.dataset.k), v = k.vehicles.find(function (x) { return x.id === el.dataset.id; }), dup = C.plateDup(k, v);
    if (dup) { TH.toast('Chưa thể xác nhận', 'Biển số trùng với ' + esc(dup.customer.id) + ' trong khoảng đăng ký — xử lý trùng trước.', 'danger'); return; }
    v.status = 'active'; v.confirmedBy = TH.me().id; v.confirmedAt = TH.TODAY;
    var c = contractOf(k);
    TH.log('Xác nhận đăng ký xe', k.id, v.type + (v.plate ? ' · ' + TH.maskPlate(v.plate) : ''), 'customer', c ? c.buildingId : null);
    TH.app.refresh(); TH.toast('Đã xác nhận đăng ký xe', 'Dòng phí theo xe đã xác nhận sẽ tính xe này từ kỳ lập hóa đơn tiếp theo.');
  };
  TH.act['veh.end'] = function (el) {
    var k = C.customer(el.dataset.k), v = k.vehicles.find(function (x) { return x.id === el.dataset.id; });
    v.status = 'ended'; v.to = TH.TODAY;
    var c = contractOf(k);
    TH.log('Ngừng sử dụng xe', k.id, v.type + (v.plate ? ' · ' + TH.maskPlate(v.plate) : ''), 'customer', c ? c.buildingId : null);
    TH.modal.close('veh', { silent: true }); TH.app.refresh(); TH.toast('Đã ngừng sử dụng', 'Xe không còn tính phí từ kỳ tiếp theo; lịch sử đăng ký được giữ.');
  };
  TH.act['veh.remove'] = function (el) {
    var k = C.customer(el.dataset.k), v = k.vehicles.find(function (x) { return x.id === el.dataset.id; });
    TH.confirm({ title: 'Xóa khai báo xe ' + esc(v.plate ? TH.maskPlate(v.plate) : v.type) + '?', body: '<p>Chỉ xóa được xe chưa xác nhận đăng ký; thao tác được ghi audit.</p>', ok: 'Xóa', danger: true }).then(function (ok) {
      if (!ok) return;
      k.vehicles = k.vehicles.filter(function (x) { return x !== v; });
      var c = contractOf(k);
      TH.log('Xóa khai báo xe', k.id, v.type, 'customer', c ? c.buildingId : null);
      TH.modal.close('veh', { silent: true }); TH.app.refresh(); TH.toast('Đã xóa khai báo xe', esc(v.type));
    });
  };

  /* ---- Hồ sơ cọc (K-03/K-04): lập ≠ duyệt; chỉ xác nhận thực chi mới ghi sổ; hạn hoàn theo điều khoản HĐ ---- */
  function caseOf(id) { return TH.db.depositCases.find(function (x) { return x.id === id; }); }
  function depDed(hc) { return C.sum(hc.deductions, function (d) { return d.amount || 0; }); }
  /* CR-PAY: phiếu hoàn cọc theo sheet "HĐ (HOÀN CỌC)": Tiền phòng cọc − các khoản cố định (khấu hao, sửa chữa, dọn vệ sinh, sơn phòng…) = Tổng tiền hoàn cọc */
  function refundDoc(hc) {
    var ct = C.contract(hc.contractId), k = C.customer(hc.customerId), b = C.building(ct.buildingId);
    var by = {}; hc.deductions.forEach(function (d) { var it = TH.REFUND_ITEMS.indexOf(d.item) > -1 ? d.item : 'DV khác'; (by[it] = by[it] || []).push(d); });
    var rows = TH.REFUND_ITEMS.map(function (n) { var l = by[n] || []; return { name: n, amount: C.sum(l, function (d) { return d.amount || 0; }), note: l.map(function (d) { return d.name + (d.pending ? ' (chưa chốt)' : ''); }).join('; ') }; });
    var ded = C.sum(rows, function (r) { return r.amount; }), refund = hc.amount - ded - (hc.forfeitAmount || 0);
    return '<div class="print-doc bill-doc"><div class="pd-head"><div><b>TIMEHOUSE</b><br>' + esc(b.name) + '</div><div class="u-ta-r"><span class="pd-stamp">DỮ LIỆU MINH HỌA</span></div></div>' +
      '<div class="bd-title">HÓA ĐƠN HOÀN CỌC</div>' +
      '<div class="bd-meta"><span>Mã KH: <b>' + esc(ct.roomId.replace('-', '')) + 'A001</b></span><span>Phòng số: <b>' + esc(ct.roomId) + '</b></span><span>Khách: <b>' + esc(k.name) + '</b></span><span>Ngày chốt số liệu: <b>' + F.date(hc.handoverAt) + '</b></span></div>' +
      '<div class="bill-scroll"><table><thead><tr><th class="num">STT</th><th>Nội dung</th><th class="num">Thành tiền</th><th>Ghi chú</th></tr></thead><tbody>' +
      '<tr><td class="num">1</td><td><b>Tiền phòng cọc</b></td><td class="num"><b>' + F.money(hc.amount) + '</b></td><td>' + esc(ct.id) + '</td></tr>' +
      rows.map(function (r, i) { return '<tr><td class="num">' + (i + 2) + '</td><td>− ' + esc(r.name) + '</td><td class="num">' + (r.amount ? F.money(r.amount) : '') + '</td><td class="bd-sub">' + esc(r.note) + '</td></tr>'; }).join('') +
      (hc.forfeitAmount ? '<tr><td class="num">' + (rows.length + 2) + '</td><td>− Cọc bị giữ (phá HĐ)</td><td class="num">' + F.money(hc.forfeitAmount) + '</td><td class="bd-sub">' + esc(hc.forfeitBasis || '') + '</td></tr>' : '') +
      '<tr class="bd-total"><td colspan="2"><b>TỔNG TIỀN HOÀN CỌC</b></td><td class="num"><b>' + F.money(Math.max(0, refund)) + '</b></td><td>' + (refund < 0 ? '<span class="neg">Khách còn nợ ' + F.money(-refund) + ' — lập công nợ riêng</span>' : '') + '</td></tr></tbody></table></div>' +
      '<div class="bd-note"><p>Trạng thái hồ sơ: <b>' + esc((TH.DEPOSIT_STATES[hc.state] || [hc.state])[0]) + '</b>' + (hc.txnRef ? ' · ' + esc(hc.txnRef) : '') + '</p></div>' +
      '<div class="doc-c u-mt-12"><b>Xin chân thành cảm ơn khách hàng đã tin chọn Timehouse!</b></div></div>';
  }
  TH.refundDoc = refundDoc;
  TH.act['dep.doc'] = function (el) { var hc = caseOf(el.dataset.id); TH.docPreview('Phiếu hoàn cọc ' + esc(C.contract(hc.contractId).roomId), 'Theo mẫu HĐ (HOÀN CỌC) · cọc − các khoản khấu trừ', refundDoc(hc)); };
  function depositCard(ct) {
    var hc = C.depositCase(ct.id), st = hc ? hc.state : 'holding', S = TH.DEPOSIT_STATES[st], T = ct.terms || {};
    var steps = ['Chờ bàn giao', 'Đối chiếu', 'Chờ duyệt', 'Đã duyệt · chờ chi', 'Đã hoàn / tất toán'], idx = { holding: -1, awaiting_handover: 0, reconciling: 1, pending_approval: 2, approved: 3, refunded: 5, settled: 5, forfeited: 5, transferred: 5 }[st];
    var late = C.depositOverdue(hc), me = TH.me().id;
    var who = function (id, at) { return id ? esc(C.staffName(id)) + (at ? ' · ' + F.date(at) : '') : '<span class="muted">—</span>'; };
    var body = TH.kv([['Tiền cọc theo HĐ', '<b class="tnum">' + F.money(hc ? hc.amount : ct.deposit) + '</b>'], ['Trạng thái', TH.badge(S[0], S[1], { dot: true })]].concat(hc ? [
      ['Bàn giao phòng', hc.handoverAt ? F.date(hc.handoverAt) + (hc.planned ? ' <span class="small muted">(dự kiến)</span>' : '') : '<span class="muted">—</span>'],
      ['Hạn hoàn cọc', hc.dueAt ? F.date(hc.dueAt) + ' <span class="small muted">(' + T.refundDays + ' ngày sau bàn giao, theo HĐ)</span>' + (late ? ' ' + TH.badge('Quá hạn ' + (-C.daysTo(hc.dueAt)) + ' ngày', 'danger') : '') : '<span class="muted">Chưa xác định hạn — HĐ không ghi thời hạn hoàn cọc</span>'],
      ['Người lập / đề xuất', who(hc.proposedBy, hc.proposedAt)], ['Người duyệt', who(hc.approvedBy, hc.approvedAt)], ['Xác nhận thực chi', hc.paidBy ? who(hc.paidBy, hc.paidAt) + (hc.txnRef ? ' · <span class="mono small">' + esc(hc.txnRef) + '</span>' : '') : (hc.txnRef ? '<span class="mono small">' + esc(hc.txnRef) + '</span>' : '<span class="muted">—</span>')],
    ] : []).concat(hc && st === 'transferred' ? [['Chuyển sang HĐ', ctLink(hc.transferToContractId, 'fin')]] : []));
    var calc = hc && (hc.refundAmount !== null && hc.refundAmount !== undefined || hc.forfeitAmount) ? '<div class="section-title u-mt-12">Đối chiếu</div>' + TH.kv([['Cọc đã giữ', F.money(hc.amount)], ['− Khấu trừ hợp lệ', F.money(depDed(hc))], ['− Cọc bị giữ (mất cọc)', (hc.forfeitAmount ? '<span class="neg">' + F.money(hc.forfeitAmount) + '</span>' : F.money(0)) + (hc.forfeitBasis ? '<div class="small muted">' + esc(hc.forfeitBasis) + '</div>' : '')], ['= Số hoàn cho khách', '<b class="tnum">' + F.money(hc.refundAmount || 0) + '</b>']]) : '';
    var dedHtml = hc && hc.deductions.length ? '<div class="section-title u-mt-12">Khoản khấu trừ (mỗi khoản có nguồn)</div><ul class="deduction-list">' + hc.deductions.map(function (d) {
      return '<li><div class="deduction-main"><span>' + (d.item ? '<b>' + esc(d.item) + '</b> · ' : '') + esc(d.name) + '</span><span class="tnum">' + (d.pending ? TH.badge('Chưa chốt', 'warning') : F.money(d.amount)) + '</span></div><p class="small muted">' + esc(d.source || '') + '</p></li>';
    }).join('') + '</ul>' : '';
    var stepper = st === 'forfeited' ? '<div class="alert alert-danger u-mt-12">' + I('xCircle', 'ic-sm') + '<div class="alert-body"><b>Mất cọc' + (hc.refundAmount > 0 ? ' một phần' : '') + ' — theo quyết định đã duyệt, không tự suy từ lý do chấm dứt</b><span>' + esc(hc.forfeitBasis || hc.note || '') + (hc.forfeitId ? ' · ghi nhận ' + esc(hc.forfeitId) + ' (doanh thu bỏ cọc)' : '') + '</span></div></div>'
      : st === 'transferred' ? '<div class="alert alert-neutral u-mt-12">' + I('info', 'ic-sm') + '<div class="alert-body">' + esc(hc.note || '') + '</div></div>'
      : '<div class="stepper u-mt-16">' + steps.map(function (s, i) { return '<div class="step ' + (i < idx || idx === 5 ? 'is-done' : i === idx ? 'is-current' : '') + '"><span class="n">' + (i < idx || idx === 5 ? '✓' : i + 1) + '</span>' + s + '</div>' + (i < 4 ? '<span class="step-line"></span>' : ''); }).join('') + '</div>';
    var act = '', hint = '';
    if (st === 'holding' && ct.status === 'active') act = TH.permBtn('deposit.propose', '<button type="button" class="btn btn-sm" data-act="dep.open" data-ct="' + esc(ct.id) + '">' + I('plus', 'ic-sm') + 'Mở hồ sơ bàn giao / cọc</button>', 'NV vận hành / Kế toán lập · 403');
    if (ct.status === 'active' && TH.can('contract.break') && TH.inScope(ct.buildingId)) act += '<button type="button" class="btn btn-sm btn-ghost" data-act="pay.break" data-id="' + esc(ct.id) + '">' + I('xCircle', 'ic-sm') + 'Ghi nhận phá HĐ</button>';
    if (st === 'awaiting_handover') act = TH.permBtn('deposit.propose', '<button type="button" class="btn btn-sm btn-primary" data-act="dep.handover" data-id="' + hc.id + '">' + I('door', 'ic-sm') + 'Ghi nhận bàn giao phòng</button>', 'NV vận hành / Kế toán · 403');
    if (st === 'reconciling') act = TH.permBtn('deposit.propose', '<button type="button" class="btn btn-sm btn-primary" data-act="dep.review" data-id="' + hc.id + '">' + I('fileCheck', 'ic-sm') + 'Lập đối chiếu → gửi duyệt</button>', 'NV vận hành / Kế toán · 403');
    if (st === 'pending_approval') {
      var self = hc.proposedBy === me;
      act = self ? '<span class="forbidden-chip" data-tip="Người lập hồ sơ không tự duyệt hồ sơ do mình lập (K-03) — chuyển vai trò Kế toán/Admin khác để duyệt">' + I('ban', 'ic-sm') + 'Không tự duyệt hồ sơ do mình lập</span>'
        : TH.permBtn('deposit.approve', '<button type="button" class="btn btn-sm btn-primary" data-act="dep.approve" data-id="' + hc.id + '">' + I('shieldCheck', 'ic-sm') + 'Duyệt hoàn ' + F.money(hc.refundAmount || 0) + '</button><button type="button" class="btn btn-sm" data-act="dep.reject" data-id="' + hc.id + '">' + I('rotateCcw', 'ic-sm') + 'Từ chối / yêu cầu bổ sung</button>', 'Admin / Kế toán duyệt · 403');
      hint = 'Hồ sơ do ' + esc(C.staffName(hc.proposedBy)) + ' lập ' + F.date(hc.proposedAt) + '.';
    }
    if (st === 'approved') act = TH.permBtn('deposit.pay', '<button type="button" class="btn btn-sm btn-primary" data-act="dep.pay" data-id="' + hc.id + '">' + I('checkCircle', 'ic-sm') + 'Xác nhận đã chi / tất toán</button>', 'Kế toán/thủ quỹ xác nhận · 403');
    if (hc && hc.rejectNote && st === 'reconciling') hint = '<span class="warn-text">Bị trả lại: ' + esc(hc.rejectNote) + '</span>';
    return '<div class="card"><div class="card-hd"><div class="card-title">' + I('wallet', 'ic-sm') + 'Tiền cọc & hoàn cọc</div>' + TH.badge('ĐỀ XUẤT K-03/K-04', 'draft') + '</div><div class="card-bd">' + body + calc + dedHtml + stepper +
      (late ? '<div class="alert alert-danger u-mt-12">' + I('alert', 'ic-sm') + '<div class="alert-body">Quá hạn hoàn cọc theo điều khoản HĐ (' + T.refundDays + ' ngày kể từ bàn giao).</div></div>' : '') +
      (hc && st !== 'transferred' ? '<div class="row u-mt-12"><button type="button" class="btn btn-sm btn-ghost" data-act="dep.doc" data-id="' + hc.id + '">' + I('receipt', 'ic-sm') + 'Phiếu hoàn cọc (mẫu)</button></div>' : '') +
      (act ? '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">' + act + '</div>' : '') + (hint ? '<div class="small muted u-mt-8">' + hint + '</div>' : '') +
      '<p class="small muted" style="margin:10px 0 0">Luồng: lập/đề xuất khấu trừ (vận hành) → đối chiếu & duyệt (kế toán/Admin, không tự duyệt hồ sơ mình lập) → xác nhận thực chi có ngày/mã giao dịch. Chỉ bước cuối ghi dòng hoàn cọc / mất cọc vào sổ (RPT-05 chế độ Tổng, dòng tiền); P&L kinh doanh không đổi. Số hoàn = max(0, cọc − khấu trừ hợp lệ − cọc bị giữ).</p></div></div>';
  }
  function finTab(k, ct) {
    var d = ct ? C.contractDebt(ct.id) : C.customerDebt(k.id), inv = ct ? C.contractInvoices(ct.id) : C.customerInvoices(k.id);
    var others = ct ? C.customerContracts(k.id).filter(function (c) { return c.id !== ct.id && C.contractDebt(c.id).debt > 0; }) : [];
    var kpis = '<div class="grid-4 u-mb-16">' +
      TH.kpi({ label: 'Phải thu (đã xác nhận)', icon: 'receipt', value: F.short(d.due), foot: inv.length + ' hóa đơn' + (ct ? ' · ' + esc(ct.id) : '') }) +
      TH.kpi({ label: 'Đã thu (đã xác nhận)', icon: 'checkCircle', value: F.short(d.paid), foot: d.pending ? 'Báo thu chờ xác nhận ' + F.money(d.pending) + ' — chưa tính' : 'Không có báo thu chờ' }) +
      TH.kpi({ label: 'Còn nợ', icon: 'wallet', value: F.short(d.debt), neg: d.debt > 0, foot: d.debt ? 'Từ hóa đơn & phiếu thu đã xác nhận' : 'Đã thu đủ' }) +
      TH.kpi({ label: 'Quá hạn', icon: 'alert', value: d.overdueCount + '<small> kỳ</small>', neg: d.overdueCount > 0, foot: d.overdue ? F.money(d.overdue) : 'Không quá hạn' }) + '</div>';
    var table = '<div class="card card-flush">' + TH.cardHd('Hóa đơn theo kỳ', 'Số tổng hợp lấy từ hóa đơn/phiếu thu nguồn — sửa tại INV/PAY') +
      TH.table({ compact: true, cols: [
        { key: 'p', label: 'Kỳ', render: function (i) { return '<b class="nowrap" data-tip="' + esc(i.id) + '">' + F.period(i.period) + '</b>'; } },
        { kind: 'money', key: 't', label: 'Phải thu', num: true, render: function (i) { return F.money(i.total); } },
        { kind: 'money', key: 'pd', label: 'Đã thu', num: true, render: function (i) { return F.money(C.paid(i.id)); } },
        { kind: 'money', key: 'pe', label: 'Chờ xác nhận', num: true, render: function (i) { var p = C.pending(i.id); return p ? '<span class="warn-text">' + F.money(p) + '</span>' : '<span class="muted">—</span>'; } },
        { kind: 'money', key: 'd', label: 'Còn nợ', num: true, render: function (i) { var x = C.debt(i); return x ? '<b class="neg">' + F.money(x) + '</b>' : '<span class="muted">0 ₫</span>'; } },
        { kind: 'date', key: 'due', label: 'Hạn', render: function (i) { return F.date(i.dueAt); } },
        { key: 'od', label: 'Quá hạn', gate: 'F031.B', render: function (i) { var x = C.debt(i); return x && i.dueAt < TH.TODAY ? '<span class="neg strong">' + (-C.daysTo(i.dueAt)) + ' ngày</span>' : '<span class="muted">—</span>'; } },
        { kind: 'status', key: 's', label: 'Trạng thái', render: function (i) { return TH.status(C.payState(i)); } },
      ], rows: inv, empty: { title: 'Không có hóa đơn trong dữ liệu demo', text: ct && ct.status !== 'active' ? 'Dữ liệu demo chỉ sinh hóa đơn cho HĐ đang thuê từ kỳ 05/2026.' : 'Chưa lập hóa đơn cho hồ sơ này.' } }) +
      '<div class="card-ft"><a class="btn btn-sm" href="' + TH.router.href('INV-02') + '">Danh sách hóa đơn</a><a class="btn btn-sm" href="' + TH.router.href('PAY-01') + '">Báo thu / xác nhận</a>' + (others.length ? '<span class="small muted">HĐ khác của khách còn nợ: ' + others.map(function (c) { return ctLink(c.id, 'fin'); }).join(', ') + '</span>' : '') +
      (ct && ct.terms && ct.terms.lateFeePerDay ? '<span class="small muted">' + I('info', 'ic-sm') + ' HĐ ghi phạt chậm nộp ' + F.money(ct.terms.lateFeePerDay) + '/ngày sau ' + ct.terms.lateGraceDays + ' ngày (Điều 4.4.4) — chỉ hiển thị, không tính vào công nợ (PENDING_APPROVAL)</span>' : '') + '</div></div>';
    var extra = TH.gate('F031.C', '<div class="card"><div class="card-hd"><div class="card-title">Phiếu điều chỉnh công nợ ' + TH.up('F031.C') + '</div></div><div class="card-bd small muted">Điều chỉnh có lý do và cần duyệt — hồ sơ này chưa có phiếu điều chỉnh.</div></div>', { label: 'Phiếu điều chỉnh có lý do/duyệt', lines: 1 }) +
      TH.gate('F031.D', '<div class="card"><div class="card-hd"><div class="card-title">Phân bổ phiếu thu ' + TH.up('F031.D') + '</div></div><div class="card-bd small muted">Một phiếu thu được phân bổ cho nhiều hóa đơn cùng khách theo thứ tự kỳ cũ trước.</div></div>', { label: 'Phân bổ 1 phiếu thu cho nhiều hóa đơn cùng khách', lines: 1 });
    /* K-07: BLOCKED_BY_REQUIREMENT — ghi chú chờ yêu cầu, không dựng báo cáo */
    var ask = '<div class="alert alert-draft">' + I('info', 'ic-sm') + '<div class="alert-body"><b>DRAFT · BLOCKED_BY_REQUIREMENT — “danh sách khách hoà” (K-07)</b><span>Ghi chú gốc “thêm danh sách khách hoà gồm: mã phòng mã tòa” chưa đủ định nghĩa; không suy đoán, không dựng báo cáo. Cần: tên chính xác, mục đích, tiêu chí vào/ra, các trường, người xem/sửa, nguồn dữ liệu, cách lọc/xuất, tác động tới cọc/công nợ.</span></div></div>';
    return kpis + '<div class="grid-main-side"><div class="stack">' + table + extra + '</div><div class="stack">' + (ct ? depositCard(ct) : '') + ask + '</div></div>';
  }
  TH.act['dep.open'] = function (el) {
    var ct = C.contract(el.dataset.ct), fu = TH.db.followUps.filter(function (f) { return f.contractId === ct.id && f.result === 'move_out'; })[0];
    var at = fu && fu.moveOutAt ? fu.moveOutAt : ct.end;
    TH.db.depositCases.push({ id: TH.recordActions.id('HC'), contractId: ct.id, customerId: ct.customerId, amount: ct.deposit, state: 'awaiting_handover', handoverAt: at, dueAt: null, deductions: [], forfeitAmount: 0, forfeitBasis: '', refundAmount: null, proposedBy: TH.me().id, proposedAt: TH.TODAY, approvedBy: null, approvedAt: null, paidBy: null, paidAt: null, txnRef: null, note: 'Mở hồ sơ bàn giao / cọc', planned: true });
    TH.log('Mở hồ sơ cọc', ct.id, roomCode(ct), 'contract', ct.buildingId); TH.app.refresh(); TH.toast('Đã mở hồ sơ cọc', 'Bàn giao dự kiến ' + F.date(at) + '. Hạn hoàn tính khi bàn giao, theo điều khoản HĐ.');
  };
  TH.act['dep.handover'] = function (el) {
    var hc = caseOf(el.dataset.id), ct = C.contract(hc.contractId), T = ct.terms || {};
    TH.confirm({ title: 'Ghi nhận bàn giao phòng ' + esc(ct.roomId) + '?', body: '<p>Hợp đồng ' + esc(ct.id) + ' chuyển <b>Đã kết thúc</b> (lý do: trả phòng — bàn giao), phòng chuyển <b>Trống</b>. ' + (T.refundDays ? 'Hạn hoàn cọc = hôm nay + ' + T.refundDays + ' ngày (Điều 4.3 HĐ).' : 'HĐ không ghi thời hạn hoàn cọc → không đặt hạn, không tự báo quá hạn.') + '</p>', ok: 'Ghi nhận bàn giao' }).then(function (ok) {
      if (!ok || !TH.recordActions.guardLegacy('dep.handover', el)) return;
      Object.assign(hc, { state: 'reconciling', handoverAt: TH.TODAY, dueAt: T.refundDays ? TH.addDays(TH.TODAY, T.refundDays) : null, planned: false });
      if (ct.status === 'active') { ct.status = 'ended'; ct.endedAt = TH.TODAY; ct.endKind = 'handover'; ct.endReason = 'Trả phòng — bàn giao ' + F.date(TH.TODAY); }
      var room = C.room(ct.roomId);
      TH.db.roomEvents.unshift({ roomId: room.id, at: TH.TODAY, from: room.status, to: 'vacant', by: TH.me().id, note: 'Bàn giao trả phòng HĐ ' + ct.id });
      room.status = 'vacant';
      TH.log('Ghi nhận bàn giao phòng', ct.id, roomCode(ct), 'contract', ct.buildingId); TH.app.refresh(); TH.toast('Đã ghi nhận bàn giao', 'Chuyển sang bước đối chiếu cọc.');
    });
  };
  function depReviewForm(id) {
    var hc = caseOf(id), ct = C.contract(hc.contractId), form = 'dep-' + id, early = C.isEarlyEnd(ct), T = ct.terms || {};
    var amt = hc.deductions.map(function (d, i) { return digits(TH.store.draft(form, 'a' + i, String(d.amount))); });
    var extra = digits(TH.store.draft(form, 'extra', '0')), forfeit = digits(TH.store.draft(form, 'forfeit', String(hc.forfeitAmount || 0)));
    var assetAmt = TH.store.draft(form, 'asset', '') !== '' ? digits(TH.store.draft(form, 'assetAmt', '0')) : 0;
    var ded = C.sum(amt) + extra + assetAmt, refund = hc.amount - ded - forfeit;
    return { title: 'Lập đối chiếu cọc → gửi duyệt', sub: esc(hc.contractId) + ' · cọc ' + F.money(hc.amount) + ' · bàn giao ' + F.date(hc.handoverAt) + (early ? ' · kết thúc trước hạn (' + esc(TH.END_KINDS[ct.endKind] || '') + ')' : ''),
      body: '<div class="stack">' + (hc.deductions.length ? '<div class="form-grid">' + hc.deductions.map(function (d, i) { return TH.field({ form: form, name: 'a' + i, label: d.name, def: String(d.amount), num: true, inputmode: 'numeric', live: true, hint: esc(d.source || '') + (d.pending ? ' · chưa chốt — nhập số đã thống nhất' : '') }); }).join('') + '</div>' : '') +
        '<div class="form-grid">' + TH.field({ form: form, name: 'extra', label: 'Khấu trừ thêm (đ)', def: '0', num: true, inputmode: 'numeric', live: true }) + TH.field({ form: form, name: 'item', label: 'Loại khoản (mẫu phiếu hoàn cọc)', type: 'select', def: 'Khấu hao', options: TH.REFUND_ITEMS }) + TH.field({ form: form, name: 'reason', label: 'Diễn giải / nguồn chứng từ', def: '', placeholder: 'VD: tiền điện kỳ 10 chưa lập hóa đơn — chỉ số bàn giao', span: true }) + '</div>' +
        (ct.handover && ct.handover.assets && ct.handover.assets.length ? '<div class="form-grid">' + TH.field({ form: form, name: 'asset', label: 'Tài sản hư hỏng theo biên bản bàn giao (Điều 2.2)', type: 'select', def: '', options: [{ id: '', label: '— Không chọn —' }].concat(ct.handover.assets.map(function (a, i) { return { id: String(i), label: a.name + ' · ' + a.qty + (a.unit && a.unit !== '—' ? ' ' + a.unit : '') + ' · bàn giao: ' + a.condition }; })) }) + TH.field({ form: form, name: 'assetAmt', label: 'Giá trị khấu trừ (đ)', def: '0', num: true, inputmode: 'numeric', live: true, hint: 'Cần biên bản/chứng từ; căn cứ Điều 6.2.5' }) + '</div>' : '') +
        '<div class="form-grid">' + TH.field({ form: form, name: 'forfeit', label: 'Cọc bị giữ — mất cọc (đ)', def: String(hc.forfeitAmount || 0), num: true, inputmode: 'numeric', live: true, hint: early ? (T.earlyTermination === 'forfeit_all' ? 'HĐ ghi mất toàn bộ cọc khi đơn phương chấm dứt (Điều 4.3/7.1) — vẫn nhập mức giữ và cần duyệt; được hoàn một phần nếu có thỏa thuận' : 'HĐ không ghi điều khoản mất cọc — chỉ giữ cọc khi có quyết định đã duyệt') : 'Kết thúc đúng hạn — thường bằng 0' }) + TH.field({ form: form, name: 'basis', label: 'Căn cứ giữ cọc (điều khoản / quyết định)', def: hc.forfeitBasis || '', placeholder: 'VD: Điều 4.3 HĐ ký …; biên bản thỏa thuận …' }) + '</div>' +
        TH.kv([['Tổng khấu trừ', F.money(ded)], ['Cọc bị giữ', F.money(forfeit)], ['Số hoàn cho khách', '<b class="tnum ' + (refund < 0 ? 'neg' : '') + '">' + F.money(Math.max(0, refund)) + '</b>']]) +
        (refund < 0 ? '<div class="alert alert-danger">' + I('xCircle', 'ic-sm') + '<div class="alert-body">Khấu trừ + giữ cọc vượt tiền cọc — phần chênh ' + F.money(-refund) + ' lập công nợ riêng, không ghi âm.</div></div>' : '') +
        '<div class="small muted">' + I('info', 'ic-sm') + ' Gửi duyệt chuyển hồ sơ sang <b>Chờ duyệt</b>; người lập không tự duyệt. Chưa ghi sổ ở bước này.</div></div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="dep.submit" data-id="' + id + '"' + (refund < 0 || (forfeit > 0 && !(TH.store.draft(form, 'basis', hc.forfeitBasis || '') || '').trim()) ? ' disabled' : '') + '>' + I('send', 'ic-sm') + 'Gửi duyệt hoàn ' + F.money(Math.max(0, refund)) + '</button>' };
  }
  TH.act['dep.review'] = function (el) { var id = el.dataset.id; TH.modal.open({ key: 'dep', size: 'md', render: function () { return depReviewForm(id); } }); };
  TH.act['dep.submit'] = function (el) {
    var hc = caseOf(el.dataset.id), form = 'dep-' + hc.id, ct = C.contract(hc.contractId);
    hc.deductions.forEach(function (d, i) { d.amount = digits(TH.store.draft(form, 'a' + i, String(d.amount))); d.pending = false; });
    var extra = digits(TH.store.draft(form, 'extra', '0'));
    if (extra) { var item = TH.store.draft(form, 'item', 'Khấu hao'); hc.deductions.push({ item: item, name: TH.store.draft(form, 'reason', '') || item, amount: extra, source: 'Đối chiếu ' + F.date(TH.TODAY) + ' · ' + C.staffName(TH.me().id) }); }
    var ai = TH.store.draft(form, 'asset', ''), aAmt = digits(TH.store.draft(form, 'assetAmt', '0'));
    if (ai !== '' && aAmt && ct.handover && ct.handover.assets[+ai]) { var asset = ct.handover.assets[+ai]; hc.deductions.push({ item: 'Sửa chữa', name: 'Hư hỏng: ' + asset.name, amount: aAmt, source: 'Điều 2.2 · bàn giao: ' + asset.condition + ' · Điều 6.2.5 · đối chiếu ' + F.date(TH.TODAY) }); }
    hc.forfeitAmount = digits(TH.store.draft(form, 'forfeit', String(hc.forfeitAmount || 0)));
    hc.forfeitBasis = (TH.store.draft(form, 'basis', hc.forfeitBasis || '') || '').trim();
    hc.refundAmount = Math.max(0, hc.amount - depDed(hc) - hc.forfeitAmount);
    Object.assign(hc, { state: 'pending_approval', proposedBy: TH.me().id, proposedAt: TH.TODAY, rejectNote: null });
    TH.log('Gửi duyệt hoàn cọc', ct.id, 'hoàn ' + F.money(hc.refundAmount) + (hc.forfeitAmount ? ' · giữ ' + F.money(hc.forfeitAmount) : ''), 'contract', ct.buildingId);
    TH.store.clearDraft(form); TH.modal.close('dep', { silent: true }); TH.app.refresh(); TH.toast('Đã gửi duyệt', 'Chờ Kế toán/Admin khác duyệt — chưa ghi sổ.');
  };
  TH.act['dep.approve'] = function (el) {
    var hc = caseOf(el.dataset.id), ct = C.contract(hc.contractId);
    if (hc.proposedBy === TH.me().id) { TH.toast('Không tự duyệt', 'Người lập hồ sơ không duyệt hồ sơ do mình lập (K-03).', 'danger'); return; }
    Object.assign(hc, { state: 'approved', approvedBy: TH.me().id, approvedAt: TH.TODAY });
    TH.log('Duyệt hoàn cọc', ct.id, 'hoàn ' + F.money(hc.refundAmount) + (hc.forfeitAmount ? ' · giữ ' + F.money(hc.forfeitAmount) : ''), 'contract', ct.buildingId);
    TH.app.refresh(); TH.toast('Đã duyệt', 'Chờ kế toán/thủ quỹ xác nhận thực chi — chưa ghi sổ, chưa “Đã hoàn”.');
  };
  TH.act['dep.reject'] = function (el) {
    var hc = caseOf(el.dataset.id), ct = C.contract(hc.contractId);
    TH.confirm({ title: 'Trả lại hồ sơ để bổ sung?', body: '<p>Hồ sơ quay về bước <b>Đối chiếu</b>; người lập cần bổ sung chứng từ/khấu trừ rồi gửi duyệt lại.</p>', ok: 'Trả lại', danger: true }).then(function (ok) {
      if (!ok || !TH.recordActions.guardLegacy('dep.reject', el)) return;
      Object.assign(hc, { state: 'reconciling', rejectNote: 'Yêu cầu bổ sung chứng từ — ' + C.staffName(TH.me().id) + ' ' + F.date(TH.TODAY) });
      TH.log('Trả lại hồ sơ hoàn cọc', ct.id, 'yêu cầu bổ sung', 'contract', ct.buildingId); TH.app.refresh(); TH.toast('Đã trả lại hồ sơ', 'Về bước đối chiếu.');
    });
  };
  function defaultTxn(hc) { return 'CK-' + TH.TODAY.replace(/-/g, '') + '-' + hc.id.slice(-7).replace(/\D/g, '').padStart(4, '0'); }
  function depPayForm(id) {
    var hc = caseOf(id), form = 'pay-' + id;
    return { title: 'Xác nhận đã chi / tất toán cọc', sub: esc(hc.contractId) + ' · hoàn ' + F.money(hc.refundAmount || 0) + (hc.forfeitAmount ? ' · giữ ' + F.money(hc.forfeitAmount) : ''),
      body: '<div class="stack"><div class="form-grid">' + TH.field({ form: form, name: 'paidAt', label: 'Ngày thực chi', type: 'date', def: TH.TODAY }) + TH.field({ form: form, required: true, name: 'txn', label: 'Mã giao dịch / chứng từ chi', def: defaultTxn(hc), required: true }) + TH.field({ form: form, name: 'method', label: 'Hình thức', type: 'select', def: 'Chuyển khoản', options: ['Chuyển khoản', 'Tiền mặt'] }) + '</div>' +
        '<div class="small muted">' + I('info', 'ic-sm') + ' ' + (hc.refundAmount > 0 ? 'Ghi dòng <b>hoàn cọc</b> ' + F.money(hc.refundAmount) : 'Không phát sinh dòng hoàn → <b>Đã tất toán cọc</b>') + (hc.forfeitAmount ? '; ghi dòng <b>mất cọc</b> ' + F.money(hc.forfeitAmount) + ' (doanh thu bỏ cọc)' : '') + ' vào kỳ của ngày thực chi. Chỉ một bút toán cho mỗi hồ sơ, bấm lại không tạo trùng.</div></div>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="dep.paid" data-id="' + id + '">' + I('checkCircle', 'ic-sm') + 'Xác nhận</button>' };
  }
  TH.act['dep.pay'] = function (el) { var id = el.dataset.id; TH.modal.open({ key: 'deppay', size: 'sm', render: function () { return depPayForm(id); } }); };
  TH.act['dep.paid'] = function (el) {
    var hc = caseOf(el.dataset.id), ct = C.contract(hc.contractId), form = 'pay-' + hc.id;
    if (hc.state !== 'approved' || hc.depositId || hc.forfeitId) { TH.modal.close('deppay', { silent: true }); TH.toast('Đã ghi nhận trước đó', 'Hồ sơ này đã có bút toán — không ghi lần hai.', 'info'); return; }
    var paidAt = TH.store.draft(form, 'paidAt', TH.TODAY), txn = (TH.store.draft(form, 'txn', defaultTxn(hc)) || '').trim(), p = paidAt.slice(0, 7);
    if (!TH.formErrors(form, txn ? {} : { txn: 'Nhập mã giao dịch / chứng từ chi.' })) { TH.modal.rerenderAll(); return; }
    var seq = function () { return TH.recordActions.id('COC'); };
    if (hc.refundAmount > 0) { hc.depositId = seq(); TH.db.deposits.push({ id: hc.depositId, buildingId: ct.buildingId, roomId: ct.roomId, period: p, date: paidAt, type: 'refund', amount: hc.refundAmount, note: 'Hoàn cọc ' + ct.id + ' · ' + txn, status: 'confirmed', contractId: ct.id, customerId: ct.customerId, caseId: hc.id }); }
    if (hc.forfeitAmount > 0) { hc.forfeitId = seq(); TH.db.deposits.push({ id: hc.forfeitId, buildingId: ct.buildingId, roomId: ct.roomId, period: p, date: paidAt, type: 'forfeit', amount: hc.forfeitAmount, breach: C.isEarlyEnd(ct), note: 'Giữ cọc ' + ct.id + ' — ' + hc.forfeitBasis, status: 'confirmed', contractId: ct.id, customerId: ct.customerId, caseId: hc.id }); }
    Object.assign(hc, { state: hc.refundAmount > 0 ? 'refunded' : hc.forfeitAmount > 0 ? 'forfeited' : 'settled', paidBy: TH.me().id, paidAt: paidAt, txnRef: txn, method: TH.store.draft(form, 'method', 'Chuyển khoản') });
    TH.log('Xác nhận thực chi hoàn cọc', ct.id, F.money(hc.refundAmount || 0) + ' · ' + txn, 'contract', ct.buildingId);
    TH.store.clearDraft(form); TH.modal.close('deppay', { silent: true }); TH.app.refresh(); TH.toast('Đã ghi sổ', (hc.depositId ? hc.depositId + ' hoàn ' + F.money(hc.refundAmount) : 'Tất toán cọc') + (hc.forfeitId ? ' · ' + hc.forfeitId + ' giữ ' + F.money(hc.forfeitAmount) : ''));
  };

  TH.views['CUS-02'] = {
    scanParam: 'KH-003',
    scan: function () { return ['stay', 'contract', 'fin', 'docs', 'history', 'versions'].map(function (t) { return { ui: { tab: t }, param: 'KH-003' }; }).concat([{ ui: { tab: 'fin' }, param: 'HĐ-302S9/25' }, { ui: { tab: 'contract' }, param: 'HĐ-401T17/24' }, { ui: { tab: 'stay' }, param: 'HĐ-202G1/25' }, { ui: { tab: 'fin' }, param: 'HĐ-201T17/24' }]); },
    render: function (r) {
      var param = r.param || 'KH-003', k, ctParam = null;
      if (/^HĐ/.test(param)) { ctParam = C.contract(param); k = ctParam && C.customer(ctParam.customerId); } else k = C.customer(param);
      if (!k) return TH.pageHeader({ screen: 'CUS-02' }) + '<div class="card">' + TH.state('empty', { title: 'Không tìm thấy hồ sơ' }) + '</div>';
      if (!visible(k) || (ctParam && !TH.inScope(ctParam.buildingId))) return TH.pageHeader({ screen: 'CUS-02', title: k.name }) + '<div class="card">' + TH.state('forbidden', { text: 'Hồ sơ thuộc tòa ngoài phạm vi vai trò hiện tại.' }) + '</div>';
      var S = 'CUS-02', all = C.customerContracts(k.id).filter(function (c) { return c.status !== 'draft'; }), ctSel = TH.store.ui(S, 'ct', '');
      var ct = ctParam || all.find(function (x) { return x.id === ctSel; }) || contractOf(k);
      var s = C.tenancyStates(ct), d = ct ? C.contractDebt(ct.id) : C.customerDebt(k.id);
      var tabs = [{ id: 'stay', label: 'Thông tin lưu trú' }, { id: 'contract', label: 'Hợp đồng & biểu phí', count: all.length > 1 ? all.length : undefined }, { id: 'fin', label: 'Công nợ & tiền cọc', count: d.overdueCount || undefined },
        { id: 'docs', label: 'Tài liệu', count: TH.db.documents.filter(function (x) { return x.customerId === k.id; }).length }, { id: 'history', label: 'Lịch sử liên hệ', gate: 'F010.C' }, { id: 'versions', label: 'Phiên bản định danh', gate: 'F010.D' }];
      var tab = TH.resolveTab(S, tabs);
      var body;
      if (tab === 'stay') body = stayTab(k, ct);
      else if (tab === 'contract') body = contractTab(k, all, ct);
      else if (tab === 'fin') body = finTab(k, ct);
      else if (tab === 'docs') {
        var dq = TH.has('F013.B') ? TH.store.ui(S, 'dq', '') : '';
        var docs = TH.db.documents.filter(function (x) { return x.status !== 'archived' && x.customerId === k.id && TH.match(dq, [x.kind, x.file, x.contractId, x.roomId]); });
        body = '<div class="card card-flush"><div class="toolbar">' + (TH.has('F013.B') ? '<div class="input-wrap">' + I('search') + '<label class="sr-only" for="dq">Tìm tài liệu</label><input id="dq" class="input input-sm" data-ui="CUS-02.dq" value="' + esc(dq) + '" placeholder="Tìm theo HĐ/khách/phòng…"></div>' + TH.up('F013.B') : TH.gate('F013.B', '', { mode: 'btn', label: 'Tìm theo hợp đồng/khách/phòng', size: 'btn-sm' })) + '<span class="grow"></span><button type="button" class="btn btn-sm" data-act="cus.upload" data-id="' + k.id + '">' + I('upload', 'ic-sm') + 'Tải lên</button></div>' +
          TH.table({ cols: [
            { key: 'f', label: 'Tài liệu', render: function (x) { return TH.fileOf(x.file); } },
            { key: 'k', label: 'Loại', render: function (x) { return esc(x.kind); } },
            { key: 'c', label: 'Hợp đồng · phòng', render: function (x) { return esc(x.contractId) + '<div class="cell-sub">' + esc(x.roomId) + '</div>'; } },
            { kind: 'date', key: 'u', label: 'Ngày tải', render: function (x) { return F.date(x.uploadedAt); } },
            { key: 'perm', label: 'Quyền xem', gate: 'F013.C', render: function () { return '<span class="small">QL tòa + Kế toán</span>'; } },
            { key: 'v', label: 'Phiên bản · lượt xem', gate: 'F013.D', render: function (x) { return 'v' + x.version + ' · ' + x.views + ' lượt'; } },
            { key: 'a', label: '', render: function (x) { return '<button type="button" class="btn btn-xs" data-act="cus.dl" data-f="' + esc(x.file) + '">' + I('download', 'ic-sm') + 'Tải xuống</button>'; } },
          ], rows: docs, empty: { title: 'Không có tài liệu', text: 'Tải lên giấy tờ hoặc bản scan hợp đồng.' } }) + '</div>';
      } else if (tab === 'history') {
        body = '<div class="card"><div class="card-hd"><div class="card-title">Log lịch sử thông tin liên hệ ' + TH.up('F010.C') + '</div><span class="small muted">Chỉ thay đổi số điện thoại / địa chỉ liên hệ; thay đổi khác xem audit</span></div><div class="card-bd"><ul class="timeline">' + (TH.db.customerHistory.filter(function (h) { return h.customerId === k.id; }).map(function (h) { return '<li><b>' + esc(h.field) + '</b>: <s class="muted">' + esc(h.before) + '</s> → ' + esc(h.after) + '<div class="when">' + esc(C.staffName(h.by)) + ' · ' + F.date(h.at) + '</div></li>'; }).join('') || '<li class="muted">Chưa có thay đổi.</li>') + '</ul></div></div>';
      } else {
        body = '<div class="card card-flush">' + TH.cardHd('Phiên bản thông tin định danh/hợp đồng' + TH.up('F010.D')) + TH.table({ cols: [{ key: 'v', label: 'Phiên bản', render: function (x) { return '<b>v' + x.v + '</b>'; } }, { key: 'a', label: 'Từ ngày', render: function (x) { return F.date(x.at); } }, { key: 'n', label: 'Nội dung', render: function (x) { return esc(x.n); } }], rows: [{ v: 1, at: k.createdAt, n: 'Tạo từ ' + (k.id === 'KH-003' ? 'OCR CCCD (đã xác nhận)' : 'nhập tay') }].concat(TH.db.customerHistory.filter(function (h) { return h.customerId === k.id; }).slice().reverse().map(function (h, i) { return { v: i + 2, at: h.at, n: 'Cập nhật ' + h.field }; })) }) + '</div>';
      }
      var b = ct ? C.building(ct.buildingId) : null;
      return TH.pageHeader({ screen: 'CUS-02', title: ct ? roomCode(ct) : k.name, crumbs: [['Khách hàng', TH.router.href('CUS-01')], [ct ? roomCode(ct) : k.id]], status: stateHtml(s),
          facts: TH.detailFacts([['Khách thuê', '<b>' + esc(k.name) + '</b> <span class="mono small muted">' + k.id + '</span>'], ['Hợp đồng', ct ? '<a class="mono" href="' + TH.router.href('CON-02', ct.id) + '">' + esc(ct.id) + '</a>' : '<span class="muted">Chưa có</span>'], ['Tòa', b ? esc(b.name) : ''], ['Nhân viên vận hành', b ? esc(C.staffName(C.opsStaff(b.id))) : ''], ['Trưởng khu vực', b ? (C.areaHead(b.id) ? esc(C.staffName(C.areaHead(b.id))) : '<span class="muted">Chưa phân công</span>') : ''], ['Công nợ', d.debt ? '<span class="neg">' + F.money(d.debt) + '</span>' : '<span class="pos">Không nợ</span>']]),
          actions: [{ label: 'Tải lên', icon: 'upload', act: 'cus.upload', dataset: { id: k.id } }, { label: 'OCR & rà soát', icon: 'scan', href: TH.router.href('OCR-CUS', k.id), primary: true }] }) +
        '<div class="card tab-card u-mb-16">' + TH.tabs(S, tabs, tab) + '</div>' + TH.tabPanel(S, tab, body);
    },
    dialogs: [function () { return vehForm('KH-003'); }, function () { return vehForm('KH-003', 'XE-003-1'); }, function () { var c0 = C.contract('HĐ-201T17/25'); return TH.CONTRACT_OCR.workspace({ form: 'ocr-con-scan', fields: TH.CONTRACT_OCR.fieldsFor(c0), mode: 'update', ct: c0, confirmAct: 'ctocr.confirm', confirmLabel: 'Xác nhận', docTitle: c0.scanFile }); }, function () { return depReviewForm('HC-2610-01'); }, function () { return depPayForm('HC-2609-01'); }],
  };
  TH.act['cus.upload'] = function (el) {
    var k = C.customer(el.dataset.id), c = contractOf(k);
    TH.db.documents.push({ id: TH.recordActions.id('TL'), customerId: k.id, contractId: (c || {}).id || '—', roomId: (c || {}).roomId || '—', kind: 'Giấy tờ bổ sung', file: 'giay_to_bo_sung_' + k.id + '.pdf', version: 1, uploadedAt: TH.TODAY, views: 0 });
    TH.log('Tải tài liệu', k.id, 'Giấy tờ bổ sung', 'customer'); TH.store.setUi('CUS-02', 'tab', 'docs'); TH.app.refresh(); TH.toast('Đã lưu tài liệu (mô phỏng)', 'Gắn với hồ sơ ' + esc(k.id));
  };
  function occupantForm(ctId) {
    var ct = C.contract(ctId), form = 'occupant-new-' + ctId;
    return { title: 'Thêm người ở cùng', sub: 'Phòng ' + esc(ct.roomId) + ' · ' + esc(ct.id),
      body: '<div class="form-grid">' +
        TH.field({ form: form, name: 'name', label: 'Họ và tên', required: true }) +
        TH.field({ form: form, name: 'relation', label: 'Quan hệ với khách đứng tên', placeholder: 'VD: Bạn cùng phòng, người thân' }) +
        TH.field({ form: form, name: 'dob', label: 'Ngày sinh', type: 'date' }) +
        TH.field({ form: form, name: 'idNo', label: 'Số CCCD / hộ chiếu', placeholder: 'Nếu có' }) +
        TH.field({ form: form, name: 'phone', label: 'Số điện thoại' }) +
        TH.field({ form: form, name: 'from', label: 'Ngày bắt đầu ở', type: 'date', required: true, def: TH.TODAY }) +
        TH.field({ form: form, name: 'to', label: 'Ngày rời đi', type: 'date' }) +
        TH.field({ form: form, name: 'note', label: 'Ghi chú', type: 'textarea', span: true }) +
        '</div><p class="neg small" role="alert">' + esc(TH.store.draft(form, '_error', '')) + '</p>',
      foot: '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="cus.occupantSave" data-ct="' + esc(ctId) + '">Lưu người ở cùng</button>' };
  }
  TH.act['cus.occupantAdd'] = function (el) {
    var ct = C.contract(el.dataset.ct);
    if (!ct || ct.status !== 'active' || !TH.can('contract.edit') || !TH.inScope(ct.buildingId)) { TH.toast('Không thể thêm người ở cùng', 'Hợp đồng không còn hiệu lực hoặc không thuộc phạm vi thao tác.', 'warning'); return; }
    var form = 'occupant-new-' + ct.id; TH.store.clearDraft(form);
    TH.modal.open({ key: form, size: 'md', recordForm: form, render: function () { return occupantForm(ct.id); } });
  };
  TH.act['cus.occupantSave'] = function (el) {
    var ctId = el.dataset.ct, form = 'occupant-new-' + ctId, draft = TH.store.draft(form), values = { contractId: ctId };
    ['name', 'relation', 'dob', 'idNo', 'phone', 'from', 'to', 'note'].forEach(function (k) { values[k] = draft[k] === undefined ? (k === 'from' ? TH.TODAY : '') : draft[k]; });
    var result = TH.recordActions.create('occupant', values);
    if (!result.ok) { TH.store.setDraft(form, '_error', result.error); TH.modal.rerenderAll(); return; }
    TH.store.clearDraft(form); TH.modal.close(form, { silent: true }); TH.app.refresh(); TH.store.flushChecked(); TH.toast('Đã thêm người ở cùng', esc(result.record.name));
  };
  TH.act['cus.terms'] = function (el) {
    var id = el.dataset.ct, ct = C.contract(id);
    if (!ct) return;
    TH.modal.open({ key: 'cus-terms', size: 'lg', render: function () {
      return { title: 'Điều khoản áp dụng (theo HĐ đã ký)', sub: 'Hợp đồng ' + esc(id), body: termsBlock(ct), foot: '<button type="button" class="btn" data-close>Đóng</button>' };
    } });
  };
  TH.act['cus.dl'] = function (el) { TH.toast('Tệp minh họa', esc(el.dataset.f) + ' — bản demo không lưu tệp thật.', 'info'); };

  /* ---------------- OCR-CUS ---------------- */
  var FIELDS = [
    { key: 'name', label: 'Họ và tên', ocr: 'TRƯƠNG THỊ DIỆU LINH', conf: 0.95 },
    { key: 'idNo', label: 'Số CCCD', ocr: '001197••••218', conf: 0.92 },
    { key: 'dob', label: 'Ngày sinh', ocr: '1997-08-14', conf: 0.89 },
    { key: 'sex', label: 'Giới tính', ocr: 'Nữ', conf: 0.98 },
    { key: 'home', label: 'Quê quán', ocr: 'Xã Mẫu Thử, Huyện Ví Dụ, Nam Định', conf: 0.74 },
    { key: 'addr', label: 'Nơi thường trú', ocr: 'Số 9 đường Minh Họa, Hà Nội', conf: 0.79 },
  ];
  var FORM = 'ocr-cus';
  TH.views['OCR-CUS'] = {
    modal: { size: 'full' },
    ocrFields: function () { return FIELDS; },
    render: function () {
      var v = function (k) { return TH.store.draft(FORM, k, FIELDS.find(function (f) { return f.key === k; }).ocr); };
      var out = TH.ocrWorkspace({
        screen: 'OCR-CUS', form: FORM, docTitle: 'cccd_mat_truoc.jpg', fields: FIELDS,
        inc: { conf: 'F011.B', tpl: 'F011.B', match: 'F011.C', log: 'F011.D' },
        templates: TH.db.ocrTemplates.filter(function (t) { return t.kind === 'id'; }).map(function (t) { return Object.assign({}, t, { status: 'approved' }); }),
        matchTitle: 'Cảnh báo trùng hồ sơ / tính hợp lệ',
        confirmAct: 'ocrcus.confirm', confirmLabel: 'Xác nhận & lưu hồ sơ',
        checks: function () {
          var out = [], idTail = String(v('idNo')).replace(/\D/g, '').slice(-3);
          var dup = TH.db.customers.find(function (k) { return k.idNo.replace(/\D/g, '').slice(-3) === idTail; });
          out.push(dup ? { level: 'warning', text: 'Số giấy tờ trùng đuôi với hồ sơ ' + dup.id + ' · ' + esc(dup.name) + ' — kiểm tra trước khi lưu.' } : { level: 'ok', text: 'Không phát hiện hồ sơ trùng số giấy tờ.' });
          var age = 2026 - +String(v('dob')).slice(0, 4);
          out.push(age >= 18 && age < 100 ? { level: 'ok', text: 'Ngày sinh hợp lệ (' + age + ' tuổi).' } : { level: 'danger', text: 'Ngày sinh không hợp lệ theo rule.' });
          return out;
        },
        sideExtra: function () {
          return TH.gate('F011.D', '<div class="card"><div class="card-hd"><div class="card-title">' + I('chart', 'ic-sm') + 'Dashboard lỗi nhận dạng' + TH.up('F011.D') + '</div></div><div class="card-bd">' + TH.kv([['Phiếu OCR tháng 10', '14'], ['Field phải sửa', '9 / 84 (10,7%)'], ['Field hay lỗi nhất', 'Quê quán (dấu tiếng Việt)']]) + '<div class="small muted u-mt-8">Thư viện mẫu đã duyệt: ' + TH.db.ocrTemplates.filter(function (t) { return t.kind === 'id'; }).length + ' mẫu.</div></div></div>', { label: 'Thư viện mẫu đã duyệt; dashboard lỗi nhận dạng', lines: 3 });
        },
        docHtml: function (box) {
          return '<span class="sim-mark">' + TH.simBadge('Ảnh giấy tờ minh họa') + '</span>' +
            '<div style="border:2px solid var(--text-3);border-radius:14px;padding:18px 20px;background:linear-gradient(135deg,var(--n-50),var(--n-200));font-family:var(--font);font-size:12px;line-height:1.9">' +
            '<div class="doc-c" style="font-weight:700;font-size:12px;letter-spacing:.04em">CĂN CƯỚC CÔNG DÂN (MẪU MINH HỌA)</div>' +
            '<div style="display:grid;grid-template-columns:96px 1fr;gap:16px;margin-top:10px"><div style="width:96px;height:120px;border-radius:8px;background:repeating-linear-gradient(45deg,var(--n-300),var(--n-300) 6px,var(--n-200) 6px,var(--n-200) 12px);display:grid;place-items:center;color:var(--text-3);font-size:12px">Ảnh<br>đã ẩn</div><div>' +
            'Số / No.: ' + box('idNo', v('idNo')) + '<br>Họ và tên: ' + box('name', v('name')) + '<br>Ngày sinh: ' + box('dob', F.date(v('dob'))) + ' · Giới tính: ' + box('sex', v('sex')) + '<br>Quê quán: ' + box('home', v('home')) + '<br>Thường trú: ' + box('addr', v('addr')) + '</div></div></div>';
        },
      });
      out.foot = out.foot.replace('Nhập tay (fallback)', 'Nhập tay (fallback)');
      return out;
    },
  };
  TH.act['ocrcus.confirm'] = function () {
    var g = function (k) { return TH.store.draft(FORM, k, FIELDS.find(function (f) { return f.key === k; }).ocr); };
    var name = g('name').toLowerCase().replace(/(^|\s)\S/g, function (s) { return s.toUpperCase(); });
    var id = TH.recordActions.id('KH');
    TH.db.customers.push({ id: id, name: name, dob: g('dob'), phone: '—', idNo: g('idNo'), idType: 'CCCD', hometown: g('home'), oaLinked: false, oaConsentAt: null, status: 'active', createdAt: TH.TODAY });
    TH.db.documents.push({ id: TH.recordActions.id('TL'), customerId: id, contractId: '—', roomId: '—', kind: 'CCCD (đã mask)', file: 'cccd_mat_truoc.jpg', version: 1, uploadedAt: TH.TODAY, views: 0 });
    TH.log('Xác nhận OCR giấy tờ', id, name, 'customer');
    TH.store.clearDraft(FORM); TH.app.guard = null;
    TH.modal.close(TH.modal.top().key, { silent: true });
    TH.go('CUS-02', id, { replace: true });
    TH.toast('Đã lưu hồ sơ khách ' + id, 'Chỉ dữ liệu đã xác nhận được lưu. Giấy tờ lưu dạng mask.');
  };
})();
