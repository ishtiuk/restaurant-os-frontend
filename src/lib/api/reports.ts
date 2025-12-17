import { apiClient } from "@/lib/api";

export interface SalesSummaryPeriod {
  start_date: string;
  end_date: string;
  total_sales: number;
  total_orders: number;
  average_order_value: number;
}

export interface SalesSummaryResponse {
  period: SalesSummaryPeriod;
}

export interface SalesTrendDataPoint {
  period: string;
  total_sales: number;
  order_count: number;
}

export interface SalesTrendResponse {
  data: SalesTrendDataPoint[];
}

export interface TopProductItem {
  product_id: number;
  product_name: string;
  category_id: string;
  category_name?: string | null;
  quantity_sold: number;
  total_revenue: number;
  average_price: number;
  rank: number;
}

export interface TopProductsResponse {
  data: TopProductItem[];
}

export interface LowStockItem {
  product_id: number;
  product_name: string;
  sku: string;
  category_id: string;
  category_name?: string | null;
  current_stock: number;
  unit: string;
  is_critical: boolean;
}

export interface LowStockResponse {
  data: LowStockItem[];
  total_critical: number;
  total_low_stock: number;
}

export const reportsApi = {
  getSalesSummary(startDate: string, endDate: string): Promise<SalesSummaryResponse> {
    const params = new URLSearchParams();
    params.append("start_date", startDate);
    params.append("end_date", endDate);
    return apiClient.get<SalesSummaryResponse>(`/reports/sales-summary?${params.toString()}`);
  },

  getSalesTrend(
    startDate: string,
    endDate: string,
    groupBy: "day" | "week" | "month" = "day"
  ): Promise<SalesTrendResponse> {
    const params = new URLSearchParams();
    params.append("start_date", startDate);
    params.append("end_date", endDate);
    params.append("group_by", groupBy);
    return apiClient.get<SalesTrendResponse>(`/reports/sales-trend?${params.toString()}`);
  },

  getTopProducts(
    startDate: string,
    endDate: string,
    limit: number = 10,
    categoryId?: string
  ): Promise<TopProductsResponse> {
    const params = new URLSearchParams();
    params.append("start_date", startDate);
    params.append("end_date", endDate);
    params.append("limit", String(limit));
    if (categoryId) {
      params.append("category_id", categoryId);
    }
    return apiClient.get<TopProductsResponse>(`/reports/top-products?${params.toString()}`);
  },

  getLowStock(threshold: number = 10, categoryId?: string): Promise<LowStockResponse> {
    const params = new URLSearchParams();
    params.append("threshold", String(threshold));
    if (categoryId) {
      params.append("category_id", categoryId);
    }
    return apiClient.get<LowStockResponse>(`/reports/low-stock?${params.toString()}`);
  },
};

