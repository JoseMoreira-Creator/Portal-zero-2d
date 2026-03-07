
import React, { useState, useEffect, useRef } from 'react';
import { GameState, PlayerStats, ItemType, GameSettings, WorldMetadata, WorldState, SavedWorldData } from './types';
import { GAME_BALANCE, TOTAL_LOC, SCREEN_WIDTH, SCREEN_HEIGHT } from './constants';
import { GameCanvas } from './components/GameCanvas';
import { Changelog } from './components/UI/Changelog';
import { GameWiki } from './components/UI/GameWiki';
import { Options } from './components/UI/Options';
import { WorldSelect } from './components/UI/WorldSelect';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { CURRENT_VERSION } from './versions';
import { createInitialWorld } from './game/logic';
import { loadSprites } from './assets/sprites'; // IMPORT NEW LOADER

const STORAGE_KEY_META = 'pz_worlds_meta';
const STORAGE_KEY_DATA_PREFIX = 'pz_world_data_';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  
  // World Management
  const [worlds, setWorlds] = useState<WorldMetadata[]>([]);
  const [activeWorldId, setActiveWorldId] = useState<string | null>(null);
  const [activeWorldState, setActiveWorldState] = useState<WorldState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Multiplayer State for Menu
  const [multiplayerMode, setMultiplayerMode] = useState<'HOST' | 'JOIN' | null>(null);
  const [joinId, setJoinId] = useState('');

  // Ref to GameCanvas for saving
  const saveGameRef = useRef<{ saveGame: () => { world: WorldState, thumb: string } } | null>(null);
  // Ref for Multiplayer controls exposure
  const multiplayerRef = useRef<any>(null);

  // Load Metadata on Mount AND Sprites
  useEffect(() => {
    // 1. Load Saved Worlds
    const savedMeta = localStorage.getItem(STORAGE_KEY_META);
    if (savedMeta) {
        try {
            setWorlds(JSON.parse(savedMeta));
        } catch (e) {
            console.error("Failed to load world list", e);
        }
    }

    // 2. Load Custom Images
    setIsLoading(true);
    loadSprites().then(() => {
        setIsLoading(false);
    });
  }, []);

  // Game Settings State
  const [settings, setSettings] = useState<GameSettings>({
      animations: true,
      zoom: 1.0,
      showCoordinates: false
  });

  const [stats, setStats] = useState<PlayerStats>({
    hp: GAME_BALANCE.PLAYER_BASE_HP,
    maxHp: GAME_BALANCE.PLAYER_BASE_HP,
    hunger: GAME_BALANCE.PLAYER_BASE_HUNGER,
    maxHunger: GAME_BALANCE.PLAYER_BASE_HUNGER,
    score: 0,
  });
  const [activeSlot, setActiveSlot] = useState<ItemType>(ItemType.EMPTY);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showWiki, setShowWiki] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // --- WORLD MANAGEMENT ---

  const handleCreateWorld = (name: string) => {
      const id = Date.now().toString();
      setIsLoading(true);
      
      // Artificial Delay + Generation
      setTimeout(() => {
          const newWorld = createInitialWorld(window.innerWidth, window.innerHeight);
          const newMeta: WorldMetadata = {
              id,
              name,
              lastPlayed: Date.now(),
              thumbnail: '' // Empty initially
          };

          // Save Data
          localStorage.setItem(STORAGE_KEY_DATA_PREFIX + id, JSON.stringify(newWorld));
          
          // Save Meta
          const updatedWorlds = [newMeta, ...worlds];
          localStorage.setItem(STORAGE_KEY_META, JSON.stringify(updatedWorlds));
          setWorlds(updatedWorlds);

          setActiveWorldId(id);
          setActiveWorldState(newWorld);
          
          setStats({
              hp: GAME_BALANCE.PLAYER_BASE_HP,
              maxHp: GAME_BALANCE.PLAYER_BASE_HP,
              hunger: GAME_BALANCE.PLAYER_BASE_HUNGER,
              maxHunger: GAME_BALANCE.PLAYER_BASE_HUNGER,
              score: 0,
          });
          
          setIsLoading(false);
          setGameState(GameState.PLAYING);
      }, 1000); // 1 Second Loading Screen
  };

  const handleSelectWorld = (id: string) => {
      setIsLoading(true);
      
      setTimeout(() => {
          const rawData = localStorage.getItem(STORAGE_KEY_DATA_PREFIX + id);
          if (rawData) {
              try {
                  const worldState = JSON.parse(rawData);
                  
                  // Migration: Ensure cameraPos exists for old saves
                  if (!worldState.cameraPos) {
                      worldState.cameraPos = { ...worldState.cursor.pos };
                  }

                  setActiveWorldId(id);
                  setActiveWorldState(worldState);
                  
                  // Restore Stats from WorldState (if we saved them, or default)
                  setStats({
                    hp: GAME_BALANCE.PLAYER_BASE_HP,
                    maxHp: GAME_BALANCE.PLAYER_BASE_HP,
                    hunger: GAME_BALANCE.PLAYER_BASE_HUNGER,
                    maxHunger: GAME_BALANCE.PLAYER_BASE_HUNGER,
                    score: 0,
                  });
                  
                  // If launching from multiplayer menu
                  if (multiplayerMode === 'HOST') {
                      // Canvas logic handles the hosting inside
                  }

                  setGameState(GameState.PLAYING);
              } catch (e) {
                  console.error("Failed to load world data", e);
                  alert("Corrupted save file.");
              }
          }
          setIsLoading(false);
      }, 1000);
  };

  const handleRenameWorld = (id: string, newName: string) => {
      const updatedWorlds = worlds.map(w => w.id === id ? { ...w, name: newName } : w);
      localStorage.setItem(STORAGE_KEY_META, JSON.stringify(updatedWorlds));
      setWorlds(updatedWorlds);
  };

  const handleDeleteWorld = (id: string) => {
      console.log("Deleting world:", id);
      const updatedWorlds = worlds.filter(w => w.id !== id);
      console.log("Updated worlds:", updatedWorlds);
      localStorage.setItem(STORAGE_KEY_META, JSON.stringify(updatedWorlds));
      localStorage.removeItem(STORAGE_KEY_DATA_PREFIX + id);
      setWorlds(updatedWorlds);
  };

  const handleSave = () => {
      if (saveGameRef.current && activeWorldId) {
          const { world, thumb } = saveGameRef.current.saveGame();
          
          if (!world.isMultiplayer || world.isHost) {
              localStorage.setItem(STORAGE_KEY_DATA_PREFIX + activeWorldId, JSON.stringify(world));

              const updatedWorlds = worlds.map(w => {
                  if (w.id === activeWorldId) {
                      return { ...w, lastPlayed: Date.now(), thumbnail: thumb };
                  }
                  return w;
              }).sort((a,b) => b.lastPlayed - a.lastPlayed); 

              localStorage.setItem(STORAGE_KEY_META, JSON.stringify(updatedWorlds));
              setWorlds(updatedWorlds);
              alert("Game Saved!");
          }
      }
  };

  const handleSaveAndQuit = () => {
      handleSave();
      
      // Disconnect multiplayer
      if (multiplayerRef.current) {
          multiplayerRef.current.disconnect();
      }

      setShowOptions(false);
      setGameState(GameState.MENU);
      setActiveWorldId(null);
      setActiveWorldState(null);
      setMultiplayerMode(null);
  };

  // --- MULTIPLAYER HANDLERS ---
  const handleHostGame = (worldId: string) => {
      // Load the world, then GameCanvas will trigger host logic
      setMultiplayerMode('HOST');
      handleSelectWorld(worldId);
  };

  const handleJoinGame = () => {
      if (!joinId.trim()) return;
      setMultiplayerMode('JOIN');
      setIsLoading(true);

      // Create a dummy world state for client init, will be overwritten by Host
      const dummy = createInitialWorld(window.innerWidth, window.innerHeight);
      setActiveWorldState(dummy);
      setActiveWorldId(null); // No local save ID

      setTimeout(() => {
          setIsLoading(false);
          setGameState(GameState.PLAYING);
      }, 500);
  };

  // Keyboard listener for Menu Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showWiki) { setShowWiki(false); return; }
        if (showChangelog) { setShowChangelog(false); return; }
        if (showOptions) { setShowOptions(false); return; }

        if (gameState === GameState.PLAYING) {
            // Optional: Pause logic or open options
            setShowOptions(true);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, showWiki, showChangelog, showOptions]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white text-black">
      
      {/* 1. Loading Screen Overlay */}
      {isLoading && <LoadingScreen />}

      {/* 2. The Game World (Canvas) */}
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState}
        stats={stats}
        setStats={setStats}
        activeSlot={activeSlot}
        setActiveSlot={setActiveSlot}
        settings={settings}
        setSettings={setSettings}
        onOpenOptions={() => setShowOptions(true)}
        initialWorldState={activeWorldState}
        saveRef={saveGameRef}
        multiplayerMode={multiplayerMode} // Pass mode
        joinId={joinId} // Pass join ID
        multiplayerRef={multiplayerRef}
      />

      {/* 3. Overlays */}
      {showChangelog && <Changelog onClose={() => setShowChangelog(false)} />}
      
      {showWiki && <GameWiki onClose={() => setShowWiki(false)} />}
      
      {showOptions && (
          <Options 
            settings={settings} 
            setSettings={setSettings} 
            onClose={() => setShowOptions(false)}
            onOpenWiki={() => { setShowOptions(false); setShowWiki(true); }}
            onOpenChangelog={() => { setShowOptions(false); setShowChangelog(true); }}
            onSave={handleSave}
            onSaveAndQuit={handleSaveAndQuit}
          />
      )}

      {/* 4. World Select Screen (Singleplayer OR Host) */}
      {gameState === GameState.WORLD_SELECT && !isLoading && (
          <WorldSelect 
            worlds={worlds}
            onCreateWorld={handleCreateWorld}
            onSelectWorld={(id) => {
                if (multiplayerMode === 'HOST') handleHostGame(id);
                else handleSelectWorld(id);
            }}
            onDeleteWorld={handleDeleteWorld}
            onRenameWorld={handleRenameWorld}
            onBack={() => {
                setGameState(GameState.MENU);
                setMultiplayerMode(null);
            }}
          />
      )}

      {/* 5. Multiplayer Menu */}
      {gameState === GameState.MULTIPLAYER_MENU && (
           <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" 
           style={{ backgroundColor: '#1a0f0a', backgroundImage: `radial-gradient(#2d1e16 2px, transparent 2px)`, backgroundSize: '32px 32px' }}>
               <h1 className="text-5xl text-black mb-8 pixel-shadow">MULTIPLAYER</h1>
               <div className="mc-panel p-6 w-[90%] max-w-96 bg-[#c6c6c6] flex flex-col gap-4">
                   <button 
                       onClick={() => {
                           setMultiplayerMode('HOST');
                           setGameState(GameState.WORLD_SELECT);
                       }}
                       className="mc-btn w-full py-3 text-lg font-bold"
                   >
                       HOST GAME
                   </button>
                   
                   <div className="border-t-2 border-[#777] my-2"></div>
                   
                   <h3 className="text-[#222] font-bold">JOIN GAME (Enter Code)</h3>
                   <input 
                       type="text"
                       placeholder="Host ID..."
                       value={joinId}
                       onChange={e => setJoinId(e.target.value)}
                       className="p-2 border-2 border-[#555] bg-[#ddd] text-black font-mono text-lg"
                   />
                   <button 
                       onClick={handleJoinGame}
                       disabled={!joinId}
                       className="mc-btn w-full py-3 text-lg font-bold bg-[#a7f3d0]"
                   >
                       JOIN
                   </button>
                   
                   <div className="border-t-2 border-[#777] my-2"></div>

                   <button 
                       onClick={() => setGameState(GameState.MENU)}
                       className="mc-btn w-full py-2 text-base font-bold text-[#555]"
                   >
                       BACK
                   </button>
               </div>
           </div>
      )}

      {/* 6. Main Menu */}
      {gameState === GameState.MENU && !showChangelog && !showWiki && !showOptions && (
        <div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{ 
            backgroundColor: '#1a0f0a',
            backgroundImage: `radial-gradient(#2d1e16 2px, transparent 2px)`,
            backgroundSize: '32px 32px'
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-6xl mb-1 text-[#222] pixel-shadow tracking-tighter" style={{ textShadow: '3px 3px #fff' }}>
              PORTAL
            </h1>
            <h2 className="text-6xl text-[#222] pixel-shadow tracking-tighter -mt-2" style={{ textShadow: '3px 3px #fff' }}>
              ZERO 2D
            </h2>
            <div className="bg-yellow-300 text-black px-2 py-0.5 transform -rotate-12 mt-4 text-base border-2 border-white animate-bounce">
              v{CURRENT_VERSION.version} - {CURRENT_VERSION.title}
            </div>
          </div>
          
          <div className="mc-panel p-4 w-[90%] max-w-72 flex flex-col gap-2">
             <button 
              onClick={() => {
                  setMultiplayerMode(null);
                  setGameState(GameState.WORLD_SELECT);
              }}
              className="mc-btn w-full py-2 text-base font-bold"
            >
              Singleplayer
            </button>
            <button 
              onClick={() => setGameState(GameState.MULTIPLAYER_MENU)}
              className="mc-btn w-full py-2 text-base font-bold"
            >
              Multiplayer
            </button>
            
            <div className="flex gap-2 w-full mt-2">
                <button 
                  onClick={() => setShowOptions(true)}
                  className="mc-btn flex-1 py-2 text-base font-bold"
                >
                  Options / Extras
                </button>
                <button 
                  className="mc-btn w-12 py-2 text-base font-bold"
                  disabled
                >
                  X
                </button>
            </div>
          </div>
          
          <p className="absolute bottom-2 left-2 text-[#444] text-xs font-bold">Minecraft 1.7.0 (Modded)</p>
          <p className="absolute bottom-2 right-2 text-[#444] text-xs font-bold">Copyright Mojang AB (Not really)</p>
          
          <p className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-[#222] text-xs font-mono tracking-widest uppercase opacity-75 font-bold">
            JÁ SOMOS {TOTAL_LOC} LINHAS DE CÓDIGO
          </p>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-900/60 backdrop-blur-sm">
          <h1 className="text-6xl text-black mb-1 pixel-shadow drop-shadow-lg">You Died!</h1>
          <p className="text-xl text-[#ccc] mb-6 pixel-shadow">Score: {stats.score}</p>
          
          <div className="flex flex-col gap-2 w-72">
             <button 
              onClick={() => {
                  // Respawn logic (re-load current world effectively)
                  if (activeWorldId) handleSelectWorld(activeWorldId);
              }}
              className="mc-btn w-full py-2 text-base font-bold"
            >
              Respawn
            </button>
             <button 
              onClick={handleSaveAndQuit} // Quit to menu safely
              className="mc-btn w-full py-2 text-base font-bold"
            >
              Title Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
