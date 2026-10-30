import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Police unique de l'appli : géométrique, très grasse pour les titres.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "RDV Assistant",
  // Repris dans les aperçus de lien (WhatsApp, réseaux sociaux) et sur Google.
  description: "Vos clients réservent seuls. Vous, vous travaillez.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${montserrat.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
