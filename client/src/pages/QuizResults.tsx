import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Check, X, RotateCcw, Home } from "lucide-react";

export default function QuizResults() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  const attemptId = parseInt(params?.attemptId || "0");

  const { data: results, isLoading } = trpc.attempt.getResults.useQuery({ attemptId });

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-foreground mb-4">Please sign in to view results</h1>
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
          <h1 className="text-2xl font-serif text-foreground">Loading results...</h1>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-foreground mb-4">Results not found</h1>
          <Button onClick={() => setLocation("/quizzes")} className="button-primary">
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-50";
    if (percentage >= 60) return "bg-blue-50";
    if (percentage >= 40) return "bg-orange-50";
    return "bg-red-50";
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/30 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4 md:py-6">
          <h1 className="text-2xl md:text-3xl font-serif text-foreground">Quiz Results</h1>
          <Button variant="outline" size="sm" onClick={() => setLocation("/quizzes")}>
            Back
          </Button>
        </div>
      </nav>

      <main className="flex-1 airy-section">
        <div className="container max-w-3xl">
          {/* Score Summary */}
          <div className={`card-elevated ${getScoreBgColor(results.percentage)} mb-8`}>
            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-2">
                {results.quizTitle}
              </h2>
              <p className="text-muted-foreground font-sans">Quiz completed</p>
            </div>

            <div className="text-center mb-8">
              <div className={`text-6xl md:text-7xl font-serif font-bold ${getScoreColor(results.percentage)} mb-2`}>
                {results.percentage}%
              </div>
              <p className="text-lg font-sans text-foreground">
                You scored <span className="font-semibold">{results.score}</span> out of{" "}
                <span className="font-semibold">{results.totalQuestions}</span> questions
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setLocation("/quizzes")}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Quizzes
              </Button>
              <Button
                onClick={() => {
                  // Get quizId from the first answer's quiz context
                  // For now, navigate back to quizzes and let user select again
                  setLocation("/quizzes");
                }}
                className="flex-1 button-primary flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Another Quiz
              </Button>
            </div>
          </div>

          {/* Detailed Review */}
          <div className="space-y-6">
            <h3 className="text-2xl font-serif text-foreground">Review Your Answers</h3>

            {results.answers.map((answer, index) => (
              <div
                key={index}
                className={`card-elevated border-l-4 ${
                  answer.isCorrect ? "border-green-500 bg-green-50/30" : "border-red-500 bg-red-50/30"
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      answer.isCorrect ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {answer.isCorrect ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-serif text-foreground mb-2">
                      Question {index + 1}
                    </h4>
                    <p className="text-foreground font-sans mb-4">{answer.questionText}</p>
                  </div>
                </div>

                <div className="space-y-3 ml-12">
                  {answer.selectedAnswer ? (
                    <div className={`p-3 rounded-lg ${answer.isCorrect ? "bg-green-100/50" : "bg-red-100/50"}`}>
                      <p className="text-sm font-sans font-medium text-foreground mb-1">
                        Your answer:
                      </p>
                      <p className={`font-sans ${answer.isCorrect ? "text-green-700" : "text-red-700"}`}>
                        {answer.selectedAnswer.text}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-red-100/50">
                      <p className="text-sm font-sans font-medium text-foreground mb-1">
                        Your answer:
                      </p>
                      <p className="font-sans text-red-700">No answer selected</p>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-green-100/50">
                    <p className="text-sm font-sans font-medium text-foreground mb-1">
                      Correct answer:
                    </p>
                    <p className="font-sans text-green-700">{answer.correctAnswer.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="mt-12 pt-8 border-t border-border/30 text-center">
            <p className="text-muted-foreground font-sans mb-6">
              Want to try another quiz or create your own?
            </p>
            <div className="flex gap-4 flex-col md:flex-row">
              <Button
                onClick={() => setLocation("/quizzes")}
                variant="outline"
                className="flex-1"
              >
                Browse More Quizzes
              </Button>
              <Button
                onClick={() => setLocation("/create-quiz")}
                className="flex-1 button-primary"
              >
                Create a Quiz
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
