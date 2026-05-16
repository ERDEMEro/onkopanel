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
import VakaDoldur from "@/pages/VakaDoldur";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { NarratorProvider } from "@/context/NarratorContext";
import { NarratorWidget } from "@/components/Narrator";
import { BarChart2, Users, Stethoscope, Sparkles, BookOpen, GraduationCap, Settings, Activity, LogIn, LogOut, Loader2, ClipboardList } from "lucide-react";

import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@workspace/replit-auth-web";
import { LoginModal } from "@/components/LoginModal";
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function TabNav({ onLoginClick }: { onLoginClick: () => void }) {
  const [location, navigate] = useLocation();
  const { t } = useLang();
  const { isDark } = useTheme();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const isDoctor = !!user?.isDoctor;

  const mainTabs = isDoctor
    ? [
        { path: "/",          label: t.nav.dashboard,       icon: <BarChart2 className="w-3.5 h-3.5" /> },
        { path: "/profil",    label: t.nav.patientProfiler, icon: <Users className="w-3.5 h-3.5" /> },
        { path: "/kutuphane", label: t.nav.library,         icon: <BookOpen className="w-3.5 h-3.5" /> },
        { path: "/asistan",   label: t.nav.aiAssistant,     icon: <Sparkles className="w-3.5 h-3.5" /> },
        { path: "/vaka",      label: "Vaka Doldur",         icon: <ClipboardList className="w-3.5 h-3.5" /> },
      ]
    : [
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

        {/* Right side: Settings + Auth */}
        <div className="flex items-center h-full pl-2 border-l ml-2 shrink-0 gap-1">
          <button
            onClick={() => navigate("/ayarlar")}
            className={tabCls(location === "/ayarlar")}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t.nav.settings}</span>
          </button>

          {/* Auth user badge */}
          {isLoading ? (
            <div className="flex items-center px-2 h-full">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2 px-2 h-full">
              {user.isDoctor && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  <Stethoscope className="w-3 h-3" />
                  Dr.
                </span>
              )}
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={[user.firstName, user.lastName].filter(Boolean).join(" ") || "Kullanıcı"}
                  className="w-7 h-7 rounded-full ring-2 ring-primary/20 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                  {(user.firstName ?? user.email ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden lg:block text-[12px] font-medium text-foreground max-w-[100px] truncate">
                {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
              </span>
              <button
                onClick={() => logout()}
                aria-label="Çıkış yap"
                title="Çıkış yap"
                className="ml-0.5 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Çıkış</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              aria-label="Giriş yap"
              className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Giriş</span>
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}

function PageTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div
      key={location}
      data-narrator-content
      className="anim-fsu"
      style={{ animationDuration: "0.38s" }}
    >
      {children}
    </div>
  );
}

function Router() {
  const [loginOpen, setLoginOpen] = useState(false);
  return (
    <>
      <TabNav onLoginClick={() => setLoginOpen(true)} />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      <PageTransition>
        <Switch>
          <Route path="/"          component={Dashboard} />
          <Route path="/profil"    component={PatientProfiler} />
          <Route path="/belirti"   component={SymptomChecker} />
          <Route path="/kutuphane" component={CancerLibrary} />
          <Route path="/egitim"    component={EgitimMerkezi} />
          <Route path="/asistan"   component={AiAsistan} />
          <Route path="/ayarlar"   component={Ayarlar} />
          <Route path="/vaka"      component={VakaDoldur} />
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
