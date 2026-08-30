/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  createUserDirect,
  createListForUser,
  authHeader,
} from "./helpers.js";

beforeEach(async () => {
  await syncTestDatabase();
});

describe("Feature 1 — User Authentication & Session Management", () => {
  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const { response: registerResponse } = await registerUser();
      const token = registerResponse.body.token;

      const response = await request(app)
        .get("/todo/lists")
        .set(authHeader(token));

      expect(response.status).toBe(200);
    });

    it("Protected API request succeeds with a valid session", async () => {
      const userA = await createUserDirect({
        fName: "Alice",
        lName: "One",
        email: "alice@example.com",
        username: "alice",
      });
      const userB = await createUserDirect({
        fName: "Bob",
        lName: "Two",
        email: "bob@example.com",
        username: "bob",
      });

      await createListForUser(userA.id, "Alice List");
      await createListForUser(userB.id, "Bob List");

      const loginResponse = await request(app)
        .post("/todo/login")
        .send({ username: "alice", password: "password123" });

      const response = await request(app)
        .get("/todo/lists")
        .set(authHeader(loginResponse.body.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        name: "Alice List",
        userId: userA.id,
      });
    });

    it("Expired or invalid session token", async () => {
      const { response: registerResponse } = await registerUser();
      const token = registerResponse.body.token;

      await db.session.update(
        { expirationDate: new Date(Date.now() - 1000) },
        { where: { token } }
      );

      const response = await request(app)
        .get("/todo/lists")
        .set(authHeader(token));

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const response = await request(app).get("/todo/lists");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });
});
