import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Activity, Eye, EyeOff, Loader2, AlertCircle, Stethoscope } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { loginWithPassword, registerWithPassword } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ email: "", password: "", firstName: "", lastName: "", isDoctor: false });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await loginWithPassword(loginForm.email, loginForm.password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
      setLoginForm({ email: "", password: "" });
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (regForm.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setLoading(true);
    const result = await registerWithPassword(
      regForm.email,
      regForm.password,
      regForm.firstName || undefined,
      regForm.lastName || undefined,
      regForm.isDoctor,
    );
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
      setRegForm({ email: "", password: "", firstName: "", lastName: "", isDoctor: false });
    }
  }

  function handleTabChange(val: string) {
    setTab(val as "login" | "register");
    setError("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Brand header */}
        <div className="bg-primary px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <DialogTitle className="text-primary-foreground font-bold text-lg leading-tight">OnkoPanel</DialogTitle>
            <p className="text-primary-foreground/70 text-xs">Onkoloji Veri Panosu</p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4">
          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="w-full mb-5">
              <TabsTrigger value="login" className="flex-1">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register" className="flex-1">Kayıt Ol</TabsTrigger>
            </TabsList>

            {/* Login tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">E-posta</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ornek@eposta.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Şifre</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Giriş Yap
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Hesabınız yok mu?{" "}
                  <button type="button" onClick={() => handleTabChange("register")} className="text-primary hover:underline font-medium">
                    Kayıt olun
                  </button>
                </p>
              </form>
            </TabsContent>

            {/* Register tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-first">Ad</Label>
                    <Input
                      id="reg-first"
                      placeholder="Adınız"
                      value={regForm.firstName}
                      onChange={(e) => setRegForm((f) => ({ ...f, firstName: e.target.value }))}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-last">Soyad</Label>
                    <Input
                      id="reg-last"
                      placeholder="Soyadınız"
                      value={regForm.lastName}
                      onChange={(e) => setRegForm((f) => ({ ...f, lastName: e.target.value }))}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">E-posta</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="ornek@eposta.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">Şifre <span className="text-muted-foreground font-normal">(en az 6 karakter)</span></Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={regForm.password}
                      onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Doctor toggle */}
                <button
                  type="button"
                  onClick={() => setRegForm((f) => ({ ...f, isDoctor: !f.isDoctor }))}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                    regForm.isDoctor
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    regForm.isDoctor ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${regForm.isDoctor ? "text-primary" : "text-foreground"}`}>
                      Doktor olarak kayıt ol
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {regForm.isDoctor ? "Seçili — Vaka Doldur aracına erişebilirsiniz" : "Tıklayın — yalnızca sağlık profesyonelleri için"}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    regForm.isDoctor ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {regForm.isDoctor && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Hesap Oluştur
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Zaten hesabınız var mı?{" "}
                  <button type="button" onClick={() => handleTabChange("login")} className="text-primary hover:underline font-medium">
                    Giriş yapın
                  </button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
