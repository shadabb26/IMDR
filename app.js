const express = require("express");
const userRouter = require("./routes/userRoutes");
const cors = require("cors");

const corsOptions = {
  origin: ["http://localhost:3000"],
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/v1/users", userRouter);
module.exports = app;
