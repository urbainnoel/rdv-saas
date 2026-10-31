import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", async () => (await import("./helpers/db")).createTestDb());

import { db, schema } from "@/db";
import { getAvailableSlotsForRange, isFreeSlot, type Slot } from "@/lib/slots";
import { resetDb } from "./helpers/db";
import { makeAppointment, makeAvailability, makeClient, makeEntrepreneur } from "./helpers/factories";

// Semaine de référence : lundi 2 novembre 2026 (heure d'hiver à Paris et à Montréal).
const MONDAY = "2026-11-02";
const LUN = 1;

const times = (slots: Slot[] | undefined) => (slots ?? []).map((s) => s.startAt.toISOString().slice(11, 16));

function freezeAt(isoInstant: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(isoInstant));
}

beforeEach(async () => {
  await resetDb(db);
  // Par défaut : dimanche 1er novembre midi UTC, donc tout lundi est dans le futur.
  freezeAt("2026-11-01T12:00:00Z");
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getAvailableSlotsForRange — fuseaux", () => {
  it("Conakry : lundi 9 h–12 h, séances de 60 min → 3 créneaux en UTC+0", async () => {
    const pro = await makeEntrepreneur(db, { timezone: "Africa/Conakry" });
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);

    const byDay = await getAvailableSlotsForRange(pro, 7, MONDAY);

    expect(Object.keys(byDay)).toEqual([MONDAY]);
    expect(times(byDay[MONDAY])).toEqual(["09:00", "10:00", "11:00"]);
    expect(byDay[MONDAY][0].endAt.toISOString()).toBe("2026-11-02T10:00:00.000Z");
  });

  it("Paris (hiver, UTC+1) : 9 h locale = 8 h UTC", async () => {
    const pro = await makeEntrepreneur(db, { timezone: "Europe/Paris" });
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["08:00", "09:00", "10:00"]);
  });

  it("Paris, jour du passage à l'heure d'été (dimanche 29 mars 2026)", async () => {
    freezeAt("2026-03-27T12:00:00Z");
    const pro = await makeEntrepreneur(db, { timezone: "Europe/Paris" });
    await makeAvailability(db, pro.id, 0, "09:00", "11:00", 60);
    await makeAvailability(db, pro.id, 6, "09:00", "11:00", 60);

    const byDay = await getAvailableSlotsForRange(pro, 2, "2026-03-28");
    expect(times(byDay["2026-03-28"])).toEqual(["08:00", "09:00"]); // samedi, UTC+1
    expect(times(byDay["2026-03-29"])).toEqual(["07:00", "08:00"]); // dimanche, UTC+2
  });

  it("Paris, jour du retour à l'heure d'hiver (dimanche 25 octobre 2026)", async () => {
    freezeAt("2026-10-24T12:00:00Z");
    const pro = await makeEntrepreneur(db, { timezone: "Europe/Paris" });
    await makeAvailability(db, pro.id, 0, "09:00", "10:00", 60);

    const byDay = await getAvailableSlotsForRange(pro, 2, "2026-10-24");
    expect(times(byDay["2026-10-25"])).toEqual(["08:00"]);
  });

  it("Montréal (UTC−5) : les créneaux du soir tombent le lendemain en UTC mais restent sur le bon jour local", async () => {
    const pro = await makeEntrepreneur(db, { timezone: "America/Montreal" });
    await makeAvailability(db, pro.id, LUN, "18:00", "21:00", 60);

    const byDay = await getAvailableSlotsForRange(pro, 3, MONDAY);
    expect(Object.keys(byDay)).toEqual([MONDAY]);
    expect(byDay[MONDAY].map((s) => s.startAt.toISOString())).toEqual([
      "2026-11-02T23:00:00.000Z",
      "2026-11-03T00:00:00.000Z",
      "2026-11-03T01:00:00.000Z",
    ]);
  });

  it("Kinshasa (UTC+1) : créneaux de 30 min", async () => {
    const pro = await makeEntrepreneur(db, { timezone: "Africa/Kinshasa" });
    await makeAvailability(db, pro.id, LUN, "08:00", "09:30", 30);

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["07:00", "07:30", "08:00"]);
  });

  it("fuseau invalide en base : retombe sur Conakry", async () => {
    const pro = await makeEntrepreneur(db, { timezone: "Nulle/Part" });
    await makeAvailability(db, pro.id, LUN, "09:00", "10:00", 60);

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["09:00"]);
  });

  it("sans jour de départ : part d'aujourd'hui dans le fuseau de l'entrepreneur, pas du serveur", async () => {
    // Lundi 23:30 UTC = déjà mardi 0:30 à Paris.
    freezeAt("2026-11-02T23:30:00Z");
    const paris = await makeEntrepreneur(db, { timezone: "Europe/Paris" });
    await makeAvailability(db, paris.id, 2, "09:00", "10:00", 60); // mardi
    const conakry = await makeEntrepreneur(db, { timezone: "Africa/Conakry" });
    await makeAvailability(db, conakry.id, 2, "09:00", "10:00", 60);

    expect(Object.keys(await getAvailableSlotsForRange(paris, 1))).toEqual(["2026-11-03"]);
    // À Conakry on est encore lundi : le mardi n'est pas dans une fenêtre d'un jour.
    expect(await getAvailableSlotsForRange(conakry, 1)).toEqual({});
    expect(Object.keys(await getAvailableSlotsForRange(conakry, 2))).toEqual(["2026-11-03"]);
  });
});

describe("getAvailableSlotsForRange — règles", () => {
  it("une plage qui ne tombe pas juste : la dernière séance incomplète n'est pas proposée", async () => {
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "10:30", 60);

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["09:00"]);
  });

  it("deux plages le même jour (pause) : créneaux fusionnés et triés", async () => {
    const pro = await makeEntrepreneur(db);
    // Insérées dans le désordre exprès.
    await makeAvailability(db, pro.id, LUN, "14:00", "16:00", 60);
    await makeAvailability(db, pro.id, LUN, "09:00", "11:00", 60);

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["09:00", "10:00", "14:00", "15:00"]);
  });

  it("les jours sans disponibilité sont absents du résultat", async () => {
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "10:00", 60);
    await makeAvailability(db, pro.id, 3, "09:00", "10:00", 60); // mercredi

    const byDay = await getAvailableSlotsForRange(pro, 14, MONDAY);
    expect(Object.keys(byDay)).toEqual(["2026-11-02", "2026-11-04", "2026-11-09", "2026-11-11"]);
  });

  it("ignore les disponibilités d'un autre entrepreneur", async () => {
    const pro = await makeEntrepreneur(db);
    const other = await makeEntrepreneur(db);
    await makeAvailability(db, other.id, LUN, "09:00", "12:00", 60);

    expect(await getAvailableSlotsForRange(pro, 7, MONDAY)).toEqual({});
  });

  it("fin de mois / fin d'année : la plage de jours enjambe le 31 décembre", async () => {
    freezeAt("2026-12-30T00:00:00Z");
    const pro = await makeEntrepreneur(db);
    for (let d = 0; d <= 6; d++) await makeAvailability(db, pro.id, d, "09:00", "10:00", 60);

    const byDay = await getAvailableSlotsForRange(pro, 4, "2026-12-30");
    expect(Object.keys(byDay)).toEqual(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
  });
});

describe("getAvailableSlotsForRange — créneaux bloqués", () => {
  it("un blocage retire les créneaux qu'il chevauche, même partiellement", async () => {
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "13:00", 60);
    await db.insert(schema.blockedSlots).values({
      entrepreneurId: pro.id,
      startAt: new Date("2026-11-02T10:30:00Z"),
      endAt: new Date("2026-11-02T11:15:00Z"),
      reason: "Imprévu",
    });

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["09:00", "12:00"]);
  });

  it("un blocage qui touche seulement le bord d'un créneau ne le retire pas", async () => {
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "11:00", 60);
    await db.insert(schema.blockedSlots).values({
      entrepreneurId: pro.id,
      startAt: new Date("2026-11-02T10:00:00Z"),
      endAt: new Date("2026-11-02T10:00:00Z"),
    });
    await db.insert(schema.blockedSlots).values({
      entrepreneurId: pro.id,
      startAt: new Date("2026-11-02T11:00:00Z"),
      endAt: new Date("2026-11-02T12:00:00Z"),
    });

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["09:00", "10:00"]);
  });

  it("congés sur plusieurs jours : aucun créneau pendant, créneaux avant et après", async () => {
    const pro = await makeEntrepreneur(db);
    for (let d = 0; d <= 6; d++) await makeAvailability(db, pro.id, d, "09:00", "10:00", 60);
    await db.insert(schema.blockedSlots).values({
      entrepreneurId: pro.id,
      startAt: new Date("2026-11-03T00:00:00Z"),
      endAt: new Date("2026-11-05T00:00:00Z"),
      reason: "Congés",
    });

    const byDay = await getAvailableSlotsForRange(pro, 4, MONDAY);
    expect(Object.keys(byDay)).toEqual(["2026-11-02", "2026-11-05"]);
  });

  it("le blocage d'un autre entrepreneur n'a aucun effet", async () => {
    const pro = await makeEntrepreneur(db);
    const other = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "10:00", 60);
    await db.insert(schema.blockedSlots).values({
      entrepreneurId: other.id,
      startAt: new Date("2026-11-02T00:00:00Z"),
      endAt: new Date("2026-11-03T00:00:00Z"),
    });

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["09:00"]);
  });
});

describe("getAvailableSlotsForRange — rendez-vous existants", () => {
  it("un RDV confirmé ou en attente occupe le créneau ; un RDV annulé le libère", async () => {
    const pro = await makeEntrepreneur(db);
    const client = await makeClient(db, pro.id);
    await makeAvailability(db, pro.id, LUN, "09:00", "13:00", 60);
    const at = (h: string) => new Date(`2026-11-02T${h}:00Z`);
    await makeAppointment(db, { entrepreneurId: pro.id, clientId: client.id, startAt: at("09:00"), endAt: at("10:00"), status: "CONFIRMED" });
    await makeAppointment(db, { entrepreneurId: pro.id, clientId: client.id, startAt: at("10:00"), endAt: at("11:00"), status: "PENDING" });
    await makeAppointment(db, { entrepreneurId: pro.id, clientId: client.id, startAt: at("11:00"), endAt: at("12:00"), status: "CANCELLED" });

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["11:00", "12:00"]);
  });

  it("un RDV de durée différente (30 min à cheval) bloque les créneaux qu'il touche", async () => {
    const pro = await makeEntrepreneur(db);
    const client = await makeClient(db, pro.id);
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);
    await makeAppointment(db, {
      entrepreneurId: pro.id,
      clientId: client.id,
      startAt: new Date("2026-11-02T09:45:00Z"),
      endAt: new Date("2026-11-02T10:15:00Z"),
    });

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["11:00"]);
  });

  it("les RDV d'un autre entrepreneur n'occupent rien", async () => {
    const pro = await makeEntrepreneur(db);
    const other = await makeEntrepreneur(db);
    const client = await makeClient(db, other.id);
    await makeAvailability(db, pro.id, LUN, "09:00", "10:00", 60);
    await makeAppointment(db, {
      entrepreneurId: other.id,
      clientId: client.id,
      startAt: new Date("2026-11-02T09:00:00Z"),
      endAt: new Date("2026-11-02T10:00:00Z"),
    });

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["09:00"]);
  });
});

describe("getAvailableSlotsForRange — créneaux passés", () => {
  it("les créneaux déjà commencés ne sont plus proposés", async () => {
    freezeAt("2026-11-02T10:30:00Z");
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["11:00"]);
  });

  it("un créneau qui commence exactement maintenant est encore proposé", async () => {
    freezeAt("2026-11-02T10:00:00Z");
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["10:00", "11:00"]);
  });

  it("journée entièrement passée : le jour disparaît du résultat", async () => {
    freezeAt("2026-11-02T18:00:00Z");
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);

    expect(await getAvailableSlotsForRange(pro, 1, MONDAY)).toEqual({});
  });

  it("le « passé » s'apprécie en temps absolu, quel que soit le fuseau", async () => {
    // 8:30 UTC = 9:30 à Paris (hiver) : le créneau de 9 h (8 h UTC) est passé.
    freezeAt("2026-11-02T08:30:00Z");
    const pro = await makeEntrepreneur(db, { timezone: "Europe/Paris" });
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);

    const byDay = await getAvailableSlotsForRange(pro, 1, MONDAY);
    expect(times(byDay[MONDAY])).toEqual(["09:00", "10:00"]); // 10 h et 11 h, heure de Paris
  });
});

describe("isFreeSlot", () => {
  const start = new Date("2026-11-02T10:00:00Z");
  const end = new Date("2026-11-02T11:00:00Z");

  it("vrai pour un créneau proposé et libre", async () => {
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);
    expect(await isFreeSlot(pro, start, end)).toBe(true);
  });

  it("faux si un RDV non annulé occupe le créneau, vrai s'il est annulé", async () => {
    const pro = await makeEntrepreneur(db);
    const client = await makeClient(db, pro.id);
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);
    const appt = await makeAppointment(db, { entrepreneurId: pro.id, clientId: client.id, startAt: start, endAt: end });
    expect(await isFreeSlot(pro, start, end)).toBe(false);

    const { eq } = await import("drizzle-orm");
    await db.update(schema.appointments).set({ status: "CANCELLED" }).where(eq(schema.appointments.id, appt.id));
    expect(await isFreeSlot(pro, start, end)).toBe(true);
  });

  it("faux si le créneau est bloqué", async () => {
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);
    await db.insert(schema.blockedSlots).values({ entrepreneurId: pro.id, startAt: start, endAt: end });
    expect(await isFreeSlot(pro, start, end)).toBe(false);
  });

  it("faux hors horaires : avant l'ouverture, après la fermeture, un jour sans disponibilité", async () => {
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);
    const slot = (iso: string, minutes = 60) => [new Date(iso), new Date(new Date(iso).getTime() + minutes * 60_000)] as const;

    expect(await isFreeSlot(pro, ...slot("2026-11-02T07:00:00Z"))).toBe(false);
    expect(await isFreeSlot(pro, ...slot("2026-11-02T12:00:00Z"))).toBe(false);
    expect(await isFreeSlot(pro, ...slot("2026-11-03T10:00:00Z"))).toBe(false); // mardi
    expect(await isFreeSlot(pro, ...slot("2026-11-02T03:00:00Z"))).toBe(false); // en pleine nuit
  });

  it("faux pour un créneau mal aligné ou d'une autre durée", async () => {
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);

    expect(await isFreeSlot(pro, new Date("2026-11-02T09:30:00Z"), new Date("2026-11-02T10:30:00Z"))).toBe(false);
    expect(await isFreeSlot(pro, new Date("2026-11-02T10:00:00Z"), new Date("2026-11-02T10:30:00Z"))).toBe(false);
    expect(await isFreeSlot(pro, new Date("2026-11-02T10:00:00Z"), new Date("2026-11-02T12:00:00Z"))).toBe(false);
  });

  it("faux pour un créneau passé", async () => {
    freezeAt("2026-11-02T10:30:00Z");
    const pro = await makeEntrepreneur(db);
    await makeAvailability(db, pro.id, LUN, "09:00", "12:00", 60);
    expect(await isFreeSlot(pro, start, end)).toBe(false);
  });

  it("utilise le fuseau de l'entrepreneur pour retrouver le bon jour (Montréal, soirée)", async () => {
    const pro = await makeEntrepreneur(db, { timezone: "America/Montreal" });
    await makeAvailability(db, pro.id, LUN, "18:00", "21:00", 60);
    // Lundi 20 h à Montréal = mardi 1 h UTC.
    expect(await isFreeSlot(pro, new Date("2026-11-03T01:00:00Z"), new Date("2026-11-03T02:00:00Z"))).toBe(true);
    // Lundi 20 h UTC n'est pas dans les horaires (15 h à Montréal).
    expect(await isFreeSlot(pro, new Date("2026-11-02T20:00:00Z"), new Date("2026-11-02T21:00:00Z"))).toBe(false);
  });

  it("faux si le créneau appartient aux horaires d'un autre entrepreneur", async () => {
    const pro = await makeEntrepreneur(db);
    const other = await makeEntrepreneur(db);
    await makeAvailability(db, other.id, LUN, "09:00", "12:00", 60);
    expect(await isFreeSlot(pro, start, end)).toBe(false);
  });
});
