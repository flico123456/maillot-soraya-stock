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
    localisation: string;
}

interface Product {
    name: string;
    sku: string;
    stock_quantity: number;
}

interface ProductStock {
    nom_produit: string;
    sku: string;
    quantite: number;
}

const SAINT_CANNAT_ID = 1; // ID de Saint-Cannat

export default function Retours() {
    const [sku, setSku] = useState("");
    const [products, setProducts] = useState<ProductEntry[]>([]);
    const [depots, setDepots] = useState<Depot[]>([]); // Liste de tous les dépôts disponibles
    const [selectedDepotId, setSelectedDepotId] = useState<number | null>(null); // Le dépôt sélectionné
    const [error, setError] = useState("");
    const [editingQuantityIndex, setEditingQuantityIndex] = useState<number | null>(null);
    //const [availableStock, setAvailableStock] = useState<{ [sku: string]: number }>({});
    const [showMotifModal, setShowMotifModal] = useState(false);
    const [selectedMotif, setSelectedMotif] = useState<string | null>(null);

    const action = "Retour de stock"; // Action pour le PDF

    // Fonction pour récupérer tous les dépôts sans filtre
    const fetchAllDepots = async () => {
        try {
            const response = await fetch('https://apistock.maillotsoraya-conception.com:3001/depots/select');
            const data = await response.json();
            setDepots(data);

            // Sélectionner le premier dépôt par défaut s'il y en a un
            if (data.length > 0) {
                setSelectedDepotId(data[0].id);
            } else {
                setError('Aucun dépôt trouvé.');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des dépôts', error);
            setError('Erreur lors de la récupération des dépôts');
        }
    };

    // Appeler l'API pour récupérer tous les dépôts au chargement de la page
    useEffect(() => {
        fetchAllDepots(); // Appeler cette fonction sans filtrer les dépôts
    }, []);

    const fetchProductsByDepot = async () => {
        if (!selectedDepotId) {
            setError("Dépôt non trouvé.");
            return [];
        }

        try {
            if (selectedDepotId === SAINT_CANNAT_ID) {
                const response = await fetch(`https://maillotsoraya-conception.com/wp-json/wc/v3/products?sku=${sku}`, {
                    headers: {
                        Authorization:
                            "Basic " +
                            btoa("ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"),
                    },
                });
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des produits via WooCommerce.");
                }
                const data = await response.json();
                if (data.length === 0) {
                    setError("Aucun produit trouvé pour ce SKU dans le dépôt sélectionné.");
                    return [];
                }
                return data.map((product: Product) => ({
                    nom_produit: product.name,
                    sku: product.sku,
                    quantite: product.stock_quantity,
                }));
            } else {
                const response = await fetch(`https://apistock.maillotsoraya-conception.com:3001/stock_by_depot/select/${selectedDepotId}`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des produits du dépôt local.");
                }

                const data = await response.json();
                if (data.length === 0) {
                    setError("Aucun produit trouvé pour ce SKU dans le dépôt sélectionné.");
                    return [];
                }

                const stockItems = data.flatMap((item: { stock: string }) =>
                    JSON.parse(item.stock) as ProductStock[]
                );

                return stockItems;
            }
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
            for (const product of stocks) {
                if (product.sku === sku) {
                    foundProduct = product;
                    //setAvailableStock((prev) => ({ ...prev, [product.sku]: product.quantite }));
                    break;
                }
            }

            if (!foundProduct) {
                setError("Aucun produit trouvé pour ce SKU dans le dépôt sélectionné.");
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


    const handleValidateRetour = async () => {
        if (!selectedDepotId || products.length === 0) {
            setError("Aucun produit sélectionné ou dépôt non trouvé.");
            return;
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

            const response = await fetch("https://apistock.maillotsoraya-conception.com:3001/logs/create", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action_log: action,
                    nom_log: selectedMotif,
                    depot_id: selectedDepotId,
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

    const handleConfirmRetour = async () => {
        if (!selectedMotif) {
            setError("Veuillez sélectionner un motif avant de confirmer le retour.");
            return;
        }

        try {
            for (const product of products) {
                if (selectedDepotId === SAINT_CANNAT_ID) {
                    // Utiliser l'API WooCommerce pour mettre à jour le stock pour Saint-Cannat
                    const response = await fetch(`https://maillotsoraya-conception.com/wp-json/wc/v3/products?sku=${product.sku}`, {
                        headers: {
                            Authorization: "Basic " + btoa("ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"),
                        },
                    });
                    if (!response.ok) {
                        throw new Error(`Erreur lors de la récupération du produit ${product.sku} via WooCommerce.`);
                    }
                    const productData = await response.json();
                    if (productData.length === 0) {
                        setError(`Produit avec SKU ${product.sku} non trouvé.`);
                        continue;
                    }
                    const productId = productData[0].id;
                    const parentProductId = productData[0].parent_id;
                    const currentStock = productData[0].stock_quantity;
                    const newStock = currentStock + product.quantity;

                    // Mettre à jour le stock du produit
                    await fetch(`https://maillotsoraya-conception.com/wp-json/wc/v3/products/${parentProductId}/variations/${productId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Basic " + btoa("ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"),
                        },
                        body: JSON.stringify({
                            stock_quantity: newStock,
                        }),
                    });
                } else {
                    // Utiliser l'API locale pour mettre à jour le stock des autres dépôts
                    const response = await fetch(`https://apistock.maillotsoraya-conception.com:3001/stock_by_depot/update/${selectedDepotId}`, {
                        method: 'PUT',
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            sku: product.sku,
                            quantite: product.quantity, // Ajouter la quantité au stock (positif pour les retours)
                            nom_produit: product.name,
                        }),
                    });

                    if (!response.ok) {
                        setError(`Erreur lors de la mise à jour du produit ${product.sku}.`);
                        continue;
                    }
                }
            }

            await createLog();

            alert("Retour validé avec succès.");
            setProducts([]);
            setSku("");
            setShowMotifModal(false);

            //const depotName = depots.find((d) => d.id === selectedDepotId)?.name || "Dépôt inconnu";
            //generatePDF(products, "Retour de stock", selectedMotif, depotName, '/logo-soraya.png'); // Générer le PDF après validation

        } catch (error) {
            setError("Une erreur est survenue lors de la validation des retours.");
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
                fetchProductBySku(); 0
                setSku(""); // Réinitialise le champ SKU après l'ajout du produit
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-200">
            <Layout>
                <div className="ml-64 p-8 w-full">
                    <div className="mt-10 ml-10">
                        <h1 className="font-bold text-3xl">Retours</h1>
                    </div>

                    {/* Inversion des positions : Input pour SKU à gauche, sélection du dépôt à droite */}
                    <div className="flex mt-10 ml-10 space-x-4">
                        {/* Input pour saisir le SKU */}
                        <div className="flex-grow">
                            <form onSubmit={handleSubmit}>
                                <label className="font-bold">Saisir un SKU :</label>
                                <input
                                    className="border border-gray-300 rounded-full focus:outline-none focus:border-black transition p-2 w-full"
                                    type="text"
                                    placeholder="Saisir votre article"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    required
                                />
                            </form>
                        </div>

                        {/* Sélection du dépôt */}
                        <div className="flex-grow">
                            <label className="font-bold">Sélectionner un dépôt :</label>
                            <select
                                className="border border-gray-300 rounded-full p-2 mt-2 w-full"
                                value={selectedDepotId || ""}
                                onChange={(e) => setSelectedDepotId(Number(e.target.value))}
                            >
                                {depots.map((depot) => (
                                    <option key={depot.id} value={depot.id}>
                                        {depot.name}
                                    </option>
                                ))}
                            </select>
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
                            onClick={handleValidateRetour}
                        >
                            Valider le retour
                        </button>
                    </div>

                    {showMotifModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
                            <div className="bg-white p-8 rounded-lg shadow-lg relative max-w-lg w-full">
                                {/* Croix pour fermer le modal */}
                                <Image
                                    alt="img-close"
                                    src="/close-icon.svg"
                                    width={32}
                                    height={32}
                                    className="absolute top-3 right-3 cursor-pointer"
                                    onClick={() => setShowMotifModal(false)} // Fermer le modal
                                />

                                <h2 className="text-xl font-bold mb-6">Sélectionner le motif de retour</h2>
                                <select
                                    value={selectedMotif || ""}
                                    onChange={(e) => setSelectedMotif(e.target.value)}
                                    className="border border-gray-300 rounded p-2 w-full mb-4"
                                >
                                    <option value="" disabled>Choisir un motif</option>
                                    <option value="Erreur">Erreur</option>
                                    <option value="Remboursement">Remboursement</option>
                                    <option value="Abime">Abimé</option>
                                </select>

                                <div className="flex justify-end">
                                    <button
                                        className="mt-5 w-full bg-black text-white p-2 rounded-full font-bold hover:bg-white hover:text-black hover:border-black border transition-all duration-300"
                                        onClick={handleConfirmRetour}
                                    >
                                        Confirmer le retour
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
