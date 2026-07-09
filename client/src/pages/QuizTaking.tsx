import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function QuizTaking() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  const quizId = parseInt(params?.quizId || "0");

  const { data: quiz, isLoading } = trpc.quiz.getById.useQuery({ quizId });
  const submitAttemptMutation = trpc.attempt.submit.useMutation();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected answers array
  useEffect(() => {
    if (quiz && selectedAnswers.length === 0) {
      setSelectedAnswers(new Array(quiz.questions.length).fill(null));
    }
  }, [quiz, selectedAnswers.length]);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-foreground mb-4">Please sign in to take a quiz</h1>
          <Button onClick={() => setLocation("/")} className="button-primary">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-foreground">Loading quiz...</h1>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-foreground mb-4">Quiz not found</h1>
          <Button onClick={() => setLocation("/quizzes")} className="button-primary">
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentAnswer = selectedAnswers[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleSelectAnswer = (answerId: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerId;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (selectedAnswers.some(a => a === null)) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitAttemptMutation.mutateAsync({
        quizId,
        answers: quiz.questions.map((question, index) => ({
          questionId: question.id,
          selectedAnswerId: selectedAnswers[index],
        })),
      });

      toast.success("Quiz submitted successfully!");
      setLocation(`/results/${result.attemptId}`);
    } catch (error) {
      toast.error("Failed to submit quiz. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/30 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4 md:py-6">
          <h1 className="text-2xl md:text-3xl font-serif text-foreground">{quiz.title}</h1>
          <Button variant="outline" size="sm" onClick={() => setLocation("/quizzes")}>
            Exit
          </Button>
        </div>
      </nav>

      <main className="flex-1 airy-section">
        <div className="container max-w-2xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-sans font-medium text-foreground">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <span className="text-sm font-sans text-muted-foreground">
                {Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="card-elevated mb-8">
            <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-8">
              {currentQuestion.text}
            </h2>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleSelectAnswer(answer.id)}
                  className={`w-full p-4 md:p-5 text-left rounded-lg border-2 transition-all ${
                    currentAnswer === answer.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-accent/50 hover:bg-accent/5"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        currentAnswer === answer.id
                          ? "border-primary bg-primary"
                          : "border-border"
                      }`}
                    >
                      {currentAnswer === answer.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="font-sans text-foreground">{answer.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handlePrevious}
              disabled={isFirstQuestion}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedAnswers.some(a => a === null)}
                className="flex-1 button-primary"
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex-1 button-secondary flex items-center justify-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Question Indicator */}
          <div className="mt-8 pt-8 border-t border-border/30">
            <div className="flex flex-wrap gap-2">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg font-sans font-medium transition-all ${
                    index === currentQuestionIndex
                      ? "bg-primary text-primary-foreground"
                      : selectedAnswers[index] !== null
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-border text-muted-foreground hover:bg-border/80"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
