import { useState, useEffect } from "react";
import { AlertTriangle, Shield, AlertCircle, RefreshCw, Users, ChevronDown, ChevronUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PatientPriority {
  clientId: string;
  hastaNo: string;
  cinsiyet: string;
  age: number | null;
  department: string;
  score: number;
  flags: string[];
  isDeceased: boolean;
}

interface PriorityData {
  critical: PatientPriority[];
  high: PatientPriority[];
  moderate: PatientPriority[];
  total: number;
}

async function fetchPriorities(): Promise<PriorityData> {
  const res = await fetch(`${BASE}/api/priority-panel`);
  if (!res.ok) throw new Error("Öncelik verileri alınamadı");
  return res.json();
}

function RiskBadge({ level }: { level: "critical" | "high" | "moderate" }) {
  const cfg = {
    critical: { label: "Kritik", bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: <AlertTriangle className="w-3 h-3" /> },
    high: { label: "Yüksek", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", icon: <AlertCircle className="w-3 h-3" /> },
    moderate: { label: "Orta", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: <Shield className="w-3 h-3" /> },
  }[level];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function PatientCard({ p, level }: { p: PatientPriority; level: "critical" | "high" | "moderate" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white rounded-xl border px-4 py-3 shadow-sm ${
      level === "critical" ? "border-red-200" : level === "high" ? "border-orange-200" : "border-amber-100"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <RiskBadge level={level} />
          <span className="text-sm font-semibold text-slate-800 truncate">#{p.hastaNo}</span>
          <span className="text-xs text-slate-500 truncate">{p.department}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-sm font-bold ${level === "critical" ? "text-red-600" : level === "high" ? "text-orange-500" : "text-amber-600"}`}>
            {p.score}p
          </span>
          <button onClick={() => setOpen((v) => !v)} className="text-slate-400 hover:text-slate-600 transition-colors">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-2 pt-2 border-t border-slate-50 space-y-1">
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
            <span>Cinsiyet: <strong className="text-slate-700">{p.cinsiyet || "—"}</strong></span>
            {p.age && <span>Yaş: <strong className="text-slate-700">{p.age}</strong></span>}
          </div>
          {p.flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {p.flags.map((f, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{f}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title, patients, level, icon,
}: {
  title: string;
  patients: PatientPriority[];
  level: "critical" | "high" | "moderate";
  icon: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  if (patients.length === 0) return null;
  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full text-left mb-2"
      >
        {icon}
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <span className="text-xs text-slate-400">({patients.length})</span>
        <span className="ml-auto text-slate-400">{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </button>
      {expanded && (
        <div className="space-y-2">
          {patients.map((p) => <PatientCard key={p.clientId} p={p} level={level} />)}
        </div>
      )}
    </div>
  );
}

export default function OncelikPaneli() {
  const [data, setData] = useState<PriorityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const d = await fetchPriorities();
      setData(d);
    } catch (e) {
      setError("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-[calc(100vh-52px)] bg-gradient-to-br from-red-50/20 via-white to-orange-50/20 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shadow-md shadow-red-200">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Hasta Öncelik Paneli</h1>
              <p className="text-xs text-slate-400">YZ tabanlı risk skorlaması · Klinik takip için</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-md hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Yenile
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-5 flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Risk skoru; klinik notlardaki anahtar kelimelere (metastaz, acil, nötropeni vb.) ve hasta özelliklerine dayanır. Kesin klinik karar için hasta dosyasını inceleyiniz.
          </p>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { label: "Toplam", value: data.total, color: "text-slate-700" },
              { label: "Kritik", value: data.critical.length, color: "text-red-600" },
              { label: "Yüksek", value: data.high.length, color: "text-orange-500" },
              { label: "Orta", value: data.moderate.length, color: "text-amber-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-3 text-center shadow-sm">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[11px] text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        )}

        {error && (
          <div className="text-center py-10">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button onClick={load} className="text-xs text-slate-500 hover:underline flex items-center gap-1 mx-auto">
              <RefreshCw className="w-3.5 h-3.5" /> Tekrar dene
            </button>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-5">
            <Section
              title="Kritik Risk"
              patients={data.critical}
              level="critical"
              icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
            />
            <Section
              title="Yüksek Risk"
              patients={data.high}
              level="high"
              icon={<AlertCircle className="w-4 h-4 text-orange-500" />}
            />
            <Section
              title="Orta Risk"
              patients={data.moderate}
              level="moderate"
              icon={<Shield className="w-4 h-4 text-amber-500" />}
            />

            {data.total === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Risk faktörü tespit edilen hasta bulunamadı</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
