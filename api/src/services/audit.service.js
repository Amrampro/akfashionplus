import { query } from "../config/database.js";

export async function writeAudit({
  userId = null,
  action,
  entityType,
  entityId = null,
  oldData = null,
  newData = null,
  ip = null,
}) {
  return query(
    `INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      old_data,
      new_data,
      ip_address
    )
    VALUES (
      :userId,
      :action,
      :entityType,
      :entityId,
      :oldData,
      :newData,
      :ip
    )`,
    {
      userId,
      action,
      entityType,
      entityId,
      oldData: oldData ? JSON.stringify(oldData) : null,
      newData: newData ? JSON.stringify(newData) : null,
      ip,
    },
  );
}

export default { writeAudit };
