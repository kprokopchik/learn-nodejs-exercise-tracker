export interface User {
  id: number;
  username: string;
}

export interface Exercise {
  id: number;
  description: string;
  duration: number;
  date: string;
}

export interface UserExerciseLog extends User {
  logs: Exercise[];
  count: number;
}

export interface CreatedExerciseResponse {
  userId: number;
  exerciseId: number;
  duration: number;
  description: string;
  date: string;
}
