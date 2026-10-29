# TIMEHOUSE — Nguồn tài liệu và công thức cho excel-demo-v2

Bản phân tích phục vụ dataset mô phỏng 3 tòa T17, S9, G1 (mỗi loại nhà T/S/G một tòa), 18 phòng, kỳ 05–10/2026. Không nhập hồ sơ thật từ Excel vào bộ demo.

## 1. Phương pháp và giới hạn

- Đọc sparse OOXML của toàn bộ 13 workbook, mọi sheet kể cả sheet ẩn. Có 248 sheet, 108.090 ô công thức; 75.804 công thức dùng chung đã mở rộng theo ô đích.
- 7.540 nhóm công thức được chuẩn hóa theo tham chiếu tương đối, giữ công thức gốc, ô nguồn và kết quả cache trong hồ sơ nén. Không chạy Excel để tính lại.
- Cache lỗi gồm 2.481 `#DIV/0!`, 21 `#REF!`, 21.642 `#VALUE!`; đây là số ô ở toàn bộ bản sao/kỳ, không phải số nghiệp vụ lỗi duy nhất. Có 68 ô thiếu cache. Cache có số cũng chưa chứng minh còn cập nhật.
- Liên kết ngoài được giữ nguyên để tra cứu; không thay file thiếu bằng một workbook cùng tên hoặc một kỳ khác. Không chuyển lỗi/ô trống thành số 0.
- Kỳ có năm rõ được ghi thành ứng viên; sheet chỉ ghi tháng không bị tự gán năm. Tên file, tiêu đề và tên sheet mâu thuẫn đều giữ để kiểm tra.
- Word lương đã đọc đủ 6 bước; hai PDF đối chiếu riêng. DAYDU là mẫu hợp đồng demo đang dùng; P302 là tài liệu so sánh lịch sử. Sơ đồ tổ chức được xem trực tiếp.
- File `.doc` cũ đã trích được phần văn bản Unicode để đối chiếu thuê tòa/cọc/kỳ trả; chưa phục dựng bố cục và các trường nhúng. Chi tiết chưa xác minh không được gắn là dữ liệu khách hàng thực tế.
- Markdown thiết kế/QA là lịch sử triển khai. Quyết định mới nhất ghi rõ thay thế mới có ưu tiên; “đề xuất” không tự đổi thành đã duyệt.

## 2. Danh mục workbook

| File | Sheet | Công thức | Liên kết ngoài |
|---|---:|---:|---:|
| docs/bao_cao/BÁO CÁO KINH DOANH THÁNG 8.xlsx | 38 | 20715 | 6 |
| docs/bao_cao/báo cáo.xlsx | 1 | 0 | 0 |
| docs/bao_cao/BẢNG DỰ KIẾN LỢI NHUẬN CÁC THÁNG.xlsx | 21 | 296 | 0 |
| docs/bao_cao/bảng lương tháng 8.xlsx | 8 | 6804 | 0 |
| docs/bao_cao/sổ sửa chữa tháng 8(AutoRecovered).xlsx | 29 | 202 | 0 |
| docs/bao_cao/âm dương điện nước tháng 6.xlsx | 28 | 13479 | 28 |
| docs/bao_cao/âm dương điện nước tháng 7.xlsx | 30 | 15024 | 29 |
| docs/Bảng chia cp tháng 8 (1).xlsx | 31 | 10212 | 1 |
| docs/Danh sách mã HĐ điện nước mạng.xlsx | 2 | 629 | 0 |
| docs/G1.31.8.26.xlsx | 17 | 3892 | 19 |
| docs/Hoa hồng năm 2025-2026 (1).xlsx | 21 | 5657 | 0 |
| docs/Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx | 19 | 30866 | 0 |
| docs/Thông tin nhà.xlsx | 3 | 314 | 0 |

## 3. Cách xử lý mọi nhóm công thức

| Loại xử lý | Nhóm công thức |
|---|---:|
| `aggregation_reference` | 1351 |
| `arithmetic_reference` | 3968 |
| `condition_reference` | 18 |
| `external_reference` | 1268 |
| `mapping_reference` | 106 |
| `missing_cache` | 68 |
| `source_error` | 592 |
| `table_reference` | 169 |

Mỗi nhóm có `rule`, lý do xử lý, ví dụ ô và biểu thức; mọi ô còn tra được qua `formula-cells.jsonl.gz`. Các nhóm tham khảo không phải tuyên bố ứng dụng chạy lại mọi biểu thức Excel. Bộ tính dùng các quy tắc nghiệp vụ dưới đây trên đầu vào mô phỏng.

## 4. Quy tắc dùng cho dataset

| Quy tắc | Công thức / cách tính | Căn cứ | Trạng thái và khác biệt |
|---|---|---|---|
| F-MASTER · Lịch trả chủ nhà | Tiền thuê tháng × số tháng trong kỳ trả | docs/Thông tin nhà.xlsx · NVVH · Q3 | verified_pattern: Giá trị đầu vào mô phỏng, không sao chép số tiền khách hàng. |
| F-SUPPLIER · Chi phí đầu vào dịch vụ | Tổng hóa đơn nguồn theo nhà cung cấp/tòa/kỳ | docs/Danh sách mã HĐ điện nước mạng.xlsx · năm 2026 · G4 | verified_pattern: Giá trị đầu vào mô phỏng, không sao chép số tiền khách hàng. |
| F-BILL · Hóa đơn phòng | Tiền phòng × kỳ TT + dịch vụ + cọc mới + nợ cũ + thu khác | docs/Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx · NHÀ T · AV5 | verified_pattern: Hóa đơn lưu tiền thuê/phí; cọc và nợ kỳ trước được roomBill cộng từ sổ riêng, không ghi trùng vào doanh thu. |
| F-METER · Điện và nước theo công tơ | (Chỉ số cuối − chỉ số đầu) × đơn giá | docs/Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx · NHÀ T · T5 | verified_pattern: Giá trị đầu vào mô phỏng, không sao chép số tiền khách hàng. |
| F-PERSON · Nước theo người | Số người hiệu lực trong kỳ × đơn giá | docs/Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx · NHÀ T · Y5 | verified_pattern: Giá trị đầu vào mô phỏng, không sao chép số tiền khách hàng. |
| F-COMMON · Phân bổ điện chung | (Chỉ số cuối − đầu) × giá; chia theo người/phòng | docs/Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx · NHÀ T · CB4:CH4 | proposed: Cách tính phần phòng trống vẫn là cấu hình đề xuất. |
| F-DEBT · Đối chiếu công nợ | Excel: đã thu − phải thu; còn nợ = max(0, phải thu − đã thu) | docs/Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx · NHÀ T · AZ5 | verified_pattern: Chờ xác nhận không giảm nợ; thu sau 15 vẫn giảm nợ. Không suy trạng thái phòng từ AY. |
| F-DEPOSIT · Đối chiếu hoàn cọc | Cọc giữ − khấu trừ − phần giữ cọc = dự kiến hoàn | docs/Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx · HOÀN CỌC · A1 | proposed: Chỉ ghi hoàn sau thực chi; không tự áp phạt hay mất cọc. Bảng nguồn không thay quyết định phê duyệt. |
| F-COMMISSION · Hoa hồng môi giới | Giá chốt × tỷ lệ hoa hồng | docs/Hoa hồng năm 2025-2026 (1).xlsx · HOA HỒNG THÁNG 9.26 · I4 | verified_pattern: Giá trị đầu vào mô phỏng, không sao chép số tiền khách hàng. |
| F-REPAIR · Sổ sửa chữa | Tổng vật tư + tổng nhân công | docs/bao_cao/sổ sửa chữa tháng 8(AutoRecovered).xlsx · LƯƠNG THÁNG 8 · A12 | synthetic_assumption: Cấu trúc sổ được tái hiện; chi tiết vật tư/nhân công demo được tạo mới, không suy ngược thành dữ liệu thực. |
| F-PERF · Hiệu suất vận hành | A = M5 + (M10−M5)×0,9 + (M15−M10)×0,7; B = DV/PT; D = A×(1−B)+C; HS = D/niêm yết | docs/CÁCH TÍNH LƯƠNG PHÒNG VẬN HÀNH.docx · Bước 1–5 | proposed: Thu sau 15 không vào A. TH1 cọc/thu ba tháng chỉ hiển thị cảnh báo và phần cần chuẩn hóa, chưa áp thuật toán chưa duyệt. |
| F-PAYROLL · Lương nháp | HS% × đơn giá/phòng ÷ 90; nhân số phòng; cộng lương cứng/phụ cấp/điều chỉnh | docs/bao_cao/bảng lương tháng 8.xlsx · THÁNG 8 · V9 | pending_approval: DOCX ghi /100 nhưng ví dụ và Excel dùng /90. Giữ /90 cho demo; bảng hệ số đầy đủ chưa có. |
| F-POOL · Phân bổ chi phí chung | Chi phí chung × phòng tòa / tổng phòng thuộc phạm vi phân bổ | docs/G1.31.8.26.xlsx · BÁO CÁO THÁNG 8 · C36 | proposed: Mẫu có nhiều mẫu số 1.382/1.343; demo dùng đúng 18 phòng thuộc bộ dữ liệu, không giữ mẫu số doanh nghiệp thật. |
| F-PNL · Kinh doanh và Tổng | GV = thuê + thiết bị + DV đầu vào; CPBH = lương + vận hành; TCP = GV + CPBH; LNG = DT−GV; LNR = DT−TCP | docs/bao_cao/BÁO CÁO KINH DOANH THÁNG 8.xlsx · BÁO CÁO KINH DOANH THÁNG 8 · C43:C48 | proposed: KD loại cọc mới/hoàn cọc/thiết bị, tính thuê theo kỳ; Tổng theo mẫu quản trị. Không đồng nhất Tổng với sao kê dòng tiền. |
| F-UTILITY · Đối chiếu thu/chi điện nước | Điện: H+B/2+E−L; nước: N+B/2−R | docs/bao_cao/âm dương điện nước tháng 7.xlsx · THÁNG 7.2026 điện công thức · K3:S3 | reference_only: Nguồn có #VALUE!, liên kết ngoài và tên “thực thu” nhưng công thức cộng dòng hóa đơn. Chưa áp cơ chế chia phí này vào thu tiền; không suy thu theo dòng khi phiếu thu chưa phân bổ. |
| F-SHARE · Chia cổ phần theo mẫu G1 | Vốn mẫu = tỷ lệ × tiền thuê; LN phần = tỷ lệ × LN; tổng mẫu = vốn mẫu + LNR phần | docs/G1.31.8.26.xlsx · BÁO CÁO THÁNG 8 · H3:M3 | pending_approval: Vốn mẫu không phải vốn góp và không tự sinh lệnh hoàn vốn/chi trả. |
| F-FORECAST · Dự kiến lợi nhuận | Số cơ sở + các điều chỉnh dự kiến; LNR dự kiến = DT dự kiến − TCP dự kiến | docs/bao_cao/BẢNG DỰ KIẾN LỢI NHUẬN CÁC THÁNG.xlsx · Tháng 9.2026  · E3 | synthetic_assumption: Giữ dự kiến độc lập với chứng từ ghi nhận; không cộng vào báo cáo thực tế. |
| F-ASSET · Đầu tư và tài sản | Số lượng × nguyên giá; liên kết chứng từ đầu tư | docs/G1.31.8.26.xlsx · ĐẦU TƯ BAN ĐẦU · A1 | proposed: Không tự tính khấu hao hoặc chuyển toàn bộ mua sắm thành chi phí KD. |
| F-REPORT · Danh mục chỉ tiêu | Tỷ lệ = tổng tử / tổng mẫu; mẫu số 0 → không áp dụng | docs/bao_cao/báo cáo.xlsx · BÁO CÁO · A1:F12 | reference_only: Các báo cáo chưa có trong phạm vi hiện tại được ghi trong ma trận, không tạo số liệu giả đã xác nhận. |

Ví dụ, đầu vào, đơn vị, kỳ, điều kiện lọc và làm tròn chi tiết nằm trong [formula-rules.json](../qa/dataset/formula-rules.json).

## 5. Ma trận đầy đủ 248 sheet

Trùng nội dung sparse XML được ghi `duplicateOf` trong JSON. Các bản gần giống khác công thức/cache không tự gộp; sheet phụ không nhãn vẫn giữ trong danh mục tham khảo.

### docs/bao_cao/BÁO CÁO KINH DOANH THÁNG 8.xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| BÁO CÁO TỔNG THÁNG 1   | Báo cáo tổng / tổng hợp | 2026-01 | 183 / 94 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 1 NHÀ T  | Báo cáo tổng / chi tiết | 2025-12 | 1129 / 696 | Mẫu cấu trúc → F-PNL |
| BCDT THÁNG 2 NHÀ S  | Báo cáo tổng / chi tiết | 2026-02 | 1682 / 1010 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 2 NHÀ G | Báo cáo tổng / chi tiết | 2026-02 | 94 / 689 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 2 NHÀ T  | Báo cáo tổng / chi tiết | 2026-02 | 1141 / 689 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO TỔNG THÁNG 2 | Báo cáo tổng / tổng hợp | 2026-02 | 223 / 114 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO KINH DOANH THÁNG 2  | Báo cáo tổng / tổng hợp | 2026-02 | 218 / 117 | Mẫu cấu trúc → F-PNL |
| BCDT THÁNG 3 NHÀ S  | Báo cáo tổng / chi tiết | 2026-03 | 1713 / 993 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 3 NHÀ T  | Báo cáo tổng / chi tiết | 2026-03 | 1171 / 689 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 4 NHÀ T   | Báo cáo tổng / chi tiết | 2026-03 | 1196 / 689 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 3 NHÀ G  | Báo cáo tổng / chi tiết | 2026-03 | 126 / 689 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO TỔNG THÁNG 3 | Báo cáo tổng / tổng hợp | 2026-03 | 224 / 114 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO  KINH DOANH THÁNG 3  | Báo cáo tổng / tổng hợp | 2026-03 | 218 / 117 | Mẫu cấu trúc → F-PNL |
| BCDT THÁNG 4 NHÀ S  | Báo cáo tổng / chi tiết | 2026-04 | 1715 / 992 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 4 NHÀ G  | Báo cáo tổng / chi tiết | 2026-04 | 186 / 689 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO TỔNG THÁNG 4  | Báo cáo tổng / tổng hợp | 2026-04 | 224 / 114 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO KINH DOANH THÁNG 4 | Báo cáo tổng / tổng hợp | 2026-04 | 218 / 117 | Mẫu cấu trúc → F-PNL |
| BCDT THÁNG 5 NHÀ S   | Báo cáo tổng / chi tiết | 2026-05 | 1677 / 992 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 5 NHÀ G   | Báo cáo tổng / chi tiết | 2026-05 | 273 / 743 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 5 NHÀ T   | Báo cáo tổng / chi tiết | 2026-05 | 1158 / 689 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO TỔNG THÁNG 5 | Báo cáo tổng / tổng hợp | 2026-05 | 224 / 114 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO KINH DOANH THÁNG 5 | Báo cáo tổng / tổng hợp | 2026-05 | 218 / 117 | Mẫu cấu trúc → F-PNL |
| BCDT THÁNG 6 NHÀ S    | Báo cáo tổng / chi tiết | 2026-06 | 1593 / 1074 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 6 NHÀ T   | Báo cáo tổng / chi tiết | 2026-06 | 1105 / 759 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 6 NHÀ G   | Báo cáo tổng / chi tiết | 2026-06 | 267 / 754 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO TỔNG THÁNG 6 | Báo cáo tổng / tổng hợp | 2026-06 | 223 / 114 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO KINH DOANH THÁNG 6  | Báo cáo tổng / tổng hợp | 2026-06 | 217 / 117 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 7 NHÀ G   | Báo cáo tổng / chi tiết | 2026-07 | 270 / 743 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 8 NHÀ G   | Báo cáo tổng / chi tiết | 2026-08 | 404 / 861 | Mẫu cấu trúc → F-PNL |
| BCDT THÁNG 7 NHÀ S   | Báo cáo tổng / chi tiết | 2026-07 | 1633 / 991 | Mẫu cấu trúc → F-PNL |
| BCDT THÁNG 8 NHÀ S   | Báo cáo tổng / chi tiết | 2026-08 | 1724 / 1097 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 7 NHÀ T   | Báo cáo tổng / chi tiết | 2026-07 | 1143 / 689 | Mẫu cấu trúc → F-PNL |
| BC DT THÁNG 8 NHÀ T   | Báo cáo tổng / chi tiết | 2026-08 | 1202 / 761 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO TỔNG THÁNG 7 | Báo cáo tổng / tổng hợp | 2026-07 | 224 / 114 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO TỔNG THÁNG 8 | Báo cáo tổng / tổng hợp | 2026-08 | 226 / 122 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO KINH DOANH THÁNG 8 | Báo cáo tổng / tổng hợp | 2026-08 | 220 / 125 | Mẫu cấu trúc → F-PNL |
| BÁO CÁO KINH DOANH THÁNG 7  | Báo cáo tổng / tổng hợp | 2026-07 | 218 / 117 | Mẫu cấu trúc → F-PNL |
| BCDT THÁNG 1 NHÀ S  | Báo cáo tổng / chi tiết | 2026-01 | 1646 / 1010 | Mẫu cấu trúc → F-PNL |

### docs/bao_cao/báo cáo.xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| BÁO CÁO | Yêu cầu báo cáo / tổng hợp |  | 55 / 0 | Mẫu cấu trúc → F-REPORT |

### docs/bao_cao/BẢNG DỰ KIẾN LỢI NHUẬN CÁC THÁNG.xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| Tháng 4 | Dự kiến / chi tiết | 2025-04 | 47 / 5 | Mẫu cấu trúc → F-FORECAST |
| Tháng 3 | Dự kiến / chi tiết | 2025-03 | 73 / 31 | Mẫu cấu trúc → F-FORECAST |
| Tháng 5  | Dự kiến / chi tiết | 2025-05 | 48 / 4 | Mẫu cấu trúc → F-FORECAST |
| Tháng 6 | Dự kiến / chi tiết | 2025-06 | 103 / 14 | Mẫu cấu trúc → F-FORECAST |
| Tháng 7  | Dự kiến / chi tiết | 2025-06, 2025-08 | 104 / 13 | Mẫu cấu trúc → F-FORECAST |
| Tháng 8   | Dự kiến / chi tiết | 2025-06, 2025-09 | 118 / 22 | Mẫu cấu trúc → F-FORECAST |
| Tháng 8 . | Dự kiến / chi tiết | 2025-06, 2025-08 | 109 / 13 | Mẫu cấu trúc → F-FORECAST |
| Tháng 9 | Dự kiến / chi tiết | 2025-06, 2025-09 | 109 / 13 | Mẫu cấu trúc → F-FORECAST |
| Tháng 10 | Dự kiến / chi tiết | 2025-06, 2025-10 | 106 / 14 | Mẫu cấu trúc → F-FORECAST |
| Tháng 11 | Dự kiến / chi tiết | 2025-06, 2025-11 | 106 / 14 | Mẫu cấu trúc → F-FORECAST |
| Tháng 12 | Dự kiến / chi tiết | 2025-06, 2025-12 | 105 / 15 | Mẫu cấu trúc → F-FORECAST |
| Tháng 1.2026 | Dự kiến / chi tiết | 2025-06, 2026-01 | 105 / 15 | Mẫu cấu trúc → F-FORECAST |
| Tháng 2.2026  | Dự kiến / chi tiết | 2025-06, 2026-02 | 103 / 16 | Mẫu cấu trúc → F-FORECAST |
| Tháng 3.2026  | Dự kiến / chi tiết | 2025-06, 2026-03 | 103 / 14 | Mẫu cấu trúc → F-FORECAST |
| Sheet1 | Dự kiến / sheet phụ chưa rõ nghĩa |  | 43 / 17 | Giữ tham khảo; không tự sinh dữ liệu từ sheet phụ |
| Tháng 4.2026   | Dự kiến / chi tiết | 2025-06, 2026-04 | 104 / 14 | Mẫu cấu trúc → F-FORECAST |
| Tháng 5.2026  | Dự kiến / chi tiết | 2025-06, 2026-05 | 105 / 13 | Mẫu cấu trúc → F-FORECAST |
| Tháng 6.2026  | Dự kiến / chi tiết | 2025-06, 2026-06 | 107 / 13 | Mẫu cấu trúc → F-FORECAST |
| Tháng 7.2026   | Dự kiến / chi tiết | 2025-06, 2026-07 | 105 / 12 | Mẫu cấu trúc → F-FORECAST |
| Tháng 8.2026   | Dự kiến / chi tiết | 2025-06, 2026-08 | 107 / 12 | Mẫu cấu trúc → F-FORECAST |
| Tháng 9.2026  | Dự kiến / chi tiết | 2025-06, 2026-09 | 109 / 12 | Mẫu cấu trúc → F-FORECAST |

### docs/bao_cao/bảng lương tháng 8.xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| THÁNG 1 | Lương / chi tiết |  | 897 / 820 | Mẫu cấu trúc → F-PAYROLL |
| THÁNG 2  | Lương / chi tiết |  | 885 / 785 | Mẫu cấu trúc → F-PAYROLL |
| THÁNG 3 | Lương / chi tiết |  | 884 / 828 | Mẫu cấu trúc → F-PAYROLL |
| THÁNG 4  | Lương / chi tiết |  | 887 / 839 | Mẫu cấu trúc → F-PAYROLL |
| THÁNG 5  | Lương / chi tiết |  | 914 / 852 | Mẫu cấu trúc → F-PAYROLL |
| THÁNG 6 | Lương / chi tiết |  | 931 / 871 | Mẫu cấu trúc → F-PAYROLL |
| THÁNG 7 | Lương / chi tiết |  | 971 / 857 | Mẫu cấu trúc → F-PAYROLL |
| THÁNG 8 | Lương / chi tiết |  | 968 / 952 | Mẫu cấu trúc → F-PAYROLL |

### docs/bao_cao/sổ sửa chữa tháng 8(AutoRecovered).xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| LƯƠNG THÁNG 2 | Sửa chữa / tổng hợp |  | 64 / 23 | Mẫu cấu trúc → F-REPAIR |
| A Điệp T1.26 | Sửa chữa / chi tiết | 2026-01 | 295 / 5 | Mẫu cấu trúc → F-REPAIR |
| A Ước T1.26 | Sửa chữa / chi tiết | 2026-01 | 210 / 2 | Mẫu cấu trúc → F-REPAIR |
| Trường | Sửa chữa / chi tiết |  | 110 / 2 | Mẫu cấu trúc → F-REPAIR |
| a Điệp T2.26 | Sửa chữa / chi tiết | 2026-02 | 193 / 3 | Mẫu cấu trúc → F-REPAIR |
| A Ước T2.26 | Sửa chữa / chi tiết | 2026-02 | 133 / 2 | Mẫu cấu trúc → F-REPAIR |
| trường.2.26 | Sửa chữa / chi tiết | 2026-02 | 73 / 2 | Mẫu cấu trúc → F-REPAIR |
| trường tháng 3 | Sửa chữa / chi tiết |  | 180 / 2 | Mẫu cấu trúc → F-REPAIR |
| A Điệp T3.26 | Sửa chữa / chi tiết | 2026-03 | 427 / 2 | Mẫu cấu trúc → F-REPAIR |
| A Ước T3.26 | Sửa chữa / chi tiết | 2026-03 | 350 / 2 | Mẫu cấu trúc → F-REPAIR |
| LƯƠNG THÁNG 3  | Sửa chữa / tổng hợp |  | 64 / 23 | Mẫu cấu trúc → F-REPAIR |
| Trường T4.26 | Sửa chữa / chi tiết | 2026-04 | 257 / 2 | Mẫu cấu trúc → F-REPAIR |
| A Điệp T4.26 | Sửa chữa / chi tiết | 2026-04 | 566 / 4 | Mẫu cấu trúc → F-REPAIR |
| A Ước T4.26 | Sửa chữa / chi tiết | 2026-04 | 491 / 4 | Mẫu cấu trúc → F-REPAIR |
| A Điệp 5.26 | Sửa chữa / chi tiết | 2026-05 | 331 / 2 | Mẫu cấu trúc → F-REPAIR |
| A Ước 5.26  | Sửa chữa / chi tiết | 2026-05 | 296 / 2 | Mẫu cấu trúc → F-REPAIR |
| trường t5.2026 | Sửa chữa / chi tiết | 2026-05 | 328 / 2 | Mẫu cấu trúc → F-REPAIR |
| Sheet4 | Sửa chữa / sheet phụ chưa rõ nghĩa |  | 72 / 0 | Giữ tham khảo; không tự sinh dữ liệu từ sheet phụ |
| A Điệp 6.26 | Sửa chữa / chi tiết | 2026-06 | 391 / 6 | Mẫu cấu trúc → F-REPAIR |
| A Ước 6.26 | Sửa chữa / chi tiết | 2026-06 | 328 / 2 | Mẫu cấu trúc → F-REPAIR |
| Trường 6.2026 | Sửa chữa / chi tiết | 2026-06 | 188 / 2 | Mẫu cấu trúc → F-REPAIR |
| A Điệp 7.26 | Sửa chữa / chi tiết | 2026-07 | 490 / 2 | Mẫu cấu trúc → F-REPAIR |
| A Ước 7.26 | Sửa chữa / chi tiết | 2026-07 | 286 / 2 | Mẫu cấu trúc → F-REPAIR |
| LƯƠNG THÁNG 5 | Sửa chữa / tổng hợp |  | 62 / 25 | Mẫu cấu trúc → F-REPAIR |
| LƯƠNG THÁNG 6 | Sửa chữa / tổng hợp |  | 63 / 24 | Mẫu cấu trúc → F-REPAIR |
| LƯƠNG THÁNG 7 | Sửa chữa / tổng hợp |  | 62 / 25 | Mẫu cấu trúc → F-REPAIR |
| A Điệp 8.26 | Sửa chữa / chi tiết | 2026-08 | 577 / 2 | Mẫu cấu trúc → F-REPAIR |
| A Ước 8.26 | Sửa chữa / chi tiết | 2026-08 | 723 / 2 | Mẫu cấu trúc → F-REPAIR |
| LƯƠNG THÁNG 8 | Sửa chữa / tổng hợp |  | 61 / 26 | Mẫu cấu trúc → F-REPAIR |

### docs/bao_cao/âm dương điện nước tháng 6.xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| THÁNG 5.2025( dv) | Điện nước / chi tiết | 2025-05 | 154 / 376 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 5.2025 | Điện nước / chi tiết | 2025-05 | 219 / 465 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 2.2026 Công thức  | Điện nước / tham khảo công thức | 2026-02 | 634 / 1078 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 2.2026 | Điện nước / chi tiết | 2026-02 | 1693 / 18 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 4.2026 | Điện nước / chi tiết | 2026-02, 2026-04 | 659 / 1127 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 5.2026 nước  | Điện nước / chi tiết | 2026-05 | 841 / 958 | Mẫu cấu trúc → F-UTILITY |
| Sản lượng điện tháng 5 và 6 CT | Điện nước / tham khảo công thức |  | 286 / 380 | Mẫu cấu trúc → F-UTILITY |
| Sản lượng điện thấng 5 và 6 | Điện nước / chi tiết |  | 660 / 6 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 6.2026 điện công thức | Điện nước / tham khảo công thức | 2026-06 | 669 / 1130 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 6.2026 điện | Điện nước / chi tiết | 2026-06 | 1423 / 376 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 6.2026 nước | Điện nước / chi tiết | 2026-06 | 1137 / 99 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 5.2026  chuẩn | Điện nước / chi tiết | 2026-05 | 1500 / 578 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 4.2026. chuẩn  | Điện nước / chi tiết | 2026-04 | 1786 / 0 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 8.2025 chuẩn  | Điện nước / chi tiết | 2025-08 | 1586 / 18 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 8.2025  | Điện nước / chi tiết | 2025-08 | 588 / 1016 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 7.2025 chuẩn | Điện nước / chi tiết | 2025-07 | 897 / 494 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 7.2025 | Điện nước / chi tiết | 2025-07 | 320 / 1071 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 6.2025 | Điện nước / chi tiết | 2025-06 | 466 / 1024 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 2.2025  | Điện nước / chi tiết | 2025-02 | 201 / 451 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 1.2025 | Điện nước / chi tiết | 2025-01 | 208 / 435 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 11 | Điện nước / chi tiết |  | 197 / 427 | Mẫu cấu trúc → F-UTILITY |
| Sheet1 | Điện nước / sheet phụ chưa rõ nghĩa |  | 106 / 7 | Giữ tham khảo; không tự sinh dữ liệu từ sheet phụ |
| THÁNG 6 | Điện nước / chi tiết |  | 141 / 246 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 7 | Điện nước / chi tiết |  | 147 / 243 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 8 | Điện nước / chi tiết |  | 166 / 328 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 8 (2) | Điện nước / chi tiết |  | 283 / 333 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 9 | Điện nước / chi tiết |  | 164 / 381 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 10 | Điện nước / chi tiết |  | 189 / 414 | Mẫu cấu trúc → F-UTILITY |

### docs/bao_cao/âm dương điện nước tháng 7.xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| THÁNG 5.2025( dv) | Điện nước / chi tiết | 2025-05 | 154 / 376 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 5.2025 | Điện nước / chi tiết | 2025-05 | 219 / 465 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 2.2026 Công thức  | Điện nước / tham khảo công thức | 2026-02 | 634 / 1078 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 2.2026 | Điện nước / chi tiết | 2026-02 | 1693 / 18 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 4.2026 | Điện nước / chi tiết | 2026-02, 2026-04 | 659 / 1127 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 5.2026 nước  | Điện nước / chi tiết | 2026-05 | 841 / 958 | Mẫu cấu trúc → F-UTILITY |
| Sản lượng điện tháng 5 và 6 CT | Điện nước / tham khảo công thức |  | 286 / 380 | Mẫu cấu trúc → F-UTILITY |
| Sản lượng điện thấng 5 và 6 | Điện nước / chi tiết |  | 660 / 6 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 6.2026 điện công thức | Điện nước / tham khảo công thức | 2026-06 | 669 / 1130 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 7.2026 điện công thức | Điện nước / tham khảo công thức | 2026-07 | 685 / 1157 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 7.2026 điện  | Điện nước / chi tiết | 2026-07 | 1454 / 388 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 6.2026 điện | Điện nước / chi tiết | 2026-06 | 1423 / 376 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 6.2026 nước | Điện nước / chi tiết | 2026-06 | 1137 / 99 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 5.2026  chuẩn | Điện nước / chi tiết | 2026-05 | 1500 / 578 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 4.2026. chuẩn  | Điện nước / chi tiết | 2026-04 | 1786 / 0 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 8.2025 chuẩn  | Điện nước / chi tiết | 2025-08 | 1586 / 18 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 8.2025  | Điện nước / chi tiết | 2025-08 | 588 / 1016 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 7.2025 chuẩn | Điện nước / chi tiết | 2025-07 | 897 / 494 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 7.2025 | Điện nước / chi tiết | 2025-07 | 320 / 1071 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 6.2025 | Điện nước / chi tiết | 2025-06 | 466 / 1024 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 2.2025  | Điện nước / chi tiết | 2025-02 | 201 / 451 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 1.2025 | Điện nước / chi tiết | 2025-01 | 208 / 435 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 11 | Điện nước / chi tiết |  | 197 / 427 | Mẫu cấu trúc → F-UTILITY |
| Sheet1 | Điện nước / sheet phụ chưa rõ nghĩa |  | 106 / 7 | Giữ tham khảo; không tự sinh dữ liệu từ sheet phụ |
| THÁNG 6 | Điện nước / chi tiết |  | 141 / 246 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 7 | Điện nước / chi tiết |  | 147 / 243 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 8 | Điện nước / chi tiết |  | 166 / 328 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 8 (2) | Điện nước / chi tiết |  | 283 / 333 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 9 | Điện nước / chi tiết |  | 164 / 381 | Mẫu cấu trúc → F-UTILITY |
| THÁNG 10 | Điện nước / chi tiết |  | 189 / 414 | Mẫu cấu trúc → F-UTILITY |

### docs/Bảng chia cp tháng 8 (1).xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| LNR THÁNG  1 | Cổ phần / tổng hợp |  | 32 / 125 | Mẫu cấu trúc → F-SHARE |
| Tháng 1 nhà T   | Cổ phần / chi tiết | 2026-01 | 934 / 214 | Mẫu cấu trúc → F-SHARE |
| Tháng 3 nhà T   | Cổ phần / chi tiết | 2026-03 | 934 / 214 | Mẫu cấu trúc → F-SHARE |
| Tháng 2 nhà T    | Cổ phần / chi tiết | 2026-02 | 934 / 214 | Mẫu cấu trúc → F-SHARE |
| Tháng 2 nhà S  | Cổ phần / chi tiết | 2026-02 | 2555 / 510 | Mẫu cấu trúc → F-SHARE |
| Tháng 2 nhà G  | Cổ phần / chi tiết | 2026-02 | 124 / 502 | Mẫu cấu trúc → F-SHARE |
| LNR THÁNG  2  | Cổ phần / tổng hợp |  | 32 / 125 | Mẫu cấu trúc → F-SHARE |
| Tháng 3 nhà S  | Cổ phần / chi tiết | 2026-03 | 2509 / 499 | Mẫu cấu trúc → F-SHARE |
| Tháng 3 nhà G   | Cổ phần / chi tiết | 2026-03 | 212 / 493 | Mẫu cấu trúc → F-SHARE |
| LNR THÁNG  3 | Cổ phần / tổng hợp |  | 32 / 125 | Mẫu cấu trúc → F-SHARE |
| Tháng 4 nhà T   | Cổ phần / chi tiết | 2026-04 | 934 / 214 | Mẫu cấu trúc → F-SHARE |
| Tháng 4 nhà S  | Cổ phần / chi tiết | 2026-04 | 2466 / 499 | Mẫu cấu trúc → F-SHARE |
| Tháng 4 nhà G   | Cổ phần / chi tiết | 2026-04 | 368 / 483 | Mẫu cấu trúc → F-SHARE |
| LNR THÁNG  4 | Cổ phần / tổng hợp |  | 32 / 125 | Mẫu cấu trúc → F-SHARE |
| Tháng 5 nhà T  | Cổ phần / chi tiết | 2026-05 | 934 / 214 | Mẫu cấu trúc → F-SHARE |
| Tháng 5 nhà S   | Cổ phần / chi tiết | 2026-05 | 2466 / 499 | Mẫu cấu trúc → F-SHARE |
| Tháng 5 nhà G   | Cổ phần / chi tiết | 2026-05 | 428 / 513 | Mẫu cấu trúc → F-SHARE |
| LNR THÁNG  5 | Cổ phần / tổng hợp |  | 32 / 125 | Mẫu cấu trúc → F-SHARE |
| Tháng 6 nhà T   | Cổ phần / chi tiết | 2026-05 | 934 / 214 | Mẫu cấu trúc → F-SHARE |
| Tháng 6 nhà S    | Cổ phần / chi tiết | 2026-05 | 2466 / 499 | Mẫu cấu trúc → F-SHARE |
| Tháng 6 nhà G    | Cổ phần / chi tiết | 2026-05 | 428 / 513 | Mẫu cấu trúc → F-SHARE |
| LNR THÁNG  6 | Cổ phần / tổng hợp |  | 32 / 125 | Mẫu cấu trúc → F-SHARE |
| Tháng 7 nhà T  | Cổ phần / chi tiết | 2026-07 | 934 / 215 | Mẫu cấu trúc → F-SHARE |
| Tháng 8 nhà T  | Cổ phần / chi tiết | 2026-08 | 930 / 215 | Mẫu cấu trúc → F-SHARE |
| Tháng 7 nhà S    | Cổ phần / chi tiết | 2026-07 | 2466 / 499 | Mẫu cấu trúc → F-SHARE |
| Tháng 7 nhà G    | Cổ phần / chi tiết | 2026-07 | 576 / 477 | Mẫu cấu trúc → F-SHARE |
| LNR THÁNG  7 | Cổ phần / tổng hợp |  | 34 / 135 | Mẫu cấu trúc → F-SHARE |
| Tháng 8 nhà S  | Cổ phần / chi tiết | 2026-08 | 2414 / 495 | Mẫu cấu trúc → F-SHARE |
| Tháng 8 nhà G   | Cổ phần / chi tiết | 2026-08 | 758 / 487 | Mẫu cấu trúc → F-SHARE |
| LNR THÁNG  8 | Cổ phần / tổng hợp |  | 34 / 135 | Mẫu cấu trúc → F-SHARE |
| Tháng 1 nhà S | Cổ phần / chi tiết | 2026-01 | 2531 / 510 | Mẫu cấu trúc → F-SHARE |

### docs/Danh sách mã HĐ điện nước mạng.xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| Sheet1 | Dịch vụ đầu vào / sheet phụ chưa rõ nghĩa | 2025-04, 2025-05, 2025-06, 2025-08, 2026-01 | 5115 / 450 | Giữ tham khảo; không tự sinh dữ liệu từ sheet phụ |
| năm 2026 | Dịch vụ đầu vào / chi tiết | 2026-01 | 2316 / 179 | Mẫu cấu trúc → F-SUPPLIER |

### docs/G1.31.8.26.xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| ĐẦU TƯ BAN ĐẦU | Đầu tư / chi tiết | 2025-10, 2025-11 | 26 / 1 | Mẫu cấu trúc → F-ASSET |
| THU CHI BAN ĐẦU | Đầu tư / chi tiết | 2026-01 | 126 / 39 | Mẫu cấu trúc → F-ASSET |
| HD T1.26 | Hóa đơn/phòng mới / chi tiết | 2026-01 | 1305 / 1564 | Mẫu cấu trúc → F-BILL |
| BÁO CÁO THÁNG 2 | Báo cáo tòa / tổng hợp | 2026-02 | 106 / 82 | Mẫu cấu trúc → F-PNL |
| HĐ T2.26 | Hóa đơn/phòng mới / chi tiết | 2026-02 | 450 / 245 | Mẫu cấu trúc → F-BILL |
| BÁO CÁO THÁNG 3 | Báo cáo tòa / tổng hợp | 2026-03 | 112 / 82 | Mẫu cấu trúc → F-PNL |
| HĐ T3.26  | Hóa đơn/phòng mới / chi tiết | 2026-03 | 447 / 244 | Mẫu cấu trúc → F-BILL |
| BÁO CÁO THÁNG 4 | Báo cáo tòa / tổng hợp | 2026-04 | 112 / 82 | Mẫu cấu trúc → F-PNL |
| HĐ T4.26  | Hóa đơn/phòng mới / chi tiết | 2026-04 | 446 / 244 | Mẫu cấu trúc → F-BILL |
| BÁO CÁO THÁNG 5 | Báo cáo tòa / tổng hợp |  | 112 / 83 | Mẫu cấu trúc → F-PNL |
| HĐ T5.26  | Hóa đơn/phòng mới / chi tiết | 2026-05 | 450 / 245 | Mẫu cấu trúc → F-BILL |
| BÁO CÁO THÁNG 6 | Báo cáo tòa / tổng hợp | 2026-06 | 124 / 80 | Mẫu cấu trúc → F-PNL |
| HĐ T6.26  | Hóa đơn/phòng mới / chi tiết | 2026-06 | 452 / 246 | Mẫu cấu trúc → F-BILL |
| BÁO CÁO THÁNG 7 | Báo cáo tòa / tổng hợp | 2026-07 | 105 / 81 | Mẫu cấu trúc → F-PNL |
| HĐ T7.26   | Hóa đơn/phòng mới / chi tiết | 2026-07 | 444 / 246 | Mẫu cấu trúc → F-BILL |
| BÁO CÁO THÁNG 8 | Báo cáo tòa / tổng hợp | 2026-08 | 111 / 81 | Mẫu cấu trúc → F-PNL |
| HĐ T8.26   | Hóa đơn/phòng mới / chi tiết | 2026-08 | 452 / 247 | Mẫu cấu trúc → F-BILL |

### docs/Hoa hồng năm 2025-2026 (1).xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| HOA HỒNG THÁNG 1.25 | Hoa hồng / chi tiết | 2025-01 | 253 / 74 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 2.25 | Hoa hồng / chi tiết | 2025-02 | 155 / 49 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 3.25 | Hoa hồng / chi tiết | 2025-03 | 490 / 133 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 4.25 | Hoa hồng / chi tiết | 2025-04 | 487 / 132 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 5.2025 | Hoa hồng / chi tiết | 2025-05 | 443 / 123 | Mẫu cấu trúc → F-COMMISSION |
|  HOA HỒNG THÁNG 6.2025 | Hoa hồng / chi tiết | 2025-06 | 654 / 162 | Mẫu cấu trúc → F-COMMISSION |
|  HOA HỒNG THÁNG 8.2025 | Hoa hồng / chi tiết | 2025-08 | 920 / 219 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 7.2025 | Hoa hồng / chi tiết | 2025-07 | 478 / 133 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 9.2025 | Hoa hồng / chi tiết | 2025-09 | 1465 / 556 | Mẫu cấu trúc → F-COMMISSION |
|  HOA HỒNG THÁNG 10.2025 | Hoa hồng / chi tiết | 2025-10 | 549 / 388 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 11.2025 | Hoa hồng / chi tiết | 2025-11 | 548 / 259 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 12.2025 | Hoa hồng / chi tiết | 2025-12 | 546 / 310 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 1.2026 | Hoa hồng / chi tiết | 2026-01 | 451 / 273 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 2.26 | Hoa hồng / chi tiết | 2026-02 | 341 / 235 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 3.26 | Hoa hồng / chi tiết | 2026-03 | 470 / 277 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 4.26 | Hoa hồng / chi tiết | 2026-04 | 763 / 369 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 5.26 | Hoa hồng / chi tiết | 2026-05 | 690 / 303 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 6.26 | Hoa hồng / chi tiết | 2026-06 | 812 / 359 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 7.26 | Hoa hồng / chi tiết | 2026-07 | 790 / 327 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 8.26 | Hoa hồng / chi tiết | 2026-08 | 1017 / 397 | Mẫu cấu trúc → F-COMMISSION |
| HOA HỒNG THÁNG 9.26 | Hoa hồng / chi tiết | 2026-09 | 1964 / 579 | Mẫu cấu trúc → F-COMMISSION |

### docs/Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| NHÀ T | Hóa đơn/phòng mới / chi tiết |  | 12348 / 6909 | Mẫu cấu trúc → F-BILL |
| NHÀ G | Hóa đơn/phòng mới / chi tiết |  | 5648 / 2782 | Mẫu cấu trúc → F-BILL |
| NHÀ S | Hóa đơn/phòng mới / chi tiết |  | 16424 / 8287 | Mẫu cấu trúc → F-BILL |
| PHÒNG MỚI THÁNG 9 | Hóa đơn/phòng mới / chi tiết |  | 1362 / 1558 | Mẫu cấu trúc → F-BILL |
| PHÒNG MỚI THÁNG 10 | Hóa đơn/phòng mới / chi tiết |  | 1315 / 1502 | Mẫu cấu trúc → F-BILL |
| cập nhật thu tiền | Hóa đơn/phòng mới / chi tiết | 2026-09 | 551 / 768 | Mẫu cấu trúc → F-BILL |
| BÁO CÁO CHECK THU TIỀN | Hóa đơn/phòng mới / tổng hợp |  | 781 / 1228 | Mẫu cấu trúc → F-BILL |
| G16 | Hóa đơn/phòng mới / chi tiết |  | 1174 / 1533 | Mẫu cấu trúc → F-BILL |
| G17 | Hóa đơn/phòng mới / chi tiết |  | 1239 / 1544 | Mẫu cấu trúc → F-BILL |
| G18 | Hóa đơn/phòng mới / chi tiết |  | 1239 / 1530 | Mẫu cấu trúc → F-BILL |
| PHÒNG MỚI THÁNG 7 | Hóa đơn/phòng mới / chi tiết |  | 1497 / 1554 | Mẫu cấu trúc → F-BILL |
| DS phòng phá hđ | Cọc/phá HĐ / chi tiết |  | 120 / 99 | Mẫu cấu trúc → F-DEPOSIT |
| HĐ (VP-HẰNG) | Hóa đơn/phòng mới / chi tiết | 2026-09 | 50 / 53 | Mẫu cấu trúc → F-BILL |
| HĐ (VP) | Hóa đơn/phòng mới / chi tiết | 2026-09 | 49 / 54 | Mẫu cấu trúc → F-BILL |
| HĐ (TECH) | Hóa đơn/phòng mới / chi tiết | 2026-09 | 52 / 51 | Mẫu cấu trúc → F-BILL |
| HĐ G1 (TECH)  | Hóa đơn/phòng mới / chi tiết | 2026-09 | 49 / 54 | Mẫu cấu trúc → F-BILL |
| ĐIỆN NƯỚC PHÒNG TRỐNG | Điện nước / chi tiết |  | 127 / 12 | Mẫu cấu trúc → F-UTILITY |
| HOÀN CỌC | Cọc/phá HĐ / chi tiết |  | 2798 / 1296 | Mẫu cấu trúc → F-DEPOSIT |
| HĐ (HOÀN CỌC) | Cọc/phá HĐ / chi tiết |  | 55 / 52 | Mẫu cấu trúc → F-DEPOSIT |

### docs/Thông tin nhà.xlsx

| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |
|---|---|---|---:|---|
| NVVH | Hồ sơ / chi tiết |  | 1687 / 309 | Mẫu cấu trúc → F-MASTER |
| NVKT | Hồ sơ / chi tiết |  | 485 / 4 | Mẫu cấu trúc → F-MASTER |
| Địa chỉ chi tiết | Hồ sơ / chi tiết |  | 480 / 1 | Mẫu cấu trúc → F-MASTER |
