import { createHash, randomBytes } from "crypto";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export function hashPassword(password: string): string {
  const salt = "wavesofegypt_salt_2025";
  return createHash("sha256").update(password + salt).digest("hex");
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(sessionsTable).values({ userId, token, expiresAt });
  return token;
}

export async function getUserFromToken(token: string) {
  const now = new Date();
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, now)));

  if (!session) return null;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  return user ?? null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  (req as Request & { user: typeof user }).user = user;
  next();
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await getUserFromToken(token);
    if (user) {
      (req as Request & { user: typeof user }).user = user;
    }
  }
  next();
}

export type AuthRequest = Request & { user: { id: number; email: string; name: string; role: string; avatar: string | null; phone: string | null; createdAt: Date; updatedAt: Date; passwordHash: string } };
