import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Laptop,
  Users,
  Database,
  GitBranch,
  ExternalLink,
  Activity,
  Shield,
  Clock,
  Server,
  AlertCircle,
  Loader2,
  Monitor,
  ChevronRight,
  Package,
} from "lucide-react";

const API = "/api";

async function apiFetch(path) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}${path}`, {
    headers: {
      "x-auth-token": token || "",
    },
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }

  return res.json();
}

const ToolIcons = {
  phpmyadmin: Database,
  grafana: Activity,
  prometheus: Monitor,
  zabbix: Server,
  gitlab: GitBranch,
  gitea: GitBranch,
};

function ToolCard({ tool }) {
  const Icon = ToolIcons[tool.key] || Server;
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          background: "#ffffff",
          border: hovered
            ? `1px solid ${tool.color}40`
            : "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 20,
          transition: "all 0.2s ease",
          boxShadow: hovered
            ? "0 10px 30px rgba(15,23,42,0.08)"
            : "0 1px 2px rgba(15,23,42,0.04)",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: `${tool.color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={22} style={{ color: tool.color }} />
          </div>

          <ExternalLink
            size={16}
            style={{
              color: hovered ? tool.color : "#9ca3af",
              transition: "0.2s",
            }}
          />
        </div>

        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 6,
            }}
          >
            {tool.label}
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "#6b7280",
            }}
          >
            {tool.description}
          </div>
        </div>

        <div style={{ marginTop: "auto" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: tool.color,
              background: `${tool.color}12`,
              padding: "6px 10px",
              borderRadius: 999,
            }}
          >
            {tool.category}
          </span>
        </div>
      </div>
    </a>
  );
}

function StatCard({ icon: Icon, title, value, color, bg, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 22,
        transition: "all 0.2s ease",
        boxShadow: hovered
          ? "0 10px 24px rgba(15,23,42,0.06)"
          : "0 1px 2px rgba(15,23,42,0.04)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={22} style={{ color }} />
        </div>

        <ChevronRight
          size={16}
          style={{
            color: hovered ? "#111827" : "#d1d5db",
            transition: "0.2s",
          }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1,
          }}
        >
          {value}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            marginTop: 8,
            fontWeight: 500,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

function NavigationCard({ item, navigate }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => navigate(item.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#ffffff",
        border: hovered
          ? `1px solid ${item.color}30`
          : "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 20,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: hovered
          ? "0 8px 24px rgba(15,23,42,0.05)"
          : "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: item.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <item.icon size={20} style={{ color: item.color }} />
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 6,
        }}
      >
        {item.label}
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
          lineHeight: 1.6,
        }}
      >
        {item.description}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    apiFetch("/config")
      .then((data) => setConfig(data))
      .catch(() =>
        setConfig({
          company: "Manage Service",
          tools: [],
        })
      )
      .finally(() => setLoadingConfig(false));
  }, []);

  useEffect(() => {
    apiFetch("/laptops")
      .then((laptops) => {
        setStats({
          total: laptops.length,
          assigned: laptops.filter(
            (l) => l.status === "Assigned"
          ).length,
          available: laptops.filter(
            (l) => l.status === "Available"
          ).length,
          maintenance: laptops.filter(
            (l) => l.status === "Under Maintenance"
          ).length,
        });
      })
      .catch(() => {
        setStats({
          total: 0,
          assigned: 0,
          available: 0,
          maintenance: 0,
        });
      })
      .finally(() => setLoadingStats(false));
  }, []);

  const isSuperAdmin = user?.role === "super_admin";
  const isGlobalAdmin = user?.role === "global_admin";

  const quickLinks = [
    {
      label: "Laptop Management",
      description: "Manage and assign company assets",
      icon: Laptop,
      path: "/laptops",
      color: "#4f46e5",
      bg: "#eef2ff",
    },

    ...(isSuperAdmin || isGlobalAdmin
      ? [
          {
            label: "Database Access",
            description: "Manage MySQL privileges and users",
            icon: Database,
            path: "/db-users",
            color: "#0284c7",
            bg: "#e0f2fe",
          },
          {
            label: "GitLab Access",
            description: "Repository and member management",
            icon: GitBranch,
            path: "/gitlab",
            color: "#ea580c",
            bg: "#fff7ed",
          },
        ]
      : []),

    ...(isSuperAdmin
      ? [
          {
            label: "User Management",
            description: "Manage administrator accounts",
            icon: Users,
            path: "/users",
            color: "#7c3aed",
            bg: "#f5f3ff",
          },
        ]
      : []),
  ];

  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        padding: 28,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        {/* Header */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: 24,
            padding: 32,
            border: "1px solid #e5e7eb",
            marginBottom: 28,
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f3f4f6",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 18,
                }}
              >
                <Shield size={14} />
                {config?.company || "Manage Service"}
              </div>

              <h1
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 10,
                }}
              >
                Welcome back
              </h1>

              <p
                style={{
                  fontSize: 15,
                  color: "#6b7280",
                  lineHeight: 1.7,
                }}
              >
                Monitor infrastructure, manage assets, and access
                internal tools from a single dashboard.
              </p>
            </div>

            <div
              style={{
                minWidth: 240,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 20,
                padding: 20,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Clock size={14} />
                Current Time
              </div>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1,
                }}
              >
                {time.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  marginTop: 10,
                }}
              >
                {time.toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
            marginBottom: 32,
          }}
        >
          {loadingStats ? (
            Array(4)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  style={{
                    background: "#ffffff",
                    borderRadius: 18,
                    border: "1px solid #e5e7eb",
                    height: 150,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader2
                    size={22}
                    style={{
                      animation: "spin 1s linear infinite",
                      color: "#9ca3af",
                    }}
                  />
                </div>
              ))
          ) : (
            <>
              <StatCard
                icon={Laptop}
                title="Total Assets"
                value={stats?.total || 0}
                color="#4f46e5"
                bg="#eef2ff"
                onClick={() => navigate("/laptops")}
              />

              <StatCard
                icon={Monitor}
                title="Assigned Devices"
                value={stats?.assigned || 0}
                color="#16a34a"
                bg="#dcfce7"
                onClick={() => navigate("/laptops")}
              />

              <StatCard
                icon={Package}
                title="Available Devices"
                value={stats?.available || 0}
                color="#0284c7"
                bg="#e0f2fe"
                onClick={() => navigate("/laptops")}
              />

              <StatCard
                icon={AlertCircle}
                title="Under Maintenance"
                value={stats?.maintenance || 0}
                color="#d97706"
                bg="#fef3c7"
                onClick={() => navigate("/laptops")}
              />
            </>
          )}
        </div>

        {/* Navigation */}

        <div style={{ marginBottom: 36 }}>
          <div style={{ marginBottom: 18 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Quick Navigation
            </h2>

            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
              }}
            >
              Access commonly used management modules
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 18,
            }}
          >
            {quickLinks.map((item) => (
              <NavigationCard
                key={item.path}
                item={item}
                navigate={navigate}
              />
            ))}
          </div>
        </div>

        {/* Tools */}

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 6,
                }}
              >
                Infrastructure Tools
              </h2>

              <p
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                }}
              >
                Secure access to monitoring and development tools
              </p>
            </div>

            {loadingConfig && (
              <Loader2
                size={18}
                style={{
                  animation: "spin 1s linear infinite",
                  color: "#9ca3af",
                }}
              />
            )}
          </div>

          {!loadingConfig && config?.tools?.length === 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px dashed #d1d5db",
                borderRadius: 18,
                padding: 50,
                textAlign: "center",
              }}
            >
              <Server
                size={34}
                style={{
                  color: "#9ca3af",
                  marginBottom: 14,
                }}
              />

              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 6,
                }}
              >
                No tools configured
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                }}
              >
                Configure tool URLs from your backend environment
                variables.
              </div>
            </div>
          )}

          {!loadingConfig && config?.tools?.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 18,
              }}
            >
              {config.tools.map((tool) => (
                <ToolCard key={tool.key} tool={tool} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}

        <div
          style={{
            marginTop: 40,
            paddingTop: 22,
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#9ca3af",
            }}
          >
            {config?.company || "Manage Service"} Admin Dashboard
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#9ca3af",
            }}
          >
            Logged in as {user?.email}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}