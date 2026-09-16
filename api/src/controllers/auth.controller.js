import { query } from "../config/database.js";
import { created, fail, ok } from "../utils/apiResponse.js";
import { signToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  ensureReferralCode,
  generateReferralCode,
} from "../models/user.model.js";

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export async function register(req, res) {
  const {
    first_name,
    last_name,
    email,
    password,
    phone = null,
    country_code = null,
    preferred_language = "pt",
    referral_code = null,
    ref = null,
  } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return fail(
      res,
      422,
      "First name, last name, email and password are required",
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(res, 422, "Invalid email address");
  }

  if (String(password).length < 8) {
    return fail(res, 422, "Password must contain at least 8 characters");
  }

  const language = ["fr", "en", "pt"].includes(preferred_language)
    ? preferred_language
    : "pt";

  try {
    const referralRows = referral_code || ref
      ? await query(
          "SELECT id FROM users WHERE referral_code = :referral_code LIMIT 1",
          { referral_code: String(referral_code || ref).trim() },
        )
      : [];
    const referredByUserId = referralRows[0]?.id || null;

    const result = await query(
      `INSERT INTO users (
        role,
        first_name,
        last_name,
        email,
        phone,
        password_hash,
        preferred_language,
        country_code,
        referral_code,
        referred_by_user_id,
        status
      )
      VALUES (
        'user',
        :first_name,
        :last_name,
        :email,
        :phone,
        :password_hash,
        :preferred_language,
        :country_code,
        :referral_code,
        :referred_by_user_id,
        'active'
      )`,
      {
        first_name,
        last_name,
        email: normalizeEmail(email),
        phone,
        password_hash: hashPassword(password),
        preferred_language: language,
        country_code,
        referral_code: null,
        referred_by_user_id: referredByUserId,
      },
    );

    const user = {
      id: result.insertId,
      role: "user",
      first_name,
      last_name,
      email: normalizeEmail(email),
      preferred_language: language,
      referral_code: generateReferralCode(result.insertId),
    };

    await query(
      "UPDATE users SET referral_code = :referral_code WHERE id = :id",
      { id: user.id, referral_code: user.referral_code },
    );

    return created(res, { user, token: signToken(user) }, "Account created");
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return fail(res, 409, "Email already exists");
    }
    throw error;
  }
}

export async function login(req, res) {
  const rows = await query("SELECT * FROM users WHERE email = :email LIMIT 1", {
    email: normalizeEmail(req.body.email),
  });
  const user = rows[0];

  if (!user || !verifyPassword(req.body.password || "", user.password_hash)) {
    return fail(res, 401, "Invalid credentials");
  }

  if (user.status !== "active") {
    return fail(res, 403, "Account is not active");
  }

  await query("UPDATE users SET last_login_at = NOW() WHERE id = :id", {
    id: user.id,
  });

  const token = signToken({
    id: user.id,
    role: user.role,
    branch_id: user.branch_id,
    preferred_language: user.preferred_language,
  });

  return ok(res, { user: sanitizeUser(await ensureReferralCode(user)), token });
}

export async function me(req, res) {
  const rows = await query("SELECT * FROM users WHERE id = :id LIMIT 1", {
    id: req.user.id,
  });

  return ok(res, sanitizeUser(await ensureReferralCode(rows[0])));
}

export async function changePassword(req, res) {
  const { current_password, new_password } = req.body;

  if (!new_password || String(new_password).length < 8) {
    return fail(res, 422, "Password must contain at least 8 characters");
  }

  const rows = await query("SELECT password_hash FROM users WHERE id = :id", {
    id: req.user.id,
  });

  if (
    !rows[0] ||
    !verifyPassword(current_password || "", rows[0].password_hash)
  ) {
    return fail(res, 401, "Current password is invalid");
  }

  await query(
    "UPDATE users SET password_hash = :password_hash WHERE id = :id",
    {
      id: req.user.id,
      password_hash: hashPassword(new_password),
    },
  );

  return ok(res, null, "Password updated");
}

export async function forgotPassword(req, res) {
  const email = normalizeEmail(req.body.email);

  if (email) {
    await query(
      `INSERT INTO notifications (user_id, type, title, message)
       SELECT id, 'password_reset', 'Password reset requested',
       'A password reset was requested for your account.'
       FROM users
       WHERE email = :email`,
      { email },
    );
  }

  return ok(res, null, "If the email exists, reset instructions will be sent");
}

export async function resetPassword(_req, res) {
  return fail(
    res,
    501,
    "Password reset tokens require an email provider configuration",
  );
}

export async function logout(_req, res) {
  return ok(res, null, "Logged out");
}

export default {
  register,
  login,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
};
