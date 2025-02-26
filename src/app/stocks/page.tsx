'use client';

import Layout from "@/app/components/Layout";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import PopupNotif from "../components/PopUpNotif";

interface StockProps {
    id: number;
    name: string;
    username_associe: string;
    notif: string;
}

export default function Stock() {

    const [role, setRole] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [dataUsernames, setDataUsernames] = useState<StockProps[]>([]);
    const [showNotification, setShowNotification] = useState<boolean>(false);

    // Vérifier le rôle dans le localStorage
    useEffect(() => {
        const storedRole = localStorage.getItem('role');
        setRole(storedRole);
    }, []);

    useEffect(() => {
        const user = localStorage.getItem('username');
        setUsername(user);
    }, []);

    useEffect(() => {
        const CheckNotif = async (user: string) => {
            const response = await fetch(`https://apistock.maillotsoraya-conception.com:3001/depots/select/byuser/${user}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setDataUsernames(data);
        };

        if (username) {
            CheckNotif(username);
        }
    }, [username]);

    // Vérifier si une notification doit être affichée
    useEffect(() => {
        console.log(dataUsernames);
        const hasNotif = dataUsernames.some(item => item.notif === "1");
        setShowNotification(hasNotif);
    }, [dataUsernames]);


    return (
        <div className="flex min-h-screen justify-center">
            <Layout>
                {showNotification && (
                    <PopupNotif/>
                )}
                <div className="p-8 w-full mt-20">
                    {/* Titre de la page */}
                    <div className="flex">
                        <h1 className="font-bold text-3xl">Stocks</h1>
                    </div>

                    <div className="mt-10 flex justify-center">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {role !== 'vendeuse' && (
                                <Link href={role === 'responsable' ? "/transfert/responsable" : "/transfert/admin"}>
                                    <div className="bg-color-white-soraya p-4 w-full rounded-md cursor-pointer">
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
                                    <div className="bg-color-white-soraya p-4 w-full rounded-md cursor-pointer">
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
                                    <div className="bg-color-white-soraya p-4 w-full rounded-md cursor-pointer">
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
                                <div className="bg-color-white-soraya p-4 w-full rounded-md cursor-pointer">
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

                            <Link
                                href={
                                    role === 'responsable'
                                        ? "/listes_des_stocks/responsable"
                                        : role === 'admin'
                                            ? "/listes_des_stocks/admin"
                                            : "/listes_des_stocks/vendeuse"
                                }>
                                <div className="bg-color-white-soraya p-4 w-full rounded-md cursor-pointer">
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
            </Layout>
        </div>
    );
}
