// ─── api/auth.ts ──────────────────────────────────────────────────────────────
import { api } from "./client";

// ── Admin Login ────────────────────────────────────────────
export interface AdminLoginPayload {
  email: string;
  password: string;
}

export const adminLogin = (payload: AdminLoginPayload): Promise<string> =>
  api.post<string>("/admin/login", payload);

export const adminLogout = (): Promise<string> =>
  api.post<string>("/admin/logout");

// ── Reseller Login ─────────────────────────────────────────
export interface ResellerLoginPayload {
  email: string;
  password: string;
}

export const resellerLogin = (payload: ResellerLoginPayload): Promise<string> =>
  api.post<string>("/login", payload); // ✅ ลบ /api ออก (BASE_URL = "/api" อยู่แล้ว)

// ── Reseller Register ──────────────────────────────────────
export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  shopName: string;
  address: string;
}

export const resellerRegister = (payload: RegisterPayload): Promise<string> =>
  api.post<string>("/register", payload); // ✅ ลบ /api ออก

// ── Get current reseller session ───────────────────────────
export interface MeRes {
  id:       number;
  name:     string;
  email:    string;
  phone:    string;
  address:  string;
  status:   string;
  shopName: string;
  shopSlug: string;
}

export const fetchMe = (): Promise<MeRes> =>
  api.get<MeRes>("/me"); // ✅ ลบ /api ออก