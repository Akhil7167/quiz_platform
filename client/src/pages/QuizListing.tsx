import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BookOpen, Play, Plus } from "lucide-react";

export default function QuizListing() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: quizzes, isLoading } = trpc.quiz.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-foreground">Loading quizzes...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/30 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4 md:py-6">
          <h1 className="text-2xl md:text-3xl font-serif text-foreground">Quiz Platform</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
            >
              Home
            </Button>
            {isAuthenticated && (
              <Button
                size="sm"
                onClick={() => setLocation("/create-quiz")}
                className="button-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Quiz
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 airy-section">
        <div className="container max-w-4xl">
          <div className="section-header">
            <h2>Available Quizzes</h2>
            <p>Browse and take quizzes to test your knowledge</p>
          </div>

          {!quizzes || quizzes.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 mx-auto text-accent/30 mb-4" />
              <h3 className="text-2xl font-serif text-foreground mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground font-sans mb-6">
                Be the first to create a quiz and share your knowledge!
              </p>
              {isAuthenticated && (
                <Button
                  onClick={() => setLocation("/create-quiz")}
                  className="button-primary"
                >
                  Create First Quiz
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="card-elevated geometric-accent hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-serif text-foreground mb-1">
                        {quiz.title}
                      </h3>
                      <p className="text-sm font-sans text-muted-foreground">
                        by {quiz.creator?.name || "Anonymous"}
                      </p>
                    </div>
                    <div className="flex-shrink-0 px-3 py-1 bg-primary/10 rounded-full">
                      <span className="text-sm font-sans font-medium text-primary">
                        {quiz.questionCount} Q
                      </span>
                    </div>
                  </div>

                  {quiz.description && (
                    <p className="text-muted-foreground font-sans font-light leading-relaxed mb-6 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  <Button
                    onClick={() => setLocation(`/quiz/${quiz.id}`)}
                    className="w-full button-secondary flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Take Quiz
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
