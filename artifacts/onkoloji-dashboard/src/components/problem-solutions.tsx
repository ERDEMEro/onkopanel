import { AlertTriangle, FlaskConical, Activity, Pill, TrendingUp, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/context/LanguageContext";

interface Solution { step: string; detail: string; }
interface Problem {
  id: string;
  icon: React.ReactNode;
  severity: "critical" | "warning" | "opportunity";
  tr: { problem: string; stat: string; statLabel: string; rootCause: string; solutions: Solution[]; impact: string; };
  en: { problem: string; stat: string; statLabel: string; rootCause: string; solutions: Solution[]; impact: string; };
}

const PROBLEMS: Problem[] = [
  {
    id: "genetic-gap",
    icon: <FlaskConical className="w-5 h-5" />,
    severity: "critical",
    tr: {
      problem: "Genetik Test Yetersizliği", stat: "%4,4", statLabel: "Hastalarda genetik test kaydı",
      rootCause: "979 hastadan yalnızca 43'ünde genetik test verisi mevcut. MSI, BRCA ve EGFR gibi prediktif biyobelirteçler olmadan hedefe yönelik tedavi kararları klinik veriye değil deneyime dayanmak zorunda kalıyor.",
      solutions: [
        { step: "Reflex test protokolü oluştur", detail: "Medikal onkoloji tarafından onaylanan bir kanser türleri listesi için histopatolojik tanı anında otomatik MSI, KRAS, EGFR ve PD-L1 testi tetiklensin." },
        { step: "Genetik danışmanlık birimi kur", detail: "Kalıtsal sendrom riski taşıyan hastalara (meme, kolorektal, over) BRCA1/2 ve Lynch sendromu paneli için yönlendirme yolu oluştur." },
        { step: "Genomik veriyi HIS'e entegre et", detail: "Test sonuçlarının ayrı sistemde tutulması yerine hasta kaydına bağlanması; klinisyenin karar anında veriye erişimini sağlar." },
      ],
      impact: "Hedefe yönelik tedavi ve immünoterapi uygunluğunun doğru belirlenmesiyle yaşam kalitesi artışı ve gereksiz kemoterapinin azaltılması beklenir.",
    },
    en: {
      problem: "Genetic Testing Gap", stat: "4.4%", statLabel: "Patients with genetic test record",
      rootCause: "Only 43 of 979 patients have genetic test data. Without predictive biomarkers like MSI, BRCA, and EGFR, targeted therapy decisions rely on experience rather than molecular evidence.",
      solutions: [
        { step: "Establish reflex testing protocol", detail: "Trigger automatic MSI, KRAS, EGFR and PD-L1 testing at histopathological diagnosis for an approved list of cancer types." },
        { step: "Set up genetic counseling unit", detail: "Create a referral pathway for patients with hereditary syndrome risk (breast, colorectal, ovarian) for BRCA1/2 and Lynch syndrome panels." },
        { step: "Integrate genomic data into HIS", detail: "Link test results to patient records instead of keeping them in separate systems, enabling clinicians to access data at the point of decision." },
      ],
      impact: "Expected to improve quality of life through accurate identification of targeted therapy and immunotherapy eligibility and reduction of unnecessary chemotherapy.",
    },
  },
  {
    id: "elderly-care",
    icon: <AlertTriangle className="w-5 h-5" />,
    severity: "critical",
    tr: {
      problem: "Yaşlı Hasta İçin Özelleşmiş Protokol Eksikliği", stat: "%59,3", statLabel: "Hastalar 60–79 yaş aralığında",
      rootCause: "Hastaların büyük çoğunluğu, standart kemoterapi dozlarında toksisiteye daha duyarlı yaşlı bireylerden oluşuyor. Polifarmasi, düşme riski ve kognitif durum gibi geriatrik faktörler rutin değerlendirmeye dahil edilmeyebilir.",
      solutions: [
        { step: "G8 Geriatrik Tarama Uygula", detail: "70 yaş ve üzeri tüm hastalara ilk başvuruda G8 tarama aracı uygulanarak kapsamlı geriatrik değerlendirme (KGD) gereksinimi belirlenmeli." },
        { step: "Doz modifikasyon rehberi oluştur", detail: "Kreatinin klerensi, albümin düzeyi ve performans durumuna göre otomatik doz önerisi sunan karar destek aracı geliştir." },
        { step: "Çok disiplinli konsültasyon ekibi", detail: "Geriatri, eczacılık ve beslenme uzmanlarını kapsayan haftalık tümör konseyi toplantısına 75 yaş üzeri hastaları dahil et." },
      ],
      impact: "Tedavi tamamlama oranının artması, hastane yatış süresinin kısalması ve yaşlı hastalarda yaşam kalitesinin iyileşmesi beklenir.",
    },
    en: {
      problem: "Lack of Specialized Protocols for Elderly Patients", stat: "59.3%", statLabel: "Patients aged 60–79",
      rootCause: "The majority of patients are elderly individuals who are more susceptible to toxicity at standard chemotherapy doses. Geriatric factors such as polypharmacy, fall risk, and cognitive status may not be included in routine assessment.",
      solutions: [
        { step: "Implement G8 Geriatric Screening", detail: "Apply the G8 screening tool at first visit for all patients aged 70+ to determine the need for comprehensive geriatric assessment (CGA)." },
        { step: "Create dose modification guide", detail: "Develop a decision support tool that automatically suggests dose adjustments based on creatinine clearance, albumin level, and performance status." },
        { step: "Multidisciplinary consultation team", detail: "Include patients over 75 in the weekly tumor board meeting covering geriatrics, pharmacy, and nutrition specialists." },
      ],
      impact: "Expected to increase treatment completion rates, shorten hospital stays, and improve quality of life in elderly patients.",
    },
  },
  {
    id: "lab-bottleneck",
    icon: <Activity className="w-5 h-5" />,
    severity: "warning",
    tr: {
      problem: "Laboratuvar Kapasitesi Darboğazı", stat: "%56,7", statLabel: "Tüm işlemler laboratuvar",
      rootCause: "Klinik işlemlerin yarısından fazlası laboratuvar testlerinden oluşuyor. Yoğun kemoterapi izlem gereksinimleri tekrar eden test döngüleri yaratıyor.",
      solutions: [
        { step: "Tam otomatik hematoloji analiz hattı", detail: "CBC + biyokimya analizlerini paralel işleyebilen otomatik sistemler; tüp sıralama ve sonuç aktarımını entegre şekilde yönetebilir." },
        { step: "Poliklinik öncesi test günü modeli", detail: "Hastaların doktor muayenesinden bir gün önce kan aldırması; klinisyenin vizite sırasında sonuçlara sahip olmasını sağlar." },
        { step: "Kritik değer bildirim otomasyonu", detail: "Sonuç sisteminden sorumlu hemşireye anlık SMS/bildirim akışı; telefon bekleme süresini ortadan kaldırır." },
      ],
      impact: "Tüp-sonuç döngüsünün %30–40 kısalması, hasta akışının hızlanması ve poliklinik kapasitesinin artması beklenir.",
    },
    en: {
      problem: "Laboratory Capacity Bottleneck", stat: "56.7%", statLabel: "All procedures are laboratory tests",
      rootCause: "More than half of clinical procedures are laboratory tests. Intensive chemotherapy monitoring requirements create repeated test cycles, increasing patient wait times and staff workload.",
      solutions: [
        { step: "Fully automated hematology pipeline", detail: "Automated systems that can process CBC + biochemistry analyses in parallel, managing tube sorting and result transfer in an integrated manner." },
        { step: "Pre-clinic test day model", detail: "Having patients draw blood one day before the doctor's visit ensures the clinician has results during the visit and eliminates a second visit." },
        { step: "Critical value notification automation", detail: "Instant SMS/notification flow from the result system to the responsible nurse; eliminates telephone wait times." },
      ],
      impact: "Expected to shorten the tube-to-result cycle by 30–40%, accelerate patient flow, and increase outpatient capacity.",
    },
  },
  {
    id: "supportive-care",
    icon: <Pill className="w-5 h-5" />,
    severity: "warning",
    tr: {
      problem: "Destekleyici Tedavi Standardizasyonu", stat: "Top 3", statLabel: "İlaç: steroid, antiemetik, PPI",
      rootCause: "En sık kullanılan ilaçlar antiemetik, kortikosteroid ve proton pompa inhibitörlerinden oluşuyor. Klinisyenler arasında protokol farklılıkları gereksiz ilaç maruziyeti ve maliyet artışına yol açabilir.",
      solutions: [
        { step: "Kemoterapi öncesi premedikasyon şablonu", detail: "Rejimlere özel (FOLFOX, AC-T, CHOP vb.) standart premedikasyon setleri elektronik ilaç sipariş sistemine yüklensin." },
        { step: "Antiemetik basamak protokolü", detail: "Emetojenik potansiyele göre NK1 antagonisti, 5-HT3 antagonisti ve deksametazon kombinasyonlarını belirleyen rehber oluştur." },
        { step: "İlaç yönetim kurulu izlemi", detail: "Aylık ilaç kullanım raporlarıyla yüksek tüketimli ürünlerin gözden geçirilmesi; alternatif formülasyon ve toplu satın alma fırsatlarını değerlendir." },
      ],
      impact: "Premedikasyon hata oranının azalması, ilaç maliyetinin %10–15 düşmesi ve bulantı-kusma yönetiminde tutarlılık beklenir.",
    },
    en: {
      problem: "Supportive Care Standardization", stat: "Top 3", statLabel: "Drugs: steroid, antiemetic, PPI",
      rootCause: "The most frequently used medications are antiemetics, corticosteroids, and proton pump inhibitors. Protocol variations among clinicians may lead to unnecessary drug exposure and cost increases.",
      solutions: [
        { step: "Pre-chemotherapy premedication template", detail: "Load regimen-specific (FOLFOX, AC-T, CHOP, etc.) standard premedication sets into the electronic medication order system." },
        { step: "Antiemetic step protocol", detail: "Create a guide defining NK1 antagonist, 5-HT3 antagonist, and dexamethasone combinations based on emetogenic potential." },
        { step: "Drug management board monitoring", detail: "Monthly drug usage reports to review high-consumption products and evaluate alternative formulations and bulk purchasing opportunities." },
      ],
      impact: "Expected to reduce premedication error rates, lower drug costs by 10–15%, and improve consistency in nausea-vomiting management.",
    },
  },
  {
    id: "dept-concentration",
    icon: <Building2 className="w-5 h-5" />,
    severity: "opportunity",
    tr: {
      problem: "Radyasyon Onkolojisi Yönlendirme Açığı", stat: "%3,2", statLabel: "Başvurular radyasyon onkolojisinde",
      rootCause: "Kemoradyoterapinin standart olduğu kanser türlerinde radyasyon onkolojisine yönlendirme oranı oldukça düşük. Bu durum hasta koordinasyon eksikliğine veya dış merkez kullanımına işaret edebilir.",
      solutions: [
        { step: "Çok disiplinli tümör konseyi zorunluluğu", detail: "Baş-boyun, GI ve jinekolojik maligniteler için radyasyon onkolojisi uzmanının tümör konseyine katılımını protokole dahil et." },
        { step: "Eş zamanlı yönlendirme akışı", detail: "Medikal onkoloji sistemi üzerinden \"Radyasyon konsültasyonu gerekli\" butonu; konsültasyon sürecini aynı gün başlatsın." },
        { step: "Dış merkez hastalarını kayıt altına al", detail: "Başka kurumda radyoterapi alan hastaların tedavilerini kliniğin HIS sistemine kaydetmesi için standart form ve süreç oluştur." },
      ],
      impact: "Kombine tedavi uyumunun artması, hasta yolculuğunun tek merkezde tamamlanması ve radyasyon bölümü kapasitesinin daha verimli kullanılması beklenir.",
    },
    en: {
      problem: "Radiation Oncology Referral Gap", stat: "3.2%", statLabel: "Admissions in radiation oncology",
      rootCause: "The referral rate to radiation oncology is very low for cancer types where chemoradiation is standard. This may indicate a lack of patient coordination or use of external centers.",
      solutions: [
        { step: "Mandatory multidisciplinary tumor board", detail: "Include radiation oncology specialists in tumor board for head-neck, GI and gynecological malignancies." },
        { step: "Simultaneous referral workflow", detail: "A 'Radiation consultation required' button in the medical oncology system that initiates the consultation process on the same day." },
        { step: "Record external center patients", detail: "Create a standard form and process for recording treatments of patients receiving radiotherapy at another institution in the clinic's HIS system." },
      ],
      impact: "Expected to increase combined treatment adherence, complete the patient journey at a single center, and use radiation department capacity more efficiently.",
    },
  },
  {
    id: "admission-spike",
    icon: <TrendingUp className="w-5 h-5" />,
    severity: "opportunity",
    tr: {
      problem: "Başvuru Artışına Kapasitede Hazırlıksızlık", stat: "2023", statLabel: "Aylık başvuruda belirgin zirve",
      rootCause: "2023 başında başvurularda görülen ani artış, mevcut insan kaynağı ve altyapı planlamasının bu düzeyi karşılayıp karşılayamadığını sorgulatıyor.",
      solutions: [
        { step: "2023 artışının kök neden analizi", detail: "Yeni tanı mı, transferler mi, yoksa yakalama dönemi mi? Hasta kaydı verisi ve epikriz kodlarıyla artışın türünü belirle." },
        { step: "Esnek randevu kapasitesi modeli", detail: "Bir önceki ayın başvuru sayısına göre bir sonraki ay için dinamik kapasite ayarı yapan haftalık planlama toplantısı kur." },
        { step: "Tele-onkoloji ile yük dağılımı", detail: "Stabil takip hastalarının belirli kontrollerini tele-muayene ile gerçekleştirerek poliklinik fiziksel kapasitesi yeni başvurular için aç." },
      ],
      impact: "Hasta bekleme sürelerinin kısalması, klinisyen tükenmişlik riskinin azalması ve artan talebe karşı ölçeklenebilir bir hizmet modeli oluşturulması beklenir.",
    },
    en: {
      problem: "Unpreparedness for Admission Surge", stat: "2023", statLabel: "Notable peak in monthly admissions",
      rootCause: "The sudden surge in admissions at the start of 2023 raises questions about whether existing HR and infrastructure planning can meet this level of demand.",
      solutions: [
        { step: "Root cause analysis of 2023 surge", detail: "New diagnoses, transfers, or catch-up period? Determine the type of surge using patient record data and epicrisis codes." },
        { step: "Flexible appointment capacity model", detail: "Set up weekly planning meetings that dynamically adjust next month's capacity based on the previous month's admission count." },
        { step: "Load distribution via tele-oncology", detail: "Conduct certain follow-up visits for stable patients via tele-consultation, freeing physical outpatient capacity for new admissions." },
      ],
      impact: "Expected to shorten patient wait times, reduce clinician burnout risk, and create a scalable service model for increasing demand.",
    },
  },
];

const SEVERITY_STYLE = {
  critical: {
    badge: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900",
    iconBg: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400",
    border: "border-l-4 border-l-red-500",
    stat: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  warning: {
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900",
    iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    border: "border-l-4 border-l-amber-500",
    stat: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  opportunity: {
    badge: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-900",
    iconBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400",
    border: "border-l-4 border-l-teal-500",
    stat: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
  },
};

function ProblemCard({ p }: { p: Problem }) {
  const [open, setOpen] = useState(false);
  const { lang, t } = useLang();
  const s = SEVERITY_STYLE[p.severity];
  const d = lang === "en" ? p.en : p.tr;
  const badgeMap = { critical: t.dashboard.severity.critical, warning: t.dashboard.severity.warning, opportunity: t.dashboard.severity.opportunity };
  const rootCauseLabel = lang === "en" ? "Root Cause" : "Kök Neden";
  const solutionsLabel = lang === "en" ? "Solution Steps" : "Çözüm Adımları";
  const impactLabel = lang === "en" ? "Expected Impact" : "Beklenen Etki";

  return (
    <div className={`rounded-lg border bg-card overflow-hidden ${s.border}`}>
      <button className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-muted/40 transition-colors" onClick={() => setOpen((o) => !o)}>
        <div className={`shrink-0 rounded-lg p-2 mt-0.5 ${s.iconBg}`}>{p.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{d.problem}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${s.badge}`}>{badgeMap[p.severity]}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold tabular-nums leading-none ${s.stat}`}>{d.stat}</span>
            <span className="text-xs text-muted-foreground">{d.statLabel}</span>
          </div>
        </div>
        <div className="shrink-0 mt-1 text-muted-foreground">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t pt-4 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{rootCauseLabel}</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{d.rootCause}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{solutionsLabel}</p>
            <ol className="space-y-3">
              {d.solutions.map((sol, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`shrink-0 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center text-white mt-0.5 ${s.dot}`}>{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold leading-tight mb-0.5">{sol.step}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{sol.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-md px-4 py-3" style={{ backgroundColor: "rgba(0,145,24,0.07)" }}>
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">{impactLabel}</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{d.impact}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProblemSolutions() {
  const { t } = useLang();
  const critical = PROBLEMS.filter((p) => p.severity === "critical");
  const warning = PROBLEMS.filter((p) => p.severity === "warning");
  const opportunity = PROBLEMS.filter((p) => p.severity === "opportunity");

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t.dashboard.sections.problemSolutions}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t.dashboard.sections.problemSubtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{t.dashboard.severity.critical}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />{t.dashboard.severity.warning}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />{t.dashboard.severity.opportunity}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {[...critical, ...warning, ...opportunity].map((p) => <ProblemCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
