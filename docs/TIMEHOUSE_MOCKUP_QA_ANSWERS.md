# TIMEHOUSE — TRẢ LỜI VÀ KẾT LUẬN CHECKLIST QA MOCKUP

**Ngày đối chiếu:** 20/10/2026  
**File được trả lời:** `TIMEHOUSE_MOCKUP_QA.md`  
**Nguồn bổ trợ:** `TIMEHOUSE_MOCKUP_DECISIONS.md`, `TIMEHOUSE_MOCKUP_DECISIONS_ANSWERS.md`, tài liệu lương và các hợp đồng/bảng báo cáo trong bộ hồ sơ TIMEHOUSE.  
**Phạm vi trả lời:** xử lý **tất cả các mục** của checklist QA, xác nhận điều có thể giữ lại, chỉ rõ điều **chưa đủ bằng chứng hoặc cần duyệt**, và nêu việc Codex/PM/QA phải làm tiếp.

> **Quan trọng:** File QA là **báo cáo kết quả kiểm thử**, không phải danh sách câu hỏi. Dưới đây là **phản hồi nghiệm thu có điều kiện**, KHÔNG phải xác nhận đã tự mở repo, chạy lại Playwright, kiểm tra Figma hay thử chức năng thật. Trong lượt này không có source code, build chạy hoặc bằng chứng video/screenshot độc lập để kiểm chứng các dấu ✅. Tất cả những gì gọi là "đã đạt" đều có nghĩa **"báo cáo QA gốc ghi đã đạt"**.
>
> **Quy ước trạng thái:** **[GIỮ — THEO BÁO CÁO]** = có thể tiếp tục dùng kết quả tự kiểm trong demo; **[PHẢI KIỂM LẠI]** = cần nghiệm thu độc lập; **[CHỜ NGHIỆP VỤ]** = thiếu quyết định kinh doanh; **[ĐỀ XUẤT]** = giải pháp bổ sung chưa được phê duyệt.

## 0. Kết luận chung để PM/Codex sử dụng

1. **Chấp nhận về mặt tiến độ demo ở trạng thái `TECHNICAL_QA_REPORTED_PASS`**: tài liệu ghi đã kiểm màn hình, điều hướng, gate, các trạng thái, export và một số kết quả tính toán trên Chromium. **Không chuyển thành `PRODUCTION_READY` / `BUSINESS_SIGNED_OFF`.**
2. **Không kết luận mockup đã đủ 88 màn Figma**. Checklist chứng minh theo mô tả của chính nó: **39 màn lõi SRS**, **2 màn CR RPT-04/05** và các tab/popup; đây không phải bằng chứng 88 frame/screen editable trực tiếp trên Figma, Auto Layout, components và variants.
3. **Duy trì nhãn `DRAFT/OPEN/SIMULATED`** cho OCR, Zalo OA, import mô phỏng, lương, hiệu suất và cổ phần cho đến khi được xác nhận bằng quyết định nghiệp vụ.
4. **Không chốt giá bán** A/B/C/D chỉ từ con số 50–60/70–80/80–90/90–100 triệu trong JS/Markdown. QA chỉ báo cáo *đồng nhất hiển thị*, chưa đối chiếu nguồn Excel báo giá.
5. **Điều kiện nghiệm thu tiếp theo:** có source chạy được, test script và log; Excel báo giá 4 gói; chốt R-01…R-09, G-01…G-10, D-03/04/06/07; đối chiếu số báo cáo thật; nghiệm thu tay keyboard/in-PDF/Firefox/Safari.

---

## 1. Trả lời 12 điều kiện hoàn thành (QA §1)

| # | Phản hồi | Việc cần thực hiện trước khi nghiệm thu chính thức |
| --- | --- | --- |
| **1. Giá A/B/C/D** | **[GIỮ — THEO BÁO CÁO]** Đồng bộ giá từ `TH.PACKAGES` là thiết kế đúng, tránh lệch giữa landing/drawer/topbar. **[CHỜ NGHIỆP VỤ]** Không được xem các mức 50–60/70–80/80–90/90–100 triệu là báo giá đã ký. | PM bổ sung **Excel báo giá gốc hoặc biên bản chốt giá**, kiểm từng gói, VAT, hạng mục bao gồm/không bao gồm, và ảnh hưởng CR-RPT-01/CR-BLD-01. |
| **2. 39 màn + 52 nhóm + 156 increment** | **[GIỮ — THEO BÁO CÁO]** Kiểm tra tính nhất quán mapping có ích. **[PHẢI KIỂM LẠI]** Đếm đúng không chứng minh tất cả hành vi nghiệp vụ; cũng không chứng minh **88 màn Figma** đã hoàn thiện. | Xuất bảng RTM `FR → gói → UI-ID → action → role → test case → kết quả`; lập riêng **checklist 88 màn Figma** nếu vẫn là yêu cầu dự án. |
| **3. 8 màn ưu tiên / 4 mode** | **[GIỮ — THEO BÁO CÁO]** Sweep không báo runtime error. Đây là *smoke test*, chưa phải toàn bộ chức năng của từng màn. | Thêm kiểm thử validation, quyền, trạng thái lỗi, dữ liệu biên, lưu/hủy và thay đổi dữ liệu liên màn; lưu bản log build/commit. |
| **4. Đổi gói/route/refresh không mất nháp** | **[GIỮ — THEO BÁO CÁO]** Luồng trong Chromium đạt. **[PHẢI KIỂM LẠI]** `file://` có thể không duy trì localStorage; cần phân biệt khôi phục sau refresh và chỉ giữ state trong phiên. | Thử Chrome/Edge/Firefox/Safari, chế độ riêng tư và môi trường HTTP(S); kiểm popup xác nhận khi bỏ nháp và thứ tự khôi phục form. |
| **5. Deep link và fallback** | **[GIỮ — THEO BÁO CÁO]** Giá trị sai dùng fallback + toast; `Xem toàn bộ gói` về D là hợp lý **cho demo**. | Kiểm mã query lạ, hash sai, gói chưa lưu và copy link trên domain triển khai. `D` là preview đầy đủ, không phải quyền truy cập thật. |
| **6. Đủ các trạng thái UI** | **[GIỮ — THEO BÁO CÁO]** Đã dựng các trạng thái. **[PHẢI KIỂM LẠI]** Trạng thái do công cụ demo bật không chứng minh API thật xử lý đúng. | Với production: test API `loading/error/empty/403`, lỗi mạng/retry, status nghiệp vụ và màn nhập lỗi thực tế. |
| **7. Gate gói khác 403** | **[GIỮ — THEO BÁO CÁO]** Mô hình tách gói và quyền là đúng định hướng. | Quyền phải kiểm **ở BE/API**, không chỉ ẩn button/chip trên FE; thử truy cập link trực tiếp và gọi API của tòa ngoài scope. |
| **8. Hóa đơn/thu/nợ/lãi/lương/cổ phần** | **[GIỮ — THEO BÁO CÁO]** Kịch bản phiếu CG-202 được tính khớp. **[CHỜ NGHIỆP VỤ]** Các công thức **lãi, lương, cổ phần** vẫn `DRAFT` nên chưa thể nghiệm thu là đúng nghiệp vụ. | Lưu test fixture + đối chiếu từng dòng mẫu thật, chứng từ gốc, cọc/hoàn cọc, thu trước kỳ, lương hiệu suất, chi phí thuê chủ nhà và bảng chia cổ phần. |
| **9. Action có handler/feedback** | **[GIỮ — THEO BÁO CÁO]** Không có nút bấm chết là tiêu chuẩn tối thiểu. | Test hành động **có tác dụng đúng** (tạo, sửa, xóa, phân quyền, rollback, tải file, mở record phù hợp), không chỉ có `data-act` handler. |
| **10. Không gọi provider thật** | **[GIỮ — THEO BÁO CÁO]** Mô phỏng OCR/OA/import phải được ghi rõ. | Giữ khóa ngăn gửi thật và nhãn `SIMULATED`; khi nối provider thật, lập QA riêng cho cấu hình, template, log, retry, giới hạn, phí và dữ liệu cá nhân. |
| **11. Responsive 1440/1280/tablet/mobile** | **[GIỮ — THEO BÁO CÁO]** Chụp một số trang ở các kích thước là tín hiệu tốt. | Thử thêm toàn bộ form dài, bảng có nhiều cột, modal 375/390, zoom 200%, font dài và dữ liệu tiếng Việt thực tế. |
| **12. Console, asset local/server, demo end-to-end** | **[GIỮ — THEO BÁO CÁO]** Chromium qua sweep. **[PHẢI KIỂM LẠI]** Không thay thế thử `file://` bị chặn storage/font và in/PDF thực tế. | Đính kèm log CI, commit hash, artifact screenshots, test export/in và checklist trình duyệt. |

### Số liệu kiểm soát QA #8

Theo QA gốc, khi xác nhận phiếu thu `CG-202 = 6.069.800 ₫`:

- **Thực thu:** `42.952.200 + 6.069.800 = 49.022.000 ₫`.
- **Công nợ:** `26.556.400 − 6.069.800 = 20.486.600 ₫`.
- **Chờ xác nhận:** `8.569.800 − 6.069.800 = 2.500.000 ₫`.

Ba phép tính **số học khớp** với QA. Tuy nhiên chưa có sổ chi tiết nguồn để xác nhận tính đúng của khoản thu, kỳ thu, nghiệp vụ phân bổ và quyền duyệt; giữ trạng thái **[CẦN ĐỐI CHIẾU NGHIỆP VỤ]**.

## 2. Trả lời mục chuyển gói DEMO-PKG-01 (QA §2)

| Nội dung | Quyết định trả lời |
| --- | --- |
| Drawer 372 px, 4 lựa chọn, toggle, link | **[GIỮ — THEO BÁO CÁO]** Tiếp tục sử dụng cho bản demo. Cho phép tùy chọn ẩn các tính năng bị khóa để khách xem giao diện sạch. Giá vẫn là `DRAFT` cho đến khi đối chiếu báo giá gốc. |
| So sánh 52 chức năng | **[GIỮ — THEO BÁO CÁO]** 52 dòng là đủ về số lượng theo file QA. **[PHẢI KIỂM LẠI]** Mỗi dòng phải khớp mô tả SRS, gói, gắn route đúng và không mất chức năng lõi A. |
| Escape/focus | **[GIỮ — THEO BÁO CÁO]** Trả focus đúng vị trí là tốt. **[PHẢI KIỂM LẠI]** Tab/focus trap/screen reader, popup lồng nhau, keyboard ở Safari/Firefox. |
| Tắt toggle khóa | **[GIỮ — THEO BÁO CÁO]** Tắt toggle chỉ ẩn ghost/locked UI; **không mở khóa tính năng**, không thay đổi quyền. |
| Hạ gói khi đang ở tab nâng cao | **[GIỮ — THEO BÁO CÁO]** Quay về tab cơ bản + toast; cần đảm bảo **form chưa lưu không bị mất** và có hộp thoại trước khi đổi. |

**Quy tắc bắt buộc:** tính năng theo gói (A/B/C/D), quyền vai trò (`403`) và trạng thái chính sách chưa chốt (`DRAFT`) là **ba thứ độc lập**. Không dùng một badge "Khóa" thay cho cả ba.

## 3. Trả lời 8 bước demo xuyên màn (QA §3)

| Bước | Phản hồi / điều kiện giữ kết quả |
| --- | --- |
| 1. Landing → demo D → RPT-01 | **[GIỮ — THEO BÁO CÁO]** Hiển thị KPI từ cùng nguồn; ghi rõ số **demo** và thời điểm dữ liệu. |
| 2. Xem lõi gói A | **[GIỮ — THEO BÁO CÁO]** A luôn có màn và tác vụ lõi, không khóa cả màn; phần B/C/D phải có lý do/cấp nâng cấp. |
| 3. OWN-01 import A/B | **[GIỮ — THEO BÁO CÁO]** Demo lỗi dòng + xem trước + xuất file lỗi. **[PHẢI KIỂM LẠI]** Kiểm chứng file có dòng dữ liệu, đúng encoding và báo lỗi tương ứng; import production cần validation, chống trùng, rollback. |
| 4. OCR-CON giữ nháp | **[GIỮ — THEO BÁO CÁO]** Dữ liệu sửa tay phải ưu tiên hơn OCR mô phỏng; sau xác nhận sinh HĐ `DRAFT`, không ký thật. |
| 5. METER-01 → INV-01/INV-PREV | **[GIỮ — THEO BÁO CÁO]** Đúng tình huống thiếu chỉ số/số lùi/đột biến và idempotency (không tạo trùng khi chạy lại). **[PHẢI KIỂM LẠI]** Ngoại lệ thay công tơ, phí nước theo người, điện đầu vào/đầu ra và quy tắc chốt kỳ theo hợp đồng. |
| 6. PAY-01 báo thu → Kế toán duyệt | **[GIỮ — THEO BÁO CÁO]** Phân tách người báo thu và người xác nhận; BE phải cưỡng chế quyền, có audit và không cho duyệt trùng. |
| 7. SAL-01/SHARE-01 | **[CHỜ NGHIỆP VỤ]** `DRAFT` là bắt buộc; công thức lương `/90` hay `/100`, điều chỉnh thu 3 tháng, phân bổ chi phí và ý nghĩa vốn cổ phần chưa được duyệt. **Không dùng demo để trả lương/chia tiền thật.** |
| 8. RPT-01 + refresh + so sánh | **[GIỮ — THEO BÁO CÁO]** Kiểm tính bền của gói và navigation. Thử bổ sung sau khi xóa storage/mở link trên thiết bị khác. |

## 4. Trả lời cả bốn cảnh báo/việc chờ ở QA §4

### 4.1. `file://`, font Inter, localStorage

**Trả lời:** **[CHẤP NHẬN GIỚI HẠN CHO DEMO OFFLINE]** nếu có thông báo rõ: font Latin/Vietnamese đã nhúng data URI; Latin-ext có thể cần HTTP; nếu storage trình duyệt bị chặn, dữ liệu chỉ nằm trong bộ nhớ phiên và **có thể mất khi đóng/refresh**. Không được quảng cáo "luôn giữ nháp khi F5" trên mọi `file://`.

**Đề xuất triển khai:** bản khách nghiệm thu ưu tiên qua **HTTP(S)**; bản đóng gói `file://` là fallback. Thử đóng/mở tab, đổi tab và refresh thực tế. Không cần thay cơ chế storage chỉ để né giới hạn bảo mật của trình duyệt nếu sẽ bàn giao trên server.

### 4.2. In và xuất PDF qua `window.print()`

**Trả lời:** **[CHƯA HOÀN TẤT QA]**. Việc nút mở hộp thoại in không chứng minh PDF xuất đúng mẫu. Yêu cầu QA thủ công RPT-04, RPT-05, hóa đơn và hợp đồng: A4, portrait/landscape theo mẫu, không cắt dòng/cột, số tiền không bị khuất, tiêu đề/cột lặp phù hợp, footer, trang trắng, tiếng Việt và font. Kiểm "Save as PDF" trên Chrome/Edge và ít nhất một trình duyệt nữa. Nếu in/PDF là chức năng bắt buộc cần ổn định, cân nhắc cơ chế server hoặc thư viện export có kiểm thử riêng (đề xuất kỹ thuật, chưa mặc định bổ sung scope).

### 4.3. Keyboard, focus và Firefox/Safari

**Trả lời:** **[CHƯA HOÀN TẤT QA]**. Lập vòng kiểm tra tay: `Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`, focus trap trong modal, focus trở lại trigger, tooltip hiện bằng bàn phím, tab bảng có thể thao tác, không có keyboard trap, thông báo lỗi được đọc. Kiểm Firefox và Safari; nếu không có máy macOS/Safari thì ghi **"chưa có môi trường test"**, không điền PASS giả.

### 4.4. Chưa có Excel báo giá 4 gói

**Trả lời:** **[BLOCKER NGHIỆM THU THƯƠNG MẠI]**. Cần Excel báo giá 4 sheet A/B/C/D hoặc biên bản duyệt, mapping từng chức năng với SRS. So sánh **từng ô/từng tính năng**, không chỉ 52 dòng và mức giá tổng. Mọi sai khác phải nằm trong change log; CR-RPT-01 và CR-BLD-01 cần có người đồng ý phạm vi và ảnh hưởng giá.

## 5. Trả lời CR-RPT-01 — RPT-04/RPT-05 (QA §5)

| Nội dung QA | Trả lời |
| --- | --- |
| 43 dòng chỉ tiêu, 13 tỷ lệ, đúng thứ tự Excel mẫu | **[GIỮ — THEO BÁO CÁO]** Đã report đủ cấu trúc; **[PHẢI KIỂM LẠI]** từng tên dòng, số cột, công thức, cell, nguồn và kỳ với file mẫu thật. |
| Tổng tòa = cột TỔNG | **[GIỮ — THEO BÁO CÁO]** Phải duy trì bất biến `Σ tòa = tổng` theo từng chỉ tiêu; ngoại lệ tỷ lệ phải **tính lại từ tổng tử/mẫu**, không cộng hoặc lấy trung bình tỷ lệ trực tiếp. |
| Kinh doanh vs Tổng | **[GIỮ — THEO BÁO CÁO]** Hai chế độ cần tồn tại; **[CHỜ NGHIỆP VỤ]** định nghĩa cọc, hoàn cọc, mua sắm, ghi nhận doanh thu theo kỳ. Không đồng nhất tổng tiền thu với doanh thu kế toán. |
| Sweep 43 route × 4 gói × 2 kỳ | **[GIỮ — THEO BÁO CÁO]** Smoke test chạy không lỗi. Cần lưu chính xác tập route, dữ liệu seed, commit, thời gian để tái lập. |
| 39 màn lõi/52 nhóm/156 increment và 2 CR | **[GIỮ — THEO BÁO CÁO]** 2 CR nên có ID độc lập trong mapping, đồng thời vẫn liên kết với F045/F046/F048 khi nghiệm thu scope. Không suy ra "88 màn Figma" từ con số này. |
| Lock giảm từ A→D | **[GIỮ — THEO BÁO CÁO]** Hợp lý vì gói cộng dồn. Kiểm không có năng lực cấp thấp biến mất ở gói cao. |
| Drill-down B đến 6 hóa đơn nguồn | **[GIỮ — THEO BÁO CÁO]** Nên chứng minh đầy đủ: drill-down tổng, tiền phòng, dịch vụ, giá vốn, chi phí và cổ phần; mọi số có thể truy ngược chứng từ hoặc bảng phân bổ. |
| Export Excel 3/4 sheet | **[GIỮ — THEO BÁO CÁO]** QA nói đã dùng `openpyxl` mở được. Trước bàn giao phải kiểm tổng tiền, định dạng phần trăm, công thức, ngày kỳ, filter, độ rộng cột và tổng khớp màn hình. |
| Phân quyền RPT-04/05 | **[GIỮ — THEO BÁO CÁO]** Quản lý tòa chỉ xem scope được phân; xác nhận bằng test BE cho filter/export, không chỉ ẩn lựa chọn. |
| Không đổi hóa đơn cũ | **[GIỮ — THEO BÁO CÁO]** `INV-2610-CG202 = 6.069.800 ₫` cần được cố định thành regression fixture. |
| Mobile RPT, INV, SAL | **[GIỮ — THEO BÁO CÁO]** Không tràn ngang chưa chứng minh bảng dễ dùng; kiểm bảng cuộn ngang có header cố định, tương phản và cỡ bấm. |
| Landing/drawer giới thiệu báo cáo | **[GIỮ — THEO BÁO CÁO]** Nội dung công bố phải bám ranh giới gói sau khi khách duyệt, không quảng cáo khả năng chưa hoạt động thực tế. |
| Khách đối chiếu số với R-01…R-09 | **[CHỜ NGHIỆP VỤ — CHƯA ĐẠT BUSINESS UAT]** Dữ liệu 3 tòa là giả. Phải xác nhận bằng **ít nhất 1 tòa + 1 tháng có chứng từ đầy đủ** và các trường hợp cọc/hoàn cọc/mua sắm/trả chủ nhà 3 tháng, rồi ký chốt cả R-01…R-09. |

**Số liệu sau CR:** QA gốc ghi **LNR tổng kỳ 09** thay đổi từ `7.579.599 ₫` xuống `7.537.599 ₫` sau CR-BLD-01, tức **giảm 42.000 ₫**. Đây là **kỳ vọng regression của dataset demo sau thay đổi**, không phải chứng nhận lợi nhuận thật. Chỉ so sánh test với **bản schema/dataset mới nhất**, tránh dùng test cũ làm false failure.

**Chế độ báo cáo cần gắn nhãn rõ:**

- `Báo cáo kinh doanh`: loại cọc mới/hoàn cọc khỏi doanh thu–chi phí kinh doanh theo quy tắc được duyệt; mua sắm tài sản không tự đưa toàn bộ vào giá vốn nếu áp dụng ghi nhận tài sản; chi phí thuê chủ nhà tính theo kỳ phát sinh.
- `Báo cáo tổng / dòng tiền quản trị`: giải thích rõ cọc nhận/trả, mua sắm, thu chi theo ngày thanh toán. Nếu xuất để **tái hiện nguyên mẫu Excel cũ**, cần ghi chú đây là **chế độ quản trị theo mẫu**, không mặc nhiên đồng nghĩa báo cáo P&L chuẩn.
- `LNG = Doanh thu kinh doanh − Giá vốn thuộc kỳ`; `LNR = LNG − Chi phí hoạt động/phân bổ thuộc kỳ`. **Tất cả khoản mục còn cần R-01…R-09 duyệt** trước khi đưa vào báo cáo chính thức.

## 6. Trả lời CR-BLD-01 — chủ nhà/tòa nhà và hiệu suất (QA §6)

| Nội dung QA | Trả lời |
| --- | --- |
| 696 lượt render, 0 lỗi | **[GIỮ — THEO BÁO CÁO]** Chấp nhận là kết quả smoke test được khai báo, **không độc lập xác nhận số 696**; cần log và mô tả cách đếm từng nhóm test để tái lập. |
| OWN-02 (7 tab), BLD-02 (8 tab) | **[GIỮ — THEO BÁO CÁO]** Phân nhóm này tốt hơn nhồi mọi tác vụ vào một màn. Kiểm mỗi tab đầy đủ empty/error/loading/save/permission và route. |
| Mapping F013/F033/F036 mới | **[GIỮ — THEO BÁO CÁO]** Cần cập nhật RTM/CR và test lại tất cả các gói. |
| Hiệu suất CG kỳ 09 | **[GIỮ — THEO BÁO CÁO]** Giữ test fixture `A=30.210.680`, `B≈18,83%`, `C=2.000.000`, `D=26.521.524`, `HS≈72,3%`, `HS tạm≈79,3%`. **Không dùng tỷ lệ B làm tròn 18,83% để tính lại D**; dùng tỷ lệ lưu độ chính xác đầy đủ. Công thức vẫn cần chốt tình huống cọc/kỳ 3 tháng. |
| Lương nháp dùng D | **[CHỜ NGHIỆP VỤ]** D có thể là nguồn HS nhưng công thức lương còn xung đột `/100` và `/90`, bảng tham chiếu theo bậc/thâm niên chưa ký. Kết quả `NV-003 = 618.000 ₫` chỉ là số **demo DRAFT**, không chốt bảng lương. |
| Sửa inline/tạo version HĐ | **[GIỮ — THEO BÁO CÁO]** Phù hợp yêu cầu. Cần bảo toàn lịch sử hợp đồng, giá có ngày hiệu lực, ai sửa/khi nào, quyền, ảnh hưởng lịch trả và P&L khi đổi giá. |
| Chặn rời trang mất nháp | **[GIỮ — THEO BÁO CÁO]** Test thêm nút Back hệ điều hành, mở tab khác, refresh, mất mạng và nhập nháp nhiều bảng. |
| Sinh kỳ trả, tài sản, nhân sự, tài liệu, đổi chủ nhà | **[GIỮ — THEO BÁO CÁO]** Kỳ 3 tháng và số 27 triệu/kỳ của TX là **dữ liệu demo**, không suy ra quy tắc chung. Theo HĐ/PL thật; sửa HĐ phải sinh điều chỉnh có version, không xóa lịch sử thanh toán đã phát sinh. |
| Gói A không lộ phần C | **[GIỮ — THEO BÁO CÁO]** Phần bị gate nên được ẩn/ghost theo preview; không rò dữ liệu qua export/API. A hiển thị HS "chưa tách DV" phải ghi rõ là chỉ số sơ bộ, không đặt tên giống HS đầy đủ. |
| Phân quyền chủ nhà/HĐ tòa | **[GIỮ — THEO BÁO CÁO]** `lease.edit` chỉ Admin/Kế toán theo mockup; phải kiểm backend quyền truy cập CCCD/STK/hợp đồng và scope tòa. |
| Responsive 375 | **[GIỮ — THEO BÁO CÁO]** Tab ngang có thể cuộn; kiểm nhãn hiện đủ, truy cập keyboard, và thao tác trên màn nhỏ. |
| Hóa đơn/regression sau CR | **[GIỮ — THEO BÁO CÁO]** Khóa regression `INV-2610-CG202 = 6.069.800 ₫` và chênh doanh thu 4.000.000 kỳ 10 ở hai chế độ; nếu thay mô hình cọc phải tạo snapshot baseline mới có giải trình. |
| Khách chốt G-01…G-10 | **[CHỜ NGHIỆP VỤ — CHƯA ĐẠT BUSINESS UAT]** Đã có **bộ câu trả lời/đề xuất** ở `TIMEHOUSE_MOCKUP_DECISIONS_ANSWERS.md`, nhưng đó **chưa phải phê duyệt của khách**. Giữ `DRAFT` ở mọi phần chịu tác động cho đến khi ký biên bản. |

### Kiểm tra phép tính hiệu suất mẫu CG kỳ 09

Theo Decision log, `M5 = 12.115.000`, `M10 = 28.050.400`, `M15 = 33.413.000`. Khi đó:

```text
A = M5 + 90% × (M10 − M5) + 70% × (M15 − M10)
  = 12.115.000 + 14.341.860 + 3.753.820
  = 30.210.680 ₫

B = Tổng dịch vụ phải thu / Tổng phải thu   (lưu độ chính xác đầy đủ)
C = Tiền phòng phát sinh thu đủ + khoản cọc bị giữ đủ điều kiện
D = A × (1 − B) + C
HS = D / Tổng giá niêm yết × 100%
```

Với `C = 2.000.000` và `Giá niêm yết = 36.700.000`, theo kết quả D được QA **báo cáo** là `26.521.524`, hiệu suất `≈72,3%`; phép chia D cho niêm yết làm tròn ra 72,3%. Việc dùng `B=18,83%` (chỉ là **số hiển thị đã làm tròn**) có thể làm D tính lại lệch vài trăm đồng; test phải lấy B gốc, quy định làm tròn một lần ở bước cuối.

**Riêng G-03:** tài liệu lương mô tả cọc mới, khách đóng 3 tháng cần điều chỉnh mốc (có ví dụ trừ 2 tháng, cộng 1 tháng kỳ sau). Mockup hiện chưa xử lý đầy đủ trường hợp này theo chính QA/Decision log. **Bắt buộc bổ sung UAT cho ngoại lệ trước khi xác nhận hiệu suất/lương vận hành.**

---

## 7. Danh sách vấn đề phát hiện khi đọc chéo QA và Decision log

| Mã đề xuất | Mức | Vấn đề | Cách xử lý |
| --- | --- | --- | --- |
| **QA-B01** | **BLOCKER chốt giá** | QA ghi "giá A/B/C/D đúng" nhưng thiếu Excel báo giá. | Đổi chữ thành **"giá hiển thị thống nhất với config demo"**, chờ biên bản giá gốc. |
| **QA-B02** | **BLOCKER nghiệp vụ lương** | Demo dùng hệ số lương theo HS, tài liệu lương có công thức `/100` nhưng ví dụ `/90`. | Chốt mẫu số/bậc/thâm niên bằng bảng nghiệp vụ, tạo bộ unit test có kết quả kỳ vọng do khách ký. |
| **QA-B03** | **BLOCKER P&L/cổ phần** | QA render đạt nhưng R-01…R-09, G-04, D-07 chưa chốt; số cổ phần không được suy thành tiền chi. | Chốt định nghĩa doanh thu/cọc/chi phí thuê chủ nhà/phân bổ/vốn; test khớp chứng từ thật; giữ `DRAFT`. |
| **QA-B04** | **BLOCKER scope UAT** | Checklist đếm 39 màn lõi + 2 CR, nhưng mục tiêu UI Figma đã nêu là **88 màn**. | Tạo **mapping 88 màn Figma** (frame, module, UI-ID, trạng thái, link Figma, chức năng, test), không nhập nhằng hai phạm vi. |
| **QA-P01** | P1 | Chưa thử in/PDF trực tiếp và các browser khác. | Thực hiện ma trận browser + in PDF, lưu ảnh/chứng từ PDF xuất ra. |
| **QA-P02** | P1 | Chưa test đầy đủ bàn phím và accessibility. | Thử keyboard/focus/screen-reader cơ bản; lưu issue theo màn. |
| **QA-P03** | P1 | Thực thi action/permission chưa có bằng chứng BE. | Thử API trực tiếp, kiểm role & scope, trạng thái xử lý và audit. |
| **QA-P04** | P1 | Các kết quả Playwright PASS chưa có script/log/commit kèm file QA. | Đính kèm output CI, screenshots, file Excel export và danh sách test case. |
| **QA-P05** | P1 | Số 696 render không diễn giải được hoàn toàn từ các tích số ở hàng mô tả. | Bổ sung bảng đếm phân loại màn/tab × hồ sơ × gói × kỳ; không cần tự coi là fail nếu log chứng minh đúng. |
| **QA-P06** | P1 | `file://` fallback bộ nhớ phiên có thể không giữ nháp xuyên refresh. | Ghi rõ bảo đảm theo HTTP(S), giới hạn offline; demo khách ưu tiên qua server. |
| **QA-P07** | P1 | Thiếu đối chiếu giá và scope CR với nguồn SRS v2.3/báo giá. | PM duyệt CR-RPT-01 và CR-BLD-01, phiên bản tài liệu/RTM và hợp đồng giá. |
| **QA-P08** | P1 | Có nguy cơ diễn giải sai nước theo đồng hồ thành nước theo người và phí dịch vụ chung tách đều 1/3. | Sử dụng phương thức tính theo hợp đồng và version biểu phí; chờ chốt D-03/R-02. |

**Lưu ý về đếm màn:** QA đề cập `41 route` ở bước trước CR, `43 route` sau CR-RPT-01, trong khi mapping chuẩn nêu `39 màn SRS + 2 màn CR`. Có thể "route" gồm trang tiện ích/khác, nhưng **không được khẳng định chính xác khi chưa có registry thực tế**. Codex cần xuất báo cáo giải thích `route_count`, `screen_count`, `dialog_count`, `tab_count`, `figma_frame_count` riêng rẽ.

## 8. Tiêu chí nghiệm thu lại (Definition of Done) — khuyến nghị

**Technical Demo QA = PASS** khi có bằng chứng cho toàn bộ yêu cầu sau:

- [ ] Có commit/build, `README`, script Playwright chạy lại thành công và file log/artifact; QA gốc được tái hiện.
- [ ] Bộ smoke toàn bộ gói, route, role, draft, deep link và responsive không lỗi nghiêm trọng.
- [ ] Tất cả export Excel mở được; đối chiếu giá trị và định dạng với màn hình; file in/PDF được người thật kiểm.
- [ ] Firefox/Safari/keyboard được thử hoặc có ngoại lệ môi trường được ghi rõ.
- [ ] UI trạng thái `DRAFT/OPEN/SIMULATED` hiện đúng nơi có nghiệp vụ chưa chốt.
- [ ] Checklist Figma 88 màn (nếu thuộc scope bàn giao) có từng link frame và kiểm component/Auto Layout/variant riêng.

**Business UAT = PASS** chỉ khi bổ sung:

- [ ] Khách/PM ký chốt D-01…D-09, R-01…R-09, G-01…G-10 với trạng thái **Approved** hay thay thế rõ ràng; các mục chưa được duyệt vẫn **không kích hoạt nghiệp vụ thật**.
- [ ] Chốt gói A/B/C/D và mọi CR theo **báo giá gốc/SRS chuẩn**, có bảng khác biệt so với mockup.
- [ ] Bộ số liệu thật tối thiểu cho tòa và kỳ đại diện được tính và so khớp: hóa đơn, thu tiền, công nợ, cọc, chi phí, lương, lãi, chia cổ phần.
- [ ] Xác nhận ngoại lệ cọc mới, thu 3 tháng, mốc M5/M10/M15, thu sau mốc 15, thay công tơ, hóa đơn lẻ kỳ, mua sắm và phân bổ chi phí chung.
- [ ] Chốt quyền quản lý tòa/kế toán/admin và kiểm thử ở backend.

### Kết luận cuối cùng

**Có thể tiếp tục dùng bản mockup để trình bày và làm FE prototype**, dựa trên báo cáo QA gốc đang thể hiện mức hoàn thiện kỹ thuật tốt. **Chưa đủ căn cứ kết luận sản phẩm đã nghiệm thu nghiệp vụ hoặc đã hoàn tất 88 màn Figma**. Cần hoàn thiện các mục **BLOCKER** và UAT ở trên; giữ mọi số liệu/công thức chưa phê duyệt ở trạng thái `DRAFT` để Codex không biến thành quy tắc production.

**Tài liệu đi kèm cần giữ cùng bộ handoff:** `TIMEHOUSE_MOCKUP_QA.md` (kết quả kiểm thử do nhóm cung cấp), `TIMEHOUSE_MOCKUP_DECISIONS.md` (câu hỏi và giả định), `TIMEHOUSE_MOCKUP_DECISIONS_ANSWERS.md` (phương án trả lời/đối chiếu nghiệp vụ), và file này (phản hồi QA + checklist nghiệm thu lại).
