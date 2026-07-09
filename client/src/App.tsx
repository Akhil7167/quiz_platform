import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import QuizCreation from "./pages/QuizCreation";
import QuizListing from "./pages/QuizListing";
import QuizTaking from "./pages/QuizTaking";
import QuizResults from "./pages/QuizResults";
import AuthCallback from "./pages/AuthCallback";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/auth/callback"} component={AuthCallback} />
      <Route path={"/create-quiz"} component={QuizCreation} />
      <Route path={"/quizzes"} component={QuizListing} />
      <Route path={"/quiz/:quizId"} component={QuizTaking} />
      <Route path={"/results/:attemptId"} component={QuizResults} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
