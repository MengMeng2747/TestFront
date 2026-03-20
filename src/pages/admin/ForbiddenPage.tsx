// ─── pages/admin/ForbiddenPage.tsx ────────────────────────────────────────────
// แสดงเมื่อ Role ไม่ใช่ admin พยายามเข้า /admin/* (BR-04)
import type { FC } from "react";
import { T, F } from "../../styles/tokens";

interface ForbiddenPageProps {
  onBack: () => void;
}

export const ForbiddenPage: FC<ForbiddenPageProps> = ({ onBack }) => (
  <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", ...F }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>⛔</div>
      <h1 style={{ color: T.red, fontSize: 28, margin: "0 0 8px" }}>403 Forbidden</h1>
      <p style={{ color: T.muted, margin: "0 0 24px" }}>คุณไม่มีสิทธิ์เข้าใช้งานส่วน Admin</p>
      <button onClick={onBack}
        style={{ padding: "10px 22px", background: T.accent, border: "none", borderRadius: 8, color: "#0d1117", fontWeight: 700, cursor: "pointer", ...F }}>
        ← กลับหน้า Login
      </button>
    </div>
  </div>
);
