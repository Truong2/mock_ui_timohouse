/* Công cụ QA trong demo (phản hồi TIMEHOUSE_MOCKUP_QA_ANSWERS.md — QA-P04, QA-P05, D-09):
   - Đếm riêng route / màn / popup / dialog / tab (không gộp thành một con số).
   - Smoke test chạy lại ngay trong trình duyệt: render mọi màn × biến thể tab × gói × kỳ, ghi log, tải về CSV.
   - RTM (Requirements Traceability Matrix): increment → gói → màn → vai trò → test → kết quả → trạng thái nghiệp vụ, xuất .xlsx.
   Đây là bằng chứng kỹ thuật (smoke), KHÔNG phải nghiệm thu nghiệp vụ hay kiểm tra 88 frame Figma. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt;
  var PKGS = ['A', 'B', 'C', 'D'], PERIODS = ['2026-09', '2026-10'];
  /* Mục còn chờ quyết định nghiệp vụ (Decision log + DECISIONS_ANSWERS): increment liên quan giữ trạng thái DRAFT/PROPOSED */
  var PENDING = { F010: 'K-01…K-04, K-08', F011: 'D-02', F012: 'D-02/K-05', F015: 'K-05', F016: 'K-06', F031: 'K-03/K-04', F038: 'K-01', F020: 'D-03', F023: 'D-03', F026: 'D-05', F027: 'D-05', F032: 'G-01/D-04', F033: 'G-01…G-03/D-04', F040: 'D-06', F041: 'D-06', F043: 'R-05/D-07', F044: 'R-08/D-07', F045: 'R-01…R-09', F046: 'R-01…R-09', F048: 'R-01/R-07', F004: 'G-05…G-07', F006: 'G-08', F036: 'G-10' };

  TH.qaCounts = function () {
    var srs = TH.SRS_SCREENS(), cr = TH.SCREENS.filter(function (s) { return s.cr; });
    var popups = Object.keys(TH.POPUP_BASE);
    var dialogs = 0, tabs = 0, variants = 0;
    TH.SCREENS.forEach(function (s) {
      var v = TH.views[s.id];
      if (!v) return;
      dialogs += (v.dialogs || []).length;
      var vs = v.scan ? v.scan() : [{}];
      variants += vs.length;
      tabs += vs.filter(function (x) { return x.ui && x.ui.tab; }).length;
    });
    return {
      route: TH.SCREENS.length + Object.keys(TH.EXTRA_ROUTES).length + 1, // màn + trang tiện ích (mục lục, mapping) + landing
      screenSrs: srs.length, screenCr: cr.length, popup: popups.length, dialog: dialogs, tab: tabs, variant: variants, figma: null,
    };
  };

  TH.qaSmoke = function () {
    var st = TH.store.state, t0 = Date.now();
    var saved = { pkg: st.pkg, period: st.period, role: st.role, ui: JSON.parse(JSON.stringify(st.ui)), drafts: JSON.parse(JSON.stringify(st.drafts)), notices: TH.notices.length, guard: TH.app.guard, editing: st.editing };
    var log = [], fails = [], by = {};
    st.role = 'admin'; st.editing = null;
    PKGS.forEach(function (pkg) {
      st.pkg = pkg;
      PERIODS.forEach(function (per) {
        st.period = per;
        TH.SCREENS.forEach(function (s) {
          var v = TH.views[s.id];
          if (!v) return;
          var kind = s.cr ? 'Màn CR' : TH.POPUP_BASE[s.id] ? 'Popup' : 'Màn SRS';
          (v.scan ? v.scan() : [{}]).forEach(function (patch) {
            st.ui = JSON.parse(JSON.stringify(saved.ui));
            if (patch.ui) st.ui[s.id] = Object.assign({}, st.ui[s.id], patch.ui);
            var cat = patch.ui && patch.ui.tab ? 'Tab chi tiết' : kind;
            var route = { screen: s.id, page: TH.POPUP_BASE[s.id] || s.id, base: TH.POPUP_BASE[s.id] || null, param: patch.param || v.scanParam || null };
            var res = 'PASS', note = '';
            try {
              var html = v.render(route) || '';
              if (/>[^<]*\b(undefined|NaN)\b[^<]*</.test(html)) { res = 'FAIL'; note = 'Chuỗi undefined/NaN trong nội dung'; }
              else if (html.length < 200) { res = 'FAIL'; note = 'Màn trống'; }
            } catch (e) { res = 'FAIL'; note = e.message; }
            var key = cat + '|' + pkg + '|' + per;
            by[key] = (by[key] || 0) + 1;
            var row = [pkg, per, cat, s.id, patch.ui ? JSON.stringify(patch.ui) : '', route.param || '', res, note];
            log.push(row); if (res === 'FAIL') fails.push(row);
          });
          (v.dialogs || []).forEach(function (fn, i) {
            var res = 'PASS', note = '';
            try { fn(); } catch (e) { res = 'FAIL'; note = e.message; }
            var key = 'Dialog|' + pkg + '|' + per;
            by[key] = (by[key] || 0) + 1;
            var row = [pkg, per, 'Dialog', s.id, 'dialog#' + (i + 1), '', res, note];
            log.push(row); if (res === 'FAIL') fails.push(row);
          });
        });
      });
    });
    st.pkg = saved.pkg; st.period = saved.period; st.role = saved.role; st.ui = saved.ui; st.drafts = saved.drafts; st.editing = saved.editing;
    TH.notices.length = saved.notices; TH.app.guard = saved.guard;
    TH._smoke = { at: new Date().toLocaleString('vi-VN'), ms: Date.now() - t0, total: log.length, fails: fails, by: by, log: log, schema: TH.DATA_SCHEMA };
    return TH._smoke;
  };

  function smokeTable(r) {
    var cats = ['Màn SRS', 'Màn CR', 'Popup', 'Tab chi tiết', 'Dialog'];
    var head = '<tr><th>Nhóm kiểm thử</th>' + PKGS.map(function (p) { return PERIODS.map(function (per) { return '<th class="num">' + p + ' · ' + F.period(per) + '</th>'; }).join(''); }).join('') + '<th class="num">Cộng</th></tr>';
    var body = cats.map(function (c) {
      var sum = 0;
      return '<tr><td>' + esc(c) + '</td>' + PKGS.map(function (p) { return PERIODS.map(function (per) { var n = r.by[c + '|' + p + '|' + per] || 0; sum += n; return '<td class="num tnum">' + n + '</td>'; }).join(''); }).join('') + '<td class="num tnum"><b>' + sum + '</b></td></tr>';
    }).join('');
    return '<div class="table-wrap"><table class="table table-compact"><thead>' + head + '</thead><tbody>' + body + '<tr><td><b>Tổng lượt</b></td><td colspan="' + (PKGS.length * PERIODS.length) + '"></td><td class="num tnum"><b>' + r.total + '</b></td></tr></tbody></table></div>';
  }

  TH.qaPanel = function () {
    var c = TH.qaCounts(), r = TH._smoke;
    var counts = TH.kv([
      ['route_count', c.route + ' <span class="small muted">(' + TH.SCREENS.length + ' màn + ' + Object.keys(TH.EXTRA_ROUTES).length + ' trang tiện ích + landing)</span>'],
      ['screen_count', c.screenSrs + ' màn SRS + ' + c.screenCr + ' màn CR <span class="small muted">(trong đó ' + c.popup + ' màn kiểu Popup)</span>'],
      ['dialog_count', c.dialog + ' dialog khai báo để quét'],
      ['tab_count', c.tab + ' biến thể tab · ' + c.variant + ' biến thể render'],
      ['figma_frame_count', '<span class="muted">Ngoài phạm vi bản HTML — chưa có checklist 88 frame Figma (QA-B04)</span>'],
    ]);
    var res = r ? '<div class="row" style="gap:8px;margin:8px 0">' + (r.fails.length ? TH.badge(r.fails.length + ' lỗi', 'danger', { icon: 'xCircle' }) : TH.badge('0 lỗi', 'success', { icon: 'checkCircle' })) + '<span class="small muted">' + r.total + ' lượt · ' + r.ms + ' ms · schema v' + r.schema + ' · ' + esc(r.at) + '</span></div>' + smokeTable(r) +
      (r.fails.length ? '<ul class="small">' + r.fails.slice(0, 10).map(function (f) { return '<li>' + esc(f.join(' · ')) + '</li>'; }).join('') + '</ul>' : '')
      : '<p class="small muted">Chưa chạy trong phiên này. Bấm “Chạy smoke test” để render lại toàn bộ màn × tab × dialog × 4 gói × 2 kỳ.</p>';
    return '<div class="grid-2" style="margin-bottom:16px"><div class="card">' + TH.cardHd(I('list', 'ic-sm') + 'Đếm phạm vi (tách riêng)', 'Trả lời QA-P05 — không gộp route, màn, dialog, tab, frame Figma') + '<div class="card-bd">' + counts + '</div></div>' +
      '<div class="card">' + TH.cardHd(I('activity', 'ic-sm') + 'Smoke test trong trình duyệt', 'Tái lập được, không cần cài Playwright (QA-P04)', '<button type="button" class="btn btn-sm btn-primary" data-act="qa.smoke">' + I('play', 'ic-sm') + 'Chạy smoke test</button>' + (r ? '<button type="button" class="btn btn-sm" data-act="qa.log">' + I('download', 'ic-sm') + 'Log (.csv)</button>' : '')) + '<div class="card-bd">' + res + '<p class="small muted">Smoke test chỉ chứng minh render không lỗi; không thay thế nghiệm thu nghiệp vụ, kiểm tra in/PDF, bàn phím, Firefox/Safari.</p></div></div></div>';
  };
  TH.act['qa.smoke'] = function () {
    var r = TH.qaSmoke();
    TH.app.refresh();
    TH.toast(r.fails.length ? 'Smoke test có lỗi' : 'Smoke test đạt', r.total + ' lượt render · ' + r.fails.length + ' lỗi', r.fails.length ? 'danger' : 'success');
  };
  TH.act['qa.log'] = function () {
    var r = TH._smoke;
    if (!r) return;
    TH.exportCsv('TIMEHOUSE_smoke_' + TH.TODAY, ['Gói', 'Kỳ', 'Nhóm', 'Màn', 'Biến thể', 'Tham số', 'Kết quả', 'Ghi chú'], r.log);
    TH.toast('Đã xuất log', r.total + ' dòng');
  };

  /* RTM — D-09 */
  TH.act['qa.rtm'] = function () {
    var rec = TH.scanMapping();
    var smoke = TH._smoke;
    var screenOk = function (id) { return !smoke || !smoke.fails.some(function (f) { return f[3] === id; }); };
    var roles = function (u) { return ['admin', 'accountant', 'manager', 'hr'].filter(function (r) { var a = TH.SCREEN_ACCESS[r]; return u === 'SYS-01' ? r === 'admin' : !a || a.indexOf(u) > -1; }).map(function (r) { return TH.ROLES[r].label; }).join(', '); };
    var rows = [];
    TH.FEATURES.forEach(function (f) {
      ['A', 'B', 'C', 'D'].forEach(function (k) {
        var id = f.id + '.' + k;
        var ui = k === 'A' ? f.ui.filter(function (u) { return TH.views[u]; }) : rec[id] ? Object.keys(rec[id]) : [];
        var crId = f.crKeys && f.crKeys.indexOf(k) > -1 ? ((f.crOf && f.crOf[k]) || f.cr) : '';
        var tech = ui.length ? (ui.every(screenOk) ? (smoke ? 'PASS (smoke)' : 'Gắn UI — chưa chạy smoke') : 'FAIL') : 'Chưa gắn UI';
        var biz = PENDING[f.id] ? 'DRAFT — chờ duyệt ' + PENDING[f.id] : crId ? 'PROPOSED — CR chờ PM duyệt' : 'Chưa UAT';
        rows.push([id, f.module, f.name, 'Gói ' + k, f[k], crId ? (f.srs || {})[k] || '' : '', crId, ui.join(', '), ui.map(function (u) { return '#/demo/' + u.toLowerCase(); }).join(' '), ui.length ? roles(ui[0]) : '', k === 'A' ? 'SMOKE-RENDER' : 'MAP-GATE + SMOKE-RENDER', tech, biz]);
      });
    });
    TH.exportXlsx('TIMEHOUSE_RTM_' + TH.TODAY, [{ name: 'RTM', title: 'Requirements Traceability Matrix — TIMEHOUSE mockup', note: 'Sinh tự động từ registry + quét mapping' + (smoke ? ' + smoke ' + smoke.at : ' (chưa chạy smoke test trong phiên)') + '. Kết quả kỹ thuật ≠ nghiệm thu nghiệp vụ (QA_ANSWERS §8).',
      columns: [{ label: 'Increment', width: 10 }, { label: 'Phân hệ', width: 18 }, { label: 'Chức năng', width: 28 }, { label: 'Gói', width: 7 }, { label: 'Mô tả hiện tại', width: 46 }, { label: 'SRS gốc (nếu CR)', width: 36 }, { label: 'CR', width: 11 }, { label: 'Màn (UI-ID)', width: 22 }, { label: 'Route', width: 30 }, { label: 'Vai trò mở được', width: 30 }, { label: 'Test case', width: 22 }, { label: 'Kết quả kỹ thuật', width: 20 }, { label: 'Trạng thái nghiệp vụ', width: 30 }],
      rows: rows }]);
    TH.toast('Đã xuất RTM', rows.length + ' dòng (52 nhóm × 4 gói)');
  };
})();
