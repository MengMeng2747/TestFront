// ─── pages/customer/ShopPage.tsx ─────────────────────────────────────────────
// BR-24: URL ชื่อร้านไม่มีในระบบ → 404
// BR-25: stock = 0 → สินค้าหมด
// BR-26: ยืนยันออเดอร์ → สร้างออเดอร์ → ไปหน้าชำระเงิน
// BR-27: จำนวน > stock → error
import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, F } from "../../styles/tokens";
import type { ResellerUser, ShopProduct } from "../../types";

interface CartItem { product: ShopProduct; qty: number; }

interface ShopPageProps {
  resellers:    ResellerUser[];
  shopProducts: ShopProduct[];
  shopId:       number;
  slug:         string;
  onPlaceOrder: (items: CartItem[], form: { name: string; phone: string; address: string }) => Promise<void>;
}

export const ShopPage: FC<ShopPageProps> = ({ resellers, shopProducts, slug, onPlaceOrder }) => {
  const navigate = useNavigate();

  const [cart,       setCart]       = useState<CartItem[]>([]);
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState({ name: "", phone: "", address: "" });
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // BR-24
  const reseller = resellers.find(r => r.shopSlug === slug && r.status === "approved");

  if (!reseller) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", ...F }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏪</div>
          <h1 style={{ color: T.red, fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>404</h1>
          <p style={{ color: T.muted, fontSize: 16, margin: "0 0 24px" }}>ไม่พบร้านค้านี้ในระบบ (BR-24)</p>
          <button onClick={() => navigate("/")}
            style={{ padding: "10px 22px", background: T.accent, border: "none", borderRadius: 8, color: "#0d1117", fontWeight: 700, cursor: "pointer", ...F }}>
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const cartQty  = (id: number) => cart.find(c => c.product.id === id)?.qty ?? 0;
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const totalAmt = cart.reduce((s, c) => s + c.product.sellingPrice * c.qty, 0);

  const addToCart = (sp: ShopProduct) => {
    setCart(prev => {
      const ex = prev.find(c => c.product.id === sp.id);
      if (ex) return prev.map(c => c.product.id === sp.id ? { ...c, qty: Math.min(sp.stock, c.qty + 1) } : c);
      return [...prev, { product: sp, qty: 1 }];
    });
  };

  const changeQty = (id: number, qty: number) => {
    if (qty <= 0) { setCart(prev => prev.filter(c => c.product.id !== id)); return; }
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, qty } : c));
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "กรุณากรอกชื่อ-นามสกุล";
    if (!/^\d{9,10}$/.test(form.phone.replace(/-/g, ""))) e.phone = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก";
    if (!form.address.trim()) e.address = "กรุณากรอกที่อยู่จัดส่ง";
    cart.forEach(c => {
      if (c.qty > c.product.stock)
        e[`stock_${c.product.id}`] = `${c.product.name}: เหลือเพียง ${c.product.stock} ชิ้น (BR-27)`;
    });
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      await onPlaceOrder(cart, form);
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const [search, setSearch] = useState("");
  const myProducts = shopProducts.filter(sp => sp.shopId === reseller.id || sp.shopId === 0);
  const filteredProducts = myProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, ...F }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Shop Header (เดิม) ────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "24px 0" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${T.accent},#bc8cff)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff", fontWeight: 700 }}>
              {reseller.shopName.charAt(0)}
            </div>
            <div>
              <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>{reseller.shopName}</h1>
              <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>URL: /shop/{reseller.shopSlug}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Products (เดิม + ตะกร้า) ─────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", paddingBottom: cart.length > 0 ? 100 : 32 }}>
        {/* ✅ Search Box */}
        <div style={{ marginBottom: 24, position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาสินค้า..."
            style={{ width: "100%", padding: "11px 14px 11px 42px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 14, ...F, boxSizing: "border-box", outline: "none" }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, padding: 0 }}>
              ✕
            </button>
          )}
        </div>

        {myProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", color: T.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ fontSize: 16 }}>ยังไม่มีสินค้าในร้านนี้</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 24px", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, ...F }}>ไม่พบสินค้า "{search}"</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20 }}>
            {filteredProducts.map(sp => {
              const outOfStock = sp.stock === 0; // BR-25
              const qty        = cartQty(sp.id);

              return (
                <div key={sp.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", opacity: outOfStock ? .65 : 1 }}>
                  {/* รูปสินค้า (เดิม) */}
                  <div style={{ height: 180, background: T.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, position: "relative" }}>
                    {sp.imagePreview
                      ? <img src={sp.imagePreview} alt={sp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : "📦"
                    }
                    {outOfStock && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: T.red, fontWeight: 700, fontSize: 15, background: "rgba(0,0,0,.7)", padding: "6px 14px", borderRadius: 8 }}>สินค้าหมด</span>
                      </div>
                    )}
                  </div>

                  {/* ข้อมูลสินค้า (เดิม + เพิ่ม qty control) */}
                  <div style={{ padding: "16px" }}>
                    <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{sp.name}</h3>
                    <p style={{ color: T.muted, fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>{sp.description}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <span style={{ color: T.green, fontWeight: 700, fontSize: 20 }}>฿{sp.sellingPrice.toLocaleString()}</span>
                      <span style={{ color: T.dim, fontSize: 12 }}>คงเหลือ {sp.stock} ชิ้น</span>
                    </div>

                    {/* ปุ่ม / qty control */}
                    {outOfStock ? (
                      <button disabled style={{ width: "100%", padding: "10px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.dim, fontWeight: 700, cursor: "not-allowed", fontSize: 14, ...F }}>
                        สินค้าหมด
                      </button>
                    ) : qty === 0 ? (
                      <button onClick={() => addToCart(sp)}
                        style={{ width: "100%", padding: "10px", background: T.accent, border: `1px solid ${T.accent}`, borderRadius: 8, color: "#0d1117", fontWeight: 700, cursor: "pointer", fontSize: 14, ...F }}>
                        + เพิ่มใส่ตะกร้า
                      </button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => changeQty(sp.id, qty - 1)}
                          style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>−</button>
                        <input
                          type="number" min={1} max={sp.stock} value={qty}
                          onChange={e => {
                            const v = parseInt(e.target.value, 10);
                            if (isNaN(v) || v < 1) changeQty(sp.id, 1);
                            else if (v > sp.stock) changeQty(sp.id, sp.stock);
                            else changeQty(sp.id, v);
                          }}
                          style={{ flex: 1, textAlign: "center", color: T.text, fontWeight: 700, fontSize: 16, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 0", outline: "none", ...F }}
                        />
                        <button onClick={() => changeQty(sp.id, Math.min(sp.stock, qty + 1))}
                          style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginTop: 40, padding: "20px 0", borderTop: `1px solid ${T.border2}` }}>
          <p style={{ color: T.muted, fontSize: 13, margin: "0 0 12px", ...F }}>
            ร้านของ <strong style={{ color: T.text }}>{reseller.shopName}</strong> · Powered by ResellerHub
          </p>
          <button onClick={() => navigate("/track-order")}
            style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 20px", color: T.accent, fontWeight: 600, cursor: "pointer", fontSize: 13, ...F, display: "inline-flex", alignItems: "center", gap: 6 }}>
            📍 ติดตามสถานะออเดอร์
          </button>
        </div>
      </div>

      {/* ── Cart Bar (sticky bottom) ───────────────────────────────────────── */}
      {cart.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.surface, borderTop: `1px solid ${T.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100, boxShadow: "0 -4px 20px rgba(0,0,0,.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 38, height: 38, background: T.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#0d1117", fontWeight: 700, fontSize: 15 }}>
              {totalQty}
            </div>
            <div>
              <div style={{ color: T.muted, fontSize: 12, ...F }}>{cart.length} รายการ</div>
              <div style={{ color: T.green, fontWeight: 700, fontSize: 18, ...F }}>฿{totalAmt.toLocaleString()}</div>
            </div>
          </div>
          <button onClick={() => { setErrors({}); setShowModal(true); }}
            style={{ background: T.accent, border: "none", borderRadius: 9, padding: "11px 24px", color: "#0d1117", fontWeight: 700, fontSize: 15, cursor: "pointer", ...F }}>
            สั่งซื้อเลย →
          </button>
        </div>
      )}

      {/* ── Checkout Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.5)" }}>
            <div style={{ height: 3, background: `linear-gradient(90deg,${T.accent},#bc8cff,transparent)`, borderRadius: "14px 14px 0 0" }} />
            <div style={{ padding: "24px 28px" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0, ...F }}>🛒 ยืนยันออเดอร์</h2>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20, padding: 0 }}>✕</button>
              </div>

              {/* รายการสินค้า */}
              <div style={{ background: T.surface2, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12, ...F }}>รายการสินค้า</div>
                {cart.map(c => (
                  <div key={c.product.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border2}` }}>
                    <span style={{ color: T.text, fontSize: 14, ...F }}>{c.product.name} × {c.qty}</span>
                    <span style={{ color: T.green, fontWeight: 700, fontSize: 14, ...F }}>฿{(c.product.sellingPrice * c.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
                  <span style={{ color: T.muted, fontSize: 14, ...F }}>ยอดรวม</span>
                  <span style={{ color: T.green, fontWeight: 700, fontSize: 20, ...F }}>฿{totalAmt.toLocaleString()}</span>
                </div>
              </div>

              {/* ฟอร์มจัดส่ง */}
              <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14, ...F }}>ข้อมูลจัดส่ง</div>

              {[
                { key: "name",  label: "ชื่อ-นามสกุล",   placeholder: "ชื่อผู้รับสินค้า", type: "text" },
                { key: "phone", label: "เบอร์โทรศัพท์",  placeholder: "0812345678",       type: "tel"  },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6, ...F }}>
                    {f.label} <span style={{ color: T.red }}>*</span>
                  </label>
                  <input type={f.type} value={(form as any)[f.key]}
                    onChange={e => {
                      if (f.key === "phone") {
                        setForm(p => ({ ...p, [f.key]: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) }));
                      } else {
                        setForm(p => ({ ...p, [f.key]: e.target.value }));
                      }
                    }}
                    maxLength={f.key === "phone" ? 10 : undefined}
                    inputMode={f.key === "phone" ? "numeric" : undefined}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${errors[f.key] ? T.red : T.border}`, borderRadius: 8, color: T.text, fontSize: 14, ...F, boxSizing: "border-box", outline: "none" }} />
                  {errors[f.key] && <p style={{ color: T.red, fontSize: 12, margin: "4px 0 0", ...F }}>{errors[f.key]}</p>}
                </div>
              ))}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6, ...F }}>
                  ที่อยู่จัดส่ง <span style={{ color: T.red }}>*</span>
                </label>
                <textarea value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${errors.address ? T.red : T.border}`, borderRadius: 8, color: T.text, fontSize: 14, ...F, boxSizing: "border-box", outline: "none", resize: "vertical" }} />
                {errors.address && <p style={{ color: T.red, fontSize: 12, margin: "4px 0 0", ...F }}>{errors.address}</p>}
              </div>

              {/* stock errors */}
              {Object.entries(errors).filter(([k]) => k.startsWith("stock_")).map(([k, v]) => (
                <p key={k} style={{ color: T.red, fontSize: 12, margin: "0 0 8px", ...F }}>⚠️ {v}</p>
              ))}

              <button onClick={handleSubmit} disabled={submitting}
                style={{ width: "100%", padding: 12, background: submitting ? "rgba(88,166,255,.3)" : T.accent, border: "none", borderRadius: 9, color: submitting ? T.muted : "#0d1117", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", ...F }}>
                {submitting ? "กำลังดำเนินการ..." : "ถัดไป: ชำระเงิน →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};