/*
 * CR-BLD-01 (20/10/2026) — Cập nhật theo note.md / ques.md (câu trả lời của khách cho 9 câu hỏi + yêu cầu giao diện):
 *   hồ sơ chủ nhà theo mẫu HĐ thuê nhà, hợp đồng thuê tòa, hồ sơ tòa (m², tình trạng, PCCC/ĐKKD), 4 vai trò nhân sự,
 *   2 nhóm tài sản, thời gian vận hành, hiệu suất theo mốc 5/10/15 (A/B/C/D, tạm tính/thực tế), lịch thanh toán cho chủ nhà,
 *   danh sách tóm tắt + chi tiết theo tab + Chỉnh sửa/Lưu/Hủy từng nhóm.
 * Xếp gói bám tầng SRS: mục trùng increment SRS giữ đúng tầng; mục SRS chưa có đưa vào gói A (đánh dấu CR).
 * File sinh tự động (features.js, screens.js) giữ nguyên; nội dung SRS gốc lưu ở f.srs.
 */
var TH = window.TH = window.TH || {};
(function () {
  TH.CR_BLD = { id: 'CR-BLD-01', date: '2026-10-20', title: 'Hồ sơ chủ nhà, tòa nhà & mốc thu 5/10/15 theo note khách' };
  TH.CRS = TH.CRS || {};
  if (TH.CR_RPT) TH.CRS[TH.CR_RPT.id] = TH.CR_RPT;
  TH.CRS[TH.CR_BLD.id] = TH.CR_BLD;

  /* Phần hồ sơ chủ nhà & tòa trong từng gói (cộng dồn) — drawer gói */
  TH.BLD_PACK = {
    A: { head: 'Hồ sơ đầy đủ theo hợp đồng', items: ['Chủ nhà theo mẫu HĐ thuê nhà, HĐ thuê tòa (giá thuê, cọc, giữ giá, thời hạn, người giới thiệu ≠ người nhập)', 'Tòa: m², tầng, phòng, tình trạng, PCCC/ĐKKD + minh chứng, tài sản 2 nhóm, NV vận hành chính', 'Hiệu suất 3 mốc 5/10/15, tạm tính & thực tế; nhập tay lịch trả chủ nhà'] },
    B: { head: 'Thêm phân công & tự động hóa', items: ['Trưởng nhóm, NV vệ sinh, NV kỹ thuật (nhiều người)', 'Hiệu suất trừ tỷ lệ dịch vụ (B)', 'Tự sinh lịch trả chủ nhà từ HĐ; lịch sử HĐ thuê'] },
    C: { head: 'Thêm theo dõi', items: ['Hiệu suất cộng thu thêm (C): tiền phòng phát sinh + khách bỏ cọc', 'Lịch trả: đã trả / còn lại / quá hạn', 'Hiệu lực phân công theo ngày, quyền xem tài liệu'] },
    D: { head: 'Thêm đối chiếu', items: ['Đối chiếu lịch trả ↔ chi phí tiền thuê', 'Snapshot hiệu suất & lợi nhuận theo kỳ', 'Phiên bản công thức HS, phiên bản tài liệu'] },
  };

  var PATCH = {
    F001: { A: 'CRUD hồ sơ chủ nhà theo mẫu HĐ thuê nhà (CCCD, ngày/nơi cấp, hộ khẩu, STK nhận tiền); danh sách tóm tắt, chi tiết theo tab, sửa từng nhóm' },
    F003: { A: '1 chủ nhà chính/tòa + HĐ thuê tòa: giá thuê, cọc, thời gian giữ giá, thời hạn, người giới thiệu nguồn ≠ người nhập dữ liệu', B: 'Lịch sử chủ nhà và phiên bản HĐ thuê của tòa' },
    F004: { A: 'CRUD tòa: địa chỉ, m², tầng, số phòng, tình trạng, PCCC/ĐKKD + minh chứng, thời gian vận hành, tài sản chủ nhà / đầu tư thêm' },
    F006: { A: 'Một nhân viên vận hành phụ trách chính', B: 'Phân công Trưởng nhóm, NV vận hành, NV vệ sinh, NV kỹ thuật (nhiều người)' },
    F013: { A: 'Lưu file gắn hồ sơ: HĐ khách, giấy tờ; sổ đỏ, HĐ thuê tòa, PCCC, ĐKKD', ui: ['OWN-02', 'BLD-02'] },
    F033: { A: 'A = M5×100% + (M10−M5)×90% + (M15−M10)×70%; HS% = D ÷ giá niêm yết; tạm tính & thực tế; lấp đầy tính riêng', B: 'Trừ tỷ lệ dịch vụ B = DV phải thu ÷ DT phải thu', C: 'Cộng thu thêm C = tiền phòng phát sinh đã thu đủ + khách bỏ cọc; nhánh cọc mới/kỳ 3 tháng nếu chốt', ui: ['BLD-02', 'RPT-02'] },
    F036: { A: 'Nhập tiền trả chủ nhà như chi phí; nhập tay kỳ trong lịch thanh toán cho chủ nhà', B: 'Tự sinh lịch trả từ HĐ thuê tòa (chu kỳ, hạn ngày 01–10, số tiền/kỳ)', C: 'Lịch trả: đã trả / còn lại / quá hạn', ui: ['BLD-02'] },
    F047: { A: 'Bảng 3 mốc + A/B/C/D, HS thực tế & tạm tính theo tòa' },
  };
  Object.keys(PATCH).forEach(function (fid) {
    var f = TH.FEATURES.find(function (x) { return x.id === fid; }), p = PATCH[fid];
    if (!f) return;
    f.srs = f.srs || { A: f.A, B: f.B, C: f.C, D: f.D };
    f.crOf = f.crOf || {};
    ['A', 'B', 'C', 'D'].forEach(function (k) { if (p[k]) { f[k] = p[k]; f.crKeys = (f.crKeys || []).concat(k); f.crOf[k] = TH.CR_BLD.id; } });
    if (p.A || p.B || p.C || p.D) f.cr = f.cr || TH.CR_BLD.id;
    (p.ui || []).forEach(function (u) { if (f.ui.indexOf(u) === -1) f.ui.push(u); });
  });

  /* Ghi chú theo gói của 4 màn chủ nhà / tòa (giữ ghi chú SRS gốc ở srsNotes) */
  var OWN = {
    A: 'Danh sách tóm tắt; chi tiết 4 tab: thông tin theo mẫu HĐ, HĐ thuê tòa, tòa liên quan, tài liệu & sổ đỏ; Chỉnh sửa/Lưu/Hủy từng nhóm',
    B: 'Kiểm trùng tên/SĐT; lịch sử chủ nhà & phiên bản HĐ thuê; tìm tài liệu',
    C: 'Audit thay đổi; quyền xem tài liệu theo tòa',
    D: 'Nhập theo kỳ hiệu lực + phiên bản hồ sơ/tài liệu; đối chiếu chi phí trả chủ nhà theo kỳ',
  };
  var BLD = {
    A: 'Danh sách tóm tắt; 8 tab: hồ sơ (m², tầng, phòng, tình trạng), chủ nhà & HĐ, NV vận hành chính, phòng, tài sản 2 nhóm, PCCC/ĐKKD, vận hành & hiệu suất 3 mốc, lịch trả chủ nhà (nhập tay)',
    B: 'Phân công 4 vai trò; công suất phòng; HS trừ tỷ lệ dịch vụ; tự sinh lịch trả từ HĐ',
    C: 'Lịch sử & hiệu lực phân công; HS cộng thu thêm; đã trả / còn lại / quá hạn',
    D: 'Snapshot hiệu suất & lợi nhuận theo kỳ; tách vai trò doanh thu; đối chiếu phải trả ↔ chi phí',
  };
  [['OWN-01', OWN], ['OWN-02', OWN], ['BLD-01', BLD], ['BLD-02', BLD]].forEach(function (x) {
    var s = TH.SCREENS.find(function (y) { return y.id === x[0]; });
    if (!s) return;
    s.srsNotes = s.notes;
    s.notes = x[1];
    s.crNote = TH.CR_BLD.id;
  });
})();
