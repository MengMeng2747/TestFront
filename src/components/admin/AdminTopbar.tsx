// ─── components/admin/AdminTopbar.tsx ─────────────────────────────────────────
import type { FC } from "react";
import { T, F } from "../../styles/tokens";

interface AdminTopbarProps {
  page:     string; // ยังคงรับ prop ไว้ไม่ให้ error แต่ไม่แสดง
  onToggle: () => void;
}

export const AdminTopbar: FC<AdminTopbarProps> = ({ onToggle }) => (
  <header style={{ height: 52, background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
    <button onClick={onToggle}
      style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20, padding: "4px 6px", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      ☰
    </button>
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(88,166,255,.2)", border: `1px solid ${T.accent}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 12, fontWeight: 700 }}>A</div>
      {window.innerWidth >= 640 && (
        <div>
          <div style={{ color: T.text, fontSize: 12, fontWeight: 600, ...F }}>Admin</div>
          <div style={{ color: T.muted, fontSize: 10, ...F }}>admin@rms.com</div>
        </div>
      )}
    </div>
  </header>
);