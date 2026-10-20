/* DEMO-PKG-01 — Drawer cấu hình hiển thị gói, bảng so sánh 52 chức năng, mục lục 39 màn, kiểm đếm mapping. */
(function () {
  var I = TH.icon, esc = TH.esc;

  /* ---------- Drawer ---------- */
  TH.openPackageDrawer = function () {
    TH.modal.open({
      key: 'pkg', kind: 'drawer', z: 30,
      render: function () {
        var s = TH.store.state, r = TH.app.route || {}, sc = r.page ? TH.screen(r.screen || r.page) : null;
        var lvl = TH.store.level();
        var opts = TH.PKG_KEYS.map(function (k) {
          var p = TH.PACKAGES[k];
          return '<label class="pkg-opt"><input type="radio" name="pkg" value="' + k + '"' + (k === s.pkg ? ' checked' : '') + ' data-act-change="pkg.pick" aria-label="' + p.name + ' ' + p.price + '">' +
            '<span class="pkg-card"><span class="k">' + k + '</span><span><span class="nm">' + p.name + ' <span class="pr">' + p.price + '</span></span><span class="ds">' + p.mode + (k === s.pkg ? ' · Đang xem' : '') + '</span></span><span class="chk">' + I('check', 'ic-sm') + '</span></span></label>';
        }).join('');
        var here = sc ? '<div><div class="section-title">Trên màn đang xem · ' + esc(sc.id) + '</div><div class="screen-incs">' + TH.PKG_KEYS.map(function (k) {
          var on = lvl >= TH.PACKAGES[k].level;
          return '<div class="screen-inc' + (on ? '' : ' is-off') + '">' + TH.tierPill(k) + '<span>' + (on ? '' : I('lock', 'ic-sm') + ' ') + esc(sc.notes[k]) + '</span></div>';
        }).join('') + '</div></div>' : '';
        return {
          title: 'Cấu hình hiển thị gói',
          sub: '<span class="screen-id">DEMO-PKG-01</span> · UX PROPOSED — chỉ dùng cho prototype',
          body: '<div class="stack">' +
            '<div class="alert alert-warning">' + I('info', 'ic-sm') + '<div class="alert-body">Đây là chế độ xem phạm vi báo giá, không thay đổi quyền, dữ liệu hoặc gói thanh toán. Giá hiển thị thống nhất với cấu hình demo, <b>chưa đối chiếu Excel báo giá gốc</b> (QA-B01).</div></div>' +
            '<fieldset style="border:0;margin:0;padding:0"><legend class="section-title">Chọn gói A / B / C / D</legend><div class="pkg-options">' + opts + '</div></fieldset>' +
            '<label class="switch"><input type="checkbox" data-act-change="pkg.locked"' + (s.showLocked ? ' checked' : '') + '><span class="switch-track"></span><span><b>Hiện tính năng gói cao hơn dưới dạng khóa</b><br><span class="small muted">Tắt để ẩn toàn bộ phần nâng cấp vượt gói. Phần lõi A luôn hiển thị.</span></span></label>' +
            '<button type="button" class="btn" data-act="pkg.compare" style="justify-content:flex-start">' + I('compare') + 'So sánh 52 chức năng<span style="margin-left:auto" class="muted small">bảng rộng</span></button>' +
            bldPack(lvl) +
            cusPack(lvl) +
            reportPack(lvl) +
            here +
            '<div><div class="section-title">Liên kết gửi khách</div><div class="copy-field"><label class="sr-only" for="pkg-link">Deep link</label><input id="pkg-link" class="input input-sm" readonly value="' + esc(TH.store.deepLink()) + '"><button type="button" class="btn btn-sm" data-act="pkg.copy">' + I('copy', 'ic-sm') + 'Chép</button></div><div class="field-hint" style="margin-top:6px"><code>?previewPackage=' + s.pkg + '</code> là [UX PROPOSED], không phải route/API production.</div></div>' +
            '</div>',
          foot: '<button type="button" class="btn" data-close>Đóng</button><span class="spacer"></span><button type="button" class="btn btn-primary" data-act="pkg.full"' + (s.pkg === 'D' ? ' disabled' : '') + '>' + I('layers', 'ic-sm') + 'Xem toàn bộ gói</button>',
        };
      },
    });
  };
  /* Hồ sơ chủ nhà & tòa trong từng gói (CR-BLD-01) */
  function bldPack(lvl) {
    return '<div><div class="section-title">Hồ sơ chủ nhà & tòa trong gói <span class="badge badge-info" data-tip="' + esc(TH.CR_BLD.title + ' · ' + TH.CR_BLD.id) + '">CR</span></div><div class="rpt-pack">' + TH.PKG_KEYS.map(function (k) {
      var on = lvl >= TH.PACKAGES[k].level, rp = TH.BLD_PACK[k];
      return '<div class="rpt-pack-row' + (on ? '' : ' is-off') + '">' + TH.tierPill(k, { plus: k !== 'A' }) + '<div><b class="small rpt-pack-hd">' + (on ? '' : I('lock', 'ic-sm')) + esc(rp.head) + '</b><ul>' + rp.items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div></div>';
    }).join('') + '</div><div class="row" style="margin-top:8px;gap:8px"><a class="btn btn-sm" href="' + TH.router.href('OWN-02', 'CN-001') + '" data-close>' + I('owner', 'ic-sm') + 'Hồ sơ chủ nhà</a><a class="btn btn-sm" href="' + TH.router.href('BLD-02', 'TH-CG') + '" data-close>' + I('building', 'ic-sm') + 'Hồ sơ tòa</a></div></div>';
  }
  /* Hồ sơ khách thuê trong từng gói (CR-CUS-01) */
  function cusPack(lvl) {
    return '<div><div class="section-title">Hồ sơ khách thuê trong gói <span class="badge badge-info" data-tip="' + esc(TH.CR_CUS.title + ' · ' + TH.CR_CUS.id) + '">CR</span></div><div class="rpt-pack">' + TH.PKG_KEYS.map(function (k) {
      var on = lvl >= TH.PACKAGES[k].level, rp = TH.CUS_PACK[k];
      return '<div class="rpt-pack-row' + (on ? '' : ' is-off') + '">' + TH.tierPill(k, { plus: k !== 'A' }) + '<div><b class="small rpt-pack-hd">' + (on ? '' : I('lock', 'ic-sm')) + esc(rp.head) + '</b><ul>' + rp.items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div></div>';
    }).join('') + '</div><div class="row" style="margin-top:8px;gap:8px"><a class="btn btn-sm" href="' + TH.router.href('CUS-01') + '" data-close>' + I('users', 'ic-sm') + 'Danh sách khách</a><a class="btn btn-sm" href="' + TH.router.href('CUS-02', 'KH-008') + '" data-close>' + I('user', 'ic-sm') + 'Hồ sơ DD-102</a></div></div>';
  }
  /* Báo cáo theo mẫu khách có trong từng gói (CR-RPT-01) */
  function reportPack(lvl) {
    return '<div><div class="section-title">Báo cáo theo mẫu khách trong gói <span class="badge badge-info" data-tip="' + esc(TH.CR_RPT.title + ' · ' + TH.CR_RPT.id) + '">CR</span></div><div class="rpt-pack">' + TH.PKG_KEYS.map(function (k) {
      var on = lvl >= TH.PACKAGES[k].level, rp = TH.REPORT_PACK[k];
      return '<div class="rpt-pack-row' + (on ? '' : ' is-off') + '">' + TH.tierPill(k, { plus: k !== 'A' }) + '<div><b class="small rpt-pack-hd">' + (on ? '' : I('lock', 'ic-sm')) + esc(rp.head) + '</b><ul>' + rp.items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div></div>';
    }).join('') + '</div><div class="row" style="margin-top:8px;gap:8px"><a class="btn btn-sm" href="' + TH.router.href('RPT-04') + '" data-close>' + I('building', 'ic-sm') + 'Doanh thu theo tòa</a><a class="btn btn-sm" href="' + TH.router.href('RPT-05') + '" data-close>' + I('chart', 'ic-sm') + 'Báo cáo kinh doanh</a></div></div>';
  }
  TH.onChange['pkg.pick'] = function (el) { TH.app.setPackage(el.value).then(function (ok) { if (!ok) TH.modal.rerenderAll(); }); };
  TH.onChange['pkg.locked'] = function (el) {
    TH.store.set('showLocked', el.checked);
    TH.app.refresh();
    TH.toast(el.checked ? 'Hiện phần nâng cấp dưới dạng khóa' : 'Đã ẩn phần nâng cấp vượt gói', 'Phần lõi A vẫn hiển thị trên mọi màn.', 'info');
  };
  TH.act['pkg.full'] = function () { TH.app.setPackage('D'); };
  TH.act['pkg.copy'] = function () {
    var inp = document.getElementById('pkg-link');
    var done = function () { TH.toast('Đã chép liên kết', esc(inp.value), 'success'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(inp.value).then(done, function () { inp.select(); document.execCommand('copy'); done(); });
    else { inp.select(); document.execCommand('copy'); done(); }
  };

  /* ---------- So sánh 52 chức năng ---------- */
  var OPEN_HINT = { F003: 'C: “nếu chốt”', F011: 'D-02', F012: 'D-02', F020: 'D-03', F026: 'D-05', F027: 'D-05', F032: 'D-04', F033: 'D-06', F040: 'D-06', F043: 'D-07' };
  TH.act['pkg.compare'] = function () {
    TH.modal.open({
      key: 'compare', size: 'full', z: 35,
      render: function () {
        var q = TH.store.ui('CMP', 'q', ''), mod = TH.store.ui('CMP', 'mod', 'ALL'), only = TH.store.ui('CMP', 'only', 'all');
        var lvl = TH.store.level(), pkg = TH.store.state.pkg;
        var modules = [];
        TH.FEATURES.forEach(function (f) { if (modules.indexOf(f.module) === -1) modules.push(f.module); });
        var rows = TH.FEATURES.filter(function (f) {
          return (mod === 'ALL' || f.module === mod) && TH.match(q, [f.id, f.name, f.module, f.A, f.B, f.C, f.D]) &&
            (only === 'all' || (only === 'up' && lvl < 4));
        });
        var cell = function (f, k) {
          var on = lvl >= TH.PACKAGES[k].level;
          var tag = k === 'A' ? 'Có trong gói' : on ? 'Có trong gói' : 'Có từ ' + k;
          var crId = (f.crOf && f.crOf[k]) || f.cr, cr = f.crKeys && f.crKeys.indexOf(k) > -1 ? ' <span class="badge badge-info" data-tip="' + esc('Cập nhật ' + crId + '. SRS gốc: ' + f.srs[k]) + '">CR</span>' : '';
          return '<td class="cmp-cell ' + (on ? 'is-in' : 'is-out') + '"><div class="cmp-mark">' + TH.tierPill(k, { plus: k !== 'A' }) + ' ' + (on ? TH.badge(tag, 'success', { icon: 'check' }) : TH.badge(tag, 'neutral', { icon: 'lock' })) + cr + '</div><div>' + esc(f[k]) + '</div></td>';
        };
        var body = '', lastMod = null;
        rows.forEach(function (f) {
          if (f.module !== lastMod) { body += '<tr class="is-module"><td colspan="7">' + esc(f.module) + '</td></tr>'; lastMod = f.module; }
          body += '<tr><td class="nowrap"><b class="mono">' + f.id + '</b></td><td style="min-width:200px"><div class="cell-main">' + esc(f.name) + '</div>' +
            '<div class="cell-sub" style="margin-top:4px"><b>UAT:</b> ' + esc(f.uat) + '</div>' +
            (f.cr ? '<div style="margin-top:6px">' + TH.badge((TH.CRS[f.cr] || { title: 'Cập nhật' }).title + ' · ' + f.cr, 'info', { tip: 'Bổ sung 20/10/2026. Nội dung SRS gốc xem ở tooltip từng ô CR.' }) + '</div>' : '') +
            (f.limit || OPEN_HINT[f.id] ? '<div style="margin-top:6px">' + TH.badge('Chưa chốt quy tắc' + (OPEN_HINT[f.id] ? ' · ' + OPEN_HINT[f.id] : ''), 'draft', { tip: f.limit || 'Xem Decision Log §7' }) + '</div>' : '') + '</td>' +
            cell(f, 'A') + cell(f, 'B') + cell(f, 'C') + cell(f, 'D') +
            '<td style="min-width:120px">' + f.ui.map(function (u) { return '<a class="screen-id" style="display:inline-block;margin:0 4px 4px 0" href="' + TH.router.href(u) + '" data-close>' + u + '</a>'; }).join('') + '</td></tr>';
        });
        var chipOpts = [{ id: 'ALL', label: 'Tất cả phân hệ', count: TH.FEATURES.length }].concat(modules.map(function (m) { return { id: m, label: m.replace(/^\d+\.\s*/, ''), count: TH.FEATURES.filter(function (f) { return f.module === m; }).length }; }));
        return {
          title: I('compare') + ' So sánh 52 chức năng theo gói',
          sub: 'Nguồn SRS §5A (1:1 với sheet A_50_60 … D_90_100). Đang xem <b>' + TH.PACKAGES[pkg].name + ' · ' + TH.PACKAGES[pkg].price + '</b>. A = lõi, B+/C+/D+ = phần nâng cấp cộng dồn.',
          headExtra: '<div class="seg">' + TH.PKG_KEYS.map(function (k) { return '<button type="button" aria-pressed="' + (k === pkg) + '" data-act="pkg.seg" data-pkg="' + k + '">' + k + '</button>'; }).join('') + '</div>',
          flush: true,
          body: '<div class="toolbar" style="position:sticky;top:0;background:#fff;z-index:5">' + TH.searchBox('CMP', 'Tìm mã/tên chức năng, ví dụ F012 hoặc OCR…') + '<span class="small muted tnum">' + rows.length + ' / 52 dòng</span></div>' +
            '<div class="toolbar" style="gap:6px">' + TH.chips('CMP', 'mod', chipOpts, mod) + '</div>' +
            '<div class="table-wrap"><table class="table cmp-table"><thead><tr><th>Mã</th><th>Nhóm / chức năng</th><th>A · 50–60</th><th>B · thêm</th><th>C · thêm</th><th>D · thêm</th><th>UI-ID</th></tr></thead><tbody>' +
            (body || '<tr><td colspan="7">' + TH.state('empty', { title: 'Không có chức năng khớp', text: 'Bộ lọc không ẩn phân hệ — thử từ khóa khác.' }) + '</td></tr>') + '</tbody></table></div>',
          foot: '<span class="small muted">Legend: ' + TH.badge('Có trong gói', 'success', { icon: 'check' }) + ' ' + TH.badge('Có từ C', 'neutral', { icon: 'lock' }) + ' ' + TH.badge('Chưa chốt quy tắc', 'draft') + '</span><span class="spacer"></span><button type="button" class="btn" data-close>Đóng</button>',
        };
      },
    });
  };
  TH.act['pkg.seg'] = function (el) { TH.app.setPackage(el.dataset.pkg); };

  /* ---------- Mục lục 39 màn ---------- */
  TH.views.screens = {
    render: function () {
      var groups = {};
      TH.SRS_SCREENS().forEach(function (s) { (groups[s.module] = groups[s.module] || []).push(s); });
      var crCards = TH.SCREENS.filter(function (s) { return s.cr; }).map(function (s) {
        return '<a class="screen-card" href="' + TH.router.href(s.id) + '"><div class="row-between"><span class="screen-id">' + s.id + '</span><span class="small muted">' + esc(s.cr) + '</span></div><div class="t">' + esc(s.title) + '</div><div class="m">Mẫu: ' + esc(s.template) + '</div></a>';
      }).join('');
      return '<div class="page-hd"><div><nav class="crumbs"><span>Công cụ demo</span></nav><h1 class="page-title">Mục lục 39 màn / luồng</h1><p class="page-desc">Danh mục Screen ID theo SRS §4. Màn kiểu <b>Popup</b> mở dạng dialog/workspace phủ trên màn gốc; tất cả có deep link và giữ gói đang xem.</p></div>' +
        '<div class="page-actions">' + TH.badge('39 màn production', 'teal') + TH.badge('+2 báo cáo ' + TH.CR_RPT.id, 'info') + TH.badge('+1 DEMO-PKG-01', 'neutral') + '</div></div>' +
        Object.keys(groups).map(function (m) {
          return '<div style="margin-bottom:20px"><div class="section-title">' + esc(m) + '</div><div class="screen-grid">' + groups[m].map(function (s) {
            return '<a class="screen-card" href="' + TH.router.href(s.id) + '"><div class="row-between"><span class="screen-id">' + s.id + '</span><span class="small muted">#' + s.no + ' · ' + esc(s.kind) + '</span></div><div class="t">' + esc(s.title) + '</div><div class="m">A: ' + esc(s.notes.A) + '</div></a>';
          }).join('') + '</div></div>';
        }).join('') +
        '<div style="margin-bottom:20px"><div class="section-title">Báo cáo bổ sung theo mẫu khách · ' + esc(TH.CR_RPT.id) + '</div><div class="screen-grid">' + crCards + '</div></div>' +
        '<div class="section-title">Surface trình diễn</div><div class="screen-grid"><a class="screen-card" href="#" data-act="pkg.open"><div class="row-between"><span class="screen-id">DEMO-PKG-01</span><span class="small muted">#40 · UX DEMO ONLY</span></div><div class="t">Cấu hình hiển thị gói A–B–C–D</div><div class="m">Drawer + bảng so sánh 52 chức năng</div></a>' +
        '<a class="screen-card" href="#/"><div class="row-between"><span class="screen-id">LANDING</span><span class="small muted">Đề xuất trình bày</span></div><div class="t">Trang giới thiệu</div><div class="m">Không thuộc 39 màn nghiệp vụ</div></a></div>';
    },
  };

  /* ---------- Kiểm đếm mapping (quét render toàn bộ màn) ---------- */
  TH.scanMapping = function () {
    var rec = {}, st = TH.store.state;
    var saved = { ui: JSON.parse(JSON.stringify(st.ui)), drafts: JSON.parse(JSON.stringify(st.drafts)), notices: TH.notices.length, guard: TH.app.guard };
    TH._rec = function (inc) { (rec[inc] = rec[inc] || {})[TH._scanScreen] = 1; };
    TH.SCREENS.forEach(function (s) {
      var v = TH.views[s.id];
      if (!v) return;
      TH._scanScreen = s.id;
      var variants = v.scan ? v.scan() : [{}];
      variants.forEach(function (patch) {
        st.ui = JSON.parse(JSON.stringify(saved.ui));
        if (patch.ui) st.ui[s.id] = Object.assign({}, st.ui[s.id], patch.ui);
        var route = { screen: s.id, page: TH.POPUP_BASE[s.id] || s.id, base: TH.POPUP_BASE[s.id] || null, param: patch.param || v.scanParam || null };
        try { v.render(route); } catch (e) { console.warn('scan', s.id, e); }
      });
      (v.dialogs || []).forEach(function (fn) { try { fn(); } catch (e) { console.warn('scan dialog', s.id, e); } });
    });
    TH._rec = null;
    st.ui = saved.ui; st.drafts = saved.drafts; TH.notices.length = saved.notices; TH.app.guard = saved.guard;
    return rec;
  };
  TH.views.mapping = {
    render: function () {
      var rec = TH.scanMapping();
      var total = 0, covered = 0, missing = [];
      var rows = TH.FEATURES.map(function (f) {
        var cells = ['B', 'C', 'D'].map(function (k) {
          var id = f.id + '.' + k, where = rec[id] ? Object.keys(rec[id]) : [];
          total++;
          if (where.length) covered++; else missing.push(id);
          return '<td>' + (where.length ? TH.badge(where.length + ' màn', 'success', { icon: 'check' }) + '<div class="cell-sub" style="margin-top:4px">' + where.join(', ') + '</div>' : TH.badge('Chưa gắn', 'danger', { icon: 'x' })) + '</td>';
        }).join('');
        var screensA = f.ui.filter(function (u) { return TH.views[u]; });
        return '<tr><td><b class="mono">' + f.id + '</b></td><td><div class="cell-main">' + esc(f.name) + '</div><div class="cell-sub">' + esc(f.module) + '</div></td><td>' + TH.badge('Lõi A · ' + screensA.length + '/' + f.ui.length + ' màn', screensA.length === f.ui.length ? 'teal' : 'warning') + '</td>' + cells + '</tr>';
      }).join('');
      var screensDone = TH.SRS_SCREENS().filter(function (s) { return TH.views[s.id]; }).length;
      var crDone = TH.SCREENS.filter(function (s) { return s.cr && TH.views[s.id]; }).map(function (s) { return s.id; });
      return '<div class="page-hd"><div><nav class="crumbs"><span>Công cụ demo</span></nav><h1 class="page-title">Kiểm đếm mapping gói</h1><p class="page-desc">Quét render toàn bộ màn (kể cả tab/dialog khai báo) và ghi lại nơi mỗi increment B/C/D được gắn gate. Nguồn: SRS §5A' + (crDone.length ? ' + ' + esc(TH.CR_RPT.id) + ' (' + crDone.join(', ') + ' cũng được quét)' : '') + ' · ' + esc(TH.CR_BLD.id) + ' cập nhật nội dung OWN/BLD, F033, F036; ' + esc(TH.CR_CUS.id) + ' cập nhật CUS-01/02, F010, F012, F015, F016, F031 (cùng 39 màn).</p></div><div class="page-actions">' + TH.exportBtn('qa.rtm', 'Xuất RTM (.xlsx)') + '</div></div>' +
        '<div class="grid-4" style="margin-bottom:16px">' +
        TH.kpi({ label: 'Màn đã dựng', value: screensDone + '<small>/ 39</small>', icon: 'grid' }) +
        TH.kpi({ label: 'Nhóm chức năng', value: TH.FEATURES.length + '<small>/ 52</small>', icon: 'layers' }) +
        TH.kpi({ label: 'Increment B/C/D đã gắn', value: covered + '<small>/ ' + total + '</small>', icon: 'checkCircle' }) +
        TH.kpi({ label: 'Chưa gắn', value: String(missing.length), icon: 'alert', foot: missing.length ? esc(missing.slice(0, 8).join(', ')) + (missing.length > 8 ? '…' : '') : 'Đủ 100%' }) + '</div>' +
        (TH.qaPanel ? TH.qaPanel() : '') +
        '<div class="card card-flush"><div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Chức năng</th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    },
  };
})();
