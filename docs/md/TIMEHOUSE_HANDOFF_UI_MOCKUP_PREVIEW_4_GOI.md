# TIMEHOUSE — HANDOFF MOCKUP CHUYỂN GÓI A/B/C/D

**Nguồn:** `TIMEHOUSE_SRS_GOI_D_v1_1_CAU_HINH_XEM_GOI_A_B_C_D.md` (bản SRS chính, đầy đủ 39 màn + 52 chức năng).

## Yêu cầu không được thay đổi

- **Giá:** A 50–60 triệu; B 70–80 triệu; C 80–90 triệu; D 90–100 triệu. Nếu hiển thị khác => reject.
- **Một master UI gói D**, có global `Cấu hình hiển thị gói` trên header của tất cả màn. `DEMO-PKG-01` là UX PROPOSED chỉ cho prototype, không nằm trong 39 màn production.
- **Gói A đã có tất cả 39 màn/52 nhóm ở mức cơ bản**, bao gồm nhập tay/Excel mẫu, OCR có người xác nhận, nhập điện nước, hóa đơn, công nợ, Zalo đủ điều kiện, hiệu suất, lương nháp, cổ phần nháp và báo cáo sơ bộ. B/C/D chỉ thêm mức nâng cao theo từng dòng Excel.
- Chuyển A/B/C/D = đổi `featureMode`, không đổi role, scope quyền/backend hoặc dữ liệu; trạng thái khoá gói khác trạng thái 403; chỉ có thể đổi **thực sự** trong prototype tương tác (web/Figma prototype), không thể chỉ bằng hình PNG tĩnh.
- Bản D chứa toàn bộ chức năng trong phạm vi thương mại, nhưng chức năng provider hoặc business policy đang mở vẫn phải có `DRAFT / CHỜ DUYỆT`, không hiển thị là LIVE.

## Luồng demo mẫu

`Dashboard D` → mở Settings → chọn A → nhìn thấy action cơ bản, badge nâng cấp B/C/D → chọn B → import preview/OCR nâng hơn → chọn C → xem duyệt thu/chi → chọn D → xem audit, báo cáo nâng cao → quay màn gốc vẫn giữ D.

## Màn phải làm trước khi mở rộng

`DEMO-PKG-01`, `OWN-01`, `OCR-CON`, `METER-01`, `INV-01`, `PAY-02`, `SAL-01`, `SHARE-01`, `RPT-01`.

## Thiết kế

Desktop 1440, sidebar 264, topbar 64, Inter, primary blue #2563EB, sidebar navy #0F2A5F, topbar trắng, nền #F5F7FA, card trắng #FFFFFF, viền #E6EAF0 (CR-UI-THEME), grid 8px; 1 screen = 1 tác vụ chính, không nhồi tất cả tab. Mockup chỉ dùng dữ liệu minh họa.

## Hình ảnh không thay được logic

Các ảnh ImageGen đã có chỉ là visual reference. Muốn dùng dropdown chuyển A/B/C/D **thật**, cần prototype tương tác (Codex FE hoặc Figma interactive components/variants) và implement mapping 52 function của §5A. Không được nhận ảnh tĩnh là sản phẩm đã có setting hoạt động.

## Nghiệm thu

4 trạng thái trên mỗi màn mẫu nêu trên, cùng UI shell, giá chính xác, note và action chính xác theo SRS; mỗi lần đổi gói không mất thông tin đã nhập trong prototype; quyền vai trò và xác nhận nghiệp vụ tách biệt gói demo. Bộ 39 màn còn lại phải gắn đúng note ở từng screen của SRS.
