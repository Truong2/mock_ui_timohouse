/* Effective package policy. Loaded after the generated registries and CR patches.
 * This file owns package presentation and action entitlements; calculations stay shared.
 */
(function () {
  var P = TH.packagePolicy = { version: 'operating-support-v1', offers: {}, matrix: [], actions: {}, imports: { 'OWN-IMP': 'F002.B', 'BLD-IMP': 'F005.B', 'ROOM-IMP': 'F008.B' } };
  TH.CRS = TH.CRS || {};
  TH.CRS['CR-PKG-OPS'] = { id:'CR-PKG-OPS', date:'2026-10-24', title:'Phân tầng theo mức hỗ trợ vận hành' };
  P.ocrScope = 'OCR chỉ áp dụng cho hợp đồng khách thuê. Giấy tờ tùy thân, hợp đồng chủ nhà/thuê tòa, hóa đơn và các tài liệu khác chỉ nhập tay hoặc đính kèm, không thuộc phạm vi OCR.';
  var OFFERS = {
    A: { title: 'Vận hành đầy đủ, nhập tay', audience: 'Cần đủ nghiệp vụ một kỳ và hai báo cáo đúng mẫu, chấp nhận nhập và đối soát thủ công', outcome: 'Vận hành trọn một kỳ đến hai báo cáo đúng mẫu đã ký; người dùng nhập, chọn và xác nhận, hệ thống tự tính.',
      includes: ['Chủ nhà, tòa, phòng, khách và hợp đồng: nhận, gia hạn, đổi, trả phòng và quyết toán', 'Nạp số liệu đầu kỳ một lần: nợ, cọc, thu trước, chỉ số', 'Chỉ số điện nước; tạo hóa đơn theo tòa/kỳ, sửa dòng lỗi rồi phát hành', 'Phiếu thu phân bổ thủ công cho nhiều hóa đơn; thu trước, cọc và hoàn cọc', 'Nhập chi phí, chi phí chung chia theo tòa, lương/hoa hồng đã duyệt có nguồn', 'Hai báo cáo doanh thu theo tòa và kinh doanh tháng đủ mẫu; xuất Excel', 'OCR một mẫu hợp đồng khách thuê; rà soát và xác nhận từng file', 'Một Zalo OA: gửi từng hóa đơn và một lịch nhắc cố định'],
      limits: ['OCR: chỉ hợp đồng khách thuê, một mẫu đã chọn; sửa và xác nhận từng file trước khi ghi.', 'OA: một OA, tối đa hai mẫu tin được duyệt; gửi từng hóa đơn và một lịch nhắc cố định.', 'Báo cáo: hai mẫu gốc đủ hàng/cột/sheet đã ký; đầu vào nhập tay phải có nguồn và người xác nhận.', 'Thao tác nhập, chọn, phân bổ và đối soát thủ công; nhập Excel định kỳ, gợi ý và xử lý hàng loạt có từ B.'],
      example: 'Khách đóng ba tháng và cọc một lần: nhập một phiếu thu, phân bổ tay vào ba kỳ và cọc; báo cáo tách đúng doanh thu kỳ và tiền nhận trước.',
      acceptance: 'Chạy trọn một kỳ từ số đầu kỳ đến hai báo cáo đúng mẫu bằng nhập tay; số liệu khớp bộ đối chiếu, mỗi số nhập tay có nguồn; OCR một mẫu hợp đồng được xác nhận trước khi ghi; OA gửi từng hóa đơn không trùng.',
      upgrade: 'Không có hạng mục riêng ở bước này: vận hành, hai báo cáo, OCR một mẫu hợp đồng khách thuê và OA gửi từng hóa đơn đã nghiệm thu ở các bước 2–4.', demo: 'INV-02' },
    B: { title: 'Vận hành tối ưu', audience: 'Cần nhập liệu, lập hóa đơn và đối soát nhanh hơn trên cùng nghiệp vụ', outcome: 'Kết quả như gói A, giảm thao tác nhờ nhập định kỳ, xem trước hàng loạt và gợi ý phân bổ.',
      includes: ['Nhập Excel định kỳ theo mẫu cố định, xem trước và tải lỗi dòng', 'Xem trước hóa đơn hàng loạt, lọc lỗi và xác nhận một lần', 'Gợi ý phân bổ khoản thu và bảng duyệt nhiều dòng', 'Hỗ trợ lập hợp đồng, kiểm trùng nâng cao; gợi ý lịch trả chủ nhà', 'Mở chứng từ từ chỉ tiêu báo cáo; xu hướng sáu kỳ', 'OCR tối đa hai mẫu hợp đồng khách thuê, chỉ rõ trường cần kiểm tra', 'Zalo OA gửi danh sách, ba mốc nhắc và mẫu hết hạn hợp đồng'],
      limits: ['OCR: chỉ hợp đồng khách thuê, tối đa hai mẫu đã chọn; chưa nhận dạng mẫu tùy ý.', 'OA: kế thừa một OA; thêm gửi danh sách, mẫu hết hạn hợp đồng và ba mốc nhắc.', 'Báo cáo: giữ hai mẫu gốc, cùng số liệu với A; thêm truy nguồn chứng từ và xu hướng sáu kỳ.', 'Nhập Excel và xử lý hàng loạt chỉ theo các mẫu và tác vụ đã thống nhất.'],
      example: 'Nhập bảng chỉ số cả tòa, xem trước danh sách hóa đơn, lọc dòng lỗi, xác nhận rồi gửi cả danh sách qua Zalo OA.',
      acceptance: 'Dòng lỗi được tách để sửa; thao tác hàng loạt và gợi ý phân bổ cho cùng kết quả với nhập tay ở A; OCR đọc đúng hai mẫu; nhắc OA đúng ba mốc đã cấu hình.',
      upgrade: 'Nhập Excel định kỳ, xem trước hóa đơn hàng loạt, gợi ý phân bổ thu tiền, hỗ trợ lập hợp đồng, truy nguồn chứng từ và xu hướng sáu kỳ; OCR tối đa hai mẫu hợp đồng khách thuê; OA gửi danh sách và ba mốc nhắc.', demo: 'INV-01' },
    C: { title: 'Tự động hóa chọn lọc', audience: 'Cần tự động một số bước lặp lại theo quy tắc đã duyệt', outcome: 'Thêm tự động hóa có giới hạn, luôn có xem trước, duyệt và đường thủ công thay thế.',
      includes: ['Tự phân bổ chi phí chung theo số phòng (một quy tắc), xem trước và duyệt', 'OCR kiểm trùng và so khớp phòng–khách–hợp đồng', 'Zalo OA cá nhân hóa theo tòa, xử lý lỗi gửi và nhật ký gửi', 'Giữ toàn bộ công cụ hỗ trợ của gói B'],
      limits: ['OCR: chỉ hợp đồng khách thuê, giữ tối đa hai mẫu của B; thêm kiểm trùng và so khớp phòng–khách–hợp đồng.', 'OA: kế thừa một OA; thêm cá nhân hóa theo tòa, xử lý lỗi gửi theo quy tắc và nhật ký gửi.', 'Báo cáo: giữ hai mẫu gốc, cùng số liệu với A khi đầu vào đã duyệt như nhau.', 'Tự phân bổ chỉ theo một quy tắc số phòng đã duyệt; chia tay vẫn dùng được.'],
      example: 'Tiền điện văn phòng chung được đề xuất chia theo số phòng từng tòa; kế toán xem trước, xác nhận và kết quả lên báo cáo như chia tay.',
      acceptance: 'Tổng phân bổ bằng số tiền gốc; kết quả bằng chia tay trên cùng dữ liệu; OCR phát hiện đúng hợp đồng trùng; tin OA lỗi được ghi nhận và xử lý theo quy tắc.',
      upgrade: 'Toàn bộ B; tự phân bổ chi phí chung theo số phòng (một quy tắc, có xem trước và duyệt); OCR thêm kiểm trùng và so khớp hợp đồng; OA cá nhân hóa theo tòa và xử lý lỗi gửi.', demo: 'EXP-01' },
    D: { title: 'Kiểm soát nâng cao', audience: 'Cần chốt kỳ, giữ bản báo cáo đã phát hành và đối chiếu giữa các kỳ', outcome: 'Chốt bản số liệu trong ứng dụng, khóa kỳ và so sánh phiên bản trên cùng bộ tính.',
      includes: ['Chốt bản báo cáo tháng không sửa đè', 'Khóa kỳ, mở lại theo chính sách và có lịch sử', 'So sánh hai kỳ trên hai mẫu báo cáo', 'Bản xuất báo cáo quản trị theo phiên bản', 'Thư viện mẫu OCR hợp đồng khách thuê đã duyệt, lịch sử sửa', 'Zalo OA có phiên bản mẫu, lịch sử và giám sát gửi lại'],
      limits: ['OCR: chỉ hợp đồng khách thuê, thư viện mẫu hợp đồng được duyệt; số mẫu ghi trong báo giá, có lịch sử sửa.', 'OA: kế thừa một OA; thêm phiên bản mẫu, lịch sử và giám sát gửi lại.', 'Báo cáo: giữ hai mẫu gốc; thêm bản chốt, khóa kỳ, so sánh hai kỳ và xuất theo phiên bản.', 'Bản chốt dùng cùng bộ tính với A; không gồm quản lý cổ đông, bảng lương tự động hoặc kết nối ngân hàng.'],
      example: 'Chốt báo cáo tháng 9; điều chỉnh phát sinh sau đó tạo phiên bản mới và so sánh với bản đã phát hành.',
      acceptance: 'Bản chốt giữ nguyên; sửa kỳ đã khóa theo chính sách và tạo phiên bản mới; so sánh hai kỳ đúng chênh lệch; lịch sử sửa OCR và gửi lại OA truy được.',
      upgrade: 'Toàn bộ C; chốt bản báo cáo tháng không sửa đè, khóa kỳ/mở lại theo chính sách, so sánh hai kỳ và bản xuất theo phiên bản; thư viện mẫu OCR hợp đồng khách thuê; giám sát gửi lại OA.', demo: 'REPORTS' }
  };
  var MATRIX = [
    ['Hồ sơ và hợp đồng', ['Nhận, gia hạn, đổi, trả phòng thủ công', 'Thêm hỗ trợ lập hợp đồng, kiểm trùng nâng cao', 'Như B', 'Như C']],
    ['Nhập liệu và OCR hợp đồng khách thuê', ['Biểu mẫu, nhập đầu kỳ một lần; OCR một mẫu hợp đồng', 'Nhập Excel định kỳ; OCR tối đa hai mẫu', 'Giữ hai mẫu; thêm kiểm trùng, so khớp', 'Thư viện mẫu hợp đồng đã duyệt, lịch sử sửa']],
    ['Điện nước và hóa đơn', ['Tạo theo tòa/kỳ, sửa dòng lỗi, phát hành', 'Xem trước hàng loạt, lọc lỗi, xử lý lại', 'Như B', 'Kiểm soát theo kỳ đã khóa']],
    ['Thu tiền và cọc', ['Phân bổ thủ công nhiều nghĩa vụ; thu trước, cọc, hoàn cọc', 'Gợi ý phân bổ, duyệt nhiều dòng', 'Như B', 'Lịch sử theo phiên bản báo cáo']],
    ['Chi phí và lịch trả', ['Nhập từng khoản; chi phí chung chia tay theo tòa', 'Bảng phân bổ tiện hơn; gợi ý lịch trả', 'Tự phân bổ theo số phòng, có duyệt', 'Lưu quy tắc phân bổ khi chốt kỳ']],
    ['Lương và hoa hồng', ['Nhập kết quả đã duyệt theo tòa/kỳ, có nguồn', 'Nhập bảng kết quả theo mẫu cố định', 'Như B', 'Như C; không gồm bảng lương tự động']],
    ['Hai mẫu báo cáo gốc', ['Đủ mẫu đã ký; xuất và đối chiếu nguồn', 'Thêm truy nguồn và xu hướng sáu kỳ', 'Như B', 'Thêm bản chốt, khóa kỳ, so sánh hai kỳ']],
    ['Zalo OA và thông báo', ['Một OA, hai mẫu tin; gửi từng hóa đơn, một lịch nhắc', 'Gửi danh sách, ba mốc nhắc, mẫu hết hạn hợp đồng', 'Cá nhân hóa theo tòa, xử lý lỗi gửi, nhật ký', 'Phiên bản mẫu, lịch sử và giám sát gửi lại']]
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
