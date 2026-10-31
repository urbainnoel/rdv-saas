import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection, LegalValue } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales — RDV Assistant",
  description: "Éditeur, hébergement et contact du service RDV Assistant.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales">
      <LegalSection title="Éditeur du service">
        <p>
          {LEGAL.serviceName} est un service en ligne de prise de rendez-vous et d&apos;assistant de réponse
          automatique destiné aux indépendants et petites entreprises.
        </p>
        <ul>
          <li>
            <strong>Raison sociale&nbsp;:</strong> <LegalValue value={LEGAL.companyName} />
          </li>
          <li>
            <strong>Forme juridique&nbsp;:</strong> <LegalValue value={LEGAL.legalForm} />
          </li>
          <li>
            <strong>Adresse&nbsp;:</strong> <LegalValue value={LEGAL.address} />
          </li>
          <li>
            <strong>RCCM&nbsp;:</strong> <LegalValue value={LEGAL.rccm} />
          </li>
          <li>
            <strong>Email de contact&nbsp;:</strong> <LegalValue value={LEGAL.contactEmail} />
          </li>
          <li>
            <strong>Directeur de la publication&nbsp;:</strong> <LegalValue value={LEGAL.publicationDirector} />
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Hébergement">
        <ul>
          <li>
            <strong>Site et application&nbsp;:</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723,
            États-Unis — vercel.com
          </li>
          <li>
            <strong>Base de données&nbsp;:</strong> Neon (service Postgres hébergé) — neon.tech
          </li>
        </ul>
        <p>
          Les autres prestataires techniques (assistant IA, envoi d&apos;emails) sont présentés dans la{" "}
          <Link href="/confidentialite" className="font-semibold text-leaf underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Contenus">
        <p>
          Les textes, l&apos;interface et le code du service appartiennent à son éditeur. Les contenus saisis par
          les entrepreneurs (nom d&apos;activité, services, prix, réponses de l&apos;assistant, logo…) restent leur
          propriété et sont publiés sous leur responsabilité sur leur page de réservation.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          La manière dont vos données sont collectées et utilisées est décrite dans la{" "}
          <Link href="/confidentialite" className="font-semibold text-leaf underline">
            politique de confidentialité
          </Link>
          . Les règles d&apos;utilisation du service figurent dans les{" "}
          <Link href="/conditions" className="font-semibold text-leaf underline">
            conditions d&apos;utilisation
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
