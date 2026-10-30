import { redirect } from "next/navigation";
import { getCurrentEntrepreneur } from "@/lib/auth";
import Sidebar from "./Sidebar";
import FloatingCopyLink from "./FloatingCopyLink";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col sm:flex-row">
      <Sidebar businessName={entrepreneur.businessName} slug={entrepreneur.slug} />
      {/* pb-24 : de la place sous le contenu pour le bouton flottant */}
      <main className="flex-1 overflow-y-auto bg-paper p-4 pb-24 sm:p-8 sm:pb-28">{children}</main>
      <FloatingCopyLink slug={entrepreneur.slug} />
    </div>
  );
}
