import { db, query } from "../config/database.js";

const PERIOD_DAYS = {
  today: 0,
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

function parseDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  return value;
}

function buildFilters(filters = {}) {
  const period = String(filters.period || "30d");
  const customStart = parseDate(filters.start_date || filters.startDate);
  const customEnd = parseDate(filters.end_date || filters.endDate);
  const branchId = Number(filters.branch_id || filters.branchId || 0) || null;
  const activityType = String(
    filters.activity_type || filters.activityType || "all",
  );
  const days = PERIOD_DAYS[period] ?? PERIOD_DAYS["30d"];

  const params = {
    branch_id: branchId,
    activity_type: activityType,
    start_date: customStart,
    end_date: customEnd,
    days,
    previous_days: days * 2,
  };

  const periodClause =
    customStart && customEnd
      ? "BETWEEN :start_date AND DATE_ADD(:end_date, INTERVAL 1 DAY)"
      : days === 0
        ? ">= CURDATE()"
        : ">= DATE_SUB(CURDATE(), INTERVAL :days DAY)";

  const orderWhere = [
    `o.created_at ${periodClause}`,
    "(:branch_id IS NULL OR o.branch_id = :branch_id)",
  ];

  if (activityType === "sales") {
    orderWhere.push(
      "EXISTS (SELECT 1 FROM order_items oi_filter WHERE oi_filter.order_id = o.id AND oi_filter.item_type = 'purchase')",
    );
  }

  if (activityType === "rentals") {
    orderWhere.push(
      "EXISTS (SELECT 1 FROM order_items oi_filter WHERE oi_filter.order_id = o.id AND oi_filter.item_type = 'rental')",
    );
  }

  const currentWhere = orderWhere.join(" AND ");
  const previousWhere = [
    customStart && customEnd
      ? `o.created_at BETWEEN DATE_SUB(:start_date, INTERVAL DATEDIFF(:end_date, :start_date) + 1 DAY)
         AND :start_date`
      : days === 0
        ? "DATE(o.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)"
        : `o.created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL :previous_days DAY)
           AND DATE_SUB(CURDATE(), INTERVAL :days DAY)`,
    "(:branch_id IS NULL OR o.branch_id = :branch_id)",
  ].join(" AND ");

  return {
    params,
    currentWhere,
    previousWhere,
    periodClause,
    applied: {
      period,
      start_date: customStart,
      end_date: customEnd,
      branch_id: branchId,
      activity_type: activityType,
    },
  };
}

function trend(current, previous) {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (!previousValue) return currentValue ? 100 : 0;
  return (
    Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10
  );
}

function number(value) {
  return Number(value || 0);
}

export async function getAdminDashboard(filters = {}) {
  const scope = buildFilters(filters);
  const params = scope.params;

  const [
    branches,
    overviewRows,
    previousRows,
    productRows,
    activeRentals,
    giftCardRows,
    resaleRows,
    revenueSeries,
    orderStatuses,
    salesVsRentals,
    topProducts,
    categoryPerformance,
    inventorySummary,
    criticalStock,
    inventoryMovements,
    rentalSummary,
    upcomingRentals,
    customerSummary,
    topCustomers,
    customersByCountry,
    customerGrowth,
    giftCardSummary,
    giftCardsByType,
    resaleSummary,
    resalesByBranch,
    paymentSummary,
    paymentsByMethod,
    paymentSeries,
    reviewSummary,
    reviewsByStars,
    reviewedProducts,
    recentReviews,
    branchPerformance,
    notifications,
    auditLogs,
    recentOrders,
  ] = await Promise.all([
    query(
      `SELECT id, name, code, city, country_code, status
       FROM branches
       ORDER BY status = 'active' DESC, name ASC`,
    ),
    query(
      `SELECT
        COUNT(*) AS total_orders,
        SUM(CASE WHEN o.payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_orders,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_eur ELSE 0 END), 0) AS revenue_eur,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_aoa ELSE 0 END), 0) AS revenue_aoa,
        COALESCE(AVG(CASE WHEN o.payment_status = 'paid' THEN o.total_eur END), 0) AS average_order_value_eur,
        SUM(CASE WHEN o.status = 'pending_payment' THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) AS completed_orders
       FROM orders o
       WHERE ${scope.currentWhere}`,
      params,
    ),
    query(
      `SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_eur ELSE 0 END), 0) AS revenue_eur
       FROM orders o
       WHERE ${scope.previousWhere}`,
      params,
    ),
    query(
      `SELECT
        COUNT(*) AS total_products,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_products,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_products,
        SUM(CASE WHEN sale_enabled = TRUE THEN 1 ELSE 0 END) AS sale_enabled_products,
        SUM(CASE WHEN rental_enabled = TRUE THEN 1 ELSE 0 END) AS rental_enabled_products,
        SUM(CASE WHEN condition_type = 'second_hand' THEN 1 ELSE 0 END) AS second_hand_products
       FROM products`,
    ),
    query("SELECT COUNT(*) AS active_rentals FROM v_active_rentals"),
    query("SELECT * FROM v_gift_card_liability"),
    query(
      `SELECT
        COUNT(*) AS pending_resales,
        COALESCE(SUM(payout_amount_aoa), 0) AS pending_payout_aoa
       FROM company_resales
       WHERE status IN ('approved', 'ready_for_payout')
         AND (:branch_id IS NULL OR branch_id = :branch_id)`,
      params,
    ),
    query(
      `SELECT
        DATE(o.created_at) AS date,
        DATE_FORMAT(o.created_at, '%d/%m') AS label,
        COUNT(*) AS orders,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_eur ELSE 0 END), 0) AS revenue_eur
       FROM orders o
       WHERE ${scope.currentWhere}
       GROUP BY DATE(o.created_at)
       ORDER BY DATE(o.created_at) ASC`,
      params,
    ),
    query(
      `SELECT o.status, COUNT(*) AS count
       FROM orders o
       WHERE ${scope.currentWhere}
       GROUP BY o.status
       ORDER BY count DESC`,
      params,
    ),
    query(
      `SELECT
        oi.item_type,
        COUNT(*) AS total_lines,
        COALESCE(SUM(oi.quantity), 0) AS quantity,
        COALESCE(SUM(oi.line_total_eur), 0) AS revenue_eur,
        COALESCE(AVG(oi.line_total_eur), 0) AS average_line_eur
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE ${scope.currentWhere} AND o.payment_status = 'paid'
       GROUP BY oi.item_type`,
      params,
    ),
    query(
      `SELECT
        oi.product_id,
        oi.product_name,
        c.name_fr AS category_name,
        COUNT(*) AS total_lines,
        COALESCE(SUM(oi.quantity), 0) AS total_quantity,
        COALESCE(SUM(oi.line_total_eur), 0) AS revenue_eur
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       INNER JOIN products p ON p.id = oi.product_id
       INNER JOIN categories c ON c.id = p.category_id
       WHERE ${scope.currentWhere} AND o.payment_status = 'paid'
       GROUP BY oi.product_id, oi.product_name, c.name_fr
       ORDER BY revenue_eur DESC, total_quantity DESC
       LIMIT 8`,
      params,
    ),
    query(
      `SELECT
        c.id,
        c.name_fr AS category_name,
        COUNT(DISTINCT p.id) AS products,
        COALESCE(SUM(oi.quantity), 0) AS units_sold,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN oi.line_total_eur ELSE 0 END), 0) AS revenue_eur
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id AND ${scope.currentWhere}
       GROUP BY c.id, c.name_fr
       ORDER BY revenue_eur DESC, products DESC
       LIMIT 10`,
      params,
    ),
    query(
      `SELECT
        COUNT(*) AS variants,
        COALESCE(SUM(stock_quantity), 0) AS stock_quantity,
        COALESCE(SUM(reserved_quantity), 0) AS reserved_quantity,
        SUM(CASE WHEN stock_quantity <= reserved_quantity THEN 1 ELSE 0 END) AS out_of_stock,
        SUM(CASE WHEN stock_quantity - reserved_quantity BETWEEN 1 AND 3 THEN 1 ELSE 0 END) AS low_stock
       FROM product_variants
       WHERE status = 'active'`,
    ),
    query(
      `SELECT
        pv.id,
        p.name_fr AS product_name,
        pv.size,
        pv.color_name,
        pv.stock_quantity,
        pv.reserved_quantity,
        (pv.stock_quantity - pv.reserved_quantity) AS available_quantity
       FROM product_variants pv
       INNER JOIN products p ON p.id = pv.product_id
       WHERE pv.status = 'active'
         AND (pv.stock_quantity - pv.reserved_quantity) <= 3
       ORDER BY available_quantity ASC, p.name_fr ASC
       LIMIT 10`,
    ),
    query(
      `SELECT
        im.movement_type,
        im.quantity_change,
        im.quantity_before,
        im.quantity_after,
        im.created_at,
        p.name_fr AS product_name,
        pv.size,
        pv.color_name,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS actor_name
       FROM inventory_movements im
       INNER JOIN product_variants pv ON pv.id = im.product_variant_id
       INNER JOIN products p ON p.id = pv.product_id
       LEFT JOIN users u ON u.id = im.created_by
       ORDER BY im.created_at DESC
       LIMIT 8`,
    ),
    query(
      `SELECT
        oi.rental_status,
        COUNT(*) AS count,
        COALESCE(SUM(oi.line_total_eur), 0) AS revenue_eur,
        COALESCE(SUM(oi.rental_deposit_eur), 0) AS deposits_eur
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE oi.item_type = 'rental'
         AND ${scope.currentWhere}
       GROUP BY oi.rental_status`,
      params,
    ),
    query(
      `SELECT
        oi.id,
        o.order_number,
        oi.product_name,
        oi.rental_start_date,
        oi.rental_end_date,
        oi.rental_days,
        oi.rental_status,
        oi.rental_price_per_day_eur,
        oi.line_total_eur,
        CONCAT(u.first_name, ' ', u.last_name) AS customer_name
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       INNER JOIN users u ON u.id = o.user_id
       WHERE oi.item_type = 'rental'
         AND oi.rental_status IN ('reserved', 'ready_for_pickup', 'active', 'return_due', 'overdue')
         AND (:branch_id IS NULL OR o.branch_id = :branch_id)
       ORDER BY oi.rental_start_date ASC, oi.rental_end_date ASC
       LIMIT 8`,
      params,
    ),
    query(
      `SELECT
        COUNT(*) AS total_customers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_customers,
        SUM(CASE WHEN created_at ${scope.periodClause} THEN 1 ELSE 0 END) AS new_customers
       FROM users
       WHERE role = 'user'`,
      params,
    ),
    query(
      `SELECT
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
        u.email,
        COUNT(o.id) AS orders,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_eur ELSE 0 END), 0) AS spent_eur
       FROM users u
       INNER JOIN orders o ON o.user_id = u.id
       WHERE u.role = 'user' AND ${scope.currentWhere}
       GROUP BY u.id, u.first_name, u.last_name, u.email
       ORDER BY spent_eur DESC
       LIMIT 8`,
      params,
    ),
    query(
      `SELECT COALESCE(country_code, 'ND') AS country_code, COUNT(*) AS customers
       FROM users
       WHERE role = 'user'
       GROUP BY COALESCE(country_code, 'ND')
       ORDER BY customers DESC
       LIMIT 8`,
    ),
    query(
      `SELECT DATE(created_at) AS date, DATE_FORMAT(created_at, '%d/%m') AS label, COUNT(*) AS customers
       FROM users
       WHERE role = 'user' AND created_at ${scope.periodClause}
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      params,
    ),
    query(
      `SELECT
        COUNT(*) AS total_cards,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_cards,
        SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) AS pending_cards,
        COALESCE(SUM(initial_balance_eur), 0) AS initial_balance_eur,
        COALESCE(SUM(current_balance_eur), 0) AS current_balance_eur,
        COALESCE(SUM(reserved_balance_eur), 0) AS reserved_balance_eur
       FROM gift_cards
       WHERE created_at ${scope.periodClause}`,
      params,
    ),
    query(
      `SELECT
        gct.name,
        gct.code,
        gct.value_eur,
        COUNT(gc.id) AS issued_cards,
        COALESCE(SUM(gc.current_balance_eur), 0) AS current_balance_eur
       FROM gift_card_types gct
       LEFT JOIN gift_cards gc ON gc.gift_card_type_id = gct.id
       GROUP BY gct.id, gct.name, gct.code, gct.value_eur
       ORDER BY gct.value_eur DESC`,
    ),
    query(
      `SELECT
        COUNT(*) AS total_resales,
        SUM(CASE WHEN status IN ('approved', 'ready_for_payout') THEN 1 ELSE 0 END) AS pending_payouts,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_resales,
        COALESCE(SUM(amount_eur), 0) AS amount_eur,
        COALESCE(SUM(payout_amount_aoa), 0) AS payout_aoa
       FROM company_resales
       WHERE created_at ${scope.periodClause}
         AND (:branch_id IS NULL OR branch_id = :branch_id)`,
      params,
    ),
    query(
      `SELECT
        b.name AS branch_name,
        COUNT(cr.id) AS operations,
        COALESCE(SUM(cr.payout_amount_aoa), 0) AS payout_aoa
       FROM branches b
       LEFT JOIN company_resales cr ON cr.branch_id = b.id
         AND cr.created_at ${scope.periodClause}
       GROUP BY b.id, b.name
       ORDER BY payout_aoa DESC`,
      params,
    ),
    query(
      `SELECT
        COUNT(*) AS total_payments,
        SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded_payments,
        SUM(CASE WHEN status IN ('pending', 'reserved', 'requires_action') THEN 1 ELSE 0 END) AS pending_payments,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_payments,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount_eur ELSE 0 END), 0) AS succeeded_amount_eur
       FROM payments
       WHERE created_at ${scope.periodClause}`,
      params,
    ),
    query(
      `SELECT method, purpose, status, COUNT(*) AS payments, COALESCE(SUM(amount_eur), 0) AS amount_eur
       FROM payments
       WHERE created_at ${scope.periodClause}
       GROUP BY method, purpose, status
       ORDER BY amount_eur DESC`,
      params,
    ),
    query(
      `SELECT DATE(created_at) AS date, DATE_FORMAT(created_at, '%d/%m') AS label,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount_eur ELSE 0 END), 0) AS amount_eur
       FROM payments
       WHERE created_at ${scope.periodClause}
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      params,
    ),
    query(
      `SELECT
        COUNT(*) AS total_reviews,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_reviews,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_reviews,
        COALESCE(AVG(CASE WHEN status = 'published' THEN rating END), 0) AS average_rating
       FROM product_reviews
       WHERE created_at ${scope.periodClause}`,
      params,
    ),
    query(
      `SELECT rating, COUNT(*) AS reviews
       FROM product_reviews
       WHERE status = 'published'
       GROUP BY rating
       ORDER BY rating DESC`,
    ),
    query(
      `SELECT
        p.id,
        p.name_fr AS product_name,
        COUNT(pr.id) AS reviews,
        COALESCE(AVG(pr.rating), 0) AS average_rating
       FROM products p
       INNER JOIN product_reviews pr ON pr.product_id = p.id AND pr.status = 'published'
       GROUP BY p.id, p.name_fr
       ORDER BY average_rating DESC, reviews DESC
       LIMIT 8`,
    ),
    query(
      `SELECT
        pr.id,
        pr.rating,
        pr.title,
        pr.comment,
        pr.status,
        pr.created_at,
        p.name_fr AS product_name,
        CONCAT(u.first_name, ' ', u.last_name) AS customer_name
       FROM product_reviews pr
       INNER JOIN products p ON p.id = pr.product_id
       INNER JOIN users u ON u.id = pr.user_id
       ORDER BY pr.created_at DESC
       LIMIT 8`,
    ),
    query(
      `SELECT
        COALESCE(b.id, 0) AS branch_id,
        COALESCE(b.name, 'Livraison') AS branch_name,
        COUNT(o.id) AS orders,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_eur ELSE 0 END), 0) AS revenue_eur,
        SUM(CASE WHEN o.status = 'ready_for_pickup' THEN 1 ELSE 0 END) AS ready_for_pickup
       FROM orders o
       LEFT JOIN branches b ON b.id = o.branch_id
       WHERE ${scope.currentWhere}
       GROUP BY COALESCE(b.id, 0), COALESCE(b.name, 'Livraison')
       ORDER BY revenue_eur DESC`,
      params,
    ),
    query(
      `SELECT id, type, title, message, is_read, created_at
       FROM notifications
       ORDER BY created_at DESC
       LIMIT 8`,
    ),
    query(
      `SELECT
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.created_at,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS actor_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT 8`,
    ),
    query(
      `SELECT
        o.id,
        o.order_number,
        o.status,
        o.payment_status,
        o.total_eur,
        o.created_at,
        CONCAT(u.first_name, ' ', u.last_name) AS customer_name
       FROM orders o
       INNER JOIN users u ON u.id = o.user_id
       WHERE ${scope.currentWhere}
       ORDER BY o.created_at DESC
       LIMIT 8`,
      params,
    ),
  ]);

  const overview = overviewRows[0] || {};
  const previous = previousRows[0] || {};
  const products = productRows[0] || {};
  const giftCards = giftCardRows[0] || {};
  const resales = resaleRows[0] || {};

  return {
    filters: scope.applied,
    branches,
    overview: {
      ...overview,
      revenue_trend: trend(overview.revenue_eur, previous.revenue_eur),
      orders_trend: trend(overview.total_orders, previous.total_orders),
      products_sold: salesVsRentals.reduce(
        (sum, row) => sum + number(row.quantity),
        0,
      ),
      total_customers: customerSummary[0]?.total_customers || 0,
      new_customers: customerSummary[0]?.new_customers || 0,
      total_products: products.total_products || 0,
      active_products: products.active_products || 0,
      active_rentals: activeRentals[0]?.active_rentals || 0,
      active_gift_cards: giftCards.active_cards || 0,
      gift_card_balance_eur: giftCards.total_balance_eur || 0,
      resale_payout_aoa: resales.pending_payout_aoa || 0,
      pending_resales: resales.pending_resales || 0,
    },
    products,
    revenue_series: revenueSeries,
    order_statuses: orderStatuses,
    sales_vs_rentals: salesVsRentals,
    top_products: topProducts,
    category_performance: categoryPerformance,
    inventory: {
      summary: inventorySummary[0] || {},
      critical_stock: criticalStock,
      movements: inventoryMovements,
    },
    rentals: {
      summary: rentalSummary,
      upcoming: upcomingRentals,
    },
    customers: {
      summary: customerSummary[0] || {},
      top: topCustomers,
      by_country: customersByCountry,
      growth: customerGrowth,
    },
    gift_cards: {
      liability: giftCards,
      summary: giftCardSummary[0] || {},
      by_type: giftCardsByType,
    },
    resales: {
      summary: resaleSummary[0] || {},
      by_branch: resalesByBranch,
    },
    payments: {
      summary: paymentSummary[0] || {},
      by_method: paymentsByMethod,
      series: paymentSeries,
    },
    reviews: {
      summary: reviewSummary[0] || {},
      by_stars: reviewsByStars,
      top_products: reviewedProducts,
      recent: recentReviews,
    },
    branches_performance: branchPerformance,
    alerts: [
      ...criticalStock.slice(0, 4).map((item) => ({
        type: "stock",
        title: "Stock critique",
        message:
          `${item.product_name} ${item.size || ""} ${item.color_name || ""}`.trim(),
        severity: number(item.available_quantity) <= 0 ? "high" : "medium",
      })),
      ...upcomingRentals
        .filter((item) => item.rental_status === "overdue")
        .slice(0, 4)
        .map((item) => ({
          type: "rental",
          title: "Location en retard",
          message: `${item.product_name} - ${item.order_number}`,
          severity: "high",
        })),
    ],
    notifications,
    recent_activity: [
      ...recentOrders.map((order) => ({
        id: `order-${order.id}`,
        type: "Commande",
        label: order.order_number,
        actor: order.customer_name,
        status: order.status,
        amount_eur: order.total_eur,
        created_at: order.created_at,
      })),
      ...auditLogs.map((log) => ({
        id: `audit-${log.id}`,
        type: "Audit",
        label: log.action,
        actor: log.actor_name?.trim() || "Systeme",
        status: log.entity_type,
        amount_eur: null,
        created_at: log.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 12),
  };
}

export async function getCashierDashboard(branchId) {
  const [pickups, payouts, rentals] = await Promise.all([
    query(
      `SELECT COUNT(*) pending_pickups
       FROM orders
       WHERE fulfillment_type = 'pickup'
         AND (:branch_id IS NULL OR branch_id = :branch_id)
         AND status IN ('paid', 'ready_for_pickup')`,
      { branch_id: branchId || null },
    ),
    query(
      `SELECT COUNT(*) pending_payouts,
        COALESCE(SUM(payout_amount_aoa), 0) payout_aoa
       FROM company_resales
       WHERE (:branch_id IS NULL OR branch_id = :branch_id)
         AND status IN ('approved', 'ready_for_payout')`,
      { branch_id: branchId || null },
    ),
    query(
      `SELECT COUNT(*) rentals_to_handle
       FROM v_active_rentals ar
       INNER JOIN orders o ON o.id = ar.order_id
       WHERE (:branch_id IS NULL OR o.branch_id = :branch_id)`,
      { branch_id: branchId || null },
    ),
  ]);

  return { ...pickups[0], ...payouts[0], ...rentals[0] };
}

export async function listPendingPickups(branchId, search = null) {
  return query(
    `SELECT id, order_number, beneficiary_name, beneficiary_phone, total_eur, total_aoa, status
     FROM orders
     WHERE fulfillment_type = 'pickup'
       AND (:branch_id IS NULL OR branch_id = :branch_id)
       AND status IN ('paid', 'ready_for_pickup')
       AND (:q IS NULL OR order_number LIKE :like OR beneficiary_name LIKE :like OR beneficiary_phone LIKE :like)
     ORDER BY created_at DESC`,
    {
      branch_id: branchId || null,
      q: search || null,
      like: `%${search || ""}%`,
    },
  );
}

export async function lockPickupOrder(orderId, connection = db) {
  const [rows] = await connection.execute(
    "SELECT * FROM orders WHERE id = ? FOR UPDATE",
    [orderId],
  );
  return rows[0] || null;
}

export async function createPickupRecord(payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO order_pickups (
      order_id,
      branch_id,
      cashier_id,
      pickup_type,
      beneficiary_name,
      beneficiary_phone,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.order_id,
      payload.branch_id,
      payload.cashier_id,
      payload.pickup_type,
      payload.beneficiary_name,
      payload.beneficiary_phone,
      payload.notes,
    ],
  );
  return result;
}

export async function completeOrder(orderId, connection = db) {
  const [result] = await connection.execute(
    "UPDATE orders SET status = 'completed', completed_at = NOW() WHERE id = ?",
    [orderId],
  );
  return result;
}

export async function assignOrderBranch(orderId, branchId, connection = db) {
  const [result] = await connection.execute(
    "UPDATE orders SET branch_id = ? WHERE id = ? AND branch_id IS NULL",
    [branchId, orderId],
  );
  return result;
}

export async function listBranchHistory(branchId) {
  return query(
    `SELECT op.*, o.order_number
     FROM order_pickups op
     INNER JOIN orders o ON o.id = op.order_id
     WHERE (:branch_id IS NULL OR op.branch_id = :branch_id)
     ORDER BY op.completed_at DESC
     LIMIT 100`,
    { branch_id: branchId || null },
  );
}

export default {
  getAdminDashboard,
  getCashierDashboard,
  listPendingPickups,
  lockPickupOrder,
  assignOrderBranch,
  createPickupRecord,
  completeOrder,
  listBranchHistory,
};
