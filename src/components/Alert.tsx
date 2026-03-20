// ─── components/Alert.tsx ─────────────────────────────────────────────────────
import type { FC } from "react";
import type { AlertType } from "../types";
import { T, F } from "../styles/tokens";

interface AlertProps {
  type?: AlertType;
  message: string;
  onClose?: () => void;
}

const alertMap: Record<AlertType, { bg: string; color: string; bd: string; icon: string }> = {
  error:   { bg: "rgba(248,81,73,.12)",  color: T.red,    bd: "rgba(248,81,73,.3)",  icon: "✕" },
  success: { bg: "rgba(63,185,80,.12)",  color: T.green,  bd: "rgba(63,185,80,.3)",  icon: "✓" },
  warning: { bg: "rgba(210,153,34,.12)", color: T.yellow, bd: "rgba(210,153,34,.3)", icon: "⚠" },
  info:    { bg: "rgba(88,166,255,.12)", color: T.accent, bd: "rgba(88,166,255,.3)", icon: "ℹ" },
};

export const Alert: FC<AlertProps> = ({ type = "error", message, onClose }) => {
  const s = alertMap[type];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 8, marginBottom: 16 }}>
      <span style={{ color: s.color, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
      <span style={{ color: s.color, fontSize: 13, flex: 1, ...F }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: "none", border: "none", color: s.color, cursor: "pointer", fontSize: 16, padding: 0, opacity: .7, flexShrink: 0 }}>✕</button>
      )}
    </div>
  );
};
