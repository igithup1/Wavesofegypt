/**
 * Integration tests: email resilience on POST /bookings
 *
 * Verifies that a mail-send failure — whether because SMTP is not configured
 * or because the transport throws a connection error — never propagates to the
 * HTTP response.  The booking must always be created (201) regardless.
 *
 * Two server instances are spawned:
 *   A) No SMTP env vars → createTransport() returns null, email silently skipped
 *   B) Fake SMTP credentials → transport created, sendMail rejects with ECONNREFUSED,
 *      catch block swallows the error, booking still returns 201
 *
 * Runs against the built API server (dist/) — build first with:
 *   pnpm --filter @workspace/api-server run build
 *
 * Run with:
 *   node --test artifacts/api-server/src/tests/booking-email.test.mjs
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeClient(base) {
  async function post(path, body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, {
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
    const res = await fetch(`${base}${path}`, { headers });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  return { post, get };
}

async function waitForServer(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch { /* not up yet */ }
    await wait(300);
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

function spawnServer(port, extraEnv = {}) {
  const proc = spawn(
    "node",
    ["--enable-source-maps", "./dist/index.mjs"],
    {
      cwd: new URL("../../", import.meta.url).pathname,
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: "test",
        // Strip any real SMTP vars that might be in the shell environment
        SMTP_HOST: undefined,
        SMTP_PORT: undefined,
        SMTP_USER: undefined,
        SMTP_PASS: undefined,
        ...extraEnv,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  proc.stdout?.on("data", (d) => process.stdout.write(`[api:${port}] ${d}`));
  proc.stderr?.on("data", (d) => process.stderr.write(`[api:${port}] ${d}`));
  return proc;
}

async function registerAndToken(client, suffix) {
  const reg = await client.post("/auth/register", {
    name: `Email Test User ${suffix}`,
    email: `email-test-${suffix}@example.com`,
    password: "TestPass123!",
  });
  assert.equal(reg.status, 201, `register failed: ${JSON.stringify(reg.data)}`);
  return reg.data.token;
}

async function getFirstTourId(client) {
  const res = await client.get("/tours?limit=1");
  assert.equal(res.status, 200);
  const tourId = res.data.tours?.[0]?.id;
  assert.ok(tourId, "need at least one tour in the database");
  return tourId;
}

/**
 * Derive a unique future booking date from a timestamp-based suffix string.
 * Using a date that is unique per test run avoids capacity conflicts when the
 * same tour is booked repeatedly across many test runs.
 * The date is 365–729 days from today, keyed to the last-millisecond digits of
 * the suffix so that consecutive runs land on different calendar days.
 */
function uniqueFutureDate(suffix) {
  const msDigits = Number(String(suffix).replace(/\D/g, "").slice(-6));
  const extraDays = msDigits % 365; // 0–364 extra days on top of 365
  return new Date(Date.now() + (365 + extraDays) * 86_400_000)
    .toISOString()
    .split("T")[0];
}

// ── Suite A: SMTP not configured ──────────────────────────────────────────────

describe("email resilience — SMTP not configured", () => {
  const PORT_A = 18801;
  const BASE_A = `http://localhost:${PORT_A}/api`;
  let serverA;
  let clientA;

  before(async () => {
    // No SMTP_HOST / SMTP_USER / SMTP_PASS → createTransport() returns null
    serverA = spawnServer(PORT_A, {});
    clientA = makeClient(BASE_A);
    await waitForServer(`${BASE_A}/health`);
  });

  after(() => serverA?.kill("SIGTERM"));

  test("POST /bookings returns 201 when SMTP is not configured", async () => {
    const suffix = `no-smtp-${Date.now()}`;
    const token = await registerAndToken(clientA, suffix);
    const tourId = await getFirstTourId(clientA);

    const res = await clientA.post(
      "/bookings",
      { tourId, date: uniqueFutureDate(suffix), participants: 1 },
      token
    );

    assert.equal(
      res.status,
      201,
      `expected 201 with no SMTP config, got ${res.status}: ${JSON.stringify(res.data)}`
    );
    assert.ok(res.data.id, "response should contain the new booking id");
  });

  test("booking record is persisted even when email is skipped", async () => {
    const suffix = `no-smtp-persist-${Date.now()}`;
    const token = await registerAndToken(clientA, suffix);
    const tourId = await getFirstTourId(clientA);

    const createRes = await clientA.post(
      "/bookings",
      { tourId, date: uniqueFutureDate(suffix), participants: 2 },
      token
    );
    assert.equal(createRes.status, 201);

    // Fetch the booking to confirm it is durable
    const bookingId = createRes.data.id;
    const fetchRes = await clientA.get(`/bookings/${bookingId}`, token);
    assert.equal(
      fetchRes.status,
      200,
      `booking should be fetchable after creation: ${JSON.stringify(fetchRes.data)}`
    );
    assert.equal(fetchRes.data.id, bookingId);
    assert.equal(fetchRes.data.participants, 2);
  });
});

// ── Suite B: SMTP configured but transport throws ────────────────────────────

describe("email resilience — transport connection error", () => {
  const PORT_B = 18802;
  const BASE_B = `http://localhost:${PORT_B}/api`;
  let serverB;
  let clientB;

  before(async () => {
    // Provide SMTP credentials that point to a port where nothing listens.
    // nodemailer will create the transport successfully (no throw at config
    // time) but sendMail will reject with ECONNREFUSED.  The .catch() in
    // the route handler must swallow this error.
    serverB = spawnServer(PORT_B, {
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "19753",   // nothing listens here
      SMTP_USER: "fake@example.com",
      SMTP_PASS: "fakepassword",
    });
    clientB = makeClient(BASE_B);
    await waitForServer(`${BASE_B}/health`);
  });

  after(() => serverB?.kill("SIGTERM"));

  test("POST /bookings returns 201 even when transport throws ECONNREFUSED", async () => {
    const suffix = `smtp-err-${Date.now()}`;
    const token = await registerAndToken(clientB, suffix);
    const tourId = await getFirstTourId(clientB);

    const res = await clientB.post(
      "/bookings",
      { tourId, date: uniqueFutureDate(suffix), participants: 1 },
      token
    );

    assert.equal(
      res.status,
      201,
      `expected 201 despite mail error, got ${res.status}: ${JSON.stringify(res.data)}`
    );
    assert.ok(res.data.id, "response should contain the new booking id");
  });

  test("transport error does not leak into the response body", async () => {
    const suffix = `smtp-err-body-${Date.now()}`;
    const token = await registerAndToken(clientB, suffix);
    const tourId = await getFirstTourId(clientB);

    const res = await clientB.post(
      "/bookings",
      { tourId, date: uniqueFutureDate(suffix), participants: 1 },
      token
    );

    assert.equal(res.status, 201);
    // The response must NOT contain any error field related to email
    assert.equal(
      res.data.error,
      undefined,
      `response body should not contain an error field, got: ${JSON.stringify(res.data)}`
    );
    // Standard booking fields must be present
    assert.ok(res.data.id);
    assert.ok(res.data.tourId);
    assert.ok(res.data.status);
  });

  test("booking record is persisted even when transport throws", async () => {
    const suffix = `smtp-err-persist-${Date.now()}`;
    const token = await registerAndToken(clientB, suffix);
    const tourId = await getFirstTourId(clientB);

    const createRes = await clientB.post(
      "/bookings",
      { tourId, date: uniqueFutureDate(suffix), participants: 1 },
      token
    );
    assert.equal(createRes.status, 201);

    const bookingId = createRes.data.id;
    const fetchRes = await clientB.get(`/bookings/${bookingId}`, token);
    assert.equal(
      fetchRes.status,
      200,
      `booking should be fetchable after creation despite mail error: ${JSON.stringify(fetchRes.data)}`
    );
    assert.equal(fetchRes.data.id, bookingId);
  });
});
