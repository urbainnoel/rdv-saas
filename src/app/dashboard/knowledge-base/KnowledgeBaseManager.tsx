"use client";

import { useEffect, useState } from "react";

type Entry = { id: string; question: string; answer: string };

export default function KnowledgeBaseManager() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/dashboard/knowledge-base");
    const data = await res.json();
    setEntries(data.entries ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestion("");
      setAnswer("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/dashboard/knowledge-base/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl italic text-ink">Assistant (FAQ)</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Renseigne ici les infos que ton assistant pourra donner automatiquement à tes clients
        (tarifs, horaires, politique d&apos;annulation...). S&apos;il ne connaît pas la réponse, il te
        transmettra la question plutôt que d&apos;inventer.
      </p>

      <form
        onSubmit={handleAdd}
        className="mt-6 space-y-3 rounded-xl border border-border bg-surface p-4"
      >
        <div>
          <label className="block text-xs font-medium text-ink-soft">Question</label>
          <input
            required
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Quels sont vos tarifs ?"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-forest"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-soft">Réponse</label>
          <textarea
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={2}
            placeholder="Ex: La séance coûte 50 000 GNF, le forfait mensuel 180 000 GNF."
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-forest"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-forest px-4 py-1.5 text-sm font-medium text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>

      {!loading && (
        <div className="mt-6 space-y-2">
          {entries.length === 0 ? (
            <p className="text-ink-soft">
              Aucune info renseignée pour l&apos;instant. Ajoute tes questions fréquentes ci-dessus.
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between rounded-xl border border-border bg-surface p-4"
              >
                <div>
                  <p className="font-medium text-ink">{entry.question}</p>
                  <p className="mt-1 text-sm text-ink-soft">{entry.answer}</p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="shrink-0 text-xs text-danger hover:underline"
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
