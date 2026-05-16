import { useState, useRef, useEffect } from "react";
import { Heart, Send, Trash2, Bot, User, RefreshCw } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Message {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Merhaba. Ben Umut. Bu platformda, sevdiklerinizi kanser nedeniyle kaybetmiş bireylere eşlik etmek için buradayım.\n\nBurası sizin için güvenli bir alan — istediğinizi paylaşabilir, hiçbir şeyi paylaşmak zorunda değilsiniz. Dinliyorum.",
};

const SUGGESTIONS = [
  "Kayıptan sonra nasıl başa çıkabilirim?",
  "Sürekli suçluluk hissediyorum",
  "Acımı anlatmak istiyorum",
  "Ailemdeki diğer kişiler nasıl destek verebilir?",
];

async function sendMessage(messages: Message[]): Promise<string> {
  const res = await fetch(`${BASE}/api/grief-support`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Hata oluştu");
  }
  const data = (await res.json()) as { reply: string };
  return data.reply;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-rose-400/70 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function AssistantBubble({ content, error }: { content: string; error?: boolean }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center">
        <Heart className="w-4 h-4 text-rose-500 fill-rose-200" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-rose-400/80 mb-1 tracking-wide uppercase">Umut</p>
        <div
          className={`rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] ${
            error
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-rose-50/80 border border-rose-100 text-slate-700"
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3 items-start justify-end">
      <div className="flex-1 min-w-0 flex flex-col items-end">
        <p className="text-[11px] font-semibold text-slate-400 mb-1 tracking-wide uppercase">Siz</p>
        <div className="rounded-2xl rounded-tr-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-slate-700 text-white max-w-[85%]">
          {content}
        </div>
      </div>
      <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center">
        <User className="w-4 h-4 text-slate-500" />
      </div>
    </div>
  );
}

export default function PsikolojikDestek() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;

    const userMsg: Message = { role: "user", content: q };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const userMessages = next.filter((m) => !m.error);
      const reply = await sendMessage(userMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Şu an yanıt veremiyorum. Lütfen birkaç dakika sonra tekrar deneyin.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] bg-gradient-to-br from-rose-50/40 via-white to-purple-50/30">
      {/* Header */}
      <div className="shrink-0 border-b border-rose-100/80 bg-white/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-md shadow-rose-200">
              <Heart className="w-5 h-5 text-white fill-white/40" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Psikolojik Destek</h1>
              <p className="text-xs text-slate-400">Umut · Empatik Yapay Zeka Danışmanı</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
            title="Sohbeti sıfırla"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Yeni Sohbet
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="shrink-0 bg-amber-50/80 border-b border-amber-100 px-6 py-2">
        <p className="text-[11px] text-amber-700 text-center max-w-3xl mx-auto">
          Bu araç psikolojik destek amaçlıdır; profesyonel terapi veya tıbbi tavsiyenin yerini tutmaz. Acil
          durumlarda <strong>182 İntihar Önleme Hattı</strong>'nı arayın.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((msg, i) =>
            msg.role === "assistant" ? (
              <AssistantBubble key={i} content={msg.content} error={msg.error} />
            ) : (
              <UserBubble key={i} content={msg.content} />
            )
          )}

          {loading && (
            <div className="flex gap-3 items-start">
              <div className="shrink-0 w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-200" />
              </div>
              <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-rose-50/80 border border-rose-100">
                <TypingDots />
              </div>
            </div>
          )}

          {/* Quick suggestions */}
          {showSuggestions && (
            <div className="pt-2">
              <p className="text-xs text-slate-400 mb-3 text-center">Başlamak için bir konu seçebilir ya da kendi düşüncelerinizi yazabilirsiniz</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-rose-100 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 transition-all shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-rose-100/80 bg-white/90 backdrop-blur-sm px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Düşüncelerinizi buraya yazın..."
            disabled={loading}
            className="flex-1 resize-none rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 disabled:opacity-50 min-h-[46px] max-h-[140px] overflow-y-auto leading-relaxed shadow-sm"
            style={{ height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="shrink-0 w-11 h-11 rounded-full bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-md shadow-rose-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 text-center mt-2">
          Enter ile gönder · Shift+Enter satır atla
        </p>
      </div>
    </div>
  );
}
