import db from "../models/index.js";

const exports = {};

exports.findAll = async (req, res) => {
  const lists = await db.list.findAll({
    where: { userId: req.user.id },
    order: [["name", "ASC"]],
  });

  return res.status(200).send(lists);
};

export default exports;
