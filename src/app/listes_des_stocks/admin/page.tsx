'use client';

import ButtonClassique from "@/app/components/Button-classique";
import Layout from "../../components/Layout";
import { useEffect, useState } from "react";
import Image from "next/image";

// Interfaces pour le typage
interface Product {
    id: number;
    name: string;
    sku: string;
    stock_quantity?: number | null; // Pour WooCommerce
    stock?: StockItem[]; // Pour stocks locaux
    categories?: string[]; // Liste des catégories
    variations: Variation[]; // Pour WooCommerce
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
    categories: string;
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

interface Category {
    id: number;
    name: string;
}

// Fonction pour récupérer les produits WooCommerce
const fetchWooCommerceProducts = async (): Promise<Product[]> => {
    try {
        const response = await fetch(
            `https://maillotsoraya-conception.com/wp-json/customAPI/v1/getAllProductClassique`,
            { headers: { "Content-Type": "application/json" } }
        );
        const data = await response.json();

        // Extraire les variations et inclure les catégories
        return data.flatMap((product: Product) =>
            product.variations.map((variation: Variation) => ({
                id: variation.id,
                name: variation.name,
                sku: variation.sku,
                stock_quantity: variation.stock_quantity,
                categories: variation.categories, // Inclure les catégories sous forme de tableau
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
                stock_quantity: stockItem.quantite, // Inclure la quantité ici
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

// Fonction pour récupérer les catégories
const fetchCategories = async (): Promise<Category[]> => {
    try {
        const response = await fetch("https://maillotsoraya-conception.com/wp-json/wc/v3/products/categories", {
            headers: {
                Authorization: "Basic " + btoa("ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"),
            },
        });
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des catégories :", error);
        return [];
    }
};

export default function ListeDesStock() {
    const [productList, setProductList] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [depotList, setDepotList] = useState<Depot[]>([]);
    const [selectedDepot, setSelectedDepot] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [openFiltre, setOpenFiltre] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const loadCategories = async () => {
            const categories = await fetchCategories();
            setCategories(categories);
        };
        loadCategories();
    }, []);

    useEffect(() => {
        const loadDepots = async () => {
            const depots = await fetchDepots();
            setDepotList(depots);
        };
        loadDepots();
    }, []);

    useEffect(() => {
        const fetchStock = async () => {
            if (!selectedDepot) return;
            setLoading(true);

            try {
                let products: Product[] = [];
                if (selectedDepot === 1) {
                    products = await fetchWooCommerceProducts();
                } else {
                    products = await fetchLocalStock(selectedDepot);
                }
                setProductList(products);
                setFilteredProducts(products); // Met à jour les produits filtrés directement
                setSelectedCategory(null); // Réinitialise les catégories
            } catch (error) {
                console.error("Erreur lors de la récupération des stocks :", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStock();
    }, [selectedDepot]);

    useEffect(() => {
        const filtered = productList.filter((product) => {
            const matchesCategory =
                selectedCategory === null ||
                (product.categories && product.categories.includes(selectedCategory));
            return matchesCategory;
        });

        setFilteredProducts(filtered);
    }, [productList, selectedCategory]);

    const calculateTotalQuantity = (products: Product[]) => {
        return products.reduce((total, product) => total + (product.stock_quantity || 0), 0);
    };

    // Filtrer les produits en fonction de la recherche
    const rechercheProducts = productList.filter((product) => {
        if (search.trim() === "" || selectedDepot === 1) return true;
        return (
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.sku.toLowerCase().includes(search.toLowerCase()) ||
            product.stock?.some((item) =>
                item.nom_produit.toLowerCase().includes(search.toLowerCase())
            )
        );
    });

    return (
        <div className="flex min-h-screen justify-center">
            <Layout>
                <div className="p-8 w-full max-w-5xl">
                    <h1 className="font-bold text-3xl flex mt-20">Listes des stocks</h1>
                    <div className="flex justify-center mt-4">
                        <select
                            value={selectedDepot ?? ""}
                            onChange={(e) => setSelectedDepot(Number(e.target.value))}
                            className="border rounded-lg p-2"
                        >
                            <option value="" disabled>Sélectionner un dépôt</option>
                            {depotList.map((depot) => (
                                <option key={depot.id} value={depot.id}>{depot.name}</option>
                            ))}
                        </select>
                    </div>
                    {selectedDepot === 1 && (
                        <div className="flex justify-end mr-5">
                            <ButtonClassique className="font-medium mt-14" onClick={() => setOpenFiltre(true)}>
                                Filtrer
                            </ButtonClassique>
                        </div>
                    )}

                    {selectedDepot !== 1 && (
                        <div className="mt-4">
                            <input
                                type="text"
                                placeholder="Rechercher un produit"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border border-gray-300 rounded-full p-2 w-full max-w-xs"
                            />
                        </div>
                    )}

                    {loading ? (
                        <p className="text-gray-500 text-center mt-10">Chargement des stocks...</p>
                    ) : (
                        <table className="w-800 mt-3 bg-white rounded-lg shadow-lg">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 bg-black text-white">SKU</th>
                                    <th className="py-2 px-4 bg-black text-white">Nom</th>
                                    <th className="py-2 px-4 bg-black text-white">Quantité</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rechercheProducts.length > 0 ? (
                                    <>
                                        {rechercheProducts.map((product) => (
                                            <tr key={product.id} className="border-t">
                                                <td className="py-2 px-4">{product.sku || "Non disponible"}</td>
                                                <td className="py-2 px-4">{product.name}</td>
                                                <td className="py-2 px-4">
                                                    {product.stock_quantity ?? "Non disponible"}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="font-bold border-t bg-gray-100">
                                            <td colSpan={2} className="py-2 px-4 text-right">Total</td>
                                            <td className="py-2 px-4">{calculateTotalQuantity(rechercheProducts)}</td>
                                        </tr>
                                    </>
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
                {openFiltre && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
                        <div className="bg-white p-8 rounded-lg shadow-lg relative max-w-lg w-full">
                            <Image
                                alt="img-close"
                                src="/close-icon.svg"
                                width={32}
                                height={32}
                                className="absolute top-3 right-3 cursor-pointer"
                                onClick={() => setOpenFiltre(false)}
                            />
                            <h2 className="text-xl font-bold mb-6">Sélectionner un filtre</h2>
                            <div className="flex justify-center mt-4">
                                <select
                                    value={selectedCategory ?? ""}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="border rounded-lg p-2"
                                >
                                    <option value="" disabled>Sélectionner une catégorie</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.name}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </Layout>
        </div>
    );
}
