export default function PricingCompareSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* BG accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f1923] via-[#0f1923] to-primary/6" />

      {/* Section label */}
      <div className="absolute top-[5vh] left-[5vw] flex items-center gap-[0.8vw]">
        <div className="w-[0.3vw] h-[2.5vh] bg-accent" />
        <span className="font-body text-accent text-[1.2vw] font-medium tracking-[0.22em] uppercase">
          Ücretsiz vs Premium
        </span>
      </div>

      {/* Headline */}
      <div className="absolute top-[14vh] left-[5vw] right-[5vw]">
        <h2
          className="font-display text-[3.6vw] font-bold text-text leading-tight"
          style={{ textWrap: "balance" }}
        >
          Her hasta için erişilebilir, ileri bakım için Premium
        </h2>
      </div>

      {/* Two plan cards */}
      <div className="absolute top-[33vh] left-[5vw] right-[5vw] bottom-[6vh] flex gap-[3vw]">

        {/* Free plan */}
        <div className="flex-1 bg-[#162030] rounded-[1.2vw] p-[3vh_2.5vw] flex flex-col">
          <div className="mb-[2.5vh]">
            <p className="font-body text-[1.2vw] font-medium tracking-[0.15em] uppercase text-muted mb-[1vh]">Ücretsiz Plan</p>
            <h3 className="font-display text-[3vw] font-black text-text leading-none">
              0 <span className="text-[1.8vw] font-semibold text-muted">₺ / her zaman</span>
            </h3>
          </div>

          <div className="h-[0.15vh] w-full bg-[#1e3040] mb-[2vh]" />

          <div className="flex flex-col gap-[1.4vh]">
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-primary" />
              </div>
              <p className="font-body text-[1.5vw] text-text">Hasta takip paneli</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-primary" />
              </div>
              <p className="font-body text-[1.5vw] text-text">Temel semptom kontrolü</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-primary" />
              </div>
              <p className="font-body text-[1.5vw] text-text">İlaç listesi & takip</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-primary" />
              </div>
              <p className="font-body text-[1.5vw] text-text">Randevu yönetimi</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-primary" />
              </div>
              <p className="font-body text-[1.5vw] text-text">Eğitim merkezi (temel)</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-primary" />
              </div>
              <p className="font-body text-[1.5vw] text-text">İlaç etkileşim kontrolü</p>
            </div>
          </div>
        </div>

        {/* Premium plan */}
        <div className="flex-1 bg-[#162030] rounded-[1.2vw] p-[3vh_2.5vw] flex flex-col relative overflow-hidden">
          {/* Premium glow border */}
          <div className="absolute inset-0 rounded-[1.2vw] border border-accent/40" />
          <div className="absolute top-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-accent/0 via-accent to-accent/0 rounded-t-[1.2vw]" />

          <div className="mb-[2.5vh]">
            <div className="flex items-center gap-[0.8vw] mb-[1vh]">
              <p className="font-body text-[1.2vw] font-medium tracking-[0.15em] uppercase text-accent">Premium Plan</p>
              <span className="px-[0.6vw] py-[0.3vh] bg-accent/20 rounded-full text-accent text-[1vw] font-bold tracking-wide">
                TAVSIYE
              </span>
            </div>
            <h3 className="font-display text-[3vw] font-black text-accent leading-none">
              Aylık <span className="text-[1.8vw] font-semibold text-muted">/ Yıllık seçenek</span>
            </h3>
          </div>

          <div className="h-[0.15vh] w-full bg-[#1e3040] mb-[2vh]" />

          <p className="font-body text-[1.3vw] text-muted mb-[1.5vh] italic">Ücretsiz plan dahil tüm özellikler +</p>

          <div className="flex flex-col gap-[1.4vh]">
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-accent" />
              </div>
              <p className="font-body text-[1.5vw] text-text">YZ Asistan — sınırsız AI sohbet</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-accent" />
              </div>
              <p className="font-body text-[1.5vw] text-text">Beslenme AI Planı — kişiselleştirilmiş</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-accent" />
              </div>
              <p className="font-body text-[1.5vw] text-text">Yaşam Kalitesi AI — akıllı planlar</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-accent" />
              </div>
              <p className="font-body text-[1.5vw] text-text">Psikolojik Destek AI</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-accent" />
              </div>
              <p className="font-body text-[1.5vw] text-text">Gelişmiş Analitik & Raporlama</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[1.8vh] h-[1.8vh] rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
                <div className="w-[0.8vh] h-[0.8vh] rounded-full bg-accent" />
              </div>
              <p className="font-body text-[1.5vw] text-text">Egzersiz & Besin Takvimi AI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
