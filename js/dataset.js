/* excel-demo-v2: deterministic synthetic inputs, source references and scenarios.
 * 3 tòa theo mã Excel (T17 · S9 · G1), 18 phòng; HĐ khách thuê theo mẫu đầy đủ khớp hóa đơn/cọc/chỉ số.
 * Source workbooks are reference material, never customer records imported here.
 * Saves from older schemas are reseeded (TH.DATA_SCHEMA 13).
 */
(function () {
  var baseSeed = TH.seed;
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };
  var files = {
    master: 'Thông tin nhà.xlsx', supplier: 'Danh sách mã HĐ điện nước mạng.xlsx',
    bill: 'Hoá đơn tiền nhà tháng 9 và dịch vụ tháng 9 năm 2026.xlsx',
    commission: 'Hoa hồng năm 2025-2026 (1).xlsx', g1: 'G1.31.8.26.xlsx',
    shares: 'Bảng chia cp tháng 8 (1).xlsx', utilities: 'bao_cao/âm dương điện nước tháng 7.xlsx',
    repair: 'bao_cao/sổ sửa chữa tháng 8(AutoRecovered).xlsx', payroll: 'bao_cao/bảng lương tháng 8.xlsx',
    salary: 'CÁCH TÍNH LƯƠNG PHÒNG VẬN HÀNH.docx', forecast: 'bao_cao/BẢNG DỰ KIẾN LỢI NHUẬN CÁC THÁNG.xlsx',
    pnl: 'bao_cao/BÁO CÁO KINH DOANH THÁNG 8.xlsx', reports: 'bao_cao/báo cáo.xlsx'
  };
  function src(file, sheet, cell) { return { file: 'docs/' + (files[file] || file), sheet: sheet || null, cell: cell || null }; }
  function rule(id, title, source, formula, inputs, unit, rounding, example, status, difference) {
    return { id: id, title: title, source: source, formula: formula, inputs: inputs, unit: unit, period: 'Theo kỳ chứng từ; demo 05–10/2026',
      filter: 'Theo tòa/kỳ; chỉ chứng từ đủ điều kiện của từng nghiệp vụ', rounding: rounding, example: example,
      status: status || 'verified_pattern', difference: difference || 'Giá trị đầu vào mô phỏng, không sao chép số tiền khách hàng.' };
  }
  var rules = [
    rule('F-MASTER', 'Lịch trả chủ nhà', src('master', 'NVVH', 'Q3'), 'Tiền thuê tháng × số tháng trong kỳ trả', ['rent', 'payCycle'], 'VND', 'Đồng nguyên', '18.000.000 × 3 = 54.000.000'),
    rule('F-SUPPLIER', 'Chi phí đầu vào dịch vụ', src('supplier', 'năm 2026', 'G4'), 'Tổng hóa đơn nguồn theo nhà cung cấp/tòa/kỳ', ['supplierBills', 'expenseId'], 'VND', 'Đồng nguyên', 'Điện 2.880.000 + nước 720.000 = 3.600.000'),
    rule('F-BILL', 'Hóa đơn phòng', src('bill', 'NHÀ T', 'AV5'), 'Tiền phòng × kỳ TT + dịch vụ + cọc mới + nợ cũ + thu khác', ['rent', 'cycle', 'services', 'deposit', 'openingDebt', 'adjustment'], 'VND', 'Tiền thuê lẻ theo cấu hình; mặc định 1.000đ, dòng phí theo đồng', '3.800.000 × 12/30 → 1.520.000', 'verified_pattern', 'Hóa đơn lưu tiền thuê/phí; cọc và nợ kỳ trước được roomBill cộng từ sổ riêng, không ghi trùng vào doanh thu.'),
    rule('F-METER', 'Điện và nước theo công tơ', src('bill', 'NHÀ T', 'T5'), '(Chỉ số cuối − chỉ số đầu) × đơn giá', ['prev', 'cur', 'price'], 'kWh hoặc m³ → VND', 'Đồng nguyên', '(1.416 − 1.100) × 4.000 = 1.264.000'),
    rule('F-PERSON', 'Nước theo người', src('bill', 'NHÀ T', 'Y5'), 'Số người hiệu lực trong kỳ × đơn giá', ['peopleLog', 'priceList'], 'người/tháng → VND', 'Đồng nguyên', '2 × 120.000 = 240.000'),
    rule('F-COMMON', 'Phân bổ điện chung', src('bill', 'NHÀ T', 'CB4:CH4'), '(Chỉ số cuối − đầu) × giá; chia theo người/phòng', ['commonReading', 'units', 'vacantRule'], 'VND', 'Làm tròn từng phần; phần dư vào dòng cuối', '126 × 4.000 = 504.000; tổng phân bổ + thất thoát = 504.000', 'proposed', 'Cách tính phần phòng trống vẫn là cấu hình đề xuất.'),
    rule('F-DEBT', 'Đối chiếu công nợ', src('bill', 'NHÀ T', 'AZ5'), 'Excel: đã thu − phải thu; còn nợ = max(0, phải thu − đã thu)', ['confirmedReceipts', 'invoice', 'openingDebt', 'deposit'], 'VND', 'Đồng nguyên', 'Phải thu 5.000.000, thu 5.100.000: Excel +100.000, dư 100.000', 'verified_pattern', 'Chờ xác nhận không giảm nợ; thu sau 15 vẫn giảm nợ. Không suy trạng thái phòng từ AY.'),
    rule('F-DEPOSIT', 'Đối chiếu hoàn cọc', src('bill', 'HOÀN CỌC', 'A1'), 'Cọc giữ − khấu trừ − phần giữ cọc = dự kiến hoàn', ['depositCase', 'deductions', 'payment'], 'VND', 'Đồng nguyên', '6.500.000 − 300.000 = 6.200.000', 'proposed', 'Chỉ ghi hoàn sau thực chi; không tự áp phạt hay mất cọc. Bảng nguồn không thay quyết định phê duyệt.'),
    rule('F-COMMISSION', 'Hoa hồng môi giới', src('commission', 'HOA HỒNG THÁNG 9.26', 'I4'), 'Giá chốt × tỷ lệ hoa hồng', ['rent', 'rate', 'expenseId'], 'VND', 'Đồng nguyên', '3.800.000 × 35% = 1.330.000'),
    rule('F-REPAIR', 'Sổ sửa chữa', src('repair', 'LƯƠNG THÁNG 8', 'A12'), 'Tổng vật tư + tổng nhân công', ['repair.lines', 'expenseId'], 'VND', 'Đồng nguyên', '2 × 250.000 + 1 × 300.000 = 800.000', 'synthetic_assumption', 'Cấu trúc sổ được tái hiện; chi tiết vật tư/nhân công demo được tạo mới, không suy ngược thành dữ liệu thực.'),
    rule('F-PERF', 'Hiệu suất vận hành', src('salary', 'Bước 1–5', null), 'A = M5 + (M10−M5)×0,9 + (M15−M10)×0,7; B = DV/PT; D = A×(1−B)+C; HS = D/niêm yết', ['confirmedReceipts', 'invoiceServices', 'arisingRent', 'forfeit', 'listedRent'], 'VND; tỷ lệ 0–1', 'Giữ độ chính xác đến bước lương', 'M5=10tr, M10=15tr, M15=20tr → A=18tr', 'proposed', 'Thu sau 15 không vào A. TH1 cọc/thu ba tháng chỉ hiển thị cảnh báo và phần cần chuẩn hóa, chưa áp thuật toán chưa duyệt.'),
    rule('F-PAYROLL', 'Lương nháp', src('payroll', 'THÁNG 8', 'V9'), 'HS% × đơn giá/phòng ÷ 90; nhân số phòng; cộng lương cứng/phụ cấp/điều chỉnh', ['performance', 'referenceRate', 'rooms', 'salaryAdjustments'], 'VND', 'Lương/phòng đến đồng; lương HS đến 1.000đ', '91 × 110.000 / 90 → 111.222đ/phòng', 'pending_approval', 'DOCX ghi /100 nhưng ví dụ và Excel dùng /90. Giữ /90 cho demo; bảng hệ số đầy đủ chưa có.'),
    rule('F-POOL', 'Phân bổ chi phí chung', src('g1', 'BÁO CÁO THÁNG 8', 'C36'), 'Chi phí chung × phòng tòa / tổng phòng thuộc phạm vi phân bổ', ['pool.lines', 'portfolioRooms', 'roomCount'], 'VND', 'Đồng nguyên từng tòa; công bố phần dư', '180.000 × 7/18 = 70.000', 'proposed', 'Mẫu có nhiều mẫu số 1.382/1.343; demo dùng đúng 18 phòng thuộc bộ dữ liệu, không giữ mẫu số doanh nghiệp thật.'),
    rule('F-PNL', 'Kinh doanh và Tổng', src('pnl', 'BÁO CÁO KINH DOANH THÁNG 8', 'C43:C48'), 'GV = thuê + thiết bị + DV đầu vào; CPBH = lương + vận hành; TCP = GV + CPBH; LNG = DT−GV; LNR = DT−TCP', ['invoices', 'deposits', 'expenses', 'payroll', 'pools'], 'VND', 'Tổng từ thành phần đã làm tròn', 'DT 100tr, GV 60tr, CPBH 10tr → LNG 40tr, LNR 30tr', 'proposed', 'KD loại cọc mới/hoàn cọc/thiết bị, tính thuê theo kỳ; Tổng theo mẫu quản trị. Không đồng nhất Tổng với sao kê dòng tiền.'),
    rule('F-UTILITY', 'Đối chiếu thu/chi điện nước', src('utilities', 'THÁNG 7.2026 điện công thức', 'K3:S3'), 'Điện: H+B/2+E−L; nước: N+B/2−R', ['collectedElectricity', 'washing', 'otherFees', 'supplierCost'], 'VND', 'Giữ công thức gốc trong hồ sơ', 'H=7tr, B=440k, E=1,32tr, L=8.135.381 → 404.619', 'reference_only', 'Nguồn có #VALUE!, liên kết ngoài và tên “thực thu” nhưng công thức cộng dòng hóa đơn. Chưa áp cơ chế chia phí này vào thu tiền; không suy thu theo dòng khi phiếu thu chưa phân bổ.'),
    rule('F-SHARE', 'Chia cổ phần theo mẫu G1', src('g1', 'BÁO CÁO THÁNG 8', 'H3:M3'), 'Vốn mẫu = tỷ lệ × tiền thuê; LN phần = tỷ lệ × LN; tổng mẫu = vốn mẫu + LNR phần', ['effectiveShares', 'pnl'], 'VND', 'Đồng nguyên từng cổ đông; ghi phần dư', '40% × LNR 10tr = 4tr', 'pending_approval', 'Vốn mẫu không phải vốn góp và không tự sinh lệnh hoàn vốn/chi trả.'),
    rule('F-FORECAST', 'Dự kiến lợi nhuận', src('forecast', 'Tháng 9.2026 ', 'E3'), 'Số cơ sở + các điều chỉnh dự kiến; LNR dự kiến = DT dự kiến − TCP dự kiến', ['baselineReport', 'forecastAdjustments'], 'VND', 'Đồng nguyên', 'DT cơ sở 30tr + dự kiến 1tr; TCP cơ sở 20tr + sửa chữa 0,5tr → LNR 10,5tr', 'synthetic_assumption', 'Giữ dự kiến độc lập với chứng từ ghi nhận; không cộng vào báo cáo thực tế.'),
    rule('F-ASSET', 'Đầu tư và tài sản', src('g1', 'ĐẦU TƯ BAN ĐẦU', 'A1'), 'Số lượng × nguyên giá; liên kết chứng từ đầu tư', ['assets', 'equipmentExpense'], 'VND', 'Đồng nguyên', '2 bộ × 3.250.000 = 6.500.000', 'proposed', 'Không tự tính khấu hao hoặc chuyển toàn bộ mua sắm thành chi phí KD.'),
    rule('F-REPORT', 'Danh mục chỉ tiêu', src('reports', 'BÁO CÁO', 'A1:F12'), 'Tỷ lệ = tổng tử / tổng mẫu; mẫu số 0 → không áp dụng', ['reportMetrics'], 'tỷ lệ 0–1', 'Chỉ làm tròn khi hiển thị', 'LNR 10tr / DT 100tr = 10%', 'reference_only', 'Các báo cáo chưa có trong phạm vi hiện tại được ghi trong ma trận, không tạo số liệu giả đã xác nhận.')
  ];
  function basis(ruleId, scenario) { return { datasetVersion: 'excel-demo-v2', synthetic: true, ruleId: ruleId, scenarioId: scenario || null }; }
  TH.dataset = {
    version: 'excel-demo-v2', rules: rules,
    rule: function (id) { return rules.find(function (r) { return r.id === id; }); },
    // A forecast uses the same P&L engine for its baseline. Only explicit draft
    // adjustments are added; these never enter invoices, expenses or receipts.
    forecast: function (plan) {
      var v = TH.calc.pnl(plan.baselinePeriod, plan.buildingId, plan.mode), revenue = v.total, costs = v.tcp;
      plan.adjustments.forEach(function (a) { if (a.target === 'revenue') revenue += a.amount; else costs += a.amount; });
      return { baselineRevenue: v.total, baselineCosts: v.tcp, revenue: revenue, costs: costs, profit: revenue - costs, status: 'draft' };
    }
  };
  TH.seed = function () {
    var db = baseSeed();
    db.dataset = { version: TH.dataset.version, synthetic: true, asOf: TH.TODAY, periods: TH.PERIODS.slice(),
      description: 'Dữ liệu mô phỏng theo tài liệu khách hàng · 3 tòa T17, S9, G1 (nhà T/S/G), 18 phòng', rulesVersion: 2,
      sourceAudit: 'docs/qa/dataset/source-inventory.json', formulaAudit: 'docs/qa/dataset/formula-families.json',
      assumptions: ['D-06: lương nháp /90', 'G-03: chưa áp TH1', 'R-02: phân chia DV theo cấu hình demo hiện có', 'R-08: cổ phần chưa phải lệnh chi'], scenarios: [] };
    function scenario(id, title, ruleId, refs, period) {
      db.dataset.scenarios.push({ id: id, title: title, ruleId: ruleId, period: period || '2026-10', refs: refs });
    }
    var collections = { owners: 'F-MASTER', buildings: 'F-MASTER', leases: 'F-MASTER', landlordPays: 'F-MASTER', rooms: 'F-MASTER', staff: 'F-PAYROLL', assignments: 'F-MASTER', customers: 'F-BILL', contracts: 'F-BILL', invoices: 'F-BILL', receipts: 'F-DEBT', readings: 'F-METER', commonMeters: 'F-COMMON', commonReadings: 'F-COMMON', deposits: 'F-DEPOSIT', depositCases: 'F-DEPOSIT', expenses: 'F-PNL', salaryAdjustments: 'F-PAYROLL', shares: 'F-SHARE', assets: 'F-ASSET', billAdjusts: 'F-BILL' };
    Object.keys(collections).forEach(function (key) { db[key].forEach(function (r) { r.sourceBasis = basis(collections[key]); }); });
    // Loại nhà T/S/G là tiền tố của mã tòa (sheet NHÀ T / NHÀ S / NHÀ G); độc lập với nhóm nhà (tài khoản nhận) và phân quyền.
    db.buildings.forEach(function (b) { b.sourceGroup = b.type; });
    db.sourceGroups = ['T', 'S', 'G'].map(function (g) { return { id: g, name: 'Nhà ' + g, buildings: db.buildings.filter(function (b) { return b.type === g; }).map(function (b) { return b.id; }) }; });

    // Historical contracts still contribute in periods when they were occupied.
    // The original demo only generated invoices for contracts active today.
    db.contracts.filter(function (c) { return c.status === 'ended' || c.status === 'terminated'; }).forEach(function (c) {
      TH.PERIODS.forEach(function (p) {
        if (c.start > TH.monthEnd(p) || (c.endedAt || c.end) < p + '-01' || db.invoices.some(function (i) { return i.contractId === c.id && i.period === p; })) return;
        var inv = TH.buildInvoice(db, c, p, 'confirmed'); inv.sourceBasis = basis('F-BILL', 'DS-15'); db.invoices.push(inv);
        db.receipts.push({ id: 'PT-HISTORY-' + inv.id, invoiceId: inv.id, amount: inv.total, reportedBy: db.buildings.find(function (b) { return b.id === c.buildingId; }).managerId,
          reportedAt: p + '-05', receivedAt: p + '-05', method: 'Chuyển khoản', evidence: 'DEMO_' + inv.id + '.png', status: 'confirmed', confirmedBy: 'NV-002', confirmedAt: p + '-06',
          note: 'Phiếu thu lịch sử mô phỏng theo thời gian thuê, trước khi kết thúc HĐ', sourceBasis: basis('F-DEBT', 'DS-15') });
      });
    });

    // Water per person: source pattern Y = quantity × price. Rebuild historical
    // 101G1 invoice lines from inputs, then preserve the fully-paid scenario.
    var ct = db.contracts.find(function (c) { return c.roomId === '101G1' && c.status === 'active'; });
    var water = ct.priceList.find(function (l) { return l.code === 'WATER'; });
    Object.assign(water, { method: 'per_person', price: 120000, note: 'Mô phỏng nước theo người, áp dụng từ đầu bộ kỳ 05/2026', sourceBasis: basis('F-PERSON', 'DS-03') });
    ct.peopleLog = [{ from: '2026-05', people: 2, note: 'Hai người ở theo phụ lục mô phỏng', by: 'NV-005', at: '2026-05-01' }];
    db.invoices.forEach(function (inv) {
      if (inv.contractId !== ct.id) return;
      var oldTotal = inv.total, built = TH.buildInvoice(db, ct, inv.period, inv.status);
      Object.assign(inv, built, { sourceBasis: basis('F-PERSON', 'DS-03') });
      var paid = db.receipts.filter(function (r) { return r.invoiceId === inv.id && r.status === 'confirmed'; });
      if (paid.length === 1 && paid[0].amount === oldTotal) paid[0].amount = inv.total;
    });
    // Historical overpayment exercises the Excel sign convention. Its remaining
    // credit carries into later collection periods without a duplicate receipt.
    var over = db.receipts.find(function (r) { return r.invoiceId === 'INV-2605-101T17' && r.status === 'confirmed'; });
    over.amount += 100000; over.note = 'Khách nộp dư 100.000đ — số dư demo, chưa phân bổ sang kỳ khác'; over.sourceBasis = basis('F-DEBT', 'DS-05');

    // The cost pool is scaled to this 18-room portfolio; integer multiples of 18
    // give exact conservation across 7/6/5 rooms. Source corporate denominators
    // (1382, 1343) are not meaningful for a three-building synthetic company.
    TH.PERIODS.forEach(function (p, pi) {
      var pool = db.costPools[p]; pool.portfolioRooms = 18;
      pool.lines = { gm: 180000 + pi * 18000, opsHead: 270000, source: 90000, sales: 180000, acct: 180000, repairStaff: 90000, security: 0, office: 360000, marketing: 180000 };
      pool.sourceBasis = basis('F-POOL', 'DS-11');
    });
    db.salaryPolicy.sourceBasis = basis('F-PAYROLL', 'DS-10');

    // Danh sách mã HĐ điện nước mạng: mã EVN (PD…), nước Viwaco hoặc "Hóa đơn" chủ nhà thu hộ, mạng (HN…); ghi chú "tt tự động"
    db.serviceContracts = [];
    db.supplierBills = [];
    var PROVIDERS = { elec: 'EVN Hà Nội', water: 'Viwaco', internet: 'FPT Telecom' };
    db.buildings.forEach(function (b) {
      var owner = db.owners.find(function (o) { return o.id === b.ownerId; }) || {};
      ['elec', 'water', 'internet'].forEach(function (type) {
        var id = 'DV-' + TH.bTag(b.id) + '-' + type, code = { elec: b.evnCode, water: b.waterCode, internet: b.netCode }[type], landlordBill = /Hóa đơn/.test(code);
        db.serviceContracts.push({ id: id, buildingId: b.id, type: type, provider: landlordBill ? 'Chủ nhà thu hộ' : PROVIDERS[type], accountCode: code,
          holder: owner.name || '—', payMode: landlordBill ? 'Theo hóa đơn chủ nhà' : type === 'water' ? 'Chuyển khoản' : 'tt tự động', from: b.openedAt, to: null, status: 'active', sourceBasis: basis('F-SUPPLIER', 'DS-02') });
        db.expenses.filter(function (e) { return e.buildingId === b.id && e.category === (type === 'internet' ? 'internet' : 'utility'); }).forEach(function (e) {
          var amount = type === 'internet' ? e.amount : e[type];
          db.supplierBills.push({ id: 'NCC-' + e.id + '-' + type, serviceContractId: id, buildingId: b.id, period: e.period, accountCode: code, amount: amount, expenseId: e.id, status: e.status,
            sourceBasis: basis('F-SUPPLIER', 'DS-02') });
        });
      });
    });
    // Sổ sửa chữa (NGÀY · TÒA · MÃ PHÒNG · NỘI DUNG · TIỀN CÔNG · VẬT TƯ · Bên chi): việc công ty chi gộp vào khoản chi sửa chữa,
    // việc khách chi đi qua phí phát sinh trên hóa đơn phòng. Kỹ thuật: NV-011 (VH1), NV-012 (G1).
    var techOf = function (bId) { return bId === 'G1' ? 'NV-012' : 'NV-011'; };
    var roomsOf = function (bId) { return db.rooms.filter(function (r) { return r.buildingId === bId; }); };
    db.repairJobs = db.expenses.filter(function (e) { return e.category === 'repair' && e.description.indexOf('nhập lại') < 0; }).map(function (e, i) {
      var materials = Math.round(e.amount * 0.6 / 1000) * 1000, rs = roomsOf(e.buildingId), room = /hành lang|máy bơm|thấm sân thượng/i.test(e.description) ? null : rs[i % rs.length];
      var job = { id: 'SC-' + e.period.slice(2, 4) + e.period.slice(5) + '-' + String(i + 1).padStart(3, '0'), buildingId: e.buildingId, roomId: room ? room.id : null, area: room ? null : 'Khu chung', period: e.period, date: e.date, expenseId: e.id,
        description: e.description, technicianId: techOf(e.buildingId), payer: 'company', status: e.status, sourceBasis: basis('F-REPAIR', 'DS-08'),
        lines: [{ kind: 'materials', name: 'Vật tư theo phiếu mô phỏng', qty: 1, unitPrice: materials }, { kind: 'labor', name: 'Tiền công', qty: 1, unitPrice: e.amount - materials }] };
      e.repairJobId = job.id; e.sourceBasis = basis('F-REPAIR', 'DS-08'); return job;
    });
    (db.extraFees || []).forEach(function (f, i) {
      var room = db.rooms.find(function (r) { return r.id === f.roomId; }), total = f.qty * f.price, labor = Math.min(total, 100000 + (i % 2) * 50000);
      var job = { id: 'SC-' + f.period.slice(2, 4) + f.period.slice(5) + '-K' + String(i + 1).padStart(2, '0'), buildingId: room.buildingId, roomId: room.id, area: null, period: f.period, date: f.period + '-' + String(6 + i * 3).padStart(2, '0'), extraFeeId: f.id,
        description: f.name, technicianId: techOf(room.buildingId), payer: 'customer', status: f.status === 'confirmed' ? 'approved' : 'pending', note: 'Khách chi — thu qua phí phát sinh trên hóa đơn phòng', sourceBasis: basis('F-REPAIR', 'DS-08'),
        lines: [{ kind: 'materials', name: 'Vật tư', qty: 1, unitPrice: total - labor }, { kind: 'labor', name: 'Tiền công', qty: 1, unitPrice: labor }] };
      f.repairJobId = job.id; db.repairJobs.push(job);
    });
    // HOA HỒNG THÁNG m.yy: mỗi HĐ ký mới (không tính ký nối tiếp/gia hạn) có một dòng hoa hồng = mức HH × giá chốt; kênh môi giới / CTV / sale nội bộ.
    // Dòng trong 6 kỳ demo liên kết khoản chi marketing đã có; dòng trước kỳ demo chỉ là lịch sử đã chi, không vào P&L.
    var CHANNELS = [
      { kind: 'agency', name: 'Nhà Xinh 247 (minh họa)', account: 'MB •••2471' }, { kind: 'sale', staffId: 'NV-006' }, { kind: 'agency', name: 'An Cư Land (minh họa)', account: 'TCB •••5150' },
      { kind: 'ctv', name: 'CTV Lê Văn Bình (minh họa)', account: 'VCB •••0882' }, { kind: 'sale', staffId: 'NV-016' }, { kind: 'agency', name: 'Sao Mai Home (minh họa)', account: 'ACB •••3307' }, { kind: 'sale', staffId: 'NV-015' },
    ];
    var RATES = [0.5, 0.35, 0.5, 0.3, 0.5, 0.25, 0.5, 0.35];
    var commissionExp = { '201G1': 0.5, '301G1': 0.5, '202G1': 0.35 };
    db.commissions = [];
    db.contracts.filter(function (c) { return !c.previousContractId; }).sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : a.roomId < b.roomId ? -1 : 1; }).forEach(function (c, i) {
      var period = c.start.slice(0, 7), inWindow = TH.PERIODS.indexOf(period) > -1;
      var exp = inWindow ? db.expenses.find(function (e) { return e.category === 'commission' && e.roomId === c.roomId && e.period === period; }) : null;
      var rate = inWindow ? commissionExp[c.roomId] : RATES[i % RATES.length], ch = CHANNELS[i % CHANNELS.length];
      if (inWindow && rate === undefined) return;
      if (c.roomId === '202G1' && inWindow) ch = { kind: 'sale', staffId: 'NV-017' };
      if (ch.staffId && db.staff.find(function (x) { return x.id === ch.staffId; }).joinedAt > c.start) ch = CHANNELS[0]; // sale chưa vào làm thì HĐ qua môi giới
      var seqN = db.commissions.filter(function (x) { return x.period === period; }).length + 1, staff = ch.staffId ? db.staff.find(function (x) { return x.id === ch.staffId; }) : null;
      var pending = c.id === 'HĐ-202G1/26';
      db.commissions.push({ id: 'HH-' + period.slice(2, 4) + period.slice(5) + '-' + String(seqN).padStart(2, '0'), buildingId: c.buildingId, roomId: c.roomId, contractId: c.id, period: period, managerId: db.buildings.find(function (b) { return b.id === c.buildingId; }).managerId,
        rent: c.rent, term: TH.dayDiff(c.start, c.end) >= 360 ? '12th' : '6th', rate: rate, amount: Math.round(c.rent * rate),
        channel: ch.kind, team: staff ? 'Sale nội bộ' : ch.name, staffId: ch.staffId || null, payTo: staff ? staff.name : ch.name, account: staff ? 'Trả qua bảng lương' : ch.account,
        tenantPaid: pending ? 'chưa đủ' : 'đủ', paidAt: pending ? null : TH.addDays(c.start, 10), expenseId: exp ? exp.id : null, status: pending ? 'pending' : 'approved', sourceBasis: basis('F-COMMISSION', 'DS-09') });
    });
    var newCt = db.contracts.find(function (c) { return c.id === 'HĐ-202G1/26'; }), hh = db.commissions.find(function (x) { return x.contractId === newCt.id; });
    hh.expenseId = 'CP-2610-HH01';
    db.expenses.push({ id: hh.expenseId, buildingId: hh.buildingId, roomId: hh.roomId, period: hh.period, category: 'commission', description: 'Hoa hồng phòng mới 202G1 · 35% giá chốt (sale nội bộ)',
      amount: hh.amount, docNo: 'HH-2610', date: '2026-10-20', status: 'pending', createdBy: 'NV-005', approvedBy: null, approvedAt: null, file: 'hoa_hong_202G1.pdf', reason: '', sourceBasis: hh.sourceBasis });
    // Điều 4.4.3: nội dung chuyển khoản theo HĐ cho mọi phiếu thu chuyển khoản
    db.receipts.forEach(function (r) {
      var inv = db.invoices.find(function (i) { return i.id === r.invoiceId; }), c = inv && db.contracts.find(function (x) { return x.id === inv.contractId; });
      if (c && r.method === 'Chuyển khoản') r.transferNote = c.terms.transferNote;
    });
    db.forecastPlans = db.buildings.map(function (b, i) { return { id: 'DK-2610-' + TH.bTag(b.id), buildingId: b.id, period: '2026-10', baselinePeriod: '2026-09', mode: 'kd', status: 'draft',
      assumptions: 'Kế hoạch demo: lấy kỳ 09 làm cơ sở, cộng riêng dự kiến tăng thu và sửa chữa; không phải chứng từ thực tế.',
      adjustments: [{ target: 'revenue', amount: (i + 1) * 300000, note: 'Dự kiến tăng thu tiền phòng' }, { target: 'cost', amount: 200000 + i * 100000, note: 'Dự kiến sửa chữa bổ sung' }], sourceBasis: basis('F-FORECAST', 'DS-13') }; });
    scenario('DS-01', 'Chủ nhà, kỳ trả và nhóm T/S/G', 'F-MASTER', ['HĐT-T17-2024', 'LT-T17-2610']);
    scenario('DS-02', 'Hợp đồng dịch vụ và hóa đơn đầu vào', 'F-SUPPLIER', db.serviceContracts.map(function (x) { return x.id; }));
    scenario('DS-03', 'Nước theo người, khác nước theo công tơ', 'F-PERSON', [ct.id, 'INV-2609-101G1'], '2026-09');
    scenario('DS-04', 'Phòng mới lẻ ngày, cọc và trả trước ba tháng', 'F-BILL', ['HĐ-202G1/26', 'INV-2609-301G1', 'COC-2610-01']);
    scenario('DS-05', 'Đối chiếu tiền dư và dấu công nợ Excel', 'F-DEBT', [over.id, over.invoiceId], '2026-05');
    scenario('DS-06', 'Thu nhiều lần, chờ xác nhận và thu sau ngày 15', 'F-PERF', ['INV-2610-201T17', 'INV-2610-202T17', 'INV-2610-102S9']);
    scenario('DS-07', 'Cọc: đối chiếu, chờ duyệt và hoàn một phần đã chi', 'F-DEPOSIT', db.depositCases.map(function (x) { return x.id; }));
    scenario('DS-08', 'Vật tư và nhân công liên kết một khoản chi', 'F-REPAIR', db.repairJobs.map(function (x) { return x.id; }));
    scenario('DS-09', 'Hoa hồng theo HĐ mới qua môi giới / CTV / sale nội bộ (50%, 35%…)', 'F-COMMISSION', db.commissions.map(function (x) { return x.id; }));
    scenario('DS-10', 'Lương nháp /90 và điều chỉnh', 'F-PAYROLL', ['NV-003', 'NV-004', 'NV-005']);
    scenario('DS-11', 'Phân bổ chi phí theo 18 phòng', 'F-POOL', db.buildings.map(function (x) { return x.id; }));
    scenario('DS-12', 'Điện chung, số người thay đổi, chỉ số thiếu/lùi', 'F-COMMON', ['CTC-G1-01', '102G1', '201G1']);
    scenario('DS-13', 'Dự kiến lợi nhuận tách khỏi kết quả thực tế', 'F-FORECAST', db.forecastPlans.map(function (x) { return x.id; }));
    scenario('DS-14', 'Tổng/KD, cổ phần và báo cáo đã lưu', 'F-SHARE', ['BC04-202609-T17-v1', 'BC05-202608-T17.S9.G1-v1']);
    scenario('DS-15', 'Hóa đơn lịch sử trước khi kết thúc hợp đồng', 'F-BILL', ['INV-2607-202G1', 'INV-2608-401T17', 'INV-2609-302S9'], '2026-07');
    scenario('DS-16', 'Hợp đồng khách thuê theo mẫu đầy đủ khớp hóa đơn, cọc, chỉ số', 'F-BILL', ['HĐ-201T17/25', 'INV-2610-201T17', 'HĐ-202G1/26', 'COC-2610-01']);
    scenario('DS-17', 'Đội nhóm theo sơ đồ tổ chức: vận hành, kinh doanh, văn phòng', 'F-PAYROLL', db.teams.map(function (x) { return x.id; }));
    // Báo cáo đóng băng chỉ nạp khi cùng schema dữ liệu; snapshot cũ (mã tòa cũ) bị bỏ qua
    db.reportRuns = TH.DATASET_REPORTS ? clone(TH.DATASET_REPORTS.filter(function (r) { return r.schema === TH.DATA_SCHEMA; })) : [];
    db.reportDrafts = [];
    return db;
  };
})();
