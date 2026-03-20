// ─── hooks/useToast.tsx ───────────────────────────────────────────────────────
import { useState } from "react";
import type { ReactNode } from "react";
import type { AlertType, ToastState } from "../types";
import { Alert } from "../components/Alert";

export const useToast = (): [ReactNode, (type: AlertType, msg: string) => void] => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = (type: AlertType, msg: string): void => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const el = toast
    ? <Alert type={toast.type} message={toast.msg} onClose={() => setToast(null)} />
    : null;

  return [el, show];
};
