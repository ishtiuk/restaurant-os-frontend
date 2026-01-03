/**
 * Base API client (Restauranflow)
 */

// When served from backend, use relative path
const getApiBaseUrl = (): string => {
  // Check if we're served from backend (same origin)
  const origin = window.location.origin;
  const isServedFromBackend =
    origin === "http://localhost:8001" ||
    origin === "http://127.0.0.1:8001";

  // Use env var if set, otherwise use relative path when served from backend
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envUrl) return envUrl;

  return isServedFromBackend ? "/api" : "http://localhost:8001/api";
};

const API_BASE_URL = getApiBaseUrl();
const API_ORIGIN = (() => {
  try {
    // If API_BASE_URL is a relative path, use current origin
    if (API_BASE_URL.startsWith("/")) {
      return window.location.origin;
    }
    return new URL(API_BASE_URL).origin;
  } catch {
    return window.location.origin;
  }
})();

const TOKEN_KEY = "restaurant-os-token";
const TENANT_KEY = "restaurant-os-tenant-id";

export interface ApiError extends Error {
  code?: string;
  details?: Record<string, any>;
  response?: {
    status: number;
    data?: any;
  };
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, "");
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  set token(value: string | null) {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  }

  get tenantId(): string | null {
    return localStorage.getItem(TENANT_KEY);
  }

  set tenantId(value: string | null) {
    if (value) localStorage.setItem(TENANT_KEY, value);
    else localStorage.removeItem(TENANT_KEY);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      ...(options.headers || {}),
    };

    // Attach auth
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    if (this.tenantId) headers["X-Tenant-ID"] = this.tenantId;

    // Default content-type for JSON bodies
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {


      // Handle 401 Unauthorized - token is invalid or user doesn't exist
      // Don't trigger logout on login endpoint (login failures are expected)
      if (res.status === 401 && !endpoint.includes("/auth/login")) {
        // Clear authentication data
        this.token = null;
        this.tenantId = null;
        localStorage.removeItem("restaurant-os.auth.user");

        // Dispatch custom event to trigger logout in AuthContext
        window.dispatchEvent(new CustomEvent("auth:logout"));

        // Redirect to login page (only if not already there and not on login page)
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/") {
          // Use window.location for full page reload to clear all state
          window.location.href = "/login";
        }
      }

      let message = "An error occurred";
      if (data?.detail) {
        if (typeof data.detail === "string") message = data.detail;
        else if (data.detail.message) message = data.detail.message;
        else if (data.detail.detail) message = data.detail.detail;
      } else if (data?.message) {
        message = data.message;
      } else if (typeof data === "string") {
        message = data;
      }
      const err: ApiError = new Error(message);
      err.code = data?.detail?.code || data?.code || String(res.status);
      err.details = data?.detail?.details || data?.details;
      err.response = { status: res.status, data };
      throw err;
    }

    return data as T;
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, body?: any) {
    const init: RequestInit = { method: "POST" };
    if (body !== undefined) {
      init.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    return this.request<T>(endpoint, init);
  }

  put<T>(endpoint: string, body?: any) {
    const init: RequestInit = { method: "PUT" };
    if (body !== undefined) {
      init.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    return this.request<T>(endpoint, init);
  }

  patch<T>(endpoint: string, body?: any) {
    const init: RequestInit = { method: "PATCH" };
    if (body !== undefined) {
      init.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    return this.request<T>(endpoint, init);
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { TOKEN_KEY, TENANT_KEY, API_ORIGIN };
