'use client';

import { useEffect, useState } from "react";
import Layout from "@/app/components/Layout";
import ButtonAddDepot from "../components/Depots/ButtonAddDepot";
import ButtonEditDepot from "../components/Depots/ButtonUpdateDepot";
import ButtonDeleteDepot from "../components/Depots/ButtonDeleteDepot";

interface Depot {
    id: number;
    name: string;
    localisation: string;
    username_associe?: string;
}

export default function Depot() {
    const [depotList, setDepotList] = useState<Depot[]>([]); // Typage explicite des dépôts
    const [loading, setLoading] = useState(true); // Pour afficher un indicateur de chargement

    // Fonction pour récupérer les dépôts depuis l'API
    const fetchDepots = async () => {
        try {
            const response = await fetch("http://51.222.13.7:3001/depots/select");
            const data: Depot[] = await response.json();
            console.log("Dépôts récupérés :", data);
            setDepotList(data); // Mise à jour de l'état avec les données
        } catch (error) {
            console.error("Erreur lors de la récupération des dépôts :", error);
        } finally {
            setLoading(false); // Désactiver le chargement après la récupération des données
        }
    };

    useEffect(() => {
        fetchDepots();
    }, []);

    // Fonction à passer à ButtonAddDepot pour recharger les dépôts après un ajout
    const refreshDepots = () => {
        setLoading(true); // Activer le chargement avant la nouvelle requête
        fetchDepots(); // Recharger les dépôts
    };

    return (
        <div className="flex min-h-screen bg-gray-200">
            <Layout>
                <div className="ml-64 p-8 w-full">
                    {/* Titre de la page */}
                    <div className="mt-10 ml-10">
                        <h1 className="font-bold text-3xl">Dépôts</h1>
                    </div>

                    <div className="flex mt-10 ml-10">
                        {/* Tableau pour afficher les dépôts */}
                        <div className="w-3/4">
                            {loading ? (
                                <p className="text-center text-gray-500">Chargement des dépôts...</p>
                            ) : (
                                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                                    <thead>
                                        <tr>
                                            <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">ID</th>
                                            <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Nom du dépôt</th>
                                            <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Localisation</th>
                                            <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Dépôt associé</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {depotList.length > 0 ? (
                                            depotList.map((depot) => (
                                                <tr key={depot.id} className="border-t">
                                                    <td className="py-2 px-4">{depot.id}</td>
                                                    <td className="py-2 px-4">{depot.name}</td>
                                                    <td className="py-2 px-4">{depot.localisation}</td>
                                                    <td className="py-2 px-4">{depot.username_associe || "Non assigné"}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-4 text-center text-gray-500">
                                                    Aucun dépôt disponible
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Boutons pour ajouter, modifier, supprimer */}
                        <div className="ml-10 mt-20 flex flex-col space-y-4">
                            {/* Passer la fonction refreshDepots comme prop à ButtonAddDepot */}
                            <ButtonAddDepot onDepotAdded={refreshDepots} />
                            <ButtonEditDepot onDepotUpdated={refreshDepots} />
                            <ButtonDeleteDepot onDepotDeleted={refreshDepots} />
                        </div>
                    </div>
                </div>
            </Layout>
        </div>
    );
}

export async function getServerSideProps() {
    return { props: {} }; // Force le rendu côté client uniquement
}
