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
      <h1 className="text-2xl font-bold">Assistant (FAQ)</h1>
      <p className="mt-1 text-neutral-500">
        Renseigne ici les infos que ton assistant pourra donner automatiquement à tes clients
        (tarifs, horaires, politique d'annulation...). S'il ne connaît pas la réponse, il te
        transmettra la question plutôt que d'inventer.
      </p>

      <form
        onSubmit={handleAdd}
        className="mt-6 space-y-3 rounded-xl border border-neutral-200 bg-white p-4"
      >
        <div>
          <label className="block text-xs font-medium text-neutral-600">Question</label>
          <input
            required
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Quels sont vos tarifs ?"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">Réponse</label>
          <textarea
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={2}
            placeholder="Ex: La séance coûte 50 000 GNF, le forfait mensuel 180 000 GNF."
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>

      {!loading && (
        <div className="mt-6 space-y-2">
          {entries.length === 0 ? (
            <p className="text-neutral-500">
              Aucune info renseignée pour l'instant. Ajoute tes questions fréquentes ci-dessus.
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between rounded-xl border border-neutral-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium">{entry.question}</p>
                  <p className="mt-1 text-sm text-neutral-600">{entry.answer}</p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="shrink-0 text-xs text-red-500 hover:underline"
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
