import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";

// Lazy load pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Verify = lazy(() => import("./pages/Verify"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Quizzes = lazy(() => import("./pages/Quizzes"));
const Notes = lazy(() => import("./pages/Notes"));
const Stats = lazy(() => import("./pages/Stats"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Learn = lazy(() => import("./pages/Learn"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Presentation = lazy(() => import("./presentation/Presentation"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <svg className="w-8 h-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className="text-sm text-text-soft">Loading...</span>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes - redirect to dashboard if authenticated */}
                <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/verify" element={<PublicRoute><Verify /></PublicRoute>} />
                
                {/* Onboarding - only needs authentication, not onboarding complete */}
                <Route path="/onboarding" element={
                  <ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>
                } />
                
                {/* Protected routes - need authentication AND onboarding */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
                <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
                <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
                <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
                <Route path="/learn/:pathId" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
                <Route path="/learn/:pathId/:topicId/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                
                {/* Presentation - public access for hackathon demo */}
                <Route path="/presentation" element={<Presentation />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
