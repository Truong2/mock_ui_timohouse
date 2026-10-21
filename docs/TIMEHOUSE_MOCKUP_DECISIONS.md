# TIMEHOUSE — Decision log của bản mockup

Ngày lập: 20/10/2026. Nguồn đối chiếu: `TIMEHOUSE_SRS_GOI_D_v1_1_CAU_HINH_XEM_GOI_A_B_C_D.md` (§4, §5A, §7) và handoff. **Excel báo giá, SRS v2.3, mẫu chứng từ chưa có trong workspace** — các mục đánh dấu ⚠ chưa thể xác minh với Excel.

> **Cập nhật 20/10/2026:** câu trả lời cho mọi mã trong log nằm ở `TIMEHOUSE_MOCKUP_DECISIONS_ANSWERS.md` (đề xuất, **chưa phải phê duyệt của khách**) và phản hồi QA ở `TIMEHOUSE_MOCKUP_QA_ANSWERS.md`. Phần đã áp vào mockup và trạng thái từng mã: **§8**. Mọi mục chưa ký vẫn hiển thị `DRAFT / PROPOSED / SIMULATED`.

## 1. Các điểm OPEN của SRS và cách mockup thể hiện

| Mã | Vấn đề | Giá trị tạm trong mockup | Nơi hiển thị nhãn |
| --- | --- | --- | --- |
| D-01 | Field bắt buộc, mask, validation | `Required?` để TBD; form chỉ chặn field tối thiểu để demo chạy; định danh mask `0010••••••218` | Form thêm/sửa, OCR |
| D-02 | OCR số mẫu/định dạng | A: 1 mẫu; B: 2 mẫu + confidence 85%; C: đối chiếu; D: thư viện + log. Kết quả OCR cố định (mô phỏng) | `OCR-CON`, `OCR-CUS` |
| D-03 | Giá điện nước, kỳ chốt, số lùi | Đơn giá **theo từng tòa** (sửa được ở BLD-02), tách **giá bán / giá mua điện**, cách tính nước `meter_m3 / per_person / per_room` (hóa đơn demo vẫn tính theo m³); số mới < số cũ → chặn lưu, báo kiểm tra; thang giá (C) đánh dấu DRAFT | `METER-01`, `BLD-02` |
| D-04 | Mốc 5/10/15 | Theo **ngày thực nhận đã xác nhận**; A = M5×100% + (M10−M5)×90% + (M15−M10)×70% (M = lũy kế), thu sau 15 / ngoài kỳ = 0; B = DV phải thu ÷ DT phải thu (theo tòa); C = tiền phòng phát sinh đã thu đủ + khách bỏ cọc; D = A − A×B + C; HS = D ÷ tổng giá niêm yết; 2 trạng thái tạm tính / thực tế (§7.3) | `BLD-02`, `PAY-02`, `RPT-02`, `SAL-01` |
| D-05 | Zalo OA | Provider "chưa chốt", mọi gửi là mô phỏng; chỉ gửi khi đã liên kết OA + HĐ xác nhận | `OA-01`, `OA-02`, `INV-03` |
| D-06 | Lương & hiệu suất | HS% = D ÷ DT niêm yết (D-04); mức lương/phòng = HS × đơn giá tham chiếu ÷ 90; lương HS = mức/phòng × số phòng; trưởng nhóm 10.000 đ/phòng; bảng tham chiếu đầy đủ chờ ký | `SAL-01`, `RPT-03`, `RPT-04` |
| D-07 | Lãi tòa & cổ phần | Lãi dòng tiền tạm tính = thu đã xác nhận − chi đã duyệt; phân bổ làm tròn nghìn, dư dồn dòng đầu; lãi ≤ 0 không chia | `RPT-01`, `SHARE-01`, `SHARE-RESULT` |
| D-08 | Ngoài gói, hạ tầng | Ghi chú ở landing (giá chưa gồm OCR/OA/VPS) | Landing |
| D-09 | RTM FR ↔ UI | Chưa làm; registry chỉ truy vết tới §4 (số dòng SRS) và §5A | `screens.js.srcLine` |
| PKG-01…05 | Package preview | Chỉ prototype; mặc định D; locked/ghost có toggle ẩn; giữ qua trang/tab/refresh; `?previewPackage=` | `DEMO-PKG-01` |
| PKG-06 | Ảnh cũ sai giá | Không dùng ảnh cũ; giá A 50–60 / B 70–80 / C 80–90 / D 90–100 lấy từ một nguồn `TH.PACKAGES` — **giá hiển thị thống nhất với cấu hình demo, chưa đối chiếu Excel báo giá, không phải giá chốt** (QA-B01) | Toàn bộ |

## 2. Khác biệt giữa note cấp màn (§4) và increment cấp chức năng (§5A)

Quy tắc áp dụng: **gate chi tiết bám §5A**; note cấp màn A/B/C/D tra ở Mục lục 39 màn; dải ghi chú dưới tiêu đề mỗi màn đã bỏ (21/10/2026 — đã có bộ chọn gói trên thanh trên cùng).

| Màn | Note §4 | Increment §5A được gate | Ghi chú |
| --- | --- | --- | --- |
| CUS-01/02 | B: "OCR 2 mẫu/cảnh báo thiếu" | F010.B kiểm trùng; F011.B confidence/2 mẫu gắn ở `OCR-CUS` | Note gộp hai dòng F010/F011 |
| CON-01…03 | A: "xuất hết hạn" | F016.A xuất Excel ở `CON-01` và `CON-03` | Khớp |
| METER-01 | C: "duyệt bất thường/đổi công tơ" | F019.C duyệt bất thường; F018.B/C thay công tơ | Thay công tơ là **B** theo §5A, note màn xếp C → theo §5A |
| INV-01…03 | B: "lẻ kỳ giới hạn" | F023.B prorate — chỉ cột nhãn "Tròn tháng" | Rule prorate chưa chốt (D-03) nên không tính thật |
| PAY-01/02 | A: "100/90/70/0" | F033.A áp trọng số; F033.B tách cọc/phí DV | Ở A quy đổi tính trên tổng phiếu thu, B mới tách tiền phòng — theo §5A |
| OA-01/02 | A: "1 lịch cơ bản (phụ thuộc OA)" | F027.A gửi tay + 1 lịch | Lịch nhắc A ở trạng thái "nếu OA cho phép" |
| SAL-01 | A: "xuất Excel" | F041.A kế toán xác nhận ngoài hệ thống | Nút "Đánh dấu đã xác nhận (Excel)" là mô phỏng bước ngoài hệ thống |
| RPT-01…03 | A: "Báo cáo Excel theo tòa và tổng công ty" | F045.A/F046.A xuất Excel; drill-down là B | Khớp |
| AUTH-01/SYS-01 | — | F050–F052 | F052 (sao lưu/vận hành) không có UI riêng trong 39 màn → thể hiện ở tab "Sao lưu & vận hành" của SYS-01 và card ở AUTH-01 |

## 3. Quyết định kỹ thuật/UX của bản demo (ngoài SRS)

| # | Quyết định | Lý do |
| --- | --- | --- |
| T-01 | Màn kiểu *Popup* (11 màn) render thành dialog/drawer phủ lên màn gốc, có deep link riêng; Back đóng popup | Giữ "1 màn = 1 tác vụ", không ép thành trang độc lập |
| T-02 | Registry 39 màn + 52 chức năng sinh tự động từ SRS bằng `tools/extract-srs.js` | Kiểm đếm được, cập nhật lại khi SRS/Excel đổi |
| T-03 | Trang `#/demo/mapping` quét render mọi màn/tab/dialog đã khai báo để đếm increment đã gắn | Điều kiện "không khóa nhầm, đủ 52 nhóm" kiểm tra bằng máy |
| T-04 | Lãi dòng tiền ở kỳ hiện tại: chi tiền thuê trả chủ nhà kỳ 10 để trạng thái *chờ duyệt* | Tạo tình huống "chi phí chờ duyệt chưa tính" cho demo |
| T-05 | Dataset: 3 tòa, 18 phòng, 15 HĐ, 6 kỳ; TX chưa lập HĐ kỳ 10; TX-201 thiếu số, TX-102 số lùi, DD-301 đột biến; CG-201/DD-201 thu nhiều lần; DD-301 báo thu bị từ chối | Đủ tình huống theo plan §6 |
| T-06 | Vai trò giả lập đặt trong công cụ demo, tách khỏi drawer gói | Gate gói và 403 tính riêng (SRS §2.1-4) |
| T-07 | Xuất `.xlsx` bằng ZIP/OOXML tự viết, không CDN | Plan §5: hạn chế phụ thuộc, chạy `file://` |
| T-08 | Biểu đồ SVG tự vẽ; palette 4 màu đã chạy validator (PASS) ; mốc 5/10/15 dùng dải một hue | Đúng mức gói (xu hướng B, so sánh C) và dễ đọc |
| T-09 | Ảnh preview landing là ảnh chụp RPT-01 từ chính bản demo | Plan P4 |

## 4. ⚠ Chưa thể xác minh (thiếu nguồn)

- Nội dung chính xác từng ô Excel cho 4 sheet `A_50_60…D_90_100` — mockup dùng §5A của SRS làm bản 1:1.
- Mẫu hóa đơn, sổ điện nước, bảng chia cổ phần, file lương vận hành — bố cục xuất file dựa trên field §4.
- Tên route/màn đích cho một số action được SRS đánh dấu **[CẦN KHÁCH XÁC NHẬN]** — mockup chọn đích hợp lý (ghi trong README kịch bản).

## 5. Đối chiếu tài liệu tham chiếu bổ sung (nhận ngày 20/10/2026, sau khi lập plan)

Các file trong `docs/` (bảng lương T8, báo cáo kinh doanh T8, hóa đơn T9, sổ sửa chữa, mã HĐ điện nước, cách tính lương, hai mẫu hợp đồng PDF). **Excel báo giá 4 gói vẫn chưa có.** Tài liệu được đọc như dữ liệu tham chiếu; chỉ đưa vào mockup phần phù hợp §5A, phần còn lại ghi dưới đây.

| Nguồn | Nội dung thực tế | Mockup đã làm | Khác biệt / chờ chốt |
| --- | --- | --- | --- |
| `CÁCH TÍNH LƯƠNG PHÒNG VẬN HÀNH.docx` + `bảng lương tháng 8.xlsx` | DT sau 3 mốc = m5×100% + (m10−m5)×90% + (m15−m10)×70%; trừ tỷ lệ dịch vụ/DT phải thu; + DT thu thêm; **HS% = DT tiền phòng thu được ÷ DT niêm yết**; mức lương/phòng = HS × đơn giá tham chiếu (ví dụ 110.000 ở 90%, thâm niên > 1 năm) ÷ 90; lương HS = mức/phòng × số phòng; cột lương: cơ bản, ăn trưa, xăng xe, **lương trưởng nhóm (10.000 đ/phòng của đội)**, hỗ trợ | `TH.calc.perfPay/payroll` cài đúng công thức; SAL-01/RPT-03 hiện số phòng, DT niêm yết, HS%, mức lương/phòng, lương HS, lương trưởng nhóm; đơn giá tham chiếu 110.000/90.000 là **DRAFT** | Bảng tham chiếu đầy đủ theo bậc HS/thâm niên; “DT thu thêm” (C) đã mô hình hóa từ 20/10/2026 (§7.3); trường hợp cọc mới/kỳ 3 tháng (TH1) vẫn chờ chốt → F040.D |
| `Hop_dong_*.pdf` (2 mẫu) | Mã `HĐKH-TH01-P302-2026-001`; số người/xe; ngày nhận phòng; cọc 1 tháng; **chỉ số bàn giao điện/nước**; biểu phí: điện 4.000 đ/kWh, nước & dịch vụ chung **120.000 đ/người**, internet 100.000/phòng, xe máy 0, xe đạp điện 150.000, xe điện 400.000; thông báo ngày 25, hạn 25–30 tháng trước kỳ. ~~Phạt 200.000 đ/ngày trễ~~ — **gỡ ngày 20/10/2026: không chứng minh được trong 2 PDF** (DECISIONS_ANSWERS §IV.2) | OCR-CON mô phỏng đúng cấu trúc mẫu đồng bộ (13 field, map biểu phí Điều 4); thư viện mẫu OCR đặt tên theo 2 PDF | Nước tính theo **người** (mẫu) vs theo **m³ công tơ** (SRS F020) → D-03; kỳ thông báo 25 / hạn 30 vs kỳ 01 / hạn 10 của dataset demo; không đưa mức phạt vào hệ thống khi chưa có điều khoản xác minh |
| `Hoá đơn tiền nhà tháng 9…xlsx` | Mỗi phòng: giá niêm yết, giá QL, giá hiện tại, cọc, ngày ở/ngày DV (prorate theo ngày), nợ cũ, thu khác, số người, điện/nước/mạng (CS cũ–mới, SL, đơn giá); sheet *BÁO CÁO CHECK THU TIỀN* (cần đóng / đã đóng / công nợ / Đủ–Thừa–Chưa TT); *cập nhật thu tiền* theo quản lý (DT phải thu, thực thu, phá HĐ, tỷ lệ %) | INV-01/02/03, PAY-01/02 có cùng khái niệm (tổng, đã thu, còn nợ, trạng thái, theo QL) | “Nợ cũ” gộp vào hóa đơn kỳ sau (Excel) vs công nợ tách theo hóa đơn (SRS F031); “Thừa” (thu trước) và “phá HĐ” chưa có trong dataset → F031.D/F048.C |
| `BÁO CÁO KINH DOANH THÁNG 8.xlsx` + `báo cáo.xlsx` | Báo cáo tổng theo nhóm nhà T/S/G: tổng DT, cọc phòng mới, cọc khách bỏ, hoàn cọc, phòng phá HĐ/mới/trống, DT tiền phòng, DT điện/nước…; danh mục báo cáo mong muốn: dòng tiền (gồm cọc) vs kinh doanh (không gồm cọc/hoàn cọc/mua sắm), dự kiến LN, LN/vốn, LN/tài sản, biên lợi nhuận tiền nhà, chi phí giá vốn/cố định, HS thực tế vs tạm tính; lọc theo thời gian/tòa/khu vực/NVVH/trưởng phòng | RPT-01 “Doanh thu thuộc kỳ vs dòng tiền” (F048.B) và “Điều chỉnh/loại trừ cọc” (F048.C) đúng hướng; RPT-02 so sánh tòa/nhóm/kỳ | **Đã làm ở §6 (CR-RPT-01):** sổ cọc, mua sắm, 2 chế độ Tổng/Kinh doanh, nhóm nhà. LN/vốn, LN/tài sản vẫn ngoài 52 nhóm (gần F044.D sổ vốn góp) → CR riêng nếu khách yêu cầu |
| `Danh sách mã HĐ điện nước mạng.xlsx` | Mã HĐ EVN/nước/mạng theo tòa, tiền theo tháng, tên chủ HĐ | Thêm `evnCode/waterCode/netCode` (mask) vào tòa; hiển thị BLD-02 và METER-01 › Đối chiếu | Khớp F020.D; số liệu tháng chưa nhập |
| `BẢNG DỰ KIẾN LỢI NHUẬN…xlsx` | Điện thanh toán chủ nhà 2.500 đ/kWh (mua) vs thu khách 4.000 đ/kWh | Chưa thể hiện chênh lệch giá điện mua/bán | Thuộc F036/F048 → ghi nhận, cần chốt đơn giá mua (D-03) |
| `sổ sửa chữa tháng 8.xlsx` | Ngày, tòa, phòng, nội dung, **tiền công / mua vật tư**, bên chi (Cty/Khách); lương kỹ thuật = cứng + thâm niên + tiền công theo bảng kê | EXP-01 nhóm “Sửa chữa, bảo trì” một dòng/khoản | Tách tiền công/vật tư và “bên chi = khách” (thu lại) chưa có → F034.B import mẫu chi phí |
| Mã tòa/phòng thực tế | Tòa `T17/G1/S32`, phòng `101T17`, nhóm nhà T/S/G theo trưởng phòng | Dataset demo dùng mã giả `TH-CG`, `CG-101` | Giữ dữ liệu giả theo SRS §2; quy ước mã thật áp dụng khi nhập dữ liệu đầu kỳ (F052.B) |

## 6. CR-RPT-01 — Bổ sung 2 báo cáo theo mẫu khách vào các gói (20/10/2026)

Yêu cầu: “Cập nhật các gói có thêm cả báo cáo. 2 báo cáo cần nhất là doanh thu theo từng tòa và báo cáo kinh doanh”, mẫu `docs/G1.31.8.26.xlsx` và `docs/bao_cao/BÁO CÁO KINH DOANH THÁNG 8.xlsx`.

### 6.1 Màn bổ sung (ngoài 39 màn SRS, đánh dấu `cr`)

| Màn | Mẫu nguồn | Nội dung |
| --- | --- | --- |
| **RPT-04 · Báo cáo doanh thu theo tòa** | `G1.31.8.26.xlsx` › sheet *BÁO CÁO THÁNG 8* | Đúng thứ tự dòng mẫu: tổng doanh thu, cọc phòng mới / khách bỏ / hoàn cọc (kèm phòng), số phòng phá HĐ / mới / trống, DT tiền phòng, 7 dòng DT dịch vụ, giá vốn (thuê nhà, mua sắm, giá gốc DV 6 dòng), chi phí vận hành (11 dòng lương/VP), chi phí bán hàng phát sinh, CPBH, TCP, LNG, LNR, 13 tỷ lệ; **bảng chia cổ phần** (tỷ lệ, vốn, LN gộp, LN ròng, tổng nhận) |
| **RPT-05 · Báo cáo kinh doanh tháng** | `BÁO CÁO KINH DOANH THÁNG 8.xlsx` › *BÁO CÁO TỔNG / BÁO CÁO KINH DOANH / BC DT … NHÀ G* | Ma trận chỉ tiêu × (TỔNG + từng tòa hoặc nhóm nhà); chế độ **Báo cáo kinh doanh** (loại cọc phòng mới & mua sắm thiết bị) và **Báo cáo tổng** (gồm cả hai) — đúng chênh lệch giữa 2 sheet mẫu (371.850.000 = cọc mới; 35.380.000 = mua sắm) |

Cả hai đọc chung `TH.calc.pnl` (`js/pnl.js`) → tổng các tòa = cột TỔNG (đã kiểm tra). Mục lục và kiểm đếm mapping vẫn đếm 39 màn SRS; 2 màn CR hiển thị riêng.

### 6.2 Phân gói (cộng dồn) — dùng lại increment §5A, không thêm mã mới

| Gói | RPT-04 | RPT-05 | Increment |
| --- | --- | --- | --- |
| **A** | Toàn bộ báo cáo theo mẫu + bảng chia cổ phần + 13 tỷ lệ; bảng phân bổ chi phí chung **nhập tay theo kỳ**; xuất Excel 3 sheet (báo cáo, chia cổ phần, nguồn số liệu), in/PDF | Ma trận TỔNG + từng tòa, 2 chế độ, 13 tỷ lệ; xuất Excel (kinh doanh, tổng, từng nhóm nhà) | F045.A, F046.A (cập nhật) |
| **B** | Bấm từng dòng → chứng từ nguồn (hóa đơn, cọc, chi phí, hợp đồng, phòng, lương); đối chiếu doanh thu mẫu với thu thực/công nợ | Xu hướng 6 kỳ DT / LNG / LNR | F045.B, F048.B, F046.B |
| **C** | Cột snapshot duyệt kỳ + sai lệch; rule phân bổ PB-01 (theo số phòng) có version, lương QL/trưởng nhóm kéo từ bảng lương | Gộp theo nhóm nhà, cột TỔNG kỳ trước, cảnh báo biên LNR/DT < 10% | F045.C, F043.C, F046.C |
| **D** | Đối chiếu 2 kỳ trước (cả tỷ lệ); khóa kỳ & chốt phiên bản | Mẫu báo cáo có version (mẫu khách T8 / rút gọn HĐQT); khóa kỳ & chốt | F045.D, F048.D, F046.D |

Mô tả F045.A/B và F046.A/C trong bảng so sánh 52 chức năng đã cập nhật theo mẫu; ô thay đổi có nhãn **CR**, tooltip giữ nguyên văn SRS (`f.srs`). Phần cập nhật nằm ở `js/reports-cr.js` để không bị ghi đè khi chạy lại `tools/extract-srs.js`.

> ⚠ **Cần khách/PM chốt:** đưa đủ LNG/LNR theo mẫu vào gói A là mở rộng so với SRS (§5A F048.A chỉ có “lãi dòng tiền tạm tính”; F043.C/F048.D mới có LN gộp/ròng theo rule). Mockup giữ **giá 4 gói không đổi**. Nếu khách muốn giữ ranh giới cũ, chỉ cần chuyển LNG/LNR và bảng chia cổ phần sang gate F043.C — không đổi dữ liệu.

### 6.3 Quy tắc tính & giả định (DRAFT, cần khách xác nhận)

| # | Quy tắc trong mockup | Căn cứ mẫu | Chờ chốt |
| --- | --- | --- | --- |
| R-01 | Tổng doanh thu = DT tiền phòng + DT dịch vụ (hóa đơn **đã xác nhận** của kỳ) + cọc phòng mới + cọc khách bỏ − hoàn cọc | G1: ghi chú “DT TRÊN HĐ − HOÀN CỌC” | Mẫu lấy *tổng đã đóng* (dòng tiền), mockup lấy hóa đơn của kỳ (dồn tích) để tổng = tổng dòng; phần “Đối chiếu dòng tiền” (B) hiện chênh lệch |
| R-02 | Phí dịch vụ chung của hợp đồng chia đều 3 dòng **vệ sinh / thang máy / máy giặt** | Sheet mẫu: 3 dòng này bằng nhau từng tòa (G1: 1.792.258 × 3) | Có tách biểu phí riêng từng dịch vụ không |
| R-03 | GV = tiền thuê nhà + mua sắm thiết bị + giá gốc DV (điện, nước, mạng, rác, môi trường, bảo trì thang máy); LNG = DT − GV | G1: 61.195.068 = 48.000.000 + 12.595.068 + 300.000 + 300.000 | — |
| R-04 | CPBH = 10 dòng lương + thuê & DV văn phòng + marketing/hoa hồng + sửa chữa + chi phí khác; TCP = GV + CPBH; LNR = DT − TCP | G1: CPBH 8.325.963; LƯƠNG/CPBH 0,477; HH/CPBH 0,441 | — |
| R-05 | Chi phí chung toàn công ty (quản lý tổng, TP vận hành, NV nguồn, NVKD, kế toán, sửa chữa, bảo vệ, VP, marketing chung) chia về tòa theo **số phòng / tổng phòng** (dataset: 360 phòng) | Tỷ lệ phân bổ VP, quản lý tổng giữa các tòa trong mẫu ≈ tỷ lệ số phòng | Tiêu thức (số phòng hay doanh thu); danh mục khoản chung |
| R-06 | Lương quản lý tòa = lương HS theo phòng của QL tòa (công thức SAL-01, DT = D của tòa theo §7.3); lương trưởng nhóm = số phòng × 10.000 đ | Mẫu ≈ 110–120 nghìn/phòng | Lương cứng QL nằm ở chi phí chung hay tòa |
| R-07 | Chỉ cộng chi phí **đã duyệt**; khoản chờ duyệt (vd tiền thuê nhà kỳ 10) báo trong cảnh báo, chưa tính | F034 UAT “Báo cáo chỉ cộng chi phí đã duyệt” | Có tính tiền thuê nhà theo hợp đồng (dồn tích) dù chưa chi |
| R-08 | Bảng chia cổ phần: **Vốn = tỷ lệ × tiền thuê nhà kỳ**; LN gộp/ròng = tỷ lệ × LNG/LNR; **Tổng nhận = Vốn + LN ròng** | G1: H3 = 10% × 48.000.000; M3 = H3 + J3 | Ý nghĩa cột “Vốn” (D-07) |
| R-09 | Phòng trống = phòng không ở trạng thái đang thuê cuối kỳ (theo lịch sử phòng); phòng mới = HĐ bắt đầu trong kỳ; phá HĐ = cọc bị giữ do vi phạm | Dòng 9–11 mẫu | Định nghĩa “phòng trống tháng 8” (cuối kỳ hay có ngày trống) |

### 6.4 Thay đổi dữ liệu mẫu (schema 5 — trình duyệt tự nạp lại)

- `db.deposits` (6 bút toán cọc: nhận cọc TX-201/TX-301/TX-202, phá HĐ TX-202, hoàn cọc CG-401, khách bỏ cọc CG-401).
- `db.costPools` (bảng phân bổ chi phí chung theo kỳ, kỳ 10 nháp) và `db.buildingGroups` (Nhóm nhà 1: Cầu Giấy – Đống Đa; Nhóm nhà 2: Thanh Xuân — tương ứng NHÀ T/S/G).
- Nhóm chi mới: mua sắm thiết bị, phí thu rác, bảo trì thang máy, hoa hồng/marketing; hóa đơn điện nước tổng tách phần điện/nước; dòng phí cố định trên hóa đơn mang mã phí.
- **Tổng hóa đơn, phiếu thu và mọi số đã QA trước đó không đổi** (vd INV-2610-CG202 = 6.069.800 ₫).

## 7. CR-BLD-01 — Cập nhật theo note.md: chủ nhà, tòa nhà, mốc thu 5/10/15 (20/10/2026)

Nguồn: `note.md` (đã cập nhật theo `ques.md` — trả lời 9 câu hỏi + yêu cầu giao diện), `docs/Hợp đồng thuê nhà 2026(Mẫu) tùng sói.doc`, `docs/Thông tin nhà.xlsx`. Nguyên tắc xếp gói đã chốt với PM: **bám tầng SRS** — mục trùng increment §5A giữ đúng tầng; mục SRS chưa có đưa vào gói A, đánh dấu CR. Không thêm màn, không đổi giá.

### 7.1 Thay đổi giao diện

| Màn | Trước | Sau |
| --- | --- | --- |
| `OWN-01` | Cột tên kèm địa chỉ | Danh sách tóm tắt: mã, họ tên, liên hệ, số tòa, trạng thái + *Xem chi tiết* |
| `OWN-02` | Tổng quan + 3 tab gate; sửa bằng popup | 4 tab theo note: **Thông tin chung** (trường theo mẫu HĐ: CCCD, ngày/nơi cấp, hộ khẩu, STK nhận tiền) · **Hợp đồng thuê** · **Tòa nhà liên quan** · **Tài liệu** (ảnh sổ đỏ ghi rõ tòa + GCN); giữ 3 tab gate cũ |
| `BLD-01` | Có cột khu vực, QL | Mã/tên, địa chỉ rút gọn, chủ nhà, số phòng, trạng thái (+ cảnh báo chưa PCCC) + *Xem chi tiết* |
| `BLD-02` | 3 tab | 8 tab: **Thông tin chung** · **Chủ nhà & hợp đồng** · **Nhân sự** (4 vai trò) · Phòng · **Tài sản** (2 bảng) · **Hồ sơ & minh chứng** (PCCC, ĐKKD, sổ đỏ, tài liệu) · **Vận hành & kết quả** (từ–đến, HS, lợi nhuận) · **Lịch thanh toán** |
| Sửa thông tin | Popup Sửa/Lưu | Mỗi nhóm có **Chỉnh sửa / Lưu thay đổi / Hủy** tại chỗ (`TH.section`); đổi tab, rời trang, đổi kỳ/tòa khi còn thay đổi → hộp thoại *Lưu / Bỏ thay đổi / Tiếp tục chỉnh sửa*. Danh sách nhiều dòng (tài sản, phân công, kỳ trả) dùng popup có *Lưu thay đổi / Hủy*. Hiệu suất, lợi nhuận, số còn lại không sửa tay — tính từ dữ liệu nguồn |
| HĐ thuê tòa | `ownerRent` một con số | `db.leases` dùng chung OWN-02 & BLD-02; lưu tạo phiên bản (F003.B); đổi chủ nhà → kết thúc HĐ cũ, tạo HĐ mới |

### 7.2 Xếp gói

| Hạng mục | A | B | C | D |
| --- | --- | --- | --- | --- |
| Hồ sơ chủ nhà | F001.A — trường theo mẫu HĐ (CR) | F001.B kiểm trùng | F001.C audit | F001.D phiên bản |
| HĐ thuê tòa | F003.A — giá thuê, cọc, giữ giá, thời hạn, người giới thiệu ≠ người nhập (CR) | F003.B lịch sử HĐ/chủ | F003.C nhiều vai trò | F003.D theo thời gian |
| Hồ sơ tòa, PCCC/ĐKKD, vận hành từ–đến, tài sản 2 nhóm | F004.A (CR) | F004.B công suất | F004.C lịch sử phân công | F004.D snapshot kỳ |
| Tài liệu (sổ đỏ, HĐ, PCCC, ĐKKD) | F013.A tải lên | F013.B tìm | F013.C quyền xem | F013.D phiên bản |
| Nhân sự | F006.A — NV vận hành chính | F006.B — Trưởng nhóm, NV vệ sinh, NV kỹ thuật, nhiều người | F006.C hiệu lực ngày | F006.D tách vai trò DT |
| Lịch thanh toán chủ nhà | F036.A nhập tay kỳ | F036.B sinh lịch từ HĐ | F036.C đã trả / còn lại / quá hạn | F036.D đối chiếu với chi phí |
| Hiệu suất | F033.A — A, HS (chưa tách DV), tạm tính & thực tế, lấp đầy riêng | F033.B trừ A×B | F033.C cộng C | F033.D version công thức |

Ô thay đổi trong bảng so sánh 52 chức năng có nhãn **CR** (tooltip giữ nguyên văn SRS). Patch nằm ở `js/bld-cr.js`. Quyền: sửa HĐ thuê tòa, thông tin chủ nhà (có STK) và lịch trả chỉ Admin/Kế toán (`lease.edit`); Quản lý tòa xem được, sửa hồ sơ tòa/tài sản/phân công như trước.

### 7.3 Hiệu suất theo mốc 5/10/15 (thay thế cách tính cũ)

- **A** = M5 × 100% + (M10 − M5) × 90% + (M15 − M10) × 70%, M = lũy kế phiếu thu **đã xác nhận** theo ngày thực nhận của hóa đơn kỳ; thu sau 15 và ngoài kỳ = 0.
- **B** = dịch vụ phải thu ÷ doanh thu phải thu, gộp theo tòa (trước đây trừ theo từng hóa đơn).
- **C** = tiền phòng phát sinh đã thu đủ (`db.arisingRent`, cũng cộng vào DT tiền phòng ở RPT-04/05) + khoản khách bỏ cọc (`db.deposits` type forfeit).
- **D** = A − A × B + C; **HS** = D ÷ tổng giá niêm yết các phòng của tòa (mọi trạng thái). Tỷ lệ lấp đầy hiển thị riêng.
- **Thực tế** = D sau khi qua ngày 15 của kỳ; **tạm tính** = mọi khoản đã xác nhận tới lúc xem, chưa áp trọng số (gồm thu sau 15), cùng B và C.
- Hiển thị theo gói: A chỉ A (nhãn “chưa tách DV”), B thêm B, C thêm C. Bảng lương nháp và dòng lương QL ở RPT-04 luôn dùng D đầy đủ.
- Số mẫu kỳ 09/2026, Cầu Giấy: M = 12.115.000 / 28.050.400 / 33.413.000 → A 30.210.680; B 18,83%; C 2.000.000 (khách bỏ cọc CG-401); D 26.521.524; niêm yết 36.700.000 → **HS 72,3%** (tạm tính 79,3%).

### 7.4 Giả định cần khách chốt (G-01…G-10)

| # | Mockup đang dùng | Cần chốt |
| --- | --- | --- |
| G-01 | DT M5/M10/M15 là **lũy kế** đến ngày 5/10/15 | Định nghĩa DT Mx |
| G-02 | Tạm tính = đã thu tới lúc xem, chưa áp trọng số | Định nghĩa trạng thái tạm tính |
| G-03 | Cọc mới, khách đóng 3 tháng chưa điều chỉnh mốc | Công thức điều chỉnh từng trường hợp (ques.md §8.3) |
| G-04 | Lợi nhuận tòa tạm lấy LNG/LNR mẫu G1 (CR-RPT-01) | Định nghĩa lợi nhuận, khoản thu/chi, kỳ báo cáo (note §5.3) |
| G-05 | Diện tích một con số m², nhãn “loại DT chờ chốt” | Đất / xây dựng / tổng sàn |
| G-06 | Tình trạng Mới / Trung bình / Cũ, chọn tay | Tiêu chí phân loại |
| G-07 | PCCC, ĐKKD: Đã có / Chưa có + tệp; chủ thể ĐKKD để trống | Tài liệu PCCC cụ thể; ai đứng tên ĐKKD |
| G-08 | Không giới hạn số người mỗi vai trò; một người được phụ trách nhiều tòa (theo file Thông tin nhà) | Giới hạn & quy tắc nhiều tòa |
| G-09 | Tài sản: tên, số lượng, đơn vị, vị trí, tình trạng, ngày, giá trị (đầu tư thêm), ghi chú | Danh sách trường chính thức |
| G-10 | Lịch trả: chu kỳ & hạn lấy từ HĐ (mẫu: 03 tháng/lần, ngày 01–10 tháng đầu kỳ); không nhắc lịch tự động | Có cần nhắc lịch; ngày bắt đầu HĐ và bản HĐ đính kèm (đã thêm vào mockup) có đúng nhu cầu |

### 7.5 Dữ liệu mẫu (schema 6 — trình duyệt tự nạp lại)

- Chủ nhà: loại cá nhân/pháp nhân, CCCD (mask), ngày/nơi cấp, hộ khẩu, STK nhận tiền.
- Tòa: m², tình trạng, thang máy, GCN, PCCC (Thanh Xuân *chưa có*), ĐKKD (Đống Đa *chưa có*), vận hành từ–đến.
- `db.leases` (4 HĐ, 1 đã kết thúc khi đổi chủ Đống Đa), `db.landlordPays` (10 kỳ; kỳ 10: CG đã trả, DD còn 25 tr quá hạn, TX chưa trả), `db.assets` (16), `db.bldDocs` (12), `db.arisingRent` (2).
- Nhân sự thêm 2 NV vệ sinh, 2 NV kỹ thuật; phân công theo 4 vai trò (một NV kỹ thuật phụ trách cả 3 tòa).
- Ảnh hưởng số cũ: lương QL dùng D → LNR tổng kỳ 09 (chế độ Tổng) 7.579.599 → **7.537.599**; tiền phòng phát sinh cộng vào DT tiền phòng TX kỳ 08 và CG kỳ 10. Hóa đơn, phiếu thu, công nợ không đổi (INV-2610-CG202 = 6.069.800 ₫).

## 8. Áp dụng câu trả lời 20/10/2026 (DECISIONS_ANSWERS + QA_ANSWERS)

Nguyên tắc: áp vào mockup các mục mà file trả lời ghi **“có thể áp dụng ngay cho mockup (vẫn gắn PROPOSED)”** (mục V) và các lỗi QA chỉ ra; mục cần chữ ký vẫn để `DRAFT`, chỉ hiển thị cảnh báo/phát hiện, không biến thành quy tắc production. Dữ liệu mẫu nâng lên **schema 7**.

### 8.1 Trạng thái từng mã

| Mã | Trả lời (tóm tắt) | Đã làm trong mockup | Trạng thái |
| --- | --- | --- | --- |
| G-01 | M5/M10/M15 = thu lũy kế đã xác nhận theo ngày thực nhận; thu sau 15 không vào A nhưng vẫn giảm công nợ | Giữ công thức; ghi rõ ở chú thích HS, PAY-02, RPT-02 | PROPOSED |
| G-02 | Tạm tính = [thu đến T × (1−B) + C] ÷ niêm yết, không trọng số; thực tế sau 15, ghi “chưa khóa kỳ”; lấp đầy = phòng đang thuê ÷ phòng cho thuê được | Nhãn “Tạm tính đến 20/10/2026 — chưa áp trọng số”; trạng thái *Thực tế · chưa khóa kỳ / đã khóa kỳ*; lấp đầy loại phòng đang sửa khỏi mẫu số; gói A đổi tên thành **“Chỉ số sơ bộ (chưa tách DV)”** | PROPOSED |
| G-03 | TH1 (cọc mới, đóng 3 tháng) có căn cứ trong tài liệu lương; thuật toán chờ duyệt | **Phát hiện** kỳ có cọc mới và hiện dòng “TH1 — cần chuẩn hóa, chờ chốt” trong bảng tính A→D; **không áp** điều chỉnh | DRAFT |
| G-04 | Tách P&L kinh doanh và dòng tiền; chi phí thuê chủ nhà theo tháng sử dụng | RPT-05 chế độ **Kinh doanh** = P&L đề xuất; chế độ **Tổng** = tái hiện mẫu; BLD-02 › Vận hành hiện song song 2 cột | PROPOSED |
| G-05 | Ba ô diện tích đất / xây dựng / tổng sàn; thiếu chứng từ → “Chưa cập nhật” | Đã tách 3 trường, hiển thị “Chưa cập nhật” khi trống | PROPOSED |
| G-06 | Danh mục Mới / Khá mới / Trung bình / Cũ / Rất cũ / Chưa đánh giá; nhập tay + ngày, người, ghi chú | Đã áp | PROPOSED |
| G-07 | PCCC: loại, số, ngày cấp, cơ quan, hiệu lực, chủ thể, tệp; ĐKKD: chủ thể thực tế, MST, cơ quan, ngày; 4 trạng thái | Đã áp (`TH.DOC_STATES`); bắt buộc pháp lý theo loại tòa **chưa xác minh** | DRAFT |
| G-08 | Nhiều người/vai trò, một người nhiều tòa; Chính/Phụ, từ–đến, trạng thái; một người chính mỗi vai trò | Badge Chính/Phụ + Đang hiệu lực cho mọi vai trò; gán “Chính” đóng người chính cũ của **cùng vai trò** | PROPOSED |
| G-09 | Trường tài sản đầy đủ + nhật ký sửa/di chuyển/thanh lý | Thêm bên sở hữu/chịu chi, nguồn chứng từ, người cập nhật; đầu tư thêm có ngày mua, nguyên giá, thời hạn sử dụng; nhật ký trong popup “Sửa” (ghi cả di chuyển vị trí) | PROPOSED |
| G-10 | Lịch từ HĐ + phụ lục; trạng thái duyệt, đã trả, còn lại, chứng từ; nhắc 7 ngày / 3 ngày / đến hạn / quá hạn, bật tắt được | Cột *Duyệt chi* (C); card **Nhắc lịch trả chủ nhà** (B, mô phỏng) với 4 công tắc; tiêu đề lịch ghi kỳ HĐ, bản HĐ, số phụ lục | PROPOSED |
| R-01 | Tách DT kinh doanh và dòng tiền; cọc mới/hoàn cọc chỉ vào dòng tiền | Chế độ Kinh doanh loại cọc mới **và hoàn cọc**; dòng “Doanh thu kinh doanh tháng”; chế độ Tổng giữ nhãn mẫu + chú thích “gồm dòng tiền cọc” | PROPOSED |
| R-02 | Chỉ chia đều 1/3 khi là gói phí chung có quy tắc | Giữ chia đều cho dataset demo (mẫu G1); chưa có `allocation_rule` theo hợp đồng | DRAFT |
| R-03 | Mua sắm thiết bị ra khỏi P&L chuẩn (tài sản/dòng tiền) | Chế độ Kinh doanh loại mua sắm; khấu hao chưa có chính sách | PROPOSED |
| R-04 | Giữ TCP = GV + CPBH, LNR = DT − TCP | Không đổi | Có căn cứ |
| R-05 | Giai đoạn A nhập tay phân bổ; tự phân bổ theo phòng là đề xuất | Không đổi (A nhập tay, C rule PB-01 theo số phòng) | PROPOSED |
| R-06 | Lương HS vào chi phí trực tiếp tòa; 10.000 đ/phòng chưa xác minh | Không đổi; vẫn DRAFT | CHƯA XÁC MINH |
| R-07 | Chi phí thuê chủ nhà thuộc kỳ dù phiếu chi chưa duyệt (nhãn dự kiến) | Chế độ Kinh doanh cộng **tiền thuê dự kiến theo HĐ thuê tòa** khi tháng chưa có chi phí đã duyệt; cảnh báo đổi nội dung tương ứng | PROPOSED |
| R-08 | Vốn/Tổng nhận trong G1 chỉ là công thức tái hiện mẫu | Ghi rõ “Công thức tái hiện mẫu G1 — không phải lệnh chi/hoàn vốn” ở RPT-04 và file Excel | CHƯA XÁC MINH |
| R-09 | Phòng trống cuối kỳ không gồm phòng đang sửa; thêm số ngày trống | Phòng đang sửa không còn tính là phòng trống (ghi chú trên dòng); **số ngày trống chưa làm** | PROPOSED (một phần) |
| D-01 | Ma trận field bắt buộc tối thiểu | Chưa đổi form — chờ duyệt ma trận | DRAFT |
| D-02 | 85% chỉ là ngưỡng demo | Không đổi | Có căn cứ (mẫu) |
| D-03 | Đơn giá theo tòa/biểu phí/ngày hiệu lực; giá mua ≠ giá bán; nước theo người hay m³ | Xem dòng D-03 §1; hóa đơn chưa tính theo người | PROPOSED (một phần) |
| D-04 | Công thức A/B/C/D, giữ bước tính | Đã có; B lưu độ chính xác đầy đủ, làm tròn một lần khi hiển thị | Có căn cứ (trừ TH1) |
| D-05 | Không gửi thật khi chưa có provider | Không đổi (SIMULATED) | PROPOSED |
| D-06 | Mâu thuẫn ÷100 và ÷90 trong tài liệu lương | SAL-01 hiện cảnh báo mâu thuẫn; bản nháp vẫn dùng ÷90, **không dùng để trả lương** | **BLOCKER** (QA-B02) |
| D-07 | Lợi nhuận phân phối cần phê duyệt; ≤0 không chi | Không đổi (DRAFT) | PROPOSED |
| D-08 | Không có Excel báo giá → không xác nhận giá | Landing và drawer ghi “chưa đối chiếu Excel báo giá” | CHƯA XÁC MINH (QA-B01) |
| D-09 | Bắt buộc RTM | `#/demo/mapping` › **Xuất RTM (.xlsx)**: 208 dòng (52 nhóm × 4 gói) gồm mô tả, SRS gốc nếu CR, màn, route, vai trò, test case, kết quả kỹ thuật, trạng thái nghiệp vụ | PROPOSED (định dạng) |
| PKG / CR-RPT-01 / CR-BLD-01 | Thay đổi phạm vi so với §5A phải được PM duyệt và đánh giá ảnh hưởng giá | Giữ ghi chú CR; RTM ghi “PROPOSED — CR chờ PM duyệt” | Chờ PM |

### 8.2 Số liệu thay đổi (schema 7)

| Chỉ tiêu | Trước | Sau | Lý do |
| --- | --- | --- | --- |
| RPT-05 *Kinh doanh* kỳ 09 — doanh thu / LNR | 81.300.600 / 10.737.599 | **87.500.600 / 16.937.599** | Không trừ hoàn cọc 6.200.000 (R-01); vẫn loại mua sắm 3.200.000 |
| RPT-05 *Kinh doanh* kỳ 10 — LNR | 44.255.000 | **4.755.000** | Cộng tiền thuê chủ nhà dự kiến theo HĐ 39.500.000 (R-07) |
| RPT-05 / RPT-04 *Tổng (theo mẫu)* kỳ 09 — LNR | 7.537.599 | 7.537.599 | Không đổi |
| Số phòng trống (Tổng) | gồm phòng đang sửa | kỳ 09 và 10: 2 phòng | R-09 |
| Lấp đầy Đống Đa kỳ 10 | 5/6 = 83% | 5/5 = 100% | DD-302 đang sửa ra khỏi mẫu số (G-02) |
| Hiệu suất CG kỳ 09 | 72,3% | 72,3% | Không đổi (A, B, C, D giữ nguyên) |

### 8.3 Chưa làm / ngoài phạm vi bản HTML

- G-03 thuật toán TH1, R-09 số ngày phòng trống, D-01 ma trận field, D-03 tính hóa đơn nước theo người, R-02 `allocation_rule` theo hợp đồng — chờ quyết định có ví dụ số.
- Kiểm thử in/PDF thật, bàn phím/screen reader, Firefox/Safari, phân quyền ở backend (QA-P01…P03) — cần người kiểm và môi trường thật.
- Checklist **88 frame Figma** (QA-B04) — không thuộc bản HTML này; phải lập riêng.

## 9. CR-CUS-01 — Thông tin khách hàng (khách thuê) theo note.md §8 (20/10/2026)

> §9.1–9.4 ghi nhận bản schema 8 trước khi áp bộ trả lời. **§9.5 bên dưới thay thế các giả định K-01…K-09 cũ** về TPVH, điều khoản, phí, cọc và lịch sử liên hệ; không áp các điều khoản của một mẫu cho mọi HĐ.

Nguồn: `note.md` §8 và hai mẫu HĐ khách thuê `docs/tenplate/Hop_dong_thue_phong_demo_day_du.pdf`, `docs/tenplate/Hop_dong_khach_thue_P302_TH01_demo_dong_bo.pdf`. Các điểm lấy từ mẫu:
- **Gia hạn:** tự gia hạn 12 tháng nếu không báo trước 30 ngày (Điều 3.4).
- **Cọc:** hoàn trong 10 ngày sau bàn giao; mất cọc khi phá HĐ (Điều 4.3, 7.1).
- **Biểu phí theo người/phòng/xe:** điện 4.000/kWh, nước 120.000/người, internet 100.000/phòng, dịch vụ chung 120.000/người, xe máy 0, xe đạp điện 150.000/xe, xe điện SM 400.000/xe.

### 9.1 Thay đổi giao diện

| Màn | Nội dung |
| --- | --- |
| `CUS-01` | Danh sách tổng quan theo hồ sơ thuê. **Cột:** Mã phòng / Mã tòa (kèm tên khách), Trưởng khu vực, NV vận hành, Công nợ (đỏ khi quá hạn), Liên kết Zalo, Trạng thái nhiều tầng, *Xem chi tiết*. **Bộ lọc:** đang thuê / sắp hết HĐ (35 ngày) / phá HĐ / hoàn cọc / còn nợ / quá hạn / chưa liên kết Zalo. **Khác:** 4 KPI, xuất công nợ .xlsx |
| `CUS-02` | **Tiêu đề và đầu trang:** tiêu đề **“Mã phòng — Mã tòa”**; phụ đề tên khách, NV vận hành, công nợ; trạng thái chính + nhãn phụ ở đầu trang. **Tab:** *Thông tin lưu trú · Hợp đồng · Tài chính*, giữ thêm 3 tab SRS *Tài liệu · Lịch sử liên hệ · Phiên bản định danh* |
| Lưu trú | **Nhóm sửa được** *Thông tin khách hàng* (thêm **nghề nghiệp**, thường trú, ghi chú; giấy tờ mask chỉ đọc; lưu thì ghi lịch sử liên hệ). **Khối *Thời gian hợp đồng* (chỉ đọc):** bắt đầu, kết thúc, thời hạn, số người; badge **“Hợp đồng lần đầu / Gia hạn lần thứ N”** tách riêng khỏi trạng thái thuê; dòng thời gian ký → gia hạn → kết thúc. **Bảng *Phương tiện*:** thêm/sửa/xóa từng xe gồm loại, biển số mask, màu, ghi chú |
| Hợp đồng | **Nhóm sửa được:** *Bảng giá dịch vụ theo hợp đồng* gồm 7 loại phí, mỗi dòng có cách tính, đơn giá, số lượng và ghi chú; *Ghi chú hợp đồng*. **Thẻ phụ:** File hợp đồng (tải lên mô phỏng); *Đọc bảng giá từ hợp đồng* (nhập tay / tự đọc); lịch sử bảng giá. Chọn được HĐ cũ khi khách có nhiều HĐ |
| Tài chính | **KPI:** phải thu, đã thu (kế toán xác nhận), còn nợ, quá hạn. **Bảng hóa đơn theo kỳ:** đã thu, chờ xác nhận, còn nợ, quá hạn. **Thẻ *Tiền cọc & hoàn cọc*:** các bước *Chờ bàn giao → Đối chiếu → Duyệt hoàn → Đã hoàn* hoặc *Mất cọc*. **Hộp “Cần làm rõ”:** danh sách khách hoà |
| `CON-01/02/03`, `RPT-02`, menu | Ngưỡng hết hạn **35 ngày**. CON-01 thêm bộ lọc *Đã kết thúc / Phá HĐ*. CON-03 chọn được 30/35/45/60/90 ngày (mặc định 35). RPT-02 chỉ đếm HĐ đang hiệu lực |

Bảng giá lưu **theo từng HĐ**:
- **Dòng phí cố định:** đồng bộ sang bộ phí lập hóa đơn (F015).
- **Điện/nước:** `buildInvoice` lấy đơn giá trong bảng giá của HĐ. Nước theo người/phòng không cần chỉ số.
- **Phạm vi áp dụng:** chỉ hóa đơn lập sau khi lưu; hóa đơn đã lập không đổi.
- **OCR:** không tự lưu và không tự lập hóa đơn (UAT F011/F012).

### 9.2 Xếp gói (bám tầng SRS như CR-BLD-01)

| Hạng mục | A | B | C | D |
| --- | --- | --- | --- | --- |
| Danh sách tổng quan, trạng thái, công nợ | F010.A, F031.A (CR) | F031.B quá hạn + xuất | — | F010.D phiên bản |
| Trưởng khu vực / NV vận hành | NV vận hành (F006.A) | Trưởng khu vực (F006.B) | — | — |
| Lưu trú: nghề nghiệp, xe, lần gia hạn | F010.A (CR) | F010.B kiểm trùng giấy tờ/biển số | F010.C log liên hệ | F010.D |
| File HĐ + đọc bảng giá | F013.A file; F012.A bảng giá nhập tay | F012.B tự đọc & map bảng giá | F012.C so khớp xe/người ↔ phí | F012.D log sửa tay |
| Bảng giá 7 loại phí | F015.A một bộ phí hiện hành | F015.B hiệu lực từ kỳ | F015.C preview tác động | F015.D lịch sử giá |
| Tài chính | F031.A | F031.B | F031.C phiếu điều chỉnh (hiển thị) | F031.D phân bổ phiếu thu (hiển thị) |
| Hoàn cọc / phá HĐ | A (CR — SRS chưa có increment) | | | |
| Nhắc hết hạn | F016.A 35 ngày | F016.B | F016.C | F016.D |

Số màn và mapping không đổi: 39 SRS + 2 CR, 52/52 nhóm, 156/156 increment.

### 9.3 Giả định cần khách chốt (K-01…K-09)

| Mã | Giả định trong mockup | Câu hỏi cho khách |
| --- | --- | --- |
| K-01 | “Trưởng khu vực” = vai trò **Trưởng nhóm** phân công theo tòa (BLD-02 › Nhân sự) | Có phải cấp TPVH theo khu vực (sơ đồ tổ chức) không? |
| K-02 | Mỗi hồ sơ có 1 trạng thái chính (Đang thuê / Phá HĐ / Đã kết thúc) + nhãn phụ (Sắp hết HĐ, Chờ bàn giao, Hoàn cọc đang xử lý/quá hạn, Đã hoàn, Mất cọc) | Hiển thị đa trạng thái như vậy có đúng không? |
| K-03 | “Hoàn cọc” gồm 4 bước *Chờ bàn giao → Đối chiếu (khấu trừ) → Duyệt → Đã hoàn*; hạn 10 ngày sau bàn giao; chỉ bước *Đã hoàn* ghi dòng hoàn cọc vào sổ | Ai duyệt? Khấu trừ gồm những khoản nào? Hoàn cọc là trạng thái “đang xử lý” hay “đã xong”? |
| K-04 | Phá HĐ = khách chấm dứt trước hạn → mất toàn bộ cọc (mẫu HĐ Điều 4.3/7.1) | Có trường hợp phá HĐ được hoàn một phần không? Điều kiện ghi nhận? |
| K-05 | 7 loại phí với cách tính: theo chỉ số, theo người, theo phòng, theo xe, theo kWh sạc. Dữ liệu mẫu giữ giá cũ (DV chung 150.000/phòng, gửi xe 120.000/xe) để số báo cáo không đổi | Phí thang máy và sạc xe điện tính thế nào (mẫu HĐ chưa có)? Xe máy 0đ có cần dòng riêng? |
| K-06 | Ngưỡng 35 ngày áp dụng toàn hệ thống (thay 45 ngày) | Đồng ý? |
| K-07 | Chưa dựng “danh sách khách hoà” | Tên danh sách, mục đích, các trường cần hiển thị? |
| K-08 | Biển số hiển thị dạng che một phần (29B1-•••.45); xe đạp điện không biển | Có cần mask biển số không? Cần thêm trường nào cho xe? |
| K-09 | Lần gia hạn: “mặc nhiên” (không báo trước 30 ngày) hoặc “ký phụ lục”; đếm theo số lần gia hạn của cùng HĐ | Gia hạn có tạo HĐ mới (số HĐ mới) hay giữ số HĐ cũ? |

### 9.4 Dữ liệu mẫu (schema 8 — trình duyệt tự nạp lại)

- **Khách:** thêm nghề nghiệp, thường trú, phương tiện. KH-005 khai 2 xe nhưng HĐ tính 1 xe, để demo so khớp F012.C.
- **HĐ:** thêm `renewals` (5 HĐ đã gia hạn 1 lần), `priceList` 7 dòng và `note`. CG-301 có dòng sạc xe điện theo kWh (chưa vào hóa đơn).
- **HĐ đã kết thúc:** thêm 3 HĐ và khách KH-016…018. Phần này thêm **sau** bước sinh hóa đơn, nên doanh thu, hiệu suất và P&L không đổi.

  | Khách | Phòng | Diễn biến | Trạng thái cọc |
  | --- | --- | --- | --- |
  | KH-016 | CG-401 | Kết thúc 31/08 | Đã hoàn 6.200.000 (COC-2609-01) |
  | KH-017 | TX-202 | Phá HĐ 15/07 | Mất cọc 4.000.000 (COC-2607-01) |
  | KH-018 | DD-302 | Bàn giao 28/09 | Đang đối chiếu, **quá hạn hoàn** từ 08/10 |

- **Đa trạng thái:** DD-102 (KH-008) vừa đang thuê, vừa sắp hết HĐ (26 ngày), vừa chờ bàn giao (đã báo chuyển đi 15/11).
- **Hồ sơ hoàn cọc:** dữ liệu mới `db.depositCases`. Bước *Xác nhận đã hoàn* thêm dòng `db.deposits` loại refund vào kỳ hiện tại; RPT-05 chế độ Tổng phản ánh, chế độ Kinh doanh không đổi.
- **Đối chiếu số liệu:** RPT-05 Kinh doanh kỳ 09 LNR 16.937.599; Tổng kỳ 09 7.537.599; Kinh doanh kỳ 10 4.755.000; HS CG kỳ 09 72,3%; INV-2610-CG202 6.069.800. Tất cả **không đổi**.

### 9.5 Áp dụng CR_CUS_ANSWERS (20/10/2026, schema 9)

Nguồn triển khai: [TIMEHOUSE_MOCKUP_CR_CUS_ANSWERS.md](TIMEHOUSE_MOCKUP_CR_CUS_ANSWERS.md). Đây là bộ đáp án **đề xuất cho mockup**, chưa phải xác nhận khách hàng. Các trạng thái dưới đây là trạng thái quyết định nghiệp vụ; kết quả QA kỹ thuật không đổi chúng thành APPROVED.

| Mã | Đã áp trong mockup | Trạng thái quyết định |
| --- | --- | --- |
| K-01 | Trưởng khu vực lấy phân công TPVH; Trưởng nhóm là vai trò riêng; thiếu TPVH hiện Chưa phân công | `PROPOSED` — cần xác nhận tên gọi và phạm vi phụ trách |
| K-02 | Một trạng thái vòng đời + nhãn kết thúc/thời hạn/bàn giao/cọc/nợ, tính theo từng HĐ | `PROPOSED` — bảng chuyển vòng đời đầy đủ chưa triển khai |
| K-03 | Hồ sơ cọc: bàn giao → đối chiếu → chờ duyệt → đã duyệt/chờ chi → thực chi/tất toán; có trả lại, chặn tự duyệt, mã giao dịch và chống ghi trùng | `PROPOSED`; SLA 10 ngày `SOURCE_REQUIRED`, chỉ demo ở HĐ có `terms.refundDays` |
| K-04 | Phá HĐ không tự ép mất cọc; mức giữ có số tiền/căn cứ/người duyệt; cho phép hoàn một phần | `PROPOSED`; chính sách mất cọc `SOURCE_REQUIRED / PENDING_APPROVAL` |
| K-05 | Danh mục 9 dòng, từng HĐ chọn dòng áp dụng; xe máy 0đ riêng; thang máy diễn giải trong DV chung; SM theo xe và sạc kWh tách riêng; OCR áp từ kỳ 11 | 7 dòng P302 có căn cứ theo bộ trả lời; thang máy/sạc `PENDING_APPROVAL` |
| K-06 | Cấu hình doanh nghiệp 35 ngày, Admin đổi tại SYS-01; CUS/CON/RPT/menu đọc cấu hình; không ghi đè mốc báo trước trong HĐ | `PROPOSED / PENDING_APPROVAL` — chưa có override nhóm tòa |
| K-07 | Chỉ hiện ghi chú khi bật ghi chú demo, chưa dựng danh sách nghiệp vụ | `BLOCKED_BY_REQUIREMENT` — cần tên, tiêu chí, quyền, nguồn, trường và tác động tài chính |
| K-08 | Xe có biển nullable, nhãn hiệu, khoảng đăng ký và trạng thái; kiểm trùng khoảng chồng lấn; xe đã xác nhận mới tính phí; mask khi tổng quan/xuất | `PROPOSED` — quyền backend và vai trò hạn chế xem chi tiết chưa có |
| K-09 | Phụ lục giữ mã HĐ; HĐ mới liên kết HĐ cũ và phiếu chuyển cọc; P302 không mặc nhiên gia hạn; gia hạn theo điều khoản có bằng chứng kiểm tra | `PROPOSED`; tự gia hạn `SOURCE_REQUIRED / PENDING_APPROVAL` |

**Dataset schema 9:** 18 khách, 19 HĐ (15 đang thuê + 4 đã kết thúc), 3 tòa, 18 phòng. TH.DATA_SCHEMA tăng 8 → 9; trình duyệt có schema cũ tự nạp seed mới. NV-013 TPVH phụ trách CG/DD; TX chưa phân công. KH-003 có HĐ-CG201/24 → HĐ-CG201/25 và phiếu PCC-2507-01, trạng thái cọc `transferred`. Không sinh thêm cọc mới cho hồ sơ cũ. KH-001 có xe SM chờ xác nhận; KH-018 → KH-010 cùng biển nhưng hai khoảng đăng ký liên tiếp không bị báo trùng.

**Bằng chứng QA:** [QA §8.3](TIMEHOUSE_MOCKUP_QA.md#83-chạy-lại-cr_cus_answers-schema-9--20102026), [kết quả máy đọc được](qa/schema9/results.json), [ảnh desktop/mobile](qa/schema9/). Luồng DD-302: khấu trừ 310.000 + 500.000, hoàn 3.990.000; Tổng kỳ 10 LNR 48.255.000 → 44.265.000; Kinh doanh giữ 4.755.000. Xác nhận lần hai vẫn một dòng refund. Thử thỏa thuận TX-202 giữ 1.000.000/4.000.000, duyệt hoàn 3.000.000 được (dữ liệu kiểm thử độc lập, không thay seed).

**Phần chưa triển khai / chưa nghiệm thu:**

- Prorate theo ngày hiệu lực: mới có hiệu lực từ kỳ, chưa có thuật toán phân bổ ngày.
- Override ngưỡng cảnh báo theo nhóm tòa: hiện chỉ cấu hình doanh nghiệp.
- Vòng đời đầy đủ Nháp → Chờ hiệu lực → Đang hiệu lực → Đang kết thúc → Đã kết thúc / Đã hủy: hiện Nháp / Đang thuê / Đã kết thúc + nhãn.
- `customerAuditLog` riêng: hiện dùng audit chung `TH.log`; `customerHistory` chỉ cho SĐT/địa chỉ.
- Nhánh quyền chi tiết không có `vehicle.view`: code có mask, nhưng tất cả vai trò đang được mở CUS-02 đều có quyền này; chưa có persona kiểm thử riêng.
- K-07 chưa đủ định nghĩa; ma trận quyền cọc thật, ký xác nhận nguồn QA-CUS-15, Excel giá gói, SRS v2.3 và Figma/QA ngoài HTML còn chờ đầu vào hoặc môi trường tương ứng.

### 9.6 CR-CUS-02 — OCR hợp đồng khách thuê theo mẫu đầy đủ (21/10/2026, schema 10)

**Chỉ đạo 21/10/2026:** phần khách thuê lấy thông tin bằng **OCR hợp đồng theo mẫu đầy đủ** `docs/tenplate/Hop_dong_thue_phong_demo_day_du.pdf`. Đã chốt: (1) OCR lấy **toàn bộ hồ sơ thuê**; (2) đọc **bảng tài sản bàn giao Điều 2.2**; (3) **chỉ dùng mẫu đầy đủ** — bỏ mẫu P302 khỏi dữ liệu và thư viện; (4) phạt chậm nộp / phí nhượng phòng **chỉ hiển thị**, không tính vào công nợ.

**Trường trích xuất (38 field + 1 bảng) → nơi lưu → nơi dùng**

| Điều | Trường OCR | Lưu vào | Hiển thị / dùng |
| --- | --- | --- | --- |
| Đầu HĐ | Số HĐ, ngày lập/ký | `ct.signedAt` (mã HĐ sinh theo phòng) | CON-02, CUS-02 › Hợp đồng |
| Bên B | Họ tên, ngày sinh, SĐT, CCCD (mask), nơi cấp, hộ khẩu thường trú | `customers` (+ `idPlace`); đổi SĐT/địa chỉ → lịch sử liên hệ | CUS-02 › Lưu trú |
| 1.1–1.2 | Phòng, số người, số người tối đa, số xe máy | `ct.people`, `terms.peopleMax`, `terms.vehiclesDeclared`; xe khai thiếu → xe **chờ xác nhận** | Lưu trú › Phương tiện; so khớp F012.C |
| 2.2 | Bảng 30 tài sản (tên, SL, tình trạng) | `ct.handover.assets` | Hợp đồng › *Tài sản & chỉ số bàn giao*; chọn làm khấu trừ khi đối chiếu cọc |
| 3.1–3.4 | Ngày giao nhận, ngày tính tiền, thời hạn, từ–đến, gia hạn mặc nhiên | `ct.handover.at/billingFrom`, `ct.start/end`, `terms.autoRenew/noticeDays` | Lưu trú › Thời gian HĐ, Điều khoản |
| 4.1 | Giá thuê, đã thanh toán trước, đóng thêm khi ký | `ct.rent`, `ct.prepaid` | Hợp đồng › thẻ HĐ *Đã nộp khi ký* |
| 4.2 | Chỉ số điện / nước bàn giao | `ct.handover.elecStart/waterStart` | Bàn giao; cảnh báo lệch với công tơ (F012.C) |
| 4.3 | Cọc, hoàn trong 10 ngày, phí nhượng phòng | `ct.deposit`, `terms.refundDays`, `terms.transferFee` | Điều khoản; hạn hoàn trong hồ sơ cọc |
| 4.4 | Hạn nộp 25–30, STK (mask), biểu phí (Internet, điện, nước/người, xe đạp điện, DV chung/người, xe điện SM), phạt 200.000 đ/ngày tối đa 3 ngày | `terms.payWindow/payAccount/lateFeePerDay/lateGraceDays`; `ct.priceList` 7 dòng (ELEC theo chỉ số, WATER/SVC theo người, NET theo phòng, PARK_MOTO 0 đ, PARK_EBIKE, PARK_EV theo xe đã xác nhận; ELEV/EVCHG không áp dụng) | Dòng phí; Điều khoản (chỉ hiển thị) |
| 5.2.4 · 6.2.11 · 7.1 | Bảo hành 10 ngày, báo trước 30 ngày, mất cọc khi đơn phương chấm dứt | `terms.warrantyDays/noticeDays/earlyTermination` | Điều khoản áp dụng |

**Luồng áp dụng**

- `OCR-CON` (HĐ mới): soát 38 field theo 7 nhóm + bảng tài sản (ô “Bảng đúng”); nút xác nhận chỉ mở khi đủ 39 mục và không còn cảnh báo đỏ chưa tích “đã kiểm tra” → `CON-02` *Chuyển vào form* (F014.B) → *Duyệt*: tạo khách (Bên B + xe máy khai ở Điều 1 ở trạng thái chờ xác nhận), HĐ với dòng phí, điều khoản, bàn giao 30 tài sản + chỉ số, tiền đã nộp.
- `CUS-02 › Hợp đồng › Đọc hợp đồng` (HĐ có sẵn): workspace cùng định nghĩa, giá trị định danh/thời hạn lấy từ hồ sơ, biểu phí/điều khoản từ mẫu; xác nhận → áp vào hồ sơ: dòng phí **hiệu lực từ kỳ sau** (hóa đơn đã lập không đổi), SĐT/địa chỉ vào lịch sử liên hệ, bàn giao, tiền đã nộp, xe thiếu → chờ xác nhận, phiên bản HĐ + `ocrJobs` (kind `contract`, target `update`).
- Thẻ *Tài sản & chỉ số bàn giao* sửa được (Sửa/Lưu/Hủy); khi lập đối chiếu cọc có ô chọn tài sản hư hỏng theo biên bản → khấu trừ ghi nguồn “Điều 2.2 · bàn giao: …”.
- Xếp gói: A — 1 mẫu đầy đủ, mỗi field/bảng phải xác nhận, áp vào hồ sơ; B — độ tin cậy từng field, map biểu phí → dòng phí, chọn mẫu thứ 2; C — so khớp phòng–khách–HĐ (người ≤ tối đa, xe khai ↔ xe đã xác nhận, chỉ số bàn giao ↔ công tơ, giá ↔ niêm yết, thời hạn ↔ từ–đến); D — log sửa tay, thư viện mẫu (mẫu phụ “Phụ lục gia hạn” ở trạng thái nháp). Gắn `CR-CUS-02` cho F012.

**Cập nhật trạng thái quyết định** (mẫu đầy đủ nay là nguồn được chỉ định — thay cho `SOURCE_REQUIRED` của bộ trả lời 20/10):

| Mã | Căn cứ trong mẫu đầy đủ | Trạng thái |
| --- | --- | --- |
| K-03 hạn hoàn cọc 10 ngày | Điều 4.3 | `PROPOSED (có căn cứ)` — tính từ ngày bàn giao thực tế; thành chính sách cần `PENDING_APPROVAL` |
| K-04 mất cọc khi đơn phương chấm dứt | Điều 4.3, 7.1 | `PROPOSED (có căn cứ)` — mức giữ cọc vẫn nhập theo hồ sơ và được duyệt, cho phép hoàn một phần khi có thỏa thuận |
| K-09 gia hạn mặc nhiên 12 tháng | Điều 3.4 | `PROPOSED (có căn cứ)` — chỉ áp khi đã kiểm tra không có thông báo chấm dứt trước 30 ngày; phụ lục/HĐ mới vẫn được hỗ trợ |
| K-05 biểu phí | Điều 4.4: Internet 100.000/tháng, điện 4.000/số, nước 120.000/người, xe đạp điện 150.000/xe, DV chung 120.000/người, xe điện SM 400.000/xe | `CÓ CĂN CỨ`; xe máy 0 đ **suy từ Điều 1 không có dòng phí** (cần xác nhận); thang máy & sạc kWh: không có trong mẫu → `PENDING_APPROVAL` |
| Phạt chậm nộp 200.000 đ/ngày, tối đa 3 ngày | Điều 4.4.4 | Có căn cứ — **chỉ hiển thị**, không tính công nợ (`PENDING_APPROVAL`). Ghi chú cũ “chưa thấy trong 2 PDF” không còn đúng với mẫu đầy đủ |
| Phí nhượng phòng 200.000 đ; bảo hành 10 ngày | Điều 4.3; 5.2.4 | Có căn cứ — chỉ hiển thị |
| Mẫu P302 (bản đồng bộ) | — | **Bỏ** khỏi dữ liệu và thư viện theo chỉ đạo 21/10; thư viện giữ mẫu phụ “Phụ lục gia hạn” (nháp) để minh họa F012.D |

**Dữ liệu mẫu (schema 10 — trình duyệt tự nạp lại):** mọi HĐ (19) dùng điều khoản mẫu đầy đủ; `ct.handover` 30 tài sản + chỉ số đầu kỳ của phòng (DD-302: “Tường — thấm nhẹ góc trần” nối với khấu trừ của HC-2610-01; CG-102 rèm ố; TX-202 bình nóng lạnh rò); `ct.prepaid` cho HĐ đang thuê (1.000.000 trước ký + phần còn lại khi ký = cọc + tiền phòng kỳ đầu); khách có `idPlace`; `ocrTemplates` kind contract: mẫu đầy đủ (approved, 38 field + 1 bảng) và mẫu phụ (nháp). Số hồi quy giữ nguyên (xem QA §8.4).

**Chưa làm / ngoài phạm vi:** OCR thật (vendor, PoC, consent); prorate theo ngày; đọc trọn Điều 5–7 (chỉ lưu các khoản dùng); đồng bộ chỉ số bàn giao sang METER (chỉ cảnh báo lệch); mẫu phụ chưa có field thật; chính sách phạt/gia hạn/mất cọc vẫn chờ khách phê duyệt.

### 9.7 METER-01 — chọn tòa trước, nhập theo phòng đang ở (21/10/2026)

Theo yêu cầu khách: màn Điện nước không liệt kê toàn bộ phòng của mọi tòa.
- Topbar "Tất cả tòa": hiện **danh sách tòa** dạng bảng (tìm theo tên/mã/địa chỉ, lọc *Chưa xong*, tòa chưa xong xếp trước) kèm tiến độ chốt số các phòng đang ở (thanh đã xác nhận x/y, thiếu, cần kiểm tra); chưa chọn thì chưa hiện bảng chỉ số. Đã chọn tòa: đổi tòa bằng ô chọn (mỗi lựa chọn ghi tiến độ) và nút *Danh sách tòa* — không dùng hàng thẻ/nút ngang vì không mở rộng được khi nhiều tòa. Lựa chọn được nhớ; topbar chọn 1 tòa hoặc vai trò chỉ có 1 tòa thì vào thẳng bảng tòa đó.
- Bảng chỉ gồm phòng đang ở (có HĐ hiệu lực hoặc trạng thái Đang thuê). Phòng trống ẩn mặc định, mở bằng *Hiện N phòng trống* khi cần chốt số (bàn giao, kiểm tra).
- Phí phát sinh, đơn giá, đối chiếu công tơ nguồn, snapshot tính theo tòa đang chọn. Số đã gõ (gói B) giữ khi đổi tòa; *Lưu* lưu mọi dòng nháp, thanh nhập báo số dòng nháp ở tòa khác.

### 9.8 CR-PAY — Thu tiền, phá HĐ, điện nước không thu được, mẫu hóa đơn theo Excel tháng 9/2026 (21/10/2026, schema 11)

Nguồn: `docs/Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx` (sheet NHÀ T/G/S, G16–18, *cập nhật thu tiền*, *BÁO CÁO CHECK THU TIỀN*, *DS phòng phá hđ*, *ĐIỆN NƯỚC PHÒNG TRỐNG*, *HĐ (VP/VP-HẰNG/TECH/G1 TECH)*, *HĐ (HOÀN CỌC)*, *HOÀN CỌC*). Mockup chỉ dùng dữ liệu giả; không chép tên, SĐT, số tài khoản trong file.

| Sheet Excel | Công thức / nghiệp vụ | Mockup |
| --- | --- | --- |
| NHÀ T/G/S (hóa đơn từng phòng) | `Tổng cần đóng = Tổng DV + Giá × Kỳ TT + Nợ cũ + Cọc + Thu khác`; `Công nợ = Đã đóng − Cần đóng`; *Tình trạng* = Chưa TT / Thừa / Trống / Đóng cọc / Thiếu / Đủ | `C.roomBill`: cần đóng = hóa đơn kỳ + nợ cũ (có dấu, thừa kỳ trước làm giảm) + cọc KH mới thu cùng kỳ; đã đóng = phiếu thu đã xác nhận của hóa đơn kỳ + phiếu trả nợ cũ nhận trong kỳ + cọc nhận trong kỳ. Thêm *Chưa lập HĐ* cho phòng đang ở chưa có hóa đơn kỳ |
| cập nhật thu tiền — theo QL | Phải thu, thực thu, **phải thu sau phá HĐ = phải thu − thực thu − (DT phá HĐ − DT phá HĐ thu được)**, tỉ lệ, DT phá HĐ, thu được, tỉ lệ thu được, phá HĐ / phải thu, dòng *Tổng hệ thống* | `C.collectManagers` → PAY-02 tab *Theo quản lý* |
| cập nhật thu tiền — theo tòa | Mã tòa, QL, phải thu, thu được, DT phá HĐ (= cần đóng của phòng phá HĐ), thu được, tỉ lệ thu, tỉ lệ phá HĐ, lũy kế **M5/M10/M15**, **DT mốc 1 = M5 · mốc 2 = (M10 − M5) × 90% · mốc 3 = (M15 − M10) × 70%** | `C.collectBuilding` → tab *Theo tòa*. File gốc các cột DT MỐC đang lỗi `#REF!`/lệch dòng — mockup tính đúng công thức trên từng tòa |
| BÁO CÁO CHECK THU TIỀN | Mã phòng, QL, cần đóng, đã đóng, công nợ, tình trạng, ngày thanh toán, ghi chú | Tab *Check theo phòng* (lọc tình trạng/tòa, tìm kiếm, nút *Thu* và *Phá HĐ*) |
| DS phòng phá hđ | STT, mã phòng, QL, ngày vào ở, số tháng ở, lý do, SĐT, **tổng phải thu = tiền điện kỳ** (cọc bị giữ bù tiền phòng — “kh phá hd, thu tiền điện”), tổng đã thu | `db.breakCases` + `C.breakList` → tab *Phòng phá HĐ* (SĐT che, kèm DT phá HĐ và trạng thái hồ sơ cọc) |
| ĐIỆN NƯỚC PHÒNG TRỐNG/KHÔNG THU ĐƯỢC | Điện/nước CS cũ, mới, SL, đơn giá, thành tiền; ghi chú *PT* hoặc *kh phá hd* | `C.utilityLoss`: phòng trống/đang sửa có tiêu thụ (PT) + phần điện nước của phòng phá HĐ chưa thu (sau khi trừ tiền khách đã đóng) |
| HĐ (VP/TECH…) | 12 dòng cố định, Mã KH = mã phòng + A001, ngày chốt số liệu, hạn 25–31, phạt 200k/ngày, nội dung CK = mã phòng, mỗi nhóm nhà 1 tài khoản nhận | INV-03 *Mẫu hóa đơn* (xem trước + in): map dòng hóa đơn vào 12 khoản, nợ cũ/cọc từ `C.roomBill`; `buildingGroups.payAccount` (số giả, đã che) |
| HĐ (HOÀN CỌC) | Tiền phòng cọc − (tiền phòng lẻ, điện, nước, vệ sinh, mạng, thang máy, gửi xe, máy giặt, khấu hao, sửa chữa, dọn vệ sinh, sơn phòng, DV khác) = tổng hoàn | CUS-02 › Tài chính › *Phiếu hoàn cọc (mẫu)*; khấu trừ có *loại khoản* theo danh sách này (`TH.REFUND_ITEMS`) |

**Quyết định (đề xuất, chờ khách xác nhận):**

| Mã | Quyết định | Ghi chú |
| --- | --- | --- |
| PAY-Q1 | **QL tòa xác nhận thu tiền** của tòa mình (`receipt.confirm` cho vai trò Quản lý tòa, theo phạm vi tòa). *Ghi nhận thu* của QL có hiệu lực ngay; báo thu của người khác chờ QL tòa xác nhận ở PAY-APP. Bỏ chặn “người báo không tự duyệt” với QL | Thay SRS F030 “Kế toán/Admin xác nhận thực thu” theo yêu cầu khách 21/10/2026 |
| PAY-Q2 | **Văn phòng xem tiến độ thu** (PAY-02 tab Theo QL / Theo tòa / Check phòng) và **hậu kiểm**: *Đã đối soát* (mã sao kê) hoặc *Sai lệch — trả QL* (bắt buộc ghi chú). Hậu kiểm không đổi công nợ. Kế toán không còn `receipt.confirm` (có `receipt.audit`) | Admin (`*`) vẫn thao tác được |
| PAY-Q3 | Cho phép **đóng thừa**: số vượt nợ phân bổ FIFO cho hóa đơn còn nợ khác của phòng (kỳ cũ trước), phần dư nằm ở hóa đơn mới nhất = *Thừa*, tự trừ vào nợ cũ kỳ sau. `C.debt` vẫn ≥ 0 cho các màn cũ; `C.balance` có dấu | Trước đây số vượt bị cắt khi xác nhận |
| PAY-Q4 | **Ghi nhận phá HĐ** (`contract.break`: QL tòa, kế toán, admin) từ bảng check hoặc CUS-02: HĐ → *Phá hợp đồng*, phòng → *Trống*, hóa đơn kỳ giữ làm DT phá HĐ, mở hồ sơ cọc *Chờ duyệt* đề xuất giữ cọc (không tự ghi mất cọc — K-04). RPT-04/05 *Tổng số phòng phá HĐ* đếm theo `breakCases` ∪ bút toán giữ cọc vi phạm, không đếm trùng | — |
| PAY-Q5 | Tình trạng *Đóng cọc* (đã đóng > 0, không có hóa đơn) xét trước *Thừa* | Công thức IF gốc xét *Thừa* trước nên không bao giờ ra *Đóng cọc* |
| PAY-Q6 | Lũy kế M5/M10/M15 của tab Theo tòa tính trên **mọi khoản đã đóng** (gồm trả nợ cũ, cọc) như file Excel; A của hiệu suất (HS) giữ cách cũ: phiếu thu của hóa đơn kỳ nhận trong tháng | Cần khách chốt có thống nhất hai số này không (D-04) |

**Dữ liệu mẫu (schema 11 — trình duyệt tự nạp lại):** DD-201 phá HĐ 16/10 (chuyển chỗ làm), đã đóng 3.000.000 → *Thiếu*; HĐ `terminated`, phòng trống, hồ sơ cọc HC-2610-02 chờ duyệt giữ 4.600.000 (chưa ghi sổ → RPT-05 kỳ 10 không đổi). TX-202 (07/2026) vào danh sách phá HĐ lịch sử. Hệ quả: Đống Đa còn 4 phòng đang ở (METER-01, lấp đầy kỳ 10). Nhóm nhà có tài khoản nhận giả `VPBank •••1201` / `Techcombank •••6018`.

**Ngoài phạm vi lần này:** Kỳ TT nhiều tháng (E = 2/3), tính lẻ theo ngày ở / ngày DV (÷ 30), phân bổ điện chung theo người (dòng *Điện chung* có trong mẫu, giá trị trống), sheet *PHÒNG MỚI THÁNG 9* (hóa đơn đầu cho khách mới có cọc). → **Đã làm ở §9.9 CR-BILL** (quy tắc đề xuất, chờ khách duyệt).

### 9.9 CR-BILL — Tính lẻ ngày, phòng mới tháng, kỳ TT nhiều tháng, điện chung, giảm trừ/phụ thu (21/10/2026, schema 12)

Làm tiếp 4 mục §9.8 để ngoài phạm vi và các điều chỉnh gõ tay ở cột ghi chú, cùng nguồn `docs/Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx`. Quy tắc chưa chốt được làm theo **đề xuất bám file** và gom vào `db.billRules` (INV-01 › thẻ *Quy tắc tính tiền*, nhãn *CHỜ KHÁCH DUYỆT · D-03*). Admin/kế toán đổi qua lại để khách xem; đổi quy tắc chỉ tính lại hóa đơn nháp, hóa đơn đã xác nhận giữ nguyên.

| Mục | File Excel đang làm | Mockup |
| --- | --- | --- |
| Tính lẻ theo ngày ở (F023.B) | Cột *Ngày ở / Ngày DV* luôn 30, không công thức nào dùng; nhân viên gõ tay `=(giá/30)*ngày`, có chỗ ÷31 (≈ 32 dòng). Mẫu hóa đơn có cột *Hệ số (ngày/30)*. DV khách mới không tính lẻ (`/31*31`) | `occupancy(ct, kỳ)`: từ ngày bắt đầu tính tiền (bàn giao) đến ngày khách thực đi; tròn tháng → hệ số 1, lẻ → ngày ở ÷ 30 (hoặc ÷ số ngày thực của tháng). Tiền phòng lẻ làm tròn 1.000đ. INV-01/INV-PREV cột *Lẻ kỳ / Kỳ TT*; INV-03 hiện hệ số; mẫu hóa đơn cột *Hệ số (ngày/30)*. INV-01 lập hóa đơn cho HĐ bắt đầu tới cuối tháng (trước đây chỉ tới ngày 28) |
| Phòng mới tháng (sheet PHÒNG MỚI THÁNG 7/9/10) | Giá niêm yết, giá QL (chốt), giá phòng kỳ này (lẻ), cọc; *Cần đóng = DV + giá lẻ + cọc + nợ cũ + thu khác*; ghi chú "chốt giá…, CTV bù 7 ngày" | HĐ có `listRent` (giá niêm yết) và `priceNote` (form tạo HĐ có ô *Ghi chú giá chốt*). `C.newRooms` → PAY-02 tab **Phòng mới**: kỳ TT, giá chốt/niêm yết, ngày ở, tiền phòng kỳ này (dự kiến nếu chưa lập HĐ), cọc, DV + điện nước, cần đóng, đã đóng, tình trạng; phòng chỉ nhận cọc giữ chỗ cũng liệt kê. Xuất .xlsx thêm sheet *Phong moi* |
| Kỳ TT nhiều tháng | *Cần đóng = giá × Kỳ TT* (2/3); Kỳ TT = 0 ở tháng đã trả trước; ghi chú "2 tháng tiền nhà + dv" hoặc chỉ tiền nhà | HĐ có `payCycle` (1/2/3), `cycleFrom`, `cycleScope` (*chỉ tiền phòng* / *tiền phòng + DV cố định*). Kỳ đầu chu kỳ: tiền phòng × số tháng; các kỳ còn lại không có dòng tiền phòng, ghi *Đã trả trước đến …*; điện nước vẫn lập hằng tháng. CUS-02 › bảng giá sửa *Kỳ thanh toán* (áp từ sau chu kỳ đang chạy). PAY-02 Check theo phòng cột *Kỳ TT* |
| Doanh thu thu trước (G-03) | — | P&L: mỗi kỳ nhận 1 tháng tiền phòng (kỳ thu nhận phần tháng đầu, các kỳ sau nhận phần phân bổ — nguồn *Phân bổ tiền phòng trả trước*) theo trả lời G-03. Hiệu suất: TH1 tính sẵn *DT phải thu chuẩn hóa = DT phải thu − tiền thuê tháng tương lai thu trước* nhưng **chưa áp vào HS** (thuật toán chờ duyệt) |
| Điện chung (F018.D) | *Điện vệ sinh chung*: (CS mới − cũ) × đơn giá ÷ số người; nơi khác cột *Điện chung* = (CS mới − cũ)/2 mỗi phòng; đơn giá 3.800 hoặc 4.000 | `db.commonMeters` + `db.commonReadings`; `commonShare` chia theo người (hoặc phòng) đang ở, làm tròn dồn dòng cuối để tổng khớp. Số người theo tháng `ct.peopleLog` (dùng cả cho nước theo người). METER-01 thẻ **Công tơ điện chung**: nhập số mới, sửa *Số người kỳ này*, bảng phân bổ. Hóa đơn dòng *Điện chung* → mẫu hóa đơn dòng 11; P&L vào doanh thu điện; đối chiếu F020.D cộng phần này |
| Giảm trừ / phụ thu (cột *Thu khác*, ghi chú) | Gõ tay: hỗ trợ DV khách về quê, phạt bẩn tường cộng vào cần đóng, tăng 200k vì thêm người… | `db.billAdjusts` (loại, khoản, số tiền, lý do, người lập/duyệt). INV-01 thẻ *Giảm trừ / phụ thu* + nút trên INV-01/INV-03. Dưới ngưỡng QL tự duyệt; từ ngưỡng chờ kế toán/admin (người lập không tự duyệt); khoản chờ duyệt giữ hóa đơn ở nháp. Hóa đơn đã xác nhận → khoản ghi vào kỳ sau. Mẫu hóa đơn dòng 9 kèm lý do; P&L: giảm trừ trừ vào tiền phòng, phụ thu vào DV khác |

**Quy tắc đề xuất (chờ khách chốt):**

| Mã | Đề xuất trong mockup | Câu hỏi cho khách |
| --- | --- | --- |
| BILL-Q1 | Tiền phòng lẻ = giá × ngày ở ÷ **30** (đổi được sang ngày thực của tháng), làm tròn 1.000đ; tròn tháng luôn hệ số 1 | Chia 30 cố định hay số ngày thực? Làm tròn đến đâu? |
| BILL-Q2 | DV cố định **thu đủ tháng** khi ở lẻ (như file); có tùy chọn tính lẻ cùng hệ số | DV cố định (mạng, vệ sinh, DV chung) có tính lẻ không? |
| BILL-Q3 | Ngày bắt đầu tính = ngày bàn giao (`handover.billingFrom`, mặc định ngày bắt đầu HĐ); ngày kết thúc = ngày khách thực đi (HĐ đang hiệu lực không cắt theo ngày hết hạn vì gia hạn mặc nhiên) | Tính từ ngày ký hay ngày vào ở? |
| BILL-Q4 | Cọc khách mới **tính vào phải thu & 3 mốc** của tiến độ thu (như file), không phải doanh thu (R-01) | Cọc có tính vào tỉ lệ thu / 3 mốc không? |
| BILL-Q5 | Tòa có công tơ chung: điện chung chia **theo người đang ở**, đơn giá theo công tơ; DV chung không còn gồm điện chung | Chia theo người hay theo phòng? Đơn giá điện chung? |
| BILL-Q6 | Phần điện chung của phòng trống **chia hết cho người đang ở** (tùy chọn: công ty chịu, vào *Điện nước không thu được*) | Phòng trống có chịu phần chia không? |
| BILL-Q7 | Kỳ TT nhiều tháng: tiền thu ở kỳ đầu chu kỳ (tiến độ thu tính tiền mặt); P&L phân bổ mỗi tháng 1 tháng; HS chưa chuẩn hóa | Duyệt thuật toán chuẩn hóa G-03 cho HS / lương? |
| BILL-Q8 | Giảm trừ/phụ thu từ **500.000đ** cần kế toán/admin duyệt (theo ngưỡng F021.C) | Ngưỡng duyệt? Ai được duyệt? |

**Dữ liệu mẫu (schema 12 — trình duyệt tự nạp lại):**
- **TX-202:** khách mới KH-019 vào ở 20/10. Cọc giữ chỗ 4.000.000 (12/10) chuyển thành cọc HĐ; giá chốt 3.800.000, niêm yết 4.000.000. Hóa đơn TX kỳ 10 chưa lập: *Sinh nháp* ra tiền phòng 12/30 ngày = 1.520.000. CG-401 vẫn trống cho luồng OCR hợp đồng mẫu.
- **TX-301:** đóng 3 tháng tiền phòng từ kỳ 09. Hóa đơn kỳ 09 có 14.700.000 tiền phòng (3 tháng); hóa đơn kỳ 10 không có tiền phòng.
- **Công tơ chung TH-TX:** CTC-TX-01, 126 kWh × 4.000 = 504.000, chia theo người từ kỳ 10. TX-102 khai 3 người từ kỳ 10.
- **Giảm trừ / phụ thu TX kỳ 10:**
  - TX-101: giảm trừ 120.000 (hỗ trợ DV), đã duyệt.
  - TX-102: phụ thu 200.000 (thêm người), đã duyệt.
  - TX-301: phạt 600.000, chờ kế toán duyệt.

**Thay đổi số báo cáo (có chủ ý):**
- RPT-05 *Kinh doanh* kỳ 10: 4.755.000 → **9.655.000** (+4.900.000). Đây là tiền phòng tháng 10 của TX-301 đã thu trước ở kỳ 09.
- RPT-05 kỳ 09: kinh doanh 16.937.599 → **16.682.599**, tổng 7.537.599 → **7.282.599** (−255.000). Lương HS của QL tòa Thanh Xuân tăng vì A tính cả tiền thu trước 3 tháng; đây đúng là vấn đề TH1/G-03 đang chờ chốt (BILL-Q7).
- Tiến độ thu Cầu Giấy / Đống Đa / hệ thống kỳ 10 không đổi.

**Chưa làm:**
- Tính lẻ điện chung theo ngày ở.
- Đổi kỳ TT giữa chu kỳ có hoàn/bù.
- Nhiều đoạn giá trong một kỳ (F023.D vẫn là thẻ mô tả).
- Chuẩn hóa G-03 vào HS/lương.
- Import sheet PHÒNG MỚI từ Excel.

### 9.10 CR-RPT-02 — Luồng báo cáo theo mẫu Excel: xem trước, bản lưu, phiên bản, truy nguồn (21/10/2026, schema 12)

Triển khai [plan báo cáo](TIMEHOUSE_REPORT_WORKFLOW_PLAN.md). Không nâng schema: DB schema 12 đang lưu chỉ được bổ sung `reportRuns` và `reportDrafts` khi nạp.

**Luồng (mọi gói A–D):**
1. Menu **Báo cáo theo mẫu Excel** (`#/demo/reports`) mở danh sách bản đã tạo. Có tìm kiếm, lọc loại / tòa / kỳ / người tạo, mới nhất trước, hiện mọi phiên bản.
2. **Tạo báo cáo** (`/new`): chọn loại → tháng → tòa trong quyền. "Chọn tất cả" chỉ chọn các tòa được phép.
3. **Xem trước** (`/preview/<draftId>`):
   - RPT-04: mỗi tòa một item.
   - RPT-05: một bản tổng hợp, có sheet Kinh doanh, Tổng và sheet từng nhóm nhà. Mỗi nhóm chỉ gộp các tòa đã chọn.
   - Có đủ tab sheet sẽ xuất: mẫu, chia cổ phần, nguồn số liệu, công thức.
4. **Xác nhận tạo N báo cáo**: chỉ bước này sinh bản lưu. Hủy hoặc quay lại không tạo; bấm lần hai không tạo bản trùng.
5. Bản lưu (`/view/<runId>`) chỉ đọc. Tải Excel dựng từ snapshot. **Tạo phiên bản mới** tính lại từ nguồn hiện tại, tạo v2/v3 và không ghi đè bản cũ.

Route cũ `RPT-04`/`RPT-05` mở form tạo đã điền sẵn loại, kỳ và tòa; mở link không tạo báo cáo.

**Số liệu và truy nguồn:**
- Preview và Excel cùng dựng từ một snapshot, tính bằng `C.pnl` và `C.shareSplit`.
- Mỗi ô số là nút "Nguồn và cách tính", hiển thị theo loại chỉ tiêu:
  - Chỉ tiêu dẫn xuất: công thức → thành phần.
  - Tỷ lệ: tử số và mẫu số. Mẫu số bằng 0 thì hiện "Không áp dụng".
  - Cột nhiều tòa: đóng góp từng tòa.
  - Chỉ tiêu lá: danh sách chứng từ kèm căn cứ tại lúc tạo, tổng đối chiếu và chênh lệch làm tròn.
- **Trả trước:** nguồn `prepaid` ghi hóa đơn gốc, kỳ xuất, các kỳ phủ, tổng dòng, phần kỳ đầu và phần mỗi kỳ sau. Nút mở hóa đơn gốc (INV-03).
- **Căn cứ trên dòng hóa đơn:** `buildInvoice` từ nay lưu căn cứ tính cùng dòng.
  - Tiền phòng: `raw`, `roundTo`, `rule`.
  - Điện chung: `basis` gồm công tơ, chỉ số, đơn giá, cách chia, số người/phòng, phần phòng trống, các dòng phân bổ.
  - Giảm trừ/phụ thu: `basis` gồm mã, loại, lý do, trạng thái, người duyệt, kỳ.
  - Hóa đơn cũ không có căn cứ hiện cảnh báo "Thiếu căn cứ lịch sử", không dựng căn cứ giả.
- **Phân loại giữ như schema 12:** điện chung vào doanh thu điện; giảm trừ trừ vào tiền phòng; phụ thu vào DV khác. "Tổng số phòng mới" vẫn đếm theo ngày bắt đầu HĐ; phần truy nguồn nêu khác biệt với tab Phòng mới ở PAY-02.
- **Lỗi chặn tạo báo cáo:**
  - Số không hữu hạn.
  - Chỉ tiêu dẫn xuất không bằng tổng thành phần.
  - Cột nhiều tòa khác tổng các tòa.
  - Chỉ tiêu lá khác tổng nguồn quá 1đ.
  - Dòng hóa đơn không khớp nguồn.
  - Tham số sai hoặc vượt quyền.
- **Cảnh báo phải tích đã đọc:** hóa đơn nháp bị loại; tòa chưa lập hóa đơn; chi phí chờ duyệt; giảm trừ chờ duyệt; phân bổ chung nháp; lương chưa duyệt; quy tắc đề xuất (BILL-Q1…Q8); thu trước chưa chuẩn hóa HS (BILL-Q7); thiếu căn cứ lịch sử.
- **Dấu vân tay nguồn:** gồm kết quả tính, nguồn đóng góp, hóa đơn kỳ/nháp/trả trước, quy tắc, điều chỉnh, điện chung/số người, phân bổ, lương, chi phí và lịch sử phòng. Nếu nguồn đổi trước khi xác nhận thì bị chặn tạo, phải bấm "Tính lại preview"; màn hình hiện danh sách chỉ tiêu thay đổi.
- **Mở dữ liệu nguồn:** giữ kỳ và có thanh "Quay về báo cáo".
  - Kiểm tra quyền màn hình và phạm vi tòa hiện tại; không tự cấp quyền sửa hay vượt khóa kỳ.
  - Chi tiết lương bị che với vai trò không có `salary.view`.
  - Nguồn không có trang riêng (chi phí, cọc không gắn HĐ, tiền phòng phát sinh) mở modal đúng bản ghi.
- **Các thẻ phân tích theo gói** của RPT-04/05 cũ được giữ, đặt trong preview dưới nhãn "số liệu hiện tại, không thuộc bản lưu": phân bổ chung, đối chiếu dòng tiền, snapshot duyệt kỳ, 3 kỳ lịch sử, xu hướng, biên lợi nhuận, khóa kỳ.

**Bản lưu (`ReportRun`):**
- Gồm mã, loại, kỳ, danh sách tòa đã sắp xếp, phiên bản, bản trước, bản tạo từ, người và thời điểm tạo, mẫu, bộ tính, schema, dấu vân tay, cảnh báo đã đọc, trạng thái lưu (`local`/`session`).
- Snapshot lưu nhãn tòa/nhóm, giá trị, nguồn đã sao chép, ghi chú, quy tắc tính tiền và cổ phần. Không giữ tham chiếu tới `TH.db`, không chụp toàn bộ DB.
- Nhóm phiên bản theo loại + tháng + tập tòa; luôn lấy số tiếp theo của nhóm.
- **Lưu trữ:** ghi localStorage thất bại (bị chặn hoặc đầy quota) thì báo "chỉ lưu trong phiên", không báo đã lưu bền vững.
- **Quyền:**
  - Admin/Kế toán: dùng cả hai loại.
  - Quản lý tòa: chỉ RPT-04 trong tòa được giao; không thấy bản RPT-05.
  - Nhân sự: 403.

**Căn cứ số liệu:** `roomStateAt` nay cắt ở **ngày đầu tháng kế tiếp (không bao gồm)**, thay mốc ngày 28. Sự kiện ngày 28–31 và 29/02 thuộc kỳ đó. Các số đếm cuối kỳ có đổi:
- CG-401 trống cuối kỳ 08.
- DD-302 đang sửa cuối kỳ 09.
- Số tiền P&L không đổi: kỳ 09 kinh doanh 16.682.599, tổng 7.282.599; kỳ 10 kinh doanh 9.655.000.

**Chưa làm:**
- Áp chuẩn hóa G-03 vào HS/lương (giữ cảnh báo BILL-Q7).
- Bản in PDF từ bản lưu.
- Backend lưu trữ (demo vẫn dùng localStorage).
- Dọn bớt bản lưu khi gần đầy quota.
