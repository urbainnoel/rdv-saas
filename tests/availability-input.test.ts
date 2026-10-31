import { describe, expect, it } from "vitest";
import { parseAvailabilityInput } from "@/lib/availability-input";

const base = { daysOfWeek: [1], startTime: "09:00", endTime: "17:00", slotDurationMinutes: 60 };
const errorOf = (body: unknown) => {
  const r = parseAvailabilityInput(body);
  return r.ok ? null : r.error;
};
const valueOf = (body: unknown) => {
  const r = parseAvailabilityInput(body);
  if (!r.ok) throw new Error(`Erreur inattendue : ${r.error}`);
  return r.value;
};

const ERR = {
  days: "Choisis au moins un jour.",
  hours: "Horaires invalides.",
  order: "L'heure de fin doit être après l'heure de début.",
  duration: "Durée de séance invalide (entre 10 min et 8 h).",
  pause: "Horaires de pause invalides.",
  pauseOutside: "La pause doit être comprise dans la journée.",
  tooShort: "Ces horaires sont trop courts pour une seule séance de cette durée.",
};

describe("parseAvailabilityInput — cas nominaux", () => {
  it("une journée simple donne une seule plage", () => {
    expect(valueOf(base)).toEqual({ days: [1], duration: 60, ranges: [["09:00", "17:00"]] });
  });

  it("plusieurs jours, avec pause : deux plages autour de la pause", () => {
    expect(
      valueOf({ ...base, daysOfWeek: [1, 2, 3, 4, 5], pause: { start: "12:30", end: "14:00" } })
    ).toEqual({
      days: [1, 2, 3, 4, 5],
      duration: 60,
      ranges: [
        ["09:00", "12:30"],
        ["14:00", "17:00"],
      ],
    });
  });

  it("durée par défaut : 30 min si absente", () => {
    const { slotDurationMinutes: _omit, ...rest } = base;
    void _omit;
    expect(valueOf(rest).duration).toBe(30);
  });

  it("durée envoyée en texte (\"45\") acceptée", () => {
    expect(valueOf({ ...base, slotDurationMinutes: "45" }).duration).toBe(45);
  });

  it("ancien format { dayOfWeek } accepté", () => {
    const { daysOfWeek: _omit, ...rest } = base;
    void _omit;
    expect(valueOf({ ...rest, dayOfWeek: 0 }).days).toEqual([0]);
    expect(valueOf({ ...rest, dayOfWeek: 6 }).days).toEqual([6]);
  });

  it("daysOfWeek est prioritaire sur l'ancien dayOfWeek", () => {
    expect(valueOf({ ...base, daysOfWeek: [3], dayOfWeek: 5 }).days).toEqual([3]);
  });

  it("pause vide ({ start: \"\", end: \"\" } ou null) = pas de pause", () => {
    expect(valueOf({ ...base, pause: { start: "", end: "" } }).ranges).toEqual([["09:00", "17:00"]]);
    expect(valueOf({ ...base, pause: null }).ranges).toEqual([["09:00", "17:00"]]);
  });

  it("bornes extrêmes de la journée : 00:00–23:59", () => {
    expect(valueOf({ ...base, startTime: "00:00", endTime: "23:59" }).ranges).toEqual([["00:00", "23:59"]]);
  });
});

describe("parseAvailabilityInput — jours", () => {
  it("dédoublonne et ne garde que les entiers de 0 à 6", () => {
    expect(valueOf({ ...base, daysOfWeek: [1, 1, 3, 3, 3] }).days).toEqual([1, 3]);
    expect(valueOf({ ...base, daysOfWeek: [0, 6, 7, -1, 2.5, "3", null] }).days).toEqual([0, 6]);
  });

  it("refuse une liste vide, absente ou sans jour valide", () => {
    expect(errorOf({ ...base, daysOfWeek: [] })).toBe(ERR.days);
    expect(errorOf({ ...base, daysOfWeek: [7, 8, -1] })).toBe(ERR.days);
    expect(errorOf({ ...base, daysOfWeek: "1" })).toBe(ERR.days);
    expect(errorOf({ startTime: "09:00", endTime: "17:00" })).toBe(ERR.days);
    expect(errorOf({ startTime: "09:00", endTime: "17:00", dayOfWeek: "1" })).toBe(ERR.days);
  });

  it("refuse un corps absent ou qui n'est pas un objet", () => {
    expect(errorOf(null)).toBe(ERR.days);
    expect(errorOf(undefined)).toBe(ERR.days);
    expect(errorOf("lundi")).toBe(ERR.days);
    expect(errorOf(42)).toBe(ERR.days);
  });
});

describe("parseAvailabilityInput — horaires", () => {
  it("format HH:MM strict sur 24 h", () => {
    for (const bad of ["9:00", "09h00", "24:00", "23:60", "09:00:00", "", "midi", " 09:00"]) {
      expect(errorOf({ ...base, startTime: bad }), bad).toBe(ERR.hours);
      expect(errorOf({ ...base, endTime: bad }), bad).toBe(ERR.hours);
    }
  });

  it("horaires manquants", () => {
    expect(errorOf({ daysOfWeek: [1] })).toBe(ERR.hours);
  });

  it("la fin doit être strictement après le début", () => {
    expect(errorOf({ ...base, startTime: "17:00", endTime: "09:00" })).toBe(ERR.order);
    expect(errorOf({ ...base, startTime: "09:00", endTime: "09:00" })).toBe(ERR.order);
  });

  it("l'ordre des vérifications : jours, puis format, puis ordre, puis durée", () => {
    expect(errorOf({ daysOfWeek: [], startTime: "x", endTime: "y", slotDurationMinutes: 0 })).toBe(ERR.days);
    expect(errorOf({ ...base, startTime: "x", slotDurationMinutes: 0 })).toBe(ERR.hours);
    expect(errorOf({ ...base, startTime: "18:00", slotDurationMinutes: 0 })).toBe(ERR.order);
  });
});

describe("parseAvailabilityInput — durée de séance", () => {
  it("accepte de 10 à 480 min (bornes incluses)", () => {
    expect(valueOf({ ...base, slotDurationMinutes: 10 }).duration).toBe(10);
    expect(valueOf({ ...base, startTime: "08:00", endTime: "16:00", slotDurationMinutes: 480 }).duration).toBe(480);
  });

  it("refuse hors bornes, décimale ou non numérique", () => {
    for (const bad of [9, 481, 0, -30, 30.5, "abc", "", Number.NaN, Infinity]) {
      expect(errorOf({ ...base, slotDurationMinutes: bad }), String(bad)).toBe(ERR.duration);
    }
  });

  it("null est traité comme absent (30 min par défaut)", () => {
    expect(valueOf({ ...base, slotDurationMinutes: null }).duration).toBe(30);
  });
});

describe("parseAvailabilityInput — pause", () => {
  it("format invalide ou incomplet", () => {
    expect(errorOf({ ...base, pause: { start: "12:00" } })).toBe(ERR.pause);
    expect(errorOf({ ...base, pause: { end: "13:00" } })).toBe(ERR.pause);
    expect(errorOf({ ...base, pause: { start: "12h", end: "13:00" } })).toBe(ERR.pause);
  });

  it("fin de pause avant (ou égale à) son début", () => {
    expect(errorOf({ ...base, pause: { start: "13:00", end: "12:00" } })).toBe(ERR.pause);
    expect(errorOf({ ...base, pause: { start: "12:00", end: "12:00" } })).toBe(ERR.pause);
  });

  it("la pause doit être strictement à l'intérieur de la journée", () => {
    expect(errorOf({ ...base, pause: { start: "09:00", end: "10:00" } })).toBe(ERR.pauseOutside);
    expect(errorOf({ ...base, pause: { start: "16:00", end: "17:00" } })).toBe(ERR.pauseOutside);
    expect(errorOf({ ...base, pause: { start: "08:00", end: "10:00" } })).toBe(ERR.pauseOutside);
    expect(errorOf({ ...base, pause: { start: "16:00", end: "18:00" } })).toBe(ERR.pauseOutside);
    expect(errorOf({ ...base, pause: { start: "07:00", end: "08:00" } })).toBe(ERR.pauseOutside);
  });

  it("une pause d'une minute juste après l'ouverture est acceptée", () => {
    expect(valueOf({ ...base, pause: { start: "09:01", end: "09:02" } }).ranges).toEqual([["09:02", "17:00"]]);
  });
});

describe("parseAvailabilityInput — au moins une séance doit tenir", () => {
  it("journée plus courte que la séance : erreur", () => {
    expect(errorOf({ ...base, startTime: "09:00", endTime: "09:45", slotDurationMinutes: 60 })).toBe(ERR.tooShort);
  });

  it("journée exactement égale à la séance : acceptée", () => {
    expect(valueOf({ ...base, startTime: "09:00", endTime: "10:00", slotDurationMinutes: 60 }).ranges).toEqual([
      ["09:00", "10:00"],
    ]);
  });

  it("avec pause : une plage trop courte est retirée, l'autre reste", () => {
    expect(
      valueOf({ ...base, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 60, pause: { start: "09:30", end: "12:00" } })
        .ranges
    ).toEqual([["12:00", "17:00"]]);
    expect(
      valueOf({ ...base, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 60, pause: { start: "12:00", end: "16:30" } })
        .ranges
    ).toEqual([["09:00", "12:00"]]);
  });

  it("avec pause : les deux plages trop courtes → erreur", () => {
    expect(
      errorOf({ ...base, startTime: "09:00", endTime: "11:00", slotDurationMinutes: 60, pause: { start: "09:30", end: "10:30" } })
    ).toBe(ERR.tooShort);
  });
});
