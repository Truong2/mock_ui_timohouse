# TIMEHOUSE — Phạm vi phát triển, giới hạn và giá các gói

Cập nhật ngày 27/10/2026 theo [Package Scope v2.1](../TIMEHOUSE_Package_Scope_A_B_C_D_v2_1_VanHanhBaoCaoChuan.md) (`PROPOSED — NEEDS CUSTOMER/TEAM SIGN-OFF`). Bản đề xuất phục vụ trao đổi và chốt phạm vi với khách hàng.

**Định hướng v2.1:** A = đủ vận hành một kỳ và hai báo cáo RPT-04/RPT-05 đúng mẫu đã ký, phần lớn nhập tay; B = A + nhập liệu/hàng loạt/đối soát nhanh hơn; C = B + tự động hóa có giới hạn (phân bổ chi phí chung theo số phòng); D = C + chốt bản, khóa kỳ, so sánh hai kỳ, xuất theo phiên bản. Bốn gói dùng cùng bộ tính và cùng mẫu xuất; gói cao chỉ khác cách làm, không khác kết quả báo cáo.

**Ngoại lệ so với §4 v2.1 — OCR và Zalo OA (chốt với người dùng 27/10/2026):** OCR hợp đồng khách thuê và Zalo OA **có ở mọi gói**; gói nhỏ ít chức năng hơn, gói lớn nhiều hơn (bậc như bản 26/10, xem bảng giới hạn ở §3). OCR chỉ áp dụng cho hợp đồng khách thuê; giấy tờ khác nhập tay hoặc đính kèm.

**CR-PKG-OPS (24/10) — đã thay một phần:** phần "A nhập từng hồ sơ, B mới có Excel/hàng loạt" và các bậc OCR/OA vẫn giữ; phần lập từng hóa đơn ở A và phân bổ một khoản thu nhiều hóa đơn từ D được thay bằng v2.1. [Ma trận 52 nhóm hiệu lực](TIMEHOUSE_PACKAGE_FUNCTION_MATRIX.md) chưa cập nhật theo v2.1.

**Chưa đồng bộ trong demo:** văn bản trang giới thiệu đã theo v2.1, nhưng gating demo còn theo CR-PKG-OPS ở hai chỗ: `F031` phân bổ nhiều hóa đơn vẫn từ D; `inv.multi` (`F022.B`) chặn tạo hóa đơn theo tòa ở A. Cần CR riêng theo §5 v2.1.

## 1. Cách giới thiệu dự án

TIMEHOUSE là hệ thống quản lý vận hành nhà cho thuê, liên kết hồ sơ chủ nhà, tòa, phòng, khách thuê và hợp đồng với hóa đơn, thu tiền, công nợ, chi phí và báo cáo kết quả kinh doanh. Dữ liệu phát sinh tại từng tòa được tổng hợp theo kỳ, có phân công trách nhiệm và căn cứ để đối chiếu.

Phạm vi phát triển được chia thành bốn gói A/B/C/D, mỗi gói xác định chức năng, mức hỗ trợ xử lý và giới hạn áp dụng. Các gói dùng cùng nền giao diện và các phân hệ cốt lõi; mức giá tăng theo khả năng tự động hóa, kiểm soát và giải trình số liệu.

Trang gửi khách dùng tiêu đề **Phạm vi phát triển theo từng gói**, với các nhãn **Phạm vi và giá**, **So sánh chức năng** và **Nội dung bàn giao**. Nội dung tập trung vào chức năng được phát triển và giới hạn áp dụng của từng gói; sáu bước bàn giao là quy trình thực hiện sau khi khách chọn gói.

Giá dưới đây là **tổng giá trị từng gói**, gói cao bao gồm phạm vi gói thấp. Khoảng giá giữ theo cấu hình dự án: A 50–60, B 70–80, C 80–90, D 90–100 triệu đồng. Đây là đề xuất phạm vi; Excel báo giá đã ký chưa có trong workspace để xác nhận điều kiện thương mại.

## 2. Nội dung chung của mọi gói

- Hồ sơ chủ nhà, tòa, phòng, khách, hợp đồng và tài liệu đính kèm; liên kết dữ liệu xuyên nghiệp vụ.
- Tiền phòng, điện nước, phí dịch vụ, hóa đơn, thu nhiều lần, công nợ và hồ sơ xử lý cọc ở mức cơ bản.
- Chi phí theo tòa/kỳ, thông tin nhân sự, bảng lương và phân bổ cổ phần theo quy tắc đã thống nhất.
- Báo cáo doanh thu theo tòa và kinh doanh tháng theo mẫu khách; xuất Excel và bản in cơ bản.
- OCR hợp đồng khách thuê theo mẫu thuộc gói, có người xác nhận trước khi ghi; Zalo OA gửi hóa đơn và nhắc thanh toán theo giới hạn gói, khi đủ điều kiện nhà cung cấp.
- Giao diện thống nhất, biểu mẫu kiểm tra lỗi, hỗ trợ màn hình nhỏ, bảo vệ dữ liệu đang nhập.
- Phân quyền và các điều kiện tài chính tối thiểu: quản lý xác nhận thu tại tòa được giao, kế toán hậu kiểm; người lập và người duyệt hoàn cọc khác nhau; chỉ hoàn tất hoàn cọc sau thực chi. Các điều kiện này áp dụng xuyên gói.

Số màn/nhóm trong registry là chỉ số bao phủ kỹ thuật; không dùng làm cam kết mọi công cụ nâng cao đều có trong A. A thực hiện đầy đủ nghiệp vụ qua từng hồ sơ/chứng từ. Nhập Excel, tự lấy dữ liệu liên phân hệ và xử lý hàng loạt được phân tầng riêng. Hai mẫu báo cáo gốc có ngay trong A; C và D có thêm báo cáo theo danh mục ở §3; báo cáo ngoài danh mục phải được xác định riêng.

## 3. Chức năng và giá trị theo mức giá

| Gói | Giá tham chiếu | Phạm vi bàn giao | Giá trị sử dụng |
|---|---:|---|---|
| **A — Vận hành đầy đủ, nhập tay** | **50–60 triệu** | Chủ nhà/tòa/phòng/khách/hợp đồng: nhận, gia hạn, đổi, trả phòng và quyết toán; nạp số đầu kỳ một lần; chỉ số, tạo hóa đơn theo tòa/kỳ và sửa dòng lỗi; phiếu thu phân bổ thủ công nhiều hóa đơn, thu trước, cọc/hoàn cọc; chi phí, chi phí chung chia tay theo tòa, lương/hoa hồng nhập số đã duyệt có nguồn; RPT-04/RPT-05 đủ mẫu, xuất Excel; OCR một mẫu hợp đồng khách thuê; một Zalo OA gửi từng hóa đơn và một lịch nhắc cố định. | Vận hành trọn một kỳ đến hai báo cáo đúng mẫu; người dùng nhập/chọn/xác nhận, hệ thống tự tính. |
| **B — Vận hành tối ưu** | **70–80 triệu** | Toàn bộ A; nhập Excel định kỳ theo mẫu cố định; xem trước hóa đơn hàng loạt, lọc lỗi; gợi ý phân bổ thu tiền; hỗ trợ lập hợp đồng, kiểm trùng nâng cao; gợi ý lịch trả; truy nguồn chứng từ và xu hướng sáu kỳ; OCR tối đa hai mẫu hợp đồng khách thuê; OA gửi danh sách, ba mốc nhắc, mẫu hết hạn hợp đồng. | Cùng kết quả với A, giảm thao tác nhập và đối soát. |
| **C — Tự động hóa chọn lọc** | **80–90 triệu** | Toàn bộ B; tự phân bổ chi phí chung theo số phòng (một quy tắc, có xem trước/duyệt); thêm báo cáo âm dương điện nước và lấp đầy/thời gian trống; OCR kiểm trùng và so khớp phòng–khách–hợp đồng; OA cá nhân hóa theo tòa, xử lý lỗi gửi và nhật ký gửi. | Tự động bước lặp, luôn có đường thủ công thay thế. |
| **D — Kiểm soát nâng cao** | **90–100 triệu** | Toàn bộ C; chốt bản báo cáo tháng không sửa đè; khóa kỳ/mở lại theo chính sách; so sánh hai kỳ; bản xuất báo cáo quản trị theo phiên bản; thêm báo cáo dự kiến lợi nhuận, phân khúc khách hàng, chi phí sửa chữa/vệ sinh; thư viện mẫu OCR hợp đồng khách thuê và lịch sử sửa; OA phiên bản mẫu, lịch sử, giám sát gửi lại. | Giữ bản đã phát hành và giải trình thay đổi giữa các kỳ. |

### Giải thích phần giá tăng thêm

- **A → B:** chi phí cho nhập Excel định kỳ, xem trước hàng loạt, gợi ý phân bổ, truy nguồn chứng từ, OCR mẫu thứ hai và OA gửi danh sách/ba mốc nhắc.
- **B → C:** chi phí cho tự phân bổ chi phí chung theo số phòng, OCR kiểm trùng/so khớp và OA cá nhân hóa, xử lý lỗi gửi.
- **C → D:** chi phí cho bản chốt bất biến, khóa kỳ, so sánh hai kỳ, xuất theo phiên bản, thư viện mẫu OCR và giám sát gửi lại OA.

Ngoài gói chuẩn (add-on): OCR ngoài hợp đồng khách thuê hoặc ngoài số mẫu của gói, nhiều OA/chiến dịch/escalation, bảng lương tự động, quản lý cổ đông đầy đủ, đối soát ngân hàng tự động, cổng thanh toán, BI tùy chỉnh, SLA 24/7. Không có các engine này không có nghĩa là không được nhập kết quả đã chốt để lên báo cáo.

Không diễn giải rằng gói thấp bỏ các bước bảo vệ tài chính bắt buộc. Giao diện enterprise là nền chung, không phải phần nâng cấp chỉ có ở D.

### Giới hạn OCR, OA và hai mẫu báo cáo

| Phần | A | B (gồm A) | C (gồm B) | D (gồm C) |
|---|---|---|---|---|
| OCR hợp đồng khách thuê | Một mẫu đã chọn; rà soát, sửa và xác nhận từng file | Tối đa hai mẫu; chỉ rõ trường cần kiểm tra | Giữ hai mẫu của B; thêm kiểm trùng và so khớp phòng–khách–hợp đồng | Thư viện mẫu đã duyệt, số mẫu ghi trong báo giá; lịch sử sửa |
| OA | Một OA, tối đa hai mẫu tin; gửi từng hóa đơn và một lịch nhắc cố định | Gửi danh sách, ba mốc nhắc, mẫu hết hạn hợp đồng | Cá nhân hóa theo tòa; xử lý lỗi gửi theo quy tắc; nhật ký gửi | Phiên bản mẫu, lịch sử và giám sát gửi lại |
| Báo cáo | Hai mẫu gốc đủ hàng/cột/sheet đã ký; đầu vào nhập tay có nguồn | Giữ hai mẫu, cùng số; thêm truy nguồn và xu hướng sáu kỳ | Hai mẫu gốc + âm dương điện nước, lấp đầy/thời gian trống | Báo cáo của C + dự kiến lợi nhuận, phân khúc khách, sửa chữa/vệ sinh; bản chốt, khóa kỳ, so sánh hai kỳ, xuất theo phiên bản |
| Xử lý bổ sung | Nhập, chọn, phân bổ và đối soát thủ công | Nhập Excel định kỳ, gợi ý và hàng loạt theo mẫu đã thống nhất | Tự phân bổ chi phí chung theo một quy tắc số phòng | Lưu quy tắc khi chốt kỳ; không gồm quản lý cổ đông, bảng lương tự động, kết nối ngân hàng |

Không cam kết OCR mọi định dạng, nhiều OA không giới hạn, tự thiết kế báo cáo hoặc tự cấu hình mọi công thức. Mọi gói đều bỏ qua khoản đã xác nhận thu đủ khi nhắc thanh toán; không đợi kế toán hậu kiểm mới dừng nhắc. Số loại báo cáo theo gói (2 / 2 / 4 / 7) là số loại, không phải giới hạn số lần chạy hoặc số bản lưu.

### Danh mục báo cáo theo gói

Nguồn: danh sách khách gửi trong [docs/bao_cao/báo cáo.xlsx](../bao_cao/) và các file mẫu cùng thư mục. Các báo cáo khác trong danh sách đó không thuộc phạm vi các gói.

| Gói | Báo cáo | Nội dung | File mẫu |
|---|---|---|---|
| A–D | RPT-04 Doanh thu theo tòa | Mẫu G1: doanh thu, cọc, phòng, giá vốn, chi phí, lợi nhuận từng tòa | G1.31.8.26.xlsx |
| A–D | RPT-05 Báo cáo kinh doanh tháng | Báo cáo tổng (gồm cọc mới, mua sắm) và báo cáo kinh doanh (không gồm cọc mới, hoàn cọc, mua sắm) | BÁO CÁO KINH DOANH THÁNG 8.xlsx |
| C, D | Âm dương điện nước | Thu–chi điện, nước, máy giặt, thang máy theo tòa: phải thu, thực thu, không thu được | âm dương điện nước tháng 6/7.xlsx |
| C, D | Lấp đầy và thời gian trống | Tỷ lệ lấp đầy, số ngày phòng trống theo nhà và toàn hệ thống | — |
| D | Dự kiến lợi nhuận | Dự kiến lợi nhuận dòng tiền và kinh doanh các tháng | BẢNG DỰ KIẾN LỢI NHUẬN CÁC THÁNG.xlsx |
| D | Phân khúc khách hàng | Tỷ lệ sinh viên / người đi làm; cần trường loại khách trên hồ sơ | — |
| D | Chi phí sửa chữa, vệ sinh | Sổ sửa chữa theo tòa/phòng: nội dung, tiền công, vật tư | sổ sửa chữa tháng 8.xlsx |

### Màn Báo cáo: nhóm, tạo, rà soát, sửa, xóa (CR-RPT-03, 28/10/2026)

Mọi báo cáo đi chung một luồng ở màn **Báo cáo** (`#/demo/reports`, [js/views/reportflow.js](../../js/views/reportflow.js)). Năm loại bổ sung đăng ký vào luồng này từ [js/views/opsreports.js](../../js/views/opsreports.js). Màn RPT-06 riêng đã bỏ.

- **Tab theo nhóm:** Tất cả · Báo cáo tài chính (RPT-04, RPT-05, Dự kiến lợi nhuận) · Báo cáo vận hành (Âm dương điện nước, Lấp đầy, Sửa chữa & vệ sinh) · Báo cáo khách hàng (Phân khúc khách). Mỗi tab có:
  - dải thẻ loại báo cáo (gói, mô tả, file mẫu, nút Tạo); loại thuộc gói cao hơn thì khóa, kèm nút xem thử gói;
  - bảng bản báo cáo đã tạo với nút **Xem · Tải Excel · Sửa · Xóa**; lọc loại/tòa/kỳ/người tạo và Đang dùng/Đã xóa.
- **Tạo:** chọn nhóm → loại → tháng → tòa → **Xem trước**. Preview gồm:
  - các sheet theo mẫu, bấm số nào cũng xem được công thức, thành phần và chứng từ nguồn;
  - cảnh báo nghiệp vụ;
  - **Rà soát minh chứng**: bản ghi nguồn gom theo nhóm (hóa đơn và tiền đã thu, chi phí, cọc, hợp đồng/khách, phòng, lương/phân bổ, số ước tính). Mỗi nhóm có kiểm tra tự động (chờ duyệt, ước tính, nghi trùng, thiếu căn cứ) và ô "Đã rà soát". Nhóm có lỗi, ví dụ chứng từ trùng số và số tiền đang bị cộng hai lần, thì không tích được cho tới khi xử lý nguồn.
- **Sửa công thức** (sheet CONG THUC, chỉ kế toán/quản trị):
  - mỗi chỉ tiêu dẫn xuất là danh sách thành phần × hệ số; tỷ lệ có tử số và mẫu số riêng;
  - bật/tắt thành phần, đổi hệ số (âm = trừ), bắt buộc lý do, chặn công thức vòng lặp;
  - preview tính lại mọi cột, nhóm minh chứng phải rà soát lại;
  - bản lưu và Excel ghi công thức chuẩn, công thức đang dùng, lý do, người sửa.
- **Điều kiện tạo:** không lỗi số liệu, nguồn không đổi sau khi xem, đã đọc cảnh báo, đã rà soát đủ nhóm minh chứng (kể cả nhóm "Công thức đã sửa"). Bản lưu có thêm sheet **RA SOAT MINH CHUNG**.
- **Sửa bản ghi:** mở lại preview với loại, kỳ, tòa và công thức của bản đó, tính lại từ nguồn hiện tại, rà soát lại. Gói A–C cập nhật vào cùng bản ghi và ghi nhật ký sửa. Gói D tạo phiên bản mới (v2, v3…), bản cũ giữ nguyên.
- **Xóa:** xóa mềm, bắt buộc lý do, ghi nhật ký. Bản đã xóa ẩn khỏi danh sách, vẫn xem và tải lại được ở bộ lọc "Đã xóa". Chỉ kế toán/quản trị được xóa.
- **Theo gói và quyền:** A/B tạo RPT-04/05; C thêm âm dương, lấp đầy; D thêm dự kiến lợi nhuận, phân khúc khách, sửa chữa. Dự kiến lợi nhuận cần quyền `report.all`. Gọi thẳng API ở gói thấp cũng bị chặn.

Số liệu dựng từ dữ liệu demo, cùng nguồn với RPT-04/RPT-05 (`C.pnl`); không thêm hay sửa dữ liệu mẫu. Với công thức chuẩn, số RPT-04/RPT-05 giữ nguyên.

| Báo cáo | Cách tính trong demo |
|---|---|
| Âm dương điện nước | Theo cột của sheet "THÁNG 7.2026 điện"/"THÁNG 6.2026 nước". Phải thu = dòng hóa đơn đã xác nhận. Thực thu = phải thu × tỷ lệ đã thu của hóa đơn. Máy giặt và thang máy lấy từ phí dịch vụ chung chia 3 như RPT-05; xe điện lấy từ phí gửi xe điện. Chi = hóa đơn công tơ tổng đã duyệt. Thu − chi điện = điện thực thu + ½ máy giặt + thang máy/xe điện − điện chi; nước = nước thực thu + ½ máy giặt − nước chi. Kèm danh sách thất thoát (phòng trống, đang sửa, phá HĐ). |
| Lấp đầy và thời gian trống | Lấp đầy cuối kỳ theo trạng thái phòng; lấp đầy theo ngày = ngày có hợp đồng ÷ ngày-phòng khai thác được. Phòng đang sửa loại khỏi mẫu số, giống cách đếm phòng trống của RPT-05. Tiền phòng chưa khai thác = giá niêm yết × ngày trống ÷ số ngày trong tháng. Có xu hướng 6 kỳ. |
| Dự kiến lợi nhuận | Theo sheet "Tháng 9.2026": tổng doanh thu dự kiến, cọc mới, các khoản chi theo thứ tự mẫu, tổng lợi nhuận, LNR/DT, LNR/GV và khối tiến độ thu (đã thu, công nợ hóa đơn, phòng mới). Hai chế độ: kinh doanh (không gồm cọc mới, hoàn cọc, mua sắm) và dòng tiền. Kỳ đang mở cộng thêm hóa đơn nháp, phòng chưa lập hóa đơn (ước tính) và khoản chi chờ duyệt; khoản chưa có chứng từ lấy theo kỳ trước. Mỗi dòng ghi nguồn. Kỳ đã qua chỉ dùng số thực tế. |
| Phân khúc khách hàng | Khách có hợp đồng có ngày ở trong kỳ. Sinh viên = nghề nghiệp chứa "sinh viên/học sinh", còn lại là người đi làm. Khách chưa cập nhật nghề nghiệp tách riêng và không tính vào tỷ lệ. Kèm giá thuê bình quân theo phân khúc. |
| Chi phí sửa chữa, vệ sinh | Theo cột sổ sửa chữa (ngày, tòa, mã phòng, nội dung, tiền công, vật tư). Nguồn là chi phí "Sửa chữa, bảo trì", không gồm phiếu bị từ chối. Có phiếu sửa chữa thì tách tiền công/vật tư; chưa có thì giữ tổng ở cột "Chưa tách công/vật tư". Phiếu trùng số chứng từ và số tiền được đánh dấu nghi trùng, không cộng vào tổng. Kèm bảng thu–chi vệ sinh, mạng theo sheet "THU CHI DỊCH VỤ". |

#### Giao diện luồng báo cáo (28/10/2026)

- **Danh sách:**
  - thẻ "Tạo nhanh theo loại" thu gọn;
  - dải lọc nhanh Đang dùng · Đã sửa công thức · Bản cũ chưa rà soát · Đã xóa;
  - bảng 6 cột (Báo cáo, Kỳ, Phạm vi, Trạng thái, Cập nhật, Thao tác). Mỗi dòng luôn thấy **Xem** và **Tải Excel**; Sửa/Xóa nằm trong menu "···". Cột thao tác dùng option mới `maxActions` của `TH.table`.
- **Tạo:** thanh 4 bước (Chọn loại → Kỳ & tòa → Xem trước & rà soát → Tạo bản lưu). Tòa chọn dạng chip theo nhóm nhà. Card **Bản sẽ tạo** dính bên phải ghi loại, mẫu, kỳ, tòa, số bản và việc cần làm sau khi xem trước.
- **Xem trước là bàn làm việc 2 cột:** trái là bảng báo cáo, phải là panel dính gồm 4 tab.
  - **Kiểm tra:**
    - checklist 5 điều kiện tạo, có thanh tiến độ;
    - nhóm minh chứng dạng mở/đóng. Mở nhóm thì tô các ô thuộc nhóm trên bảng và hiện bản ghi nguồn;
    - **phải mở xem nhóm mới tích được "Đã rà soát"**, chặn cả khi gọi API (`TH.reports.markSeen` trước `setReview`). Tính lại làm số đổi thì phải xem lại.
  - **Nguồn ô:** bấm số trên bảng thì truy nguồn hiện ngay trong panel, bảng không bị che. Có breadcrumb đường drill, phương trình một dòng (ví dụ "DT tiền phòng + DT dịch vụ + … = DT kinh doanh") và badge Khớp/Lệch. Màn hẹp hơn 1100px vẫn mở hộp thoại.
  - **Công thức:** công thức đang dùng, đã sửa xếp trước, có nút Sửa.
  - **Cảnh báo:** danh sách và ô đã đọc.
- **Bảng báo cáo:** chú thích màu ô (số nguồn, tính theo công thức, công thức đã sửa, thuộc nhóm đang rà soát, đổi sau tính lại) và nút **Ẩn dòng bằng 0**.
- **Thanh xác nhận** dính đáy, ghi số điều kiện đã đạt và nút đi tới việc còn thiếu. Phân tích bổ sung theo gói thu vào mục đóng sẵn.
- **Hộp sửa công thức** hiện kết quả cột Tổng trước → sau khi đổi thành phần/hệ số, trước khi lưu.
- **Bản lưu:** cùng bố cục 2 cột. Panel có các tab Thông tin, Nguồn ô, Rà soát, Công thức, Lịch sử. Tải Excel là nút chính.

Smoke trong trình duyệt: 1.168 lượt, gồm biến thể tab nhóm, bộ lọc nhanh, form tạo từng nhóm, dialog dựng preview, truy nguồn, sửa công thức cho mọi loại mở theo gói và bàn làm việc xem trước. Số này đã cập nhật trong `tools/qa-pricing.playwright.js` và `tools/qa-package-policy.playwright.js`. Ở qa-pricing, điều kiện kiểm hai mẫu gốc đổi thành "RPT-04/RPT-05 có ở gói A". `tools/qa-report.playwright.js` chọn loại bằng thẻ và đánh dấu xem + rà soát trước khi xác nhận; QA-RPT-11 kiểm bàn làm việc; 12/12 kiểm thử đạt.

Mọi gói kiểm tra trường bắt buộc, mã duy nhất, chỉ số hợp lệ, thuê chồng thời gian, tổng cổ phần 100%, chống ghi/gửi trùng. Thành phần A/B/C/D trong công thức hiệu suất dùng đầy đủ ở mọi gói; không phải quyền gói giá. Khác biệt hiển thị hiệu suất A/B so với bản trước được giải thích bằng việc bỏ công thức rút gọn theo gói; bộ tính hóa đơn/P&L/dataset không đổi.

Thu tiền cho công nợ của hóa đơn kỳ cũ đã khóa vẫn được phép theo quyền và ngày thực nhận; không sửa nội dung hóa đơn cũ. A ghi thiếu/thừa trên một hóa đơn; phân bổ một khoản thu cho nhiều hóa đơn từ D.

## 4. Mốc bàn giao và tiêu chí nghiệm thu

A–D là các lựa chọn phạm vi phát triển, không phải các mốc đầu tư. Các bước bàn giao dưới đây áp dụng sau khi chọn gói; không phải sáu gói có giá độc lập. Phần B/C/D chỉ đưa vào nghiệm thu khi nằm trong gói hoặc phụ lục đã ký.

| Mốc | Công việc và đầu ra | Điều kiện nghiệm thu |
|---|---|---|
| **M1 — Chốt mẫu báo cáo và chính sách tính** | File Excel chuẩn RPT-04/RPT-05 (sheet, hàng/cột, làm tròn, sheet cổ phần nếu bắt buộc); định nghĩa doanh thu/cọc/thu trước, dồn tích và tiền mặt; quy tắc tính lẻ kỳ; cách chia chi phí chung; danh mục đầu vào nhập tay; quyền theo vai trò/tòa; bộ dữ liệu đối chiếu (golden data); mẫu hợp đồng khách thuê dùng OCR, trường cần đọc và mẫu tin Zalo OA theo gói. | Mẫu báo cáo, golden data, mẫu OCR và mẫu tin OA có người duyệt; mục chưa chốt (GATE-RPT-01..03, GATE-OP-01..02) ghi `DRAFT`/`PENDING CUSTOMER DECISION`, không tính số chính thức theo chính sách suy đoán. |
| **M2 — Hồ sơ, hợp đồng và số liệu đầu kỳ** | OP-01…04, OP-11: chủ nhà, tòa, phòng, người phụ trách; khách và HĐ thuê (nhận, gia hạn, đổi, trả phòng); HĐ chủ nhà và lịch trả; nạp một lần nợ, cọc, thu trước, chỉ số đầu kỳ có biên bản mapping. OCR hợp đồng khách thuê theo mẫu thuộc gói; giấy tờ khác nhập tay và đính kèm. | Mã duy nhất; không trùng HĐ hiệu lực cùng phòng; giá/cọc đúng hiệu lực; số đầu kỳ đối soát được với bảng nguồn (TC-01); quyền đúng tòa; dữ liệu OCR được rà soát, sửa và xác nhận trước khi ghi. |
| **M3 — Hóa đơn, thu tiền, cọc và quyết toán** | OP-05…10, OP-15: chỉ số và biểu phí; tạo hóa đơn theo tòa/kỳ, sửa dòng lỗi, phát hành/điều chỉnh; phiếu thu phân bổ thủ công nhiều hóa đơn/nghĩa vụ; thu trước, giữ/hoàn cọc; quyết toán trả phòng; thu theo mốc 5/10/15; gửi hóa đơn và nhắc thanh toán qua Zalo OA theo giới hạn gói. | TC-02…05: chạy lại không nhân đôi hóa đơn; thu thiếu/đủ/thừa đúng, không phân bổ vượt số dư; thu 3 tháng + cọc tách đúng kỳ; trả phòng giữa kỳ ra đúng phải thu/phải hoàn; OA không gửi trùng, không nhắc khoản đã thu đủ. |
| **M4 — Chi phí và hai báo cáo chuẩn mẫu** | OP-12…14, OP-16: chi phí trực tiếp; chi phí chung chia tay theo tòa; lương/hoa hồng/giá vốn nhập số đã duyệt có nguồn; chi thuê tòa tách thuộc kỳ và thực trả; RPT-04/RPT-05 từ cùng một bộ tính, xuất Excel; bản DRAFT có cảnh báo khi thiếu đầu vào. | TC-06…08, TC-10, TC-11, TC-13, TC-14: khớp golden data trong sai số làm tròn đã ký; tổng tòa = toàn hệ thống; thiếu dữ liệu thì chặn bản chính thức; mỗi số nhập tay có nguồn và người nhập. |
| **M5 — Tiện ích của gói đã chọn** | A: không có hạng mục riêng; vận hành, hai báo cáo, OCR một mẫu và OA gửi từng hóa đơn đã nghiệm thu ở M2–M4. B: nhập Excel định kỳ, xem trước hóa đơn hàng loạt, gợi ý phân bổ, hỗ trợ lập HĐ, truy nguồn, xu hướng sáu kỳ; OCR hai mẫu; OA gửi danh sách/ba mốc nhắc. C: + tự phân bổ chi phí chung theo số phòng; báo cáo âm dương điện nước, lấp đầy/thời gian trống; OCR kiểm trùng/so khớp; OA cá nhân hóa, xử lý lỗi gửi. D: + bản chốt bất biến, khóa kỳ/mở lại theo chính sách, so sánh hai kỳ, xuất theo phiên bản; báo cáo dự kiến lợi nhuận, phân khúc khách, sửa chữa/vệ sinh; thư viện mẫu OCR; giám sát gửi lại OA. | TC-12 và §8.3: trên cùng dữ liệu, hai báo cáo gốc bằng kết quả nhập tay của A; báo cáo bổ sung khớp số nguồn; mỗi công cụ hỗ trợ/tự động có đường thủ công thay thế; bản chốt D dùng cùng bộ tính và không bị sửa đè. |
| **M6 — UAT và đưa vào sử dụng** | UAT trên ít nhất hai kỳ golden data; nạp số liệu đầu kỳ thật; triển khai, sao lưu/phục hồi, hướng dẫn. | Điều kiện GO-LIVE v2.1: không còn sai lệch P0 chưa giải trình ở thu/cọc/nợ/tổng báo cáo; kế toán duyệt hai kỳ golden data; thử phục hồi đạt; khách ký UAT. Thiếu mẫu/duyệt thì chưa công bố "100% chuẩn mẫu". |

Trên trang giới thiệu ([js/pricing.js](../../js/pricing.js)) các mốc dùng cùng nội dung nhưng bỏ mã OP/TC/GATE; M5 lấy nội dung `upgrade` của gói đang chọn trong [js/package-policy.js](../../js/package-policy.js).

Lịch tuần/ngày và tỷ lệ thanh toán từng mốc được xác định sau khi chốt gói, quy tắc tính và nguồn tích hợp. Chưa có căn cứ trong dự án để coi một lịch hoặc tỷ lệ thanh toán là đã thống nhất.

## 5. Phần đã làm và phần cần để vận hành thật

**Đã có trong dự án:** demo tương tác HTML/CSS/JS, giao diện enterprise, xem thử A–D, các luồng nghiệp vụ và bộ tính mô phỏng, xuất Excel, bản báo cáo lưu/phiên bản trong trình duyệt; dataset 3 tòa/18 phòng/6 kỳ và hồ sơ đối chiếu 13 workbook. QA đã ghi nhận 236 assertion trình duyệt, 1.088 lượt smoke, 3.556 kiểm tra cấu trúc và 3.718 phép đối chiếu số học độc lập.

**Để nghiệm thu sản phẩm vận hành:** cần triển khai/xác minh backend, cơ sở dữ liệu, đăng nhập và quyền phía server, lưu trữ tài liệu, nhập Excel theo gói, OCR hợp đồng khách thuê thật, kết nối OA và các tác vụ chạy nền thuộc gói; tiếp đó triển khai, sao lưu, nạp dữ liệu và UAT. Các đầu ra demo là căn cứ thiết kế và kiểm thử, chưa chứng minh các thành phần này đã hoạt động thật.

Dữ liệu 3 tòa/18 phòng là bộ trình diễn hiện tại. Số tòa/phòng/người dùng được hỗ trợ trong bản vận hành, khối lượng dữ liệu ban đầu và yêu cầu hiệu năng cần ghi trong phạm vi ký kết.

## 6. Các điều kiện phải ghi khi chốt giá

- Số mẫu Excel, số mẫu hợp đồng khách thuê dùng OCR và danh sách trường cần đọc, biểu mẫu hợp đồng, biểu phí, loại báo cáo và các quy tắc ngoại lệ được áp dụng.
- Phạm vi dữ liệu đầu kỳ: lấy từ nguồn nào, bên nào làm sạch/xác nhận, số lần chuyển đổi và đối chiếu.
- Quy tắc lương `/90` hay `/100`, TH1 cọc/thu trước nhiều tháng, cách phân chia phí và ý nghĩa vốn cổ phần phải được xác nhận trước khi dùng số liệu chính thức.
- Phí OCR/OA, máy chủ, lưu trữ, tên miền, thuế và bảo trì: ghi rõ khoản đã gồm/chưa gồm, bên thanh toán và thời hạn hỗ trợ; chưa tự coi nằm trong khoảng giá trên.
- Mẫu mới hoặc thay đổi quy tắc sau khi chốt phạm vi được ghi thành yêu cầu thay đổi, kèm ảnh hưởng chi phí và lịch bàn giao.

## 7. Câu giới thiệu có thể dùng với khách

> TIMEHOUSE có bốn gói phát triển A–D, giá dự kiến từ 50 đến 100 triệu đồng. Mỗi gói xác định rõ chức năng được phát triển, giới hạn xử lý và nội dung bàn giao. Gói nào cũng vận hành đủ một kỳ, xuất hai báo cáo đúng mẫu đã ký và có OCR hợp đồng khách thuê, Zalo OA theo giới hạn gói: A làm bằng nhập tay; B thêm nhập liệu, xử lý hàng loạt và đối soát nhanh hơn; C thêm tự động hóa có giới hạn; D thêm chốt bản, khóa kỳ và so sánh phiên bản. Khách lựa chọn gói theo nhu cầu sử dụng, đối chiếu giới hạn triển khai và điều kiện nghiệm thu trước khi chốt phạm vi.

Căn cứ: [ma trận chức năng](../../js/features.js), các cập nhật CR trong mã dự án, [cấu hình giá](../../js/store.js), [decision log](TIMEHOUSE_MOCKUP_DECISIONS.md), [bàn giao dataset và QA](TIMEHOUSE_DATASET_QA.md).

## 8. UI giới thiệu và cách gửi khách (24/10/2026)

Trang `index.html?previewPackage=A#/` có thẻ giá A–D, phần chi tiết gói đang chọn, ví dụ sử dụng, tiêu chí nghiệm thu, bảng so sánh tám nghiệp vụ, bảng 52 chức năng, sáu mốc bàn giao và giải đáp. Chọn gói cập nhật đồng thời nội dung, liên kết xem demo và liên kết chia sẻ; không đổi dữ liệu nghiệp vụ. Drawer chọn gói trong ứng dụng dùng cùng nội dung, có đường trở lại trang giới thiệu.

Nút **Sao chép liên kết** tạo URL trang giới thiệu đúng gói, bỏ tham số QA. Dùng URL website đã triển khai để gửi khách; địa chỉ localhost hoặc file trên máy chỉ phục vụ kiểm tra tại máy. Bản giới thiệu phân biệt demo mô phỏng với phạm vi cần triển khai thật, không tự cam kết thời gian, tỷ lệ thanh toán hoặc chi phí dịch vụ chưa thống nhất.

**QA CR-PKG-OPS:** [261 assertion trình duyệt](../qa/package-policy/summary.json), gồm 55 kiểm tra chính sách và 206 hồi quy; smoke 1.088/0 lỗi, mapping 156/156. Quét 1.744 biến thể màn và 432 dialog ở 375/768/1024/1440px không lỗi bố cục/tab/input. Có kiểm guard handler/deep link/dialog sau hạ gói, bảo toàn nháp/dữ liệu, OCR/OA, hóa đơn, thu tiền, cọc, lương/cổ phần và báo cáo. 2.524 chỉ tiêu tài chính khớp baseline đã lưu; 3.718 phép đối chiếu Decimal đạt. Lint UI không có phát hiện. Trình duyệt QA là Chromium; Firefox/Safari chưa kiểm trong đợt này.

Nguồn chung `js/package-policy.js` nạp sau registry/CR và trước các view. `TH.requireFeature(incId)` là helper nội bộ trả boolean, mở giải thích khi khóa gói; không cấp thêm quyền vai trò. Giữ API ngoài, ID, schema 12 và dữ liệu đã lưu. Phiếu thu mới có metadata `clientRequest` tùy chọn để chống gửi lại cùng yêu cầu; bản cũ không cần migration. OCR/OA vẫn mô phỏng, không gọi dịch vụ thật.

Ảnh các gói: [A desktop](../qa/package-policy/A-1440.png), [B desktop](../qa/package-policy/B-1440.png), [C desktop](../qa/package-policy/C-1440.png), [D desktop](../qa/package-policy/D-1440.png), [A mobile](../qa/package-policy/A-375.png), [B mobile](../qa/package-policy/B-375.png), [C mobile](../qa/package-policy/C-375.png), [D mobile](../qa/package-policy/D-375.png).

Đối chiếu hình trước/sau phần giới thiệu D: [trước desktop](../qa/package-policy/before-D-1440.png) → [sau desktop](../qa/package-policy/D-1440.png); [trước mobile](../qa/package-policy/before-D-375.png) → [sau mobile](../qa/package-policy/D-375.png). Ảnh trước lấy nguyên từ commit nền `fc8e64c`. [Đối chiếu số học](../qa/package-policy/arithmetic.json).

Ảnh bàn giao: [desktop — giới thiệu](../qa/pricing/desktop-intro.png), [desktop — mức giá](../qa/pricing/desktop-prices.png), [mobile — giới thiệu](../qa/pricing/mobile-intro.png), [mobile — phạm vi gói](../qa/pricing/mobile-scope.png), [mốc bàn giao desktop](../qa/pricing/milestones-1440.png), [mốc bàn giao mobile](../qa/pricing/milestones-375.png).

## 9. Phạm vi OCR đã chốt ngày 26/10/2026

> Vẫn còn hiệu lực sau khi cập nhật theo v2.1 ngày 27/10/2026 (ngoại lệ OCR/OA, xem đầu tài liệu).

OCR chỉ dùng để đọc hợp đồng khách thuê. Thông tin khách, phòng, giá thuê, phí và các trường khác được trích từ chính hợp đồng, sau đó người dùng rà soát, sửa và xác nhận trước khi lưu. Không bàn giao OCR riêng cho giấy tờ tùy thân, hợp đồng chủ nhà/thuê tòa, hóa đơn hoặc tài liệu khác.

- A: một mẫu hợp đồng khách thuê đã chọn.
- B: tối đa hai mẫu hợp đồng khách thuê; chỉ rõ trường cần kiểm tra.
- C: giữ giới hạn mẫu của B, thêm kiểm trùng và so khớp dữ liệu hợp đồng khách thuê.
- D: thư viện mẫu hợp đồng khách thuê đã duyệt và lịch sử sửa; số mẫu ghi trong báo giá.

M1 chốt mẫu hợp đồng và trường cần đọc; M2 nghiệm thu việc đọc, rà soát và xác nhận hợp đồng khách thuê; M5 nghiệm thu phần nâng cao của gói đã chọn. Giá tham chiếu giữ A 50–60, B 70–80, C 80–90, D 90–100 triệu đồng; lần cập nhật này sửa phạm vi, chưa điều chỉnh mức giá.

Đã đồng bộ trang giới thiệu, chi tiết gói, drawer chọn gói, bảng so sánh và ma trận 52 chức năng. F011 được trình bày là nhập tay/đính kèm giấy tờ khách; F012 là OCR hợp đồng khách thuê. Registry SRS gốc được giữ để đối chiếu lịch sử; nội dung hiệu lực lấy từ `js/package-policy.js`.

Kiểm tra lại bằng `tools/qa-pricing.playwright.js`: **50/50**, gồm bốn gói ở 375/768/1024/1440px, chọn/chia sẻ gói, bảng so sánh, drawer, điều hướng và smoke **1.088 lượt / 0 lỗi**. Không tràn ngang và không có lỗi JavaScript trong bộ kiểm tra. Ảnh và số liệu QA ở mục trước là bằng chứng của đợt 24/10; không dùng làm ảnh chụp cho lần cập nhật phạm vi này.
