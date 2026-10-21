/*
 * CR-CUS-01 (20/10/2026) — Thông tin khách hàng (khách thuê) theo note.md §8:
 *   danh sách tổng quan (mã phòng/tòa, trưởng khu vực, NV vận hành, công nợ, Zalo, trạng thái nhiều tầng),
 *   chi tiết "Mã phòng — Mã tòa" theo tab Lưu trú / Hợp đồng / Tài chính, nghề nghiệp, phương tiện, lần ký/gia hạn,
 *   file HĐ + đọc bảng giá theo gói, bảng giá 7 loại phí lưu theo từng HĐ, ghi chú, hoàn cọc, nhắc hết hạn 35 ngày.
 * Xếp gói bám tầng SRS như CR-BLD-01: mục trùng increment giữ đúng tầng; mục SRS chưa có (hoàn cọc) đưa vào gói A.
 * Giả định K-01…K-09 đã có bộ trả lời đề xuất (docs/TIMEHOUSE_MOCKUP_CR_CUS_ANSWERS.md, áp dụng 20/10/2026 — DECISIONS §9.5); vẫn PROPOSED/PENDING_APPROVAL, chưa phải khách phê duyệt.
 */
var TH = window.TH = window.TH || {};
(function () {
  TH.CR_CUS = { id: 'CR-CUS-01', date: '2026-10-20', title: 'Hồ sơ khách thuê: tổng quan, lưu trú, hợp đồng & bảng giá, tài chính theo note khách' };
  TH.CRS = TH.CRS || {};
  TH.CRS[TH.CR_CUS.id] = TH.CR_CUS;
  TH.CR_CUS2 = { id: 'CR-CUS-02', date: '2026-10-21', title: 'OCR hợp đồng khách thuê theo mẫu đầy đủ: lấy đủ hồ sơ thuê, tài sản bàn giao, điều khoản' };
  TH.CRS[TH.CR_CUS2.id] = TH.CR_CUS2;

  /* Phần hồ sơ khách thuê trong từng gói (cộng dồn) — drawer gói */
  TH.CUS_PACK = {
    A: { head: 'Hồ sơ thuê đầy đủ', items: ['Danh sách theo hồ sơ thuê: mã phòng/tòa, NV vận hành, công nợ, Zalo, trạng thái vòng đời + nhãn (sắp hết HĐ theo cấu hình, bàn giao, cọc, công nợ)', 'Chi tiết 3 tab: lưu trú (nghề nghiệp, xe có trạng thái đăng ký, lần gia hạn theo chứng từ), hợp đồng (file, dòng phí theo HĐ nhập tay, ghi chú), tài chính (công nợ, hồ sơ cọc)', 'OCR hợp đồng theo mẫu đầy đủ: Bên B, Điều 1–4, bảng tài sản bàn giao — mỗi field/bảng phải xác nhận rồi mới áp vào hồ sơ'] },
    B: { head: 'Thêm tự động hóa', items: ['Cột Trưởng khu vực (TPVH — vai trò riêng, có thể Chưa phân công)', 'Tự đọc & map bảng giá từ file HĐ, review rồi xác nhận', 'Lọc quá hạn, xuất công nợ; kiểm trùng biển số theo khoảng đăng ký; hiệu lực giá từ kỳ'] },
    C: { head: 'Thêm kiểm soát', items: ['So khớp số xe/người ↔ dòng phí HĐ', 'Preview tác động khi đổi bảng giá', 'Phiếu điều chỉnh công nợ có duyệt; log liên hệ'] },
    D: { head: 'Thêm lịch sử', items: ['Log sửa tay kết quả đọc bảng giá', 'Giai đoạn giá & phiên bản HĐ/định danh', 'Phân bổ 1 phiếu thu cho nhiều hóa đơn'] },
  };

  var PATCH = {
    F010: { A: 'Nhập tay, tìm kiếm, gán HĐ; danh sách tổng quan theo mã phòng/tòa + trạng thái; hồ sơ lưu trú (nghề nghiệp, phương tiện, lần ký/gia hạn); sửa từng nhóm', B: 'Kiểm trùng theo trường nhận dạng đã duyệt (giấy tờ, biển số xe)', ui: ['CUS-01', 'CUS-02'] },
    F012: { A: 'OCR 1 mẫu HĐ đầy đủ (DEMO-TH-…): Bên B, Điều 1–4, bảng tài sản bàn giao Điều 2.2; mỗi field/bảng phải xác nhận; áp vào hồ sơ thuê (lưu trú, dòng phí, bàn giao, tiền đã nộp)', B: 'Tối đa 2 mẫu HĐ; độ tin cậy từng field; map biểu phí Điều 4.4 → dòng phí theo HĐ', C: 'So khớp phòng–khách–HĐ: số người ≤ tối đa, số xe khai ↔ xe đã xác nhận, chỉ số bàn giao ↔ công tơ, giá ↔ niêm yết', D: 'Log sửa tay so với OCR; thư viện mẫu đã duyệt', ui: ['CUS-02'] },
    F015: { A: 'Một bộ phí hiện hành theo HĐ: điện, nước, mạng, thang máy, dịch vụ chung, sạc xe điện, gửi xe (đơn giá + cách tính)', ui: ['CUS-02'] },
    F016: { A: 'Danh sách đến hạn trong 35 ngày (mặc định), xuất Excel; trạng thái "Chuẩn bị hết HĐ" ở danh sách khách', ui: ['CUS-01'] },
    F031: { A: 'Nhiều lần thu / 1 HĐơn, không âm dư nợ; công nợ theo hồ sơ thuê ở danh sách & tab Tài chính; hồ sơ cọc: bàn giao → đối chiếu → duyệt (người lập ≠ người duyệt) → xác nhận thực chi (đề xuất K-03/K-04)', ui: ['CUS-01', 'CUS-02'] },
    F006: { B: 'Phân công Trưởng nhóm, Trưởng phòng vận hành (TPVH — “Trưởng khu vực”, phụ trách khu vực/nhóm tòa), NV vận hành, NV vệ sinh, NV kỹ thuật; Trưởng nhóm và TPVH là hai vai trò riêng', ui: ['CUS-01'] },
  };
  Object.keys(PATCH).forEach(function (fid) {
    var f = TH.FEATURES.find(function (x) { return x.id === fid; }), p = PATCH[fid];
    if (!f) return;
    f.srs = f.srs || { A: f.A, B: f.B, C: f.C, D: f.D };
    f.crOf = f.crOf || {};
    ['A', 'B', 'C', 'D'].forEach(function (k) { if (p[k]) { f[k] = p[k]; if ((f.crKeys || []).indexOf(k) === -1) f.crKeys = (f.crKeys || []).concat(k); f.crOf[k] = fid === 'F012' ? TH.CR_CUS2.id : TH.CR_CUS.id; } });
    if (p.A || p.B || p.C || p.D) f.cr = f.cr || TH.CR_CUS.id;
    (p.ui || []).forEach(function (u) { if (f.ui.indexOf(u) === -1) f.ui.push(u); });
  });

  var CUS = {
    A: 'Danh sách theo hồ sơ thuê (mã phòng/tòa, NV vận hành, công nợ, Zalo, trạng thái vòng đời + nhãn theo trục); chi tiết Lưu trú / Hợp đồng / Tài chính; dòng phí theo HĐ nhập tay; hồ sơ cọc theo luồng đề xuất; điều khoản áp dụng theo từng HĐ ký',
    B: 'Trưởng khu vực (TPVH, vai trò riêng); tự đọc bảng giá từ file HĐ; lọc quá hạn & xuất công nợ; kiểm trùng giấy tờ/biển số theo khoảng đăng ký',
    C: 'So khớp xe/người ↔ phí; preview đổi biểu phí; log liên hệ; phiếu điều chỉnh công nợ',
    D: 'Log sửa tay OCR; giai đoạn giá; phiên bản định danh/HĐ; phân bổ phiếu thu',
  };
  [['CUS-01', CUS], ['CUS-02', CUS]].forEach(function (x) {
    var s = TH.SCREENS.find(function (y) { return y.id === x[0]; });
    if (!s) return;
    s.srsNotes = s.srsNotes || s.notes;
    s.notes = x[1];
    s.crNote = TH.CR_CUS.id;
  });
  var c2 = TH.SCREENS.find(function (y) { return y.id === 'CUS-02'; });
  if (c2) c2.title = 'Hồ sơ khách thuê (Mã phòng — Mã tòa)';
})();
