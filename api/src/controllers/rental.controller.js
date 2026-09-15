import { fail, ok } from "../utils/apiResponse.js";
import { transaction } from "../config/database.js";
import * as Rental from "../models/rental.model.js";

const rentalStatuses = new Set([
  "reserved",
  "ready_for_pickup",
  "active",
  "return_due",
  "overdue",
  "returned",
  "damaged",
  "lost",
  "cancelled",
]);

export async function listRentals(req, res) {
  const rows = await Rental.listRentals(req.user, req.query);
  return ok(res, rows);
}

export async function checkAvailability(req, res) {
  const {
    product_variant_id,
    rental_start_date,
    rental_end_date,
    quantity = 1,
  } = req.query;

  if (!product_variant_id || !rental_start_date || !rental_end_date) {
    return fail(res, 422, "Variant and rental dates are required");
  }

  const available = await Rental.isAvailable({
    product_variant_id,
    rental_start_date,
    rental_end_date,
    quantity: Number(quantity),
  });

  return ok(res, { available });
}

export async function updateRentalStatus(req, res) {
  if (!rentalStatuses.has(req.body.status))
    return fail(res, 422, "Invalid rental status");

  await transaction(async (connection) => {
    const rental = await Rental.lockRentalOrderItem(
      req.params.orderItemId,
      connection,
    );

    if (!rental) {
      throw Object.assign(new Error("Rental item not found"), { status: 404 });
    }

    if (req.user.role === "cashier") {
      if (!req.user.branch_id) {
        throw Object.assign(
          new Error("Aucun guichet n'est assigne a ce compte caissier"),
          { status: 403 },
        );
      }

      if (
        rental.branch_id &&
        Number(rental.branch_id) !== Number(req.user.branch_id)
      ) {
        throw Object.assign(
          new Error("Cette location appartient a un autre guichet"),
          { status: 403 },
        );
      }

      if (!rental.branch_id) {
        await Rental.assignOrderBranch(
          rental.order_id,
          req.user.branch_id,
          connection,
        );
      }
    }

    await Rental.updateRentalStatus(
      req.params.orderItemId,
      {
        status: req.body.status,
        late_fee: req.body.rental_late_fee_eur ?? null,
        damage_fee: req.body.rental_damage_fee_eur ?? null,
        notes: req.body.notes || null,
      },
      connection,
    );
  });

  return ok(res, null, "Rental updated");
}

export default { listRentals, checkAvailability, updateRentalStatus };
