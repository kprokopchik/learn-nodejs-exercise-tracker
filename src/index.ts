#!/usr/bin/env node

import express, { Request, Response } from "express";
import ExpressFormidable from "express-formidable";
import { usersApiRouter } from "./routes";
import { setupSwagger } from "./swagger";

const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(ExpressFormidable());
app.use(express.static("public"));

app.get("/", (request: Request, response: Response) =>
  response.sendFile(__dirname + "public/index.html")
);

app.use("/api/users", usersApiRouter);

setupSwagger(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
});
