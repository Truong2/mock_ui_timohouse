/* Component dùng chung: format, badge, gate gói, bảng, tab, page header, state, dialog/drawer, toast, tooltip, chart. */
var TH = window.TH = window.TH || {};

(function () {
  var I = function (n, c) { return TH.icon(n, c); };

  /* ---------- Escape & format ---------- */
  var esc = TH.esc = function (s) {
    return s === null || s === undefined ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  var nf = new Intl.NumberFormat('vi-VN');
  TH.fmt = {
    num: function (n) { return n === null || n === undefined || n === '' || isNaN(n) ? '—' : nf.format(Math.round(n)); },
    money: function (n) { return n === null || n === undefined || isNaN(n) ? '—' : nf.format(Math.round(n)) + '\u00a0₫'; }, // NBSP: số tiền không bị ngắt dòng trước ₫
    short: function (n) {
      if (n === null || n === undefined || isNaN(n)) return '—';
      var a = Math.abs(n), s = n < 0 ? '−' : '';
      if (a >= 1e9) return s + (a / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + '\u00a0tỷ';
      if (a >= 1e6) return s + (a / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '\u00a0tr';
      if (a >= 1e3) return s + Math.round(a / 1e3).toLocaleString('vi-VN') + 'k';
      return s + a;
    },
    date: function (iso) { if (!iso) return '—'; var d = iso.slice(0, 10).split('-'); return d[2] + '/' + d[1] + '/' + d[0] + (iso.length > 10 ? ' ' + iso.slice(11, 16) : ''); },
    period: function (p) { return p ? p.slice(5) + '/' + p.slice(0, 4) : '—'; },
    pct: function (x, d) { return isNaN(x) ? '—' : (x * 100).toLocaleString('vi-VN', { maximumFractionDigits: d === undefined ? 1 : d }) + '%'; },
  };
  var F = TH.fmt;

  /* ---------- Badges ---------- */
  TH.badge = function (text, tone, opts) {
    opts = opts || {};
    return '<span class="badge badge-' + (tone || 'neutral') + '"' + (opts.tip ? ' data-tip="' + esc(opts.tip) + '"' : '') + '>' + (opts.dot ? '<span class="dot"></span>' : '') + (opts.icon ? I(opts.icon, 'ic-sm') : '') + esc(text) + '</span>';
  };
  TH.openBadge = function (code, text) {
    var label = TH.uiLabel(text || 'Chờ duyệt');
    if (!TH.isReview()) return '<span class="badge badge-open" data-tip="Chính sách chưa chốt — đang chờ khách duyệt; không hiển thị như số liệu chính thức.">' + esc(label) + '</span>';
    return '<span class="badge badge-open" data-tip="Chính sách chưa chốt — Decision Log ' + esc(code) + '. Không hiển thị như LIVE.">' + esc(text || 'DRAFT / CHỜ DUYỆT') + (code ? ' · ' + esc(code) : '') + '</span>';
  };
  /* CR-UI-STD: nhãn trạng thái tiếng Anh/viết hoa còn sót → tiếng Việt (khi không ở chế độ review) */
  var UI_LABELS = { 'DRAFT / CHỜ DUYỆT': 'Chờ duyệt', 'DRAFT': 'Nháp', 'PROPOSED': 'Đề xuất', 'PENDING_APPROVAL': 'Chờ duyệt', 'ĐỀ XUẤT': 'Đề xuất', 'CHỜ DUYỆT': 'Chờ duyệt', 'CHỜ KHÁCH DUYỆT': 'Chờ khách duyệt', 'đề xuất': 'Đề xuất', 'chờ duyệt rule': 'Chờ duyệt quy tắc' };
  TH.uiLabel = function (t) { if (TH.isReview()) return t; var k = String(t || '').trim(); return UI_LABELS[k] || k.replace(/\bDRAFT\b/g, 'Nháp').replace(/\bPROPOSED\b/g, 'Đề xuất').replace(/\bPENDING_APPROVAL\b/g, 'Chờ duyệt'); };
  TH.simBadge = function (text) { return '<span class="badge badge-sim" data-tip="Dữ liệu/kết quả mô phỏng — không gọi provider thật.">' + I('beaker', 'ic-sm') + esc(text || 'Mô phỏng') + '</span>'; };
  var STATUS = {
    active: ['Đang hoạt động', 'success'], inactive: ['Ngừng hoạt động', 'neutral'],
    occupied: ['Đang thuê', 'teal'], vacant: ['Trống', 'info'], maintenance: ['Đang sửa', 'warning'], reserved: ['Đặt cọc', 'info'],
    draft: ['Nháp', 'draft'], pending: ['Chờ xác nhận', 'warning'], confirmed: ['Đã xác nhận', 'success'], approved: ['Đã duyệt', 'success'], rejected: ['Từ chối', 'danger'], cancelled: ['Đã hủy', 'neutral'],
    missing: ['Thiếu số', 'danger'], paid: ['Đã thu đủ', 'success'], unpaid: ['Chưa thu', 'warning'], partial: ['Thu một phần', 'info'], overdue: ['Quá hạn', 'danger'], partial_overdue: ['Quá hạn · thu một phần', 'danger'], reported: ['Đã báo thu · chờ xác nhận', 'warning'],
    sent: ['Đã gửi', 'success'], failed: ['Lỗi gửi', 'danger'], queued: ['Trong hàng đợi', 'info'], skipped: ['Bỏ qua', 'neutral'],
    expiring: ['Sắp hết hạn', 'warning'], ended: ['Đã kết thúc', 'neutral'], terminated: ['Phá hợp đồng', 'danger'],
    extend: ['Gia hạn', 'success'], move_out: ['Chuyển đi', 'danger'], no_answer: ['Chưa trả lời', 'neutral'],
    locked: ['Đã khóa kỳ', 'neutral'], done: ['Hoàn tất', 'success'],
  };
  TH.status = function (key, override) {
    var s = STATUS[key] || [key, 'neutral'];
    return TH.badge(override || s[0], s[1], { dot: true });
  };
  TH.statusLabel = function (key) { return (STATUS[key] || [key])[0]; };
  /* Registry trạng thái theo miền — một nguồn nhãn + tone; TH.status giữ tương thích (miền chung) */
  TH.STATUS_REG = function () {
    return { core: STATUS, bill: TH.BILL_STATES, deposit: TH.DEPOSIT_STATES, adjust: TH.ADJUST_STATES, vehicle: TH.VEHICLE_STATES, doc: TH.DOC_STATES };
  };
  TH.statusOf = function (domain, key, override) {
    var m = (TH.STATUS_REG()[domain] || {})[key] || STATUS[key] || [key, 'neutral'];
    return TH.badge(override || m[0], m[1], { dot: true });
  };

  /* ---------- Package gate ---------- */
  TH.tierPill = function (tier, opts) {
    opts = opts || {};
    return '<span class="tier tier-' + tier + (opts.lg ? ' tier-lg' : '') + '"' + (opts.tip ? ' data-tip="' + esc(opts.tip) + '"' : '') + '>' + tier + (opts.plus ? '+' : '') + '</span>';
  };
  function lockTip(inc) {
    var p = TH.PACKAGES[inc.tier];
    return 'Có từ ' + p.name + ' · ' + p.price + ' — ' + inc.fid + ': ' + inc.text;
  }
  /* Nhãn tier nhỏ cạnh phần nâng cấp đang khả dụng (để khách thấy phần nào thuộc B/C/D). */
  TH.up = function (incId) {
    if (TH._rec) TH._rec(incId);
    var inc = TH.inc(incId);
    if (inc.tier === 'A' || !TH.isReview()) return '';
    return '<span class="up-tag">' + TH.tierPill(inc.tier, { tip: inc.tier + ' · ' + inc.fid + ': ' + inc.text }) + '</span>';
  };
  function placeholder(inc, opts) {
    var lines = opts.lines || 3, out = '';
    for (var i = 0; i < lines; i++) out += '<div class="gate-line" style="width:' + (90 - i * 17) + '%"></div>';
    return '<div class="card" style="box-shadow:none;background:transparent;border:0"><div class="card-bd">' +
      '<div class="card-title" style="margin-bottom:6px">' + esc(opts.title || inc.feature.name) + '</div>' +
      '<div class="small muted u-mb-8">Placeholder — số liệu nâng cấp không hiển thị như dữ liệu đã duyệt ở gói thấp hơn.</div>' + out + '</div></div>';
  }
  /**
   * gate(incId, html, opts)
   *  mode: 'block' (mặc định) | 'btn' | 'mini' | 'field'
   *  ghost: 'self' để làm mờ chính nội dung (chỉ dùng cho điều khiển không mang số liệu)
   */
  TH.gate = function (incId, html, opts) {
    opts = opts || {};
    if (TH._rec) TH._rec(incId);
    if (TH.has(incId)) return html;
    if (!TH.store.state.showLocked) return opts.fallback || '';
    var inc = TH.inc(incId), p = TH.PACKAGES[inc.tier], mode = opts.mode || 'block';
    var tip = esc(lockTip(inc));
    if (mode === 'btn') {
      return '<button type="button" class="gate-inline ' + (opts.size || '') + '" data-locked="' + incId + '" data-tip="' + tip + '">' + I('lock') + esc(opts.label || inc.text) + TH.tierPill(inc.tier) + '</button>';
    }
    if (mode === 'mini') {
      return '<button type="button" class="gate-mini" data-locked="' + incId + '" data-tip="' + tip + '">' + I('lock', 'ic-sm') + esc(opts.label || 'Có từ ' + p.name) + '</button>';
    }
    var ghost = opts.ghost === 'self' ? html : (opts.ghost || placeholder(inc, opts));
    return '<div class="gate-locked ' + (opts.cls || '') + '"' + (opts.minH ? ' style="min-height:' + opts.minH + 'px"' : '') + '>' +
      '<div class="gate-ghost" aria-hidden="true" inert>' + ghost + '</div>' +
      '<button type="button" class="gate-cover" data-locked="' + incId + '" aria-label="' + tip + '"><span class="gate-label">' + I('lock') + TH.tierPill(inc.tier) +
      '<span class="t">Có từ ' + p.name + ' · ' + esc(opts.label || inc.text) + '</span></span></button></div>';
  };
  /* Nút cần quyền: 403 hiển thị khác hẳn khóa gói. */
  TH.permBtn = function (perm, html, label) {
    if (TH.can(perm)) return html;
    var role = TH.ROLES[TH.store.state.role].label;
    return '<span class="forbidden-chip" data-tip="403 · Vai trò ' + esc(role) + ' không có quyền thực hiện thao tác này. Không liên quan đến gói demo.">' + I('ban', 'ic-sm') + esc(label || 'Không có quyền') + '</span>';
  };

  /* ---------- Table ---------- */
  /* Độ dài khối chữ dài nhất trong 1 ô (mỗi <div>/<br> là 1 dòng riêng) — dùng để quyết định cột có được xuống dòng hay không */
  var NOWRAP_MAX = 24, LONG_MIN = 70;
  function longestLine(html) {
    return String(html == null ? '' : html).replace(/<(div|br|p|li)\b[^>]*>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, 'x')
      .split('\n').reduce(function (m, l) { return Math.max(m, l.trim().length); }, 0);
  }
  TH.table = function (o) {
    if (TH._rec) o.cols.forEach(function (c) { if (c.gate) TH._rec(c.gate); });
    var cols = o.cols.filter(function (c) { return !c.gate || TH.has(c.gate) || TH.store.state.showLocked; });
    // Tính trước nội dung ô để biết cột ngắn (giữ 1 dòng) hay cột văn bản dài (được xuống dòng, có độ rộng tối thiểu)
    var cells = o.rows.map(function (r, i) {
      return cols.map(function (c) {
        var locked = c.gate && !TH.has(c.gate);
        return locked ? null : (c.render ? c.render(r, i) : esc(r[c.key]));
      });
    });
    // Cột chữ vừa: độ rộng tối thiểu ≈ nửa dòng dài nhất (+ phần dư chỗ ngắt từ) để gói trong ~2 dòng; cột văn bản dài (≥ 70 ký tự) tối thiểu 240px
    var minW = [];
    var fit = cols.map(function (c, j) {
      if (j === cols.length - 1 && !c.label && !c.labelHtml) return 'nw col-act';
      if (c.nowrap) return 'nw';
      var m = cells.reduce(function (mx, row) { return row[j] == null ? mx : Math.max(mx, longestLine(row[j])); }, 0);
      if (!c.wrap && m <= NOWRAP_MAX) return 'nw';
      minW[j] = m >= LONG_MIN ? 240 : Math.min(260, Math.max(180, Math.round((m / 2 + 4) * 6.8) + 24));
      return 'col-wrap';
    });
    var head = cols.map(function (c, j) {
      var locked = c.gate && !TH.has(c.gate);
      var cls = (c.num ? 'num ' : '') + (c.center ? 'center ' : '') + (c.cls || '') + (locked ? ' is-ghost' : '') + ' ' + fit[j];
      var lbl = locked ? '<button type="button" class="gate-mini th-lock" data-locked="' + c.gate + '" data-tip="' + esc(lockTip(TH.inc(c.gate))) + '">' + I('lock', 'ic-sm') + esc(c.label) + ' ' + TH.tierPill(TH.tierOf(c.gate)) + '</button>'
        : (c.labelHtml || esc(c.label)) + (c.gate && TH.tierOf(c.gate) !== 'A' ? TH.up(c.gate) : '');
      // Tiêu đề dài hơn nội dung: cho xuống tối đa 2 dòng thay vì kéo rộng cả cột (cột khóa tính thêm ổ khóa + nhãn gói)
      var L = (c.labelHtml ? longestLine(c.labelHtml) : String(c.label || '').length), extra = locked ? 44 : c.gate && TH.tierOf(c.gate) !== 'A' ? 24 : 0, thMin = minW[j] || 0;
      if (locked) { cls += ' th-wrap'; thMin = Math.max(76, Math.round(L * 4.8) + 24 + extra); }
      else if (L + extra / 7 > 14) { cls += ' th-wrap'; thMin = Math.max(thMin, Math.round(L * 4.1) + 24 + extra); }
      var st = (c.width ? 'width:' + c.width + ';' : '') + (thMin ? 'min-width:' + thMin + 'px;' : '');
      return '<th class="' + cls + '"' + (st ? ' style="' + st + '"' : '') + ' scope="col">' + lbl + '</th>';
    }).join('');
    var body;
    if (!o.rows.length) {
      body = '<tr class="table-empty"><td colspan="' + cols.length + '" style="height:auto;padding:0">' + TH.state('empty', o.empty || { title: 'Không có dữ liệu phù hợp', text: 'Thử đổi bộ lọc, scope tòa hoặc kỳ.' }) + '</td></tr>';
    } else {
      body = o.rows.map(function (r, i) {
        var attrs = o.rowAttrs ? o.rowAttrs(r, i) : '';
        return '<tr role="row" ' + attrs + '>' + cols.map(function (c, j) {
          var locked = c.gate && !TH.has(c.gate);
          var cls = (c.num ? 'num ' : '') + (c.center ? 'center ' : '') + (c.tdCls || '') + (locked ? ' is-ghost' : '') + ' ' + fit[j];
          var v = locked ? '<span class="ghost-bar" aria-hidden="true"></span>' : cells[i][j];
          if (o.mobile) {
            var identity = c.key === o.mobile.identity;
            var secondary = o.mobile.visible.indexOf(c.key) === -1;
            var label = c.label || (c.labelHtml ? String(c.labelHtml).replace(/<[^>]+>/g, '') : '');
            cls += (identity ? ' mobile-identity' : '') + (secondary ? ' mobile-secondary' : '') + (c.key === o.mobile.primary ? ' mobile-primary' : '');
            if (locked) v = TH.gate(c.gate, '', { mode: 'mini', label: 'Có từ gói ' + TH.tierOf(c.gate) });
            v = '<span class="mobile-cell-label" aria-hidden="true">' + esc(label) + (c.gate ? TH.up(c.gate) : '') + '</span><div class="mobile-cell-value">' + v + '</div>' +
              (identity && cols.some(function (col) { return o.mobile.visible.indexOf(col.key) === -1; }) ? '<button type="button" class="mobile-row-toggle" data-act="table.details" aria-expanded="false">Thông tin khác' + I('chevronDown', 'ic-sm') + '</button>' : '');
          }
          return '<td role="cell" class="' + cls + '">' + v + '</td>';
        }).join('') + '</tr>';
      }).join('');
    }
    var foot = o.foot ? '<tfoot><tr>' + cols.map(function (c, i) {
      var locked = c.gate && !TH.has(c.gate);
      var v = locked ? '' : (o.foot[c.key] !== undefined ? o.foot[c.key] : (i === 0 ? (o.foot._label || 'Tổng') : ''));
      return '<td class="' + (c.num ? 'num' : '') + (locked ? ' is-ghost' : '') + ' ' + fit[i] + '">' + v + '</td>';
    }).join('') + '</tr></tfoot>' : '';
    return '<div class="table-wrap' + (o.scroll ? ' scroll-y' : '') + (o.mobile ? ' table-records' : '') + '"><table class="table' + (o.compact ? ' table-compact' : '') + '" role="table"' + (o.label ? ' aria-label="' + esc(o.label) + '"' : '') + '><thead role="rowgroup"><tr role="row">' + head + '</tr></thead><tbody role="rowgroup">' + body + '</tbody>' + foot + '</table></div>';
  };

  // Open supplementary fields in place; the source cells, controls and package gates stay the same.
  TH.act = TH.act || {};
  TH.act['table.details'] = function (el, ev) {
    ev.stopPropagation();
    var row = el.closest('tr'), expanded = el.getAttribute('aria-expanded') !== 'true';
    row.classList.toggle('is-expanded', expanded);
    el.setAttribute('aria-expanded', String(expanded));
    el.innerHTML = (expanded ? 'Thu gọn thông tin' : 'Thông tin khác') + I('chevronDown', 'ic-sm');
  };

  var compactSummary = window.matchMedia('(max-width: 640px)');
  TH.summaryBlock = function (title, value, html) {
    return '<details class="summary-fold"' + (compactSummary.matches ? '' : ' open') + '><summary><span>' + esc(title) + '</span>' +
      (value ? '<b class="tnum">' + esc(value) + '</b>' : '') + I('chevronDown', 'ic-sm') + '</summary><div class="summary-content">' + html + '</div></details>';
  };
  compactSummary.addEventListener('change', function (event) {
    document.querySelectorAll('.summary-fold').forEach(function (panel) { panel.open = !event.matches; });
  });
  var printSummaries = [];
  window.addEventListener('beforeprint', function () {
    printSummaries = Array.prototype.map.call(document.querySelectorAll('.summary-fold'), function (panel) { var saved = { panel: panel, open: panel.open }; panel.open = true; return saved; });
  });
  window.addEventListener('afterprint', function () {
    printSummaries.forEach(function (saved) { if (saved.panel.isConnected) saved.panel.open = saved.open; });
    printSummaries = [];
  });

  /* Phân trang client-side */
  TH.paginate = function (screen, rows, size) {
    size = size || 10;
    var pages = Math.max(1, Math.ceil(rows.length / size));
    var page = Math.min(TH.store.ui(screen, 'page', 1), pages);
    return { rows: rows.slice((page - 1) * size, page * size), page: page, pages: pages, total: rows.length, size: size };
  };
  TH.pager = function (screen, pg) {
    if (pg.total === 0) return '';
    var from = (pg.page - 1) * pg.size + 1, to = Math.min(pg.total, pg.page * pg.size);
    var btns = '';
    for (var i = 1; i <= pg.pages; i++) btns += '<button type="button" class="btn btn-sm btn-icon" data-act="ui.page" data-screen="' + screen + '" data-val="' + i + '"' + (i === pg.page ? ' aria-current="page"' : '') + '>' + i + '</button>';
    return '<div class="pager"><span>Hiển thị <b class="tnum">' + from + '–' + to + '</b> / <span class="tnum">' + pg.total + '</span> bản ghi</span><div class="pager-btns">' +
      '<button type="button" class="btn btn-sm btn-icon" data-act="ui.page" data-screen="' + screen + '" data-val="' + (pg.page - 1) + '"' + (pg.page <= 1 ? ' disabled' : '') + ' aria-label="Trang trước">' + I('chevronLeft') + '</button>' + btns +
      '<button type="button" class="btn btn-sm btn-icon" data-act="ui.page" data-screen="' + screen + '" data-val="' + (pg.page + 1) + '"' + (pg.page >= pg.pages ? ' disabled' : '') + ' aria-label="Trang sau">' + I('chevronRight') + '</button></div></div>';
  };

  /* ---------- Tabs (có gate) ---------- */
  TH.notices = [];
  TH.resolveTab = function (screen, tabs, key) {
    key = key || 'tab';
    var cur = TH.store.ui(screen, key, tabs[0].id);
    var t = tabs.find(function (x) { return x.id === cur; });
    if (!t || (t.gate && !TH.has(t.gate))) {
      if (t && t.gate) {
        var p = TH.PACKAGES[TH.tierOf(t.gate)];
        TH.notices.push({ title: 'Đã chuyển về tab cơ bản', msg: '“' + t.label + '” là nội dung nâng cấp từ ' + p.name + '. Dữ liệu nháp vẫn được giữ.' });
      }
      cur = tabs[0].id;
      TH.store.state.ui[screen] = TH.store.state.ui[screen] || {};
      TH.store.state.ui[screen][key] = cur;
    }
    return cur;
  };
  TH.tabs = function (screen, tabs, cur, key) {
    key = key || 'tab';
    if (TH._rec) tabs.forEach(function (t) { if (t.gate) TH._rec(t.gate); });
    return '<div class="tabs" role="tablist">' + tabs.filter(function (t) { return !t.gate || TH.has(t.gate) || TH.store.state.showLocked; }).map(function (t) {
      var locked = t.gate && !TH.has(t.gate);
      if (locked) return '<button type="button" class="tab is-locked" role="tab" aria-selected="false" data-locked="' + t.gate + '" data-tip="' + esc(lockTip(TH.inc(t.gate))) + '">' + I('lock', 'ic-sm') + esc(t.label) + TH.tierPill(TH.tierOf(t.gate)) + '</button>';
      return '<button type="button" class="tab" role="tab" aria-selected="' + (t.id === cur) + '" data-act="ui.set" data-screen="' + screen + '" data-key="' + key + '" data-val="' + t.id + '">' + (t.icon ? I(t.icon, 'ic-sm') : '') + esc(t.label) + (t.count !== undefined ? '<span class="count">' + t.count + '</span>' : '') + (t.gate ? TH.up(t.gate) : '') + '</button>';
    }).join('') + '</div>';
  };
  TH.chips = function (screen, key, opts, cur) {
    return opts.map(function (o) {
      return '<button type="button" class="filter-chip" aria-pressed="' + (o.id === cur) + '" data-act="ui.set" data-screen="' + screen + '" data-key="' + key + '" data-val="' + esc(o.id) + '" data-reset-page="1">' + esc(o.label) + (o.count !== undefined ? '<span class="count">' + o.count + '</span>' : '') + '</button>';
    }).join('');
  };
  TH.searchBox = function (screen, placeholder) {
    var id = 'q-' + screen;
    return '<div class="input-wrap">' + I('search') + '<label class="sr-only" for="' + id + '">Tìm kiếm</label><input id="' + id + '" class="input input-sm" type="search" placeholder="' + esc(placeholder || 'Tìm kiếm…') + '" value="' + esc(TH.store.ui(screen, 'q', '')) + '" data-ui="' + screen + '.q" data-reset-page="1" autocomplete="off"></div>';
  };
  TH.uiSelect = function (screen, key, options, cur, label, cls) {
    var id = 'sel-' + screen + '-' + key;
    return '<label class="sr-only" for="' + id + '">' + esc(label) + '</label><select id="' + id + '" class="select select-sm ' + (cls || '') + '" data-ui="' + screen + '.' + key + '" data-reset-page="1">' +
      options.map(function (o) { return '<option value="' + esc(o.id) + '"' + (o.id === cur ? ' selected' : '') + '>' + esc(o.label) + '</option>'; }).join('') + '</select>';
  };
  TH.buildingOptions = function (withAll) {
    var allowed = TH.roleScope();
    var opts = TH.db.buildings.filter(function (b) { return allowed.indexOf(b.id) > -1; }).map(function (b) { return { id: b.id, label: b.name }; });
    if (withAll !== false && opts.length > 1) opts.unshift({ id: 'ALL', label: 'Tất cả tòa' });
    return opts;
  };
  TH.match = function (q, parts) {
    if (!q) return true;
    q = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    return parts.join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').indexOf(q) > -1;
  };

  /* ---------- Page header ---------- */
  TH.screen = function (id) { return TH.SCREENS.find(function (s) { return s.id === id; }); };
  TH.pageHeader = function (o) {
    var sc = TH.screen(o.screen) || {};
    var crumbs = (o.crumbs || [[sc.module || 'Demo']]).map(function (c, i, arr) {
      return (c[1] ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' : '<span>' + esc(c[0]) + '</span>') + (i < arr.length - 1 ? I('chevronRight') : '');
    }).join('');
    return '<div class="page-hd"><div class="u-minw-0"><nav class="crumbs" aria-label="Breadcrumb">' + crumbs + '</nav>' +
      '<h1 class="page-title">' + esc(o.title || sc.title) + ' <span class="screen-id" data-tip="Screen ID theo SRS §4' + (sc.no ? ' · Screen ' + sc.no : '') + ' · ' + esc(sc.kind || '') + '">' + esc(o.screen) + '</span>' + (o.status || '') + '</h1>' +
      (o.desc ? '<p class="page-desc">' + o.desc + '</p>' : '') + (o.facts || '') + '</div>' +
      '<div class="page-actions">' + (o.actions || '') + '</div></div>';
  };
  /* ---------- Data states ---------- */
  TH.state = function (kind, o) {
    o = o || {};
    var map = {
      empty: ['inbox', 'state-empty', 'Chưa có dữ liệu', 'Không có bản ghi trong phạm vi đang xem.'],
      error: ['alert', 'state-error', 'Không tải được dữ liệu', 'Lỗi API (mô phỏng). Dữ liệu chưa thay đổi; thử lại sau.'],
      forbidden: ['shieldAlert', 'state-forbidden', 'Không có quyền truy cập (403)', 'Vai trò hiện tại không được cấp quyền xem màn này. Đây là phân quyền vai trò — khác với khóa theo gói.'],
    };
    var m = map[kind];
    return '<div class="state ' + m[1] + '"><div class="state-ic">' + I(m[0]) + '</div><h3>' + esc(o.title || m[2]) + '</h3><p>' + (o.text || m[3]) + '</p>' + (o.action || '') + '</div>';
  };
  TH.loadingSkeleton = function () {
    var row = function (w) { return '<div class="skel" style="height:14px;width:' + w + '%;margin:14px 0"></div>'; };
    return '<div class="grid-4 u-mb-16">' + [1, 2, 3, 4].map(function () { return '<div class="card kpi"><div class="skel" style="height:12px;width:50%"></div><div class="skel" style="height:26px;width:70%;margin-top:8px"></div></div>'; }).join('') + '</div>' +
      '<div class="card"><div class="card-bd" aria-busy="true" aria-label="Đang tải">' + row(92) + row(85) + row(88) + row(70) + row(80) + row(60) + '</div></div>';
  };

  /* ---------- KPI ---------- */
  TH.kpi = function (o) {
    return '<div class="card kpi' + (o.accent ? ' kpi-accent' : '') + '">' +
      (o.href ? '<a class="kpi-link" href="' + o.href + '" aria-label="' + esc(o.label) + ' — mở dữ liệu nguồn"></a>' : '') +
      '<div class="kpi-label">' + (o.icon ? I(o.icon, 'ic-sm') : '') + esc(o.label) + (o.badge || '') + '</div>' +
      '<div class="kpi-value' + (o.neg ? ' neg' : '') + '">' + o.value + '</div>' +
      (o.foot ? '<div class="kpi-foot">' + o.foot + '</div>' : '') + '</div>';
  };

  /* ---------- Overlay: dialog / drawer ---------- */
  var stack = [];
  var root = null;
  function ensureRoot() {
    if (!root) { root = document.createElement('div'); root.id = 'overlays'; document.body.appendChild(root); }
    return root;
  }
  function focusables(el) {
    return Array.prototype.filter.call(el.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'), function (x) { return x.offsetParent !== null && !x.closest('[inert]'); });
  }
  function paint(m) {
    var r = m.spec.render();
    var hd = m.el.querySelector('.titles'), bd = m.el.querySelector('.dialog-bd'), ft = m.el.querySelector('.dialog-ft');
    hd.innerHTML = '<h2 class="dialog-title" id="' + m.id + '-t">' + r.title + '</h2>' + (r.sub ? '<div class="dialog-sub">' + r.sub + '</div>' : '');
    m.el.querySelector('.hd-extra').innerHTML = r.headExtra || '';
    var st = bd.scrollTop;
    bd.className = 'dialog-bd' + (r.flush ? ' flush' : '');
    bd.innerHTML = r.body;
    bd.scrollTop = st;
    ft.innerHTML = r.foot || '';
    ft.hidden = !r.foot;
    TH.uiPolish(m.el);
  }
  TH.modal = {
    stack: stack,
    open: function (spec) {
      var existing = stack.find(function (m) { return m.key === spec.key; });
      if (existing) { existing.spec = spec; paint(existing); return existing; }
      ensureRoot();
      var id = 'dlg-' + Math.random().toString(36).slice(2, 8);
      var el = document.createElement('div');
      var drawer = spec.kind === 'drawer';
      el.className = 'overlay' + (drawer ? ' overlay-drawer' : '');
      el.style.zIndex = 400 + stack.length * 10 + (spec.z || 0);
      el.innerHTML = '<div class="overlay-bg" data-close></div><div class="' + (drawer ? 'drawer' : 'dialog dialog-' + (spec.size || 'md')) + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '-t">' +
        '<div class="dialog-hd"><div class="titles"></div><div class="hd-extra row u-gap-8"></div><button type="button" class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Đóng">' + I('x') + '</button></div>' +
        '<div class="dialog-bd"></div><div class="dialog-ft"></div></div>';
      root.appendChild(el);
      var m = { key: spec.key, id: id, el: el, spec: spec, ret: document.activeElement };
      stack.push(m);
      paint(m);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        var target = el.querySelector('[autofocus]') || focusables(el.querySelector('.dialog-bd'))[0] || el.querySelector('[data-close].btn');
        if (target) target.focus({ preventScroll: true });
      });
      if (spec.onMount) spec.onMount(el);
      return m;
    },
    close: function (key, opts) {
      opts = opts || {};
      var idx = key ? stack.findIndex(function (m) { return m.key === key; }) : stack.length - 1;
      if (idx < 0) return;
      var m = stack.splice(idx, 1)[0];
      m.el.classList.add('is-closing');
      setTimeout(function () { m.el.remove(); }, 170);
      if (!stack.length) document.body.style.overflow = '';
      if (m.ret && m.ret.isConnected && !opts.noFocus) { try { m.ret.focus({ preventScroll: true }); } catch (e) { /* noop */ } }
      if (m.spec.onClose && !opts.silent) m.spec.onClose();
    },
    isOpen: function (key) { return stack.some(function (m) { return m.key === key; }); },
    top: function () { return stack[stack.length - 1]; },
    rerenderAll: function () {
      stack.forEach(function (m) {
        var ae = document.activeElement, aid = ae && m.el.contains(ae) ? ae.id : null, sel = aid && ae.selectionStart !== undefined ? [ae.selectionStart, ae.selectionEnd] : null;
        paint(m);
        if (aid) { var n = document.getElementById(aid); if (n) { n.focus({ preventScroll: true }); if (sel && n.setSelectionRange) try { n.setSelectionRange(sel[0], sel[1]); } catch (e) { /* noop */ } } }
      });
    },
    trap: function (ev) {
      var m = stack[stack.length - 1];
      if (!m || ev.key !== 'Tab') return;
      var f = focusables(m.el);
      if (!f.length) return;
      if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
      else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
    },
  };

  TH.confirm = function (o) {
    return new Promise(function (resolve) {
      var done = false;
      TH.modal.open({
        key: 'confirm-' + Date.now(), size: 'sm', z: 50,
        render: function () {
          return {
            title: esc(o.title),
            body: '<div class="stack-sm" style="font-size:14px;color:var(--text-2)">' + o.body + '</div>',
            foot: '<button type="button" class="btn" data-close>' + esc(o.cancel || 'Hủy') + '</button><button type="button" class="btn ' + (o.danger ? 'btn-danger-solid' : 'btn-primary') + '" data-act="confirm.ok" autofocus>' + esc(o.ok || 'Xác nhận') + '</button>',
          };
        },
        onMount: function (el) { el._resolve = function (v) { done = true; resolve(v); }; },
        onClose: function () { if (!done) resolve(false); },
      });
    });
  };

  /* ---------- Toast ---------- */
  TH.toast = function (title, msg, tone) {
    var box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    var t = document.createElement('div');
    tone = tone || 'success';
    t.className = 'toast toast-' + tone;
    t.innerHTML = I({ success: 'checkCircle', warning: 'alert', danger: 'xCircle', info: 'info' }[tone]) + '<div><div class="toast-title">' + esc(title) + '</div>' + (msg ? '<div class="toast-msg">' + msg + '</div>' : '') + '</div>';
    TH.uiPolish(t);
    box.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 200); }, 4200);
  };

  /* ---------- Tooltip ---------- */
  var tipEl = null, tipFor = null;
  function showTip(target) {
    var text = target.getAttribute('data-tip');
    if (!text) return;
    text = TH.cleanCodes(text);
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip-pop'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl); }
    tipEl.textContent = text;
    tipFor = target;
    var r = target.getBoundingClientRect();
    tipEl.style.left = '0px'; tipEl.style.top = '0px';
    tipEl.classList.add('is-on');
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    var left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    var top = r.top - h - 8;
    if (top < 8) top = r.bottom + 8;
    tipEl.style.left = left + 'px'; tipEl.style.top = top + 'px';
  }
  function hideTip() { if (tipEl) tipEl.classList.remove('is-on'); tipFor = null; }
  document.addEventListener('mouseover', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t && t !== tipFor) showTip(t); else if (!t && tipFor) hideTip(); });
  document.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t && e.target.matches(':focus-visible')) showTip(t); });
  document.addEventListener('focusout', hideTip);
  document.addEventListener('scroll', hideTip, true);
  TH.hideTip = hideTip;

  /* ---------- Charts (SVG) ---------- */
  var COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];
  function niceStep(range) {
    var raw = range / 4, p = Math.pow(10, Math.floor(Math.log10(raw || 1))), n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  function axis(all) {
    var lo = Math.min(0, Math.min.apply(null, all)), hi = Math.max(0, Math.max.apply(null, all));
    if (hi === lo) hi = lo + 1;
    var st = niceStep(hi - lo);
    lo = Math.floor(lo / st) * st; hi = Math.ceil(hi / st) * st;
    return { lo: lo, hi: hi, step: st };
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  function roundedTop(x, y, w, h, r) {
    if (h <= 0) return '';
    r = Math.min(r, w / 2, h);
    return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
  }
  /* Cột nhóm: categories × series. Hover tooltip từng cột, legend khi ≥2 series. */
  function chartFrame(o) {
    var compact = window.matchMedia('(max-width: 640px)').matches;
    return { compact: compact, width: compact ? Math.min(o.width || 560, Math.max(260, window.innerWidth - 80)) : o.width || 560, height: compact ? 200 : o.height || 240 };
  }
  TH.chart = {
    bars: function (o) {
      var frame = chartFrame(o), W = frame.width, H = frame.height, pl = 52, pr = 8, pt = 12, pb = 30;
      var all = []; o.series.forEach(function (s) { all = all.concat(s.values); });
      var ax = axis(all), minV = ax.lo, maxV = ax.hi;
      var ih = H - pt - pb, iw = W - pl - pr;
      var y = function (v) { return pt + (maxV - v) / (maxV - minV) * ih; };
      var gw = iw / o.categories.length, n = o.series.length, bw = Math.min(26, (gw - 16) / n - 2);
      var grid = '';
      for (var v = minV; v <= maxV + 1; v += ax.step) {
        var yy = y(v);
        grid += '<line class="grid-line" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '"/><text x="' + (pl - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + F.short(v) + '</text>';
      }
      var bars = '';
      o.categories.forEach(function (c, ci) {
        var gx = pl + gw * ci + (gw - (bw + 2) * n + 2) / 2;
        o.series.forEach(function (s, si) {
          var v = s.values[ci], x = gx + si * (bw + 2), y0 = y(0), yv = y(v);
          var tip = c + ' · ' + s.label + ': ' + F.money(v);
          if (v >= 0) bars += '<path class="bar" d="' + roundedTop(x, yv, bw, y0 - yv, 4) + '" fill="' + (s.color || COLORS[si]) + '" data-tip="' + esc(tip) + '"/>';
          else bars += '<path class="bar" d="' + roundedTop(x, y0, bw, yv - y0, 0) + '" fill="' + (s.color || COLORS[si]) + '" opacity=".55" data-tip="' + esc(tip) + '"/>';
          bars += '<rect x="' + (x - 1) + '" y="' + pt + '" width="' + (bw + 2) + '" height="' + ih + '" fill="transparent" data-tip="' + esc(tip) + '"/>';
        });
        bars += '<text x="' + (pl + gw * ci + gw / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(c) + '</text>';
      });
      var base = '<line class="axis-line" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
      var legend = o.series.length > 1 ? '<div class="legend u-mb-12">' + o.series.map(function (s, si) { return '<span><i style="background:' + (s.color || COLORS[si]) + '"></i>' + esc(s.label) + '</span>'; }).join('') + '</div>' : '';
      return legend + '<svg class="chart' + (frame.compact ? ' chart-compact' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Biểu đồ cột') + '">' + grid + base + bars + '</svg>';
    },
    lines: function (o) {
      var frame = chartFrame(o), W = frame.width, H = frame.height, pl = 52, pr = 16, pt = 12, pb = 30;
      var all = []; o.series.forEach(function (s) { all = all.concat(s.values); });
      var ax = axis(all), minV = ax.lo, maxV = ax.hi;
      var ih = H - pt - pb, iw = W - pl - pr, n = o.categories.length;
      var x = function (i) { return pl + (n === 1 ? iw / 2 : iw * i / (n - 1)); };
      var y = function (v) { return pt + (maxV - v) / (maxV - minV) * ih; };
      var grid = '';
      for (var v = minV; v <= maxV + 1; v += ax.step) { var yy = y(v); grid += '<line class="grid-line" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '"/><text x="' + (pl - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + F.short(v) + '</text>'; }
      var paths = o.series.map(function (s, si) {
        var col = s.color || COLORS[si];
        var d = s.values.map(function (v, i) { return (i ? 'L' : 'M') + x(i) + ',' + y(v); }).join('');
        var dots = s.values.length === 1 ? '<circle cx="' + x(0) + '" cy="' + y(s.values[0]) + '" r="3" fill="' + col + '"/>' : '';
        var lastV = s.values[s.values.length - 1];
        var lbl = o.series.length <= 4 ? '<text x="' + (x(n - 1) - 6) + '" y="' + (y(lastV) - 9) + '" text-anchor="end" style="fill:var(--text-2);font-weight:600">' + F.short(lastV) + '</text>' : '';
        return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' + dots + lbl;
      }).join('');
      var hits = o.categories.map(function (c, i) {
        var tip = c + ' — ' + o.series.map(function (s) { return s.label + ': ' + F.money(s.values[i]); }).join(' · ');
        var w = n > 1 ? iw / (n - 1) : iw;
        var showLabel = !frame.compact || i % Math.max(1, Math.ceil(n / 4)) === 0;
        return '<rect x="' + (x(i) - w / 2) + '" y="' + pt + '" width="' + w + '" height="' + ih + '" fill="transparent" data-tip="' + esc(tip) + '"/>' + (showLabel ? '<text x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="' + (frame.compact && i === 0 ? 'start' : frame.compact && i === n - 1 ? 'end' : 'middle') + '">' + esc(c) + '</text>' : '');
      }).join('');
      var legend = o.series.length > 1 ? '<div class="legend u-mb-12">' + o.series.map(function (s, si) { return '<span><i style="background:' + (s.color || COLORS[si]) + '"></i>' + esc(s.label) + '</span>'; }).join('') + '</div>' : '';
      return legend + '<svg class="chart' + (frame.compact ? ' chart-compact' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Biểu đồ xu hướng') + '">' + grid + '<line class="axis-line" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>' + paths + hits + '</svg>';
    },
    /* Thanh chồng ngang cho mốc 5/10/15 — một hue theo thứ bậc, khe 2px giữa các đoạn. */
    stack: function (parts, total) {
      total = total || parts.reduce(function (s, p) { return s + p.value; }, 0) || 1;
      return '<div class="progress" style="height:12px;gap:2px;background:var(--n-100)">' + parts.filter(function (p) { return p.value > 0; }).map(function (p) {
        return '<span style="width:' + (p.value / total * 100) + '%;background:' + p.color + ';border-radius:3px" data-tip="' + esc(p.label + ': ' + F.money(p.value) + ' (' + F.pct(p.value / total) + ')') + '"></span>';
      }).join('') + '</div><div class="legend" style="margin-top:10px">' + parts.map(function (p) { return '<span><i style="background:' + p.color + '"></i>' + esc(p.label) + ' · <b class="tnum" style="color:var(--text)">' + F.short(p.value) + '</b></span>'; }).join('') + '</div>';
    },
  };

  /* ---------- Sửa inline từng nhóm thông tin (CR-BLD-01 · note.md §7.1) ----------
     TH.SECTIONS[key] = { title(id), sub(id)?, perm?, fields(id) → [{name,label,type,options,span,hint,num,required}], values(id) → {name: giá trị đã lưu},
                          view(id, vals) → html, validate(vals, id)? → lỗi, save(id, vals), log(id, vals)? → [action, entity, detail, kind, bId] }
     Một nhóm được sửa tại một thời điểm; chuyển tab / rời trang / đổi kỳ khi còn thay đổi chưa lưu → hỏi Lưu / Bỏ thay đổi / Tiếp tục chỉnh sửa. */
  TH.SECTIONS = {};
  TH.secForm = function (key, id) { return 'sec-' + key + '-' + id; };
  TH.editing = function () { return TH.store.state.editing || null; };
  TH.section = function (key, id, opts) {
    var def = TH.SECTIONS[key];
    opts = opts || {};
    var ed = TH.editing(), on = !!(ed && ed.key === key && ed.id === id);
    var form = TH.secForm(key, id), vals = def.values(id);
    var title = typeof def.title === 'function' ? def.title(id) : def.title;
    var sub = def.sub ? (typeof def.sub === 'function' ? def.sub(id) : def.sub) : '';
    var btnEdit = def.readonly && def.readonly(id) ? '' : TH.permBtn(def.perm || 'master.edit', '<button type="button" class="btn btn-sm" data-act="sec.edit" data-key="' + key + '" data-id="' + esc(id) + '">' + I('edit', 'ic-sm') + 'Chỉnh sửa</button>', 'Chỉnh sửa · 403');
    var btnsOn = '<button type="button" class="btn btn-sm" data-act="sec.cancel">Hủy</button><button type="button" class="btn btn-sm btn-primary" data-act="sec.save">' + I('check', 'ic-sm') + 'Lưu thay đổi</button>';
    var body;
    if (on) {
      var err = TH.store.draft(form, '_err', '');
      body = (err ? '<div class="alert alert-danger u-mb-12">' + I('xCircle', 'ic-sm') + '<div class="alert-body">' + esc(err) + '</div></div>' : '') +
        '<div class="form-grid">' + def.fields(id).map(function (f) {
          if (f.html) return f.html;
          return TH.field(Object.assign({ form: form, def: vals[f.name] === null || vals[f.name] === undefined ? '' : vals[f.name] }, f));
        }).join('') + '</div>';
    } else body = def.view(id, vals);
    return '<div class="card sec-card' + (on ? ' is-editing' : '') + (opts.cls ? ' ' + opts.cls : '') + '" id="sec-' + key + '-' + esc(id) + '">' + TH.cardHd(title, sub, on ? TH.badge('Đang chỉnh sửa', 'draft', { dot: true }) : btnEdit) +
      '<div class="card-bd">' + body + '</div>' +
      (on ? '<div class="card-ft sec-ft"><span class="small muted">' + I('info', 'ic-sm') + ' Lưu để cập nhật trang chi tiết và danh sách liên quan; Hủy giữ dữ liệu đã lưu.</span><span class="spacer"></span><div class="row u-gap-8">' + btnsOn + '</div></div>' : '') + '</div>';
  };
  TH.editGuard = {
    dirty: function () {
      var ed = TH.editing();
      if (!ed || !TH.SECTIONS[ed.key]) return false;
      var d = TH.store.draft(TH.secForm(ed.key, ed.id)), vals = TH.SECTIONS[ed.key].values(ed.id);
      return Object.keys(d).some(function (k) { return k.charAt(0) !== '_' && String(d[k]) !== String(vals[k] === null || vals[k] === undefined ? '' : vals[k]); });
    },
    /* Chạy proceed() ngay nếu không có thay đổi; ngược lại hỏi người dùng. Trả Promise<boolean> (đã đi tiếp hay chưa). */
    run: function (proceed) {
      if (!TH.editGuard.dirty()) { if (TH.editing()) TH.sectionEnd(true); proceed(); return Promise.resolve(true); }
      return TH.unsavedPrompt().then(function (v) {
        if (v === 'save') { if (!TH.sectionSave()) return false; proceed(); return true; }
        if (v === 'discard') { TH.sectionEnd(true); proceed(); return true; }
        return false;
      });
    },
  };
  TH.sectionEnd = function (silent) {
    var ed = TH.editing();
    if (!ed) return;
    TH.store.clearDraft(TH.secForm(ed.key, ed.id));
    TH.store.state.editing = null;
    if (!silent) TH.app.refresh();
  };
  TH.sectionSave = function () {
    var ed = TH.editing();
    if (!ed) return true;
    var def = TH.SECTIONS[ed.key], form = TH.secForm(ed.key, ed.id), d = TH.store.draft(form);
    var before = def.values(ed.id), vals = Object.assign({}, before);
    Object.keys(d).forEach(function (k) { if (k.charAt(0) !== '_') vals[k] = typeof d[k] === 'string' ? d[k].trim() : d[k]; });
    var err = def.validate ? def.validate(vals, ed.id) : null;
    if (err) { TH.store.setDraft(form, '_err', err); TH.app.refresh(); return false; }
    var changed = Object.keys(vals).filter(function (k) { return String(vals[k]) !== String(before[k] === null || before[k] === undefined ? '' : before[k]); });
    def.save(ed.id, vals, changed);
    var title = typeof def.title === 'function' ? def.title(ed.id) : def.title;
    var lg = def.log ? def.log(ed.id, vals, changed) : ['Sửa thông tin', ed.id, '', 'other'];
    if (changed.length) TH.log(lg[0], lg[1], (lg[2] ? lg[2] + ' · ' : '') + changed.length + ' trường thay đổi', lg[3], lg[4]);
    TH.sectionEnd(true);
    TH.app.refresh();
    TH.toast(changed.length ? 'Đã lưu thay đổi' : 'Không có thay đổi', esc(String(title).replace(/<[^>]+>/g, '')) + (changed.length ? ' · trang chi tiết và danh sách liên quan đã cập nhật' : ''), changed.length ? 'success' : 'info');
    return true;
  };
  TH.unsavedPrompt = function () {
    var ed = TH.editing(), def = ed && TH.SECTIONS[ed.key];
    var title = def ? String(typeof def.title === 'function' ? def.title(ed.id) : def.title).replace(/<[^>]+>/g, '') : '';
    return new Promise(function (resolve) {
      var done = false;
      TH.modal.open({
        key: 'unsaved', size: 'sm', z: 60,
        render: function () {
          return {
            title: 'Còn thay đổi chưa lưu',
            body: '<div class="stack-sm" style="font-size:14px;color:var(--text-2)"><p>Nhóm <b>' + esc(title) + '</b> đang có thay đổi chưa lưu.</p><p class="small muted">Lưu để cập nhật dữ liệu, bỏ để giữ bản đã lưu trước đó, hoặc tiếp tục chỉnh sửa.</p></div>',
            foot: '<button type="button" class="btn" data-close autofocus>Tiếp tục chỉnh sửa</button><span class="spacer"></span><button type="button" class="btn btn-danger" data-act="unsaved.pick" data-val="discard">Bỏ thay đổi</button><button type="button" class="btn btn-primary" data-act="unsaved.pick" data-val="save">' + I('check', 'ic-sm') + 'Lưu</button>',
          };
        },
        onMount: function (el) { el._resolve = function (v) { done = true; resolve(v); }; },
        onClose: function () { if (!done) resolve('stay'); },
      });
    });
  };

  /* ---------- Misc ---------- */
  TH.kv = function (pairs) {
    return '<dl class="kv">' + pairs.map(function (p) { return '<dt>' + esc(p[0]) + '</dt><dd>' + (p[1] === undefined || p[1] === null || p[1] === '' ? '—' : p[1]) + '</dd>'; }).join('') + '</dl>';
  };
  /* CR-UI-STD: lỗi form hiển thị ngay tại field (thay toast). Lưu trong draft `_errors` của form. */
  TH.formErrors = function (form, map) {
    TH.store.setDraft(form, '_errors', map || {});
    var keys = Object.keys(map || {});
    return keys.length === 0;
  };
  TH.clearFormErrors = function (form) { TH.store.setDraft(form, '_errors', {}); };
  TH.formErrorSummary = function (form) {
    var e = TH.store.draft(form, '_errors', {}) || {}, ks = Object.keys(e);
    if (ks.length < 2) return '';
    return '<div class="alert alert-danger form-error-summary" role="alert">' + TH.icon('alertCircle', 'ic-sm') + '<div class="alert-body"><b>Cần sửa ' + ks.length + ' trường trước khi lưu</b><span>' + ks.map(function (k) { return esc(e[k]); }).join(' · ') + '</span></div></div>';
  };
  TH.field = function (o) {
    var id = o.id || ('f-' + (o.form || 'x') + '-' + o.name);
    if (o.error === undefined && o.form && o.name) { var fe = (TH.store.draft(o.form, '_errors', {}) || {})[o.name]; if (fe) { o = Object.assign({}, o, { error: fe, invalid: true }); } }
    var aria = o.error ? ' aria-invalid="true" aria-describedby="' + id + '-err"' : '';
    var val = o.value !== undefined ? o.value : (o.form ? TH.store.draft(o.form, o.name, o.def !== undefined ? o.def : '') : '');
    var bind = (o.form ? ' data-draft="' + o.form + '.' + o.name + '"' : '') + (o.live ? ' data-live' : '');
    var req = o.required ? ' <span class="neg" aria-hidden="true">*</span>' : '';
    var ctl;
    if (o.type === 'select') {
      ctl = '<select id="' + id + '" class="select' + (o.invalid ? ' is-invalid' : '') + '"' + bind + aria + (o.disabled ? ' disabled' : '') + '>' + o.options.map(function (op) {
        var v = typeof op === 'object' ? op.id : op, l = typeof op === 'object' ? op.label : op;
        return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>';
      }).join('') + '</select>';
    } else if (o.type === 'textarea') {
      ctl = '<textarea id="' + id + '" class="textarea' + (o.invalid ? ' is-invalid' : '') + '"' + bind + aria + ' rows="' + (o.rows || 3) + '" placeholder="' + esc(o.placeholder || '') + '">' + esc(val) + '</textarea>';
    } else {
      ctl = '<input id="' + id + '" class="input' + (o.num ? ' num' : '') + (o.invalid ? ' is-invalid' : '') + (o.warn ? ' is-warn' : '') + '" type="' + (o.type || 'text') + '"' + bind + aria + ' value="' + esc(val) + '"' + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + (o.readonly ? ' readonly' : '') + (o.disabled ? ' disabled' : '') + (o.inputmode ? ' inputmode="' + o.inputmode + '"' : '') + ' autocomplete="off">';
    }
    return '<div class="field' + (o.span ? ' span-2' : '') + '"><label for="' + id + '">' + esc(o.label) + req + (o.labelExtra || '') + '</label>' + ctl +
      (o.error ? '<div class="field-error" id="' + id + '-err">' + TH.icon('alertCircle', 'ic-sm') + esc(o.error) + '</div>' : o.hint ? '<div class="field-hint">' + o.hint + '</div>' : '') + '</div>';
  };
  TH.fileOf = function (name) {
    var ext = (name.split('.').pop() || '').toLowerCase();
    var cls = ext === 'pdf' ? 'pdf' : /png|jpe?g/.test(ext) ? 'img' : '';
    return '<span class="file-pill"><span class="ext ' + cls + '">' + esc(ext.toUpperCase()) + '</span><span><b style="font-size:13px">' + esc(name) + '</b><br><span class="small muted">Tệp minh họa</span></span></span>';
  };
  TH.personCell = function (name, sub) {
    var initials = (name || '?').split(' ').slice(-2).map(function (w) { return w[0]; }).join('').toUpperCase();
    return '<div class="row" style="gap:10px;flex-wrap:nowrap"><span class="avatar avatar-sm">' + esc(initials) + '</span><div class="u-minw-0"><div class="cell-main nowrap">' + esc(name) + '</div>' + (sub ? '<div class="cell-sub nowrap">' + sub + '</div>' : '') + '</div></div>';
  };
  TH.link = function (href, text) { return '<a href="' + href + '">' + esc(text) + '</a>'; };

  /* =========================================================
     CR-UI-STD — chế độ review nghiệm thu, thu gọn thao tác, a11y nút icon
     ========================================================= */
  TH.isReview = function () { return !!(TH.store && TH.store.state && TH.store.state.reviewMode); };
  /* Mã nội bộ: tính năng (F023.B), quyết định (D-03, K-05, G-03, R-01), câu hỏi (BILL-Q1…Q8, PAY-Q3), CR (CR-RPT-02);
     mã màn (METER-01, INV-PREV) chỉ khi có trong TH.SCREENS. Không chạm mã dữ liệu (INV-2610-CG302, PT-2610-003, TH-CG). */
  var RE_CODE = /\b(?:F\d{3}(?:\.[A-D])?|[DKGR]-\d{2}|BILL-Q\d(?:[…-]Q\d)?|PAY-Q\d|CR-[A-Z]+-\d+|QA-[A-Z]+(?:-\d+)?)\b/g;
  var RE_SCREEN_PAREN = /\(\s*([A-Z]{2,6}-(?:\d{2}[a-z]?|[A-Z]{3,}))\s*\)/g;
  var RE_SCREEN = /\b([A-Z]{2,6}-(?:\d{2}[a-z]?|[A-Z]{3,}))\b/g;
  var RE_HINT = /F\d{3}|[A-Z]-\d|[A-Z]{2,}-[A-Z]{3}|BILL-Q|PAY-Q|DRAFT|PROPOSED|PENDING_APPROVAL/;
  function isScreen(id) { return !!(TH.screen && TH.screen(id)); }
  TH.cleanCodes = function (s) {
    if (!s || TH.isReview() || !RE_HINT.test(s)) return s;
    var out = String(s)
      .replace(RE_SCREEN_PAREN, function (m, id) { return isScreen(id) ? '' : m; })
      .replace(RE_SCREEN, function (m, id) { return isScreen(id) ? (TH.navigation && TH.navigation.label ? TH.navigation.label(id) : TH.screen(id).title) : m; })
      .replace(RE_CODE, '')
      .replace(/\bDRAFT\b/g, 'Nháp').replace(/\bPROPOSED\b/g, 'Đề xuất').replace(/\bPENDING_APPROVAL\b/g, 'Chờ duyệt')
      .replace(/\(\s*(?:[·,\/;:+&]\s*)+/g, '(').replace(/(?:\s*[·,\/;:+&])+\s*\)/g, ')')
      .replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '')
      .replace(/(?:\s*·){2,}/g, ' ·').replace(/\s*·\s*(?=[)\]])/g, '')
      .replace(/(^|\s)[·\/,]\s*$/g, '$1').replace(/^\s*[·\/,]\s+/, '')
      .replace(/ {2,}/g, ' ');
    return out;
  };
  /* Duyệt text node của vùng vừa vẽ; badge/tag rỗng sau khi bỏ mã thì ẩn */
  TH.reviewFilter = function (root) {
    if (!root || TH.isReview()) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      var p = n.parentElement;
      if (!p || p.closest('select, textarea, code, .mono, .doc-page, .print-doc, [data-raw]')) return NodeFilter.FILTER_REJECT;
      return RE_HINT.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    } });
    var nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(function (n) {
      var v = TH.cleanCodes(n.nodeValue);
      if (v === n.nodeValue) return;
      n.nodeValue = v;
      var p = n.parentElement;
      if (p && !p.textContent.trim() && p.matches('.badge, .tag, .tier, span, b, small')) p.classList.add('review-only');
    });
  };
  /* Header trang: tối đa 1 nút chính + 2 nút phụ; phần còn lại vào menu "Thêm". Cột thao tác bảng: >2 nút → "⋯". */
  function toMenuItem(el) {
    el.classList.remove('btn', 'btn-sm', 'btn-xs', 'btn-lg', 'btn-ghost', 'btn-soft', 'btn-icon');
    if (el.classList.contains('btn-danger')) { el.classList.remove('btn-danger'); el.classList.add('is-danger'); }
    el.classList.add('menu-item');
    el.setAttribute('role', 'menuitem');
    return el;
  }
  function makeMenu(items, label, iconOnly) {
    var wrap = document.createElement('div');
    wrap.className = 'action-menu';
    wrap.innerHTML = '<button type="button" class="btn' + (iconOnly ? ' btn-sm btn-ghost btn-icon' : '') + '" data-act="amenu.toggle" aria-haspopup="menu" aria-expanded="false"' + (iconOnly ? ' aria-label="' + esc(label) + '" data-tip="' + esc(label) + '"' : '') + '>' + (iconOnly ? I('more', 'ic-sm') : esc(label) + I('chevronDown', 'ic-sm')) + '</button><div class="action-pop" role="menu" hidden></div>';
    var pop = wrap.querySelector('.action-pop');
    items.forEach(function (el) { pop.appendChild(toMenuItem(el)); });
    return wrap;
  }
  var ACT_SEL = '.btn, .gate-inline, .forbidden-chip';
  TH.compactActions = function (root) {
    if (!root) return;
    root.querySelectorAll('.page-actions').forEach(function (box) {
      var items = Array.prototype.filter.call(box.children, function (el) { return el.matches(ACT_SEL) && !el.closest('.action-menu'); });
      if (items.length <= 3) return;
      var prim = items.filter(function (el) { return el.classList.contains('btn-primary'); }).slice(0, 1);
      var rest = items.filter(function (el) { return prim.indexOf(el) === -1; });
      var keep = rest.slice(0, 2), more = rest.slice(2);
      if (!more.length) return;
      var menu = makeMenu(more, 'Thêm', false);
      box.appendChild(menu);
      prim.forEach(function (el) { box.appendChild(el); }); // nút chính luôn ở cuối bên phải
    });
    root.querySelectorAll('td.col-act, .table .row-actions').forEach(function (cell) {
      var host = cell.querySelector('.row-actions, .row') || cell;
      var items = Array.prototype.filter.call(host.children, function (el) { return el.matches(ACT_SEL); });
      if (items.length <= 2) return;
      host.appendChild(makeMenu(items.slice(1), 'Thao tác khác', true));
    });
  };
  /* Nút chỉ có icon phải có tên truy cập */
  TH.a11yIconButtons = function (root) {
    if (!root) return;
    root.querySelectorAll('button, a.btn').forEach(function (b) {
      if (b.getAttribute('aria-label') || b.textContent.trim()) return;
      var name = b.getAttribute('data-tip') || b.getAttribute('title') || '';
      if (name) b.setAttribute('aria-label', TH.cleanCodes(name));
    });
  };
  /* Dải thông tin chính ở đầu trang chi tiết: [[nhãn, html], …] */
  TH.detailFacts = function (pairs) {
    var list = (pairs || []).filter(function (p) { return p && p[1] !== undefined && p[1] !== null && p[1] !== ''; });
    return list.length ? '<dl class="detail-facts">' + list.map(function (p) { return '<div><dt>' + esc(p[0]) + '</dt><dd>' + p[1] + '</dd></div>'; }).join('') + '</dl>' : '';
  };
  /* Gom ≥ 2 khối gate khóa gói liền nhau trong cùng cột dọc (.stack) thành 1 thẻ liệt kê ngắn —
     tránh cột phụ toàn khung mờ. Lưới nhiều cột giữ nguyên để không để lại ô trống. Nút vẫn mang data-locked. */
  TH.gateGroup = function (root) {
    (root || document).querySelectorAll('.stack > .gate-locked').forEach(function (g) {
      if (!g.isConnected) return;
      var prev = g.previousElementSibling;
      if (prev && prev.classList.contains('gate-locked')) return;
      var run = [g], x = g.nextElementSibling;
      while (x && x.classList.contains('gate-locked')) { run.push(x); x = x.nextElementSibling; }
      if (run.length < 2) return;
      var items = run.map(function (el) {
        var c = el.querySelector('.gate-cover'), t = el.querySelector('.gate-label .t');
        return c ? '<button type="button" class="menu-item gate-group-item" data-locked="' + esc(c.getAttribute('data-locked')) + '" data-tip="' + esc(c.getAttribute('aria-label') || '') + '">' +
          I('lock', 'ic-sm') + '<span>' + esc(t ? t.textContent : '') + '</span>' + I('chevronRight', 'ic-sm') + '</button>' : '';
      }).join('');
      var box = document.createElement('div');
      box.className = 'card gate-group';
      box.innerHTML = '<div class="card-hd"><div><div class="card-title">' + I('lock', 'ic-sm') + 'Tính năng của gói cao hơn</div><div class="card-sub">' + run.length + ' mục · chọn để xem gói mở khóa</div></div></div><div class="gate-group-list">' + items + '</div>';
      g.parentNode.insertBefore(box, g);
      run.forEach(function (el) { el.remove(); });
    });
  };
  /* CR-UI-ENT — breadcrumb kiểu PageContainer: nhóm có nhiều mục để crumbs rỗng (navigation.js),
     nên sinh "Nhóm / Mục đang chọn" từ thanh mục của nhóm. */
  TH.pageCrumbs = function (root) {
    var view = root && root.id === 'view' ? root : document.getElementById('view');
    if (!view) return;
    var cr = view.querySelector(':scope > .page-hd .crumbs'), cap = view.querySelector(':scope > .workspace-navigation .workspace-caption span');
    if (!cr || !cap || cr.children.length) return;
    var cur = view.querySelector(':scope > .workspace-navigation .workspace-tabs a[aria-current="page"]'), home = document.querySelector('#nav a[aria-current="page"]');
    cr.innerHTML = (home ? '<a href="' + esc(home.getAttribute('href')) + '">' + esc(cap.textContent) + '</a>' : '<span>' + esc(cap.textContent) + '</span>') +
      (cur ? I('chevronRight') + '<span>' + esc(cur.textContent) + '</span>' : '');
  };
  TH.uiPolish = function (root) { TH.gateGroup(root); TH.pageCrumbs(root); TH.reviewFilter(root); TH.compactActions(root); TH.a11yIconButtons(root); };
  /* Menu thao tác: mở/đóng, phím Escape, click ngoài */
  function closeMenus(except) {
    document.querySelectorAll('.action-menu .action-pop:not([hidden])').forEach(function (p) {
      if (except && except.contains(p)) return;
      p.hidden = true; var b = p.parentNode.querySelector('[data-act="amenu.toggle"]'); if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  TH.act = TH.act || {};
  TH.act['amenu.toggle'] = function (el) {
    var wrap = el.closest('.action-menu'), pop = wrap.querySelector('.action-pop'), open = pop.hidden;
    closeMenus(open ? wrap : null);
    pop.hidden = !open; el.setAttribute('aria-expanded', String(open));
    if (open) { var first = pop.querySelector('.menu-item:not([disabled])'); if (first) first.focus(); }
  };
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('.action-menu') : null;
    if (!t) closeMenus(null);
    else if (e.target.closest('.action-pop .menu-item')) setTimeout(function () { closeMenus(null); }, 0);
  });
  document.addEventListener('keydown', function (e) {
    var pop = e.target.closest ? e.target.closest('.action-pop') : null;
    if (e.key === 'Escape' && document.querySelector('.action-pop:not([hidden])')) {
      var openPop = document.querySelector('.action-pop:not([hidden])'), b = openPop.parentNode.querySelector('[data-act="amenu.toggle"]');
      closeMenus(null); if (b) b.focus(); e.stopPropagation();
    } else if (pop && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      var list = Array.prototype.slice.call(pop.querySelectorAll('.menu-item:not([disabled])')), i = list.indexOf(document.activeElement);
      var nx = list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length]; if (nx) { nx.focus(); e.preventDefault(); }
    }
  }, true);
})();
