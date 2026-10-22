# CR-NAV-01 — Thu gọn điều hướng theo nghiệp vụ

Ngày: 21/10/2026. Trạng thái: **đã triển khai giao diện**, theo lựa chọn khoảng 9 mục nghiệp vụ của người dùng.

## 1. Vấn đề và nguyên tắc gom

Sidebar ban đầu có **24 mục chính trong 7 nhóm**, cộng liên kết mục lục kỹ thuật ở chân menu. Sau thay đổi báo cáo CR-RPT-02, hai mẫu báo cáo có một điểm vào chung; CR-NAV-01 tiếp tục gom toàn bộ điều hướng thành **9 khu vực nghiệp vụ**, Cài đặt ở chân sidebar và tài khoản/đơn vị trong menu người dùng.

Các mục trước đây trộn ba cấp: danh sách quản lý (tòa/phòng/khách), thao tác (lập hóa đơn/xác nhận thu), và báo cáo. “Dữ liệu gốc” không thể hiện chuỗi khai thác nhà; “Nhân sự & lợi nhuận” gộp tiền lương với quyền lợi người góp vốn; công nợ xuất hiện ở nhiều tên màn mà chưa làm rõ góc nhìn.

Nguyên tắc mới: sidebar chọn khu vực → tab chọn danh sách liên quan → bấm bản ghi mở hồ sơ → dùng nút thao tác cho nghiệp vụ. Giữ danh sách chính, không tách từng bước thao tác thành một mục sidebar. Các route và ID SRS vẫn tồn tại để deep link, quyền và RTM tiếp tục hoạt động; số điểm vào người dùng giảm, không phải xóa chức năng.

## 2. Cấu trúc 9 mục

| Sidebar | Danh sách/tab bên trong | Thao tác và màn liên quan được đưa vào ngữ cảnh |
| --- | --- | --- |
| **Tổng quan** | Tổng quan vận hành | Chỉ tiêu tòa/kỳ và liên kết đến dữ liệu nguồn; không dùng tên lẫn “Tổng quan · Báo cáo tòa” |
| **Tòa nhà & phòng** | Tòa nhà · Phòng · Chủ nhà | Hồ sơ tòa/phòng/chủ nhà; hợp đồng thuê tòa; thanh toán chủ nhà; import tại từng danh sách |
| **Khách thuê & hợp đồng** | Khách thuê · Hợp đồng thuê phòng | Lưu trú, công nợ/cọc theo hồ sơ thuê; tạo/OCR hợp đồng; theo dõi hết hạn, khảo sát gia hạn bằng nút trong khu vực hợp đồng |
| **Điện nước & dịch vụ** | Chỉ số điện nước & phí dịch vụ | Chỉ số theo phòng, công tơ chung, người sử dụng và phí dịch vụ của kỳ |
| **Hóa đơn & thu tiền** | Hóa đơn · Thu tiền & công nợ · Nhắc thanh toán | Lập/xem/xác nhận hóa đơn; phiếu thu và đối soát; theo dõi thu theo quản lý/tòa/phòng; gửi thông báo và lịch sử gửi |
| **Chi phí vận hành** | Chi phí vận hành | Tạo chi phí, gửi duyệt, duyệt, chứng từ và lịch sử theo quyền |
| **Nhân sự & tiền lương** | Nhân sự & phân công · Bảng lương | Hồ sơ nhân sự, phân công, thiết lập lương, điều chỉnh và duyệt kỳ lương |
| **Cổ đông & lợi nhuận** | Cổ đông & phân chia lợi nhuận | Người góp vốn, tỷ lệ theo tòa, kết quả phân chia và lịch sử; không trộn với lương nhân sự |
| **Báo cáo** | Báo cáo theo mẫu Excel · Hiệu quả kinh doanh · Tổng hợp lương & lợi nhuận | Một điểm vào REPORTS cho hai mẫu Excel và các bản đã tạo; báo cáo phân tích là góc xem tổng hợp, khác màn nhập/duyệt nghiệp vụ |

**Cài đặt** chỉ hiện theo quyền ở chân sidebar. **Tài khoản & đơn vị quản lý** ở menu người dùng trên topbar. Mục lục màn và mã SRS không còn chiếm một mục điều hướng nghiệp vụ; route kỹ thuật vẫn giữ để đối chiếu.

## 3. Tên nghiệp vụ và cách hiểu thống nhất

| Tên cũ | Tên mới | Lý do |
| --- | --- | --- |
| Tổng quan · Báo cáo tòa | Tổng quan vận hành | Phân biệt màn theo dõi với quy trình tạo báo cáo |
| Danh sách khách | Hồ sơ thuê phòng | Danh sách hiện một dòng theo HĐ/hồ sơ thuê; một khách có thể có nhiều lần thuê |
| Hợp đồng | Hợp đồng thuê phòng | Phân biệt với hợp đồng công ty thuê tòa từ chủ nhà |
| Hợp đồng thuê trong hồ sơ chủ nhà | Hợp đồng thuê tòa | Đúng bên thuê/bên cho thuê và nghĩa vụ thanh toán |
| Lịch thanh toán trong hồ sơ tòa | Thanh toán chủ nhà | Phân biệt tiền công ty trả chủ nhà với tiền thu của khách thuê |
| Điện nước | Chỉ số điện nước & phí dịch vụ | Thể hiện cả điện chung và các đầu vào tính phí |
| Lập hóa đơn | Lập hóa đơn tiền thuê & dịch vụ | Đây là thao tác trong danh sách hóa đơn, không phải một phân hệ độc lập |
| Hóa đơn & công nợ | Hóa đơn tiền thuê & dịch vụ | Danh sách nghĩa vụ thanh toán; vẫn hiện đã thu/còn nợ trên từng hóa đơn |
| Báo đã thu | Phiếu thu & đối soát | Phân biệt khoản đang báo/chờ xác nhận với tiền đã xác nhận; giữ hậu kiểm riêng theo vai trò |
| Công nợ & mốc 5/10/15 | Thu tiền & công nợ | Mốc thu là một góc theo dõi trong khu vực, không phải tên phân hệ |
| Check theo phòng | Theo phòng | Loại từ tiếng Anh không cần thiết |
| Phòng mới | Vào ở & giữ chỗ | Dữ liệu gồm hồ sơ vào ở mới và khoản cọc giữ chỗ, không phải danh mục phòng vừa xây |
| Phòng phá HĐ | Chấm dứt trước hạn | Đây là tình huống hợp đồng; phòng sau bàn giao có thể trở lại trống |
| Chi tiết hóa đơn & hiệu suất | Hiệu suất thu tiền | Nêu mục đích phân tích thay vì trùng tên danh sách hóa đơn |
| Zalo OA / Lịch sử Zalo | Thông báo & nhắc thanh toán / Lịch sử gửi thông báo | Nêu công việc; Zalo vẫn là kênh gửi hiện tại, không thêm kênh mới |
| Retry / Dead-letter | Thử gửi lại / Tin lỗi cần xử lý | Ngôn ngữ dành cho người vận hành |
| Lương nháp | Bảng lương | “Nháp/đã duyệt” là trạng thái của kỳ, không phải tên phân hệ |
| Timeline thu/khai thác | Nhật ký hoạt động | Dễ hiểu và phù hợp các sự kiện phòng/hợp đồng/thu tiền |
| Tài chính trong hồ sơ khách | Công nợ & tiền cọc | Nêu rõ nội dung và tránh nhầm với báo cáo tài chính toàn công ty |

Tên hiển thị trong tiêu đề, tìm kiếm và tab được thống nhất. Tìm bằng tên cũ như “Báo đã thu” vẫn dẫn đến danh sách mới. Mã SRS được giữ trong metadata và công cụ đối chiếu, không bày trong tiêu đề nghiệp vụ thông thường.

## 4. Quan hệ nghiệp vụ và thao tác

1. **Chủ nhà → Hợp đồng thuê tòa → Tòa nhà → Phòng.** Hồ sơ tòa liên kết chủ nhà, tài sản, nhân sự và lịch trả chủ nhà. Không nhập lại hợp đồng thuê tòa ở một phân hệ khách thuê.
2. **Khách thuê → Hợp đồng thuê phòng → Hồ sơ lưu trú.** Một khách có thể có nhiều HĐ; phòng trống/đang thuê/đang sửa khác trạng thái HĐ hoặc tình trạng tiền cọc.
3. **Chỉ số và biểu phí → Hóa đơn → Phiếu thu → Công nợ còn lại.** Hóa đơn thể hiện nghĩa vụ; phiếu thu thể hiện khoản được ghi nhận/xác nhận. Mốc ngày thu là phân tích của dữ liệu này, không phải một loại chứng từ mới.
4. **Hóa đơn, chi phí, lương, phân bổ → Kết quả kinh doanh.** Phiếu thu còn phục vụ dòng tiền và đối chiếu công nợ. Không đổi doanh thu theo kỳ thành tiền thực thu vì đổi menu.
5. **Kết quả kinh doanh + tỷ lệ góp vốn → Phân chia lợi nhuận.** Nghiệp vụ này tách khỏi tính lương; báo cáo chỉ tổng hợp/truy nguồn, không thay màn duyệt lương hoặc phân chia.
6. **Hóa đơn/công nợ → Nhắc thanh toán → Lịch sử gửi.** Các màn Zalo trở thành một tab và thao tác xem lịch sử trong khu vực Hóa đơn & thu tiền.

Đường vào tác vụ được đặt lại: từ Hóa đơn có nút **Lập hóa đơn**; từ Thu tiền & công nợ có nút **Phiếu thu & đối soát**; từ Nhắc thanh toán có nút **Lịch sử gửi**; từ Hợp đồng có nút **Theo dõi hết hạn**. Nhận biết mục đang mở vẫn đúng khi mở hồ sơ chi tiết, popup import/OCR/xác nhận hoặc link cũ.

## 5. Sidebar, quyền và tương thích

- Desktop: mở rộng **232px**, thu gọn **72px** bằng nút ở chân sidebar; ghi nhớ lựa chọn sau refresh. Tên dài xuống dòng trong chế độ mở rộng, không cắt mất tên nghiệp vụ.
- Chế độ biểu tượng có tên truy cập và tooltip, giữ dấu active/badge; nội dung được thêm khoảng rộng khi sidebar thu gọn.
- Mobile ≤1080px: sidebar là drawer có scrim; chế độ desktop đã lưu không làm drawer chỉ còn icon. Menu đóng dùng `inert` để không lọt focus vào vùng ngoài màn; mở thì đưa focus vào menu, Escape đóng và trả focus về nút mở, Tab giữ trong drawer.
- Theo vai trò: chỉ hiện khu vực/tab có quyền; Nhân sự chỉ thấy Nhân sự & tiền lương và báo cáo được cấp. Quản lý tòa không thấy Nhân sự/Cổ đông. Mở URL trực tiếp vẫn dùng kiểm tra quyền hiện có.
- Giữ bộ lọc tòa/kỳ và cơ chế cảnh báo nháp khi chuyển tab. Link quay về preview/bản báo cáo vẫn ở đầu trang nguồn, trước thanh tab nghiệp vụ.
- Lớp điều hướng nằm riêng trong `js/navigation.js` và `css/navigation.css`, nạp sau app shell. Không sửa file `screens.js` được sinh từ SRS; không sửa cách tính tiền/trạng thái nghiệp vụ hoặc reset schema để đổi menu. Các thay đổi báo cáo đang diễn ra trong workspace vẫn là phần triển khai riêng.

## 6. Kiểm tra

- Bộ [qa-navigation](../tools/qa-navigation.playwright.js): 9 mục, tab đúng, tên không bị cắt, 72px/232px và ghi nhớ, link cũ/chi tiết, quyền và tìm kiếm, rời trang có nháp, kết nối REPORTS, đường quay về nguồn, mobile và smoke.
- Kết quả máy đọc được: [results.json](qa/navigation/results.json). Ảnh desktop mở rộng/thu gọn và mobile nằm cùng thư mục.
- Không xác nhận hóa đơn/báo cáo hoặc sửa dữ liệu nghiệp vụ trong bộ kiểm tra điều hướng. Trường sửa thử trong hồ sơ chủ nhà được bỏ nháp.
- Smoke không ràng buộc số màn bằng số menu. Các view/route kỹ thuật vẫn được quét; số lượt có thể tăng khi bổ sung báo cáo. Kết quả lần chạy được ghi rõ trong JSON.
