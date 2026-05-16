import { Settings, Globe, Palette, BarChart2, Check } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { useTheme, AccentColor, BarStyle } from "@/context/ThemeContext";

// ─── Theme presets ────────────────────────────────────────────────────────────

interface ThemePreset {
  id: string;
  isDark: boolean;
  accentColor: AccentColor;
  mockupBg: string;
  barBg: string;
  dot: string;
  aaColor: string;
  labelKey: "themeClassic" | "themeDark" | "themeRose" | "themeEmerald" | "themeNavy" | "themeAmber";
  subtitleKey: string;
}

const PRESETS: ThemePreset[] = [
  {
    id: "classic",
    isDark: false, accentColor: "teal",
    mockupBg: "#f8fafc", barBg: "#e2e8f0", dot: "#0d9488",
    aaColor: "#0d9488",
    labelKey: "themeClassic", subtitleKey: "KLASIK",
  },
  {
    id: "dark",
    isDark: true, accentColor: "teal",
    mockupBg: "#1e293b", barBg: "#334155", dot: "#2dd4bf",
    aaColor: "#2dd4bf",
    labelKey: "themeDark", subtitleKey: "KARANLIK",
  },
  {
    id: "rose",
    isDark: false, accentColor: "rose",
    mockupBg: "#fff1f2", barBg: "#fecdd3", dot: "#e11d48",
    aaColor: "#e11d48",
    labelKey: "themeRose", subtitleKey: "GUL",
  },
  {
    id: "emerald",
    isDark: false, accentColor: "emerald",
    mockupBg: "#f0fdf4", barBg: "#bbf7d0", dot: "#059669",
    aaColor: "#059669",
    labelKey: "themeEmerald", subtitleKey: "ZUMRUT",
  },
  {
    id: "navy",
    isDark: false, accentColor: "blue",
    mockupBg: "#eff6ff", barBg: "#bfdbfe", dot: "#2563eb",
    aaColor: "#2563eb",
    labelKey: "themeNavy", subtitleKey: "LACIVERT",
  },
  {
    id: "amber",
    isDark: false, accentColor: "orange",
    mockupBg: "#fffbeb", barBg: "#fde68a", dot: "#d97706",
    aaColor: "#d97706",
    labelKey: "themeAmber", subtitleKey: "AMBER",
  },
];

// ─── Mini mockup for theme card ───────────────────────────────────────────────

function ThemeMockup({ preset }: { preset: ThemePreset }) {
  return (
    <div
      className="w-full rounded-md overflow-hidden border"
      style={{ background: preset.mockupBg, borderColor: preset.isDark ? "#334155" : "#e2e8f0" }}
    >
      {/* Titlebar */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 border-b"
        style={{ borderColor: preset.isDark ? "#334155" : "#e2e8f0", background: preset.isDark ? "#0f172a" : "#f1f5f9" }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
        <span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
        <span className="w-2 h-2 rounded-full" style={{ background: preset.dot }} />
        <span
          className="ml-auto text-[10px] font-bold"
          style={{ color: preset.aaColor }}
        >
          Aa
        </span>
      </div>
      {/* Content rows */}
      <div className="p-2 flex flex-col gap-1">
        <div className="flex gap-1.5">
          <div className="w-8 rounded" style={{ height: 6, background: preset.dot, opacity: 0.7 }} />
          <div className="flex-1 rounded" style={{ height: 6, background: preset.barBg }} />
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1 rounded" style={{ height: 6, background: preset.barBg }} />
          <div className="w-6 rounded" style={{ height: 6, background: preset.dot, opacity: 0.5 }} />
        </div>
        <div className="flex gap-1.5">
          <div className="w-5 rounded" style={{ height: 6, background: preset.barBg }} />
          <div className="flex-1 rounded" style={{ height: 6, background: preset.barBg }} />
        </div>
      </div>
    </div>
  );
}

// ─── Bar style preview ────────────────────────────────────────────────────────

function BarStylePreview({ style }: { style: BarStyle }) {
  const bars = [55, 80, 40, 65, 90];
  const r = style === "cylinder" ? 4 : 1;
  return (
    <div className="flex items-end gap-1 h-10 w-full">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/70"
          style={{
            height: `${h}%`,
            borderRadius: `${r}px ${r}px 0 0`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-primary">{icon}</span>
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Ayarlar() {
  const { lang, setLang, t } = useLang();
  const { isDark, accentColor, barStyle, setIsDark, setAccentColor, setBarStyle } = useTheme();
  const s = t.settings;

  // Determine which preset is active
  const activePresetId = PRESETS.find(
    (p) => p.isDark === isDark && p.accentColor === accentColor
  )?.id ?? null;

  function applyPreset(preset: ThemePreset) {
    setIsDark(preset.isDark);
    setAccentColor(preset.accentColor);
  }

  return (
    <div className="min-h-[calc(100vh-44px)] bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">

        {/* ── Page header ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Settings className="w-3.5 h-3.5" />
              {s.badge}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{s.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{s.subtitle}</p>
        </div>

        {/* ── Language ── */}
        <section className="rounded-2xl border bg-card p-6">
          <SectionHeader icon={<Globe className="w-4 h-4" />} label={s.langSection} />
          <div className="grid grid-cols-2 gap-3">
            {(["tr", "en"] as const).map((l) => {
              const active = lang === l;
              const flag = l === "tr" ? "🇹🇷" : "🇬🇧";
              const code = l === "tr" ? "TR" : "GB";
              const name = l === "tr" ? s.langTr : s.langEn;
              return (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                  }`}
                >
                  <span className="text-2xl leading-none">{flag}</span>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{name}</div>
                    <div className="text-xs text-muted-foreground">{code}</div>
                  </div>
                  {active && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Theme presets ── */}
        <section className="rounded-2xl border bg-card p-6">
          <SectionHeader icon={<Palette className="w-4 h-4" />} label={s.themeSection} />
          <div className="grid grid-cols-3 gap-3">
            {PRESETS.map((preset) => {
              const active = activePresetId === preset.id;
              const label = s[preset.labelKey];
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`relative flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/20"
                  }`}
                >
                  <ThemeMockup preset={preset} />
                  <div>
                    <div className={`text-xs font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                      {label}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {preset.subtitleKey}
                    </div>
                  </div>
                  {active && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Chart bar style ── */}
        <section className="rounded-2xl border bg-card p-6">
          <SectionHeader icon={<BarChart2 className="w-4 h-4" />} label={s.barStyleSection} />
          <div className="grid grid-cols-2 gap-3">
            {(["cylinder", "flat"] as BarStyle[]).map((bs) => {
              const active = barStyle === bs;
              const label = bs === "cylinder" ? s.cylinder : s.flat;
              const desc  = bs === "cylinder" ? s.cylinderDesc : s.flatDesc;
              return (
                <button
                  key={bs}
                  onClick={() => setBarStyle(bs)}
                  className={`relative flex flex-col gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                  }`}
                >
                  <BarStylePreview style={bs} />
                  <div>
                    <div className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                      {label}
                    </div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                  {active && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
