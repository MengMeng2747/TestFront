// ─── components/reseller/ResellerTopbar.tsx ───────────────────────────────────
import type { FC } from "react";
import { T, F } from "../../styles/tokens";
import type { ResellerUser } from "../../types";

interface ResellerTopbarProps {
  page:     string; // ยังคงรับ prop ไว้ไม่ให้ error แต่ไม่แสดง
  onToggle: () => void;
  user:     ResellerUser;
}

export const ResellerTopbar: FC<ResellerTopbarProps> = ({ onToggle, user }) => (
  <header style={{ height: 52, background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
    <button onClick={onToggle}
      style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20, padding: "4px 6px", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      ☰
    </button>
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#58a6ff,#bc8cff)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
        {user?.name?.charAt(0) ?? "R"}
      </div>
      {window.innerWidth >= 640 && (
        <div>
          <div style={{ color: T.text, fontSize: 12, fontWeight: 600, ...F }}>{user?.name}</div>
          <div style={{ color: T.muted, fontSize: 10, ...F }}>{user?.email}</div>
        </div>
      )}
    </div>
  </header>
);