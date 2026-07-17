import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, sessionsTable } from "@workspace/db";
import {
  LoginBody,
  RegisterBody,
  GetMeResponse,
  LoginResponse,
  RegisterResponse,
  LogoutResponse,
} from "@workspace/api-zod";
import { hashPassword, createSession, requireAuth, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const responseData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    createdAt: user.createdAt.toISOString(),
  };
  res.json(GetMeResponse.parse(responseData));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = await createSession(user.id);

  const responseData = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  };
  res.json({ ...LoginResponse.parse({ user: responseData.user }), token });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, name, role } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  const passwordHash = hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name, role: role ?? "customer" })
    .returning();

  const token = await createSession(user.id);

  const responseData = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
    },
  };
  res.status(201).json(RegisterResponse.parse({ ...responseData, token }));
});

router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization!;
  const token = authHeader.slice(7);
  await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  res.json(LogoutResponse.parse({ message: "Logged out" }));
});

export default router;
