# TIMEHOUSE — Trả lời CR-CUS-01 và rà soát cập nhật mockup schema 7–8

**Ngày:** 20/10/2026  
**Đầu vào:** `Markdown đã dán (1).md` (§8–§9), `TIMEHOUSE_MOCKUP_DECISIONS_ANSWERS.md`, `TIMEHOUSE_MOCKUP_QA_ANSWERS.md`, `Hop_dong_khach_thue_P302_TH01_demo_dong_bo.pdf`, ảnh `sơ đồ tổ chức.jpg`.  
**Đối tượng:** PM, BA, FE/BE, QA, Codex.

> **Nguyên tắc xác nhận:** Đây là **bộ đáp án ĐỀ XUẤT để triển khai mockup**, không phải biên bản khách hàng đã phê duyệt. Những điều khoản hợp đồng áp dụng **theo hợp đồng/phụ lục cụ thể có hiệu lực**, không mặc định theo một mẫu hợp đồng khác. Các mục chưa đủ bằng chứng được gắn `PENDING_APPROVAL` hoặc `SOURCE_REQUIRED`. Không tự kích hoạt giao dịch, điều chỉnh công nợ, tự gia hạn hay hoàn tiền ngoài bản demo.

## I. Trả lời trực tiếp K-01 đến K-09

### K-01 — “Trưởng khu vực” có phải TPVH theo khu vực không?

**Chốt đề xuất cho mockup:** **Không đồng nhất “Trưởng khu vực” với “Trưởng nhóm”.** Sơ đồ tổ chức tham chiếu thể hiện `Quản lý tổng → TPVH 1/2/3 → nhân sự vận hành/kỹ thuật...`. Vì vậy **đề xuất** trường “Trưởng khu vực” lấy **TPVH chịu trách nhiệm khu vực/nhóm tòa**, còn “Trưởng nhóm” là một vai trò phân công **riêng**, nếu tồn tại ở thực tế.

- `building.operationsManagerId` hoặc bảng phân công vai trò `TPVH` (có phạm vi khu vực, ngày hiệu lực) là nguồn cho cột **Trưởng khu vực / Trưởng phòng vận hành**.
- `building.teamLeaderId` (nếu có) là nguồn cho **Trưởng nhóm**; `building.operatorId` là **Nhân viên vận hành**.
- Nếu chưa khai báo TPVH phụ trách khu vực, hiển thị **Chưa phân công**; không lấy trưởng nhóm thay thế một cách âm thầm.
- Phân quyền dữ liệu không tự suy ra từ nhãn chức danh. Vai trò truy cập và phạm vi tòa phải có cấu hình riêng.

**Cần PM xác nhận:** Công ty có sử dụng chính thức tên “Trưởng khu vực” thay cho “TPVH” không, và TPVH quản lý theo **khu vực, nhóm nhà hay danh sách tòa**?

**Trạng thái:** `PROPOSED`; nguồn sơ đồ tổ chức xác nhận có cấp TPVH, nhưng không xác nhận hai nhãn này là đồng nghĩa.

### K-02 — Một trạng thái chính và nhiều nhãn phụ có đúng không?

**Chốt đề xuất cho mockup:** **Đồng ý mô hình đa trạng thái**, nhưng tách các trục nghiệp vụ để tránh ghi một trường chứa nhiều trạng thái gây xung đột.

1. **Trạng thái vòng đời hợp đồng:** `Nháp` → `Chờ hiệu lực` → `Đang hiệu lực` → `Đang kết thúc` → `Đã kết thúc` (hoặc `Đã hủy` nếu hủy trước hiệu lực). “Phá HĐ” nên là **lý do/kịch bản kết thúc trước hạn** hoặc nhãn thể hiện bên cạnh trạng thái kết thúc.
2. **Nhãn thời hạn:** `Sắp hết hạn` theo cửa sổ cảnh báo đã cấu hình.
3. **Nhãn bàn giao:** `Chờ bàn giao`, `Đã bàn giao`.
4. **Nhãn tiền cọc:** `Chờ đối chiếu`, `Chờ duyệt hoàn`, `Đang hoàn`, `Đã hoàn`, `Hoàn cọc quá hạn`, `Mất cọc`.
5. **Công nợ:** `Còn nợ`, `Quá hạn`, tính từ hóa đơn và phiếu thu đã xác nhận, không ghi cứng vào trạng thái khách.

Ví dụ `DD-102` có thể đồng thời **Đang thuê + Sắp hết hạn + Đã thông báo chuyển đi/Chờ bàn giao**. Một khách có nhiều hợp đồng thì trạng thái thể hiện **theo từng hồ sơ thuê/hợp đồng**, không áp cùng trạng thái cho tất cả hợp đồng của khách.

**Quy tắc QA:** Nhãn `Đã hoàn` không được xuất hiện khi chưa có bút toán hoàn xác nhận; `Sắp hết hạn` không áp cho HĐ đã kết thúc; `Phá HĐ` không đồng nghĩa tự động với `Mất cọc`.

**Trạng thái:** `PROPOSED` — có thể dựng UI ngay; bảng chuyển trạng thái chính thức cần duyệt.

### K-03 — Ai duyệt hoàn cọc, khấu trừ gì, thế nào là hoàn tất?

**Chốt đề xuất quy trình:** `Chờ bàn giao → Đối chiếu tiền cọc/công nợ/tài sản → Chờ duyệt → Đã duyệt/Chờ chi → Đã hoàn` (cho phép `Từ chối/Yêu cầu bổ sung`).

**Phân quyền đề xuất:**
- **NV vận hành/Quản lý tòa:** lập hồ sơ bàn giao, ảnh/chứng từ, đề xuất khoản khấu trừ, **không tự duyệt hồ sơ do mình lập**.
- **Kế toán:** đối chiếu công nợ, tính số có thể hoàn, xác minh chứng từ/thực chi.
- **Admin/Quản lý được ủy quyền:** duyệt tiền hoàn hoặc ngoại lệ theo quyền được cấu hình; cơ chế hai lớp khi cần.
- **Kế toán/thủ quỹ được phân quyền:** xác nhận đã chuyển tiền kèm ngày thực chi/mã giao dịch. Chỉ lúc này chuyển `Đã hoàn` và ghi bút toán `deposit.refund` vào **dòng tiền**.

**Khoản khấu trừ được phép đưa vào màn đối chiếu**, nhưng mỗi khoản cần nguồn và điều kiện áp dụng: tiền thuê còn thiếu; phí dịch vụ/điện/nước chưa trả; hư hỏng, mất mát có biên bản/chứng từ và căn cứ hợp đồng; khoản phạt/chấm dứt sớm **chỉ nếu hợp đồng có điều khoản và người có thẩm quyền xác nhận**. Không tự áp một khoản phạt/khấu trừ theo mặc định.

`Tiền cọc được hoàn = max(0, Cọc đã giữ − Khấu trừ hợp lệ − Khoản cọc được xác nhận mất/được bù trừ khác)`.

- **Đang xử lý hoàn cọc:** mọi trạng thái trước khi xác nhận thực chi.
- **Đã hoàn:** đã có chứng từ chuyển/chi tiền được xác nhận, dù số hoàn bằng 0 thì không gọi là “đã hoàn tiền”; nên là `Đã tất toán cọc` nếu không phát sinh dòng hoàn.
- **Hạn hoàn 10 ngày:** Chỉ áp dụng **nếu HĐ/phụ lục thực tế ghi điều khoản đó** và xác định được ngày bắt đầu tính. Không có điều khoản thì hiển thị `Chưa xác định hạn`, **không tự báo quá hạn sau 10 ngày**.

**Lưu ý nguồn:** PDF mẫu P302 đã cung cấp yêu cầu đối chiếu cọc và chứng từ khi kết thúc, nhưng **không ghi thời hạn hoàn cọc 10 ngày**. File Markdown trích thời hạn này từ mẫu `Hop_dong_thue_phong_demo_day_du.pdf` chưa có trong tập tệp có thể đối chiếu hiện tại.

**Trạng thái:** Luồng và vai trò `PROPOSED`; SLA 10 ngày `SOURCE_REQUIRED`.

### K-04 — Phá HĐ có mất toàn bộ cọc, được hoàn một phần không?

**Chốt đề xuất:** **Cho phép 3 kết quả cọc: mất toàn bộ / mất một phần / được hoàn**, nhưng **chỉ theo hợp đồng thực tế và quyết định đã duyệt**. Không hardcode `kết thúc trước hạn → mất 100% cọc` toàn hệ thống.

- Kết thúc trước thời hạn chỉ ghi **lý do** `vi phạm`, `khách chủ động`, `hai bên thỏa thuận`, `đơn vị cho thuê chấm dứt`, ...; lý do này **không tự tính mức mất cọc**.
- Số cọc bị giữ được nhập hoặc tính từ điều khoản áp dụng rồi kiểm tra/duyệt: `deposit.forfeit`, có ngày hiệu lực, chứng từ, lý do và người duyệt.
- Phần còn lại đưa qua quy trình hoàn cọc K-03. Các khoản nợ hoặc bồi thường được đối chiếu để không ghi khấu trừ hai lần.
- Chỉ cộng phần **cọc đã bị giữ và đủ điều kiện ghi nhận** vào thu nhập kinh doanh; cọc mới và hoàn cọc chỉ đi qua dòng tiền, không ghi trùng vào P&L.

**Lưu ý nguồn:** PDF mẫu P302 đã cung cấp **không có điều khoản mặc định phá HĐ mất toàn bộ cọc**; bản Markdown dẫn một mẫu khác chưa kiểm chứng được. Cần bản ký thực tế/điều khoản mẫu gốc để quyết định chính sách mặc định.

**Trạng thái:** `PROPOSED`; quy tắc mất cọc `SOURCE_REQUIRED/PENDING_APPROVAL`.

### K-05 — Phí thang máy, sạc xe điện, xe máy 0 đồng và 7 loại phí

**Chốt đề xuất:** Bảng giá là **danh sách dòng phí theo hợp đồng, có cách tính và thời gian hiệu lực**, không cố định 7 dòng cho mọi hợp đồng. Với riêng PDF P302, có thể dùng **7 dòng mẫu đã xác minh** như sau:

| Dòng phí trong P302 | Cách tính | Đơn giá mẫu |
| --- | --- | ---: |
| Điện sinh hoạt | `meter_kwh` — kWh mới trừ kWh cũ | 4.000 đ/kWh |
| Nước | `per_person` | 120.000 đ/người/tháng |
| Internet | `per_room` | 100.000 đ/phòng/tháng |
| Dịch vụ chung | `per_person` | 120.000 đ/người/tháng |
| Xe máy | `per_vehicle` | 0 đ/xe/tháng |
| Xe đạp điện | `per_vehicle` | 150.000 đ/xe/tháng khi đăng ký |
| Xe điện dịch vụ SM | `per_vehicle` | 400.000 đ/xe/tháng khi đăng ký |

- **Phí thang máy:** Chưa thấy **dòng phí thang máy riêng** trong P302. Nếu thực tế đã bao gồm trong `Dịch vụ chung`, chỉ hiển thị **thành phần diễn giải**, không lập thêm hóa đơn thu một lần nữa. Chỉ tách phí riêng khi HĐ/biểu phí có quy định.
- **Tiền sạc xe điện theo kWh:** Mẫu P302 **chưa quy định** phí sạc theo kWh. Nếu có ở hợp đồng khác, cần tạo dòng phí riêng `charging_kwh`, chỉ số điện sạc (công tơ phụ hoặc số liệu xác nhận), đơn giá, người/xe chịu phí, hiệu lực. **Không đồng nhất** phí xe điện `400.000 đ/xe/tháng` với tiền sạc kWh.
- **Xe máy 0 đồng:** **Vẫn nên giữ dòng riêng** trong bảng giá và bản kê để lưu quyền sử dụng, số lượng/xe đăng ký và đối chiếu, nhưng thành tiền bằng 0; phần in hóa đơn có thể tùy chọn ẩn dòng 0 đồng.
- **Giá theo dataset demo cũ:** Không ghi đè hóa đơn đã lập; bảng giá mới chỉ áp dụng từ ngày/kỳ hiệu lực đã xác nhận. Không dùng các đơn giá của P302 cho các hợp đồng khác nếu không có căn cứ.

**Trạng thái:** 7 dòng và đơn giá P302 `CÓ CĂN CỨ` trong PDF demo; cách tách phí thang máy và sạc theo kWh `PENDING_APPROVAL`.

### K-06 — Thống nhất ngưỡng sắp hết hạn 35 ngày thay 45 ngày?

**Chốt đề xuất:** **Đồng ý 35 ngày làm giá trị mặc định của mockup**; ở `CON-03` người dùng có thể lọc nhanh 30/35/45/60/90 ngày. **Không hardcode 35 cho mọi công ty hoặc mọi hợp đồng trong production** trước khi được duyệt. Có thể thiết kế `expiryAlertDays=35` ở cấu hình doanh nghiệp/nhóm tòa, cho phép override có phân quyền.

Cần phân biệt:
- **Cảnh báo vận hành 35 ngày trước hết hạn:** chỉ để liên hệ khách, kiểm tra gia hạn.
- **Thời hạn khách phải báo trước 30 ngày** (nếu có trong hợp đồng): nghĩa vụ/thông số pháp lý khác, không tự thay bằng 35 ngày.

**Trạng thái:** `PROPOSED` cho mockup; `PENDING_APPROVAL` để thành chính sách toàn hệ thống.

### K-07 — “Danh sách khách hoà” là gì?

**Trả lời:** **Chưa có định nghĩa đủ để chốt nghiệp vụ**. Cụm “khách hoà” trong file có thể là tên nội bộ hoặc lỗi gõ; không có căn cứ xác định đó là khách ở ghép, khách hòa giải nợ, khách có số dư bằng 0 hay một phân nhóm khác. **Không tự suy đoán hoặc tạo báo cáo.**

**Xử lý mockup ngay:** giữ khối **“Cần làm rõ — Danh sách khách hoà”** ở trạng thái `DRAFT` trong khu vực công cụ demo/ghi chú, hoặc ẩn khỏi menu nghiệp vụ của khách cho tới khi PM chốt.

**Cần cung cấp để hoàn tất:** tên chính xác; mục đích sử dụng; tiêu chí đưa khách vào/ra danh sách; các trường; người được xem/sửa; dữ liệu nguồn; cách lọc/xuất; có tác động tới cọc/công nợ hay không.

**Trạng thái:** `BLOCKED_BY_REQUIREMENT` — không tính đã hoàn tất chức năng.

### K-08 — Biển số có cần mask, có cần trường xe khác không?

**Chốt đề xuất:** **Có mask một phần trong danh sách tổng quan, tooltip, báo cáo xuất rộng hoặc ở vai trò không có quyền dữ liệu chi tiết.** Ở màn chi tiết chỉ nhân sự được phân quyền mới được xem biển số đầy đủ để kiểm soát phương tiện. Không dùng mask trong dữ liệu lưu trữ: cần lưu giá trị thực để so khớp và chống trùng.

**Trường phương tiện đề xuất:** mã xe, khách/hồ sơ thuê, tòa/phòng, loại xe, biển số (có thể trống), màu, nhãn hiệu/kiểu xe (tùy chọn), ghi chú, ngày đăng ký, ngày ngừng, trạng thái đang sử dụng, dòng phí áp dụng; ảnh/giấy tờ nếu có và được phép thu thập.

- Với xe không có biển: cho phép `plate=null` + loại/nhận dạng khác, **không tạo biển số giả**.
- Kiểm trùng cùng biển số khi có **khoảng thời gian đăng ký chồng lấn**; có trường hợp hai hồ sơ liên tiếp cùng xe nên không báo trùng tuyệt đối theo lịch sử.
- Đồng bộ số xe **đã xác nhận đăng ký** với tính phí, không tính thẳng theo số xe khai báo chưa được duyệt; hỗ trợ `0 đ`.

**Trạng thái:** `PROPOSED`.

### K-09 — Gia hạn giữ mã HĐ hay tạo HĐ mới?

**Chốt đề xuất:** **Cả hai trường hợp cần được hỗ trợ, theo chứng từ ký thực tế:**

1. **Gia hạn bằng phụ lục/điều khoản gia hạn cùng HĐ:** giữ **mã hợp đồng gốc**, tạo `renewal`/`contract_amendment` riêng (số lần N, thời hạn mới, ngày hiệu lực, căn cứ, người xác nhận và tệp phụ lục). Giữ lịch sử để không ghi đè kỳ cũ.
2. **Ký hợp đồng mới:** tạo **mã HĐ mới**, liên kết `previousContractId` với HĐ cũ; quan hệ khách–phòng/hồ sơ ở cùng dòng lịch sử. Cọc, công nợ cũ chuyển sang HĐ mới **chỉ qua phiếu đối chiếu/chuyển cọc được duyệt**, không tự động nhân đôi cọc.
3. **Gia hạn mặc nhiên:** chỉ kích hoạt nếu **HĐ thực tế có điều khoản cho phép**, thời điểm và điều kiện áp dụng được xác minh; cần lưu dấu vết kiểm tra thông báo chấm dứt, kỳ gia hạn và quyết định. **Không tự gia hạn 12 tháng trên mọi HĐ.**

**Lưu ý nguồn quan trọng:** PDF P302 đã cung cấp nói rõ **mọi gia hạn phải hai bên xác nhận bằng văn bản trước khi hết hạn**; không ghi cơ chế mặc nhiên 12 tháng/không báo trước 30 ngày. Quy tắc tự gia hạn trong file Markdown dẫn từ mẫu `Hop_dong_thue_phong_demo_day_du.pdf` khác, chưa có bản đó để kiểm tra. Vì thế **P302 chỉ nên dùng luồng gia hạn có xác nhận văn bản**.

**Trạng thái:** `PROPOSED` cho cấu trúc; auto-renew `SOURCE_REQUIRED` + `PENDING_APPROVAL`.

## II. Kết luận về §8 — các quyết định đã áp vào mockup schema 7

Phần §8 **là báo cáo tiến độ và thay đổi**, không phải danh sách câu hỏi mới. Không yêu cầu đảo lại các quyết định đã áp, nhưng cần giữ ranh giới:

| Nhóm | Kết luận cho Codex | Mức sẵn sàng |
| --- | --- | --- |
| G-01/G-02/D-04 | Giữ M5/M10/M15 lũy kế, tính A/B/C/D như bản nháp, phân biệt HS và lấp đầy; giao dịch sau 15 vẫn trừ công nợ | Mockup `PROPOSED` |
| G-03, D-06 | Công thức TH1 cọc/thu 3 tháng và mẫu số lương `/90` hay `/100` chưa duyệt | `BLOCKER` nếu muốn chạy lương thật |
| G-04, R-01, R-03, R-07 | Tách P&L theo kỳ và dòng tiền thực tế, không cộng cọc mới/hoàn cọc vào DT/CP kinh doanh; ghi chi phí thuê chủ nhà thuộc kỳ (có nhãn ước tính nếu chưa chốt) | `PROPOSED` |
| R-02, D-03 | Chưa có quy tắc tổng quát phân bổ dịch vụ và nước theo người/m³ | `PARTIAL` |
| R-08, D-07 | Chia cổ phần/vốn chỉ tái hiện mẫu, không tự tạo chi/hoàn vốn | `PENDING_APPROVAL` |
| D-08, PKG | Giá A–D thiếu Excel đối chiếu; thay đổi CR phải PM duyệt | `SOURCE_REQUIRED` |
| D-09 | RTM 208 hàng hữu ích để truy vết nhưng không thay thế test nghiệp vụ, chứng từ và sign-off | `PROPOSED` |
| QA bổ sung | In/PDF thật, accessibility, Firefox/Safari, phân quyền backend, 88 frame Figma chưa được chứng minh bởi QA HTML | `NEEDS_TEST` |

**Các số liệu schema 7 được tác giả Markdown báo cáo**, không coi là phép đối chiếu chứng từ độc lập: LNR RPT-05 Kinh doanh kỳ 09 `16.937.599`; Tổng kỳ 09 `7.537.599`; Kinh doanh kỳ 10 `4.755.000`; HS CG kỳ 09 `72,3%`. QA cần tái chạy đối chiếu sau mọi thay đổi quy tắc và dataset.

## III. Yêu cầu triển khai CR-CUS-01 cho Codex (không tự suy đoán chính sách)

### 1. Data model tối thiểu

- `customers`: thông tin cá nhân đã phân quyền, nghề nghiệp, thường trú, ghi chú. Thay đổi thông tin khách không nhất thiết là sự kiện **lịch sử liên hệ**; nên tách `customerAuditLog` và `contactHistory` để tránh ghi sai ý nghĩa.
- `tenancies/contracts`: `contractId`, `customerId`, `roomId`, thời hạn, trạng thái, lý do chấm dứt, link HĐ cũ, phiên bản hợp đồng, điều khoản gia hạn, cấu hình cảnh báo.
- `contractRenewals`: `renewalId`, `contractId`, `mode=amendment|new_contract|auto_if_applicable`, ngày hiệu lực, thời hạn mới, căn cứ/tệp, trạng thái phê duyệt.
- `feeSchedules/contractFees`: 1–N dòng phí/1 HĐ, `feeCode`, `pricingMethod`, `unitPrice`, `quantitySource`, `effectiveFrom/effectiveTo`, rule prorate, chứng từ/phiên bản. Hóa đơn đã phát hành không thay đổi retroactive.
- `vehicles`: xe gắn với hồ sơ thuê, loại, biển (nullable), nhận dạng phụ, ngày hiệu lực, dòng phí và trạng thái; quyền hiển thị/mask riêng.
- `depositCases`: hồ sơ cọc gắn HĐ, biên bản bàn giao, các khoản khấu trừ có chứng từ, tiền đề nghị/duyệt/đã thực chi, hạn hoàn (nullable), người lập/duyệt/xác nhận, chứng từ thanh toán, trạng thái.
- `deposits/ledger`: sự kiện tách `received`, `forfeited`, `refunded`, `transfer_to_new_contract` có định danh giao dịch, ngăn trùng lặp/idempotency.
- `assignments`: TPVH theo khu vực/nhóm tòa, Trưởng nhóm, NV vận hành, kỹ thuật... là các loại phân công **khác nhau**; phân quyền người dùng tách biệt.

### 2. Phạm vi giao diện

- `CUS-01`: cột mã phòng/tòa, tên khách, TPVH/trưởng khu vực **đúng vai trò**, NV vận hành, công nợ, Zalo, trạng thái chính + badge; bộ lọc; export có quy tắc mask.
- `CUS-02 / Thông tin lưu trú`: sửa hồ sơ khách, phương tiện; hiển thị thời gian HĐ, trạng thái và timeline gia hạn; không cho sửa trực tiếp ngày hiệu lực ở tab hồ sơ.
- `CUS-02 / Hợp đồng`: hợp đồng hiện tại/cũ; dòng phí theo chứng từ; hiệu lực; file; OCR chỉ điền **nháp để xác nhận**, không tự ghi DB/lập hóa đơn.
- `CUS-02 / Tài chính`: công nợ theo hóa đơn/phiếu thu xác nhận, hồ sơ hoàn cọc, dữ liệu khấu trừ và chứng từ; không tự chuyển `Đã hoàn` khi mới bấm duyệt.
- `CON-01/03`: cảnh báo mặc định 35 ngày cho **demo**, cấu hình có hiệu lực riêng, HĐ hết hạn/đã kết thúc không bị đếm trùng.
- `RPT-05`: tiền cọc đã hoàn chỉ làm đổi **dòng tiền/chế độ Tổng theo mẫu**, không làm đổi P&L kinh doanh nếu không có nghiệp vụ khác.

### 3. Gói A/B/C/D

Giữ tầng CR đang mô tả trong §9.2 **cho mục đích preview**, **không ngầm xác nhận phần mở rộng thương mại**. Đặc biệt `Hoàn cọc/Phá HĐ` đặt ở **A (CR)** là quyền hiển thị/xử lý tối thiểu được đề xuất; thao tác duyệt hoàn phải tuân quyền nghiệp vụ, **không phụ thuộc chỉ vào gói**. Việc OCR đọc bảng giá, so khớp xe–người, lịch sử sửa giá theo tầng B/C/D tiếp tục giữ `PROPOSED`, vì file Excel giá gói gốc và SRS v2.3 chưa được xác minh đầy đủ.

## IV. Checklist kiểm thử nghiệp vụ cần bổ sung

| ID | Kịch bản | Kết quả kỳ vọng |
| --- | --- | --- |
| QA-CUS-01 | Tòa có TPVH và trưởng nhóm khác nhau | CUS-01 hiển thị đúng hai vai trò, không đồng nhất |
| QA-CUS-02 | Một HĐ đang hiệu lực, gần hết hạn, đã báo chuyển đi | Một trạng thái chính và nhiều badge không mâu thuẫn |
| QA-CUS-03 | Hoàn cọc: chưa bàn giao, chưa duyệt, đã duyệt nhưng chưa chi | Không ghi `refund` và chưa hiển thị `Đã hoàn` |
| QA-CUS-04 | Xác nhận đã chuyển cọc, thử xác nhận 2 lần | Chỉ sinh một bút toán hoàn; báo cáo dòng tiền đổi đúng một lần |
| QA-CUS-05 | Chấm dứt trước hạn nhưng có thỏa thuận hoàn 1 phần | Không ép mất 100% cọc; có chứng từ/phê duyệt |
| QA-CUS-06 | HĐ P302 có nước theo người | Hai người: phí nước 240.000đ/tháng; không nhân m³ |
| QA-CUS-07 | Xe máy miễn phí, xe đạp điện có phí | Hai dòng được lưu; phí 0 đồng không tăng hóa đơn; số xe đủ căn cứ |
| QA-CUS-08 | Xe điện dịch vụ SM 400.000 đ/xe; xe khác tính sạc theo kWh | Không tính chung hai hình thức hay suy ra đơn giá kWh từ 400.000 |
| QA-CUS-09 | Dòng giá mới chỉ có hiệu lực tháng sau | Hóa đơn cũ không bị tính lại |
| QA-CUS-10 | HĐ P302 hết hạn và chưa có văn bản gia hạn | **Không tự gia hạn** |
| QA-CUS-11 | Phụ lục gia hạn cùng HĐ | Mã HĐ giữ nguyên; có revision/renewal riêng, không trùng cọc |
| QA-CUS-12 | Ký HĐ mới nối tiếp | HĐ mới có mã mới, liên kết HĐ cũ, công nợ/cọc qua phiếu chuyển riêng |
| QA-CUS-13 | Cảnh báo 35 ngày, HĐ có mốc báo trước 30 ngày | Hai mốc không bị ghi đè lên nhau |
| QA-CUS-14 | Khách có nhiều HĐ và xe có/không biển | Danh sách theo hồ sơ thuê; xe nullable plate; mask theo quyền |
| QA-CUS-15 | Ký xác nhận dữ liệu nguồn từ khách hàng | Không thay `SOURCE_REQUIRED`/`DRAFT` thành `APPROVED` trước phê duyệt |
| QA-CUS-16 | CUS-02 chỉnh dữ liệu khách | Có audit log; chỉ tạo contact history khi thực sự liên hệ |
| QA-CUS-17 | Hoàn cọc kỳ 10 được xác nhận | P&L kinh doanh không ghi hoàn cọc thành chi phí, dòng tiền có khoản ra |

## V. Những quyết định bắt buộc còn cần khách hàng/PM xác nhận

1. **K-01:** Tên và phạm vi cấp quản lý khu vực: TPVH hay người khác? Sơ đồ nhân sự áp dụng hiện tại?
2. **K-03/K-04:** Ma trận quyền duyệt cọc; chính sách khấu trừ/phạt, thời hạn hoàn theo loại HĐ và điều khoản nào áp dụng.
3. **K-05:** Phí thang máy có nằm trong dịch vụ chung không? Xe điện theo xe hay theo kWh, hay có cả hai dòng độc lập? Quy tắc prorate.
4. **K-06:** 35 ngày là mặc định doanh nghiệp hay chính sách bắt buộc mọi tòa? Quyền override.
5. **K-07:** Giải nghĩa chính thức “danh sách khách hoà”.
6. **K-09:** Loại HĐ nào có gia hạn mặc nhiên, loại nào cần xác nhận bằng văn bản, cách đánh số HĐ/phụ lục.
7. **Ngoài K:** File Excel giá 4 gói, SRS v2.3 gốc, file mẫu hợp đồng đầy đủ được nhắc trong Markdown, thẩm quyền và sign-off các CR.

**Kết luận cho Codex:** Chỉ triển khai giao diện, dữ liệu cấu hình, validation và luồng `DRAFT/PROPOSED` đối với mục chưa xác minh. Không kích hoạt tự gia hạn, tự xử lý cọc, tự tính phí mới, ghi sổ thực, tạo giao dịch tiền hoặc đưa nhãn `APPROVED` cho đến khi có quy tắc/nguồn được PM và khách xác nhận.
