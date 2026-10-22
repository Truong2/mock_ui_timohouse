// Read-only audit of the current mock import implementation, not an acceptance test.
// Run with browser_run_code against python -m http.server 8780 --bind 127.0.0.1.
// Uses cfg.commit on a temporary in-memory seed; no persisted import, storage flush or real upload.
async (page) => {
  await page.goto('http://127.0.0.1:8780/index.html?previewPackage=D#/demo/own-01');
  await page.waitForFunction(() => window.TH && TH.views['OWN-IMP']);
  return page.evaluate(async () => {
    const configs = {}, originalRegister = TH.registerImport;
    try {
      TH.registerImport = cfg => { configs[cfg.screen] = cfg; originalRegister(cfg); };
      for (const name of ['owners', 'buildings', 'rooms']) {
        (0, eval)(await (await fetch('js/views/' + name + '.js')).text());
      }
    } finally { TH.registerImport = originalRegister; }

    const exports = [], originalExport = TH.exportXlsx;
    try {
      TH.exportXlsx = (file, sheets) => exports.push({ file, sheets });
      Object.keys(configs).forEach(screen => TH.act['imp.template']({ dataset: { screen } }));
    } finally { TH.exportXlsx = originalExport; }

    // Inspect actual OOXML bytes created by the application's writer.
    const blobs = [], originalURL = URL.createObjectURL, originalClick = HTMLAnchorElement.prototype.click;
    try {
      URL.createObjectURL = blob => { blobs.push(blob); return originalURL(blob); };
      HTMLAnchorElement.prototype.click = function () {};
      Object.keys(configs).forEach(screen => TH.act['imp.template']({ dataset: { screen } }));
    } finally { URL.createObjectURL = originalURL; HTMLAnchorElement.prototype.click = originalClick; }
    const files = [];
    for (let i = 0; i < blobs.length; i++) {
      const bytes = new Uint8Array(await blobs[i].arrayBuffer()), view = new DataView(bytes.buffer), entries = {};
      let offset = 0;
      while (offset + 30 < bytes.length && view.getUint32(offset, true) === 0x04034b50) {
        if (view.getUint16(offset + 8, true) !== 0) throw new Error('Audit expects the current STORE ZIP writer');
        const size = view.getUint32(offset + 18, true), nameLength = view.getUint16(offset + 26, true);
        const start = offset + 30 + nameLength + view.getUint16(offset + 28, true);
        const name = new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + nameLength));
        entries[name] = new TextDecoder().decode(bytes.slice(start, start + size));
        offset = start + size;
      }
      const xml = new DOMParser().parseFromString(entries['xl/worksheets/sheet1.xml'], 'application/xml');
      const cols = Array.from(xml.getElementsByTagName('col'));
      files.push({
        file: exports[i].file, columns: exports[i].sheets[0].columns.map(c => c.label),
        headerRow: 4, firstDataRow: 5,
        formattedInputColumns: cols.filter(c => c.hasAttribute('style')).length,
        validations: xml.getElementsByTagName('dataValidation').length,
        textNumberFormat: /numFmtId="49"/.test(entries['xl/styles.xml']),
        sampleFirstLine: configs[Object.keys(configs)[i]].sample()[0].line,
      });
    }

    const savedDB = TH.db, observations = [];
    try {
      TH.db = TH.seed();
      const owners = configs['OWN-IMP'];
      owners.commit(owners.sample().filter(r => !r.errors.length && !r.dup), 'skip');
      observations.push({ id: 'owner-company', expected: 'org', actual: TH.db.owners.find(o => o.id === 'CN-102').kind });
      owners.commit([{ data: { id: 'CN-002', name: 'Tên QA', phone: '0900000001', address: 'Địa chỉ QA' } }], 'update');
      const owner = TH.db.owners.find(o => o.id === 'CN-002');
      observations.push({ id: 'owner-upsert-columns', nameUpdated: owner.name === 'Tên QA', phoneUpdated: owner.phone === '0900000001', addressUpdated: owner.address === 'Địa chỉ QA' });
      const buildings = configs['BLD-IMP'];
      buildings.commit(buildings.sample().filter(r => !r.errors.length && !r.dup), 'skip');
      const b = TH.db.buildings.find(b => b.id === 'TH-HM');
      observations.push({ id: 'building-invented-defaults', area: b.area, managerId: b.managerId, floors: b.floors, sourceColumnCount: buildings.columns.length });
      configs['ROOM-IMP'].commit([{ data: { b: 'TH-CG', code: '999', floor: 9, rent: 100, status: 'Đang thuê' } }], 'skip');
      const room = TH.db.rooms.find(r => r.id === 'CG-999');
      observations.push({ id: 'room-status', expected: 'occupied', actual: room.status, defaultAreaWithoutInput: room.area });
    } finally { TH.db = savedDB; }
    return {
      date: '2026-10-21', baseCommit: '70763e3', auditedState: 'working tree, including pre-existing uncommitted edits', status: 'NOT_MATCHED',
      sourceWorkbooksModified: false, appStorageWritten: false, files, observations,
      customerImportExists: !!TH.views['CUS-IMP'],
      customerImportButtonExists: TH.views['CUS-01'].render().includes('Nhập từ Excel'),
      scope: 'Mock UI and generated OOXML. No actual XLSX upload/parser exists in this flow.',
    };
  });
}
