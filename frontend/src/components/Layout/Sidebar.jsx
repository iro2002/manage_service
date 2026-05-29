import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, LogOut, Monitor, ChevronLeft, ChevronRight, Users, Database } from "lucide-react";

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user?.email?.charAt(0).toUpperCase() ?? "A";
  const emailDisplay = user?.email ?? "";
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <aside
      style={{ width: collapsed ? 64 : 240, transition: "width 0.22s ease" }}
      className="fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col z-[100] overflow-hidden"
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 border-b border-gray-100 shrink-0"
        style={{ padding: collapsed ? "18px 16px" : "18px 20px", justifyContent: collapsed ? "center" : "flex-start" }}
      >
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 32, height: 32,
            background: "#4f46e5",
            borderRadius: 8,
            flexShrink: 0
          }}
        >
          <Monitor size={16} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>Manage Service</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Admin System</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3" style={{ padding: collapsed ? "12px 8px" : "12px 10px" }}>
        {!collapsed && (
          <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px 8px" }}>
            Menu
          </div>
        )}

        <NavLink
          to="/"
          end
          title="Laptop Management"
          className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
          style={{ justifyContent: collapsed ? "center" : "flex-start" }}
        >
          <LayoutDashboard size={16} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Laptop Management</span>}
        </NavLink>

        {isSuperAdmin && (
          <>
            <NavLink
              to="/users"
              title="User Management"
              className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
              style={{ justifyContent: collapsed ? "center" : "flex-start" }}
            >
              <Users size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>User Management</span>}
            </NavLink>
            <NavLink
              to="/db-users"
              title="Database Privileges"
              className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
              style={{ justifyContent: collapsed ? "center" : "flex-start" }}
            >
              <Database size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Database Privileges</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="flex justify-center py-2 border-t border-gray-100">
        <button
          onClick={onToggle}
          id="sidebar-toggle-btn"
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, cursor: "pointer",
            background: "transparent", border: "1px solid #e5e7eb",
            borderRadius: 6, color: "#9ca3af", transition: "all 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#374151"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* User + logout */}
      <div className="border-t border-gray-100 bg-gray-50" style={{ padding: collapsed ? "12px 8px" : "12px 14px" }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 mb-3">
            <div style={{
              width: 32, height: 32, background: "#e0e7ff", color: "#4f46e5",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, borderRadius: 8, flexShrink: 0
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Signed in</div>
              <div style={{ fontSize: 12, color: "#374151", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={emailDisplay}>
                {emailDisplay}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          id="sidebar-logout-btn"
          title="Sign Out"
          className="flex items-center gap-2 w-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
          style={{
            padding: collapsed ? "7px 0" : "7px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            fontSize: 13, fontWeight: 500, borderRadius: 6, cursor: "pointer",
            border: "none", background: "transparent"
          }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
