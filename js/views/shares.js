/* Cổ phần: SHARE-01 (bảng cổ phần theo tòa), SHARE-RESULT (phân bổ lợi nhuận). F042–F044. */
(function () {
  var I = TH.icon, esc = TH.esc, F = TH.fmt, C = TH.calc;
  var S = 'SHARE-01';

  function curBuilding() {
    var s = TH.scope();
    var b = TH.store.ui(S, 'b', s !== 'ALL' ? s : 'TH-CG');
    if (!TH.inScope(b)) b = TH.roleScope()[0];
    return b;
  }
  function editedShares(bId, p) {
    var form = 'shr-' + bId + '-' + p;
    return C.sharesFor(bId, p).map(function (s) {
      var r = TH.store.draft(form, s.id);
      return Object.assign({}, s, { ratio: r === undefined || r === '' ? s.ratio : +String(r).replace(',', '.'), dirty: r !== undefined && r !== '' && +r !== s.ratio });
    });
  }

  TH.views[S] = {
    render: function () {
      var p = TH.store.state.period, bId = curBuilding(), b = C.building(bId), form = 'shr-' + bId + '-' + p;
      var list = editedShares(bId, p), sum = C.sum(list, function (s) { return s.ratio; });
      var al = C.allocation(bId, p), base = al.base;
      var dirty = list.some(function (s) { return s.dirty; });
      var valid = Math.abs(sum - 100) < 0.001;
      var checkOn = TH.has('F042.C');
      var editable = TH.can('share.edit');
      TH.app.guard = dirty ? { tier: 'A', dirty: false, label: 'Điều chỉnh tỷ lệ' } : null;
      var table = TH.table({
        label: 'Bảng cổ phần ' + b.name,
        cols: [
          { key: 'h', label: 'Cổ đông', render: function (s) { var h = C.shareholder(s.shareholderId); return TH.personCell(h.name, esc(h.type + ' · ' + h.id)); } },
          { key: 'r', label: '% sở hữu', num: true, render: function (s) { return editable ? '<label class="sr-only" for="sr-' + s.id + '">Tỷ lệ</label><input id="sr-' + s.id + '" class="input-cell' + (s.dirty ? ' is-warn' : '') + '" style="max-width:90px" inputmode="decimal" value="' + s.ratio + '" data-draft="' + form + '.' + s.id + '" data-live>' : s.ratio + '%'; } },
          { kind: 'money', key: 'c', label: 'Vốn góp', num: true, render: function (s) { return F.money(s.capital); } },
          { key: 'e', label: 'Hiệu lực', render: function (s) { return 'Từ ' + F.date(s.from) + (s.to ? ' → ' + F.date(s.to) : ''); } },
          { kind: 'money', key: 'a', label: 'Lãi được chia (nháp)', num: true, render: function (s) { return base > 0 ? '<b>' + F.money(Math.floor(base * s.ratio / 100 / 1000) * 1000) + '</b>' : '<span class="muted small">Không chia</span>'; } },
        ],
        rows: list,
        foot: { _label: '<b>Tổng</b>', r: '<b class="' + (valid ? '' : 'neg') + '">' + Math.round(sum * 100) / 100 + '%</b>', c: '<b>' + F.money(C.sum(list, function (s) { return s.capital; })) + '</b>', a: base > 0 ? '<b>' + F.money(base) + '</b>' : '' },
      });
      var check = TH.gate('F042.C', '<div class="alert ' + (valid ? 'alert-success' : 'alert-danger') + '">' + I(valid ? 'checkCircle' : 'xCircle', 'ic-sm') + '<div class="alert-body"><b>Kiểm tổng tỷ lệ & hiệu lực ' + TH.up('F042.C') + '</b><span>' + (valid ? 'Tổng 100%, không có khoảng hiệu lực chồng lấn trong kỳ.' : 'Tổng ' + Math.round(sum * 100) / 100 + '% ≠ 100% — không thể lưu/duyệt kỳ.') + '</span></div></div>', { label: 'Kiểm tổng tỷ lệ 100% và thời hạn hiệu lực', lines: 1 });
      var hist = TH.db.shares.filter(function (s) { return s.buildingId === bId; });
      var snap = TH.gate('F042.D', '<div class="card">' + TH.cardHd(I('history', 'ic-sm') + 'Bản chốt tỷ lệ & lịch sử' + TH.up('F042.D')) + '<div class="card-bd"><ul class="timeline">' +
        hist.slice().sort(function (a, c) { return a.from < c.from ? 1 : -1; }).map(function (s) { return '<li><b>' + esc(C.shareholder(s.shareholderId).name) + '</b> ' + s.ratio + '%<div class="when">' + F.date(s.from) + (s.to ? ' → ' + F.date(s.to) + ' · đã kết thúc' : ' → nay') + '</div></li>'; }).join('') +
        '</ul><div class="small muted">' + (TH.periodLocked(p) ? 'Kỳ ' + F.period(p) + ' đã chốt — bản chốt tỷ lệ đã lưu.' : 'Bản chốt tỷ lệ được lưu khi chốt kỳ.') + '</div></div></div>', { label: 'Bản chốt tỷ lệ khi chốt kỳ; lịch sử thay đổi', lines: 4 });
      var bTabs = '<div class="toolbar">' + TH.chips(S, 'b', TH.db.buildings.filter(function (x) { return TH.inScope(x.id); }).map(function (x) { return { id: x.id, label: x.short }; }), bId) + '<span class="grow"></span>' +
        (dirty ? '<button type="button" class="btn btn-sm" data-act="shr.discard">Bỏ thay đổi</button>' + TH.permBtn('share.edit', '<button type="button" class="btn btn-sm btn-primary" data-act="shr.save"' + (checkOn && !valid ? ' disabled data-tip="Tổng tỷ lệ phải bằng 100% (C)"' : '') + '>' + I('check', 'ic-sm') + 'Lưu điều chỉnh tỷ lệ</button>', '403') : '<span class="small muted">' + (editable ? 'Sửa trực tiếp cột % để điều chỉnh tỷ lệ' : 'Chỉ xem') + '</span>') + '</div>';
      return TH.pageHeader({ screen: S, status: TH.badge('Phân bổ nháp', 'draft', { dot: true }), desc: 'Nhập tỷ lệ và vốn theo tòa/kỳ; lãi được chia tính nháp từ lãi dòng tiền tạm tính. Phân bổ không đồng nghĩa đã chi tiền.',
          actions: TH.gate('F042.B', TH.permBtn('share.edit', '<button type="button" class="btn" data-act="shr.import">' + I('upload', 'ic-sm') + 'Nhập từ Excel' + TH.up('F042.B') + '</button>', '403'), { mode: 'btn', label: 'Nhập từ Excel chia cổ phần' }) +
            '<a class="btn btn-primary" href="' + TH.router.href('SHARE-RESULT', bId) + '">' + I('pie', 'ic-sm') + 'Xem phân bổ lợi nhuận</a>' }) +
        '<div class="grid-4 u-mb-16">' + TH.kpi({ label: 'Thu đã xác nhận', value: F.short(al.summary.collected), href: TH.router.href('PAY-02') }) + TH.kpi({ label: 'Chi đã duyệt', value: F.short(al.summary.expenses), href: TH.router.href('EXP-01') }) +
        TH.kpi({ label: 'Lãi tạm tính đủ ĐK chia', value: F.short(base), neg: base < 0, accent: true, foot: TH.openBadge('D-07', 'DRAFT') }) + TH.kpi({ label: 'Số cổ đông hiệu lực', value: String(list.length), foot: esc(b.name) + ' · kỳ ' + F.period(p) }) + '</div>' +
        '<div class="grid-main-side"><div class="stack"><div class="card card-flush">' + bTabs + table + '</div>' + check + '</div><div class="stack">' + snap + '</div></div>';
    },
    scan: function () { return [{ ui: { b: 'TH-CG' } }]; },
  };
  TH.act['shr.discard'] = function () { TH.store.clearDraft('shr-' + curBuilding() + '-' + TH.store.state.period); TH.app.refresh(); };
  TH.act['shr.save'] = function () {
    var p = TH.store.state.period, bId = curBuilding(), list = editedShares(bId, p), sum = C.sum(list, function (s) { return s.ratio; });
    list.forEach(function (s) { if (s.dirty) { var orig = TH.db.shares.find(function (x) { return x.id === s.id; }); TH.log('Điều chỉnh tỷ lệ cổ phần', bId, C.shareholder(s.shareholderId).name + ': ' + orig.ratio + '% → ' + s.ratio + '%', 'share', bId); orig.ratio = s.ratio; } });
    TH.store.clearDraft('shr-' + bId + '-' + p); TH.app.refresh();
    TH.toast('Đã lưu tỷ lệ', Math.abs(sum - 100) < 0.001 ? 'Tổng 100%.' : 'Lưu ý: tổng ' + sum + '% (gói A không chặn — kiểm tổng là nâng cấp C).', Math.abs(sum - 100) < 0.001 ? 'success' : 'warning');
  };
  TH.act['shr.import'] = function () { TH.toast('Import bảng chia cổ phần (mô phỏng)', 'Tệp “bang_chia_CP_T10.xlsx”: 3 tòa, 9 dòng, khớp template.', 'info'); };

  /* ---------------- SHARE-RESULT ---------------- */
  TH.views['SHARE-RESULT'] = {
    modal: { size: 'lg' },
    scanParam: 'TH-CG',
    render: function (r) {
      var p = TH.store.state.period, bId = r.param && C.building(r.param) ? r.param : curBuilding(), b = C.building(bId);
      var mode = TH.has('F043.B') ? TH.store.ui('SHARE-RESULT', 'mode', 'cash') : 'cash';
      var al = C.allocation(bId, p), sm = al.summary;
      var base = mode === 'cash' ? al.base : sm.billed - sm.expenses;
      var rowsData = al.rows.map(function (x) { return { holder: x.holder, share: x.share, amount: Math.floor(base * x.share.ratio / 100 / 1000) * 1000 }; });
      if (rowsData.length && base > 0) rowsData[0].amount += base - C.sum(rowsData, function (x) { return x.amount; });
      var paid = function (hid) { return C.sum(TH.db.sharePayouts.filter(function (x) { return x.buildingId === bId && x.shareholderId === hid && x.period === p; }), function (x) { return x.amount; }); };
      var body = '<div class="stack">' +
        '<div class="row-between"><div class="row">' + TH.chips('SHARE-RESULT', 'x', [], '') + TH.db.buildings.filter(function (x) { return TH.inScope(x.id); }).map(function (x) { return '<a class="filter-chip" aria-pressed="' + (x.id === bId) + '" href="' + TH.router.href('SHARE-RESULT', x.id) + '">' + esc(x.short) + '</a>'; }).join('') + '</div>' +
        TH.gate('F043.B', '<div class="seg">' + [['cash', 'Dòng tiền'], ['accrual', 'Doanh thu thuộc kỳ']].map(function (o) { return '<button type="button" aria-pressed="' + (mode === o[0]) + '" data-act="ui.set" data-screen="SHARE-RESULT" data-key="mode" data-val="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' + TH.up('F043.B'), { mode: 'btn', label: 'Chọn chế độ doanh thu thuộc kỳ', size: 'btn-sm' }) + '</div>' +
        '<div class="card"><div class="card-bd">' + TH.kv([[mode === 'cash' ? 'Thu đã xác nhận' : 'Doanh thu thuộc kỳ (hóa đơn đã xác nhận)', F.money(mode === 'cash' ? sm.collected : sm.billed)], ['(−) Chi phí đã duyệt', F.money(-sm.expenses)], ['= Lãi tạm tính đủ điều kiện chia', '<b class="' + (base < 0 ? 'neg' : '') + '">' + F.money(base) + '</b> ' + TH.openBadge('D-07')]]) + '</div></div>' +
        TH.table({ cols: [
          { key: 'h', label: 'Cổ đông', render: function (x) { return esc(x.holder.name); } },
          { key: 'r', label: 'Tỷ lệ', num: true, render: function (x) { return x.share.ratio + '%'; } },
          { kind: 'money', key: 'a', label: 'Lãi phân bổ (tạm chia)', num: true, render: function (x) { return base > 0 ? '<b>' + F.money(x.amount) + '</b>' : '<span class="muted">0</span>'; } },
          { kind: 'money', key: 'pd', label: 'Đã chi (nhập tay)', num: true, gate: 'F044.B', render: function (x) { return F.money(paid(x.holder.id)); } },
          { kind: 'money', key: 'rm', label: 'Còn phải chi', num: true, gate: 'F044.C', render: function (x) { return F.money(Math.max(0, (base > 0 ? x.amount : 0) - paid(x.holder.id))); } },
        ], rows: rowsData, foot: { _label: '<b>Tổng tạm chia</b>', r: '<b>' + C.sum(rowsData, function (x) { return x.share.ratio; }) + '%</b>', a: '<b>' + F.money(Math.max(0, base)) + '</b>' } }) +
        '<div class="alert alert-neutral">' + I('info', 'ic-sm') + '<div class="alert-body">Tổng LN phân bổ = LN đủ điều kiện chia (làm tròn nghìn, phần dư dồn dòng đầu). <b>Lợi nhuận phân bổ không đồng nghĩa đã chi tiền.</b>' + (base <= 0 ? ' Kỳ này lãi ≤ 0 nên không phân bổ.' : '') + '</div></div>' +
        TH.gate('F043.C', '<div class="card"><div class="card-hd"><div class="card-title small">Lãi gộp / lãi ròng / chi phí chung ' + TH.up('F043.C') + '</div></div><div class="card-bd">' + TH.kv([['Lãi gộp (trước chi phí chung)', F.money(base)], ['Chi phí chung phân bổ (rule, mô phỏng 2%)', F.money(-Math.round(sm.billed * 0.02))], ['Lãi ròng chia', '<b>' + F.money(base - Math.round(sm.billed * 0.02)) + '</b>']]) + '</div></div>', { label: 'Phân biệt lãi gộp, lãi ròng, chi phí chung', lines: 3 }) +
        TH.gate('F043.D', '<div class="alert alert-success">' + I('compare', 'ic-sm') + '<div class="alert-body"><b>Đối chiếu bảng chia CP ' + TH.up('F043.D') + '</b><span>Bảng tỷ lệ phiên bản kỳ ' + F.period(p) + ' khớp ' + rowsData.length + '/' + rowsData.length + ' dòng; tổng 100%.</span></div></div>', { label: 'Đối chiếu với Bảng chia CP từng kỳ và phiên bản', lines: 1 }) +
        '<div class="grid-2">' + TH.gate('F044.C', '<div class="card"><div class="card-bd small">' + TH.tierPill('C') + ' Duyệt chi & đối chiếu công nợ cổ đông: mọi phiếu chi cổ đông cần kế toán duyệt.</div></div>', { label: 'Duyệt chi và đối chiếu công nợ cổ đông', lines: 1 }) +
        TH.gate('F044.D', '<div class="card"><div class="card-bd small">' + TH.tierPill('D') + ' Sổ vốn góp / tạm ứng / rút vốn: ' + esc(b.name) + ' vốn ' + F.money(C.sum(al.rows, function (x) { return x.share.capital; })) + ', 0 tạm ứng.</div></div>', { label: 'Sổ vốn góp/tạm ứng/rút vốn', lines: 1 }) + '</div></div>';
      return {
        title: 'Phân bổ lợi nhuận · ' + esc(b.name) + ' <span class="screen-id">SHARE-RESULT</span>', sub: 'Kỳ ' + F.period(p) + ' · nháp · không có cổng cổ đông chuyên biệt',
        body: body,
        foot: '<button type="button" class="btn" data-close>Đóng</button><span class="spacer"></span>' + TH.gate('F044.B', TH.permBtn('share.edit', '<button type="button" class="btn" data-act="shr.payout" data-id="' + bId + '">' + I('banknote', 'ic-sm') + 'Lập phiếu chi cổ đông' + TH.up('F044.B') + '</button>', '403'), { mode: 'btn', label: 'Phiếu chi cổ đông thủ công' }) +
          '<button type="button" class="btn btn-primary" data-act="shr.xlsx" data-id="' + bId + '">' + I('download', 'ic-sm') + 'Xuất Excel (.xlsx)</button>',
      };
    },
  };
  TH.act['shr.xlsx'] = function (el) {
    var p = TH.store.state.period, bId = el.dataset.id, al = C.allocation(bId, p);
    TH.exportXlsx('Phan_bo_LN_' + bId + '_ky_' + p, [{ name: 'Phan bo', title: 'Phân bổ lợi nhuận — ' + C.building(bId).name + ' · kỳ ' + F.period(p), note: 'NHÁP · Lãi tạm tính = thu xác nhận − chi đã duyệt · phân bổ không đồng nghĩa đã chi (D-07)',
      columns: [{ label: 'Cổ đông', width: 28 }, { label: 'Tỷ lệ', type: 'pct' }, { label: 'Vốn góp', type: 'money' }, { label: 'Lãi phân bổ', type: 'money' }, { label: 'Tiền đã chi (nhập tay)', type: 'money', width: 22 }],
      rows: al.rows.map(function (x) { return [x.holder.name, x.share.ratio / 100, x.share.capital, al.base > 0 ? x.amount : 0, null]; }), totals: ['Tổng', 1, C.sum(al.rows, function (x) { return x.share.capital; }), Math.max(0, al.base), null] }]);
    TH.toast('Đã xuất Excel', 'Có cột “Tiền đã chi” để nhập tay (gói A).');
  };
  TH.act['shr.payout'] = function (el) { TH.log('Lập phiếu chi cổ đông (nháp)', el.dataset.id, 'Chờ duyệt', 'share', el.dataset.id); TH.app.refresh(); TH.toast('Đã lập phiếu chi cổ đông (nháp)', 'Có chứng từ đính kèm; chờ kế toán duyệt.', 'info'); };
})();
