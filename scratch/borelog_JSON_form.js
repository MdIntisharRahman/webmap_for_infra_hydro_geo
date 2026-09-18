import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Download, Upload, Save, 
  MapPin, FileJson, AlertCircle, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';

const INITIAL_META = {
  borehole_id: "",
  project: "",
  client: "",
  crs: "EPSG:32646",
  elevation_datum: "PWD",
  location: "",
  rl_m: "",
  depth_m: "",
  easting: "",
  northing: ""
};

const INITIAL_STRATA = { top_m: "", bottom_m: "", description: "" };
const INITIAL_SPT = { depth_m: "", blows_150: "", blows_300: "", blows_450: "", n_value: "" };
const INITIAL_GW = { date: "", depth_m: "", remarks: "", artesian_condition: false, artesian_flow_rate_lps: "" };
const INITIAL_ATTERBERG = { depth_m: "", wl: "", wp: "", ip: "", li: "" };

export default function BorelogForm() {
  // State for form data
  const [meta, setMeta] = useState(INITIAL_META);
  const [strata, setStrata] = useState([]);
  const [sptRecords, setSptRecords] = useState([]);
  const [gwRecords, setGwRecords] = useState([]);
  const [atterberg, setAtterberg] = useState([]);

  // State for UI interactions
  const [generatedJson, setGeneratedJson] = useState("");
  const [importJsonText, setImportJsonText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setMeta(prev => ({ ...prev, [name]: value }));
  };

  const addRow = (setter, initialRecord) => {
    setter(prev => [...prev, { ...initialRecord }]);
  };

  const removeRow = (setter, index) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (setter, index, field, value) => {
    setter(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const generateGeoJSON = () => {
    try {
      const feature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            parseFloat(meta.easting) || 0,
            parseFloat(meta.northing) || 0
          ]
        },
        properties: {
          borehole_id: meta.borehole_id,
          project: meta.project,
          client: meta.client,
          crs: meta.crs,
          elevation_datum: meta.elevation_datum,
          location: meta.location,
          rl_m: parseFloat(meta.rl_m) || null,
          depth_m: parseFloat(meta.depth_m) || null,
          strata: strata.map(s => ({
            ...s,
            top_m: parseFloat(s.top_m),
            bottom_m: parseFloat(s.bottom_m)
          })),
          spt_records: sptRecords.map(s => ({
            ...s,
            depth_m: parseFloat(s.depth_m),
            blows_150: parseInt(s.blows_150),
            blows_300: parseInt(s.blows_300),
            blows_450: parseInt(s.blows_450)
          })),
          groundwater_records: gwRecords.map(g => ({
            ...g,
            depth_m: parseFloat(g.depth_m),
            artesian_flow_rate_lps: g.artesian_flow_rate_lps ? parseFloat(g.artesian_flow_rate_lps) : null
          })),
          atterberg_test_data: atterberg.map(a => ({
            ...a,
            depth_m: parseFloat(a.depth_m),
            wl: parseFloat(a.wl),
            wp: parseFloat(a.wp),
            ip: parseFloat(a.ip),
            li: parseFloat(a.li)
          }))
        }
      };
      setGeneratedJson(JSON.stringify(feature, null, 2));
      showToast("GeoJSON generated successfully!");
    } catch (err) {
      showToast("Error generating GeoJSON. Check numerical fields.", 'error');
    }
  };

  const loadGeoJSON = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (parsed.type !== "Feature" || !parsed.properties) {
        throw new Error("Invalid format. Must be a GeoJSON Feature.");
      }

      const p = parsed.properties;
      const coords = parsed.geometry?.coordinates || ["", ""];
      
      setMeta({
        borehole_id: p.borehole_id || "",
        project: p.project || "",
        client: p.client || "",
        crs: p.crs || "EPSG:32646",
        elevation_datum: p.elevation_datum || "PWD",
        location: p.location || "",
        rl_m: p.rl_m || "",
        depth_m: p.depth_m || "",
        easting: coords[0] !== undefined ? coords[0] : "",
        northing: coords[1] !== undefined ? coords[1] : ""
      });

      setStrata(p.strata || []);
      setSptRecords(p.spt_records || []);
      setGwRecords(p.groundwater_records || []);
      setAtterberg(p.atterberg_test_data || []);
      
      setShowImport(false);
      showToast("Borelog loaded successfully!");
    } catch (err) {
      showToast(err.message || "Failed to parse JSON", "error");
    }
  };

  const InputField = ({ label, name, type = "text", value, onChange, placeholder = "" }) => (
    <div className="flex flex-col">
      <label className="text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
    </div>
  );

  const DynamicTable = ({ title, columns, data, setter, initialRecord }) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div 
          className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {title} <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{data.length}</span>
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); addRow(setter, initialRecord); setIsOpen(true); }}
              className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus size={16} /> Add Row
            </button>
            {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
          </div>
        </div>
        
        {isOpen && (
          <div className="p-4 overflow-x-auto">
            {data.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 italic">No records added. Click "Add Row" to begin.</p>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} className="px-4 py-2 font-semibold border-b border-slate-200">{col.label}</th>
                    ))}
                    <th className="px-4 py-2 font-semibold border-b border-slate-200 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50">
                      {columns.map((col, colIndex) => (
                        <td key={colIndex} className="px-2 py-2">
                          {col.type === 'checkbox' ? (
                            <input
                              type="checkbox"
                              checked={row[col.key] || false}
                              onChange={(e) => handleRowChange(setter, rowIndex, col.key, e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          ) : (
                            <input
                              type={col.type || 'text'}
                              value={row[col.key]}
                              onChange={(e) => handleRowChange(setter, rowIndex, col.key, e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              placeholder={col.placeholder || ""}
                            />
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => removeRow(setter, rowIndex)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                          title="Remove row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-20">
      {/* Navbar/Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <MapPin className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Geotechnical Borelog Editor</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">GeoJSON Webmap Ingestion Tool</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm shadow-sm"
          >
            <Upload size={18} /> Load JSON
          </button>
          <button 
            onClick={submitGeoJSON}
            disabled={isSubmitting}
            className={lex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-colors text-sm shadow-sm }
          >
            <Save size={18} /> {isSubmitting ? 'Submitting...' : 'Submit to Webmap'}
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 font-medium text-sm animate-in fade-in slide-in-from-top-5 duration-300 ${toast.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Project Metadata</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Borehole ID" name="borehole_id" value={meta.borehole_id} onChange={handleMetaChange} />
              <InputField label="Client" name="client" value={meta.client} onChange={handleMetaChange} />
              <div className="sm:col-span-2">
                <InputField label="Project Name" name="project" value={meta.project} onChange={handleMetaChange} />
              </div>
              <div className="sm:col-span-2">
                <InputField label="Location" name="location" value={meta.location} onChange={handleMetaChange} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Spatial Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Longitude (X) (EPSG:4326)" name="easting" type="number" value={meta.easting} onChange={handleMetaChange} placeholder="e.g. 238480" />
              <InputField label="Latitude (Y) (EPSG:4326)" name="northing" type="number" value={meta.northing} onChange={handleMetaChange} placeholder="e.g. 2637483" />
              <InputField label="CRS Code" name="crs" value={meta.crs} onChange={handleMetaChange} placeholder="EPSG:32646" />
              <InputField label="Elevation Datum" name="elevation_datum" value={meta.elevation_datum} onChange={handleMetaChange} placeholder="PWD" />
              <InputField label="Reduced Level (RL, m)" name="rl_m" type="number" value={meta.rl_m} onChange={handleMetaChange} />
              <InputField label="Termination Depth (m)" name="depth_m" type="number" value={meta.depth_m} onChange={handleMetaChange} />
            </div>
          </div>
        </div>

        {}
        <div className="xl:col-span-8 space-y-6">
          
          {showImport && (
            <div className="bg-blue-50 rounded-xl shadow-inner border border-blue-200 p-5 mb-6">
              <h3 className="text-blue-900 font-bold mb-2 flex items-center gap-2"><Upload size={18}/> Paste GeoJSON</h3>
              <p className="text-blue-700 text-xs mb-3">Paste a valid GeoJSON Feature string below to populate the form.</p>
              <textarea 
                className="w-full h-40 p-3 bg-white border border-blue-300 rounded-lg text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"type": "Feature", "geometry": {...}, "properties": {...}}'
              />
              <div className="mt-3 flex justify-end gap-3">
                <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm text-blue-700 font-medium hover:bg-blue-100 rounded-md">Cancel</button>
                <button onClick={loadGeoJSON} className="px-4 py-2 text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-md shadow-sm flex items-center gap-2"><CheckCircle2 size={16}/> Load Data</button>
              </div>
            </div>
          )}

          <DynamicTable 
            title="Stratigraphy (Strata)" 
            data={strata} setter={setStrata} initialRecord={INITIAL_STRATA}
            columns={[
              { key: 'top_m', label: 'Top (m)', type: 'number' },
              { key: 'bottom_m', label: 'Bottom (m)', type: 'number' },
              { key: 'description', label: 'Soil Description', type: 'text', placeholder: 'e.g. Gray, medium stiff, Fat Clay...' }
            ]}
          />

          <DynamicTable 
            title="Standard Penetration Test (SPT)" 
            data={sptRecords} setter={setSptRecords} initialRecord={INITIAL_SPT}
            columns={[
              { key: 'depth_m', label: 'Depth (m)', type: 'number' },
              { key: 'blows_150', label: '1st 150mm', type: 'number' },
              { key: 'blows_300', label: '2nd 150mm', type: 'number' },
              { key: 'blows_450', label: '3rd 150mm', type: 'number' },
              { key: 'n_value', label: 'N-Value (String)', type: 'text', placeholder: 'e.g. 50/150' }
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DynamicTable 
              title="Groundwater Records" 
              data={gwRecords} setter={setGwRecords} initialRecord={INITIAL_GW}
              columns={[
                { key: 'date', label: 'Date', type: 'date' },
                { key: 'depth_m', label: 'Depth (m)', type: 'number' },
                { key: 'artesian_condition', label: 'Artesian?', type: 'checkbox' },
                { key: 'remarks', label: 'Remarks', type: 'text' }
              ]}
            />

            <DynamicTable 
              title="Atterberg Limits" 
              data={atterberg} setter={setAtterberg} initialRecord={INITIAL_ATTERBERG}
              columns={[
                { key: 'depth_m', label: 'Depth (m)', type: 'number' },
                { key: 'wl', label: 'LL (%)', type: 'number' },
                { key: 'wp', label: 'PL (%)', type: 'number' },
                { key: 'ip', label: 'PI (%)', type: 'number' }
              ]}
            />
          </div>

          {}
          {generatedJson && (
            <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden mt-8 border border-slate-700 animate-in fade-in zoom-in-95">
              <div className="bg-slate-800 px-5 py-3 flex justify-between items-center border-b border-slate-700">
                <h3 className="font-mono text-emerald-400 font-semibold flex items-center gap-2">
                  <FileJson size={18} /> Output: feature.geojson
                </h3>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedJson);
                    showToast("Copied to clipboard!");
                  }}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
              <div className="p-5 overflow-auto max-h-[500px]">
                <pre className="text-emerald-300 font-mono text-xs whitespace-pre-wrap break-words">
                  {generatedJson}
                </pre>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}