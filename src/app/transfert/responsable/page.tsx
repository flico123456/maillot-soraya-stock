'use client';

import Layout from "@/app/components/Layout";
import { useState, useEffect } from "react";
import { generatePDF } from "../../components/PdfGenerator"; // Import de la fonction pour générer le PDF


interface Depot {
    id: number;
    name: string;
    localisation: string;
}

interface ProductStock {
    nom_produit: string;
    sku: string;
    quantite: number;
}

interface ProductEntry {
    nom_produit: string;
    name: string;
    sku: string;
    quantity: number;
}

export default function TransfertResponsable({ children }: { children: React.ReactNode }) {
    const [sku, setSku] = useState("");
    const [products, setProducts] = useState<ProductEntry[]>([]);
    const [depots, setDepots] = useState<Depot[]>([]);
    const [depotSourceId, setDepotSourceId] = useState<number | null>(null);
    const [depotDestinationId, setDepotDestinationId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [availableStock, setAvailableStock] = useState<{ [sku: string]: number }>({});

    const [username, setUsername] = useState<string | null>(null);
    const [userLocalisation, setUserLocalisation] = useState<string | null>(null);

    // Récupérer le nom d'utilisateur depuis le localStorage
    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setUsername(storedUsername);
    }, []);

    // Récupérer la localisation de l'utilisateur
    const fetchLocalisationByUsername = async () => {
        try {
            const response = await fetch('http://localhost:3001/depots/select');
            const depotsData = await response.json();
            const userDepot = depotsData.find((depot: any) => depot.username_associe === username);
            if (userDepot) {
                setUserLocalisation(userDepot.localisation);
            }
        } catch (error) {
            setError("Erreur lors de la récupération de la localisation.");
        }
    };

    useEffect(() => {
        if (username) {
            fetchLocalisationByUsername();
        }
    }, [username]);

    // Récupérer tous les dépôts avec la même localisation
    const fetchDepotsByLocalisation = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/depots/select');
            const depotsData = await response.json();
            const depotsWithSameLocalisation = depotsData.filter(
                (depot: any) => depot.localisation === userLocalisation
            );
            setDepots(depotsWithSameLocalisation);
        } catch (error) {
            setError("Erreur lors de la récupération des dépôts.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userLocalisation) {
            fetchDepotsByLocalisation();
        }
    }, [userLocalisation]);

    // Récupérer les stocks pour un dépôt donné
    const fetchProductsByDepot = async (depotId: number): Promise<ProductStock[]> => {
        try {
            const response = await fetch(`http://localhost:3001/stock_by_depot/select/${depotId}`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            const products: ProductStock[] = data.map((item: any) => JSON.parse(item.stock)).flat();
            return products;
        } catch (error) {
            setError("Erreur lors de la récupération des produits du dépôt.");
            return [];
        }
    };

    // Récupérer un produit par SKU dans le dépôt source
    const fetchProductBySku = async () => {
        if (!depotSourceId) {
            setError("Sélectionnez un dépôt source.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const stocks = await fetchProductsByDepot(depotSourceId);
            let foundProduct: ProductStock | null = null as ProductStock | null;

            stocks.forEach((product: ProductStock) => {
                if (product.sku === sku) {
                    foundProduct = product;
                    setAvailableStock((prev) => ({ ...prev, [product.sku]: product.quantite }));
                }
            });

            if (!foundProduct) {
                setError("Produit non trouvé dans le dépôt source.");
            } else if ((foundProduct as ProductStock).quantite < 1) {
                setError(`Quantité insuffisante pour le produit ${(foundProduct as ProductStock).sku} (Stock: ${(foundProduct as ProductStock).quantite}).`);
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
                        { nom_produit: foundProduct!.nom_produit, name: foundProduct!.nom_produit, sku: foundProduct!.sku, quantity: 1 },
                    ]);
                }
            }
        } catch (error) {
            setError("Erreur lors de la récupération du produit.");
        } finally {
            setLoading(false);
        }
    };

    // Modifier la quantité d'un produit dans le tableau
    const updateQuantity = (index: number, newQuantity: number) => {
        setProducts((prevProducts) =>
            prevProducts.map((product, i) => i === index ? { ...product, quantity: newQuantity } : product)
        );
    };

    // Supprimer un produit du tableau
    const deleteProduct = (sku: string) => {
        setProducts(products.filter((product) => product.sku !== sku));
    };

    // Valider le transfert et créer un log
    const handleValidateTransfert = async () => {
        if (!depotSourceId || !depotDestinationId || products.length === 0) {
            setError("Aucun produit sélectionné ou dépôt non trouvé.");
            return;
        }

        try {
            for (const product of products) {
                // Diminuer la quantité dans le dépôt source
                const responseSource = await fetch(`http://localhost:3001/stock_by_depot/update/${depotSourceId}`, {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sku: product.sku,
                        quantite: -product.quantity, // Réduire la quantité dans le dépôt source
                    }),
                });

                if (!responseSource.ok) {
                    setError(`Erreur lors de la mise à jour du dépôt source pour le produit ${product.sku}.`);
                    continue;
                }

                // Augmenter la quantité dans le dépôt destination
                const responseDestination = await fetch(
                    `http://localhost:3001/stock_by_depot/update/${depotDestinationId}`,
                    {
                        method: 'PUT',
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            sku: product.sku,
                            nom_produit: product.nom_produit,
                            quantite: product.quantity, // Augmenter la quantité dans le dépôt destination
                        }),
                    }
                );

                if (!responseDestination.ok) {
                    setError(`Erreur lors de la mise à jour du dépôt destination pour le produit ${product.sku}.`);
                    continue;
                }
            }

            // Créer un log
            const logContent = products.map((product) => ({
                sku: product.sku,
                nom_produit: product.nom_produit,
                quantite: product.quantity,
            }));

            await fetch("http://localhost:3001/logs/create", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action_log: "Transfert",
                    nom_log:"-",
                    depot_id: depotSourceId,
                    contenu_log: JSON.stringify(logContent),
                }),
            });

            // Générer le PDF après validation
            const depotSourceName = depots.find((d) => d.id === depotSourceId)?.name || "Dépôt inconnu";
            const depotDestinationName = depots.find((d) => d.id === depotDestinationId)?.name || "Dépôt inconnu";
            generatePDF(products, "Transfert", "-", `${depotSourceName} vers ${depotDestinationName}`, '/logo-soraya.png');

            alert("Transfert validé avec succès.");
            setProducts([]);
            setSku("");
        } catch (error) {
            setError("Une erreur est survenue lors du transfert.");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (sku.trim() !== "") {
            fetchProductBySku();
            setSku(""); // Réinitialise le champ SKU après la soumission
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-200">
            <Layout>{children}</Layout>
            <div className="ml-64 p-8 w-full">
                <div className="mt-10 ml-10">
                    <h1 className="font-bold text-3xl">Transfert</h1>
                </div>

                <div className="mt-10 ml-10 space-x-4 flex">
                    {/* Sélection du dépôt source */}
                    <div className="flex-grow">
                        <label className="font-bold">Dépôt source :</label>
                        <select
                            className="border border-gray-300 rounded-full p-2 mt-2 w-full"
                            value={depotSourceId || ""}
                            onChange={(e) => setDepotSourceId(Number(e.target.value))}
                        >
                            <option value="" disabled>
                                Sélectionner le dépôt source
                            </option>
                            {depots.map((depot) => (
                                <option key={depot.id} value={depot.id}>
                                    {depot.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sélection du dépôt destination */}
                    <div className="flex-grow">
                        <label className="font-bold">Dépôt destination :</label>
                        <select
                            className="border border-gray-300 rounded-full p-2 mt-2 w-full"
                            value={depotDestinationId || ""}
                            onChange={(e) => setDepotDestinationId(Number(e.target.value))}
                        >
                            <option value="" disabled>
                                Sélectionner le dépôt destination
                            </option>
                            {depots.map((depot) => (
                                <option key={depot.id} value={depot.id}>
                                    {depot.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 ml-10">
                    {/* Input pour saisir le SKU */}
                    <form onSubmit={handleSubmit} className="space-x-4">
                        <input
                            className="border border-gray-300 rounded-full focus:outline-none focus:border-black transition p-2"
                            type="text"
                            placeholder="Saisir le SKU"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            required
                        />
                    </form>
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
                                        <td className="py-2 px-4">
                                            <input
                                                type="number"
                                                value={product.quantity}
                                                min={1}
                                                onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                                                className="border border-gray-300 rounded p-1"
                                            />
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
                        onClick={handleValidateTransfert}
                    >
                        Valider le transfert
                    </button>
                </div>
            </div>
        </div>
    );
}
