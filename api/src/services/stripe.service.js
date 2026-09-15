import { stripe } from "../config/stripe.js";
export async function createPaymentIntent({ amountEur, metadata = {} }) {
  if (!stripe) return { configured: false };
  return stripe.paymentIntents.create({
    amount: Math.round(Number(amountEur) * 100),
    currency: "eur",
    metadata,
  });
}
export default { createPaymentIntent };
