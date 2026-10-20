# TIMEHOUSE — Decision log của bản mockup

Ngày lập: 20/10/2026. Nguồn đối chiếu: `TIMEHOUSE_SRS_GOI_D_v1_1_CAU_HINH_XEM_GOI_A_B_C_D.md` (§4, §5A, §7) và handoff. **Excel báo giá, SRS v2.3, mẫu chứng từ chưa có trong workspace** — các mục đánh dấu ⚠ chưa thể xác minh với Excel.

## 1. Các điểm OPEN của SRS và cách mockup thể hiện

| Mã | Vấn đề | Giá trị tạm trong mockup | Nơi hiển thị nhãn |
| --- | --- | --- | --- |
| D-01 | Field bắt buộc, mask, validation | `Required?` để TBD; form chỉ chặn field tối thiểu để demo chạy; định danh mask `0010••••••218` | Form thêm/sửa, OCR |
| D-02 | OCR số mẫu/định dạng | A: 1 mẫu; B: 2 mẫu + confidence 85%; C: đối chiếu; D: thư viện + log. Kết quả OCR cố định (mô phỏng) | `OCR-CON`, `OCR-CUS` |
| D-03 | Giá điện nước, kỳ chốt, số lùi | Đơn giá cố định theo tòa (3.800–4.000 đ/kWh, 28–30k/m³); số mới < số cũ → chặn lưu, báo kiểm tra; thang giá (C) đánh dấu DRAFT | `METER-01` |
| D-04 | Mốc 5/10/15 | Theo **ngày thực nhận đã xác nhận**; A = M5×100% + (M10−M5)×90% + (M15−M10)×70% (M = lũy kế), thu sau 15 / ngoài kỳ = 0; B = DV phải thu ÷ DT phải thu (theo tòa); C = tiền phòng phát sinh đã thu đủ + khách bỏ cọc; D = A − A×B + C; HS = D ÷ tổng giá niêm yết; 2 trạng thái tạm tính / thực tế (§7.3) | `BLD-02`, `PAY-02`, `RPT-02`, `SAL-01` |
| D-05 | Zalo OA | Provider "chưa chốt", mọi gửi là mô phỏng; chỉ gửi khi đã liên kết OA + HĐ xác nhận | `OA-01`, `OA-02`, `INV-03` |
| D-06 | Lương & hiệu suất | HS% = D ÷ DT niêm yết (D-04); mức lương/phòng = HS × đơn giá tham chiếu ÷ 90; lương HS = mức/phòng × số phòng; trưởng nhóm 10.000 đ/phòng; bảng tham chiếu đầy đủ chờ ký | `SAL-01`, `RPT-03`, `RPT-04` |
| D-07 | Lãi tòa & cổ phần | Lãi dòng tiền tạm tính = thu đã xác nhận − chi đã duyệt; phân bổ làm tròn nghìn, dư dồn dòng đầu; lãi ≤ 0 không chia | `RPT-01`, `SHARE-01`, `SHARE-RESULT` |
| D-08 | Ngoài gói, hạ tầng | Ghi chú ở landing (giá chưa gồm OCR/OA/VPS) | Landing |
| D-09 | RTM FR ↔ UI | Chưa làm; registry chỉ truy vết tới §4 (số dòng SRS) và §5A | `screens.js.srcLine` |
| PKG-01…05 | Package preview | Chỉ prototype; mặc định D; locked/ghost có toggle ẩn; giữ qua trang/tab/refresh; `?previewPackage=` | `DEMO-PKG-01` |
| PKG-06 | Ảnh cũ sai giá | Không dùng ảnh cũ; giá A 50–60 / B 70–80 / C 80–90 / D 90–100 lấy từ một nguồn `TH.PACKAGES` | Toàn bộ |

## 2. Khác biệt giữa note cấp màn (§4) và increment cấp chức năng (§5A)

Quy tắc áp dụng: **gate chi tiết bám §5A**; note cấp màn chỉ hiển thị ở dải ghi chú dưới tiêu đề để khách đối chiếu.

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
| `Hop_dong_*.pdf` (2 mẫu) | Mã `HĐKH-TH01-P302-2026-001`; số người/xe; ngày nhận phòng; cọc 1 tháng; **chỉ số bàn giao điện/nước**; biểu phí: điện 4.000 đ/kWh, nước & dịch vụ chung **120.000 đ/người**, internet 100.000/phòng, xe máy 0, xe đạp điện 150.000, xe điện 400.000; thông báo ngày 25, hạn 25–30 tháng trước kỳ; phạt 200.000 đ/ngày trễ | OCR-CON mô phỏng đúng cấu trúc mẫu đồng bộ (13 field, map biểu phí Điều 4); thư viện mẫu OCR đặt tên theo 2 PDF | Nước tính theo **người** (mẫu) vs theo **m³ công tơ** (SRS F020) → D-03; kỳ thông báo 25 / hạn 30 vs kỳ 01 / hạn 10 của dataset demo; phạt trễ hạn chưa có trong 52 nhóm |
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
