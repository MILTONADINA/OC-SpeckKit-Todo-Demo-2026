import db from "../models/index.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const MAX_TITLE_LENGTH = 255;
const DUE_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DUE_DATE_ERROR = "Due date must be a valid date in YYYY-MM-DD format.";

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

function validateDueDate(value) {
  if (value === null || value === undefined || value === "") {
    return { value: null };
  }

  if (typeof value !== "string" || !DUE_DATE_REGEX.test(value)) {
    return { error: DUE_DATE_ERROR };
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { error: DUE_DATE_ERROR };
  }

  return { value };
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

  let dueDate = null;

  if (req.body.dueDate !== undefined && req.body.dueDate !== null) {
    const dueDateValidation = validateDueDate(req.body.dueDate);

    if (dueDateValidation.error) {
      return res.status(400).send({ message: dueDateValidation.error });
    }

    dueDate = dueDateValidation.value;
  }

  const todo = await db.todo.create({
    title: validation.value,
    listId: list.id,
    userId: req.user.id,
    completed: false,
    dueDate,
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

  if ("dueDate" in req.body) {
    const dueDateValidation = validateDueDate(req.body.dueDate);

    if (dueDateValidation.error) {
      return res.status(400).send({ message: dueDateValidation.error });
    }

    updates.dueDate = dueDateValidation.value;
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
