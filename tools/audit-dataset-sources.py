"""Inventory the complete docs corpus and extract Excel formulas without evaluation.

Writes derived QA artifacts only. Source workbooks are never opened for writing.
No customer names, contact details or literal source rows are copied into the seed.
"""
from pathlib import Path
from zipfile import ZipFile
from collections import Counter
from hashlib import sha256
import xml.etree.ElementTree as ET
import gzip
import json
import re
import posixpath
from openpyxl.formula.translate import Translator
from openpyxl.formula.tokenizer import Tokenizer
from openpyxl.styles.numbers import BUILTIN_FORMATS

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/qa/dataset'
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
RID = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
DOMAINS = [
    ('Thông tin', 'master', 'F-MASTER'), ('Danh sách', 'supplier', 'F-SUPPLIER'),
    ('Hoá đơn', 'billing', 'F-BILL'), ('Hoa hồng', 'commission', 'F-COMMISSION'),
    ('G1.', 'building_report', 'F-PNL'), ('Bảng chia', 'shares', 'F-SHARE'),
    ('âm dương', 'utilities', 'F-UTILITY'), ('sổ sửa', 'repair', 'F-REPAIR'),
    ('bảng lương', 'payroll', 'F-PAYROLL'), ('BẢNG DỰ', 'forecast', 'F-FORECAST'),
    ('BÁO CÁO KINH', 'portfolio_report', 'F-PNL'), ('báo cáo', 'report_requirements', 'F-REPORT'),
]

def dump(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def classify(name, sheet):
    domain, rule = next(((d, r) for prefix, d, r in DOMAINS if name.startswith(prefix)), ('reference', 'F-REFERENCE'))
    s = sheet.upper()
    if 'HOÀN CỌC' in s or 'PHÁ HĐ' in s: domain, rule = 'deposit', 'F-DEPOSIT'
    elif 'ĐIỆN NƯỚC PHÒNG' in s: domain, rule = 'utilities', 'F-UTILITY'
    elif 'PHÒNG MỚI' in s or s.startswith('HĐ T') or s.startswith('HD T'): domain, rule = 'billing', 'F-BILL'
    elif 'ĐẦU TƯ' in s or 'THU CHI BAN ĐẦU' in s: domain, rule = 'investment', 'F-ASSET'
    role = 'summary' if any(w in s for w in ['BÁO CÁO', 'LNR ', 'LƯƠNG THÁNG', 'DỰ KIẾN']) else 'detail'
    if 'CÔNG THỨC' in s or s.endswith(' CT'): role = 'formula_reference'
    if s.startswith('SHEET'): role = 'unlabelled_reference'
    return domain, rule, role

def period_candidates(sheet, headers):
    # A month-only sheet name is NOT enough to assert a year.
    found = set()
    for text in [sheet] + headers:
        for m, y in re.findall(r'(?<!\d)(1[0-2]|0?[1-9])[./-](20\d{2}|2[5-6])(?!\d)', text):
            found.add(f'{int(y) + (2000 if len(y) == 2 else 0):04d}-{int(m):02d}')
    return sorted(found)

def family(formula, origin):
    try:
        # Translate relative A1 refs to one anchor; absolute refs and constants stay.
        return Translator(formula, origin=origin).translate_formula('JZZ10000')
    except (ValueError, IndexError, TypeError):
        return formula

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    totals = Counter(); inventory = []; families = []; cells_out = []; hashes = {}
    for path in sorted((ROOT / 'docs').rglob('*.xlsx')):
        if 'qa' in path.relative_to(ROOT / 'docs').parts:
            continue  # Exported QA workbooks are evidence, not customer inputs.
        rel = path.relative_to(ROOT).as_posix()
        with ZipFile(path) as z:
            wb = ET.fromstring(z.read('xl/workbook.xml'))
            relationships = {x.attrib['Id']: x.attrib['Target'] for x in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
            strings = []
            formats = dict(BUILTIN_FORMATS); style_formats = []
            if 'xl/styles.xml' in z.namelist():
                styles = ET.fromstring(z.read('xl/styles.xml'))
                formats.update({int(n.attrib['numFmtId']): n.attrib['formatCode'] for n in styles.findall('m:numFmts/m:numFmt', NS)})
                style_formats = [formats.get(int(x.attrib.get('numFmtId', 0)), 'unknown') for x in styles.findall('m:cellXfs/m:xf', NS)]
            if 'xl/sharedStrings.xml' in z.namelist():
                strings = [''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS)]
            book = {'file': rel, 'sha256': sha256(path.read_bytes()).hexdigest(), 'sheets': [],
                    'externalLinkParts': [x for x in z.namelist() if re.fullmatch(r'xl/externalLinks/externalLink\d+.xml', x)],
                    'tables': sum(bool(re.fullmatch(r'xl/tables/table\d+.xml', x)) for x in z.namelist()),
                    'definedNames': len(wb.findall('m:definedNames/m:definedName', NS))}
            for sheet in wb.find('m:sheets', NS):
                name = sheet.attrib['name']; target = relationships[sheet.attrib[RID]]
                target = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
                root = ET.fromstring(z.read(target)); stats = Counter(); shared = {}; fs = {}; headers = []
                cellnodes = root.findall('m:sheetData/m:row/m:c', NS)
                for c in cellnodes:
                    f = c.find('m:f', NS)
                    if f is not None and f.text and f.attrib.get('t') == 'shared': shared[f.attrib['si']] = (c.attrib['r'], '=' + f.text)
                for c in cellnodes:
                    address = c.attrib['r']; f = c.find('m:f', NS); v = c.findtext('m:v', default='', namespaces=NS)
                    typ = c.attrib.get('t', 'n')
                    if typ == 's': value = strings[int(v)] if v else ''
                    elif typ == 'inlineStr': value = ''.join(c.find('m:is', NS).itertext())
                    else: value = v
                    if f is None:
                        if value != '': stats['literalCells'] += 1
                        if int(re.search(r'\d+', address)[0]) <= 4 and isinstance(value, str) and len(value) > 2 and typ in ('s', 'inlineStr'):
                            # Only period candidates are persisted, not raw source headings/PII.
                            headers.append(value)
                        continue
                    stats['formulaCells'] += 1
                    if typ == 'e': stats['error:' + v] += 1
                    if v == '': stats['emptyCaches'] += 1
                    formula = '=' + f.text if f.text else None
                    if f.attrib.get('t') == 'shared':
                        stats['sharedCells'] += 1
                        if formula is None and f.attrib.get('si') in shared:
                            anchor, original = shared[f.attrib['si']]
                            formula = Translator(original, origin=anchor).translate_formula(address)
                    if formula is None: stats['unresolvedFormulas'] += 1
                    formula = formula or '[UNRESOLVED]'
                    norm = family(formula, address)
                    style_index = int(c.attrib.get('s', 0))
                    fid = 'FX-' + sha256((rel + '\0' + name + '\0' + norm).encode()).hexdigest()[:16]
                    if fid not in fs:
                        domain, rule, role = classify(path.name, name)
                        fs[fid] = {'id': fid, 'file': rel, 'sheet': name, 'exampleCell': address, 'formula': formula,
                                   'normalized': norm, 'count': 0, 'domain': domain, 'rule': rule,
                                   'handling': 'reference_only', 'reason': 'Source expression retained; runtime uses the documented domain rule on synthetic inputs. No arbitrary Excel evaluation.',
                                   'functions': [], 'inputs': [], 'external': bool(re.search(r'\[\d+\]', formula)), 'structured': '[#' in formula, 'errors': {}, 'emptyCaches': 0,
                                   'exampleNumberFormat': style_formats[style_index] if style_index < len(style_formats) else 'General',
                                   'unitsAndRounding': 'Runtime units/rounding are defined by the linked rule in formula-rules.json; source display format is retained, not inferred as a business unit.',
                                   'cacheTrust': 'unverified'}
                        try:
                            tokens = Tokenizer(formula).items
                            fs[fid]['functions'] = sorted({t.value[:-1].upper() for t in tokens if t.type == 'FUNC' and t.subtype == 'OPEN'})
                            fs[fid]['inputs'] = sorted({t.value for t in tokens if t.type == 'OPERAND' and t.subtype == 'RANGE'})
                        except Exception: fs[fid]['handling'] = 'unparsed_reference'
                    fam = fs[fid]; fam['count'] += 1
                    if typ == 'e': fam['errors'][v] = fam['errors'].get(v, 0) + 1
                    if v == '': fam['emptyCaches'] += 1
                    cells_out.append({'file': rel, 'sheet': name, 'cell': address, 'family': fid, 'formula': formula,
                                      'cached': value if typ not in ('s', 'str', 'inlineStr') else '[text cache omitted]', 'cacheType': typ, 'formulaType': f.attrib.get('t', 'normal'), 'styleIndex': style_index,
                                      'numberFormat': style_formats[style_index] if style_index < len(style_formats) else 'General'})
                domain, rule, role = classify(path.name, name)
                fingerprint = sha256(ET.tostring(root.find('m:sheetData', NS))).hexdigest()
                duplicate = hashes.get(fingerprint); hashes.setdefault(fingerprint, rel + '#' + name)
                book['sheets'].append({'name': name, 'state': sheet.attrib.get('state', 'visible'), 'dimension': (root.find('m:dimension', NS).attrib.get('ref') if root.find('m:dimension', NS) is not None else None),
                                       'domain': domain, 'rule': rule, 'role': role, 'periodCandidates': period_candidates(name, headers),
                                       'periodPolicy': 'Keep candidates; do not merge periods from filenames alone.', 'groups': sorted(set(re.findall(r'NHÀ\s+([TSG])', name.upper()))),
                                       'stats': dict(stats), 'families': len(fs), 'duplicateOf': duplicate,
                                       'disposition': 'reference_only' if role == 'unlabelled_reference' else 'mapped_to_synthetic_domain',
                                       'sha256SheetData': fingerprint})
                for fam in fs.values():
                    fam['periodCandidates'] = period_candidates(name, headers)
                    if fam['errors']:
                        fam.update(handling='source_error', reason='Cached Excel error: ' + ', '.join(fam['errors']) + '; never replace with zero or use as a demo expected result.')
                    elif fam['external']:
                        fam.update(handling='external_reference', reason='External workbook dependency is not fully supplied/verified. Preserve expression; runtime domain rule uses synthetic local ledgers.')
                    elif fam['emptyCaches']:
                        fam.update(handling='missing_cache', reason='At least one formula cell has no cached value. Extraction is not recalculation; no numeric parity claim.')
                    elif fam['structured']:
                        fam.update(handling='table_reference', reason='Structured Excel table expression retained for review; synthetic ledger relationships replace table-coordinate joins.')
                    elif set(fam['functions']) & {'RIGHT', 'LEFT', 'LEN', 'CONCATENATE', 'VLOOKUP'}:
                        fam.update(handling='mapping_reference', reason='Identifier/lookup pattern retained; demo uses stable explicit business IDs and foreign keys rather than parsing real customer codes.')
                    elif set(fam['functions']) & {'SUM', 'SUMIF', 'SUBTOTAL', 'COUNT', 'COUNTIF'}:
                        fam.update(handling='aggregation_reference', reason='Excel range/filter aggregation retained; application aggregates eligible synthetic documents under the linked domain rule. Hidden/filter rows are not assumed to be transactions.')
                    elif set(fam['functions']) & {'IF', 'AND'}:
                        fam.update(handling='condition_reference', reason='Source condition retained; demo uses domain status rules. Payment, occupancy and deposit states remain separate.')
                    else:
                        fam.update(handling='arithmetic_reference', reason='Arithmetic expression retained; constants and source totals are not copied. Linked domain rule defines synthetic inputs, units, rounding and pending-policy differences.')
                totals.update(stats); totals['sheets'] += 1; families.extend(fs.values())
            inventory.append(book); totals['workbooks'] += 1
    # Deterministic compressed per-cell evidence; shared formulas expanded to full A1 expressions.
    payload = ''.join(json.dumps(x, ensure_ascii=False) + '\n' for x in cells_out).encode()
    (OUT / 'formula-cells.jsonl.gz').write_bytes(gzip.compress(payload, mtime=0))
    dump('source-inventory.json', {'version': 1, 'method': 'OOXML sparse cells; no workbook recalculation', 'totals': dict(totals), 'workbooks': inventory})
    dump('formula-families.json', families)
    documents = []
    for path in sorted((ROOT / 'docs').rglob('*')):
        if not path.is_file() or OUT in path.parents: continue
        rel = path.relative_to(ROOT).as_posix(); ext = path.suffix.lower()
        kind = 'qa_evidence' if '/qa/' in rel else 'implementation_document' if ext == '.md' else 'customer_reference'
        entry = {'file': rel, 'kind': kind, 'bytes': path.stat().st_size, 'sha256': sha256(path.read_bytes()).hexdigest()}
        if ext == '.md':
            content = path.read_text(encoding='utf-8-sig'); entry['headings'] = [l for l in content.splitlines() if l.startswith('#')]
            entry['policy'] = 'Latest explicit decision supersedes historical prose; proposal does not mean approval.'
        elif ext == '.docx':
            from docx import Document
            d = Document(path); entry['paragraphs'] = len(d.paragraphs); entry['tables'] = len(d.tables); entry['domain'] = 'payroll'; entry['review'] = 'Read all six calculation steps; /100 body conflicts with /90 example.'
        elif ext == '.pdf':
            from pypdf import PdfReader
            d = PdfReader(path); entry['pages'] = len(d.pages); entry['textCharacters'] = sum(len(p.extract_text() or '') for p in d.pages)
            entry['review'] = 'DAYDU is the active contract template; P302 retained as historical comparison, not merged into DAYDU.'
        elif ext == '.doc': entry['review'] = 'Legacy OLE Word: UTF-16 text extraction reviewed for lease/payment/deposit terms; layout and embedded fields not reconstructed.'
        elif ext in ('.jpg', '.png') and kind == 'customer_reference': entry['review'] = 'Organisation chart visually reviewed; three operations departments share one technical employee. Role naming remains proposed.'
        documents.append(entry)
    dump('document-inventory.json', documents)
    print(json.dumps({'totals': dict(totals), 'families': len(families), 'documents': len(documents)}, ensure_ascii=False))

if __name__ == '__main__': main()
