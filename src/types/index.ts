// ─── types/index.ts ───────────────────────────────────────────────────────────

export type ResellerStatus = "pending" | "approved" | "rejected";
export type OrderStatus    = "pending" | "shipped"  | "completed";
export type BadgeStatus    = ResellerStatus | OrderStatus;
export type AlertType      = "error" | "success" | "warning" | "info";
export type BtnVariant     = "primary" | "success" | "danger" | "info" | "ghost" | "warning";
export type BtnSize        = "sm" | "md" | "lg";
export type AdminPageId    = "dashboard" | "products" | "resellers" | "orders";
export type ResellerPageId = "dashboard" | "catalog" | "my-products" | "orders" | "wallet";

export interface AdminUser {
  email: string;
  role: "admin";
}

export interface ResellerUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  shopSlug: string;
  address: string;
  status: ResellerStatus;
  password: string;
}

export interface Product {
  id: number;
  name: string;
  imagePreview: string | null;
  description: string;
  cost: number;
  minPrice: number;
  stock: number;
}

export interface ShopProduct {
  id: number;
  productId: number;
  shopId: number;
  name: string;
  imagePreview: string | null;
  description: string;
  cost: number;
  minPrice: number;
  stock: number;
  sellingPrice: number;
}

export interface OrderItem {
  productName: string;
  qty: number;
  sellingPrice: number;
  cost: number;
}

export interface Order {
  id: string;
  resellerId: number;
  resellerName: string;
  shopName: string;
  customer: string;
  phone: string;
  address: string;
  product: string;
  productId: number;
  items: OrderItem[];
  qty: number;
  salePrice: number;
  totalSale: number;
  totalProfit: number;
  cost: number;
  date: string;
  status: OrderStatus;
}

export interface WalletEntry {
  id: number;
  orderId: string;
  shop: string;
  profit: number;
  at: string;
}

export interface ProductFormData {
  name: string;
  imagePreview: string | null;
  description: string;
  cost: string | number;
  minPrice: string | number;
  stock: string | number;
}

export interface ToastState {
  type: AlertType;
  msg: string;
}
