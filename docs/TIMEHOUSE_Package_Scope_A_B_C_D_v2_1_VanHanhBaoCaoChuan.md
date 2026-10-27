# TIMEHOUSE — Package Scope v2.1: 4 gói đều VẬN HÀNH ĐỦ & BÁO CÁO CHUẨN MẪU

**Ngày đề xuất:** 27/10/2026  
**Trạng thái:** `PROPOSED — NEEDS CUSTOMER/TEAM SIGN-OFF`  
**Mục đích:** Thay thế định hướng phân gói trong `TIMEHOUSE_Package_Scope_A_B_C_D_v2_0.md` để cập nhật mockup, giới hạn UI/route/action, mô tả các gói trên landing, logic backend và test.  
**Phạm vi gói:** A/B/C/D là **gói giá tích lũy**, KHÔNG phải Phase 1A/1B/2/3 trong SRS v2.3.  
**Nguồn tham khảo:** `TIMEHOUSE_MOCKUP_DECISIONS.md` (CR-RPT-01, CR-BLD-01), `TIMEHOUSE_MOCKUP_QA.md`, SRS/function list/biểu mẫu nghiệp vụ trước đây. **Chưa coi bản demo hoặc số liệu giả là bằng chứng nghiệm thu dữ liệu thật.**

> ## QUYẾT ĐỊNH CHỦ CHỐT
> **A = ĐỦ VẬN HÀNH + ĐỦ HAI BÁO CÁO ĐÚNG MẪU ĐÃ KÝ, phần lớn NHẬP TAY.**  
> **B = A + NHẬP LIỆU/BATCH/ĐỐI SOÁT NHANH HƠN.**  
> **C = B + MỘT SỐ TỰ ĐỘNG HÓA CÓ GIỚI HẠN.**  
> **D = C + KIỂM SOÁT PHIÊN BẢN/KHÓA KỲ/QUẢN TRỊ.**  
> Không được khóa bất kỳ **đầu vào, nghiệp vụ hoặc kết quả thiết yếu để ra báo cáo đúng mẫu** ở B/C/D. Chỉ khóa *phương thức tự động hóa, tiện ích nâng cao, tốc độ xử lý, phân tích sâu*. Phần mềm A không được phụ thuộc gói B mới hoàn thành kỳ vận hành.

---

## 1. Bốn gói thương mại (chưa chốt giá hợp đồng)

| Gói | Giá phát triển tham chiếu | Kết quả bàn giao chung | Điểm khác biệt có thể bán thêm |
|---|---:|---|---|
| **A — Vận hành đầy đủ, nhập tay** | **50–60 triệu VNĐ** | Vận hành một kỳ đến báo cáo RPT-04 & RPT-05 đạt mẫu duyệt; nhập liệu và đối soát thủ công nhiều | Không cần B mới hoàn thành luồng |
| **B — Vận hành tối ưu** | **70–80 triệu VNĐ** | **Tất cả A** | Hàng loạt, import thường kỳ, gợi ý phân bổ, tra cứu chứng từ và đối chiếu thuận tiện |
| **C — Tự động hóa chọn lọc** | **80–90 triệu VNĐ** | **Tất cả B** | Tự phân bổ chi phí chung theo 1 rule; 1 OA/1 mẫu gửi có log; không OCR/automation vô hạn |
| **D — Kiểm soát nâng cao** | **90–100 triệu VNĐ** | **Tất cả C** | Chốt snapshot trong ứng dụng, khóa kỳ, so sánh 2 kỳ, bản xuất theo version |

- Gói cao **bao gồm toàn bộ gói thấp**: `A ⊂ B ⊂ C ⊂ D` (so sánh *phương thức làm*, không phải độ đúng của kết quả).
- **Độ chính xác và cấu trúc hai báo cáo ở cả 4 gói phải tương đương nhau**, dựa trên **cùng data model, cùng calculation/report engine và cùng mẫu xuất**. Không dùng 4 công thức báo cáo khác nhau theo gói.
- Mức giá nêu trên là *mục tiêu thương mại*, **chưa bảo đảm đủ effort**. Sau khi BE/FE/QA estimate, phải giảm tiện ích tùy chọn hoặc đổi giá — **không cắt lại nghiệp vụ/lỗi an toàn/báo cáo chuẩn**.
- Phí hạ tầng, Zalo/provider/tin nhắn, OCR (nếu mua thêm), thuế, SLA vận hành dài hạn tách riêng theo SOW.
- `?previewPackage=B` chỉ xem demo; gói được cấp thật lấy từ backend entitlement, không lấy từ query, localStorage hoặc cookie do client tự đặt.

## 2. Định nghĩa điều kiện “đủ vận hành” — BẮT BUỘC CÓ TỪ A

Bất kỳ gói nào đều phải vận hành được chuỗi dữ liệu **đầu kỳ → tòa/phòng → khách/hợp đồng → dịch vụ/chỉ số → hóa đơn → thu tiền/thu trước/cọc → phân bổ/nợ → trả phòng/quyết toán → chi phí → báo cáo → xuất kỳ**.

| ID | Luồng nghiệp vụ A phải làm được | Cách đơn giản nhất hợp lệ ở A | Điều kiện tối thiểu |
|---|---|---|---|
| OP-01 | Khởi tạo số liệu đầu kỳ | **Một lần** import mẫu cố định hoặc nhập tay với bảng đối chiếu | Danh mục tòa/phòng/khách/HĐ, nợ đầu kỳ, cọc, thu trước, chỉ số đầu kỳ; có biên bản chốt/mapping ID |
| OP-02 | Quản lý chủ nhà, tòa, phòng, người phụ trách | CRUD/form thủ công, chọn người phụ trách | Mã duy nhất; trạng thái có hiệu lực; lịch sử thay đổi tài chính tối thiểu |
| OP-03 | Quản lý khách thuê/hợp đồng thuê phòng | Tạo và điều chỉnh theo form; gia hạn thủ công bằng phụ lục/hồ sơ mới | Chống trùng hợp đồng đang hiệu lực của cùng phòng; giá/ngày/cọc/biểu phí đúng hiệu lực |
| OP-04 | Nhận phòng/đổi điều kiện/trả phòng | Form ngày thực tế, ảnh/biên bản, nhập chỉ số bàn giao | HĐ, phòng, ngày tính phí và công nợ giữ liên kết; không mất lịch sử |
| OP-05 | Chỉ số điện/nước và các dịch vụ | Nhập tay theo phòng/kỳ; phí theo người/phòng/công tơ cấu hình trước | Không hardcode giá chung; chặn số bất hợp lệ; ngoại lệ nhập điều chỉnh + lý do và quyền duyệt |
| OP-06 | Tính tiền lẻ kỳ & phí hợp đồng | **Một quy tắc prorate đã chốt** hoặc khoản điều chỉnh thủ công có chứng từ | Không bỏ doanh thu phát sinh do nhận/trả giữa tháng; ghi rõ cách tính trên hóa đơn |
| OP-07 | Lập, phát hành, điều chỉnh hóa đơn | Chọn **tòa + kỳ → tạo danh sách hóa đơn từ dữ liệu đã duyệt**, sửa các dòng lỗi thủ công; PDF/Excel | Chống trùng kỳ/phòng; không sửa đè hóa đơn đã phát hành; có hủy/điều chỉnh và dấu vết. B thêm preview/batch quản lý tiện lợi |
| OP-08 | Thu tiền, công nợ | Nhập phiếu thu; chọn **một hoặc nhiều hóa đơn/nghĩa vụ và số phân bổ bằng tay** | Thu thiếu/đủ/thừa, còn chưa phân bổ, trả trước, nợ cũ, thu sau kỳ; không phân bổ quá số dư, không tự nhận cọc là doanh thu |
| OP-09 | Cọc, giữ cọc, hoàn cọc | Chọn loại bút toán cọc và nhập số chứng từ thực tế | Nhận cọc ≠ doanh thu; hoàn cọc ≠ chi phí kinh doanh; cọc mất do vi phạm có xác nhận và căn cứ |
| OP-10 | Quyết toán trả phòng | Bảng nợ/phí/cọc/khấu trừ/hoàn, nhập tay khoản phát sinh rồi xác nhận | Thể hiện còn phải thu/phải hoàn; phiếu chi hoàn cọc thực tế; không khóa hồ sơ khi còn nghĩa vụ chưa xử lý nếu chưa có trạng thái hợp lệ |
| OP-11 | Hợp đồng chủ nhà & lịch phải trả | Nhập kỳ hạn/giá/nghĩa vụ, đánh dấu khoản đã thực chi | Tách **chi phí thuê thuộc kỳ** với **tiền thực trả**, tránh sai báo cáo lợi nhuận |
| OP-12 | Chi phí trực tiếp/chung | Nhập từng khoản theo loại, tòa, kỳ; khoản chung **chia tay** thành các dòng cho từng tòa | Tổng dòng phân bổ = nguồn; không phân bổ hai lần; lưu file, người nhập và người xác nhận |
| OP-13 | Lương, hoa hồng, sửa chữa, giá vốn dịch vụ | Kế toán **nhập số tổng hợp theo tòa/kỳ/chỉ tiêu** (nguồn Excel/chứng từ) | Không cần engine payroll/hoa hồng, nhưng số tiền/lý do/đối tượng phải có dữ liệu hợp lệ để lên đúng dòng báo cáo |
| OP-14 | Tài sản, mua sắm, các khoản khác | Nhập khoản mua/chi thực và đánh dấu nhóm dòng tiền hay giá trị tài sản theo chính sách | Không tự trừ chi mua sắm vào báo cáo kinh doanh theo cách sai chính sách; giữ hai cách xem nếu mẫu quản trị yêu cầu |
| OP-15 | Chỉ tiêu M5/M10/M15 / hiệu suất | Tổng hợp phiếu thu xác nhận theo ngày; hỗ trợ bảng điều chỉnh thủ công **có nguồn, nếu policy cho phép** | Thu sau ngày 15 không mất; không tính trùng khoản trả trước/cọc. Công thức chính thức phải do chủ nghiệp vụ duyệt |
| OP-16 | Báo cáo RPT-04, RPT-05 | Engine dựng hai mẫu từ dữ liệu chung, **chi phí/lương/phân bổ nhập tay khi chưa có tự động hóa** | Đúng hàng/cột/định nghĩa/chứng từ, đối soát mẫu và export; không cần B/C/D mới ra đủ các dòng đã duyệt |
| OP-17 | Thông báo/nhắc thu | Xem/tải danh sách nợ và nội dung thông báo để gửi bên ngoài | Gửi thủ công được, không phụ thuộc OA để xuất hóa đơn và theo dõi nợ |
| OP-18 | Quyền/bảo vệ/backup & UAT | RBAC theo vai trò/tòa, transaction, audit thay đổi tiền, backup/restore | **Không gate** các rào chắn an toàn vào gói cao; QA xuyên kỳ đạt UAT |

**Định nghĩa “thủ công” ở A:** Người dùng **nhập/chọn/xác nhận** nghiệp vụ có kiểm soát; hệ thống vẫn **tự cộng trừ, tính số dư, kiểm ràng buộc, liên kết dòng dữ liệu và tính báo cáo**. “Thủ công” **không** phải điền số tùy ý trực tiếp vào tổng doanh thu/lợi nhuận rồi coi là báo cáo chuẩn.

### 2.1. Ví dụ nghiệp vụ A so với B/C

- **Lương:** A nhập “lương quản lý tòa tháng 09 = X” kèm Excel và người xác nhận → ghi `expense_line(category=salary_manager, building, period)` → RPT-04/RPT-05 lấy đúng khoản này. B dễ tìm/chỉnh/đối chiếu hơn. **Không yêu cầu A tự tính bảng lương theo thâm niên/bậc.**
- **Chi phí chung:** A kế toán gõ mỗi tòa được phân bổ bao nhiêu và xác nhận tổng = tiền gốc. C hệ thống đề xuất phân bổ *theo số phòng* và người có quyền bấm xác nhận; **kết quả báo cáo như nhau** nếu đầu vào đã duyệt như nhau.
- **Thu khách đóng 3 tháng:** A nhập **một phiếu thu** và các dòng phân bổ thuê kỳ 1, kỳ 2, kỳ 3 và cọc (nếu có), bằng tay; engine theo dõi prepaid/current-period. B thêm chức năng *gợi ý phân bổ*, không độc quyền về nghiệp vụ prepaid.
- **Hóa đơn nhiều phòng:** A bấm tạo theo tòa/kỳ và xử lý dòng lỗi thủ công. B thêm bảng preview hàng loạt, lọc lỗi, xác nhận một lần, xử lý lại dễ hơn. **Không bắt nhập 1.400 hóa đơn bằng tay từng cái để dùng A.**
- **Trả phòng:** A nhập nghĩa vụ chưa thanh toán, khoản trừ, cọc được trả; hệ thống tự tính số cuối cùng và lưu phiếu hoàn theo thực chi. B có wizard hỗ trợ, không thay đổi công thức.

---

## 3. HAI BÁO CÁO CHUẨN — CHUNG CHO A/B/C/D

**SOP báo cáo:** Chốt trước bản Excel chuẩn/golden data cùng khách (file, sheet, cột/hàng, công thức, quy tắc làm tròn, người duyệt). Nếu biểu mẫu chính thức chưa được ký, status = `DRAFT`, không tuyên bố `100% MATCH`.

| Report | Nguồn mẫu tham chiếu | Mức bắt buộc từ A |
|---|---|---|
| `RPT-04` — Doanh thu theo tòa | `G1.31.8.26.xlsx` → sheet `BÁO CÁO THÁNG 8` | Giữ đúng cấu trúc chỉ tiêu đã ký: doanh thu, cọc mới/bị giữ/hoàn, phòng mới/trống/phá HĐ, doanh thu phòng và dịch vụ, giá vốn, chi thuê tòa, khoản lương/chi phí, LN gộp, LN ròng, tỷ lệ; xuất Excel chuẩn |
| `RPT-05` — Báo cáo kinh doanh tháng | `BÁO CÁO KINH DOANH THÁNG 8.xlsx` → `BÁO CÁO TỔNG`, `BÁO CÁO KINH DOANH`, các sheet theo tòa/nhóm nhà đã ký | Ma trận theo chỉ tiêu × tòa/nhóm/tổng; hai chế độ tổng và kinh doanh; xuất đầy đủ sheet đã ký; số Tổng = số từng tòa cộng lại theo quy tắc |

### 3.1. Quy tắc báo cáo không được giảm theo gói

1. **Same schema, same engine, same Excel template** cho A/B/C/D; chỉ khác nhau `dataEntryMethod`, `assistedTools`, `versionWorkflow`.
2. **Các dòng đầu vào có thể nhập thủ công**: lương, hoa hồng, chi thuê tòa, giá vốn dịch vụ, mua sắm, chi phí chung theo tòa, điều chỉnh theo mẫu quản trị; tất cả phải có `report_code`, `period`, `building_id`, `source_ref`, `amount`, `status`, `created_by`, `approved_by` (nếu cần).
3. **Các dòng tổng hợp/tỷ lệ** do engine tính từ dữ liệu hợp lệ (ví dụ tổng chi phí, LNG, LNR, 13 tỷ lệ nếu thuộc mẫu), **không cho nhập đè tùy ý**. Nếu mẫu lịch sử cần khác chuẩn kinh doanh, thêm dòng **điều chỉnh theo mẫu** có chứng từ và giải trình — không sửa công thức âm thầm.
4. **Phân biệt kinh doanh vs dòng tiền:** cọc nhận và hoàn cọc vào luồng tiền; cọc bị giữ có điều kiện ghi nhận; doanh thu và chi phí thuộc kỳ tách thực thu/thực chi. Không tính hai lần một khoản.
5. **Dữ liệu thiếu/chưa duyệt:** đánh `MISSING_INPUT` / `UNRECONCILED` / `DRAFT_POLICY`, liệt kê lỗi dòng trước export *bản chính thức*; không tự gán bằng 0 hoặc đoán. Có thể export bản **DRAFT có watermark/cảnh báo** để đối chiếu, **không được gọi báo cáo chuẩn đã chốt**.
6. **Report completeness:** nguồn đầu vào có thể khác nhau giữa các gói nhưng tất cả các mã chỉ tiêu/sheet thuộc **mẫu đã ký** vẫn hiển thị ở mọi gói.
7. **Bảng chia cổ phần ở mẫu G1:** Nếu khách xác nhận đây là **sheet/section bắt buộc của RPT-04**, **A phải xuất đúng mẫu với các giá trị nhập tay đã duyệt** (tỷ lệ, số vốn/hoàn vốn, phần LN được chia); **KHÔNG yêu cầu A có module cổ đông quản lý vốn, tự tính chia, tự sinh lệnh chi**. Nếu khách xác nhận đây là phụ lục không bắt buộc, có thể tách add-on; phải ký xác nhận, **không tự xóa section từ template**.
8. **M5/M10/M15:** lưu được thu theo ngày thực nhận và điều chỉnh theo kỳ. Công thức hiệu suất cuối kỳ chỉ thực thi sau khi chính sách được ký; A có thể dùng bảng kết quả được kế toán xác nhận và nhập số cấu phần có nguồn, nhưng không được trình bày là phép tính tự động đã thẩm định.
9. **Báo cáo A vẫn có khả năng tra nguồn tối thiểu**: mỗi số nhập tay hiển thị nguồn chứng từ, người nhập và kỳ. B chỉ nâng cấp tiện ích bấm chỉ tiêu mở danh sách chứng từ và so sánh chi tiết.
10. **Báo cáo A có thể lưu/xuất một bản ký duyệt thủ công kèm thời gian/hash/nguồn**. Đây **không** phải engine `snapshot/close/reopen` đầy đủ ở D; nếu điều chỉnh sau khi đã xuất thì phải ra phiên bản mới, không ghi đè bản đã phát hành.

### 3.2. Thước đo “chuẩn mẫu” (testable)

- Đúng **sheet**, thứ tự **hàng/cột**, nhãn, đơn vị và định dạng số đã thống nhất (kể cả các phần bắt buộc nhưng nhập tay).
- Với golden data do khách cung cấp, các giá trị RPT-04/RPT-05 bằng mẫu chuẩn **trong sai số làm tròn đã ký**, có log chênh lệch theo chỉ tiêu.
- Tổng doanh thu/chi phí/lợi nhuận nhiều tòa khớp Tổng công ty; phân loại chi phí, mua sắm, cọc và trả trước đúng logic đã ký.
- Khi dữ liệu thiếu: bản DRAFT hiển thị cảnh báo, **bản chính thức bị chặn**. Không đánh dấu hoàn thành chỉ vì có đủ giao diện và nút export.
- Ngay khi khóa policy và hoàn tất UAT, **A và D chạy cùng bộ test tính báo cáo phải cho cùng số**, nếu cùng dữ liệu đầu vào và kỳ.

---

## 4. Ma trận phân gói theo cơ chế nhập liệu — thay cho ma trận v2.0

**Ký hiệu:** `MANUAL` = người dùng nhập/chọn/xác nhận có kiểm tra; `ASSIST` = gợi ý hoặc batch; `AUTO-LIMITED` = tự động theo đúng 1 rule đã duyệt; `CONTROL` = quản trị phiên bản/khóa. Tất cả gói đều có luồng nghiệp vụ tương ứng.

| Module | A — MANUAL nhưng đầy đủ | B — ASSIST | C — AUTO-LIMITED | D — CONTROL |
|---|---|---|---|---|
| Chủ nhà/tòa/phòng | CRUD, tài liệu, phân công | Import định kỳ, lọc/cảnh báo tốt hơn | = B | = C |
| HĐ tòa/lịch trả | HĐ, kỳ trả và chi thuộc kỳ nhập tay | Gợi ý lịch từ HĐ 1 chu kỳ chuẩn | = B | Lịch sử/đối soát kỳ nâng cao nếu được estimate |
| Khách/HĐ phòng | Đủ nhận/ở/gia hạn/trả/chuyển phòng thủ công | Wizard/gợi ý, kiểm trùng nâng cao | = B | = C |
| Chỉ số/biểu phí | Nhập tay, tính phí theo cấu hình, ngoại lệ nhập điều chỉnh có duyệt | Bảng kiểm tra lỗi hàng loạt, prorate được đề xuất | = B | = C |
| Hóa đơn | Tạo theo tòa/kỳ, sửa lỗi, phát hành, PDF/Excel | Batch preview/lọc lỗi/xử lý lại | = B | Kiểm soát theo kỳ đã khóa |
| Thu tiền/hoàn/cọc/prepaid | Nhập phiếu, **chọn nhiều nghĩa vụ thủ công**, theo dõi nợ và tiền dư | Gợi ý phân bổ, bảng duyệt thao tác nhiều dòng | = B | Audit/report phiên bản sâu hơn |
| Thu/chi chủ nhà & chi phí khác | Phiếu thu/chi, phân loại và tách kỳ thực tế | Import chi phí định kỳ theo mẫu cố định (nếu được estimate) | = B | = C |
| Chi phí chung | Chia thủ công từng tòa, đối soát tổng | Bảng phân bổ tiện hơn | Tự tính 1 rule **theo số phòng** + preview/duyệt | Lưu nguồn snapshot rule khi chốt |
| Lương/hoa hồng | Nhập số liệu đã duyệt theo **tòa/kỳ/chỉ tiêu** | Import bảng kết quả theo 1 mẫu giới hạn (khi chốt WBS) | Có thể đổi OA lấy pilot một nhóm, không bật cả hai nếu vượt giá | Không ngầm có payroll engine đầy đủ |
| Báo cáo RPT-04/05 | **Đủ mẫu** + xuất + đối chiếu tối thiểu | Drill-down, trend 6 kỳ, phân tích chênh | = B | Snapshot, khóa kỳ, so sánh 2 kỳ |
| M5/M10/M15 | Số mốc thực thu + trường điều chỉnh/giải thích | Gợi ý hiệu suất từ công thức đã duyệt | = B | = C |
| Thông báo | Tải danh sách nội dung gửi tay | Xuất lọc/batch gửi tay | 1 OA/1 template, thao tác gửi, log | = C |
| OCR | Upload tệp + nhập tay | = A | = A | = A (**OCR thật add-on**) |
| Tài sản/sửa chữa | Sổ tài sản, phiếu sửa, tiền công/vật tư, bên chịu chi | Bộ lọc/danh sách công việc thuận tiện | = B | = C |
| Cổ đông theo báo cáo | Nếu mẫu bắt buộc: bảng input tay có xác nhận để xuất đúng RPT-04 | = A | = A | = A; quản lý cổ đông/ledger/lệnh chi đầy đủ **add-on** |
| Bảo mật, audit tối thiểu, backup | **BẮT BUỘC** | = A | = A | = A |

### 4.1. Các chức năng thật sự nằm ngoài gói chuẩn (add-on)

- OCR thực tế/provider/multi-template/confidence; scheduler OA nhiều mẫu/chiến dịch/escalation; payroll engine nhiều phòng ban và bảng luật thâm niên/phúc lợi; hệ thống cổ đông với vốn góp/hoàn vốn/lệnh chi; CRM/hoa hồng tự động nhiều nhánh; BI dashboard tùy chỉnh/forecast AI; ngân hàng tự động đối soát; tích hợp cổng thanh toán; SLA/HA 24/7.
- **Không** đưa các trường ghi nhận thủ công của những khoản này vào `OUT` nếu chúng **được dùng để xuất đúng báo cáo mẫu**. Ví dụ: không làm payroll engine ≠ không cho nhập *kết quả lương đã chốt*.

---

## 5. Feature entitlement dùng để cập nhật code

> **Lưu ý mapping:** Key bên dưới là key **đề xuất**, không phải tên module có thật trong repo. Codex phải đọc registry F001–F052, route, scene và code trước khi sửa; lập mapping 1:1 cho action. Không tự xóa F/FR cũ, không giả định 52 increment còn nguyên thương mại.

### 5.1. Feature CORE bắt buộc bật ở TẤT CẢ các gói

```text
owner.profile_edit
building.room_master
building.landlord_contract_payment_manual
customer.profile
contract.create_renew_transfer_checkout_manual
contract.pricing_effective_dates
contract.checkout_settlement_manual
meter.manual_and_exception_review
invoice.period_generate_manual_review
invoice.issue_pdf_excel_adjust_safe
payment.record_partial_full_overpaid
payment.allocate_multi_obligation_manual
payment.prepaid_and_deposit_ledger
receivable.balances_and_aging_basic
expense.direct_manual
expense.shared_manual_split_by_building
expense.salary_commission_manual_source
expense.owner_rent_accrual_and_cash
expense.repair_labor_material_manual
finance.management_report_adjustments_audited
finance.opening_balance_one_time_cutover
performance.milestone_collections
performance.manual_confirmed_components
report.rpt04_full_approved_template
report.rpt05_full_approved_template
report.required_shareholder_sheet_manual_if_signed
report.export_excel_pdf_approved_structure
report.minimum_source_audit
report.manual_signoff_export_history
notification.manual_export_and_send_outside
security.rbac_financial_audit
system.backup_restore_staging
```

### 5.2. Tính năng tăng tiện ích theo gói

```text
# B+
import.recurring_fixed_templates
invoice.advanced_batch_preview
payment.assisted_allocation_preview
contract.assisted_wizard_and_dupcheck
expense.assisted_import_if_sow
report.drilldown_and_cash_reconcile_detail
report.trend_6_periods

# C+
expense.auto_allocate_one_approved_room_rule
zalo.one_oa_one_template_manual_send_and_log

# D+
report.immutable_monthly_snapshot
report.close_period_reopen_by_policy
report.compare_two_periods
report.export_versioned_management_bundle
```

**Quan trọng:** `payment.allocate_multi_obligation_manual`, `invoice.period_generate_manual_review`, `report.rpt04_full_approved_template`, `report.rpt05_full_approved_template` đều có **minPackage A**. Nếu code cũ khóa ở B/C/D, phải sửa. Không chặn chức năng cốt lõi bằng việc khóa nguyên scene.

### 5.3. Pseudo-config (không copy đè mã hiện tại)

```ts
type Package = 'A' | 'B' | 'C' | 'D';
type Capability = 'manual' | 'assisted' | 'limited_auto' | 'controlled';
const tiers: Record<Package, { rank: number; invoice: Capability; payments: Capability; expense: Capability; reports: Capability }> = {
  A: {rank: 1, invoice: 'manual', payments: 'manual', expense: 'manual', reports: 'manual'},
  B: {rank: 2, invoice: 'assisted', payments: 'assisted', expense: 'manual', reports: 'assisted'},
  C: {rank: 3, invoice: 'assisted', payments: 'assisted', expense: 'limited_auto', reports: 'assisted'},
  D: {rank: 4, invoice: 'assisted', payments: 'assisted', expense: 'limited_auto', reports: 'controlled'}
};
const minTier = {
  'report.rpt04_full_approved_template':'A',
  'report.rpt05_full_approved_template':'A',
  'payment.allocate_multi_obligation_manual':'A',
  'invoice.period_generate_manual_review':'A',
  'report.drilldown_and_cash_reconcile_detail':'B',
  'expense.auto_allocate_one_approved_room_rule':'C',
  'report.immutable_monthly_snapshot':'D'
} as const;

// Production cần cả entitlement của organization, RBAC, data scope và trạng thái policy.
// Không cấp quyền từ ?previewPackage=. Nếu policy chưa duyệt, không publish actual.
```

### 5.4. Trạng thái UI

- Phân biệt `AVAILABLE_MANUAL`, `AVAILABLE_ASSISTED`, `AVAILABLE_AUTO`, `LOCKED_UPGRADE`, `POLICY_PENDING`, `PROVIDER_PENDING`, `FORBIDDEN`, `MISSING_DATA`.
- `LOCKED_UPGRADE` chỉ gắn lên **nút hỗ trợ nhanh/tự động**, **không** gắn lên tab nguồn dữ liệu/báo cáo bắt buộc.
- Nếu OA/OCR bị khóa thì cung cấp thao tác nhập/gửi thủ công ngay trên trang hoặc link điều hướng rõ.
- Demo vẫn dùng `?previewPackage=A/B/C/D` để đổi hiển thị. Backend production không được tin query/JS mode demo.
- Gói thấp không bao giờ ghi `Không có báo cáo` hay `Báo cáo rút gọn không đúng mẫu`; thay bằng `Báo cáo chuẩn mẫu — nhập tay và đối soát`.

---

## 6. Mapping scene/mockup cần Codex cập nhật (tham chiếu, chưa xác thực tên route hiện hành)

| Scene/màn | Thay đổi quan trọng |
|---|---|
| `OWN-01`, `OWN-02`, `BLD-01`, `BLD-02` | Gói A giữ toàn bộ field thực sự cần làm nguồn báo cáo, HĐ thuê tòa, lịch trả nhập tay, danh sách nhân sự/chi phí; B thêm import/kiểm tra |
| `CUS-01`, `CUS-02`, `OCR-CUS`, `OCR-CON` | A có nhập tay + lưu file; OCR thật add-on; không chặn tạo hợp đồng khi OCR không có |
| `CON-01`…`CON-03` | Gia hạn/đổi phòng/trả phòng/quyết toán tay phải có A; B chỉ thêm wizard hỗ trợ |
| `METER-01` | A có phương pháp tính phí theo người/phòng/chỉ số theo biểu phí đã ký và xử lý điều chỉnh có nguồn; B thêm cảnh báo/batch review |
| `INV-01`…`INV-03`, `INV-PREV` | A tạo theo tòa/kỳ, kiểm tra đơn giản và phát hành; B có advanced batch preview; không ép lập hóa đơn từng phòng |
| `PAY-01`, `PAY-02`, `PAY-APP` | A thu, prepaid, cọc, **phân bổ thủ công nhiều nghĩa vụ**, hoàn tiền; B mới trợ lý phân bổ/preview nâng cao; quyền duyệt luôn theo vai trò |
| `EXP-01` | A đủ mã chi phí phục vụ 43 dòng báo cáo và giá vốn; phân bổ tay được; C mới có nút “Tự tính theo số phòng” |
| `SAL-01`, `RPT-03` | A nhập **số tiền lương đã được xác nhận** theo khoản mục vào chi phí, xuất bảng nhập; không có payroll engine; hiển thị đường dẫn nguồn |
| `RPT-04`, `RPT-05` | **Đúng cùng 1 mẫu hàng/cột/Excel ở A–D**; không khóa dòng/section báo cáo ở A. B: drilldown/trend, D: snapshot/so sánh |
| `SHARE-01`, `SHARE-RESULT` | Quản lý cổ đông toàn phần add-on, **nhưng nếu sheet cổ phần thuộc mẫu RPT-04 đã ký thì A vẫn được nhập tay số đầu vào và xuất sheet mẫu** |
| `OA-01`, `OA-02` | A/B xuất nội dung cho gửi ngoài hệ thống; C thao tác gửi 1 OA/1 mẫu và log |
| `AUTH-01`, `SYS-01` | Không khóa phân quyền/backup/audit theo tier |

Codex **không nên xóa** logic mô phỏng cũ đang chạy. Ghi ma trận `old F001–F052 → core/action/enhancement/add-on`, đổi logic gate tối thiểu và cập nhật test; giữ khả năng so sánh trước/sau thay đổi bằng test fixtures. Nếu sử dụng `TH.PACKAGES` hoặc registry tương tự, đảm bảo landing, drawer, comparison, action guards, route và export thống nhất.

---

## 7. Mô hình dòng số liệu nhập tay (cốt lõi để báo cáo đúng)

Đây là cấu trúc logic, không áp đặt tên bảng hay kiến trúc DB hiện hành.

```text
financial_source_line:
  id; organization_id; building_id; accounting_period
  source_kind: INVOICE | RECEIPT | PAYMENT | DEPOSIT | EXPENSE | PAYROLL_RESULT | COST_ALLOCATION | SHAREHOLDER_INPUT | ADJUSTMENT
  source_ref; document_file_id; business_category; report_line_code
  amount_signed; currency; effective_date; cash_date (optional)
  entry_method: MANUAL | IMPORT | AUTO
  status: DRAFT | VERIFIED | APPROVED | VOID
  prepared_by; approved_by; approval_at; reason; replaces_id
  dedup_key; created_at; updated_at

report_run:
  period; template_id; template_version; source_cutoff
  validation_status: DRAFT | MISSING_INPUT | UNRECONCILED | READY | EXPORTED
  discrepancy_list; exported_by; exported_at; export_hash
```

**Quy tắc bất biến:**

- Chỉ dữ liệu đủ điều kiện được duyệt mới vào báo cáo `READY/EXPORTED`; sửa dữ liệu gốc tạo bút toán điều chỉnh hoặc bản sửa có dấu vết.
- Tổng phân bổ = số tiền nguồn trong giới hạn; có xử lý tiền chưa phân bổ và làm tròn; idempotent khi lập hóa đơn theo tòa/kỳ.
- Báo cáo lấy **cùng source ledger** cả khi giá trị nhập tay hay tạo tự động; không đặt engine B/C/D khác engine A.
- Chống nhập trùng chứng từ/số tiền; nếu số liệu nhập tay đã phản ánh trong phiếu chi khác thì **không cộng lần hai**.
- Khoản lương nhập tay là **dữ liệu kết quả lương**, không mặc định tạo nghĩa vụ chi/phiếu chi lần nữa trừ khi có thao tác xác nhận cụ thể.
- Các trường nhạy cảm (CCCD, tài khoản ngân hàng, ảnh chứng từ) cần mask và scope theo vai trò.

---

## 8. Bộ test nghiệm thu bắt buộc cho **mọi** gói

### 8.1. Vận hành nghiệp vụ

| TC | Scenario | Expected (A/B/C/D giống nhau về đúng/sai) |
|---|---|---|
| TC-01 | Khởi tạo đầu kỳ có HĐ, cọc, tiền thuê trả trước, số dư nợ, chỉ số điện nước | Không mất nghĩa vụ/số tiền; đối soát được nguồn |
| TC-02 | Phát hành hóa đơn theo tòa/kỳ, chạy lại | Không nhân đôi; PDF/số tiền đúng |
| TC-03 | Thu thiếu/đủ/thừa, một phiếu phân bổ nhiều hóa đơn | Đúng còn nợ và dư; không vượt số còn có thể phân bổ |
| TC-04 | Khách thanh toán tiền thuê 3 tháng và cọc trong một lần | Thu thuộc các kỳ/cọc tách biệt, không cộng vào doanh thu kỳ thu sai |
| TC-05 | Trả phòng giữa kỳ; tiền cọc, chi sửa chữa, hoàn cọc | Đủ nghĩa vụ, phải thu/phải trả và phiếu tiền hoàn; số tiền khớp |
| TC-06 | Tiền thuê chủ nhà trả 3 tháng nhưng báo cáo theo tháng | Dòng tiền khác chi phí thuộc kỳ theo chính sách ký |
| TC-07 | Lương và chi phí chung nhập tay đã ký duyệt | RPT-04/RPT-05 có đầy đủ khoản, không cần payroll/auto cost |
| TC-08 | Thiếu dữ liệu lương/chi phí hoặc rule tài chính chưa ký | Cảnh báo và chặn xuất **bản chính thức**; cho bản DRAFT có watermark nếu cần |
| TC-09 | Phân quyền quản lý tòa vs kế toán/admin | Không lộ data tòa khác; không tự duyệt phiếu của chính mình khi role policy cấm |

### 8.2. Báo cáo chuẩn mẫu

| TC | Scenario | Expected |
|---|---|---|
| TC-10 | RPT-04 trên golden data một kỳ | Đủ 100% hàng/cột/sheet của mẫu **đã ký**, bao gồm phần cổ phần nếu bắt buộc; giá trị khớp trong quy tắc làm tròn |
| TC-11 | RPT-05 trên golden data 2 kỳ | Chế độ Tổng & Kinh doanh khác nhau đúng bản chất, theo tòa/nhóm/tổng khớp |
| TC-12 | Chi phí lương/chi phí chung/cổ phần được nhập tay ở A | Kết quả chuẩn giống bản dữ liệu tương ứng tạo bởi C/D |
| TC-13 | Nợ, cọc nhận, cọc hoàn, cọc bị giữ, thu 3 tháng | Không tính trùng doanh thu/tiền nhận; có cầu nối kinh doanh↔dòng tiền |
| TC-14 | Xuất Excel hai báo cáo | Mở được, đúng công thức/format của template ký, không thiếu field/sheet |
| TC-15 | Bản báo cáo sau điều chỉnh | Có trace người sửa/nguồn; bản đã xuất trước không bị thay âm thầm |

### 8.3. Gating (mỗi A/B/C/D và UI)

- Test trực tiếp deep link tới tab và API; mọi gói được truy cập **màn lõi/đầu vào cần cho RPT-04/RPT-05**.
- A không có nút tự phân bổ/scheduler OA/snapshot nhưng **vẫn tạo được số liệu cuối và báo cáo đúng**.
- B bật công cụ hỗ trợ, số tính ra bằng A khi cùng dữ liệu.
- C bật hai tự động hóa giới hạn và fallback thủ công.
- D snapshot phải là bản của cùng engine; sửa kỳ đã chốt tuân thủ chính sách không sửa đè.
- `previewPackage` không tác động entitlement thật hoặc quyền dữ liệu.

**Điều kiện GO-LIVE:** không còn sai lệch P0 chưa giải trình ở thu/cọc/nợ/tổng báo cáo; có ít nhất 2 kỳ golden data được kế toán khách phê duyệt; backup/restore đã test; khách ký UAT. Nếu thiếu dữ liệu đầu vào/bản mẫu/phê duyệt thì chưa thể hứa “100% chuẩn mẫu” dù code đã xong.

---

## 9. Task cho Codex (copy trực tiếp)

> **YÊU CẦU:** Cập nhật prototype/mockup TIMEHOUSE từ Scope v2.0 sang v2.1 trong tài liệu này. **ĐIỀU KIỆN BẤT BIẾN:** A/B/C/D đều đủ luồng vận hành và RPT-04/RPT-05 chính xác cùng bản mẫu đã ký; gói giá cao chỉ tăng mức hỗ trợ/tự động hóa.  
> 1. Đọc cấu trúc dự án thực tế: `TH.PACKAGES`, UI registry, F001–F052, route/action handlers, module `js/pnl.js`, `js/reports-cr.js`, `js/bld-cr.js` (nếu tồn tại). Lập file mapping từ feature legacy → `CORE/MANUAL`, `B_ASSIST`, `C_AUTO`, `D_CONTROL`, `ADD_ON` theo §2–§6. Không tự suy đoán FR đã có.  
> 2. Sửa nội dung landing, drawer, bảng so sánh 52 dòng theo cách diễn đạt “đủ vận hành & báo cáo, khác mức độ tự động”; không cam kết feature OUT hoặc công thức Draft. Bảo đảm đúng giá tham chiếu một nguồn.  
> 3. Khôi phục ở A mọi action nguồn đã bị khóa theo v2.0: nhập số lương/chi phí/cổ phần theo mẫu, nhận-trả phòng/quyết toán, thu trước 3 tháng, cọc/hoàn, phân bổ nhiều nghĩa vụ **thủ công**, tạo hóa đơn theo kỳ, đầu kỳ/cutover, xuất đủ 2 mẫu. Không bật OCR/OA engine không thuộc gói.  
> 4. Báo cáo: một engine/format chung cho 4 gói; hỗ trợ nguồn manual hợp lệ và audit. Giữ section cổ phần nhập tay nếu khách xác nhận cần đúng nguyên bản RPT-04; phải ghi `PENDING CUSTOMER DECISION` nếu chưa được chốt.  
> 5. Đưa chức năng **tự động hoặc trợ lý** sang B/C/D; không chuyển **khả năng vận hành và kết quả đúng** khỏi A. Gating theo action; route có lõi phải mở ở A.  
> 6. Không dùng dữ liệu demo làm actual, không gán 0 cho dữ liệu thiếu, không tuyên bố chuẩn mẫu khi chưa có golden data/UAT.  
> 7. Chạy matrix test A/B/C/D (OP-01…18, TC-01…15), kiểm tra F001–F052 không có nút trắng/route chết, hành vi demo và số báo cáo trên fixture. Báo lại danh sách thiếu source hoặc chính sách còn OPEN; không tự chốt công thức.  
> 8. Đầu ra: code diff, `PACKAGE_FEATURE_MATRIX_v2_1.md`, checklist/QA result, phần việc chưa implement, assumption/CR và danh sách điều kiện cần khách ký. **Chỉ cập nhật code khi có source repo; không coi bản MD này là code đã sửa.**

---

## 10. Điều kiện thương mại và các quyết định bắt buộc chốt

| Mã | Vấn đề cần chốt | Chưa chốt thì xử lý thế nào |
|---|---|---|
| GATE-RPT-01 | File Excel chuẩn cuối cùng, bao gồm bảng chia cổ phần hay không, 13 tỷ lệ/sheet | Dùng template Draft, không tự xóa hàng; báo cáo chính thức chưa nghiệm thu |
| GATE-RPT-02 | Định nghĩa doanh thu Tổng/KD, cọc/hoàn/khấu trừ, mua sắm, dồn tích/tiền mặt | Không tính/chốt actual bằng chính sách suy đoán |
| GATE-RPT-03 | Chia chi phí chung, lương đầu vào, giá vốn điện/nước/dịch vụ | Chỉ nhập/preview Draft, chờ kế toán duyệt golden values |
| GATE-OP-01 | HĐ thuê phòng, trả trước nhiều tháng, prorate, cọc khi phá HĐ | Tạo quy tắc version Draft, không publish hóa đơn sai |
| GATE-OP-02 | Dữ liệu đầu kỳ và phạm vi file import/cutover | Chốt file mẫu, số kỳ/số tòa, nguồn đối soát và trách nhiệm làm sạch dữ liệu |
| GATE-PKG-01 | Effort thực tế, giá, phạm vi các trường nhập tay, C chọn OA hay pilot lương | BE/FE/QA review và ghi SOW trước khi ký; không cam kết giá bằng ước lượng miệng |

**Ranh giới cuối cùng:** “Có đủ vận hành và báo cáo” là **độ đầy đủ outcome**; “manual/assisted/auto/control” là **cách thực hiện và độ tiện ích**. Tuyệt đối không biến gói A thành phần mềm trình diễn thiếu một khâu vận hành hoặc xuất thiếu một mục trong báo cáo mẫu đã ký.
