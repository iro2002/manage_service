import { useState, useMemo, useCallback } from "react";
import { X, FileText, Building2, CalendarDays, Printer, ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, getDaysInMonth, getDate, parseISO, isValid } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ── helpers ──────────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function getDailyRate(ratePerMonth, daysInMonth) {
  return ratePerMonth / daysInMonth;
}

/**
 * Calculate billable days for a laptop in the given billing month/year.
 * Rules:
 *  - If laptop was delivered this month → days from delivery day to end of month
 *  - If laptop was delivered before this month → full month
 *  - If laptop is "Returned to Vendor" → uses manualDays (user input)
 *  - Result capped between 0 and daysInMonth
 */
function calcBillableDays(laptop, year, month, daysInMonth, manualDays) {
  if (manualDays !== null && manualDays !== undefined) return Number(manualDays);

  const deliveryStr = laptop.dateOfDelivery;
  if (!deliveryStr) return daysInMonth; // assume full month if no delivery date

  let deliveryDate;
  try { deliveryDate = parseISO(deliveryStr); } catch { return daysInMonth; }
  if (!isValid(deliveryDate)) return daysInMonth;

  const dYear  = deliveryDate.getFullYear();
  const dMonth = deliveryDate.getMonth() + 1; // 1-indexed
  const dDay   = getDate(deliveryDate);

  // Delivered in billing month → partial
  if (dYear === year && dMonth === month) {
    return daysInMonth - dDay + 1;
  }
  // Delivered after billing month → 0 (shouldn't appear but guard)
  if (dYear > year || (dYear === year && dMonth > month)) return 0;
  // Delivered before billing month → full month
  return daysInMonth;
}

// ── Field style ───────────────────────────────────────────────────────────────
const sel = {
  padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6,
  fontSize: 13, color: "#111827", background: "white", outline: "none",
  fontFamily: "inherit", cursor: "pointer", width: "100%",
};

// ── Main component ────────────────────────────────────────────────────────────
export default function BillGeneratorModal({ laptops, onClose }) {
  const today = new Date();
  const [vendor, setVendor]     = useState("");
  const [month, setMonth]       = useState(today.getMonth() + 1);  // 1–12
  const [year,  setYear]        = useState(today.getFullYear());
  const [notes, setNotes]       = useState("");
  const [manualDays, setManualDays] = useState({}); // laptopId → days override
  const [includeReturned, setIncludeReturned] = useState({}); // laptopId → bool

  const vendors = useMemo(() =>
    [...new Set(laptops.map(l => l.vendorName).filter(Boolean))].sort()
  , [laptops]);

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));

  // Filter laptops for selected vendor
  const vendorLaptops = useMemo(() => {
    if (!vendor) return [];
    return laptops.filter(l => l.vendorName === vendor);
  }, [laptops, vendor]);

  const activeLaptops   = vendorLaptops.filter(l => l.status !== "Returned to Vendor");
  const returnedLaptops = vendorLaptops.filter(l => l.status === "Returned to Vendor");

  // Build bill rows
  const billRows = useMemo(() => {
    const rows = [];

    for (const l of activeLaptops) {
      const rate = Number(l.ratePerMonth) || 0;
      const days = calcBillableDays(l, year, month, daysInMonth, manualDays[l.id]);
      const dailyRate = getDailyRate(rate, daysInMonth);
      const amount = Math.round(dailyRate * days);
      rows.push({ ...l, days, dailyRate: Math.round(dailyRate), amount, isReturned: false });
    }

    for (const l of returnedLaptops) {
      if (!includeReturned[l.id]) continue;
      const rate = Number(l.ratePerMonth) || 0;
      const days = manualDays[l.id] ?? 0;
      const dailyRate = getDailyRate(rate, daysInMonth);
      const amount = Math.round(dailyRate * days);
      rows.push({ ...l, days, dailyRate: Math.round(dailyRate), amount, isReturned: true });
    }

    return rows;
  }, [activeLaptops, returnedLaptops, year, month, daysInMonth, manualDays, includeReturned]);

  const grandTotal = billRows.reduce((s, r) => s + r.amount, 0);

  const updateDays = (id, val) => {
    const n = Math.max(0, Math.min(daysInMonth, Number(val)));
    setManualDays(prev => ({ ...prev, [id]: n }));
  };

  const resetDays = (id) => {
    setManualDays(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const exportPDF = useCallback(() => {
    if (!vendor || billRows.length === 0) return;

    const doc = new jsPDF();
    const periodLabel = `${MONTHS[month - 1]} ${year}`;
    const pageW = doc.internal.pageSize.getWidth();

    // ── Header block
    doc.setFillColor(15, 29, 74); // sidebar navy
    doc.rect(0, 0, pageW, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("LAPTOP RENTAL INVOICE", 14, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Manage Service", 14, 23);
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")}`, 14, 29);

    // ── Meta box
    doc.setTextColor(30, 30, 30);
    doc.setFillColor(248, 249, 250);
    doc.rect(0, 40, pageW, 28, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Vendor:", 14, 50);
    doc.text("Billing Period:", 14, 58);
    doc.text("Days in Month:", 14, 66);

    doc.setFont("helvetica", "normal");
    doc.text(vendor, 50, 50);
    doc.text(periodLabel, 50, 58);
    doc.text(String(daysInMonth), 50, 66);

    doc.setFont("helvetica", "bold");
    doc.text("Total Laptops:", pageW / 2, 50);
    doc.text("Grand Total:", pageW / 2, 58);

    doc.setFont("helvetica", "normal");
    doc.text(String(billRows.length), pageW / 2 + 30, 50);
    doc.setTextColor(79, 70, 229);
    doc.text(`Rs ${grandTotal.toLocaleString()}`, pageW / 2 + 30, 58);

    // ── Table
    doc.setTextColor(30, 30, 30);
    autoTable(doc, {
      startY: 74,
      head: [["#", "Model", "Serial No", "HR Ref", "Current User", "Days", "Daily Rate (Rs)", "Amount (Rs)"]],
      body: billRows.map((r, i) => [
        i + 1,
        r.model || "—",
        r.serialNo || "—",
        r.hrRefNumber || "—",
        r.currentUserName || "—",
        r.days,
        r.dailyRate.toLocaleString(),
        r.amount.toLocaleString(),
      ]),
      foot: [["", "", "", "", "", "", "GRAND TOTAL", `Rs ${grandTotal.toLocaleString()}`]],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 29, 74], textColor: [255, 255, 255], fontStyle: "bold" },
      footStyles: { fillColor: [240, 240, 255], textColor: [79, 70, 229], fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 8 },
        5: { halign: "center" },
        6: { halign: "right" },
        7: { halign: "right", fontStyle: "bold" },
      },
    });

    // ── Notes
    if (notes.trim()) {
      const finalY = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, finalY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(notes, 14, finalY + 6, { maxWidth: pageW - 28 });
    }

    doc.save(`Bill_${vendor.replace(/\s+/g, "_")}_${MONTHS[month - 1]}_${year}.pdf`);
  }, [vendor, billRows, grandTotal, daysInMonth, month, year, notes]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "100%", maxWidth: 900, maxHeight: "92vh", display: "flex", flexDirection: "column",
        background: "white", borderRadius: 14, overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>

        {/* ── Modal Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={17} style={{ color: "#6d28d9" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Generate Vendor Bill</h2>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Pro-rated daily billing — Rs/day = Rate/Month ÷ Days in Month</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            <X size={15} />
          </button>
        </div>

        {/* ── Controls */}
        <div style={{ padding: "16px 24px", background: "#fafafa", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Vendor */}
          <div style={{ flex: 2, minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Vendor *
            </div>
            <select value={vendor} onChange={e => setVendor(e.target.value)} style={sel}>
              <option value="">Select vendor…</option>
              {vendors.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Month */}
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Month
            </div>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={sel}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>

          {/* Year */}
          <div style={{ flex: 1, minWidth: 90 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Year
            </div>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={sel}>
              {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y =>
                <option key={y} value={y}>{y}</option>
              )}
            </select>
          </div>

          {/* Days in month info */}
          <div style={{ padding: "8px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#166534", fontWeight: 600, whiteSpace: "nowrap" }}>
            {daysInMonth} days in month<br />
            <span style={{ fontSize: 11, fontWeight: 400, color: "#4ade80" }}>Daily Rate = Rate ÷ {daysInMonth}</span>
          </div>
        </div>

        {/* ── Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {!vendor ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12, color: "#9ca3af" }}>
              <Building2 size={36} style={{ opacity: 0.4 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>Select a vendor to generate the bill</div>
            </div>
          ) : vendorLaptops.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12 }}>
              <AlertCircle size={36} style={{ color: "#f59e0b" }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>No laptops found for "{vendor}"</div>
            </div>
          ) : (
            <>
              {/* Bill Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#0f1d4a" }}>
                      {["#", "Model", "Serial No", "HR Ref", "Status", "Current User", "Rate/Month", `Days (of ${daysInMonth})`, "Daily Rate", "Amount"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeLaptops.map((l, idx) => {
                      const rate     = Number(l.ratePerMonth) || 0;
                      const days     = calcBillableDays(l, year, month, daysInMonth, manualDays[l.id]);
                      const daily    = Math.round(getDailyRate(rate, daysInMonth));
                      const amount   = Math.round(daily * days);
                      const isPartial = days < daysInMonth;

                      return (
                        <tr key={l.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "10px 14px", color: "#9ca3af", fontSize: 12 }}>{idx + 1}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{l.model || "—"}</td>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#374151" }}>{l.serialNo || "—"}</td>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#374151" }}>{l.hrRefNumber || "—"}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                              background: l.status === "Assigned" ? "#dbeafe" : l.status === "Available" ? "#dcfce7" : "#ede9fe",
                              color: l.status === "Assigned" ? "#2563eb" : l.status === "Available" ? "#16a34a" : "#7c3aed",
                            }}>{l.status}</span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#374151" }}>{l.currentUserName || "—"}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 500, color: "#111827" }}>
                            {rate ? `Rs ${rate.toLocaleString()}` : "—"}
                          </td>

                          {/* Editable days */}
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input
                                type="number" min={0} max={daysInMonth}
                                value={manualDays[l.id] !== undefined ? manualDays[l.id] : days}
                                onChange={e => updateDays(l.id, e.target.value)}
                                style={{ width: 60, padding: "4px 8px", border: "1px solid #e5e7eb", borderRadius: 5, fontSize: 12, textAlign: "center", outline: "none" }}
                              />
                              {manualDays[l.id] !== undefined && (
                                <button onClick={() => resetDays(l.id)} title="Reset to auto"
                                  style={{ fontSize: 10, color: "#6b7280", cursor: "pointer", background: "none", border: "none", textDecoration: "underline", padding: 0 }}>
                                  auto
                                </button>
                              )}
                              {isPartial && manualDays[l.id] === undefined && (
                                <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>partial</span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 12 }}>
                            {rate ? `Rs ${daily.toLocaleString()}` : "—"}
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#4f46e5" }}>
                            {rate ? `Rs ${amount.toLocaleString()}` : "—"}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Returned laptops (opt-in) */}
                    {returnedLaptops.map((l, idx) => {
                      const rate   = Number(l.ratePerMonth) || 0;
                      const days   = manualDays[l.id] ?? 0;
                      const daily  = Math.round(getDailyRate(rate, daysInMonth));
                      const amount = Math.round(daily * days);
                      const included = !!includeReturned[l.id];

                      return (
                        <tr key={l.id} style={{ background: included ? "#fffbeb" : "#fafafa", borderBottom: "1px solid #f3f4f6", opacity: included ? 1 : 0.6 }}>
                          <td style={{ padding: "10px 14px" }}>
                            <input type="checkbox" checked={included}
                              onChange={e => setIncludeReturned(prev => ({ ...prev, [l.id]: e.target.checked }))} />
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{l.model || "—"}</td>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12 }}>{l.serialNo || "—"}</td>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12 }}>{l.hrRefNumber || "—"}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "#fef3c7", color: "#d97706" }}>Returned</span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#9ca3af" }}>—</td>
                          <td style={{ padding: "10px 14px", fontWeight: 500 }}>{rate ? `Rs ${rate.toLocaleString()}` : "—"}</td>
                          <td style={{ padding: "10px 14px" }}>
                            {included ? (
                              <input type="number" min={0} max={daysInMonth}
                                value={days}
                                onChange={e => updateDays(l.id, e.target.value)}
                                placeholder="Days used"
                                style={{ width: 60, padding: "4px 8px", border: "1px solid #fcd34d", borderRadius: 5, fontSize: 12, textAlign: "center", outline: "none" }}
                              />
                            ) : (
                              <span style={{ fontSize: 12, color: "#9ca3af" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 12 }}>{included && rate ? `Rs ${daily.toLocaleString()}` : "—"}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#d97706" }}>
                            {included && rate ? `Rs ${amount.toLocaleString()}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Grand Total Footer */}
                  <tfoot>
                    <tr style={{ background: "#0f1d4a" }}>
                      <td colSpan={9} style={{ padding: "12px 14px", fontWeight: 700, color: "#93c5fd", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Grand Total — {billRows.length} laptop{billRows.length !== 1 ? "s" : ""} · {MONTHS[month - 1]} {year}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 800, color: "#ffffff", fontSize: 16, whiteSpace: "nowrap" }}>
                        Rs {grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Returned note */}
              {returnedLaptops.length > 0 && (
                <div style={{ padding: "10px 20px", background: "#fffbeb", borderTop: "1px solid #fde68a", fontSize: 12, color: "#92400e" }}>
                  <strong>{returnedLaptops.length}</strong> returned laptop{returnedLaptops.length > 1 ? "s" : ""} found — check the checkbox to include with manual days.
                </div>
              )}

              {/* Notes */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Notes / Remarks</div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Payment terms, reference numbers, remarks…"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, color: "#374151", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>
            </>
          )}
        </div>

        {/* ── Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {vendor && billRows.length > 0 && (
              <>
                <strong style={{ color: "#111827" }}>{billRows.length}</strong> laptops ·{" "}
                <strong style={{ color: "#4f46e5" }}>Rs {grandTotal.toLocaleString()}</strong> total
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{
              padding: "8px 18px", border: "1px solid #e5e7eb", borderRadius: 7,
              background: "white", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer"
            }}>
              Cancel
            </button>
            <button
              onClick={exportPDF}
              disabled={!vendor || billRows.length === 0}
              style={{
                padding: "8px 22px", border: "none", borderRadius: 7,
                background: !vendor || billRows.length === 0 ? "#e5e7eb" : "#0f1d4a",
                color: !vendor || billRows.length === 0 ? "#9ca3af" : "#ffffff",
                fontSize: 13, fontWeight: 600, cursor: !vendor || billRows.length === 0 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s",
              }}
            >
              <Printer size={14} />
              Export PDF Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
