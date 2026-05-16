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

// Known female voice name fragments (cross-browser/OS)
const FEMALE_PATTERNS = [
  "female", "Female",
  "Filiz",      // Turkish female – Microsoft Windows
  "Zira",       // English female – Microsoft Windows
  "Hazel",      // English female – Microsoft Windows
  "Samantha",   // macOS English female
  "Karen",      // macOS English female
  "Moira",      // macOS Irish English female
  "Tessa",      // macOS South African female
  "Victoria",   // macOS English female
  "Serena",     // macOS English female
  "Yelda",      // Turkish female – some Android
  "Google UK English Female",
];

// Known male voice name fragments
const MALE_PATTERNS = [
  "male", "Male",
  "Daniel",     // macOS/iOS English male
  "Alex",       // macOS English male
  "Tom",        // macOS English male
  "Fred",       // macOS English male
  "Oliver",     // macOS English male
  "Arthur",     // macOS English male
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

  // Prefer voices that match the language; fall back to all voices
  const langVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(langPrefix)
  );
  const pool = langVoices.length > 0 ? langVoices : voices;

  const patterns = gender === "female" ? FEMALE_PATTERNS : MALE_PATTERNS;
  return pool.find((v) => patterns.some((p) => v.name.includes(p))) ?? null;
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
  // voices list may load async on some browsers
  const [, setVoicesLoaded] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Reload voices list when browser fires voiceschanged
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

  // Cancel speech when lang changes
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

      // Apply voice gender preference
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
