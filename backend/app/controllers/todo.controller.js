import db from "../models/index.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const MAX_TITLE_LENGTH = 255;

function parseId(value) {
  const id = parseInt(value, 10);

  if (Number.isNaN(id)) {
    return null;
  }

  return id;
}

function validateTodoTitle(title) {
  const trimmed = title?.trim();

  if (!trimmed) {
    return { error: "Todo title is required." };
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    return { error: "Todo title must be 255 characters or fewer." };
  }

  return { value: trimmed };
}

const exports = {};

exports.findAllByList = async (req, res) => {
  const listId = parseId(req.params.listId);

  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  const list = await getAccessibleListOrNull(req, listId);

  if (!list) {
    return res.status(404).send({ message: `List with id=${listId} not found.` });
  }

  const todos = await db.todo.findAll({
    where: { listId: list.id, userId: req.user.id },
    order: [
      ["completed", "ASC"],
      ["createdAt", "ASC"],
    ],
  });

  return res.status(200).send(todos);
};

exports.create = async (req, res) => {
  const listId = parseId(req.params.listId);

  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  const list = await getAccessibleListOrNull(req, listId);

  if (!list) {
    return res.status(404).send({ message: `List with id=${listId} not found.` });
  }

  const validation = validateTodoTitle(req.body.title);

  if (validation.error) {
    return res.status(400).send({ message: validation.error });
  }

  const todo = await db.todo.create({
    title: validation.value,
    listId: list.id,
    userId: req.user.id,
    completed: false,
  });

  return res.status(201).send(todo);
};

exports.update = async (req, res) => {
  const todoId = parseId(req.params.id);

  if (todoId === null) {
    return res.status(400).send({ message: "Invalid todo id." });
  }

  const todo = await getAccessibleTodoOrNull(req, todoId);

  if (!todo) {
    return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
  }

  const updates = {};

  if (req.body.title !== undefined) {
    const validation = validateTodoTitle(req.body.title);

    if (validation.error) {
      return res.status(400).send({ message: validation.error });
    }

    updates.title = validation.value;
  }

  if (req.body.completed !== undefined) {
    updates.completed = Boolean(req.body.completed);
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).send({ message: "No valid fields to update." });
  }

  await todo.update(updates);

  return res.status(200).send(todo);
};

exports.delete = async (req, res) => {
  const todoId = parseId(req.params.id);

  if (todoId === null) {
    return res.status(400).send({ message: "Invalid todo id." });
  }

  const todo = await getAccessibleTodoOrNull(req, todoId);

  if (!todo) {
    return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
  }

  await todo.destroy();

  return res.status(204).send();
};

export default exports;
