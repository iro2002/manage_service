import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Layout/Sidebar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UserManagementPage from "./pages/UserManagementPage";
import { useAuth } from "./context/AuthContext";
import "./App.css";

const SIDEBAR_FULL = 240;
const SIDEBAR_MINI = 64;

function AppShell() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? SIDEBAR_MINI : SIDEBAR_FULL;

  return (
    <>
      {user ? (
        <div className="flex h-screen overflow-hidden bg-[#f8f9fa]">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{ marginLeft: sidebarWidth, transition: "margin-left 0.22s ease" }}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppPage title="Laptop Management" subtitle="Track and manage company laptops">
                      <DashboardPage />
                    </AppPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    {user.role === "super_admin" ? (
                      <AppPage title="User Management" subtitle="Manage admin accounts and permissions">
                        <UserManagementPage />
                      </AppPage>
                    ) : (
                      <Navigate to="/" replace />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </>
  );
}

function AppPage({ title, subtitle, children }) {
  return (
    <>
      {/* Top header bar */}
      <div style={{
        height: 56, background: "white", borderBottom: "1px solid #e5e7eb",
        display: "flex", alignItems: "center", paddingLeft: 28, paddingRight: 28,
        gap: 8, flexShrink: 0
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{title}</span>
        {subtitle && (
          <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>— {subtitle}</span>
        )}
      </div>
      {/* Page body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px", background: "#f8f9fa" }}>
        {children}
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#111827",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "13px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            },
            success: { iconTheme: { primary: "#16a34a", secondary: "white" } },
            error: { iconTheme: { primary: "#dc2626", secondary: "white" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
