// ─── styles/tokens.ts ─────────────────────────────────────────────────────────
import type { CSSProperties } from "react";

// ── CSS variable references (ใช้ใน component ทุกไฟล์เหมือนเดิม ไม่ต้องแก้) ──
// ค่าจริงถูก inject เข้า <html> ผ่าน applyTheme() ที่ App.tsx
export const T = {
  bg:       "var(--bg)",
  surface:  "var(--surface)",
  surface2: "var(--surface2)",
  border:   "var(--border)",
  border2:  "var(--border2)",
  text:     "var(--text)",
  muted:    "var(--muted)",
  dim:      "var(--dim)",
  // สีคงที่ — ไม่เปลี่ยนตาม theme
  accent:   "#58a6ff",
  green:    "#3fb950",
  yellow:   "#d29922",
  red:      "#f85149",
  orange:   "#f0883e",
  purple:   "#bc8cff",
} as const;

export const F: CSSProperties = {
  fontFamily: "'Noto Sans Thai', 'Sarabun', sans-serif",
};

// ── Dark theme CSS variable values ────────────────────────────────────────────
export const darkVars: Record<string, string> = {
  "--bg":       "#0d1117",
  "--surface":  "#161b22",
  "--surface2": "#1c2128",
  "--border":   "#30363d",
  "--border2":  "#21262d",
  "--text":     "#e6edf3",
  "--muted":    "#7d8590",
  "--dim":      "#484f58",
};

// ── Light theme CSS variable values ───────────────────────────────────────────
export const lightVars: Record<string, string> = {
  "--bg":       "#f5f7fa",
  "--surface":  "#ffffff",
  "--surface2": "#f0f4f8",
  "--border":   "#d0d7de",
  "--border2":  "#e5e9f0",
  "--text":     "#1f2328",
  "--muted":    "#57606a",
  "--dim":      "#8c959f",
};

// ── Apply theme: inject CSS vars into <html> (ทุก component เห็นทันที) ────────
export const applyTheme = (theme: "dark" | "light"): void => {
  const vars = theme === "dark" ? darkVars : lightVars;
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute("data-theme", theme);
};