# Trạng thái phiên làm việc — CR_CUS_ANSWERS (20/10/2026)

**Yêu cầu:** tiếp tục phần còn thiếu theo trạng thái phiên, áp dụng bộ đề xuất [CR_CUS_ANSWERS](TIMEHOUSE_MOCKUP_CR_CUS_ANSWERS.md) cho CR-CUS-01.

**Trạng thái hiện tại:** đã hoàn tất checklist tiếp nối ở §2 của bản bàn giao trước: xác minh fix, nâng schema, chạy QA-CUS, soát bố cục/chụp ảnh, cập nhật tài liệu và dọn server/tệp tạm. Phần mockup đạt QA kỹ thuật; các chính sách và hạng mục cần đầu vào ở §3 dưới đây vẫn chưa được nghiệm thu.

## 1. Đã có từ phiên trước

- K-01: TPVH và Trưởng nhóm là hai phân công riêng; CG/DD có NV-013 TPVH, TX chưa phân công.
- K-02: danh sách mỗi HĐ một dòng, một trạng thái chính + các nhãn nghiệp vụ; công nợ theo từng HĐ.
- K-03/K-04: hồ sơ cọc đủ bàn giao → đối chiếu → gửi duyệt → duyệt/trả lại → xác nhận thực chi; chặn tự duyệt; mức giữ cọc có căn cứ; hạn hoàn nullable theo điều khoản.
- K-05/K-08: danh mục 9 dòng phí, xe máy 0đ riêng; SM theo xe và sạc kWh riêng; trạng thái xe và kiểm trùng khoảng đăng ký; xe pending chưa tính phí.
- K-06: cấu hình doanh nghiệp mặc định 35 ngày tại SYS-01, các màn đọc cấu hình.
- K-09: điều khoản theo từng HĐ, phụ lục và gia hạn có căn cứ, HĐ cũ/mới nối tiếp qua phiếu chuyển cọc.
- Thông tin liên hệ chỉ ghi lịch sử khi sửa SĐT/địa chỉ; các thay đổi khác ghi audit chung.
- K-07 chỉ là ghi chú demo, chưa dựng danh sách khi chưa có định nghĩa.

## 2. Đã hoàn tất trong lượt tiếp nối

| Việc | Kết quả / bằng chứng |
| --- | --- |
| Xác minh defaultTxn | Regex đúng /\D/g; mã CK-20261020-261001 hiển thị và xác nhận thực chi được |
| Schema 8 → 9 | js/data.js tăng TH.DATA_SCHEMA=9; kiểm thử lưu schema 8 có marker rồi reload tự nạp seed 19 HĐ |
| QA nghiệp vụ | **23 kiểm tra tự động đạt** trong [kịch bản Playwright](../tools/qa-cus.playwright.js); [kết quả JSON](qa/schema9/results.json) |
| Smoke test | **928 lượt · 0 lỗi**; 44 route, 94 biến thể, 22 dialog, 46 tab |
| Hoàn cọc DD-302 | Admin lập, Kế toán duyệt chưa ghi sổ; thực chi 3.990.000 ghi một refund; xác nhận lần hai không ghi trùng |
| Báo cáo | Tổng kỳ 10 LNR 48.255.000 → 44.265.000; Kinh doanh giữ 4.755.000 |
| Hoàn một phần | Tình huống TX-202 độc lập giữ 1.000.000/4.000.000, duyệt hoàn 3.000.000 được; seed không thay đổi |
| Phí / xe / gia hạn | Nước DD-102 kỳ 11 = 240.000 cho 2 người; hóa đơn cũ không đổi; pending chưa tính; trùng khoảng bị chặn; P302 không mặc nhiên gia hạn; KH-003 hai HĐ nối tiếp |
| Cấu hình / quyền | 35 → 45 ngày: 2 → 3 HĐ, đặt lại 35; QL tòa mở cọc CG được, không có nút duyệt/thực chi, DD ngoài scope bị chặn |
| Lịch sử liên hệ | Sửa nghề không thêm lịch sử; sửa SĐT thêm đúng một dòng |
| Bố cục | CUS-01, CUS-02 lưu trú/hợp đồng/tài chính, SYS-01 ở 1440px và 375px không tràn ngang; lưu [10 ảnh](qa/schema9/) |
| Tài liệu | README cập nhật schema v9, TPVH, luồng cọc, cấu hình, demo 6c; Decision log §9.5; QA §8.3 và bảng QA-CUS-01…17 |
| Dọn dẹp | Dừng server kiểm thử cổng 8779; xóa .playwright-mcp sau khi giữ ảnh/bằng chứng trong docs/qa/schema9 |

Số liệu hồi quy seed giữ nguyên: LNR Kinh doanh kỳ 09 **16.937.599**, Tổng kỳ 09 **7.537.599**, Kinh doanh kỳ 10 **4.755.000**, HS CG kỳ 09 **72,3%**, INV-2610-CG202 **6.069.800**.

Chi tiết phạm vi và giới hạn kiểm thử: [QA §8.3](TIMEHOUSE_MOCKUP_QA.md#83-chạy-lại-cr_cus_answers-schema-9--20102026). Kết quả PASS chỉ áp cho hành vi mockup đã kiểm; không thay cho khách ký duyệt nguồn hay chính sách.

## 3. Còn thiếu / cần đầu vào tiếp theo

Các mục này đã được ghi nhận là chưa triển khai từ bản bàn giao trước, không gộp vào kết quả hoàn tất checklist tiếp nối:

- **Prorate theo ngày hiệu lực:** hiện chỉ hiệu lực từ kỳ; cần quy tắc chia ngày và ví dụ số trước khi tính.
- **Override cảnh báo theo nhóm tòa:** hiện chỉ cấu hình doanh nghiệp; chưa có mô hình ưu tiên/nhóm và quyền sửa được chốt.
- **Vòng đời HĐ đầy đủ:** hiện Nháp / Đang thuê / Đã kết thúc + nhãn; chưa có Chờ hiệu lực / Đang kết thúc / Đã hủy và bảng chuyển trạng thái.
- **customerAuditLog riêng:** hiện audit chung TH.log + customerHistory cho SĐT/địa chỉ.
- **Persona không có vehicle.view trong CUS-02:** code có nhánh mask, nhưng mọi vai trò được mở màn hiện đều có quyền; chưa có vai trò giới hạn chi tiết để kiểm thử.
- **K-07 “danh sách khách hoà”: BLOCKED_BY_REQUIREMENT**, cần định nghĩa tên, tiêu chí, quyền, trường, nguồn và tác động tài chính.
- **QA-CUS-15:** chưa có khách ký xác nhận nguồn; các mục SOURCE_REQUIRED / PENDING_APPROVAL giữ nguyên.
- **Ngoài phạm vi HTML:** phân quyền backend/ma trận quyền cọc thật; Excel giá gói; SRS v2.3; Figma 88 frame; in/PDF, accessibility và Firefox/Safari.

Không tự áp SLA hoàn 10 ngày, mất toàn bộ cọc, gia hạn mặc nhiên hoặc đơn giá của một mẫu HĐ lên toàn hệ thống. Xem trạng thái từng K-01…K-09 tại [Decision log §9.5](TIMEHOUSE_MOCKUP_DECISIONS.md#95-áp-dụng-cr_cus_answers-20102026-schema-9).
