import React from 'react';
import { InventorySlot, ItemType } from '../../types';
import { ITEM_ICONS } from '../../assets/art';
import { playSound } from '../../utils/audio';

interface HotbarProps {
  inventory: InventorySlot[];
  selectedIndex: number;
  onOpenInventory: () => void;
  onSelectSlot: (index: number) => void;
}

export const Hotbar: React.FC<HotbarProps> = ({ inventory, selectedIndex, onOpenInventory, onSelectSlot }) => {
  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-1 z-40">
      {inventory.slice(0, 2).map((slot, i) => (
        <div 
          key={i}
          onClick={(e) => { e.stopPropagation(); onSelectSlot(i); }}
          className={`w-14 h-14 bg-[#8b8b8b] border-4 ${i === selectedIndex ? 'border-white' : 'border-[#373737]'} flex items-center justify-center relative shadow-inner cursor-pointer`}
        >
          {slot.item !== ItemType.EMPTY && (
            <>
              <span className="text-3xl pointer-events-none filter drop-shadow-sm">{ITEM_ICONS[slot.item] || '?'}</span>
              <span className="absolute bottom-0 right-0 text-black text-base font-bold shadow-black drop-shadow-md pointer-events-none mb-0.5 mr-1">{slot.count}</span>
            </>
          )}
        </div>
      ))}
      <button 
        onClick={(e) => { e.stopPropagation(); playSound('click'); onOpenInventory(); }}
        className="w-14 h-14 bg-[#8b8b8b] border-4 border-[#373737] flex items-center justify-center text-2xl font-bold hover:bg-[#a0a0a0] shadow-inner"
      >
        🎒
      </button>
    </div>
  );
};
