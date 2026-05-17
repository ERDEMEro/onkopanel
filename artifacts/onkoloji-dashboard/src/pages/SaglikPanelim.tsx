import { useState } from "react";
import { User, CalendarDays, NotebookPen, Star, Activity, Heart, Pill, Salad } from "lucide-react";
import HastaAnaSayfa from "./HastaAnaSayfa";
import BesinTakvimi from "./BesinTakvimi";
import BeliritGunlugu from "./BeliritGunlugu";
import YasamKalitesi from "./YasamKalitesi";
import EgzersizTakip from "./EgzersizTakip";
import PsikolojikDestek from "./PsikolojikDestek";
import HatirlaticiTakip from "./HatirlaticiTakip";
import BeslenmeDanismani from "./BeslenmeDanismani";

const TABS = [
  { id: "anasayfa", label: "Ana Sayfa",           shortLabel: "Ana",      icon: User,           component: HastaAnaSayfa,    activeBg: "bg-primary"     },
  { id: "takvim",   label: "Günlük Takip",        shortLabel: "Takvim",   icon: CalendarDays,   component: BesinTakvimi,     activeBg: "bg-emerald-500" },
  { id: "ilac",     label: "İlaç & Randevu",      shortLabel: "İlaç",     icon: Pill,            component: HatirlaticiTakip, activeBg: "bg-violet-500"  },
  { id: "beslenme", label: "Beslenme Danışmanı",  shortLabel: "Beslenme", icon: Salad,           component: BeslenmeDanismani,activeBg: "bg-teal-500"    },
  { id: "gunluk",   label: "Belirti Günlüğü",     shortLabel: "Belirti",  icon: NotebookPen,     component: BeliritGunlugu,   activeBg: "bg-amber-500"   },
  { id: "yasam",    label: "Yaşam Kalitesi",      shortLabel: "Yaşam",    icon: Star,            component: YasamKalitesi,    activeBg: "bg-indigo-500"  },
  { id: "egzersiz", label: "Egzersiz",            shortLabel: "Egzersiz", icon: Activity,        component: EgzersizTakip,    activeBg: "bg-cyan-500"    },
  { id: "destek",   label: "Psikolojik Destek",   shortLabel: "Destek",   icon: Heart,           component: PsikolojikDestek, activeBg: "bg-rose-500"    },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SaglikPanelim() {
  const [active, setActive] = useState<TabId>("takvim");
  const tab = TABS.find(t => t.id === active)!;
  const ActiveComponent = tab.component;

  return (
    <div>
      {/* Sub-tab bar — sticky just below main nav */}
      <div className="sticky top-12 z-40 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-2 flex items-center h-11 gap-0.5 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all shrink-0 ${
                  isActive
                    ? `${t.activeBg} text-white shadow-sm`
                    : `text-slate-500 hover:text-slate-800 hover:bg-slate-100`
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active page content */}
      <ActiveComponent />
    </div>
  );
}
