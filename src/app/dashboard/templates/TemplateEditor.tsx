"use client";

import { useEffect, useState } from "react";
import { DEFAULT_MESSAGE_TEMPLATES, MessageTemplateType } from "@/lib/enums";

const LABELS: Record<MessageTemplateType, string> = {
  CONFIRMATION: "Confirmation de réservation",
  REMINDER_24H: "Rappel 24h avant",
  REMINDER_1H: "Rappel 1h avant",
  THANK_YOU: "Remerciement après le RDV",
  NO_SHOW_FOLLOWUP: "Relance après absence (no-show)",
  INACTIVE_CLIENT: "Relance client inactif",
  REVIEW_REQUEST: "Demande d'avis",
};

type Template = {
  id: string;
  type: string;
  content: string;
  enabled: boolean;
};

export default function TemplateEditor() {
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/templates")
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, Template> = {};
        for (const t of data.templates ?? []) map[t.type] = t;
        setTemplates(map);
        setLoading(false);
      });
  }, []);

  async function save(type: string, content: string, enabled: boolean) {
    setSavingType(type);
    const res = await fetch("/api/dashboard/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content, enabled }),
    });
    const data = await res.json();
    setTemplates((prev) => ({ ...prev, [type]: data.template }));
    setSavingType(null);
  }

  if (loading) return <p className="text-ink-soft">Chargement…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl italic text-ink">Messages</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Personnalise les messages envoyés automatiquement à tes clients. Variables
        disponibles :{" "}
        <code className="rounded bg-forest-soft px-1 text-forest">{"{prenom_client}"}</code>{" "}
        <code className="rounded bg-forest-soft px-1 text-forest">{"{date}"}</code>{" "}
        <code className="rounded bg-forest-soft px-1 text-forest">{"{heure}"}</code>{" "}
        <code className="rounded bg-forest-soft px-1 text-forest">{"{nom_entrepreneur}"}</code>
      </p>

      <div className="mt-6 space-y-4">
        {(Object.keys(LABELS) as MessageTemplateType[]).map((type) => {
          const t = templates[type] ?? {
            id: type,
            type,
            content: DEFAULT_MESSAGE_TEMPLATES[type],
            enabled: true,
          };
          return (
            <TemplateCard
              key={type}
              label={LABELS[type]}
              template={t}
              saving={savingType === type}
              onSave={(content, enabled) => save(type, content, enabled)}
            />
          );
        })}
      </div>
    </div>
  );
}

function TemplateCard({
  label,
  template,
  saving,
  onSave,
}: {
  label: string;
  template: Template;
  saving: boolean;
  onSave: (content: string, enabled: boolean) => void;
}) {
  const [content, setContent] = useState(template.content);
  const [enabled, setEnabled] = useState(template.enabled);
  const dirty = content !== template.content || enabled !== template.enabled;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-ink">{label}</p>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="accent-forest"
          />
          Activé
        </label>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-forest"
      />
      <button
        onClick={() => onSave(content, enabled)}
        disabled={!dirty || saving}
        className="mt-2 rounded-lg bg-forest px-3 py-1.5 text-sm font-medium text-white transition hover:bg-forest-dark disabled:opacity-40"
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}
