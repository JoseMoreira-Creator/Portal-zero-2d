
import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import { GameState, ItemType, PlayerStats, InventorySlot, GameSettings, ChatMessage, WorldState, MobType } from '../types';
import { SCREEN_HEIGHT, SCREEN_WIDTH, GAME_BALANCE, MAX_STACK } from '../constants';
import { createInitialWorld, updateGame } from '../game/logic';
import { renderGame } from '../game/renderer';
import { useGameInput } from '../hooks/useGameInput';
import { useIsMobile } from '../hooks/useIsMobile';
import { Inventory } from './UI/Inventory';
import { Hotbar } from './UI/Hotbar';
import { Chat } from './UI/Chat';
import { Hud } from './UI/Hud';
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
            className="fixed inset-0 z-[100] pointer-events-auto"
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        >
            <div 
                className="absolute bg-[#c6c6c6] border-2 border-black p-1 shadow-xl flex flex-col gap-1"
                style={{ left: x, top: y }}
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    className="mc-btn px-4 py-1 text-sm font-bold text-left hover:bg-[#d6d6d6]"
                    onClick={() => { onAction('CHOP'); onClose(); }}
                >
                    ⚔️ INTERACT / ATTACK
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
        // Safety check for old saves
        if (!world.current.cameraPos) {
            world.current.cameraPos = { ...world.current.cursor.pos };
        }
    } else if (!world.current) {
        // Fallback for safety
        world.current = createInitialWorld(SCREEN_WIDTH, SCREEN_HEIGHT);
    }
  }, [initialWorldState]);

  const [showInventory, setShowInventory] = useState(false);
  const [playerMenuOpen, setPlayerMenuOpen] = useState(false);
  const [playerMenuPos, setPlayerMenuPos] = useState({ x: 0, y: 0 });
  const [cursorStyle, setCursorStyle] = useState('cursor-none');
  
  const [inventorySnapshot, setInventorySnapshot] = useState<InventorySlot[]>([]);
  const [hotbarIndex, setHotbarIndex] = useState(0);
  const [dayCount, setDayCount] = useState(1);
  const [mapOpen, setMapOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [showCoordinates, setShowCoordinates] = useState(false);

  // CHAT STATE
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInitialChar, setChatInitialChar] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, entityId: string } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ index: number, x: number, y: number } | null>(null);
  const isMobile = useIsMobile();
  
  // Pinch zoom state
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
          const dist = getDistance(
              { x: e.touches[0].clientX, y: e.touches[0].clientY },
              { x: e.touches[1].clientX, y: e.touches[1].clientY }
          );
          setInitialDistance(dist);
          setInitialZoom(world.current.zoom);
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialDistance !== null && initialZoom !== null) {
          const dist = getDistance(
              { x: e.touches[0].clientX, y: e.touches[0].clientY },
              { x: e.touches[1].clientX, y: e.touches[1].clientY }
          );
          const scale = dist / initialDistance;
          const newZoom = Math.max(0.5, Math.min(3, initialZoom * scale));
          world.current.zoom = newZoom;
      }
  };

  const handleTouchEnd = () => {
      setInitialDistance(null);
      setInitialZoom(null);
  };

  // Input State Refs
  const isDraggingPlayer = useRef(false);
  const isPanning = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 }); // Screen coords
  const cameraStartPos = useRef({ x: 0, y: 0 }); // World coords
  const playerDragCurrentPos = useRef<{ x: number, y: number } | null>(null); // World coords

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

  // NEW INPUT HANDLING
  useEffect(() => {
      const screenToWorld = (sx: number, sy: number) => {
          const w = world.current;
          const zoom = w.zoom;
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          return {
              x: (sx - cx) / zoom + w.cameraPos.x,
              y: (sy - cy) / zoom + w.cameraPos.y
          };
      };

      const handleDown = (clientX: number, clientY: number) => {
          if (gameState !== GameState.PLAYING) return;
          if (playerMenuOpen || contextMenu || showInventory) return;

          dragStartPos.current = { x: clientX, y: clientY };
          isPanning.current = true;
          cameraStartPos.current = { ...world.current.cameraPos };
      };

      const handleMove = (clientX: number, clientY: number) => {
          if (gameState !== GameState.PLAYING) return;

          if (isPanning.current) {
              const dx = clientX - dragStartPos.current.x;
              const dy = clientY - dragStartPos.current.y;
              const zoom = world.current.zoom;
              
              world.current.cameraPos = {
                  x: cameraStartPos.current.x - dx / zoom,
                  y: cameraStartPos.current.y - dy / zoom
              };
          }
      };

      const handleUp = (clientX: number, clientY: number) => {
          if (gameState !== GameState.PLAYING) return;
          
          const dist = Math.hypot(clientX - dragStartPos.current.x, clientY - dragStartPos.current.y);

          if (isPanning.current && dist < 5) {
              // Click Logic (if not dragged much)
              const worldPos = screenToWorld(clientX, clientY);
              
              // Check for entity click
              let clickedEntity = null;
              // Iterate backwards to prioritize top entities
              for (let i = world.current.entities.length - 1; i >= 0; i--) {
                  const ent = world.current.entities[i];
                  // Simple circle collision check for click
                  if (getDistance(worldPos, ent.pos) < ent.size + 10) {
                      clickedEntity = ent;
                      break;
                  }
              }

              if (clickedEntity) {
                  setContextMenu({ x: clientX, y: clientY, entityId: clickedEntity.id });
              } else {
                  // Move to position
                  world.current.cursor.targetPos = { ...worldPos };
                  world.current.cursor.autoAction = 'NONE';
                  world.current.cursor.autoTargetId = null;
              }
          }

          isPanning.current = false;
      };

      const onMouseDown = (e: MouseEvent) => {
          if (e.button === 0) handleDown(e.clientX, e.clientY);
      };
      const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
      const onMouseUp = (e: MouseEvent) => handleUp(e.clientX, e.clientY);

      const onTouchStart = (e: TouchEvent) => {
          if (e.touches.length === 1) {
              handleDown(e.touches[0].clientX, e.touches[0].clientY);
          }
      };
      const onTouchMove = (e: TouchEvent) => {
          if (e.touches.length === 1) {
              handleMove(e.touches[0].clientX, e.touches[0].clientY);
          }
      };
      const onTouchEnd = (e: TouchEvent) => {
          // Use changedTouches for end position
          if (e.changedTouches.length > 0) {
              handleUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
          }
      };

      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchstart', onTouchStart, { passive: false });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);

      return () => {
          window.removeEventListener('mousedown', onMouseDown);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          window.removeEventListener('touchstart', onTouchStart);
          window.removeEventListener('touchmove', onTouchMove);
          window.removeEventListener('touchend', onTouchEnd);
      };
  }, [gameState, playerMenuOpen, contextMenu, showInventory]);

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


  // Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      if (gameState === GameState.PLAYING && world.current) {
        // Update Logic
        // Smooth camera follow removed

        updateGame(
          world.current, 
          window.innerWidth, 
          window.innerHeight, 
          setStats, 
          setGameState, 
          stats
        );
        
        // Render
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            renderGame({
              ctx,
              canvasWidth: window.innerWidth,
              canvasHeight: window.innerHeight,
              world: world.current,
              settings
            });

            // Draw Off-screen Arrow
            const w = world.current;
            const zoom = w.zoom;
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const playerScreenX = (w.cursor.pos.x - w.cameraPos.x) * zoom + cx;
            const playerScreenY = (w.cursor.pos.y - w.cameraPos.y) * zoom + cy;

            if (playerScreenX < 0 || playerScreenX > window.innerWidth || playerScreenY < 0 || playerScreenY > window.innerHeight) {
                const angle = Math.atan2(playerScreenY - cy, playerScreenX - cx);
                const dist = Math.min(cx, cy) - 50;
                const arrowX = cx + Math.cos(angle) * dist;
                const arrowY = cy + Math.sin(angle) * dist;

                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for screen space
                ctx.translate(arrowX, arrowY);
                ctx.rotate(angle);
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(-5, 10);
                ctx.lineTo(-5, -10);
                ctx.fill();
                ctx.restore();
            }

            // Draw Drag Line Overlay
            if (isDraggingPlayer.current && playerDragCurrentPos.current && dragStartPos.current) {
                // We need to draw this in screen space on top of the game
                // But renderGame clears the canvas.
                // So we should draw it here after renderGame.
                
                // Convert player pos to screen
                const w = world.current;
                const zoom = w.zoom;
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                const playerScreenX = (w.cursor.pos.x - w.cameraPos.x) * zoom + cx;
                const playerScreenY = (w.cursor.pos.y - w.cameraPos.y) * zoom + cy;
                
                const targetScreenX = (playerDragCurrentPos.current.x - w.cameraPos.x) * zoom + cx;
                const targetScreenY = (playerDragCurrentPos.current.y - w.cameraPos.y) * zoom + cy;

                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 4;
                ctx.setLineDash([10, 10]);
                ctx.beginPath();
                ctx.moveTo(playerScreenX, playerScreenY);
                ctx.lineTo(targetScreenX, targetScreenY);
                ctx.stroke();
                
                // Draw target circle
                ctx.beginPath();
                ctx.arc(targetScreenX, targetScreenY, 10, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.fill();
                ctx.restore();
            }
          }
        }
      }
      setTick(t => t + 1);
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, settings, multiplayerMode, stats]); // Added stats dependency

  return (
    <>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className={`block bg-black touch-none select-none ${cursorStyle}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* UI OVERLAYS */}
      <Hud stats={stats} />
      {gameState === GameState.PLAYING && (
          <Hotbar 
            inventory={world.current.cursor.inventory}
            selectedIndex={world.current.cursor.hotbarSelectedIndex}
            onOpenInventory={() => {
                if (world.current) world.current.cursor.isInventoryOpen = true;
                setShowInventory(true);
            }}
          />
      )}
      {showInventory && (
          <Inventory 
              cursor={world.current.cursor}
              updateInventory={handleInventoryUpdate}
              close={() => {
                  if (world.current) world.current.cursor.isInventoryOpen = false;
                  setShowInventory(false);
              }}
              onOpenOptions={onOpenOptions}
              addSystemMsg={addSystemMsg}
          />
      )}

      {chatOpen && (
          <Chat 
              messages={chatMessages}
              onSendMessage={(msg) => {
                  handleCommand(msg);
                  setChatOpen(false);
              }}
              onClose={() => setChatOpen(false)}
              initialChar={chatInitialChar}
          />
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
      
      {/* HOST ID OVERLAY */}
      {multiplayerMode === 'HOST' && mpControls.peerId && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center gap-1 group">
              <div 
                onClick={() => {
                    navigator.clipboard.writeText(mpControls.peerId || '');
                    alert("ID Copied!");
                }}
                className="bg-blue-600/80 text-black px-3 py-1 cursor-pointer hover:bg-blue-500 border-2 border-white shadow-lg flex items-center gap-2"
              >
                  <span className="font-bold">HOST ID:</span> 
                  <span className="font-mono bg-black/20 px-1">{mpControls.peerId}</span>
                  <span className="text-xs opacity-75">(Click to Copy)</span>
              </div>
          </div>
      )}
    </>
  );
};
