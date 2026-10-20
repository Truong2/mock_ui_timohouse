# TIMEHOUSE — Yêu cầu quản lý chủ nhà, tòa nhà và khách hàng

Tài liệu đã được cập nhật theo câu trả lời tại [ques.md](ques.md), bao gồm yêu cầu chỉnh sửa thông tin và tổ chức giao diện danh sách/chi tiết theo tab. Nội dung **Đề xuất** là phương án trình bày hoặc trường thông tin chưa được chốt; nội dung **Cần bổ sung** là phần còn thiếu trong câu trả lời.

## 1. Phạm vi và cách tổ chức thông tin

| Nhóm | Nội dung |
|---|---|
| Hồ sơ chủ nhà | Thông tin cá nhân theo mẫu hợp đồng và hình ảnh sổ đỏ |
| Hợp đồng thuê tòa nhà | Giá thuê, tiền cọc, thời hạn, thời gian giữ giá, người giới thiệu nguồn nhà và người nhập dữ liệu |
| Hồ sơ tòa nhà | Địa chỉ, diện tích, đặc điểm, tình trạng, PCCC và đăng ký kinh doanh |
| Nhân sự phụ trách | Nhân sự được phân công cho từng tòa nhà theo vai trò |
| Tài sản tại tòa nhà | Hai danh sách riêng: tài sản chủ nhà và tài sản đầu tư thêm |
| Theo dõi vận hành | Khoảng thời gian vận hành, hiệu suất, lợi nhuận và lịch thanh toán cho chủ nhà |
| Khách hàng (khách thuê) | Danh sách tổng quan, thông tin lưu trú, hợp đồng, bảng giá dịch vụ và tài chính |

Hồ sơ chủ nhà liên kết với tòa nhà qua hợp đồng thuê. Nhân sự, tài sản, lịch thanh toán và kết quả vận hành được theo dõi theo từng tòa.

**Mẫu hợp đồng đã xác định:** [Hợp đồng thuê nhà 2026(Mẫu) tùng sói.doc](<docs/Hợp đồng thuê nhà 2026(Mẫu) tùng sói.doc>). Mẫu này là căn cứ xác định các trường thông tin chủ nhà và điều khoản thuê nhà; danh sách trường cụ thể cần được trích xuất khi đối chiếu mẫu.

## 2. Hồ sơ chủ nhà và hợp đồng thuê

### 2.1. Hồ sơ chủ nhà

| Hạng mục | Yêu cầu |
|---|---|
| Thông tin cá nhân | Lưu đầy đủ thông tin chủ nhà theo mẫu hợp đồng đã xác định |
| Hình ảnh sổ đỏ | Lưu hình ảnh liên quan đến nhà/tòa nhà cho thuê; thể hiện rõ tòa tương ứng khi tra cứu |

### 2.2. Hợp đồng thuê tòa nhà với chủ nhà

| Hạng mục | Yêu cầu |
|---|---|
| Giá thuê | Lưu giá thuê theo hợp đồng. Thuật ngữ đã xác nhận là **giá thuê** |
| Tiền đặt cọc | Lưu số tiền đặt cọc theo hợp đồng |
| Thời gian giữ giá | Lưu khoảng thời gian áp dụng mức giá thuê đã thỏa thuận |
| Thời điểm kết thúc hợp đồng | Lưu ngày hết hạn hợp đồng thuê |
| Người giới thiệu nguồn nhà | Lưu người cung cấp hoặc giới thiệu nguồn nhà/tòa nhà |
| Người nhập dữ liệu | Lưu người thực hiện nhập thông tin vào hệ thống, tách riêng với người giới thiệu nguồn nhà |
| Ghi chú | Lưu các nội dung bổ sung liên quan đến hợp đồng |

**Đề xuất bổ sung:** ngày bắt đầu hợp đồng và bản hợp đồng đính kèm. Hai mục này cần đối chiếu mẫu trước khi chốt danh sách trường.

**Cần bổ sung từ hợp đồng:** đơn vị tính giá thuê, chu kỳ thanh toán và các điều khoản liên quan đến lịch trả tiền cho chủ nhà.

## 3. Hồ sơ tòa nhà và nhân sự phụ trách

### 3.1. Thông tin và đặc điểm

| Hạng mục | Yêu cầu |
|---|---|
| Địa chỉ | Lưu địa chỉ đầy đủ của tòa nhà |
| Diện tích | Lưu giá trị diện tích theo đơn vị **m²** |
| Số tầng | Lưu tổng số tầng |
| Số phòng | Lưu tổng số phòng |
| Tình trạng tòa nhà | Phân loại **Mới / Trung bình / Cũ** |
| PCCC | Theo dõi **Đã có / Chưa có**, cho phép tải lên tài liệu minh chứng |
| Đăng ký kinh doanh | Theo dõi **Đã có / Chưa có**, cho phép tải lên tài liệu minh chứng |

**Cần bổ sung:** loại diện tích cần lưu (đất, xây dựng hay tổng diện tích sàn); tiêu chí phân loại tình trạng tòa; tài liệu/trạng thái PCCC cụ thể và chủ thể đứng tên đăng ký kinh doanh.

### 3.2. Nhân sự phụ trách

Cho phép **thêm, theo dõi và chỉnh sửa phân công nhân sự cho từng tòa nhà**, gồm:

| Vai trò | Thông tin theo dõi |
|---|---|
| Trưởng nhóm | Nhân sự được phân công làm trưởng nhóm phụ trách |
| Nhân viên vận hành | Nhân sự vận hành phụ trách tòa |
| Nhân viên vệ sinh | Nhân sự vệ sinh phụ trách tòa |
| Nhân viên kỹ thuật | Nhân sự kỹ thuật phụ trách tòa |

**Đề xuất UI:** chọn nhân sự từ danh sách nhân viên đã có để thống nhất thông tin.

**Cần bổ sung:** số người tối đa cho từng vai trò và quy tắc một nhân sự phụ trách nhiều tòa.

## 4. Tài sản tại tòa nhà

Theo dõi riêng hai danh sách đã được xác nhận:

| Nhóm tài sản | Nội dung |
|---|---|
| Tài sản chủ nhà | Tài sản của chủ nhà tại tòa nhà |
| Tài sản đầu tư thêm | Tài sản được đầu tư bổ sung |

Cho phép chỉnh sửa thông tin tài sản theo quyền và trạng thái nghiệp vụ tương ứng.

**Đề xuất trường thông tin:** tên tài sản, số lượng, vị trí, tình trạng và ghi chú. Danh sách trường chi tiết cần được xác nhận thêm.

## 5. Vận hành, hiệu suất và lịch thanh toán

### 5.1. Thời gian vận hành

Theo dõi khoảng thời gian vận hành theo **từ ngày — đến ngày**, gồm hai trường:

- Ngày bắt đầu vận hành.
- Ngày kết thúc vận hành.

### 5.2. Hiệu suất tòa nhà

Hiệu suất được xác định bằng **doanh thu tiền phòng quy đổi so với tổng giá thuê niêm yết của các phòng thuộc tòa nhà trong kỳ**.

```text
Hiệu suất (%) = Doanh thu tiền phòng quy đổi / Tổng giá niêm yết × 100%
```

Công thức cho trường hợp thông thường, theo nội dung tại mục 8 của `ques.md`:

| Ký hiệu | Thành phần | Công thức / Ý nghĩa |
|---|---|---|
| A | Doanh thu sau ba mốc | DT M5 × 100% + (DT M10 − DT M5) × 90% + (DT M15 − DT M10) × 70% |
| B | Tỷ lệ dịch vụ | Dịch vụ phải thu / Doanh thu phải thu |
| C | Doanh thu thu thêm | Tiền phòng phát sinh đã thu đủ + khoản khách bỏ cọc |
| D | Doanh thu tiền phòng quy đổi | A − (A × B) + C |
| Tổng giá niêm yết | Mẫu số tính hiệu suất | Tổng giá thuê niêm yết của các phòng thuộc tòa nhà trong kỳ |

```text
Hiệu suất (%) = [A − (A × B) + C] / Tổng giá niêm yết × 100%
```

Theo dõi hai trạng thái:

| Trạng thái | Cơ sở tính theo câu trả lời |
|---|---|
| Hiệu suất tạm tính | Doanh thu tiền phòng và khoản bỏ cọc ghi nhận tại thời điểm xem báo cáo |
| Hiệu suất thực tế | Doanh thu tiền phòng ghi nhận sau ba mốc thu, cộng khoản bỏ cọc theo quy tắc báo cáo |

Tỷ lệ lấp đầy phòng được tính và báo cáo riêng. Việc sử dụng chỉ số này để tính lương cần đối chiếu quy tắc lương tương ứng.

**Cần bổ sung:** định nghĩa DT M5/M10/M15, điều kiện ghi nhận doanh thu thu thêm/khoản bỏ cọc và cách điều chỉnh doanh thu ở các mốc khi có cọc mới hoặc khách đóng tiền theo kỳ 3 tháng.

Các công thức trên được đồng bộ từ câu trả lời. Tài liệu nguồn được nhắc đến là *Cách tính lương phòng vận hành* và *bảng mô tả báo cáo*; phần cập nhật này chưa xác nhận kết quả đối chiếu trực tiếp hai nguồn đó.

### 5.3. Lợi nhuận

Theo dõi kết quả lợi nhuận theo tòa nhà và kỳ dữ liệu.

**Cần bổ sung:** định nghĩa lợi nhuận, công thức, các khoản thu/chi được tính và kỳ báo cáo. Phần trả lời hiện tại chưa chốt các nội dung này.

### 5.4. Lịch thanh toán cho chủ nhà

Phạm vi đã xác nhận là **theo dõi lịch thanh toán cho chủ nhà**, căn cứ điều khoản trong mẫu hợp đồng thuê nhà đã xác định tại mục 1.

**Đề xuất thông tin hiển thị:**

| Thông tin | Mục đích |
|---|---|
| Tòa nhà, chủ nhà và hợp đồng liên quan | Xác định nghĩa vụ thanh toán thuộc hồ sơ nào |
| Kỳ thanh toán và ngày đến hạn | Theo dõi thời điểm phải trả tiền |
| Số tiền phải thanh toán | Thể hiện nghĩa vụ của kỳ |
| Số tiền đã thanh toán và ngày thanh toán | Theo dõi thực tế thực hiện |
| Số tiền còn lại / Trạng thái | Thể hiện tiến độ từ dữ liệu đã xác nhận |
| Ghi chú / Chứng từ | Tra cứu căn cứ thanh toán |

**Cần bổ sung từ hợp đồng:** chu kỳ, ngày đến hạn, số tiền từng kỳ và yêu cầu nhắc lịch nếu có. Việc tự sinh lịch từ hợp đồng cần đối chiếu phạm vi từng gói trong SRS.

## 6. Kết quả đối chiếu 9 câu hỏi với ques.md

Bảng này cập nhật trạng thái của 9 câu hỏi ban đầu. Nội dung trả lời chi tiết được lưu trong `ques.md` và đã được đưa vào các mục nghiệp vụ phía trên.

| STT | Câu hỏi ban đầu | Kết quả xác nhận | Phần còn cần bổ sung |
|---|---|---|---|
| 1 | Dùng mẫu hợp đồng nào? | Hợp đồng thuê nhà 2026(Mẫu) tùng sói | Trích xuất danh sách trường từ mẫu |
| 2 | “Giá thuế” có phải “giá thuê”? | Đúng, sử dụng **giá thuê** | Đơn vị tính theo hợp đồng |
| 3 | Lưu người giới thiệu hay người nhập dữ liệu? | Lưu cả hai, thành hai trường riêng | — |
| 4 | Diện tích, PCCC và đăng ký kinh doanh lưu thế nào? | Diện tích theo m²; PCCC và đăng ký kinh doanh có trạng thái cùng tài liệu minh chứng | Loại diện tích; tài liệu/trạng thái PCCC cụ thể; chủ thể đăng ký kinh doanh |
| 5 | Tài sản chia thành những nhóm nào? | Tài sản chủ nhà và tài sản đầu tư thêm | Trường chi tiết của mỗi tài sản |
| 6 | Phân công nhân sự theo tòa như thế nào? | Cho phép thêm và theo dõi nhân sự theo vai trò | Giới hạn số người và việc phụ trách nhiều tòa |
| 7 | Thời gian vận hành thể hiện thế nào? | Từ ngày — đến ngày | — |
| 8 | Hiệu suất và lợi nhuận tính thế nào? | Đã cung cấp công thức hiệu suất và hai trạng thái | Quy tắc ngoại lệ, định nghĩa đầu vào và công thức lợi nhuận |
| 9 | Lịch đóng tiền áp dụng cho bên nào? | Thanh toán cho chủ nhà theo hợp đồng | Chu kỳ, hạn, số tiền từng kỳ và yêu cầu nhắc lịch |

## 7. Chỉnh sửa thông tin và tổ chức giao diện

### 7.1. Chỉnh sửa và lưu thay đổi

Cho phép chỉnh sửa thông tin đã nhập trong hồ sơ chủ nhà, hợp đồng, tòa nhà, phân công nhân sự, tài sản, tài liệu đính kèm, thời gian vận hành và lịch thanh toán, theo quyền và trạng thái nghiệp vụ tương ứng.

- Mỗi nhóm thông tin có thao tác **Chỉnh sửa**, **Lưu thay đổi** và **Hủy**.
- Lưu thành công cập nhật trang chi tiết và danh sách liên quan.
- Hủy giữ lại dữ liệu đã lưu trước đó.
- Khi chuyển tab hoặc rời trang mà có thay đổi chưa lưu, cho phép lưu, bỏ thay đổi hoặc tiếp tục chỉnh sửa.
- Hiệu suất, lợi nhuận và số tiền còn lại được cập nhật từ dữ liệu nguồn theo quy tắc áp dụng. Người dùng chỉnh sửa dữ liệu nguồn tại chức năng tương ứng.

### 7.2. Danh sách hiển thị thông tin tóm tắt

Danh sách chỉ hiển thị một số thông tin chính để nhận diện, tìm kiếm và chọn hồ sơ. Nhấn tên hoặc **Xem chi tiết** để mở đầy đủ thông tin.

**Đề xuất các cột:**

| Danh sách | Thông tin hiển thị |
|---|---|
| Chủ nhà | Mã chủ nhà, họ tên, liên hệ, số tòa liên quan, trạng thái |
| Tòa nhà | Mã/tên tòa, địa chỉ rút gọn, chủ nhà, số phòng, trạng thái |

Nội dung dài, tài liệu, nhân sự và tài sản được bố trí trong trang chi tiết.

### 7.3. Chi tiết chia thành các tab

Mỗi tab hiển thị một nhóm thông tin; chỉ hiển thị nội dung của tab đang chọn để giao diện gọn và dễ thao tác.

**Đề xuất tab chi tiết chủ nhà:**

| Tab | Nội dung |
|---|---|
| Thông tin chung | Thông tin cá nhân và liên hệ theo mẫu hợp đồng |
| Hợp đồng thuê | Giá thuê, cọc, thời gian giữ giá, thời hạn, người giới thiệu nguồn nhà, người nhập dữ liệu và ghi chú; phân biệt hợp đồng theo từng tòa |
| Tòa nhà liên quan | Các tòa liên kết và thao tác mở chi tiết từng tòa |
| Tài liệu | Hình ảnh sổ đỏ, tài liệu hồ sơ/hợp đồng và tòa nhà liên quan |

**Đề xuất tab chi tiết tòa nhà:**

| Tab | Nội dung |
|---|---|
| Thông tin chung | Địa chỉ, diện tích, số tầng, số phòng và tình trạng |
| Chủ nhà & hợp đồng | Chủ nhà liên quan và hợp đồng thuê tòa |
| Nhân sự | Trưởng nhóm, nhân viên vận hành, vệ sinh và kỹ thuật được phân công |
| Tài sản | Tài sản chủ nhà và tài sản đầu tư thêm |
| Hồ sơ & minh chứng | PCCC, đăng ký kinh doanh và tài liệu đính kèm |
| Vận hành & kết quả | Khoảng thời gian vận hành; hiệu suất và lợi nhuận theo kỳ |
| Lịch thanh toán | Lịch thanh toán cho chủ nhà và tình hình thực hiện |

Thông tin dùng chung như hợp đồng và tài liệu liên kết về cùng hồ sơ nguồn để cập nhật nhất quán giữa các tab và trang chi tiết.

Các yêu cầu chi tiết hoặc bổ sung được đối chiếu với SRS và phạm vi từng gói khi cập nhật kế hoạch mockup. Các điểm còn thiếu của phần chủ nhà/tòa nhà được giữ tại đúng mục nghiệp vụ và trong bảng đối chiếu mục 6. Yêu cầu khách hàng bổ sung được trình bày tại mục 8.

## 8. Thông tin khách hàng (khách thuê)

Phần này tổ chức lại yêu cầu bổ sung về khách hàng. Danh sách hiển thị thông tin tổng quan; khi mở từng hồ sơ, trang chi tiết chia thành các tab để thuận tiện xem và chỉnh sửa.

### 8.1. Danh sách khách hàng — thông tin tổng quan

| Thông tin | Nội dung hiển thị |
|---|---|
| Mã phòng / Mã tòa | Nhận diện phòng và tòa nhà gắn với hồ sơ thuê |
| Trưởng khu vực | Tên trưởng khu vực phụ trách |
| Nhân viên vận hành | Tên nhân viên vận hành phụ trách |
| Công nợ | Số tiền còn phải thanh toán, lấy từ dữ liệu tài chính liên quan |
| Liên kết Zalo | Đã liên kết / Chưa liên kết |
| Trạng thái | Đang thuê, phá hợp đồng, chuẩn bị hết hợp đồng hoặc hoàn cọc, theo tình trạng tương ứng |

Nhấn vào hồ sơ hoặc **Xem chi tiết** để mở thông tin khách hàng. Các thông tin lưu trú, tài liệu hợp đồng, bảng giá dịch vụ và tài chính được trình bày tại các tab chi tiết.

### 8.2. Trạng thái theo dõi

| Trạng thái | Nội dung |
|---|---|
| Đang thuê | Khách hàng đang thuê theo hợp đồng |
| Phá hợp đồng | Ghi nhận trường hợp phá hợp đồng; điều kiện và cách xử lý cần bổ sung |
| Chuẩn bị hết hợp đồng | Nhắc trước ngày hết hạn hợp đồng **35 ngày** |
| Hoàn cọc | Theo dõi tình trạng hoàn cọc; cần bổ sung các bước/trạng thái xử lý cụ thể |

**Cần bổ sung:** cách hiển thị khi một hồ sơ có nhiều tình trạng cùng lúc, chẳng hạn đang thuê và sắp hết hạn; xác định “hoàn cọc” thể hiện đang xử lý hay đã hoàn tất.

### 8.3. Trang chi tiết khách hàng

**Tiêu đề trang:** hiển thị **Mã phòng — Mã tòa** theo yêu cầu.

Thông tin chi tiết được chia thành ba tab:

| Tab | Nội dung chính |
|---|---|
| Thông tin lưu trú | Thông tin khách hàng, thời gian và loại hợp đồng, nghề nghiệp, phương tiện |
| Hợp đồng | File hợp đồng, bảng giá dịch vụ theo từng hợp đồng và ghi chú |
| Tài chính | Công nợ và thông tin tài chính liên quan đến hồ sơ thuê |

### 8.4. Tab Thông tin lưu trú

Giữ các thông tin khách hàng trong hồ sơ hiện có và bổ sung các nhóm sau:

| Nhóm thông tin | Nội dung |
|---|---|
| Phòng / Tòa nhà | Mã phòng và mã tòa liên quan |
| Thời gian hợp đồng | Ngày bắt đầu, ngày kết thúc và thời hạn hợp đồng |
| Lần ký hợp đồng | Hợp đồng lần đầu / Gia hạn lần thứ…; thể hiện số lần gia hạn |
| Nghề nghiệp | Nghề nghiệp của khách hàng |
| Phương tiện | Số lượng xe và biển số của từng xe |

**Đề xuất UI:** nhóm thời gian hợp đồng thành một khối; danh sách xe cho phép thêm và chỉnh sửa từng dòng. Thông tin lần ký/gia hạn được hiển thị riêng với trạng thái đang thuê/phá hợp đồng.

### 8.5. Tab Hợp đồng

#### a. File hợp đồng và cập nhật bảng giá

- Cho phép tải lên hợp đồng gắn với hồ sơ khách hàng, phòng và tòa tương ứng.
- Tự động đọc và điền bảng giá dịch vụ từ hợp đồng theo khả năng nhận dạng của gói đang sử dụng.
- Người dùng kiểm tra, chỉnh sửa và xác nhận dữ liệu nhận dạng trước khi áp dụng, theo quy tắc OCR trong SRS. Trường hợp chưa nhận dạng được có thể nhập tay.
- Bảng giá dịch vụ được lưu **theo từng hợp đồng**, vì các hợp đồng có thể áp dụng mức giá khác nhau.

#### b. Các loại phí dịch vụ

| STT | Loại phí |
|---|---|
| 1 | Điện |
| 2 | Nước |
| 3 | Mạng |
| 4 | Thang máy |
| 5 | Dịch vụ chung |
| 6 | Sạc xe điện |
| 7 | Gửi xe |

**Đề xuất thông tin cho từng dòng phí:** loại phí, đơn giá, đơn vị tính và cách tính theo hợp đồng. Chi tiết trường và quy tắc áp dụng cần đối chiếu mẫu hợp đồng khách thuê.

#### c. Ghi chú

Cho phép **nhập tay và chỉnh sửa ghi chú** liên quan đến hợp đồng.

### 8.6. Tab Tài chính

Hiển thị công nợ và thông tin tài chính gắn với khách hàng, hợp đồng, mã phòng và mã tòa tương ứng.

**Đề xuất nội dung:** hóa đơn theo kỳ, số tiền phải thanh toán, số tiền đã thu được xác nhận, số tiền còn nợ và tình hình hoàn cọc. Các số tổng hợp liên kết về dữ liệu nguồn để cập nhật nhất quán với danh sách khách hàng.

**Cần bổ sung:** ghi chú gốc có dòng “thêm danh sách khách hoà gồm: mã phòng mã tòa” nhưng chưa hoàn chỉnh. Cần làm rõ tên danh sách, mục đích và các trường cần hiển thị; hiện chỉ xác định có mã phòng và mã tòa, chưa diễn giải thêm ý nghĩa “khách hoà”.

### 8.7. Chỉnh sửa và lưu thông tin khách hàng

Áp dụng nguyên tắc chỉnh sửa tại mục 7.1 cho hồ sơ khách hàng:

- Chỉnh sửa từng nhóm thông tin trong tab tương ứng, có **Lưu thay đổi** và **Hủy**.
- Khi lưu thành công, cập nhật trang chi tiết và các thông tin liên quan trên danh sách tổng quan.
- Khi chuyển tab hoặc rời trang với thay đổi chưa lưu, cho phép lưu, bỏ thay đổi hoặc tiếp tục chỉnh sửa.
- Công nợ và số tiền đã thu được cập nhật từ nghiệp vụ tài chính tương ứng theo quyền và trạng thái chứng từ.

