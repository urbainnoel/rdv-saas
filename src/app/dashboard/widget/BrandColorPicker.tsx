"use client";

import { useState } from "react";

const PRESETS = [
  { label: "Vert forêt (défaut)", value: "#1f4d3d" },
  { label: "Bleu nuit", value: "#1e3a5f" },
  { label: "Bordeaux", value: "#7a2e3b" },
  { label: "Terracotta", value: "#c05f3c" },
  { label: "Violet", value: "#4b3b78" },
];

export default function BrandColorPicker({ initialColor }: { initialColor: string | null }) {
  const [color, setColor] = useState(initialColor ?? "#1f4d3d");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(value: string | null) {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/dashboard/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandColor: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setColor(value ?? "#1f4d3d");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-border bg-surface p-4">
      <h2 className="font-medium text-ink">Couleur de ta marque</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Choisis une couleur pour que ta page de réservation, le widget et la bulle de chat correspondent à
        ta charte graphique, au lieu du vert par défaut.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          onBlur={(e) => save(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface"
        />
        <span className="text-sm text-ink-soft">{color}</span>
        {saving && <span className="text-xs text-ink-faint">Enregistrement…</span>}
        {saved && <span className="text-xs text-forest">Enregistré</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => save(p.value)}
            className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft transition hover:border-forest"
          >
            <span
              className="h-3.5 w-3.5 rounded-full border border-border/50"
              style={{ background: p.value }}
            />
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
