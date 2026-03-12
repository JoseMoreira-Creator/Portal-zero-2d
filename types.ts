
export type Vector2 = { x: number; y: number };

export enum GameState {
  MENU = 'MENU',
  WORLD_SELECT = 'WORLD_SELECT',
  MULTIPLAYER_MENU = 'MULTIPLAYER_MENU', // Novo estado
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface GameSettings {
  animations: boolean;
  zoom: number;
  showCoordinates: boolean;
  controlScheme: 'TAP_TO_MOVE' | 'JOYSTICK';
}

export interface Attributes {
  recovery: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'SYSTEM' | 'PLAYER' | 'ERROR' | string; // Allow remote IDs
  timestamp: number;
}

export enum ItemType {
  // Tools/Weapons
  SWORD_WOOD = 'SWORD_WOOD',
  SWORD_STONE = 'SWORD_STONE',
  SWORD_IRON = 'SWORD_IRON',
  AXE_WOOD = 'AXE_WOOD',
  AXE_STONE = 'AXE_STONE',
  PICKAXE_WOOD = 'PICKAXE_WOOD',
  PICKAXE_STONE = 'PICKAXE_STONE',
  BOW = 'BOW',
  TERRA_BLADE = 'TERRA_BLADE', 
  SHIELD = 'SHIELD',
  
  // Armor
  HELMET_IRON = 'HELMET_IRON',
  CHEST_IRON = 'CHEST_IRON',
  LEGS_IRON = 'LEGS_IRON',
  BOOTS_IRON = 'BOOTS_IRON',

  // Resources
  WOOD = 'WOOD',
  BIRCH_WOOD = 'BIRCH_WOOD', // For Paper
  PLANKS = 'PLANKS',
  STICK = 'STICK',
  STONE = 'STONE',
  IRON = 'IRON',
  COAL = 'COAL',
  CHARCOAL = 'CHARCOAL',
  PAPER = 'PAPER',
  VINE = 'VINE', // Renamed from STRING
  SLIME_BALL = 'SLIME_BALL',
  BACKPACK = 'BACKPACK',
  BOAT = 'BOAT',
  
  // Food
  RAW_BEEF = 'RAW_BEEF',
  STEAK = 'STEAK',
  
  // Consumables/Placeables
  POTION = 'POTION',
  CRAFTING_TABLE = 'CRAFTING_TABLE',
  FURNACE = 'FURNACE',
  ANVIL = 'ANVIL',
  TORCH = 'TORCH',
  DOOR = 'DOOR',
  LADDER = 'LADDER', 
  MAP = 'MAP',
  SLIME_CROWN = 'SLIME_CROWN', // Summon Item
  
  // Misc
  EMPTY = 'EMPTY'
}

export enum MobType {
  // Passive
  COW = 'COW',
  SHEEP = 'SHEEP',
  CHICKEN = 'CHICKEN',
  // Hostile
  ZOMBIE = 'ZOMBIE',
  SKELETON = 'SKELETON',
  CREEPER = 'CREEPER',
  SLIME = 'SLIME',
  SPIDER = 'SPIDER', // New Mob
  GIANT_SLIME = 'GIANT_SLIME' // Boss
}

export interface InventorySlot {
  item: ItemType;
  count: number;
}

export interface Equipment {
  // Functional Slots (Stats)
  head: InventorySlot;
  chest: InventorySlot;
  legs: InventorySlot;
  feet: InventorySlot;
  
  // Cosmetic Slots (Visual Override)
  cHead: InventorySlot;
  cChest: InventorySlot;
  cLegs: InventorySlot;
  cFeet: InventorySlot;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  hunger: number;
  maxHunger: number;
  score: number;
}

export interface Projectile {
  id: string;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  isEnemy: boolean;
  damage: number;
  color: string;
  // New: specific type for torch projectile
  type?: 'ARROW' | 'TORCH';
  life?: number; // For torch travel distance
}

export interface Particle {
  id: string;
  pos: Vector2;
  vel: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Entity {
  id: string;
  // Expanded types to include placeable blocks
  type: MobType | 'TREE' | 'BIRCH_TREE' | 'VINE_TREE' | 'CRAFTING_TABLE' | 'ROCK' | 'COAL_ORE' | 'IRON_ORE' | ItemType.WOOD | ItemType.BIRCH_WOOD | ItemType.PLANKS | ItemType.FURNACE | ItemType.ANVIL | ItemType.TORCH | ItemType.DOOR | ItemType.LADDER;
  pos: Vector2;
  vel: Vector2;
  hp: number;
  maxHp: number;
  state: 'IDLE' | 'CHASING' | 'ATTACKING' | 'FLEEING';
  attackTimer: number; // Used for attack cooldown OR generic state timer (like slime jump)
  size: number;
  color: string;
  faceDirection: number; // 1 or -1
  maxLife?: number; // For torch decay
  isOpen?: boolean; // For Doors
}

export interface CursorState {
  pos: Vector2;
  mousePos: Vector2; // World Coordinates
  screenMousePos: Vector2; // Screen Coordinates
  
  isLeftDown: boolean;
  isRightDown: boolean;
  
  keys: {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
  };
  
  // Interaction
  hoverTarget: boolean; // true if hovering over interactable
  inWater: boolean; // Visual state for swimming
  
  // Inventory State
  inventory: InventorySlot[]; 
  equipment: Equipment; // New Equipment State
  hotbarSelectedIndex: number; 
  isInventoryOpen: boolean;
  isCraftingTableOpen: boolean;
  isAnvilOpen: boolean; // 4x4 Grid
  isBackpackEquipped: boolean;
  
  // Combat States
  parryActive: boolean; 
  parryTimer: number;
  parryCooldown: number;
  
  meleeActive: boolean; 
  meleeTimer: number;
  meleeCooldown: number;
  meleeAngle: number;
  
  bowCooldown: number; 
  healCooldown: number;
  terraCooldown: number;
  
  faceDirection: number; 
  isMapOpen: boolean; // Logic state for map view
  targetPos: Vector2 | null; // For touch-to-move
  autoAction: 'NONE' | 'CHOP' | 'MINE';
  autoTargetId: string | null;
}

export interface WaterBody {
    x: number;
    y: number;
    radius: number;
    circles: { x: number, y: number, radius: number }[];
}

// Data to persist when switching dimensions
export interface StoredDimensionData {
    entities: Entity[];
    items: { id: string, type: ItemType, pos: Vector2, life: number }[];
    projectiles: Projectile[];
    waterBodies: WaterBody[];
    playerPos: Vector2;
}

// MULTIPLAYER INTERFACES
export interface RemotePlayer {
    id: string;
    pos: Vector2;
    faceDirection: number;
    heldItem: ItemType;
    isMoving: boolean;
    hp: number;
    maxHp: number;
}

export interface HitMarker {
  id: string;
  pos: Vector2;
  life: number;
}

export interface WorldState {
  dimension: 'SURFACE' | 'UNDERGROUND';
  inactiveWorldData: Partial<Record<'SURFACE' | 'UNDERGROUND', StoredDimensionData>>;
  
  projectiles: Projectile[];
  particles: Particle[];
  hitMarkers: HitMarker[]; // Visual hit feedback
  entities: Entity[];
  items: { id: string, type: ItemType, pos: Vector2, life: number }[]; 
  waterBodies: WaterBody[];
  cursor: CursorState;
  cameraPos: Vector2; // New camera position
  
  // Multiplayer
  remotePlayers: Record<string, RemotePlayer>;
  isMultiplayer: boolean;
  isHost: boolean;
  myId: string;

  camShake: number;
  frameCount: number;
  timeOfDay: number; 
  dayCount: number;
  zoom: number;
}

// SAVE SYSTEM INTERFACES
export interface WorldMetadata {
  id: string;
  name: string;
  lastPlayed: number;
  thumbnail: string; // Base64 encoded image
}

export interface SavedWorldData {
  metadata: WorldMetadata;
  worldState: WorldState;
  playerStats: PlayerStats;
}
