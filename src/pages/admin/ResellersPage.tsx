// ─── pages/admin/ResellersPage.tsx ────────────────────────────────────────────
// BR-08: อนุมัติ → status=approved, Login ได้ทันที
// BR-09: ปฏิเสธ → status=rejected, Login ไม่ได้
import { useState } from "react";
import type { FC } from "react";
import { PageHeader, EmptyState } from "../../components/Layout";
import { Table, Tr, Td }          from "../../components/Table";
import { Btn }                    from "../../components/Btn";
import { StatusBadge }            from "../../components/StatusBadge";
import { useToast }               from "../../hooks/useToast";
import { T, F }                   from "../../styles/tokens";
import type { ResellerUser, ResellerStatus } from "../../types";

type TabId = "all" | ResellerStatus;

const TABS: { id: TabId; label: string }[] = [
  { id: "all",      label: "ทั้งหมด"    },
  { id: "pending",  label: "รออนุมัติ"  },
  { id: "approved", label: "อนุมัติแล้ว"},
  { id: "rejected", label: "ปฏิเสธแล้ว"},
];

interface ResellersPageProps {
  resellers:    ResellerUser[];
  setResellers: React.Dispatch<React.SetStateAction<ResellerUser[]>>;
}

export const ResellersPage: FC<ResellersPageProps> = ({ resellers, setResellers }) => {
  const [tab, setTab]      = useState<TabId>("all");
  const [toast, showToast] = useToast();

  // BR-08
  const approve = (id: number): void => {
    setResellers(rs => rs.map(r => r.id === id ? { ...r, status: "approved" as ResellerStatus } : r));
    showToast("success", "อนุมัติแล้ว — ตัวแทน Login ได้ทันที");
  };

  // BR-09
  const reject = (id: number): void => {
    setResellers(rs => rs.map(r => r.id === id ? { ...r, status: "rejected" as ResellerStatus } : r));
    showToast("warning", "ปฏิเสธแล้ว — ตัวแทน Login ไม่ได้");
  };

  const countOf = (s: ResellerStatus) => resellers.filter(r => r.status === s).length;

  const filtered = tab === "all" ? resellers : resellers.filter(r => r.status === tab);
  const sorted   = [...filtered].sort((a, b) => b.id - a.id);

  return (
    <div>
      <PageHeader title="จัดการตัวแทน"/>
      {toast}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => {
          const count  = t.id === "all" ? resellers.length : countOf(t.id as ResellerStatus);
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 13, ...F, fontWeight: active ? 700 : 400, border: "none", background: active ? T.accent : T.surface, color: active ? "#0d1117" : T.muted, outline: active ? "none" : `1px solid ${T.border}` }}>
              {t.label} <span style={{ opacity: .7, fontSize: 11, marginLeft: 4 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? <EmptyState icon="👥" message="ไม่มีตัวแทนในหมวดนี้" /> : (
        <Table headers={["ชื่อ-นามสกุล","อีเมล","ชื่อร้าน","เบอร์โทร","วันที่สมัคร","สถานะ","จัดการ"]}>
          {sorted.map(r => (
            <Tr key={r.id}>
              <Td style={{ fontWeight: 600 }}>{r.name}</Td>
              <Td style={{ color: T.muted, fontSize: 12 }}>{r.email}</Td>
              <Td style={{ fontWeight: 600, color: T.accent }}>{r.shopName || "—"}</Td>
              <Td style={{ color: T.muted, fontSize: 12 }}>{r.phone}</Td>
              <Td style={{ color: T.dim,   fontSize: 12 }}>
                {(r as any).createdAt
                  ? new Date((r as any).createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "—"}
              </Td>
              <Td><StatusBadge status={r.status} /></Td>
              <Td>
                <div style={{ display: "flex", gap: 6 }}>
                  {r.status === "pending"  && (<><Btn variant="success" size="sm" onClick={() => approve(r.id)}>✓ อนุมัติ</Btn><Btn variant="danger" size="sm" onClick={() => reject(r.id)}>✕ ปฏิเสธ</Btn></>)}
                  {r.status === "approved" && <Btn variant="danger"  size="sm" onClick={() => reject(r.id)}>ยกเลิกสิทธิ์</Btn>}
                  {r.status === "rejected" && <Btn variant="success" size="sm" onClick={() => approve(r.id)}>อนุมัติใหม่</Btn>}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
};