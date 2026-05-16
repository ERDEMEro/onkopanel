import { useState, useRef, useEffect } from "react";
import {
  Bot, User, Send, Trash2, ChevronDown, ChevronUp,
  ShieldAlert, Sparkles, Database,
} from "lucide-react";
import { useLang } from "@/context/LanguageContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

async function askAi(question: string): Promise<{ answer: string; sources: Source[] }> {
  const res = await fetch(`${BASE}/api/ai-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Hata");
  }
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
      {source.ozet && (
        <p className="text-muted-foreground truncate">{source.ozet}</p>
      )}
    </div>
  );
}

function AssistantMessage({
  msg,
  a,
}: {
  msg: Message;
  a: ReturnType<typeof useLang>["t"]["aiAssistant"];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Bot className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-muted-foreground mb-1">{a.assistant}</p>
        <div
          className={`rounded-xl rounded-tl-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            msg.error
              ? "bg-destructive/10 border border-destructive/30 text-destructive"
              : "bg-muted/60 border border-border/50"
          }`}
        >
          {msg.content}
        </div>

        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Database className="w-3 h-3" />
              {msg.sources.length} {a.sourcesLabel}
              {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {open && (
              <div className="mt-2 space-y-1.5">
                {msg.sources.map((s, i) => (
                  <SourceCard key={i} source={s} a={a} />
                ))}
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const { answer, sources } = await askAi(q);
      setMessages((prev) => [...prev, { role: "assistant", content: answer, sources }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: a.errorMsg, error: true },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4" style={{ minHeight: "calc(100vh - 44px)" }}>
      {/* Header */}
      <div className="anim-fsu" style={{ animationDelay: "0ms" }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-3 h-3" />
            {a.badge}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{a.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{a.subtitle}</p>
      </div>

      {/* Warning */}
      <div className="flex gap-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 anim-fsu" style={{ animationDelay: "60ms" }}>
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{a.warning}</span>
      </div>

      {/* Example questions */}
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
                    {[0, 1, 2].map((k) => (
                      <span
                        key={k}
                        className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                        style={{ animationDelay: `${k * 0.15}s` }}
                      />
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
            onChange={(e) => setInput(e.target.value)}
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

      {/* Clear button */}
      {messages.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setMessages([])}
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
