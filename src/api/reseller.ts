// ─── api/reseller.ts ──────────────────────────────────────────────────────────
import { api } from "./client";

// ══ Types ══════════════════════════════════════════════════════════════════════

export interface CatalogProductAPI {
  id:         number;
  name:       string;
  imageUrl:   string | null;  // ✅ เพิ่ม imageUrl
  cost_price: number;
  min_price:  number;
  stock:      number;
}

export interface ResellerProductAPI {
  id:            number;
  name:          string;
  selling_price: number;
  stock:         number;
}

export interface AddProductPayload {
  reseller_id:   number;
  product_id:    number;
  selling_price: number;
}

export interface ResellerOrderItemAPI {
  productName:  string;
  quantity:     number;
  sellingPrice: number;
}

export interface ResellerOrderAPI {
  orderId:         number;
  orderNumber:     string | null;
  customerName:    string;
  customerPhone:   string | null;   // ✅ เพิ่ม
  shippingAddress: string | null;   // ✅ เพิ่ม
  productName:     string | null;
  quantity:        number | null;
  sellingPrice:    number | null;
  totalAmount:     number | null;
  status:          string;
  createdAt:       string | null;
  items:           ResellerOrderItemAPI[]; // ✅ เพิ่ม
}

export interface WalletLogAPI {
  id:          number;
  orderId:     number;
  orderNumber: string | null;   // ← เลขออเดอร์จริง
  userId:      number;
  amount:      number;
  type:        string;
  createdAt:   string;
}

export interface WalletAPI {
  userId:  number;
  balance: number;
  logs:    WalletLogAPI[];
}

// ══ Catalog ════════════════════════════════════════════════════════════════════

export const fetchCatalog = (): Promise<CatalogProductAPI[]> =>
  api.get<CatalogProductAPI[]>("/reseller/catalog");

export const fetchMyProducts = (resellerId: number): Promise<ResellerProductAPI[]> =>
  api.get<ResellerProductAPI[]>(`/reseller/catalog/my-products/${resellerId}`);

export const addProductToShop = (payload: AddProductPayload): Promise<string> =>
  api.post<string>("/reseller/catalog/add", payload);

export const removeProductFromShop = (resellerId: number, productId: number): Promise<string> =>
  api.delete<string>(`/reseller/catalog/remove?resellerId=${resellerId}&productId=${productId}`);

// ══ Orders ═════════════════════════════════════════════════════════════════════

export const fetchResellerOrders = (resellerId: number): Promise<ResellerOrderAPI[]> =>
  api.get<ResellerOrderAPI[]>(`/reseller/orders/${resellerId}`);

// ══ Wallet ═════════════════════════════════════════════════════════════════════

export const fetchWallet = (userId: number): Promise<WalletAPI> =>
  api.get<WalletAPI>(`/reseller/wallet?userId=${userId}`);

// ══ Shop URL ═══════════════════════════════════════════════════════════════════

export const fetchMyShopUrl = (userId: number): Promise<string> =>
  api.get<string>(`/shop/my-shop/${userId}`);