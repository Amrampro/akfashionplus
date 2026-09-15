import { db, query } from "../config/database.js";

export async function listSettings() {
  return query("SELECT * FROM settings ORDER BY setting_key");
}

export async function currentExchangeRate() {
  const rows = await query("SELECT rate FROM v_current_exchange_rate LIMIT 1");
  return Number(rows[0]?.rate || 1000);
}

export async function exchangeRateHistory() {
  return query(
    `SELECT *
     FROM exchange_rates
     WHERE base_currency = 'EUR' AND quote_currency = 'AOA'
     ORDER BY created_at DESC
     LIMIT 50`,
  );
}

export async function listDeliveryCountries({ includeInactive = false } = {}) {
  return query(
    `SELECT *
     FROM delivery_countries
     ${includeInactive ? "" : "WHERE status = 'active'"}
     ORDER BY sort_order ASC, country_name ASC`,
  );
}

export async function findDeliveryCountryByCode(countryCode, connection = db) {
  const [rows] = await connection.execute(
    `SELECT *
     FROM delivery_countries
     WHERE country_code = ? AND status = 'active'
     LIMIT 1`,
    [String(countryCode || "").trim().toUpperCase()],
  );
  return rows[0] || null;
}

export async function createDeliveryCountry(payload) {
  return query(
    `INSERT INTO delivery_countries (
      country_code,
      country_name,
      delivery_price_eur,
      status,
      sort_order
    )
    VALUES (
      :country_code,
      :country_name,
      :delivery_price_eur,
      :status,
      :sort_order
    )`,
    payload,
  );
}

export async function updateDeliveryCountry(id, payload) {
  return query(
    `UPDATE delivery_countries
     SET country_code = :country_code,
       country_name = :country_name,
       delivery_price_eur = :delivery_price_eur,
       status = :status,
       sort_order = :sort_order
     WHERE id = :id`,
    { ...payload, id },
  );
}

export async function deleteDeliveryCountry(id) {
  return query("DELETE FROM delivery_countries WHERE id = :id", { id });
}

export async function upsertSetting(payload) {
  return query(
    `INSERT INTO settings (setting_key, setting_value, description, updated_by)
     VALUES (:setting_key, :setting_value, :description, :updated_by)
     ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value),
      description = VALUES(description),
      updated_by = VALUES(updated_by)`,
    payload,
  );
}

export async function disableCurrentExchangeRates(connection = db) {
  const [result] = await connection.execute(
    "UPDATE exchange_rates SET is_current = FALSE WHERE base_currency = 'EUR' AND quote_currency = 'AOA'",
  );
  return result;
}

export async function createExchangeRate(rate, userId, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO exchange_rates (
      base_currency,
      quote_currency,
      rate,
      is_current,
      created_by
    )
    VALUES ('EUR', 'AOA', ?, TRUE, ?)`,
    [rate, userId],
  );
  return result;
}

export async function writeExchangeRateAudit(
  id,
  rate,
  userId,
  ip,
  connection = db,
) {
  const [result] = await connection.execute(
    `INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      new_data,
      ip_address
    )
    VALUES (?, 'exchange_rate.updated', 'exchange_rate', ?, JSON_OBJECT('rate', ?), ?)`,
    [userId, id, rate, ip],
  );
  return result;
}

export default {
  listSettings,
  currentExchangeRate,
  exchangeRateHistory,
  listDeliveryCountries,
  findDeliveryCountryByCode,
  createDeliveryCountry,
  updateDeliveryCountry,
  deleteDeliveryCountry,
  upsertSetting,
  disableCurrentExchangeRates,
  createExchangeRate,
  writeExchangeRateAudit,
};
