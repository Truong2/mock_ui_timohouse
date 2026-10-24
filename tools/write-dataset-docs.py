"""Generate the sheet/formula traceability documentation from audited artifacts."""
from pathlib import Path
from collections import Counter
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/qa/dataset'
read = lambda name: json.loads((OUT / name).read_text(encoding='utf-8'))
audit = read('source-inventory.json'); rules = read('formula-rules.json'); db = read('dataset.json')
families = read('formula-families.json'); structural = read('structural-results.json'); numeric = read('decimal-results.json')
domains = {'master': 'Hồ sơ', 'supplier': 'Dịch vụ đầu vào', 'billing': 'Hóa đơn/phòng mới', 'deposit': 'Cọc/phá HĐ', 'commission': 'Hoa hồng', 'building_report': 'Báo cáo tòa', 'shares': 'Cổ phần', 'utilities': 'Điện nước', 'repair': 'Sửa chữa', 'payroll': 'Lương', 'forecast': 'Dự kiến', 'portfolio_report': 'Báo cáo tổng', 'report_requirements': 'Yêu cầu báo cáo', 'investment': 'Đầu tư', 'reference': 'Tham khảo'}
def text(x): return str(x).replace('|', '\\|').replace('\n', ' ')
rows = ['# TIMEHOUSE — Nguồn tài liệu và công thức cho excel-demo-v1', '',
        'Bản phân tích phục vụ dataset mô phỏng 3 tòa, 18 phòng, kỳ 05–10/2026. Không nhập hồ sơ thật từ Excel vào bộ demo.', '',
        '## 1. Phương pháp và giới hạn', '',
        '- Đọc sparse OOXML của toàn bộ 13 workbook, mọi sheet kể cả sheet ẩn. Có 248 sheet, 108.090 ô công thức; 75.804 công thức dùng chung đã mở rộng theo ô đích.',
        '- 7.540 nhóm công thức được chuẩn hóa theo tham chiếu tương đối, giữ công thức gốc, ô nguồn và kết quả cache trong hồ sơ nén. Không chạy Excel để tính lại.',
        '- Cache lỗi gồm 2.481 `#DIV/0!`, 21 `#REF!`, 21.642 `#VALUE!`; đây là số ô ở toàn bộ bản sao/kỳ, không phải số nghiệp vụ lỗi duy nhất. Có 68 ô thiếu cache. Cache có số cũng chưa chứng minh còn cập nhật.',
        '- Liên kết ngoài được giữ nguyên để tra cứu; không thay file thiếu bằng một workbook cùng tên hoặc một kỳ khác. Không chuyển lỗi/ô trống thành số 0.',
        '- Kỳ có năm rõ được ghi thành ứng viên; sheet chỉ ghi tháng không bị tự gán năm. Tên file, tiêu đề và tên sheet mâu thuẫn đều giữ để kiểm tra.',
        '- Word lương đã đọc đủ 6 bước; hai PDF đối chiếu riêng. DAYDU là mẫu hợp đồng demo đang dùng; P302 là tài liệu so sánh lịch sử. Sơ đồ tổ chức được xem trực tiếp.',
        '- File `.doc` cũ đã trích được phần văn bản Unicode để đối chiếu thuê tòa/cọc/kỳ trả; chưa phục dựng bố cục và các trường nhúng. Chi tiết chưa xác minh không được gắn là dữ liệu khách hàng thực tế.',
        '- Markdown thiết kế/QA là lịch sử triển khai. Quyết định mới nhất ghi rõ thay thế mới có ưu tiên; “đề xuất” không tự đổi thành đã duyệt.', '',
        '## 2. Danh mục workbook', '', '| File | Sheet | Công thức | Liên kết ngoài |', '|---|---:|---:|---:|']
for book in audit['workbooks']:
    rows.append('| ' + text(book['file']) + ' | ' + str(len(book['sheets'])) + ' | ' + str(sum(s['stats'].get('formulaCells', 0) for s in book['sheets'])) + ' | ' + str(len(book['externalLinkParts'])) + ' |')
rows += ['', '## 3. Cách xử lý mọi nhóm công thức', '', '| Loại xử lý | Nhóm công thức |', '|---|---:|']
for kind, n in sorted(Counter(f['handling'] for f in families).items()): rows.append(f'| `{kind}` | {n} |')
rows += ['', 'Mỗi nhóm có `rule`, lý do xử lý, ví dụ ô và biểu thức; mọi ô còn tra được qua `formula-cells.jsonl.gz`. Các nhóm tham khảo không phải tuyên bố ứng dụng chạy lại mọi biểu thức Excel. Bộ tính dùng các quy tắc nghiệp vụ dưới đây trên đầu vào mô phỏng.', '',
         '## 4. Quy tắc dùng cho dataset', '', '| Quy tắc | Công thức / cách tính | Căn cứ | Trạng thái và khác biệt |', '|---|---|---|---|']
for r in rules:
    source = r['source']; ref = source['file'] + (' · ' + source['sheet'] if source['sheet'] else '') + (' · ' + source['cell'] if source['cell'] else '')
    rows.append('| ' + text(r['id'] + ' · ' + r['title']) + ' | ' + text(r['formula']) + ' | ' + text(ref) + ' | ' + text(r['status'] + ': ' + r['difference']) + ' |')
rows += ['', 'Ví dụ, đầu vào, đơn vị, kỳ, điều kiện lọc và làm tròn chi tiết nằm trong [formula-rules.json](../qa/dataset/formula-rules.json).', '',
         '## 5. Ma trận đầy đủ 248 sheet', '', 'Trùng nội dung sparse XML được ghi `duplicateOf` trong JSON. Các bản gần giống khác công thức/cache không tự gộp; sheet phụ không nhãn vẫn giữ trong danh mục tham khảo.', '']
for book in audit['workbooks']:
    rows += ['### ' + book['file'], '', '| Sheet | Miền / vai trò | Ứng viên kỳ | Ô nhập / công thức | Cách dùng |', '|---|---|---|---:|---|']
    for s in book['sheets']:
        role = {'summary': 'tổng hợp', 'detail': 'chi tiết', 'formula_reference': 'tham khảo công thức', 'unlabelled_reference': 'sheet phụ chưa rõ nghĩa'}[s['role']]
        use = 'Giữ tham khảo; không tự sinh dữ liệu từ sheet phụ' if s['disposition'] == 'reference_only' else 'Mẫu cấu trúc → ' + s['rule']
        rows.append('| ' + text(s['name']) + ' | ' + domains[s['domain']] + ' / ' + role + ' | ' + ', '.join(s['periodCandidates']) + ' | ' + str(s['stats'].get('literalCells', 0)) + ' / ' + str(s['stats'].get('formulaCells', 0)) + ' | ' + use + ' |')
    rows.append('')
(ROOT / 'docs/md/TIMEHOUSE_DATASET_SOURCES.md').write_text('\n'.join(rows).rstrip() + '\n', encoding='utf-8')

field_rows = [
 ('Tòa/nhóm', 'Mã tòa; nhóm T/S/G', 'Thông tin nhà / NVVH!B; nhóm trong các sheet NHÀ T/G/S', 'buildings.id, sourceGroup, demoSourceCode', 'Chuỗi; nhóm nguồn độc lập nhóm phân quyền/tài khoản'),
 ('Phân công', 'NVVH, Lead, vệ sinh, kỹ thuật, nguồn', 'Thông tin nhà / NVVH!F:L; sơ đồ tổ chức', 'staff, assignments, teams', 'FK + ngày hiệu lực; tên/chức danh demo, ánh xạ vai trò còn đề xuất'),
 ('Thuê tòa', 'Giá tháng; kỳ; tiền phải trả', 'Thông tin nhà / NVVH!M,P,Q; mẫu .doc', 'leases, landlordPays', 'Tiền VND, chu kỳ tháng, ngày ISO; không ghi trùng lịch trả vào chi phí tháng'),
 ('Chủ nhà', 'Địa chỉ, tài khoản, chủ tài khoản', 'Thông tin nhà / Địa chỉ chi tiết; NVVH!R:S', 'owners, ownerLinks', 'Chuỗi; thông tin demo và tài khoản che'),
 ('Dịch vụ đầu vào', 'Mã điện/nước/mạng; chủ HĐ; chi phí tháng', 'Danh sách mã HĐ điện nước mạng / năm 2026!B,F,O,P,Y,Z', 'serviceContracts, supplierBills → expenses', 'Chủ HĐ dịch vụ không suy thành chủ nhà/khách thuê; số tiền chỉ cộng ở expense'),
 ('Phòng', 'Mã ghép, tòa, số phòng', 'Hóa đơn / NHÀ T,G,S!A:C', 'rooms, contracts.roomId', 'Giữ ID hiện tại; mã nguồn chỉ dùng mẫu cấu trúc'),
 ('Giá thuê', 'Niêm yết, giá QL, giá chốt', 'Hóa đơn / G:H:I', 'rooms.rent, contracts.listRent/rent', 'Giá QL nguồn không tự coi là giá hợp đồng; lấy giá chốt demo có lịch hiệu lực'),
 ('Thời gian thuê', 'Ngày ở, ngày DV, ngày vào, thời hạn, hết HĐ', 'Hóa đơn / K:L,BA:BC', 'contracts, handover, invoice.lines', 'K/L là số ngày, không phải ngày lịch; ngày ISO và tháng nguyên'),
 ('Khách', 'Định danh, liên hệ, người ở, xe', 'DAYDU PDF; Excel hóa đơn chỉ có số người O', 'customers, occupants, vehicles, contracts.peopleLog', 'Được tạo mới cho demo; không suy tên khách từ cột quản lý D hoặc chủ HĐ dịch vụ'),
 ('Cọc', 'Cọc khách cũ F; cọc mới J; hoàn cọc', 'Hóa đơn / F,J và HOÀN CỌC', 'contracts.deposit, deposits, depositCases', 'Không cộng F+J thành một khoản nhận mới; hoàn chỉ sau thực chi'),
 ('Điện', 'Chỉ số đầu/cuối, sản lượng, đơn giá, tiền', 'Hóa đơn / P:T', 'readings, priceList, invoice elec', 'kWh; tách giá mua và giá bán; số thiếu/lùi không xác nhận'),
 ('Nước', 'Chỉ số/số người, giá và thành tiền', 'Hóa đơn / U:Y; DAYDU Điều 4.2', 'readings, peopleLog, priceList WATER', 'm³ hoặc người theo phương thức; không nhân cả hai'),
 ('Phí', 'Vệ sinh, mạng, thang máy, xe, máy giặt, DV khác', 'Hóa đơn / Z:AQ; DAYDU Điều 4.2', 'priceList, fees, invoice fixed', 'Đơn vị người/phòng/xe/tháng; cách tách phí giữ đề xuất hiện tại'),
 ('Điện chung', 'Công tơ chung, số người, tiền mỗi người', 'Hóa đơn / CB:CH', 'commonMeters, commonReadings, invoice common', 'Tổng phân bổ + phần phòng trống = tiền công tơ'),
 ('Hóa đơn', 'Tổng DV AU; cần đóng AV; thu khác N', 'Hóa đơn / AU:AV,N', 'invoices, billAdjusts, roomBill', 'VND; cọc/nợ cũ tính riêng ở bảng thu tiền'),
 ('Thu tiền', 'Đã đóng AX, tình trạng AY, công nợ AZ', 'Hóa đơn / AX:AZ; cập nhật thu tiền', 'receipts, roomBill, receiptEdits', 'Excel AZ = thu − phải thu; chỉ thu xác nhận giảm nợ, thu sau 15 vẫn giảm nợ'),
 ('Hoa hồng', 'Giá chốt, mức HH, thành tiền', 'Hoa hồng / HOA HỒNG THÁNG 9.26!F,H,I', 'commissions → expenses', 'Rate 0–1; bảng tổng nhận J không cộng thêm vào từng giao dịch I'),
 ('Sửa chữa', 'Vật tư, công, tổng theo người/tòa/kỳ', 'Sổ sửa chữa / sheet chi tiết và LƯƠNG THÁNG 8', 'repairJobs.lines → expenses', 'Chi tiết demo tạo mới; tổng công + vật tư khớp đúng một chi phí'),
 ('Tài sản', 'Bàn giao, đầu tư ban đầu, thiết bị mua thêm', 'DAYDU Điều 2; G1 / ĐẦU TƯ BAN ĐẦU', 'assets, handover.assets, equipment expenses', 'Số lượng và nguyên giá; không tự khấu hao'),
 ('Hiệu suất', 'M5/M10/M15; DV; thu thêm; giá niêm yết', 'DOCX Bước 1–5; bảng lương / THÁNG 8!J:U', 'calc.perfBuilding, payroll', 'Trọng số 100/90/70/0; TH1, tiền dư chưa có quy tắc duyệt riêng'),
 ('Lương', 'Cứng, phụ cấp, trưởng nhóm, mức/phòng, thực nhận', 'Bảng lương / THÁNG 8!D:H,V:X', 'staff, salaryPolicy, salaryAdjustments, calc.payroll', 'Lương nháp /90; DOCX /100 mâu thuẫn, không coi đã duyệt'),
 ('Phân bổ', 'Chi phí chung và mẫu số phòng', 'G1 / BÁO CÁO THÁNG 8!C36:C46', 'costPools', 'Tạo mới theo 18 phòng; không dùng 1382/1343 của nguồn thực'),
 ('Báo cáo', 'DT, GV, CPBH, TCP, LNG, LNR, tỷ lệ', 'BCKD / BÁO CÁO KINH DOANH THÁNG 8', 'calc.pnl, reportRuns.snapshot', 'Tổng/KD riêng; tỷ lệ tổng tính lại tử/mẫu; mẫu số 0 để không áp dụng'),
 ('Cổ phần', 'Tỷ lệ; vốn mẫu; LN; tổng nhận', 'G1 / BÁO CÁO THÁNG 8!G:M; Bảng chia cp', 'shares, shareholders, calc.shareSplit', 'Tỷ lệ tổng 100%; vốn mẫu khác vốn góp, không tự chi trả'),
 ('Dự kiến', 'Doanh thu/chi phí cơ sở và điều chỉnh', 'Dự kiến LN / Tháng 9.2026!E3:J7', 'forecastPlans, dataset.forecast', 'Nháp, tính từ P&L kỳ cơ sở + giả định; không ghi vào chứng từ thực tế'),
]
mapping = ['# TIMEHOUSE — Ma trận dữ liệu mô phỏng', '', 'Bộ dữ liệu `excel-demo-v1`; 3 tòa, 18 phòng; 6 kỳ 05–10/2026. Mọi giá trị mới là dữ liệu mô phỏng, căn cứ nguồn mô tả cấu trúc và cách tính.', '',
           '| Nhóm | Trường / ý nghĩa nguồn | Tài liệu | Dữ liệu ứng dụng | Kiểu và quy tắc |', '|---|---|---|---|---|']
mapping += ['| ' + ' | '.join(text(c) for c in row) + ' |' for row in field_rows]
mapping += ['', '## Tình huống và liên kết', '', '| Mã | Tình huống | Kỳ | Quy tắc |', '|---|---|---|---|']
mapping += ['| ' + s['id'] + ' | ' + s['title'] + ' | ' + s['period'] + ' | ' + s['ruleId'] + ' |' for s in db['dataset']['scenarios']]
mapping += ['', 'Các bản ghi liên quan nằm trong `dataset.scenarios[].refs`; trường `sourceBasis` trên chứng từ gắn phiên bản dataset, quy tắc và tình huống. Đây là căn cứ cấu trúc, không phải chứng minh giao dịch thật của khách hàng.', '',
            '## Tương thích và sử dụng', '',
            '- Giữ schema 12 và API `TH.seed()`, `TH.buildInvoice`, `TH.calc`, `TH.reports`. Bổ sung `TH.dataset.version/rules/rule/forecast`; metadata và các sổ phụ chỉ tham chiếu chứng từ, không cộng thêm vào sổ chính.',
            '- Trình duyệt mới nạp dataset mới; schema-12 đã lưu được giữ nguyên cả nháp. Trong **Công cụ demo → Nguồn và tình huống dữ liệu**, Admin/Kế toán tra được căn cứ và mở màn nghiệp vụ.',
            '- **Công cụ demo → Khôi phục** nạp lại bộ mới sau khi giải quyết phần đang sửa và xác nhận xóa phiên demo. Hai bản báo cáo mô phỏng cố định được nạp lại cùng seed.',
            '- Dữ liệu QA đầy đủ: `docs/qa/dataset/dataset.json`; mốc cũ: `baseline-schema12.json`; thay đổi tiền: `dataset-diff.json`; kết quả bộ tính: `engine-results.json`.', '']
(ROOT / 'docs/md/TIMEHOUSE_DATASET_MATRIX.md').write_text('\n'.join(mapping), encoding='utf-8')
print('Wrote source inventory for 248 sheets and field/scenario matrix.')
