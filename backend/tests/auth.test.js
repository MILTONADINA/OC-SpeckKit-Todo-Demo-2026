/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  loginUser,
  createUserDirect,
  authHeader,
} from "./helpers.js";

beforeEach(async () => {
  await syncTestDatabase();
});

describe("Feature 1 — User Authentication & Session Management", () => {
  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const { response } = await registerUser();

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        email: "jane@example.com",
        token: expect.any(String),
        role: "worker",
      });

      const storedUser = await db.user.unscoped().findOne({ where: { username: "jdoe" } });
      expect(storedUser).not.toBeNull();
      expect(storedUser.password).not.toBe("password123");
      expect(await bcrypt.compare("password123", storedUser.password)).toBe(true);
    });

    it("User submits registration with missing email", async () => {
      const response = await request(app).post("/todo/register").send({
        fName: "Jane",
        lName: "Doe",
        username: "jdoe",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Email is required." });
    });

    it("User submits registration with password too short", async () => {
      const response = await request(app).post("/todo/register").send({
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Password must be at least 8 characters." });
    });

    it("User registers with a duplicate username", async () => {
      await registerUser();

      const response = await request(app).post("/todo/register").send({
        fName: "John",
        lName: "Smith",
        email: "john@example.com",
        username: "jdoe",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Username is already taken." });
    });

    it("User registers with a duplicate email", async () => {
      await registerUser();

      const response = await request(app).post("/todo/register").send({
        fName: "John",
        lName: "Smith",
        email: "jane@example.com",
        username: "jsmith",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Email is already registered." });
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      await registerUser();

      const response = await loginUser();

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        token: expect.any(String),
        role: "worker",
      });

      const sessionCount = await db.session.count({ where: { userId: response.body.userId } });
      expect(sessionCount).toBeGreaterThanOrEqual(1);
    });

    it("User signs in with invalid password", async () => {
      await registerUser();

      const response = await loginUser("jdoe", "wrongpassword");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Invalid username or password." });
    });

    it("User signs in with missing username", async () => {
      const response = await request(app).post("/todo/login").send({ password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Username is required." });
    });

    it("User signs in with missing password", async () => {
      const response = await request(app).post("/todo/login").send({ username: "jdoe" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Password is required." });
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const { response: registerResponse } = await registerUser();
      const token = registerResponse.body.token;

      const logoutResponse = await request(app)
        .post("/todo/logout")
        .set(authHeader(token));

      expect(logoutResponse.status).toBe(200);

      const session = await db.session.findOne({ where: { token } });
      expect(session).toBeNull();
    });
  });
});
