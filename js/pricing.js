/* Customer-facing package scope shared by the landing page and package drawer.
 * Prices and feature gates stay in TH.PACKAGES / the existing feature registry.
 */
(function () {
  var esc = function (v) { return TH.esc(v); };
  var OFFERS = TH.packagePolicy.offers, MATRIX = TH.packagePolicy.matrix;
  var MILESTONES = [
    ['Chốt phạm vi và công thức', 'Thống nhất chức năng, quyền, mẫu chứng từ và quy tắc tính.', 'Có bộ ví dụ và tiêu chí nghiệm thu được hai bên xác nhận.'],
    ['Hồ sơ và hợp đồng', 'Liên kết chủ nhà, tòa, phòng, khách, hợp đồng và biểu phí.', 'Dữ liệu liên kết đúng, không chồng thời gian thuê, đúng phạm vi quyền.'],
    ['Hóa đơn, thu tiền và cọc', 'Hoàn thiện điện nước, hóa đơn, công nợ và hoàn cọc theo bước.', 'Tính tiền khớp; thu đủ/thiếu/thừa rõ ràng; không ghi nhận trùng.'],
    ['Chi phí và báo cáo', 'Tổng hợp chi phí, hiệu suất, lương/cổ phần và báo cáo theo mẫu.', 'Tổng các tòa khớp toàn hệ thống; báo cáo và file xuất đối chiếu được.'],
    ['Hoàn thiện phạm vi gói đã chọn', '', 'Chạy đạt các tình huống đã thống nhất trong phạm vi gói.'],
    ['Nghiệm thu và bàn giao', 'Kiểm thử với dữ liệu khách, triển khai, hướng dẫn và sao lưu/phục hồi.', 'Thực hiện được trọn một kỳ nghiệp vụ và ký nghiệm thu.']
  ];
  var P = TH.pricing = {
    offers: OFFERS, matrix: MATRIX, milestones: MILESTONES,
    featureText: function (f, tier) {
      var t = f[tier];
      if (TH.isReview()) return t;
      return t.replace(/CRUD/gi, 'Thêm, xem, sửa và ngừng sử dụng').replace(/queue retry/gi, 'hàng đợi gửi lại').replace(/dead-letter/gi, 'danh sách lỗi cần xử lý').replace(/cost center/gi, 'nhóm chi phí').replace(/received_at/gi, 'ngày thực nhận').replace(/backdate/gi, 'sửa ngày thực nhận về trước').replace(/idempotent/gi, 'chạy lại không tạo trùng').replace(/snapshot/gi, 'bản chụp số liệu').replace(/preview/gi, 'xem trước').replace(/rollback/gi, 'hoàn tác').replace(/upsert/gi, 'thêm mới hoặc cập nhật theo mã').replace(/audit/gi, 'nhật ký kiểm tra').replace(/batch/gi, 'hàng loạt').replace(/dashboard/gi, 'bảng tổng quan').replace(/field/gi, 'trường dữ liệu');
    },
    selected: function () { return TH.PACKAGES[TH.store.state.pkg] ? TH.store.state.pkg : 'D'; },
    link: function (key) { var u = new URL(location.href); u.search = ''; u.searchParams.set('previewPackage', key); u.hash = '/'; return u.toString(); },
    list: function (items) { return '<ul class="offer-list">' + items.map(function (t) { return '<li>' + TH.icon('check', 'ic-sm') + '<span>' + esc(t) + '</span></li>'; }).join('') + '</ul>'; },
    detail: function (key) {
      var o = OFFERS[key], p = TH.PACKAGES[key], prev = TH.PKG_KEYS[TH.PKG_KEYS.indexOf(key) - 1];
      return '<div class="offer-detail-head"><div><span class="l-kicker">Phạm vi gói ' + key + '</span><h3 id="offer-detail-title" tabindex="-1">' + esc(o.title) + '</h3><p>' + esc(o.outcome) + '</p></div><div class="offer-detail-price">' + esc(p.price) + '<span>Giá trị toàn gói · đề xuất</span></div></div>' +
        '<div class="offer-detail-grid"><div><h4>' + (prev ? 'Bao gồm toàn bộ gói ' + prev + ', bổ sung' : 'Chức năng trong gói') + '</h4>' + P.list(o.includes) +
        '<p class="offer-inherit">' + (prev ? 'Các chức năng và báo cáo của gói thấp hơn được giữ nguyên.' : 'Phân quyền, kiểm tra dữ liệu và bảo vệ nghiệp vụ tài chính là nền chung của mọi gói.') + '</p><div class="offer-limits"><h4>Giới hạn triển khai</h4>' + P.list(o.limits) + '<p class="small muted">Phí sử dụng OCR/OA và điều kiện nhà cung cấp được ghi riêng trong báo giá.</p></div></div>' +
        '<div class="offer-example"><h4>Ví dụ sử dụng</h4><p>' + esc(o.example) + '</p><h4>Khách nghiệm thu được gì?</h4><p>' + esc(o.acceptance) + '</p><p class="offer-inherit">' + esc(o.upgrade) + '</p></div></div>' +
        '<div class="offer-detail-foot"><span>Phạm vi triển khai được xác nhận khi chốt báo giá.</span><a class="btn btn-primary" href="?previewPackage=' + key + '#/demo/' + o.demo.toLowerCase() + '" data-act="landing.open" data-pkg="' + key + '" data-go="#/demo/' + o.demo.toLowerCase() + '">Xem tình huống gói ' + key + TH.icon('arrowRight', 'ic-sm') + '</a></div>';
    },
    comparison: function () {
      return '<div class="offer-comparison table-wrap" tabindex="0" role="region" aria-label="So sánh phạm vi bốn gói"><table class="table"><caption>Phạm vi đề xuất · gói cao gồm gói thấp</caption><thead><tr><th scope="col">Nghiệp vụ</th>' + TH.PKG_KEYS.map(function (k) { return '<th scope="col">Gói ' + k + '<span>' + esc(TH.PACKAGES[k].price) + '</span></th>'; }).join('') + '</tr></thead><tbody>' + MATRIX.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + '</th>' + r[1].map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    },
    mobileComparison: function (key) {
      var i = TH.PKG_KEYS.indexOf(key);
      return '<h3>Phạm vi gói ' + key + ' · ' + esc(TH.PACKAGES[key].price) + '</h3><dl>' + MATRIX.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1][i]) + '</dd></div>'; }).join('') + '</dl><p class="small muted">Chọn một gói phía trên để đối chiếu cùng các nghiệp vụ này.</p>';
    },
    roadmap: function (key) {
      return '<ol class="offer-roadmap">' + MILESTONES.map(function (m, i) { return '<li><span class="offer-step" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span><div><h3>' + esc(m[0]) + '</h3><p>' + esc(i === 4 ? OFFERS[key].upgrade : m[1]) + '</p><div class="offer-accept"><b>Điều kiện nghiệm thu</b><span>' + esc(i === 4 && key === 'A' ? OFFERS.A.acceptance : m[2]) + '</span></div></div></li>'; }).join('') + '</ol>';
    },
    summary: function (key) {
      return '<div class="offer-summary"><b>' + esc(OFFERS[key].title) + '</b><p>' + esc(OFFERS[key].outcome) + '</p>' + P.list(OFFERS[key].includes.slice(0, 3)) +
        '<p class="small muted">Mọi gói đều có OCR và Zalo OA. ' + (key === 'A' ? 'Có hai mẫu báo cáo khách hàng.' : 'Bao gồm các gói trước và phần nâng cấp nêu trên.') + ' Giá là tổng giá trị gói.</p><h4>Giới hạn triển khai</h4>' + P.list(OFFERS[key].limits) + '</div>';
    }
  };
  TH.act['pricing.pick'] = function (el) {
    var key = el.dataset.pkg;
    if (!TH.PACKAGES[key] || !TH.app.route.landing) return;
    TH.store.setPkg(key);
    document.querySelectorAll('.plan[data-pkg]').forEach(function (card) { card.classList.toggle('is-selected', card.dataset.pkg === key); });
    document.querySelectorAll('[data-act="pricing.pick"]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.pkg === key)); });
    document.querySelectorAll('.plan [data-act="pricing.pick"]').forEach(function (b) { b.classList.toggle('btn-primary', b.dataset.pkg === key); });
    document.querySelectorAll('[data-offer-demo],.l-nav [data-act="landing.open"]').forEach(function (a) { a.dataset.pkg = key; a.href = '?previewPackage=' + key + '#/demo/rpt-01'; if (a.hasAttribute('data-offer-demo')) a.innerHTML = 'Xem demo gói ' + key + TH.icon('arrowRight', 'ic-sm'); });
    document.getElementById('offer-detail').innerHTML = P.detail(key);
    document.getElementById('offer-mobile-compare').innerHTML = P.mobileComparison(key);
    document.getElementById('offer-roadmap').innerHTML = P.roadmap(key);
    document.querySelectorAll('[data-offer-label]').forEach(function (t) { t.textContent = 'Gói ' + key + ' · ' + TH.PACKAGES[key].price; });
    var input = document.getElementById('offer-link'); if (input) input.value = P.link(key);
    document.getElementById('offer-live').textContent = 'Đang xem gói ' + key + ': ' + OFFERS[key].title + ', ' + TH.PACKAGES[key].price + '.';
    if (el.dataset.reveal) { document.getElementById('pham-vi-goi').scrollIntoView({ block: 'start' }); document.getElementById('offer-detail-title').focus({ preventScroll: true }); }
  };
  TH.act['pricing.copy'] = function () {
    var input = document.getElementById('offer-link'); if (!input) return;
    var done = function () { TH.toast('Đã sao chép liên kết', 'Trang giới thiệu sẽ mở đúng gói đang chọn.', 'success'); };
    var fallback = function () { input.focus(); input.select(); if (document.execCommand('copy')) done(); else TH.toast('Chọn và sao chép liên kết', 'Trình duyệt chưa cho phép sao chép tự động.', 'info'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(input.value).then(done, fallback); else fallback();
  };
  TH.act['pricing.intro'] = function () {
    TH.editGuard.run(function () { TH.modal.stack.slice().forEach(function (m) { TH.modal.close(m.key, { silent: true }); }); TH.router.go('#/');
      requestAnimationFrame(function () { var section = document.getElementById('bang-gia'); if (section) section.scrollIntoView({ block: 'start' }); });
    });
  };
})();
