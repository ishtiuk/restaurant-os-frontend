import { Item, Category } from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const getToken = () =>
  localStorage.getItem("token") || import.meta.env.VITE_API_TOKEN || "";

const isApiEnabled = Boolean(API_BASE);

type ProductPayload = {
  name: string;
  name_bn?: string | null;
  category_id: string;
  price: number;
  cost: number;
  unit: string;
  is_packaged: boolean;
  stock_qty: number;
  is_active: boolean;
  sku?: string | null;
  vat_rate?: number | null;
  description?: string | null;
};

const toItem = (p: any): Item => ({
  id: String(p.id),
  name: p.name,
  nameBn: p.name_bn ?? undefined,
  sku: p.sku,
  categoryId: p.category_id,
  price: Number(p.price),
  cost: Number(p.cost),
  stockQty: Number(p.stock_qty ?? 0),
  unit: p.unit,
  imageUrl: p.image_url ?? undefined,
  isActive: Boolean(p.is_active),
  isPackaged: Boolean(p.is_packaged),
  vatRate: p.vat_rate != null ? Number(p.vat_rate) : undefined,
  createdAt: p.created_at ?? new Date().toISOString(),
  updatedAt: p.updated_at ?? new Date().toISOString(),
});

async function request<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
  if (!isApiEnabled) {
    throw new Error("API not configured");
  }
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(input, { ...init, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  isEnabled: isApiEnabled,

  async fetchCategories(): Promise<Category[]> {
    const data = await request<any[]>(`${API_BASE}/categories`);
    return data.map((c) => ({
      id: c.id,
      name: c.name,
      nameBn: c.name_bn ?? undefined,
      icon: c.icon ?? "🍽️",
      itemCount: c.item_count ?? 0,
    }));
  },

  async createCategory(payload: { name: string; nameBn?: string; icon?: string }): Promise<Category> {
    const data = await request<any>(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        name_bn: payload.nameBn,
        icon: payload.icon,
      }),
    });
    return {
      id: data.id,
      name: data.name,
      nameBn: data.name_bn ?? undefined,
      icon: data.icon ?? "🍽️",
      itemCount: data.item_count ?? 0,
    };
  },

  async deleteCategory(categoryId: string): Promise<void> {
    await request(`${API_BASE}/categories/${categoryId}`, { method: "DELETE" });
  },

  async fetchProducts(): Promise<Item[]> {
    const data = await request<any[]>(`${API_BASE}/products`);
    return data.map(toItem);
  },

  async createProduct(payload: ProductPayload, file?: File | null): Promise<Item> {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      form.append(k, String(v));
    });
    if (file) form.append("image", file);
    const data = await request<any>(`${API_BASE}/products`, { method: "POST", body: form });
    return toItem(data);
  },

  async updateProduct(productId: string, payload: Partial<ProductPayload>, file?: File | null): Promise<Item> {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      form.append(k, String(v));
    });
    if (file) form.append("image", file);
    const data = await request<any>(`${API_BASE}/products/${productId}`, { method: "PATCH", body: form });
    return toItem(data);
  },
};
