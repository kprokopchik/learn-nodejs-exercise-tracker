import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { CreatedExerciseResponse, Exercise, User } from "../model";
import { BadRequestError } from "../model/exceptions";

const dbConnection = open({
  filename: "./database.sqlite",
  driver: sqlite3.Database,
});

dbConnection.then(async (db) => {
  await db.exec(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      UNIQUE (username)
    )
    `
  );
});

dbConnection.then(async (db) => {
  await db.exec(
    `
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      description TEXT NOT NULL,
      duration INTEGER,
      date TEXT NOT NULL
    )
    `
  );
});

export async function createUser(username: string): Promise<User> {
  const db = await dbConnection;
  try {
    const result = await db.get(
      `
      INSERT INTO users (username) VALUES ($username)
      RETURNING id
      `,
      {
        $username: username,
      }
    );
    return {
      id: result.id as number,
      username,
    } as User;
  } catch (error: any) {
    if (String(error.message ?? "").includes("SQLITE_CONSTRAINT")) {
      throw new BadRequestError(409, `User already exists with username: ${username}`);
    }
    throw error;
  }
}

export async function getAllUsers(): Promise<User[]> {
  const db = await dbConnection;
  const result = await db.all(
    `
    SELECT * FROM users
    `
  );
  return result.map(
    (row) =>
      ({
        id: row.id as number,
        username: row.username,
      } as User)
  );
}

export async function getUserById(userId: number): Promise<User | undefined> {
  const db = await dbConnection;
  const result = await db.get(
    `
    SELECT * FROM users
    WHERE id = $userId
    `,
    {
      $userId: userId,
    }
  );
  if (!result) {
    return undefined;
  }
  return {
    id: result.id as number,
    username: result.username,
  } as User;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await dbConnection;
  const result = await db.get(
    `
    SELECT * FROM users
    WHERE username = $username
    `,
    {
      $username: username,
    }
  );
  if (!result) {
    return undefined;
  }
  return {
    id: result.id as number,
    username: result.username,
  } as User;
}

export async function getExercises(
  userId: number,
  limit?: number,
  offset?: number,
  from?: string,
  to?: string
): Promise<Exercise[]> {
  const db = await dbConnection;
  let sql = `
    SELECT * FROM exercises 
    WHERE user_id = $userId
    `;
  let params = { $userId: userId } as any;
  if (!!from) {
    sql += " AND date >= $from";
    params = { $from: from, ...params };
  }
  if (!!to) {
    sql += " AND date <= $to";
    params = { $to: to, ...params };
  }
  sql += " ORDER BY date";
  if (!!limit) {
    sql += " LIMIT $limit";
    params = { $limit: limit, ...params };
  }
  if (!!offset) {
    sql += " OFFSET $offset";
    params = { $offset: offset, ...params };
  }
  console.log("execute", sql, "with", params);
  const exercises = await db.all(sql, params);
  return exercises.map(
    (row) =>
      ({
        id: row.id as number,
        description: row.description,
        duration: row.duration as number,
        date: row.date,
      } as Exercise)
  );
}

export async function countExercises(userId: number, from?: string, to?: string): Promise<number> {
  const db = await dbConnection;
  let sql = `
    SELECT count(*) as n FROM exercises 
    WHERE user_id = $userId
    `;
  let params = { $userId: userId } as any;
  if (!!from) {
    sql += " AND date >= $from";
    params = { $from: from, ...params };
  }
  if (!!to) {
    sql += " AND date <= $to";
    params = { $to: to, ...params };
  }
  console.log("execute", sql, "with", params);
  const result = await db.get(sql, params);
  return result.n;
}

export async function insertExercise(
  userId: number,
  exercise: Exercise
): Promise<CreatedExerciseResponse> {
  const db = await dbConnection;
  const result = await db.get(
    `
    INSERT INTO exercises (user_id, description, duration, date)
    VALUES ($userId, $description, $duration, $date)
    RETURNING id
    `,
    {
      $userId: userId,
      $description: exercise.description,
      $duration: exercise.duration,
      $date: exercise.date,
    }
  );
  const exerciseId = result.id as number;
  return {
    exerciseId,
    userId,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
  } as CreatedExerciseResponse;
}

export const dao = {
  getUserById,
  getUserByUsername,
  getAllUsers,
  createUser,
  insertExercise,
  getExercises,
  countExercises,
};
