# Trạng thái phiên làm việc — áp dụng CR_CUS_ANSWERS vào mockup (20/10/2026)

**Yêu cầu đang xử lý:** áp dụng bộ trả lời `docs/TIMEHOUSE_MOCKUP_CR_CUS_ANSWERS.md` (K-01…K-09) cho phần khách thuê (CR-CUS-01) của mockup.
**Tình trạng:** code đã sửa xong và qua kiểm tra cú pháp; smoke test toàn ứng dụng đã chạy đạt; **đang dở** ở bước chạy kịch bản QA-CUS trên trình duyệt và cập nhật tài liệu.

## 1. Đã làm xong (đã ghi vào file)

### 1.1 Dữ liệu — `js/data.js`

| Mã | Nội dung đã áp dụng |
| --- | --- |
| K-01 | Thêm vai trò **Trưởng phòng vận hành (TPVH)** vào `TH.BLD_ROLES` (tầng B); nhân sự NV-013; phân công PC-16/17 cho Cầu Giấy + Đống Đa. Thanh Xuân **không** có TPVH để demo “Chưa phân công”. Calc mới `C.areaHead` (TPVH), `C.teamLead` (Trưởng nhóm) — hai vai trò tách riêng |
| K-02 | `C.tenancyStates(ct)`: 1 trạng thái vòng đời (Đang thuê / Đã kết thúc) + nhãn theo trục: kết thúc (Phá HĐ), thời hạn (Sắp hết HĐ), bàn giao (Đã báo chuyển đi / Chờ bàn giao), tiền cọc (Chờ đối chiếu / Chờ duyệt / Đã duyệt chờ chi / Đã hoàn / Đã tất toán / Mất cọc / Chuyển sang HĐ mới / Hoàn cọc quá hạn), công nợ (Còn nợ / Quá hạn — tính từ hóa đơn & phiếu thu đã xác nhận). Trạng thái tính **theo từng HĐ** |
| K-03 | `TH.DEPOSIT_STATES` 9 trạng thái; hồ sơ cọc có `proposedBy / approvedBy / paidBy / paidAt / txnRef / forfeitAmount / forfeitBasis`. Hạn hoàn chỉ đặt khi HĐ có `terms.refundDays` (mẫu P302 → `dueAt = null`, không tự báo quá hạn) |
| K-04 | `TH.END_KINDS`, `endKind` trên HĐ; mức giữ cọc là số nhập + căn cứ + duyệt, không suy từ lý do chấm dứt. TX-202: mất cọc toàn bộ **theo quyết định đã duyệt** (NV-001) |
| K-05 | `TH.FEE_TYPES` 9 dòng: Điện, Nước, Internet, Thang máy (diễn giải trong DV chung), DV chung, **Gửi xe máy (0 đ, dòng riêng)**, Gửi xe đạp điện, Xe điện SM theo xe, **Sạc theo kWh (tách riêng)**. Dòng theo xe có `qtySource: 'vehicles' | 'manual'` |
| K-06 | `db.settings.expiryAlertDays = 35`; `TH.expiryDays()` đọc từ cấu hình; `TH.CUS_EXPIRY_DAYS` chỉ là mặc định |
| K-08 | Xe lưu **biển số thật** (giả lập), `status: pending | active | ended`, `from/to`, `brand`, `feeCode`; `TH.maskPlate()` che khi hiển thị; `C.plateDup()` chỉ báo trùng khi khoảng đăng ký chồng lấn (KH-018 bán xe cho KH-010 → không báo trùng). KH-001 có xe SM **chờ xác nhận** → chưa tính phí |
| K-09 | `TH.CONTRACT_TERMS` DAYDU / P302 gắn vào `ct.terms`; `renewals[].mode` = `amendment` (có file phụ lục) / `auto_if_applicable` (có bằng chứng kiểm tra); HĐ cũ **HĐ-CG201/24** của KH-003 → HĐ mới HĐ-CG201/25 (`previousContractId`), cọc chuyển qua phiếu PCC-2507-01 (`state: 'transferred'`) |

Kiểm tra bằng Node: 19 HĐ, 18 khách; trạng thái từng hồ sơ đúng; HS CG kỳ 09 = 72,3%; INV-2610-CG202 = 6.069.800 (không đổi).

### 1.2 Các file khác

- `js/store.js`: quyền mới `deposit.propose` (QL tòa, Kế toán), `deposit.approve`, `deposit.pay` (Kế toán; Admin có `*`), `vehicle.view` (QL tòa, Kế toán).
- `js/views/contracts.js`, `js/views/reports.js`, `js/app.js`: ngưỡng hết hạn đọc `TH.expiryDays()`; CON-03 ghi “(cấu hình)”.
- `js/views/system.js`: SYS-01 › tab *Sao lưu & vận hành* thêm thẻ **Cảnh báo hợp đồng sắp hết hạn** (chỉ Admin sửa, hành động `settings.expiry`).
- `js/cus-cr.js`: mô tả F006.B, F031.A, ghi chú gói CUS, `CUS_PACK` theo TPVH / luồng cọc; `js/views/qa.js`: PENDING thêm `F038: 'K-01'`.
- `js/views/customers.js` **viết lại**:
  - CUS-01: mỗi dòng = một **hồ sơ thuê (HĐ)**; cột *Trưởng khu vực (TPVH)* + dòng phụ *Trưởng nhóm*; bộ lọc thêm *Đã kết thúc*; xuất công nợ không có biển số.
  - CUS-02 nhận tham số là mã khách **hoặc mã HĐ**; tab *Lưu trú* có khối **Điều khoản áp dụng** (mẫu HĐ, gia hạn, báo trước 30 ngày của HĐ ≠ cảnh báo 35 ngày cấu hình, hạn hoàn cọc, chấm dứt trước hạn), timeline gia hạn theo chứng từ, bảng xe có *Xác nhận đăng ký / Ngừng sử dụng*.
  - Tab *Hợp đồng*: dòng phí với nguồn số xe (đã xác nhận / nhập tay), OCR 9 dòng (xe máy 0 đ, SM theo xe, sạc kWh không suy từ 400.000).
  - Tab *Tài chính*: theo từng HĐ; thẻ cọc đủ luồng **Mở hồ sơ → Ghi nhận bàn giao → Lập đối chiếu/gửi duyệt → Duyệt (người lập không tự duyệt) / Trả lại → Xác nhận thực chi (ngày + mã giao dịch, idempotent)**; chỉ bước cuối ghi `db.deposits` refund/forfeit. Hộp K-07 chỉ hiện khi bật ghi chú demo.
  - Lịch sử liên hệ (F010.C) chỉ ghi khi đổi SĐT / địa chỉ; thay đổi khác chỉ vào audit.
- Sửa lỗi phát hiện khi test: nút *Xác nhận* ở hộp thoại thực chi lấy mã giao dịch mặc định rỗng → đã thêm `defaultTxn(hc)` (python báo `ok`, **chưa kiểm tra lại nội dung file** — xem mục 3).

### 1.3 Kiểm tra đã chạy trên trình duyệt (server `127.0.0.1:8779`)

- Smoke test `#/demo/mapping`: **928 lượt · 0 lỗi** (94 biến thể + 22 dialog × 4 gói × 2 kỳ); route 44, tab 46; mapping 39/39 · 52/52 · 156/156.
- Số liệu không đổi: LNR Kinh doanh kỳ 09 16.937.599; Tổng kỳ 09 7.537.599; Kinh doanh kỳ 10 4.755.000; HS CG 72,3%; INV-2610-CG202 6.069.800.
- Luồng cọc DD-302 (HC-2610-01) chạy được đến bước duyệt: Admin lập đối chiếu → chip “Không tự duyệt hồ sơ do mình lập” → Kế toán duyệt (`approvedBy NV-002`) → chưa ghi sổ (đúng QA-CUS-03). Bước thực chi **chưa chạy được** do lỗi mã giao dịch nói trên.

## 2. Đang dở — cần làm tiếp theo thứ tự

1. **Kiểm tra lại fix `defaultTxn`** trong `js/views/customers.js`: `grep -n "function defaultTxn"`; đảm bảo regex là `/\D/g` (không phải `/\\D/g`); `node --check js/views/customers.js`.
2. **Tăng `TH.DATA_SCHEMA` 8 → 9** trong `js/data.js` (cấu trúc seed đã đổi: terms, vehicles status, depositCases mới) để trình duyệt tự nạp lại dữ liệu; cập nhật chữ “schema v8” trong README.
3. **Chạy lại kịch bản QA-CUS trên trình duyệt** (tải lại trang để seed mới), ghi kết quả:
   - QA-CUS-01 TPVH ≠ Trưởng nhóm (CG-101 có cả hai; TX-101 “Chưa phân công”).
   - QA-CUS-02 DD-102: Đang thuê + Sắp hết HĐ + Chờ bàn giao.
   - QA-CUS-03/04/17 DD-302: lập → gửi duyệt → duyệt (vai trò khác) → thực chi → ghi **một** dòng refund; gọi xác nhận lần 2 không ghi thêm; RPT-05 Tổng kỳ 10 đổi, Kinh doanh giữ 4.755.000.
   - QA-CUS-05 TX-202: Phá HĐ và Mất cọc là hai nhãn riêng, mức giữ có căn cứ + người duyệt.
   - QA-CUS-06/08/09 DD-102 (2 người): OCR → nước 2 × 120.000 = 240.000; SM 400.000/xe và sạc kWh là hai dòng; hóa đơn kỳ 10 cũ không đổi, hiệu lực từ kỳ 11.
   - QA-CUS-07 KH-001: xe máy 0 đ là dòng riêng; xe SM chờ xác nhận không tính.
   - QA-CUS-10/11/12/13: P302 không tự gia hạn; CG-102 gia hạn bằng phụ lục giữ mã HĐ; KH-003 hai HĐ nối tiếp + cọc chuyển; khối điều khoản hiện cả 30 ngày (HĐ) và 35 ngày (cấu hình).
   - QA-CUS-14/16: danh sách theo hồ sơ thuê (KH-003 hai dòng); sửa nghề nghiệp không ghi lịch sử liên hệ, sửa SĐT thì có.
   - Xe: xác nhận đăng ký; khai biển trùng khoảng đăng ký → cảnh báo và không cho xác nhận.
   - K-06: SYS-01 đổi 35 → 45 → danh sách sắp hết hạn tăng; đặt lại 35.
   - Quyền QL tòa: mở hồ sơ cọc được, không có nút duyệt/thực chi.
4. **Chụp màn hình soát bố cục**: CUS-01, CUS-02 (lưu trú với 2 HĐ của KH-003, hợp đồng, tài chính HĐ-DD302/25), thẻ cấu hình SYS-01; kiểm tra 375 px không tràn ngang.
5. **Tài liệu**:
   - `docs/TIMEHOUSE_MOCKUP_DECISIONS.md`: thêm §9.5 “Áp dụng CR_CUS_ANSWERS” — bảng trạng thái K-01…K-09 (PROPOSED / PENDING_APPROVAL / SOURCE_REQUIRED / BLOCKED), dữ liệu mẫu schema 9, phần chưa làm.
   - `docs/TIMEHOUSE_MOCKUP_QA.md`: §8.3 kết quả chạy lại + bảng QA-CUS-01…17.
   - `README.md`: schema v9, TPVH, luồng cọc, thẻ cấu hình, bước demo 6c.
6. **Dọn dẹp**: dừng server nền (task `bi94kx2rf`, cổng 8779); xóa thư mục `.playwright-mcp` nếu xuất hiện.
7. Gửi báo cáo tổng kết cho người dùng (tiếng Việt).

## 3. Những điểm trong file trả lời **chưa** đưa vào mockup (ghi rõ khi báo cáo)

- Quy tắc **prorate** dòng phí theo ngày hiệu lực (chỉ có “hiệu lực từ kỳ”).
- Override ngưỡng cảnh báo **theo nhóm tòa**; mới có cấu hình doanh nghiệp.
- Vòng đời HĐ đầy đủ `Nháp → Chờ hiệu lực → Đang hiệu lực → Đang kết thúc → Đã kết thúc / Đã hủy`: mockup mới có Nháp / Đang thuê / Đã kết thúc + nhãn.
- Bảng `customerAuditLog` riêng: đang dùng audit chung (`TH.log`) + `customerHistory` cho thông tin liên hệ.
- Che biển số theo vai trò ở màn chi tiết: mọi vai trò được mở CUS-02 hiện đều có `vehicle.view`; che chỉ áp dụng ở danh sách, tooltip, file xuất.
- K-07 “danh sách khách hoà”: `BLOCKED_BY_REQUIREMENT`, không dựng.
- Ngoài phạm vi HTML: ma trận quyền duyệt cọc thật, ký xác nhận nguồn (QA-CUS-15), Excel giá gói, SRS v2.3.

## 4. Tệp tạm của phiên (scratchpad)

`C:\Users\truon\AppData\Local\Temp\claude\c--Users-truon-Downloads-mockup\25dcf7b2-4b80-4602-a410-0c45a120adf8\scratchpad\`
- `cus2_data.py` — patch `js/data.js` (đã chạy).
- `cus2_misc.py` — patch store / contracts / reports / app / system / cus-cr / qa (đã chạy).
- `cus2_head.js` — phần đầu mới của `js/views/customers.js` (đã ghép, giữ nguyên phần OCR-CUS).
- Ảnh chụp `cus01.png`, `cus02_*.png`, `price_*.png` là của lần chạy **trước** khi áp dụng K-01…K-09; cần chụp lại.
