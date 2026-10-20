#!/usr/bin/env node
/*
 * Sinh js/screens.js (39 Screen ID, §4) và js/features.js (F001–F052, §5 + §5A)
 * trực tiếp từ SRS để registry luôn truy vết được về tài liệu nguồn.
 *
 *   node tools/extract-srs.js
 *
 * Chạy lại khi SRS/Excel cập nhật. Không sửa tay hai file được sinh.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRS = path.join(ROOT, 'docs', 'TIMEHOUSE_SRS_GOI_D_v1_1_CAU_HINH_XEM_GOI_A_B_C_D.md');
const lines = fs.readFileSync(SRS, 'utf8').split(/\r?\n/);
const PIPE = ' \\|  ';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const cells = (l) => l.replace(/^\|/, '').replace(/\|\s*$/, '').split(' | ').map((c) => c.trim());

/* ---------- §4: 39 screens ---------- */
const screens = [];
let cur = null;
lines.forEach((l, i) => {
  let m = l.match(/^### Screen (\d+) — ([A-Z0-9-]+): (.+)$/);
  if (m) {
    cur = { no: +m[1], id: m[2], title: m[3].trim(), srcLine: i + 1, fields: [], actions: [], rules: [] };
    screens.push(cur);
    return;
  }
  if (/^### Screen 40/.test(l) || /^## 5\./.test(l)) { cur = null; return; }
  if (!cur) return;
  if ((m = l.match(/\*\*Module:\*\* (.+?) · \*\*Kiểu màn:\*\* (.+?) · \*\*Phân loại Excel:\*\* (.+?)\.?$/))) {
    cur.module = m[1]; cur.kind = m[2]; cur.excelType = m[3];
  }
  if ((m = l.match(/\*\*Phạm vi gói D:\*\* (.+)$/))) {
    const p = m[1].replace(/\.$/, '').split(PIPE).map((s) => s.trim());
    cur.notes = {
      A: cap(p[0].replace(/^Cơ bản:\s*/, '')),
      B: cap((p[1] || '').replace(/^Nâng cấp 70–80:\s*/, '')),
      C: cap((p[2] || '').replace(/^Nâng cấp 80–90:\s*/, '')),
      D: cap((p[3] || '').replace(/^Nâng cấp 90–100:\s*/, '')),
    };
  }
  if ((m = l.match(/\*\*Action nguồn Excel:\*\* (.+?)\. \*\*Fields nguồn Excel:\*\* (.+?)\. Khi role/))) {
    cur.srcActions = m[1].split(/;\s*/).map(cap);
    cur.srcFields = m[2];
  }
  if ((m = l.match(/^\| ([^|]+) \| ([^|]+) \| (TBD|Yes|No) \| /)) && !/^Điều hướng|^Tiêu đề/.test(m[1])) {
    cur.fields.push({ name: cap(m[1].trim()), format: m[2].trim(), required: m[3] });
  }
  if ((m = l.match(/^- \*\*(.+?):\*\* CƠ BẢN/))) cur.rules.push(m[1]);
});

/* ---------- §5: UAT / giới hạn ---------- */
const s5 = {};
let in5 = false;
lines.forEach((l) => {
  if (/^## 5\. /.test(l)) in5 = true;
  if (/^### 5A/.test(l)) in5 = false;
  if (!in5 || !/^\| \d+ \|/.test(l)) return;
  const c = cells(l);
  s5[+c[0]] = { group: c[1], name: c[2], data: c[3], action: c[4], uat: c[6], limit: c[7] };
});

/* ---------- §5A: F001–F052 ---------- */
const features = [];
lines.forEach((l) => {
  const m = l.match(/^\| \*\*(F\d{3})\*\* \|/);
  if (!m) return;
  const c = cells(l);
  const no = +m[1].slice(1);
  const [module, name] = c[1].split(' · ');
  const extra = s5[no] || {};
  features.push({
    id: m[1],
    module: module.trim(),
    name: (name || '').trim(),
    A: c[2], B: c[3], C: c[4], D: c[5],
    ui: c[6].replace(/`/g, '').split(/,\s*/),
    data: extra.data || '',
    action: extra.action || '',
    uat: extra.uat || '',
    limit: extra.limit && extra.limit !== 'Không có ghi chú đặc biệt' ? extra.limit : '',
  });
});

if (screens.length !== 39) throw new Error('Expected 39 screens, got ' + screens.length);
if (features.length !== 52) throw new Error('Expected 52 features, got ' + features.length);
screens.forEach((s) => { if (!s.notes || !s.notes.D) throw new Error('Missing notes for ' + s.id); });

const banner = (what) => `/* SINH TỰ ĐỘNG bởi tools/extract-srs.js từ docs/TIMEHOUSE_SRS_GOI_D_v1_1_CAU_HINH_XEM_GOI_A_B_C_D.md (${what}). Không sửa tay. */\n`;
fs.writeFileSync(path.join(ROOT, 'js', 'screens.js'),
  banner('§4 — 39 Screen ID') + 'var TH = window.TH = window.TH || {};\nTH.SCREENS = ' + JSON.stringify(screens, null, 1) + ';\n');
fs.writeFileSync(path.join(ROOT, 'js', 'features.js'),
  banner('§5 + §5A — 52 nhóm chức năng') + 'var TH = window.TH = window.TH || {};\nTH.FEATURES = ' + JSON.stringify(features, null, 1) + ';\n');
console.log(`OK: ${screens.length} screens, ${features.length} features`);
