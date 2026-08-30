import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";

export const syncTestDatabase = async () => {
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  await db.sequelize.sync({ force: true });
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
};

export const closeTestDatabase = async () => {
  await db.sequelize.close();
};

export const registerUser = async (overrides = {}) => {
  const payload = {
    fName: "Jane",
    lName: "Doe",
    email: "jane@example.com",
    username: "jdoe",
    password: "password123",
    ...overrides,
  };

  const response = await request(app).post("/todo/register").send(payload);

  return { response, payload };
};

export const loginUser = async (username = "jdoe", password = "password123") => {
  return request(app).post("/todo/login").send({ username, password });
};

export const createUserDirect = async (overrides = {}) => {
  const hashedPassword = await bcrypt.hash(overrides.password || "password123", 10);

  return db.user.unscoped().create({
    fName: "Test",
    lName: "User",
    email: "test@example.com",
    username: "testuser",
    password: hashedPassword,
    role: "worker",
    ...overrides,
    password: hashedPassword,
  });
};

export const createListForUser = async (userId, name) => {
  return db.list.create({ userId, name });
};

export const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const registerAndLogin = async (overrides = {}) => {
  const { response: registerResponse } = await registerUser(overrides);

  return {
    user: registerResponse.body,
    token: registerResponse.body.token,
  };
};
