"use client"; // Assurer que le layout est exécuté côté client

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import VerticalNavbar from "./NavBar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    // Vérifier s'il y a un token dans le localStorage
    const token = localStorage.getItem("token");

    if (!token) {
      // Rediriger vers la page de connexion si aucun token n'est trouvé
      router.push("/connexion");
    }
  }, [router]);

  return (
    <div>
      <VerticalNavbar />
      <main>{children}</main> {/* Affiche le contenu des pages protégées */}
    </div>
  );
};

export default Layout;
