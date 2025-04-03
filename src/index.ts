#!/usr/bin/env node

import express, { NextFunction, Request, Response } from "express";
import * as OpenApiValidator from "express-openapi-validator";
import ExpressFormidable from "express-formidable";
import { usersApiRouter } from "./routes";
import { setupSwagger } from "./swagger";
import { randomUUID } from "crypto";
import path from "path";

const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));

// Response with static default UI
app.get("/", (request: Request, response: Response) =>
  response.sendFile(__dirname + "public/index.html")
);

// Serve Swagger-UI
setupSwagger(app);

// Handle urlencoded form data - parse params to body json
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const integerFields = ["duration", "_id"];
  integerFields.forEach((field) => {
    if (!!req.body &&req.body[field] !== undefined) {
      const num = Number(req.body[field]);
      if (!isNaN(num) && Number.isInteger(num)) {
        req.body[field] = num;
      }
    }
  });
  next();
});

// Validate requests against OpenAPI schema
app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, "../public/openapi-spec.yaml"),
    validateRequests: true,
    validateResponses: false,
    ignorePaths: (path: string) => path.startsWith("/api-docs"),
  })
);

// API routers
app.use("/api/users", usersApiRouter);

// Handle erorr responses
app.use((error: any, request: Request, response: Response, next: NextFunction) => {
  const code = error.code || error.status || undefined;
  if (Number.isInteger(code)) {
    response.status(Number(code)).json({ error: error.message });
  } else {
    const traceId = randomUUID();
    console.error("ERROR TraceID", traceId, error);
    response.status(500).json({ error: `Unexpected error. TraceID: ${traceId}` });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
});
