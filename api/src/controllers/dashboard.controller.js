import { ok } from "../utils/apiResponse.js";
import * as Dashboard from "../models/dashboard.model.js";

export async function getAdminDashboard(req, res) {
  const data = await Dashboard.getAdminDashboard(req.query);
  return ok(res, data);
}

export async function getCashierDashboard(req, res) {
  const data = await Dashboard.getCashierDashboard(
    req.user.branch_id || req.query.branch_id,
  );
  return ok(res, data);
}

export default { getAdminDashboard, getCashierDashboard };
