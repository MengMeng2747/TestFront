// ─── components/StatusBadge.tsx ───────────────────────────────────────────────
import type { FC } from "react";
import { T, F } from "../styles/tokens";

const map: Record<string, { label: string; bg: string; color: string; bd: string }> = {
  pending:   { label: "รออนุมัติ",    bg: "rgba(210,153,34,.15)", color: T.yellow, bd: "rgba(210,153,34,.4)"   },
  approved:  { label: "อนุมัติแล้ว",  bg: "rgba(63,185,80,.12)",  color: T.green,  bd: "rgba(63,185,80,.35)"   },
  rejected:  { label: "ปฏิเสธแล้ว",  bg: "rgba(248,81,73,.12)",  color: T.red,    bd: "rgba(248,81,73,.35)"   },
  shipped:   { label: "จัดส่งแล้ว",   bg: "rgba(88,166,255,.12)", color: T.accent, bd: "rgba(88,166,255,.35)"  },
  completed: { label: "เสร็จสมบูรณ์", bg: "rgba(188,140,255,.12)",color: T.purple, bd: "rgba(188,140,255,.35)" },
};

export const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const s = map[status] ?? { label: status, bg: "rgba(125,133,144,.12)", color: T.muted, bd: "rgba(125,133,144,.3)" };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.bd}`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, ...F, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
};
