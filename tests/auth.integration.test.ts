import { app } from "../src/server";
import { beforeAll, describe, it, expect } from "@jest/globals";
import request from "supertest";

const hasSupabase =
  Boolean(process.env.SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const describeAuth = hasSupabase ? describe : describe.skip;

beforeAll(() => {
  if (!hasSupabase) {
    console.warn(
      "Skipping auth integration tests — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
});

describeAuth("Waitlist Auth Integration Test", (): void => {
  const suffix = Date.now();
  const pad = String(suffix).padStart(8, "0").slice(-8);
  const validWallet1 = `0x11111111111111111111111111111111${pad}`;
  const validWallet2 = `0x22222222222222222222222222222222${pad}`;
  const unregisteredWallet = "0x0000000000000000000000000000000000000000";

  const baseRegisterPayload = {
    email: `weaver1-${suffix}@kelp.stream`,
    walletAddress: validWallet1,
    xUsername: `https://x.com/kelpWeaversNft/status/${suffix}1`,
  };

  const invalidZodPayload = {
    email: "not-an-email",
    walletAddress: "0xTooShort",
    xUsername: "https://x.com/tweet",
  };

  const missingFieldsPayload = {
    email: `weaver2-${suffix}@kelp.stream`,
  };

  it("should register a new user without a referral code and return 201", async (): Promise<void> => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(baseRegisterPayload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("should return 400 when required fields are missing from registration payload", async (): Promise<void> => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(missingFieldsPayload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Bad Request");
  });

  it("should return 400 when Zod schema validation fails for invalid data types", async (): Promise<void> => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(invalidZodPayload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Bad Request");
  });

  it("should return 409 or appropriate error for duplicate registration", async (): Promise<void> => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(baseRegisterPayload);

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body.success).toBeFalsy();
  });

  it("should return 404 or appropriate error when a provided referral code does not exist", async (): Promise<void> => {
    const payloadWithBadReferral = {
      email: `weaver3-${suffix}@kelp.stream`,
      walletAddress: validWallet2,
      xUsername: `https://x.com/kelpWeaversNft/status/${suffix}2`,
      referral: "INVALID-REF-999",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(payloadWithBadReferral);

    expect([400, 404]).toContain(response.status);
    expect(response.body.success).toBeFalsy();
  });

  it("should login an existing user and return 200 with user data", async (): Promise<void> => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ walletAddress: validWallet1 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.walletAddress).toBe(validWallet1);
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("should return 401 for an unregistered wallet during login", async (): Promise<void> => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ walletAddress: unregisteredWallet });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", "Invalid Credentials");
  });

  it("should return 400 when wallet is completely missing from login payload", async (): Promise<void> => {
    const response = await request(app).post("/api/auth/login").send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid Request Format");
  });

  it("should return 200 and render index with flow-register when accessing root without a token", async (): Promise<void> => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="flow-register"');
  });
});
