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
          '<p class="offer-price-caption">Tổng giá trị gói · đề xuất</p><p class="small offer-foundation">Có OCR và Zalo OA</p><p class="plan-desc">' + esc(o.audience) + '</p>' +
          '<div class="offer-card-points"><b>' + (prev ? 'Bổ sung nổi bật' : 'Chức năng nổi bật') + '</b>' + P.list(o.includes.slice(0, 3)) + '</div>' +
          '<p class="offer-card-value">' + esc(o.outcome) + '</p>' +
          '<button type="button" class="btn ' + (k === key ? 'btn-primary' : '') + '" data-act="pricing.pick" data-pkg="' + k + '" data-reveal="yes" aria-pressed="' + (k === key) + '" aria-controls="offer-detail">Xem phạm vi gói ' + k + I('arrowRight', 'ic-sm') + '</button></article>';
      }).join('');
      return '<div class="landing landing-pricing">' +
        '<header class="l-nav"><div class="l-nav-in"><a class="brand" href="#/" aria-label="TIMEHOUSE — Trang giới thiệu"><span class="brand-mark">' + I('logo') + '</span><span class="brand-name">TIMEHOUSE</span></a>' +
        '<nav class="l-nav-links" aria-label="Trang giới thiệu"><a href="#bang-gia" data-act="landing.scroll" data-target="bang-gia">Mức đầu tư</a><a href="#so-sanh" data-act="landing.scroll" data-target="so-sanh">So sánh chức năng</a><a href="#moc-ban-giao" data-act="landing.scroll" data-target="moc-ban-giao">Mốc bàn giao</a><a href="#giai-dap" data-act="landing.scroll" data-target="giai-dap">Giải đáp</a></nav>' +
        '<span class="grow"></span><a class="btn btn-primary" href="?previewPackage=' + key + '#/demo/rpt-01" data-act="landing.open" data-pkg="' + key + '">Xem demo' + I('arrowRight', 'ic-sm') + '</a></div></header>' +

        '<main><section class="hero"><div class="l-wrap"><span class="hero-eyebrow">TIMEHOUSE · Quản lý vận hành nhà cho thuê</span>' +
        '<h1>Mỗi mức đầu tư,<br><span class="accent">một bước nâng tầm vận hành.</span></h1>' +
        '<p class="lead">Từ quản lý hồ sơ và thu tiền đến tự động hóa, kiểm soát và giải trình số liệu. Xem rõ từng gói làm được gì, giá trị nhận được và cách nghiệm thu.</p>' +
        '<div class="hero-cta"><a class="btn btn-primary btn-lg" href="#bang-gia" data-act="landing.scroll" data-target="bang-gia">Khám phá mức đầu tư' + I('arrowRight', 'ic-sm') + '</a><a class="btn btn-lg" href="#moc-ban-giao" data-act="landing.scroll" data-target="moc-ban-giao">Xem lộ trình bàn giao</a></div>' +
        '<div class="hero-meta"><span>' + I('layers', 'ic-sm') + 'Bốn gói phát triển cộng dồn</span><span>' + I('checkCircle', 'ic-sm') + 'Đầu ra nghiệm thu rõ ràng</span><span>' + I('database', 'ic-sm') + 'Demo trên dữ liệu mô phỏng</span></div></div></section>' +

        '<section class="l-section alt" id="bang-gia"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Chọn mức đầu tư</div><h2>Gói phù hợp với cách bạn vận hành</h2><p>Mọi gói đều có OCR, Zalo OA và hai mẫu báo cáo gốc của khách hàng. Gói cao hơn tăng khả năng phân tích, kiểm soát và truy vết trong giới hạn đã nêu.</p></div>' +
        '<div class="offer-price-note">' + I('info', 'ic-sm') + '<p><b>Giá hiển thị là tổng giá trị từng gói.</b> Gói B gồm A, gói C gồm B, gói D gồm C. Không cộng giá các gói với nhau.</p></div>' +
        '<div class="plans">' + plans + '</div><p class="plans-note">Khoảng giá đề xuất để trao đổi phạm vi. Mức chốt, thuế, phí dịch vụ và điều kiện bàn giao được xác nhận trong báo giá.</p>' +
        '<div class="offer-detail-section" id="pham-vi-goi"><div class="offer-section-bar"><div><span class="l-kicker">Bạn nhận được gì?</span><p data-offer-label>Gói ' + key + ' · ' + esc(TH.PACKAGES[key].price) + '</p></div>' + picker('Chọn gói xem phạm vi') + '</div>' +
        '<div id="offer-detail" class="offer-detail" role="region" aria-labelledby="offer-detail-title">' + P.detail(key) + '</div></div><p id="offer-live" class="sr-only" aria-live="polite" aria-atomic="true"></p></div></section>' +

        '<section class="l-section" id="so-sanh"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Đối chiếu phạm vi</div><h2>Phần đầu tư tăng thêm nằm ở đâu?</h2><p>A tập trung quản lý. B giảm thao tác lặp. C kiểm soát sai sót. D giữ căn cứ giải trình cho các kỳ đã chốt.</p></div>' +
        P.comparison() + '<div class="offer-mobile-matrix">' + picker('Chọn gói để so sánh trên điện thoại') + '<div id="offer-mobile-compare">' + P.mobileComparison(key) + '</div></div>' +
        '<div class="offer-common"><b>Nền chung của mọi gói</b><p>OCR, Zalo OA và hai mẫu báo cáo gốc luôn có từ gói A. Giao diện thống nhất, kiểm tra dữ liệu nhập, phân quyền theo phạm vi, xác nhận thu tiền và quy trình hoàn cọc có người lập/người duyệt riêng.</p></div>' +
        '<div class="offer-compare-action"><button type="button" class="btn" data-act="pkg.compare">' + I('compare', 'ic-sm') + 'Xem chi tiết 52 chức năng</button><span class="small muted">Mở bảng chi tiết theo phân hệ để cùng đối chiếu phạm vi.</span></div></div></section>' +

        '<section class="l-section alt" id="moc-ban-giao"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Lộ trình triển khai</div><h2>Mỗi mốc có đầu ra để nghiệm thu</h2><p>Sáu mốc của gói được chọn. Phần nâng cao được triển khai theo phạm vi đã thống nhất, không tính thành sáu gói giá riêng.</p></div>' +
        '<div class="offer-roadmap-label"><span class="badge badge-teal" data-offer-label>Gói ' + key + ' · ' + esc(TH.PACKAGES[key].price) + '</span><span class="small muted">Lịch thực hiện và thanh toán thống nhất khi chốt phạm vi.</span></div>' +
        '<div id="offer-roadmap">' + P.roadmap(key) + '</div></div></section>' +

        '<section class="l-section" id="bao-cao"><div class="l-wrap"><div class="l-hd"><div class="l-kicker">Dữ liệu đến kết quả</div><h2>Cùng một luồng từ hồ sơ đến báo cáo</h2><p>Phần cốt lõi gồm hồ sơ thuê, hóa đơn, thu tiền, cọc, chi phí, nhân sự và hai báo cáo theo mẫu khách. Các gói nâng cao tăng chiều sâu xử lý từng bước.</p></div>' +
        '<div class="benefits">' + BENEFITS.map(function (b) { return '<article class="benefit"><div class="b-ic">' + I(b[0]) + '</div><h3>' + esc(b[1]) + '</h3><p>' + esc(b[2]) + '</p></article>'; }).join('') + '</div>' +
        '<div class="offer-report-links"><a class="btn" href="?previewPackage=A#/demo/rpt-04" data-act="landing.open" data-pkg="A" data-go="#/demo/rpt-04">' + I('building', 'ic-sm') + 'Xem báo cáo theo tòa</a><a class="btn" href="?previewPackage=A#/demo/rpt-05" data-act="landing.open" data-pkg="A" data-go="#/demo/rpt-05">' + I('chart', 'ic-sm') + 'Xem báo cáo kinh doanh tháng</a></div></div></section>' +

        '<section class="l-section alt" id="giai-dap"><div class="l-wrap offer-faq"><div class="l-hd"><div class="l-kicker">Trước khi chốt phương án</div><h2>Những điều cần thống nhất</h2></div>' +
        '<details><summary>Giá các gói có cộng dồn để thanh toán không?</summary><p>Giá là tổng giá trị của gói được chọn, đã gồm các gói trước. Khi nâng cấp từ hợp đồng đã triển khai, phần phí và phạm vi bổ sung được xác định riêng.</p></details>' +
        '<details><summary>Gói A đã có OCR và Zalo OA chưa?</summary><p>Có. OCR theo mẫu đã chọn, có người rà soát trước khi ghi. OA có một kết nối, 1–2 mẫu tin được duyệt, gửi thủ công và một lịch nhắc đơn giản khi đủ điều kiện. Gói cao hơn bổ sung khả năng xử lý; không mặc định không giới hạn mẫu hoặc số OA.</p></details>' +
        '<details><summary>Gói cao hơn có tăng số mẫu báo cáo không?</summary><p>Mọi gói giữ hai mẫu gốc: doanh thu theo tòa và kinh doanh tháng. B thêm truy nguồn và xu hướng sáu kỳ; C thêm so sánh, duyệt số liệu; D thêm khóa kỳ và phiên bản. Mẫu báo cáo mới ngoài hai mẫu này được xác định riêng.</p></details>' +
        '<details><summary>Các phí OCR, Zalo, máy chủ và bảo trì được tính thế nào?</summary><p>Mọi gói đều có chức năng OCR và OA. Phí sử dụng dịch vụ bên ngoài được ghi riêng trong báo giá chính thức, cùng thuế, hạ tầng và thời hạn hỗ trợ.</p></details>' +
        '<details><summary>Phiên bản đang xem đã vận hành thực tế chưa?</summary><p>Đây là bản demo tương tác trên dữ liệu mô phỏng để đối chiếu giao diện, quy trình và phạm vi. Bàn giao vận hành cần backend, cơ sở dữ liệu, quyền phía server, lưu trữ, tích hợp thật và kiểm thử nghiệm thu.</p></details>' +
        '<details><summary>Công thức và dữ liệu khách hàng được xác nhận khi nào?</summary><p>Ở mốc đầu tiên, hai bên chốt mẫu dữ liệu, ví dụ tính tiền, chính sách lương/cổ phần và các trường hợp ngoại lệ. Dữ liệu đầu kỳ được làm sạch, nạp và đối chiếu trước khi đưa vào sử dụng.</p></details>' +
        '<details><summary>Số tòa, phòng và thời gian bàn giao được xác định ra sao?</summary><p>Demo hiện dùng 3 tòa, 18 phòng và 6 kỳ. Quy mô vận hành, khối lượng chuyển đổi dữ liệu, lịch thực hiện và điều kiện nghiệm thu được ghi trong phạm vi ký kết.</p></details></div></section>' +

        '<section class="l-cta"><div class="l-wrap"><div class="l-cta-box"><div><h2>Cùng xem phương án phù hợp</h2><p>Chia sẻ trang giới thiệu mở đúng gói đang chọn, hoặc vào demo để cùng xem tình huống nghiệp vụ.</p><span class="badge badge-teal" data-offer-label>Gói ' + key + ' · ' + esc(TH.PACKAGES[key].price) + '</span></div>' +
        '<a class="btn btn-primary btn-lg" href="?previewPackage=' + key + '#/demo/rpt-01" data-act="landing.open" data-pkg="' + key + '" data-offer-demo>Xem demo gói ' + key + I('arrowRight', 'ic-sm') + '</a></div>' +
        '<div class="offer-share"><label for="offer-link">Liên kết giới thiệu gửi khách</label><div class="copy-field"><input id="offer-link" class="input" type="url" readonly value="' + esc(P.link(key)) + '"><button type="button" class="btn" data-act="pricing.copy">' + I('copy', 'ic-sm') + 'Sao chép liên kết</button></div><p class="small muted">Dùng địa chỉ website đã triển khai khi gửi khách.</p></div></div></section></main>' +
        '<footer class="l-foot"><div class="l-wrap"><span>© 2026 TIMEHOUSE · Bản trình bày phạm vi và dữ liệu mô phỏng.</span><a href="#bang-gia" data-act="landing.scroll" data-target="bang-gia">Xem lại các mức đầu tư</a></div></footer></div>';
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
