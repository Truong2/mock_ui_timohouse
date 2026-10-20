/* Xuất XLSX tối giản (Office Open XML, zip STORE) — không phụ thuộc CDN. Cũng có CSV riêng. */
var TH = window.TH = window.TH || {};

(function () {
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  var enc = new TextEncoder();

  function zip(files) {
    var chunks = [], central = [], offset = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, 0, true); lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      chunks.push(new Uint8Array(lh.buffer), name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true); ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true);
      ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, c) { return s + c.length; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob(chunks.concat(central, [new Uint8Array(end.buffer)]), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  function x(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function colName(i) {
    var s = '';
    i++;
    while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
    return s;
  }

  /**
   * sheets: [{ name, title?, note?, columns: [{ label, width?, type?: 'money'|'number'|'text'|'pct' }], rows: [[...] | { c, bold?, pct? }] , totals?: [...] }]
   */
  function buildXlsx(sheets) {
    var files = [];
    var sheetXml = sheets.map(function (sh) {
      var rowsXml = [], r = 0;
      function addRow(cells, style, pct) {
        r++;
        var cs = cells.map(function (v, ci) {
          var ref = colName(ci) + r;
          if (v === null || v === undefined || v === '') return '<c r="' + ref + '"' + (style ? ' s="' + style + '"' : '') + '/>';
          var col = sh.columns[ci] || {};
          var s = style || (col.type === 'money' || col.type === 'number' ? 2 : col.type === 'pct' ? 3 : 0);
          if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '" s="' + (pct ? 3 : style === 1 ? 4 : s) + '"><v>' + v + '</v></c>';
          return '<c r="' + ref + '" t="inlineStr"' + (style ? ' s="' + style + '"' : '') + '><is><t xml:space="preserve">' + x(v) + '</t></is></c>';
        }).join('');
        rowsXml.push('<row r="' + r + '">' + cs + '</row>');
      }
      if (sh.title) addRow([sh.title], 5);
      if (sh.note) addRow([sh.note], 6);
      if (sh.title || sh.note) addRow([]);
      addRow(sh.columns.map(function (c) { return c.label; }), 1);
      /* dòng là mảng ô, hoặc { c: [...], bold: true, pct: true } để định dạng theo dòng (báo cáo dạng chỉ tiêu × cột) */
      sh.rows.forEach(function (row) { if (Array.isArray(row)) addRow(row); else addRow(row.c, row.bold ? 1 : null, row.pct); });
      if (sh.totals) addRow(sh.totals, 1);
      var cols = '<cols>' + sh.columns.map(function (c, i) {
        return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (c.width || 16) + '" customWidth="1"/>';
      }).join('') + '</cols>';
      return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + cols +
        '<sheetData>' + rowsXml.join('') + '</sheetData></worksheet>';
    });

    files.push({ name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map(function (_, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>' });
    files.push({ name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' });
    files.push({ name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheets.map(function (s, i) { return '<sheet name="' + x(s.name.slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>' });
    files.push({ name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map(function (_, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
      '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' });
    files.push({ name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF9A3412"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFCCFBF1"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>' });
    sheetXml.forEach(function (xml, i) { files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: xml }); });
    return zip(files);
  }

  function save(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  TH.exportXlsx = function (filename, sheets) {
    save(buildXlsx(sheets), filename.replace(/\.xlsx$/i, '') + '.xlsx');
  };
  TH.exportCsv = function (filename, columns, rows) {
    var esc = function (v) { v = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [columns.map(function (c) { return esc(c.label || c); }).join(',')].concat(rows.map(function (r) { return r.map(esc).join(','); }));
    save(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), filename.replace(/\.csv$/i, '') + '.csv');
  };
})();
