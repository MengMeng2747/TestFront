// ─── pages/customer/TrackOrderPage.tsx ───────────────────────────────────────
import { FC, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { T, F } from "../../styles/tokens";
import { StatusBadge } from "../../components/StatusBadge";
import { trackOrder } from "../../api/customer"; // ✅ เรียก API จริง

interface TrackOrderPageProps {}

const statusSteps = [
  { key: "pending",   label: "รอดำเนินการ",  desc: "ออเดอร์ถูกสร้างและชำระเงินแล้ว",  icon: "📋" },
  { key: "shipped",   label: "จัดส่งแล้ว",   desc: "สินค้าถูกส่งออกจากคลังสินค้าแล้ว", icon: "🚚" },
  { key: "completed", label: "เสร็จสมบูรณ์", desc: "สินค้าถึงมือผู้รับเรียบร้อยแล้ว",   icon: "✅" },
];

const statusOrder: Record<string, number> = { pending: 0, shipped: 1, completed: 2 };

export const TrackOrderPage: FC<TrackOrderPageProps> = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input,    setInput]    = useState(searchParams.get("orderId") ?? "");
  const [queried,  setQueried]  = useState(!!searchParams.get("orderId"));
  const [order,    setOrder]    = useState<any>(null);
  const [loading,  setLoading]  = useState(false);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  const shopSlug = searchParams.get("shop") || localStorage.getItem("rms_last_shop");

  const handleBack = () => {
    if (shopSlug) navigate(`/shop/${shopSlug}`);
    else navigate(-1);
  };

  // ✅ ดึงข้อมูลจาก API จริง
  const fetchOrder = async (orderNumber: string) => {
    if (!orderNumber.trim()) return;
    setLoading(true);
    setNotFound(false);
    setOrder(null);
    try {
      const res = await trackOrder(orderNumber.trim().toUpperCase());
      setOrder(res);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // โหลดอัตโนมัติถ้ามี orderId ใน URL
  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId) fetchOrder(orderId);
  }, []);

  const handleSearch = () => {
    if (!input.trim()) return;
    setSearchParams({ orderId: input.trim().toUpperCase() });
    setQueried(true);
    fetchOrder(input);
  };

  const currentStep = order ? statusOrder[order.status] : -1;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, ...F }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h1 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: 0 }}>ติดตามสถานะออเดอร์</h1>
          <button onClick={handleBack}
            style={{ padding: "8px 16px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontWeight: 600, cursor: "pointer", fontSize: 13, ...F }}>
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
          <button onClick={handleSearch} disabled={loading}
            style={{ padding: "11px 20px", background: T.accent, border: "none", borderRadius: 8, color: "#0d1117", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: 14, ...F, opacity: loading ? .6 : 1 }}>
            {loading ? "กำลังค้นหา..." : "🔍 ค้นหา"}
          </button>
        </div>

        {/* ไม่พบออเดอร์ */}
        {notFound && (
          <div style={{ textAlign: "center", padding: "40px 24px", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <h2 style={{ color: T.red, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>ไม่พบออเดอร์นี้</h2>
            <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>เลขออเดอร์ "{input}" ไม่มีในระบบ กรุณาตรวจสอบใหม่อีกครั้ง</p>
          </div>
        )}

        {/* พบออเดอร์ */}
        {order && (
          <div>
            {/* Status Progress */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>เลขออเดอร์</div>
                  <div style={{ color: T.accent, fontWeight: 700, fontSize: 18 }}>{order.orderNumber}</div>
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
                      {!isLast && (
                        <div style={{ position: "absolute", top: 18, left: "50%", width: "100%", height: 2, background: i < currentStep ? T.green : T.border2, zIndex: 0 }} />
                      )}
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: done ? T.green : T.surface2, border: `2px solid ${done ? T.green : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, zIndex: 1, position: "relative", boxShadow: current ? `0 0 0 4px rgba(63,185,80,.2)` : "none" }}>
                        {done ? "✓" : step.icon}
                      </div>
                      <div style={{ textAlign: "center", marginTop: 8 }}>
                        <div style={{ color: done ? T.green : T.dim, fontSize: 12, fontWeight: done ? 700 : 400 }}>{step.label}</div>
                        <div style={{ color: T.dim, fontSize: 10, marginTop: 2, maxWidth: 90, lineHeight: 1.4 }}>{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* รายการสินค้า */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px", marginBottom: 16 }}>
              <h2 style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>รายการสินค้า</h2>
              {order.items?.map((item: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border2}` }}>
                  <span style={{ color: T.text, fontSize: 14 }}>{item.productName} × {item.quantity} ชิ้น</span>
                  <span style={{ color: T.green, fontWeight: 700, fontSize: 14 }}>฿{(item.sellingPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12 }}>
                <span style={{ color: T.muted, fontSize: 14 }}>ยอดรวม</span>
                <span style={{ color: T.green, fontWeight: 700, fontSize: 18 }}>฿{order.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            {/* ข้อมูลจัดส่ง */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
              <h2 style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>ข้อมูลจัดส่ง</h2>
              {[
                ["ผู้รับ",      order.customerName],
                ["เบอร์โทร",   order.customerPhone],
                ["ร้านตัวแทน", order.shopName],   // ✅ shopName จาก DB
                ["ที่อยู่",     order.shippingAddress],
                ["วันที่สั่ง",  new Date(order.createdAt).toLocaleString("th-TH")],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", padding: "8px 0", borderBottom: `1px solid ${T.border2}`, gap: 12 }}>
                  <span style={{ color: T.muted, fontSize: 12, width: 90, flexShrink: 0 }}>{k}</span>
                  <span style={{ color: T.text, fontSize: 13 }}>{v || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ยังไม่ได้ค้นหา */}
        {!queried && !order && !loading && (
          <div style={{ textAlign: "center", padding: "40px 24px", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ color: T.muted, fontSize: 14 }}>กรอกเลขออเดอร์แล้วกด "ค้นหา" เพื่อติดตามสถานะ</p>
          </div>
        )}
      </div>
    </div>
  );
};