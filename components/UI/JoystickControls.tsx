import React, { useState } from 'react';
import { WorldState } from '../../types';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface JoystickControlsProps {
    world: React.MutableRefObject<WorldState>;
}

export const JoystickControls: React.FC<JoystickControlsProps> = ({ world }) => {
    // We'll keep the name JoystickControls for now to avoid breaking imports, 
    // but it's now a D-Pad + Buttons
    
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

    const updateWorldKeys = (keys: Set<string>) => {
        if (!world.current) return;
        const c = world.current.cursor;
        c.keys.w = keys.has('w');
        c.keys.s = keys.has('s');
        c.keys.a = keys.has('a');
        c.keys.d = keys.has('d');
    };

    const handleDPadStart = (key: string) => {
        setActiveKeys(prev => {
            const next = new Set<string>(prev);
            next.add(key);
            updateWorldKeys(next);
            return next;
        });
    };

    const handleDPadEnd = (key: string) => {
        setActiveKeys(prev => {
            const next = new Set<string>(prev);
            next.delete(key);
            updateWorldKeys(next);
            return next;
        });
    };

    const handleActionStart = () => {
        if (world.current) {
            world.current.cursor.isLeftDown = true;
            
            // In D-Pad mode, we attack in the direction we are facing
            const c = world.current.cursor;
            const range = 50;
            c.mousePos = { 
                x: c.pos.x + (c.faceDirection * range), 
                y: c.pos.y 
            };
        }
    };

    const handleActionEnd = () => {
        if (world.current) {
            world.current.cursor.isLeftDown = false;
        }
    };

    const handleParryStart = () => {
        if (world.current) {
            world.current.cursor.isRightDown = true;
        }
    };

    const handleParryEnd = () => {
        if (world.current) {
            world.current.cursor.isRightDown = false;
        }
    };

    return (
        <div className="absolute inset-0 z-40 pointer-events-none touch-none select-none">
            {/* D-PAD (Left Side) */}
            <div className="absolute bottom-8 left-8 w-40 h-40 pointer-events-auto">
                {/* Up */}
                <button 
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-black/40 border-2 border-white/30 rounded-lg flex items-center justify-center active:bg-white/40 active:scale-95 transition-all`}
                    onPointerDown={() => handleDPadStart('w')}
                    onPointerUp={() => handleDPadEnd('w')}
                    onPointerLeave={() => handleDPadEnd('w')}
                >
                    <ChevronUp className="text-white w-8 h-8" />
                </button>
                {/* Down */}
                <button 
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-black/40 border-2 border-white/30 rounded-lg flex items-center justify-center active:bg-white/40 active:scale-95 transition-all`}
                    onPointerDown={() => handleDPadStart('s')}
                    onPointerUp={() => handleDPadEnd('s')}
                    onPointerLeave={() => handleDPadEnd('s')}
                >
                    <ChevronDown className="text-white w-8 h-8" />
                </button>
                {/* Left */}
                <button 
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/40 border-2 border-white/30 rounded-lg flex items-center justify-center active:bg-white/40 active:scale-95 transition-all`}
                    onPointerDown={() => handleDPadStart('a')}
                    onPointerUp={() => handleDPadEnd('a')}
                    onPointerLeave={() => handleDPadEnd('a')}
                >
                    <ChevronLeft className="text-white w-8 h-8" />
                </button>
                {/* Right */}
                <button 
                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/40 border-2 border-white/30 rounded-lg flex items-center justify-center active:bg-white/40 active:scale-95 transition-all`}
                    onPointerDown={() => handleDPadStart('d')}
                    onPointerUp={() => handleDPadEnd('d')}
                    onPointerLeave={() => handleDPadEnd('d')}
                >
                    <ChevronRight className="text-white w-8 h-8" />
                </button>
                
                {/* Center visual */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full border border-white/20" />
            </div>

            {/* ACTION BUTTONS (Right Side) */}
            <div className="absolute bottom-12 right-12 flex gap-4 pointer-events-auto items-end">
                {/* Button Y (Parry) */}
                <button 
                    className="w-16 h-16 bg-blue-600/40 border-2 border-white/50 rounded-full flex items-center justify-center active:bg-blue-500/60 active:scale-90 transition-all shadow-lg mb-8"
                    onPointerDown={handleParryStart}
                    onPointerUp={handleParryEnd}
                    onPointerLeave={handleParryEnd}
                >
                    <span className="text-white font-black text-xl">Y</span>
                </button>

                {/* Button B (Secondary/Interact?) */}
                <button 
                    className="w-20 h-20 bg-black/40 border-2 border-white/30 rounded-full flex items-center justify-center active:bg-white/40 active:scale-90 transition-all shadow-lg"
                    onPointerDown={() => {
                        if (world.current) {
                            world.current.cursor.isInventoryOpen = !world.current.cursor.isInventoryOpen;
                        }
                    }}
                >
                    <span className="text-white font-black text-2xl">B</span>
                </button>
                
                {/* Button A (Primary/Attack) */}
                <button 
                    className="w-24 h-24 bg-red-600/40 border-2 border-white/50 rounded-full flex items-center justify-center active:bg-red-500/60 active:scale-90 transition-all shadow-xl -mt-4"
                    onPointerDown={handleActionStart}
                    onPointerUp={handleActionEnd}
                    onPointerLeave={handleActionEnd}
                >
                    <span className="text-white font-black text-3xl">A</span>
                </button>
            </div>
        </div>
    );
};
