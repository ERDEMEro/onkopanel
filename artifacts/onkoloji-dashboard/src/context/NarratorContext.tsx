import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

interface NarratorContextValue {
  isEnabled: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  currentText: string;
  rate: number;
  voiceGender: "female" | "male" | "auto";
  toggle: () => void;
  speak: (text: string, lang?: string) => void;
  readPage: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setRate: (r: number) => void;
  setVoiceGender: (g: "female" | "male" | "auto") => void;
}

const NarratorContext = createContext<NarratorContextValue>(
  {} as NarratorContextValue
);

const STORAGE_KEY = "onkoloji-narrator";
const VOICE_GENDER_KEY = "onkoloji-narrator-voice-gender";

const FEMALE_PATTERNS = [
  "female", "Female",
  "Filiz", "Zira", "Hazel", "Samantha", "Karen",
  "Moira", "Tessa", "Victoria", "Serena", "Yelda",
  "Google UK English Female",
];

const MALE_PATTERNS = [
  "male", "Male",
  "Daniel", "Alex", "Tom", "Fred", "Oliver", "Arthur",
  "Google UK English Male",
];

function pickVoice(
  gender: "female" | "male" | "auto",
  langCode: string
): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (gender === "auto") return null;
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = langCode.split("-")[0].toLowerCase();
  const langVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(langPrefix)
  );
  const pool = langVoices.length > 0 ? langVoices : voices;
  const patterns = gender === "female" ? FEMALE_PATTERNS : MALE_PATTERNS;
  return pool.find((v) => patterns.some((p) => v.name.includes(p))) ?? null;
}

/** Extract visible readable text from the page content area */
function extractPageText(): string {
  const el =
    document.querySelector<HTMLElement>("[data-narrator-content]") ??
    document.querySelector<HTMLElement>("main") ??
    document.body;

  // Walk text nodes, skip script/style/button/nav
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "BUTTON", "NAV", "INPUT", "TEXTAREA", "SELECT", "OPTION", "NOSCRIPT"]);
  const parts: string[] = [];

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").trim();
      if (text.length > 1) parts.push(text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const elem = node as HTMLElement;
    if (SKIP_TAGS.has(elem.tagName)) return;
    if (elem.getAttribute("aria-hidden") === "true") return;
    for (const child of Array.from(node.childNodes)) walk(child);
  }

  walk(el);
  return parts.join(". ").replace(/\.\s*\./g, ".").trim();
}

export function NarratorProvider({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang: string;
}) {
  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "false");
    } catch {
      return false;
    }
  });

  const [voiceGender, setVoiceGenderState] = useState<"female" | "male" | "auto">(() => {
    try {
      const stored = localStorage.getItem(VOICE_GENDER_KEY);
      if (stored === "female" || stored === "male" || stored === "auto") return stored;
    } catch {}
    return "auto";
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [rate, setRateState] = useState(1);
  const [, setVoicesLoaded] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!isSupported) return;
    function onVoicesChanged() {
      setVoicesLoaded((n) => n + 1);
    }
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
  }, [isSupported]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isEnabled));
    } catch {}
    if (!isEnabled) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText("");
    }
  }, [isEnabled]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [lang]);

  // Keyboard shortcut Alt+N
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setIsEnabled((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentText("");
  }, []);

  const pause = useCallback(() => {
    window.speechSynthesis?.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis?.resume();
    setIsPaused(false);
  }, []);

  const speak = useCallback(
    (text: string, overrideLang?: string) => {
      if (!isSupported || !isEnabled) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = overrideLang ?? (lang === "en" ? "en-US" : "tr-TR");
      utterance.lang = langCode;
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;

      const picked = pickVoice(voiceGender, langCode);
      if (picked) utterance.voice = picked;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentText(text);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText("");
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText("");
      };
      utterance.onpause = () => setIsPaused(true);
      utterance.onresume = () => setIsPaused(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, isEnabled, lang, rate, voiceGender]
  );

  /** Reads all visible text on the current page aloud */
  const readPage = useCallback(() => {
    if (!isSupported || !isEnabled) return;
    const text = extractPageText();
    if (text) speak(text);
  }, [isSupported, isEnabled, speak]);

  const toggle = useCallback(() => {
    setIsEnabled((v) => !v);
  }, []);

  const setRate = useCallback((r: number) => {
    setRateState(r);
    if (utteranceRef.current) {
      utteranceRef.current.rate = r;
    }
  }, []);

  const setVoiceGender = useCallback((g: "female" | "male" | "auto") => {
    setVoiceGenderState(g);
    try {
      localStorage.setItem(VOICE_GENDER_KEY, g);
    } catch {}
  }, []);

  return (
    <NarratorContext.Provider
      value={{
        isEnabled,
        isSpeaking,
        isPaused,
        isSupported,
        currentText,
        rate,
        voiceGender,
        toggle,
        speak,
        readPage,
        stop,
        pause,
        resume,
        setRate,
        setVoiceGender,
      }}
    >
      {children}
    </NarratorContext.Provider>
  );
}

export function useNarrator() {
  return useContext(NarratorContext);
}
