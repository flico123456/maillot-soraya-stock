// components/Button.tsx
import React from 'react';

type ButtonProps = {
    children: React.ReactNode;   // Contenu du bouton
    onClick?: () => void;        // Fonction de clic (facultatif)
    size?: 'small' | 'medium' | 'large'; // Taille du texte
    className?: string;          // Classes supplémentaires pour la personnalisation
};

const ButtonClassique: React.FC<ButtonProps> = ({
    children,
    onClick,
    size = 'medium',
    className = '',
}) => {
    // Styles de base du texte
    const baseStyle = 'font-inter font-bold cursor-pointer focus:outline-none relative transition duration-300';

    // Styles pour l’effet de désoulignement doux avec un soulignement plus fin
    const underlineAnimation = `
        before:content-[''] before:absolute before:bottom-0 before:left-0 
        before:w-full before:h-[1px] before:bg-gray-800 before:scale-x-100 
        before:origin-left before:transition-transform before:duration-500 
        hover:before:scale-x-0
    `;

    // Styles de taille de texte
    const sizeStyles = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg',
    };

    return (
        <button
            onClick={onClick}
            className={`${baseStyle} ${underlineAnimation} ${sizeStyles[size]} ${className}`}
        >
            {children}
        </button>
    );
};

export default ButtonClassique;
