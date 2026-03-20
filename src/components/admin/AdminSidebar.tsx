// ─── components/admin/AdminSidebar.tsx ────────────────────────────────────────
import type { FC } from "react";
import { T, F } from "../../styles/tokens";
import type { AdminPageId } from "../../types";

interface NavItem {
  id: AdminPageId;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "products", label: "จัดการสินค้า", icon: "📦" },
  { id: "resellers", label: "จัดการตัวแทน", icon: "👥" },
  { id: "orders", label: "จัดการออเดอร์", icon: "🛒" },
];

interface AdminSidebarProps {
  page: AdminPageId;
  setPage: (p: AdminPageId) => void;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  pendingCount: number;
  onToggleTheme: () => void;
  theme: "dark" | "light";
}

export const AdminSidebar: FC<AdminSidebarProps> = ({
  page,
  setPage,
  onLogout,
  pendingCount,
  onToggleTheme,
  theme,
}) => (
  <aside
    style={{
      width: 220,
      minHeight: "100vh",
      background: T.surface,
      borderRight: `1px solid ${T.border}`,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
    }}
  >
    <div
      style={{
        padding: "18px 20px",
        borderBottom: `1px solid ${T.border2}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 30, flexShrink: 0 }}>🧑🏻‍💻</span>
      <div>
        <div style={{ color: T.text, fontWeight: 700, fontSize: 20, ...F }}>
          Admin
        </div>
        <div style={{ color: T.muted, fontSize: 12, ...F }}>
          Halo Bro im Admin
        </div>
      </div>
    </div>

    <nav style={{ flex: 1, padding: 8 }}>
      {navItems.map((n) => {
        const active = page === n.id;
        const badge = n.id === "resellers" && pendingCount > 0;
        return (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 12px",
              justifyContent: "flex-start",
              marginBottom: 2,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: active ? "rgba(88,166,255,.15)" : "transparent",
              color: active ? T.accent : T.muted,
              position: "relative",
              ...F,
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
            <span style={{ fontSize: 13, fontWeight: active ? 700 : 400 }}>
              {n.label}
            </span>
            {badge && (
              <span
                style={{
                  background: T.red,
                  color: "#fff",
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  marginLeft: "auto",
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>

    <div
      style={{
        padding: "12px 8px",
        borderTop: `1px solid ${T.border2}`,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {/* ปุ่ม Toggle Theme */}
      <button
        onClick={onToggleTheme}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "10px 12px",
          justifyContent: "flex-start",
          borderRadius: 8,
          border: `1px solid ${T.border}`,
          cursor: "pointer",
          background: T.surface2,
          color: T.muted,
          ...F,
        }}
      >
        <span style={{ fontSize: 16 }}>{theme === "dark" ? "☀️" : "🌙"}</span>
        <span style={{ fontSize: 13 }}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      </button>
      {/* Logout */}
      <button
        onClick={onLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "10px 12px",
          justifyContent: "flex-start",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          background: "transparent",
          color: T.muted,
          ...F,
        }}
      >
        <span style={{ fontSize: 16 }}>➜]</span>
        <span style={{ fontSize: 13 }}>ออกจากระบบ</span>
      </button>
    </div>
  </aside>
);
