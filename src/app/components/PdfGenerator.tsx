import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Product {
    name: string;
    sku: string;
    quantity: number;
}

interface PdfGeneratorProps {
    products: Product[];
    motif: string;
    action: string;
    depotName: string;
    logoUrl: string;
}

// Fonction pour convertir une image en Base64
const getImageBase64 = (url: string): Promise<string> => {
    return fetch(url)
        .then(response => response.blob())
        .then(
            blob =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
        );
};

export const generatePDF = async (products: Product[], action: string, motif: string, depotName: string, logoUrl: string) => {
    const doc = new jsPDF();

    try {
        // Charger l'image sous forme de Base64
        const logoBase64 = await getImageBase64(logoUrl);

        // Ajouter l'image dans le PDF
        doc.addImage(logoBase64, 'PNG', 50, 5, 100, 55); // Position et taille

        // Réduire la taille de la police pour le titre, motif et dépôt
        doc.setFontSize(12); // Taille de la police du titre
        doc.text(action, 14, 60);

        doc.setFontSize(10); // Taille de la police pour le motif et le dépôt
        doc.text(`Motif: ${motif}`, 14, 68);
        doc.text(`Dépôt: ${depotName}`, 14, 76);

        // Générer le tableau avec autoTable et personnaliser le style de l'en-tête
        (doc as any).autoTable({
            startY: 90,
            head: [['Nom du produit', 'SKU', 'Quantité']],
            body: products.map(product => [
                product.name,
                product.sku,
                product.quantity.toString(),
            ]),
            headStyles: {
                fillColor: [207, 189, 140], // Couleur de fond
                textColor: [0, 0, 0], // Couleur du texte
                fontStyle: 'bold', // Style de texte
                halign: 'center', // Alignement horizontal
            },
        });

        // Sauvegarder et télécharger le PDF
        doc.save(`sortie-de-stock-${motif}.pdf`);
    } catch (error) {
        console.error("Erreur lors du chargement de l'image", error);
    }
};
