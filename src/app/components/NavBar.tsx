"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component from the appropriate library
import UserDisplay from './UserIcon';

const VerticalNavbar = () => {
    const [role, setRole] = useState<string | null>(null);

    // Vérifier le rôle dans le localStorage
    useEffect(() => {
        const storedRole = localStorage.getItem('role');
        setRole(storedRole);
    }, []);

    return (
        <div>
            <nav className="fixed top-0 left-0 h-full w-64 bg-color-soraya-2 text-white flex flex-col justify-between">
                <div>
                    <div>
                        <Image src="/logo-soraya.png" alt="logo" width={500} height={500} />
                    </div>
                    <div className="flex justify-center">
                        <div className="flex justify-center w-48 h-0.5 bg-white"></div>
                    </div>
                    <div className='mt-10'>
                        <ul className="space-y-4">
                            <li className='ml-8'>
                                <Link href="/stocks" passHref>
                                    <div className='flex w-48'>
                                        <Image src="/stock-icon.png" alt="icon-stock" width={30} height={30} />
                                        <h1 className='text-black ml-3 mt-1'>Gestion de stock</h1>
                                    </div>
                                </Link>
                            </li>
                            {/* Masquer la gestion des dépôts si l'utilisateur est une vendeuse */}
                            {role !== 'vendeuse' && role !== 'responsable' && (
                                <li className='ml-8'>
                                    <Link href="/depots" passHref>
                                        <div className='flex w-48 mt-10'>
                                            <Image src="/depot.png" alt="depot" width={30} height={30} />
                                            <h1 className='text-black ml-3 mt-1'>Gestion dépôts</h1>
                                        </div>
                                    </Link>
                                </li>
                            )}
                            {/* Masquer la gestion des dépôts si l'utilisateur est une vendeuse */}
                            {role !== 'vendeuse' && role !== 'responsable' && (
                                <li className='ml-8'>
                                    <Link href="/logs" passHref>
                                        <div className='flex w-48 mt-10'>
                                            <Image src="/log.png" alt="depot" width={30} height={30} />
                                            <h1 className='text-black ml-3 mt-1'>Logs</h1>
                                        </div>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
                <UserDisplay />
            </nav>
        </div>
    );
};

export default VerticalNavbar;
