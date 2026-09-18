import * as XLSX from 'xlsx';

export const exportBorelogToExcel = (properties) => {
  const wb = XLSX.utils.book_new();

  // Helper: Find stratum class for a given depth
  const getStratumAtDepth = (depth) => {
    const layer = properties.strata.find(s => depth >= s.top_m && depth <= s.bottom_m);
    return layer ? layer.class : 'N/A';
  };

  // TAB 1: Project Metadata & SPT
  const metadata = [
    ["Borehole ID", properties.borehole_id],
    ["Project", properties.project],
    ["Client", properties.client],
    ["Coordinates (EPSG:4326)", `${properties.lat}, ${properties.lng}`], // EPSG:4326 standard
    ["Elevation (m MSL)", properties.rl_m],
    ["Drill Rig", properties.drill_rig],
    ["Supervisor", properties.supervisor],
    [], ["SPT Records"]
  ];
  
  const sptData = properties.spt_records.map(spt => ({
    "Depth (m)": spt.depth_m,
    "Soil Class": getStratumAtDepth(spt.depth_m),
    "150mm": spt.blows_150,
    "300mm": spt.blows_300,
    "450mm": spt.blows_450,
    "N-Value": spt.n_value
  }));
  
  const ws1 = XLSX.utils.aoa_to_sheet(metadata);
  XLSX.utils.sheet_add_json(ws1, sptData, { origin: "A10" });
  XLSX.utils.book_append_sheet(wb, ws1, "Metadata_and_SPT");

  // TAB 2: Atterberg Limits
  if (properties.atterberg_test_data) {
    const atterbergData = properties.atterberg_test_data.map(test => ({
      "Depth (m)": test.depth_m,
      "Soil Class": getStratumAtDepth(test.depth_m),
      "Liquid Limit (LL)": test.wl,
      "Plastic Limit (PL)": test.wp,
      "Plasticity Index (PI)": test.ip
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(atterbergData), "Atterberg_Tests");
  }

  // TAB 3: Consolidation & Odeometric
  if (properties.consolidation_test_data) {
    const consolData = properties.consolidation_test_data.map(test => ({
      "Depth (m)": test.depth_m,
      "Soil Class": getStratumAtDepth(test.depth_m),
      "Void Ratio": test.void_ratio,
      "Cv (m2/yr)": test.coefficient_of_consolidation_m2_per_year
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(consolData), "Consolidation_Tests");
  }

  // Generate and Trigger Download
  XLSX.writeFile(wb, `${properties.borehole_id}_Borelog_Data.xlsx`);
};