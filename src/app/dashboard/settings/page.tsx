import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentEntrepreneur } from "@/lib/auth";
import BusinessForm from "./BusinessForm";
import NotificationEmailForm from "./NotificationEmailForm";
import TimezoneForm from "./TimezoneForm";
import DeleteAccount from "./DeleteAccount";
import { safeTimeZone } from "@/lib/timezone";

export default async function SettingsPage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) redirect("/login");

  // Domaine affiché dans l'aperçu du lien (sans https:// pour rester lisible sur mobile).
  const host = (await headers()).get("host") ?? "";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Paramètres</h1>

      <section>
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">Ton activité</h2>
        <p className="mt-1 mb-4 text-sm text-ink-soft">Le nom que voient tes clients et le lien de ta page de réservation.</p>
        <BusinessForm host={host} initialName={entrepreneur.businessName} initialSlug={entrepreneur.slug} />
      </section>

      <section>
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">Notifications</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Choisis où tu veux recevoir les notifications liées à tes rendez-vous (confirmations, rappels,
          nouveaux prospects, questions sans réponse de l&apos;assistant).
        </p>
        <NotificationEmailForm accountEmail={entrepreneur.email} initialValue={entrepreneur.notificationEmail} />
      </section>

      <section>
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">Fuseau horaire</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Tes disponibilités, tes créneaux et les heures des rappels sont exprimés dans ce fuseau.
        </p>
        <TimezoneForm initialValue={safeTimeZone(entrepreneur.timezone)} />
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-danger">Zone sensible</h2>
        <p className="mt-1 mb-4 text-sm text-ink-soft">Des actions définitives, à faire en connaissance de cause.</p>
        <DeleteAccount businessName={entrepreneur.businessName} />
      </section>
    </div>
  );
}
