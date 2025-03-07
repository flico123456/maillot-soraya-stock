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
    logoUrl: string // URL du logo
) => {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // Format A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // ✅ Obtenir la date actuelle (format JJ/MM/AAAA)
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR');

    // 📌 Ajouter la date en haut à droite du PDF
    page.setFont(font);
    page.setFontSize(12);
    page.drawText(`Date : ${formattedDate}`, { 
        x: width - 120, // Position en haut à droite
        y: height - 40, 
        color: rgb(0, 0, 0)
    });

    // ✅ Vérifier si une URL de logo a été fournie et l'ajouter au PDF
    let logoDims = { width: 0, height: 0 };
    if (logoUrl && logoUrl.startsWith("http")) {
        try {
            const response = await fetch(logoUrl);
            if (!response.ok) throw new Error(`Échec du téléchargement du logo (${response.status})`);

            const logoBytes = await response.arrayBuffer();
            let logoImage;
            if (logoUrl.endsWith('.png')) {
                logoImage = await pdfDoc.embedPng(logoBytes);
            } else if (logoUrl.endsWith('.jpg') || logoUrl.endsWith('.jpeg')) {
                logoImage = await pdfDoc.embedJpg(logoBytes);
            } else {
                throw new Error("Format d'image non supporté (utiliser PNG ou JPG)");
            }

            logoDims = logoImage.scale(0.1); // Réduire la taille du logo
            page.drawImage(logoImage, {
                x: width / 2 - logoDims.width / 2,
                y: height - 120, // Remonter le logo
                width: logoDims.width,
                height: logoDims.height,
            });

        } catch (error) {
            console.error("❌ Erreur lors du chargement du logo :", error);
        }
    }

    // ✅ Ajouter les informations de la commande
    page.setFontSize(14);
    page.drawText(`Action : ${action}`, { x: 50, y: height - 150, color: rgb(0, 0, 0) });
    page.setFontSize(12);
    page.drawText(`Motif : ${motif}`, { x: 50, y: height - 170, color: rgb(0, 0, 0) });
    page.drawText(`Dépôt : ${depotName}`, { x: 50, y: height - 190, color: rgb(0, 0, 0) });

    // ✅ Ajouter le tableau des produits
    let yPosition = height - 230;
    const margin = 50;
    const rowHeight = 20;
    const headerHeight = 30;

    const addTableHeader = () => {
        page.drawRectangle({
            x: margin,
            y: yPosition - headerHeight,
            width: width - 2 * margin,
            height: headerHeight,
            color: rgb(0, 0, 0),
        });

        page.setFontSize(10);
        page.drawText('Nom du produit', { x: margin + 10, y: yPosition - 15, color: rgb(1, 1, 1) });
        page.drawText('SKU', { x: margin + 210, y: yPosition - 15, color: rgb(1, 1, 1) });
        page.drawText('Quantité', { x: margin + 410, y: yPosition - 15, color: rgb(1, 1, 1) });

        yPosition -= headerHeight + rowHeight;
    };

    addTableHeader();

    for (const product of products) {
        if (yPosition < margin) {
            page = pdfDoc.addPage([595.28, 841.89]);
            yPosition = height - margin;
            addTableHeader();
        }

        page.drawText(product.name, { x: margin + 10, y: yPosition, color: rgb(0, 0, 0) });
        page.drawText(product.sku, { x: margin + 210, y: yPosition, color: rgb(0, 0, 0) });
        page.drawText(product.quantity.toString(), { x: margin + 410, y: yPosition, color: rgb(0, 0, 0) });
        yPosition -= rowHeight;
    }

    // ✅ Ajouter la ligne du total
    if (yPosition < margin) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - margin;
    }

    yPosition -= 10;
    page.drawRectangle({
        x: margin,
        y: yPosition - 20,
        width: width - 2 * margin,
        height: 20,
        color: rgb(0.9, 0.9, 0.9),
    });

    const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
    page.drawText('Total', { x: margin + 10, y: yPosition - 10, color: rgb(0, 0, 0) });
    page.drawText(totalQuantity.toString(), { x: margin + 410, y: yPosition - 10, color: rgb(0, 0, 0) });

    // ✅ Génération et téléchargement du PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${action}-${motif}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
};
