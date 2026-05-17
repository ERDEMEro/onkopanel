export default function AIFeaturesSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* BG glow */}
      <div className="absolute top-[-8vh] right-[-8vw] w-[35vw] h-[35vh] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-5vh] left-[-5vw] w-[25vw] h-[25vh] bg-accent/8 rounded-full blur-3xl" />

      {/* Section label */}
      <div className="absolute top-[5vh] left-[5vw] flex items-center gap-[0.8vw]">
        <div className="w-[0.3vw] h-[2.5vh] bg-primary" />
        <span className="font-body text-primary text-[1.2vw] font-medium tracking-[0.22em] uppercase">
          Yapay Zeka Özellikleri
        </span>
      </div>

      {/* Headline */}
      <div className="absolute top-[14vh] left-[5vw] right-[5vw]">
        <h2
          className="font-display text-[3.6vw] font-bold text-text leading-tight max-w-[60vw]"
          style={{ textWrap: "balance" }}
        >
          Groq destekli AI, her hastaya özel
        </h2>
        <p className="font-body text-[1.9vw] text-muted mt-[1.5vh] max-w-[50vw]" style={{ textWrap: "pretty" }}>
          Beş bağımsız yapay zeka modülü, premium kullanıcılara kişiselleştirilmiş sağlık rehberliği sunar.
        </p>
      </div>

      {/* 4 AI feature cards in 2×2 */}
      <div className="absolute top-[37vh] left-[5vw] right-[5vw] bottom-[6vh] grid grid-cols-2 gap-[2.5vh_3vw]">
        {/* Card 1 */}
        <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2.5vw] flex gap-[1.5vw] items-start">
          <div className="w-[4.5vh] h-[4.5vh] rounded-[0.8vw] bg-primary/20 flex items-center justify-center flex-shrink-0 mt-[0.3vh]">
            <svg viewBox="0 0 24 24" className="w-[2.2vh] h-[2.2vh] text-primary fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>
          <div>
            <p className="font-body text-[1.7vw] font-semibold text-text mb-[0.8vh] leading-snug">YZ Asistan</p>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              Sınırsız AI sohbet ile 7/24 kişisel sağlık danışmanlığı. Groq LLM altyapısıyla saniyeler içinde yanıt.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2.5vw] flex gap-[1.5vw] items-start">
          <div className="w-[4.5vh] h-[4.5vh] rounded-[0.8vw] bg-accent/20 flex items-center justify-center flex-shrink-0 mt-[0.3vh]">
            <svg viewBox="0 0 24 24" className="w-[2.2vh] h-[2.2vh] text-accent fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 10.5c0 .622-.504 1.125-1.125 1.125H10.5A1.125 1.125 0 0 1 9.375 10.5v0A1.125 1.125 0 0 1 10.5 9.375h3.75A1.125 1.125 0 0 1 15 10.5v0ZM9 15.75h6m-6 3h6" />
            </svg>
          </div>
          <div>
            <p className="font-body text-[1.7vw] font-semibold text-text mb-[0.8vh] leading-snug">Beslenme AI Planı</p>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              Kanser tipine ve tedavi sürecine göre kişiselleştirilmiş beslenme önerileri ve besin takviye rehberi.
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2.5vw] flex gap-[1.5vw] items-start">
          <div className="w-[4.5vh] h-[4.5vh] rounded-[0.8vw] bg-primary/20 flex items-center justify-center flex-shrink-0 mt-[0.3vh]">
            <svg viewBox="0 0 24 24" className="w-[2.2vh] h-[2.2vh] text-primary fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
            </svg>
          </div>
          <div>
            <p className="font-body text-[1.7vw] font-semibold text-text mb-[0.8vh] leading-snug">Gelişmiş Analitik</p>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              Sağlık trendi grafikleri, tedavi etkinlik analizleri ve detaylı klinik ilerleme raporları.
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2.5vw] flex gap-[1.5vw] items-start">
          <div className="w-[4.5vh] h-[4.5vh] rounded-[0.8vw] bg-accent/20 flex items-center justify-center flex-shrink-0 mt-[0.3vh]">
            <svg viewBox="0 0 24 24" className="w-[2.2vh] h-[2.2vh] text-accent fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <div>
            <p className="font-body text-[1.7vw] font-semibold text-text mb-[0.8vh] leading-snug">Psikolojik Destek AI</p>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              Kişisel psikolojik destek planı, yaşam kalitesi ölçümü ve egzersiz takip entegrasyonu.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.3vh] bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />
    </div>
  );
}
