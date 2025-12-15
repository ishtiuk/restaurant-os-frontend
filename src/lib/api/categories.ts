import { apiClient } from "@/lib/api";

export interface CategoryDto {
  id: string;
  name: string;
  name_bn?: string | null;
  icon?: string | null;
  item_count?: number;
}

export const categoriesApi = {
  list(): Promise<CategoryDto[]> {
    return apiClient.get("/categories");
  },
  create(data: { name: string; name_bn?: string; icon?: string }) {
    return apiClient.post<CategoryDto>("/categories", data);
  },
  delete(id: string) {
    return apiClient.delete(`/categories/${id}`);
  },
};
