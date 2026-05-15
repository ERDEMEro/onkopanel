import { AlertTriangle, TrendingUp, FlaskConical, Pill, Users, Activity } from "lucide-react";
import { useLang } from "@/context/LanguageContext";

interface Insight {
  icon: React.ReactNode;
  severity: "critical" | "warning" | "info";
  titleKey: string;
  bodyKey: string;
  stat: string;
}

const INSIGHTS_DATA: Insight[] = [
  {
    icon: <Users className="w-4 h-4" />,
    severity: "critical",
    titleKey: "elderlyTitle",
    bodyKey: "elderlyBody",
    stat: "%59,3",
  },
  {
    icon: <FlaskConical className="w-4 h-4" />,
    severity: "critical",
    titleKey: "geneticTitle",
    bodyKey: "geneticBody",
    stat: "%4,4",
  },
  {
    icon: <Activity className="w-4 h-4" />,
    severity: "warning",
    titleKey: "labTitle",
    bodyKey: "labBody",
    stat: "%56,7",
  },
  {
    icon: <Pill className="w-4 h-4" />,
    severity: "warning",
    titleKey: "supportTitle",
    bodyKey: "supportBody",
    stat: "Top 3",
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    severity: "info",
    titleKey: "trendTitle",
    bodyKey: "trendBody",
    stat: "2023",
  },
  {
    icon: <AlertTriangle className="w-4 h-4" />,
    severity: "info",
    titleKey: "deptTitle",
    bodyKey: "deptBody",
    stat: "%96,8",
  },
];

const INSIGHTS_TR: Record<string, string> = {
  elderlyTitle: "Yaşlı Hasta Yoğunluğu",
  elderlyBody: "Hastaların %59,3'ü 60–79 yaş aralığında. Bu grup özel geriatrik onkoloji protokolleri gerektirmektedir.",
  geneticTitle: "Genetik Test Açığı",
  geneticBody: "979 hastanın yalnızca 43'ünde (%4,4) genetik test kaydı mevcut. MSI, BRCA ve diğer prediktif biyobelirteçlerin sistematik kullanımı hedefe yönelik tedaviyi iyileştirebilir.",
  labTitle: "Laboratuvar Yükü",
  labBody: "Tüm klinik işlemlerin %56,7'si laboratuvar testlerinden oluşmaktadır. Bu oran laboravar kapasitesinin kritik bir darboğaz olduğuna işaret etmektedir.",
  supportTitle: "Destekleyici Tedavi Ağırlığı",
  supportBody: "En sık kullanılan ilaçlar kortikosteroid, antiemetik ve proton pompa inhibitörleridir — aktif kemoterapi protokollerinde standart destek tedavisini yansıtmaktadır.",
  trendTitle: "2023 Başvuru Artışı",
  trendBody: "2023 başında aylık başvurularda belirgin bir zirve gözlemlenmektedir. Bu dönemin kapasite planlaması ve kaynak yönetimi açısından incelenmesi önerilir.",
  deptTitle: "Departman Yoğunlaşması",
  deptBody: "Tüm başvuruların %96,8'i medikal onkolojide toplanmaktadır. Radyasyon onkolojisine yönlendirme oranı (%3,2) kemoradyoterapi protokolleri değerlendirilerek gözden geçirilmelidir.",
};

const INSIGHTS_EN: Record<string, string> = {
  elderlyTitle: "Elderly Patient Concentration",
  elderlyBody: "59.3% of patients are in the 60–79 age range. This group requires specialized geriatric oncology protocols.",
  geneticTitle: "Genetic Testing Gap",
  geneticBody: "Only 43 of 979 patients (4.4%) have a genetic test record. Systematic use of MSI, BRCA and other predictive biomarkers could improve targeted therapy decisions.",
  labTitle: "Laboratory Bottleneck",
  labBody: "56.7% of all clinical procedures are laboratory tests, indicating that lab capacity is a critical bottleneck.",
  supportTitle: "Supportive Care Prevalence",
  supportBody: "The most frequently used medications are corticosteroids, antiemetics, and proton pump inhibitors — reflecting standard supportive care in active chemotherapy protocols.",
  trendTitle: "2023 Admission Surge",
  trendBody: "A significant peak in monthly admissions is observed at the start of 2023. This period warrants review from a capacity planning and resource management perspective.",
  deptTitle: "Department Concentration",
  deptBody: "96.8% of all admissions are in medical oncology. The referral rate to radiation oncology (3.2%) should be reviewed in the context of chemoradiation protocols.",
};

const SEVERITY_STYLES = {
  critical: {
    border: "border-l-[3px] border-l-red-500",
    iconBg: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400",
    statColor: "text-red-600 dark:text-red-400",
    badge: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900",
  },
  warning: {
    border: "border-l-[3px] border-l-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    statColor: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900",
  },
  info: {
    border: "border-l-[3px] border-l-teal-500",
    iconBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400",
    statColor: "text-teal-600 dark:text-teal-400",
    badge: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-900",
  },
};

export function KeyInsights() {
  const { lang, t } = useLang();
  const dict = lang === "en" ? INSIGHTS_EN : INSIGHTS_TR;
  const badgeLabel = { critical: t.dashboard.severity.critical, warning: t.dashboard.severity.warning, info: t.dashboard.severity.info };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t.dashboard.sections.keyInsights}
        </h2>
        <span className="text-xs text-muted-foreground">{INSIGHTS_DATA.length} {t.dashboard.sections.findings}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {INSIGHTS_DATA.map((insight, i) => {
          const s = SEVERITY_STYLES[insight.severity];
          return (
            <div key={i} className={`rounded-lg border bg-card px-4 py-3 ${s.border} flex gap-3 items-start`}>
              <div className={`shrink-0 rounded-md p-1.5 mt-0.5 ${s.iconBg}`}>{insight.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold leading-tight">{dict[insight.titleKey]}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none ${s.badge}`}>
                    {badgeLabel[insight.severity]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{dict[insight.bodyKey]}</p>
                {insight.stat && (
                  <p className={`text-lg font-bold mt-1.5 leading-none tabular-nums ${s.statColor}`}>{insight.stat}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
