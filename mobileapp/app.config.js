const fs = require("fs");
const path = require("path");

const appJson = require("./app.json");

function readEnvFile() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return values;
      }

      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        return values;
      }

      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();

      values[key] = rawValue.replace(/^['"]|['"]$/g, "");

      return values;
    }, {});
}

const env = readEnvFile();

module.exports = {
  ...appJson.expo,

  extra: {
    ...(appJson.expo.extra || {}),

    apiUrl:
      process.env.EXPO_PUBLIC_API_URL ||
      env.EXPO_PUBLIC_API_URL,

    stripePublishableKey:
      process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,

    eas: {
      projectId: "31d9a413-f38d-4d22-a93c-d4483589c1a5",
    },
  },
};