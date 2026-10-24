import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentEntrepreneur } from "@/lib/auth";
import WidgetSnippet from "./WidgetSnippet";
import BrandColorPicker from "./BrandColorPicker";
import LogoUploader from "./LogoUploader";

export default async function WidgetPage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) redirect("/login");

  const host = (await headers()).get("host");
  const origin = `https://${host}`;
  const snippet = `<script src="${origin}/widget.js" data-slug="${entrepreneur.slug}" defer></script>`;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl italic text-ink">Intégrer sur mon site</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Colle ce code juste avant la balise <code className="rounded bg-surface px-1">&lt;/body&gt;</code> de
        ton site existant. Une bulle de chat apparaîtra automatiquement en bas à droite : tes visiteurs
        pourront discuter avec ton assistant et réserver directement, sans quitter ton site.
      </p>

      <WidgetSnippet snippet={snippet} />

      <BrandColorPicker initialColor={entrepreneur.brandColor} />
      <LogoUploader initialLogoUrl={entrepreneur.logoUrl} />

      <div className="mt-6 space-y-3 text-sm text-ink-soft">
        <p>
          L&apos;assistant qui répond dans ce widget est exactement le même que celui de ta{" "}
          <a href={`/${entrepreneur.slug}`} target="_blank" rel="noreferrer" className="text-forest underline">
            page de réservation
          </a>{" "}
          — il se base sur la même bibliothèque (FAQ, infos, consignes) et les mêmes créneaux. Si tu la mets à
          jour, le widget s&apos;adapte automatiquement, partout où il est installé.
        </p>
        <p>
          Pas de compte technique requis côté entrepreneur : si ton site est fait avec WordPress, Wix,
          Shopify ou autre, ajoute ce code dans la section &laquo; code personnalisé / scripts &raquo; de ton
          éditeur de site (souvent dans les réglages du thème ou du pied de page).
        </p>
      </div>
    </div>
  );
}
