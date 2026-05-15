import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  useGetPatients,
  getGetOncologySummaryQueryKey,
  getGetGenderDistributionQueryKey,
  getGetAgeDistributionQueryKey,
  getGetDepartmentDistributionQueryKey,
  getGetAdmissionTypesQueryKey,
  getGetGeneticTestsQueryKey,
  getGetTopMedicationsQueryKey,
  getGetProcedureTypesQueryKey,
  getGetAdmissionTrendQueryKey,
  getGetPatientsQueryKey,
} from "@workspace/api-client-react";
import { CSVLink } from "react-csv";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  RefreshCw, ChevronDown, Check, Sun, Moon, Download, Printer, ArrowUp, ArrowDown
} from "lucide-react";
import { PatientTable } from "@/components/patient-table";
import { KeyInsights } from "@/components/key-insights";

const CHART_COLORS = {
  blue: "#0079F2",
  purple: "#795EFF",
  green: "#009118",
  red: "#A60808",
  pink: "#ec4899",
  teal: "#0d9488",
  lightTeal: "#14b8a6",
  slate: "#64748b"
};

const CHART_COLOR_LIST = [
  CHART_COLORS.teal,
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.slate,
  CHART_COLORS.pink,
];

const DATA_SOURCES = ["App DB"];

const INTERVAL_OPTIONS = [
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
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "6px",
        padding: "10px 14px",
        border: "1px solid #e0e0e0",
        color: "#1a1a1a",
        fontSize: "13px",
      }}
    >
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

function KPICard({ title, value, loading, valueColor = CHART_COLORS.teal }: { title: string; value?: React.ReactNode; loading?: boolean; valueColor?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        {loading ? (
          <>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2 tracking-tight" style={{ color: valueColor }}>{value ?? "--"}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [intervalMs, setIntervalMs] = useState(5 * 60 * 1000);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Queries
  const summaryQ = useGetOncologySummary({ query: { enabled: true, queryKey: getGetOncologySummaryQueryKey() } });
  const genderQ = useGetGenderDistribution({ query: { enabled: true, queryKey: getGetGenderDistributionQueryKey() } });
  const ageQ = useGetAgeDistribution({ query: { enabled: true, queryKey: getGetAgeDistributionQueryKey() } });
  const deptQ = useGetDepartmentDistribution({ query: { enabled: true, queryKey: getGetDepartmentDistributionQueryKey() } });
  const admitTypesQ = useGetAdmissionTypes({ query: { enabled: true, queryKey: getGetAdmissionTypesQueryKey() } });
  const testsQ = useGetGeneticTests({ query: { enabled: true, queryKey: getGetGeneticTestsQueryKey() } });
  const medsQ = useGetTopMedications({ query: { enabled: true, queryKey: getGetTopMedicationsQueryKey() } });
  const procQ = useGetProcedureTypes({ query: { enabled: true, queryKey: getGetProcedureTypesQueryKey() } });
  const trendQ = useGetAdmissionTrend({ query: { enabled: true, queryKey: getGetAdmissionTrendQueryKey() } });

  const loading = summaryQ.isLoading || summaryQ.isFetching || 
                  genderQ.isLoading || genderQ.isFetching ||
                  trendQ.isLoading || trendQ.isFetching;

  // Effects
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    if (loading) {
      setIsSpinning(true);
    } else {
      const t = setTimeout(() => setIsSpinning(false), 600);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [autoRefresh, intervalMs]);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const lastRefreshed = summaryQ.dataUpdatedAt ? new Date(summaryQ.dataUpdatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : null;
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const mainChartColor = isDark ? CHART_COLORS.lightTeal : CHART_COLORS.teal;

  return (
    <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-4">
          <div className="pt-2">
            <h1 className="font-bold text-[32px] tracking-tight">Onkoloji Veri Panosu</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">Klinik hasta demografisi ve tedavi trendleri</p>
            {DATA_SOURCES.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="text-[12px] text-muted-foreground shrink-0">Veri Kaynağı:</span>
                {DATA_SOURCES.map((source) => (
                  <span
                    key={source}
                    className="text-[12px] font-medium rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
                    title={source}
                    style={{
                      maxWidth: "20ch",
                      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
                      color: isDark ? "#cbd5e1" : "#475569",
                    }}
                  >
                    {source}
                  </span>
                ))}
              </div>
            )}
            {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-1.5">Son güncelleme: {lastRefreshed}</p>}
          </div>
          
          <div className="flex items-center gap-3 pt-2 print:hidden">
            {/* Split Refresh */}
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center rounded-[6px] overflow-hidden h-[30px] text-[13px] border"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                  color: isDark ? "#e2e8f0" : "#334155",
                }}
              >
                <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-1.5 px-3 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
                  Yenile
                </button>
                <div className="w-px h-5 shrink-0" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0" }} />
                <button onClick={() => setDropdownOpen((o) => !o)} className="flex items-center justify-center px-2 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-md border shadow-lg bg-popover text-popover-foreground z-50 py-1 text-sm">
                  <div className="px-3 py-2 border-b flex items-center justify-between">
                    <span className="font-medium text-xs text-muted-foreground">Otomatik Yenileme</span>
                    <button 
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`w-8 h-4 rounded-full relative transition-colors ${autoRefresh ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${autoRefresh ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {INTERVAL_OPTIONS.map(opt => (
                    <button
                      key={opt.ms}
                      className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-muted transition-colors disabled:opacity-50"
                      disabled={!autoRefresh}
                      onClick={() => {
                        setIntervalMs(opt.ms);
                        setDropdownOpen(false);
                      }}
                    >
                      {opt.label}
                      {intervalMs === opt.ms && <Check className="w-4 h-4 text-teal-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => window.print()}
              disabled={loading}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-[6px] transition-colors disabled:opacity-50 border"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                color: isDark ? "#e2e8f0" : "#334155",
              }}
              aria-label="PDF'e Aktar"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDark((d) => !d)}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-[6px] transition-colors border"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                color: isDark ? "#e2e8f0" : "#334155",
              }}
              aria-label="Karanlık Mod"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <KPICard title="Toplam Hasta" value={summaryQ.data?.totalPatients} loading={summaryQ.isLoading || summaryQ.isFetching} />
          <KPICard title="Toplam Başvuru" value={summaryQ.data?.totalAdmissions} loading={summaryQ.isLoading || summaryQ.isFetching} />
          <KPICard title="Ortalama Yaş" value={summaryQ.data?.averageAge ? Math.round(summaryQ.data.averageAge) : "--"} loading={summaryQ.isLoading || summaryQ.isFetching} />
          <KPICard title="Bölüm Sayısı" value={summaryQ.data?.departmentCount} loading={summaryQ.isLoading || summaryQ.isFetching} />
          <KPICard title="Kadın Hasta" value={summaryQ.data?.femaleCount} loading={summaryQ.isLoading || summaryQ.isFetching} valueColor={CHART_COLORS.purple} />
          <KPICard title="Genetik Testli" value={summaryQ.data?.withGeneticTest} loading={summaryQ.isLoading || summaryQ.isFetching} valueColor={CHART_COLORS.blue} />
        </div>

        {/* Key Insights */}
        <KeyInsights />

        {/* Top Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Card className="lg:col-span-2">
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Aylık Başvuru Trendi</CardTitle>
              {!trendQ.isLoading && !trendQ.isFetching && trendQ.data && trendQ.data.length > 0 && (
                <CSVLink data={trendQ.data} filename="aylik-basvuru.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV İndir">
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
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', stroke: 'none' }} />
                    <Area type="monotone" dataKey="count" name="Başvuru" fill="url(#gradientTrend)" stroke={mainChartColor} fillOpacity={1} strokeWidth={2} activeDot={{ r: 5, fill: mainChartColor, stroke: isDark ? '#1e293b' : '#ffffff', strokeWidth: 2 }} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Cinsiyet Dağılımı</CardTitle>
              {!genderQ.isLoading && !genderQ.isFetching && genderQ.data && genderQ.data.length > 0 && (
                <CSVLink data={genderQ.data} filename="cinsiyet-dagilimi.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV İndir">
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent>
              {genderQ.isLoading || genderQ.isFetching ? <Skeleton className="w-full h-[320px]" /> : (
                <ResponsiveContainer width="100%" height={320} debounce={0}>
                  <PieChart>
                    <Pie data={genderQ.data || []} dataKey="count" nameKey="label" cx="50%" cy="45%" innerRadius={70} outerRadius={110} cornerRadius={3} paddingAngle={2} isAnimationActive={false} stroke="none">
                      {(genderQ.data || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]} />
                      ))}
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
              <CardTitle className="text-base font-semibold">Yaş Dağılımı</CardTitle>
              {!ageQ.isLoading && !ageQ.isFetching && ageQ.data && ageQ.data.length > 0 && (
                <CSVLink data={ageQ.data} filename="yas-dagilimi.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV İndir">
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
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="count" name="Hasta" fill={mainChartColor} fillOpacity={0.9} radius={[3, 3, 0, 0]} isAnimationActive={false} activeBar={{ fillOpacity: 1 }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Poliklinik Dağılımı</CardTitle>
              {!deptQ.isLoading && !deptQ.isFetching && deptQ.data && deptQ.data.length > 0 && (
                <CSVLink data={deptQ.data} filename="bolum-dagilimi.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV İndir">
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
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="count" name="Başvuru" fill={CHART_COLORS.purple} fillOpacity={0.9} radius={[0, 3, 3, 0]} isAnimationActive={false} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">İşlem Tipleri</CardTitle>
              {!procQ.isLoading && !procQ.isFetching && procQ.data && procQ.data.length > 0 && (
                <CSVLink data={procQ.data} filename="islem-tipleri.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV İndir">
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
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="count" name="İşlem" fill={CHART_COLORS.pink} fillOpacity={0.9} radius={[0, 3, 3, 0]} isAnimationActive={false} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Genetik Testler</CardTitle>
              {!testsQ.isLoading && !testsQ.isFetching && testsQ.data && testsQ.data.length > 0 && (
                <CSVLink data={testsQ.data} filename="genetik-testler.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV İndir">
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2">
              {testsQ.isLoading || testsQ.isFetching ? <Skeleton className="w-full h-[280px] mx-4" /> : (
                <ResponsiveContainer width="100%" height={280} debounce={0}>
                  <BarChart data={testsQ.data?.slice(0, 8) || []} layout="vertical" margin={{ left: 0, right: 15, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="count" name="Test" fill={CHART_COLORS.slate} fillOpacity={0.9} radius={[0, 3, 3, 0]} isAnimationActive={false} barSize={20} />
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
              <CardTitle className="text-base font-semibold">En Sık Kullanılan İlaçlar</CardTitle>
              {!medsQ.isLoading && !medsQ.isFetching && medsQ.data && medsQ.data.length > 0 && (
                <CSVLink data={medsQ.data} filename="ilaclar.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569" }} aria-label="CSV İndir">
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-2">
              {medsQ.isLoading || medsQ.isFetching ? <Skeleton className="w-full h-[320px] mx-4" /> : (
                <ResponsiveContainer width="100%" height={320} debounce={0}>
                  <BarChart data={medsQ.data?.slice(0, 10) || []} layout="vertical" margin={{ left: 0, right: 15, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <YAxis dataKey="label" type="category" width={160} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="count" name="Sıklık" fill={CHART_COLORS.blue} fillOpacity={0.9} radius={[0, 3, 3, 0]} isAnimationActive={false} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">Geliş Tipleri</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-5">
                {admitTypesQ.isLoading || admitTypesQ.isFetching ? <Skeleton className="w-full h-[120px] mx-4" /> : (
                  <ResponsiveContainer width="100%" height={120} debounce={0}>
                    <BarChart data={admitTypesQ.data?.gelisTipi || []} layout="vertical" margin={{ left: 0, right: 15, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
                      <Bar dataKey="count" name="Başvuru" fill={CHART_COLORS.slate} fillOpacity={0.8} radius={[0, 3, 3, 0]} isAnimationActive={false} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">Başvuru Tipleri</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-5">
                {admitTypesQ.isLoading || admitTypesQ.isFetching ? <Skeleton className="w-full h-[120px] mx-4" /> : (
                  <ResponsiveContainer width="100%" height={120} debounce={0}>
                    <BarChart data={admitTypesQ.data?.basvuruTipi || []} layout="vertical" margin={{ left: 0, right: 15, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
                      <Bar dataKey="count" name="Başvuru" fill={CHART_COLORS.slate} fillOpacity={0.8} radius={[0, 3, 3, 0]} isAnimationActive={false} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Patient Table Area */}
        <Card className="shadow-sm">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-base font-semibold">Hasta Kayıtları</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-2">
            <PatientTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
