'use client';

import Layout from "../../components/Layout";
import { useState, useEffect } from "react";
import Image from "next/image";
import ButtonClassique from "@/app/components/Button-classique";
import { generatePDFWithPdfLib } from "@/app/components/PdfGenerator";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<ProductEntry[]>([]);
    const [depots, setDepots] = useState<Depot[]>([]); // Liste de tous les dépôts disponibles
    const [selectedDepotId, setSelectedDepotId] = useState<number | null>(null); // Le dépôt sélectionné
    const [filteredStock, setFilteredStock] = useState<ProductStock[]>([]); // Produits filtrés par recherche
    const [error, setError] = useState("");
    const [showMotifModal, setShowMotifModal] = useState(false);
    const [selectedMotif, setSelectedMotif] = useState<string | null>(null);

    // Fonction pour récupérer tous les dépôts
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

    useEffect(() => {
        fetchAllDepots();
    }, []);

    const fetchProductsByDepot = async () => {
        if (!selectedDepotId) {
            setError("Dépôt non trouvé.");
            return [];
        }

        try {
            if (selectedDepotId === SAINT_CANNAT_ID) {
                // Recherche spécifique par SKU si disponible
                const url = sku
                    ? `https://maillotsoraya-conception.com/wp-json/wc/v3/products?sku=${sku}`
                    : `https://maillotsoraya-conception.com/wp-json/wc/v3/products`;

                const response = await fetch(url, {
                    headers: {
                        Authorization:
                            "Basic " +
                            btoa(
                                "ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"
                            ),
                    },
                });

                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des produits via WooCommerce.");
                }

                const data = await response.json();

                // Retourne les produits formatés pour WooCommerce
                return data.map((product: Product) => ({
                    nom_produit: product.name,
                    sku: product.sku,
                    quantite: product.stock_quantity,
                }));
            } else {
                // API locale pour les autres dépôts
                const response = await fetch(
                    `https://apistock.maillotsoraya-conception.com:3001/stock_by_depot/select/${selectedDepotId}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des produits du dépôt local.");
                }

                const data = await response.json();
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

    const handleSearch = async (term: string) => {
        setSearchTerm(term);

        if (!term.trim()) {
            setFilteredStock([]);
            return;
        }

        const allProducts = await fetchProductsByDepot();
        const filtered = allProducts.filter((product: { nom_produit: string; }) =>
            product.nom_produit.toLowerCase().includes(term.toLowerCase())
        );

        setFilteredStock(filtered);
    };

    const addProduct = (product: ProductStock) => {
        const existingProduct = products.find((p) => p.sku === product.sku);
        if (existingProduct) {
            setProducts((prevProducts) =>
                prevProducts.map((p) =>
                    p.sku === product.sku ? { ...p, quantity: p.quantity + 1 } : p
                )
            );
        } else {
            setProducts((prevProducts) => [
                ...prevProducts,
                { name: product.nom_produit, sku: product.sku, quantity: 1 },
            ]);
        }
    };

    const deleteProduct = (sku: string) => {
        setProducts(products.filter((product) => product.sku !== sku));
    };

    const fetchProductBySku = async () => {
        setError("");

        try {
            const stocks = await fetchProductsByDepot();
            const foundProduct = stocks.find((product: { sku: string; }) => product.sku === sku);

            if (!foundProduct) {
                setError("Aucun produit trouvé pour ce SKU dans le dépôt sélectionné.");
            } else {
                addProduct(foundProduct);
                setSku(""); // Réinitialise le champ SKU
            }
        } catch (error) {
            setError("Erreur lors de la récupération du produit.");
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

    const handleValidateRetour = async () => {
        if (!selectedDepotId || products.length === 0) {
            setError("Aucun produit sélectionné ou dépôt non trouvé.");
            return;
        }

        setShowMotifModal(true);
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

            // Log

            alert("Retour validé avec succès.");
            setProducts([]);
            setSku("");
            setShowMotifModal(false);

            const depotName = depots.find((d) => d.id === selectedDepotId)?.name || "Dépôt inconnu";

            // Générer le PDF après validation
            await generatePDFWithPdfLib(products, "Retour de stock", selectedMotif, depotName, "/logo-sans-fond.png");

        } catch (error) {
            setError("Une erreur est survenue lors de la validation des retours.");
        }
    };

    // Calculer le total des quantités
    const calculateTotalQuantity = () => {
        return products.reduce((total, product) => total + product.quantity, 0);
    };

    return (
        <div className="flex min-h-screen justify-center">
            <Layout>
                <div className="p-8 w-full max-w-5xl">
                    <div className="text-center flex mt-20">
                        <h1 className="font-bold text-3xl">Retours</h1>
                    </div>

                    <div className="mt-10 flex justify-between space-x-4">
                        <div className="flex-grow">
                            <label className="font-bold">Saisir un SKU :</label>
                            <input
                                className="border border-gray-300 rounded-lg focus:outline-none focus:border-black transition p-2 w-full"
                                type="text"
                                placeholder="Saisir votre article"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        <div className="flex-grow">
                            <label className="font-bold">Sélectionner un dépôt :</label>
                            <select
                                className="border border-gray-300 rounded-lg p-2 mt-2 w-full"
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

                    <div className="mt-4">
                        <label className="font-bold">Rechercher un produit :</label>
                        <input
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            type="text"
                            placeholder="Rechercher un produit par nom"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    {filteredStock.length > 0 && (
                        <div className="mt-4 bg-white p-4 rounded shadow">
                            {filteredStock.map((product) => (
                                <div
                                    key={product.sku}
                                    className="flex justify-between items-center border-b py-2"
                                >
                                    <p>{product.nom_produit}</p>
                                    <ButtonClassique onClick={() => addProduct(product)} className='font-medium'>Ajouter</ButtonClassique>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 text-center">
                            <p className="text-red-500 font-semibold">{error}</p>
                        </div>
                    )}

                    <div className="mt-10">
                        <table className="w-full bg-white rounded-lg overflow-hidden shadow-lg mt-5">
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
                                    products.map((product) => (
                                        <tr key={product.sku} className="border-t">
                                            <td className="py-2 px-4">{product.name}</td>
                                            <td className="py-2 px-4">{product.sku}</td>
                                            <td className="py-2 px-4">{product.quantity}</td>
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
                                {products.length > 0 && (
                                    <tr className="font-bold border-t">
                                        <td colSpan={2} className="py-2 px-4 text-right">Total</td>
                                        <td className="py-2 px-4">{calculateTotalQuantity()}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end mt-10">
                        <button
                            className="bg-black text-white p-3 rounded-lg font-bold hover:bg-color-black-soraya"
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
                                        className="mt-5 w-full bg-black text-white p-2 rounded-lg hover:bg-color-black-soraya"
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