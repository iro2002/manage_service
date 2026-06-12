import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, LogOut, Monitor, ChevronLeft, ChevronRight, Users, Database, GitBranch, Home, Laptop, Server, FolderKanban } from "lucide-react";

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout, canAccess } = useAuth();
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
      className="fixed top-0 left-0 h-screen bg-[#0f1d4a] border-r border-blue-900/50 flex flex-col z-[100] overflow-hidden"
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 border-b border-blue-900/50 shrink-0"
        style={{ padding: collapsed ? "18px 16px" : "18px 20px", justifyContent: collapsed ? "center" : "flex-start" }}
      >
        {collapsed ? (
          <div style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", letterSpacing: "0.05em" }}>
            MS
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>Manage Service</div>
            <div style={{ fontSize: 11, color: "#93c5fd", marginTop: 2, fontWeight: 500 }}>Admin System</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3" style={{ padding: collapsed ? "12px 8px" : "12px 10px" }}>
        {!collapsed && (
          <div style={{ fontSize: 10, fontWeight: 600, color: "#93c5fd", opacity: 0.8, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px 8px" }}>
            Menu
          </div>
        )}

        <NavLink
          to="/"
          end
          title="Home"
          className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
          style={{ justifyContent: collapsed ? "center" : "flex-start" }}
        >
          <Home size={16} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Home</span>}
        </NavLink>

        {canAccess("laptops") && (
          <NavLink
            to="/laptops"
            title="Laptop Management"
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <Laptop size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Laptop Management</span>}
          </NavLink>
        )}

        {isSuperAdmin && (
          <NavLink
            to="/users"
            title="User Management"
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <Users size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>User Management</span>}
          </NavLink>
        )}

        {canAccess("servers") && (
          <NavLink
            to="/servers"
            title="Server Management"
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <Server size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Server Management</span>}
          </NavLink>
        )}

        {canAccess("db-users") && (
          <NavLink
            to="/db-users"
            title="Database Privileges"
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <Database size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Database Privileges</span>}
          </NavLink>
        )}

        {canAccess("gitlab") && (
          <NavLink
            to="/gitlab"
            title="GitLab Access"
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <GitBranch size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>GitLab Access</span>}
          </NavLink>
        )}

        {canAccess("openproject") && (
          <NavLink
            to="/openproject"
            title="OpenProject Access"
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <FolderKanban size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>OpenProject Access</span>}
          </NavLink>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="flex justify-center py-2 border-t border-blue-900/50">
        <button
          onClick={onToggle}
          id="sidebar-toggle-btn"
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, cursor: "pointer",
            background: "transparent", border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: 6, color: "#93c5fd", transition: "all 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; e.currentTarget.style.color = "#ffffff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#93c5fd"; }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* User + logout */}
      <div className="border-t border-blue-900/50 bg-[#0a1435]" style={{ padding: collapsed ? "12px 8px" : "12px 14px" }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 mb-3">
            <div style={{
              width: 32, height: 32, background: "#1e40af", color: "#ffffff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, borderRadius: 8, flexShrink: 0
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 10, color: "#93c5fd", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Signed in</div>
              <div style={{ fontSize: 12, color: "#ffffff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={emailDisplay}>
                {emailDisplay}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          id="sidebar-logout-btn"
          title="Sign Out"
          className="flex items-center gap-2 w-full text-blue-200 hover:text-red-200 hover:bg-red-950/40 transition-colors duration-150"
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
