/* Customer presentation: package value, scope and acceptance milestones. */
(function () {
  var I = TH.icon, esc = TH.esc, P = TH.pricing;
  var BENEFITS = [
    ['building', 'Hồ sơ liên kết xuyên suốt', 'Chủ nhà, tòa, phòng, khách và hợp đồng được tổ chức cùng một nguồn dữ liệu.'],
    ['receipt', 'Theo dõi tiền rõ ràng', 'Phân biệt phải thu, thực thu, công nợ và cọc; quản lý xác nhận thu, kế toán hậu kiểm.'],
    ['chart', 'Báo cáo có căn cứ', 'Tổng hợp doanh thu và chi phí theo tòa, theo kỳ; các gói nâng cao bổ sung đối chiếu và truy vết.']
  ];
  function picker(label) {
    return '<div class="offer-picker" role="group" aria-label="' + label + '">' + TH.PKG_KEYS.map(function (k) {
      return '<button type="button" class="btn" data-act="pricing.pick" data-pkg="' + k + '" aria-pressed="' + (k === P.selected()) + '" aria-controls="offer-detail">Gói ' + k + '</button>';
    }).join('') + '</div>';
  }
  TH.views.landing = {
    render: function () {
      var key = P.selected();
      var plans = TH.PKG_KEYS.map(function (k, i) {
        var p = TH.PACKAGES[k], o = P.offers[k], prev = TH.PKG_KEYS[i - 1];
        return '<article class="plan' + (k === key ? ' is-selected' : '') + '" data-pkg="' + k + '" aria-labelledby="offer-' + k + '">' +
          '<div class="plan-hd"><span class="plan-key">' + k + '</span><div><div class="plan-name">Gói ' + k + '</div><div class="plan-level">' + (prev ? 'Bao gồm gói ' + prev : 'Nền tảng vận hành') + '</div></div></div>' +
          '<h3 id="offer-' + k + '">' + esc(o.title) + '</h3><div class="plan-price">' + esc(p.price.replace(' triệu', '')) + '<small>triệu đồng</small></div>' +
          '<p class="offer-price-caption">Tổng giá trị gói · đề xuất</p><p class="small offer-foundation">OCR hợp đồng · Zalo OA</p><p class="plan-desc">' + esc(o.audience) + '</p>' +
          '<div class="offer-card-points"><b>' + (prev ? 'Bổ sung nổi bật' : 'Chức năng nổi bật') + '</b>' + P.list(o.includes.slice(0, 3)) + '</div>' +
          '<p class="offer-card-value">' + esc(o.outcome) + '</p>' +
          '<button type="button" class="btn ' + (k === key ? 'btn-primary' : '') + '" data-act="pricing.pick" data-pkg="' + k + '" data-reveal="yes" aria-pressed="' + (k === key) + '" aria-controls="offer-detail">Xem phạm vi gói ' + k + I('arrowRight', 'ic-sm') + '</button></article>';
      }).join('');
      return '<div class="landing landing-pricing">' +
        '<header class="l-nav"><div class="l-nav-in"><a class="brand" href="#/" aria-label="TIMEHOUSE — Trang giới thiệu"><span class="brand-mark">' + I('logo') + '</span><span class="brand-name">TIMEHOUSE</span></a>' +
        '<nav class="l-nav-links" aria-label="Trang giới thiệu"><a href="#bang-gia" data-act="landing.scroll" data-target="bang-gia">Phạm vi và giá</a><a href="#so-sanh" data-act="landing.scroll" data-target="so-sanh">So sánh chức năng</a><a href="#moc-ban-giao" data-act="landing.scroll" data-target="moc-ban-giao">Nội dung bàn giao</a><a href="#giai-dap" data-act="landing.scroll" data-target="giai-dap">Giải đáp</a></nav>' +
        '<span class="grow"></span><a class="btn btn-primary" href="?previewPackage=' + key + '#/demo/rpt-01" data-act="landing.open" data-pkg="' + key + '">Xem demo' + I('arrowRight', 'ic-sm') + '</a></div></header>' +

        '<main><section class="hero"><div class="l-wrap"><span class="hero-eyebrow">TIMEHOUSE · Quản lý vận hành nhà cho thuê</span>' +
        '<h1>Phạm vi phát triển <br>theo từng gói</h1>' +
        '<p class="lead">Các gói A–D quy định chức năng được phát triển, mức hỗ trợ xử lý và giới hạn áp dụng. Chọn gói để đối chiếu phạm vi, chi phí dự kiến và điều kiện bàn giao.</p>' +
        '<div class="hero-cta"><a class="btn btn-primary btn-lg" href="#bang-gia" data-act="landing.scroll" data-target="bang-gia">Xem phạm vi các gói' + I('arrowRight', 'ic-sm') + '</a><a class="btn btn-lg" href="#moc-ban-giao" data-act="landing.scroll" data-target="moc-ban-giao">Xem nội dung bàn giao</a></div>' +
        '<div class="hero-meta"><span>' + I('layers', 'ic-sm') + 'Bốn gói theo phạm vi chức năng</span><span>' + I('checkCircle', 'ic-sm') + 'Giới hạn triển khai rõ ràng</span><span>' + I('database', 'ic-sm') + 'Demo trên dữ liệu mô phỏng</span></div></div></section>' +

        '<section class="l-section alt" id="bang-gia"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Phạm vi phát triển</div><h2>Chức năng và giới hạn từng gói</h2><p>Mọi gói vận hành đủ một kỳ, xuất hai báo cáo đúng mẫu đã ký và có OCR hợp đồng khách thuê, Zalo OA theo giới hạn gói. Gói cao hơn thêm chức năng OCR/OA, tăng mức hỗ trợ nhập liệu, tự động hóa và kiểm soát kỳ, không thay đổi kết quả báo cáo.</p></div>' +
        '<div class="offer-price-note">' + I('info', 'ic-sm') + '<p><b>Giá hiển thị là tổng giá trị từng gói.</b> Gói B gồm A, gói C gồm B, gói D gồm C. Không cộng giá các gói với nhau.</p></div>' +
        '<div class="plans">' + plans + '</div><p class="plans-note">Khoảng giá đề xuất để trao đổi phạm vi. Mức chốt, thuế, phí dịch vụ và điều kiện bàn giao được xác nhận trong báo giá.</p>' +
        '<div class="offer-detail-section" id="pham-vi-goi"><div class="offer-section-bar"><div><span class="l-kicker">Bạn nhận được gì?</span><p data-offer-label>Gói ' + key + ' · ' + esc(TH.PACKAGES[key].price) + '</p></div>' + picker('Chọn gói xem phạm vi') + '</div>' +
        '<div id="offer-detail" class="offer-detail" role="region" aria-labelledby="offer-detail-title">' + P.detail(key) + '</div></div><p id="offer-live" class="sr-only" aria-live="polite" aria-atomic="true"></p></div></section>' +

        '<section class="l-section" id="so-sanh"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Đối chiếu phạm vi</div><h2>Phạm vi chức năng theo gói</h2><p>A: vận hành đầy đủ, nhập tay. B: thêm nhập liệu, xử lý hàng loạt và đối soát nhanh hơn. C: thêm tự động hóa có giới hạn. D: thêm chốt bản, khóa kỳ và so sánh phiên bản.</p></div>' +
        P.comparison() + '<div class="offer-mobile-matrix">' + picker('Chọn gói để so sánh trên điện thoại') + '<div id="offer-mobile-compare">' + P.mobileComparison(key) + '</div></div>' +
        '<div class="offer-common"><b>Nền chung của mọi gói</b><p>Toàn bộ luồng từ số đầu kỳ đến hai báo cáo đúng mẫu luôn có từ gói A, dùng cùng một bộ tính và mẫu xuất cho cả bốn gói. OCR hợp đồng khách thuê và Zalo OA có ở mọi gói; gói cao thêm chức năng. Giao diện thống nhất, kiểm tra dữ liệu nhập, phân quyền theo phạm vi, xác nhận thu tiền và quy trình hoàn cọc có người lập/người duyệt riêng.</p></div>' +
        '<div class="offer-compare-action"><button type="button" class="btn" data-act="pkg.compare">' + I('compare', 'ic-sm') + 'Xem chi tiết 52 chức năng</button><span class="small muted">Mở bảng chi tiết theo phân hệ để cùng đối chiếu phạm vi.</span></div></div></section>' +

        '<section class="l-section alt" id="moc-ban-giao"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Bàn giao và nghiệm thu</div><h2>Nội dung bàn giao theo gói</h2><p>A–D là các lựa chọn phạm vi phát triển. Sau khi chọn gói, việc bàn giao thực hiện theo sáu bước dưới đây, với đầu ra và điều kiện nghiệm thu tương ứng.</p></div>' +
        '<div class="offer-roadmap-label"><span class="badge badge-teal" data-offer-label>Gói ' + key + ' · ' + esc(TH.PACKAGES[key].price) + '</span><span class="small muted">Lịch thực hiện và thanh toán thống nhất khi chốt phạm vi.</span></div>' +
        '<div id="offer-roadmap">' + P.roadmap(key) + '</div></div></section>' +

        '<section class="l-section" id="bao-cao"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Dữ liệu đến kết quả</div><h2>Cùng một luồng từ hồ sơ đến báo cáo</h2><p>Phần cốt lõi gồm hồ sơ thuê, hóa đơn, thu tiền, cọc, chi phí, nhân sự và hai báo cáo theo mẫu khách. Gói A và B có hai mẫu gốc; C thêm âm dương điện nước và lấp đầy; D thêm dự kiến lợi nhuận, phân khúc khách và sửa chữa.</p></div>' +
        '<div class="benefits">' + BENEFITS.map(function (b) { return '<article class="benefit"><div class="b-ic">' + I(b[0]) + '</div><h3>' + esc(b[1]) + '</h3><p>' + esc(b[2]) + '</p></article>'; }).join('') + '</div>' +
        '<h3 class="offer-reports-title">Danh mục báo cáo theo gói</h3>' + P.reportList() +
        '<div class="offer-report-links"><a class="btn" href="?previewPackage=A#/demo/rpt-04" data-act="landing.open" data-pkg="A" data-go="#/demo/rpt-04">' + I('building', 'ic-sm') + 'Xem báo cáo theo tòa</a><a class="btn" href="?previewPackage=A#/demo/rpt-05" data-act="landing.open" data-pkg="A" data-go="#/demo/rpt-05">' + I('chart', 'ic-sm') + 'Xem báo cáo kinh doanh tháng</a></div></div></section>' +

        '<section class="l-section alt" id="giai-dap"><div class="l-wrap offer-faq"><div class="l-hd"><div class="l-kicker">Trước khi chốt phương án</div><h2>Những điều cần thống nhất</h2></div>' +
        '<details><summary>Giá các gói có cộng dồn để thanh toán không?</summary><p>Giá là tổng giá trị của gói được chọn, đã gồm các gói trước. Khi nâng cấp từ hợp đồng đã triển khai, phần phí và phạm vi bổ sung được xác định riêng.</p></details>' +
        '<details><summary>Gói A đã có OCR và Zalo OA chưa?</summary><p>Có. Gói A đọc OCR một mẫu hợp đồng khách thuê, người dùng rà soát và xác nhận trước khi ghi; giấy tờ tùy thân, hợp đồng chủ nhà, hóa đơn và tài liệu khác chỉ nhập tay hoặc đính kèm. OA có một kết nối, tối đa hai mẫu tin, gửi từng hóa đơn và một lịch nhắc cố định. B thêm OCR hai mẫu và gửi danh sách/ba mốc nhắc; C thêm kiểm trùng, so khớp hợp đồng và xử lý lỗi gửi; D thêm thư viện mẫu hợp đồng và giám sát gửi lại. Không mặc định không giới hạn mẫu hoặc số OA.</p></details>' +
        '<details><summary>Gói A có đủ để ra báo cáo đúng mẫu không?</summary><p>Có. Gói A vận hành trọn một kỳ và xuất đủ hàng, cột, sheet của hai báo cáo đã ký. Lương, chi phí chung, giá vốn được nhập số đã duyệt có nguồn; hệ thống tự cộng trừ, kiểm ràng buộc và tính báo cáo. Gói cao hơn chỉ giảm thao tác, cùng dữ liệu cho cùng số.</p></details>' +
        '<details><summary>Gói cao hơn có tăng số mẫu báo cáo không?</summary><p>Gói A và B có hai mẫu gốc: doanh thu theo tòa và kinh doanh tháng; B thêm truy nguồn và xu hướng sáu kỳ. Gói C thêm báo cáo âm dương điện nước và lấp đầy/thời gian trống. Gói D thêm báo cáo dự kiến lợi nhuận, phân khúc khách hàng và chi phí sửa chữa/vệ sinh, cùng bản chốt và khóa kỳ. Báo cáo ngoài danh mục này được xác định riêng.</p></details>' +
        '<details><summary>Các phí OCR, Zalo, máy chủ và bảo trì được tính thế nào?</summary><p>Mọi gói đều có chức năng OCR hợp đồng khách thuê và Zalo OA. Phí sử dụng dịch vụ bên ngoài được ghi riêng trong báo giá chính thức, cùng thuế, hạ tầng và thời hạn hỗ trợ.</p></details>' +
        '<details><summary>Phiên bản đang xem đã vận hành thực tế chưa?</summary><p>Đây là bản demo tương tác trên dữ liệu mô phỏng để đối chiếu giao diện, quy trình và phạm vi. Bàn giao vận hành cần backend, cơ sở dữ liệu, quyền phía server, lưu trữ, tích hợp thật và kiểm thử nghiệm thu.</p></details>' +
        '<details><summary>Công thức và dữ liệu khách hàng được xác nhận khi nào?</summary><p>Ở mốc đầu tiên, hai bên chốt file mẫu hai báo cáo, bộ dữ liệu đối chiếu, chính sách tính và các trường hợp ngoại lệ; mục chưa chốt được ghi là bản nháp. Số liệu đầu kỳ được nạp và đối soát ở mốc hai; UAT dùng ít nhất hai kỳ đối chiếu đã duyệt.</p></details>' +
        '<details><summary>Số tòa, phòng và thời gian bàn giao được xác định ra sao?</summary><p>Demo hiện dùng 3 tòa, 18 phòng và 6 kỳ. Quy mô vận hành, khối lượng chuyển đổi dữ liệu, lịch thực hiện và điều kiện nghiệm thu được ghi trong phạm vi ký kết.</p></details></div></section>' +

        '<section class="l-cta"><div class="l-wrap"><div class="l-cta-box"><div><h2>Cùng xem phương án phù hợp</h2><p>Chia sẻ trang giới thiệu mở đúng gói đang chọn, hoặc vào demo để cùng xem tình huống nghiệp vụ.</p><span class="badge badge-teal" data-offer-label>Gói ' + key + ' · ' + esc(TH.PACKAGES[key].price) + '</span></div>' +
        '<a class="btn btn-primary btn-lg" href="?previewPackage=' + key + '#/demo/rpt-01" data-act="landing.open" data-pkg="' + key + '" data-offer-demo>Xem demo gói ' + key + I('arrowRight', 'ic-sm') + '</a></div>' +
        '<div class="offer-share"><label for="offer-link">Liên kết giới thiệu gửi khách</label><div class="copy-field"><input id="offer-link" class="input" type="url" readonly value="' + esc(P.link(key)) + '"><button type="button" class="btn" data-act="pricing.copy">' + I('copy', 'ic-sm') + 'Sao chép liên kết</button></div><p class="small muted">Dùng địa chỉ website đã triển khai khi gửi khách.</p></div></div></section></main>' +
        '<footer class="l-foot"><div class="l-wrap"><span>© 2026 TIMEHOUSE · Bản trình bày phạm vi và dữ liệu mô phỏng.</span><a href="#bang-gia" data-act="landing.scroll" data-target="bang-gia">Xem lại phạm vi các gói</a></div></footer></div>';
    }
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
