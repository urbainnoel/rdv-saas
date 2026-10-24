import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import BookingEntry from "./BookingEntry";

export default async function BookingPage({
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
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-16">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <BookingEntry slug={slug} businessName={entrepreneur.businessName} />
      </div>
    </main>
  );
}
