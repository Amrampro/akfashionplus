import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "../config/database.js";

const uploadsRoot = fileURLToPath(new URL("../../uploads/", import.meta.url));

export function accountUploadPath(value) {
  try {
    const pathname = decodeURIComponent(new URL(value, "https://uploads.invalid").pathname);
    // Only server-generated files in the two account-owned upload directories.
    const match = /^\/uploads\/(avatars|second-hand-proposals)\/([a-zA-Z0-9._-]+)$/.exec(pathname);
    if (!match || match[2] === "." || match[2] === "..") return null;
    return path.join(uploadsRoot, match[1], match[2]);
  } catch {
    return null;
  }
}

export async function removeAccountUploads(urls = []) {
  for (const url of new Set(urls)) {
    const file = accountUploadPath(url);
    if (!file) continue;
    try {
      // Profile URLs can be reused: never erase a file still referenced by
      // another account or proposal, even if the original URL host differs.
      const suffix = `%/${path.basename(path.dirname(file))}/${path.basename(file)}`;
      const references = await query(`SELECT id FROM users WHERE avatar_url LIKE :suffix
        UNION ALL SELECT id FROM second_hand_proposal_images WHERE image_url LIKE :suffix LIMIT 1`, { suffix });
      if (references.length) continue;
      await unlink(file);
    } catch (error) {
      if (error.code !== "ENOENT") {
        // Deletion of the account is already committed; expose cleanup failure
        // to operations without retaining the personal URL in the logs.
        console.error("Account upload cleanup failed", error.code);
      }
    }
  }
}
