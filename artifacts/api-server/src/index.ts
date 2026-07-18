import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./lib/auth";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ─── Startup: ensure admin account is valid ──────────────────────────────────
// The original seeded admin row has a placeholder hash that never matches any
// real password.  On every boot we upsert the admin account so it has the
// correct credentials.  Once the admin is confirmed working this block can be
// removed.
async function ensureAdmin(): Promise<void> {
  const ADMIN_EMAIL = "aaaaaaa.sultan@gmail.com";
  const ADMIN_HASH  = hashPassword("Aboroqya456"); // 8cf79cf6…

  const [existing] = await db
    .select({ id: usersTable.id, email: usersTable.email, hash: usersTable.passwordHash })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"))
    .limit(1);

  if (!existing) {
    // No admin at all – create one
    await db.insert(usersTable).values({
      email: ADMIN_EMAIL,
      passwordHash: ADMIN_HASH,
      name: "Admin",
      role: "admin",
    });
    logger.info("Admin account created");
  } else if (existing.email !== ADMIN_EMAIL || existing.hash !== ADMIN_HASH) {
    // Admin exists but has wrong email / broken hash – fix it
    await db
      .update(usersTable)
      .set({ email: ADMIN_EMAIL, passwordHash: ADMIN_HASH, updatedAt: new Date() })
      .where(eq(usersTable.id, existing.id));
    logger.info({ id: existing.id }, "Admin account corrected");
  } else {
    logger.info("Admin account OK");
  }
}

ensureAdmin()
  .catch((err) => logger.error({ err }, "ensureAdmin failed"))
  .finally(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  });
