# TIMEHOUSE — Phạm vi phát triển, giới hạn và giá các gói

Cập nhật ngày 26/10/2026. Bản đề xuất trình bày lại từ dự án hiện tại, phục vụ trao đổi và chốt phạm vi với khách hàng.

**Điều chỉnh đã chốt với người dùng:** OCR hợp đồng khách thuê và Zalo OA có ở mọi gói. **OCR chỉ áp dụng cho hợp đồng khách thuê**; không OCR giấy tờ tùy thân, hợp đồng chủ nhà/thuê tòa, hóa đơn hoặc tài liệu khác. Các tài liệu này chỉ nhập tay hoặc đính kèm. Mọi gói giữ hai mẫu báo cáo gốc; B/C/D tăng khả năng phân tích và kiểm soát, không tăng thành 3/4/5 mẫu. Các giới hạn dưới đây dùng cho UI và trao đổi phạm vi; điều kiện tích hợp, mẫu được duyệt và phí sử dụng dịch vụ phải ghi trong báo giá.

**CR-PKG-OPS — thay thế phân tầng cũ:** A nhập và xử lý từng hồ sơ/chứng từ, tính theo bộ công thức cố định; B mới có nhập Excel và thao tác hàng loạt. C thêm kiểm soát nâng cao; D thêm quản trị kỳ/phiên bản. Không cắt phân hệ nghiệp vụ, OCR, OA hoặc hai mẫu báo cáo khỏi A. [Ma trận 52 nhóm hiệu lực](TIMEHOUSE_PACKAGE_FUNCTION_MATRIX.md).

## 1. Cách giới thiệu dự án

TIMEHOUSE là hệ thống quản lý vận hành nhà cho thuê, liên kết hồ sơ chủ nhà, tòa, phòng, khách thuê và hợp đồng với hóa đơn, thu tiền, công nợ, chi phí và báo cáo kết quả kinh doanh. Dữ liệu phát sinh tại từng tòa được tổng hợp theo kỳ, có phân công trách nhiệm và căn cứ để đối chiếu.

Phạm vi phát triển được chia thành bốn gói A/B/C/D, mỗi gói xác định chức năng, mức hỗ trợ xử lý và giới hạn áp dụng. Các gói dùng cùng nền giao diện và các phân hệ cốt lõi; mức giá tăng theo khả năng tự động hóa, kiểm soát và giải trình số liệu.

Trang gửi khách dùng tiêu đề **Phạm vi phát triển theo từng gói**, với các nhãn **Phạm vi và giá**, **So sánh chức năng** và **Nội dung bàn giao**. Nội dung tập trung vào chức năng được phát triển và giới hạn áp dụng của từng gói; sáu bước bàn giao là quy trình thực hiện sau khi khách chọn gói.

Giá dưới đây là **tổng giá trị từng gói**, gói cao bao gồm phạm vi gói thấp. Khoảng giá giữ theo cấu hình dự án: A 50–60, B 70–80, C 80–90, D 90–100 triệu đồng. Đây là đề xuất phạm vi; Excel báo giá đã ký chưa có trong workspace để xác nhận điều kiện thương mại.

## 2. Nội dung chung của mọi gói

- Hồ sơ chủ nhà, tòa, phòng, khách, hợp đồng và tài liệu đính kèm; liên kết dữ liệu xuyên nghiệp vụ.
- Tiền phòng, điện nước, phí dịch vụ, hóa đơn, thu nhiều lần, công nợ và hồ sơ xử lý cọc ở mức cơ bản.
- Chi phí theo tòa/kỳ, thông tin nhân sự, bảng lương và phân bổ cổ phần theo quy tắc đã thống nhất.
- Báo cáo doanh thu theo tòa và kinh doanh tháng theo mẫu khách; xuất Excel và bản in cơ bản.
- OCR hợp đồng khách thuê theo mẫu đã chọn, có người xác nhận trước khi ghi; Zalo OA gửi hóa đơn và nhắc thanh toán theo giới hạn gói, khi đủ điều kiện nhà cung cấp.
- Giao diện thống nhất, biểu mẫu kiểm tra lỗi, hỗ trợ màn hình nhỏ, bảo vệ dữ liệu đang nhập.
- Phân quyền và các điều kiện tài chính tối thiểu: quản lý xác nhận thu tại tòa được giao, kế toán hậu kiểm; người lập và người duyệt hoàn cọc khác nhau; chỉ hoàn tất hoàn cọc sau thực chi. Các điều kiện này áp dụng xuyên gói.

Số màn/nhóm trong registry là chỉ số bao phủ kỹ thuật; không dùng làm cam kết mọi công cụ nâng cao đều có trong A. A thực hiện đầy đủ nghiệp vụ qua từng hồ sơ/chứng từ. Nhập Excel, tự lấy dữ liệu liên phân hệ và xử lý hàng loạt được phân tầng riêng. Hai mẫu báo cáo gốc có ngay trong A; mẫu mới ngoài hai mẫu này phải được xác định riêng.

## 3. Chức năng và giá trị theo mức giá

| Gói | Giá tham chiếu | Phạm vi bàn giao | Giá trị sử dụng |
|---|---:|---|---|
| **A — Vận hành cơ bản** | **50–60 triệu** | Nhập từng hồ sơ, hợp đồng, chỉ số; lập/xác nhận từng hóa đơn; thu từng khoản, công nợ và cọc đủ quy trình; chi phí, nhân sự, lương/cổ phần theo công thức cố định; OCR từng file hợp đồng khách thuê; OA từng hóa đơn; hai mẫu báo cáo gốc và xuất Excel. | Đủ nghiệp vụ để vận hành, hệ thống tính đúng từ đầu vào đã nhập. |
| **B — Hỗ trợ nhập liệu** | **70–80 triệu** | Toàn bộ A; nhập Excel có xem trước/lỗi dòng; nhập chỉ số, lập/xác nhận/xuất/gửi hóa đơn hàng loạt; OCR tối đa hai mẫu hợp đồng khách thuê; lấy đầu vào liên phân hệ; sinh lịch trả; OA gửi danh sách/ba mốc; truy nguồn và xu hướng sáu kỳ. | Giảm nhập lặp và thời gian xử lý danh sách. |
| **C — Kiểm soát nâng cao** | **80–90 triệu** | Toàn bộ B; gợi ý khoản nghi trùng, so khớp hồ sơ và ngoại lệ; duyệt, đối chiếu, lịch sử phân công; bản số liệu đã duyệt; phân bổ theo quy tắc; so tòa/nhóm/kỳ, cảnh báo; hàng đợi OA. | Kiểm soát phối hợp nhiều người và sai lệch liên nguồn. |
| **D — Quản trị theo kỳ** | **90–100 triệu** | Toàn bộ C; khóa kỳ tài chính, điều chỉnh có căn cứ; phiên bản và đối chiếu báo cáo; lịch sử chính sách trong phạm vi chốt; đối soát sao kê nhập vào, phân bổ một khoản thu nhiều hóa đơn; thư viện mẫu OCR hợp đồng khách thuê theo danh mục đã duyệt, giám sát OA. | Giải trình thay đổi và đối chiếu các kỳ đã chốt. |

### Giải thích phần giá tăng thêm

- **A → B:** chi phí cho đọc/kiểm dữ liệu đầu vào, thao tác hàng loạt và tự động hóa tác vụ lặp lại.
- **B → C:** chi phí cho kiểm tra liên kết, chống trùng, xử lý ngoại lệ, quy trình kiểm soát và đối chiếu trước/sau duyệt.
- **C → D:** chi phí cho lịch sử có phiên bản, khóa kỳ, điều chỉnh có truy vết và khả năng giải trình dữ liệu đã bàn giao.

Không diễn giải rằng gói thấp bỏ các bước bảo vệ tài chính bắt buộc. Giao diện enterprise là nền chung, không phải phần nâng cấp chỉ có ở D.

### Giới hạn OCR, OA và hai mẫu báo cáo

| Phần | A | B (gồm A) | C (gồm B) | D (gồm C) |
|---|---|---|---|---|
| OCR hợp đồng khách thuê | Một mẫu hợp đồng khách thuê đã chọn; sửa và xác nhận từng file | Tối đa hai mẫu hợp đồng khách thuê; chỉ rõ trường cần rà soát | Giữ tối đa hai mẫu hợp đồng khách thuê của B; thêm kiểm trùng và so khớp phòng–khách–hợp đồng | Thư viện mẫu hợp đồng khách thuê được duyệt; số mẫu ghi trong báo giá; có lịch sử sửa |
| OA | Một OA, tối đa hai mẫu tin duyệt; gửi từng hóa đơn và một lịch nhắc cố định | Giữ một OA; thêm gửi danh sách, mẫu hết hạn hợp đồng và ba mốc nhắc | Cá nhân hóa theo tòa và xử lý lỗi gửi theo quy tắc | Phiên bản mẫu, lịch sử và giám sát gửi lại |
| Báo cáo | Hai mẫu gốc: doanh thu theo tòa và kinh doanh tháng; xem/xuất theo kỳ | Giữ hai mẫu; truy nguồn chứng từ và xu hướng tối đa sáu kỳ | Giữ hai mẫu; so tòa/nhóm/kỳ, lưu số liệu duyệt và theo dõi sai lệch | Giữ hai mẫu; khóa kỳ, phiên bản và đối chiếu lịch sử |
| Xử lý bổ sung | Nhập từng hồ sơ; lương/cổ phần theo bộ quy tắc cố định; không nhập Excel | Nhập Excel và chạy hàng loạt các tác vụ/mẫu đã thống nhất | Quy trình duyệt và phân bổ theo danh sách đã chốt | Phiên bản/đối soát theo đối tượng và mẫu đã chốt; chưa kết nối ngân hàng tự động |

Không cam kết OCR mọi định dạng, nhiều OA không giới hạn, tự thiết kế báo cáo hoặc tự cấu hình mọi công thức. Mọi gói đều bỏ qua khoản đã xác nhận thu đủ khi nhắc thanh toán; không đợi kế toán hậu kiểm mới dừng nhắc. Hai mẫu là hai loại báo cáo, không phải giới hạn số lần chạy hoặc số bản lưu.

Mọi gói kiểm tra trường bắt buộc, mã duy nhất, chỉ số hợp lệ, thuê chồng thời gian, tổng cổ phần 100%, chống ghi/gửi trùng. Thành phần A/B/C/D trong công thức hiệu suất dùng đầy đủ ở mọi gói; không phải quyền gói giá. Khác biệt hiển thị hiệu suất A/B so với bản trước được giải thích bằng việc bỏ công thức rút gọn theo gói; bộ tính hóa đơn/P&L/dataset không đổi.

Thu tiền cho công nợ của hóa đơn kỳ cũ đã khóa vẫn được phép theo quyền và ngày thực nhận; không sửa nội dung hóa đơn cũ. A ghi thiếu/thừa trên một hóa đơn; phân bổ một khoản thu cho nhiều hóa đơn từ D.

## 4. Mốc bàn giao và tiêu chí nghiệm thu

A–D là các lựa chọn phạm vi phát triển, không phải các mốc đầu tư. Các bước bàn giao dưới đây áp dụng sau khi chọn gói; không phải sáu gói có giá độc lập. Phần B/C/D chỉ đưa vào nghiệm thu khi nằm trong gói hoặc phụ lục đã ký.

| Mốc | Công việc và đầu ra | Điều kiện nghiệm thu |
|---|---|---|
| **M1 — Chốt phạm vi và quy tắc tính** | Ma trận chức năng theo gói; trường dữ liệu; phân quyền; mẫu chứng từ/báo cáo; mẫu hợp đồng khách thuê dùng OCR và danh sách trường cần đọc; danh mục công thức và ví dụ đối chiếu; giao diện được duyệt. | Mỗi chức năng có đầu vào, đầu ra, người xử lý và tình huống kiểm thử; quy tắc chưa chốt được liệt kê và thống nhất cách xử lý. |
| **M2 — Hồ sơ và hợp đồng** | Chủ nhà → tòa → phòng → khách → hợp đồng; biểu phí; tài liệu, bàn giao; danh mục nhân sự và phân công. OCR chỉ hợp đồng khách thuê theo mức gói; nhập Excel từ B. | Hồ sơ liên kết đúng; kiểm tra trường bắt buộc; không tạo thuê phòng chồng thời gian; quyền truy cập đúng phạm vi; nhập/sửa giữ dữ liệu hợp lệ; dữ liệu OCR hợp đồng khách thuê phải được rà soát, sửa và xác nhận trước khi ghi. Giấy tờ khác chỉ đính kèm hoặc nhập tay. |
| **M3 — Hóa đơn, thu tiền và cọc** | Điện nước, phí, lập nháp/xác nhận hóa đơn; ghi nhận thu, công nợ, theo dõi mốc 5/10/15; quy trình kết thúc HĐ và hoàn cọc. | Bộ ví dụ tính tiền khớp; thu đủ/thiếu/thừa/nhiều lần rõ ràng; không ghi trùng; quản lý xác nhận thu, kế toán hậu kiểm; duyệt cọc chưa làm phát sinh trạng thái đã chi. |
| **M4 — Chi phí, hiệu suất và báo cáo** | Chi phí tòa/kỳ; lịch trả chủ nhà; hiệu suất, lương/cổ phần theo phạm vi; báo cáo theo tòa và toàn hệ thống, Excel/bản in. | Tổng tòa khớp tổng hệ thống; doanh thu, tiền thu, cọc và chi phí phân biệt đúng; báo cáo có căn cứ; lương/cổ phần khớp ví dụ đã duyệt. |
| **M5 — Hoàn thiện nâng cấp của gói** | B: hàng loạt, nhập Excel, OCR tối đa hai mẫu hợp đồng khách thuê, lịch nhắc, xu hướng. C: giữ giới hạn mẫu OCR của B, thêm so khớp hợp đồng khách thuê; kiểm trùng, ngoại lệ, duyệt, snapshot, phân bổ. D: thư viện mẫu OCR hợp đồng khách thuê và lịch sử sửa; phiên bản, khóa kỳ, truy vết, đối soát và giám sát. Với A, nghiệm thu OCR một mẫu hợp đồng khách thuê và phạm vi cơ bản. | Chạy các tình huống riêng của từng mức trên cùng dữ liệu; thao tác lặp không gây sai/trùng; thay đổi không làm mất căn cứ của kỳ/bản đã chốt. |
| **M6 — UAT và đưa vào sử dụng** | Kiểm thử với dữ liệu khách đã xác nhận; khắc phục lỗi trong phạm vi; nạp dữ liệu đầu kỳ; triển khai, sao lưu/phục hồi, hướng dẫn và bàn giao. | Người dùng thực hiện được quy trình một kỳ; quyền được kiểm tra phía server; kết quả được đối chiếu; thử phục hồi dữ liệu và ký biên bản nghiệm thu. |

Lịch tuần/ngày và tỷ lệ thanh toán từng mốc được xác định sau khi chốt gói, quy tắc tính và nguồn tích hợp. Chưa có căn cứ trong dự án để coi một lịch hoặc tỷ lệ thanh toán là đã thống nhất.

## 5. Phần đã làm và phần cần để vận hành thật

**Đã có trong dự án:** demo tương tác HTML/CSS/JS, giao diện enterprise, xem thử A–D, các luồng nghiệp vụ và bộ tính mô phỏng, xuất Excel, bản báo cáo lưu/phiên bản trong trình duyệt; dataset 3 tòa/18 phòng/6 kỳ và hồ sơ đối chiếu 13 workbook. QA đã ghi nhận 236 assertion trình duyệt, 1.088 lượt smoke, 3.556 kiểm tra cấu trúc và 3.718 phép đối chiếu số học độc lập.

**Để nghiệm thu sản phẩm vận hành:** cần triển khai/xác minh backend, cơ sở dữ liệu, đăng nhập và quyền phía server, lưu trữ tài liệu, nhập Excel theo gói, OCR hợp đồng khách thuê thật, kết nối OA và các tác vụ chạy nền thuộc gói; tiếp đó triển khai, sao lưu, nạp dữ liệu và UAT. Các đầu ra demo là căn cứ thiết kế và kiểm thử, chưa chứng minh các thành phần này đã hoạt động thật.

Dữ liệu 3 tòa/18 phòng là bộ trình diễn hiện tại. Số tòa/phòng/người dùng được hỗ trợ trong bản vận hành, khối lượng dữ liệu ban đầu và yêu cầu hiệu năng cần ghi trong phạm vi ký kết.

## 6. Các điều kiện phải ghi khi chốt giá

- Số mẫu Excel, số mẫu hợp đồng khách thuê dùng OCR và danh sách trường cần đọc, biểu mẫu hợp đồng, biểu phí, loại báo cáo và các quy tắc ngoại lệ được áp dụng.
- Phạm vi dữ liệu đầu kỳ: lấy từ nguồn nào, bên nào làm sạch/xác nhận, số lần chuyển đổi và đối chiếu.
- Quy tắc lương `/90` hay `/100`, TH1 cọc/thu trước nhiều tháng, cách phân chia phí và ý nghĩa vốn cổ phần phải được xác nhận trước khi dùng số liệu chính thức.
- Phí OCR/OA, máy chủ, lưu trữ, tên miền, thuế và bảo trì: ghi rõ khoản đã gồm/chưa gồm, bên thanh toán và thời hạn hỗ trợ; chưa tự coi nằm trong khoảng giá trên.
- Mẫu mới hoặc thay đổi quy tắc sau khi chốt phạm vi được ghi thành yêu cầu thay đổi, kèm ảnh hưởng chi phí và lịch bàn giao.

## 7. Câu giới thiệu có thể dùng với khách

> TIMEHOUSE có bốn gói phát triển A–D, giá dự kiến từ 50 đến 100 triệu đồng. Mỗi gói xác định rõ chức năng được phát triển, giới hạn xử lý và nội dung bàn giao. A đáp ứng vận hành cơ bản; B thêm hỗ trợ nhập liệu và xử lý hàng loạt; C thêm kiểm soát sai sót; D thêm quản trị theo kỳ và truy vết. Khách lựa chọn gói theo nhu cầu sử dụng, đối chiếu giới hạn triển khai và điều kiện nghiệm thu trước khi chốt phạm vi.

Căn cứ: [ma trận chức năng](../../js/features.js), các cập nhật CR trong mã dự án, [cấu hình giá](../../js/store.js), [decision log](TIMEHOUSE_MOCKUP_DECISIONS.md), [bàn giao dataset và QA](TIMEHOUSE_DATASET_QA.md).

## 8. UI giới thiệu và cách gửi khách (24/10/2026)

Trang `index.html?previewPackage=A#/` có thẻ giá A–D, phần chi tiết gói đang chọn, ví dụ sử dụng, tiêu chí nghiệm thu, bảng so sánh tám nghiệp vụ, bảng 52 chức năng, sáu mốc bàn giao và giải đáp. Chọn gói cập nhật đồng thời nội dung, liên kết xem demo và liên kết chia sẻ; không đổi dữ liệu nghiệp vụ. Drawer chọn gói trong ứng dụng dùng cùng nội dung, có đường trở lại trang giới thiệu.

Nút **Sao chép liên kết** tạo URL trang giới thiệu đúng gói, bỏ tham số QA. Dùng URL website đã triển khai để gửi khách; địa chỉ localhost hoặc file trên máy chỉ phục vụ kiểm tra tại máy. Bản giới thiệu phân biệt demo mô phỏng với phạm vi cần triển khai thật, không tự cam kết thời gian, tỷ lệ thanh toán hoặc chi phí dịch vụ chưa thống nhất.

**QA CR-PKG-OPS:** [261 assertion trình duyệt](../qa/package-policy/summary.json), gồm 55 kiểm tra chính sách và 206 hồi quy; smoke 1.088/0 lỗi, mapping 156/156. Quét 1.744 biến thể màn và 432 dialog ở 375/768/1024/1440px không lỗi bố cục/tab/input. Có kiểm guard handler/deep link/dialog sau hạ gói, bảo toàn nháp/dữ liệu, OCR/OA, hóa đơn, thu tiền, cọc, lương/cổ phần và báo cáo. 2.524 chỉ tiêu tài chính khớp baseline đã lưu; 3.718 phép đối chiếu Decimal đạt. Lint UI không có phát hiện. Trình duyệt QA là Chromium; Firefox/Safari chưa kiểm trong đợt này.

Nguồn chung `js/package-policy.js` nạp sau registry/CR và trước các view. `TH.requireFeature(incId)` là helper nội bộ trả boolean, mở giải thích khi khóa gói; không cấp thêm quyền vai trò. Giữ API ngoài, ID, schema 12 và dữ liệu đã lưu. Phiếu thu mới có metadata `clientRequest` tùy chọn để chống gửi lại cùng yêu cầu; bản cũ không cần migration. OCR/OA vẫn mô phỏng, không gọi dịch vụ thật.

Ảnh các gói: [A desktop](../qa/package-policy/A-1440.png), [B desktop](../qa/package-policy/B-1440.png), [C desktop](../qa/package-policy/C-1440.png), [D desktop](../qa/package-policy/D-1440.png), [A mobile](../qa/package-policy/A-375.png), [B mobile](../qa/package-policy/B-375.png), [C mobile](../qa/package-policy/C-375.png), [D mobile](../qa/package-policy/D-375.png).

Đối chiếu hình trước/sau phần giới thiệu D: [trước desktop](../qa/package-policy/before-D-1440.png) → [sau desktop](../qa/package-policy/D-1440.png); [trước mobile](../qa/package-policy/before-D-375.png) → [sau mobile](../qa/package-policy/D-375.png). Ảnh trước lấy nguyên từ commit nền `fc8e64c`. [Đối chiếu số học](../qa/package-policy/arithmetic.json).

Ảnh bàn giao: [desktop — giới thiệu](../qa/pricing/desktop-intro.png), [desktop — mức giá](../qa/pricing/desktop-prices.png), [mobile — giới thiệu](../qa/pricing/mobile-intro.png), [mobile — phạm vi gói](../qa/pricing/mobile-scope.png), [mốc bàn giao desktop](../qa/pricing/milestones-1440.png), [mốc bàn giao mobile](../qa/pricing/milestones-375.png).

## 9. Phạm vi OCR đã chốt ngày 26/10/2026

OCR chỉ dùng để đọc hợp đồng khách thuê. Thông tin khách, phòng, giá thuê, phí và các trường khác được trích từ chính hợp đồng, sau đó người dùng rà soát, sửa và xác nhận trước khi lưu. Không bàn giao OCR riêng cho giấy tờ tùy thân, hợp đồng chủ nhà/thuê tòa, hóa đơn hoặc tài liệu khác.

- A: một mẫu hợp đồng khách thuê đã chọn.
- B: tối đa hai mẫu hợp đồng khách thuê; chỉ rõ trường cần kiểm tra.
- C: giữ giới hạn mẫu của B, thêm kiểm trùng và so khớp dữ liệu hợp đồng khách thuê.
- D: thư viện mẫu hợp đồng khách thuê đã duyệt và lịch sử sửa; số mẫu ghi trong báo giá.

M1 chốt mẫu hợp đồng và trường cần đọc; M2 nghiệm thu việc đọc, rà soát và xác nhận hợp đồng khách thuê; M5 nghiệm thu phần nâng cao của gói đã chọn. Giá tham chiếu giữ A 50–60, B 70–80, C 80–90, D 90–100 triệu đồng; lần cập nhật này sửa phạm vi, chưa điều chỉnh mức giá.

Đã đồng bộ trang giới thiệu, chi tiết gói, drawer chọn gói, bảng so sánh và ma trận 52 chức năng. F011 được trình bày là nhập tay/đính kèm giấy tờ khách; F012 là OCR hợp đồng khách thuê. Registry SRS gốc được giữ để đối chiếu lịch sử; nội dung hiệu lực lấy từ `js/package-policy.js`.

Kiểm tra lại bằng `tools/qa-pricing.playwright.js`: **50/50**, gồm bốn gói ở 375/768/1024/1440px, chọn/chia sẻ gói, bảng so sánh, drawer, điều hướng và smoke **1.088 lượt / 0 lỗi**. Không tràn ngang và không có lỗi JavaScript trong bộ kiểm tra. Ảnh và số liệu QA ở mục trước là bằng chứng của đợt 24/10; không dùng làm ảnh chụp cho lần cập nhật phạm vi này.
