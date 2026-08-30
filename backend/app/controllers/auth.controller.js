import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const SALT_ROUNDS = 10;
const SESSION_TTL_SECONDS = 86400;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildAuthPayload(user, token) {
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    fName: user.fName,
    lName: user.lName,
    role: user.role,
    token,
  };
}

function isBlank(value) {
  return !value?.trim();
}

async function findOrCreateSession(user) {
  const existingSession = await db.session.findOne({
    where: {
      userId: user.id,
      expirationDate: { [db.Sequelize.Op.gte]: new Date() },
    },
    order: [["expirationDate", "DESC"]],
  });

  if (existingSession) {
    return existingSession.token;
  }

  const expirationDate = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const token = jwt.sign({ id: user.id, email: user.email }, authConfig.secret, {
    expiresIn: SESSION_TTL_SECONDS,
  });

  await db.session.create({
    token,
    email: user.email,
    expirationDate,
    userId: user.id,
  });

  return token;
}

const exports = {};

exports.register = async (req, res) => {
  const fName = req.body.fName?.trim();
  const lName = req.body.lName?.trim();
  const email = req.body.email?.trim();
  const username = req.body.username?.trim().toLowerCase();
  const password = req.body.password;

  if (isBlank(fName)) {
    return res.status(400).send({ message: "First name is required." });
  }

  if (isBlank(lName)) {
    return res.status(400).send({ message: "Last name is required." });
  }

  if (isBlank(email)) {
    return res.status(400).send({ message: "Email is required." });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).send({ message: "Enter a valid email address." });
  }

  if (isBlank(username)) {
    return res.status(400).send({ message: "Username is required." });
  }

  if (!password || password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }

  const existingUsername = await db.user.findOne({ where: { username } });

  if (existingUsername) {
    return res.status(400).send({ message: "Username is already taken." });
  }

  const existingEmail = await db.user.findOne({ where: { email } });

  if (existingEmail) {
    return res.status(400).send({ message: "Email is already registered." });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await db.user.unscoped().create({
    fName,
    lName,
    email,
    username,
    password: hashedPassword,
    role: "worker",
  });

  const token = await findOrCreateSession(user);

  logger.debug(`User registered: ${username}`);

  return res.status(201).send(buildAuthPayload(user, token));
};

exports.login = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const password = req.body.password;

  if (isBlank(username)) {
    return res.status(400).send({ message: "Username is required." });
  }

  if (!password?.trim()) {
    return res.status(400).send({ message: "Password is required." });
  }

  const user = await db.user.unscoped().findOne({ where: { username } });

  if (!user) {
    return res.status(401).send({ message: "Invalid username or password." });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).send({ message: "Invalid username or password." });
  }

  const token = await findOrCreateSession(user);

  logger.debug(`User logged in: ${username}`);

  return res.status(200).send(buildAuthPayload(user, token));
};

exports.logout = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    await db.session.destroy({ where: { token } });
  }

  return res.status(200).send({ message: "Logged out successfully." });
};

export default exports;
