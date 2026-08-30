import db from "../models/index.js";

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  const token = authHeader.split(" ")[1];

  const session = await db.session.findOne({
    where: {
      token,
      expirationDate: { [db.Sequelize.Op.gte]: new Date() },
    },
    include: [{ model: db.user, as: "user" }],
  });

  if (!session?.user) {
    return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
  }

  req.user = {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
  };

  next();
}

export async function getAccessibleListOrNull(req, listId) {
  return db.list.findOne({
    where: { id: listId, userId: req.user.id },
  });
}

export async function getAccessibleTodoOrNull(req, todoId) {
  return db.todo.findOne({
    where: { id: todoId, userId: req.user.id },
  });
}
