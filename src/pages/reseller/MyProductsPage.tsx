// ─── pages/reseller/MyProductsPage.tsx ────────────────────────────────────────
import { useState } from "react";
import type { FC } from "react";
import { PageHeader, EmptyState } from "../../components/Layout";
import { Table, Tr, Td }          from "../../components/Table";
import { Btn }                    from "../../components/Btn";
import { Modal }                  from "../../components/Modal";
import { Alert }                  from "../../components/Alert";
import { FieldWrap, Inp }         from "../../components/Form";
import { useToast }               from "../../hooks/useToast";
import { T, F }                   from "../../styles/tokens";
import type { ShopProduct }       from "../../types";

interface MyProductsPageProps {
  shopProducts:  ShopProduct[];
  onRemove:      (id: number) => void;
  onUpdatePrice: (sp: ShopProduct, price: number) => void;
}

export const MyProductsPage: FC<MyProductsPageProps> = ({ shopProducts, onRemove, onUpdatePrice }) => {
  const [editTarget,   setEditTarget]   = useState<ShopProduct | null>(null);
  const [newPrice,     setNewPrice]     = useState("");
  const [priceError,   setPriceError]   = useState("");
  const [removeTarget, setRemoveTarget] = useState<ShopProduct | null>(null);
  const [toast, showToast]              = useToast();

  const handleUpdatePrice = (): void => {
    const p = Number(newPrice);
    if (!newPrice || isNaN(p) || p < editTarget!.minPrice) {
      setPriceError(`ราคาต้อง ≥ ฿${editTarget!.minPrice.toLocaleString()}`);
      return;
    }
    onUpdatePrice(editTarget!, p);
    showToast("success", "อัปเดตราคาแล้ว");
    setEditTarget(null);
  };

  return (
    <div>
      <PageHeader title="สินค้าในร้านของฉัน"/>
      {toast}

      {shopProducts.length === 0
        ? <EmptyState icon="🏪" message="ยังไม่มีสินค้าในร้าน — ไปเลือกสินค้าจาก Catalog" />
        : (
          <Table headers={["รูป","ชื่อสินค้า","ราคาทุน","ขั้นต่ำ","ราคาขาย","กำไร/ชิ้น","สต็อก","จัดการ"]}>
            {shopProducts.map(sp => (
              <Tr key={sp.id}>
                <Td>
                  <div style={{ width: 42, height: 42, borderRadius: 7, background: T.surface2, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📦</div>
                </Td>
                <Td style={{ fontWeight: 600 }}>{sp.name}</Td>
                <Td style={{ color: T.yellow, fontWeight: 600 }}>฿{sp.cost.toLocaleString()}</Td>
                <Td style={{ color: T.red,    fontWeight: 600 }}>฿{sp.minPrice.toLocaleString()}</Td>
                <Td style={{ color: T.accent, fontWeight: 700 }}>฿{sp.sellingPrice.toLocaleString()}</Td>
                <Td style={{ color: T.green,  fontWeight: 700 }}>฿{(sp.sellingPrice - sp.cost).toLocaleString()}</Td>
                <Td>
                  <span style={{ color: sp.stock > 0 ? T.green : T.red, fontWeight: 600 }}>
                    {sp.stock > 0 ? sp.stock : "หมด"}
                  </span>
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="info"   size="sm" onClick={() => { setEditTarget(sp); setNewPrice(String(sp.sellingPrice)); setPriceError(""); }}>✏️ ราคา</Btn>
                    <Btn variant="danger" size="sm" onClick={() => setRemoveTarget(sp)}>✕ เอาออก</Btn>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )
      }

      {/* Edit price modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`แก้ไขราคา — ${editTarget?.name}`} width={380}>
        {editTarget && (
          <div>
            <Alert type="info" message={`ราคาขั้นต่ำ: ฿${editTarget.minPrice.toLocaleString()} | ราคาทุน: ฿${editTarget.cost.toLocaleString()}`} />
            <FieldWrap label="ราคาขายใหม่ (บาท)" required error={priceError}>
              <Inp type="number" value={newPrice} onChange={e => { setNewPrice(e.target.value); setPriceError(""); }} error={priceError} autoFocus />
              {Number(newPrice) >= editTarget.minPrice && (
                <p style={{ color: T.green, fontSize: 12, margin: "4px 0 0", ...F }}>
                  กำไร: ฿{(Number(newPrice) - editTarget.cost).toLocaleString()} / ชิ้น
                </p>
              )}
            </FieldWrap>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost"   onClick={() => setEditTarget(null)}>ยกเลิก</Btn>
              <Btn variant="primary" onClick={handleUpdatePrice}>💾 บันทึก</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Remove confirm modal */}
      <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)} title="ยืนยันเอาสินค้าออก" width={380}>
        <p style={{ color: T.muted, ...F, marginTop: 0 }}>
          เอา <strong style={{ color: T.text }}>"{removeTarget?.name}"</strong> ออกจากร้านของคุณ?
          <br /><span style={{ fontSize: 12, color: T.dim }}>สินค้าจะยังอยู่ใน Catalog สามารถเพิ่มกลับได้</span>
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost"  onClick={() => setRemoveTarget(null)}>ยกเลิก</Btn>
          <Btn variant="danger" onClick={() => { onRemove(removeTarget!.id); showToast("success", `เอา "${removeTarget!.name}" ออกแล้ว`); setRemoveTarget(null); }}>
            ✕ เอาออก
          </Btn>
        </div>
      </Modal>
    </div>
  );
};
