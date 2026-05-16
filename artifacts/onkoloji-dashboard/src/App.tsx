import { type ReactNode } from "react";
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
import Ayarlar from "@/pages/Ayarlar";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { NarratorProvider } from "@/context/NarratorContext";
import { NarratorWidget } from "@/components/Narrator";
import { BarChart2, Users, Stethoscope, Sparkles, BookOpen, GraduationCap, Settings, Activity } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

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
  const { t } = useLang();
  const { isDark } = useTheme();

  const mainTabs = [
    { path: "/",          label: t.nav.dashboard,       icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { path: "/profil",    label: t.nav.patientProfiler, icon: <Users className="w-3.5 h-3.5" /> },
    { path: "/belirti",   label: t.nav.symptomChecker,  icon: <Stethoscope className="w-3.5 h-3.5" /> },
    { path: "/kutuphane", label: t.nav.library,         icon: <BookOpen className="w-3.5 h-3.5" /> },
    { path: "/egitim",    label: t.nav.educationCenter, icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { path: "/asistan",   label: t.nav.aiAssistant,     icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  const tabCls = (active: boolean) =>
    `flex items-center gap-1.5 px-3.5 h-full text-[13px] font-medium border-b-2 transition-all ${
      active
        ? "border-primary text-primary"
        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 flex items-center h-12">

        {/* Brand */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 mr-3 pr-4 border-r shrink-0 h-full hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-[13px] tracking-tight text-foreground hidden sm:block">OnkoPanel</span>
        </button>

        {/* Main tabs */}
        <div className="flex items-center h-full flex-1 overflow-x-auto scrollbar-none">
          {mainTabs.map((tab) => (
            <button key={tab.path} onClick={() => navigate(tab.path)} className={tabCls(location === tab.path)}>
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings — pinned right */}
        <div className="flex items-center h-full pl-2 border-l ml-2 shrink-0">
          <button
            onClick={() => navigate("/ayarlar")}
            className={tabCls(location === "/ayarlar")}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t.nav.settings}</span>
          </button>
        </div>

      </div>
    </nav>
  );
}

function PageTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div key={location} className="anim-fsu" style={{ animationDuration: "0.38s" }}>
      {children}
    </div>
  );
}

function Router() {
  return (
    <>
      <TabNav />
      <PageTransition>
        <Switch>
          <Route path="/"          component={Dashboard} />
          <Route path="/profil"    component={PatientProfiler} />
          <Route path="/belirti"   component={SymptomChecker} />
          <Route path="/kutuphane" component={CancerLibrary} />
          <Route path="/egitim"    component={EgitimMerkezi} />
          <Route path="/asistan"   component={AiAsistan} />
          <Route path="/ayarlar"   component={Ayarlar} />
          <Route component={NotFound} />
        </Switch>
      </PageTransition>
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
