import React from 'react';
import { Attributes } from '../../types';
import { COLORS } from '../../assets/art';

interface ShopProps {
  attributes: Attributes;
  gold: number;
  onUpgrade: (attr: keyof Attributes) => void;
  onResume: () => void;
}

export const Shop: React.FC<ShopProps> = ({ attributes, gold, onUpgrade, onResume }) => {
  const cost = (level: number) => 100; // Fixed price of 100

  const UpgradeCard = ({ label, attrKey, desc, icon }: { label: string; attrKey: keyof Attributes; desc: string; icon: string }) => {
    const lvl = attributes[attrKey];
    const price = cost(lvl);
    const canAfford = gold >= price;

    return (
      <div className="w-56 bg-[#c6c6c6] border-4 border-black p-3 flex flex-col gap-1 shadow-xl relative">
        {/* Inner Panel Look */}
        <div className="absolute inset-0 border-t-4 border-l-4 border-white opacity-50 pointer-events-none"></div>
        <div className="absolute inset-0 border-b-4 border-r-4 border-[#555] opacity-50 pointer-events-none"></div>

        <div className="flex justify-between items-center border-b-2 border-[#777] pb-1 mb-1 z-10">
          <div className="flex items-center gap-2">
             <span className="text-xl">{icon}</span>
             <h3 className="text-lg font-bold text-[#222]">{label}</h3>
          </div>
          <span className="text-emerald-700 font-bold text-sm">Lvl {lvl}</span>
        </div>
        
        <p className="text-sm text-[#444] h-12 leading-tight font-bold z-10">{desc}</p>
        
        <div className="mt-1 flex items-center justify-between z-10">
           <div className="flex items-center gap-1 text-[#222] text-sm">
              <div className="w-3 h-3 bg-emerald-500 border border-black"></div>
              {price}
           </div>
           
           <button
            onClick={() => onUpgrade(attrKey)}
            disabled={!canAfford}
            className="mc-btn px-3 py-1 text-sm font-bold"
          >
            TRADE
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mc-panel p-6 max-w-4xl w-full flex flex-col items-center relative">
        <h2 className="text-2xl mb-1 text-[#444] pixel-shadow">VILLAGER TRADING</h2>
        <p className="text-[#555] mb-6 text-base">Emeralds: <span className="text-emerald-700 font-bold">{gold}</span></p>

        <div className="flex flex-wrap gap-4 justify-center mb-6 w-full">
          <UpgradeCard 
            label="UNBREAKING" 
            attrKey="recovery" 
            icon="🛡️"
            desc="Reduces cooldown for Shield and Sword."
          />
        </div>

        <button
          onClick={onResume}
          className="mc-btn px-8 py-2 text-lg font-bold"
        >
          Leave
        </button>
      </div>
    </div>
  );
};