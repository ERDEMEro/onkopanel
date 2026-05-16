import { useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import PatientProfiler from "@/pages/PatientProfiler";
import SymptomChecker from "@/pages/SymptomChecker";
import AiAsistan from "@/pages/AiAsistan";
import CancerLibrary from "@/pages/CancerLibrary";
import EgitimMerkezi from "@/pages/EgitimMerkezi";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { NarratorProvider } from "@/context/NarratorContext";
import { NarratorWidget } from "@/components/Narrator";
import { ThemePanel } from "@/components/ThemePanel";
import { BarChart2, Users, Stethoscope, Palette, Sparkles, BookOpen, GraduationCap } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function TabNav() {
  const [location, navigate] = useLocation();
  const [themeOpen, setThemeOpen] = useState(false);
  const { lang, setLang, t } = useLang();

  const tabs = [
    { path: "/", label: t.nav.dashboard, icon: <BarChart2 className="w-4 h-4" /> },
    { path: "/profil", label: t.nav.patientProfiler, icon: <Users className="w-4 h-4" /> },
    { path: "/belirti", label: t.nav.symptomChecker, icon: <Stethoscope className="w-4 h-4" /> },
    { path: "/kutuphane", label: t.nav.library, icon: <BookOpen className="w-4 h-4" /> },
    { path: "/egitim", label: t.nav.educationCenter, icon: <GraduationCap className="w-4 h-4" /> },
    { path: "/asistan", label: t.nav.aiAssistant, icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <>
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
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            {/* Language toggle */}
            <div className="flex items-center rounded-md border overflow-hidden text-xs font-medium h-7">
              <button
                onClick={() => setLang("tr")}
                className={`px-2.5 h-full transition-colors ${
                  lang === "tr"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                TR
              </button>
              <div className="w-px h-4 bg-border" />
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 h-full transition-colors ${
                  lang === "en"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                EN
              </button>
            </div>

            {/* Theme button */}
            <button
              onClick={() => setThemeOpen(true)}
              className="flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium border transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
              title={t.nav.theme}
            >
              <Palette className="w-3.5 h-3.5" />
              {t.nav.theme}
            </button>
          </div>
        </div>
      </nav>

      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />
    </>
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
        <Route path="/kutuphane" component={CancerLibrary} />
        <Route path="/egitim" component={EgitimMerkezi} />
        <Route path="/asistan" component={AiAsistan} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function AppInner() {
  const { lang } = useLang();
  return (
    <NarratorProvider lang={lang}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <NarratorWidget />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </NarratorProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
