// ─── App.tsx ──────────────────────────────────────────────────────────────────
import { useState, useEffect, KeyboardEvent, createContext, useContext, ReactNode, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, useSearchParams } from "react-router-dom";

import { AdminSidebar }    from "./components/admin/AdminSidebar";
import { AdminTopbar }     from "./components/admin/AdminTopbar";
import { ResellerSidebar } from "./components/reseller/ResellerSidebar";
import { ResellerTopbar }  from "./components/reseller/ResellerTopbar";

import { DashboardPage  as AdminDashboard }  from "./pages/admin/DashboardPage";
import { ProductsPage   as AdminProducts }   from "./pages/admin/ProductsPage";
import { ResellersPage  as AdminResellers }  from "./pages/admin/ResellersPage";
import { OrdersPage     as AdminOrders }     from "./pages/admin/OrdersPage";

import { RegisterPage }                        from "./pages/reseller/RegisterPage";
import { RegisterSuccessPage }                 from "./pages/reseller/RegisterSuccessPage";
import { DashboardPage  as ResellerDashboard } from "./pages/reseller/DashboardPage";
import { CatalogPage }                         from "./pages/reseller/CatalogPage";
import { MyProductsPage }                      from "./pages/reseller/MyProductsPage";
import { OrdersPage     as ResellerOrders }    from "./pages/reseller/OrdersPage";
import { WalletPage }                          from "./pages/reseller/WalletPage";

import { ShopPage }       from "./pages/customer/ShopPage";
import { PaymentPage }    from "./pages/customer/PaymentPage";
import { TrackOrderPage } from "./pages/customer/TrackOrderPage";

import { Alert } from "./components/Alert";
import { T, F, applyTheme }  from "./styles/tokens";

import { adminLogin, adminLogout, resellerLogin, resellerRegister, fetchMe } from "./api/auth";
import {
  fetchAdminDashboard, fetchAllProducts, createProduct, updateProduct, deleteProduct,
  fetchAllResellers, approveReseller, rejectReseller,
  fetchAllOrders, shipOrder, completeOrder,
  type AdminDashboard as AdminDashboardData, type ProductAPI, type ResellerAPI, type OrderAPI,
} from "./api/admin";
import {
  fetchCatalog, fetchMyProducts, addProductToShop, removeProductFromShop,
  fetchResellerOrders, fetchWallet,
  type CatalogProductAPI, type ResellerProductAPI, type WalletAPI,
} from "./api/reseller";
import {
  fetchShopProducts, createOrder, payOrder, trackOrder,
  type ShopProductAPI, type TrackOrderAPI,
} from "./api/customer";

import type { AlertType } from "./types";

// ════════════════════════════════════════════════════════════
//  AUTH CONTEXT
// ════════════════════════════════════════════════════════════
interface SessionUser {
  id?:      number;
  email:    string;
  role:     "admin" | "reseller";
  name?:    string;
  shopSlug?: string;
}

interface AuthContextType {
  session:      SessionUser | null;
  setSession:   (u: SessionUser | null) => void;
  logout:       () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const useAuth = () => useContext(AuthContext)!;

// ════════════════════════════════════════════════════════════
//  THEME CONTEXT
// ════════════════════════════════════════════════════════════
type Theme = "dark" | "light";
interface ThemeContextType { theme: Theme; toggleTheme: () => void; }
const ThemeContext = createContext<ThemeContextType>({ theme: "light", toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

// ════════════════════════════════════════════════════════════
//  PROTECTED ROUTES
// ════════════════════════════════════════════════════════════
const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "admin") return <Navigate to="/admin/forbidden" replace />;
  return <>{children}</>;
};

const RequireReseller = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  return session?.role === "reseller" ? <>{children}</> : <Navigate to="/login" replace />;
};

// ════════════════════════════════════════════════════════════
//  FORBIDDEN PAGE
// ════════════════════════════════════════════════════════════
const ForbiddenPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", ...F }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⛔</div>
        <h1 style={{ color: T.red, fontSize: 28, margin: "0 0 8px" }}>403 Forbidden</h1>
        <p style={{ color: T.muted, margin: "0 0 24px" }}>คุณไม่มีสิทธิ์เข้าใช้งานส่วน Admin (BR-04)</p>
        <button onClick={() => navigate("/login")}
          style={{ padding: "10px 22px", background: T.accent, border: "none", borderRadius: 8, color: "#0d1117", fontWeight: 700, cursor: "pointer", ...F }}>
          ← กลับหน้า Login
        </button>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  ADMIN LAYOUT — Sidebar locked
// ════════════════════════════════════════════════════════════
const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { logout } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [pendingCount,    setPendingCount]    = useState(0);
  const [newOrderCount,   setNewOrderCount]   = useState(0);  // ✅ แจ้งเตือนออเดอร์ใหม่
  const [lastOrderCount,  setLastOrderCount]  = useState(-1); // ใช้ track จำนวน
  const [notifToast,      setNotifToast]      = useState<string | null>(null); // ✅ toast popup
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [isMobile,        setIsMobile]        = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ปิด sidebar เมื่อ navigate บน mobile
  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [location.pathname]);

  const pageMap: Record<string, any> = {
    "/admin/dashboard": "dashboard",
    "/admin/products":  "products",
    "/admin/resellers": "resellers",
    "/admin/orders":    "orders",
  };
  const currentPage = pageMap[location.pathname] ?? "dashboard";

  useEffect(() => {
    fetchAllResellers()
      .then(rs => setPendingCount(rs.filter(r => r.status === "pending").length))
      .catch(() => {});
  }, [location.pathname]);

  // ✅ Poll ออเดอร์ใหม่ทุก 30 วิ — Email Notification จำลอง
  useEffect(() => {
    let lastCount = -1;
    const check = () => {
      fetchAllOrders()
        .then(ords => {
          const pending = ords.filter(o => o.status === "pending").length;
          if (lastCount >= 0 && pending > lastCount) {
            const diff = pending - lastCount;
            setNewOrderCount(n => n + diff);
            // ✅ แสดง toast popup แจ้งเตือน
            setNotifToast(`🛒 มีออเดอร์ใหม่ ${diff} รายการ! กรุณาตรวจสอบ`);
            setTimeout(() => setNotifToast(null), 5000);
          }
          lastCount = pending;
          setLastOrderCount(pending);
        })
        .catch(() => {});
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: T.bg }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Backdrop บน mobile */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 40 }} />
      )}

      {/* Sidebar — fixed drawer บน mobile, static บน desktop */}
      <div style={{
        position:  isMobile ? "fixed" : "relative",
        left:      isMobile ? (sidebarOpen ? 0 : -220) : 0,
        top:       0, bottom: 0,
        zIndex:    isMobile ? 50 : "auto",
        transition: "left .25s ease",
        flexShrink: 0,
      }}>
        <AdminSidebar
          page={currentPage}
          setPage={(p: string) => navigate(`/admin/${p}`)}
          onLogout={logout}
          collapsed={false}
          setCollapsed={() => {}}
          pendingCount={pendingCount}
          onToggleTheme={toggleTheme}
          theme={theme}
        />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <AdminTopbar page={currentPage} onToggle={() => setSidebarOpen(o => !o)} newOrderCount={newOrderCount} onClearNotif={() => setNewOrderCount(0)} />
        <main style={{ flex: 1, padding: isMobile ? "16px" : "24px 28px", overflowY: "auto" }}>{children}</main>
      </div>

      {/* ✅ Toast Notification popup */}
      {notifToast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: T.surface, border: `1px solid ${T.yellow}`,
          borderRadius: 12, padding: "14px 18px", boxShadow: "0 8px 32px rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", gap: 12, maxWidth: 340,
          animation: "slideIn .3s ease",
        }}>
          <span style={{ fontSize: 22 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: T.text, fontWeight: 700, fontSize: 13, ...F }}>{notifToast}</div>
            <div style={{ color: T.muted, fontSize: 11, marginTop: 2, ...F }}>คลิก bell เพื่อดูรายละเอียด</div>
          </div>
          <button onClick={() => setNotifToast(null)}
            style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  RESELLER LAYOUT — Sidebar locked
// ════════════════════════════════════════════════════════════
const ResellerLayout = ({ children, resellerInfo }: { children: ReactNode; resellerInfo: any }) => {
  const { logout } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [isMobile,          setIsMobile]          = useState(() => window.innerWidth < 768);
  const [resellerNotif,     setResellerNotif]     = useState(0);       // ✅ badge
  const [resellerToast,     setResellerToast]     = useState<string | null>(null); // ✅ toast
  const [lastShippedCount,  setLastShippedCount]  = useState(-1);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [location.pathname]);

  // ✅ Poll ออเดอร์ของ reseller ทุก 30 วิ
  useEffect(() => {
    if (!resellerInfo?.id) return;
    let lastCount = -1;
    const check = () => {
      fetchResellerOrders(resellerInfo.id)
        .then((ords: any[]) => {
          const shipped = ords.filter(o => o.status === "shipped" || o.status === "completed").length;
          if (lastCount >= 0 && shipped > lastCount) {
            const diff = shipped - lastCount;
            setResellerNotif(n => n + diff);
            setResellerToast(`📦 ออเดอร์ของคุณถูกจัดส่งแล้ว ${diff} รายการ!`);
            setTimeout(() => setResellerToast(null), 5000);
          }
          lastCount = shipped;
          setLastShippedCount(shipped);
        })
        .catch(() => {});
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [resellerInfo?.id]);

  const pageMap: Record<string, any> = {
    "/reseller/dashboard":   "dashboard",
    "/reseller/catalog":     "catalog",
    "/reseller/my-products": "my-products",
    "/reseller/orders":      "orders",
    "/reseller/wallet":      "wallet",
  };
  const currentPage = pageMap[location.pathname] ?? "dashboard";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: T.bg }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 40 }} />
      )}

      <div style={{
        position:  isMobile ? "fixed" : "relative",
        left:      isMobile ? (sidebarOpen ? 0 : -220) : 0,
        top: 0, bottom: 0,
        zIndex:    isMobile ? 50 : "auto",
        transition: "left .25s ease",
        flexShrink: 0,
      }}>
        <ResellerSidebar
          page={currentPage}
          setPage={(p: string) => navigate(`/reseller/${p}`)}
          onLogout={logout}
          collapsed={false}
          setCollapsed={() => {}}
          user={resellerInfo}
          onToggleTheme={toggleTheme}
          theme={theme}
        />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <ResellerTopbar page={currentPage} onToggle={() => setSidebarOpen(o => !o)} user={resellerInfo} newOrderCount={resellerNotif} onClearNotif={() => setResellerNotif(0)} />
        <main style={{ flex: 1, padding: isMobile ? "16px" : "24px 28px", overflowY: "auto" }}>{children}</main>
      </div>

      {/* ✅ Reseller Toast Notification */}
      {resellerToast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: T.surface, border: `1px solid ${T.accent}`,
          borderRadius: 12, padding: "14px 18px", boxShadow: "0 8px 32px rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", gap: 12, maxWidth: 340,
        }}>
          <span style={{ fontSize: 22 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: T.text, fontWeight: 700, fontSize: 13, ...F }}>{resellerToast}</div>
            <div style={{ color: T.muted, fontSize: 11, marginTop: 2, ...F }}>ไปที่ออเดอร์เพื่อดูรายละเอียด</div>
          </div>
          <button onClick={() => setResellerToast(null)}
            style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD (connected)
//  ✅ เพิ่มคอลัมน์ "ชื่อร้าน" ระหว่างเลขออเดอร์และลูกค้า
// ════════════════════════════════════════════════════════════
const AdminDashboardConnected = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [orders,    setOrders]    = useState<OrderAPI[]>([]);
  const [products,  setProducts]  = useState<ProductAPI[]>([]);
  const [resellers, setResellers] = useState<ResellerAPI[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAdminDashboard(), fetchAllOrders(), fetchAllProducts(), fetchAllResellers()])
      .then(([dash, ords, prods, ress]) => {
        setDashboard(dash); setOrders(ords);
        setProducts(prods); setResellers(ress);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: T.muted, padding: 40, textAlign: "center", ...F }}>⏳ กำลังโหลด...</div>;
  if (error)   return <div style={{ color: T.red,   padding: 40, textAlign: "center", ...F }}>❌ {error}</div>;

  const mappedOrders = orders.map(o => ({
    id: o.orderNumber,
    shopName: o.shopName ?? `Shop #${o.shopId}`,
    customer: o.customerName,
    totalSale:   Number(o.totalAmount)    ?? 0,
    totalProfit: Number(o.resellerProfit) ?? 0,
    date: o.createdAt,
    status: o.status,
  }));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: "0 0 4px", ...F }}>แดชบอร์ด</h2>
        <p style={{ color: T.muted, fontSize: 12, margin: 0, ...F }}>ภาพรวมระบบ ResellerHub</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "ยอดขายรวม",          value: `฿${Number(dashboard?.totalSales   ?? 0).toLocaleString()}`,  sub: "shipped+completed", accent: "#3fb950", icon: "📈" },
          { label: "กำไรจ่ายตัวแทน",     value: `฿${Number(dashboard?.totalProfit  ?? 0).toLocaleString()}`,  sub: "บวก Wallet แล้ว",   accent: "#f0883e", icon: "💰" },
          { label: "ออเดอร์ทั้งหมด",     value: Number(dashboard?.totalOrders   ?? 0),                        sub: `รอ ${dashboard?.pendingOrders ?? 0} รายการ`, accent: "#d29922", icon: "📦" },
          { label: "รอดำเนินการ",         value: Number(dashboard?.pendingOrders ?? 0),                        sub: "ยังไม่จัดส่ง",       accent: "#f85149", icon: "⏳" },
          { label: "ตัวแทนอนุมัติแล้ว",  value: Number(dashboard?.totalResellers  ?? 0),                      sub: "Login ได้",          accent: "#58a6ff", icon: "👥" },
          { label: "ตัวแทนรออนุมัติ",    value: Number(dashboard?.pendingResellers ?? 0),                      sub: "รอตรวจสอบ",          accent: "#bc8cff", icon: "⚠️" },
          { label: "รายได้ Admin (สุทธิ)", value: `฿${(Number(dashboard?.totalSales ?? 0) - Number(dashboard?.totalProfit ?? 0)).toLocaleString()}`, sub: "ยอดขาย − กำไรตัวแทน", accent: "#58a6ff", icon: "🏦" },
        ].map(s => (
          <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: 14, top: 12, fontSize: 28, opacity: .15 }}>{s.icon}</div>
            <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8, ...F }}>{s.label}</div>
            <div style={{ color: T.text,  fontSize: 26, fontWeight: 700, ...F }}>{s.value}</div>
            <div style={{ color: T.muted, fontSize: 12, marginTop: 4, ...F }}>{s.sub}</div>
            <div style={{ height: 2, background: `linear-gradient(90deg,${s.accent},transparent)`, borderRadius: 2, marginTop: 14 }} />
          </div>
        ))}
      </div>

      {/* ── Admin Sales Chart — group by วันที่ ──────────────── */}
      {(() => {
        const adminChartMap = new Map<string, { sale: number; profit: number; net: number }>();
        mappedOrders
          .filter(o => ["shipped","completed"].includes(o.status))
          .forEach(o => {
            const day = new Date(o.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
            const prev = adminChartMap.get(day) ?? { sale: 0, profit: 0, net: 0 };
            adminChartMap.set(day, {
              sale:   prev.sale   + Number(o.totalSale),
              profit: prev.profit + Number(o.totalProfit ?? 0),
              net:    prev.net    + Number(o.totalSale) - Number(o.totalProfit ?? 0),
            });
          });
        const adminChartDays = [...adminChartMap.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-7);
        const adminMaxVal = Math.max(...adminChartDays.map(([, v]) => Math.max(v.sale, v.profit, v.net)), 1);
        return (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
            <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, margin: "0 0 2px", fontSize: 13, ...F }}>สรุปยอดขายและกำไร</h3>
            <p style={{ color: T.muted, fontSize: 12, margin: "0 0 12px", fontSize: 11, ...F }}>รายวัน (shipped + completed) สูงสุด 7 วัน</p>
            {adminChartDays.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: T.muted, fontSize: 13, ...F }}>ยังไม่มีข้อมูลออเดอร์</div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <div style={{ minWidth: adminChartDays.length * 80, padding: "0 8px" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 110, marginBottom: 6 }}>
                      {adminChartDays.map(([day, v], i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, width: "100%" }}>
                            <div style={{ flex: 1, background: "rgba(63,185,80,.85)", borderRadius: "4px 4px 0 0", height: `${Math.max(4, (v.sale / adminMaxVal) * 90)}px`, cursor: "pointer" }} title={`ยอดขาย ฿${v.sale.toLocaleString()}`} />
                            <div style={{ flex: 1, background: "rgba(240,136,62,.85)", borderRadius: "4px 4px 0 0", height: `${Math.max(4, (v.profit / adminMaxVal) * 90)}px`, cursor: "pointer" }} title={`กำไรตัวแทน ฿${v.profit.toLocaleString()}`} />
                            <div style={{ flex: 1, background: "rgba(88,166,255,.85)", borderRadius: "4px 4px 0 0", height: `${Math.max(4, (v.net / adminMaxVal) * 90)}px`, cursor: "pointer" }} title={`Admin สุทธิ ฿${v.net.toLocaleString()}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {adminChartDays.map(([day], i) => (
                        <div key={i} style={{ flex: 1, textAlign: "center", color: T.dim, fontSize: 10, ...F }}>{day}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(63,185,80,.85)" }} />
                    <span style={{ color: T.muted, fontSize: 12, ...F }}>ยอดขายรวม</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(240,136,62,.85)" }} />
                    <span style={{ color: T.muted, fontSize: 12, ...F }}>กำไรจ่ายตัวแทน</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(88,166,255,.85)" }} />
                    <span style={{ color: T.muted, fontSize: 12, ...F }}>รายได้ Admin (สุทธิ)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── Bottom: ตาราง + Widgets ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }}>

        {/* ซ้าย: ตารางออเดอร์ล่าสุด */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${T.border2}` }}>
            <h3 style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: 0, ...F }}>ออเดอร์ล่าสุด</h3>
            <button onClick={() => navigate("/admin/orders")}
              style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px", color: T.muted, fontSize: 12, cursor: "pointer", ...F, display: "flex", alignItems: "center", gap: 4 }}>
              ดูทั้งหมด →
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.surface2 }}>
                  {["เลขออเดอร์","ชื่อร้าน","ลูกค้า","ยอด","กำไร","สถานะ"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", ...F }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...mappedOrders]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map(o => {
                    const isDone = ["shipped","completed"].includes(o.status);
                    return (
                      <tr key={o.id} style={{ borderTop: `1px solid ${T.border2}` }}>
                        <td style={{ padding: "12px 14px", color: T.accent, fontWeight: 600, fontSize: 12, ...F }}>{o.id}</td>
                        <td style={{ padding: "12px 14px", color: T.text, fontSize: 13, fontWeight: 600, ...F }}>{o.shopName || "—"}</td>
                        <td style={{ padding: "12px 14px", color: T.text, fontSize: 13, ...F }}>{o.customer}</td>
                        <td style={{ padding: "12px 14px", color: T.green, fontWeight: 700, fontSize: 13, ...F }}>฿{Number(o.totalSale).toLocaleString()}</td>
                        <td style={{ padding: "12px 14px", color: isDone ? T.orange : T.dim, fontWeight: isDone ? 700 : 400, fontSize: 13, ...F }}>{isDone ? `฿${Number(o.totalProfit).toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: o.status==="pending" ? "rgba(210,153,34,.15)" : o.status==="shipped" ? "rgba(88,166,255,.12)" : "rgba(188,140,255,.12)", color: o.status==="pending" ? T.yellow : o.status==="shipped" ? T.accent : T.purple, border: `1px solid ${o.status==="pending" ? "rgba(210,153,34,.4)" : o.status==="shipped" ? "rgba(88,166,255,.35)" : "rgba(188,140,255,.35)"}`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, ...F }}>
                            {o.status==="pending" ? "รออนุมัติ" : o.status==="shipped" ? "จัดส่งแล้ว" : "เสร็จสมบูรณ์"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ขวา: 2 Widgets */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>

          {/* Widget 1: สต็อกต่ำ */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13 }}>⚠️</span>
                <span style={{ color: T.text, fontWeight: 700, fontSize: 13, ...F }}>สต็อกต่ำ</span>
                {/* ✅ Badge แจ้งเตือนจำนวนสินค้าที่ stock < 20 */}
                {products.filter(p => p.stock < 20).length > 0 && (
                  <span style={{ background: T.red, color: "#fff", borderRadius: "50%", fontSize: 10, fontWeight: 700, width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {products.filter(p => p.stock < 20).length}
                  </span>
                )}
              </div>
              <button onClick={() => navigate("/admin/products")}
                style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px", color: T.muted, fontSize: 11, cursor: "pointer", ...F }}>
                จัดการ
              </button>
            </div>
            {products.filter(p => p.stock <= 20).length === 0 ? (
              <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: "12px 0", ...F }}>สต็อกปกติทุกรายการ ✅</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {products.filter(p => p.stock === 0).slice(0, 2).map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(248,81,73,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                      {p.imageUrl ? <img src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 7 }} /> : "📦"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: T.text, fontSize: 12, fontWeight: 600, ...F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ color: T.red, fontSize: 11, ...F }}>หมด</div>
                    </div>
                  </div>
                ))}
                {products.filter(p => p.stock > 0 && p.stock <= 20).slice(0, 3).map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(210,153,34,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                      {p.imageUrl ? <img src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 7 }} /> : "📦"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: T.text, fontSize: 12, fontWeight: 600, ...F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ color: T.yellow, fontSize: 11, ...F }}>เหลือ {p.stock} ชิ้น</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 2: รออนุมัติ */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13 }}>👥</span>
                <span style={{ color: T.text, fontWeight: 700, fontSize: 13, ...F }}>รออนุมัติ</span>
              </div>
              <button onClick={() => navigate("/admin/resellers")}
                style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px", color: T.muted, fontSize: 11, cursor: "pointer", ...F }}>
                ดูทั้งหมด
              </button>
            </div>
            {resellers.filter(r => r.status === "pending").length === 0 ? (
              <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: "12px 0", ...F }}>ไม่มีรออนุมัติ ✅</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {resellers.filter(r => r.status === "pending").slice(0, 4).map(r => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(88,166,255,.2)", border: `1px solid rgba(88,166,255,.4)`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {r.name?.charAt(0) ?? "R"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: T.text, fontSize: 12, fontWeight: 600, ...F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                      <div style={{ color: T.muted, fontSize: 11, ...F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  ADMIN PRODUCTS (connected)
// ════════════════════════════════════════════════════════════
const AdminProductsConnected = () => {
  const navigate  = useNavigate();
  const [products, setProductsState] = useState<ProductAPI[]>([]);
  const [orders,   setOrders]        = useState<OrderAPI[]>([]);
  const [loading,  setLoading]       = useState(true);
  const [error,    setError]         = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchAllProducts(), fetchAllOrders()])
      .then(([prods, ords]) => { setProductsState(prods); setOrders(ords); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: T.muted, padding: 40, textAlign: "center", ...F }}>⏳ กำลังโหลด...</div>;
  if (error)   return <div style={{ color: T.red,   padding: 40, textAlign: "center", ...F }}>❌ {error}</div>;

  const mappedProducts = products.map(p => ({
    id: p.id, name: p.name, imagePreview: p.imageUrl ?? null,
    description: p.description ?? "", cost: p.costPrice, minPrice: p.minPrice, stock: p.stock,
  }));

  const mappedOrders = orders.map(o => ({
    id: o.orderNumber, resellerId: 0, resellerName: "", shopName: "",
    customer: o.customerName, phone: o.customerPhone, address: o.shippingAddress,
    product: o.items?.[0]?.productName ?? "",
    productId: 0,
    items: (o.items ?? []).map(i => ({
      productName: i.productName,
      qty: i.quantity,
      sellingPrice: Number(i.sellingPrice),
      cost: Number(i.costPrice),
    })),
    qty: (o.items ?? []).reduce((s, i) => s + i.quantity, 0),
    salePrice: Number(o.items?.[0]?.sellingPrice ?? 0),
    totalSale: o.totalAmount, totalProfit: o.resellerProfit,
    cost: Number(o.items?.[0]?.costPrice ?? 0),
    date: o.createdAt, status: o.status as any,
  }));

  const handleSetProducts = (updater: any) => {
    const prev = mappedProducts;
    const next = typeof updater === "function" ? updater(prev) : updater;
    if (next.length < prev.length) {
      const deleted = prev.find((p: any) => !next.find((n: any) => n.id === p.id));
      if (deleted) {
        deleteProduct(deleted.id).then(() => load()).catch(e => alert("ลบไม่ได้: " + e.message));
      }
    } else {
      load();
    }
  };

  return <AdminProducts products={mappedProducts} setProducts={handleSetProducts as any} orders={mappedOrders} />;
};

// ════════════════════════════════════════════════════════════
//  ADMIN RESELLERS (connected)
//  ✅ shopName จาก API, createdAt จริง, เรียงล่าสุดขึ้นบน
// ════════════════════════════════════════════════════════════
const AdminResellersConnected = () => {
  const [resellers, setResellersState] = useState<ResellerAPI[]>([]);
  const [loading,   setLoading]        = useState(true);
  const [error,     setError]          = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchAllResellers()
      .then(setResellersState)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: T.muted, padding: 40, textAlign: "center", ...F }}>⏳ กำลังโหลด...</div>;
  if (error)   return <div style={{ color: T.red,   padding: 40, textAlign: "center", ...F }}>❌ {error}</div>;

  // เรียงจากใหม่ → เก่า (id มากสุดขึ้นบน = สมัครล่าสุด)
  const sorted = [...resellers].sort((a, b) => b.id - a.id);

  const mapped = sorted.map(r => ({
    id: r.id, name: r.name, email: r.email, phone: r.phone,
    shopName: (r as any).shopName ?? "", shopSlug: "", address: r.address,
    status: r.status as any, password: "",
    createdAt: r.createdAt ?? "",
  }));

  const handleSetResellers = (updater: any) => {
    const prev = mapped;
    const next = typeof updater === "function" ? updater(prev) : updater;
    next.forEach((n: any) => {
      const old = prev.find(p => p.id === n.id);
      if (!old || old.status === n.status) return;
      if (n.status === "approved") approveReseller(n.id).then(load).catch(e => alert(e.message));
      else if (n.status === "rejected") rejectReseller(n.id).then(load).catch(e => alert(e.message));
    });
    setResellersState(next.map((n: any) => ({
      id: n.id, name: n.name, email: n.email, phone: n.phone,
      role: "reseller", status: n.status, address: n.address,
      shopName: n.shopName ?? "", createdAt: n.createdAt ?? "",
    })));
  };

  return <AdminResellers resellers={mapped} setResellers={handleSetResellers as any} />;
};

// ════════════════════════════════════════════════════════════
//  ADMIN ORDERS (connected)
//  ✅ shopName, ส่งไป OrdersPage ที่มี pagination + sort
// ════════════════════════════════════════════════════════════
const AdminOrdersConnected = () => {
  const [orders,  setOrdersState] = useState<OrderAPI[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchAllOrders()
      .then(setOrdersState)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: T.muted, padding: 40, textAlign: "center", ...F }}>⏳ กำลังโหลด...</div>;
  if (error)   return <div style={{ color: T.red,   padding: 40, textAlign: "center", ...F }}>❌ {error}</div>;

  const mapped = orders.map(o => ({
    id: o.orderNumber, resellerId: 0, resellerName: "", shopName: o.shopName ?? `Shop #${o.shopId}`,
    customer: o.customerName, phone: o.customerPhone, address: o.shippingAddress,
    product: o.items?.[0]?.productName ?? "",
    productId: 0,
    items: (o.items ?? []).map(i => ({
      productName: i.productName,
      qty: i.quantity,
      sellingPrice: Number(i.sellingPrice),
      cost: Number(i.costPrice),
    })),
    qty: (o.items ?? []).reduce((s, i) => s + i.quantity, 0),
    salePrice: Number(o.items?.[0]?.sellingPrice ?? 0),
    totalSale: o.totalAmount, totalProfit: o.resellerProfit,
    cost: Number(o.items?.[0]?.costPrice ?? 0),
    date: o.createdAt, status: o.status as any,
    _backendId: o.id,
  }));

  const handleSetOrders = (updater: any) => {
    const prev = mapped;
    const next = typeof updater === "function" ? updater(prev) : updater;
    next.forEach((n: any) => {
      const old = prev.find(p => p.id === n.id);
      if (!old || old.status === n.status) return;
      const backendId = orders.find(o => o.orderNumber === n.id)?.id;
      if (!backendId) return;
      if (n.status === "shipped")   shipOrder(backendId).then(load).catch(e => alert(e.message));
      if (n.status === "completed") completeOrder(backendId).then(load).catch(e => alert(e.message));
    });
    setOrdersState(next.map((n: any) => ({
      id: orders.find(o => o.orderNumber === n.id)?.id ?? 0,
      orderNumber: n.id, shopId: 0,
      customerName: n.customer, customerPhone: n.phone, shippingAddress: n.address,
      totalAmount: n.totalSale, resellerProfit: n.totalProfit,
      status: n.status, createdAt: n.date,
    })));
  };

  return <AdminOrders orders={mapped as any} setOrders={handleSetOrders as any} />;
};

// ════════════════════════════════════════════════════════════
//  UNIFIED LOGIN PAGE (Admin + Reseller)
// ════════════════════════════════════════════════════════════
const LoginPage = ({ setSession }: { setSession: (u: SessionUser) => void }) => {
  const navigate = useNavigate();
  const [email,     setEmail]     = useState("");
  const [pass,      setPass]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: AlertType; msg: string } | null>(null);

  const submit = async () => {
    setError(""); setStatusMsg(null);
    if (!email || !pass) { setError("กรุณากรอกอีเมลและรหัสผ่าน"); return; }
    setLoading(true);
    try {
      // ลอง Admin ก่อน
      try {
        await adminLogin({ email, password: pass });
        setSession({ email, role: "admin" });
        navigate("/admin/dashboard");
        return;
      } catch {
        // ไม่ใช่ admin → ลอง reseller
      }
      // ลอง Reseller
      const result = await resellerLogin({ email, password: pass });
      if (result.includes("รออนุมัติ")) {
        setStatusMsg({ type: "warning", msg: "บัญชีรออนุมัติ — กรุณารอการติดต่อจาก Admin (BR-16)" });
      } else if (result.includes("ไม่ได้รับการอนุมัติ")) {
        setStatusMsg({ type: "error", msg: "บัญชีนี้ไม่ได้รับการอนุมัติ — กรุณาติดต่อ Admin (BR-17)" });
      } else {
        try {
          const me = await fetchMe();
          setSession({ id: me.id, email: me.email, role: "reseller", name: me.name, shopSlug: me.shopSlug });
        } catch {
          setSession({ email, role: "reseller" });
        }
        navigate("/reseller/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(88,166,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(88,166,255,.04) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ width: 400, position: "relative", zIndex: 1 }}>
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: "0 24px 64px rgba(0,0,0,.5)", overflow: "hidden" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg,${T.accent},#bc8cff,transparent)` }} />
          <div style={{ padding: "32px 32px 28px" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔐</div>
              <h1 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: "0 0 4px", ...F }}>เข้าสู่ระบบ</h1>
              <p style={{ color: T.muted, fontSize: 13, margin: 0, ...F }}>ใช้ได้ทั้ง Admin และ Reseller</p>
            </div>

            {error     && <Alert type="error"          message={error}         onClose={() => setError("")} />}
            {statusMsg && <Alert type={statusMsg.type} message={statusMsg.msg} onClose={() => setStatusMsg(null)} />}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6, ...F }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && submit()}
                placeholder="your@email.com"
                style={{ width: "100%", padding: "10px 13px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, ...F, boxSizing: "border-box", outline: "none" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6, ...F }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && submit()}
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "10px 40px 10px 13px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, ...F, boxSizing: "border-box", outline: "none" }} />
                <button onClick={() => setShowPw(s => !s)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14, padding: 0 }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button onClick={submit} disabled={loading}
              style={{ width: "100%", padding: 11, background: loading ? "rgba(88,166,255,.3)" : T.accent, border: "none", borderRadius: 9, color: loading ? T.muted : "#0d1117", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", ...F }}>
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ →"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", color: T.muted, fontSize: 13, marginTop: 14, ...F }}>
          สมัครเป็นตัวแทน?{" "}
          <button onClick={() => navigate("/register")} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 13, padding: 0, ...F }}>
            สมัครสมาชิก
          </button>
        </p>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  REGISTER PAGE (connected)
// ════════════════════════════════════════════════════════════
const RegisterPageConnected = () => {
  const navigate = useNavigate();
  const handleRegister = async (u: any) => {
    try {
      await resellerRegister({
        name: u.name, email: u.email, phone: u.phone,
        password: u.password, confirmPassword: u.password,
        shopName: u.shopName, address: u.address,
      });
      navigate("/register/success");
    } catch (err: any) { throw err; }
  };
  return <RegisterPage onRegister={handleRegister as any} onGoLogin={() => navigate("/login")} existingResellers={[]} />;
};

// ════════════════════════════════════════════════════════════
//  RESELLER HOOK
// ════════════════════════════════════════════════════════════
const useResellerInfo = (session: SessionUser) => {
  const [info,    setInfo]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { setSession } = useAuth();

  useEffect(() => {
    if (session.id) {
      setInfo({
        id: session.id, name: session.name ?? "", email: session.email,
        phone: "", shopName: "", shopSlug: session.shopSlug ?? "",
        address: "", status: "approved" as any, password: "",
      });
      setLoading(false);
      return;
    }
    fetchMe()
      .then(me => {
        setSession({ id: me.id, email: me.email, role: "reseller", name: me.name, shopSlug: me.shopSlug });
        setInfo({
          id: me.id, name: me.name, email: me.email,
          phone: me.phone, shopName: me.shopName, shopSlug: me.shopSlug,
          address: me.address, status: "approved" as any, password: "",
        });
      })
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, [session.id]);

  return { info, loading };
};

// ════════════════════════════════════════════════════════════
//  RESELLER PAGES (connected)
// ════════════════════════════════════════════════════════════
const ResellerDashboardConnected = ({ session }: { session: SessionUser }) => {
  const { info, loading: infoLoading } = useResellerInfo(session);
  const [shopProducts, setShopProducts] = useState<ResellerProductAPI[]>([]);
  const [orders,       setOrders]       = useState<any[]>([]);
  const [wallet,       setWallet]       = useState<WalletAPI | null>(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!info?.id) return;
    Promise.all([fetchMyProducts(info.id), fetchResellerOrders(info.id), fetchWallet(info.id)])
      .then(([prods, ords, wal]) => { setShopProducts(prods); setOrders(ords); setWallet(wal); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [info?.id]);

  if (infoLoading || loading) return <div style={{ color: T.muted, padding: 40, textAlign: "center", ...F }}>⏳ กำลังโหลด...</div>;
  if (!info) return <div style={{ color: T.red, padding: 40, textAlign: "center", ...F }}>❌ ไม่พบข้อมูล กรุณา Login ใหม่</div>;

  const mappedShopProducts = shopProducts.map(p => ({
    id: p.id, productId: p.id, shopId: info.id,
    name: p.name, imagePreview: null, description: "",
    cost: 0, minPrice: 0, stock: p.stock, sellingPrice: p.selling_price,
  }));

  const walletEntries = wallet?.logs.map(l => ({
    id: l.id,
    orderId: l.orderNumber ?? String(l.orderId),  // ← ใช้ orderNumber จริง
    shop: "",   // ← ลบชื่อร้านออก
    profit: Number(l.amount), at: l.createdAt,
  })) ?? [];

  const profitByOrderNum = new Map<string, number>();
  walletEntries.forEach(w => profitByOrderNum.set(w.orderId, w.profit));

  const mappedOrders = orders.map(o => {
    const key    = o.orderNumber ?? String(o.orderId);
    const profit = profitByOrderNum.get(key) ?? 0;
    return {
      id: key,                                        // ← เลขออเดอร์จริง
      resellerId: info.id,
      resellerName: info.name, shopName: info.shopName,
      customer: o.customerName, phone: "", address: "",
      product: o.productName ?? "", productId: 0,
      items: o.productName ? [{ productName: o.productName, qty: o.quantity ?? 0, sellingPrice: o.sellingPrice ?? 0, cost: 0 }] : [],
      qty: o.quantity ?? 0, salePrice: o.sellingPrice ?? 0,
      totalSale:   Number(o.totalAmount ?? 0),         // ← ยอดขายจริง
      totalProfit: profit, cost: 0,
      date: o.createdAt ?? new Date().toISOString(),   // ← วันที่จริง
      status: o.status as any,
    };
  });

  // ── Reseller chart data — group by วันที่ ────────────────
  const resellerChartMap = new Map<string, { sale: number; profit: number }>();
  mappedOrders
    .filter(o => ["shipped","completed"].includes(o.status))
    .forEach(o => {
      const day = new Date(o.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
      const profit = walletEntries.find((w: any) => w.orderId === o.id)?.profit ?? Number(o.totalProfit ?? 0);
      const prev = resellerChartMap.get(day) ?? { sale: 0, profit: 0 };
      resellerChartMap.set(day, { sale: prev.sale + Number(o.totalSale), profit: prev.profit + Number(profit) });
    });
  const resellerChartDays = [...resellerChartMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7);
  const resellerMaxVal = Math.max(...resellerChartDays.map(([, v]) => Math.max(v.sale, v.profit)), 1);

  const ResellerChart = () => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
      <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, margin: "0 0 2px", fontSize: 13, ...F }}>สรุปกำไรและยอดขาย</h3>
      <p style={{ color: T.muted, fontSize: 12, margin: "0 0 12px", fontSize: 11, ...F }}>รายวัน (shipped + completed) สูงสุด 7 วัน</p>
      {resellerChartDays.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: T.muted, fontSize: 13, ...F }}>ยังไม่มีข้อมูลออเดอร์</div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: resellerChartDays.length * 80, padding: "0 8px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 110, marginBottom: 6 }}>
                {resellerChartDays.map(([day, v], i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, width: "100%" }}>
                      <div style={{ flex: 1, background: "rgba(188,140,255,.85)", borderRadius: "4px 4px 0 0", height: `${Math.max(4, (v.profit / resellerMaxVal) * 90)}px`, cursor: "pointer" }} title={`กำไร ฿${v.profit.toLocaleString()}`} />
                      <div style={{ flex: 1, background: "rgba(63,185,80,.85)", borderRadius: "4px 4px 0 0", height: `${Math.max(4, (v.sale / resellerMaxVal) * 90)}px`, cursor: "pointer" }} title={`ยอดขาย ฿${v.sale.toLocaleString()}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {resellerChartDays.map(([day], i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", color: T.dim, fontSize: 10, ...F }}>{day}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(188,140,255,.85)" }} />
              <span style={{ color: T.muted, fontSize: 12, ...F }}>กำไรสะสม (Wallet)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(63,185,80,.85)" }} />
              <span style={{ color: T.muted, fontSize: 12, ...F }}>ยอดขายรวม</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return <ResellerDashboard user={info} shopProducts={mappedShopProducts} orders={mappedOrders} walletEntries={walletEntries} chart={<ResellerChart />} />;
};

const CatalogPageConnected = ({ session }: { session: SessionUser }) => {
  const { info, loading: infoLoading } = useResellerInfo(session);
  const [catalog,    setCatalog]    = useState<CatalogProductAPI[]>([]);
  const [myProducts, setMyProducts] = useState<ResellerProductAPI[]>([]);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(() => {
    if (!info?.id) return;
    Promise.all([fetchCatalog(), fetchMyProducts(info.id)])
      .then(([cat, mine]) => { setCatalog(cat); setMyProducts(mine); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [info?.id]);

  useEffect(() => { load(); }, [load]);

  if (infoLoading || loading) return <div style={{ color: T.muted, padding: 40, textAlign: "center", ...F }}>⏳ กำลังโหลด...</div>;
  if (!info) return <div style={{ color: T.red, padding: 40, textAlign: "center", ...F }}>❌ ไม่พบข้อมูล กรุณา Login ใหม่</div>;

  const products = catalog.map(p => ({
    id: p.id, name: p.name, imagePreview: p.imageUrl ?? null, description: "",
    cost: p.cost_price, minPrice: p.min_price, stock: p.stock,
  }));

  const shopProducts = myProducts.map(p => ({
    id: p.id, productId: p.id, shopId: info.id,
    name: p.name, imagePreview: null, description: "",
    cost: 0, minPrice: 0, stock: p.stock, sellingPrice: p.selling_price,
  }));

  const handleAddToShop = async (p: any, price: number) => {
    await addProductToShop({ reseller_id: info.id, product_id: p.id, selling_price: price });
    load();
  };

  const handleUpdatePrice = async (sp: any, price: number) => {
    await addProductToShop({ reseller_id: info.id, product_id: sp.productId, selling_price: price });
    load();
  };

  return <CatalogPage user={info} products={products} shopProducts={shopProducts} onAddToShop={handleAddToShop} onUpdatePrice={handleUpdatePrice} />;
};

const MyProductsConnected = ({ session }: { session: SessionUser }) => {
  const { info, loading: infoLoading } = useResellerInfo(session);
  const [myProducts, setMyProducts] = useState<ResellerProductAPI[]>([]);
  const [catalog,    setCatalog]    = useState<CatalogProductAPI[]>([]);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(() => {
    if (!info?.id) return;
    Promise.all([fetchMyProducts(info.id), fetchCatalog()])
      .then(([mine, cat]) => { setMyProducts(mine); setCatalog(cat); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [info?.id]);

  useEffect(() => { load(); }, [load]);

  if (infoLoading || loading) return <div style={{ color: T.muted, padding: 40, textAlign: "center", ...F }}>⏳ กำลังโหลด...</div>;
  if (!info) return <div style={{ color: T.red, padding: 40, textAlign: "center", ...F }}>❌ ไม่พบข้อมูล กรุณา Login ใหม่</div>;

  const shopProducts = myProducts.map(p => {
    const catItem = catalog.find(c => c.id === p.id);
    return {
      id: p.id, productId: p.id, shopId: info.id,
      name: p.name, imagePreview: catItem?.imageUrl ?? null, description: "",
      cost: catItem?.cost_price ?? 0, minPrice: catItem?.min_price ?? 0,
      stock: p.stock, sellingPrice: p.selling_price,
    };
  });

  const handleUpdatePrice = async (sp: any, price: number) => {
    await addProductToShop({ reseller_id: info.id, product_id: sp.productId, selling_price: price });
    load();
  };

  const handleRemove = async (id: number) => {
    const sp = shopProducts.find(p => p.id === id);
    if (!sp) return;
    try {
      await removeProductFromShop(info.id, sp.productId);
      load();
    } catch (err: any) {
      alert("ลบไม่ได้: " + err.message);
    }
  };

  return (
    <MyProductsPage
      shopProducts={shopProducts}
      onRemove={handleRemove}
      onUpdatePrice={handleUpdatePrice}
    />
  );
};

const ResellerOrdersConnected = ({ session }: { session: SessionUser }) => {
  const { info, loading: infoLoading } = useResellerInfo(session);
  const [orders,  setOrders]  = useState<any[]>([]);
  const [wallet,  setWallet]  = useState<WalletAPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!info?.id) return;
    Promise.all([fetchResellerOrders(info.id), fetchWallet(info.id)])
      .then(([ords, wal]) => { setOrders(ords); setWallet(wal); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [info?.id]);

  if (infoLoading || loading) return <div style={{ color: T.muted, padding: 40, textAlign: "center", ...F }}>⏳ กำลังโหลด...</div>;
  if (!info) return <div style={{ color: T.red, padding: 40, textAlign: "center", ...F }}>❌ ไม่พบข้อมูล กรุณา Login ใหม่</div>;

  const profitByOrderNum = new Map<string, number>();
  (wallet?.logs ?? []).forEach(l => {
    const key = l.orderNumber ?? String(l.orderId);
    profitByOrderNum.set(key, Number(l.amount));
  });

  const mappedOrders = orders.map(o => {
    const key    = o.orderNumber ?? String(o.orderId);
    const profit = profitByOrderNum.get(key) ?? 0;
    return {
      id: key,                                          // ← เลขออเดอร์จริง
      resellerId: info.id,
      resellerName: info.name, shopName: info.shopName,
      customer: o.customerName,
      phone:   o.customerPhone   ?? "",   // ✅ เบอร์โทรจริง
      address: o.shippingAddress ?? "",   // ✅ ที่อยู่จริง
      product: o.productName ?? "", productId: 0,
      items: (o.items ?? []).map((i: any) => ({
        productName: i.productName,
        qty: i.quantity,
        sellingPrice: Number(i.sellingPrice),
        cost: 0,
      })),
      qty: o.quantity ?? 0, salePrice: o.sellingPrice ?? 0,
      totalSale:   Number(o.totalAmount ?? 0),
      totalProfit: profit, cost: 0,
      date: o.createdAt ?? new Date().toISOString(),
      status: o.status as any,
    };
  });

  return <ResellerOrders user={info} orders={mappedOrders} />;
};

const WalletPageConnected = ({ session }: { session: SessionUser }) => {
  const { info, loading: infoLoading } = useResellerInfo(session);
  const [wallet,  setWallet]  = useState<WalletAPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!info?.id) return;
    fetchWallet(info.id).then(setWallet).catch(() => {}).finally(() => setLoading(false));
  }, [info?.id]);

  if (infoLoading || loading) return <div style={{ color: T.muted, padding: 40, textAlign: "center", ...F }}>⏳ กำลังโหลด...</div>;

  const walletEntries = wallet?.logs.map(l => ({
    id: l.id,
    orderId: l.orderNumber ?? String(l.orderId),  // ← เลขออเดอร์จริง
    shop: "",                                       // ← ลบชื่อร้านออก
    profit: l.amount, at: l.createdAt,
  })) ?? [];

  return <WalletPage walletEntries={walletEntries} />;
};

// ════════════════════════════════════════════════════════════
//  SHOP PAGE (connected) — ระบบตะกร้าหลายสินค้า
// ════════════════════════════════════════════════════════════
const ShopPageConnected = () => {
  const { slug } = useParams<{ slug: string }>();
  const nav      = useNavigate();
  const [products, setProducts] = useState<ShopProductAPI[]>([]);
  const [shopId,   setShopId]   = useState<number>(0);
  const [shopName, setShopName] = useState<string>("");
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    // บันทึก slug ของร้านที่กำลังดูอยู่ใน localStorage
    localStorage.setItem("rms_last_shop", slug);
    Promise.all([
      fetchShopProducts(slug),
      fetch(`/api/shop/info/${slug}`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([prods, info]) => {
        setProducts(prods);
        if (info?.id)   setShopId(info.id);
        if (info?.name) setShopName(info.name);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{ color: "#6b7280", padding: 40, textAlign: "center" }}>⏳ กำลังโหลด...</div>;

  const fakeReseller = notFound ? [] : [{
    id: 0, name: shopName || (slug ?? ""), email: "", phone: "",
    shopName: shopName || (slug ?? ""), shopSlug: slug ?? "",
    address: "", status: "approved" as any, password: "",
  }];

  const fakeShopProducts = products.map(p => ({
    id: p.product_id, productId: p.product_id, shopId: 0,
    name: p.product_name, imagePreview: p.image,
    description: "", cost: 0, minPrice: 0,
    stock: p.stock, sellingPrice: p.price,
  }));

  const handlePlaceOrder = async (cartItems: any[], form: any) => {
    const orderNumber = await createOrder({
      shop_id:          shopId,
      customer_name:    form.name,
      customer_phone:   form.phone,
      shipping_address: form.address,
      items: cartItems.map((c: any) => ({
        product_id: c.product.productId,
        quantity:   c.qty,
      })),
    });
    nav(`/shop/${slug}/payment/${orderNumber}`);
  };

  return (
    <ShopPage
      resellers={fakeReseller}
      shopProducts={fakeShopProducts}
      shopId={shopId}
      slug={slug ?? ""}
      onPlaceOrder={handlePlaceOrder}
    />
  );
};

// ════════════════════════════════════════════════════════════
//  TRACK ORDER PAGE (connected)
// ════════════════════════════════════════════════════════════
const TrackOrderPageConnected = () => {
  const [searchParams]            = useSearchParams();
  const [orderData, setOrderData] = useState<TrackOrderAPI | null>(null);
  const [loading,   setLoading]   = useState(false);
  const orderNumber = searchParams.get("orderId");

  useEffect(() => {
    if (!orderNumber) return;
    setLoading(true);
    trackOrder(orderNumber).then(setOrderData).catch(() => {}).finally(() => setLoading(false));
  }, [orderNumber]);

  const fakeOrders = orderData ? [{
    id: orderData.orderNumber, resellerId: 0, resellerName: "", shopName: "",
    customer: orderData.customerName, phone: orderData.customerPhone, address: orderData.shippingAddress,
    product: orderData.items[0]?.productName ?? "", productId: 0,
    items: orderData.items.map(i => ({ productName: i.productName, qty: i.quantity, sellingPrice: i.sellingPrice, cost: 0 })),
    qty: orderData.items.reduce((s, i) => s + i.quantity, 0),
    salePrice: 0, totalSale: orderData.totalAmount, totalProfit: 0, cost: 0,
    date: orderData.createdAt, status: orderData.status as any,
  }] : [];

  return <TrackOrderPage orders={fakeOrders} />;
};

// ════════════════════════════════════════════════════════════
//  ADMIN PRODUCT FORM
// ════════════════════════════════════════════════════════════
const AdminProductFormConnected = ({ mode }: { mode: "add" | "edit" }) => {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductAPI | null>(null);
  const [orders,  setOrders]  = useState<OrderAPI[]>([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (mode === "edit" && id) {
      Promise.all([fetchAllProducts(), fetchAllOrders()])
        .then(([prods, ords]) => {
          const found = prods.find(p => p.id === Number(id));
          if (!found) { setError("ไม่พบสินค้านี้"); return; }
          setProduct(found); setOrders(ords);
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      fetchAllOrders().then(setOrders).catch(() => {});
    }
  }, [mode, id]);

  if (loading) return <div style={{ color: T.muted, padding: 40, textAlign: "center", ...F }}>⏳ กำลังโหลด...</div>;
  if (error)   return <div style={{ color: T.red,   padding: 40, textAlign: "center", ...F }}>❌ {error}</div>;

  const mappedProduct = product ? {
    id: product.id, name: product.name, imagePreview: product.imageUrl ?? null,
    description: product.description ?? "", cost: product.costPrice, minPrice: product.minPrice, stock: product.stock,
  } : null;

  const mappedOrders = orders.map(o => ({
    id: o.orderNumber, resellerId: 0, resellerName: "", shopName: "",
    customer: o.customerName, phone: o.customerPhone, address: o.shippingAddress,
    product: o.items?.[0]?.productName ?? "",
    productId: 0,
    items: (o.items ?? []).map(i => ({
      productName: i.productName,
      qty: i.quantity,
      sellingPrice: Number(i.sellingPrice),
      cost: Number(i.costPrice),
    })),
    qty: (o.items ?? []).reduce((s, i) => s + i.quantity, 0),
    salePrice: Number(o.items?.[0]?.sellingPrice ?? 0),
    totalSale: o.totalAmount, totalProfit: o.resellerProfit,
    cost: Number(o.items?.[0]?.costPrice ?? 0),
    date: o.createdAt, status: o.status as any,
  }));

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const payload = { name: data.name, description: data.description, imageUrl: data.imagePreview ?? null, costPrice: data.cost, minPrice: data.minPrice, stock: data.stock };
      if (mode === "edit" && id) await updateProduct(Number(id), payload);
      else await createProduct(payload);
      navigate("/admin/products");
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate("/admin/products")}
          style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, cursor: "pointer", padding: "7px 14px", fontSize: 13, ...F }}>
          ← กลับ
        </button>
        <div>
          <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: 0, ...F }}>{mode === "add" ? "เพิ่มสินค้าใหม่" : "แก้ไขสินค้า"}</h2>
          <p style={{ color: T.muted, fontSize: 12, margin: "2px 0 0", ...F }}>URL: {mode === "add" ? "/admin/products/add" : `/admin/products/edit/${id}`}</p>
        </div>
      </div>
      {error && <div style={{ color: T.red, marginBottom: 16, ...F }}>❌ {error}</div>}
      <div style={{ maxWidth: 560 }}>
        <ProductFormModalInline product={mappedProduct} orders={mappedOrders} onSave={handleSave} saving={saving} />
      </div>
    </div>
  );
};

const ProductFormModalInline = ({ product, orders, onSave, saving }: { product: any; orders: any[]; onSave: (d: any) => void; saving: boolean }) => {
  const [form, setForm] = useState({
    name: product?.name ?? "", imagePreview: product?.imagePreview ?? null as string | null,
    description: product?.description ?? "", cost: product?.cost ?? "",
    minPrice: product?.minPrice ?? "", stock: product?.stock ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) { setErrors(er => ({ ...er, image: "ไฟล์ต้องเป็น JPG หรือ PNG" })); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors(er => ({ ...er, image: "ขนาดไม่เกิน 5MB" })); return; }
    const reader = new FileReader();
    reader.onload = ev => set("imagePreview", ev.target?.result as string);
    reader.readAsDataURL(file);
    setErrors(er => ({ ...er, image: undefined as any }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())             e.name     = "กรุณากรอกชื่อสินค้า";
    if (!form.cost || +form.cost <= 0) e.cost     = "ราคาทุนต้องมากกว่า 0";
    if (!form.minPrice)                e.minPrice = "กรุณากรอกราคาขั้นต่ำ";
    if (+form.minPrice < +form.cost)   e.minPrice = "ราคาขั้นต่ำ < ราคาทุน ไม่ได้ (BR-07)";
    if (form.stock === "" || +form.stock < 0) e.stock = "สต็อกต้อง >= 0";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ name: form.name, imagePreview: form.imagePreview, description: form.description, cost: +form.cost, minPrice: +form.minPrice, stock: +form.stock });
  };

  const inp = (style?: any) => ({ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, boxSizing: "border-box" as any, outline: "none", ...F, ...style });
  const lbl = { display: "block", color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase" as any, letterSpacing: ".05em", marginBottom: 6, ...F };
  const err = { color: T.red, fontSize: 12, margin: "4px 0 0", ...F };
  const box = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 22px", marginBottom: 16 };

  return (
    <div>
      <div style={box}>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>ชื่อสินค้า <span style={{ color: T.red }}>*</span></label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="เช่น เสื้อยืดคอกลม สีดำ" style={inp(errors.name ? { borderColor: T.red } : {})} />
          {errors.name && <p style={err}>{errors.name}</p>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>รูปสินค้า (JPG/PNG ≤ 5MB)</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {form.imagePreview && <img src={form.imagePreview} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: `1px solid ${T.border}`, flexShrink: 0 }} />}
            <label style={{ flex: 1, padding: "10px", background: T.bg, border: `1px dashed ${errors.image ? T.red : T.border}`, borderRadius: 8, color: T.muted, cursor: "pointer", fontSize: 13, textAlign: "center", ...F }}>
              {form.imagePreview ? "เปลี่ยนรูป" : "📁 คลิกเพื่ออัปโหลด"}
              <input type="file" accept="image/jpeg,image/png" onChange={handleImg} style={{ display: "none" }} />
            </label>
          </div>
          {errors.image && <p style={err}>{errors.image}</p>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>รายละเอียด</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="ไม่บังคับ" rows={3} style={{ ...inp(), resize: "vertical", minHeight: 70 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={lbl}>ราคาทุน (บาท) <span style={{ color: T.red }}>*</span></label>
            <input type="number" value={form.cost} onChange={e => set("cost", e.target.value)} placeholder="0" min="0" style={inp(errors.cost ? { borderColor: T.red } : {})} />
            {errors.cost && <p style={err}>{errors.cost}</p>}
          </div>
          <div>
            <label style={lbl}>ราคาขั้นต่ำ (บาท) <span style={{ color: T.red }}>*</span></label>
            <input type="number" value={form.minPrice} onChange={e => set("minPrice", e.target.value)} placeholder="0" min="0" style={inp(errors.minPrice ? { borderColor: T.red } : {})} />
            {errors.minPrice && <p style={err}>{errors.minPrice}</p>}
            {+form.minPrice >= +form.cost && +form.cost > 0 && <p style={{ color: T.green, fontSize: 11, margin: "4px 0 0", ...F }}>กำไรขั้นต่ำ: ฿{(+form.minPrice - +form.cost).toLocaleString()}</p>}
          </div>
        </div>
        <div>
          <label style={lbl}>จำนวนสต็อก <span style={{ color: T.red }}>*</span></label>
          <input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="0" min="0" style={inp(errors.stock ? { borderColor: T.red } : {})} />
          {errors.stock && <p style={err}>{errors.stock}</p>}
        </div>
      </div>
      <button onClick={handleSubmit} disabled={saving}
        style={{ width: "100%", padding: 12, background: saving ? "rgba(88,166,255,.3)" : T.accent, border: "none", borderRadius: 9, color: saving ? T.muted : "#0d1117", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", ...F }}>
        {saving ? "กำลังบันทึก..." : "💾 บันทึกสินค้า"}
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  PAYMENT PAGE (connected)
// ════════════════════════════════════════════════════════════
const PaymentPageConnected = () => {
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>();
  const nav = useNavigate();
  const [orderData, setOrderData] = useState<TrackOrderAPI | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!orderId) return;
    trackOrder(orderId).then(setOrderData).catch(() => {}).finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div style={{ color: T.muted, padding: 40, textAlign: "center", ...F }}>⏳ กำลังโหลด...</div>;

  const order = orderId ? [{
    id: orderId, resellerId: 0, resellerName: "", shopName: slug ?? "",
    customer: orderData?.customerName ?? "", phone: orderData?.customerPhone ?? "",
    address: orderData?.shippingAddress ?? "", product: orderData?.items[0]?.productName ?? "", productId: 0,
    items: (orderData?.items ?? []).map(i => ({ productName: i.productName, qty: i.quantity, sellingPrice: i.sellingPrice, cost: 0 })),
    qty: orderData?.items.reduce((s, i) => s + i.quantity, 0) ?? 1,
    salePrice: orderData?.items[0]?.sellingPrice ?? 0,
    totalSale: orderData?.totalAmount ?? 0, totalProfit: 0, cost: 0,
    date: orderData?.createdAt ?? new Date().toISOString(), status: "pending" as any,
  }] : [];

  return <PaymentPage orders={order} onPaymentSuccess={async (oid) => {
    // BR-28 + BR-29: เรียก payOrder → ตัด stock
    try {
      await payOrder(oid); // oid คือ orderNumber เช่น "ORD-xxx"
    } catch (e) {
      // ignore error — ยังคง navigate ไปหน้า track
    }
    nav(`/track-order?orderId=${oid}`);
  }} />;
};

// ════════════════════════════════════════════════════════════
//  APP ROOT
// ════════════════════════════════════════════════════════════
const SESSION_KEY       = "rms_session";
const THEME_KEY_ADMIN   = "rms_theme_admin";
const THEME_KEY_RESELLER= "rms_theme_reseller";

export default function App() {
  const [session, setSessionState] = useState<SessionUser | null>(() => {
    try { const saved = localStorage.getItem(SESSION_KEY); return saved ? JSON.parse(saved) : null; }
    catch { return null; }
  });

  // ── Theme แยกตาม role — default เป็น "light" เสมอ ──────
  const [adminTheme,    setAdminTheme]    = useState<Theme>(() =>
    (localStorage.getItem(THEME_KEY_ADMIN)    as Theme) ?? "light"
  );
  const [resellerTheme, setResellerTheme] = useState<Theme>(() =>
    (localStorage.getItem(THEME_KEY_RESELLER) as Theme) ?? "light"
  );

  // role ปัจจุบัน → เลือก theme ที่จะ apply
  const currentRole  = session?.role ?? null;
  const activeTheme: Theme =
    currentRole === "admin"    ? adminTheme    :
    currentRole === "reseller" ? resellerTheme :
    "light"; // หน้าลูกค้า/login/register → light เสมอ

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  const toggleTheme = () => {
    if (currentRole === "admin") {
      const next: Theme = adminTheme === "dark" ? "light" : "dark";
      setAdminTheme(next);
      localStorage.setItem(THEME_KEY_ADMIN, next);
    } else if (currentRole === "reseller") {
      const next: Theme = resellerTheme === "dark" ? "light" : "dark";
      setResellerTheme(next);
      localStorage.setItem(THEME_KEY_RESELLER, next);
    }
  };
  // ──────────────────────────────────────────────────────────

  const navigate = useNavigate();

  const setSession = (u: SessionUser | null) => {
    setSessionState(u);
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else   localStorage.removeItem(SESSION_KEY);
  };

  // ✅ logout → /login เสมอ
  const logout = async () => {
    try { await adminLogout(); } catch {}
    setSession(null);
    navigate("/login");
  };

  const resellerInfo = session?.role === "reseller" ? {
    id: session.id ?? 0, name: session.name ?? "", email: session.email,
    phone: "", shopName: "", shopSlug: session.shopSlug ?? "",
    address: "", status: "approved" as any, password: "",
  } : null;

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, toggleTheme }}>
    <AuthContext.Provider value={{ session, setSession, logout }}>
      <Routes>
        <Route path="/" element={
          session?.role === "admin"    ? <Navigate to="/admin/dashboard"    replace /> :
          session?.role === "reseller" ? <Navigate to="/reseller/dashboard" replace /> :
                                         <Navigate to="/login"              replace />
        } />

        {/* ✅ หน้า Login เดียว — ใช้ได้ทั้ง Admin และ Reseller */}
        <Route path="/login"       element={session ? <Navigate to={session.role === "admin" ? "/admin/dashboard" : "/reseller/dashboard"} replace /> : <LoginPage setSession={setSession} />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        <Route path="/register"         element={<RegisterPageConnected />} />
        <Route path="/register/success" element={<RegisterSuccessPage onGoLogin={() => navigate("/login")} />} />

        <Route path="/admin/forbidden"          element={<ForbiddenPage />} />
        <Route path="/admin/dashboard"          element={<RequireAdmin><AdminLayout><AdminDashboardConnected /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/products"           element={<RequireAdmin><AdminLayout><AdminProductsConnected  /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/products/add"       element={<RequireAdmin><AdminLayout><AdminProductFormConnected mode="add"  /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/products/edit/:id"  element={<RequireAdmin><AdminLayout><AdminProductFormConnected mode="edit" /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/resellers"          element={<RequireAdmin><AdminLayout><AdminResellersConnected /></AdminLayout></RequireAdmin>} />
        <Route path="/admin/orders"             element={<RequireAdmin><AdminLayout><AdminOrdersConnected    /></AdminLayout></RequireAdmin>} />

        <Route path="/reseller/dashboard"   element={<RequireReseller><ResellerLayout resellerInfo={resellerInfo}><ResellerDashboardConnected session={session!} /></ResellerLayout></RequireReseller>} />
        <Route path="/reseller/catalog"     element={<RequireReseller><ResellerLayout resellerInfo={resellerInfo}><CatalogPageConnected        session={session!} /></ResellerLayout></RequireReseller>} />
        <Route path="/reseller/my-products" element={<RequireReseller><ResellerLayout resellerInfo={resellerInfo}><MyProductsConnected          session={session!} /></ResellerLayout></RequireReseller>} />
        <Route path="/reseller/orders"      element={<RequireReseller><ResellerLayout resellerInfo={resellerInfo}><ResellerOrdersConnected      session={session!} /></ResellerLayout></RequireReseller>} />
        <Route path="/reseller/wallet"      element={<RequireReseller><ResellerLayout resellerInfo={resellerInfo}><WalletPageConnected           session={session!} /></ResellerLayout></RequireReseller>} />

        <Route path="/shop/:slug"                  element={<ShopPageConnected />} />
        <Route path="/shop/:slug/checkout"         element={<Navigate to={`/shop/${window.location.pathname.split("/")[2]}`} replace />} />
        <Route path="/shop/:slug/payment/:orderId" element={<PaymentPageConnected />} />
        <Route path="/track-order"                 element={<TrackOrderPageConnected />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}