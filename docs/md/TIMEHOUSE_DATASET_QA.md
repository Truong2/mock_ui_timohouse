# TIMEHOUSE — Bàn giao excel-demo-v1

Ngày 23/10/2026. Dataset mô phỏng theo tài liệu khách hàng; **3 tòa, 18 phòng, 6 kỳ 05–10/2026**, schema 12.

## 1. Kết quả

- 97 hóa đơn, 98 phiếu thu, 110 khoản chi; bổ sung 12 hóa đơn lịch sử cho hợp đồng đã kết thúc, trong đúng thời gian thuê.
- 9 hợp đồng dịch vụ, 54 hóa đơn đầu vào liên kết chi phí; 10 hồ sơ vật tư/nhân công, 3 khoản hoa hồng và 3 kế hoạch lợi nhuận nháp.
- 15 tình huống nghiệp vụ; nước theo người, công tơ, thu dư/thiếu, thu muộn, trả trước ba tháng, phòng mới lẻ ngày, điện chung, cọc từng bước và cổ phần.
- Hai bản báo cáo mô phỏng cố định, sinh từ bộ tính báo cáo hiện tại: RPT-04 Cầu Giấy kỳ 09 và RPT-05 toàn bộ tòa kỳ 08. Bản lưu giữ nguyên khi nguồn sống đổi; tạo tiếp đúng phiên bản v2.
- Toàn bộ 13 workbook/248 sheet và 108.090 ô công thức được kiểm kê; không coi cache Excel hoặc đề xuất chính sách là quyết định đã duyệt.

## 2. Kiểm thử

| Bộ kiểm tra | Đạt | Bằng chứng |
|---|---:|---|
| Cấu trúc, quan hệ, kỳ, lịch thuê, cọc và quy nguyên nhân chênh lệch | 3.556 | [structural-results.json](../qa/dataset/structural-results.json) |
| Số học độc lập Python Decimal | 3.718 | [decimal-results.json](../qa/dataset/decimal-results.json) |
| Dataset: giữ dữ liệu/nháp, khôi phục, bốn kích thước, nguồn, quyền, snapshot, Excel | 31 | [browser-results.json](../qa/dataset/browser-results.json) |
| Hóa đơn / thu tiền / OCR / khách thuê và cọc / báo cáo | 8 / 12 / 9 / 23 / 11 | Cùng hồ sơ kết quả trình duyệt |
| UI chuẩn / enterprise / refinement / điều hướng | 19 / 21 / 80 / 22 | Cùng hồ sơ kết quả trình duyệt |
| Smoke toàn registry qua A–D và hai kỳ | 1.088, không lỗi | Có trong từng bộ nghiệp vụ |

Tổng **236 assertion trình duyệt** đạt. Giao diện nguồn và các sổ phụ kiểm ở **375, 768, 1024, 1440px**; không tràn ngang trang, focus vào modal và Escape trả lại vị trí trước. Ảnh [mobile](../qa/dataset/forecast-375.png), [desktop](../qa/dataset/forecast-1440.png) và điều hướng nằm trong thư mục QA dataset.

File [report-seed.xlsx](../qa/dataset/report-seed.xlsx) tải qua chính chức năng xuất của ứng dụng, mở bằng openpyxl: đủ 4 sheet, dòng LNR **1.115.600đ** khớp snapshot RPT-04; sheet công thức chứa căn cứ dataset. openpyxl dùng style mặc định vì bộ xuất hiện tại chưa khai báo default style; nội dung và định dạng ô vẫn đọc được.

Lint UI: 0 lỗi, 97 inline style (giữ mốc UI trước). JavaScript kiểm cú pháp và `git diff --check` đạt.

## 3. Hồi quy và chênh lệch có chủ đích

Chạy bộ tính hiện tại trên **cùng database schema 12 cũ** cho kết quả khớp toàn bộ mốc đã lưu. Bộ dữ liệu mới có số tiền mới, được kiểm độc lập; không giữ số cũ bằng cách nhập đè tổng báo cáo.

| LNR toàn bộ tòa | Schema 12 cũ | excel-demo-v1 |
|---|---:|---:|
| Kinh doanh 09/2026 | 16.682.599 | 23.643.400 |
| Tổng 09/2026 | 7.282.599 | 14.243.400 |
| Kinh doanh 10/2026 | 9.655.000 | 11.430.000 |
| Tổng 10/2026 | 53.155.000 | 54.930.000 |

INV-2610-CG202 giữ **6.069.800đ**; hiệu suất CG kỳ 09 vẫn khoảng **72,3%**. 1.086 chỉ tiêu thay đổi đều có nguyên nhân và delta thành phần tại [dataset-diff.json](../qa/dataset/dataset-diff.json), được kiểm bằng cách áp tuần tự năm thay đổi đầu vào lên mốc cũ: nước theo người, thu dư tháng 5, pool 18 phòng, hóa đơn lịch sử và hoa hồng chờ duyệt.

Hai kỳ vọng QA cũ được cập nhật có căn cứ: TX-202 có hóa đơn lịch sử 15 ngày trong 07/2026; CG-101 giữ dư 100.000đ từ kỳ 05, hiển thị nợ cũ âm và số dư ở các kỳ sau. Các phép tính và quy trình xác nhận không đổi.

## 4. Cách tái lập

1. `python -X utf8 tools/audit-dataset-sources.py` — kiểm kê nguồn, mở rộng công thức dùng chung, xuất hồ sơ nhóm/ô; bỏ qua file Excel xuất trong `docs/qa/`.
2. `node tools/qa-dataset.cjs` rồi `python -X utf8 tools/verify-dataset-decimal.py` — xuất dataset và kết quả máy tính, kiểm cấu trúc/hồi quy/số học độc lập. Mốc `baseline-schema12.json` đã lưu trước thay đổi.
3. `python -X utf8 tools/write-dataset-docs.py` — sinh danh mục 248 sheet và ma trận trường/tình huống.
4. Mở server tại cổng 8779; chạy các hàm `tools/qa-*.playwright.js` bằng Playwright. `qa-dataset.playwright.js` thay dữ liệu demo trong phiên kiểm thử và tải file Excel bằng đường xuất thật.
5. Khi thay đầu vào seed có ảnh hưởng báo cáo cố định: chạy `tools/build-dataset-reports.playwright.js`, sau đó chạy lại kiểm tra cấu trúc/snapshot/Decimal và QA báo cáo. File `js/dataset-reports.js` là đầu ra sinh, không sửa số tay.

## 5. Giới hạn và quyết định còn mở

- Các workbook liên kết ngoài chưa đủ nguồn; nhiều cache lỗi hoặc thiếu. Giữ biểu thức và lý do trong từng nhóm công thức; không tuyên bố tái tính 1:1 toàn bộ Excel.
- Lương `/90`–`/100`, TH1 cọc/thu ba tháng, cách phân chia phí dịch vụ, tiền dư trong hiệu suất và ý nghĩa vốn cổ phần vẫn cần chốt. Dataset giữ chính sách nháp/đề xuất hiện tại.
- Bảng hệ số lương đầy đủ, dữ liệu định danh khách thuê toàn hệ thống, một số báo cáo yêu cầu trong `báo cáo.xlsx` chưa có đủ căn cứ. Ma trận ghi rõ dữ liệu được tạo cho demo và các chỉ tiêu chỉ giữ tham khảo.
- File `.doc` cũ mới đối chiếu phần chữ trích được; chưa phục dựng trường nhúng/bố cục. Không có bộ máy Excel để tính lại và xác nhận cache nguồn.
- QA trình duyệt thực hiện trên Chromium. Firefox/Safari và PDF phân trang vẫn là giới hạn đã ghi ở đợt UI trước.

Nguồn chính: [Phân tích tài liệu và công thức](TIMEHOUSE_DATASET_SOURCES.md), [Ma trận dữ liệu](TIMEHOUSE_DATASET_MATRIX.md), [dataset đầy đủ](../qa/dataset/dataset.json).
