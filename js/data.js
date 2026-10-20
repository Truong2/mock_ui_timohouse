/*
 * Dataset minh họa TIMEHOUSE — một nguồn duy nhất cho mọi màn.
 * Chuỗi liên kết: chủ nhà → tòa → phòng → khách → hợp đồng → chỉ số → hóa đơn → thu/chi → lương/cổ phần/báo cáo.
 * Mọi KPI/tổng hợp được tính trong TH.calc từ các bản ghi gốc; không gõ số rời.
 * Toàn bộ tên, số điện thoại, giấy tờ, địa chỉ là GIẢ và đã mask.
 */
var TH = window.TH = window.TH || {};

TH.TODAY = '2026-10-20';
TH.CURRENT_PERIOD = '2026-10';
TH.PERIODS = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
TH.DATA_SCHEMA = 6;

/* Vai trò phụ trách tòa (CR-BLD-01, note.md §3.2 · cột NVVH/Lead/NVVS/NSKT trong docs/Thông tin nhà.xlsx).
   tier: gói bắt đầu được phân công vai trò này (A: một NV vận hành chính — F006.A; B: nhiều người theo vai trò — F006.B). */
TH.BLD_ROLES = [
  { id: 'Nhân viên vận hành', short: 'NVVH', tier: 'A', hint: 'Phụ trách chính — quản lý tòa, báo thu' },
  { id: 'Trưởng nhóm', short: 'Lead', tier: 'B', hint: 'Trưởng nhóm phụ trách' },
  { id: 'Nhân viên vệ sinh', short: 'NVVS', tier: 'B', hint: 'Vệ sinh khu chung' },
  { id: 'Nhân viên kỹ thuật', short: 'NSKT', tier: 'B', hint: 'Sửa chữa, bảo trì' },
];
TH.ROLE_MAIN = 'Nhân viên vận hành';
TH.BLD_CONDITIONS = ['Mới', 'Trung bình', 'Cũ'];

TH.EXPENSE_CATS = {
  owner_rent: 'Tiền thuê trả chủ nhà',
  utility: 'Điện nước tổng (công tơ nguồn)',
  internet: 'Internet / truyền hình',
  cleaning: 'Vệ sinh',
  repair: 'Sửa chữa, bảo trì',
  supplies: 'Vật tư tiêu hao',
  equipment: 'Mua sắm thiết bị',
  waste: 'Phí thu rác / môi trường',
  elevator: 'Bảo trì thang máy',
  commission: 'Hoa hồng môi giới / marketing',
  other: 'Khác',
};

TH.seed = function () {
  var db = {};

  /* ---------- Chủ nhà ---------- */
  db.owners = [
    { id: 'CN-001', kind: 'person', name: 'Nguyễn Văn An', phone: '0901 ••• 218', email: 'an.nv@example.vn', address: 'Số 8, ngõ 12 đường Minh Họa, Cầu Giấy, Hà Nội', permAddress: 'Tổ 18, phường Minh Họa, Cầu Giấy, Hà Nội', idNo: '0010••••6218', idDate: '2021-04-19', idPlace: 'Cục CS QLHC về TTXH', taxCode: '0108•••512', bank: { no: '1903••••8015', name: 'Techcombank', holder: 'NGUYEN VAN AN' }, status: 'active', note: 'Ký thuê nguyên tòa 5 năm, thanh toán 3 tháng/lần trong ngày 01–10 tháng đầu kỳ.', createdAt: '2024-03-02' },
    { id: 'CN-002', kind: 'person', name: 'Trần Thị Bình', phone: '0912 ••• 604', email: 'binh.tt@example.vn', address: 'Số 21 phố Mẫu Thử, Đống Đa, Hà Nội', permAddress: 'Số 21 phố Mẫu Thử, Đống Đa, Hà Nội', idNo: '0011••••4604', idDate: '2022-11-22', idPlace: 'Cục CS QLHC về TTXH', taxCode: '—', bank: { no: '1008••••0666', name: 'VietinBank', holder: 'TRAN THI BINH' }, status: 'active', note: 'Ưu tiên liên hệ qua điện thoại.', createdAt: '2024-07-15' },
    { id: 'CN-003', kind: 'org', name: 'Công ty TNHH Minh Phát (minh họa)', rep: 'Lê Minh Phát — Giám đốc', phone: '024 ••• 7788', email: 'lienhe@minhphat.example.vn', address: 'Tầng 3, số 5 đường Ví Dụ, Thanh Xuân, Hà Nội', permAddress: 'Tầng 3, số 5 đường Ví Dụ, Thanh Xuân, Hà Nội', idNo: '0010••••7731', idDate: '2021-08-02', idPlace: 'Cục CS QLHC về TTXH', taxCode: '0109•••037', bank: { no: '2151••••0349', name: 'BIDV', holder: 'CONG TY TNHH MINH PHAT' }, status: 'active', note: 'Đại diện: Lê Minh Phát. Hợp đồng thuê tòa qua pháp nhân.', createdAt: '2025-01-10' },
    { id: 'CN-004', kind: 'person', name: 'Lê Hoàng Cường', phone: '0987 ••• 341', email: '—', address: 'Số 3 ngõ 9 phố Giả Định, Hà Đông, Hà Nội', permAddress: 'Số 3 ngõ 9 phố Giả Định, Hà Đông, Hà Nội', idNo: '0010••••3341', idDate: '2020-06-10', idPlace: 'Cục CS QLHC về TTXH', taxCode: '—', bank: { no: '0300••••0688', name: 'Sacombank', holder: 'LE HOANG CUONG' }, status: 'inactive', note: 'Đã kết thúc hợp tác 06/2025.', createdAt: '2023-11-20' },
  ];

  /* ---------- Tòa ---------- */
  db.buildings = [
    { id: 'TH-CG', name: 'TimeHouse Cầu Giấy', short: 'Cầu Giấy', area: 'Cầu Giấy', address: 'Số 18, ngõ 75 đường Minh Họa, Cầu Giấy, Hà Nội', ownerId: 'CN-001', managerId: 'NV-003', floors: 4, elecPrice: 3800, waterPrice: 30000, ownerRent: 18000000, openedAt: '2024-04-01', status: 'active', evnCode: 'PD05•••2909', waterCode: 'NS•••0417', netCode: 'FPT•••88', areaM2: 120, areaType: null, condition: 'Mới', elevator: true, gcn: { no: 'CS 05•••18', issuer: 'UBND quận Cầu Giấy', date: '2015-06-12' }, fire: { status: 'yes', file: 'PCCC_nghiem_thu_CG_2024.pdf', note: 'Biên bản nghiệm thu PCCC 03/2024' }, bizReg: { status: 'yes', file: 'DKKD_ho_kinh_doanh_CG.pdf', holder: null }, opFrom: '2024-04-01', opTo: null },
    { id: 'TH-DD', name: 'TimeHouse Đống Đa', short: 'Đống Đa', area: 'Đống Đa', address: 'Số 46 phố Mẫu Thử, Đống Đa, Hà Nội', ownerId: 'CN-002', managerId: 'NV-004', floors: 3, elecPrice: 3800, waterPrice: 28000, ownerRent: 12500000, openedAt: '2024-08-01', status: 'active', evnCode: 'PD05•••8589', waterCode: 'NS•••1122', netCode: 'VNPT•••31', areaM2: 85, areaType: null, condition: 'Trung bình', elevator: false, gcn: { no: 'BĐ 11•••46', issuer: 'UBND quận Đống Đa', date: '2011-09-30' }, fire: { status: 'yes', file: 'PCCC_tham_duyet_DD.pdf', note: 'Giấy chứng nhận thẩm duyệt PCCC' }, bizReg: { status: 'no', file: null, holder: null }, opFrom: '2024-08-01', opTo: null },
    { id: 'TH-TX', name: 'TimeHouse Thanh Xuân', short: 'Thanh Xuân', area: 'Thanh Xuân', address: 'Số 9 ngách 4 đường Ví Dụ, Thanh Xuân, Hà Nội', ownerId: 'CN-003', managerId: 'NV-005', floors: 3, elecPrice: 4000, waterPrice: 30000, ownerRent: 9000000, openedAt: '2025-02-01', status: 'active', evnCode: 'PD05•••5868', waterCode: 'NS•••0930', netCode: 'FPT•••14', areaM2: 70, areaType: null, condition: 'Cũ', elevator: false, gcn: { no: 'CT 02•••09', issuer: 'UBND quận Thanh Xuân', date: '2009-03-18' }, fire: { status: 'no', file: null, note: 'Đang làm hồ sơ — hạn bổ sung 30/11/2026' }, bizReg: { status: 'yes', file: 'DKKD_TX.pdf', holder: null }, opFrom: '2025-02-01', opTo: null },
  ];
  db.ownerLinks = [
    { buildingId: 'TH-CG', ownerId: 'CN-001', role: 'Chủ sở hữu', from: '2024-04-01', to: null },
    { buildingId: 'TH-DD', ownerId: 'CN-004', role: 'Chủ sở hữu', from: '2024-08-01', to: '2025-06-30' },
    { buildingId: 'TH-DD', ownerId: 'CN-002', role: 'Chủ sở hữu', from: '2025-07-01', to: null },
    { buildingId: 'TH-TX', ownerId: 'CN-003', role: 'Chủ sở hữu', from: '2025-02-01', to: null },
  ];

  /* ---------- Hợp đồng thuê tòa với chủ nhà (CR-BLD-01) ----------
     Trường theo docs/Hợp đồng thuê nhà 2026(Mẫu) tùng sói.doc: tiền thuê/tháng, đặt cọc, ngày giao nhà, thời hạn 60 tháng từ–đến,
     thanh toán theo kỳ 03 tháng/lần vào ngày 01–10 tháng đầu kỳ; giữ giá, người giới thiệu nguồn nhà ≠ người nhập dữ liệu (ques.md §3). */
  db.leases = [
    { id: 'HĐT-CG-2024', buildingId: 'TH-CG', ownerId: 'CN-001', rent: 18000000, deposit: 18000000, handover: '2024-03-25', start: '2024-04-01', end: '2029-03-31', termMonths: 60, holdFrom: '2024-04-01', holdTo: '2027-03-31', payCycle: 3, payFrom: 1, payTo: 10, referrer: 'Trần Văn Điệp (CTV nguồn nhà)', enteredBy: 'NV-001', enteredAt: '2024-03-20', note: 'Bên thuê được cải tạo, nâng cấp khi chủ nhà đồng ý bằng văn bản; đơn phương chấm dứt bồi thường 03 tháng tiền thuê.', file: 'HDT_CG_2024_scan.pdf', status: 'active', versions: [{ v: 1, at: '2024-03-20', by: 'NV-001', note: 'Ký mới 60 tháng, giữ giá 36 tháng đầu' }] },
    { id: 'HĐT-DD-2024', buildingId: 'TH-DD', ownerId: 'CN-004', rent: 11800000, deposit: 23600000, handover: '2024-07-28', start: '2024-08-01', end: '2025-06-30', termMonths: 11, holdFrom: '2024-08-01', holdTo: '2025-06-30', payCycle: 6, payFrom: 1, payTo: 10, referrer: 'Ngô Thị Mai (NV kinh doanh)', enteredBy: 'NV-001', enteredAt: '2024-07-25', note: 'Thanh lý khi chủ nhà chuyển nhượng tòa 06/2025, hoàn cọc đủ.', file: 'HDT_DD_2024_scan.pdf', status: 'ended', versions: [{ v: 1, at: '2024-07-25', by: 'NV-001', note: 'Ký mới' }, { v: 2, at: '2025-06-30', by: 'NV-002', note: 'Thanh lý — chủ mới tiếp nhận' }] },
    { id: 'HĐT-DD-2025', buildingId: 'TH-DD', ownerId: 'CN-002', rent: 12500000, deposit: 25000000, handover: '2025-07-01', start: '2025-07-01', end: '2030-06-30', termMonths: 60, holdFrom: '2025-07-01', holdTo: '2026-12-31', payCycle: 6, payFrom: 1, payTo: 10, referrer: 'Ngô Thị Mai (NV kinh doanh)', enteredBy: 'NV-002', enteredAt: '2025-06-26', note: 'Kế thừa từ HĐ chủ cũ; cọc 02 tháng. Sau giữ giá điều chỉnh theo thị trường, tối đa 5%/năm.', file: 'HDT_DD_2025_scan.pdf', status: 'active', versions: [{ v: 1, at: '2025-06-26', by: 'NV-002', note: 'Ký mới với chủ nhà mới' }] },
    { id: 'HĐT-TX-2025', buildingId: 'TH-TX', ownerId: 'CN-003', rent: 9000000, deposit: 9000000, handover: '2025-01-25', start: '2025-02-01', end: '2030-01-31', termMonths: 60, holdFrom: '2025-02-01', holdTo: '2028-01-31', payCycle: 3, payFrom: 1, payTo: 10, referrer: 'Lê Quốc Ước (CTV nguồn nhà)', enteredBy: 'NV-001', enteredAt: '2025-01-20', note: 'Ký với pháp nhân; xuất hóa đơn VAT tiền thuê theo kỳ.', file: 'HDT_TX_2025_scan.pdf', status: 'active', versions: [{ v: 1, at: '2025-01-20', by: 'NV-001', note: 'Ký mới 60 tháng' }] },
  ];

  /* Lịch thanh toán cho chủ nhà (note.md §5.4) — mỗi kỳ = tiền thuê × chu kỳ, hạn ngày 10 tháng đầu kỳ.
     Kỳ 10/2026: CG đã trả, DD trả một phần (quá hạn phần còn lại), TX chưa trả (quá hạn). */
  db.landlordPays = [];
  function addPay(leaseId, from, paid, paidAt, extra) {
    var l = db.leases.find(function (x) { return x.id === leaseId; });
    var amount = l.rent * l.payCycle;
    db.landlordPays.push(Object.assign({
      id: 'LT-' + l.buildingId.slice(3) + '-' + from.slice(2, 4) + from.slice(5), leaseId: l.id, buildingId: l.buildingId, ownerId: l.ownerId,
      from: from, to: addMonthsYm(from, l.payCycle - 1), dueAt: from + '-' + String(l.payTo).padStart(2, '0'), amount: amount,
      paid: paid === true ? amount : paid || 0, paidAt: paidAt || null, docNo: paidAt ? 'UNC-' + l.buildingId.slice(3) + '-' + from.slice(2, 4) + from.slice(5) : '', note: '', source: 'manual',
    }, extra || {}));
  }
  addPay('HĐT-CG-2024', '2026-01', true, '2026-01-07');
  addPay('HĐT-CG-2024', '2026-04', true, '2026-04-08');
  addPay('HĐT-CG-2024', '2026-07', true, '2026-07-09');
  addPay('HĐT-CG-2024', '2026-10', true, '2026-10-08');
  addPay('HĐT-DD-2025', '2026-02', true, '2026-02-06');
  addPay('HĐT-DD-2025', '2026-08', 50000000, '2026-08-09', { note: 'Trả trước 50 tr, phần còn lại hẹn chủ nhà cuối tháng 10' });
  addPay('HĐT-TX-2025', '2026-01', true, '2026-01-09');
  addPay('HĐT-TX-2025', '2026-04', true, '2026-04-10');
  addPay('HĐT-TX-2025', '2026-07', true, '2026-07-08');
  addPay('HĐT-TX-2025', '2026-10', 0, null, { note: 'Chờ duyệt chi — pháp nhân chưa gửi hóa đơn VAT' });

  /* Tài liệu tòa/chủ nhà: hình ảnh sổ đỏ (GCN), HĐ thuê tòa, minh chứng PCCC, ĐKKD */
  db.bldDocs = [
    { id: 'TLT-01', ownerId: 'CN-001', buildingId: 'TH-CG', kind: 'Sổ đỏ', file: 'so_do_CG_trang1.jpg', uploadedAt: '2024-03-20', by: 'NV-001', version: 1, access: 'Admin, Kế toán' },
    { id: 'TLT-02', ownerId: 'CN-001', buildingId: 'TH-CG', kind: 'Sổ đỏ', file: 'so_do_CG_trang2.jpg', uploadedAt: '2024-03-20', by: 'NV-001', version: 1, access: 'Admin, Kế toán' },
    { id: 'TLT-03', ownerId: 'CN-001', buildingId: 'TH-CG', leaseId: 'HĐT-CG-2024', kind: 'HĐ thuê tòa', file: 'HDT_CG_2024_scan.pdf', uploadedAt: '2024-03-20', by: 'NV-001', version: 1, access: 'Admin, Kế toán' },
    { id: 'TLT-04', ownerId: 'CN-001', buildingId: 'TH-CG', kind: 'PCCC', file: 'PCCC_nghiem_thu_CG_2024.pdf', uploadedAt: '2024-03-28', by: 'NV-003', version: 1, access: 'Admin, Kế toán, QL tòa' },
    { id: 'TLT-05', ownerId: 'CN-001', buildingId: 'TH-CG', kind: 'ĐKKD', file: 'DKKD_ho_kinh_doanh_CG.pdf', uploadedAt: '2024-04-10', by: 'NV-002', version: 2, access: 'Admin, Kế toán' },
    { id: 'TLT-06', ownerId: 'CN-002', buildingId: 'TH-DD', kind: 'Sổ đỏ', file: 'so_do_DD.jpg', uploadedAt: '2025-06-26', by: 'NV-002', version: 1, access: 'Admin, Kế toán' },
    { id: 'TLT-07', ownerId: 'CN-002', buildingId: 'TH-DD', leaseId: 'HĐT-DD-2025', kind: 'HĐ thuê tòa', file: 'HDT_DD_2025_scan.pdf', uploadedAt: '2025-06-26', by: 'NV-002', version: 1, access: 'Admin, Kế toán' },
    { id: 'TLT-08', ownerId: 'CN-002', buildingId: 'TH-DD', kind: 'PCCC', file: 'PCCC_tham_duyet_DD.pdf', uploadedAt: '2024-08-05', by: 'NV-004', version: 1, access: 'Admin, Kế toán, QL tòa' },
    { id: 'TLT-09', ownerId: 'CN-004', buildingId: 'TH-DD', leaseId: 'HĐT-DD-2024', kind: 'HĐ thuê tòa', file: 'HDT_DD_2024_scan.pdf', uploadedAt: '2024-07-25', by: 'NV-001', version: 2, access: 'Admin, Kế toán' },
    { id: 'TLT-10', ownerId: 'CN-003', buildingId: 'TH-TX', kind: 'Sổ đỏ', file: 'GCN_TX_ban_sao.pdf', uploadedAt: '2025-01-20', by: 'NV-001', version: 1, access: 'Admin, Kế toán' },
    { id: 'TLT-11', ownerId: 'CN-003', buildingId: 'TH-TX', leaseId: 'HĐT-TX-2025', kind: 'HĐ thuê tòa', file: 'HDT_TX_2025_scan.pdf', uploadedAt: '2025-01-20', by: 'NV-001', version: 1, access: 'Admin, Kế toán' },
    { id: 'TLT-12', ownerId: 'CN-003', buildingId: 'TH-TX', kind: 'ĐKKD', file: 'DKKD_TX.pdf', uploadedAt: '2025-02-12', by: 'NV-002', version: 1, access: 'Admin, Kế toán' },
  ];

  /* ---------- Phòng ---------- */
  var R = [
    ['TH-CG', '101', 1, 22, 4200000, 'occupied'], ['TH-CG', '102', 1, 24, 4500000, 'occupied'],
    ['TH-CG', '201', 2, 28, 5200000, 'occupied'], ['TH-CG', '202', 2, 26, 5000000, 'occupied'],
    ['TH-CG', '301', 3, 30, 5800000, 'occupied'], ['TH-CG', '302', 3, 28, 5500000, 'occupied'],
    ['TH-CG', '401', 4, 34, 6500000, 'vacant'],
    ['TH-DD', '101', 1, 20, 3800000, 'occupied'], ['TH-DD', '102', 1, 20, 3900000, 'occupied'],
    ['TH-DD', '201', 2, 25, 4600000, 'occupied'], ['TH-DD', '202', 2, 24, 4400000, 'occupied'],
    ['TH-DD', '301', 3, 30, 5200000, 'occupied'], ['TH-DD', '302', 3, 27, 4800000, 'maintenance'],
    ['TH-TX', '101', 1, 18, 3500000, 'occupied'], ['TH-TX', '102', 1, 19, 3600000, 'occupied'],
    ['TH-TX', '201', 2, 23, 4200000, 'occupied'], ['TH-TX', '202', 2, 22, 4000000, 'vacant'],
    ['TH-TX', '301', 3, 27, 4900000, 'occupied'],
  ];
  db.rooms = R.map(function (r) {
    var p = r[0].slice(3);
    return { id: p + '-' + r[1], code: p + '-' + r[1], buildingId: r[0], floor: r[2], area: r[3], rent: r[4], status: r[5], meters: [{ type: 'elec', code: 'Đ-' + p + r[1] }, { type: 'water', code: 'N-' + p + r[1] }] };
  });
  db.roomEvents = [
    { roomId: 'DD-302', at: '2026-09-28', from: 'occupied', to: 'maintenance', by: 'NV-004', note: 'Thấm trần, sửa chữa đến 31/10' },
    { roomId: 'CG-401', at: '2026-08-31', from: 'occupied', to: 'vacant', by: 'NV-003', note: 'Khách thanh lý đúng hạn' },
    { roomId: 'TX-202', at: '2026-07-15', from: 'occupied', to: 'vacant', by: 'NV-005', note: 'Khách chuyển đi' },
  ];
  db.priceHistory = [
    { roomId: 'CG-301', from: '2025-04-01', rent: 5500000 }, { roomId: 'CG-301', from: '2026-04-01', rent: 5800000 },
    { roomId: 'DD-201', from: '2024-08-01', rent: 4400000 }, { roomId: 'DD-201', from: '2026-01-01', rent: 4600000 },
  ];

  /* ---------- Khách thuê ---------- */
  var C = [
    ['KH-001', 'Phạm Quốc Bảo', '1996-04-12', true], ['KH-002', 'Đỗ Mai Anh', '1999-09-03', true],
    ['KH-003', 'Nguyễn Thành Công', '1994-01-25', true], ['KH-004', 'Vũ Thị Hồng Nhung', '1998-07-19', false],
    ['KH-005', 'Lê Minh Khang', '1997-11-30', true], ['KH-006', 'Trịnh Thu Phương', '2000-02-14', true],
    ['KH-007', 'Hoàng Gia Huy', '1995-05-05', true], ['KH-008', 'Bùi Ngọc Lan', '2001-08-21', false],
    ['KH-009', 'Đặng Tuấn Kiệt', '1993-12-02', true], ['KH-010', 'Ngô Bảo Châu Anh', '1999-03-17', true],
    ['KH-011', 'Phan Đức Mạnh', '1992-10-08', true], ['KH-012', 'Mai Thị Thanh Tâm', '1998-06-27', true],
    ['KH-013', 'Tạ Quang Vinh', '1996-09-09', false], ['KH-014', 'Lý Hải Yến', '2000-12-01', true],
    ['KH-015', 'Cao Minh Đức', '1995-04-23', true],
  ];
  db.customers = C.map(function (c, i) {
    return { id: c[0], name: c[1], dob: c[2], phone: '09' + (10 + i) + ' ••• ' + (100 + i * 37) % 1000, idNo: '0010' + (93 + i) + '•••••' + (512 + i * 41) % 1000, idType: 'CCCD', hometown: ['Nam Định', 'Thái Bình', 'Hải Dương', 'Nghệ An', 'Thanh Hóa', 'Bắc Ninh', 'Hà Nam'][i % 7], oaLinked: c[3], oaConsentAt: c[3] ? '2026-0' + (1 + (i % 8)) + '-1' + (i % 9) : null, status: 'active', createdAt: '2025-0' + (1 + (i % 9)) + '-0' + (1 + (i % 9)) };
  });
  db.customerHistory = [
    { customerId: 'KH-003', at: '2026-08-12', field: 'Số điện thoại', before: '0912 ••• 101', after: db.customers[2].phone, by: 'NV-003' },
    { customerId: 'KH-005', at: '2026-05-04', field: 'Địa chỉ thường trú', before: 'Thanh Hóa (cũ)', after: 'Thanh Hóa', by: 'NV-003' },
  ];

  /* ---------- Hợp đồng ---------- */
  var occupied = db.rooms.filter(function (r) { return r.status === 'occupied'; });
  var ends = { 'CG-202': '2026-11-05', 'DD-102': '2026-11-15', 'TX-101': '2026-11-30', 'CG-301': '2026-12-20' };
  db.contracts = occupied.map(function (room, i) {
    var start = ['2025-05-01', '2025-06-01', '2025-07-01', '2025-11-06', '2025-12-21', '2026-01-01', '2025-09-01', '2025-11-16', '2026-02-01', '2026-03-01', '2025-10-01', '2025-12-01', '2026-04-01', '2026-05-01', '2026-06-01'][i];
    var end = ends[room.id] || addMonths(start, 12, -1);
    if (end < TH.TODAY) end = addMonths(start, 24, -1); // đã gia hạn thêm 12 tháng
    var people = 1 + (i % 2);
    return {
      id: 'HĐ-' + room.id.replace('-', '') + '/' + start.slice(2, 4),
      roomId: room.id, buildingId: room.buildingId, customerId: db.customers[i].id,
      rent: room.rent, deposit: room.rent, start: start, end: end, signedAt: addDays(start, -3),
      people: people, billingDay: 1, status: 'active', scanFile: 'scan_' + room.id + '.pdf',
      fees: [
        { code: 'SVC', name: 'Phí dịch vụ', price: 150000, qty: 1, unit: 'tháng' },
        { code: 'NET', name: 'Internet', price: 100000, qty: 1, unit: 'tháng' },
        { code: 'PARK', name: 'Gửi xe điện', price: 120000, qty: people, unit: 'xe' },
      ],
      versions: i % 5 === 2 ? [{ v: 1, at: start, note: 'Bản ký gốc' }, { v: 2, at: '2026-04-01', note: 'Phụ lục điều chỉnh giá thuê' }] : [{ v: 1, at: start, note: 'Bản ký gốc' }],
    };
  });
  db.followUps = [
    { contractId: contractIdOf(db, 'CG-202'), at: '2026-10-15', by: 'NV-003', result: 'no_answer', moveOutAt: null, callbackAt: '2026-10-22', note: 'Khách hẹn trả lời sau khi trao đổi với gia đình.' },
    { contractId: contractIdOf(db, 'DD-102'), at: '2026-10-12', by: 'NV-004', result: 'move_out', moveOutAt: '2026-11-15', callbackAt: null, note: 'Chuyển công tác, đã thông báo trước 30 ngày.' },
  ];

  /* ---------- Chỉ số điện nước (chốt số ngày 01 của kỳ) ---------- */
  db.readings = [];
  db.rooms.forEach(function (room, ri) {
    var e = 1200 + ri * 173, w = 300 + ri * 19;
    TH.PERIODS.forEach(function (p, pi) {
      var occ = room.status === 'occupied' || (room.id === 'CG-401' && pi < 4) || (room.id === 'TX-202' && pi < 2) || (room.id === 'DD-302' && pi < 5);
      var de = occ ? 85 + ((ri * 37 + pi * 23) % 95) : 3;
      var dw = occ ? 4 + ((ri * 5 + pi * 3) % 6) : 0;
      if (room.id === 'DD-301' && p === '2026-10') de = 412;
      var rd = { roomId: room.id, period: p, elecPrev: e, elecCur: e + de, waterPrev: w, waterCur: w + dw, status: 'confirmed', enteredBy: managerOf(db, room.buildingId), enteredAt: p + '-01', approvedBy: null, note: '' };
      if (room.id === 'DD-301' && p === '2026-10') { rd.approvedBy = 'NV-002'; rd.note = 'Tiêu thụ tăng ~3× trung bình — đã kiểm tra thực tế, khách dùng điều hòa liên tục.'; }
      if (room.buildingId === 'TH-TX' && p === '2026-10') {
        rd.status = 'draft';
        if (room.id === 'TX-201') { rd.elecCur = null; rd.waterCur = null; rd.status = 'missing'; }
        if (room.id === 'TX-102') { rd.waterCur = w - 14; rd.note = 'Nghi nhập nhầm chữ số.'; }
      }
      db.readings.push(rd);
      e += de; w += dw;
    });
  });
  db.meterChanges = [
    { roomId: 'CG-102', type: 'elec', at: '2026-06-18', oldCode: 'Đ-CG102-cu', newCode: 'Đ-CG102', oldFinal: 3105, newStart: 0, note: 'Công tơ cũ hỏng, thay mới; số reset về 0 (dữ liệu minh họa).' },
  ];

  /* ---------- Phí phát sinh ---------- */
  db.extraFees = [
    { id: 'PS-2610-01', roomId: 'CG-201', period: '2026-10', name: 'Sửa vòi sen', qty: 1, price: 150000, status: 'confirmed', source: 'Phiếu yêu cầu #YC-0912' },
    { id: 'PS-2610-02', roomId: 'DD-201', period: '2026-10', name: 'Thay bóng đèn', qty: 2, price: 30000, status: 'confirmed', source: 'Phiếu yêu cầu #YC-0918' },
    { id: 'PS-2610-03', roomId: 'TX-301', period: '2026-10', name: 'Vệ sinh điều hòa', qty: 1, price: 200000, status: 'draft', source: 'Phiếu yêu cầu #YC-0925' },
  ];

  /* ---------- Hóa đơn ---------- */
  db.invoices = [];
  TH.PERIODS.forEach(function (p) {
    db.contracts.forEach(function (ct) {
      if (ct.start > p + '-28') return;
      if (p === '2026-10' && ct.buildingId === 'TH-TX') return; // TX kỳ 10 chưa lập — dùng cho luồng INV-01
      db.invoices.push(buildInvoice(db, ct, p, 'confirmed'));
    });
  });

  /* ---------- Báo thu / phiếu thu ---------- */
  db.receipts = [];
  var seq = 1;
  function rc(inv, amount, day, status, extra) {
    var r = Object.assign({
      id: 'PT-' + inv.period.slice(2, 4) + inv.period.slice(5) + '-' + String(seq++).padStart(3, '0'),
      invoiceId: inv.id, amount: amount, reportedBy: managerOf(db, inv.buildingId),
      reportedAt: inv.period + '-' + String(day).padStart(2, '0'), receivedAt: inv.period + '-' + String(day).padStart(2, '0'),
      method: day % 3 === 0 ? 'Tiền mặt' : 'Chuyển khoản', evidence: day % 3 === 0 ? 'bien_nhan_' + inv.roomId + '.jpg' : 'ck_' + inv.roomId + '_' + inv.period.slice(5) + '.png',
      status: status, confirmedBy: status === 'confirmed' ? 'NV-002' : null, confirmedAt: status === 'confirmed' ? inv.period + '-' + String(Math.min(day + 1, 28)).padStart(2, '0') : null,
      note: '',
    }, extra || {});
    db.receipts.push(r);
    return r;
  }
  var dayCycle = [3, 4, 6, 8, 2, 9, 12, 5, 14, 7, 11, 4, 16, 10, 13];
  db.invoices.forEach(function (inv, k) {
    if (inv.period === '2026-10') return;
    if (inv.period === '2026-09' && inv.roomId === 'CG-302') { rc(inv, 3000000, 9, 'confirmed'); return; }
    rc(inv, inv.total, dayCycle[k % dayCycle.length], 'confirmed');
  });
  var cur = function (room) { return db.invoices.find(function (i) { return i.roomId === room && i.period === '2026-10'; }); };
  rc(cur('CG-101'), cur('CG-101').total, 3, 'confirmed');
  rc(cur('CG-102'), cur('CG-102').total, 8, 'confirmed');
  rc(cur('CG-201'), 2000000, 4, 'confirmed', { note: 'Thu lần 1' });
  rc(cur('CG-201'), cur('CG-201').total - 2000000, 13, 'confirmed', { note: 'Thu lần 2 — đủ' });
  rc(cur('CG-202'), cur('CG-202').total, 17, 'pending', { reportedAt: '2026-10-17', note: 'Khách chuyển khoản tối 17/10' });
  rc(cur('CG-301'), cur('CG-301').total, 14, 'confirmed');
  rc(cur('DD-101'), cur('DD-101').total, 2, 'confirmed');
  rc(cur('DD-102'), cur('DD-102').total, 19, 'confirmed');
  rc(cur('DD-201'), 3000000, 9, 'confirmed', { note: 'Thu lần 1' });
  rc(cur('DD-202'), cur('DD-202').total, 5, 'confirmed');
  rc(cur('DD-301'), cur('DD-301').total, 11, 'rejected', { method: 'Chuyển khoản', rejectReason: 'Ảnh chuyển khoản không khớp số tiền/người chuyển', confirmedBy: 'NV-002', confirmedAt: '2026-10-12' });
  rc(cur('DD-301'), 2500000, 18, 'pending', { reportedAt: '2026-10-18', note: 'Báo lại sau khi đối chiếu, thu một phần' });

  /* ---------- Chi phí ---------- */
  db.expenses = [];
  var ex = 1;
  function addExp(b, p, cat, desc, amount, status, extra) {
    db.expenses.push(Object.assign({
      id: 'CP-' + p.slice(2, 4) + p.slice(5) + '-' + String(ex++).padStart(3, '0'), buildingId: b, period: p, category: cat, description: desc, amount: amount,
      docNo: cat === 'owner_rent' ? 'HĐTT-' + b.slice(3) + '-' + p.slice(5) : 'HĐ' + (10200 + ex * 7), date: p + '-05', status: status,
      createdBy: managerOf(db, b), approvedBy: status === 'approved' ? 'NV-002' : null, approvedAt: status === 'approved' ? p + '-07' : null, file: 'chungtu_' + ex + '.pdf', reason: '',
    }, extra || {}));
  }
  TH.PERIODS.forEach(function (p, pi) {
    db.buildings.forEach(function (b, bi) {
      var isCur = p === '2026-10';
      addExp(b.id, p, 'owner_rent', 'Tiền thuê tòa tháng ' + p.slice(5) + '/' + p.slice(0, 4), b.ownerRent, isCur ? 'pending' : 'approved', { date: p + '-25', dueAt: p + '-25', paid: !isCur });
      var util = 3600000 + bi * 450000 + pi * 120000, utilElec = Math.round(util * 0.8 / 1000) * 1000;
      addExp(b.id, p, 'utility', 'Hóa đơn điện nước công tơ tổng', util, 'approved', { date: p + '-08', elec: utilElec, water: util - utilElec });
      addExp(b.id, p, 'waste', 'Phí thu gom rác tháng ' + p.slice(5), [200000, 150000, 150000][bi], 'approved', { date: p + '-10' });
      addExp(b.id, p, 'internet', 'Internet cáp quang toàn tòa', 1100000 - bi * 100000, 'approved', { date: p + '-03' });
      if (!isCur || bi !== 0) addExp(b.id, p, 'cleaning', 'Vệ sinh khu chung', 1500000 - bi * 200000, isCur ? 'approved' : 'approved', { date: p + '-15' });
      if (!isCur && (pi + bi) % 2 === 0) addExp(b.id, p, 'repair', ['Sửa khóa cửa', 'Thay bình nóng lạnh', 'Bảo trì máy bơm', 'Chống thấm sân thượng'][(pi + bi) % 4], 800000 + ((pi * 3 + bi) % 5) * 450000, 'approved', { date: p + '-18' });
    });
  });
  addExp('TH-CG', '2026-10', 'repair', 'Sửa máy bơm tăng áp', 2400000, 'pending', { docNo: 'HĐ10388', date: '2026-10-14' });
  addExp('TH-CG', '2026-10', 'cleaning', 'Vệ sinh khu chung', 1500000, 'draft', { date: '2026-10-16' });
  addExp('TH-DD', '2026-10', 'repair', 'Sơn lại hành lang tầng 2', 3200000, 'pending', { docNo: 'HĐ10402', date: '2026-10-12' });
  addExp('TH-DD', '2026-10', 'repair', 'Sơn hành lang tầng 2 (nhập lại)', 3200000, 'pending', { docNo: 'HĐ10402', date: '2026-10-13', createdBy: 'NV-006' });
  addExp('TH-TX', '2026-10', 'supplies', 'Bóng đèn, ổ cắm dự phòng', 650000, 'rejected', { reason: 'Thiếu chứng từ mua hàng', approvedBy: 'NV-002', approvedAt: '2026-10-11' });
  /* Các khoản dùng cho báo cáo theo mẫu khách (RPT-04/05): mua sắm, bảo trì thang máy, hoa hồng phòng mới */
  addExp('TH-CG', '2026-06', 'elevator', 'Bảo trì thang máy định kỳ quý 2', 800000, 'approved', { date: '2026-06-20' });
  addExp('TH-CG', '2026-09', 'elevator', 'Bảo trì thang máy định kỳ quý 3', 800000, 'approved', { date: '2026-09-20' });
  addExp('TH-TX', '2026-05', 'commission', 'Hoa hồng môi giới phòng TX-201', 2100000, 'approved', { date: '2026-05-03', roomId: 'TX-201' });
  addExp('TH-TX', '2026-06', 'commission', 'Hoa hồng môi giới phòng TX-301', 2450000, 'approved', { date: '2026-06-03', roomId: 'TX-301' });
  addExp('TH-TX', '2026-08', 'equipment', 'Điều hòa thay thế phòng TX-202', 6500000, 'approved', { date: '2026-08-12', roomId: 'TX-202' });
  addExp('TH-CG', '2026-09', 'equipment', 'Tủ lạnh + rèm phòng CG-401', 3200000, 'approved', { date: '2026-09-08', roomId: 'CG-401' });
  addExp('TH-DD', '2026-10', 'commission', 'Đăng tin cho thuê phòng DD-302', 300000, 'approved', { date: '2026-10-09', roomId: 'DD-302' });

  /* ---------- Cọc: nhận cọc phòng mới / khách bỏ cọc / hoàn cọc (dòng doanh thu đầu báo cáo mẫu) ---------- */
  db.deposits = [
    { id: 'COC-2605-01', buildingId: 'TH-TX', roomId: 'TX-201', period: '2026-05', date: '2026-05-01', type: 'in', amount: 4200000, note: 'Cọc HĐ mới TX-201', status: 'confirmed' },
    { id: 'COC-2606-01', buildingId: 'TH-TX', roomId: 'TX-301', period: '2026-06', date: '2026-06-01', type: 'in', amount: 4900000, note: 'Cọc HĐ mới TX-301', status: 'confirmed' },
    { id: 'COC-2607-01', buildingId: 'TH-TX', roomId: 'TX-202', period: '2026-07', date: '2026-07-15', type: 'forfeit', amount: 4000000, breach: true, note: 'Khách phá HĐ trước hạn — giữ cọc theo HĐ', status: 'confirmed' },
    { id: 'COC-2609-01', buildingId: 'TH-CG', roomId: 'CG-401', period: '2026-09', date: '2026-09-03', type: 'refund', amount: 6200000, note: 'Thanh lý đúng hạn 31/08 — hoàn cọc, trừ 300.000 hư hỏng', status: 'confirmed' },
    { id: 'COC-2609-02', buildingId: 'TH-CG', roomId: 'CG-401', period: '2026-09', date: '2026-09-20', type: 'forfeit', amount: 2000000, note: 'Khách giữ chỗ 10/09 rồi không vào ở', status: 'confirmed' },
    { id: 'COC-2610-01', buildingId: 'TH-TX', roomId: 'TX-202', period: '2026-10', date: '2026-10-12', type: 'in', amount: 4000000, note: 'Giữ chỗ, vào ở 01/11/2026', status: 'confirmed' },
  ];

  /* Tiền phòng phát sinh đã thu đủ (ngoài hóa đơn tháng) — thành phần C của hiệu suất (note.md §5.2), cũng là doanh thu tiền phòng */
  db.arisingRent = [
    { id: 'PS-2608-01', buildingId: 'TH-TX', roomId: 'TX-202', period: '2026-08', date: '2026-08-26', amount: 1800000, paidFull: true, note: 'Khách ở ngắn hạn 15–26/08 sau khi thay điều hòa, thu đủ 26/08' },
    { id: 'PS-2610-01', buildingId: 'TH-CG', roomId: 'CG-401', period: '2026-10', date: '2026-10-14', amount: 3000000, paidFull: true, note: 'Cho thuê ngắn ngày 01–14/10 khi chờ khách mới, thu đủ 14/10' },
  ];

  /* ---------- Tài sản tại tòa: tài sản chủ nhà / tài sản đầu tư thêm (note.md §4) ---------- */
  var eqId = function (room) { var e = db.expenses.find(function (x) { return x.category === 'equipment' && x.roomId === room; }); return e ? e.id : null; };
  db.assets = [
    { id: 'TS-CG-01', buildingId: 'TH-CG', group: 'owner', name: 'Điều hòa 12.000 BTU', qty: 7, unit: 'bộ', location: 'Phòng 101–401', condition: 'Tốt', note: 'Theo biên bản kiểm kê kèm HĐ thuê tòa', since: '2024-03-25' },
    { id: 'TS-CG-02', buildingId: 'TH-CG', group: 'owner', name: 'Bình nóng lạnh 30L', qty: 7, unit: 'cái', location: 'WC từng phòng', condition: 'Tốt', note: '', since: '2024-03-25' },
    { id: 'TS-CG-03', buildingId: 'TH-CG', group: 'owner', name: 'Thang máy 450 kg', qty: 1, unit: 'hệ', location: 'Trục thang', condition: 'Bình thường', note: 'Bảo trì định kỳ quý (chi phí bên thuê)', since: '2024-03-25' },
    { id: 'TS-CG-04', buildingId: 'TH-CG', group: 'owner', name: 'Hệ thống báo cháy', qty: 1, unit: 'hệ', location: 'Toàn tòa', condition: 'Tốt', note: 'Chủ nhà trang bị theo Điều 6.1 HĐ', since: '2024-03-25' },
    { id: 'TS-CG-05', buildingId: 'TH-CG', group: 'invest', name: 'Camera an ninh', qty: 4, unit: 'mắt', location: 'Cổng, hành lang', condition: 'Tốt', note: '', since: '2024-04-05', value: 6400000 },
    { id: 'TS-CG-06', buildingId: 'TH-CG', group: 'invest', name: 'Máy giặt chung 9 kg', qty: 2, unit: 'cái', location: 'Tầng 1', condition: 'Bình thường', note: '', since: '2024-04-10', value: 11000000 },
    { id: 'TS-CG-07', buildingId: 'TH-CG', group: 'invest', name: 'Tủ lạnh mini + rèm', qty: 1, unit: 'bộ', location: 'CG-401', condition: 'Mới', note: 'Mua sắm kỳ 09/2026', since: '2026-09-08', value: 3200000, expenseId: eqId('CG-401') },
    { id: 'TS-DD-01', buildingId: 'TH-DD', group: 'owner', name: 'Điều hòa 9.000 BTU', qty: 6, unit: 'bộ', location: 'Phòng 101–302', condition: 'Bình thường', note: '', since: '2024-07-28' },
    { id: 'TS-DD-02', buildingId: 'TH-DD', group: 'owner', name: 'Giường, tủ gỗ', qty: 6, unit: 'bộ', location: 'Phòng 101–302', condition: 'Cũ', note: 'Chủ cũ để lại, chủ mới xác nhận khi bàn giao 07/2025', since: '2025-07-01' },
    { id: 'TS-DD-03', buildingId: 'TH-DD', group: 'owner', name: 'Máy bơm tăng áp', qty: 1, unit: 'cái', location: 'Sân thượng', condition: 'Cần thay', note: 'Đề xuất chủ nhà thay (Điều 7.2)', since: '2024-07-28' },
    { id: 'TS-DD-04', buildingId: 'TH-DD', group: 'invest', name: 'Khóa vân tay', qty: 6, unit: 'cái', location: 'Cửa phòng', condition: 'Tốt', note: '', since: '2024-08-03', value: 9000000 },
    { id: 'TS-DD-05', buildingId: 'TH-DD', group: 'invest', name: 'Wifi mesh', qty: 3, unit: 'cục', location: 'Mỗi tầng', condition: 'Tốt', note: '', since: '2024-08-03', value: 4500000 },
    { id: 'TS-TX-01', buildingId: 'TH-TX', group: 'owner', name: 'Điều hòa 9.000 BTU', qty: 4, unit: 'bộ', location: 'TX-101, 102, 201, 301', condition: 'Bình thường', note: 'TX-202 hỏng, bên thuê thay mới', since: '2025-01-25' },
    { id: 'TS-TX-02', buildingId: 'TH-TX', group: 'owner', name: 'Bình nóng lạnh 20L', qty: 5, unit: 'cái', location: 'WC từng phòng', condition: 'Cũ', note: '', since: '2025-01-25' },
    { id: 'TS-TX-03', buildingId: 'TH-TX', group: 'invest', name: 'Điều hòa thay thế', qty: 1, unit: 'bộ', location: 'TX-202', condition: 'Mới', note: 'Mua sắm kỳ 08/2026', since: '2026-08-12', value: 6500000, expenseId: eqId('TX-202') },
    { id: 'TS-TX-04', buildingId: 'TH-TX', group: 'invest', name: 'Kệ giày, tủ đồ chung', qty: 2, unit: 'cái', location: 'Sảnh tầng 1', condition: 'Tốt', note: '', since: '2025-02-03', value: 2400000 },
  ];

  /* ---------- Chi phí chung toàn công ty (kế toán nhập theo kỳ), phân bổ về tòa theo số phòng ----------
     Dataset demo là 3 tòa đại diện trong danh mục ~360 phòng; cách chia giống sổ “BÁO CÁO KINH DOANH THÁNG 8” của khách. */
  db.costPools = {};
  TH.PERIODS.forEach(function (p, pi) {
    db.costPools[p] = {
      portfolioRooms: 360, rule: 'PB-01 · theo số phòng', status: p === '2026-10' ? 'draft' : 'approved', enteredBy: 'NV-002', enteredAt: p === '2026-10' ? '2026-10-18' : p + '-28',
      lines: { gm: 3400000, opsHead: 8800000, source: 800000, sales: 14600000 + pi * 200000, acct: 4400000, repairStaff: 6500000, security: 1500000, office: 14200000, marketing: 11500000 + (pi % 3) * 600000 },
    };
  });
  db.buildingGroups = [
    { id: 'NHA-1', name: 'Nhóm nhà 1 · Cầu Giấy – Đống Đa', short: 'Nhóm nhà 1', buildings: ['TH-CG', 'TH-DD'] },
    { id: 'NHA-2', name: 'Nhóm nhà 2 · Thanh Xuân', short: 'Nhóm nhà 2', buildings: ['TH-TX'] },
  ];

  /* ---------- Nhân sự ---------- */
  db.teams = [
    { id: 'T1', name: 'Đội 1 · Cầu Giấy – Đống Đa', leaderId: 'NV-003', parent: 'OPS' },
    { id: 'T2', name: 'Đội 2 · Thanh Xuân', leaderId: 'NV-005', parent: 'OPS' },
    { id: 'BO', name: 'Khối văn phòng', leaderId: 'NV-001', parent: null },
  ];
  db.staff = [
    { id: 'NV-001', name: 'Phạm Minh Đức', title: 'Giám đốc vận hành', team: 'BO', role: 'admin', phone: '0903 ••• 110', status: 'active', joinedAt: '2023-09-01', base: 18000000, allowance: 2000000 },
    { id: 'NV-002', name: 'Hoàng Thu Hà', title: 'Kế toán', team: 'BO', role: 'accountant', phone: '0904 ••• 225', status: 'active', joinedAt: '2024-01-08', base: 12000000, allowance: 1000000 },
    { id: 'NV-003', name: 'Vũ Quang Huy', title: 'Trưởng nhóm / QL tòa', team: 'T1', role: 'manager', phone: '0905 ••• 336', status: 'active', joinedAt: '2024-03-15', base: 9000000, allowance: 1500000 },
    { id: 'NV-004', name: 'Đỗ Thị Lan', title: 'Quản lý tòa', team: 'T1', role: 'manager', phone: '0906 ••• 447', status: 'active', joinedAt: '2024-07-20', base: 8000000, allowance: 1000000 },
    { id: 'NV-005', name: 'Bùi Văn Nam', title: 'Trưởng nhóm / QL tòa', team: 'T2', role: 'manager', phone: '0907 ••• 558', status: 'active', joinedAt: '2025-01-05', base: 8500000, allowance: 1500000 },
    { id: 'NV-006', name: 'Ngô Thị Mai', title: 'Nhân viên kinh doanh', team: 'T2', role: 'staff', phone: '0908 ••• 669', status: 'active', joinedAt: '2025-03-10', base: 7000000, allowance: 800000 },
    { id: 'NV-007', name: 'Đặng Văn Tú', title: 'Kỹ thuật vận hành', team: 'T1', role: 'staff', phone: '0909 ••• 770', status: 'inactive', joinedAt: '2024-05-02', base: 7500000, allowance: 500000 },
    { id: 'NV-008', name: 'Lý Thị Ngọc', title: 'Nhân sự – hành chính', team: 'BO', role: 'hr', phone: '0910 ••• 881', status: 'active', joinedAt: '2024-02-19', base: 10000000, allowance: 800000 },
    { id: 'NV-009', name: 'Trịnh Văn Hào', title: 'Nhân viên vệ sinh', team: 'T1', role: 'staff', phone: '0911 ••• 902', status: 'active', joinedAt: '2024-04-01', base: 6000000, allowance: 500000 },
    { id: 'NV-010', name: 'Phan Thị Hương', title: 'Nhân viên vệ sinh', team: 'T2', role: 'staff', phone: '0912 ••• 913', status: 'active', joinedAt: '2025-02-01', base: 6000000, allowance: 500000 },
    { id: 'NV-011', name: 'Mạc Văn Tuấn', title: 'Nhân viên kỹ thuật', team: 'T1', role: 'staff', phone: '0913 ••• 924', status: 'active', joinedAt: '2024-05-15', base: 7500000, allowance: 800000 },
    { id: 'NV-012', name: 'Lương Đức Mạnh', title: 'Nhân viên kỹ thuật', team: 'T2', role: 'staff', phone: '0914 ••• 935', status: 'active', joinedAt: '2026-03-01', base: 7000000, allowance: 600000 },
  ];
  db.assignments = [
    { id: 'PC-01', staffId: 'NV-003', buildingId: 'TH-CG', role: 'Nhân viên vận hành', main: true, from: '2024-04-01', to: null },
    { id: 'PC-02', staffId: 'NV-004', buildingId: 'TH-DD', role: 'Nhân viên vận hành', main: true, from: '2024-08-01', to: null },
    { id: 'PC-03', staffId: 'NV-006', buildingId: 'TH-TX', role: 'Nhân viên vận hành', main: true, from: '2025-02-01', to: '2026-06-30' },
    { id: 'PC-04', staffId: 'NV-005', buildingId: 'TH-TX', role: 'Nhân viên vận hành', main: true, from: '2026-07-01', to: null },
    { id: 'PC-05', staffId: 'NV-006', buildingId: 'TH-TX', role: 'Nhân viên vận hành', from: '2026-07-01', to: null, note: 'Hỗ trợ thu tiền' },
    { id: 'PC-06', staffId: 'NV-003', buildingId: 'TH-DD', role: 'Trưởng nhóm', from: '2025-01-01', to: null },
    { id: 'PC-07', staffId: 'NV-003', buildingId: 'TH-CG', role: 'Trưởng nhóm', from: '2025-01-01', to: null },
    { id: 'PC-08', staffId: 'NV-005', buildingId: 'TH-TX', role: 'Trưởng nhóm', from: '2026-07-01', to: null },
    { id: 'PC-09', staffId: 'NV-009', buildingId: 'TH-CG', role: 'Nhân viên vệ sinh', from: '2024-04-01', to: null },
    { id: 'PC-10', staffId: 'NV-009', buildingId: 'TH-DD', role: 'Nhân viên vệ sinh', from: '2024-08-01', to: null },
    { id: 'PC-11', staffId: 'NV-010', buildingId: 'TH-TX', role: 'Nhân viên vệ sinh', from: '2025-02-01', to: null },
    { id: 'PC-12', staffId: 'NV-011', buildingId: 'TH-CG', role: 'Nhân viên kỹ thuật', from: '2024-05-15', to: null },
    { id: 'PC-13', staffId: 'NV-011', buildingId: 'TH-DD', role: 'Nhân viên kỹ thuật', from: '2024-08-01', to: null },
    { id: 'PC-14', staffId: 'NV-011', buildingId: 'TH-TX', role: 'Nhân viên kỹ thuật', from: '2025-02-01', to: null },
    { id: 'PC-15', staffId: 'NV-012', buildingId: 'TH-TX', role: 'Nhân viên kỹ thuật', from: '2026-03-01', to: null },
  ];
  db.titleHistory = [
    { staffId: 'NV-003', at: '2025-01-01', before: 'Quản lý tòa', after: 'Trưởng nhóm / QL tòa' },
    { staffId: 'NV-005', at: '2026-07-01', before: 'Quản lý tòa', after: 'Trưởng nhóm / QL tòa' },
  ];

  /* ---------- Lương ---------- */
  /* Theo docs/"CÁCH TÍNH LƯƠNG PHÒNG VẬN HÀNH": đơn giá/phòng tại mốc HS 90% (ví dụ 110.000 cho thâm niên > 1 năm); bảng tham chiếu đầy đủ chờ khách cung cấp (D-06). */
  db.salaryPolicy = { ratePerRoom: { senior: 110000, junior: 90000 }, refHs: 90, leaderPerRoom: 10000, status: 'DRAFT', note: 'HS% = (A − A×B + C) ÷ tổng giá niêm yết, A = DT sau 3 mốc 5/10/15; mức lương/phòng = HS × đơn giá tham chiếu ÷ 90; lương HS = mức lương/phòng × số phòng; trưởng nhóm 10.000 đ/phòng. Bảng tham chiếu đầy đủ chờ ký (D-06).' };
  db.salaryAdjustments = [
    { id: 'DC-2610-01', staffId: 'NV-004', period: '2026-10', type: 'bonus', amount: 500000, reason: 'Xử lý sự cố thấm trần DD-302 ngoài giờ', createdBy: 'NV-002', createdAt: '2026-10-16', status: 'draft' },
    { id: 'DC-2610-02', staffId: 'NV-005', period: '2026-10', type: 'penalty', amount: -200000, reason: 'Nộp chỉ số kỳ 10 trễ hạn', createdBy: 'NV-002', createdAt: '2026-10-18', status: 'draft' },
  ];
  db.payrollStatus = { '2026-09': { status: 'confirmed', by: 'NV-002', at: '2026-10-03', note: 'Đã xác nhận bằng file Excel ngoài hệ thống' }, '2026-10': { status: 'draft' } };

  /* ---------- Cổ phần ---------- */
  db.shareholders = [
    { id: 'CD-01', name: 'Công ty TimeHouse (vận hành)', type: 'Pháp nhân' },
    { id: 'CD-02', name: 'Nguyễn Đức Long', type: 'Cá nhân' },
    { id: 'CD-03', name: 'Phạm Thu Trang', type: 'Cá nhân' },
    { id: 'CD-04', name: 'Trần Quốc Việt', type: 'Cá nhân' },
    { id: 'CD-05', name: 'Hoàng Minh Châu', type: 'Cá nhân' },
  ];
  db.shares = [
    { id: 'S-01', buildingId: 'TH-CG', shareholderId: 'CD-01', ratio: 40, capital: 400000000, from: '2024-04-01', to: null },
    { id: 'S-02', buildingId: 'TH-CG', shareholderId: 'CD-02', ratio: 35, capital: 350000000, from: '2024-04-01', to: null },
    { id: 'S-03', buildingId: 'TH-CG', shareholderId: 'CD-03', ratio: 25, capital: 250000000, from: '2024-04-01', to: null },
    { id: 'S-04', buildingId: 'TH-DD', shareholderId: 'CD-01', ratio: 50, capital: 400000000, from: '2024-08-01', to: null },
    { id: 'S-05', buildingId: 'TH-DD', shareholderId: 'CD-04', ratio: 30, capital: 240000000, from: '2024-08-01', to: null },
    { id: 'S-06', buildingId: 'TH-DD', shareholderId: 'CD-05', ratio: 20, capital: 160000000, from: '2024-08-01', to: null },
    { id: 'S-07', buildingId: 'TH-TX', shareholderId: 'CD-01', ratio: 45, capital: 270000000, from: '2025-02-01', to: null },
    { id: 'S-08', buildingId: 'TH-TX', shareholderId: 'CD-02', ratio: 30, capital: 180000000, from: '2025-02-01', to: null },
    { id: 'S-09', buildingId: 'TH-TX', shareholderId: 'CD-03', ratio: 25, capital: 150000000, from: '2025-02-01', to: '2026-06-30' },
    { id: 'S-10', buildingId: 'TH-TX', shareholderId: 'CD-05', ratio: 25, capital: 150000000, from: '2026-07-01', to: null },
  ];
  db.sharePayouts = [
    { id: 'PCCD-2609-01', buildingId: 'TH-CG', shareholderId: 'CD-02', period: '2026-09', amount: 0, paidAt: '2026-10-10', docNo: 'PC-0910', note: 'Nhập tay — xem số trên báo cáo' },
  ];
  db.periodLocks = { '2026-09': { locked: true, by: 'NV-002', at: '2026-10-06' } };
  db.periodApprovals = { '2026-09': { by: 'NV-002', at: '2026-10-05' } };
  db.snapshots = {}; // tạo khi duyệt kỳ (C); kỳ đã khóa được tạo lười khi mở báo cáo
  db.receiptEdits = [
    { receiptRoom: 'CG-301', period: '2026-10', from: '2026-10-16', to: '2026-10-14', by: 'NV-002', at: '2026-10-16 15:20', reason: 'Khách chuyển khoản 14/10, ngân hàng ghi có 16/10 — đối chiếu sao kê.' },
  ];
  db.reportTemplates = [
    { id: 'MAU-01', name: 'Báo cáo tổng hợp công ty (mặc định)', version: 3, status: 'approved' },
    { id: 'MAU-02', name: 'Mẫu HĐQT — so sánh tòa theo quý', version: 1, status: 'draft' },
    { id: 'MAU-BCKD', name: 'Báo cáo kinh doanh tháng (mẫu khách T8/2026)', version: 1, status: 'approved', report: 'RPT-05' },
    { id: 'MAU-BCKD-R', name: 'Báo cáo kinh doanh — rút gọn HĐQT', version: 1, status: 'draft', report: 'RPT-05', compact: true },
  ];

  /* ---------- Zalo OA (mô phỏng) ---------- */
  db.oa = { name: 'TimeHouse OA (mô phỏng)', provider: 'Chưa chốt nhà cung cấp', status: 'draft', reminderDay: 8, reminders: [5, 10, 15] };
  db.oaTemplates = [
    { id: 'TPL-01', name: 'Thông báo hóa đơn kỳ', kind: 'invoice', status: 'approved', version: 2, body: 'TimeHouse thông báo hóa đơn kỳ {ky} phòng {phong}: {tong_tien}. Hạn thanh toán {han}. Chi tiết: {link}' },
    { id: 'TPL-02', name: 'Nhắc thanh toán', kind: 'reminder', status: 'approved', version: 1, body: 'Phòng {phong} còn {con_no} chưa thanh toán cho kỳ {ky}. Vui lòng bỏ qua nếu đã chuyển khoản.' },
    { id: 'TPL-03', name: 'Nhắc hợp đồng sắp hết hạn', kind: 'expiry', status: 'draft', version: 1, body: 'Hợp đồng phòng {phong} hết hạn ngày {ngay_het_han}. Vui lòng phản hồi nhu cầu gia hạn.' },
  ];
  db.messages = [];
  var mseq = 1;
  db.invoices.filter(function (i) { return i.period === '2026-10' || i.period === '2026-09'; }).forEach(function (inv) {
    var cus = db.customers.find(function (c) { return c.id === inv.customerId; });
    var ok = cus.oaLinked;
    db.messages.push({ id: 'ZL-' + String(mseq++).padStart(4, '0'), invoiceId: inv.id, customerId: cus.id, template: 'TPL-01', at: inv.period + '-02 09:0' + (mseq % 10), status: ok ? 'sent' : 'skipped', reason: ok ? '' : 'Người nhận chưa liên kết OA — không gửi', retries: 0 });
  });
  ['CG-302', 'DD-201', 'DD-301', 'CG-202'].forEach(function (room, i) {
    var inv = cur(room);
    var cus = db.customers.find(function (c) { return c.id === inv.customerId; });
    db.messages.push({ id: 'ZL-' + String(mseq++).padStart(4, '0'), invoiceId: inv.id, customerId: cus.id, template: 'TPL-02', at: '2026-10-1' + (i % 2 ? 0 : 1) + ' 08:30', status: cus.oaLinked ? (i === 1 ? 'failed' : 'sent') : 'skipped', reason: !cus.oaLinked ? 'Người nhận chưa liên kết OA — không gửi' : i === 1 ? 'Provider timeout (mô phỏng)' : '', retries: i === 1 ? 1 : 0 });
  });

  /* ---------- Tài liệu ---------- */
  db.documents = [];
  db.contracts.forEach(function (ct, i) {
    db.documents.push({ id: 'TL-' + String(i * 2 + 1).padStart(3, '0'), customerId: ct.customerId, contractId: ct.id, roomId: ct.roomId, kind: 'Hợp đồng scan', file: ct.scanFile, version: ct.versions.length, uploadedAt: ct.signedAt, views: 2 + (i % 4) });
    db.documents.push({ id: 'TL-' + String(i * 2 + 2).padStart(3, '0'), customerId: ct.customerId, contractId: ct.id, roomId: ct.roomId, kind: 'CCCD (đã mask)', file: 'cccd_' + ct.customerId + '_mask.jpg', version: 1, uploadedAt: ct.signedAt, views: 1 + (i % 3) });
  });

  /* ---------- Import / batch / OCR ---------- */
  db.importBatches = [
    { id: 'IMP-0007', kind: 'room', file: 'phong_TX_khoitao.xlsx', at: '2025-02-02 10:12', by: 'NV-001', rows: 5, ok: 5, errors: 0, status: 'done' },
    { id: 'IMP-0006', kind: 'building', file: 'toa_nha_2025.xlsx', at: '2025-01-28 16:40', by: 'NV-001', rows: 1, ok: 1, errors: 0, status: 'done' },
    { id: 'IMP-0005', kind: 'owner', file: 'chu_nha_dot2.xlsx', at: '2025-01-10 09:05', by: 'NV-001', rows: 3, ok: 2, errors: 1, status: 'done' },
  ];
  db.ocrJobs = [];
  db.ocrTemplates = [
    { id: 'OCR-HĐ-01', kind: 'contract', name: 'Hợp đồng cho thuê phòng — bản đồng bộ (HĐKH-…)', status: 'approved', fields: 13, accuracy: 0.94 },
    { id: 'OCR-HĐ-02', kind: 'contract', name: 'Hợp đồng cho thuê phòng — bản đầy đủ (DEMO-TH-…)', status: 'approved', fields: 13, accuracy: 0.88 },
    { id: 'OCR-GT-01', kind: 'id', name: 'CCCD gắn chip — mặt trước', status: 'approved', fields: 6, accuracy: 0.96 },
    { id: 'OCR-GT-02', kind: 'id', name: 'CCCD mặt sau / giấy tạm trú', status: 'draft', fields: 4, accuracy: 0.81 },
  ];

  /* ---------- Người dùng hệ thống ---------- */
  db.users = [
    { id: 'U-01', staffId: 'NV-001', username: 'duc.pm', role: 'admin', scope: ['TH-CG', 'TH-DD', 'TH-TX'], status: 'active', perms: null },
    { id: 'U-02', staffId: 'NV-002', username: 'ha.ht', role: 'accountant', scope: ['TH-CG', 'TH-DD', 'TH-TX'], status: 'active', perms: null },
    { id: 'U-03', staffId: 'NV-003', username: 'huy.vq', role: 'manager', scope: ['TH-CG'], status: 'active', perms: null },
    { id: 'U-04', staffId: 'NV-004', username: 'lan.dt', role: 'manager', scope: ['TH-DD'], status: 'active', perms: null },
    { id: 'U-05', staffId: 'NV-005', username: 'nam.bv', role: 'manager', scope: ['TH-TX'], status: 'active', perms: null },
    { id: 'U-06', staffId: 'NV-008', username: 'ngoc.lt', role: 'hr', scope: [], status: 'active', perms: null },
  ];
  db.permVersions = [
    { v: 3, at: '2026-07-01', by: 'NV-001', note: 'Chuyển QL tòa Thanh Xuân sang NV-005' },
    { v: 2, at: '2025-02-01', by: 'NV-001', note: 'Thêm tòa Thanh Xuân vào phạm vi' },
    { v: 1, at: '2024-04-01', by: 'NV-001', note: 'Khởi tạo vai trò' },
  ];

  /* ---------- Audit ---------- */
  db.audit = [
    { at: '2026-10-19 16:02', by: 'NV-002', action: 'Xác nhận phiếu thu', entity: 'PT (DD-102)', detail: 'Thực nhận 19/10/2026 — sau mốc 15, HS 0%', kind: 'receipt', buildingId: 'TH-DD' },
    { at: '2026-10-14 10:21', by: 'NV-002', action: 'Xác nhận phiếu thu', entity: 'PT (CG-301)', detail: 'Thực nhận 14/10/2026', kind: 'receipt', buildingId: 'TH-CG' },
    { at: '2026-10-12 09:40', by: 'NV-002', action: 'Từ chối báo thu', entity: 'PT (DD-301)', detail: 'Ảnh chuyển khoản không khớp', kind: 'receipt', buildingId: 'TH-DD' },
    { at: '2026-10-09 08:15', by: 'NV-002', action: 'Duyệt chi phí', entity: 'Chi phí kỳ 10 (8 khoản)', detail: 'Điện nước tổng, internet, vệ sinh', kind: 'expense', buildingId: 'ALL' },
    { at: '2026-10-06 17:30', by: 'NV-002', action: 'Khóa kỳ', entity: 'Kỳ 09/2026', detail: 'Chốt số liệu báo cáo kỳ 09', kind: 'period', buildingId: 'ALL' },
    { at: '2026-10-01 14:05', by: 'NV-002', action: 'Xác nhận hóa đơn', entity: 'Batch kỳ 10 · Cầu Giấy, Đống Đa', detail: '11 hóa đơn', kind: 'invoice', buildingId: 'ALL' },
    { at: '2026-09-28 11:00', by: 'NV-004', action: 'Đổi trạng thái phòng', entity: 'DD-302', detail: 'Đang thuê → Đang sửa', kind: 'room', buildingId: 'TH-DD' },
  ];
  db.batches = [
    { id: 'BATCH-2610-01', period: '2026-10', buildings: ['TH-CG', 'TH-DD'], at: '2026-10-01 10:30', by: 'NV-003', created: 11, skipped: 0, status: 'confirmed', run: 1 },
  ];
  return db;
};

/* ---------- helpers dùng cho seed ---------- */
function addDays(iso, d) {
  var t = new Date(iso + 'T00:00:00');
  t.setDate(t.getDate() + d);
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}
function addMonths(iso, m, dd) {
  var t = new Date(iso + 'T00:00:00');
  t.setMonth(t.getMonth() + m);
  if (dd) t.setDate(t.getDate() + dd);
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}
function addMonthsYm(ym, n) {
  var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n;
  y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  return y + '-' + String(m + 1).padStart(2, '0');
}
TH.addMonthsYm = addMonthsYm;
function managerOf(db, bId) {
  var b = db.buildings.find(function (x) { return x.id === bId; });
  return b ? b.managerId : null;
}
function contractIdOf(db, roomId) {
  var c = db.contracts.find(function (x) { return x.roomId === roomId; });
  return c ? c.id : null;
}
TH.addDays = addDays;

/* Tạo hóa đơn từ hợp đồng + chỉ số + phí phát sinh (dùng chung cho seed và luồng INV-01). */
function buildInvoice(db, ct, period, status) {
  var b = db.buildings.find(function (x) { return x.id === ct.buildingId; });
  var rd = db.readings.find(function (r) { return r.roomId === ct.roomId && r.period === period; });
  var lines = [{ type: 'rent', name: 'Tiền phòng tháng ' + period.slice(5) + '/' + period.slice(0, 4), qty: 1, unit: 'tháng', price: ct.rent }];
  ct.fees.forEach(function (f) { lines.push({ type: 'fixed', code: f.code, name: f.name, qty: f.qty, unit: f.unit, price: f.price }); });
  var readingOk = rd && rd.elecCur !== null && rd.waterCur !== null && rd.waterCur >= rd.waterPrev && rd.elecCur >= rd.elecPrev;
  if (readingOk) {
    lines.push({ type: 'elec', name: 'Điện (' + rd.elecPrev + ' → ' + rd.elecCur + ')', qty: rd.elecCur - rd.elecPrev, unit: 'kWh', price: b.elecPrice });
    lines.push({ type: 'water', name: 'Nước (' + rd.waterPrev + ' → ' + rd.waterCur + ')', qty: rd.waterCur - rd.waterPrev, unit: 'm³', price: b.waterPrice });
  }
  (db.extraFees || []).filter(function (e) { return e.roomId === ct.roomId && e.period === period; }).forEach(function (e) {
    lines.push({ type: 'extra', name: e.name, qty: e.qty, unit: 'lần', price: e.price, refId: e.id, draft: e.status !== 'confirmed' });
  });
  lines.forEach(function (l) { l.amount = l.qty * l.price; });
  var total = lines.reduce(function (s, l) { return s + l.amount; }, 0);
  return {
    id: 'INV-' + period.slice(2, 4) + period.slice(5) + '-' + ct.roomId.replace('-', ''),
    period: period, roomId: ct.roomId, buildingId: ct.buildingId, contractId: ct.id, customerId: ct.customerId,
    issuedAt: period + '-01', dueAt: period + '-10', lines: lines, total: total, status: status,
    readingOk: !!readingOk,
    confirmedBy: status === 'confirmed' ? 'NV-002' : null, confirmedAt: status === 'confirmed' ? period + '-01' : null, version: 1,
  };
}
TH.buildInvoice = buildInvoice;

/* =========================================================
   CALC — mọi tổng hợp đều từ bản ghi gốc
   ========================================================= */
TH.calc = (function () {
  function db() { return TH.db; }
  function sum(arr, f) { return arr.reduce(function (s, x) { return s + (f ? f(x) : x); }, 0); }
  function inScope(bId, scope) { return !scope || scope === 'ALL' || bId === scope; }

  var api = {
    sum: sum,
    building: function (id) { return db().buildings.find(function (b) { return b.id === id; }); },
    room: function (id) { return db().rooms.find(function (r) { return r.id === id; }); },
    owner: function (id) { return db().owners.find(function (o) { return o.id === id; }); },
    customer: function (id) { return db().customers.find(function (c) { return c.id === id; }); },
    staff: function (id) { return db().staff.find(function (s) { return s.id === id; }); },
    staffName: function (id) { var s = api.staff(id); return s ? s.name : '—'; },
    contract: function (id) { return db().contracts.find(function (c) { return c.id === id; }); },
    contractOfRoom: function (roomId) { return db().contracts.find(function (c) { return c.roomId === roomId && c.status === 'active'; }); },
    invoice: function (id) { return db().invoices.find(function (i) { return i.id === id; }); },
    reading: function (roomId, period) { return db().readings.find(function (r) { return r.roomId === roomId && r.period === period; }); },
    shareholder: function (id) { return db().shareholders.find(function (s) { return s.id === id; }); },

    invoiceTotal: function (inv) { return sum(inv.lines, function (l) { return l.amount; }); },
    receiptsOf: function (invId) { return db().receipts.filter(function (r) { return r.invoiceId === invId; }); },
    paid: function (invId) { return sum(api.receiptsOf(invId).filter(function (r) { return r.status === 'confirmed'; }), function (r) { return r.amount; }); },
    pending: function (invId) { return sum(api.receiptsOf(invId).filter(function (r) { return r.status === 'pending'; }), function (r) { return r.amount; }); },
    debt: function (inv) { return inv.status === 'confirmed' ? Math.max(0, inv.total - api.paid(inv.id)) : 0; },
    payState: function (inv) {
      if (inv.status === 'draft') return 'draft';
      if (inv.status === 'cancelled') return 'cancelled';
      var d = api.debt(inv);
      if (d <= 0) return 'paid';
      var p = api.paid(inv.id);
      if (api.pending(inv.id) > 0) return 'reported';
      if (inv.dueAt < TH.TODAY) return p > 0 ? 'partial_overdue' : 'overdue';
      return p > 0 ? 'partial' : 'unpaid';
    },

    /* Mốc 5/10/15 theo ngày thực nhận đã xác nhận — DRAFT (D-04). */
    milestone: function (receipt, inv) {
      if (receipt.status !== 'confirmed') return null;
      if (receipt.receivedAt.slice(0, 7) !== inv.period) return { key: 'other', label: 'Ngoài kỳ', weight: 0 };
      var d = +receipt.receivedAt.slice(8, 10);
      if (d <= 5) return { key: 'm5', label: 'Mốc 5', weight: 1 };
      if (d <= 10) return { key: 'm10', label: 'Mốc 10', weight: 0.9 };
      if (d <= 15) return { key: 'm15', label: 'Mốc 15', weight: 0.7 };
      return { key: 'late', label: 'Sau 15', weight: 0 };
    },

    invoicesIn: function (period, scope) {
      return db().invoices.filter(function (i) { return i.period === period && inScope(i.buildingId, scope); });
    },
    receiptsReceivedIn: function (period, scope) {
      return db().receipts.filter(function (r) {
        var inv = api.invoice(r.invoiceId);
        return r.status === 'confirmed' && r.receivedAt.slice(0, 7) === period && inv && inScope(inv.buildingId, scope);
      });
    },
    expensesIn: function (period, scope, status) {
      return db().expenses.filter(function (e) { return e.period === period && inScope(e.buildingId, scope) && (!status || e.status === status); });
    },

    /* Tổng hợp tòa/kỳ cho RPT-01, SHARE-01… */
    summary: function (period, scope) {
      var invs = api.invoicesIn(period, scope).filter(function (i) { return i.status === 'confirmed'; });
      var billed = sum(invs, function (i) { return i.total; });
      var collectedForPeriod = sum(invs, function (i) { return api.paid(i.id); });
      var collected = sum(api.receiptsReceivedIn(period, scope), function (r) { return r.amount; });
      var pending = sum(db().receipts.filter(function (r) {
        var inv = api.invoice(r.invoiceId);
        return r.status === 'pending' && inv && inv.period === period && inScope(inv.buildingId, scope);
      }), function (r) { return r.amount; });
      var debtAll = sum(db().invoices.filter(function (i) { return i.status === 'confirmed' && i.period <= period && inScope(i.buildingId, scope); }), function (i) { return api.debt(i); });
      var debtPeriod = sum(invs, function (i) { return api.debt(i); });
      var expenses = sum(api.expensesIn(period, scope, 'approved'), function (e) { return e.amount; });
      var expensesPending = sum(db().expenses.filter(function (e) { return e.period === period && inScope(e.buildingId, scope) && (e.status === 'pending' || e.status === 'draft'); }), function (e) { return e.amount; });
      var rooms = db().rooms.filter(function (r) { return inScope(r.buildingId, scope); });
      var occ = rooms.filter(function (r) { return r.status === 'occupied'; }).length;
      var drafts = api.invoicesIn(period, scope).filter(function (i) { return i.status === 'draft'; }).length;
      var notBilled = db().buildings.filter(function (b) { return inScope(b.id, scope) && !db().invoices.some(function (i) { return i.buildingId === b.id && i.period === period; }); });
      return {
        billed: billed, collected: collected, collectedForPeriod: collectedForPeriod, pending: pending,
        debt: debtAll, debtPeriod: debtPeriod, expenses: expenses, expensesPending: expensesPending,
        profit: collected - expenses, rooms: rooms.length, occupied: occ, occupancy: rooms.length ? occ / rooms.length : 0,
        invoices: invs.length, draftInvoices: drafts, notBilled: notBilled,
      };
    },

    /* Thu theo mốc 5/10/15 cho hóa đơn của kỳ */
    milestones: function (period, scope) {
      var res = { m5: 0, m10: 0, m15: 0, late: 0, weighted: 0, billed: 0 };
      api.invoicesIn(period, scope).filter(function (i) { return i.status === 'confirmed'; }).forEach(function (inv) {
        res.billed += inv.total;
        api.receiptsOf(inv.id).forEach(function (r) {
          var m = api.milestone(r, inv);
          if (!m || m.key === 'other') return;
          res[m.key] += r.amount;
          res.weighted += r.amount * m.weight;
        });
      });
      return res;
    },

    /* Hiệu suất tòa theo note.md §5.2 (CR-BLD-01, DRAFT D-04/D-06):
         A = DT M5 × 100% + (DT M10 − DT M5) × 90% + (DT M15 − DT M10) × 70%   (DT Mx = lũy kế phiếu thu đã xác nhận đến ngày x)
         B = dịch vụ phải thu ÷ doanh thu phải thu (hóa đơn đã xác nhận của tòa trong kỳ)
         C = tiền phòng phát sinh đã thu đủ + khoản khách bỏ cọc
         D = A − A × B + C (doanh thu tiền phòng quy đổi) · HS% = D ÷ tổng giá niêm yết các phòng của tòa
       Tạm tính: mọi khoản đã xác nhận tới lúc xem (kể cả sau ngày 15), chưa áp trọng số; thực tế: sau mốc 15 của kỳ. */
    perfBuilding: function (period, bId) {
      var r = { period: period, buildingId: bId, m5: 0, m10: 0, m15: 0, late: 0, rev: 0, svc: 0, invoices: 0 };
      api.invoicesIn(period, bId).filter(function (i) { return i.status === 'confirmed'; }).forEach(function (inv) {
        r.invoices++;
        r.rev += inv.total;
        r.svc += sum(inv.lines.filter(function (l) { return l.type !== 'rent'; }), function (l) { return l.amount; });
        api.receiptsOf(inv.id).forEach(function (rc) {
          var m = api.milestone(rc, inv);
          if (m && m.key !== 'other') r[m.key] += rc.amount;
        });
      });
      r.cum5 = r.m5; r.cum10 = r.m5 + r.m10; r.cum15 = r.cum10 + r.m15;
      r.A = r.cum5 + (r.cum10 - r.cum5) * 0.9 + (r.cum15 - r.cum10) * 0.7;
      r.B = r.rev ? r.svc / r.rev : 0;
      r.arisingList = (db().arisingRent || []).filter(function (a) { return a.buildingId === bId && a.period === period && a.paidFull; });
      r.forfeitList = (db().deposits || []).filter(function (d) { return d.buildingId === bId && d.period === period && d.type === 'forfeit' && d.status === 'confirmed'; });
      r.arising = sum(r.arisingList, function (a) { return a.amount; });
      r.forfeit = sum(r.forfeitList, function (d) { return d.amount; });
      r.C = r.arising + r.forfeit;
      r.D = r.A - r.A * r.B + r.C;
      var rooms = db().rooms.filter(function (x) { return x.buildingId === bId; });
      r.rooms = rooms.length;
      r.listed = sum(rooms, function (x) { return x.rent; });
      r.hs = r.listed ? r.D / r.listed : 0;
      r.Aprov = r.cum15 + r.late;
      r.Dprov = r.Aprov - r.Aprov * r.B + r.C;
      r.hsProv = r.listed ? r.Dprov / r.listed : 0;
      r.closed = TH.TODAY > period + '-15';
      var stateAt = api.roomStateAt || function (x) { return x.status; };
      r.occupied = rooms.filter(function (x) { return stateAt(x, period) === 'occupied'; }).length;
      r.occ = rooms.length ? r.occupied / rooms.length : 0;
      return r;
    },
    /* Gộp nhiều tòa: cộng thành phần, B tính lại trên tổng; D/HS cộng từ từng tòa */
    perfAgg: function (period, ids) {
      var list = ids.map(function (id) { return api.perfBuilding(period, id); });
      var t = { list: list };
      ['m5', 'm10', 'm15', 'late', 'rev', 'svc', 'invoices', 'cum5', 'cum10', 'cum15', 'A', 'arising', 'forfeit', 'C', 'D', 'rooms', 'listed', 'Aprov', 'Dprov', 'occupied'].forEach(function (k) { t[k] = sum(list, function (x) { return x[k]; }); });
      t.B = t.rev ? t.svc / t.rev : 0;
      t.hs = t.listed ? t.D / t.listed : 0;
      t.hsProv = t.listed ? t.Dprov / t.listed : 0;
      t.occ = t.rooms ? t.occupied / t.rooms : 0;
      t.closed = TH.TODAY > period + '-15';
      return t;
    },

    /* Hiệu suất theo người phụ trách: tòa có QL chính */
    performance: function (period) {
      return db().buildings.map(function (b) {
        var m = api.milestones(period, b.id);
        return { buildingId: b.id, managerId: b.managerId, ms: m };
      });
    },

    /* Lương hiệu suất theo "Cách tính lương phòng vận hành" (docs/, DRAFT D-06):
       HS% = DT tiền phòng thu được sau 3 mốc ÷ DT niêm yết; mức lương/phòng = HS × đơn giá tham chiếu ÷ 90 (đơn giá cho ở mốc HS 90%);
       lương HS = mức lương/phòng × số phòng. DT tiền phòng = D của perfBuilding (đã gồm "DT thu thêm" C). */
    perfPay: function (s, dtRoom, listed, rooms, period) {
      var pol = db().salaryPolicy;
      var senior = s.joinedAt <= TH.addDays(period + '-01', -365);
      var rate = senior ? pol.ratePerRoom.senior : pol.ratePerRoom.junior;
      var hs = listed ? dtRoom / listed * 100 : 0;
      var perRoom = Math.round(hs * rate / pol.refHs);
      return { hs: hs, rate: rate, perRoom: perRoom, pay: rooms ? Math.round(perRoom * rooms / 1000) * 1000 : 0, senior: senior };
    },
    /* Bảng lương nháp */
    payroll: function (period) {
      var perf = api.performance(period);
      var pol = db().salaryPolicy;
      var roomsOf = function (bId) { return db().rooms.filter(function (r) { return r.buildingId === bId; }); };
      return db().staff.filter(function (s) { return s.status === 'active'; }).map(function (s) {
        var mine = perf.filter(function (p) { return p.managerId === s.id; });
        var hsList = mine.map(function (p) { return api.perfBuilding(period, p.buildingId); });
        var dtD = sum(hsList, function (h) { return h.D; });
        var rooms = sum(mine, function (p) { return roomsOf(p.buildingId).length; });
        var listed = sum(mine, function (p) { return sum(roomsOf(p.buildingId), function (r) { return r.rent; }); });
        var pp = api.perfPay(s, dtD, listed, rooms, period);
        var team = db().teams.find(function (t) { return t.leaderId === s.id && t.id !== 'BO'; });
        var teamRooms = team ? sum(db().buildings.filter(function (b) { var m = api.staff(b.managerId); return m && m.team === team.id; }), function (b) { return roomsOf(b.id).length; }) : 0;
        var lead = teamRooms * pol.leaderPerRoom;
        var adj = sum(db().salaryAdjustments.filter(function (a) { return a.staffId === s.id && a.period === period; }), function (a) { return a.amount; });
        return { staff: s, base: s.base, allowance: s.allowance, dtD: dtD, hsList: hsList, rooms: rooms, listed: listed, hs: pp.hs, rate: pp.rate, perRoom: pp.perRoom, senior: pp.senior, perf: pp.pay, lead: lead, teamRooms: teamRooms, adj: adj, total: s.base + s.allowance + pp.pay + lead + adj, buildings: mine.map(function (p) { return p.buildingId; }) };
      });
    },

    /* Cổ đông hiệu lực trong kỳ */
    sharesFor: function (bId, period) {
      var d = period + '-15';
      return db().shares.filter(function (s) { return s.buildingId === bId && s.from <= d && (!s.to || s.to >= d); });
    },
    allocation: function (bId, period) {
      var sm = api.summary(period, bId);
      var base = sm.profit;
      var rows = api.sharesFor(bId, period).map(function (s) {
        return { share: s, holder: api.shareholder(s.shareholderId), amount: Math.floor(base * s.ratio / 100 / 1000) * 1000 };
      });
      var allocated = sum(rows, function (r) { return r.amount; });
      if (rows.length && base > 0) rows[0].amount += base - allocated; // dồn phần làm tròn cho dòng đầu
      return { base: base, rows: rows, summary: sm, ratioTotal: sum(rows, function (r) { return r.share.ratio; }) };
    },

    expiring: function (days, scope) {
      var limit = TH.addDays(TH.TODAY, days);
      return db().contracts.filter(function (c) { return c.status === 'active' && c.end >= TH.TODAY && c.end <= limit && inScope(c.buildingId, scope); })
        .sort(function (a, b) { return a.end < b.end ? -1 : 1; });
    },
    daysTo: function (iso) {
      return Math.round((new Date(iso + 'T00:00:00') - new Date(TH.TODAY + 'T00:00:00')) / 86400000);
    },
    readingIssue: function (rd, room) {
      if (!rd) return { level: 'missing', text: 'Chưa có kỳ' };
      if (rd.elecCur === null || rd.waterCur === null || rd.elecCur === '' || rd.waterCur === '') return { level: 'missing', text: 'Thiếu số mới' };
      if (+rd.elecCur < +rd.elecPrev || +rd.waterCur < +rd.waterPrev) return { level: 'error', text: 'Số mới nhỏ hơn số cũ — cần kiểm tra' };
      var hist = db().readings.filter(function (r) { return r.roomId === rd.roomId && r.period < rd.period; }).slice(-3);
      if (hist.length && room && room.status === 'occupied') {
        var avg = sum(hist, function (r) { return r.elecCur - r.elecPrev; }) / hist.length;
        if (avg > 0 && (rd.elecCur - rd.elecPrev) > avg * 2.2) return { level: 'spike', text: 'Tiêu thụ điện tăng đột biến (' + Math.round((rd.elecCur - rd.elecPrev) / avg * 10) / 10 + '× TB 3 kỳ)' };
      }
      return null;
    },
  };
  return api;
})();
