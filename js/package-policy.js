/* Effective package policy. Loaded after the generated registries and CR patches.
 * This file owns package presentation and action entitlements; calculations stay shared.
 */
(function () {
  var P = TH.packagePolicy = { version: 'operating-support-v1', offers: {}, matrix: [], actions: {}, imports: { 'OWN-IMP': 'F002.B', 'BLD-IMP': 'F005.B', 'ROOM-IMP': 'F008.B' } };
  TH.CRS = TH.CRS || {};
  TH.CRS['CR-PKG-OPS'] = { id:'CR-PKG-OPS', date:'2026-10-24', title:'Phân tầng theo mức hỗ trợ vận hành' };
  P.ocrScope = 'OCR chỉ áp dụng cho hợp đồng khách thuê. Giấy tờ tùy thân, hợp đồng chủ nhà/thuê tòa, hóa đơn và các tài liệu khác chỉ nhập tay hoặc đính kèm, không thuộc phạm vi OCR.';
  var OFFERS = {
    A: { title: 'Vận hành cơ bản', audience: 'Cần đủ nghiệp vụ, xử lý từng hồ sơ và chứng từ', outcome: 'Nhập từng hồ sơ, hệ thống tính đúng theo bộ công thức cố định.',
      includes: ['Thêm/sửa từng chủ nhà, tòa, phòng, khách và hợp đồng', 'Nhập chỉ số từng phòng; lập và xác nhận từng hóa đơn', 'Thu từng khoản; công nợ và hoàn cọc đủ quy trình', 'Nhập đầu vào chi phí, lương và cổ phần; tính theo công thức cố định', 'Hai báo cáo gốc, tổng hợp theo kỳ và xuất Excel', 'OCR một mẫu hợp đồng khách thuê; rà soát từng file', 'Một Zalo OA: gửi từng hóa đơn và một lịch nhắc cố định'],
      limits: ['OCR: chỉ hợp đồng khách thuê, một mẫu đã chọn; sửa và xác nhận từng file.', 'OA: một OA, tối đa hai mẫu tin được duyệt; gửi từng hóa đơn và một lịch nhắc cố định.', 'Báo cáo: hai mẫu gốc, xem và xuất theo kỳ; không tự thiết kế mẫu mới.', 'Nhập và xử lý từng hồ sơ/chứng từ; nhập Excel, lập/xác nhận/gửi hàng loạt có từ B.'],
      example: 'Từ hợp đồng và chỉ số điện nước, lập hóa đơn, ghi nhận thu từng lần và xem khoản còn nợ của từng phòng.',
      acceptance: 'Hồ sơ liên kết đúng; bộ ví dụ tính tiền khớp; thu tiền, cọc và báo cáo thể hiện đúng trạng thái.',
      upgrade: 'Đủ nghiệp vụ cơ bản, OCR một mẫu hợp đồng khách thuê; không có nhập Excel hoặc xử lý hàng loạt. Bộ tính tiền và kiểm tra bắt buộc có ở mọi gói.', demo: 'INV-02' },
    B: { title: 'Hỗ trợ nhập liệu', audience: 'Cần giảm nhập lặp và xử lý danh sách nhanh hơn', outcome: 'Giảm thao tác lặp khi nhập dữ liệu, lập hóa đơn và nhắc thanh toán.',
      includes: ['Nhập Excel có xem trước, kiểm tra dòng và tải danh sách lỗi', 'Nhập chỉ số; lập, xác nhận và xuất/gửi hóa đơn hàng loạt', 'OCR tối đa hai mẫu hợp đồng khách thuê, chỉ rõ trường cần kiểm tra', 'Hỗ trợ lấy dữ liệu liên phân hệ; sinh lịch trả từ hợp đồng', 'Gửi danh sách và cấu hình nhắc OA ba mốc', 'Mở chứng từ từ hai báo cáo gốc; xem xu hướng sáu kỳ'],
      limits: ['OCR: chỉ hợp đồng khách thuê, tối đa hai mẫu đã chọn; chưa nhận dạng mẫu tùy ý.', 'OA: kế thừa một OA; thêm mẫu hóa đơn/nhắc nợ/hết hạn hợp đồng và ba mốc nhắc.', 'Báo cáo: giữ hai mẫu gốc; thêm truy nguồn và xu hướng tối đa sáu kỳ.', 'Chỉ xử lý hàng loạt trên các tác vụ và mẫu Excel đã thống nhất.'],
      example: 'Rà soát bảng Excel trước khi ghi, lập hóa đơn theo tòa và mở chứng từ giải thích doanh thu trên báo cáo.',
      acceptance: 'Dòng lỗi được tách để sửa; thao tác hàng loạt đúng kết quả; lịch trả và nhắc thanh toán đúng cấu hình.',
      upgrade: 'Tự động hóa và xử lý hàng loạt; OCR tối đa hai mẫu hợp đồng khách thuê, chỉ rõ trường cần kiểm tra.', demo: 'INV-01' },
    C: { title: 'Kiểm soát nâng cao', audience: 'Nhiều người cùng nhập liệu và cần kiểm soát sai sót', outcome: 'Soát ngoại lệ, so khớp và đối chiếu trước khi chốt kết quả.',
      includes: ['Kiểm trùng hồ sơ, chứng từ và yêu cầu thu tiền', 'Kiểm tra ngoại lệ trước khi xác nhận', 'Bổ sung bước duyệt và lịch sử điều chỉnh theo nghiệp vụ', 'Lưu số liệu kỳ đã duyệt, theo dõi sai lệch', 'Phân bổ chi phí chung theo quy tắc đã thống nhất', 'Báo cáo nhóm nhà, so sánh kỳ và cảnh báo biên lợi nhuận'],
      limits: ['OCR: chỉ hợp đồng khách thuê, giữ tối đa hai mẫu của B; thêm kiểm trùng và so khớp phòng–khách–hợp đồng.', 'OA: kế thừa một OA; thêm cá nhân hóa theo tòa và xử lý lỗi gửi theo quy tắc.', 'Báo cáo: giữ hai mẫu gốc; thêm so sánh tòa/nhóm/kỳ và bản số liệu đã duyệt.', 'Quy trình duyệt và quy tắc phân bổ cố định theo danh sách đã chốt.'],
      example: 'Phát hiện chứng từ chi bị nhập hai lần, kiểm tra người xử lý và đối chiếu số liệu trước/sau duyệt kỳ.',
      acceptance: 'Phát hiện đúng tình huống trùng/ngoại lệ; quyền xử lý đúng; tổng phân bổ và số liệu đối chiếu khớp.',
      upgrade: 'Kiểm soát, xử lý ngoại lệ và đối chiếu; OCR hợp đồng khách thuê giữ giới hạn mẫu của B, thêm kiểm trùng và so khớp.', demo: 'EXP-01' },
    D: { title: 'Quản trị theo kỳ', audience: 'Cần giải trình thay đổi và quản lý các kỳ đã chốt', outcome: 'Giữ căn cứ để giải thích số liệu và đối chiếu lịch sử.',
      includes: ['Nhật ký thay đổi dữ liệu tài chính chi tiết', 'Biểu phí và công thức có phiên bản trong phạm vi chốt', 'Khóa kỳ, điều chỉnh có căn cứ và lịch sử', 'Báo cáo lưu có phiên bản, truy ngược nguồn số liệu', 'Đối soát với sao kê nhập vào theo quy tắc', 'Giám sát tác vụ hàng loạt và xử lý lỗi gửi thông báo'],
      limits: ['OCR: chỉ hợp đồng khách thuê, thư viện mẫu hợp đồng được duyệt; số mẫu ghi trong báo giá, có lịch sử sửa.', 'OA: kế thừa một OA; thêm phiên bản mẫu, lịch sử và giám sát gửi lại.', 'Báo cáo: giữ hai mẫu gốc; thêm khóa kỳ, phiên bản và đối chiếu lịch sử; không tự thiết kế báo cáo bất kỳ.', 'Khóa kỳ, phiên bản và đối soát chỉ áp dụng cho dữ liệu/mẫu đã chốt; chưa kết nối ngân hàng tự động.'],
      example: 'Giữ báo cáo kỳ đã chốt, mở nguồn từng chỉ tiêu và tạo phiên bản mới để giải thích phần số liệu thay đổi.',
      acceptance: 'Bản chốt giữ nguyên; phiên bản sau có liên kết và chênh lệch; thay đổi tài chính truy được căn cứ.',
      upgrade: 'Lịch sử, phiên bản và khả năng giải trình; OCR chỉ hợp đồng khách thuê, có lịch sử sửa và thư viện mẫu hợp đồng đã duyệt theo báo giá.', demo: 'REPORTS' }
  };
  var MATRIX = [
    ['Hồ sơ và hợp đồng', ['Nhập và sửa từng hồ sơ', 'Nhập Excel, xem trước và gợi ý', 'Thêm so khớp, kiểm soát hiệu lực', 'Thêm phiên bản theo hiệu lực']],
    ['Excel và OCR hợp đồng khách thuê', ['OCR một mẫu hợp đồng khách thuê; xác nhận trước khi ghi', 'OCR tối đa hai mẫu hợp đồng khách thuê; xem trước Excel', 'Giữ hai mẫu hợp đồng khách thuê; thêm kiểm trùng và so khớp', 'Thư viện mẫu hợp đồng khách thuê đã duyệt']],
    ['Điện nước và hóa đơn', ['Nhập, lập và xác nhận từng phòng/hóa đơn', 'Nhập/lập/xác nhận hàng loạt theo tòa', 'Soát ngoại lệ trước xác nhận', 'Kiểm chứng theo phiên bản']],
    ['Thu tiền và cọc', ['Thu nhiều lần; công nợ và hoàn cọc theo bước', 'Danh sách và theo dõi quá hạn', 'Kiểm trùng, điều chỉnh có duyệt', 'Đối soát và phân bổ nâng cao']],
    ['Chi phí và lịch trả', ['Nhập, duyệt chi; lịch trả nhập tay', 'Nhập Excel; sinh lịch từ hợp đồng', 'Kiểm trùng; theo dõi còn lại/quá hạn', 'Phân bổ nhiều tòa và truy vết']],
    ['Lương và cổ phần', ['Nhập đầu vào từng hồ sơ; công thức cố định', 'Kéo dữ liệu, nhập Excel và xem trước', 'Soát ngoại lệ và quy trình duyệt', 'Lịch sử chính sách, đối chiếu kỳ']],
    ['Hai mẫu báo cáo gốc', ['Theo tòa và kinh doanh tháng; xem/xuất theo kỳ', 'Giữ hai mẫu; truy nguồn và xu hướng sáu kỳ', 'Giữ hai mẫu; so tòa/nhóm/kỳ, số liệu đã duyệt', 'Giữ hai mẫu; khóa kỳ, phiên bản và lịch sử']],
    ['Zalo OA và thông báo', ['Một OA, hai mẫu tin; gửi từng hóa đơn', 'Gửi danh sách và ba mốc nhắc cấu hình', 'Thêm cá nhân hóa theo tòa, xử lý lỗi gửi', 'Thêm phiên bản mẫu, lịch sử và giám sát']]
  ];
  P.offers = OFFERS; P.matrix = MATRIX;
  TH.PKG_KEYS.forEach(function (k) { TH.PACKAGES[k].mode = OFFERS[k].title; TH.PACKAGES[k].desc = OFFERS[k].outcome + " " + OFFERS[k].limits.join(" "); });
  var patches = {
    F002: { A: 'Thêm/sửa từng chủ nhà qua biểu mẫu; nhập Excel có từ B', B: 'Nhập Excel theo mẫu, xem trước và tải lỗi dòng' },
    F005: { A: 'Thêm/sửa từng tòa qua biểu mẫu; nhập Excel có từ B', B: 'Nhập Excel theo mẫu, kiểm tra chủ nhà và lỗi dòng' },
    F008: { A: 'Thêm/sửa từng phòng qua biểu mẫu; nhập Excel có từ B', B: 'Nhập Excel theo tòa, xem trước và tải lỗi dòng' },
    F011: { name: 'Giấy tờ khách đính kèm', A: 'Nhập tay thông tin giấy tờ khách và đính kèm file; không OCR', B: 'Tra cứu giấy tờ theo hồ sơ khách', C: 'Quyền truy cập giấy tờ theo tòa và người dùng', D: 'Lịch sử và phiên bản file giấy tờ', action: 'Nhập tay, tải file và tra cứu', uat: 'Thông tin nhập tay và file đính kèm gắn đúng hồ sơ khách', limit: 'OCR chỉ áp dụng cho hợp đồng khách thuê' },
    F012: { name: 'OCR hợp đồng khách thuê', A: 'Một mẫu hợp đồng khách thuê đã chọn; rà soát, sửa và xác nhận từng file', B: 'Tối đa hai mẫu hợp đồng khách thuê; hỗ trợ ánh xạ dữ liệu', D: 'Log sửa tay so với OCR; thư viện mẫu hợp đồng khách thuê đã duyệt' },
    F022: { A: 'Chọn một phòng/hợp đồng và lập một hóa đơn nháp; không tạo trùng phòng–kỳ', B: 'Lập hóa đơn hàng loạt theo tòa hoặc nhiều tòa', D: 'Lịch sử lô, đối chiếu và chạy lại có kiểm soát; chống tạo trùng có ở mọi gói' },
    F023: { A: 'Tính đúng tiền phòng, lẻ kỳ và kỳ thanh toán theo bộ quy tắc cố định đã chốt', B: 'Hỗ trợ cấu hình và rà soát quy tắc tính tiền' },
    F025: { A: 'Xem trước, xác nhận và in từng hóa đơn theo quyền', B: 'Xác nhận, xuất và gửi danh sách hóa đơn' },
    F026: { A: 'Một OA, tối đa hai mẫu tin đã duyệt; liên kết người nhận' },
    F027: { A: 'Gửi từng hóa đơn và một lịch nhắc cố định; không gửi lặp hoặc nhắc khoản đã thu đủ', B: 'Gửi danh sách, ba mốc nhắc và mẫu hết hạn hợp đồng', C: 'Cá nhân hóa theo tòa, hàng đợi và xử lý ngoại lệ', D: 'Giám sát gửi lại, thống kê và lịch sử mẫu' },
    F029: { A: 'Quản lý ghi nhận và xác nhận từng khoản thu tại tòa được giao' },
    F030: { A: 'Kế toán hậu kiểm khoản thu và chứng từ', C: 'Cảnh báo khoản nghi trùng, tranh chấp và sai lệch; chống ghi trùng có ở mọi gói' },
    F031: { A: 'Nhiều lần thu trên một hóa đơn; ghi nhận thiếu/thừa và số dư', D: 'Phân bổ một khoản thu cho nhiều hóa đơn, đối soát và truy vết' },
    F033: { A: 'Đủ công thức hiệu suất: thu ba mốc, tỷ lệ dịch vụ, thu thêm và giá niêm yết; cố định theo quy tắc đã chốt', B: 'Hỗ trợ lấy dữ liệu và giải thích thành phần công thức', C: 'Soát ngoại lệ, đối chiếu đầu vào và bản đã duyệt', D: 'Lịch sử chính sách và đối chiếu kỳ; không thay độ đúng công thức theo gói' },
    F040: { A: 'Nhập đầu vào từng nhân viên; tính lương theo bộ công thức cố định', B: 'Tự lấy dữ liệu hiệu suất, nhập Excel và xem trước' },
    F042: { A: 'Nhập tỷ lệ/vốn từng hồ sơ; bắt buộc tổng 100% trước khi lưu', C: 'Soát hiệu lực và ngoại lệ liên kỳ; tổng 100% được kiểm ở mọi gói' }
  };
  Object.keys(patches).forEach(function (id) {
    var f = TH.FEATURES.find(function (x) { return x.id === id; });
    if (!f) return;
    f.packageOriginal = Object.assign({}, f);
    if (!f.srs) { f.srs = {}; TH.PKG_KEYS.forEach(function (k) { f.srs[k] = f[k]; }); }
    f.cr = 'CR-PKG-OPS'; f.crOf = Object.assign({}, f.crOf); f.crKeys = (f.crKeys || []).slice();
    Object.keys(patches[id]).forEach(function (k) { f.crOf[k] = 'CR-PKG-OPS'; if (f.crKeys.indexOf(k) < 0) f.crKeys.push(k); });
    Object.assign(f, patches[id]);
  });
  Object.keys(P.imports).forEach(function (id) {
    var s = TH.screen(id); if (s) { s.notes.A = 'Nhập từng hồ sơ qua biểu mẫu; nhập Excel từ gói B'; s.notes.B = 'Nhập Excel, xem trước và báo lỗi dòng'; }
  });
  if (TH.BLD_PACK) {
    TH.BLD_PACK.B.items = TH.BLD_PACK.B.items.map(function (t) { return t.indexOf('Hiệu suất trừ') === 0 ? 'Hỗ trợ lấy và giải thích đầu vào hiệu suất' : t; });
    TH.BLD_PACK.C.items = TH.BLD_PACK.C.items.map(function (t) { return t.indexOf('Hiệu suất cộng') === 0 ? 'Soát ngoại lệ và đối chiếu đầu vào hiệu suất' : t; });
  }
  TH.requireFeature = function (incId) {
    if (TH.has(incId)) return true;
    if (TH.app && TH.app.openUpgrade) TH.app.openUpgrade(incId);
    return false;
  };
  P.allowed = function (incId) { return TH.has(incId); };
  P.importFeature = function (el) { return P.imports[el && el.dataset && el.dataset.screen] || 'F002.B'; };
  P.actions = {
    'imp.open': P.importFeature, 'imp.pick': P.importFeature, 'imp.commit': P.importFeature, 'imp.template': P.importFeature, 'imp.errfile': P.importFeature,
    'imp.rollback': 'F002.D', 'mtr.saveAll': 'F019.B', 'mtr.approve': 'F019.C', 'mtr.preview': 'F019.B', 'mtr.price': 'F020.B', 'mtr.swap': 'F018.C', 'mtr.swapSave': 'F018.C',
    'inv.multi': 'F022.B', 'inv.meters': 'F024.B', 'inv.sel': 'F025.B', 'inv.bulkPdf': 'F025.B', 'inv.bulkSend': 'F025.B', 'inv.cancel': 'F025.C', 'inv.adjust': 'F025.D', 'bill.rule': 'F023.B',
    'exp.import': 'F034.B', 'exp.reverse': 'F035.D', 'hr.import': 'F037.B', 'sal.import': 'F040.B', 'shr.import': 'F042.B', 'lpay.gen': 'F036.B',
    'sal.preview': 'F041.B', 'sal.lock': 'F041.C', 'shr.payout': 'F044.D', 'con.addendum': 'F014.C', 'con.addendum.save': 'F014.C',
    'rpt.drill': 'F045.B', 'rpt4.drill': 'F045.B', 'rpt.approve': 'F045.C', 'rpt.lock': 'F045.D', 'rpt4.poolSave': 'F048.C',
    'rptf.trace': 'F045.B', 'rptf.tdrill': 'F045.B', 'rptf.tback': 'F045.B', 'rptf.open': 'F045.B', 'rptf.version': 'F045.D', 'rptf.tpl': 'F046.D',
    'oa.retry': 'F028.C'
  };
  Object.assign(P.actions, { 'pay.sel': 'F030.B', 'pay.batch': 'F030.B', 'pay.adjust': 'F031.C', 'rpt3.preview': 'F041.B', 'rpt4.pool': 'F048.C',
    'lpay.pay': 'F036.C', 'lpay.paySave': 'F036.C', 'bld.assign': 'F006.B', 'bld.assignSave': 'F006.B', 'asg.end': 'F006.C',
    'own.link': 'F003.B', 'own.link.save': 'F003.B', 'bdoc.upload': 'F013.B', 'bdoc.save': 'F013.B' });
  /* Basic operations retain their role checks even when invoked without a button. */
  var basic = { 'shr.save': ['F042.A', 'share.edit'], 'sal.saveSetup': ['F039.A', 'salary.edit'], 'sal.extConfirm': ['F041.A', 'salary.edit'],
    'mtr.save1': ['F019.A', 'meter.edit'], 'mtr.common': ['F018.A', 'meter.edit'], 'mtr.people': ['F019.A', 'meter.edit'],
    'con.approve': ['F014.A', 'contract.edit'], 'cus.save': ['F010.A', 'contract.edit'], 'own.save': ['F001.A', 'master.edit'], 'bld.save': ['F004.A', 'master.edit'], 'room.save': ['F007.A', 'master.edit'],
    'exp.save': ['F034.A', 'expense.create'], 'exp.approve': ['F035.A', 'expense.approve'], 'exp.reject': ['F035.A', 'expense.approve'] };
  var permissions = { 'mtr.saveAll': 'meter.edit', 'mtr.approve': 'meter.approve', 'bill.rule': 'billing.rules', 'sal.preview': 'salary.edit', 'sal.lock': 'salary.edit', 'rpt.approve': 'report.all', 'rpt.lock': 'report.all', 'rpt4.poolSave': 'report.all', 'oa.retry': 'oa.send' };
  Object.keys(basic).forEach(function (name) { P.actions[name] = basic[name][0]; permissions[name] = basic[name][1]; });
  P.decorate = function (html) {
    if (!html || typeof html !== 'string' || html.indexOf('data-act') < 0 || TH.store.level() === 4) return html;
    var tpl = document.createElement('template'); tpl.innerHTML = html;
    tpl.content.querySelectorAll('[data-act],[data-act-change]').forEach(function (el) {
      if (el.closest('[inert],.gate-locked,[data-locked]')) return;
      var rule = P.actions[el.dataset.act || el.dataset.actChange]; if (!rule) return;
      var feature = typeof rule === 'function' ? rule(el) : rule;
      if (TH.has(feature)) return;
      var label = el.textContent.trim() || (el.getAttribute('aria-label')) || TH.inc(feature).feature.name;
      var lock = document.createElement('template'); lock.innerHTML = TH.gate(feature, '', { mode: 'btn', label: label });
      el.replaceWith(lock.content);
    });
    return tpl.innerHTML;
  };
  P.install = function () {
    if (P.installed) return; P.installed = true;
    /* A confirmation can outlive the package/role in which it was opened. */
    var confirm = TH.confirm;
    TH.confirm = function (opts) {
      var feature = P.activeFeature, permission = P.activePermission;
      return confirm(opts).then(function (ok) { return !!ok && (!feature || TH.requireFeature(feature)) && (!permission || TH.can(permission)); });
    };
    [TH.act, TH.onChange].forEach(function (registry) {
      Object.keys(P.actions).forEach(function (name) {
        var original = registry[name]; if (!original) return;
        registry[name] = function (el) {
          var feature = typeof P.actions[name] === 'function' ? P.actions[name](el) : P.actions[name];
          if (!TH.requireFeature(feature)) return false;
          var permission = permissions[name];
          if (permission && !TH.can(permission)) { TH.toast('Không có quyền', 'Vai trò hiện tại không được thực hiện thao tác này.', 'warning'); return false; }
          var prev = P.activeFeature, prevPerm = P.activePermission;
          P.activeFeature = feature; P.activePermission = permission;
          try { return original.apply(this, arguments); } finally { P.activeFeature = prev; P.activePermission = prevPerm; }
        };
      });
    });
    Object.keys(TH.views).forEach(function (key) {
      var view = TH.views[key], render = view.render; if (!render) return;
      view.render = function () {
        var result = render.apply(this, arguments);
        if (typeof result === 'string') return P.decorate(result);
        if (result) ['body', 'foot', 'headExtra'].forEach(function (k) { if (typeof result[k] === 'string') result[k] = P.decorate(result[k]); });
        return result;
      };
    });
  };
})();
