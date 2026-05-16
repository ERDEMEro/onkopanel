import { useState, useEffect } from "react";
import { Star, ChevronRight, ChevronLeft, RotateCcw, TrendingUp, CheckCircle2 } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

// EORTC QLQ-C30 simplified (30 items → 15 key questions for brevity while covering all scales)
const QUESTIONS = [
  // Functional scales
  { id: "pf1", text: "Ağır fiziksel aktivitelerde (yük taşımak, uzun yürüyüş gibi) güçlük yaşıyor musunuz?", scale: "Fiziksel", reverse: false },
  { id: "pf2", text: "Uzun bir yürüyüşte zorlanıyor musunuz?", scale: "Fiziksel", reverse: false },
  { id: "pf3", text: "Ev dışında alışveriş, iş gibi günlük aktivitelerinizi yapabiliyor musunuz?", scale: "Fiziksel", reverse: true },
  { id: "rf1", text: "İş veya günlük aktivitelerinizi yaparken kendinizi kısıtlı hissediyor musunuz?", scale: "Rol", reverse: false },
  { id: "ef1", text: "Kendinizi gergin veya endişeli hissediyor musunuz?", scale: "Duygusal", reverse: false },
  { id: "ef2", text: "Kendinizi depresif veya üzgün hissediyor musunuz?", scale: "Duygusal", reverse: false },
  { id: "cf1", text: "Düşüncelerinizi toplamakta güçlük çekiyor musunuz?", scale: "Bilişsel", reverse: false },
  { id: "sf1", text: "Sağlık durumunuz aile hayatınızı veya sosyal aktivitelerinizi etkiliyor mu?", scale: "Sosyal", reverse: false },
  // Symptom scales
  { id: "fa1", text: "Kendinizi yorgun hissediyor musunuz?", scale: "Yorgunluk", reverse: false },
  { id: "nv1", text: "Bulantı yaşıyor musunuz?", scale: "Bulantı", reverse: false },
  { id: "pa1", text: "Ağrı yaşıyor musunuz?", scale: "Ağrı", reverse: false },
  { id: "dy1", text: "Nefes almakta güçlük yaşıyor musunuz?", scale: "Nefes Darlığı", reverse: false },
  { id: "sl1", text: "Uyku güçlüğü yaşıyor musunuz?", scale: "Uyku", reverse: false },
  { id: "ap1", text: "İştahınız azaldı mı?", scale: "İştah", reverse: false },
  // Global QoL
  { id: "ql1", text: "Genel sağlık durumunuzu nasıl değerlendirirsiniz?", scale: "Genel Sağlık", reverse: true, global: true },
  { id: "ql2", text: "Genel yaşam kalitenizi nasıl değerlendirirsiniz?", scale: "Genel QoL", reverse: true, global: true },
];

const SCALE_LABELS: Record<string, { type: "functional" | "symptom" | "global" }> = {
  "Fiziksel": { type: "functional" },
  "Rol": { type: "functional" },
  "Duygusal": { type: "functional" },
  "Bilişsel": { type: "functional" },
  "Sosyal": { type: "functional" },
  "Yorgunluk": { type: "symptom" },
  "Bulantı": { type: "symptom" },
  "Ağrı": { type: "symptom" },
  "Nefes Darlığı": { type: "symptom" },
  "Uyku": { type: "symptom" },
  "İştah": { type: "symptom" },
  "Genel Sağlık": { type: "global" },
  "Genel QoL": { type: "global" },
};

type Answers = Record<string, number>;

interface Assessment {
  date: string;
  answers: Answers;
  scores: Record<string, number>;
  globalScore: number;
}

const STORAGE_KEY = "onko_qol_assessments";

function loadAssessments(): Assessment[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveAssessments(d: Assessment[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function calcScores(answers: Answers): { scales: Record<string, number>; global: number } {
  const scaleGroups: Record<string, number[]> = {};
  let globalSum = 0; let globalCount = 0;

  for (const q of QUESTIONS) {
    const raw = answers[q.id] ?? 1;
    // Convert 1-7 to 0-100 (EORTC standard)
    const val = ((raw - 1) / 6) * 100;
    const scaled = q.reverse ? 100 - val : val;

    if ((q as any).global) {
      globalSum += (q.reverse ? val : val); // keep as 0-100
      globalCount++;
    } else {
      if (!scaleGroups[q.scale]) scaleGroups[q.scale] = [];
      scaleGroups[q.scale].push(scaled);
    }
  }

  const scales: Record<string, number> = {};
  for (const [k, vals] of Object.entries(scaleGroups)) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    // For functional: higher = better. For symptoms: higher = worse — we show as 100-score for chart
    const info = SCALE_LABELS[k];
    scales[k] = info?.type === "symptom" ? Math.round(100 - avg) : Math.round(avg);
  }

  return { scales, global: globalCount > 0 ? Math.round(globalSum / globalCount) : 0 };
}

function ScoreBar({ label, value, type }: { label: string; value: number; type: string }) {
  const color = type === "symptom"
    ? value >= 70 ? "bg-green-400" : value >= 40 ? "bg-yellow-400" : "bg-red-400"
    : value >= 70 ? "bg-green-400" : value >= 40 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="text-xs font-bold text-slate-700">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function YasamKalitesi() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [phase, setPhase] = useState<"intro" | "quiz" | "result" | "history">("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [lastResult, setLastResult] = useState<Assessment | null>(null);

  useEffect(() => { setAssessments(loadAssessments()); }, []);

  function startQuiz() {
    setAnswers({});
    setStep(0);
    setPhase("quiz");
  }

  function answer(val: number) {
    const q = QUESTIONS[step];
    const next = { ...answers, [q.id]: val };
    setAnswers(next);

    if (step + 1 >= QUESTIONS.length) {
      finishQuiz(next);
    } else {
      setStep(step + 1);
    }
  }

  function finishQuiz(finalAnswers: Answers) {
    const { scales, global } = calcScores(finalAnswers);
    const assessment: Assessment = {
      date: new Date().toISOString(),
      answers: finalAnswers,
      scores: scales,
      globalScore: global,
    };
    const updated = [...assessments, assessment];
    setAssessments(updated);
    saveAssessments(updated);
    setLastResult(assessment);
    setPhase("result");
  }

  const q = QUESTIONS[step];
  const progress = ((step) / QUESTIONS.length) * 100;

  // Chart history data
  const historyData = assessments.slice(-8).map((a) => ({
    date: new Date(a.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
    "Genel QoL": a.globalScore,
  }));

  const radarData = lastResult
    ? Object.entries(lastResult.scores)
        .filter(([k]) => SCALE_LABELS[k]?.type === "functional")
        .map(([k, v]) => ({ subject: k, value: v }))
    : [];

  return (
    <div className="min-h-[calc(100vh-52px)] bg-gradient-to-br from-indigo-50/30 via-white to-violet-50/20 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Intro */}
        {phase === "intro" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-800">Yaşam Kalitesi Ölçeği</h1>
                <p className="text-xs text-slate-400">EORTC QLQ-C30 tabanlı değerlendirme</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 mb-4">
              <p className="text-sm text-slate-700 leading-relaxed mb-4">
                Bu anket, kanser hastalarının yaşam kalitesini ölçmek için Avrupa Onkoloji Araştırma ve Tedavi Örgütü (EORTC) tarafından geliştirilmiş standart bir araçtır.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 mb-5">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> {QUESTIONS.length} soru · yaklaşık 3-5 dakika</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Fiziksel, duygusal ve sosyal işlevselliğinizi ölçer</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Sonuçlar yalnızca bu cihazda saklanır</li>
              </ul>
              <button
                onClick={startQuiz}
                className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors shadow-md shadow-indigo-100"
              >
                Değerlendirmeye Başla
              </button>
            </div>

            {assessments.length > 0 && (
              <button
                onClick={() => setPhase("history")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-indigo-100 bg-white text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors"
              >
                <TrendingUp className="w-4 h-4" /> Geçmiş Sonuçlarım ({assessments.length} değerlendirme)
              </button>
            )}
          </>
        )}

        {/* Quiz */}
        {phase === "quiz" && (
          <div>
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Soru {step + 1} / {QUESTIONS.length}</span>
                <span>{q.scale}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-indigo-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6">
              <p className="text-base text-slate-800 font-medium leading-relaxed mb-6">{q.text}</p>

              <p className="text-xs text-slate-400 mb-3">
                {(q as any).global
                  ? "1 = Çok Kötü · 7 = Mükemmel"
                  : "1 = Hiç · 4 = Çok Fazla"}
              </p>

              <div className="grid grid-cols-4 gap-2">
                {((q as any).global ? [1,2,3,4,5,6,7] : [1,2,3,4]).map((v) => (
                  <button
                    key={v}
                    onClick={() => answer(v)}
                    className="py-3 rounded-xl border-2 border-slate-100 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 font-semibold text-sm transition-all active:scale-95"
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                <span>{(q as any).global ? "Çok kötü" : "Hiç yok"}</span>
                <span>{(q as any).global ? "Mükemmel" : "Çok fazla"}</span>
              </div>

              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="mt-4 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Önceki soru
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {phase === "result" && lastResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center shadow-md">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Değerlendirme Sonucu</h2>
                  <p className="text-xs text-slate-400">{new Date(lastResult.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${lastResult.globalScore >= 60 ? "text-green-500" : lastResult.globalScore >= 40 ? "text-yellow-500" : "text-red-500"}`}>
                  {lastResult.globalScore}
                </div>
                <div className="text-[11px] text-slate-400">Genel QoL</div>
              </div>
            </div>

            {/* Functional radar */}
            {radarData.length > 0 && (
              <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-2">İşlevsellik (yüksek = iyi)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip formatter={(v: number) => [`${v}`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Symptom scores */}
            <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-600 mb-3">Belirti Yükü (yüksek = az belirti)</p>
              <div className="space-y-3">
                {Object.entries(lastResult.scores)
                  .filter(([k]) => SCALE_LABELS[k]?.type === "symptom")
                  .map(([k, v]) => (
                    <ScoreBar key={k} label={k} value={v} type="symptom" />
                  ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startQuiz}
                className="flex-1 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Tekrar Doldur
              </button>
              <button
                onClick={() => setPhase("history")}
                className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Geçmişim
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {phase === "history" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setPhase("intro")} className="text-slate-400 hover:text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-semibold text-slate-800">Geçmiş Değerlendirmeler</h2>
            </div>

            {historyData.length >= 2 && (
              <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-3">Genel QoL Trendi</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={historyData} margin={{ left: -20, right: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="Genel QoL" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-2">
              {[...assessments].reverse().map((a, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200"
                  onClick={() => { setLastResult(a); setPhase("result"); }}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(a.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(a.date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-lg font-bold ${a.globalScore >= 60 ? "text-green-500" : a.globalScore >= 40 ? "text-yellow-500" : "text-red-500"}`}>
                      {a.globalScore}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={startQuiz}
              className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
            >
              Yeni Değerlendirme
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
