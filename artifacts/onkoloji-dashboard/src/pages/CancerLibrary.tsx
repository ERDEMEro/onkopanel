import { useState, useMemo } from "react";
import {
  Search, Users, Activity, HeartPulse, MapPin, AlertTriangle,
  Shield, Stethoscope, BookOpen, TrendingUp, Info, Database,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { useLang } from "@/context/LanguageContext";
import { ReadAloudButton } from "@/components/Narrator";
import { CANCER_DATA, CATEGORY_COLORS, type CancerCategory } from "@/data/cancerLibrary";
import {
  useCancerTypeList, useCancerTypeDetail,
  type CancerTypeDetail,
} from "@/hooks/useCancerLibraryData";

// ─── Color helpers ────────────────────────────────────────────────────────────

const COLOR_BY_KEY: Record<string, string> = {
  breast: "#e91e8c", prostate: "#2196F3", bladder: "#FF9800",
  lung: "#607D8B",   liver: "#795548",   colorectal: "#4CAF50",
  pancreatic: "#9C27B0", cervical: "#E91E63", lymphoma: "#00BCD4",
  stomach: "#FF5722",    myeloma: "#3F51B5",  kidney: "#009688",
};

const GENDER_COLORS = ["#e91e8c", "#2196F3"];
const AGE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];
const CITY_COLORS = [
  "#0ea5e9","#22c55e","#f59e0b","#ef4444","#8b5cf6",
  "#14b8a6","#f97316","#ec4899","#6366f1","#84cc16",
];

// ─── Donut chart helper ───────────────────────────────────────────────────────

function DonutChart({
  data,
  colors,
  centerLabel,
}: {
  data: { label: string; count: number }[];
  colors: string[];
  centerLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: 130, height: 130 }}>
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={60}
              dataKey="count"
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number, name: string) => [
                `${val} (%${total > 0 ? Math.round((val / total) * 100) : 0})`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-semibold text-muted-foreground text-center leading-tight">
              {centerLabel}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-xs text-muted-foreground truncate">{d.label}</span>
            <span className="text-xs font-semibold ml-auto shrink-0">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
        <span className="text-[11px] text-muted-foreground font-medium truncate">{label}</span>
      </div>
      <span className="text-lg font-bold leading-tight truncate">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground truncate">{sub}</span>}
    </div>
  );
}

// ─── Educational tabs ─────────────────────────────────────────────────────────

const TABS = ["symptoms", "riskFactors", "treatments", "prevention", "stages"] as const;
type Tab = (typeof TABS)[number];

function EducationalTabs({ entry, lang, lib }: {
  entry: NonNullable<ReturnType<typeof CANCER_DATA.find>>;
  lang: string;
  lib: { tabs: Record<string, string>; disclaimer: string; survivalRate: string; incidence: string };
}) {
  const [activeTab, setActiveTab] = useState<Tab>("symptoms");

  const tabConfig: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
    { id: "symptoms",    label: lib.tabs.symptoms,    icon: AlertTriangle, color: "text-amber-500" },
    { id: "riskFactors", label: lib.tabs.riskFactors, icon: Info,          color: "text-red-500" },
    { id: "treatments",  label: lib.tabs.treatments,  icon: Stethoscope,   color: "text-blue-500" },
    { id: "prevention",  label: lib.tabs.prevention,  icon: Shield,        color: "text-green-500" },
    { id: "stages",      label: lib.tabs.stages,      icon: TrendingUp,    color: "text-purple-500" },
  ];

  const activeItems = entry[activeTab];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 mb-4">
        {tabConfig.map((tc) => {
          const active = activeTab === tc.id;
          return (
            <button
              key={tc.id}
              onClick={() => setActiveTab(tc.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <tc.icon className={`w-3 h-3 ${active ? "" : tc.color}`} />
              {tc.label}
            </button>
          );
        })}
      </div>

      {/* Items */}
      <ul className="space-y-2">
        {activeItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
            <span>{lang === "tr" ? item.tr : item.en}</span>
          </li>
        ))}
      </ul>

      {/* Bottom stats */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs text-muted-foreground">{lib.survivalRate}:</span>
          <span className="text-xs font-semibold text-emerald-600">{entry.survivalRate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs text-muted-foreground">{lib.incidence}:</span>
          <span className="text-xs font-semibold">~{entry.incidence}/100k</span>
        </div>
      </div>
    </div>
  );
}

// ─── Right panel detail ───────────────────────────────────────────────────────

function DetailPanel({
  detail,
  lib,
  lang,
}: {
  detail: CancerTypeDetail;
  lib: ReturnType<typeof useLang>["t"]["library"];
  lang: string;
}) {
  const libEntry = CANCER_DATA.find((e) => e.id === detail.key);
  const color = COLOR_BY_KEY[detail.key] || "#6366f1";

  const genderData = [
    { label: lib.data.female, count: detail.genderF },
    { label: lib.data.male,   count: detail.genderM },
  ].filter((d) => d.count > 0);

  const readText = [
    `${lang === "tr" ? detail.labelTr : detail.labelEn}.`,
    `${lib.kpi.totalPatients}: ${detail.totalPatients}.`,
    `${lib.kpi.prevalence}: %${detail.prevalence}.`,
    `${lib.kpi.avgAge}: ${detail.avgAge}.`,
    `${lib.kpi.mortality}: %${detail.mortalityRate} (${detail.deaths} ${lib.data.deaths}).`,
  ].join(" ");

  const topCity = detail.cityDistribution[0]?.label ?? "-";
  const cityCount = detail.cityDistribution.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
            style={{ backgroundColor: `${color}22` }}
          >
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">
              {lang === "tr" ? detail.labelTr : detail.labelEn}
            </h2>
            <p className="text-xs text-muted-foreground">
              {lang === "tr" ? detail.labelEn : detail.labelTr}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Database className="w-3 h-3" />
            {lib.data.realDataBadge}
          </span>
          <ReadAloudButton text={readText} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <KpiCard
          icon={Users}
          label={lib.kpi.totalPatients}
          value={detail.totalPatients}
          color="text-blue-500"
        />
        <KpiCard
          icon={Activity}
          label={lib.kpi.prevalence}
          value={`%${detail.prevalence}`}
          color="text-purple-500"
        />
        <KpiCard
          icon={TrendingUp}
          label={lib.kpi.avgAge}
          value={detail.avgAge}
          sub={detail.minAge !== null ? `${detail.minAge}–${detail.maxAge} ${lib.data.ageRange}` : undefined}
          color="text-amber-500"
        />
        <KpiCard
          icon={HeartPulse}
          label={lib.kpi.mortality}
          value={`%${detail.mortalityRate}`}
          sub={`${detail.deaths} ${lib.data.deaths}`}
          color="text-red-500"
        />
        <KpiCard
          icon={Users}
          label={lib.kpi.gender}
          value={`${detail.genderF}♀ ${detail.genderM}♂`}
          color="text-pink-500"
        />
        <KpiCard
          icon={MapPin}
          label={lib.kpi.cities}
          value={cityCount}
          sub={topCity}
          color="text-green-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gender donut */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-pink-500" />
            {lib.data.genderDistribution}
          </h3>
          {genderData.length > 0 ? (
            <DonutChart data={genderData} colors={GENDER_COLORS} />
          ) : (
            <p className="text-xs text-muted-foreground">-</p>
          )}
        </div>

        {/* Age groups donut */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-purple-500" />
            {lib.data.ageGroups}
          </h3>
          {detail.ageGroups.length > 0 ? (
            <DonutChart data={detail.ageGroups} colors={AGE_COLORS} />
          ) : (
            <p className="text-xs text-muted-foreground">-</p>
          )}
        </div>
      </div>

      {/* City distribution */}
      {detail.cityDistribution.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-green-500" />
            {lib.data.cityDistribution}
          </h3>
          <div className="space-y-2">
            {detail.cityDistribution.map((c, i) => {
              const pct = detail.totalPatients > 0
                ? Math.round((c.count / detail.totalPatients) * 100)
                : 0;
              return (
                <div key={c.label} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: CITY_COLORS[i % CITY_COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{c.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CITY_COLORS[i % CITY_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-8 text-right shrink-0">{c.count}</span>
                  <span className="text-[10px] text-muted-foreground w-8 shrink-0">%{pct}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Educational content */}
      {libEntry && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            {lib.data.educationSection}
            {libEntry.category && (
              <span
                className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ml-1 ${
                  CATEGORY_COLORS[libEntry.category as CancerCategory]
                }`}
              >
                {lib.categories[libEntry.category as CancerCategory]}
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            {lang === "tr" ? libEntry.descTr : libEntry.descEn}
          </p>
          <EducationalTabs entry={libEntry} lang={lang} lib={lib} />
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground leading-relaxed rounded-xl bg-muted/40 p-3 border border-dashed">
        {lib.disclaimer}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CancerLibrary() {
  const { lang, t } = useLang();
  const lib = t.library;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: list = [], isLoading: listLoading } = useCancerTypeList();
  const { data: detail, isLoading: detailLoading } = useCancerTypeDetail(selectedKey);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (item) =>
        item.labelTr.toLowerCase().includes(q) ||
        item.labelEn.toLowerCase().includes(q)
    );
  }, [list, search]);

  return (
    <div className="flex h-[calc(100dvh-56px)] overflow-hidden">
      {/* ── Left sidebar ───────────────────────────────────────────────────── */}
      <aside className="w-64 xl:w-72 shrink-0 border-r flex flex-col bg-card overflow-hidden">
        {/* Sidebar header */}
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-semibold leading-tight">{lib.title}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lib.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Cancer type list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {listLoading ? (
            <div className="flex items-center justify-center h-24">
              <span className="text-xs text-muted-foreground animate-pulse">{lib.data.loading}</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">{lib.noResults}</p>
          ) : (
            filtered.map((item) => {
              const active = selectedKey === item.key;
              const color = COLOR_BY_KEY[item.key] || "#6366f1";
              const name = lang === "tr" ? item.labelTr : item.labelEn;
              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedKey(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted/80 text-foreground"
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: active ? "white" : color }}
                  />
                  <span className="text-xs font-medium flex-1 leading-tight">{name}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar footer */}
        {list.length > 0 && (
          <div className="p-3 border-t">
            <p className="text-[10px] text-muted-foreground">
              {list.length} {lib.resultsFound} &middot;{" "}
              {list.reduce((s, i) => s + i.count, 0)} hasta
            </p>
          </div>
        )}
      </aside>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {!selectedKey ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-semibold text-muted-foreground">
                {lib.data.selectPrompt}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {lib.subtitle}
              </p>
            </div>
          </div>
        ) : detailLoading ? (
          /* Loading state */
          <div className="flex items-center justify-center h-64">
            <span className="text-sm text-muted-foreground animate-pulse">{lib.data.loading}</span>
          </div>
        ) : detail ? (
          /* Detail content */
          <div className="p-5 max-w-5xl">
            <DetailPanel detail={detail} lib={lib} lang={lang} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
