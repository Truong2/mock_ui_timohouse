/* Trang giới thiệu (đề xuất trình bày, ngoài 39 màn nghiệp vụ). */
(function () {
  var I = TH.icon, esc = TH.esc;

  var BENEFITS = [
    ['owner', 'Hồ sơ chủ nhà & tòa, một nguồn dữ liệu', 'Thông tin theo mẫu HĐ thuê nhà, giá thuê/cọc/giữ giá, nhân sự 4 vai trò, tài sản, PCCC/ĐKKD, lịch trả chủ nhà — nối tới phòng, hóa đơn, thu/chi và báo cáo.'],
    ['shieldCheck', 'Báo thu khác thực thu', 'Quản lý tòa xác nhận thu tiền tòa mình (CR-PAY); chỉ tiền đã xác nhận mới giảm công nợ. Văn phòng xem tiến độ thu theo QL/tòa/phòng và hậu kiểm sao kê.'],
    ['scan', 'OCR có người xác nhận', 'OCR hợp đồng và giấy tờ chỉ là bản nháp: từng field được soát, sửa và xác nhận trước khi lưu.'],
    ['zap', 'Điện nước & hóa đơn theo kỳ', 'Tự lấy chỉ số kỳ trước, báo số bất thường, sinh hóa đơn nháp theo tòa và xem trước tổng tiền trước khi chốt.'],
    ['target', 'Mốc 5/10/15 & hiệu suất tòa', 'Doanh thu sau 3 mốc (100/90/70), trừ tỷ lệ dịch vụ, cộng tiền phòng phát sinh và khách bỏ cọc ÷ giá niêm yết — xem tạm tính và thực tế, đưa vào lương nháp.'],
    ['pie', 'Lãi dòng tiền & cổ phần', 'Lãi tạm tính = thu đã xác nhận − chi đã duyệt; phân bổ theo tỷ lệ cổ đông hiệu lực. Phân bổ không đồng nghĩa đã chi.'],
  ];
  var FLOW = [['owner', 'Chủ nhà'], ['building', 'Tòa nhà'], ['door', 'Phòng'], ['user', 'Khách thuê'], ['contract', 'Hợp đồng'], ['zap', 'Điện nước'], ['receipt', 'Hóa đơn'], ['send', 'Zalo OA'], ['handCoins', 'Thu tiền'], ['chart', 'Báo cáo']];
  var MODULES = [
    ['owner', 'Chủ nhà', 3], ['building', 'Tòa nhà', 3], ['door', 'Phòng', 3], ['user', 'Khách thuê & OCR', 3], ['contract', 'Hợp đồng & gia hạn', 5],
    ['zap', 'Điện nước', 1], ['receipt', 'Hóa đơn', 4], ['send', 'Zalo OA', 2], ['handCoins', 'Thu tiền & hiệu suất', 3], ['expense', 'Chi phí', 1],
    ['briefcase', 'Nhân sự', 2], ['calculator', 'Lương', 2], ['pie', 'Cổ phần', 2], ['chart', 'Báo cáo', 5], ['shield', 'Hệ thống', 2],
  ];
  var PLAN_POINTS = {
    A: ['Đủ 39 màn / 52 nhóm chức năng', 'Hồ sơ chủ nhà, HĐ thuê tòa, tài sản, PCCC/ĐKKD; nhập tay + Excel mẫu', 'OCR 1 mẫu, người dùng xác nhận', 'Hóa đơn, công nợ, Zalo đủ điều kiện', 'Lương & cổ phần nháp', 'Báo cáo doanh thu theo tòa & kinh doanh tháng đúng mẫu Excel'],
    B: ['Toàn bộ gói A', 'Phân công Trưởng nhóm/vệ sinh/kỹ thuật; tự sinh lịch trả chủ nhà từ HĐ', 'Xem trước import, tải file lỗi', 'OCR 2 mẫu, độ tin cậy field', 'Nhập chỉ số hàng loạt theo tòa', 'Nhắc Zalo 3 mốc', 'Báo cáo: mở chứng từ từng dòng, xu hướng 6 kỳ'],
    C: ['Toàn bộ gói B', 'Hiệu suất cộng thu thêm (C); lịch trả: đã trả/còn lại/quá hạn', 'Duyệt & chống trùng thu/chi', 'Đối chiếu phòng–khách–hợp đồng', 'Lịch sử thay đổi, phụ lục giá', 'Kiểm tỷ lệ cổ phần 100%, khóa nháp lương', 'Báo cáo: bản chốt duyệt kỳ, phân bổ chi phí chung, nhóm nhà'],
    D: ['Toàn bộ gói C', 'Nhật ký & truy vết chứng từ', 'Khóa kỳ, bản chốt báo cáo', 'Đối soát sao kê, phân bổ phiếu thu', 'Phiên bản công thức & mẫu báo cáo', 'Báo cáo: đối chiếu 3 kỳ, chốt phiên bản'],
  };

  var RPT_CARDS = [
    ['RPT-04', 'building', 'Báo cáo doanh thu theo tòa', 'G1.31.8.26.xlsx · BÁO CÁO THÁNG 8', ['Doanh thu tiền phòng + 7 dòng dịch vụ, cọc mới / bỏ / hoàn', 'Giá vốn, chi phí vận hành, chi phí bán hàng', 'Lợi nhuận gộp, lợi nhuận ròng và 13 tỷ lệ', 'Bảng chia cổ phần theo tòa']],
    ['RPT-05', 'chart', 'Báo cáo kinh doanh tháng', 'BÁO CÁO KINH DOANH THÁNG 8.xlsx', ['Cột TỔNG và từng tòa (hoặc nhóm nhà)', 'Chế độ Báo cáo kinh doanh / Báo cáo tổng', 'Cùng bộ chỉ tiêu và tỷ lệ với báo cáo tòa', 'Xuất Excel: sheet kinh doanh, tổng, theo nhóm nhà']],
  ];

  TH.views.landing = {
    render: function () {
      var pkg = TH.store.state.pkg;
      var plans = TH.PKG_KEYS.map(function (k) {
        var p = TH.PACKAGES[k], feat = k === 'D';
        return '<article class="plan' + (feat ? ' is-featured' : '') + '">' + (feat ? '<span class="plan-flag">Bản master của demo</span>' : '') +
          '<div class="plan-hd"><span class="plan-key">' + k + '</span><div><div class="plan-name">' + p.name + '</div><div class="plan-level">' + p.mode + '</div></div></div>' +
          '<div class="plan-price">' + p.price.replace(' triệu', '') + '<small>triệu đồng</small></div>' +
          '<p class="plan-desc">' + esc(p.desc) + '</p>' +
          '<ul>' + PLAN_POINTS[k].map(function (t) { return '<li>' + I('check') + '<span>' + esc(t) + '</span></li>'; }).join('') + '</ul>' +
          '<a class="btn ' + (feat ? 'btn-primary' : '') + '" href="?previewPackage=' + k + '#/demo/rpt-01" data-act="landing.open" data-pkg="' + k + '">Mở demo ' + p.name + I('arrowRight', 'ic-sm') + '</a></article>';
      }).join('');

      return '<div class="landing">' +
        '<header class="l-nav"><div class="l-nav-in">' +
        '<a class="brand" href="#/" style="border:0;padding:0;height:auto"><span class="brand-mark">' + I('logo') + '</span><span class="brand-name">TIMEHOUSE</span></a>' +
        '<nav class="l-nav-links" aria-label="Trang giới thiệu"><a href="#loi-ich" data-act="landing.scroll" data-target="loi-ich">Lợi ích</a><a href="#phan-he" data-act="landing.scroll" data-target="phan-he">Phân hệ</a><a href="#bao-cao" data-act="landing.scroll" data-target="bao-cao">Báo cáo</a><a href="#bang-gia" data-act="landing.scroll" data-target="bang-gia">Bốn gói</a></nav>' +
        '<span class="grow"></span><span class="badge badge-draft" data-tip="Bản trình bày — dữ liệu minh họa, chưa phải giao diện nghiệm thu">DESIGN DRAFT</span>' +
        '<a class="btn btn-primary" href="?previewPackage=D#/demo/rpt-01" data-act="landing.open" data-pkg="D">Khám phá bản demo</a></div></header>' +

        '<section class="hero"><div class="l-wrap">' +
        '<span class="hero-eyebrow"><span class="badge badge-teal">Mới</span>Xem thử 4 gói A/B/C/D trên cùng một giao diện</span>' +
        '<h1>Vận hành chuỗi tòa nhà cho thuê, <span class="accent">từ hợp đồng đến lợi nhuận</span></h1>' +
        '<p class="lead">TIMEHOUSE gom chủ nhà, phòng, khách thuê, điện nước, hóa đơn, thu tiền, chi phí, lương và cổ phần vào một hệ thống — mỗi con số trên báo cáo đều truy được về chứng từ đã xác nhận.</p>' +
        '<div class="hero-cta"><a class="btn btn-primary btn-lg" href="?previewPackage=D#/demo/rpt-01" data-act="landing.open" data-pkg="D">' + I('play', 'ic-sm') + 'Khám phá bản demo</a>' +
        '<a class="btn btn-lg" href="#bang-gia" data-act="landing.scroll" data-target="bang-gia">So sánh 4 gói</a></div>' +
        '<div class="hero-meta"><span>' + I('grid', 'ic-sm') + '39 màn nghiệp vụ</span><span>' + I('layers', 'ic-sm') + '52 nhóm chức năng</span><span>' + I('database', 'ic-sm') + 'Dữ liệu minh họa nhất quán</span></div>' +
        '<div class="preview-frame"><div class="preview-bar"><i></i><i></i><i></i><span class="url">timehouse.demo / báo cáo tòa · gói D</span></div>' +
        '<a href="?previewPackage=D#/demo/rpt-01" data-act="landing.open" data-pkg="D" aria-label="Mở báo cáo tổng quan trong bản demo"><img src="assets/preview-rpt01.png" width="1440" height="810" alt="Màn Báo cáo tòa (RPT-01) của bản demo TIMEHOUSE: thẻ thu, nợ, chi, lãi dòng tiền tạm tính theo tòa" loading="eager" onerror="this.closest(\'.preview-frame\').style.display=\'none\'"></a></div>' +
        '</div></section>' +

        '<section class="l-section" id="loi-ich"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Lợi ích</div><h2>Ít bảng tính rời, nhiều kiểm soát hơn</h2><p>Thiết kế theo đúng quy trình của tài liệu SRS: dữ liệu có bước kiểm tra, tiền thực nhận phải được xác nhận, và các chính sách chưa chốt luôn được gắn nhãn DRAFT.</p></div>' +
        '<div class="benefits">' + BENEFITS.map(function (b) { return '<div class="benefit"><div class="b-ic">' + I(b[0]) + '</div><h3>' + esc(b[1]) + '</h3><p>' + esc(b[2]) + '</p></div>'; }).join('') + '</div></div></section>' +

        '<section class="l-section alt" id="phan-he"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Luồng nghiệp vụ</div><h2>15 phân hệ, một luồng liền mạch</h2><p>Mỗi bước tạo dữ liệu cho bước sau. Báo cáo chỉ cộng các khoản đã xác nhận/đã duyệt.</p></div>' +
        '<div class="flow">' + FLOW.map(function (f, i) { return '<span class="flow-step">' + I(f[0]) + esc(f[1]) + '</span>' + (i < FLOW.length - 1 ? '<span class="flow-arrow">' + I('chevronRight') + '</span>' : ''); }).join('') + '</div>' +
        '<div class="modules">' + MODULES.map(function (m) { return '<div class="module-tile"><div class="mt-top">' + I(m[0]) + '<span class="badge badge-neutral">' + m[2] + ' màn</span></div><b>' + esc(m[1]) + '</b><span>Có phần lõi ở gói A</span></div>'; }).join('') + '</div></div></section>' +

        '<section class="l-section" id="bao-cao"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Báo cáo trong gói</div><h2>Hai báo cáo đúng mẫu Excel của bạn</h2><p>Có sẵn từ gói A, cùng tên dòng và thứ tự như file đang dùng. Số liệu tự tính từ hóa đơn, cọc, chi phí đã duyệt và lương — xuất Excel đúng bố cục.</p></div>' +
        '<div class="l-rpt">' + RPT_CARDS.map(function (r) { return '<a class="l-rpt-card" href="?previewPackage=A' + '#/demo/' + r[0].toLowerCase() + '" data-act="landing.open" data-pkg="A" data-go="#/demo/' + r[0].toLowerCase() + '"><div class="l-rpt-top">' + I(r[1]) + '<span class="screen-id">' + r[0] + '</span><span class="badge badge-teal">Có từ gói A</span></div><h3>' + esc(r[2]) + '</h3><p class="small muted">Mẫu: ' + esc(r[3]) + '</p><ul>' + r[4].map(function (t) { return '<li>' + I('check', 'ic-sm') + esc(t) + '</li>'; }).join('') + '</ul><span class="l-rpt-go">Mở bản demo gói A' + I('arrowRight', 'ic-sm') + '</span></a>'; }).join('') + '</div>' +
        '<div class="l-rpt-tiers">' + TH.PKG_KEYS.map(function (k) { var rp = TH.REPORT_PACK[k]; return '<div class="l-rpt-tier">' + TH.tierPill(k, { plus: k !== 'A', lg: true }) + '<div><b>' + esc(rp.head) + '</b><ul>' + rp.items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div></div>'; }).join('') + '</div></div></section>' +

        '<section class="l-section alt" id="bang-gia"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Bốn gói</div><h2>Cùng 39 màn, khác chiều sâu xử lý</h2><p>Gói A đã có đủ mọi phân hệ ở mức cơ bản. B, C, D cộng dồn các nâng cấp theo từng dòng chức năng — không khóa cả phân hệ.</p></div>' +
        '<div class="plans">' + plans + '</div>' +
        '<p class="plans-note">Giá tham khảo theo cấu hình demo — <b>chưa đối chiếu Excel báo giá gốc</b>, không phải giá chốt. Chi phí OCR, Zalo OA, máy chủ và các mục ngoài gói tính riêng (Decision Log D-08). Đang xem gần nhất: ' + TH.PACKAGES[pkg].name + '.</p></div></section>' +

        '<section class="l-cta"><div class="l-wrap"><div class="l-cta-box"><div><h2>Xem trực tiếp trên dữ liệu mẫu</h2><p>Mở báo cáo tổng quan ở gói D, rồi đổi sang A/B/C ngay trên topbar để thấy phần lõi và phần nâng cấp của từng màn.</p></div>' +
        '<a class="btn btn-primary btn-lg" href="?previewPackage=D#/demo/rpt-01" data-act="landing.open" data-pkg="D">Khám phá bản demo' + I('arrowRight', 'ic-sm') + '</a></div></div></section>' +

        '<footer class="l-foot"><div class="l-wrap"><span>© 2026 TIMEHOUSE · Bản demo trình bày — DESIGN DRAFT, dữ liệu minh họa, không gọi dịch vụ thật.</span><a href="#/demo/screens">Mục lục 39 màn</a></div></footer>' +
        '</div>';
    },
  };
  TH.act['landing.open'] = function (el) {
    TH.store.setPkg(el.dataset.pkg);
    TH.router.go(el.dataset.go || '#/demo/rpt-01');
  };
  TH.act['landing.scroll'] = function (el) {
    var t = document.getElementById(el.dataset.target);
    if (t) t.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
})();
