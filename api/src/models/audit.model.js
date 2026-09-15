import { query } from "../config/database.js";

export async function listAuditLogs(filters = {}) {
  const limit = Math.min(Math.max(Number(filters.limit || 50), 1), 100);
  const page = Math.max(Number(filters.page || 1), 1);
  const offset = (page - 1) * limit;
  const where = [];
  const params = { limit, offset };

  if (filters.action) {
    where.push("action = :action");
    params.action = filters.action;
  }

  if (filters.entity_type) {
    where.push("entity_type = :entity_type");
    params.entity_type = filters.entity_type;
  }

  const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = await query(
    `SELECT *
     FROM audit_logs
     ${sqlWhere}
     ORDER BY created_at DESC
     LIMIT :limit OFFSET :offset`,
    params,
  );
  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM audit_logs ${sqlWhere}`,
    params,
  );

  return { rows, meta: { page, limit, total } };
}

export default { listAuditLogs };
