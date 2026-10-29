/* Mẫu dùng chung: luồng import theo mẫu, workspace OCR soát–sửa–xác nhận, xuất file. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt;

  /* =========================================================
     IMPORT THEO MẪU (OWN-IMP / BLD-IMP / ROOM-IMP)
     cfg: { screen, kind, template, columns:[{key,label}], sample(): rows[{data, errors[], dup}],
            inc:{ preview, upsert, history }, commit(rows, policy) → n, backHref }
     ========================================================= */
  TH.importFlow = function (cfg) {
    if (TH._rec) [cfg.inc.preview, cfg.inc.upsert, cfg.inc.history].forEach(function (inc) { TH._rec(inc); });
    if (!TH.has(cfg.inc.preview)) return { title: 'Nhập Excel · ' + TH.screen(cfg.screen).title, body: '<p>Gói A nhập từng hồ sơ qua biểu mẫu. Nhập Excel và xem trước danh sách có từ gói B.</p>' + TH.gate(cfg.inc.preview, '', { mode: 'btn', label: 'Nhập Excel và xem trước' }), foot: '<button type="button" class="btn" data-close>Đóng</button>' };
    var S = cfg.screen, step = TH.store.ui(S, 'step', 'upload');
    var rows = cfg.sample();
    var policy = TH.store.ui(S, 'policy', 'skip');
    var hasPreview = TH.has(cfg.inc.preview), hasUpsert = TH.has(cfg.inc.upsert);
    var classify = function (r) {
      if (TH.store.ui(S, 'excluded', []).indexOf(r.line) >= 0) return 'skip';
      if (r.errors.length) return 'error';
      if (r.dup) return hasUpsert ? (policy === 'update' ? 'update' : 'skip') : 'error';
      return 'new';
    };
    var errText = function (r) {
      var e = r.errors.slice();
      if (r.dup && !hasUpsert) e.push('Mã đã tồn tại');
      return e.join('; ');
    };
    var counts = { new: 0, update: 0, skip: 0, error: 0 };
    rows.forEach(function (r) { counts[classify(r)]++; });

    var steps = '<div class="stepper u-mb-16">' + [['upload', 'Tải mẫu & chọn tệp'], ['check', hasPreview ? 'Xem trước & kiểm tra' : 'Kiểm tra lỗi dòng'], ['done', 'Kết quả']].map(function (s, i, arr) {
      var order = ['upload', 'check', 'done'], cur = order.indexOf(step), me = order.indexOf(s[0]);
      return '<div class="step ' + (me < cur ? 'is-done' : me === cur ? 'is-current' : '') + '"><span class="n">' + (me < cur ? '✓' : i + 1) + '</span>' + s[1] + '</div>' + (i < arr.length - 1 ? '<span class="step-line"></span>' : '');
    }).join('') + '</div>';

    var body, foot;
    if (step === 'upload') {
      body = steps + '<div class="grid-2">' +
        '<div class="stack"><div class="card"><div class="card-bd stack-sm"><div class="row u-gap-12">' + TH.fileOf(cfg.template) + '</div><div class="small muted">' + TH.tierPill('A') + ' Mẫu cố định duy nhất. Cột: ' + cfg.columns.map(function (c) { return esc(c.label); }).join(', ') + '.</div>' +
        '<div><button type="button" class="btn btn-sm" data-act="imp.template" data-screen="' + S + '">' + I('download', 'ic-sm') + 'Tải file mẫu (.xlsx)</button></div></div></div>' +
        '<div class="dropzone"><div class="state-ic state-empty" style="background:var(--primary-soft);color:var(--primary)">' + I('upload') + '</div><b>Chọn tệp Excel theo mẫu</b><span class="small">Bản demo dùng tệp mẫu có sẵn (mô phỏng), không tải tệp thật lên máy chủ.</span>' +
        '<button type="button" class="btn btn-primary btn-sm" data-act="imp.pick" data-screen="' + S + '">' + I('paperclip', 'ic-sm') + 'Dùng tệp mẫu “' + esc(cfg.sampleFile) + '”</button>' + TH.simBadge('Tệp mô phỏng') + '</div></div>' +
        '<div class="stack">' + TH.gate(cfg.inc.history, historyCard(cfg), { label: TH.inc(cfg.inc.history).text, lines: 4 }) + '</div></div>';
      foot = '<button type="button" class="btn" data-close>Đóng</button>';
    } else if (step === 'check') {
      var policyCtl = TH.gate(cfg.inc.upsert, '<div class="row u-gap-8"><span class="small strong">Dòng trùng mã ' + TH.up(cfg.inc.upsert) + '</span><div class="seg">' +
        [['skip', 'Bỏ qua'], ['update', 'Cập nhật bản ghi trùng']].map(function (o) { return '<button type="button" aria-pressed="' + (policy === o[0]) + '" data-act="ui.set" data-screen="' + S + '" data-key="policy" data-val="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>', { mode: 'btn', label: 'Chính sách xử lý dòng trùng', size: 'btn-sm' });
      var sum = '<div class="row u-gap-8">' + TH.badge(counts.new + ' dòng mới', 'success') + (counts.update ? TH.badge(counts.update + ' cập nhật', 'info') : '') + (counts.skip ? TH.badge(counts.skip + ' bỏ qua (trùng)', 'neutral') : '') + TH.badge(counts.error + ' dòng lỗi', counts.error ? 'danger' : 'neutral') + '</div>';
      if (hasPreview) {
        body = steps + '<div class="row-between u-mb-12">' + sum + policyCtl + '</div>' +
          '<div class="card card-flush">' + TH.table({
            compact: true, label: 'Xem trước import',
            cols: [{ key: 'include', label: 'Ghi dòng', render: function (r) { return '<input type="checkbox" aria-label="Ghi dòng ' + r.line + '" data-act-change="imp.include" data-screen="' + S + '" data-line="' + r.line + '"' + (TH.store.ui(S, 'excluded', []).indexOf(r.line) < 0 ? ' checked' : '') + '>'; } }, { key: 'line', label: 'Dòng', render: function (r) { return '<span class="tnum muted">' + r.line + '</span>'; } }].concat(cfg.columns.map(function (c) { return { key: c.key, label: c.label, num: c.num, render: function (r) { var v = r.data[c.key]; return v === '' || v === undefined ? '<span class="neg">(trống)</span>' : c.num ? F.num(v) : esc(v); } }; }))
              .concat([{ key: 'st', label: 'Kết quả', render: function (r) { var k = classify(r); return k === 'error' ? '<span class="row-flag neg">' + I('xCircle', 'ic-sm') + esc(errText(r)) + '</span>' : k === 'new' ? TH.badge('Hợp lệ · tạo mới', 'success') : k === 'update' ? TH.badge('Cập nhật theo mã', 'info') : TH.badge('Trùng · bỏ qua', 'neutral'); } }]),
            rows: rows,
            rowAttrs: function (r) { return classify(r) === 'error' ? 'class="u-row-alert"' : ''; },
          }) + '</div>' +
          '<div class="alert alert-neutral u-mt-12">' + I('info', 'ic-sm') + '<div class="alert-body">' + TH.tierPill('B') + ' Xem trước trước khi ghi: chưa có dữ liệu nào được ghi. Dòng lỗi không được ghi.</div></div>';
        foot = '<button type="button" class="btn" data-act="ui.set" data-screen="' + S + '" data-key="step" data-val="upload">' + I('arrowLeft', 'ic-sm') + 'Chọn lại tệp</button>' +
          (counts.error ? '<button type="button" class="btn" data-act="imp.errfile" data-screen="' + S + '">' + I('download', 'ic-sm') + 'Tải file lỗi (.xlsx)</button>' : '') +
          '<span class="spacer"></span><button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="imp.commit" data-screen="' + S + '">' + I('check', 'ic-sm') + 'Xác nhận ghi ' + (counts.new + counts.update) + ' dòng</button>';
      } else {
        body = steps + '<div class="alert alert-neutral u-mb-12">' + I('info', 'ic-sm') + '<div class="alert-body"><b>Gói A · import 1 mẫu cố định.</b> Hệ thống kiểm tra từng dòng khi nhập; dòng lỗi được báo và <b>không được ghi</b>. Xem trước toàn bộ trước khi ghi là nâng cấp B.</div></div>' +
          '<div class="card"><div class="card-hd"><div class="card-title">' + I('fileCheck', 'ic-sm') + esc(cfg.sampleFile) + '</div>' + sum + '</div><div class="card-bd">' +
          (counts.error ? '<div class="stack-sm">' + rows.filter(function (r) { return classify(r) === 'error'; }).map(function (r) { return '<div class="row-flag neg">' + I('xCircle', 'ic-sm') + 'Dòng ' + r.line + ': ' + esc(errText(r)) + '</div>'; }).join('') + '</div>' : '<span class="pos">Không có dòng lỗi.</span>') + '</div></div>' +
          '<div class="u-mt-12">' + TH.gate(cfg.inc.preview, '', { label: 'Xem trước toàn bộ trước khi ghi; tải file lỗi', lines: 3 }) + '</div>';
        foot = '<button type="button" class="btn" data-act="ui.set" data-screen="' + S + '" data-key="step" data-val="upload">' + I('arrowLeft', 'ic-sm') + 'Chọn lại tệp</button><span class="spacer"></span>' +
          '<button type="button" class="btn" data-close>Hủy</button><button type="button" class="btn btn-primary" data-act="imp.commit" data-screen="' + S + '">' + I('upload', 'ic-sm') + 'Nhập ' + counts.new + ' dòng hợp lệ</button>';
      }
    } else {
      var res = TH.store.ui(S, 'result', { written: 0, errors: 0, batch: '' });
      body = steps + '<div class="state state-empty" style="padding:28px"><div class="state-ic" style="background:var(--success-soft);color:var(--success)">' + I('checkCircle') + '</div><h3>Đã ghi ' + res.written + ' dòng</h3><p>' + (res.errors ? res.errors + ' dòng lỗi không được ghi. ' : '') + 'Danh sách đã cập nhật. Mã batch <span class="mono">' + esc(res.batch) + '</span>.</p></div>' +
        TH.gate(cfg.inc.history, '<div class="alert alert-neutral">' + I('history', 'ic-sm') + '<div class="alert-body">' + TH.tierPill('D') + ' Lô mới lưu ảnh trước/sau để khôi phục dữ liệu. Hoàn tác bị chặn nếu bản ghi đã được sửa hoặc có dữ liệu phụ thuộc. Đối chiếu: ' + rows.length + ' dòng nguồn = ' + res.written + ' ghi + ' + (rows.length - res.written) + ' không ghi.</div></div>', { label: TH.inc(cfg.inc.history).text, lines: 2 });
      foot = '<button type="button" class="btn" data-act="ui.set" data-screen="' + S + '" data-key="step" data-val="upload">Nhập tệp khác</button><span class="spacer"></span><button type="button" class="btn btn-primary" data-close>Xong</button>';
    }
    return { title: esc(TH.screen(S).title) + ' <span class="screen-id">' + S + '</span>', sub: 'Luồng phụ của ' + esc(TH.POPUP_BASE[S]) + ' · ' + esc(TH.screen(S).notes.A), body: body, foot: foot };
  };
  function historyCard(cfg) {
    var list = TH.db.importBatches.filter(function (b) { return b.kind === cfg.kind; });
    return '<div class="card"><div class="card-hd"><div class="card-title">' + I('history', 'ic-sm') + 'Lịch sử batch import ' + TH.up(cfg.inc.history) + '</div></div>' +
      TH.table({ compact: true, cols: [
        { key: 'id', label: 'Lô', render: function (b) { return '<span class="mono">' + b.id + '</span><div class="cell-sub">' + esc(b.file) + '</div>'; } },
        { kind: 'date', key: 'at', label: 'Thời điểm', render: function (b) { return F.date(b.at) + '<div class="cell-sub">' + esc(TH.calc.staffName(b.by)) + '</div>'; } },
        { key: 'ok', label: 'Ghi/Lỗi', num: true, render: function (b) { return '<span class="pos">' + b.ok + '</span> / <span class="' + (b.errors ? 'neg' : 'muted') + '">' + b.errors + '</span>'; } },
        { key: 'rb', label: '', render: function (b) { return b.status === 'rolledback' ? TH.badge('Đã rollback', 'neutral') : '<button type="button" class="btn btn-xs" data-act="imp.rollback" data-id="' + b.id + '">' + I('rotateCcw', 'ic-sm') + 'Hoàn tác</button>'; } },
      ], rows: list, empty: { title: 'Chưa có lô', text: 'Lô sẽ xuất hiện sau lần nhập đầu tiên.' } }) + '</div>';
  }
  var IMPORTS = {};
  TH.registerImport = function (cfg) { IMPORTS[cfg.screen] = cfg; };
  TH.act['imp.template'] = function (el) {
    var c = IMPORTS[el.dataset.screen];
    TH.exportXlsx(c.template, [{ name: 'Mau', title: 'TIMEHOUSE — ' + TH.screen(c.screen).title, note: 'Mẫu cố định (gói A). Không đổi tên/thứ tự cột.', columns: c.columns.map(function (x) { return { label: x.label, width: 22 }; }), rows: [] }]);
    TH.toast('Đã tải file mẫu', esc(c.template));
  };
  TH.act['imp.open'] = function (el) { TH.store.setUi(el.dataset.screen, 'step', 'upload'); TH.go(el.dataset.screen); };
  TH.act['imp.pick'] = function (el) { TH.store.setUi(el.dataset.screen, 'step', 'check'); TH.app.refresh(); };
  TH.act['imp.errfile'] = function (el) {
    var c = IMPORTS[el.dataset.screen];
    var rows = c.sample().filter(function (r) { return r.errors.length || (r.dup && !TH.has(c.inc.upsert)); });
    TH.exportXlsx(c.kind + '_loi_import', [{ name: 'Loi', title: 'Các dòng lỗi — ' + c.sampleFile, columns: [{ label: 'Dòng', width: 8 }].concat(c.columns.map(function (x) { return { label: x.label, width: 20 }; })).concat([{ label: 'Lỗi', width: 40 }]), rows: rows.map(function (r) { return [r.line].concat(c.columns.map(function (x) { return r.data[x.key]; })).concat([r.errors.concat(r.dup ? ['Mã đã tồn tại'] : []).join('; ')]); }) }]);
    TH.toast('Đã tải file lỗi', rows.length + ' dòng');
  };
  TH.act['imp.commit'] = function (el) {
    var c = IMPORTS[el.dataset.screen], S = c.screen;
    var hasUpsert = TH.has(c.inc.upsert), policy = TH.store.ui(S, 'policy', 'skip');
    var rows = c.sample();
    var ok = rows.filter(function (r) { return TH.store.ui(S, 'excluded', []).indexOf(r.line) < 0 && !r.errors.length && (!r.dup || (hasUpsert && policy === 'update')); });
    if (!ok.length) { TH.toast('Chưa có dòng để ghi', 'Chọn ít nhất một dòng hợp lệ.', 'warning'); return; }
    if (TH.recordActions) {
      var type = { 'OWN-IMP': 'owner', 'BLD-IMP': 'building', 'ROOM-IMP': 'room' }[S], denied = ok.find(function (row) {
        var id = type === 'room' ? TH.roomIdOf(row.data.b, row.data.code) : row.data.id, old = TH.recordActions.get(type, id);
        if (old) return !TH.recordActions.inspect(type, id, 'edit').allowed;
        if (type === 'owner') return TH.store.state.role === 'manager';
        if (type === 'building') return TH.store.state.role === 'manager' || !TH.calc.owner(row.data.ownerId || row.data.owner);
        var parent = TH.calc.building(row.data.b); return !parent || parent.status === 'inactive' || !TH.inScope(parent.id);
      });
      if (denied) { TH.toast('Chưa ghi lô nhập', 'Dòng ' + denied.line + ' không đủ quyền / ngoài phạm vi hoặc hồ sơ cha không hợp lệ. Bỏ dòng này rồi kiểm tra lại.', 'warning'); return; }
    }
    var written = c.commit(ok, policy);
    var id = TH.recordActions.id('IMP');
    TH.db.importBatches.unshift({ id: id, kind: c.kind, file: c.sampleFile, at: TH.TODAY + ' 10:00', by: TH.me().id, rows: rows.length, ok: written, errors: rows.length - ok.length, status: 'done' });
    TH.log('Import ' + c.kind, id, written + ' dòng ghi, ' + (rows.length - ok.length) + ' dòng không ghi', 'import');
    TH.store.setUi(S, 'result', { written: written, errors: rows.length - ok.length, batch: id });
    TH.store.setUi(S, 'step', 'done');
    TH.store.persist();
    TH.app.refresh();
    TH.toast('Đã nhập dữ liệu', written + ' dòng được ghi · batch ' + id);
  };
  TH.act['imp.rollback'] = function (el) {
    TH.confirm({ title: 'Hoàn tác lô ' + el.dataset.id + '?', body: '<p>Thao tác rollback có kiểm soát (mô phỏng): chỉ đánh dấu batch đã hoàn tác và ghi audit; dữ liệu demo không bị xóa.</p>', ok: 'Hoàn tác (mô phỏng)', danger: true }).then(function (ok) {
      if (!ok) return;
      var b = TH.db.importBatches.find(function (x) { return x.id === el.dataset.id; });
      b.status = 'rolledback';
      TH.log('Hoàn tác lô nhập', b.id, 'Mô phỏng', 'import');
      TH.store.persist(); TH.app.refresh();
      TH.toast('Đã rollback (mô phỏng)', 'Ghi audit cho batch ' + esc(b.id));
    });
  };

  /* =========================================================
     OCR WORKSPACE (OCR-CUS / OCR-CON)
     cfg: { screen, form, docTitle, docHtml(fields), fields:[{key,label,ocr,conf}], inc:{conf, tpl, match, log, lib},
            templates:[...], checks(): [{level, text}], confirm() , sideExtra }
     ========================================================= */
  TH.ocrWorkspace = function (cfg) {
    var S = cfg.screen, form = cfg.form;
    var active = TH.store.ui(S, 'active', cfg.fields[0].key);
    var showConf = TH.has(cfg.inc.conf);
    var tplId = TH.has(cfg.inc.tpl) ? TH.store.ui(S, 'tpl', cfg.templates[0].id) : cfg.templates[0].id;
    var confirmedCount = 0, edits = [], lastGroup = null;
    var fieldsHtml = cfg.fields.map(function (f) {
      var val = TH.store.draft(form, f.key, f.ocr);
      var ok = !!TH.store.draft(form, 'ok_' + f.key, false);
      if (ok) confirmedCount++;
      if (String(val) !== String(f.ocr)) edits.push({ f: f, val: val });
      var low = f.conf < 0.85;
      var id = 'ocr-' + S + '-' + f.key;
      var head = '';
      if (f.group && f.group !== lastGroup) { head = '<div class="ocr-group">' + esc(cfg.groups && cfg.groups[f.group] || f.group) + '</div>'; lastGroup = f.group; }
      return head + '<div class="ocr-field' + (active === f.key ? ' is-active' : '') + '"><label for="' + id + '">' + esc(f.label) + '</label>' +
        '<input id="' + id + '" class="input input-sm' + (showConf && low && !ok ? ' is-warn' : '') + '" value="' + esc(val) + '" data-draft="' + form + '.' + f.key + '" data-focus-field="' + f.key + '" data-screen="' + S + '" data-live' + (f.num ? ' inputmode="numeric"' : '') + '>' +
        '<div class="row u-gap-8 u-nowrap">' +
        (showConf ? '<span class="conf ' + (low ? 'conf-lo' : 'conf-hi') + '" data-tip="Độ tin cậy OCR (B): ' + F.pct(f.conf, 0) + (low ? ' — dưới ngưỡng 85%, cần soát kỹ' : '') + '">' + I(low ? 'alert' : 'checkCircle', 'ic-sm') + F.pct(f.conf, 0) + '</span>' : '') +
        '<label class="check" data-tip="Mỗi field phải được người dùng xác nhận (A)"><input type="checkbox" data-draft="' + form + '.ok_' + f.key + '"' + (ok ? ' checked' : '') + '><span class="small">Đúng</span></label></div></div>';
    }).join('');
    /* Bảng OCR (vd. tài sản bàn giao Điều 2.2): ô nhập từng dòng, dòng conf thấp tô cảnh báo, một ô "Bảng đúng" cho cả bảng tính là 1 mục */
    var tablesHtml = (cfg.tables || []).map(function (t) {
      var okT = !!TH.store.draft(form, 'ok_tbl_' + t.key, false);
      if (okT) confirmedCount++;
      var rows = t.rows.map(function (r, i) {
        var lowR = r.conf < 0.85;
        return '<tr' + (showConf && lowR && !okT ? ' class="is-warn"' : '') + '>' + t.columns.map(function (c) {
          var dk = 'tbl_' + t.key + '_' + i + '_' + c.key, val = TH.store.draft(form, dk, r[c.key]);
          if (!c.readonly && String(val) !== String(r[c.key])) edits.push({ f: { label: t.title + ' › ' + r.name + ' · ' + c.label, ocr: r[c.key] }, val: val });
          if (c.readonly) return '<td class="nw' + (active === dk ? ' is-active' : '') + '">' + esc(val) + '</td>';
          return '<td><input id="ocr-' + S + '-' + dk + '" class="input input-sm' + (c.num ? ' num' : '') + '" value="' + esc(val) + '" data-draft="' + form + '.' + dk + '" data-focus-field="' + dk + '" data-screen="' + S + '" data-live' + (c.num ? ' inputmode="numeric"' : '') + ' aria-label="' + esc(r.name + ' · ' + c.label) + '"></td>';
        }).join('') + (showConf ? '<td><span class="conf ' + (lowR ? 'conf-lo' : 'conf-hi') + '">' + F.pct(r.conf, 0) + '</span></td>' : '') + '</tr>';
      }).join('');
      return '<div class="ocr-table"><div class="row-between" style="margin:14px 0 6px"><b class="small">' + esc(t.title) + '</b><label class="check" data-tip="Xác nhận toàn bộ bảng sau khi soát từng dòng"><input type="checkbox" data-draft="' + form + '.ok_tbl_' + t.key + '"' + (okT ? ' checked' : '') + '><span class="small">Bảng đúng</span></label></div>' +
        '<div class="table-wrap"><table class="table table-compact"><thead><tr>' + t.columns.map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join('') + (showConf ? '<th>Tin cậy</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).join('');
    var totalItems = cfg.fields.length + (cfg.tables || []).length;
    var all = confirmedCount === totalItems;
    var checks = TH.has(cfg.inc.match) ? cfg.checks() : [];
    var hasBlocking = checks.some(function (c) { return c.level === 'danger'; }) && !TH.store.draft(form, 'ackMatch', false);
    TH.app.guard = edits.length ? { tier: 'B', dirty: true, label: 'Soát field OCR' } : null;

    var tplCtl = TH.gate(cfg.inc.tpl, '<label class="sr-only" for="ocr-tpl-' + S + '">Mẫu OCR</label><select id="ocr-tpl-' + S + '" class="select select-sm u-w-auto" data-ui="' + S + '.tpl">' + cfg.templates.filter(function (t) { return t.status === 'approved'; }).map(function (t) { return '<option value="' + t.id + '"' + (t.id === tplId ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + '</select>' + TH.up(cfg.inc.tpl), { mode: 'btn', label: 'Chọn mẫu thứ 2', size: 'btn-sm' });

    var left = '<div class="row-between u-mb-12"><div class="row u-gap-8"><span class="small strong row u-gap-6 u-nowrap">' + I('fileScan', 'ic-sm') + esc(cfg.docTitle) + '</span>' + TH.simBadge('Kết quả OCR mô phỏng') + '</div>' +
      '<div class="row u-gap-8"><span class="small muted">Mẫu:</span>' + (TH.has(cfg.inc.tpl) ? '' : '<span class="badge badge-teal">' + esc(cfg.templates[0].name) + '</span>') + tplCtl + '</div></div>' +
      '<div class="doc-page">' + cfg.docHtml(function (key, text) {
        var f = cfg.fields.find(function (x) { return x.key === key; });
        var cls = 'ocr-box' + (showConf && f && f.conf < 0.85 ? ' is-low' : '') + (active === key ? ' is-active' : '');
        return '<span class="' + cls + '" data-act="ocr.focus" data-screen="' + S + '" data-key="' + key + '" role="button" tabindex="0" title="' + esc(f ? f.label : key) + '">' + esc(text) + '</span>';
      }) + '</div>';

    var right = '<div class="stack">' +
      '<div class="row-between"><div><div class="card-title">Soát và xác nhận field</div><div class="small muted">' + confirmedCount + ' / ' + totalItems + ' mục đã xác nhận · dữ liệu chưa xác nhận không được lưu tự động</div></div>' +
      '<button type="button" class="btn btn-sm" data-act="ocr.all" data-screen="' + S + '" data-form="' + form + '">' + I('check', 'ic-sm') + 'Đánh dấu tất cả</button></div>' +
      '<div class="progress"><span style="width:' + (confirmedCount / totalItems * 100) + '%"></span></div>' +
      '<div>' + fieldsHtml + tablesHtml + '</div>' +
      (cfg.sideExtra ? cfg.sideExtra() : '') +
      TH.gate(cfg.inc.match, '<div class="card"><div class="card-hd"><div class="card-title">' + I('compare', 'ic-sm') + esc(cfg.matchTitle || 'Đối chiếu dữ liệu') + TH.up(cfg.inc.match) + '</div></div><div class="card-bd stack-sm">' +
        (checks.length ? checks.map(function (c) { return '<div class="alert alert-' + (c.level === 'danger' ? 'danger' : c.level === 'warning' ? 'warning' : 'success') + '">' + I(c.level === 'ok' ? 'checkCircle' : 'alert', 'ic-sm') + '<div class="alert-body">' + c.text + '</div></div>'; }).join('') : '') +
        (checks.some(function (c) { return c.level === 'danger'; }) ? '<label class="check"><input type="checkbox" data-draft="' + form + '.ackMatch"' + (TH.store.draft(form, 'ackMatch', false) ? ' checked' : '') + '><span class="small">Tôi đã kiểm tra cảnh báo lệch và chấp nhận xử lý thủ công</span></label>' : '') +
        '</div></div>', { label: TH.inc(cfg.inc.match).text, lines: 3 }) +
      TH.gate(cfg.inc.log, '<div class="card"><div class="card-hd"><div class="card-title">' + I('history', 'ic-sm') + 'Nhật ký sửa so với OCR' + TH.up(cfg.inc.log) + '</div></div><div class="card-bd">' +
        (edits.length ? '<ul class="timeline">' + edits.map(function (e) { return '<li><b>' + esc(e.f.label) + '</b>: <s class="muted">' + esc(e.f.ocr) + '</s> → <b>' + esc(e.val) + '</b><div class="when">' + esc(TH.me().name) + ' · ' + F.date(TH.TODAY) + ' · chưa lưu</div></li>'; }).join('') + '</ul>' : '<span class="small muted">Chưa có field nào sửa so với kết quả OCR.</span>') +
        '</div></div>', { label: TH.inc(cfg.inc.log).text, lines: 3 }) +
      '</div>';
    return {
      title: esc(TH.screen(S).title) + ' <span class="screen-id">' + S + '</span>',
      sub: 'Luồng phụ · ' + esc(TH.screen(S).notes.A) + ' · OCR không tự kích hoạt hợp đồng hay tạo hóa đơn',
      headExtra: '<button type="button" class="pkg-btn" data-act="pkg.open" style="height:32px">' + I('settings', 'ic-sm') + '<span class="pkg-key step-n-sm">' + TH.store.state.pkg + '</span>' + TH.PACKAGES[TH.store.state.pkg].price + '</button>',
      flush: true,
      body: '<div class="split"><div class="split-left">' + left + '</div><div class="split-right">' + right + '</div></div>',
      foot: '<span class="small muted">' + (all ? (hasBlocking ? I('alert', 'ic-sm') + ' Còn cảnh báo lệch chưa xử lý' : I('checkCircle', 'ic-sm') + ' Đủ điều kiện xác nhận') : 'Cần xác nhận đủ ' + totalItems + ' mục') + '</span><span class="spacer"></span>' +
        '<button type="button" class="btn" data-act="ocr.manual" data-form="' + form + '" data-screen="' + S + '">' + I('edit', 'ic-sm') + 'Nhập tay (fallback)</button>' +
        '<button type="button" class="btn" data-close>Lưu nháp & đóng</button>' +
        '<button type="button" class="btn btn-primary" data-act="' + cfg.confirmAct + '"' + (all && !hasBlocking ? '' : ' disabled') + '>' + I('check', 'ic-sm') + esc(cfg.confirmLabel) + '</button>',
    };
  };
  TH.act['ocr.focus'] = function (el) {
    TH.store.setUi(el.dataset.screen, 'active', el.dataset.key);
    TH.modal.rerenderAll();
    var inp = document.getElementById('ocr-' + el.dataset.screen + '-' + el.dataset.key);
    if (inp) { inp.focus(); inp.select(); }
  };
  TH.act['ocr.all'] = function (el) {
    var v = TH.views[el.dataset.screen];
    v.ocrFields().forEach(function (f) { TH.store.setDraft(el.dataset.form, 'ok_' + f.key, true); });
    (v.ocrTables ? v.ocrTables() : []).forEach(function (t) { TH.store.setDraft(el.dataset.form, 'ok_tbl_' + t.key, true); });
    TH.app.refresh();
  };
  TH.act['ocr.manual'] = function (el) {
    var v = TH.views[el.dataset.screen];
    v.ocrFields().forEach(function (f) { TH.store.setDraft(el.dataset.form, f.key, ''); TH.store.setDraft(el.dataset.form, 'ok_' + f.key, false); });
    (v.ocrTables ? v.ocrTables() : []).forEach(function (t) { TH.store.setDraft(el.dataset.form, 'ok_tbl_' + t.key, false); t.rows.forEach(function (r, i) { t.columns.forEach(function (c) { if (!c.readonly) TH.store.setDraft(el.dataset.form, 'tbl_' + t.key + '_' + i + '_' + c.key, ''); }); }); });
    TH.app.refresh();
    TH.toast('Chuyển sang nhập tay', 'Đã xóa giá trị OCR — nhập trực tiếp và xác nhận từng field.', 'info');
  };
  document.addEventListener('focusin', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.focusField && TH.store.ui(t.dataset.screen, 'active') !== t.dataset.focusField) {
      TH.store.setUi(t.dataset.screen, 'active', t.dataset.focusField);
      document.querySelectorAll('.ocr-box').forEach(function (b) { b.classList.toggle('is-active', b.dataset.key === t.dataset.focusField); });
      document.querySelectorAll('.ocr-field').forEach(function (b) { b.classList.toggle('is-active', b.querySelector('input') === t); });
    }
  });

  /* =========================================================
     Xuất file — nút ghi rõ định dạng
     ========================================================= */
  TH.exportBtn = function (act, label, extra) {
    return '<button type="button" class="btn" data-act="' + act + '"' + (extra || '') + '>' + I('download', 'ic-sm') + esc(label) + '</button>';
  };
  /* Tiêu đề card: phụ đề dài → icon ⓘ cạnh tiêu đề; ghi chú phạm vi gói ("Gói A: …") chỉ hiện ở chế độ review;
     nút ở đầu card → icon + tooltip (nút chính giữ chữ), quá 2 nút → menu ⋯ */
  TH.cardHd = function (title, sub, right) {
    var pkgNote = sub && /^Gói [A-D]\b/.test(TH.plainText(sub)), sh = pkgNote ? { sub: sub, hint: '' } : TH.subOrHint(sub);
    var nBtn = right ? (right.match(/class="(btn[ "]|gate-inline)/g) || []).length : 0;
    if (nBtn >= 1 && right.indexOf('data-action-group') < 0) right = TH.actionGroup({ context: 'card', html: right });
    return '<div class="card-hd"><div><div class="card-title">' + title + sh.hint + '</div>' + (sh.sub ? '<div class="card-sub' + (pkgNote ? ' review-only' : '') + '">' + sh.sub + '</div>' : '') + '</div>' + (right ? '<div class="row u-gap-8">' + right + '</div>' : '') + '</div>';
  };
  TH.scopeLabel = function () {
    var s = TH.scope();
    return (s === 'ALL' ? 'Tất cả tòa' : TH.calc.building(s).name) + ' · Kỳ ' + F.period(TH.store.state.period);
  };
  TH.buildingName = function (id) { var b = TH.calc.building(id); return b ? b.name : id; };
  TH.roomLink = function (id) { return '<a href="' + TH.router.href('ROOM-02', id) + '">' + esc(id) + '</a>'; };
  TH.periodLocked = function (p) { return !!(TH.db.periodLocks[p] && TH.db.periodLocks[p].locked); };
})();
