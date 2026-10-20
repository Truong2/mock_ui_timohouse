# TIMEHOUSE — Trả lời các nội dung cần xác nhận trong note.md

Tài liệu này tổng hợp câu trả lời cho **9 câu hỏi tại mục 6 của [note.md](note.md)**. Số thứ tự được giữ tương ứng để dễ đối chiếu. **Mục 10** bổ sung yêu cầu về chỉnh sửa thông tin và tổ chức giao diện danh sách/chi tiết theo tab. Các mục **Cần bổ sung** thể hiện phần câu hỏi chưa được trả lời đầy đủ.

## 1. Mẫu hợp đồng dùng làm căn cứ

**Câu hỏi:** Dùng mẫu hợp đồng nào để xác định thông tin chủ nhà?

**Trả lời:** Sử dụng tài liệu **Hợp đồng thuê nhà 2026(Mẫu) tùng sói** làm căn cứ xác định các trường thông tin chủ nhà và điều khoản thuê nhà.

Tài liệu tham chiếu: [Hợp đồng thuê nhà 2026(Mẫu) tùng sói.doc](<docs/Hợp đồng thuê nhà 2026(Mẫu) tùng sói.doc>).

## 2. Giá thuê

**Câu hỏi:** “Giá thuế” trong ghi chú gốc có đúng là “giá thuê” không?

**Trả lời:** Đúng. Thuật ngữ cần sử dụng là **giá thuê**.

## 3. Người giới thiệu nguồn nhà và người nhập dữ liệu

**Câu hỏi:** “Người nhập nguồn” là người giới thiệu nguồn nhà, người nhập dữ liệu hay cần lưu cả hai?

**Trả lời:** Lưu **cả hai thông tin**, tách thành hai trường:

| Trường thông tin | Ý nghĩa |
|---|---|
| Người giới thiệu nguồn nhà | Người cung cấp hoặc giới thiệu nguồn nhà/tòa nhà |
| Người nhập dữ liệu | Người thực hiện nhập thông tin vào hệ thống |

## 4. Diện tích, PCCC và đăng ký kinh doanh

**Câu hỏi:** Diện tích được lưu như thế nào? PCCC và đăng ký kinh doanh cần theo dõi thông tin gì?

**Trả lời:**

| Hạng mục | Nội dung xác nhận |
|---|---|
| Diện tích | Lưu giá trị diện tích theo đơn vị **m²** |
| PCCC | Theo dõi **đã có / chưa có**, kèm chức năng tải lên tài liệu minh chứng |
| Đăng ký kinh doanh | Theo dõi **đã có / chưa có**, kèm chức năng tải lên tài liệu minh chứng |

**Cần bổ sung:** loại diện tích cần lưu (đất, xây dựng hay tổng diện tích sàn); tài liệu/trạng thái PCCC cụ thể cần theo dõi; chủ thể đứng tên đăng ký kinh doanh. Việc đính kèm tài liệu phục vụ lưu minh chứng, chưa có mô tả về quy trình thẩm định tài liệu.

## 5. Phân loại tài sản

**Câu hỏi:** Tài sản có được chia thành tài sản chủ nhà và tài sản đầu tư thêm không?

**Trả lời:** Có. Theo dõi riêng hai danh sách:

| Nhóm tài sản | Nội dung |
|---|---|
| Tài sản chủ nhà | Tài sản của chủ nhà tại tòa nhà |
| Tài sản đầu tư thêm | Tài sản được đầu tư bổ sung |

**Cần bổ sung:** các trường chi tiết cần lưu cho mỗi tài sản, chẳng hạn số lượng, tình trạng và vị trí. Những trường này chưa được xác nhận trong câu trả lời hiện tại.

## 6. Nhân sự phụ trách tòa nhà

**Câu hỏi:** Mỗi vai trò có thể có bao nhiêu người và nhân sự có được phụ trách nhiều tòa không?

**Trả lời:** Cho phép **thêm và theo dõi nhân sự được phân công cho từng tòa nhà**, gồm các vai trò đã nêu trong `note.md`:

- Trưởng nhóm.
- Nhân viên vận hành.
- Nhân viên vệ sinh.
- Nhân viên kỹ thuật.

**Cần bổ sung:** số người tối đa cho từng vai trò và quy tắc một nhân sự phụ trách nhiều tòa. Phần trả lời hiện tại xác nhận nhu cầu phân công nhân sự, chưa quy định hai giới hạn này.

## 7. Thời gian vận hành

**Câu hỏi:** Thời gian vận hành cần thể hiện mốc ngày hay khoảng thời gian nào?

**Trả lời:** Theo dõi theo khoảng **từ ngày — đến ngày**, gồm:

| Trường thông tin | Ý nghĩa |
|---|---|
| Ngày bắt đầu vận hành | Mốc bắt đầu vận hành tòa nhà |
| Ngày kết thúc vận hành | Mốc kết thúc khoảng thời gian vận hành |

## 8. Hiệu suất và lợi nhuận tòa nhà

### 8.1. Khái niệm hiệu suất

**Câu hỏi:** Hiệu suất được tính theo chỉ số và công thức nào?

**Trả lời:** Theo nội dung đã cung cấp, hiệu suất tòa nhà được tính bằng **doanh thu tiền phòng quy đổi so với tổng giá thuê niêm yết của các phòng trong kỳ**.

```text
Hiệu suất (%) = Doanh thu tiền phòng quy đổi / Tổng giá niêm yết × 100%
```

| Thành phần | Diễn giải |
|---|---|
| Tổng giá niêm yết | Tổng giá thuê niêm yết của các phòng thuộc tòa nhà trong kỳ |
| Doanh thu tiền phòng quy đổi | Doanh thu sau khi xử lý các mốc thu M5, M10, M15, loại phần dịch vụ và cộng doanh thu thu thêm đủ điều kiện |

### 8.2. Các bước tính trong trường hợp thông thường

| Ký hiệu | Thành phần | Công thức |
|---|---|---|
| A | Doanh thu sau ba mốc | DT M5 × 100% + (DT M10 − DT M5) × 90% + (DT M15 − DT M10) × 70% |
| B | Tỷ lệ dịch vụ | Dịch vụ phải thu / Doanh thu phải thu |
| C | Doanh thu thu thêm | Tiền phòng phát sinh đã thu đủ + khoản khách bỏ cọc |
| D | Doanh thu tiền phòng quy đổi | A − (A × B) + C |

Từ các thành phần trên:

```text
Hiệu suất (%) = [A − (A × B) + C] / Tổng giá niêm yết × 100%
```

Ký hiệu **D** được bổ sung để trình bày kết quả trung gian; giữ nguyên nội dung công thức đã cung cấp.

### 8.3. Trường hợp cần điều chỉnh

Công thức A ở trên áp dụng cho trường hợp thông thường. Khi có **cọc mới** hoặc **phòng đóng tiền theo kỳ 3 tháng**, phần trả lời nêu rằng phải điều chỉnh doanh thu tại các mốc tương ứng theo tài liệu vận hành.

**Cần bổ sung:** công thức điều chỉnh cụ thể cho từng trường hợp; định nghĩa DT M5/M10/M15 và cách xác định các khoản đủ điều kiện. Giữ riêng quy tắc khoản khách bỏ cọc để đối chiếu với tài liệu nguồn khi triển khai.

### 8.4. Hai trạng thái hiệu suất

| Trạng thái | Cơ sở tính theo nội dung trả lời |
|---|---|
| Hiệu suất tạm tính | Dựa trên doanh thu tiền phòng và khoản bỏ cọc ghi nhận tại thời điểm xem báo cáo |
| Hiệu suất thực tế | Dựa trên doanh thu tiền phòng được ghi nhận sau ba mốc thu, cộng khoản bỏ cọc theo quy tắc báo cáo |

Tỷ lệ lấp đầy phòng được tính và báo cáo riêng. Việc sử dụng chỉ số hiệu suất này để tính lương cần đối chiếu quy tắc lương tương ứng.

**Nguồn được nhắc đến trong câu trả lời:** tài liệu *Cách tính lương phòng vận hành* và *bảng mô tả báo cáo*. Phần này trình bày lại nội dung trả lời đã cung cấp, chưa xác nhận kết quả đối chiếu trực tiếp các tài liệu nguồn.

### 8.5. Lợi nhuận

**Câu hỏi:** Lợi nhuận được tính theo công thức, cơ sở thu/chi và kỳ báo cáo nào?

**Chưa có câu trả lời cụ thể.** Cần bổ sung định nghĩa lợi nhuận, các khoản thu/chi được tính và kỳ báo cáo áp dụng.

## 9. Lịch thanh toán cho chủ nhà

**Câu hỏi:** Lịch đóng tiền áp dụng cho bên nào và theo căn cứ nào?

**Trả lời:** Theo dõi **lịch thanh toán cho chủ nhà**, căn cứ điều khoản trong tài liệu **Hợp đồng thuê nhà 2026(Mẫu) tùng sói**.

**Cần bổ sung khi đối chiếu hợp đồng:** chu kỳ thanh toán, ngày đến hạn, số tiền từng kỳ và yêu cầu nhắc lịch nếu có. Nội dung trả lời này xác định phạm vi là khoản thanh toán cho chủ nhà.

## 10. Chỉnh sửa thông tin và tổ chức giao diện

### 10.1. Cho phép chỉnh sửa thông tin

**Yêu cầu bổ sung:** người dùng được phép chỉnh sửa các thông tin đã nhập trong hồ sơ chủ nhà, hợp đồng, tòa nhà, phân công nhân sự, tài sản, tài liệu đính kèm, thời gian vận hành và lịch thanh toán, theo quyền và trạng thái nghiệp vụ tương ứng.

- Trang chi tiết có thao tác **Chỉnh sửa**, **Lưu thay đổi** và **Hủy** cho từng nhóm thông tin.
- Khi lưu thành công, cập nhật thông tin tại trang chi tiết và danh sách liên quan.
- Khi hủy, giữ lại dữ liệu đã lưu trước đó.
- Nếu chuyển tab hoặc rời trang khi có thay đổi chưa lưu, cho phép lưu, bỏ thay đổi hoặc tiếp tục chỉnh sửa.
- Các chỉ số tổng hợp như hiệu suất, lợi nhuận và số tiền còn lại được cập nhật từ dữ liệu nguồn theo công thức/quy tắc áp dụng. Người dùng chỉnh sửa dữ liệu nguồn tại chức năng tương ứng.

### 10.2. Danh sách chỉ hiển thị thông tin tóm tắt

**Yêu cầu bổ sung:** màn hình danh sách chỉ hiển thị một số thông tin chính để nhận diện, tìm kiếm và chọn hồ sơ. Nhấn vào tên hoặc thao tác **Xem chi tiết** để mở đầy đủ thông tin.

**Đề xuất các cột hiển thị:**

| Danh sách | Thông tin tóm tắt |
|---|---|
| Chủ nhà | Mã chủ nhà, họ tên, liên hệ, số tòa liên quan, trạng thái |
| Tòa nhà | Mã/tên tòa, địa chỉ rút gọn, chủ nhà, số phòng, trạng thái |

Các nội dung dài như điều khoản hợp đồng, hình ảnh sổ đỏ, tài liệu minh chứng, danh sách tài sản và nhân sự được bố trí trong trang chi tiết.

### 10.3. Trang chi tiết chia thành các tab

**Yêu cầu bổ sung:** chia thông tin thành các tab theo nhóm nghiệp vụ. Mỗi lần hiển thị nội dung của tab đang chọn để giao diện gọn và dễ thao tác.

**Đề xuất tab trong chi tiết chủ nhà:**

| Tab | Nội dung |
|---|---|
| Thông tin chung | Thông tin cá nhân và liên hệ theo mẫu hợp đồng |
| Hợp đồng thuê | Giá thuê, cọc, thời gian giữ giá, thời hạn hợp đồng, người giới thiệu nguồn nhà, người nhập dữ liệu và ghi chú; phân biệt rõ hợp đồng theo từng tòa |
| Tòa nhà liên quan | Danh sách các tòa liên kết; mở chi tiết từng tòa |
| Tài liệu | Hình ảnh sổ đỏ và các tài liệu gắn với hồ sơ/hợp đồng; thể hiện tòa nhà liên quan |

**Đề xuất tab trong chi tiết tòa nhà:**

| Tab | Nội dung |
|---|---|
| Thông tin chung | Địa chỉ, diện tích, số tầng, số phòng và tình trạng tòa nhà |
| Chủ nhà & hợp đồng | Chủ nhà liên quan và thông tin hợp đồng thuê của tòa |
| Nhân sự | Trưởng nhóm, nhân viên vận hành, vệ sinh và kỹ thuật được phân công |
| Tài sản | Hai nhóm: tài sản chủ nhà và tài sản đầu tư thêm |
| Hồ sơ & minh chứng | Trạng thái PCCC, đăng ký kinh doanh và tài liệu minh chứng đính kèm |
| Vận hành & kết quả | Khoảng thời gian vận hành; hiệu suất và lợi nhuận theo kỳ dữ liệu |
| Lịch thanh toán | Lịch thanh toán cho chủ nhà theo hợp đồng và tình hình thực hiện |

Thông tin dùng chung như hợp đồng hoặc tài liệu được liên kết về cùng hồ sơ nguồn để cập nhật nhất quán giữa các tab và các trang chi tiết.
