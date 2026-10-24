import { redirect } from "next/navigation";
import { getCurrentEntrepreneur } from "@/lib/auth";
import Sidebar from "./Sidebar";

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
      <main className="flex-1 overflow-y-auto bg-paper p-4 sm:p-8">{children}</main>
    </div>
  );
}
