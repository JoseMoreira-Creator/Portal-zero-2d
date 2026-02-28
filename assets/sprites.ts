
import { ItemType, MobType } from '../types';

// =====================================================================================
// COMO USAR SEUS PRÓPRIOS SPRITES:
// 1. Salve sua imagem (ex: 'espada.png') na pasta 'public/sprites' que foi criada.
// 2. Altere o caminho abaixo. Ex: [ItemType.SWORD_WOOD]: '/sprites/espada.png'
// =====================================================================================

export const SPRITE_URLS: Record<string, string> = {
    // --- PLAYER ---
    'PLAYER_IDLE': '/sprites/player.svg', 

    // --- NATUREZA ---
    'TREE': '/sprites/tree.svg',
    'BIRCH_TREE': '/sprites/tree.svg', // Pode criar um birch.svg separado se quiser
    'ROCK': '/sprites/rock.svg',
    
    // Blocos dropados (Se deixar vazio, usa o desenho via código)
    [ItemType.STONE]: '',
    [ItemType.WOOD]: '',
    [ItemType.PLANKS]: '',
    [ItemType.CRAFTING_TABLE]: '',
    [ItemType.FURNACE]: '',

    // --- MOBS ---
    [MobType.ZOMBIE]: '/sprites/zombie.svg', 
    [MobType.SKELETON]: '', // Usa renderização procedural se vazio
    [MobType.CREEPER]: '',
    [MobType.COW]: '',
    
    // --- ITENS ---
    // Você pode adicionar imagens para as ferramentas aqui
    [ItemType.SWORD_WOOD]: '',
    [ItemType.SWORD_STONE]: '',
    [ItemType.POTION]: '',
};

// Armazena as imagens carregadas na memória
export const LOADED_SPRITES: Record<string, HTMLImageElement> = {};

// Função chamada pelo App.tsx para carregar tudo
export const loadSprites = () => {
    Object.entries(SPRITE_URLS).forEach(([key, url]) => {
        if (url && url.length > 0) {
            const img = new Image();
            
            if (url.startsWith('http')) {
                img.crossOrigin = "Anonymous";
            }
            
            img.src = url;
            
            img.onload = () => console.log(`[SPRITE] Carregado: ${key}`);
            img.onerror = () => console.warn(`[SPRITE] Erro ao carregar: ${key} (${url}). Verifique se o arquivo existe na pasta public/sprites.`);
            
            LOADED_SPRITES[key] = img;
        }
    });
};
