import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ─── Security Headers ──────────────────────────────────────────────────────
// Applied before every response. Keep this as the first middleware.
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Referrer policy — don't leak full URLs to third parties
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Disable browser features that the API doesn't need
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Basic XSS protection for older browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// ─── Request Logging ────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ─── CORS ───────────────────────────────────────────────────────────────────
// CORS_ORIGIN: comma-separated list of allowed origins for production.
// Leave unset (or set to "*") to allow all origins (fine for development).
// Example: CORS_ORIGIN=https://wavesofegypt.vercel.app,https://yourdomain.com
const rawCorsOrigin = process.env["CORS_ORIGIN"];
const corsOrigin: string | string[] | boolean =
  !rawCorsOrigin || rawCorsOrigin === "*"
    ? true                              // allow all
    : rawCorsOrigin.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,                  // allow cookies / Authorization header
  }),
);

// ─── Body Parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
