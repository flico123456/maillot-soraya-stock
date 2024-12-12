"use client";

import { useEffect, useState } from "react";

export default function useVendeuseUsers() {
  const [vendeuseUsers, setVendeuseUsers] = useState([]); // Stocker uniquement les vendeuses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bearer token fourni
  //const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL21haWxsb3Rzb3JheWEtY29uY2VwdGlvbi5jb20iLCJpYXQiOjE3MjcyNzYyMDcsIm5iZiI6MTcyNzI3NjIwNywiZXhwIjoxNzI3ODgxMDA3LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIzNSJ9fX0.hHbpbzS5Bjn94OoU3CnBRwQLZpc0RGb4bI71ABv8Lxc';

  const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage

  // Fonction pour récupérer les vendeuses via l'API
  const fetchVendeuseUsers = async () => {
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
      console.log('error')
    } finally {
      setLoading(false); // Fin du chargement
    }
  };

  useEffect(() => {
    fetchVendeuseUsers(); // Appeler l'API au chargement du composant
  }, []);

  return { vendeuseUsers, loading, error };
}
