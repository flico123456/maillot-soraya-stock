"use client";

import { useState } from "react";
import Image from "next/image";
import useVendeuseUsers from "../SelectUsersByRole"; // Importer le hook qui récupère uniquement les vendeuses

interface ButtonAddDepotProps {
    onDepotAdded: () => void; // Propriété pour notifier le parent
}

interface VendeuseUser {
    id: number;
    name: string;
}

const ButtonAddDepot: React.FC<ButtonAddDepotProps> = ({ onDepotAdded }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [localisation, setLocation] = useState("");
    const [selectedUser, setSelectedUser] = useState(""); // Stocker l'utilisateur sélectionné

    // Supposons que le hook retourne seulement vendeuseUsers et loading
    const { vendeuseUsers, loading } = useVendeuseUsers(); // Utiliser uniquement les vendeuses

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch("https://apistock.maillotsoraya-conception.com:3001/depots/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                localisation: localisation,
                username_associe: selectedUser, // Inclure l'utilisateur sélectionné
            }),
        });

        if (!response.ok) {
            console.error("Erreur lors de la création du dépôt :", response.statusText);
            return;
        }

        const data = await response.json();
        console.log("Dépôt créé avec succès :", data);

        // Notifier le parent que le dépôt a été ajouté
        onDepotAdded();

        // Fermer la modale après la soumission réussie
        closeModal();
    };

    return (
        <div className="flex justify-center">
            <button
                onClick={openModal}
                className="bg-white text-black w-64 p-2 shadow-md rounded-md transition-all duration-300 transform-gpu hover:scale-110 cursor-pointer"
            >
                Ajouter un dépôt
            </button>

            {isModalOpen && (
                <>
                    <div className="fixed inset-0 bg-black opacity-50 z-40" onClick={closeModal}></div>
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full relative">
                            <Image
                                alt="img-close"
                                src="/close-icon.svg"
                                width={32}
                                height={32}
                                className="absolute top-3 right-3 cursor-pointer"
                                onClick={closeModal}
                            />
                            <h2 className="text-2xl font-semibold mb-6 text-center">Ajouter un dépôt</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-gray-700 mb-1 font-medium">
                                        Nom du dépôt
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full p-1 border border-gray-300 rounded-full focus:outline-none focus:border-black transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="location" className="block text-gray-700 mb-1 font-medium">
                                        Localisation du dépôt
                                    </label>
                                    <input
                                        type="text"
                                        id="location"
                                        value={localisation}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full p-1 border border-gray-300 rounded-full focus:outline-none focus:border-black transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="associated-user" className="block text-gray-700 mb-1 font-medium">
                                        Associer une vendeuse au dépôt
                                    </label>
                                    {loading ? (
                                        <p>Chargement des vendeuses...</p>
                                    ) : (
                                        <select
                                            id="associated-user"
                                            value={selectedUser}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                            className="w-full p-1 border border-gray-300 rounded-full focus:outline-none focus:border-black transition"
                                        >
                                            <option value="">Sélectionner une vendeuse</option>
                                            {vendeuseUsers.map((user: VendeuseUser) => (
                                                <option key={user.id} value={user.name}>
                                                    {user.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="text-center">
                                    <button
                                        type="submit"
                                        className="mt-5 w-full bg-black text-white p-2 rounded-full font-bold hover:bg-white hover:text-black hover:border-black border transition-all duration-300"
                                    >
                                        Valider
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ButtonAddDepot;
