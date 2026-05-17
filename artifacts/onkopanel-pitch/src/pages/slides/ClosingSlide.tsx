const base = import.meta.env.BASE_URL;

export default function ClosingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* Background image with heavy overlay for consistency */}
      <img
        src={`${base}hero.png`}
        crossOrigin="anonymous"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#0f1923]/80" />
      {/* Top and bottom accent lines */}
      <div className="absolute top-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-primary via-primary/60 to-accent" />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-accent via-accent/60 to-primary" />

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Logo */}
        <img
          src={`${base}logo.png`}
          crossOrigin="anonymous"
          alt="OnkoPanel"
          className="h-[14vh] w-auto mb-[4vh]"
        />

        {/* Tagline */}
        <p
          className="font-display text-[2.8vw] font-bold text-text text-center max-w-[55vw] mb-[5vh] leading-tight"
          style={{ textWrap: "balance" }}
        >
          Onkolojide akıllı karar,{" "}
          <span className="text-primary">daha iyi sonuç.</span>
        </p>

        {/* Divider */}
        <div className="flex items-center gap-[2vw] mb-[5vh]">
          <div className="h-[0.15vh] w-[8vw] bg-primary/40" />
          <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-primary" />
          <div className="h-[0.15vh] w-[8vw] bg-primary/40" />
        </div>

        {/* Team / hackathon info */}
        <div className="text-center">
          <p className="font-body text-[1.6vw] text-muted mb-[1.2vh] tracking-wide">
            DataMedX Hackathon 2026
          </p>
          <p className="font-body text-[1.5vw] text-[#4a7a6a] tracking-[0.1em]">
            onkoloji · karar desteği · yapay zeka
          </p>
        </div>
      </div>
    </div>
  );
}
