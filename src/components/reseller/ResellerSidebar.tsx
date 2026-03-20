// ─── components/reseller/ResellerSidebar.tsx ──────────────────────────────────
import type { FC } from "react";
import { T, F } from "../../styles/tokens";
import type { ResellerPageId, ResellerUser } from "../../types";

interface NavItem { id: ResellerPageId; label: string; icon: string; }

const navItems: NavItem[] = [
  { id: "dashboard",    label: "Dashboard",       icon: "📊" },
  { id: "catalog",      label: "เลือกสินค้า",     icon: "🛍️" },
  { id: "my-products",  label: "สินค้าในร้านฉัน", icon: "📦" },
  { id: "orders",       label: "ออเดอร์ของฉัน",   icon: "🛒" },
  { id: "wallet",       label: "Wallet กำไร",      icon: "💸" },
];

interface ResellerSidebarProps {
  page:          ResellerPageId;
  setPage:       (p: ResellerPageId) => void;
  onLogout:      () => void;
  collapsed:     boolean;
  setCollapsed:  React.Dispatch<React.SetStateAction<boolean>>;
  user:          ResellerUser | null;
  onToggleTheme: () => void;
  theme:         "dark" | "light";
}

export const ResellerSidebar: FC<ResellerSidebarProps> = ({
  page, setPage, onLogout, user, onToggleTheme, theme,
}) => (
  <aside style={{ width: 220, minHeight: "100vh", background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
    {/* Header */}
    <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border2}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: user?.shopName ? 10 : 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${T.accent},#bc8cff)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
          {user?.name?.charAt(0) ?? "R"}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 14, ...F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name ?? "Reseller"}</div>
          <div style={{ color: T.muted, fontSize: 10, ...F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email ?? ""}</div>
        </div>
      </div>
      {user?.shopName && (
        <div style={{ background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 6, padding: "5px 10px", marginTop: 8 }}>
          <div style={{ color: T.dim, fontSize: 10, ...F }}>ร้านของฉัน</div>
          <div style={{ color: T.accent, fontSize: 12, fontWeight: 700, ...F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.shopName}</div>
        </div>
      )}
    </div>

    {/* Nav */}
    <nav style={{ flex: 1, padding: 8 }}>
      {navItems.map(n => {
        const active = page === n.id;
        return (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", justifyContent: "flex-start", marginBottom: 2, borderRadius: 8, border: "none", cursor: "pointer", background: active ? "rgba(188,140,255,.15)" : "transparent", color: active ? "#bc8cff" : T.muted, ...F }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
            <span style={{ fontSize: 13, fontWeight: active ? 700 : 400 }}>{n.label}</span>
          </button>
        );
      })}
    </nav>

    {/* Bottom: Theme toggle + Logout */}
    <div style={{ padding: "12px 8px", borderTop: `1px solid ${T.border2}`, display: "flex", flexDirection: "column", gap: 4 }}>
      {/* ปุ่ม Toggle Theme */}
      <button onClick={onToggleTheme}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", justifyContent: "flex-start", borderRadius: 8, border: `1px solid ${T.border}`, cursor: "pointer", background: T.surface2, color: T.muted, ...F }}>
        <span style={{ fontSize: 16 }}>{theme === "dark" ? "☀️" : "🌙"}</span>
        <span style={{ fontSize: 13 }}>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
      </button>
      {/* Logout */}
      <button onClick={onLogout}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", justifyContent: "flex-start", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: T.muted, ...F }}>
        <span style={{ fontSize: 16 }}>➜]</span>
        <span style={{ fontSize: 13 }}>ออกจากระบบ</span>
      </button>
    </div>
  </aside>
);