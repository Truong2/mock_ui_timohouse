# TIMEHOUSE — Trả lời các vấn đề cần quyết định trong MOCKUP DECISIONS

**Ngày đối chiếu:** 20/10/2026  
**Phạm vi:** các mã D-01…D-09, PKG, R-01…R-09, G-01…G-10, CR-RPT-01 và những chỗ thiếu nguồn trong `TIMEHOUSE_MOCKUP_DECISIONS.md`.

> **Quy ước:** **[CÓ CĂN CỨ]** = thấy nội dung trong tài liệu/hợp đồng/bảng tính đã cung cấp; **[ĐỀ XUẤT — CHỜ DUYỆT]** = quyết định thiết kế và nghiệp vụ được đề xuất để PM/khách hàng phê duyệt; **[CHƯA XÁC MINH]** = không có tài liệu hoặc tài liệu mâu thuẫn. Không coi phương án đề xuất là nghiệp vụ khách hàng đã xác nhận.

## I. Trả lời G-01 đến G-10 — trang Chi tiết tòa nhà

### G-01 — DT M5/M10/M15 là gì?
**Trả lời đề xuất:** Chọn **số tiền thu lũy kế từ đầu kỳ đến hết ngày 05, 10, 15**, theo **ngày thực nhận** và **phiếu thu đã xác nhận**, sau khi lọc đúng kỳ, tòa, hóa đơn. M5 ≤ M10 ≤ M15 đối với cùng một tập giao dịch hợp lệ. Doanh thu tăng thêm giữa mốc dùng `M10 - M5`, `M15 - M10` nhằm không đếm lại tiền đã thu. Phiếu ghi nhận sau ngày 15 không đi vào A của *hiệu suất thực tế*, nhưng vẫn phải đi vào sổ tiền/công nợ phù hợp.

**Trạng thái:** [CÓ CĂN CỨ] cho cấu trúc chênh lệch mốc từ tài liệu lương; quy định ngày thực nhận/phiếu xác nhận là [ĐỀ XUẤT — CHỜ DUYỆT] đã đặt trong §7.3 của decision log.

### G-02 — Hiệu suất tạm tính và thực tế
**Trả lời đề xuất:**
- **Tạm tính tại thời điểm T:** `[(Tổng thu đã xác nhận đến T) × (1 - B) + C] / Tổng giá niêm yết × 100%`; **không dùng hệ số 100/90/70**, kể cả tiền thu sau 15. Phải hiện rõ *“Tạm tính đến [thời điểm] — chưa áp trọng số”*.
- **Thực tế mốc kỳ:** `D / Tổng giá niêm yết × 100%`, với `D = A - A×B + C`, chỉ hiển thị là số mốc đã chốt sau ngày 15 (nếu vẫn chưa khóa kỳ phải ghi *“chưa khóa kỳ”*). Công nợ và doanh thu sau ngày 15 vẫn được quản lý riêng.
- **Tỷ lệ lấp đầy phòng** là KPI độc lập: `Số phòng có hợp đồng/đang thuê ÷ Số phòng cho thuê được ×100%` tại một thời điểm xác định.

**Trạng thái:** [ĐỀ XUẤT — CHỜ DUYỆT]; khớp chính sách mô phỏng ở §7.3, chưa có xác nhận bên ngoài.

### G-03 — Có cọc mới, khách đóng tiền phòng 3 tháng
**Trả lời:** Tài liệu `CÁCH TÍNH LƯƠNG PHÒNG VẬN HÀNH.docx` đã nêu ngoại lệ TH1:
1. `DT phải thu chuẩn hóa = DT phải thu trên link − cọc mới − phần tiền thuê các tháng tương lai thu trước`.
2. `DT mốc 1 chuẩn hóa = DT M5 − cọc mới − phần tiền thuê các tháng tương lai thu trước`.
3. Với phòng **đến kỳ thu 3 tháng**, tài liệu hướng dẫn trừ **2 tháng tiền nhà**; nếu đã thu từ kỳ trước thì tài liệu hướng dẫn **cộng 1 tháng tiền nhà** vào kỳ được hưởng.
4. `Mốc 2 = (DT M10 − DT M5)×90%`; `Mốc 3 = (DT M15 − DT M10)×70%` theo tài liệu. Lưu ý văn bản TH1 ghi lặp “mốc 2” ở dòng thứ ba — cần sửa nhãn thành “mốc 3”.

**Cách làm phần mềm đề xuất:** lưu nguyên giao dịch thực thu; tách bằng các dòng phân bổ `deposit`, `rent_current_period`, `rent_prepaid_future`, `service`, `forfeited_deposit`; báo cáo hiệu suất dùng **giá trị quy thuộc kỳ** đã chuẩn hóa, tuyệt đối không xóa/đổi phiếu thu gốc. Nếu hợp đồng thu 3 tháng, phân bổ 1 tháng tiền nhà cho mỗi tháng được hưởng để không làm doanh thu kỳ thu tiền tăng vọt. Không trừ cọc hai lần.

**Còn thiếu:** cách điều chỉnh riêng M10/M15 trong các tình huống thu nhiều kỳ và ngày nhận chênh kỳ; cần khách xác nhận bằng 2–3 ví dụ có số. [CÓ CĂN CỨ] nguyên tắc TH1; chi tiết thuật toán là [ĐỀ XUẤT — CHỜ DUYỆT].

### G-04 — Lợi nhuận tòa nhà tính thế nào?
**Trả lời:** Cần **hai chế độ tách rời**, tránh dùng cùng một nhãn “lãi”:

1. **Báo cáo kinh doanh theo kỳ (P&L):**
   - `Doanh thu kinh doanh = tiền phòng thuộc kỳ + dịch vụ thuộc kỳ + doanh thu khác đủ điều kiện + cọc bị giữ đã xác nhận`.
   - **Không** ghi *cọc khách mới nhận* là doanh thu; **không** tự ghi *hoàn cọc* là chi phí.
   - `Giá vốn = chi phí thuê chủ nhà thuộc kỳ + giá vốn dịch vụ + các khoản được phân loại là giá vốn`.
   - `LNG = doanh thu kinh doanh − giá vốn`.
   - `CPBH/CPVH = lương, văn phòng, marketing/hoa hồng, sửa chữa và chi phí vận hành khác được phân bổ kỳ`.
   - `LNR = doanh thu kinh doanh − giá vốn − CPBH/CPVH`.
   - Thiết bị mua mới cần ghi nhận riêng **chi mua tài sản** trên dòng tiền, và ghi nhận khấu hao vào kinh doanh **khi có chính sách được duyệt**; nếu phải xuất chính xác *mẫu quản trị cũ*, giữ thêm cột `Điều chỉnh theo mẫu` để đối chiếu, không thay thế báo cáo chuẩn.
2. **Dòng tiền thực nhận/thực chi:** `Tiền thực thu đã xác nhận − tiền thực chi đã xác nhận` theo ngày giao dịch; gồm cọc nhận và hoàn cọc, tiền mua sắm, tiền trả chủ nhà thực tế. Có bảng đối chiếu `Kinh doanh ↔ Dòng tiền`.
3. **Kỳ báo cáo:** theo tháng dương lịch; trường hợp thuê/giá thay đổi giữa tháng, chia theo ngày hiệu lực hợp đồng hoặc quy tắc kỳ đã phê duyệt. Chi phí thuê chủ nhà ghi nhận theo **tháng được sử dụng**, ngay cả khi thực trả ba tháng/lần.

**Căn cứ:** `G1.31.8.26.xlsx`, sheet `BÁO CÁO THÁNG 8`, dùng `LNG = DT − GV`, `LNR = DT − TCP`; `BÁO CÁO KINH DOANH THÁNG 8.xlsx` có chế độ tổng/kinh doanh. Phân loại chi phí mua sắm và ngoại lệ ghi nhận vẫn phải PM xác nhận. [CÓ CĂN CỨ] công thức LNG/LNR trong mẫu; [ĐỀ XUẤT — CHỜ DUYỆT] chính sách kỳ và tài sản.

### G-05 — Diện tích nào?
**Trả lời đề xuất:** Không dùng một ô “diện tích” chung. Có ba ô riêng `Diện tích đất (m²)`, `Diện tích xây dựng (m²)`, `Tổng diện tích sàn (m²)`; nếu chưa có chứng từ thì để **Chưa cập nhật**, không suy đoán. Trường diện tích hiển thị trong danh sách (nếu cần) phải ghi nhãn đầy đủ, ví dụ `Tổng diện tích sàn`. **Trạng thái:** [ĐỀ XUẤT — CHỜ DUYỆT] (file nguồn chưa xác định loại diện tích).

### G-06 — Tiêu chí Mới / Trung bình / Cũ
**Trả lời đề xuất:** Thực tế file `Thông tin nhà.xlsx` đã có `Khá mới`, `Cũ`, `Rất cũ`. Nên đặt cấu hình danh mục `Mới`, `Khá mới`, `Trung bình`, `Cũ`, `Rất cũ`, `Chưa đánh giá`; **không tự động tính bằng tuổi nhà** khi chưa có tiêu chuẩn. Người được phân quyền đánh giá nhập mức và `Ngày đánh giá`, `Người đánh giá`, `Ghi chú minh chứng`. Nếu nhất thiết chỉ ba mức theo mockup, phải có bảng mapping/biên bản duyệt. **Trạng thái:** [CÓ CĂN CỨ] có các tên phân loại thực tế; [ĐỀ XUẤT — CHỜ DUYỆT] danh mục chuẩn.

### G-07 — PCCC/ĐKKD gồm giấy tờ gì; ai đứng tên?
**Trả lời đề xuất:**
- **PCCC:** lưu `Loại hồ sơ`, `Số văn bản`, `Ngày cấp`, `Cơ quan cấp`, `Ngày hiệu lực/hết hạn (nếu có)`, `Chủ thể`, `Tệp chứng từ`, `Trạng thái xác minh`. Loại hồ sơ cần phân theo yêu cầu áp dụng thực tế (ví dụ giấy xác nhận/biên bản nghiệm thu, hồ sơ kiểm tra, tài liệu thiết kế), **không mặc định mọi tòa bắt buộc có cùng một giấy**.
- **ĐKKD:** lưu pháp nhân/cá nhân đứng tên, MST/số đăng ký, cơ quan cấp, ngày cấp và bản scan. **Chủ thể ĐKKD = chủ thể đăng ký kinh doanh thực tế** (có thể khác chủ sở hữu), không tự lấy chủ nhà làm mặc định.
- Tối thiểu 4 trạng thái: `Chưa cập nhật`, `Có hồ sơ — chưa kiểm tra`, `Đã xác minh`, `Không áp dụng / cần làm rõ`.

**Trạng thái:** [ĐỀ XUẤT — CHỜ DUYỆT]; tính bắt buộc pháp lý cần xác minh theo loại tòa.

### G-08 — Số người/1 vai trò; 1 nhân sự phụ trách nhiều tòa?
**Trả lời đề xuất:** Có thể **nhiều người cùng vai trò** và **một người phụ trách nhiều tòa**; không giới hạn cứng số người. Mỗi phân công chứa `Tòa`, `Nhân sự`, `Vai trò`, `Chính/Phụ`, `Ngày bắt đầu`, `Ngày kết thúc`, `Trạng thái`; kiểm tra giao nhau của phân công **chính** nếu nghiệp vụ yêu cầu chỉ một người chịu trách nhiệm chính tại một thời điểm. Giữ 4 vai trò NV vận hành, trưởng nhóm, vệ sinh, kỹ thuật; thêm quyền truy cập riêng khỏi phân công nhân sự. **Trạng thái:** [CÓ CĂN CỨ] một số nhân sự lặp lại trên nhiều tòa trong `Thông tin nhà.xlsx`; quy tắc phân công chính là [ĐỀ XUẤT — CHỜ DUYỆT].

### G-09 — Danh sách trường tài sản
**Trả lời đề xuất:** Phân biệt **(1) Tài sản bàn giao từ chủ nhà** và **(2) Tài sản công ty đầu tư thêm**. Mỗi dòng có `Mã`, `Tên`, `Nhóm`, `Tòa`, `Phòng/vị trí`, `Số lượng`, `Đơn vị`, `Tình trạng`, `Ngày ghi nhận`, `Giá trị`, `Bên sở hữu/bên chịu chi`, `Nguồn chứng từ`, `Người cập nhật`, `Ghi chú`; dòng đầu tư thêm bổ sung `Ngày mua`, `Nguyên giá`, `Thời hạn sử dụng/khấu hao (nếu có)`. Lưu nhật ký sửa/di chuyển/thanh lý. **Trạng thái:** [ĐỀ XUẤT — CHỜ DUYỆT].

### G-10 — Lịch thanh toán chủ nhà và nhắc lịch
**Trả lời:** Lịch phải lấy từ **hợp đồng thuê tòa và phụ lục có hiệu lực**, không hardcode một chu kỳ cho toàn công ty. Hợp đồng mẫu TH01 ghi `01/09/2026–31/08/2031`, giá `114.000.000 đồng/tháng`, trả `03 tháng/lần` trong `01–10` tháng đầu kỳ; mỗi kỳ đủ 3 tháng là `342.000.000 đồng`, đến hạn cuối ngày `10`. Cần trường `Ngày bắt đầu/kết thúc`, `Kỳ trả`, `Số tiền`, `Ngày đến hạn`, `Trạng thái duyệt`, `Đã trả`, `Còn lại`, `Chứng từ`, `Bản hợp đồng/phụ lục`.

**Nhắc lịch đề xuất:** thông báo nội bộ trước hạn 7 ngày, trước hạn 3 ngày, ngày đến hạn và khi quá hạn; cấu hình cho phép bật/tắt. **Trạng thái:** [CÓ CĂN CỨ] thông số riêng hợp đồng TH01; [ĐỀ XUẤT — CHỜ DUYỆT] nhắc lịch.

## II. Trả lời R-01 đến R-09 — báo cáo doanh thu, kinh doanh, chia cổ phần

| Mã | Quyết định trả lời để triển khai | Trạng thái |
| --- | --- | --- |
| **R-01** | **Tách `Doanh thu kinh doanh` và `Tổng dòng tiền thu/chi`.** Hóa đơn thuộc kỳ là căn cứ doanh thu kinh doanh; thực thu là căn cứ dòng tiền. Cọc mới/hoàn cọc chỉ vào dòng tiền; cọc bị giữ khi khách bỏ cọc và đủ điều kiện mới đưa vào thu nhập. Xuất thêm bảng đối chiếu và chênh lệch. Không dùng tên `Tổng doanh thu` cho tổng có cọc mà không chú thích. | [ĐỀ XUẤT — CHỜ DUYỆT]; mẫu G1 dùng dòng tiền kiểu `DT TRÊN HĐ - HOÀN CỌC`. |
| **R-02** | Ba dòng `vệ sinh / thang máy / máy giặt` **chỉ chia đều** khi đó là một gói phí chung theo mẫu và có quy tắc phân bổ đã chốt. Nếu hợp đồng/biểu phí tách riêng phải lấy từng khoản đúng thực tế; không chia mặc định 1/3 cho mọi tòa. Bổ sung `service_code` và `allocation_rule` có hiệu lực. | [CÓ CĂN CỨ] G1 ba dòng bằng nhau; [ĐỀ XUẤT — CHỜ DUYỆT] áp dụng chung. |
| **R-03** | `GV = tiền thuê chủ nhà thuộc kỳ + giá gốc dịch vụ + chi phí trực tiếp được phân loại là GV`; `LNG = DT kinh doanh − GV`. Mua sắm thiết bị ghi dòng tiền/tài sản riêng; có thể đưa vào **chế độ tái hiện mẫu lịch sử** để so sánh nhưng không gộp không nhãn vào P&L chuẩn. | [CÓ CĂN CỨ] công thức G1; [ĐỀ XUẤT — CHỜ DUYỆT] xử lý tài sản. |
| **R-04** | Giữ `TCP = GV + CPBH/CPVH`; `LNR = DT − TCP`. Lương, marketing, hoa hồng, sửa chữa, văn phòng phải có mã khoản mục riêng và nguồn chứng từ; khoản dùng chung được phân bổ một lần. Nhãn `CPBH` giữ trong mẫu xuất file; màn nghiệp vụ có thể chú giải nó đang bao gồm cả **chi phí vận hành**. | [CÓ CĂN CỨ] G1 sheet báo cáo tháng 8. |
| **R-05** | **Giai đoạn A:** cho nhập tiền phân bổ chi phí chung theo từng tòa/kỳ và lưu nguồn. **Nếu tự phân bổ:** đặt `Phân bổ theo số phòng khả dụng bình quân kỳ` làm mặc định đề xuất: `CP chung × phòng quy đổi của tòa / tổng phòng quy đổi`. Hỗ trợ quy tắc theo doanh thu, tỷ lệ cố định, hoặc giá trị trực tiếp sau này; lưu phiên bản quy tắc và điều chỉnh làm tròn. Danh mục gốc bao gồm lương quản lý tổng/TP vận hành/nguồn/KD/kế toán/KT/bảo vệ, VP, marketing chung và các nhóm dùng chung được phê duyệt. | [ĐỀ XUẤT — CHỜ DUYỆT]. Mẫu có các khoản chung nhưng chưa chứng minh một quy tắc nhất quán. |
| **R-06** | Lương hiệu suất NV quản lý tòa tính từ HS theo công thức tài liệu, phân vào **chi phí trực tiếp của tòa**. Lương trưởng nhóm `10.000 đ/phòng` theo quy tắc bảng lương thực tế cần xác nhận. Phần lương quản lý tổng và các khoản hỗ trợ mang tính chung phân bổ qua nhóm chi chung; không được tính trùng lương của cùng người ở cả hai nơi. | [CÓ CĂN CỨ] cách tính HS; [CHƯA XÁC MINH] quy tắc lương cứng/hỗ trợ và 10k/phòng có áp dụng rộng rãi. |
| **R-07** | **Phải tách “Chi phí kinh doanh thuộc kỳ” và “Tiền đã chi”.** Tiền thuê chủ nhà tháng đó được tính chi phí kinh doanh theo hợp đồng ngay cả khi phiếu chi chưa duyệt/chưa thanh toán, với nhãn `Dự kiến/cần đối chiếu`. Bảng dòng tiền chỉ cộng **phiếu chi đã xác nhận**; báo cáo cần cảnh báo phiếu chờ duyệt. Phê duyệt chứng từ phát sinh vẫn là điều kiện chốt số. | [ĐỀ XUẤT — CHỜ DUYỆT]; nếu bắt buộc tuân SRS hiện tại “chỉ chi đã duyệt”, phải tạo cột điều chỉnh tự động cho nghĩa vụ tiền thuê. |
| **R-08** | **Lợi nhuận chia = lợi nhuận đủ điều kiện × tỷ lệ sở hữu hợp lệ**, sau khi trừ quỹ/dự phòng (nếu có). `Vốn = tỷ lệ × 48 triệu tiền thuê nhà` và `Tổng nhận = Vốn + LN ròng` chỉ được xem là **công thức tái hiện mẫu G1**, không được hiểu chắc chắn là hoàn vốn/tiền phải trả. Hệ thống phải lưu riêng `Vốn góp`, `Vốn đang còn`, `Hoàn vốn kỳ`, `Lợi nhuận được chia`, `Thực chi`, `Còn phải trả`. Chỉ sinh lệnh chi/hoàn vốn sau khi khách phê duyệt ý nghĩa cột `Vốn`. | [CÓ CĂN CỨ] công thức trong Excel G1; [CHƯA XÁC MINH] bản chất vốn, ngày chi và công thức được chia. |
| **R-09** | `Phòng mới = phòng/HĐ bắt đầu có hiệu lực trong kỳ`; `Phá HĐ = HĐ kết thúc trước hạn do vi phạm có ghi nhận/duyệt và cọc bị giữ theo chứng từ`; `Phòng trống cuối kỳ = phòng có thể khai thác nhưng không có HĐ đang hiệu lực tại 23:59 ngày cuối kỳ`. Báo cáo thêm `Số ngày phòng trống trong kỳ` để đo tổn thất doanh thu; không coi phòng đang sửa/không khai thác là phòng trống kinh doanh nếu đã loại khỏi mẫu số. | [ĐỀ XUẤT — CHỜ DUYỆT]; mẫu G1 có các dòng đếm nhưng không định nghĩa ngày chụp. |

### Kiểm tra chéo quan trọng tại G1 tháng 8
- `G1.31.8.26.xlsx` › `BÁO CÁO THÁNG 8`: `DT` ô C2 = **84.186.000**, `GV` C34 = **61.195.068**, `CPBH` C71 ≈ **8.325.962,75**, `LNG` C73 = **22.990.932**, `LNR` C74 ≈ **14.664.969,25**; công thức tại C73 là `=C2-C34`, C74 là `=C2-C72`.
- Một số dòng chi tiết dùng **liên kết workbook ngoài** (`'[17]PHÒNG MỚI THÁNG 8'`, `'[17]HOÀN CỌC'`). Không thể coi bảng chi tiết đã hoàn toàn tự khớp tổng nếu thiếu những workbook nguồn. Cần file nhập doanh thu/cọc gốc và quy tắc đối chiếu để chứng minh dữ liệu phát sinh.
- Bảng cổ phần có `Vốn = tỷ lệ × 48.000.000` và `Tổng nhận = Vốn + LN ròng`, nhưng đó là **công thức mẫu**, chưa phải quy trình thanh toán vốn hàng tháng đã được xác nhận.

## III. Trả lời D-01 đến D-09 — quyết định chung SRS/mockup

| Mã | Câu trả lời / phương án triển khai | Trạng thái |
| --- | --- | --- |
| **D-01** | Không để `Required?` trong bản bàn giao cuối. Danh mục bắt buộc tối thiểu: **chủ nhà** (mã, tên/chủ thể, thông tin liên hệ phù hợp); **tòa** (mã, tên, địa chỉ, số phòng); **phòng** (mã, tòa, trạng thái); **HĐ** (đối tượng, ngày hiệu lực, giá, kỳ thanh toán); **công tơ** (ngày chốt, số kỳ trước/kỳ sau hoặc loại ngoại lệ); **phiếu thu/chi** (kỳ, số tiền, ngày, trạng thái, đối tượng). Thông tin cá nhân/STK phải phân quyền và mask theo quyền; kiểm tra mã trùng, ngày kết thúc trước ngày bắt đầu, giá âm, HĐ chồng hiệu lực bất thường. Trường phụ thuộc chính sách đánh `Chưa bắt buộc` đến khi duyệt. | [ĐỀ XUẤT — CHỜ DUYỆT] ma trận field-level. |
| **D-02** | A nhận **một** mẫu OCR HĐ; B thêm loại mẫu và confidence; C có màn đối chiếu; D có thư viện mẫu/audit theo phân tầng SRS đang thể hiện. Hai PDF đồng bộ hiện có là **mẫu** OCR (HĐ chủ nhà và HĐ khách thuê), không thể suy ra tỷ lệ nhận dạng thực tế 85%. Hệ thống OCR thực tế phải cho người dùng duyệt/chỉnh từng trường; **85% là ngưỡng demo, không phải cam kết độ chính xác**. | [CÓ CĂN CỨ] 2 mẫu; [CHƯA XÁC MINH] chất lượng OCR/provider/gói. |
| **D-03** | **Đơn giá theo hợp đồng/biểu phí của tòa, phòng, dịch vụ, ngày hiệu lực**; không hardcode 3.800/4.000 và 28–30k/m³ cho tất cả. HĐ mẫu P302 có điện **4.000 đ/kWh**, nước **120.000 đ/người/tháng**, mạng **100.000 đ/phòng/tháng** (khác nước theo công tơ). Thu thập thêm **giá mua** đầu vào phục vụ lợi nhuận; giá bán và giá mua là 2 trường khác nhau. Chốt chỉ số theo kỳ hóa đơn/công tơ; nếu `số mới < số cũ`, **chặn ghi nhận thông thường** nhưng cho phép tạo yêu cầu ngoại lệ `thay công tơ/quay vòng/chỉnh chỉ số` có ảnh, chỉ số bàn giao và người duyệt. Prorate giá phòng/dịch vụ theo ngày hiệu lực phải thành rule có version, chưa tự điền công thức cứng. | [CÓ CĂN CỨ] biểu phí P302, file dự kiến lợi nhuận; [ĐỀ XUẤT — CHỜ DUYỆT] quy tắc đặc biệt. |
| **D-04** | Áp công thức G-01/G-02/G-03, tách doanh thu kỳ, tiền thực thu, khoản cọc, dịch vụ; `A = M5 + 0,9×(M10−M5) + 0,7×(M15−M10)`; `B = DV phải thu/DT phải thu theo tòa`; `C = tiền phòng phát sinh thu đủ + cọc bị giữ hợp lệ`; `D = A−A×B+C`; `HS = D/∑giá niêm yết×100%`. Giữ cả số nguồn và bước tính để audit. Đề nghị không để tổng doanh thu gộp cọc tạo ra HS sai. | [CÓ CĂN CỨ] tài liệu lương, trừ các ngoại lệ còn chờ chốt. |
| **D-05** | Zalo OA: **không phát sinh gửi thật** khi chưa kết nối provider, được phép gửi và kiểm thử OA chính thức. Demo gắn `SIMULATED`; gửi thực phải có liên kết OA, quyền gửi, template hợp lệ, HĐ/đầu mối người nhận đã xác nhận, log gửi/trả lỗi/chống gửi trùng. Chi phí theo provider tách khỏi giá phần mềm. | [ĐỀ XUẤT — CHỜ DUYỆT], thiếu thông tin nhà cung cấp. |
| **D-06** | Lấy công thức HS của D-04, bảng đơn giá theo **bậc hiệu suất + thâm niên** của trang 2 tài liệu lương. **Bất nhất phải xử lý trước khi code chính thức:** trang 1 ghi `Mức lương/phòng = HS × đơn giá / 100`, nhưng ví dụ 91%/thâm niên >1 năm lại tính `91×110.000/90 = 111.222`. **Không được ngầm chọn `/90` cho tất cả bậc**. Cần chốt mẫu số cho từng bậc; tạm hiển thị khoản lương `DRAFT`, xuất kèm giải trình. Tiền trưởng nhóm và phụ cấp cần cấu hình/điều kiện riêng. | [CÓ CĂN CỨ] mâu thuẫn tồn tại trong tài liệu; [CHƯA XÁC MINH] cách tính cuối. |
| **D-07** | Định nghĩa rõ `Lãi dòng tiền` và `LNR kinh doanh` như G-04; bảng chia chỉ dùng **lợi nhuận phân phối đã được phê duyệt**, có đối chiếu vốn góp/sổ chi. Lợi nhuận ≤0: không chi lợi nhuận, nhưng vẫn lưu lỗ lũy kế/công nợ cổ đông; không tự hoàn vốn. Làm tròn nghìn có thể áp dụng **ở bước thanh toán** theo rule ký duyệt, lưu số chính xác và dòng chênh lệch. | [ĐỀ XUẤT — CHỜ DUYỆT] vốn góp/làm tròn/phê duyệt. |
| **D-08** | Giá gói và phần **không gồm OCR/Zalo OA/VPS/triển khai hạ tầng** phải ghi thành bảng phụ lục thương mại riêng, có số lượng, đơn vị, thuế/phí, thời gian hiệu lực. Hiện không có Excel báo giá → **không thể xác nhận mức phí 4 gói hoặc việc thay đổi CR giữ giá**. | [CHƯA XÁC MINH]. |
| **D-09** | Bắt buộc tạo **RTM (Requirements Traceability Matrix)**: `FR/increment` → `gói` → `màn/route` → `component/action` → `quyền` → `nguồn nghiệp vụ` → `test case` → `trạng thái PASS/FAIL` → `ghi chú CR`. Registry 39 màn và 52 chức năng chỉ là kiểm đếm, **chưa chứng minh coverage nghiệp vụ hoặc đúng rule**. | [ĐỀ XUẤT — CHỜ DUYỆT] định dạng, nhưng việc có RTM là khuyến nghị QA trọng yếu. |

### PKG-01…06 / CR-RPT-01 — ranh giới thương mại
- Giữ preview gói độc lập với phân quyền người dùng; ẩn/hiện ghost/locked theo gói là quyết định demo, không thay thế cơ chế authorization thật.
- Bảng `A 50–60 / B 70–80 / C 80–90 / D 90–100` chỉ có trong Markdown; **không được ghi là giá chốt** cho đến khi có file Excel báo giá/biên bản thống nhất.
- Hai báo cáo RPT-04/RPT-05 là nhu cầu ưu tiên được ghi nhận. **Đề xuất:** hiển thị báo cáo tổng, doanh thu theo tòa, LNG/LNR mức cơ bản ở gói A nếu PM xác nhận CR-RPT-01; B mở drill-down, C tự phân bổ và cảnh báo, D khóa kỳ/version. **Đây là thay đổi phạm vi so với §5A** (trong log đã ghi), phải được xác nhận và làm rõ ảnh hưởng báo giá.
- Quy tắc §4 (note cấp màn) và §5A (increment) có xung đột: tiếp tục lấy **§5A làm căn cứ gate** như log, nhưng lập biên bản sai khác và RTM, không tự xóa note §4.

## IV. Các lỗi hoặc chỗ chưa được chứng minh cần sửa trong Markdown hiện tại

1. **Bất nhất `/100` và `/90` tại D-06/G-03**: văn bản `CÁCH TÍNH LƯƠNG...docx` ghi một công thức, ví dụ dùng công thức khác; bắt buộc chốt trước khi triển khai lương thật.
2. **“Phạt 200.000đ/ngày trễ”** trong dòng mô tả hợp đồng ở §5 của Markdown **không được chứng minh bởi hai PDF demo** đã gửi. PDF P302 có lịch nhắc ngày 25 và thời hạn 25–30, nhưng không chứa quy định phạt 200.000đ/ngày. Không đưa mức phạt vào hệ thống như một điều khoản hợp đồng đã xác minh.
3. **Mức nước**: PDF P302 là **120.000đ/người/tháng**, không phải mặc định 28–30k/m³. Mỗi biểu phí cần khai báo `pricing_method` (`per_person`, `per_room`, `meter_m3`...) và ngày hiệu lực.
4. **Số thu sau mốc 15**: không tính vào *hiệu suất thực tế có trọng số* theo mô tả mockup, **nhưng có thể vẫn là doanh thu thực và tiền đã thu**, không được xóa khỏi công nợ/P&L.
5. **Cọc**: cọc nhận mới, hoàn cọc, cọc bị giữ là ba dòng nghiệp vụ khác nhau; không dùng một kiểu “cọc” để cộng trực tiếp vào cả báo cáo dòng tiền, kinh doanh và hiệu suất.
6. **Tính tiền thuê chủ nhà**: nếu phiếu chi kỳ 10 đang chờ duyệt, bảng **dòng tiền** chưa có tiền chi; nhưng nếu dịch vụ thuê tòa đã phát sinh trong tháng, **báo cáo kinh doanh** cần có khoản chi phí thuộc kỳ (ít nhất đánh dấu dự tính/chưa chốt) — tránh lợi nhuận kỳ bị cao ảo.
7. **Giá mua điện** (ví dụ 2.500 đ/kWh từ bản dự kiến) và giá bán điện (4.000 đ/kWh từ hợp đồng mẫu) phải có dữ liệu **riêng theo kỳ/tòa**, không suy ra luôn bằng đơn giá demo.
8. **Lợi nhuận chia cổ phần và hoàn vốn**: G1 đang tính `Tổng nhận = Vốn + LNR phần được chia`. Việc tự chuyển số “Vốn” này thành lịch chi tiền mỗi tháng có nguy cơ sai bản chất. Phải chốt nguồn vốn, phần vốn đã góp/đã hoàn và điều kiện phân phối.
9. **Thiếu tài liệu gốc**: chưa có Excel báo giá 4 gói, SRS v2.3 thực tế để diff, `note.md` / `ques.md` nguồn, và một số workbook liên kết ngoài mà G1 dùng. Không thể tuyên bố 1:1 toàn bộ chức năng đã được xác minh.

## V. Danh sách ưu tiên phê duyệt để hoàn tất mockup và triển khai

**Có thể áp dụng ngay cho mockup (vẫn cần gắn `PROPOSED`):** G-01, G-02, G-05, G-06, G-08, G-09, G-10; phân tách chế độ báo cáo G-04/R-01; không hardcode giá điện nước D-03; tách vai trò/gói D-09.

**Không nên đưa vào production cho đến khi có quyết định có chữ ký/biên bản:**
1. G-03/D-04/D-06: công thức chuẩn hóa cọc/tiền thuê đóng 3 tháng, cách chốt M5/M10/M15 và **mẫu số `/90` hay `/100`** trong lương.
2. G-04/R-03/R-07: chuẩn ghi nhận chi phí thuê chủ nhà, mua sắm thiết bị, phân biệt kinh doanh/dòng tiền.
3. R-05: danh sách chi phí chung, cách phân bổ **theo phòng / doanh thu / trực tiếp**, quy tắc phân bổ thay đổi giữa kỳ.
4. R-08/D-07: bản chất **Vốn** trong bảng cổ phần, cách tính lợi nhuận được chia và dòng tiền trả nhà đầu tư.
5. D-03/R-02: quy tắc phí nước theo người hoặc công tơ, dịch vụ chung tách/ghép, prorate.
6. G-07: loại giấy PCCC bắt buộc theo nhóm tòa và chủ thể ĐKKD.
7. PKG/CR-RPT-01: giá 4 gói, scope SRS v2.3, thay đổi đưa báo cáo LNG/LNR sang gói A.

### Tài liệu dùng để đối chiếu
- `TIMEHOUSE_MOCKUP_DECISIONS.md` — căn cứ tên mã, trạng thái và scope SRS/CR.
- `CÁCH TÍNH LƯƠNG PHÒNG VẬN HÀNH.docx` — TH1/TH2, trọng số mốc và ví dụ lương.
- `Hop_dong_chu_nha_TH01_demo_dong_bo.pdf` — tòa TH01 và lịch trả chủ nhà.
- `Hop_dong_khach_thue_P302_TH01_demo_dong_bo.pdf` — biểu phí theo hợp đồng và lịch thông báo.
- `G1.31.8.26.xlsx` — báo cáo G1 tháng 8 và công thức chia cổ phần.
- `Thông tin nhà.xlsx` — mã tòa, nhân sự theo tòa, tình trạng nhà, lịch trả, tài khoản chủ nhà.
- `BẢNG DỰ KIẾN LỢI NHUẬN CÁC THÁNG.xlsx`; `BÁO CÁO KINH DOANH THÁNG 8.xlsx` — dự kiến chi phí và số liệu báo cáo.

**Kết luận:** Bộ đáp án trên là **đề xuất xác nhận quyết định** đủ chi tiết để FE/BE cập nhật mockup và thiết kế dữ liệu; không thay thế phê duyệt nghiệp vụ của chủ dự án/khách hàng. Những quyết định còn mở phải hiện trạng thái `DRAFT/PENDING` trong SRS, RTM và UI liên quan.
