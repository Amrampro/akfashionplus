import "dotenv/config";
import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "akfashionplus",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  namedPlaceholders: true,
  decimalNumbers: true,
});

export async function query(sql, params = {}) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

export async function transaction(work) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
