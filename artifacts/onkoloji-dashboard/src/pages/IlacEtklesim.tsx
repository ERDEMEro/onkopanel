import { useState, useMemo } from "react";
import { Crown, Pill, AlertTriangle, CheckCircle, Search, Plus, X, Info, ChevronDown } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 text-[11px] font-bold dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
      <Crown className="w-3 h-3" /> PREMIUM
    </span>
  );
}

type Severity = "ciddi" | "orta" | "hafif" | "yok";

interface Interaction {
  drugA: string;
  drugB: string;
  severity: Severity;
  mechanism: string;
  recommendation: string;
}

const INTERACTION_DB: Interaction[] = [
  { drugA: "Warfarin",      drugB: "Aspirin",        severity: "ciddi",  mechanism: "Kanama riskini sinerjistik olarak artırır.",               recommendation: "Kombinasyondan kaçının. Gerekiyorsa INR sık takip edilmeli." },
  { drugA: "Warfarin",      drugB: "Metotreksat",    severity: "ciddi",  mechanism: "Warfarin bağlanmasını yarıştırarak antikoagülasyon etkisini artırır.", recommendation: "Alternatif antikoagülan düşünün veya sık INR kontrolü yapın." },
  { drugA: "Tamoksifen",    drugB: "Paroksetin",     severity: "ciddi",  mechanism: "CYP2D6 inhibisyonu ile tamoksifen aktif metaboliti azalır.",  recommendation: "Başka bir antidepresan tercih edin (venlafaksin gibi)." },
  { drugA: "Siklofosfamid", drugB: "Allopurinol",    severity: "orta",   mechanism: "Miyelosupresif etki artabilir.",                            recommendation: "Kan sayımını sık takip edin, doz ayarı gerekebilir." },
  { drugA: "Metotreksat",   drugB: "NSAİİ",          severity: "ciddi",  mechanism: "Renal klirens azalarak metotreksat toksisitesi artar.",      recommendation: "NSAİİ kullanımından kaçının, parasetamol tercih edin." },
  { drugA: "İmatinib",      drugB: "Warfarin",        severity: "ciddi",  mechanism: "CYP3A4/2C9 inhibisyonu antikoagülan etkiyi artırır.",       recommendation: "DMAH gibi alternatif antikoagülan değerlendirin." },
  { drugA: "Kapesitabin",   drugB: "Warfarin",        severity: "ciddi",  mechanism: "5-FU, CYP2C9 inhibisyonu ile warfarin metabolizmasını bozar.", recommendation: "DMAH tercih edin; mutlaka PT/INR monitorizasyonu yapın." },
  { drugA: "Bevacizumab",   drugB: "Aspirin",         severity: "orta",   mechanism: "Kanama ve trombotik olay riski artabilir.",                  recommendation: "Yakın klinik izlem, doz azaltımı gerekebilir." },
  { drugA: "Erlotinib",     drugB: "Omeprazol",       severity: "orta",   mechanism: "Gastrik pH artışı erlotinib biyoyararlanımını düşürür.",     recommendation: "PPI yerine antasit tercih edin veya erlotinib yüksek dozda verilsin." },
  { drugA: "Paklitaksel",   drugB: "Ketokonazol",     severity: "ciddi",  mechanism: "CYP3A4 inhibisyonu paklitaksel toksisitesini artırır.",      recommendation: "Güçlü CYP3A4 inhibitörlerinden kaçının." },
  { drugA: "Tamoksifen",    drugB: "Warfarin",        severity: "ciddi",  mechanism: "Antikoagülan etkinin artmasına yol açar.",                   recommendation: "INR sık takip, doz azaltımı gerekebilir." },
  { drugA: "Siklofosfamid", drugB: "Digoksin",        severity: "orta",   mechanism: "Barsak flora değişikliği digoksin emilimini artırabilir.",   recommendation: "Digoksin seviyesini izleyin." },
  { drugA: "Metotreksat",   drugB: "Trimetoprim",     severity: "ciddi",  mechanism: "Dihidrofolat redüktaz inhibisyonu sinerjistik toksisiteye yol açar.", recommendation: "Kombinasyondan kaçının." },
  { drugA: "Sorafenib",     drugB: "Warfarin",        severity: "orta",   mechanism: "CYP2C9 inhibisyonu.",                                        recommendation: "INR yakın takip, doz ayarı gerekebilir." },
  { drugA: "Kapesitabin",   drugB: "Fenitoin",        severity: "ciddi",  mechanism: "5-FU metabolizması fenitoin seviyesini artırır.",            recommendation: "Fenitoin seviyesini sık ölçün, doz düşünün." },
  { drugA: "Aspirin",       drugB: "İbuprofen",       severity: "hafif",  mechanism: "İbuprofen aspirinin antiplatelet etkisini azaltabilir.",     recommendation: "Koruyucu aspirin kullanıyorsanız ibuprofenden kaçının." },
];

const COMMON_DRUGS = [
  "Aspirin", "Warfarin", "Metotreksat", "Tamoksifen", "Siklofosfamid",
  "İmatinib", "Kapesitabin", "Paklitaksel", "Bevacizumab", "Erlotinib",
  "Sorafenib", "Allopurinol", "Omeprazol", "NSAİİ", "Fenitoin",
  "Digoksin", "Trimetoprim", "Ketokonazol", "Paroksetin",
];

const SEV_COLOR: Record<Severity, string> = {
  ciddi: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  orta:  "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  hafif: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  yok:   "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
};

const SEV_LABEL: Record<Severity, string> = {
  ciddi: "Ciddi Etkileşim",
  orta:  "Orta Etkileşim",
  hafif: "Hafif Etkileşim",
  yok:   "Etkileşim Yok",
};

function severity(a: string, b: string): Interaction | null {
  const norm = (s: string) => s.trim().toLowerCase();
  return INTERACTION_DB.find(
    r => (norm(r.drugA) === norm(a) && norm(r.drugB) === norm(b)) ||
         (norm(r.drugA) === norm(b) && norm(r.drugB) === norm(a))
  ) ?? null;
}

export default function IlacEtklesim() {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = COMMON_DRUGS.filter(d =>
    d.toLowerCase().includes(search.toLowerCase()) && !selected.includes(d)
  );

  function addDrug(d: string) {
    if (selected.length >= 8) return;
    setSelected(prev => [...prev, d]);
    setSearch("");
    setShowDropdown(false);
  }

  function removeDrug(d: string) {
    setSelected(prev => prev.filter(x => x !== d));
  }

  const interactions = useMemo(() => {
    const results: (Interaction & { key: string })[] = [];
    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const hit = severity(selected[i], selected[j]);
        if (hit) {
          results.push({ ...hit, key: `${selected[i]}-${selected[j]}` });
        } else {
          results.push({
            drugA: selected[i], drugB: selected[j], severity: "yok",
            mechanism: "Bilinen klinik açıdan önemli bir etkileşim saptanmadı.",
            recommendation: "Standart protokol uygulanabilir.",
            key: `${selected[i]}-${selected[j]}`,
          });
        }
      }
    }
    return results.sort((a, b) => {
      const order: Severity[] = ["ciddi", "orta", "hafif", "yok"];
      return order.indexOf(a.severity) - order.indexOf(b.severity);
    });
  }, [selected]);

  const sevCount = (s: Severity) => interactions.filter(i => i.severity === s).length;

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">İlaç Etkileşim Kontrolü</h1>
            <PremiumBadge />
          </div>
          <p className="text-sm text-muted-foreground">
            Kullanılan ilaçlar arasında klinik öneme sahip etkileşimleri tarayın
          </p>
        </div>
      </div>

      {/* Drug selector */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Pill className="w-4 h-4 text-primary" /> İlaç Ekle (en fazla 8)
        </h2>

        {/* Selected pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map(d => (
            <span key={d} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
              {d}
              <button onClick={() => removeDrug(d)} className="hover:text-destructive transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {selected.length === 0 && (
            <span className="text-sm text-muted-foreground italic">Henüz ilaç eklenmedi…</span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background focus-within:ring-2 focus-within:ring-primary/30">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="İlaç adı yazın veya listeden seçin…"
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-lg max-h-48 overflow-y-auto">
              {filtered.map(d => (
                <button
                  key={d}
                  onClick={() => addDrug(d)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" /> {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {showDropdown && (
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
        )}
      </div>

      {/* Summary badges */}
      {selected.length >= 2 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["ciddi", "orta", "hafif", "yok"] as Severity[]).map(s => (
            <div key={s} className={`rounded-xl border p-3 text-center ${SEV_COLOR[s]}`}>
              <div className="text-2xl font-bold">{sevCount(s)}</div>
              <div className="text-xs font-medium mt-0.5">{SEV_LABEL[s]}</div>
            </div>
          ))}
        </div>
      )}

      {/* Interaction results */}
      {selected.length >= 2 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Etkileşim Sonuçları ({interactions.length} çift)</h2>
          {interactions.map(inter => (
            <div key={inter.key} className={`rounded-xl border p-4 ${inter.severity === "ciddi" ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/10" : inter.severity === "orta" ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/10" : inter.severity === "hafif" ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/10" : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/10"}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{inter.drugA}</span>
                  <span className="text-muted-foreground">×</span>
                  <span className="font-semibold text-sm text-foreground">{inter.drugB}</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${SEV_COLOR[inter.severity]}`}>
                  {inter.severity === "ciddi" && <AlertTriangle className="w-3 h-3" />}
                  {inter.severity === "yok" && <CheckCircle className="w-3 h-3" />}
                  {SEV_LABEL[inter.severity]}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex gap-2 text-sm">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <span className="text-foreground">{inter.mechanism}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  <span className="text-foreground"><strong>Öneri:</strong> {inter.recommendation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected.length < 2 && (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <Pill className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">En az 2 ilaç ekleyerek etkileşim kontrolü başlatın.</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground border-t pt-3">
        Bu araç yalnızca bilgilendirme amaçlıdır ve klinik karar desteği olarak kullanılamaz. Her zaman klinisyen değerlendirmesi gereklidir.
      </p>
    </div>
  );
}
