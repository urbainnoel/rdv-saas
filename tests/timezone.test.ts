import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_TIMEZONE,
  addDaysToKey,
  dayOfWeekOfKey,
  formatDateFr,
  formatTimeFr,
  isValidTimeZone,
  localDateKey,
  safeTimeZone,
  zonedTimeToUtc,
} from "@/lib/timezone";

const iso = (d: Date) => d.toISOString();

describe("safeTimeZone / isValidTimeZone", () => {
  it("accepte les fuseaux IANA connus", () => {
    expect(isValidTimeZone("Africa/Conakry")).toBe(true);
    expect(isValidTimeZone("Europe/Paris")).toBe(true);
    expect(safeTimeZone("America/Montreal")).toBe("America/Montreal");
  });

  it("retombe sur Conakry pour une valeur vide ou invalide", () => {
    expect(DEFAULT_TIMEZONE).toBe("Africa/Conakry");
    expect(safeTimeZone(null)).toBe("Africa/Conakry");
    expect(safeTimeZone(undefined)).toBe("Africa/Conakry");
    expect(safeTimeZone("")).toBe("Africa/Conakry");
    expect(safeTimeZone("Mars/Olympus")).toBe("Africa/Conakry");
    expect(isValidTimeZone("pas un fuseau")).toBe(false);
  });
});

describe("zonedTimeToUtc", () => {
  it("Conakry (UTC+0 toute l'année) : l'heure locale est l'heure UTC", () => {
    expect(iso(zonedTimeToUtc("2026-01-15", "09:00", "Africa/Conakry"))).toBe("2026-01-15T09:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-07-15", "09:00", "Africa/Conakry"))).toBe("2026-07-15T09:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-12-31", "23:59", "Africa/Conakry"))).toBe("2026-12-31T23:59:00.000Z");
  });

  it("Paris en hiver (UTC+1) et en été (UTC+2)", () => {
    expect(iso(zonedTimeToUtc("2026-01-15", "09:00", "Europe/Paris"))).toBe("2026-01-15T08:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-07-15", "09:00", "Europe/Paris"))).toBe("2026-07-15T07:00:00.000Z");
  });

  it("Paris, minuit local tombe la veille en UTC", () => {
    expect(iso(zonedTimeToUtc("2026-07-15", "00:00", "Europe/Paris"))).toBe("2026-07-14T22:00:00.000Z");
  });

  it("Paris, passage à l'heure d'été (dimanche 29 mars 2026, 2 h → 3 h)", () => {
    // Avant le changement : encore UTC+1.
    expect(iso(zonedTimeToUtc("2026-03-29", "01:30", "Europe/Paris"))).toBe("2026-03-29T00:30:00.000Z");
    // Après le changement : UTC+2.
    expect(iso(zonedTimeToUtc("2026-03-29", "03:00", "Europe/Paris"))).toBe("2026-03-29T01:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-03-29", "09:00", "Europe/Paris"))).toBe("2026-03-29T07:00:00.000Z");
    // Minuit du jour du changement est encore en heure d'hiver.
    expect(iso(zonedTimeToUtc("2026-03-29", "00:00", "Europe/Paris"))).toBe("2026-03-28T23:00:00.000Z");
    // Le lendemain, minuit est en heure d'été : la journée du 29 ne dure que 23 h.
    const dayLength =
      zonedTimeToUtc("2026-03-30", "00:00", "Europe/Paris").getTime() -
      zonedTimeToUtc("2026-03-29", "00:00", "Europe/Paris").getTime();
    expect(dayLength).toBe(23 * 3600 * 1000);
  });

  it("Paris, heure inexistante (2:30 le 29 mars) : donne un instant cohérent, proche du saut", () => {
    const t = zonedTimeToUtc("2026-03-29", "02:30", "Europe/Paris");
    // 2:30 n'existe pas ; on accepte 00:30Z ou 01:30Z mais rien d'aberrant.
    expect(["2026-03-29T00:30:00.000Z", "2026-03-29T01:30:00.000Z"]).toContain(iso(t));
  });

  it("Paris, retour à l'heure d'hiver (dimanche 25 octobre 2026, 3 h → 2 h)", () => {
    expect(iso(zonedTimeToUtc("2026-10-25", "01:00", "Europe/Paris"))).toBe("2026-10-24T23:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-10-25", "09:00", "Europe/Paris"))).toBe("2026-10-25T08:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-10-24", "09:00", "Europe/Paris"))).toBe("2026-10-24T07:00:00.000Z");
    // La journée du 25 dure 25 h.
    const dayLength =
      zonedTimeToUtc("2026-10-26", "00:00", "Europe/Paris").getTime() -
      zonedTimeToUtc("2026-10-25", "00:00", "Europe/Paris").getTime();
    expect(dayLength).toBe(25 * 3600 * 1000);
  });

  it("Paris, heure ambiguë (2:30 le 25 octobre existe deux fois) : l'une des deux", () => {
    const t = iso(zonedTimeToUtc("2026-10-25", "02:30", "Europe/Paris"));
    expect(["2026-10-25T00:30:00.000Z", "2026-10-25T01:30:00.000Z"]).toContain(t);
  });

  it("Montréal en hiver (UTC−5) et en été (UTC−4)", () => {
    expect(iso(zonedTimeToUtc("2026-01-15", "09:00", "America/Montreal"))).toBe("2026-01-15T14:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-07-15", "09:00", "America/Montreal"))).toBe("2026-07-15T13:00:00.000Z");
    // 22 h locale = le lendemain en UTC.
    expect(iso(zonedTimeToUtc("2026-07-15", "22:00", "America/Montreal"))).toBe("2026-07-16T02:00:00.000Z");
  });

  it("Montréal, changements d'heure 2026 (8 mars et 1er novembre)", () => {
    expect(iso(zonedTimeToUtc("2026-03-07", "09:00", "America/Montreal"))).toBe("2026-03-07T14:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-03-08", "09:00", "America/Montreal"))).toBe("2026-03-08T13:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-10-31", "09:00", "America/Montreal"))).toBe("2026-10-31T13:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-11-01", "09:00", "America/Montreal"))).toBe("2026-11-01T14:00:00.000Z");
  });

  it("Kinshasa (UTC+1, sans heure d'été)", () => {
    expect(iso(zonedTimeToUtc("2026-01-15", "09:00", "Africa/Kinshasa"))).toBe("2026-01-15T08:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-07-15", "09:00", "Africa/Kinshasa"))).toBe("2026-07-15T08:00:00.000Z");
    expect(iso(zonedTimeToUtc("2026-07-15", "00:30", "Africa/Kinshasa"))).toBe("2026-07-14T23:30:00.000Z");
  });

  describe("ne dépend pas du fuseau du serveur", () => {
    const original = process.env.TZ;
    afterEach(() => {
      process.env.TZ = original;
    });

    for (const serverTz of ["UTC", "Asia/Tokyo", "America/Los_Angeles", "Europe/Paris"]) {
      it(`serveur en ${serverTz}`, () => {
        process.env.TZ = serverTz;
        expect(iso(zonedTimeToUtc("2026-03-29", "09:00", "Europe/Paris"))).toBe("2026-03-29T07:00:00.000Z");
        expect(iso(zonedTimeToUtc("2026-10-25", "09:00", "Europe/Paris"))).toBe("2026-10-25T08:00:00.000Z");
        expect(iso(zonedTimeToUtc("2026-07-15", "09:00", "Africa/Conakry"))).toBe("2026-07-15T09:00:00.000Z");
        expect(localDateKey(new Date("2026-07-15T23:30:00Z"), "Africa/Kinshasa")).toBe("2026-07-16");
      });
    }
  });
});

describe("localDateKey", () => {
  it("renvoie la date locale au format AAAA-MM-JJ", () => {
    expect(localDateKey(new Date("2026-05-04T12:00:00Z"), "Africa/Conakry")).toBe("2026-05-04");
  });

  it("change de jour selon le fuseau autour de minuit UTC", () => {
    const t = new Date("2026-07-15T23:30:00Z");
    expect(localDateKey(t, "Africa/Conakry")).toBe("2026-07-15");
    expect(localDateKey(t, "Europe/Paris")).toBe("2026-07-16");
    expect(localDateKey(t, "Africa/Kinshasa")).toBe("2026-07-16");
    const early = new Date("2026-07-16T02:00:00Z");
    expect(localDateKey(early, "America/Montreal")).toBe("2026-07-15");
  });

  it("est l'inverse de zonedTimeToUtc pour minuit local", () => {
    for (const tz of ["Africa/Conakry", "Europe/Paris", "America/Montreal", "Africa/Kinshasa"]) {
      for (const key of ["2026-01-01", "2026-03-29", "2026-10-25", "2026-12-31"]) {
        expect(localDateKey(zonedTimeToUtc(key, "00:00", tz), tz)).toBe(key);
      }
    }
  });
});

describe("addDaysToKey", () => {
  it("ajoute et retire des jours", () => {
    expect(addDaysToKey("2026-05-04", 1)).toBe("2026-05-05");
    expect(addDaysToKey("2026-05-04", 0)).toBe("2026-05-04");
    expect(addDaysToKey("2026-05-04", -4)).toBe("2026-04-30");
  });

  it("gère les fins de mois et d'année", () => {
    expect(addDaysToKey("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysToKey("2026-02-28", 1)).toBe("2026-03-01"); // 2026 n'est pas bissextile
    expect(addDaysToKey("2028-02-28", 1)).toBe("2028-02-29"); // 2028 l'est
    expect(addDaysToKey("2026-04-30", 1)).toBe("2026-05-01");
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDaysToKey("2026-12-25", 14)).toBe("2027-01-08");
  });

  it("n'est pas perturbé par les changements d'heure", () => {
    expect(addDaysToKey("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDaysToKey("2026-03-29", 1)).toBe("2026-03-30");
    expect(addDaysToKey("2026-10-25", 1)).toBe("2026-10-26");
  });
});

describe("dayOfWeekOfKey", () => {
  it("0 = dimanche … 6 = samedi", () => {
    expect(dayOfWeekOfKey("2026-11-01")).toBe(0); // dimanche
    expect(dayOfWeekOfKey("2026-11-02")).toBe(1); // lundi
    expect(dayOfWeekOfKey("2026-10-31")).toBe(6); // samedi
    expect(dayOfWeekOfKey("2026-03-29")).toBe(0);
    expect(dayOfWeekOfKey("2027-01-01")).toBe(5); // vendredi
  });
});

describe("formatage français", () => {
  it("formatDateFr : jour de semaine et mois en toutes lettres, dans le fuseau", () => {
    expect(formatDateFr(new Date("2026-11-02T10:00:00Z"), "Africa/Conakry")).toBe("lundi 2 novembre");
    // 23:30 UTC le 15 juillet = déjà le jeudi 16 à Paris.
    expect(formatDateFr(new Date("2026-07-15T23:30:00Z"), "Europe/Paris")).toBe("jeudi 16 juillet");
    expect(formatDateFr(new Date("2026-07-15T23:30:00Z"), "Africa/Conakry")).toBe("mercredi 15 juillet");
  });

  it("formatTimeFr : HH:MM sur 24 h, dans le fuseau", () => {
    const t = new Date("2026-07-15T07:05:00Z");
    expect(formatTimeFr(t, "Africa/Conakry")).toBe("07:05");
    expect(formatTimeFr(t, "Europe/Paris")).toBe("09:05");
    expect(formatTimeFr(t, "America/Montreal")).toBe("03:05");
    expect(formatTimeFr(new Date("2026-01-15T14:30:00Z"), "Africa/Kinshasa")).toBe("15:30");
  });
});
