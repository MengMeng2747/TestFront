// ─── components/Layout.tsx ────────────────────────────────────────────────────
import type { FC, ReactNode } from "react";
import { T, F } from "../styles/tokens";

// ── StatCard ──────────────────────────────────────────────
interface StatCardProps {
  label:   string;
  value:   string | number;
  sub?:    string;
  accent?: string;
  icon:    string;
}

export const StatCard: FC<StatCardProps> = ({ label, value, sub, accent = T.accent, icon }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px", position: "relative", overflow: "hidden", minWidth: 0 }}>
    <div style={{ position: "absolute", right: 12, top: 10, fontSize: 24, opacity: .15 }}>{icon}</div>
    <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", ...F, marginBottom: 6 }}>{label}</div>
    <div style={{ color: T.text, fontSize: 22, fontWeight: 700, ...F, wordBreak: "break-all" }}>{value}</div>
    {sub && <div style={{ color: T.muted, fontSize: 11, marginTop: 4, ...F }}>{sub}</div>}
    <div style={{ height: 2, background: `linear-gradient(90deg,${accent},transparent)`, borderRadius: 2, marginTop: 12 }} />
  </div>
);

// ── PageHeader ────────────────────────────────────────────
interface PageHeaderProps {
  title:     string;
  subtitle?: string;
  action?:   ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 }}>
    <div style={{ minWidth: 0 }}>
      <h2 style={{ color: T.text, fontSize: 20, margin: "0 0 4px", fontWeight: 700, ...F }}>{title}</h2>
      {subtitle && <p style={{ color: T.muted, margin: 0, fontSize: 12, ...F }}>{subtitle}</p>}
    </div>
    {action && <div style={{ flexShrink: 0 }}>{action}</div>}
  </div>
);

// ── EmptyState ────────────────────────────────────────────
interface EmptyStateProps {
  icon?:    string;
  message?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({ icon = "📭", message = "ไม่มีข้อมูล" }) => (
  <div style={{ textAlign: "center", padding: "48px 24px", color: T.muted, ...F }}>
    <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
    <div style={{ fontSize: 14 }}>{message}</div>
  </div>
);