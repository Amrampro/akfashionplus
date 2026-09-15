import { query } from "../config/database.js";
export async function notifyUser(userId, type, title, message, data = null) {
  return query(
    "INSERT INTO notifications (user_id, type, title, message, data) VALUES (:userId, :type, :title, :message, :data)",
    { userId, type, title, message, data: data ? JSON.stringify(data) : null },
  );
}
export default { notifyUser };
