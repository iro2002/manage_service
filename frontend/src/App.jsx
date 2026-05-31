import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Layout/Sidebar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UserManagementPage from "./pages/UserManagementPage";
import DbUsersPage from "./pages/DbUsersPage";
import ServersPage from "./pages/ServersPage";
import GitLabPage from "./pages/GitLabPage";
import HomePage from "./pages/HomePage";
import AppPage from "./components/Layout/AppPage";
import "./App.css";

const SIDEBAR_FULL = 240;
const SIDEBAR_MINI = 64;

function AppRoutes() {
  const { user, canAccess } = useAuth();
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
                    <AppPage title="Dashboard" subtitle={`Welcome back, ${user?.email?.split('@')[0] || 'Admin'}`}>
                      <HomePage />
                    </AppPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/laptops"
                element={
                  <ProtectedRoute>
                    {canAccess("laptops") ? (
                      <AppPage title="Laptop Management" subtitle="Track and manage company laptops">
                        <DashboardPage />
                      </AppPage>
                    ) : (
                      <Navigate to="/" replace />
                    )}
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
              <Route
                path="/servers"
                element={
                  <ProtectedRoute>
                    {canAccess("servers") ? (
                      <AppPage title="Server Management" subtitle="Manage and monitor company servers">
                        <ServersPage />
                      </AppPage>
                    ) : (
                      <Navigate to="/" replace />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/db-users"
                element={
                  <ProtectedRoute>
                    {canAccess("db-users") ? (
                      <AppPage title="Database Privileges" subtitle="View MySQL database user access">
                        <DbUsersPage />
                      </AppPage>
                    ) : (
                      <Navigate to="/" replace />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gitlab"
                element={
                  <ProtectedRoute>
                    {canAccess("gitlab") ? (
                      <AppPage title="GitLab Repository Access" subtitle="View repository access and member permissions">
                        <GitLabPage />
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
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
