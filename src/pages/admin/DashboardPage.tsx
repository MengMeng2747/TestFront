// ─── pages/admin/DashboardPage.tsx ────────────────────────────────────────────
import type { FC } from "react";
import { StatCard, PageHeader } from "../../components/Layout";
import { Table, Tr, Td }       from "../../components/Table";
import { StatusBadge }         from "../../components/StatusBadge";
import { T, F }                from "../../styles/tokens";
import type { Product, Order } from "../../types";

interface DashboardPageProps {
  products:  Product[];
  resellers: Reseller[];
  orders:    Order[];
}

// ── Reseller type re-export alias (Admin uses ResellerUser as "Reseller")
type Reseller = import("../../types").ResellerUser;

export const DashboardPage: FC<DashboardPageProps> = ({ products, resellers, orders }) => {
  const done         = orders.filter(o => ["shipped","completed"].includes(o.status));
  const totalProducts = products.length;
  const totalSale    = done.reduce((s, o) => s + o.totalSale, 0);
  const totalProfit  = done.reduce((s, o) => s + o.totalProfit, 0);
  const pendingOrd   = orders.filter(o => o.status === "pending").length;
  const approvedRes  = resellers.filter(r => r.status === "approved").length;
  const pendingRes   = resellers.filter(r => r.status === "pending").length;
  const recent       = [...orders].sort((a,b) => new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,5);

  return (
    <div>
      <PageHeader title="Dashboard"/>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="ยอดขายรวม"         value={`฿${totalSale.toLocaleString()}`}   sub="shipped+completed"  accent={T.green}  icon="📈" />
        <StatCard label="สินค้าทั้งหมด"      value={totalProducts}                      sub="ในระบบ"               accent={T.accent} icon="🛍️" />
        <StatCard label="กำไรจ่ายตัวแทน"    value={`฿${totalProfit.toLocaleString()}`}  sub="บวก Wallet แล้ว"   accent={T.orange} icon="💰" />
        <StatCard label="ออเดอร์ทั้งหมด"    value={orders.length}                       sub={`รอ ${pendingOrd} รายการ`} accent={T.yellow} icon="📦" />
        <StatCard label="รอดำเนินการ"        value={pendingOrd}                          sub="ยังไม่จัดส่ง"       accent={T.red}    icon="⏳" />
        <StatCard label="ตัวแทนอนุมัติแล้ว" value={approvedRes}                         sub="Login ได้"          accent={T.accent} icon="👥" />
        <StatCard label="ตัวแทนรออนุมัติ"   value={pendingRes}                          sub="รอตรวจสอบ"          accent={T.purple} icon="⚠️" />
      </div>

      <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 14, ...F }}>ออเดอร์ล่าสุด</h3>
      <Table headers={["เลขออเดอร์","ร้านตัวแทน","สินค้า / จำนวน","ยอดขาย","กำไร","สถานะ"]}>
        {recent.map(o => {
          const isDone = ["shipped","completed"].includes(o.status);
          return (
            <Tr key={o.id}>
              <Td style={{ color: T.accent, fontWeight: 600, fontSize: 12 }}>{o.id}</Td>
              <Td>{o.shopName}</Td>
              <Td style={{ color: T.muted }}>{o.product} ×{o.qty}</Td>
              <Td style={{ color: T.green, fontWeight: 700 }}>฿{o.totalSale.toLocaleString()}</Td>
              <Td style={{ color: isDone ? T.orange : T.dim }}>{isDone ? `฿${o.totalProfit.toLocaleString()}` : "—"}</Td>
              <Td><StatusBadge status={o.status} /></Td>
            </Tr>
          );
        })}
      </Table>
    </div>
  );
};
