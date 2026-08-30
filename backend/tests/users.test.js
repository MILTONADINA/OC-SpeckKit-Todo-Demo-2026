/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerAndLogin,
  createUserDirect,
  authHeader,
} from "./helpers.js";

beforeEach(async () => {
  await syncTestDatabase();
});

function validProfileBody(overrides = {}) {
  return {
    fName: "Jane",
    lName: "Doe",
    email: "jane@example.com",
    username: "jdoe",
    ...overrides,
  };
}

describe("Feature 4 — User Profile Management", () => {
  describe("US-4.2 — Edit profile", () => {
    it("User fetches their own profile", async () => {
      const { token, user } = await registerAndLogin();

      const response = await request(app)
        .get(`/todo/users/${user.userId}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.userId,
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
        role: "worker",
      });
      expect(response.body.password).toBeUndefined();
    });

    it("User saves profile changes", async () => {
      const { token, user } = await registerAndLogin();

      const response = await request(app)
        .put(`/todo/users/${user.userId}`)
        .set(authHeader(token))
        .send({
          fName: "Janet",
          lName: "Smith",
          email: "janet@example.com",
          username: "jsmith",
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.userId,
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      });
      expect(response.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const userB = await createUserDirect({
        fName: "Bob",
        lName: "Two",
        email: "bob@example.com",
        username: "bob",
      });

      const { token } = await registerAndLogin({
        fName: "Alice",
        lName: "One",
        email: "alice@example.com",
        username: "alice",
      });

      const response = await request(app)
        .get(`/todo/users/${userB.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: `User with id=${userB.id} not found.` });
    });

    it("User attempts to update another user's profile", async () => {
      const userB = await createUserDirect({
        fName: "Bob",
        lName: "Two",
        email: "bob@example.com",
        username: "bob",
      });

      const { token } = await registerAndLogin({
        fName: "Alice",
        lName: "One",
        email: "alice@example.com",
        username: "alice",
      });

      const response = await request(app)
        .put(`/todo/users/${userB.id}`)
        .set(authHeader(token))
        .send(validProfileBody({ username: "hacker" }));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: `User with id=${userB.id} not found.` });

      await userB.reload();
      expect(userB.username).toBe("bob");
    });

    it("Unauthenticated profile API request", async () => {
      const response = await request(app).get("/todo/users/1");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });

    it("Profile update rejects a password that is too short", async () => {
      const { token, user } = await registerAndLogin();

      const response = await request(app)
        .put(`/todo/users/${user.userId}`)
        .set(authHeader(token))
        .send(validProfileBody({ password: "short" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Password must be at least 8 characters." });
    });

    it("Profile update rejects missing required fields", async () => {
      const { token, user } = await registerAndLogin();

      const response = await request(app)
        .put(`/todo/users/${user.userId}`)
        .set(authHeader(token))
        .send({
          lName: "Doe",
          email: "jane@example.com",
          username: "jdoe",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "First name is required." });
    });

    it("Profile update rejects a duplicate username", async () => {
      await createUserDirect({
        fName: "Bob",
        lName: "Two",
        email: "bob@example.com",
        username: "userb",
      });

      const { token, user } = await registerAndLogin({
        fName: "Alice",
        lName: "One",
        email: "alice@example.com",
        username: "alice",
      });

      const response = await request(app)
        .put(`/todo/users/${user.userId}`)
        .set(authHeader(token))
        .send(validProfileBody({ username: "userb" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Username is already taken." });
    });

    it("Profile update rejects a duplicate email", async () => {
      await createUserDirect({
        fName: "Bob",
        lName: "Two",
        email: "b@example.com",
        username: "userb",
      });

      const { token, user } = await registerAndLogin({
        fName: "Alice",
        lName: "One",
        email: "alice@example.com",
        username: "alice",
      });

      const response = await request(app)
        .put(`/todo/users/${user.userId}`)
        .set(authHeader(token))
        .send(validProfileBody({ email: "b@example.com" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Email is already registered." });
    });

    it("Unauthenticated profile update API request", async () => {
      const response = await request(app)
        .put("/todo/users/1")
        .send(validProfileBody());

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });
});
