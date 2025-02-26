'use client';

import React, { useState } from "react";
import { useEffect } from "react";

export default function PopupNotif() {

    const [visible, setVisible] = useState(true);
    const [username, setUsername] = useState<string | null>(null);

        useEffect(() => {
            const user = localStorage.getItem('username');
            setUsername(user);
        }, []);

    const handleValide = async () => {
        await fetch(`https://apistock.maillotsoraya-conception.com:3001/depots/update/${username}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                notif: "0"
            }),
        });
    };

    return (
        <div>
            {visible && (
                <div className="fixed top-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-black bg-opacity-50">
                    <div className="relative bg-white p-10 rounded-md max-sm:mx-4 max-sm:p-6 max-sm:w-[90%]">
                        <div className="flex justify-center">
                            <h1 className="text-xl font-bold">Vous avez reçu du stock !</h1>
                        </div>
                        <div className="mt-2 w-96 flex justify-center">
                            <p className="text-center">Vous devez verifier la réception de votre stock que vous avez reçu.</p>
                        </div>
                        <div className='flex justify-center'>
                            <button className='font-inter text-base p-2 max-sm:mt-10 mt-10 font-bold border rounded-lg w-48 text-white bg-black cursor-pointer hover:bg-color-black-soraya'
                                onClick={() => {
                                    setVisible(false);
                                    handleValide()
                                }}>
                                Valider
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
