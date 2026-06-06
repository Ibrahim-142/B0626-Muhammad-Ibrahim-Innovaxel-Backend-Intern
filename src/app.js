const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Event Registration API"
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});