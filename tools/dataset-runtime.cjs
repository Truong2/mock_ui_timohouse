// Load the browser calculation engine without a DOM for reproducible data QA.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function runtime(includeDataset = true) {
  const ctx = vm.createContext({ console, Date, Math, JSON, setTimeout, clearTimeout });
  ctx.window = ctx;
  for (const file of ['js/data.js', 'js/pnl.js'].concat(includeDataset && fs.existsSync(path.join(root, 'js/dataset.js')) ? ['js/dataset.js', 'js/dataset-reports.js'] : [])) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  }
  ctx.TH.fmt = { money: n => String(n), pct: n => String(n * 100), num: n => String(n), date: n => n, period: n => n };
  ctx.TH.statusLabel = n => n;
  ctx.TH.db = ctx.TH.seed();
  return ctx;
}
function metrics(TH) {
  const result = {};
  for (const period of TH.PERIODS) {
    result[period] = {};
    for (const building of ['ALL', ...TH.db.buildings.map(b => b.id)]) {
      result[period][building] = {};
      for (const mode of ['kd', 'tong']) {
        const p = TH.calc.pnl(period, building, mode);
        result[period][building][mode] = Object.fromEntries(Object.entries(p).filter(([, v]) => typeof v === 'number'));
      }
    }
  }
  return result;
}
module.exports = { runtime, metrics, root };
if (require.main === module) {
  const { TH } = runtime(true);
  const dir = path.join(root, 'docs/qa/dataset');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'baseline-schema13.json'), JSON.stringify({ schema: TH.DATA_SCHEMA, db: TH.db, metrics: metrics(TH) }, null, 2) + '\n');
  console.log('Captured schema', TH.DATA_SCHEMA, 'with', TH.db.rooms.length, 'rooms.');
}
