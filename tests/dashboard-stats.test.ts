import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", async () => (await import("./helpers/db")).createTestDb());

import { db, schema } from "@/db";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { resetDb } from "./helpers/db";
import { makeAppointment, makeAvailability, makeClient, makeEntrepreneur } from "./helpers/factories";

const d = (iso: string) => new Date(iso);
const HOUR = 3600_000;

beforeEach(() => resetDb(db));

async function appt(
  entrepreneurId: string,
  clientId: string,
  startIso: string,
  extra: { status?: string; source?: string | null; createdAt?: Date } = {}
) {
  const startAt = d(startIso);
  return makeAppointment(db, {
    entrepreneurId,
    clientId,
    startAt,
    endAt: new Date(startAt.getTime() + HOUR),
    // createdAt explicite : sinon now() de la base (horloge réelle) fausserait les 7 jours.
    createdAt: extra.createdAt ?? d("2026-01-01T00:00:00Z"),
    status: extra.status,
    source: extra.source,
  });
}

describe("getDashboardStats", () => {
  it("compte vide pour un nouvel entrepreneur", async () => {
    const pro = await makeEntrepreneur(db);
    const stats = await getDashboardStats(pro, d("2026-11-02T10:00:00Z"));
    expect(stats).toEqual({
      todayCount: 0,
      next: null,
      leadsToContact: 0,
      bookings7d: 0,
      bookings7dByAssistant: 0,
      hasAvailability: false,
      hasKnowledge: false,
    });
  });

  it("RDV du jour : compte la journée locale entière (passés inclus), sans les annulés", async () => {
    const pro = await makeEntrepreneur(db, { timezone: "Africa/Conakry" });
    const c = await makeClient(db, pro.id);
    const now = d("2026-11-02T12:00:00Z");
    await appt(pro.id, c.id, "2026-11-02T00:00:00Z"); // minuit pile : inclus
    await appt(pro.id, c.id, "2026-11-02T08:00:00Z"); // ce matin, déjà passé : inclus
    await appt(pro.id, c.id, "2026-11-02T16:00:00Z", { status: "PENDING" });
    await appt(pro.id, c.id, "2026-11-02T17:00:00Z", { status: "CANCELLED" }); // exclu
    await appt(pro.id, c.id, "2026-11-02T18:00:00Z", { status: "COMPLETED" });
    await appt(pro.id, c.id, "2026-11-03T00:00:00Z"); // demain minuit : exclu
    await appt(pro.id, c.id, "2026-11-01T23:59:00Z"); // hier soir : exclu

    const stats = await getDashboardStats(pro, now);
    expect(stats.todayCount).toBe(4);
  });

  it("RDV du jour dans le fuseau de l'entrepreneur (Paris), pas en UTC", async () => {
    const pro = await makeEntrepreneur(db, { timezone: "Europe/Paris" });
    const c = await makeClient(db, pro.id);
    // Lundi 2 nov. à Paris (UTC+1) = de dimanche 23:00 UTC à lundi 23:00 UTC.
    await appt(pro.id, c.id, "2026-11-01T23:30:00Z"); // lundi 0:30 à Paris : inclus
    await appt(pro.id, c.id, "2026-11-02T22:30:00Z"); // lundi 23:30 à Paris : inclus
    await appt(pro.id, c.id, "2026-11-02T23:30:00Z"); // mardi 0:30 à Paris : exclu

    const stats = await getDashboardStats(pro, d("2026-11-02T10:00:00Z"));
    expect(stats.todayCount).toBe(2);
  });

  it("le « jour » suit l'heure locale même quand UTC est encore la veille (Kinshasa, 23:30 UTC)", async () => {
    const pro = await makeEntrepreneur(db, { timezone: "Africa/Kinshasa" });
    const c = await makeClient(db, pro.id);
    // Il est 0:30 le mardi 3 à Kinshasa.
    const now = d("2026-11-02T23:30:00Z");
    await appt(pro.id, c.id, "2026-11-02T20:00:00Z"); // lundi soir : plus « aujourd'hui »
    await appt(pro.id, c.id, "2026-11-03T08:00:00Z"); // mardi 9 h : aujourd'hui

    const stats = await getDashboardStats(pro, now);
    expect(stats.todayCount).toBe(1);
    expect(stats.next?.isToday).toBe(true);
  });

  it("prochain RDV : le plus proche dans le futur, hors annulés, avec le nom du client", async () => {
    const pro = await makeEntrepreneur(db);
    const awa = await makeClient(db, pro.id, { fullName: "Awa Diallo", phone: "+224600000001" });
    const ibrahima = await makeClient(db, pro.id, { fullName: "Ibrahima Barry", phone: "+224600000002" });
    const now = d("2026-11-02T12:00:00Z");
    await appt(pro.id, awa.id, "2026-11-02T09:00:00Z"); // passé
    await appt(pro.id, awa.id, "2026-11-02T13:00:00Z", { status: "CANCELLED" });
    await appt(pro.id, ibrahima.id, "2026-11-02T15:00:00Z");
    await appt(pro.id, awa.id, "2026-11-04T09:00:00Z");

    const stats = await getDashboardStats(pro, now);
    expect(stats.next).toEqual({ startAt: d("2026-11-02T15:00:00Z"), clientName: "Ibrahima Barry", isToday: true });
  });

  it("prochain RDV un autre jour : isToday = false", async () => {
    const pro = await makeEntrepreneur(db);
    const c = await makeClient(db, pro.id);
    await appt(pro.id, c.id, "2026-11-03T09:00:00Z");

    const stats = await getDashboardStats(pro, d("2026-11-02T12:00:00Z"));
    expect(stats.next?.startAt).toEqual(d("2026-11-03T09:00:00Z"));
    expect(stats.next?.isToday).toBe(false);
  });

  it("prochain RDV : un RDV déjà commencé n'est plus « à venir »", async () => {
    const pro = await makeEntrepreneur(db);
    const c = await makeClient(db, pro.id);
    await appt(pro.id, c.id, "2026-11-02T11:30:00Z"); // en cours

    const stats = await getDashboardStats(pro, d("2026-11-02T12:00:00Z"));
    expect(stats.next).toBeNull();
  });

  it("prospects : seuls les NEW sont « à recontacter »", async () => {
    const pro = await makeEntrepreneur(db);
    await db.insert(schema.leads).values([
      { entrepreneurId: pro.id, name: "A", contact: "a@x.test", status: "NEW" },
      { entrepreneurId: pro.id, name: "B", contact: "b@x.test", status: "NEW" },
      { entrepreneurId: pro.id, name: "C", contact: "c@x.test", status: "CONTACTED" },
      { entrepreneurId: pro.id, name: "D", contact: "d@x.test", status: "CONVERTED" },
      { entrepreneurId: pro.id, name: "E", contact: "e@x.test", status: "LOST" },
    ]);

    const stats = await getDashboardStats(pro, d("2026-11-02T12:00:00Z"));
    expect(stats.leadsToContact).toBe(2);
  });

  it("réservations des 7 derniers jours (date de création) et part de l'assistant", async () => {
    const pro = await makeEntrepreneur(db);
    const c = await makeClient(db, pro.id);
    const now = d("2026-11-10T12:00:00Z");
    const created = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * HOUR);
    await appt(pro.id, c.id, "2026-11-20T09:00:00Z", { createdAt: created(0), source: "assistant" });
    await appt(pro.id, c.id, "2026-11-20T10:00:00Z", { createdAt: created(1), source: "form" });
    await appt(pro.id, c.id, "2026-11-20T11:00:00Z", { createdAt: created(6.9), source: "assistant" });
    await appt(pro.id, c.id, "2026-11-20T12:00:00Z", { createdAt: created(7), source: "manual" }); // limite : incluse
    await appt(pro.id, c.id, "2026-11-20T13:00:00Z", { createdAt: created(7.01), source: "assistant" }); // trop vieux
    await appt(pro.id, c.id, "2026-11-20T14:00:00Z", { createdAt: created(2), source: null }); // RDV ancien format

    const stats = await getDashboardStats(pro, now);
    expect(stats.bookings7d).toBe(5);
    expect(stats.bookings7dByAssistant).toBe(2);
  });

  it("réservations 7 jours : un RDV reçu puis annulé compte quand même comme réservation reçue", async () => {
    // Comportement actuel documenté : « reçues » = créées, quel que soit le statut.
    const pro = await makeEntrepreneur(db);
    const c = await makeClient(db, pro.id);
    const now = d("2026-11-10T12:00:00Z");
    await appt(pro.id, c.id, "2026-11-20T09:00:00Z", { createdAt: now, status: "CANCELLED", source: "assistant" });

    const stats = await getDashboardStats(pro, now);
    expect(stats.bookings7d).toBe(1);
    expect(stats.bookings7dByAssistant).toBe(1);
  });

  it("mise en route : disponibilités et bibliothèque de l'assistant", async () => {
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, 1, "09:00", "12:00");
    let stats = await getDashboardStats(pro, d("2026-11-02T12:00:00Z"));
    expect(stats.hasAvailability).toBe(true);
    expect(stats.hasKnowledge).toBe(false);

    await db.insert(schema.knowledgeBaseEntries).values({ entrepreneurId: pro.id, question: "Tarifs ?", answer: "50 000 GNF" });
    stats = await getDashboardStats(pro, d("2026-11-02T12:00:00Z"));
    expect(stats.hasKnowledge).toBe(true);
  });

  it("ignore entièrement les données d'un autre entrepreneur", async () => {
    const pro = await makeEntrepreneur(db);
    const other = await makeEntrepreneur(db);
    const c = await makeClient(db, other.id);
    const now = d("2026-11-02T12:00:00Z");
    await appt(other.id, c.id, "2026-11-02T15:00:00Z", { createdAt: now, source: "assistant" });
    await db.insert(schema.leads).values({ entrepreneurId: other.id, name: "X", contact: "x@x.test" });
    await makeAvailability(db, other.id, 1, "09:00", "12:00");
    await db.insert(schema.knowledgeBaseEntries).values({ entrepreneurId: other.id, question: "Q", answer: "R" });

    const stats = await getDashboardStats(pro, now);
    expect(stats).toEqual({
      todayCount: 0,
      next: null,
      leadsToContact: 0,
      bookings7d: 0,
      bookings7dByAssistant: 0,
      hasAvailability: false,
      hasKnowledge: false,
    });
    // Et l'autre compte voit bien ses propres données.
    const otherStats = await getDashboardStats(other, now);
    expect(otherStats.todayCount).toBe(1);
    expect(otherStats.leadsToContact).toBe(1);
  });
});
