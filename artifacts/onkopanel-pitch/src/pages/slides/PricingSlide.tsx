export default function PricingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* BG accent */}
      <div className="absolute top-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-accent/0 via-accent to-accent/0" />

      {/* Section label */}
      <div className="absolute top-[5vh] left-[5vw] flex items-center gap-[0.8vw]">
        <div className="w-[0.3vw] h-[2.5vh] bg-accent" />
        <span className="font-body text-accent text-[1.2vw] font-medium tracking-[0.22em] uppercase">
          Fiyatlandırma
        </span>
      </div>

      {/* Two-column layout */}
      <div className="absolute top-[15vh] left-[5vw] right-[5vw] bottom-[6vh] flex gap-[5vw] items-center">

        {/* Left: description */}
        <div className="w-[40%] flex flex-col">
          <h2
            className="font-display text-[3.2vw] font-bold text-text leading-tight mb-[3vh]"
            style={{ textWrap: "balance" }}
          >
            Sürdürülebilir bir gelir modeli
          </h2>
          <p className="font-body text-[1.8vw] text-muted leading-relaxed mb-[3.5vh]">
            Ücretsiz katman geniş hasta tabanı oluşturur; Premium abonelik klinisyen ve bilinçli hasta segmentinden tekrarlayan gelir üretir.
          </p>

          <div className="flex flex-col gap-[2vh]">
            <div className="flex items-start gap-[0.8vw]">
              <div className="w-[0.3vw] h-[2vh] bg-primary mt-[0.3vh] flex-shrink-0" />
              <p className="font-body text-[1.6vw] text-text">
                <span className="text-primary font-semibold">Freemium model</span> — kullanıcı kazanımı kolaylaşır
              </p>
            </div>
            <div className="flex items-start gap-[0.8vw]">
              <div className="w-[0.3vw] h-[2vh] bg-accent mt-[0.3vh] flex-shrink-0" />
              <p className="font-body text-[1.6vw] text-text">
                <span className="text-accent font-semibold">Yıllık tasarruf</span> — uzun dönem bağlılık teşviki
              </p>
            </div>
            <div className="flex items-start gap-[0.8vw]">
              <div className="w-[0.3vw] h-[2vh] bg-primary mt-[0.3vh] flex-shrink-0" />
              <p className="font-body text-[1.6vw] text-text">
                <span className="text-primary font-semibold">Stripe güvencesi</span> — istediğiniz zaman iptal
              </p>
            </div>
          </div>
        </div>

        {/* Right: plan cards */}
        <div className="w-[60%] flex flex-col gap-[2.5vh]">

          {/* Monthly card */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2.5vw] flex items-center justify-between">
            <div>
              <p className="font-body text-[1.1vw] font-medium tracking-[0.15em] uppercase text-muted mb-[0.8vh]">Aylık Plan</p>
              <p className="font-display text-[3.2vw] font-black text-text leading-none">
                Rekabetçi <span className="text-[1.6vw] font-semibold text-muted">fiyat / ay</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-[0.8vh]">
              <span className="font-body text-[1.3vw] text-muted">Aylık ödeme</span>
              <span className="font-body text-[1.3vw] text-muted">İptal özgürlüğü</span>
            </div>
          </div>

          {/* Yearly card — highlighted */}
          <div className="bg-[#162030] rounded-[1vw] p-[2.5vh_2.5vw] flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 border border-accent/30 rounded-[1vw]" />
            <div className="absolute top-0 left-0 right-0 h-[0.3vh] bg-gradient-to-r from-accent/0 via-accent to-accent/0 rounded-t-[1vw]" />
            <div>
              <div className="flex items-center gap-[0.8vw] mb-[0.8vh]">
                <p className="font-body text-[1.1vw] font-medium tracking-[0.15em] uppercase text-accent">Yıllık Plan</p>
                <span className="px-[0.5vw] py-[0.25vh] bg-accent/20 rounded-full text-accent text-[1vw] font-bold">
                  EN UYGUN
                </span>
              </div>
              <p className="font-display text-[3.2vw] font-black text-accent leading-none">
                Daha düşük <span className="text-[1.6vw] font-semibold text-muted">aylık maliyet</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-[0.8vh]">
              <span className="font-body text-[1.3vw] text-accent font-medium">Yıllık tasarruf</span>
              <span className="font-body text-[1.3vw] text-muted">Tek seferlik fatura</span>
            </div>
          </div>

          {/* Stripe badge */}
          <div className="flex items-center justify-center gap-[1vw] py-[1.5vh]">
            <svg viewBox="0 0 24 24" className="w-[1.8vh] h-[1.8vh] text-muted fill-none stroke-current stroke-2 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="font-body text-[1.3vw] text-muted">
              Stripe ile güvenli ödeme · SSL şifreli · PCI DSS uyumlu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
