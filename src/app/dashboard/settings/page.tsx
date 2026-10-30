import { redirect } from "next/navigation";
import { getCurrentEntrepreneur } from "@/lib/auth";
import NotificationEmailForm from "./NotificationEmailForm";
import TimezoneForm from "./TimezoneForm";
import { safeTimeZone } from "@/lib/timezone";

export default async function SettingsPage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) redirect("/login");

  return (
    <div className="max-w-xl">
      <h1 className="font-display font-extrabold tracking-tight text-2xl text-ink">Paramètres</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Choisis où tu veux recevoir les notifications liées à tes rendez-vous (confirmations, rappels,
        nouveaux prospects, questions sans réponse de l&apos;assistant).
      </p>

      <NotificationEmailForm accountEmail={entrepreneur.email} initialValue={entrepreneur.notificationEmail} />

      <h2 className="mt-10 font-display font-extrabold tracking-tight text-lg text-ink">Fuseau horaire</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Tes disponibilités, tes créneaux et les heures des rappels sont exprimés dans ce fuseau.
      </p>
      <TimezoneForm initialValue={safeTimeZone(entrepreneur.timezone)} />
    </div>
  );
}
