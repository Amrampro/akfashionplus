import { db, query } from "../config/database.js";
import { reference } from "../utils/reference.js";

export async function listGiftCardTypes(lang = "fr", includeInactive = false) {
  return query(
    `SELECT id,
      name,
      code,
      value_eur,
      description_${lang} AS description,
      image_url,
      status,
      (
        SELECT COUNT(*)
        FROM gift_cards gc
        WHERE gc.gift_card_type_id = gift_card_types.id
      ) AS issued_count,
      (
        SELECT COALESCE(SUM(gc.initial_balance_eur), 0)
        FROM gift_cards gc
        WHERE gc.gift_card_type_id = gift_card_types.id
      ) AS issued_value_eur,
      (
        SELECT COALESCE(SUM(gc.current_balance_eur), 0)
        FROM gift_cards gc
        WHERE gc.gift_card_type_id = gift_card_types.id
      ) AS current_balance_eur
     FROM gift_card_types
     WHERE (:includeInactive = 1 OR status = 'active')
     ORDER BY value_eur`,
    { includeInactive: includeInactive ? 1 : 0 },
  );
}

export async function findGiftCardType(typeId) {
  const rows = await query(
    "SELECT * FROM gift_card_types WHERE id = :id LIMIT 1",
    {
      id: typeId,
    },
  );
  return rows[0] || null;
}

export async function createGiftCardType(payload) {
  return query(
    `INSERT INTO gift_card_types (
      name,
      code,
      value_eur,
      description_fr,
      description_en,
      description_pt,
      image_url,
      status,
      created_by
    )
    VALUES (
      :name,
      :code,
      :value_eur,
      :description_fr,
      :description_en,
      :description_pt,
      :image_url,
      :status,
      :created_by
    )`,
    payload,
  );
}

export async function listGiftCards(user, filters = {}) {
  await activateSucceededPendingGiftCards(user);
  const isAdmin = user.role === "admin";

  if (isAdmin) {
    const where = [];
    const params = {};

    if (filters.status) {
      where.push("gc.status = :status");
      params.status = filters.status;
    }

    if (filters.type_id) {
      where.push("gc.gift_card_type_id = :type_id");
      params.type_id = Number(filters.type_id);
    }

    if (filters.owner_user_id) {
      where.push("gc.owner_user_id = :owner_user_id");
      params.owner_user_id = Number(filters.owner_user_id);
    }

    if (filters.q) {
      where.push(`(
        gc.serial_number LIKE :q
        OR gct.name LIKE :q
        OR owner.email LIKE :q
        OR purchaser.email LIKE :q
        OR CONCAT(owner.first_name, ' ', owner.last_name) LIKE :q
        OR CONCAT(purchaser.first_name, ' ', purchaser.last_name) LIKE :q
      )`);
      params.q = `%${filters.q}%`;
    }

    const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return query(
      `SELECT
         gc.id,
         gc.gift_card_type_id,
         gc.owner_user_id,
         gc.purchased_by,
         gc.serial_number,
         gct.name AS card_name,
         gct.code AS card_code,
         gc.initial_balance_eur,
         gc.current_balance_eur,
         gc.reserved_balance_eur,
         (
           gc.current_balance_eur - gc.reserved_balance_eur
         ) AS available_balance_eur,
         gc.source,
         gc.status,
         gc.expires_at,
         gc.activated_at,
         gc.assigned_at,
         gc.created_at,
         CONCAT(owner.first_name, ' ', owner.last_name) AS owner_name,
         owner.email AS owner_email,
         owner.phone AS owner_phone,
         CONCAT(purchaser.first_name, ' ', purchaser.last_name) AS purchaser_name,
         purchaser.email AS purchaser_email
       FROM gift_cards gc
       INNER JOIN gift_card_types gct ON gct.id = gc.gift_card_type_id
       LEFT JOIN users owner ON owner.id = gc.owner_user_id
       LEFT JOIN users purchaser ON purchaser.id = gc.purchased_by
       ${sqlWhere}
       ORDER BY gc.created_at DESC, gc.id DESC`,
      params,
    );
  }

  return query(
    `SELECT *
     FROM v_user_gift_cards
     WHERE (:admin = 1 OR owner_user_id = :user_id)
       AND (:status IS NULL OR status = :status)
     ORDER BY created_at DESC`,
    {
      admin: user.role === "admin" ? 1 : 0,
      user_id: user.id,
      status: filters.status || null,
    },
  );
}

export async function activateSucceededPendingGiftCards(user) {
  const isAdmin = user.role === "admin";
  return query(
    `UPDATE gift_cards gc
     INNER JOIN payments p ON p.gift_card_id = gc.id
     SET gc.status = 'active',
       gc.activated_at = COALESCE(gc.activated_at, NOW()),
       gc.assigned_at = COALESCE(gc.assigned_at, NOW())
     WHERE (:admin = 1 OR gc.owner_user_id = :user_id)
       AND gc.status = 'pending_payment'
       AND p.purpose = 'gift_card_purchase'
       AND p.status = 'succeeded'`,
    { admin: isAdmin ? 1 : 0, user_id: user.id },
  );
}

export async function findGiftCardBalanceBySerial(serialNumber) {
  const rows = await query(
    `SELECT id,
      serial_number,
      card_name,
      current_balance_eur,
      reserved_balance_eur,
      available_balance_eur,
      status
     FROM v_user_gift_cards
     WHERE serial_number = :serial_number
     LIMIT 1`,
    { serial_number: serialNumber },
  );
  return rows[0] || null;
}

export async function createGiftCard(payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO gift_cards (
      gift_card_type_id,
      serial_number,
      purchased_by,
      owner_user_id,
      initial_balance_eur,
      current_balance_eur,
      source,
      status,
      activated_at,
      assigned_at,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), IF(? IS NULL, NULL, NOW()), ?)`,
    [
      payload.gift_card_type_id,
      payload.serial_number,
      payload.purchased_by,
      payload.owner_user_id,
      payload.initial_balance_eur,
      payload.current_balance_eur,
      payload.source,
      payload.status,
      payload.owner_user_id,
      payload.created_by,
    ],
  );
  return result;
}

export async function lockGiftCard(cardId, connection = db) {
  const [rows] = await connection.execute(
    "SELECT * FROM gift_cards WHERE id = ? FOR UPDATE",
    [cardId],
  );
  return rows[0] || null;
}

export async function updateGiftCard(cardId, payload) {
  const keys = Object.keys(payload);
  return query(
    `UPDATE gift_cards
     SET ${keys.map((key) => `${key} = :${key}`).join(", ")}
     WHERE id = :id`,
    { id: cardId, ...payload },
  );
}

export async function updateGiftCardBalance(
  cardId,
  currentBalance,
  connection = db,
) {
  const [result] = await connection.execute(
    "UPDATE gift_cards SET current_balance_eur = ? WHERE id = ?",
    [currentBalance, cardId],
  );
  return result;
}

export async function updateGiftCardBalances(
  cardId,
  { currentBalance, reservedBalance, status },
  connection = db,
) {
  const assignments = [];
  const values = [];

  if (currentBalance !== undefined) {
    assignments.push("current_balance_eur = ?");
    values.push(currentBalance);
  }

  if (reservedBalance !== undefined) {
    assignments.push("reserved_balance_eur = ?");
    values.push(reservedBalance);
  }

  if (status !== undefined) {
    assignments.push("status = ?");
    values.push(status);
  }

  if (!assignments.length) return { affectedRows: 0 };

  values.push(cardId);
  const [result] = await connection.execute(
    `UPDATE gift_cards SET ${assignments.join(", ")} WHERE id = ?`,
    values,
  );
  return result;
}

export async function writeTransaction(payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO gift_card_transactions (
      transaction_reference,
      gift_card_id,
      payment_id,
      order_id,
      type,
      amount_eur,
      balance_before_eur,
      balance_after_eur,
      reserved_before_eur,
      reserved_after_eur,
      description,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reference("GCT"),
      payload.gift_card_id,
      payload.payment_id || null,
      payload.order_id || null,
      payload.type,
      payload.amount_eur,
      payload.balance_before_eur,
      payload.balance_after_eur,
      payload.reserved_before_eur,
      payload.reserved_after_eur,
      payload.description,
      payload.created_by,
    ],
  );
  return result;
}

export async function listTransactions(cardId, user) {
  return query(
    `SELECT gct.*
     FROM gift_card_transactions gct
     INNER JOIN gift_cards gc ON gc.id = gct.gift_card_id
     WHERE gct.gift_card_id = :gift_card_id
       AND (:admin = 1 OR gc.owner_user_id = :user_id)
     ORDER BY gct.created_at DESC`,
    {
      gift_card_id: cardId,
      admin: user.role === "admin" ? 1 : 0,
      user_id: user.id,
    },
  );
}

export default {
  listGiftCardTypes,
  findGiftCardType,
  createGiftCardType,
  listGiftCards,
  activateSucceededPendingGiftCards,
  findGiftCardBalanceBySerial,
  createGiftCard,
  lockGiftCard,
  updateGiftCard,
  updateGiftCardBalance,
  updateGiftCardBalances,
  writeTransaction,
  listTransactions,
};
