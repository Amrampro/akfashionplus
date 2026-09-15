import { get } from "./api";
import type { AdminDashboardData } from "../types/adminDashboard";

export type AdminDashboardFilters = {
  period: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  activityType?: string;
};

export function fetchAdminDashboard(filters: AdminDashboardFilters) {
  const params = new URLSearchParams();
  params.set("period", filters.period);

  if (filters.startDate) params.set("start_date", filters.startDate);
  if (filters.endDate) params.set("end_date", filters.endDate);
  if (filters.branchId) params.set("branch_id", filters.branchId);
  if (filters.activityType) params.set("activity_type", filters.activityType);

  return get<AdminDashboardData>(`/dashboard/admin?${params.toString()}`);
}
