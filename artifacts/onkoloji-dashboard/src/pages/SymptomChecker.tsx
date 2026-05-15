import { useState, useRef, useEffect } from "react";
import {
  AlertTriangle, CheckCircle2, Clock, FlaskConical, ChevronRight,
  Info, Stethoscope, ShieldAlert, UserRound, MapPin, Wallet,
  BadgeCheck, PhoneCall, X, Loader2, Pill, Database, Leaf, AlertCircle,
} from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import {
  useGetMedsByCancerType,
  getGetMedsByCancerTypeQueryKey,
} from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const DATASET_CANCER_MAP: Array<{ key: string; keywords: string[] }> = [
  { key: "Meme",      keywords: ["meme"] },
  { key: "Akciğer",  keywords: ["akciğer", "akciger", "akciğer", "nsclc", "sclc", "lung"] },
  { key: "Prostat",  keywords: ["prostat"] },
  { key: "Kolorektal", keywords: ["kolorektal", "kolon", "rektum", "colorectal"] },
  { key: "Lenfoma",  keywords: ["lenfoma", "hodgkin", "diffuse"] },
  { key: "Mide",     keywords: ["mide", "gastrik", "gastric"] },
  { key: "Pankreas", keywords: ["pankreas"] },
  { key: "Over",     keywords: ["over", "ovarian"] },
];

function detectDatasetCancerType(aiCancerType: string): string | null {
  const t = aiCancerType.toLowerCase();
  for (const { key, keywords } of DATASET_CANCER_MAP) {
    if (keywords.some((kw) => t.includes(kw))) return key;
  }
  return null;
}

const SYMPTOM_GROUPS_TR = [
  { group: "Genel Belirtiler", symptoms: ["Açıklanamayan kilo kaybı", "Süregelen yorgunluk / halsizlik", "Uzun süreli ateş", "Gece terlemesi", "İştahsızlık"] },
  { group: "Solunum", symptoms: ["Uzun süreli öksürük", "Nefes darlığı", "Göğüs ağrısı", "Kan öksürme (hemoptizi)"] },
  { group: "Sindirim", symptoms: ["Mide / karın ağrısı", "Yutma güçlüğü", "Kanlı dışkı / rektal kanama", "Bağırsak alışkanlığında değişme", "Sarılık"] },
  { group: "Üriner / Üreme", symptoms: ["İdrarda kan", "Ağrılı / sık idrara çıkma", "Testis şişliği / ağrısı", "Vajinal anormal kanama"] },
  { group: "Cilt & Lenf", symptoms: ["Ciltte şüpheli leke / ülser", "Boyun / koltukaltı / kasık şişliği (lenf bezi)", "Deride sararma veya kararma"] },
  { group: "Diğer", symptoms: ["Kemik / eklem ağrısı", "Baş ağrısı / görme bozukluğu", "Ses kısıklığı", "Ele gelen kitle / şişlik"] },
];

const SYMPTOM_GROUPS_EN = [
  { group: "Genel Belirtiler", symptoms: ["Unexplained weight loss", "Persistent fatigue / weakness", "Prolonged fever", "Night sweats", "Loss of appetite"] },
  { group: "Solunum", symptoms: ["Persistent cough", "Shortness of breath", "Chest pain", "Coughing up blood (hemoptysis)"] },
  { group: "Sindirim", symptoms: ["Stomach / abdominal pain", "Difficulty swallowing", "Bloody stool / rectal bleeding", "Change in bowel habits", "Jaundice"] },
  { group: "Üriner / Üreme", symptoms: ["Blood in urine", "Painful / frequent urination", "Testicular swelling / pain", "Abnormal vaginal bleeding"] },
  { group: "Cilt & Lenf", symptoms: ["Suspicious skin lesion / ulcer", "Neck / armpit / groin swelling (lymph node)", "Yellowing or darkening of skin"] },
  { group: "Diğer", symptoms: ["Bone / joint pain", "Headache / vision disturbance", "Hoarseness", "Palpable lump / swelling"] },
];

const BUDGET_OPTIONS_TR = [
  { value: "Kısıtlı", label: "Kısıtlı — Devlet / Üniversite Hastanesi (SGK)", desc: "Ücretsiz veya çok düşük ücret" },
  { value: "Orta", label: "Orta — Anlaşmalı Özel / Sigortalı", desc: "500 – 1.500 TL muayene" },
  { value: "Premium", label: "Premium — Üst Düzey Özel Hastane", desc: "2.000 TL ve üzeri, VIP hizmet" },
];

const BUDGET_OPTIONS_EN = [
  { value: "Kısıtlı", label: "Limited — Public / University Hospital (SGK)", desc: "Free or very low cost" },
  { value: "Orta", label: "Medium — Contracted Private / Insured", desc: "500 – 1,500 TL consultation" },
  { value: "Premium", label: "Premium — High-End Private Hospital", desc: "2,000+ TL, VIP service" },
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

const URGENCY_LABEL_TR: Record<string, string> = {
  acil:               "Acil — hemen başvurun",
  "bir hafta içinde": "Bir hafta içinde başvurun",
  "bir ay içinde":    "Bir ay içinde başvurun",
};

const URGENCY_LABEL_EN: Record<string, string> = {
  acil:               "Urgent — seek care immediately",
  "bir hafta içinde": "Seek care within one week",
  "bir ay içinde":    "Seek care within one month",
};

function isSerious(result: CheckResult): boolean {
  if (result.urgencyLevel === "acil" || result.urgencyLevel === "bir hafta içinde") return true;
  return result.predictions?.some((p) => p.likelihood === "Yüksek") ?? false;
}

export default function SymptomChecker() {
  const { lang, t } = useLang();
  const s = t.symptom;

  const medsCancerQ = useGetMedsByCancerType({
    query: { queryKey: getGetMedsByCancerTypeQueryKey() },
  });

  const SYMPTOM_GROUPS = lang === "en" ? SYMPTOM_GROUPS_EN : SYMPTOM_GROUPS_TR;
  const BUDGET_OPTIONS = lang === "en" ? BUDGET_OPTIONS_EN : BUDGET_OPTIONS_TR;
  const URGENCY_LABEL = lang === "en" ? URGENCY_LABEL_EN : URGENCY_LABEL_TR;

  const [selected, setSelected]               = useState<Set<string>>(new Set());
  const [freeText, setFreeText]               = useState("");
  const [loading, setLoading]                 = useState(false);
  const [result, setResult]                   = useState<CheckResult | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorTarget, setDoctorTarget]       = useState<string>("");
  const [location, setLocation]               = useState("");
  const [budget, setBudget]                   = useState("");
  const [doctorLoading, setDoctorLoading]     = useState(false);
  const [doctorResult, setDoctorResult]       = useState<DoctorResult | null>(null);
  const [doctorError, setDoctorError]         = useState<string | null>(null);

  const modalRef    = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showDoctorModal) setTimeout(() => locationRef.current?.focus(), 100);
  }, [showDoctorModal]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeModal(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleSymptom(sym: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym); else next.add(sym);
      return next;
    });
  }

  async function handleSubmit() {
    const parts: string[] = [];
    if (selected.size > 0) parts.push([...selected].join(", "));
    if (freeText.trim()) parts.push(freeText.trim());
    const symptoms = parts.join(". ");
    if (!symptoms) return;

    setLoading(true); setResult(null); setError(null); setDoctorResult(null);
    try {
      const res  = await fetch(`${BASE}/api/symptom-check`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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
    setDoctorResult(null); setDoctorError(null); setBudget("");
    setShowDoctorModal(true);
  }

  function closeModal() { setShowDoctorModal(false); }

  async function handleDoctorSearch() {
    if (!location.trim() || !budget) return;
    setDoctorLoading(true); setDoctorError(null); setDoctorResult(null);
    try {
      const res  = await fetch(`${BASE}/api/doctor-recommend`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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
  const selectedLabel = lang === "en"
    ? `${selected.size} symptom${selected.size !== 1 ? "s" : ""} selected:`
    : `${selected.size} belirti seçildi:`;
  const analyzingLabel = lang === "en" ? "Analyzing oncology data…" : "Onkoloji verileri analiz ediliyor…";
  const mayTakeMoment = lang === "en" ? "This may take a few seconds" : "Bu birkaç saniye sürebilir";
  const legalWarning = lang === "en"
    ? <><span className="font-semibold">Disclaimer:</span> These results are for general informational purposes only. AI assessment does not constitute a definitive medical diagnosis. Please consult a physician for your symptoms.</>
    : <><span className="font-semibold">Yasal Uyarı:</span> Bu sonuçlar yalnızca genel bilgilendirme amaçlıdır. Yapay zeka değerlendirmesi kesin tıbbi tanı niteliği taşımaz. Semptomlarınız için mutlaka bir hekim tarafından muayene olunuz.</>;
  const importantWarning = lang === "en" ? "Important Warning" : "Önemli Uyarı";
  const likelyDiag = lang === "en" ? "Possible Diagnosis" : "Olası Tanı";
  const likelihoodSuffix = lang === "en" ? " Likelihood" : " İhtimal";
  const expertRec = lang === "en" ? "Get Expert Oncologist Recommendation" : "Uzman Onkolog Önerisi Alın";
  const expertRecBody = lang === "en"
    ? "Your results look serious. AI can recommend suitable oncology specialists based on your location and budget."
    : "Sonuçlarınız ciddi görünüyor. Konumunuza ve bütçenize göre yapay zeka size uygun onkoloji uzmanlarını önersin.";
  const additionalNote = lang === "en" ? "Additional note (optional)" : "Ek açıklama (isteğe bağlı)";
  const textareaPlaceholder = lang === "en"
    ? "You can also describe your symptoms in your own words. E.g. 'I have had a persistent cough for 3 weeks and sometimes cough up blood...'"
    : "Belirtilerinizi kendi cümlelerinizle de açıklayabilirsiniz. Örn: '3 haftadır devam eden öksürük ve zaman zaman kan geliyor...'";
  const searchLabel = lang === "en" ? "Find Specialist" : "Uzman Bul";
  const searchingLabel = lang === "en" ? "Searching specialists…" : "Uzmanlar aranıyor…";
  const specialistFor = lang === "en" ? "for" : "için";
  const specialistSearch = lang === "en" ? "Specialist Search" : "Doktor Arama";
  const doctorSearchTitle = lang === "en" ? "Specialist Recommendation" : "Uzman Önerisi";
  const locationLabel = lang === "en" ? "Your Location (City / District)" : "Konumunuz (Şehir / İlçe)";
  const locationPlaceholder = lang === "en" ? "E.g. Istanbul, Ankara, Izmir Bornova…" : "Örn: İstanbul, Ankara, İzmir Bornova…";
  const searchAgain = lang === "en" ? "Search Again" : "Yeniden Ara";

  return (
    <div className="min-h-screen bg-background px-6 py-8 pb-16">
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-full px-3 py-1 mb-3">
            <Stethoscope className="w-3.5 h-3.5" /> {s.badge}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{s.title}</h1>
          <p className="text-muted-foreground text-[15px] max-w-2xl">{s.subtitle}</p>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 mb-8 flex gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">{importantWarning}:</span> {s.warning}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Input */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-xl border bg-card p-5">
              <p className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                {s.selectSymptoms}
              </p>
              <div className="space-y-5">
                {SYMPTOM_GROUPS.map((g) => (
                  <div key={g.group}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {s.groups[g.group] ?? g.group}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.symptoms.map((sym) => {
                        const active = selected.has(sym);
                        return (
                          <button key={sym} onClick={() => toggleSymptom(sym)}
                            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                              active ? "bg-rose-600 text-white border-rose-600" : "bg-background text-muted-foreground border-border hover:border-rose-400 hover:text-rose-600"
                            }`}>
                            {sym}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{additionalNote}</p>
              <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)}
                placeholder={textareaPlaceholder} rows={4}
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-muted-foreground/50" />
            </div>

            {selected.size > 0 && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                <span className="font-semibold">{selectedLabel}</span>{" "}{[...selected].join(", ")}
              </div>
            )}

            <button onClick={handleSubmit} disabled={!hasInput || loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {s.evaluating}</>
                : <><Stethoscope className="w-4 h-4" /> {s.evaluate} <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-3">
            {!result && !loading && !error && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-xl border border-dashed text-muted-foreground gap-3">
                <Stethoscope className="w-10 h-10 opacity-20" />
                <p className="text-sm">{s.emptyState}</p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-xl border gap-4">
                <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                <div className="text-center">
                  <p className="font-medium text-sm">{analyzingLabel}</p>
                  <p className="text-xs text-muted-foreground mt-1">{mayTakeMoment}</p>
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
                  result.urgencyLevel === "acil" ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
                  : result.urgencyLevel === "bir hafta içinde" ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                  : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"}`}>
                  {URGENCY_ICON[result.urgencyLevel] ?? <Clock className="w-4 h-4" />}
                  <div>
                    <p className="font-semibold text-sm">{URGENCY_LABEL[result.urgencyLevel] ?? (lang === "en" ? "Consult a doctor" : "Doktora başvurun")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{result.generalAdvice}</p>
                  </div>
                </div>

                {result.predictions?.map((pred, i) => {
                  const style = LIKELIHOOD_STYLE[pred.likelihood] ?? LIKELIHOOD_STYLE["Düşük"];
                  const showBtn = pred.likelihood === "Yüksek" || pred.likelihood === "Orta";
                  const datasetKey = detectDatasetCancerType(pred.cancerType);
                  const datasetEntry = datasetKey
                    ? medsCancerQ.data?.find((d) => d.cancerType === datasetKey)
                    : null;
                  const topMeds = datasetEntry?.medications?.slice(0, 6) ?? [];

                  return (
                    <div key={i} className={`rounded-xl border p-5 ${style.bg} ${style.border}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-xs text-muted-foreground font-medium">#{i + 1} {likelyDiag}</span>
                          <h3 className={`font-bold text-lg capitalize ${style.text}`}>{pred.cancerType}</h3>
                        </div>
                        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.text} ${style.border} bg-white/60 dark:bg-black/20`}>
                          {pred.likelihood}{likelihoodSuffix}
                        </span>
                      </div>

                      {pred.matchingSymptoms?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{s.matchingSymptoms}</p>
                          <div className="flex flex-wrap gap-1">
                            {pred.matchingSymptoms.map((sym, j) => (
                              <span key={j} className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.text} bg-white/60 dark:bg-black/20 border ${style.border}`}>{sym}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {pred.otherTypicalSymptoms?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{s.otherSymptoms}</p>
                          <p className="text-xs text-foreground/70">{pred.otherTypicalSymptoms.join(" · ")}</p>
                        </div>
                      )}

                      {pred.recommendedTests?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <FlaskConical className="w-3 h-3" /> {s.recommendedTests}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {pred.recommendedTests.map((tst, j) => (
                              <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/25 border border-border text-foreground/70">{tst}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data-based medication profile */}
                      {datasetKey && (
                        <div className="mb-4 rounded-lg border border-border/60 bg-white/50 dark:bg-black/20 p-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5" />
                            {s.dataBasedMedsTitle}
                          </p>
                          {medsCancerQ.isLoading ? (
                            <div className="flex gap-1.5">
                              {[...Array(4)].map((_, k) => (
                                <div key={k} className="h-5 w-20 rounded-full bg-muted animate-pulse" />
                              ))}
                            </div>
                          ) : topMeds.length === 0 ? (
                            <p className="text-xs text-muted-foreground">{s.dataBasedMedsNone}</p>
                          ) : (
                            <>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {topMeds.map((med, k) => (
                                  <div key={k} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300">
                                    <span className="font-medium">{k + 1}.</span>
                                    <span>{med.label}</span>
                                    <span className="text-teal-500 dark:text-teal-400 font-semibold ml-0.5">
                                      ×{med.count >= 1000 ? `${(med.count / 1000).toFixed(1)}K` : med.count}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Database className="w-3 h-3 shrink-0" />
                                <span>{s.dataBasedMedsNote} · {s.dataBasedMedsSource}</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Natural remedies section */}
                      {pred.naturalRemedies && pred.naturalRemedies.length > 0 && (
                        <div className="mb-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-950/20 p-3">
                          <p className="text-xs font-semibold text-green-800 dark:text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Leaf className="w-3.5 h-3.5" />
                            {s.naturalRemediesTitle}
                          </p>
                          <div className="space-y-2 mb-2">
                            {pred.naturalRemedies.map((rem: { name: string; benefit: string; warning: string }, k: number) => (
                              <div key={k} className="rounded-md bg-white/70 dark:bg-black/20 border border-green-100 dark:border-green-900 px-3 py-2">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">{rem.name}</span>
                                </div>
                                <p className="text-xs text-foreground/70 leading-relaxed">{rem.benefit}</p>
                                {rem.warning && (
                                  <div className="flex items-start gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                                      <span className="font-semibold">{s.naturalRemediesWarning}:</span> {rem.warning}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-green-700 dark:text-green-500 italic leading-relaxed">
                            ⚕️ {s.naturalRemediesDisclaimer}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-border/40 gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {URGENCY_ICON[pred.urgency] ?? <Clock className="w-3.5 h-3.5" />}
                          <span>{URGENCY_LABEL[pred.urgency] ?? pred.urgency}</span>
                        </div>
                        {showBtn && (
                          <button onClick={() => openDoctorModal(pred.cancerType)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-current text-rose-700 dark:text-rose-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors">
                            <UserRound className="w-3.5 h-3.5" />
                            {s.consultDoctor}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isSerious(result) && (
                  <div className="rounded-xl border-2 border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-rose-700 dark:text-rose-300 text-sm">{expertRec}</p>
                      <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">{expertRecBody}</p>
                    </div>
                    <button onClick={() => openDoctorModal(result.predictions?.[0]?.cancerType ?? "kanser")}
                      className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors">
                      <UserRound className="w-4 h-4" />
                      {s.consultDoctor}
                    </button>
                  </div>
                )}

                <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed">
                  {legalWarning}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div ref={modalRef} className="bg-background w-full max-w-2xl rounded-2xl border shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background z-10">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">{specialistSearch}</p>
                <h2 className="font-bold text-base capitalize">{doctorTarget} {specialistFor} {doctorSearchTitle}</h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {!doctorResult && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {locationLabel}
                    </label>
                    <input ref={locationRef} type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                      placeholder={locationPlaceholder}
                      className="w-full text-sm rounded-xl border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-muted-foreground/50" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5" /> {s.budget}
                    </label>
                    <div className="space-y-2">
                      {BUDGET_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => setBudget(opt.value)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                            budget === opt.value ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30" : "border-border hover:border-rose-300 bg-background"
                          }`}>
                          <p className="text-sm font-semibold">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleDoctorSearch} disabled={!location.trim() || !budget || doctorLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-rose-600 hover:bg-rose-700 text-white">
                    {doctorLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> {searchingLabel}</>
                      : <><UserRound className="w-4 h-4" /> {searchLabel}</>}
                  </button>

                  {doctorError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-400 flex gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> {doctorError}
                    </div>
                  )}
                </div>
              )}

              {doctorResult && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3 flex gap-2.5 text-xs">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-blue-800 dark:text-blue-300">{s.appointmentAdvice}</p>
                  </div>

                  {doctorResult.centers?.map((center, i) => (
                    <div key={i} className="rounded-xl border bg-card p-4">
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
                                <BadgeCheck className="w-3 h-3" /> {s.sgk}
                              </span>
                            )}
                          </div>
                          <p className={`font-semibold text-sm ${center.doctorName ? "text-muted-foreground" : ""}`}>{center.hospital}</p>
                          {!center.doctorName && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">{center.department}</p>}
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
                        <a href={center.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                          <ChevronRight className="w-3 h-3" />
                          {s.sourceLink}
                        </a>
                      )}
                    </div>
                  ))}

                  {doctorResult.generalTip && (
                    <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold">{s.generalTip}:</span> {doctorResult.generalTip}
                    </div>
                  )}

                  {doctorResult.importantNote && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      <span className="font-semibold">{s.importantNote}:</span> {doctorResult.importantNote}
                    </div>
                  )}

                  <button onClick={() => { setDoctorResult(null); setDoctorError(null); }}
                    className="w-full py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition-colors">
                    {searchAgain}
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
