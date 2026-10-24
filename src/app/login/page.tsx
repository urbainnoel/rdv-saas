import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  // Redirection depuis un lien de confirmation expiré ou déjà utilisé.
  const initialError =
    params.verification === "invalid"
      ? "Ce lien de confirmation n'est plus valable. Connecte-toi pour en recevoir un nouveau."
      : null;
  return <LoginForm initialError={initialError} />;
}
