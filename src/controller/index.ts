import { dao } from "../db/dao";
import { CreatedExerciseResponse, Exercise, User } from "../model";
import { BadRequestError, NotFoundError } from "../model/exceptions";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function validateDateOptional(date?: string) {
  if (!date) {
    return;
  }
  if (!datePattern.test(date)) {
    throw new BadRequestError(400, "malformed `date` (must be in format: YYYY-MM-DD): " + date);
  }
  const td = new Date(date);
  if (isNaN(td.getTime()) || date !== td.toISOString().split("T")[0]) {
    throw new BadRequestError(400, "Invalid `date` value: " + date);
  }
}

export async function getAllUsers(): Promise<User[]> {
  return await dao.getAllUsers();
}

export async function createNewUser(username: string): Promise<User> {
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
  duration: string,
  date?: string
): Promise<CreatedExerciseResponse> {
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
  const exercise = { 
    description, 
    duration: Number(duration), 
    date 
  } as Exercise;
  console.log(userId, " adding exercise:", exercise);
  return await dao.insertExercise(userId, exercise);
}
