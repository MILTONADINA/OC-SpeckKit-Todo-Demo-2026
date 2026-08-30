import db from "../models/index.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const MAX_NAME_LENGTH = 100;

function parseListId(value) {
  const listId = parseInt(value, 10);

  if (Number.isNaN(listId)) {
    return null;
  }

  return listId;
}

function validateListName(name) {
  const trimmed = name?.trim();

  if (!trimmed) {
    return { error: "List name is required." };
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return { error: "List name must be 100 characters or fewer." };
  }

  return { value: trimmed };
}

const exports = {};

exports.findAll = async (req, res) => {
  const lists = await db.list.findAll({
    where: { userId: req.user.id },
    order: [["name", "ASC"]],
  });

  return res.status(200).send(lists);
};

exports.create = async (req, res) => {
  const validation = validateListName(req.body.name);

  if (validation.error) {
    return res.status(400).send({ message: validation.error });
  }

  const list = await db.list.create({
    name: validation.value,
    userId: req.user.id,
  });

  return res.status(201).send(list);
};

exports.update = async (req, res) => {
  const listId = parseListId(req.params.listId);

  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  const list = await getAccessibleListOrNull(req, listId);

  if (!list) {
    return res.status(404).send({ message: `List with id=${listId} not found.` });
  }

  const validation = validateListName(req.body.name);

  if (validation.error) {
    return res.status(400).send({ message: validation.error });
  }

  await list.update({ name: validation.value });

  return res.status(200).send(list);
};

exports.delete = async (req, res) => {
  const listId = parseListId(req.params.listId);

  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  const list = await getAccessibleListOrNull(req, listId);

  if (!list) {
    return res.status(404).send({ message: `List with id=${listId} not found.` });
  }

  await list.destroy();

  return res.status(204).send();
};

export default exports;
