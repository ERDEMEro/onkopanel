import { createContext, useContext, useEffect, useState } from "react";

export type AccentColor = "teal" | "blue" | "purple" | "rose" | "orange" | "emerald";
export type FontSize = "sm" | "md" | "lg";
export type BarStyle = "cylinder" | "flat";

interface ThemeState {
  isDark: boolean;
  accentColor: AccentColor;
  fontSize: FontSize;
  compact: boolean;
  barStyle: BarStyle;
}

interface ThemeContextValue extends ThemeState {
  setIsDark: (v: boolean) => void;
  setAccentColor: (v: AccentColor) => void;
  setFontSize: (v: FontSize) => void;
  setCompact: (v: boolean) => void;
  setBarStyle: (v: BarStyle) => void;
}

interface HSL { h: number; s: number; l: number }

const ACCENT_LIGHT: Record<AccentColor, HSL> = {
  teal:    { h: 173, s: 80, l: 31 },
  blue:    { h: 217, s: 91, l: 44 },
  purple:  { h: 262, s: 83, l: 52 },
  rose:    { h: 346, s: 77, l: 44 },
  orange:  { h: 25,  s: 95, l: 44 },
  emerald: { h: 158, s: 64, l: 36 },
};

const ACCENT_DARK: Record<AccentColor, HSL> = {
  teal:    { h: 173, s: 80, l: 46 },
  blue:    { h: 213, s: 94, l: 63 },
  purple:  { h: 263, s: 90, l: 65 },
  rose:    { h: 346, s: 84, l: 60 },
  orange:  { h: 24,  s: 95, l: 55 },
  emerald: { h: 158, s: 64, l: 52 },
};

// Slight background tint per accent (light mode only)
const BG_TINT_LIGHT: Record<AccentColor, { bg: string; card: string }> = {
  teal:    { bg: "210 40% 98%",  card: "0 0% 100%" },
  blue:    { bg: "214 60% 97%",  card: "214 50% 100%" },
  purple:  { bg: "262 40% 97%",  card: "262 30% 100%" },
  rose:    { bg: "346 50% 97%",  card: "346 40% 100%" },
  orange:  { bg: "30  50% 97%",  card: "30  40% 100%" },
  emerald: { bg: "158 40% 97%",  card: "158 30% 100%" },
};

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: "13px",
  md: "14px",
  lg: "16px",
};

const STORAGE_KEY = "onkoloji-theme";

function defaultState(): ThemeState {
  return { isDark: false, accentColor: "teal", fontSize: "md", compact: false, barStyle: "flat" };
}

function loadState(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {}
  return defaultState();
}

function hslStr(c: HSL) {
  return `${c.h} ${c.s}% ${c.l}%`;
}

function applyTheme(state: ThemeState) {
  const root = document.documentElement;
  root.classList.toggle("dark", state.isDark);
  root.classList.toggle("compact", state.compact);

  const accent = state.isDark
    ? ACCENT_DARK[state.accentColor]
    : ACCENT_LIGHT[state.accentColor];

  const hsl = hslStr(accent);

  // Primary + ring
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);

  // Sidebar accent colours (so nav tabs & sidebar elements also update)
  root.style.setProperty("--sidebar-primary", hsl);
  root.style.setProperty("--sidebar-ring", hsl);

  // Background tints (light mode only for now; dark mode uses CSS sheet values)
  if (!state.isDark) {
    const tint = BG_TINT_LIGHT[state.accentColor];
    root.style.setProperty("--background", tint.bg);
    root.style.setProperty("--card", tint.card);
    root.style.setProperty("--sidebar", tint.bg);
    root.style.setProperty("--popover", tint.card);
  } else {
    // Remove light overrides so dark CSS sheet values take effect
    root.style.removeProperty("--background");
    root.style.removeProperty("--card");
    root.style.removeProperty("--sidebar");
    root.style.removeProperty("--popover");
  }

  root.style.fontSize = FONT_SIZE_MAP[state.fontSize];
}

const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ThemeState>(loadState);

  useEffect(() => {
    applyTheme(state);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const update = <K extends keyof ThemeState>(key: K, value: ThemeState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  return (
    <ThemeContext.Provider
      value={{
        ...state,
        setIsDark:    (v) => update("isDark", v),
        setAccentColor: (v) => update("accentColor", v),
        setFontSize:  (v) => update("fontSize", v),
        setCompact:   (v) => update("compact", v),
        setBarStyle:  (v) => update("barStyle", v),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
