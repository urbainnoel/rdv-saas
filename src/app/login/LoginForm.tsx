"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import ResendVerification from "@/components/ResendVerification";
import GoogleButton from "@/components/GoogleButton";

export default function LoginForm({
  initialError,
  googleEnabled,
}: {
  initialError: string | null;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsVerification(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsVerification) setNeedsVerification(true);
        throw new Error(data.error ?? "Erreur de connexion.");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-8">
        <BrandMark />
      </div>

      <h1 className="font-display font-extrabold tracking-tight text-3xl text-ink">Connexion</h1>

      {googleEnabled && <GoogleButton />}

      <form onSubmit={handleSubmit} className={`${googleEnabled ? "mt-6" : "mt-8"} space-y-5`}>
        <div>
          <label className="block text-sm font-medium text-ink">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-ink focus:border-forest"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Mot de passe</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-ink focus:border-forest"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}
        {needsVerification && <ResendVerification email={email} />}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-forest px-4 py-3 font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-forest underline">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
