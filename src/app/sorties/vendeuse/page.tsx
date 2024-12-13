'use client';

import Layout from "../../components/Layout";
import { useState, useEffect } from "react";
import Image from "next/image";

interface ProductEntry {
    name: string;
    sku: string;
    quantity: number;
}

interface Depot {
    id: number;
    name: string;
    username_associe: string;
}

interface ProductStock {
    nom_produit: string;
    sku: string;
    quantite: number;
    stock: string;
}

export default function Sorties() {
    const [sku, setSku] = useState("");
    const [products, setProducts] = useState<ProductEntry[]>([]);
    const [depot, setDepot] = useState<Depot | null>(null);
    const [error, setError] = useState("");
    const [editingQuantityIndex, setEditingQuantityIndex] = useState<number | null>(null);
    const [availableStock, setAvailableStock] = useState<{ [sku: string]: number }>({});
    const [showMotifModal, setShowMotifModal] = useState(false);
    const [selectedMotif, setSelectedMotif] = useState<string | null>(null);

    const action = "Sortie de stock"; // Action pour le PDF

    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setUsername(storedUsername);
    }, []);

    const fetchDepotByUsername = async () => {
        try {
            const response = await fetch('http://localhost:3001/depots/select');
            const depots = await response.json();

            const userDepot = depots.find((depot: Depot) => depot.username_associe === username);
            setDepot(userDepot);
        } catch (error) {
            setError("Erreur lors de la récupération du dépôt.");
        } finally {
        }
    };

    useEffect(() => {
        if (username) {
            fetchDepotByUsername();
        }
    }, [username]);

    const fetchProductsByDepot = async () => {
        if (!depot) {
            setError("Dépôt non trouvé.");
            return [];
        }

        try {
            const response = await fetch(`http://localhost:3001/stock_by_depot/select/${depot.id}`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            return data.map((item: ProductStock) => JSON.parse(item.stock) as ProductStock[]);
        } catch (error) {
            setError("Erreur lors de la récupération des produits du dépôt.");
            return [];
        }
    };

    const fetchProductBySku = async () => {
        setError("");

        try {
            const stocks = await fetchProductsByDepot();
            let foundProduct: ProductStock | null = null;
            stocks.forEach((productArray: ProductStock[]) => {
                const product = productArray.find((p) => p.sku === sku);
                if (product) {
                    foundProduct = product;
                    setAvailableStock((prev) => ({ ...prev, [product.sku]: product.quantite }));
                }
            });

            if (!foundProduct) {
                setError("Aucun produit trouvé pour ce SKU dans le dépôt.");
            } else {
                const existingProduct = products.find((p) => p.sku === foundProduct!.sku);
                if (existingProduct) {
                    setProducts((prevProducts) =>
                        prevProducts.map((p) =>
                            p.sku === foundProduct!.sku ? { ...p, quantity: p.quantity + 1 } : p
                        )
                    );
                } else {
                    setProducts((prevProducts) => [
                        ...prevProducts,
                        { name: foundProduct!.nom_produit, sku: foundProduct!.sku, quantity: 1 },
                    ]);
                }
            }
        } catch (error) {
            setError("Erreur lors de la récupération du produit.");
        } finally {
        }
    };

    const handleValidateSortie = async () => {
        if (!depot || products.length === 0) {
            setError("Aucun produit sélectionné ou dépôt non trouvé.");
            return;
        }

        for (const product of products) {
            const stockDisponible = availableStock[product.sku] || 0;
            if (product.quantity > stockDisponible) {
                setError(`Quantité demandée pour le produit ${product.sku} dépasse le stock disponible (${stockDisponible}).`);
                return;
            }
        }

        setShowMotifModal(true);
    };

    const createLog = async () => {
        try {
            const logContent = products.map((product) => ({
                sku: product.sku,
                nom_produit: product.name,
                quantite: product.quantity,
            }));

            const response = await fetch("http://localhost:3001/logs/create", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action_log: action,
                    nom_log: selectedMotif,
                    depot_id: depot?.id,
                    contenu_log: JSON.stringify(logContent),
                }),
            });

            if (!response.ok) {
                setError("Erreur lors de la création du log.");
            }
        } catch (error) {
            setError("Erreur lors de la création du log.");
        }
    };

    const handleConfirmSortie = async () => {
        if (!selectedMotif) {
            setError("Veuillez sélectionner un motif avant de confirmer la sortie.");
            return;
        }

        try {
            for (const product of products) {
                const response = await fetch(`http://localhost:3001/stock_by_depot/update/${depot?.id}`, {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sku: product.sku,
                        quantite: product.quantity * -1,
                        nom_produit: product.name,
                    }),
                });

                if (!response.ok) {
                    setError(`Erreur lors de la mise à jour du produit ${product.sku}.`);
                    continue;
                }
            }

            await createLog();

            alert("Sortie validée avec succès.");
            setProducts([]);
            setSku("");
            setShowMotifModal(false);

        } catch (error) {
            setError("Une erreur est survenue lors de la validation des sorties.");
        }
    };

    const deleteProduct = (sku: string) => {
        setProducts(products.filter((product) => product.sku !== sku));
    };

    const handleQuantityEdit = (index: number) => {
        setEditingQuantityIndex(index);
    };

    const updateQuantity = (index: number, newQuantity: number) => {
        setProducts((prevProducts) =>
            prevProducts.map((product, i) =>
                i === index ? { ...product, quantity: newQuantity } : product
            )
        );
        setEditingQuantityIndex(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (sku.trim() !== "") {
            fetchProductBySku();
            setSku(""); // Réinitialise le champ SKU après la soumission
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Empêche le comportement par défaut
            if (sku.trim() !== "") {
                fetchProductBySku();
                setSku(""); // Réinitialise le champ SKU après l'ajout du produit
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-200">
            <Layout>
                <div className="ml-64 p-8 w-full">
                    <div className="mt-10 ml-10">
                        <h1 className="font-bold text-3xl">Sorties</h1>
                    </div>

                    <div className="flex">
                        <div className="mt-10 ml-10">
                            <form onSubmit={handleSubmit}>
                                <input
                                    className="border border-gray-300 rounded-full focus:outline-none focus:border-black transition p-2"
                                    type="text"
                                    placeholder="Saisir votre article"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    onKeyDown={handleKeyDown} // Écoute la touche "Entrée"
                                    required
                                />
                            </form>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 ml-10">
                            <p className="text-red-500 font-semibold">{error}</p>
                        </div>
                    )}

                    <div className="mt-10 ml-10">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg mt-5">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Nom du produit</th>
                                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">SKU</th>
                                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Quantité</th>
                                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? (
                                    products.map((product, index) => (
                                        <tr key={product.sku} className="border-t">
                                            <td className="py-2 px-4">{product.name}</td>
                                            <td className="py-2 px-4">{product.sku}</td>
                                            <td
                                                className="py-2 px-4 cursor-pointer"
                                                onDoubleClick={() => handleQuantityEdit(index)}
                                            >
                                                {editingQuantityIndex === index ? (
                                                    <input
                                                        type="number"
                                                        value={product.quantity}
                                                        onChange={(e) =>
                                                            updateQuantity(index, parseInt(e.target.value, 10))
                                                        }
                                                        className="border border-gray-300 rounded p-1"
                                                    />
                                                ) : (
                                                    product.quantity
                                                )}
                                            </td>
                                            <td className="py-2 px-4">
                                                <button
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => deleteProduct(product.sku)}
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4 text-gray-500">
                                            Aucun produit ajouté pour le moment
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end mt-10">
                        <button
                            className="bg-black text-white p-3 rounded-full font-bold hover:bg-white hover:text-black hover:border-black border transition-all duration-300"
                            onClick={handleValidateSortie}
                        >
                            Valider la sortie
                        </button>
                    </div>

                    {showMotifModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
                            <div className="bg-white p-8 rounded-lg shadow-lg relative max-w-lg w-full"> {/* Agrandir le modal */}
                                {/* Croix pour fermer le modal */}
                                <Image
                                    alt="img-close"
                                    src="/close-icon.svg"
                                    width={32}
                                    height={32}
                                    className="absolute top-3 right-3 cursor-pointer"
                                    onClick={() => setShowMotifModal(false)} // Fermer le modal
                                />

                                <h2 className="text-xl font-bold mb-6">Sélectionner le motif de sortie</h2>
                                <select
                                    value={selectedMotif || ""}
                                    onChange={(e) => setSelectedMotif(e.target.value)}
                                    className="border border-gray-300 rounded p-2 w-full mb-4"
                                >
                                    <option value="" disabled>Choisir un motif</option>
                                    <option value="Vente">Vente</option>
                                    <option value="Offert">Offert</option>
                                </select>

                                <div className="flex justify-end">
                                    <button
                                        className="mt-5 w-full bg-black text-white p-2 rounded-full font-bold hover:bg-white hover:text-black hover:border-black border transition-all duration-300"
                                        onClick={handleConfirmSortie}
                                    >
                                        Confirmer la sortie
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Layout>
        </div>
    );
}
