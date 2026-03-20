// ─── components/Btn.tsx ───────────────────────────────────────────────────────
import type { FC, ReactNode } from "react";
import type { BtnVariant, BtnSize } from "../types";
import { T, F } from "../styles/tokens";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: string;
  children: ReactNode;
}

const variants: Record<BtnVariant, { bg: string; color: string; bd: string }> = {
  primary: { bg: T.accent,  color: "#0d1117", bd: T.accent },
  success: { bg: "rgba(63,185,80,.15)",  color: T.green,  bd: "rgba(63,185,80,.4)"  },
  danger:  { bg: "rgba(248,81,73,.12)",  color: T.red,    bd: "rgba(248,81,73,.35)" },
  info:    { bg: "rgba(88,166,255,.12)", color: T.accent, bd: "rgba(88,166,255,.35)"},
  ghost:   { bg: "transparent",          color: T.muted,  bd: T.border },
  warning: { bg: "rgba(210,153,34,.15)", color: T.yellow, bd: "rgba(210,153,34,.4)" },
};

const sizes: Record<BtnSize, string> = {
  sm: "5px 11px",
  md: "8px 16px",
  lg: "11px 22px",
};

export const Btn: FC<BtnProps> = ({ variant = "primary", size = "md", icon, children, ...rest }) => {
  const v = variants[variant];
  return (
    <button
      {...rest}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: sizes[size], background: v.bg, color: v.color,
        border: `1px solid ${v.bd}`, borderRadius: 7,
        cursor: rest.disabled ? "not-allowed" : "pointer",
        fontSize: size === "sm" ? 12 : 13, fontWeight: 600,
        opacity: rest.disabled ? .5 : 1, whiteSpace: "nowrap",
        ...F, ...rest.style,
      }}
    >
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {children}
    </button>
  );
};
