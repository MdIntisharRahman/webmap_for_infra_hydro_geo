window.renderBorelogChart = function(containerId, properties) {
    if (!properties) return;
    
    const rl = properties.rl_m || 0;
    
    // Default empty array if missing
    const strata = properties.strata || [];
    const sptRecords = properties.spt_records || [];
    const atterberg = properties.atterberg || [];
    const shear = properties.direct_shear_test_data || []; // assuming optional
    
    let colorMap = {};
    if (window.assignColors) {
        colorMap = window.assignColors(strata);
    }
    
    // Strata shapes
    const shapes = strata.map(s => {
        return {
            type: 'rect',
            x0: 0,
            x1: 1,
            y0: rl - s.top_m,
            y1: rl - s.bottom_m,
            fillcolor: colorMap[s.description] || '#eeeeee',
            line: { color: '#000000', width: 1 },
            xref: 'x',
            yref: 'y'
        };
    });

    const strataTrace = {
        x: strata.map(() => 0.5),
        y: strata.map(s => rl - (s.top_m + s.bottom_m) / 2),
        text: strata.map(s => s.description),
        hoverinfo: 'text',
        mode: 'markers',
        marker: { size: 0, opacity: 0 },
        xaxis: 'x', yaxis: 'y',
        showlegend: false
    };

    const sptTrace = {
        x: sptRecords.map(rec => String(rec.n_value).includes('/') ? 50 : parseFloat(rec.n_value)),
        y: sptRecords.map(rec => rl - rec.depth_m),
        mode: 'lines+markers',
        name: 'N-Value',
        line: { color: '#3B82F6', width: 2 },
        xaxis: 'x2', yaxis: 'y'
    };

    const llTrace = {
        x: atterberg.map(rec => rec.wl),
        y: atterberg.map(rec => rl - rec.depth_m),
        mode: 'markers+lines', name: 'Liquid Limit (LL)',
        marker: { color: '#EF4444', symbol: 'circle' },
        xaxis: 'x3', yaxis: 'y'
    };
    
    const plTrace = {
        x: atterberg.map(rec => rec.wp),
        y: atterberg.map(rec => rl - rec.depth_m),
        mode: 'markers+lines', name: 'Plastic Limit (PL)',
        marker: { color: '#10B981', symbol: 'square' },
        xaxis: 'x3', yaxis: 'y'
    };

    const shearTrace = {
        x: shear.map(rec => rec.cohesion_kpa),
        y: shear.map(rec => rl - rec.depth_m),
        mode: 'markers', name: 'Cohesion (kPa)',
        marker: { color: '#8B5CF6', size: 10 },
        xaxis: 'x4', yaxis: 'y'
    };

    const data = [strataTrace, sptTrace, llTrace, plTrace, shearTrace];

    const layout = {
        grid: { rows: 1, columns: 4, pattern: 'independent' },
        yaxis: { title: "Elevation (m MSL)" }, // Wait, autorange reversed handles depth natively
        xaxis: { domain: [0, 0.15], showticklabels: false, title: "Stratigraphy", range: [0, 1] },
        xaxis2: { 
            domain: [0.17, 0.45], 
            title: "SPT N-Value", 
            range: [0, 55],
            showgrid: true,
            gridcolor: '#CBD5E1', 
            gridwidth: 1,
            dtick: 10
        },
        xaxis3: { domain: [0.47, 0.75], title: "Water Content (%)", showgrid: true },
        xaxis4: { domain: [0.77, 1.0], title: "Cohesion (kPa)", showgrid: true },
        shapes: shapes,
        margin: { t: 40, r: 40, b: 40, l: 60 }
    };

    Plotly.newPlot(containerId, data, layout, {responsive: true});
};
