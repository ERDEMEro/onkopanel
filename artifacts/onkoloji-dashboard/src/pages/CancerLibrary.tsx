import { useState, useMemo } from "react";
import {
  Search, ChevronDown, ChevronUp, Info, AlertTriangle,
  Shield, Stethoscope, BookOpen, TrendingUp, Filter,
} from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { ReadAloudButton } from "@/components/Narrator";
import {
  CANCER_DATA, CATEGORY_COLORS, type CancerCategory, type CancerEntry,
} from "@/data/cancerLibrary";

const TABS = ["symptoms", "riskFactors", "treatments", "prevention", "stages"] as const;
type Tab = (typeof TABS)[number];

function SurvivalBadge({ rate }: { rate: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
      <TrendingUp className="w-3 h-3" />
      {rate}
    </span>
  );
}

function CategoryBadge({ category, label }: { category: CancerCategory; label: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category]}`}>
      {label}
    </span>
  );
}

function DetailSection({
  items,
  icon: Icon,
  color,
}: {
  items: { tr: string; en: string }[];
  icon: React.ElementType;
  color: string;
  lang: string;
}) {
  const { lang } = useLang();
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
          <span>{lang === "tr" ? item.tr : item.en}</span>
        </li>
      ))}
    </ul>
  );
}

function CancerCard({ entry, onExpand, isOpen }: { entry: CancerEntry; onExpand: () => void; isOpen: boolean }) {
  const { lang, t } = useLang();
  const lib = t.library;
  const [activeTab, setActiveTab] = useState<Tab>("symptoms");

  const name = lang === "tr" ? entry.nameTr : entry.nameEn;
  const desc = lang === "tr" ? entry.descTr : entry.descEn;
  const categoryLabel = lib.categories[entry.category];

  const tabConfig: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
    { id: "symptoms", label: lib.tabs.symptoms, icon: AlertTriangle, color: "text-amber-500" },
    { id: "riskFactors", label: lib.tabs.riskFactors, icon: Info, color: "text-red-500" },
    { id: "treatments", label: lib.tabs.treatments, icon: Stethoscope, color: "text-blue-500" },
    { id: "prevention", label: lib.tabs.prevention, icon: Shield, color: "text-green-500" },
    { id: "stages", label: lib.tabs.stages, icon: TrendingUp, color: "text-purple-500" },
  ];

  const readText = `${name}. ${desc}. ${lib.tabs.symptoms}: ${entry.symptoms.map(s => lang === "tr" ? s.tr : s.en).join(", ")}.`;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOpen ? "border-primary shadow-lg" : "border-border hover:border-primary/40 hover:shadow-md"
      }`}
    >
      {/* Card header */}
      <button
        onClick={onExpand}
        aria-expanded={isOpen}
        aria-label={`${name} — ${isOpen ? lib.collapse : lib.expand}`}
        className="w-full text-left p-5 flex items-start gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {/* Color dot */}
        <div
          className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
          style={{ backgroundColor: entry.bgLight }}
          aria-hidden="true"
        >
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: entry.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm leading-tight">{name}</h3>
            <CategoryBadge category={entry.category} label={categoryLabel} />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{desc}</p>
          <div className="flex items-center gap-2 mt-2">
            <SurvivalBadge rate={entry.survivalRate} />
            <span className="text-[11px] text-muted-foreground">
              {lib.incidence}: ~{entry.incidence}/100k
            </span>
          </div>
        </div>

        <div className="shrink-0 text-muted-foreground mt-0.5">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {isOpen && (
        <div className="border-t border-border">
          {/* Full description */}
          <div className="px-5 pt-4 pb-3 bg-muted/20">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm leading-relaxed text-foreground/80">{desc}</p>
              <ReadAloudButton text={readText} className="shrink-0 mt-0.5" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-1 px-5 py-3 border-b border-border/60">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={activeTab === tab.id}
                role="tab"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="w-3 h-3" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-5 py-4" role="tabpanel">
            {tabConfig.map((tab) =>
              activeTab === tab.id ? (
                <DetailSection
                  key={tab.id}
                  items={entry[tab.id]}
                  icon={tab.icon}
                  color={tab.color}
                  lang={lang}
                />
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CancerLibrary() {
  const { lang, t } = useLang();
  const lib = t.library;

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CancerCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories: { id: CancerCategory | "all"; label: string }[] = [
    { id: "all", label: lib.allTypes },
    { id: "carcinoma", label: lib.categories.carcinoma },
    { id: "lymphoma", label: lib.categories.lymphoma },
    { id: "leukemia", label: lib.categories.leukemia },
    { id: "other", label: lib.categories.other },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CANCER_DATA.filter((entry) => {
      const name = lang === "tr" ? entry.nameTr : entry.nameEn;
      const desc = lang === "tr" ? entry.descTr : entry.descEn;
      const matchSearch = !q || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      const matchCat = activeCategory === "all" || entry.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory, lang]);

  const handleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{lib.title}</h1>
            <p className="text-sm text-muted-foreground">{lib.subtitle}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { label: lib.statTypes, value: `${CANCER_DATA.length}` },
            { label: lib.statCategories, value: "4" },
            { label: lib.statUpdated, value: "2025" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/30 text-xs"
            >
              <span className="font-semibold text-primary">{s.value}</span>
              <span className="text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder={lib.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={lib.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4" aria-live="polite">
        {filtered.length === 0
          ? lib.noResults
          : `${filtered.length} ${lib.resultsFound}`}
      </p>

      {/* Cancer cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{lib.noResults}</p>
          <p className="text-sm mt-1">{lib.noResultsHint}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((entry) => (
            <CancerCard
              key={entry.id}
              entry={entry}
              isOpen={expandedId === entry.id}
              onExpand={() => handleExpand(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-10 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 flex gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          {lib.disclaimer}
        </p>
      </div>
    </div>
  );
}
