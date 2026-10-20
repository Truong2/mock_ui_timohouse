# TIMEHOUSE — Checklist QA bản mockup

Ngày chạy: 20/10/2026 · Môi trường: Chromium (Playwright) 1440×900, 1280×800, 1024×768, 390×844 · Dataset gốc và dataset có nháp đang nhập.

Ký hiệu: ✅ đạt · ⚠ đạt có lưu ý · ⏳ cần kiểm tra thủ công thêm.

## 1. Điều kiện hoàn thành (plan §9)

| # | Tiêu chí | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Giá A/B/C/D đúng ở mọi vị trí | ✅ | Một nguồn `TH.PACKAGES`; drawer đọc được `50–60 / 70–80 / 80–90 / 90–100 triệu`; landing, topbar, tooltip khóa đều dùng cùng nguồn |
| 2 | 39 màn giữ lõi A; 52 nhóm đủ increment và nguồn | ✅ | `#/demo/mapping`: 39/39 màn dựng, 52/52 nhóm, **156/156** increment B/C/D gắn gate; không màn nào bị khóa toàn bộ |
| 3 | 8 màn ưu tiên qua đủ 4 mode | ✅ | Sweep tự động 41 route × 4 gói: 0 lỗi runtime, không màn trống |
| 4 | Đổi gói / điều hướng / Back / Forward / refresh giữ state; nháp không mất | ✅ | OCR-CON: sửa field → đổi D→A có hộp xác nhận → giá trị giữ nguyên, confidence ẩn → D hiện lại; F5 giữ gói B và nháp; Back/Forward giữ gói C |
| 5 | Link gửi khách; query sai fallback; *Xem toàn bộ gói* về D | ✅ | `?previewPackage=Z` → toast + dùng gói đã lưu; nút *Xem toàn bộ gói* gọi `setPackage('D')` |
| 6 | Loading / Empty / Error / Forbidden / Draft / Chờ xác nhận / Đã xác nhận / Success | ✅ | Công cụ demo (nút trượt topbar) đổi trạng thái dữ liệu từng màn; 403 qua vai trò; trạng thái nghiệp vụ hiển thị trong luồng |
| 7 | Vai trò không đổi khi đổi gói; người báo thu không tự duyệt; gate ≠ 403 | ✅ | Quản lý tòa: SYS-01/SHARE-01 → 403, PAY-APP → chip *403*, scope chỉ `TH-CG`; ở gói A PAY-02 có 10 phần khóa gói và 0 chip 403 |
| 8 | Số hóa đơn / đã thu / còn nợ khớp; lãi, lương, cổ phần có nguồn và nhãn | ✅ | Xác nhận phiếu thu CG-202 (6.069.800 ₫): thu thực 42.952.200 → 49.022.000; nợ 26.556.400 → 20.486.600; chờ XN 8.569.800 → 2.500.000. Lãi/lương/cổ phần gắn `DRAFT · D-04/06/07` |
| 9 | Mọi action chính có đích/feedback | ✅ | Mọi `data-act` có handler; nút chưa đủ điều kiện ở trạng thái disabled có tooltip lý do |
| 10 | Không gọi provider thật; nhãn mô phỏng/OPEN; dấu DESIGN DRAFT | ✅ | Zalo/OCR/import đều có badge *Mô phỏng*; sidebar có dấu DESIGN DRAFT; OA-01 nhãn D-05 |
| 11 | 1440 / 1280 / tablet; landing điện thoại | ✅ | Ảnh chụp: RPT-01 1440, INV-01 1280, PAY-02 1024 (sidebar thành menu), landing 390 |
| 12 | Console & asset khi mở local/server; kịch bản xuyên màn với dataset reset và có nháp | ✅ | Sweep `http://` 0 lỗi; `file://` xem mục 4; kịch bản 8 bước chạy ở mục 3 |

## 2. Chuyển gói (P1 — DEMO-PKG-01)

| Kiểm tra | Kết quả |
| --- | --- |
| Drawer 372px có 4 lựa chọn, giá, mô tả, toggle khóa (mặc định BẬT), nút *So sánh 52 chức năng*, *Xem toàn bộ gói*, deep link chép được | ✅ |
| Bảng so sánh: 52 dòng, lọc phân hệ, tìm kiếm, nhãn *Có trong gói / Có từ B·C·D / Chưa chốt quy tắc*, link UI-ID | ✅ (đếm 52 `tr`) |
| Escape đóng từng lớp; focus trả về nút *Đang xem* | ✅ (`activeElement = pkg-btn`) |
| Tắt toggle: METER-01 gói A từ 11 phần khóa → 0 | ✅ |
| Đang ở tab nâng cao rồi hạ gói → về tab cơ bản + toast | ✅ (`TH.resolveTab`) |

## 3. Kịch bản trình bày (README) — chạy một lượt

| Bước | Kết quả |
| --- | --- |
| Landing → demo D → RPT-01 | ✅ KPI từ `TH.calc.summary`, link nguồn |
| A: lõi dùng được, nâng cấp khóa riêng | ✅ |
| OWN-01 import A (lỗi dòng) → B preview + file lỗi `.xlsx` | ✅ |
| OCR-CON sửa field, đổi gói giữ nháp; xác nhận → CON-02 nháp | ✅ |
| METER-01 (TX-201 thiếu, TX-102 số lùi, DD-301 đột biến) → INV-01 TX sinh 4 nháp, chạy lại không trùng → INV-PREV 1 sẵn sàng / 3 khóa | ✅ |
| PAY-01 báo thu → Quản lý tòa không tự duyệt → Kế toán xác nhận → PAY-02 cập nhật | ✅ |
| D: SAL-01, SHARE-01 nhãn DRAFT, truy vết | ✅ |
| Về RPT-01, F5 giữ gói; mở so sánh 52 | ✅ |

## 4. Lưu ý / hạn chế

- ⚠ `file://`: đã kiểm tra bằng Chromium — route, icon, `localStorage`, deep link `?previewPackage=B#/demo/pay-02` đều chạy. Chrome chặn font `.woff2` nạp từ `file://` nên subset Latin + Vietnamese của Inter được nhúng data URI trong `css/fonts.css`; chỉ Latin-ext (ít dùng) cần HTTP. Trình duyệt chặn `localStorage` ở `file://` → store tự chuyển sang bộ nhớ phiên (có cảnh báo trong Công cụ demo).
- ⚠ In/PDF dùng `window.print()` — kết quả phụ thuộc hộp thoại in của trình duyệt (không tự kiểm được bằng máy).
- ⏳ Kiểm tra bằng bàn phím toàn bộ bảng (hàng `tabindex=0` + Enter) và tooltip khi focus đã có, nên rà thủ công thêm trên Firefox/Safari.
- ⏳ Đối chiếu nội dung từng ô với Excel báo giá khi có file (Decision log §4). Các tài liệu tham chiếu nhận thêm ngày 20/10 (lương, hợp đồng mẫu, hóa đơn, báo cáo) đã đối chiếu ở Decision log §5; công thức lương và mẫu OCR-CON đã cập nhật theo đó.

## 5. CR-RPT-01 — Báo cáo theo mẫu khách (20/10/2026)

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| RPT-04 / RPT-05 dựng đủ dòng theo mẫu G1 và BCKD T8 | ✅ | 43 dòng chỉ tiêu + 13 tỷ lệ, cùng thứ tự sheet mẫu; ảnh chụp 1440 gói A và D |
| Tổng các tòa = cột TỔNG | ✅ | Kỳ 09: LNR tổng 7.579.599 = Σ 3 tòa (chế độ Tổng) — sau CR-BLD-01 là 7.537.599 (§6) |
| Chế độ Kinh doanh vs Tổng | ✅ | Kỳ 10: chênh lệch tổng doanh thu 4.000.000 = cọc phòng mới TX-202; kỳ 09: GV chênh 3.200.000 = mua sắm CG-401 |
| Sweep 43 route × 4 gói × 2 kỳ | ✅ | 0 lỗi runtime, không màn trống, không chuỗi `undefined`/`NaN ₫` |
| Mapping sau CR | ✅ | 39/39 màn SRS · 52/52 nhóm · 156/156 increment; RPT-04/05 được quét thêm |
| Khóa gói giảm dần A→D | ✅ | Số phần khóa RPT-04: 8 → 6 → 4 → 0; RPT-05: 7 → 6 → 2 → 0 |
| Drill-down (B) | ✅ | Dòng *Doanh thu tiền phòng* CG kỳ 09 mở 6 hóa đơn nguồn, link INV-03 |
| Xuất Excel theo mẫu | ✅ | RPT-04: 3 sheet (báo cáo, chia cổ phần, nguồn); RPT-05: 4 sheet (kinh doanh, tổng, 2 nhóm nhà); mở bằng openpyxl, tỷ lệ định dạng `0.00%`, số khớp màn hình |
| Phân quyền | ✅ | Quản lý tòa: RPT-04 chỉ chọn được Cầu Giấy, không có nút sửa bảng phân bổ; RPT-05 → 403 |
| Số liệu cũ không đổi | ✅ | INV-2610-CG202 = 6.069.800 ₫ (tổng phí cố định giữ nguyên khi tách mã phí) |
| Điện thoại 390 | ✅ | Không tràn ngang ở landing, RPT-01/02/04/05, INV-02, SAL-01 (đã sửa topbar tràn 106px có từ trước: ẩn nhãn phụ ở ≤760px) |
| Landing + drawer gói | ✅ | Mục *Báo cáo trong gói* (2 thẻ + 4 cấp); drawer có phần *Báo cáo theo mẫu khách trong gói* theo gói đang xem |
| ⏳ Khách đối chiếu số | — | Dataset là dữ liệu giả 3 tòa; cần khách xác nhận quy tắc R-01…R-09 (Decision log §6.3) |

## 6. CR-BLD-01 — Chủ nhà, tòa nhà & mốc 5/10/15 theo note.md (20/10/2026)

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| Sweep 41 màn + 15 tab chủ nhà/tòa × 3 hồ sơ × 4 gói × 2 kỳ | ✅ | 696 lượt render, 0 lỗi runtime/console, không màn trống, không chuỗi `undefined`/`NaN` |
| Tab mới OWN-02 (7) / BLD-02 (8) × 4 gói × 2 kỳ | ✅ | 0 lỗi; số phần khóa giảm dần, vd BLD-02 › Lịch thanh toán 7 → 6 → 2 → 0, › Nhân sự 5 → 2 → 1 → 0 |
| Mapping | ✅ | 39/39 màn · 52/52 nhóm · 156/156 increment (F013/F033/F036 được gắn thêm ở OWN-02/BLD-02) |
| Hiệu suất kỳ 09 tính tay | ✅ | CG: A 30.210.680, B 18,83%, C 2.000.000, D 26.521.524, HS 72,3% / tạm tính 79,3% — khớp BLD-02, PAY-02, RPT-02, Excel sheet *Hieu suat*; tổng 3 tòa HS 66,2% |
| Lương nháp dùng D | ✅ | Kỳ 09: NV-003 HS 72,3% → lương HS 618.000; NV-004 69,1%; NV-005 51,2% |
| Sửa inline | ✅ | Sửa giá thuê HĐT-CG-2024 → lưu → BLD-01/BLD-02 & `ownerRent` = 19.500.000, thêm phiên bản v2; Hủy giữ giá trị cũ |
| Chặn rời trang khi chưa lưu | ✅ | Đổi tab → hộp thoại, *Tiếp tục chỉnh sửa* giữ nguyên; đổi hash → quay lại & hỏi, *Lưu* rồi đi tiếp; đổi kỳ → *Bỏ thay đổi* áp kỳ mới, dữ liệu không đổi |
| Thao tác danh sách | ✅ | Sinh lịch từ HĐ TX: thêm 4 kỳ 3 tháng, hạn ngày 10, 27.000.000/kỳ; ghi nhận trả; thêm tài sản; thêm NV vệ sinh; tải minh chứng PCCC; đổi chủ nhà TX → HĐ cũ kết thúc 19/10/2026, HĐ mới tạo |
| Gói A không lộ phần C | ✅ | Ẩn banner quá hạn, “còn lại”, trạng thái trả ở A/B; HS gói A gắn nhãn “chưa tách DV” |
| Phân quyền | ✅ | Quản lý tòa: chỉ thấy tòa mình (TH-DD → 403 phạm vi); không sửa được HĐ thuê, thông tin chủ nhà, lịch trả (`lease.edit`) |
| Điện thoại 375 | ✅ | Không tràn ngang ở BLD-01/02 (8 tab), OWN-01/02, PAY-02, RPT-02; tab cuộn ngang |
| Số liệu cũ | ✅ | INV-2610-CG202 = 6.069.800 ₫; Kinh doanh vs Tổng kỳ 10 chênh 4.000.000 |
| ⏳ Khách chốt | — | G-01…G-10 (Decision log §7.4) |
