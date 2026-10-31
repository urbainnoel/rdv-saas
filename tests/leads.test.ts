import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", async () => (await import("./helpers/db")).createTestDb());

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { markLeadConverted, normalizeContact, saveLead } from "@/lib/leads";
import { resetDb } from "./helpers/db";
import { makeEntrepreneur } from "./helpers/factories";

beforeEach(() => resetDb(db));

const leadsOf = (entrepreneurId: string) =>
  db.select().from(schema.leads).where(eq(schema.leads.entrepreneurId, entrepreneurId));

describe("normalizeContact", () => {
  it("email : espaces retirés, minuscules", () => {
    expect(normalizeContact("  Awa.Diallo@Gmail.COM ")).toBe("awa.diallo@gmail.com");
  });

  it("téléphone : espaces, points, tirets et parenthèses retirés, + conservé", () => {
    expect(normalizeContact("+224 620 00 00 00")).toBe("+224620000000");
    expect(normalizeContact("(514) 555-1234")).toBe("5145551234");
    expect(normalizeContact("06.12.34.56.78")).toBe("0612345678");
    expect(normalizeContact(" +33 6-12-34-56-78 ")).toBe("+33612345678");
  });

  it("deux écritures du même numéro donnent la même clé", () => {
    expect(normalizeContact("+224 620-00-00-00")).toBe(normalizeContact("+224620000000"));
  });

  it("une valeur vide reste vide", () => {
    expect(normalizeContact("   ")).toBe("");
  });
});

describe("saveLead", () => {
  it("enregistre un nouveau prospect normalisé et renvoie true", async () => {
    const pro = await makeEntrepreneur(db);
    const isNew = await saveLead({ entrepreneurId: pro.id, name: "Awa", contact: " Awa@Mail.com ", context: "Tarifs ?" });

    expect(isNew).toBe(true);
    const rows = await leadsOf(pro.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Awa", contact: "awa@mail.com", context: "Tarifs ?", status: "NEW" });
  });

  it("pas de doublon : le même contact (écrit autrement) renvoie false et ne crée rien", async () => {
    const pro = await makeEntrepreneur(db);
    expect(await saveLead({ entrepreneurId: pro.id, name: "Awa", contact: "+224 620 00 00 00", context: null })).toBe(true);
    expect(await saveLead({ entrepreneurId: pro.id, name: "Awa D.", contact: "+224620000000", context: "Encore" })).toBe(false);
    expect(await saveLead({ entrepreneurId: pro.id, name: "Awa", contact: "+224-620-00-00-00", context: null })).toBe(false);

    const rows = await leadsOf(pro.id);
    expect(rows).toHaveLength(1);
    // La première fiche n'est pas écrasée.
    expect(rows[0].name).toBe("Awa");
    expect(rows[0].context).toBeNull();
  });

  it("le même contact chez deux entrepreneurs différents : deux prospects distincts", async () => {
    const a = await makeEntrepreneur(db);
    const b = await makeEntrepreneur(db);
    expect(await saveLead({ entrepreneurId: a.id, name: "Awa", contact: "awa@mail.com", context: null })).toBe(true);
    expect(await saveLead({ entrepreneurId: b.id, name: "Awa", contact: "awa@mail.com", context: null })).toBe(true);
    expect(await leadsOf(a.id)).toHaveLength(1);
    expect(await leadsOf(b.id)).toHaveLength(1);
  });

  it("tronque le nom (80) et le contexte (1000)", async () => {
    const pro = await makeEntrepreneur(db);
    await saveLead({ entrepreneurId: pro.id, name: "N".repeat(200), contact: "x@y.z", context: "C".repeat(5000) });
    const [row] = await leadsOf(pro.id);
    expect(row.name).toHaveLength(80);
    expect(row.context).toHaveLength(1000);
  });
});

describe("markLeadConverted", () => {
  it("passe en CONVERTED les prospects dont l'email ou le téléphone correspond", async () => {
    const pro = await makeEntrepreneur(db);
    await saveLead({ entrepreneurId: pro.id, name: "Par email", contact: "awa@mail.com", context: null });
    await saveLead({ entrepreneurId: pro.id, name: "Par tel", contact: "+224620000000", context: null });
    await saveLead({ entrepreneurId: pro.id, name: "Autre", contact: "autre@mail.com", context: null });

    await markLeadConverted(pro.id, ["AWA@mail.com ", "+224 620 00 00 00"]);

    const rows = await leadsOf(pro.id);
    const status = Object.fromEntries(rows.map((r) => [r.name, r.status]));
    expect(status).toEqual({ "Par email": "CONVERTED", "Par tel": "CONVERTED", Autre: "NEW" });
  });

  it("ignore les contacts vides ou absents sans erreur", async () => {
    const pro = await makeEntrepreneur(db);
    await saveLead({ entrepreneurId: pro.id, name: "Awa", contact: "awa@mail.com", context: null });

    await expect(markLeadConverted(pro.id, [null, undefined, ""])).resolves.toBeUndefined();
    await expect(markLeadConverted(pro.id, [])).resolves.toBeUndefined();
    const [row] = await leadsOf(pro.id);
    expect(row.status).toBe("NEW");
  });

  it("ne touche jamais les prospects d'un autre entrepreneur", async () => {
    const pro = await makeEntrepreneur(db);
    const other = await makeEntrepreneur(db);
    await saveLead({ entrepreneurId: other.id, name: "Awa", contact: "awa@mail.com", context: null });

    await markLeadConverted(pro.id, ["awa@mail.com"]);

    const [row] = await leadsOf(other.id);
    expect(row.status).toBe("NEW");
  });
});
