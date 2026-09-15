import { endpoints } from "./apiEndpoints";
import { post } from "./api";

export type StripeIntentResponse = {
  payment_id?: number;
  payment_intent_id?: string;
  client_secret?: string;
  status?: string;
};

export const createStripeIntent = <T = StripeIntentResponse>(body: unknown) =>
  post<T>(endpoints.payments.stripeIntent, body);

export const syncStripeIntent = <T = unknown>(paymentIntentId: string) =>
  post<T>(endpoints.payments.syncStripeIntent(paymentIntentId));

export const createStripeCheckoutSession = (body: unknown) =>
  post(endpoints.payments.stripeCheckoutSession, body);
