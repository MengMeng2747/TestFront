// ─── api/client.ts ────────────────────────────────────────────────────────────
// Centralized fetch wrapper สำหรับเชื่อม Spring Boot Backend

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

interface FetchOptions extends RequestInit {
  body?: any;
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: "include", // ส่ง cookie/session ไปด้วยทุก request
    headers: {
      "Content-Type": "application/json",
      ...rest.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // พยายาม parse error message จาก backend
    let errMsg = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      errMsg = errJson.error || errJson.message || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  // ถ้า response เป็น empty string (เช่น logout) ให้ return null
  const text = await res.text();
  if (!text) return null as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  get:    <T>(path: string)              => request<T>(path, { method: "GET"    }),
  post:   <T>(path: string, body?: any) => request<T>(path, { method: "POST",   body }),
  put:    <T>(path: string, body?: any) => request<T>(path, { method: "PUT",    body }),
  delete: <T>(path: string)             => request<T>(path, { method: "DELETE"  }),
};
