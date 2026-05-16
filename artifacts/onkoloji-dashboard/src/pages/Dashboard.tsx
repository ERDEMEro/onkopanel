import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useLang } from "@/context/LanguageContext";
import {
  useGetOncologySummary,
  useGetGenderDistribution,
  useGetAgeDistribution,
  useGetDepartmentDistribution,
  useGetAdmissionTypes,
  useGetGeneticTests,
  useGetTopMedications,
  useGetProcedureTypes,
  useGetAdmissionTrend,
  useGetMedsByCancerType,
  getGetOncologySummaryQueryKey,
  getGetGenderDistributionQueryKey,
  getGetAgeDistributionQueryKey,
  getGetDepartmentDistributionQueryKey,
  getGetAdmissionTypesQueryKey,
  getGetGeneticTestsQueryKey,
  getGetTopMedicationsQueryKey,
  getGetProcedureTypesQueryKey,
  getGetAdmissionTrendQueryKey,
  getGetMedsByCancerTypeQueryKey,
} from "@workspace/api-client-react";
import { CSVLink } from "react-csv";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw, ChevronDown, Check, Printer, Download,
  Users2, ClipboardList, CalendarDays, Building2,
  User, FlaskConical, HeartPulse, Dna,
} from "lucide-react";
import { PatientTable } from "@/components/patient-table";
import { KeyInsights } from "@/components/key-insights";
import { ProblemSolutions } from "@/components/problem-solutions";

const CHART_COLORS = {
  blue: "#0079F2", purple: "#795EFF", green: "#009118", red: "#A60808",
  pink: "#ec4899", teal: "#0d9488", lightTeal: "#14b8a6", slate: "#64748b"
};
const CHART_COLOR_LIST = [CHART_COLORS.teal, CHART_COLORS.blue, CHART_COLORS.purple, CHART_COLORS.slate, CHART_COLORS.pink];
const DATA_SOURCES = ["App DB"];

const INTERVAL_OPTIONS_TR = [
  { label: "Her 5 dk", ms: 5 * 60 * 1000 },
  { label: "Her 15 dk", ms: 15 * 60 * 1000 },
  { label: "Her 1 saat", ms: 60 * 60 * 1000 },
];
const INTERVAL_OPTIONS_EN = [
  { label: "Every 5 min", ms: 5 * 60 * 1000 },
  { label: "Every 15 min", ms: 15 * 60 * 1000 },
  { label: "Every 1 hour", ms: 60 * 60 * 1000 },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "6px", padding: "10px 14px", border: "1px solid #e0e0e0", color: "#1a1a1a", fontSize: "13px" }}>
      <div style={{ marginBottom: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
        {payload.length === 1 && payload[0].color && payload[0].color !== "#ffffff" && (
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: payload[0].color, flexShrink: 0 }} />
        )}
        {label}
      </div>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
          {payload.length > 1 && entry.color && entry.color !== "#ffffff" && (
            <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          )}
          <span style={{ color: "#444" }}>{entry.name}</span>
          <span style={{ marginLeft: "auto", fontWeight: 600 }}>
            {typeof entry.value === "number" ? formatNumber(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }: any) {
  if (!payload || payload.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 16px", fontSize: "13px", marginTop: "12px" }}>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function KPICard({ title, value, loading, valueColor = CHART_COLORS.teal, icon }: {
  title: string; value?: React.ReactNode; loading?: boolean; valueColor?: string; icon?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden relative group transition-shadow hover:shadow-md">
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-lg" style={{ background: valueColor }} />
      <CardContent className="p-4 pt-4">
        {loading ? (
          <><Skeleton className="h-3 w-20 mb-2.5" /><Skeleton className="h-7 w-24" /></>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">{title}</p>
              {icon && <div className="opacity-40 group-hover:opacity-70 transition-opacity" style={{ color: valueColor }}>{icon}</div>}
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: valueColor }}>{value ?? "--"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { isDark, barStyle } = useTheme();
  // Radius arrays based on barStyle
  const rV: [number,number,number,number] = barStyle === "cylinder" ? [10,10,0,0] : [2,2,0,0]; // vertical bars
  const rH: [number,number,number,number] = barStyle === "cylinder" ? [0,10,10,0] : [0,2,2,0]; // horizontal bars (layout="vertical")
  const { lang, t } = useLang();
  const d = t.dashboard;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [intervalMs, setIntervalMs] = useState(5 * 60 * 1000);
  const [selectedCancerType, setSelectedCancerType] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const INTERVAL_OPTIONS = lang === "en" ? INTERVAL_OPTIONS_EN : INTERVAL_OPTIONS_TR;

  const summaryQ = useGetOncologySummary({ query: { enabled: true, queryKey: getGetOncologySummaryQueryKey() } });
  const genderQ = useGetGenderDistribution({ query: { enabled: true, queryKey: getGetGenderDistributionQueryKey() } });
  const ageQ = useGetAgeDistribution({ query: { enabled: true, queryKey: getGetAgeDistributionQueryKey() } });
  const deptQ = useGetDepartmentDistribution({ query: { enabled: true, queryKey: getGetDepartmentDistributionQueryKey() } });
  const admitTypesQ = useGetAdmissionTypes({ query: { enabled: true, queryKey: getGetAdmissionTypesQueryKey() } });
  const testsQ = useGetGeneticTests({ query: { enabled: true, queryKey: getGetGeneticTestsQueryKey() } });
  const medsQ = useGetTopMedications({ query: { enabled: true, queryKey: getGetTopMedicationsQueryKey() } });
  const procQ = useGetProcedureTypes({ query: { enabled: true, queryKey: getGetProcedureTypesQueryKey() } });
  const trendQ = useGetAdmissionTrend({ query: { enabled: true, queryKey: getGetAdmissionTrendQueryKey() } });
  const medsCancerQ = useGetMedsByCancerType({ query: { enabled: true, queryKey: getGetMedsByCancerTypeQueryKey() } });

  const loading = summaryQ.isLoading || summaryQ.isFetching || genderQ.isLoading || genderQ.isFetching || trendQ.isLoading || trendQ.isFetching;

  useEffect(() => {
    if (medsCancerQ.data && medsCancerQ.data.length > 0 && !selectedCancerType) {
      setSelectedCancerType(medsCancerQ.data[0].cancerType);
    }
  }, [medsCancerQ.data]);

  useEffect(() => {
    if (loading) { setIsSpinning(true); return; }
    const timer = setTimeout(() => setIsSpinning(false), 600);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => queryClient.invalidateQueries(), intervalMs);
    return () => clearInterval(interval);
  }, [autoRefresh, intervalMs]);

  const handleRefresh = () => queryClient.invalidateQueries();
  const lastRefreshed = summaryQ.dataUpdatedAt ? new Date(summaryQ.dataUpdatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : null;
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const mainChartColor = isDark ? CHART_COLORS.lightTeal : CHART_COLORS.teal;

  const patientLabel = lang === "en" ? "Patient" : "Hasta";
  const admissionLabel = lang === "en" ? "Admission" : "Başvuru";
  const procedureLabel = lang === "en" ? "Procedure" : "İşlem";
  const testLabel = lang === "en" ? "Test" : "Test";
  const freqLabel = lang === "en" ? "Frequency" : "Sıklık";
  const recordLabel = lang === "en" ? "Record" : "Kayıt";
  const patientRecordsTitle = lang === "en" ? "Patient Records" : "Hasta Kayıtları";
  const clinicDistTitle = lang === "en" ? "Clinic Distribution" : "Poliklinik Dağılımı";

  return (
    <div className="min-h-screen bg-background pb-[32px]">
      <div className="max-w-[1400px] mx-auto px-6">

        {/* Hero header */}
        <div className="relative mb-6 mt-5 rounded-2xl border overflow-hidden bg-card print:hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, transparent 55%)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-48 pointer-events-none"
            style={{ background: "linear-gradient(225deg, hsl(var(--primary)/0.05) 0%, transparent 60%)" }} />
          <div className="relative px-6 py-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-4">
          <div className="pt-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary">OnkoPanel</span>
            </div>
            <h1 className="font-bold text-[28px] tracking-tight">{d.title}</h1>
            <p className="text-muted-foreground mt-1 text-[14px]">{d.subtitle}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {DATA_SOURCES.length > 0 && DATA_SOURCES.map((source) => (
                <span key={source} className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "hsl(var(--primary)/0.1)", color: isDark ? "#cbd5e1" : "hsl(var(--primary))" }}>
                  {source}
                </span>
              ))}
              {lastRefreshed && (
                <span className="text-[11px] text-muted-foreground">{d.lastUpdated}: {lastRefreshed}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 print:hidden">
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center rounded-[6px] overflow-hidden h-[30px] text-[13px] border"
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0", color: isDark ? "#e2e8f0" : "#334155" }}>
                <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-1.5 px-3 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
                  {d.refresh}
                </button>
                <div className="w-px h-5 shrink-0" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0" }} />
                <button onClick={() => setDropdownOpen((o) => !o)} className="flex items-center justify-center px-2 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-md border shadow-lg bg-popover text-popover-foreground z-50 py-1 text-sm">
                  <div className="px-3 py-2 border-b flex items-center justify-between">
                    <span className="font-medium text-xs text-muted-foreground">{d.autoRefresh}</span>
                    <button onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`w-8 h-4 rounded-full relative transition-colors ${autoRefresh ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${autoRefresh ? "left-4" : "left-0.5"}`} />
                    </button>
                  </div>
                  {INTERVAL_OPTIONS.map((opt) => (
                    <button key={opt.ms} className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-muted transition-colors disabled:opacity-50"
                      disabled={!autoRefresh} onClick={() => { setIntervalMs(opt.ms); setDropdownOpen(false); }}>
                      {opt.label}
                      {intervalMs === opt.ms && <Check className="w-4 h-4 text-teal-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => window.print()} disabled={loading}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-[6px] transition-colors disabled:opacity-50 border"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0", color: isDark ? "#e2e8f0" : "#334155" }}
              aria-label={d.exportPdf}>
              <Printer className="w-4 h-4" />
            </button>
          </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <KPICard title={d.kpi.totalPatients}   value={summaryQ.data?.totalPatients}    loading={summaryQ.isLoading || summaryQ.isFetching} icon={<Users2 className="w-4 h-4"/>} />
          <KPICard title={d.kpi.totalAdmissions} value={summaryQ.data?.totalAdmissions}  loading={summaryQ.isLoading || summaryQ.isFetching} icon={<ClipboardList className="w-4 h-4"/>} />
          <KPICard title={d.kpi.averageAge}      value={summaryQ.data?.averageAge ? Math.round(summaryQ.data.averageAge) : "--"} loading={summaryQ.isLoading || summaryQ.isFetching} icon={<CalendarDays className="w-4 h-4"/>} />
          <KPICard title={d.kpi.departmentCount} value={summaryQ.data?.departmentCount}  loading={summaryQ.isLoading || summaryQ.isFetching} icon={<Building2 className="w-4 h-4"/>} />
          <KPICard title={d.kpi.malePatients}    value={summaryQ.data?.maleCount}        loading={summaryQ.isLoading || summaryQ.isFetching} valueColor={CHART_COLORS.blue}   icon={<User className="w-4 h-4"/>} />
          <KPICard title={d.kpi.femalePatients}  value={summaryQ.data?.femaleCount}      loading={summaryQ.isLoading || summaryQ.isFetching} valueColor={CHART_COLORS.purple} icon={<User className="w-4 h-4"/>} />
          <KPICard title={d.kpi.geneticTests}    value={summaryQ.data?.withGeneticTest}  loading={summaryQ.isLoading || summaryQ.isFetching} valueColor={CHART_COLORS.teal}   icon={<Dna className="w-4 h-4"/>} />
          <KPICard title={d.kpi.mortalityRate}   value={(summaryQ.data as any)?.mortalityRate !== undefined ? `%${(summaryQ.data as any).mortalityRate}` : "--"} loading={summaryQ.isLoading || summaryQ.isFetching} valueColor={CHART_COLORS.red} icon={<HeartPulse className="w-4 h-4"/>} />
        </div>

        <KeyInsights />
        <ProblemSolutions />

        {/* Top Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Card className="lg:col-span-2">
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">{d.charts.admissionTrend}</CardTitle>
              {!trendQ.isLoading && !trendQ.isFetching && trendQ.data && trendQ.data.length > 0 && (
                <CSVLink data={trendQ.data} filename="aylik-basvuru.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV">
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2">
              {trendQ.isLoading || trendQ.isFetching ? <Skeleton className="w-full h-[320px] mx-4" /> : (
                <ResponsiveContainer width="100%" height={320} debounce={0}>
                  <AreaChart data={trendQ.data || []} margin={{ left: -15, right: 15, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={mainChartColor} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={mainChartColor} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", stroke: "none" }} />
                    <Area type="monotone" dataKey="count" name={admissionLabel} fill="url(#gradientTrend)" stroke={mainChartColor} fillOpacity={1} strokeWidth={2}
                      activeDot={{ r: 5, fill: mainChartColor, stroke: isDark ? "#1e293b" : "#ffffff", strokeWidth: 2 }} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">{d.charts.genderDistribution}</CardTitle>
              {!genderQ.isLoading && !genderQ.isFetching && genderQ.data && genderQ.data.length > 0 && (
                <CSVLink data={genderQ.data} filename="cinsiyet-dagilimi.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV">
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent>
              {genderQ.isLoading || genderQ.isFetching ? <Skeleton className="w-full h-[320px]" /> : (
                <ResponsiveContainer width="100%" height={320} debounce={0}>
                  <PieChart>
                    <Pie data={genderQ.data || []} dataKey="count" nameKey="label" cx="50%" cy="45%" innerRadius={70} outerRadius={110} cornerRadius={3} paddingAngle={2} isAnimationActive={false} stroke="none">
                      {(genderQ.data || []).map((_entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Legend content={<CustomLegend />} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">{d.charts.ageDistribution}</CardTitle>
              {!ageQ.isLoading && !ageQ.isFetching && ageQ.data && ageQ.data.length > 0 && (
                <CSVLink data={ageQ.data} filename="yas-dagilimi.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV">
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2">
              {ageQ.isLoading || ageQ.isFetching ? <Skeleton className="w-full h-[280px] mx-4" /> : (
                <ResponsiveContainer width="100%" height={280} debounce={0}>
                  <BarChart data={ageQ.data || []} margin={{ left: -15, right: 15, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }} />
                    <Bar dataKey="count" name={patientLabel} fill={mainChartColor} fillOpacity={0.9} radius={rV} isAnimationActive={false} activeBar={{ fillOpacity: 1 }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">{clinicDistTitle}</CardTitle>
              {!deptQ.isLoading && !deptQ.isFetching && deptQ.data && deptQ.data.length > 0 && (
                <CSVLink data={deptQ.data} filename="bolum-dagilimi.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV">
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2">
              {deptQ.isLoading || deptQ.isFetching ? <Skeleton className="w-full h-[280px] mx-4" /> : (
                <ResponsiveContainer width="100%" height={280} debounce={0}>
                  <BarChart data={deptQ.data?.slice(0, 8) || []} layout="vertical" margin={{ left: 0, right: 15, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }} />
                    <Bar dataKey="count" name={admissionLabel} fill={CHART_COLORS.purple} fillOpacity={0.9} radius={rH} isAnimationActive={false} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">{d.charts.procedureTypes}</CardTitle>
              {!procQ.isLoading && !procQ.isFetching && procQ.data && procQ.data.length > 0 && (
                <CSVLink data={procQ.data} filename="islem-tipleri.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV">
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2">
              {procQ.isLoading || procQ.isFetching ? <Skeleton className="w-full h-[280px] mx-4" /> : (
                <ResponsiveContainer width="100%" height={280} debounce={0}>
                  <BarChart data={procQ.data?.slice(0, 8) || []} layout="vertical" margin={{ left: 0, right: 15, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }} />
                    <Bar dataKey="count" name={procedureLabel} fill={CHART_COLORS.pink} fillOpacity={0.9} radius={rH} isAnimationActive={false} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">{d.charts.geneticTests}</CardTitle>
              {!testsQ.isLoading && !testsQ.isFetching && testsQ.data && testsQ.data.length > 0 && (
                <CSVLink data={testsQ.data} filename="genetik-testler.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV">
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2">
              {testsQ.isLoading || testsQ.isFetching ? <Skeleton className="w-full h-[340px] mx-4" /> : (
                <ResponsiveContainer width="100%" height={340} debounce={0}>
                  <BarChart data={testsQ.data?.slice(0, 10) || []} layout="vertical" margin={{ left: 0, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }} />
                    <Bar dataKey="count" name={testLabel} fill={CHART_COLORS.slate} fillOpacity={0.9} radius={rH} isAnimationActive={false} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lower Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">{d.charts.topMedications}</CardTitle>
              {!medsQ.isLoading && !medsQ.isFetching && medsQ.data && medsQ.data.length > 0 && (
                <CSVLink data={medsQ.data} filename="ilaclar.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV">
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2">
              {medsQ.isLoading || medsQ.isFetching ? <Skeleton className="w-full h-[320px] mx-4" /> : (
                <ResponsiveContainer width="100%" height={320} debounce={0}>
                  <BarChart data={medsQ.data?.slice(0, 10) || []} layout="vertical" margin={{ left: 0, right: 30, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                    <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }} />
                    <Bar dataKey="count" name={freqLabel} fill={CHART_COLORS.blue} fillOpacity={0.9} radius={rH} isAnimationActive={false} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">{d.charts.gelisTipi}</CardTitle>
                {!admitTypesQ.isLoading && !admitTypesQ.isFetching && admitTypesQ.data?.gelisTipi && admitTypesQ.data.gelisTipi.length > 0 && (
                  <CSVLink data={admitTypesQ.data.gelisTipi} filename="gelis-tipleri.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV">
                    <Download className="w-3.5 h-3.5" />
                  </CSVLink>
                )}
              </CardHeader>
              <CardContent className="px-2 pb-5">
                {admitTypesQ.isLoading || admitTypesQ.isFetching ? <Skeleton className="w-full h-[110px] mx-4" /> : (
                  <ResponsiveContainer width="100%" height={110} debounce={0}>
                    <BarChart data={admitTypesQ.data?.gelisTipi?.slice(0, 5) || []} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                      <YAxis dataKey="label" type="category" width={90} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }} />
                      <Bar dataKey="count" name={recordLabel} fill={CHART_COLORS.teal} fillOpacity={0.85} radius={rH} isAnimationActive={false} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">{d.charts.basvuruTipi}</CardTitle>
                {!admitTypesQ.isLoading && !admitTypesQ.isFetching && admitTypesQ.data?.basvuruTipi && admitTypesQ.data.basvuruTipi.length > 0 && (
                  <CSVLink data={admitTypesQ.data.basvuruTipi} filename="basvuru-tipleri.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV">
                    <Download className="w-3.5 h-3.5" />
                  </CSVLink>
                )}
              </CardHeader>
              <CardContent className="px-2 pb-5">
                {admitTypesQ.isLoading || admitTypesQ.isFetching ? <Skeleton className="w-full h-[200px] mx-4" /> : (
                  <ResponsiveContainer width="100%" height={200} debounce={0}>
                    <BarChart data={admitTypesQ.data?.basvuruTipi?.slice(0, 8) || []} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                      <YAxis dataKey="label" type="category" width={130} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }} />
                      <Bar dataKey="count" name={recordLabel} fill={CHART_COLORS.blue} fillOpacity={0.85} radius={rH} isAnimationActive={false} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Meds by Cancer Type */}
        <Card className="shadow-sm mb-6">
          <CardHeader className="px-5 pt-5 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">{d.charts.medsByCancerType}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{d.charts.medsByCancerTypeSubtitle}</p>
              </div>
              {!medsCancerQ.isLoading && !medsCancerQ.isFetching && medsCancerQ.data && selectedCancerType && (
                <CSVLink
                  data={medsCancerQ.data.find(c => c.cancerType === selectedCancerType)?.medications ?? []}
                  filename={`ilaclar-${selectedCancerType.toLowerCase()}.csv`}
                  className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }}
                  aria-label="CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </div>

            {/* Cancer type tab pills */}
            {!medsCancerQ.isLoading && medsCancerQ.data && medsCancerQ.data.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {medsCancerQ.data.map((item) => {
                  const active = item.cancerType === selectedCancerType;
                  return (
                    <button
                      key={item.cancerType}
                      onClick={() => setSelectedCancerType(item.cancerType)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:border-teal-400 hover:text-teal-600"
                      }`}
                    >
                      {item.cancerType}
                    </button>
                  );
                })}
              </div>
            )}
          </CardHeader>

          <CardContent className="px-2 pb-5">
            {medsCancerQ.isLoading || medsCancerQ.isFetching ? (
              <Skeleton className="w-full h-[280px] mx-4" />
            ) : !selectedCancerType || !medsCancerQ.data ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                {d.charts.selectCancerType}
              </div>
            ) : (() => {
              const entry = medsCancerQ.data.find(c => c.cancerType === selectedCancerType);
              const meds = entry?.medications ?? [];
              if (meds.length === 0) return (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">—</div>
              );
              const maxCount = Math.max(...meds.map(m => m.count));
              return (
                <ResponsiveContainer width="100%" height={Math.max(220, meds.length * 42)} debounce={0}>
                  <BarChart data={meds} layout="vertical" margin={{ left: 0, right: 60, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, maxCount * 1.12]}
                      tick={{ fontSize: 11, fill: tickColor }}
                      stroke={tickColor}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v)}
                    />
                    <YAxis
                      dataKey="label"
                      type="category"
                      width={160}
                      tick={{ fontSize: 11, fill: tickColor }}
                      stroke={tickColor}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }} />
                    <Bar
                      dataKey="count"
                      name={d.charts.frequency}
                      fill={CHART_COLORS.teal}
                      fillOpacity={0.9}
                      radius={rH}
                      isAnimationActive={false}
                      barSize={22}
                      label={{ position: "right", fontSize: 11, fill: tickColor, formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v) }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-base font-semibold">{patientRecordsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-2">
            <PatientTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
