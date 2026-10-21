// QA bảng — tìm ô bảng bị xuống dòng vì cột quá hẹp. Chạy bằng Playwright browser_run_code (filename) với demo local
// (python -m http.server 8779 --bind 127.0.0.1). Quét mọi màn + tab/biến thể (v.scan) + dialog (v.dialogs), mặc định gói D, vai trò Admin.
// Một ô bị tính là "xuống dòng xấu" khi chữ ngắn (≤ 24 ký tự) bị gãy dòng, chữ vừa (≤ 80) chiếm ≥ 3 dòng, badge/nút bị gãy dòng,
// hoặc tiêu đề cột vượt 2 dòng.
// Kèm danh sách bảng phải cuộn ngang (px bị che) để cân bằng giữa "không gãy chữ" và "không tràn".
async (page) => {
  // Tham số tùy chọn: mở trước trang có ?qaWrapPkg=A&qaWrapW=1280 rồi chạy tool (mặc định gói D, 1440px)
  let q; try { q = new URL(page.url()).searchParams; } catch (e) { q = new URLSearchParams(); }
  const W = Number(q.get('qaWrapW')) || 1440;
  const PKG = q.get('qaWrapPkg') || 'D';
  await page.goto('http://127.0.0.1:8779/index.html?previewPackage=' + PKG + '&v=' + Date.now() + '#/demo/dash-01');
  await page.setViewportSize({ width: W, height: 900 });
  await page.waitForFunction(() => window.TH && TH.db && TH.views);
  await page.evaluate(() => { TH.db = TH.seed(); Object.assign(TH.store.state, { building: 'ALL', ui: {}, drafts: {}, editing: null, role: 'admin' }); });
  await page.evaluate(p => TH.app.setPackage(p), PKG);
  await page.waitForTimeout(300);

  const plan = await page.evaluate(() => {
    const out = [];
    TH.SCREENS.forEach(s => {
      const v = TH.views[s.id]; if (!v) return;
      (v.scan ? v.scan() : [{}]).forEach((p, i) => out.push({ id: s.id, kind: 'view', i, ui: p.ui || null, param: p.param || v.scanParam || null }));
      (v.dialogs || []).forEach((_, i) => out.push({ id: s.id, kind: 'dialog', i, param: v.scanParam || null }));
    });
    return out;
  });

  const measure = () => {
    // Đếm số dòng chữ thật: chỉ đo text node (bỏ icon/svg/chấm trạng thái), gộp các rect cùng hàng theo tâm dọc
    const lines = el => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeValue.trim() ? 1 : 2 });
      const mids = []; let n;
      while ((n = w.nextNode())) {
        const r = document.createRange(); r.selectNodeContents(n);
        Array.from(r.getClientRects()).forEach(b => { if (b.width < 1 || b.height < 1) return; const m = b.top + b.height / 2; if (!mids.some(t => Math.abs(t - m) < b.height * 0.6)) mids.push(m); });
      }
      return mids.length;
    };
    // Chữ ngắn (≤ 24 ký tự) phải 1 dòng; chữ vừa (≤ 80) tối đa 2 dòng
    const tooMany = (n, len) => (len <= 24 && n > 1) || (len <= 80 && n > 2);
    const res = [];
    const dlg = Array.from(document.querySelectorAll('[role=dialog]')).pop();
    const root = dlg || document.getElementById('view');
    (root || document).querySelectorAll('table').forEach((tb, ti) => {
      if (tb.closest('.doc-page') || tb.offsetParent === null) return;
      const heads = Array.from(tb.querySelectorAll('thead tr:last-child th')).map(th => th.textContent.trim().replace(/\s+/g, ' '));
      const label = tb.getAttribute('aria-label') || (tb.closest('.card') && tb.closest('.card').querySelector('.card-title') ? tb.closest('.card').querySelector('.card-title').textContent.trim().slice(0, 50) : '');
      tb.querySelectorAll('thead th, tbody td, tbody th, tfoot td').forEach(cell => {
        if (cell.colSpan > 1 && cell.closest('tbody') && cell.querySelector('.state')) return;
        const txt = cell.textContent.trim().replace(/\s+/g, ' ');
        if (!txt) return;
        const n = lines(cell);
        // Tiêu đề cột được phép tối đa 2 dòng
        if (cell.tagName === 'TH' && cell.closest('thead')) { if (n > 2) res.push({ table: ti, label, col: '(tiêu đề) ' + txt.slice(0, 30), head: true, w: Math.round(cell.getBoundingClientRect().width), txt: txt.slice(0, 60), why: n + ' dòng', tableW: Math.round(tb.getBoundingClientRect().width), wrapW: Math.round((tb.parentElement || tb).getBoundingClientRect().width) }); return; }
        const brokenChip = Array.from(cell.querySelectorAll('.badge, .btn, .tier, .chip, .pill, .status, a.btn')).some(b => lines(b) > 1);
        // ô có nhiều khối con (cell-main + cell-sub) là 2 dòng chủ ý → đo từng khối
        const isBlock = e => /^(block|flex|grid|list-item)$/.test(getComputedStyle(e).display);
        const blocks = Array.from(cell.querySelectorAll('*')).filter(b => b.textContent.trim() && isBlock(b) && !Array.from(b.children).some(c => isBlock(c) && c.textContent.trim()) && !b.closest('.badge, .btn'));
        // Xếp tầng có chủ ý: mỗi <br> mở 1 dòng; nhiều badge/chip được phép xuống hàng (miễn từng badge không gãy)
        const brs = cell.querySelectorAll('br').length, chips = cell.querySelectorAll('.badge').length;
        let bad = false, why = '';
        if (brokenChip) { bad = true; why = 'chip/nút gãy dòng'; }
        else if (blocks.length) {
          const bl = blocks.find(b => tooMany(lines(b), b.textContent.trim().length));
          if (bl) { bad = true; why = 'khối gãy dòng: ' + bl.textContent.trim().slice(0, 40); }
          else { const tw = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT); let loose = false, t; while ((t = tw.nextNode())) { if (t.nodeValue.trim() && !blocks.some(b => b.contains(t))) { loose = true; break; } } const allowed = Math.max(1, blocks.length + (loose ? 1 : 0)) + brs + Math.max(0, chips - 1); if (n > allowed && tooMany(n - allowed + 1, txt.length)) { bad = true; why = n + ' dòng / ' + allowed + ' khối'; } }
        } else if (chips < 2 && tooMany(n - brs, txt.length)) { bad = true; why = n + ' dòng'; }
        if (bad) {
          const col = cell.cellIndex;
          res.push({ table: ti, label, col: heads[col] || ('#' + col), head: cell.tagName === 'TH' && !!cell.closest('thead'), w: Math.round(cell.getBoundingClientRect().width), txt: txt.slice(0, 60), why, tableW: Math.round(tb.getBoundingClientRect().width), wrapW: Math.round((tb.parentElement || tb).getBoundingClientRect().width) });
        }
      });
    });
    return res;
  };

  const found = [], overflow = {};
  for (const p of plan) {
    await page.evaluate(p => {
      TH.modal.stack.slice().forEach(m => TH.modal.close(m.key, { silent: true }));
      TH.app.guard = null; TH.store.state.editing = null; TH.store.state.ui = {};
      if (p.ui) TH.store.state.ui[p.id] = Object.assign({}, p.ui);
      const h = TH.router.href(p.id, p.param || undefined);
      if (location.hash === h) TH.app.refresh(); else location.hash = h;
    }, p);
    await page.waitForTimeout(160);
    if (p.kind === 'dialog') {
      const ok = await page.evaluate(p => { try { TH.views[p.id].dialogs[p.i](); return true; } catch (e) { return false; } }, p);
      if (!ok) continue;
      await page.waitForTimeout(160);
    }
    const r = await page.evaluate(measure);
    r.forEach(x => found.push(Object.assign({ screen: p.id, kind: p.kind + '#' + p.i, ui: p.ui ? JSON.stringify(p.ui) : '' }, x)));
    // Bảng cuộn ngang: phần bị che (px) so với khung
    const ov = await page.evaluate(() => { const dlg = Array.from(document.querySelectorAll('[role=dialog]')).pop(); return Array.from((dlg || document.getElementById('view')).querySelectorAll('.table-wrap')).filter(w => w.offsetParent).map(w => ({ hidden: w.scrollWidth - w.clientWidth, label: (w.querySelector('table') || {}).getAttribute ? (w.querySelector('table').getAttribute('aria-label') || '') : '' })).filter(x => x.hidden > 4); });
    ov.forEach(x => { const k = p.id + ' | ' + (x.label || 'bảng'); overflow[k] = Math.max(overflow[k] || 0, x.hidden); });
  }
  await page.evaluate(() => TH.modal.stack.slice().forEach(m => TH.modal.close(m.key, { silent: true })));

  // Gom theo màn + bảng + cột
  const groups = {};
  found.forEach(f => {
    const k = f.screen + ' | ' + (f.label || 'bảng ' + f.table) + ' | ' + f.col + (f.head ? ' (tiêu đề)' : '');
    (groups[k] = groups[k] || { n: 0, w: f.w, tableW: f.tableW, wrapW: f.wrapW, samples: [], where: new Set() }).n++;
    const g = groups[k]; g.where.add(f.kind + (f.ui ? ' ' + f.ui : ''));
    if (g.samples.length < 2 && !g.samples.includes(f.txt)) g.samples.push(f.txt + ' [' + f.why + ']');
  });
  const list = Object.entries(groups).map(([k, g]) => ({ k, n: g.n, w: g.w, tableW: g.tableW, wrapW: g.wrapW, samples: g.samples, where: Array.from(g.where).slice(0, 3) })).sort((a, b) => a.k.localeCompare(b.k));
  return { width: W, pkg: PKG, states: plan.length, cells: found.length, columns: list.length, overflow: Object.entries(overflow).map(([k, v]) => k + ' · cuộn ' + v + 'px'), list: list.map(x => x.k + ' · ' + x.n + ' ô · rộng ' + x.w + 'px (bảng ' + x.tableW + '/' + x.wrapW + ') · ' + x.samples[0]) };
}
