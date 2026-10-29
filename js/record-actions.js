/* CR-CRUD: record lifecycle, dependency checks and dated financial corrections.
 * DOM-free domain service shared by forms, menus and regression tests. */
(function () {
  'use strict';
  var C = TH.calc, clone = function (v) { return JSON.parse(JSON.stringify(v)); };
  var defs = {
    owner: ['owners', 'Chủ nhà', 'master.edit', 'OWN-01', 'OWN-02', 'name phone email address permAddress taxCode note'],
    building: ['buildings', 'Tòa nhà', 'master.edit', 'BLD-01', 'BLD-02', 'name short area address floors landArea buildArea floorArea note'],
    room: ['rooms', 'Phòng', 'master.edit', 'ROOM-01', 'ROOM-02', 'floor area note'],
    customer: ['customers', 'Khách thuê', 'contract.edit', 'CUS-01', 'CUS-02', 'name phone dob occupation permAddress hometown note'],
    occupant: ['occupants', 'Người ở cùng', 'contract.edit', 'CUS-02', '', 'name dob idNo phone relation from to note'],
    contract: ['contracts', 'Hợp đồng khách', 'contract.edit', 'CON-01', 'CON-02', 'note scanFile'],
    lease: ['leases', 'Hợp đồng thuê tòa', 'lease.edit', 'BLD-02', '', 'note file referrer'],
    followup: ['followUps', 'Lần liên hệ', 'contract.edit', 'CON-03', '', 'result moveOutAt callbackAt note'],
    assignment: ['assignments', 'Phân công', 'hr.edit', 'HR-01', '', 'from to role'],
    asset: ['assets', 'Tài sản', 'master.edit', 'BLD-02', '', 'name qty unit location condition note'],
    document: ['bldDocs', 'Tài liệu', 'master.edit', 'BLD-02', '', 'kind file note'],
    customerDocument: ['documents', 'Tài liệu khách thuê', 'contract.edit', 'CUS-02', '', 'kind file note'],
    landlordPay: ['landlordPays', 'Kỳ trả chủ nhà', 'lease.edit', 'BLD-02', '', 'from to dueAt amount note docNo'],
    reading: ['readings', 'Chỉ số', 'meter.edit', 'METER-01', '', 'elecPrev elecCur waterPrev waterCur note'],
    fee: ['extraFees', 'Phí phát sinh', 'meter.edit', 'METER-01', '', 'name qty price source'],
    invoice: ['invoices', 'Hóa đơn', 'invoice.confirm', 'INV-02', 'INV-03', 'dueAt note'],
    receipt: ['receipts', 'Phiếu thu', 'receipt.report', 'PAY-01', '', 'amount receivedAt method note evidence'],
    depositCase: ['depositCases', 'Đối chiếu cọc', 'deposit.propose', 'CUS-02', '', 'refundAmount forfeitAmount note'],
    deposit: ['deposits', 'Giao dịch cọc', 'deposit.propose', 'CUS-02', '', 'amount note'],
    expense: ['expenses', 'Chi phí', 'expense.create', 'EXP-01', '', 'description amount category docNo file date'],
    staff: ['staff', 'Nhân sự', 'hr.edit', 'HR-01', '', 'name phone title team'],
    team: ['teams', 'Đội nhóm', 'hr.edit', 'HR-01', '', 'name leaderId'],
    salaryAdjustment: ['salaryAdjustments', 'Điều chỉnh lương', 'salary.edit', 'SAL-01', '', 'amount reason type'],
    share: ['shares', 'Tỷ lệ cổ phần', 'share.edit', 'SHARE-01', '', 'ratio capital note'],
    shareholder: ['shareholders', 'Cổ đông', 'share.edit', 'SHARE-01', '', 'name phone note'],
    oaSchedule: ['oaSchedules', 'Lịch nhắc OA', 'oa.send', 'OA-01', '', 'name templateId day note'],
    oaTemplate: ['oaTemplates', 'Mẫu tin OA', 'oa.send', 'OA-01', '', 'name body'],
    message: ['messages', 'Tin chờ gửi', 'oa.send', 'OA-02', '', ''],
    user: ['users', 'Tài khoản', '*', 'SYS-01', '', 'username role scope'],
    report: ['reportRuns', 'Báo cáo đã lưu', 'report.all', 'REPORTS', '', ''],
    correction: ['recordCorrections', 'Phiếu điều chỉnh', 'receipt.report', '', '', 'reason'],
    billAdjustment: ['billAdjusts', 'Giảm trừ / phụ thu', 'invoice.adjust', 'INV-01', '', 'amount category reason kind']
  };
  var R = TH.recordActions = { definitions: {}, clone: clone };
  Object.keys(defs).forEach(function (type) { var d = defs[type]; R.definitions[type] = { type: type, collection: d[0], label: d[1], permission: d[2], screen: d[3], detail: d[4], fields: d[5].split(' ').filter(Boolean) }; });
  R.definitions.vehicle = { type: 'vehicle', collection: 'vehicles', label: 'Xe', permission: 'contract.edit', screen: 'CUS-02', detail: '', fields: ['type', 'plate', 'brand', 'color', 'from', 'to', 'note'] };
  R.id = function (prefix) { return (prefix || 'REC') + '-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12)); };
  R.init = function () {
    ['recordTrash', 'recordCorrections', 'recordHistory', 'oaSchedules', 'contractDrafts', 'recordVersions'].forEach(function (k) { TH.db[k] = TH.db[k] || []; });
    Object.keys(R.definitions).forEach(function (type) { if (type === 'vehicle') return; var d = R.definitions[type]; TH.db[d.collection] = TH.db[d.collection] || []; TH.db[d.collection].forEach(function (r) { if (!r.id) r.id = R.id(type); }); });
    TH.db.customers.forEach(function (c) { c.vehicles = c.vehicles || []; c.vehicles.forEach(function (v) { if (!v.id) v.id = R.id('XE'); }); });
  };
  R.list = function (type) { var d = R.definitions[type]; if (!d) return []; if (type === 'vehicle') return [].concat.apply([], TH.db.customers.map(function (k) { return k.vehicles || []; })); return TH.db[d.collection] || []; };
  R.get = function (type, id) { return R.list(type).find(function (r) { return r.id === id; }); };
  R.trash = function (type, id) { return (TH.db.recordTrash || []).find(function (r) { return r.type === type && r.record.id === id; }); };
  R.building = function (type, r) {
    if (!r) return null; if (type === 'building') return r.id;
    if (r.buildingId) return r.buildingId;
    if (r.invoiceId) { var i = C.invoice(r.invoiceId); if (i) return i.buildingId; }
    if (r.contractId) { var c = C.contract(r.contractId); if (c) return c.buildingId; }
    if (r.roomId) { var room = C.room(r.roomId); if (room) return room.buildingId; }
    if (r.customerId && type !== 'customer') { var customer = C.customer(r.customerId); if (customer) return R.building('customer', customer); }
    if (type === 'vehicle') { var k = TH.db.customers.find(function (x) { return (x.vehicles || []).indexOf(r) >= 0; }), deleted = R.trash(type, r.id); if (!k && deleted) k = C.customer(deleted.parentId); return k ? R.building('customer', k) : null; }
    if (type === 'customer') { var ct = C.customerContracts(r.id)[0]; return ct && ct.buildingId; }
    return null;
  };
  R.period = function (type, r) { if (r.period) return r.period; if (type === 'receipt') return String(r.receivedAt || '').slice(0, 7); if (type === 'landlordPay') return String(r.paidAt || r.from || '').slice(0, 7); return ''; };
  R.visible = function (type, r) {
    var b = R.building(type, r); if (b && !TH.inScope(b)) return false;
    if (r.buildingIds && r.buildingIds.some(function (id) { return !TH.inScope(id); })) return false;
    if (type === 'owner' && TH.store.state.role === 'manager') return TH.db.buildings.some(function (x) { return x.ownerId === r.id && TH.inScope(x.id); });
    if (type === 'vehicle' && TH.store.state.role === 'manager') { var parent = TH.db.customers.find(function (c) { return (c.vehicles || []).indexOf(r) >= 0; }), item = R.trash(type, r.id); if (!parent && item) parent = C.customer(item.parentId); return !!parent && R.visible('customer', parent); }
    if (type === 'customer' && TH.store.state.role === 'manager') { var cs = C.customerContracts(r.id); return cs.length ? cs.every(function (x) { return TH.inScope(x.buildingId); }) : !r.createdBy || r.createdBy === TH.me().id; }
    return true;
  };
  var foreign = { owner: ['ownerId'], building: ['buildingId'], room: ['roomId'], customer: ['customerId'], contract: ['contractId', 'previousContractId'], lease: ['leaseId'], invoice: ['invoiceId'], receipt: ['receiptId'], expense: ['expenseId'], staff: ['staffId', 'managerId', 'leaderId', 'createdBy', 'approvedBy', 'enteredBy', 'reportedBy', 'confirmedBy', 'by', 'technicianId'], team: ['team'], shareholder: ['shareholderId'], asset: ['assetId'], oaTemplate: ['template', 'templateId'], user: ['userId'] };
  R.dependencies = function (type, r, activeOnly) {
    var keys = type === 'followup' ? ['sourceFollowupId'] : (foreign[type] || []), out = [];
    Object.keys(TH.db).forEach(function (collection) {
      if (!Array.isArray(TH.db[collection]) || /^(record|audit|reportDrafts)/.test(collection)) return;
      TH.db[collection].forEach(function (x) {
        if (x === r) return;
        if (activeOnly && (['inactive', 'ended', 'cancelled', 'rejected', 'retired', 'terminated'].indexOf(x.status) >= 0 || (x.to && x.to < TH.TODAY))) return;
        if (keys.some(function (key) { return x[key] === r.id; }) || (type === 'building' && (x.buildings || x.buildingIds || []).indexOf(r.id) >= 0)) out.push({ collection: collection, id: x.id || x.roomId || x.buildingId, record: x });
      });
    });
    if (type === 'customer' && (r.vehicles || []).length) out.push({ collection: 'vehicles', id: r.vehicles[0].id });
    if (['reading', 'fee', 'billAdjustment'].indexOf(type) >= 0) TH.db.invoices.filter(function (i) { return i.roomId === r.roomId && i.period === r.period && i.status !== 'cancelled'; }).forEach(function (i) { out.push({ collection: 'invoices', id: i.id, record: i }); });
    if (type === 'asset' && r.source && !r.createdBy) out.push({ collection: 'handover', id: r.source });
    if (type === 'invoice') out = out.filter(function (x) { return x.collection !== 'messages' || x.record.status === 'sent'; });
    return out;
  };
  var financial = ['invoice', 'receipt', 'expense', 'deposit', 'landlordPay', 'salaryAdjustment'];
  R.isPosted = function (type, r) { return financial.indexOf(type) >= 0 && (['confirmed', 'approved'].indexOf(r.status) >= 0 || type === 'landlordPay' && r.paid > 0 || type === 'salaryAdjustment' && TH.db.salaryState && TH.db.salaryState[r.period] && TH.db.salaryState[r.period].status !== 'draft'); };
  R.openPeriods = function () { return TH.PERIODS.filter(function (p) { return !TH.periodLocked(p); }); };
  R.dependencyFootprint = function (type, r) {
    var seen = new Set([r]), tokens = [];
    function hash(record) { var s = JSON.stringify(record), h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }
    function visit(t, record) { R.dependencies(t, record).forEach(function (d) { if (!d.record || seen.has(d.record)) return; seen.add(d.record); tokens.push(d.collection + ':' + d.id + ':' + hash(d.record)); var childType = Object.keys(R.definitions).find(function (key) { return R.definitions[key].collection === d.collection; }); if (childType) visit(childType, d.record); }); }
    visit(type, r);
    var building = R.building(type, r), period = R.period(type, r);
    (TH.db.reportRuns || []).filter(function (report) { return (building ? (report.buildingIds || []).indexOf(building) >= 0 : ['staff', 'salaryInput', 'salaryAdjustment'].indexOf(type) >= 0) && (!period || report.period >= period); }).forEach(function (report) { if (!seen.has(report)) tokens.push('reportRuns:' + report.id + ':' + hash(report)); });
    return tokens.sort();
  };
  R.amount = function (type, r) { return type === 'invoice' ? +r.total : type === 'landlordPay' ? +r.paid || 0 : +r.amount || 0; };
  R.corrected = function (type, id, period) { return (TH.db.recordCorrections || []).filter(function (x) { return x.sourceType === type && x.sourceId === id && x.status === 'approved' && (!period || x.targetPeriod <= period); }); };
  R.effectiveAmount = function (type, r, period) { return R.amount(type, r) + C.sum(R.corrected(type, r.id, period), function (x) { return x.delta; }); };
  R.expenseMeta = function (r) { return { category: r.category, description: r.description, docNo: r.docNo || '' }; };
  R.effectiveExpense = function (r) { var result = Object.assign({}, r); R.corrected('expense', r.id).forEach(function (c) { if (c.replacement) Object.assign(result, c.replacement); }); result.amount = R.effectiveAmount('expense', r); return result; };
  R.inspect = function (type, id, action) {
    var d = R.definitions[type], t = R.trash(type, id), r = action === 'restore' && t ? t.record : R.get(type, id), out = { allowed: false, reason: '', related: [], record: r };
    function no(msg) { out.reason = msg; return out; }
    if (!d || !r) return no('Bản ghi không còn tồn tại.');
    if (!R.visible(type, r)) return no('Bản ghi nằm ngoài phạm vi tòa được giao.');
    var role = TH.store.state.role, actor = TH.me().id;
    var canEdit = TH.can(d.permission) || type === 'assignment' && TH.can('master.edit') || type === 'staff' && role === 'accountant';
    if (type === 'correction') canEdit = ['admin', 'accountant', 'manager'].indexOf(role) >= 0;
    if (action === 'correct' && type === 'invoice' && TH.can('invoice.adjust')) canEdit = true;
    if (d.screen && !TH.canScreen(d.screen)) return no('Vai trò hiện tại không được mở phân hệ này.');
    if (type === 'correction' && ['admin', 'accountant', 'manager'].indexOf(role) < 0) return no('Không có quyền xem phiếu điều chỉnh.');
    if (!canEdit && action !== 'view') return no('Vai trò hiện tại không có quyền thao tác.');
    if (action === 'view') { out.allowed = true; return out; }
    if (['edit', 'delete', 'restore', 'archive', 'activate', 'cancel', 'withdraw', 'submit', 'approve', 'reject', 'correct', 'end', 'invalidate', 'terms'].indexOf(action) < 0) return no('Thao tác không hợp lệ.');
    if (type === 'user' && ['archive', 'delete'].indexOf(action) >= 0) {
      if (r.staffId === actor) return no('Không thể khóa hoặc xóa tài khoản đang sử dụng.');
      if (r.role === 'admin' && r.status === 'active' && TH.db.users.filter(function (u) { return u.role === 'admin' && u.status === 'active'; }).length <= 1) return no('Phải giữ ít nhất một Admin đang hoạt động.');
    }
    var period = R.period(type, r), posted = R.isPosted(type, r), locked = period && TH.periodLocked(period);
    if (role === 'manager' && financial.indexOf(type) >= 0 && ['correct', 'view'].indexOf(action) < 0 && (posted || (r.createdBy || r.reportedBy || r.enteredBy) !== actor)) return no('Chỉ được sửa hoặc rút chứng từ do mình lập; chứng từ đã xác nhận cần gửi điều chỉnh.');
    if (action === 'correct') {
      if (!posted) return no('Chỉ lập điều chỉnh cho chứng từ đã xác nhận.');
      if (!R.openPeriods().length) return no('Không có kỳ đang mở để ghi nhận điều chỉnh.');
      if (['admin', 'accountant', 'manager'].indexOf(role) < 0) return no('Không có quyền gửi điều chỉnh tài chính.');
    } else if (type === 'correction') {
      if (action === 'approve' || action === 'reject') {
        if (['admin', 'accountant'].indexOf(role) < 0) return no('Chỉ Kế toán/Admin duyệt điều chỉnh.');
        if (r.createdBy === actor) return no('Người lập không được tự duyệt điều chỉnh.');
        if (r.status !== 'pending') return no('Phiếu không còn chờ duyệt.');
        if (action === 'approve' && TH.periodLocked(r.targetPeriod)) return no('Kỳ ghi nhận đã khóa.');
      } else if (['edit', 'delete', 'submit', 'withdraw'].indexOf(action) >= 0) {
        if (r.createdBy !== actor) return no('Chỉ người lập được thay đổi phiếu này.');
        if (r.status === 'approved') return no('Phiếu đã duyệt được giữ nguyên.');
      } else return no('Thao tác không áp dụng cho phiếu điều chỉnh.');
    } else {
      if (locked && ['edit', 'delete', 'cancel', 'withdraw', 'submit', 'approve'].indexOf(action) >= 0) return no('Kỳ đã khóa; lập điều chỉnh trong kỳ đang mở.');
      if (posted && ['edit', 'delete', 'withdraw'].indexOf(action) >= 0) return no('Chứng từ đã xác nhận; sử dụng Lập điều chỉnh.');
      if (type === 'report' && action !== 'invalidate') return no('Báo cáo đã lưu chỉ đọc; đánh dấu hết hiệu lực và tạo bản thay thế.');
      if (type === 'message' && (action !== 'cancel' || ['pending', 'queued'].indexOf(r.status) < 0)) return no('Chỉ hủy được tin đang chờ gửi.');
      if (type === 'oaTemplate' && action === 'edit' && TH.db.messages.some(function (m) { return m.template === id && m.status === 'sent'; })) return no('Mẫu đã gửi: tạo mẫu mới để giữ lịch sử nội dung.');
      if (type === 'oaSchedule' && action === 'delete' && r.lastRunAt) return no('Lịch đã chạy; dùng Tạm dừng.');
      if (type === 'vehicle' && action === 'delete' && r.status !== 'pending') return no('Xe đã xác nhận; dùng Ngừng sử dụng.');
      if (type === 'depositCase' && ['pending', 'pending_approval', 'approved', 'refunded', 'settled', 'forfeited', 'transferred'].indexOf(r.state) >= 0 && ['edit', 'delete'].indexOf(action) >= 0) return no('Hồ sơ cọc đã gửi duyệt hoặc đã chi; rút yêu cầu hoặc điều chỉnh giao dịch cọc.');
      if (action === 'withdraw' && r.status !== 'pending' && ['pending', 'pending_approval'].indexOf(r.state) < 0) return no('Chỉ rút được yêu cầu đang chờ duyệt.');
      if (action === 'submit' && ['draft', 'rejected'].indexOf(r.status) < 0) return no('Chỉ gửi được bản nháp hoặc phiếu bị trả lại.');
      if (['reading', 'fee', 'billAdjustment'].indexOf(type) >= 0 && ['edit', 'delete'].indexOf(action) >= 0) {
        out.related = R.dependencies(type, r).filter(function (x) { return x.record && x.record.status === 'confirmed'; });
        if (out.related.length) return no('Đã sử dụng trong hóa đơn ' + out.related.map(function (x) { return x.id; }).join(', ') + '. Mở hóa đơn để điều chỉnh.');
      }
      if (action === 'delete') {
        out.related = R.dependencies(type, r);
        if (out.related.length) return no('Đang liên kết ' + out.related.length + ' bản ghi: ' + out.related.slice(0, 3).map(function (x) { return x.id; }).join(', ') + '.');
        if (['contract', 'lease'].indexOf(type) >= 0 && r.status !== 'draft') return no('Hợp đồng đã có hiệu lực; dùng Kết thúc.');
        if (type === 'share' && (+r.ratio !== 0 || r.from < TH.store.state.period + '-01')) return no('Chỉ xóa dòng mới có tỷ lệ 0%; cân đối lại cả bảng trước khi xóa.');
      }
      if (action === 'archive' || action === 'end') {
        if (['contract', 'lease', 'assignment', 'vehicle'].indexOf(type) >= 0) {
          if (r.status === 'ended' || r.to && r.to < TH.TODAY) return no('Bản ghi đã kết thúc.');
          if (type === 'contract' && C.contractDebt(id).debt > 0) return no('Hợp đồng còn công nợ; quyết toán trước khi kết thúc.');
        } else {
          out.related = R.dependencies(type, r, true).filter(function (x) { return ['buildings', 'contracts', 'rooms', 'assignments', 'staff', 'leases', 'teams', 'users'].indexOf(x.collection) >= 0; });
          if (out.related.length) return no('Còn liên kết đang hoạt động: ' + out.related.slice(0, 3).map(function (x) { return x.id; }).join(', '));
        }
      }
      if (action === 'cancel' && type === 'invoice') {
        if (r.status !== 'confirmed') return no('Chỉ hủy hóa đơn đã phát hành, chưa thu tiền.');
        out.related = C.receiptsOf(id).filter(function (p) { return p.status === 'pending' || p.status === 'confirmed' && R.effectiveAmount('receipt', p) !== 0; }).map(function (p) { return { collection: 'receipts', id: p.id }; });
        if (out.related.length) return no('Còn phiếu thu liên quan; xử lý phiếu thu trước khi hủy hóa đơn.');
        if (R.corrected('invoice', id).length) return no('Hóa đơn đã có điều chỉnh; tiếp tục bằng phiếu điều chỉnh.');
      }
    }
    if (action === 'restore') {
      if (R.get(type, id)) return no('Mã bản ghi đã tồn tại.');
      if (type === 'occupant' && r.idNo && R.list('occupant').some(function (x) { return x.contractId === r.contractId && x.idNo === r.idNo; })) return no('Giấy tờ đã được khai trong hợp đồng này.');
      var parentChecks = { buildingId: 'building', ownerId: 'owner', customerId: 'customer', roomId: 'room', invoiceId: 'invoice', contractId: 'contract', staffId: 'staff' };
      for (var key in parentChecks) if (r[key] && r[key] !== '—' && !R.get(parentChecks[key], r[key])) return no('Đối tượng liên quan ' + r[key] + ' không còn tồn tại.');
    }
    out.allowed = true; return out;
  };
  function assert(ok, msg) { if (!ok) throw Error(msg); }
  R.validDate = function (s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false; var d = new Date(s + 'T00:00:00Z'); return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; };
  R.validMonth = function (s) { return /^\d{4}-\d{2}$/.test(s || '') && +s.slice(5) >= 1 && +s.slice(5) <= 12; };
  function audit(type, r, action, before, reason) {
    TH.db.recordHistory = TH.db.recordHistory || [];
    var entry = { id: R.id('LOG'), type: type, recordId: r.id, action: action, by: TH.me().id, at: new Date().toISOString(), reason: reason || '', before: before, after: clone(r), buildingId: R.building(type, r) };
    TH.db.recordHistory.unshift(entry);
    TH.log(action + ' · ' + R.definitions[type].label, r.id, reason || '', 'record', entry.buildingId);
  }
  function validate(type, r, values) {
    var n = Object.assign({}, r, values);
    ['dob', 'receivedAt', 'dueAt', 'date', 'start', 'end', 'moveOutAt', 'callbackAt', 'from', 'to'].forEach(function (key) { if (key in values && values[key]) assert(type === 'landlordPay' && (key === 'from' || key === 'to') ? R.validMonth(values[key]) : R.validDate(values[key]), 'Ngày / kỳ không hợp lệ: ' + key); });
    if (type === 'expense' && values.date) assert(values.date.slice(0, 7) === r.period, 'Ngày chi phải thuộc kỳ chứng từ; chuyển kỳ bằng phiếu điều chỉnh.');
    ['name', 'description', 'username'].forEach(function (k) { if (k in values) assert(String(values[k]).trim(), 'Không được để trống ' + k + '.'); });
    ['amount', 'price', 'rent', 'deposit', 'qty', 'floor', 'floors', 'capital', 'base', 'allowance'].forEach(function (k) { if (k in values) assert(Number.isFinite(+values[k]) && (type === 'salaryAdjustment' || +values[k] >= 0), 'Giá trị số không hợp lệ: ' + k); });
    if ((type === 'room' || type === 'asset') && 'area' in values) assert(Number.isFinite(+values.area) && +values.area >= 0, 'Diện tích không hợp lệ.');
    if (type === 'reading') {
      ['elecPrev', 'elecCur', 'waterPrev', 'waterCur'].forEach(function (key) { if (key in values) assert(values[key] !== null && values[key] !== '' && Number.isFinite(+values[key]) && +values[key] >= 0, 'Nhập chỉ số không âm hợp lệ.'); });
      assert((n.elecCur === null || +n.elecCur >= +n.elecPrev) && (n.waterCur === null || +n.waterCur >= +n.waterPrev), 'Chỉ số mới phải lớn hơn hoặc bằng chỉ số cũ.');
    }
    if (type === 'depositCase') assert(+n.refundAmount >= 0 && +n.forfeitAmount >= 0 && +n.refundAmount + +n.forfeitAmount + C.sum(n.deductions || [], function (x) { return x.amount; }) === +n.amount, 'Hoàn + giữ + khấu trừ phải bằng đúng tiền cọc.');
    if (type === 'receipt') { assert(+n.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(n.receivedAt), 'Nhập số tiền dương và ngày thực nhận hợp lệ.'); assert(!TH.periodLocked(n.receivedAt.slice(0, 7)), 'Ngày thực nhận thuộc kỳ đã khóa.'); }
    if (type === 'occupant') {
      var ct = C.contract(n.contractId);
      assert(ct && ct.customerId === n.customerId && ct.roomId === n.roomId && ct.buildingId === n.buildingId, 'Hợp đồng của người ở cùng không còn hợp lệ.');
      assert(n.from && R.validDate(n.from) && n.from >= ct.start, 'Ngày bắt đầu ở phải thuộc thời gian hợp đồng.');
      assert(!n.to || n.to >= n.from, 'Ngày rời đi phải từ ngày bắt đầu ở trở đi.');
      assert(!n.dob || n.dob < n.from, 'Ngày sinh phải trước ngày bắt đầu ở.');
      assert(!n.idNo || !R.list('occupant').some(function (x) { return x !== r && x.contractId === n.contractId && x.idNo === n.idNo; }), 'Giấy tờ đã được khai trong hợp đồng này.');
    }
    if (type === 'oaSchedule') assert(Number.isInteger(+n.day) && +n.day >= 1 && +n.day <= 31 && TH.db.oaTemplates.some(function (t) { return t.id === n.templateId; }), 'Chọn mẫu tin và ngày nhắc từ 1 đến 31.');
    if (n.from && n.to) assert(n.to >= n.from, 'Ngày kết thúc phải sau ngày bắt đầu.');
    if (type === 'user') {
      assert(TH.ROLES[n.role], 'Vai trò không hợp lệ.');
      assert(!TH.db.users.some(function (x) { return x !== r && x.username === n.username; }), 'Tên đăng nhập đã tồn tại.');
      assert(Array.isArray(n.scope) && n.scope.every(function (id) { return C.building(id); }), 'Phạm vi tòa không hợp lệ.');
      if (r.role === 'admin' && n.role !== 'admin') assert(r.staffId !== TH.me().id && TH.db.users.some(function (x) { return x !== r && x.role === 'admin' && x.status === 'active'; }), 'Không thể đổi vai trò Admin hiện tại hoặc Admin cuối cùng.');
    }
    if (type === 'team') assert(C.staff(n.leaderId) && C.staff(n.leaderId).status === 'active', 'Trưởng nhóm không tồn tại hoặc đã ngừng hoạt động.');
    if (type === 'staff') assert(TH.db.teams.some(function (t) { return t.id === n.team && t.status !== 'inactive'; }), 'Đội nhóm không hoạt động.');
    if (type === 'share') assert(Math.abs(C.sum(C.sharesFor(r.buildingId, TH.store.state.period).filter(function (x) { return x.id !== r.id; }), function (x) { return x.ratio; }) + +n.ratio - 100) < 0.00001, 'Tổng tỷ lệ của tòa phải bằng 100%. Sửa qua bảng tỷ lệ để cân đối nhiều dòng.');
  }
  R.audit = audit;
  R.validate = validate;
  R.execute = function (type, id, action, payload) {
    R.init(); payload = payload || {};
    var check = R.inspect(type, id, action); if (!check.allowed) return { ok: false, error: check.reason, related: check.related };
    var r = check.record, before = clone(r), reason = String(payload.reason || '').trim(), d = R.definitions[type];
    try {
      if (['delete', 'archive', 'end', 'cancel', 'invalidate', 'correct', 'reject', 'terms'].indexOf(action) >= 0) assert(reason, 'Nhập lý do / căn cứ thực hiện.');
      if (action === 'correct') return R.makeCorrection(type, r, payload);
      if (action === 'approve' && type === 'correction') return R.approveCorrection(r, payload);
      if (action === 'edit') {
        var values = {};
        d.fields.forEach(function (k) { if (payload.values && Object.prototype.hasOwnProperty.call(payload.values, k)) values[k] = payload.values[k]; });
        validate(type, r, values);
        Object.keys(values).forEach(function (k) { if (typeof r[k] === 'number' || ['amount', 'qty', 'price', 'ratio', 'capital', 'rent', 'deposit', 'base', 'allowance', 'day', 'refundAmount', 'forfeitAmount', 'floor', 'floors', 'landArea', 'buildArea', 'floorArea', 'elecPrev', 'elecCur', 'waterPrev', 'waterCur'].indexOf(k) >= 0) values[k] = Number(values[k]); });
        if ((type === 'document' || type === 'customerDocument') && values.file && values.file !== r.file) { r.versions = r.versions || []; r.versions.push({ file: r.file, version: r.version || 1, at: new Date().toISOString() }); r.version = (r.version || 1) + 1; }
        Object.assign(r, values);
        if (type === 'reading') r.status = 'draft';
      } else if (action === 'delete') {
        r.deletedAt = new Date().toISOString(); r.deletedBy = TH.me().id; r.deleteReason = reason;
        var parent = type === 'vehicle' ? TH.db.customers.find(function (c) { return (c.vehicles || []).indexOf(r) >= 0; }) : null;
        TH.db.recordTrash.push({ type: type, record: r, parentId: parent && parent.id });
        var arr = parent ? parent.vehicles : R.list(type); arr.splice(arr.indexOf(r), 1);
      } else if (action === 'restore') {
        var item = R.trash(type, id), parentRecord = item.parentId && C.customer(item.parentId);
        assert(!item.parentId || parentRecord, 'Hồ sơ khách cha không còn tồn tại.');
        delete r.deletedAt; delete r.deletedBy; delete r.deleteReason;
        (parentRecord ? parentRecord.vehicles : R.list(type)).push(r); TH.db.recordTrash.splice(TH.db.recordTrash.indexOf(item), 1);
      } else if (action === 'withdraw') { if (type === 'depositCase') r.state = 'reconciling'; else r.status = 'draft'; }
      else if (action === 'submit') { r.status = 'pending'; r.submittedAt = new Date().toISOString(); }
      else if (action === 'reject') { r.status = 'rejected'; r.rejectedBy = TH.me().id; r.rejectReason = reason; }
      else if (action === 'cancel') { r.status = 'cancelled'; r.cancelledAt = new Date().toISOString(); r.cancelReason = reason; }
      else if (action === 'invalidate') { assert(!r.invalidatedAt, 'Báo cáo đã hết hiệu lực.'); r.invalidatedAt = new Date().toISOString(); r.invalidatedBy = TH.me().id; r.invalidationReason = reason; }
      else if (action === 'terms') {
        assert(['contract', 'lease', 'room'].indexOf(type) >= 0, 'Đối tượng không có điều khoản giá.');
        assert(R.validMonth(payload.effectiveFrom) && !TH.periodLocked(payload.effectiveFrom), 'Chọn kỳ hiệu lực đang mở hợp lệ.');
        assert(Number.isFinite(+payload.rent) && +payload.rent > 0, 'Nhập giá thuê lớn hơn 0.');
        r.rateChanges = r.rateChanges || [];
        var oldRate = r.rateChanges.find(function (x) { return x.from === payload.effectiveFrom; });
        if (oldRate) { TH.db.recordVersions.push({ type: type, recordId: r.id, rate: clone(oldRate) }); r.rateChanges.splice(r.rateChanges.indexOf(oldRate), 1); }
        r.rateChanges.push({ id: R.id('RATE'), from: payload.effectiveFrom, rent: +payload.rent, reason: reason, by: TH.me().id });
      } else if (action === 'archive' || action === 'end') {
        r.previousStatus = r.status; r.status = ['contract', 'lease', 'assignment', 'vehicle'].indexOf(type) >= 0 ? 'ended' : type === 'asset' ? 'retired' : 'inactive';
        r.endedAt = payload.date || TH.TODAY; r.archiveReason = reason;
        if (action === 'end' && r.endedAt > TH.TODAY) { r.status = r.previousStatus || 'active'; r.scheduledEnd = r.endedAt; }
        if (type === 'assignment' || type === 'vehicle') r.to = r.endedAt;
        if (type === 'building') r.opTo = r.endedAt;
        if (type === 'lease') r.end = r.endedAt;
        if (type === 'contract') { r.end = r.endedAt; var room = C.room(r.roomId); if (room && !TH.db.contracts.some(function (x) { return x !== r && x.roomId === room.id && x.status === 'active'; })) { TH.db.roomEvents.push({ roomId: room.id, at: r.endedAt, from: room.status, to: 'vacant', by: TH.me().id, note: reason }); if (r.endedAt <= TH.TODAY) room.status = 'vacant'; } }
      } else if (action === 'activate') { assert(['contract', 'lease'].indexOf(type) < 0, 'Hợp đồng kết thúc cần tạo hồ sơ mới.'); r.status = r.previousStatus || 'active'; delete r.endedAt; if (type === 'building') r.opTo = null; if (type === 'vehicle') r.to = null; }
      else if (action !== 'view') return { ok: false, error: 'Thao tác chưa áp dụng cho loại bản ghi này.' };
      if (action !== 'view') { audit(type, r, action, before, reason); TH.store.persist(); }
      return { ok: true, record: r };
    } catch (e) { return { ok: false, error: e.message }; }
  };
  R.makeCorrection = function (type, source, p) {
    var target = p.targetPeriod, value = Number(p.amount), old = R.effectiveAmount(type, source), actor = TH.me().id;
    assert(R.openPeriods().indexOf(target) >= 0 && target >= R.period(type, source), 'Kỳ điều chỉnh phải đang mở và không trước kỳ nguồn.');
    assert(Number.isFinite(value) && (['salaryAdjustment', 'salaryInput'].indexOf(type) >= 0 || value >= 0), 'Số tiền đúng phải là số không âm (điều chỉnh lương cho phép khoản trừ).');
    var beforeExpense = type === 'expense' ? R.expenseMeta(R.effectiveExpense(source)) : null, replacement = beforeExpense && Object.assign({}, beforeExpense);
    if (replacement && p.replacement) ['category', 'description', 'docNo'].forEach(function (key) { if (p.replacement[key] !== undefined) replacement[key] = String(p.replacement[key]).trim(); });
    if (replacement) { assert(TH.EXPENSE_CATS[replacement.category] && replacement.description, 'Chọn nhóm chi và nhập diễn giải khoản thay thế.'); }
    assert(value !== old || replacement && JSON.stringify(replacement) !== JSON.stringify(beforeExpense), 'Số tiền và thông tin thay thế không có thay đổi.');
    assert(!(TH.db.recordCorrections || []).some(function (x) { return x.sourceType === type && x.sourceId === source.id && ['draft', 'pending'].indexOf(x.status) >= 0; }), 'Chứng từ đã có phiếu điều chỉnh chưa xử lý.');
    var mode = p.mode || 'recording';
    assert(['recording', 'cash', 'allocation'].indexOf(mode) >= 0, 'Loại điều chỉnh không hợp lệ.');
    if (mode === 'allocation') {
      var originalInvoice = C.invoice(source.invoiceId), targetInvoice = C.invoice(p.targetInvoiceId);
      assert(type === 'receipt' && value < old && targetInvoice && targetInvoice.id !== source.invoiceId && targetInvoice.status === 'confirmed' && originalInvoice.customerId === targetInvoice.customerId && TH.inScope(targetInvoice.buildingId), 'Chọn hóa đơn khác của cùng khách trong phạm vi; số tiền còn lại phải nhỏ hơn số hiện tại.');
    }
    if (mode === 'cash') { assert(String(p.evidence || '').trim(), 'Giao dịch tiền thực tế cần mã giao dịch / chứng từ.'); assert(R.validDate(p.date) && p.date.slice(0, 7) === target, 'Ngày giao dịch hợp lệ phải thuộc kỳ ghi nhận.'); }
    var rec = { id: R.id('DC'), sourceType: type, sourceId: source.id, sourcePeriod: R.period(type, source), targetPeriod: target, buildingId: R.building(type, source), beforeAmount: old, amount: value, delta: value - old, mode: mode, targetInvoiceId: mode === 'allocation' ? p.targetInvoiceId : null, evidence: p.evidence || '', reason: String(p.reason).trim(), status: p.draft ? 'draft' : 'pending', createdBy: actor, createdAt: new Date().toISOString(), lines: [{ delta: value - old, sourceId: source.id }], sourceSnapshot: clone(source) };
    rec.transactionDate = mode === 'cash' ? p.date : null;
    if (replacement) { rec.beforeExpense = beforeExpense; rec.replacement = replacement; }
    if (type === 'invoice') { var idx = Number(p.lineIndex || 0); assert(idx === -1 || source.lines[idx], 'Chọn dòng hóa đơn cần điều chỉnh.'); rec.lineIndex = idx; rec.lineType = idx === -1 ? (rec.delta < 0 ? 'adjust' : 'extra') : source.lines[idx].type; rec.lineCode = idx === -1 ? 'EXTRA' : source.lines[idx].code; rec.lineName = idx === -1 ? String(p.lineName || 'Khoản phát sinh').trim() : source.lines[idx].name; }
    TH.db.recordCorrections.push(rec); audit('correction', rec, 'submit', null, rec.reason); TH.store.persist(); return { ok: true, record: rec };
  };
  R.approveCorrection = function (rec) {
    var check = R.inspect('correction', rec.id, 'approve'); assert(check.allowed, check.reason);
    var source = R.get(rec.sourceType, rec.sourceId); assert(source, 'Chứng từ nguồn không còn tồn tại.');
    assert(R.visible(rec.sourceType, source) && R.isPosted(rec.sourceType, source) && source.status !== 'cancelled', 'Chứng từ nguồn đã thay đổi trạng thái hoặc phạm vi.');
    if (rec.mode === 'allocation') { var targetInvoice = C.invoice(rec.targetInvoiceId); assert(targetInvoice && targetInvoice.status === 'confirmed' && TH.inScope(targetInvoice.buildingId), 'Hóa đơn nhận phân bổ không còn hợp lệ hoặc ngoài phạm vi.'); }
    assert(R.effectiveAmount(rec.sourceType, source) === rec.beforeAmount, 'Số tiền nguồn đã thay đổi; trả lại phiếu để lập lại.');
    if (rec.beforeExpense) assert(JSON.stringify(R.expenseMeta(R.effectiveExpense(source))) === JSON.stringify(rec.beforeExpense), 'Phân loại nguồn đã thay đổi; trả lại để lập lại phiếu.');
    var before = clone(rec); rec.status = 'approved'; rec.approvedBy = TH.me().id; rec.approvedAt = new Date().toISOString();
    var date = rec.transactionDate || rec.targetPeriod + '-28', posting = { id: 'POST-' + rec.id, correctionId: rec.id, sourceId: source.id, sourceType: rec.sourceType, period: rec.targetPeriod, date: date, amount: rec.delta, note: rec.reason, createdBy: rec.createdBy, approvedBy: rec.approvedBy, evidence: rec.evidence };
    if (rec.sourceType === 'expense') {
      rec.postingIds = [];
      [{ suffix: '-REV', amount: -rec.beforeAmount, label: 'Đảo' }, { suffix: '-NEW', amount: rec.amount, label: 'Thay thế' }].forEach(function (part) {
        if (!part.amount) return;
        var id = posting.id + part.suffix; rec.postingIds.push(id);
        var metadata = part.suffix === '-REV' ? (rec.beforeExpense || R.expenseMeta(source)) : (rec.replacement || R.expenseMeta(source));
        TH.db.expenses.push(Object.assign({}, clone(source), posting, metadata, { id: id, amount: part.amount, status: 'approved', description: part.label + ' ' + source.id + ': ' + metadata.description + ' · ' + rec.reason, paid: rec.mode === 'cash', replacesExpenseId: source.id, elec: metadata.category === 'utility' ? Math.round(part.amount * (source.category === 'utility' && source.amount ? ((source.elec === undefined ? source.amount * .8 : source.elec) / source.amount) : .8)) : undefined }));
      });
    }
    if (rec.sourceType === 'deposit') TH.db.deposits.push(Object.assign({}, clone(source), posting, { status: 'confirmed', cashMovement: rec.mode === 'cash' }));
    if (rec.sourceType === 'salaryAdjustment' || rec.sourceType === 'salaryInput') TH.db.salaryAdjustments.push(Object.assign({}, clone(source), posting, { status: 'approved' }));
    if (rec.sourceType === 'receipt') TH.db.receipts.push(Object.assign({}, clone(source), posting, { status: 'confirmed', receivedAt: date, reportedAt: date, confirmedAt: date, confirmedBy: rec.approvedBy, cashMovement: rec.mode === 'cash' }));
    if (rec.mode === 'allocation') TH.db.receipts.push(Object.assign({}, clone(source), posting, { id: posting.id + '-ALLOC', invoiceId: rec.targetInvoiceId, amount: -rec.delta, status: 'confirmed', receivedAt: date, reportedAt: date, confirmedAt: date, confirmedBy: rec.approvedBy, cashMovement: false }));
    if (rec.sourceType === 'invoice') {
      var line = { type: rec.lineType, code: rec.lineCode, name: 'Điều chỉnh ' + rec.lineName, qty: 1, price: rec.delta, amount: rec.delta, unit: 'lần', sourceInvoiceId: source.id };
      TH.db.invoices.push(Object.assign({}, clone(source), posting, { id: 'INV-' + rec.id, total: rec.delta, lines: [line], status: 'confirmed', issuedAt: date, dueAt: date, prepaidTo: null, cycle: null, isCorrection: true, adjustsInvoiceId: source.id }));
    }
    audit('correction', rec, 'approve', before, rec.reason); TH.store.persist(); return { ok: true, record: rec };
  };
  R.create = function (type, values) {
    R.init(); var d = R.definitions[type]; if (!d || !TH.can(d.permission)) return { ok: false, error: 'Không có quyền tạo.' };
    if (type === 'occupant') {
      try {
        var ct = C.contract(values.contractId);
        assert(ct && ct.status === 'active' && TH.inScope(ct.buildingId) && C.customer(ct.customerId), 'Chỉ thêm người ở cùng vào hợp đồng đang hiệu lực trong phạm vi tòa được giao.');
        var person = { id: R.id('NO'), contractId: ct.id, customerId: ct.customerId, roomId: ct.roomId, buildingId: ct.buildingId, status: 'active', createdBy: TH.me().id, createdAt: TH.TODAY };
        d.fields.forEach(function (k) { if (values[k] !== undefined) person[k] = String(values[k]).trim(); });
        assert(person.name, 'Nhập họ tên người ở cùng.');
        validate(type, person, person);
        R.list(type).push(person); audit(type, person, 'create', null, ''); TH.store.persist();
        return { ok: true, record: person };
      } catch (e) { return { ok: false, error: e.message }; }
    }
    if (['team', 'oaSchedule', 'oaTemplate', 'shareholder'].indexOf(type) < 0) return { ok: false, error: 'Dùng biểu mẫu tạo nghiệp vụ hiện có.' };
    try { var r = { id: R.id(type), createdBy: TH.me().id, status: type === 'oaTemplate' ? 'draft' : 'active' }; d.fields.forEach(function (k) { if (values[k] !== undefined) r[k] = values[k]; }); assert(r.name, 'Nhập tên.'); validate(type, r, r); R.list(type).push(r); audit(type, r, 'create', null, ''); TH.store.persist(); return { ok: true, record: r }; } catch (e) { return { ok: false, error: e.message }; }
  };
})();
