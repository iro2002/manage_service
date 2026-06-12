import { useState, useEffect, useCallback, useRef } from "react";
import {
  ClipboardList, Search, RefreshCw, ExternalLink, Users, Globe,
  Lock, Eye, X, AlertCircle, Loader2, Shield,
  AlertTriangle, CheckCircle, Filter,
  User, Calendar, Download, FileText, Table, FolderKanban,
  ChevronRight, Tag, Building2
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = "/api";

async function apiFetch(path) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    headers: { "x-auth-token": token || "" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.msg || `Request failed (${res.status})`);
  return data;
}

function downloadCSV(filename, headers, rows) {
  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadPDF(filename, title, headers, rows) {
  const doc = new jsPDF();
  doc.text(title, 14, 15);
  autoTable(doc, { head: [headers], body: rows, startY: 20 });
  doc.save(filename);
}

// ─── Status / role colours ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  on_track:    { label: "On Track",    bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  at_risk:     { label: "At Risk",     bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  off_track:   { label: "Off Track",   bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  finished:    { label: "Finished",    bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  discontinued:{ label: "Discontinued",bg: "#f3f4f6", color: "#9ca3af", border: "#e5e7eb" },
};

const ROLE_COLORS = {
  "Project admin":  { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
  "Member":         { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Reader":         { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  "Manager":        { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  "Developer":      { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  "Reporter":       { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
};

function getRoleColor(role) {
  return ROLE_COLORS[role] || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.on_track;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 9px", borderRadius: 20,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  );
}

function RoleBadge({ role }) {
  const c = getRoleColor(role);
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      {role}
    </span>
  );
}

function Avatar({ name, avatarUrl, size = 32 }) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl} alt={name}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #1a67a3, #2563eb)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: "white",
    }}>
      {initials}
    </div>
  );
}

// ─── Members slide-over panel ─────────────────────────────────────────────────
function MembersPanel({ project, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch(`/openproject/projects/${project.id}/members`)
      .then(data => { if (!cancelled) { setMembers(data); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [project.id]);

  const allRoles = [...new Set(members.flatMap(m => m.roles))].sort();

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q);
    const matchRole = !roleFilter || m.roles.includes(roleFilter);
    return matchSearch && matchRole;
  });

  const exportCSV = () => {
    const headers = ["Name", "Type", "Roles"];
    const rows = filtered.map(m => [m.name, m.type, m.roles.join("; ")]);
    downloadCSV(`${project.name}-members.csv`, headers, rows);
  };

  const exportPDF = () => {
    const headers = ["Name", "Type", "Roles"];
    const rows = filtered.map(m => [m.name, m.type, m.roles.join("; ")]);
    downloadPDF(`${project.name}-members.pdf`, `${project.name} — Members`, headers, rows);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(17,24,39,0.35)", backdropFilter: "blur(2px)",
        }}
      />
      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 1001,
        width: "min(520px, 95vw)", background: "white",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
        animation: "slideInRight 0.2s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FolderKanban size={18} style={{ color: "#1d4ed8" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {project.name}
                </h2>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {project.identifier}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
              <X size={15} />
            </button>
          </div>

          {!loading && !error && (
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#374151", background: "#f3f4f6", padding: "3px 10px", borderRadius: 20 }}>
                <Users size={12} />{members.length} Members
              </span>
              {allRoles.map(role => {
                const c = getRoleColor(role);
                const count = members.filter(m => m.roles.includes(role)).length;
                return (
                  <span key={role} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                    {count} {role}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 150 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
            <input
              placeholder="Search member..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, outline: "none", background: "white", fontFamily: "inherit" }}
          >
            <option value="">All Roles</option>
            {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={exportCSV} title="Export CSV" style={{ padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", background: "white", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }} onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
            <Table size={13} /> CSV
          </button>
          <button onClick={exportPDF} title="Export PDF" style={{ padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", background: "white", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }} onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
            <FileText size={13} /> PDF
          </button>
        </div>

        {/* Member list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, gap: 10, color: "#6b7280" }}>
              <Loader2 size={20} className="animate-spin" /> Loading members…
            </div>
          )}
          {error && (
            <div style={{ margin: 20, padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}><AlertCircle size={15} /> Error</div>
              <div style={{ marginTop: 6, color: "#7f1d1d" }}>{error}</div>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 13 }}>No members found.</div>
          )}
          {!loading && !error && filtered.map(member => (
            <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f9fafb", transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Avatar name={member.name} avatarUrl={null} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {member.name}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                  {member.type === "Group" ? "👥 Group" : "👤 User"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0 }}>
                {member.roles.map(role => <RoleBadge key={role} role={role} />)}
              </div>
              {member.web_url && (
                <a href={member.web_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: "#9ca3af", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── User Picker ──────────────────────────────────────────────────────────────
function UserPicker({ selectedUser, onSelect, onClear }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch("/openproject/users")
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = users.filter(u => {
    const q = query.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || (u.login || "").toLowerCase().includes(q);
  });

  return (
    <div ref={containerRef} style={{ position: "relative", minWidth: 200 }}>
      {selectedUser ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px 5px 8px", border: "1px solid #93c5fd", borderRadius: 7, background: "#eff6ff", cursor: "pointer" }} onClick={() => setOpen(v => !v)}>
          <Avatar name={selectedUser.name} avatarUrl={null} size={22} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1e40af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedUser.name}</div>
            <div style={{ fontSize: 10, color: "#3b82f6" }}>@{selectedUser.login}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); setQuery(""); setOpen(false); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#3b82f6", display: "flex", padding: 2 }}
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setOpen(v => !v); setTimeout(() => inputRef.current?.focus(), 50); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, background: "white", cursor: "pointer", fontSize: 13, color: "#6b7280", fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
        >
          <User size={14} /> Filter by User
        </button>
      )}

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 500, background: "white", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", width: 280, overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 6px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
              <input
                ref={inputRef}
                placeholder="Search users…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width: "100%", padding: "6px 8px 6px 26px", border: "1px solid #e5e7eb", borderRadius: 5, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {loading && (
              <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Loader2 size={14} className="animate-spin" /> Loading users…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No users found</div>
            )}
            {!loading && filtered.map(u => (
              <div
                key={u.id}
                onClick={() => { onSelect(u); setOpen(false); setQuery(""); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer", transition: "background 0.1s", background: selectedUser?.id === u.id ? "#eff6ff" : "transparent" }}
                onMouseEnter={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = "transparent"; }}
              >
                <Avatar name={u.name} avatarUrl={null} size={28} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>@{u.login}</div>
                </div>
                {selectedUser?.id === u.id && <CheckCircle size={14} style={{ color: "#3b82f6", flexShrink: 0, marginLeft: "auto" }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, onViewMembers }) {
  const updatedAt = project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div style={{
      background: "white", border: "1px solid #e5e7eb", borderRadius: 10,
      padding: "18px 20px", transition: "box-shadow 0.15s, border-color 0.15s", cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"; e.currentTarget.style.borderColor = "#93c5fd"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FolderKanban size={18} style={{ color: "#1d4ed8" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.name}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, fontFamily: "monospace" }}>
            {project.identifier}
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Description */}
      {project.description && (
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {project.description}
        </p>
      )}

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        {project.public !== undefined && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
            {project.public ? <Globe size={11} /> : <Lock size={11} />}
            {project.public ? "Public" : "Private"}
          </span>
        )}
        {project.parentName && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
            <Building2 size={11} /> {project.parentName}
          </span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
          <Calendar size={11} /> {updatedAt}
        </span>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
        <a
          href={project.web_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#1d4ed8", textDecoration: "none", fontWeight: 500 }}
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={12} /> Open in OpenProject
        </a>
        <button
          onClick={() => onViewMembers(project)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.borderColor = "#93c5fd"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; }}
        >
          <Users size={13} /> View Members
        </button>
      </div>
    </div>
  );
}

// ─── Full Access Report Modal ─────────────────────────────────────────────────
function AccessReportModal({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRole] = useState("");
  const [projectFilter, setProject] = useState("");

  useEffect(() => {
    apiFetch("/openproject/access-report")
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const rows = data?.rows || [];
  const uniqueProjects = [...new Set(rows.map(r => r.project_name))].sort();
  const uniqueRoles = [...new Set(rows.flatMap(r => r.roles))].sort();

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.project_name.toLowerCase().includes(q) ||
      r.member_name.toLowerCase().includes(q);
    const matchRole = !roleFilter || r.roles.includes(roleFilter);
    const matchProject = !projectFilter || r.project_name === projectFilter;
    return matchSearch && matchRole && matchProject;
  });

  const exportCSV = () => {
    const headers = ["Project", "Identifier", "Member", "Type", "Roles"];
    const csvRows = filtered.map(r => [r.project_name, r.identifier, r.member_name, r.member_type, r.roles.join("; ")]);
    downloadCSV("OpenProject-Full-Access-Report.csv", headers, csvRows);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("OpenProject Full Access Report", 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleString()}  |  ${filtered.length} entries`, 14, 22);
    autoTable(doc, {
      head: [["Project", "Identifier", "Member", "Type", "Roles"]],
      body: filtered.map(r => [r.project_name, r.identifier, r.member_name, r.member_type, r.roles.join("; ")]),
      startY: 26,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [26, 103, 163], fontSize: 8, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save("OpenProject-Full-Access-Report.pdf");
  };

  const rolePill = (roles) => {
    const role = roles?.[0] || "Member";
    const c = getRoleColor(role);
    return (
      <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 20, background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
        {role}
      </span>
    );
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(17,24,39,0.45)", backdropFilter: "blur(3px)" }} />

      <div style={{ position: "fixed", inset: 0, zIndex: 1101, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
        <div style={{ background: "white", borderRadius: 14, boxShadow: "0 24px 80px rgba(0,0,0,0.22)", width: "100%", maxWidth: 1020, maxHeight: "90vh", display: "flex", flexDirection: "column", pointerEvents: "all", animation: "slideInRight 0.2s ease" }}>

          {/* Header */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #f3f4f6", background: "white", borderRadius: "14px 14px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={18} style={{ color: "#1d4ed8" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Full Project Access Report</h2>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  {data ? `${data.total_projects} projects · ${data.total_entries} access entries` : "Loading report…"}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
              <X size={15} />
            </button>
          </div>

          {/* Toolbar */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "#fafafa" }}>
            <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
              <input
                placeholder="Search project or member…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
            <select value={projectFilter} onChange={e => setProject(e.target.value)}
              style={{ padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, outline: "none", background: "white", fontFamily: "inherit", maxWidth: 200 }}>
              <option value="">All Projects</option>
              {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={roleFilter} onChange={e => setRole(e.target.value)}
              style={{ padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, outline: "none", background: "white", fontFamily: "inherit" }}>
              <option value="">All Roles</option>
              {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />
            <button onClick={exportCSV} disabled={!data} style={{ padding: "7px 12px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", background: "white", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "inherit", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
              <Table size={13} style={{ color: "#16a34a" }} /> Export CSV
            </button>
            <button onClick={exportPDF} disabled={!data} style={{ padding: "7px 12px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", background: "white", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "inherit", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#fef3c7"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
              <FileText size={13} style={{ color: "#d97706" }} /> Export PDF
            </button>
            <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto", whiteSpace: "nowrap" }}>{filtered.length} entries</span>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 64, gap: 14, color: "#6b7280" }}>
                <Loader2 size={32} className="animate-spin" style={{ color: "#1d4ed8" }} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>Fetching all projects and members…</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>This may take a moment.</div>
              </div>
            )}
            {error && (
              <div style={{ margin: 20, padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}><AlertCircle size={15} /> Error loading report</div>
                <div style={{ marginTop: 6, color: "#7f1d1d" }}>{error}</div>
              </div>
            )}
            {!loading && !error && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb", position: "sticky", top: 0, zIndex: 5 }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>Project</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Identifier</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Member</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>Primary Role</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>All Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>No entries found.</td></tr>
                  ) : filtered.map((r, i) => (
                    <tr key={`${r.project_id}-${r.member_id}-${i}`}
                      style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafafa"}
                    >
                      <td style={{ padding: "9px 16px", fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{r.project_name}</td>
                      <td style={{ padding: "9px 16px", color: "#6b7280", fontSize: 11, fontFamily: "monospace" }}>{r.identifier}</td>
                      <td style={{ padding: "9px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={r.member_name} avatarUrl={null} size={26} />
                          <span style={{ fontWeight: 600, color: "#111827" }}>{r.member_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "9px 16px", color: "#6b7280", fontSize: 11 }}>{r.member_type}</td>
                      <td style={{ padding: "9px 16px", textAlign: "center" }}>{rolePill(r.roles)}</td>
                      <td style={{ padding: "9px 16px", fontSize: 11, color: "#6b7280" }}>{r.roles.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", background: "#fafafa", borderRadius: "0 0 14px 14px" }}>
            <button onClick={onClose} style={{ padding: "8px 20px", border: "1px solid #e5e7eb", borderRadius: 7, background: "white", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 500, color: "#374151" }}>Close</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main OpenProject Page ────────────────────────────────────────────────────
export default function OpenProjectPage() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visFilter, setVisFilter] = useState("");

  // User filter
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProjectIds, setUserProjectIds] = useState(null);
  const [userMemberships, setUserMemberships] = useState([]);
  const [userFilterLoading, setUserFilterLoading] = useState(false);

  // Full Access Report
  const [showAccessReport, setShowAccessReport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusData, projectsData] = await Promise.all([
        apiFetch("/openproject/status"),
        apiFetch("/openproject/projects"),
      ]);
      setStatus(statusData);
      setProjects(projectsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSelectUser = useCallback(async (user) => {
    setSelectedUser(user);
    setUserFilterLoading(true);
    try {
      const memberships = await apiFetch(`/openproject/users/${user.id}/memberships`);
      setUserProjectIds(new Set(memberships.map(m => m.project_id)));
      setUserMemberships(memberships);
    } catch {
      setUserProjectIds(new Set());
      setUserMemberships([]);
    } finally {
      setUserFilterLoading(false);
    }
  }, []);

  const handleClearUser = useCallback(() => {
    setSelectedUser(null);
    setUserProjectIds(null);
    setUserMemberships([]);
  }, []);

  const exportCSV = () => {
    if (selectedUser && userMemberships.length > 0) {
      const headers = ["Project ID", "Project Name", "Identifier", "Roles"];
      const rows = userMemberships.map(m => [m.project_id, m.project_name, m.project_identifier, m.roles.join("; ")]);
      downloadCSV(`User-${selectedUser.login}-Access.csv`, headers, rows);
    } else {
      const headers = ["Project Name", "Identifier", "Status", "Public"];
      const rows = filtered.map(p => [p.name, p.identifier, p.status, p.public ? "Yes" : "No"]);
      downloadCSV("OpenProject-Projects.csv", headers, rows);
    }
  };

  const exportPDF = () => {
    if (selectedUser && userMemberships.length > 0) {
      const headers = ["Project ID", "Project Name", "Identifier", "Roles"];
      const rows = userMemberships.map(m => [m.project_id, m.project_name, m.project_identifier, m.roles.join("; ")]);
      downloadPDF(`User-${selectedUser.login}-Access.pdf`, `Access Records for ${selectedUser.name}`, headers, rows);
    } else {
      const headers = ["Project Name", "Identifier", "Status", "Public"];
      const rows = filtered.map(p => [p.name, p.identifier, p.status, p.public ? "Yes" : "No"]);
      downloadPDF("OpenProject-Projects.pdf", "OpenProject Projects Overview", headers, rows);
    }
  };

  // Filter logic
  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.identifier.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchVis = !visFilter || String(p.public) === visFilter;
    const matchUser = userProjectIds === null || userProjectIds.has(p.id);
    return matchSearch && matchStatus && matchVis && matchUser;
  });

  // Stats
  const stats = {
    total: projects.length,
    on_track: projects.filter(p => p.status === "on_track").length,
    at_risk: projects.filter(p => p.status === "at_risk").length,
    off_track: projects.filter(p => p.status === "off_track").length,
    finished: projects.filter(p => p.status === "finished").length,
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Connection status banner */}
      {status && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", borderRadius: 8, marginBottom: 20,
          background: status.connected ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${status.connected ? "#bbf7d0" : "#fecaca"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {status.connected
              ? <CheckCircle size={15} style={{ color: "#16a34a" }} />
              : <AlertTriangle size={15} style={{ color: "#dc2626" }} />
            }
            <span style={{ fontSize: 13, color: status.connected ? "#15803d" : "#dc2626", fontWeight: 500 }}>
              {status.connected
                ? `Connected to OpenProject${status.instanceName ? ` — ${status.instanceName}` : ""} (v${status.version})`
                : `OpenProject connection failed — ${status.error}`
              }
            </span>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 5, background: "white", fontSize: 11, fontWeight: 500, cursor: "pointer", color: "#374151" }}
          >
            <RefreshCw size={11} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      )}

      {/* Not configured notice */}
      {error && error.includes("not configured") && (
        <div style={{ padding: 32, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <FolderKanban size={26} style={{ color: "#1d4ed8" }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>OpenProject Not Configured</div>
          <p style={{ fontSize: 13, color: "#6b7280", maxWidth: 440, margin: "0 auto 20px", lineHeight: 1.6 }}>
            To enable OpenProject integration, add your OpenProject URL and API Token to the <code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: 4 }}>backend/.env</code> file.
          </p>
          <div style={{ background: "#1e1e2e", borderRadius: 8, padding: "14px 20px", textAlign: "left", maxWidth: 460, margin: "0 auto", fontFamily: "monospace", fontSize: 12, color: "#cdd6f4", lineHeight: 1.8 }}>
            <span style={{ color: "#a6e3a1" }}># backend/.env</span><br />
            <span style={{ color: "#89b4fa" }}>OPENPROJECT_URL</span>=https://openproject.yourcompany.com<br />
            <span style={{ color: "#89b4fa" }}>OPENPROJECT_TOKEN</span>=your_api_token_here
          </div>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 16 }}>
            Generate a token in OpenProject → <strong>My Account → Access Tokens → + API Token</strong>
          </p>
        </div>
      )}

      {/* General error */}
      {error && !error.includes("not configured") && (
        <div style={{ padding: "16px 20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", marginBottom: 20, fontSize: 13 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600, marginBottom: 4 }}>
            <AlertCircle size={15} /> Failed to load OpenProject data
          </div>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: "#6b7280" }}>
          <Loader2 size={22} className="animate-spin" />
          <span style={{ fontSize: 14 }}>Fetching projects from OpenProject…</span>
        </div>
      )}

      {/* Main content */}
      {!loading && !error && (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 22 }}>
            {[
              { label: "Total Projects", value: stats.total,     color: "#1d4ed8", bg: "#dbeafe", icon: FolderKanban },
              { label: "On Track",       value: stats.on_track,  color: "#16a34a", bg: "#dcfce7", icon: CheckCircle },
              { label: "At Risk",        value: stats.at_risk,   color: "#d97706", bg: "#fef3c7", icon: AlertTriangle },
              { label: "Off Track",      value: stats.off_track, color: "#dc2626", bg: "#fee2e2", icon: AlertCircle },
              { label: "Finished",       value: stats.finished,  color: "#6b7280", bg: "#f3f4f6", icon: Shield },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3, fontWeight: 500 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters bar */}
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", marginBottom: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
              <input
                placeholder="Search projects..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            {/* User filter */}
            <div style={{ position: "relative" }}>
              <UserPicker selectedUser={selectedUser} onSelect={handleSelectUser} onClear={handleClearUser} />
              {userFilterLoading && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, fontSize: 11, color: "#1d4ed8", display: "flex", alignItems: "center", gap: 4, background: "white", padding: "4px 8px", borderRadius: 5, border: "1px solid #bfdbfe", whiteSpace: "nowrap" }}>
                  <Loader2 size={11} className="animate-spin" /> Loading projects for this user…
                </div>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, outline: "none", background: "white", fontFamily: "inherit" }}
            >
              <option value="">All Statuses</option>
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="off_track">Off Track</option>
              <option value="finished">Finished</option>
              <option value="discontinued">Discontinued</option>
            </select>

            <select
              value={visFilter}
              onChange={e => setVisFilter(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, outline: "none", background: "white", fontFamily: "inherit" }}
            >
              <option value="">All Visibility</option>
              <option value="true">Public</option>
              <option value="false">Private</option>
            </select>

            <button
              onClick={load}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e5e7eb", borderRadius: 7, background: "white", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#374151", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
            >
              <RefreshCw size={13} /> Refresh
            </button>

            <button
              onClick={() => setShowAccessReport(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e5e7eb", borderRadius: 7, background: "white", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#374151", transition: "all 0.15s", whiteSpace: "nowrap" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
              title="Generate a full report of all projects × all members × roles"
            >
              <Shield size={13} /> Full Access Report
            </button>

            <div style={{ width: "1px", height: "24px", background: "#e5e7eb", margin: "0 4px" }} />
            <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e5e7eb", borderRadius: 7, background: "white", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#374151", transition: "all 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
              <Table size={13} /> CSV
            </button>
            <button onClick={exportPDF} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e5e7eb", borderRadius: 7, background: "white", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#374151", transition: "all 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
              <FileText size={13} /> PDF
            </button>

            <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "auto" }}>
              {filtered.length} of {projects.length} projects
            </span>
          </div>

          {/* Active user filter banner */}
          {selectedUser && !userFilterLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 14px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 8, fontSize: 13 }}>
              <Avatar name={selectedUser.name} avatarUrl={null} size={24} />
              <span style={{ color: "#1e40af", fontWeight: 500 }}>
                Showing <strong>{filtered.length}</strong> project{filtered.length !== 1 ? "s" : ""} accessible by{" "}
                <strong>{selectedUser.name}</strong> (@{selectedUser.login})
              </span>
              <button onClick={handleClearUser} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#3b82f6", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500 }}>
                <X size={12} /> Clear
              </button>
            </div>
          )}

          {/* No results */}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <Search size={32} style={{ color: "#d1d5db", marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No projects found</div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Try adjusting your search or filter.</div>
            </div>
          )}

          {/* Project grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {filtered.map(project => (
              <ProjectCard key={project.id} project={project} onViewMembers={setSelectedProject} />
            ))}
          </div>
        </>
      )}

      {/* Members slide-over */}
      {selectedProject && (
        <MembersPanel project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      {/* Full Access Report modal */}
      {showAccessReport && (
        <AccessReportModal onClose={() => setShowAccessReport(false)} />
      )}
    </div>
  );
}
