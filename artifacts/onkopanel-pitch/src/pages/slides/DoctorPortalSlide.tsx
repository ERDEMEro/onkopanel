export default function DoctorPortalSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* Decorative top-right glow */}
      <div className="absolute top-[-5vh] right-[-5vw] w-[30vw] h-[30vh] bg-primary/10 rounded-full blur-3xl" />

      {/* Section label */}
      <div className="absolute top-[5vh] left-[5vw] flex items-center gap-[0.8vw]">
        <div className="w-[0.3vw] h-[2.5vh] bg-primary" />
        <span
          className="font-body text-primary text-[1.2vw] font-medium tracking-[0.22em] uppercase"
        >
          Doktor Portalı
        </span>
      </div>

      {/* Two-column layout */}
      <div className="absolute top-[15vh] left-[5vw] right-[5vw] bottom-[6vh] flex gap-[4vw] items-center">
        {/* Left column */}
        <div className="w-[38%] flex flex-col">
          <h2
            className="font-display text-[3.2vw] font-bold text-text leading-tight mb-[2.5vh]"
            style={{ textWrap: "balance" }}
          >
            Klinisyenin ihtiyacı olan her şey tek ekranda
          </h2>
          <p className="font-body text-[1.8vw] text-muted leading-relaxed mb-[3vh]">
            OnkoPanel doktor portalı, hasta geçmişinden ilaç etkileşimlerine kadar
            tüm klinik veriyi anlık olarak sunar.
          </p>
          <div className="flex items-center gap-[0.8vw]">
            <div className="w-[0.25vw] h-[2vh] bg-primary" />
            <span className="font-body text-[1.6vw] text-primary font-medium">
              Kanıta dayalı karar desteği
            </span>
          </div>
        </div>

        {/* Right column — 2x2 feature grid */}
        <div className="w-[62%] grid grid-cols-2 gap-[2vh]">
          {/* Feature 1 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw]">
            <div className="flex items-center gap-[0.8vw] mb-[1.5vh]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-primary flex-shrink-0" />
              <p className="font-body text-[1.6vw] font-semibold text-text leading-snug">
                Anlık Klinik Uyarılar
              </p>
            </div>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              İlaç etkileşimleri ve kritik değer anormallikleri otomatik tespit edilir
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw]">
            <div className="flex items-center gap-[0.8vw] mb-[1.5vh]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-primary flex-shrink-0" />
              <p className="font-body text-[1.6vw] font-semibold text-text leading-snug">
                Genetik Profil Görünümü
              </p>
            </div>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              Hasta bazlı mutasyon verileri ve ilaç yanıt profilleri tek panelde
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw]">
            <div className="flex items-center gap-[0.8vw] mb-[1.5vh]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-accent flex-shrink-0" />
              <p className="font-body text-[1.6vw] font-semibold text-text leading-snug">
                Performans Göstergeleri
              </p>
            </div>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              Kişisel ve klinik KPI panelleri ile süreç şeffaflığı
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw]">
            <div className="flex items-center gap-[0.8vw] mb-[1.5vh]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-accent flex-shrink-0" />
              <p className="font-body text-[1.6vw] font-semibold text-text leading-snug">
                Tedavi Protokol Rehberi
              </p>
            </div>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              Kanıta dayalı öneri sistemi ile klinisyene tanı desteği
            </p>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-[0.3vh] bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />
    </div>
  );
}
