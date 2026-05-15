import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, FlaskConical, ChevronRight, Info, Stethoscope, ShieldAlert } from "lucide-react";

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

const LIKELIHOOD_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Yüksek: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-900" },
  Orta: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900" },
  Düşük: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-900" },
};

const URGENCY_ICON: Record<string, React.ReactNode> = {
  acil: <AlertTriangle className="w-4 h-4 text-red-600" />,
  "bir hafta içinde": <Clock className="w-4 h-4 text-amber-600" />,
  "bir ay içinde": <CheckCircle2 className="w-4 h-4 text-blue-500" />,
};

const URGENCY_LABEL: Record<string, string> = {
  acil: "Acil — hemen başvurun",
  "bir hafta içinde": "Bir hafta içinde başvurun",
  "bir ay içinde": "Bir ay içinde başvurun",
};

export default function SymptomChecker() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleSymptom(s: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
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

    try {
      const res = await fetch(`${BASE}/api/symptom-check`, {
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
            Belirtilerinizi seçin veya yazın; yapay zeka onkoloji verilerimize dayanarak olası kanser türlerini ve önerilen adımları değerlendirsin.
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
                          <button
                            key={s}
                            onClick={() => toggleSymptom(s)}
                            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                              active
                                ? "bg-rose-600 text-white border-rose-600"
                                : "bg-background text-muted-foreground border-border hover:border-rose-400 hover:text-rose-600"
                            }`}
                          >
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
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
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

            <button
              onClick={handleSubmit}
              disabled={!hasInput || loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Yapay zeka analiz ediyor…
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4" />
                  Belirtileri Değerlendir
                  <ChevronRight className="w-4 h-4" />
                </>
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
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {error}
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
                    <p className="font-semibold text-sm">
                      {URGENCY_LABEL[result.urgencyLevel] ?? "Doktora başvurun"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{result.generalAdvice}</p>
                  </div>
                </div>

                {/* Predictions */}
                {result.predictions?.map((pred, i) => {
                  const style = LIKELIHOOD_STYLE[pred.likelihood] ?? LIKELIHOOD_STYLE["Düşük"];
                  return (
                    <div key={i} className={`rounded-xl border p-5 ${style.bg} ${style.border}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-xs text-muted-foreground font-medium">#{i + 1} Olası Tanı</span>
                          <h3 className={`font-bold text-lg ${style.text}`}>{pred.cancerType}</h3>
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
                        <div>
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

                      <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {URGENCY_ICON[pred.urgency] ?? <Clock className="w-3.5 h-3.5" />}
                        <span>{URGENCY_LABEL[pred.urgency] ?? pred.urgency}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Disclaimer */}
                <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold">Yasal Uyarı:</span> Bu sonuçlar yalnızca genel bilgilendirme amaçlıdır.
                  Yapay zeka değerlendirmesi kesin tıbbi tanı niteliği taşımaz.
                  Semptomlarınız için mutlaka bir hekim tarafından muayene olunuz ve gerekli testleri yaptırınız.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
