import { useEffect, useState, useMemo, useCallback } from "react";
import { CheckCircle, Users, Building2, PackageX, AlertCircle, RefreshCw } from "lucide-react";
import { fetchLaptops } from "../services/laptopService";
import LaptopTable from "../components/LaptopTable";
import AddLaptopModal from "../components/Modals/AddLaptopModal";
import AssignLaptopModal from "../components/Modals/AssignLaptopModal";
import ReturnModal from "../components/Modals/ReturnModal";
import HistoryModal from "../components/Modals/HistoryModal";
import EditLaptopModal from "../components/Modals/EditLaptopModal";
import BulkEmailModal from "../components/Modals/BulkEmailModal";
import { DEPARTMENTS } from "../services/laptopService";

export default function DashboardPage() {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [currentUserFilter, setCurrentUserFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modal, setModal] = useState(null);

  const loadLaptops = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLaptops();
      setLaptops(data || []);
      setApiError(null);
    } catch (err) {
      setApiError(err.message || "Failed to load laptops.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLaptops(); }, [loadLaptops]);

  const handleCloseModal = useCallback((shouldRefresh = false) => {
    setModal(null);
    if (shouldRefresh === true) loadLaptops();
  }, [loadLaptops]);

  const existingModels = useMemo(() =>
    [...new Set(laptops.map((l) => l.model).filter(Boolean))].sort()
  , [laptops]);

  const existingUsers = useMemo(() =>
    [...new Set(laptops.map((l) => l.currentUserName).filter(Boolean))].sort()
  , [laptops]);

  const existingVendors = useMemo(() =>
    [...new Set(laptops.map((l) => l.vendorName).filter(Boolean))].sort()
  , [laptops]);

  const existingRates = useMemo(() =>
    [...new Set(laptops.map((l) => l.ratePerMonth).filter(v => v && Number(v) > 0))].map(Number).sort((a, b) => a - b)
  , [laptops]);

  const stats = useMemo(() => laptops.reduce(
    (acc, l) => {
      if (l.status === "Available") acc.available++;
      else if (l.status === "Assigned") acc.assigned++;
      else if (l.status === "With MS" || l.status === "With HR") acc.withMS++;
      else if (l.status === "Returned to Vendor") acc.returned++;
      return acc;
    },
    { available: 0, assigned: 0, withMS: 0, returned: 0 }
  ), [laptops]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (apiError) {
    return (
      <div style={{
        background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
        padding: "32px 24px", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 12, textAlign: "center", maxWidth: 420, margin: "40px auto"
      }}>
        <AlertCircle size={36} style={{ color: "#dc2626" }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#b91c1c", marginBottom: 4 }}>Connection Error</div>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{apiError}</p>
          <button
            onClick={loadLaptops}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", background: "#dc2626", color: "white",
              border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Stat card config
  const statCards = [
    {
      label: "Available",
      value: stats.available,
      icon: CheckCircle,
      accent: "#16a34a",
      bg: "#dcfce7",
      iconBg: "#bbf7d0",
      borderColor: "#86efac",
    },
    {
      label: "Assigned",
      value: stats.assigned,
      icon: Users,
      accent: "#2563eb",
      bg: "#dbeafe",
      iconBg: "#bfdbfe",
      borderColor: "#93c5fd",
    },
    {
      label: "With MS",
      value: stats.withMS,
      icon: Building2,
      accent: "#7c3aed",
      bg: "#ede9fe",
      iconBg: "#ddd6fe",
      borderColor: "#c4b5fd",
    },
    {
      label: "Returned to Vendor",
      value: stats.returned,
      icon: PackageX,
      accent: "#d97706",
      bg: "#fef3c7",
      iconBg: "#fde68a",
      borderColor: "#fcd34d",
    },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {statCards.map(({ label, value, icon: Icon, accent, bg, iconBg, borderColor }) => (
          <div key={label} style={{
            background: "white",
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            padding: "20px 22px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            transition: "box-shadow 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"}
          >
            <div style={{
              width: 44, height: 44, background: iconBg, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Icon size={20} style={{ color: accent }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Laptop Table */}
      <LaptopTable
        laptops={laptops}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        modelFilter={modelFilter}
        setModelFilter={setModelFilter}
        currentUserFilter={currentUserFilter}
        setCurrentUserFilter={setCurrentUserFilter}
        existingModels={existingModels}
        existingUsers={existingUsers}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onAdd={() => setModal({ type: "add" })}
        onAssign={(l) => setModal({ type: "assign", laptop: l })}
        onReturnMS={(l) => setModal({ type: "returnMS", laptop: l })}
        onReturnVendor={(l) => setModal({ type: "returnVendor", laptop: l })}
        onHistory={(l) => setModal({ type: "history", laptop: l })}
        onEdit={(l) => setModal({ type: "edit", laptop: l })}
        onBulkEmail={(selectedLaptops) => setModal({ type: "bulkEmail", laptops: selectedLaptops })}
      />

      {/* Modals */}
      {modal?.type === "add"          && <AddLaptopModal existingModels={existingModels} existingVendors={existingVendors} existingRates={existingRates} onClose={handleCloseModal} />}
      {modal?.type === "assign"       && <AssignLaptopModal laptop={modal.laptop} onClose={handleCloseModal} />}
      {modal?.type === "returnMS"     && <ReturnModal laptop={modal.laptop} type="ms" onClose={handleCloseModal} />}
      {modal?.type === "returnVendor" && <ReturnModal laptop={modal.laptop} type="vendor" onClose={handleCloseModal} />}
      {modal?.type === "history"      && <HistoryModal laptop={modal.laptop} onClose={handleCloseModal} />}
      {modal?.type === "edit"         && <EditLaptopModal laptop={modal.laptop} existingModels={existingModels} existingVendors={existingVendors} existingRates={existingRates} onClose={handleCloseModal} />}
      {modal?.type === "bulkEmail"    && <BulkEmailModal selectedLaptops={modal.laptops} onClose={handleCloseModal} />}
    </>
  );
}