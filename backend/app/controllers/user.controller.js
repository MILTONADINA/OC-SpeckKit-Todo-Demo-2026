import bcrypt from "bcryptjs";
import db from "../models/index.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseUserId(value) {
  const userId = parseInt(value, 10);

  if (Number.isNaN(userId)) {
    return null;
  }

  return userId;
}

function isBlank(value) {
  return !value?.trim();
}

function buildProfileResponse(user) {
  return {
    id: user.id,
    fName: user.fName,
    lName: user.lName,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const exports = {};

exports.findOne = async (req, res) => {
  const userId = parseUserId(req.params.id);

  if (userId === null) {
    return res.status(400).send({ message: "Invalid user id." });
  }

  const user = await getAccessibleUserOrNull(req, userId);

  if (!user) {
    return res.status(404).send({ message: `User with id=${userId} not found.` });
  }

  return res.status(200).send(buildProfileResponse(user));
};

exports.update = async (req, res) => {
  const userId = parseUserId(req.params.id);

  if (userId === null) {
    return res.status(400).send({ message: "Invalid user id." });
  }

  const user = await getAccessibleUserOrNull(req, userId);

  if (!user) {
    return res.status(404).send({ message: `User with id=${userId} not found.` });
  }

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

  if (password !== undefined && password !== null && password !== "" && password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }

  const existingUsername = await db.user.findOne({ where: { username } });

  if (existingUsername && existingUsername.id !== user.id) {
    return res.status(400).send({ message: "Username is already taken." });
  }

  const existingEmail = await db.user.findOne({ where: { email } });

  if (existingEmail && existingEmail.id !== user.id) {
    return res.status(400).send({ message: "Email is already registered." });
  }

  const updates = {
    fName,
    lName,
    email,
    username,
  };

  if (password !== undefined && password !== null && password !== "") {
    updates.password = await bcrypt.hash(password, SALT_ROUNDS);
  }

  await db.user.unscoped().update(updates, { where: { id: user.id } });

  const updatedUser = await db.user.findByPk(user.id);

  return res.status(200).send(buildProfileResponse(updatedUser));
};

export default exports;
