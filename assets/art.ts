
import { ItemType } from '../types';

export const COLORS = {
  PLAYER: '#facc15',
  PLAYER_PROJECTILE: '#e0f2fe',
  
  // --- UPDATED PALETTE (More Organic) ---
  
  // Environment 
  GRASS_BASE_1: '#558B2F', // Deep organic green (less neon)
  GRASS_BASE_2: '#33691E', // Darker patches
  GRASS_DETAIL: '#7CB342', // Lighter details
  
  BG_SURFACE: '#64B5F6', // Sky
  BG_UNDERGROUND: '#3E2723', // Dirt Brown

  WATER: '#29B6F6', // Clear Blue
  WATER_DEEP: '#0288D1',
  WATER_FOAM: '#E1F5FE',
  
  NIGHT_OVERLAY: 'rgba(5, 5, 20, 0.90)', 
  
  // Resources
  WOOD: '#795548', // Brown
  WOOD_TOP: '#A1887F', 
  
  BIRCH_WOOD: '#D7CCC8', 
  BIRCH_SPOTS: '#4E342E', 
  
  LEAVES: '#2E7D32', // Forest Green
  LEAVES_HIGHLIGHT: '#4CAF50', 
  
  BIRCH_LEAVES: '#8BC34A', // Light Green
  BIRCH_LEAVES_HIGHLIGHT: '#AED581',

  STONE: '#9E9E9E', 
  STONE_DARK: '#616161',
  STONE_LIGHT: '#BDBDBD',
  
  COAL_ORE: '#212121',
  IRON_ORE: '#BCAAA4', 
  IRON_SPOT: '#8D6E63',
  
  // --- MOBS ---
  COW: '#5D4037', 
  SHEEP: '#EEEEEE',
  CHICKEN: '#FFFFFF',

  // Hostile Mobs
  ZOMBIE: '#43A047', 
  SKELETON: '#E0E0E0',
  CREEPER: '#2E7D32', 
  SLIME: '#42A5F5', 
  SPIDER: '#263238', 
  GIANT_SLIME: '#1E88E5', 
  
  // Weapons
  TERRA_BLADE_MAIN: '#66BB6A',
  TERRA_BLADE_DARK: '#2E7D32',
  TERRA_BEAM: '#69F0AE',
  
  // UI
  TEXT: '#ffffff', 
  GOLD: '#FFD700',
  HUNGER: '#F57C00', 
  BREATH: '#29B6F6', 
  
  UI_BG: '#37474F', 
  UI_BORDER_LIGHT: '#607D8B',
  UI_BORDER_DARK: '#263238',

  IRON_ARMOR: '#CFD8DC',
  IRON_ARMOR_DARK: '#90A4AE',
};

export const ITEM_ICONS: Record<string, string> = {
    [ItemType.WOOD]: '🪵',
    [ItemType.BIRCH_WOOD]: '🪵', 
    [ItemType.PLANKS]: '📦',
    [ItemType.STICK]: '🥢',
    [ItemType.STONE]: '🪨',
    [ItemType.COAL]: '⚫',
    [ItemType.CHARCOAL]: '🌑',
    [ItemType.IRON]: '🔩',
    [ItemType.CRAFTING_TABLE]: '🛠️',
    [ItemType.FURNACE]: '🔥',
    [ItemType.ANVIL]: '⚓',
    [ItemType.TORCH]: '🔥', 
    [ItemType.DOOR]: '🚪',
    [ItemType.LADDER]: '🪜',
    [ItemType.SWORD_WOOD]: '🗡️',
    [ItemType.AXE_WOOD]: '🪓',
    [ItemType.SWORD_STONE]: '⚔️',
    [ItemType.AXE_STONE]: '🪓',
    [ItemType.PICKAXE_WOOD]: '⛏️',
    [ItemType.PICKAXE_STONE]: '⛏️',
    [ItemType.BOW]: '🏹',
    [ItemType.SHIELD]: '🛡️',
    [ItemType.EMPTY]: '',
    [ItemType.POTION]: '🧪',
    [ItemType.TERRA_BLADE]: '✨',
    [ItemType.RAW_BEEF]: '🥩',
    [ItemType.STEAK]: '🍖',
    [ItemType.PAPER]: '📄',
    [ItemType.VINE]: '🌿',
    [ItemType.BACKPACK]: '🎒',
    [ItemType.MAP]: '🗺️',
    [ItemType.SLIME_BALL]: '🔵', 
    [ItemType.SLIME_CROWN]: '👑',
    [ItemType.HELMET_IRON]: '🪖',
    [ItemType.CHEST_IRON]: '👕',
    [ItemType.LEGS_IRON]: '👖',
    [ItemType.BOOTS_IRON]: '👢',
};

export const ITEM_DETAILS: Record<string, { name: string; desc: string }> = {
    [ItemType.WOOD]: { name: 'Wood', desc: 'Basic building material.' },
    [ItemType.BIRCH_WOOD]: { name: 'Rich Mahogany', desc: 'A dense, quality wood.' },
    [ItemType.PLANKS]: { name: 'Wood Platform', desc: 'Used for crafting and building.' },
    [ItemType.STICK]: { name: 'Stick', desc: 'Used for tools and torches.' },
    [ItemType.STONE]: { name: 'Stone Block', desc: 'Rough stone mined from rocks.' },
    [ItemType.COAL]: { name: 'Coal', desc: 'A fossil fuel. Burns well.' },
    [ItemType.CHARCOAL]: { name: 'Charcoal', desc: 'Burnt wood. Works like coal.' },
    [ItemType.IRON]: { name: 'Iron Bar', desc: 'Used for heavy crafting.' },
    [ItemType.CRAFTING_TABLE]: { name: 'Work Bench', desc: 'Used to craft basic items.' },
    [ItemType.FURNACE]: { name: 'Furnace', desc: 'Smelts ores and cooks food.' },
    [ItemType.ANVIL]: { name: 'Iron Anvil', desc: 'Used to craft armor and weapons.' },
    [ItemType.TORCH]: { name: 'Torch', desc: 'Provides light. Keeps monsters away.' },
    [ItemType.DOOR]: { name: 'Door', desc: 'Right click to Open/Close.' },
    [ItemType.LADDER]: { name: 'Rope', desc: 'Travel between layers.' },
    [ItemType.SWORD_WOOD]: { name: 'Wooden Broadsword', desc: 'Basic melee weapon.' },
    [ItemType.AXE_WOOD]: { name: 'Wooden Axe', desc: 'Chops trees.' },
    [ItemType.PICKAXE_WOOD]: { name: 'Wooden Pickaxe', desc: 'Weak mining tool.' },
    [ItemType.SWORD_STONE]: { name: 'Stone Broadsword', desc: 'Standard melee weapon.' },
    [ItemType.AXE_STONE]: { name: 'Stone Axe', desc: 'Better chopping power.' },
    [ItemType.PICKAXE_STONE]: { name: 'Stone Pickaxe', desc: 'Can mine Iron.' },
    [ItemType.BOW]: { name: 'Wooden Bow', desc: 'Ranged weapon.' },
    [ItemType.SHIELD]: { name: 'Wooden Shield', desc: 'Block attacks.' },
    [ItemType.POTION]: { name: 'Healing Potion', desc: 'Restores health instantly.' },
    [ItemType.RAW_BEEF]: { name: 'Raw Meat', desc: 'Edible, but better cooked.' },
    [ItemType.STEAK]: { name: 'Cooked Meat', desc: 'Delicious and restoring.' },
    [ItemType.PAPER]: { name: 'Paper', desc: 'Used for maps.' },
    [ItemType.VINE]: { name: 'Vine', desc: 'Sticky vine.' },
    [ItemType.BACKPACK]: { name: 'Backpack', desc: 'Increases inventory space.' },
    [ItemType.MAP]: { name: 'World Map', desc: 'View your surroundings.' },
    [ItemType.SLIME_BALL]: { name: 'Gel', desc: 'Sticky, flammable gel.' },
    [ItemType.SLIME_CROWN]: { name: 'Slime Crown', desc: 'Summons King Slime.' },
    [ItemType.HELMET_IRON]: { name: 'Iron Helmet', desc: 'Defense: 2' },
    [ItemType.CHEST_IRON]: { name: 'Iron Chainmail', desc: 'Defense: 4' },
    [ItemType.LEGS_IRON]: { name: 'Iron Greaves', desc: 'Defense: 3' },
    [ItemType.BOOTS_IRON]: { name: 'Iron Boots', desc: 'Defense: 1' },
    [ItemType.EMPTY]: { name: '', desc: '' },
};
