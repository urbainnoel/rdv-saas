import { getCurrentEntrepreneur } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { safeTimeZone } from "@/lib/timezone";
import HomeView from "./HomeView";

// Écran d'accueil après connexion : l'essentiel en 3 chiffres, puis les 3
// rubriques les plus utilisées. Pensé pour un coup d'œil sur téléphone,
// entre deux clients.
export default async function DashboardHome() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return null;

  const stats = await getDashboardStats(entrepreneur);
  return <HomeView entrepreneur={entrepreneur} stats={stats} tz={safeTimeZone(entrepreneur.timezone)} />;
}
