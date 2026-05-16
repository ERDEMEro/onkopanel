import { useState, useEffect } from "react";
import { NotebookPen, Plus, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DayLog {
  date: string; // YYYY-MM-DD
  pain: number;       // 0-10
  fatigue: number;    // 0-10
  appetite: number;   // 0-10
  mood: number;       // 0-10
  notes: string;
}

const STORAGE_KEY = "onko_symptom_journal";

function loadLogs(): DayLog[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveLogs(d: DayLog[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

const METRICS: { key: keyof Omit<DayLog, "date" | "notes">; label: string; color: string; desc: string }[] = [
  { key: "pain",     label: "Ağrı",     color: "#f87171", desc: "0 = yok, 10 = çok şiddetli" },
  { key: "fatigue",  label: "Yorgunluk",color: "#fb923c", desc: "0 = hiç yok, 10 = bitkin" },
  { key: "appetite", label: "İştah",    color: "#34d399", desc: "0 = hiç yok, 10 = çok iyi" },
  { key: "mood",     label: "Ruh Hali", color: "#818cf8", desc: "0 = çok kötü, 10 = mükemmel" },
];

function Slider({
  label, value, color, desc, onChange,
}: { label: string; value: number; color: string; desc: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full cursor-pointer appearance-none"
        style={{ accentColor: color }}
      />
      <p className="text-[11px] text-slate-400">{desc}</p>
    </div>
  );
}

export default function BeliritGunlugu() {
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [view, setView] = useState<"log" | "chart">("log");
  const [showForm, setShowForm] = useState(false);
  const [chartDays, setChartDays] = useState(14);
  const [form, setForm] = useState<Omit<DayLog, "date">>({ pain: 0, fatigue: 0, appetite: 5, mood: 5, notes: "" });

  useEffect(() => { setLogs(loadLogs()); }, []);

  const today = todayStr();
  const todayLog = logs.find((l) => l.date === today);

  function saveToday() {
    const updated = logs.filter((l) => l.date !== today);
    const sorted = [...updated, { date: today, ...form }].sort((a, b) => a.date.localeCompare(b.date));
    setLogs(sorted);
    saveLogs(sorted);
    setShowForm(false);
  }

  function openForm() {
    if (todayLog) {
      setForm({ pain: todayLog.pain, fatigue: todayLog.fatigue, appetite: todayLog.appetite, mood: todayLog.mood, notes: todayLog.notes });
    } else {
      setForm({ pain: 0, fatigue: 0, appetite: 5, mood: 5, notes: "" });
    }
    setShowForm(true);
  }

  // Chart data
  const chartData = logs.slice(-chartDays).map((l) => ({
    date: fmtDate(l.date),
    Ağrı: l.pain,
    Yorgunluk: l.fatigue,
    İştah: l.appetite,
    "Ruh Hali": l.mood,
  }));

  return (
    <div className="min-h-[calc(100vh-52px)] bg-gradient-to-br from-amber-50/30 via-white to-orange-50/20 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200">
              <NotebookPen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Belirti Günlüğü</h1>
              <p className="text-xs text-slate-400">{logs.length} günlük kayıt · yalnızca bu cihazda saklanır</p>
            </div>
          </div>
          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {(["log", "chart"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  view === v ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v === "log" ? <NotebookPen className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {v === "log" ? "Günlük" : "Grafik"}
              </button>
            ))}
          </div>
        </div>

        {/* Today's entry CTA */}
        {view === "log" && !showForm && (
          <div
            className={`mb-4 rounded-xl border p-4 flex items-center justify-between cursor-pointer transition-all ${
              todayLog
                ? "bg-amber-50 border-amber-200 hover:border-amber-300"
                : "bg-white border-dashed border-amber-300 hover:bg-amber-50"
            }`}
            onClick={openForm}
          >
            <div>
              <p className="text-sm font-medium text-slate-800">
                {todayLog ? "Bugünkü kaydı düzenle" : "Bugünkü belirtileri kaydet"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            {todayLog ? (
              <div className="flex gap-3 text-xs text-slate-500">
                {METRICS.map((m) => (
                  <div key={m.key} className="text-center">
                    <div className="text-base font-bold" style={{ color: m.color }}>{todayLog[m.key]}</div>
                    <div className="text-[10px]">{m.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Plus className="w-5 h-5 text-amber-500" />
            )}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-4 bg-white rounded-xl border border-amber-200 p-5 shadow-sm space-y-5">
            <p className="text-sm font-semibold text-slate-700">
              {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            {METRICS.map((m) => (
              <Slider
                key={m.key}
                label={m.label}
                value={form[m.key]}
                color={m.color}
                desc={m.desc}
                onChange={(v) => setForm((f) => ({ ...f, [m.key]: v }))}
              />
            ))}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Notlar (isteğe bağlı)</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Bugün nasıl hissettiniz?"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={saveToday} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors shadow-md shadow-amber-100">
                Kaydet
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                İptal
              </button>
            </div>
          </div>
        )}

        {/* Log view: past entries */}
        {view === "log" && !showForm && (
          <div className="space-y-2">
            {logs.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <NotebookPen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz kayıt yok — bugün başlayın!</p>
              </div>
            )}
            {[...logs].reverse().filter((l) => l.date !== today).slice(0, 20).map((l) => (
              <div key={l.date} className="bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">
                    {new Date(l.date + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <div className="flex gap-3">
                    {METRICS.map((m) => (
                      <div key={m.key} className="text-center">
                        <div className="text-sm font-bold" style={{ color: m.color }}>{l[m.key]}</div>
                        <div className="text-[10px] text-slate-400">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {l.notes && <p className="text-xs text-slate-500 border-t border-slate-50 pt-2 truncate">{l.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Chart view */}
        {view === "chart" && (
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">Son {chartDays} Gün</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setChartDays((d) => Math.max(7, d - 7))} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-500 w-8 text-center">{chartDays}g</span>
                <button onClick={() => setChartDays((d) => Math.min(30, d + 7))} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {chartData.length < 2 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Grafik için en az 2 günlük kayıt gerekli
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    labelStyle={{ fontWeight: 600, color: "#334155" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {METRICS.map((m) => (
                    <Line
                      key={m.key}
                      type="monotone"
                      dataKey={m.label}
                      stroke={m.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
