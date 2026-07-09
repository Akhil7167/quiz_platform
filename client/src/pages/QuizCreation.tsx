import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X, Plus, Check } from "lucide-react";

interface Answer {
  text: string;
  isCorrect: boolean;
}

interface Question {
  text: string;
  answers: Answer[];
}

export default function QuizCreation() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", answers: [{ text: "", isCorrect: false }, { text: "", isCorrect: true }] }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createQuizMutation = trpc.quiz.create.useMutation();

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-foreground mb-4">Please sign in to create a quiz</h1>
          <Button onClick={() => setLocation("/")} className="button-primary">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const updateQuestion = (index: number, field: string, value: string) => {
    const newQuestions = [...questions];
    if (field === "text") {
      newQuestions[index].text = value;
    }
    setQuestions(newQuestions);
  };

  const updateAnswer = (qIndex: number, aIndex: number, field: string, value: string | boolean) => {
    const newQuestions = [...questions];
    if (field === "text") {
      newQuestions[qIndex].answers[aIndex].text = value as string;
    } else if (field === "isCorrect") {
      // If marking as correct, unmark all other answers in this question
      if (value === true) {
        newQuestions[qIndex].answers.forEach((answer, idx) => {
          answer.isCorrect = idx === aIndex;
        });
      }
    }
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", answers: [{ text: "", isCorrect: false }, { text: "", isCorrect: true }] }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const addAnswer = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].answers.push({ text: "", isCorrect: false });
    setQuestions(newQuestions);
  };

  const removeAnswer = (qIndex: number, aIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].answers.length > 2) {
      newQuestions[qIndex].answers.splice(aIndex, 1);
      setQuestions(newQuestions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Quiz title is required");
      return;
    }

    if (questions.length === 0) {
      toast.error("At least one question is required");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      if (q.answers.length < 2) {
        toast.error(`Question ${i + 1} must have at least 2 answers`);
        return;
      }
      const correctCount = q.answers.filter(a => a.isCorrect).length;
      if (correctCount !== 1) {
        toast.error(`Question ${i + 1} must have exactly one correct answer`);
        return;
      }
      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].text.trim()) {
          toast.error(`Question ${i + 1}, Answer ${j + 1} text is required`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const result = await createQuizMutation.mutateAsync({
        title,
        description,
        questions: questions.map(q => ({
          text: q.text,
          answers: q.answers.map(a => ({
            text: a.text,
            isCorrect: a.isCorrect,
          })),
        })),
      });

      toast.success("Quiz created successfully!");
      setLocation("/quizzes");
    } catch (error) {
      toast.error("Failed to create quiz. Please try again.");
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
          <h1 className="text-2xl md:text-3xl font-serif text-foreground">Quiz Platform</h1>
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            Back
          </Button>
        </div>
      </nav>

      <main className="flex-1 airy-section">
        <div className="container max-w-3xl">
          <div className="section-header">
            <h2>Create Your Quiz</h2>
            <p>Design an engaging quiz with multiple-choice questions</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Quiz Info */}
            <div className="card-elevated">
              <h3 className="text-xl font-serif text-foreground mb-6">Quiz Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-sans font-medium text-foreground mb-2">
                    Quiz Title *
                  </label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., History of Ancient Rome"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-sans font-medium text-foreground mb-2">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this quiz is about..."
                    className="textarea-field"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="card-elevated">
                  <div className="flex items-start justify-between mb-6">
                    <h4 className="text-lg font-serif text-foreground">
                      Question {qIndex + 1}
                    </h4>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-sans font-medium text-foreground mb-2">
                      Question Text *
                    </label>
                    <Textarea
                      value={question.text}
                      onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                      placeholder="Enter your question..."
                      className="textarea-field"
                      rows={2}
                    />
                  </div>

                  {/* Answers */}
                  <div className="space-y-3 mb-6">
                    <label className="block text-sm font-sans font-medium text-foreground">
                      Answer Options *
                    </label>
                    {question.answers.map((answer, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateAnswer(qIndex, aIndex, "isCorrect", !answer.isCorrect)}
                          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                            answer.isCorrect
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <Input
                          type="text"
                          value={answer.text}
                          onChange={(e) => updateAnswer(qIndex, aIndex, "text", e.target.value)}
                          placeholder={`Answer option ${aIndex + 1}`}
                          className="input-field flex-1"
                        />
                        {question.answers.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeAnswer(qIndex, aIndex)}
                            className="flex-shrink-0 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addAnswer(qIndex)}
                    className="flex items-center gap-2 text-primary hover:text-accent transition-colors font-sans text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Answer Option
                  </button>
                </div>
              ))}
            </div>

            {/* Add Question Button */}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-4 border-2 border-dashed border-accent/30 rounded-lg text-primary hover:bg-accent/5 transition-colors font-sans flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 button-primary"
              >
                {isSubmitting ? "Creating..." : "Create Quiz"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
