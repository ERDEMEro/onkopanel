import { useState, useRef, useEffect } from "react";
import {
  AlertTriangle, CheckCircle2, Clock, FlaskConical, ChevronRight,
  Info, Stethoscope, ShieldAlert, UserRound, MapPin, Wallet,
  Building2, BadgeCheck, PhoneCall, X, Loader2,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const SYMPTOM_GROUPS = [
  {
    group: "Genel Belirtiler",
    symptoms: ["Açıklanamayan kilo kaybı", "Süregelen yorgunluk / halsizlik", "Uzun süreli ateş", "Gece terlemesi", "İştahsızlık"],
  },
  {
    group: "Solunum",
    symptoms: ["Uzun süreli öksürük", "Nefes darlığı", "Göğüs ağrısı", "Kan öksürme (hemoptizi)"],
  },
  {
    group: "Sindirim",
    symptoms: ["Mide / karın ağrısı", "Yutma güçlüğü", "Kanlı dışkı / rektal kanama", "Bağırsak alışkanlığında değişme", "Sarılık"],
  },
  {
    group: "Üriner / Üreme",
    symptoms: ["İdrarda kan", "Ağrılı / sık idrara çıkma", "Testis şişliği / ağrısı", "Vajinal anormal kanama"],
  },
  {
    group: "Cilt & Lenf",
    symptoms: ["Ciltte şüpheli leke / ülser", "Boyun / koltukaltı / kasık şişliği (lenf bezi)", "Deride sararma veya kararma"],
  },
  {
    group: "Diğer",
    symptoms: ["Kemik / eklem ağrısı", "Baş ağrısı / görme bozukluğu", "Ses kısıklığı", "Ele gelen kitle / şişlik"],
  },
];

const BUDGET_OPTIONS = [
  { value: "Kısıtlı", label: "Kısıtlı — Devlet / Üniversite Hastanesi (SGK)", desc: "Ücretsiz veya çok düşük ücret" },
  { value: "Orta", label: "Orta — Anlaşmalı Özel / Sigortalı", desc: "500 – 1.500 TL muayene" },
  { value: "Premium", label: "Premium — Üst Düzey Özel Hastane", desc: "2.000 TL ve üzeri, VIP hizmet" },
];

interface Prediction {
  cancerType: string;
  likelihood: "Yüksek" | "Orta" | "Düşük";
  matchingSymptoms: string[];
  otherTypicalSymptoms: string[];
  recommendedTests: string[];
  urgency: string;
}

interface CheckResult {
  predictions: Prediction[];
  generalAdvice: string;
  urgencyLevel: string;
}

interface Center {
  doctorName?: string | null;
  hospital: string;
  hospitalType: "Devlet" | "Üniversite" | "Özel";
  department: string;
  city: string;
  district?: string | null;
  estimatedFee: string;
  sgkCovered: boolean;
  appointmentMethod: string;
  appointmentTip: string;
  sourceUrl?: string | null;
  whyRecommended: string;
}

interface DoctorResult {
  centers: Center[];
  generalTip: string;
  importantNote: string;
}

const LIKELIHOOD_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Yüksek: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-900" },
  Orta:   { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900" },
  Düşük:  { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-900" },
};

const HOSPITAL_TYPE_STYLE: Record<string, string> = {
  Devlet:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Üniversite: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Özel:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const URGENCY_ICON: Record<string, React.ReactNode> = {
  acil:               <AlertTriangle className="w-4 h-4 text-red-600" />,
  "bir hafta içinde": <Clock className="w-4 h-4 text-amber-600" />,
  "bir ay içinde":    <CheckCircle2 className="w-4 h-4 text-blue-500" />,
};

const URGENCY_LABEL: Record<string, string> = {
  acil:               "Acil — hemen başvurun",
  "bir hafta içinde": "Bir hafta içinde başvurun",
  "bir ay içinde":    "Bir ay içinde başvurun",
};

function isSerious(result: CheckResult): boolean {
  if (result.urgencyLevel === "acil" || result.urgencyLevel === "bir hafta içinde") return true;
  return result.predictions?.some((p) => p.likelihood === "Yüksek") ?? false;
}

export default function SymptomChecker() {
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [freeText, setFreeText]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState<CheckResult | null>(null);
  const [error, setError]               = useState<string | null>(null);

  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorTarget, setDoctorTarget]       = useState<string>("");
  const [location, setLocation]               = useState("");
  const [budget, setBudget]                   = useState("");
  const [doctorLoading, setDoctorLoading]     = useState(false);
  const [doctorResult, setDoctorResult]       = useState<DoctorResult | null>(null);
  const [doctorError, setDoctorError]         = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showDoctorModal) setTimeout(() => locationRef.current?.focus(), 100);
  }, [showDoctorModal]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleSymptom(s: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  async function handleSubmit() {
    const parts: string[] = [];
    if (selected.size > 0) parts.push([...selected].join(", "));
    if (freeText.trim()) parts.push(freeText.trim());
    const symptoms = parts.join(". ");
    if (!symptoms) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setDoctorResult(null);

    try {
      const res  = await fetch(`${BASE}/api/symptom-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata");
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  function openDoctorModal(cancerType: string) {
    setDoctorTarget(cancerType);
    setDoctorResult(null);
    setDoctorError(null);
    setBudget("");
    setShowDoctorModal(true);
  }

  function closeModal() {
    setShowDoctorModal(false);
  }

  async function handleDoctorSearch() {
    if (!location.trim() || !budget) return;
    setDoctorLoading(true);
    setDoctorError(null);
    setDoctorResult(null);

    try {
      const res  = await fetch(`${BASE}/api/doctor-recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancerType: doctorTarget, location: location.trim(), budget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata");
      setDoctorResult(data);
    } catch (e: any) {
      setDoctorError(e.message || "Öneri alınamadı.");
    } finally {
      setDoctorLoading(false);
    }
  }

  const hasInput = selected.size > 0 || freeText.trim().length >= 3;

  return (
    <div className="min-h-screen bg-background px-6 py-8 pb-16">
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-full px-3 py-1 mb-3">
            <Stethoscope className="w-3.5 h-3.5" /> Belirti Değerlendirici
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Yapay Zeka Belirti Tarama Aracı</h1>
          <p className="text-muted-foreground text-[15px] max-w-2xl">
            Belirtilerinizi seçin veya yazın; yapay zeka olası kanser türlerini değerlendirsin ve gerekirse size uygun onkoloğu önersin.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 mb-8 flex gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Önemli Uyarı:</span> Bu araç yalnızca bilgilendirme amaçlıdır ve kesin tıbbi tanı yerine geçmez.
            Belirtileriniz için mutlaka bir sağlık kuruluşuna veya hekime başvurunuz.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Input */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-xl border bg-card p-5">
              <p className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                Belirtilerinizi seçin
              </p>
              <div className="space-y-5">
                {SYMPTOM_GROUPS.map((g) => (
                  <div key={g.group}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{g.group}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.symptoms.map((s) => {
                        const active = selected.has(s);
                        return (
                          <button key={s} onClick={() => toggleSymptom(s)}
                            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                              active
                                ? "bg-rose-600 text-white border-rose-600"
                                : "bg-background text-muted-foreground border-border hover:border-rose-400 hover:text-rose-600"
                            }`}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Ek açıklama (isteğe bağlı)
              </p>
              <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)}
                placeholder="Belirtilerinizi kendi cümlelerinizle de açıklayabilirsiniz. Örn: '3 haftadır devam eden öksürük ve zaman zaman kan geliyor...'"
                rows={4}
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-muted-foreground/50"
              />
            </div>

            {selected.size > 0 && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                <span className="font-semibold">{selected.size} belirti seçildi:</span>{" "}
                {[...selected].join(", ")}
              </div>
            )}

            <button onClick={handleSubmit} disabled={!hasInput || loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Yapay zeka analiz ediyor…</>
              ) : (
                <><Stethoscope className="w-4 h-4" /> Belirtileri Değerlendir <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-3">
            {!result && !loading && !error && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-xl border border-dashed text-muted-foreground gap-3">
                <Stethoscope className="w-10 h-10 opacity-20" />
                <p className="text-sm">Belirtilerinizi seçip "Değerlendir" butonuna tıklayın</p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-xl border gap-4">
                <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                <div className="text-center">
                  <p className="font-medium text-sm">Onkoloji verileri analiz ediliyor…</p>
                  <p className="text-xs text-muted-foreground mt-1">Bu birkaç saniye sürebilir</p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-5 text-red-700 dark:text-red-400 text-sm flex gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Urgency banner */}
                <div className={`rounded-xl border p-4 flex items-center gap-3 ${
                  result.urgencyLevel === "acil"
                    ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
                    : result.urgencyLevel === "bir hafta içinde"
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                    : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
                }`}>
                  {URGENCY_ICON[result.urgencyLevel] ?? <Clock className="w-4 h-4" />}
                  <div>
                    <p className="font-semibold text-sm">{URGENCY_LABEL[result.urgencyLevel] ?? "Doktora başvurun"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{result.generalAdvice}</p>
                  </div>
                </div>

                {/* Predictions */}
                {result.predictions?.map((pred, i) => {
                  const style = LIKELIHOOD_STYLE[pred.likelihood] ?? LIKELIHOOD_STYLE["Düşük"];
                  const showBtn = pred.likelihood === "Yüksek" || pred.likelihood === "Orta";
                  return (
                    <div key={i} className={`rounded-xl border p-5 ${style.bg} ${style.border}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-xs text-muted-foreground font-medium">#{i + 1} Olası Tanı</span>
                          <h3 className={`font-bold text-lg capitalize ${style.text}`}>{pred.cancerType}</h3>
                        </div>
                        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.text} ${style.border} bg-white/60 dark:bg-black/20`}>
                          {pred.likelihood} İhtimal
                        </span>
                      </div>

                      {pred.matchingSymptoms?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Eşleşen Belirtiler</p>
                          <div className="flex flex-wrap gap-1">
                            {pred.matchingSymptoms.map((s, j) => (
                              <span key={j} className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.text} bg-white/60 dark:bg-black/20 border ${style.border}`}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {pred.otherTypicalSymptoms?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Bu Kanser Türünde Diğer Tipik Belirtiler</p>
                          <p className="text-xs text-foreground/70">{pred.otherTypicalSymptoms.join(" · ")}</p>
                        </div>
                      )}

                      {pred.recommendedTests?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <FlaskConical className="w-3 h-3" /> Önerilen Tetkikler
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {pred.recommendedTests.map((t, j) => (
                              <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/25 border border-border text-foreground/70">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-border/40 gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {URGENCY_ICON[pred.urgency] ?? <Clock className="w-3.5 h-3.5" />}
                          <span>{URGENCY_LABEL[pred.urgency] ?? pred.urgency}</span>
                        </div>

                        {showBtn && (
                          <button
                            onClick={() => openDoctorModal(pred.cancerType)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-current text-rose-700 dark:text-rose-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors"
                          >
                            <UserRound className="w-3.5 h-3.5" />
                            Doktora Danış
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Serious CTA banner */}
                {isSerious(result) && (
                  <div className="rounded-xl border-2 border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-rose-700 dark:text-rose-300 text-sm">Uzman Onkolog Önerisi Alın</p>
                      <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                        Sonuçlarınız ciddi görünüyor. Konumunuza ve bütçenize göre yapay zeka size uygun onkoloji uzmanlarını önerin.
                      </p>
                    </div>
                    <button
                      onClick={() => openDoctorModal(result.predictions?.[0]?.cancerType ?? "kanser")}
                      className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors"
                    >
                      <UserRound className="w-4 h-4" />
                      Doktora Danış
                    </button>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold">Yasal Uyarı:</span> Bu sonuçlar yalnızca genel bilgilendirme amaçlıdır.
                  Yapay zeka değerlendirmesi kesin tıbbi tanı niteliği taşımaz.
                  Semptomlarınız için mutlaka bir hekim tarafından muayene olunuz.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            ref={modalRef}
            className="bg-background w-full max-w-2xl rounded-2xl border shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background z-10">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Doktor Arama</p>
                <h2 className="font-bold text-base capitalize">{doctorTarget} için Uzman Önerisi</h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Location + Budget */}
              {!doctorResult && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Konumunuz (Şehir / İlçe)
                    </label>
                    <input
                      ref={locationRef}
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Örn: İstanbul, Ankara, İzmir Bornova…"
                      className="w-full text-sm rounded-xl border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5" /> Bütçeniz
                    </label>
                    <div className="space-y-2">
                      {BUDGET_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setBudget(opt.value)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                            budget === opt.value
                              ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30"
                              : "border-border hover:border-rose-300 bg-background"
                          }`}
                        >
                          <p className="text-sm font-semibold">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleDoctorSearch}
                    disabled={!location.trim() || !budget || doctorLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {doctorLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Uzmanlar aranıyor…</>
                      : <><UserRound className="w-4 h-4" /> Uzman Bul</>
                    }
                  </button>

                  {doctorError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-400 flex gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> {doctorError}
                    </div>
                  )}
                </div>
              )}

              {/* Results */}
              {doctorResult && (
                <div className="space-y-4">
                  {/* AI disclaimer banner */}
                  <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3 flex gap-2.5 text-xs">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-blue-800 dark:text-blue-300">
                      <span className="font-semibold">Nasıl randevu alırsınız?</span> Aşağıdaki hastanelerin onkoloji bölümünü seçin, ardından <span className="font-semibold">MHRS (mhrs.gov.tr)</span> üzerinden veya hastanenin web sitesinden gerçek doktorunuzu bizzat seçerek randevu alın.
                    </p>
                  </div>

                  {doctorResult.centers?.map((center, i) => (
                    <div key={i} className="rounded-xl border bg-card p-4">
                      {/* Doctor name if available */}
                      {center.doctorName && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                            <UserRound className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{center.doctorName}</p>
                            <p className="text-xs text-muted-foreground">{center.department}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HOSPITAL_TYPE_STYLE[center.hospitalType] ?? "bg-muted text-muted-foreground"}`}>
                              {center.hospitalType}
                            </span>
                            {center.sgkCovered && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-medium flex items-center gap-1">
                                <BadgeCheck className="w-3 h-3" /> SGK
                              </span>
                            )}
                          </div>
                          <p className={`font-semibold text-sm ${center.doctorName ? "text-muted-foreground" : ""}`}>{center.hospital}</p>
                          {!center.doctorName && (
                            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">{center.department}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{center.district ? `${center.district}, ` : ""}{center.city}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 text-xs mt-2">
                        <div className="flex items-start gap-1.5 text-muted-foreground">
                          <Wallet className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{center.estimatedFee}</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-muted-foreground">
                          <PhoneCall className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{center.appointmentMethod}</span>
                        </div>
                        {center.appointmentTip && (
                          <div className="flex items-start gap-1.5 text-muted-foreground">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{center.appointmentTip}</span>
                          </div>
                        )}
                      </div>

                      {center.whyRecommended && (
                        <p className="mt-2.5 text-xs text-muted-foreground border-t pt-2.5 leading-relaxed italic">{center.whyRecommended}</p>
                      )}

                      {center.sourceUrl && (
                        <a
                          href={center.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ChevronRight className="w-3 h-3" />
                          Kaynağa git
                        </a>
                      )}
                    </div>
                  ))}

                  {doctorResult.generalTip && (
                    <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold">Genel Öneri:</span> {doctorResult.generalTip}
                    </div>
                  )}

                  {doctorResult.importantNote && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      <span className="font-semibold">Önemli:</span> {doctorResult.importantNote}
                    </div>
                  )}

                  <button
                    onClick={() => { setDoctorResult(null); setDoctorError(null); }}
                    className="w-full py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Yeniden Ara
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
