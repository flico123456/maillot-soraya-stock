import { useState } from 'react';
import Image from 'next/image';

interface ButtonDeleteDepotProps {
    onDepotDeleted: () => void; // Propriété pour notifier le parent
}

const ButtonDeleteDepot: React.FC<ButtonDeleteDepotProps> = ({ onDepotDeleted }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [depotId, setDepotId] = useState(''); // Pour stocker l'ID du dépôt

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Vérifier que l'ID est fourni
        if (!depotId) {
            console.error("L'ID du dépôt est requis pour la suppression.");
            return;
        }

        const response = await fetch(`http://localhost:3001/depots/delete/${depotId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Erreur lors de la suppression du dépôt :', response.statusText);
            return;
        }

        const data = await response.json();
        console.log('Dépôt supprimé avec succès :', data);

        // Notifier le parent que le dépôt a été supprimé
        onDepotDeleted();

        // Fermer la modale après la soumission réussie
        closeModal();
    };

    return (
        <div className="flex justify-center">
            <button
                onClick={openModal}
                className="bg-white text-black w-64 p-2 shadow-md rounded-md transition-all duration-300 transform-gpu hover:scale-110 cursor-pointer"
            >
                Supprimer un dépôt
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
                            <h2 className="text-2xl font-semibold mb-6 text-center">Supprimer un dépôt</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Champ pour l'ID du dépôt */}
                                <div>
                                    <label htmlFor="depotId" className="block text-gray-700 mb-1 font-medium">
                                        ID du dépôt
                                    </label>
                                    <input
                                        type="text"
                                        id="depotId"
                                        value={depotId}
                                        onChange={(e) => setDepotId(e.target.value)}
                                        className="w-full p-1 border border-gray-300 rounded-full focus:outline-none focus:border-black  transition"
                                        required
                                    />
                                </div>

                                <div className="text-center">
                                    <button
                                        type="submit"
                                        className="mt-5 w-full bg-black text-white p-2 rounded-full font-bold hover:bg-white hover:text-black hover:border-black border transition-all duration-300"
                                    >
                                        Supprimer
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

export default ButtonDeleteDepot;
