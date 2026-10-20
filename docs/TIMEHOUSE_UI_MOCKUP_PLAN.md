# TIMEHOUSE — Kế hoạch mockup HTML/CSS/JS

Ngày lập: 20/10/2026. Trạng thái: kế hoạch triển khai, chưa dựng giao diện.

## 1. Mục tiêu và căn cứ

Tạo bản demo tĩnh có tương tác để trình bày cho khách: giao diện chỉn chu như một sản phẩm hoàn chỉnh, chuyển màn nhanh, có dữ liệu mẫu và luồng thao tác rõ ràng. Dùng HTML, CSS và JavaScript thuần để dễ mở, chỉnh và đưa lên static hosting.

Đã đọc hai tài liệu trong `docs/`:

- `TIMEHOUSE_HANDOFF_UI_MOCKUP_PREVIEW_4_GOI.md`: thứ tự ưu tiên, thiết kế và điều kiện bàn giao.
- `TIMEHOUSE_SRS_GOI_D_v1_1_CAU_HINH_XEM_GOI_A_B_C_D.md`: §2 quy tắc UI/package; §4 field, action và notes của 39 màn; §5A ma trận F001–F052; §6 luồng demo; §7 các điểm OPEN; §8 nghiệm thu.

Hiện workspace chỉ có hai tài liệu Markdown. Excel báo giá, SRS v2.3, mẫu chứng từ và ảnh cũ được dẫn chiếu chưa có trong workspace. Triển khai mockup theo §4 và §5A hiện có; giữ các điểm khác biệt/chưa chốt trong decision log để đối chiếu Excel trước khi chốt phạm vi thương mại.

## 2. Hướng trải nghiệm đề xuất

Một trang giới thiệu ngắn mang phong cách landing page dẫn vào ứng dụng demo. Phần giới thiệu dùng typography lớn, khoảng trắng thoáng, hình xem trước UI và bốn thẻ gói. Nút chính `Khám phá bản demo` mở báo cáo tổng quan `RPT-01` ở gói D. Nút trên mỗi thẻ gói mở demo với đúng gói tương ứng.

Phần demo giữ cấu trúc quản trị đúng tài liệu: sidebar phân hệ, topbar chọn tòa/kỳ và gói, khu vực nội dung chuyên biệt cho từng tác vụ. Dùng `RPT-01` làm điểm vào tổng quan để các chỉ số có nguồn từ màn báo cáo đã định nghĩa.

Trang giới thiệu là đề xuất trình bày bổ sung ngoài 39 màn nghiệp vụ. `DEMO-PKG-01` là drawer demo riêng theo handoff. Khi hoàn thiện toàn bộ: 39 màn/luồng nghiệp vụ + 1 surface cấu hình demo + 1 trang giới thiệu đề xuất; nhiều luồng phụ được thể hiện bằng modal/drawer thay vì ép thành trang độc lập.

## 3. Thiết kế và độ mượt

| Thành phần | Hướng thực hiện |
|---|---|
| Khung desktop | Chuẩn tham chiếu 1440px; sidebar 264px; topbar 64px |
| Màu | Teal `#0F766E`; nền `#F8FAFC`; card `#FFFFFF`; viền `#E2E8F0` |
| Typography | Inter có dấu tiếng Việt, lưu font local khi có asset; font hệ thống dự phòng |
| Khoảng cách | Grid 8px, radius 12px; bóng nhẹ, phân cấp bằng khoảng cách và chữ |
| Nội dung | Tiếng Việt nhất quán; tiền định dạng VND; số liệu căn phải và dùng chữ số cùng độ rộng |
| Bảng dữ liệu | Header rõ, bộ lọc gọn, sticky header, phân trang, hover và selection có chủ đích |
| Tương tác | Hover/focus 120–180ms; drawer/modal 180–240ms; chuyển nội dung nhẹ |
| Chuyển động | Ưu tiên opacity/transform, hỗ trợ `prefers-reduced-motion`, không chèn thời gian chờ vào điều hướng |
| Responsive | Landing phù hợp điện thoại; demo ưu tiên desktop/tablet; bảng cuộn ngang trong vùng nội dung khi hẹp |
| Khả năng sử dụng | Focus rõ, thao tác bàn phím, Escape đóng popup, focus quay về nút mở, nhãn cho input |

Một màn tập trung một tác vụ. List, detail, form, preview và audit được phân tách qua điều hướng hoặc panel theo Screen Contract. Các biểu đồ dùng SVG/CSS và bám đúng mức gói được phép.

## 4. Quy tắc gói bắt buộc

| Gói | Khoảng giá | Ý nghĩa trình diễn |
|---|---|---|
| A | 50–60 triệu | Đủ 39 màn/52 nhóm ở mức cơ bản |
| B | 70–80 triệu | A + các nâng cấp B theo từng dòng §5A |
| C | 80–90 triệu | A + B + các nâng cấp C theo từng dòng §5A |
| D | 90–100 triệu | A + B + C + các nâng cấp D theo từng dòng §5A |

- Một master UI gói D; thay gói bằng state chung, cập nhật ngay trên màn đang xem.
- A vẫn có import mẫu, OCR có người xác nhận, điện nước, hóa đơn, công nợ, xác nhận thu cơ bản, Zalo đủ điều kiện, hiệu suất, lương/cổ phần nháp và báo cáo cơ bản.
- Khóa đúng từng phần nâng cấp: action, cột, tab hoặc section. Phần lõi A vẫn sử dụng được.
- Drawer 320–380px có bốn lựa chọn gói, giá, mô tả, toggle hiện khóa mặc định bật và nút xem toàn bộ D.
- `So sánh 52 chức năng` mở bảng rộng có tìm kiếm/lọc phân hệ; tránh nhét bốn cột nội dung dài vào drawer hẹp.
- Mỗi increment có `featureId`, `tier`, nhãn và nguồn. Ví dụ F012.A là OCR mẫu cơ bản; F012.B là thêm mẫu/map phí; F012.C là so khớp; F012.D là mẫu đã duyệt/log sửa.
- `minPackage` áp dụng cho từng increment. Mỗi nhóm F001–F052 luôn có phần lõi A.
- Gate gói, quyền vai trò và trạng thái dữ liệu/nghiệp vụ được tính riêng. Xác nhận thu cơ bản đã có ở A; chỉ các kiểm soát nâng cao tương ứng mới thuộc B/C/D.
- Mặc định D khi mở lần đầu. Thứ tự lấy gói: query hợp lệ `previewPackage` → lựa chọn đã lưu → D. Sau khi chọn, cập nhật cả URL và storage để refresh không quay về query cũ.
- Đổi gói giữ bộ lọc, scope tòa và dữ liệu đã nhập. Nếu panel nâng cao không còn khả dụng, lưu nháp trước khi đóng/chuyển về tab cơ bản; có xác nhận khi cần xử lý dữ liệu chưa lưu.
- Gói D vẫn hiển thị `DRAFT / CHỜ DUYỆT` cho provider/chính sách đang OPEN.

## 5. Cấu trúc kỹ thuật gọn

```text
index.html                  # Trang giới thiệu + mount ứng dụng demo
assets/
  fonts/                    # Font local nếu có
  icons/                    # SVG đồng bộ
css/
  tokens.css                # Màu, spacing, type, motion
  components.css            # Button, table, badge, dialog, drawer
  layouts.css               # Landing, app shell, responsive
js/
  data.js                   # Dataset mẫu và liên kết thực thể
  features.js               # 52 nhóm chức năng, increment A/B/C/D, source_ref
  screens.js                # Registry 39 Screen ID, field/action/notes
  store.js                  # Package, scope, bộ lọc, form nháp, lưu local
  router.js                 # Điều hướng hash và deep link
  components.js             # Render component dùng chung
  views/                    # Các màn theo phân hệ
  app.js                    # Khởi tạo và gắn sự kiện
README.md                   # Mở demo, reset dữ liệu, kịch bản trình bày
docs/
  TIMEHOUSE_UI_MOCKUP_PLAN.md
  TIMEHOUSE_MOCKUP_DECISIONS.md
  TIMEHOUSE_MOCKUP_QA.md
```

Script local dùng `defer`, dữ liệu nằm trong JavaScript, hạn chế phụ thuộc CDN và không cần build. Route hash như `?previewPackage=B#/demo/invoices` để static hosting mở trực tiếp được. Kiểm tra chế độ mở `index.html` và chế độ local server; storage có fallback trong bộ nhớ khi trình duyệt hạn chế `file://`.

Render giữ app shell ổn định; cập nhật vùng nội dung/tính năng cần đổi, giữ focus và vị trí cuộn phù hợp. Event delegation cho bảng và danh sách; debounce tìm kiếm khi cần. Giá trị nhập được đưa vào DOM bằng text/thuộc tính phù hợp.

## 6. Dữ liệu và mức tương tác

Một dataset chung gồm chủ nhà → tòa → phòng → khách → hợp đồng → chỉ số → hóa đơn → thu/chi → lương/cổ phần/báo cáo. Tổng hợp lấy từ cùng nguồn; không gõ các KPI rời dễ lệch số.

Chuẩn bị 2–3 tòa mẫu, khoảng 15–20 phòng để đủ tình huống: còn nợ, thu nhiều lần, chờ xác nhận, hợp đồng sắp hết hạn và chỉ số cần kiểm tra. Đây là quy mô dữ liệu đề xuất cho demo. Định danh dùng dữ liệu giả, giấy tờ được mask.

- Tìm kiếm, lọc, phân trang, mở chi tiết, nhập/sửa nháp và tính tổng minh họa hoạt động trong trình duyệt.
- Action nguồn như thêm, xem trước, xác nhận có màn đích/modal/feedback phù hợp. Thao tác xác nhận chỉ cập nhật dataset demo khi vai trò giả lập cho phép; thay gói không phát sinh thay đổi nghiệp vụ.
- Import/OCR dùng bộ file và kết quả mẫu có ghi rõ mô phỏng; cho soát/sửa/xác nhận field theo gói. Import cơ bản A vẫn có mẫu cố định và lỗi dòng.
- Zalo thể hiện nội dung mẫu, điều kiện và lịch sử mô phỏng. Trạng thái chưa chốt provider được gắn DRAFT.
- Xuất báo cáo có feedback rõ. Nếu tạo file thì đúng định dạng được ghi trên nút; PDF nội bộ có thể dùng print stylesheet để lưu PDF. Xuất Excel thuộc luồng cần demo sẽ tạo XLSX mẫu đúng dữ liệu; CSV là lựa chọn riêng có nhãn CSV.
- Có `Khôi phục dữ liệu demo` với xác nhận. Lưu schema version cho state để cập nhật dataset không làm hỏng bản demo cũ.

## 7. Thứ tự triển khai và mốc bàn giao

### P0 — Khóa nền tảng và mapping

1. Tạo screen registry đủ 39 ID từ §4 và feature registry đủ F001–F052 từ §5A; lưu nguồn tới section/screen tương ứng.
2. Tạo decision log cho các điểm OPEN và khác biệt giữa note cấp màn với increment cấp chức năng. Bám §5A cho gate chi tiết; ghi rõ chỗ chưa thể xác minh do thiếu Excel.
3. Dựng token, typography, component mẫu, app shell, routing, store và dataset.

Đầu ra: khung demo mở được, menu có cấu trúc rõ, mapping có thể kiểm đếm; các mục chưa hoàn thiện được đánh dấu trong bản làm việc.

### P1 — Hoàn thiện chuyển gói trước

Dựng `DEMO-PKG-01`, bảng so sánh 52 dòng, locked/hidden state, tooltip, URL và persistence. Gắn vào topbar trên cả trang và các luồng phụ; giữ thao tác mở cấu hình khả dụng khi đang review OCR/form.

Đầu ra: có thể đổi A→B→C→D trên cùng màn mẫu, giữ state, đóng drawer, đổi màn và refresh.

### P2 — Bản demo ưu tiên: 8 màn + cấu hình gói

| Thứ tự | Screen ID | Nội dung chính | Nhóm gate đối chiếu |
|---|---|---|---|
| 1 | RPT-01 | Tổng quan thu, nợ, chi, lãi dòng tiền tạm tính theo tòa/kỳ; mở dữ liệu nguồn | F045–F049 |
| 2 | OWN-01 | Chủ nhà, tìm/lọc, thêm, import mẫu và preview nâng cao | F001–F003 |
| 3 | OCR-CON | PDF mẫu cạnh field; soát và xác nhận; mức confidence/đối chiếu/audit theo nguồn | F010–F013, trọng tâm F012 |
| 4 | METER-01 | Bảng số cũ/mới, lượng dùng, đơn giá; nhập nháp và đối chiếu | F018–F021 |
| 5 | INV-01 | Chọn tòa/kỳ, sinh nháp, bổ sung phí, xem trước và xác nhận | F022–F025; dữ liệu chỉ số theo F018–F021 |
| 6 | PAY-02 | Công nợ, thu thực, mốc 5/10/15 và hiệu suất; mở nguồn phiếu thu | F029–F033 |
| 7 | SAL-01 | Cố định/phụ cấp/hiệu suất/điều chỉnh, tổng lương nháp | F039–F041 |
| 8 | SHARE-01 | Vốn/tỷ lệ, lãi phân bổ nháp, các mức kiểm soát và snapshot | F042–F044 |

Làm các form/modal hỗ trợ tối thiểu để action chính có phản hồi đầy đủ. OCR-CON giữ hình thức luồng phụ; không ép thành một màn danh sách. Các shortcut tới phần chưa hoàn thiện cần có preview rõ hoặc hoàn thiện màn đích trước buổi demo.

Đầu ra: 8 màn được polish đồng đều, đủ 32 tổ hợp màn × gói, dùng cùng dữ liệu. Đây là mốc demo đầu tiên, chưa tính là hoàn thành bộ 39 màn.

### P3 — Mở rộng đủ 39 màn/luồng

| Phân hệ | Screen ID cần có trong bản đầy đủ |
|---|---|
| Hệ thống | AUTH-01, SYS-01 |
| Chủ nhà | OWN-01, OWN-02, OWN-IMP |
| Tòa nhà | BLD-01, BLD-02, BLD-IMP |
| Phòng | ROOM-01, ROOM-02, ROOM-IMP |
| Khách thuê | CUS-01, CUS-02, OCR-CUS |
| Hợp đồng | CON-01, CON-02, CON-03, OCR-CON, CON-FOLLOW |
| Điện nước | METER-01 |
| Hóa đơn | INV-01, INV-02, INV-03, INV-PREV |
| Zalo | OA-01, OA-02 |
| Thu tiền | PAY-01, PAY-02, PAY-APP |
| Chi phí | EXP-01 |
| Nhân sự | HR-01, HR-ASSIGN |
| Lương | SAL-01, SAL-ADJ |
| Cổ phần | SHARE-01, SHARE-RESULT |
| Báo cáo | RPT-01, RPT-02, RPT-03 |

Tái sử dụng mẫu list/detail/form/import/review. Mỗi màn vẫn có đúng field, action và notes riêng từ §4. Hoàn thiện luồng liên kết hóa đơn → báo thu → xác nhận → công nợ → báo cáo.

Đầu ra: đầy đủ 39 màn/luồng có thể điều hướng và thao tác demo theo phạm vi tài liệu.

### P4 — Trang giới thiệu, polish và bàn giao

Hoàn thiện landing mở đầu sau khi có UI thật để dùng làm preview: tên TIMEHOUSE, lợi ích theo tài liệu, xem trước giao diện, tóm tắt phân hệ, bốn thẻ giá và CTA vào demo. Chuẩn bị sớm skeleton landing nếu cần đồng bộ phong cách với app shell.

Rà responsive, cỡ chữ, bảng dài, motion, focus, trạng thái và số liệu. Đóng gói source tĩnh, README, checklist QA và kịch bản demo. Có thể đưa cùng bộ source lên static hosting để gửi khách khi cần.

## 8. Kịch bản trình bày khoảng 5–7 phút

1. Mở landing → chọn xem demo D → RPT-01 có dữ liệu mẫu.
2. Mở cấu hình → A → thấy nghiệp vụ cơ bản và các increment nâng cao khóa riêng.
3. Vào chủ nhà, xem import mẫu A → chọn B và mở preview nâng cao.
4. Mở OCR-CON → soát/sửa field mẫu, xem thay đổi theo gói; bản nháp được giữ.
5. Nhập điện nước → lập nháp hóa đơn → xem trước tổng tiền.
6. Mở công nợ và nguồn thu: phân biệt báo đã thu với thực thu đã xác nhận; chọn C xem các kiểm soát bổ sung.
7. Chọn D → xem truy vết/đối chiếu tương ứng; mở lương/cổ phần với nhãn dự thảo nếu chính sách đang OPEN.
8. Quay báo cáo, refresh để thấy gói D được giữ; mở so sánh 52 chức năng khi khách hỏi chi tiết.

## 9. Điều kiện hoàn thành

- Giá A/B/C/D chính xác ở mọi vị trí.
- Tất cả 39 màn giữ lõi A; 52 nhóm có đủ increment và nguồn, không khóa nhầm cả phân hệ.
- 8 màn ưu tiên qua đủ 4 mode; khóa/ẩn, action và tooltip khớp §5A và note cấp màn đã được đối chiếu.
- Đổi gói, điều hướng, Back/Forward và refresh giữ package state; field nháp không mất khi đổi gói.
- Link gửi khách mở đúng màn/gói; query sai có fallback hợp lệ; `Xem toàn bộ gói` đưa về D.
- Có Loading, Empty, Error, Forbidden, Draft/Chờ xác nhận/Đã xác nhận và Success; điều khiển trạng thái thử nghiệm đặt trong công cụ demo phù hợp.
- Vai trò giả lập không đổi khi đổi gói; người báo thu không tự duyệt nếu vai trò không có quyền. Gate gói và 403 hiển thị khác nhau.
- Số tiền hóa đơn/đã thu/còn nợ khớp; lãi dòng tiền tạm tính, lương và cổ phần có nguồn và nhãn đúng.
- Mỗi action chính có đích/feedback; không còn nút bấm im lặng hoặc link hỏng trong luồng trình bày.
- Không gọi provider thật; các vùng mô phỏng và các chính sách OPEN hiển thị nhãn tương ứng; demo có dấu DESIGN DRAFT và dữ liệu minh họa.
- Kiểm tra giao diện ở 1440px, 1280px và tablet; landing kiểm tra thêm điện thoại. Demo điện thoại được xử lý bố cục tối thiểu, thiết kế app mobile riêng nằm ngoài kế hoạch này.
- Kiểm tra console và asset khi mở local/server; chạy kịch bản xuyên màn một lần bằng dataset đã reset và một lần với dữ liệu nháp đang nhập.

Ưu tiên thực hiện: P0 → P1 → P2 để có bản demo khách xem sớm; P3 và P4 hoàn thành phạm vi đầy đủ. Thời lượng cụ thể chốt sau khi khóa mức chi tiết của form phụ và định dạng file xuất cần trình diễn.
