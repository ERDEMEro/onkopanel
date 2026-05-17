export default function ImpactSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-primary/8 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-[0.4vh] bg-primary" />

      {/* Section label */}
      <div className="absolute top-[5vh] left-[5vw] flex items-center gap-[0.8vw]">
        <div className="w-[0.3vw] h-[2.5vh] bg-primary" />
        <span
          className="font-body text-primary text-[1.2vw] font-medium tracking-[0.22em] uppercase"
        >
          Etki
        </span>
      </div>

      {/* Headline */}
      <div className="absolute top-[14vh] left-[5vw] right-[5vw]">
        <h2
          className="font-display text-[3.8vw] font-bold text-text leading-tight"
          style={{ textWrap: "balance" }}
        >
          OnkoPanel klinikte ne değiştirir?
        </h2>
      </div>

      {/* 2x2 impact cards */}
      <div className="absolute top-[32vh] left-[5vw] right-[5vw] bottom-[6vh] grid grid-cols-2 grid-rows-2 gap-[2.5vh_3vw]">
        {/* Impact 1 */}
        <div className="bg-[#162030] rounded-[1vw] p-[3vh_3vw] flex flex-col justify-between">
          <div>
            <span className="font-display text-[3.5vw] font-black text-primary leading-none">01</span>
            <h3 className="font-display text-[2vw] font-bold text-text mt-[1.5vh] mb-[1vh] leading-snug">
              Hızlanmış Karar Süreçleri
            </h3>
            <p className="font-body text-[1.5vw] text-muted leading-relaxed">
              Kritik hasta bilgilerine saniyeler içinde erişim; daha az bekleme, daha çok hasta
            </p>
          </div>
        </div>

        {/* Impact 2 */}
        <div className="bg-[#162030] rounded-[1vw] p-[3vh_3vw] flex flex-col justify-between">
          <div>
            <span className="font-display text-[3.5vw] font-black text-accent leading-none">02</span>
            <h3 className="font-display text-[2vw] font-bold text-text mt-[1.5vh] mb-[1vh] leading-snug">
              Azaltılmış Hata Riski
            </h3>
            <p className="font-body text-[1.5vw] text-muted leading-relaxed">
              Otomatik ilaç etkileşim denetimi ile kritik hataların önüne geçilir
            </p>
          </div>
        </div>

        {/* Impact 3 */}
        <div className="bg-[#162030] rounded-[1vw] p-[3vh_3vw] flex flex-col justify-between">
          <div>
            <span className="font-display text-[3.5vw] font-black text-primary leading-none">03</span>
            <h3 className="font-display text-[2vw] font-bold text-text mt-[1.5vh] mb-[1vh] leading-snug">
              Bütünleşik Hasta Takibi
            </h3>
            <p className="font-body text-[1.5vw] text-muted leading-relaxed">
              Tüm klinik veriler tek ekranda, gerçek zamanlı ve eksiksiz
            </p>
          </div>
        </div>

        {/* Impact 4 */}
        <div className="bg-[#162030] rounded-[1vw] p-[3vh_3vw] flex flex-col justify-between">
          <div>
            <span className="font-display text-[3.5vw] font-black text-accent leading-none">04</span>
            <h3 className="font-display text-[2vw] font-bold text-text mt-[1.5vh] mb-[1vh] leading-snug">
              Veri Odaklı Tedavi
            </h3>
            <p className="font-body text-[1.5vw] text-muted leading-relaxed">
              Kişiselleştirilmiş protokol önerileri ile hasta bazlı optimum tedavi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
