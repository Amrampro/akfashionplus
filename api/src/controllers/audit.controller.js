import { ok } from "../utils/apiResponse.js";
import * as Audit from "../models/audit.model.js";

export async function listAuditLogs(req, res) {
  const result = await Audit.listAuditLogs(req.query);
  return ok(res, result.rows, "ok", result.meta);
}

export default { listAuditLogs };
