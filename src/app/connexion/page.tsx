"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  name: string;
}

interface TokenResponse {
  token: string;
}

export default function Authentification() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const checkUserRole = async (username: string, token: string): Promise<string> => {
    let role = '';

    try {
      const adminResponse = await fetch(
        'https://maillotsoraya-conception.com/wp-json/wp/v2/users?roles=admin_stock',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const adminData: User[] = await adminResponse.json();
      const isAdmin = adminData.some((user) => user.name === username);

      if (isAdmin) {
        role = 'admin';
      } else {
        const vendeuseResponse = await fetch(
          'https://maillotsoraya-conception.com/wp-json/wp/v2/users?roles=vendeuse',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const vendeuseData: User[] = await vendeuseResponse.json();
        const isVendeuse = vendeuseData.some((user) => user.name === username);

        if (isVendeuse) {
          role = 'vendeuse';
        } else {
          const responsableResponse = await fetch(
            'https://maillotsoraya-conception.com/wp-json/wp/v2/users?roles=responsable',
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          const responsableData: User[] = await responsableResponse.json();
          const isResponsable = responsableData.some((user) => user.name === username);

          if (isResponsable) {
            role = 'responsable';
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du rôle:", error);
    }

    return role;
  };

  const handleSubmitConnexion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch(
        'https://maillotsoraya-conception.com/wp-json/jwt-auth/v1/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: email,
            password: password,
          }),
        }
      );

      if (response.ok) {
        const data: TokenResponse = await response.json();
        localStorage.setItem('token', data.token);

        const userResponse = await fetch(
          'https://maillotsoraya-conception.com/wp-json/wp/v2/users/me',
          {
            headers: {
              'Authorization': `Bearer ${data.token}`,
            },
          }
        );

        const userData: User = await userResponse.json();

        if (userData.name) {
          localStorage.setItem('username', userData.name);

          const userRole = await checkUserRole(userData.name, data.token);
          if (userRole) {
            localStorage.setItem('role', userRole);
            console.log(`Connecté en tant que ${userRole}`);
          } else {
            console.log('Aucun rôle trouvé pour cet utilisateur.');
          }
        }

        router.push('/stocks');
      } else {
        setErrorMessage('Adresse e-mail ou mot de passe incorrect.');
      }
    } catch (error) {
      setErrorMessage('Une erreur est survenue, veuillez réessayer.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div>
        <div className="flex flex-col items-center justify-center">
          <div className="mb-5">
            <div className="flex justify-center">
              <Image src="/logo-soraya.png" alt="logo" width={500} height={500} />
            </div>
          </div>
          <div className="flex justify-center">
            <form onSubmit={handleSubmitConnexion} className="max-w-sm mx-auto">
              <div className="mb-4">
                <label htmlFor="email" className="block">
                  Identifiant
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-inter text-sm p-2 mt-1 font-bold border rounded-lg bg-color-white-soraya w-80 pl-2"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block">
                  Mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-inter text-sm p-2 mt-1 font-bold border rounded-lg bg-color-white-soraya w-80 pl-2"
                  required
                />
              </div>
              {errorMessage && <p className="text-red-500">{errorMessage}</p>}
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="font-inter text-sm p-2 font-bold border rounded-lg border-slate-500 w-80 text-white bg-black cursor-pointer hover:bg-color-black-soraya"
                >
                  Connexion
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
