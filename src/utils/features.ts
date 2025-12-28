/**
 * Feature flags utility
 * For now, features are enabled by default. When backend integration is ready,
 * this will check tenant-specific feature flags.
 */

// List of all feature IDs
export type FeatureId = 
  | "dashboard"
  | "pos_sales"
  | "tables"
  | "items"
  | "purchases"
  | "suppliers"
  | "staff"
  | "customers"
  | "reports"
  | "sales_history"
  | "finance"
  | "void_management";

/**
 * Check if a feature is enabled for the current tenant
 * TODO: Connect to backend tenant features when backend integration is ready
 */
export function isFeatureEnabled(featureId: FeatureId): boolean {
  // For now, all features are enabled by default
  // When backend is ready, check user.tenant.features or similar
  return true;
  
  // Future implementation:
  // const { user } = useAuth();
  // if (!user?.tenantId) return false;
  // return user.tenant?.enabledFeatures?.includes(featureId) ?? false;
}

