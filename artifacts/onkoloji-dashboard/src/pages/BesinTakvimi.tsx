import { useState, useEffect } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Sparkles, X, Check,
  CheckCircle2, Circle, Loader2, Salad,
  Pill, CalendarDays, Dumbbell, BedDouble, Heart,
  AlertCircle, Plus, Activity,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/* ─── localStorage keys ─── */
const MEAL_PLAN_KEY    = "onko_beslenme_saved_plan";
const CHECKED_KEY      = "onko_beslenme_checked";
const EXERCISE_KEY     = "onko_exercise_plan";
const SUPPORT_KEY      = "onko_psiko_plan";
const MED_KEY          = "onko_med_reminders";
const APPT_KEY         = "onko_appt_reminders";
const EX_CHECKED_KEY   = "onko_ex_checked";       // Record<dateStr, Record<exIdx, bool>>
const SUP_CHECKED_KEY  = "onko_sup_checked";      // Record<dateStr, Record<practiceIdx, bool>>
const MED_CHECKED_KEY  = "onko_med_checked";      // Record<dateStr, Record<medId, bool>>

/* ─── Types ─── */
interface MealDay { dayName: string; kahvalti: string; araOgun1?: string; ogle: string; araOgun2?: string; aksam: string; tip?: string; }
interface MealPlan { planTitle: string; days: MealDay[]; generalTips?: string[]; }
interface WizardData { days: number; mealsPerDay: number; restrictions: string[]; }
type CheckedMeals    = Record<number, Record<string, boolean>>;
type DateIndexChecks = Record<string, Record<number, boolean>>;  // keyed by dateStr → itemIdx
type DateIdChecks    = Record<string, Record<string, boolean>>;  // keyed by dateStr → itemId

interface ExerciseDay { dayName: string; rest?: boolean; exercises: { name: string; duration: string; note?: string }[]; tip?: string; }
interface ExercisePlan { planTitle: string; level: string; days: ExerciseDay[]; generalTips: string[]; }

interface Practice { title: string; description: string; duration: string; icon: string; }
interface SupportPlan { planTitle: string; dailyPractices: Practice[]; affirmations: string[]; weeklyGoals?: string[]; }

interface MedReminder { id: string; name: string; dose: string; time: string; frequency: "Günlük" | "Haftalık" | "Gerektiğinde"; }
interface ApptReminder { id: string; doctor: string; location: string; date: string; time: string; notes: string; }

/* ─── Helpers ─── */
function load<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; }
}
function saveMealPlan(p: MealPlan)          { try { localStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(p)); } catch {} }
function saveChecked(c: CheckedMeals)       { try { localStorage.setItem(CHECKED_KEY,    JSON.stringify(c)); } catch {} }
function saveExChecked(c: DateIndexChecks)  { try { localStorage.setItem(EX_CHECKED_KEY, JSON.stringify(c)); } catch {} }
function saveSupChecked(c: DateIndexChecks) { try { localStorage.setItem(SUP_CHECKED_KEY,JSON.stringify(c)); } catch {} }
function saveMedChecked(c: DateIdChecks)    { try { localStorage.setItem(MED_CHECKED_KEY,JSON.stringify(c)); } catch {} }

async function callMealPlan(w: WizardData): Promise<MealPlan> {
  const res = await fetch(`${BASE}/api/meal-plan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(w) });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? "Hata"); }
  return res.json() as Promise<MealPlan>;
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target.getTime()-today.getTime())/86400000);
}

function timeToMins(t: string) { const [h,m]=t.split(":").map(Number); return (h||0)*60+(m||0); }
function timeSlot(t: string): "sabah"|"ogle"|"aksam" {
  const m=timeToMins(t); return m<720?"sabah":m<1020?"ogle":"aksam";
}

const WEEK_DAYS = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];
const FULL_DAYS = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
const MEAL_SLOTS = [
  { key: "kahvalti", label: "Kahvaltı",   color: "bg-amber-400",   done_bg: "bg-amber-500"   },
  { key: "araOgun1", label: "Ara Öğün 1", color: "bg-orange-400",  done_bg: "bg-orange-500"  },
  { key: "ogle",     label: "Öğle",       color: "bg-emerald-500", done_bg: "bg-emerald-600" },
  { key: "araOgun2", label: "Ara Öğün 2", color: "bg-teal-400",    done_bg: "bg-teal-500"    },
  { key: "aksam",    label: "Akşam",      color: "bg-blue-400",    done_bg: "bg-blue-500"    },
] as const;
const RESTRICTION_OPTIONS = ["Gluten-siz","Vegan","Vejetaryen","Laktozsuz","Tuzsuz","Düşük Şeker","Lifli Ağırlıklı"];

/* ─── Exercise wizard constants ─── */
const CANCER_TYPES = [
  "Belirtmek istemiyorum","Meme Kanseri","Akciğer Kanseri","Kolon Kanseri",
  "Prostat Kanseri","Mide Kanseri","Lösemi","Lenfoma","Over Kanseri",
  "Pankreas Kanseri","Beyin Tümörü","Böbrek Kanseri","Diğer",
];
const TREATMENT_PHASES = [
  "Belirtmek istemiyorum","Kemoterapi sürecinde","Radyoterapi sürecinde",
  "Cerrahi sonrası iyileşme","Remisyon","Bakımsal tedavi",
];
const FITNESS_LEVELS = [
  { value:"cok_dusuk", label:"Çok düşük — Çoğu zaman yatağa bağlıyım" },
  { value:"dusuk",     label:"Düşük — Kısa yürüyüş yapabiliyorum" },
  { value:"orta",      label:"Orta — Günlük aktivitelerimi yapabiliyorum" },
  { value:"iyi",       label:"İyi — Düzenli hafif spor yapabiliyorum" },
];
const EX_RESTRICTIONS = ["Diz ağrısı","Sırt ağrısı","Lenfödem","Denge sorunu","Nefes darlığı","Ağrılı eklemler"];

function getWeekDates(weekOffset: number = 0): string[] {
  const today = new Date();
  const dow = (today.getDay()+6)%7;
  return Array.from({length:7},(_,i)=>{
    const d=new Date(today); d.setDate(today.getDate()-dow+i+weekOffset*7);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  });
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function weekRangeLabel(dates: string[]): string {
  const fmt = (s: string) => new Date(s+"T12:00:00").toLocaleDateString("tr-TR",{day:"numeric",month:"short"});
  return `${fmt(dates[0])} – ${fmt(dates[6])}`;
}

/* ─── Exercise API helper ─── */
async function callExercisePlan(cancerType: string, treatmentPhase: string, fitnessLevel: string, restrictions: string[]): Promise<ExercisePlan> {
  const res = await fetch(`${BASE}/api/exercise-plan`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cancerType, treatmentPhase, fitnessLevel, restrictions }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? "Hata"); }
  return res.json() as Promise<ExercisePlan>;
}
function saveExercisePlan(p: ExercisePlan) { try { localStorage.setItem(EXERCISE_KEY, JSON.stringify(p)); } catch {} }

/* ─── Exercise Wizard ─── */
function ExerciseWizard({ onClose, onDone, loading }: {
  onClose: () => void;
  onDone: (cancerType: string, treatmentPhase: string, fitnessLevel: string, restrictions: string[]) => void;
  loading: boolean;
}) {
  const [fitnessLevel, setFitnessLevel] = useState(FITNESS_LEVELS[1].value);
  const [phase, setPhase]               = useState(TREATMENT_PHASES[0]);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  function toggleR(r: string) { setRestrictions(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]); }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-teal-100 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Dumbbell className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-semibold text-white">Egzersiz Planı Oluştur</h2>
              <p className="text-[11px] text-teal-100">Yapay zeka ile kişisel 7 günlük plan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Fitness level */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">
              Fiziksel durumunuz nasıl?
            </label>
            <div className="space-y-2">
              {FITNESS_LEVELS.map(f => (
                <button key={f.value} onClick={() => setFitnessLevel(f.value)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    fitnessLevel === f.value
                      ? "bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-200"
                      : "border-slate-200 text-slate-600 hover:border-teal-200 hover:bg-teal-50"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Treatment phase */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">
              Tedavi süreci
            </label>
            <div className="flex flex-wrap gap-2">
              {TREATMENT_PHASES.map(t => (
                <button key={t} onClick={() => setPhase(t)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                    phase === t
                      ? "bg-teal-500 border-teal-500 text-white"
                      : "border-slate-200 text-slate-600 hover:border-teal-200 hover:bg-teal-50"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Restrictions */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">
              Fiziksel kısıtlama <span className="normal-case font-normal text-slate-400">(opsiyonel)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EX_RESTRICTIONS.map(r => (
                <button key={r} onClick={() => toggleR(r)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                    restrictions.includes(r)
                      ? "bg-teal-500 border-teal-500 text-white"
                      : "border-slate-200 text-slate-600 hover:border-teal-200 hover:bg-teal-50"
                  }`}>
                  {restrictions.includes(r) && <Check className="w-3 h-3" />}{r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onDone("Belirtmek istemiyorum", phase, fitnessLevel, restrictions)}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-md shadow-teal-200 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Yapay zeka planı hazırlıyor…</>
              : <><Sparkles className="w-4 h-4" /> Egzersiz Planı Oluştur</>
            }
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center pb-4">
          Plan EgzersizTakip sayfanızla senkron tutulur · Fizyoterapistinizle paylaşın
        </p>
      </div>
    </div>
  );
}

/* ─── Meal Wizard ─── */
function MealWizard({ onClose, onGenerate, loading }: { onClose:()=>void; onGenerate:(d:WizardData)=>void; loading:boolean }) {
  const [days,setDays]=useState(7);
  const [mealsPerDay,setMealsPerDay]=useState(3);
  const [restrictions,setRestrictions]=useState<string[]>([]);
  function toggle(r:string){setRestrictions(p=>p.includes(r)?p.filter(x=>x!==r):[...p,r]);}
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-emerald-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Salad className="w-5 h-5 text-white"/>
            <div><h2 className="text-sm font-semibold text-white">Beslenme Planı Oluştur</h2><p className="text-[11px] text-emerald-100">Kişiselleştirilmiş haftalık plan</p></div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">Kaç günlük plan?</label>
            <div className="flex gap-2">
              {[3,5,7].map(d=>(
                <button key={d} onClick={()=>setDays(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${days===d?"bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200":"border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50"}`}>
                  {d} Gün{d===7&&<span className="ml-1 text-[10px] opacity-70">★</span>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">Günde kaç öğün?</label>
            <div className="flex gap-2">
              {[{v:3,label:"3 Ana Öğün"},{v:5,label:"5 Öğün (Ara Öğünlü)"}].map(({v,label})=>(
                <button key={v} onClick={()=>setMealsPerDay(v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${mealsPerDay===v?"bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200":"border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 block">Besin kısıtları <span className="text-slate-400 normal-case font-normal">(opsiyonel)</span></label>
            <div className="flex flex-wrap gap-2">
              {RESTRICTION_OPTIONS.map(r=>(
                <button key={r} onClick={()=>toggle(r)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border transition-all ${restrictions.includes(r)?"bg-emerald-500 border-emerald-500 text-white":"border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50"}`}>
                  {restrictions.includes(r)&&<Check className="w-3 h-3"/>}{r}
                </button>
              ))}
            </div>
          </div>
          <button onClick={()=>onGenerate({days,mealsPerDay,restrictions})} disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-md shadow-emerald-200 flex items-center justify-center gap-2">
            {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Oluşturuluyor…</>:<><Sparkles className="w-4 h-4"/>Plan Oluştur</>}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 text-center pb-4">Diyetisyeninizle paylaşmanız önerilir.</p>
      </div>
    </div>
  );
}

/* ─── Section header ─── */
function SectionHeader({ emoji, title, badge }: { emoji: string; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-base">{emoji}</span>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{title}</p>
      {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{badge}</span>}
    </div>
  );
}

/* ─── Main ─── */
export default function BesinTakvimi() {
  const todayStr = toDateStr(new Date());
  const todayDow = (new Date().getDay()+6)%7;

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(todayDow);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string|null>(null);
  const [exWizardOpen, setExWizardOpen] = useState(false);
  const [generatingEx, setGeneratingEx] = useState(false);
  const [exError, setExError] = useState<string|null>(null);
  const [exChecked,  setExChecked]  = useState<DateIndexChecks>(()=>load(EX_CHECKED_KEY,  {}));
  const [supChecked, setSupChecked] = useState<DateIndexChecks>(()=>load(SUP_CHECKED_KEY, {}));
  const [medChecked, setMedChecked] = useState<DateIdChecks>   (()=>load(MED_CHECKED_KEY, {}));

  // All plans from localStorage
  const [mealPlan, setMealPlan] = useState<MealPlan|null>(()=>load(MEAL_PLAN_KEY, null));
  const [checked, setChecked] = useState<CheckedMeals>(()=>load(CHECKED_KEY, {}));
  const [exercisePlan, setExercisePlan] = useState<ExercisePlan|null>(()=>load(EXERCISE_KEY, null));
  const [supportPlan, setSupportPlan] = useState<SupportPlan|null>(()=>load(SUPPORT_KEY, null));
  const [meds, setMeds] = useState<MedReminder[]>(()=>load(MED_KEY, []));
  const [apts, setApts] = useState<ApptReminder[]>(()=>load(APPT_KEY, []));

  // Re-read from localStorage when tab becomes visible (plans may be updated on other pages)
  useEffect(() => {
    function onFocus() {
      setExercisePlan(load(EXERCISE_KEY, null));
      setSupportPlan(load(SUPPORT_KEY, null));
      setMeds(load(MED_KEY, []));
      setApts(load(APPT_KEY, []));
      setMealPlan(load(MEAL_PLAN_KEY, null));
      setChecked(load(CHECKED_KEY, {}));
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  async function handleGenerate(wizardData: WizardData) {
    setGenerating(true); setGenError(null);
    try {
      const p = await callMealPlan(wizardData);
      saveMealPlan(p); setMealPlan(p); setChecked({}); saveChecked({}); setWizardOpen(false);
    } catch(e) { setGenError(e instanceof Error ? e.message : "Plan oluşturulamadı."); }
    finally { setGenerating(false); }
  }

  async function handleGenerateExercise(cancerType: string, treatmentPhase: string, fitnessLevel: string, restrictions: string[]) {
    setGeneratingEx(true); setExError(null);
    try {
      const p = await callExercisePlan(cancerType, treatmentPhase, fitnessLevel, restrictions);
      saveExercisePlan(p); setExercisePlan(p); setExWizardOpen(false);
    } catch(e) { setExError(e instanceof Error ? e.message : "Egzersiz planı oluşturulamadı."); }
    finally { setGeneratingEx(false); }
  }

  function toggleMeal(dayIdx: number, mealKey: string) {
    setChecked(prev => {
      const next = { ...prev, [dayIdx]: { ...prev[dayIdx], [mealKey]: !prev[dayIdx]?.[mealKey] } };
      saveChecked(next); return next;
    });
  }

  function toggleEx(dateStr: string, idx: number) {
    setExChecked(prev => {
      const next = { ...prev, [dateStr]: { ...prev[dateStr], [idx]: !prev[dateStr]?.[idx] } };
      saveExChecked(next); return next;
    });
  }

  function toggleSup(dateStr: string, idx: number) {
    setSupChecked(prev => {
      const next = { ...prev, [dateStr]: { ...prev[dateStr], [idx]: !prev[dateStr]?.[idx] } };
      saveSupChecked(next); return next;
    });
  }

  function toggleMed(dateStr: string, medId: string) {
    setMedChecked(prev => {
      const next = { ...prev, [dateStr]: { ...prev[dateStr], [medId]: !prev[dateStr]?.[medId] } };
      saveMedChecked(next); return next;
    });
  }

  const weekDates = getWeekDates(weekOffset);
  const selectedDate = weekDates[selectedDay];
  const isToday = selectedDate === todayStr;

  // Meal data for selected day
  const mealDay = mealPlan?.days[selectedDay];
  const mealSlots = mealDay ? MEAL_SLOTS.filter(s => !!(mealDay as unknown as Record<string,string>)[s.key]) : [];
  const dayChecked = checked[selectedDay] ?? {};
  const doneCount = mealSlots.filter(s=>dayChecked[s.key]).length;
  const mealPct = mealSlots.length ? Math.round((doneCount/mealSlots.length)*100) : 0;

  // Exercise for selected day
  const exerciseDay = exercisePlan?.days[selectedDay];

  // Medications
  const dailyMeds = meds.filter(m=>m.frequency==="Günlük"||m.frequency==="Gerektiğinde")
    .sort((a,b)=>timeToMins(a.time)-timeToMins(b.time));
  const weeklyMeds = meds.filter(m=>m.frequency==="Haftalık");
  const sabahMeds = dailyMeds.filter(m=>timeSlot(m.time)==="sabah");
  const ogleMeds  = dailyMeds.filter(m=>timeSlot(m.time)==="ogle");
  const aksamMeds = dailyMeds.filter(m=>timeSlot(m.time)==="aksam");

  // Appointments for today
  const dayApts = apts.filter(a=>a.date===selectedDate);
  const upcomingApts = apts.filter(a=>daysUntil(a.date)>=0&&a.date!==selectedDate).slice(0,3);

  // Support
  const affirmation = supportPlan?.affirmations?.[selectedDay % (supportPlan.affirmations.length||1)];

  const hasAnything = !!(mealPlan||exercisePlan||supportPlan||meds.length||apts.length);

  return (
    <>
      {wizardOpen   && <MealWizard     onClose={()=>setWizardOpen(false)}   onGenerate={handleGenerate} loading={generating}/>}
      {exWizardOpen && <ExerciseWizard onClose={()=>setExWizardOpen(false)} onDone={handleGenerateExercise} loading={generatingEx}/>}

      <div className="min-h-[calc(100vh-52px)] bg-gradient-to-br from-slate-50/60 via-white to-emerald-50/20">

        {/* Header */}
        <div className="border-b border-slate-100 bg-white/80 backdrop-blur-sm px-6 py-3 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-sm">
                <Calendar className="w-4 h-4 text-white"/>
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800">Günlük Sağlık Takvimi</h1>
                <p className="text-[11px] text-slate-400">Tüm planlarınız tek görünümde</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={()=>setExWizardOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 px-2.5 py-1.5 rounded-lg hover:bg-teal-50 border border-transparent hover:border-teal-100 transition-all">
                <Activity className="w-3.5 h-3.5"/>
                {exercisePlan?"Egzersiz Yenile":"Egzersiz Ekle"}
              </button>
              <button onClick={()=>setWizardOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all">
                <Salad className="w-3.5 h-3.5"/>
                {mealPlan?"Beslenme Yenile":"Beslenme Ekle"}
              </button>
            </div>
          </div>
        </div>

        {/* Week strip */}
        <div className="bg-white border-b border-slate-100 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            {/* Week navigation header */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={()=>setWeekOffset(o=>o-1)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5"/> Önceki
              </button>
              <div className="text-center">
                <p className="text-[11px] font-semibold text-slate-600">{weekRangeLabel(weekDates)}</p>
                {weekOffset===0 && <p className="text-[10px] text-emerald-500">Bu Hafta</p>}
                {weekOffset<0  && <p className="text-[10px] text-slate-400">{Math.abs(weekOffset)} hafta önce</p>}
                {weekOffset>0  && <p className="text-[10px] text-slate-400">{weekOffset} hafta sonra</p>}
              </div>
              <button
                onClick={()=>setWeekOffset(o=>o+1)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-all"
              >
                Sonraki <ChevronRight className="w-3.5 h-3.5"/>
              </button>
            </div>
            {/* Day buttons */}
            <div className="grid grid-cols-7 gap-1">
              {WEEK_DAYS.map((d,i)=>{
                const dateStr=weekDates[i];
                const hasAppt=apts.some(a=>a.date===dateStr);
                const hasMed=dailyMeds.length>0;
                const hasExercise=exercisePlan?!exercisePlan.days[i]?.rest:false;
                const hasMeal=!!(mealPlan?.days[i]);
                const isTod=dateStr===todayStr;
                const isSel=i===selectedDay;
                return (
                  <button key={d} onClick={()=>setSelectedDay(i)}
                    className={`flex flex-col items-center py-2 rounded-xl transition-all ${isSel?"bg-emerald-500 text-white shadow-md shadow-emerald-100":isTod?"ring-2 ring-emerald-200 bg-emerald-50":"hover:bg-slate-50"}`}>
                    <span className={`text-[10px] font-semibold mb-1 ${isSel?"text-emerald-100":isTod?"text-emerald-600":"text-slate-400"}`}>{d}</span>
                    <span className={`text-sm font-bold ${isSel?"text-white":isTod?"text-emerald-700":"text-slate-700"}`}>
                      {new Date(dateStr+"T12:00:00").getDate()}
                    </span>
                    <div className="flex gap-0.5 mt-1 h-2 items-center">
                      {hasMeal    && <div className={`w-1 h-1 rounded-full ${isSel?"bg-white/70":"bg-emerald-400"}`}/>}
                      {hasMed     && <div className={`w-1 h-1 rounded-full ${isSel?"bg-white/70":"bg-violet-400"}`}/>}
                      {hasExercise&& <div className={`w-1 h-1 rounded-full ${isSel?"bg-white/70":"bg-teal-400"}`}/>}
                      {hasAppt    && <div className={`w-1 h-1 rounded-full ${isSel?"bg-white/70":"bg-amber-400"}`}/>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 justify-center mt-2 pt-2 border-t border-slate-50">
              {weekOffset!==0&&(
                <button onClick={()=>{setWeekOffset(0);setSelectedDay(todayDow);}}
                  className="text-[10px] text-emerald-600 hover:underline font-medium mr-2">
                  Bugüne Dön
                </button>
              )}
              {[["bg-emerald-400","Yemek"],["bg-violet-400","İlaç"],["bg-teal-400","Egzersiz"],["bg-amber-400","Randevu"]].map(([c,l])=>(
                <span key={l} className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${c} inline-block`}/>{l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Day title */}
        <div className="max-w-2xl mx-auto px-6 pt-5 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={()=>{
                if(selectedDay===0){setWeekOffset(o=>o-1);setSelectedDay(6);}
                else setSelectedDay(d=>d-1);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4"/>
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-800">{FULL_DAYS[selectedDay]}</h2>
              <p className="text-xs text-slate-400">
                {new Date(selectedDate+"T12:00:00").toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})}
                {isToday&&<span className="ml-2 text-emerald-600 font-semibold">· Bugün</span>}
              </p>
            </div>
            <button
              onClick={()=>{
                if(selectedDay===6){setWeekOffset(o=>o+1);setSelectedDay(0);}
                else setSelectedDay(d=>d+1);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Empty state */}
        {!hasAnything && (
          <div className="max-w-2xl mx-auto px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-emerald-400"/>
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-2">Takvim henüz boş</h3>
            <p className="text-sm text-slate-400 mb-6">İlaç ekleyin, egzersiz planı oluşturun veya beslenme programı başlatın — hepsi burada görünür.</p>
            <button onClick={()=>setWizardOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors shadow-md shadow-emerald-200">
              <Plus className="w-4 h-4"/> Beslenme Planı Ekle
            </button>
          </div>
        )}

        {/* Content */}
        {hasAnything && (
          <div className="max-w-2xl mx-auto px-6 py-4 space-y-5 pb-10">

            {/* Appointments for this day */}
            {dayApts.length>0 && (
              <section>
                <SectionHeader emoji="🗓" title="Bugünkü Randevular"/>
                <div className="space-y-2">
                  {dayApts.map(a=>(
                    <div key={a.id} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{a.doctor}</p>
                        <p className="text-xs text-slate-500">{a.time}{a.location&&` · ${a.location}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Medications */}
            {(dailyMeds.length>0||weeklyMeds.length>0) && (
              <section>
                <SectionHeader emoji="💊" title="İlaçlar" badge={`${dailyMeds.length+weeklyMeds.length} ilaç`}/>
                <div className="space-y-2">
                  {[
                    {label:"🌅 Sabah", list:sabahMeds},
                    {label:"☀️ Öğle",  list:ogleMeds},
                    {label:"🌙 Akşam", list:aksamMeds},
                  ].filter(s=>s.list.length>0).map(s=>(
                    <div key={s.label} className="bg-white rounded-xl border border-violet-100 shadow-sm overflow-hidden">
                      <div className="px-4 py-2 bg-violet-50/60 border-b border-violet-100">
                        <p className="text-xs font-semibold text-violet-700">{s.label}</p>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {s.list.map(m=>{
                          const done = !!medChecked[selectedDate]?.[m.id];
                          return (
                            <button key={m.id} onClick={()=>toggleMed(selectedDate,m.id)}
                              className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-all duration-200 ${done?"bg-violet-500":"hover:bg-violet-50/40"}`}>
                              <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${done?"bg-white/25":"border-2 border-slate-200"}`}>
                                {done?<CheckCircle2 className="w-4 h-4 text-white"/>:<Circle className="w-4 h-4 text-slate-200"/>}
                              </div>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                                <Pill className={`w-3.5 h-3.5 ${done?"text-white/80":"text-violet-500"}`}/>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${done?"text-white line-through decoration-white/50":"text-slate-800"}`}>{m.name}</p>
                                <p className={`text-xs ${done?"text-white/70":"text-slate-500"}`}>{m.dose&&`${m.dose} · `}{m.time}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${done?"bg-white/20 text-white border-white/30":"bg-violet-50 text-violet-600 border-violet-100"}`}>{m.frequency}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {weeklyMeds.length>0 && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-600">📅 Haftalık İlaçlar</p>
                      </div>
                      {weeklyMeds.map(m=>{
                        const done = !!medChecked[selectedDate]?.[m.id];
                        return (
                          <button key={m.id} onClick={()=>toggleMed(selectedDate,m.id)}
                            className={`w-full text-left flex items-center gap-3 px-4 py-3 border-t border-slate-50 first:border-t-0 transition-all ${done?"bg-purple-500":"hover:bg-purple-50/40"}`}>
                            <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${done?"bg-white/25":"border-2 border-slate-200"}`}>
                              {done?<CheckCircle2 className="w-4 h-4 text-white"/>:<Circle className="w-4 h-4 text-slate-200"/>}
                            </div>
                            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0"><Pill className={`w-3.5 h-3.5 ${done?"text-white":"text-purple-500"}`}/></div>
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${done?"text-white line-through decoration-white/50":"text-slate-800"}`}>{m.name}</p>
                              <p className={`text-xs ${done?"text-white/70":"text-slate-500"}`}>{m.dose&&`${m.dose} · `}Haftalık</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Exercise — no plan prompt */}
            {!exercisePlan && hasAnything && (
              <section>
                <SectionHeader emoji="🏃" title="Egzersiz Planı"/>
                <button onClick={()=>setExWizardOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-teal-200 text-teal-500 hover:border-teal-300 hover:bg-teal-50/50 text-sm font-medium transition-all">
                  <Plus className="w-4 h-4"/> Egzersiz Planı Oluştur
                </button>
                {exError&&<p className="text-xs text-red-500 mt-1.5">{exError}</p>}
              </section>
            )}

            {/* Exercise */}
            {exercisePlan && exerciseDay && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏃</span>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Egzersiz Planı</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{exercisePlan.level}</span>
                  </div>
                  <button onClick={()=>setExWizardOpen(true)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-teal-600 transition-colors px-1.5 py-0.5 rounded hover:bg-teal-50">
                    <Activity className="w-3 h-3"/>Yenile
                  </button>
                </div>
                {exError&&<p className="text-xs text-red-500 mb-2">{exError}</p>}
                <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${exerciseDay.rest?"border-slate-100":"border-teal-100"}`}>
                  <div className={`flex items-center gap-2 px-4 py-2.5 ${exerciseDay.rest?"bg-slate-50 border-b border-slate-100":"bg-teal-50/60 border-b border-teal-100"}`}>
                    {exerciseDay.rest
                      ? <BedDouble className="w-4 h-4 text-slate-400"/>
                      : <Dumbbell className="w-4 h-4 text-teal-500"/>
                    }
                    <p className={`text-xs font-semibold ${exerciseDay.rest?"text-slate-500":"text-teal-700"}`}>
                      {exerciseDay.rest?"Dinlenme Günü":exerciseDay.dayName}
                    </p>
                    <span className="ml-auto text-[10px] text-slate-400">{exercisePlan.planTitle}</span>
                  </div>
                  {!exerciseDay.rest && exerciseDay.exercises.length>0 && (
                    <div className="px-3 py-2.5 space-y-1.5">
                      {exerciseDay.exercises.map((ex,ei)=>{
                        const done = !!exChecked[selectedDate]?.[ei];
                        return (
                          <button key={ei} onClick={()=>toggleEx(selectedDate,ei)}
                            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                              done ? "bg-teal-500 border-teal-500 shadow-sm" : "bg-white border-slate-100 hover:border-teal-200 hover:shadow-sm"
                            }`}>
                            <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${done?"bg-white/25":"border-2 border-slate-200"}`}>
                              {done ? <CheckCircle2 className="w-4 h-4 text-white"/> : <Circle className="w-4 h-4 text-slate-200"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${done?"text-white line-through decoration-white/50":"text-slate-800"}`}>{ex.name}</p>
                              <p className={`text-xs mt-0.5 ${done?"text-white/70":"text-slate-400"}`}>{ex.duration}{ex.note&&` · ${ex.note}`}</p>
                            </div>
                          </button>
                        );
                      })}
                      {(() => {
                        const total = exerciseDay.exercises.length;
                        const done  = exerciseDay.exercises.filter((_,ei)=>!!exChecked[selectedDate]?.[ei]).length;
                        return total>0 && done===total ? (
                          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2 mt-1">
                            <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0"/>
                            <p className="text-xs font-medium text-teal-700">Bugünün egzersizleri tamamlandı! 💪</p>
                          </div>
                        ) : null;
                      })()}
                      {exerciseDay.tip&&(
                        <p className="text-xs text-teal-600 bg-teal-50 rounded-lg px-3 py-2 border border-teal-100">💡 {exerciseDay.tip}</p>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Meal plan */}
            {mealPlan && mealDay && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍽️</span>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Beslenme</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{mealPlan.planTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{width:`${mealPct}%`,background:mealPct===100?"#10b981":"#6ee7b7"}}/>
                    </div>
                    <span className={`text-[11px] font-semibold ${mealPct===100?"text-emerald-600":"text-slate-400"}`}>{doneCount}/{mealSlots.length}</span>
                  </div>
                </div>
                {mealPct===100&&(
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/>
                    <p className="text-sm font-medium text-emerald-700">Bugünün tüm öğünleri tamamlandı! 🎉</p>
                  </div>
                )}
                <div className="space-y-2">
                  {mealSlots.map(slot=>{
                    const content=(mealDay as unknown as Record<string,string>)[slot.key];
                    const done=!!dayChecked[slot.key];
                    return (
                      <button key={slot.key} onClick={()=>toggleMeal(selectedDay,slot.key)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${done?"bg-emerald-500 border-emerald-500 shadow-sm":"bg-white border-slate-100 hover:border-emerald-200 hover:shadow-sm"}`}>
                        <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${done?"bg-white/25":"border-2 border-slate-200"}`}>
                          {done?<CheckCircle2 className="w-4 h-4 text-white"/>:<Circle className="w-4 h-4 text-slate-200"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${slot.color}`}/>
                            <p className={`text-xs font-bold uppercase tracking-wide ${done?"text-white/80":"text-slate-400"}`}>{slot.label}</p>
                          </div>
                          <p className={`text-sm font-medium leading-snug ${done?"text-white line-through decoration-white/50":"text-slate-700"}`}>{content}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {mealDay.tip&&(
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mt-2">
                    <Salad className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/>
                    <p className="text-xs text-amber-700">{mealDay.tip}</p>
                  </div>
                )}
                {genError&&<p className="text-xs text-red-500 mt-2">{genError}</p>}
              </section>
            )}

            {/* No meal plan prompt */}
            {!mealPlan && hasAnything && (
              <section>
                <SectionHeader emoji="🍽️" title="Beslenme"/>
                <button onClick={()=>setWizardOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-500 hover:border-emerald-300 hover:bg-emerald-50/50 text-sm font-medium transition-all">
                  <Plus className="w-4 h-4"/> Beslenme Planı Oluştur
                </button>
              </section>
            )}

            {/* Psychological support */}
            {supportPlan && supportPlan.dailyPractices?.length>0 && (
              <section>
                <SectionHeader emoji="💜" title="Günlük Destek Pratikleri"/>
                <div className="space-y-2">
                  {supportPlan.dailyPractices.map((p,i)=>{
                    const done = !!supChecked[selectedDate]?.[i];
                    return (
                      <button key={i} onClick={()=>toggleSup(selectedDate,i)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-200 shadow-sm ${
                          done ? "bg-rose-500 border-rose-500" : "bg-white border-rose-100 hover:border-rose-200 hover:shadow-md"
                        }`}>
                        <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${done?"bg-white/25":"border-2 border-slate-200"}`}>
                          {done?<CheckCircle2 className="w-4 h-4 text-white"/>:<Circle className="w-4 h-4 text-slate-200"/>}
                        </div>
                        <span className="text-lg shrink-0">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${done?"text-white line-through decoration-white/50":"text-slate-800"}`}>{p.title}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${done?"bg-white/20 text-white border-white/30":"bg-rose-50 text-rose-600 border-rose-100"}`}>{p.duration}</span>
                          </div>
                          <p className={`text-xs mt-0.5 leading-relaxed ${done?"text-white/70":"text-slate-500"}`}>{p.description}</p>
                        </div>
                      </button>
                    );
                  })}
                  {(() => {
                    const total = supportPlan.dailyPractices.length;
                    const doneCount = supportPlan.dailyPractices.filter((_,i)=>!!supChecked[selectedDate]?.[i]).length;
                    return total>0 && doneCount===total ? (
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
                        <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0"/>
                        <p className="text-xs font-medium text-rose-700">Bugünün tüm destek pratikleri tamamlandı! 🌸</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              </section>
            )}

            {/* Affirmation */}
            {affirmation && (
              <section>
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                  <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wide mb-1">Günün Düşüncesi</p>
                    <p className="text-sm text-rose-700 italic leading-relaxed">"{affirmation}"</p>
                  </div>
                </div>
              </section>
            )}

            {/* Upcoming appointments */}
            {upcomingApts.length>0 && (
              <section>
                <SectionHeader emoji="📌" title="Yaklaşan Randevular"/>
                <div className="space-y-2">
                  {upcomingApts.map(a=>{
                    const days=daysUntil(a.date);
                    return (
                      <div key={a.id} className="bg-white border border-purple-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                        <CalendarDays className="w-4 h-4 text-purple-400 shrink-0"/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{a.doctor}</p>
                          <p className="text-xs text-slate-500">{new Date(a.date).toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:"numeric"})} {a.time}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${days===0?"bg-amber-100 text-amber-700":days<=3?"bg-red-100 text-red-600":days<=7?"bg-orange-100 text-orange-600":"bg-green-100 text-green-700"}`}>
                          {days===0?"Bugün":`${days} gün kaldı`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* General tips from exercise or meal plan */}
            {exercisePlan?.generalTips&&exercisePlan.generalTips.length>0&&selectedDay===todayDow&&(
              <section>
                <SectionHeader emoji="💡" title="Genel Egzersiz Önerileri"/>
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                  <ul className="space-y-1">
                    {exercisePlan.generalTips.map((tip,i)=>(
                      <li key={i} className="text-xs text-teal-700 flex items-start gap-1.5"><span className="mt-0.5 shrink-0">•</span>{tip}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {mealPlan?.generalTips&&mealPlan.generalTips.length>0&&selectedDay===mealPlan.days.length-1&&(
              <section>
                <SectionHeader emoji="🥗" title="Beslenme Önerileri"/>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <ul className="space-y-1.5">
                    {mealPlan.generalTips.map((tip,i)=>(
                      <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5"><Check className="w-3 h-3 mt-0.5 shrink-0"/>{tip}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            <p className="text-[11px] text-slate-400 text-center pb-2">Planlarınız yalnızca bu cihazda saklanır · Tıbbi karar yerine geçmez</p>
          </div>
        )}
      </div>
    </>
  );
}
