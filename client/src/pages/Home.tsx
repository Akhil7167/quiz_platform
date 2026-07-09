import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BookOpen, Pencil, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleCreateQuiz = () => {
    if (!isAuthenticated) {
      startLogin();
    } else {
      setLocation("/create-quiz");
    }
  };

  const handleTakeQuiz = () => {
    setLocation("/quizzes");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/30 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4 md:py-6">
          <h1 className="text-2xl md:text-3xl font-serif text-foreground">Quiz Platform</h1>
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-accent/20 animate-pulse" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-sans text-muted-foreground">{user?.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/quizzes")}
              >
                My Quizzes
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={startLogin}
            >
              Sign In
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 airy-section">
        <div className="container">
          {/* Welcome Section */}
          <div className="max-w-3xl mx-auto text-center mb-20 md:mb-32">
            <h2 className="text-4xl md:text-6xl font-serif text-foreground mb-6 text-balance leading-tight">
              Welcome to Quiz Platform
            </h2>
            <p className="text-lg md:text-xl font-sans font-light text-muted-foreground mb-8 leading-relaxed">
              Create engaging quizzes and test your knowledge in a beautiful, serene environment. 
              Explore topics, challenge yourself, and grow your understanding one question at a time.
            </p>
            <div className="divider-vertical mx-auto mb-8" />
          </div>

          {/* CTA Cards */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
            {/* Create Quiz Card */}
            <div className="card-elevated geometric-accent hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 md:p-4 bg-primary/10 rounded-lg">
                  <Pencil className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <div className="flex-1" />
              </div>
              <h3 className="text-2xl md:text-3xl font-serif text-foreground mb-3">
                Create a Quiz
              </h3>
              <p className="text-muted-foreground font-sans font-light leading-relaxed mb-6">
                Design your own quiz with multiple-choice questions. Share your knowledge and create engaging learning experiences for others.
              </p>
              <Button
                onClick={handleCreateQuiz}
                className="w-full button-primary flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Take Quiz Card */}
            <div className="card-elevated geometric-accent hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 md:p-4 bg-secondary/10 rounded-lg">
                  <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-secondary" />
                </div>
                <div className="flex-1" />
              </div>
              <h3 className="text-2xl md:text-3xl font-serif text-foreground mb-3">
                Take a Quiz
              </h3>
              <p className="text-muted-foreground font-sans font-light leading-relaxed mb-6">
                Browse available quizzes and test your knowledge. Get instant feedback and see how well you performed.
              </p>
              <Button
                onClick={handleTakeQuiz}
                className="w-full button-secondary flex items-center justify-center gap-2"
              >
                Browse Quizzes
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20 md:mt-32 pt-20 md:pt-32 border-t border-border/30">
            <div className="section-header">
              <h2>Why Quiz Platform?</h2>
              <p>A thoughtfully designed learning experience</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-accent/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-serif text-accent">✓</span>
                </div>
                <h4 className="text-lg font-serif text-foreground mb-2">Instant Feedback</h4>
                <p className="text-sm font-sans text-muted-foreground">See your results immediately with detailed explanations</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-serif text-primary">✓</span>
                </div>
                <h4 className="text-lg font-serif text-foreground mb-2">Easy Creation</h4>
                <p className="text-sm font-sans text-muted-foreground">Create quizzes in minutes with our intuitive interface</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-serif text-secondary">✓</span>
                </div>
                <h4 className="text-lg font-serif text-foreground mb-2">Mobile Friendly</h4>
                <p className="text-sm font-sans text-muted-foreground">Take quizzes anywhere on any device</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 backdrop-blur-sm">
        <div className="container py-8 md:py-12 text-center">
          <p className="text-sm font-sans text-muted-foreground">
            © 2026 Quiz Platform. Created with care.
          </p>
        </div>
      </footer>
    </div>
  );
}
