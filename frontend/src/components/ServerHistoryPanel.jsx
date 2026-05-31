import { useState } from "react";
import { 
  History, X, Loader2, Search, Filter, ChevronDown, 
  User, Calendar, MessageSquare, Clock 
} from "lucide-react";
import { format } from "date-fns";

// ─── Expanded Category Color Themes (Matched to Target UI) ─────────────────────
const UPDATE_THEMES = {
  Security:    { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626" }, // Red
  OS:          { bg: "#dcfce7", color: "#15803d", dot: "#16a34a" }, // Green
  Application: { bg: "#ede9fe", color: "#6d28d9", dot: "#7c3aed" }, // Purple
  Patch:       { bg: "#fef3c7", color: "#b45309", dot: "#d97706" }, // Amber
  Backup:      { bg: "#e0f2fe", color: "#0369a1", dot: "#0ea5e9" }, // Sky Blue
  Database:    { bg: "#ffedd5", color: "#c2410c", dot: "#f97316" }, // Orange
  Hardware:    { bg: "#f3e8ff", color: "#7e22ce", dot: "#a855f7" }, // Purple/Violet
  Network:     { bg: "#e0e7ff", color: "#4338ca", dot: "#6366f1" }, // Indigo
  Maintenance: { bg: "#f1f5f9", color: "#475569", dot: "#64748b" }, // Slate
  Deployment:  { bg: "#d1fae5", color: "#047857", dot: "#10b981" }, // Emerald
};

const DEFAULT_THEME = { bg: "#f3f4f6", color: "#374151", dot: "#6b7280" };

// Fallback pool to dynamically color unseen categories seamlessly
const FALLBACK_PALETTES = [
  { bg: "#e0f2fe", color: "#0369a1", dot: "#0ea5e9" },
  { bg: "#ffedd5", color: "#c2410c", dot: "#f97316" },
  { bg: "#e0e7ff", color: "#4338ca", dot: "#6366f1" },
  { bg: "#d1fae5", color: "#047857", dot: "#10b981" },
];

// Helper function to safely extract themes or pick a stable fallback color
const getTheme = (type) => {
  if (!type) return DEFAULT_THEME;
  if (UPDATE_THEMES[type]) return UPDATE_THEMES[type];
  
  // Create a simple deterministic hash code from the string to pin an asset color
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_PALETTES.length;
  return FALLBACK_PALETTES[index];
};

const formatDateString = (value, pattern = "dd MMM yyyy, HH:mm") => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : format(d, pattern);
  } catch {
    return value;
  }
};

export default function ServerHistoryModal({ server, historyData = [], loading, onClose }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredRecords = historyData.filter((item) => {
    const term = search.toLowerCase();
    const matchSearch =
      !term ||
      item.notes?.toLowerCase().includes(term) ||
      item.updated_by?.toLowerCase().includes(term) ||
      item.update_type?.toLowerCase().includes(term);

    const matchFilter = !typeFilter || item.update_type?.includes(typeFilter);
    return matchSearch && matchFilter;
  });

  const uniqueTypes = [
    ...new Set(
      historyData
        .flatMap((h) => (h.update_type ? h.update_type.split(",") : []))
        .map((t) => t.trim())
        .filter(Boolean)
    ),
  ];

  return (
    <div
      className="fixed inset-0 z-[999] bg-gray-900/40 backdrop-blur-[4px] flex items-center justify-center p-5 animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[560px] max-h-[88vh] flex flex-col bg-white rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-scaleIn">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-[18px] border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Server History</h2>
              <p className="text-[12px] text-gray-400 mt-[2px]">Lifecycle of updates and patches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white">
          
          {/* Server Info Card */}
          <div className="flex gap-2.5 bg-gray-50 border border-gray-200 rounded-lg py-3 px-3.5 mb-5">
            <div>
              <div className="text-[13px] font-semibold text-gray-900">
                {server?.name || "Unknown Server Asset"}
              </div>
              <div className="text-[11px] text-gray-400 mt-1 flex gap-2.5">
                <span className="font-mono bg-gray-200/50 px-1.5 py-0.5 rounded text-gray-600">
                  IP: {server?.ip_address || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          {!loading && historyData.length > 0 && (
            <div className="flex gap-2 items-center mb-6">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search logs by keyword or user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    typeFilter
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Filter size={12} className={typeFilter ? "text-white" : "text-gray-400"} />
                  {typeFilter || "All Types"}
                  <ChevronDown size={12} className={`transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`} />
                </button>

                {filterOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                    <div className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[160px] p-1 overflow-hidden animate-fadeIn">
                      <button
                        onClick={() => { setTypeFilter(""); setFilterOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors font-medium ${
                          !typeFilter ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        All Types
                      </button>
                      {uniqueTypes.map((t) => {
                        const theme = getTheme(t);
                        return (
                          <button
                            key={t}
                            onClick={() => { setTypeFilter(t); setFilterOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs rounded-md transition-colors font-medium flex items-center gap-2 mt-0.5 hover:bg-gray-50 text-gray-700"
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.dot }} />
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Timeline View */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin text-gray-300 w-6 h-6" />
              <p className="text-[13px] text-gray-400">Loading history…</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
                <Clock size={20} className="text-gray-400" />
              </div>
              <div className="text-[14px] font-semibold text-gray-700 mt-1">No Activity Found</div>
              <div className="text-[13px] text-gray-400">No logs match your current search criteria.</div>
            </div>
          ) : (
            <div className="relative pl-5">
              {/* Vertical line */}
              <div className="absolute left-[6px] top-2 bottom-2 w-[1px] bg-gray-200" />

              {filteredRecords.map((item, i) => {
                const types = item.update_type ? item.update_type.split(",").map(t => t.trim()) : [];
                const primaryType = types[0] || "";
                const theme = getTheme(primaryType);

                return (
                  <div key={item.id ?? i} className={`relative ${i < filteredRecords.length - 1 ? "mb-5" : ""}`}>
                    {/* Dot */}
                    <div
                      className="absolute -left-[17px] top-[3px] w-2.5 h-2.5 rounded-full border-2 border-white z-10"
                      style={{
                        background: theme.dot,
                        boxShadow: `0 0 0 2px ${theme.dot}40`,
                      }}
                    />

                    {/* Timeline Card */}
                    <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-3 sm:py-3 sm:px-3.5 transition-shadow hover:shadow-md">
                      
                      {/* Action + Timestamp */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-[3px] rounded"
                          style={{ background: theme.bg, color: theme.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.dot }} />
                          {primaryType || "General Update"}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {formatDateString(item.update_date)}
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-400 mt-2.5">
                        {item.updated_by && (
                          <span className="flex items-center gap-1">
                            <User size={11} className="text-gray-400" />
                            Logged by: <strong className="text-gray-500 font-medium">{item.updated_by}</strong>
                          </span>
                        )}
                        {item.next_update_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-gray-400" />
                            Scheduled: {formatDateString(item.next_update_date, "dd MMM yyyy")}
                          </span>
                        )}
                      </div>

                      {/* Comments / Notes */}
                      {item.notes && (
                        <div className="flex gap-1.5 mt-2.5 bg-gray-50 rounded-md py-[7px] px-2.5 text-[12px] text-gray-500 italic">
                          <MessageSquare size={12} className="mt-[2px] shrink-0 text-gray-400" />
                          <span className="leading-relaxed">"{item.notes}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end py-3.5 px-6 border-t border-gray-100 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-100 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>

      {/* Tailwind Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}