/* excel-demo-v1: deterministic synthetic inputs, source references and scenarios.
 * Source workbooks are reference material, never customer records imported here.
 * Existing schema-12 saves are not migrated or reseeded automatically.
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
  function basis(ruleId, scenario) { return { datasetVersion: 'excel-demo-v1', synthetic: true, ruleId: ruleId, scenarioId: scenario || null }; }
  TH.dataset = {
    version: 'excel-demo-v1', rules: rules,
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
      description: 'Dữ liệu mô phỏng theo tài liệu khách hàng · 3 tòa, 18 phòng', rulesVersion: 1,
      sourceAudit: 'docs/qa/dataset/source-inventory.json', formulaAudit: 'docs/qa/dataset/formula-families.json',
      assumptions: ['D-06: lương nháp /90', 'G-03: chưa áp TH1', 'R-02: phân chia DV theo cấu hình demo hiện có', 'R-08: cổ phần chưa phải lệnh chi'], scenarios: [] };
    function scenario(id, title, ruleId, refs, period) {
      db.dataset.scenarios.push({ id: id, title: title, ruleId: ruleId, period: period || '2026-10', refs: refs });
    }
    var collections = { owners: 'F-MASTER', buildings: 'F-MASTER', leases: 'F-MASTER', landlordPays: 'F-MASTER', rooms: 'F-MASTER', staff: 'F-PAYROLL', assignments: 'F-MASTER', customers: 'F-BILL', contracts: 'F-BILL', invoices: 'F-BILL', receipts: 'F-DEBT', readings: 'F-METER', commonMeters: 'F-COMMON', commonReadings: 'F-COMMON', deposits: 'F-DEPOSIT', depositCases: 'F-DEPOSIT', expenses: 'F-PNL', salaryAdjustments: 'F-PAYROLL', shares: 'F-SHARE', assets: 'F-ASSET', billAdjusts: 'F-BILL' };
    Object.keys(collections).forEach(function (key) { db[key].forEach(function (r) { r.sourceBasis = basis(collections[key]); }); });
    db.buildings.forEach(function (b, i) { b.sourceGroup = ['T', 'S', 'G'][i]; b.demoSourceCode = ['DEMO-T01', 'DEMO-S01', 'DEMO-G01'][i]; });
    // Existing operational groups/IDs are retained; T/S/G is an independent
    // customer classification, not a replacement for access or banking groups.
    db.sourceGroups = ['T', 'S', 'G'].map(function (g, i) { return { id: g, name: 'Nhà ' + g, buildings: [db.buildings[i].id] }; });

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
    // TX-101 invoice lines from inputs, then preserve the fully-paid scenario.
    var ct = db.contracts.find(function (c) { return c.roomId === 'TX-101' && c.status === 'active'; });
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
    var over = db.receipts.find(function (r) { return r.invoiceId === 'INV-2605-CG101' && r.status === 'confirmed'; });
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

    db.serviceContracts = [];
    db.supplierBills = [];
    db.buildings.forEach(function (b, bi) {
      ['elec', 'water', 'internet'].forEach(function (type) {
        var id = 'DV-' + b.id.slice(3) + '-' + type;
        db.serviceContracts.push({ id: id, buildingId: b.id, type: type, accountCode: 'DEMO-' + type.toUpperCase() + '-' + String(bi + 1).padStart(3, '0'),
          holder: 'Chủ hợp đồng dịch vụ mô phỏng ' + (bi + 1), from: '2026-05-01', to: null, status: 'active', sourceBasis: basis('F-SUPPLIER', 'DS-02') });
        db.expenses.filter(function (e) { return e.buildingId === b.id && e.category === (type === 'internet' ? 'internet' : 'utility'); }).forEach(function (e) {
          var amount = type === 'internet' ? e.amount : e[type];
          db.supplierBills.push({ id: 'NCC-' + e.id + '-' + type, serviceContractId: id, buildingId: b.id, period: e.period, amount: amount, expenseId: e.id, status: e.status,
            sourceBasis: basis('F-SUPPLIER', 'DS-02') });
        });
      });
    });
    db.repairJobs = db.expenses.filter(function (e) { return e.category === 'repair' && e.description.indexOf('nhập lại') < 0; }).map(function (e, i) {
      var materials = Math.round(e.amount * 0.6 / 1000) * 1000;
      var job = { id: 'SC-DEMO-' + String(i + 1).padStart(3, '0'), buildingId: e.buildingId, period: e.period, expenseId: e.id,
        description: e.description, technicianId: 'NV-012', status: e.status, sourceBasis: basis('F-REPAIR', 'DS-08'),
        lines: [{ kind: 'materials', name: 'Vật tư theo phiếu mô phỏng', qty: 1, unitPrice: materials }, { kind: 'labor', name: 'Công sửa chữa', qty: 1, unitPrice: e.amount - materials }] };
      e.repairJobId = job.id; e.sourceBasis = basis('F-REPAIR', 'DS-08'); return job;
    });
    db.commissions = db.expenses.filter(function (e) { return e.category === 'commission' && e.description.indexOf('Hoa hồng') === 0; }).map(function (e, i) {
      var c = db.contracts.find(function (x) { return x.roomId === e.roomId && x.status === 'active'; });
      return { id: 'HH-DEMO-' + (i + 1), buildingId: e.buildingId, roomId: e.roomId, contractId: c.id, period: e.period, rent: c.rent,
        rate: 0.5, amount: Math.round(c.rent * 0.5), expenseId: e.id, status: e.status, sourceBasis: basis('F-COMMISSION', 'DS-09') };
    });
    var newCt = db.contracts.find(function (c) { return c.id === 'HĐ-TX202/26'; });
    var hh = { id: 'HH-DEMO-3', buildingId: 'TH-TX', roomId: 'TX-202', contractId: newCt.id, period: '2026-10', rent: newCt.rent, rate: 0.35,
      amount: Math.round(newCt.rent * 0.35), expenseId: 'CP-DEMO-HH-2610', status: 'pending', sourceBasis: basis('F-COMMISSION', 'DS-09') };
    db.commissions.push(hh);
    db.expenses.push({ id: hh.expenseId, buildingId: hh.buildingId, roomId: hh.roomId, period: hh.period, category: 'commission', description: 'Hoa hồng phòng mới TX-202 · 35% giá chốt',
      amount: hh.amount, docNo: 'DEMO-HH-2610', date: '2026-10-20', status: 'pending', createdBy: 'NV-005', approvedBy: null, approvedAt: null, file: 'DEMO_HH_TX202.pdf', reason: '', sourceBasis: hh.sourceBasis });
    db.forecastPlans = db.buildings.map(function (b, i) { return { id: 'DK-2610-' + b.id.slice(3), buildingId: b.id, period: '2026-10', baselinePeriod: '2026-09', mode: 'kd', status: 'draft',
      assumptions: 'Kế hoạch demo: lấy kỳ 09 làm cơ sở, cộng riêng dự kiến tăng thu và sửa chữa; không phải chứng từ thực tế.',
      adjustments: [{ target: 'revenue', amount: (i + 1) * 300000, note: 'Dự kiến tăng thu tiền phòng' }, { target: 'cost', amount: 200000 + i * 100000, note: 'Dự kiến sửa chữa bổ sung' }], sourceBasis: basis('F-FORECAST', 'DS-13') }; });
    scenario('DS-01', 'Chủ nhà, kỳ trả và nhóm T/S/G', 'F-MASTER', ['HĐT-CG-2024', 'LT-CG-2610']);
    scenario('DS-02', 'Hợp đồng dịch vụ và hóa đơn đầu vào', 'F-SUPPLIER', db.serviceContracts.map(function (x) { return x.id; }));
    scenario('DS-03', 'Nước theo người, khác nước theo công tơ', 'F-PERSON', [ct.id, 'INV-2609-TX101'], '2026-09');
    scenario('DS-04', 'Phòng mới lẻ ngày, cọc và trả trước ba tháng', 'F-BILL', ['HĐ-TX202/26', 'INV-2609-TX301', 'COC-2610-01']);
    scenario('DS-05', 'Đối chiếu tiền dư và dấu công nợ Excel', 'F-DEBT', [over.id, over.invoiceId], '2026-05');
    scenario('DS-06', 'Thu nhiều lần, chờ xác nhận và thu sau ngày 15', 'F-PERF', ['INV-2610-CG201', 'INV-2610-CG202', 'INV-2610-DD102']);
    scenario('DS-07', 'Cọc: đối chiếu, chờ duyệt và hoàn một phần đã chi', 'F-DEPOSIT', db.depositCases.map(function (x) { return x.id; }));
    scenario('DS-08', 'Vật tư và nhân công liên kết một khoản chi', 'F-REPAIR', db.repairJobs.map(function (x) { return x.id; }));
    scenario('DS-09', 'Hoa hồng 50% và 35%, đã duyệt/chờ duyệt', 'F-COMMISSION', db.commissions.map(function (x) { return x.id; }));
    scenario('DS-10', 'Lương nháp /90 và điều chỉnh', 'F-PAYROLL', ['NV-003', 'NV-004', 'NV-005']);
    scenario('DS-11', 'Phân bổ chi phí theo 18 phòng', 'F-POOL', db.buildings.map(function (x) { return x.id; }));
    scenario('DS-12', 'Điện chung, số người thay đổi, chỉ số thiếu/lùi', 'F-COMMON', ['CTC-TX-01', 'TX-102', 'TX-201']);
    scenario('DS-13', 'Dự kiến lợi nhuận tách khỏi kết quả thực tế', 'F-FORECAST', db.forecastPlans.map(function (x) { return x.id; }));
    scenario('DS-14', 'Tổng/KD, cổ phần và báo cáo đã lưu', 'F-SHARE', ['BC04-202609-CG-v1', 'BC05-202608-CG.DD.TX-v1']);
    scenario('DS-15', 'Hóa đơn lịch sử trước khi kết thúc hợp đồng', 'F-BILL', ['INV-2607-TX202', 'INV-2608-CG401', 'INV-2609-DD302'], '2026-07');
    db.reportRuns = TH.DATASET_REPORTS ? clone(TH.DATASET_REPORTS) : [];
    db.reportDrafts = [];
    return db;
  };
})();
