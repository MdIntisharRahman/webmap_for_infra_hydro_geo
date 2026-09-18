import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

export default function AdvancedBorelogVisualizer({ properties }) {
  const plotData = useMemo(() => {
    if (!properties) return [];
    const rl = properties.rl_m; // Now normalized to MSL
    const colorMap = assignColors(properties.strata);

    // Track 1: Strata Hover (Hidden markers for tooltips)
    const strataTrace = { /* ... previous strata logic ... */ };

    // Track 2: SPT N-Values
    const sptTrace = {
      x: properties.spt_records.map(rec => String(rec.n_value).includes('/') ? 50 : parseFloat(rec.n_value)),
      y: properties.spt_records.map(rec => rl - rec.depth_m),
      mode: 'lines+markers',
      name: 'N-Value',
      line: { color: '#3B82F6', width: 2 },
      xaxis: 'x2', yaxis: 'y'
    };

    // Track 3: Atterberg Limits (LL, PL, PI)
    const llTrace = {
      x: properties.atterberg_test_data.map(rec => rec.wl),
      y: properties.atterberg_test_data.map(rec => rl - rec.depth_m),
      mode: 'markers+lines', name: 'Liquid Limit (LL)',
      marker: { color: '#EF4444', symbol: 'circle' },
      xaxis: 'x3', yaxis: 'y'
    };
    
    const plTrace = {
      x: properties.atterberg_test_data.map(rec => rec.wp),
      y: properties.atterberg_test_data.map(rec => rl - rec.depth_m),
      mode: 'markers+lines', name: 'Plastic Limit (PL)',
      marker: { color: '#10B981', symbol: 'square' },
      xaxis: 'x3', yaxis: 'y'
    };

    // Track 4: Shear Strength (Direct Shear / VST)
    const shearTrace = {
      x: properties.direct_shear_test_data.map(rec => rec.cohesion_kpa),
      y: properties.direct_shear_test_data.map(rec => rl - rec.depth_m),
      mode: 'markers', name: 'Cohesion (kPa)',
      marker: { color: '#8B5CF6', size: 10 },
      xaxis: 'x4', yaxis: 'y'
    };

    return [strataTrace, sptTrace, llTrace, plTrace, shearTrace];
  }, [properties]);

  const plotLayout = useMemo(() => {
    return {
      grid: { rows: 1, columns: 4, pattern: 'independent' }, // 4 Sequential Tracks
      yaxis: { title: "Elevation (m MSL)", autorange: 'reversed' },
      
      // Track 1: Stratigraphy
      xaxis: { domain: [0, 0.15], showticklabels: false },
      
      // Track 2: SPT Grid Rules
      xaxis2: { 
        domain: [0.17, 0.45], 
        title: "SPT N-Value", 
        range: [0, 55],
        showgrid: true,
        gridcolor: '#CBD5E1', 
        gridwidth: 1,
        dtick: 10, // Major ruler lines every 10 blows
        minor: { showgrid: true, gridcolor: '#F1F5F9', dtick: 5 } // Minor ruler lines every 5 blows
      },
      
      // Track 3: Atterberg Limits
      xaxis3: { domain: [0.47, 0.75], title: "Water Content (%)", showgrid: true },
      
      // Track 4: Shear Strength
      xaxis4: { domain: [0.77, 1.0], title: "Cohesion (kPa)", showgrid: true },
      
      /* ... shapes array logic for strata polygons ... */
    };
  }, [properties]);

  return <Plot data={plotData} layout={plotLayout} style={{ width: '100%', height: '800px' }} />;
}