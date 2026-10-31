import type { Metadata } from "next";
import LegalPage, { LegalSection, LegalValue } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Confidentialité — RDV Assistant",
  description: "Quelles données RDV Assistant collecte, pourquoi, combien de temps, et vos droits.",
};

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      intro={
        <p>
          En bref&nbsp;: nous collectons uniquement ce qui sert à faire fonctionner la prise de rendez-vous et
          l&apos;assistant. Pas de publicité, pas de revente de données, et aucun cookie en dehors de ceux qui servent à vous connecter.
        </p>
      }
    >
      <LegalSection title="Qui est responsable de vos données">
        <p>
          <strong>Vous êtes entrepreneur et utilisez {LEGAL.serviceName}&nbsp;:</strong> l&apos;éditeur du service
          (<LegalValue value={LEGAL.companyName} />) est responsable des données de votre compte.
        </p>
        <p>
          <strong>Vous êtes client d&apos;un entrepreneur</strong> (vous avez pris rendez-vous ou écrit à son
          assistant)&nbsp;: c&apos;est cet entrepreneur qui décide de collecter vos coordonnées et qui les utilise
          pour gérer vos rendez-vous. Il est responsable de ces données&nbsp;; {LEGAL.serviceName} les héberge et
          les traite pour son compte, uniquement pour faire fonctionner le service. Pour toute demande sur vos
          données, adressez-vous d&apos;abord à lui&nbsp;; vous pouvez aussi nous écrire.
        </p>
      </LegalSection>

      <LegalSection title="Les données que nous traitons">
        <p>
          <strong>Compte de l&apos;entrepreneur&nbsp;:</strong> email, mot de passe (enregistré sous forme
          chiffrée irréversible, jamais en clair), nom de l&apos;activité, lien de la page, fuseau horaire, email de
          notification, couleur et logo. Si vous vous connectez avec Google&nbsp;: votre identifiant Google, votre
          nom et votre email transmis par Google. Et ce que vous saisissez&nbsp;: services et prix, horaires,
          bibliothèque de l&apos;assistant, modèles de messages.
        </p>
        <p>
          <strong>Clients de l&apos;entrepreneur&nbsp;:</strong> nom, numéro de téléphone et/ou adresse email, et
          les rendez-vous (date, heure, service choisi, message éventuel, statut).
        </p>
        <p>
          <strong>Messages échangés avec l&apos;assistant&nbsp;:</strong> pour rédiger chaque réponse, les derniers
          messages de la conversation et les informations publiques de l&apos;entrepreneur (services, horaires,
          bibliothèque) sont envoyés à notre fournisseur d&apos;intelligence artificielle, Groq. La conversation
          complète n&apos;est pas enregistrée dans notre base. Sont en revanche conservés&nbsp;: le nom, le contact
          et un extrait des messages d&apos;une personne qui laisse ses coordonnées (pour que l&apos;entrepreneur
          puisse la recontacter), et les questions auxquelles l&apos;assistant n&apos;a pas su répondre (pour que
          l&apos;entrepreneur complète ses réponses). N&apos;écrivez pas d&apos;informations sensibles (santé,
          données bancaires…) à l&apos;assistant.
        </p>
        <p>
          <strong>Données techniques&nbsp;:</strong> pour limiter les abus (envois massifs, tentatives de
          connexion), nous comptons temporairement les requêtes par adresse IP ou par email&nbsp;; ces compteurs
          sont effacés régulièrement. Notre hébergeur tient aussi des journaux techniques de courte durée.
        </p>
      </LegalSection>

      <LegalSection title="Pourquoi nous les utilisons">
        <ul>
          <li>Créer et sécuriser votre compte, vous connecter.</li>
          <li>Afficher la page de réservation, proposer les créneaux libres et enregistrer les rendez-vous.</li>
          <li>Envoyer les emails liés au service&nbsp;: confirmation d&apos;adresse, confirmations et rappels de
            rendez-vous, notifications à l&apos;entrepreneur.</li>
          <li>Faire répondre l&apos;assistant aux questions des clients et garder le contact des prospects.</li>
          <li>Protéger le service contre les abus.</li>
        </ul>
        <p>
          Nous n&apos;utilisons pas vos données à des fins publicitaires et nous ne les vendons pas.
        </p>
      </LegalSection>

      <LegalSection title="Nos prestataires">
        <p>Ces entreprises traitent des données pour notre compte, uniquement pour fournir le service&nbsp;:</p>
        <ul>
          <li><strong>Vercel</strong> — hébergement du site et de l&apos;application.</li>
          <li><strong>Neon</strong> — hébergement de la base de données.</li>
          <li><strong>Groq</strong> — intelligence artificielle qui rédige les réponses de l&apos;assistant.</li>
          <li><strong>Resend</strong> — envoi des emails.</li>
          <li><strong>Google</strong> — uniquement si vous choisissez «&nbsp;Continuer avec Google&nbsp;».</li>
        </ul>
        <p>
          Leurs serveurs peuvent se trouver hors de Guinée, notamment aux États-Unis. Les échanges avec eux sont
          chiffrés (HTTPS).
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Nous utilisons <strong>un seul cookie</strong> pour l&apos;usage courant&nbsp;: le cookie de session, qui
          vous garde connecté à votre tableau de bord pendant 30&nbsp;jours au plus. Il est supprimé quand vous vous
          déconnectez. Si vous vous connectez avec Google, deux cookies techniques temporaires (10 et
          30&nbsp;minutes) sécurisent cette étape puis sont effacés. Aucun cookie publicitaire ni de mesure
          d&apos;audience. Les clients qui réservent ou écrivent à l&apos;assistant ne reçoivent aucun cookie.
        </p>
      </LegalSection>

      <LegalSection title="Combien de temps nous les gardons">
        <ul>
          <li>
            <strong>Compte de l&apos;entrepreneur et toutes ses données</strong> (clients, rendez-vous, prospects,
            services…)&nbsp;: tant que le compte existe. À la suppression du compte, elles sont effacées
            immédiatement de notre base&nbsp;; les sauvegardes techniques de l&apos;hébergeur peuvent en garder une
            copie pendant une durée limitée avant leur effacement automatique.
          </li>
          <li>
            <strong>Compteurs anti-abus&nbsp;:</strong> effacés automatiquement après 2 à 3&nbsp;jours.
          </li>
          <li>
            <strong>Messages transmis à l&apos;IA&nbsp;:</strong> ils ne sont pas conservés par nous en dehors des
            éléments cités plus haut&nbsp;; leur traitement par Groq est soumis à ses propres engagements.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous pouvez accéder à vos données, les faire corriger ou les faire supprimer. Entrepreneur&nbsp;: vous
          consultez et modifiez vos informations directement dans votre tableau de bord, et vous pouvez{" "}
          <strong>supprimer votre compte à tout moment dans Paramètres</strong> (zone sensible). Client d&apos;un
          entrepreneur&nbsp;: contactez-le, ou écrivez-nous et nous transmettrons votre demande.
        </p>
        <p>
          Contact&nbsp;: <LegalValue value={LEGAL.contactEmail} />. Nous répondons dans un délai d&apos;un mois au
          plus.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Les échanges avec le site sont chiffrés (HTTPS), les mots de passe ne sont jamais stockés en clair, et
          chaque entrepreneur n&apos;a accès qu&apos;aux données de son propre compte.
        </p>
      </LegalSection>

      <LegalSection title="Modifications">
        <p>
          Cette politique peut évoluer avec le service. La date de dernière mise à jour figure en haut de la page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
