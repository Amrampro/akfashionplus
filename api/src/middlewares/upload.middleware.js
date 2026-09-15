import multer from "multer";
import fs from "node:fs";
import path from "node:path";

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const destination =
      file.fieldname === "avatar"
        ? "uploads/avatars"
        : file.fieldname === "review"
          ? "uploads/reviews"
          : file.fieldname === "category"
            ? "uploads/categories"
            : file.fieldname === "proposal_photos" ||
                file.fieldname === "images"
              ? "uploads/second-hand-proposals"
              : file.fieldname === "important_link_pdf"
                ? "uploads/important-links"
                : "uploads/products";
    fs.mkdirSync(destination, { recursive: true });
    cb(null, destination);
  },
  filename: (_req, file, cb) =>
    cb(
      null,
      Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, ""),
    ),
});
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdfField = file.fieldname === "important_link_pdf";
    const allowedExtensions = isPdfField
      ? new Set([".pdf"])
      : new Set([".jpg", ".jpeg", ".png", ".webp"]);
    const allowedMimeTypes = isPdfField
      ? new Set(["application/pdf"])
      : new Set(["image/jpeg", "image/png", "image/webp"]);
    cb(
      null,
      allowedExtensions.has(path.extname(file.originalname).toLowerCase()) &&
        allowedMimeTypes.has(file.mimetype),
    );
  },
});
export default upload;
