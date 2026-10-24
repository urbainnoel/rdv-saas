"use client";

import { useRef, useState } from "react";

const MAX_DIMENSION = 200; // px — un logo n'a pas besoin d'être plus grand

function resizeAndCompress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Impossible de traiter l'image."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/png", 0.9));
      };
      img.onerror = () => reject(new Error("Image illisible."));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Fichier illisible."));
    reader.readAsDataURL(file);
  });
}

export default function LogoUploader({ initialLogoUrl }: { initialLogoUrl: string | null }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function save(value: string | null) {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogoUrl(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choisis un fichier image (PNG, JPG...).");
      return;
    }
    try {
      const dataUrl = await resizeAndCompress(file);
      await save(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du traitement de l'image.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-4">
      <h2 className="font-medium text-ink">Logo de l&apos;entreprise</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Affiché sur ta page de réservation, dans le widget et sur la bulle de chat, à la place du nom seul.
      </p>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-paper">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-ink-faint">Aucun</span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg bg-forest px-3 py-1.5 text-xs font-medium text-white transition hover:bg-forest-dark disabled:opacity-50"
            >
              {uploading ? "Envoi…" : logoUrl ? "Changer" : "Choisir une image"}
            </button>
            {logoUrl && (
              <button
                onClick={() => save(null)}
                disabled={uploading}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink-soft transition hover:border-danger hover:text-danger"
              >
                Retirer
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
