// ─── api/customer.ts ──────────────────────────────────────────────────────────
import { api } from "./client";

// ══ Types ══════════════════════════════════════════════════════════════════════

export interface ShopProductAPI {
  product_id:   number;
  product_name: string;
  image:        string | null;
  price:        number;
  stock:        number;
  isSoldOut:    boolean;
}

export interface CreateOrderPayload {
  shop_id:          number;
  customer_name:    string;
  customer_phone:   string;
  shipping_address: string;
  items: {
    product_id: number;
    quantity:   number;
  }[];
}

export interface TrackOrderItemAPI {
  productName:  string;
  quantity:     number;
  sellingPrice: number;
}

export interface TrackOrderAPI {
  orderNumber:     string;
  customerName:    string;
  customerPhone:   string;
  shippingAddress: string;
  status:          string;
  totalAmount:     number;
  createdAt:       string;
  items:           TrackOrderItemAPI[];
}

// ══ Shop ═══════════════════════════════════════════════════════════════════════

export const fetchShopProducts = (slug: string): Promise<ShopProductAPI[]> =>
  api.get<ShopProductAPI[]>(`/shop/${slug}`);

// ══ Orders ═════════════════════════════════════════════════════════════════════

export const createOrder = (payload: CreateOrderPayload): Promise<string> =>
  api.post<string>("/orders", payload);

export const payOrder = (orderNumber: string): Promise<string> =>
  api.put<string>(`/orders/${orderNumber}/pay`);

export const trackOrder = (orderNumber: string): Promise<TrackOrderAPI> =>
  api.get<TrackOrderAPI>(`/orders/track/${orderNumber}`);

export const fetchOrdersByShop = (shopId: number) =>
  api.get(`/orders/shop/${shopId}`);