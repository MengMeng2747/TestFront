// ─── components/Modal.tsx ─────────────────────────────────────────────────────
import type { FC, ReactNode } from "react";
import { T, F } from "../styles/tokens";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: ReactNode;
}

export const Modal: FC<ModalProps> = ({ open, onClose, title, width = 480, children }) => {
  if (!open) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: T.surface, borderRadius: 12, width, maxWidth: "95vw", maxHeight: "92vh", overflowY: "auto", border: `1px solid ${T.border}`, boxShadow: "0 32px 80px rgba(0,0,0,.65)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${T.border2}` }}>
          <h3 style={{ margin: 0, color: T.text, fontSize: 16, fontWeight: 600, ...F }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20, padding: 4, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
};
