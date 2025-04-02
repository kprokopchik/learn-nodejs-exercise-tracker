import { dao } from "../db/dao";
import { CreatedExerciseResponse, Exercise, User } from "../model";
import { NotFoundError } from "../model/exceptions";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function validateDateOptional(date?: string) {
  if (!!date && !datePattern.test(date)) {
    throw new Error("malformed date (must be in format: YYYY-MM-DD): " + date);
  }
}

export async function getAllUsers(): Promise<User[]> {
  return await dao.getAllUsers();
}

export async function createNewUser(username?: string): Promise<User> {
  if (!username) {
    throw new Error("username is required");
  }
  console.log("registering user: ", username);
  return (await dao.createUser(username)) as User;
}

export async function getUserById(userId: number): Promise<User> {
  const user = await dao.getUserById(userId);
  if (!user) {
    throw new NotFoundError(`User not found: ${userId}`);
  }
  return user;
}

export async function getUserByUsername(userName: string): Promise<User> {
  const user = await dao.getUserByUsername(userName);
  if (!user) {
    throw new NotFoundError(`User not found: ${userName}`);
  }
  return user;
}

export async function getUserExercises(
  userId: number,
  limit?: number,
  offset?: number,
  from?: string,
  to?: string
): Promise<Exercise[]> {
  console.log("fetching exercises for: ", userId);
  if (limit !== undefined && (limit <= 0 || !Number.isInteger(limit))) {
    throw new Error("limit must be a positive integer");
  }
  if (offset !== undefined && (offset < 0 || !Number.isInteger(offset))) {
    throw new Error("offset must be a non-negative integer");
  }
  validateDateOptional(from);
  validateDateOptional(to);
  if ((await dao.getUserById(userId)) === undefined) {
    throw new NotFoundError(`user not found: ${userId}`);
  }
  return await dao.getExercises(userId, limit, offset, from, to);
}

export async function countUserExercises(userId: number): Promise<number> {
  console.log("counting exercises for: ", userId);
  if ((await dao.getUserById(userId)) === undefined) {
    throw new NotFoundError(`user not found: ${userId}`);
  }
  return await dao.countExercises(userId);
}

export async function addExercise(
  userId: number,
  description: string,
  duration: number,
  date?: string
): Promise<CreatedExerciseResponse> {
  if (!description) {
    throw new Error("description is required");
  }
  if (!duration) {
    throw new Error("duration is required");
  }
  validateDateOptional(date);
  if ((await dao.getUserById(userId)) === undefined) {
    throw new NotFoundError(`user not found: ${userId}`);
  }
  if (!date) {
    const dt = new Date();
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, "0");
    const day = dt.getDate().toString().padStart(2, "0");
    date = `${year}-${month}-${day}`;
  }
  console.log(userId, " adding exercise: ");
  return await dao.insertExercise(userId, { description, duration, date } as Exercise);
}
