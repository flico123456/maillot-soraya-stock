'use client';

import Layout from "@/app/components/Layout";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Stock({ children }: { children: React.ReactNode }) {

    const [role, setRole] = useState<string | null>(null);

    // Vérifier le rôle dans le localStorage
    useEffect(() => {
        const storedRole = localStorage.getItem('role');
        setRole(storedRole);
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-200">
            <Layout>{children}</Layout>;
            <div className="ml-64 p-8 w-full">
                {/* Titre de la page */}
                <div className="mt-10 ml-10">
                    <h1 className="font-bold text-3xl">Stocks</h1>
                </div>

                <div className="mt-10 ml-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {role !== 'vendeuse' && (
                            <Link href={role === 'responsable' ? "/transfert/responsable" : "/transfert/admin"}>
                                <div className="bg-white p-4 shadow-md w-full rounded-md transition-all duration-300 transform-gpu hover:scale-110 cursor-pointer">
                                    <div className="flex">
                                        <h2 className="text-xl font-bold">Transferts</h2>
                                        <Image className="ml-3" src="/transfer.png" alt="icon-transfer" width={25} height={30} />
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="mt-2 w-full h-0.5 bg-gris"></div>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-gris">Fonction pour créer des transferts</p>
                                    </div>
                                </div>
                            </Link>

                        )}

                        {role !== 'vendeuse' && role !== 'responsable' && (
                            <Link href="/receptions">
                                <div className="bg-white p-4 shadow-md w-full rounded-md transition-all duration-300 transform-gpu hover:scale-110 cursor-pointer">
                                    <div className="flex">
                                        <h2 className="text-xl font-bold">Réceptions</h2>
                                        <Image className="ml-3" src="/enter.png" alt="icon-enter" width={25} height={30} />
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="mt-2 w-full h-0.5 bg-gris"></div>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-gris">Fonction pour créer des réceptions</p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {role && (
                            <Link
                                href={
                                    role === 'responsable'
                                        ? "/retours/responsable"
                                        : role === 'admin'
                                            ? "/retours/admin"
                                            : "/retours/vendeuse"
                                }>
                                <div className="bg-white p-4 shadow-md w-full rounded-md transition-all duration-300 transform-gpu hover:scale-110 cursor-pointer">
                                    <div className="flex">
                                        <h2 className="text-xl font-bold">Retours</h2>
                                        <Image className="ml-3" src="/return.png" alt="icon-return" width={25} height={30} />
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="mt-2 w-full h-0.5 bg-gris"></div>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-gris">Fonction pour créer des retours</p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        <Link
                            href={
                                role === 'responsable'
                                    ? "/sorties/responsable"
                                    : role === 'admin'
                                        ? "/sorties/admin"
                                        : "/sorties/vendeuse"
                            }>
                            <div className="bg-white p-4 shadow-md w-full rounded-md transition-all duration-300 transform-gpu hover:scale-110 cursor-pointer">
                                <div className="flex">
                                    <h2 className="text-xl font-bold">Sorties</h2>
                                    <Image className="ml-3" src="/logout.png" alt="icon-logout" width={25} height={30} />
                                </div>
                                <div className="flex justify-center">
                                    <div className="mt-2 w-full h-0.5 bg-gris"></div>
                                </div>
                                <div className="mt-2">
                                    <p className="text-gris">Fonction pour créer des sorties</p>
                                </div>
                            </div>
                        </Link>

                        <Link href={role === 'responsable' ? "/listes_des_stocks/responsable" : "/listes_des_stocks/admin"}>
                            <div className="bg-white p-4 shadow-md w-full rounded-md transition-all duration-300 transform-gpu hover:scale-110 cursor-pointer">
                                <div className="flex">
                                    <h2 className="text-xl font-bold">Listes des stocks</h2>
                                    <Image className="ml-3" src="/product.png" alt="icon-transfer" width={25} height={30} />
                                </div>
                                <div className="flex justify-center">
                                    <div className="mt-2 w-full h-0.5 bg-gris"></div>
                                </div>
                                <div className="mt-2">
                                    <p className="text-gris">Voir les stocks par zone en temps réel</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}