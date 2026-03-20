// ─── pages/reseller/WalletPage.tsx ────────────────────────────────────────────
// BR-22: Admin จัดส่งแล้ว → บวกกำไรเข้า Wallet อัตโนมัติ
// BR-23: กำไร = (ราคาขาย − ราคาทุน) × จำนวน
import type { FC } from "react";
import { PageHeader, EmptyState } from "../../components/Layout";
import { Table, Tr, Td }          from "../../components/Table";
import { T, F }                   from "../../styles/tokens";
import type { WalletEntry }       from "../../types";

interface WalletPageProps {
  walletEntries: WalletEntry[];
}

export const WalletPage: FC<WalletPageProps> = ({ walletEntries }) => {
  const balance = walletEntries.reduce((s, w) => s + w.profit, 0);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <PageHeader title="Wallet กำไรสะสม"/>

      {/* Balance card */}
      <div style={{ background: `linear-gradient(135deg,rgba(63,185,80,.15),rgba(57,211,83,.05))`, border: "1px solid rgba(63,185,80,.3)", borderRadius: 14, padding: "28px 32px", marginBottom: 24, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -10, top: -10, fontSize: 100, opacity: .06 }}>💰</div>
        <div style={{ color: T.green, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", ...F, marginBottom: 8 }}>ยอดกำไรสะสม</div>
        <div style={{ color: T.green, fontSize: 48, fontWeight: 700, ...F }}>฿{balance.toLocaleString()}</div>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 8, ...F }}>ระบบจำลอง<br/> 
          กำไร = (ราคาขาย − ราคาทุน) × จำนวน ต่อ จำนวนสินค้า
        </div>
        <div style={{ display: "inline-block", marginTop: 12, background: "rgba(63,185,80,.12)", border: "1px solid rgba(63,185,80,.25)", borderRadius: 6, padding: "4px 12px", fontSize: 12, color: T.green, ...F }}>
          รวม {walletEntries.length} รายการ
        </div>
      </div>

      {/* Business rules
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
        <div style={{ color: T.muted, fontSize: 12, fontWeight: 700, marginBottom: 8, ...F }}>📋 Business Rules</div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          <div style={{ color: T.dim, fontSize: 12, ...F }}>
            <span style={{ color: T.yellow }}>BR-22:</span> Admin เปลี่ยนออเดอร์เป็น "จัดส่งแล้ว" → ระบบคำนวณกำไรบวกเข้า Wallet อัตโนมัติ
          </div>
          <div style={{ color: T.dim, fontSize: 12, ...F }}>
            <span style={{ color: T.yellow }}>BR-23:</span> กำไร = (ราคาขาย − ราคาทุน) × จำนวน ต่อ item
          </div>
        </div>
      </div> */}

      {/* History */}
      <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 14, ...F }}>ประวัติรายได้</h3>
      {walletEntries.length === 0
        ? <EmptyState icon="💸" message="ยังไม่มีรายการกำไร" />
        : (
          <Table headers={["เลขออเดอร์","กำไรที่ได้รับ","วันที่"]}>
            {[...walletEntries].reverse().map(w => (
              <Tr key={w.id}>
                <Td style={{ color: T.accent, fontWeight: 600, fontSize: 12 }}>{w.orderId}</Td>
                <Td style={{ color: T.green, fontWeight: 700, fontSize: 16 }}>+฿{w.profit.toLocaleString()}</Td>
                <Td style={{ color: T.dim,   fontSize: 12 }}>{fmt(w.at)}</Td>
              </Tr>
            ))}
          </Table>
        )
      }
    </div>
  );
};