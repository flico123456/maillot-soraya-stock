"use client";

import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import Image from "next/image"; // Import de Next.js Image

interface ProductEntry {
    name: string;
    sku: string;
    quantity: number;
}

interface Depot {
    id: number;
    name: string;
}

const SAINT_CANNAT_ID = 1; // ID de Saint-Cannat

export default function Reception() {
    const [sku, setSku] = useState(""); // État pour stocker le SKU saisi
    const [products, setProducts] = useState<ProductEntry[]>([]); // État pour stocker la liste des produits ajoutés
    const [depots, setDepots] = useState<Depot[]>([]); // État pour stocker la liste des dépôts
    const [selectedDepotId, setSelectedDepotId] = useState<number | null>(null); // État pour stocker l'ID du dépôt sélectionné
    const [showConfirmation, setShowConfirmation] = useState(false); // État pour gérer l'affichage de la boîte de dialogue de confirmation
    const [editingQuantityIndex, setEditingQuantityIndex] = useState<number | null>(null); // Index pour la modification de la quantité

    // Fonction pour récupérer la liste des dépôts
    const fetchDepots = async () => {
        try {
            const response = await fetch('http://localhost:3001/depots/select');
            const data = await response.json();
            setDepots(data);
            if (data.length > 0) {
                setSelectedDepotId(data[0].id); // Par défaut, on sélectionne le premier dépôt
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des dépôts', error);
        }
    };

    useEffect(() => {
        fetchDepots(); // Récupérer la liste des dépôts au chargement de la page
    }, []);

    // Fonction pour récupérer le produit en fonction du SKU
    const fetchProductBySku = async () => {

        try {
            const response = await fetch(`https://maillotsoraya-conception.com/wp-json/wc/v3/products?sku=${sku}`, {
                headers: {
                    Authorization: "Basic " + btoa("ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"),
                },
            });

            const data = await response.json();

            if (data.length === 0) {

            } else {
                const productData = data[0];
                const existingProduct = products.find((p) => p.sku === productData.sku);

                if (existingProduct) {
                    // Si le produit existe déjà dans la liste, on augmente sa quantité
                    setProducts((prevProducts) =>
                        prevProducts.map((p) =>
                            p.sku === productData.sku ? { ...p, quantity: p.quantity + 1 } : p
                        )
                    );
                } else {
                    // Sinon, on l'ajoute avec une quantité de 1
                    setProducts((prevProducts) => [
                        ...prevProducts,
                        { name: productData.name, sku: productData.sku, quantity: 1 },
                    ]);
                }
            }
        } catch (error) {
            //setError("Erreur lors de la récupération du produit.");
        } finally {
        }
    };

    // Fonction pour envoyer les produits au serveur pour insertion dans la base de données
    const sendProductsToDepot = async () => {
        if (!selectedDepotId) {
            //setError("Veuillez sélectionner un dépôt.");
            return;
        }

        try {
            if (selectedDepotId === SAINT_CANNAT_ID) {
                // Mise à jour pour Saint-Cannat via WooCommerce
                for (const product of products) {
                    const response = await fetch(`https://maillotsoraya-conception.com/wp-json/wc/v3/products?sku=${product.sku}`, {
                        headers: {
                            Authorization: "Basic " + btoa("ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"),
                        },
                    });
                    const data = await response.json();
                    if (data.length === 0) {
                        //setError(`Produit avec SKU ${product.sku} non trouvé.`);
                        continue;
                    }
                    const productId = data[0].id;
                    const parentProductId = data[0].parent_id;
                    const currentStock = data[0].stock_quantity;
                    const newStock = currentStock + product.quantity;

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
                }
                alert('Réception validée et produits mis à jour avec succès sur Saint-Cannat');
            } else {
                // Vérification et mise à jour/création pour les autres dépôts
                for (const product of products) {
                    // Vérifier si le dépôt a déjà un stock
                    const selectResponse = await fetch(`http://localhost:3001/stock_by_depot/select/${selectedDepotId}`);

                    if (selectResponse.status === 404) {
                        // Si le stock pour ce dépôt n'existe pas, on le crée
                        await fetch(`http://localhost:3001/stock_by_depot/create`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                depot_id: selectedDepotId,
                                stock: [{
                                    nom_produit: product.name,
                                    sku: product.sku,
                                    quantite: product.quantity,
                                }],
                            }),
                        });
                    } else {
                        // Si le stock existe, on met à jour le produit
                        await fetch(`http://localhost:3001/stock_by_depot/update/${selectedDepotId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                sku: product.sku,
                                quantite: product.quantity,
                                nom_produit: product.name,
                            }),
                        });
                    }
                }
                alert('Réception validée et produits mis à jour avec succès');
            }

            setProducts([]); // Réinitialiser la liste des produits
            setSku(""); // Réinitialiser le champ SKU
        } catch (error) {
            console.error('Erreur lors de l\'envoi des produits', error);
            //setError('Une erreur est survenue lors de l\'insertion des produits.');
        }
    };

    // Fonction pour supprimer un produit de la liste
    const deleteProduct = (sku: string) => {
        setProducts(products.filter((product) => product.sku !== sku));
    };

    // Fonction pour gérer la modification de la quantité en double cliquant
    const handleQuantityEdit = (index: number) => {
        setEditingQuantityIndex(index); // Met à jour l'index de la ligne en cours d'édition
    };

    // Fonction pour mettre à jour la quantité
    const updateQuantity = (index: number, newQuantity: number) => {
        setProducts((prevProducts) =>
            prevProducts.map((product, i) =>
                i === index ? { ...product, quantity: newQuantity } : product
            )
        );
        setEditingQuantityIndex(null); // Quitter le mode édition
    };

    // Gestion de la soumission du formulaire
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

    // Fonction pour gérer l'ouverture de la boîte de dialogue de confirmation
    const openConfirmationDialog = () => {
        setShowConfirmation(true); // Affiche la boîte de dialogue
    };

    // Fonction pour fermer la boîte de dialogue sans valider
    const closeConfirmationDialog = () => {
        setShowConfirmation(false); // Ferme la boîte de dialogue
    };

    // Fonction pour confirmer la réception
    const confirmReception = () => {
        sendProductsToDepot(); // Envoie les produits au serveur
        setShowConfirmation(false); // Ferme la boîte de dialogue après confirmation
    };

    return (
        <div className="flex min-h-screen bg-gray-200">
            <Layout>
                <div className="ml-64 p-8 w-full">
                    {/* Titre de la page */}
                    <div className="mt-10 ml-10">
                        <h1 className="font-bold text-3xl">Réceptions</h1>
                    </div>

                    <div className="flex">
                        {/* Formulaire pour entrer le SKU */}
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

                    {/* Affichage du tableau des produits ajoutés, même si vide */}
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
                                                        onBlur={() => setEditingQuantityIndex(null)} // Quitter le mode édition quand on clique en dehors
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

                    {/* Bouton Valider la réception en bas à droite */}
                    <div className="flex justify-end mt-10">
                        <button
                            className="bg-black text-white p-3 rounded-full font-bold hover:bg-white hover:text-black hover:border-black border transition-all duration-300"
                            onClick={openConfirmationDialog} // Ouvrir la boîte de dialogue
                        >
                            Valider la réception
                        </button>
                    </div>

                    {/* Modal de confirmation avec sélection du dépôt */}
                    {showConfirmation && (
                        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg relative">
                                {/* Croix pour fermer la boîte de dialogue */}
                                <Image
                                    alt="img-close"
                                    src="/close-icon.svg"
                                    width={32}
                                    height={32}
                                    className="absolute top-3 right-3 cursor-pointer"
                                    onClick={closeConfirmationDialog} // Fermer la boîte de dialogue
                                />
                                <h2 className="text-xl font-bold mb-4">Confirmation de la réception</h2>
                                <p>Sélectionnez un dépôt avant de confirmer la réception :</p>

                                {/* Sélection du dépôt dans le modal */}
                                <div className="mt-4">
                                    <label htmlFor="depot-select" className="font-bold">Sélectionner un dépôt :</label>
                                    <select
                                        id="depot-select"
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

                                <div className="mt-4 flex justify-end">
                                    <button
                                        className="bg-green-500 text-white p-2 rounded-md"
                                        onClick={confirmReception}
                                    >
                                        Confirmer
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