const base = import.meta.env.BASE_URL;

export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* Hero background image */}
      <img
        src={`${base}hero.png`}
        crossOrigin="anonymous"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#0b1520]/70" />
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-[#0f1923] via-[#0f1923]/60 to-transparent" />
      {/* Left teal accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[0.4vw] bg-primary" />

      {/* Logo + hackathon badge row */}
      <div className="absolute top-[4.5vh] left-[4vw] right-[4vw] flex items-center justify-between">
        <img
          src={`${base}logo.png`}
          crossOrigin="anonymous"
          alt="OnkoPanel"
          className="h-[7vh] w-auto"
        />
        <div className="flex items-center gap-[0.7vw]">
          <div className="w-[0.2vw] h-[2vh] bg-accent" />
          <span
            className="font-body text-accent text-[1.3vw] font-medium tracking-[0.18em] uppercase"
          >
            DataMedX Hackathon 2026
          </span>
        </div>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center px-[8vw]">
          <div className="flex items-center justify-center gap-[1.2vw] mb-[2.5vh]">
            <div className="h-[0.1vh] w-[5vw] bg-primary/60" />
            <span
              className="font-body text-primary text-[1.3vw] font-medium tracking-[0.28em] uppercase"
            >
              Yapay Zeka Destekli Onkoloji Platformu
            </span>
            <div className="h-[0.1vh] w-[5vw] bg-primary/60" />
          </div>

          <h1
            className="font-display text-[8.5vw] font-black text-text tracking-tight leading-none mb-[3vh]"
            style={{ textWrap: "balance" }}
          >
            Onko<span className="text-primary">Panel</span>
          </h1>

          <p
            className="font-body text-[2.1vw] text-[#b4cad9] font-light leading-relaxed max-w-[52vw] mx-auto"
            style={{ textWrap: "balance" }}
          >
            Türkiye'nin onkoloji kliniklerine yönelik veri odaklı karar destek sistemi
          </p>
        </div>
      </div>

      {/* Bottom info row */}
      <div className="absolute bottom-[4vh] left-[5vw] right-[5vw] flex items-end justify-between">
        <p className="font-body text-[1.4vw] text-muted tracking-wide">
          DataMedX · 2026
        </p>
        <p className="font-body text-[1.3vw] text-muted">
          oncology · decision support · AI
        </p>
      </div>
    </div>
  );
}
