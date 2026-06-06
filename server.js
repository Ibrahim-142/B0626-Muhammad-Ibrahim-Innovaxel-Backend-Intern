const app = require("./src/app");
const { initDB } = require("./src/db/sqlite");

const PORT = process.env.PORT || 3000;

(async () => {
  await initDB();
  console.log("Database connected & tables ready");

  app.listen(PORT, () => {
    console.log(` Server started on port ${PORT}`);
  });
})();