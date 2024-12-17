'use client';

import Layout from "@/app/components/Layout";
import { useEffect, useState } from "react";
//import { generatePDF } from "../components/PdfGenerator";

interface LogEntry {
    id: number;
    nom_log: string;
    depot_id: number;
    contenu_log: string;
    date: string;
    action_log: string;
}

interface Depot {
    id: number;
    name: string;
}

interface ProductEntry {
    sku: string;
    nom_produit: string;
    quantite: number;
}

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [depots, setDepots] = useState<{ [key: number]: string }>({});
    const [error, setError] = useState<string | null>(null);

    // Fonction pour récupérer tous les dépôts
    const fetchDepots = async () => {
        try {
            const response = await fetch('http://localhost:3001/depots/select');
            const depotsData: Depot[] = await response.json();

            const depotMap: { [key: number]: string } = {};
            depotsData.forEach(depot => {
                depotMap[depot.id] = depot.name;
            });

            setDepots(depotMap);
        } catch (err) {
            console.error("Erreur lors de la récupération des dépôts:", err);
            setError("Erreur lors de la récupération des dépôts.");
        }
    };

    // Fonction pour récupérer tous les logs
    const fetchLogs = async () => {
        try {
            const response = await fetch('http://localhost:3001/logs/select');
            const logsData: LogEntry[] = await response.json();

            // Inverser l'ordre des logs
            setLogs(logsData.reverse());
        } catch (err) {
            console.error("Erreur lors de la récupération des logs:", err);
            setError("Erreur lors de la récupération des logs.");
        }
    };


    // Fonction pour consulter et générer le PDF à partir du contenu_log
    const handleConsultLog = (log: LogEntry) => {
        try {
            // Double parsing de contenu_log
            const parsedLog: ProductEntry[] = JSON.parse(JSON.parse(log.contenu_log));

            const depotName = depots[log.depot_id] || "Dépôt inconnu";

            // Mapper les objets ProductEntry vers Product
            const mappedProducts = parsedLog.map((product) => ({
                name: product.nom_produit, // Remplacer `nom_produit` par `name`
                sku: product.sku,
                quantity: product.quantite, // Remplacer `quantite` par `quantity`
            }));

            // Générer le PDF avec les produits mappés
            //generatePDF(mappedProducts, log.action_log, log.nom_log, depotName, '/logo-soraya.png');
        } catch (error) {
            console.error("Erreur lors du traitement du log:", error);
            setError("Erreur lors du traitement du log.");
        }
    };

    useEffect(() => {
        fetchDepots(); // Récupérer les dépôts au chargement de la page
        fetchLogs(); // Récupérer les logs au chargement de la page
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-200">
            <Layout>
                <div className="ml-64 p-8 w-full">
                    <div className="mt-10 ml-10">
                        <h1 className="font-bold text-3xl">Logs</h1>
                    </div>

                    {error && <p className="text-red-500">{error}</p>}

                    {/* Tableau des logs */}
                    <div className="mt-10 ml-10">
                        <table className="min-w-full bg-white rounded-lg shadow-lg overflow-hidden">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Action du Log</th>
                                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Nom du Log</th>
                                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Nom du Dépôt</th>
                                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Date</th>
                                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-t">
                                        <td className="py-2 px-4">{log.action_log}</td>
                                        <td className="py-2 px-4">{log.nom_log}</td>
                                        <td className="py-2 px-4">{depots[log.depot_id] || "Dépôt inconnu"}</td>
                                        <td className="py-2 px-4">{new Date(log.date).toLocaleDateString()}</td>
                                        <td className="py-2 px-4">
                                            <button
                                                className="bg-black text-white p-2 px-3 rounded-full hover:bg-white hover:text-black hover:border-black border transition-all duration-300"
                                                onClick={() => handleConsultLog(log)}
                                            >
                                                Consulter
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Layout>
        </div>
    );
}
