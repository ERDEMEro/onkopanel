export default function ProblemSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* Subtle bg decoration */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-primary/5 rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-[20vw] h-[20vh] bg-accent/5 rounded-tr-full" />

      {/* Section label */}
      <div className="absolute top-[5vh] left-[5vw] flex items-center gap-[0.8vw]">
        <div className="w-[0.3vw] h-[2.5vh] bg-primary" />
        <span
          className="font-body text-primary text-[1.2vw] font-medium tracking-[0.22em] uppercase"
        >
          Sorun
        </span>
      </div>

      {/* Two-column layout */}
      <div className="absolute top-[15vh] left-[5vw] right-[5vw] bottom-[6vh] flex gap-[4vw]">
        {/* Left column */}
        <div className="w-[42%] flex flex-col justify-center">
          <h2
            className="font-display text-[3.4vw] font-bold text-text leading-tight mb-[3vh]"
            style={{ textWrap: "balance" }}
          >
            Klinisyenler kritik kararlarda yalnız kalıyor
          </h2>
          <p
            className="font-body text-[1.9vw] text-muted leading-relaxed"
            style={{ textWrap: "pretty" }}
          >
            Onkoloji kliniklerinde hasta verileri dağınık, karar süreçleri yavaş ve
            genetik kayıt altyapısı yetersiz. Sonuç: artan hata riski.
          </p>
        </div>

        {/* Right column — 4 problem cards 2x2 */}
        <div className="w-[58%] grid grid-cols-2 gap-[2vh] content-center">
          {/* Card 1 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw] border-l-[0.3vw] border-primary">
            <p className="font-body text-[1.5vw] font-semibold text-text mb-[1vh] leading-snug">
              Dağınık Hasta Verisi
            </p>
            <p className="font-body text-[1.5vw] text-muted leading-relaxed">
              Laboratuvar, genetik ve ilaç bilgileri ayrı sistemlerde izole halde
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw] border-l-[0.3vw] border-primary">
            <p className="font-body text-[1.5vw] font-semibold text-text mb-[1vh] leading-snug">
              Yavaş Karar Süreçleri
            </p>
            <p className="font-body text-[1.5vw] text-muted leading-relaxed">
              Kritik bilgilere erişim gecikmeli; anlık destekten yoksun klinisyenler
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw] border-l-[0.3vw] border-accent">
            <p className="font-body text-[1.5vw] font-semibold text-text mb-[1vh] leading-snug">
              Yetersiz Genetik Kayıt
            </p>
            <p className="font-body text-[1.5vw] text-muted leading-relaxed">
              Hastaların yalnızca <span className="text-accent font-semibold">%4.4'ünde</span> genetik profil kaydı mevcut
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw] border-l-[0.3vw] border-accent">
            <p className="font-body text-[1.5vw] font-semibold text-text mb-[1vh] leading-snug">
              Klinisyen Yorgunluğu
            </p>
            <p className="font-body text-[1.5vw] text-muted leading-relaxed">
              Tekrarlayan manuel iş yükü tanı kalitesini ve hasta güvenliğini tehdit ediyor
            </p>
          </div>
        </div>
      </div>

      {/* Bottom teal line */}
      <div className="absolute bottom-0 left-0 right-0 h-[0.3vh] bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
    </div>
  );
}
