// ─── pages/reseller/RegisterSuccessPage.tsx ───────────────────────────────────
// BR-12: สมัครสำเร็จ → แสดงหน้าแจ้งให้รอ Admin อนุมัติ
import type { FC } from "react";
import { Btn }         from "../../components/Btn";
import { StatusBadge } from "../../components/StatusBadge";
import { T, F }        from "../../styles/tokens";

interface RegisterSuccessPageProps {
  onGoLogin: () => void;
}

export const RegisterSuccessPage: FC<RegisterSuccessPageProps> = ({ onGoLogin }) => (
  <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", ...F }}>
    <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>⏳</div>
      <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>สมัครสำเร็จแล้ว!</h2>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
        <p style={{ color: T.muted, margin: 0, fontSize: 18, lineHeight: 1.8, ...F }}>
          บัญชีของคุณอยู่ในสถานะ <StatusBadge status="pending" /><br />
          กรุณารอ Admin ตรวจสอบและอนุมัติ<br />
          {/* <span style={{ color: T.dim, fontSize: 12 }}>(BR-12: สมัครสำเร็จ → สถานะ รออนุมัติ)</span> */}
        </p>
      </div>
      <Btn variant="primary" size="lg" onClick={onGoLogin}>ไปหน้า Login</Btn>
    </div>
  </div>
);
