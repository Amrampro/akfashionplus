export type AdminBranch = {
  id: number;
  name: string;
  code: string;
  city: string;
  country_code: string;
  status: string;
};

export type AdminMetricRow = Record<string, string | number | null>;

export type AdminDashboardData = {
  filters: {
    period: string;
    start_date: string | null;
    end_date: string | null;
    branch_id: number | null;
    activity_type: string;
  };
  branches: AdminBranch[];
  overview: AdminMetricRow;
  products: AdminMetricRow;
  revenue_series: AdminMetricRow[];
  order_statuses: AdminMetricRow[];
  sales_vs_rentals: AdminMetricRow[];
  top_products: AdminMetricRow[];
  category_performance: AdminMetricRow[];
  inventory: {
    summary: AdminMetricRow;
    critical_stock: AdminMetricRow[];
    movements: AdminMetricRow[];
  };
  rentals: {
    summary: AdminMetricRow[];
    upcoming: AdminMetricRow[];
  };
  customers: {
    summary: AdminMetricRow;
    top: AdminMetricRow[];
    by_country: AdminMetricRow[];
    growth: AdminMetricRow[];
  };
  gift_cards: {
    liability: AdminMetricRow;
    summary: AdminMetricRow;
    by_type: AdminMetricRow[];
  };
  resales: {
    summary: AdminMetricRow;
    by_branch: AdminMetricRow[];
  };
  payments: {
    summary: AdminMetricRow;
    by_method: AdminMetricRow[];
    series: AdminMetricRow[];
  };
  reviews: {
    summary: AdminMetricRow;
    by_stars: AdminMetricRow[];
    top_products: AdminMetricRow[];
    recent: AdminMetricRow[];
  };
  branches_performance: AdminMetricRow[];
  alerts: AdminMetricRow[];
  notifications: AdminMetricRow[];
  recent_activity: AdminMetricRow[];
};
