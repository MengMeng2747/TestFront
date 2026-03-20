// ─── pages/reseller/OrdersPage.tsx ────────────────────────────────────────────
import { useState } from "react";
import type { FC } from "react";
import { PageHeader, EmptyState } from "../../components/Layout";
import { Table, Tr, Td }          from "../../components/Table";
import { Modal }                  from "../../components/Modal";
import { Alert }                  from "../../components/Alert";
import { StatusBadge }            from "../../components/StatusBadge";
import { T, F }                   from "../../styles/tokens";
import type { ResellerUser, Order, OrderStatus } from "../../types";

type FilterId = "all" | OrderStatus;

interface OrdersPageProps {
  user:   ResellerUser;
  orders: Order[];
}

export const OrdersPage: FC<OrdersPageProps> = ({ user, orders }) => {
  const [detail, setDetail] = useState<Order | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");

  const myOrders = orders.filter(o => o.resellerId === user.id);
  const rows     = filter === "all" ? myOrders : myOrders.filter(o => o.status === filter);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const tabs = [
    { id: "all",       label: "ทั้งหมด",      count: myOrders.length },
    { id: "pending",   label: "รอจัดส่ง",     count: myOrders.filter(o => o.status === "pending").length },
    { id: "shipped",   label: "จัดส่งแล้ว",   count: myOrders.filter(o => o.status === "shipped").length },
    { id: "completed", label: "เสร็จสมบูรณ์", count: myOrders.filter(o => o.status === "completed").length },
  ];

  return (
    <div>
      <PageHeader title="ออเดอร์ร้านของฉัน"/>
      <Alert type="info" message="คุณเห็นเฉพาะออเดอร์จากร้านของตัวเองเท่านั้น ไม่เห็นออเดอร์ร้านอื่น" />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => {
          const active = filter === t.id;
          return (
            <button key={t.id} onClick={() => setFilter(t.id as FilterId)}
              style={{ padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 13, ...F, fontWeight: active ? 700 : 400, border: "none", background: active ? T.accent : T.surface, color: active ? "#0d1117" : T.muted, outline: active ? "none" : `1px solid ${T.border}` }}>
              {t.label} <span style={{ opacity: .7, fontSize: 11 }}>({t.count})</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? <EmptyState icon="🛒" message="ไม่มีออเดอร์" /> : (
        <Table headers={["เลขออเดอร์","ลูกค้า","สินค้า","ยอดขาย","กำไรของฉัน","วันที่","สถานะ"]}>
          {rows.map(o => {
            const isDone = ["shipped","completed"].includes(o.status);
            return (
              <Tr key={o.id}>
                <Td>
                  <button onClick={() => setDetail(o)} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontWeight: 700, fontSize: 12, padding: 0, ...F, textDecoration: "underline" }}>
                    {o.id}
                  </button>
                </Td>
                <Td style={{ fontWeight: 600 }}>{o.customer}</Td>
                <Td style={{ color: T.muted, fontSize: 12 }}>
                  {o.items.map(i => `${i.productName} ×${i.qty}`).join(", ")}
                </Td>
                <Td style={{ color: T.green,  fontWeight: 700 }}>฿{o.totalSale.toLocaleString()}</Td>
                <Td style={{ color: isDone ? T.orange : T.dim, fontWeight: isDone ? 700 : 400 }}>
                  {isDone ? `฿${o.totalProfit.toLocaleString()}` : "รอจัดส่ง"}
                </Td>
                <Td style={{ color: T.dim, fontSize: 12 }}>{fmt(o.date)}</Td>
                <Td><StatusBadge status={o.status} /></Td>
              </Tr>
            );
          })}
        </Table>
      )}

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`รายละเอียด — ${detail?.id ?? ""}`} width={500}>
        {detail && (
          <div>
            {([
              ["เลขออเดอร์",   detail.id],
              ["ลูกค้า",       detail.customer],
              ["เบอร์โทร",     detail.phone],
              ["ที่อยู่จัดส่ง", detail.address],
              ["วันที่สั่ง",   new Date(detail.date).toLocaleString("th-TH")],
            ] as [string,string][]).map(([k,v]) => (
              <div key={k} style={{ display: "flex", padding: "9px 0", borderBottom: `1px solid ${T.border2}`, gap: 12 }}>
                <span style={{ color: T.muted, fontSize: 12, width: 110, flexShrink: 0, ...F }}>{k}</span>
                <span style={{ color: T.text,  fontSize: 13, ...F }}>{v}</span>
              </div>
            ))}
            <div style={{ padding: "9px 0", borderBottom: `1px solid ${T.border2}` }}>
              <span style={{ color: T.muted, fontSize: 12, ...F }}>สถานะ</span>
              <div style={{ marginTop: 6 }}><StatusBadge status={detail.status} /></div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ color: T.muted, fontSize: 12, fontWeight: 700, marginBottom: 8, ...F }}>รายการสินค้า</div>
              {detail.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: T.surface2, borderRadius: 7, marginBottom: 6 }}>
                  <span style={{ color: T.text, fontSize: 13, ...F }}>{item.productName} ×{item.qty}</span>
                  <span style={{ color: T.green, fontWeight: 700, fontSize: 13, ...F }}>฿{(item.sellingPrice * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: `1px solid ${T.border}`, marginTop: 8 }}>
              <span style={{ color: T.muted, fontSize: 13, ...F }}>กำไรของฉัน</span>
              <span style={{ color: T.orange, fontWeight: 700, fontSize: 16, ...F }}>฿{detail.totalProfit.toLocaleString()}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
