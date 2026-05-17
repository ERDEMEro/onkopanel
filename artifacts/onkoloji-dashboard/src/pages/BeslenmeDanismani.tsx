import { useState, useRef, useEffect } from "react";
import {
  Salad, Send, RefreshCw, ChevronDown, History, Clock, Trash2, X, Bot,
  Calendar, Sparkles, Loader2, Check, ChevronLeft, ChevronRight, Lightbulb,
  CheckCircle2, Circle,
} from "lucide-react";
import { PremiumGate } from "@/components/PremiumGate";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const CURRENT_KEY = "onko_chat_beslenme_current";
const HISTORY_KEY = "onko_chat_beslenme_history";
const SAVED_PLAN_KEY = "onko_beslenme_saved_plan";
const CHECKED_MEALS_KEY = "onko_beslenme_checked";

type CheckedMeals = Record<number, Record<string, boolean>>;

function loadSavedPlan(): MealPlan | null {
  try { const s = localStorage.getItem(SAVED_PLAN_KEY); if (s) return JSON.parse(s); } catch {}
  return null;
}
function savePlan(plan: MealPlan) {
  try { localStorage.setItem(SAVED_PLAN_KEY, JSON.stringify(plan)); } catch {}
}
function loadCheckedMeals(): CheckedMeals {
  try { const s = localStorage.getItem(CHECKED_MEALS_KEY); if (s) return JSON.parse(s); } catch {}
  return {};
}
function saveCheckedMeals(c: CheckedMeals) {
  try { localStorage.setItem(CHECKED_MEALS_KEY, JSON.stringify(c)); } catch {}
}

/* ─── Types ─── */
interface Message {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
  mealPlan?: MealPlan;
}

interface Session {
  id: string;
  date: string;
  preview: string;
  cancer: string;
  phase: string;
  messages: Message[];
}

interface MealDay {
  dayName: string;
  kahvalti: string;
  araOgun1?: string;
  ogle: string;
  araOgun2?: string;
  aksam: string;
  tip?: string;
}

interface MealPlan {
  planTitle: string;
  days: MealDay[];
  generalTips?: string[];
}

interface WizardData {
  days: number;
  mealsPerDay: number;
  restrictions: string[];
}

/* ─── Constants ─── */
const CANCER_TYPES = [
  "Belirtmek istemiyorum", "Meme Kanseri", "Akciğer Kanseri", "Kolon/Kolorektal Kanser",
  "Prostat Kanseri", "Mide Kanseri", "Karaciğer Kanseri", "Lösemi", "Lenfoma",
  "Over Kanseri", "Pankreas Kanseri", "Mesane Kanseri", "Tiroid Kanseri",
  "Cilt Kanseri (Melanom)", "Beyin Tümörü", "Böbrek Kanseri",
];
const TREATMENT_PHASES = [
  "Belirtmek istemiyorum", "Teşhis öncesi / tarama aşaması", "Kemoterapi sürecinde",
  "Radyoterapi sürecinde", "Cerrahi sonrası iyileşme", "Remisyon (hastalık kontrol altında)", "Bakımsal tedavi",
];
const SUGGESTIONS = [
  "Kemoterapi sırasında bulantıyı azaltacak yiyecekler neler?",
  "Hangi besinlerden kaçınmalıyım?",
  "Haftalık yemek listesi oluşturur musun?",
  "Protein ihtiyacımı nasıl karşılarım?",
  "Bağışıklık sistemini destekleyen gıdalar neler?",
  "Günlük beslenme planı önerir misin?",
];
const RESTRICTION_OPTIONS = [
  "Gluten-siz", "Vegan", "Vejetaryen", "Laktozsuz", "Tuzsuz", "Düşük Şeker", "Lifli Ağırlıklı",
];
const MEAL_PLAN_KEYWORDS = [
  "yemek listesi", "yemek planı", "beslenme planı", "haftalık plan", "günlük menü",
  "diyet planı", "menü listesi", "öğün planı", "beslenme takvimi", "yemek takvimi",
  "ne yemeliyim", "ne yiyebilirim", "haftalık yemek", "günlük yemek",
];

/* ─── Helpers ─── */
function isMealPlanRequest(text: string): boolean {
  const t = text.toLowerCase();
  return MEAL_PLAN_KEYWORDS.some(k => t.includes(k));
}

const makeWelcome = (cancer: string, phase: string): Message => ({
  role: "assistant",
  content: `Merhaba! Ben BeslenmeBot — kanser sürecinde beslenme konusunda size rehberlik etmek için buradayım.\n\n${cancer !== "Belirtmek istemiyorum" ? `Kanser türünüz: **${cancer}**\n` : ""}${phase !== "Belirtmek istemiyorum" ? `Tedavi aşamanız: **${phase}**\n\n` : "\n"}Beslenme hakkında ne merak ediyorsunuz? Haftalık yemek listesi için "haftalık yemek planı" yazabilirsiniz. 🗓️`,
});

interface CurrentState { messages: Message[]; cancer: string; phase: string; started: boolean; }
function loadCurrent(): CurrentState {
  try { const s = localStorage.getItem(CURRENT_KEY); if (s) return JSON.parse(s); } catch {}
  return { messages: [], cancer: CANCER_TYPES[0], phase: TREATMENT_PHASES[0], started: false };
}
function loadHistory(): Session[] {
  try { const s = localStorage.getItem(HISTORY_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
}

async function callNutritionAdvisor(messages: Message[], cancerType: string): Promise<string> {
  const res = await fetch(`${BASE}/api/nutrition-advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })), cancerType: cancerType !== "Belirtmek istemiyorum" ? cancerType : undefined }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as { error?: string }).error ?? "Hata"); }
  return ((await res.json()) as { reply: string }).reply;
}

async function callMealPlan(wizard: WizardData, cancerType: string, treatmentPhase: string): Promise<MealPlan> {
  const res = await fetch(`${BASE}/api/meal-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      days: wizard.days,
      mealsPerDay: wizard.mealsPerDay,
      restrictions: wizard.restrictions,
      cancerType: cancerType !== "Belirtmek istemiyorum" ? cancerType : undefined,
      treatmentPhase: treatmentPhase !== "Belirtmek istemiyorum" ? treatmentPhase : undefined,
    }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as { error?: string }).error ?? "Hata"); }
  return res.json() as Promise<MealPlan>;
}

/* ─── Typing Dots ─── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

/* ─── Meal Plan Wizard ─── */
function MealWizard({
  onClose, onGenerate, loading,
}: {
  onClose: () => void;
  onGenerate: (data: WizardData) => void;
  loading: boolean;
}) {
  const [days, setDays] = useState(7);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [restrictions, setRestrictions] = useState<string[]>([]);

  function toggleRestriction(r: string) {
    setRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-emerald-100 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-semibold text-white">Beslenme Takvimi Oluşturucu</h2>
              <p className="text-[11px] text-emerald-100">Kişiselleştirilmiş yemek planı</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Days */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">Kaç günlük plan?</label>
            <div className="flex gap-2">
              {[3, 5, 7].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${days === d ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200" : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50"}`}
                >
                  {d} Gün{d === 7 && <span className="ml-1 text-[10px] opacity-70">★</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Meals per day */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">Günde kaç öğün?</label>
            <div className="flex gap-2">
              {[
                { v: 3, label: "3 Ana Öğün" },
                { v: 5, label: "5 Öğün (Ara Öğünlü)" },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => setMealsPerDay(v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${mealsPerDay === v ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200" : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Restrictions */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">
              Besin kısıtları <span className="text-slate-400 normal-case font-normal">(opsiyonel)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {RESTRICTION_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => toggleRestriction(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${restrictions.includes(r) ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600"}`}
                >
                  {restrictions.includes(r) && <Check className="w-3 h-3 inline mr-1" />}
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={() => onGenerate({ days, mealsPerDay, restrictions })}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-200 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Plan hazırlanıyor...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {days} Günlük Beslenme Planımı Oluştur</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Meal Calendar ─── */
const MEAL_COLORS: Record<string, { bg: string; border: string; label: string; dot: string }> = {
  kahvalti:  { bg: "bg-amber-50",   border: "border-amber-200",  label: "Kahvaltı",    dot: "bg-amber-400" },
  araOgun1:  { bg: "bg-yellow-50",  border: "border-yellow-200", label: "Ara Öğün",    dot: "bg-yellow-400" },
  ogle:      { bg: "bg-emerald-50", border: "border-emerald-200",label: "Öğle",        dot: "bg-emerald-500" },
  araOgun2:  { bg: "bg-lime-50",    border: "border-lime-200",   label: "Ara Öğün",    dot: "bg-lime-500" },
  aksam:     { bg: "bg-indigo-50",  border: "border-indigo-200", label: "Akşam",       dot: "bg-indigo-500" },
};

function MealCalendar({ plan, onClose }: { plan: MealPlan; onClose: () => void }) {
  const [activeDay, setActiveDay] = useState(0);
  const day = plan.days[activeDay];

  const mealKeys: (keyof MealDay)[] = day.araOgun1
    ? ["kahvalti", "araOgun1", "ogle", "araOgun2", "aksam"]
    : ["kahvalti", "ogle", "aksam"];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-semibold text-white">{plan.planTitle}</h2>
              <p className="text-[11px] text-emerald-100">{plan.days.length} günlük kişisel beslenme takvimi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Day navigation */}
        <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-4 py-2.5 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {plan.days.map((d, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeDay === i ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}
              >
                {d.dayName}
              </button>
            ))}
          </div>
        </div>

        {/* Day content */}
        <div className="flex-1 overflow-y-auto">
          {/* Nav arrows (mobile) */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <button
              onClick={() => setActiveDay(d => Math.max(0, d - 1))}
              disabled={activeDay === 0}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-base font-bold text-slate-800">{day.dayName}</p>
              <p className="text-[11px] text-slate-400">{activeDay + 1} / {plan.days.length}</p>
            </div>
            <button
              onClick={() => setActiveDay(d => Math.min(plan.days.length - 1, d + 1))}
              disabled={activeDay === plan.days.length - 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Meals */}
          <div className="px-5 pb-4 space-y-2.5">
            {mealKeys.map(key => {
              const val = day[key] as string | undefined;
              if (!val) return null;
              const col = MEAL_COLORS[key] ?? MEAL_COLORS.ogle;
              return (
                <div key={key} className={`rounded-xl border ${col.border} ${col.bg} px-4 py-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{col.label}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{val}</p>
                </div>
              );
            })}

            {/* Daily tip */}
            {day.tip && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 flex gap-2.5">
                <Lightbulb className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <p className="text-xs text-teal-700 leading-relaxed">{day.tip}</p>
              </div>
            )}
          </div>

          {/* General tips (last day or always show) */}
          {plan.generalTips && plan.generalTips.length > 0 && activeDay === plan.days.length - 1 && (
            <div className="mx-5 mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Genel Beslenme Önerileri
              </p>
              <ul className="space-y-1">
                {plan.generalTips.map((tip, i) => (
                  <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5">
                    <Check className="w-3 h-3 mt-0.5 shrink-0" />{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">Diyetisyeninizle paylaşmanız önerilir</p>
          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-white border border-slate-200 transition-colors">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Meal Plan Message Bubble ─── */
function MealPlanBubble({ plan, onOpen }: { plan: MealPlan; onOpen: () => void }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
        <Calendar className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-emerald-500/80 mb-1 tracking-wide uppercase">BeslenmeBot</p>
        <div className="rounded-2xl rounded-tl-none bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-100 px-4 py-3 max-w-[85%]">
          <p className="text-sm font-semibold text-slate-700 mb-1">{plan.planTitle}</p>
          <p className="text-xs text-slate-500 mb-3">{plan.days.length} günlük kişiselleştirilmiş beslenme planınız hazır.</p>
          <button
            onClick={onOpen}
            className="flex items-center gap-1.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" /> Takvimi Aç
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Meal Todo Panel ─── */
const MEAL_SLOTS = [
  { key: "kahvalti", label: "Kahvaltı", dot: "bg-amber-400" },
  { key: "araOgun1", label: "Ara Öğün", dot: "bg-orange-400" },
  { key: "ogle",    label: "Öğle",    dot: "bg-emerald-500" },
  { key: "araOgun2", label: "Ara Öğün 2", dot: "bg-teal-400" },
  { key: "aksam",   label: "Akşam",   dot: "bg-blue-400" },
] as const;

function MealTodoPanel({
  plan, checked, onToggle, onNewPlan,
}: {
  plan: MealPlan;
  checked: CheckedMeals;
  onToggle: (dayIdx: number, mealKey: string) => void;
  onNewPlan: () => void;
}) {
  const [dayIdx, setDayIdx] = useState(0);
  const day = plan.days[dayIdx];
  const slots = MEAL_SLOTS.filter(s => !!(day as unknown as Record<string, string>)[s.key]);
  const dayChecked = checked[dayIdx] ?? {};
  const doneCount = slots.filter(s => dayChecked[s.key]).length;
  const pct = slots.length ? Math.round((doneCount / slots.length) * 100) : 0;

  return (
    <div className="shrink-0 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 px-4 py-3">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Top row: title · day nav · progress badge · new plan */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="text-[11px] font-semibold text-emerald-700 truncate flex-1">{plan.planTitle}</span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setDayIdx(i => Math.max(0, i - 1))}
              disabled={dayIdx === 0}
              className="p-0.5 rounded hover:bg-emerald-100 disabled:opacity-30 text-emerald-600 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-600 font-medium px-1 min-w-[56px] text-center">{day.dayName}</span>
            <button
              onClick={() => setDayIdx(i => Math.min(plan.days.length - 1, i + 1))}
              disabled={dayIdx === plan.days.length - 1}
              className="p-0.5 rounded hover:bg-emerald-100 disabled:opacity-30 text-emerald-600 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pct === 100 ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"}`}>
            {doneCount}/{slots.length}
          </span>
          <button onClick={onNewPlan} className="text-[10px] text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-0.5 shrink-0">
            <Sparkles className="w-3 h-3" /> Yeni Plan
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#6ee7b7" }}
          />
        </div>

        {/* Meal checkboxes */}
        <div className="flex flex-wrap gap-1.5">
          {slots.map(slot => {
            const content = (day as unknown as Record<string, string>)[slot.key];
            const done = !!dayChecked[slot.key];
            return (
              <button
                key={slot.key}
                onClick={() => onToggle(dayIdx, slot.key)}
                className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-xl border transition-all duration-200 ${
                  done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                {done
                  ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white" />
                  : <Circle className="w-3.5 h-3.5 shrink-0 text-slate-300" />
                }
                <span className={`font-semibold ${done ? "text-white" : "text-slate-500"}`}>{slot.label}</span>
                <span className={`max-w-[110px] truncate ${done ? "text-white/80 line-through" : "text-slate-400"}`}>{content}</span>
              </button>
            );
          })}
        </div>

        {pct === 100 && (
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Bugünün tüm öğünleri tamamlandı! 🎉
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function BeslenmeDanismani() {
  const init = loadCurrent();
  const [cancer, setCancer] = useState(init.cancer);
  const [phase, setPhase] = useState(init.phase);
  const [started, setStarted] = useState(init.started);
  const [messages, setMessages] = useState<Message[]>(init.messages);
  const [history, setHistory] = useState<Session[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [savedPlan, setSavedPlan] = useState<MealPlan | null>(loadSavedPlan);
  const [checkedMeals, setCheckedMeals] = useState<CheckedMeals>(loadCheckedMeals);

  function toggleMeal(dayIdx: number, mealKey: string) {
    setCheckedMeals(prev => {
      const next = {
        ...prev,
        [dayIdx]: { ...prev[dayIdx], [mealKey]: !prev[dayIdx]?.[mealKey] },
      };
      saveCheckedMeals(next);
      return next;
    });
  }

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { localStorage.setItem(CURRENT_KEY, JSON.stringify({ messages, cancer, phase, started })); }, [messages, cancer, phase, started]);

  function startChat() {
    setMessages([makeWelcome(cancer, phase)]);
    setStarted(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  function archiveAndReset() {
    const userMsgs = messages.filter(m => m.role === "user");
    if (userMsgs.length > 0) {
      const session: Session = { id: Date.now().toString(), date: new Date().toLocaleString("tr-TR"), preview: userMsgs[0].content.slice(0, 80), cancer, phase, messages: [...messages] };
      const updated = [session, ...history].slice(0, 15);
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    }
    setStarted(false); setMessages([]); setInput("");
    setCancer(CANCER_TYPES[0]); setPhase(TREATMENT_PHASES[0]); setShowHistory(false);
  }

  function loadSession(session: Session) {
    setMessages(session.messages); setCancer(session.cancer); setPhase(session.phase);
    setStarted(true); setShowHistory(false);
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = history.filter(s => s.id !== id);
    setHistory(updated); localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next: Message[] = [...messages, { role: "user", content: q }];
    setMessages(next); setInput("");

    if (isMealPlanRequest(q)) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Harika! Size özel bir beslenme takvimi hazırlayabilirim. Aşağıdaki formu doldurun, hemen oluşturayım. 🗓️",
      }]);
      setWizardOpen(true);
      return;
    }

    setLoading(true);
    try {
      const reply = await callNutritionAdvisor(next.filter(m => !m.error), cancer);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Şu an yanıt veremiyorum. Lütfen tekrar deneyin.", error: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  async function handleWizardGenerate(wizardData: WizardData) {
    setWizardLoading(true);
    try {
      const plan = await callMealPlan(wizardData, cancer, phase);
      setWizardOpen(false);
      savePlan(plan);
      setSavedPlan(plan);
      const resetChecked = {};
      setCheckedMeals(resetChecked);
      saveCheckedMeals(resetChecked);
      setMessages(prev => [...prev, { role: "assistant", content: "", mealPlan: plan }]);
      setActivePlan(plan);
    } catch {
      setWizardOpen(false);
      setMessages(prev => [...prev, { role: "assistant", content: "Beslenme planı oluşturulamadı. Lütfen tekrar deneyin.", error: true }]);
    } finally {
      setWizardLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  const showSuggestions = started && messages.length === 1 && !loading && !showHistory;

  /* ─── Setup screen ─── */
  if (!started) {
    return (
      <>
        {activePlan && <MealCalendar plan={activePlan} onClose={() => setActivePlan(null)} />}
        {wizardOpen && (
          <MealWizard
            onClose={() => setWizardOpen(false)}
            onGenerate={handleWizardGenerate}
            loading={wizardLoading}
          />
        )}
      <div className="flex flex-col h-[calc(100vh-52px)] bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200">
              <Salad className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Beslenme Danışmanı</h1>
              <p className="text-xs text-slate-400">Kanser türünüze özel beslenme rehberi</p>
            </div>
          </div>
          {savedPlan && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-emerald-100 shadow-sm">
              <MealTodoPanel
                plan={savedPlan}
                checked={checkedMeals}
                onToggle={toggleMeal}
                onNewPlan={() => setWizardOpen(true)}
              />
            </div>
          )}
          {!savedPlan && (
            <button
              onClick={() => setWizardOpen(true)}
              className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-sm text-emerald-700 transition-colors"
            >
              <Calendar className="w-4 h-4" /> Beslenme Takvimi Oluştur
            </button>
          )}
          {history.length > 0 && (
            <button onClick={() => { setStarted(true); setMessages([]); setShowHistory(true); }} className="w-full mb-3 flex items-center justify-between px-4 py-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 hover:bg-emerald-100/60 text-sm text-emerald-700 transition-colors">
              <span className="flex items-center gap-2"><History className="w-4 h-4" /> Geçmiş Sohbetlerim ({history.length})</span>
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
          )}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Kanser Türü</label>
              <div className="relative">
                <select value={cancer} onChange={e => setCancer(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 pr-8">
                  {CANCER_TYPES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Tedavi Aşaması</label>
              <div className="relative">
                <select value={phase} onChange={e => setPhase(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 pr-8">
                  {TREATMENT_PHASES.map(p => <option key={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <button onClick={startChat} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors shadow-md shadow-emerald-200">Başla</button>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-3">Bilgiler kişisel sağlık kararı niteliği taşımaz; diyetisyeninizle çalışın.</p>
        </div>
      </div>
      </>
    );
  }

  /* ─── Chat screen ─── */
  return (
    <PremiumGate featureName="Beslenme Danışmanı AI">
    <>
      {activePlan && <MealCalendar plan={activePlan} onClose={() => setActivePlan(null)} />}
      {wizardOpen && (
        <MealWizard
          onClose={() => setWizardOpen(false)}
          onGenerate={handleWizardGenerate}
          loading={wizardLoading}
        />
      )}

      <div className="flex flex-col h-[calc(100vh-52px)] bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30">
        {/* Header */}
        <div className="shrink-0 border-b border-emerald-100 bg-white/80 backdrop-blur-sm px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-sm">
                <Salad className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-800">Beslenme Danışmanı</h1>
                <p className="text-[11px] text-slate-400">
                  {cancer !== "Belirtmek istemiyorum" ? cancer : "Genel"} · {phase !== "Belirtmek istemiyorum" ? phase : "Tüm aşamalar"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Calendar shortcut */}
              <button
                onClick={() => savedPlan ? setActivePlan(savedPlan) : setWizardOpen(true)}
                className={`flex items-center gap-1.5 text-xs font-medium transition-all px-2.5 py-1.5 rounded-lg border ${savedPlan ? "bg-emerald-500 border-emerald-500 text-white shadow-sm hover:bg-emerald-600" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}
                title={savedPlan ? "Son beslenme planını görüntüle" : "Yeni beslenme takvimi oluştur"}
              >
                <Calendar className="w-3.5 h-3.5" />
                {savedPlan ? "Takvimim" : "Takvim Oluştur"}
              </button>
              <button
                onClick={() => setShowHistory(v => !v)}
                className={`flex items-center gap-1.5 text-xs transition-colors px-2.5 py-1.5 rounded-lg border ${showHistory ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
              >
                <History className="w-3.5 h-3.5" />
                Geçmiş {history.length > 0 && <span className="bg-emerald-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{history.length}</span>}
              </button>
              <button onClick={archiveAndReset} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-100">
                <RefreshCw className="w-3.5 h-3.5" /> Yeniden Başla
              </button>
            </div>
          </div>
        </div>

        {/* Meal Todo Strip */}
        {savedPlan && (
          <MealTodoPanel
            plan={savedPlan}
            checked={checkedMeals}
            onToggle={toggleMeal}
            onNewPlan={() => setWizardOpen(true)}
          />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {showHistory ? (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-500" /> Sohbet Geçmişi
                </h2>
                <button onClick={() => setShowHistory(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Bot className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Henüz kaydedilmiş sohbet yok.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map(session => (
                    <div key={session.id} onClick={() => loadSession(session)} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && loadSession(session)} className="w-full text-left rounded-xl border border-emerald-100 bg-white hover:bg-emerald-50 hover:border-emerald-200 px-4 py-3 transition-all shadow-sm group cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate font-medium">{session.preview}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> {session.date}
                            {session.cancer !== "Belirtmek istemiyorum" && <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{session.cancer}</span>}
                          </p>
                        </div>
                        <button onClick={(e) => deleteSession(session.id, e)} className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((msg, i) => {
                if (msg.mealPlan) {
                  return <MealPlanBubble key={i} plan={msg.mealPlan} onOpen={() => setActivePlan(msg.mealPlan!)} />;
                }
                if (msg.role === "assistant") {
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                        <Salad className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-emerald-500/80 mb-1 tracking-wide uppercase">BeslenmeBot</p>
                        <div className={`rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] ${msg.error ? "bg-red-50 border border-red-200 text-red-700" : "bg-emerald-50/80 border border-emerald-100 text-slate-700"}`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex gap-3 items-start justify-end">
                    <div className="flex-1 min-w-0 flex flex-col items-end">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1 tracking-wide uppercase">Siz</p>
                      <div className="rounded-2xl rounded-tr-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-slate-700 text-white max-w-[85%]">{msg.content}</div>
                    </div>
                    <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500">
                      <span className="text-xs font-bold">S</span>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3 items-start">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                    <Salad className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-emerald-50/80 border border-emerald-100">
                    <TypingDots />
                  </div>
                </div>
              )}

              {showSuggestions && (
                <div className="pt-1">
                  <p className="text-xs text-slate-400 mb-3 text-center">Başlamak için bir konu seçin</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => send(s)} className="text-left text-sm px-4 py-3 rounded-xl border border-emerald-100 bg-white hover:bg-emerald-50 hover:border-emerald-200 text-slate-600 transition-all shadow-sm">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {!showHistory && (
          <div className="shrink-0 border-t border-emerald-100/80 bg-white/90 backdrop-blur-sm px-6 py-4">
            <div className="max-w-3xl mx-auto flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder={`Soru yazın veya "haftalık yemek planı" isteyin...`}
                disabled={loading || wizardOpen}
                className="flex-1 resize-none rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50 min-h-[46px] max-h-[140px] overflow-y-auto leading-relaxed shadow-sm"
                onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 140)}px`; }}
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim() || wizardOpen}
                className="shrink-0 w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-md shadow-emerald-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">Enter ile gönder · Shift+Enter satır atla</p>
          </div>
        )}
      </div>
    </>
    </PremiumGate>
  );
}
