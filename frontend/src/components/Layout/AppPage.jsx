import React from 'react';

export default function AppPage({ title, subtitle, children }) {
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
