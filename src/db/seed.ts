// Script de test : crée un entrepreneur de démo avec des disponibilités
// et des templates de messages par défaut.
// Usage : npx tsx src/db/seed.ts

import { db, schema } from "./index";
import { DEFAULT_MESSAGE_TEMPLATES } from "../lib/enums";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  const slug = "fatou-coach";

  const existing = await db
    .select()
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.slug, slug))
    .limit(1);

  let entrepreneurId: string;

  if (existing.length > 0) {
    entrepreneurId = existing[0].id;
    console.log("Entrepreneur de démo déjà présent, réutilisation.");
  } else {
    const passwordHash = await bcrypt.hash("demo1234", 10);
    const [entrepreneur] = await db
      .insert(schema.entrepreneurs)
      .values({
        email: "fatou@example.com",
        passwordHash,
        businessName: "Fatou Coach Sportif",
        slug,
        timezone: "Africa/Conakry",
      })
      .returning();
    entrepreneurId = entrepreneur.id;
    console.log("Entrepreneur de démo créé :", entrepreneur.businessName);

    // Disponibilités : lundi à vendredi, 9h-12h et 14h-18h, créneaux de 45 min
    const weekdays = [1, 2, 3, 4, 5]; // lundi à vendredi
    for (const dayOfWeek of weekdays) {
      await db.insert(schema.availabilities).values([
        {
          entrepreneurId,
          dayOfWeek,
          startTime: "09:00",
          endTime: "12:00",
          slotDurationMinutes: 45,
        },
        {
          entrepreneurId,
          dayOfWeek,
          startTime: "14:00",
          endTime: "18:00",
          slotDurationMinutes: 45,
        },
      ]);
    }
    console.log("Disponibilités créées (lun-ven, 9h-12h / 14h-18h).");

    // Templates de messages par défaut
    for (const [type, content] of Object.entries(DEFAULT_MESSAGE_TEMPLATES)) {
      await db.insert(schema.messageTemplates).values({
        entrepreneurId,
        type,
        content,
        enabled: true,
      });
    }
    console.log("Templates de messages créés.");
  }

  console.log("\n✅ Prêt ! Page de réservation : /" + slug);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
