const mongoose = require("mongoose");
const dotenv = require("dotenv");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down.....");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

const DB = process.env.DATABASE_LOCAL;
const PORT = process.env.PORT || 8080;

mongoose
  .connect(DB)
  .then(() => console.log("DB Connection Successfull"))
  .catch(() => console.log("DB Connection Unsuccessfull"));

const server = app.listen(PORT, () =>
  console.log(`Application Running on PORT: ${PORT}`)
);

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down.....");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
