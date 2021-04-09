require("dotenv").config();
const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();

const port = process.env.PORT;

//it parses incoming json to an object so we can access in our request handlers
app.use(express.json());
//

app.use(userRouter);
app.use(taskRouter);

// express server
app.listen(port, () => {
  console.log("server is running on port " + port);
});
