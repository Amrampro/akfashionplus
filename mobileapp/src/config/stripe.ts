import { appConfig } from "./app";

export const stripeConfig = {
  publishableKey: appConfig.stripePublishableKey,
  returnUrl: appConfig.stripeReturnUrl,
};
