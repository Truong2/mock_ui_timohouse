# TIMEHOUSE — Ma trận dữ liệu mô phỏng

Bộ dữ liệu `excel-demo-v1`; 3 tòa, 18 phòng; 6 kỳ 05–10/2026. Mọi giá trị mới là dữ liệu mô phỏng, căn cứ nguồn mô tả cấu trúc và cách tính.

| Nhóm | Trường / ý nghĩa nguồn | Tài liệu | Dữ liệu ứng dụng | Kiểu và quy tắc |
|---|---|---|---|---|
| Tòa/nhóm | Mã tòa; nhóm T/S/G | Thông tin nhà / NVVH!B; nhóm trong các sheet NHÀ T/G/S | buildings.id, sourceGroup, demoSourceCode | Chuỗi; nhóm nguồn độc lập nhóm phân quyền/tài khoản |
| Phân công | NVVH, Lead, vệ sinh, kỹ thuật, nguồn | Thông tin nhà / NVVH!F:L; sơ đồ tổ chức | staff, assignments, teams | FK + ngày hiệu lực; tên/chức danh demo, ánh xạ vai trò còn đề xuất |
| Thuê tòa | Giá tháng; kỳ; tiền phải trả | Thông tin nhà / NVVH!M,P,Q; mẫu .doc | leases, landlordPays | Tiền VND, chu kỳ tháng, ngày ISO; không ghi trùng lịch trả vào chi phí tháng |
| Chủ nhà | Địa chỉ, tài khoản, chủ tài khoản | Thông tin nhà / Địa chỉ chi tiết; NVVH!R:S | owners, ownerLinks | Chuỗi; thông tin demo và tài khoản che |
| Dịch vụ đầu vào | Mã điện/nước/mạng; chủ HĐ; chi phí tháng | Danh sách mã HĐ điện nước mạng / năm 2026!B,F,O,P,Y,Z | serviceContracts, supplierBills → expenses | Chủ HĐ dịch vụ không suy thành chủ nhà/khách thuê; số tiền chỉ cộng ở expense |
| Phòng | Mã ghép, tòa, số phòng | Hóa đơn / NHÀ T,G,S!A:C | rooms, contracts.roomId | Giữ ID hiện tại; mã nguồn chỉ dùng mẫu cấu trúc |
| Giá thuê | Niêm yết, giá QL, giá chốt | Hóa đơn / G:H:I | rooms.rent, contracts.listRent/rent | Giá QL nguồn không tự coi là giá hợp đồng; lấy giá chốt demo có lịch hiệu lực |
| Thời gian thuê | Ngày ở, ngày DV, ngày vào, thời hạn, hết HĐ | Hóa đơn / K:L,BA:BC | contracts, handover, invoice.lines | K/L là số ngày, không phải ngày lịch; ngày ISO và tháng nguyên |
| Khách | Định danh, liên hệ, người ở, xe | DAYDU PDF; Excel hóa đơn chỉ có số người O | customers, occupants, vehicles, contracts.peopleLog | Được tạo mới cho demo; không suy tên khách từ cột quản lý D hoặc chủ HĐ dịch vụ |
| Cọc | Cọc khách cũ F; cọc mới J; hoàn cọc | Hóa đơn / F,J và HOÀN CỌC | contracts.deposit, deposits, depositCases | Không cộng F+J thành một khoản nhận mới; hoàn chỉ sau thực chi |
| Điện | Chỉ số đầu/cuối, sản lượng, đơn giá, tiền | Hóa đơn / P:T | readings, priceList, invoice elec | kWh; tách giá mua và giá bán; số thiếu/lùi không xác nhận |
| Nước | Chỉ số/số người, giá và thành tiền | Hóa đơn / U:Y; DAYDU Điều 4.2 | readings, peopleLog, priceList WATER | m³ hoặc người theo phương thức; không nhân cả hai |
| Phí | Vệ sinh, mạng, thang máy, xe, máy giặt, DV khác | Hóa đơn / Z:AQ; DAYDU Điều 4.2 | priceList, fees, invoice fixed | Đơn vị người/phòng/xe/tháng; cách tách phí giữ đề xuất hiện tại |
| Điện chung | Công tơ chung, số người, tiền mỗi người | Hóa đơn / CB:CH | commonMeters, commonReadings, invoice common | Tổng phân bổ + phần phòng trống = tiền công tơ |
| Hóa đơn | Tổng DV AU; cần đóng AV; thu khác N | Hóa đơn / AU:AV,N | invoices, billAdjusts, roomBill | VND; cọc/nợ cũ tính riêng ở bảng thu tiền |
| Thu tiền | Đã đóng AX, tình trạng AY, công nợ AZ | Hóa đơn / AX:AZ; cập nhật thu tiền | receipts, roomBill, receiptEdits | Excel AZ = thu − phải thu; chỉ thu xác nhận giảm nợ, thu sau 15 vẫn giảm nợ |
| Hoa hồng | Giá chốt, mức HH, thành tiền | Hoa hồng / HOA HỒNG THÁNG 9.26!F,H,I | commissions → expenses | Rate 0–1; bảng tổng nhận J không cộng thêm vào từng giao dịch I |
| Sửa chữa | Vật tư, công, tổng theo người/tòa/kỳ | Sổ sửa chữa / sheet chi tiết và LƯƠNG THÁNG 8 | repairJobs.lines → expenses | Chi tiết demo tạo mới; tổng công + vật tư khớp đúng một chi phí |
| Tài sản | Bàn giao, đầu tư ban đầu, thiết bị mua thêm | DAYDU Điều 2; G1 / ĐẦU TƯ BAN ĐẦU | assets, handover.assets, equipment expenses | Số lượng và nguyên giá; không tự khấu hao |
| Hiệu suất | M5/M10/M15; DV; thu thêm; giá niêm yết | DOCX Bước 1–5; bảng lương / THÁNG 8!J:U | calc.perfBuilding, payroll | Trọng số 100/90/70/0; TH1, tiền dư chưa có quy tắc duyệt riêng |
| Lương | Cứng, phụ cấp, trưởng nhóm, mức/phòng, thực nhận | Bảng lương / THÁNG 8!D:H,V:X | staff, salaryPolicy, salaryAdjustments, calc.payroll | Lương nháp /90; DOCX /100 mâu thuẫn, không coi đã duyệt |
| Phân bổ | Chi phí chung và mẫu số phòng | G1 / BÁO CÁO THÁNG 8!C36:C46 | costPools | Tạo mới theo 18 phòng; không dùng 1382/1343 của nguồn thực |
| Báo cáo | DT, GV, CPBH, TCP, LNG, LNR, tỷ lệ | BCKD / BÁO CÁO KINH DOANH THÁNG 8 | calc.pnl, reportRuns.snapshot | Tổng/KD riêng; tỷ lệ tổng tính lại tử/mẫu; mẫu số 0 để không áp dụng |
| Cổ phần | Tỷ lệ; vốn mẫu; LN; tổng nhận | G1 / BÁO CÁO THÁNG 8!G:M; Bảng chia cp | shares, shareholders, calc.shareSplit | Tỷ lệ tổng 100%; vốn mẫu khác vốn góp, không tự chi trả |
| Dự kiến | Doanh thu/chi phí cơ sở và điều chỉnh | Dự kiến LN / Tháng 9.2026!E3:J7 | forecastPlans, dataset.forecast | Nháp, tính từ P&L kỳ cơ sở + giả định; không ghi vào chứng từ thực tế |

## Tình huống và liên kết

| Mã | Tình huống | Kỳ | Quy tắc |
|---|---|---|---|
| DS-01 | Chủ nhà, kỳ trả và nhóm T/S/G | 2026-10 | F-MASTER |
| DS-02 | Hợp đồng dịch vụ và hóa đơn đầu vào | 2026-10 | F-SUPPLIER |
| DS-03 | Nước theo người, khác nước theo công tơ | 2026-09 | F-PERSON |
| DS-04 | Phòng mới lẻ ngày, cọc và trả trước ba tháng | 2026-10 | F-BILL |
| DS-05 | Đối chiếu tiền dư và dấu công nợ Excel | 2026-05 | F-DEBT |
| DS-06 | Thu nhiều lần, chờ xác nhận và thu sau ngày 15 | 2026-10 | F-PERF |
| DS-07 | Cọc: đối chiếu, chờ duyệt và hoàn một phần đã chi | 2026-10 | F-DEPOSIT |
| DS-08 | Vật tư và nhân công liên kết một khoản chi | 2026-10 | F-REPAIR |
| DS-09 | Hoa hồng 50% và 35%, đã duyệt/chờ duyệt | 2026-10 | F-COMMISSION |
| DS-10 | Lương nháp /90 và điều chỉnh | 2026-10 | F-PAYROLL |
| DS-11 | Phân bổ chi phí theo 18 phòng | 2026-10 | F-POOL |
| DS-12 | Điện chung, số người thay đổi, chỉ số thiếu/lùi | 2026-10 | F-COMMON |
| DS-13 | Dự kiến lợi nhuận tách khỏi kết quả thực tế | 2026-10 | F-FORECAST |
| DS-14 | Tổng/KD, cổ phần và báo cáo đã lưu | 2026-10 | F-SHARE |
| DS-15 | Hóa đơn lịch sử trước khi kết thúc hợp đồng | 2026-07 | F-BILL |

Các bản ghi liên quan nằm trong `dataset.scenarios[].refs`; trường `sourceBasis` trên chứng từ gắn phiên bản dataset, quy tắc và tình huống. Đây là căn cứ cấu trúc, không phải chứng minh giao dịch thật của khách hàng.

## Tương thích và sử dụng

- Giữ schema 12 và API `TH.seed()`, `TH.buildInvoice`, `TH.calc`, `TH.reports`. Bổ sung `TH.dataset.version/rules/rule/forecast`; metadata và các sổ phụ chỉ tham chiếu chứng từ, không cộng thêm vào sổ chính.
- Trình duyệt mới nạp dataset mới; schema-12 đã lưu được giữ nguyên cả nháp. Trong **Công cụ demo → Nguồn và tình huống dữ liệu**, Admin/Kế toán tra được căn cứ và mở màn nghiệp vụ.
- **Công cụ demo → Khôi phục** nạp lại bộ mới sau khi giải quyết phần đang sửa và xác nhận xóa phiên demo. Hai bản báo cáo mô phỏng cố định được nạp lại cùng seed.
- Dữ liệu QA đầy đủ: `docs/qa/dataset/dataset.json`; mốc cũ: `baseline-schema12.json`; thay đổi tiền: `dataset-diff.json`; kết quả bộ tính: `engine-results.json`.
