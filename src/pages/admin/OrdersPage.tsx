// ─── pages/admin/OrdersPage.tsx ───────────────────────────────────────────────
// BR-10: Admin กด "จัดส่งแล้ว" → บวกกำไรเข้า Wallet ตัวแทน
// BR-11: กำไร = (ราคาขาย − ราคาทุน) × จำนวน
import { useState } from "react";
import type { FC } from "react";
import { PageHeader, EmptyState } from "../../components/Layout";
import { Table, Tr, Td }          from "../../components/Table";
import { Btn }                    from "../../components/Btn";
import { Modal }                  from "../../components/Modal";
import { StatusBadge }            from "../../components/StatusBadge";
import { useToast }               from "../../hooks/useToast";
import { T, F }                   from "../../styles/tokens";
import type { Order, OrderStatus, WalletEntry } from "../../types";

type FilterId = "all" | OrderStatus;

const PAGE_SIZE = 15;

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "shipped",
  shipped: "completed",
};

interface OrdersPageProps {
  orders:    Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export const OrdersPage: FC<OrdersPageProps> = ({ orders, setOrders }) => {
  const [filter,  setFilter]  = useState<FilterId>("all");
  const [page,    setPage]    = useState(1);
  const [detail,  setDetail]  = useState<Order | null>(null);
  const [wallet,  setWallet]  = useState<WalletEntry[]>([]);
  const [toast, showToast]    = useToast();

  // BR-10 + BR-11
  const advance = (o: Order): void => {
    const next = STATUS_NEXT[o.status];
    if (!next) return;
    const profit = o.totalSale - o.cost * o.qty; // BR-11
    setOrders(os => os.map(x => x.id === o.id ? { ...x, status: next } : x));
    if (next === "shipped") {
      setWallet(l => [...l, { id: Date.now(), orderId: o.id, shop: o.shopName, profit, at: new Date().toLocaleTimeString("th-TH") }]);
      showToast("success", `บวกกำไร ฿${profit.toLocaleString()} เข้า Wallet "${o.shopName}" (BR-10/11)`);
    } else {
      showToast("success", `ออเดอร์ ${o.id} เสร็จสมบูรณ์`);
    }
  };

  const tabs = [
    { id: "all",       label: "ทั้งหมด",      count: orders.length },
    { id: "pending",   label: "รอดำเนินการ",  count: orders.filter(o => o.status === "pending").length },
    { id: "shipped",   label: "จัดส่งแล้ว",   count: orders.filter(o => o.status === "shipped").length },
    { id: "completed", label: "เสร็จสมบูรณ์", count: orders.filter(o => o.status === "completed").length },
  ];

  // เรียงล่าสุด → เก่าสุด
  const filtered = (filter === "all" ? orders : orders.filter(o => o.status === filter))
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const rows       = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = (f: FilterId) => { setFilter(f); setPage(1); };

  const fmt = (d: string) => new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });

  // ── Export CSV ────────────────────────────────────────────
  const exportCSV = (): void => {
    const headers = ["เลขออเดอร์","ร้านตัวแทน","ลูกค้า","ยอดขาย","กำไร","สถานะ","วันที่"];
    const rows = orders.map(o => [
      o.id,
      o.shopName,
      o.customer,
      o.totalSale,
      o.totalProfit,
      o.status,
      (() => { const d = new Date(o.date); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") + " " + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0"); })(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", `Export สำเร็จ ${orders.length} รายการ`);
  };

  return (
    <div>
      <PageHeader
        title="จัดการออเดอร์"
        action={
          <Btn variant="info" icon="📥" onClick={exportCSV}>
            Export CSV
          </Btn>
        }
      />
      {toast}

      {/* Status flow */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ color: T.muted, fontSize: 12, fontWeight: 700, ...F }}>Flow:</span>
        {(["pending","shipped","completed"] as OrderStatus[]).map((s, i) => (
          <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={s} />{i < 2 && <span style={{ color: T.dim }}>→</span>}
          </span>
        ))}
        <span style={{ color: T.dim, fontSize: 11, ...F, marginLeft: 8 }}></span>
      </div>

      {/* Wallet log */}
      {wallet.length > 0 && (
        <div style={{ background: "rgba(63,185,80,.08)", border: "1px solid rgba(63,185,80,.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ color: T.green, fontWeight: 700, fontSize: 12, marginBottom: 6, ...F }}>💰 Wallet Log (session นี้)</div>
          {[...wallet].reverse().slice(0, 3).map(w => (
            <div key={w.id} style={{ color: T.muted, fontSize: 12, ...F }}>[{w.at}] {w.shop} ← +฿{w.profit.toLocaleString()} ({w.orderId})</div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => {
          const active = filter === t.id;
          return (
            <button key={t.id} onClick={() => handleFilterChange(t.id as FilterId)}
              style={{ padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 13, ...F, fontWeight: active ? 700 : 400, border: "none", background: active ? T.accent : T.surface, color: active ? "#0d1117" : T.muted, outline: active ? "none" : `1px solid ${T.border}` }}>
              {t.label} <span style={{ opacity: .7, fontSize: 11, marginLeft: 4 }}>({t.count})</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? <EmptyState icon="🛒" message="ไม่มีออเดอร์" /> : (
        <>
          <Table headers={["เลขออเดอร์","ร้านตัวแทน","ลูกค้า","ยอดขาย","กำไร","วันที่","สถานะ","จัดการ"]}>
            {rows.map(o => {
              const profit = o.totalSale - o.cost * o.qty;
              const isDone = ["shipped","completed"].includes(o.status);
              return (
                <Tr key={o.id}>
                  <Td>
                    <button onClick={() => setDetail(o)} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontWeight: 700, fontSize: 12, padding: 0, ...F, textDecoration: "underline" }}>
                      {o.id}
                    </button>
                  </Td>
                  <Td style={{ fontWeight: 600, color: T.text }}>{o.shopName || "—"}</Td>
                  <Td style={{ color: T.muted }}>{o.customer}</Td>
                  <Td style={{ color: T.green,  fontWeight: 700 }}>฿{o.totalSale.toLocaleString()}</Td>
                  <Td style={{ color: isDone ? T.orange : T.dim, fontWeight: isDone ? 700 : 400 }}>
                    {isDone ? `฿${profit.toLocaleString()}` : "—"}
                  </Td>
                  <Td style={{ color: T.dim, fontSize: 12 }}>{fmt(o.date)}</Td>
                  <Td><StatusBadge status={o.status} /></Td>
                  <Td>
                    {o.status === "pending"   && <Btn variant="info"    size="sm" onClick={() => advance(o)}>📦 จัดส่งแล้ว</Btn>}
                    {o.status === "shipped"   && <Btn variant="success" size="sm" onClick={() => advance(o)}>✓ เสร็จสมบูรณ์</Btn>}
                    {o.status === "completed" && <span style={{ color: T.dim, fontSize: 12, ...F }}>เสร็จสิ้น</span>}
                  </Td>
                </Tr>
              );
            })}
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, flexWrap: "wrap", gap: 10 }}>
              <span style={{ color: T.muted, fontSize: 12, ...F }}>
                แสดง {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
              </span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: safePage === 1 ? T.surface2 : T.surface, color: safePage === 1 ? T.dim : T.muted, cursor: safePage === 1 ? "not-allowed" : "pointer", fontSize: 13, ...F }}>
                  ← ก่อนหน้า
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 34, height: 34, borderRadius: 7, border: "none", background: p === safePage ? T.accent : T.surface, color: p === safePage ? "#0d1117" : T.muted, cursor: "pointer", fontWeight: p === safePage ? 700 : 400, fontSize: 13, outline: p === safePage ? "none" : `1px solid ${T.border}` }}>
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: safePage === totalPages ? T.surface2 : T.surface, color: safePage === totalPages ? T.dim : T.muted, cursor: safePage === totalPages ? "not-allowed" : "pointer", fontSize: 13, ...F }}>
                  ถัดไป →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`รายละเอียดออเดอร์ — ${detail?.id ?? ""}`}>
        {detail && (
          <div>
            {([
              ["เลขออเดอร์",  detail.id],
              ["ร้านตัวแทน",  detail.shopName || "—"],
              ["ลูกค้า",      detail.customer],
              ["วันที่สั่ง",  new Date(detail.date).toLocaleString("th-TH")],
            ] as [string,string][]).map(([k,v]) => (
              <div key={k} style={{ display: "flex", padding: "9px 0", borderBottom: `1px solid ${T.border2}`, gap: 12 }}>
                <span style={{ color: T.muted, fontSize: 12, width: 110, flexShrink: 0, ...F }}>{k}</span>
                <span style={{ color: T.text,  fontSize: 13, ...F }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", padding: "9px 0", borderBottom: `1px solid ${T.border2}`, gap: 12 }}>
              <span style={{ color: T.muted, fontSize: 12, width: 110, flexShrink: 0, ...F }}>สถานะ</span>
              <StatusBadge status={detail.status} />
            </div>

            {/* ✅ รายการสินค้าทุกชิ้น */}
            <div style={{ marginTop: 14 }}>
              <div style={{ color: T.muted, fontSize: 12, fontWeight: 700, marginBottom: 8, ...F }}>รายการสินค้า</div>
              {detail.items && detail.items.length > 0 ? (
                detail.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: T.surface2, borderRadius: 7, marginBottom: 6 }}>
                    <span style={{ color: T.text, fontSize: 13, ...F }}>{item.productName} × {item.qty}</span>
                    <span style={{ color: T.green, fontWeight: 700, fontSize: 13, ...F }}>
                      ฿{(item.sellingPrice * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: T.muted, fontSize: 12, ...F }}>ไม่มีข้อมูลสินค้า</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
                <span style={{ color: T.muted, fontSize: 13, ...F }}>ยอดรวม</span>
                <span style={{ color: T.green, fontWeight: 700, fontSize: 15, ...F }}>฿{detail.totalSale.toLocaleString()} บาท</span>
              </div>
            </div>

            {/* กำไร */}
            <div style={{ background: "rgba(240,136,62,.1)", border: "1px solid rgba(240,136,62,.25)", borderRadius: 8, padding: "12px 14px", marginTop: 10 }}>
              <div style={{ color: T.orange, fontSize: 12, fontWeight: 700, marginBottom: 4, ...F }}>💰 กำไรตัวแทน</div>
              <div style={{ color: T.orange, fontSize: 20, fontWeight: 700, ...F }}>
                ฿{detail.totalProfit.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};