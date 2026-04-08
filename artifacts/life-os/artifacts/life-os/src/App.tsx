import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import Goals from "@/pages/Goals";
import Routines from "@/pages/Routines";
import Journal from "@/pages/Journal";
import Analytics from "@/pages/Analytics";
import Focus from "@/pages/Focus";
import Landing from "@/pages/Landing";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@workspace/replit-auth-web";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/">
          <PageWrapper><Dashboard /></PageWrapper>
        </Route>
        <Route path="/tasks">
          <PageWrapper><Tasks /></PageWrapper>
        </Route>
        <Route path="/goals">
          <PageWrapper><Goals /></PageWrapper>
        </Route>
        <Route path="/routines">
          <PageWrapper><Routines /></PageWrapper>
        </Route>
        <Route path="/journal">
          <PageWrapper><Journal /></PageWrapper>
        </Route>
        <Route path="/analytics">
          <PageWrapper><Analytics /></PageWrapper>
        </Route>
        <Route path="/focus">
          <PageWrapper><Focus /></PageWrapper>
        </Route>
        <Route>
          <PageWrapper><NotFound /></PageWrapper>
        </Route>
      </Switch>
    </AnimatePresence>
  );
}

function AuthenticatedApp() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 md:ml-64 relative scroll-smooth">
        <Router />
      </main>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
