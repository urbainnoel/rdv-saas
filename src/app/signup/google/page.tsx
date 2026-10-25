import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GOOGLE_PENDING_COOKIE, type GoogleProfile } from "@/lib/google";
import { verifyTemporaryToken } from "@/lib/session";
import GoogleSignupForm from "./GoogleSignupForm";

// Dernière étape de l'inscription via Google : seul le nom d'activité manque.
export default async function GoogleSignupPage() {
  const token = (await cookies()).get(GOOGLE_PENDING_COOKIE)?.value ?? "";
  const profile = await verifyTemporaryToken<GoogleProfile>("google-signup", token);
  if (!profile) redirect("/signup");
  return <GoogleSignupForm email={profile.email} />;
}
