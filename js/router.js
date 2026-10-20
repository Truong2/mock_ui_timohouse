/*
 * Router hash: #/ (landing) · #/demo/<screen-slug>[/<param>]
 * Query ?previewPackage=A|B|C|D đứng trước hash để static hosting mở trực tiếp.
 * Màn kiểu Popup (SRS §4) render như dialog/workspace phủ trên màn gốc; Back đóng popup.
 */
var TH = window.TH = window.TH || {};
TH.views = TH.views || {};
TH.act = TH.act || {};
TH.onChange = TH.onChange || {};

/* Màn Popup → màn gốc hiển thị bên dưới */
TH.POPUP_BASE = {
  'OWN-IMP': 'OWN-01', 'BLD-IMP': 'BLD-01', 'ROOM-IMP': 'ROOM-01',
  'OCR-CUS': 'CUS-01', 'OCR-CON': 'CON-01', 'CON-FOLLOW': 'CON-03',
  'INV-PREV': 'INV-01', 'PAY-APP': 'PAY-01', 'HR-ASSIGN': 'HR-01',
  'SAL-ADJ': 'SAL-01', 'SHARE-RESULT': 'SHARE-01',
};
TH.EXTRA_ROUTES = { screens: 'Mục lục 39 màn', mapping: 'Kiểm đếm mapping gói' };

TH.router = {
  parse: function () {
    var h = (location.hash || '').replace(/^#/, '');
    if (!h || h === '/' ) return { landing: true };
    var parts = h.split('/').filter(Boolean);
    if (parts[0] !== 'demo') return { landing: true };
    var slug = (parts[1] || 'rpt-01').toLowerCase();
    var param = parts.slice(2).map(decodeURIComponent).join('/') || null;
    if (TH.EXTRA_ROUTES[slug]) return { extra: slug, slug: slug, param: param };
    var screen = slug.toUpperCase();
    if (!TH.screen(screen)) return { notFound: true, slug: slug };
    var base = TH.POPUP_BASE[screen];
    return { screen: screen, base: base || null, page: base || screen, slug: slug, param: param };
  },
  href: function (screen, param) {
    return '#/demo/' + screen.toLowerCase() + (param ? '/' + encodeURIComponent(param) : '');
  },
  go: function (path, opts) {
    opts = opts || {};
    if (path.charAt(0) !== '#') path = '#' + path;
    if (opts.replace) {
      var url = location.href.replace(/#.*$/, '') + path;
      history.replaceState(history.state, '', url);
      TH.app.render();
    } else if (location.hash === path) {
      TH.app.render();
    } else {
      location.hash = path;
    }
  },
  open: function (screen, param, opts) { this.go(this.href(screen, param), opts); },
};
TH.go = function (screen, param, opts) { TH.router.open(screen, param, opts); };
