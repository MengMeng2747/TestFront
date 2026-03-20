// ─── pages/reseller/DashboardPage.tsx ─────────────────────────────────────────
import { FC, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard, PageHeader, EmptyState } from "../../components/Layout";
import { Table, Tr, Td }                   from "../../components/Table";
import { Btn }                             from "../../components/Btn";
import { StatusBadge }                     from "../../components/StatusBadge";
import { T, F }                            from "../../styles/tokens";
import type { ResellerUser, ShopProduct, Order, WalletEntry } from "../../types";

interface DashboardPageProps {
  user:          ResellerUser;
  shopProducts:  ShopProduct[];
  orders:        Order[];
  walletEntries: WalletEntry[];
  chart?:        ReactNode; // ✅ รับ chart จาก App.tsx
}

export const DashboardPage: FC<DashboardPageProps> = ({ user, shopProducts, orders, walletEntries, chart }) => {
  const navigate     = useNavigate();
  const myOrders     = orders.filter(o => o.resellerId === user.id);
  const totalProfit  = walletEntries.filter(w => myOrders.some(o => o.id === w.orderId)).reduce((s, w) => s + w.profit, 0);
  const totalSale    = myOrders.filter(o => ["shipped","completed"].includes(o.status)).reduce((s, o) => s + o.totalSale, 0);
  const pendingCount = myOrders.filter(o => o.status === "pending").length;
  const shopUrl      = `/shop/${user.shopSlug}`;

  return (
    <div>
      <PageHeader title="Dashboard"/>

      {/* Shop link card */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", ...F, marginBottom: 4 }}>ลิงก์ร้านของคุณ</div>
          <div style={{ color: T.accent, fontSize: 15, fontWeight: 700, ...F }}>{shopUrl}</div>
        </div>
        <Btn variant="primary" icon="🌐" onClick={() => navigate(shopUrl)}>
          เข้าดูหน้าร้าน
        </Btn>
        <Btn variant="info" icon="📋" onClick={() => navigator.clipboard?.writeText(window.location.origin + shopUrl)}>
          คัดลอกลิงก์
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="กำไรสะสม (Wallet)" value={`฿${totalProfit.toLocaleString()}`} sub="รวมทุกออเดอร์"      accent={T.green}  icon="💰" />
        <StatCard label="ยอดขายรวม"         value={`฿${totalSale.toLocaleString()}`}    sub="shipped+completed" accent={T.orange} icon="📈" />
        <StatCard label="ออเดอร์รอจัดส่ง"   value={pendingCount}                        sub="รอ Admin"          accent={T.yellow} icon="⏳" />
        <StatCard label="สินค้าในร้าน"       value={shopProducts.length}                 sub="รายการที่เปิดขาย"  accent={T.accent} icon="📦" />
      </div>

      {/* ✅ แสดงกราฟที่ส่งมาจาก App.tsx */}
      {chart}

      <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 14, ...F }}>ออเดอร์ล่าสุด</h3>
      {myOrders.length === 0
        ? <EmptyState icon="🛒" message="ยังไม่มีออเดอร์" />
        : (
          <Table headers={["เลขออเดอร์","ลูกค้า","ยอดขาย","กำไร","สถานะ"]}>
            {[...myOrders]
              .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0,5)
              .map(o => {
                const isDone = ["shipped","completed"].includes(o.status);
                return (
                  <Tr key={o.id}>
                    <Td style={{ color: T.accent, fontWeight: 600, fontSize: 12 }}>{o.id}</Td>
                    <Td>{o.customer}</Td>
                    <Td style={{ color: T.green,  fontWeight: 700 }}>฿{o.totalSale.toLocaleString()}</Td>
                    <Td style={{ color: isDone ? T.orange : T.dim }}>
                      {isDone ? `฿${o.totalProfit.toLocaleString()}` : "—"}
                    </Td>
                    <Td><StatusBadge status={o.status} /></Td>
                  </Tr>
                );
              })}
          </Table>
        )
      }
    </div>
  );
};