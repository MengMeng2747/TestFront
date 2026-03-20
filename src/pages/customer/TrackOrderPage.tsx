// ─── pages/customer/TrackOrderPage.tsx ───────────────────────────────────────
// URL: /track-order?orderId=xxx
// BR-30: ใส่เลขออเดอร์ที่มีในระบบ → แสดงรายละเอียดและสถานะ
// BR-31: ใส่เลขออเดอร์ที่ไม่มีในระบบ → แสดง "ไม่พบออเดอร์นี้"
import { FC, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { T, F } from "../../styles/tokens";
import { StatusBadge } from "../../components/StatusBadge";
import type { Order } from "../../types";

interface TrackOrderPageProps {
  orders: Order[];
}

const statusSteps = [
  { key: "pending",   label: "รอดำเนินการ",  desc: "ออเดอร์ถูกสร้างและชำระเงินแล้ว",        icon: "📋" },
  { key: "shipped",   label: "จัดส่งแล้ว",   desc: "สินค้าถูกส่งออกจากคลังสินค้าแล้ว",       icon: "🚚" },
  { key: "completed", label: "เสร็จสมบูรณ์", desc: "สินค้าถึงมือผู้รับเรียบร้อยแล้ว",         icon: "✅" },
];

const statusOrder: Record<string, number> = { pending: 0, shipped: 1, completed: 2 };

export const TrackOrderPage: FC<TrackOrderPageProps> = ({ orders }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input,   setInput]   = useState(searchParams.get("orderId") ?? "");
  const [queried, setQueried] = useState(!!searchParams.get("orderId"));
  const navigate = useNavigate();

  // หา slug ของร้านจาก query string ก่อน ถ้าไม่มีค่อยอ่านจาก localStorage
  const shopSlug = searchParams.get("shop") || localStorage.getItem("rms_last_shop");

  const handleBack = () => {
    if (shopSlug) {
      navigate(`/shop/${shopSlug}`);
    } else {
      navigate(-1);
    }
  };

  const order = queried ? orders.find(o => o.id === input.trim().toUpperCase()) : null;
  const found = queried && !!order;
  const notFound = queried && !order;

  const handleSearch = () => {
    if (!input.trim()) return;
    setSearchParams({ orderId: input.trim().toUpperCase() });
    setQueried(true);
  };

  const currentStep = order ? statusOrder[order.status] : -1;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, ...F }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>ติดตามสถานะออเดอร์</h1>
          </div>
          <button
            onClick={handleBack}
            style={{ padding: "8px 16px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontWeight: 600, cursor: "pointer", fontSize: 13, ...F, whiteSpace: "nowrap" }}>
            ← กลับหน้าร้าน
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>

        {/* Search */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="กรอกเลขออเดอร์ เช่น ORD-20260001"
            style={{ flex: 1, padding: "11px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, ...F, outline: "none" }}
          />
          <button onClick={handleSearch}
            style={{ padding: "11px 20px", background: T.accent, border: "none", borderRadius: 8, color: "#0d1117", fontWeight: 700, cursor: "pointer", fontSize: 14, ...F, whiteSpace: "nowrap" }}>
            🔍 ค้นหา
          </button>
        </div>

        {/* BR-31: ไม่พบออเดอร์ */}
        {notFound && (
          <div style={{ textAlign: "center", padding: "40px 24px", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <h2 style={{ color: T.red, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>ไม่พบออเดอร์นี้</h2>
            <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>เลขออเดอร์ "{input}" ไม่มีในระบบ กรุณาตรวจสอบใหม่อีกครั้ง</p>
          </div>
        )}

        {/* BR-30: พบออเดอร์ */}
        {found && order && (
          <div>
            {/* Status Progress */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>เลขออเดอร์</div>
                  <div style={{ color: T.accent, fontWeight: 700, fontSize: 18 }}>{order.id}</div>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Timeline */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
                {statusSteps.map((step, i) => {
                  const done    = i <= currentStep;
                  const current = i === currentStep;
                  const isLast  = i === statusSteps.length - 1;
                  return (
                    <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", position: "relative" }}>
                      {/* Line */}
                      {!isLast && (
                        <div style={{ position: "absolute", top: 18, left: "50%", width: "100%", height: 2, background: i < currentStep ? T.green : T.border2, zIndex: 0 }} />
                      )}
                      {/* Circle */}
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: done ? T.green : T.surface2, border: `2px solid ${done ? T.green : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, zIndex: 1, position: "relative", boxShadow: current ? `0 0 0 4px rgba(63,185,80,.2)` : "none" }}>
                        {done ? "✓" : step.icon}
                      </div>
                      {/* Label */}
                      <div style={{ textAlign: "center", marginTop: 8 }}>
                        <div style={{ color: done ? T.green : T.dim, fontSize: 12, fontWeight: done ? 700 : 400 }}>{step.label}</div>
                        <div style={{ color: T.dim, fontSize: 10, marginTop: 2, maxWidth: 90, lineHeight: 1.4 }}>{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* รายละเอียดออเดอร์ */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px", marginBottom: 16 }}>
              <h2 style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>รายการสินค้า</h2>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border2}` }}>
                  <span style={{ color: T.text, fontSize: 14 }}>{item.productName} × {item.qty} ชิ้น</span>
                  <span style={{ color: T.green, fontWeight: 700, fontSize: 14 }}>฿{(item.sellingPrice * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12 }}>
                <span style={{ color: T.muted, fontSize: 14 }}>ยอดรวม</span>
                <span style={{ color: T.green, fontWeight: 700, fontSize: 18 }}>฿{order.totalSale.toLocaleString()}</span>
              </div>
            </div>

            {/* ที่อยู่จัดส่ง */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
              <h2 style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>ข้อมูลจัดส่ง</h2>
              {[
                ["ผู้รับ",     order.customer],
                ["เบอร์โทร",  order.phone],
                ["ร้านตัวแทน", order.shopName],
                ["ที่อยู่",    order.address],
                ["วันที่สั่ง", new Date(order.date).toLocaleString("th-TH")],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", padding: "8px 0", borderBottom: `1px solid ${T.border2}`, gap: 12 }}>
                  <span style={{ color: T.muted, fontSize: 12, width: 90, flexShrink: 0 }}>{k}</span>
                  <span style={{ color: T.text, fontSize: 13 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ถ้ายังไม่ได้ค้นหา */}
        {!queried && (
          <div style={{ textAlign: "center", padding: "40px 24px", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ color: T.muted, fontSize: 14 }}>กรอกเลขออเดอร์แล้วกด "ค้นหา" เพื่อติดตามสถานะ</p>
          </div>
        )}
      </div>
    </div>
  );
};