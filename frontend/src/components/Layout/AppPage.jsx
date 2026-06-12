import React from 'react';

export default function AppPage({ title, subtitle, children }) {
  return (
    <>
      {/* Top header bar */}
      <div style={{
        height: 56, background: "#0a1435", borderBottom: "1px solid rgba(147, 197, 253, 0.15)",
        display: "flex", alignItems: "center", paddingLeft: 28, paddingRight: 28,
        gap: 8, flexShrink: 0
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{title}</span>
        {subtitle && (
          <span style={{ fontSize: 13, color: "#93c5fd", fontWeight: 400 }}>
            <span style={{ color: "#4f46e5", marginRight: 6, fontWeight: 700 }}>/</span>
            {subtitle}
          </span>
        )}
      </div>
      {/* Page body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px", background: "#f8f9fa" }}>
        {children}
      </div>
    </>
  );
}
