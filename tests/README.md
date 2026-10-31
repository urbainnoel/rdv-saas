# Tests automatiques

Les tests vérifient la logique métier (fuseaux horaires, créneaux, chiffres du
tableau de bord, prospects, limites anti-abus, validation des disponibilités).
Ils tournent avec [Vitest](https://vitest.dev) sur une base Postgres **en
mémoire** (pglite) : aucune connexion à Neon, aucun secret, aucun réseau.

## Lancer les tests

```bash
npm test                          # tous les tests, une fois (≈ 15 s)
npx vitest run tests/slots.test.ts  # un seul fichier
npx vitest                        # mode surveillance pendant qu'on code
```

Les mêmes tests tournent sur GitHub à chaque push (`.github/workflows/ci.yml`),
avec le linter et la compilation.

## Ajouter un test

Créer un fichier `tests/<sujet>.test.ts`. L'alias `@/` pointe vers `src/`.

### Fonction pure (sans base)

```ts
import { describe, expect, it } from "vitest";
import { addDaysToKey } from "@/lib/timezone";

describe("addDaysToKey", () => {
  it("passe d'une année à l'autre", () => {
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
  });
});
```

### Code qui utilise la base (`@/db`)

On remplace `@/db` par une base en mémoire sur laquelle toutes les migrations
de `drizzle/` ont été appliquées. La ligne `vi.mock` doit être en haut du
fichier ; chaque fichier de test a sa propre base.

```ts
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/db", async () => (await import("./helpers/db")).createTestDb());

import { db } from "@/db";
import { getAvailableSlotsForRange } from "@/lib/slots";
import { resetDb } from "./helpers/db";
import { makeAvailability, makeEntrepreneur } from "./helpers/factories";

beforeEach(() => resetDb(db)); // tables vidées entre deux tests

it("propose les créneaux du lundi", async () => {
  const pro = await makeEntrepreneur(db, { timezone: "Europe/Paris" });
  await makeAvailability(db, pro.id, 1, "09:00", "12:00", 60);
  const byDay = await getAvailableSlotsForRange(pro, 1, "2026-11-02");
  expect(byDay["2026-11-02"]).toHaveLength(3);
});
```

Les fabriques de `tests/helpers/factories.ts` (`makeEntrepreneur`,
`makeClient`, `makeAvailability`, `makeAppointment`) remplissent les champs
obligatoires ; on ne précise que ce qui compte pour le test.

### Règles pour des tests fiables

- **Jamais l'horloge réelle.** Pour le code qui utilise `new Date()` :
  `vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-02T10:00:00Z"));`
  puis `vi.useRealTimers()` dans `afterEach`. Pour les fonctions qui acceptent
  `now` en paramètre, le passer directement.
- Toujours écrire les instants en UTC (`...Z`) et choisir le fuseau de
  l'entrepreneur explicitement. Le serveur de test est en UTC, comme Vercel.
- Préciser `createdAt` quand un calcul en dépend : sinon la base met `now()`.
- Tester aussi les cas limites : autre entrepreneur, RDV annulé, minuit,
  changement d'heure (29 mars / 25 octobre 2026 à Paris).
- Un test qui révèle un vrai bug non corrigé : `it.fails(...)` avec un
  commentaire qui décrit le bug, plutôt que de supprimer le test.
- `db.batch` n'existe pas avec pglite : voir `tests/availability-route.test.ts`
  pour l'imiter quand le code testé l'utilise.
