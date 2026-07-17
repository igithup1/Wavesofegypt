/**
 * Integration test: booking authorization / IDOR prevention
 *
 * Verifies that GET /api/bookings/:id enforces ownership:
 *   - The booking owner gets 200
 *   - Another authenticated customer gets 403
 *   - Unauthenticated requests get 401
 *
 * Runs against the built API server (dist/) — build first with:
 *   pnpm --filter @workspace/api-server run build
 *
 * Run with:
 *   node --test artifacts/api-server/src/tests/booking-auth.test.mjs
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

// ── helpers ─────────────────────────────────────────────────────────────────

let serverProcess;
let BASE;

/**
 * Derive a unique future booking date from a timestamp-based suffix string.
 * Avoids capacity conflicts when the same tour is booked repeatedly across
 * many test runs.  The date is 365–729 days from today, keyed to the last
 * millisecond digits of the suffix so consecutive runs land on different days.
 */
function uniqueFutureDate(suffix) {
  const msDigits = Number(String(suffix).replace(/\D/g, "").slice(-6));
  const extraDays = msDigits % 365;
  return new Date(Date.now() + (365 + extraDays) * 86_400_000)
    .toISOString()
    .split("T")[0];
}

async function post(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function get(path, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

/** Wait until the server responds or timeout */
async function waitForServer(url, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch { /* not up yet */ }
    await wait(200);
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

// ── lifecycle ────────────────────────────────────────────────────────────────

before(async () => {
  const port = 18743; // fixed test port — unlikely to clash
  BASE = `http://localhost:${port}/api`;

  serverProcess = spawn(
    "node",
    ["--enable-source-maps", "./dist/index.mjs"],
    {
      cwd: new URL("../../", import.meta.url).pathname,
      env: { ...process.env, PORT: String(port), NODE_ENV: "test" },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  serverProcess.stdout?.on("data", (d) => process.stdout.write(`[api] ${d}`));
  serverProcess.stderr?.on("data", (d) => process.stderr.write(`[api] ${d}`));

  await waitForServer(`${BASE}/health`);
});

after(() => {
  serverProcess?.kill("SIGTERM");
});

// ── tests ────────────────────────────────────────────────────────────────────

test("booking ownership: owner can access their own booking", async () => {
  const suffix = Date.now();

  // Register user A
  const regA = await post("/auth/register", {
    name: "Test User A",
    email: `test-owner-${suffix}@example.com`,
    password: "TestPass123!",
  });
  assert.equal(regA.status, 201, `register A: ${JSON.stringify(regA.data)}`);
  const tokenA = regA.data.token;

  // Get a valid tourId (first available tour)
  const toursRes = await get("/tours?limit=1");
  assert.equal(toursRes.status, 200);
  const tourId = toursRes.data.tours?.[0]?.id;
  assert.ok(tourId, "need at least one tour in the database");

  // Create a booking as user A — use a unique far-future date to avoid
  // capacity exhaustion across repeated test runs.
  const bookingRes = await post("/bookings", { tourId, date: uniqueFutureDate(suffix), participants: 1 }, tokenA);
  assert.equal(bookingRes.status, 201, `create booking: ${JSON.stringify(bookingRes.data)}`);
  const bookingId = bookingRes.data.id;

  // User A fetches their own booking → 200
  const ownRes = await get(`/bookings/${bookingId}`, tokenA);
  assert.equal(ownRes.status, 200, `owner should get 200, got: ${JSON.stringify(ownRes.data)}`);
  assert.equal(ownRes.data.id, bookingId);
});

test("booking authorization: another customer is denied access (403)", async () => {
  const suffix = Date.now();

  // Register user A (booking owner)
  const regA = await post("/auth/register", {
    name: "Owner A",
    email: `test-a-${suffix}@example.com`,
    password: "TestPass123!",
  });
  assert.equal(regA.status, 201);
  const tokenA = regA.data.token;

  // Register user B (unrelated customer)
  const regB = await post("/auth/register", {
    name: "Stranger B",
    email: `test-b-${suffix}@example.com`,
    password: "TestPass123!",
  });
  assert.equal(regB.status, 201);
  const tokenB = regB.data.token;

  // Get a valid tourId
  const toursRes = await get("/tours?limit=1");
  const tourId = toursRes.data.tours?.[0]?.id;
  assert.ok(tourId);

  // User A creates a booking — unique far-future date to avoid capacity exhaustion.
  const bookingRes = await post("/bookings", { tourId, date: uniqueFutureDate(suffix), participants: 1 }, tokenA);
  assert.equal(bookingRes.status, 201);
  const bookingId = bookingRes.data.id;

  // User B tries to access user A's booking → must get 403
  const forbiddenRes = await get(`/bookings/${bookingId}`, tokenB);
  assert.equal(
    forbiddenRes.status,
    403,
    `cross-user access should be 403, got ${forbiddenRes.status}: ${JSON.stringify(forbiddenRes.data)}`
  );
  assert.match(forbiddenRes.data?.error ?? "", /permission/i);
});

test("booking authorization: unauthenticated request is denied (401)", async () => {
  // We don't know a booking ID, but a non-existent ID still hits auth first
  const res = await get("/bookings/999999");
  assert.equal(res.status, 401, `unauthenticated should be 401, got ${res.status}`);
});
