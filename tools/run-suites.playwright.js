// Chạy nhiều bộ QA Playwright trong một lần (browser_run_code filename); sửa danh sách SUITES khi cần.
async (page) => {
  const SUITES = ['qa-dataset', 'qa-bill', 'qa-pay', 'qa-cus', 'qa-ocr', 'qa-report', 'qa-record-workflows', 'qa-records', 'qa-record-ui', 'qa-package-policy', 'qa-import-schema', 'qa-navigation', 'qa-pricing', 'qa-enterprise-components', 'qa-ui-standard'];
  const out = {};
  for (const s of SUITES) {
    try {
      const src = await (await fetch('http://127.0.0.1:8779/tools/' + s + '.playwright.js?x=' + Date.now())).text();
      const r = await eval('(' + src.replace(/^\s*\/\/.*\n/gm, '') + ')')(page);
      const list = r && (r.results || r.checks);
      out[s] = { ok: true, failed: r && (r.failed || (Array.isArray(list) ? list.filter(x => x.pass === false).map(x => x.id + ' ' + JSON.stringify(x.evidence || '').slice(0, 300)) : [])) };
    } catch (e) { out[s] = { ok: false, error: String(e.message || e).slice(0, 700) }; }
  }
  return out;
}
