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

const ACCENT_LIGHT: Record<AccentColor, { h: number; s: number; l: number }> = {
  teal:    { h: 173, s: 80, l: 31 },
  blue:    { h: 217, s: 91, l: 52 },
  purple:  { h: 262, s: 83, l: 55 },
  rose:    { h: 346, s: 77, l: 48 },
  orange:  { h: 25,  s: 95, l: 47 },
  emerald: { h: 158, s: 64, l: 39 },
};

const ACCENT_DARK: Record<AccentColor, { h: number; s: number; l: number }> = {
  teal:    { h: 173, s: 80, l: 40 },
  blue:    { h: 213, s: 94, l: 63 },
  purple:  { h: 263, s: 90, l: 65 },
  rose:    { h: 346, s: 84, l: 60 },
  orange:  { h: 24,  s: 95, l: 55 },
  emerald: { h: 158, s: 64, l: 52 },
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

function applyTheme(state: ThemeState) {
  const root = document.documentElement;
  root.classList.toggle("dark", state.isDark);
  root.classList.toggle("compact", state.compact);

  const accent = state.isDark
    ? ACCENT_DARK[state.accentColor]
    : ACCENT_LIGHT[state.accentColor];

  const hsl = `${accent.h} ${accent.s}% ${accent.l}%`;
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
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
