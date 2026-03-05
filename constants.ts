

export const SCREEN_WIDTH = window.innerWidth;
export const SCREEN_HEIGHT = window.innerHeight;
export const BLOCK_SIZE = 32;
export const MAX_STACK = 99;

export const WORLD_WIDTH = 3000;
export const WORLD_HEIGHT = 3000;

export const MINING_AREA_WIDTH = 1200; // Smaller area for underground to save performance
export const MINING_AREA_HEIGHT = 1200;

export const ZOOM_MIN = 0.5; // Terraria size view
export const ZOOM_MAX = 2.0;
export const ZOOM_STEP = 0.1;

export const TOTAL_LOC = 3300;

export const GAME_BALANCE = {
  PLAYER_BASE_HP: 100,
  PLAYER_BASE_HUNGER: 20,
  PLAYER_SPEED: 5, 
  PLAYER_WATER_SPEED: 2.5,
  
  DAY_DURATION: 24000, 
  
  // Combat
  MELEE_DURATION_FRAMES: 12, 
  MELEE_COOLDOWN_FRAMES: 15, 
  PARRY_DURATION_FRAMES: 20,
  PARRY_COOLDOWN_FRAMES: 60,
  SLINGSHOT_COOLDOWN_FRAMES: 30,
  
  // Tree Mining
  TREE_HP: 100,
  ROCK_HP: 150,
  HAND_MINING_DAMAGE: 5,
  AXE_MINING_DAMAGE: 20,
  PICKAXE_MINING_DAMAGE: 20,

  // Hunger
  HUNGER_DECAY_RATE: 600, // Frames per hunger point lost (approx 10s at 60fps)
  STARVATION_DAMAGE_RATE: 120, // Frames per damage tick when starving
  FOOD_VALUE_RAW: 3,
  FOOD_VALUE_COOKED: 8,

  ENEMY_SPAWN_RATE: 150, 
  
  TORCH_LIFETIME: 18000, // 5 minutes at 60fps
};

// Simple Recipe Map (Input items sorted -> Output)
export const CRAFTING_RECIPES = [
  { inputs: ['WOOD'], output: 'PLANKS', count: 4 },
  { inputs: ['PLANKS', 'PLANKS'], output: 'STICK', count: 4 }, 
  { inputs: ['PLANKS', 'PLANKS', 'PLANKS', 'PLANKS'], output: 'CRAFTING_TABLE', count: 1 },
  // Furnace: 8 Stones (surrounding)
  { inputs: ['STONE', 'STONE', 'STONE', 'STONE', 'STONE', 'STONE', 'STONE', 'STONE'], output: 'FURNACE', count: 1 },
  // Torch: Coal + Stick
  { inputs: ['COAL', 'STICK'], output: 'TORCH', count: 4 },
  { inputs: ['CHARCOAL', 'STICK'], output: 'TORCH', count: 4 },
  // Paper: 3 Birch Wood
  { inputs: ['BIRCH_WOOD', 'BIRCH_WOOD', 'BIRCH_WOOD'], output: 'PAPER', count: 3 },
  // Map: 4 Paper
  { inputs: ['PAPER', 'PAPER', 'PAPER', 'PAPER'], output: 'MAP', count: 1 },
  // Slime Crown: 4 Slime Balls
  { inputs: ['SLIME_BALL', 'SLIME_BALL', 'SLIME_BALL', 'SLIME_BALL'], output: 'SLIME_CROWN', count: 1 },
  // Shield: 9 Planks (Full Grid)
  { inputs: ['PLANKS', 'PLANKS', 'PLANKS', 'PLANKS', 'PLANKS', 'PLANKS', 'PLANKS', 'PLANKS', 'PLANKS'], output: 'SHIELD', count: 1 },
  // Door: 6 Planks -> 3 Doors
  { inputs: ['PLANKS', 'PLANKS', 'PLANKS', 'PLANKS', 'PLANKS', 'PLANKS'], output: 'DOOR', count: 3 },
  // Anvil: 8 Iron (Surrounding)
  { inputs: ['IRON', 'IRON', 'IRON', 'IRON', 'IRON', 'IRON', 'IRON', 'IRON'], output: 'ANVIL', count: 1 },
  // Ladder: 7 Planks (Usually H-shape, here just 7 inputs) -> Output 1
  { inputs: ['PLANKS', 'PLANKS', 'PLANKS', 'PLANKS', 'PLANKS', 'PLANKS', 'PLANKS'], output: 'LADDER', count: 1 },
  // Bow: 3 Sticks + 3 Vines
  { inputs: ['STICK', 'STICK', 'STICK', 'VINE', 'VINE', 'VINE'], output: 'BOW', count: 1 },
  // Backpack: 4 Leather (not implemented) or 4 Planks + 2 Vines
  { inputs: ['PLANKS', 'PLANKS', 'PLANKS', 'PLANKS', 'VINE', 'VINE'], output: 'BACKPACK', count: 1 },
  // Iron Armor
  { inputs: ['IRON', 'IRON', 'IRON', 'IRON', 'IRON'], output: 'HELMET_IRON', count: 1 },
  { inputs: ['IRON', 'IRON', 'IRON', 'IRON', 'IRON', 'IRON', 'IRON', 'IRON'], output: 'CHEST_IRON', count: 1 },
  { inputs: ['IRON', 'IRON', 'IRON', 'IRON', 'IRON', 'IRON', 'IRON'], output: 'LEGS_IRON', count: 1 },
  { inputs: ['IRON', 'IRON', 'IRON', 'IRON'], output: 'BOOTS_IRON', count: 1 },
];
