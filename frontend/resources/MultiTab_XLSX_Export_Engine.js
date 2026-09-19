

window.exportBorelogToXLSX = function(feature, uid) {
  const properties = feature.properties || feature;
  const coords = feature.geometry && feature.geometry.coordinates ? feature.geometry.coordinates : [0, 0];
  const wb = XLSX.utils.book_new();

  // Helper: Find stratum class for a given depth
  const getStratumAtDepth = (depth) => {
    const layer = (properties.stratigraphy || []).find(s => depth >= s.top_m && depth <= s.bottom_m);
    return layer ? layer.class : 'N/A';
  };

  // TAB 1: Project Metadata & SPT
  const metadata = [
    ["Borelog ID", properties.borelog_id],
    ["Project", properties.project],
    ["Client", properties.client],
    ["Coordinates (EPSG:4326)", `${coords[1]}, ${coords[0]}`], // EPSG:4326 standard
    ["Elevation (m MSL)", properties.rl_m],
    ["Drill Rig", properties.drill_rig],
    ["Supervisor", properties.supervisor]
  ];
  
  const sptData = (properties.spt_data || []).map(spt => ({
    "Depth (m)": spt.depth_m,
    "Soil Class": getStratumAtDepth(spt.depth_m),
    "150mm": spt.blows_0_150,
    "300mm": spt.blows_150_300,
    "450mm": spt.blows_300_450,
    "N-Value": spt.n_value
  }));
  
  const ws1 = XLSX.utils.aoa_to_sheet(metadata);
  XLSX.utils.book_append_sheet(wb, ws1, "Metadata");
  
  if (properties.stratigraphy && properties.stratigraphy.length > 0) {
    const stratData = properties.stratigraphy.map(s => ({
      "Top Depth (m)": s.top_m,
      "Bottom Depth (m)": s.bottom_m,
      "Soil Class": s.class,
      "USCS Type": s.type_uscs,
      "Description": s.description
    }));
    const wsStrat = XLSX.utils.json_to_sheet(stratData);
    XLSX.utils.book_append_sheet(wb, wsStrat, "Stratigraphy");
  }
  
  const ws2 = XLSX.utils.json_to_sheet(sptData);
  XLSX.utils.book_append_sheet(wb, ws2, "SPT_Records");

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


  // TAB CPT
  if (properties.cpt_data && properties.cpt_data.length > 0) {
    const cptExport = properties.cpt_data.map(test => ({
      "Depth (m)": test.depth_m,
      "Soil Class": getStratumAtDepth(test.depth_m),
      "Cone Resistance, qc (MPa)": test.qc_mpa,
      "Sleeve Friction, fs (kPa)": test.fs_kpa,
      "Friction Ratio, Rf (%)": test.rf_percent,
      "Pore Pressure, u2 (kPa)": test.u2_kpa
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cptExport), "CPT_Tests");
  }

  // Generate and Trigger Download
  XLSX.writeFile(wb, `${properties.borelog_id}_Borelog_Data.xlsx`);
};