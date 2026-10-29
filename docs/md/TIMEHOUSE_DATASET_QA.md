# TIMEHOUSE — Bàn giao excel-demo-v2

Ngày 29/10/2026. Dataset mô phỏng theo tài liệu khách hàng; **3 tòa T17 · S9 · G1 (mỗi loại nhà T/S/G một tòa), 18 phòng (7/6/5), 6 kỳ 05–10/2026**, schema 13. Thay cho bản `excel-demo-v1` (TH-CG/DD/TX, schema 12) ngày 23/10/2026.

## 1. Thay đổi so với excel-demo-v1

- **Mã theo file Excel.** Tòa là loại nhà kèm số (T17, S9, G1). Phòng là số phòng kèm mã tòa (201T17, 302S9, 102G1). Kéo theo đó, HĐ, hóa đơn, công tơ, lịch trả chủ, tài sản và báo cáo đều đổi mã. Bảng ánh xạ cũ → mới nằm ở [Ma trận dữ liệu](TIMEHOUSE_DATASET_MATRIX.md).
- **Hồ sơ tòa** theo sheet NVVH: khu vực, nguồn nhà, tình trạng thang máy, STK chủ nhà, kỳ trả chủ. Mã HĐ điện/nước/mạng theo dạng EVN `PD…`, Viwaco hoặc "Hóa đơn chủ nhà", mạng `HN…`; ghi chú "tt tự động".
- **Biểu phí theo tòa** (`TH.FEE_SCHEMES`), lấy từ cột dịch vụ của sheet NHÀ T/S/G:

  | Tòa | Biểu phí |
  |---|---|
  | T17 | Đúng biểu phí in trên mẫu HĐ: Internet 100k, DV chung 120k/người, nước 120k/người, xe đạp điện 150k, xe điện SM 400k |
  | S9 | Combo DV 120k/người, nước theo công tơ 35k/m³ |
  | G1 | Thang máy, vệ sinh, máy giặt tính theo người; có điện chung |

  Thêm loại phí `CLEAN` và `WASH`. P&L ghi riêng từng dòng vệ sinh, thang máy, máy giặt và xe điện.
- **Xe** khớp Điều 1.2: mỗi người một xe máy gửi miễn phí. Xe đạp điện là dòng `PARK_EBIKE` của HĐ.
- **Nhân sự theo sơ đồ tổ chức.** Có 4 đội: VP (văn phòng), VH1 (T17, S9), VH2 (G1), KD (kinh doanh), mỗi đội có trường `kind`. Tổng 18 nhân sự, thêm TPVH 2, trưởng nhóm KD, 2 sale và 1 nhân viên thị trường. Phụ cấp tách ăn trưa / xăng xe theo bảng lương tháng 8.
- **Hoa hồng** theo sheet HOA HỒNG THÁNG: 19 dòng, mỗi HĐ ký mới một dòng. Thành tiền = mức × giá chốt, với mức 0,5 / 0,35 / 0,3 / 0,25. Kênh là môi giới (tên hư cấu), CTV hoặc sale nội bộ. Dòng nằm trong 6 kỳ demo liên kết khoản chi marketing.
- **Sổ sửa chữa:** 13 việc. Việc công ty chi gộp vào khoản chi sửa chữa; việc khách chi đi qua phí phát sinh trên hóa đơn. Kỹ thuật viên gán theo phòng vận hành.
- **Hợp đồng khách thuê theo mẫu đầy đủ** (`Hop_dong_thue_phong_demo_day_du.pdf`). Các trường lấy từ dữ liệu:

  | Phần của HĐ | Lấy từ |
  |---|---|
  | Bên A | Đại diện nhóm nhà |
  | Bên B | Hồ sơ khách |
  | Điều 1–3 | Người/xe, 30 tài sản bàn giao, thời hạn bản ký |
  | Điều 4 | Giá, tiền nộp khi ký = cọc + tiền phòng kỳ đầu, chỉ số đầu kỳ, cọc, biểu phí, STK, nội dung chuyển khoản `{phòng} - {tòa} - {TÊN}` |

  Xem tại CUS-02 › Hợp đồng › **Xem bản hợp đồng theo mẫu**. OCR HĐ mới lấy giá, chỉ số và biểu phí của phòng trống 401T17 từ dữ liệu.
- **Mã trùng giữa các bảng đã tách:** tiền phòng phát sinh dùng `TPP-`, thu khác `TK-`, điều chỉnh lương `DCL-`.
- **Báo cáo:** tòa hiển thị theo thứ tự danh mục (T17, S9, G1). Hai báo cáo cố định được sinh lại: `BC04-202609-T17-v1` và `BC05-202608-T17.S9.G1-v1`.

## 2. Kiểm thử

| Bộ kiểm tra | Đạt | Bằng chứng |
|---|---:|---|
| Cấu trúc, quan hệ, mã Excel, đội nhóm, cổ phần, hoa hồng, sửa chữa, mask, **kiểm chéo HĐ theo mẫu ↔ hóa đơn/cọc/chỉ số/phiếu thu**, snapshot báo cáo, mốc tài chính | 4.323 | [structural-results.json](../qa/dataset/structural-results.json) |
| Số học độc lập Python Decimal | 3.778 | [decimal-results.json](../qa/dataset/decimal-results.json) |
| Dataset trình duyệt: bản lưu schema 12 được nạp lại, khôi phục, 4 kích thước, 17 tình huống, quyền, snapshot, xuất Excel | 31 | `tools/qa-dataset.playwright.js` |
| Hóa đơn, thu tiền, khách thuê/cọc, OCR, báo cáo, record workflows, records, record UI, gói, import, điều hướng, bảng giá | Đạt toàn bộ | `tools/run-suites.playwright.js` |
| Smoke toàn registry | 1.168, không lỗi | Trong `qa-dataset.playwright.js` |
| Lint UI | 0 lỗi | `node tools/lint-ui.js` |

`qa-enterprise-components` (DOM-PAGE-ORDER) và `qa-ui-standard` (UI-STD-08, CUS-01) vẫn lỗi y như trên commit trước khi đổi dataset. Đây là lỗi giao diện có sẵn, không do dữ liệu.

LNR toàn bộ tòa sau khi đổi biểu phí theo tòa, khớp với kết quả kiểm Decimal:

| Kỳ | Kinh doanh | Tổng |
|---|---:|---:|
| 09/2026 | 22.389.800 | 12.989.800 |
| 10/2026 | 10.493.000 | 53.993.000 |

## 3. Cách tái lập

1. `node tools/qa-dataset.cjs` rồi `python -I tools/verify-dataset-decimal.py`.
2. Khi đổi dữ liệu có chủ đích, chụp lại mốc tài chính bằng `node tools/dataset-runtime.cjs` (ghi `baseline-schema13.json`).
3. Mở server: `python -m http.server 8779 --bind 127.0.0.1` (thêm cổng 8780 cho `qa-import-schema`).
4. Nếu đầu vào ảnh hưởng báo cáo cố định, chạy `tools/build-dataset-reports.playwright.js`. Sau đó chạy lại bước 1. File `js/dataset-reports.js` là đầu ra sinh, không sửa tay.
5. Chạy `tools/run-suites.playwright.js` qua Playwright `browser_run_code`.
6. `python -I tools/write-dataset-docs.py` để sinh lại tài liệu nguồn và ma trận.

## 4. Giới hạn và quyết định còn mở

- Quy mô vẫn là 3 tòa / 18 phòng, theo yêu cầu để dễ theo dõi. Số tuyệt đối nhỏ hơn danh mục thật (khoảng 108 tòa / 1.455 phòng). Pool chi phí chung chia theo 18 phòng.
- Lương `/90`–`/100`, TH1 cọc/thu ba tháng, cách chia DV chung trong P&L, tiền dư trong hiệu suất và ý nghĩa vốn cổ phần vẫn cần chốt.
- Bên A trên HĐ khách thuê đang là đại diện nhóm nhà (giả lập). Cần khách xác nhận người đứng tên thực tế (chủ nhà hay đơn vị vận hành).
- Tên đại lý môi giới, khách, nhân sự đều là tên giả, có nhãn minh họa. Không chép dữ liệu cá nhân từ Excel.

Nguồn chính: [Phân tích tài liệu và công thức](TIMEHOUSE_DATASET_SOURCES.md), [Ma trận dữ liệu](TIMEHOUSE_DATASET_MATRIX.md), [dataset đầy đủ](../qa/dataset/dataset.json).
