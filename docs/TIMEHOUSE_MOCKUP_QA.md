# TIMEHOUSE — Checklist QA bản mockup

Ngày chạy: 20/10/2026 · Môi trường: Chromium (Playwright) 1440×900, 1280×800, 1024×768, 390×844 · Dataset gốc và dataset có nháp đang nhập.

Ký hiệu: ✅ đạt · ⚠ đạt có lưu ý · ⏳ cần kiểm tra thủ công thêm.

> **Trạng thái chung (theo `TIMEHOUSE_MOCKUP_QA_ANSWERS.md`): `TECHNICAL_QA_REPORTED_PASS`** — kết quả tự kiểm kỹ thuật trên Chromium; **không** phải `BUSINESS_SIGNED_OFF` / `PRODUCTION_READY`, không chứng minh 88 frame Figma. Phản hồi từng mục và kết quả chạy lại: **§7**.

## 1. Điều kiện hoàn thành (plan §9)

| # | Tiêu chí | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Giá A/B/C/D **hiển thị thống nhất với cấu hình demo** (chưa đối chiếu Excel báo giá — QA-B01) | ✅ kỹ thuật | Một nguồn `TH.PACKAGES`; drawer đọc được `50–60 / 70–80 / 80–90 / 90–100 triệu`; landing, topbar, tooltip khóa đều dùng cùng nguồn |
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

## 7. Phản hồi QA_ANSWERS và chạy lại sau schema 7 (20/10/2026)

### 7.1 Đếm phạm vi tách riêng (QA-P05)

| Đại lượng | Giá trị | Cách đếm |
| --- | --- | --- |
| route_count | 44 | 41 màn (39 SRS + 2 CR) + 2 trang tiện ích (`screens`, `mapping`) + landing |
| screen_count | 39 SRS + 2 CR | Trong đó 11 màn kiểu Popup (render dạng dialog phủ màn gốc) |
| dialog_count | 17 | Dialog khai báo để quét (form thêm/sửa, phân công, tài sản, kỳ trả…) |
| tab_count | 40 biến thể tab | Trong 82 biến thể render (`scan()` của từng màn) |
| figma_frame_count | — | Ngoài phạm vi bản HTML; chưa có checklist 88 frame (QA-B04) |

Giải thích các con số cũ: “41/43 route” ở §1/§5 là số route được sweep (trước/sau CR-RPT-01, gồm trang tiện ích); “696” ở §6 = (41 màn + trang mục lục) × 8 + 15 tab × 3 hồ sơ × 8.

### 7.2 Smoke test tái lập được (QA-P04)

Chạy tại `#/demo/mapping` › **Chạy smoke test** (không cần cài Playwright), tải log `.csv` ngay trên trang. Kết quả lần chạy 20/10/2026, schema 7:

| Phạm vi một lượt (1 gói × 1 kỳ) | Số lượt | × 4 gói × 2 kỳ |
| --- | --- | --- |
| Biến thể render (màn, Popup, tab) | 82 | 656 |
| Dialog khai báo | 17 | 136 |
| **Tổng** | **99** | **792 lượt · 0 lỗi** |

Trang hiển thị bảng chia theo nhóm *Màn SRS / Màn CR / Popup / Tab chi tiết / Dialog* × gói × kỳ.

Kèm sweep Playwright toàn ứng dụng (render qua router): **712 lượt** = [(41 màn + mục lục) + 15 tab × 3 hồ sơ + 2 chế độ RPT-05] × 4 gói × 2 kỳ, 0 lỗi runtime/console, không chuỗi `undefined`/`NaN`; 375px không tràn ngang ở BLD-02 (6 tab), RPT-05, mapping, SAL-01.

### 7.3 Kiểm tra chức năng mới

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| G-05 diện tích | ✅ | TH-TX nhập đất 72 m² → lưu; xây dựng trống hiển thị “Chưa cập nhật” |
| G-06 tình trạng | ✅ | Đổi “Rất cũ”; hiện ngày, người, ghi chú đánh giá |
| G-07 PCCC/ĐKKD | ✅ | TX: “Chưa cập nhật” → “Có hồ sơ — chưa kiểm tra”, loại hồ sơ lưu đúng; DD ĐKKD “Không áp dụng / cần làm rõ” |
| G-08 Chính/Phụ | ✅ | Badge Chính/Phụ cho 4 vai trò; NV-012 kỹ thuật TX là Phụ |
| G-09 tài sản | ✅ | Di chuyển TS-TX-03 TX-202 → Kho tầng 1: nhật ký ghi “di chuyển TX-202 → Kho tầng 1” |
| G-10 nhắc lịch | ✅ | Tắt “Khi quá hạn” → danh sách nhắc rỗng; cột Duyệt chi: LT-TX-2610 *Chờ duyệt* |
| R-01/R-07 chế độ Kinh doanh | ✅ | Kỳ 10: tiền thuê dự kiến 39.500.000, LNR 4.755.000; tổng các tòa = cột TỔNG ở cả 2 chế độ |
| Khóa gói giảm dần | ✅ | BLD-02 CG: Lịch thanh toán 9 → 7 → 2 → 0; Nhân sự 5 → 2 → 1 → 0; Hồ sơ 3 → 2 → 1 → 0; Vận hành 3 → 2 → 1 → 0 |
| Quyền | ✅ | Quản lý tòa: sửa được *Thông tin chung* tòa, không sửa HĐ thuê, không thao tác lịch trả |
| Mapping | ✅ | 39/39 · 52/52 · 156/156 |
| RTM | ✅ | `TIMEHOUSE_RTM_2026-10-20.xlsx` 208 dòng, mở bằng openpyxl |
| Regression | ✅ | INV-2610-CG202 = 6.069.800 ₫; HS CG kỳ 09: A 30.210.680, D 26.521.524, HS 72,3% (B độ chính xác đầy đủ); LNR Tổng kỳ 09 7.537.599 |

### 7.4 Trạng thái các vấn đề QA_ANSWERS §7

| Mã | Trạng thái | Ghi chú |
| --- | --- | --- |
| QA-B01 | ✅ Đã sửa chữ | Mục §1.1, landing, drawer: “giá hiển thị thống nhất với cấu hình demo, chưa đối chiếu báo giá” — **vẫn là blocker thương mại** cho đến khi có Excel |
| QA-B02 | ⏳ Blocker | SAL-01 hiện cảnh báo ÷100 vs ÷90; cần khách chốt bảng bậc/thâm niên |
| QA-B03 | ⏳ Blocker | R-01…R-09, G-04, D-07 mới ở mức đề xuất; số cổ phần không sinh lệnh chi |
| QA-B04 | ⏳ Blocker | Checklist 88 frame Figma ngoài phạm vi bản HTML |
| QA-P01 | ⏳ | In/PDF thật trên Chrome/Edge + 1 trình duyệt khác — cần người kiểm |
| QA-P02 | ⏳ | Bàn phím, focus, screen reader; Safari: chưa có môi trường test |
| QA-P03 | ⏳ | Phân quyền phải kiểm ở backend — mockup chỉ ẩn/khóa trên FE |
| QA-P04 | ✅ | Smoke test trong trang + log CSV; RTM xuất được |
| QA-P05 | ✅ | §7.1 |
| QA-P06 | ⚠ | `file://` có thể không giữ nháp qua F5; demo khách ưu tiên mở qua HTTP(S) (README) |
| QA-P07 | ⏳ | PM duyệt CR-RPT-01, CR-BLD-01 và ảnh hưởng giá |
| QA-P08 | ⚠ | Đã có `waterMethod` và cảnh báo; tính hóa đơn theo người và `allocation_rule` chờ D-03/R-02 |

## 8. CR-CUS-01 — Khách thuê theo note.md §8 (20/10/2026, schema 8)

### 8.1 Đếm phạm vi và smoke test

| Đại lượng | Trước (schema 7) | Sau | Ghi chú |
| --- | --- | --- | --- |
| route / màn | 44 / 39 + 2 | 44 / 39 + 2 | Không thêm màn |
| dialog khai báo | 17 | 21 | Thêm xe, sửa xe, đọc bảng giá, đối chiếu hoàn cọc |
| biến thể render | 82 | 92 | CUS-01 6 bộ lọc; CUS-02 6 tab + 3 hồ sơ HĐ đã kết thúc |
| Smoke test `#/demo/mapping` | 792 lượt | **904 lượt · 0 lỗi** | (92 + 21) × 4 gói × 2 kỳ |
| Mapping | 39/52/156 | 39/52/156 | |

### 8.2 Kiểm tra chức năng

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| Bộ lọc CUS-01 | ✅ | Sắp hết HĐ: CG-202, DD-102. Phá HĐ: TX-202. Hoàn cọc: DD-102, CG-401, DD-302. Còn nợ / quá hạn: CG-202, CG-302, DD-201, DD-301. Chưa Zalo: 4 |
| Đa trạng thái | ✅ | DD-102: “Đang thuê · Sắp hết HĐ · Chờ bàn giao · hoàn cọc”. DD-302: “Đã kết thúc · Hoàn cọc · quá hạn” |
| Tiêu đề CUS-02 | ✅ | “CG-201 — TH-CG”, “DD-102 — TH-DD” |
| Sửa / Lưu / Hủy | ✅ | Nghề nghiệp lưu được và ghi lịch sử liên hệ. Hủy giữ SĐT cũ. Đổi tab khi chưa lưu → hỏi Lưu / Bỏ / Tiếp tục |
| Phương tiện | ✅ | Thêm xe điện SM 29H1-•••.67 → cảnh báo “khai báo 2 xe nhưng HĐ tính phí gửi xe 1 xe” (gói C) |
| Bảng giá | ✅ | DV chung 150k → 180k, nước theo người 100k: preview 370k → 500k/tháng. `fees` đồng bộ. Hóa đơn nháp kỳ 11 có “Nước (theo người)”. INV-2610-CG201 giữ 6.550.200 |
| Đọc bảng giá theo gói | ✅ | A: nút khóa (F012.B), chỉ nhập tay. B: dialog review 7 dòng, độ tin cậy, so khớp → xác nhận → `ocrJobs` kind `pricelist`. Dòng theo xe có số lượng 0 không vào hóa đơn |
| Hoàn cọc DD-302 | ✅ | Đối chiếu (thấm trần 500.000) → duyệt 3.990.000 → xác nhận: COC-2610-02, RPT-05 Tổng kỳ 10 hoàn cọc 0 → 3.990.000, Kinh doanh giữ 4.755.000 |
| Quyền | ✅ | Quản lý tòa (Cầu Giấy): chỉ thấy 7 hồ sơ CG; thao tác cọc hiện 403; hồ sơ DD-302 bị chặn phạm vi |
| 35 ngày | ✅ | CON-03 mặc định 35 (2 HĐ); badge menu 2; RPT-02 “15 HĐ hiệu lực · 2 HĐ hết hạn trong 35 ngày”; CON-01 lọc Phá HĐ: HĐ-TX202/25 |
| Regression số liệu | ✅ | LNR Kinh doanh 09 16.937.599, Tổng 09 7.537.599, Kinh doanh 10 4.755.000; HS CG 09 72,3%; INV-2610-CG202 6.069.800 |
| 375px | ✅ | CUS-01, CUS-02 (3 tab × 2 hồ sơ) không tràn ngang |

Giả định chờ khách chốt: K-01…K-09 (Decision log §9.3). Trên RTM, F010/F012/F015/F016/F031 ghi “DRAFT — chờ duyệt K-…”.

### 8.3 Chạy lại CR_CUS_ANSWERS (schema 9 — 20/10/2026)

Kết quả mới này thay thế mô tả schema 8 ở §8.2 về Trưởng khu vực, lịch sử liên hệ, 7 dòng phí và luồng cọc. Chạy trên Chromium qua Playwright, HTTP `127.0.0.1:8779`; không có lỗi console. **23 kiểm tra tự động đạt**, trong đó có kiểm tra nâng schema 8 → 9; QA-CUS-15 vẫn chờ xác nhận nguồn từ khách.

Kịch bản tái lập: khởi động `python -m http.server 8779 --bind 127.0.0.1`, mở demo bằng Playwright rồi chạy hàm trong [tools/qa-cus.playwright.js](../tools/qa-cus.playwright.js) bằng `browser_run_code` (đọc nội dung file vào tham số `code`, bỏ dòng comment đầu nếu cần). Kịch bản dùng seed riêng trong trình duyệt, thao tác nút/form qua UI, kiểm tra dữ liệu và báo cáo; cuối lượt trả lại seed và flush storage. [Kết quả JSON](qa/schema9/results.json) lưu bằng chứng từng phép kiểm.

| Phạm vi | Kết quả |
| --- | --- |
| Schema | v9; localStorage schema 8 có marker dữ liệu cũ → reload tự nạp 19 HĐ mới, marker mất |
| Smoke render | **928 lượt · 0 lỗi** = (94 biến thể + 22 dialog) × 4 gói × 2 kỳ |
| Đếm phạm vi | 44 route · 39 màn SRS + 2 CR · 11 Popup · 46 biến thể tab |
| Mapping | 39/39 màn SRS · 52/52 nhóm · 156/156 increment (xem mapping) |
| Hồi quy seed | LNR Kinh doanh 09 **16.937.599**; Tổng 09 **7.537.599**; Kinh doanh 10 **4.755.000**; HS CG 09 **72,3%**; INV-2610-CG202 **6.069.800** |

| Mã | Kết quả | Bằng chứng / giới hạn |
| --- | --- | --- |
| QA-CUS-01 | PASS | CG: TPVH NV-013, Trưởng nhóm NV-003; TX: TPVH null, không thay bằng Trưởng nhóm |
| QA-CUS-02 | PASS | DD-102: Đang thuê + Sắp hết HĐ + Chờ bàn giao |
| QA-CUS-03 | PASS | DD-302: pending_approval và approved đều chưa có dòng sổ; Admin lập không có nút tự duyệt; Kế toán NV-002 duyệt |
| QA-CUS-04 | PASS | Thực chi DD-302 3.990.000; mã mặc định CK-20261020-261001; gọi xác nhận lần hai vẫn một dòng refund |
| QA-CUS-05 | PASS | TX-202 seed có hai nhãn Phá HĐ / Mất cọc, căn cứ và người duyệt; tình huống thử độc lập giữ 1.000.000, duyệt hoàn 3.000.000, không ép mất toàn bộ |
| QA-CUS-06 | PASS | OCR DD-102, hóa đơn nháp kỳ 11: nước 2 người × 120.000 = 240.000, đơn vị người |
| QA-CUS-07 | PASS | Dòng xe máy active giá 0; SM chờ xác nhận có số tính phí 0; sau xác nhận chuyển active |
| QA-CUS-08 | PASS | OCR lưu SM 400.000/xe và EVCHG riêng; sạc kWh không có căn cứ thì method na, không suy ra giá từ SM |
| QA-CUS-09 | PASS | 9 dòng OCR hiệu lực 2026-11; snapshot toàn bộ hóa đơn đã lập trước/sau giống nhau |
| QA-CUS-10 | PASS trong phạm vi mockup | P302 autoRenew=false, refundDays=null, không có gia hạn mặc nhiên trong seed; chưa có engine vòng đời/gia hạn chạy nền |
| QA-CUS-11 | PASS | CG-102 giữ mã HĐ, renewal mode amendment có ngày/bằng chứng/file phụ lục |
| QA-CUS-12 | PASS | KH-003 có hai HĐ nối tiếp bằng previousContractId; cọc HĐ cũ transferred qua PCC-2507-01 |
| QA-CUS-13 | PASS | HĐ mẫu đầy đủ có noticeDays=30; cấu hình expiryAlertDays=35, hiển thị tách riêng trong khối Điều khoản |
| QA-CUS-14 | PASS trong phạm vi mockup | Tìm KH-003 ra đúng hai dòng; xe không biển được lưu; hàm mask che biển; lịch sử KH-018/KH-010 không báo trùng. Nhánh persona không có vehicle.view chưa được kiểm chứng |
| QA-CUS-15 | CHỜ ĐẦU VÀO | Chưa có khách ký xác nhận nguồn; giữ SOURCE_REQUIRED / PENDING_APPROVAL, không tuyên bố APPROVED |
| QA-CUS-16 | PASS | Sửa nghề không thêm customerHistory; sửa SĐT thêm đúng một dòng; thao tác lưu ghi audit chung |
| QA-CUS-17 | PASS | Tổng kỳ 10 LNR 48.255.000 → 44.265.000 sau hoàn 3.990.000; Kinh doanh giữ 4.755.000 |

Kiểm tra bổ sung: biển đang active ở hồ sơ khác → khai báo được nhưng **không xác nhận được**; hai khoảng đăng ký liên tiếp không bị chặn. SYS-01 đổi **35 → 45 ngày**, số HĐ sắp hết hạn **2 → 3** rồi đặt lại 35. Quản lý tòa mở hồ sơ cọc CG được, thấy bước bàn giao; không có nút duyệt/thực chi; DD-302 bị chặn ngoài phạm vi.

**Bố cục và ảnh:** 5 màn/trạng thái × 2 độ rộng 1440px/375px, không tràn ngang trang; bảng và tab cuộn trong vùng riêng. Đã xem ảnh CUS-02 lưu trú/tài chính trên desktop và cấu hình SYS-01 trên mobile. Ảnh được chụp từ seed trước thao tác hoàn cọc:

| Màn | Desktop 1440px | Mobile 375px |
| --- | --- | --- |
| CUS-01 | [Ảnh](qa/schema9/cus01-1440.png) | [Ảnh](qa/schema9/cus01-375.png) |
| CUS-02 KH-003 — lưu trú, hai HĐ nối tiếp | [Ảnh](qa/schema9/cus02-stay-1440.png) | [Ảnh](qa/schema9/cus02-stay-375.png) |
| CUS-02 — hợp đồng/dòng phí | [Ảnh](qa/schema9/cus02-contract-1440.png) | [Ảnh](qa/schema9/cus02-contract-375.png) |
| CUS-02 DD-302 — tài chính/cọc | [Ảnh](qa/schema9/cus02-finance-1440.png) | [Ảnh](qa/schema9/cus02-finance-375.png) |
| SYS-01 — cấu hình cảnh báo | [Ảnh](qa/schema9/sys01-expiry-1440.png) | [Ảnh](qa/schema9/sys01-expiry-375.png) |

**Còn thiếu:** prorate theo ngày, override nhóm tòa, vòng đời HĐ đầy đủ, customerAuditLog riêng và persona mask chi tiết (Decision log §9.5). In/PDF, bàn phím/screen reader, Firefox/Safari, phân quyền backend, Excel giá gói, SRS v2.3 và 88 frame Figma chưa được nghiệm thu bởi lượt QA này.

### 8.4 CR-CUS-02 — OCR hợp đồng theo mẫu đầy đủ (21/10/2026, schema 10)

| Đại lượng | Giá trị |
| --- | --- |
| Smoke `#/demo/mapping` | **928 lượt · 0 lỗi** (94 biến thể + 22 dialog × 4 gói × 2 kỳ); route 44, tab 46 |
| Mapping | 39/39 · 52/52 · 156/156 |
| OCR-CON | 38 field / 7 nhóm / bảng 30 dòng; 9 mục độ tin cậy < 85% được tô (gói B+); 98 ô OCR trên bản scan |
| Hồi quy | LNR Kinh doanh 09 16.937.599; Tổng 09 7.537.599; Kinh doanh 10 4.755.000; HS CG 09 72,3%; INV-2610-CG202 6.069.800 — **không đổi** |

Kịch bản tự động: [`tools/qa-ocr.playwright.js`](../tools/qa-ocr.playwright.js) (kết quả: [`qa/schema10/results.json`](qa/schema10/results.json)); ảnh: [`qa/schema10/`](qa/schema10/).

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| QA-OCR-01 khóa xác nhận | ✅ | Nút khóa khi 0/39; “Đánh dấu tất cả” → 39/39 mở khóa |
| QA-OCR-02 tạo HĐ mới từ OCR | ✅ | HĐ-CG401/26: 7 dòng phí (ELEC chỉ số 4.000, WATER/SVC theo người 120.000, NET 100.000, xe máy 0 đ, xe đạp điện 150.000, SM 400.000), `refundDays` 10, gia hạn mặc nhiên, phạt 200.000, bàn giao 30 tài sản + 1.250 kWh / 85 m³, đã nộp 9.000.000, khách KH-019 có nơi cấp/HKTT và 1 xe máy chờ xác nhận; CUS-02 đủ 3 tab |
| QA-OCR-03 đọc lại HĐ có sẵn | ✅ | HĐ-DD102/25: nước theo người từ kỳ 11 (2 × 120.000 = 240.000); INV-2610-DD102 giữ 4.970.800; SĐT đổi → +1 lịch sử liên hệ; `ocrJobs` contract/update |
| QA-OCR-04 so khớp (C) | ✅ | Số người 3 > tối đa → cảnh báo đỏ, nút khóa; tích “đã kiểm tra” → mở; cảnh báo chỉ số bàn giao ≠ công tơ |
| QA-OCR-05 tài sản bàn giao | ✅ | Sửa tình trạng “Giường” → lưu; đối chiếu HC-2610-01 chọn “Tường · thấm nhẹ góc trần” 300.000 → khấu trừ nguồn “Điều 2.2 · bàn giao…”, số hoàn 4.190.000, chuyển Chờ duyệt |
| QA-OCR-06 điều khoản chỉ hiển thị | ✅ | Lưu trú hiện phí nhượng phòng 200.000 (Điều 4.3 — chỉ hiển thị), chậm nộp 200.000/ngày sau 3 ngày với nhãn “không tính vào công nợ”; công nợ CG-101 = 0 |
| QA-OCR-07 gói A / vai trò | ✅ | Gói A: 0 chỉ số tin cậy, 5 mục khóa F012.B/C/D, vẫn xác nhận được; QL tòa có nút *Đọc hợp đồng*; Nhân sự không mở được CUS-02 (403) |
| 375 px | ✅ | OCR-CON và CUS-02 (3 tab, HĐ mới) không tràn ngang; khung scan cuộn ngang nội bộ |

Lưu ý: kết quả OCR là mô phỏng theo số liệu của mẫu; chưa kiểm thử với OCR thật.

### 8.5 Bảng bị gãy dòng vì cột hẹp (21/10/2026)

Công cụ: `tools/qa-table-wrap.playwright.js` — quét 116 trạng thái (mọi màn + tab/biến thể + dialog), đo số dòng chữ thật trong từng ô bảng. Lỗi = chữ ≤ 24 ký tự bị gãy, chữ ≤ 80 ký tự chiếm ≥ 3 dòng, badge/nút gãy, hoặc tiêu đề cột > 2 dòng. Ô xếp tầng có chủ ý (mã + dòng phụ, `<br>`, nhiều badge) không tính. Tham số: mở trước `index.html?qaWrapPkg=A&qaWrapW=1280`.

| Lần đo (1440 px) | Gói D | Gói A |
| --- | --- | --- |
| Trước khi sửa | 832 ô · 91 cột ở ~30 màn (vd. CON-01 *Kỳ thu* 4 dòng ở 67 px, HR-01 *Chức vụ* 3 dòng, EXP-01 *Nhóm chi* 3 dòng, CUS-01 *NV vận hành* 2 dòng) | — |
| Sau khi sửa | 1 ô | 1 ô |

Ô còn lại: ghi chú khấu trừ ~75 ký tự trong thẻ *Tiền cọc & hoàn cọc* (cột phải hẹp của CUS-02) xuống 3 dòng — văn bản dài, chấp nhận.

Cách sửa (`TH.table`, áp cho mọi bảng dùng component):
- Tính trước nội dung từng cột: dòng dài nhất ≤ 24 ký tự → giữ 1 dòng (`nw`); dài hơn → được xuống dòng với độ rộng tối thiểu ≈ nửa dòng dài nhất (180–260 px; văn bản ≥ 70 ký tự: 240 px). Cột có thể ép bằng `nowrap: true` / `wrap: true`.
- Tiêu đề dài hơn nội dung được xuống tối đa 2 dòng thay vì kéo rộng cột; cột bị khóa theo gói (ghost) thu gọn tương tự.
- Cột thao tác cuối (không tiêu đề) dính bên phải khi bảng cuộn ngang.
- Icon trong ô hiển thị cùng dòng (svg mặc định `display:block` từng đẩy chữ xuống dòng); mã đơn cách không ngắt ở dấu gạch; số tiền dùng khoảng trắng không ngắt (`4.200.000 ₫`, `7,4 tr`).
- `TH.personCell` bỏ `min-width:140px` cứng; BLD-02 *Tài sản* xếp 2 bảng theo chiều dọc (trước chia đôi 546 px, 6–7 cột); lề ô 14 → 12 px.

Đánh đổi: bảng nhiều cột (đặc biệt gói D, hoặc khi hiện cột khóa) cuộn ngang thay vì ép chữ — vd. EXP-01 ~350 px, HR-01 ~325 px, CON-01 ~170 px; SAL-01/RPT-02 vốn đã cuộn. Trang không tràn ngang ở 375 px.

Hồi quy: smoke 928 lượt / 0 lỗi; `tools/qa-ocr.playwright.js` 9/9; `tools/qa-cus.playwright.js` 23/23 (đã cập nhật theo CR-CUS-02: schema ≥ 9, *Đọc hợp đồng* thay *Tự đọc bảng giá*, HĐ-DD102/25 theo mẫu đầy đủ); số hồi quy giữ nguyên.

### 8.6 METER-01 — chọn tòa trước (21/10/2026)

| Kiểm tra | KQ | Bằng chứng |
| --- | --- | --- |
| Chưa chọn tòa (topbar Tất cả tòa) | ✅ | Danh sách tòa: Thanh Xuân 0/4 (Thiếu 1, 1 cần kiểm tra, nút *Nhập chỉ số*) xếp đầu, Cầu Giấy 6/6 và Đống Đa 5/5 *Đủ số*; tìm “đống” → 1 tòa; lọc *Chưa xong* → 1 tòa; bấm dòng mở bảng |
| Chọn Thanh Xuân | ✅ | Bảng 4 phòng đang ở (TX-101, TX-102, TX-201, TX-301); *Hiện 1 phòng trống* thêm TX-202 |
| Đổi tòa giữ nháp | ✅ | Gõ TX-201 → đổi sang Cầu Giấy bằng ô chọn tòa (“1 dòng chưa lưu (1 ở tòa khác)”) → quay lại, số còn nguyên; *Danh sách tòa* quay về bảng tòa |
| Topbar 1 tòa / vai trò QL tòa | ✅ | Đống Đa → vào thẳng 5 phòng DD; Quản lý tòa → vào thẳng 6 phòng CG, không có thẻ chọn |
| Gói A nhập từng phòng | ✅ | TX-201 *Nhập* → 4600 / 620 → đã xác nhận; thẻ Thanh Xuân cập nhật 1/4 |
| 375 px | ✅ | Không tràn ngang khi chưa chọn và đã chọn tòa |

Smoke: **952 lượt / 0 lỗi** (METER-01 thêm 3 biến thể: danh sách tòa, lọc *Chưa xong*, Thanh Xuân + phòng trống; variant 94 → 97). `qa-ocr` 9/9, `qa-cus` 23/23 (cập nhật số smoke 952). `qa-table-wrap`: không có ô gãy mới; bảng chỉ số cuộn ngang 31 px (trước 128 px, do bỏ tên tòa ở cột Phòng).

### 8.7 CR-PAY — thu tiền theo file Excel tháng 9/2026 (21/10/2026, schema 11)

`tools/qa-pay.playwright.js` **12/12**:

| Mã | Kiểm tra | KQ | Bằng chứng (kỳ 10/2026, Admin) |
| --- | --- | --- | --- |
| QA-PAY-01 | Theo tòa = Σ check phòng; mốc 1/2/3; phải thu sau phá HĐ | ✅ | Cầu Giấy 40.952.600 / 24.479.200; Đống Đa 28.556.000 / 18.473.000, DT phá HĐ 5.723.400, thu được 3.000.000 |
| QA-PAY-02 | Theo QL: tổng hệ thống = Σ tòa | ✅ | 69.508.600 / 46.952.200; phải thu sau phá HĐ 19.833.000 |
| QA-PAY-03 | Tình trạng theo công thức Excel | ✅ | CG-101 Đủ; CG-302 Chưa TT có nợ cũ kỳ 09; DD-201 Thiếu; TX-202 Đóng cọc (giữ chỗ); TX-101 Chưa lập HĐ; CG-401 Trống |
| QA-PAY-04 | DS phòng phá HĐ | ✅ | DD-201: 8 tháng ở, phải thu = tiền điện 581.400, đã thu 3.000.000, SĐT che, hồ sơ cọc chờ duyệt, chưa có bút toán cọc |
| QA-PAY-05 | Điện nước không thu được | ✅ | CG-401 PT, DD-302 Đang sửa, TX-202 PT; DD-201 đã đóng đủ phần điện nước nên không vào danh sách |
| QA-PAY-06 | QL ghi nhận thu vượt nợ | ✅ | CG-302 thu nợ kỳ 09 + kỳ 10 + 100.000 → 2 phiếu FIFO, xác nhận ngay bởi NV-003, *Thừa* +100.000 |
| QA-PAY-07 | QL xác nhận báo thu chờ | ✅ | CG-202 → đã xác nhận bởi NV-003; Đống Đa ngoài phạm vi |
| QA-PAY-08 | Kế toán chỉ hậu kiểm | ✅ | Không có nút xác nhận; *Đã đối soát* mã FT26290001, công nợ không đổi; *Sai lệch* thiếu ghi chú bị chặn |
| QA-PAY-09 | QL ghi nhận phá HĐ CG-302 | ✅ | HĐ Phá hợp đồng, phòng Trống, vào DS phá HĐ + điện nước (Phá HĐ), hồ sơ cọc chờ duyệt, nhãn Phá HĐ, RPT *số phòng phá HĐ* = 1 |
| QA-PAY-10 | Mẫu hóa đơn / hoàn cọc | ✅ | 12 dòng, tổng = cần đóng 10.403.600 (gồm nợ cũ), Mã KH CG302A001, nội dung CK CG-302, TK nhóm nhà; phiếu hoàn cọc HC-2609-01 6.200.000 (Sửa chữa 300.000) |
| QA-PAY-11 | UI | ✅ | 6 tab PAY-02; bảng theo tòa đủ cột M5/M10/M15, mốc 1/2/3; 375 px không tràn ngang |

Smoke: **1024 lượt / 0 lỗi** (PAY-02 thêm 7 biến thể tab/lọc → variant 104; dialog PAY-02 *Ghi nhận phá HĐ*, INV-03 *Mẫu hóa đơn*). `qa-cus` 23/23 (REGRESSION giữ nguyên số RPT-05), `qa-ocr` 9/9. `qa-table-wrap`: không có ô gãy mới (còn 1 ô ghi chú khấu trừ dài ở CUS-02 như §8.5); bảng *Theo tòa* 15 cột cuộn ngang trong vùng riêng như sheet gốc.

Lưu ý dữ liệu: từ schema 11, DD-201 là phòng phá HĐ (phòng trống) → METER-01 Đống Đa còn **4** phòng đang ở (§8.6 ghi 5 phòng là trước thay đổi này); CUS-01 lọc *Phá HĐ* có 2 hồ sơ (TX-202, DD-201 — §8.2 ghi 1 là trước thay đổi này).

### 8.8 CR-BILL — tính lẻ ngày, phòng mới, kỳ TT, điện chung, giảm trừ/phụ thu (21/10/2026, schema 12)

`tools/qa-bill.playwright.js` **8/8**:

| Mã | Kiểm tra | KQ | Bằng chứng (kỳ 10/2026) |
| --- | --- | --- | --- |
| QA-BILL-01 | Tính lẻ ÷30 | ✅ | *Sinh nháp* TX: TX-202 tiền phòng 20–31/10 = 12/30 ngày × 3.800.000 = **1.520.000**, hệ số 0,4 (mẫu hóa đơn dòng 1); DV cố định đủ tháng; mọi hóa đơn trước kỳ 09 tròn tháng |
| QA-BILL-02 | Đổi quy tắc | ✅ | *Chia số ngày thực* → nháp TX-202 = 12/31 → **1.471.000**; hóa đơn đã xác nhận không đổi; đổi lại ÷30 → 1.520.000 |
| QA-BILL-03 | Phòng mới | ✅ | TX-202: niêm yết 4.000.000, chốt 3.800.000, cọc 4.000.000, 12 ngày, *Đóng cọc*; quy tắc *tách cọc* → đã đóng 0 (cọc vẫn hiện riêng) |
| QA-BILL-04 | Kỳ TT 3 tháng | ✅ | TX-301 kỳ 09: 3 × 4.900.000 = 14.700.000 (cover 09–11); kỳ 10 không tiền phòng, *đã trả đến 11/2026*; P&L TX tiền phòng TX-301 = 4.900.000 ở cả kỳ 09 và 10; HS TH1: thu trước 9.800.000; Kỳ TT 3 / 0 |
| QA-BILL-05 | Điện chung | ✅ | 126 kWh × 4.000 = 504.000, Σ phân bổ = 504.000; TX-102 3 người (khai theo tháng); tăng số người TX-101 → nháp tính lại 112.000 → 151.200, tổng vẫn 504.000; mẫu hóa đơn dòng 11; kỳ trước 10 không có điện chung |
| QA-BILL-06 | Giảm trừ / phụ thu | ✅ | QL: giảm 150.000 → tự duyệt, ghi kỳ 11 (CG-101 kỳ 10 đã xác nhận); phụ thu 700.000 → chờ duyệt. Kế toán: TX-301 phạt 600.000 chặn xác nhận → duyệt → hết chặn; TX-101 −120.000 trên hóa đơn; mẫu hóa đơn dòng 9 có lý do |
| QA-BILL-07 | UI | ✅ | INV-01: thẻ quy tắc, bảng giảm trừ, *12/30 ngày*, *Đã trả trước đến 11/2026*; PAY-02 tab *Phòng mới* (TX-202); METER-01 TX: công tơ chung 5 phòng; 375 px không tràn ngang |

Smoke: **1048 lượt / 0 lỗi** (thêm tab PAY-02 *Phòng mới*, INV-01 biến thể Cầu Giấy, dialog *Giảm trừ / phụ thu*; variant 106). `qa-pay` 12/12, `qa-cus` 23/23, `qa-ocr` 9/9. `qa-table-wrap`: không có ô gãy mới (vẫn 1 ô ghi chú khấu trừ đã biết); console sạch.

Cập nhật kỳ vọng do dữ liệu schema 12 (có chủ ý, xem DECISIONS §9.9):
- **`qa-pay`:**
  - QA-PAY-05: danh sách điện nước không thu được còn CG-401 PT và DD-302 Đang sửa. TX-202 đã có khách từ 20/10.
  - QA-PAY-11: PAY-02 có 7 tab.
  - Smoke 1048.
- **`qa-cus`:**
  - SCHEMA-UPGRADE: 20 HĐ.
  - REGRESSION kỳ 10 kinh doanh 9.655.000. Tăng do tiền phòng tháng 10 TX-301 thu trước.
  - REGRESSION kỳ 09 kinh doanh 16.682.599, tổng 7.282.599. Lương HS QL Thanh Xuân tăng 255.000 vì A tính tiền thu trước (TH1/G-03).
  - Hóa đơn CG-202 và HS Cầu Giấy 72,3% không đổi.
- **`qa-ocr`:** smoke 1048.

Các bảng QA cũ còn ghi số trước schema 12; số đúng như sau:
- METER-01 Thanh Xuân: **5** phòng đang ở, không còn phòng trống (§8.6 ghi 4 + TX-202 trống).
- QA-PAY-03 vẫn *TX-202 Đóng cọc*: cọc đã nhận, hóa đơn chưa lập.
- QA-PAY-05: TX-202 PT không còn.
