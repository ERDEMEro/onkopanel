import { useState, useRef, useEffect } from "react";
import { Users, Send, RefreshCw, Heart, BookOpen, History, Clock, Trash2, X, Bot } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const CURRENT_KEY = "onko_chat_bakici_current";
const HISTORY_KEY = "onko_chat_bakici_history";

interface Message {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

interface Session {
  id: string;
  date: string;
  preview: string;
  messages: Message[];
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Merhaba. Ben Umut Rehberi — sevdiklerinize kanser sürecinde nasıl destek olabileceğinizi birlikte düşünmek için buradayım.\n\nBakıcı olmak hem zorlu hem de çok değerli bir rol. Kafanızdaki soru nedir?",
};

const SUGGESTIONS = [
  "Kemoterapi sürecinde nasıl yardımcı olabilirim?",
  "Hastama ne söylemeli, ne söylememeli?",
  "Kendimi nasıl koruyabilirim, tükenmişlik hissediyorum",
  "Çocuklara durumu nasıl anlatabilirim?",
  "Doktor randevularında nasıl destek olabilirim?",
  "Günlük yaşamda pratik yardım önerileri",
];

function loadCurrent(): Message[] {
  try { const s = localStorage.getItem(CURRENT_KEY); if (s) return JSON.parse(s); } catch {}
  return [WELCOME];
}
function loadHistory(): Session[] {
  try { const s = localStorage.getItem(HISTORY_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
}

async function sendMessage(messages: Message[]): Promise<string> {
  const res = await fetch(`${BASE}/api/caregiver-support`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })) }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as { error?: string }).error ?? "Hata"); }
  return ((await res.json()) as { reply: string }).reply;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400/70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

export default function BakiciRehberi() {
  const [messages, setMessages] = useState<Message[]>(loadCurrent);
  const [history, setHistory] = useState<Session[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { localStorage.setItem(CURRENT_KEY, JSON.stringify(messages)); }, [messages]);

  function archiveAndReset() {
    const userMsgs = messages.filter(m => m.role === "user");
    if (userMsgs.length > 0) {
      const session: Session = {
        id: Date.now().toString(),
        date: new Date().toLocaleString("tr-TR"),
        preview: userMsgs[0].content.slice(0, 80),
        messages: [...messages],
      };
      const updated = [session, ...history].slice(0, 15);
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    }
    setMessages([WELCOME]);
    setInput("");
    setShowHistory(false);
  }

  function loadSession(session: Session) {
    setMessages(session.messages);
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
      const reply = await sendMessage(next.filter(m => !m.error));
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

  const showSuggestions = messages.length === 1 && !loading && !showHistory;

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30">
      {/* Header */}
      <div className="shrink-0 border-b border-blue-100 bg-white/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Bakıcı & Aile Rehberi</h1>
              <p className="text-xs text-slate-400">Umut Rehberi · Hasta yakınları için destek</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(v => !v)}
              className={`flex items-center gap-1.5 text-xs transition-colors px-2.5 py-1.5 rounded-lg border ${showHistory ? "bg-blue-50 border-blue-200 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
            >
              <History className="w-3.5 h-3.5" />
              Geçmiş {history.length > 0 && <span className="bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{history.length}</span>}
            </button>
            <button
              onClick={archiveAndReset}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Yeni Sohbet
            </button>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="shrink-0 bg-blue-50/80 border-b border-blue-100 px-6 py-2">
        <p className="text-[11px] text-blue-700 text-center max-w-3xl mx-auto">
          Bu araç genel rehberlik sunar. Tıbbi kararlar için mutlaka sağlık ekibiyle iletişime geçin.
        </p>
      </div>

      {/* Messages or History */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {showHistory ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" /> Sohbet Geçmişi
              </h2>
              <button onClick={() => setShowHistory(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Henüz kaydedilmiş sohbet yok.</p>
                <p className="text-xs mt-1">Yeni Sohbet başlatıldığında mevcut konuşma buraya kaydedilir.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(session => (
                  <div
                    key={session.id}
                    onClick={() => loadSession(session)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && loadSession(session)}
                    className="w-full text-left rounded-xl border border-blue-100 bg-white hover:bg-blue-50 hover:border-blue-200 px-4 py-3 transition-all shadow-sm group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate font-medium">{session.preview}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {session.date} · {session.messages.filter(m => m.role === "user").length} mesaj
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all"
                      >
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
            {messages.map((msg, i) =>
              msg.role === "assistant" ? (
                <div key={i} className="flex gap-3 items-start">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-blue-400/80 mb-1 tracking-wide uppercase">Umut Rehberi</p>
                    <div className={`rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] ${msg.error ? "bg-red-50 border border-red-200 text-red-700" : "bg-blue-50/80 border border-blue-100 text-slate-700"}`}>
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
                  <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center">
                    <Users className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              )
            )}
            {loading && (
              <div className="flex gap-3 items-start">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-blue-500" />
                </div>
                <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-blue-50/80 border border-blue-100">
                  <TypingDots />
                </div>
              </div>
            )}
            {showSuggestions && (
              <div className="pt-2">
                <p className="text-xs text-slate-400 mb-3 text-center flex items-center justify-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Sık sorulan konulardan birini seçebilirsiniz
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)} className="text-left text-sm px-4 py-3 rounded-xl border border-blue-100 bg-white hover:bg-blue-50 hover:border-blue-200 text-slate-600 transition-all shadow-sm">{s}</button>
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
        <div className="shrink-0 border-t border-blue-100/80 bg-white/90 backdrop-blur-sm px-6 py-4">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              placeholder="Sorunuzu ya da endişenizi yazın..."
              disabled={loading}
              className="flex-1 resize-none rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 disabled:opacity-50 min-h-[46px] max-h-[140px] overflow-y-auto leading-relaxed shadow-sm"
              onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 140)}px`; }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="shrink-0 w-11 h-11 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-md shadow-blue-200"
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
