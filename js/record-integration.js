/* Integration with legacy entry points, dated calculations, contract drafts and import. */
(function () {
  'use strict';
  var R = TH.recordActions, C = TH.calc, clone = R.clone, esc = TH.esc;
  // New entries have stable IDs. Existing IDs remain unchanged for old deep links.
  R.definitions.contractDraft = { type: 'contractDraft', collection: 'contractDrafts', label: 'Hợp đồng nháp', permission: 'contract.edit', screen: 'CON-01', detail: '', fields: ['customerId', 'roomId', 'rent', 'deposit', 'start', 'end', 'note'] };
  var inspect = R.inspect;
  R.inspect = function (type, id, action) {
    var r = action === 'restore' ? (R.trash(type, id) || {}).record : R.get(type, id);
    var out = inspect(type, id, action); if (!out.allowed) return out;
    function no(s) { return Object.assign(out, { allowed: false, reason: s }); }
    var finance = ['invoice', 'expense', 'receipt', 'deposit', 'salaryAdjustment', 'landlordPay', 'billAdjustment'];
    if (finance.indexOf(type) >= 0 && ['archive', 'activate', 'end', 'invalidate', 'terms'].indexOf(action) >= 0) return no('Thao tác không áp dụng cho chứng từ tài chính.');
    if (r.correctionId && action !== 'view') return no('Đây là dòng ghi sổ của phiếu điều chỉnh; mở chứng từ gốc để điều chỉnh tiếp.');
    if (action === 'edit' && r.status === 'pending' && ['expense', 'billAdjustment'].indexOf(type) >= 0) return no('Rút yêu cầu về nháp trước khi sửa.');
    if (type === 'share' && TH.db.reportRuns.some(function (x) { return x.period === TH.store.state.period && (x.buildingIds || []).indexOf(r.buildingId) >= 0; }) && action !== 'view') return no('Đã có bản báo cáo lưu; chỉnh tỷ lệ ở kỳ mở tiếp theo.');
    if (type === 'billAdjustment' && r.status === 'approved' && ['edit', 'delete'].indexOf(action) >= 0) return no('Khoản đã duyệt; mở hóa đơn để lập điều chỉnh.');
    if (action === 'cancel' && ['invoice', 'message'].indexOf(type) < 0) return no('Thao tác không áp dụng cho bản ghi này.');
    if (action === 'terms' && ['contract', 'lease', 'room'].indexOf(type) < 0) return no('Bản ghi không có điều khoản giá.');
    if (['approve', 'reject'].indexOf(action) >= 0 && ['correction', 'contractDraft'].indexOf(type) < 0) return no('Sử dụng luồng duyệt nghiệp vụ của chứng từ.');
    if (action === 'invalidate' && type !== 'report') return no('Chỉ đánh dấu hết hiệu lực cho báo cáo đã lưu.');
    if (action === 'submit' && ['correction', 'receipt', 'expense', 'billAdjustment'].indexOf(type) < 0) return no('Bản ghi không có luồng gửi duyệt.');
    if (action === 'archive' && r.status === 'inactive' || action === 'activate' && ['inactive', 'retired'].indexOf(r.status) < 0) return no('Trạng thái đã thay đổi.');
    if (type === 'contractDraft' && action === 'approve' && r.status !== 'draft') return no('Hợp đồng nháp đã xử lý.');
    if (action === 'restore') {
      var parents = ['buildingId', 'ownerId', 'customerId', 'roomId', 'staffId'];
      var types = ['building', 'owner', 'customer', 'room', 'staff'];
      for (var i = 0; i < parents.length; i++) if (r[parents[i]] && r[parents[i]] !== '—') { var p = R.get(types[i], r[parents[i]]); if (!p || p.status === 'inactive') return no('Đối tượng cha không hoạt động: ' + r[parents[i]]); }
    }
    return out;
  };
  // A calculation for a past period must not see later correction postings.
  R.asOf = null;
  var receiptsOf = C.receiptsOf;
  C.receiptsOf = function (id) { var p = R.asOf || TH.store.state.period; return receiptsOf(id).filter(function (r) { return !r.correctionId || r.period <= p; }); };
  var received = C.receiptsReceivedIn;
  C.receiptsReceivedIn = function (period, scope) { return received(period, scope).filter(function (r) { return !r.correctionId || r.cashMovement; }); };
  C.debt = function (inv) { if (inv.status !== 'confirmed' || inv.isCorrection) return 0; return Math.max(0, R.effectiveAmount('invoice', inv, R.asOf || TH.store.state.period) - C.paid(inv.id)); };
  C.balance = function (inv) { return inv.status !== 'confirmed' || inv.isCorrection ? 0 : C.paid(inv.id) - R.effectiveAmount('invoice', inv, R.asOf || TH.store.state.period); };
  ['summary', 'perfBuilding', 'pnl', 'payroll', 'roomBills', 'roomBill', 'utilityLoss', 'roomFlow'].forEach(function (name) {
    var fn = C[name]; if (!fn) return;
    C[name] = function () { var prev = R.asOf, p = arguments[0]; if (typeof p === 'string' && /^\d{4}-\d{2}$/.test(p)) R.asOf = p; try { return fn.apply(this, arguments); } finally { R.asOf = prev; } };
  });
  TH.landlordPaid = function (x) { return R.effectiveAmount('landlordPay', x, R.asOf || TH.store.state.period); };
  var posted = R.isPosted;
  R.isPosted = function (type, r) { return posted(type, r) || type === 'salaryAdjustment' && TH.db.payrollStatus[r.period] && TH.db.payrollStatus[r.period].status !== 'draft'; };
  // Effective rates are resolved when drafting invoices; existing confirmed invoices are immutable.
  var build = TH.buildInvoice;
  TH.buildInvoice = function (db, ct, period, status) {
    var rates = (ct.rateChanges || []).filter(function (x) { return x.from <= period; }).sort(function (a, b) { return a.from.localeCompare(b.from); });
    return build(db, rates.length ? Object.assign({}, ct, { rent: rates[rates.length - 1].rent }) : ct, period, status);
  };
  function refreshDrafts(room, period) {
    TH.db.invoices.forEach(function (inv) { if (inv.status !== 'draft' || room && inv.roomId !== room || period && inv.period !== period || TH.periodLocked(inv.period)) return; var ct = C.contract(inv.contractId); if (ct) { var next = TH.buildInvoice(TH.db, ct, inv.period, 'draft'); next.lines.forEach(function (l, i) { if (inv.lines[i] && inv.lines[i].manualAmount !== undefined) { l.amount = inv.lines[i].manualAmount; l.manualAmount = l.amount; } }); next.total = C.invoiceTotal(next); Object.assign(inv, next, { id: inv.id }); } });
  }
  var execute = R.execute;
  R.execute = function (type, id, action, p) {
    p = p || {};
    if (type === 'contractDraft' && action === 'approve') return approveDraft(id);
    var source = R.get(type, id), before = source && clone(source);
    if (type === 'invoice' && action === 'edit' && p.lines) {
      var allowed = R.inspect(type, id, action);
      if (!allowed.allowed) return { ok: false, error: allowed.reason };
      if (p.lines.length !== source.lines.length || p.lines.some(function (l) { return !Number.isFinite(l.amount); }) || C.sum(p.lines, function (l) { return l.amount; }) < 0) return { ok: false, error: 'Các dòng và tổng tiền hóa đơn không hợp lệ.' };
    }
    var result = execute(type, id, action, p);
    if (result.ok && ['edit', 'delete', 'restore', 'terms'].indexOf(action) >= 0) {
      if (type === 'invoice' && action === 'edit' && p.lines) { source.lines = source.lines.map(function (l, i) { return Object.assign({}, l, { amount: p.lines[i].amount, manualAmount: p.lines[i].amount }); }); source.total = C.invoiceTotal(source); TH.db.recordHistory[0].after = clone(source); }
      if (['reading', 'fee', 'billAdjustment'].indexOf(type) >= 0) refreshDrafts((source || result.record).roomId, (source || result.record).period);
      if (type === 'contract' && action === 'terms') refreshDrafts(source.roomId);
      if (type === 'room' && action === 'terms') TH.db.priceHistory.push({ roomId: id, from: p.effectiveFrom + '-01', rent: Number(p.rent), previous: before.rent });
    }
    return result;
  };
  // Existing destructive controls now enter the same checked forms.
  var redirects = { 'own.disable': ['owner', 'archive'], 'asset.remove': ['asset', 'delete'], 'veh.remove': ['vehicle', 'delete'], 'veh.end': ['vehicle', 'end'], 'inv.cancel': ['invoice', 'cancel'], 'inv.adjust': ['invoice', 'correct'], 'exp.reverse': ['expense', 'correct'], 'mtr.feeDel': ['fee', 'delete'], 'asg.end': ['assignment', 'end'], 'sys.disable': ['user', 'archive'], 'sys.enable': ['user', 'activate'] };
  Object.keys(redirects).forEach(function (name) { var rule = redirects[name]; TH.act[name] = function (el) { R.open(rule[0], el.dataset.id || el.dataset.u, rule[1]); }; if (TH.packagePolicy.actions[name]) TH.packagePolicy.actions[name] = ({ invoice: 'F025.A', expense: 'F035.A', assignment: 'F006.A' })[rule[0]] || 'F001.A'; });
  // Legacy edit handlers must revalidate even when invoked directly.
  var saves = { 'room.save': ['room', 'id'], 'hr.save': ['staff', 'id'], 'exp.save': ['expense', 'id'], 'veh.save': ['vehicle', 'id'], 'asset.save': ['asset', 'id'] };
  Object.keys(saves).forEach(function (name) { var fn = TH.act[name], rule = saves[name]; if (!fn) return; TH.act[name] = function (el) { var id = el.dataset[rule[1]], r = id && R.get(rule[0], id); if (!TH.can(R.definitions[rule[0]].permission)) { TH.toast('Không có quyền lưu', '', 'warning'); return; } if (r) { var ck = R.inspect(rule[0], id, 'edit'); if (!ck.allowed) { TH.toast('Không thể lưu', esc(ck.reason), 'warning'); return; } } return fn.apply(this, arguments); }; });
  var sectionSave = TH.sectionSave;
  TH.sectionSave = function () {
    var ed = TH.editing(); if (!ed) return true;
    var def = TH.SECTIONS[ed.key]; if (!TH.can(def.perm || 'master.edit')) { TH.toast('Không thể lưu', 'Quyền đã thay đổi.', 'warning'); return false; }
    var type = { ownInfo: 'owner', bldInfo: 'building', bldOps: 'building', bldFire: 'building', bldBiz: 'building', lease: 'lease', cusInfo: 'customer', cusPrice: 'contract', cusHandover: 'contract', cusNote: 'contract' }[ed.key];
    var snapshot = type && clone(R.get(type, ed.id)), draft = TH.store.draft(TH.secForm(ed.key, ed.id)) || {};
    if (type) {
      var action = draft.status === 'inactive' || draft.opTo ? 'archive' : 'edit', ck = R.inspect(type, ed.id, action);
      if (!ck.allowed) { TH.toast('Không thể lưu', esc(ck.reason), 'warning'); return false; }
    }
    var saved = sectionSave.apply(this, arguments);
    if (saved && type && snapshot) TH.db.recordHistory.unshift({ id: R.id('LOG'), type: type, recordId: ed.id, action: 'edit', before: snapshot, after: clone(R.get(type, ed.id)), by: TH.me().id, at: new Date().toISOString(), reason: 'Sửa nhóm thông tin', buildingId: R.building(type, snapshot) });
    return saved;
  };
  // Contract drafts have their own collection until approved, avoiding phantom occupancy.
  TH.act['con.saveDraft'] = function () {
    if (!TH.can('contract.edit')) return;
    R.init(); var g = function (k, d) { return TH.store.draft('con-new', k, d); }, room = C.room(g('room', ''));
    if (!room || !TH.inScope(room.buildingId)) { TH.toast('Chưa lưu', 'Chọn phòng trong phạm vi được giao.', 'warning'); return; }
    var id = g('_recordId', '') || R.id('HĐ-NHÁP'), r = R.get('contractDraft', id);
    var values = { id: id, roomId: room.id, buildingId: room.buildingId, customerId: g('customer', ''), rent: Number(g('rent', 0)), deposit: Number(g('deposit', 0)), start: g('start', ''), end: g('end', ''), svc: Number(g('svc', 150000)), net: Number(g('net', 100000)), status: 'draft', createdBy: TH.me().id, note: g('pnote', '') };
    if (values.customerId === 'OCR') { var job = TH.db.ocrJobs.find(function (j) { return j.kind === 'contract' && j.status === 'confirmed' && !j.used; }); if (job) { values.ocrData = clone(job.fields); values.ocrAssets = clone(job.assets || []); values.scanFile = job.file; values.customerData = { name: job.fields.customer, phone: job.fields.phone, dob: job.fields.dob, idNo: job.fields.idNo, idPlace: job.fields.idPlace, permAddress: job.fields.permAddress }; } }
    if (r) Object.assign(r, values); else TH.db.contractDrafts.push(values);
    TH.store.setDraft('con-new', '_recordId', id); TH.store.persist(); TH.app.refresh(); TH.toast('Đã lưu hợp đồng nháp', esc(id) + ' · mở lại từ Quản lý bản ghi.');
  };
  function approveDraft(id) {
    var check = R.inspect('contractDraft', id, 'approve'); if (!check.allowed) return { ok: false, error: check.reason };
    var r = check.record, room = C.room(r.roomId), customer = C.customer(r.customerId), newCustomer = false;
    if (!customer && r.customerId === 'OCR' && r.customerData) { customer = Object.assign({ id: R.id('KH'), status: 'active', vehicles: [], oaLinked: false, idType: 'CCCD', occupation: '', hometown: '', createdBy: TH.me().id, createdAt: TH.TODAY }, clone(r.customerData)); newCustomer = true; }
    if (!room || !customer || customer.status === 'inactive' || C.building(room.buildingId).status === 'inactive' || !r.start || r.end <= r.start || !(r.rent > 0)) return { ok: false, error: 'Nhập khách, phòng, giá thuê và thời hạn hợp lệ; hồ sơ cha phải đang hoạt động.' };
    if (room.status === 'inactive' || TH.db.contracts.some(function (ct) { return ct.roomId === room.id && ct.status !== 'cancelled' && ct.start <= r.end && ct.end >= r.start; })) return { ok: false, error: 'Phòng ngừng khai thác hoặc hợp đồng chồng thời gian thuê.' };
    if (newCustomer) { TH.db.customers.push(customer); R.audit('customer', customer, 'create', null, 'Từ hợp đồng nháp ' + id); }
    var ct = Object.assign({}, clone(r), { id: R.id('HĐ'), status: 'active', signedAt: TH.TODAY, people: 1, billingDay: 1, payCycle: 1, renewals: [], versions: [{ v: 1, at: TH.TODAY, by: TH.me().id, note: 'Duyệt từ ' + id }], fees: [], terms: TH.termsOf('DAYDU', r.start), priceList: TH.seedPriceList(C.building(room.buildingId), r.start, 1), scanFile: null });
    ct.customerId = customer.id;
    if (r.ocrData) { var read = function (key) { return r.ocrData[key]; }, O = TH.CONTRACT_OCR; ct.terms = O.buildTerms(read); ct.priceList = O.buildPriceList(read, r.start.slice(0, 7), 'OCR đã lưu trong nháp ' + id); ct.handover = O.handoverOf(read, r.ocrAssets || [], r.scanFile); ct.prepaid = O.prepaidOf(read); ct.people = +r.ocrData.people || 1; ct.scanFile = r.scanFile; }
    var draftBefore = clone(r);
    if (!r.ocrData) ct.priceList.forEach(function (l) { if (l.code === 'SVC' && r.svc !== undefined) l.price = +r.svc; if (l.code === 'NET' && r.net !== undefined) l.price = +r.net; });
    TH.syncFees(ct); TH.db.contracts.push(ct); TH.db.roomEvents.push({ roomId: room.id, at: r.start, from: room.status, to: 'occupied', by: TH.me().id, note: 'Duyệt ' + ct.id }); if (r.start <= TH.TODAY) room.status = 'occupied'; r.status = 'approved'; r.contractId = ct.id;
    if (r.previousContractId && C.contract(r.previousContractId)) { var previous = C.contract(r.previousContractId); previous.renewals = previous.renewals || []; previous.renewals.push({ id: R.id('GH'), mode: 'new_contract', from: ct.start, to: ct.end, at: TH.TODAY, by: TH.me().id, nextContractId: ct.id, evidence: 'Duyệt từ nháp ' + id }); }
    R.audit('contractDraft', r, 'approve', draftBefore, 'Duyệt hợp đồng nháp'); R.audit('contract', ct, 'create', null, 'Duyệt từ ' + id);
    TH.log('Duyệt hợp đồng nháp', ct.id, id, 'contract', room.buildingId); TH.store.persist(); return { ok: true, record: ct };
  }
  R.approveDraft = approveDraft;
  TH.onChange['imp.include'] = function (el) { var ids = TH.store.ui(el.dataset.screen, 'excluded', []).slice(), line = Number(el.dataset.line); ids = ids.filter(function (x) { return x !== line; }); if (!el.checked) ids.push(line); TH.store.setUi(el.dataset.screen, 'excluded', ids); TH.modal.rerenderAll(); };
  var pickImport = TH.act['imp.pick'];
  TH.act['imp.pick'] = function (el) { TH.store.setUi(el.dataset.screen, 'excluded', []); return pickImport.apply(this, arguments); };
  var addOwner = TH.act['own.add'];
  TH.act['own.add'] = function () { if (!TH.store.draft('own-new', 'id')) TH.store.setDraft('own-new', 'id', R.id('CN')); return addOwner.apply(this, arguments); };
  // Preserve issued report snapshots on every package; a replacement is a new record.
  if (TH.reports) {
    var reportConfirm = TH.reports.confirm;
    TH.reports.confirm = function (id, opts) {
      var draft = TH.reports.draft(id), originalEditOf = draft && draft.request.editOf, targetId = originalEditOf, previous = draft && draft.request.previousRunId && TH.reports.run(draft.request.previousRunId);
      if (!targetId && previous && previous.type === draft.request.type && previous.period === draft.request.period && JSON.stringify(previous.buildingIds.slice().sort()) === JSON.stringify(draft.request.buildingIds.slice().sort())) targetId = previous.id;
      var target = targetId && TH.reports.run(targetId);
      if (draft && target) { draft.request.replacesRunId = targetId; draft.request.editOf = null; }
      var result = reportConfirm.call(this, id, opts);
      if (result.ok && !result.duplicate) {
        result.runIds.forEach(function (runId, index) { var next = TH.reports.run(runId), prior = next.prevId && TH.reports.run(next.prevId), replaced = index === 0 && target ? target : prior;
          if (replaced) { next.fromRunId = next.fromRunId || replaced.id; next.replacesRunId = replaced.id; }
          [index === 0 && target, prior].filter(function (r, i, arr) { return r && r.id !== next.id && arr.indexOf(r) === i; }).forEach(function (r) { r.supersededBy = next.id; r.invalidatedAt = new Date().toISOString(); r.invalidatedBy = TH.me().id; r.invalidationReason = 'Được thay thế bởi ' + next.id; });
        }); TH.store.persist();
      }
      if (!result.ok && draft && target) draft.request.editOf = originalEditOf;
      return result;
    };
  }
  // Lifecycle labels on confirmed invoices must match the action they actually perform.
  var invoiceView = TH.views['INV-03'].render;
  TH.views['INV-03'].render = function () { var html = invoiceView.apply(this, arguments); return typeof html === 'string' ? html.replace(/Chỉnh\/hủy/g, 'Hủy hóa đơn') : html; };
  // Atomic import reversal: compare every before/after pair before changing anything.
  R.rollbackImport = function (id) {
    R.init();
    if (!TH.has('F002.D')) return { ok: false, error: 'Hoàn tác lô nhập có từ gói D.' };
    var batch = TH.db.importBatches.find(function (b) { return b.id === id; });
    if (!batch || !batch.changes) return { ok: false, error: 'Lô cũ thiếu ảnh trước/sau; mở từng bản ghi để sửa.' };
    if (batch.status === 'rolledback') return { ok: false, error: 'Lô đã được hoàn tác.' };
    for (var i = 0; i < batch.changes.length; i++) {
      var x = batch.changes[i], current = R.get(x.type, x.id);
      if (!current || JSON.stringify(current) !== JSON.stringify(x.after) || !R.visible(x.type, current)) return { ok: false, error: 'Bản ghi đã thay đổi hoặc ngoài phạm vi: ' + x.id };
      var permission = x.type === 'share' ? { allowed: TH.can('share.edit') && !TH.periodLocked(batch.period || TH.store.state.period), reason: 'Không có quyền sửa tỷ lệ hoặc kỳ lô nhập đã khóa.' } : R.inspect(x.type, x.id, 'edit'); if (!permission.allowed) return { ok: false, error: permission.reason };
      if (batch.historyIds && TH.db.recordHistory.some(function (h) { return h.type === x.type && h.recordId === x.id && batch.historyIds.indexOf(h.id) < 0; })) return { ok: false, error: 'Bản ghi có thao tác sau nhập: ' + x.id };
      if (x.footprint && JSON.stringify(R.dependencyFootprint(x.type, current)) !== JSON.stringify(x.footprint)) return { ok: false, error: 'Dữ liệu phụ thuộc đã thay đổi sau nhập: ' + x.id };
      if (x.type === 'share' && TH.db.reportRuns.some(function (r) { return (r.buildingIds || []).indexOf(current.buildingId) >= 0 && r.period >= (batch.period || current.from.slice(0, 7)); })) return { ok: false, error: 'Bảng tỷ lệ đã dùng trong báo cáo: ' + x.id };
      if (!x.before && R.dependencies(x.type, current).length) return { ok: false, error: 'Đã phát sinh dữ liệu phụ thuộc: ' + x.id };
      if (x.before && x.dependencies && R.dependencies(x.type, current).some(function (d) { return x.dependencies.indexOf(d.collection + ':' + d.id) < 0; })) return { ok: false, error: 'Có liên kết mới sau nhập: ' + x.id };
    }
    batch.changes.forEach(function (x) { var arr = R.list(x.type), index = arr.findIndex(function (r) { return r.id === x.id; }), record; if (x.before) { record = clone(x.before); arr[index] = record; } else { record = arr.splice(index, 1)[0]; record.deletedAt = new Date().toISOString(); record.deletedBy = TH.me().id; record.deleteReason = 'Hoàn tác lô ' + id; TH.db.recordTrash.push({ type: x.type, record: record }); } R.audit(x.type, record, 'rollback', x.after, 'Hoàn tác lô ' + id); });
    batch.status = 'rolledback'; TH.log('Hoàn tác lô nhập', id, batch.changes.length + ' bản ghi', 'import'); TH.store.persist(); return { ok: true };
  };
  var commit = TH.act['imp.commit'];
  TH.act['imp.commit'] = function (el) {
    var type = { 'OWN-IMP': 'owner', 'BLD-IMP': 'building', 'ROOM-IMP': 'room' }[el.dataset.screen];
    if (!type || !TH.can('master.edit') || !TH.has(TH.packagePolicy.imports[el.dataset.screen])) return;
    R.init();
    var before = clone(R.list(type)), count = TH.db.importBatches.length; commit.apply(this, arguments);
    if (TH.db.importBatches.length === count) return;
    var batch = TH.db.importBatches[0]; batch.changes = [];
    R.list(type).forEach(function (r) { var prev = before.find(function (x) { return x.id === r.id; }); if (JSON.stringify(prev) !== JSON.stringify(r)) { batch.changes.push({ type: type, id: r.id, before: prev || null, after: clone(r), footprint: R.dependencyFootprint(type, r), dependencies: R.dependencies(type, r).map(function (d) { return d.collection + ':' + d.id; }) }); R.audit(type, r, 'import', prev || null, 'Lô ' + batch.id); } }); batch.historyIds = TH.db.recordHistory.map(function (h) { return h.id; }); TH.store.persist();
  };
  TH.act['imp.rollback'] = function (el) { TH.confirm({ title: 'Hoàn tác lô ' + el.dataset.id + '?', body: '<p>Kiểm tra toàn bộ bản ghi trước khi khôi phục; dữ liệu đã được sử dụng sẽ chặn hoàn tác.</p>', ok: 'Hoàn tác', danger: true }).then(function (ok) { if (!ok) return; var result = R.rollbackImport(el.dataset.id); TH.toast(result.ok ? 'Đã hoàn tác' : 'Chưa thể hoàn tác', esc(result.error || el.dataset.id), result.ok ? 'success' : 'warning'); TH.app.refresh(); }); };
})();
