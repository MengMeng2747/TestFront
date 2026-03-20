// ─── api/admin.ts ─────────────────────────────────────────────────────────────
import { api } from "./client";

// ══ Types ══════════════════════════════════════════════════════════════════════

export interface AdminDashboard {
  totalOrders:      number;
  pendingOrders:    number;
  totalSales:       number;
  totalProfit:      number;
  totalResellers:   number;
  pendingResellers: number;
}

export interface ProductAPI {
  id:          number;
  name:        string;
  description: string;
  imageUrl:    string | null;
  costPrice:   number;
  minPrice:    number;
  stock:       number;
  createdAt?:  string;
}

export interface ProductCreatePayload {
  name:        string;
  description: string;
  imageUrl:    string | null;
  costPrice:   number;
  minPrice:    number;
  stock:       number;
}

export interface ResellerAPI {
  id:        number;
  name:      string;
  email:     string;
  phone:     string;
  role:      string;
  status:    string;
  address:   string;
  shopName?: string;   // ← เพิ่ม: join จาก shops table
  createdAt?: string;  // ← เพิ่ม: วันที่สมัครจริงจาก DB
}

export interface OrderItemAPI {
  productName:  string;
  quantity:     number;
  sellingPrice: number;
  costPrice:    number;
}

export interface OrderAPI {
  id:              number;
  orderNumber:     string;
  shopId:          number;
  shopName:        string;
  customerName:    string;
  customerPhone:   string;
  shippingAddress: string;
  totalAmount:     number;
  resellerProfit:  number;
  status:          string;
  createdAt:       string;
  items:           OrderItemAPI[]; // ✅ เพิ่ม items
}

// ══ Dashboard ══════════════════════════════════════════════════════════════════

export const fetchAdminDashboard = (): Promise<AdminDashboard> =>
  api.get<AdminDashboard>("/admin/dashboard");

// ══ Products ═══════════════════════════════════════════════════════════════════

export const fetchAllProducts = (): Promise<ProductAPI[]> =>
  api.get<ProductAPI[]>("/admin/products/all");

export const createProduct = (payload: ProductCreatePayload): Promise<ProductAPI> =>
  api.post<ProductAPI>("/admin/products/post", payload);

export const updateProduct = (id: number, payload: ProductCreatePayload): Promise<ProductAPI> =>
  api.put<ProductAPI>(`/admin/products/put/${id}`, payload);

export const deleteProduct = (id: number): Promise<string> =>
  api.delete<string>(`/admin/products/del/${id}`);

// ══ Resellers ══════════════════════════════════════════════════════════════════

export const fetchAllResellers = (): Promise<ResellerAPI[]> =>
  api.get<ResellerAPI[]>("/admin/resellers/all");

export const approveReseller = (id: number): Promise<ResellerAPI> =>
  api.put<ResellerAPI>(`/admin/resellers/put/${id}/approve`);

export const rejectReseller = (id: number): Promise<ResellerAPI> =>
  api.put<ResellerAPI>(`/admin/resellers/put/${id}/reject`);

// ══ Orders ═════════════════════════════════════════════════════════════════════

export const fetchAllOrders = (): Promise<OrderAPI[]> =>
  api.get<OrderAPI[]>("/admin/orders");

export const shipOrder = (id: number): Promise<OrderAPI> =>
  api.put<OrderAPI>(`/admin/orders/${id}/ship`);

// ✅ เพิ่มใหม่: shipped → completed
export const completeOrder = (id: number): Promise<OrderAPI> =>
  api.put<OrderAPI>(`/admin/orders/${id}/complete`);