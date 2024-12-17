"use client"; // Assurer que ce composant est exécuté côté client

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VerticalNavbar from "./NavBar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Indiquer que nous sommes côté client

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (!token) {
        // Rediriger vers la page de connexion si aucun token n'est trouvé
        router.push("/connexion");
      }
    }
  }, [router]);

  // Si le composant est encore en attente d'exécution côté client, on peut afficher un loader
  if (!isClient) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <VerticalNavbar />
      <main>{children}</main> {/* Affiche le contenu des pages protégées */}
    </div>
  );
};

export default Layout;
