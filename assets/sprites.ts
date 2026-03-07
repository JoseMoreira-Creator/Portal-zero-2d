
import { ItemType, MobType } from '../types';

// =====================================================================================
// COMO USAR SEUS PRÓPRIOS SPRITES:
// 1. Salve sua imagem (ex: 'espada.png') na pasta 'public/sprites' que foi criada.
// 2. Altere o caminho abaixo. Ex: [ItemType.SWORD_WOOD]: '/sprites/espada.png'
// =====================================================================================

export const SPRITE_URLS: Record<string, string> = {
    // All sprites are now procedurally generated pixel art
};

// Armazena as imagens carregadas na memória
export const LOADED_SPRITES: Record<string, HTMLImageElement> = {};

// Função chamada pelo App.tsx para carregar tudo
export const loadSprites = (): Promise<void> => {
    const promises: Promise<void>[] = [];
    
    Object.entries(SPRITE_URLS).forEach(([key, url]) => {
        if (url && url.length > 0) {
            promises.push(new Promise((resolve) => {
                const img = new Image();
                
                if (url.startsWith('http')) {
                    img.crossOrigin = "Anonymous";
                }
                
                img.src = url;
                
                img.onload = () => {
                    console.log(`[SPRITE] Carregado: ${key}`);
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`[SPRITE] Erro ao carregar: ${key} (${url}).`);
                    resolve(); // Resolve anyway to not block the game
                };
                
                LOADED_SPRITES[key] = img;
            }));
        }
    });
    
    return Promise.all(promises).then(() => {});
};
