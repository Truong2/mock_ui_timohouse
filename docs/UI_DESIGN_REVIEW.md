# TIMEHOUSE · Kiểm tra và tối ưu UI

> **Cập nhật 23/10/2026 — CR-UI-COMP:** hướng “Framed sheet” và cách bố trí lịch sử bên dưới đã được thay thế bởi chuẩn Ant Design Pro và [ma trận component/pattern hiện tại](md/TIMEHOUSE_UI_COMPONENT_STANDARD.md). Đợt mới đã đồng bộ hành động theo nghiệp vụ, DOM/thứ tự đọc, tab/panel, form, menu và modal; xem [kết quả QA](qa/ui-enterprise/results.json) và [ảnh trước/sau](qa/ui-enterprise/). Các nội dung phía dưới được giữ làm lịch sử, không dùng để ghi đè chuẩn mới.

Ngày: 22/10/2026. Skill: `design-taste-frontend` / tasteskill v2.

## Lần tối ưu tiếp theo: danh sách và mobile

Tiếp tục hướng **Framed sheet**, seed **1415674802**, giữ Inter và teal; không redraw. Đã xử lý hai cảnh báo của lần trước. Kết quả mới nhất thay thế bảng kết quả lịch sử phía dưới.

- **BLD-01, CUS-01, ROOM-01, INV-02, PAY-01:** dưới 641px, chính các ô bảng chuyển thành từng hồ sơ. Công nợ, số báo thu, giá phòng và trạng thái hiện ngay; các trường phụ mở bằng “Thông tin khác”. Desktop/tablet giữ bảng. Không nhân đôi dữ liệu hoặc input.
- **Hóa đơn, phiếu thu:** checkbox vẫn chọn đúng chứng từ; chọn không điều hướng sang hồ sơ. Các khóa gói và quyền vẫn dùng cơ chế hiện có.
- **Khách thuê, hóa đơn, phiếu thu:** tổng quan có thể mở/thu gọn trên điện thoại, mặc định mở trên desktop. Bộ lọc trạng thái cuộn trong một hàng. Nút hành động chính đứng trước; bỏ các shortcut đã trùng với hành động của trang.
- **Tòa nhà:** thêm sơ đồ 18 phòng lấy từ `TH.db.rooms`, phân biệt đang thuê, trống, đang sửa và đặt cọc. Từng phòng mở route chi tiết hiện có. Sơ đồ theo cùng kết quả lọc tòa.
- **Biểu đồ:** khung vẽ nhỏ hơn và chữ trục lớn hơn trên điện thoại; chuỗi 6 kỳ hiển thị ít nhãn ngày hơn, vẫn giữ toàn bộ điểm dữ liệu và tooltip.
- **Bản in:** mở phần tổng quan khi in, in đủ trường trong bảng và trả trạng thái thu gọn sau khi in. Đã kiểm tra CSS print và DOM; chưa xuất và nghiệm thu một PDF phân trang.

| Kiểm tra mới nhất | Kết quả |
| --- | --- |
| Inspector BLD-01, CUS-01, ROOM-01, INV-02, PAY-01, RPT-01 | **0 FAIL, 0 WARN** cho cả 6 màn ở 1440 / 768 / 390px |
| `tools/qa-ui-refinement.playwright.js` | **80/80 PASS** |
| Ma trận trong kịch bản mới | 5 danh sách × 4 gói × 3 kích thước = 60 trường hợp |
| Mở/thu gọn bằng bàn phím, chọn chứng từ, resize, tìm kiếm rỗng, sơ đồ phòng | PASS trong kịch bản 80 kiểm tra |
| Kịch bản điều hướng hiện có | **22/22 PASS** |
| Smoke render qua các gói, kỳ, tab và dialog | **1.088/1.088 PASS** |
| Mở trực tiếp qua file:// | Hồ sơ mobile và nút mở thông tin hoạt động |
| CSS print và khôi phục trạng thái | Tổng quan mở, trường phụ hiện đủ, sau in thu gọn lại |
| Syntax JavaScript và whitespace diff | PASS |

Ảnh và JSON mới nằm trong `.taste-skill/iteration2/{buildings,customers,rooms,invoices,payments,overview}/`. Các lượt inspector cuối chạy tuần tự sau khi lượt chạy nhiều trình duyệt cùng lúc chụp quá sớm lúc app chưa tải xong. Kết quả UI mới nhất dựa trên những lượt cuối đã tải đúng ứng dụng. Không cấp `--allow`.

Static lint riêng `css/refinement.css`: 0 FAIL, 10 WARN, vẫn là các mẫu `box-shadow: none`, `backdrop-filter: none` và chú thích mà scanner nhận nhầm. Không tuyên bố toàn repository đã sạch static lint.

ROUND 1 (lần tối ưu tiếp theo)

Seen in one second: Trên điện thoại có thể đọc số tiền và trạng thái từng hồ sơ, nhưng tổng quan và bộ lọc còn đẩy danh sách xuống thấp.

Idea (one sentence): Mỗi hồ sơ ưu tiên thông tin cần quyết định, phần còn lại mở ngay tại chỗ.

Live thing: Checkbox, mở thông tin, bộ lọc và điều hướng giữ chung dữ liệu với bảng desktop.

Layout words by section: danh sách=hồ sơ hai cột / nhận diện=đầu hồ sơ / số tiền=số dẫn / thông tin phụ=mở tại chỗ.

Scores: design 7.8 · usability 7.8 · creativity 7.4 · content 8.0 → overall 7.7. Nhận xét chủ quan.

Caps applied: Tiêu chí app screen; không áp tiêu chí ảnh hoặc chuyển động của trang marketing.

Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. `iteration2-before-payments.png`: số tiền ngoài màn hình. Đưa số báo thu và trạng thái vào phần mặc định của hồ sơ mobile.
2. `iteration2-before-invoices.png`: KPI và nhiều hàng bộ lọc đẩy danh sách xuống. Thu gọn tổng quan, giữ bộ lọc một hàng, bỏ shortcut trùng.
3. `check-buildings/desktop-fold.jpg` của lần trước: danh sách tòa ngắn và thiếu đường vào phòng. Bổ sung sơ đồ phòng theo đúng dữ liệu và phạm vi lọc.

ROUND 2 (lần tối ưu tiếp theo)

Seen in one second: Đọc được công nợ, trạng thái và thao tác của từng hồ sơ trên điện thoại; desktop có sơ đồ phòng hữu ích.

Idea (one sentence): Ưu tiên quyết định vận hành rồi mới mở phần chứng minh và thông tin phụ.

Live thing: Mở trường phụ bằng Enter, chọn chứng từ, lọc, mở phòng và mở/đóng tổng quan đều đã kiểm tra.

Layout words by section: shell=khung hiện có / desktop=bảng / mobile=hồ sơ / tổng quan=disclosure / phòng=sơ đồ có liên kết / biểu đồ=trục dễ đọc hơn.

Scores: design 8.0 · usability 8.2 · creativity 7.5 · content 8.0 → overall 8.0. Nhận xét chủ quan.

Caps applied: Không có giới hạn từ các tiêu chí trang marketing.

Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. `iteration2/customers/mobile-page-01.jpg`: hồ sơ nhiều trường làm trang dài hơn bảng. Giữ phân trang và bộ lọc; trường ít dùng mở theo nhu cầu.
2. `iteration2/invoices/tablet-fold.jpg`: tablet vẫn cần cuộn ngang bảng nhiều cột. Giữ bảng để so sánh số liệu; toàn trang không tràn ngang.
3. `iteration2/customers/mobile-fold.jpg`: một số hành động phụ cần cuộn thanh nút. Hành động chính luôn đứng đầu và có vùng bấm 44px.

Không thêm số liệu, ảnh hay nguồn bên ngoài. Dữ liệu mẫu và các chính sách DRAFT vẫn cần xác nhận trước khi sử dụng thực tế như phần giới hạn cuối báo cáo.

## Phạm vi và hướng thiết kế của lần trước

Đã chỉnh trực tiếp bộ giao diện dùng chung của ứng dụng, sắp lại RPT-01, tối ưu bộ lọc CUS-01 và cập nhật ảnh preview trên trang giới thiệu. Giữ HTML/CSS/JS thuần, font Inter local, các route và phép tính hiện có.

Hướng được chọn từ script: **Framed sheet**, seed **1415674802**. Không redraw. Giữ font và màu thương hiệu bằng `--keep palette,type`. Nền khung pha teal rất nhẹ, vùng làm việc trắng có viền mảnh, không bóng đổ. Teal tập trung vào dữ liệu thu và chỉ số lãi; các chuỗi so sánh dùng sắc trung tính.

Đặc trưng TIMEHOUSE: đối chiếu dòng tiền của Cầu Giấy, Đống Đa, Thanh Xuân cạnh hàng đợi công việc từ chính dataset. Người dùng đi thẳng từ số liệu tới chứng từ hoặc việc cần xử lý.

## Câu hỏi và dữ liệu của từng màn

- **Tổng quan:** Kỳ này thu, chi, công nợ và lãi dòng tiền ra sao; việc nào cần xử lý? Lãi là số dẫn, năm KPI trong một dải, biểu đồ theo tòa và hàng đợi công việc cạnh nhau. Link KPI, drill-down, xuất Excel, in PDF, duyệt kỳ và khóa kỳ vẫn có.
- **Tòa nhà:** Tòa nào đang vận hành và mở hồ sơ nào? Danh sách giữ thông tin thật của demo và hành động vào chi tiết.
- **Khách thuê:** Hồ sơ nào còn nợ hoặc cần theo dõi? Giữ bộ lọc và số đếm; trên điện thoại, các lựa chọn cuộn ngang thay vì xếp thành nhiều hàng. Mã phòng rõ hơn, cột nhận diện cố định, bảng cuộn nội bộ; hành động cuối bảng cuộn cùng dữ liệu để không che phần thông tin còn lại.

Nguồn gồm 3 tòa, 18 phòng, hợp đồng, hóa đơn, phiếu thu, chỉ số và chi phí có sẵn trong dự án. Tổng và số đếm lấy từ `TH.calc` / `TH.db`; không thêm thống kê hoặc lời chứng thực. Hàng đợi phiếu thu là số phiếu đang chờ trong phạm vi tòa; chỉ số chưa xác nhận theo kỳ đang chọn; hợp đồng sắp hết hạn theo ngưỡng cấu hình.

## Kết quả kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| Inspector RPT-01 trước sửa, 1440 / 768 / 390px | 2 FAIL, 1 WARN |
| Inspector RPT-01 sau sửa, 1440 / 768 / 390px | **0 FAIL, 0 WARN** |
| Inspector BLD-01, ba kích thước | 0 FAIL, 1 WARN |
| Inspector CUS-01, ba kích thước | 0 FAIL, 1 WARN |
| Kịch bản điều hướng có sẵn | **22/22 PASS** |
| Smoke render màn, tab, popup, dialog qua 4 gói và 2 kỳ | **1.088/1.088 PASS** |
| 22 màn chính × 3 kích thước | **66/66** không tràn ngang trang, có một h1, có nội dung |
| Lọc Khách thuê, ba link hàng đợi | PASS |
| Lỗi JavaScript trong lượt quét 66 màn | 0 |
| Mở trực tiếp qua file:// | Màn tổng quan, 5 KPI và font Inter tải được |
| JavaScript syntax / git diff whitespace | PASS cho các file đã sửa |

Kịch bản điều hướng đã kiểm tra sidebar thu gọn, lưu trạng thái qua reload, quyền theo vai trò, tìm kiếm, cảnh báo nháp chưa lưu, trở lại báo cáo, menu mobile, giữ focus và phím Escape. Smoke render kiểm tra khả năng render; không thay thế nghiệm thu nghiệp vụ.

Ảnh và JSON inspector nằm trong `.taste-skill/before/`, `.taste-skill/after/`, `.taste-skill/check-buildings/`, `.taste-skill/check-customers/`. Đã mở ảnh desktop, tablet, mobile và contact sheet toàn trang để kiểm tra trực quan. Không cấp `--allow` cho inspector.

Static lint trên `css/refinement.css`: 0 FAIL; 9 cảnh báo do scanner bắt cả `box-shadow: none`, `backdrop-filter: none` và chú thích về shadow. Inspector trình duyệt xác nhận các hiệu ứng đó đã tắt. Quét toàn bộ mã cũ vẫn báo các mẫu ở landing, template và thành phần chưa thiết kế lại; không coi đây là một lần lint sạch toàn repository.

## Nhận xét trực quan

ROUND 1

Seen in one second: Khung làm việc nhẹ hơn, lãi nổi bật; các số khác còn cùng hàng trên desktop.

Idea (one sentence): Dòng tiền theo ba tòa trở thành trung tâm đối chiếu số liệu và công việc vận hành.

Live thing: Bộ lọc phạm vi/kỳ, mở chứng từ và hàng đợi lấy từ dataset.

Layout words by section: shell=khung pha teal / KPI=dải chia cột / dòng tiền=biểu đồ và hàng đợi / chứng từ=bảng / đối chiếu=hai cột / duyệt kỳ=hàng gọn.

Scores: design 7.4 · usability 7.6 · creativity 7.0 · content 8.0 → overall 7.4. Điểm nhận xét chủ quan, không phải số đo tự động.

Caps applied: Dùng tiêu chí app screen; không áp sàn ảnh hoặc animation của landing page.

Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. Mobile KPI cuối bị xuống hàng riêng (`after/mobile-fold.jpg` ở vòng đầu): sửa độ ưu tiên CSS, đưa bốn số phụ về lưới 2×2.
2. Nhãn KPI hơi nhỏ (`after/desktop-fold.jpg` ở vòng đầu): tăng nhãn lên 13px, chữ phụ 12px.
3. Bộ lọc Khách thuê chiếm nhiều hàng (`check-customers/mobile-fold.jpg` ở vòng đầu): tạo nhóm cuộn ngang, giữ ô tìm kiếm đủ chiều rộng.

ROUND 2

Seen in one second: Màn tổng quan có thứ bậc rõ; mobile thấy đủ năm KPI và công việc cần xử lý trong một màn đầu.

Idea (one sentence): Mỗi số liệu vận hành dẫn tới nguồn hoặc công việc tương ứng.

Live thing: Năm KPI, ba hàng công việc, bộ lọc kỳ/tòa và các link drill-down hoạt động.

Layout words by section: shell=khung phẳng / KPI=một số dẫn và bốn số phụ / dòng tiền=so sánh ba tòa / hàng đợi=ba việc / chi tiết=bảng cuộn nội bộ.

Scores: design 7.8 · usability 8.0 · creativity 7.0 · content 8.0 → overall 7.7. Điểm nhận xét chủ quan.

Caps applied: Không áp tiêu chí ảnh và chuyển động của trang marketing.

Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. `check-buildings/desktop-fold.jpg`: chỉ có 3 tòa nên phần dưới danh sách trống. Giữ danh sách đúng số bản ghi, không thêm nội dung giả để lấp chỗ. Đây là cảnh báo inspector đã xem xét.
2. `check-customers/desktop-fold.jpg`: 48% chữ dưới 13px vì tên khách, số hợp đồng phụ, chú thích và metadata dày. Mã phòng chính và nhãn trạng thái đã tăng lên 13px; giữ chữ phụ 12px. Đây là cảnh báo đã xem xét.
3. `check-customers/mobile-page-01.jpg`: bảng nghiệp vụ nhiều cột vẫn cần cuộn ngang. Cố định nhận diện, bỏ cố định cột hành động trên điện thoại và thêm chỉ dẫn cuộn; mở hồ sơ qua mã phòng vẫn sẵn có.

## Giới hạn và dữ liệu cần thay trước khi đưa vào sử dụng

Đây vẫn là demo theo README. Tên, thông tin liên hệ, giấy tờ, địa chỉ, hóa đơn, hợp đồng, số tiền và giá gói đều cần thay bằng dữ liệu được xác nhận. Các chính sách DRAFT, công thức lương/cổ phần/lợi nhuận và backend thật cần nghiệm thu riêng. Không thêm ảnh bên ngoài, không phát sinh nguồn ảnh hoặc giấy phép mới; preview là ảnh chụp chính ứng dụng.
