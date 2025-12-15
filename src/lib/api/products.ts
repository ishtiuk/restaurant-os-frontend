import { apiClient } from "@/lib/api";

export interface ProductDto {
  id: number;
  name: string;
  name_bn?: string | null;
  sku: string;
  category_id: string;
  price: number;
  cost: number;
  stock_qty: number;
  unit: string;
  is_packaged: boolean;
  is_active: boolean;
  vat_rate?: number | null;
  image_url?: string | null;
  image_provider?: string | null;
  image_public_id?: string | null;
  description?: string | null;
}

const toFormData = (payload: Record<string, any>, file?: File | null) => {
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    form.append(k, String(v));
  });
  if (file) form.append("image", file);
  return form;
};

export const productsApi = {
  list(): Promise<ProductDto[]> {
    return apiClient.get("/products");
  },
  create(payload: Record<string, any>, file?: File | null): Promise<ProductDto> {
    return apiClient.post("/products", toFormData(payload, file));
  },
  update(id: string | number, payload: Record<string, any>, file?: File | null): Promise<ProductDto> {
    return apiClient.patch(`/products/${id}`, toFormData(payload, file));
  },
};
