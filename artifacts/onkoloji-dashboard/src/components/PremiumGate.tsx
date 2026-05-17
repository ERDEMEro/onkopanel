import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { Crown, Lock, Zap } from "lucide-react";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PremiumCtx {
  isPremium: boolean;
  loading: boolean;
  refresh: () => void;
}

const PremiumContext = createContext<PremiumCtx>({ isPremium: false, loading: true, refresh: () => {} });

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  function check() {
    fetch(`${BASE}/api/stripe/subscription`)
      .then(r => r.json())
      .then(data => {
        const sub = data.subscription;
        setIsPremium(sub?.status === "active" || sub?.status === "trialing");
      })
      .catch(() => setIsPremium(false))
      .finally(() => setLoading(false));
  }

  useEffect(() => { check(); }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, loading, refresh: check }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}

interface PremiumGateProps {
  children: ReactNode;
  featureName?: string;
}

export function PremiumGate({ children, featureName }: PremiumGateProps) {
  const { isPremium, loading } = usePremium();
  const [, navigate] = useLocation();

  if (loading) return null;
  if (isPremium) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center">
        <Lock className="w-7 h-7 text-indigo-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-foreground">
          {featureName ? `${featureName} Premium'da` : "Bu özellik Premium'da"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Bu özelliği kullanmak için Premium üyeliğe geçin. İstediğiniz zaman iptal edebilirsiniz.
        </p>
      </div>
      <button
        onClick={() => navigate("/premium")}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md"
      >
        <Crown className="w-4 h-4" />
        Premium'a Geç
      </button>
    </div>
  );
}

export function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold shadow-sm">
      <Crown className="w-2.5 h-2.5" /> PREMIUM
    </span>
  );
}

export function PremiumButton({ onClick, label = "Premium'a Geç" }: { onClick?: () => void; label?: string }) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={onClick ?? (() => navigate("/premium"))}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-sm"
    >
      <Zap className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
