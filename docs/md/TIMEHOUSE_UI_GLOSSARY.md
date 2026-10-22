# TIMEHOUSE — Bảng thuật ngữ giao diện (CR-UI-STD)

Áp dụng cho mọi chuỗi **hiển thị** trong `js/views/*.js` và helper. Không đổi id, `data-act`, key lưu trữ hay mã dữ liệu mà QA dựa vào. Kiểm tra tự động: `node tools/lint-ui.js` (danh sách đen bên dưới).

## 1. Từ tiếng Anh → tiếng Việt

| Không dùng | Dùng | Ghi chú |
|---|---|---|
| Upload | Tải lên | "Upload & OCR" → "Tải lên & OCR" |
| Preview | Xem trước | |
| Import Excel | Nhập từ Excel | |
| Rollback | Hoàn tác | "Rollback import" → "Hoàn tác lô nhập" |
| Batch | Lô / Lô lập hóa đơn | "Batch & audit" → "Lô lập hóa đơn & nhật ký" |
| Snapshot | Bản chốt | |
| Retry | Gửi lại | |
| bounce | bị trả về | |
| upsert | cập nhật bản ghi trùng / xử lý dòng trùng | |
| Dead-letter | Tin lỗi | |
| Log correction | Nhật ký sửa so với OCR | |
| audit | nhật ký | "Audit tài chính" → "Nhật ký tài chính" |
| version | phiên bản | |
| snapshot (chữ thường) | bản chốt | |
| commit | chốt | |
| idempotent | không tạo trùng | |
| queue retry | hàng đợi gửi lại | |
| OCR & review | OCR & rà soát | "OCR" giữ nguyên (thuật ngữ quen thuộc) |
| DRAFT / PROPOSED / PENDING_APPROVAL | Nháp / Đề xuất / Chờ duyệt | Đổi tự động khi tắt chế độ review |

## 2. Viết tắt

- **Tiêu đề cột, nút, nhãn form**: viết đầy đủ.
  - HĐ → Hợp đồng
  - QL → Quản lý
  - DV → Dịch vụ
  - Kỳ TT → Kỳ thanh toán
  - XN → xác nhận
- **"HĐ" chỉ mang nghĩa hợp đồng.** Hóa đơn luôn viết đầy đủ. Bỏ "HĐơn"; dùng "Chưa lập hóa đơn".
- **Ô dữ liệu dày** (ví dụ ghi chú, chuỗi mô tả trong bảng) có thể giữ viết tắt quen thuộc. Khi cần làm rõ, dùng `<abbr title="…">`.
- **Mã dữ liệu giữ nguyên** (`HĐ-CG101/25`, `INV-2610-CG302`, `KH-001`), hiển thị font mono.

## 3. Trạng thái — nhãn và tone thống nhất

Nguồn duy nhất là `TH.STATUS_REG()` / `TH.statusOf(domain, key)` trong `js/components.js`.

| Tone | Ý nghĩa | Ví dụ |
|---|---|---|
| danger | quá hạn / từ chối / lỗi | Quá hạn, Từ chối, Gửi lỗi |
| warning | chờ xử lý | Chưa thu, Chưa thanh toán, Chờ xác nhận, Chờ duyệt |
| info | đang xử lý / một phần | Thu một phần, Đang gửi |
| success | hoàn tất | Đã thu, Đã duyệt, Đang thuê |
| neutral | không hoạt động | Ngừng, Đã thanh lý |
| draft | nháp | Nháp, Chưa lập hóa đơn |

## 4. Nhãn nút chuẩn

- **Form**: "Hủy" bên trái, nút chính ở cuối bên phải ("Lưu tòa", "Lưu phòng"…).
- **Modal chỉ xem**: "Đóng".
- **Header trang**: tối đa 1 nút chính và 2 nút phụ; phần còn lại vào menu **"Thêm"**.
- **Cột thao tác trong bảng**: hành động chính ở dạng link; phần còn lại vào menu **"⋯"**.

## 5. Mã nội bộ (F0xx, D-0x, K-0x, BILL-Qx, CR-…, mã màn)

- **Mặc định ẩn.** Khi chế độ review tắt, `TH.cleanCodes` / `TH.reviewFilter` lọc các mã này khỏi văn bản và tooltip, và ẩn `.screen-id` cùng pill gói.
- **Bật lại**: **Công cụ demo → "Chế độ review nghiệm thu"** để đối chiếu với SRS.
- **Không bị lọc**: input, textarea, `.mono`, `code`, bản in `.doc-page` / `.print-doc` và phần tử có `[data-raw]`.
