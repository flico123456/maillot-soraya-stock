'use client';

import Layout from "../../components/Layout";
import { useState, useEffect } from "react";
import Image from "next/image";
import ButtonClassique from "@/app/components/Button-classique";

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
    const [searchTerm, setSearchTerm] = useState(""); // Recherche par nom
    const [products, setProducts] = useState<ProductEntry[]>([]);
    const [depot, setDepot] = useState<Depot | null>(null);
    const [error, setError] = useState("");
    const [editingQuantityIndex, setEditingQuantityIndex] = useState<number | null>(null);
    const [filteredStock, setFilteredStock] = useState<ProductStock[]>([]); // Produits filtrés par recherche
    const [stock, setStock] = useState<ProductStock[]>([]); // Tous les produits du dépôt
    const [showMotifModal, setShowMotifModal] = useState(false);
    const [selectedMotif, setSelectedMotif] = useState<string | null>(null);

    const action = "Sortie de stock";
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        setUsername(storedUsername);
    }, []);

    const fetchDepotByUsername = async () => {
        try {
            const response = await fetch("https://apistock.maillotsoraya-conception.com:3001/depots/select");
            const depots: Depot[] = await response.json();

            const userDepot = depots.find((depot) => depot.username_associe === username);
            setDepot(userDepot || null);
        } catch (error) {
            setError("Erreur lors de la récupération du dépôt.");
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
            return;
        }

        try {
            const response = await fetch(
                `https://apistock.maillotsoraya-conception.com:3001/stock_by_depot/select/${depot.id}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const data: { stock: string }[] = await response.json();
            const stockItems: ProductStock[] = data.flatMap((item) =>
                JSON.parse(item.stock) as ProductStock[]
            );

            setStock(stockItems);
        } catch (error) {
            setError("Erreur lors de la récupération des produits du dépôt.");
        }
    };

    useEffect(() => {
        if (depot) {
            fetchProductsByDepot();
        }
    }, [depot]);

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setFilteredStock(
            stock.filter((product) =>
                product.nom_produit.toLowerCase().includes(term.toLowerCase())
            )
        );
    };

    const handleValidateSortie = () => {
        if (!depot || products.length === 0) {
            setError("Aucun produit sélectionné ou dépôt non trouvé.");
            return;
        }
        setShowMotifModal(true);
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

    const fetchProductBySku = () => {
        const product = stock.find((p) => p.sku === sku);
        if (product) {
            addProduct(product);
            setError("");
        } else {
            setError("Aucun produit trouvé pour ce SKU dans le dépôt.");
        }
        setSku(""); // Réinitialise le champ SKU
    };

    const updateQuantity = (index: number, newQuantity: number) => {
        setProducts((prevProducts) =>
            prevProducts.map((product, i) =>
                i === index ? { ...product, quantity: newQuantity } : product
            )
        );
        setEditingQuantityIndex(null);
    };

    const deleteProduct = (sku: string) => {
        setProducts(products.filter((product) => product.sku !== sku));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (sku.trim() !== "") {
            fetchProductBySku();
        }
    };

    const handleConfirmSortie = async () => {
        if (!selectedMotif) {
            setError("Veuillez sélectionner un motif avant de confirmer la sortie.");
            return;
        }

        try {
            for (const product of products) {
                const response = await fetch(`https://apistock.maillotsoraya-conception.com:3001/stock_by_depot/update/${depot?.id}`, {
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

            // Log

            alert("Sortie validée avec succès.");
            setProducts([]);
            setSku("");
            setShowMotifModal(false);

        } catch (error) {
            setError("Une erreur est survenue lors de la validation des sorties.");
        }
    };

    return (
        <div className="flex min-h-screen justify-center">
            <Layout>
                <div className="p-8 w-full max-w-5xl">
                    <div className="text-center flex mt-20">
                        <h1 className="font-bold text-3xl">Sorties</h1>
                    </div>

                    {/* Aligner les deux champs d'entrée */}
                    <div className="flex flex-col md:flex-row mt-10 space-y-4 md:space-y-0 md:space-x-4">
                        <div className="flex-grow">
                            <form onSubmit={handleSubmit}>
                                <input
                                    className="border border-gray-300 rounded-lg focus:outline-none focus:border-black transition p-2 w-full"
                                    type="text"
                                    placeholder="Saisir le SKU du produit"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    required
                                />
                            </form>
                        </div>

                        <div className="flex-grow">
                            <input
                                className="border border-gray-300 rounded-lg p-2 w-96"
                                type="text"
                                placeholder="Rechercher un produit par nom"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Liste déroulante des produits filtrés */}
                    {searchTerm && (
                        <div className="mt-4 bg-white p-4 rounded shadow">
                            {filteredStock.length > 0 ? (
                                filteredStock.map((product: ProductStock) => (
                                    <div
                                        key={product.sku}
                                        className="flex justify-between items-center border-b py-2"
                                    >
                                        <p>{product.nom_produit}</p>
                                        <ButtonClassique onClick={() => addProduct(product)} className='font-medium'>Ajouter</ButtonClassique>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">Aucun produit trouvé</p>
                            )}
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
                                    products.map((product, index) => (
                                        <tr key={product.sku} className="border-t">
                                            <td className="py-2 px-4">{product.name}</td>
                                            <td className="py-2 px-4">{product.sku}</td>
                                            <td
                                                className="py-2 px-4 cursor-pointer"
                                                onDoubleClick={() => setEditingQuantityIndex(index)}
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
                            className="bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-700 transition-all"
                            onClick={handleValidateSortie}
                        >
                            Valider la sortie
                        </button>
                    </div>

                    {showMotifModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
                            <div className="bg-white p-8 rounded-lg shadow-lg relative max-w-lg w-full">
                                {/* Bouton pour fermer le modal */}
                                <Image
                                    alt="Fermer"
                                    src="/close-icon.svg"
                                    width={24}
                                    height={24}
                                    className="absolute top-3 right-3 cursor-pointer"
                                    onClick={() => setShowMotifModal(false)}
                                />

                                <h2 className="text-xl font-bold mb-6">Sélectionnez le motif de la sortie</h2>

                                <select
                                    value={selectedMotif || ""}
                                    onChange={(e) => setSelectedMotif(e.target.value)}
                                    className="border border-gray-300 rounded-lg p-2 w-full mb-4"
                                >
                                    <option value="" disabled>
                                        Choisissez un motif
                                    </option>
                                    <option value="Vente">Vente</option>
                                    <option value="Erreur">Erreur</option>
                                    <option value="Perte">Perte</option>
                                </select>

                                <div className="flex justify-end mt-5">
                                    <button
                                        className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-700 transition-all"
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
