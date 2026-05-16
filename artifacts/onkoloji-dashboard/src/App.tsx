import { type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
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
import PsikolojikDestek from "@/pages/PsikolojikDestek";
import BakiciRehberi from "@/pages/BakiciRehberi";
import BeslenmeDanismani from "@/pages/BeslenmeDanismani";
import BesinTakvimi from "@/pages/BesinTakvimi";
import HatirlaticiTakip from "@/pages/HatirlaticiTakip";
import BeliritGunlugu from "@/pages/BeliritGunlugu";
import OnkoHaberler from "@/pages/OnkoHaberler";
import YasamKalitesi from "@/pages/YasamKalitesi";
import EgzersizTakip from "@/pages/EgzersizTakip";
import OncelikPaneli from "@/pages/OncelikPaneli";
import GelismisAnalitik from "@/pages/GelismisAnalitik";
import IlacEtklesim from "@/pages/IlacEtklesim";
import HastaAnaSayfa from "@/pages/HastaAnaSayfa";
import AuthPage from "@/pages/AuthPage";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { NarratorProvider } from "@/context/NarratorContext";
import { NarratorWidget } from "@/components/Narrator";
import { BarChart2, User, Users, Stethoscope, Sparkles, BookOpen, GraduationCap, Settings, Activity, LogIn, LogOut, Loader2, ClipboardList, Heart, Salad, Bell, NotebookPen, Newspaper, Star, AlertTriangle, ChevronLeft, ChevronRight, TrendingUp, Pill, CalendarDays } from "lucide-react";

import { useTheme } from "@/context/ThemeContext";
import { useAuth, AuthProvider } from "@workspace/replit-auth-web";
import { LoginModal } from "@/components/LoginModal";
import { useState, useRef, useEffect, useCallback } from "react";

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
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateScrollState); ro.disconnect(); };
  }, [updateScrollState]);

  // Re-check when tabs change (login/logout)
  useEffect(() => { setTimeout(updateScrollState, 50); }, [user, updateScrollState]);

  function scrollTabs(dir: "left" | "right") {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  }

  const isDoctor = !!user?.isDoctor;

  const mainTabs = isDoctor
    ? [
        { path: "/",            label: t.nav.dashboard,       icon: <BarChart2 className="w-3.5 h-3.5" /> },
        { path: "/profil",      label: t.nav.patientProfiler, icon: <Users className="w-3.5 h-3.5" /> },
        { path: "/kutuphane",   label: t.nav.library,         icon: <BookOpen className="w-3.5 h-3.5" /> },
        { path: "/oncelik",     label: "Öncelik Paneli",      icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        { path: "/asistan",     label: t.nav.aiAssistant,     icon: <Sparkles className="w-3.5 h-3.5" /> },
        { path: "/vaka",        label: "Vaka Doldur",         icon: <ClipboardList className="w-3.5 h-3.5" /> },
      ]
    : [
        { path: "/",            label: "Ana Sayfa",            icon: <User className="w-3.5 h-3.5" /> },
        { path: "/belirti",     label: t.nav.symptomChecker,  icon: <Stethoscope className="w-3.5 h-3.5" /> },
        { path: "/gunluk",      label: "Belirti Günlüğü",     icon: <NotebookPen className="w-3.5 h-3.5" /> },
        { path: "/egzersiz",    label: "Egzersiz",            icon: <Activity className="w-3.5 h-3.5" /> },
        { path: "/hatirlatici", label: "İlaç & Randevu",      icon: <Bell className="w-3.5 h-3.5" /> },
        { path: "/beslenme",    label: "Beslenme",            icon: <Salad className="w-3.5 h-3.5" /> },
        { path: "/takvim",      label: "Takvim",              icon: <CalendarDays className="w-3.5 h-3.5" /> },
        { path: "/yasam",       label: "Yaşam Kalitesi",      icon: <Star className="w-3.5 h-3.5" /> },
        { path: "/destek",      label: "Psikolojik Destek",   icon: <Heart className="w-3.5 h-3.5" /> },
        { path: "/aile",        label: "Aile Rehberi",        icon: <Users className="w-3.5 h-3.5" /> },
        { path: "/haberler",    label: "Haberler",            icon: <Newspaper className="w-3.5 h-3.5" /> },
        { path: "/egitim",      label: t.nav.educationCenter, icon: <GraduationCap className="w-3.5 h-3.5" /> },
        { path: "/asistan",     label: t.nav.aiAssistant,     icon: <Sparkles className="w-3.5 h-3.5" /> },
        { path: "/analitik",    label: "Analitik ★",          icon: <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> },
        { path: "/ilac-etki",   label: "İlaç Etkileşim ★",   icon: <Pill className="w-3.5 h-3.5 text-amber-500" /> },
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

        {/* Main tabs — scrollable */}
        <div className="flex items-center h-full flex-1 min-w-0 relative">
          {/* Left arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scrollTabs("left")}
              className="absolute left-0 z-10 h-full px-1 flex items-center bg-gradient-to-r from-background via-background/90 to-transparent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Scrollable tab list */}
          <div
            ref={tabsRef}
            className="flex items-center h-full overflow-x-auto scrollbar-none scroll-smooth"
            style={{ scrollbarWidth: "none" }}
          >
            {mainTabs.map((tab) => (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={tabCls(location === tab.path) + " shrink-0"}
              >
                {tab.icon}
                <span className="hidden md:inline whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Right arrow */}
          {canScrollRight && (
            <button
              onClick={() => scrollTabs("right")}
              className="absolute right-0 z-10 h-full px-1 flex items-center bg-gradient-to-l from-background via-background/90 to-transparent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
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
  const { isAuthenticated, isLoading, user } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <AuthPage />;
  }

  const isDoctor = !!user?.isDoctor;

  return (
    <>
      <TabNav onLoginClick={() => setLoginOpen(true)} />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      <PageTransition>
        <Switch>
          {isDoctor ? (
            <Route path="/" component={Dashboard} />
          ) : (
            <Route path="/" component={HastaAnaSayfa} />
          )}
          <Route path="/profil"    component={isDoctor ? PatientProfiler : NotFound} />
          <Route path="/belirti"      component={SymptomChecker} />
          <Route path="/gunluk"       component={isDoctor ? NotFound : BeliritGunlugu} />
          <Route path="/egzersiz"     component={isDoctor ? NotFound : EgzersizTakip} />
          <Route path="/hatirlatici"  component={isDoctor ? NotFound : HatirlaticiTakip} />
          <Route path="/beslenme"     component={isDoctor ? NotFound : BeslenmeDanismani} />
          <Route path="/takvim"       component={isDoctor ? NotFound : BesinTakvimi} />
          <Route path="/yasam"        component={isDoctor ? NotFound : YasamKalitesi} />
          <Route path="/destek"       component={isDoctor ? NotFound : PsikolojikDestek} />
          <Route path="/aile"         component={isDoctor ? NotFound : BakiciRehberi} />
          <Route path="/haberler"     component={isDoctor ? NotFound : OnkoHaberler} />
          <Route path="/kutuphane"    component={isDoctor ? CancerLibrary : NotFound} />
          <Route path="/oncelik"      component={isDoctor ? OncelikPaneli : NotFound} />
          <Route path="/egitim"       component={EgitimMerkezi} />
          <Route path="/asistan"      component={AiAsistan} />
          <Route path="/ayarlar"      component={Ayarlar} />
          <Route path="/vaka"         component={isDoctor ? VakaDoldur : NotFound} />
          <Route path="/analitik"     component={GelismisAnalitik} />
          <Route path="/ilac-etki"    component={IlacEtklesim} />
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
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
