# Trạng thái phiên — UI giới thiệu giá và mốc bàn giao (24/10/2026)

**Mới nhất — CR-PKG-OPS:** đã triển khai phân tầng hỗ trợ vận hành, thay mô tả A nhập Excel trước đó. A xử lý từng hồ sơ/hóa đơn/tin OA; B nhập Excel và hàng loạt; C kiểm soát; D quản trị kỳ. OCR/OA/hai mẫu báo cáo và đầy đủ công thức có ở mọi gói. Chính sách chung và guard chặn handler/deep link/dialog vượt gói; giữ schema 12 và dữ liệu lưu.

**QA mới nhất:** 261 assertion trình duyệt; smoke 1.088/0; mapping 156/156; quét 1.744 biến thể màn + 432 dialog qua bốn kích thước đạt. 2.524 chỉ tiêu khớp baseline và 3.718 kiểm tra Decimal đạt; lint UI không có phát hiện. [Ma trận 52 nhóm](TIMEHOUSE_PACKAGE_FUNCTION_MATRIX.md), [bàn giao giá](TIMEHOUSE_FUNCTIONS_PRICING_MILESTONES.md), [kết quả/ảnh A–D](../qa/package-policy/). Bản vận hành thật chưa nằm trong đợt này.

## Lịch sử — UI giới thiệu và giới hạn gói trước CR-PKG-OPS

**Hiện tại:** trang giới thiệu đã có bốn mức đầu tư A–D, phạm vi và giá trị từng gói, ví dụ nghiệp vụ, điều kiện nghiệm thu, bảng so sánh và sáu mốc bàn giao. Nội dung dùng chung với drawer chọn gói; giá tiếp tục lấy từ `TH.PACKAGES`. Liên kết gửi khách mở đúng gói và loại bỏ tham số QA. Không thay dataset, phép tính hoặc quyền nghiệp vụ.

**Chốt giới hạn gói:** OCR và Zalo OA có ở mọi gói. Hai mẫu báo cáo gốc được giữ xuyên A–D; B thêm truy nguồn/xu hướng sáu kỳ, C thêm so sánh/duyệt số liệu, D thêm khóa kỳ/phiên bản. UI có mục giới hạn OCR/OA/báo cáo trong chi tiết và drawer; không cam kết không giới hạn mẫu, OA hoặc tự thiết kế báo cáo.

**QA mới nhất:** 50 kiểm tra giới thiệu giá đạt; smoke 1.088 lượt không lỗi. Đã kiểm bốn gói tại 375/768/1024/1440px, giới hạn OCR/OA/hai mẫu báo cáo, bàn phím, reduced motion, liên kết chia sẻ và review. Kết quả 19 kiểm tra UI và 21 kiểm tra component là lần hồi quy trước điều chỉnh nội dung giới hạn. [Phạm vi và hướng dẫn](TIMEHOUSE_FUNCTIONS_PRICING_MILESTONES.md), [kết quả và ảnh](../qa/pricing/). Thời gian, lịch thanh toán và phí dịch vụ cần ghi trong thỏa thuận triển khai.

## Lịch sử — Dataset theo tài liệu khách hàng (23/10/2026)

**Hiện tại:** đã triển khai `excel-demo-v1`: 3 tòa/18 phòng/6 kỳ, giữ schema 12 và dữ liệu người dùng đã lưu. 13 workbook/248 sheet/108.090 ô công thức có hồ sơ; 15 tình huống nghiệp vụ, 97 hóa đơn/98 phiếu thu, sổ dịch vụ/sửa chữa/hoa hồng và hai báo cáo lưu sẵn.

**QA dataset:** 3.556 kiểm tra cấu trúc và giải thích chênh lệch; 3.718 phép đối chiếu Decimal; 236 assertion trình duyệt; smoke 1.088 lượt không lỗi. Số mới được đối chiếu độc lập; mốc dữ liệu cũ chạy trên bộ tính hiện tại giữ nguyên kết quả. [Bàn giao và giới hạn](TIMEHOUSE_DATASET_QA.md), [nguồn/công thức](TIMEHOUSE_DATASET_SOURCES.md), [ma trận](TIMEHOUSE_DATASET_MATRIX.md). UI/dataset đã commit và push tại `6907d59`.

## Lịch sử — Chuẩn hóa component UI enterprise

**Trạng thái hiện tại:** đã triển khai CR-UI-COMP trên toàn ứng dụng. Giữ HTML/CSS/JS thuần, Inter/teal và schema 12. Nhóm hành động được quyết định lúc render; tab/panel có điều khiển bàn phím; form giữ nháp, lỗi tại trường và liên kết lỗi; menu dùng lớp nổi và trả focus đúng khi đóng modal. Shell có cùng thứ tự DOM/hiển thị, CSS shell/responsive được gom về navigation.css.

**QA:** 205 assertion đạt; 1.088 lượt smoke không lỗi; 1.744 biến thể màn/tab và 432 dialog qua A–D × 375/768/1024/1440px không tràn ngang. Đã chạy UI, điều hướng, OCR, hóa đơn, thu tiền, cọc, báo cáo và danh sách mobile; số tiền trước/sau giữ nguyên theo baseline schema 12.

**Bàn giao:** [Chuẩn component/pattern](TIMEHOUSE_UI_COMPONENT_STANDARD.md), [JSON kết quả](../qa/ui-enterprise/results.json), [ảnh trước/sau](../qa/ui-enterprise/). Firefox/Safari, screen reader, zoom native và PDF phân trang chưa nghiệm thu; đã kiểm reflow tương đương 200% và reduced motion trên Chromium. Chưa tạo commit cho đợt UI này.

## Lịch sử — CR-CUS-02: OCR hợp đồng (21/10/2026)

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
