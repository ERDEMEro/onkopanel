import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Crown, Check, Zap, Star, Brain, Activity, Sparkles, TrendingUp, X, Loader2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string };
}
interface Product {
  id: string;
  name: string;
  description: string;
  prices: Price[];
}

const PREMIUM_FEATURES = [
  { icon: <Sparkles className="w-5 h-5 text-indigo-500" />, label: "YZ Asistan", desc: "Sınırsız AI sohbet desteği" },
  { icon: <Star className="w-5 h-5 text-amber-500" />, label: "Beslenme AI Planı", desc: "Kişiselleştirilmiş beslenme planı" },
  { icon: <Brain className="w-5 h-5 text-pink-500" />, label: "Yaşam Kalitesi AI", desc: "Akıllı iyileştirme planları" },
  { icon: <Activity className="w-5 h-5 text-rose-500" />, label: "Psikolojik Destek AI", desc: "Kişisel psikolojik destek planı" },
  { icon: <TrendingUp className="w-5 h-5 text-cyan-500" />, label: "Gelişmiş Analitik", desc: "Detaylı sağlık analizleri" },
];

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}

export default function Premium() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">("month");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/api/stripe/products`).then(r => r.json()),
      fetch(`${BASE}/api/stripe/subscription`).then(r => r.json()),
    ]).then(([prod, sub]) => {
      setProducts(prod.data || []);
      setSubscription(sub.subscription);
    }).catch(() => setError("Fiyat bilgileri yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  const product = products[0];
  const selectedPrice = product?.prices.find(p => p.recurring?.interval === selectedInterval);
  const monthlyPrice = product?.prices.find(p => p.recurring?.interval === "month");
  const yearlyPrice = product?.prices.find(p => p.recurring?.interval === "year");
  const yearSaving = monthlyPrice && yearlyPrice
    ? Math.round(100 - (yearlyPrice.unit_amount / (monthlyPrice.unit_amount * 12)) * 100)
    : 0;

  async function handleCheckout() {
    if (!selectedPrice) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: selectedPrice.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Ödeme sayfası açılamadı.");
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch(`${BASE}/api/stripe/portal`, { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Portal açılamadı.");
    } finally {
      setPortalLoading(false);
    }
  }

  const isPremium = subscription?.status === "active" || subscription?.status === "trialing";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg">
            <Crown className="w-4 h-4" /> OnkoPanel Premium
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Sağlığınız için en iyisi
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            Yapay zeka destekli kişisel sağlık asistanınıza tam erişim. İstediğiniz zaman iptal edin.
          </p>
        </div>

        {/* Active subscription banner */}
        {isPremium && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Premium üyeliğiniz aktif!</p>
                  <p className="text-sm text-white/80">Tüm özelliklere erişiminiz var.</p>
                </div>
              </div>
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
              >
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Aboneliği Yönet
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Premium'a dahil</h2>
          <div className="space-y-3">
            {PREMIUM_FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        {!isPremium && (
          <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Fiyatlandırma</h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <p className="text-sm text-destructive text-center py-4">{error}</p>
            ) : (
              <>
                {/* Interval toggle */}
                <div className="flex gap-2 p-1 rounded-xl bg-muted">
                  {(["month", "year"] as const).map(interval => (
                    <button
                      key={interval}
                      onClick={() => setSelectedInterval(interval)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedInterval === interval
                          ? "bg-white text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {interval === "month" ? "Aylık" : (
                        <span className="flex items-center justify-center gap-1.5">
                          Yıllık
                          {yearSaving > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                              %{yearSaving} indirim
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Price display */}
                {selectedPrice && (
                  <div className="text-center py-2">
                    <div className="text-4xl font-bold text-foreground">
                      {fmt(selectedPrice.unit_amount, selectedPrice.currency)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedInterval === "month" ? "/ ay" : "/ yıl · " + (monthlyPrice ? fmt(Math.round(selectedPrice.unit_amount / 12), selectedPrice.currency) + " / ay" : "")}
                    </p>
                  </div>
                )}

                {/* CTA */}
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || !selectedPrice}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
                >
                  {checkoutLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {checkoutLoading ? "Yönlendiriliyor..." : "Premium'a Geç"}
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  Güvenli ödeme · Stripe ile korunuyor · İstediğiniz zaman iptal
                </p>
              </>
            )}
          </div>
        )}

        {/* Back link */}
        <button
          onClick={() => navigate("/")}
          className="w-full py-3 rounded-xl border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          Ana sayfaya dön
        </button>
      </div>
    </div>
  );
}
