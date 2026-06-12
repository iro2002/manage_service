import { useState } from "react";
import { X, Shield, ShieldCheck, Laptop, Server, Database, GitBranch, Loader2, FolderKanban, Eye, ShieldOff } from "lucide-react";
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
  {
    key: "openproject",
    label: "OpenProject Access",
    description: "View OpenProject projects, members, and role assignments",
    icon: FolderKanban,
    color: "#1a67a3",
    bg: "#dbeafe",
  },
];

// Cycle: false → "read" → true → false
function nextPermValue(current) {
  if (!current || current === false) return "read";
  if (current === "read") return true;
  return false;
}

// Badge config per state
function PermBadge({ value }) {
  if (!value || value === false) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "#f3f4f6", color: "#9ca3af", border: "1px solid #e5e7eb" }}>
        <ShieldOff size={11} /> No Access
      </span>
    );
  }
  if (value === "read") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" }}>
        <Eye size={11} /> Read Only
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "#dcfce7", color: "#16a34a", border: "1px solid #86efac" }}>
      <ShieldCheck size={11} /> Full Access
    </span>
  );
}

// 3-segment toggle pill
function SegmentToggle({ value, color, onChange, disabled }) {
  const segments = [
    { val: false,  label: "Off",  activeColor: "#9ca3af", activeBg: "#f3f4f6" },
    { val: "read", label: "Read", activeColor: "#d97706", activeBg: "#fef3c7" },
    { val: true,   label: "Full", activeColor: color,     activeBg: color + "20" },
  ];

  return (
    <div style={{ display: "flex", gap: 2, background: "#f3f4f6", borderRadius: 8, padding: 3, border: "1px solid #e5e7eb" }}>
      {segments.map(seg => {
        const isActive = value === seg.val || (seg.val === false && !value);
        return (
          <button
            key={String(seg.val)}
            onClick={() => !disabled && onChange(seg.val)}
            disabled={disabled}
            style={{
              padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: "none", cursor: disabled ? "not-allowed" : "pointer",
              background: isActive ? seg.activeBg : "transparent",
              color: isActive ? seg.activeColor : "#9ca3af",
              transition: "all 0.15s",
              outline: "none",
            }}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PermissionsModal({ user, onClose, onSaved }) {
  const { refreshUser, user: currentUser } = useAuth();
  const isSuperAdmin = user.role === "super_admin";

  const [perms, setPerms] = useState(() => {
    const base = { laptops: false, servers: false, "db-users": false, gitlab: false, openproject: false };
    if (user.page_permissions) return { ...base, ...user.page_permissions };
    return base;
  });

  const [saving, setSaving] = useState(null);

  const handleChange = async (key, newValue) => {
    if (isSuperAdmin) return;
    const newPerms = { ...perms, [key]: newValue };
    setPerms(newPerms);
    setSaving(key);
    try {
      await updatePermissions(user.id, newPerms);
      if (user.id === currentUser?.id) {
        refreshUser({ page_permissions: newPerms });
      }
      const label = PAGES.find(p => p.key === key)?.label;
      const lvl = newValue === true ? "Full Access" : newValue === "read" ? "Read Only" : "No Access";
      toast.success(`${label} → ${lvl} for ${user.name || user.email}`);
      onSaved?.(newPerms);
    } catch (err) {
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
        onClick={e => e.stopPropagation()}
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
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10 }}>
              <ShieldCheck size={20} style={{ color: "#7c3aed", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#6d28d9" }}>Full Access — Super Admin</div>
                <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 2 }}>Super admins have unrestricted access to all pages.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Legend */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "#6b7280", alignSelf: "center", fontWeight: 500 }}>Access levels:</div>
                <PermBadge value={false} />
                <PermBadge value="read" />
                <PermBadge value={true} />
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                <strong>Read Only</strong> — user can view the page but cannot add, edit, or delete anything.
              </p>

              {PAGES.map(({ key, label, description, icon: Icon, color, bg }) => {
                const val = perms[key] === undefined ? false : perms[key];
                const isSavingThis = saving === key;
                const hasAccess = val === true || val === "read";

                return (
                  <div
                    key={key}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 10,
                      border: `1px solid ${val === true ? color + "40" : val === "read" ? "#fde68a" : "#e5e7eb"}`,
                      background: val === true ? bg + "60" : val === "read" ? "#fffbeb" : "white",
                      transition: "all 0.15s",
                      opacity: isSavingThis ? 0.7 : 1,
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: hasAccess ? bg : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
                      <Icon size={18} style={{ color: hasAccess ? color : "#9ca3af" }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: hasAccess ? "#111827" : "#6b7280" }}>{label}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{description}</div>
                    </div>

                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
                      {isSavingThis ? (
                        <Loader2 size={18} className="animate-spin" style={{ color: "#9ca3af" }} />
                      ) : (
                        <SegmentToggle
                          value={val}
                          color={color}
                          onChange={(newVal) => handleChange(key, newVal)}
                          disabled={!!saving}
                        />
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
