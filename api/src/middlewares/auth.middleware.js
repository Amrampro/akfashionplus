import { verifyToken } from "../utils/jwt.js";
import { fail } from "../utils/apiResponse.js";
import { query } from "../config/database.js";

function bearerToken(req) {
  return req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
}

async function userFromRequest(req) {
  const payload = verifyToken(bearerToken(req));
  if (!payload?.id) return null;

  const rows = await query(
    `SELECT id, role, branch_id, preferred_language, status
     FROM users
     WHERE id = :id
     LIMIT 1`,
    { id: payload.id },
  );

  const user = rows[0];
  if (!user) return null;

  return {
    ...payload,
    id: user.id,
    role: user.role,
    branch_id: user.branch_id,
    preferred_language: user.preferred_language,
    status: user.status,
  };
}

export async function optionalAuth(req, _res, next) {
  try {
    const user = await userFromRequest(req);
    req.user = user?.status === "active" ? user : null;
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function requireAuth(req, res, next) {
  try {
    const user = await userFromRequest(req);

    if (!user) return fail(res, 401, "Authentication required");
    if (user.status !== "active") return fail(res, 403, "Account is inactive");

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
