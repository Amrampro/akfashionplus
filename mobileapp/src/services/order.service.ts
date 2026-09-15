import { endpoints } from "./apiEndpoints";
import { get, post } from "./api";

export const checkout = (body: unknown) => post(endpoints.checkout, body);
export const directCheckout = (body: unknown) => post(endpoints.directCheckout, body);
export const getOrders = () => get(endpoints.orders);
export const getOrder = <T = unknown>(id: number) =>
  get<T>(`${endpoints.orders}/${id}`);
export const cancelPendingOrderPayment = (id: number) =>
  post(`${endpoints.orders}/${id}/cancel-pending-payment`, {});
