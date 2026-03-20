// ─── components/Form.tsx ──────────────────────────────────────────────────────
import type { FC, ReactNode } from "react";
import { T, F } from "../styles/tokens";

// ── FieldWrap ─────────────────────────────────────────────
interface FieldWrapProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export const FieldWrap: FC<FieldWrapProps> = ({ label, error, required, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", color: T.muted, fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em", ...F }}>
      {label} {required && <span style={{ color: T.red }}>*</span>}
    </label>
    {children}
    {error && <p style={{ color: T.red, fontSize: 12, margin: "4px 0 0", ...F }}>{error}</p>}
  </div>
);

// ── Inp ───────────────────────────────────────────────────
interface InpProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Inp: FC<InpProps> = ({ error, style, ...rest }) => (
  <input
    {...rest}
    style={{
      width: "100%", padding: "9px 12px", background: T.bg,
      border: `1px solid ${error ? T.red : T.border}`, borderRadius: 8,
      color: T.text, fontSize: 14, ...F, boxSizing: "border-box", outline: "none",
      ...style,
    }}
  />
);

// ── Txa ───────────────────────────────────────────────────
interface TxaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Txa: FC<TxaProps> = ({ error, style, ...rest }) => (
  <textarea
    {...rest}
    style={{
      width: "100%", padding: "9px 12px", background: T.bg,
      border: `1px solid ${error ? T.red : T.border}`, borderRadius: 8,
      color: T.text, fontSize: 14, ...F, boxSizing: "border-box", outline: "none",
      resize: "vertical", minHeight: 80, ...style,
    }}
  />
);
