import { AlertTriangle, TrendingUp, FlaskConical, Pill, Users, Activity } from "lucide-react";

interface Insight {
  icon: React.ReactNode;
  severity: "critical" | "warning" | "info";
  title: string;
  body: string;
  stat?: string;
}

const INSIGHTS: Insight[] = [
  {
    icon: <Users className="w-4 h-4" />,
    severity: "critical",
    title: "Yaşlı Hasta Yoğunluğu",
    body: "Hastaların %59,3'ü 60–79 yaş aralığında. Bu grup özel geriatrik onkoloji protokolleri gerektirmektedir.",
    stat: "%59,3",
  },
  {
    icon: <FlaskConical className="w-4 h-4" />,
    severity: "critical",
    title: "Genetik Test Açığı",
    body: "979 hastanın yalnızca 43'ünde (%4,4) genetik test kaydı mevcut. MSI, BRCA ve diğer prediktif biyobelirteçlerin sistematik kullanımı hedefe yönelik tedaviyi iyileştirebilir.",
    stat: "%4,4",
  },
  {
    icon: <Activity className="w-4 h-4" />,
    severity: "warning",
    title: "Laboratuvar Yükü",
    body: "Tüm klinik işlemlerin %56,7'si laboratuvar testlerinden oluşmaktadır. Bu oran laboravar kapasitesinin kritik bir darboğaz olduğuna işaret etmektedir.",
    stat: "%56,7",
  },
  {
    icon: <Pill className="w-4 h-4" />,
    severity: "warning",
    title: "Destekleyici Tedavi Ağırlığı",
    body: "En sık kullanılan ilaçlar kortikosteroid, antiemetik ve proton pompa inhibitörleridir — aktif kemoterapi protokollerinde standart destek tedavisini yansıtmaktadır.",
    stat: "Top 3",
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    severity: "info",
    title: "2023 Başvuru Artışı",
    body: "2023 başında aylık başvurularda belirgin bir zirve gözlemlenmektedir. Bu dönemin kapasite planlaması ve kaynak yönetimi açısından incelenmesi önerilir.",
    stat: "2023",
  },
  {
    icon: <AlertTriangle className="w-4 h-4" />,
    severity: "info",
    title: "Departman Yoğunlaşması",
    body: "Tüm başvuruların %96,8'i medikal onkolojide toplanmaktadır. Radyasyon onkolojisine yönlendirme oranı (%3,2) kemoradyoterapi protokolleri değerlendirilerek gözden geçirilmelidir.",
    stat: "%96,8",
  },
];

const SEVERITY_STYLES = {
  critical: {
    border: "border-l-[3px] border-l-red-500",
    iconBg: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400",
    statColor: "text-red-600 dark:text-red-400",
    badge: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900",
    badgeLabel: "Kritik",
  },
  warning: {
    border: "border-l-[3px] border-l-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    statColor: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900",
    badgeLabel: "Dikkat",
  },
  info: {
    border: "border-l-[3px] border-l-teal-500",
    iconBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400",
    statColor: "text-teal-600 dark:text-teal-400",
    badge: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-900",
    badgeLabel: "Bilgi",
  },
};

export function KeyInsights() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Temel Bulgular
        </h2>
        <span className="text-xs text-muted-foreground">{INSIGHTS.length} bulgu</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {INSIGHTS.map((insight, i) => {
          const s = SEVERITY_STYLES[insight.severity];
          return (
            <div
              key={i}
              className={`rounded-lg border bg-card px-4 py-3 ${s.border} flex gap-3 items-start`}
            >
              <div className={`shrink-0 rounded-md p-1.5 mt-0.5 ${s.iconBg}`}>
                {insight.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold leading-tight">{insight.title}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none ${s.badge}`}>
                    {s.badgeLabel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.body}</p>
                {insight.stat && (
                  <p className={`text-lg font-bold mt-1.5 leading-none tabular-nums ${s.statColor}`}>
                    {insight.stat}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
