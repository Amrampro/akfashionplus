import { transaction } from "../config/database.js";
import { created, fail, ok } from "../utils/apiResponse.js";
import * as Setting from "../models/setting.model.js";

export async function listSettings(_req, res) {
  const [settings, exchangeRate, exchangeHistory, deliveryCountries] =
    await Promise.all([
    Setting.listSettings(),
    Setting.currentExchangeRate(),
    Setting.exchangeRateHistory(),
    Setting.listDeliveryCountries({ includeInactive: true }),
  ]);

  return ok(res, {
    settings,
    exchange_rate_eur_to_aoa: exchangeRate,
    exchange_history: exchangeHistory,
    delivery_countries: deliveryCountries,
  });
}

function countryPayload(req) {
  const countryName = String(req.body.country_name || "").trim();
  const countryCode = String(req.body.country_code || "")
    .trim()
    .toUpperCase();
  const deliveryPrice = Number(req.body.delivery_price_eur);
  const status = req.body.status === "inactive" ? "inactive" : "active";
  const sortOrder = Number(req.body.sort_order || 0);

  if (!countryName) {
    throw Object.assign(new Error("Country is required"), { status: 422 });
  }

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw Object.assign(new Error("Country code must contain 2 letters"), {
      status: 422,
    });
  }

  if (!Number.isFinite(deliveryPrice) || deliveryPrice < 0) {
    throw Object.assign(new Error("Delivery price must be positive"), {
      status: 422,
    });
  }

  return {
    country_code: countryCode,
    country_name: countryName,
    delivery_price_eur: deliveryPrice,
    status,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

export async function listDeliveryCountries(req, res) {
  const includeInactive =
    req.query.include_inactive === "1" || req.query.include_inactive === "true";
  const rows = await Setting.listDeliveryCountries({ includeInactive });
  return ok(res, rows);
}

export async function createDeliveryCountry(req, res) {
  const payload = countryPayload(req);
  const result = await Setting.createDeliveryCountry(payload);
  return created(
    res,
    { id: result.insertId, ...payload },
    "Delivery country created",
  );
}

export async function updateDeliveryCountry(req, res) {
  const payload = countryPayload(req);
  await Setting.updateDeliveryCountry(req.params.id, payload);
  return ok(res, { id: Number(req.params.id), ...payload }, "Delivery country updated");
}

export async function deleteDeliveryCountry(req, res) {
  await Setting.deleteDeliveryCountry(req.params.id);
  return ok(res, null, "Delivery country deleted");
}

export async function updateSetting(req, res) {
  if (!req.body.setting_key) return fail(res, 422, "Setting key is required");

  await Setting.upsertSetting({
    setting_key: req.body.setting_key,
    setting_value: req.body.setting_value ?? null,
    description: req.body.description || null,
    updated_by: req.user.id,
  });

  return ok(res, null, "Setting updated");
}

export async function updateExchangeRate(req, res) {
  const rate = Number(req.body.rate);
  if (!rate || rate <= 0)
    return fail(res, 422, "Exchange rate must be positive");

  await transaction(async (connection) => {
    await Setting.disableCurrentExchangeRates(connection);
    const result = await Setting.createExchangeRate(
      rate,
      req.user.id,
      connection,
    );
    await Setting.writeExchangeRateAudit(
      result.insertId,
      rate,
      req.user.id,
      req.ip,
      connection,
    );
  });

  return created(res, { rate }, "Exchange rate updated");
}

export default {
  listSettings,
  listDeliveryCountries,
  createDeliveryCountry,
  updateDeliveryCountry,
  deleteDeliveryCountry,
  updateSetting,
  updateExchangeRate,
};
