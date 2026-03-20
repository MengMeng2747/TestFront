// ─── pages/customer/PaymentPage.tsx ──────────────────────────────────────────
// URL: /shop/:slug/payment/:orderId
// BR-28: กดปุ่ม "จ่ายเงิน" → อนุมัติทันที → redirect หน้า Track
// BR-29: หลังชำระสำเร็จ → ตัดสต็อกสินค้าตามจำนวนที่สั่ง
import { FC, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { T, F } from "../../styles/tokens";
import { StatusBadge } from "../../components/StatusBadge";
import type { Order, ShopProduct } from "../../types";

interface PaymentPageProps {
  orders:          Order[];
  onPaymentSuccess: (orderId: string) => void; // BR-29: ตัดสต็อก
}

export const PaymentPage: FC<PaymentPageProps> = ({ orders, onPaymentSuccess }) => {
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>();
  const navigate          = useNavigate();
  const [paying, setPaying] = useState(false);
  const [paid,   setPaid]   = useState(false);

  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", ...F }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
          <p style={{ color: T.muted, fontSize: 16 }}>ไม่พบออเดอร์นี้</p>
          <button onClick={() => navigate(`/shop/${slug}`)} style={{ marginTop: 16, padding: "8px 20px", background: T.accent, border: "none", borderRadius: 8, color: "#0d1117", fontWeight: 700, cursor: "pointer", ...F }}>← กลับร้าน</button>
        </div>
      </div>
    );
  }

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      // BR-28: อนุมัติทันที
      // BR-29: ตัดสต็อก
      onPaymentSuccess(order.id);
      setPaid(true);
      setPaying(false);
      // redirect ไปหน้า Track หลัง 2 วิ
      setTimeout(() => navigate(`/track-order?orderId=${order.id}`), 2000);
    }, 1200);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, ...F }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: 480, maxWidth: "100%" }}>
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: "0 24px 64px rgba(0,0,0,.5)", overflow: "hidden" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg,${T.green},#39d353,transparent)` }} />
          <div style={{ padding: "28px 28px 24px" }}>

            {paid ? (
              // ── ชำระสำเร็จ ──
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
                <h2 style={{ color: T.green, fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>ชำระเงินสำเร็จ!</h2>
                <p style={{ color: T.muted, fontSize: 14, margin: "0 0 4px" }}>เลขออเดอร์: <strong style={{ color: T.accent }}>{order.id}</strong></p>
                <p style={{ color: T.dim, fontSize: 13, margin: 0 }}>กำลังพาไปหน้าติดตามออเดอร์...</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>💳</div>
                  <h1 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>จำลองการชำระเงิน</h1>
                  {/* <p style={{ color: T.muted, fontSize: 12, margin: 0 }}>{orderId}</p> */}
                </div>

                {/* ป้ายแจ้ง */}
                <div style={{ background: "rgba(210,153,34,.1)", border: "1px solid rgba(210,153,34,.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: T.yellow }}>
                  ⚠️ ระบบนี้จำลองการชำระเงินเท่านั้น — ไม่มีการเชื่อมต่อธนาคารจริง
                </div>

                {/* สรุปออเดอร์ */}
                <div style={{ background: T.surface2, borderRadius: 10, padding: "16px", marginBottom: 20 }}>
                  <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>สรุปรายการสั่งซื้อ</div>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border2}` }}>
                      <span style={{ color: T.text, fontSize: 14 }}>{item.productName} × {item.qty}</span>
                      <span style={{ color: T.green, fontWeight: 700, fontSize: 14 }}>฿{(item.sellingPrice * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
                    <span style={{ color: T.muted, fontSize: 14 }}>ยอดที่ต้องชำระ</span>
                    <span style={{ color: T.green, fontWeight: 700, fontSize: 24 }}>฿{order.totalSale.toLocaleString()}</span>
                  </div>
                </div>

                {/* ข้อมูลจัดส่ง */}
                <div style={{ marginBottom: 20 }}>
                  {[
                    ["ผู้รับ",    order.customer],
                    ["เบอร์โทร", order.phone],
                    ["ที่อยู่",   order.address],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: `1px solid ${T.border2}` }}>
                      <span style={{ color: T.muted, fontSize: 12, width: 70, flexShrink: 0 }}>{k}</span>
                      <span style={{ color: T.text, fontSize: 13 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* ปุ่มจ่ายเงิน */}
                <button onClick={handlePay} disabled={paying}
                  style={{ width: "100%", padding: "14px", background: paying ? "rgba(63,185,80,.3)" : T.green, border: "none", borderRadius: 10, color: paying ? T.muted : "#0d1117", fontWeight: 700, fontSize: 16, cursor: paying ? "not-allowed" : "pointer", ...F, transition: "all .2s" }}>
                  {paying ? "กำลังดำเนินการ..." : "💳 จ่ายเงิน (จำลอง)"}
                </button>

                <p style={{ textAlign: "center", color: T.dim, fontSize: 11, marginTop: 12 }}>
                  กดปุ่มแล้วถือว่าชำระเงินสำเร็จทันที
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
