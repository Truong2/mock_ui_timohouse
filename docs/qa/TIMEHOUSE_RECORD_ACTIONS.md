# TIMEHOUSE — thao tác bản ghi và sửa sai

Ngày kiểm tra: 28/10/2026. Giữ schema 12, dữ liệu demo và các thay đổi hiện có trong workspace.

## Phần triển khai

- `js/record-actions.js`: kiểm tra quyền, phạm vi tòa, trạng thái, kỳ khóa và liên kết; xóa mềm, khôi phục, lưu trữ; mã mới độc lập số lượng bản ghi; nhật ký trước/sau.
- `js/record-ui.js`: thao tác theo dòng, danh sách bản ghi/đã xóa/phiếu điều chỉnh, form dùng lại thông tin nghiệp vụ, cảnh báo thay đổi chưa lưu.
- `js/record-integration.js`: nối các nút cũ vào quy tắc chung; hợp đồng nháp, tính theo kỳ, hoàn tác import, bản thay thế báo cáo.
- `js/record-workflows.js`: giá/phí theo hiệu lực, phân công, tài liệu, lịch OA, bảng tỷ lệ cổ phần, đầu vào lương và các chốt kiểm tra khi lưu form cũ.

Chứng từ kỳ khóa giữ nguyên. Phiếu điều chỉnh chỉ ghi nhận khi Kế toán/Admin khác người lập duyệt vào kỳ đang mở. Phân biệt sửa ghi nhận, chuyển phân bổ và giao dịch tiền thực tế có ngày/chứng từ. Chi phí dùng bút toán đảo và khoản thay thế; có thể sửa nhóm chi khi số tiền không đổi.

Lô nhập mới lưu ảnh trước/sau, nhật ký và dấu vết dữ liệu phụ thuộc. Hoàn tác kiểm tra toàn bộ lô trước khi thay đổi; dữ liệu đã sửa hoặc đã phát sinh phụ thuộc sẽ chặn hoàn tác. Lô cũ thiếu ảnh phục hồi có thông báo lý do.

OA, tệp đính kèm và tệp import tiếp tục dùng mô phỏng của demo. Việc sửa bản ghi, chọn dòng nhập, ghi và hoàn tác cập nhật dữ liệu localStorage thật; không gửi tin qua nhà cung cấp hay tải tệp thật lên máy chủ.

## Kết quả kiểm tra

- Kiểm tra cú pháp tất cả JavaScript: đạt. UI lint: 0 vi phạm.
- QA dữ liệu: 3.556 kiểm tra đạt.
- 11 bộ Playwright: 476 kiểm tra đạt, gồm vòng đời bản ghi, điều chỉnh tài chính, thu tiền, hóa đơn, khách, OCR, báo cáo, gói A–D, giá và điều hướng.
- Kiểm tra trực tiếp xóa → F5 → khôi phục; gửi → duyệt → F5; đổi vai trò khi form đang mở; hủy form chưa lưu; bàn phím và chiều rộng 375px.
- Hồi quy báo cáo bao gồm ca QA-RPT-06 và các loại báo cáo bổ sung trong luồng Báo cáo hiện tại.

Chi tiết máy đọc: [record-actions-results.json](record-actions-results.json).

Ảnh kiểm tra: [desktop](records-desktop.png), [375px](records-mobile.png).
