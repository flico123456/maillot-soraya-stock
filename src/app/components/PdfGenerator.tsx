'use client';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Product {
    name: string;
    sku: string;
    quantity: number;
}

export const generatePDFWithPdfLib = async (
    products: Product[],
    action: string,
    motif: string,
    depotName: string,
    logoUrl: string
) => {
    // Créer un nouveau document PDF
    const pdfDoc = await PDFDocument.create();

    // Ajouter une page au document
    const page = pdfDoc.addPage([595.28, 841.89]); // Format A4
    const { width, height } = page.getSize();

    // Charger la police Helvetica standard
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Charger le logo en tant qu'image
    let logoDims = { width: 0, height: 0 };
    if (logoUrl) {
        try {
            const logoBytes = await fetch(logoUrl).then((res) => res.arrayBuffer());
            const logoImage = await pdfDoc.embedPng(logoBytes);
            logoDims = logoImage.scale(0.5);

            // Dessiner le logo
            page.drawImage(logoImage, {
                x: width / 2 - logoDims.width / 2,
                y: height - 100,
                width: logoDims.width,
                height: logoDims.height,
            });
        } catch (error) {
            console.error('Erreur lors du chargement du logo :', error);
        }
    }

    // Ajouter l'action, le motif, et le dépôt
    page.setFont(font);
    page.setFontSize(14);
    page.drawText(`Action : ${action}`, { x: 50, y: height - 150, color: rgb(0, 0, 0) });
    page.setFontSize(12);
    page.drawText(`Motif : ${motif}`, { x: 50, y: height - 170, color: rgb(0, 0, 0) });
    page.drawText(`Dépôt : ${depotName}`, { x: 50, y: height - 190, color: rgb(0, 0, 0) });

    // Ajouter un tableau des produits
    let yPosition = height - 230;
    page.setFontSize(10);
    page.drawText('Nom du produit', { x: 50, y: yPosition, color: rgb(0, 0, 0) });
    page.drawText('SKU', { x: 250, y: yPosition, color: rgb(0, 0, 0) });
    page.drawText('Quantité', { x: 450, y: yPosition, color: rgb(0, 0, 0) });

    yPosition -= 20;

    products.forEach((product) => {
        page.drawText(product.name, { x: 50, y: yPosition, color: rgb(0, 0, 0) });
        page.drawText(product.sku, { x: 250, y: yPosition, color: rgb(0, 0, 0) });
        page.drawText(product.quantity.toString(), { x: 450, y: yPosition, color: rgb(0, 0, 0) });
        yPosition -= 20;
    });

    // Sauvegarder le document PDF
    const pdfBytes = await pdfDoc.save();

    // Télécharger le fichier PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sortie-de-stock-${motif}.pdf`;
    link.click();

    // Libérer l'URL
    URL.revokeObjectURL(url);
};
