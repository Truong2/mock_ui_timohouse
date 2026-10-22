#!/usr/bin/env node
/* CR-UI-STD — kiểm tra tĩnh chuẩn UI. Chạy: node tools/lint-ui.js  (thoát mã 1 nếu vi phạm)
 *  - 0 mã hex thô ngoài css/tokens.css (CSS + style inline trong JS)
 *  - 0 font-size < 12px; font-weight chỉ 400/500/600
 *  - số thuộc tính style="…" trong js/ ≤ 100 (mốc trước chuẩn hóa: 334)
 *  - 0 nhãn tiếng Anh trong danh sách đen glossary ở chuỗi hiển thị của js/views
 */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const list = (d, ext) => fs.readdirSync(path.join(root, d)).filter(f => f.endsWith(ext)).map(f => d + '/' + f);
const findings = [];
const add = (rule, file, line, text) => findings.push({ rule, file, line, text: String(text).trim().slice(0, 140) });

const css = list('css', '.css').filter(f => !f.endsWith('tokens.css') && !f.endsWith('fonts.css'));
css.forEach(f => read(f).split('\n').forEach((l, i) => {
  if (/#[0-9a-fA-F]{3,8}\b/.test(l.replace(/url\([^)]*\)/g, ''))) add('raw-hex', f, i + 1, l);
  const fs_ = l.match(/font-size:\s*(\d+(?:\.\d+)?)px/); if (fs_ && +fs_[1] < 12) add('font-size<12', f, i + 1, l);
  const fw = l.match(/font-weight:\s*(\d{3})/); if (fw && ['400', '500', '600'].indexOf(fw[1]) === -1) add('font-weight', f, i + 1, l);
}));

const js = list('js/views', '.js').concat(list('js', '.js'));
let styles = 0;
js.forEach(f => read(f).split('\n').forEach((l, i) => {
  const m = l.match(/style="[^"]*"/g) || [];
  styles += m.length;
  m.forEach(s => {
    if (/#[0-9a-fA-F]{3,8}\b/.test(s)) add('inline-hex', f, i + 1, s);
    const fz = s.match(/font-size:\s*(\d+(?:\.\d+)?)px/); if (fz && +fz[1] < 12) add('inline-font-size<12', f, i + 1, s);
  });
}));
if (styles > 100) add('inline-style-count', 'js/', 0, styles + ' > 100');

const BLACK = ['Upload', 'Preview', 'Rollback', 'Retry', 'Dead-letter', 'Snapshot', 'Batch & audit', '(upsert)', 'HĐơn', 'Import Excel', 'Log correction', 'bounce', 'idempotent', 'queue retry', 'snapshot', 'version', 'commit', 'Audit'];
list('js/views', '.js').forEach(f => read(f).split('\n').forEach((l, i) => {
  (l.match(/'(?:[^'\\\n]|\\.)*'/g) || []).forEach(str => {
    BLACK.forEach(w => { if (new RegExp('(^|[^A-Za-z.\\-_])' + w.replace(/[()&]/g, '\\$&') + '(?![A-Za-z])').test(str)) add('english-label', f, i + 1, w + ' in ' + str); });
  });
}));

const summary = { files: css.length + js.length, inlineStyles: styles, findings: findings.length, byRule: findings.reduce((o, x) => (o[x.rule] = (o[x.rule] || 0) + 1, o), {}) };
console.log(JSON.stringify({ summary, findings: findings.slice(0, 40) }, null, 2));
process.exit(findings.length ? 1 : 0);
