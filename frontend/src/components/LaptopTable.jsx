import { useState, useRef, useEffect, useCallback } from "react";
import {
  UserCheck, CornerDownLeft,
  PackageX, Clock, Search, ChevronDown, Plus, Edit3, Columns
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { format } from "date-fns";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DEPARTMENTS } from "../services/laptopService";

const fmt = (val) => val ? val : <span style={{ color: "#d1d5db" }}>—</span>;

const fmtDate = (val) => {
  if (!val) return <span style={{ color: "#d1d5db" }}>—</span>;
  try { return format(new Date(val), "dd MMM yyyy"); }
  catch { return val; }
};

const fmtCurrency = (val) =>
  val ? `Rs ${Number(val).toLocaleString()}` : <span style={{ color: "#d1d5db" }}>—</span>;

// ─── Portal dropdown ─────────────────────────────────────────────────────────
function PortalDropdown({ triggerRef, onClose, children }) {
  const dropdownRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 192) });
  }, [triggerRef]);

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
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
      width: 192, overflow: "hidden",
    }}>
      {children}
    </div>,
    document.body
  );
}

function ActionItem({ icon: Icon, label, onClick, danger, id, noBorder }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      id={id} onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "9px 14px", fontSize: 13, fontWeight: 500,
        color: hovered
          ? (danger ? "#dc2626" : "#111827")
          : (danger ? "#ef4444" : "#374151"),
        cursor: "pointer",
        background: hovered
          ? (danger ? "#fef2f2" : "#f9fafb")
          : "transparent",
        border: "none",
        borderTop: noBorder ? "none" : "1px solid #f3f4f6",
        width: "100%", textAlign: "left", fontFamily: "inherit", transition: "all 0.1s",
      }}
    >
      <Icon size={13} /> {label}
    </button>
  );
}

// ─── Action menu ─────────────────────────────────────────────────────────────
// Workflow:
//  Available  → [Assign to User] [Return to Vendor]
//  Assigned   → [Return to MS]   (Cannot return to vendor directly)
//  With MS    → [Assign to User] [Return to Vendor]
//  Returned to Vendor → [View History only]
// NOTE: Transfer is intentionally disabled. Only MS (admin) can re-assign.
function ActionMenu({ laptop, onAssign, onReturnMS, onReturnVendor, onHistory, onEdit }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);

  const canAssign       = laptop.status === "Available" || laptop.status === "With MS" || laptop.status === "With HR";
  const canReturnMS     = laptop.status === "Assigned";
  const canReturnVendor = laptop.status === "Available" || laptop.status === "With MS" || laptop.status === "With HR";

  const handle = (fn) => () => { close(); fn(); };

  return (
    <>
      <button
        ref={btnRef}
        id={`action-btn-${laptop.id}`}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "5px 10px", fontSize: 12, fontWeight: 500,
          fontFamily: "inherit", cursor: "pointer",
          background: open ? "#f3f4f6" : "white",
          border: "1px solid #e5e7eb", borderRadius: 6,
          color: "#374151", transition: "all 0.12s", whiteSpace: "nowrap",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
        onMouseLeave={e => e.currentTarget.style.background = open ? "#f3f4f6" : "white"}
      >
        Actions
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <PortalDropdown triggerRef={btnRef} onClose={close}>
          <ActionItem id={`edit-btn-${laptop.id}`}              icon={Edit3}          label="View / Edit Asset" onClick={handle(onEdit)} />
          <ActionItem id={`history-btn-${laptop.id}`}           icon={Clock}          label="View History"      onClick={handle(onHistory)}         noBorder />
          {canAssign       && <ActionItem id={`assign-btn-${laptop.id}`}       icon={UserCheck}      label="Assign to User"   onClick={handle(onAssign)} />}
          {canReturnMS     && <ActionItem id={`returnms-btn-${laptop.id}`}     icon={CornerDownLeft} label="Return to MS"     onClick={handle(onReturnMS)} />}
          {canReturnVendor && <ActionItem id={`returnvendor-btn-${laptop.id}`} icon={PackageX}       label="Return to Vendor" onClick={handle(onReturnVendor)} danger />}
        </PortalDropdown>
      )}
    </>
  );
}

const AVAILABLE_COLUMNS = [
  { id: "index", label: "#" },
  { id: "model", label: "Model" },
  { id: "hrRef", label: "HR Ref No" },
  { id: "serial", label: "Serial No" },
  { id: "deliveryDate", label: "Delivery Date" },
  { id: "user", label: "Current User" },
  { id: "handoverDate", label: "Handover Date" },
  { id: "department", label: "Department" },
  { id: "rate", label: "Rate/Month" },
  { id: "status", label: "Status" },
  { id: "adminAccount", label: "Admin Account" },
  { id: "massStorage", label: "Mass Storage" },
  { id: "comments", label: "Comments" }
];

function ColumnToggle({ visibleColumns, toggleColumn }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="btn btn-secondary"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        <Columns size={14} /> Columns
      </button>
      {open && (
        <PortalDropdown triggerRef={btnRef} onClose={close}>
          <div style={{ padding: "8px 0", maxHeight: 300, overflowY: "auto" }}>
            <div style={{ padding: "4px 14px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Show Columns</div>
            {AVAILABLE_COLUMNS.map(col => (
              <label key={col.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: "#374151" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <input type="checkbox" checked={visibleColumns.has(col.id)} onChange={() => toggleColumn(col.id)} />
                {col.label}
              </label>
            ))}
          </div>
        </PortalDropdown>
      )}
    </>
  );
}

// ─── Main table ───────────────────────────────────────────────────────────────
export default function LaptopTable({
  laptops, search, setSearch, statusFilter, setStatusFilter,
  departmentFilter, setDepartmentFilter, modelFilter, setModelFilter, currentUserFilter, setCurrentUserFilter,
  startDate, setStartDate, endDate, setEndDate, existingModels = [], existingUsers = [],
  onAssign, onReturnMS, onReturnVendor, onHistory, onAdd, onEdit, onBulkEmail
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [visibleColumns, setVisibleColumns] = useState(new Set(AVAILABLE_COLUMNS.map(c => c.id)));

  const filtered = laptops.filter((l) => {
    const term = search.toLowerCase();
    const matchSearch = !term ||
      l.model?.toLowerCase().includes(term) ||
      l.serialNo?.toLowerCase().includes(term) ||
      l.hrRefNumber?.toLowerCase().includes(term) ||
      l.currentUserName?.toLowerCase().includes(term) ||
      l.department?.toLowerCase().includes(term);
    const matchStatus = !statusFilter || l.status === statusFilter ||
      (statusFilter === "With MS" && l.status === "With HR");
    const matchDepartment = !departmentFilter || l.department === departmentFilter;
    const matchModel = !modelFilter || l.model === modelFilter;
    const matchUser = !currentUserFilter || l.currentUserName === currentUserFilter;
    let matchDate = true;
    if (startDate || endDate) {
      const hDate = l.handoverDate ? new Date(l.handoverDate) : null;
      if (hDate) {
        if (startDate && hDate < new Date(startDate)) matchDate = false;
        if (endDate && hDate > new Date(endDate)) matchDate = false;
      } else {
        matchDate = false; // if no handover date, it doesn't match the range
      }
    }
    return matchSearch && matchStatus && matchDepartment && matchModel && matchUser && matchDate;
  });

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(new Set(filtered.map(l => l.id)));
    else setSelectedIds(new Set());
  };

  const toggleColumn = (id) => {
    const next = new Set(visibleColumns);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVisibleColumns(next);
  };

  const handleBulkEmail = () => {
    const selectedLaptops = laptops.filter(l => selectedIds.has(l.id));
    onBulkEmail(selectedLaptops);
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Laptops Export", 14, 15);
      const tableData = filtered.map((l, i) => [
        i + 1, l.model, l.serialNo, l.currentUserName || "N/A", l.department || "N/A", l.status
      ]);
      autoTable(doc, {
        head: [["#", "Model", "Serial No", "Current User", "Department", "Status"]],
        body: tableData,
        startY: 20,
      });
      doc.save("laptops_export.pdf");
    } catch (err) {
      console.error("PDF Export Error: ", err);
      alert("Failed to export PDF. Check console for details.");
    }
  };

  const exportCSV = () => {
    const headers = ["Model", "HR Ref", "Serial No", "Delivery Date", "Current User", "Handover Date", "Department", "Rate", "Status", "Comments"];
    const rows = filtered.map(l => [
      `"${l.model || ""}"`, `"${l.hrRefNumber || ""}"`, `"${l.serialNo || ""}"`, `"${l.dateOfDelivery || ""}"`,
      `"${l.currentUserName || ""}"`, `"${l.handoverDate || ""}"`, `"${l.department || ""}"`, `"${l.ratePerMonth || ""}"`,
      `"${l.status || ""}"`, `"${(l.comments || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "laptops_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
    }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderBottom: "1px solid #f3f4f6", gap: 12, flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <Search size={14} style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "#9ca3af", pointerEvents: "none"
            }} />
            <input
              id="laptop-search"
              type="text"
              placeholder="Search model, serial, user…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13,
                color: "#111827", background: "#f9fafb", outline: "none", fontFamily: "inherit",
                transition: "border-color 0.15s, background 0.15s"
              }}
              onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.background = "white"; }}
              onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#f9fafb"; }}
            />
          </div>

          {/* Status filter */}
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "7px 12px", border: "1px solid #e5e7eb", borderRadius: 6,
              fontSize: 13, color: "#374151", background: "#f9fafb",
              outline: "none", cursor: "pointer", fontFamily: "inherit"
            }}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="With MS">With MS</option>
            <option value="Returned to Vendor">Returned to Vendor</option>
          </select>

          {/* Department filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: "7px 12px", border: "1px solid #e5e7eb", borderRadius: 6,
              fontSize: 13, color: "#374151", background: "#f9fafb",
              outline: "none", cursor: "pointer", fontFamily: "inherit"
            }}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>



          {/* Date filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>From:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: "6px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12 }} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>To:</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: "6px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12 }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {selectedIds.size > 0 && (
            <button onClick={handleBulkEmail} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, color: "#2563eb", borderColor: "#bfdbfe", background: "#eff6ff" }}>
              Email ({selectedIds.size})
            </button>
          )}
          
          <ColumnToggle visibleColumns={visibleColumns} toggleColumn={toggleColumn} />

          <button onClick={exportCSV} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            CSV
          </button>
          <button onClick={exportPDF} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            PDF
          </button>

          <button
            className="btn btn-primary"
            onClick={onAdd}
            id="add-laptop-btn"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={14} />
            Add Laptop
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 30, paddingLeft: 16 }}>
                <input type="checkbox" onChange={toggleSelectAll} checked={filtered.length > 0 && selectedIds.size === filtered.length} />
              </th>
              {visibleColumns.has("index") && <th style={{ width: 42 }}>#</th>}
              {visibleColumns.has("model") && <th>Model</th>}
              {visibleColumns.has("hrRef") && <th>HR Ref No</th>}
              {visibleColumns.has("serial") && <th>Serial No</th>}
              {visibleColumns.has("deliveryDate") && <th>Delivery Date</th>}
              {visibleColumns.has("user") && <th>Current User</th>}
              {visibleColumns.has("handoverDate") && <th>Handover Date</th>}
              {visibleColumns.has("department") && <th>Department</th>}
              {visibleColumns.has("rate") && <th>Rate/Month</th>}
              {visibleColumns.has("status") && <th>Status</th>}
              {visibleColumns.has("adminAccount") && <th>Admin Account</th>}
              {visibleColumns.has("massStorage") && <th>Mass Storage</th>}
              {visibleColumns.has("comments") && <th>Comments</th>}
              <th style={{ width: 110, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={2 + visibleColumns.size} style={{ textAlign: "center", padding: "56px 20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <Search size={20} style={{ color: "#9ca3af" }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No laptops found</div>
                    <div style={{ fontSize: 13, color: "#9ca3af" }}>Try adjusting your search or filter</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((laptop, idx) => (
                <tr key={laptop.id}>
                  <td style={{ paddingLeft: 16 }}>
                    <input type="checkbox" checked={selectedIds.has(laptop.id)} onChange={() => toggleSelect(laptop.id)} />
                  </td>
                  {visibleColumns.has("index") && <td style={{ color: "#9ca3af", fontWeight: 500, fontSize: 12 }}>{idx + 1}</td>}
                  {visibleColumns.has("model") && <td style={{ fontWeight: 500, color: "#111827" }}>{fmt(laptop.model)}</td>}
                  {visibleColumns.has("hrRef") && <td style={{ fontFamily: "monospace", fontSize: 12 }}>{fmt(laptop.hrRefNumber)}</td>}
                  {visibleColumns.has("serial") && <td style={{ fontFamily: "monospace", fontSize: 12 }}>{fmt(laptop.serialNo)}</td>}
                  {visibleColumns.has("deliveryDate") && <td>{fmtDate(laptop.dateOfDelivery)}</td>}
                  {visibleColumns.has("user") && <td style={{ fontWeight: 500 }}>{fmt(laptop.currentUserName)}</td>}
                  {visibleColumns.has("handoverDate") && <td>{fmtDate(laptop.handoverDate)}</td>}
                  {visibleColumns.has("department") && <td>{fmt(laptop.department)}</td>}
                  {visibleColumns.has("rate") && <td style={{ fontWeight: 500 }}>{fmtCurrency(laptop.ratePerMonth)}</td>}
                  {visibleColumns.has("status") && <td><StatusBadge status={laptop.status} /></td>}
                  {visibleColumns.has("adminAccount") && <td>{laptop.adminAccountEnabled ? "Enabled" : "Disabled"}</td>}
                  {visibleColumns.has("massStorage") && <td>{laptop.massStorageDisabled ? "Disabled" : "Enabled"}</td>}
                  {visibleColumns.has("comments") && <td style={{ maxWidth: 140, color: "#6b7280", fontSize: 12 }}>
                    <span title={laptop.comments} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {fmt(laptop.comments)}
                    </span>
                  </td>}
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <ActionMenu
                      laptop={laptop}
                      onAssign={() => onAssign(laptop)}
                      onReturnMS={() => onReturnMS(laptop)}
                      onReturnVendor={() => onReturnVendor(laptop)}
                      onHistory={() => onHistory(laptop)}
                      onEdit={() => onEdit(laptop)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div style={{
          padding: "10px 20px", borderTop: "1px solid #f3f4f6",
          fontSize: 12, color: "#9ca3af", display: "flex", justifyContent: "space-between"
        }}>
          <span>Showing <strong style={{ color: "#374151" }}>{filtered.length}</strong> of <strong style={{ color: "#374151" }}>{laptops.length}</strong> laptop{laptops.length !== 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}
