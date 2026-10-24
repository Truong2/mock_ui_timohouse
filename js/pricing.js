/* Customer-facing package scope shared by the landing page and package drawer.
 * Prices and feature gates stay in TH.PACKAGES / the existing feature registry.
 */
(function () {
  var esc = function (v) { return TH.esc(v); };
  var OFFERS = {
    A: { title: 'Quản lý vận hành cơ bản', audience: 'Cần tập trung hồ sơ và vận hành hằng tháng', outcome: 'Một nguồn dữ liệu từ hợp đồng đến thu tiền và báo cáo.',
      includes: ['Hồ sơ chủ nhà, tòa, phòng, khách và hợp đồng', 'Biểu phí, điện nước, hóa đơn và công nợ', 'Thu nhiều lần; bàn giao, đối chiếu và hoàn cọc', 'Chi phí, nhân sự; lương và cổ phần cơ bản', 'Hai báo cáo theo mẫu khách, xuất Excel', 'OCR giấy tờ và hợp đồng theo mẫu đã chọn, có người rà soát', 'Zalo OA: gửi hóa đơn thủ công và một lịch nhắc đơn giản'],
      limits: ['OCR: một mẫu đã chọn cho mỗi loại giấy tờ/hợp đồng; xác nhận trước khi ghi dữ liệu.', 'OA: một OA, 1–2 mẫu tin được duyệt; chỉ gửi cho người nhận đủ điều kiện.', 'Báo cáo: hai mẫu gốc, xem và xuất theo kỳ; không tự thiết kế mẫu mới.', 'Excel theo mẫu cố định; lương/cổ phần theo bộ công thức đã thống nhất.'],
      example: 'Từ hợp đồng và chỉ số điện nước, lập hóa đơn, ghi nhận thu từng lần và xem khoản còn nợ của từng phòng.',
      acceptance: 'Hồ sơ liên kết đúng; bộ ví dụ tính tiền khớp; thu tiền, cọc và báo cáo thể hiện đúng trạng thái.',
      upgrade: 'Đủ quy trình cơ bản để chuẩn hóa công việc của đội vận hành.', demo: 'INV-02' },
    B: { title: 'Tự động hóa thao tác', audience: 'Cần giảm nhập lặp và xử lý danh sách nhanh hơn', outcome: 'Giảm thao tác lặp khi nhập dữ liệu, lập hóa đơn và nhắc thanh toán.',
      includes: ['Xem trước Excel, kiểm tra dòng và tải danh sách lỗi', 'Nhập chỉ số và lập hóa đơn hàng loạt', 'OCR tối đa hai mẫu đã thống nhất, chỉ rõ trường cần kiểm tra', 'Tính lẻ ngày theo quy tắc; sinh lịch trả chủ nhà từ hợp đồng', 'Cấu hình nhắc thanh toán ba mốc khi OA đủ điều kiện', 'Mở chứng từ từ báo cáo; xem xu hướng nhiều kỳ'],
      limits: ['OCR: tối đa hai mẫu cho mỗi loại giấy tờ/hợp đồng; chưa nhận dạng mẫu tùy ý.', 'OA: kế thừa một OA; thêm mẫu hóa đơn/nhắc nợ/hết hạn hợp đồng và ba mốc nhắc.', 'Báo cáo: giữ hai mẫu gốc; thêm truy nguồn và xu hướng tối đa sáu kỳ.', 'Chỉ xử lý hàng loạt trên các tác vụ và mẫu Excel đã thống nhất.'],
      example: 'Rà soát bảng Excel trước khi ghi, lập hóa đơn theo tòa và mở chứng từ giải thích doanh thu trên báo cáo.',
      acceptance: 'Dòng lỗi được tách để sửa; thao tác hàng loạt đúng kết quả; lịch trả và nhắc thanh toán đúng cấu hình.',
      upgrade: 'Phần đầu tư tăng thêm dành cho tự động hóa và xử lý hàng loạt.', demo: 'INV-01' },
    C: { title: 'Kiểm soát và đối chiếu', audience: 'Nhiều người cùng nhập liệu và cần kiểm soát sai sót', outcome: 'Kiểm tra dữ liệu và trách nhiệm xử lý trước khi chốt kết quả.',
      includes: ['Kiểm trùng hồ sơ, chứng từ và yêu cầu thu tiền', 'Kiểm tra ngoại lệ trước khi xác nhận', 'Bổ sung bước duyệt và lịch sử điều chỉnh theo nghiệp vụ', 'Lưu số liệu kỳ đã duyệt, theo dõi sai lệch', 'Phân bổ chi phí chung theo quy tắc đã thống nhất', 'Báo cáo nhóm nhà, so sánh kỳ và cảnh báo biên lợi nhuận'],
      limits: ['OCR: giữ giới hạn mẫu của B, thêm kiểm trùng và so khớp phòng–khách–hợp đồng.', 'OA: kế thừa một OA; thêm cá nhân hóa theo tòa và xử lý lỗi gửi theo quy tắc.', 'Báo cáo: giữ hai mẫu gốc; thêm so sánh tòa/nhóm/kỳ và bản số liệu đã duyệt.', 'Quy trình duyệt và quy tắc phân bổ cố định theo danh sách đã chốt.'],
      example: 'Phát hiện chứng từ chi bị nhập hai lần, kiểm tra người xử lý và đối chiếu số liệu trước/sau duyệt kỳ.',
      acceptance: 'Phát hiện đúng tình huống trùng/ngoại lệ; quyền xử lý đúng; tổng phân bổ và số liệu đối chiếu khớp.',
      upgrade: 'Phần đầu tư tăng thêm dành cho kiểm soát, xử lý ngoại lệ và đối chiếu.', demo: 'EXP-01' },
    D: { title: 'Quản trị và truy vết', audience: 'Cần giải trình thay đổi và quản lý các kỳ đã chốt', outcome: 'Giữ căn cứ để giải thích số liệu và đối chiếu lịch sử.',
      includes: ['Nhật ký thay đổi dữ liệu tài chính chi tiết', 'Biểu phí và công thức có phiên bản trong phạm vi chốt', 'Khóa kỳ, điều chỉnh có căn cứ và lịch sử', 'Báo cáo lưu có phiên bản, truy ngược nguồn số liệu', 'Đối soát với sao kê nhập vào theo quy tắc', 'Giám sát tác vụ hàng loạt và xử lý lỗi gửi thông báo'],
      limits: ['OCR: thư viện mẫu theo danh mục được duyệt; số mẫu ghi trong báo giá, không nhận mọi định dạng.', 'OA: kế thừa một OA; thêm phiên bản mẫu, lịch sử và giám sát gửi lại.', 'Báo cáo: giữ hai mẫu gốc; thêm khóa kỳ, phiên bản và đối chiếu lịch sử; không tự thiết kế báo cáo bất kỳ.', 'Khóa kỳ, phiên bản và đối soát chỉ áp dụng cho dữ liệu/mẫu đã chốt; chưa kết nối ngân hàng tự động.'],
      example: 'Giữ báo cáo kỳ đã chốt, mở nguồn từng chỉ tiêu và tạo phiên bản mới để giải thích phần số liệu thay đổi.',
      acceptance: 'Bản chốt giữ nguyên; phiên bản sau có liên kết và chênh lệch; thay đổi tài chính truy được căn cứ.',
      upgrade: 'Phần đầu tư tăng thêm dành cho lịch sử, phiên bản và khả năng giải trình.', demo: 'REPORTS' }
  };
  var MATRIX = [
    ['Hồ sơ và hợp đồng', ['Đủ nghiệp vụ cơ bản', 'Thêm kiểm tra, tra cứu', 'Thêm lịch sử và kiểm soát', 'Thêm phiên bản theo hiệu lực']],
    ['Excel và OCR', ['OCR một mẫu mỗi loại; xác nhận trước khi ghi', 'OCR tối đa hai mẫu mỗi loại; xem trước Excel', 'Giữ hai mẫu; thêm kiểm trùng và so khớp', 'Thư viện mẫu theo danh mục đã duyệt']],
    ['Điện nước và hóa đơn', ['Nhập chỉ số, lập nháp và xác nhận', 'Hàng loạt, quy tắc lẻ ngày', 'Soát ngoại lệ trước xác nhận', 'Kiểm chứng theo phiên bản']],
    ['Thu tiền và cọc', ['Thu nhiều lần; công nợ và hoàn cọc theo bước', 'Danh sách và theo dõi quá hạn', 'Kiểm trùng, điều chỉnh có duyệt', 'Đối soát và phân bổ nâng cao']],
    ['Chi phí và lịch trả', ['Nhập, duyệt chi; lịch trả nhập tay', 'Nhập Excel; sinh lịch từ hợp đồng', 'Kiểm trùng; theo dõi còn lại/quá hạn', 'Phân bổ nhiều tòa và truy vết']],
    ['Lương và cổ phần', ['Bản tính cơ bản theo quy tắc chốt', 'Kéo dữ liệu và xem trước', 'Bảng quy tắc và quy trình duyệt', 'Lịch sử chính sách, đối chiếu kỳ']],
    ['Hai mẫu báo cáo gốc', ['Theo tòa và kinh doanh tháng; xem/xuất theo kỳ', 'Giữ hai mẫu; truy nguồn và xu hướng sáu kỳ', 'Giữ hai mẫu; so tòa/nhóm/kỳ, số liệu đã duyệt', 'Giữ hai mẫu; khóa kỳ, phiên bản và lịch sử']],
    ['Zalo OA và thông báo', ['Một OA, 1–2 mẫu tin; gửi tay và một lịch nhắc', 'Kế thừa một OA; ba mốc nhắc cấu hình', 'Thêm cá nhân hóa theo tòa, xử lý lỗi gửi', 'Thêm phiên bản mẫu, lịch sử và giám sát']]
  ];
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
      var current = {
        F029: { A: 'Quản lý ghi nhận và xác nhận thu tại tòa được giao', B: 'Danh sách thu theo kỳ và trạng thái', C: 'Kiểm trùng yêu cầu và nguồn tiền', D: 'Nhật ký xác nhận và đối chiếu chi tiết' },
        F030: { A: 'Kế toán hậu kiểm khoản thu và chứng từ', B: 'Rà soát danh sách thu theo kỳ', C: 'Kiểm trùng, sai lệch và tranh chấp', D: 'Đối soát sao kê nhập vào; chưa bao gồm kết nối ngân hàng tự động' },
        F027: { A: 'Gửi thủ công và một lịch nhắc đơn giản nếu OA cho phép', B: 'Ba mốc nhắc cấu hình; bỏ qua hóa đơn đã thu đủ', C: 'Cá nhân hóa theo tòa và gửi lại có kiểm soát; dừng nhắc khoản đã xác nhận thu đủ', D: 'Thống kê gửi/lỗi và giám sát gửi lại có kiểm soát' }
      };
      var t = current[f.id] ? current[f.id][tier] : f[tier];
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
