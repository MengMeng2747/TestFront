// ─── api/auth.ts ──────────────────────────────────────────────────────────────
import { api } from "./client";

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export const adminLogin = (payload: AdminLoginPayload): Promise<string> =>
  api.post<string>("/admin/login", payload);

export const adminLogout = (): Promise<string> =>
  api.post<string>("/admin/logout");

export interface ResellerLoginPayload {
  email: string;
  password: string;
}

export const resellerLogin = (payload: ResellerLoginPayload): Promise<string> =>
  api.post<string>("/login", payload);

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
  api.post<string>("/register", payload);

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
  api.get<MeRes>("/me");