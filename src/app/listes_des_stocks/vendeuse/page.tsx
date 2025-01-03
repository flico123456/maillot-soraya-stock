'use client';

import Layout from "../../components/Layout";
import { useEffect, useState } from "react";

// Interfaces pour le typage
interface Product {
    id: number;
    name: string;
    sku: string;
    variations?: Variation[];
    stock?: StockItem[];
}

interface Variation {
    id: number;
    name: string;
    sku: string;
    stock_quantity: number | null;
}

interface StockItem {
    sku: string;
    nom_produit: string;
    quantite: number;
}

interface Depot {
    id: number;
    name: string;
    localisation: string;
    username_associe?: string;
}

// Fonction pour récupérer les produits classiques et variables depuis l'API custom
const fetchProducts = async (): Promise<Product[]> => {
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
const fetchLocalStock = async (depotId: number): Promise<StockItem[]> => {
    try {
        const response = await fetch(
            `https://apistock.maillotsoraya-conception.com:3001/stock_by_depot/select/${depotId}`,
            {
                headers: { "Content-Type": "application/json" },
            }
        );
        const data = await response.json();

        // Vérification et parsing du champ `stock`
        const stockData = data[0]?.stock ? JSON.parse(data[0].stock) : [];
        return stockData;
    } catch (error) {
        console.error("Erreur lors de la récupération des stocks locaux :", error);
        return [];
    }
};

// Fonction pour récupérer la liste des dépôts
const fetchDepots = async (): Promise<Depot[]> => {
    try {
        const response = await fetch("https://apistock.maillotsoraya-conception.com:3001/depots/select");
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des dépôts :", error);
        return [];
    }
};

export default function ListeDesStock() {
    const [productList, setProductList] = useState<Product[]>([]);
    const [selectedDepot, setSelectedDepot] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [username, setUsername] = useState<string | null>(null);
    const [userDepotId, setUserDepotId] = useState<number | null>(null);

    // Récupérer le rôle et le nom d'utilisateur depuis le localStorage
    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        setUsername(storedUsername);
    }, []);

    // Récupérer le dépôt associé à l'utilisateur
    const fetchDepotByUsername = async () => {
        try {
            const depots = await fetchDepots();
            const userDepot = depots.find((depot) => depot.username_associe === username);
            if (userDepot) {
                setUserDepotId(userDepot.id);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération du dépôt associé :", error);
        }
    };

    useEffect(() => {
        if (username) {
            fetchDepotByUsername();
        }
    }, [username]);

    // Fonction pour récupérer les produits ou stocks locaux selon le dépôt utilisateur
    const fetchStock = async () => {
        setLoading(true);
        try {
            if (userDepotId !== null) {
                const stockItems = await fetchLocalStock(userDepotId);
                const processedStock: Product[] = stockItems.map((item, index) => ({
                    id: index + 1,
                    name: item.nom_produit,
                    sku: item.sku,
                    stock: [item],
                }));
                setProductList(processedStock);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des stocks :", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userDepotId !== null) {
            fetchStock();
        }
    }, [userDepotId]);

    // Filtrer les produits en fonction de la recherche
    const filteredProducts = productList.filter((product) => {
        if (search.trim() === "") return true;
        return (
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.sku.toLowerCase().includes(search.toLowerCase()) ||
            product.stock?.some((item) =>
                item.nom_produit.toLowerCase().includes(search.toLowerCase())
            )
        );
    });

    // Calculer le total des quantités
    const calculateTotalQuantity = () => {
        return filteredProducts.reduce((total, product) => {
            return (
                total + (product.stock?.reduce((sum, item) => sum + item.quantite, 0) || 0)
            );
        }, 0);
    };

    return (
        <div className="flex min-h-screen justify-center">
            <Layout>
                <div className="p-8 w-full max-w-5xl">
                    <div className="text-center flex mt-20">
                        <h1 className="font-bold text-3xl">Listes des stocks</h1>
                    </div>

                    <div className="mt-4">
                        <input
                            type="text"
                            placeholder="Rechercher un produit"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border border-gray-300 rounded-full p-2 w-full max-w-xs"
                        />
                    </div>

                    <div className="mt-10 w-full max-w-4xl">
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
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map((product) =>
                                                product.stock?.map((item, index) => (
                                                    <tr key={index} className="border-t">
                                                        <td className="py-2 px-4">{item.sku}</td>
                                                        <td className="py-2 px-4">{item.nom_produit}</td>
                                                        <td className="py-2 px-4">{item.quantite}</td>
                                                    </tr>
                                                ))
                                            )
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="py-4 text-center text-gray-500">
                                                    Aucun produit disponible
                                                </td>
                                            </tr>
                                        )}
                                        {filteredProducts.length > 0 && (
                                            <tr className="font-bold border-t bg-gray-100">
                                                <td colSpan={2} className="py-2 px-4 text-right">Total</td>
                                                <td className="py-2 px-4">{calculateTotalQuantity()}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </Layout>
        </div>
    );
}
