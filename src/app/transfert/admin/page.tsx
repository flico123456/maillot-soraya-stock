'use client';

import Layout from "@/app/components/Layout";
import { useState, useEffect } from "react";
import { generatePDF } from "../../components/PdfGenerator"; // Import de la fonction pour générer le PDF

interface Depot {
    id: number;
    name: string;
    localisation: string;
    stock: string;
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

const SAINT_CANNAT_ID = 1; // ID de Saint-Cannat

export default function TransfertAdmin() {
    const [sku, setSku] = useState("");
    const [products, setProducts] = useState<ProductEntry[]>([]);
    const [depots, setDepots] = useState<Depot[]>([]);
    const [depotSourceId, setDepotSourceId] = useState<number | null>(null);
    const [depotDestinationId, setDepotDestinationId] = useState<number | null>(null);
    const [error, setError] = useState("");

    // Fonction pour mettre à jour la quantité d'un produit dans le tableau
    const updateQuantity = (index: number, newQuantity: number) => {
        setProducts((prevProducts) =>
            prevProducts.map((product, i) => i === index ? { ...product, quantity: newQuantity } : product)
        );
    };

    // Fonction pour supprimer un produit du tableau
    const deleteProduct = (sku: string) => {
        setProducts(products.filter((product) => product.sku !== sku));
    };

    // Récupérer tous les dépôts (sans restriction)
    const fetchAllDepots = async () => {
        try {
            const response = await fetch('http://localhost:3001/depots/select');
            const depotsData = await response.json();
            setDepots(depotsData);
        } catch (error) {
            setError("Erreur lors de la récupération des dépôts.");
        } finally {
        }
    };

    useEffect(() => {
        fetchAllDepots(); // Récupérer tous les dépôts dès que le composant est monté
    }, []);

    // Récupérer les produits via WooCommerce
    const fetchProductFromWooCommerce = async (sku: string) => {
        try {
            const response = await fetch(`https://maillotsoraya-conception.com/wp-json/wc/v3/products?sku=${sku}`, {
                headers: {
                    Authorization: "Basic " + btoa("ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"),
                },
            });
            const productData = await response.json();
            if (productData.length > 0) {
                const product = productData[0];
                return {
                    id: product.id,
                    parent_id: product.parent_id,
                    name: product.name,
                    sku: product.sku,
                    quantity: product.stock_quantity,
                };
            }
        } catch (error) {
            setError("Erreur lors de la récupération du produit via WooCommerce.");
        }
        return null;
    };

    // Récupérer les produits locaux (non WooCommerce)
    const fetchProductsByDepot = async (depotId: number): Promise<ProductStock[]> => {
        try {
            const response = await fetch(`http://localhost:3001/stock_by_depot/select/${depotId}`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            const products: ProductStock[] = data.map((item: Depot) => JSON.parse(item.stock)).flat();
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

        setError("");

        try {
            let foundProduct: ProductStock | null = null;

            // Si le dépôt source est Saint-Cannat, utiliser l'API WooCommerce
            if (depotSourceId === SAINT_CANNAT_ID) {
                const wooProduct = await fetchProductFromWooCommerce(sku);
                if (wooProduct) {
                    foundProduct = {
                        nom_produit: wooProduct.name,
                        sku: wooProduct.sku,
                        quantite: wooProduct.quantity,
                    };
                }
            } else {
                // Sinon, utiliser l'API locale
                const stocks = await fetchProductsByDepot(depotSourceId);
                stocks.forEach((product: ProductStock) => {
                    if (product.sku === sku) {
                        foundProduct = product;
                    }
                });
            }

            if (!foundProduct) {
                setError("Produit non trouvé dans le dépôt source.");
            } else if (foundProduct.quantite < 1) {
                setError(`Quantité insuffisante pour le produit ${foundProduct.sku} (Stock: ${foundProduct.quantite}).`);
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
        }
    };

    // Mettre à jour le stock WooCommerce pour une variation de produit
    const updateWooCommerceStock = async (sku: string, quantityChange: number) => {
        try {
            // Étape 1 : Récupérer l'ID du produit à partir du SKU
            const productData = await fetchProductFromWooCommerce(sku);
            if (!productData) {
                throw new Error(`Produit avec le SKU ${sku} non trouvé.`);
            }

            // Étape 2 : Utiliser l'ID parent et l'ID de la variation pour mettre à jour la quantité de stock
            const productId = productData.parent_id;
            const variationId = productData.id;
            const currentQuantity = productData.quantity;

            if (!productId || !variationId) {
                throw new Error(`Produit parent ou variation non trouvés pour le SKU ${sku}.`);
            }

            // Calculer la nouvelle quantité en déduisant `quantityChange`
            const newQuantity = currentQuantity + quantityChange;

            const response = await fetch(`https://maillotsoraya-conception.com/wp-json/wc/v3/products/${productId}/variations/${variationId}`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Basic " + btoa("ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"),
                },
                body: JSON.stringify({
                    stock_quantity: newQuantity,
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la mise à jour du stock WooCommerce pour le produit ${sku}`);
            }
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("An unknown error occurred.");
            }
        }
    };

    // Valider le transfert et créer un log
    const handleValidateTransfert = async () => {
        if (!depotSourceId || !depotDestinationId || products.length === 0) {
            setError("Aucun produit sélectionné ou dépôt non trouvé.");
            return;
        }

        try {
            for (const product of products) {
                // Si le dépôt source est Saint-Cannat, utiliser l'API WooCommerce
                if (depotSourceId === SAINT_CANNAT_ID) {
                    await updateWooCommerceStock(product.sku, -product.quantity);
                } else {
                    // Diminuer la quantité dans le dépôt source via l'API locale
                    await fetch(`http://localhost:3001/stock_by_depot/update/${depotSourceId}`, {
                        method: 'PUT',
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            sku: product.sku,
                            quantite: -product.quantity,
                            nom_produit: product.nom_produit,
                        }),
                    });
                }

                // Si le dépôt destination est Saint-Cannat, utiliser l'API WooCommerce
                if (depotDestinationId === SAINT_CANNAT_ID) {
                    await updateWooCommerceStock(product.sku, product.quantity);
                } else {
                    // Augmenter la quantité dans le dépôt destination via l'API locale
                    await fetch(`http://localhost:3001/stock_by_depot/update/${depotDestinationId}`, {
                        method: 'PUT',
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            sku: product.sku,
                            quantite: product.quantity,
                            nom_produit: product.nom_produit,
                        }),
                    });
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
                    nom_log: "-",
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
            <Layout>
                <div className="ml-64 p-8 w-full">
                    <div className="mt-10 ml-10">
                        <h1 className="font-bold text-3xl">Transfert Admin</h1>
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
            </Layout>
        </div>
    );
}
