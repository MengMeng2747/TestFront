// ─── pages/customer/CheckoutPage.tsx ─────────────────────────────────────────
// URL: /shop/:slug/checkout?productId=X
// BR-26: กด "ยืนยันคำสั่งซื้อ" → สร้างออเดอร์ → ไปหน้าชำระเงิน
// BR-27: จำนวนที่สั่ง > สต็อก → แสดง Error "สินค้าไม่เพียงพอ"
import { FC, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { T, F } from "../../styles/tokens";
import type { ResellerUser, ShopProduct, Order } from "../../types";

interface CheckoutPageProps {
  resellers:    ResellerUser[];
  shopProducts: ShopProduct[];
  onPlaceOrder: (order: Order) => void;
}

export const CheckoutPage: FC<CheckoutPageProps> = ({ resellers, shopProducts, onPlaceOrder }) => {
  const { slug }          = useParams<{ slug: string }>();
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const productId         = Number(searchParams.get("productId"));

  const reseller  = resellers.find(r => r.shopSlug === slug && r.status === "approved");
  const product   = shopProducts.find(sp => sp.id === productId && sp.shopId === reseller?.id);

  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [qty,  setQty]  = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!reseller || !product) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", ...F }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
          <p style={{ color: T.muted, fontSize: 16 }}>ไม่พบสินค้าหรือร้านค้านี้</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: "8px 20px", background: T.accent, border: "none", borderRadius: 8, color: "#0d1117", fontWeight: 700, cursor: "pointer", ...F }}>← ย้อนกลับ</button>
        </div>
      </div>
    );
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const total = product.sellingPrice * qty;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())    e.name    = "กรุณากรอกชื่อ-นามสกุล";
    if (!form.phone || !/^\d{10}$/.test(form.phone.replace(/-/g, ""))) e.phone = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก";
    if (!form.address.trim()) e.address = "กรุณากรอกที่อยู่จัดส่ง";
    if (qty < 1)              e.qty     = "จำนวนขั้นต่ำ 1 ชิ้น";
    if (qty > product.stock)  e.qty     = `สินค้าไม่เพียงพอ — มีเหลือ ${product.stock} ชิ้น`; // BR-27
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    // BR-26: สร้างออเดอร์
    const orderId = `ORD-${Date.now()}`;
    const newOrder: Order = {
      id:           orderId,
      resellerId:   reseller.id,
      resellerName: reseller.name,
      shopName:     reseller.shopName,
      customer:     form.name,
      phone:        form.phone,
      address:      form.address,
      product:      product.name,
      productId:    product.productId,
      items: [{
        productName:  product.name,
        qty,
        sellingPrice: product.sellingPrice,
        cost:         product.cost,
      }],
      qty,
      salePrice:    product.sellingPrice,
      totalSale:    total,
      totalProfit:  (product.sellingPrice - product.cost) * qty,
      cost:         product.cost,
      date:         new Date().toISOString(),
      status:       "pending",
    };

    onPlaceOrder(newOrder);
    navigate(`/shop/${slug}/payment/${orderId}`);  // BR-26: ไปหน้าชำระเงิน
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, ...F }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(`/shop/${slug}`)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20 }}>←</button>
        <div>
          <h1 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0 }}>สั่งซื้อสินค้า</h1>
          <p style={{ color: T.muted, fontSize: 12, margin: 0 }}>URL: /shop/{slug}/checkout</p>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 24px" }}>

        {/* สรุปสินค้า */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 24 }}>
          <h2 style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>สินค้าที่เลือก</h2>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 8, background: T.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
              {product.imagePreview ? <img src={product.imagePreview} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} /> : "📦"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.text, fontWeight: 600, fontSize: 15 }}>{product.name}</div>
              <div style={{ color: T.green, fontWeight: 700, fontSize: 18, marginTop: 4 }}>฿{product.sellingPrice.toLocaleString()} / ชิ้น</div>
            </div>
          </div>

          {/* จำนวน */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>จำนวนสินค้า</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ color: T.text, fontWeight: 700, fontSize: 18, minWidth: 32, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              <span style={{ color: T.dim, fontSize: 12 }}>คงเหลือ {product.stock} ชิ้น</span>
            </div>
            {errors.qty && <p style={{ color: T.red, fontSize: 12, margin: "6px 0 0" }}>{errors.qty}</p>}
          </div>

          {/* ยอดรวม */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border2}` }}>
            <span style={{ color: T.muted, fontSize: 14 }}>ยอดรวม (คำนวณอัตโนมัติ)</span>
            <span style={{ color: T.green, fontWeight: 700, fontSize: 22 }}>฿{total.toLocaleString()}</span>
          </div>
        </div>

        {/* ฟอร์มจัดส่ง */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 24 }}>
          <h2 style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>ข้อมูลจัดส่ง</h2>

          {[
            { key: "name",    label: "ชื่อ-นามสกุล",   placeholder: "ชื่อผู้รับสินค้า",     type: "text"     },
            { key: "phone",   label: "เบอร์โทรศัพท์",  placeholder: "0812345678",          type: "tel"      },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>{f.label} <span style={{ color: T.red }}>*</span></label>
              <input
                type={f.type}
                value={(form as any)[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${errors[f.key] ? T.red : T.border}`, borderRadius: 8, color: T.text, fontSize: 14, ...F, boxSizing: "border-box", outline: "none" }}
              />
              {errors[f.key] && <p style={{ color: T.red, fontSize: 12, margin: "4px 0 0" }}>{errors[f.key]}</p>}
            </div>
          ))}

          <div style={{ marginBottom: 4 }}>
            <label style={{ display: "block", color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>ที่อยู่จัดส่ง <span style={{ color: T.red }}>*</span></label>
            <textarea
              value={form.address}
              onChange={e => set("address", e.target.value)}
              placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
              rows={3}
              style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${errors.address ? T.red : T.border}`, borderRadius: 8, color: T.text, fontSize: 14, ...F, boxSizing: "border-box", outline: "none", resize: "vertical" }}
            />
            {errors.address && <p style={{ color: T.red, fontSize: 12, margin: "4px 0 0" }}>{errors.address}</p>}
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit}
          style={{ width: "100%", padding: "14px", background: T.accent, border: "none", borderRadius: 10, color: "#0d1117", fontWeight: 700, fontSize: 16, cursor: "pointer", ...F }}>
          ✓ ยืนยันคำสั่งซื้อ
        </button>
      </div>
    </div>
  );
};
