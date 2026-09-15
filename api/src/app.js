import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import routes from "./routes/index.js";
import stripeWebhookRoutes from "./routes/stripeWebhook.routes.js";
import { query } from "./config/database.js";
import { languageMiddleware } from "./middlewares/language.middleware.js";
import {
  errorMiddleware,
  notFound,
} from "./middlewares/error.middleware.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, "../dist");

const defaultOrigins = [
  "https://akfashionplus.com",
  "https://www.akfashionplus.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
];

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : defaultOrigins;

app.disable("x-powered-by");

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },

    credentials: true,
  }),
);

/*
|--------------------------------------------------------------------------
| Stripe Webhook
|--------------------------------------------------------------------------
*/

app.use(
  "/api/stripe-webhooks",
  express.raw({ type: "application/json" }),

  (req, _res, next) => {
    req.rawBody = req.body;
    next();
  },

  stripeWebhookRoutes,
);

/*
|--------------------------------------------------------------------------
| Body parsers
|--------------------------------------------------------------------------
*/

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb",
  }),
);

/*
|--------------------------------------------------------------------------
| Uploads
|--------------------------------------------------------------------------
*/

app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../uploads")),
);

/*
|--------------------------------------------------------------------------
| Language
|--------------------------------------------------------------------------
*/

app.use(languageMiddleware);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

function roundedMegabytes(bytes) {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

async function checkDatabase() {
  const startedAt = Date.now();

  const rows = await Promise.race([
    query(
      "SELECT 1 AS ok, DATABASE() AS database_name, VERSION() AS version, UTC_TIMESTAMP() AS server_time",
    ),

    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Database health check timeout")),
        2500,
      ),
    ),
  ]);

  const [row] = rows;

  return {
    status: row?.ok === 1 ? "connected" : "unknown",

    database:
      row?.database_name ||
      process.env.DB_NAME ||
      "unknown",

    engine: "mysql",

    version: row?.version || null,

    server_time: row?.server_time || null,

    response_time_ms:
      Date.now() - startedAt,
  };
}

app.get("/health", async (_req, res) => {
  const checkedAt = new Date();

  const memory = process.memoryUsage();

  const baseData = {
    service: "AK Fashion Plus API",

    api: {
      status: "running",

      environment:
        process.env.NODE_ENV ||
        "development",

      uptime_seconds:
        Math.round(process.uptime()),

      node_version:
        process.version,

      pid:
        process.pid,

      started: true,
    },

    server: {
      port:
        Number(process.env.PORT || 3000),

      timestamp:
        checkedAt.toISOString(),

      timezone:
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone,

      memory_mb: {
        rss:
          roundedMegabytes(memory.rss),

        heap_total:
          roundedMegabytes(memory.heapTotal),

        heap_used:
          roundedMegabytes(memory.heapUsed),
      },
    },
  };

  try {
    const database =
      await checkDatabase();

    return res.json({
      success: true,

      message:
        "AK Fashion Plus API Health Check",

      data: {
        status: "ok",

        ...baseData,

        database,
      },
    });
  } catch (error) {
    return res.status(503).json({
      success: false,

      message:
        "AK Fashion Plus API Health Check",

      data: {
        status: "degraded",

        ...baseData,

        database: {
          status: "disconnected",

          database:
            process.env.DB_NAME ||
            "unknown",

          engine: "mysql",

          error:
            error instanceof Error
              ? error.message
              : "Database unavailable",
        },
      },
    });
  }
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api", routes);

/*
|--------------------------------------------------------------------------
| React Frontend
|--------------------------------------------------------------------------
*/

app.use(express.static(distPath));

/*
|--------------------------------------------------------------------------
| React Router fallback
|--------------------------------------------------------------------------
|
| Si la requête n'est pas une API, un upload ou /health,
| on renvoie index.html.
|
| Exemple :
|
| /second-hand
| /boutique
| /contact
| /product/5
|
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api") &&
    !req.path.startsWith("/uploads") &&
    req.path !== "/health"
  ) {
    return res.sendFile(
      path.join(distPath, "index.html"),
    );
  }

  next();
});

/*
|--------------------------------------------------------------------------
| Backend 404
|--------------------------------------------------------------------------
*/

app.use(notFound);

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorMiddleware);

export default app;