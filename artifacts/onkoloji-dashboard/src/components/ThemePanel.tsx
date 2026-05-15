import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTheme, AccentColor, FontSize } from "@/context/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

interface ThemePanelProps {
  open: boolean;
  onClose: () => void;
}

const ACCENTS: { key: AccentColor; label: string; light: string; dark: string }[] = [
  { key: "teal",   label: "Teal",    light: "hsl(173 80% 31%)", dark: "hsl(173 80% 40%)" },
  { key: "blue",   label: "Mavi",    light: "hsl(217 91% 52%)", dark: "hsl(213 94% 63%)" },
  { key: "purple", label: "Mor",     light: "hsl(262 83% 55%)", dark: "hsl(263 90% 65%)" },
  { key: "rose",   label: "Gül",     light: "hsl(346 77% 48%)", dark: "hsl(346 84% 60%)" },
  { key: "orange", label: "Turuncu", light: "hsl(25 95% 47%)",  dark: "hsl(24 95% 55%)"  },
];

const FONT_SIZES: { key: FontSize; label: string; description: string }[] = [
  { key: "sm", label: "Küçük", description: "13px" },
  { key: "md", label: "Orta",  description: "14px" },
  { key: "lg", label: "Büyük", description: "16px" },
];

export function ThemePanel({ open, onClose }: ThemePanelProps) {
  const { isDark, accentColor, fontSize, compact, setIsDark, setAccentColor, setFontSize, setCompact } = useTheme();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-80 flex flex-col gap-0 p-0 overflow-y-auto">
        <SheetHeader className="px-5 pt-5 pb-4 border-b">
          <SheetTitle className="text-base font-semibold">Tema ve Kişiselleştirme</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-5 py-5">

          {/* Görünüm */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Görünüm</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsDark(false)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  !isDark ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="w-10 h-7 rounded bg-white border border-slate-200 flex items-center justify-center">
                  <Sun className="w-4 h-4 text-amber-400" />
                </div>
                <span className={`text-xs font-medium ${!isDark ? "text-primary" : "text-muted-foreground"}`}>Açık</span>
              </button>

              <button
                onClick={() => setIsDark(true)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  isDark ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="w-10 h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-slate-300" />
                </div>
                <span className={`text-xs font-medium ${isDark ? "text-primary" : "text-muted-foreground"}`}>Koyu</span>
              </button>
            </div>
          </section>

          {/* Renk Teması */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Renk Teması</p>
            <div className="flex gap-3 flex-wrap">
              {ACCENTS.map((a) => {
                const color = isDark ? a.dark : a.light;
                const active = accentColor === a.key;
                return (
                  <button
                    key={a.key}
                    onClick={() => setAccentColor(a.key)}
                    className="flex flex-col items-center gap-1.5"
                    title={a.label}
                  >
                    <div
                      className={`w-9 h-9 rounded-full transition-all ${
                        active ? "scale-110" : "hover:scale-105"
                      }`}
                      style={{
                        backgroundColor: color,
                        outline: active ? `2px solid ${color}` : "none",
                        outlineOffset: "3px",
                      }}
                    >
                      {active && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                      {a.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Yazı Boyutu */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Yazı Boyutu</p>
            <div className="grid grid-cols-3 gap-2">
              {FONT_SIZES.map((f) => {
                const active = fontSize === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFontSize(f.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      active ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <span
                      className="font-bold leading-none"
                      style={{ fontSize: f.description }}
                    >
                      Aa
                    </span>
                    <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Yoğunluk */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Yoğunluk</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCompact(false)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  !compact ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="w-full flex flex-col gap-1">
                  <div className="h-2 rounded bg-muted" />
                  <div className="h-2 rounded bg-muted" />
                  <div className="h-2 rounded bg-muted" />
                </div>
                <span className={`text-xs font-medium ${!compact ? "text-primary" : "text-muted-foreground"}`}>Normal</span>
              </button>

              <button
                onClick={() => setCompact(true)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  compact ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="w-full flex flex-col gap-0.5">
                  <div className="h-1.5 rounded bg-muted" />
                  <div className="h-1.5 rounded bg-muted" />
                  <div className="h-1.5 rounded bg-muted" />
                  <div className="h-1.5 rounded bg-muted" />
                </div>
                <span className={`text-xs font-medium ${compact ? "text-primary" : "text-muted-foreground"}`}>Kompakt</span>
              </button>
            </div>
          </section>

          {/* Sıfırla */}
          <button
            onClick={() => {
              setIsDark(false);
              setAccentColor("teal");
              setFontSize("md");
              setCompact(false);
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground border rounded-lg py-2 transition-colors hover:bg-muted"
          >
            Varsayılana Sıfırla
          </button>

        </div>
      </SheetContent>
    </Sheet>
  );
}
