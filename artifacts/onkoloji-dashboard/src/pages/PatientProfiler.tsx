import { useState, useEffect } from "react";
import { Users, BedDouble, AlertTriangle, Scissors, Activity, FlaskConical, ClipboardList, Pill, Skull } from "lucide-react";
import { useLang } from "@/context/LanguageContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface CohortData {
  patientCount: number;
  totalPatientsOverall: number;
  avgProceduresPerPatient: number;
  hospitalizationRate: number;
  icuRate: number;
  surgeryRate: number;
  emergencyRate: number;
  geneticTestRate: number;
  mortalityRate: number;
  topMedications: { label: string; count: number }[];
  topProcedureTypes: { label: string; count: number }[];
}

function RateBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

function KPITile({ icon, label, value, unit = "%", color, sub }: {
  icon: React.ReactNode; label: string; value: number | null; unit?: string; color: string; sub?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      {value === null ? (
        <div className="h-8 w-20 rounded bg-muted animate-pulse" />
      ) : (
        <>
          <p className="text-3xl font-bold tabular-nums leading-none" style={{ color }}>{value}{unit}</p>
          {unit === "%" && <RateBar value={value} color={color} />}
          {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </>
      )}
    </div>
  );
}

function BarList({ items, maxCount }: { items: { label: string; count: number }[]; maxCount: number }) {
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-foreground/80 truncate pr-2 max-w-[200px]">{item.label}</span>
            <span className="text-muted-foreground tabular-nums shrink-0">{item.count.toLocaleString("tr-TR")}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${Math.round((item.count / maxCount) * 100)}%`,
              backgroundColor: i === 0 ? "#0079F2" : i === 1 ? "#0d9488" : i === 2 ? "#795EFF" : "#64748b",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function NarrativeCard({ data, ageGroup, gender }: { data: CohortData; ageGroup: string; gender: string }) {
  const { lang, t } = useLang();
  const p = t.profiler;

  const whoLabel = gender === "all" ? p.narrativeAll : gender === "Erkek" ? p.narrativeMale : p.narrativeFemale;
  const ageLabel = ageGroup === "all" ? "" : `${ageGroup}${p.narrativeAgeSuffix}`;
  const riskLevel = data.icuRate >= 20 ? p.riskHigh : data.icuRate >= 10 ? p.riskMed : p.riskLow;

  const risk = data.icuRate >= 20
    ? { color: "#A60808", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900" }
    : data.icuRate >= 10
    ? { color: "#b45309", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900" }
    : { color: "#009118", bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900" };

  return (
    <div className={`rounded-xl border p-5 ${risk.bg}`}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: risk.color }}>
        {p.groupProfile} {riskLevel}
      </p>
      <p className="text-sm leading-relaxed text-foreground/80">
        {p.narrativeBody(whoLabel, ageLabel, data.hospitalizationRate, data.emergencyRate, data.geneticTestRate, data.geneticTestRate < 5, data.avgProceduresPerPatient)}
      </p>
    </div>
  );
}

export default function PatientProfiler() {
  const [ageGroup, setAgeGroup] = useState("all");
  const [gender, setGender] = useState("all");
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLang();
  const p = t.profiler;

  const AGE_GROUPS = [
    { label: p.all, value: "all" },
    { label: "30–39", value: "30-39" },
    { label: "40–49", value: "40-49" },
    { label: "50–59", value: "50-59" },
    { label: "60–69", value: "60-69" },
    { label: "70–79", value: "70-79" },
    { label: "80–89", value: "80-89" },
  ];

  const GENDERS = [
    { label: p.all, value: "all" },
    { label: p.male, value: "Erkek" },
    { label: p.female, value: "Kadın" },
  ];

  useEffect(() => {
    setLoading(true);
    setData(null);
    const params = new URLSearchParams();
    if (ageGroup !== "all") params.set("ageGroup", ageGroup);
    if (gender !== "all") params.set("gender", gender);
    fetch(`${BASE}/api/oncology/cohort?${params}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ageGroup, gender]);

  const maxMed = data?.topMedications[0]?.count ?? 1;
  const maxProc = data?.topProcedureTypes[0]?.count ?? 1;

  return (
    <div className="min-h-screen bg-background px-6 py-8 pb-16">
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="mb-8 anim-fsu" style={{ animationDelay: "0ms" }}>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-full px-3 py-1 mb-3">
            <Users className="w-3.5 h-3.5" /> {p.badge}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{p.title}</h1>
          <p className="text-muted-foreground text-[15px] max-w-2xl">{p.subtitle}</p>
        </div>

        {/* Info card */}
        <div className="rounded-xl border bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 p-5 mb-8 flex gap-4 anim-fsu" style={{ animationDelay: "60ms" }}>
          <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mt-0.5">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-1 text-blue-900 dark:text-blue-300">{p.infoTitle}</p>
            <p className="text-sm text-blue-800/70 dark:text-blue-300/70 leading-relaxed">{p.infoBody}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-xl p-5 mb-8 anim-fsu" style={{ animationDelay: "120ms" }}>
          <div className="flex flex-wrap gap-6 items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">{p.ageGroup}</p>
              <div className="flex flex-wrap gap-1.5">
                {AGE_GROUPS.map((ag) => (
                  <button key={ag.value} onClick={() => setAgeGroup(ag.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      ageGroup === ag.value ? "bg-teal-600 text-white border-teal-600" : "bg-background text-muted-foreground border-border hover:border-teal-400 hover:text-teal-600"
                    }`}>
                    {ag.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">{p.gender}</p>
              <div className="flex gap-1.5">
                {GENDERS.map((g) => (
                  <button key={g.value} onClick={() => setGender(g.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      gender === g.value ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-border hover:border-blue-400 hover:text-blue-600"
                    }`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="ml-auto flex items-end pb-0.5">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  {p.calculating}
                </div>
              ) : data ? (
                <div className="text-right">
                  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 tabular-nums">{data.patientCount}</p>
                  <p className="text-xs text-muted-foreground">{p.matchedOf.replace("{total}", String(data.totalPatientsOverall))}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3 mb-8">
          <KPITile icon={<BedDouble className="w-4 h-4" />} label={p.kpi.hospitalized} value={data ? data.hospitalizationRate : null} color="#0079F2" sub={p.kpi.hospitalizedSub} />
          <KPITile icon={<Scissors className="w-4 h-4" />} label={p.kpi.surgery} value={data ? data.surgeryRate : null} color="#795EFF" sub={p.kpi.surgerySub} />
          <KPITile icon={<AlertTriangle className="w-4 h-4" />} label={p.kpi.emergency} value={data ? data.emergencyRate : null} color="#b45309" sub={p.kpi.emergencySub} />
          <KPITile icon={<Activity className="w-4 h-4" />} label={p.kpi.icu} value={data ? data.icuRate : null} color="#A60808" sub={p.kpi.icuSub} />
          <KPITile icon={<FlaskConical className="w-4 h-4" />} label={p.kpi.genetic} value={data ? data.geneticTestRate : null} color="#0d9488" sub={p.kpi.geneticSub} />
          <KPITile icon={<Skull className="w-4 h-4" />} label={p.kpi.mortality} value={data ? data.mortalityRate : null} color="#7f1d1d" sub={p.kpi.mortalitySub} />
          <KPITile icon={<ClipboardList className="w-4 h-4" />} label={p.kpi.avgProc} value={data ? data.avgProceduresPerPatient : null} unit="" color="#64748b" sub={p.kpi.avgProcSub} />
        </div>

        {data && data.patientCount > 0 && <div className="mb-8"><NarrativeCard data={data} ageGroup={ageGroup} gender={gender} /></div>}

        {data && data.patientCount === 0 && (
          <div className="text-center py-12 text-muted-foreground">{p.noResults}</div>
        )}

        {data && data.patientCount > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Pill className="w-4 h-4 text-blue-500" />
                <p className="font-semibold text-sm">{p.topMeds}</p>
              </div>
              {data.topMedications.length > 0 ? <BarList items={data.topMedications} maxCount={maxMed} /> : <p className="text-sm text-muted-foreground">{p.noData}</p>}
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-teal-500" />
                <p className="font-semibold text-sm">{p.topProcs}</p>
              </div>
              {data.topProcedureTypes.length > 0 ? <BarList items={data.topProcedureTypes} maxCount={maxProc} /> : <p className="text-sm text-muted-foreground">{p.noData}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
