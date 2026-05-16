import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  User, Edit3, Save, X, Activity, Bell, NotebookPen, Salad, Heart,
  Stethoscope, Sparkles, Star, TrendingUp, Pill, ChevronRight,
  Droplets, Weight, Ruler, Calendar, Phone, MapPin, CheckCircle2,
} from "lucide-react";

const STORAGE_KEY = "onko_hasta_profil";

interface HastaProfilEk {
  dogumTarihi: string;
  cinsiyet: string;
  boy: string;
  kilo: string;
  kanGrubu: string;
  tani: string;
  taniTarihi: string;
  doktor: string;
  telefon: string;
  sehir: string;
  acilKisi: string;
}

const BOSH: HastaProfilEk = {
  dogumTarihi: "", cinsiyet: "", boy: "", kilo: "",
  kanGrubu: "", tani: "", taniTarihi: "", doktor: "",
  telefon: "", sehir: "", acilKisi: "",
};

function load(): HastaProfilEk {
  try { return { ...BOSH, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") }; }
  catch { return BOSH; }
}

function bmi(boy: string, kilo: string): string {
  const b = parseFloat(boy), k = parseFloat(kilo);
  if (!b || !k) return "—";
  const val = k / ((b / 100) ** 2);
  return val.toFixed(1);
}

function yas(dogum: string): string {
  if (!dogum) return "—";
  const diff = Date.now() - new Date(dogum).getTime();
  const y = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return isNaN(y) || y < 0 ? "—" : `${y}`;
}

interface ShortcutProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  color: string;
  navigate: (p: string) => void;
}
function Shortcut({ icon, label, path, color, navigate }: ShortcutProps) {
  return (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:shadow-md transition-all group ${color}`}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-current/10 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-xs font-medium text-foreground text-center leading-tight">{label}</span>
    </button>
  );
}

export default function HastaAnaSayfa() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [profil, setProfil] = useState<HastaProfilEk>(load);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<HastaProfilEk>(load);

  useEffect(() => { const p = load(); setProfil(p); setDraft(p); }, []);

  function startEdit() { setDraft({ ...profil }); setEditing(true); }
  function cancelEdit() { setDraft({ ...profil }); setEditing(false); }
  function saveEdit() {
    setProfil(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setEditing(false);
  }

  const ad = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Hasta";
  const bmiVal = bmi(profil.boy, profil.kilo);
  const bmiNum = parseFloat(bmiVal);
  const bmiLabel = isNaN(bmiNum) ? null : bmiNum < 18.5 ? "Zayıf" : bmiNum < 25 ? "Normal" : bmiNum < 30 ? "Fazla Kilolu" : "Obez";
  const bmiColor = isNaN(bmiNum) ? "" : bmiNum < 18.5 ? "text-blue-600" : bmiNum < 25 ? "text-emerald-600" : bmiNum < 30 ? "text-amber-600" : "text-red-600";
  const yasVal = yas(profil.dogumTarihi);

  const hizliErisim = [
    { icon: <Stethoscope className="w-5 h-5 text-violet-600" />, label: "Belirti Değ.", path: "/belirti", color: "hover:border-violet-300" },
    { icon: <NotebookPen className="w-5 h-5 text-blue-600" />, label: "Belirti Günlüğü", path: "/gunluk", color: "hover:border-blue-300" },
    { icon: <Activity className="w-5 h-5 text-emerald-600" />, label: "Egzersiz", path: "/egzersiz", color: "hover:border-emerald-300" },
    { icon: <Bell className="w-5 h-5 text-amber-600" />, label: "İlaç & Randevu", path: "/hatirlatici", color: "hover:border-amber-300" },
    { icon: <Salad className="w-5 h-5 text-lime-600" />, label: "Beslenme", path: "/beslenme", color: "hover:border-lime-300" },
    { icon: <Star className="w-5 h-5 text-yellow-500" />, label: "Yaşam Kalitesi", path: "/yasam", color: "hover:border-yellow-300" },
    { icon: <Heart className="w-5 h-5 text-pink-600" />, label: "Psikolojik Destek", path: "/destek", color: "hover:border-pink-300" },
    { icon: <Sparkles className="w-5 h-5 text-indigo-600" />, label: "YZ Asistan", path: "/asistan", color: "hover:border-indigo-300" },
    { icon: <TrendingUp className="w-5 h-5 text-amber-500" />, label: "Analitik ★", path: "/analitik", color: "hover:border-amber-300" },
    { icon: <Pill className="w-5 h-5 text-amber-500" />, label: "İlaç Etkileşim ★", path: "/ilac-etki", color: "hover:border-amber-300" },
  ];

  const INPUT = "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/60";
  const LABEL = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 space-y-6">

      {/* Hero card */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={ad} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <span className="text-2xl font-bold text-primary">{ad.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">Merhaba, {ad}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
          {profil.tani && (
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
              <CheckCircle2 className="w-3 h-3" /> {profil.tani}
            </span>
          )}
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border bg-background hover:bg-accent text-sm font-medium transition-colors shrink-0"
          >
            <Edit3 className="w-4 h-4" /> Profili Düzenle
          </button>
        )}
        {editing && (
          <div className="flex gap-2 shrink-0">
            <button onClick={saveEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Save className="w-4 h-4" /> Kaydet
            </button>
            <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border bg-background text-sm hover:bg-accent transition-colors">
              <X className="w-4 h-4" /> İptal
            </button>
          </div>
        )}
      </div>

      {/* Özet metrik kartları */}
      {!editing && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3.5 h-3.5" /> Yaş
            </div>
            <span className="text-2xl font-bold text-foreground">{yasVal}</span>
            <span className="text-xs text-muted-foreground">{profil.dogumTarihi || "Tarih girilmedi"}</span>
          </div>
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Ruler className="w-3.5 h-3.5" /> Boy / Kilo
            </div>
            <span className="text-2xl font-bold text-foreground">
              {profil.boy ? `${profil.boy} cm` : "—"}
            </span>
            <span className="text-xs text-muted-foreground">{profil.kilo ? `${profil.kilo} kg` : "Kilo girilmedi"}</span>
          </div>
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Weight className="w-3.5 h-3.5" /> VKİ
            </div>
            <span className={`text-2xl font-bold ${bmiColor || "text-foreground"}`}>{bmiVal}</span>
            <span className="text-xs text-muted-foreground">{bmiLabel ?? "Boy ve kilo giriniz"}</span>
          </div>
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Droplets className="w-3.5 h-3.5" /> Kan Grubu
            </div>
            <span className="text-2xl font-bold text-foreground">{profil.kanGrubu || "—"}</span>
            <span className="text-xs text-muted-foreground">{profil.cinsiyet || "Cinsiyet girilmedi"}</span>
          </div>
        </div>
      )}

      {/* Düzenleme formu */}
      {editing && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Kişisel Bilgiler
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Doğum Tarihi</label>
              <input type="date" className={INPUT} value={draft.dogumTarihi}
                onChange={e => setDraft(d => ({ ...d, dogumTarihi: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Cinsiyet</label>
              <select className={INPUT} value={draft.cinsiyet}
                onChange={e => setDraft(d => ({ ...d, cinsiyet: e.target.value }))}>
                <option value="">Seçiniz</option>
                <option>Erkek</option>
                <option>Kadın</option>
                <option>Belirtmek istemiyorum</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Boy (cm)</label>
              <input type="number" min="100" max="250" placeholder="örn: 172" className={INPUT}
                value={draft.boy} onChange={e => setDraft(d => ({ ...d, boy: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Kilo (kg)</label>
              <input type="number" min="30" max="300" placeholder="örn: 70" className={INPUT}
                value={draft.kilo} onChange={e => setDraft(d => ({ ...d, kilo: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Kan Grubu</label>
              <select className={INPUT} value={draft.kanGrubu}
                onChange={e => setDraft(d => ({ ...d, kanGrubu: e.target.value }))}>
                <option value="">Seçiniz</option>
                {["A+","A-","B+","B-","AB+","AB-","0+","0-"].map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Şehir</label>
              <input type="text" placeholder="örn: İstanbul" className={INPUT}
                value={draft.sehir} onChange={e => setDraft(d => ({ ...d, sehir: e.target.value }))} />
            </div>
          </div>

          <hr className="border-border/60" />
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" /> Sağlık Bilgileri
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="sm:col-span-2 md:col-span-1">
              <label className={LABEL}>Tanı / Hastalık</label>
              <input type="text" placeholder="örn: Meme Kanseri Evre 2" className={INPUT}
                value={draft.tani} onChange={e => setDraft(d => ({ ...d, tani: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Tanı Tarihi</label>
              <input type="date" className={INPUT} value={draft.taniTarihi}
                onChange={e => setDraft(d => ({ ...d, taniTarihi: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Sorumlu Doktor</label>
              <input type="text" placeholder="Dr. Adı Soyadı" className={INPUT}
                value={draft.doktor} onChange={e => setDraft(d => ({ ...d, doktor: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Telefon</label>
              <input type="tel" placeholder="05XX XXX XX XX" className={INPUT}
                value={draft.telefon} onChange={e => setDraft(d => ({ ...d, telefon: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Acil Durumda Aranacak Kişi</label>
              <input type="text" placeholder="Ad Soyad – 05XX..." className={INPUT}
                value={draft.acilKisi} onChange={e => setDraft(d => ({ ...d, acilKisi: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      {/* Sağlık özeti (görüntüleme modu) */}
      {!editing && (profil.tani || profil.doktor || profil.sehir || profil.telefon || profil.acilKisi) && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" /> Sağlık Özeti
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {profil.tani && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Tanı</span>
                <span className="font-medium text-foreground">{profil.tani}</span>
                {profil.taniTarihi && <span className="text-xs text-muted-foreground">{profil.taniTarihi}</span>}
              </div>
            )}
            {profil.doktor && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Sorumlu Doktor</span>
                <span className="font-medium text-foreground">{profil.doktor}</span>
              </div>
            )}
            {profil.sehir && (
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground block">Şehir</span>
                  <span className="font-medium text-foreground">{profil.sehir}</span>
                </div>
              </div>
            )}
            {profil.telefon && (
              <div className="flex items-start gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground block">Telefon</span>
                  <span className="font-medium text-foreground">{profil.telefon}</span>
                </div>
              </div>
            )}
            {profil.acilKisi && (
              <div className="flex flex-col gap-0.5 sm:col-span-2 md:col-span-1">
                <span className="text-xs text-muted-foreground">Acil Kişi</span>
                <span className="font-medium text-foreground">{profil.acilKisi}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hızlı Erişim */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Hızlı Erişim
        </h2>
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2">
          {hizliErisim.map(item => (
            <Shortcut key={item.path} {...item} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Profil doldurmamışsa uyarı */}
      {!editing && !profil.tani && !profil.boy && (
        <button
          onClick={startEdit}
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Profilinizi tamamlayın</p>
              <p className="text-xs text-muted-foreground">Boy, kilo, tanı ve kişisel sağlık bilgilerinizi ekleyin</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
