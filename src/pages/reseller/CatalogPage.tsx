// ─── pages/reseller/CatalogPage.tsx ───────────────────────────────────────────
// BR-19: ราคา < ขั้นต่ำ → error   BR-20: stock=0 → disabled   BR-21: ในร้านแล้ว → "แก้ไขราคา"
import { useState } from "react";
import type { FC } from "react";
import { PageHeader }              from "../../components/Layout";
import { Modal }                   from "../../components/Modal";
import { Btn }                     from "../../components/Btn";
import { FieldWrap, Inp }          from "../../components/Form";
import { useToast }                from "../../hooks/useToast";
import { T, F }                    from "../../styles/tokens";
import type { ResellerUser, Product, ShopProduct } from "../../types";

interface CatalogPageProps {
  user:          ResellerUser;
  products:      Product[];
  shopProducts:  ShopProduct[];
  onAddToShop:   (p: Product, price: number) => void;
  onUpdatePrice: (sp: ShopProduct, price: number) => void;
}

export const CatalogPage: FC<CatalogPageProps> = ({ user, products, shopProducts, onAddToShop, onUpdatePrice }) => {
  const [search, setSearch] = useState("");
  const [modal,  setModal]  = useState<{ product: Product; shopProduct: ShopProduct | null } | null>(null);
  const [price,  setPrice]  = useState("");
  const [priceError, setPriceError] = useState("");
  const [toast, showToast]  = useToast();

  const openModal = (p: Product) => {
    const existing = shopProducts.find(sp => sp.productId === p.id && sp.shopId === user.id);
    setModal({ product: p, shopProduct: existing ?? null });
    setPrice(existing ? String(existing.sellingPrice) : "");
    setPriceError("");
  };

  const handleSave = (): void => {
    const p = Number(price);
    if (!price || isNaN(p) || p <= 0) { setPriceError("กรุณากรอกราคา"); return; }
    if (p < modal!.product.minPrice) {                                    // BR-19
      setPriceError(`ราคาต่ำกว่าขั้นต่ำ ฿${modal!.product.minPrice.toLocaleString()} ไม่ได้`);
      return;
    }
    if (modal!.shopProduct) { onUpdatePrice(modal!.shopProduct, p); showToast("success", "อัปเดตราคาแล้ว"); }
    else                    { onAddToShop(modal!.product, p);        showToast("success", `เพิ่ม "${modal!.product.name}" เข้าร้านแล้ว`); }
    setModal(null);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="เลือกสินค้าเข้าร้าน"/>
      {toast}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหาสินค้า..."
          style={{ padding: "8px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, ...F, width: 260, outline: "none" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 16 }}>
        {filtered.map(p => {
          const inShop     = shopProducts.find(sp => sp.productId === p.id && sp.shopId === user.id);
          const outOfStock = p.stock === 0; // BR-20
          return (
            <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", opacity: outOfStock ? .6 : 1 }}>
              <div style={{ height: 130, background: T.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, position: "relative" }}>
                {p.imagePreview
                  ? <img src={p.imagePreview} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "16px" }} />
                  : "📦"
                }
                {outOfStock && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: T.red, fontWeight: 700, fontSize: 14, ...F, background: "rgba(0,0,0,.7)", padding: "4px 12px", borderRadius: 6 }}>สินค้าหมด</span>
                  </div>
                )}
                {inShop && !outOfStock && (
                  <div style={{ position: "absolute", top: 8, right: 8, background: T.green, borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#0d1117", fontWeight: 700, ...F }}>✓ ในร้าน</div>
                )}
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ color: T.text, fontWeight: 600, fontSize: 14, marginBottom: 4, ...F }}>{p.name}</div>
                <div style={{ color: T.muted, fontSize: 12, marginBottom: 12, ...F }}>{p.description}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                  <div style={{ background: T.surface2, borderRadius: 6, padding: "6px 10px" }}>
                    <div style={{ color: T.dim, fontSize: 10, ...F }}>ราคาทุน</div>
                    <div style={{ color: T.yellow, fontWeight: 700, fontSize: 13, ...F }}>฿{p.cost.toLocaleString()}</div>
                  </div>
                  <div style={{ background: T.surface2, borderRadius: 6, padding: "6px 10px" }}>
                    <div style={{ color: T.dim, fontSize: 10, ...F }}>ขั้นต่ำ</div>
                    <div style={{ color: T.red, fontWeight: 700, fontSize: 13, ...F }}>฿{p.minPrice.toLocaleString()}</div>
                  </div>
                </div>
                {inShop && (
                  <div style={{ color: T.orange, fontSize: 12, fontWeight: 700, ...F, marginBottom: 8 }}>
                    ราคาของฉัน: ฿{inShop.sellingPrice.toLocaleString()}
                  </div>
                )}
                <Btn
                  variant={outOfStock ? "ghost" : inShop ? "warning" : "primary"}
                  size="sm" style={{ width: "100%" }}
                  disabled={outOfStock}
                  onClick={() => !outOfStock && openModal(p)}
                >
                  {outOfStock
                    ? "สินค้าหมด"        // BR-20
                    : inShop
                      ? "✏️ แก้ไขราคา"   // BR-21
                      : "＋ เพิ่มเข้าร้าน"
                  }
                </Btn>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.shopProduct ? `แก้ไขราคา — ${modal?.product.name}` : `เพิ่มเข้าร้าน — ${modal?.product.name}`} width={400}>
        {modal && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              <div style={{ background: T.surface2, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ color: T.dim, fontSize: 11, ...F, marginBottom: 4 }}>ราคาทุน</div>
                <div style={{ color: T.yellow, fontWeight: 700, fontSize: 18, ...F }}>฿{modal.product.cost.toLocaleString()}</div>
              </div>
              <div style={{ background: T.surface2, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ color: T.dim, fontSize: 11, ...F, marginBottom: 4 }}>ราคาขั้นต่ำ</div>
                <div style={{ color: T.red, fontWeight: 700, fontSize: 18, ...F }}>฿{modal.product.minPrice.toLocaleString()}</div>
              </div>
            </div>
            <FieldWrap label="ราคาที่คุณจะขาย (บาท)" required error={priceError}>
              <Inp type="number" value={price} onChange={e => { setPrice(e.target.value); setPriceError(""); }} placeholder={`≥ ${modal.product.minPrice}`} error={priceError} autoFocus />
              {Number(price) >= modal.product.minPrice && Number(price) > 0 && (
                <p style={{ color: T.green, fontSize: 12, margin: "6px 0 0", ...F }}>
                  กำไรของคุณ: ฿{(Number(price) - modal.product.cost).toLocaleString()} / ชิ้น
                </p>
              )}
            </FieldWrap>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost"   onClick={() => setModal(null)}>ยกเลิก</Btn>
              <Btn variant="primary" onClick={handleSave}>💾 บันทึก</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};