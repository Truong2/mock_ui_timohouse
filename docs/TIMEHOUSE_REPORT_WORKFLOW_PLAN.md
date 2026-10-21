# Plan báo cáo theo mẫu Excel — cập nhật sau Claude CR-BILL

Ngày: 21/10/2026. Trạng thái: **đã triển khai (CR-RPT-02)** — kết quả ở [Decision log §9.10](TIMEHOUSE_MOCKUP_DECISIONS.md) và [QA §8.9](TIMEHOUSE_MOCKUP_QA.md); kiểm thử `tools/qa-report.playwright.js` 11/11.

Bản này thay thế plan báo cáo trong hội thoại, giữ đầy đủ các lựa chọn người dùng đã chốt và bổ sung căn cứ từ working tree **schema 12** sau CR-PAY/CR-BILL. Base commit là `70763e3`; các thay đổi Claude chưa commit nên không coi commit này là toàn bộ baseline.

## 1. Kết quả theo dõi và phần cần cập nhật

Đã theo dõi phiên Claude của workspace đến thông báo hoàn tất CR-BILL lúc **17:14:37, Asia/Bangkok**. Claude tiếp tục trả lời câu hỏi về trạng thái phòng và kết thúc lượt đó lúc **17:17:27**; lượt trả lời này không thay đổi code. Tiến trình Claude trong VS Code vẫn có thể mở sau khi tác vụ hoàn tất; bằng chứng kết thúc là log assistant `end_turn`, không phải tiến trình bị đóng.

Claude báo `qa-bill` 8/8, `qa-pay` 12/12, `qa-cus` 23/23, `qa-ocr` 9/9, smoke 1048/0 lỗi. Đợt rà soát này chạy độc lập smoke và kiểm tra số P&L/trả trước, xác nhận **1048/0 lỗi** trên schema 12. Không chạy lại độc lập cả bốn bộ nghiệp vụ. Kết quả chi tiết Claude ghi ở [QA, mục 8.8](TIMEHOUSE_MOCKUP_QA.md).

**Mục tiêu giao diện không lệch. Phần thiết kế nguồn, lưu phiên bản và kiểm thử của plan trước cần chi tiết thêm:**

| Thay đổi hiện tại | Điều chỉnh bắt buộc trong plan báo cáo |
| --- | --- |
| Tiền phòng thu trước được phân bổ bằng `rentShare` và `rentCovering`; nguồn có `kind: 'prepaid'` | Truy nguồn xuyên kỳ, mở đúng hóa đơn gốc và chỉ lấy phần thuộc tháng báo cáo. Ví dụ hóa đơn TX-301 kỳ 09 có 14.700.000 cho 09–11; kỳ 10 nhận 4.900.000. |
| Điện chung, số người theo kỳ, tiền phòng lẻ ngày và giảm trừ/phụ thu | Lưu căn cứ tính cụ thể của từng dòng, dấu cộng/trừ và trạng thái duyệt; không chỉ lưu mã hóa đơn hoặc tổng tiền. |
| Quản lý tòa xác nhận thu; kế toán hậu kiểm; thêm quyền điều chỉnh và cấu hình tính tiền | Mở đúng màn/chứng từ và kiểm tra quyền hiện tại cho từng thao tác. Không áp lại quyền xác nhận thu cũ cho kế toán. |
| Số mẫu P&L thay đổi theo schema 12; chuẩn hóa HS/lương G-03 vẫn chưa áp dụng | Cập nhật số kiểm thử, giữ cảnh báo BILL-Q7 và trạng thái quy tắc đề xuất. Không tự coi số schema cũ là chuẩn hoặc tự sửa công thức lương. |
| `roomStateAt` dùng mốc ngày 28 cho nhãn “cuối kỳ” | Sửa mốc thời gian trước khi hoàn thiện báo cáo. Fixture có sự kiện nhận khách 31/10 đang trả `vacant` thay vì `occupied`. |

Code báo cáo hiện tại vẫn tính trực tiếp khi xem/xuất, chưa có `reportRuns`/`reportDrafts`. `prepaid` chưa có nhãn/đường mở riêng trong `srcLink`; các dòng tổng và tỷ lệ chưa có truy nguồn đầy đủ. Đây là các phần còn phải thực hiện, không được coi là đã hoàn thành nhờ smoke đạt.

## 2. Luồng và phạm vi đã chốt

- Chỉ áp dụng cho **RPT-04 — Doanh thu theo tòa** và **RPT-05 — Báo cáo kinh doanh tháng**. Các màn RPT-01/02/03 giữ luồng hiện tại.
- Một mục **Báo cáo theo mẫu Excel** mở danh sách bản đã tạo. Có tìm kiếm và lọc theo loại, tòa, kỳ tháng và người tạo; mặc định mới nhất trước, hiển thị mọi phiên bản.
- Mỗi dòng gồm mã báo cáo, loại, kỳ, phạm vi tòa, phiên bản, người/thời điểm tạo, cảnh báo và thao tác **Xem / Tải Excel / Tạo phiên bản mới**.
- **Tạo báo cáo:** chọn loại → chọn tháng → chọn một hoặc nhiều tòa trong quyền truy cập → **Xem trước**. Chọn tất cả chỉ chọn các tòa người dùng có quyền.
- RPT-04: một preview cho mỗi tòa; xác nhận một lần tạo một bản ghi riêng cho từng tòa. Nút xác nhận hiển thị số báo cáo sẽ tạo.
- RPT-05: một preview tổng hợp các tòa được chọn. Có tab ứng với đủ sheet sẽ xuất: **Kinh doanh, Tổng, các nhóm nhà có tòa được chọn**. Trong mỗi nhóm chỉ tổng hợp các tòa đã chọn; không mở rộng ra cả nhóm.
- RPT-04 giữ đầy đủ sheet báo cáo, chia cổ phần và nguồn số liệu; preview có các tab tương ứng để xem đủ nội dung trước khi xác nhận.
- Chỉ **Xác nhận tạo báo cáo** mới sinh bản ghi. Hủy/quay lại không tạo; bấm xác nhận lặp không sinh bản trùng. Tải Excel thực hiện từ bản đã tạo.
- Tạo báo cáo không tự duyệt hay khóa kỳ. Có thể tạo từ kỳ đã khóa nhưng thao tác sửa nguồn vẫn tuân thủ khóa kỳ.
- Tạo, preview, xem nguồn, quản lý phiên bản và tải Excel áp dụng cho **tất cả gói A–D**. Các tính năng nâng cao khác giữ giới hạn gói hiện tại.

## 3. Số liệu, truy nguồn và xử lý preview sai

### 3.1 Dùng chung một kết quả tính

- Tái sử dụng `C.pnl(period, scope, mode)` và `C.shareSplit` làm nền; tách phần dựng bảng/sheet của `js/views/bizreports.js` để preview và Excel dùng chung kết quả đã tính.
- Không viết một bộ công thức khác cho preview/Excel. Mỗi ô định danh bằng `sheetId + columnKey + metricKey` để mở đúng nguồn, kể cả cột Tổng, tòa, nhóm và tỷ lệ.
- Mặc định giữ cách phân loại hiện tại của schema 12: dòng `common` vào doanh thu điện; giảm trừ âm vào tiền phòng; phụ thu dương vào dịch vụ khác. Preview giải thích cách phân loại này; không tự đổi chính sách nghiệp vụ.
- Giữ phân biệt Kinh doanh/Tổng theo bộ tính hiện có, không coi mọi khoản cọc/thu tiền là doanh thu. Các quy tắc còn đề xuất phải có nhãn và cảnh báo kèm liên kết đến căn cứ.
- “Tổng số phòng mới” phải giải thích đúng định nghĩa đang tính trong P&L từ ngày bắt đầu HĐ. Không lấy trực tiếp số dòng tab Phòng mới để thay thế, vì tab đó còn có dòng giữ chỗ và dùng ngày bắt đầu tính tiền. Không âm thầm đồng nhất các khái niệm này.

### 3.2 Mọi ô số liệu có thể truy nguồn

- Bấm số tiền, số phòng, tổng, tỷ lệ hoặc cổ phần mở **Nguồn và cách tính**; header nhóm không có số liệu không cần thao tác. Nút hỗ trợ bàn phím và có tên truy cập rõ ràng.
- Hiển thị ngữ cảnh sheet/tòa/kỳ/chế độ, công thức, thành phần cộng/trừ, quy tắc lọc, danh sách nguồn đóng góp, tổng đối chiếu và chênh lệch làm tròn.
- Tổng/tỷ lệ đi tiếp xuống thành phần rồi chứng từ; ô Tổng nhiều tòa đi qua đóng góp từng tòa. Mẫu số 0 hiển thị “Không áp dụng”, không hiển thị 0% như một kết quả hợp lệ.
- Tiền phòng trả trước: ghi hóa đơn gốc, kỳ xuất hóa đơn, các kỳ được trả trước, tổng dòng thuê, phần kỳ đầu và phần từng kỳ sau. `prepaid` mở hóa đơn gốc INV-03; không chỉ hiển thị mã trần.
- Tiền phòng lẻ ngày: ghi ngày tính tiền từ/đến, số ngày, mẫu số 30/ngày thực, giá chốt, số tiền trước/sau làm tròn. Không suy ngược số tiền từ hệ số đã rút gọn trên giao diện.
- Điện chung: từ dòng hóa đơn đến công tơ/chỉ số chung, đơn giá, cách chia, số người/phòng của kỳ, phần phòng trống và phần dư làm tròn. Tổng phân bổ cộng thất thoát phải khớp tiền công tơ.
- Giảm trừ/phụ thu: từ dòng hóa đơn đến `billAdjusts` qua `refId`, giữ dấu số tiền, loại, lý do, người/trạng thái duyệt và kỳ hiệu lực. Quan hệ giải thích dòng hóa đơn không được cộng thêm lần nữa vào tổng báo cáo.
- Hỗ trợ đầy đủ các nguồn còn lại: hóa đơn và dòng phí, cọc, phá HĐ, tiền phòng phát sinh, chi phí, HĐ thuê tòa, lương, phân bổ chung, cổ phần và lịch sử trạng thái phòng. Nguồn không có trang riêng mở modal chi tiết đúng bản ghi, không đẩy về một danh sách không lọc.
- Hiển thị số lượng và lý do loại các nguồn nháp/chưa duyệt. Trạng thái hậu kiểm thu tiền không tự làm đổi số doanh thu đã ghi nhận; mỗi chỉ tiêu dùng đúng định nghĩa nguồn của nó.

### 3.3 Sửa tại nguồn rồi tính lại

- Nút **Mở dữ liệu nguồn** giữ tòa/kỳ/mã bản ghi và đường quay về preview. Nút **Tính lại preview** dựng lại kết quả và hiển thị chỉ tiêu thay đổi; không nhập đè số trực tiếp trên báo cáo.
- Kiểm tra các quyền hiện có: `invoice.confirm`, `invoice.adjust`, `invoice.adjust.approve`, `billing.rules`, `meter.edit/approve`, `receipt.confirm`, `receipt.audit`, quyền chi phí/lương và phạm vi tòa. Mở nguồn không tự tạo quyền sửa hoặc vượt khóa kỳ.
- Hóa đơn đã xác nhận giữ nguyên. Quy tắc/điện chung thay đổi chỉ tính lại hóa đơn nháp; điều chỉnh hóa đơn đã xác nhận đi theo quy trình kỳ sau hiện có. Preview phải giải thích vì sao sửa nguồn hiện tại chưa làm số báo cáo kỳ cũ đổi.
- Cảnh báo nghiệp vụ cho phép tạo sau khi tích đã đọc. Lỗi tính toán, thiếu nguồn bắt buộc để tính, số không hữu hạn, tổng không đối chiếu được ngoài làm tròn cho phép, tham số sai hoặc vượt quyền thì chặn tạo.
- Kiểm tra preview cũ bằng dấu vân tay dữ liệu liên quan, gồm cả hóa đơn kỳ trước còn phân bổ vào kỳ này, quy tắc tính tiền, dòng điều chỉnh, điện chung/số người và các nguồn lương/phân bổ/cọc/phòng. Nếu thay đổi trước xác nhận, yêu cầu tính lại và xem lại cảnh báo.

## 4. Bản lưu, cấu trúc và tương thích

### 4.1 Bản báo cáo bất biến

- Bổ sung `reportDrafts` cho lựa chọn/preview và `reportRuns` cho bản đã tạo; bản đã xác nhận chỉ đọc. `ReportRun` lưu mã, loại, kỳ, danh sách tòa chuẩn hóa, phiên bản, bản trước, người/thời điểm tạo, phiên bản mẫu/bộ tính/schema, các sheet, metric, cây nguồn, cảnh báo và căn cứ tính.
- Snapshot sao chép dữ liệu tối thiểu cần để giải thích và xuất lại; không giữ tham chiếu đến object sống trong `TH.db`, không chụp toàn bộ database và không sao chép dữ liệu cá nhân không cần thiết.
- Snapshot giữ nhãn/tên tòa, nhóm, công thức, thông số phân bổ và quy tắc áp dụng tại lúc tạo. Xem lại/Excel không tính lại theo bộ lọc, cấu hình hoặc template hiện tại.
- Với hóa đơn đã xác nhận, số tiền ghi sổ là căn cứ. Khi bổ sung căn cứ tính cho lần xác nhận hóa đơn mới, lưu cùng dòng hóa đơn; không dựng lịch sử giả cho hóa đơn cũ. Nếu căn cứ chi tiết lịch sử không còn, hiển thị phần đã biết và cảnh báo “Thiếu căn cứ lịch sử”; không trình bày công tơ/quy tắc hiện tại như căn cứ cũ đã được xác minh.
- Nguồn trong bản cũ hiển thị **tại thời điểm tạo báo cáo**. Nút mở bản ghi sống ghi rõ “Mở dữ liệu hiện tại”; nguồn bị xóa vẫn giữ bằng chứng đã lưu. Truy cập vẫn kiểm tra quyền hiện tại, không lộ thông tin bị hạn chế qua snapshot.
- **Tạo phiên bản mới** điền lại lựa chọn và tính preview từ nguồn hiện tại; xác nhận tạo v2/v3, không ghi đè bản trước. Nhóm phiên bản theo loại + tháng + tập mã tòa đã sắp xếp; RPT-04 có một tòa mỗi nhóm. Lấy số tiếp theo của nhóm, kể cả khi tạo từ phiên bản cũ.

### 4.2 Giao diện xử lý chung

Bổ sung lớp xử lý `TH.reports`:

- `preview(request)` nhận `{ type, period, buildingIds, previousRunId? }`, trả draft gồm các item báo cáo, snapshot preview, cảnh báo và dấu vân tay nguồn. RPT-04 có một item/tòa, RPT-05 có một item tổng hợp.
- `confirm(draftId, { acknowledgeWarnings })` kiểm tra lại quyền/nguồn, tạo các `ReportRun`, lưu liên kết item → run để chống xác nhận trùng.
- `trace(context)` nhận draft hoặc run cùng item/sheet/cột/chỉ tiêu, trả công thức, thành phần, nguồn và đối chiếu đúng snapshot.
- `export(runId)` dựng Excel từ snapshot đã lưu. Tên file có loại, kỳ, tòa/phạm vi và phiên bản; số/ngày/tỷ lệ là giá trị Excel đúng kiểu. Giữ sheet theo mẫu, thêm sheet giải thích nguồn/công thức ở cuối khi chưa có.

Route mới: `#/demo/reports`, `#/demo/reports/new`, `#/demo/reports/preview/<draftId>`, `#/demo/reports/view/<runId>`. Route RPT-04/RPT-05 cũ đưa đến danh sách lọc hoặc form tạo có ngữ cảnh được điền sẵn; không tạo báo cáo chỉ vì mở link.

Quyền loại báo cáo giữ hiện tại: Admin/Kế toán dùng hai loại; Quản lý tòa dùng RPT-04 trong tòa được giao, không tự mở RPT-05 toàn công ty; Nhân sự không được mở hai loại này. Quyền xem tổng báo cáo không tự cấp quyền xem chi tiết lương/cổ phần/chứng từ bị hạn chế.

Khởi tạo bổ sung mảng mới khi nạp database schema 12. Không nâng schema theo cách reset toàn bộ dữ liệu chỉ để thêm tính năng báo cáo; không chuyển snapshot duyệt kỳ cũ thành bản do người dùng tạo. Vẫn dùng localStorage của demo, không bổ sung backend. Lưu thất bại hoặc chỉ lưu được trong phiên phải có thông báo và trạng thái đúng, không báo đã lưu bền vững.

## 5. Thứ tự thực hiện và tiêu chí nghiệm thu

### Giai đoạn 1 — Căn cứ số liệu

1. Sửa `roomStateAt`: dùng cận **đầu tháng kế tiếp, không bao gồm cận**, thay mốc `period + '-28'`; giữ cách tìm sự kiện trước/sau để tái dựng lịch sử. Kiểm tra phòng nhận khách hoặc trống vào ngày 28/29/30/31 và tháng 2 nhuận/không nhuận.
2. Bổ sung cây công thức và nguồn chi tiết trong bộ tính, nhãn/đường mở `prepaid` và các nguồn mới; xác nhận tổng nguồn khớp từng metric, không cộng trùng dòng hóa đơn và bảng điều chỉnh/điện chung.
3. Chốt baseline tự động theo schema 12 và giữ trạng thái đề xuất của các quy tắc đang mở. Không triển khai chuẩn hóa HS/lương G-03 hoặc các thay đổi nghiệp vụ còn chờ khách chỉ để làm báo cáo trông khớp.

### Giai đoạn 2 — Luồng tạo và lưu

4. Xây lớp xử lý preview/confirm/trace/export với snapshot bất biến, kiểm tra nguồn cũ và xác nhận chống trùng.
5. Xây danh sách, form chọn, preview đủ sheet, bảng truy nguồn, quay về sau sửa và tạo phiên bản mới. Kiểm tra quyền cho cả thao tác trực tiếp bằng URL/action, không chỉ ẩn nút.
6. Đưa Excel qua cùng bộ sheet snapshot; cập nhật navigation, deep link cũ, mapping gói và tài liệu QA. Kiểm tra lưu/khôi phục sau refresh và lỗi/quota localStorage.

### Kiểm thử bắt buộc

| Nhóm | Kết quả cần đạt |
| --- | --- |
| Hai mẫu và nhiều tòa | RPT-04 xác nhận N tòa tạo N bản; RPT-05 tạo một bản đúng các tòa đã chọn, đủ sheet Kinh doanh/Tổng/nhóm. Hủy không tạo, bấm hai lần không trùng. |
| Preview = bản lưu = Excel | Mọi sheet/metric/cột cùng số liệu, dấu tiền, đơn vị, cách làm tròn; tất cả ô số truy được công thức/nguồn. |
| Trả trước TX-301 | Kỳ 09 hóa đơn gốc 14.700.000 cho 09–11; doanh thu tiền phòng kỳ 09 và 10 mỗi kỳ 4.900.000; nguồn kỳ 10 mở hóa đơn kỳ 09. |
| Lẻ ngày TX-202 | Preview báo cáo loại hóa đơn nháp khỏi doanh thu và có cảnh báo. Sau xác nhận hợp lệ, tiền phòng tháng 10 theo ÷30 là 1.520.000; đổi rule cho nháp sang ÷31 là 1.471.000, không đổi hóa đơn đã xác nhận. |
| Điện chung | Công tơ TX 126 kWh × 4.000 = 504.000; phân bổ + thất thoát khớp tổng, có căn cứ người/phòng và làm tròn. Chỉ đưa vào doanh thu từ hóa đơn đã xác nhận; seed chưa lập hóa đơn TX không được tự cộng 504.000 vào P&L. |
| Điều chỉnh | Âm/dương và kỳ đúng, nguồn có lý do/duyệt; khoản chờ duyệt không lọt vào số ghi nhận, không bị cộng hai lần khi truy về bảng điều chỉnh. |
| Lịch sử phòng | Fixture nhận khách 31/10 trả `occupied`; các chỉ tiêu trống/lấp đầy dùng cùng thời điểm cuối kỳ, lịch sử kỳ trước không bị đổi theo trạng thái hiện tại. |
| Phiên bản | Sửa nguồn rồi tính lại làm draft đổi; nguồn đổi trước confirm bị phát hiện; run cũ và Excel cũ giữ nguyên, v2 mang số mới; nguồn bị xóa hoặc quy tắc đổi vẫn đọc được căn cứ đã lưu. |
| Quyền và lưu trữ | A–D đều có luồng cơ bản; Quản lý không thấy tòa khác/RPT-05, không mở chi tiết lương trái quyền; thiếu quyền/khóa kỳ không sửa được nguồn. Refresh giữ bản đã lưu, lỗi lưu không báo thành công bền vững. |
| Hồi quy | Giữ các bộ `qa-bill`, `qa-pay`, `qa-cus`, `qa-ocr` đạt; smoke không lỗi; kiểm tra desktop và 375px, không tràn ngang trang, bảng rộng cuộn trong vùng riêng. Số lượt smoke có thể tăng theo route/biến thể mới, không khóa ở 1048. |

**Baseline đo độc lập trên seed schema 12, trước khi sửa nguồn/thêm báo cáo:**

| Chỉ tiêu | Giá trị |
| --- | ---: |
| RPT-05 Kinh doanh toàn hệ thống 09/2026 — LNR | 16.682.599 |
| RPT-05 Tổng toàn hệ thống 09/2026 — LNR | 7.282.599 |
| RPT-05 Kinh doanh toàn hệ thống 10/2026 — LNR | 9.655.000 |
| Tiền phòng TX-301 phân bổ vào 10/2026 | 4.900.000 |
| Smoke trước bổ sung luồng báo cáo | 1.048 lượt, 0 lỗi |

Các số cũ 16.937.599 / 7.537.599 / 4.755.000 thuộc baseline trước schema 12, không dùng làm kỳ vọng mới. Chênh lệch lương HS 255.000 kỳ 09 hiện được giữ và giải thích bằng BILL-Q7, không tự sửa thành số cũ. Tham chiếu nghiệp vụ mới: [Decision log, mục 9.9](TIMEHOUSE_MOCKUP_DECISIONS.md) và [kết quả rà soát máy đọc được](qa/report-plan-review/results.json).
