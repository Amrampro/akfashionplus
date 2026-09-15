import { transaction } from "../config/database.js";
import { ok } from "../utils/apiResponse.js";
import * as Cashier from "../models/dashboard.model.js";

function cashierBranch(req) {
  return Number(req.user.branch_id || req.query.branch_id || 0) || null;
}

export async function getCashierDashboard(req, res) {
  const branchId = cashierBranch(req);
  const data = await Cashier.getCashierDashboard(branchId);
  return ok(res, data);
}

export async function listPendingPickups(req, res) {
  const branchId = cashierBranch(req);
  const rows = await Cashier.listPendingPickups(branchId, req.query.q);
  return ok(res, rows);
}

export async function completePickup(req, res) {
  await transaction(async (connection) => {
    const order = await Cashier.lockPickupOrder(req.params.orderId, connection);

    if (!order) {
      throw Object.assign(new Error("Order not found"), { status: 404 });
    }

    if (
      req.user.role === "cashier" &&
      req.user.branch_id &&
      order.branch_id &&
      Number(order.branch_id) !== Number(req.user.branch_id)
    ) {
      throw Object.assign(
        new Error("Cette commande appartient a un autre guichet"),
        { status: 403 },
      );
    }

    if (req.user.role === "cashier" && !req.user.branch_id) {
      throw Object.assign(
        new Error("Aucun guichet n'est assigne a ce compte caissier"),
        { status: 403 },
      );
    }

    const branchId = order.branch_id || req.user.branch_id;

    await Cashier.createPickupRecord(
      {
        order_id: order.id,
        branch_id: branchId,
        cashier_id: req.user.id,
        pickup_type: "order_pickup",
        beneficiary_name:
          order.beneficiary_name || req.body.beneficiary_name || "Beneficiary",
        beneficiary_phone:
          order.beneficiary_phone || req.body.beneficiary_phone || null,
        notes: req.body.notes || null,
      },
      connection,
    );

    if (!order.branch_id && branchId) {
      await Cashier.assignOrderBranch(order.id, branchId, connection);
    }

    await Cashier.completeOrder(order.id, connection);
  });

  return ok(res, null, "Pickup completed");
}

export async function listBranchHistory(req, res) {
  const rows = await Cashier.listBranchHistory(cashierBranch(req));
  return ok(res, rows);
}

export default {
  getCashierDashboard,
  listPendingPickups,
  completePickup,
  listBranchHistory,
};
