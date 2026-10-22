# Trạng thái phiên làm việc — CR-CUS-02: OCR hợp đồng theo mẫu đầy đủ (21/10/2026)

**Yêu cầu:** phần khách thuê lấy thông tin bằng OCR hợp đồng theo `docs/tenplate/Hop_dong_thue_phong_demo_day_du.pdf`.
**Đã chốt với user:** OCR toàn bộ hồ sơ thuê; đọc bảng tài sản Điều 2.2; chỉ dùng mẫu đầy đủ (bỏ P302); phạt/phí chỉ hiển thị.
**Trạng thái:** **hoàn tất** — code, kiểm thử tự động, ảnh và tài liệu đã cập nhật (schema 10). Chưa commit.

## 1. Đã làm

| Hạng mục | Nội dung | File |
| --- | --- | --- |
| Module OCR dùng chung | 38 field / 7 nhóm, bảng 30 tài sản, bản scan minh họa theo mẫu, so khớp F012.C, dựng dòng phí/điều khoản/bàn giao/tiền đã nộp, áp vào HĐ có sẵn | `js/views/ocr-contract.js` (mới, nạp sau `views/shared.js`) |
| Workspace OCR | Tiêu đề nhóm field; bảng OCR có ô “Bảng đúng”; tiến độ = field + bảng; *Đánh dấu tất cả* / *Nhập tay* xử lý bảng | `js/views/shared.js` |
| OCR-CON / CON-02 | OCR-CON dùng module; *Chuyển vào form*; *Duyệt* tạo khách (Bên B + xe chờ xác nhận) và HĐ đầy đủ; CON-02 hiện bàn giao & đã nộp khi ký | `js/views/contracts.js` |
| CUS-02 | Thẻ *Đọc hợp đồng (OCR mẫu đầy đủ)* thay thẻ đọc dòng phí; section *Tài sản & chỉ số bàn giao* (Sửa/Lưu/Hủy); thẻ HĐ có *Đã nộp khi ký*, số người/xe; điều khoản thêm lịch thanh toán, phí nhượng phòng, chậm nộp (chỉ hiển thị), bảo hành; đối chiếu cọc chọn tài sản hư hỏng theo biên bản | `js/views/customers.js` |
| Dữ liệu | Schema 10; chỉ mẫu đầy đủ (`TH.CONTRACT_TERMS.DAYDU` thêm phí/phạt/lịch nộp/STK/bảo hành); `TH.HANDOVER_ASSETS`; mọi HĐ có `handover`, HĐ đang thuê có `prepaid`; khách có `idPlace`; thư viện mẫu: mẫu đầy đủ (duyệt) + mẫu phụ (nháp) | `js/data.js` |
| CR / QA / CSS | `CR-CUS-02` gắn F012; PENDING F012; CSS nhóm/bảng OCR, bảng trong bản scan, mobile | `js/cus-cr.js`, `js/views/qa.js`, `css/layouts.css`, `index.html` |
| Kiểm thử | Smoke 928/0 lỗi; QA-OCR-01…07 đạt; 375 px không tràn; ảnh `docs/qa/schema10/` | `tools/qa-ocr.playwright.js`, `docs/qa/schema10/results.json` |
| Tài liệu | Decision log §9.6; QA §8.4; README (mục OCR, bước demo 4, schema v10) | `docs/*`, `README.md` |

Số hồi quy không đổi: LNR Kinh doanh 09 16.937.599; Tổng 09 7.537.599; Kinh doanh 10 4.755.000; HS CG 09 72,3%; INV-2610-CG202 6.069.800.

## 2. Còn lại / cần đầu vào

- Chưa commit git (người dùng chưa yêu cầu).
- OCR thật (vendor, PoC, consent) ngoài phạm vi; kết quả hiện là mô phỏng theo số liệu của mẫu.
- Chính sách vẫn chờ khách phê duyệt: hạn hoàn 10 ngày, mất cọc khi đơn phương chấm dứt, gia hạn mặc nhiên, phạt chậm nộp (chỉ hiển thị), xe máy 0 đ suy từ Điều 1, thang máy / sạc kWh.
- Chưa làm: prorate theo ngày; đọc trọn Điều 5–7; đồng bộ chỉ số bàn giao sang METER; mẫu phụ “Phụ lục gia hạn” chưa có field; các mục §3 của bản trước (vòng đời HĐ đầy đủ, override theo nhóm tòa, customerAuditLog riêng, K-07).
