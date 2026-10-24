import BookingWidget from "./BookingWidget";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-16">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <BookingWidget slug={slug} />
      </div>
    </main>
  );
}
