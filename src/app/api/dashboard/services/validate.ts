// Validation stricte des champs d'un service, partagée par la création (POST)
// et la modification (PATCH). Module pur, testable sans base.

export const SERVICE_LIMITS = {
  nameMax: 100,
  descriptionMax: 500,
  priceMax: 60,
  durationMin: 5,
  durationMax: 720, // 12 h : couvre une journée de formation
} as const;

export type ServiceValues = {
  name: string;
  description: string | null;
  durationMinutes: number | null;
  priceLabel: string | null;
};

type Result = { values: Partial<ServiceValues>; error?: undefined } | { error: string; values?: undefined };

// Champ texte facultatif : absent → non modifié, vide → null.
function optionalText(raw: unknown, max: number, label: string): { value?: string | null; error?: string } {
  if (raw === undefined) return {};
  if (raw === null) return { value: null };
  if (typeof raw !== "string") return { error: `${label} invalide.` };
  // Une seule ligne, espaces multiples réduits : le texte s'affiche dans une liste.
  const value = raw.replace(/\s+/g, " ").trim();
  if (value.length > max) return { error: `${label} : ${max} caractères maximum.` };
  return { value: value || null };
}

/**
 * `partial` = modification : seuls les champs présents sont validés et renvoyés.
 * En création, le nom est obligatoire.
 */
export function validateServiceInput(body: unknown, { partial }: { partial: boolean }): Result {
  if (!body || typeof body !== "object") return { error: "Requête invalide." };
  const b = body as Record<string, unknown>;
  const values: Partial<ServiceValues> = {};

  if (b.name !== undefined || !partial) {
    const name = typeof b.name === "string" ? b.name.replace(/\s+/g, " ").trim() : "";
    if (!name) return { error: "Le nom du service est requis." };
    if (name.length > SERVICE_LIMITS.nameMax) {
      return { error: `Le nom du service : ${SERVICE_LIMITS.nameMax} caractères maximum.` };
    }
    values.name = name;
  }

  const description = optionalText(b.description, SERVICE_LIMITS.descriptionMax, "La description");
  if (description.error) return { error: description.error };
  if (description.value !== undefined) values.description = description.value;

  const price = optionalText(b.priceLabel, SERVICE_LIMITS.priceMax, "Le prix");
  if (price.error) return { error: price.error };
  if (price.value !== undefined) values.priceLabel = price.value;

  if (b.durationMinutes !== undefined) {
    const raw = b.durationMinutes;
    if (raw === null || raw === "") {
      values.durationMinutes = null;
    } else {
      const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw.trim()) : NaN;
      if (!Number.isInteger(n) || n < SERVICE_LIMITS.durationMin || n > SERVICE_LIMITS.durationMax) {
        return {
          error: `La durée doit être un nombre entier de minutes entre ${SERVICE_LIMITS.durationMin} et ${SERVICE_LIMITS.durationMax}.`,
        };
      }
      values.durationMinutes = n;
    }
  }

  return { values };
}
