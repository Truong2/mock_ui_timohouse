# TIMEHOUSE — Bản demo HTML/CSS/JS

Bản demo tĩnh có tương tác cho hệ thống quản lý vận hành tòa nhà cho thuê: **39 màn/luồng nghiệp vụ** theo SRS §4, **52 nhóm chức năng** theo §5A, **2 báo cáo theo mẫu Excel của khách** (`RPT-04` doanh thu theo tòa, `RPT-05` báo cáo kinh doanh tháng — CR-RPT-01), một surface cấu hình gói `DEMO-PKG-01` và một trang giới thiệu. Toàn bộ chạy bằng HTML, CSS và JavaScript thuần — không build, không CDN, không gọi dịch vụ thật.

> **DESIGN DRAFT.** Dữ liệu, tên, số điện thoại, giấy tờ và số tiền đều là minh họa. Các chính sách đang OPEN trong Decision Log hiển thị nhãn `DRAFT / CHỜ DUYỆT`.

## Mở demo

| Cách | Thao tác |
| --- | --- |
| Mở trực tiếp | Mở `index.html` bằng trình duyệt (Chrome/Edge/Firefox mới). Font, icon và dữ liệu đều nhúng local nên chạy được ở `file://`; nếu trình duyệt chặn `localStorage`, trạng thái chỉ giữ trong phiên. |
| Local server (khuyên dùng) | `python -m http.server 8080` trong thư mục này rồi mở `http://localhost:8080/`. |
| Static hosting | Đưa nguyên thư mục lên bất kỳ static hosting; mọi route là hash nên không cần rewrite. |

Điểm vào: trang giới thiệu `#/` → `Khám phá bản demo` mở `RPT-01` ở gói D.

## Deep link gửi khách

```
index.html?previewPackage=A#/demo/rpt-01      # mở báo cáo ở gói A
index.html?previewPackage=C#/demo/pay-02      # công nợ & mốc 5/10/15 ở gói C
index.html?previewPackage=D#/demo/ocr-con     # luồng phụ OCR hợp đồng (dialog trên CON-01)
index.html#/demo/inv-03/INV-2610-CG201        # chi tiết một hóa đơn
```

Thứ tự lấy gói: `previewPackage` hợp lệ → lựa chọn đã lưu → **D**. Query sai (ví dụ `=Z`) có thông báo và fallback. Sau khi đổi gói, URL và storage cùng cập nhật nên refresh/Back/Forward giữ đúng gói.

## Cấu trúc

```
index.html              trang giới thiệu + mount ứng dụng
css/                    tokens · components · layouts (responsive, print)
js/
  data.js               dataset mẫu (3 tòa, 18 phòng, 15 HĐ, 6 kỳ, sổ cọc, chi phí chung, HĐ thuê tòa, lịch trả chủ nhà, tài sản) + TH.calc (gồm perfBuilding: hiệu suất A/B/C/D)
  pnl.js                P&L tòa/kỳ theo mẫu báo cáo khách (TH.calc.pnl, chia cổ phần)
  reports-cr.js         CR-RPT-01: thêm RPT-04/05, cập nhật mô tả F045/F046, phần báo cáo của từng gói
  bld-cr.js             CR-BLD-01: cập nhật F001/F003/F004/F006/F013/F033/F036/F047 và ghi chú gói OWN/BLD theo note.md
  features.js           F001–F052 — SINH TỰ ĐỘNG từ SRS §5/§5A
  screens.js            39 Screen ID — SINH TỰ ĐỘNG từ SRS §4
  store.js              gói, vai trò giả lập, scope, bộ lọc, nháp, lưu local (schema v6)
  router.js · app.js    hash router, app shell, event delegation, công cụ demo
  components.js         bảng, badge, gate gói, dialog/drawer, toast, tooltip, chart SVG
  xlsx.js               xuất .xlsx/.csv không phụ thuộc thư viện
  views/                15 phân hệ + landing + package drawer + import/OCR dùng chung (bizreports.js = RPT-04/05, perf.js = hiển thị hiệu suất)
tools/extract-srs.js    node tools/extract-srs.js → sinh lại screens.js/features.js khi SRS đổi
docs/                   plan · decision log · QA checklist
```

## Quy tắc gói (đã cài đặt)

- Một master UI gói D. Mỗi phần nâng cấp gắn `featureId.tier` (ví dụ `F012.B`), gate bằng `TH.gate` / cột bảng / tab. Phần lõi A luôn hiển thị.
- Khóa gói (ghost + nhãn `Có từ gói …`, click mở giải thích và nút *Xem thử*) **khác** 403 vai trò (chip đỏ *Không có quyền*).
- Đổi gói giữ bộ lọc, scope, dữ liệu đã nhập. Nếu panel nâng cao đang có nháp, hỏi xác nhận rồi giữ nháp trong trình duyệt.
- Toggle *Hiện tính năng gói cao hơn dưới dạng khóa* (mặc định BẬT). Tắt thì ẩn phần vượt gói.
- Trang `#/demo/mapping` quét toàn bộ màn và kiểm đếm 156 increment B/C/D đã gắn vào màn nào.

## Báo cáo theo mẫu khách (CR-RPT-01)

| Màn | Mẫu | Gói A | B | C | D |
| --- | --- | --- | --- | --- | --- |
| `RPT-04` Doanh thu theo tòa | `docs/G1.31.8.26.xlsx` | Đủ dòng mẫu, 13 tỷ lệ, bảng chia cổ phần, Excel 3 sheet | Bấm dòng → chứng từ; đối chiếu dòng tiền | Snapshot duyệt kỳ; rule phân bổ chi phí chung | 2 kỳ lịch sử; khóa kỳ |
| `RPT-05` Báo cáo kinh doanh tháng | `docs/bao_cao/BÁO CÁO KINH DOANH THÁNG 8.xlsx` | TỔNG + từng tòa; chế độ Kinh doanh / Tổng; Excel theo sheet mẫu | Xu hướng 6 kỳ | Nhóm nhà, so kỳ trước, cảnh báo biên LN | Mẫu có version; khóa kỳ |

Kỳ 10/2026 đang mở (Thanh Xuân chưa lập hóa đơn, tiền thuê nhà chờ duyệt) nên báo cáo hiện cảnh báo và nút *Xem kỳ 09/2026 (đã khóa)*. Quy tắc tính và giả định: Decision log §6.

## Chủ nhà, tòa nhà & mốc 5/10/15 (CR-BLD-01, theo note.md)

- `OWN-01`/`BLD-01` chỉ hiện thông tin tóm tắt; `OWN-02` 4 tab, `BLD-02` 8 tab theo note. Mỗi nhóm thông tin có **Chỉnh sửa / Lưu thay đổi / Hủy**; đổi tab hoặc rời trang khi chưa lưu sẽ hỏi *Lưu / Bỏ thay đổi / Tiếp tục chỉnh sửa*.
- Hợp đồng thuê tòa (giá thuê, cọc, giữ giá, thời hạn, chu kỳ & hạn trả, người giới thiệu ≠ người nhập) dùng chung giữa hồ sơ chủ nhà và hồ sơ tòa.
- Hiệu suất: HS% = [A − A × B + C] ÷ tổng giá niêm yết, xem tạm tính & thực tế ở `BLD-02 › Vận hành & kết quả`, `PAY-02`, `RPT-02` (Excel có sheet *Hieu suat*).
- Xếp gói bám tầng SRS (vd: 3 vai trò phụ là B, sinh lịch trả từ HĐ là B, theo dõi đã trả/quá hạn là C). Chi tiết & giả định chờ chốt: Decision log §7.

## Công cụ demo (nút trượt trên topbar)

- Vai trò giả lập: Admin · Kế toán · Quản lý tòa (chỉ Cầu Giấy, không tự duyệt thu) · Nhân sự (chỉ HR/Lương).
- Trạng thái dữ liệu cho màn đang xem: Đang tải · Không có dữ liệu · Lỗi API. 403 xem bằng cách đổi vai trò.
- Bật/tắt dải ghi chú A/B/C/D cấp màn (SRS §4).
- **Khôi phục dữ liệu demo** (có xác nhận): về dataset gốc, xóa nháp và bộ lọc, giữ gói đang xem.

## Kịch bản trình bày 8–10 phút

1. Landing → *Khám phá bản demo* → `RPT-01` gói D: thu, nợ, chi, lãi dòng tiền tạm tính; nhấn chỉ số để mở nguồn.
2. Topbar *Đang xem: Gói D* → chọn **A**: các card B/C/D chuyển ghost, phần lõi vẫn dùng được.
3. Chủ nhà `OWN-01` → *Import Excel* ở A (báo lỗi dòng) → chọn **B** → preview toàn bộ + tải file lỗi.
4. Hợp đồng → *OCR hợp đồng* (`OCR-CON`): sửa field, đổi gói giữa chừng — bản nháp được giữ; B có độ tin cậy, C có đối chiếu phòng–khách, D có log correction.
5. `METER-01` nhập chỉ số (TX-201 thiếu, TX-102 số lùi, DD-301 đột biến) → `INV-01` chọn Thanh Xuân → *Sinh nháp* → *Xem trước & xác nhận*.
6. `PAY-01` báo thu → đổi vai trò *Quản lý tòa*: không tự duyệt → *Kế toán* xác nhận `PAY-APP` → `PAY-02` công nợ giảm, bảng *Hiệu suất theo tòa* (A/B/C/D, tạm tính & thực tế) cập nhật; chọn **C** xem chống trùng/backdate.
6b. `BLD-02/TH-CG` kỳ 09: tab *Vận hành & kết quả* (các bước A→D, HS 72,3%) → tab *Chủ nhà & hợp đồng* bấm *Chỉnh sửa* giá thuê, đổi tab giữa chừng để thấy hộp thoại lưu/bỏ → tab *Lịch thanh toán* (Đống Đa, Thanh Xuân quá hạn); chuyển **A → B → C** để thấy vai trò nhân sự, sinh lịch từ HĐ, đã trả/còn lại mở dần.
7. Chọn **D** → `SAL-01`, `SHARE-01` với nhãn DRAFT (D-06, D-07) và truy vết.
8. Menu *Báo cáo* → `RPT-04` kỳ 09/2026: đối chiếu với file G1 của khách (cùng thứ tự dòng, tỷ lệ, bảng chia cổ phần); bấm một dòng để mở chứng từ (B+); *Xuất Excel theo mẫu*.
9. `RPT-05`: đổi *Báo cáo kinh doanh* ↔ *Báo cáo tổng* (cọc mới, mua sắm); C gộp theo nhóm nhà; bấm tên tòa để về `RPT-04`. Đổi sang **A** để khách thấy cả hai báo cáo đã có trong gói thấp nhất.
10. Về `RPT-01`, F5 — gói được giữ; mở *So sánh 52 chức năng* (ô có nhãn **CR** là phần cập nhật theo mẫu báo cáo).

## Xuất file

Nút ghi rõ định dạng: `.xlsx` sinh file Excel thật từ dữ liệu đang xem (xlsx.js); `.csv` là lựa chọn riêng; *In / lưu PDF* dùng print stylesheet (hóa đơn nội bộ, báo cáo tòa).
