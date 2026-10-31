import { describe, expect, it } from "vitest";
import { destinationFor, parseIntent } from "@/lib/intent";
import { brandCssVars, deriveBrandShades, isValidHexColor } from "@/lib/color";

describe("intent", () => {
  it("parseIntent accepte uniquement « chatbot » et « lien »", () => {
    expect(parseIntent("chatbot")).toBe("chatbot");
    expect(parseIntent("lien")).toBe("lien");
    for (const v of ["", "Chatbot", "LIEN", " lien", "autre", null, undefined, 1, {}, ["lien"]]) {
      expect(parseIntent(v)).toBeNull();
    }
  });

  it("destinationFor envoie au bon écran après l'inscription", () => {
    expect(destinationFor("chatbot")).toBe("/dashboard/widget");
    expect(destinationFor("lien")).toBe("/dashboard/availability");
    expect(destinationFor(null)).toBe("/dashboard");
  });
});

describe("color", () => {
  it("isValidHexColor : 6 chiffres hexadécimaux, # facultatif", () => {
    expect(isValidHexColor("#0b7a50")).toBe(true);
    expect(isValidHexColor("0B7A50")).toBe(true);
    expect(isValidHexColor("  #ffffff ")).toBe(true);
    expect(isValidHexColor("#fff")).toBe(false); // forme courte non gérée
    expect(isValidHexColor("#0b7a5")).toBe(false);
    expect(isValidHexColor("#0b7a500")).toBe(false);
    expect(isValidHexColor("#gggggg")).toBe(false);
    expect(isValidHexColor("vert")).toBe(false);
    expect(isValidHexColor("")).toBe(false);
  });

  it("deriveBrandShades : base normalisée, variante foncée et variante claire", () => {
    expect(deriveBrandShades("#0B7A50")).toEqual({ base: "#0b7a50", dark: "#095f3e", soft: "#e2efea" });
    expect(deriveBrandShades("000000")).toEqual({ base: "#000000", dark: "#000000", soft: "#e0e0e0" });
    expect(deriveBrandShades("#ffffff")).toEqual({ base: "#ffffff", dark: "#c7c7c7", soft: "#ffffff" });
  });

  it("deriveBrandShades : null pour une couleur invalide", () => {
    expect(deriveBrandShades("#abc")).toBeNull();
    expect(deriveBrandShades("rouge")).toBeNull();
  });

  it("brandCssVars : remplace les variables forest, ou rien si couleur absente/invalide", () => {
    expect(brandCssVars("#0b7a50")).toEqual({
      "--color-forest": "#0b7a50",
      "--color-forest-dark": "#095f3e",
      "--color-forest-soft": "#e2efea",
    });
    expect(brandCssVars(null)).toEqual({});
    expect(brandCssVars(undefined)).toEqual({});
    expect(brandCssVars("")).toEqual({});
    expect(brandCssVars("pas une couleur")).toEqual({});
  });
});
