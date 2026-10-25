import { connection } from "next/server";
import { googleConfigured } from "@/lib/google";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  // Lu à chaque requête : le bouton Google apparaît dès que les variables
  // sont ajoutées dans Vercel, sans dépendre du moment du build.
  await connection();
  return <SignupForm googleEnabled={googleConfigured()} />;
}
