import { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "../services/api";

const AuthContext = createContext(null);

// Default permissions for a fresh admin (all off)
export const DEFAULT_PERMISSIONS = {
  laptops: false,
  servers: false,
  "db-users": false,
  gitlab: false,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.error || "Login failed");
      error.code = data.code;
      throw error;
    }
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  /** Call this after updating a user's permissions so the sidebar/routes refresh */
  const refreshUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  };

  /**
   * Returns true if the current user can access a given page key.
   * super_admin always has full access.
   */
  const canAccess = (pageKey) => {
    if (!user) return false;
    if (user.role === "super_admin") return true;
    const perms = user.page_permissions || DEFAULT_PERMISSIONS;
    return !!perms[pageKey];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, canAccess }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
