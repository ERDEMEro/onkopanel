import { useState, useEffect, useRef } from "react";
import { Stethoscope, Building2, UserPlus, ChevronLeft, Send, Clock, CheckCircle2, XCircle, MessageCircle, Search, ArrowLeft, Loader2, Filter } from "lucide-react";
import { PremiumGate } from "@/components/PremiumGate";

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

const CANCER_TYPES = [
  "Akciğer Kanseri", "Meme Kanseri", "Kolorektal Kanser", "Prostat Kanseri",
  "Mesane Kanseri", "Melanom", "Lenfoma", "Lösemi", "Tiroid Kanseri",
  "Mide Kanseri", "Karaciğer Kanseri", "Pankreas Kanseri",
  "Yumurtalık Kanseri", "Rahim Kanseri",
];

interface Doctor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  specialty: string;
  hospital: string | null;
  bio: string | null;
}

interface Invitation {
  id: string;
  doctorId: string;
  status: "pending" | "accepted" | "rejected";
  patientMessage: string | null;
  createdAt: string;
  doctorFirstName: string | null;
  doctorLastName: string | null;
  doctorImageUrl: string | null;
  specialty: string | null;
  hospital: string | null;
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
    <div className={`${cls} rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "accepted" | "rejected" }) {
  if (status === "accepted") return (
    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
      <CheckCircle2 className="w-3 h-3" /> Kabul edildi
    </span>
  );
  if (status === "rejected") return (
    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
      <XCircle className="w-3 h-3" /> Reddedildi
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" /> Bekliyor
    </span>
  );
}

export default function DoktorDavet() {
  const [tab, setTab] = useState<"list" | "conversations">("list");
  const [specialty, setSpecialty] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteDoctor, setInviteDoctor] = useState<Doctor | null>(null);
  const [inviteMsg, setInviteMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [chatInvId, setChatInvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingInv, setLoadingInv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchDoctors() {
    setLoading(true);
    try {
      const url = specialty ? `${BASE}/api/doctors?specialty=${encodeURIComponent(specialty)}` : `${BASE}/api/doctors`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json() as { doctors: Doctor[] };
      setDoctors(data.doctors ?? []);
    } finally { setLoading(false); }
  }

  async function fetchInvitations() {
    setLoadingInv(true);
    try {
      const res = await fetch(`${BASE}/api/doctor-invitations`, { credentials: "include" });
      const data = await res.json() as { invitations: Invitation[] };
      setInvitations(data.invitations ?? []);
    } finally { setLoadingInv(false); }
  }

  async function fetchMessages(invId: string) {
    const res = await fetch(`${BASE}/api/doctor-messages/${invId}`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json() as { messages: Message[] };
    setMessages(data.messages ?? []);
  }

  useEffect(() => { fetchDoctors(); fetchInvitations(); }, []);
  useEffect(() => { fetchDoctors(); }, [specialty]);

  useEffect(() => {
    if (chatInvId) {
      fetchMessages(chatInvId);
      pollRef.current = setInterval(() => fetchMessages(chatInvId), 5000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [chatInvId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendInvite() {
    if (!inviteDoctor) return;
    setSending(true); setError(null);
    try {
      const res = await fetch(`${BASE}/api/doctor-invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctorId: inviteDoctor.id, patientMessage: inviteMsg || undefined }),
      });
      if (!res.ok) { const d = await res.json() as { error?: string }; throw new Error(d.error ?? "Hata"); }
      setInviteDoctor(null); setInviteMsg("");
      await fetchInvitations();
      setTab("conversations");
    } catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
    finally { setSending(false); }
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

  const invitedDoctorIds = new Set(invitations.map(i => i.doctorId));
  const invitationByDoctor = Object.fromEntries(invitations.map(i => [i.doctorId, i]));
  const chatInv = invitations.find(i => i.id === chatInvId);

  // ─── Chat View ────────────────────────────────────────────────────────────────
  if (chatInvId && chatInv) {
    const doctorName = [chatInv.doctorFirstName, chatInv.doctorLastName].filter(Boolean).join(" ") || "Doktor";
    return (
      <PremiumGate featureName="Doktor Mesajlaşma">
      <div className="flex flex-col h-[calc(100vh-52px)] bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0">
          <button onClick={() => { setChatInvId(null); setMessages([]); if (pollRef.current) clearInterval(pollRef.current); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Avatar name={doctorName} size="sm" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Dr. {doctorName}</p>
            <p className="text-xs text-slate-400">{chatInv.specialty ?? ""} · {chatInv.hospital ?? ""}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
              <MessageCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm">Henüz mesaj yok. İlk mesajı gönderin!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId !== chatInv.doctorId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  isMe ? "bg-indigo-500 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-indigo-200" : "text-slate-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t bg-white shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Mesajınızı yazın…"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
            />
            <button
              onClick={sendMessage}
              disabled={!newMsg.trim() || msgSending}
              className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {msgSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      </PremiumGate>
    );
  }

  // ─── Main View ────────────────────────────────────────────────────────────────
  return (
    <PremiumGate featureName="Doktor Bağlantısı">
    <div className="min-h-[calc(100vh-52px)] bg-gradient-to-br from-indigo-50/30 via-white to-violet-50/20 p-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800">Doktorum</h1>
            <p className="text-xs text-slate-400">Uzman doktorlarla bağlantı kurun</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
          {[{ key: "list", label: "Doktor Listesi" }, { key: "conversations", label: `Yazışmalarım${invitations.length > 0 ? ` (${invitations.length})` : ""}` }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as "list" | "conversations")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Doctor List Tab ── */}
        {tab === "list" && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 px-3 py-2 shadow-sm">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select value={specialty} onChange={e => setSpecialty(e.target.value)}
                className="flex-1 text-sm text-slate-700 bg-transparent outline-none">
                <option value="">Tüm uzmanlık alanları</option>
                {CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Bu alanda kayıtlı doktor bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map(doc => {
                  const fullName = [doc.firstName, doc.lastName].filter(Boolean).join(" ") || "Doktor";
                  const inv = invitationByDoctor[doc.id];
                  return (
                    <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-indigo-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <Avatar name={fullName} imageUrl={doc.profileImageUrl} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">Dr. {fullName}</p>
                              <p className="text-xs font-medium text-indigo-500 mt-0.5">{doc.specialty}</p>
                            </div>
                            {inv ? (
                              <StatusBadge status={inv.status} />
                            ) : (
                              <button
                                onClick={() => { setInviteDoctor(doc); setInviteMsg(""); setError(null); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold transition-colors shrink-0"
                              >
                                <UserPlus className="w-3.5 h-3.5" /> Davet Et
                              </button>
                            )}
                          </div>
                          {doc.hospital && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Building2 className="w-3 h-3 shrink-0" /> {doc.hospital}
                            </p>
                          )}
                          {doc.bio && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{doc.bio}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Conversations Tab ── */}
        {tab === "conversations" && (
          <div className="space-y-3">
            {loadingInv ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Henüz davet göndermediniz.</p>
                <button onClick={() => setTab("list")} className="mt-3 text-xs text-indigo-500 hover:underline">
                  Doktor listesine git →
                </button>
              </div>
            ) : (
              invitations.map(inv => {
                const dName = [inv.doctorFirstName, inv.doctorLastName].filter(Boolean).join(" ") || "Doktor";
                return (
                  <div key={inv.id}
                    className={`bg-white rounded-2xl border shadow-sm p-4 transition-colors ${inv.status === "accepted" ? "border-green-100 hover:border-green-200 cursor-pointer" : "border-slate-100"}`}
                    onClick={() => inv.status === "accepted" ? setChatInvId(inv.id) : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={dName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800">Dr. {dName}</p>
                          <StatusBadge status={inv.status} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {inv.specialty ?? ""}{inv.hospital ? ` · ${inv.hospital}` : ""}
                        </p>
                        {inv.status === "accepted" && (
                          <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1 font-medium">
                            <MessageCircle className="w-3 h-3" /> Mesajlaşmaya başla
                          </p>
                        )}
                        {inv.status === "pending" && (
                          <p className="text-xs text-slate-400 mt-1">Doktorun yanıtı bekleniyor…</p>
                        )}
                        {inv.status === "rejected" && (
                          <p className="text-xs text-slate-400 mt-1">Bu davet kabul edilmedi.</p>
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

      {/* ── Invite Modal ── */}
      {inviteDoctor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={[inviteDoctor.firstName, inviteDoctor.lastName].filter(Boolean).join(" ") || "D"} imageUrl={inviteDoctor.profileImageUrl} />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Dr. {[inviteDoctor.firstName, inviteDoctor.lastName].filter(Boolean).join(" ")}
                </p>
                <p className="text-xs text-indigo-500">{inviteDoctor.specialty}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Bu doktora bir bağlantı daveti göndermek üzeresiniz. İsteğe bağlı bir mesaj ekleyebilirsiniz.
            </p>
            <textarea
              value={inviteMsg}
              onChange={e => setInviteMsg(e.target.value)}
              placeholder="Kendinizi tanıtmak veya durumunuz hakkında kısa bir not eklemek ister misiniz? (isteğe bağlı)"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-3"
            />
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setInviteDoctor(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Vazgeç
              </button>
              <button onClick={sendInvite} disabled={sending}
                className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Davet Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PremiumGate>
  );
}
