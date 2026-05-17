import { useState, useEffect } from "react";
import {
  Activity, Eye, EyeOff, Loader2, AlertCircle, Stethoscope,
  BarChart2, Users, FlaskConical, HeartPulse, BookOpen,
  GraduationCap, Sparkles, ChevronRight, Shield, TrendingUp,
  ClipboardList, Search, Brain, CheckCircle2, ArrowRight,
} from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

// ─── Error box ────────────────────────────────────────────────────────────────
function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl px-3 py-2.5">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  );
}

// ─── Auth form (inline, no modal) ────────────────────────────────────────────
function AuthForm({ defaultTab = "login" }: { defaultTab?: "login" | "register" }) {
  const { loginWithPassword, registerWithPassword } = useAuth();
  const [tab, setTab]           = useState<"login" | "register">(defaultTab);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm]     = useState({ email: "", password: "", firstName: "", lastName: "", isDoctor: false });

  useEffect(() => { setTab(defaultTab); setError(""); }, [defaultTab]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const r = await loginWithPassword(loginForm.email, loginForm.password);
    setLoading(false); if (r.error) setError(r.error);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (regForm.password.length < 6) { setError("Şifre en az 6 karakter olmalıdır."); return; }
    setLoading(true);
    const r = await registerWithPassword(regForm.email, regForm.password, regForm.firstName || undefined, regForm.lastName || undefined, regForm.isDoctor);
    setLoading(false); if (r.error) setError(r.error);
  }

  const inp = "w-full text-sm border border-border rounded-xl px-3.5 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50";
  const lbl = "block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider";

  return (
    <div className="bg-card border border-border rounded-2xl p-7 shadow-xl w-full max-w-sm">
      <div className="flex gap-1 p-1 rounded-xl bg-muted border mb-6">
        {(["login", "register"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "login" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
        ))}
      </div>

      {tab === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className={lbl}>E-posta</label>
            <input type="email" required autoComplete="email" placeholder="ornek@eposta.com" className={inp}
              value={loginForm.email} onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))} /></div>
          <div><label className={lbl}>Şifre</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••" className={`${inp} pr-10`}
                value={loginForm.password} onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))} />
              <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <ErrorBox msg={error} />}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Giriş Yap
          </button>
          <p className="text-xs text-center text-muted-foreground">Hesabınız yok mu?{" "}
            <button type="button" onClick={() => { setTab("register"); setError(""); }} className="text-primary hover:underline font-semibold">Kayıt olun</button></p>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Ad</label>
              <input placeholder="Adınız" autoComplete="given-name" className={inp}
                value={regForm.firstName} onChange={(e) => setRegForm((f) => ({ ...f, firstName: e.target.value }))} /></div>
            <div><label className={lbl}>Soyad</label>
              <input placeholder="Soyadınız" autoComplete="family-name" className={inp}
                value={regForm.lastName} onChange={(e) => setRegForm((f) => ({ ...f, lastName: e.target.value }))} /></div>
          </div>
          <div><label className={lbl}>E-posta</label>
            <input type="email" required autoComplete="email" placeholder="ornek@eposta.com" className={inp}
              value={regForm.email} onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))} /></div>
          <div><label className={lbl}>Şifre <span className="font-normal normal-case">(en az 6 karakter)</span></label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} required autoComplete="new-password" placeholder="••••••••" className={`${inp} pr-10`}
                value={regForm.password} onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))} />
              <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <ErrorBox msg={error} />}
          <button type="button" onClick={() => setRegForm((f) => ({ ...f, isDoctor: !f.isDoctor }))}
            className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${regForm.isDoctor ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${regForm.isDoctor ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Stethoscope className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${regForm.isDoctor ? "text-primary" : "text-foreground"}`}>Doktor olarak kayıt ol</p>
              <p className="text-xs text-muted-foreground">{regForm.isDoctor ? "Vaka Doldur aracına erişebilirsiniz" : "Sağlık profesyonelleri için"}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${regForm.isDoctor ? "border-primary bg-primary" : "border-border"}`}>
              {regForm.isDoctor && <div className="w-2 h-2 rounded-full bg-white" />}</div>
          </button>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Hesap Oluştur
          </button>
          <p className="text-xs text-center text-muted-foreground">Hesabınız var mı?{" "}
            <button type="button" onClick={() => { setTab("login"); setError(""); }} className="text-primary hover:underline font-semibold">Giriş yapın</button></p>
        </form>
      )}
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, iconBg, title, desc }: { icon: React.ElementType; iconBg: string; title: string; desc: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm mt-0.5">
        {num}
      </div>
      <div>
        <h4 className="font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-extrabold text-white">{value}</p>
      <p className="text-white/60 text-xs mt-0.5">{label}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToForm() {
    document.getElementById("auth-form-section")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Sticky Nav ─────────────────────────────────────────────────────── */}
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? "bg-background/95 backdrop-blur border-b shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="bg-slate-900 rounded-xl px-3 py-1.5 flex items-center">
              <img
                src={`${import.meta.env.BASE_URL}onkopanel-logo.png`}
                alt="OnkoPanel"
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>
          <a href="#ozellikler" className="text-sm text-muted-foreground hover:text-foreground hidden md:block transition-colors">Özellikler</a>
          <a href="#nasil-calisir" className="text-sm text-muted-foreground hover:text-foreground hidden md:block transition-colors">Nasıl Çalışır?</a>
          <a href="#doktorlar" className="text-sm text-muted-foreground hover:text-foreground hidden md:block transition-colors">Doktorlar</a>
          <button onClick={() => { setAuthTab("login"); scrollToForm(); }}
            className="text-sm text-muted-foreground hover:text-foreground hidden sm:block transition-colors">Giriş Yap</button>
          <button onClick={() => { setAuthTab("register"); scrollToForm(); }}
            className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
            Kayıt Ol <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#0f1923] via-[#111f2f] to-[#0c1e1a] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-500/5" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-teal-500/5" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-white/[0.02]" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(61,158,143,0.12)_0%,transparent_60%)]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-white/90 text-xs font-medium">Türkiye'nin Onkoloji Veri Platformu</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-5">
              Onkoloji<br />
              <span className="text-emerald-200">Verilerini</span><br />
              Keşfedin
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-xl mb-8">
              979 benzersiz hasta kaydından türetilen klinik analizler, demografik
              dağılımlar ve tedavi trendleriyle Türkiye onkoloji tablosunu görün.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10">
              <button onClick={() => { setAuthTab("register"); scrollToForm(); }}
                className="flex items-center gap-2 bg-white text-[#0f1923] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors shadow-lg text-sm">
                Hemen Başla <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => { setAuthTab("login"); scrollToForm(); }}
                className="flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors text-sm">
                Giriş Yap
              </button>
            </div>

            <p className="text-white/50 text-xs">Ücretsiz · Kayıt kartı gerekmez · 30 saniyede başlayın</p>
          </div>

          {/* Right: auth form */}
          <div id="auth-form-section" className="w-full lg:w-auto shrink-0">
            <AuthForm defaultTab={authTab} />
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <HeroStat value="979" label="Benzersiz Hasta" />
            <HeroStat value="1.000" label="Toplam Başvuru" />
            <HeroStat value="18" label="Kanser Türü" />
            <HeroStat value="%12" label="Vefat Oranı" />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="ozellikler" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Özellikler</span>
            <h2 className="text-3xl font-extrabold mt-2 mb-3">Her şey tek platformda</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Klinisyenler ve araştırmacılar için tasarlanmış kapsamlı onkoloji veri araçları.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={BarChart2}     iconBg="bg-emerald-500"  title="Veri Panosu"          desc="Hasta demografileri, tedavi dağılımları ve klinik trendleri gerçek zamanlı grafiklerle görselleştirin." />
            <FeatureCard icon={Search}         iconBg="bg-blue-500"     title="Hasta Profil Aracı"   desc="Yaş grubu ve cinsiyet bazında hasta alt gruplarını derinlemesine analiz edin." />
            <FeatureCard icon={BookOpen}        iconBg="bg-purple-500"   title="Kanser Kütüphanesi"   desc="18 farklı kanser türü için hasta sayısı, mortalite, yaş dağılımı ve şehir verilerini keşfedin." />
            <FeatureCard icon={Brain}           iconBg="bg-orange-500"   title="YZ Asistan"           desc="GROQ tabanlı yapay zeka ile klinik veriler hakkında Türkçe sorular sorun ve anında yanıt alın." />
            <FeatureCard icon={GraduationCap}   iconBg="bg-pink-500"     title="Eğitim Merkezi"       desc="Kanser türleri hakkında güncel tıbbi makaleler ve eğitim videoları ile bilginizi artırın." />
            <FeatureCard icon={ClipboardList}   iconBg="bg-teal-500"     title="Vaka Girişi"          desc="Doktor hesaplarına özel AI destekli veya manuel form ile hasta vakası kaydedin." />
          </div>
        </div>
      </section>

      {/* ── Stats section ──────────────────────────────────────────────────── */}
      <section className="bg-muted/40 border-y py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { icon: Users,        val: "979",   lbl: "Kayıtlı Hasta",      sub: "Benzersiz hasta ID" },
            { icon: TrendingUp,   val: "1.000", lbl: "Toplam Başvuru",     sub: "Klinik ziyaret kaydı" },
            { icon: FlaskConical, val: "18",    lbl: "Kanser Kategorisi",  sub: "Sınıflandırılmış tür" },
            { icon: HeartPulse,   val: "43",    lbl: "Genetik Test",       sub: "MSI / BRCA kayıtlı" },
          ].map(({ icon: Icon, val, lbl, sub }) => (
            <div key={lbl}>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-extrabold text-foreground">{val}</p>
              <p className="text-sm font-semibold text-foreground mt-1">{lbl}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="nasil-calisir" className="py-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
          <div className="lg:flex-1">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Nasıl Çalışır?</span>
            <h2 className="text-3xl font-extrabold mt-2 mb-4">3 adımda başlayın</h2>
            <p className="text-muted-foreground mb-10 leading-relaxed">
              OnkoPanel'e katılmak ve onkoloji verilerine erişmek dakikalar alıyor.
              Hiçbir teknik bilgi gerekmez.
            </p>
            <div className="space-y-7">
              <StepCard num={1} title="Hesap oluşturun" desc="E-posta adresinizle ücretsiz kayıt olun. Doktor iseniz 'Doktor olarak kayıt ol' seçeneğini işaretleyin." />
              <StepCard num={2} title="Platformu keşfedin" desc="Veri Panosu, Kanser Kütüphanesi, Eğitim Merkezi ve YZ Asistan'ı hemen kullanmaya başlayın." />
              <StepCard num={3} title="Analiz yapın" desc="Hasta alt gruplarını, kanser dağılımlarını ve tedavi trendlerini filtreleyin ve yorumlayın." />
            </div>
          </div>

          <div className="lg:flex-1 w-full">
            <div className="bg-muted/50 border rounded-2xl p-6 space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Platform Kapsamı</p>
              {[
                { label: "Medikal Onkoloji Hastası",   val: "550", color: "bg-emerald-500" },
                { label: "Radyasyon Onkolojisi",       val: "203", color: "bg-blue-500"    },
                { label: "Cerrahi Onkoloji",           val: "247", color: "bg-purple-500"  },
                { label: "Genetik Test Kayıtlı",       val: "43",  color: "bg-orange-500"  },
                { label: "Kadın Hasta",                val: "346", color: "bg-pink-500"    },
                { label: "Erkek Hasta",                val: "632", color: "bg-teal-500"    },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                    <span className="text-sm text-foreground truncate">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground shrink-0">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Doctor section ─────────────────────────────────────────────────── */}
      <section id="doktorlar" className="py-20 px-6 bg-gradient-to-br from-[#0f1923] via-[#111f2f] to-[#0c1e1a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(61,158,143,0.10)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 mb-6">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-200" />
              <span className="text-white/90 text-xs font-medium">Sağlık Profesyonelleri</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
              Doktor hesabıyla<br />çok daha fazlası
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-8 max-w-lg">
              Doktor hesapları standart özelliklere ek olarak hasta vakası kayıt aracına erişir.
              AI destekli sohbet veya doğrudan form ile yeni hasta vakalarını sisteme ekleyebilirsiniz.
            </p>
            <ul className="space-y-3 text-sm text-white/80 mb-8">
              {[
                "AI asistan ile konuşarak vaka kayıt",
                "Manuel form ile hızlı veri girişi",
                "Tanı, ilaç ve işlem bilgisi kaydetme",
                "Genetik test ve ölüm durumu takibi",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={() => { setAuthTab("register"); scrollToForm(); }}
              className="flex items-center gap-2 bg-white text-[#0f1923] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors shadow-lg text-sm">
              Doktor Olarak Kayıt Ol <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {[
              { icon: Sparkles,     title: "AI Vaka Asistanı",    desc: "Sohbet yöntemiyle hasta verisi kaydedin." },
              { icon: ClipboardList, title: "Manuel Form Girişi",  desc: "Hızlı ve doğrudan form doldurma." },
              { icon: Shield,        title: "Güvenli Depolama",   desc: "Kayıtlar şifreli veritabanında saklanır." },
              { icon: TrendingUp,    title: "Anlık İstatistik",   desc: "Eklenen vakalar hemen analize dahil." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 border border-white/20 rounded-xl p-5">
                <Icon className="w-5 h-5 text-emerald-200 mb-3" />
                <h4 className="text-white font-semibold text-sm mb-1">{title}</h4>
                <p className="text-white/60 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA section ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-4">Hemen başlamaya hazır mısınız?</h2>
          <p className="text-muted-foreground mb-8">
            Ücretsiz hesap oluşturun ve Türkiye'nin onkoloji veri tabanına erişin.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => { setAuthTab("register"); scrollToForm(); }}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-7 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-md text-sm">
              Ücretsiz Kayıt Ol <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => { setAuthTab("login"); scrollToForm(); }}
              className="flex items-center gap-2 border font-semibold px-7 py-3 rounded-xl hover:bg-muted transition-colors text-sm">
              Giriş Yap
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 rounded-lg px-2 py-1">
              <img
                src={`${import.meta.env.BASE_URL}onkopanel-logo.png`}
                alt="OnkoPanel"
                className="h-5 w-auto object-contain"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Bu veriler klinik kayıtlardan anahtar kelime eşleştirme ile elde edilmiştir. Yalnızca bilgi amaçlıdır.
          </p>
          <p className="text-xs text-muted-foreground">© 2025 OnkoPanel</p>
        </div>
      </footer>
    </div>
  );
}
