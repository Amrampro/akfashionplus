import { endpoints } from './apiEndpoints'; import { post } from './api'; export const createStripeIntent = (body: unknown) => post(endpoints.payments.stripeIntent, body);
