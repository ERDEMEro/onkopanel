import { useState, useMemo } from "react";
import {
  Search, Users, Activity, HeartPulse, MapPin, AlertTriangle,
  Shield, Stethoscope, BookOpen, TrendingUp, Info, Database,
  Pill, FlaskConical, BarChart2, ClipboardList, Calendar,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useLang } from "@/context/LanguageContext";
import { ReadAloudButton } from "@/components/Narrator";
import { CANCER_DATA, CATEGORY_COLORS, type CancerCategory } from "@/data/cancerLibrary";
import {
  useCancerTypeList, useCancerTypeDetail,
  type CancerTypeDetail, type DistItem,
} from "@/hooks/useCancerLibraryData";

// ─── Color maps ───────────────────────────────────────────────────────────────

const COLOR_BY_KEY: Record<string, string> = {
  breast: "#e91e8c", prostate: "#2196F3", bladder: "#FF9800",
  lung: "#607D8B",   liver: "#795548",   colorectal: "#4CAF50",
  pancreatic: "#9C27B0", cervical: "#E91E63", lymphoma: "#00BCD4",
  stomach: "#FF5722",    myeloma: "#3F51B5",  kidney: "#009688",
  thyroid: "#00acc1",    ovarian: "#e91e63",  brain: "#673ab7",
};

const PALETTE = [
  "#e91e8c","#2196F3","#FF9800","#4CAF50","#9C27B0",
  "#00BCD4","#FF5722","#3F51B5","#009688","#FFC107",
];
const GENDER_COLORS = ["#e91e8c","#2196F3"];
const AGE_COLORS    = ["#6366f1","#8b5cf6","#a78bfa","#c4b5fd","#ddd6fe"];

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, iconBg, label, value, sub,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 flex items-start gap-3 min-w-0">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg + "22" }}
      >
        <Icon className="w-4 h-4" style={{ color: iconBg }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-xl font-bold leading-tight truncate">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Info box ─────────────────────────────────────────────────────────────────

function InfoBox({
  icon: Icon, color, title, items, lang,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  items: { tr: string; en: string }[];
  lang: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <ul className="space-y-1.5 flex-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <div
              className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground leading-snug">
              {lang === "tr" ? item.tr : item.en}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Donut card (small donut + legend table) ──────────────────────────────────

function DonutCard({
  title, icon: Icon, iconColor, data, colors, maxItems = 6,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  data: DistItem[];
  colors: string[];
  maxItems?: number;
}) {
  const shown = data.slice(0, maxItems);
  const total = shown.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="flex items-start gap-3">
        <div className="shrink-0" style={{ width: 90, height: 90 }}>
          <PieChart width={90} height={90}>
            <Pie
              data={shown}
              cx={45} cy={45}
              innerRadius={24} outerRadius={42}
              dataKey="count" paddingAngle={2}
              startAngle={90} endAngle={-270}
            >
              {shown.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => [
                `${v} (%${total > 0 ? Math.round((v / total) * 100) : 0})`,
              ]}
            />
          </PieChart>
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          {shown.map((d, i) => {
            const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
            return (
              <div key={d.label} className="flex items-center gap-1.5 min-w-0">
                <div
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="text-[10px] text-muted-foreground flex-1 truncate leading-tight">
                  {d.label}
                </span>
                <span className="text-[10px] font-semibold tabular-nums shrink-0">{d.count}</span>
                <span className="text-[9px] text-muted-foreground w-8 text-right shrink-0">%{pct}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Horizontal bar chart ─────────────────────────────────────────────────────

function HBarChart({
  title, icon: Icon, iconColor, data, color,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  data: DistItem[];
  color: string;
}) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map((d) => d.count));

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="space-y-2">
        {data.map((d, i) => {
          const pct = maxVal > 0 ? Math.round((d.count / maxVal) * 100) : 0;
          const barColor = PALETTE[i % PALETTE.length];
          return (
            <div key={d.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: barColor }} />
              <span className="text-[10px] text-muted-foreground truncate" style={{ minWidth: 120, maxWidth: 160 }}>
                {d.label}
              </span>
              <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
              <span className="text-[10px] font-semibold tabular-nums w-8 text-right shrink-0">
                {d.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vertical bar chart (procedure types) ────────────────────────────────────

function VBarChart({
  title, icon: Icon, iconColor, data, color,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  data: DistItem[];
  color: string;
}) {
  if (!data.length) return null;
  const chartData = data.slice(0, 8).map((d) => ({
    label: d.label.slice(0, 12),
    count: d.count,
  }));

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            angle={-25}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 11,
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Lab parameters table ─────────────────────────────────────────────────────

function LabTable({
  data, lang,
}: {
  data: CancerTypeDetail["labParameters"];
  lang: string;
}) {
  if (!data.length) return null;
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b">
        <FlaskConical className="w-3.5 h-3.5 text-cyan-500" />
        <span className="text-sm font-semibold">
          {lang === "tr" ? "Laboratuvar Parametreleri" : "Lab Parameters"}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {lang === "tr" ? `${data.length} parametre` : `${data.length} parameters`}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left py-2 px-4 font-semibold text-muted-foreground">
                {lang === "tr" ? "Parametre" : "Parameter"}
              </th>
              <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                {lang === "tr" ? "Hasta" : "Patients"}
              </th>
              <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                {lang === "tr" ? "Ref. Aralık" : "Ref. Range"}
              </th>
              <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                {lang === "tr" ? "Medyan" : "Median"}
              </th>
              <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                Min
              </th>
              <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                Maks
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.key}
                className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
              >
                <td className="py-2 px-4 font-semibold">{row.key}</td>
                <td className="py-2 px-3 text-right tabular-nums">{row.count}</td>
                <td className="py-2 px-3 text-right text-muted-foreground">{row.refRange}</td>
                <td className="py-2 px-3 text-right font-semibold tabular-nums">{row.median}</td>
                <td className="py-2 px-3 text-right text-muted-foreground tabular-nums">{row.min}</td>
                <td className="py-2 px-3 text-right text-muted-foreground tabular-nums">{row.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  detail, lang,
}: {
  detail: CancerTypeDetail;
  lang: string;
}) {
  const libEntry = CANCER_DATA.find((e) => e.id === detail.key);
  const accentColor = COLOR_BY_KEY[detail.key] || "#6366f1";

  const genderData: DistItem[] = [
    { label: lang === "tr" ? "Kadın" : "Female", count: detail.genderF },
    { label: lang === "tr" ? "Erkek" : "Male",   count: detail.genderM },
  ].filter((d) => d.count > 0);

  const topCity = detail.cityDistribution[0]?.label ?? "-";
  const readText = [
    `${lang === "tr" ? detail.labelTr : detail.labelEn}.`,
    `${lang === "tr" ? "Toplam hasta" : "Total patients"}: ${detail.totalPatients}.`,
    `${lang === "tr" ? "Ortalama yaş" : "Average age"}: ${detail.avgAge}.`,
    `${lang === "tr" ? "Mortalite" : "Mortality"}: %${detail.mortalityRate}.`,
  ].join(" ");

  const t = (tr: string, en: string) => (lang === "tr" ? tr : en);

  return (
    <div className="space-y-5 pb-8">

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3 overflow-hidden rounded-xl border bg-card p-5">
        <div
          className="absolute right-0 top-0 w-32 h-32 rounded-full opacity-10 translate-x-8 -translate-y-8"
          style={{ backgroundColor: accentColor }}
        />
        <div className="flex items-center gap-3 z-10">
          <div
            className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center"
            style={{ backgroundColor: accentColor + "20" }}
          >
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: accentColor }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-tight">
              {lang === "tr" ? detail.labelTr : detail.labelEn}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "tr" ? detail.labelEn : detail.labelTr}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 z-10">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Database className="w-3 h-3" />
            {t("Kanser Detay", "Cancer Detail")}
          </span>
          <ReadAloudButton text={readText} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          icon={Users}
          iconBg="#2563EB"
          label={t("Hasta Sayısı", "Patients")}
          value={detail.totalPatients}
          sub={`%${detail.prevalence} ${t("yaygınlık", "prevalence")}`}
        />
        <KpiCard
          icon={Calendar}
          iconBg="#EA580C"
          label={t("Ortalama Yaş", "Avg. Age")}
          value={detail.avgAge}
          sub={
            detail.minAge !== null
              ? `${detail.minAge}–${detail.maxAge} ${t("yaş arası", "age range")}`
              : undefined
          }
        />
        <KpiCard
          icon={HeartPulse}
          iconBg="#DC2626"
          label={t("Mortalite", "Mortality")}
          value={`%${detail.mortalityRate}`}
          sub={`${detail.deaths} ${t("vefat", "deaths")}`}
        />
        <KpiCard
          icon={ClipboardList}
          iconBg="#7C3AED"
          label={t("Toplam Kayıt", "Total Records")}
          value={(detail.totalVisitRecords ?? 0).toLocaleString("tr-TR")}
          sub={
            detail.totalVisitRecords && detail.totalPatients
              ? `~${Math.round(detail.totalVisitRecords / detail.totalPatients)} ${t("hasta başına", "per patient")}`
              : undefined
          }
        />
        <KpiCard
          icon={Users}
          iconBg="#DB2777"
          label={t("Cinsiyet", "Gender")}
          value={`${detail.genderF}♀  ${detail.genderM}♂`}
          sub={
            detail.genderM > 0
              ? `${Math.round((detail.genderF / (detail.genderF + detail.genderM)) * 100)}% ${t("kadın", "female")}`
              : undefined
          }
        />
        <KpiCard
          icon={MapPin}
          iconBg="#0D9488"
          label={t("Şehir Sayısı", "Cities")}
          value={detail.cityDistribution.length}
          sub={topCity}
        />
      </div>

      {/* Info boxes: symptoms, risk, screening */}
      {libEntry && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoBox
            icon={AlertTriangle}
            color="#F59E0B"
            title={t("Tipik Belirtiler", "Typical Symptoms")}
            items={libEntry.symptoms}
            lang={lang}
          />
          <InfoBox
            icon={Info}
            color="#EF4444"
            title={t("Risk Faktörleri", "Risk Factors")}
            items={libEntry.riskFactors}
            lang={lang}
          />
          <InfoBox
            icon={Shield}
            color="#10B981"
            title={t("Tarama Yöntemleri", "Screening Methods")}
            items={libEntry.treatments.slice(0, 5)}
            lang={lang}
          />
        </div>
      )}

      {/* Donut row 1: gender, age, city */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutCard
          title={t("Cinsiyet", "Gender")}
          icon={Users}
          iconColor="#DB2777"
          data={genderData}
          colors={GENDER_COLORS}
        />
        <DonutCard
          title={t("Yaş Grupları", "Age Groups")}
          icon={Activity}
          iconColor="#7C3AED"
          data={detail.ageGroups}
          colors={AGE_COLORS}
        />
        <DonutCard
          title={t("Şehir Dağılımı", "City Distribution")}
          icon={MapPin}
          iconColor="#0D9488"
          data={detail.cityDistribution}
          colors={PALETTE}
          maxItems={7}
        />
      </div>

      {/* Donut row 2: arrival, visit, hospitalization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutCard
          title={t("Geliş Tipi", "Arrival Type")}
          icon={TrendingUp}
          iconColor="#2563EB"
          data={detail.arrivalTypes}
          colors={["#2563EB","#60A5FA","#93C5FD"]}
        />
        <DonutCard
          title={t("Başvuru Tipi", "Visit Type")}
          icon={Stethoscope}
          iconColor="#EA580C"
          data={detail.visitTypes}
          colors={["#EA580C","#FB923C","#FDBA74","#FED7AA","#FEF3C7","#FDE68A","#FCD34D","#FBBF24"]}
          maxItems={6}
        />
        <DonutCard
          title={t("Yatış Tipi", "Hospitalization")}
          icon={HeartPulse}
          iconColor="#DC2626"
          data={detail.hospitalizationTypes}
          colors={["#DC2626","#F87171","#FCA5A5"]}
        />
      </div>

      {/* Bar charts: medications + ATC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HBarChart
          title={t("En Sık İlaçlar", "Top Medications")}
          icon={Pill}
          iconColor="#8B5CF6"
          data={detail.topMedications}
          color={accentColor}
        />
        <HBarChart
          title={t("ATC Kodları", "ATC Codes")}
          icon={FlaskConical}
          iconColor="#0891B2"
          data={detail.topAtcCodes}
          color="#0891B2"
        />
      </div>

      {/* Procedure types - vertical bar */}
      <VBarChart
        title={t("İşlem Tipi Dağılımı", "Procedure Type Distribution")}
        icon={BarChart2}
        iconColor="#6366F1"
        data={detail.procedureTypes}
        color="#6366F1"
      />

      {/* Lab parameters table */}
      <LabTable data={detail.labParameters} lang={lang} />

      {/* Educational content */}
      {libEntry && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-sm font-semibold">
              {t("Klinik Bilgi", "Clinical Information")}
            </span>
            {libEntry.category && (
              <span
                className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ml-1 ${
                  CATEGORY_COLORS[libEntry.category as CancerCategory]
                }`}
              >
                {libEntry.category}
              </span>
            )}
            <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                {t("Sağ. Oranı", "Survival")}: {libEntry.survivalRate}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-500" />
                {t("İnsidans", "Incidence")}: ~{libEntry.incidence}/100k
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {lang === "tr" ? libEntry.descTr : libEntry.descEn}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground leading-relaxed rounded-xl bg-muted/40 p-3 border border-dashed">
        {t(
          "Bu veriler, 979 benzersiz onkoloji hastasının klinik kayıtlarından anahtar kelime eşleştirme yöntemiyle elde edilmiştir. İstatistikler bilgi amaçlıdır; klinik karar verme süreçlerinde kullanılmamalıdır.",
          "This data is derived from clinical records of 979 unique oncology patients using keyword matching. Statistics are for informational purposes only and should not be used in clinical decision-making."
        )}
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

  // Auto-select first item when list loads
  const firstKey = list[0]?.key ?? null;
  const activeKey = selectedKey ?? firstKey;

  const { data: detail, isLoading: detailLoading } = useCancerTypeDetail(activeKey);

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

      {/* ── Left sidebar ───────────────────────────────────────────────── */}
      <aside className="w-64 xl:w-72 shrink-0 border-r flex flex-col bg-card overflow-hidden">
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

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {listLoading ? (
            <div className="flex items-center justify-center h-24">
              <span className="text-xs text-muted-foreground animate-pulse">{lib.data.loading}</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">{lib.noResults}</p>
          ) : (
            filtered.map((item) => {
              const active = activeKey === item.key;
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

        {list.length > 0 && (
          <div className="p-3 border-t">
            <p className="text-[10px] text-muted-foreground">
              {list.length} {lib.resultsFound} &middot;{" "}
              {list.reduce((s, i) => s + i.count, 0)} hasta
            </p>
          </div>
        )}
      </aside>

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-muted/20">
        {!activeKey ? (
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
          <div className="flex items-center justify-center h-64">
            <span className="text-sm text-muted-foreground animate-pulse">{lib.data.loading}</span>
          </div>
        ) : detail ? (
          <div className="p-5 max-w-6xl mx-auto">
            <DetailPanel detail={detail} lang={lang} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
