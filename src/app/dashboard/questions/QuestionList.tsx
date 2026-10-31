"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, QuestionIcon } from "@/components/icons";

type Question = { id: string; question: string; dateLabel: string };

export default function QuestionList({ questions: initial }: { questions: Question[] }) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  function openForm(q: Question) {
    setOpenId(q.id);
    setDraftQuestion(q.question);
    setDraftAnswer("");
    setError(null);
  }

  async function submit(id: string, payload: object): Promise<boolean> {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/questions/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Une erreur est survenue. Réessaie.");
      setQuestions((qs) => qs.filter((q) => q.id !== id));
      setOpenId(null);
      router.refresh();
      return true;
    } catch (err) {
      setError({ id, message: err instanceof Error ? err.message : "Une erreur est survenue." });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function handleAnswer(e: React.FormEvent, id: string) {
    e.preventDefault();
    if (await submit(id, { action: "answer", question: draftQuestion, answer: draftAnswer })) {
      setAnsweredCount((n) => n + 1);
    }
  }

  return (
    <>
      {answeredCount > 0 && (
        <p className="flex items-start gap-2 rounded-xl bg-forest-soft px-4 py-3 text-sm text-forest">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {answeredCount > 1 ? `${answeredCount} réponses ajoutées` : "Réponse ajoutée"} à ta{" "}
            <Link href="/dashboard/knowledge-base" className="font-bold underline">
              bibliothèque
            </Link>
            . Ton assistant s&apos;en sert dès maintenant.
          </span>
        </p>
      )}

      {questions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
          <QuestionIcon className="h-8 w-8 text-ink-faint" />
          <p className="font-medium text-ink">Aucune question en attente.</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Quand ton assistant ne sait pas répondre à un visiteur, la question arrive ici. Plus ta bibliothèque est
            complète, moins il y en aura.
          </p>
          <Link
            href="/dashboard/knowledge-base"
            className="mt-1 flex min-h-11 items-center rounded-xl border-2 border-border bg-surface px-4 text-sm font-bold text-ink transition hover:border-forest"
          >
            Compléter ma bibliothèque
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {questions.map((q) => {
            const isOpen = openId === q.id;
            const isBusy = busyId === q.id;
            return (
              <li key={q.id} className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-xs text-ink-faint first-letter:uppercase">{q.dateLabel}</p>
                <p className="mt-1 font-medium text-ink [overflow-wrap:anywhere]">« {q.question} »</p>

                {error?.id === q.id && (
                  <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error.message}</p>
                )}

                {isOpen ? (
                  <form onSubmit={(e) => handleAnswer(e, q.id)} className="mt-4 space-y-3 border-t border-border pt-4">
                    <div>
                      <label htmlFor={`q-${q.id}`} className="block text-sm font-medium text-ink">
                        Question
                      </label>
                      <textarea
                        id={`q-${q.id}`}
                        required
                        rows={2}
                        maxLength={1000}
                        value={draftQuestion}
                        onChange={(e) => setDraftQuestion(e.target.value)}
                        className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-ink focus:border-forest"
                      />
                      <p className="mt-1 text-xs text-ink-faint">Tu peux la reformuler, elle sera plus claire pour ton assistant.</p>
                    </div>
                    <div>
                      <label htmlFor={`a-${q.id}`} className="block text-sm font-medium text-ink">
                        Ta réponse
                      </label>
                      <textarea
                        id={`a-${q.id}`}
                        required
                        autoFocus
                        maxLength={2000}
                        rows={3}
                        value={draftAnswer}
                        onChange={(e) => setDraftAnswer(e.target.value)}
                        placeholder="Ex : Oui, je me déplace à domicile dans tout Conakry."
                        className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-ink placeholder:text-ink-faint focus:border-forest"
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={isBusy || !draftQuestion.trim() || !draftAnswer.trim()}
                        className="min-h-11 rounded-xl bg-forest px-4 py-3 font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
                      >
                        {isBusy ? "Enregistrement…" : "Ajouter à la bibliothèque"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenId(null)}
                        disabled={isBusy}
                        className="min-h-11 rounded-xl border-2 border-border bg-surface px-4 py-3 font-bold text-ink transition hover:border-ink-faint"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openForm(q)}
                      disabled={isBusy}
                      className="min-h-11 flex-1 rounded-xl bg-forest px-4 py-2.5 font-bold text-white transition hover:bg-forest-dark disabled:opacity-50 sm:flex-none"
                    >
                      Répondre
                    </button>
                    <button
                      onClick={() => submit(q.id, { action: "ignore" })}
                      disabled={isBusy}
                      className="min-h-11 flex-1 rounded-xl border-2 border-border bg-surface px-4 py-2.5 font-bold text-ink-soft transition hover:border-ink-faint disabled:opacity-50 sm:flex-none"
                    >
                      {isBusy ? "…" : "Ignorer"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
