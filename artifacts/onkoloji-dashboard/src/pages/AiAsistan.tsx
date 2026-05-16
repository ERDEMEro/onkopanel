import { useState, useRef, useEffect } from "react";
import {
  Bot, User, Send, Trash2, ChevronDown, ChevronUp,
  ShieldAlert, Sparkles, Database, History, Clock, X,
} from "lucide-react";
import { useLang } from "@/context/LanguageContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const CURRENT_KEY = "onko_chat_asistan_current";
const HISTORY_KEY = "onko_chat_asistan_history";

interface Source {
  hastaNo: string;
  cinsiyet: string;
  department: string;
  ozet: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  error?: boolean;
}

interface Session {
  id: string;
  date: string;
  preview: string;
  messages: Message[];
}

function loadCurrent(): Message[] {
  try { const s = localStorage.getItem(CURRENT_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
}
function loadHistory(): Session[] {
  try { const s = localStorage.getItem(HISTORY_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
}

async function askAi(question: string): Promise<{ answer: string; sources: Source[] }> {
  const res = await fetch(`${BASE}/api/ai-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as { error?: string }).error ?? "Hata"); }
  return res.json();
}

function SourceCard({ source, a }: { source: Source; a: ReturnType<typeof useLang>["t"]["aiAssistant"] }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs space-y-0.5">
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-muted-foreground">
        <span><span className="font-medium text-foreground">{a.hastaNo}:</span> {source.hastaNo}</span>
        <span><span className="font-medium text-foreground">{a.cinsiyet}:</span> {source.cinsiyet}</span>
        <span><span className="font-medium text-foreground">{a.department}:</span> {source.department}</span>
      </div>
      {source.ozet && <p className="text-muted-foreground truncate">{source.ozet}</p>}
    </div>
  );
}

function AssistantMessage({ msg, a }: { msg: Message; a: ReturnType<typeof useLang>["t"]["aiAssistant"] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Bot className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-muted-foreground mb-1">{a.assistant}</p>
        <div className={`rounded-xl rounded-tl-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.error ? "bg-destructive/10 border border-destructive/30 text-destructive" : "bg-muted/60 border border-border/50"}`}>
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-2">
            <button onClick={() => setOpen(v => !v)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Database className="w-3 h-3" />
              {msg.sources.length} {a.sourcesLabel}
              {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {open && (
              <div className="mt-2 space-y-1.5">
                {msg.sources.map((s, i) => <SourceCard key={i} source={s} a={a} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiAsistan() {
  const { t } = useLang();
  const a = t.aiAssistant;

  const [messages, setMessages] = useState<Message[]>(loadCurrent);
  const [history, setHistory] = useState<Session[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { localStorage.setItem(CURRENT_KEY, JSON.stringify(messages)); }, [messages]);

  function archiveAndNew() {
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
    setMessages([]);
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

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const { answer, sources } = await askAi(q);
      setMessages(prev => [...prev, { role: "assistant", content: answer, sources }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: a.errorMsg, error: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4" style={{ minHeight: "calc(100vh - 44px)" }}>
      {/* Header */}
      <div className="anim-fsu" style={{ animationDelay: "0ms" }}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-3 h-3" />
            {a.badge}
          </span>
          <button
            onClick={() => setShowHistory(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${showHistory ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <History className="w-3.5 h-3.5" />
            Sohbet Geçmişi {history.length > 0 && <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{history.length}</span>}
          </button>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{a.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{a.subtitle}</p>
      </div>

      {/* Warning */}
      <div className="flex gap-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 anim-fsu" style={{ animationDelay: "60ms" }}>
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{a.warning}</span>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="rounded-xl border bg-card shadow-sm p-5 anim-fsu" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Kaydedilmiş Sohbetler
            </h2>
            <button onClick={() => setShowHistory(false)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Henüz kaydedilmiş sohbet yok.</p>
              <p className="text-xs mt-1 text-muted-foreground/70">Yeni Sohbet açıldığında mevcut konuşma burada görünür.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map(session => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className="w-full text-left rounded-lg border bg-background hover:bg-muted/50 px-4 py-3 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate font-medium">{session.preview}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {session.date} · {session.messages.filter(m => m.role === "user").length} soru
                      </p>
                    </div>
                    <button onClick={(e) => deleteSession(session.id, e)} className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Example questions */}
      {!showHistory && (
        <div className="anim-fsu" style={{ animationDelay: "120ms" }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{a.examplesTitle}</p>
          <div className="flex flex-wrap gap-2">
            {a.examples.map((ex, i) => (
              <button
                key={i}
                disabled={loading}
                onClick={() => send(ex)}
                className="text-xs px-3 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted hover:border-primary/40 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 rounded-xl border border-border bg-background overflow-hidden flex flex-col" style={{ minHeight: 340 }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-12">
              <Bot className="w-10 h-10 opacity-20" />
              <p className="text-sm">{a.emptyState}</p>
            </div>
          )}
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div key={i} className="flex gap-3 items-start flex-row-reverse">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col items-end">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">{a.you}</p>
                    <div className="rounded-xl rounded-tr-none bg-primary text-primary-foreground px-4 py-3 text-sm max-w-[85%]">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            }
            return <AssistantMessage key={i} msg={msg} a={a} />;
          })}
          {loading && (
            <div className="flex gap-3 items-start">
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{a.assistant}</p>
                <div className="rounded-xl rounded-tl-none bg-muted/60 border border-border/50 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                  <span className="flex gap-1">
                    {[0, 1, 2].map(k => (
                      <span key={k} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${k * 0.15}s` }} />
                    ))}
                  </span>
                  {a.thinking}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 flex gap-2 items-end bg-muted/20">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            placeholder={a.inputPlaceholder}
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 min-h-[38px] max-h-32 leading-5"
            style={{ overflowY: "auto" }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="shrink-0 h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clear / New session buttons */}
      {messages.length > 0 && (
        <div className="flex justify-end gap-3">
          <button
            onClick={archiveAndNew}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 border border-border px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <History className="w-3.5 h-3.5" />
            Kaydet & Yeni Sohbet
          </button>
          <button
            onClick={() => { setMessages([]); localStorage.removeItem(CURRENT_KEY); }}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {a.clearChat}
          </button>
        </div>
      )}
    </div>
  );
}
