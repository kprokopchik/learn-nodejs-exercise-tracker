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
import { NotFoundError } from "../model/exceptions";
import { UserExerciseLog } from "../model";

export const usersApiRouter: Router = express.Router();

const getStrField = (value: undefined | string[]): string => new String(value || []).toString();
const getNumberField = (value: undefined | string[]): number => Number(new String(value || []));
const handleError = (error: any, response: Response) =>
  response.status(error.code || 400).send({ error: error.message ?? "unexpected error" });

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users.
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
usersApiRouter.get("/", async (request: Request, response: Response) => {
  try {
    const users = await getAllUsers();
    response.send(users ?? []);
  } catch (error) {
    handleError(error, response);
  }
});

/**
 * @swagger
 * /api/users/{_id}:
 *   get:
 *     summary: Get user by id.
 *     parameters:
 *       - name: _id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
usersApiRouter.get("/:_id", async (request: Request, response: Response) => {
  const userId = Number(request.params._id);
  try {
    const user = await getUserById(userId);
    response.send(user);
  } catch (error) {
    handleError(error, response);
  }
});

/**
 * @swagger
 * /api/users/name/{username}:
 *   get:
 *     summary: Get user by username.
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
usersApiRouter.get("/name/:username", async (request: Request, response: Response) => {
  const username = request.params.username;
  try {
    const user = await getUserByUsername(username);
    response.send(user);
  } catch (error) {
    handleError(error, response);
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                  type: string
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
usersApiRouter.post("/", async (request: Request, response: Response) => {
  const username = getStrField(request.fields?.username);
  try {
    const newUser = await createNewUser(username);
    response.send(newUser);
  } catch (error) {
    handleError(error, response);
  }
});

/**
 * @swagger
 * /api/users/{_id}/exercises:
 *   post:
 *     summary: Add user exercise.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - _id
 *               - description
 *               - duration
 *             properties:
 *               _id:
 *                  type: number
 *               description:
 *                  type: string
 *               duration:
 *                  type: number
 *               date:
 *                  type: string
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreatedExerciseResponse'
 */
usersApiRouter.post("/:_id/exercises", async (request: Request, response: Response) => {
  const userId = Number(request.params._id);
  const description = getStrField(request.fields?.description);
  const duration = getNumberField(request.fields?.duration);
  const date = getStrField(request.fields?.date);
  try {
    const user = await getUserById(userId);
    if (user === undefined) {
      throw new NotFoundError(`User not found: ${userId}`);
    }
    const addedExercise = await addExercise(userId, description, duration, date);
    response.send(addedExercise);
  } catch (error: any) {
    handleError(error, response);
  }
});

/**
 * @swagger
 * /api/users/{_id}/logs:
 *   get:
 *     summary: Get user exercises.
 *     parameters:
 *       - name: _id
 *         in: path
 *         required: true
 *         description: User id.
 *         schema:
 *           type: number
 *       - name: limit
 *         in: query
 *         description: Limit number of exercises to fetch.
 *         schema:
 *           type: number
 *       - name: offset
 *         in: query
 *         description: Offset for pagination.
 *         schema:
 *           type: number
 *       - name: from
 *         in: query
 *         description: Starting date (inclusive) to use as filter in format YYYY-MM-DD.
 *         schema:
 *           type: string
 *       - name: to
 *         in: query
 *         description: Ending date (inclusive) to use as filter in format YYYY-MM-DD.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserExerciseLog'
 */
usersApiRouter.get("/:_id/logs", async (request: Request, response: Response) => {
  const userId = Number(request.params._id);
  const limit = request.query.limit ? Number(request.query.limit) : undefined;
  const offset = request.query.offset ? Number(request.query.offset) : undefined;
  const from = request.query.from ? request.query.from.toString() : undefined;
  const to = request.query.to ? request.query.to.toString() : undefined;
  try {
    const logs = await getUserExercises(userId, limit, offset, from, to);
    const count = await countUserExercises(userId);
    response.send({
      logs,
      count,
    } as UserExerciseLog);
  } catch (error) {
    handleError(error, response);
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - username
 *       properties:
 *         id:
 *           type: number
 *           description: The auto-generated id of the user
 *         username:
 *           type: string
 *           description: Unique username
 *     CreatedExerciseResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: The auto-generated id of the exercise
 *         userId:
 *           type: number
 *         duration:
 *           type: string
 *         description:
 *           type: number
 *         date:
 *           type: string
 *     Exercise:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: The auto-generated id of the exercise
 *         duration:
 *           type: string
 *         description:
 *           type: number
 *         date:
 *           type: string
 *     UserExerciseLog:
 *       type: object
 *       properties:
 *         logs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Exercise'
 *         count:
 *           type: number
 */
