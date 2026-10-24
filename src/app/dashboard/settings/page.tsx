import { redirect } from "next/navigation";
import { getCurrentEntrepreneur } from "@/lib/auth";
import NotificationEmailForm from "./NotificationEmailForm";

export default async function SettingsPage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) redirect("/login");

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl italic text-ink">Paramètres</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Choisis où tu veux recevoir les notifications liées à tes rendez-vous (confirmations, rappels,
        nouveaux prospects, questions sans réponse de l&apos;assistant).
      </p>

      <NotificationEmailForm accountEmail={entrepreneur.email} initialValue={entrepreneur.notificationEmail} />
    </div>
  );
}
