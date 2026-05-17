import { useState, useRef, useEffect, useCallback } from "react";
import {
  Volume2, VolumeX, Pause, Play, Square, ChevronUp, ChevronDown,
  Accessibility, Settings2, BookOpen, GripVertical,
} from "lucide-react";
import { useNarrator } from "@/context/NarratorContext";
import { useLang } from "@/context/LanguageContext";

export function NarratorWidget() {
  const { isEnabled, isSupported, isSpeaking, isPaused, currentText, rate, toggle, pause, resume, stop, setRate, speak, readPage } = useNarrator();
  const { t, lang } = useLang();
  const n = t.narrator;

  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const clamp = useCallback((p: { x: number; y: number }) => {
    const el = widgetRef.current;
    if (!el) return p;
    const w = el.offsetWidth || 56;
    const h = el.offsetHeight || 56;
    return {
      x: Math.max(8, Math.min(window.innerWidth - w - 8, p.x)),
      y: Math.max(8, Math.min(window.innerHeight - h - 8, p.y)),
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = widgetRef.current;
    if (!el) return;
    dragging.current = true;
    const rect = el.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const newPos = clamp({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    setPos(newPos);
    e.preventDefault();
  }, [clamp]);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    function onResize() {
      setPos(p => p ? clamp(p) : p);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  if (!isSupported) return null;

  const style: React.CSSProperties = pos
    ? { position: "fixed", left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
    : { position: "fixed", right: 16, bottom: 16 };

  const presets = lang === "tr"
    ? ["Merhaba! Onkoloji Veri Panosu'na hoş geldiniz."]
    : ["Hello! Welcome to the Oncology Data Dashboard."];

  return (
    <div
      ref={widgetRef}
      role="region"
      aria-label={n.widgetLabel}
      style={{ ...style, zIndex: 9999 }}
      className="flex flex-col items-end gap-2"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Expanded panel */}
      {isEnabled && expanded && (
        <div
          className="w-80 rounded-2xl border border-border shadow-2xl bg-background/95 backdrop-blur overflow-hidden"
          role="dialog"
          aria-modal="false"
          aria-label={n.panelLabel}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold">{n.title}</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              aria-label={n.collapse}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Read Page button */}
          <div className="px-4 py-3 border-b border-border/50">
            <button
              onClick={() => isSpeaking ? stop() : readPage()}
              aria-label={isSpeaking ? n.readPageStop : n.readPageLabel}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isSpeaking
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              }`}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-4 h-4" aria-hidden="true" />
                  {n.readPageStop}
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  {n.readPage}
                </>
              )}
            </button>
          </div>

          {/* Status */}
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2 min-h-[32px]">
              {isSpeaking ? (
                <>
                  <div className="flex gap-0.5 items-end shrink-0">
                    {[3, 5, 4, 6, 3].map((h, i) => (
                      <div
                        key={i}
                        aria-hidden="true"
                        className="w-1 bg-primary rounded-full animate-pulse"
                        style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 flex-1" aria-live="polite" aria-atomic="true">
                    {currentText.slice(0, 80)}{currentText.length > 80 ? "…" : ""}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">{n.idle}</p>
              )}
            </div>
          </div>

          {/* Playback controls */}
          <div className="px-4 py-3 flex items-center gap-2 border-b border-border/50">
            {isSpeaking && !isPaused ? (
              <button
                onClick={pause}
                aria-label={n.pause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
              >
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                {n.pause}
              </button>
            ) : isPaused ? (
              <button
                onClick={resume}
                aria-label={n.resume}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium transition-colors hover:bg-primary/90"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                {n.resume}
              </button>
            ) : null}
            {isSpeaking && (
              <button
                onClick={stop}
                aria-label={n.stop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-destructive/10 hover:text-destructive text-xs font-medium transition-colors"
              >
                <Square className="w-3.5 h-3.5" aria-hidden="true" />
                {n.stop}
              </button>
            )}
          </div>

          {/* Rate control */}
          <div className="px-4 py-3 border-b border-border/50">
            <label htmlFor="narrator-rate" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
              <Settings2 className="w-3 h-3" aria-hidden="true" />
              {n.rate}: <span className="font-semibold text-foreground">{rate.toFixed(1)}×</span>
            </label>
            <input
              id="narrator-rate"
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              aria-label={n.rate}
              aria-valuemin={0.5}
              aria-valuemax={2}
              aria-valuenow={rate}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>{n.slow}</span>
              <span>{n.fast}</span>
            </div>
          </div>

          {/* Quick read presets */}
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">{n.quickRead}</p>
            <div className="flex flex-col gap-1.5">
              {presets.map((text, i) => (
                <button
                  key={i}
                  onClick={() => speak(text)}
                  className="text-left text-xs px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted border border-border/50 transition-colors truncate"
                  aria-label={`${n.readAloud}: ${text}`}
                >
                  <Volume2 className="w-3 h-3 inline mr-1.5 text-primary" aria-hidden="true" />
                  {text.length > 45 ? text.slice(0, 45) + "…" : text}
                </button>
              ))}
            </div>
          </div>

          {/* Shortcut hint */}
          <div className="px-4 pb-3 text-[10px] text-muted-foreground text-center">
            {n.shortcut}
          </div>
        </div>
      )}

      {/* Collapse button when enabled + expanded */}
      {isEnabled && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          aria-label={n.expand}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg hover:bg-primary/90 transition-colors"
        >
          {isSpeaking ? (
            <>
              <span className="flex gap-0.5 items-end" aria-hidden="true">
                {[2, 4, 3].map((h, i) => (
                  <div key={i} className="w-0.5 bg-primary-foreground rounded-full animate-pulse" style={{ height: `${h * 3}px`, animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
              <span aria-live="polite" className="sr-only">{n.speaking}</span>
            </>
          ) : (
            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          {n.title}
          <ChevronUp className="w-3 h-3" aria-hidden="true" />
        </button>
      )}

      {/* Main toggle button + drag handle */}
      <div className="flex items-center gap-1">
        <div
          onPointerDown={onPointerDown}
          title="Taşı"
          className="w-6 h-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors touch-none select-none"
          aria-label="Widgeti taşı"
          aria-hidden="true"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <button
          onClick={() => {
            toggle();
            if (!isEnabled) setExpanded(true);
          }}
          aria-label={isEnabled ? n.turnOff : n.turnOn}
          aria-pressed={isEnabled}
          title={`${isEnabled ? n.turnOff : n.turnOn} (Alt+N)`}
          className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-primary/40 ${
            isEnabled
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-background border-2 border-border text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          {isEnabled ? (
            <Volume2 className="w-5 h-5" aria-hidden="true" />
          ) : (
            <VolumeX className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Hook to add a "read aloud" button to any section.
 * Usage: const { ReadButton } = useReadAloud(text)
 */
export function ReadAloudButton({
  text,
  label,
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const { speak, isEnabled, isSpeaking, stop } = useNarrator();
  const { t } = useLang();
  const n = t.narrator;

  if (!isEnabled) return null;

  return (
    <button
      onClick={() => (isSpeaking ? stop() : speak(text))}
      aria-label={label ?? n.readAloud}
      className={`inline-flex items-center gap-1 text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 rounded ${className}`}
    >
      <Volume2 className="w-3 h-3" aria-hidden="true" />
      {isSpeaking ? n.stop : n.readAloud}
    </button>
  );
}
