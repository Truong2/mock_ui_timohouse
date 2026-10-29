// CR-RPT-02 — luồng Báo cáo theo mẫu Excel (docs/TIMEHOUSE_REPORT_WORKFLOW_PLAN.md §5 "Kiểm thử bắt buộc").
// Chạy bằng Playwright browser_run_code (filename) với demo local (python -m http.server 8779 --bind 127.0.0.1). Dữ liệu seed bị thay đổi trong lúc chạy.
async (page) => {
  const results = [];
  const check = (id, ok, evidence) => { results.push({ id, pass: !!ok, evidence }); if (!ok) throw new Error(id + ': ' + JSON.stringify(evidence)); };
  const read = (fn, arg) => page.evaluate(fn, arg);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8779/index.html?previewPackage=D&v=' + Date.now() + '#/demo/reports');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => window.TH && TH.db && TH.reports);
  /* CR-RPT-03: xác nhận cần rà soát đủ nhóm minh chứng — đánh dấu đã rà soát trước mỗi lần xác nhận */
  await read(() => { window.__rv = id => { const d = TH.reports.draft(id); if (d) TH.reports.reviewState(d).groups.forEach(g => { TH.reports.markSeen(id, g.id); TH.reports.setReview(id, g.id, true); }); return id; }; });
  const reset = (role, pkg) => read(([r, k]) => {
    TH.modal.stack.slice().forEach(m => TH.modal.close(m.key, { silent: true }));
    TH.db = TH.seed(); TH.db.reportRuns = []; TH.db.reportDrafts = [];
    Object.assign(TH.store.state, { building: 'ALL', period: '2026-10', ui: {}, drafts: {}, editing: null, role: r, reportReturn: null });
    if (k) TH.store.state.pkg = k;
    window.__xl = []; if (!window.__realXlsx) window.__realXlsx = TH.exportXlsx;
    TH.exportXlsx = function (f, s) { window.__xl.push({ f, s, size: TH.buildXlsx(s).size }); };
    TH.app.guard = null; TH.app.refresh();
  }, [role, pkg || 'D']);
  await reset('admin');

  // QA-RPT-01 — hai mẫu, nhiều tòa: RPT-04 N tòa → N bản; RPT-05 1 bản đủ sheet KD/Tổng/nhóm (chỉ tòa chọn); hủy không tạo; bấm 2 lần không trùng (qua UI)
  await read(() => { location.hash = '#/demo/reports/new'; });
  await page.waitForSelector('[data-act="rptf.preview"]');
  await page.click('[data-act="rptf.pickType"][data-type="RPT-04"]'); await page.waitForTimeout(100);
  await page.locator('[data-act-change="rptf.b"][data-b="S9"]').uncheck();
  await page.click('[data-act="rptf.preview"]');
  await page.waitForSelector('[data-act="rptf.confirm"]');
  const btn4 = await page.locator('[data-act="rptf.confirm"]').innerText();
  const items4 = await read(() => document.querySelectorAll('.filter-chip[data-key="item"]').length);
  await page.click('[data-act="rptf.cancel"]'); await page.waitForTimeout(200);
  const afterCancel = await read(() => TH.db.reportRuns.length);
  await read(() => { location.hash = '#/demo/reports/new'; });
  await page.waitForSelector('[data-act="rptf.preview"]');
  await page.click('[data-act="rptf.preview"]');
  await page.waitForSelector('[data-act-change="rptf.ack"]');
  const disabledBeforeAck = await page.locator('[data-act="rptf.confirm"]').isDisabled();
  await page.locator('[data-act-change="rptf.ack"]').check(); await page.waitForTimeout(150);
  const did = await read(() => decodeURIComponent(location.hash).split('/').pop());
  await read(id => { const el = document.querySelector('[data-act="rptf.confirm"]'); el.click(); __rv(id); TH.act['rptf.confirm']({ dataset: { id }, disabled: false }); }, did);
  await page.waitForTimeout(250);
  const q1a = await read(() => ({ runs: TH.db.reportRuns.map(r => r.id), hash: location.hash }));
  const q1b = await read(() => {
    const R = TH.reports, d = R.preview({ type: 'RPT-05', period: '2026-10', buildingIds: ['T17', 'G1'] }).draft;
    d.ack = true; const c = R.confirm(__rv(d.id), { acknowledgeWarnings: true }), r = R.run(c.runIds[0]);
    return { n: c.runIds.length, sheets: r.snapshot.sheets.map(s => s.name), g1cols: r.snapshot.sheets.find(s => s.id === 'g:NHA-1').cols.map(c => c.label), ids: r.buildingIds };
  });
  check('QA-RPT-01', btn4.includes('2 báo cáo') && items4 === 2 && afterCancel === 0 && disabledBeforeAck && q1a.runs.length === 2 && q1a.runs.every(id => /^BC04-202610-(T17|G1)-v1$/.test(id)) &&
    q1b.n === 1 && q1b.sheets.join() === 'BAO CAO KINH DOANH T10,BAO CAO TONG T10,BC DT T10 NHÓM NHÀ 1,BC DT T10 NHÓM NHÀ 2,NGUON SO LIEU,CONG THUC' && q1b.g1cols.join() === 'TỔNG,T17' && q1b.ids.join() === 'T17,G1', { btn4, items4, afterCancel, disabledBeforeAck, q1a, q1b });

  // QA-RPT-02 — preview = bản lưu = Excel; mọi ô số truy được, nguồn/thành phần đối chiếu khớp
  const q2 = await read(() => {
    const R = TH.reports, d = R.preview({ type: 'RPT-05', period: '2026-09', buildingIds: ['T17', 'S9', 'G1'] }).draft, it = d.items[0];
    d.ack = true; const c = R.confirm(__rv(d.id), { acknowledgeWarnings: true }), run = R.run(c.runIds[0]);
    const same = JSON.stringify(it.vals) === JSON.stringify(run.snapshot.vals);
    R.export(run.id); const xl = window.__xl[window.__xl.length - 1];
    let cells = 0, bad = [], xlMismatch = 0;
    run.snapshot.sheets.filter(s => s.kind === 'stmt').forEach(sh => {
      const xs = xl.s.find(x => x.name === sh.name); let ri = 0;
      sh.lines.forEach(l => {
        const row = xs.rows[ri++];
        if (l.t !== 'm' && l.t !== 'r') return;
        sh.cols.forEach((col, ci) => {
          cells++;
          const v = run.snapshot.vals[sh.mode][col.key][l.metric], xv = row.c[2 + ci];
          if (l.t === 'm' ? xv !== v : (v === null ? xv !== null : Math.abs(xv - Math.round(v * 10000) / 10000) > 1e-9)) xlMismatch++;
          const t = R.trace({ where: 'run', id: run.id, item: 0, mode: sh.mode, col: col.key, metric: l.metric });
          if (!t) { bad.push(sh.id + ':' + l.metric); return; }
          if (t.kind !== 'ratio' && Math.abs(t.check - t.value) > 1) bad.push(sh.id + ':' + col.label + ':' + l.metric + ' ' + t.check + '≠' + t.value);
        });
      });
    });
    return { same, cells, bad: bad.slice(0, 5), xlMismatch, size: xl.size, file: xl.f, errors: d.errors.length };
  });
  await read(() => { location.hash = '#/demo/reports/view/' + TH.db.reportRuns[TH.db.reportRuns.length - 1].id; });
  await page.waitForSelector('.rptf-cell');
  const uiCells = await read(() => ({ expect: (() => { const sh = TH.db.reportRuns[TH.db.reportRuns.length - 1].snapshot.sheets[0]; return sh.lines.filter(l => l.t === 'm' || l.t === 'r').length * sh.cols.length; })(), btns: document.querySelectorAll('.rptf-cell').length, named: Array.from(document.querySelectorAll('.rptf-cell')).every(b => /^Nguồn và cách tính: /.test(b.getAttribute('aria-label'))) }));
  check('QA-RPT-02', q2.same && q2.cells > 400 && !q2.bad.length && !q2.xlMismatch && q2.size > 2000 && /^TIMEHOUSE_RPT-05_ALL_ky_2026-09_v1\.?/.test(q2.file) && q2.errors === 0 && uiCells.btns === uiCells.expect && uiCells.btns >= 200 && uiCells.named, { q2, uiCells });

  // QA-RPT-03 — trả trước 301G1: hóa đơn kỳ 09 14.700.000 cho 09–11; tiền phòng kỳ 09 và 10 mỗi kỳ 4.900.000; nguồn kỳ 10 mở hóa đơn kỳ 09
  const q3 = await read(() => {
    const R = TH.reports, k = R.keyOf(['G1']);
    const d9 = R.preview({ type: 'RPT-04', period: '2026-09', buildingIds: ['G1'] }).draft, d10 = R.preview({ type: 'RPT-04', period: '2026-10', buildingIds: ['G1'] }).draft;
    const t9 = R.trace({ where: 'draft', id: d9.id, item: 0, mode: 'tong', col: k, metric: 'rent' }), t10 = R.trace({ where: 'draft', id: d10.id, item: 0, mode: 'tong', col: k, metric: 'rent' });
    const s9 = t9.sources.find(s => s.id === 'INV-2609-301G1'), l9 = s9.lines.find(l => l.type === 'rent'), p10 = t10.sources.find(s => s.kind === 'prepaid');
    return { line: l9.amount, cover: l9.cover.join(), c9: l9.contrib, p10: p10 && [p10.id, p10.amount, p10.invPeriod, p10.lineTotal, p10.first, p10.later] };
  });
  await page.evaluate(() => { const d = TH.db.reportDrafts[TH.db.reportDrafts.length - 1]; location.hash = '#/demo/reports/preview/' + d.id; });
  await page.waitForSelector('.rptf-cell');
  await read(() => { const col = TH.reports.keyOf(['G1']); document.querySelector('.rptf-cell[data-m="rent"][data-col="' + col + '"]').click(); });
  await page.waitForSelector('[data-act="rptf.open"][data-kind="prepaid"]');
  await page.click('[data-act="rptf.open"][data-kind="prepaid"]'); await page.waitForTimeout(300);
  const q3nav = await read(() => ({ hash: decodeURIComponent(location.hash), banner: !!document.querySelector('.rptf-return'), period: TH.store.state.period }));
  await page.click('[data-act="rptf.return"]'); await page.waitForTimeout(250);
  const q3back = await read(() => location.hash.indexOf('#/demo/reports/preview/') === 0);
  check('QA-RPT-03', q3.line === 14700000 && q3.cover === '2026-09,2026-10,2026-11' && q3.c9 === 4900000 && q3.p10.join() === 'INV-2609-301G1,4900000,2026-09,14700000,4900000,4900000' && q3nav.hash === '#/demo/inv-03/INV-2609-301G1' && q3nav.banner && q3nav.period === '2026-10' && q3back, { q3, q3nav, q3back });

  // QA-RPT-04 — lẻ ngày 202G1: nháp bị loại + cảnh báo; sau xác nhận 1.520.000 (÷30) có căn cứ; đổi quy tắc chỉ đổi nháp (1.471.000), hóa đơn đã xác nhận giữ nguyên, preview bị phát hiện cũ
  const q4 = await read(() => {
    const R = TH.reports, k = R.keyOf(['G1']);
    TH.store.setUi('INV-01', 'b', 'G1'); TH.act['inv.gen']({ dataset: {} });
    const d = R.preview({ type: 'RPT-04', period: '2026-10', buildingIds: ['G1'] }).draft;
    const warn = d.warnings.some(w => w.code === 'DRAFT_INV' && /202G1/.test(w.text)), rentDraft = R.trace({ where: 'draft', id: d.id, item: 0, mode: 'tong', col: k, metric: 'rent' }).value;
    ['202G1', '101G1'].forEach(id => { const rd = TH.calc.reading(id, '2026-10'); rd.status = 'confirmed'; });
    TH.refreshDrafts('G1', '2026-10');
    ['202G1', '101G1'].forEach(id => { const i = TH.db.invoices.find(x => x.roomId === id && x.period === '2026-10'); Object.assign(i, { status: 'confirmed', confirmedBy: 'NV-002', confirmedAt: TH.TODAY }); });
    const stale = R.isStale(d), blocked = R.confirm(__rv(d.id), { acknowledgeWarnings: true }).reason;
    R.recalc(d.id);
    const t = R.trace({ where: 'draft', id: d.id, item: 0, mode: 'tong', col: k, metric: 'rent' }), s202 = t.sources.find(s => s.id === 'INV-2610-202G1'), l = s202.lines.find(x => x.type === 'rent');
    TH.onChange['bill.rule']({ dataset: { key: 'prorateBase' }, value: 'actual' });
    const conf = TH.db.invoices.find(x => x.roomId === '202G1' && x.period === '2026-10').lines.find(x => x.type === 'rent').amount;
    const draftAlt = TH.buildInvoice(TH.db, TH.calc.contractOfRoom('202G1'), '2026-10', 'draft').lines.find(x => x.type === 'rent').amount;
    const stale2 = R.isStale(d);
    TH.onChange['bill.rule']({ dataset: { key: 'prorateBase' }, value: 'd30' });
    return { warn, rentDraft, stale, blocked, diff: d.diff.length, contrib: l.contrib, raw: Math.round(l.raw), days: l.days + '/' + l.base, from: l.from, roundTo: l.roundTo, conf, draftAlt, stale2 };
  });
  check('QA-RPT-04', q4.warn && q4.rentDraft === 4900000 && q4.stale && q4.blocked === 'stale' && q4.diff > 0 && q4.contrib === 1520000 && q4.raw === 1520000 && q4.days === '12/30' && q4.from === '2026-10-20' && q4.roundTo === 1000 && q4.conf === 1520000 && q4.draftAlt === 1471000 && q4.stale2, q4);

  // QA-RPT-05 — điện chung: 126 kWh × 4.000 = 504.000; Σ phân bổ + thất thoát = tiền công tơ; chỉ hóa đơn đã xác nhận vào doanh thu (seed chưa lập HĐ TX không cộng 504.000)
  const q5 = await read(() => {
    const R = TH.reports, k = R.keyOf(['G1']);
    const d = R.preview({ type: 'RPT-04', period: '2026-10', buildingIds: ['G1'] }).draft;
    const t = R.trace({ where: 'draft', id: d.id, item: 0, mode: 'tong', col: k, metric: 'elec' });
    const lines = [].concat(...t.sources.map(s => s.lines || [])).filter(l => l.type === 'common'), b = lines[0] && lines[0].basis;
    const sum = b ? b.rows.reduce((a, r) => a + r.amount, 0) + b.loss : null;
    TH.db = TH.seed(); TH.db.reportRuns = []; TH.db.reportDrafts = [];
    const d0 = R.preview({ type: 'RPT-04', period: '2026-10', buildingIds: ['G1'] }).draft;
    const e0 = R.trace({ where: 'draft', id: d0.id, item: 0, mode: 'tong', col: k, metric: 'elec' });
    return { n: lines.length, room: t.sources.filter(s => (s.lines || []).some(l => l.type === 'common')).map(s => s.room), kwh: b && b.kwh, meter: b && b.meterAmount, sum, base: b && b.base, units: b && b.units, e0: e0.value, common0: e0.sources.length };
  });
  check('QA-RPT-05', q5.n === 2 && q5.kwh === 126 && q5.meter === 504000 && q5.sum === 504000 && q5.base === 9 && q5.e0 === 0 && q5.common0 === 0, q5);

  // QA-RPT-06 — điều chỉnh: giảm trừ 101G1 −120.000 vào tiền phòng 1 lần, có lý do/duyệt; khoản chờ duyệt 301G1 không lọt vào số ghi nhận
  const q6 = await read(() => {
    const R = TH.reports, k = R.keyOf(['G1']);
    TH.store.setUi('INV-01', 'b', 'G1'); TH.act['inv.gen']({ dataset: {} });
    ['101G1', '301G1'].forEach(id => { TH.calc.reading(id, '2026-10').status = 'confirmed'; });
    TH.refreshDrafts('G1', '2026-10');
    const i101 = TH.db.invoices.find(x => x.roomId === '101G1' && x.period === '2026-10'); Object.assign(i101, { status: 'confirmed' });
    const d = R.preview({ type: 'RPT-04', period: '2026-10', buildingIds: ['G1'] }).draft;
    const rent = R.trace({ where: 'draft', id: d.id, item: 0, mode: 'tong', col: k, metric: 'rent' }), lift = R.trace({ where: 'draft', id: d.id, item: 0, mode: 'tong', col: k, metric: 'lift' });
    const adj = [].concat(...rent.sources.map(s => (s.lines || []).filter(l => l.type === 'adjust')));
    const pend = [].concat(...lift.sources.map(s => (s.lines || []).filter(l => l.refId === 'TK-2610-03')));
    return { adj: adj.map(l => [l.contrib, l.basis.reason, l.basis.status, l.basis.approvedBy, l.basis.period]), count: adj.length, pend: pend.length, rent: rent.value, check: rent.check, warn: d.warnings.some(w => w.code === 'PENDING_ADJ') };
  });
  check('QA-RPT-06', q6.count === 1 && q6.adj[0][0] === -120000 && q6.adj[0][2] === 'approved' && q6.adj[0][4] === '2026-10' && q6.adj[0][1] && q6.pend === 0 && q6.rent === q6.check && q6.rent === 4900000 + 3500000 - 120000 && q6.warn, q6);

  // QA-RPT-07 — lịch sử phòng: nhận khách 31/10 → occupied cuối kỳ 10; ngày 28/29/30/31, tháng 2 nhuận/không nhuận; kỳ trước không đổi theo trạng thái hiện tại
  const q7 = await read(() => {
    const C = TH.calc, ev = TH.db.roomEvents, room = { id: 'QA-ROOM', status: 'occupied' };
    const at = (d, p) => { TH.db.roomEvents = ev.concat([{ roomId: 'QA-ROOM', at: d, from: 'vacant', to: 'occupied' }]); const s = C.roomStateAt(room, p); TH.db.roomEvents = ev; return s; };
    return { d31: at('2026-10-31', '2026-10'), d28: at('2026-10-28', '2026-10'), d30: at('2026-09-30', '2026-09'), nov1: at('2026-11-01', '2026-10'), sep: at('2026-10-31', '2026-09'), leap: at('2028-02-29', '2028-02'), feb: at('2027-02-28', '2027-02'), mar1: at('2027-03-01', '2027-02'),
      dd302sep: C.roomStateAt(C.room('302S9'), '2026-09'), cg401aug: C.roomStateAt(C.room('401T17'), '2026-08'), cg401jul: C.roomStateAt(C.room('401T17'), '2026-07') };
  });
  check('QA-RPT-07', q7.d31 === 'occupied' && q7.d28 === 'occupied' && q7.d30 === 'occupied' && q7.nov1 === 'vacant' && q7.sep === 'vacant' && q7.leap === 'occupied' && q7.feb === 'occupied' && q7.mar1 === 'vacant' && q7.dd302sep === 'maintenance' && q7.cg401aug === 'vacant' && q7.cg401jul === 'occupied', q7);

  // QA-RPT-08 — phiên bản: sửa nguồn → preview cũ bị phát hiện; v2 số mới, v1 & Excel v1 giữ nguyên; nguồn bị xóa vẫn đọc được căn cứ đã lưu
  await reset('admin');
  const q8 = await read(() => {
    const R = TH.reports, k = R.keyOf(['T17']);
    const d1 = R.preview({ type: 'RPT-04', period: '2026-09', buildingIds: ['T17'] }).draft; d1.ack = true;
    const v1 = R.run(R.confirm(__rv(d1.id), { acknowledgeWarnings: true }).runIds[0]);
    R.export(v1.id); const x1 = JSON.stringify(window.__xl[window.__xl.length - 1].s);
    const d2 = R.preview({ type: 'RPT-04', period: '2026-09', buildingIds: ['T17'], previousRunId: v1.id }).draft;
    const exp = TH.db.expenses.find(e => e.buildingId === 'T17' && e.period === '2026-09' && e.category === 'repair' && e.status === 'approved');
    exp.amount += 1000000;
    const stale = R.isStale(d2), blocked = R.confirm(__rv(d2.id), { acknowledgeWarnings: true }).reason;
    R.recalc(d2.id); d2.ack = true;
    const v2 = R.run(R.confirm(__rv(d2.id), { acknowledgeWarnings: true }).runIds[0]);
    TH.db.expenses = TH.db.expenses.filter(e => e !== exp);
    TH.onChange['bill.rule']({ dataset: { key: 'prorateBase' }, value: 'actual' });
    const tr = R.trace({ where: 'run', id: v1.id, item: 0, mode: 'tong', col: k, metric: 'repair' });
    R.export(v1.id); const x1b = JSON.stringify(window.__xl[window.__xl.length - 1].s);
    TH.onChange['bill.rule']({ dataset: { key: 'prorateBase' }, value: 'd30' });
    return { stale, blocked, v1: [v1.version, v1.snapshot.vals.tong[k].repair], v2: [v2.id, v2.version, v2.prevId === v1.id, v2.fromRunId === v1.id, v2.snapshot.vals.tong[k].repair], kept: tr.sources.some(s => s.id === exp.id && s.amount === exp.amount - 1000000), sameExcel: x1 === x1b, rules: v1.snapshot.rules.prorateBase };
  });
  check('QA-RPT-08', q8.stale && q8.blocked === 'stale' && q8.v1[0] === 1 && q8.v2[1] === 2 && q8.v2[2] && q8.v2[3] && q8.v2[4] === q8.v1[1] + 1000000 && /-v2$/.test(q8.v2[0]) && q8.kept && q8.sameExcel && q8.rules === 'd30', q8);

  // QA-RPT-09 — quyền & lưu trữ: gói A có luồng; QL không thấy RPT-05/tòa khác, lương bị che; Nhân sự 403; refresh giữ bản lưu; lỗi quota không báo lưu bền vững
  await reset('admin', 'A');
  const q9a = await read(() => { const d = TH.reports.preview({ type: 'RPT-05', period: '2026-10', buildingIds: ['T17', 'S9'] }).draft; d.ack = true; const c = TH.reports.confirm(__rv(d.id), { acknowledgeWarnings: true }); return { ok: c.ok, pkg: TH.store.state.pkg, durable: c.durable }; });
  await read(() => { TH.store.state.role = 'manager'; location.hash = '#/demo/reports'; TH.app.refresh(); });
  await page.waitForTimeout(200);
  const q9b = await read(() => {
    const R = TH.reports, d = R.preview({ type: 'RPT-04', period: '2026-10', buildingIds: ['T17'] }).draft;
    const html = TH.reportTraceRender({ where: 'draft', id: d.id, item: 0, mode: 'tong', col: R.keyOf(['T17']), metric: 'mgr' }).body;
    return { r5: R.canType('RPT-05'), seeRun5: TH.db.reportRuns.some(R.canSee), dd: R.preview({ type: 'RPT-04', period: '2026-10', buildingIds: ['S9'] }).error, salaryHidden: /bị hạn chế/.test(html), listRows: document.querySelectorAll('table[aria-label="Danh sách báo cáo đã tạo"] tbody tr').length };
  });
  await read(() => { TH.store.state.role = 'hr'; location.hash = '#/demo/reports'; TH.app.refresh(); });
  await page.waitForTimeout(150);
  const q9c = await read(() => ({ forbidden: !!document.querySelector('.state-forbidden'), r4: TH.reports.canType('RPT-04') }));
  await read(() => { TH.store.state.role = 'admin'; TH.store.state.pkg = 'D'; TH.store.flush(); });
  await page.reload(); await page.waitForFunction(() => window.TH && TH.db && TH.reports);
  await read(() => { window.__rv = id => { const d = TH.reports.draft(id); if (d) TH.reports.reviewState(d).groups.forEach(g => { TH.reports.markSeen(id, g.id); TH.reports.setReview(id, g.id, true); }); return id; }; });
  const q9d = await read(() => ({ runs: TH.db.reportRuns.length, storage: TH.db.reportRuns.map(r => r.storage) }));
  const q9e = await read(() => {
    const orig = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); };
    const d = TH.reports.preview({ type: 'RPT-04', period: '2026-10', buildingIds: ['G1'] }).draft; d.ack = true;
    const c = TH.reports.confirm(__rv(d.id), { acknowledgeWarnings: true });
    Storage.prototype.setItem = orig;
    return { ok: c.ok, durable: c.durable, storage: TH.reports.run(c.runIds[0]).storage };
  });
  check('QA-RPT-09', q9a.ok && q9a.pkg === 'A' && q9a.durable && !q9b.r5 && !q9b.seeRun5 && /403/.test(q9b.dd) && q9b.salaryHidden && q9c.forbidden && !q9c.r4 && q9d.runs === 1 && q9d.storage[0] === 'local' && q9e.ok && q9e.durable === false && q9e.storage === 'session', { q9a, q9b, q9c, q9d, q9e });

  // QA-RPT-10 — route cũ & UI: RPT-04 link mở form điền sẵn tòa (không tạo bản lưu); 375px không tràn ngang ở danh sách / xem trước / bản lưu; không lỗi JS
  await reset('admin');
  await read(() => { TH.store.setUi('RPT-04', 'b', 'S9'); location.hash = '#/demo/rpt-04'; });
  await page.waitForSelector('[data-act="rptf.preview"]');
  const q10a = await read(() => ({ type: (document.querySelector('[data-act="rptf.pickType"][aria-pressed="true"]') || {}).dataset ? document.querySelector('[data-act="rptf.pickType"][aria-pressed="true"]').dataset.type : null, checked: Array.from(document.querySelectorAll('[data-act-change="rptf.b"]:checked')).map(x => x.dataset.b), runs: TH.db.reportRuns.length }));
  await page.click('[data-act="rptf.preview"]'); await page.waitForSelector('.rptf-cell');
  const over = {};
  await page.setViewportSize({ width: 375, height: 800 }); await page.waitForTimeout(250);
  over.preview = await read(() => document.documentElement.scrollWidth - window.innerWidth);
  await read(() => { const d = TH.db.reportDrafts[TH.db.reportDrafts.length - 1]; d.ack = true; const c = TH.reports.confirm(__rv(d.id), { acknowledgeWarnings: true }); location.hash = '#/demo/reports/view/' + c.runIds[0]; });
  await page.waitForSelector('[data-act="rptf.xlsx"]'); await page.waitForTimeout(200);
  over.view = await read(() => document.documentElement.scrollWidth - window.innerWidth);
  await read(() => { location.hash = '#/demo/reports'; }); await page.waitForTimeout(250);
  over.list = await read(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.setViewportSize({ width: 1440, height: 900 });
  check('QA-RPT-10', q10a.type === 'RPT-04' && q10a.checked.join() === 'S9' && q10a.runs === 0 && over.preview <= 0 && over.view <= 0 && over.list <= 0 && !errors.length, { q10a, over, errors });

  // QA-RPT-11 — bàn làm việc xem trước: chưa mở nhóm thì không tích được (UI + API); mở nhóm tô ô liên quan; 1440px truy nguồn trong panel, 375px mở modal; hộp sửa công thức hiện kết quả trước khi lưu
  await reset('admin');
  await read(() => { const r = TH.reports.preview({ type: 'RPT-AMD', period: '2026-09', buildingIds: ['T17', 'S9', 'G1'] }); TH.store.setUi('REPORTS', 'pane', 'check'); location.hash = '#/demo/reports/preview/' + r.draft.id; });
  await page.waitForSelector('.rptf-pane [data-act="rptf.group"]');
  const q11a = await read(() => {
    const id = decodeURIComponent(location.hash).split('/').pop(), R = TH.reports, g = R.reviewState(R.draft(id)).groups[0];
    const api = R.setReview(id, g.id, true);
    document.querySelector('[data-act="rptf.group"][data-g="' + g.id + '"]').click();
    const cb = document.querySelector('[data-act-change="rptf.review"][data-g="' + g.id + '"]'), hl = document.querySelectorAll('.rptf-cell.is-hl').length;
    const enabled = !cb.disabled; cb.click();
    return { id, api: api.ok, enabled, hl, done: R.reviewState(R.draft(id)).groups[0].done };
  });
  await read(() => document.querySelector('.rptf-cell[data-m="elecNet"]').click());
  await page.waitForSelector('.rptf-pane .rptf-eq');
  const q11b = await read(() => ({ modal: !!TH.modal.top(), sel: document.querySelectorAll('.rptf-cell.is-sel').length, match: /Khớp/.test(document.querySelector('.rptf-pane .rptf-match').textContent) }));
  await read(() => { document.querySelector('.rptf-pane [data-act="rptf.tdrill"]').click(); });
  const q11c = await read(() => ({ crumbs: document.querySelectorAll('.rptf-crumbs [data-act="rptf.tjump"]').length, src: document.querySelectorAll('.rptf-pane .rptf-recs li').length + document.querySelectorAll('.rptf-pane [data-act="rptf.tdrill"]').length }));
  await read(id => { TH.act['rptf.formula']({ dataset: { id, k: 'elecBase' } }); }, q11a.id);
  await page.waitForSelector('#rptf-fx-live');
  const q11d = await read(() => { const w = Array.from(document.querySelectorAll('.rptf-fx-w')).find(x => x.dataset.c === 'washPaid'); const before = document.getElementById('rptf-fx-live').textContent; w.value = '0.4'; w.dispatchEvent(new Event('change', { bubbles: true })); const after = document.getElementById('rptf-fx-live').textContent; TH.modal.close('rptf-fx', { silent: true }); return { changed: before !== after && /Sẽ thay đổi/.test(after), runs: TH.db.reportRuns.length }; });
  await page.setViewportSize({ width: 375, height: 800 }); await page.waitForTimeout(200);
  await read(() => document.querySelector('.rptf-cell[data-m="elecNet"]').click());
  await page.waitForTimeout(200);
  const q11e = await read(() => ({ modal: !!TH.modal.top() && TH.modal.top().key === 'rptf-trace', over: document.documentElement.scrollWidth - window.innerWidth }));
  await read(() => TH.modal.close('rptf-trace', { silent: true }));
  await page.setViewportSize({ width: 1440, height: 900 });
  check('QA-RPT-11', !q11a.api && q11a.enabled && q11a.hl > 0 && q11a.done && !q11b.modal && q11b.sel === 1 && q11b.match && q11c.crumbs === 1 && q11d.changed && q11d.runs === 0 && q11e.modal && q11e.over <= 0, { q11a, q11b, q11c, q11d, q11e });

  const smoke = await read(() => { TH.exportXlsx = window.__realXlsx || TH.exportXlsx; TH.db = TH.seed(); Object.assign(TH.store.state, { building: 'ALL', ui: {}, drafts: {}, editing: null, role: 'admin', reportReturn: null }); const r = TH.qaSmoke(); TH.store.flush(); TH.app.refresh(); return { total: r.total, fails: r.fails.length }; });
  check('SMOKE', smoke.total >= 1048 && smoke.fails === 0, smoke);
  return { passed: results.length, results };
}
