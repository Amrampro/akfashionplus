import { stripe } from "../config/stripe.js";
import { fail, ok } from "../utils/apiResponse.js";
import * as Webhook from "../models/payment.model.js";

export async function handleStripeWebhook(req, res) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return fail(res, 503, "Stripe webhook is not configured");
  }

  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody || JSON.stringify(req.body),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return fail(res, 400, `Invalid Stripe signature: ${error.message}`);
  }

  const inserted = await Webhook.recordStripeEvent(event);
  if (!inserted) return ok(res, { ignored: true }, "Webhook already received");

  if (event.type === "payment_intent.succeeded") {
    await Webhook.markStripePaymentSucceeded(event.data.object.id);
  } else if (event.type === "payment_intent.payment_failed") {
    await Webhook.markStripePaymentFailed(
      event.data.object.id,
      event.data.object.last_payment_error?.message || "Payment failed",
    );
  } else if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (paymentIntentId) {
      await Webhook.attachStripePaymentIntentToCheckoutSession(
        session.id,
        paymentIntentId,
      );
      await Webhook.markStripePaymentSucceeded(paymentIntentId);
    }
  }

  await Webhook.markStripeEventProcessed(event.id);
  return ok(res, { received: true });
}

export default { handleStripeWebhook };
