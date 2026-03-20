// ─── pages/admin/ProductsPage.tsx ─────────────────────────────────────────────
// BR-05: ไม่มีออเดอร์ค้าง → ลบได้   BR-06: มีออเดอร์ค้าง → ลบไม่ได้
import { useState } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, EmptyState } from "../../components/Layout";
import { Table, Tr, Td }          from "../../components/Table";
import { Btn }                    from "../../components/Btn";
import { Modal }                  from "../../components/Modal";
import { useToast }               from "../../hooks/useToast";
import { T, F }                   from "../../styles/tokens";
import type { Product, Order }    from "../../types";

interface ProductsPageProps {
  products:    Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders:      Order[];
}

export const ProductsPage: FC<ProductsPageProps> = ({ products, setProducts, orders }) => {
  const navigate                        = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [search,       setSearch]       = useState("");
  const [toast, showToast]              = useToast();

  const tryDelete = (p: Product) => {
    const blocking = orders.filter(o => o.productId === p.id && o.status !== "completed");
    if (blocking.length) { showToast("error", `ลบไม่ได้ — มีออเดอร์ค้าง ${blocking.length} รายการ (BR-06)`); return; }
    setDeleteTarget(p);
  };

  const doDelete = () => {
    if (!deleteTarget) return;
    setProducts(ps => ps.filter(p => p.id !== deleteTarget.id));
    showToast("success", `ลบ "${deleteTarget.name}" แล้ว`);
    setDeleteTarget(null);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="จัดการสินค้า"
        action={<Btn variant="primary" icon="＋" onClick={() => navigate("/admin/products/add")}>เพิ่มสินค้า</Btn>}
      />
      {toast}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหาสินค้า..."
          style={{ padding:"8px 14px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:13, ...F, width:260, outline:"none" }} />
      </div>
      {filtered.length === 0 ? <EmptyState icon="📦" message="ไม่พบสินค้า" /> : (
        <Table headers={["#","รูป","ชื่อสินค้า","ราคาทุน","ราคาขั้นต่ำ","กำไรขั้นต่ำ","สต็อก","จัดการ"]}>
          {filtered.map((p,i) => (
            <Tr key={p.id}>
              <Td style={{ color:T.dim }}>{i+1}</Td>
              <Td>
                {p.imagePreview
                  ? <img src={p.imagePreview} alt={p.name} style={{ width:42, height:42, borderRadius:7, objectFit:"cover", border:`1px solid ${T.border}` }} />
                  : <div style={{ width:42, height:42, borderRadius:7, background:T.surface2, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📦</div>
                }
              </Td>
              <Td>
                <div style={{ fontWeight:600 }}>{p.name}</div>
                {p.description && <div style={{ color:T.muted, fontSize:11, maxWidth:180, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.description}</div>}
              </Td>
              <Td style={{ color:T.yellow, fontWeight:600 }}>฿{p.cost.toLocaleString()}</Td>
              <Td style={{ color:T.green,  fontWeight:600 }}>฿{p.minPrice.toLocaleString()}</Td>
              <Td style={{ color:T.orange, fontWeight:600 }}>฿{(p.minPrice-p.cost).toLocaleString()}</Td>
              <Td><span style={{ color:p.stock>0?T.green:T.red, fontWeight:600 }}>{p.stock>0?p.stock:"หมด"}</span></Td>
              <Td>
                <div style={{ display:"flex", gap:6 }}>
                  <Btn variant="info"   size="sm" onClick={() => navigate(`/admin/products/edit/${p.id}`)}>✏️ แก้ไข</Btn>
                  <Btn variant="danger" size="sm" onClick={() => tryDelete(p)}>🗑 ลบ</Btn>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="ยืนยันการลบสินค้า" width={400}>
        <p style={{ color:T.muted, ...F, marginTop:0 }}>
          ลบ <strong style={{ color:T.text }}>"{deleteTarget?.name}"</strong>?<br />
          <span style={{ color:T.green, fontSize:12 }}>✓ ไม่มีออเดอร์ค้าง</span>
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn variant="ghost"  onClick={() => setDeleteTarget(null)}>ยกเลิก</Btn>
          <Btn variant="danger" onClick={doDelete}>🗑 ยืนยันลบ</Btn>
        </div>
      </Modal>
    </div>
  );
};