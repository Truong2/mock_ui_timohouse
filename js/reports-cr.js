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
    A: { head: 'Có đủ 2 báo cáo theo đúng mẫu Excel', items: ['Doanh thu theo tòa (mẫu G1): doanh thu, cọc, giá vốn, chi phí, LNG/LNR, 13 tỷ lệ, bảng chia cổ phần', 'Báo cáo kinh doanh tháng: cột Tổng + từng tòa, chế độ Tổng / Kinh doanh', 'Xuất Excel đúng bố cục mẫu, in/PDF'] },
    B: { head: 'Thêm truy vết & xu hướng', items: ['Bấm từng dòng để mở hóa đơn, cọc, chi phí nguồn', 'Đối chiếu doanh thu báo cáo với thu thực', 'Biểu đồ xu hướng 6 kỳ DT / LNG / LNR'] },
    C: { head: 'Thêm kiểm soát số liệu', items: ['Duyệt kỳ, snapshot và theo dõi sai lệch', 'Chi phí chung tự kéo từ lương đã duyệt theo rule phân bổ', 'Gộp theo nhóm nhà, so sánh kỳ trước, cảnh báo biên lợi nhuận thấp'] },
    D: { head: 'Thêm chốt phiên bản', items: ['Đối chiếu 3 kỳ lịch sử theo vai trò', 'Khóa kỳ & chốt phiên bản báo cáo', 'Mẫu báo cáo quản trị có version'] },
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
  TH.SRS_SCREENS = function () { return TH.SCREENS.filter(function (s) { return !s.cr; }); };
})();
