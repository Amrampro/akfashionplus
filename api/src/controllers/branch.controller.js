import { created, fail, ok } from "../utils/apiResponse.js";
import * as Branch from "../models/branch.model.js";

const writableFields = [
  "name",
  "code",
  "phone",
  "email",
  "address_line_1",
  "address_line_2",
  "city",
  "province",
  "postal_code",
  "country_code",
  "latitude",
  "longitude",
  "opening_hours",
  "status",
];

function pickPayload(body) {
  return Object.fromEntries(
    writableFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]]),
  );
}

export async function listBranches(req, res) {
  const rows = await Branch.listBranches({
    q: req.query.q,
    includeInactive: req.query.admin === "1",
  });
  return ok(res, rows);
}

export async function createBranch(req, res) {
  const required = ["name", "code", "address_line_1", "city"];
  const missing = required.filter((field) => !req.body[field]);

  if (missing.length) {
    return fail(res, 422, `Missing branch fields: ${missing.join(", ")}`);
  }

  const result = await Branch.createBranch({
    country_code: "AO",
    status: "active",
    ...pickPayload(req.body),
  });

  return created(res, { id: result.insertId }, "Branch created");
}

export async function updateBranch(req, res) {
  const payload = pickPayload(req.body);

  if (!Object.keys(payload).length) {
    return fail(res, 422, "No valid branch fields provided");
  }

  await Branch.updateBranch(req.params.id, payload);
  return ok(res, null, "Branch updated");
}

export async function deleteBranch(req, res) {
  await Branch.updateBranch(req.params.id, { status: "inactive" });
  return ok(res, null, "Branch deactivated");
}

export default {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch,
};
