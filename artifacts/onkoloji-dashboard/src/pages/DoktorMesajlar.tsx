import { useState, useEffect, useRef } from "react";
import { Stethoscope, Building2, MessageCircle, Send, Clock, CheckCircle2, XCircle, ArrowLeft, Loader2, UserCheck, Check, X, NotebookPen } from "lucide-react";

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

const CANCER_TYPES = [
  "Akciğer Kanseri", "Meme Kanseri", "Kolorektal Kanser", "Prostat Kanseri",
  "Mesane Kanseri", "Melanom", "Lenfoma", "Lösemi", "Tiroid Kanseri",
  "Mide Kanseri", "Karaciğer Kanseri", "Pankreas Kanseri",
  "Yumurtalık Kanseri", "Rahim Kanseri",
];

interface DoctorProfile { id: string; specialty: string; hospital: string | null; bio: string | null; }

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
  if (imageUrl) return <img src={imageUrl} alt={name} className={`${cls} rounded-full object-cover ring-2 ring-primary/20`} />;
  return (
    <div className={`${cls} rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
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
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [chatInvId, setChatInvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchProfile() {
    setProfileLoading(true);
    try {
      const res = await fetch(`${BASE}/api/doctors/profile`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { profile: DoctorProfile | null };
        setProfile(data.profile);
        if (!data.profile) setShowProfileSetup(true);
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

  useEffect(() => { fetchProfile(); fetchInvitations(); }, []);

  useEffect(() => {
    if (chatInvId) {
      fetchMessages(chatInvId);
      pollRef.current = setInterval(() => fetchMessages(chatInvId), 5000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [chatInvId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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

  async function sendMessage() {
    if (!chatInvId || !newMsg.trim()) return;
    setMsgSending(true);
    try {
      const res = await fetch(`${BASE}/api/doctor-messages/${chatInvId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newMsg.trim() }),
      });
      if (res.ok) { setNewMsg(""); await fetchMessages(chatInvId); }
    } finally { setMsgSending(false); }
  }

  const pending = invitations.filter(i => i.status === "pending");
  const accepted = invitations.filter(i => i.status === "accepted");
  const chatInv = invitations.find(i => i.id === chatInvId);

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-52px)]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ─── Profile Setup ────────────────────────────────────────────────────────────
  if (showProfileSetup) {
    return (
      <div className="min-h-[calc(100vh-52px)] flex items-center justify-center bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20 p-4">
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 w-full max-w-md">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Doktor Profilinizi Tamamlayın</h1>
              <p className="text-xs text-slate-400">Hastalar sizi bulabilmek için bu bilgilere ihtiyaç duyar</p>
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
            <button onClick={saveProfile} disabled={!pSpecialty || savingProfile}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              Profili Kaydet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Chat View ────────────────────────────────────────────────────────────────
  if (chatInvId && chatInv) {
    const patientName = [chatInv.patientFirstName, chatInv.patientLastName].filter(Boolean).join(" ") || chatInv.patientEmail || "Hasta";
    return (
      <div className="flex flex-col h-[calc(100vh-52px)] bg-white">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0">
          <button onClick={() => { setChatInvId(null); setMessages([]); if (pollRef.current) clearInterval(pollRef.current); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Avatar name={patientName} size="sm" imageUrl={chatInv.patientImageUrl} />
          <div>
            <p className="text-sm font-semibold text-slate-800">{patientName}</p>
            <p className="text-xs text-slate-400">Hasta</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
              <MessageCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm">Henüz mesaj yok.</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId !== chatInv.patientId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  isMe ? "bg-emerald-500 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-emerald-200" : "text-slate-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="px-4 py-3 border-t bg-white shrink-0">
          <div className="flex items-center gap-2">
            <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Hastaya mesaj yazın…"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition" />
            <button onClick={sendMessage} disabled={!newMsg.trim() || msgSending}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 shadow-sm">
              {msgSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main View ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-52px)] bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Hasta Yazışmaları</h1>
              <p className="text-xs text-slate-400">{profile?.specialty ?? ""} · {profile?.hospital ?? ""}</p>
            </div>
          </div>
          <button onClick={() => setShowProfileSetup(true)}
            className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors">
            <NotebookPen className="w-3.5 h-3.5" /> Profili Düzenle
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
          {[
            { key: "invitations", label: `Gelen Davetler${pending.length > 0 ? ` (${pending.length})` : ""}` },
            { key: "conversations", label: `Aktif Yazışmalar${accepted.length > 0 ? ` (${accepted.length})` : ""}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.key ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Gelen Davetler ── */}
        {tab === "invitations" && (
          <div className="space-y-3">
            {loadingInv ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Henüz davet bulunmuyor.</p>
                <p className="text-xs mt-1">Hastalar profilinizi görüp davet gönderebilir.</p>
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
                              <CheckCircle2 className="w-3 h-3" /> Kabul edildi
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
                              <XCircle className="w-3 h-3" /> Reddedildi
                            </span>
                          )}
                        </div>
                        {inv.patientMessage && (
                          <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2 italic leading-relaxed">
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
          <div className="space-y-3">
            {accepted.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Henüz kabul edilmiş davet yok.</p>
                <button onClick={() => setTab("invitations")} className="mt-2 text-xs text-emerald-500 hover:underline">
                  Gelen davetleri görüntüle →
                </button>
              </div>
            ) : (
              accepted.map(inv => {
                const pName = [inv.patientFirstName, inv.patientLastName].filter(Boolean).join(" ") || inv.patientEmail || "Hasta";
                return (
                  <div key={inv.id} onClick={() => setChatInvId(inv.id)}
                    className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 cursor-pointer hover:border-emerald-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar name={pName} size="sm" imageUrl={inv.patientImageUrl} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{pName}</p>
                        <p className="text-xs text-emerald-500 mt-0.5 flex items-center gap-1 font-medium">
                          <MessageCircle className="w-3 h-3" /> Mesajlaşmaya başla
                        </p>
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
