import { getCurrentEntrepreneur } from "@/lib/auth";
import { formatDateFr, formatTimeFr, safeTimeZone } from "@/lib/timezone";
import { listOpenQuestions } from "./questions";
import QuestionList from "./QuestionList";

export default async function QuestionsPage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return null;

  const tz = safeTimeZone(entrepreneur.timezone);
  const questions = await listOpenQuestions(entrepreneur.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Questions</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Les questions de tes visiteurs auxquelles ton assistant n&apos;a pas su répondre. Réponds une fois :
          ta réponse rejoint la bibliothèque et l&apos;assistant la donnera lui-même la prochaine fois.
        </p>
      </div>
      <QuestionList
        questions={questions.map((q) => ({
          id: q.id,
          question: q.question,
          // Date affichée dans le fuseau de l'entrepreneur, pas celui du serveur.
          dateLabel: `${formatDateFr(q.createdAt, tz)} à ${formatTimeFr(q.createdAt, tz)}`,
        }))}
      />
    </div>
  );
}
