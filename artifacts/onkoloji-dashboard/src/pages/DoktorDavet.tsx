import { useState, useEffect, useRef, useCallback } from "react";
import {
  Stethoscope, Building2, UserPlus, Send, Clock, CheckCircle2, XCircle,
  MessageCircle, ArrowLeft, Loader2, Filter, Search, Trash2, ChevronDown, X,
} from "lucide-react";
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
  isAvailable: boolean;
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

function Avatar({ name, imageUrl, size = "md" }: { name: string; imageUrl?: string | null; size?: "sm" | "md" | "lg" }) {
  const cls = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  if (imageUrl) return <img src={imageUrl} alt={name} className={`${cls} rounded-full object-cover ring-2 ring-indigo-100 shrink-0`} />;
  return (
    <div className={`${cls} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function AvailableDot({ available }: { available: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${available ? "bg-green-400" : "bg-slate-300"}`} title={available ? "Müsait" : "Müsait Değil"} />
  );
}

function StatusBadge({ status }: { status: "pending" | "accepted" | "rejected" }) {
  if (status === "accepted") return (
    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
      <CheckCircle2 className="w-3 h-3" /> Kabul
    </span>
  );
  if (status === "rejected") return (
    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
      <XCircle className="w-3 h-3" /> Reddedildi
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
      <Clock className="w-3 h-3" /> Bekliyor
    </span>
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

export default function DoktorDavet() {
  const [tab, setTab] = useState<"list" | "conversations">("list");
  const [specialty, setSpecialty] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteDoctor, setInviteDoctor] = useState<Doctor | null>(null);
  const [profileModal, setProfileModal] = useState<Doctor | null>(null);
  const [inviteMsg, setInviteMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [chatInvId, setChatInvId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgTextareaRef = useAutoResizeTextarea(newMsg);

  const fetchDoctors = useCallback(async (q?: string, spec?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const specVal = spec !== undefined ? spec : specialty;
      const qVal = q !== undefined ? q : searchQ;
      if (specVal) params.set("specialty", specVal);
      if (qVal) params.set("q", qVal);
      const url = `${BASE}/api/doctors${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json() as { doctors: Doctor[] };
      setDoctors(data.doctors ?? []);
    } finally { setLoading(false); }
  }, [specialty, searchQ]);

  async function fetchInvitations() {
    try {
      const res = await fetch(`${BASE}/api/doctor-invitations`, { credentials: "include" });
      const data = await res.json() as { invitations: Invitation[] };
      setInvitations(data.invitations ?? []);
    } catch { /* ignore */ }
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

  useEffect(() => { fetchDoctors(); fetchInvitations(); fetchMe(); }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchDoctors(searchQ, specialty), 350);
  }, [searchQ, specialty]);

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
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  }

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

  async function cancelInvite(id: string) {
    setCancelling(id);
    try {
      await fetch(`${BASE}/api/doctor-invitations/${id}`, { method: "DELETE", credentials: "include" });
      await fetchInvitations();
    } finally { setCancelling(null); }
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
      if (res.ok) {
        setNewMsg(""); setShowScrollBtn(false);
        await fetchMessages(chatInvId); await fetchInvitations();
      }
    } finally { setMsgSending(false); }
  }

  const invitationByDoctor = Object.fromEntries(invitations.map(i => [i.doctorId, i]));
  const chatInv = invitations.find(i => i.id === chatInvId);
  const acceptedInvs = invitations.filter(i => i.status === "accepted");
  const unreadCount = acceptedInvs.filter(i => i.lastMessageSenderId && i.lastMessageSenderId !== myUserId).length;

  // Build date-separated message groups
  const msgGroups: Array<{ label: string; msgs: Message[] }> = [];
  for (const msg of messages) {
    const label = dateLabelForMsg(msg.createdAt);
    if (!msgGroups.length || msgGroups[msgGroups.length - 1].label !== label) {
      msgGroups.push({ label, msgs: [msg] });
    } else {
      msgGroups[msgGroups.length - 1].msgs.push(msg);
    }
  }

  // ─── Chat View ─────────────────────────────────────────────────────────────
  if (chatInvId && chatInv) {
    const doctorName = [chatInv.doctorFirstName, chatInv.doctorLastName].filter(Boolean).join(" ") || "Doktor";
    return (
      <PremiumGate featureName="Doktor Mesajlaşma">
      <div className="flex flex-col h-[calc(100vh-52px)] bg-white">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0 shadow-sm">
          <button onClick={() => { setChatInvId(null); setMessages([]); if (pollRef.current) clearInterval(pollRef.current); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Avatar name={doctorName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Dr. {doctorName}</p>
            <p className="text-xs text-slate-400 truncate">{chatInv.specialty ?? ""}{chatInv.hospital ? ` · ${chatInv.hospital}` : ""}</p>
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
              <p className="text-sm">Henüz mesaj yok. İlk mesajı gönderin!</p>
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
                {group.msgs.map(msg => {
                  const isMe = msg.senderId === myUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMe ? "bg-indigo-500 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                      }`}>
                        <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? "text-indigo-200" : "text-slate-400"}`}>
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
            className="absolute bottom-24 right-5 z-10 w-9 h-9 rounded-full bg-indigo-500 text-white shadow-lg flex items-center justify-center hover:bg-indigo-600 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        <div className="px-4 py-3 border-t bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={msgTextareaRef}
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Mesajınızı yazın…  (Shift+Enter: yeni satır)"
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition resize-none overflow-hidden"
              style={{ minHeight: "42px", maxHeight: "120px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!newMsg.trim() || msgSending}
              className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
            >
              {msgSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      </PremiumGate>
    );
  }

  // ─── Main View ─────────────────────────────────────────────────────────────
  return (
    <PremiumGate featureName="Doktor Bağlantısı">
    <div className="min-h-[calc(100vh-52px)] bg-gradient-to-br from-indigo-50/30 via-white to-violet-50/20 p-4">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800">Doktorum</h1>
            <p className="text-xs text-slate-400">Uzman onkologlarla güvenli bağlantı kurun</p>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
          {([
            { key: "list", label: "Doktor Listesi" },
            { key: "conversations", label: `Yazışmalarım${invitations.length > 0 ? ` (${invitations.length})` : ""}`, badge: unreadCount },
          ] as { key: string; label: string; badge?: number }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key as "list" | "conversations")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${tab === t.key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
              {(t.badge ?? 0) > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Doctor List Tab ── */}
        {tab === "list" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 px-3 py-2 shadow-sm flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="İsim veya hastane ara…"
                  className="flex-1 text-sm text-slate-700 bg-transparent outline-none placeholder:text-slate-400 min-w-0"
                />
                {searchQ && (
                  <button onClick={() => setSearchQ("")} className="text-slate-400 hover:text-slate-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
                )}
              </div>
              <div className="flex items-center gap-1.5 bg-white rounded-xl border border-slate-100 px-3 py-2 shadow-sm shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select value={specialty} onChange={e => setSpecialty(e.target.value)}
                  className="text-xs text-slate-700 bg-transparent outline-none max-w-[120px]">
                  <option value="">Tüm uzmanlıklar</option>
                  {CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium text-slate-500">Doktor bulunamadı</p>
                <p className="text-xs mt-1">Arama veya filtre kriterlerinizi değiştirin.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {doctors.map(doc => {
                  const fullName = [doc.firstName, doc.lastName].filter(Boolean).join(" ") || "Doktor";
                  const inv = invitationByDoctor[doc.id];
                  return (
                    <div key={doc.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-indigo-200 transition-all hover:shadow-md cursor-pointer"
                      onClick={() => setProfileModal(doc)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={fullName} imageUrl={doc.profileImageUrl} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-slate-800">Dr. {fullName}</p>
                                <AvailableDot available={doc.isAvailable} />
                              </div>
                              <span className="inline-block text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-0.5">{doc.specialty}</span>
                            </div>
                            <div onClick={e => e.stopPropagation()}>
                              {inv ? (
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={inv.status} />
                                  {inv.status === "accepted" && (
                                    <button onClick={() => { setChatInvId(inv.id); setTab("conversations"); }}
                                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                                      <MessageCircle className="w-3 h-3" /> Mesajlaş
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setInviteDoctor(doc); setInviteMsg(""); setError(null); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold transition-colors"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> Davet Et
                                </button>
                              )}
                            </div>
                          </div>
                          {doc.hospital && (
                            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                              <Building2 className="w-3 h-3 shrink-0 text-slate-400" /> {doc.hospital}
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
          <div className="space-y-2.5">
            {invitations.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium text-slate-500">Henüz davet göndermediniz</p>
                <p className="text-xs mt-1 mb-4">Doktor listesinden bir onkolog seçerek bağlantı kurabilirsiniz.</p>
                <button onClick={() => setTab("list")} className="text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-xl transition-colors">
                  Doktor Listesine Git →
                </button>
              </div>
            ) : (
              invitations.map(inv => {
                const dName = [inv.doctorFirstName, inv.doctorLastName].filter(Boolean).join(" ") || "Doktor";
                const hasUnread = inv.status === "accepted" && !!inv.lastMessageSenderId && inv.lastMessageSenderId !== myUserId;
                return (
                  <div key={inv.id}
                    className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                      inv.status === "accepted" ? "border-indigo-100 hover:border-indigo-200 hover:shadow-md cursor-pointer" : "border-slate-100"
                    }`}
                    onClick={() => inv.status === "accepted" ? setChatInvId(inv.id) : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar name={dName} imageUrl={inv.doctorImageUrl} />
                        {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">Dr. {dName}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            {inv.lastMessageAt && <span className="text-[10px] text-slate-400">{formatTime(inv.lastMessageAt)}</span>}
                            <StatusBadge status={inv.status} />
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {inv.specialty ?? ""}{inv.hospital ? ` · ${inv.hospital}` : ""}
                        </p>
                        {inv.lastMessageContent ? (
                          <p className={`text-xs mt-1 truncate ${hasUnread ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                            {inv.lastMessageSenderId === myUserId ? "Siz: " : "Dr: "}{inv.lastMessageContent}
                          </p>
                        ) : inv.status === "pending" ? (
                          <p className="text-xs text-amber-500 mt-1">Doktorun yanıtı bekleniyor…</p>
                        ) : inv.status === "accepted" ? (
                          <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1 font-medium">
                            <MessageCircle className="w-3 h-3" /> Mesajlaşmaya başlayın
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1">Bu davet kabul edilmedi.</p>
                        )}
                      </div>
                      {inv.status === "pending" && (
                        <button
                          onClick={e => { e.stopPropagation(); cancelInvite(inv.id); }}
                          disabled={cancelling === inv.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          title="Daveti Geri Al"
                        >
                          {cancelling === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Doctor Profile Modal ── */}
      {profileModal && (() => {
        const fullName = [profileModal.firstName, profileModal.lastName].filter(Boolean).join(" ") || "Doktor";
        const inv = invitationByDoctor[profileModal.id];
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setProfileModal(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 px-6 pt-6 pb-10 text-white relative">
                <button onClick={() => setProfileModal(null)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-end gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                    {profileModal.profileImageUrl
                      ? <img src={profileModal.profileImageUrl} alt={fullName} className="w-full h-full rounded-2xl object-cover" />
                      : fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-bold">Dr. {fullName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">{profileModal.specialty}</span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${profileModal.isAvailable ? "text-green-200" : "text-white/60"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${profileModal.isAvailable ? "bg-green-300" : "bg-white/40"}`} />
                        {profileModal.isAvailable ? "Müsait" : "Müsait Değil"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 -mt-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
                  {profileModal.hospital && (
                    <div className="flex items-start gap-2.5">
                      <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Hastane / Klinik</p>
                        <p className="text-sm text-slate-700 font-medium">{profileModal.hospital}</p>
                      </div>
                    </div>
                  )}
                  {profileModal.bio && (
                    <div className="flex items-start gap-2.5">
                      <Stethoscope className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-1">Hakkında</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{profileModal.bio}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4">
                {inv ? (
                  <div className="flex items-center justify-between">
                    <StatusBadge status={inv.status} />
                    {inv.status === "accepted" && (
                      <button
                        onClick={() => { setProfileModal(null); setChatInvId(inv.id); setTab("conversations"); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> Mesajlaşmaya Git
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => { setProfileModal(null); setInviteDoctor(profileModal); setInviteMsg(""); setError(null); }}
                    className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Davet Gönder
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Invite Modal ── */}
      {inviteDoctor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={[inviteDoctor.firstName, inviteDoctor.lastName].filter(Boolean).join(" ") || "D"} imageUrl={inviteDoctor.profileImageUrl} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  Dr. {[inviteDoctor.firstName, inviteDoctor.lastName].filter(Boolean).join(" ")}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{inviteDoctor.specialty}</span>
                  <AvailableDot available={inviteDoctor.isAvailable} />
                  <span className="text-[11px] text-slate-400">{inviteDoctor.isAvailable ? "Müsait" : "Müsait Değil"}</span>
                </div>
                {inviteDoctor.hospital && (
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" />{inviteDoctor.hospital}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Davet gönderdiğinizde doktor sizi görebilir ve kabul ya da reddedebilir.
            </p>
            <textarea
              value={inviteMsg}
              onChange={e => setInviteMsg(e.target.value)}
              placeholder="Kendinizi tanıtmak veya durumunuz hakkında kısa bir not eklemek ister misiniz? (isteğe bağlı)"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-1"
            />
            <p className="text-right text-[10px] text-slate-400 mb-3">{inviteMsg.length} / 500</p>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setInviteDoctor(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Vazgeç
              </button>
              <button onClick={sendInvite} disabled={sending || inviteMsg.length > 500}
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
