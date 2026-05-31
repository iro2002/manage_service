import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Database,
  GitBranch,
  ExternalLink,
  Activity,
  Shield,
  Clock,
  Server,
  Loader2,
  Monitor,
} from "lucide-react";
import GitLabPng from "../assets/GitLab.png";
import GrafanaPng from "../assets/Grafana.png";
import PhpPng from "../assets/PHP.png";
import PrometheusPng from "../assets/Prometheus.png";
import ZabbixPng from "../assets/Zabix.png";

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
  grafana: Activity,
  prometheus: Monitor,
  zabbix: Server,
  gitlab: GitBranch,
  gitea: GitBranch,
};

const ToolImages = {
  gitlab: GitLabPng,
  grafana: GrafanaPng,
  php: PhpPng,
  phpmyadmin: PhpPng,
  prometheus: PrometheusPng,
  zabbix: ZabbixPng,
  zabix: ZabbixPng,
};

function ToolCard({ tool }) {
  const Icon = ToolIcons[tool.key] || Server;
  const imgSrc = ToolImages[tool.key] || ToolImages[tool.key?.toLowerCase()];
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
            ? `1px solid ${tool.color}50`
            : "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          transition: "all 0.2s ease",
          boxShadow: hovered
            ? "0 4px 12px rgba(15,23,42,0.06)"
            : "0 1px 2px rgba(15,23,42,0.02)",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
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
              width: 40,
              height: 40,
              borderRadius: 10,
              background: imgSrc ? "transparent" : `${tool.color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: imgSrc ? 0 : undefined,
            }}
          >
            {imgSrc
              ? <img src={imgSrc} alt={tool.label} style={{ width: 36, height: 36, objectFit: "contain" }} />
              : <Icon size={18} style={{ color: tool.color }} />
            }
          </div>

          <ExternalLink
            size={14}
            style={{
              color: hovered ? tool.color : "#9ca3af",
              transition: "0.2s",
            }}
          />
        </div>

        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#1f2937",
              marginBottom: 4,
            }}
          >
            {tool.label}
          </div>

          <div
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: "#6b7280",
            }}
          >
            {tool.description}
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: tool.color,
              background: `${tool.color}12`,
              padding: "4px 8px",
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

export default function HomePage() {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
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

  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        padding: "20px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: 24,
            border: "1px solid #e5e7eb",
            marginBottom: 24,
            boxShadow: "0 1px 2px rgba(15,23,42,0.02)",
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#f3f4f6",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: "#4b5563",
                marginBottom: 12,
              }}
            >
              <Shield size={12} />
              {config?.company || "Manage Service"}
            </div>

            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Welcome back
            </h1>

            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                maxWidth: 400,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Monitor infrastructure, manage assets, and access internal tools
              from a single dashboard.
            </p>
          </div>

          <div
            style={{
              minWidth: 180,
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 500,
              }}
            >
              <Clock size={12} />
              Current Time
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
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
                fontSize: 11,
                color: "#9ca3af",
                marginTop: 6,
              }}
            >
              {time.toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Infrastructure Tools */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                  marginBottom: 2,
                }}
              >
                Infrastructure Tools
              </h2>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                Secure access to monitoring and development tools
              </p>
            </div>

            {loadingConfig && (
              <Loader2
                size={16}
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
                borderRadius: 12,
                padding: 32,
                textAlign: "center",
              }}
            >
              <Server
                size={28}
                style={{
                  color: "#9ca3af",
                  marginBottom: 10,
                }}
              />
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 4,
                }}
              >
                No tools configured
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Configure tool URLs from your backend environment variables.
              </div>
            </div>
          )}

          {!loadingConfig && config?.tools?.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
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
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            {config?.company || "Manage Service"} Admin Dashboard
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            Logged in as {user?.email}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}