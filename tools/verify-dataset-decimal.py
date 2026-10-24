"""Independent Decimal arithmetic oracle: never imports/evaluates application JS."""
from pathlib import Path
from decimal import Decimal, ROUND_FLOOR
from collections import defaultdict
from datetime import date, timedelta
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/qa/dataset'
db = json.loads((OUT / 'dataset.json').read_text(encoding='utf-8'))
engine = json.loads((OUT / 'engine-results.json').read_text(encoding='utf-8'))
D = lambda n: Decimal(str(n))
def rnd(n, step=1): return ((D(n) / D(step) + D('0.5')).to_integral_value(rounding=ROUND_FLOOR)) * D(step)
checks = 0
def eq(actual, expected, label, tol=Decimal('0.000001')):
    global checks
    checks += 1
    assert abs(D(actual) - D(expected)) <= tol, f'{label}: actual={actual} expected={expected}'
idx = {name: {r['id']: r for r in rows if 'id' in r} for name, rows in db.items() if isinstance(rows, list)}

meter = idx['commonMeters']['CTC-TX-01']
reading = next(r for r in db['commonReadings'] if r['meterId'] == meter['id'] and r['period'] == '2026-10')
common_units = {}
for room in meter['rooms']:
    contract = next((c for c in db['contracts'] if c['roomId'] == room and c['status'] == 'active' and c['start'] <= '2026-10-31'), None)
    logs = sorted([l for l in (contract or {}).get('peopleLog', []) if l['from'] <= '2026-10'], key=lambda l: l['from'])
    common_units[room] = (logs[-1]['people'] if logs else contract['people']) if contract else 0
common_total = D(reading['cur'] - reading['prev']) * meter['price']
base_units = sum(common_units.values()); allocated = D(0); common_parts = {}
active_rooms = [r for r, n in common_units.items() if n]
for n, room in enumerate(active_rooms):
    amount = common_total - allocated if n == len(active_rooms) - 1 else rnd(common_total * common_units[room] / base_units)
    common_parts[room] = amount; allocated += amount
eq(engine['common']['amount'], common_total, 'common/meter amount')
eq(engine['common']['base'], base_units, 'common/people denominator')
for row in engine['common']['rows']: eq(row['amount'], common_parts.get(row['roomId'], 0), 'common/' + row['roomId'])

def performance(period, bid):
    invs = [i for i in db['invoices'] if i['period'] == period and i['buildingId'] == bid and i['status'] == 'confirmed']
    ids = {i['id'] for i in invs}
    weighted = D(0)
    for r in db['receipts']:
        if r['invoiceId'] not in ids or r['status'] != 'confirmed' or r['receivedAt'][:7] != period: continue
        day = int(r['receivedAt'][8:10]); factor = D(1) if day <= 5 else D('.9') if day <= 10 else D('.7') if day <= 15 else D(0)
        weighted += D(r['amount']) * factor
    required = sum(D(i['total']) for i in invs)
    services = sum(D(l['amount']) for i in invs for l in i['lines'] if l['type'] != 'rent')
    fraction = services / required if required else D(0)
    extra = sum(D(a['amount']) for a in db['arisingRent'] if a['period'] == period and a['buildingId'] == bid and a['paidFull'])
    extra += sum(D(a['amount']) for a in db['deposits'] if a['period'] == period and a['buildingId'] == bid and a['type'] == 'forfeit' and a['status'] == 'confirmed')
    listed = sum(D(r['rent']) for r in db['rooms'] if r['buildingId'] == bid)
    income = weighted * (1 - fraction) + extra
    return dict(A=weighted, B=fraction, C=extra, D=income, listed=listed, hs=income / listed if listed else D(0))

def pay(period, staff, income, listed, rooms):
    senior = date.fromisoformat(staff['joinedAt']) <= date.fromisoformat(period + '-01') - timedelta(days=365)
    rate = db['salaryPolicy']['ratePerRoom']['senior' if senior else 'junior']
    per_room = rnd(income / listed * 100 * rate / db['salaryPolicy']['refHs']) if listed else D(0)
    return per_room, rnd(per_room * rooms, 1000)

# Independently recompute invoices from units, prices and historical meter data.
for inv in db['invoices'] + engine['previews']:
    total = D(0); c = idx['contracts'][inv['contractId']]
    rd = next(r for r in db['readings'] if r['roomId'] == inv['roomId'] and r['period'] == inv['period'])
    for l in inv['lines']:
        typ = l['type']; amount = D(l['price']) * D(l['qty'])
        if typ == 'rent':
            factor = min(D(l['days']) / D(l['base']), D(1)) if l.get('k', 1) != 1 else D(1)
            amount = D(l['price']) * D(l.get('months', 1)) * factor
            amount = rnd(amount, l.get('roundTo') or 1)
        elif typ == 'elec': amount = D(rd['elecCur'] - rd['elecPrev']) * D(l['price'])
        elif typ == 'water':
            price = next((p for p in c.get('priceList', []) if p['code'] == 'WATER' and p['active']), None)
            if price and price['method'] == 'per_person':
                logs = sorted([x for x in c.get('peopleLog', []) if x['from'] <= inv['period']], key=lambda x: x['from'])
                people = logs[-1]['people'] if logs else c['people']; amount = D(people) * D(price['price'])
            else: amount = D(rd['waterCur'] - rd['waterPrev']) * D(l['price'])
        elif typ == 'common':
            amount = common_parts.get(inv['roomId'], D(0))
        elif typ == 'adjust':
            a = idx['billAdjusts'][l['refId']]; amount = D(a['amount']) * (-1 if a['kind'] == 'discount' else 1)
        eq(l['amount'], amount, inv['id'] + '/' + l['name']); total += amount
    eq(inv['total'], total, inv['id'] + '/total')

for row in engine['billRows']:
    room, period = row['roomId'], row['period']; start, end = period + '-01', period + '-31'
    invoices = [i for i in db['invoices'] if i['roomId'] == room and i['status'] == 'confirmed']
    current = next((i for i in invoices if i['period'] == period), None); old = [i for i in invoices if i['period'] < period]
    old_ids = {i['id'] for i in old}; confirmed = [r for r in db['receipts'] if r['status'] == 'confirmed']
    old_debt = sum(i['total'] for i in old) - sum(r['amount'] for r in confirmed if r['invoiceId'] in old_ids and r['receivedAt'] < start)
    deposit = sum(d['amount'] for d in db['deposits'] if d['roomId'] == room and d['period'] == period and d['type'] == 'in' and d['status'] == 'confirmed')
    paid = deposit + sum(r['amount'] for r in confirmed if (current and r['invoiceId'] == current['id']) or (r['invoiceId'] in old_ids and start <= r['receivedAt'] <= end))
    due = (current['total'] + deposit if current else 0) + old_debt
    for k, n in {'paid': paid, 'due': due, 'balance': paid - due, 'oldDebt': old_debt}.items(): eq(row[k], n, f'collection/{period}/{room}/{k}')

for h in engine['performance']:
    expected = performance(h['period'], h['buildingId'])
    for k, val in expected.items(): eq(h[k], val, f"perf/{h['period']}/{h['buildingId']}/{k}")

salary_keys = ['mgr', 'gm', 'opsHead', 'lead', 'source', 'sales', 'cleanStaff', 'acct', 'repairStaff', 'security']
pool_keys = {'gm': 'gm', 'opsHead': 'opsHead', 'source': 'source', 'sales': 'sales', 'acct': 'acct', 'repairStaff': 'repairStaff', 'security': 'security', 'office': 'office', 'marketing': 'mkt'}
expense_keys = {'owner_rent': 'cRent', 'equipment': 'equip', 'internet': 'cNet', 'waste': 'cWaste', 'elevator': 'cLift', 'cleaning': 'cleanStaff', 'commission': 'mkt', 'repair': 'repair', 'supplies': 'other', 'other': 'other'}
def pnl(period, bid, mode):
    v = defaultdict(lambda: D(0))
    for i in db['invoices']:
        if i['status'] != 'confirmed' or i['buildingId'] != bid: continue
        for l in i['lines']:
            if i['period'] < period and l['type'] == 'rent' and l.get('months', 1) > 1 and period in l.get('cover', []): v['rent'] += D(l['price'])
            if i['period'] != period: continue
            a = D(l['amount']); typ = l['type']; code = l.get('code')
            if typ == 'rent': v['rent'] += a - D(l['price']) * (l.get('months', 1) - 1)
            elif typ in ('elec', 'common'): v['elec'] += a
            elif typ == 'water': v['water'] += a
            elif typ == 'extra': v['lift'] += a
            elif typ == 'adjust': v['rent' if a < 0 else 'lift'] += a
            elif code == 'NET': v['net'] += a
            elif code == 'PARK': v['ev'] += a
            else:
                third = rnd(a / 3); v['clean'] += third; v['lift'] += third; v['wash'] += a - 2 * third
    for a in db['arisingRent']:
        if a['period'] == period and a['buildingId'] == bid and a['paidFull']: v['rent'] += D(a['amount'])
    for d in db['deposits']:
        if d['period'] == period and d['buildingId'] == bid and d['status'] == 'confirmed': v[{'in': 'depIn', 'forfeit': 'depForfeit', 'refund': 'depRefund'}[d['type']]] += D(d['amount'])
    for e in db['expenses']:
        if e['period'] != period or e['buildingId'] != bid or e['status'] != 'approved': continue
        if e['category'] == 'utility': v['cElec'] += D(e['elec']); v['cWater'] += D(e['amount']) - D(e['elec'])
        else: v[expense_keys.get(e['category'], 'other')] += D(e['amount'])
    rooms = sum(1 for r in db['rooms'] if r['buildingId'] == bid)
    pool = db['costPools'][period]
    for source, target in pool_keys.items(): v[target] += rnd(D(pool['lines'].get(source, 0)) * rooms / pool['portfolioRooms'])
    manager = idx['staff'][idx['buildings'][bid]['managerId']]; h = performance(period, bid)
    v['mgr'] = pay(period, manager, h['D'], h['listed'], rooms)[1]
    if any(t['id'] == manager['team'] and t['id'] != 'BO' for t in db['teams']): v['lead'] += rooms * db['salaryPolicy']['leaderPerRoom']
    if mode == 'kd':
        v['depIn'] = v['depRefund'] = v['equip'] = D(0)
        if v['cRent'] == 0:
            lease = next((l for l in db['leases'] if l['buildingId'] == bid and l['start'][:7] <= period <= l['end'][:7]), None)
            if lease: v['cRent'] += D(lease['rent'])
    v['svc'] = sum(v[k] for k in ['elec', 'water', 'clean', 'net', 'ev', 'lift', 'wash'])
    v['total'] = v['rent'] + v['svc'] + v['depIn'] + v['depForfeit'] - v['depRefund']
    v['gdv'] = sum(v[k] for k in ['cElec', 'cWater', 'cNet', 'cWaste', 'cEnv', 'cLift'])
    v['gv'] = v['cRent'] + v['equip'] + v['gdv']; v['salary'] = sum(v[k] for k in salary_keys)
    v['cpbh'] = v['salary'] + v['office'] + v['mkt'] + v['repair'] + v['other']; v['tcp'] = v['gv'] + v['cpbh']
    v['lng'] = v['total'] - v['gv']; v['lnr'] = v['total'] - v['tcp']
    return v

for period, scopes in engine['financial'].items():
    for mode in ['kd', 'tong']:
        total = defaultdict(lambda: D(0))
        for b in db['buildings']:
            v = pnl(period, b['id'], mode)
            for k, n in v.items(): eq(scopes[b['id']][mode][k], n, f'{period}/{b["id"]}/{mode}/{k}'); total[k] += n
        for k, n in total.items(): eq(scopes['ALL'][mode][k], n, f'{period}/ALL/{mode}/{k}')

for pr in engine['payroll']:
    period = pr['period']
    for row in pr['rows']:
        s = row['staff']; buildings = [b for b in db['buildings'] if b['managerId'] == s['id']]
        hs = [performance(period, b['id']) for b in buildings]; ids = {b['id'] for b in buildings}
        rooms = sum(1 for r in db['rooms'] if r['buildingId'] in ids)
        per_room, perf_pay = pay(period, s, sum(h['D'] for h in hs), sum(h['listed'] for h in hs), rooms)
        eq(row['perRoom'], per_room, 'salary/perRoom/' + s['id']); eq(row['perf'], perf_pay, 'salary/perf/' + s['id'])
        team = next((t for t in db['teams'] if t['leaderId'] == s['id'] and t['id'] != 'BO'), None)
        team_b = {b['id'] for b in db['buildings'] if team and idx['staff'][b['managerId']]['team'] == team['id']}
        lead = sum(1 for r in db['rooms'] if r['buildingId'] in team_b) * db['salaryPolicy']['leaderPerRoom']
        adj = sum(a['amount'] for a in db['salaryAdjustments'] if a['staffId'] == s['id'] and a['period'] == period)
        eq(row['total'], D(s['base'] + s['allowance'] + lead + adj) + perf_pay, 'salary/total/' + s['id'])

for sh in engine['shares']:
    v = pnl(sh['period'], sh['buildingId'], 'tong')
    for row in sh['data']['rows']:
        rate = D(row['ratio']) / 100
        for key, metric in [('capital', 'cRent'), ('lng', 'lng'), ('lnr', 'lnr')]: eq(row[key], rnd(v[metric] * rate), 'share/' + key)
        eq(row['total'], rnd((v['cRent'] + v['lnr']) * rate), 'share/total')
for f in engine['forecasts']:
    p = idx['forecastPlans'][f['planId']]; v = pnl(p['baselinePeriod'], p['buildingId'], p['mode'])
    rev = v['total'] + sum(a['amount'] for a in p['adjustments'] if a['target'] == 'revenue')
    costs = v['tcp'] + sum(a['amount'] for a in p['adjustments'] if a['target'] == 'cost')
    eq(f['profit'], rev - costs, 'forecast/' + p['id'])

result = {'passed': checks, 'failed': 0, 'method': 'Python Decimal; direct input ledger aggregation, no JS calculation calls', 'toleranceVND': 0.000001, 'rounding': 'floor(value / step + 0.5) * step; line shares preserve remainder'}
(OUT / 'decimal-results.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result))
