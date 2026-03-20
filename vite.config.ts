import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // ── Admin & endpoints ที่ไม่มี /api นำหน้าใน Backend ──────────────
      // /api/admin/* → localhost:8081/admin/*
      // /api/shop/*  → localhost:8081/shop/*
      // /api/orders* → localhost:8081/orders*
      // /api/reseller* → localhost:8081/reseller*
      "/api/admin": {
        target: "http://localhost:8081",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/shop": {
        target: "http://localhost:8081",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/orders": {
        target: "http://localhost:8081",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/reseller": {
        target: "http://localhost:8081",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },

      // ── Reseller endpoints ที่ Backend มี /api นำหน้าจริงๆ ──────────
      // /api/login    → localhost:8081/api/login
      // /api/register → localhost:8081/api/register
      // /api/me       → localhost:8081/api/me
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        // ไม่ rewrite — ส่ง /api/login ตรงๆ ไป backend
      },
    },
  },
})