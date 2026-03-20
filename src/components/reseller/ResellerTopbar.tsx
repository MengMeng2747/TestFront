// ─── components/reseller/ResellerTopbar.tsx ───────────────────────────────────
import type { FC } from "react";
import { T, F } from "../../styles/tokens";
import type { ResellerUser } from "../../types";

interface ResellerTopbarProps {
  page:            string;
  onToggle:        () => void;
  user:            ResellerUser;
  newOrderCount?:  number;     // ✅ จำนวนแจ้งเตือน
  onClearNotif?:   () => void; // ✅ ล้างแจ้งเตือน
}

export const ResellerTopbar: FC<ResellerTopbarProps> = ({ onToggle, user, newOrderCount = 0, onClearNotif }) => (
  <header style={{ height: 52, background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
    <button onClick={onToggle}
      style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20, padding: "4px 6px", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      ☰
    </button>
    <div style={{ flex: 1 }} />
    {/* ✅ Bell notification */}
    <button onClick={onClearNotif}
      style={{ position: "relative", background: "none", border: "none", color: newOrderCount > 0 ? "#d29922" : "var(--muted)", cursor: "pointer", fontSize: 18, padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 4 }}
      title={newOrderCount > 0 ? `ออเดอร์อัปเดต ${newOrderCount} รายการ` : "ไม่มีการแจ้งเตือน"}>
      🔔
      {newOrderCount > 0 && (
        <span style={{ position: "absolute", top: 2, right: 2, background: "#f85149", color: "#fff", borderRadius: "50%", fontSize: 9, fontWeight: 700, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {newOrderCount > 9 ? "9+" : newOrderCount}
        </span>
      )}
    </button>
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