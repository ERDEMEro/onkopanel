export default function PatientPortalSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* Decorative bottom-left glow */}
      <div className="absolute bottom-[-5vh] left-[-5vw] w-[28vw] h-[28vh] bg-accent/8 rounded-full blur-3xl" />

      {/* Section label */}
      <div className="absolute top-[5vh] left-[5vw] flex items-center gap-[0.8vw]">
        <div className="w-[0.3vw] h-[2.5vh] bg-accent" />
        <span
          className="font-body text-accent text-[1.2vw] font-medium tracking-[0.22em] uppercase"
        >
          Hasta Portalı
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
            Hasta tedavi sürecinin tam merkezinde
          </h2>
          <p className="font-body text-[1.8vw] text-muted leading-relaxed mb-[3vh]">
            Hastalar kendi sağlık verilerine erişebilir, tedavi süreçlerini takip edebilir
            ve klinikleriyle iletişim kurabilir.
          </p>
          <div className="flex items-center gap-[0.8vw]">
            <div className="w-[0.25vw] h-[2vh] bg-accent" />
            <span className="font-body text-[1.6vw] text-accent font-medium">
              Şeffaf ve güçlendirilmiş hasta deneyimi
            </span>
          </div>
        </div>

        {/* Right column — 2x2 feature grid */}
        <div className="w-[62%] grid grid-cols-2 gap-[2vh]">
          {/* Feature 1 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw]">
            <div className="flex items-center gap-[0.8vw] mb-[1.5vh]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-accent flex-shrink-0" />
              <p className="font-body text-[1.6vw] font-semibold text-text leading-snug">
                Sağlık Durumu Özeti
              </p>
            </div>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              Test sonuçları ve tedavi güncellemeleri anlık olarak hasta panelinde
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw]">
            <div className="flex items-center gap-[0.8vw] mb-[1.5vh]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-accent flex-shrink-0" />
              <p className="font-body text-[1.6vw] font-semibold text-text leading-snug">
                Randevu Yönetimi
              </p>
            </div>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              Takvim görünümü, hatırlatmalar ve randevu geçmişi entegrasyonu
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw]">
            <div className="flex items-center gap-[0.8vw] mb-[1.5vh]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-primary flex-shrink-0" />
              <p className="font-body text-[1.6vw] font-semibold text-text leading-snug">
                Tedavi Zaman Çizelgesi
              </p>
            </div>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              Tüm tanı ve tedavi süreçlerinin kronolojik geçmişi
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2vw]">
            <div className="flex items-center gap-[0.8vw] mb-[1.5vh]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-primary flex-shrink-0" />
              <p className="font-body text-[1.6vw] font-semibold text-text leading-snug">
                Kişisel Sağlık Skoru
              </p>
            </div>
            <p className="font-body text-[1.45vw] text-muted leading-relaxed">
              Yaşam kalitesi metrikleri ve tedavi yanıt göstergeleri
            </p>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-[0.3vh] bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0" />
    </div>
  );
}
