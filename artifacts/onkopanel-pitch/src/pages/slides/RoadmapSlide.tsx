export default function RoadmapSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#3d9e8f 1px, transparent 1px), linear-gradient(90deg, #3d9e8f 1px, transparent 1px)",
          backgroundSize: "5vw 5vw",
        }}
      />

      {/* Section label */}
      <div className="absolute top-[5vh] left-[5vw] flex items-center gap-[0.8vw]">
        <div className="w-[0.3vw] h-[2.5vh] bg-primary" />
        <span className="font-body text-primary text-[1.2vw] font-medium tracking-[0.22em] uppercase">
          Yol Haritası
        </span>
      </div>

      {/* Headline */}
      <div className="absolute top-[14vh] left-[5vw] right-[5vw]">
        <h2
          className="font-display text-[3.8vw] font-bold text-text leading-tight"
          style={{ textWrap: "balance" }}
        >
          Şimdiden geleceğe
        </h2>
        <p className="font-body text-[1.9vw] text-muted mt-[1vh]">
          Hackathon prototipi, klinik ürüne dönüşüyor.
        </p>
      </div>

      {/* Horizontal timeline */}
      <div className="absolute top-[40vh] left-[5vw] right-[5vw]">
        {/* Connector line */}
        <div className="absolute top-[2.2vh] left-[4vw] right-[4vw] h-[0.2vh] bg-[#1e3040]" />
        <div className="absolute top-[2.2vh] left-[4vw] w-[30%] h-[0.2vh] bg-primary" />

        {/* 4 milestones */}
        <div className="flex justify-between items-start">

          {/* Milestone 1 — DONE */}
          <div className="flex flex-col items-center w-[22%]">
            <div className="w-[4.5vh] h-[4.5vh] rounded-full bg-primary flex items-center justify-center z-10 mb-[2vh]">
              <svg viewBox="0 0 24 24" className="w-[2.2vh] h-[2.2vh] text-[#0f1923] fill-none stroke-current stroke-[2.5]">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <span className="font-body text-[1.1vw] font-medium text-primary tracking-[0.12em] uppercase mb-[1vh]">Tamamlandı</span>
            <p className="font-display text-[1.9vw] font-bold text-text text-center leading-snug mb-[1vh]">
              Hackathon Prototipi
            </p>
            <p className="font-body text-[1.4vw] text-muted text-center leading-relaxed">
              Dashboard, AI asistan, Stripe entegrasyonu, hasta ve doktor portalları
            </p>
          </div>

          {/* Milestone 2 */}
          <div className="flex flex-col items-center w-[22%]">
            <div className="w-[4.5vh] h-[4.5vh] rounded-full bg-[#162030] border-[0.2vw] border-[#1e3040] flex items-center justify-center z-10 mb-[2vh]">
              <span className="font-display text-[1.6vw] font-black text-muted">2</span>
            </div>
            <span className="font-body text-[1.1vw] font-medium text-muted tracking-[0.12em] uppercase mb-[1vh]">Q3 2026</span>
            <p className="font-display text-[1.9vw] font-bold text-text text-center leading-snug mb-[1vh]">
              Klinik Pilot
            </p>
            <p className="font-body text-[1.4vw] text-muted text-center leading-relaxed">
              2 pilot klinik ile gerçek hasta verisi üzerinde sistem doğrulaması
            </p>
          </div>

          {/* Milestone 3 */}
          <div className="flex flex-col items-center w-[22%]">
            <div className="w-[4.5vh] h-[4.5vh] rounded-full bg-[#162030] border-[0.2vw] border-[#1e3040] flex items-center justify-center z-10 mb-[2vh]">
              <span className="font-display text-[1.6vw] font-black text-muted">3</span>
            </div>
            <span className="font-body text-[1.1vw] font-medium text-muted tracking-[0.12em] uppercase mb-[1vh]">Q4 2026</span>
            <p className="font-display text-[1.9vw] font-bold text-text text-center leading-snug mb-[1vh]">
              Mobil Uygulama
            </p>
            <p className="font-body text-[1.4vw] text-muted text-center leading-relaxed">
              iOS ve Android hasta uygulaması, anlık bildirimler ve offline mod
            </p>
          </div>

          {/* Milestone 4 */}
          <div className="flex flex-col items-center w-[22%]">
            <div className="w-[4.5vh] h-[4.5vh] rounded-full bg-[#162030] border-[0.2vw] border-[#1e3040] flex items-center justify-center z-10 mb-[2vh]">
              <span className="font-display text-[1.6vw] font-black text-muted">4</span>
            </div>
            <span className="font-body text-[1.1vw] font-medium text-muted tracking-[0.12em] uppercase mb-[1vh]">Q1 2027</span>
            <p className="font-display text-[1.9vw] font-bold text-text text-center leading-snug mb-[1vh]">
              SağlıkNet Entegrasyonu
            </p>
            <p className="font-body text-[1.4vw] text-muted text-center leading-relaxed">
              Türkiye ulusal sağlık sistemiyle tam entegrasyon ve e-Nabız bağlantısı
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.3vh] bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />
    </div>
  );
}
