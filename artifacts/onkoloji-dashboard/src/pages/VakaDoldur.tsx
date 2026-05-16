import { useState, useRef, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
import {
  Bot, Send, User2, CheckCircle2, Loader2, AlertCircle,
  ClipboardList, RotateCcw, PenLine, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Merhaba! Ben OnkoPanel vaka kayıt asistanınızım. Yeni bir hasta vakasını birlikte kayıt altına alalım.\n\nÖnce başlayalım: Hastanın cinsiyeti ve yaklaşık yaşı nedir?",
};

const DEPARTMENTS = [
  "Medikal Onkoloji", "Radyasyon Onkolojisi", "Cerrahi Onkoloji",
  "Pediatrik Onkoloji", "Hematoloji", "Nöro-Onkoloji", "Diğer",
];
const ADMISSION_TYPES = ["Ayakta", "Yatarak", "Günübirlik"];
const ARRIVAL_TYPES   = ["Genel muayene", "Medikal tedavi", "Acil muayene", "Ameliyat", "Kontrol", "Diğer"];
const HOSPIT_TYPES    = ["Ameliyat", "Medikal tedavi", "Acil yatış", "Günübirlik tedavi", "Diğer"];

// ─── Success Card ─────────────────────────────────────────────────────────────

function SuccessCard({
  extractedData,
  onReset,
}: {
  extractedData: ExtractedCase | null;
  onReset: () => void;
}) {
  const rows = extractedData
    ? [
        ["Cinsiyet", extractedData.gender],
        ["Yaş", extractedData.age],
        ["Bölüm", extractedData.department],
        ["Tanı", extractedData.diagnosis],
        ["İlaçlar", extractedData.medications],
        ["İşlemler", extractedData.procedures],
        ["Genetik Test", extractedData.hasGeneticTest ? "Evet" : null],
        ["Başvuru Tipi", extractedData.admissionType],
        ["Geliş Tipi", extractedData.arrivalType],
        ["Notlar", extractedData.notes],
      ].filter(([, v]) => v != null && v !== "")
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
          Vaka Başarıyla Kaydedildi!
        </h2>
        <p className="text-green-700 dark:text-green-400 mb-6">
          Hasta vakası veritabanına eklendi.
        </p>

        {rows.length > 0 && (
          <div className="bg-white dark:bg-background rounded-xl border p-5 text-left mb-6 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Kaydedilen Bilgiler
            </h3>
            {rows.map(([label, value]) => (
              <div key={label as string} className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-36 shrink-0">{label as string}:</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        <Button onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Yeni Vaka Ekle
        </Button>
      </div>
    </div>
  );
}

// ─── AI Chat Mode ─────────────────────────────────────────────────────────────

function AiChatMode({ onSaved }: { onSaved: (data: ExtractedCase) => void }) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [readyToSave, setReadyToSave] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSending(true);
    setError("");
    try {
      const res  = await fetch(`${BASE}/api/cases/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "AI yanıt vermedi.");
      const assistantMsg: Message = { role: "assistant", content: data.reply ?? "" };
      const updated = [...newMessages, assistantMsg];
      setMessages(updated);
      if (data.reply?.includes("Vakayı Kaydet")) setReadyToSave(true);
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
      const extractRes = await fetch(`${BASE}/api/cases/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages }),
      });
      const extractData = await extractRes.json() as { extracted?: ExtractedCase; error?: string };
      if (!extractRes.ok) throw new Error(extractData.error ?? "Veri çıkarma başarısız.");
      const extracted = extractData.extracted ?? {};

      const saveRes = await fetch(`${BASE}/api/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...extracted, rawConversation: messages }),
      });
      if (!saveRes.ok) {
        const errData = await saveRes.json() as { error?: string };
        throw new Error(errData.error ?? "Kayıt başarısız.");
      }
      onSaved(extracted);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto rounded-xl border bg-muted/20 p-4 space-y-4 mb-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border text-foreground"
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

      {readyToSave && (
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
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Mesajınızı yazın..."
          disabled={sending || readyToSave}
        />
        <Button onClick={sendMessage} disabled={!input.trim() || sending || readyToSave} size="icon" className="shrink-0">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Manual Form Mode ─────────────────────────────────────────────────────────

const emptyForm: ExtractedCase & { admissionDate: string } = {
  gender: "",
  age: undefined,
  department: "",
  admissionDate: new Date().toISOString().slice(0, 10),
  diagnosis: "",
  medications: "",
  procedures: "",
  hasGeneticTest: false,
  admissionType: "",
  arrivalType: "",
  deathStatus: false,
  notes: "",
};

function ManualFormMode({ onSaved }: { onSaved: (data: ExtractedCase) => void }) {
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.gender || !form.age || !form.department || !form.diagnosis) {
      setError("Cinsiyet, yaş, bölüm ve tanı alanları zorunludur.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: ExtractedCase = {
        gender:        form.gender,
        age:           Number(form.age),
        department:    form.department,
        admissionDate: form.admissionDate,
        diagnosis:     form.diagnosis,
        medications:   form.medications || null,
        procedures:    form.procedures || null,
        hasGeneticTest: !!form.hasGeneticTest,
        admissionType: form.admissionType || null,
        arrivalType:   form.arrivalType || null,
        deathStatus:   !!form.deathStatus,
        notes:         form.notes || null,
      };
      const res = await fetch(`${BASE}/api/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...payload, rawConversation: [] }),
      });
      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? "Kayıt başarısız.");
      }
      onSaved(payload);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  const labelCls = "block text-xs font-medium text-muted-foreground mb-1";
  const inputCls = "w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40";
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1">
      {/* Row 1: cinsiyet + yaş + tarih */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Cinsiyet *</label>
          <select className={selectCls} value={form.gender ?? ""} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Seçin</option>
            <option value="Erkek">Erkek</option>
            <option value="Kadın">Kadın</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Yaş *</label>
          <input
            type="number" min={0} max={120}
            className={inputCls}
            value={form.age ?? ""}
            onChange={(e) => set("age", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="örn. 54"
          />
        </div>
        <div>
          <label className={labelCls}>Başvuru Tarihi</label>
          <input
            type="date"
            className={inputCls}
            value={form.admissionDate}
            onChange={(e) => set("admissionDate", e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: bölüm */}
      <div>
        <label className={labelCls}>Bölüm / Departman *</label>
        <select className={selectCls} value={form.department ?? ""} onChange={(e) => set("department", e.target.value)}>
          <option value="">Seçin</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Row 3: tanı */}
      <div>
        <label className={labelCls}>Tanı / Diagnosis *</label>
        <input
          type="text"
          className={inputCls}
          value={form.diagnosis ?? ""}
          onChange={(e) => set("diagnosis", e.target.value)}
          placeholder="örn. Meme kanseri, evre III"
        />
      </div>

      {/* Row 4: geliş / başvuru / yatış tipi */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Geliş Tipi</label>
          <select className={selectCls} value={form.admissionType ?? ""} onChange={(e) => set("admissionType", e.target.value)}>
            <option value="">Seçin</option>
            {ADMISSION_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Başvuru Tipi</label>
          <select className={selectCls} value={form.arrivalType ?? ""} onChange={(e) => set("arrivalType", e.target.value)}>
            <option value="">Seçin</option>
            {ARRIVAL_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Yatış Tipi</label>
          <select className={selectCls} value={form.procedures ?? ""} onChange={(e) => set("procedures", e.target.value)}>
            <option value="">Seçin</option>
            {HOSPIT_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
      </div>

      {/* Row 5: ilaçlar + işlemler */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>İlaçlar / Tedaviler</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={form.medications ?? ""}
            onChange={(e) => set("medications", e.target.value)}
            placeholder="örn. Trastuzumab, Kapesitabin"
          />
        </div>
        <div>
          <label className={labelCls}>Uygulanan İşlemler</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={form.procedures ?? ""}
            onChange={(e) => set("procedures", e.target.value)}
            placeholder="örn. Lumpektomi, kemoterapi"
          />
        </div>
      </div>

      {/* Row 6: notlar */}
      <div>
        <label className={labelCls}>Notlar / Ek Bilgi</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Klinik notlar, önemli bulgular..."
        />
      </div>

      {/* Row 7: toggleler */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => set("hasGeneticTest", !form.hasGeneticTest)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${
              form.hasGeneticTest ? "bg-primary" : "bg-muted"
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
              form.hasGeneticTest ? "translate-x-4" : "translate-x-0"
            }`} />
          </div>
          <span className="text-sm font-medium">Genetik Test Yapıldı</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => set("deathStatus", !form.deathStatus)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${
              form.deathStatus ? "bg-destructive" : "bg-muted"
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
              form.deathStatus ? "translate-x-4" : "translate-x-0"
            }`} />
          </div>
          <span className="text-sm font-medium">Ölüm Kaydı</span>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" disabled={saving} className="w-full gap-2" size="lg">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {saving ? "Kaydediliyor..." : "Vakayı Kaydet"}
      </Button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VakaDoldur() {
  const { user, isLoading } = useAuth();
  const [mode, setMode]     = useState<"ai" | "manual">("ai");
  const [saved, setSaved]   = useState(false);
  const [savedData, setSavedData] = useState<ExtractedCase | null>(null);

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

  if (saved) {
    return (
      <SuccessCard
        extractedData={savedData}
        onReset={() => { setSaved(false); setSavedData(null); }}
      />
    );
  }

  function handleSaved(data: ExtractedCase) {
    setSavedData(data);
    setSaved(true);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100dvh-80px)]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Vaka Doldur</h1>
          <p className="text-sm text-muted-foreground">Yeni hasta vakası kayıt</p>
        </div>
        <Badge variant="secondary" className="ml-auto">Doktor Modu</Badge>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted border mb-4 shrink-0">
        <button
          onClick={() => setMode("ai")}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition-all ${
            mode === "ai"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Asistan
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition-all ${
            mode === "manual"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PenLine className="w-3.5 h-3.5" />
          Manuel Giriş
        </button>
      </div>

      {mode === "ai"
        ? <AiChatMode onSaved={handleSaved} />
        : <ManualFormMode onSaved={handleSaved} />
      }
    </div>
  );
}
