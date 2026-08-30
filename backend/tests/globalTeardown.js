import db from "../app/models/index.js";

export default async () => {
  await db.sequelize.close();
};
