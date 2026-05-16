import { useState, useEffect, useRef } from "react";
import { NotebookPen, Plus, ChevronLeft, ChevronRight, TrendingUp, Sparkles, Send, Loader2, Bot } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DayLog {
  date: string;
  pain: number;
  fatigue: number;
  appetite: number;
  mood: number;
  notes: string;
}

interface ChatMsg { role: "user" | "assistant"; content: string; }

const STORAGE_KEY = "onko_symptom_journal";
const CHAT_KEY = "onko_chat_semptom";

function loadLogs(): DayLog[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveLogs(d: DayLog[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function loadChat(): ChatMsg[] {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY) ?? "[]"); } catch { return []; }
}
function saveChat(d: ChatMsg[]) { localStorage.setItem(CHAT_KEY, JSON.stringify(d)); }

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

const STARTER_QUESTIONS = [
  "Yüksek yorgunluk skorlarımla nasıl başa çıkabilirim?",
  "Ağrı ne zaman ciddi bir belirtidir?",
  "İştahsızlık için pratik öneriler nelerdir?",
  "Ruh halimi nasıl iyileştirebilirim?",
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
  const [view, setView] = useState<"log" | "chart" | "ai">("log");
  const [showForm, setShowForm] = useState(false);
  const [chartDays, setChartDays] = useState(14);
  const [form, setForm] = useState<Omit<DayLog, "date">>({ pain: 0, fatigue: 0, appetite: 5, mood: 5, notes: "" });

  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLogs(loadLogs()); setChatMsgs(loadChat()); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

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

  async function sendChat(text: string) {
    if (!text.trim() || chatLoading) return;
    const recentLogs = logs.slice(-7);
    const contextNote = recentLogs.length > 0
      ? `Son ${recentLogs.length} günlük belirti özeti: ${recentLogs.map((l) =>
          `${fmtDate(l.date)}: Ağrı=${l.pain}, Yorgunluk=${l.fatigue}, İştah=${l.appetite}, RuhHali=${l.mood}`
        ).join(" | ")}`
      : "";
    const userMsg: ChatMsg = { role: "user", content: text.trim() };
    const updated = [...chatMsgs, userMsg];
    setChatMsgs(updated); saveChat(updated); setChatInput(""); setChatLoading(true);
    try {
      const res = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "symptom", messages: updated, context: contextNote }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      const reply: ChatMsg = { role: "assistant", content: data.reply ?? data.error ?? "Yanıt alınamadı." };
      const final = [...updated, reply];
      setChatMsgs(final); saveChat(final);
    } catch {
      const err: ChatMsg = { role: "assistant", content: "Bağlantı hatası. Lütfen tekrar deneyin." };
      const final = [...updated, err];
      setChatMsgs(final); saveChat(final);
    } finally {
      setChatLoading(false);
    }
  }

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
            {(["log", "chart", "ai"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  view === v ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v === "log" ? <NotebookPen className="w-3.5 h-3.5" /> :
                 v === "chart" ? <TrendingUp className="w-3.5 h-3.5" /> :
                 <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                {v === "log" ? "Günlük" : v === "chart" ? "Grafik" : "SemptomBot"}
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

        {/* AI Chat view */}
        {view === "ai" && (
          <div className="flex flex-col gap-3">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 flex items-center gap-3 text-white shadow-md shadow-amber-100">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">SemptomBot</p>
                <p className="text-xs text-amber-100">Belirti analizi ve başa çıkma rehberi</p>
              </div>
            </div>

            {logs.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <span className="text-xs text-amber-700">
                  Son {Math.min(logs.length, 7)} günlük verileriniz sohbet bağlamına eklendi
                </span>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: 340 }}>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 400 }}>
                {chatMsgs.length === 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 text-center">Belirtileriniz veya semptomlarınız hakkında sorun</p>
                    <div className="grid grid-cols-1 gap-2">
                      {STARTER_QUESTIONS.map((q) => (
                        <button key={q} onClick={() => sendChat(q)}
                          className="text-left text-xs bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-lg px-3 py-2.5 text-amber-700 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-amber-500 text-white rounded-br-sm"
                        : "bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-sm"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl rounded-bl-sm px-3 py-2">
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-slate-100 p-3 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendChat(chatInput); } }}
                  placeholder="Belirtileriniz hakkında sorun…"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                  disabled={chatLoading}
                />
                <button
                  onClick={() => void sendChat(chatInput)}
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-9 h-9 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 flex items-center justify-center text-white transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {chatMsgs.length > 0 && (
              <button onClick={() => { setChatMsgs([]); saveChat([]); }}
                className="text-xs text-slate-400 hover:text-slate-600 text-center transition-colors">
                Sohbeti temizle
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
