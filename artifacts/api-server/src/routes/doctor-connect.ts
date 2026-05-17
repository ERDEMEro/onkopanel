import { Router, type Request, type Response } from "express";
import { db, usersTable, doctorProfilesTable, doctorInvitationsTable, doctorPatientMessagesTable } from "@workspace/db";
import { eq, and, or, desc, asc, ilike, sql } from "drizzle-orm";
import { getSessionId, getSession } from "../lib/auth";

const router = Router();

async function requireAuth(req: Request, res: Response) {
  const sid = getSessionId(req);
  if (!sid) { res.status(401).json({ error: "Oturum açmanız gerekiyor." }); return null; }
  const session = await getSession(sid);
  if (!session?.user?.id) { res.status(401).json({ error: "Oturum açmanız gerekiyor." }); return null; }
  return { id: session.user.id, isDoctor: !!session.user.isDoctor };
}

// ─── Doctors list ────────────────────────────────────────────────────────────

router.get("/doctors", async (req: Request, res: Response): Promise<void> => {
  const specialty = req.query.specialty as string | undefined;
  const q = req.query.q as string | undefined;

  const conditions = [eq(usersTable.isDoctor, true)];
  if (specialty) conditions.push(eq(doctorProfilesTable.specialty, specialty));
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(usersTable.firstName, like),
        ilike(usersTable.lastName, like),
        ilike(doctorProfilesTable.hospital, like),
        ilike(doctorProfilesTable.bio, like),
      )!
    );
  }

  const rows = await db
    .select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      specialty: doctorProfilesTable.specialty,
      hospital: doctorProfilesTable.hospital,
      bio: doctorProfilesTable.bio,
    })
    .from(usersTable)
    .innerJoin(doctorProfilesTable, eq(usersTable.id, doctorProfilesTable.userId))
    .where(and(...conditions))
    .orderBy(asc(usersTable.lastName));

  res.json({ doctors: rows });
});

// ─── Doctor profile (self) ────────────────────────────────────────────────────

router.get("/doctors/profile", async (req: Request, res: Response): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!user.isDoctor) { res.status(403).json({ error: "Yalnızca doktorlar erişebilir." }); return; }

  const [profile] = await db.select().from(doctorProfilesTable).where(eq(doctorProfilesTable.userId, user.id)).limit(1);
  res.json({ profile: profile ?? null });
});

router.post("/doctors/profile", async (req: Request, res: Response): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!user.isDoctor) { res.status(403).json({ error: "Yalnızca doktorlar erişebilir." }); return; }

  const { specialty, hospital, bio } = req.body as { specialty?: string; hospital?: string; bio?: string };
  if (!specialty) { res.status(400).json({ error: "Uzmanlık alanı gereklidir." }); return; }

  const existing = await db.select().from(doctorProfilesTable).where(eq(doctorProfilesTable.userId, user.id)).limit(1);
  if (existing.length > 0) {
    await db.update(doctorProfilesTable).set({ specialty, hospital, bio }).where(eq(doctorProfilesTable.userId, user.id));
  } else {
    await db.insert(doctorProfilesTable).values({ userId: user.id, specialty, hospital, bio });
  }
  const [profile] = await db.select().from(doctorProfilesTable).where(eq(doctorProfilesTable.userId, user.id)).limit(1);
  res.json({ profile });
});

// ─── Invitations ─────────────────────────────────────────────────────────────

router.get("/doctor-invitations", async (req: Request, res: Response): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const lastMsgContent = sql<string | null>`(SELECT content FROM doctor_patient_messages WHERE invitation_id = ${doctorInvitationsTable.id} ORDER BY created_at DESC LIMIT 1)`;
  const lastMsgAt = sql<string | null>`(SELECT created_at FROM doctor_patient_messages WHERE invitation_id = ${doctorInvitationsTable.id} ORDER BY created_at DESC LIMIT 1)`;
  const lastMsgSenderId = sql<string | null>`(SELECT sender_id FROM doctor_patient_messages WHERE invitation_id = ${doctorInvitationsTable.id} ORDER BY created_at DESC LIMIT 1)`;

  if (user.isDoctor) {
    const rows = await db
      .select({
        id: doctorInvitationsTable.id,
        status: doctorInvitationsTable.status,
        patientMessage: doctorInvitationsTable.patientMessage,
        createdAt: doctorInvitationsTable.createdAt,
        patientId: doctorInvitationsTable.patientId,
        patientFirstName: usersTable.firstName,
        patientLastName: usersTable.lastName,
        patientEmail: usersTable.email,
        patientImageUrl: usersTable.profileImageUrl,
        lastMessageContent: lastMsgContent,
        lastMessageAt: lastMsgAt,
        lastMessageSenderId: lastMsgSenderId,
      })
      .from(doctorInvitationsTable)
      .innerJoin(usersTable, eq(usersTable.id, doctorInvitationsTable.patientId))
      .where(eq(doctorInvitationsTable.doctorId, user.id))
      .orderBy(desc(doctorInvitationsTable.createdAt));
    res.json({ invitations: rows });
  } else {
    const rows = await db
      .select({
        id: doctorInvitationsTable.id,
        status: doctorInvitationsTable.status,
        patientMessage: doctorInvitationsTable.patientMessage,
        createdAt: doctorInvitationsTable.createdAt,
        doctorId: doctorInvitationsTable.doctorId,
        doctorFirstName: usersTable.firstName,
        doctorLastName: usersTable.lastName,
        doctorEmail: usersTable.email,
        doctorImageUrl: usersTable.profileImageUrl,
        specialty: doctorProfilesTable.specialty,
        hospital: doctorProfilesTable.hospital,
        lastMessageContent: lastMsgContent,
        lastMessageAt: lastMsgAt,
        lastMessageSenderId: lastMsgSenderId,
      })
      .from(doctorInvitationsTable)
      .innerJoin(usersTable, eq(usersTable.id, doctorInvitationsTable.doctorId))
      .leftJoin(doctorProfilesTable, eq(doctorProfilesTable.userId, doctorInvitationsTable.doctorId))
      .where(eq(doctorInvitationsTable.patientId, user.id))
      .orderBy(desc(doctorInvitationsTable.createdAt));
    res.json({ invitations: rows });
  }
});

router.post("/doctor-invitations", async (req: Request, res: Response): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (user.isDoctor) { res.status(403).json({ error: "Doktorlar davet gönderemez." }); return; }

  const { doctorId, patientMessage } = req.body as { doctorId?: string; patientMessage?: string };
  if (!doctorId) { res.status(400).json({ error: "Doktor ID gereklidir." }); return; }

  // Check not already invited
  const existing = await db.select().from(doctorInvitationsTable)
    .where(and(eq(doctorInvitationsTable.patientId, user.id), eq(doctorInvitationsTable.doctorId, doctorId)))
    .limit(1);
  if (existing.length > 0) { res.status(409).json({ error: "Bu doktoru zaten davet ettiniz." }); return; }

  const [inv] = await db.insert(doctorInvitationsTable).values({
    patientId: user.id,
    doctorId,
    patientMessage: patientMessage ?? null,
    status: "pending",
  }).returning();

  res.status(201).json({ invitation: inv });
});

router.delete("/doctor-invitations/:id", async (req: Request, res: Response): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (user.isDoctor) { res.status(403).json({ error: "Doktorlar davet silemez." }); return; }

  const { id } = req.params;
  const [inv] = await db.select().from(doctorInvitationsTable).where(eq(doctorInvitationsTable.id, id)).limit(1);
  if (!inv) { res.status(404).json({ error: "Davet bulunamadı." }); return; }
  if (inv.patientId !== user.id) { res.status(403).json({ error: "Bu davete erişim yetkiniz yok." }); return; }
  if (inv.status !== "pending") { res.status(400).json({ error: "Yalnızca bekleyen davetler geri alınabilir." }); return; }

  await db.delete(doctorInvitationsTable).where(eq(doctorInvitationsTable.id, id));
  res.json({ ok: true });
});

router.patch("/doctor-invitations/:id", async (req: Request, res: Response): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!user.isDoctor) { res.status(403).json({ error: "Yalnızca doktorlar yanıt verebilir." }); return; }

  const { id } = req.params;
  const { status } = req.body as { status?: "accepted" | "rejected" };
  if (!status || !["accepted", "rejected"].includes(status)) {
    res.status(400).json({ error: "Geçerli bir durum belirtin: accepted veya rejected." });
    return;
  }

  const [inv] = await db.select().from(doctorInvitationsTable).where(eq(doctorInvitationsTable.id, id)).limit(1);
  if (!inv) { res.status(404).json({ error: "Davet bulunamadı." }); return; }
  if (inv.doctorId !== user.id) { res.status(403).json({ error: "Bu davete erişim yetkiniz yok." }); return; }

  await db.update(doctorInvitationsTable).set({ status }).where(eq(doctorInvitationsTable.id, id));
  res.json({ ok: true, status });
});

// ─── Messages ─────────────────────────────────────────────────────────────────

router.get("/doctor-messages/:invitationId", async (req: Request, res: Response): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { invitationId } = req.params;
  const [inv] = await db.select().from(doctorInvitationsTable).where(eq(doctorInvitationsTable.id, invitationId)).limit(1);
  if (!inv) { res.status(404).json({ error: "Konuşma bulunamadı." }); return; }
  if (inv.patientId !== user.id && inv.doctorId !== user.id) {
    res.status(403).json({ error: "Bu konuşmaya erişim yetkiniz yok." }); return;
  }
  if (inv.status !== "accepted") { res.status(400).json({ error: "Davet henüz kabul edilmedi." }); return; }

  const messages = await db
    .select()
    .from(doctorPatientMessagesTable)
    .where(eq(doctorPatientMessagesTable.invitationId, invitationId))
    .orderBy(asc(doctorPatientMessagesTable.createdAt));

  res.json({ messages });
});

router.post("/doctor-messages/:invitationId", async (req: Request, res: Response): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { invitationId } = req.params;
  const { content } = req.body as { content?: string };
  if (!content?.trim()) { res.status(400).json({ error: "Mesaj içeriği boş olamaz." }); return; }

  const [inv] = await db.select().from(doctorInvitationsTable).where(eq(doctorInvitationsTable.id, invitationId)).limit(1);
  if (!inv) { res.status(404).json({ error: "Konuşma bulunamadı." }); return; }
  if (inv.patientId !== user.id && inv.doctorId !== user.id) {
    res.status(403).json({ error: "Bu konuşmaya erişim yetkiniz yok." }); return;
  }
  if (inv.status !== "accepted") { res.status(400).json({ error: "Davet henüz kabul edilmedi." }); return; }

  const [msg] = await db.insert(doctorPatientMessagesTable).values({
    invitationId,
    senderId: user.id,
    content: content.trim(),
  }).returning();

  res.status(201).json({ message: msg });
});

export default router;
