/* SINH TỰ ĐỘNG bởi tools/extract-srs.js từ docs/TIMEHOUSE_SRS_GOI_D_v1_1_CAU_HINH_XEM_GOI_A_B_C_D.md (§5 + §5A — 52 nhóm chức năng). Không sửa tay. */
var TH = window.TH = window.TH || {};
TH.FEATURES = [
 {
  "id": "F001",
  "module": "01. Chủ nhà",
  "name": "Hồ sơ chủ nhà",
  "A": "CRUD 1 form chung",
  "B": "Kiểm tra trùng tên/số liên hệ",
  "C": "Audit thay đổi + quyền theo tòa",
  "D": "Nhập liệu theo kỳ hiệu lực + xem phiên bản",
  "ui": [
   "OWN-01",
   "OWN-02",
   "OWN-IMP"
  ],
  "data": "owner_code, tên, điện thoại, địa chỉ, ghi chú, trạng thái",
  "action": "Thêm, sửa, vô hiệu, xem",
  "uat": "Tạo/sửa được chủ nhà mà không làm mất liên kết tòa",
  "limit": ""
 },
 {
  "id": "F002",
  "module": "01. Chủ nhà",
  "name": "Nhập Excel chủ nhà",
  "A": "Import 1 mẫu cố định; báo lỗi dòng",
  "B": "Preview trước khi ghi; tải file lỗi",
  "C": "Upsert có chính sách trùng",
  "D": "Batch import có lịch sử/rollback có kiểm soát",
  "ui": [
   "OWN-01",
   "OWN-02",
   "OWN-IMP"
  ],
  "data": "Mã/tên/liên hệ theo template",
  "action": "Tải mẫu, import, sửa lỗi",
  "uat": "Dòng không hợp lệ không được ghi",
  "limit": ""
 },
 {
  "id": "F003",
  "module": "01. Chủ nhà",
  "name": "Gắn chủ nhà với tòa",
  "A": "1 chủ nhà chính/tòa",
  "B": "Lịch sử chủ nhà của tòa",
  "C": "Nhiều vai trò sở hữu/đại diện nếu chốt",
  "D": "Quan hệ theo thời gian và đối chiếu báo cáo",
  "ui": [
   "OWN-01",
   "OWN-02",
   "OWN-IMP"
  ],
  "data": "owner_id, building_id, ngày hiệu lực",
  "action": "Chọn chủ nhà, liên kết, xem",
  "uat": "Tòa có chủ nhà rõ ràng; đổi liên kết không sửa lịch sử",
  "limit": "Chưa có tự động chi tiền chủ nhà"
 },
 {
  "id": "F004",
  "module": "02. Tòa nhà",
  "name": "Danh mục tòa nhà",
  "A": "CRUD tòa cơ bản",
  "B": "Tổng hợp số phòng/công suất từ dữ liệu phòng",
  "C": "Lịch sử phân công quản lý",
  "D": "Snapshot dữ liệu tòa theo kỳ báo cáo",
  "ui": [
   "BLD-01",
   "BLD-02",
   "BLD-IMP"
  ],
  "data": "building_code, tên, khu vực, địa chỉ, owner, manager",
  "action": "Thêm, sửa, lọc, xem",
  "uat": "Dữ liệu tòa được dùng chung ở hóa đơn/báo cáo",
  "limit": ""
 },
 {
  "id": "F005",
  "module": "02. Tòa nhà",
  "name": "Nhập Excel tòa nhà",
  "A": "1 mẫu cố định; yêu cầu owner tồn tại",
  "B": "Dò mã chủ nhà và báo lỗi liên kết",
  "C": "So trùng theo mã tòa và chính sách upsert",
  "D": "Log batch, đối chiếu số dòng",
  "ui": [
   "BLD-01",
   "BLD-02",
   "BLD-IMP"
  ],
  "data": "Mã tòa, mã chủ nhà, địa chỉ, quản lý",
  "action": "Import, preview",
  "uat": "Không tạo trùng mã tòa/không gán owner sai",
  "limit": ""
 },
 {
  "id": "F006",
  "module": "02. Tòa nhà",
  "name": "Phân công quản lý tòa",
  "A": "Một quản lý chính hiện tại",
  "B": "Phân công nhiều người theo vai trò",
  "C": "Hiệu lực theo ngày; phục vụ tính hiệu suất",
  "D": "Tách người tạo/cập nhật/xác nhận doanh thu",
  "ui": [
   "BLD-01",
   "BLD-02",
   "BLD-IMP"
  ],
  "data": "building_id, staff_id, from/to",
  "action": "Gán, đổi, xem",
  "uat": "Quản lý chỉ xem/báo thu đúng tòa được giao",
  "limit": ""
 },
 {
  "id": "F007",
  "module": "03. Phòng",
  "name": "Danh mục và trạng thái phòng",
  "A": "CRUD + trạng thái cơ bản",
  "B": "Kiểm tra đổi trạng thái theo HĐ đang thuê",
  "C": "Event lịch sử trạng thái phòng",
  "D": "Theo dõi thay đổi giá/phòng qua hiệu lực",
  "ui": [
   "ROOM-01",
   "ROOM-02",
   "ROOM-IMP"
  ],
  "data": "room_code, building, floor, listed_rent, status",
  "action": "Thêm, sửa, khóa, lọc",
  "uat": "Không bán/cho thuê cùng phòng khi HĐ xung đột",
  "limit": ""
 },
 {
  "id": "F008",
  "module": "03. Phòng",
  "name": "Nhập Excel phòng theo tòa",
  "A": "1 mẫu cố định, tạo mới theo mã tòa",
  "B": "Preview và kiểm tra lỗi từng dòng",
  "C": "Upsert có soát lịch sử giá",
  "D": "Nhập theo nhiều tòa có thống kê batch",
  "ui": [
   "ROOM-01",
   "ROOM-02",
   "ROOM-IMP"
  ],
  "data": "building_code, room_code, tầng, giá",
  "action": "Import, xem lỗi",
  "uat": "Trùng mã phòng trong cùng tòa phải báo lỗi",
  "limit": ""
 },
 {
  "id": "F009",
  "module": "03. Phòng",
  "name": "Hồ sơ phòng và các mối liên kết",
  "A": "Tab tổng quan/khách/HĐ",
  "B": "Tab chỉ số điện nước và phí",
  "C": "Timeline thu/khai thác có bộ lọc",
  "D": "Tập hợp đầy đủ lịch sử theo kỳ",
  "ui": [
   "ROOM-01",
   "ROOM-02",
   "ROOM-IMP"
  ],
  "data": "room_id, customer, contract, invoice, meter",
  "action": "Xem chi tiết, điều hướng",
  "uat": "Mở phòng nhìn được người ở, HĐ và hóa đơn",
  "limit": ""
 },
 {
  "id": "F010",
  "module": "04. Khách thuê/OCR",
  "name": "Hồ sơ khách thuê",
  "A": "Nhập tay, tìm kiếm và gán hợp đồng",
  "B": "Kiểm trùng theo trường nhận dạng đã duyệt",
  "C": "Log lịch sử thông tin liên hệ",
  "D": "Quản lý phiên bản thông tin hợp đồng/định danh",
  "ui": [
   "CUS-01",
   "CUS-02",
   "OCR-CUS",
   "OCR-CON"
  ],
  "data": "mã, tên, điện thoại, giấy tờ [mask], OA ID",
  "action": "Thêm, sửa, xem, vô hiệu",
  "uat": "Hồ sơ khách liên kết được HĐ và OA đúng quyền",
  "limit": ""
 },
 {
  "id": "F011",
  "module": "04. Khách thuê/OCR",
  "name": "OCR giấy tờ khách",
  "A": "1 loại mẫu/định dạng đã chọn, OCR API + người sửa; có fallback nhập tay",
  "B": "Hiển thị field độ tin cậy thấp; tối đa 2 mẫu",
  "C": "Cảnh báo trùng hồ sơ/tính hợp lệ bằng rule",
  "D": "Thư viện mẫu đã duyệt; dashboard lỗi nhận dạng",
  "ui": [
   "CUS-01",
   "CUS-02",
   "OCR-CUS",
   "OCR-CON"
  ],
  "data": "ảnh/PDF, họ tên, số giấy tờ, ngày sinh, địa chỉ",
  "action": "Tải file, nhận dạng, sửa, xác nhận",
  "uat": "Không lưu tự động dữ liệu OCR chưa xác nhận",
  "limit": "Phí OCR vendor ngoài; PoC và data consent bắt buộc"
 },
 {
  "id": "F012",
  "module": "04. Khách thuê/OCR",
  "name": "OCR hợp đồng thuê",
  "A": "Trích một mẫu HĐ chuẩn; mỗi field phải được người dùng xác nhận",
  "B": "Tối đa 2 mẫu HĐ, map phí cố định",
  "C": "So khớp phòng–khách–HĐ và cảnh báo lệch",
  "D": "Nhiều mẫu cố định đã duyệt + log correction",
  "ui": [
   "CUS-01",
   "CUS-02",
   "OCR-CUS",
   "OCR-CON"
  ],
  "data": "file PDF/ảnh, mã HĐ, phòng, khách, rent, date, deposit",
  "action": "Upload, trích xuất, đối chiếu, chấp nhận",
  "uat": "OCR không tự kích hoạt HĐ hoặc tạo hóa đơn",
  "limit": "Scan xấu/chữ viết tay ngoài cam kết nếu chưa PoC"
 },
 {
  "id": "F013",
  "module": "04. Khách thuê/OCR",
  "name": "Tài liệu đính kèm và tra cứu",
  "A": "Lưu file gắn hồ sơ",
  "B": "Tìm theo HĐ/khách/phòng",
  "C": "Quyền file theo tòa và người dùng",
  "D": "Phiên bản tài liệu và audit lượt xem",
  "ui": [
   "CUS-01",
   "CUS-02",
   "OCR-CUS",
   "OCR-CON"
  ],
  "data": "file, loại, owner, contract_id",
  "action": "Tải lên, xem, tải xuống",
  "uat": "Khách liên quan được truy file có quyền; không lộ dữ liệu",
  "limit": ""
 },
 {
  "id": "F014",
  "module": "05. Hợp đồng & gia hạn",
  "name": "Hợp đồng khách thuê",
  "A": "Form 1 hợp đồng/phòng; tải bản scan",
  "B": "Từ OCR xác nhận chuyển vào form; lịch sử cơ bản",
  "C": "Phụ lục thay đổi giá có hiệu lực từ tháng",
  "D": "Hợp đồng/điều khoản nhiều phiên bản có audit",
  "ui": [
   "CON-01",
   "CON-02",
   "CON-03",
   "CON-FOLLOW"
  ],
  "data": "contract_no, room, customer, kỳ, rent, deposit, signed/start/end",
  "action": "Tạo, sửa nháp, duyệt đơn giản",
  "uat": "Bản đã xác nhận không bị sửa trực tiếp",
  "limit": "Không ký số/pháp lý tự động"
 },
 {
  "id": "F015",
  "module": "05. Hợp đồng & gia hạn",
  "name": "Phí cố định theo hợp đồng",
  "A": "Một bộ phí cố định hiện hành",
  "B": "Nhiều dòng phí với hiệu lực từ kỳ",
  "C": "Preview tác động khi đổi biểu phí",
  "D": "Nhiều giai đoạn giá và lịch sử thay đổi",
  "ui": [
   "CON-01",
   "CON-02",
   "CON-03",
   "CON-FOLLOW"
  ],
  "data": "loại phí, số tiền, số lượng, từ/tháng áp dụng",
  "action": "Thêm, sửa, ngừng áp dụng",
  "uat": "Lập HĐơn tự lấy đúng khoản phí đã xác nhận",
  "limit": ""
 },
 {
  "id": "F016",
  "module": "05. Hợp đồng & gia hạn",
  "name": "Hợp đồng sắp hết hạn",
  "A": "Danh sách đến hạn trong N ngày, xuất Excel",
  "B": "Tạo danh sách theo quản lý tòa và nhóm",
  "C": "Nhật ký nhắc, trạng thái đã hỏi/chưa hỏi",
  "D": "Phân công/tổng hợp tỷ lệ gia hạn chuyển đi",
  "ui": [
   "CON-01",
   "CON-02",
   "CON-03",
   "CON-FOLLOW"
  ],
  "data": "ngày hết hạn, khách, phòng, tòa, liên hệ",
  "action": "Lọc, xem, xuất danh sách",
  "uat": "Xuất được danh sách đúng scope của quản lý",
  "limit": ""
 },
 {
  "id": "F017",
  "module": "05. Hợp đồng & gia hạn",
  "name": "Kết quả hỏi gia hạn/chuyển đi",
  "A": "Nhập tay: gia hạn/chuyển đi/chưa trả lời",
  "B": "Ghi lịch hẹn gọi lại; tạo nháp gia hạn",
  "C": "Duyệt gia hạn/đổi giá trước khi áp dụng",
  "D": "Quy trình gia hạn/thu hồi theo bước đã chốt",
  "ui": [
   "CON-01",
   "CON-02",
   "CON-03",
   "CON-FOLLOW"
  ],
  "data": "khách trả lời, dự kiến rời, người hỏi, thời điểm",
  "action": "Ghi nhận, đổi trạng thái, lưu ghi chú",
  "uat": "Kết quả khảo sát không tự sửa hợp đồng gốc",
  "limit": ""
 },
 {
  "id": "F018",
  "module": "06. Điện nước & dịch vụ",
  "name": "Công tơ theo phòng",
  "A": "1 điện + 1 nước/phòng (giả định)",
  "B": "Quản lý thay/đổi công tơ có ngày",
  "C": "Lịch sử thay công tơ và xử lý số reset",
  "D": "Nhiều công tơ/phòng với quy tắc phân bổ",
  "ui": [
   "METER-01",
   "INV-01"
  ],
  "data": "room_id, loại điện/nước, mã đồng hồ, trạng thái",
  "action": "Thêm, sửa, xem",
  "uat": "Không nhầm chỉ số công tơ giữa các phòng",
  "limit": "Nhiều công tơ chung cần thiết kế riêng"
 },
 {
  "id": "F019",
  "module": "06. Điện nước & dịch vụ",
  "name": "Lưu chỉ số tháng trước",
  "A": "Tự lấy chỉ số tháng trước nếu có; nhập tháng đầu",
  "B": "Nhập hàng loạt bằng bảng theo tòa",
  "C": "Giám sát thiếu số/đột biến + người duyệt",
  "D": "Snapshot chỉ số sau chốt kỳ và đối chiếu",
  "ui": [
   "METER-01",
   "INV-01"
  ],
  "data": "phòng, kỳ, prev, current, readings status",
  "action": "Nhập số, xem tháng trước, xác nhận",
  "uat": "Kỳ tháng sau tự dùng current của kỳ trước",
  "limit": ""
 },
 {
  "id": "F020",
  "module": "06. Điện nước & dịch vụ",
  "name": "Tính phí điện nước",
  "A": "(số mới-số cũ) × đơn giá cố định",
  "B": "Đơn giá riêng theo tòa hoặc kỳ",
  "C": "Thang giá/định mức đã phê duyệt, nếu có",
  "D": "Đối chiếu hóa đơn công tơ nguồn vs thu",
  "ui": [
   "METER-01",
   "INV-01"
  ],
  "data": "kWh/m3, đơn giá, tiêu thụ, thành tiền",
  "action": "Tính, xem trước, sửa nháp",
  "uat": "Không âm khi số mới nhỏ hơn cũ: báo kiểm tra",
  "limit": "Chốt đơn giá và công tơ reset"
 },
 {
  "id": "F021",
  "module": "06. Điện nước & dịch vụ",
  "name": "Phí phát sinh khác",
  "A": "Nhập thủ công trước khi xác nhận HĐơn",
  "B": "Mẫu nhóm phí thường dùng",
  "C": "Duyệt dòng phí nhạy cảm/theo quyền",
  "D": "Quy tắc hiệu lực, lịch sử thay phí",
  "ui": [
   "METER-01",
   "INV-01"
  ],
  "data": "code, mô tả, số lượng, đơn giá, kỳ, chứng từ",
  "action": "Thêm dòng phí, xóa nháp",
  "uat": "Không phát sinh phí tự động nếu chưa có nguồn",
  "limit": ""
 },
 {
  "id": "F022",
  "module": "07. Hóa đơn",
  "name": "Lập hóa đơn theo tòa → phòng",
  "A": "Sinh nháp từng phòng theo tòa; một lần bấm theo batch",
  "B": "Lập hàng loạt, có preview bảng tổng hợp",
  "C": "Kiểm lỗi phòng/HĐ thiếu biểu phí trước commit",
  "D": "Chạy lại batch an toàn, idempotent + audit",
  "ui": [
   "INV-01",
   "INV-02",
   "INV-03",
   "INV-PREV"
  ],
  "data": "tòa, kỳ, phòng đang thuê, hợp đồng hiện hành",
  "action": "Chọn tòa/kỳ, sinh nháp",
  "uat": "Không tạo trùng hóa đơn phòng–kỳ",
  "limit": ""
 },
 {
  "id": "F023",
  "module": "07. Hóa đơn",
  "name": "Tính tiền phòng + phí cố định",
  "A": "Lấy đơn giá hiện hành; kỳ tròn tháng",
  "B": "Prorate đầu/cuối tháng theo rule duyệt",
  "C": "Biểu phí thay đổi kỳ có version",
  "D": "Nhiều đoạn hiệu lực có kiểm chứng",
  "ui": [
   "INV-01",
   "INV-02",
   "INV-03",
   "INV-PREV"
  ],
  "data": "rent, fixed services, quantities, effective period",
  "action": "Tính, preview",
  "uat": "Tiền phòng + phí cố định tự lên dòng chi tiết",
  "limit": ""
 },
 {
  "id": "F024",
  "module": "07. Hóa đơn",
  "name": "Điện nước + phí phát sinh vào hóa đơn",
  "A": "Tự kéo số đã nhập/đơn giá và phí phát sinh",
  "B": "Nhập bảng công tơ ngay tại kỳ hóa đơn",
  "C": "Soát chỉ số bất thường và cảnh báo thiếu số",
  "D": "Đối chiếu công tơ/đơn giá theo version",
  "ui": [
   "INV-01",
   "INV-02",
   "INV-03",
   "INV-PREV"
  ],
  "data": "meter readings, unit price, extra lines",
  "action": "Nhập số, thêm phí, tính lại",
  "uat": "HĐơn bị khóa nếu còn chỉ số bắt buộc chưa xác nhận",
  "limit": ""
 },
 {
  "id": "F025",
  "module": "07. Hóa đơn",
  "name": "Duyệt hóa đơn và xuất PDF nội bộ",
  "A": "Nháp → xác nhận bởi kế toán/Admin, PDF cơ bản",
  "B": "Xuất hàng loạt và gửi danh sách khách",
  "C": "Phiên bản chỉnh sửa/hủy hóa đơn chưa thu",
  "D": "Khóa kỳ, biên bản điều chỉnh và audit",
  "ui": [
   "INV-01",
   "INV-02",
   "INV-03",
   "INV-PREV"
  ],
  "data": "invoice_no, lines, total, due, status",
  "action": "Xem, xác nhận, xuất",
  "uat": "Không thay đổi im lặng hóa đơn đã xác nhận",
  "limit": ""
 },
 {
  "id": "F026",
  "module": "08. Zalo OA",
  "name": "Kết nối và cấu hình OA",
  "A": "1 OA, 1–2 mẫu được duyệt, liên kết người nhận",
  "B": "Mẫu riêng hóa đơn / nhắc nợ / hết hạn HĐ",
  "C": "Quy tắc cá nhân hóa nội dung theo tòa",
  "D": "Quản lý phiên bản mẫu và lịch sử đồng ý",
  "ui": [
   "OA-01",
   "OA-02"
  ],
  "data": "OA connection, template, recipient link",
  "action": "Cấu hình, bật/tắt",
  "uat": "Chưa có recipient đủ điều kiện thì không gửi",
  "limit": "Phụ thuộc provider; phí ngoài"
 },
 {
  "id": "F027",
  "module": "08. Zalo OA",
  "name": "Gửi hóa đơn và nhắc thanh toán",
  "A": "Gửi thủ công + 1 lịch nhắc đơn giản nếu OA cho phép",
  "B": "3 mốc nhắc cấu hình; skip HĐơn đã đủ tiền",
  "C": "Tự dừng nhắc sau kế toán xác nhận; queue retry",
  "D": "Thống kê gửi/lỗi/bounce và retry có kiểm soát",
  "ui": [
   "OA-01",
   "OA-02"
  ],
  "data": "invoice ID, dư nợ, người nhận, template",
  "action": "Preview, gửi thủ công",
  "uat": "Không nhắc khoản đã thu đủ; không gửi trùng",
  "limit": ""
 },
 {
  "id": "F028",
  "module": "08. Zalo OA",
  "name": "Nhật ký trạng thái gửi",
  "A": "Log đã gửi/lỗi cơ bản",
  "B": "Tra cứu theo tòa/kỳ/khách",
  "C": "Người duyệt retry và dead-letter",
  "D": "Dashboard hiệu quả gửi theo kỳ",
  "ui": [
   "OA-01",
   "OA-02"
  ],
  "data": "message_id, provider status, time, reason",
  "action": "Xem, lọc, tải",
  "uat": "Có bằng chứng gửi theo từng HĐơn",
  "limit": ""
 },
 {
  "id": "F029",
  "module": "09. Thu tiền & hiệu suất",
  "name": "Báo đã thu từ trưởng nhóm/quản lý",
  "A": "Quản lý tạo yêu cầu báo đã thu theo tòa",
  "B": "Danh sách báo thu theo kỳ và trạng thái",
  "C": "Chống trùng yêu cầu/nguồn tiền",
  "D": "Nhật ký giao tiếp duyệt và đối chiếu chi tiết",
  "ui": [
   "PAY-01",
   "PAY-02",
   "PAY-APP"
  ],
  "data": "tòa, HĐơn, số tiền báo, ngày, chứng từ",
  "action": "Báo đã thu, đính kèm, cập nhật",
  "uat": "Báo thu không làm giảm công nợ",
  "limit": ""
 },
 {
  "id": "F030",
  "module": "09. Thu tiền & hiệu suất",
  "name": "Kế toán/Admin xác nhận thực thu",
  "A": "Kế toán xác nhận từng báo thu; 1 phiếu/1 HĐơn",
  "B": "Batch xác nhận theo danh sách đã kiểm",
  "C": "Kiểm tra số tiền/phiếu thu trùng và tranh chấp",
  "D": "Đối soát với sao kê nhập thủ công (không bank API)",
  "ui": [
   "PAY-01",
   "PAY-02",
   "PAY-APP"
  ],
  "data": "receipt_id, amount, actual_received_at, approver",
  "action": "Duyệt, từ chối, xác nhận",
  "uat": "Chỉ phiếu confirmed giảm công nợ",
  "limit": ""
 },
 {
  "id": "F031",
  "module": "09. Thu tiền & hiệu suất",
  "name": "Thu nhiều lần và công nợ",
  "A": "Nhiều lần thu / 1 HĐơn, không âm dư nợ",
  "B": "Danh sách quá hạn và CSV",
  "C": "Phiếu điều chỉnh có lý do/duyệt",
  "D": "Phân bổ 1 phiếu thu cho nhiều HĐơn cùng khách",
  "ui": [
   "PAY-01",
   "PAY-02",
   "PAY-APP"
  ],
  "data": "invoice_total, receipt sum, remaining",
  "action": "Ghi nhận, xem số dư",
  "uat": "Nợ = confirmed invoice - confirmed receipts",
  "limit": ""
 },
 {
  "id": "F032",
  "module": "09. Thu tiền & hiệu suất",
  "name": "Báo cáo thu tiền mốc 5/10/15",
  "A": "Tổng hợp 3 mốc từ phiếu confirmed",
  "B": "Tự snapshot mỗi mốc, lọc trưởng nhóm",
  "C": "Soát backdate/điều chỉnh sau khóa",
  "D": "Chốt mốc và đối chiếu phiên bản",
  "ui": [
   "PAY-01",
   "PAY-02",
   "PAY-APP"
  ],
  "data": "actual_received_at, period, building, amount",
  "action": "Lọc mốc, xem, xuất",
  "uat": "Ngày 5/10/15 theo ngày thực nhận đã xác nhận",
  "limit": "Mốc cố định; chính sách kỳ cần chốt"
 },
 {
  "id": "F033",
  "module": "09. Thu tiền & hiệu suất",
  "name": "Quy đổi hiệu suất thu tiền",
  "A": "Tự áp trọng số 100/90/70/0 trên thu tiền phòng hiện kỳ đủ điều kiện",
  "B": "Tách loại trừ cọc, phí DV, thu trước",
  "C": "Nhánh đặc biệt / thêm bậc hiệu suất theo policy",
  "D": "Version công thức & kiểm thử từng ngoại lệ lương",
  "ui": [
   "PAY-01",
   "PAY-02",
   "PAY-APP"
  ],
  "data": "ngày thu, tiền đủ điều kiện, 100/90/70/0",
  "action": "Preview, tính",
  "uat": "Thu sau 15 giảm nợ nhưng HS = 0",
  "limit": "Không đồng nhất KPI báo cáo với HS lương"
 },
 {
  "id": "F034",
  "module": "10. Chi phí",
  "name": "Nhập chi phí theo tòa",
  "A": "Form thủ công theo tòa; trạng thái nháp/đã duyệt",
  "B": "Import Excel mẫu chi phí",
  "C": "Phân quyền người nhập/người duyệt",
  "D": "Chi phí chung phân bổ nhiều tòa theo tỷ lệ đã duyệt",
  "ui": [
   "EXP-01"
  ],
  "data": "tòa, kỳ, nhóm chi, số tiền, mô tả, ảnh chứng từ",
  "action": "Thêm, sửa nháp, tải file",
  "uat": "Báo cáo chỉ cộng chi phí đã duyệt",
  "limit": ""
 },
 {
  "id": "F035",
  "module": "10. Chi phí",
  "name": "Xác nhận chi phí và loại trùng",
  "A": "Kế toán duyệt; lưu lý do",
  "B": "Danh sách duyệt theo kỳ",
  "C": "Kiểm trùng chứng từ theo tòa và số hóa đơn",
  "D": "Nhật ký sửa sau duyệt và reversal",
  "ui": [
   "EXP-01"
  ],
  "data": "expense source, amount, receipt, approver",
  "action": "Duyệt/từ chối",
  "uat": "Không xóa được chi phí đã tính báo cáo",
  "limit": ""
 },
 {
  "id": "F036",
  "module": "10. Chi phí",
  "name": "Chi phí chủ nhà và vận hành",
  "A": "Nhập tiền trả chủ nhà như một loại chi phí",
  "B": "Tự sinh lịch phải trả từ điều khoản thuê tòa",
  "C": "Tách phải trả/chưa trả và lịch trả",
  "D": "Đối chiếu payable + cost center",
  "ui": [
   "EXP-01"
  ],
  "data": "thuê chủ nhà, sửa chữa, điện mạng, lương,...",
  "action": "Nhập theo nhóm chi, xuất",
  "uat": "Không cộng trùng khoản trả chủ nhà và chi phí",
  "limit": ""
 },
 {
  "id": "F037",
  "module": "11. Nhân sự",
  "name": "Danh sách và hồ sơ nhân sự",
  "A": "CRUD + phân công tòa; xóa mềm",
  "B": "Import Excel nhân viên và mapping đội",
  "C": "Lưu lịch sử phân công và thay đổi chức vụ",
  "D": "Phân quyền theo tuyến quản lý",
  "ui": [
   "HR-01",
   "HR-ASSIGN"
  ],
  "data": "employee_code, tên, phòng/đội, chức vụ, trạng thái",
  "action": "Tạo, sửa, vô hiệu",
  "uat": "Không xóa cứng người đã có lương/phiếu thu",
  "limit": ""
 },
 {
  "id": "F038",
  "module": "11. Nhân sự",
  "name": "Sơ đồ tổ chức & đội trưởng",
  "A": "Danh sách nhóm/trưởng nhóm dạng bảng",
  "B": "Cây tổ chức 2–3 cấp",
  "C": "Cơ chế phụ trách nhiều tòa",
  "D": "Điều chuyển có hiệu lực lịch sử",
  "ui": [
   "HR-01",
   "HR-ASSIGN"
  ],
  "data": "manager_id, team_id, building_id",
  "action": "Gán, chuyển, xem",
  "uat": "Trưởng nhóm chỉ được báo thu ở tòa đã giao",
  "limit": ""
 },
 {
  "id": "F039",
  "module": "12. Lương",
  "name": "Lương cố định và phụ cấp",
  "A": "Lương tháng + phụ cấp cố định",
  "B": "Import bảng lương nguồn/điều chỉnh theo kỳ",
  "C": "Phiên bản thay lương và quyền kế toán",
  "D": "Tạo bộ chính sách lương theo vai trò/hiệu lực",
  "ui": [
   "SAL-01",
   "SAL-ADJ"
  ],
  "data": "base salary, allowances, effective_from",
  "action": "Thiết lập, sửa, xem",
  "uat": "Lương đã xác nhận kỳ cũ không đổi theo mức mới",
  "limit": ""
 },
 {
  "id": "F040",
  "module": "12. Lương",
  "name": "Lương theo hiệu suất và điều chỉnh",
  "A": "Lương cơ bản + HS theo một hệ số đơn giản đã ký + điều chỉnh kế toán",
  "B": "Tự đưa mốc 5/10/15 vào bản tính nháp",
  "C": "Bậc hiệu suất/thâm niên trong bảng nguồn đã duyệt",
  "D": "Công thức nhiều nhánh cho phòng mới, trả trước, cọc...",
  "ui": [
   "SAL-01",
   "SAL-ADJ"
  ],
  "data": "weighted eligible collections, coefficient, bonus/penalty",
  "action": "Tính nháp, điều chỉnh, xuất",
  "uat": "Kết quả 1 người/1 kỳ khớp ví dụ ký duyệt",
  "limit": "Chưa chốt bảng bậc/đặc lệ thì phải review bằng tay"
 },
 {
  "id": "F041",
  "module": "12. Lương",
  "name": "Duyệt bảng lương và lịch sử",
  "A": "Kế toán xác nhận file Excel ngoài hệ thống",
  "B": "Duyệt bản preview trong phần mềm",
  "C": "Khóa kỳ/duyệt và audit số liệu",
  "D": "Phiếu chi lương thủ công, kiểm soát chênh lệch",
  "ui": [
   "SAL-01",
   "SAL-ADJ"
  ],
  "data": "payroll batch, employee, adjustments, status",
  "action": "Xem, duyệt, xuất",
  "uat": "Sau khóa, thay đổi phải qua điều chỉnh mới",
  "limit": ""
 },
 {
  "id": "F042",
  "module": "13. Cổ phần theo tòa",
  "name": "Danh sách cổ đông và vốn/tỷ lệ",
  "A": "Nhập tỷ lệ và vốn theo tòa/kỳ trên bảng đơn giản",
  "B": "Import Excel chia cổ phần theo template",
  "C": "Kiểm tổng tỷ lệ 100% và thời hạn hiệu lực",
  "D": "Snapshot tỷ lệ khi chốt kỳ; lịch sử thay đổi",
  "ui": [
   "SHARE-01",
   "SHARE-RESULT"
  ],
  "data": "building, shareholder, ratio, capital, from/to",
  "action": "Thêm, sửa, import",
  "uat": "Mỗi tòa mỗi kỳ phải xác định bảng tỷ lệ hợp lệ",
  "limit": ""
 },
 {
  "id": "F043",
  "module": "13. Cổ phần theo tòa",
  "name": "Tính lợi nhuận phân bổ",
  "A": "Lãi tạm tính = thu xác nhận - chi đã duyệt; phân bổ theo %",
  "B": "Chọn chế độ dựa trên doanh thu/chi phí thuộc kỳ nếu dữ liệu đủ",
  "C": "Phân biệt lãi gộp, lãi ròng và chi phí chung theo rule",
  "D": "Đối chiếu với Bảng chia CP từng kỳ và version",
  "ui": [
   "SHARE-01",
   "SHARE-RESULT"
  ],
  "data": "LN theo tòa, shareholder ratio, rounding",
  "action": "Preview, xuất",
  "uat": "Tổng LN phân bổ = LN đủ điều kiện chia (làm tròn)",
  "limit": "Đừng coi lợi nhuận phân bổ là đã chi tiền"
 },
 {
  "id": "F044",
  "module": "13. Cổ phần theo tòa",
  "name": "Theo dõi chi/đã nhận cổ đông",
  "A": "Excel xuất có cột tiền đã chi nhập tay",
  "B": "Phiếu chi cổ đông thủ công có chứng từ",
  "C": "Duyệt chi và đối chiếu công nợ cổ đông",
  "D": "Sổ vốn góp/tạm ứng/rút vốn có chứng từ",
  "ui": [
   "SHARE-01",
   "SHARE-RESULT"
  ],
  "data": "LN phân bổ, số đã chi, ngày chi",
  "action": "Nhập tay, xem",
  "uat": "Không ghi giảm LN do cổ đông chưa nhận tiền",
  "limit": "Không làm cổng cổ đông chuyên biệt"
 },
 {
  "id": "F045",
  "module": "14. Báo cáo",
  "name": "Báo cáo từng tòa theo tháng",
  "A": "Xuất Excel tổng hợp thu, nợ, phòng",
  "B": "Drill-down hóa đơn/phòng",
  "C": "Snapshot sau duyệt kỳ + theo dõi sai lệch",
  "D": "Đối chiếu theo kỳ lịch sử và theo vai trò",
  "ui": [
   "RPT-01",
   "RPT-02",
   "RPT-03"
  ],
  "data": "tòa, phòng, hợp đồng, invoices, paid, debt",
  "action": "Lọc tòa/kỳ, xuất",
  "uat": "Các tổng doanh thu/đã thu/còn nợ khớp số gốc",
  "limit": ""
 },
 {
  "id": "F046",
  "module": "14. Báo cáo",
  "name": "Báo cáo kinh doanh toàn công ty",
  "A": "1 báo cáo Excel tổng hợp",
  "B": "Biểu đồ xu hướng 3–6 tháng",
  "C": "So sánh tòa, nhóm, kỳ",
  "D": "Tùy chọn mẫu báo cáo quản trị có version",
  "ui": [
   "RPT-01",
   "RPT-02",
   "RPT-03"
  ],
  "data": "tổng tòa, tổng phòng, HĐ còn/hết, billed, collected",
  "action": "Lọc, xuất",
  "uat": "Sum từng tòa = tổng công ty khi scope tương ứng",
  "limit": ""
 },
 {
  "id": "F047",
  "module": "14. Báo cáo",
  "name": "Báo cáo thu 5/10/15 và hiệu suất",
  "A": "Bảng 3 mốc + doanh thu quy đổi theo tòa",
  "B": "Báo cáo theo người phụ trách",
  "C": "So sánh mốc gốc và phiên bản duyệt",
  "D": "Giải trình thay đổi do sửa received_at/backdate",
  "ui": [
   "RPT-01",
   "RPT-02",
   "RPT-03"
  ],
  "data": "tòa, người quản lý, 3 mốc, số confirmed, weighted amount",
  "action": "Xem, xuất",
  "uat": "Số thu thực khác rõ số thu tính HS",
  "limit": ""
 },
 {
  "id": "F048",
  "module": "14. Báo cáo",
  "name": "Báo cáo chi phí và lãi",
  "A": "Thu thực - chi đã duyệt, nhãn Lãi dòng tiền tạm tính",
  "B": "Phân tách doanh thu thuộc kỳ và dòng tiền",
  "C": "Điều chỉnh/loại trừ cọc/thu trước theo nguồn",
  "D": "Lợi nhuận ròng gắn rule, phiên bản kỳ chốt",
  "ui": [
   "RPT-01",
   "RPT-02",
   "RPT-03"
  ],
  "data": "thu phòng, phí DV, chi phí, lãi tạm",
  "action": "Xem, xuất",
  "uat": "Không gọi lãi dòng tiền là LN ròng kế toán",
  "limit": ""
 },
 {
  "id": "F049",
  "module": "14. Báo cáo",
  "name": "Báo cáo lương và chia cổ phần",
  "A": "2 biểu báo cáo nháp, đối chiếu bằng Excel",
  "B": "Tự kéo từ receipt/cost/team/share tables",
  "C": "Bảng lương/CP có quy trình duyệt",
  "D": "Mẫu kết quả gần nguồn tháng 8 đã xác nhận",
  "ui": [
   "RPT-01",
   "RPT-02",
   "RPT-03"
  ],
  "data": "mã tòa, nhân viên, lương, cổ đông, vốn, ratio, LN",
  "action": "Xuất Excel",
  "uat": "Tiền lương/cổ phần có nguồn và không tự tạo chi tiền",
  "limit": ""
 },
 {
  "id": "F050",
  "module": "15. Hệ thống",
  "name": "Tài khoản, quyền theo tòa",
  "A": "Admin/Kế toán/QL tòa; quyền BE bắt buộc",
  "B": "Phân quyền theo chức năng và tòa",
  "C": "Tách báo thu / duyệt thu / duyệt chi",
  "D": "Quyền theo đội, ca và hiệu lực",
  "ui": [
   "AUTH-01",
   "SYS-01"
  ],
  "data": "user, role, building_scope",
  "action": "Tạo user, gán scope, vô hiệu",
  "uat": "API trả 403 khi gọi vượt scope",
  "limit": ""
 },
 {
  "id": "F051",
  "module": "15. Hệ thống",
  "name": "Audit thay đổi dữ liệu tài chính",
  "A": "Lưu tạo/sửa/duyệt chứng từ",
  "B": "Bộ lọc theo tòa và loại chứng từ",
  "C": "Log giao dịch/mốc thu thay đổi",
  "D": "Báo cáo snapshot có revision truy vết",
  "ui": [
   "AUTH-01",
   "SYS-01"
  ],
  "data": "who, action, before/after, timestamp, reason",
  "action": "Xem nhật ký",
  "uat": "Không đổi dữ liệu confirmed mà không lưu lịch sử",
  "limit": ""
 },
 {
  "id": "F052",
  "module": "15. Hệ thống",
  "name": "Sao lưu, import khởi tạo, vận hành",
  "A": "Staging + backup + hướng dẫn người dùng",
  "B": "Kiểm thử phục hồi và dữ liệu đầu kỳ theo mẫu",
  "C": "Bộ test hồi quy tự động các dòng tiền",
  "D": "Giám sát batch và cảnh báo lỗi gửi OA",
  "ui": [
   "AUTH-01",
   "SYS-01"
  ],
  "data": "DB backup, file, cấu hình OA",
  "action": "Triển khai, restore test",
  "uat": "Có phương án phục hồi, không mất bản ghi đã xác nhận",
  "limit": ""
 }
];
