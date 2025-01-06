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
    const [depots, setDepots] = useState<Depot[]>([]); // Liste de tous les dépôts disponibles
    const [selectedDepotId, setSelectedDepotId] = useState<number | null>(null); // Le dépôt sélectionné
    const [error, setError] = useState("");
    const [editingQuantityIndex, setEditingQuantityIndex] = useState<number | null>(null);
    const [availableStock, setAvailableStock] = useState<{ [sku: string]: number }>({});
    const [showMotifModal, setShowMotifModal] = useState(false);
    const [selectedMotif, setSelectedMotif] = useState<string | null>(null);

    const action = "Sortie de stock"; // Action pour le PDF

    const [username, setUsername] = useState<string | null>(null);
    const [userLocalisation, setUserLocalisation] = useState<string | null>(null); // Localisation de l'utilisateur

    const [searchTerm, setSearchTerm] = useState("");
    const [filteredStock, setFilteredStock] = useState<ProductStock[]>([]); // Produits filtrés par recherche

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setUsername(storedUsername);
    }, []);

    // Récupérer la localisation de l'utilisateur à partir des dépôts associés
    const fetchLocalisationByUsername = async () => {
        try {
            const response = await fetch('https://apistock.maillotsoraya-conception.com:3001/depots/select');
            const depotsData = await response.json();
            const userDepot = depotsData.find((depot: Depot) => depot.username_associe === username);
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
        try {
            const response = await fetch('https://apistock.maillotsoraya-conception.com:3001/depots/select');
            const depotsData = await response.json();

            const depotsWithSameLocalisation = depotsData.filter(
                (depot: Depot) => depot.localisation === userLocalisation
            );

            setDepots(depotsWithSameLocalisation);
            if (depotsWithSameLocalisation.length > 0) {
                setSelectedDepotId(depotsWithSameLocalisation[0].id); // Sélectionner par défaut le premier dépôt
            }
        } catch (error) {
            setError("Erreur lors de la récupération des dépôts.");
        } finally {
        }
    };

    useEffect(() => {
        if (userLocalisation) {
            fetchDepotsByLocalisation();
        }
    }, [userLocalisation]);

    const fetchProductsByDepot = async () => {
        if (!selectedDepotId) {
            setError("Dépôt non trouvé.");
            return [];
        }
        try {
            const response = await fetch(`https://apistock.maillotsoraya-conception.com:3001/stock_by_depot/select/${selectedDepotId}`, {
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

    const handleValidateSortie = async () => {
        if (!selectedDepotId || products.length === 0) {
            setError("Aucun produit sélectionné ou dépôt non trouvé.");
            return;
        }

        for (const product of products) {
            const stockDisponible = availableStock[product.sku] || 0;
            console.log(stockDisponible + " " + product.quantity + " " + product.sku);
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

    const handleConfirmSortie = async () => {
        if (!selectedMotif) {
            setError("Veuillez sélectionner un motif avant de confirmer la sortie.");
            return;
        }

        try {
            for (const product of products) {
                const response = await fetch(`https://apistock.maillotsoraya-conception.com:3001/stock_by_depot/update/${selectedDepotId}`, {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sku: product.sku,
                        quantite: product.quantity * -1, // Soustraire la quantité pour une sortie
                        nom_produit: product.name,
                    }),
                });

                if (!response.ok) {
                    setError(`Erreur lors de la mise à jour du produit ${product.sku}.`);
                    continue;
                }
            }

            await createLog();

            const depotName = depots.find((d) => d.id === selectedDepotId)?.name || "Dépôt inconnu";

            // Générer le PDF après validation
            await generatePDFWithPdfLib(products, "Sortie de stock", selectedMotif, depotName, "/logo-sans-fond.png");

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

    const handleSearch = async (term: string) => {
        setSearchTerm(term);

        if (!term.trim()) {
            setFilteredStock([]);
            return;
        }

        const allProducts = await fetchProductsByDepot();
        const filtered = allProducts.flat().filter((product: ProductStock) =>
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

    // Calculer le total des quantités
    const calculateTotalQuantity = () => {
        return products.reduce((total, product) => total + product.quantity, 0);
    };

    return (
        <div className="flex min-h-screen justify-center">
            <Layout>
                <div className="p-8 w-full max-w-5xl">
                    <div className="text-center flex mt-20">
                        <h1 className="font-bold text-3xl">Sorties</h1>
                    </div>

                    <div className="flex mt-10 space-x-4">
                        {/* Input pour saisir le SKU */}
                        <div className="flex-grow">
                            <form onSubmit={handleSubmit}>
                                <label className="font-bold">Saisir un SKU :</label>
                                <input
                                    className="border border-gray-300 rounded-lg focus:outline-none focus:border-black transition p-2 w-full"
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
                        <div className="mt-4">
                            <p className="text-red-500 font-semibold text-center">{error}</p>
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
                            onClick={handleValidateSortie}
                        >
                            Valider la sortie
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
