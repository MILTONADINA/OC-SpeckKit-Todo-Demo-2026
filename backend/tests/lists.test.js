/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerAndLogin,
  createUserDirect,
  createListForUser,
  authHeader,
} from "./helpers.js";

beforeEach(async () => {
  await syncTestDatabase();
});

describe("Feature 2 — Todo List Management", () => {
  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const { token, user } = await registerAndLogin();

      const response = await request(app)
        .post("/todo/lists")
        .set(authHeader(token))
        .send({ name: "Groceries" });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: "Groceries",
        userId: user.userId,
      });
    });

    it("User creates a list with an empty name", async () => {
      const { token } = await registerAndLogin();

      const response = await request(app)
        .post("/todo/lists")
        .set(authHeader(token))
        .send({ name: "   " });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "List name is required." });
    });

    it("User creates a list with a name that is too long", async () => {
      const { token } = await registerAndLogin();
      const longName = "a".repeat(101);

      const response = await request(app)
        .post("/todo/lists")
        .set(authHeader(token))
        .send({ name: longName });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "List name must be 100 characters or fewer." });

      const columns = await db.sequelize.getQueryInterface().describeTable("lists");
      expect(columns.name.type).toBe("VARCHAR(100)");
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const { token, user } = await registerAndLogin();

      await createListForUser(user.userId, "Work");
      await createListForUser(user.userId, "Personal");

      const response = await request(app)
        .get("/todo/lists")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
    });

    it("User cannot see another user's lists", async () => {
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
      await createListForUser(userB.id, "Secret Project");

      const loginResponse = await request(app)
        .post("/todo/login")
        .send({ username: "alice", password: "password123" });

      const response = await request(app)
        .get("/todo/lists")
        .set(authHeader(loginResponse.body.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("Alice List");
      expect(response.body.some((list) => list.name === "Secret Project")).toBe(false);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");

      const response = await request(app)
        .put(`/todo/lists/${list.id}`)
        .set(authHeader(token))
        .send({ name: "Shopping" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: list.id,
        name: "Shopping",
        userId: user.userId,
      });
    });

    it("User deletes a list", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");

      const response = await request(app)
        .delete(`/todo/lists/${list.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(204);

      const remaining = await db.list.findByPk(list.id);
      expect(remaining).toBeNull();
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
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
      const bobList = await createListForUser(userB.id, "Bob List");

      const loginResponse = await request(app)
        .post("/todo/login")
        .send({ username: "alice", password: "password123" });

      const response = await request(app)
        .put(`/todo/lists/${bobList.id}`)
        .set(authHeader(loginResponse.body.token))
        .send({ name: "Hijacked" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: `List with id=${bobList.id} not found.` });

      await bobList.reload();
      expect(bobList.name).toBe("Bob List");
    });

    it("User attempts to delete another user's list", async () => {
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
      const bobList = await createListForUser(userB.id, "Bob List");

      const loginResponse = await request(app)
        .post("/todo/login")
        .send({ username: "alice", password: "password123" });

      const response = await request(app)
        .delete(`/todo/lists/${bobList.id}`)
        .set(authHeader(loginResponse.body.token));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: `List with id=${bobList.id} not found.` });

      const stillExists = await db.list.findByPk(bobList.id);
      expect(stillExists).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
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

      const loginResponse = await request(app)
        .post("/todo/login")
        .send({ username: "alice", password: "password123" });

      const response = await request(app)
        .post("/todo/lists")
        .set(authHeader(loginResponse.body.token))
        .send({ name: "Groceries", userId: userB.id });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(userA.id);
      expect(response.body.userId).not.toBe(userB.id);
    });

    it("Unauthenticated API request to lists", async () => {
      const response = await request(app).get("/todo/lists");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });
});
