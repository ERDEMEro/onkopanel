export default function TechDataSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1923]">
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#3d9e8f 1px, transparent 1px), linear-gradient(90deg, #3d9e8f 1px, transparent 1px)",
          backgroundSize: "4vw 4vw",
        }}
      />

      {/* Section label */}
      <div className="absolute top-[5vh] left-[5vw] flex items-center gap-[0.8vw]">
        <div className="w-[0.3vw] h-[2.5vh] bg-primary" />
        <span
          className="font-body text-primary text-[1.2vw] font-medium tracking-[0.22em] uppercase"
        >
          Teknoloji & Veri
        </span>
      </div>

      {/* Big stats row */}
      <div className="absolute top-[14vh] left-[5vw] right-[5vw] flex gap-[0vw]">
        {/* Stat 1 */}
        <div className="flex-1 flex flex-col items-center py-[3vh] border-r border-[#1e3040]">
          <span className="font-display text-[7vw] font-black text-primary leading-none tracking-tight">
            979
          </span>
          <span className="font-body text-[1.6vw] text-muted mt-[1vh] tracking-wide">
            Hasta Kaydı
          </span>
        </div>
        {/* Stat 2 */}
        <div className="flex-1 flex flex-col items-center py-[3vh] border-r border-[#1e3040]">
          <span className="font-display text-[7vw] font-black text-accent leading-none tracking-tight">
            56+
          </span>
          <span className="font-body text-[1.6vw] text-muted mt-[1vh] tracking-wide">
            Klinik Parametre
          </span>
        </div>
        {/* Stat 3 */}
        <div className="flex-1 flex flex-col items-center py-[3vh]">
          <span className="font-display text-[7vw] font-black text-primary leading-none tracking-tight">
            8
          </span>
          <span className="font-body text-[1.6vw] text-muted mt-[1vh] tracking-wide">
            Kanser Tipi
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="absolute top-[50vh] left-[5vw] right-[5vw] h-[0.15vh] bg-[#1e3040]" />

      {/* Tech stack grid */}
      <div className="absolute top-[53vh] left-[5vw] right-[5vw] bottom-[6vh] grid grid-cols-4 gap-[2vw]">
        {/* Tech 1 */}
        <div className="bg-[#162030] rounded-[0.8vw] p-[2vh_1.5vw]">
          <p className="font-body text-[1.1vw] text-primary font-medium tracking-[0.15em] uppercase mb-[1.2vh]">
            Frontend
          </p>
          <p className="font-body text-[1.55vw] text-text font-semibold leading-snug">
            React · TypeScript
          </p>
          <p className="font-body text-[1.4vw] text-muted mt-[0.5vh]">
            Tailwind CSS v4
          </p>
        </div>

        {/* Tech 2 */}
        <div className="bg-[#162030] rounded-[0.8vw] p-[2vh_1.5vw]">
          <p className="font-body text-[1.1vw] text-primary font-medium tracking-[0.15em] uppercase mb-[1.2vh]">
            Backend
          </p>
          <p className="font-body text-[1.55vw] text-text font-semibold leading-snug">
            Express.js · PostgreSQL
          </p>
          <p className="font-body text-[1.4vw] text-muted mt-[0.5vh]">
            Drizzle ORM
          </p>
        </div>

        {/* Tech 3 */}
        <div className="bg-[#162030] rounded-[0.8vw] p-[2vh_1.5vw]">
          <p className="font-body text-[1.1vw] text-accent font-medium tracking-[0.15em] uppercase mb-[1.2vh]">
            Karar Desteği
          </p>
          <p className="font-body text-[1.55vw] text-text font-semibold leading-snug">
            Groq AI · LLM
          </p>
          <p className="font-body text-[1.4vw] text-muted mt-[0.5vh]">
            Karar ağaçları
          </p>
        </div>

        {/* Tech 4 */}
        <div className="bg-[#162030] rounded-[0.8vw] p-[2vh_1.5vw]">
          <p className="font-body text-[1.1vw] text-accent font-medium tracking-[0.15em] uppercase mb-[1.2vh]">
            Güvenlik
          </p>
          <p className="font-body text-[1.55vw] text-text font-semibold leading-snug">
            Oturum tabanlı
          </p>
          <p className="font-body text-[1.4vw] text-muted mt-[0.5vh]">
            Şifreli veri katmanı
          </p>
        </div>
      </div>
    </div>
  );
}
