import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import {
  Loader2, CheckCircle2, XCircle, Search, Columns, FileText,
  Download, Trash2, ChevronDown, UserPlus, X, Users, Server, AlertTriangle,
  RefreshCw, Plus, Save, Eye, EyeOff, Lock, Unlock
} from "lucide-react";

import { fetchDbUsers } from "../services/dbUsersService";
import { fetchSavedDbConfigs, saveDbConfig, deleteDbConfig } from "../services/dbConfigsService";
import { fetchDbEmployeeProfiles, createDbEmployeeProfile, deleteDbEmployeeProfile } from "../services/dbEmployeeProfilesService";
import ConfirmModal from "../components/Modals/ConfirmModal";

const DEPARTMENTS = ["Development", "QA", "Manage Service", "Support", "Other"];

// ─── Color palette for servers ───────────────────────────────────────────────
const SERVER_COLORS = [
  { bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe", dot: "#6366f1" },
  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", dot: "#22c55e" },
  { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa", dot: "#f97316" },
  { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff", dot: "#a855f7" },
  { bg: "#f0f9ff", color: "#0284c7", border: "#bae6fd", dot: "#38bdf8" },
  { bg: "#fefce8", color: "#ca8a04", border: "#fef08a", dot: "#eab308" },
];

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

// ─── Server Badge Component ──────────────────────────────────────────────────
function ServerBadge({ alias, colorIdx }) {
  const c = SERVER_COLORS[colorIdx % SERVER_COLORS.length];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {alias}
    </span>
  );
}

// ─── Server Chip Component ──────────────────────────────────────────────────
function ServerChip({ alias, host, error, count, loading, selected, colorIdx, onToggle }) {
  const c = SERVER_COLORS[colorIdx % SERVER_COLORS.length];
  const bg = loading ? "#f9fafb" : error ? "#fef2f2" : selected ? c.bg : "#f9fafb";
  const border = loading ? "#e5e7eb" : error ? "#fecaca" : selected ? c.border : "#e5e7eb";
  return (
    <button onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", border: `1.5px solid ${border}`,
      borderRadius: 10, background: bg, cursor: "pointer",
      transition: "all 0.15s", minWidth: 0, textAlign: "left",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: loading ? "#f3f4f6" : error ? "#fee2e2" : selected ? c.bg : "#f3f4f6",
        border: `1px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {loading
          ? <Loader2 size={14} style={{ color: "#6366f1", animation: "spin 1s linear infinite" }} />
          : error
            ? <AlertTriangle size={14} style={{ color: "#dc2626" }} />
            : <Server size={14} style={{ color: selected ? c.color : "#9ca3af" }} />
        }
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: error ? "#dc2626" : selected ? c.color : "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{alias}</div>
        <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>{host}</div>
      </div>
      {!loading && !error && (
        <span style={{ fontSize: 11, fontWeight: 700, color: selected ? c.color : "#9ca3af", background: selected ? "white" : "#e5e7eb", borderRadius: 10, padding: "1px 7px", flexShrink: 0, border: `1px solid ${selected ? c.border : "transparent"}` }}>
          {count}
        </span>
      )}
      {error && <AlertTriangle size={13} style={{ color: "#dc2626", flexShrink: 0 }} />}
    </button>
  );
}

export default function DbUsersPage() {
  // ─── Data State ────────────────────────────────────────────────────────────
  const [employeeProfiles, setEmployeeProfiles] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [dbResults, setDbResults] = useState({});
  const [selectedServers, setSelectedServers] = useState(new Set(["local"]));

  // ─── Add New Server State ──────────────────────────────────────────────────
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServer, setNewServer] = useState({ alias_name: "", host: "", port: "3306", db_username: "", password: "" });
  const [savingServer, setSavingServer] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // ─── Profile / Config Modals State ─────────────────────────────────────────
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [newProfile, setNewProfile] = useState({ mysql_username: "", employee_name: "", department: "", config_id: "" });
  const [addingProfile, setAddingProfile] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [configToDelete, setConfigToDelete] = useState(null);

  // ─── Filters State ─────────────────────────────────────────────────────────
  const [dbFilter, setDbFilter] = useState("");
  const [exactDbMatch, setExactDbMatch] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  const [onlySuper, setOnlySuper] = useState(false);
  const [onlyGlobal, setOnlyGlobal] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);

  // ─── Columns Configuration State ──────────────────────────────────────────
  const [colOpen, setColOpen] = useState(false);
  const colRef = useRef(null);
  const [visibleCols, setVisibleCols] = useState({
    server: true, empName: true, dept: true, user: true, host: true, db: true,
    select: true, insert: true, update: true, delete: true, create: true, drop: true
  });

  const COL_LABELS = {
    server: "DB Server", empName: "Employee Name", dept: "Department",
    user: "MySQL User", host: "Host", db: "Database",
    select: "Select", insert: "Insert", update: "Update",
    delete: "Delete", create: "Create", drop: "Drop"
  };

  // ─── Lifecycle Operations ─────────────────────────────────────────────────
  useEffect(() => { 
    init(); 
  }, []);

  const init = async () => {
    try {
      const [confData, profilesData] = await Promise.all([fetchSavedDbConfigs(), fetchDbEmployeeProfiles()]);
      setConfigs(confData || []);
      setEmployeeProfiles(profilesData || []);
    } catch (err) { 
      console.error(err); 
    }
    loadServer("local");
  };

  const loadServer = async (key) => {
    const isLocal = key === "local";
    let config = null;
    if (!isLocal) {
      config = configs.find(c => c.id === key) || await fetchSavedDbConfigs().then(cs => cs.find(c => c.id === key));
    }

    setDbResults(prev => ({
      ...prev,
      [key]: { alias: isLocal ? "Local DB" : config?.alias_name || key, host: isLocal ? "localhost" : config?.host || "", users: [], loading: true, error: null }
    }));

    try {
      const payload = isLocal ? {} : { configId: key };
      const data = await fetchDbUsers(payload);
      setDbResults(prev => ({
        ...prev,
        [key]: { ...prev[key], users: data || [], loading: false, error: null }
      }));
    } catch (err) {
      setDbResults(prev => ({
        ...prev,
        [key]: { ...prev[key], users: [], loading: false, error: err.message }
      }));
    }
  };

  const toggleServer = (key) => {
    setSelectedServers(prev => {
      const next = new Set(prev);
      if (next.has(key)) { 
        next.delete(key); 
      } else {
        next.add(key);
        if (!dbResults[key] || dbResults[key].error) loadServer(key);
      }
      return next;
    });
  };

  const refreshAll = () => {
    selectedServers.forEach(key => loadServer(key));
  };

  const handleSaveServer = async (e) => {
    e.preventDefault();
    if (!newServer.alias_name || !newServer.host || !newServer.db_username) {
      toast.error("Alias, Host and Username are required.");
      return;
    }
    setSavingServer(true);
    try {
      const saved = await saveDbConfig({
        alias_name: newServer.alias_name,
        host: newServer.host,
        port: newServer.port || "3306",
        db_username: newServer.db_username,
        password: newServer.password
      });
      toast.success(`Server "${newServer.alias_name}" saved!`);
      const confData = await fetchSavedDbConfigs();
      setConfigs(confData || []);
      setShowAddServer(false);
      setNewServer({ alias_name: "", host: "", port: "3306", db_username: "", password: "" });
      
      const newId = saved?.id || (confData && confData.length > 0 ? confData[confData.length - 1]?.id : null);
      if (newId) {
        setSelectedServers(prev => new Set([...prev, newId]));
        loadServer(newId);
      }
    } catch (err) {
      toast.error("Failed to save: " + err.message);
    } finally { 
      setSavingServer(false); 
    }
  };

  const executeDeleteConfig = async () => {
    if (!configToDelete) return;
    const id = configToDelete.id;
    try {
      await deleteDbConfig(id);
      toast.success(`"${configToDelete.alias_name}" removed.`);
      setConfigs(prev => prev.filter(c => c.id !== id));
      setSelectedServers(prev => { const n = new Set(prev); n.delete(id); return n; });
      setDbResults(prev => { const n = { ...prev }; delete n[id]; return n; });
    } catch { 
      toast.error("Failed to delete."); 
    } finally { 
      setConfigToDelete(null); 
    }
  };

  const reloadProfiles = async () => {
    const data = await fetchDbEmployeeProfiles();
    setEmployeeProfiles(data || []);
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    if (!newProfile.mysql_username || !newProfile.employee_name) {
      toast.error("MySQL Username and Employee Name are required.");
      return;
    }
    setAddingProfile(true);
    try {
      await createDbEmployeeProfile({
        mysql_username: newProfile.mysql_username,
        employee_name: newProfile.employee_name,
        department: newProfile.department,
        config_id: newProfile.config_id || null,
      });
      toast.success("Employee Profile Registered!");
      setShowAddProfile(false);
      setNewProfile({ mysql_username: "", employee_name: "", department: "", config_id: "" });
      await reloadProfiles();
    } catch (err) { 
      toast.error(err.message || "Failed to create profile"); 
    } finally { 
      setAddingProfile(false); 
    }
  };

  const executeDeleteProfile = async () => {
    if (!profileToDelete) return;
    try {
      await deleteDbEmployeeProfile(profileToDelete.id);
      toast.success("Profile mapping deleted.");
      await reloadProfiles();
    } catch { 
      toast.error("Failed to delete profile."); 
    } finally { 
      setProfileToDelete(null); 
    }
  };

  // ─── Build unified rows ───────────────────────────────────────────────────
  const buildRows = (key, colorIdx) => {
    const result = dbResults[key];
    if (!result || result.loading || result.error) return [];
    const isLocal = key === "local";
    const configId = isLocal ? null : key;

    const serverProfiles = employeeProfiles.filter(p =>
      isLocal ? (p.config_id === null || p.config_id === undefined || p.config_id === "")
              : String(p.config_id) === String(configId)
    );

    const rows = [];
    if (!result.users) return [];
    
    result.users.forEach(u => {
      const profile = serverProfiles.find(p => p.mysql_username === u.user);
      if (!showAllUsers && !profile) return;
      if (userFilter) {
        const q = userFilter.toLowerCase();
        const match = u.user.toLowerCase().includes(q) ||
          (profile?.employee_name || "").toLowerCase().includes(q) ||
          (profile?.department || "").toLowerCase().includes(q);
        if (!match) return;
      }
      if (onlySuper && !u.global_privileges?.super) return;
      const hasGlobal = u.global_privileges ? Object.values(u.global_privileges).some(v => v === true) : false;
      const base = {
        serverLabel: result.alias, serverColorIdx: colorIdx,
        empName: profile?.employee_name || (showAllUsers ? u.user : "—"),
        dept: profile?.department || "—",
      };
      if (!dbFilter && (hasGlobal || onlyGlobal)) {
        if (!onlyGlobal || hasGlobal)
          rows.push({ ...base, type: "global", user: u.user, host: u.host, db: "*.* (Global)", ...u.global_privileges, _orig: u });
      } else if (!dbFilter && !hasGlobal && (!u.databases || u.databases.length === 0) && !onlyGlobal) {
        rows.push({ ...base, type: "global", user: u.user, host: u.host, db: "No Privileges", ...u.global_privileges, _orig: u });
      }
      if (!onlyGlobal && u.databases) {
        u.databases.forEach(db => {
          if (dbFilter && !(exactDbMatch ? db.db.toLowerCase() === dbFilter.toLowerCase() : db.db.toLowerCase().includes(dbFilter.toLowerCase()))) return;
          rows.push({ ...base, type: "db", user: u.user, host: u.host, db: db.db, ...db, _orig: u });
        });
      }
    });
    return rows;
  };

  const serverColorMap = { local: 0 };
  configs.forEach((c, i) => { serverColorMap[c.id] = i + 1; });

  let processedRows = [];
  [...selectedServers].forEach(key => {
    processedRows.push(...buildRows(key, serverColorMap[key] ?? 0));
  });

  const PrivIcon = ({ val }) => val
    ? <CheckCircle2 size={14} className="text-green-600 mx-auto" />
    : <XCircle size={14} className="text-gray-300 mx-auto" />;
    
  const PrivText = v => v ? "Yes" : "No";

  // ─── Exports ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = Object.keys(COL_LABELS).filter(k => visibleCols[k]).map(k => COL_LABELS[k]);
    const csvRows = [headers.join(",")];
    processedRows.forEach(r => {
      const d = [];
      if (visibleCols.server) d.push(r.serverLabel);
      if (visibleCols.empName) d.push(r.empName);
      if (visibleCols.dept) d.push(r.dept);
      if (visibleCols.user) d.push(r.user);
      if (visibleCols.host) d.push(r.host);
      if (visibleCols.db) d.push(r.db);
      if (visibleCols.select) d.push(PrivText(r.select));
      if (visibleCols.insert) d.push(PrivText(r.insert));
      if (visibleCols.update) d.push(PrivText(r.update));
      if (visibleCols.delete) d.push(PrivText(r.delete));
      if (visibleCols.create) d.push(PrivText(r.create));
      if (visibleCols.drop) d.push(PrivText(r.drop));
      csvRows.push(d.map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Multi_DB_Access.csv"; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("Database Access Report", 14, 15);
    const headers = Object.keys(COL_LABELS).filter(k => visibleCols[k]).map(k => COL_LABELS[k]);
    const body = processedRows.map(r => {
      const d = [];
      if (visibleCols.server) d.push(r.serverLabel);
      if (visibleCols.empName) d.push(r.empName);
      if (visibleCols.dept) d.push(r.dept);
      if (visibleCols.user) d.push(r.user);
      if (visibleCols.host) d.push(r.host);
      if (visibleCols.db) d.push(r.db);
      if (visibleCols.select) d.push(PrivText(r.select));
      if (visibleCols.insert) d.push(PrivText(r.insert));
      if (visibleCols.update) d.push(PrivText(r.update));
      if (visibleCols.delete) d.push(PrivText(r.delete));
      if (visibleCols.create) d.push(PrivText(r.create));
      if (visibleCols.drop) d.push(PrivText(r.drop));
      return d;
    });
    autoTable(doc, { head: [headers], body, startY: 20, theme: "grid", headStyles: { fillColor: [79, 70, 229] } });
    doc.save("Multi_DB_Access.pdf");
  };

  const isAnyLoading = [...selectedServers].some(k => dbResults[k]?.loading);
  const activeSources = selectedServers.size;
  const setNS = f => e => setNewServer(s => ({ ...s, [f]: e.target.value }));

  return (
    <div className="p-6 md:p-8 flex-1 overflow-y-auto">
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* ─── Top Page Actions Header ───────────────────────────────────── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
     
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAddProfile(true)} className="btn btn-secondary text-sm flex items-center gap-2">
            <UserPlus size={15} /> Register Profile
          </button>
          <button onClick={() => setShowProfilesModal(true)} className="btn btn-secondary text-sm flex items-center gap-2">
            <Users size={15} /> View Profiles
          </button>
        </div>
      </div>

      {/* ─── Server Selector Panel ──────────────────────────────────────── */}
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", marginBottom: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifySpaceBetween: "space-between", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "flex", alignItems: "center", gap: 7 }}>
            <Server size={15} style={{ color: "#6366f1" }} />
            Database Servers
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>— click to toggle; select multiple to view side-by-side</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={refreshAll}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "white", fontSize: 12, cursor: "pointer", color: "#374151", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
            >
              <RefreshCw size={12} style={{ animation: isAnyLoading ? "spin 1s linear infinite" : "none" }} /> Refresh All
            </button>
            <button
              onClick={() => setShowAddServer(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", border: "1px solid #c7d2fe", borderRadius: 6, background: "#eef2ff", fontSize: 12, cursor: "pointer", color: "#4f46e5", fontWeight: 600, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#e0e7ff"}
              onMouseLeave={e => e.currentTarget.style.background = "#eef2ff"}
            >
              <Plus size={13} /> Add Server
            </button>
          </div>
        </div>

        {/* Server chips listing */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: showAddServer ? 16 : 0 }}>
          <ServerChip
            alias="Local DB"
            host="localhost"
            error={dbResults["local"]?.error || null}
            count={dbResults["local"]?.users?.length || 0}
            loading={dbResults["local"]?.loading || false}
            selected={selectedServers.has("local")}
            colorIdx={0}
            onToggle={() => toggleServer("local")}
          />
          {configs.map((config, i) => {
            const result = dbResults[config.id];
            return (
              <ServerChip
                key={config.id}
                alias={config.alias_name}
                host={config.host}
                error={result?.error || null}
                count={result?.users?.length || 0}
                loading={result?.loading || false}
                selected={selectedServers.has(config.id)}
                colorIdx={i + 1}
                onToggle={() => toggleServer(config.id)}
              />
            );
          })}
        </div>

        {/* ─── Add Server Form Inner Row ─────────────────────────────────── */}
        {showAddServer && (
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16, animation: "fadeIn 0.15s ease-out" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={13} style={{ color: "#6366f1" }} /> New Remote Server
            </div>
            <form onSubmit={handleSaveServer}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Alias Name *</label>
                  <input className="form-input text-sm" placeholder="e.g. Production DB" value={newServer.alias_name} onChange={setNS("alias_name")} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Host / IP *</label>
                  <input className="form-input text-sm" placeholder="db.example.com" value={newServer.host} onChange={setNS("host")} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Port</label>
                  <input className="form-input text-sm" placeholder="3306" value={newServer.port} onChange={setNS("port")} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Username *</label>
                  <input className="form-input text-sm" placeholder="root" value={newServer.db_username} onChange={setNS("db_username")} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input className="form-input text-sm" type={showPwd ? "text" : "password"} placeholder="••••••••" value={newServer.password} onChange={setNS("password")} style={{ paddingRight: 32 }} />
                    <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", padding: 0 }}>
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowAddServer(false)} className="btn btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={savingServer} className="btn btn-primary bg-indigo-600 text-sm flex items-center gap-2">
                  {savingServer ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Saved configs trace tags */}
        {configs.length > 0 && !showAddServer && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
            <span style={{ fontSize: 11, color: "#9ca3af", alignSelf: "center", marginRight: 4 }}>Saved configs:</span>
            {configs.map((c, i) => (
              <span key={c.id} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 6, padding: "2px 8px", color: "#374151"
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: SERVER_COLORS[(i + 1) % SERVER_COLORS.length]?.dot || "#6366f1" }} />
                {c.alias_name}
                <button onClick={() => setConfigToDelete(c)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex", padding: 0, marginLeft: 2 }} title="Delete config">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── Error Banners ───────────────────────────────────────────────── */}
      {[...selectedServers].map(key => {
        const r = dbResults[key];
        if (!r || !r.error) return null;
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 10, fontSize: 13, color: "#dc2626" }}>
            <AlertTriangle size={15} /> <strong>{r.alias}</strong>: {r.error}
          </div>
        );
      })}

      {/* ─── Table Filter Toolbar ────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" placeholder="Search Employee..." className="form-input text-sm pl-9 py-1.5 w-44" value={userFilter} onChange={e => setUserFilter(e.target.value)} />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "white", transition: "border-color 0.15s" }}
            onFocusCapture={e => e.currentTarget.style.borderColor = "#6366f1"}
            onBlurCapture={e => e.currentTarget.style.borderColor = "#e5e7eb"}
          >
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Filter Database..."
                className="form-input text-sm py-1.5"
                style={{ border: "none", outline: "none", borderRadius: 0, paddingLeft: 32, width: 160, boxShadow: "none" }}
                value={dbFilter}
                onChange={e => setDbFilter(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setExactDbMatch(v => !v)}
              title={exactDbMatch ? "Exact match ON" : "Contains match"}
              style={{
                padding: "0 10px", height: "100%", minHeight: 34,
                background: exactDbMatch ? "#4f46e5" : "#f9fafb",
                color: exactDbMatch ? "white" : "#6b7280",
                border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
                borderLeft: "1px solid #e5e7eb",
              }}
            >
              {exactDbMatch ? <><Lock size={12} /> Exact</> : <><Unlock size={12} /> Contains</>}
            </button>
          </div>
          
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={onlySuper} onChange={e => setOnlySuper(e.target.checked)} className="rounded text-indigo-600" /> Super Only
          </label>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={onlyGlobal} onChange={e => setOnlyGlobal(e.target.checked)} className="rounded text-indigo-600" /> Global Only
          </label>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={showAllUsers} onChange={e => setShowAllUsers(e.target.checked)} className="rounded text-indigo-600" /> All DB Users
          </label>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button ref={colRef} onClick={() => setColOpen(!colOpen)} className="btn btn-secondary text-sm py-1.5 flex items-center gap-2">
              <Columns size={14} /> Columns <ChevronDown size={14} />
            </button>
            {colOpen && (
              <PortalDropdown triggerRef={colRef} onClose={() => setColOpen(false)} width={180}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wider">Toggle Columns</div>
                <div className="py-1 max-h-64 overflow-y-auto">
                  {Object.entries(COL_LABELS).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                      <input type="checkbox" className="rounded text-indigo-600" checked={visibleCols[k]} onChange={e => setVisibleCols({ ...visibleCols, [k]: e.target.checked })} />
                      {label}
                    </label>
                  ))}
                </div>
              </PortalDropdown>
            )}
          </div>
          <div className="h-6 w-px bg-gray-300 mx-1" />
          <button onClick={exportCSV} className="btn btn-secondary text-sm py-1.5 flex items-center gap-1.5"><FileText size={14} /> CSV</button>
          <button onClick={exportPDF} className="btn btn-secondary text-sm py-1.5 flex items-center gap-1.5"><Download size={14} /> PDF</button>
        </div>
      </div>

      {/* ─── Loading Status Dynamic Prompt ─────────────────────────────── */}
      {isAnyLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 8, marginBottom: 14, fontSize: 13, color: "#4338ca" }}>
          <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Connecting to remote databases…
        </div>
      )}

      {/* ─── Core Data Table View ───────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                {visibleCols.server  && <th className="py-3 px-4">{COL_LABELS.server}</th>}
                {visibleCols.empName && <th className="py-3 px-4">{COL_LABELS.empName}</th>}
                {visibleCols.dept    && <th className="py-3 px-4">{COL_LABELS.dept}</th>}
                {visibleCols.user    && <th className="py-3 px-4">{COL_LABELS.user}</th>}
                {visibleCols.host    && <th className="py-3 px-4">{COL_LABELS.host}</th>}
                {visibleCols.db      && <th className="py-3 px-4">{COL_LABELS.db}</th>}
                {visibleCols.select  && <th className="py-3 px-4 text-center">{COL_LABELS.select}</th>}
                {visibleCols.insert  && <th className="py-3 px-4 text-center">{COL_LABELS.insert}</th>}
                {visibleCols.update  && <th className="py-3 px-4 text-center">{COL_LABELS.update}</th>}
                {visibleCols.delete  && <th className="py-3 px-4 text-center">{COL_LABELS.delete}</th>}
                {visibleCols.create  && <th className="py-3 px-4 text-center">{COL_LABELS.create}</th>}
                {visibleCols.drop    && <th className="py-3 px-4 text-center">{COL_LABELS.drop}</th>}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {processedRows.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(visibleCols).filter(Boolean).length} className="py-14 text-center text-gray-400">
                    {activeSources === 0
                      ? "Select at least one database server above."
                      : isAnyLoading ? "Loading…"
                        : "No matching records. Try enabling 'All DB Users' or register an Employee Profile for this server."}
                  </td>
                </tr>
              ) : processedRows.map((r, idx) => {
                const isGlobal = r.type === "global";
                return (
                  <tr key={`${r.serverLabel}-${r.user}-${r.db}-${idx}`} className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/30 hover:bg-gray-50"}>
                    {visibleCols.server  && <td className="py-3 px-4"><ServerBadge alias={r.serverLabel} colorIdx={r.serverColorIdx} /></td>}
                    {visibleCols.empName && <td className="py-3 px-4 font-bold text-gray-900">{r.empName}</td>}
                    {visibleCols.dept    && <td className="py-3 px-4 text-indigo-700 font-medium">{r.dept}</td>}
                    {visibleCols.user    && <td className="py-3 px-4 text-gray-600 font-mono text-xs">{r.user}</td>}
                    {visibleCols.host    && <td className="py-3 px-4 text-gray-500 font-mono text-xs">{r.host}</td>}
                    {visibleCols.db      && (
                      <td className="py-3 px-4">
                        {isGlobal
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">*.* (Global)</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 font-mono">{r.db}</span>}
                        {isGlobal && r._orig?.global_privileges?.super && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">SUPER</span>
                        )}
                      </td>
                    )}
                    {visibleCols.select && <td className="py-2 px-4 text-center"><PrivIcon val={r.select} /></td>}
                    {visibleCols.insert && <td className="py-2 px-4 text-center"><PrivIcon val={r.insert} /></td>}
                    {visibleCols.update && <td className="py-2 px-4 text-center"><PrivIcon val={r.update} /></td>}
                    {visibleCols.delete && <td className="py-2 px-4 text-center"><PrivIcon val={r.delete} /></td>}
                    {visibleCols.create && <td className="py-2 px-4 text-center"><PrivIcon val={r.create} /></td>}
                    {visibleCols.drop   && <td className="py-2 px-4 text-center"><PrivIcon val={r.drop} /></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {processedRows.length > 0 && (
          <div style={{ padding: "10px 20px", borderTop: "1px solid #f3f4f6", fontSize: 12, color: "#9ca3af" }}>
            Showing <strong style={{ color: "#374151" }}>{processedRows.length}</strong> records across <strong style={{ color: "#374151" }}>{activeSources}</strong> server{activeSources !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ─── Register Profile Modal ──────────────────────────────────────── */}
      {showAddProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setShowAddProfile(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()} style={{ animation: "fadeIn 0.15s ease-out" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus size={18} className="text-indigo-600" /> Register Employee Profile
              </h3>
              <button onClick={() => setShowAddProfile(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddProfile} className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500">Maps a real employee name to a MySQL user on a specific server.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database Server <span className="text-red-500">*</span></label>
                <select
                  required
                  value={newProfile.config_id}
                  onChange={e => setNewProfile({ ...newProfile, config_id: e.target.value })}
                  className="form-select w-full"
                >
                  <option value="">Select Server…</option>
                  <option value="">— Local DB (localhost)</option>
                  {configs.map(c => <option key={c.id} value={c.id}>{c.alias_name} ({c.host})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name <span className="text-red-500">*</span></label>
                <input type="text" required value={newProfile.employee_name} onChange={e => setNewProfile({ ...newProfile, employee_name: e.target.value })} className="form-input w-full" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={newProfile.department} onChange={e => setNewProfile({ ...newProfile, department: e.target.value })} className="form-select w-full">
                  <option value="">Select Department…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MySQL Username <span className="text-red-500">*</span></label>
                <input type="text" required value={newProfile.mysql_username} onChange={e => setNewProfile({ ...newProfile, mysql_username: e.target.value })} className="form-input w-full font-mono text-sm" />
                <p className="text-xs text-gray-400 mt-1">Must match exactly the MySQL user on the selected server.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddProfile(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={addingProfile} className="btn btn-primary bg-indigo-600">
                  {addingProfile ? <Loader2 size={16} className="animate-spin" /> : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Profiles Modal ─────────────────────────────────────────── */}
      {showProfilesModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setShowProfilesModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()} style={{ animation: "fadeIn 0.15s ease-out" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" /> Registered Employee Profiles
              </h3>
              <button onClick={() => setShowProfilesModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto p-6">
              {employeeProfiles.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No profiles registered yet.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b">
                      <th className="py-2 px-4">Server</th>
                      <th className="py-2 px-4">Employee Name</th>
                      <th className="py-2 px-4">Department</th>
                      <th className="py-2 px-4">MySQL User</th>
                      <th className="py-2 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {employeeProfiles.map((p) => {
                      const colorIdx = p.config_id ? (configs.findIndex(c => c.id === p.config_id) + 1) : 0;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4">
                            <ServerBadge alias={p.server_alias || "Local DB"} colorIdx={colorIdx} />
                          </td>
                          <td className="py-2 px-4 font-medium text-gray-900">{p.employee_name}</td>
                          <td className="py-2 px-4 text-indigo-600">{p.department || "—"}</td>
                          <td className="py-2 px-4 text-gray-600 font-mono text-xs">{p.mysql_username}</td>
                          <td className="py-2 px-4 text-right">
                            <button onClick={() => setProfileToDelete(p)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Profile Confirm Mapping ──────────────────────────────── */}
      {profileToDelete && (
        <ConfirmModal
          title="Delete Profile Mapping?"
          message={`Are you sure you want to remove the mapping for "${profileToDelete.employee_name}" on ${profileToDelete.server_alias || "Local DB"}? This does not delete the actual MySQL user.`}
          onConfirm={executeDeleteProfile}
          onCancel={() => setProfileToDelete(null)}
          confirmText="Yes, Delete"
          confirmStyle="danger"
        />
      )}

      {/* ─── Delete Server Config Confirm ────────────────────────────────── */}
      {configToDelete && (
        <ConfirmModal
          title="Remove Server Configuration?"
          message={`Are you sure you want to remove "${configToDelete.alias_name}" (${configToDelete.host})? The employee profiles linked to this server will also lose their server association.`}
          onConfirm={executeDeleteConfig}
          onCancel={() => setConfigToDelete(null)}
          confirmText="Yes, Remove"
          confirmStyle="danger"
        />
      )}
    </div>
  );
}