/* SINH TỰ ĐỘNG bởi tools/extract-srs.js từ docs/TIMEHOUSE_SRS_GOI_D_v1_1_CAU_HINH_XEM_GOI_A_B_C_D.md (§4 — 39 Screen ID). Không sửa tay. */
var TH = window.TH = window.TH || {};
TH.SCREENS = [
 {
  "no": 1,
  "id": "AUTH-01",
  "title": "Đăng nhập / chuyển đơn vị quản lý",
  "srcLine": 95,
  "fields": [
   {
    "name": "Tên đăng nhập",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Mật khẩu",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Vai trò",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Phạm vi tòa",
    "format": "Textbox / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Tài khoản, quyền theo tòa",
   "Audit thay đổi dữ liệu tài chính",
   "Sao lưu, import khởi tạo, vận hành"
  ],
  "module": "Hệ thống",
  "kind": "Input form / workflow",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Quyền cơ bản, không tự duyệt tiền",
   "B": "Phân quyền theo chức năng",
   "C": "Log duyệt và scope theo tòa",
   "D": "Theo dõi phiên bản quyền"
  },
  "srcActions": [
   "Đăng nhập",
   "Chọn vai trò"
  ],
  "srcFields": "Tên đăng nhập; mật khẩu; vai trò, phạm vi tòa"
 },
 {
  "no": 2,
  "id": "OWN-01",
  "title": "Danh sách chủ nhà",
  "srcLine": 142,
  "fields": [
   {
    "name": "Mã chủ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tên",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Liên hệ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Trạng thái",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Số tòa",
    "format": "Currency / Number / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Hồ sơ chủ nhà",
   "Nhập Excel chủ nhà",
   "Gắn chủ nhà với tòa"
  ],
  "module": "Chủ nhà",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Nhập tay, Excel mẫu cố định",
   "B": "Preview lỗi/trùng trước lưu",
   "C": "Lịch sử chỉnh sửa/đổi liên kết",
   "D": "Audit/đối chiếu theo kỳ"
  },
  "srcActions": [
   "Thêm",
   "Import Excel",
   "Tìm/lọc"
  ],
  "srcFields": "Mã chủ, tên, liên hệ, trạng thái, số tòa"
 },
 {
  "no": 3,
  "id": "OWN-02",
  "title": "Hồ sơ chủ nhà",
  "srcLine": 191,
  "fields": [
   {
    "name": "Thông tin chủ nhà",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Địa chỉ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tòa liên kết",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Hồ sơ chủ nhà",
   "Nhập Excel chủ nhà",
   "Gắn chủ nhà với tòa"
  ],
  "module": "Chủ nhà",
  "kind": "Detail / dashboard",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Nhập tay, Excel mẫu cố định",
   "B": "Preview lỗi/trùng trước lưu",
   "C": "Lịch sử chỉnh sửa/đổi liên kết",
   "D": "Audit/đối chiếu theo kỳ"
  },
  "srcActions": [
   "Sửa",
   "Gắn tòa",
   "Vô hiệu"
  ],
  "srcFields": "Thông tin chủ nhà; địa chỉ; tòa liên kết"
 },
 {
  "no": 4,
  "id": "BLD-01",
  "title": "Danh sách tòa",
  "srcLine": 238,
  "fields": [
   {
    "name": "Mã tòa",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tên",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Khu vực",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Chủ nhà",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "QL tòa",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Số phòng",
    "format": "Currency / Number / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Danh mục tòa nhà",
   "Nhập Excel tòa nhà",
   "Phân công quản lý tòa"
  ],
  "module": "Tòa nhà",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Nhập tay, gắn chủ/QL",
   "B": "Tổng hợp phòng, kiểm import",
   "C": "Lịch sử phân công",
   "D": "Snapshot theo kỳ"
  },
  "srcActions": [
   "Thêm",
   "Import Excel",
   "Lọc"
  ],
  "srcFields": "Mã tòa, tên, khu vực, chủ nhà, QL tòa, số phòng"
 },
 {
  "no": 5,
  "id": "BLD-02",
  "title": "Hồ sơ tòa & phân công quản lý",
  "srcLine": 288,
  "fields": [
   {
    "name": "Hồ sơ tòa",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Địa chỉ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Chủ nhà",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "QL",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Danh sách phòng",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Danh mục tòa nhà",
   "Nhập Excel tòa nhà",
   "Phân công quản lý tòa"
  ],
  "module": "Tòa nhà",
  "kind": "Detail / dashboard",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Nhập tay, gắn chủ/QL",
   "B": "Tổng hợp phòng, kiểm import",
   "C": "Lịch sử phân công",
   "D": "Snapshot theo kỳ"
  },
  "srcActions": [
   "Sửa",
   "Gán người phụ trách"
  ],
  "srcFields": "Hồ sơ tòa, địa chỉ, chủ nhà, QL, danh sách phòng"
 },
 {
  "no": 6,
  "id": "ROOM-01",
  "title": "Danh sách phòng",
  "srcLine": 336,
  "fields": [
   {
    "name": "Mã phòng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tòa",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Tầng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Giá",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Trạng thái",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Khách/HĐ",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Danh mục và trạng thái phòng",
   "Nhập Excel phòng theo tòa",
   "Hồ sơ phòng và các mối liên kết"
  ],
  "module": "Phòng",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Tạo/sửa và import theo tòa",
   "B": "Kiểm trạng thái phòng theo HĐ",
   "C": "Lịch sử trạng thái và giá",
   "D": "Audit thay đổi giá/kỳ"
  },
  "srcActions": [
   "Thêm",
   "Import Excel",
   "Lọc"
  ],
  "srcFields": "Mã phòng, tòa, tầng, giá, trạng thái, khách/HĐ"
 },
 {
  "no": 7,
  "id": "ROOM-02",
  "title": "Hồ sơ phòng",
  "srcLine": 386,
  "fields": [
   {
    "name": "Chi tiết phòng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Công tơ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Phí",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Lịch sử",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Hợp đồng",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Danh mục và trạng thái phòng",
   "Nhập Excel phòng theo tòa",
   "Hồ sơ phòng và các mối liên kết"
  ],
  "module": "Phòng",
  "kind": "Detail / dashboard",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Tạo/sửa và import theo tòa",
   "B": "Kiểm trạng thái phòng theo HĐ",
   "C": "Lịch sử trạng thái và giá",
   "D": "Audit thay đổi giá/kỳ"
  },
  "srcActions": [
   "Sửa",
   "Chỉ số",
   "Lịch sử"
  ],
  "srcFields": "Chi tiết phòng, công tơ, phí, lịch sử, hợp đồng"
 },
 {
  "no": 8,
  "id": "CUS-01",
  "title": "Danh sách khách",
  "srcLine": 435,
  "fields": [
   {
    "name": "Mã khách",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tên",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Số liên hệ",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Phòng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "HĐ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Trạng thái",
    "format": "Dropdown / Tag",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Hồ sơ khách thuê",
   "OCR giấy tờ khách",
   "OCR hợp đồng thuê",
   "Tài liệu đính kèm và tra cứu"
  ],
  "module": "Khách hàng",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Nhập tay, OCR 1 mẫu xác nhận",
   "B": "OCR 2 mẫu/cảnh báo thiếu",
   "C": "Soát trùng, phân quyền sâu",
   "D": "Lịch sử OCR, audit"
  },
  "srcActions": [
   "Thêm",
   "Tìm",
   "Lọc"
  ],
  "srcFields": "Mã khách, tên, số liên hệ, phòng, HĐ, trạng thái"
 },
 {
  "no": 9,
  "id": "CUS-02",
  "title": "Hồ sơ khách & OCR",
  "srcLine": 486,
  "fields": [
   {
    "name": "Giấy tờ (mask)",
    "format": "File uploader / Text",
    "required": "TBD"
   },
   {
    "name": "Số liên hệ",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "OA",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Hợp đồng",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Tài liệu",
    "format": "File uploader / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Hồ sơ khách thuê",
   "OCR giấy tờ khách",
   "OCR hợp đồng thuê",
   "Tài liệu đính kèm và tra cứu"
  ],
  "module": "Khách hàng",
  "kind": "Input form / workflow",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Nhập tay, OCR 1 mẫu xác nhận",
   "B": "OCR 2 mẫu/cảnh báo thiếu",
   "C": "Soát trùng, phân quyền sâu",
   "D": "Lịch sử OCR, audit"
  },
  "srcActions": [
   "Upload",
   "OCR",
   "Review",
   "Xác nhận"
  ],
  "srcFields": "Giấy tờ (mask), số liên hệ, OA, hợp đồng, tài liệu"
 },
 {
  "no": 10,
  "id": "CON-01",
  "title": "Danh sách hợp đồng",
  "srcLine": 537,
  "fields": [
   {
    "name": "Số HĐ",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Khách",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tòa/phòng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Giá",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Kỳ",
    "format": "Datepicker / Text",
    "required": "TBD"
   },
   {
    "name": "Hiệu lực",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Hết hạn",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Hợp đồng khách thuê",
   "Phí cố định theo hợp đồng",
   "Hợp đồng sắp hết hạn",
   "Kết quả hỏi gia hạn/chuyển đi"
  ],
  "module": "Hợp đồng",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Tạo/sửa nháp, OCR 1 mẫu xác nhận; xuất hết hạn",
   "B": "OCR nâng mẫu, theo dõi lịch gọi",
   "C": "Duyệt thay đổi/phụ lục giới hạn",
   "D": "Phiên bản điều khoản"
  },
  "srcActions": [
   "Tạo",
   "Tìm",
   "Lọc"
  ],
  "srcFields": "Số HĐ, khách, tòa/phòng, giá, kỳ, hiệu lực, hết hạn"
 },
 {
  "no": 11,
  "id": "CON-02",
  "title": "Form hợp đồng / OCR / phí cố định",
  "srcLine": 589,
  "fields": [
   {
    "name": "Khách",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Phòng",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Giá thuê",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Ngày/kỳ",
    "format": "Datepicker / Text",
    "required": "TBD"
   },
   {
    "name": "Cọc",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Phí cố định",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "File OCR",
    "format": "File uploader / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Hợp đồng khách thuê",
   "Phí cố định theo hợp đồng",
   "Hợp đồng sắp hết hạn",
   "Kết quả hỏi gia hạn/chuyển đi"
  ],
  "module": "Hợp đồng",
  "kind": "Input form / workflow",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Tạo/sửa nháp, OCR 1 mẫu xác nhận; xuất hết hạn",
   "B": "OCR nâng mẫu, theo dõi lịch gọi",
   "C": "Duyệt thay đổi/phụ lục giới hạn",
   "D": "Phiên bản điều khoản"
  },
  "srcActions": [
   "Upload",
   "OCR",
   "Chỉnh",
   "Duyệt"
  ],
  "srcFields": "Khách, phòng, giá thuê, ngày/kỳ, cọc, phí cố định, file OCR"
 },
 {
  "no": 12,
  "id": "CON-03",
  "title": "Hợp đồng sắp hết hạn",
  "srcLine": 642,
  "fields": [
   {
    "name": "HĐ sắp hết hạn",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Khách",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Liên hệ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Phòng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "QL tòa",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Kết quả gọi",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Hợp đồng khách thuê",
   "Phí cố định theo hợp đồng",
   "Hợp đồng sắp hết hạn",
   "Kết quả hỏi gia hạn/chuyển đi"
  ],
  "module": "Hợp đồng",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Tạo/sửa nháp, OCR 1 mẫu xác nhận; xuất hết hạn",
   "B": "OCR nâng mẫu, theo dõi lịch gọi",
   "C": "Duyệt thay đổi/phụ lục giới hạn",
   "D": "Phiên bản điều khoản"
  },
  "srcActions": [
   "Xuất danh sách",
   "Ghi khảo sát gia hạn"
  ],
  "srcFields": "HĐ sắp hết hạn, khách, liên hệ, phòng, QL tòa, kết quả gọi"
 },
 {
  "no": 13,
  "id": "METER-01",
  "title": "Bảng điện nước theo tòa/kỳ",
  "srcLine": 692,
  "fields": [
   {
    "name": "Tòa",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Phòng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tháng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Số cũ",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Số mới",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Lượng tiêu thụ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Đơn giá",
    "format": "Currency / Number / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Công tơ theo phòng",
   "Lưu chỉ số tháng trước",
   "Tính phí điện nước",
   "Phí phát sinh khác"
  ],
  "module": "Điện nước",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Nhập và lưu số theo tháng",
   "B": "Nhập hàng loạt + rà thiếu",
   "C": "Duyệt bất thường/đổi công tơ",
   "D": "Đối chiếu chỉ số chốt kỳ"
  },
  "srcActions": [
   "Nhập chỉ số",
   "Preview",
   "Duyệt"
  ],
  "srcFields": "Tòa, phòng, tháng, số cũ, số mới, lượng tiêu thụ, đơn giá"
 },
 {
  "no": 14,
  "id": "INV-01",
  "title": "Lập hóa đơn theo tòa/kỳ",
  "srcLine": 744,
  "fields": [
   {
    "name": "Tòa",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Kỳ",
    "format": "Datepicker / Text",
    "required": "TBD"
   },
   {
    "name": "Phòng ở",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Tiền phòng/phí/điện nước/phát sinh",
    "format": "Currency / Number / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Công tơ theo phòng",
   "Lưu chỉ số tháng trước",
   "Tính phí điện nước",
   "Phí phát sinh khác",
   "Lập hóa đơn theo tòa → phòng",
   "Tính tiền phòng + phí cố định",
   "Điện nước + phí phát sinh vào hóa đơn",
   "Duyệt hóa đơn và xuất PDF nội bộ"
  ],
  "module": "Hóa đơn",
  "kind": "Input form / workflow",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Lập nháp theo tòa, xem trước, chốt, PDF nội bộ",
   "B": "Batch/preview hàng loạt; lẻ kỳ giới hạn",
   "C": "Duyệt hủy/chỉnh hóa đơn chưa thu",
   "D": "Khóa kỳ và audit chứng từ"
  },
  "srcActions": [
   "Chọn tòa",
   "Sinh",
   "Bổ sung phí",
   "Duyệt"
  ],
  "srcFields": "Tòa, kỳ, phòng ở, tiền phòng/phí/điện nước/phát sinh"
 },
 {
  "no": 15,
  "id": "INV-02",
  "title": "Danh sách hóa đơn & công nợ",
  "srcLine": 798,
  "fields": [
   {
    "name": "Số HĐơn",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Phòng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Khách",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tổng tiền",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Đã thu",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Còn nợ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Trạng thái",
    "format": "Dropdown / Tag",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Lập hóa đơn theo tòa → phòng",
   "Tính tiền phòng + phí cố định",
   "Điện nước + phí phát sinh vào hóa đơn",
   "Duyệt hóa đơn và xuất PDF nội bộ"
  ],
  "module": "Hóa đơn",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Lập nháp theo tòa, xem trước, chốt, PDF nội bộ",
   "B": "Batch/preview hàng loạt; lẻ kỳ giới hạn",
   "C": "Duyệt hủy/chỉnh hóa đơn chưa thu",
   "D": "Khóa kỳ và audit chứng từ"
  },
  "srcActions": [
   "Tìm",
   "Lọc",
   "Xem",
   "Xuất"
  ],
  "srcFields": "Số HĐơn, phòng, khách, tổng tiền, đã thu, còn nợ, trạng thái"
 },
 {
  "no": 16,
  "id": "INV-03",
  "title": "Chi tiết hóa đơn",
  "srcLine": 851,
  "fields": [
   {
    "name": "Số HĐơn",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Tất cả dòng phí",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "PDF",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Lịch gửi và thu tiền",
    "format": "Currency / Number / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Lập hóa đơn theo tòa → phòng",
   "Tính tiền phòng + phí cố định",
   "Điện nước + phí phát sinh vào hóa đơn",
   "Duyệt hóa đơn và xuất PDF nội bộ"
  ],
  "module": "Hóa đơn",
  "kind": "Detail / dashboard",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Lập nháp theo tòa, xem trước, chốt, PDF nội bộ",
   "B": "Batch/preview hàng loạt; lẻ kỳ giới hạn",
   "C": "Duyệt hủy/chỉnh hóa đơn chưa thu",
   "D": "Khóa kỳ và audit chứng từ"
  },
  "srcActions": [
   "PDF",
   "Gửi Zalo",
   "Xem tiền đã thu"
  ],
  "srcFields": "Số HĐơn, tất cả dòng phí, PDF, lịch gửi và thu tiền"
 },
 {
  "no": 17,
  "id": "OA-01",
  "title": "Cấu hình và gửi thông báo",
  "srcLine": 900,
  "fields": [
   {
    "name": "OA",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Template",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Danh sách khách",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Lịch nhắc",
    "format": "Textbox / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Kết nối và cấu hình OA",
   "Gửi hóa đơn và nhắc thanh toán",
   "Nhật ký trạng thái gửi"
  ],
  "module": "Zalo OA",
  "kind": "Input form / workflow",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Gửi tay + 1 lịch cơ bản (phụ thuộc OA)",
   "B": "3 mốc nhắc đã duyệt",
   "C": "Retry/chống trùng/soát đã thu",
   "D": "Báo cáo trạng thái nhà cung cấp"
  },
  "srcActions": [
   "Cấu hình",
   "Gửi thủ công",
   "Lịch đơn giản"
  ],
  "srcFields": "OA, template, danh sách khách, lịch nhắc"
 },
 {
  "no": 18,
  "id": "OA-02",
  "title": "Lịch sử Zalo",
  "srcLine": 948,
  "fields": [
   {
    "name": "HĐơn",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Người nhận",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Thời gian",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Kết quả gửi",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Lỗi",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Kết nối và cấu hình OA",
   "Gửi hóa đơn và nhắc thanh toán",
   "Nhật ký trạng thái gửi"
  ],
  "module": "Zalo OA",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Gửi tay + 1 lịch cơ bản (phụ thuộc OA)",
   "B": "3 mốc nhắc đã duyệt",
   "C": "Retry/chống trùng/soát đã thu",
   "D": "Báo cáo trạng thái nhà cung cấp"
  },
  "srcActions": [
   "Xem trạng thái",
   "Lọc"
  ],
  "srcFields": "HĐơn, người nhận, thời gian, kết quả gửi, lỗi"
 },
 {
  "no": 19,
  "id": "PAY-01",
  "title": "Báo đã thu theo tòa",
  "srcLine": 996,
  "fields": [
   {
    "name": "QL tòa",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "HĐơn",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Số báo thu",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Ngày báo",
    "format": "Datepicker / Text",
    "required": "TBD"
   },
   {
    "name": "Chứng từ",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Báo đã thu từ trưởng nhóm/quản lý",
   "Kế toán/Admin xác nhận thực thu",
   "Thu nhiều lần và công nợ",
   "Báo cáo thu tiền mốc 5/10/15",
   "Quy đổi hiệu suất thu tiền"
  ],
  "module": "Thu tiền",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "QL báo thu, kế toán duyệt, 100/90/70/0",
   "B": "Theo dõi tiến độ và dữ liệu kỳ",
   "C": "Duyệt và log điều chỉnh ngày tiền",
   "D": "Phân bổ thu nâng cao giới hạn"
  },
  "srcActions": [
   "Quản lý báo",
   "Kế toán duyệt"
  ],
  "srcFields": "QL tòa, HĐơn, số báo thu, ngày báo, chứng từ"
 },
 {
  "no": 20,
  "id": "PAY-02",
  "title": "Bảng công nợ và mốc 5/10/15",
  "srcLine": 1046,
  "fields": [
   {
    "name": "Tòa",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Phòng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "HĐơn",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Khoản thu 5/10/15",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Thực thu",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Nợ",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Báo đã thu từ trưởng nhóm/quản lý",
   "Kế toán/Admin xác nhận thực thu",
   "Thu nhiều lần và công nợ",
   "Báo cáo thu tiền mốc 5/10/15",
   "Quy đổi hiệu suất thu tiền"
  ],
  "module": "Thu tiền",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "QL báo thu, kế toán duyệt, 100/90/70/0",
   "B": "Theo dõi tiến độ và dữ liệu kỳ",
   "C": "Duyệt và log điều chỉnh ngày tiền",
   "D": "Phân bổ thu nâng cao giới hạn"
  },
  "srcActions": [
   "Lọc",
   "Báo cáo",
   "Xuất"
  ],
  "srcFields": "Tòa, phòng, HĐơn, khoản thu 5/10/15, thực thu, nợ"
 },
 {
  "no": 21,
  "id": "EXP-01",
  "title": "Danh sách & nhập chi phí",
  "srcLine": 1098,
  "fields": [
   {
    "name": "Tòa",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Kỳ",
    "format": "Datepicker / Text",
    "required": "TBD"
   },
   {
    "name": "Nhóm chi",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Giá trị",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Người nhập/duyệt",
    "format": "Textbox / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Nhập chi phí theo tòa",
   "Xác nhận chi phí và loại trùng",
   "Chi phí chủ nhà và vận hành"
  ],
  "module": "Chi phí",
  "kind": "Input form / workflow",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Nhập chi phí, duyệt, xuất",
   "B": "Import chi phí, danh mục chuẩn",
   "C": "Phân bổ phí chung theo rule",
   "D": "Đối chiếu và chốt kỳ"
  },
  "srcActions": [
   "Tạo",
   "Sửa nháp",
   "Duyệt"
  ],
  "srcFields": "Tòa, kỳ, nhóm chi, giá trị, người nhập/duyệt"
 },
 {
  "no": 22,
  "id": "HR-01",
  "title": "Hồ sơ nhân sự & đội nhóm",
  "srcLine": 1147,
  "fields": [
   {
    "name": "Mã NV",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Họ tên",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Chức vụ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Đội",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "QL",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tòa",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Trạng thái",
    "format": "Dropdown / Tag",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Danh sách và hồ sơ nhân sự",
   "Sơ đồ tổ chức & đội trưởng"
  ],
  "module": "Nhân sự",
  "kind": "Detail / dashboard",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Thêm/sửa/vô hiệu, gán QL tòa",
   "B": "Import và sơ đồ đội nhóm",
   "C": "Lịch sử phân công",
   "D": "Phân quyền tuyến quản lý"
  },
  "srcActions": [
   "Thêm",
   "Sửa",
   "Phân công"
  ],
  "srcFields": "Mã NV, họ tên, chức vụ, đội, QL, tòa, trạng thái"
 },
 {
  "no": 23,
  "id": "SAL-01",
  "title": "Thiết lập lương và bảng lương nháp",
  "srcLine": 1197,
  "fields": [
   {
    "name": "NV",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Lương cố định",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Phụ cấp",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "HS",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Điều chỉnh",
    "format": "Textbox / Text",
    "required": "TBD"
   },
   {
    "name": "Tổng nháp",
    "format": "Textbox / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Lương cố định và phụ cấp",
   "Lương theo hiệu suất và điều chỉnh",
   "Duyệt bảng lương và lịch sử"
  ],
  "module": "Lương",
  "kind": "Input form / workflow",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Tính nháp theo rule đơn giản, xuất Excel",
   "B": "Tự kéo dữ liệu HS vào nháp",
   "C": "Duyệt/khóa nháp và bậc hiệu suất",
   "D": "Ngoại lệ lương đã ký, truy vết"
  },
  "srcActions": [
   "Đặt mức",
   "Tính",
   "Điều chỉnh",
   "Xuất"
  ],
  "srcFields": "NV, lương cố định, phụ cấp, HS, điều chỉnh, tổng nháp"
 },
 {
  "no": 24,
  "id": "SHARE-01",
  "title": "Bảng cổ phần theo tòa",
  "srcLine": 1248,
  "fields": [
   {
    "name": "Tòa",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Kỳ",
    "format": "Datepicker / Text",
    "required": "TBD"
   },
   {
    "name": "Cổ đông",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "% sở hữu",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Vốn góp",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Lãi được chia",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Danh sách cổ đông và vốn/tỷ lệ",
   "Tính lợi nhuận phân bổ",
   "Theo dõi chi/đã nhận cổ đông"
  ],
  "module": "Cổ phần",
  "kind": "Grid view / list",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Nhập tỷ lệ theo tòa, phân bổ nháp",
   "B": "Import bảng chia từ mẫu Excel",
   "C": "So tổng tỷ lệ và duyệt kỳ",
   "D": "Snapshot tỷ lệ, lịch sử"
  },
  "srcActions": [
   "Nhập/import",
   "Điều chỉnh tỷ lệ",
   "Xem"
  ],
  "srcFields": "Tòa, kỳ, cổ đông, % sở hữu, vốn góp, lãi được chia"
 },
 {
  "no": 25,
  "id": "RPT-01",
  "title": "Báo cáo tòa: thu, nợ, chi phí, lãi",
  "srcLine": 1298,
  "fields": [
   {
    "name": "Tòa/kỳ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Doanh thu",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Thu thực",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Công nợ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Chi phí",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Lãi tạm",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Báo cáo từng tòa theo tháng",
   "Báo cáo kinh doanh toàn công ty",
   "Báo cáo thu 5/10/15 và hiệu suất",
   "Báo cáo chi phí và lãi",
   "Báo cáo lương và chia cổ phần"
  ],
  "module": "Báo cáo",
  "kind": "Detail / dashboard",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Báo cáo Excel theo tòa và tổng công ty",
   "B": "Xu hướng, kéo nguồn tự động hơn",
   "C": "Đối soát/duyệt kỳ",
   "D": "Khóa kỳ, truy vết chứng từ"
  },
  "srcActions": [
   "Lọc",
   "Xuất"
  ],
  "srcFields": "Tòa/kỳ, doanh thu, thu thực, công nợ, chi phí, lãi tạm"
 },
 {
  "no": 26,
  "id": "RPT-02",
  "title": "Báo cáo kinh doanh & hiệu suất",
  "srcLine": 1349,
  "fields": [
   {
    "name": "Tòa",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Nhóm",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Kỳ",
    "format": "Datepicker / Text",
    "required": "TBD"
   },
   {
    "name": "Mốc 5/10/15",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tỷ lệ lấp đầy",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "HĐ",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Báo cáo từng tòa theo tháng",
   "Báo cáo kinh doanh toàn công ty",
   "Báo cáo thu 5/10/15 và hiệu suất",
   "Báo cáo chi phí và lãi",
   "Báo cáo lương và chia cổ phần"
  ],
  "module": "Báo cáo",
  "kind": "Detail / dashboard",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Báo cáo Excel theo tòa và tổng công ty",
   "B": "Xu hướng, kéo nguồn tự động hơn",
   "C": "Đối soát/duyệt kỳ",
   "D": "Khóa kỳ, truy vết chứng từ"
  },
  "srcActions": [
   "Lọc",
   "So sánh",
   "Xuất"
  ],
  "srcFields": "Tòa, nhóm, kỳ, mốc 5/10/15, tỷ lệ lấp đầy, HĐ"
 },
 {
  "no": 27,
  "id": "RPT-03",
  "title": "Báo cáo lương & chia lợi nhuận",
  "srcLine": 1401,
  "fields": [
   {
    "name": "NV/kỳ: lương",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Hiệu suất",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Cổ đông/tòa: lợi nhuận chia",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Báo cáo từng tòa theo tháng",
   "Báo cáo kinh doanh toàn công ty",
   "Báo cáo thu 5/10/15 và hiệu suất",
   "Báo cáo chi phí và lãi",
   "Báo cáo lương và chia cổ phần"
  ],
  "module": "Báo cáo",
  "kind": "Detail / dashboard",
  "excelType": "Màn hình chính",
  "notes": {
   "A": "Báo cáo Excel theo tòa và tổng công ty",
   "B": "Xu hướng, kéo nguồn tự động hơn",
   "C": "Đối soát/duyệt kỳ",
   "D": "Khóa kỳ, truy vết chứng từ"
  },
  "srcActions": [
   "Preview",
   "Xuất"
  ],
  "srcFields": "NV/kỳ: lương, hiệu suất; cổ đông/tòa: lợi nhuận chia"
 },
 {
  "no": 28,
  "id": "SYS-01",
  "title": "Phân quyền và phạm vi tòa",
  "srcLine": 1449,
  "fields": [
   {
    "name": "Người dùng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Vai trò",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Danh sách tòa được xem/sửa",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Tài khoản, quyền theo tòa",
   "Audit thay đổi dữ liệu tài chính",
   "Sao lưu, import khởi tạo, vận hành"
  ],
  "module": "Hệ thống",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "Quyền cơ bản, không tự duyệt tiền",
   "B": "Phân quyền theo chức năng",
   "C": "Log duyệt và scope theo tòa",
   "D": "Theo dõi phiên bản quyền"
  },
  "srcActions": [
   "Admin phân vai trò, chọn tòa được quản lý"
  ],
  "srcFields": "Người dùng, vai trò, danh sách tòa được xem/sửa"
 },
 {
  "no": 29,
  "id": "OWN-IMP",
  "title": "Import chủ nhà theo mẫu",
  "srcLine": 1495,
  "fields": [
   {
    "name": "Mã chủ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tên",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Liên hệ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Lỗi từng dòng nhập",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Hồ sơ chủ nhà",
   "Nhập Excel chủ nhà",
   "Gắn chủ nhà với tòa"
  ],
  "module": "Chủ nhà",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "Upload theo mẫu cố định, báo lỗi từng dòng",
   "B": "Preview và kiểm trùng",
   "C": "Lịch sử import",
   "D": "Audit batch và đối chiếu"
  },
  "srcActions": [
   "Upload Excel",
   "Xem lỗi",
   "Xác nhận"
  ],
  "srcFields": "Mã chủ, tên, liên hệ; lỗi từng dòng nhập"
 },
 {
  "no": 30,
  "id": "BLD-IMP",
  "title": "Import tòa nhà theo mẫu",
  "srcLine": 1543,
  "fields": [
   {
    "name": "Mã tòa",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Mã chủ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Địa chỉ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Dòng trùng/mất liên kết",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Danh mục tòa nhà",
   "Nhập Excel tòa nhà",
   "Phân công quản lý tòa"
  ],
  "module": "Tòa nhà",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "Upload theo mẫu cố định, báo lỗi từng dòng",
   "B": "Preview và kiểm trùng",
   "C": "Lịch sử import",
   "D": "Audit batch và đối chiếu"
  },
  "srcActions": [
   "Upload Excel",
   "Xem lỗi",
   "Xác nhận"
  ],
  "srcFields": "Mã tòa, mã chủ, địa chỉ; dòng trùng/mất liên kết"
 },
 {
  "no": 31,
  "id": "ROOM-IMP",
  "title": "Import phòng theo tòa",
  "srcLine": 1591,
  "fields": [
   {
    "name": "Mã tòa",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Mã phòng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tầng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Giá",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Trạng thái",
    "format": "Dropdown / Tag",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Danh mục và trạng thái phòng",
   "Nhập Excel phòng theo tòa",
   "Hồ sơ phòng và các mối liên kết"
  ],
  "module": "Phòng",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "Upload theo mẫu cố định, báo lỗi từng dòng",
   "B": "Preview và kiểm trùng",
   "C": "Lịch sử import",
   "D": "Audit batch và đối chiếu"
  },
  "srcActions": [
   "Upload Excel",
   "Xem lỗi",
   "Xác nhận"
  ],
  "srcFields": "Mã tòa, mã phòng, tầng, giá, trạng thái"
 },
 {
  "no": 32,
  "id": "OCR-CUS",
  "title": "OCR giấy tờ và xác nhận field",
  "srcLine": 1640,
  "fields": [
   {
    "name": "Ảnh/PDF giấy tờ",
    "format": "File uploader / Text",
    "required": "TBD"
   },
   {
    "name": "Các field được trích xuất",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Trạng thái soát",
    "format": "Dropdown / Tag",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Hồ sơ khách thuê",
   "OCR giấy tờ khách",
   "OCR hợp đồng thuê",
   "Tài liệu đính kèm và tra cứu"
  ],
  "module": "Khách hàng",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "1 mẫu đã kiểm thử; người dùng sửa và duyệt",
   "B": "Thêm mẫu/field confidence",
   "C": "Cảnh báo trùng/lệch",
   "D": "Audit sửa field"
  },
  "srcActions": [
   "Upload ảnh/PDF",
   "Soát",
   "Sửa",
   "Xác nhận"
  ],
  "srcFields": "Ảnh/PDF giấy tờ, các field được trích xuất, trạng thái soát"
 },
 {
  "no": 33,
  "id": "OCR-CON",
  "title": "OCR hợp đồng và đối chiếu",
  "srcLine": 1689,
  "fields": [
   {
    "name": "PDF HĐ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Mã",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Khách",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Phòng",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Giá",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Kỳ",
    "format": "Datepicker / Text",
    "required": "TBD"
   },
   {
    "name": "Cọc",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Phí",
    "format": "Currency / Number / Text",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Hồ sơ khách thuê",
   "OCR giấy tờ khách",
   "OCR hợp đồng thuê",
   "Tài liệu đính kèm và tra cứu"
  ],
  "module": "Hợp đồng",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "1 mẫu đã kiểm thử; người dùng sửa và duyệt",
   "B": "Thêm mẫu/field confidence",
   "C": "Cảnh báo trùng/lệch",
   "D": "Audit sửa field"
  },
  "srcActions": [
   "Upload HĐ",
   "Soát khách/phòng/giá/kỳ",
   "Xác nhận"
  ],
  "srcFields": "PDF HĐ, mã, khách, phòng, giá, kỳ, cọc, phí"
 },
 {
  "no": 34,
  "id": "CON-FOLLOW",
  "title": "Cập nhật kết quả hỏi gia hạn",
  "srcLine": 1742,
  "fields": [
   {
    "name": "Khách",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Ngày liên hệ",
    "format": "Datepicker / Text",
    "required": "TBD"
   },
   {
    "name": "Phản hồi",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Chuyển đi/gia hạn",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Ghi chú",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Hợp đồng khách thuê",
   "Phí cố định theo hợp đồng",
   "Hợp đồng sắp hết hạn",
   "Kết quả hỏi gia hạn/chuyển đi"
  ],
  "module": "Hợp đồng",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "Tạo/sửa nháp, OCR 1 mẫu xác nhận; xuất hết hạn",
   "B": "OCR nâng mẫu, theo dõi lịch gọi",
   "C": "Duyệt thay đổi/phụ lục giới hạn",
   "D": "Phiên bản điều khoản"
  },
  "srcActions": [
   "Ghi chú gọi",
   "Chọn gia hạn/chuyển đi/chưa phản hồi"
  ],
  "srcFields": "Khách, ngày liên hệ, phản hồi, chuyển đi/gia hạn, ghi chú"
 },
 {
  "no": 35,
  "id": "INV-PREV",
  "title": "Xem trước hóa đơn tòa/kỳ",
  "srcLine": 1791,
  "fields": [
   {
    "name": "Phòng/HĐ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tiền thuê",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Cố định",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Công tơ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Phát sinh",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tổng",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Lập hóa đơn theo tòa → phòng",
   "Tính tiền phòng + phí cố định",
   "Điện nước + phí phát sinh vào hóa đơn",
   "Duyệt hóa đơn và xuất PDF nội bộ"
  ],
  "module": "Hóa đơn",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "Lập nháp theo tòa, xem trước, chốt, PDF nội bộ",
   "B": "Batch/preview hàng loạt; lẻ kỳ giới hạn",
   "C": "Duyệt hủy/chỉnh hóa đơn chưa thu",
   "D": "Khóa kỳ và audit chứng từ"
  },
  "srcActions": [
   "Soát chỉ số, phí phát sinh, tổng trước chốt"
  ],
  "srcFields": "Phòng/HĐ, tiền thuê, cố định, công tơ, phát sinh, tổng"
 },
 {
  "no": 36,
  "id": "PAY-APP",
  "title": "Xác nhận phiếu thu kế toán",
  "srcLine": 1842,
  "fields": [
   {
    "name": "HĐơn",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Người báo",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Số tiền",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Ngày nhận",
    "format": "Datepicker / Text",
    "required": "TBD"
   },
   {
    "name": "Trạng thái xác nhận",
    "format": "Dropdown / Tag",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Báo đã thu từ trưởng nhóm/quản lý",
   "Kế toán/Admin xác nhận thực thu",
   "Thu nhiều lần và công nợ",
   "Báo cáo thu tiền mốc 5/10/15",
   "Quy đổi hiệu suất thu tiền"
  ],
  "module": "Thu tiền",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "Chỉ kế toán/Admin xác nhận khoản thực thu",
   "B": "Lọc nhanh theo kỳ/tòa",
   "C": "Lịch sử điều chỉnh/duyệt",
   "D": "Đối soát và khóa kỳ"
  },
  "srcActions": [
   "Duyệt/từ chối báo thu",
   "Ghi nhận ngày nhận thực"
  ],
  "srcFields": "HĐơn, người báo, số tiền, ngày nhận, trạng thái xác nhận"
 },
 {
  "no": 37,
  "id": "HR-ASSIGN",
  "title": "Phân công nhân viên theo tòa",
  "srcLine": 1892,
  "fields": [
   {
    "name": "NV",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Đội",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tòa",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Hiệu lực phân công",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Vai trò",
    "format": "Dropdown / Tag",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Danh sách và hồ sơ nhân sự",
   "Sơ đồ tổ chức & đội trưởng"
  ],
  "module": "Nhân sự",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "Thêm/sửa/vô hiệu, gán QL tòa",
   "B": "Import và sơ đồ đội nhóm",
   "C": "Lịch sử phân công",
   "D": "Phân quyền tuyến quản lý"
  },
  "srcActions": [
   "Gán trưởng nhóm, thay đổi người phụ trách"
  ],
  "srcFields": "NV, đội, tòa, hiệu lực phân công, vai trò"
 },
 {
  "no": 38,
  "id": "SAL-ADJ",
  "title": "Điều chỉnh lương kỳ",
  "srcLine": 1939,
  "fields": [
   {
    "name": "NV",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Kỳ lương",
    "format": "Datepicker / Text",
    "required": "TBD"
   },
   {
    "name": "Loại điều chỉnh",
    "format": "Dropdown / Tag",
    "required": "TBD"
   },
   {
    "name": "Số tiền",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Lý do",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Lương cố định và phụ cấp",
   "Lương theo hiệu suất và điều chỉnh",
   "Duyệt bảng lương và lịch sử"
  ],
  "module": "Lương",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "Tính nháp theo rule đơn giản, xuất Excel",
   "B": "Tự kéo dữ liệu HS vào nháp",
   "C": "Duyệt/khóa nháp và bậc hiệu suất",
   "D": "Ngoại lệ lương đã ký, truy vết"
  },
  "srcActions": [
   "Kế toán thêm khoản điều chỉnh và lý do"
  ],
  "srcFields": "NV, kỳ lương, loại điều chỉnh, số tiền, lý do"
 },
 {
  "no": 39,
  "id": "SHARE-RESULT",
  "title": "Xem phân bổ lợi nhuận theo tòa",
  "srcLine": 1986,
  "fields": [
   {
    "name": "Tòa/kỳ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Cổ đông",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tỷ lệ",
    "format": "Currency / Number / Text",
    "required": "TBD"
   },
   {
    "name": "Lãi phân bổ",
    "format": "Text / Column",
    "required": "TBD"
   },
   {
    "name": "Tổng tạm chia",
    "format": "Text / Column",
    "required": "TBD"
   }
  ],
  "actions": [],
  "rules": [
   "Danh sách cổ đông và vốn/tỷ lệ",
   "Tính lợi nhuận phân bổ",
   "Theo dõi chi/đã nhận cổ đông"
  ],
  "module": "Cổ phần",
  "kind": "Popup",
  "excelType": "Tab / modal / luồng phụ",
  "notes": {
   "A": "Nhập tỷ lệ theo tòa, phân bổ nháp",
   "B": "Import bảng chia từ mẫu Excel",
   "C": "So tổng tỷ lệ và duyệt kỳ",
   "D": "Snapshot tỷ lệ, lịch sử"
  },
  "srcActions": [
   "Xem tỷ lệ, số lãi tạm chia, xuất"
  ],
  "srcFields": "Tòa/kỳ, cổ đông, tỷ lệ, lãi phân bổ, tổng tạm chia"
 }
];
