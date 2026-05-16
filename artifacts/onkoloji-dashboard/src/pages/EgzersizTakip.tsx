import { useState, useEffect } from "react";
import { Activity, Plus, Trash2, TrendingUp, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ExerciseLog {
  id: string;
  date: string;
  type: string;
  duration: number; // minutes
  intensity: "hafif" | "orta" | "yorucu";
  notes: string;
}

const STORAGE_KEY = "onko_exercise_logs";

const EXERCISE_TYPES = [
  "Yürüyüş", "Hafif Germe / Esneme", "Yoga / Meditasyon", "Bisiklet", "Yüzme",
  "Nefes Egzersizi", "Denge Egzersizi", "Kol Hareketi", "Bacak Hareketi", "Diğer",
];

const INTENSITY_COLORS: Record<string, string> = {
  hafif: "#34d399",
  orta: "#60a5fa",
  yorucu: "#f87171",
};

const TIPS = [
  { icon: "🚶", title: "Günde 30 dakika yürüyüş", text: "Hafif tempolu yürüyüş, yorgunluğu azaltır ve ruh halini iyileştirir. Tedavi günlerinde 10 dakikalık kısa turlar bile faydalıdır." },
  { icon: "🧘", title: "Nefes egzersizleri", text: "Derin nefes alıp verme, stres hormonlarını düşürür ve uyku kalitesini artırır. Kemoterapi sonrası yorgunluğa karşı etkilidir." },
  { icon: "💪", title: "Direnç egzersizleri", text: "Hafif ağırlıklar veya lastik bantlarla yapılan kas egzersizleri, kas kaybını önler ve enerji düzeyini artırır." },
  { icon: "🏊", title: "Su egzersizleri", text: "Eklem ağrısı veya lenfödemi olanlar için yüzme veya su aerobiği idealdir; eklemlere baskı yapmaz." },
  { icon: "⚠️", title: "Dikkat edilmesi gerekenler", text: "Ateşiniz varsa, kan değerleriniz düşükse veya kendinizi çok halsiz hissediyorsanız o gün dinlenmeyi tercih edin. Her egzersiz planı için onkoloji ekibinize danışın." },
];

function loadLogs(): ExerciseLog[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveLogs(d: ExerciseLog[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function EgzersizTakip() {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [view, setView] = useState<"log" | "chart" | "tips">("log");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: EXERCISE_TYPES[0],
    duration: 20,
    intensity: "hafif" as ExerciseLog["intensity"],
    notes: "",
  });

  useEffect(() => { setLogs(loadLogs()); }, []);

  function addLog() {
    const entry: ExerciseLog = { id: uid(), date: todayStr(), ...form };
    const updated = [...logs, entry].sort((a, b) => a.date.localeCompare(b.date));
    setLogs(updated); saveLogs(updated); setShowForm(false);
    setForm({ type: EXERCISE_TYPES[0], duration: 20, intensity: "hafif", notes: "" });
  }

  function deleteLog(id: string) {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated); saveLogs(updated);
  }

  // Weekly chart: last 14 days, sum duration per day
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayLogs = logs.filter((l) => l.date === dateStr);
    const total = dayLogs.reduce((s, l) => s + l.duration, 0);
    return {
      date: d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
      dakika: total,
    };
  });

  const totalMin = logs.reduce((s, l) => s + l.duration, 0);
  const sessions = logs.length;
  const todayMin = logs.filter((l) => l.date === todayStr()).reduce((s, l) => s + l.duration, 0);

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
            { label: "Haftalık Ort.", value: `${Math.round(totalMin / Math.max(1, Math.ceil(sessions / 7)))} dk`, sub: "seans başı" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-teal-100 p-3 text-center shadow-sm">
              <div className="text-lg font-bold text-teal-600">{s.value}</div>
              <div className="text-[11px] text-slate-500">{s.label}</div>
              <div className="text-[10px] text-slate-400">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
          {(["log", "chart", "tips"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                view === v ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {v === "log" ? <><Activity className="w-3.5 h-3.5" />Günlük</> :
               v === "chart" ? <><TrendingUp className="w-3.5 h-3.5" />Grafik</> :
               <><Info className="w-3.5 h-3.5" />Bilgi</>}
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
                    <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200">
                      {EXERCISE_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Süre (dk)</label>
                    <input type="number" min={1} max={180} value={form.duration}
                      onChange={(e) => setForm((f) => ({ ...f, duration: Math.max(1, Number(e.target.value)) }))}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Yoğunluk</label>
                  <div className="flex gap-2">
                    {(["hafif", "orta", "yorucu"] as const).map((v) => (
                      <button key={v} onClick={() => setForm((f) => ({ ...f, intensity: v }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          form.intensity === v ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-teal-200"
                        }`}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea rows={2} placeholder="Notlar (isteğe bağlı)" value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-200" />
                <div className="flex gap-2">
                  <button onClick={addLog} className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors">Kaydet</button>
                  <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">İptal</button>
                </div>
              </div>
            )}

            {logs.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz egzersiz kaydı yok</p>
              </div>
            )}

            {[...logs].reverse().slice(0, 20).map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm flex items-center gap-3">
                <div className="w-2 h-12 rounded-full" style={{ backgroundColor: INTENSITY_COLORS[l.intensity] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{l.type}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${INTENSITY_COLORS[l.intensity]}20`, color: INTENSITY_COLORS[l.intensity] }}>{l.intensity}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(l.date + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} · {l.duration} dakika
                  </p>
                  {l.notes && <p className="text-xs text-slate-400 truncate mt-0.5">{l.notes}</p>}
                </div>
                <button onClick={() => deleteLog(l.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {!showForm && (
              <button onClick={() => setShowForm(true)}
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
              <BarChart data={last14} margin={{ left: -20, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`${v} dk`, "Süre"]} />
                <Bar dataKey="dakika" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-slate-400 text-center mt-2">WHO, haftada 150 dk orta yoğunluklu egzersiz önerir</p>
          </div>
        )}

        {/* Tips view */}
        {view === "tips" && (
          <div className="space-y-3">
            {TIPS.map((tip, i) => (
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
              <p className="text-xs text-amber-600">Egzersiz programına başlamadan önce mutlaka onkoloji ekibinizle görüşün. Her hastanın durumu farklıdır.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
