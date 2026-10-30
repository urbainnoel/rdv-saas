"use client";

import { useEffect, useState } from "react";

type EntryType = "faq" | "info" | "logic";
type Entry = { id: string; type: EntryType; question: string; answer: string };

const TABS: { key: EntryType; label: string; help: string; titleLabel: string; contentLabel: string; titlePlaceholder: string; contentPlaceholder: string }[] = [
  {
    key: "faq",
    label: "Questions fréquentes",
    help: "Des questions précises que tes clients posent souvent, avec la réponse exacte à donner.",
    titleLabel: "Question",
    contentLabel: "Réponse",
    titlePlaceholder: "Ex : Quels sont vos tarifs ?",
    contentPlaceholder: "Ex : La séance coûte 50 000 GNF, le forfait mensuel 180 000 GNF.",
  },
  {
    key: "info",
    label: "Infos sur l'entreprise",
    help: "Documentation plus libre : présentation, zone d'intervention, politique d'annulation, à propos de toi... Tout ce que l'assistant doit connaître même sans question précise associée.",
    titleLabel: "Titre",
    contentLabel: "Contenu",
    titlePlaceholder: "Ex : Politique d'annulation",
    contentPlaceholder: "Ex : Toute annulation à moins de 24h à l'avance n'est pas remboursée, sauf cas de force majeure.",
  },
  {
    key: "logic",
    label: "Logique de réponse",
    help: "Des consignes de comportement pour l'assistant : comment réagir dans telle ou telle situation, au-delà d'une simple info.",
    titleLabel: "Situation",
    contentLabel: "Comment réagir",
    titlePlaceholder: "Ex : Un client demande un rabais",
    contentPlaceholder: "Ex : Explique poliment qu'il n'y a pas de rabais sur les premières séances, mais qu'il existe un forfait dégressif à partir de 4 séances.",
  },
];

export default function KnowledgeBaseManager() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EntryType>("faq");
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
        body: JSON.stringify({ question, answer, type: activeTab }),
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

  const tab = TABS.find((t) => t.key === activeTab)!;
  const filteredEntries = entries.filter((e) => (e.type ?? "faq") === activeTab);

  return (
    <div>
      <h1 className="font-display font-extrabold tracking-tight text-2xl text-ink">Bibliothèque de l&apos;assistant</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Tout ce que tu ajoutes ici nourrit directement ton assistant : plus tu lui donnes d&apos;informations
        et de consignes, mieux il comprend tes clients et répond à leur place. S&apos;il ne trouve pas la
        réponse, il te transmet la question plutôt que d&apos;inventer.
      </p>

      <div className="mt-6 flex gap-1 rounded-2xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === t.key ? "bg-forest text-white" : "text-ink-soft hover:bg-paper"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-ink-soft">{tab.help}</p>

      <form
        onSubmit={handleAdd}
        className="mt-4 space-y-3 rounded-2xl border border-border bg-surface p-4"
      >
        <div>
          <label className="block text-xs font-medium text-ink-soft">{tab.titleLabel}</label>
          <input
            required
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={tab.titlePlaceholder}
            className="mt-1 w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-forest"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-soft">{tab.contentLabel}</label>
          <textarea
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            placeholder={tab.contentPlaceholder}
            className="mt-1 w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-forest"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-forest px-4 py-1.5 text-sm font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>

      {!loading && (
        <div className="mt-6 space-y-2">
          {filteredEntries.length === 0 ? (
            <p className="text-ink-soft">
              Rien dans cette catégorie pour l&apos;instant. Ajoute ta première entrée ci-dessus.
            </p>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between rounded-2xl border border-border bg-surface p-4"
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
