import { transaction } from "../config/database.js";
import { created, fail, ok } from "../utils/apiResponse.js";
import * as Address from "../models/address.model.js";

const fields = [
  "label",
  "recipient_name",
  "recipient_phone",
  "address_line_1",
  "address_line_2",
  "city",
  "province",
  "postal_code",
  "country_code",
  "is_default",
];

function pick(body) {
  return Object.fromEntries(
    fields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]]),
  );
}

function validateAddress(body) {
  const required = ["recipient_name", "address_line_1", "city", "country_code"];
  const missing = required.filter((field) => !body[field]);
  return missing.length
    ? `Missing address fields: ${missing.join(", ")}`
    : null;
}

export async function listAddresses(req, res) {
  const rows = await Address.listAddresses(req.user.id);
  return ok(res, rows);
}

export async function createAddress(req, res) {
  const validationError = validateAddress(req.body);
  if (validationError) return fail(res, 422, validationError);

  const result = await transaction(async (connection) => {
    if (req.body.is_default) {
      await Address.clearDefault(req.user.id, connection);
    }
    return Address.createAddress(req.user.id, pick(req.body), connection);
  });

  return created(res, { id: result.insertId }, "Address created");
}

export async function updateAddress(req, res) {
  const payload = pick(req.body);
  if (!Object.keys(payload).length)
    return fail(res, 422, "No valid address fields provided");

  await transaction(async (connection) => {
    if (payload.is_default) {
      await Address.clearDefault(req.user.id, connection);
    }
    await Address.updateAddress(
      req.params.id,
      req.user.id,
      payload,
      connection,
    );
  });

  return ok(res, null, "Address updated");
}

export async function setDefaultAddress(req, res) {
  await transaction(async (connection) => {
    await Address.clearDefault(req.user.id, connection);
    await Address.updateAddress(
      req.params.id,
      req.user.id,
      { is_default: true },
      connection,
    );
  });
  return ok(res, null, "Default address updated");
}

export async function deleteAddress(req, res) {
  await Address.deleteAddress(req.params.id, req.user.id);
  return ok(res, null, "Address deleted");
}

export default {
  listAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
