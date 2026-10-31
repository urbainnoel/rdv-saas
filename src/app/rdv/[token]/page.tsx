import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brandCssVars } from "@/lib/color";
import { formatDateFr, formatTimeFr, safeTimeZone } from "@/lib/timezone";
import { findManagedAppointment, manageBlockReason } from "../manage";
import ManageAppointment from "./ManageAppointment";

// Page privée (le jeton est la clé) : jamais indexée, et le jeton ne doit
// pas fuiter vers d'autres sites via l'en-tête Referer.
export const metadata: Metadata = {
  title: "Votre rendez-vous",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ManageAppointmentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findManagedAppointment(token);
  if (!found) notFound();

  const { appointment, entrepreneur, client, serviceName } = found;
  const tz = safeTimeZone(entrepreneur.timezone);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-16" style={brandCssVars(entrepreneur.brandColor)}>
      <div className="rounded-3xl border border-border bg-surface p-5 sm:p-8">
        <ManageAppointment
          token={token}
          slug={entrepreneur.slug}
          businessName={entrepreneur.businessName}
          logoUrl={entrepreneur.logoUrl}
          timezone={tz}
          firstName={client.fullName.split(" ")[0]}
          serviceName={serviceName}
          // Formatés côté serveur, dans le fuseau de l'entrepreneur.
          dateLabel={formatDateFr(appointment.startAt, tz)}
          timeLabel={`${formatTimeFr(appointment.startAt, tz)} – ${formatTimeFr(appointment.endAt, tz)}`}
          blockReason={manageBlockReason(appointment)}
        />
      </div>
    </main>
  );
}
