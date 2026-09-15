import { fail } from "../utils/apiResponse.js";

export function notFound(_req, res) {
  return fail(res, 404, "Route not found");
}

export function errorMiddleware(error, req, res, _next) {
  console.error("========== AK FASHION PLUS ERROR ==========");
  console.error("Method:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("Message:", error?.message);
  console.error("Stack:", error?.stack);
  console.error("Full error:", error);
  console.error("===========================================");

  const status = error?.status || 500;

  const message =
    error?.message || "Internal server error";

  return fail(
    res,
    status,
    message,
  );
}