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

    // Ajouter un tableau des produits avec une entête noire
    let yPosition = height - 230;

    // Dessiner un fond noir pour l'entête
    const headerHeight = 20;
    page.drawRectangle({
        x: 50,
        y: yPosition - headerHeight,
        width: width - 100,
        height: headerHeight,
        color: rgb(0, 0, 0),
    });

    // Ajouter le texte de l'entête en blanc
    page.setFontSize(10);
    page.drawText('Nom du produit', { x: 60, y: yPosition - 15, color: rgb(1, 1, 1) });
    page.drawText('SKU', { x: 260, y: yPosition - 15, color: rgb(1, 1, 1) });
    page.drawText('Quantité', { x: 460, y: yPosition - 15, color: rgb(1, 1, 1) });

    yPosition -= 30;

    // Calculer le total des quantités
    const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);

    // Ajouter les lignes du tableau
    products.forEach((product) => {
        page.drawText(product.name, { x: 60, y: yPosition, color: rgb(0, 0, 0) });
        page.drawText(product.sku, { x: 260, y: yPosition, color: rgb(0, 0, 0) });
        page.drawText(product.quantity.toString(), { x: 460, y: yPosition, color: rgb(0, 0, 0) });
        yPosition -= 20;
    });

    // Ajouter une ligne pour le total
    yPosition -= 10; // Espacement avant la ligne de total
    page.drawRectangle({
        x: 50,
        y: yPosition - 20,
        width: width - 100,
        height: 20,
        color: rgb(0.9, 0.9, 0.9), // Fond gris clair
    });
    page.drawText('Total', { x: 60, y: yPosition - 10, color: rgb(0, 0, 0) });
    page.drawText('', { x: 260, y: yPosition - 10, color: rgb(0, 0, 0) }); // Cellule vide pour le SKU
    page.drawText(totalQuantity.toString(), { x: 460, y: yPosition - 10, color: rgb(0, 0, 0) });

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
