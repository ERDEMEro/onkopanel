export default function SolutionSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* Background gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />

      {/* Section label */}
      <div className="absolute top-[5vh] left-[5vw] flex items-center gap-[0.8vw]">
        <div className="w-[0.3vw] h-[2.5vh] bg-primary" />
        <span
          className="font-body text-primary text-[1.2vw] font-medium tracking-[0.22em] uppercase"
        >
          Çözüm
        </span>
      </div>

      {/* Headline */}
      <div className="absolute top-[14vh] left-[5vw] right-[5vw]">
        <h2
          className="font-display text-[3.8vw] font-bold text-text leading-tight"
          style={{ textWrap: "balance" }}
        >
          Tek platform, tüm onkoloji süreci
        </h2>
        <div className="mt-[1.5vh] h-[0.2vh] w-[10vw] bg-primary" />
      </div>

      {/* Three pillars */}
      <div className="absolute top-[33vh] left-[5vw] right-[5vw] bottom-[8vh] grid grid-cols-3 gap-[2.5vw]">
        {/* Pillar 1 */}
        <div className="flex flex-col">
          <div className="h-[0.4vh] w-full bg-primary mb-[3vh]" />
          <div className="w-[4vw] h-[4vw] rounded-full bg-primary/20 flex items-center justify-center mb-[2.5vh]">
            <svg viewBox="0 0 24 24" className="w-[2vw] h-[2vw] text-primary fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <h3 className="font-display text-[2.2vw] font-bold text-text mb-[1.5vh] leading-tight">
            Klinik Karar Desteği
          </h3>
          <p className="font-body text-[1.6vw] text-muted leading-relaxed">
            İlaç etkileşimleri, klinik uyarılar ve genetik profil entegrasyonu ile
            klinisyene anlık rehberlik
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="flex flex-col">
          <div className="h-[0.4vh] w-full bg-accent mb-[3vh]" />
          <div className="w-[4vw] h-[4vw] rounded-full bg-accent/20 flex items-center justify-center mb-[2.5vh]">
            <svg viewBox="0 0 24 24" className="w-[2vw] h-[2vw] text-accent fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <h3 className="font-display text-[2.2vw] font-bold text-text mb-[1.5vh] leading-tight">
            Operasyonel Zeka
          </h3>
          <p className="font-body text-[1.6vw] text-muted leading-relaxed">
            Gerçek zamanlı performans panelleri, klinik KPI takibi ve otomatik
            raporlama altyapısı
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="flex flex-col">
          <div className="h-[0.4vh] w-full bg-primary mb-[3vh]" />
          <div className="w-[4vw] h-[4vw] rounded-full bg-primary/20 flex items-center justify-center mb-[2.5vh]">
            <svg viewBox="0 0 24 24" className="w-[2vw] h-[2vw] text-primary fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <h3 className="font-display text-[2.2vw] font-bold text-text mb-[1.5vh] leading-tight">
            Hasta Odaklı Bakım
          </h3>
          <p className="font-body text-[1.6vw] text-muted leading-relaxed">
            Bireyselleştirilmiş tedavi takibi, hasta portalı ve sağlık skoru
            izleme araçları
          </p>
        </div>
      </div>
    </div>
  );
}
