import express, { Router, Request, Response } from "express";
import {
  addExercise,
  countUserExercises,
  createNewUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  getUserExercises,
} from "../controller";
import { UserExerciseLog } from "../model";

export const usersApiRouter: Router = express.Router();

usersApiRouter.get("/", async (request: Request, response: Response) => {
  const users = await getAllUsers();
  response.send(users ?? []);
});

usersApiRouter.get("/:_id", async (request: Request, response: Response) => {
  const userId = Number(request.params._id);
  const user = await getUserById(userId);
  response.send(user);
});

usersApiRouter.get("/name/:username", async (request: Request, response: Response) => {
  const username = request.params.username;
  const user = await getUserByUsername(username);
  response.send(user);
});

usersApiRouter.post("/", async (request: Request, response: Response) => {
  const username = request.body.username;
  const newUser = await createNewUser(username);
  response.send(newUser);
});

usersApiRouter.post("/:_id/exercises", async (request: Request, response: Response) => {
  const userId = Number(request.params._id);
  const description = request.body.description;
  const duration = request.body.duration;
  const date = request.body.date;
  const addedExercise = await addExercise(userId, description, duration, date);
  response.send(addedExercise);
});

usersApiRouter.get("/:_id/logs", async (request: Request, response: Response) => {
  const userId = Number(request.params._id);
  const limit = request.query.limit ? Number(request.query.limit) : undefined;
  const offset = request.query.offset ? Number(request.query.offset) : undefined;
  const from = request.query.from ? request.query.from.toString() : undefined;
  const to = request.query.to ? request.query.to.toString() : undefined;
  const logs = await getUserExercises(userId, limit, offset, from, to);
  const count = await countUserExercises(userId);
  response.send({
    logs,
    count,
  } as UserExerciseLog);
});
