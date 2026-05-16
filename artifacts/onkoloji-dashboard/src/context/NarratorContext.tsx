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
  toggle: () => void;
  speak: (text: string, lang?: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setRate: (r: number) => void;
}

const NarratorContext = createContext<NarratorContextValue>(
  {} as NarratorContextValue
);

const STORAGE_KEY = "onkoloji-narrator";

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [rate, setRateState] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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
      utterance.lang = overrideLang ?? (lang === "en" ? "en-US" : "tr-TR");
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;

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
    [isSupported, isEnabled, lang, rate]
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

  return (
    <NarratorContext.Provider
      value={{
        isEnabled,
        isSpeaking,
        isPaused,
        isSupported,
        currentText,
        rate,
        toggle,
        speak,
        stop,
        pause,
        resume,
        setRate,
      }}
    >
      {children}
    </NarratorContext.Provider>
  );
}

export function useNarrator() {
  return useContext(NarratorContext);
}
