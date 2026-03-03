
import React from 'react';
import { PlayerStats, InventorySlot } from '../../types';
import { ITEM_ICONS } from '../../assets/art';

interface HudProps {
  stats: PlayerStats;
  inventory: InventorySlot[];
  selectedIndex: number;
  timeOfDay: number;
  dayCount: number;
  toggleMap: () => void;
  isMapOpen: boolean;
  onOpenOptions: () => void;
  onSelectSlot: (index: number) => void;
  onOpenInventory: () => void;
  onDragStart: (index: number, x: number, y: number) => void;
}

// Reusable Bar Component
const StatusBar: React.FC<{ 
    value: number; 
    max: number; 
    color: string; 
    label?: string;
    showText?: boolean;
}> = ({ value, max, color, label, showText = true }) => {
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));
    
    return (
        <div className="w-full h-5 bg-black/50 border-2 border-black relative mb-1">
            {/* Background Track */}
            <div className="absolute inset-0 bg-[#222]"></div>
            
            {/* Fill */}
            <div 
                className="absolute inset-y-0 left-0 transition-all duration-300"
                style={{ 
                    width: `${percentage}%`,
                    backgroundColor: color,
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.2)'
                }}
            ></div>

            {/* Label / Text */}
            {showText && (
                <div className="absolute inset-0 flex items-center justify-center text-black text-xs font-bold font-mono tracking-widest pixel-shadow z-10">
                    {label && <span className="mr-2 opacity-80">{label}</span>}
                    {Math.ceil(value)}/{max}
                </div>
            )}
        </div>
    );
};

export const Hud: React.FC<HudProps> = ({ stats, inventory, selectedIndex, timeOfDay, dayCount, toggleMap, isMapOpen, onOpenOptions, onSelectSlot,  onOpenInventory, 
  onDragStart 
}) => {
  
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4">
      
      {/* Top Bar: Settings (Left) & Time/Map (Right) */}
      <div className="flex justify-between items-start w-full">
         
         {/* Top Left: Settings */}
         <div className="pointer-events-auto">
             <button 
                onClick={onOpenOptions}
                className="mc-btn w-10 h-10 flex items-center justify-center text-xl bg-[#c6c6c6] border-2 border-black shadow-md hover:bg-[#d6d6d6]"
                title="Options"
             >
                 ⚙️
             </button>
         </div>

         {/* Top Right: Time, Day & Map Toggle */}
         <div className="flex gap-4 items-start">
             <div className="pointer-events-auto">
                 {isMapOpen && (
                     <div className="w-96 h-96 bg-[#c6c6c6] border-4 border-black p-2 opacity-95 transform scale-110 origin-top-left">
                         <div className="w-full h-full bg-[#1a2e1a] relative flex items-center justify-center overflow-hidden">
                             {/* Map Details (Simple visual representation) */}
                             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4a6e4a 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
                             
                             {/* Player Marker */}
                             <div className="w-4 h-4 bg-yellow-400 absolute border-2 border-black transform rotate-45 shadow-md"></div> 
                             
                             <span className="text-black text-2xl font-bold absolute bottom-2 text-center w-full pixel-shadow bg-black/30 py-1">
                                 Map Area #1
                             </span>
                         </div>
                     </div>
                 )}
             </div>
             
             <div className="flex flex-col items-end gap-1 mt-2 mr-2">
                 <div className="text-3xl text-black pixel-shadow font-bold flex flex-col items-end leading-none">
                     <span className={timeOfDay < 12000 ? "text-yellow-400" : "text-blue-300"}>
                         Day {dayCount}
                     </span>
                     <span className="text-xl text-black/70">{Math.floor(timeOfDay/1000)}:00</span>
                 </div>
             </div>
         </div>
      </div>

      {/* Bottom Area */}
      <div className="flex flex-col items-center w-full mb-4">
        
        {/* Status Bars Container */}
        <div className="flex flex-col w-[90%] max-w-[400px] mb-3 gap-1 relative">
             
             <div className="flex gap-2 w-full">
                 {/* HP BAR */}
                 <div className="flex-1">
                    <StatusBar 
                        value={stats.hp} 
                        max={stats.maxHp} 
                        color="#ef4444" // Red
                        label="HP"
                    />
                 </div>

                 {/* HUNGER BAR */}
                 <div className="flex-1">
                    <StatusBar 
                        value={stats.hunger} 
                        max={stats.maxHunger} 
                        color="#22c55e" // Green
                        label="HUNGER"
                    />
                 </div>
             </div>
        </div>

        {/* Hotbar */}
        <div className="flex gap-2 p-2 bg-[#c6c6c6] border-4 border-black shadow-xl pointer-events-auto transform scale-110 origin-bottom">
          {inventory.slice(0, 9).map((slot, i) => (
             <div 
               key={i}
               onMouseDown={(e) => {
                 if (e.button === 0) {
                   onDragStart(i, e.clientX, e.clientY);
                 }
               }}
               onClick={() => {
                 if (i === selectedIndex) {
                   onOpenInventory();
                 } else {
                   onSelectSlot(i);
                 }
               }}
               className={`w-12 h-12 bg-[#8b8b8b] border-2 cursor-pointer ${i === selectedIndex ? 'border-white bg-[#a0a0a0] ring-2 ring-black z-10' : 'border-[#373737]'} relative flex items-center justify-center transition-transform`}
             >
                <span className="text-2xl filter drop-shadow-sm">{ITEM_ICONS[slot.item] || ''}</span>
                {slot.count > 1 && (
                    <span className="absolute bottom-0 right-0 text-black text-sm font-bold pixel-shadow leading-none mb-0.5 mr-1">{slot.count}</span>
                )}
             </div>
          ))}
        </div>
        
        {/* XP Bar Placeholder */}
        <div className="w-[90%] max-w-[440px] h-2 bg-black mt-3 border border-white/20 relative opacity-80">
            <div className="h-full bg-green-500 w-[0%]"></div>
        </div>
        
      </div>

      {/* Control Hints (Bottom Right) */}
      <div className="absolute bottom-2 right-2 text-black/70 text-right text-sm pixel-shadow flex flex-col items-end gap-1 font-bold">
         <span>[E] Inventory</span>
         <span>[M] Map</span>
         <span>[+/-] Zoom</span>
      </div>
    </div>
  );
};
