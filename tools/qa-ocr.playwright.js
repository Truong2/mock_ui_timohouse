// CR-CUS-02 — OCR hợp đồng theo mẫu đầy đủ. Run this function with the Playwright browser_run_code tool against the local demo
// (python -m http.server 8779 --bind 127.0.0.1). Chạy sau khi tải trang với ?previewPackage=D; dữ liệu seed bị thay đổi trong lúc chạy.
async (page) => {
  const results = [];
  const check = (id, ok, evidence) => { results.push({ id, pass: !!ok, evidence }); if (!ok) throw new Error(id + ': ' + JSON.stringify(evidence)); };
  const read = fn => page.evaluate(fn);
  const go = async (hash, tab) => { await page.evaluate(([h, t]) => { if (t) TH.store.setUi('CUS-02', 'tab', t); location.hash = h; TH.app.refresh(); }, [hash, tab]); await page.waitForTimeout(450); };
  const click = async act => { await page.locator('[data-act="' + act + '"]').first().click(); await page.waitForTimeout(350); };
  await page.goto('http://127.0.0.1:8779/index.html?previewPackage=D#/demo/cus-01');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => window.TH && TH.db && TH.CONTRACT_OCR);
  // Bắt đầu từ seed sạch: xóa nháp/ui còn lại của lần chạy trước, gói D, vai trò Admin
  await page.evaluate(() => { TH.db = TH.seed(); Object.assign(TH.store.state, { building: 'ALL', ui: {}, drafts: {}, editing: null }); TH.store.set('role', 'admin'); TH.store.flush(); });
  await page.evaluate(() => TH.app.setPackage('D')); await page.waitForTimeout(300);

  // QA-OCR-01 — khóa xác nhận tới khi đủ 38 field + 1 bảng; độ tin cậy gói B+
  await go('#/demo/ocr-con');
  const q1 = await read(() => ({ fields: document.querySelectorAll('.ocr-field').length, groups: document.querySelectorAll('.ocr-group').length, rows: document.querySelectorAll('.ocr-table tbody tr').length, warn: document.querySelectorAll('.ocr-field .is-warn, .ocr-table tr.is-warn').length, disabled: document.querySelector('[data-act="ocrcon.confirm"]').disabled }));
  check('QA-OCR-01', q1.fields === 38 && q1.groups === 7 && q1.rows === 30 && q1.warn > 0 && q1.disabled, q1);
  await click('ocr.all');
  check('QA-OCR-01-all', await read(() => !document.querySelector('[data-act="ocrcon.confirm"]').disabled), 'Đánh dấu tất cả mở khóa nút xác nhận');

  // QA-OCR-02 — tạo HĐ mới từ OCR: dòng phí, điều khoản, bàn giao, tiền đã nộp, xe pending
  await click('ocrcon.confirm'); await page.waitForTimeout(400);
  await click('con.prefill'); await page.waitForTimeout(300);
  await click('con.approve'); await page.waitForTimeout(600);
  const q2 = await read(() => { const ct = TH.calc.contract('HĐ-CG401/26'); if (!ct) return null; const k = TH.calc.customer(ct.customerId); return { lines: ct.priceList.filter(l => l.active).map(l => l.code).join(','), water: ct.priceList.find(l => l.code === 'WATER').method, refund: ct.terms.refundDays, auto: ct.terms.autoRenew, late: ct.terms.lateFeePerDay, assets: ct.handover.assets.length, e: ct.handover.elecStart, w: ct.handover.waterStart, prepaid: ct.prepaid.total, veh: k.vehicles.map(v => v.type + ':' + v.status).join(), idPlace: k.idPlace }; });
  check('QA-OCR-02', q2 && q2.lines === 'ELEC,WATER,NET,SVC,PARK_MOTO,PARK_EBIKE,PARK_EV' && q2.water === 'per_person' && q2.refund === 10 && q2.auto && q2.late === 200000 && q2.assets === 30 && q2.e === 1250 && q2.w === 85 && q2.prepaid === 9000000 && q2.veh === 'Xe máy:pending' && !!q2.idPlace, q2);

  // QA-OCR-03 — đọc lại cho HĐ đã có: dòng phí hiệu lực kỳ sau, hóa đơn cũ không đổi, SĐT vào lịch sử liên hệ
  await go('#/demo/cus-02/HĐ-DD102/25', 'contract');
  const before = await read(() => ({ inv: TH.calc.invoice('INV-2610-DD102').total, hist: TH.db.customerHistory.filter(h => h.customerId === 'KH-008').length }));
  await click('cus.ctOcr'); await page.waitForTimeout(400);
  await page.locator('#ocr-OCR-CON-phone').fill('0977 ••• 808'); await page.locator('#ocr-OCR-CON-phone').dispatchEvent('change');
  await click('ocr.all'); await click('ctocr.confirm'); await page.waitForTimeout(400);
  const q3 = await read(() => { const ct = TH.calc.contract('HĐ-DD102/25'); const inv = TH.buildInvoice(TH.db, ct, '2026-11', 'draft'); return { from: ct.priceList[0].from, water: inv.lines.filter(l => l.type === 'water').map(l => l.qty + 'x' + l.price).join(), inv: TH.calc.invoice('INV-2610-DD102').total, hist: TH.db.customerHistory.filter(h => h.customerId === 'KH-008').length, job: TH.db.ocrJobs[0].kind + '/' + TH.db.ocrJobs[0].target }; });
  check('QA-OCR-03', q3.from === '2026-11' && q3.water === '2x120000' && q3.inv === before.inv && q3.hist === before.hist + 1 && q3.job === 'contract/update', { before, q3 });

  // QA-OCR-04 — so khớp (gói C): người > tối đa chặn xác nhận tới khi tích "đã kiểm tra"
  await go('#/demo/cus-02/HĐ-CG301/25', 'contract');
  await click('cus.ctOcr'); await page.waitForTimeout(400);
  await page.locator('#ocr-OCR-CON-people').fill('3'); await page.locator('#ocr-OCR-CON-people').dispatchEvent('change');
  await click('ocr.all');
  const q4 = await read(() => ({ danger: document.querySelectorAll('.split-right .alert-danger').length, disabled: document.querySelector('[data-act="ctocr.confirm"]').disabled }));
  await page.locator('[role=dialog] input[data-draft$=".ackMatch"]').click(); await page.waitForTimeout(350);
  const q4b = await read(() => document.querySelector('[data-act="ctocr.confirm"]').disabled);
  check('QA-OCR-04', q4.danger > 0 && q4.disabled && !q4b, { q4, q4b });
  await page.evaluate(() => { TH.store.clearDraft('ocr-con-HĐ-CG301/25'); TH.app.guard = null; TH.modal.close('ctocr', { silent: true }); });

  // QA-OCR-05 — tài sản bàn giao: sửa tình trạng; khấu trừ theo biên bản ở đối chiếu cọc
  await go('#/demo/cus-02/HĐ-CG101/25', 'contract');
  await page.evaluate(() => TH.act['sec.edit']({ dataset: { key: 'cusHandover', id: 'HĐ-CG101/25' } }));
  await page.evaluate(() => TH.store.setDraft('sec-cusHandover-HĐ-CG101/25', 'c_0', 'Trầy xước thành giường'));
  await click('sec.save'); await page.waitForTimeout(300);
  await go('#/demo/cus-02/HĐ-DD302/25', 'fin');
  await click('dep.review'); await page.waitForTimeout(300);
  await page.evaluate(() => { const f = 'dep-HC-2610-01'; TH.store.setDraft(f, 'a1', '0'); TH.store.setDraft(f, 'asset', '13'); TH.store.setDraft(f, 'assetAmt', '300000'); TH.modal.rerenderAll(); });
  await click('dep.submit'); await page.waitForTimeout(300);
  const q5 = await read(() => ({ cond: TH.calc.contract('HĐ-CG101/25').handover.assets[0].condition, ded: TH.db.depositCases.find(x => x.id === 'HC-2610-01').deductions.map(d => d.name + '|' + d.source.slice(0, 9)).join(';') }));
  check('QA-OCR-05', q5.cond === 'Trầy xước thành giường' && /Hư hỏng: Tường\|Điều 2\.2/.test(q5.ded), q5);

  // QA-OCR-06 — điều khoản phạt/phí chỉ hiển thị, công nợ không đổi
  await go('#/demo/cus-02/HĐ-CG101/25', 'stay');
  const q6 = await read(() => { const t = document.body.textContent; return { transfer: /Phí nhượng phòng/.test(t) && /Điều 4\.3 — chỉ hiển thị/.test(t), late: /Chỉ hiển thị — không tính vào công nợ/.test(t), debt: TH.calc.contractDebt('HĐ-CG101/25').debt }; });
  check('QA-OCR-06', q6.transfer && q6.late && q6.debt === 0, q6);

  // QA-OCR-07 — gói A: không có độ tin cậy/so khớp/log nhưng vẫn xác nhận và tạo HĐ được
  await page.evaluate(() => TH.app.setPackage('A')); await page.waitForTimeout(300);
  await go('#/demo/ocr-con'); await click('ocr.all');
  const q7 = await read(() => ({ conf: document.querySelectorAll('.conf').length, locked: document.querySelectorAll('[data-locked^="F012."]').length, enabled: !document.querySelector('[data-act="ocrcon.confirm"]').disabled }));
  check('QA-OCR-07', q7.conf === 0 && q7.locked >= 3 && q7.enabled, q7);
  await page.evaluate(() => { TH.store.clearDraft('ocr-con'); TH.app.guard = null; TH.modal.close(TH.modal.top().key, { silent: true }); TH.app.setPackage('D'); });

  const smoke = await read(() => { TH.db = TH.seed(); Object.assign(TH.store.state, { building: 'ALL', ui: {}, drafts: {}, editing: null }); const r = TH.qaSmoke(); TH.store.flush(); TH.app.refresh(); return r; });
  check('SMOKE', smoke.total === 928 && smoke.fails.length === 0, { total: smoke.total, fails: smoke.fails.length });
  return { passed: results.length, results };
}
