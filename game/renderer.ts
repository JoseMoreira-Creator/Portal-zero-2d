
import { GAME_BALANCE, BLOCK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, MINING_AREA_WIDTH, MINING_AREA_HEIGHT } from '../constants';
import { COLORS } from '../assets/art';
import { Entity, Particle, Vector2, CursorState, ItemType, WorldState, MobType, Projectile, GameSettings, RemotePlayer } from '../types';
import { LOADED_SPRITES } from '../assets/sprites';

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  world: WorldState;
  settings?: GameSettings; 
}

let maskCanvas: HTMLCanvasElement | null = null;

// Noise helper for ground texture
const noise = (x: number, y: number) => {
    return Math.abs(Math.sin(x * 12.9898 + y * 78.233)) * 43758.5453 % 1;
};

// Helper function to draw sprite safely
const drawSprite = (ctx: CanvasRenderingContext2D, key: string, x: number, y: number, w: number, h: number): boolean => {
    const img = LOADED_SPRITES[key];
    if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, x - w/2, y - h/2, w, h);
        return true;
    }
    return false;
};

export const renderGame = ({ ctx, canvasWidth, canvasHeight, world, settings }: RenderContext) => {
  const { particles, entities, items, cursor, cameraPos, camShake, frameCount, timeOfDay, projectiles, waterBodies, zoom, dimension, remotePlayers, myId } = world;
  const animationsEnabled = settings?.animations ?? true;

  // Clear Background & Pre-fill with Base Color to prevent Grid Lines
  const bgColor = dimension === 'UNDERGROUND' ? COLORS.BG_UNDERGROUND : COLORS.GRASS_BASE_1;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  
  // --- CAMERA TRANSFORM ---
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  ctx.translate(centerX, centerY);
  ctx.scale(zoom, zoom);
  ctx.translate(-centerX, -centerY);

  const camX = centerX - cameraPos.x;
  const camY = centerY - cameraPos.y;
  ctx.translate(camX, camY);

  const shakeX = (Math.random() - 0.5) * camShake;
  const shakeY = (Math.random() - 0.5) * camShake;
  ctx.translate(shakeX, shakeY);


  // 1. Draw Map Tiles (Details Only)
  const visibleWidth = canvasWidth / zoom;
  const visibleHeight = canvasHeight / zoom;
  const currentWorldW = dimension === 'SURFACE' ? WORLD_WIDTH : MINING_AREA_WIDTH;
  const currentWorldH = dimension === 'SURFACE' ? WORLD_HEIGHT : MINING_AREA_HEIGHT;

  const startX = Math.floor((cameraPos.x - visibleWidth/2) / BLOCK_SIZE) - 2;
  const endX = Math.ceil((cameraPos.x + visibleWidth/2) / BLOCK_SIZE) + 2;
  const startY = Math.floor((cameraPos.y - visibleHeight/2) / BLOCK_SIZE) - 2;
  const endY = Math.ceil((cameraPos.y + visibleHeight/2) / BLOCK_SIZE) + 2;

  // Disable image smoothing for pixel art look
  ctx.imageSmoothingEnabled = false; 

  // Draw Void Borders
  ctx.fillStyle = '#000';
  if (startX * BLOCK_SIZE < 0) ctx.fillRect(startX * BLOCK_SIZE, startY * BLOCK_SIZE, -startX * BLOCK_SIZE, (endY - startY) * BLOCK_SIZE); // Left
  
  // Ground Details Loop
  for (let i = startX; i <= endX; i++) {
      for (let j = startY; j <= endY; j++) {
          const x = i * BLOCK_SIZE;
          const y = j * BLOCK_SIZE;
          const isVoid = x < 0 || x >= currentWorldW || y < 0 || y >= currentWorldH;

          if (isVoid) {
             ctx.fillStyle = '#000000'; 
             ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
          } else {
             if (dimension === 'UNDERGROUND') {
                 // Underground Background
                 if ((i+j)%2 === 0) {
                     ctx.fillStyle = '#3E2F26'; 
                     ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                 } else {
                     ctx.fillStyle = '#45352B'; 
                     ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                 }
                 if (noise(i, j) > 0.8) {
                     ctx.fillStyle = '#564438';
                     ctx.fillRect(x + 10, y + 10, 6, 6);
                 }
             } else {
                 // Surface Island/Beach
                 const dist = Math.hypot(i - 25, j - 25);
                 if (dist > 22) {
                     ctx.fillStyle = '#1e90ff'; // Water
                     ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                 } else if (dist > 18) {
                     ctx.fillStyle = '#f4d03f'; // Sand
                     ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                 } else {
                     // Grass
                     const n = noise(i, j);
                     if (n > 0.6) {
                         ctx.fillStyle = COLORS.GRASS_BASE_2;
                         ctx.fillRect(x + 4, y + 4, 24, 24);
                     } else if (n > 0.4) {
                         ctx.fillStyle = COLORS.GRASS_DETAIL;
                         ctx.fillRect(x + 12, y + 12, 4, 4);
                         ctx.fillRect(x + 16, y + 10, 2, 6);
                     }
                 }
             }
          }
      }
  }

  // 1.5 Draw Water Bodies (Blob)
  waterBodies.forEach(lake => {
      // Check if any circle is visible
      let visible = false;
      for(const circle of lake.circles) {
          if (circle.x + circle.radius > (cameraPos.x - visibleWidth/2) && circle.x - circle.radius < (cameraPos.x + visibleWidth/2) &&
              circle.y + circle.radius > (cameraPos.y - visibleHeight/2) && circle.y - circle.radius < (cameraPos.y + visibleHeight/2)) {
              visible = true;
              break;
          }
      }
      if (!visible) return;

      ctx.fillStyle = COLORS.WATER;
      ctx.strokeStyle = '#4FA4B8';
      ctx.lineWidth = 4;

      // Draw all circles
      for(const circle of lake.circles) {
          ctx.beginPath();
          ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
      }
      
      // Draw waves (simplified for blob)
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      for(const circle of lake.circles) {
          const waveOffset = Math.sin(frameCount * 0.05 + circle.x) * 5;
          ctx.fillRect(circle.x - circle.radius, circle.y + waveOffset, circle.radius * 2, 4);
      }
  });

  // 2. Draw Items (Drops)
  items.forEach(item => {
      const bob = animationsEnabled ? Math.sin(frameCount * 0.15) * 3 : 0;
      ctx.save();
      ctx.translate(item.pos.x, item.pos.y + bob);
      
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-4, 2, 8, 4);

      if (!drawSprite(ctx, item.type, 0, 0, 12, 12)) {
          renderIcon(ctx, item.type, 12);
      }
      ctx.restore();
  });

  // 3. Draw Entities, Player & REMOTE PLAYERS
  type Renderable = 
    | { type: 'ENTITY', data: Entity, y: number }
    | { type: 'PLAYER', data: CursorState, y: number }
    | { type: 'REMOTE', data: RemotePlayer, y: number };

  const renderList: Renderable[] = [
      ...entities.map(e => ({ type: 'ENTITY', data: e, y: e.pos.y } as Renderable)),
      { type: 'PLAYER', data: cursor, y: cursor.pos.y } as Renderable
  ];
  
  // Add Remote Players
  if (remotePlayers) {
      Object.values(remotePlayers).forEach(rp => {
          if (rp.id !== myId) { // Don't draw ourselves twice if host reflects data
              renderList.push({ type: 'REMOTE', data: rp, y: rp.pos.y } as Renderable);
          }
      });
  }

  renderList.sort((a, b) => a.y - b.y);

  renderList.forEach(obj => {
      if (obj.type === 'ENTITY') {
          drawEntityBase(ctx, obj.data as Entity, frameCount, animationsEnabled);
      } else if (obj.type === 'PLAYER') {
          renderAdventurer(ctx, obj.data as CursorState, frameCount, world, settings, true);
      } else if (obj.type === 'REMOTE') {
          renderRemotePlayer(ctx, obj.data as RemotePlayer, frameCount, world, settings);
      }
  });

  // 4. Draw Particles
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.pos.x, p.pos.y, p.size, p.size);
  });

  // 5. Draw Projectiles
  projectiles.forEach(p => {
      ctx.save();
      ctx.translate(p.pos.x, p.pos.y);
      if (p.type === 'TORCH') {
          ctx.rotate(frameCount * 0.2);
          renderIcon(ctx, ItemType.TORCH, 16);
      } else {
          const angle = Math.atan2(p.vel.y, p.vel.x);
          ctx.rotate(angle);
          
          if (p.isEnemy) {
              ctx.fillStyle = '#fff';
              ctx.fillRect(-6, -2, 12, 4);
          } else {
              ctx.fillStyle = '#5D4037';
              ctx.fillRect(-10, -1, 20, 2);
              ctx.fillStyle = '#cfd8dc';
              ctx.fillRect(-10, -3, 6, 6);
          }
      }
      ctx.restore();
  });

  // 7. Day/Night Overlay
  let alpha = 0;
  if (dimension === 'SURFACE') {
      if (timeOfDay > 12000 && timeOfDay < 23000) {
          alpha = 0.85; 
          if (timeOfDay < 13000) alpha = (timeOfDay - 12000) / 1000 * 0.85;
          if (timeOfDay > 22000) alpha = (23000 - timeOfDay) / 1000 * 0.85;
      }
  } else {
      alpha = 0.96; 
  }

  if (alpha > 0) {
      if (!maskCanvas) maskCanvas = document.createElement('canvas');
      if (maskCanvas.width !== canvasWidth || maskCanvas.height !== canvasHeight) {
          maskCanvas.width = canvasWidth;
          maskCanvas.height = canvasHeight;
      }
      
      const mCtx = maskCanvas.getContext('2d');
      if (mCtx) {
          mCtx.clearRect(0, 0, canvasWidth, canvasHeight);
          mCtx.save();
          mCtx.translate(centerX, centerY);
          mCtx.scale(zoom, zoom);
          mCtx.translate(-centerX, -centerY);
          mCtx.translate(camX, camY);

          mCtx.globalAlpha = alpha;
          mCtx.fillStyle = dimension === 'SURFACE' ? '#0a0a1a' : '#000000';
          const viewX = cameraPos.x - visibleWidth/2 - 100;
          const viewY = cameraPos.y - visibleHeight/2 - 100;
          mCtx.fillRect(viewX, viewY, visibleWidth + 200, visibleHeight + 200);
          
          mCtx.globalAlpha = 1.0;
          mCtx.globalCompositeOperation = 'destination-out';
          
          // Player Light
          const pX = cursor.pos.x;
          const pY = cursor.pos.y - 10; 
          const gradient = mCtx.createRadialGradient(pX, pY, 20, pX, pY, 200);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          mCtx.fillStyle = gradient;
          mCtx.fillRect(pX - 200, pY - 200, 400, 400);

          // Remote Player Lights
          if (remotePlayers) {
             Object.values(remotePlayers).forEach(rp => {
                 const g = mCtx.createRadialGradient(rp.pos.x, rp.pos.y - 10, 20, rp.pos.x, rp.pos.y - 10, 200);
                 g.addColorStop(0, 'rgba(255, 255, 255, 1)');
                 g.addColorStop(1, 'rgba(255, 255, 255, 0)');
                 mCtx.fillStyle = g;
                 mCtx.fillRect(rp.pos.x - 200, rp.pos.y - 210, 400, 400);
             });
          }

          // Torch/Entity Lights
          entities.forEach(ent => {
              if (ent.type === ItemType.TORCH || ent.type === ItemType.FURNACE || ent.type === ItemType.LADDER) {
                  const flicker = animationsEnabled ? Math.random() * 5 : 2;
                  let radius = 220; 
                  if (ent.type === ItemType.FURNACE) radius = 140;
                  if (ent.type === ItemType.LADDER) radius = 90; 

                  const g = mCtx.createRadialGradient(ent.pos.x, ent.pos.y, 10, ent.pos.x, ent.pos.y, radius + flicker);
                  g.addColorStop(0, 'rgba(255, 200, 150, 0.9)');
                  g.addColorStop(1, 'rgba(255, 200, 150, 0)');
                  mCtx.fillStyle = g;
                  const r = radius + flicker;
                  mCtx.fillRect(ent.pos.x - r, ent.pos.y - r, r * 2, r * 2);
              }
          });
          
          mCtx.restore(); 
          ctx.restore(); 
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0); 
          ctx.drawImage(maskCanvas, 0, 0);
          ctx.restore();
      } else { ctx.restore(); }
  } else { ctx.restore(); }
};

// --- ENTITY RENDERER ---

const drawEntityBase = (ctx: CanvasRenderingContext2D, ent: Entity, frameCount: number, animationsEnabled: boolean) => {
    ctx.save();
    ctx.translate(ent.pos.x, ent.pos.y);
    if (ent.faceDirection !== 0) ctx.scale(ent.faceDirection, 1);
    
    // Scale down by 0.5 to match 16x16 grid while keeping hardcoded drawing values
    ctx.scale(0.5, 0.5);

    const bob = (animationsEnabled && ent.state !== 'IDLE') ? Math.sin(frameCount * 0.2) * 2 : 0;
    const s = ent.size * 2; // Restore original size for drawing logic

    // --- TREES ---
    if (ent.type === 'TREE' || ent.type === 'BIRCH_TREE') {
        if (!drawSprite(ctx, ent.type, 0, -s*1.5, s*4, s*4)) {
            const isBirch = ent.type === 'BIRCH_TREE';
            const trunkColor = isBirch ? '#D7CCC8' : '#5D4037';
            const trunkDetail = '#3E2723';
            const leafColor = isBirch ? '#8BC34A' : '#2E7D32';
            const leafDetail = isBirch ? '#AED581' : '#4CAF50';
            
            const trunkW = 14; const trunkH = 50;
            ctx.fillStyle = trunkColor; ctx.fillRect(-trunkW/2, -trunkH, trunkW, trunkH);
            ctx.fillStyle = trunkDetail;
            ctx.fillRect(-2, -40, 4, 2); ctx.fillRect(3, -25, 2, 4);
            
            // Canopy
            const sway = animationsEnabled ? Math.sin(frameCount * 0.02 + ent.pos.x) * 3 : 0;
            ctx.translate(sway, -trunkH);
            ctx.fillStyle = leafColor;
            ctx.fillRect(-30, -15, 60, 30);
            ctx.fillRect(-20, -45, 40, 30);
            ctx.fillStyle = leafDetail;
            ctx.fillRect(-15, -35, 10, 10);
        }
    } 
    // --- ROCKS & ORES ---
    else if (ent.type === 'ROCK' || ent.type === 'COAL_ORE' || ent.type === 'IRON_ORE') {
        if (!drawSprite(ctx, ent.type, 0, 0, 32, 32)) {
            ctx.fillStyle = ent.color;
            ctx.fillRect(-16, -16, 32, 32);
            
            // Shading
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(-16, 0, 32, 16);
            
            if (ent.type === 'COAL_ORE' || ent.type === 'IRON_ORE') {
                ctx.fillStyle = ent.type === 'COAL_ORE' ? '#212121' : '#D7CCC8';
                ctx.fillRect(-5, -5, 4, 4); ctx.fillRect(4, 2, 3, 3);
            }
        }
    }
    // --- FURNACE ---
    else if (ent.type === ItemType.FURNACE) {
        ctx.fillStyle = '#546E7A';
        ctx.fillRect(-12, -12, 24, 24);
        ctx.fillStyle = '#37474F'; 
        ctx.fillRect(-12, -12, 24, 4); ctx.fillRect(-12, 8, 24, 4);
        ctx.fillStyle = '#263238'; ctx.fillRect(-6, 0, 12, 6);
        if (Math.random() > 0.3) {
            ctx.fillStyle = '#FF5722'; ctx.fillRect(-3, 0, 6, 6);
        }
    }
    // --- CRAFTING TABLE ---
    else if (ent.type === ItemType.CRAFTING_TABLE) {
        if (!drawSprite(ctx, ent.type, 0, 0, ent.size, ent.size)) {
            ctx.fillStyle = '#8D6E63'; // Wood
            ctx.fillRect(-16, -16, 32, 32);
            ctx.fillStyle = '#5D4037'; // Dark Wood Border
            ctx.fillRect(-16, -16, 32, 4);
            ctx.fillRect(-16, 12, 32, 4);
            // Tools hanging on side
            ctx.fillStyle = '#3E2723';
            ctx.fillRect(-10, -5, 4, 10); // Hammer handle
            ctx.fillStyle = '#9E9E9E';
            ctx.fillRect(-12, -8, 8, 4); // Hammer head
            // Saw
            ctx.fillStyle = '#BDBDBD';
            ctx.beginPath(); ctx.moveTo(5, -8); ctx.lineTo(10, 5); ctx.lineTo(14, 5); ctx.lineTo(9, -8); ctx.fill();
        }
    }
    // --- ANVIL ---
    else if (ent.type === ItemType.ANVIL) {
        if (!drawSprite(ctx, ent.type, 0, 0, ent.size, ent.size)) {
            ctx.fillStyle = '#455A64'; // Dark Steel
            // Base
            ctx.fillRect(-12, 8, 24, 8);
            // Neck
            ctx.fillRect(-8, 0, 16, 8);
            // Top
            ctx.fillRect(-16, -8, 32, 8);
            ctx.fillStyle = '#263238'; // Shadow
            ctx.fillRect(-16, -2, 32, 2);
        }
    }
    // --- LADDER ---
    else if (ent.type === ItemType.LADDER) {
        if (!drawSprite(ctx, ent.type, 0, 0, ent.size, ent.size)) {
            ctx.fillStyle = '#8D6E63';
            // Rails
            ctx.fillRect(-8, -16, 3, 32);
            ctx.fillRect(5, -16, 3, 32);
            // Rungs
            for(let i=0; i<4; i++) {
                ctx.fillRect(-8, -12 + (i*8), 16, 2);
            }
        }
    }
    // --- DOOR ---
    else if (ent.type === ItemType.DOOR) {
        ctx.fillStyle = COLORS.WOOD;
        if (ent.isOpen) {
             ctx.fillRect(-14, -16, 6, 32);
             ctx.fillStyle = 'rgba(0,0,0,0.1)';
             ctx.fillRect(-8, -16, 22, 32);
        } else {
             ctx.fillRect(-12, -16, 24, 32);
             ctx.fillStyle = '#A1887F';
             ctx.fillRect(-8, -12, 8, 10); ctx.fillRect(-8, 2, 8, 10);
             ctx.fillStyle = '#FFD700'; ctx.fillRect(6, -2, 4, 4);
        }
    }
    else if (ent.type === ItemType.TORCH) {
        ctx.fillStyle = '#5D4037'; ctx.fillRect(-2, -5, 4, 10);
        const f = Math.random() * 3;
        ctx.fillStyle = '#FFC107'; ctx.fillRect(-4 - f/2, -12 - f/2, 8 + f, 8 + f);
        ctx.fillStyle = '#FF5722'; ctx.fillRect(-2, -10, 4, 4);
    }
    // --- PLANKS BLOCK ---
    else if (ent.type === ItemType.PLANKS) {
        // Base
        ctx.fillStyle = '#C19A6B'; 
        ctx.fillRect(-s/2, -s/2, s, s);
        // Texture
        ctx.fillStyle = '#A1887F';
        const pHeight = s / 4;
        for(let i = 0; i < 4; i++) {
             if (i > 0) ctx.fillRect(-s/2, -s/2 + i*pHeight, s, 2);
             if (i % 2 === 0) {
                 ctx.fillRect(-s/2 + 4, -s/2 + i*pHeight + 4, 2, 2);
                 ctx.fillRect(s/2 - 6, -s/2 + i*pHeight + 4, 2, 2);
             } else {
                 ctx.fillRect(0, -s/2 + i*pHeight + 4, 4, 2);
             }
        }
        // Border
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(-s/2, -s/2, s, s);
    }
    // --- WOOD BLOCK ---
    else if (ent.type === ItemType.WOOD || ent.type === ItemType.BIRCH_WOOD) {
         const isBirch = ent.type === ItemType.BIRCH_WOOD;
         const color = isBirch ? '#D7CCC8' : '#795548'; 
         const dark = isBirch ? '#A1887F' : '#4E342E';
         
         ctx.fillStyle = color;
         ctx.fillRect(-s/2, -s/2, s, s);
         
         // Bark Texture
         ctx.fillStyle = dark;
         ctx.fillRect(-s/2 + 4, -s/2, 4, s);
         ctx.fillRect(s/2 - 8, -s/2, 4, s);
         ctx.fillRect(-2, -s/2 + 4, 4, 8);
         ctx.fillRect(-2, s/2 - 12, 4, 8);
         
         ctx.strokeStyle = '#3E2723';
         ctx.lineWidth = 2;
         ctx.strokeRect(-s/2, -s/2, s, s);
    }
    else {
        // --- MOBS ---
        ctx.translate(0, bob);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-s/2, s/2 - s/8, s, s/4);

        if (drawSprite(ctx, ent.type, 0, -s/2, s, s)) {
            ctx.restore(); return;
        }

        const hs = s / 2;
        
        // --- PASSIVE MOBS ---
        if (ent.type === MobType.COW) {
            ctx.fillStyle = '#5D4037'; // Brown Body
            ctx.fillRect(-hs, -hs+4, s, s*0.6); 
            // Head
            ctx.fillRect(hs-6, -hs-2, 10, 10);
            // Horns
            ctx.fillStyle = '#9E9E9E';
            ctx.fillRect(hs-2, -hs-4, 2, 2); ctx.fillRect(hs+2, -hs-4, 2, 2);
            // Legs
            ctx.fillStyle = '#3E2723';
            ctx.fillRect(-hs+4, s/2 - 4, 4, 8); // Back leg
            ctx.fillRect(hs-8, s/2 - 4, 4, 8); // Front leg
            // Spots
            ctx.fillStyle = '#D7CCC8';
            ctx.fillRect(0, -hs+6, 6, 4);
            ctx.fillRect(-6, -hs+8, 4, 4);
        }
        else if (ent.type === MobType.SHEEP) {
            // Wool
            ctx.fillStyle = '#EEEEEE'; 
            ctx.fillRect(-hs, -hs+4, s, s*0.6);
            // Head
            ctx.fillStyle = '#D7CCC8'; 
            ctx.fillRect(hs-4, -hs, 8, 8);
            // Legs
            ctx.fillStyle = '#D7CCC8';
            ctx.fillRect(-hs+2, s/2 - 2, 4, 6); ctx.fillRect(hs-6, s/2 - 2, 4, 6);
            // Texture
            ctx.fillStyle = '#E0E0E0';
            ctx.fillRect(0, -hs+6, 4, 4); ctx.fillRect(-4, 0, 4, 4);
        }
        else if (ent.type === MobType.CHICKEN) {
            ctx.fillStyle = '#FFFFFF';
            // Body
            ctx.fillRect(-6, -4, 12, 10);
            // Head
            ctx.fillRect(2, -10, 6, 8);
            // Beak & Wattle
            ctx.fillStyle = '#FF9800'; ctx.fillRect(8, -6, 2, 2);
            ctx.fillStyle = '#F44336'; ctx.fillRect(4, -4, 2, 2);
            // Legs
            ctx.fillStyle = '#FF9800'; ctx.fillRect(-2, 6, 2, 4); ctx.fillRect(2, 6, 2, 4);
        }
        // --- HOSTILE MOBS ---
        else if (ent.type === MobType.SLIME || ent.type === MobType.GIANT_SLIME) {
            ctx.fillStyle = ent.color; 
            ctx.fillRect(-hs, -hs, s, s*0.8);
            // Core
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(-hs/2, -hs/2, hs, hs/2);
            // Eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(-6, -6, 4, 4);
            ctx.fillRect(4, -6, 4, 4);
        }
        else if (ent.type === MobType.ZOMBIE) {
            ctx.fillStyle = COLORS.ZOMBIE; ctx.fillRect(-6, -26, 12, 12); // Head
            ctx.fillStyle = '#1E88E5'; ctx.fillRect(-6, -14, 12, 14); // Shirt
            ctx.fillStyle = COLORS.ZOMBIE; ctx.fillRect(-10, -14, 4, 12); ctx.fillRect(6, -14, 4, 12); // Arms
            ctx.fillStyle = '#3949AB'; ctx.fillRect(-6, 0, 5, 8); ctx.fillRect(1, 0, 5, 8); // Pants
        }
        else if (ent.type === MobType.SKELETON) {
            const bone = '#E0E0E0';
            ctx.fillStyle = bone; 
            ctx.fillRect(-6, -26, 12, 12); // Head
            ctx.fillRect(-4, -14, 8, 12); // Ribs
            ctx.fillRect(-8, -14, 2, 12); // Right Arm
            ctx.fillRect(2, -14, 2, 12); // Left Arm (Holding Bow)
            ctx.fillRect(-5, -2, 2, 10); ctx.fillRect(3, -2, 2, 10); // Legs
            // Bow
            ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 2;
            ctx.strokeRect(8, -8, 8, 16);
        }
        else if (ent.type === MobType.CREEPER) {
            ctx.fillStyle = COLORS.CREEPER; 
            ctx.fillRect(-6, -26, 12, 12); // Head
            ctx.fillStyle = '#000'; // Face
            ctx.fillRect(-3, -22, 2, 2); ctx.fillRect(1, -22, 2, 2);
            ctx.fillRect(-2, -18, 4, 2); ctx.fillRect(-2, -16, 1, 2); ctx.fillRect(1, -16, 1, 2);
            ctx.fillStyle = COLORS.CREEPER; 
            ctx.fillRect(-6, -14, 12, 18); // Body
            ctx.fillRect(-8, 4, 4, 4); ctx.fillRect(4, 4, 4, 4); // Feet
        }
        else if (ent.type === MobType.SPIDER) {
            ctx.fillStyle = '#263238'; 
            ctx.fillRect(4, -4, 8, 8); // Head
            ctx.fillRect(-12, -4, 16, 12); // Abdomen
            ctx.fillStyle = '#F44336'; // Eyes
            ctx.fillRect(8, -2, 2, 2); ctx.fillRect(8, 0, 1, 1);
            // Legs
            ctx.strokeStyle = '#263238'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(4, -2); ctx.lineTo(0, -6); ctx.lineTo(-4, 4);
            ctx.moveTo(0, -2); ctx.lineTo(-4, -8); ctx.lineTo(-8, -2);
            ctx.stroke();
        }
        else {
             ctx.fillStyle = ent.color;
             ctx.fillRect(-hs, -hs*1.5, s, s);
        }
    }
    ctx.restore();
};


const renderAdventurer = (ctx: CanvasRenderingContext2D, cursor: CursorState, frameCount: number, world: WorldState, settings: GameSettings, isSelf: boolean = true) => {
    ctx.save();
    ctx.translate(cursor.pos.x, cursor.pos.y);
    ctx.scale(cursor.faceDirection, 1);
    
    // Scale down by 0.5 to match 16x16 grid
    ctx.scale(0.5, 0.5);
    
    // Render Coordinates
    if (settings.showCoordinates) {
        ctx.save();
        ctx.scale(cursor.faceDirection, 1); // Cancel out face flip for text
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-20, -60, 40, 12);
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`X:${Math.round(cursor.pos.x)} Y:${Math.round(cursor.pos.y)}`, 0, -51);
        ctx.restore();
    }
    
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-8, -3, 16, 6);

    if (drawSprite(ctx, 'PLAYER_IDLE', 0, -12, 32, 64)) {
    } else {
        const isMoving = cursor.keys.w || cursor.keys.a || cursor.keys.s || cursor.keys.d;
        const bob = isMoving ? Math.sin(frameCount * 0.3) * 2 : 0;
        ctx.translate(0, bob);
        // Default Skin
        const skin = '#FFCC80'; const shirt = '#29B6F6'; const pants = '#37474F'; const shoes = '#3E2723'; const hair = '#5D4037';
        
        // Remote player slight variation? For now same skin.
        
        const walk = isMoving ? Math.sin(frameCount * 0.4) * 4 : 0;
        ctx.fillStyle = pants; ctx.fillRect(-4 + walk, -2, 4, 10); ctx.fillRect(0 - walk, -2, 4, 10);
        ctx.fillStyle = shoes; ctx.fillRect(-4 + walk, 8, 4, 2); ctx.fillRect(0 - walk, 8, 4, 2);
        ctx.fillStyle = shirt; ctx.fillRect(-5, -14, 10, 12);
        ctx.fillStyle = skin; ctx.fillRect(-6, -24, 12, 10);
        ctx.fillStyle = hair; ctx.fillRect(-7, -26, 14, 4); ctx.fillRect(-7, -22, 2, 6);
        ctx.fillStyle = '#000'; ctx.fillRect(2, -20, 2, 2);
        ctx.fillStyle = skin; ctx.fillRect(-1, -12, 3, 8);
    }
    
    // Remote Name Tag
    if (!isSelf) {
        ctx.save();
        ctx.scale(cursor.faceDirection, 1); // Cancel out face flip for text
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-20, -45, 40, 12);
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("Player", 0, -36);
        ctx.restore();
    }

    const dx = cursor.mousePos.x - cursor.pos.x;
    const dy = cursor.mousePos.y - cursor.pos.y;
    let angle = Math.atan2(dy, dx);
    if (cursor.faceDirection === -1) angle = Math.PI - angle;

    if (cursor.meleeActive) {
         const progress = 1 - (cursor.meleeTimer / GAME_BALANCE.MELEE_DURATION_FRAMES);
         angle += (progress * Math.PI) - (Math.PI / 2);
    }
    
    ctx.save();
    ctx.translate(0, -12);
    ctx.rotate(angle);
    ctx.translate(10, 0); 
    
    const slot = cursor.inventory[cursor.hotbarSelectedIndex];
    if (slot.item !== ItemType.EMPTY) {
        ctx.rotate(Math.PI/4); 
        if (!drawSprite(ctx, slot.item, 0, 0, 16, 16)) {
             renderIcon(ctx, slot.item, 16);
        }
    }
    ctx.restore();
    ctx.restore();
};

const renderRemotePlayer = (ctx: CanvasRenderingContext2D, rp: RemotePlayer, frameCount: number, world: WorldState, settings: GameSettings) => {
    // Re-use logic for now, construct a dummy cursor state
    const dummyCursor: any = {
        pos: rp.pos,
        faceDirection: rp.faceDirection,
        keys: { w: rp.isMoving, a: false, s: false, d: false }, // Simulates walking bob
        mousePos: { x: rp.pos.x + 10 * rp.faceDirection, y: rp.pos.y }, // Dummy aim
        meleeActive: false,
        meleeTimer: 0,
        inventory: Array(9).fill({ item: ItemType.EMPTY, count: 0 }),
        hotbarSelectedIndex: 0
    };
    dummyCursor.inventory[0] = { item: rp.heldItem, count: 1 };

    renderAdventurer(ctx, dummyCursor, frameCount, world, settings, false);
};

const renderIcon = (ctx: CanvasRenderingContext2D, type: ItemType, size: number) => {
    const s = size / 2;
    const rect = (x:number, y:number, w:number, h:number, c:string) => { ctx.fillStyle = c; ctx.fillRect(x,y,w,h); };

    if (type.includes('SWORD')) {
        ctx.save(); ctx.rotate(-Math.PI/4);
        rect(-2, -s, 4, size-4, type.includes('WOOD') ? '#8D6E63' : (type.includes('STONE') ? '#9E9E9E' : '#CFD8DC'));
        rect(-6, 4, 12, 2, '#4E342E'); rect(-1, 6, 2, 4, '#3E2723');
        ctx.restore();
    }
    else if (type.includes('PICKAXE')) {
        ctx.save(); ctx.rotate(-Math.PI/4);
        rect(-1, -s+4, 2, size-4, '#5D4037');
        ctx.fillStyle = type.includes('WOOD') ? '#8D6E63' : (type.includes('STONE') ? '#9E9E9E' : '#CFD8DC');
        ctx.fillRect(-8, -s+2, 16, 4);
        ctx.restore();
    }
    else if (type.includes('AXE')) {
        ctx.save(); ctx.rotate(-Math.PI/4);
        rect(-1, -s+4, 2, size-4, '#5D4037');
        const headC = type.includes('WOOD') ? '#8D6E63' : (type.includes('STONE') ? '#9E9E9E' : '#CFD8DC');
        rect(-6, -s+2, 5, 8, headC);
        rect(1, -s+2, 3, 6, headC);
        ctx.restore();
    }
    else if (type === ItemType.BOW) {
        ctx.strokeStyle = '#8D6E63'; ctx.lineWidth = 2;
        ctx.strokeRect(0, -s, s, size);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke();
    }
    else if (type === ItemType.SHIELD) {
        rect(-s, -s, size, size, '#8D6E63');
        rect(-s+2, -s+2, size-4, size-4, '#5D4037');
        rect(-2, -2, 4, 4, '#BCAAA4');
    }
    else if (type === ItemType.STICK) {
        ctx.save(); ctx.rotate(-Math.PI/4);
        rect(-1, -s, 2, size, '#5D4037');
        ctx.restore();
    }
    else if (type === ItemType.PLANKS) {
        rect(-s, -s, size, size, '#C19A6B'); // Light Wood
        ctx.fillStyle = '#8B4513'; // Streaks
        ctx.fillRect(-s, -s+4, size, 1); ctx.fillRect(-s, -s+10, size, 1); ctx.fillRect(-s, -s+16, size, 1);
        ctx.strokeRect(-s, -s, size, size);
    }
    else if (type === ItemType.WOOD || type === ItemType.BIRCH_WOOD) {
        const isBirch = type === ItemType.BIRCH_WOOD;
        rect(-s, -s, size, size, isBirch ? '#D7CCC8' : '#795548');
        ctx.fillStyle = isBirch ? '#5D4037' : '#3E2723';
        ctx.fillRect(-s+2, -s+2, 4, size-4);
        ctx.fillRect(2, -s+4, 2, 4);
        ctx.strokeRect(-s, -s, size, size);
    }
    else if (type === ItemType.IRON) {
        // Ingot Shape
        ctx.fillStyle = '#CFD8DC';
        ctx.beginPath();
        ctx.moveTo(-s+2, -s+4); ctx.lineTo(s-2, -s+4); ctx.lineTo(s-4, s-4); ctx.lineTo(-s+4, s-4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(-4, -4, 4, 4); // Glint
    }
    else if (type === ItemType.COAL || type === ItemType.CHARCOAL) {
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.moveTo(-4, -6); ctx.lineTo(6, -4); ctx.lineTo(4, 6); ctx.lineTo(-6, 4);
        ctx.fill();
    }
    else if (type === ItemType.PAPER) {
        rect(-s+4, -s, size-8, size, '#FFF9C4');
        ctx.fillStyle = '#9E9E9E'; // Text lines
        ctx.fillRect(-2, -4, 6, 1); ctx.fillRect(-2, 0, 6, 1); ctx.fillRect(-2, 4, 4, 1);
    }
    else if (type === ItemType.MAP) {
        rect(-s, -s, size, size, '#F0F4C3');
        ctx.fillStyle = '#81C784'; ctx.fillRect(-4, -4, 4, 6);
        ctx.fillStyle = '#4FC3F7'; ctx.fillRect(2, 2, 4, 4);
        ctx.strokeRect(-s, -s, size, size);
    }
    else if (type === ItemType.VINE) {
        ctx.strokeStyle = '#ECEFF1'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-6, -6); ctx.quadraticCurveTo(5, 0, -6, 6); ctx.stroke();
    }
    else if (type === ItemType.RAW_BEEF || type === ItemType.STEAK) {
        const cooked = type === ItemType.STEAK;
        ctx.fillStyle = cooked ? '#5D4037' : '#E53935';
        ctx.fillRect(-s+2, -s+4, size-4, size-8);
        ctx.fillStyle = cooked ? '#3E2723' : '#FFCDD2'; // Marbling
        ctx.fillRect(-2, -2, 4, 2);
    }
    else if (type === ItemType.CRAFTING_TABLE) {
        rect(-s, -s, size, size, '#8D6E63'); // Wood base
        ctx.fillStyle = '#5D4037'; // Dark trim
        ctx.fillRect(-s, -s, size, 4);
        ctx.fillRect(-s, s-4, size, 4);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(-4, -4, 8, 8); // Center square
        ctx.strokeRect(-s, -s, size, size);
    }
    else if (type === ItemType.FURNACE) {
        rect(-s, -s, size, size, '#78909C'); // Stone
        ctx.fillStyle = '#37474F'; // Top/Bottom trim
        ctx.fillRect(-s, -s, size, 3);
        ctx.fillRect(-s, s-3, size, 3);
        ctx.fillStyle = '#212121'; // Opening
        ctx.fillRect(-6, -2, 12, 8);
        ctx.strokeRect(-s, -s, size, size);
    }
    else if (type === ItemType.ANVIL) {
        ctx.fillStyle = '#455A64';
        ctx.fillRect(-s+2, s-4, size-4, 4); // Base
        ctx.fillRect(-4, 0, 8, 8); // Neck
        ctx.fillRect(-s, -s+4, size, 8); // Top
    }
    else if (type === ItemType.TORCH) {
        ctx.save(); ctx.rotate(-Math.PI/4);
        rect(-2, -6, 4, 10, '#5D4037'); // Stick
        ctx.fillStyle = '#FFC107'; // Flame core
        ctx.fillRect(-3, -11, 6, 6);
        ctx.fillStyle = '#FF5722'; // Flame outer
        ctx.fillRect(-1.5, -9.5, 3, 3);
        ctx.restore();
    }
    else if (type === ItemType.DOOR) {
        rect(-s+4, -s, size-8, size, '#8D6E63');
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-s+6, -s+2, size-12, size/2 - 4);
        ctx.fillRect(-s+6, 2, size-12, size/2 - 4);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(s-6, -1, 3, 3);
    }
    else if (type === ItemType.LADDER) {
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(-s+4, -s, 3, size); // Left rail
        ctx.fillRect(s-7, -s, 3, size); // Right rail
        for(let i=1; i<4; i++) {
            ctx.fillRect(-s+4, -s + (i*(size/4)), size-10, 2); // Rungs
        }
    }
     else if (type === ItemType.POTION) {
        ctx.fillStyle = '#F44336'; // Red liquid
        ctx.fillRect(-6, -4, 12, 12);
        ctx.fillStyle = '#fff'; // Glass shine
        ctx.fillRect(-4, -2, 4, 4);
        ctx.fillStyle = '#aaa'; // Neck
        ctx.fillRect(-2, -8, 4, 4);
        ctx.fillStyle = '#8D6E63'; // Cork
        ctx.fillRect(-3, -10, 6, 2);
    }
    else if (type === ItemType.SLIME_CROWN) {
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.beginPath();
        ctx.moveTo(-s, 0); ctx.lineTo(-s, -4); ctx.lineTo(-s+4, 0); ctx.lineTo(0, -6); ctx.lineTo(s-4, 0); ctx.lineTo(s, -4); ctx.lineTo(s, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(-s, 0, size, 4); // Band
        ctx.fillStyle = '#4CAF50'; // Slime Gem
        ctx.fillRect(-2, -2, 4, 4);
    }
    else {
        // Fallback Blocks
        let c = '#fff';
        if (type === ItemType.STONE) c = '#9E9E9E';
        if (type === ItemType.SLIME_BALL) c = '#2196F3';
        
        rect(-s+2, -s+2, size-4, size-4, c);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
        ctx.strokeRect(-s+2, -s+2, size-4, size-4);
        
        // Add generic detail to fallback blocks
        if (type === ItemType.STONE || c === '#fff') {
             ctx.fillStyle = 'rgba(0,0,0,0.1)';
             ctx.fillRect(-s+4, -s+4, size/2, size/2);
        }
    }
}
