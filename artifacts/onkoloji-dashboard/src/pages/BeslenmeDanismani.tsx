import { useState, useRef, useEffect } from "react";
import { Salad, Send, RefreshCw, ChevronDown } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CANCER_TYPES = [
  "Belirtmek istemiyorum",
  "Meme Kanseri",
  "Akciğer Kanseri",
  "Kolon/Kolorektal Kanser",
  "Prostat Kanseri",
  "Mide Kanseri",
  "Karaciğer Kanseri",
  "Lösemi",
  "Lenfoma",
  "Over Kanseri",
  "Pankreas Kanseri",
  "Mesane Kanseri",
  "Tiroid Kanseri",
  "Cilt Kanseri (Melanom)",
  "Beyin Tümörü",
  "Böbrek Kanseri",
];

const TREATMENT_PHASES = [
  "Belirtmek istemiyorum",
  "Teşhis öncesi / tarama aşaması",
  "Kemoterapi sürecinde",
  "Radyoterapi sürecinde",
  "Cerrahi sonrası iyileşme",
  "Remisyon (hastalık kontrol altında)",
  "Bakımsal tedavi",
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

const makeWelcome = (cancer: string, phase: string): Message => ({
  role: "assistant",
  content: `Merhaba! Ben BeslenmeBot — kanser sürecinde beslenme konusunda size rehberlik etmek için buradayım.\n\n${
    cancer !== "Belirtmek istemiyorum" ? `Kanser türünüz: **${cancer}**\n` : ""
  }${
    phase !== "Belirtmek istemiyorum" ? `Tedavi aşamanız: **${phase}**\n\n` : "\n"
  }Beslenme hakkında ne merak ediyorsunuz?`,
});

async function sendMessage(messages: Message[], cancerType: string): Promise<string> {
  const res = await fetch(`${BASE}/api/nutrition-advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      cancerType: cancerType !== "Belirtmek istemiyorum" ? cancerType : undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Hata");
  }
  return ((await res.json()) as { reply: string }).reply;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function BeslenmeDanismani() {
  const [cancer, setCancer] = useState(CANCER_TYPES[0]);
  const [phase, setPhase] = useState(TREATMENT_PHASES[0]);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function startChat() {
    setMessages([makeWelcome(cancer, phase)]);
    setStarted(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  function reset() {
    setStarted(false);
    setMessages([]);
    setInput("");
    setCancer(CANCER_TYPES[0]);
    setPhase(TREATMENT_PHASES[0]);
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await sendMessage(next.filter((m) => !m.error), cancer);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Şu an yanıt veremiyorum. Lütfen tekrar deneyin.", error: true },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  const showSuggestions = started && messages.length === 1 && !loading;

  if (!started) {
    return (
      <div className="flex flex-col h-[calc(100vh-52px)] bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200">
              <Salad className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Beslenme Danışmanı</h1>
              <p className="text-xs text-slate-400">Kanser türünüze özel beslenme rehberi</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Kanser Türü</label>
              <div className="relative">
                <select
                  value={cancer}
                  onChange={(e) => setCancer(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 pr-8"
                >
                  {CANCER_TYPES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Tedavi Aşaması</label>
              <div className="relative">
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 pr-8"
                >
                  {TREATMENT_PHASES.map((p) => <option key={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={startChat}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors shadow-md shadow-emerald-200"
            >
              Başla
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-3">
            Bilgiler kişisel sağlık kararı niteliği taşımaz; diyetisyeninizle çalışın.
          </p>
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
              <Salad className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">Beslenme Danışmanı</h1>
              <p className="text-[11px] text-slate-400">
                {cancer !== "Belirtmek istemiyorum" ? cancer : "Genel"} ·{" "}
                {phase !== "Belirtmek istemiyorum" ? phase : "Tüm aşamalar"}
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Yeniden Başla
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((msg, i) =>
            msg.role === "assistant" ? (
              <div key={i} className="flex gap-3 items-start">
                <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                  <Salad className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-emerald-500/80 mb-1 tracking-wide uppercase">BeslenmeBot</p>
                  <div className={`rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] ${
                    msg.error ? "bg-red-50 border border-red-200 text-red-700" : "bg-emerald-50/80 border border-emerald-100 text-slate-700"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-3 items-start justify-end">
                <div className="flex-1 min-w-0 flex flex-col items-end">
                  <p className="text-[11px] font-semibold text-slate-400 mb-1 tracking-wide uppercase">Siz</p>
                  <div className="rounded-2xl rounded-tr-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-slate-700 text-white max-w-[85%]">
                    {msg.content}
                  </div>
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
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-emerald-100 bg-white hover:bg-emerald-50 hover:border-emerald-200 text-slate-600 transition-all shadow-sm"
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
      <div className="shrink-0 border-t border-emerald-100/80 bg-white/90 backdrop-blur-sm px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Beslenme sorunuzu yazın..."
            disabled={loading}
            className="flex-1 resize-none rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50 min-h-[46px] max-h-[140px] overflow-y-auto leading-relaxed shadow-sm"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
            }}
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
    </div>
  );
}
