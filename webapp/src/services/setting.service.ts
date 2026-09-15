import { endpoints } from "./apiEndpoints";
import { get, post } from "./api";

export const getSettings = () => get(endpoints.settings);
export const getDeliveryCountries = () =>
  get(`${endpoints.settings}/delivery-countries`);
export const updateExchangeRate = (rate: number) =>
  post("/settings/exchange-rate", { rate });
