import { useState, useRef, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { Bot, Send, User2, CheckCircle2, Loader2, AlertCircle, ClipboardList, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ExtractedCase {
  gender?: string | null;
  birthDate?: string | null;
  age?: number | null;
  department?: string | null;
  admissionDate?: string | null;
  diagnosis?: string | null;
  medications?: string | null;
  procedures?: string | null;
  hasGeneticTest?: boolean;
  admissionType?: string | null;
  arrivalType?: string | null;
  deathStatus?: boolean;
  notes?: string | null;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Merhaba! Ben OnkoPanel vaka kayıt asistanınızım. Yeni bir hasta vakasını birlikte kayıt altına alalım.\n\nÖnce başlayalım: Hastanın cinsiyeti ve yaklaşık yaşı nedir?",
};

export default function VakaDoldur() {
  const { user, isLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedCase | null>(null);
  const [readyToSave, setReadyToSave] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user?.isDoctor) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center px-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Erişim Kısıtlı</h2>
        <p className="text-muted-foreground">Bu sayfa yalnızca doktor hesaplarına açıktır.</p>
      </div>
    );
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/cases/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "AI yanıt vermedi.");

      const assistantMsg: Message = { role: "assistant", content: data.reply ?? "" };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);

      if (data.reply?.includes("Vakayı Kaydet")) {
        setReadyToSave(true);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setSending(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const extractRes = await fetch("/api/cases/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages }),
      });
      const extractData = await extractRes.json() as { extracted?: ExtractedCase; error?: string };
      if (!extractRes.ok) throw new Error(extractData.error ?? "Veri çıkarma başarısız.");

      const extracted = extractData.extracted ?? {};
      setExtractedData(extracted);

      const saveRes = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...extracted, rawConversation: messages }),
      });
      if (!saveRes.ok) {
        const errData = await saveRes.json() as { error?: string };
        throw new Error(errData.error ?? "Kayıt başarısız.");
      }

      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setMessages([INITIAL_MESSAGE]);
    setExtractedData(null);
    setSaved(false);
    setReadyToSave(false);
    setError("");
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (saved && extractedData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">Vaka Başarıyla Kaydedildi!</h2>
          <p className="text-green-700 dark:text-green-400 mb-6">Hasta vakası veritabanına eklendi.</p>

          <div className="bg-white dark:bg-background rounded-xl border p-5 text-left mb-6 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Kaydedilen Bilgiler
            </h3>
            {[
              ["Cinsiyet", extractedData.gender],
              ["Yaş", extractedData.age],
              ["Bölüm", extractedData.department],
              ["Tanı", extractedData.diagnosis],
              ["İlaçlar", extractedData.medications],
              ["İşlemler", extractedData.procedures],
              ["Genetik Test", extractedData.hasGeneticTest ? "Evet" : "Hayır"],
              ["Başvuru Tipi", extractedData.admissionType],
              ["Geliş Tipi", extractedData.arrivalType],
            ].filter(([, v]) => v != null && v !== "").map(([label, value]) => (
              <div key={label as string} className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-32 shrink-0">{label as string}:</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>

          <Button onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Yeni Vaka Ekle
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-80px)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Vaka Doldur</h1>
          <p className="text-sm text-muted-foreground">AI asistan ile yeni hasta vakası kayıt</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          Doktor Modu
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border bg-muted/20 p-4 space-y-4 mb-4 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-background border text-foreground"
            }`}>
              {msg.role === "user" ? <User2 className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-background border shadow-sm rounded-tl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-background border flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-background border shadow-sm rounded-2xl rounded-tl-sm px-4 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2 mb-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {readyToSave && !saved && (
        <div className="mb-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Kaydediliyor..." : "Vakayı Kaydet"}
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mesajınızı yazın..."
          disabled={sending || saved}
          className="flex-1"
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim() || sending || saved}
          size="icon"
          className="shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
