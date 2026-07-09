import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, quizzes, questions, answers, quizAttempts, attemptAnswers } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Quiz queries
export async function createQuiz(creatorId: number, title: string, description: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quizzes).values({
    creatorId,
    title,
    description,
  });

  return result;
}

export async function getQuizById(quizId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllQuizzes() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
  return result;
}

export async function getQuizzesByCreator(creatorId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(quizzes).where(eq(quizzes.creatorId, creatorId)).orderBy(desc(quizzes.createdAt));
  return result;
}

// Question queries
export async function createQuestion(quizId: number, text: string, order: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(questions).values({
    quizId,
    text,
    order,
  });

  return result;
}

export async function getQuestionsByQuizId(quizId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(questions).where(eq(questions.quizId, quizId));
  return result;
}

// Answer queries
export async function createAnswer(questionId: number, text: string, isCorrect: boolean, order: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(answers).values({
    questionId,
    text,
    isCorrect,
    order,
  });

  return result;
}

export async function getAnswersByQuestionId(questionId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(answers).where(eq(answers.questionId, questionId));
  return result;
}

// Quiz attempt queries
export async function createQuizAttempt(userId: number, quizId: number, score: number, totalQuestions: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quizAttempts).values({
    userId,
    quizId,
    score,
    totalQuestions,
  });

  return result;
}

export async function getAttemptById(attemptId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAttemptsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)).orderBy(desc(quizAttempts.completedAt));
  return result;
}

export async function getAttemptsByQuizId(quizId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(quizAttempts).where(eq(quizAttempts.quizId, quizId));
  return result;
}

// Attempt answer queries
export async function createAttemptAnswer(attemptId: number, questionId: number, selectedAnswerId: number | null, correctAnswerId: number, isCorrect: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(attemptAnswers).values({
    attemptId,
    questionId,
    selectedAnswerId,
    correctAnswerId,
    isCorrect,
  });

  return result;
}

export async function getAttemptAnswersByAttemptId(attemptId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId));
  return result;
}
