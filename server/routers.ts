import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Quiz operations
  quiz: router({
    // Get all quizzes with creator info
    list: publicProcedure.query(async () => {
      const allQuizzes = await db.getAllQuizzes();
      
      // Enrich with creator info and question count
      const enriched = await Promise.all(
        allQuizzes.map(async (quiz) => {
          const creator = await db.getUserById(quiz.creatorId);
          const questionList = await db.getQuestionsByQuizId(quiz.id);
          return {
            ...quiz,
            creator: creator ? { id: creator.id, name: creator.name } : null,
            questionCount: questionList.length,
          };
        })
      );

      return enriched;
    }),

    // Get a specific quiz with all questions and answers
    getById: publicProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ input }) => {
        const quiz = await db.getQuizById(input.quizId);
        if (!quiz) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found" });
        }

        const creator = await db.getUserById(quiz.creatorId);
        const questionList = await db.getQuestionsByQuizId(quiz.id);

        // Get all answers for each question
        const questionsWithAnswers = await Promise.all(
          questionList.map(async (question) => {
            const answerList = await db.getAnswersByQuestionId(question.id);
            return {
              ...question,
              answers: answerList,
            };
          })
        );

        return {
          ...quiz,
          creator: creator ? { id: creator.id, name: creator.name } : null,
          questions: questionsWithAnswers,
        };
      }),

    // Create a new quiz
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          questions: z.array(
            z.object({
              text: z.string().min(1, "Question text is required"),
              answers: z.array(
                z.object({
                  text: z.string().min(1, "Answer text is required"),
                  isCorrect: z.boolean(),
                })
              ).min(2, "At least 2 answers are required"),
            })
          ).min(1, "At least 1 question is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Validate that exactly one correct answer per question
        for (const question of input.questions) {
          const correctCount = question.answers.filter(a => a.isCorrect).length;
          if (correctCount !== 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Each question must have exactly one correct answer",
            });
          }
        }

        // Create quiz
        const quizResult = await db.createQuiz(ctx.user.id, input.title, input.description || "");
        const quizId = (quizResult as any).insertId;

        // Create questions and answers
        for (let qIndex = 0; qIndex < input.questions.length; qIndex++) {
          const question = input.questions[qIndex];
          const questionResult = await db.createQuestion(quizId, question.text, qIndex);
          const questionId = (questionResult as any).insertId;

          for (let aIndex = 0; aIndex < question.answers.length; aIndex++) {
            const answer = question.answers[aIndex];
            await db.createAnswer(questionId, answer.text, answer.isCorrect, aIndex);
          }
        }

        return { quizId };
      }),

    // Get user's created quizzes
    myQuizzes: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const userQuizzes = await db.getQuizzesByCreator(ctx.user.id);
      
      const enriched = await Promise.all(
        userQuizzes.map(async (quiz) => {
          const questionList = await db.getQuestionsByQuizId(quiz.id);
          return {
            ...quiz,
            questionCount: questionList.length,
          };
        })
      );

      return enriched;
    }),
  }),

  // Quiz attempt operations
  attempt: router({
    // Submit a quiz attempt
    submit: protectedProcedure
      .input(
        z.object({
          quizId: z.number(),
          answers: z.array(
            z.object({
              questionId: z.number(),
              selectedAnswerId: z.number().nullable(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const quiz = await db.getQuizById(input.quizId);
        if (!quiz) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found" });
        }

        // Validate quiz has questions
        const quizQuestions = await db.getQuestionsByQuizId(input.quizId);
        if (quizQuestions.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Quiz has no questions" });
        }

        // Validate answer count matches question count
        if (input.answers.length !== quizQuestions.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Answer count mismatch" });
        }

        // Calculate score
        let score = 0;
        const attemptAnswerData = [];

        for (const answer of input.answers) {
          // Verify question belongs to this quiz
          const question = quizQuestions.find(q => q.id === answer.questionId);
          if (!question) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid question for this quiz" });
          }

          const answerOptions = await db.getAnswersByQuestionId(answer.questionId);
          const correctAnswer = answerOptions.find(a => a.isCorrect);

          if (!correctAnswer) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Question has no correct answer" });
          }

          // Verify selected answer belongs to this question
          if (answer.selectedAnswerId !== null) {
            const selectedAnswerExists = answerOptions.find(a => a.id === answer.selectedAnswerId);
            if (!selectedAnswerExists) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid answer for this question" });
            }
          }

          const isCorrect = answer.selectedAnswerId === correctAnswer.id;
          if (isCorrect) {
            score++;
          }

          attemptAnswerData.push({
            questionId: answer.questionId,
            selectedAnswerId: answer.selectedAnswerId,
            correctAnswerId: correctAnswer.id,
            isCorrect,
          });
        }

        // Create quiz attempt
        const attemptResult = await db.createQuizAttempt(
          ctx.user.id,
          input.quizId,
          score,
          input.answers.length
        );
        const attemptId = (attemptResult as any).insertId;

        // Create attempt answers
        for (const data of attemptAnswerData) {
          await db.createAttemptAnswer(
            attemptId,
            data.questionId,
            data.selectedAnswerId,
            data.correctAnswerId,
            data.isCorrect
          );
        }

        return {
          attemptId,
          score,
          totalQuestions: input.answers.length,
          percentage: Math.round((score / input.answers.length) * 100),
        };
      }),

    // Get attempt results
    getResults: protectedProcedure
      .input(z.object({ attemptId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const attempt = await db.getAttemptById(input.attemptId);
        if (!attempt) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found" });
        }

        // Verify user owns this attempt
        if (attempt.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const quiz = await db.getQuizById(attempt.quizId);
        const attemptAnswers = await db.getAttemptAnswersByAttemptId(input.attemptId);

        // Enrich with question and answer details
        const detailedAnswers = await Promise.all(
          attemptAnswers.map(async (aa) => {
            const question = await db.getQuestionsByQuizId(attempt.quizId);
            const q = question.find(q => q.id === aa.questionId);
            const answers = await db.getAnswersByQuestionId(aa.questionId);
            const selectedAnswer = answers.find(a => a.id === aa.selectedAnswerId);
            const correctAnswer = answers.find(a => a.id === aa.correctAnswerId);

            return {
              questionId: aa.questionId,
              questionText: q?.text,
              selectedAnswer: selectedAnswer ? { id: selectedAnswer.id, text: selectedAnswer.text } : null,
              correctAnswer: { id: correctAnswer?.id, text: correctAnswer?.text },
              isCorrect: aa.isCorrect,
            };
          })
        );

        return {
          attemptId: attempt.id,
          quizTitle: quiz?.title,
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
          completedAt: attempt.completedAt,
          answers: detailedAnswers,
        };
      }),

    // Get user's attempt history
    history: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const attempts = await db.getAttemptsByUserId(ctx.user.id);

      const enriched = await Promise.all(
        attempts.map(async (attempt) => {
          const quiz = await db.getQuizById(attempt.quizId);
          return {
            ...attempt,
            quizTitle: quiz?.title,
            percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
          };
        })
      );

      return enriched;
    }),
  }),
});

export type AppRouter = typeof appRouter;
