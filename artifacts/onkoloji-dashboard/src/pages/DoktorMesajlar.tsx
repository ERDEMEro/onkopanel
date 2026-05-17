import { useState, useEffect, useRef } from "react";
import {
  Stethoscope, Building2, MessageCircle, Send, Clock, CheckCircle2, XCircle,
  ArrowLeft, Loader2, UserCheck, Check, X, NotebookPen, ChevronDown, Zap,
  ToggleLeft, ToggleRight,
} from "lucide-react";

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

const CANCER_TYPES = [
  "Akciğer Kanseri", "Meme Kanseri", "Kolorektal Kanser", "Prostat Kanseri",
  "Mesane Kanseri", "Melanom", "Lenfoma", "Lösemi", "Tiroid Kanseri",
  "Mide Kanseri", "Karaciğer Kanseri", "Pankreas Kanseri",
  "Yumurtalık Kanseri", "Rahim Kanseri",
];

const QUICK_REPLIES = [
  "Bilgi aldım, teşekkürler.",
  "Randevu için kliniğimizi arayabilirsiniz.",
  "Durumunuz hakkında daha fazla bilgi paylaşır mısınız?",
];

interface DoctorProfile {
  id: string;
  specialty: string;
  hospital: string | null;
  bio: string | null;
  isAvailable: boolean;
}

interface Invitation {
  id: string;
  patientId: string;
  status: "pending" | "accepted" | "rejected";
  patientMessage: string | null;
  createdAt: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientEmail: string | null;
  patientImageUrl: string | null;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: string | null;
}

interface Message {
  id: string;
  invitationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

function Avatar({ name, imageUrl, size = "md" }: { name: string; imageUrl?: string | null; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (imageUrl) return <img src={imageUrl} alt={name} className={`${cls} rounded-full object-cover ring-2 ring-emerald-100 shrink-0`} />;
  return (
    <div className={`${cls} rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "Az önce";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk önce`;
  if (diff < 86_400_000) return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function dateLabelForMsg(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDay.getTime() === today.getTime()) return "Bugün";
  if (msgDay.getTime() === yesterday.getTime()) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function useAutoResizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value]);
  return ref;
}

export default function DoktorMesajlar() {
  const [tab, setTab] = useState<"invitations" | "conversations">("invitations");
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [pSpecialty, setPSpecialty] = useState("");
  const [pHospital, setPHospital] = useState("");
  const [pBio, setPBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [chatInvId, setChatInvId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgTextareaRef = useAutoResizeTextarea(newMsg);

  async function fetchProfile() {
    setProfileLoading(true);
    try {
      const res = await fetch(`${BASE}/api/doctors/profile`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { profile: DoctorProfile | null };
        setProfile(data.profile);
        if (!data.profile) {
          setShowProfileSetup(true);
        } else {
          setPSpecialty(data.profile.specialty);
          setPHospital(data.profile.hospital ?? "");
          setPBio(data.profile.bio ?? "");
        }
      }
    } finally { setProfileLoading(false); }
  }

  async function fetchInvitations() {
    setLoadingInv(true);
    try {
      const res = await fetch(`${BASE}/api/doctor-invitations`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { invitations: Invitation[] };
        setInvitations(data.invitations ?? []);
      }
    } finally { setLoadingInv(false); }
  }

  async function fetchMessages(invId: string) {
    const res = await fetch(`${BASE}/api/doctor-messages/${invId}`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json() as { messages: Message[] };
    setMessages(data.messages ?? []);
  }

  async function fetchMe() {
    try {
      const res = await fetch(`${BASE}/api/auth/me`, { credentials: "include" });
      if (res.ok) {
        const d = await res.json() as { user?: { id: string } };
        setMyUserId(d.user?.id ?? null);
      }
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchProfile(); fetchInvitations(); fetchMe(); }, []);

  useEffect(() => {
    if (!chatInvId) return;
    fetchMessages(chatInvId);
    pollRef.current = setInterval(() => fetchMessages(chatInvId), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [chatInvId]);

  useEffect(() => {
    if (!showScrollBtn) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  }

  async function saveProfile() {
    if (!pSpecialty) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`${BASE}/api/doctors/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ specialty: pSpecialty, hospital: pHospital || undefined, bio: pBio || undefined }),
      });
      if (res.ok) {
        const data = await res.json() as { profile: DoctorProfile };
        setProfile(data.profile);
        setShowProfileSetup(false);
      }
    } finally { setSavingProfile(false); }
  }

  async function toggleAvailability() {
    if (!profile) return;
    setTogglingAvail(true);
    try {
      const res = await fetch(`${BASE}/api/doctors/profile/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAvailable: !profile.isAvailable }),
      });
      if (res.ok) setProfile(p => p ? { ...p, isAvailable: !p.isAvailable } : p);
    } finally { setTogglingAvail(false); }
  }

  async function respond(id: string, status: "accepted" | "rejected") {
    setResponding(id);
    try {
      const res = await fetch(`${BASE}/api/doctor-invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchInvitations();
    } finally { setResponding(null); }
  }

  async function sendMessage(content?: string) {
    const text = (content ?? newMsg).trim();
    if (!chatInvId || !text) return;
    setMsgSending(true);
    try {
      const res = await fetch(`${BASE}/api/doctor-messages/${chatInvId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        if (!content) setNewMsg("");
        setShowScrollBtn(false); setShowQuickReplies(false);
        await fetchMessages(chatInvId); await fetchInvitations();
      }
    } finally { setMsgSending(false); }
  }

  const pending = invitations.filter(i => i.status === "pending");
  const accepted = invitations
    .filter(i => i.status === "accepted")
    .sort((a, b) => {
      const ta = a.lastMessageAt ?? a.createdAt;
      const tb = b.lastMessageAt ?? b.createdAt;
      return new Date(tb).getTime() - new Date(ta).getTime();
    });
  const chatInv = invitations.find(i => i.id === chatInvId);
  const unreadCount = accepted.filter(i => i.lastMessageSenderId && i.lastMessageSenderId !== myUserId).length;

  // Date-grouped messages
  const msgGroups: Array<{ label: string; msgs: Message[] }> = [];
  for (const msg of messages) {
    const label = dateLabelForMsg(msg.createdAt);
    if (!msgGroups.length || msgGroups[msgGroups.length - 1].label !== label) {
      msgGroups.push({ label, msgs: [msg] });
    } else {
      msgGroups[msgGroups.length - 1].msgs.push(msg);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-52px)]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ─── Profile Setup ────────────────────────────────────────────────────────
  if (showProfileSetup) {
    return (
      <div className="min-h-[calc(100vh-52px)] flex items-center justify-center bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20 p-4">
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 w-full max-w-md">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shrink-0">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">
                {profile ? "Profilinizi Güncelleyin" : "Doktor Profilinizi Tamamlayın"}
              </h1>
              <p className="text-xs text-slate-400">Hastalar sizi bulmak için bu bilgilere ihtiyaç duyar</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Uzmanlık Alanı *</label>
              <select value={pSpecialty} onChange={e => setPSpecialty(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                <option value="">Seçiniz…</option>
                {CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Hastane / Klinik</label>
              <input value={pHospital} onChange={e => setPHospital(e.target.value)}
                placeholder="Örn: İstanbul Üniversitesi Tıp Fakültesi"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Kısa Biyografi</label>
              <textarea value={pBio} onChange={e => setPBio(e.target.value)}
                placeholder="Deneyimleriniz ve uzmanlık alanlarınız hakkında kısa bir tanıtım…"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
            <div className="flex gap-2 pt-1">
              {profile && (
                <button onClick={() => setShowProfileSetup(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Vazgeç
                </button>
              )}
              <button onClick={saveProfile} disabled={!pSpecialty || savingProfile}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                {profile ? "Güncelle" : "Profili Kaydet"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Chat View ────────────────────────────────────────────────────────────
  if (chatInvId && chatInv) {
    const patientName = [chatInv.patientFirstName, chatInv.patientLastName].filter(Boolean).join(" ") || chatInv.patientEmail || "Hasta";
    return (
      <div className="flex flex-col h-[calc(100vh-52px)] bg-white">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0 shadow-sm">
          <button onClick={() => { setChatInvId(null); setMessages([]); setShowQuickReplies(false); if (pollRef.current) clearInterval(pollRef.current); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Avatar name={patientName} size="sm" imageUrl={chatInv.patientImageUrl} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">{patientName}</p>
            <p className="text-xs text-slate-400">Hasta</p>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50/50 relative"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
              <MessageCircle className="w-10 h-10 opacity-20" />
              <p className="text-sm">Henüz mesaj yok.</p>
            </div>
          )}
          {msgGroups.map(group => (
            <div key={group.label}>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-400 font-medium px-2">{group.label}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="space-y-3">
                {group.msgs.map((msg) => {
                  const isMe = msg.senderId === myUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMe ? "bg-emerald-500 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                      }`}>
                        <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? "text-emerald-200" : "text-slate-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {showScrollBtn && (
          <button onClick={scrollToBottom}
            className="absolute bottom-28 right-5 z-10 w-9 h-9 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {/* Quick replies panel */}
        {showQuickReplies && (
          <div className="px-4 py-2 border-t bg-slate-50 shrink-0">
            <div className="flex gap-2 flex-wrap">
              {QUICK_REPLIES.map(qr => (
                <button key={qr}
                  onClick={() => sendMessage(qr)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-3 border-t bg-white shrink-0">
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowQuickReplies(v => !v)}
              className={`p-2 rounded-xl transition-colors shrink-0 ${showQuickReplies ? "bg-emerald-100 text-emerald-600" : "text-slate-400 hover:bg-slate-100"}`}
              title="Hızlı yanıtlar"
            >
              <Zap className="w-4 h-4" />
            </button>
            <textarea
              ref={msgTextareaRef}
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Hastaya mesaj yazın…  (Shift+Enter: yeni satır)"
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition resize-none overflow-hidden"
              style={{ minHeight: "42px", maxHeight: "120px" }}
            />
            <button onClick={() => sendMessage()} disabled={!newMsg.trim() || msgSending}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 shadow-sm shrink-0">
              {msgSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main View ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-52px)] bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Hasta Yazışmaları</h1>
              <p className="text-xs text-slate-400 truncate max-w-[180px]">
                {profile?.specialty ?? ""}{profile?.hospital ? ` · ${profile.hospital}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Availability toggle */}
            <button
              onClick={toggleAvailability}
              disabled={togglingAvail}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                profile?.isAvailable
                  ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {togglingAvail ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : profile?.isAvailable ? (
                <ToggleRight className="w-3.5 h-3.5" />
              ) : (
                <ToggleLeft className="w-3.5 h-3.5" />
              )}
              {profile?.isAvailable ? "Müsait" : "Müsait Değil"}
            </button>

            <button onClick={() => setShowProfileSetup(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
              <NotebookPen className="w-3.5 h-3.5" /> Profil
            </button>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
          {([
            { key: "invitations", label: "Gelen Davetler", badge: pending.length },
            { key: "conversations", label: "Aktif Yazışmalar", badge: unreadCount },
          ] as { key: string; label: string; badge?: number }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${tab === t.key ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
              {(t.badge ?? 0) > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Gelen Davetler ── */}
        {tab === "invitations" && (
          <div className="space-y-2.5">
            {loadingInv ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium text-slate-500">Henüz davet bulunmuyor</p>
                <p className="text-xs mt-1">Hastalar profilinizi görüp bağlantı daveti gönderebilir.</p>
                {!profile?.isAvailable && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left">
                    <p className="text-xs text-amber-700 font-medium">Müsait değil durumundasınız</p>
                    <p className="text-xs text-amber-600 mt-0.5">Hastalar tarafından görünmek için müsaitlik durumunuzu açın.</p>
                  </div>
                )}
              </div>
            ) : (
              invitations.map(inv => {
                const pName = [inv.patientFirstName, inv.patientLastName].filter(Boolean).join(" ") || inv.patientEmail || "Hasta";
                return (
                  <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={pName} size="sm" imageUrl={inv.patientImageUrl} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{pName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(inv.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          </div>
                          {inv.status === "pending" ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                              <Clock className="w-3 h-3" /> Bekliyor
                            </span>
                          ) : inv.status === "accepted" ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Kabul
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
                              <XCircle className="w-3 h-3" /> Reddedildi
                            </span>
                          )}
                        </div>
                        {inv.patientMessage && (
                          <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-xl px-3 py-2 italic leading-relaxed border border-slate-100">
                            "{inv.patientMessage}"
                          </p>
                        )}
                        {inv.status === "pending" && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => respond(inv.id, "rejected")}
                              disabled={responding === inv.id}
                              className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Reddet
                            </button>
                            <button
                              onClick={() => respond(inv.id, "accepted")}
                              disabled={responding === inv.id}
                              className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              {responding === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              Kabul Et
                            </button>
                          </div>
                        )}
                        {inv.status === "accepted" && (
                          <button onClick={() => { setChatInvId(inv.id); setTab("conversations"); }}
                            className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1 hover:underline">
                            <MessageCircle className="w-3 h-3" /> Mesajlaşmaya Git →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Aktif Yazışmalar ── */}
        {tab === "conversations" && (
          <div className="space-y-2.5">
            {accepted.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium text-slate-500">Henüz aktif yazışma yok</p>
                <button onClick={() => setTab("invitations")} className="mt-3 text-xs font-semibold text-emerald-600 hover:underline">
                  Gelen davetleri görüntüle →
                </button>
              </div>
            ) : (
              accepted.map(inv => {
                const pName = [inv.patientFirstName, inv.patientLastName].filter(Boolean).join(" ") || inv.patientEmail || "Hasta";
                const hasUnread = !!inv.lastMessageSenderId && inv.lastMessageSenderId !== myUserId;
                return (
                  <div key={inv.id} onClick={() => setChatInvId(inv.id)}
                    className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar name={pName} size="sm" imageUrl={inv.patientImageUrl} />
                        {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">{pName}</p>
                          {inv.lastMessageAt && (
                            <span className="text-[10px] text-slate-400 shrink-0">{formatTime(inv.lastMessageAt)}</span>
                          )}
                        </div>
                        {inv.lastMessageContent ? (
                          <p className={`text-xs mt-0.5 truncate ${hasUnread ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                            {inv.lastMessageSenderId === myUserId ? "Siz: " : ""}{inv.lastMessageContent}
                          </p>
                        ) : (
                          <p className="text-xs text-emerald-500 mt-0.5 flex items-center gap-1 font-medium">
                            <MessageCircle className="w-3 h-3" /> Mesajlaşmaya başlayın
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
