import { useState, useRef, useEffect } from "react";
import { Salad, Send, RefreshCw, ChevronDown, History, Clock, Trash2, X, Bot } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const CURRENT_KEY = "onko_chat_beslenme_current";
const HISTORY_KEY = "onko_chat_beslenme_history";

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
  "Kilo kaybını durdurmak için ne yapabilirim?",
  "Protein ihtiyacımı nasıl karşılarım?",
  "Bağışıklık sistemini destekleyen gıdalar neler?",
  "Günlük beslenme planı önerir misin?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

interface Session {
  id: string;
  date: string;
  preview: string;
  cancer: string;
  phase: string;
  messages: Message[];
}

const makeWelcome = (cancer: string, phase: string): Message => ({
  role: "assistant",
  content: `Merhaba! Ben BeslenmeBot — kanser sürecinde beslenme konusunda size rehberlik etmek için buradayım.\n\n${cancer !== "Belirtmek istemiyorum" ? `Kanser türünüz: **${cancer}**\n` : ""}${phase !== "Belirtmek istemiyorum" ? `Tedavi aşamanız: **${phase}**\n\n` : "\n"}Beslenme hakkında ne merak ediyorsunuz?`,
});

interface CurrentState { messages: Message[]; cancer: string; phase: string; started: boolean; }

function loadCurrent(): CurrentState {
  try {
    const s = localStorage.getItem(CURRENT_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return { messages: [], cancer: CANCER_TYPES[0], phase: TREATMENT_PHASES[0], started: false };
}
function loadHistory(): Session[] {
  try { const s = localStorage.getItem(HISTORY_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
}

async function sendMessage(messages: Message[], cancerType: string): Promise<string> {
  const res = await fetch(`${BASE}/api/nutrition-advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })), cancerType: cancerType !== "Belirtmek istemiyorum" ? cancerType : undefined }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as { error?: string }).error ?? "Hata"); }
  return ((await res.json()) as { reply: string }).reply;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ messages, cancer, phase, started }));
  }, [messages, cancer, phase, started]);

  function startChat() {
    const welcome = makeWelcome(cancer, phase);
    setMessages([welcome]);
    setStarted(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  function archiveAndReset() {
    const userMsgs = messages.filter(m => m.role === "user");
    if (userMsgs.length > 0) {
      const session: Session = {
        id: Date.now().toString(),
        date: new Date().toLocaleString("tr-TR"),
        preview: userMsgs[0].content.slice(0, 80),
        cancer,
        phase,
        messages: [...messages],
      };
      const updated = [session, ...history].slice(0, 15);
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    }
    setStarted(false);
    setMessages([]);
    setInput("");
    setCancer(CANCER_TYPES[0]);
    setPhase(TREATMENT_PHASES[0]);
    setShowHistory(false);
  }

  function loadSession(session: Session) {
    setMessages(session.messages);
    setCancer(session.cancer);
    setPhase(session.phase);
    setStarted(true);
    setShowHistory(false);
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = history.filter(s => s.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await sendMessage(next.filter(m => !m.error), cancer);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Şu an yanıt veremiyorum. Lütfen tekrar deneyin.", error: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  const showSuggestions = started && messages.length === 1 && !loading && !showHistory;

  if (!started) {
    return (
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

          {/* History shortcut on setup screen */}
          {history.length > 0 && (
            <button
              onClick={() => { setStarted(true); setMessages([]); setShowHistory(true); }}
              className="w-full mb-3 flex items-center justify-between px-4 py-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 hover:bg-emerald-100/60 text-sm text-emerald-700 transition-colors"
            >
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
            <button onClick={startChat} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors shadow-md shadow-emerald-200">
              Başla
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-3">Bilgiler kişisel sağlık kararı niteliği taşımaz; diyetisyeninizle çalışın.</p>
        </div>
      </div>
    );
  }

  return (
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

      {/* Messages or History */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {showHistory ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-500" /> Sohbet Geçmişi
              </h2>
              <button onClick={() => setShowHistory(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
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
                  <button
                    key={session.id}
                    onClick={() => loadSession(session)}
                    className="w-full text-left rounded-xl border border-emerald-100 bg-white hover:bg-emerald-50 hover:border-emerald-200 px-4 py-3 transition-all shadow-sm group"
                  >
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
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg, i) =>
              msg.role === "assistant" ? (
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
              ) : (
                <div key={i} className="flex gap-3 items-start justify-end">
                  <div className="flex-1 min-w-0 flex flex-col items-end">
                    <p className="text-[11px] font-semibold text-slate-400 mb-1 tracking-wide uppercase">Siz</p>
                    <div className="rounded-2xl rounded-tr-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-slate-700 text-white max-w-[85%]">{msg.content}</div>
                  </div>
                  <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500">
                    <span className="text-xs font-bold">S</span>
                  </div>
                </div>
              )
            )}
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
                    <button key={s} onClick={() => send(s)} className="text-left text-sm px-4 py-3 rounded-xl border border-emerald-100 bg-white hover:bg-emerald-50 hover:border-emerald-200 text-slate-600 transition-all shadow-sm">{s}</button>
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
              placeholder="Beslenme sorunuzu yazın..."
              disabled={loading}
              className="flex-1 resize-none rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50 min-h-[46px] max-h-[140px] overflow-y-auto leading-relaxed shadow-sm"
              onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 140)}px`; }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="shrink-0 w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-md shadow-emerald-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2">Enter ile gönder · Shift+Enter satır atla</p>
        </div>
      )}
    </div>
  );
}
