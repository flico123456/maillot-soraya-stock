'use client';

import Layout from "../../components/Layout";
import { useEffect, useState } from "react";

// Interfaces pour le typage
interface Product {
    id: number;
    name: string;
    sku: string;
    stock_quantity?: number | null; // Pour WooCommerce
    stock?: StockItem[]; // Pour stocks locaux
}

interface StockItem {
    sku: string;
    nom_produit: string;
    quantite: number;
}

interface Variation {
    id: number;
    name: string;
    sku: string;
    stock_quantity: number | null;
}

interface Depot {
    id: number;
    name: string;
    username_associe?: string;
}

interface DepotStockResponse {
    id: number;
    depot_id: number;
    stock: string; // Chaîne JSON représentant le stock
}

// Fonction pour récupérer les produits WooCommerce
const fetchWooCommerceProducts = async (): Promise<Product[]> => {
    try {
        const response = await fetch(
            `https://maillotsoraya-conception.com/wp-json/customAPI/v1/getAllProductClassique`,
            { headers: { "Content-Type": "application/json" } }
        );
        const data = await response.json();
        return data.flatMap((product: any) =>
            product.variations.map((variation: Variation) => ({
                id: variation.id,
                name: variation.name,
                sku: variation.sku,
                stock_quantity: variation.stock_quantity,
            }))
        );
    } catch (error) {
        console.error("Erreur lors de la récupération des produits WooCommerce :", error);
        return [];
    }
};

// Fonction pour récupérer les stocks locaux
const fetchLocalStock = async (depotId: number): Promise<Product[]> => {
    try {
        const response = await fetch(
            `https://apistock.maillotsoraya-conception.com:3001/stock_by_depot/select/${depotId}`,
            { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        const data: DepotStockResponse[] = await response.json();
        return data.flatMap((item) =>
            JSON.parse(item.stock || "[]").map((stockItem: StockItem) => ({
                id: item.id,
                name: stockItem.nom_produit,
                sku: stockItem.sku,
                stock: [stockItem],
            }))
        );
    } catch (error) {
        console.error("Erreur lors de la récupération des stocks locaux :", error);
        return [];
    }
};

// Fonction pour récupérer les dépôts
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
    const [depotList, setDepotList] = useState<Depot[]>([]);
    const [selectedDepot, setSelectedDepot] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    // Récupérer le rôle et le nom d'utilisateur depuis localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            setRole(localStorage.getItem("role"));
            setUsername(localStorage.getItem("username"));
        }
    }, []);

    // Charger la liste des dépôts
    useEffect(() => {
        const loadDepots = async () => {
            const depots = await fetchDepots();
            if (role === "vendeuse") {
                const filteredDepots = depots.filter((depot) => depot.username_associe === username);
                setDepotList(filteredDepots);
                if (filteredDepots.length > 0) setSelectedDepot(filteredDepots[0].id);
            } else {
                setDepotList(depots);
            }
        };
        if (role) loadDepots();
    }, [role, username]);

    // Charger les stocks en fonction du dépôt sélectionné
    useEffect(() => {
        const fetchStock = async () => {
            if (!selectedDepot) return;
            setLoading(true);
            try {
                if (selectedDepot === 1) {
                    const products = await fetchWooCommerceProducts();
                    setProductList(products);
                } else {
                    const products = await fetchLocalStock(selectedDepot);
                    setProductList(products);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des stocks :", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStock();
    }, [selectedDepot]);

    return (
        <div className="flex min-h-screen justify-center">
            <Layout>
                <div className="p-8 w-full max-w-5xl">
                    <h1 className="font-bold text-3xl flex mt-20">Listes des stocks</h1>
                    {role !== "vendeuse" && (
                        <div className="flex justify-center mt-4">
                            <select
                                value={selectedDepot ?? ""}
                                onChange={(e) => setSelectedDepot(Number(e.target.value))}
                                className="border rounded-full p-2"
                            >
                                <option value="" disabled>Sélectionner un dépôt</option>
                                {depotList.map((depot) => (
                                    <option key={depot.id} value={depot.id}>{depot.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {loading ? (
                        <p className="text-gray-500 text-center mt-10">Chargement des stocks...</p>
                    ) : (
                        <table className="w-full mt-10 bg-white rounded-lg shadow-lg">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 bg-black text-white">SKU</th>
                                    <th className="py-2 px-4 bg-black text-white">Nom</th>
                                    <th className="py-2 px-4 bg-black text-white">Quantité</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productList.length > 0 ? (
                                    productList.map((product) => (
                                        <tr key={product.id} className="border-t">
                                            <td className="py-2 px-4">{product.sku || "Non disponible"}</td>
                                            <td className="py-2 px-4">{product.name}</td>
                                            <td className="py-2 px-4">
                                                {product.stock_quantity ??
                                                    product.stock?.map((item) => item.quantite).join(", ") ??
                                                    "Non disponible"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-4 text-gray-500">
                                            Aucun produit disponible
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </Layout>
        </div>
    );
}
