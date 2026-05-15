import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import PatientProfiler from "@/pages/PatientProfiler";
import SymptomChecker from "@/pages/SymptomChecker";
import { BarChart2, Users, Stethoscope } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);
  return <>{children}</>;
}

function TabNav() {
  const [location, navigate] = useLocation();

  const tabs = [
    { path: "/", label: "Veri Panosu", icon: <BarChart2 className="w-4 h-4" /> },
    { path: "/profil", label: "Hasta Profil Aracı", icon: <Users className="w-4 h-4" /> },
    { path: "/belirti", label: "Belirti Değerlendirici", icon: <Stethoscope className="w-4 h-4" /> },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-[1400px] mx-auto px-6 flex items-center gap-1 h-11">
        {tabs.map((tab) => {
          const active = location === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-1.5 px-4 h-full text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-teal-500 text-teal-600 dark:text-teal-400"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <TabNav />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/profil" component={PatientProfiler} />
        <Route path="/belirti" component={SymptomChecker} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
