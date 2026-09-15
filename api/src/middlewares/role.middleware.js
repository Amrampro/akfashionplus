import { fail } from "../utils/apiResponse.js";

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, "Authentication required");
    if (!roles.includes(req.user.role))
      return fail(res, 403, "Insufficient permissions");
    return next();
  };
}
