/**
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerAndLogin,
  createUserDirect,
  createListForUser,
  createTodoForList,
  authHeader,
} from "./helpers.js";

beforeEach(async () => {
  await syncTestDatabase();
});

describe("Feature 3 — Todo List Item Management", () => {
  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(authHeader(token))
        .send({ title: "Buy milk" });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: "Buy milk",
        listId: list.id,
        userId: user.userId,
        completed: false,
      });
    });

    it("User adds a todo with an empty title", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(authHeader(token))
        .send({ title: "   " });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Todo title is required." });
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
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

      const listA = await createListForUser(userA.id, "Work");
      const listB = await createListForUser(userB.id, "Work");

      await createTodoForList(userA.id, listA.id, "My task");
      await createTodoForList(userB.id, listB.id, "Their task");

      const loginResponse = await request(app)
        .post("/todo/login")
        .send({ username: "alice", password: "password123" });

      const response = await request(app)
        .get(`/todo/lists/${listA.id}/todos`)
        .set(authHeader(loginResponse.body.token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe("My task");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");
      const todo = await createTodoForList(user.userId, list.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader(token))
        .send({ completed: true });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");
      const todo = await createTodoForList(user.userId, list.id, "Buy milk", true);

      const response = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader(token))
        .send({ completed: false });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");
      const todo = await createTodoForList(user.userId, list.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader(token))
        .send({ title: "Buy oat milk" });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");
      const todo = await createTodoForList(user.userId, list.id, "Buy milk");

      const response = await request(app)
        .delete(`/todo/todos/${todo.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(204);

      const remaining = await db.todo.findByPk(todo.id);
      expect(remaining).toBeNull();
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const userB = await createUserDirect({
        fName: "Bob",
        lName: "Two",
        email: "bob@example.com",
        username: "bob",
      });
      const bobList = await createListForUser(userB.id, "Secret");
      await createTodoForList(userB.id, bobList.id, "Hidden task");

      const { token } = await registerAndLogin({
        fName: "Alice",
        lName: "One",
        email: "alice@example.com",
        username: "alice",
      });

      const response = await request(app)
        .get(`/todo/lists/${bobList.id}/todos`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: `List with id=${bobList.id} not found.` });
    });

    it("User attempts to add a todo to another user's list", async () => {
      const userB = await createUserDirect({
        fName: "Bob",
        lName: "Two",
        email: "bob@example.com",
        username: "bob",
      });
      const bobList = await createListForUser(userB.id, "Secret");

      const { token } = await registerAndLogin({
        fName: "Alice",
        lName: "One",
        email: "alice@example.com",
        username: "alice",
      });

      const response = await request(app)
        .post(`/todo/lists/${bobList.id}/todos`)
        .set(authHeader(token))
        .send({ title: "Intruder task" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: `List with id=${bobList.id} not found.` });

      const count = await db.todo.count({ where: { listId: bobList.id } });
      expect(count).toBe(0);
    });

    it("User attempts to rename another user's todo", async () => {
      const userB = await createUserDirect({
        fName: "Bob",
        lName: "Two",
        email: "bob@example.com",
        username: "bob",
      });
      const bobList = await createListForUser(userB.id, "Secret");
      const bobTodo = await createTodoForList(userB.id, bobList.id, "Bob task");

      const { token } = await registerAndLogin({
        fName: "Alice",
        lName: "One",
        email: "alice@example.com",
        username: "alice",
      });

      const response = await request(app)
        .put(`/todo/todos/${bobTodo.id}`)
        .set(authHeader(token))
        .send({ title: "Hijacked" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: `Todo with id=${bobTodo.id} not found.` });

      await bobTodo.reload();
      expect(bobTodo.title).toBe("Bob task");
    });

    it("User attempts to delete another user's todo", async () => {
      const userB = await createUserDirect({
        fName: "Bob",
        lName: "Two",
        email: "bob@example.com",
        username: "bob",
      });
      const bobList = await createListForUser(userB.id, "Secret");
      const bobTodo = await createTodoForList(userB.id, bobList.id, "Bob task");

      const { token } = await registerAndLogin({
        fName: "Alice",
        lName: "One",
        email: "alice@example.com",
        username: "alice",
      });

      const response = await request(app)
        .delete(`/todo/todos/${bobTodo.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: `Todo with id=${bobTodo.id} not found.` });

      const stillExists = await db.todo.findByPk(bobTodo.id);
      expect(stillExists).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
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
      const list = await createListForUser(userA.id, "Groceries");

      const loginResponse = await request(app)
        .post("/todo/login")
        .send({ username: "alice", password: "password123" });

      const response = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(authHeader(loginResponse.body.token))
        .send({ title: "Buy milk", userId: userB.id });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(userA.id);
      expect(response.body.userId).not.toBe(userB.id);
    });

    it("Unauthenticated API request for todos", async () => {
      const response = await request(app).get("/todo/lists/1/todos");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");
      await createTodoForList(user.userId, list.id, "Buy milk");
      await createTodoForList(user.userId, list.id, "Buy eggs");

      const deleteResponse = await request(app)
        .delete(`/todo/lists/${list.id}`)
        .set(authHeader(token));

      expect(deleteResponse.status).toBe(204);

      const remainingTodos = await db.todo.count({ where: { listId: list.id } });
      expect(remainingTodos).toBe(0);
    });
  });
});

/**
 * Feature 5 — Todo Due Date
 * Spec: features/feature-5-todo-due-date.md
 */
describe("Feature 5 — Todo Due Date", () => {
  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(authHeader(token))
        .send({ title: "Buy milk", dueDate: "2026-07-15" });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: "Buy milk",
        dueDate: "2026-07-15",
      });
    });

    it("User adds a todo without a due date", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(authHeader(token))
        .send({ title: "Buy milk" });

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on create", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(authHeader(token))
        .send({ title: "Task", dueDate: "not-a-date" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Due date must be a valid date in YYYY-MM-DD format."
      );

      const count = await db.todo.count({ where: { listId: list.id } });
      expect(count).toBe(0);
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");
      const todo = await createTodoForList(user.userId, list.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader(token))
        .send({ dueDate: "2026-07-20" });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBe("2026-07-20");
    });

    it("User clears a due date when editing a todo", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");
      const todo = await createTodoForList(
        user.userId,
        list.id,
        "Buy milk",
        false,
        "2026-07-20"
      );

      const response = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader(token))
        .send({ dueDate: null });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on update", async () => {
      const { token, user } = await registerAndLogin();
      const list = await createListForUser(user.userId, "Groceries");
      const todo = await createTodoForList(
        user.userId,
        list.id,
        "Buy milk",
        false,
        "2026-07-20"
      );

      const response = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader(token))
        .send({ dueDate: "2026-99-99" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Due date must be a valid date in YYYY-MM-DD format."
      );

      await todo.reload();
      expect(todo.dueDate).toBe("2026-07-20");
    });

    it("User cannot set due date on another user's todo", async () => {
      const userB = await createUserDirect({
        fName: "Bob",
        lName: "Two",
        email: "bob@example.com",
        username: "bob",
      });
      const bobList = await createListForUser(userB.id, "Secret");
      const bobTodo = await createTodoForList(userB.id, bobList.id, "Bob task");

      const { token } = await registerAndLogin({
        fName: "Alice",
        lName: "One",
        email: "alice@example.com",
        username: "alice",
      });

      const response = await request(app)
        .put(`/todo/todos/${bobTodo.id}`)
        .set(authHeader(token))
        .send({ dueDate: "2026-07-15" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: `Todo with id=${bobTodo.id} not found.` });

      await bobTodo.reload();
      expect(bobTodo.dueDate).toBeNull();
    });
  });
});
