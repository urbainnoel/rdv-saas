import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection, LegalValue } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — RDV Assistant",
  description: "Les règles d'utilisation du service RDV Assistant.",
};

export default function ConditionsPage() {
  return (
    <LegalPage
      title="Conditions d'utilisation"
      intro={
        <p>
          Ces conditions s&apos;appliquent à toute personne qui crée un compte sur {LEGAL.serviceName}. En créant
          un compte, vous les acceptez.
        </p>
      }
    >
      <LegalSection title="Le service">
        <p>{LEGAL.serviceName} permet à un entrepreneur&nbsp;:</p>
        <ul>
          <li>de publier une page de réservation à partager et un assistant à intégrer sur son site&nbsp;;</li>
          <li>de laisser ses clients choisir un créneau libre et de recevoir leurs rendez-vous&nbsp;;</li>
          <li>de faire répondre un assistant automatique à leurs questions et de garder le contact des prospects.</li>
        </ul>
        <p>
          Le service est actuellement gratuit pour commencer. Si des offres payantes sont proposées, leurs
          conditions et leur prix seront indiqués clairement avant tout engagement.
        </p>
      </LegalSection>

      <LegalSection title="Votre compte">
        <ul>
          <li>Vous fournissez des informations exactes et gardez votre mot de passe confidentiel.</li>
          <li>Vous êtes responsable de ce qui est publié et fait depuis votre compte.</li>
          <li>
            Vous pouvez supprimer votre compte à tout moment dans Paramètres&nbsp;: vos données sont alors effacées
            et votre page de réservation cesse de fonctionner.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Les données de vos clients">
        <p>
          Les coordonnées et rendez-vous de vos clients vous appartiennent et vous en êtes responsable. Vous vous
          engagez à les utiliser uniquement pour vos échanges avec eux (rendez-vous, suivi, réponses à leurs
          demandes) et à respecter leurs demandes d&apos;accès, de correction ou de suppression.{" "}
          {LEGAL.serviceName} les traite uniquement pour faire fonctionner le service, comme décrit dans la{" "}
          <Link href="/confidentialite" className="font-semibold text-leaf underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="L'assistant automatique">
        <p>
          L&apos;assistant répond à partir des informations que vous lui donnez (services, prix, horaires,
          bibliothèque). Comme tout outil d&apos;intelligence artificielle, il peut se tromper ou mal comprendre une
          demande&nbsp;: tenez vos informations à jour et vérifiez les rendez-vous reçus. Les engagements pris
          envers vos clients (prix, prestations) restent les vôtres.
        </p>
      </LegalSection>

      <LegalSection title="Utilisation interdite">
        <p>Il est interdit d&apos;utiliser le service pour&nbsp;:</p>
        <ul>
          <li>publier des contenus illégaux, trompeurs, haineux ou portant atteinte aux droits d&apos;autrui&nbsp;;</li>
          <li>envoyer des messages non sollicités ou collecter des données à l&apos;insu des personnes&nbsp;;</li>
          <li>tenter de perturber le service ou d&apos;accéder aux données d&apos;un autre compte.</li>
        </ul>
        <p>
          En cas de manquement, nous pouvons suspendre ou supprimer le compte concerné, après vous en avoir informé
          lorsque c&apos;est possible.
        </p>
      </LegalSection>

      <LegalSection title="Disponibilité et responsabilité">
        <p>
          Nous faisons de notre mieux pour que le service fonctionne en continu, sans pouvoir le garantir&nbsp;:
          des interruptions (maintenance, panne d&apos;un prestataire, problème de réseau) peuvent survenir, et la
          réception des emails ne peut pas être garantie. Notre responsabilité ne saurait être engagée pour un
          rendez-vous manqué ou une perte d&apos;activité liés à ces interruptions.
        </p>
      </LegalSection>

      <LegalSection title="Modifications et contact">
        <p>
          Ces conditions peuvent évoluer avec le service&nbsp;; la date de mise à jour figure en haut de la page. En
          cas de changement important, nous vous en informerons. Pour toute question&nbsp;:{" "}
          <LegalValue value={LEGAL.contactEmail} />.
        </p>
        <p>
          Éditeur&nbsp;: <LegalValue value={LEGAL.companyName} /> — voir les{" "}
          <Link href="/mentions-legales" className="font-semibold text-leaf underline">
            mentions légales
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
