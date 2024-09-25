const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require("./app");

const DB = process.env.DATABASE_LOCAL;
const PORT = process.env.PORT || 8080;

mongoose
  .connect(DB)
  .then(() => console.log("DB Connection Successfull"))
  .catch(() => console.log("DB Connection Unsuccessfull"));

app.listen(PORT, () => console.log(`Application Running on PORT: ${PORT}`));
