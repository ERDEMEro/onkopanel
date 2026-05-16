import { useState, useEffect, useRef } from "react";
import { Activity, Plus, Trash2, TrendingUp, Info, Sparkles, Send, Loader2, Bot, ClipboardList, ChevronRight, RotateCcw, Dumbbell, BedDouble } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ExerciseLog {
  id: string;
  date: string;
  type: string;
  duration: number;
  intensity: "hafif" | "orta" | "yorucu";
  notes: string;
}

interface ChatMsg { role: "user" | "assistant"; content: string; }

interface ExerciseDay {
  dayName: string;
  rest?: boolean;
  exercises: { name: string; duration: string; note?: string }[];
  tip?: string;
}
interface ExercisePlan {
  planTitle: string;
  level: string;
  days: ExerciseDay[];
  generalTips: string[];
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const STORAGE_KEY = "onko_exercise_logs";
const CHAT_KEY = "onko_chat_egzersiz";
const PLAN_KEY = "onko_exercise_plan";

const EXERCISE_TYPES = [
  "Yürüyüş", "Hafif Germe / Esneme", "Yoga / Meditasyon", "Bisiklet", "Yüzme",
  "Nefes Egzersizi", "Denge Egzersizi", "Kol Hareketi", "Bacak Hareketi", "Diğer",
];
const INTENSITY_COLORS: Record<string, string> = { hafif: "#34d399", orta: "#60a5fa", yorucu: "#f87171" };

const CANCER_TYPES = [
  "Belirtmek istemiyorum", "Meme Kanseri", "Akciğer Kanseri", "Kolon Kanseri",
  "Prostat Kanseri", "Mide Kanseri", "Lösemi", "Lenfoma", "Over Kanseri",
  "Pankreas Kanseri", "Beyin Tümörü", "Böbrek Kanseri", "Diğer",
];
const TREATMENT_PHASES = [
  "Belirtmek istemiyorum", "Kemoterapi sürecinde", "Radyoterapi sürecinde",
  "Cerrahi sonrası iyileşme", "Remisyon", "Bakımsal tedavi",
];
const FITNESS_LEVELS = [
  { value: "cok_dusuk", label: "Çok düşük — Çoğu zaman yatağa bağlıyım" },
  { value: "dusuk", label: "Düşük — Kısa yürüyüş yapabiliyorum" },
  { value: "orta", label: "Orta — Günlük aktivitelerimi yapabiliyorum" },
  { value: "iyi", label: "İyi — Düzenli hafif spor yapabiliyorum" },
];
const RESTRICTIONS = ["Diz ağrısı", "Sırt ağrısı", "Lenfödem", "Denge sorunu", "Nefes darlığı", "Ağrılı eklemler"];

const TIPS = [
  { icon: "🚶", title: "Günde 30 dakika yürüyüş", text: "Hafif tempolu yürüyüş, yorgunluğu azaltır ve ruh halini iyileştirir." },
  { icon: "🧘", title: "Nefes egzersizleri", text: "Derin nefes alıp verme, stres hormonlarını düşürür ve uyku kalitesini artırır." },
  { icon: "💪", title: "Direnç egzersizleri", text: "Hafif ağırlıklarla kas egzersizleri, kas kaybını önler ve enerji düzeyini artırır." },
  { icon: "🏊", title: "Su egzersizleri", text: "Eklem ağrısı veya lenfödemi olanlar için yüzme idealdir; eklemlere baskı yapmaz." },
  { icon: "⚠️", title: "Dikkat edilmesi gerekenler", text: "Ateşiniz varsa veya çok halsizseniz o gün dinlenmeyi tercih edin." },
];
const STARTER_QUESTIONS = [
  "Kemoterapi sırasında hangi egzersizler güvenli?",
  "Yorgunlukla mücadelede egzersiz nasıl yardımcı olur?",
  "Haftada kaç gün egzersiz yapmalıyım?",
  "Egzersiz sonrası kas ağrısı normal mi?",
];

function loadLogs(): ExerciseLog[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; } }
function saveLogs(d: ExerciseLog[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function loadChat(): ChatMsg[] { try { return JSON.parse(localStorage.getItem(CHAT_KEY) ?? "[]"); } catch { return []; } }
function saveChat(d: ChatMsg[]) { localStorage.setItem(CHAT_KEY, JSON.stringify(d)); }
function loadPlan(): ExercisePlan | null { try { const s = localStorage.getItem(PLAN_KEY); return s ? JSON.parse(s) as ExercisePlan : null; } catch { return null; } }
function savePlan(p: ExercisePlan) { localStorage.setItem(PLAN_KEY, JSON.stringify(p)); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }

const DAY_LABELS = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];

export default function EgzersizTakip() {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [view, setView] = useState<"log"|"chart"|"tips"|"plan"|"ai">("log");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: EXERCISE_TYPES[0], duration: 20, intensity: "hafif" as ExerciseLog["intensity"], notes: "" });

  // Plan state
  const [plan, setPlan] = useState<ExercisePlan|null>(null);
  const [wizardStep, setWizardStep] = useState<"form"|"loading"|"result">("form");
  const [cancerType, setCancerType] = useState(CANCER_TYPES[0]);
  const [treatmentPhase, setTreatmentPhase] = useState(TREATMENT_PHASES[0]);
  const [fitnessLevel, setFitnessLevel] = useState(FITNESS_LEVELS[1].value);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [planError, setPlanError] = useState("");

  // Chat state
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLogs(loadLogs()); setChatMsgs(loadChat()); setPlan(loadPlan()); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);
  useEffect(() => { if (plan) setWizardStep("result"); }, [plan]);

  function addLog() {
    const entry: ExerciseLog = { id: uid(), date: todayStr(), ...form };
    const updated = [...logs, entry].sort((a,b) => a.date.localeCompare(b.date));
    setLogs(updated); saveLogs(updated); setShowForm(false);
    setForm({ type: EXERCISE_TYPES[0], duration: 20, intensity: "hafif", notes: "" });
  }
  function deleteLog(id: string) { const u = logs.filter(l => l.id !== id); setLogs(u); saveLogs(u); }
  function toggleRestriction(r: string) {
    setSelectedRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  async function generatePlan() {
    setWizardStep("loading"); setPlanError("");
    try {
      const res = await fetch(`${BASE}/api/exercise-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancerType, treatmentPhase, fitnessLevel, restrictions: selectedRestrictions }),
      });
      const data = (await res.json()) as ExercisePlan & { error?: string };
      if (data.error) { setPlanError(data.error); setWizardStep("form"); return; }
      savePlan(data); setPlan(data); setWizardStep("result");
    } catch {
      setPlanError("Bağlantı hatası. Lütfen tekrar deneyin."); setWizardStep("form");
    }
  }

  async function sendChat(text: string) {
    if (!text.trim() || chatLoading) return;
    const userMsg: ChatMsg = { role: "user", content: text.trim() };
    const updated = [...chatMsgs, userMsg];
    setChatMsgs(updated); saveChat(updated); setChatInput(""); setChatLoading(true);
    try {
      const res = await fetch(`${BASE}/api/ai-advisor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "exercise", messages: updated }) });
      const data = (await res.json()) as { reply?: string; error?: string };
      const reply: ChatMsg = { role: "assistant", content: data.reply ?? data.error ?? "Yanıt alınamadı." };
      const final = [...updated, reply]; setChatMsgs(final); saveChat(final);
    } catch {
      const err: ChatMsg = { role: "assistant", content: "Bağlantı hatası." };
      const final = [...updated, err]; setChatMsgs(final); saveChat(final);
    } finally { setChatLoading(false); }
  }

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i);
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    return { date: d.toLocaleDateString("tr-TR",{day:"numeric",month:"short"}), dakika: logs.filter(l=>l.date===ds).reduce((s,l)=>s+l.duration,0) };
  });
  const totalMin = logs.reduce((s,l)=>s+l.duration,0);
  const sessions = logs.length;
  const todayMin = logs.filter(l=>l.date===todayStr()).reduce((s,l)=>s+l.duration,0);
  const todayDowIndex = (new Date().getDay() + 6) % 7; // 0=Mon

  return (
    <div className="min-h-[calc(100vh-52px)] bg-gradient-to-br from-teal-50/30 via-white to-emerald-50/20 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-200">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800">Egzersiz & Hareket Takibi</h1>
            <p className="text-xs text-slate-400">Kanser sürecinde aktif kalmak iyileşmeyi destekler</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Bugün", value: `${todayMin} dk`, sub: "aktif" },
            { label: "Toplam", value: `${totalMin} dk`, sub: `${sessions} seans` },
            { label: "Haftalık Ort.", value: `${Math.round(totalMin/Math.max(1,Math.ceil(sessions/7)))} dk`, sub: "seans başı" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-teal-100 p-3 text-center shadow-sm">
              <div className="text-lg font-bold text-teal-600">{s.value}</div>
              <div className="text-[11px] text-slate-500">{s.label}</div>
              <div className="text-[10px] text-slate-400">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5 overflow-x-auto">
          {([
            { v: "log", label: "Günlük", icon: <Activity className="w-3.5 h-3.5" /> },
            { v: "chart", label: "Grafik", icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { v: "plan", label: "Egzersiz Planı", icon: <ClipboardList className="w-3.5 h-3.5" /> },
            { v: "tips", label: "Bilgi", icon: <Info className="w-3.5 h-3.5" /> },
            { v: "ai", label: "EgzersizBot", icon: <Sparkles className="w-3.5 h-3.5 text-teal-500" /> },
          ] as const).map(t => (
            <button key={t.v} onClick={() => setView(t.v)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium rounded-lg transition-all ${view===t.v ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Log view */}
        {view === "log" && (
          <div className="space-y-3">
            {showForm && (
              <div className="bg-white rounded-xl border border-teal-200 p-4 shadow-sm space-y-3">
                <p className="text-sm font-semibold text-slate-700">Egzersiz Ekle</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Tür</label>
                    <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200">
                      {EXERCISE_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Süre (dk)</label>
                    <input type="number" min={1} max={180} value={form.duration}
                      onChange={e=>setForm(f=>({...f,duration:Math.max(1,Number(e.target.value))}))}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Yoğunluk</label>
                  <div className="flex gap-2">
                    {(["hafif","orta","yorucu"] as const).map(v=>(
                      <button key={v} onClick={()=>setForm(f=>({...f,intensity:v}))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.intensity===v ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-teal-200"}`}>
                        {v.charAt(0).toUpperCase()+v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea rows={2} placeholder="Notlar (isteğe bağlı)" value={form.notes}
                  onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-200" />
                <div className="flex gap-2">
                  <button onClick={addLog} className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors">Kaydet</button>
                  <button onClick={()=>setShowForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">İptal</button>
                </div>
              </div>
            )}
            {logs.length===0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz egzersiz kaydı yok</p>
              </div>
            )}
            {[...logs].reverse().slice(0,20).map(l=>(
              <div key={l.id} className="bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm flex items-center gap-3">
                <div className="w-2 h-12 rounded-full" style={{backgroundColor:INTENSITY_COLORS[l.intensity]}} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{l.type}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{background:`${INTENSITY_COLORS[l.intensity]}20`,color:INTENSITY_COLORS[l.intensity]}}>{l.intensity}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(l.date+"T12:00:00").toLocaleDateString("tr-TR",{day:"numeric",month:"short"})} · {l.duration} dakika
                  </p>
                  {l.notes && <p className="text-xs text-slate-400 truncate mt-0.5">{l.notes}</p>}
                </div>
                <button onClick={()=>deleteLog(l.id)} className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {!showForm && (
              <button onClick={()=>setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-teal-200 text-teal-500 hover:border-teal-300 hover:bg-teal-50/50 text-sm font-medium transition-all">
                <Plus className="w-4 h-4" /> Egzersiz Ekle
              </button>
            )}
          </div>
        )}

        {/* Chart view */}
        {view === "chart" && (
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-4">Son 14 Gün — Günlük Aktif Süre (dakika)</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={last14} margin={{left:-20,right:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize:10,fill:"#94a3b8"}} />
                <YAxis tick={{fontSize:10,fill:"#94a3b8"}} />
                <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={(v:number)=>[`${v} dk`,"Süre"]} />
                <Bar dataKey="dakika" fill="#2dd4bf" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-slate-400 text-center mt-2">WHO, haftada 150 dk orta yoğunluklu egzersiz önerir</p>
          </div>
        )}

        {/* Tips view */}
        {view === "tips" && (
          <div className="space-y-3">
            {TIPS.map((tip,i)=>(
              <div key={i} className="bg-white rounded-xl border border-teal-100 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tip.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">{tip.title}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{tip.text}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs text-amber-700 font-medium mb-1">Önemli Hatırlatma</p>
              <p className="text-xs text-amber-600">Egzersiz programına başlamadan önce mutlaka onkoloji ekibinizle görüşün.</p>
            </div>
          </div>
        )}

        {/* Plan view */}
        {view === "plan" && (
          <div>
            {wizardStep === "form" && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardList className="w-5 h-5" />
                    <p className="font-semibold text-sm">Kişisel Egzersiz Planı Oluştur</p>
                  </div>
                  <p className="text-xs text-teal-100">Durumunuza özel yapay zeka destekli haftalık program</p>
                </div>

                {planError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{planError}</p>}

                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-2">Kanser Türü</label>
                    <select value={cancerType} onChange={e=>setCancerType(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200">
                      {CANCER_TYPES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-2">Tedavi Aşaması</label>
                    <select value={treatmentPhase} onChange={e=>setTreatmentPhase(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200">
                      {TREATMENT_PHASES.map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-2">Fiziksel Kapasiteniz</label>
                    <div className="space-y-2">
                      {FITNESS_LEVELS.map(fl=>(
                        <button key={fl.value} onClick={()=>setFitnessLevel(fl.value)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${fitnessLevel===fl.value ? "border-teal-400 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600 hover:border-teal-200"}`}>
                          {fl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-2">Kısıtlamalar (varsa seçin)</label>
                    <div className="flex flex-wrap gap-2">
                      {RESTRICTIONS.map(r=>(
                        <button key={r} onClick={()=>toggleRestriction(r)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${selectedRestrictions.includes(r) ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500 hover:border-teal-200"}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={generatePlan}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-sm font-semibold transition-all shadow-md shadow-teal-100 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Planımı Oluştur
                </button>
              </div>
            )}

            {wizardStep === "loading" && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                </div>
                <p className="text-sm text-slate-600 font-medium">Kişisel egzersiz planınız hazırlanıyor…</p>
                <p className="text-xs text-slate-400 text-center">Durumunuza özel program oluşturuyoruz</p>
              </div>
            )}

            {wizardStep === "result" && plan && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-4 text-white flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{plan.planTitle}</p>
                    <p className="text-xs text-teal-100 mt-0.5">Seviye: {plan.level}</p>
                  </div>
                  <button onClick={()=>{ setPlan(null); localStorage.removeItem(PLAN_KEY); setWizardStep("form"); }}
                    className="flex items-center gap-1 text-xs text-teal-100 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg transition-all">
                    <RotateCcw className="w-3.5 h-3.5" /> Yenile
                  </button>
                </div>

                <div className="space-y-3">
                  {plan.days.map((day, idx) => {
                    const isToday = idx === todayDowIndex;
                    return (
                      <div key={day.dayName} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isToday ? "border-teal-300 ring-1 ring-teal-200" : "border-slate-100"}`}>
                        <div className={`flex items-center gap-2 px-4 py-2.5 ${isToday ? "bg-teal-50" : "bg-slate-50"}`}>
                          {day.rest
                            ? <BedDouble className={`w-4 h-4 ${isToday ? "text-teal-500" : "text-slate-400"}`} />
                            : <Dumbbell className={`w-4 h-4 ${isToday ? "text-teal-500" : "text-slate-400"}`} />
                          }
                          <span className={`text-sm font-semibold ${isToday ? "text-teal-700" : "text-slate-700"}`}>{day.dayName}</span>
                          {isToday && <span className="text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded-full font-medium">Bugün</span>}
                          {day.rest && <span className="text-[10px] text-slate-400 ml-auto">Dinlenme Günü</span>}
                        </div>
                        {!day.rest && day.exercises.length > 0 && (
                          <div className="px-4 py-3 space-y-2">
                            {day.exercises.map((ex, ei) => (
                              <div key={ei} className="flex items-start gap-2">
                                <ChevronRight className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-sm text-slate-800 font-medium">{ex.name}</span>
                                  <span className="text-xs text-slate-500 ml-2">{ex.duration}</span>
                                  {ex.note && <p className="text-xs text-slate-400 mt-0.5">{ex.note}</p>}
                                </div>
                              </div>
                            ))}
                            {day.tip && (
                              <p className="text-xs text-teal-600 bg-teal-50 rounded-lg px-3 py-2 mt-2 border border-teal-100">💡 {day.tip}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {plan.generalTips && plan.generalTips.length > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-700 mb-2">Genel Öneriler</p>
                    <ul className="space-y-1">
                      {plan.generalTips.map((tip, i) => (
                        <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5"><span className="mt-0.5">•</span>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-xs text-slate-500 text-center">Programa başlamadan önce onkoloji ekibinizin onayını alın</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Chat view */}
        {view === "ai" && (
          <div className="flex flex-col gap-3">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-4 flex items-center gap-3 text-white shadow-md shadow-teal-100">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Bot className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-semibold">EgzersizBot</p>
                <p className="text-xs text-teal-100">Kanser sürecinde güvenli hareket rehberi</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col" style={{minHeight:340}}>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{maxHeight:400}}>
                {chatMsgs.length === 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 text-center">Egzersiz konusunda merak ettiklerinizi sorun</p>
                    <div className="grid grid-cols-1 gap-2">
                      {STARTER_QUESTIONS.map(q=>(
                        <button key={q} onClick={()=>sendChat(q)}
                          className="text-left text-xs bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-lg px-3 py-2.5 text-teal-700 transition-colors">{q}</button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMsgs.map((m,i)=>(
                  <div key={i} className={`flex gap-2 ${m.role==="user"?"justify-end":"justify-start"}`}>
                    {m.role==="assistant" && <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5"><Bot className="w-3.5 h-3.5 text-teal-600" /></div>}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${m.role==="user" ? "bg-teal-500 text-white rounded-br-sm" : "bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-sm"}`}>{m.content}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-teal-600" /></div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl rounded-bl-sm px-3 py-2"><Loader2 className="w-4 h-4 text-teal-400 animate-spin" /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-slate-100 p-3 flex gap-2">
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void sendChat(chatInput);}}}
                  placeholder="Egzersiz konusunda bir şey sorun…"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                  disabled={chatLoading} />
                <button onClick={()=>void sendChat(chatInput)} disabled={!chatInput.trim()||chatLoading}
                  className="w-9 h-9 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-40 flex items-center justify-center text-white transition-colors shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            {chatMsgs.length > 0 && (
              <button onClick={()=>{setChatMsgs([]);saveChat([]);}} className="text-xs text-slate-400 hover:text-slate-600 text-center transition-colors">Sohbeti temizle</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
