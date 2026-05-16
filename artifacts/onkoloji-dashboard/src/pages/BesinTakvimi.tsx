import { useState } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Sparkles, X, Check,
  CheckCircle2, Circle, Loader2, Salad, RefreshCw,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SAVED_PLAN_KEY  = "onko_beslenme_saved_plan";
const CHECKED_KEY     = "onko_beslenme_checked";

/* ─── Types ─── */
interface MealDay {
  dayName: string;
  kahvalti: string;
  araOgun1?: string;
  ogle: string;
  araOgun2?: string;
  aksam: string;
  tip?: string;
}
interface MealPlan { planTitle: string; days: MealDay[]; generalTips?: string[]; }
interface WizardData { days: number; mealsPerDay: number; restrictions: string[]; }
type CheckedMeals = Record<number, Record<string, boolean>>;

/* ─── localStorage helpers ─── */
function loadPlan(): MealPlan | null {
  try { const s = localStorage.getItem(SAVED_PLAN_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
function savePlan(p: MealPlan)    { try { localStorage.setItem(SAVED_PLAN_KEY, JSON.stringify(p)); } catch {} }
function loadChecked(): CheckedMeals {
  try { const s = localStorage.getItem(CHECKED_KEY); return s ? JSON.parse(s) : {}; } catch { return {}; }
}
function saveChecked(c: CheckedMeals) { try { localStorage.setItem(CHECKED_KEY, JSON.stringify(c)); } catch {} }

/* ─── API ─── */
async function callMealPlan(w: WizardData, cancer?: string, phase?: string): Promise<MealPlan> {
  const res = await fetch(`${BASE}/api/meal-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days: w.days, mealsPerDay: w.mealsPerDay, restrictions: w.restrictions, cancerType: cancer, treatmentPhase: phase }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? "Hata"); }
  return res.json() as Promise<MealPlan>;
}

/* ─── Constants ─── */
const RESTRICTION_OPTIONS = ["Gluten-siz","Vegan","Vejetaryen","Laktozsuz","Tuzsuz","Düşük Şeker","Lifli Ağırlıklı"];
const MEAL_SLOTS = [
  { key: "kahvalti",  label: "Kahvaltı",    color: "bg-amber-400",   light: "bg-amber-50 border-amber-100",   text: "text-amber-700" },
  { key: "araOgun1",  label: "Ara Öğün 1",  color: "bg-orange-400",  light: "bg-orange-50 border-orange-100", text: "text-orange-700" },
  { key: "ogle",      label: "Öğle",        color: "bg-emerald-500", light: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
  { key: "araOgun2",  label: "Ara Öğün 2",  color: "bg-teal-400",    light: "bg-teal-50 border-teal-100",     text: "text-teal-700" },
  { key: "aksam",     label: "Akşam",       color: "bg-blue-400",    light: "bg-blue-50 border-blue-100",     text: "text-blue-700" },
] as const;

/* ─── Wizard ─── */
function Wizard({ onClose, onGenerate, loading }: { onClose: () => void; onGenerate: (d: WizardData) => void; loading: boolean }) {
  const [days, setDays] = useState(7);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  function toggle(r: string) { setRestrictions(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]); }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-emerald-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-semibold text-white">Beslenme Takvimi Oluştur</h2>
              <p className="text-[11px] text-emerald-100">Kişiselleştirilmiş haftalık plan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">Kaç günlük plan?</label>
            <div className="flex gap-2">
              {[3,5,7].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${days === d ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200" : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50"}`}>
                  {d} Gün{d === 7 && <span className="ml-1 text-[10px] opacity-70">★</span>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">Günde kaç öğün?</label>
            <div className="flex gap-2">
              {[{ v: 3, label: "3 Ana Öğün" }, { v: 5, label: "5 Öğün (Ara Öğünlü)" }].map(({ v, label }) => (
                <button key={v} onClick={() => setMealsPerDay(v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${mealsPerDay === v ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200" : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">
              Besin kısıtları <span className="text-slate-400 normal-case font-normal">(opsiyonel)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {RESTRICTION_OPTIONS.map(r => (
                <button key={r} onClick={() => toggle(r)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border transition-all ${restrictions.includes(r) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50"}`}>
                  {restrictions.includes(r) && <Check className="w-3 h-3" />}{r}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => onGenerate({ days, mealsPerDay, restrictions })}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor…</> : <><Sparkles className="w-4 h-4" /> Takvim Oluştur</>}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 text-center pb-4">Bilgiler kişisel sağlık kararı niteliği taşımaz; diyetisyeninizle çalışın.</p>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function BesinTakvimi() {
  const [plan, setPlan] = useState<MealPlan | null>(loadPlan);
  const [checked, setChecked] = useState<CheckedMeals>(loadChecked);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(wizardData: WizardData) {
    setGenerating(true); setError(null);
    try {
      const p = await callMealPlan(wizardData);
      savePlan(p);
      setPlan(p);
      setChecked({});
      saveChecked({});
      setActiveDayIdx(0);
      setWizardOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Plan oluşturulamadı.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleMeal(dayIdx: number, mealKey: string) {
    setChecked(prev => {
      const next = { ...prev, [dayIdx]: { ...prev[dayIdx], [mealKey]: !prev[dayIdx]?.[mealKey] } };
      saveChecked(next);
      return next;
    });
  }

  /* ─── No plan state ─── */
  if (!plan) {
    return (
      <>
        {wizardOpen && <Wizard onClose={() => setWizardOpen(false)} onGenerate={handleGenerate} loading={generating} />}
        <div className="flex flex-col items-center justify-center h-[calc(100vh-52px)] bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 px-6">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Beslenme Takviminiz</h1>
            <p className="text-sm text-slate-500 mb-6">Kanser sürecinize özel kişiselleştirilmiş bir haftalık yemek planı oluşturun ve günlük öğünlerinizi takip edin.</p>
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <button
              onClick={() => setWizardOpen(true)}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-md shadow-emerald-200 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Takvim Oluştur
            </button>
            <p className="text-[11px] text-slate-400 mt-4">Yapay zeka ile oluşturulur · Diyetisyeninizle paylaşmanız önerilir</p>
          </div>
        </div>
      </>
    );
  }

  /* ─── Plan exists ─── */
  const activeDay = plan.days[activeDayIdx];
  const slots = MEAL_SLOTS.filter(s => !!(activeDay as unknown as Record<string, string>)[s.key]);
  const dayChecked = checked[activeDayIdx] ?? {};
  const doneCount = slots.filter(s => dayChecked[s.key]).length;
  const pct = slots.length ? Math.round((doneCount / slots.length) * 100) : 0;

  return (
    <>
      {wizardOpen && <Wizard onClose={() => setWizardOpen(false)} onGenerate={handleGenerate} loading={generating} />}

      <div className="flex flex-col h-[calc(100vh-52px)] bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20">

        {/* ── Header ── */}
        <div className="shrink-0 border-b border-emerald-100 bg-white/80 backdrop-blur-sm px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-sm">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-800">{plan.planTitle}</h1>
                <p className="text-[11px] text-slate-400">{plan.days.length} günlük kişisel beslenme takvimi</p>
              </div>
            </div>
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 border border-transparent hover:border-emerald-100"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Yeni Plan
            </button>
          </div>
        </div>

        {/* ── Day selector tabs ── */}
        <div className="shrink-0 border-b border-slate-100 bg-white/60 px-6 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
          <div className="max-w-3xl mx-auto flex gap-1 py-2">
            {plan.days.map((day, idx) => {
              const daySlots = MEAL_SLOTS.filter(s => !!(day as unknown as Record<string, string>)[s.key]);
              const dayDone  = daySlots.filter(s => checked[idx]?.[s.key]).length;
              const allDone  = dayDone === daySlots.length && daySlots.length > 0;
              const active   = idx === activeDayIdx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveDayIdx(idx)}
                  className={`shrink-0 flex flex-col items-center px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                    active
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                      : allDone
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <span className="font-semibold text-[11px] mb-0.5">{day.dayName.slice(0, 3).toUpperCase()}</span>
                  <span className={`text-[10px] ${active ? "text-emerald-100" : allDone ? "text-emerald-500" : "text-slate-300"}`}>
                    {allDone ? "✓" : `${dayDone}/${daySlots.length}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active day content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="max-w-3xl mx-auto space-y-4">

            {/* Day title + progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveDayIdx(i => Math.max(0, i - 1))} disabled={activeDayIdx === 0}
                  className="p-1.5 rounded-lg hover:bg-emerald-50 disabled:opacity-30 text-emerald-600 transition-colors border border-transparent hover:border-emerald-100">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-bold text-slate-800">{activeDay.dayName}</h2>
                <button onClick={() => setActiveDayIdx(i => Math.min(plan.days.length - 1, i + 1))} disabled={activeDayIdx === plan.days.length - 1}
                  className="p-1.5 rounded-lg hover:bg-emerald-50 disabled:opacity-30 text-emerald-600 transition-colors border border-transparent hover:border-emerald-100">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#6ee7b7" }} />
                </div>
                <span className={`text-xs font-semibold ${pct === 100 ? "text-emerald-600" : "text-slate-500"}`}>{doneCount}/{slots.length}</span>
              </div>
            </div>

            {/* Completion banner */}
            {pct === 100 && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-sm font-medium text-emerald-700">Bugünün tüm öğünleri tamamlandı! 🎉</p>
              </div>
            )}

            {/* Meal cards */}
            <div className="space-y-2.5">
              {slots.map(slot => {
                const content = (activeDay as unknown as Record<string, string>)[slot.key];
                const done = !!dayChecked[slot.key];
                return (
                  <button
                    key={slot.key}
                    onClick={() => toggleMeal(activeDayIdx, slot.key)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
                      done
                        ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200"
                        : "bg-white border-slate-100 hover:border-emerald-200 hover:shadow-sm shadow-xs"
                    }`}
                  >
                    <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${done ? "bg-white/25" : "border-2 border-slate-200"}`}>
                      {done
                        ? <CheckCircle2 className="w-4 h-4 text-white" />
                        : <Circle className="w-4 h-4 text-slate-200" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${slot.color}`} />
                        <p className={`text-xs font-bold uppercase tracking-wide ${done ? "text-white/80" : "text-slate-400"}`}>{slot.label}</p>
                      </div>
                      <p className={`text-sm font-medium leading-snug ${done ? "text-white line-through decoration-white/50" : "text-slate-700"}`}>
                        {content}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Day tip */}
            {activeDay.tip && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <Salad className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">{activeDay.tip}</p>
              </div>
            )}

            {/* General tips (last day) */}
            {plan.generalTips && plan.generalTips.length > 0 && activeDayIdx === plan.days.length - 1 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Genel Beslenme Önerileri
                </p>
                <ul className="space-y-1.5">
                  {plan.generalTips.map((tip, i) => (
                    <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5">
                      <Check className="w-3 h-3 mt-0.5 shrink-0" />{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[11px] text-slate-400 text-center pb-2">Diyetisyeninizle paylaşmanız önerilir</p>
          </div>
        </div>
      </div>
    </>
  );
}
