import { transaction } from "../config/database.js";
import { fail, ok } from "../utils/apiResponse.js";
import * as Resale from "../models/resale.model.js";

const statuses = new Set([
  "pending",
  "approved",
  "ready_for_payout",
  "paid",
  "rejected",
  "cancelled",
]);

export async function listResales(req, res) {
  const rows = await Resale.listResales(req.user, req.query);
  return ok(res, rows);
}

export async function updateResaleStatus(req, res) {
  if (!statuses.has(req.body.status))
    return fail(res, 422, "Invalid resale status");
  if (req.body.status === "paid")
    return fail(res, 422, "Use the payout endpoint to mark paid");

  await Resale.updateResaleStatus(req.params.id, {
    status: req.body.status,
    approved_by: req.user.id,
    notes: req.body.notes || null,
  });

  return ok(res, null, "Resale updated");
}

export async function payResale(req, res) {
  await transaction(async (connection) => {
    const resale = await Resale.lockResale(req.params.id, connection);
    if (!resale)
      throw Object.assign(new Error("Resale not found"), { status: 404 });
    if (resale.status === "paid") {
      throw Object.assign(new Error("Resale already paid"), { status: 409 });
    }
    if (
      req.user.role === "cashier" &&
      req.user.branch_id &&
      Number(resale.branch_id) !== Number(req.user.branch_id)
    ) {
      throw Object.assign(new Error("Wrong branch"), { status: 403 });
    }

    await Resale.payResale(
      resale.id,
      {
        cashier_id: req.user.id,
        identity_document_type: req.body.identity_document_type || null,
        identity_document_number: req.body.identity_document_number || null,
        notes: req.body.notes || null,
      },
      connection,
    );
  });

  return ok(res, null, "Resale payout recorded");
}

export default { listResales, updateResaleStatus, payResale };
