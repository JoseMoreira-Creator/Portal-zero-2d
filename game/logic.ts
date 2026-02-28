
import React from 'react';
import { GAME_BALANCE, BLOCK_SIZE, MAX_STACK, WORLD_WIDTH, WORLD_HEIGHT, MINING_AREA_WIDTH, MINING_AREA_HEIGHT } from '../constants';
import { COLORS } from '../assets/art';
import { Entity, GameState, ItemType, MobType, PlayerStats, CursorState, Vector2, WorldState, StoredDimensionData } from '../types';
import { getAngle, getDistance, getVector, normalizeVector } from '../utils/math';
import { updateHostileMob } from './mobs/hostile';
import { updatePassiveMob } from './mobs/passive';
import { updateBoss } from './mobs/bosses';

export const createInitialWorld = (screenWidth: number, screenHeight: number): WorldState => {
  const entities: Entity[] = [];
  const waterBodies: { x: number, y: number, radius: number }[] = [];
  
  const spawnPos = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
  const SAFE_ZONE_RADIUS = 200; // Area around spawn that must remain empty

  // Generate Water Ponds
  let waterAttempts = 0;
  while(waterBodies.length < 15 && waterAttempts < 1000) {
      waterAttempts++;
      const x = Math.random() * (WORLD_WIDTH - 200) + 100;
      const y = Math.random() * (WORLD_HEIGHT - 200) + 100;
      const radius = 80 + Math.random() * 80;

      // Check distance from spawn
      if (getDistance({x, y}, spawnPos) < radius + SAFE_ZONE_RADIUS) continue;

      waterBodies.push({ x, y, radius });
  }

  let attempts = 0;
  
  // Trees (Oak & Birch) - Increased count for larger world
  while (entities.length < 300 && attempts < 5000) {
    attempts++;
    const pos = { 
        x: Math.random() * (WORLD_WIDTH - 50) + 25, 
        y: Math.random() * (WORLD_HEIGHT - 50) + 25 
    };

    // Prevent overlap with spawn
    if (getDistance(pos, spawnPos) < SAFE_ZONE_RADIUS) continue;

    // Prevent overlap with entities and water
    let overlap = false;
    for (const e of entities) {
        if (getDistance(pos, e.pos) < 40) { overlap = true; break; } 
    }
    for (const w of waterBodies) {
        // Square Check for overlapping generation
        const halfSize = w.radius + 30; // Buffer
        if (
            pos.x > w.x - halfSize &&
            pos.x < w.x + halfSize &&
            pos.y > w.y - halfSize &&
            pos.y < w.y + halfSize
        ) { overlap = true; break; }
    }

    if (!overlap) {
        const isBirch = Math.random() < 0.3; 
        entities.push({
            id: `tree-${entities.length}`,
            type: isBirch ? 'BIRCH_TREE' : 'TREE',
            pos,
            vel: { x: 0, y: 0 },
            hp: GAME_BALANCE.TREE_HP,
            maxHp: GAME_BALANCE.TREE_HP,
            state: 'IDLE',
            attackTimer: 0,
            size: 32,
            color: isBirch ? COLORS.BIRCH_WOOD : COLORS.WOOD,
            faceDirection: 1
        });
    }
  }

  // Rocks & Coal (Iron removed from surface)
  attempts = 0;
  while (entities.length < 500 && attempts < 5000) {
      attempts++;
      const pos = { 
          x: Math.random() * (WORLD_WIDTH - 50) + 25, 
          y: Math.random() * (WORLD_HEIGHT - 50) + 25 
      };

      // Prevent overlap with spawn
      if (getDistance(pos, spawnPos) < SAFE_ZONE_RADIUS) continue;

      let overlap = false;
      for (const e of entities) {
          if (getDistance(pos, e.pos) < 32) { overlap = true; break; } 
      }
      for (const w of waterBodies) {
          const halfSize = w.radius + 20; 
          if (
            pos.x > w.x - halfSize &&
            pos.x < w.x + halfSize &&
            pos.y > w.y - halfSize &&
            pos.y < w.y + halfSize
          ) { overlap = true; break; }
      }

      if (!overlap) {
          const rand = Math.random();
          let rockType: any = 'ROCK';
          let rockColor = COLORS.STONE;

          if (rand < 0.2) {
              rockType = 'COAL_ORE';
              rockColor = COLORS.COAL_ORE;
          } 
          // Iron Ore removed from surface logic

          entities.push({
              id: `rock-${entities.length}`,
              type: rockType,
              pos,
              vel: { x: 0, y: 0 },
              hp: GAME_BALANCE.ROCK_HP,
              maxHp: GAME_BALANCE.ROCK_HP,
              state: 'IDLE',
              attackTimer: 0,
              size: 32,
              color: rockColor,
              faceDirection: 1
          });
      }
  }

  const inventory = Array.from({ length: 36 }, () => ({ item: ItemType.EMPTY, count: 0 }));

  return {
    dimension: 'SURFACE',
    inactiveWorldData: {},
    projectiles: [],
    particles: [],
    entities,
    items: [],
    waterBodies,
    cursor: {
      pos: { ...spawnPos },
      mousePos: { ...spawnPos },
      screenMousePos: { x: screenWidth / 2, y: screenHeight / 2 },
      keys: { w: false, a: false, s: false, d: false },
      isLeftDown: false,
      isRightDown: false,
      hoverTarget: false,
      inWater: false,
      inventory,
      equipment: {
          head: { item: ItemType.EMPTY, count: 0 },
          chest: { item: ItemType.EMPTY, count: 0 },
          legs: { item: ItemType.EMPTY, count: 0 },
          feet: { item: ItemType.EMPTY, count: 0 },
          cHead: { item: ItemType.EMPTY, count: 0 },
          cChest: { item: ItemType.EMPTY, count: 0 },
          cLegs: { item: ItemType.EMPTY, count: 0 },
          cFeet: { item: ItemType.EMPTY, count: 0 },
      },
      hotbarSelectedIndex: 0,
      isInventoryOpen: false,
      isCraftingTableOpen: false,
      isAnvilOpen: false,
      parryActive: false,
      parryTimer: 0,
      parryCooldown: 0,
      meleeActive: false,
      meleeTimer: 0,
      meleeCooldown: 0,
      meleeAngle: 0,
      bowCooldown: 0,
      healCooldown: 0,
      terraCooldown: 0,
      faceDirection: 1,
      isMapOpen: false
    },
    // Multiplayer defaults
    remotePlayers: {},
    isMultiplayer: false,
    isHost: false,
    myId: '',

    camShake: 0,
    frameCount: 0,
    timeOfDay: 6000, 
    dayCount: 1,
    zoom: 1.0,
  };
};

// Generate a dense underground world
const createUndergroundWorld = (): { entities: Entity[], spawn: Vector2 } => {
    const entities: Entity[] = [];
    const width = MINING_AREA_WIDTH;
    const height = MINING_AREA_HEIGHT;
    
    // Fill with grid of blocks
    const cols = Math.floor(width / BLOCK_SIZE);
    const rows = Math.floor(height / BLOCK_SIZE);
    const centerC = Math.floor(cols / 2);
    const centerR = Math.floor(rows / 2);

    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            // Clear center area (3x3) for spawn
            if (Math.abs(c - centerC) <= 1 && Math.abs(r - centerR) <= 1) continue;

            const x = c * BLOCK_SIZE + BLOCK_SIZE/2;
            const y = r * BLOCK_SIZE + BLOCK_SIZE/2;
            
            const rand = Math.random();
            let type: any = 'ROCK';
            let color = COLORS.STONE;

            if (rand < 0.1) { // 10% Iron
                type = 'IRON_ORE';
                color = COLORS.IRON_ORE;
            } else if (rand < 0.25) { // 15% Coal
                type = 'COAL_ORE';
                color = COLORS.COAL_ORE;
            }

            entities.push({
                id: `u-rock-${c}-${r}`,
                type,
                pos: { x, y },
                vel: { x: 0, y: 0 },
                hp: GAME_BALANCE.ROCK_HP,
                maxHp: GAME_BALANCE.ROCK_HP,
                state: 'IDLE',
                attackTimer: 0,
                size: 32,
                color,
                faceDirection: 1
            });
        }
    }

    // Add Exit Ladder in exact center
    const spawnX = centerC * BLOCK_SIZE + BLOCK_SIZE/2;
    const spawnY = centerR * BLOCK_SIZE + BLOCK_SIZE/2;

    entities.push({
        id: 'u-exit-ladder',
        type: ItemType.LADDER,
        pos: { x: spawnX, y: spawnY },
        vel: {x:0, y:0},
        hp: 100,
        maxHp: 100,
        state: 'IDLE',
        attackTimer: 0,
        size: 32,
        color: '#8d6e63',
        faceDirection: 1
    });

    return { entities, spawn: { x: spawnX, y: spawnY } };
};

const spawnParticles = (world: WorldState, pos: Vector2, color: string, count: number = 5) => {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    world.particles.push({
      id: Math.random().toString(),
      pos: { ...pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      life: 20 + Math.random() * 10,
      maxLife: 30,
      color: color,
      size: Math.random() * 4 + 2
    });
  }
};

const spawnMob = (world: WorldState, playerPos: Vector2) => {
    // Mobs don't spawn naturally underground (yet) to keep it a safe mining area
    if (world.dimension === 'UNDERGROUND') return;

    const isNight = world.timeOfDay > 13000 && world.timeOfDay < 23000;
    
    let type = MobType.COW;
    let color = COLORS.COW;
    let hp = 30;
    
    if (isNight) {
        const r = Math.random();
        if (r < 0.35) { type = MobType.ZOMBIE; color = COLORS.ZOMBIE; hp = 50; }
        else if (r < 0.6) { type = MobType.SKELETON; color = COLORS.SKELETON; hp = 40; }
        else if (r < 0.85) { type = MobType.SPIDER; color = COLORS.SPIDER; hp = 35; }
        else { type = MobType.CREEPER; color = COLORS.CREEPER; hp = 30; }
    } else {
        const r = Math.random();
        if (r < 0.3) { type = MobType.COW; color = COLORS.COW; hp = 30; }
        else if (r < 0.5) { type = MobType.SHEEP; color = COLORS.SHEEP; hp = 25; }
        else if (r < 0.7) { type = MobType.CHICKEN; color = COLORS.CHICKEN; hp = 15; }
        else { type = MobType.SLIME; color = COLORS.SLIME; hp = 20; }
    }

    // Spawn in a ring around the player (approx 600-800 pixels away)
    const angle = Math.random() * Math.PI * 2;
    const dist = 600 + Math.random() * 200;
    let x = playerPos.x + Math.cos(angle) * dist;
    let y = playerPos.y + Math.sin(angle) * dist;

    // World clamp
    x = Math.max(50, Math.min(WORLD_WIDTH - 50, x));
    y = Math.max(50, Math.min(WORLD_HEIGHT - 50, y));

    world.entities.push({
        id: Math.random().toString(),
        type,
        pos: { x, y },
        vel: { x: 0, y: 0 },
        hp,
        maxHp: hp,
        state: 'IDLE',
        attackTimer: Math.random() * 100,
        size: type === MobType.CHICKEN ? 15 : (type === MobType.SLIME ? 20 : (type === MobType.SPIDER ? 32 : 25)),
        color,
        faceDirection: 1
    });
};

const dropItem = (world: WorldState, pos: Vector2, type: ItemType) => {
    world.items.push({
        id: Math.random().toString(),
        type,
        pos: { x: pos.x + (Math.random() - 0.5) * 30, y: pos.y + (Math.random() - 0.5) * 30 },
        life: 7200 // 2 mins
    });
};

// Update World Mouse Pos based on current Screen Pos and Player Pos
const updateCursorWorldPos = (c: CursorState, canvasWidth: number, canvasHeight: number, zoom: number) => {
    if (!c.isInventoryOpen) {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        // Reverse the camera transform to get world coordinates
        // WorldX = (ScreenX - CenterX) / Zoom + PlayerX
        const worldX = (c.screenMousePos.x - centerX) / zoom + c.pos.x;
        const worldY = (c.screenMousePos.y - centerY) / zoom + c.pos.y;
        
        c.mousePos = { x: worldX, y: worldY };

        // Face direction logic
        if (Math.abs(worldX - c.pos.x) > 1) {
          c.faceDirection = worldX > c.pos.x ? 1 : -1;
        }
    }
};

export const updateGame = (
  world: WorldState, 
  canvasWidth: number, 
  canvasHeight: number,
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>,
  setGameState: (state: GameState) => void,
  stats: PlayerStats
) => {
  // --- MULTIPLAYER CLIENT CHECK ---
  // If we are a client (connected but not host), we DO NOT calculate:
  // - Time of day (synced)
  // - Mob spawning
  // - Mob AI
  // - Projectile physics
  // We ONLY calculate:
  // - Local player movement/collision
  // - Local interactions
  const isClient = world.isMultiplayer && !world.isHost;

  world.frameCount++;
  
  if (!isClient) {
      const prevTime = world.timeOfDay;
      world.timeOfDay = (world.timeOfDay + 1) % 24000;
      // New Day Logic
      if (world.timeOfDay < prevTime) {
          world.dayCount++;
      }
  }

  const w = world;
  const c = w.cursor;

  // --- UPDATE MOUSE WORLD POS ---
  // Just once per frame to ensure interaction logic has correct coordinates
  updateCursorWorldPos(c, canvasWidth, canvasHeight, world.zoom);

  // --- WATER LOGIC (SQUARE COLLISION) ---
  let inWater = false;
  for (const lake of w.waterBodies) {
      // Treating lake.radius as Half-Size Extent
      if (
          c.pos.x >= lake.x - lake.radius && 
          c.pos.x <= lake.x + lake.radius &&
          c.pos.y >= lake.y - lake.radius &&
          c.pos.y <= lake.y + lake.radius
      ) {
          inWater = true;
          break;
      }
  }
  c.inWater = inWater; // UPDATE STATE
  // Breath logic and damage removed as per request

  // --- HUNGER LOGIC ---
  if (world.frameCount % GAME_BALANCE.HUNGER_DECAY_RATE === 0) {
      setStats(prev => ({
          ...prev,
          hunger: Math.max(0, prev.hunger - 1)
      }));
  }
  // Starvation damage
  if (stats.hunger === 0 && world.frameCount % GAME_BALANCE.STARVATION_DAMAGE_RATE === 0) {
      setStats(prev => ({
          ...prev,
          hp: Math.max(0, prev.hp - 1)
      }));
      w.camShake = 2;
  }

  // --- INTERACTION HOVER CHECK ---
  let hoveringInteractable = false;
  if (!c.isInventoryOpen) {
      for (const ent of w.entities) {
          if ((ent.type === 'CRAFTING_TABLE' || ent.type === ItemType.FURNACE || ent.type === ItemType.ANVIL) && getDistance(c.pos, ent.pos) < 60) {
              // MousePos is updated at start of frame, so this check is valid
              if (getDistance(c.mousePos, ent.pos) < 20) {
                  hoveringInteractable = true;
                  break;
              }
          }
      }
  }
  c.hoverTarget = hoveringInteractable;


  // 1. Player Movement & Collision
  let dx = 0;
  let dy = 0;
  if (!c.isInventoryOpen) {
      if (c.keys.w) dy -= 1;
      if (c.keys.s) dy += 1;
      if (c.keys.a) dx -= 1;
      if (c.keys.d) dx += 1;
  }

  if (dx !== 0 || dy !== 0) {
    const mag = Math.sqrt(dx*dx + dy*dy);
    let speed = c.parryActive ? GAME_BALANCE.PLAYER_SPEED * 0.3 : GAME_BALANCE.PLAYER_SPEED;
    
    // Slow down in water
    if (inWater) speed = GAME_BALANCE.PLAYER_WATER_SPEED;
    
    // Normalize speed
    const moveX = (dx / mag) * speed;
    const moveY = (dy / mag) * speed;
    
    // Apply Tentative Movement
    c.pos.x += moveX;
    c.pos.y += moveY;
    
    // Resolve Collisions (Push-out method)
    const PLAYER_RADIUS = 12; // Slightly reduced radius for better feel (visuals are approx 10-12)

    for (const ent of w.entities) {
        // Skip collisions for OPEN doors or LADDERS
        if ((ent.type === ItemType.DOOR && ent.isOpen) || ent.type === ItemType.LADDER) continue;

        const solidTypes = [
            'TREE', 'BIRCH_TREE', 'CRAFTING_TABLE', 'ROCK', 'COAL_ORE', 'IRON_ORE',
            ItemType.WOOD, ItemType.PLANKS, ItemType.FURNACE, ItemType.ANVIL, ItemType.DOOR
        ];
        
        if (solidTypes.includes(ent.type as string)) {
            
            // Define collision radius based on type
            let ENTITY_RADIUS = 16; 
            if (ent.type === 'TREE' || ent.type === 'BIRCH_TREE') ENTITY_RADIUS = 10; // Slightly larger than visual trunk
            if (ent.type === ItemType.WOOD || ent.type === ItemType.PLANKS || ent.type === ItemType.FURNACE || ent.type === ItemType.ANVIL || ent.type === ItemType.DOOR) ENTITY_RADIUS = 16;

            const minDist = PLAYER_RADIUS + ENTITY_RADIUS;
            const dist = getDistance(c.pos, ent.pos);

            if (dist < minDist) {
                // Collision detected - Resolve by pushing out
                const overlap = minDist - dist;
                const pushVec = normalizeVector(getVector(ent.pos, c.pos));
                
                // If centers are perfectly overlapping (rare)
                if (pushVec.x === 0 && pushVec.y === 0) {
                    pushVec.x = 1;
                }

                c.pos.x += pushVec.x * overlap;
                c.pos.y += pushVec.y * overlap;
            }
        }
    }

    // Bounds check
    const currentWidth = w.dimension === 'SURFACE' ? WORLD_WIDTH : MINING_AREA_WIDTH;
    const currentHeight = w.dimension === 'SURFACE' ? WORLD_HEIGHT : MINING_AREA_HEIGHT;

    if (c.pos.x < 10) c.pos.x = 10;
    if (c.pos.x > currentWidth - 10) c.pos.x = currentWidth - 10;
    if (c.pos.y < 10) c.pos.y = 10;
    if (c.pos.y > currentHeight - 10) c.pos.y = currentHeight - 10;
  }

  // NOTE: We do NOT need to update CursorWorldPos again here.
  // The renderer draws the crosshair based on screen coordinates, which don't change 
  // just because the player moved. The next frame's start will re-calc world pos for logic.

  if (w.camShake > 0) w.camShake *= 0.9;
  
  if (!isClient) {
      const mobsCount = w.entities.filter(e => 
          [MobType.COW, MobType.SHEEP, MobType.CHICKEN, MobType.ZOMBIE, MobType.SKELETON, MobType.CREEPER, MobType.SLIME, MobType.SPIDER, MobType.GIANT_SLIME].includes(e.type as MobType)
      ).length;

      if (w.frameCount % GAME_BALANCE.ENEMY_SPAWN_RATE === 0 && mobsCount < 50) {
        spawnMob(w, c.pos);
      }
  }

  if (c.parryCooldown > 0) c.parryCooldown--;
  if (c.meleeCooldown > 0) c.meleeCooldown--;
  if (c.bowCooldown > 0) c.bowCooldown--;
  if (c.terraCooldown > 0) c.terraCooldown--;

  // Update Projectiles (Arrows & Thrown Torches)
  // If Client, we assume projectiles are simulated on Host and synced. 
  // However, for smoothness, we might want to simulate them, but that risks desync.
  // For this prototype, CLIENT DOES NOT UPDATE PROJECTILES.
  if (!isClient) {
      for (let i = w.projectiles.length - 1; i >= 0; i--) {
          const p = w.projectiles[i];
          p.pos.x += p.vel.x;
          p.pos.y += p.vel.y;
          
          if (p.life !== undefined) p.life--;

          // Handle Torch Projectile (Stopping logic)
          if (p.type === 'TORCH') {
               if (p.life !== undefined && p.life <= 0) {
                   // Turn into entity
                   w.entities.push({
                       id: Math.random().toString(),
                       type: ItemType.TORCH,
                       pos: { ...p.pos },
                       vel: { x:0, y:0 },
                       hp: 1,
                       maxHp: 1,
                       state: 'IDLE',
                       attackTimer: 0,
                       size: 10,
                       color: '#ffeb3b',
                       faceDirection: 1,
                       maxLife: GAME_BALANCE.TORCH_LIFETIME 
                   });
                   w.projectiles.splice(i, 1);
                   continue;
               }
          }

          // Check Collision with Player (Hostile Projectiles)
          // TODO: Check against Remote Players too
          if (p.isEnemy) {
              if (getDistance(p.pos, c.pos) < p.radius + 15) {
                  if (c.parryActive) {
                      spawnParticles(w, p.pos, '#fff', 3);
                      w.projectiles.splice(i, 1);
                      continue;
                  }
                  setStats((prev: any) => ({ ...prev, hp: prev.hp - p.damage }));
                  w.camShake = 5;
                  w.projectiles.splice(i, 1);
                  continue;
              }
          }

          // Despawn if out of bounds (using world bounds plus margin)
          const currentWidth = w.dimension === 'SURFACE' ? WORLD_WIDTH : MINING_AREA_WIDTH;
          const currentHeight = w.dimension === 'SURFACE' ? WORLD_HEIGHT : MINING_AREA_HEIGHT;
          if (p.pos.x < -100 || p.pos.x > currentWidth + 100 || p.pos.y < -100 || p.pos.y > currentHeight + 100) {
              w.projectiles.splice(i, 1);
          }
      }
  }


  // Right Click (Place / Shield / Eat / Map / Summon / DOOR INTERACT / LADDER INTERACT)
  if (c.isRightDown && !c.isInventoryOpen) {
      let actionTaken = false;
      const activeSlot = c.inventory[c.hotbarSelectedIndex];
      
      // DOOR INTERACTION (Toggle Open/Close) - Allow Clients to flip state locally, Host will overwrite eventually or accept?
      // For now, Client interaction with Entities is tricky. Let's allow local prediction.
      if (!actionTaken && c.meleeCooldown <= 0) {
          for (const ent of w.entities) {
              if (ent.type === ItemType.DOOR) {
                  if (getDistance(c.mousePos, ent.pos) < 30 && getDistance(c.pos, ent.pos) < 60) {
                      ent.isOpen = !ent.isOpen;
                      c.meleeCooldown = 15;
                      actionTaken = true;
                      c.isRightDown = false; // Prevent spam
                      break;
                  }
              }
          }
      }

      // LADDER INTERACTION (Dimension Switch) - Disabled in Multiplayer for Client for simplicity?
      // Or Client switches locally.
      if (!actionTaken && c.meleeCooldown <= 0) {
          for (const ent of w.entities) {
              if (ent.type === ItemType.LADDER) {
                  if (getDistance(c.mousePos, ent.pos) < 30 && getDistance(c.pos, ent.pos) < 60) {
                      // IF MULTIPLAYER CLIENT, DISABLE DIMENSION SWITCH FOR NOW
                      if (isClient) {
                          // TODO: Request dimension switch from Host
                          break;
                      }

                      // SWITCH DIMENSION
                      const currentDim = w.dimension;
                      const targetDim = currentDim === 'SURFACE' ? 'UNDERGROUND' : 'SURFACE';
                      
                      // 1. SAVE CURRENT STATE
                      w.inactiveWorldData[currentDim] = {
                          entities: w.entities,
                          items: w.items,
                          projectiles: w.projectiles,
                          waterBodies: w.waterBodies,
                          playerPos: { ...c.pos }
                      };

                      // 2. LOAD OR GENERATE TARGET STATE
                      let nextData: StoredDimensionData | undefined = w.inactiveWorldData[targetDim];
                      
                      if (!nextData && targetDim === 'UNDERGROUND') {
                          // Generate new Underground
                          const newUnd = createUndergroundWorld();
                          nextData = {
                              entities: newUnd.entities,
                              items: [],
                              projectiles: [],
                              waterBodies: [],
                              playerPos: newUnd.spawn
                          };
                      } else if (!nextData && targetDim === 'SURFACE') {
                          // Should technically not happen if we started on surface, but fallback
                          nextData = { entities: [], items: [], projectiles: [], waterBodies: [], playerPos: {x: 100, y: 100} };
                      }

                      if (nextData) {
                          w.entities = nextData.entities;
                          w.items = nextData.items;
                          w.projectiles = nextData.projectiles;
                          w.waterBodies = nextData.waterBodies;
                          w.dimension = targetDim;
                          c.pos = { ...nextData.playerPos };
                          
                          // If returning to surface, offset slightly so we don't clip into the ladder/wall instantly? 
                          // Or just rely on pushout logic. The saved pos should be fine.
                          
                          w.camShake = 10;
                      }

                      c.meleeCooldown = 60; // Long debounce for transition
                      actionTaken = true;
                      c.isRightDown = false;
                      break;
                  }
              }
          }
      }

      // Map Use
      if (!actionTaken && activeSlot.item === ItemType.MAP && c.meleeCooldown <= 0) {
          c.isMapOpen = !c.isMapOpen;
          c.meleeCooldown = 15; // Debounce
          c.isRightDown = false;
          actionTaken = true;
      }
      
      // BOSS SUMMON
      if (!actionTaken && activeSlot.item === ItemType.SLIME_CROWN && c.meleeCooldown <= 0) {
          if (!isClient) { // Only Host summons boss
              w.entities.push({
                  id: `boss-slime-${Math.random()}`,
                  type: MobType.GIANT_SLIME,
                  pos: { ...c.mousePos },
                  vel: { x: 0, y: 0 },
                  hp: 500,
                  maxHp: 500,
                  state: 'CHASING',
                  attackTimer: 60,
                  size: 60,
                  color: COLORS.GIANT_SLIME,
                  faceDirection: 1
              });
              
              spawnParticles(w, c.mousePos, COLORS.GIANT_SLIME, 20);
              w.camShake = 20;
          }
          
          if (activeSlot.count > 1) activeSlot.count--;
          else {
              activeSlot.item = ItemType.EMPTY;
              activeSlot.count = 0;
          }
          c.meleeCooldown = 60;
          actionTaken = true;
      }

      // Interaction (Crafting Tables & Anvils)
      if (!actionTaken && !c.isInventoryOpen && !c.parryActive) {
          if (hoveringInteractable) {
               // Check what we are hovering
               let entType = null;
               for (const ent of w.entities) {
                  if (getDistance(c.mousePos, ent.pos) < 20) {
                      entType = ent.type;
                      break;
                  }
               }

               c.isInventoryOpen = true;
               if (entType === ItemType.CRAFTING_TABLE) c.isCraftingTableOpen = true;
               if (entType === ItemType.ANVIL) c.isAnvilOpen = true;
               
               c.isRightDown = false; 
               actionTaken = true;
          }
      }

      // Eating
      if (!actionTaken && (activeSlot.item === ItemType.RAW_BEEF || activeSlot.item === ItemType.STEAK)) {
          if (c.healCooldown <= 0 && stats.hunger < stats.maxHunger) {
               const healAmount = activeSlot.item === ItemType.STEAK ? GAME_BALANCE.FOOD_VALUE_COOKED : GAME_BALANCE.FOOD_VALUE_RAW;
               setStats(prev => ({ ...prev, hunger: Math.min(prev.maxHunger, prev.hunger + healAmount) }));
               
               if (activeSlot.count > 1) activeSlot.count--;
               else {
                   activeSlot.item = ItemType.EMPTY;
                   activeSlot.count = 0;
               }
               c.healCooldown = 30;
               spawnParticles(w, c.pos, COLORS.HUNGER, 3);
               actionTaken = true;
          }
      }

      // Placement (Client places locally, will desync if not careful, but okay for prototype)
      const placeableTypes = [ItemType.CRAFTING_TABLE, ItemType.WOOD, ItemType.PLANKS, ItemType.FURNACE, ItemType.ANVIL, ItemType.TORCH, ItemType.DOOR, ItemType.LADDER];
      if (!actionTaken && placeableTypes.includes(activeSlot.item)) {
          if (c.meleeCooldown <= 0) {
              let placePos = { ...c.mousePos };
              let snap = false;
              
              if (activeSlot.item !== ItemType.TORCH) {
                  const gridX = Math.floor(c.mousePos.x / BLOCK_SIZE) * BLOCK_SIZE + BLOCK_SIZE/2;
                  const gridY = Math.floor(c.mousePos.y / BLOCK_SIZE) * BLOCK_SIZE + BLOCK_SIZE/2;
                  placePos = { x: gridX, y: gridY };
                  snap = true;
              }

              let canPlace = true;
              if (snap) {
                   if (getDistance(placePos, c.pos) < 30) canPlace = false; 
                   for(const e of w.entities) {
                       if (getDistance(placePos, e.pos) < 30) canPlace = false; 
                   }
              }
              if (getDistance(placePos, c.pos) > 150) canPlace = false; 

              if (canPlace) {
                  let maxHp = 50;
                  let color = '#8b4513';
                  let type = activeSlot.item as any;
                  
                  if (activeSlot.item === ItemType.WOOD) { maxHp = 50; color = COLORS.WOOD; }
                  if (activeSlot.item === ItemType.PLANKS) { maxHp = 30; color = '#d7ccc8'; }
                  if (activeSlot.item === ItemType.FURNACE) { maxHp = 60; color = '#546e7a'; }
                  if (activeSlot.item === ItemType.ANVIL) { maxHp = 100; color = '#222'; }
                  if (activeSlot.item === ItemType.TORCH) { maxHp = 1; color = '#ffeb3b'; }
                  if (activeSlot.item === ItemType.DOOR) { maxHp = 30; color = COLORS.WOOD; }
                  if (activeSlot.item === ItemType.LADDER) { maxHp = 30; color = '#8d6e63'; }

                  w.entities.push({
                      id: Math.random().toString(),
                      type,
                      pos: placePos,
                      vel: {x:0, y:0},
                      hp: maxHp,
                      maxHp: maxHp,
                      state: 'IDLE',
                      attackTimer: 0,
                      size: activeSlot.item === ItemType.TORCH ? 10 : 32,
                      color: color,
                      faceDirection: 1,
                      maxLife: activeSlot.item === ItemType.TORCH ? GAME_BALANCE.TORCH_LIFETIME : undefined,
                      isOpen: activeSlot.item === ItemType.DOOR ? false : undefined
                  });
                  if (activeSlot.count > 1) {
                      activeSlot.count--;
                  } else {
                      activeSlot.item = ItemType.EMPTY;
                      activeSlot.count = 0;
                  }
                  c.meleeCooldown = 15; 
                  actionTaken = true;
              }
          }
      }

      if (!actionTaken) {
          if (activeSlot.item === ItemType.SHIELD) {
              c.parryActive = true;
          }
      }
  } else {
      c.parryActive = false;
  }

  // Left Click
  if (c.isLeftDown && !c.parryActive && !c.isInventoryOpen) {
     const activeItem = c.inventory[c.hotbarSelectedIndex].item;

     if (activeItem === ItemType.TORCH && c.bowCooldown <= 0) {
         // Thrown torches
         if (!isClient) {
             const angle = getAngle(c.pos, c.mousePos);
             const speed = 8;
             const lifetime = 12; 

             w.projectiles.push({
                 id: Math.random().toString(),
                 pos: { ...c.pos },
                 vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                 radius: 4,
                 isEnemy: false,
                 damage: 0,
                 color: '#ffeb3b',
                 type: 'TORCH',
                 life: lifetime
             });
         }

         const slot = c.inventory[c.hotbarSelectedIndex];
         if (slot.count > 1) slot.count--;
         else {
             slot.item = ItemType.EMPTY;
             slot.count = 0;
         }
         c.bowCooldown = 30; 
     } 
     else if (!c.meleeActive && c.meleeCooldown <= 0) {
         c.meleeActive = true;
         c.meleeTimer = GAME_BALANCE.MELEE_DURATION_FRAMES;
         c.meleeCooldown = GAME_BALANCE.MELEE_COOLDOWN_FRAMES;
         c.meleeAngle = getAngle(c.pos, c.mousePos);

         let effectiveDamage = 0;
         let isMining = false;

         // We iterate backwards to allow removal
         // Clients can "hit" entities locally, but if Host syncs overrides, it might rubberband.
         // We allow local hit processing for responsiveness.
         for (let i = w.entities.length - 1; i >= 0; i--) {
             const ent = w.entities[i];
             if (getDistance(c.pos, ent.pos) < 60) {
                 const angleToEnt = getAngle(c.pos, ent.pos);
                 let angleDiff = Math.abs(angleToEnt - c.meleeAngle);
                 if (angleDiff > Math.PI) angleDiff = (Math.PI * 2) - angleDiff;
                 
                 if (angleDiff < Math.PI / 4) {
                     
                     const stoneTypes = ['ROCK', 'COAL_ORE', 'IRON_ORE', ItemType.FURNACE, ItemType.ANVIL];
                     const woodTypes = ['TREE', 'BIRCH_TREE', ItemType.WOOD, ItemType.PLANKS, 'CRAFTING_TABLE', ItemType.DOOR, ItemType.LADDER];

                     if (stoneTypes.includes(ent.type as string)) {
                         isMining = true;
                         if (activeItem === ItemType.PICKAXE_WOOD || activeItem === ItemType.PICKAXE_STONE) {
                             effectiveDamage = GAME_BALANCE.PICKAXE_MINING_DAMAGE;
                         } else {
                             effectiveDamage = 0;
                         }
                     } else if (woodTypes.includes(ent.type as string)) {
                         isMining = true;
                         effectiveDamage = GAME_BALANCE.HAND_MINING_DAMAGE;
                         if (activeItem === ItemType.AXE_WOOD || activeItem === ItemType.AXE_STONE) {
                             effectiveDamage = GAME_BALANCE.AXE_MINING_DAMAGE;
                         }
                     } else if (ent.type === ItemType.TORCH) {
                         isMining = true;
                         effectiveDamage = 100;
                     }

                     if (isMining) {
                         if (effectiveDamage > 0) {
                             ent.hp -= effectiveDamage;
                             spawnParticles(w, ent.pos, ent.color, 2);
                             if (ent.hp <= 0) {
                                 // Drops logic
                                 if (ent.type === 'TREE') {
                                     for(let j=0; j<3; j++) dropItem(w, ent.pos, ItemType.WOOD);
                                 } else if (ent.type === 'BIRCH_TREE') {
                                     for(let j=0; j<3; j++) dropItem(w, ent.pos, ItemType.BIRCH_WOOD);
                                 } else if (ent.type === 'ROCK') {
                                     dropItem(w, ent.pos, ItemType.STONE);
                                     dropItem(w, ent.pos, ItemType.STONE);
                                 } else if (ent.type === 'COAL_ORE') {
                                     dropItem(w, ent.pos, ItemType.COAL);
                                     dropItem(w, ent.pos, ItemType.STONE);
                                 } else if (ent.type === 'IRON_ORE') {
                                     dropItem(w, ent.pos, ItemType.IRON);
                                     dropItem(w, ent.pos, ItemType.STONE);
                                 } else if (ent.type === ItemType.FURNACE) {
                                     dropItem(w, ent.pos, ItemType.FURNACE);
                                 } else if (ent.type === ItemType.ANVIL) {
                                     dropItem(w, ent.pos, ItemType.ANVIL);
                                 } else if (ent.type === ItemType.TORCH) {
                                     dropItem(w, ent.pos, ItemType.TORCH);
                                 } else if (ent.type === ItemType.WOOD) {
                                     dropItem(w, ent.pos, ItemType.WOOD);
                                 } else if (ent.type === ItemType.PLANKS) {
                                     dropItem(w, ent.pos, ItemType.PLANKS);
                                 } else if (ent.type === ItemType.CRAFTING_TABLE) {
                                     dropItem(w, ent.pos, ItemType.CRAFTING_TABLE);
                                 } else if (ent.type === ItemType.DOOR) {
                                     dropItem(w, ent.pos, ItemType.DOOR);
                                 } else if (ent.type === ItemType.LADDER) {
                                     dropItem(w, ent.pos, ItemType.LADDER);
                                 }
                                 
                                 w.entities.splice(i, 1);
                                 if (ent.type === 'CRAFTING_TABLE' || ent.type === ItemType.ANVIL) {
                                     c.isInventoryOpen = false;
                                     c.isCraftingTableOpen = false;
                                     c.isAnvilOpen = false;
                                 }
                             }
                         }
                     } else {
                         // Combat (If Client, might desync with Host, but visual feedback is good)
                         let combatDamage = 5;
                         if (activeItem === ItemType.SWORD_WOOD) combatDamage = 15;
                         if (activeItem === ItemType.SWORD_STONE) combatDamage = 25;
                         if (activeItem === ItemType.AXE_WOOD) combatDamage = 10;
                         if (activeItem === ItemType.AXE_STONE) combatDamage = 15;
                         if (activeItem === ItemType.PICKAXE_WOOD) combatDamage = 8;

                         ent.hp -= combatDamage;
                         const push = normalizeVector(getVector(c.pos, ent.pos));
                         ent.pos.x += push.x * 15;
                         ent.pos.y += push.y * 15;
                         ent.state = 'FLEEING'; 
                         spawnParticles(w, ent.pos, '#fff', 3);
                         
                         if (ent.hp <= 0) {
                             w.entities.splice(i, 1);
                             if (ent.type === MobType.COW) dropItem(w, ent.pos, ItemType.RAW_BEEF);
                             if (ent.type === MobType.ZOMBIE) dropItem(w, ent.pos, ItemType.STONE);
                             if (ent.type === MobType.SKELETON) dropItem(w, ent.pos, ItemType.STICK);
                             if (ent.type === MobType.CHICKEN) dropItem(w, ent.pos, ItemType.RAW_BEEF);
                             if (ent.type === MobType.SHEEP) dropItem(w, ent.pos, ItemType.RAW_BEEF);
                             if (ent.type === MobType.SLIME || ent.type === MobType.GIANT_SLIME) dropItem(w, ent.pos, ItemType.SLIME_BALL);
                             if (ent.type === MobType.SPIDER) dropItem(w, ent.pos, ItemType.STRING);
                         }
                     }
                 }
             }
         }
     }
  }

  // Mobs & Entities Update - ONLY HOST runs this
  if (!isClient) {
      for (let i = w.entities.length - 1; i >= 0; i--) {
          const ent = w.entities[i];

          // Torch Decay
          if (ent.type === ItemType.TORCH && ent.maxLife !== undefined) {
              ent.maxLife--; 
              if (ent.maxLife <= 0) {
                  w.entities.splice(i, 1);
                  continue;
              }
              if (Math.random() < 0.1) {
                  spawnParticles(w, { x: ent.pos.x, y: ent.pos.y - 5}, '#e65100', 1);
              }
          }
          
          const staticTypes = [
            'TREE', 'BIRCH_TREE', 'CRAFTING_TABLE', 'ROCK', 'COAL_ORE', 'IRON_ORE',
            ItemType.WOOD, ItemType.PLANKS, ItemType.FURNACE, ItemType.ANVIL, ItemType.TORCH, ItemType.DOOR, ItemType.LADDER
          ];
          if (staticTypes.includes(ent.type as string)) continue;
          
          const isHostile = [MobType.ZOMBIE, MobType.SKELETON, MobType.CREEPER, MobType.SLIME, MobType.SPIDER, MobType.GIANT_SLIME].includes(ent.type as MobType);
          
          if (isHostile) {
              updateHostileMob(ent, c.pos, w, setStats);
          } else {
              updatePassiveMob(ent);
          }
      }
  }

  // Item Pickup
  for (let i = w.items.length - 1; i >= 0; i--) {
      const item = w.items[i];
      if (getDistance(c.pos, item.pos) < 30) {
          addToInventory(c.inventory, item.type);
          w.items.splice(i, 1);
      }
      if (!isClient) {
        item.life--;
        if (item.life <= 0) w.items.splice(i, 1);
      }
  }

  if (c.meleeActive) {
    c.meleeTimer--;
    if (c.meleeTimer <= 0) c.meleeActive = false;
  }
  
  if (c.healCooldown > 0) c.healCooldown--;

  for (let i = w.particles.length - 1; i >= 0; i--) {
    const part = w.particles[i];
    part.pos.x += part.vel.x;
    part.pos.y += part.vel.y;
    part.life--;
    if (part.life <= 0) w.particles.splice(i, 1);
  }

  if (stats.hp <= 0) {
      c.inventory.forEach(slot => {
          if (slot.item !== ItemType.EMPTY && slot.count > 0) {
               for (let k = 0; k < slot.count; k++) {
                   world.items.push({
                       id: Math.random().toString(),
                       type: slot.item,
                       pos: { 
                           x: c.pos.x + (Math.random() - 0.5) * 60, 
                           y: c.pos.y + (Math.random() - 0.5) * 60 
                       },
                       life: 10800 
                   });
               }
               slot.item = ItemType.EMPTY;
               slot.count = 0;
          }
      });
      
      setGameState(GameState.GAME_OVER);
  }
};

const addToInventory = (inv: { item: ItemType, count: number }[], type: ItemType) => {
    for (let slot of inv) {
        if (slot.item === type && slot.count < MAX_STACK) {
            slot.count++;
            return;
        }
    }
    for (let slot of inv) {
        if (slot.item === ItemType.EMPTY) {
            slot.item = type;
            slot.count = 1;
            return;
        }
    }
};
