import { useState } from "react";
import { X, Shield, ShieldCheck, Laptop, Server, Database, GitBranch, CheckCircle2, Loader2 } from "lucide-react";
import { updatePermissions } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const PAGES = [
  {
    key: "laptops",
    label: "Laptop Management",
    description: "View and manage company laptops, assignments, and returns",
    icon: Laptop,
    color: "#2563eb",
    bg: "#dbeafe",
  },
  {
    key: "servers",
    label: "Server Management",
    description: "View and manage company servers and update schedules",
    icon: Server,
    color: "#7c3aed",
    bg: "#ede9fe",
  },
  {
    key: "db-users",
    label: "Database Privileges",
    description: "View MySQL database users and their access levels",
    icon: Database,
    color: "#d97706",
    bg: "#fef3c7",
  },
  {
    key: "gitlab",
    label: "GitLab Repository Access",
    description: "View GitLab projects, members, and permission levels",
    icon: GitBranch,
    color: "#16a34a",
    bg: "#dcfce7",
  },
];

export default function PermissionsModal({ user, onClose, onSaved }) {
  const { refreshUser, user: currentUser } = useAuth();
  const isSuperAdmin = user.role === "super_admin";

  // Initialise from user.page_permissions or all-false
  const [perms, setPerms] = useState(() => {
    const base = { laptops: false, servers: false, "db-users": false, gitlab: false };
    if (user.page_permissions) return { ...base, ...user.page_permissions };
    return base;
  });

  const [saving, setSaving] = useState(null); // key of the toggle being saved

  const handleToggle = async (key) => {
    if (isSuperAdmin) return; // Super admins always have full access
    const newValue = !perms[key];
    const newPerms = { ...perms, [key]: newValue };
    setPerms(newPerms);
    setSaving(key);
    try {
      await updatePermissions(user.id, newPerms);
      // If editing self, refresh context immediately
      if (user.id === currentUser?.id) {
        refreshUser({ page_permissions: newPerms });
      }
      toast.success(`${PAGES.find(p => p.key === key)?.label} ${newValue ? "enabled" : "disabled"} for ${user.name || user.email}`);
      onSaved?.(newPerms);   // pass newPerms so parent can sync without flash
    } catch (err) {
      // Revert on error
      setPerms(prev => ({ ...prev, [key]: !newValue }));
      toast.error(err.message || "Failed to update permissions.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={() => onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.15s ease-out" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "#ede9fe", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Shield size={18} style={{ color: "#7c3aed" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Page Permissions</h3>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                {user.name || user.email}
                {isSuperAdmin && (
                  <span style={{ marginLeft: 8, background: "#ede9fe", color: "#7c3aed", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, border: "1px solid #ddd6fe" }}>
                    SUPER ADMIN
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={() => onClose()} className="btn btn-ghost btn-icon">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {isSuperAdmin ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "16px 18px",
              background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10,
            }}>
              <ShieldCheck size={20} style={{ color: "#7c3aed", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#6d28d9" }}>Full Access — Super Admin</div>
                <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 2 }}>Super admins have unrestricted access to all pages. Permissions cannot be limited.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                Toggle which dashboard pages this user can access. Changes take effect on their next login.
              </p>
              {PAGES.map(({ key, label, description, icon: Icon, color, bg }) => {
                const enabled = !!perms[key];
                const isSavingThis = saving === key;
                return (
                  <div
                    key={key}
                    onClick={() => !isSavingThis && handleToggle(key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                      border: `1px solid ${enabled ? color + "40" : "#e5e7eb"}`,
                      background: enabled ? bg + "60" : "white",
                      transition: "all 0.15s",
                      opacity: isSavingThis ? 0.7 : 1,
                    }}
                    onMouseEnter={e => { if (!isSavingThis) e.currentTarget.style.borderColor = color + "80"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = enabled ? color + "40" : "#e5e7eb"; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: enabled ? bg : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
                      <Icon size={18} style={{ color: enabled ? color : "#9ca3af" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: enabled ? "#111827" : "#6b7280" }}>{label}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{description}</div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {isSavingThis ? (
                        <Loader2 size={18} className="animate-spin" style={{ color: "#9ca3af" }} />
                      ) : (
                        /* Toggle switch */
                        <div style={{
                          width: 42, height: 24, borderRadius: 99,
                          background: enabled ? color : "#d1d5db",
                          position: "relative", transition: "background 0.2s",
                          flexShrink: 0,
                        }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: "50%", background: "white",
                            position: "absolute", top: 3, left: enabled ? 21 : 3,
                            transition: "left 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }} />
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
        <div style={{ padding: "12px 24px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", background: "#fafafa", borderRadius: "0 0 12px 12px" }}>
          <button onClick={() => onClose()} className="btn btn-secondary">Done</button>
        </div>
      </div>
    </div>
  );
}
