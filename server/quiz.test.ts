import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Quiz procedures", () => {
  describe("quiz.create", () => {
    it("should create a quiz with valid input", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.quiz.create({
        title: "Sample Quiz",
        description: "A sample quiz for testing",
        questions: [
          {
            text: "What is 2 + 2?",
            answers: [
              { text: "3", isCorrect: false },
              { text: "4", isCorrect: true },
              { text: "5", isCorrect: false },
            ],
          },
        ],
      });

      expect(result).toHaveProperty("quizId");
      expect(result.quizId).toBeGreaterThan(0);
    });

    it("should reject quiz with no questions", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.quiz.create({
          title: "Empty Quiz",
          description: "Quiz with no questions",
          questions: [],
        })
      ).rejects.toThrow();
    });

    it("should reject question with no answers", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.quiz.create({
          title: "Invalid Quiz",
          description: "Quiz with question having no answers",
          questions: [
            {
              text: "What is 2 + 2?",
              answers: [],
            },
          ],
        })
      ).rejects.toThrow();
    });

    it("should reject question with less than 2 answers", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.quiz.create({
          title: "Invalid Quiz",
          description: "Quiz with question having only 1 answer",
          questions: [
            {
              text: "What is 2 + 2?",
              answers: [{ text: "4", isCorrect: true }],
            },
          ],
        })
      ).rejects.toThrow();
    });

    it("should reject question with no correct answer", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.quiz.create({
          title: "Invalid Quiz",
          description: "Quiz with question having no correct answer",
          questions: [
            {
              text: "What is 2 + 2?",
              answers: [
                { text: "3", isCorrect: false },
                { text: "5", isCorrect: false },
              ],
            },
          ],
        })
      ).rejects.toThrow();
    });

    it("should reject question with multiple correct answers", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.quiz.create({
          title: "Invalid Quiz",
          description: "Quiz with question having multiple correct answers",
          questions: [
            {
              text: "What is 2 + 2?",
              answers: [
                { text: "4", isCorrect: true },
                { text: "4", isCorrect: true },
              ],
            },
          ],
        })
      ).rejects.toThrow();
    });

    it("should reject unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: () => {},
        } as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.quiz.create({
          title: "Sample Quiz",
          description: "A sample quiz",
          questions: [
            {
              text: "What is 2 + 2?",
              answers: [
                { text: "3", isCorrect: false },
                { text: "4", isCorrect: true },
              ],
            },
          ],
        })
      ).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("quiz.list", () => {
    it("should list all quizzes", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.quiz.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveProperty("length");
    });
  });

  describe("quiz.getById", () => {
    it("should return 404 for non-existent quiz", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.quiz.getById({ quizId: 99999 })).rejects.toThrow(
        "NOT_FOUND"
      );
    });
  });

  describe("quiz.submitAttempt", () => {
    it("should reject attempt with mismatched answer count", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.quiz.submitAttempt({
          quizId: 1,
          answers: [
            { questionId: 1, selectedAnswerId: 1 },
            { questionId: 2, selectedAnswerId: 2 },
          ],
        })
      ).rejects.toThrow();
    });

    it("should reject attempt with invalid question for quiz", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.quiz.submitAttempt({
          quizId: 1,
          answers: [{ questionId: 99999, selectedAnswerId: 1 }],
        })
      ).rejects.toThrow();
    });

    it("should reject unauthenticated attempt submission", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: () => {},
        } as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.quiz.submitAttempt({
          quizId: 1,
          answers: [],
        })
      ).rejects.toThrow("UNAUTHORIZED");
    });
  });
});
