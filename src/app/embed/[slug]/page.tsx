import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import BookingEntry from "../../[slug]/BookingEntry";

// Version compacte de la page de réservation, pensée pour être chargée dans
// l'iframe du widget intégré sur le site de l'entrepreneur (voir
// /public/widget.js). Même logique que la page publique /[slug], mais sans
// la mise en page "pleine page" : juste le contenu, pour remplir un petit
// panneau flottant.
export default async function EmbedBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [entrepreneur] = await db
    .select({ businessName: schema.entrepreneurs.businessName })
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.slug, slug))
    .limit(1);

  if (!entrepreneur) notFound();

  return (
    <main className="h-full bg-surface p-4">
      <BookingEntry slug={slug} businessName={entrepreneur.businessName} />
    </main>
  );
}
