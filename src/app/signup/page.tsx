import { connection } from "next/server";
import { googleConfigured } from "@/lib/google";
import { parseIntent } from "@/lib/intent";
import SignupForm from "./SignupForm";
import AgendaCorner from "@/components/AgendaCorner";

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  // Lu à chaque requête : le bouton Google apparaît dès que les variables
  // sont ajoutées dans Vercel, sans dépendre du moment du build.
  await connection();
  const intent = parseIntent((await searchParams).intent);
  return (
    <>
      <AgendaCorner className="fixed -bottom-10 -right-10 -z-10 hidden w-[260px] md:grid" />
      <SignupForm googleEnabled={googleConfigured()} intent={intent} />
    </>
  );
}
