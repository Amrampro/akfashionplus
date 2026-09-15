import { endpoints } from "./apiEndpoints";
import { get, post } from "./api";

export const getGiftCardTypes = () => get(endpoints.giftCardTypes);
export const getGiftCards = () => get(endpoints.giftCards);
export const getGiftCardTransactions = (id: number) =>
  get(`${endpoints.giftCards}/${id}/transactions`);
export const createGiftCardMobilePaymentIntent = (body: unknown) =>
  post("/gift-cards/purchase/mobile-payment-intent", body);
