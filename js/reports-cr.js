/*
 * CR-RPT-01 (20/10/2026) — Bổ sung 2 báo cáo theo mẫu khách vào các gói.
 *   RPT-04 · Báo cáo doanh thu theo tòa   ← docs/G1.31.8.26.xlsx (sheet "BÁO CÁO THÁNG 8")
 *   RPT-05 · Báo cáo kinh doanh tháng      ← docs/bao_cao/BÁO CÁO KINH DOANH THÁNG 8.xlsx
 * File sinh tự động (features.js, screens.js) giữ nguyên theo SRS; phần cập nhật nằm ở đây để truy vết và
 * không bị ghi đè khi chạy lại tools/extract-srs.js. Nội dung gốc SRS lưu ở f.srs.
 */
var TH = window.TH = window.TH || {};
(function () {
  TH.CR_RPT = { id: 'CR-RPT-01', date: '2026-10-20', title: 'Bổ sung báo cáo theo mẫu khách vào các gói' };

  /* Phần báo cáo có trong từng gói (cộng dồn) — dùng cho drawer gói, landing, mục lục */
  TH.REPORT_PACK = {
    A: { head: 'Hai mẫu gốc: xem và xuất theo kỳ', items: ['Doanh thu theo tòa (mẫu G1): doanh thu, cọc, giá vốn, chi phí, LNG/LNR, tỷ lệ và chia cổ phần', 'Báo cáo kinh doanh tháng: Tổng + từng tòa, chế độ Tổng / Kinh doanh', 'Xuất Excel theo mẫu; không tự thiết kế báo cáo mới'] },
    B: { head: 'Giữ hai mẫu gốc · thêm truy nguồn và xu hướng', items: ['Bấm dòng để mở hóa đơn, cọc, chi phí nguồn', 'Đối chiếu doanh thu báo cáo với thu thực', 'Xu hướng tối đa sáu kỳ doanh thu / LNG / LNR'] },
    C: { head: 'Giữ hai mẫu gốc · thêm so sánh và duyệt', items: ['Lưu bản số liệu đã duyệt và theo dõi sai lệch', 'Phân bổ chi phí chung theo quy tắc đã thống nhất', 'So sánh tòa, nhóm nhà, kỳ; cảnh báo biên lợi nhuận'] },
    D: { head: 'Giữ hai mẫu gốc · thêm khóa kỳ và phiên bản', items: ['Đối chiếu lịch sử theo phạm vi quyền', 'Khóa kỳ và quản lý phiên bản báo cáo', 'Truy vết chênh lệch; mẫu mới ngoài hai mẫu gốc được xác định riêng'] },
  };

  /* Cập nhật mô tả nhóm chức năng — giữ bản SRS gốc trong f.srs */
  var PATCH = {
    F045: { A: 'Báo cáo doanh thu tòa theo mẫu G1 (DT, cọc, GV, CPBH, LNG/LNR, tỷ lệ, chia cổ phần) + xuất Excel đúng mẫu', B: 'Drill-down từng dòng về hóa đơn/cọc/chi phí/phòng', ui: ['RPT-04'] },
    F046: { A: 'Báo cáo kinh doanh tháng theo mẫu khách: Tổng + từng tòa, chế độ Tổng/Kinh doanh, xuất Excel', C: 'So sánh tòa, nhóm nhà, kỳ', ui: ['RPT-05'] },
    F043: { ui: ['RPT-04'] },
    F048: { ui: ['RPT-04', 'RPT-05'] },
  };
  Object.keys(PATCH).forEach(function (fid) {
    var f = TH.FEATURES.find(function (x) { return x.id === fid; }), p = PATCH[fid];
    if (!f) return;
    f.srs = { A: f.A, B: f.B, C: f.C, D: f.D };
    ['A', 'B', 'C', 'D'].forEach(function (k) { if (p[k]) { f[k] = p[k]; f.crKeys = (f.crKeys || []).concat(k); } });
    if (f.crKeys) f.cr = TH.CR_RPT.id;
    (p.ui || []).forEach(function (u) { if (f.ui.indexOf(u) === -1) f.ui.push(u); });
  });

  /* Hai màn bổ sung — đánh dấu cr để tách khỏi đếm 39 màn SRS */
  var after = TH.SCREENS.findIndex(function (s) { return s.id === 'RPT-03'; });
  TH.SCREENS.splice(after + 1, 0, {
    no: '40a', id: 'RPT-04', title: 'Báo cáo doanh thu theo tòa', module: 'Báo cáo', kind: 'Report / mẫu khách', excelType: 'Bổ sung CR-RPT-01', cr: TH.CR_RPT.id,
    template: 'docs/G1.31.8.26.xlsx · sheet BÁO CÁO THÁNG 8',
    notes: {
      A: 'Đúng mẫu G1: doanh thu (tiền phòng + 7 dịch vụ), cọc, GV, CPBH, LNG/LNR, 13 tỷ lệ, bảng chia cổ phần; xuất Excel theo mẫu',
      B: 'Drill-down từng dòng về hóa đơn/cọc/chi phí; đối chiếu doanh thu báo cáo với thu thực',
      C: 'Snapshot sau duyệt kỳ + sai lệch; chi phí chung tự kéo từ lương đã duyệt theo rule phân bổ',
      D: 'Đối chiếu 3 kỳ lịch sử; khóa kỳ & chốt phiên bản báo cáo',
    },
    fields: [], actions: [], rules: ['Báo cáo từng tòa theo tháng', 'Báo cáo chi phí và lãi', 'Tính lợi nhuận phân bổ'], srcActions: ['Lọc tòa/kỳ', 'Xuất Excel', 'In'], srcFields: 'Tòa, kỳ, doanh thu, cọc, giá vốn, chi phí, LNG, LNR, tỷ lệ, cổ phần',
  }, {
    no: '40b', id: 'RPT-05', title: 'Báo cáo kinh doanh tháng', module: 'Báo cáo', kind: 'Report / mẫu khách', excelType: 'Bổ sung CR-RPT-01', cr: TH.CR_RPT.id,
    template: 'docs/bao_cao/BÁO CÁO KINH DOANH THÁNG 8.xlsx · sheet BÁO CÁO TỔNG / KINH DOANH / BC DT NHÀ …',
    notes: {
      A: 'Cột Tổng + từng tòa, 2 chế độ: Kinh doanh (P&L đề xuất — loại cọc mới/hoàn cọc/mua sắm, tiền thuê nhà theo HĐ) và Tổng (tái hiện mẫu); 13 tỷ lệ; xuất Excel 3 sheet',
      B: 'Biểu đồ xu hướng 6 kỳ DT / LNG / LNR',
      C: 'Gộp theo nhóm nhà, so sánh kỳ trước, cảnh báo tòa biên lợi nhuận thấp',
      D: 'Mẫu báo cáo quản trị có version; khóa kỳ & chốt phiên bản',
    },
    fields: [], actions: [], rules: ['Báo cáo kinh doanh toàn công ty', 'Báo cáo chi phí và lãi'], srcActions: ['Lọc kỳ', 'Đổi chế độ', 'Xuất Excel', 'In'], srcFields: 'Kỳ, tòa/nhóm nhà, các chỉ tiêu mẫu, tỷ lệ',
  });
  /* CR-RPT-02 (21/10/2026, docs/TIMEHOUSE_REPORT_WORKFLOW_PLAN.md): luồng Báo cáo theo mẫu Excel — tạo → xem trước → xác nhận → bản lưu bất biến có phiên bản.
     Áp dụng cho RPT-04/RPT-05; route cũ mở form tạo đã điền sẵn ngữ cảnh. Có ở mọi gói A–D. */
  TH.CR_RPT2 = { id: 'CR-RPT-02', date: '2026-10-21', title: 'Luồng tạo / lưu phiên bản báo cáo theo mẫu Excel' };
  var after5 = TH.SCREENS.findIndex(function (s) { return s.id === 'RPT-05'; });
  var flowNote = 'Danh sách bản đã tạo (lọc loại/tòa/kỳ/người tạo) → chọn loại, tháng, tòa → xem trước đủ sheet, truy nguồn từng ô → xác nhận tạo bản lưu bất biến; tải Excel từ bản lưu; tạo phiên bản mới';
  TH.SCREENS.splice(after5 + 1, 0, {
    no: '40c', id: 'REPORTS', title: 'Báo cáo theo mẫu Excel', module: 'Báo cáo', kind: 'Workflow / bản lưu', excelType: 'Bổ sung CR-RPT-02', cr: TH.CR_RPT2.id,
    template: 'docs/G1.31.8.26.xlsx · docs/bao_cao/BÁO CÁO KINH DOANH THÁNG 8.xlsx',
    notes: { A: flowNote, B: flowNote, C: flowNote, D: flowNote },
    fields: [], actions: [], rules: ['Chỉ bấm Xác nhận mới sinh bản lưu', 'Bản lưu chỉ đọc, Excel dựng từ bản lưu', 'Phiên bản mới không ghi đè bản cũ'], srcActions: ['Lọc', 'Xem trước', 'Xác nhận', 'Tải Excel', 'Tạo phiên bản mới'], srcFields: 'Loại, kỳ, tòa, phiên bản, người tạo, cảnh báo',
  });
  /* CR-RPT-03 (28/10/2026): báo cáo gom theo nhóm (Tài chính · Vận hành · Khách hàng) trong màn REPORTS; thêm loại theo gói, bố cục theo docs/bao_cao —
     C: âm dương điện nước, lấp đầy; D: dự kiến lợi nhuận, phân khúc khách, sửa chữa/vệ sinh (js/views/opsreports.js).
     Preview có rà soát minh chứng và sửa công thức (thành phần × hệ số, bắt buộc lý do); bản lưu có Sửa (D: phiên bản mới), Tải Excel, Xóa mềm. */
  TH.CR_RPT3 = { id: 'CR-RPT-03', date: '2026-10-28', title: 'Báo cáo theo nhóm, rà soát minh chứng, sửa công thức' };
  var rIdx = TH.SCREENS.findIndex(function (s) { return s.id === 'REPORTS'; });
  if (rIdx > -1) {
    var rNote = 'Tab nhóm Tài chính / Vận hành / Khách hàng → tạo: chọn loại → kỳ, tòa → xem trước, truy nguồn, rà soát minh chứng, sửa công thức có lý do → xác nhận; bản lưu: xem, tải Excel, sửa, xóa có lý do';
    TH.SCREENS[rIdx].title = 'Báo cáo';
    TH.SCREENS[rIdx].notes = { A: rNote + ' · RPT-04, RPT-05', B: rNote + ' · RPT-04, RPT-05', C: rNote + ' · thêm âm dương điện nước, lấp đầy', D: rNote + ' · thêm dự kiến lợi nhuận, phân khúc khách, sửa chữa/vệ sinh; sửa tạo phiên bản mới' };
  }
  TH.SRS_SCREENS = function () { return TH.SCREENS.filter(function (s) { return !s.cr; }); };
})();
