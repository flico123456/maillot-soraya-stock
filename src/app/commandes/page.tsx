'use client';

import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import Image from "next/image";
import { generatePDFWithPdfLib } from "@/app/components/PdfGenerator";

interface PropsCommandes {
  id: string;
  status: string;
  date_created: string;
  customer_note: string;
  billing: { first_name: string, last_name: string };
  line_items: ProductEntry[];
}

interface ProductEntry {
  name: string;
  quantity: number;
  sku: string;
}

export default function Commandes() {

  const [commandes, setCommandes] = useState<PropsCommandes[]>([]);

  const fetchCommandes = async () => {
    const response = await fetch("https://maillotsoraya-conception.com/wp-json/wc/v3/orders?per_page=100", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa("ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"),
      },
    });
    const data = await response.json();
    const completedOrders = Array.isArray(data) ? data.filter(order => order.status === "completed") : [];
    setCommandes(completedOrders);
  };

  useEffect(() => {
    fetchCommandes();
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit" 
    }).replace(",", "");
  };

  const handleValidateOrder = async (id: string): Promise<void> => {
    const response = await fetch(`https://maillotsoraya-conception.com/wp-json/wc/v3/orders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa("ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"),
      },
      body: JSON.stringify({
        customer_note: "valider",
      }),
    });
  
    if (response.status === 200) {
      const orderResponse = await fetch(`https://maillotsoraya-conception.com/wp-json/wc/v3/orders/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("ck_2a1fa890ddee2ebc1568c314734f51055eae2cba:cs_0ad45ea3da9765643738c94224a1fc58cbf341a7"),
        },
      });
  
      if (orderResponse.ok) {
        const orderData: PropsCommandes = await orderResponse.json();
  
        // Transformation des produits pour inclure le SKU
        const formattedProducts = orderData.line_items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          sku: item?.sku || "N/A" // Ajout du SKU s'il existe, sinon "N/A"
        }));
  
        // Génération du PDF avec les produits de la commande
        generatePDFWithPdfLib(
          formattedProducts, // Liste des produits transformée
          `Sortie de stock`,
          `Vente internet - ${orderData.billing.first_name} ${orderData.billing.last_name}`,
          `Saint Cannat`,
          "https://i.postimg.cc/fRF4QnS8/Soraya-Logo-Exe-Validee-noir-et-or-recadr.jpg"
        );
      }
  
      // Mettre à jour la liste des commandes
      fetchCommandes();
    }
  };
  
  
  return (
    <div className="flex min-h-screen justify-center">
      <Layout>
        <div className="p-8 w-full max-w-5xl">
          <div className="text-center flex mt-20">
            <h1 className="font-bold text-3xl">Commandes</h1>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex flex-col w-full max-w-5xl">
            <div className="flex justify-center">
              <table className="w-full bg-white rounded-lg overflow-hidden shadow-lg mt-5">
                <thead>
                  <tr>
                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">ID</th>
                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Date</th>
                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Prénom</th>
                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Nom</th>
                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Status</th>
                    <th className="py-2 px-4 bg-black text-left text-sm font-bold text-white">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {commandes.map((commande) => (
                    <tr key={commande.id}>
                      <td className="py-2 px-4">{commande.id}</td>
                      <td className="py-2 px-4">{formatDate(commande.date_created)}</td>
                      <td className="py-2 px-4">{commande.billing.first_name}</td>
                      <td className="py-2 px-4">{commande.billing.last_name}</td>
                      <td className="py-2 px-4">{commande.status === "completed" ? "Terminé" : commande.status}</td>
                      <td className="py-2 px-4 flex justify-center">
                        {commande.customer_note === "" ? <button className="w-full bg-black text-white p-2 rounded-lg hover:bg-color-black-soraya" onClick={() => handleValidateOrder(commande.id)}>Validé</button> : <Image className="" src="/valider.png" alt="check" width={20} height={20} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
}