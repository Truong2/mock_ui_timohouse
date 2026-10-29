/* Dated workflows and guards for legacy forms. Kept separate from the DOM-free service. */
(function () {
  'use strict';
  var R = TH.recordActions, C = TH.calc, clone = R.clone, esc = TH.esc;
  var can = TH.can;
  TH.can = function (permission) { var role = TH.store.state.role, actor = TH.ROLES[role] && TH.ROLES[role].staffId, user = TH.db && (TH.db.users || []).find(function (u) { return u.staffId === actor; }); if (TH.db && (!user || user.status !== 'active' || user.role !== role)) return false; return can(permission); };
  function fail(message) { return { ok: false, error: message }; }
  function ensure(ok, message) { if (!ok) throw Error(message); }
  function done(result) { if (result.ok) { TH.store.persist(); TH.app.refresh(); } TH.toast(result.ok ? 'Đã lưu thay đổi' : 'Chưa thể thực hiện', esc(result.error || result.record && result.record.id || ''), result.ok ? 'success' : 'warning'); return result; }
  R.defaultPeriod = function (sourcePeriod) { var ps = R.openPeriods().filter(function (p) { return p >= (sourcePeriod || ''); }); return ps.indexOf(TH.store.state.period) >= 0 ? TH.store.state.period : ps[0]; };
  R.cashFlow = function (period, scope) {
    var inflow = 0, outflow = 0, entries = [];
    function add(amount, r, type) { var b = R.building(type, r); if (scope && scope !== 'ALL' && b !== scope || !TH.inScope(b)) return; if (amount >= 0) inflow += amount; else outflow -= amount; entries.push({ type: type, id: r.id, amount: amount, correctionId: r.correctionId || null }); }
    TH.db.receipts.filter(function (r) { return r.status === 'confirmed' && String(r.receivedAt).slice(0, 7) === period && (!r.correctionId || r.cashMovement); }).forEach(function (r) { add(r.amount, r, 'receipt'); });
    TH.db.deposits.filter(function (r) { return r.status === 'confirmed' && r.period === period && r.type !== 'forfeit' && (!r.correctionId || r.cashMovement); }).forEach(function (r) { add(r.type === 'in' ? r.amount : -r.amount, r, 'deposit'); });
    TH.db.expenses.filter(function (r) { return r.status === 'approved' && r.period === period && !r.correctionId && r.paid !== false; }).forEach(function (r) { add(-r.amount, r, 'expense'); });
    TH.db.landlordPays.forEach(function (r) { if (r.transactions) r.transactions.filter(function (t) { return t.at.slice(0, 7) === period && !t.expenseId; }).forEach(function (t) { add(-t.amount, r, 'landlordPay'); }); else if (r.paid && String(r.paidAt).slice(0, 7) === period && !TH.db.expenses.some(function (e) { return e.status === 'approved' && e.paid !== false && (e.landlordPayId === r.id || e.docNo && e.docNo === r.docNo); })) add(-r.paid, r, 'landlordPay'); });
    R.list('correction').filter(function (r) { return r.status === 'approved' && r.mode === 'cash' && r.targetPeriod === period && ['expense', 'landlordPay'].indexOf(r.sourceType) >= 0; }).forEach(function (r) { add(-r.delta, r, 'correction'); });
    return { inflow: inflow, outflow: outflow, net: inflow - outflow, entries: entries };
  };
  R.definitions.leaseDraft = { type: 'leaseDraft', collection: 'leaseDrafts', label: 'Hợp đồng thuê tòa nháp', permission: 'lease.edit', screen: 'BLD-01', detail: '', fields: ['buildingId', 'ownerId', 'rent', 'deposit', 'start', 'end', 'payCycle', 'payTo', 'note'] };
  R.definitions.salaryInput = { type: 'salaryInput', collection: 'salaryInputs', label: 'Đầu vào lương', permission: 'salary.edit', screen: 'SAL-01', detail: '', fields: ['base', 'allowance'] };
  var isPosted = R.isPosted, amountOf = R.amount;
  R.isPosted = function (type, r) { return isPosted(type, r) || type === 'salaryInput' && (!!(TH.db.payrollSnapshots || {})[r.period] || TH.periodLocked(r.period)); };
  R.amount = function (type, r) { return type === 'salaryInput' ? +r.base + +r.allowance : amountOf(type, r); };
  var makeCorrection = R.makeCorrection;
  R.makeCorrection = function (type, source, p) { if (['salaryInput', 'salaryAdjustment'].indexOf(type) >= 0) ensure(!TH.db.payrollStatus[p.targetPeriod] || TH.db.payrollStatus[p.targetPeriod].status === 'draft', 'Kỳ lương đích đã xác nhận; chọn kỳ lương đang mở.'); return makeCorrection.apply(this, arguments); };
  R.rateAt = function (r, period) { var changes = (r.rateChanges || []).filter(function (x) { return x.from <= period; }).sort(function (a, b) { return a.from.localeCompare(b.from); }); return changes.length ? changes[changes.length - 1].rent : (r.rateBaseRent === undefined ? r.rent : r.rateBaseRent); };
  R.contractAt = function (ct, period) {
    var next = clone(ct); next.rent = R.rateAt(ct, period); if (ct.rateBasePriceList) next.priceList = clone(ct.rateBasePriceList);
    (ct.rateChanges || []).filter(function (r) { return r.from <= period; }).sort(function (a, b) { return a.from.localeCompare(b.from); }).forEach(function (r) { next.rent = r.rent; if (r.priceList) next.priceList = clone(r.priceList); if (r.payCycle) { next.payCycle = r.payCycle; next.cycleFrom = r.from; } });
    TH.syncFees(next); return next;
  };
  var buildInvoice = TH.buildInvoice;
  TH.buildInvoice = function (db, ct, period, status) { return buildInvoice(db, R.contractAt(ct, period), period, status); };
  // A room can have its regular invoice plus corrections dated into this period.
  var roomBill = C.roomBill;
  C.roomBill = function (roomId, period) {
    var previousPeriod = R.asOf; R.asOf = period;
    try {
      var row = roomBill(roomId, period), additional = TH.db.invoices.filter(function (i) { return i.roomId === roomId && i.period === period && i.status === 'confirmed' && i !== row.invoice; });
      if (!additional.length) return row;
      var difference = C.sum(additional, function (i) { return i.total; }); row.invTotal += difference; row.due += difference;
      additional.forEach(function (i) { row.pending += C.pending(i.id); C.receiptsOf(i.id).filter(function (r) { return r.status === 'confirmed'; }).forEach(function (r) { row.receipts.push({ id: r.id, at: r.receivedAt, amount: r.amount, kind: 'cur' }); row.paid += r.amount; }); });
      row.balance = row.paid - row.due; row.state = C.billState(row.due, row.paid, true); return row;
    } finally { R.asOf = previousPeriod; }
  };
  var dependencies = R.dependencies;
  R.dependencies = function (type, r, activeOnly) {
    var links = dependencies(type, r, activeOnly);
    if (!activeOnly && type === 'asset' && (r.expenseId || r.group === 'owner' && r.since && !r.createdBy)) links.push({ collection: r.expenseId ? 'expenses' : 'handover', id: r.expenseId || r.buildingId });
    if (!activeOnly && type === 'document' && r.leaseId) links.push({ collection: 'leases', id: r.leaseId });
    if (!activeOnly && type === 'customerDocument' && r.contractId && r.contractId !== '—' && !r.createdBy) links.push({ collection: 'contracts', id: r.contractId });
    if (!activeOnly && type === 'landlordPay') TH.db.expenses.filter(function (e) { return e.landlordPayId === r.id || e.category === 'owner_rent' && e.buildingId === r.buildingId && e.period >= r.from && e.period <= r.to && e.status === 'approved'; }).forEach(function (e) { links.push({ collection: 'expenses', id: e.id, record: e }); });
    return links;
  };
  var inspect = R.inspect;
  R.inspect = function (type, id, action) {
    var r = action === 'restore' ? (R.trash(type, id) || {}).record : R.get(type, id);
    var special = type === 'leaseDraft' && action === 'approve' || type === 'oaTemplate' && action === 'approve' || type === 'oaSchedule' && action === 'run' || (type === 'document' || type === 'customerDocument') && (action === 'unlink' || action === 'activate' && r && r.status === 'archived') || type === 'assignment' && action === 'transfer';
    var out = inspect(type, id, special ? 'view' : action);
    function no(s) { return Object.assign(out, { allowed: false, reason: s }); }
    if (!out.allowed) return out;
    if (action === 'correct' && !R.openPeriods().some(function (p) { return p >= R.period(type, r) && (['salaryInput', 'salaryAdjustment'].indexOf(type) < 0 || !TH.db.payrollStatus[p] || TH.db.payrollStatus[p].status === 'draft'); })) return no('Không có kỳ phù hợp đang mở để ghi nhận điều chỉnh.');
    if (special && !TH.can(R.definitions[type].permission) && !(type === 'assignment' && TH.can('master.edit'))) return no('Không có quyền thao tác.');
    if (type === 'leaseDraft' && action === 'approve' && r.status !== 'draft') return no('Hợp đồng nháp đã xử lý.');
    if (type === 'oaTemplate' && action === 'approve' && r.status !== 'draft') return no('Mẫu tin đã xử lý.');
    if (type === 'oaTemplate' && action === 'approve' && ['admin', 'accountant'].indexOf(TH.store.state.role) < 0) return no('Kế toán hoặc Admin duyệt mẫu tin.');
    if (type === 'oaSchedule' && action === 'run' && r.status !== 'active') return no('Lịch đang tạm dừng.');
    if (type === 'oaSchedule' && (action === 'activate' || action === 'restore' && r.status === 'active') && R.list(type).filter(function (x) { return x.status === 'active'; }).length >= (TH.has('F027.B') ? 3 : 1)) return no('Đã đủ số lịch nhắc đang hoạt động của gói; tạm dừng lịch khác trước.');
    if (type === 'oaSchedule' && action !== 'view' && !TH.has('F027.B') && R.list(type).filter(function (x) { return x.status === 'active'; }).indexOf(r) > 0) return no('Gói A có một lịch nhắc; nhiều lịch từ gói B.');
    if (type === 'assignment' && ['edit', 'delete'].indexOf(action) >= 0 && r.from < TH.TODAY) return no('Phân công đã có hiệu lực; dùng Điều chuyển hoặc Kết thúc theo ngày để giữ lịch sử.');
    if (type === 'assignment' && action === 'transfer' && (r.to || r.status === 'ended')) return no('Phân công đã kết thúc.');
    if ((type === 'document' || type === 'customerDocument') && action === 'unlink' && r.status === 'archived') return no('Tài liệu đã được gỡ liên kết.');
    if (action === 'end' && r.scheduledEnd) return no('Đã ghi nhận ngày kết thúc ' + r.scheduledEnd + '; không ghi trùng.');
    if (type === 'contractDraft' || type === 'leaseDraft') if (r.status !== 'draft' && ['edit', 'delete'].indexOf(action) >= 0) return no('Bản nháp đã được duyệt, mở hợp đồng hiệu lực.');
    if (type === 'staff' && action === 'delete' && TH.db.users.some(function (u) { return u.staffId === r.id; })) return no('Nhân sự đã có tài khoản; ngừng hoạt động sau khi kết thúc phân công.');
    if (type === 'share' && action === 'edit' && r.from < TH.store.state.period + '-01') return no('Dòng tỷ lệ đã dùng: điều chỉnh cả bảng theo kỳ để giữ lịch sử.');
    if (['contract', 'lease'].indexOf(type) >= 0 && action === 'terms' && r.status !== 'active') return no('Chỉ điều chỉnh điều khoản hợp đồng đang hiệu lực.');
    if (type === 'receipt' && action === 'submit' && (!C.invoice(r.invoiceId) || C.invoice(r.invoiceId).status !== 'confirmed')) return no('Hóa đơn liên quan không còn hiệu lực.');
    if (type === 'invoice' && action === 'cancel' && R.list('correction').some(function (c) { return c.sourceType === type && c.sourceId === id && ['draft', 'pending'].indexOf(c.status) >= 0; })) return no('Hóa đơn còn phiếu điều chỉnh chưa xử lý; rút hoặc trả lại phiếu trước khi hủy.');
    if (action === 'restore') {
      if (type === 'user' && TH.db.users.some(function (x) { return x.username === r.username; })) return no('Tên đăng nhập đã tồn tại.');
      if (type === 'room' && TH.db.rooms.some(function (x) { return x.buildingId === r.buildingId && x.code && x.code === r.code; })) return no('Mã phòng đã tồn tại trong tòa.');
      if (type === 'vehicle') { var parent = C.customer((R.trash(type, id) || {}).parentId); if (!parent || parent.status === 'inactive' || !R.visible('customer', parent)) return no('Hồ sơ khách cha không hợp lệ hoặc ngoài phạm vi.'); }
      if (type === 'team' && (!C.staff(r.leaderId) || C.staff(r.leaderId).status !== 'active')) return no('Trưởng nhóm không còn hoạt động.');
      if (type === 'staff' && !TH.db.teams.some(function (t) { return t.id === r.team && t.status !== 'inactive'; })) return no('Đội nhóm không còn hoạt động.');
      if (r.invoiceId && C.invoice(r.invoiceId) && C.invoice(r.invoiceId).status === 'cancelled') return no('Hóa đơn cha đã bị hủy.');
    }
    return out;
  };
  var create = R.create;
  R.create = function (type, values) {
    if (type !== 'leaseDraft') {
      if (type === 'oaSchedule' && !TH.has('F027.B') && R.list(type).some(function (r) { return r.status === 'active'; })) return fail('Gói A có một lịch nhắc đang hoạt động.');
      if (type === 'oaTemplate' && !TH.has('F026.B') && R.list(type).filter(function (r) { return r.status !== 'inactive'; }).length >= 2) return fail('Tạo thêm mẫu ngoài hai mẫu cơ bản có từ gói B.');
      if (type === 'oaSchedule' && TH.has('F027.B') && R.list(type).filter(function (r) { return r.status === 'active'; }).length >= 3) return fail('Tối đa ba mốc nhắc đang hoạt động.');
      return create(type, values);
    }
    try {
      ensure(TH.can('lease.edit'), 'Không có quyền tạo hợp đồng thuê tòa.');
      var b = C.building(values.buildingId), o = C.owner(values.ownerId);
      ensure(b && o && TH.inScope(b.id) && b.status !== 'inactive' && o.status !== 'inactive', 'Chọn tòa và chủ nhà đang hoạt động trong phạm vi.');
      var r = Object.assign({ id: R.id('HĐT-NHÁP'), status: 'draft', createdBy: TH.me().id }, values); R.list(type).push(r); R.audit(type, r, 'create', null); TH.store.persist(); return { ok: true, record: r };
    } catch (e) { return fail(e.message); }
  };
  var execute = R.execute;
  R.formAdapter = function (type) { var key = { owner: 'ownInfo', building: 'bldInfo', customer: 'cusInfo' }[type]; return key && TH.SECTIONS[key]; };
  R.execute = function (type, id, action, payload) {
    var p = payload || {}, r = R.get(type, id), before = r && clone(r), check = R.inspect(type, id, action);
    if (!check.allowed) return fail(check.reason);
    try {
      if (action === 'edit' && p.adapter && R.formAdapter(type)) {
        var adapter = R.formAdapter(type), values = adapter.values(id), fieldNames = adapter.fields(id).filter(function (f) { return f.name && f.name !== 'status'; }).map(function (f) { return f.name; });
        fieldNames.forEach(function (key) { if (p.values && Object.prototype.hasOwnProperty.call(p.values, key)) values[key] = typeof p.values[key] === 'string' ? p.values[key].trim() : p.values[key]; });
        var error = adapter.validate && adapter.validate(values, id); ensure(!error, error);
        adapter.fields(id).filter(function (f) { return f.type === 'date' && values[f.name]; }).forEach(function (f) { ensure(R.validDate(values[f.name]), 'Ngày không hợp lệ: ' + f.label); });
        var changed = fieldNames.filter(function (key) { return String(values[key]) !== String(adapter.values(id)[key]); });
        ensure(adapter.save(id, values, changed) !== false, 'Chưa lưu được thay đổi.'); R.audit(type, r, 'edit', before, p.reason || 'Sửa hồ sơ'); TH.store.persist(); return { ok: true, record: r };
      }
      if (action === 'terms') {
        var existingRate = (r.rateChanges || []).find(function (x) { return x.from === p.effectiveFrom; });
        ensure(!existingRate || existingRate.rent !== +p.rent || p.priceList && JSON.stringify(p.priceList) !== JSON.stringify(existingRate.priceList), 'Không có thay đổi so với điều khoản đã lưu; không ghi trùng.');
        ensure(!r.start || p.effectiveFrom >= r.start.slice(0, 7), 'Kỳ hiệu lực không trước ngày bắt đầu hợp đồng.');
        if (p.priceList) ensure(type === 'contract' && p.priceList.every(function (l) { return (r.priceList || []).some(function (x) { return x.code === l.code; }) && Number.isFinite(+l.price) && +l.price >= 0; }), 'Đơn giá phí không hợp lệ.');
      }
      if (action === 'end') ensure(R.validDate(p.date || TH.TODAY) && (p.date || TH.TODAY) >= (r.from || r.start || ''), 'Ngày kết thúc không hợp lệ.');
      if (type === 'landlordPay' && action === 'edit') { var next = Object.assign({}, r, p.values); ensure(!TH.db.landlordPays.some(function (x) { return x !== r && x.buildingId === r.buildingId && !(x.to < next.from || x.from > next.to); }), 'Khoảng trả trùng kỳ đã có.'); }
      if (type === 'leaseDraft' && action === 'approve') {
        var b = C.building(r.buildingId), o = C.owner(r.ownerId);
        ensure(b && o && b.status !== 'inactive' && o.status !== 'inactive' && TH.inScope(b.id), 'Tòa hoặc chủ nhà không còn hợp lệ.');
        ensure(r.start && r.end > r.start && +r.rent > 0 && [1, 3, 6, 12].indexOf(+r.payCycle) >= 0 && +r.payTo >= 1 && +r.payTo <= 28, 'Nhập giá, ngày thuê, chu kỳ 1/3/6/12 tháng và hạn trả 1–28.');
        ensure(!TH.db.leases.some(function (l) { return l.buildingId === b.id && l.status !== 'cancelled' && l.start <= r.end && l.end >= r.start; }), 'Khoảng thuê chồng hợp đồng hiện có.');
        var lease = Object.assign({}, clone(r), { id: R.id('HĐT'), status: 'active', rent: +r.rent, deposit: +r.deposit || 0, payCycle: +r.payCycle, payTo: +r.payTo, payFrom: 1, holdFrom: r.start, holdTo: r.start, handover: r.start, termMonths: 12, enteredBy: TH.me().id, enteredAt: TH.TODAY, versions: [{ v: 1, at: TH.TODAY, by: TH.me().id, note: 'Duyệt từ ' + id }] });
        TH.db.leases.push(lease); r.status = 'approved'; r.leaseId = lease.id;
      } else if (type === 'oaTemplate' && action === 'approve') { ensure(r.name && r.body, 'Nhập tên và nội dung mẫu.'); r.status = 'approved'; r.approvedBy = TH.me().id; }
      else if (type === 'oaSchedule' && action === 'run') {
        ensure(r.lastRunPeriod !== TH.store.state.period, 'Lịch đã chạy kỳ này; không gửi lại.');
        ensure(TH.db.oaTemplates.some(function (t) { return t.id === r.templateId && t.status === 'approved'; }), 'Mẫu tin chưa duyệt.');
        var targets = TH.db.invoices.filter(function (i) { return i.period === TH.store.state.period && i.status === 'confirmed' && !i.isCorrection && TH.inScope(i.buildingId) && C.debt(i) > 0; });
        ensure(targets.length, 'Không có hóa đơn còn nợ trong kỳ / phạm vi.');
        if (!TH.has('F027.B')) targets = targets.slice(0, 1);
        targets.forEach(function (i) { TH.zaloSend(i, r.templateId); }); r.lastRunAt = new Date().toISOString(); r.lastRunPeriod = TH.store.state.period;
      } else if ((type === 'document' || type === 'customerDocument') && action === 'unlink') { ensure(p.reason, 'Nhập lý do gỡ liên kết.'); r.versions = r.versions || []; r.versions.push({ file: r.file, version: r.version || 1, contractId: r.contractId, leaseId: r.leaseId, at: new Date().toISOString() }); r.status = 'archived'; r.unlinkedAt = new Date().toISOString(); }
      else if (type === 'assignment' && action === 'transfer') {
        var staff = C.staff(p.staffId), date = p.date;
        ensure(staff && staff.status === 'active' && date >= r.from && !TH.periodLocked(date.slice(0, 7)) && p.reason, 'Chọn nhân sự hoạt động, ngày hiệu lực kỳ mở và lý do.');
        ensure(staff.id !== r.staffId, 'Chọn nhân sự khác người đang được phân công.');
        var nextAssignment = Object.assign({}, clone(r), { id: R.id('PC'), staffId: staff.id, from: date, to: null, status: 'active', previousAssignmentId: r.id, createdBy: TH.me().id });
        r.to = TH.addDays(date, -1); r.status = date <= TH.TODAY ? 'ended' : 'active'; TH.db.assignments.push(nextAssignment);
        if (r.main && r.role === TH.ROLE_MAIN && date <= TH.TODAY) C.building(r.buildingId).managerId = staff.id;
      } else {
        var result = execute(type, id, action, p);
        if (result.ok && action === 'terms') { if (r.rateBaseRent === undefined) r.rateBaseRent = before.rent; r.rent = R.rateAt(r, TH.TODAY.slice(0, 7)); TH.db.recordHistory[0].after = clone(r); TH.store.persist(); }
        if (result.ok && type === 'contract' && action === 'terms' && p.priceList) {
          if (!r.rateBasePriceList) r.rateBasePriceList = clone(before.priceList);
          r.rateChanges[r.rateChanges.length - 1].priceList = clone(p.priceList);
          r.priceList = clone(p.priceList); if (p.effectiveFrom <= TH.TODAY.slice(0, 7)) TH.syncFees(r);
          TH.db.invoices.filter(function (i) { return i.contractId === id && i.status === 'draft' && i.period >= p.effectiveFrom && !TH.periodLocked(i.period); }).forEach(function (i) { var next = TH.buildInvoice(TH.db, r, i.period, 'draft'); next.lines.forEach(function (l, ix) { if (i.lines[ix] && i.lines[ix].manualAmount !== undefined) l.amount = l.manualAmount = i.lines[ix].manualAmount; }); next.total = C.invoiceTotal(next); Object.assign(i, next, { id: i.id }); });
          TH.db.recordHistory[0].after = clone(r); TH.store.persist();
        }
        if (result.ok && type === 'lease' && action === 'terms') {
          TH.db.landlordPays.filter(function (x) { return x.leaseId === id && !x.paid && x.from >= p.effectiveFrom && !TH.periodLocked(x.from); }).forEach(function (x) { var amount = 0; for (var m = x.from; m <= x.to; m = TH.addMonthsYm(m, 1)) amount += R.rateAt(r, m); x.amount = amount; });
          TH.store.persist();
        }
        return result;
      }
      R.audit(type, r, action, before, p.reason); TH.store.persist(); return { ok: true, record: r };
    } catch (e) { return fail(e.message); }
  };
  // Save the whole ownership table atomically; earlier periods keep their original rows.
  R.saveShares = function (buildingId, period, rows) {
    try {
      ensure(TH.can('share.edit') && TH.inScope(buildingId) && !TH.periodLocked(period), 'Không có quyền sửa bảng tỷ lệ hoặc kỳ đã khóa.');
      ensure(!TH.db.reportRuns.some(function (r) { return r.period === period && (r.buildingIds || []).indexOf(buildingId) >= 0 && !r.invalidatedAt; }), 'Bảng đã phát hành báo cáo; điều chỉnh trong kỳ mở tiếp theo.');
      ensure(rows.length && rows.every(function (r) { return C.shareholder(r.shareholderId) && +r.ratio >= 0 && +r.ratio <= 100 && Number.isFinite(+r.capital) && +r.capital >= 0; }) && Math.abs(C.sum(rows, function (r) { return +r.ratio; }) - 100) < .00001, 'Tổng tỷ lệ phải bằng 100%; kiểm tra cổ đông, tỷ lệ và vốn.');
      ensure(new Set(rows.map(function (r) { return r.shareholderId; })).size === rows.length, 'Cổ đông bị trùng trong bảng.');
      var current = C.sharesFor(buildingId, period).slice(), snapshot = clone(current), from = period + '-01';
      ensure(!current.some(function (r) { return r.from > from; }), 'Có mốc hiệu lực giữa kỳ; chọn kỳ tiếp theo.');
      current.forEach(function (r) { if (r.from < from) r.to = TH.addDays(from, -1); else { R.list('share').splice(R.list('share').indexOf(r), 1); TH.db.recordVersions.push({ type: 'share', record: clone(r) }); } });
      rows.forEach(function (row) { var r = { id: R.id('CP'), shareholderId: row.shareholderId, buildingId: buildingId, ratio: +row.ratio, capital: +row.capital, from: from, to: null, previousIds: current.map(function (x) { return x.id; }), createdBy: TH.me().id }; TH.db.shares.push(r); R.audit('share', r, 'terms', snapshot, 'Bảng tỷ lệ hiệu lực ' + period); });
      TH.store.persist(); return { ok: true };
    } catch (e) { return fail(e.message); }
  };
  TH.act['rec.shareTable'] = function () {
    var building = TH.store.ui('SHARE-01', 'b', TH.scope() !== 'ALL' ? TH.scope() : 'T17'), period = TH.store.state.period, form = 'rec-share-table';
    TH.store.clearDraft(form);
    TH.modal.open({ key: form, size: 'lg', recordForm: form, render: function () {
      var rows = C.sharesFor(building, period), unused = TH.db.shareholders.filter(function (h) { return h.status !== 'inactive' && !rows.some(function (s) { return s.shareholderId === h.id; }); });
      var body = '<p>Hiệu lực từ kỳ ' + esc(period) + '. Tổng tỷ lệ sau thay đổi phải bằng 100%. Bỏ chọn dòng để loại khỏi bảng mới; lịch sử trước kỳ này được giữ.</p><div class="stack">' + rows.map(function (s, i) { return '<div class="form-grid">' + TH.field({ form: form, name: 'ratio-' + i, label: C.shareholder(s.shareholderId).name + ' · tỷ lệ (%)', num: true, def: s.ratio }) + TH.field({ form: form, name: 'capital-' + i, label: 'Vốn góp (đ)', num: true, def: s.capital }) + '<label class="check"><input type="checkbox" data-draft="' + form + '.keep-' + i + '"' + (TH.store.draft(form, 'keep-' + i, true) ? ' checked' : '') + '>Giữ trong bảng mới</label></div>'; }).join('') + '</div>';
      if (unused.length) body += '<h3>Thêm cổ đông vào bảng</h3><div class="form-grid">' + TH.field({ form: form, name: 'newHolder', label: 'Cổ đông', type: 'select', def: '', options: [{ id: '', label: '— Không thêm —' }].concat(unused.map(function (h) { return { id: h.id, label: h.name }; })) }) + TH.field({ form: form, name: 'newRatio', label: 'Tỷ lệ mới (%)', num: true, def: 0 }) + TH.field({ form: form, name: 'newCapital', label: 'Vốn mới (đ)', num: true, def: 0 }) + '</div>';
      return { title: 'Bảng tỷ lệ · ' + esc(building), body: body + '<p role="alert" class="neg">' + esc(TH.store.draft(form, '_error', '')) + '</p>', foot: '<button type="button" class="btn" data-close>Hủy chỉnh sửa</button><button type="button" class="btn btn-primary" data-act="rec.shareSave" data-building="' + building + '" data-period="' + period + '">Lưu thay đổi</button>' };
    } });
  };
  TH.act['rec.shareSave'] = function (el) {
    var form = 'rec-share-table', g = function (k, def) { return TH.store.draft(form, k, def); };
    var rows = C.sharesFor(el.dataset.building, el.dataset.period).map(function (s, i) { return g('keep-' + i, true) ? Object.assign({}, s, { ratio: +g('ratio-' + i, s.ratio), capital: +g('capital-' + i, s.capital) }) : null; }).filter(Boolean);
    if (g('newHolder', '')) rows.push({ shareholderId: g('newHolder'), ratio: +g('newRatio', 0), capital: +g('newCapital', 0) });
    var result = R.saveShares(el.dataset.building, el.dataset.period, rows);
    if (!result.ok) { TH.store.setDraft(form, '_error', result.error); TH.modal.rerenderAll(); return; }
    TH.store.clearDraft(form); TH.modal.close(form, { silent: true }); done(result);
  };
  TH.act['shr.save'] = function () {
    var b = TH.store.ui('SHARE-01', 'b', TH.scope() !== 'ALL' ? TH.scope() : 'T17'), p = TH.store.state.period, form = 'shr-' + b + '-' + p;
    var rows = C.sharesFor(b, p).map(function (s) { return Object.assign({}, s, { ratio: +String(TH.store.draft(form, s.id, s.ratio)).replace(',', '.') }); });
    var result = R.saveShares(b, p, rows); if (result.ok) TH.store.clearDraft(form); done(result);
  };
  // Re-check on the last click, including callbacks after a confirmation dialog.
  R.guardLegacy = function (name, el) {
    var ds = el && el.dataset || {}, role = TH.store.state.role, r, b;
    if (name.indexOf('dep.') === 0) {
      r = R.get('depositCase', ds.id); var ct = C.contract(ds.ct || r && r.contractId);
      if (!ct || !TH.inScope(ct.buildingId)) return false;
      var action = name.split('.')[1], perm = ['approve', 'reject'].indexOf(action) >= 0 ? 'deposit.approve' : ['paid', 'pay'].indexOf(action) >= 0 ? 'deposit.pay' : 'deposit.propose';
      if (!TH.can(perm)) return false;
      if (['approve', 'reject'].indexOf(action) >= 0 && (r.state !== 'pending_approval' || r.proposedBy === TH.me().id)) return false;
      if (action === 'handover' && r.state !== 'awaiting_handover' || ['submit', 'review'].indexOf(action) >= 0 && r.state !== 'reconciling' || ['pay', 'paid'].indexOf(action) >= 0 && r.state !== 'approved') return false;
      if (action === 'paid' && TH.periodLocked(TH.store.draft('pay-' + r.id, 'paidAt', TH.TODAY).slice(0, 7))) return false;
    }
    if (name.indexOf('lpay.') === 0) { r = R.get('landlordPay', ds.id); b = ds.b || r && r.buildingId; if (!b || !TH.can('lease.edit') || !TH.inScope(b)) return false; if (name === 'lpay.paySave' && TH.periodLocked(TH.store.draft('lpay-pay-' + r.id, 'date', TH.TODAY).slice(0, 7))) return false; }
    if (name === 'exp.approve' || name === 'exp.reject') { r = R.get('expense', ds.id); if (!r || ['admin', 'accountant'].indexOf(role) < 0 || r.status !== 'pending' || !TH.inScope(r.buildingId) || TH.periodLocked(r.period)) return false; }
    if (name === 'app.reject') { r = R.get('receipt', ds.id); if (!r || !TH.can('receipt.confirm') || r.status !== 'pending' || !R.visible('receipt', r) || TH.periodLocked(R.period('receipt', r))) return false; }
    if (name === 'app.audit' && !TH.can('receipt.audit')) return false;
    if (name === 'con.approve') { b = C.room(TH.store.draft('con-new', 'room', '')); if (!TH.can('contract.edit') || !b || !TH.inScope(b.buildingId) || b.status === 'inactive' || C.building(b.buildingId).status === 'inactive') return false; }
    return true;
  };
  ['dep.open', 'dep.handover', 'dep.review', 'dep.submit', 'dep.approve', 'dep.reject', 'dep.pay', 'dep.paid', 'lpay.save', 'lpay.gen', 'lpay.pay', 'lpay.paySave', 'exp.approve', 'exp.reject', 'app.reject', 'app.audit', 'con.approve'].forEach(function (name) {
    var fn = TH.act[name]; if (!fn) return; TH.act[name] = function (el) { if (!R.guardLegacy(name, el)) return done(fail('Quyền, phạm vi, kỳ hoặc trạng thái không còn cho phép thao tác.')); return fn.apply(this, arguments); };
  });
  TH.act['exp.submit'] = function (el) { done(R.execute('expense', el.dataset.id, 'submit')); };
  var legacyPermissions = { 'own.save': 'master.edit', 'bld.save': 'master.edit', 'own.link.save': 'lease.edit', 'bdoc.save': 'master.edit', 'cus.save': 'contract.edit', 'fu.save': 'contract.edit', 'bld.assignSave': 'master.edit', 'mtr.save1': 'meter.edit', 'mtr.saveAll': 'meter.edit', 'mtr.approve': 'meter.approve', 'mtr.feeSave': 'meter.edit', 'mtr.feeOk': 'meter.approve' };
  Object.keys(legacyPermissions).forEach(function (name) { var fn = TH.act[name]; if (!fn) return; TH.act[name] = function (el) {
    if (!TH.can(legacyPermissions[name])) return done(fail('Vai trò hiện tại không có quyền lưu dữ liệu này.'));
    var b;
    if (name === 'own.link.save') b = TH.store.draft('own-link-' + el.dataset.id, 'b', 'S9');
    if (name === 'bdoc.save') b = TH.store.draft('bdoc-up', 'b', TH.store.draft('bdoc-up', '_b', ''));
    if (name === 'bld.assignSave') b = el.dataset.id;
    if (b && (!TH.inScope(b) || !C.building(b) || C.building(b).status === 'inactive')) return done(fail('Tòa ngoài phạm vi hoặc đã ngừng hoạt động.'));
    if (name.indexOf('mtr.') === 0 && TH.periodLocked(TH.store.state.period)) return done(fail('Kỳ đã khóa; lập điều chỉnh trong kỳ đang mở.'));
    if (name === 'mtr.approve') { var reading = C.reading(el.dataset.id, TH.store.state.period); if (!reading || reading.status !== 'review' || !R.visible('reading', reading) || TH.db.invoices.some(function (i) { return i.roomId === reading.roomId && i.period === reading.period && i.status === 'confirmed'; })) return done(fail('Chỉ số không còn chờ duyệt, đã lập hóa đơn hoặc ngoài phạm vi.')); }
    if (name === 'mtr.feeOk') { var fee = R.get('fee', el.dataset.id); if (!fee || fee.status !== 'draft' || !R.inspect('fee', fee.id, 'edit').allowed) return done(fail('Dòng phí không còn chờ duyệt, thuộc kỳ khóa hoặc đã dùng trong hóa đơn.')); }
    if (name === 'mtr.feeSave') {
      var roomId = TH.store.draft('mtr-fee', 'room', (TH.db.rooms.find(function (r) { return TH.inScope(r.buildingId) && r.status === 'occupied'; }) || {}).id), room = C.room(roomId);
      if (!room || !TH.inScope(room.buildingId) || room.status === 'inactive') return done(fail('Phòng ngoài phạm vi hoặc đã ngừng hoạt động.'));
      var invoice = TH.db.invoices.find(function (i) { return i.roomId === roomId && i.period === TH.store.state.period && i.status === 'confirmed' && !i.isCorrection; });
      if (invoice) {
        var price = +String(TH.store.draft('mtr-fee', 'price', '')).replace(/\D/g, ''), qty = +TH.store.draft('mtr-fee', 'qty', 1), title = TH.store.draft('mtr-fee', 'name', '');
        if (!price || !(qty > 0) || !title) return fn.apply(this, arguments); // thiếu dữ liệu → form gốc báo lỗi tại từng trường
        R.open('invoice', invoice.id, 'correct'); var form = 'rec-invoice-' + invoice.id + '-correct'; TH.store.setDraft(form, 'amount', R.effectiveAmount('invoice', invoice) + qty * price); TH.store.setDraft(form, 'lineIndex', '-1'); TH.store.setDraft(form, 'lineName', title); TH.store.setDraft(form, 'reason', 'Bổ sung phí: ' + title); TH.modal.rerenderAll(); return;
      }
    }
    if (name === 'fu.save' && !R.inspect('contract', el.dataset.id, 'edit').allowed) return done(fail('Không có quyền ghi liên hệ cho hợp đồng.'));
    return fn.apply(this, arguments);
  }; });
  var roomSave = TH.act['room.save'];
  TH.act['room.save'] = function (el) {
    var id = el.dataset.id, r = C.room(id), form = 'room-' + id, b = r ? r.buildingId : TH.store.draft(form, 'b', (TH.buildingOptions(false)[0] || {}).id);
    if (!TH.can('master.edit') || !TH.inScope(b) || !C.building(b) || C.building(b).status === 'inactive') return done(fail('Tòa không hoạt động hoặc ngoài phạm vi.'));
    if (r) {
      var status = TH.store.draft(form, 'status', r.status), rent = +String(TH.store.draft(form, 'rent', r.rent)).replace(/\D/g, '');
      if (status !== 'occupied' && TH.db.contracts.some(function (ct) { return ct.roomId === id && ct.status === 'active' && ct.start <= TH.TODAY && ct.end >= TH.TODAY; })) return done(fail('Phòng còn hợp đồng hiệu lực; kết thúc hoặc bàn giao hợp đồng trước.'));
      if (status === 'inactive') { var check = R.inspect('room', id, 'archive'); if (!check.allowed) return done(fail(check.reason)); }
      if (rent !== r.rent) { var result = R.execute('room', id, 'terms', { rent: rent, effectiveFrom: TH.store.state.period, reason: 'Sửa giá niêm yết phòng' }); if (!result.ok) return done(result); }
      var snapshot = clone(r); roomSave.apply(this, arguments); R.audit('room', r, 'edit', snapshot, 'Sửa hồ sơ phòng'); TH.store.persist(); return;
    }
    return roomSave.apply(this, arguments);
  };
  TH.onChange['sys.scope'] = function (el) { if (!TH.can('*')) return; TH.store.setDraft('sys-scope-' + el.dataset.u, el.dataset.b, el.checked); };
  TH.act['sys.save'] = function (el) { var r = R.get('user', el.dataset.u); if (!r) return; var scope = TH.db.buildings.filter(function (b) { return TH.store.draft('sys-scope-' + r.id, b.id, r.scope.indexOf(b.id) >= 0); }).map(function (b) { return b.id; }); var result = R.execute('user', r.id, 'edit', { values: { scope: scope } }); if (result.ok) TH.store.clearDraft('sys-scope-' + r.id); done(result); };
  TH.act['sys.newUserSave'] = function () {
    if (!TH.can('*')) return done(fail('Chỉ Admin tạo tài khoản.'));
    var candidates = TH.db.staff.filter(function (s) { return s.status === 'active' && !TH.db.users.some(function (u) { return u.staffId === s.id; }); }), sid = TH.store.draft('sys-new', 'staff', candidates[0] && candidates[0].id), staff = C.staff(sid), role = TH.store.draft('sys-new', 'role', 'manager');
    if (!staff || staff.status !== 'active' || !TH.ROLES[role] || TH.db.users.some(function (u) { return u.staffId === sid; })) return done(fail('Chọn nhân sự hoạt động chưa có tài khoản và vai trò hợp lệ.'));
    var id = R.id('U'), username = 'user.' + sid.toLowerCase();
    if (TH.db.users.some(function (u) { return u.username === username; })) username += '.' + id.slice(-8);
    var r = { id: id, staffId: sid, username: username, role: role, scope: role === 'admin' ? TH.db.buildings.map(function (b) { return b.id; }) : [], status: 'active', perms: null };
    TH.db.users.push(r); R.audit('user', r, 'create', null, 'Tạo tài khoản'); TH.store.clearDraft('sys-new'); TH.modal.close('sys-new', { silent: true }); done({ ok: true, record: r });
  };
  var roleScope = TH.roleScope;
  TH.roleScope = function () { if (TH.store.state.role !== 'manager') return roleScope(); var u = TH.db.users.find(function (x) { return x.staffId === TH.ROLES.manager.staffId; }); return u ? (u.status === 'active' && u.role === 'manager' ? u.scope.slice() : []) : []; };
  // Landlord payment reconciles against a single existing expense, never creates a second expense.
  TH.act['lpay.paySave'] = function (el) {
    if (!R.guardLegacy('lpay.paySave', el)) return done(fail('Không có quyền ghi nhận hoặc ngày trả thuộc kỳ khóa.'));
    var r = R.get('landlordPay', el.dataset.id), form = 'lpay-pay-' + r.id, before = clone(r);
    var amount = +String(TH.store.draft(form, 'amount', r.amount - TH.landlordPaid(r))).replace(/[^\d.-]/g, ''), doc = TH.store.draft(form, 'doc', 'UNC-' + TH.bTag(r.buildingId) + '-' + TH.TODAY.slice(5).replace('-', ''));
    if (!(amount > 0 && amount <= r.amount - TH.landlordPaid(r))) return done(fail('Số tiền vượt phần còn phải trả.'));
    var matches = TH.db.expenses.filter(function (e) { return e.status === 'approved' && e.category === 'owner_rent' && e.buildingId === r.buildingId && (e.landlordPayId === r.id || e.docNo === doc); });
    if (matches.some(function (e) { return e.landlordPayId === r.id && e.paid; }) || (r.transactions || []).some(function (t) { return t.docNo === doc; })) return done(fail('Chứng từ đã ghi nhận thanh toán; không ghi hai lần.'));
    if (matches.length > 1 || matches.length && matches[0].amount !== amount) return done(fail('Số tiền / chứng từ chi chưa khớp; sửa khoản chi trước khi đối chiếu.'));
    r.paid += amount; r.paidAt = TH.store.draft(form, 'date', TH.TODAY); r.docNo = doc; r.approval = 'approved'; r.transactions = r.transactions || []; r.transactions.push({ id: R.id('TT'), amount: amount, at: r.paidAt, docNo: doc, expenseId: matches[0] && matches[0].id });
    if (matches[0]) { matches[0].paid = true; matches[0].landlordPayId = r.id; }
    R.audit('landlordPay', r, 'payment', before, doc); TH.store.clearDraft(form); TH.modal.close('lpay-pay', { silent: true }); done({ ok: true, record: r });
  };
  // The existing fee form keeps its familiar fields, but writes a dated version.
  var feeSection = TH.SECTIONS.cusPrice, feeSave = feeSection.save, feeFields = feeSection.fields, feeValues = feeSection.values;
  feeSection.values = function () { return Object.assign({}, feeValues.apply(this, arguments), { effectiveFrom: TH.addMonthsYm(TH.TODAY.slice(0, 7), 1) }); };
  feeSection.fields = function () { return feeFields.apply(this, arguments).concat([{ name: 'effectiveFrom', label: 'Kỳ hiệu lực', type: 'month', required: true }]); };
  feeSection.save = function (id, values, changed) {
    var ct = C.contract(id), before = clone(ct), period = values.effectiveFrom || TH.addMonthsYm(TH.TODAY.slice(0, 7), 1);
    if (TH.periodLocked(period)) { TH.toast('Kỳ hiệu lực đã khóa', 'Chọn kỳ đang mở.', 'warning'); return false; }
    var saved = feeSave.apply(this, arguments); if (saved === false) return false;
    var list = clone(ct.priceList).map(function (l) { if (changed.some(function (k) { return k.slice(2) === l.code; })) l.from = period; return l; }), cycle = ct.payCycle;
    Object.keys(ct).forEach(function (k) { delete ct[k]; }); Object.assign(ct, before);
    var result = R.execute('contract', id, 'terms', { rent: R.rateAt(ct, period), effectiveFrom: period, priceList: list, reason: 'Điều chỉnh dòng phí theo hợp đồng' });
    if (result.ok && cycle !== before.payCycle) ct.rateChanges[ct.rateChanges.length - 1].payCycle = cycle;
    if (!result.ok) TH.toast('Chưa lưu dòng phí', esc(result.error), 'warning'); return result.ok;
  };
  var leaseSection = TH.SECTIONS.lease, leaseFields = leaseSection.fields, leaseSave = leaseSection.save;
  leaseSection.fields = function () { return leaseFields.apply(this, arguments).concat([{ name: 'effectiveFrom', label: 'Kỳ áp dụng thay đổi giá', type: 'month', required: true }]); };
  leaseSection.save = function (id, values, changed) {
    var r = R.get('lease', id), changedTerms = changed.filter(function (k) { return ['note', 'referrer', 'enteredBy', 'effectiveFrom'].indexOf(k) < 0; });
    if (changedTerms.some(function (k) { return k !== 'rent'; })) { TH.toast('Điều khoản đã dùng làm căn cứ', 'Giữ thời hạn / chu kỳ gốc; kết thúc và tạo hợp đồng kế tiếp nếu thay điều khoản. Giá có thể đổi theo kỳ.', 'warning'); return false; }
    if (changedTerms.length) { var result = R.execute('lease', id, 'terms', { rent: +String(values.rent).replace(/\D/g, ''), effectiveFrom: values.effectiveFrom, reason: values.note || 'Thay đổi giá thuê theo thỏa thuận' }); if (!result.ok) { TH.toast('Chưa lưu', esc(result.error), 'warning'); return false; } }
    r.note = values.note; r.referrer = values.referrer; r.enteredBy = values.enteredBy; return true;
  };
  // Replace the former notification-only addendum control with the actual dated workflow.
  TH.act['con.addendum'] = function (el) { R.open('contract', el.dataset.id, 'terms'); };
  TH.act['con.addendum.save'] = function (el) { var r = C.contract(el.dataset.id), form = 'adm-' + r.id; done(R.execute('contract', r.id, 'terms', { rent: +TH.store.draft(form, 'rent', r.rent), effectiveFrom: TH.store.draft(form, 'from', ''), reason: TH.store.draft(form, 'reason', '') })); };
  // Salary inputs and confirmed sheets are period-specific, never stored back into staff.base.
  var payroll = C.payroll;
  C.payroll = function (period) {
    if (TH.db.payrollSnapshots && TH.db.payrollSnapshots[period]) return clone(TH.db.payrollSnapshots[period]);
    return payroll(period).map(function (r) { var input = (TH.db.salaryInputs || []).find(function (x) { return x.staffId === r.staff.id && x.period === period; }); if (!input) return r; return Object.assign({}, r, { base: input.base, allowance: input.allowance, total: r.total - r.base - r.allowance + input.base + input.allowance }); });
  };
  TH.act['sal.saveSetup'] = function (el) {
    var period = TH.store.state.period, st = TH.db.payrollStatus[period];
    if (!TH.can('salary.edit') || TH.periodLocked(period) || st && st.status !== 'draft') return done(fail('Bảng lương đã xác nhận hoặc không có quyền; dùng phiếu điều chỉnh liên kết.'));
    if (!TH.has('F040.B') && !(el && el.dataset.id)) return done(fail('Gói A lưu đầu vào từng nhân viên; lưu cả danh sách có từ gói B.'));
    TH.db.salaryInputs = TH.db.salaryInputs || [];
    var selected = TH.salaryRows(period).filter(function (r) { return !el.dataset.id || r.staff.id === el.dataset.id; });
    if (selected.some(function (r) { return !Number.isFinite(r.base) || r.base < 0 || !Number.isFinite(r.allowance) || r.allowance < 0; })) return done(fail('Lương cơ bản và phụ cấp phải là số không âm.'));
    selected.forEach(function (row) { var r = TH.db.salaryInputs.find(function (x) { return x.staffId === row.staff.id && x.period === period; }), before = r && clone(r); if (!r) { r = { id: R.id('LG'), staffId: row.staff.id, period: period, status: 'draft' }; TH.db.salaryInputs.push(r); } Object.assign(r, { base: row.base, allowance: row.allowance }); R.audit('salaryInput', r, 'edit', before, 'Đầu vào lương kỳ ' + period); TH.store.setDraft('sal-' + period, row.staff.id + '.base', undefined); TH.store.setDraft('sal-' + period, row.staff.id + '.allow', undefined); }); done({ ok: true });
  };
  ['sal.extConfirm', 'sal.preview', 'sal.lock'].forEach(function (name) { var fn = TH.act[name]; TH.act[name] = function () { var period = TH.store.state.period; if (!TH.can('salary.edit') || TH.periodLocked(period)) return done(fail('Không có quyền hoặc kỳ đã khóa.')); TH.db.payrollSnapshots = TH.db.payrollSnapshots || {}; if (!TH.db.payrollSnapshots[period]) TH.db.payrollSnapshots[period] = clone(C.payroll(period)); return fn.apply(this, arguments); }; });
  var salaryAdd = TH.act['saladj.save']; TH.act['saladj.save'] = function () { var p = TH.store.state.period, st = TH.db.payrollStatus[p]; if (!TH.can('salary.edit') || TH.periodLocked(p) || st && st.status !== 'draft') return done(fail('Kỳ lương đã chốt: mở dòng đầu vào / điều chỉnh gốc để lập phiếu điều chỉnh trong kỳ mở.')); return salaryAdd.apply(this, arguments); };
  var init = R.init;
  R.init = function () {
    init(); TH.db.payrollSnapshots = TH.db.payrollSnapshots || {};
    if (!TH.db.recordSchedulesInitialized) { if (!TH.db.oaSchedules.length && TH.db.oa) TH.db.oaSchedules.push({ id: R.id('OA-LỊCH'), name: 'Nhắc thanh toán hằng tháng', day: TH.db.oa.reminderDay || 8, templateId: 'TPL-02', status: 'active', source: 'oa.reminderDay' }); TH.db.recordSchedulesInitialized = true; }
    Object.keys(TH.db.payrollStatus || {}).forEach(function (period) { if (TH.db.payrollStatus[period].status !== 'draft' && !TH.db.payrollSnapshots[period]) TH.db.payrollSnapshots[period] = clone(C.payroll(period)); });
  };
  // The remaining simulated imports use the same before/after ledger as master imports.
  var importFeatures = { staff: 'F037.B', expense: 'F034.B', salaryInput: 'F040.B', share: 'F042.B' };
  R.commitRecordImport = function (type, rows) {
    try {
      ensure(importFeatures[type] && TH.has(importFeatures[type]) && TH.can(R.definitions[type].permission), 'Gói / vai trò không cho phép nhập dữ liệu này.');
      ensure(rows.length > 0, 'Chọn ít nhất một dòng để nhập.'); R.init();
      ensure(!rows.every(function (r) { return JSON.stringify(R.get(type, r.id)) === JSON.stringify(r); }), 'Các dòng đã giống dữ liệu đang lưu; không ghi lặp.');
      var before = clone(R.list(type)), changes = [], period = TH.store.state.period;
      rows.forEach(function (r) { var old = R.get(type, r.id); ensure(R.visible(type, r), 'Dòng nằm ngoài phạm vi tòa.'); if (old && type !== 'share') { var check = R.inspect(type, old.id, 'edit'); ensure(check.allowed, check.reason); } if (type !== 'share') R.validate(type, old || r, r); if (type === 'salaryInput' || type === 'expense') ensure(!TH.periodLocked(r.period) && !(type === 'salaryInput' && TH.db.payrollStatus[r.period] && TH.db.payrollStatus[r.period].status !== 'draft'), 'Kỳ đã chốt hoặc đã khóa.'); });
      if (type === 'share') { var b = rows[0].buildingId; ensure(rows.every(function (r) { return r.buildingId === b; }), 'Mỗi lần nhập một tòa.'); ensure(!C.sharesFor(b, period).some(function (r) { return r.from >= period + '-01'; }), 'Kỳ này đã có bản điều chỉnh tỷ lệ; sửa qua bảng tỷ lệ thay vì nhập chồng lô.'); var result = R.saveShares(b, period, rows); ensure(result.ok, result.error); }
      else rows.forEach(function (row) { var r = R.get(type, row.id), old = r && clone(r); if (r) Object.assign(r, clone(row)); else { r = clone(row); R.list(type).push(r); } R.audit(type, r, 'import', old, 'Nhập từ tệp mẫu đã rà soát'); });
      R.list(type).forEach(function (r) { var old = before.find(function (x) { return x.id === r.id; }); if (JSON.stringify(old) !== JSON.stringify(r)) changes.push({ type: type, id: r.id, before: old || null, after: clone(r), footprint: R.dependencyFootprint(type, r), dependencies: R.dependencies(type, r).map(function (d) { return d.collection + ':' + d.id; }) }); });
      var batch = { id: R.id('IMP'), kind: type, period: period, file: 'Mẫu nhập ' + R.definitions[type].label, at: new Date().toISOString(), by: TH.me().id, status: 'done', rows: rows.length, ok: rows.length, errors: 0, changes: changes, historyIds: TH.db.recordHistory.map(function (h) { return h.id; }) };
      TH.db.importBatches.unshift(batch); TH.store.persist(); return { ok: true, record: batch };
    } catch (e) { return fail(e.message); }
  };
  function openImport(type) {
    if (!TH.has(importFeatures[type]) || !TH.can(R.definitions[type].permission)) return done(fail('Gói / vai trò không cho phép nhập.'));
    var form = 'rec-import', period = TH.store.state.period, rows, fields, building = TH.scope() === 'ALL' ? 'T17' : TH.scope(); TH.store.clearDraft(form);
    if (type === 'staff') { rows = TH.db.staff.filter(function (r) { return r.status === 'active'; }).slice(0, 3).map(clone); fields = ['name', 'phone', 'title', 'team']; }
    if (type === 'expense') { rows = [1, 2].map(function (n) { return { id: R.id('CP'), buildingId: building, period: period, date: period + '-20', description: 'Chi phí nhập mẫu ' + n, amount: n * 100000, category: 'repair', docNo: R.id('CT'), status: 'draft', createdBy: TH.me().id }; }); fields = ['description', 'amount', 'docNo']; }
    if (type === 'salaryInput') { rows = C.payroll(period).slice(0, 3).map(function (r) { var old = R.list(type).find(function (x) { return x.staffId === r.staff.id && x.period === period; }); return Object.assign({}, old || { id: R.id('LG'), period: period, staffId: r.staff.id, status: 'draft' }, { base: r.base, allowance: r.allowance }); }); fields = ['base', 'allowance']; }
    if (type === 'share') { building = TH.store.ui('SHARE-01', 'b', building); rows = C.sharesFor(building, period).map(clone); fields = ['ratio', 'capital']; }
    TH.modal.open({ key: form, size: 'lg', recordForm: form, render: function () {
      var recent = TH.db.importBatches.filter(function (b) { return b.kind === type; }).slice(0, 4);
      return { title: 'Rà soát nhập · ' + R.definitions[type].label, body: '<p>Tệp mẫu mô phỏng. Có thể sửa giá trị hoặc bỏ dòng trước khi ghi; xác nhận sẽ cập nhật dữ liệu demo và lưu lô có thể hoàn tác.</p>' + rows.map(function (r, i) { return '<section class="card card-bd u-mb-12"><label class="check"><input type="checkbox" data-draft="' + form + '.include-' + i + '"' + (TH.store.draft(form, 'include-' + i, true) ? ' checked' : '') + '>Dòng ' + (i + 1) + ' · ' + esc(r.staffId || r.shareholderId || r.id) + '</label><div class="form-grid">' + fields.map(function (k) { return TH.field({ form: form, name: i + '-' + k, label: ({ name: 'Tên', phone: 'Điện thoại', title: 'Chức vụ', team: 'Đội nhóm', description: 'Diễn giải', amount: 'Số tiền', docNo: 'Số chứng từ', base: 'Lương cơ bản', allowance: 'Phụ cấp', ratio: 'Tỷ lệ (%)', capital: 'Vốn góp' })[k], def: r[k], num: typeof r[k] === 'number' }); }).join('') + '</div></section>'; }).join('') + '<p class="neg" role="alert">' + esc(TH.store.draft(form, '_error', '')) + '</p>' + (recent.length ? '<h3>Lô gần đây</h3>' + recent.map(function (b) { return '<p>' + esc(b.id) + ' · ' + esc(b.status) + ' <button type="button" class="btn btn-xs" data-act="imp.rollback" data-id="' + esc(b.id) + '">Hoàn tác lô</button></p>'; }).join('') : ''), foot: '<button type="button" class="btn" data-close>Hủy chỉnh sửa</button><button type="button" class="btn btn-primary" data-act="rec.importCommit">Ghi các dòng đã chọn</button>' };
    } });
    TH.act['rec.importCommit'] = function () {
      var selected = rows.map(function (r, i) { if (!TH.store.draft(form, 'include-' + i, true)) return null; var next = clone(r); fields.forEach(function (k) { var v = TH.store.draft(form, i + '-' + k, r[k]); next[k] = typeof r[k] === 'number' ? +v : v; }); return next; }).filter(Boolean);
      var result = R.commitRecordImport(type, selected); if (!result.ok) { TH.store.setDraft(form, '_error', result.error); TH.modal.rerenderAll(); return; } TH.store.clearDraft(form); TH.modal.close(form, { silent: true }); done(result);
    };
  }
  ['hr.import', 'exp.import', 'sal.import', 'shr.import'].forEach(function (name, i) { TH.act[name] = function () { openImport(['staff', 'expense', 'salaryInput', 'share'][i]); }; });
  // Reuse the existing full editors for records with specialized fields.
  var editors = { room: 'room.edit', staff: 'hr.edit', asset: 'asset.edit', expense: 'exp.edit', vehicle: 'veh.edit' };
  Object.keys(editors).forEach(function (type) {
    var name = editors[type], original = TH.act[name];
    TH.act[name] = function (el) {
      var id = el.dataset.id, check = R.inspect(type, id, 'edit'); if (!check.allowed) return done(fail(check.reason));
      if (type === 'vehicle' && !el.dataset.k) { var customer = TH.db.customers.find(function (c) { return (c.vehicles || []).some(function (v) { return v.id === id; }); }); el = { dataset: Object.assign({}, el.dataset, { k: customer.id }) }; }
      original.call(this, el); var modal = TH.modal.top(), field = modal && modal.el.querySelector('[data-draft]'); if (field) modal.spec.recordForm = field.dataset.draft.split('.')[0];
    };
  });
  var openRecord = R.open;
  R.open = function (type, id, action) { if (action === 'edit' && editors[type] && !(type === 'staff' && !TH.can('hr.edit')) && R.inspect(type, id, action).allowed) return TH.act[editors[type]]({ dataset: { id: id } }); return openRecord.apply(this, arguments); };
  ['asset.save', 'veh.save', 'hr.save', 'exp.save'].forEach(function (name) {
    var type = { 'asset.save': 'asset', 'veh.save': 'vehicle', 'hr.save': 'staff', 'exp.save': 'expense' }[name], fn = TH.act[name];
    TH.act[name] = function (el) {
      var r = R.get(type, el.dataset.id), before = r && clone(r), beforeIds = R.list(type).map(function (x) { return x.id; });
      if (type === 'staff' && r && TH.store.draft('hr-' + r.id, 'status', r.status) === 'inactive') { var check = R.inspect(type, r.id, 'archive'); if (!check.allowed) return done(fail(check.reason)); }
      var result = fn.apply(this, arguments); if (r && JSON.stringify(before) !== JSON.stringify(r)) { R.audit(type, r, 'edit', before, 'Sửa qua biểu mẫu nghiệp vụ'); TH.store.persist(); } else if (!r) R.list(type).filter(function (x) { return beforeIds.indexOf(x.id) < 0; }).forEach(function (x) { x.createdBy = x.createdBy || TH.me().id; R.audit(type, x, 'create', null, 'Thêm từ biểu mẫu nghiệp vụ'); TH.store.persist(); }); return result;
    };
  });
  window.addEventListener('beforeunload', function (ev) { if (TH.modal.stack.some(function (m) { var f = m.spec.recordForm; return f && Object.keys(TH.store.draft(f) || {}).some(function (k) { return k.charAt(0) !== '_'; }); })) { ev.preventDefault(); ev.returnValue = ''; } });
  function dirtyForms() { return TH.modal.stack.filter(function (m) { var f = m.spec.recordForm; return f && Object.keys(TH.store.draft(f) || {}).some(function (k) { return k.charAt(0) !== '_'; }); }); }
  document.addEventListener('click', function (ev) {
    var link = ev.target.closest('a[href^="#"]'), forms = dirtyForms(); if (!link || !forms.length || link.hash === location.hash) return;
    ev.preventDefault(); ev.stopImmediatePropagation(); var href = link.getAttribute('href');
    TH.confirm({ title: 'Rời form chưa lưu?', body: '<p>Thay đổi đang nhập sẽ bị bỏ. Bản ghi đã lưu vẫn được giữ.</p>', ok: 'Bỏ thay đổi và chuyển màn', cancel: 'Tiếp tục chỉnh sửa', danger: true }).then(function (ok) { if (!ok) return; forms.forEach(function (m) { TH.store.clearDraft(m.spec.recordForm); TH.modal.close(m.key, { silent: true }); }); TH.router.go(href); });
  }, true);
})();
