import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp({ silent: true });

describe("ORBIS Backend API", () => {
  it("GET /health → 200 ok", async () => {
    const r = await request(app).get("/health");
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("ok");
    expect(r.body.service).toBe("orbis-backend");
  });

  it("bilinmeyen URL → 404", async () => {
    const r = await request(app).get("/api/yok-boyle-bir-sey");
    expect(r.status).toBe(404);
    expect(r.body.error).toBeDefined();
  });

  it("POST /api/auth/login boş body → 400 (Zod)", async () => {
    const r = await request(app).post("/api/auth/login").send({});
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/geçersiz/i);
    expect(Array.isArray(r.body.details)).toBe(true);
    expect(r.body.details.length).toBeGreaterThan(0);
  });

  it("POST /api/auth/login yanlış tip → 400 (Zod)", async () => {
    const r = await request(app)
      .post("/api/auth/login")
      .send({ username: 123, password: true });
    expect(r.status).toBe(400);
    expect(r.body.details).toBeDefined();
  });

  it("Korumalı uç token olmadan → 401", async () => {
    const r = await request(app)
      .post("/api/disruptions/herhangi-id/recommend")
      .send({});
    expect(r.status).toBe(401);
  });

  it("Korumalı uç geçersiz token ile → 401", async () => {
    const r = await request(app)
      .post("/api/disruptions/herhangi-id/recommend")
      .set("Authorization", "Bearer gecersiz")
      .send({});
    expect(r.status).toBe(401);
  });
});
