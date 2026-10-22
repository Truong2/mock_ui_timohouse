# Đối chiếu template import với tài liệu Excel

Ngày kiểm tra: 21/10/2026. Kết luận: **CHƯA KHỚP / CHƯA ĐẠT yêu cầu chuẩn trường và kiểu dữ liệu**.

Đã kiểm tra cấu hình import, nội dung OOXML thực tế do nút tải mẫu sinh ra và hành vi ghi dữ liệu trong trình duyệt. Đã lập danh mục 13 workbook Excel trong `docs`; đối chiếu sâu 8 sheet trong 5 workbook có liên quan trực tiếp. Đây không phải xác nhận mọi sheet báo cáo/lương/chi phí đã được kiểm tra từng trường.

Phạm vi là kiểm tra và lập bảng chuẩn hóa. Không sửa workbook nguồn hay triển khai lại import. Ứng dụng hiện mô phỏng import bằng dữ liệu viết sẵn, chưa đọc file `.xlsx` của người dùng. Vì vậy không thể xác nhận luồng import thật đạt chuẩn chỉ từ giao diện hiện tại.

## 1. Kết quả theo đối tượng

| Đối tượng | Template hiện có | Kết luận |
| --- | --- | --- |
| Chủ nhà | `mau_chu_nha_TIMEHOUSE.xlsx`: Mã chủ, Tên, Liên hệ, Địa chỉ | Thiếu thông tin tài khoản được lưu trong Excel. Excel không có danh mục đầy đủ định danh chủ nhà để xác nhận mã/tên/CCCD/ngày cấp. |
| Tòa nhà | `mau_toa_nha_TIMEHOUSE.xlsx`: Mã tòa, Mã chủ, Tên tòa, Địa chỉ | Thiếu khu vực, số phòng, nhân sự, tình trạng, giá thuê nhà, kỳ trả, thông tin tài khoản và mã hợp đồng dịch vụ. Mã trong demo chưa có bảng ánh xạ sang mã tòa nguồn. |
| Phòng | `mau_phong_theo_toa.xlsx`: Mã tòa, Mã phòng, Tầng, Giá, Trạng thái | “Mã phòng”, “Giá”, “Trạng thái” chưa phân biệt đúng các khái niệm trong Excel. Tầng không có cột độc lập trong các bảng hóa đơn đã kiểm. Thiếu phân biệt mã ghép và số phòng. |
| Khách hàng / khách thuê | Không có template hay luồng import Excel khách hàng trong code hiện tại | Chưa có gì để đối chiếu đạt. Excel hóa đơn không phải danh mục định danh khách thuê đầy đủ. Cột “Quản lý” không được lấy làm tên khách. |

Ba template tải xuống chỉ có tiêu đề, ghi chú và header ở dòng 4; bắt đầu nhập dữ liệu từ dòng 5. Không có cột nhập liệu được gán number format, không có Data Validation, không có sheet mô tả trường, bắt buộc, kiểu dữ liệu, đơn vị hay bảng mã. `num: true` trong cấu hình phòng chỉ phục vụ hiển thị preview; bộ sinh mẫu chỉ truyền `label` và `width` nên không mang thông tin kiểu sang Excel.

## 2. Nguồn đã đối chiếu

| Mã | Workbook / sheet / vị trí | Dùng để đối chiếu |
| --- | --- | --- |
| S1 | [Thông tin nhà.xlsx](<Thông tin nhà.xlsx>), `NVVH!B1:S1`, dữ liệu từ dòng 3 | Tòa, địa chỉ, khu vực, nhân sự, thang máy, giá thuê nhà, tình trạng, tuổi nhà, kỳ trả, tài khoản nhận tiền |
| S2 | Cùng workbook, `Địa chỉ chi tiết!A1:E1`, dữ liệu từ dòng 2 | Tòa, địa chỉ, số phòng, tên quản lý, SĐT quản lý |
| S3 | [Danh sách mã HĐ điện nước mạng.xlsx](<Danh sách mã HĐ điện nước mạng.xlsx>), `năm 2026!A3:AF3` | Mã điện `B`, tên chủ HĐ điện `F`, mã nước `O`, tên chủ HĐ nước `P`, mã HĐ mạng `Y`, tên chủ HĐ mạng `Z`; cột `A` là mã tòa nhưng header trống |
| S4 | [Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx](<Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx>), `NHÀ T`, `NHÀ G`, `NHÀ S`, header dòng 2 và 4 | Mã ghép, tòa, số phòng, quản lý, kỳ TT, các loại giá/cọc, số ngày, số người, dịch vụ, trạng thái thanh toán, ngày vào ở, thời hạn, ngày hết hạn |
| S5 | [G1.31.8.26.xlsx](<G1.31.8.26.xlsx>), `HĐ T8.26  !A1:BA3` | Đối chứng cách tách mã/tòa/phòng, giá niêm yết và giá thuê thực tế; số ngày và dòng dịch vụ |
| S6 | [Hoa hồng năm 2025-2026 (1).xlsx](<Hoa hồng năm 2025-2026 (1).xlsx>), `HOA HỒNG THÁNG 9.26!D2:P2` | Mã phòng ghép, tòa, giá chốt, thời hạn HĐ, tỷ lệ HH, các header SĐT/STK. Cột SĐT `O` không có dữ liệu trong 224 dòng phòng được quét ở sheet này, nên chưa xác nhận được chất lượng giá trị. |

Đã đọc thêm header các sheet `PHÒNG MỚI THÁNG 9`, `PHÒNG MỚI THÁNG 10`, `DS phòng phá hđ`, `HOÀN CỌC` để kiểm tra khác biệt vị trí cột. Ví dụ giá hiện tại nằm ở `I2` trong `NHÀ T` nhưng `H2` trong `PHÒNG MỚI THÁNG 9`; không được áp cứng một bộ chỉ số cột cho mọi sheet.

## 3. Bảng đối chiếu trường hiện có

### Chủ nhà

| Trường template | Nguồn Excel và kiểu thực tế | Kết quả / quy tắc cần có |
| --- | --- | --- |
| Mã chủ | Không có cột mã chủ độc lập trong S1/S2 | Mã nội bộ cần danh mục riêng. Không suy ra từ mã tòa hay STK. |
| Tên | S1 `S1` là “Thông tin TK”, chứa chuỗi ghép ngân hàng và người nhận | Chưa có nguồn tên chủ nhà độc lập. Chủ tài khoản / chủ HĐ điện nước có thể khác chủ nhà. |
| Liên hệ | S2 `E1` là SĐT **quản lý** | Text cho điện thoại, giữ số 0 đầu. Không tự gán SĐT quản lý thành SĐT chủ nhà. |
| Địa chỉ | S1 `C`, S2 `B` là địa chỉ **tòa** | Không tự gán làm địa chỉ thường trú/liên hệ chủ nhà. Cần nguồn riêng để xác nhận. |
| STK chủ nhà — đang thiếu | S1 `R1`; trong các dòng mã tòa được quét có 43 ô text và 3 ô number, ngoài ra có ô trống | Chuẩn đích phải Text `@`; kiểm tra số bị mất 0 đầu/độ chính xác. Có giá trị “Tiền mặt”, phải tách phương thức trả, không coi là STK. |
| Thông tin TK — đang thiếu | S1 `S1`, text | Giữ nguyên thông tin nguồn để rà soát. Chỉ tách ngân hàng/chủ tài khoản khi có quy tắc rõ ràng. Không ghi đè tên pháp lý chủ nhà. |

Các trường đã có ở form chi tiết như loại cá nhân/pháp nhân, người đại diện, CCCD, ngày/nơi cấp, MST, email, HKTT chưa có đầy đủ nguồn đối chiếu trong các Excel nói trên. Kiểu đề xuất: định danh/điện thoại/STK/MST là Text, ngày cấp là Date. Đây là quy tắc chuẩn hóa đề xuất, không phải kết quả xác nhận từ Excel. `note.md` mục 1/2.1 chỉ tới mẫu hợp đồng `.doc` để xác định thông tin pháp lý chủ nhà.

### Tòa nhà

| Trường | Nguồn / kiểu thực tế | Kết quả / chuẩn đích |
| --- | --- | --- |
| Mã tòa | S1 `B`, S2 `A`, S4 `B`: text dạng T/G/S + mã | Text `@`. Demo dùng `TH-CG`/`TH-DD`/`TH-TX`, chưa có bảng ánh xạ sang mã nguồn. Không tự đổi tiền tố. |
| Mã chủ | Không có mã chủ độc lập | Cần FK đến danh mục chủ nhà đã xác nhận; không suy từ người đứng tên dịch vụ. |
| Tên tòa | Nguồn chủ yếu ghi mã và địa chỉ | Tên hiển thị riêng cần bổ sung, không mặc định đó là tên có trong Excel. |
| Địa chỉ | S1 `C` không có header rõ ràng; S2 `B1` là ĐỊA CHỈ, text | Có thể đối chiếu theo mã tòa giữa hai sheet; lưu Text. |
| Khu vực — thiếu | S1 `D1`, text | Text hoặc mã danh mục có ánh xạ. Không gán cứng “Hoàng Mai”. |
| Số phòng — thiếu | S2 `C1`, chủ yếu number, có formula; S1 `E` thiếu nhãn riêng | Integer không âm. Dòng formula cần lấy kết quả được tính/kiểm tra; không nhận chuỗi công thức làm số phòng. Không tự tạo danh sách phòng từ tổng số. |
| NVVH, Lead, NVVS, NSKT — thiếu | S1 `F1`, `H1`, `I1`, `J1`: tên nhân sự text | Chuẩn hóa tên/mã nhân sự có bảng liên kết; tên trùng phải báo lỗi. Không gán mặc định `NV-003`. `G` không có nhãn rõ ràng, chưa được coi là một vai trò đã xác nhận. |
| Tên quản lý / SĐT quản lý — thiếu | S2 `D1:E1`, text | Hai trường khác nhau; SĐT Text `@`. Không trộn với chủ nhà/khách thuê. |
| Thang máy — thiếu | S1 `L1`: text như “Mới”, “Cũ”, “Còn BH”, “K”, “Chủ nhà” | Đây là thông tin tình trạng/bảo trì hỗn hợp. Giữ `elevatorSourceText`; chưa đủ căn cứ chuyển tất cả thành boolean Có/Không. |
| Tình trạng nhà — thiếu | S1 `N1`: text “Mới”, “Khá mới”, “Cũ”, “Rất cũ” | Enum có bảng ánh xạ; rỗng là chưa đánh giá, không tự coi là mới. |
| Tuổi nhà — thiếu | S1 `O1`: mã text như `c`, `m`, `k`, `dt`, không phải số năm | Giữ Text; cần giải thích bảng mã trước khi đổi sang số tuổi nhà. |
| GIÁ/THÁNG — thiếu | S1 `M1`, number có định dạng tiền | Số tiền thuê **tòa trả chủ**, khác giá thuê **phòng thu khách**. Decimal/Integer VND, Excel `#,##0`, không ghép “đ” vào giá trị. |
| KỲ — thiếu | S1 `P1`, number 2/3/4/6 | Integer dương. Công thức Q thường dùng M × P gợi ý kỳ thanh toán theo tháng, nhưng header không ghi đơn vị nên cần xác nhận. |
| TỔNG TIỀN — thiếu | S1 `Q1`: formula và số nhập tay | Thuộc nghĩa vụ/lịch thanh toán; không ghi thẳng vào giá thuê. Không âm thầm thay số nhập tay bằng M × P. |
| Mã điện / nước / mạng — thiếu | S3 `B3`, `O3`, `Y3`: mixed text/number, có trường nhiều mã ghép trong dữ liệu | Mã phải Text `@`, giữ số 0 đầu, hỗ trợ nhiều HĐ dịch vụ/tòa bằng bảng con. Không coi là tiền hoặc công tơ phòng. |

Số tầng, diện tích đất/xây dựng/sàn, PCCC/ĐKKD và thời gian vận hành có trong mô hình ứng dụng nhưng chưa có cột đối chiếu đầy đủ ở các Excel trực tiếp trên. Không thể chứng nhận những trường đó đã khớp Excel.

### Phòng và dữ liệu thuê đi kèm

| Trường | Nguồn / kiểu thực tế | Kết quả / chuẩn đích |
| --- | --- | --- |
| Mã tòa | S4 `B2`, text | Text, FK theo danh mục tòa đã ánh xạ. |
| Mã phòng | S4 `A2` “Mã” là mã ghép, `C2` “Phòng” là số/nhãn phòng | Phải tách `sourceRoomCode` (mã ghép) và `roomNumber` (số/nhãn cục bộ), cả hai chuẩn đích là Text. Không coi hai cột là một. |
| Tầng | Không có cột tầng độc lập ở S4/S5 | Chưa đối chiếu được. Không tự suy từ ký tự đầu của phòng, vì phòng có nhãn chữ/số hỗn hợp. |
| Giá | S4 `G2` Giá Niêm yết, `H2` Giá QL, `I2` Gía phòng hiện tại | Đổi tên trường import cho rõ nghĩa: giá niêm yết phòng → `room.rent`; giá thực tế/giá quản lý cần lưu ở đúng hồ sơ HĐ/nguồn, không ghi đè chung. Các giá là Number VND. |
| Trạng thái | S4 `AY2` là kết quả **thanh toán**, thường là formula | Không ánh xạ thẳng sang `vacant/occupied/maintenance/reserved`. Trạng thái phòng cần nguồn/quy tắc riêng. |
| Kỳ TT | S4 `E2`, number | Integer dương, cần xác nhận đơn vị; thuộc HĐ, không phải tầng phòng. |
| Cọc | S4 `F2` cọc cũ và `J2` cọc mới; number/formula | Hai ý nghĩa riêng. Không gộp, cộng hoặc suy số dư cọc khi chưa có đối chiếu. |
| Ngày ở / Ngày DV | S4 `K2:L2`, number | Số ngày tính tiền, Integer; **không phải Date**. |
| Số người | S4 `O2`, number | Integer không âm; thuộc hồ sơ lưu trú/HĐ. |
| NGÀY VÀO Ở | S4 `BA2`, phần lớn Date; `NHÀ G` có cả text | Date thực của Excel, hiển thị `dd/mm/yyyy`. Chuỗi không rõ định dạng phải báo lỗi, không tự đảo ngày/tháng. |
| THỜI HẠN | S4 `BB2`, text như `6th`, `7TH`, `12th`, `13th` | Giữ text nguồn; có thể chuẩn hóa thành `termMonths` Integer bằng quy tắc hậu tố tháng rõ ràng, kèm kiểm tra. Không parse bằng quy tắc số tổng quát. |
| NGÀY HẾT HẠN HĐ | S4 `BC2`, Date | Date thực, kiểm tra không trước ngày bắt đầu. Với sheet khác phải dò đúng header/vùng bảng, không áp cứng BC. |

Các cột SL, đơn giá, thành tiền của điện/nước/vệ sinh/mạng/thang máy/xe điện/máy giặt/DV khác thuộc bảng giá HĐ hoặc dữ liệu hóa đơn theo kỳ. Cột thành tiền/tổng DV/công nợ/trạng thái thanh toán thường là công thức. Không đưa toàn bộ các cột đó vào master phòng rồi ghi thành tiền/công nợ ban đầu.

### Khách hàng

Chưa có `CUS-IMP`, cấu hình `registerImport` cho khách hay nút Import Excel ở CUS-01. Hiện chỉ có nhập tay và OCR giấy tờ/hợp đồng.

Các sheet hóa đơn chứa mã tòa/phòng và hồ sơ thuê/tài chính, nhưng không cung cấp đủ danh mục Mã khách – Họ tên – Ngày sinh – CCCD – Nơi/ngày cấp – Thường trú. `Quản lý` ở S4 `D2` là nhân sự quản lý, không phải tên khách. “Tên chủ HĐ” ở S3 là người đứng tên dịch vụ. “STK THANH TOÁN” trong bảng hoa hồng không đủ căn cứ để coi là tài khoản của khách thuê.

Do đó cần danh mục khách hoặc kết quả OCR được kiểm tra làm nguồn định danh, cùng bảng liên kết khách ↔ HĐ ↔ phòng ↔ tòa. Chỉ có dữ liệu phòng/hóa đơn thì chưa đủ cơ sở tạo hồ sơ định danh khách hàng.

## 4. Lỗi luồng import đã xác minh

| ID | Mức độ | Bằng chứng và tác động |
| --- | --- | --- |
| IMP-01 | Cao | Cả ba file mẫu có 0 cột nhập được gán format và 0 Data Validation. Chưa có ràng buộc kiểu, mã, đơn vị, enum hay bắt buộc ở file tải xuống. |
| IMP-02 | Cao | `imp.pick` chỉ chuyển bước; `cfg.sample()` cung cấp dữ liệu và mảng lỗi viết sẵn. Không có đọc `.xlsx`/chuẩn hóa/header mapping/kiểm tra kiểu dựa trên file người dùng. |
| IMP-03 | Cao | `OWN-IMP.commit()` luôn tạo `kind: 'person'`; dòng mẫu có tên công ty vẫn lưu cá nhân, trong khi form hỗ trợ `org`. |
| IMP-04 | Cao | Chủ nhà upsert chỉ cập nhật địa chỉ, bỏ tên và liên hệ dù có trong template. Tòa upsert cũng chỉ cập nhật địa chỉ; phòng upsert chỉ cập nhật giá. Các cột khác không được áp dụng đầy đủ. |
| IMP-05 | Cao | Tòa mới bị gán cứng khu vực “Hoàng Mai”, quản lý `NV-003`, tầng 3, dù file không có các trường này. Không thể coi là dữ liệu đọc từ Excel. |
| IMP-06 | Cao | Phòng mới luôn lưu `status: 'vacant'`, `area: 25`. Kịch bản truyền trạng thái “Đang thuê” vẫn tạo phòng “Trống”; diện tích 25 không có trong dòng nguồn. Mã công tơ cũng được tự sinh, không phải mã HĐ dịch vụ đọc từ tài liệu. |
| IMP-07 | Trung bình | File tải mẫu bắt đầu dữ liệu ở dòng 5, trong khi các dòng mẫu kiểm tra lỗi được đánh số 2–6. Vị trí lỗi mô phỏng chưa khớp template do chính ứng dụng sinh ra. |
| IMP-08 | Cao | Chưa có ánh xạ mã nguồn ↔ mã nội bộ và chưa phân biệt mã ghép/số phòng, trạng thái thanh toán/trạng thái phòng, SĐT quản lý/SĐT chủ nhà. |
| IMP-09 | Cao | Chưa có template khách hàng. Nguồn Excel hiện có không đủ để xác nhận danh mục định danh khách. |

Tham chiếu code: `js/views/shared.js` (importFlow, imp.template, imp.pick, imp.commit), `js/views/owners.js` (OWN-IMP), `js/views/buildings.js` (BLD-IMP), `js/views/rooms.js` (ROOM-IMP), `js/views/customers.js` (CUS-01), `js/xlsx.js` (buildXlsx).

## 5. Chuẩn kiểu dữ liệu cần áp dụng khi sửa

| Nhóm | Giá trị chuẩn | Excel | Kiểm tra khi đọc |
| --- | --- | --- | --- |
| Mã, điện thoại, CCCD, MST, STK, mã điện/nước/mạng | String, không ép Number | `@` | Giữ 0 đầu, kiểm tra khoảng trắng/độ dài theo danh mục. Số đã bị Excel làm mất chữ số/0 đầu không tự phục hồi. Dữ liệu mask không được coi là số đầy đủ. |
| Số phòng tổng, tầng, số người, số ngày, số tháng | Integer | `0` hoặc `#,##0` | Chặn số lẻ, ký tự tiền/đơn vị và giá trị ngoài miền. Blank khác 0. Miền cụ thể cần theo trường, không ép mọi trường > 0. |
| Tiền và đơn giá | Number/Decimal | `#,##0` hoặc độ chính xác đã chốt | Không dùng chuỗi “3tr4”, “4.000đ” làm giá trị số. Có quy tắc dấu phân cách rõ ràng; không xóa mọi ký tự rồi ghép thành số. Tiền công nợ có dấu trong nguồn không được ép sang tiền thuê không âm. |
| Diện tích, chỉ số công tơ | Decimal | `0.00` hoặc độ chính xác nguồn | Không ép Integer khi nguồn cho phép phần lẻ; kiểm tra đơn vị m²/kWh/m³ và số cũ/mới. |
| Ngày tháng | Date; chuẩn nội bộ ISO `yyyy-mm-dd` | Numeric Excel Date, hiển thị `dd/mm/yyyy` | Kiểm tra ngày hợp lệ, hệ ngày workbook 1900/1904 khi đọc serial, không chuyển ngày bằng múi giờ làm lệch ngày. Từ chối chuỗi nhập mơ hồ. |
| Tỷ lệ | Decimal 0–1 nếu schema định nghĩa tỷ lệ | `0%`/`0.0%` | Ví dụ 0,35 hiển thị 35%, không lưu 35 rồi hiển thị 3500%. Cột tỷ lệ HH là dữ liệu hoa hồng, không tự thêm vào master khách/phòng. |
| Trạng thái / danh mục | Enum tách theo đối tượng | Dropdown từ bảng mã | Tách trạng thái phòng, HĐ, cọc và thanh toán. Giá trị không biết phải báo lỗi, không thay bằng mặc định hợp lệ. |
| Công thức | Công thức và kết quả được tính có nguồn gốc | Formula | Không dùng chuỗi công thức như giá trị nhập. Cached result thiếu/cũ cần được tính lại hoặc báo không thể xác minh. |

Không sao chép máy móc `number_format` của ô nguồn để quyết định kiểu nghiệp vụ. Ví dụ header “SĐT khách” trong bảng hoa hồng có format số, nhưng điện thoại vẫn là Text theo ngữ nghĩa. Nguồn hiện có cả text/number/formula trong cùng cột mã; chuẩn đích cần thống nhất và phải có kiểm tra khi chuyển đổi.

Thứ tự xử lý phù hợp: xác định schema có nguồn cho từng trường → bảng mã/liên kết → template và Data Dictionary → đọc file/kiểm tra kiểu → preview và lỗi đúng dòng/cột → lưu đầy đủ trường theo chính sách tạo mới/cập nhật. Trường chưa có nguồn/định nghĩa phải được ghi là chưa xác nhận, không tự tạo dữ liệu để lấp chỗ trống.

## 6. Bằng chứng và cách chạy lại

- [Metadata Excel](qa/import-schema/source-metadata.json): tên workbook/sheet/header, số lượng kiểu ô, định dạng và phạm vi quét. Không chứa hồ sơ cá nhân nguồn. Chạy `python -X utf8 tools/audit-import-sources.py`.
- [Kết quả kiểm tra trình duyệt](qa/import-schema/runtime-audit.json): cấu trúc ba file mẫu, thiếu import khách hàng và các quan sát khi thử ghi trên seed tạm.
- `tools/qa-import-schema.playwright.js`: chạy bằng Playwright `browser_run_code` sau khi mở server `python -m http.server 8780 --bind 127.0.0.1`. Seed được thay tạm trong bộ nhớ và khôi phục; không gọi persist/flush cho dữ liệu thử.

Base commit lúc kiểm tra là `70763e3`; workspace có các thay đổi chưa commit từ công việc khác. Kết quả mô tả working tree tại thời điểm chạy, không khẳng định toàn bộ working tree trùng commit này. Các file ứng dụng và Excel nguồn không được sửa trong đợt kiểm tra này.
