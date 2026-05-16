import { useState } from "react";
import { Activity, Eye, EyeOff, Loader2, AlertCircle, Stethoscope, BarChart2, Users, FlaskConical, HeartPulse } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5">
      <Icon className="w-4 h-4 text-white/70 shrink-0" />
      <div>
        <p className="text-white font-bold text-sm leading-none">{value}</p>
        <p className="text-white/60 text-[11px] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Auth form ────────────────────────────────────────────────────────────────

function AuthForm() {
  const { loginWithPassword, registerWithPassword } = useAuth();
  const [tab, setTab]           = useState<"login" | "register">("login");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm]     = useState({
    email: "", password: "", firstName: "", lastName: "", isDoctor: false,
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const r = await loginWithPassword(loginForm.email, loginForm.password);
    setLoading(false);
    if (r.error) setError(r.error);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (regForm.password.length < 6) { setError("Şifre en az 6 karakter olmalıdır."); return; }
    setLoading(true);
    const r = await registerWithPassword(regForm.email, regForm.password, regForm.firstName || undefined, regForm.lastName || undefined, regForm.isDoctor);
    setLoading(false);
    if (r.error) setError(r.error);
  }

  const inputCls = "w-full text-sm border border-border rounded-xl px-3.5 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/60 transition-shadow";
  const labelCls = "block text-xs font-semibold text-foreground/70 mb-1.5 tracking-wide";

  return (
    <div className="w-full max-w-sm">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-2xl bg-muted border mb-6">
        {(["login", "register"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "login" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
        ))}
      </div>

      {/* ── Login ─────────────────────────────────── */}
      {tab === "login" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={labelCls}>E-posta</label>
            <input
              type="email" required autoComplete="email" placeholder="ornek@eposta.com"
              className={inputCls}
              value={loginForm.email}
              onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Şifre</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"} required autoComplete="current-password"
                placeholder="••••••••"
                className={`${inputCls} pr-10`}
                value={loginForm.password}
                onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button type="button" tabIndex={-1}
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <ErrorBox msg={error} />}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Giriş Yap
          </button>

          <p className="text-xs text-center text-muted-foreground pt-1">
            Hesabınız yok mu?{" "}
            <button type="button" onClick={() => { setTab("register"); setError(""); }}
              className="text-primary hover:underline font-semibold">
              Kayıt olun
            </button>
          </p>
        </form>
      )}

      {/* ── Register ──────────────────────────────── */}
      {tab === "register" && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ad</label>
              <input placeholder="Adınız" autoComplete="given-name"
                className={inputCls}
                value={regForm.firstName}
                onChange={(e) => setRegForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Soyad</label>
              <input placeholder="Soyadınız" autoComplete="family-name"
                className={inputCls}
                value={regForm.lastName}
                onChange={(e) => setRegForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>E-posta</label>
            <input type="email" required autoComplete="email" placeholder="ornek@eposta.com"
              className={inputCls}
              value={regForm.email}
              onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Şifre <span className="font-normal text-muted-foreground/60">(en az 6 karakter)</span></label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} required autoComplete="new-password"
                placeholder="••••••••"
                className={`${inputCls} pr-10`}
                value={regForm.password}
                onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button type="button" tabIndex={-1}
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <ErrorBox msg={error} />}

          {/* Doctor toggle */}
          <button
            type="button"
            onClick={() => setRegForm((f) => ({ ...f, isDoctor: !f.isDoctor }))}
            className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
              regForm.isDoctor ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              regForm.isDoctor ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${regForm.isDoctor ? "text-primary" : "text-foreground"}`}>
                Doktor olarak kayıt ol
              </p>
              <p className="text-xs text-muted-foreground">
                {regForm.isDoctor ? "Seçili — Vaka Doldur aracına erişebilirsiniz" : "Yalnızca sağlık profesyonelleri için"}
              </p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              regForm.isDoctor ? "border-primary bg-primary" : "border-border"
            }`}>
              {regForm.isDoctor && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Hesap Oluştur
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Hesabınız var mı?{" "}
            <button type="button" onClick={() => { setTab("login"); setError(""); }}
              className="text-primary hover:underline font-semibold">
              Giriş yapın
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl px-3 py-2.5">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  );
}

// ─── Main landing page ────────────────────────────────────────────────────────

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left: hero ─────────────────────────────────────────────────────── */}
      <div className="relative lg:flex-1 flex flex-col justify-between p-8 lg:p-12 bg-gradient-to-br from-[#0d7c60] via-[#0f9472] to-[#12b386] overflow-hidden">

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.03]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-xl tracking-tight">OnkoPanel</span>
            <span className="block text-white/50 text-[11px] -mt-0.5">Onkoloji Veri Panosu</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative my-10 lg:my-0">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3.5 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-white/90 text-xs font-medium">Onkoloji Verilerini Keşfedin</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            Türkiye'nin<br />
            <span className="text-emerald-200">Onkoloji</span><br />
            Veri Panosu
          </h1>
          <p className="text-white/70 text-base lg:text-lg leading-relaxed max-w-md">
            979 hasta kaydından türetilen klinik verilerle kanser türleri,
            demografik dağılımlar ve tedavi trendlerini inceleyin.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-8 max-w-sm">
            <StatPill icon={Users}        value="979"  label="Benzersiz Hasta" />
            <StatPill icon={BarChart2}    value="1.000" label="Toplam Başvuru" />
            <StatPill icon={FlaskConical} value="18"   label="Kanser Türü" />
            <StatPill icon={HeartPulse}   value="%12"  label="Vefat Oranı" />
          </div>
        </div>

        {/* Footer note */}
        <p className="relative text-white/40 text-[11px]">
          Bu veriler bilgi amaçlıdır. Klinik karar verme süreçlerinde kullanılmamalıdır.
        </p>
      </div>

      {/* ── Right: auth form ───────────────────────────────────────────────── */}
      <div className="lg:w-[480px] flex flex-col items-center justify-center p-8 lg:p-12 bg-background">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">OnkoPanel</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-foreground mb-1">Hoş Geldiniz</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Devam etmek için giriş yapın veya yeni hesap oluşturun.
          </p>
          <AuthForm />
        </div>
      </div>

    </div>
  );
}
