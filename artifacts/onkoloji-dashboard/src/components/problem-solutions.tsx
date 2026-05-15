import { AlertTriangle, FlaskConical, Activity, Pill, TrendingUp, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Solution {
  step: string;
  detail: string;
}

interface Problem {
  id: string;
  icon: React.ReactNode;
  severity: "critical" | "warning" | "opportunity";
  problem: string;
  stat: string;
  statLabel: string;
  rootCause: string;
  solutions: Solution[];
  impact: string;
}

const PROBLEMS: Problem[] = [
  {
    id: "genetic-gap",
    icon: <FlaskConical className="w-5 h-5" />,
    severity: "critical",
    problem: "Genetik Test Yetersizliği",
    stat: "%4,4",
    statLabel: "Hastalarda genetik test kaydı",
    rootCause:
      "979 hastadan yalnızca 43'ünde genetik test verisi mevcut. MSI, BRCA ve EGFR gibi prediktif biyobelirteçler olmadan hedefe yönelik tedavi kararları klinik veriye değil deneyime dayanmak zorunda kalıyor.",
    solutions: [
      {
        step: "Reflex test protokolü oluştur",
        detail:
          "Medikal onkoloji tarafından onaylanan bir kanser türleri listesi için histopatolojik tanı anında otomatik MSI, KRAS, EGFR ve PD-L1 testi tetiklensin.",
      },
      {
        step: "Genetik danışmanlık birimi kur",
        detail:
          "Kalıtsal sendrom riski taşıyan hastalara (meme, kolorektal, over) BRCA1/2 ve Lynch sendromu paneli için yönlendirme yolu oluştur.",
      },
      {
        step: "Genomik veriyi HIS'e entegre et",
        detail:
          "Test sonuçlarının ayrı sistemde tutulması yerine hasta kaydına bağlanması; klinisyenin karar anında veriye erişimini sağlar.",
      },
    ],
    impact:
      "Hedefe yönelik tedavi ve immünoterapi uygunluğunun doğru belirlenmesiyle yaşam kalitesi artışı ve gereksiz kemoterapinin azaltılması beklenir.",
  },
  {
    id: "elderly-care",
    icon: <AlertTriangle className="w-5 h-5" />,
    severity: "critical",
    problem: "Yaşlı Hasta İçin Özelleşmiş Protokol Eksikliği",
    stat: "%59,3",
    statLabel: "Hastalar 60–79 yaş aralığında",
    rootCause:
      "Hastaların büyük çoğunluğu, standart kemoterapi dozlarında toksisiteye daha duyarlı yaşlı bireylerden oluşuyor. Polifarmasi, düşme riski ve kognitif durum gibi geriatrik faktörler rutin değerlendirmeye dahil edilmeyebilir.",
    solutions: [
      {
        step: "G8 Geriatrik Tarama Uygula",
        detail:
          "70 yaş ve üzeri tüm hastalara ilk başvuruda G8 tarama aracı uygulanarak kapsamlı geriatrik değerlendirme (KGD) gereksinimi belirlenmeli.",
      },
      {
        step: "Doz modifikasyon rehberi oluştur",
        detail:
          "Kreatinin klerensi, albümin düzeyi ve performans durumuna göre otomatik doz önerisi sunan karar destek aracı geliştir.",
      },
      {
        step: "Çok disiplinli konsültasyon ekibi",
        detail:
          "Geriatri, eczacılık ve beslenme uzmanlarını kapsayan haftalık tümör konseyi toplantısına 75 yaş üzeri hastaları dahil et.",
      },
    ],
    impact:
      "Tedavi tamamlama oranının artması, hastane yatış süresinin kısalması ve yaşlı hastalarda yaşam kalitesinin iyileşmesi beklenir.",
  },
  {
    id: "lab-bottleneck",
    icon: <Activity className="w-5 h-5" />,
    severity: "warning",
    problem: "Laboratuvar Kapasitesi Darboğazı",
    stat: "%56,7",
    statLabel: "Tüm işlemler laboratuvar",
    rootCause:
      "Klinik işlemlerin yarısından fazlası laboratuvar testlerinden oluşuyor. Yoğun kemoterapi izlem gereksinimleri tekrar eden test döngüleri yaratıyor; bu da hasta bekleme sürelerini ve personel yükünü artırıyor.",
    solutions: [
      {
        step: "Tam otomatik hematoloji analiz hattı",
        detail:
          "CBC + biyokimya analizlerini paralel işleyebilen otomatik sistemler; tüp sıralama ve sonuç aktarımını entegre şekilde yönetebilir.",
      },
      {
        step: "Poliklinik öncesi test günü modeli",
        detail:
          "Hastaların doktor muayenesinden bir gün önce kan aldırması; klinisyenin vizite sırasında sonuçlara sahip olmasını sağlar ve ikinci ziyareti ortadan kaldırır.",
      },
      {
        step: "Kritik değer bildirim otomasyonu",
        detail:
          "Sonuç sisteminden sorumlu hemşireye anlık SMS/bildirim akışı; telefon bekleme süresini ortadan kaldırır.",
      },
    ],
    impact:
      "Tüp-sonuç döngüsünün %30–40 kısalması, hasta akışının hızlanması ve poliklinik kapasitesinin artması beklenir.",
  },
  {
    id: "supportive-care",
    icon: <Pill className="w-5 h-5" />,
    severity: "warning",
    problem: "Destekleyici Tedavi Standardizasyonu",
    stat: "Top 3",
    statLabel: "İlaç: steroid, antiemetik, PPI",
    rootCause:
      "En sık kullanılan ilaçlar antiemetik, kortikosteroid ve proton pompa inhibitörlerinden oluşuyor. Klinisyenler arasında protokol farklılıkları gereksiz ilaç maruziyeti ve maliyet artışına yol açabilir.",
    solutions: [
      {
        step: "Kemoterapi öncesi premedikasyon şablonu",
        detail:
          "Rejimlere özel (FOLFOX, AC-T, CHOP vb.) standart premedikasyon setleri elektronik ilaç sipariş sistemine yüklensin; klinisyen tek tıkla onaylayabilsin.",
      },
      {
        step: "Antiemetik basamak protokolü",
        detail:
          "Emetojenik potansiyele göre (düşük/orta/yüksek) NK1 antagonisti, 5-HT3 antagonisti ve deksametazon kombinasyonlarını belirleyen rehber oluştur.",
      },
      {
        step: "İlaç yönetim kurulu izlemi",
        detail:
          "Aylık ilaç kullanım raporlarıyla yüksek tüketimli ürünlerin gözden geçirilmesi; alternatif formülasyon ve toplu satın alma fırsatlarını değerlendir.",
      },
    ],
    impact:
      "Premedikasyon hata oranının azalması, ilaç maliyetinin %10–15 düşmesi ve bulantı-kusma yönetiminde tutarlılık beklenir.",
  },
  {
    id: "dept-concentration",
    icon: <Building2 className="w-5 h-5" />,
    severity: "opportunity",
    problem: "Radyasyon Onkolojisi Yönlendirme Açığı",
    stat: "%3,2",
    statLabel: "Başvurular radyasyon onkolojisinde",
    rootCause:
      "Kemoradyoterapinin standart olduğu kanser türlerinde (baş-boyun, servikal, rektal) radyasyon onkolojisine yönlendirme oranı oldukça düşük. Bu durum hasta koordinasyon eksikliğine veya dış merkez kullanımına işaret edebilir.",
    solutions: [
      {
        step: "Çok disiplinli tümör konseyi zorunluluğu",
        detail:
          "Baş-boyun, GI ve jinekolojik maligniteler için radyasyon onkolojisi uzmanının tümör konseyine katılımını protokole dahil et.",
      },
      {
        step: "Eş zamanlı yönlendirme akışı",
        detail:
          "Medikal onkoloji sistemi üzerinden \"Radyasyon konsültasyonu gerekli\" butonu; konsültasyon sürecini aynı gün başlatsın.",
      },
      {
        step: "Dış merkez hastalarını kayıt altına al",
        detail:
          "Başka kurumda radyoterapi alan hastaların tedavilerini kliniğin HIS sistemine kaydetmesi için standart form ve süreç oluştur.",
      },
    ],
    impact:
      "Kombine tedavi uyumunun artması, hasta yolculuğunun tek merkezde tamamlanması ve radyasyon bölümü kapasitesinin daha verimli kullanılması beklenir.",
  },
  {
    id: "admission-spike",
    icon: <TrendingUp className="w-5 h-5" />,
    severity: "opportunity",
    problem: "Başvuru Artışına Kapasitede Hazırlıksızlık",
    stat: "2023",
    statLabel: "Aylık başvuruda belirgin zirve",
    rootCause:
      "2023 başında başvurularda görülen ani artış, mevcut insan kaynağı ve altyapı planlamasının bu düzeyi karşılayıp karşılayamadığını sorgulatıyor. Artışın kalıcı olup olmadığı belirlenmeliyse kapasite güncellenmesi şart.",
    solutions: [
      {
        step: "2023 artışının kök neden analizi",
        detail:
          "Yeni tanı mı, transferler mi, yoksa yakalama dönemi mi? Hasta kaydı verisi ve epikriz kodlarıyla artışın türünü belirle.",
      },
      {
        step: "Esnek randevu kapasitesi modeli",
        detail:
          "Bir önceki ayın başvuru sayısına göre bir sonraki ay için dinamik kapasite ayarı yapan haftalık planlama toplantısı kur.",
      },
      {
        step: "Tele-onkoloji ile yük dağılımı",
        detail:
          "Stabil takip hastalarının belirli kontrollerini tele-muayene ile gerçekleştirerek poliklinik fiziksel kapasitesi yeni başvurular için aç.",
      },
    ],
    impact:
      "Hasta bekleme sürelerinin kısalması, klinisyen tükenmişlik riskinin azalması ve artan talebe karşı ölçeklenebilir bir hizmet modeli oluşturulması beklenir.",
  },
];

const SEVERITY_STYLE = {
  critical: {
    badge: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900",
    badgeLabel: "Kritik",
    iconBg: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400",
    border: "border-l-4 border-l-red-500",
    stat: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  warning: {
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900",
    badgeLabel: "Dikkat",
    iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    border: "border-l-4 border-l-amber-500",
    stat: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  opportunity: {
    badge: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-900",
    badgeLabel: "Fırsat",
    iconBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400",
    border: "border-l-4 border-l-teal-500",
    stat: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
  },
};

function ProblemCard({ p }: { p: Problem }) {
  const [open, setOpen] = useState(false);
  const s = SEVERITY_STYLE[p.severity];

  return (
    <div className={`rounded-lg border bg-card overflow-hidden ${s.border}`}>
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className={`shrink-0 rounded-lg p-2 mt-0.5 ${s.iconBg}`}>{p.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{p.problem}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${s.badge}`}>
              {s.badgeLabel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold tabular-nums leading-none ${s.stat}`}>{p.stat}</span>
            <span className="text-xs text-muted-foreground">{p.statLabel}</span>
          </div>
        </div>
        <div className="shrink-0 mt-1 text-muted-foreground">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t pt-4 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Kök Neden</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{p.rootCause}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Çözüm Adımları</p>
            <ol className="space-y-3">
              {p.solutions.map((sol, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className={`shrink-0 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center text-white mt-0.5 ${s.dot}`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight mb-0.5">{sol.step}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{sol.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-md px-4 py-3" style={{ backgroundColor: "rgba(0,145,24,0.07)" }}>
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">Beklenen Etki</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{p.impact}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProblemSolutions() {
  const critical = PROBLEMS.filter((p) => p.severity === "critical");
  const warning = PROBLEMS.filter((p) => p.severity === "warning");
  const opportunity = PROBLEMS.filter((p) => p.severity === "opportunity");

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Problem & Çözüm Önerileri</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Veriden türetilen klinik iyileştirme öncelikleri</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Kritik</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Dikkat</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />Fırsat</span>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {[...critical, ...warning, ...opportunity].map((p) => (
          <ProblemCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
