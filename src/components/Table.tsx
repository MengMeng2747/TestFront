// ─── components/Table.tsx ─────────────────────────────────────────────────────
import type { FC, ReactNode, CSSProperties } from "react";
import { T, F } from "../styles/tokens";

export const Table: FC<{ headers: string[]; children: ReactNode }> = ({ headers, children }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
    {/* overflowX: auto ให้ scroll แนวนอนบน mobile */}
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
        <thead>
          <tr style={{ background: T.surface2 }}>
            {headers.map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", ...F, whiteSpace: "nowrap" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  </div>
);

export const Tr: FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <tr
    style={{ borderTop: `1px solid ${T.border2}`, ...style }}
    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(128,128,128,.04)"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
  >
    {children}
  </tr>
);

export const Td: FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <td style={{ padding: "12px 14px", color: T.text, fontSize: 13, ...F, verticalAlign: "middle", ...style }}>
    {children}
  </td>
);