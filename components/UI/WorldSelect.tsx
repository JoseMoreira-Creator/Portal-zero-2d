
import React, { useState } from 'react';
import { WorldMetadata } from '../../types';
import { Pencil, Trash2 } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface WorldSelectProps {
  worlds: WorldMetadata[];
  onCreateWorld: (name: string) => void;
  onSelectWorld: (id: string) => void;
  onDeleteWorld: (id: string) => void;
  onRenameWorld: (id: string, newName: string) => void;
  onBack: () => void;
}

export const WorldSelect: React.FC<WorldSelectProps> = ({ worlds, onCreateWorld, onSelectWorld, onDeleteWorld, onRenameWorld, onBack }) => {
  console.log("Worlds:", worlds);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorldName, setNewWorldName] = useState('');
  const [editingWorld, setEditingWorld] = useState<WorldMetadata | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newWorldName.trim()) {
          onCreateWorld(newWorldName.trim());
          setIsCreating(false);
          setNewWorldName('');
      }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingWorld && editName.trim()) {
          onRenameWorld(editingWorld.id, editName.trim());
          setEditingWorld(null);
          setEditName('');
      }
  };

  return (
    <div 
        className="absolute inset-0 z-50 flex flex-col items-center justify-center"
        style={{ 
          backgroundColor: '#1a0f0a',
          backgroundImage: `radial-gradient(#2d1e16 2px, transparent 2px)`,
          backgroundSize: '32px 32px'
        }}
    >
        <h1 className="text-5xl text-black mb-6 pixel-shadow font-bold">SELECT WORLD</h1>

        {/* WORLD LIST */}
        <div className="mc-panel w-full max-w-3xl h-[60vh] flex flex-col bg-[#c6c6c6] p-4 relative">
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {worlds.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 italic text-xl">
                        No worlds created yet.
                    </div>
                ) : (
                    worlds.map(world => (
                        <div key={world.id} className="bg-[#a0a0a0] border-2 border-[#555] p-2 flex gap-4 items-center hover:bg-[#b0b0b0] transition-colors group">
                            {/* THUMBNAIL */}
                            <div className="w-24 h-24 bg-black border-2 border-[#373737] shrink-0 overflow-hidden relative">
                                {world.thumbnail ? (
                                    <img src={world.thumbnail} alt={world.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Img</div>
                                )}
                            </div>

                            {/* INFO */}
                            <div className="flex-1 flex items-center gap-2">
                                <h3 className="text-lg sm:text-2xl font-bold text-[#222]">{world.name}</h3>
                            </div>
                            <div className="hidden sm:block flex-1">
                                <p className="text-xs sm:text-sm text-[#444] font-mono">Last Played: {new Date(world.lastPlayed).toLocaleDateString()} {new Date(world.lastPlayed).toLocaleTimeString()}</p>
                                <p className="text-xs sm:text-sm text-[#444] font-mono truncate opacity-50">ID: {world.id}</p>
                            </div>

                            {/* BUTTONS */}
                            <div className="flex flex-col gap-2 w-24 sm:w-32">
                                <button 
                                    onClick={() => { playSound('click'); onSelectWorld(world.id); }}
                                    className="mc-btn w-full py-2 text-green-900 font-bold border-green-900 bg-green-200 hover:bg-green-300 text-sm sm:text-base"
                                >
                                    ► PLAY
                                </button>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => {
                                            playSound('click');
                                            setEditingWorld(world);
                                            setEditName(world.name);
                                        }}
                                        className="mc-btn flex-1 py-1 text-blue-900 font-bold border-blue-900 bg-blue-200 hover:bg-blue-300 flex items-center justify-center gap-1 text-xs sm:text-sm"
                                        title="Edit World"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            playSound('click');
                                            if(window.confirm(`Delete world "${world.name}" forever?`)) {
                                                onDeleteWorld(world.id);
                                            }
                                        }}
                                        className="mc-btn flex-1 py-1 text-red-900 font-bold border-red-900 bg-red-200 hover:bg-red-300 flex items-center justify-center gap-1 text-xs sm:text-sm"
                                        title="Delete World"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* FOOTER ACTIONS */}
            <div className="mt-4 pt-4 border-t-2 border-[#777] flex justify-between gap-4">
                <button 
                    onClick={() => { playSound('click'); onBack(); }}
                    className="mc-btn w-40 py-3 text-lg font-bold"
                >
                    BACK
                </button>

                <button 
                    onClick={() => { playSound('click'); setIsCreating(true); }}
                    className="mc-btn flex-1 py-3 text-lg font-bold bg-[#a7f3d0]"
                >
                    + CREATE NEW WORLD
                </button>
            </div>
        </div>

        {/* CREATE MODAL */}
        {isCreating && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm">
                <form onSubmit={handleCreateSubmit} className="mc-panel p-6 w-96 bg-[#c6c6c6] flex flex-col gap-4">
                    <h2 className="text-2xl font-bold text-[#222]">Create New World</h2>
                    
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="World Name..."
                        value={newWorldName}
                        onChange={e => setNewWorldName(e.target.value)}
                        maxLength={20}
                        className="p-2 text-xl font-mono border-2 border-[#555] bg-[#ddd] text-black placeholder-gray-500 focus:outline-none focus:border-black"
                    />

                    <div className="flex gap-2 mt-4">
                        <button 
                            type="button" 
                            onClick={() => { playSound('click'); setIsCreating(false); }}
                            className="mc-btn flex-1 py-2 font-bold"
                        >
                            CANCEL
                        </button>
                        <button 
                            type="submit" 
                            onClick={() => playSound('click')}
                            disabled={!newWorldName.trim()}
                            className="mc-btn flex-1 py-2 font-bold bg-green-200 text-green-900"
                        >
                            CREATE
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* EDIT MODAL */}
        {editingWorld && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm">
                <form onSubmit={handleEditSubmit} className="mc-panel p-6 w-96 bg-[#c6c6c6] flex flex-col gap-4">
                    <h2 className="text-2xl font-bold text-[#222]">Edit World</h2>
                    
                    <input 
                        type="text" 
                        placeholder="World Name..."
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        maxLength={20}
                        className="p-2 text-xl font-mono border-2 border-[#555] bg-[#ddd] text-black placeholder-gray-500 focus:outline-none focus:border-black"
                    />

                    <div className="flex gap-2 mt-4">
                        <button 
                            type="button" 
                            onClick={() => { playSound('click'); setEditingWorld(null); }}
                            className="mc-btn flex-1 py-2 font-bold"
                        >
                            CANCEL
                        </button>
                        <button 
                            type="submit" 
                            onClick={() => playSound('click')}
                            disabled={!editName.trim()}
                            className="mc-btn flex-1 py-2 font-bold bg-blue-200 text-blue-900"
                        >
                            SAVE
                        </button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};
