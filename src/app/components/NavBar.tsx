"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import UserDisplay from "./UserIcon";

const VerticalNavbar = () => {
    const [role, setRole] = useState<string | null>(null);
    const [isNavOpen, setIsNavOpen] = useState(false); // État pour contrôler la visibilité de la navbar

    // Récupérer le rôle depuis le localStorage
    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        setRole(storedRole);
    }, []);

    return (
        <div>
            {/* Flou de fond et fermeture au clic */}
            {isNavOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-lg z-40"
                    onClick={() => setIsNavOpen(false)}
                ></div>
            )}

            {/* Navbar */}
            <nav
                className={`fixed top-4 left-4 h-[calc(100%-2rem)] w-[35%] max-xl:w-[92%] bg-white text-white flex flex-col justify-between rounded-lg shadow-lg z-50 transition-transform duration-300 ease-in-out ${isNavOpen ? "translate-x-0" : "-translate-x-[110%]"}`}
            >
                <div>
                    {/* Bouton Fermer en haut à gauche */}
                    <button
                        onClick={() => setIsNavOpen(false)}
                        className="absolute top-4 left-4 p-2 rounded-full focus:outline-none"
                    >
                        <Image
                            src="/close-icon.svg"
                            alt="Fermer"
                            width={30}
                            height={30}
                        />
                    </button>
                    <div className="flex justify-center mt-20">
                        <div className="flex justify-center w-96 h-0.5 bg-gris"></div>
                    </div>
                    {/* Liens de navigation */}
                    <div className="mt-10">
                        <ul className="space-y-4">
                            <li className="ml-8">
                                <Link href="/stocks" passHref>
                                    <div className="flex w-full justify-between items-center pr-4">
                                        <div className="flex items-center">
                                            <Image
                                                src="/stock-icon.png"
                                                alt="icon-stock"
                                                width={30}
                                                height={30}
                                            />
                                            <h1 className="text-black ml-3 mt-1">Gestion de stock</h1>
                                        </div>
                                        <svg
                                            className="w-5 h-5 text-gray-500"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"></path>
                                        </svg>
                                    </div>
                                </Link>
                            </li>
                            {role !== "vendeuse" && role !== "responsable" && (
                                <li className="ml-8">
                                    <Link href="/depots" passHref>
                                        <div className="flex w-full justify-between items-center mt-5 pr-4">
                                            <div className="flex items-center">
                                                <Image
                                                    src="/depot.png"
                                                    alt="depot"
                                                    width={30}
                                                    height={30}
                                                />
                                                <h1 className="text-black ml-3 mt-1">Gestion dépôts</h1>
                                            </div>
                                            <svg
                                                className="w-5 h-5 text-gray-500"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"></path>
                                            </svg>
                                        </div>
                                    </Link>
                                </li>
                            )}
                            {role !== "vendeuse" && role !== "responsable" && (
                                <li className="ml-8">
                                    <Link href="/logs" passHref>
                                        <div className="flex w-full justify-between items-center mt-5 pr-4">
                                            <div className="flex items-center">
                                                <Image
                                                    src="/log.png"
                                                    alt="logs"
                                                    width={30}
                                                    height={30}
                                                />
                                                <h1 className="text-black ml-3 mt-1">Logs</h1>
                                            </div>
                                            <svg
                                                className="w-5 h-5 text-gray-500"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"></path>
                                            </svg>
                                        </div>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>
                    <div className='flex justify-center'>
                        <Image className='mt-20' src="/couverture-burger-menu.jpg" alt='cover-burger-menu' width={400} height={400} />
                    </div>
                </div>
                {/* Affichage de l'utilisateur */}
                <UserDisplay />
            </nav>

            {/* Bouton Menu Burger */}
            {!isNavOpen && (
                <button
                    onClick={() => setIsNavOpen(true)}
                    className="fixed top-5 left-5 z-50 text-white p-3"
                >
                    <Image
                        src="/menu.png"
                        alt="Menu"
                        width={20}
                        height={20}
                    />
                </button>
            )}
        </div>
    );
};

export default VerticalNavbar;
