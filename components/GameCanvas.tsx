
import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import { GameState, ItemType, PlayerStats, InventorySlot, GameSettings, ChatMessage, WorldState, MobType } from '../types';
import { SCREEN_HEIGHT, SCREEN_WIDTH, GAME_BALANCE, MAX_STACK } from '../constants';
import { createInitialWorld, updateGame } from '../game/logic';
import { renderGame } from '../game/renderer';
import { useGameInput } from '../hooks/useGameInput';
import { Hud } from './UI/Hud';
import { MobileControls } from './UI/MobileControls';
import { useIsMobile } from '../hooks/useIsMobile';
import { Inventory } from './UI/Inventory';
import { Chat } from './UI/Chat';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { getDistance, normalizeVector, getVector, scaleVector } from '../utils/math';
import { ITEM_ICONS } from '../assets/art';

const ContextMenu: React.FC<{ 
    x: number, 
    y: number, 
    onAction: (action: string) => void, 
    onClose: () => void 
}> = ({ x, y, onAction, onClose }) => {
    return (
        <div 
            className="absolute z-50 bg-[#c6c6c6] border-2 border-black p-1 shadow-xl flex flex-col gap-1 pointer-events-auto"
            style={{ left: x, top: y }}
        >
            <button 
                className="mc-btn px-4 py-1 text-sm font-bold text-left hover:bg-[#d6d6d6]"
                onClick={() => { onAction('CHOP'); onClose(); }}
            >
                🪓 CHOP
            </button>
            <button 
                className="mc-btn px-4 py-1 text-sm font-bold text-left hover:bg-[#d6d6d6]"
                onClick={() => { onAction('INSPECT'); onClose(); }}
            >
                🔍 INSPECT
            </button>
            <button 
                className="mc-btn px-4 py-1 text-sm font-bold text-left hover:bg-[#d6d6d6]"
                onClick={onClose}
            >
                ❌ CLOSE
            </button>
        </div>
    );
};

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  activeSlot: ItemType;
  setActiveSlot: (item: ItemType) => void;
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  onOpenOptions: () => void;
  initialWorldState: WorldState | null;
  saveRef: React.MutableRefObject<{ saveGame: () => { world: WorldState, thumb: string } } | null>;
  multiplayerMode: 'HOST' | 'JOIN' | null;
  joinId: string;
  multiplayerRef: React.MutableRefObject<any>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  setGameState, 
  stats, 
  setStats, 
  activeSlot,
  setActiveSlot,
  settings,
  setSettings,
  onOpenOptions,
  initialWorldState,
  saveRef,
  multiplayerMode,
  joinId,
  multiplayerRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use initial state if provided, otherwise create new
  const world = useRef<WorldState>(initialWorldState || createInitialWorld(SCREEN_WIDTH, SCREEN_HEIGHT));
  
  // Update ref if initial state changes (e.g. loading a different world)
  useEffect(() => {
    if (initialWorldState) {
        world.current = initialWorldState;
    } else if (!world.current) {
        // Fallback for safety
        world.current = createInitialWorld(SCREEN_WIDTH, SCREEN_HEIGHT);
    }
  }, [initialWorldState]);

  const [showInventory, setShowInventory] = useState(false);
  const [cursorStyle, setCursorStyle] = useState('cursor-none');
  const [controlsVisible, setControlsVisible] = useState(true);
  
  const [inventorySnapshot, setInventorySnapshot] = useState<InventorySlot[]>([]);
  const [hotbarIndex, setHotbarIndex] = useState(0);
  const [dayCount, setDayCount] = useState(1);
  const [mapOpen, setMapOpen] = useState(false);

  // CHAT STATE
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInitialChar, setChatInitialChar] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, entityId: string } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ index: number, x: number, y: number } | null>(null);
  const isMobile = useIsMobile();

  // MULTIPLAYER HOOK
  const mpControls = useMultiplayer({ gameState, world, setChatMessages });
  
  useEffect(() => {
      multiplayerRef.current = mpControls;
  }, [mpControls]);

  // Handle Multiplayer Auto-Connect
  useEffect(() => {
      if (gameState === GameState.PLAYING && multiplayerMode === 'HOST' && !world.current.isMultiplayer) {
          mpControls.hostGame().then(id => {
              setChatMessages(prev => [...prev, { id: 'sys', text: `Hosting Game! ID copied to clipboard.`, sender: 'SYSTEM', timestamp: Date.now() }]);
              // Copy to clipboard for easy sharing
              navigator.clipboard.writeText(id);
          }).catch(err => alert("Failed to host: " + err));
      } else if (gameState === GameState.PLAYING && multiplayerMode === 'JOIN' && !world.current.isMultiplayer) {
          mpControls.joinGame(joinId).then(() => {
              setChatMessages(prev => [...prev, { id: 'sys', text: `Connected to Host!`, sender: 'SYSTEM', timestamp: Date.now() }]);
          }).catch(err => {
              alert("Failed to join: " + err);
              setGameState(GameState.MULTIPLAYER_MENU);
          });
      }
  }, [gameState, multiplayerMode, joinId]);

  // Expose Save functionality to parent
  useEffect(() => {
      saveRef.current = {
          saveGame: () => {
              // 1. Capture Thumbnail
              let thumb = '';
              if (canvasRef.current) {
                  // Create a small temporary canvas to resize the thumbnail (save space)
                  const tempCanvas = document.createElement('canvas');
                  const w = 200;
                  const h = 150;
                  tempCanvas.width = w;
                  tempCanvas.height = h;
                  const tCtx = tempCanvas.getContext('2d');
                  if (tCtx) {
                      tCtx.drawImage(canvasRef.current, 0, 0, w, h);
                      thumb = tempCanvas.toDataURL('image/jpeg', 0.6); // Low quality JPEG
                  }
              }

              // 2. Return State and Thumb
              return {
                  world: world.current,
                  thumb: thumb
              };
          }
      };
      return () => { saveRef.current = null; };
  }, [saveRef]);

  // Handle Respawn Logic (Reset Position)
  useEffect(() => {
     if (gameState === GameState.PLAYING && world.current && stats.hp <= 0) {
          world.current.cursor.pos = {
             x: window.innerWidth / 2,
             y: window.innerHeight / 2
         };
     }
  }, [gameState, stats.hp]);

  // Sync Zoom from Settings to World
  useEffect(() => {
      if (world.current) {
          world.current.zoom = settings.zoom;
      }
  }, [settings.zoom]);

  useEffect(() => {
      const interval = setInterval(() => {
          if (world.current) {
              setInventorySnapshot([...world.current.cursor.inventory]);
              setHotbarIndex(world.current.cursor.hotbarSelectedIndex);
              setShowInventory(world.current.cursor.isInventoryOpen);
              setDayCount(world.current.dayCount);
              setMapOpen(world.current.cursor.isMapOpen);
              
              // Cursor Interaction Logic
              if (chatOpen || (world.current.cursor.hoverTarget && !world.current.cursor.isInventoryOpen)) {
                  setCursorStyle('cursor-pointer'); // Show cursor for chat interaction
              } else if (gameState === GameState.PLAYING && !world.current.cursor.isInventoryOpen) {
                  setCursorStyle('cursor-none');
              } else {
                  setCursorStyle('cursor-default');
              }
          }
      }, 100);
      return () => clearInterval(interval);
  }, [gameState, chatOpen]);

  const handleInventoryUpdate = (newInv: InventorySlot[]) => {
      if (world.current) {
          world.current.cursor.inventory = newInv;
          setInventorySnapshot(newInv);
      }
  };

  useGameInput({ 
      gameState, 
      world, 
      setActiveSlot,
      toggleMap: () => {
          // 'M' Key Logic moved here
          if (world.current) {
               const idx = world.current.cursor.hotbarSelectedIndex;
               const held = world.current.cursor.inventory[idx];
               if (held.item === ItemType.MAP) {
                   world.current.cursor.isMapOpen = !world.current.cursor.isMapOpen;
               }
          }
      },
      isChatOpen: chatOpen,
      currentZoom: settings.zoom,
      onZoomChange: (z) => setSettings(prev => ({ ...prev, zoom: z }))
  });

  // CHAT KEYBOARD LISTENER
  useEffect(() => {
      const handleChatKey = (e: KeyboardEvent) => {
          if (gameState !== GameState.PLAYING) return;
          if (chatOpen) return; // Handled by Chat input
          
          if (e.key === 't' || e.key === 'T') {
              e.preventDefault();
              setChatOpen(true);
              setChatInitialChar('');
          } else if (e.key === '/') {
              e.preventDefault();
              setChatOpen(true);
              setChatInitialChar('/');
          }
      };

      window.addEventListener('keydown', handleChatKey);
      return () => window.removeEventListener('keydown', handleChatKey);
  }, [gameState, chatOpen]);

  // COMBAT INPUT HANDLING (Tap vs Drag)
  const mouseDownTime = useRef<number>(0);
  const mouseDownPos = useRef<{x: number, y: number}>({x:0, y:0});

  useEffect(() => {
      const handleMouseDown = (e: MouseEvent) => {
        if (gameState !== GameState.PLAYING) return;
        if (world.current.cursor.isInventoryOpen) return;
        if (chatOpen) return;

        mouseDownTime.current = Date.now();
        mouseDownPos.current = { x: e.clientX, y: e.clientY };

        if (e.button === 2) {
          // Parry (Right Click)
          if (world.current.cursor.parryCooldown <= 0) {
            world.current.cursor.parryActive = true;
            world.current.cursor.parryTimer = 0;
          }
        }
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (gameState !== GameState.PLAYING) return;

        if (draggedItem) {
            const dropPos = world.current.cursor.mousePos;
            const slot = world.current.cursor.inventory[draggedItem.index];
            if (slot.item !== ItemType.EMPTY) {
                // Throw logic
                if (slot.item === ItemType.TORCH) {
                    world.current.projectiles.push({
                        id: Math.random().toString(),
                        pos: { ...world.current.cursor.pos },
                        vel: scaleVector(normalizeVector(getVector(world.current.cursor.pos, dropPos)), 12),
                        radius: 8,
                        isEnemy: false,
                        damage: 25,
                        color: '#ff6600',
                        type: 'TORCH',
                        life: 100
                    });
                    slot.count--;
                    if (slot.count <= 0) slot.item = ItemType.EMPTY;
                } else {
                    // Drop item
                    world.current.items.push({
                        id: Math.random().toString(),
                        type: slot.item,
                        pos: { ...dropPos },
                        life: 600
                    });
                    slot.count--;
                    if (slot.count <= 0) slot.item = ItemType.EMPTY;
                }
            }
            setDraggedItem(null);
            return;
        }

        if (world.current.cursor.isInventoryOpen) return;
        if (chatOpen) return;

        if (e.button === 0) {
          // Left Click Release
          const duration = Date.now() - mouseDownTime.current;
          const dist = Math.hypot(e.clientX - mouseDownPos.current.x, e.clientY - mouseDownPos.current.y);

          if (duration < 200 && dist < 20) {
            // TAP -> Check for Tree or Move
            const mouseWorldPos = world.current.cursor.mousePos;
            const tree = world.current.entities.find(ent => 
                (ent.type === 'TREE' || ent.type === 'BIRCH_TREE') && 
                getDistance(mouseWorldPos, ent.pos) < 40
            );

            if (tree) {
                setContextMenu({ x: e.clientX, y: e.clientY, entityId: tree.id });
                world.current.cursor.targetPos = null;
                world.current.cursor.autoAction = 'NONE';
                world.current.cursor.autoTargetId = null;
            } else if (!isMobile || !controlsVisible) {
                // TOUCH TO MOVE (Only if controls are hidden or not on mobile)
                world.current.cursor.targetPos = { ...mouseWorldPos };
                setContextMenu(null);
                world.current.cursor.autoAction = 'NONE';
                world.current.cursor.autoTargetId = null;
            }
          } else {
            // DRAG -> SLINGSHOT
            world.current.cursor.autoAction = 'NONE';
            world.current.cursor.autoTargetId = null;
            // Calculate power based on drag distance
            const power = Math.min(dist / 10, 20); // Cap power
            if (power > 3 && world.current.cursor.bowCooldown <= 0) {
                // Spawn Projectile
                // Drag backwards to aim: Vector is Start - End
                const aimX = mouseDownPos.current.x - e.clientX;
                const aimY = mouseDownPos.current.y - e.clientY;
                const angle = Math.atan2(aimY, aimX);
                
                // Add projectile to world
                world.current.projectiles.push({
                    id: Math.random().toString(),
                    pos: { ...world.current.cursor.pos },
                    vel: { x: Math.cos(angle) * (power * 0.8), y: Math.sin(angle) * (power * 0.8) },
                    radius: 4,
                    isEnemy: false,
                    damage: 10 + power, // Damage scales with power
                    color: '#fff',
                    type: 'ARROW',
                    life: 300
                });
                world.current.cursor.bowCooldown = GAME_BALANCE.SLINGSHOT_COOLDOWN_FRAMES;
            }
          }
        } else if (e.button === 2) {
          // Right Click Release -> End Parry
          world.current.cursor.parryActive = false;
          world.current.cursor.parryCooldown = GAME_BALANCE.PARRY_COOLDOWN_FRAMES; 
        }
      };

      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
          window.removeEventListener('mousedown', handleMouseDown);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [gameState, chatOpen, draggedItem, controlsVisible, isMobile]);

  const addSystemMsg = (text: string, isError = false) => {
      setChatMessages(prev => [...prev, {
          id: Math.random().toString(),
          text,
          sender: isError ? 'ERROR' : 'SYSTEM',
          timestamp: Date.now()
      }]);
  };

  // COMMAND PARSER
  const handleCommand = (msg: string) => {
      // Add user message locally
      
      const userMsg: ChatMessage = { id: Math.random().toString(), text: msg, sender: 'PLAYER', timestamp: Date.now() };
      
      setChatMessages(prev => [...prev, userMsg]);

      if (!msg.startsWith('/')) return;

      const args = msg.slice(1).split(' ');
      const command = args[0].toLowerCase();
      const w = world.current;

      try {
          switch (command) {
              case 'give': {
                  if (args.length < 2) { addSystemMsg('Usage: /give <ItemName> [amount]', true); return; }
                  
                  const itemName = args[1].toUpperCase();
                  const amount = args[2] ? parseInt(args[2]) : 1;
                  
                  let targetType: ItemType | undefined;
                  if (itemName in ItemType) {
                      targetType = itemName as ItemType;
                  } else {
                      const key = Object.keys(ItemType).find(k => k === itemName);
                      if (key) targetType = key as ItemType;
                  }

                  if (!targetType) {
                       addSystemMsg(`Unknown item: ${itemName}`, true);
                       return;
                  }

                  const inv = w.cursor.inventory;
                  let remaining = amount;
                  
                  for(const slot of inv) {
                      if (slot.item === targetType && slot.count < MAX_STACK) {
                          const add = Math.min(remaining, MAX_STACK - slot.count);
                          slot.count += add;
                          remaining -= add;
                          if (remaining <= 0) break;
                      }
                  }
                  if (remaining > 0) {
                      for(const slot of inv) {
                          if (slot.item === ItemType.EMPTY) {
                              slot.item = targetType;
                              slot.count = Math.min(remaining, MAX_STACK);
                              remaining -= slot.count;
                              if (remaining <= 0) break;
                          }
                      }
                  }

                  addSystemMsg(`Gave ${amount} ${targetType} to Player.`);
                  break;
              }
              case 'spawn': {
                  if (args.length < 2) { addSystemMsg('Usage: /spawn <MobName>', true); return; }
                  const mobName = args[1].toUpperCase();
                  
                  let targetMob: MobType | undefined;
                  if (Object.values(MobType).includes(mobName as MobType)) {
                      targetMob = mobName as MobType;
                  }

                  if (!targetMob) {
                      addSystemMsg(`Unknown mob: ${mobName}`, true);
                      return;
                  }
                  
                  w.entities.push({
                      id: Math.random().toString(),
                      type: targetMob,
                      pos: { ...w.cursor.mousePos },
                      vel: { x: 0, y: 0 },
                      hp: 100,
                      maxHp: 100,
                      state: 'IDLE',
                      attackTimer: 0,
                      size: 20,
                      color: '#fff',
                      faceDirection: 1
                  });
                  addSystemMsg(`Spawned ${targetMob}`);
                  break;
              }
              case 'heal': {
                  setStats(prev => ({
                      ...prev,
                      hp: prev.maxHp,
                      hunger: prev.maxHunger
                  }));
                  addSystemMsg('Restored Health and Hunger.');
                  break;
              }
              case 'kill': {
                  setStats(prev => ({ ...prev, hp: 0 }));
                  addSystemMsg('Oof.');
                  break;
              }
              case 'clear': {
                  w.cursor.inventory.forEach(s => {
                      s.item = ItemType.EMPTY;
                      s.count = 0;
                  });
                  addSystemMsg('Inventory cleared.');
                  break;
              }
              case 'time': {
                  if (args.length < 2) { addSystemMsg('Usage: /time set <day|night|value>', true); return; }
                  const val = args[2].toLowerCase();
                  if (val === 'day') w.timeOfDay = 6000;
                  else if (val === 'night') w.timeOfDay = 18000;
                  else if (!isNaN(parseInt(val))) w.timeOfDay = parseInt(val);
                  
                  addSystemMsg(`Time set to ${w.timeOfDay}`);
                  break;
              }
              case 'help': {
                  addSystemMsg('Commands: /give, /spawn, /heal, /kill, /time, /clear');
                  break;
              }
              default: {
                  addSystemMsg(`Unknown command: ${command}`, true);
              }
          }
      } catch (e) {
          addSystemMsg('Error executing command.', true);
      }
  };


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrameId: number;

    const loop = () => {
      // Only update logic if Playing, but ALWAYS render (even behind pause/options)
      if (gameState === GameState.PLAYING) {
        updateGame(
          world.current, 
          canvas.width, 
          canvas.height, 
          setStats, 
          setGameState, 
          stats
        );
      }

      renderGame({
        ctx,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        world: world.current,
        settings // Pass settings to renderer
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, stats, setGameState, setStats, settings]); 

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className={`block absolute inset-0 z-0 ${cursorStyle}`}
      />
      
      {(gameState === GameState.PLAYING) && (
        <Hud 
            stats={stats} 
            inventory={inventorySnapshot}
            selectedIndex={hotbarIndex}
            timeOfDay={world.current.timeOfDay}
            dayCount={dayCount}
            toggleMap={() => {}} // Controlled by Item now
            isMapOpen={mapOpen}
            onOpenOptions={onOpenOptions}
            onDragStart={(index) => setDraggedItem({ index, x: 0, y: 0 })}
            onSelectSlot={(index) => {
                if (world.current) {
                    world.current.cursor.hotbarSelectedIndex = index;
                }
            }}
            onOpenInventory={() => {
                if (world.current) {
                    world.current.cursor.isInventoryOpen = true;
                }
            }}
        />
      )}

      {/* Chat UI */}
      {gameState === GameState.PLAYING && (
          <Chat 
              isOpen={chatOpen}
              onClose={() => setChatOpen(false)}
              messages={chatMessages}
              onSendMessage={handleCommand}
              initialChar={chatInitialChar}
          />
      )}

      {showInventory && (
          <Inventory 
             cursor={world.current.cursor} 
             updateInventory={handleInventoryUpdate}
             close={() => world.current.cursor.isInventoryOpen = false} 
             onOpenOptions={onOpenOptions}
          />
      )}
      
      {/* HOST ID OVERLAY (Updated to be centered and clickable) */}
      {multiplayerMode === 'HOST' && mpControls.peerId && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center gap-1 group">
              <div 
                onClick={() => {
                    navigator.clipboard.writeText(mpControls.peerId || '');
                    alert("ID Copied!");
                }}
                className="bg-blue-600/80 text-black px-3 py-1 rounded cursor-pointer hover:bg-blue-500 border-2 border-white shadow-lg flex items-center gap-2"
              >
                  <span className="font-bold">HOST ID:</span> 
                  <span className="font-mono bg-black/20 px-1 rounded">{mpControls.peerId}</span>
                  <span className="text-xs opacity-75">(Click to Copy)</span>
              </div>
          </div>
      )}

      {contextMenu && (
          <ContextMenu 
            x={contextMenu.x} 
            y={contextMenu.y} 
            onClose={() => setContextMenu(null)}
            onAction={(action) => {
                if (action === 'CHOP') {
                    // Trigger auto-chop
                    const tree = world.current.entities.find(e => e.id === contextMenu.entityId);
                    if (tree) {
                        world.current.cursor.autoAction = 'CHOP';
                        world.current.cursor.autoTargetId = tree.id;
                        world.current.cursor.targetPos = { ...tree.pos };
                    }
                } else if (action === 'INSPECT') {
                    addSystemMsg("It's a beautiful tree.");
                }
            }}
          />
      )}

      {draggedItem && (
          <div 
            className="absolute pointer-events-none z-50 text-4xl opacity-70 filter drop-shadow-lg"
            style={{ left: world.current.cursor.screenMousePos.x - 20, top: world.current.cursor.screenMousePos.y - 20 }}
          >
              {ITEM_ICONS[world.current.cursor.inventory[draggedItem.index].item]}
          </div>
      )}

      {/* Toggle Controls Button (Separate from main HUD) */}
      {isMobile && gameState === GameState.PLAYING && (
          <button 
            onClick={() => setControlsVisible(!controlsVisible)}
            className="absolute top-4 left-20 z-50 mc-btn w-10 h-10 flex items-center justify-center text-xl bg-[#c6c6c6] border-2 border-black shadow-md hover:bg-[#d6d6d6] pointer-events-auto transition-all"
            title={controlsVisible ? "Hide Controls" : "Show Controls"}
          >
            {controlsVisible ? '🎮' : '🚫'}
          </button>
      )}

      {/* Mobile Controls */}
      {isMobile && gameState === GameState.PLAYING && !showInventory && !chatOpen && controlsVisible && (
          <MobileControls 
            world={world} 
            onInventory={() => {
                world.current.cursor.isInventoryOpen = !world.current.cursor.isInventoryOpen;
            }}
            onMap={() => {
                world.current.cursor.isMapOpen = !world.current.cursor.isMapOpen;
            }}
            controlStyle={settings.mobileControlStyle}
          />
      )}
    </>
  );
};
