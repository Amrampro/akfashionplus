import Constants from "expo-constants";

const cleanEnvValue = (value: string | undefined) =>
  value?.trim().replace(/,+$/, "").replace(/\/+$/, "");

const expoExtra = (Constants.expoConfig?.extra || {}) as {
  apiUrl?: string;
  webUrl?: string;
  stripePublishableKey?: string;
};

export const appConfig = {
  name: "AK Fashion Plus",
  apiUrl:
    cleanEnvValue(expoExtra.apiUrl) ||
    cleanEnvValue(process.env.EXPO_PUBLIC_API_URL) ||
    "http://192.168.129.0:3000/api",
  webUrl: (() => {
    const value = cleanEnvValue(expoExtra.webUrl) || cleanEnvValue(process.env.EXPO_PUBLIC_WEB_URL);
    if (value && !/localhost|127\.0\.0\.1/i.test(value)) return value;
    return "https://akfashionplus.com";
  })(),
  stripePublishableKey:
    cleanEnvValue(expoExtra.stripePublishableKey) ||
    cleanEnvValue(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) ||
    "",
  stripeReturnUrl: "akfashionplus://stripe-redirect",
};
