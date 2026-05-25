import { useState, useRef, useEffect, useCallback } from "react";
import {
  UserCheck, CornerDownLeft,
  PackageX, Clock, Search, ChevronDown, Plus, Edit3
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { format } from "date-fns";
import { createPortal } from "react-dom";

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

// ─── Main table ───────────────────────────────────────────────────────────────
export default function LaptopTable({
  laptops, search, setSearch, statusFilter, setStatusFilter,
  onAssign, onReturnMS, onReturnVendor, onHistory, onAdd, onEdit,
}) {
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
    return matchSearch && matchStatus;
  });

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
        </div>

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

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 42 }}>#</th>
              <th>Model</th>
              <th>HR Ref No</th>
              <th>Serial No</th>
              <th>Delivery Date</th>
              <th>Current User</th>
              <th>Handover Date</th>
              <th>Department</th>
              <th>Rate/Month</th>
              <th>Status</th>
              <th>Comments</th>
              <th style={{ width: 110, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: "center", padding: "56px 20px" }}>
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
                  <td style={{ color: "#9ca3af", fontWeight: 500, fontSize: 12 }}>{idx + 1}</td>
                  <td style={{ fontWeight: 500, color: "#111827" }}>{fmt(laptop.model)}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{fmt(laptop.hrRefNumber)}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{fmt(laptop.serialNo)}</td>
                  <td>{fmtDate(laptop.dateOfDelivery)}</td>
                  <td style={{ fontWeight: 500 }}>{fmt(laptop.currentUserName)}</td>
                  <td>{fmtDate(laptop.handoverDate)}</td>
                  <td>{fmt(laptop.department)}</td>
                  <td style={{ fontWeight: 500 }}>{fmtCurrency(laptop.ratePerMonth)}</td>
                  <td><StatusBadge status={laptop.status} /></td>
                  <td style={{ maxWidth: 140, color: "#6b7280", fontSize: 12 }}>
                    <span title={laptop.comments} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {fmt(laptop.comments)}
                    </span>
                  </td>
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
