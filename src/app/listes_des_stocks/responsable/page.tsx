'use client';

import Layout from "../../components/Layout";
import { useEffect, useState } from "react";

// Fonction pour récupérer les produits classiques et variables depuis l'API custom
const fetchProducts = async () => {
    try {
        const response = await fetch(
            `https://maillotsoraya-conception.com/wp-json/customAPI/v1/getAllProductClassique`,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des produits :", error);
        return [];
    }
};

// Fonction pour récupérer les stocks depuis l'API locale
const fetchLocalStock = async (depotId: number) => {
    try {
        const response = await fetch(
            `http://localhost:3001/stock_by_depot/select/${depotId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des stocks locaux :", error);
        return [];
    }
};

// Fonction pour récupérer la liste des dépôts
const fetchDepots = async () => {
    try {
        const response = await fetch("http://localhost:3001/depots/select");
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des dépôts :", error);
        return [];
    }
};

export default function ListeDesStock({ children }: { children: React.ReactNode }) {
    const [productList, setProductList] = useState<any[]>([]);
    const [depotList, setDepotList] = useState<any[]>([]);
    const [selectedDepot, setSelectedDepot] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [role, setRole] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [userLocalisation, setUserLocalisation] = useState<string | null>(null); // Localisation de l'utilisateur

    // Récupérer le rôle et le nom d'utilisateur depuis le localStorage
    useEffect(() => {
        const storedRole = localStorage.getItem('role');
        const storedUsername = localStorage.getItem('username');
        setRole(storedRole);
        setUsername(storedUsername);
    }, []);

    // Récupérer la localisation de l'utilisateur à partir des dépôts associés
    const fetchLocalisationByUsername = async () => {
        try {
            const response = await fetch('http://localhost:3001/depots/select');
            const depotsData = await response.json();
            const userDepot = depotsData.find((depot: any) => depot.username_associe === username);
            if (userDepot) {
                setUserLocalisation(userDepot.localisation);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération de la localisation :", error);
        }
    };

    useEffect(() => {
        if (username) {
            fetchLocalisationByUsername();
        }
    }, [username]);

    // Fonction pour récupérer les produits et leurs variations ou stocks locaux selon le dépôt
    const fetchStock = async () => {
        setLoading(true);
        try {
            if (selectedDepot === 1) {
                // Si Saint-Cannat (depot_id = 1 par exemple)
                const products = await fetchProducts();
                setProductList(products);
            } else if (selectedDepot !== null) {
                // Si un autre dépôt est sélectionné
                const localStock = await fetchLocalStock(selectedDepot);

                // Analyser le champ 'stock' pour chaque élément
                const processedStock = localStock.map((item: any) => {
                    return {
                        ...item,
                        stock: JSON.parse(item.stock), // Parsing du champ 'stock'
                    };
                });

                setProductList(processedStock);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des stocks :", error);
        } finally {
            setLoading(false);
        }
    };

    // Récupérer la liste des dépôts lors du chargement du composant
    useEffect(() => {
        const loadDepots = async () => {
            const depots = await fetchDepots();

            // Filtrer les dépôts par localisation
            const filteredDepots = depots.filter((depot: any) => depot.localisation === userLocalisation);
            setDepotList(filteredDepots);

            if (filteredDepots.length > 0) {
                setSelectedDepot(filteredDepots[0].id); // Sélectionner automatiquement le premier dépôt lié
            }
        };
        if (userLocalisation) {
            loadDepots();
        }
    }, [userLocalisation]);

    // Recharger les stocks quand un dépôt est sélectionné ou quand une recherche est effectuée
    useEffect(() => {
        if (selectedDepot !== null) {
            fetchStock();
        }
    }, [selectedDepot, search]);

    // Gestion de la soumission du formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStock();
    };

    return (
        <div className="flex min-h-screen bg-gray-200">
            <Layout>{children}</Layout>
            <div className="ml-64 p-8 w-full">
                {/* Titre de la page */}
                <div className="mt-10 ml-10">
                    <h1 className="font-bold text-3xl">Listes des stocks</h1>
                </div>

                {/* Sélecteur de dépôt */}
                <div className="ml-10 mt-4">
                    <select
                        value={selectedDepot ?? ""}
                        onChange={(e) => setSelectedDepot(Number(e.target.value))}
                        className="border border-gray-300 rounded-full p-2 mt-2 w-56"
                    >
                        <option value="" disabled>
                            Sélectionner un dépôt
                        </option>
                        {depotList.map((depot: any) => (
                            <option key={depot.id} value={depot.id}>
                                {depot.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tableau des produits et variations */}
                <div className="mt-10 ml-10 w-full max-w-4xl">
                    {loading ? (
                        <p className="text-center text-gray-500">Chargement des stocks...</p>
                    ) : (
                        <div className="max-h-600 overflow-y-scroll">
                            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
                                <thead>
                                    <tr>
                                        <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">
                                            SKU
                                        </th>
                                        <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">
                                            Nom du produit
                                        </th>
                                        <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">
                                            Stock
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productList.length > 0 ? (
                                        productList.map((product: any) =>
                                            product.variations ? (
                                                product.variations.map((variation: any) => (
                                                    <tr key={variation.id} className="border-t">
                                                        <td className="py-2 px-4">{variation.sku}</td>
                                                        <td className="py-2 px-4">{variation.name}</td>
                                                        <td className="py-2 px-4">
                                                            {variation.stock_quantity !== null
                                                                ? variation.stock_quantity
                                                                : "Indisponible"}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : Array.isArray(product.stock) ? (
                                                product.stock.map(
                                                    (item: any, index: number) => (
                                                        <tr key={index} className="border-t">
                                                            <td className="py-2 px-4">{item.sku}</td>
                                                            <td className="py-2 px-4">{item.nom_produit}</td>
                                                            <td className="py-2 px-4">{item.quantite}</td>
                                                        </tr>
                                                    )
                                                )
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="py-4 text-center text-gray-500"
                                                    >
                                                        Aucun stock disponible
                                                    </td>
                                                </tr>
                                            )
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-4 text-center text-gray-500"
                                            >
                                                Aucun produit disponible
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
