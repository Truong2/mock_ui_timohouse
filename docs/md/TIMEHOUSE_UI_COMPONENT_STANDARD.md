# TIMEHOUSE — Chuẩn component và pattern enterprise

**Ngày:** 23/10/2026 · **CR-UI-COMP** · schema dữ liệu **12**, không migration.

Tài liệu này bổ sung CR-UI-ENT, thay mô tả “Framed sheet” và cách gom hành động sau render trong các ghi chép cũ. Áp dụng cho 39 màn SRS + 3 màn CR, các dialog/drawer và luồng báo cáo. Giữ HTML/CSS/JS thuần, Inter local, teal và các quy tắc nghiệp vụ hiện tại.

**CR-UI-THEME (29/10/2026):** áp template **B “Enterprise Navy”** theo tone TimoHouse, chọn sau khi xem 4 phương án (A Timo Classic, B Enterprise Navy, C Navy Header, D Light Calm). Giữ nguyên bố cục, mật độ, bo góc 8px và quy tắc nghiệp vụ; chỉ đổi token màu và shell. KPI trắng có vạch trái 3px theo `--kpi-accent` (mặc định primary, đỏ khi giá trị âm/quá hạn); tiêu đề trang và số KPI màu `--title` navy. Mọi màu chỉ khai báo trong `css/tokens.css`; dark mode sau này thêm bằng `:root[data-theme]` trên cùng bộ token. Bản in hóa đơn/hợp đồng dùng `--doc-accent` cố định. Ảnh: `docs/qa/ui-theme/`. Kiểm: UI-STD-02 (primary blue), UI-ENT-01/06 (topbar theo `--header-bg`), UI-THEME-01 (sidebar navy, tương phản ≥ 4.5:1).

**CR-PKG-OPS (24/10/2026):** phân tầng theo [ma trận hiệu lực](TIMEHOUSE_PACKAGE_FUNCTION_MATRIX.md). A thao tác từng hồ sơ/chứng từ; B nhập Excel và hàng loạt; C kiểm soát nâng cao; D quản trị kỳ. Khóa gói hiển thị lý do và kiểm tra lại ở handler/dialog; không thay quyền vai trò. Các ô tiền báo cáo A vẫn hiển thị đầy đủ, chỉ phần mở nguồn cần B. Quy tắc tính tiền và kiểm dữ liệu bắt buộc không bị khóa theo gói. Nhãn khóa được xuống dòng trong vùng chứa; menu bàn phím giữ focus, không tự đóng vì sự kiện cuộn đã chờ trước lúc mở.

## 1. Nền tảng và mẫu trang

| Thành phần | Chuẩn | Nguồn triển khai |
| --- | --- | --- |
| Token | Primary blue `#2563EB` (thang `--primary-25…950`, navy `#0F2A5F`); info tách sang sky `#0369A1`; semantic tone; spacing 4/8px; control desktop 32px; hàng một dòng 40px; vùng bấm mobile ≥44px; card/dialog bo 8px | `css/tokens.css` |
| Shell | Topbar trắng toàn ngang; cột thương hiệu + sidebar navy phẳng (token `--sider-*`), mục đang chọn nền primary chữ trắng; sidebar 232/72px; breakpoint mobile 1080px. Base, responsive, print shell và biến thể enterprise cùng một stylesheet | `css/navigation.css` |
| Danh sách | Breadcrumb/tiêu đề/thao tác → điều hướng phân hệ → tổng quan → lọc → bảng/hồ sơ mobile → phân trang | `TH.pageHeader`, `TH.table`, `TH.pager` |
| Hồ sơ | Điều hướng phân hệ → breadcrumb/tiêu đề/facts → tab đối tượng → panel. DOM có cùng thứ tự với hình ảnh, không dùng CSS order để đảo các khối trang | `TH.detailFacts`, `TH.tabs`, `TH.tabPanel` |
| Luồng nhiều bước | OCR/import giữ workspace rà soát; báo cáo phân biệt tạo mới, xem trước và bản lưu; bước tiếp theo theo đúng trạng thái/quyền hiện có | Workspace hiện có + component chung |
| Bảng | Cột `kind: money/date/status/identity/actions` hỗ trợ ngữ nghĩa; tiền căn phải theo `num`; mã/ngày không gãy; giải thích dài được wrap. Bảng rộng cuộn nội bộ | `TH.table` |
| Mobile | Hồ sơ mở “Thông tin khác” từ cùng ô bảng, không clone input. Hành động chính nằm trong khung; thanh thao tác xuống hàng theo cùng thứ tự DOM | `table-records`, `.page-actions` |
| Cột phụ | Dữ liệu tóm tắt dùng descriptions/list; khoản khấu trừ có số tiền và nguồn riêng, tránh nhét bảng rộng vào thẻ cọc 360px | `.kv`, `.deduction-list` |

`layouts.css` giữ layout nội dung, tài liệu, OCR, biểu đồ và landing; `components.css` sở hữu component; `navigation.css` sở hữu shell/responsive. Các token menu, dialog, lớp nổi và padding card dùng chung.

## 2. Hợp đồng component

### Nhóm hành động

`TH.pageHeader({ actions: [...] })` nhận danh sách khai báo; `TH.actionGroup({ context: 'page' | 'row', items })` cũng dùng độc lập. Mỗi item hỗ trợ `label`, `icon`, `act`, `href`, `dataset`, `primary`, `priority`, `danger`, `permission`, `gate`, `visible`, `disabled`, `disabledReason`.

```js
actions: [
  { label: 'Tiến độ thu', href: TH.router.href('PAY-02') },
  { label: 'Ghi nhận thu', act: 'pay.report', primary: true,
    permission: 'receipt.report', icon: 'handCoins' }
]
```

- Trang giữ tối đa một nút primary và hai nút phụ; hành động dư vào “Thêm”. Dòng bảng giữ một hành động trực tiếp và menu bổ sung.
- Ưu tiên tính từ `priority` khai báo, registry action nghiệp vụ và ý nghĩa primary hiện có; không suy từ thứ tự nút hoặc từ nhãn tiếng Việt. Duyệt cọc/thực chi/xác nhận được ưu tiên hơn Xem/Sửa.
- Khóa gói và từ chối quyền có biểu diễn riêng. Disabled giữ lý do qua tooltip/aria-description. Không cấp thêm quyền hoặc thay handler nghiệp vụ.
- Tương thích chuỗi HTML qua `html` hoặc `actions` dạng chuỗi. Adapter xử lý khi render vào template tách rời; không dịch chuyển nút trên DOM đang tương tác. `TH.prepareView` áp cùng hợp đồng cho bảng viết tay.
- Menu dùng popover top layer khi trình duyệt hỗ trợ; Arrow/Home/End điều hướng, Escape trả focus, chọn item đóng menu ngay trước khi mở form. Modal nhớ nút mở menu để trả focus; khi nguồn đã mất thì về tiêu đề trang.

### Tab và panel

- Dùng cặp `TH.tabs(screen, tabs, current, key)` / `TH.tabPanel(screen, current, html, key)`; `key` mặc định `tab`, các sheet báo cáo dùng key riêng.
- Tab/panel có ID ổn định và liên kết `aria-controls` / `aria-labelledby`. Chỉ một tab tham gia chuỗi Tab; tab khóa có `aria-disabled` và không được chọn.
- Arrow trái/phải và Home/End chỉ chuyển focus. Enter/Space kích hoạt qua handler hiện có và guard Lưu/Bỏ/Tiếp tục nếu còn nháp.
- Các link điều hướng phân hệ là link, không giả làm tab nội dung.

### Form và phản hồi

- `TH.field` liên kết label, hint và lỗi; hỗ trợ required, readonly, disabled cho input/select/textarea. Select readonly dùng disabled để không sửa được; giá trị lưu vẫn lấy từ draft/default hiện có.
- `TH.formErrors` giữ dữ liệu nhập và focus trường lỗi đầu tiên sau rerender. Tóm tắt nhiều lỗi có link focus từng trường; render tự động cho form trong trang và modal.
- Section sửa inline kiểm tra trường required; validator có thể trả bản đồ `{ field: message }`. Lỗi liên trường dạng chuỗi cũ vẫn hiển thị ở alert có focus, không tự đoán trường sai.
- Lưu/Hủy tại footer section; modal giữ footer thao tác; dialog ngắn và drawer bổ sung dùng cơ chế focus trap hiện có.
- Empty/filtered/error/forbidden/package-locked là các trạng thái riêng. Không biểu diễn lỗi hoặc chờ xử lý như đã hoàn tất.

## 3. Ánh xạ nghiệp vụ

| Miền | Quy tắc giao diện |
| --- | --- |
| Khách/hợp đồng | Lưu/Hủy rõ; trạng thái thuê và nhãn phụ theo hồ sơ hợp đồng; không gộp phá hợp đồng với mất cọc |
| OCR/import | Tải nguồn → rà soát/sửa → xác nhận; ghi rõ mô phỏng; chưa xác nhận không ghi nghiệp vụ |
| Hóa đơn | Nháp khác đã xác nhận; hóa đơn cũ không tính lại vì thay giao diện |
| Phiếu thu | Quản lý tòa xác nhận; kế toán hậu kiểm; thu, công nợ và đối soát là các khái niệm riêng |
| Cọc | Bàn giao → đối chiếu → gửi duyệt → người khác duyệt → thực chi; trước thực chi chưa ghi refund; chống ghi trùng |
| Chi phí | Nháp/chờ duyệt/đã duyệt/từ chối lấy từ miền `expense` |
| Báo cáo | Xem trước chưa tạo bản lưu; bản lưu giữ phiên bản, truy nguồn, quay về và xuất đúng bản; khóa kỳ không đổi |

Nhãn/tone lấy từ `TH.STATUS_REG()` / `TH.statusOf`. Bổ sung miền receipt, expense, room, message bên cạnh bill/deposit/adjust/vehicle/doc. Không thêm trạng thái vào dữ liệu nghiệp vụ.

Ngôn ngữ theo glossary; mã kỹ thuật chỉ hiện ở chế độ review. Bộ lọc nhãn bỏ qua `.doc-page`, `.print-doc`, `[data-raw]`, `[data-document]`; sheet báo cáo đánh dấu là tài liệu để giữ nguyên nội dung nguồn.

## 4. Bằng chứng kiểm tra và giới hạn

- [Kết quả JSON](../qa/ui-enterprise/results.json): **205 assertion đạt** từ 9 bộ QA; smoke **1.088 lượt, 0 lỗi**, mapping **156/156**.
- Bộ mới `tools/qa-enterprise-components.playwright.js`: **21 kiểm tra**, quét **1.744 biến thể màn/tab + 432 dialog** = `(109 + 27) × 4 gói × 4 kích thước`; 375/768/1024/1440px. Không tràn ngang trang, mất panel, clone input hoặc giấu nút primary ngoài khung.
- Bộ UI cũ kiểm màu, tương phản, chữ ≥12px, nút icon có tên, menu, lỗi form và kích thước desktop; các bộ OCR/bill/pay/cus/report kiểm nghiệp vụ riêng.
- Quét bảng riêng qua 136 trạng thái ở 1440px/gói D: 0 ô gãy dòng bị cảnh báo; bảng rộng cuộn nội bộ. Đo bổ sung header mobile: nút menu/gói/công cụ/tài khoản đều cao ≥44px, không gây tràn trang.
- Đã kiểm Arrow/Home/End/Enter/Escape/Tab/Shift+Tab, guard nháp, menu mở modal và trả focus; reduced motion. Kiểm reflow 720 CSS px tương đương vùng hiển thị desktop 1440px ở zoom 200%.
- Hồi quy seed: schema 12; LNR Kinh doanh 09 **16.682.599**, Tổng 09 **7.282.599**, Kinh doanh 10 **9.655.000**, Tổng 10 **53.155.000**; INV-2610-CG202 **6.069.800**. Đây là baseline schema 12 hiện tại, không dùng lại số schema 9.
- [Ảnh trước/sau](../qa/ui-enterprise/): danh sách, hồ sơ và tạo báo cáo trên desktop/mobile; ảnh điều hướng sidebar và drawer.

Giới hạn: QA tự động trên Chromium; chưa nghiệm thu Firefox/Safari, screen reader thật, zoom native của từng trình duyệt hoặc bản PDF phân trang. Kết quả kỹ thuật không thay xác nhận chính sách nghiệp vụ, nguồn dữ liệu và phân quyền backend. Dark mode không nằm trong đợt này.

Chạy server `python -m http.server 8779 --bind 127.0.0.1`, sau đó chạy nội dung các file `tools/qa-*.playwright.js` bằng Playwright browser_run_code. Bộ mới xóa cache Chromium bằng CDP để luôn kiểm đúng working tree. Kiểm tĩnh bằng `node tools/lint-ui.js` và `node --check`; không có bước build hoặc CDN mới.
