import { created, fail, ok } from "../utils/apiResponse.js";
import { hashPassword } from "../utils/password.js";
import * as User from "../models/user.model.js";

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

const profileFields = [
  "first_name",
  "last_name",
  "phone",
  "preferred_language",
  "country_code",
  "avatar_url",
];

const adminFields = [
  "role",
  "branch_id",
  "first_name",
  "last_name",
  "phone",
  "preferred_language",
  "country_code",
  "avatar_url",
  "status",
];

function pick(body, fields) {
  return Object.fromEntries(
    fields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]]),
  );
}

export async function getProfile(req, res) {
  const user = await User.ensureReferralCode(await User.findUserById(req.user.id));
  return ok(res, sanitizeUser(user));
}

export async function updateProfile(req, res) {
  const payload = pick(req.body, profileFields);

  if (
    payload.preferred_language &&
    !["fr", "en", "pt"].includes(payload.preferred_language)
  ) {
    return fail(res, 422, "Invalid preferred language");
  }

  await User.updateUser(req.user.id, payload);
  const user = await User.ensureReferralCode(await User.findUserById(req.user.id));
  return ok(res, sanitizeUser(user), "Profile updated");
}

export async function uploadProfileAvatar(req, res) {
  if (!req.file) {
    return fail(res, 422, "Avatar image is required");
  }

  const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;
  await User.updateUser(req.user.id, { avatar_url: avatarUrl });
  const user = await User.ensureReferralCode(await User.findUserById(req.user.id));
  return ok(res, sanitizeUser(user), "Avatar uploaded");
}

export async function listUsers(req, res) {
  const result = await User.listUsers(req.query);
  return ok(res, result.rows.map(sanitizeUser), "ok", result.meta);
}

export async function createUser(req, res) {
  const required = ["first_name", "last_name", "email", "password"];
  const missing = required.filter((field) => !req.body[field]);

  if (missing.length) {
    return fail(res, 422, `Missing user fields: ${missing.join(", ")}`);
  }

  if (!["user", "cashier", "admin"].includes(req.body.role || "user")) {
    return fail(res, 422, "Invalid user role");
  }

  const result = await User.createUser({
    role: req.body.role || "user",
    branch_id: req.body.branch_id || null,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: String(req.body.email).toLowerCase(),
    phone: req.body.phone || null,
    password_hash: hashPassword(req.body.password),
    preferred_language: req.body.preferred_language || "pt",
    country_code: req.body.country_code || null,
    referral_code: null,
    status: req.body.status || "active",
  });

  await User.updateUser(result.insertId, {
    referral_code: User.generateReferralCode(result.insertId),
  });

  return created(res, { id: result.insertId }, "User created");
}

export async function updateUser(req, res) {
  const payload = pick(req.body, adminFields);

  if (!Object.keys(payload).length) {
    return fail(res, 422, "No valid user fields provided");
  }

  if (payload.role && !["user", "cashier", "admin"].includes(payload.role)) {
    return fail(res, 422, "Invalid user role");
  }

  if (
    payload.status &&
    !["active", "inactive", "blocked", "pending"].includes(payload.status)
  ) {
    return fail(res, 422, "Invalid user status");
  }

  await User.updateUser(req.params.id, payload);
  return ok(res, null, "User updated");
}

export async function setUserStatus(req, res) {
  if (!["active", "inactive", "blocked", "pending"].includes(req.body.status)) {
    return fail(res, 422, "Invalid user status");
  }

  await User.updateUser(req.params.id, { status: req.body.status });
  return ok(res, null, "User status updated");
}

export default {
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  listUsers,
  createUser,
  updateUser,
  setUserStatus,
};
