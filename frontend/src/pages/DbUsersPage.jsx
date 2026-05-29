import { useState, useEffect, useRef } from "react";
import { fetchDbUsers } from "../services/dbUsersService";
import { fetchSavedDbConfigs, saveDbConfig, deleteDbConfig } from "../services/dbConfigsService";
import { Loader2, Database, ShieldAlert, CheckCircle2, XCircle, Search, Columns, FileText, Download, Save, Trash2, ChevronDown, Check } from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const IDLE = "idle", LOADING = "loading", ERROR = "error";

// ─── Portal dropdown ─────────────────────────────────────────────────────────
function PortalDropdown({ triggerRef, onClose, children, width = 220 }) {
  const dropdownRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - width) });
  }, [triggerRef, width]);

  useEffect(() => {
    const handler = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) onClose();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [triggerRef, onClose]);

  return createPortal(
    <div ref={dropdownRef} style={{
      position: "fixed", top: pos.top, left: pos.left, zIndex: 9999,
      background: "white", border: "1px solid #e5e7eb", borderRadius: 8,
      boxShadow: "0 4px 24px rgba(0,0,0,0.10)", width, padding: "8px 0"
    }}>
      {children}
    </div>,
    document.body
  );
}

export default function DbUsersPage() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState(LOADING);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [configs, setConfigs] = useState([]);
  const [creds, setCreds] = useState({ configId: "", host: "", port: "3306", user: "", password: "", alias_name: "", saveConfig: false });
  const [showConfig, setShowConfig] = useState(false);

  // Filters
  const [dbFilter, setDbFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [onlySuper, setOnlySuper] = useState(false);
  const [onlyGlobal, setOnlyGlobal] = useState(false);

  // Columns
  const [colOpen, setColOpen] = useState(false);
  const colRef = useRef(null);
  const [visibleCols, setVisibleCols] = useState({
    user: true, host: true, db: true,
    select: true, insert: true, update: true, delete: true, create: true, drop: true
  });

  const COL_LABELS = {
    user: "MySQL User", host: "Host", db: "Database",
    select: "Select", insert: "Insert", update: "Update", delete: "Delete", create: "Create", drop: "Drop"
  };

  useEffect(() => {
    loadUsers();
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await fetchSavedDbConfigs();
      setConfigs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async (customCreds = null) => {
    setStatus(LOADING);
    try {
      const data = await fetchDbUsers(customCreds || {});
      setUsers(data);
      setStatus(IDLE);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load database users");
      setStatus(ERROR);
      toast.error(err.message || "Failed to load database users");
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!creds.configId && creds.host && !creds.user) {
      toast.error("Please enter a username for the remote connection.");
      return;
    }

    let connectPayload = { ...creds };

    if (creds.saveConfig && creds.alias_name && !creds.configId) {
      try {
        await saveDbConfig({
          alias_name: creds.alias_name,
          host: creds.host,
          port: creds.port,
          db_username: creds.user,
          password: creds.password
        });
        toast.success("Configuration saved!");
        await loadConfigs();
      } catch (err) {
        toast.error("Failed to save config: " + err.message);
      }
    }

    loadUsers(connectPayload.host || connectPayload.configId ? connectPayload : {});
  };

  const handleClear = () => {
    setCreds({ configId: "", host: "", port: "3306", user: "", password: "", alias_name: "", saveConfig: false });
    loadUsers({});
  };

  const handleDeleteConfig = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm("Delete this saved configuration?")) return;
    try {
      await deleteDbConfig(id);
      toast.success("Configuration deleted");
      loadConfigs();
      if (creds.configId === id) handleClear();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const setC = (f) => (e) => setCreds(c => ({ ...c, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  // --- Process Data ---
  let processedRows = [];
  users.forEach(u => {
    // Check user filter
    if (userFilter && !u.user.toLowerCase().includes(userFilter.toLowerCase())) return;
    // Check super filter
    if (onlySuper && !u.global_privileges.super) return;

    let hasGlobal = Object.values(u.global_privileges).some(val => val === true);
    
    // If onlyGlobal is checked, we only push the global row (if they have one)
    if (!dbFilter && (hasGlobal || onlyGlobal)) {
      if (!onlyGlobal || hasGlobal) {
        processedRows.push({ type: 'global', user: u.user, host: u.host, db: '*.* (Global)', ...u.global_privileges, _original: u });
      }
    } else if (!dbFilter && !hasGlobal && u.databases.length === 0 && !onlyGlobal) {
      // User exists but has zero privileges
      processedRows.push({ type: 'global', user: u.user, host: u.host, db: 'No Privileges', ...u.global_privileges, _original: u });
    }

    if (!onlyGlobal) {
      u.databases.forEach(db => {
        if (dbFilter && !db.db.toLowerCase().includes(dbFilter.toLowerCase())) return;
        processedRows.push({ type: 'db', user: u.user, host: u.host, db: db.db, ...db, _original: u });
      });
    }
  });

  const PrivIcon = ({ val }) => (
    val ? <CheckCircle2 size={14} className="text-green-600 mx-auto" /> : <XCircle size={14} className="text-gray-300 mx-auto" />
  );

  const PrivText = (val) => val ? "Yes" : "No";

  // --- Exports ---
  const exportCSV = () => {
    const headers = Object.keys(COL_LABELS).filter(k => visibleCols[k]).map(k => COL_LABELS[k]);
    const csvRows = [headers.join(",")];
    processedRows.forEach(r => {
      const rowData = [];
      if (visibleCols.user) rowData.push(r.user);
      if (visibleCols.host) rowData.push(r.host);
      if (visibleCols.db) rowData.push(r.db);
      if (visibleCols.select) rowData.push(PrivText(r.select));
      if (visibleCols.insert) rowData.push(PrivText(r.insert));
      if (visibleCols.update) rowData.push(PrivText(r.update));
      if (visibleCols.delete) rowData.push(PrivText(r.delete));
      if (visibleCols.create) rowData.push(PrivText(r.create));
      if (visibleCols.drop) rowData.push(PrivText(r.drop));
      csvRows.push(rowData.map(x => `"${x}"`).join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "DB_Privileges.csv"; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("Database Privileges Report", 14, 15);
    const headers = Object.keys(COL_LABELS).filter(k => visibleCols[k]).map(k => COL_LABELS[k]);
    const body = processedRows.map(r => {
      const rowData = [];
      if (visibleCols.user) rowData.push(r.user);
      if (visibleCols.host) rowData.push(r.host);
      if (visibleCols.db) rowData.push(r.db);
      if (visibleCols.select) rowData.push(PrivText(r.select));
      if (visibleCols.insert) rowData.push(PrivText(r.insert));
      if (visibleCols.update) rowData.push(PrivText(r.update));
      if (visibleCols.delete) rowData.push(PrivText(r.delete));
      if (visibleCols.create) rowData.push(PrivText(r.create));
      if (visibleCols.drop) rowData.push(PrivText(r.drop));
      return rowData;
    });
    autoTable(doc, { head: [headers], body, startY: 20, theme: "grid", headStyles: { fillColor: [79, 70, 229] } });
    doc.save("DB_Privileges.pdf");
  };

  if (status === LOADING) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
        <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
        <p>Loading database privileges...</p>
      </div>
    );
  }

  if (status === ERROR) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600 max-w-md text-center mb-6">{errorMsg}</p>
        <button onClick={() => loadUsers(creds)} className="btn btn-primary">Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex-1 overflow-y-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="text-indigo-600" />
            MySQL Server Privileges
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Analyze access levels for all databases on the connected MySQL server.
          </p>
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="btn btn-secondary text-sm">
          {showConfig ? "Hide Connection Config" : "Configure Remote Server"}
        </button>
      </div>

      {showConfig && (
        <form onSubmit={handleConnect} className="mb-6 bg-indigo-50 border border-indigo-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
              Remote Server Configuration
            </h3>
            {configs.length > 0 && (
              <select className="form-input text-sm py-1 max-w-xs" value={creds.configId} onChange={(e) => setCreds({ ...creds, configId: e.target.value, host:"", user:"", password:"" })}>
                <option value="">-- Load Saved Config --</option>
                {configs.map(c => (
                  <option key={c.id} value={c.id}>{c.alias_name} ({c.host})</option>
                ))}
              </select>
            )}
          </div>
          
          {!creds.configId && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-indigo-800 mb-1">Host / IP</label>
                  <input type="text" className="form-input text-sm" placeholder="e.g., db.example.com" value={creds.host} onChange={setC("host")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-800 mb-1">Port</label>
                  <input type="text" className="form-input text-sm" placeholder="3306" value={creds.port} onChange={setC("port")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-800 mb-1">Username</label>
                  <input type="text" className="form-input text-sm" placeholder="root" value={creds.user} onChange={setC("user")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-800 mb-1">Password</label>
                  <input type="password" className="form-input text-sm" placeholder="••••••••" value={creds.password} onChange={setC("password")} />
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm text-indigo-800 font-medium">
                  <input type="checkbox" checked={creds.saveConfig} onChange={setC("saveConfig")} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  Save this configuration
                </label>
                {creds.saveConfig && (
                  <input type="text" className="form-input text-sm py-1" placeholder="Alias Name (e.g. Prod DB)" value={creds.alias_name} onChange={setC("alias_name")} required />
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-indigo-200/50">
            {creds.configId && (
              <button type="button" onClick={(e) => handleDeleteConfig(creds.configId, e)} className="btn btn-secondary text-red-600 text-sm hover:bg-red-50 hover:border-red-200 mr-auto flex items-center gap-1">
                <Trash2 size={14} /> Delete Saved
              </button>
            )}
            <button type="button" onClick={handleClear} className="btn btn-secondary text-sm">Reset to Local DB</button>
            <button type="submit" className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-sm">Connect & Analyze</button>
          </div>
        </form>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" placeholder="Filter by User..." className="form-input text-sm pl-9 py-1.5 w-48" value={userFilter} onChange={e => setUserFilter(e.target.value)} />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" placeholder="Filter by Database..." className="form-input text-sm pl-9 py-1.5 w-48" value={dbFilter} onChange={e => setDbFilter(e.target.value)} />
          </div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={onlySuper} onChange={e => setOnlySuper(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
            Super Users Only
          </label>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={onlyGlobal} onChange={e => setOnlyGlobal(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
            Global Privileges Only
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button ref={colRef} onClick={() => setColOpen(!colOpen)} className="btn btn-secondary text-sm py-1.5 flex items-center gap-2">
            <Columns size={14} /> Columns <ChevronDown size={14} />
          </button>
          {colOpen && (
            <PortalDropdown triggerRef={colRef} onClose={() => setColOpen(false)} width={180}>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wider">
                Toggle Columns
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                {Object.entries(COL_LABELS).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={visibleCols[k]} onChange={e => setVisibleCols({ ...visibleCols, [k]: e.target.checked })} />
                    {label}
                  </label>
                ))}
              </div>
            </PortalDropdown>
          )}

          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <button onClick={exportCSV} className="btn btn-secondary text-sm py-1.5 flex items-center gap-1.5" title="Export CSV">
            <FileText size={14} /> CSV
          </button>
          <button onClick={exportPDF} className="btn btn-secondary text-sm py-1.5 flex items-center gap-1.5" title="Export PDF">
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                {visibleCols.user && <th className="py-3 px-4">{COL_LABELS.user}</th>}
                {visibleCols.host && <th className="py-3 px-4">{COL_LABELS.host}</th>}
                {visibleCols.db && <th className="py-3 px-4">{COL_LABELS.db}</th>}
                {visibleCols.select && <th className="py-3 px-4 text-center">{COL_LABELS.select}</th>}
                {visibleCols.insert && <th className="py-3 px-4 text-center">{COL_LABELS.insert}</th>}
                {visibleCols.update && <th className="py-3 px-4 text-center">{COL_LABELS.update}</th>}
                {visibleCols.delete && <th className="py-3 px-4 text-center">{COL_LABELS.delete}</th>}
                {visibleCols.create && <th className="py-3 px-4 text-center">{COL_LABELS.create}</th>}
                {visibleCols.drop && <th className="py-3 px-4 text-center">{COL_LABELS.drop}</th>}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {processedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                processedRows.map((r, idx) => {
                  const isGlobal = r.type === 'global';
                  return (
                    <tr key={`${r.user}-${r.host}-${r.db}-${idx}`} className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/30 hover:bg-gray-50"}>
                      {visibleCols.user && (
                        <td className="py-3 px-4 font-medium text-gray-900 border-l-2 border-transparent">
                          {r.user}
                        </td>
                      )}
                      {visibleCols.host && (
                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                          {r.host}
                        </td>
                      )}
                      {visibleCols.db && (
                        <td className="py-3 px-4">
                          {isGlobal ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              *.* (Global)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 font-mono">
                              {r.db}
                            </span>
                          )}
                          {isGlobal && r._original.global_privileges.super && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" title="Super Admin">
                              SUPER
                            </span>
                          )}
                        </td>
                      )}
                      {visibleCols.select && <td className="py-2 px-4 text-center"><PrivIcon val={r.select} /></td>}
                      {visibleCols.insert && <td className="py-2 px-4 text-center"><PrivIcon val={r.insert} /></td>}
                      {visibleCols.update && <td className="py-2 px-4 text-center"><PrivIcon val={r.update} /></td>}
                      {visibleCols.delete && <td className="py-2 px-4 text-center"><PrivIcon val={r.delete} /></td>}
                      {visibleCols.create && <td className="py-2 px-4 text-center"><PrivIcon val={r.create} /></td>}
                      {visibleCols.drop && <td className="py-2 px-4 text-center"><PrivIcon val={r.drop} /></td>}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
