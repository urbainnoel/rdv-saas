"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import ResendVerification from "@/components/ResendVerification";

export default function SignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'inscription.");
      if (data.needsVerification) {
        setPendingEmail(email);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  if (pendingEmail) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
        <div className="mb-8">
          <BrandMark />
        </div>
        <h1 className="font-display text-2xl italic text-ink">Vérifie ta boîte mail</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Nous avons envoyé un lien de confirmation à{" "}
          <span className="font-medium text-ink">{pendingEmail}</span>. Ouvre-le pour activer ton
          compte. Pense à regarder dans les spams.
        </p>
        <ResendVerification email={pendingEmail} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-8">
        <BrandMark />
      </div>

      <h1 className="font-display text-2xl italic text-ink">Créer ton compte</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Pour gérer tes rendez-vous et rappels automatiques.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field
          label="Nom de ton activité"
          type="text"
          value={businessName}
          onChange={setBusinessName}
          placeholder="Ex: Fatou Coach Sportif"
        />
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field
          label="Mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          minLength={8}
        />

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-forest px-4 py-2.5 font-medium text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-forest underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        minLength={minLength}
        className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-ink placeholder:text-ink-faint focus:border-forest"
      />
    </div>
  );
}
