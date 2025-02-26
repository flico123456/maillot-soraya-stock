"use client";

import { useEffect, useState, useCallback } from "react";

export default function useVendeuseUsers() {
  const [vendeuseUsers, setVendeuseUsers] = useState([]); // Stocker uniquement les vendeuses
  const [loading, setLoading] = useState(true);

  // Récupérer le token depuis le localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fonction pour récupérer les vendeuses via l'API, mémorisée avec useCallback
  const fetchVendeuseUsers = useCallback(async () => {
    try {
      const response = await fetch('https://maillotsoraya-conception.com/wp-json/wp/v2/users?roles=vendeuse', {
        headers: {
          'Authorization': `Bearer ${token}`, // Ajouter le token Bearer dans les en-têtes
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVendeuseUsers(data); // Mettre à jour l'état avec la liste des vendeuses
      } else {
        throw new Error('Erreur lors de la récupération des vendeuses');
      }
    } catch (error) {
      console.log("Erreur :", error);
    } finally {
      setLoading(false); // Fin du chargement
    }
  }, [token]); // `useCallback` mémorise la fonction tant que `token` ne change pas

  useEffect(() => {
    if (token) {
      fetchVendeuseUsers(); // Appeler l'API uniquement si un token est présent
    }
  }, [fetchVendeuseUsers]); // Ajouter `fetchVendeuseUsers` en dépendance sans provoquer de boucle infinie

  return { vendeuseUsers, loading };
}
