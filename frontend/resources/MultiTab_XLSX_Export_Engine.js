/**
 * MultiTab_XLSX_Export_Engine.js
 * Advanced Geotechnical Multi-Tab Excel (XLSX) Export Engine
 * 
 * Generates an engineering-grade Excel workbook featuring:
 * 1. Metadata (Borehole specifications, GPS, elevation, drilling rig, supervisor)
 * 2. Stratigraphic SPT (Merged unified depth model, vertically merged stratum cells,
 *    exact visualizer pastel color-coding, ordered boundaries with empty SPT cells)
 * 3. Stratigraphy (Strata intervals, layer thickness, USCS classification, descriptions)
 * 4. SPT Records (Depth-wise seating 150mm, 300mm, 450mm, and N-Values)
 * 5. Grain Size Analysis (Depth, Soil Class, Gravel %, Sand %, Silt %, Clay %, Total %)
 * 6. Atterberg Limits & Specific Gravity (LL, PL, PI, Water Content, LI, Specific Gravity)
 * 7. Consolidation Tests (Vertical stress, Eoed, Cc, Cr, Pc, Void ratio, Cv)
 * 8. CPT Tests (qc, fs, Rf, u2)
 * 9. Direct Shear Tests (Normal stress, shear stress, cohesion, friction angle)
 * 10. Triaxial Tests (Test type, confining stress, peak deviator stress, secant modulus)
 * 11. Generic extra test suites dynamically discovered from properties
 * 
 * Supports both ExcelJS (primary, with rich styling, cell fills, and borders)
 * and SheetJS (fallback, with column widths and cell merges).
 */

(function() {
  // Pastel palette synchronized with BorelogVisualizer.js
  const pastelColors = [
    "#fbcfe8", "#fde047", "#86efac", "#93c5fd", "#d8b4fe", "#fdba74", "#67e8f9", "#fca5a5",
    "#bef264", "#c4b5fd", "#fcd34d", "#7dd3fc", "#f9a8d4", "#f87171", "#6ee7b7", "#a78bfa",
    "#fcd34d", "#38bdf8", "#fb7185", "#a3e635", "#818cf8", "#fbbf24", "#34d399", "#e879f9",
    "#fb923c", "#4ade80", "#60a5fa", "#f472b6", "#c084fc", "#fde047", "#2dd4bf", "#f87171",
    "#a78bfa", "#facc15", "#38bdf8", "#fb7185", "#4ade80", "#818cf8", "#fbbf24", "#2dd4bf",
    "#e879f9", "#fb923c", "#34d399", "#60a5fa", "#f472b6", "#c084fc", "#fde047", "#a3e635"
  ];

  let classColorMap = {};
  let colorIndex = 0;

  function resetColorMap() {
    classColorMap = {};
    colorIndex = 0;
  }

  function getStratumColor(cls) {
    if (typeof window !== 'undefined' && typeof window.getColorForClass === 'function') {
      return window.getColorForClass(cls);
    }
    if (!cls) return "#e5e7eb";
    const key = String(cls).trim().toUpperCase();
    if (!classColorMap[key]) {
      classColorMap[key] = pastelColors[colorIndex % pastelColors.length];
      colorIndex++;
    }
    return classColorMap[key];
  }

  function hexToARGB(hex) {
    if (!hex) return 'FFFFFFFF';
    hex = String(hex).replace('#', '').trim();
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length === 6) return 'FF' + hex.toUpperCase();
    if (hex.length === 8) return hex.toUpperCase();
    return 'FFFFFFFF';
  }

  // Trigger file download in browser
  function triggerDownload(buffer, filename) {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 150);
  }

  window.exportBorelogToXLSX = async function(feature, uid) {
    resetColorMap();
    const properties = (feature && feature.properties) ? feature.properties : (feature || {});
    const coords = (feature && feature.geometry && feature.geometry.coordinates) ? feature.geometry.coordinates : [0, 0];
    const borelogId = properties.borelog_id || properties.borehole_id || uid || 'Borelog';
    const filename = `${borelogId}_Borelog_Data.xlsx`;

    // Normalizing strata and spt data
    const rawStrata = properties.strata || properties.stratigraphy || [];
    const strata = rawStrata.slice().sort((a, b) => (parseFloat(a.top_m) || 0) - (parseFloat(b.top_m) || 0));

    const rawSpt = properties.spt_data || properties.spt_records || [];
    const sptRecords = rawSpt.slice().sort((a, b) => (parseFloat(a.depth_m) || 0) - (parseFloat(b.depth_m) || 0));

    // Helper: Find stratum class for a given depth
    const getStratumAtDepth = (depth) => {
      const d = parseFloat(depth);
      if (isNaN(d)) return 'N/A';
      const layer = strata.find(s => d >= (parseFloat(s.top_m) || 0) && d <= (parseFloat(s.bottom_m) || 0));
      return layer ? (layer.class || layer.type_uscs || 'N/A') : 'N/A';
    };

    // Metadata entries
    const metadataItems = [
      ['Borelog ID', borelogId],
      ['Project Name', properties.project || ''],
      ['Client', properties.client || ''],
      ['Location', properties.location || ''],
      ['Engineering Team', properties.engineering_team || properties.drilling_team || ''],
      ['Drilling Team', properties.drilling_team || properties.engineering_team || ''],
      ['Field Supervisor', properties.supervisor || ''],
      ['Coordinates (EPSG:4326)', `${coords[1]}, ${coords[0]}`],
      ['Elevation (RL, m MSL)', properties.rl_m !== undefined ? properties.rl_m : ''],
      ['Water Table Depth (m)', properties.water_table_m !== undefined ? properties.water_table_m : ''],
      ['Total Boring Depth (m)', properties.depth_m !== undefined ? properties.depth_m : ''],
      ['Drill Rig Model', properties.drill_rig || ''],
      ['TBM / Rig No', properties.tbm_no || ''],
      ['Date Started', properties.date_of_starting_boring || ''],
      ['Date Completed', properties.date_of_ending_boring || ''],
      ['Comments / Notes', properties.comments || '']
    ];

    // =========================================================================
    // PRIMARY ENGINE: ExcelJS (Rich Styling, Colors, Borders, Merges)
    // =========================================================================
    const hasExcelJS = (typeof window !== 'undefined' && window.ExcelJS) || (typeof ExcelJS !== 'undefined');
    if (hasExcelJS) {
      const LibExcelJS = (typeof window !== 'undefined' && window.ExcelJS) ? window.ExcelJS : ExcelJS;
      const wb = new LibExcelJS.Workbook();
      wb.creator = 'Geotechnical WebMap Studio';
      wb.lastModifiedBy = properties.supervisor || 'Engineer';
      wb.created = new Date();
      wb.modified = new Date();

      const STYLES = {
        headerFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }, // Slate-800
        headerFont: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
        headerBorder: {
          top: { style: 'medium', color: { argb: 'FF0F172A' } },
          bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
          left: { style: 'thin', color: { argb: 'FF334155' } },
          right: { style: 'thin', color: { argb: 'FF334155' } }
        },
        cellBorder: {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        },
        stratumBorder: {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
          left: { style: 'thin', color: { argb: 'FF94A3B8' } },
          right: { style: 'thin', color: { argb: 'FF94A3B8' } }
        }
      };

      function styleHeader(ws, height = 26) {
        const row = ws.getRow(1);
        row.height = height;
        row.eachCell(cell => {
          cell.fill = STYLES.headerFill;
          cell.font = STYLES.headerFont;
          cell.border = STYLES.headerBorder;
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });
      }

      // TAB 1: Metadata
      const wsMeta = wb.addWorksheet('Metadata');
      wsMeta.columns = [
        { header: 'Property', key: 'key', width: 26 },
        { header: 'Value', key: 'value', width: 45 }
      ];
      styleHeader(wsMeta);
      metadataItems.forEach(item => {
        const row = wsMeta.addRow({ key: item[0], value: item[1] });
        row.height = 22;
        const kCell = row.getCell(1);
        const vCell = row.getCell(2);
        kCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
        kCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        kCell.border = STYLES.cellBorder;
        kCell.alignment = { vertical: 'middle', horizontal: 'left' };
        vCell.font = { name: 'Calibri', size: 10 };
        vCell.border = STYLES.cellBorder;
        vCell.alignment = { vertical: 'middle', horizontal: 'left' };
      });

      // TAB 2: Stratigraphic SPT (Merged Depth representation)
      const wsStratSPT = wb.addWorksheet('Stratigraphic SPT');
      wsStratSPT.columns = [
        { header: 'Stratum', key: 'stratum', width: 10 },
        { header: 'Top Depth (m)', key: 'top_m', width: 14 },
        { header: 'Bottom Depth (m)', key: 'bottom_m', width: 16 },
        { header: 'Soil Class', key: 'class', width: 12 },
        { header: 'USCS Type', key: 'uscs', width: 12 },
        { header: 'Soil Description', key: 'description', width: 42 },
        { header: 'Depth (m)', key: 'depth_m', width: 12 },
        { header: '150mm', key: 'blows_0_150', width: 10 },
        { header: '300mm', key: 'blows_150_300', width: 10 },
        { header: '450mm', key: 'blows_300_450', width: 10 },
        { header: 'N-Value', key: 'n_value', width: 12 }
      ];
      styleHeader(wsStratSPT);

      let currentRow = 2;
      const assignedSptIndices = new Set();

      // Iterate through strata
      strata.forEach((s, idx) => {
        const top = parseFloat(s.top_m) || 0;
        const bot = parseFloat(s.bottom_m) || 0;
        const stratumColor = getStratumColor(s.class || s.type_uscs);
        const argbFill = hexToARGB(stratumColor);

        // SPT tests falling into this stratum
        const sptsInLayer = [];
        sptRecords.forEach((spt, sptIdx) => {
          if (assignedSptIndices.has(sptIdx)) return;
          const d = parseFloat(spt.depth_m) || 0;
          const belongs = (idx === 0) ? (d >= top && d <= bot) : (d > top && d <= bot);
          if (belongs) {
            assignedSptIndices.add(sptIdx);
            sptsInLayer.push(spt);
          }
        });
        sptsInLayer.sort((a, b) => (parseFloat(a.depth_m) || 0) - (parseFloat(b.depth_m) || 0));

        // Build row items for this stratum
        const layerRows = [];
        sptsInLayer.forEach(spt => {
          layerRows.push({
            depth_m: spt.depth_m,
            blows_0_150: spt.blows_0_150 !== undefined ? spt.blows_0_150 : '',
            blows_150_300: spt.blows_150_300 !== undefined ? spt.blows_150_300 : '',
            blows_300_450: spt.blows_300_450 !== undefined ? spt.blows_300_450 : '',
            n_value: spt.n_value !== undefined ? spt.n_value : '',
            isBoundary: false
          });
        });

        // If the bottom boundary depth doesn't have an SPT test, order it next as empty SPT row
        const lastSptDepth = sptsInLayer.length > 0 ? parseFloat(sptsInLayer[sptsInLayer.length - 1].depth_m) : -1;
        if (Math.abs(lastSptDepth - bot) > 0.001) {
          layerRows.push({
            depth_m: bot,
            blows_0_150: '',
            blows_150_300: '',
            blows_300_450: '',
            n_value: '',
            isBoundary: true
          });
        }

        const startRow = currentRow;
        const endRow = currentRow + layerRows.length - 1;

        layerRows.forEach(item => {
          const r = wsStratSPT.getRow(currentRow);
          r.height = 22;
          r.getCell(1).value = s.stratum !== undefined ? s.stratum : (idx + 1);
          r.getCell(2).value = top;
          r.getCell(3).value = bot;
          r.getCell(4).value = s.class || '';
          r.getCell(5).value = s.type_uscs || s.class || '';
          r.getCell(6).value = s.description || '';
          r.getCell(7).value = item.depth_m;
          r.getCell(8).value = item.blows_0_150;
          r.getCell(9).value = item.blows_150_300;
          r.getCell(10).value = item.blows_300_450;
          r.getCell(11).value = item.n_value;
          currentRow++;
        });

        // Vertically merge stratum-related columns (1 to 6)
        for (let c = 1; c <= 6; c++) {
          if (endRow > startRow) {
            wsStratSPT.mergeCells(startRow, c, endRow, c);
          }
          for (let r = startRow; r <= endRow; r++) {
            const cell = wsStratSPT.getCell(r, c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbFill } };
            cell.border = STYLES.stratumBorder;
            cell.font = { name: 'Calibri', size: 10, bold: (c === 1 || c === 4) };
            cell.alignment = {
              vertical: 'middle',
              horizontal: (c === 6 ? 'left' : 'center'),
              wrapText: true
            };
          }
        }

        // Format SPT record columns (7 to 11)
        for (let r = startRow; r <= endRow; r++) {
          for (let c = 7; c <= 11; c++) {
            const cell = wsStratSPT.getCell(r, c);
            cell.border = STYLES.cellBorder;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.font = { name: 'Calibri', size: 10, bold: (c === 7 || c === 11) };
          }
        }
      });

      // Handle any trailing SPT records beyond known strata
      sptRecords.forEach((spt, sptIdx) => {
        if (!assignedSptIndices.has(sptIdx)) {
          const r = wsStratSPT.getRow(currentRow);
          r.height = 22;
          r.getCell(1).value = '-';
          r.getCell(2).value = '-';
          r.getCell(3).value = '-';
          r.getCell(4).value = getStratumAtDepth(spt.depth_m);
          r.getCell(5).value = '';
          r.getCell(6).value = 'Extended Boring Test';
          r.getCell(7).value = spt.depth_m;
          r.getCell(8).value = spt.blows_0_150 !== undefined ? spt.blows_0_150 : '';
          r.getCell(9).value = spt.blows_150_300 !== undefined ? spt.blows_150_300 : '';
          r.getCell(10).value = spt.blows_300_450 !== undefined ? spt.blows_300_450 : '';
          r.getCell(11).value = spt.n_value !== undefined ? spt.n_value : '';
          for (let c = 1; c <= 11; c++) {
            const cell = r.getCell(c);
            cell.border = STYLES.cellBorder;
            cell.alignment = { vertical: 'middle', horizontal: (c === 6 ? 'left' : 'center') };
            cell.font = { name: 'Calibri', size: 10, bold: (c === 7 || c === 11) };
          }
          currentRow++;
        }
      });

      // TAB 3: Stratigraphy
      if (strata.length > 0) {
        const wsStrat = wb.addWorksheet('Stratigraphy');
        wsStrat.columns = [
          { header: 'Stratum', key: 'stratum', width: 10 },
          { header: 'Top Depth (m)', key: 'top_m', width: 14 },
          { header: 'Bottom Depth (m)', key: 'bottom_m', width: 16 },
          { header: 'Thickness (m)', key: 'thickness_m', width: 14 },
          { header: 'Soil Class', key: 'class', width: 12 },
          { header: 'USCS Type', key: 'type_uscs', width: 12 },
          { header: 'Description', key: 'description', width: 45 }
        ];
        styleHeader(wsStrat);
        strata.forEach((s, idx) => {
          const top = parseFloat(s.top_m) || 0;
          const bot = parseFloat(s.bottom_m) || 0;
          const thick = parseFloat((bot - top).toFixed(2));
          const row = wsStrat.addRow({
            stratum: s.stratum !== undefined ? s.stratum : (idx + 1),
            top_m: top,
            bottom_m: bot,
            thickness_m: thick,
            class: s.class || '',
            type_uscs: s.type_uscs || s.class || '',
            description: s.description || ''
          });
          row.height = 24;
          const argb = hexToARGB(getStratumColor(s.class || s.type_uscs));
          row.eachCell((cell, colNum) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb } };
            cell.border = STYLES.stratumBorder;
            cell.font = { name: 'Calibri', size: 10, bold: (colNum === 1 || colNum === 5) };
            cell.alignment = { vertical: 'middle', horizontal: (colNum === 7 ? 'left' : 'center'), wrapText: true };
          });
        });
      }

      // TAB 4: SPT Records
      if (sptRecords.length > 0) {
        const wsSpt = wb.addWorksheet('SPT_Records');
        wsSpt.columns = [
          { header: 'Depth (m)', key: 'depth_m', width: 12 },
          { header: 'Soil Class', key: 'soil_class', width: 12 },
          { header: '150mm (Seating)', key: 'blows_0_150', width: 16 },
          { header: '300mm', key: 'blows_150_300', width: 12 },
          { header: '450mm', key: 'blows_300_450', width: 12 },
          { header: 'N-Value', key: 'n_value', width: 12 }
        ];
        styleHeader(wsSpt);
        sptRecords.forEach(spt => {
          const row = wsSpt.addRow({
            depth_m: spt.depth_m,
            soil_class: getStratumAtDepth(spt.depth_m),
            blows_0_150: spt.blows_0_150 !== undefined ? spt.blows_0_150 : '',
            blows_150_300: spt.blows_150_300 !== undefined ? spt.blows_150_300 : '',
            blows_300_450: spt.blows_300_450 !== undefined ? spt.blows_300_450 : '',
            n_value: spt.n_value !== undefined ? spt.n_value : ''
          });
          row.height = 20;
          row.eachCell((cell, colNum) => {
            cell.border = STYLES.cellBorder;
            cell.font = { name: 'Calibri', size: 10, bold: (colNum === 1 || colNum === 6) };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        });
      }

      // TAB 5: Grain Size Analysis (with Gravel fraction)
      const grainSizeData = properties.grain_size_analysis_data || properties.grain_size_analysis || [];
      if (grainSizeData && grainSizeData.length > 0) {
        const wsGrain = wb.addWorksheet('Grain_Size_Analysis');
        wsGrain.columns = [
          { header: 'Depth (m)', key: 'depth_m', width: 12 },
          { header: 'Soil Class', key: 'soil_class', width: 12 },
          { header: 'Gravel (%)', key: 'gravel', width: 12 },
          { header: 'Sand (%)', key: 'sand', width: 12 },
          { header: 'Silt (%)', key: 'silt', width: 12 },
          { header: 'Clay (%)', key: 'clay', width: 12 },
          { header: 'Total (%)', key: 'total', width: 12 }
        ];
        styleHeader(wsGrain);
        grainSizeData.forEach(test => {
          const gr = parseFloat(test.gravel) || 0;
          const sa = parseFloat(test.sand) || 0;
          const si = parseFloat(test.silt) || 0;
          const cl = parseFloat(test.clay) || 0;
          const tot = parseFloat((gr + sa + si + cl).toFixed(2));
          const row = wsGrain.addRow({
            depth_m: test.depth_m,
            soil_class: getStratumAtDepth(test.depth_m),
            gravel: gr,
            sand: sa,
            silt: si,
            clay: cl,
            total: tot
          });
          row.height = 20;
          row.eachCell((cell, colNum) => {
            cell.border = STYLES.cellBorder;
            cell.font = { name: 'Calibri', size: 10, bold: (colNum === 1 || colNum === 7) };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        });
      }

      // TAB 6: Atterberg Limits & Specific Gravity
      const atterbergData = properties.atterberg_test_data || properties.atterberg_limits || [];
      if (atterbergData && atterbergData.length > 0) {
        const wsAtt = wb.addWorksheet('Atterberg_Tests');
        wsAtt.columns = [
          { header: 'Depth (m)', key: 'depth_m', width: 12 },
          { header: 'Soil Class', key: 'soil_class', width: 12 },
          { header: 'Liquid Limit (LL, %)', key: 'll', width: 18 },
          { header: 'Plastic Limit (PL, %)', key: 'pl', width: 18 },
          { header: 'Plasticity Index (PI)', key: 'pi', width: 18 },
          { header: 'Water Content (w_c, %)', key: 'wc', width: 18 },
          { header: 'Liquidity Index (LI)', key: 'li', width: 18 },
          { header: 'Specific Gravity (G)', key: 'gr', width: 18 }
        ];
        styleHeader(wsAtt);
        atterbergData.forEach(test => {
          const ll = test.ll !== undefined ? test.ll : (test.liquid_limit !== undefined ? test.liquid_limit : test.wl);
          const pl = test.pl !== undefined ? test.pl : (test.plastic_limit !== undefined ? test.plastic_limit : test.wp);
          const wc = test.wc !== undefined ? test.wc : test.water_content;
          let pi = test.pi !== undefined ? test.pi : (test.ip !== undefined ? test.ip : test.plasticity_index);
          if (pi === undefined && ll !== undefined && pl !== undefined && !isNaN(parseFloat(ll)) && !isNaN(parseFloat(pl))) {
            pi = parseFloat((parseFloat(ll) - parseFloat(pl)).toFixed(2));
          }
          let li = test.li !== undefined ? test.li : test.liquidity_index;
          if (li === undefined && wc !== undefined && pl !== undefined && pi && !isNaN(parseFloat(wc)) && !isNaN(parseFloat(pl)) && parseFloat(pi) !== 0) {
            li = parseFloat(((parseFloat(wc) - parseFloat(pl)) / parseFloat(pi)).toFixed(3));
          }
          const gr = test.gr !== undefined ? test.gr : (test.g !== undefined ? test.g : (test.specific_gravity !== undefined ? test.specific_gravity : test.G));
          const row = wsAtt.addRow({
            depth_m: test.depth_m,
            soil_class: getStratumAtDepth(test.depth_m),
            ll: ll !== undefined ? ll : '',
            pl: pl !== undefined ? pl : '',
            pi: pi !== undefined ? pi : '',
            wc: wc !== undefined ? wc : '',
            li: li !== undefined ? li : '',
            gr: gr !== undefined ? gr : ''
          });
          row.height = 20;
          row.eachCell((cell, colNum) => {
            cell.border = STYLES.cellBorder;
            cell.font = { name: 'Calibri', size: 10, bold: (colNum === 1) };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        });
      }

      // TAB 7: Consolidation Tests
      const consolData = properties.consolidation_test_data || properties.consolidation_tests || [];
      if (consolData && consolData.length > 0) {
        const wsConsol = wb.addWorksheet('Consolidation_Tests');
        wsConsol.columns = [
          { header: 'Depth (m)', key: 'depth_m', width: 12 },
          { header: 'Soil Class', key: 'soil_class', width: 12 },
          { header: 'Vertical Eff Stress (kPa)', key: 'sigma_v', width: 22 },
          { header: 'Constrained Modulus (MPa)', key: 'eoed', width: 24 },
          { header: 'Compression Index (Cc)', key: 'cc', width: 20 },
          { header: 'Recompression Index (Cr)', key: 'cr', width: 22 },
          { header: 'Preconsolidation P (kPa)', key: 'pc', width: 22 },
          { header: 'Void Ratio (e)', key: 'void_ratio', width: 16 },
          { header: 'Cv (m²/yr)', key: 'cv', width: 16 }
        ];
        styleHeader(wsConsol);
        consolData.forEach(test => {
          const row = wsConsol.addRow({
            depth_m: test.depth_m,
            soil_class: getStratumAtDepth(test.depth_m),
            sigma_v: test.vertical_effective_stress_kpa !== undefined ? test.vertical_effective_stress_kpa : '',
            eoed: test.constrained_modulus_eoed_mpa !== undefined ? test.constrained_modulus_eoed_mpa : '',
            cc: test.compression_index !== undefined ? test.compression_index : '',
            cr: test.recompression_index !== undefined ? test.recompression_index : '',
            pc: test.preconsolidation_pressure_kpa !== undefined ? test.preconsolidation_pressure_kpa : '',
            void_ratio: test.void_ratio !== undefined ? test.void_ratio : '',
            cv: test.coefficient_of_consolidation_m2_per_year !== undefined ? test.coefficient_of_consolidation_m2_per_year : ''
          });
          row.height = 20;
          row.eachCell((cell, colNum) => {
            cell.border = STYLES.cellBorder;
            cell.font = { name: 'Calibri', size: 10, bold: (colNum === 1) };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        });
      }

      // TAB 8: CPT Tests
      const cptData = properties.cpt_data || properties.cpt_records || [];
      if (cptData && cptData.length > 0) {
        const wsCpt = wb.addWorksheet('CPT_Tests');
        wsCpt.columns = [
          { header: 'Depth (m)', key: 'depth_m', width: 12 },
          { header: 'Soil Class', key: 'soil_class', width: 12 },
          { header: 'Cone Resistance qc (MPa)', key: 'qc_mpa', width: 22 },
          { header: 'Sleeve Friction fs (kPa)', key: 'fs_kpa', width: 22 },
          { header: 'Friction Ratio Rf (%)', key: 'rf_percent', width: 18 },
          { header: 'Pore Pressure u2 (kPa)', key: 'u2_kpa', width: 20 }
        ];
        styleHeader(wsCpt);
        cptData.forEach(test => {
          const row = wsCpt.addRow({
            depth_m: test.depth_m,
            soil_class: getStratumAtDepth(test.depth_m),
            qc_mpa: test.qc_mpa !== undefined ? test.qc_mpa : '',
            fs_kpa: test.fs_kpa !== undefined ? test.fs_kpa : '',
            rf_percent: test.rf_percent !== undefined ? test.rf_percent : '',
            u2_kpa: test.u2_kpa !== undefined ? test.u2_kpa : ''
          });
          row.height = 20;
          row.eachCell((cell, colNum) => {
            cell.border = STYLES.cellBorder;
            cell.font = { name: 'Calibri', size: 10, bold: (colNum === 1) };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        });
      }

      // TAB 9: Direct Shear Tests
      const shearData = properties.direct_shear_test_data || properties.direct_shear_tests || [];
      if (shearData && shearData.length > 0) {
        const wsShear = wb.addWorksheet('Direct_Shear_Tests');
        wsShear.columns = [
          { header: 'Depth (m)', key: 'depth_m', width: 12 },
          { header: 'Soil Class', key: 'soil_class', width: 12 },
          { header: "Normal Stress σ'n (kPa)", key: 'normal_stress_kpa', width: 22 },
          { header: 'Shear Stress τ (kPa)', key: 'shear_stress_kpa', width: 20 },
          { header: 'Cohesion c (kPa)', key: 'cohesion_kpa', width: 18 },
          { header: 'Friction Angle φ (°)', key: 'friction_angle_deg', width: 18 }
        ];
        styleHeader(wsShear);
        shearData.forEach(test => {
          const row = wsShear.addRow({
            depth_m: test.depth_m,
            soil_class: getStratumAtDepth(test.depth_m),
            normal_stress_kpa: test.normal_stress_kpa !== undefined ? test.normal_stress_kpa : '',
            shear_stress_kpa: test.shear_stress_kpa !== undefined ? test.shear_stress_kpa : '',
            cohesion_kpa: test.cohesion_kpa !== undefined ? test.cohesion_kpa : '',
            friction_angle_deg: test.friction_angle_deg !== undefined ? test.friction_angle_deg : ''
          });
          row.height = 20;
          row.eachCell((cell, colNum) => {
            cell.border = STYLES.cellBorder;
            cell.font = { name: 'Calibri', size: 10, bold: (colNum === 1) };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        });
      }

      // TAB 10: Triaxial Tests
      const triaxData = properties.triaxial_test_data || properties.triaxial_tests || [];
      if (triaxData && triaxData.length > 0) {
        const wsTriax = wb.addWorksheet('Triaxial_Tests');
        wsTriax.columns = [
          { header: 'Depth (m)', key: 'depth_m', width: 12 },
          { header: 'Soil Class', key: 'soil_class', width: 12 },
          { header: 'Test Type', key: 'test_type', width: 14 },
          { header: "Eff Confining Stress σ'3 (kPa)", key: 'effective_confining_stress_kpa', width: 26 },
          { header: 'Peak Deviator Stress q (kPa)', key: 'peak_deviator_stress_kpa', width: 25 },
          { header: 'Secant Modulus E50 (MPa)', key: 'secant_modulus_e50_mpa', width: 24 }
        ];
        styleHeader(wsTriax);
        triaxData.forEach(test => {
          const row = wsTriax.addRow({
            depth_m: test.depth_m,
            soil_class: getStratumAtDepth(test.depth_m),
            test_type: test.test_type || '',
            effective_confining_stress_kpa: test.effective_confining_stress_kpa !== undefined ? test.effective_confining_stress_kpa : '',
            peak_deviator_stress_kpa: test.peak_deviator_stress_kpa !== undefined ? test.peak_deviator_stress_kpa : '',
            secant_modulus_e50_mpa: test.secant_modulus_e50_mpa !== undefined ? test.secant_modulus_e50_mpa : ''
          });
          row.height = 20;
          row.eachCell((cell, colNum) => {
            cell.border = STYLES.cellBorder;
            cell.font = { name: 'Calibri', size: 10, bold: (colNum === 1) };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        });
      }

      // TAB 11+: Generic Extra Tests Discovery
      const handledKeys = new Set([
        'strata', 'stratigraphy', 'spt_data', 'spt_records',
        'grain_size_analysis_data', 'grain_size_analysis',
        'atterberg_test_data', 'atterberg_limits',
        'consolidation_test_data', 'consolidation_tests',
        'cpt_data', 'cpt_records',
        'direct_shear_test_data', 'direct_shear_tests',
        'triaxial_test_data', 'triaxial_tests'
      ]);

      Object.keys(properties).forEach(key => {
        if (handledKeys.has(key)) return;
        if (Array.isArray(properties[key]) && properties[key].length > 0 && typeof properties[key][0] === 'object') {
          let sheetName = key.replace(/_test_data$/i, '').replace(/_tests?$/i, '').replace(/_/g, ' ');
          sheetName = sheetName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
          sheetName = (sheetName + '_Tests').slice(0, 31);

          const dataArr = properties[key];
          const itemKeys = Object.keys(dataArr[0]);
          const extraCols = [
            { header: 'Depth (m)', key: 'depth_m', width: 12 },
            { header: 'Soil Class', key: 'soil_class', width: 12 }
          ];
          itemKeys.forEach(k => {
            if (k === 'depth_m') return;
            const h = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            extraCols.push({ header: h, key: k, width: Math.max(14, h.length + 4) });
          });

          const wsExtra = wb.addWorksheet(sheetName);
          wsExtra.columns = extraCols;
          styleHeader(wsExtra);

          dataArr.forEach(item => {
            const rowObj = {
              depth_m: item.depth_m !== undefined ? item.depth_m : '',
              soil_class: getStratumAtDepth(item.depth_m)
            };
            itemKeys.forEach(k => {
              if (k !== 'depth_m') rowObj[k] = item[k] !== undefined ? item[k] : '';
            });
            const row = wsExtra.addRow(rowObj);
            row.height = 20;
            row.eachCell((cell, colNum) => {
              cell.border = STYLES.cellBorder;
              cell.font = { name: 'Calibri', size: 10, bold: (colNum === 1) };
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
          });
        }
      });

      // Write and trigger download
      const buffer = await wb.xlsx.writeBuffer();
      triggerDownload(buffer, filename);
      return;
    }

    // =========================================================================
    // FALLBACK ENGINE: SheetJS (XLSX)
    // =========================================================================
    const LibXLSX = (typeof window !== 'undefined' && window.XLSX) ? window.XLSX : ((typeof XLSX !== 'undefined') ? XLSX : null);
    if (LibXLSX) {
      const wb = LibXLSX.utils.book_new();

      // Tab 1: Metadata
      const wsMeta = LibXLSX.utils.aoa_to_sheet([['Property', 'Value'], ...metadataItems]);
      wsMeta['!cols'] = [{ wch: 25 }, { wch: 45 }];
      LibXLSX.utils.book_append_sheet(wb, wsMeta, 'Metadata');

      // Tab 2: Stratigraphic SPT
      const stratSptRows = [
        ['Stratum', 'Top Depth (m)', 'Bottom Depth (m)', 'Soil Class', 'USCS Type', 'Soil Description', 'Depth (m)', '150mm', '300mm', '450mm', 'N-Value']
      ];
      const merges = [];
      let curRowIdx = 1;
      const assignedSptIndices = new Set();

      strata.forEach((s, idx) => {
        const top = parseFloat(s.top_m) || 0;
        const bot = parseFloat(s.bottom_m) || 0;
        const sptsInLayer = [];
        sptRecords.forEach((spt, sptIdx) => {
          if (assignedSptIndices.has(sptIdx)) return;
          const d = parseFloat(spt.depth_m) || 0;
          const belongs = (idx === 0) ? (d >= top && d <= bot) : (d > top && d <= bot);
          if (belongs) {
            assignedSptIndices.add(sptIdx);
            sptsInLayer.push(spt);
          }
        });
        sptsInLayer.sort((a, b) => (parseFloat(a.depth_m) || 0) - (parseFloat(b.depth_m) || 0));

        const layerRows = [];
        sptsInLayer.forEach(spt => {
          layerRows.push([
            s.stratum !== undefined ? s.stratum : (idx + 1),
            top,
            bot,
            s.class || '',
            s.type_uscs || s.class || '',
            s.description || '',
            spt.depth_m,
            spt.blows_0_150 !== undefined ? spt.blows_0_150 : '',
            spt.blows_150_300 !== undefined ? spt.blows_150_300 : '',
            spt.blows_300_450 !== undefined ? spt.blows_300_450 : '',
            spt.n_value !== undefined ? spt.n_value : ''
          ]);
        });

        const lastSptDepth = sptsInLayer.length > 0 ? parseFloat(sptsInLayer[sptsInLayer.length - 1].depth_m) : -1;
        if (Math.abs(lastSptDepth - bot) > 0.001) {
          layerRows.push([
            s.stratum !== undefined ? s.stratum : (idx + 1),
            top,
            bot,
            s.class || '',
            s.type_uscs || s.class || '',
            s.description || '',
            bot,
            '', '', '', ''
          ]);
        }

        const startRow = curRowIdx;
        const endRow = curRowIdx + layerRows.length - 1;
        layerRows.forEach(r => {
          stratSptRows.push(r);
          curRowIdx++;
        });

        if (endRow > startRow) {
          for (let c = 0; c <= 5; c++) {
            merges.push({ s: { r: startRow, c: c }, e: { r: endRow, c: c } });
          }
        }
      });

      const wsStratSPT = LibXLSX.utils.aoa_to_sheet(stratSptRows);
      wsStratSPT['!merges'] = merges;
      wsStratSPT['!cols'] = [
        { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 40 },
        { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }
      ];
      LibXLSX.utils.book_append_sheet(wb, wsStratSPT, 'Stratigraphic SPT');

      // Tab 3: Stratigraphy
      if (strata.length > 0) {
        const stratData = strata.map((s, idx) => ({
          'Stratum': s.stratum !== undefined ? s.stratum : (idx + 1),
          'Top Depth (m)': s.top_m,
          'Bottom Depth (m)': s.bottom_m,
          'Thickness (m)': parseFloat(((parseFloat(s.bottom_m) || 0) - (parseFloat(s.top_m) || 0)).toFixed(2)),
          'Soil Class': s.class || '',
          'USCS Type': s.type_uscs || s.class || '',
          'Description': s.description || ''
        }));
        const wsStrat = LibXLSX.utils.json_to_sheet(stratData);
        wsStrat['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 45 }];
        LibXLSX.utils.book_append_sheet(wb, wsStrat, 'Stratigraphy');
      }

      // Tab 4: SPT Records
      if (sptRecords.length > 0) {
        const sptExport = sptRecords.map(spt => ({
          'Depth (m)': spt.depth_m,
          'Soil Class': getStratumAtDepth(spt.depth_m),
          '150mm (Seating)': spt.blows_0_150 !== undefined ? spt.blows_0_150 : '',
          '300mm': spt.blows_150_300 !== undefined ? spt.blows_150_300 : '',
          '450mm': spt.blows_300_450 !== undefined ? spt.blows_300_450 : '',
          'N-Value': spt.n_value !== undefined ? spt.n_value : ''
        }));
        const wsSpt = LibXLSX.utils.json_to_sheet(sptExport);
        wsSpt['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
        LibXLSX.utils.book_append_sheet(wb, wsSpt, 'SPT_Records');
      }

      // Tab 5: Grain Size Analysis
      const grainSizeData = properties.grain_size_analysis_data || properties.grain_size_analysis || [];
      if (grainSizeData && grainSizeData.length > 0) {
        const grainExport = grainSizeData.map(test => {
          const gr = parseFloat(test.gravel) || 0;
          const sa = parseFloat(test.sand) || 0;
          const si = parseFloat(test.silt) || 0;
          const cl = parseFloat(test.clay) || 0;
          return {
            'Depth (m)': test.depth_m,
            'Soil Class': getStratumAtDepth(test.depth_m),
            'Gravel (%)': gr,
            'Sand (%)': sa,
            'Silt (%)': si,
            'Clay (%)': cl,
            'Total (%)': parseFloat((gr + sa + si + cl).toFixed(2))
          };
        });
        const wsGrain = LibXLSX.utils.json_to_sheet(grainExport);
        wsGrain['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
        LibXLSX.utils.book_append_sheet(wb, wsGrain, 'Grain_Size_Analysis');
      }

      // Tab 6: Atterberg Tests
      const atterbergData = properties.atterberg_test_data || properties.atterberg_limits || [];
      if (atterbergData && atterbergData.length > 0) {
        const attExport = atterbergData.map(test => {
          const ll = test.ll !== undefined ? test.ll : (test.liquid_limit !== undefined ? test.liquid_limit : test.wl);
          const pl = test.pl !== undefined ? test.pl : (test.plastic_limit !== undefined ? test.plastic_limit : test.wp);
          const wc = test.wc !== undefined ? test.wc : test.water_content;
          let pi = test.pi !== undefined ? test.pi : (test.ip !== undefined ? test.ip : test.plasticity_index);
          if (pi === undefined && ll !== undefined && pl !== undefined && !isNaN(parseFloat(ll)) && !isNaN(parseFloat(pl))) {
            pi = parseFloat((parseFloat(ll) - parseFloat(pl)).toFixed(2));
          }
          let li = test.li !== undefined ? test.li : test.liquidity_index;
          if (li === undefined && wc !== undefined && pl !== undefined && pi && !isNaN(parseFloat(wc)) && !isNaN(parseFloat(pl)) && parseFloat(pi) !== 0) {
            li = parseFloat(((parseFloat(wc) - parseFloat(pl)) / parseFloat(pi)).toFixed(3));
          }
          const gr = test.gr !== undefined ? test.gr : (test.g !== undefined ? test.g : (test.specific_gravity !== undefined ? test.specific_gravity : test.G));
          return {
            'Depth (m)': test.depth_m,
            'Soil Class': getStratumAtDepth(test.depth_m),
            'Liquid Limit (LL, %)': ll !== undefined ? ll : '',
            'Plastic Limit (PL, %)': pl !== undefined ? pl : '',
            'Plasticity Index (PI)': pi !== undefined ? pi : '',
            'Water Content (w_c, %)': wc !== undefined ? wc : '',
            'Liquidity Index (LI)': li !== undefined ? li : '',
            'Specific Gravity (G)': gr !== undefined ? gr : ''
          };
        });
        const wsAtt = LibXLSX.utils.json_to_sheet(attExport);
        LibXLSX.utils.book_append_sheet(wb, wsAtt, 'Atterberg_Tests');
      }

      // Tab 7: Consolidation Tests
      const consolData = properties.consolidation_test_data || properties.consolidation_tests || [];
      if (consolData && consolData.length > 0) {
        const consolExport = consolData.map(test => ({
          'Depth (m)': test.depth_m,
          'Soil Class': getStratumAtDepth(test.depth_m),
          'Vertical Eff Stress (kPa)': test.vertical_effective_stress_kpa !== undefined ? test.vertical_effective_stress_kpa : '',
          'Constrained Modulus (MPa)': test.constrained_modulus_eoed_mpa !== undefined ? test.constrained_modulus_eoed_mpa : '',
          'Compression Index (Cc)': test.compression_index !== undefined ? test.compression_index : '',
          'Recompression Index (Cr)': test.recompression_index !== undefined ? test.recompression_index : '',
          'Preconsolidation P (kPa)': test.preconsolidation_pressure_kpa !== undefined ? test.preconsolidation_pressure_kpa : '',
          'Void Ratio (e)': test.void_ratio !== undefined ? test.void_ratio : '',
          'Cv (m2/yr)': test.coefficient_of_consolidation_m2_per_year !== undefined ? test.coefficient_of_consolidation_m2_per_year : ''
        }));
        const wsConsol = LibXLSX.utils.json_to_sheet(consolExport);
        LibXLSX.utils.book_append_sheet(wb, wsConsol, 'Consolidation_Tests');
      }

      // Tab 8: CPT Tests
      const cptData = properties.cpt_data || properties.cpt_records || [];
      if (cptData && cptData.length > 0) {
        const cptExport = cptData.map(test => ({
          'Depth (m)': test.depth_m,
          'Soil Class': getStratumAtDepth(test.depth_m),
          'Cone Resistance, qc (MPa)': test.qc_mpa !== undefined ? test.qc_mpa : '',
          'Sleeve Friction, fs (kPa)': test.fs_kpa !== undefined ? test.fs_kpa : '',
          'Friction Ratio, Rf (%)': test.rf_percent !== undefined ? test.rf_percent : '',
          'Pore Pressure, u2 (kPa)': test.u2_kpa !== undefined ? test.u2_kpa : ''
        }));
        const wsCpt = LibXLSX.utils.json_to_sheet(cptExport);
        LibXLSX.utils.book_append_sheet(wb, wsCpt, 'CPT_Tests');
      }

      // Tab 9: Direct Shear Tests
      const shearData = properties.direct_shear_test_data || properties.direct_shear_tests || [];
      if (shearData && shearData.length > 0) {
        const shearExport = shearData.map(test => ({
          'Depth (m)': test.depth_m,
          'Soil Class': getStratumAtDepth(test.depth_m),
          'Normal Stress (kPa)': test.normal_stress_kpa !== undefined ? test.normal_stress_kpa : '',
          'Shear Stress (kPa)': test.shear_stress_kpa !== undefined ? test.shear_stress_kpa : '',
          'Cohesion (kPa)': test.cohesion_kpa !== undefined ? test.cohesion_kpa : '',
          'Friction Angle (deg)': test.friction_angle_deg !== undefined ? test.friction_angle_deg : ''
        }));
        const wsShear = LibXLSX.utils.json_to_sheet(shearExport);
        LibXLSX.utils.book_append_sheet(wb, wsShear, 'Direct_Shear_Tests');
      }

      // Tab 10: Triaxial Tests
      const triaxData = properties.triaxial_test_data || properties.triaxial_tests || [];
      if (triaxData && triaxData.length > 0) {
        const triaxExport = triaxData.map(test => ({
          'Depth (m)': test.depth_m,
          'Soil Class': getStratumAtDepth(test.depth_m),
          'Test Type': test.test_type || '',
          'Eff Confining Stress (kPa)': test.effective_confining_stress_kpa !== undefined ? test.effective_confining_stress_kpa : '',
          'Peak Deviator Stress (kPa)': test.peak_deviator_stress_kpa !== undefined ? test.peak_deviator_stress_kpa : '',
          'Secant Modulus E50 (MPa)': test.secant_modulus_e50_mpa !== undefined ? test.secant_modulus_e50_mpa : ''
        }));
        const wsTriax = LibXLSX.utils.json_to_sheet(triaxExport);
        LibXLSX.utils.book_append_sheet(wb, wsTriax, 'Triaxial_Tests');
      }

      LibXLSX.writeFile(wb, filename);
    }
  };
})();
