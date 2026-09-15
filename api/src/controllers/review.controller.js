import { created, fail, ok } from "../utils/apiResponse.js";
import * as Review from "../models/review.model.js";

export async function listPublicReviews(req, res) {
  const rows = await Review.listPublicReviews(req.query.product_id);
  return ok(res, rows);
}

export async function listAdminReviews(req, res) {
  const rows = await Review.listAdminReviews(req.query);
  return ok(res, rows);
}

export async function createReview(req, res) {
  const rating = Number(req.body.rating);

  if (!req.body.product_id || rating < 1 || rating > 5) {
    return fail(res, 422, "Valid product and rating are required");
  }

  const result = await Review.createReview({
    product_id: req.body.product_id,
    user_id: req.user.id,
    order_item_id: req.body.order_item_id || null,
    rating,
    title: req.body.title || null,
    comment: req.body.comment || null,
  });

  return created(res, { id: result.insertId }, "Review submitted");
}

export async function moderateReview(req, res) {
  if (
    !["pending", "published", "rejected", "hidden"].includes(req.body.status)
  ) {
    return fail(res, 422, "Invalid review status");
  }

  await Review.moderateReview(
    req.params.id,
    req.body.status,
    req.body.admin_reply || null,
  );
  return ok(res, null, "Review moderated");
}

export default {
  listPublicReviews,
  listAdminReviews,
  createReview,
  moderateReview,
};
