
import React, { useState } from 'react';
import { COLORS, ITEM_ICONS, ITEM_DETAILS } from '../../assets/art';
import { ItemType } from '../../types';
import { CRAFTING_RECIPES } from '../../constants';

interface GameWikiProps {
  onClose: () => void;
}

export const GameWiki: React.FC<GameWikiProps> = ({ onClose }) => {
  
  // State to track which sections are fully expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
      setExpandedSections(prev => ({
          ...prev,
          [id]: !prev[id]
      }));
  };

  // Helper to render a generic entity box
  const EntityPreview = ({ color, width = 'w-8', height = 'h-8', border = true, radius = 'rounded-none' }: any) => (
      <div className={`${width} ${height} ${radius} shrink-0 shadow-md`} style={{ backgroundColor: color, border: border ? '2px solid rgba(0,0,0,0.2)' : 'none' }}></div>
  );

  const Section = ({ title, id, children }: { title: string, id: string, children: React.ReactNode }) => {
      const isExpanded = expandedSections[id];
      const items = React.Children.toArray(children);
      const PREVIEW_COUNT = 6; // Show 6 items (2 rows on desktop) by default
      const hasMore = items.length > PREVIEW_COUNT;
      
      const visibleItems = isExpanded ? items : items.slice(0, PREVIEW_COUNT);

      return (
          <div className="mb-4 border-b-2 border-[#555] pb-2 transition-all duration-300">
              <div 
                  className="flex justify-between items-center cursor-pointer bg-[#a0a0a0] p-2 border-2 border-transparent hover:border-[#777] shadow-sm select-none"
                  onClick={() => hasMore && toggleSection(id)}
              >
                  <h3 className="text-xl text-yellow-400 font-bold pixel-shadow leading-none">{title}</h3>
                  {hasMore ? (
                      <div className="flex items-center gap-2">
                          <span className="text-xs text-[#444] font-mono font-bold">
                              {isExpanded ? 'SHOW LESS' : `SEE ALL (${items.length})`}
                          </span>
                          <span className={`text-[#222] font-bold text-xl transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                              ▼
                          </span>
                      </div>
                  ) : (
                      <span className="text-xs text-[#555] font-mono font-bold opacity-50">ALL SHOWN</span>
                  )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 animate-[fadeIn_0.2s_ease-out]">
                  {visibleItems}
              </div>
              
              {!isExpanded && hasMore && (
                  <div 
                      className="mt-2 text-center bg-[#8b8b8b]/30 p-1 cursor-pointer hover:bg-[#8b8b8b]/50 text-[#ccc] text-xs font-bold border border-transparent hover:border-[#555]"
                      onClick={() => toggleSection(id)}
                  >
                      ... and {items.length - PREVIEW_COUNT} more items
                  </div>
              )}
          </div>
      );
  };

  const ItemCard = ({ name, icon, desc, sub }: { name: string, icon?: any, desc?: string, sub?: React.ReactNode }) => (
      <div className="bg-[#a0a0a0] border-2 border-[#555] p-2 flex items-center gap-3 shadow-sm hover:bg-[#b0b0b0] transition-colors h-full">
          <div className="w-10 h-10 bg-[#8b8b8b] border border-[#373737] flex items-center justify-center text-2xl shrink-0">
              {icon ? icon : sub}
          </div>
          <div className="overflow-hidden">
              <div className="font-bold text-[#222] leading-none truncate">{name}</div>
              {desc && <div className="text-[#444] text-xs mt-0.5 leading-tight line-clamp-2">{desc}</div>}
          </div>
      </div>
  );

  const RecipeCard = ({ recipe }: { recipe: any }) => {
      // Group inputs for display (e.g. 3x Wood)
      const inputCounts: Record<string, number> = {};
      recipe.inputs.forEach((input: string) => {
          inputCounts[input] = (inputCounts[input] || 0) + 1;
      });

      return (
          <div className="bg-[#a0a0a0] border-2 border-[#555] p-2 flex flex-col gap-2 shadow-sm h-full">
              <div className="flex items-center justify-center gap-2 bg-[#8b8b8b] p-1 border border-[#373737]">
                  {/* Inputs */}
                  <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
                      {Object.entries(inputCounts).map(([item, count]) => (
                          <div key={item} className="relative w-8 h-8 bg-[#666] flex items-center justify-center border border-black" title={ITEM_DETAILS[item]?.name}>
                              <span className="text-xl">{ITEM_ICONS[item]}</span>
                              <span className="absolute bottom-0 right-0 text-[10px] text-black font-bold leading-none bg-black/50 px-0.5">{count}</span>
                          </div>
                      ))}
                  </div>
                  
                  <span className="text-[#222] font-bold">➜</span>

                  {/* Output */}
                  <div className="relative w-10 h-10 bg-[#666] flex items-center justify-center border-2 border-black" title={ITEM_DETAILS[recipe.output]?.name}>
                      <span className="text-2xl">{ITEM_ICONS[recipe.output]}</span>
                      <span className="absolute bottom-0 right-0 text-xs text-black font-bold leading-none bg-black/50 px-1">{recipe.count}</span>
                  </div>
              </div>
              <div className="text-center font-bold text-[#222] text-sm leading-none truncate">
                  {ITEM_DETAILS[recipe.output]?.name || recipe.output}
              </div>
          </div>
      );
  };

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8">
      <div className="mc-panel w-full max-w-5xl h-[90vh] flex flex-col relative bg-[#c6c6c6] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b-4 border-[#555] bg-[#a0a0a0] flex justify-between items-center shadow-md shrink-0">
            <h2 className="text-3xl text-[#222] font-bold pixel-shadow tracking-wide">Game Encyclopedia</h2>
            <button 
                onClick={onClose}
                className="mc-btn px-4 py-1 text-xl font-bold text-red-900"
            >
                CLOSE
            </button>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#1a1a1a] shadow-inner custom-scrollbar">
            
            {/* 1. RECIPES */}
            <Section title="Crafting Recipes" id="recipes">
                {CRAFTING_RECIPES.map((recipe, idx) => (
                    <div key={idx}>
                        <RecipeCard recipe={recipe} />
                    </div>
                ))}
            </Section>

            {/* 2. MOBS */}
            <Section title="Passive Mobs" id="passive">
                <ItemCard name="Cow" sub={<EntityPreview color={COLORS.COW} height="h-6" width="w-8" />} desc="Drops Beef. Moos." />
                <ItemCard name="Sheep" sub={<EntityPreview color={COLORS.SHEEP} height="h-6" width="w-8" />} desc="Fluffy. Just vibes." />
                <ItemCard name="Chicken" sub={<EntityPreview color={COLORS.CHICKEN} height="h-6" width="w-6" />} desc="Small & fast." />
            </Section>

            <Section title="Hostile Mobs" id="hostile">
                <ItemCard name="Zombie" sub={<EntityPreview color={COLORS.ZOMBIE} />} desc="Chases you. Melee attack." />
                <ItemCard name="Skeleton" sub={<EntityPreview color={COLORS.SKELETON} />} desc="Shoots arrows from afar." />
                <ItemCard name="Creeper" sub={<EntityPreview color={COLORS.CREEPER} />} desc="Explodes on contact!" />
                <ItemCard name="Spider" sub={<EntityPreview color={COLORS.SPIDER} />} desc="Fast & Dangerous. Drops String." />
                <ItemCard name="Slime" sub={<EntityPreview color={COLORS.SLIME} />} desc="Jumps at you." />
            </Section>

            <Section title="Bosses" id="bosses">
                 <div className="col-span-2 md:col-span-3 bg-[#331111] border-2 border-red-900 p-4 flex items-center gap-4">
                    <div className="w-20 h-20 bg-green-500 border-4 border-green-800 flex items-center justify-center animate-bounce">
                        <div className="w-10 h-10 bg-[#aeea00]"></div>
                    </div>
                    <div>
                        <h4 className="text-2xl text-red-500 font-bold pixel-shadow">GIANT SLIME</h4>
                        <p className="text-[#ccc]">Summoned with Slime Crown. Has massive HP and deals heavy damage.</p>
                    </div>
                 </div>
            </Section>

            {/* 2.5 DIMENSIONS */}
            <Section title="Worlds & Dimensions" id="worlds">
                <ItemCard 
                    name="The Surface" 
                    sub={<EntityPreview color={COLORS.GRASS_BASE_1} />} 
                    desc="The overworld. Has trees, water, and monsters at night." 
                />
                <ItemCard 
                    name="The Underground" 
                    sub={<EntityPreview color={COLORS.BG_UNDERGROUND} />} 
                    desc="Dense cave layer. Rich in Stone, Coal, and Iron." 
                />
                <ItemCard 
                    name="Travel" 
                    icon={ITEM_ICONS[ItemType.LADDER]} 
                    desc="Right-click a Ladder to switch dimensions." 
                />
            </Section>

            {/* 3. NATURE */}
            <Section title="Nature" id="nature">
                <ItemCard name="Oak Tree" sub={<div className="flex flex-col items-center"><div className="w-6 h-6 rounded-full bg-[#1b5e20] -mb-2 z-10"></div><div className="w-2 h-4 bg-[#5D4037]"></div></div>} desc="Drops Oak Wood." />
                <ItemCard name="Birch Tree" sub={<div className="flex flex-col items-center"><div className="w-6 h-6 rounded-full bg-[#558b2f] -mb-2 z-10"></div><div className="w-2 h-4 bg-[#eceff1]"></div></div>} desc="Drops Birch Wood." />
            </Section>
            
            <Section title="Blocks" id="blocks">
                <ItemCard name="Grass Block" sub={<EntityPreview color={COLORS.GRASS_BASE_1} />} desc="The ground you walk on." />
                <ItemCard name="Rock" sub={<EntityPreview color={COLORS.STONE} radius="rounded-lg" />} desc="Drops Stone." />
                <ItemCard name="Coal Ore" sub={<div className="w-8 h-8 bg-[#78909c] relative"><div className="absolute inset-2 bg-[#212121]"></div></div>} desc="Drops Coal & Stone." />
                <ItemCard name="Iron Ore" sub={<div className="w-8 h-8 bg-[#d7ccc8] relative"><div className="absolute inset-2 bg-[#8d6e63]"></div></div>} desc="Drops Iron & Stone. Found Underground." />
                <ItemCard name="Water" sub={<EntityPreview color={COLORS.WATER} border={false} />} desc="Slows movement. Requires breath." />
            </Section>

            {/* 4. ITEMS */}
            <Section title="Tools & Weapons" id="tools">
                <ItemCard name="Wooden Sword" icon={ITEM_ICONS[ItemType.SWORD_WOOD]} desc={ITEM_DETAILS[ItemType.SWORD_WOOD].desc} />
                <ItemCard name="Stone Sword" icon={ITEM_ICONS[ItemType.SWORD_STONE]} desc={ITEM_DETAILS[ItemType.SWORD_STONE].desc} />
                <ItemCard name="Wooden Pickaxe" icon={ITEM_ICONS[ItemType.PICKAXE_WOOD]} desc={ITEM_DETAILS[ItemType.PICKAXE_WOOD].desc} />
                <ItemCard name="Stone Pickaxe" icon={ITEM_ICONS[ItemType.PICKAXE_STONE]} desc={ITEM_DETAILS[ItemType.PICKAXE_STONE].desc} />
                <ItemCard name="Bow" icon={ITEM_ICONS[ItemType.BOW]} desc="Crafted with Sticks and String." />
            </Section>

            <Section title="Resources & Crafting" id="resources">
                <ItemCard name="Crafting Table" icon={ITEM_ICONS[ItemType.CRAFTING_TABLE]} desc="Enables 3x3 crafting grid." />
                <ItemCard name="Furnace" icon={ITEM_ICONS[ItemType.FURNACE]} desc="Smelts ores and cooks food." />
                <ItemCard name="Anvil" icon={ITEM_ICONS[ItemType.ANVIL]} desc="Heavy crafting (4x4 grid)." />
                <ItemCard name="Torch" icon={ITEM_ICONS[ItemType.TORCH]} desc="Provides light. Thrown or Placed." />
                <ItemCard name="Ladder" icon={ITEM_ICONS[ItemType.LADDER]} desc="Used to access the Underground." />
                <ItemCard name="Vine" icon={ITEM_ICONS[ItemType.VINE]} desc="Dropped by Spiders." />
                <ItemCard name="Wood" icon={ITEM_ICONS[ItemType.WOOD]} />
                <ItemCard name="Planks" icon={ITEM_ICONS[ItemType.PLANKS]} />
                <ItemCard name="Stick" icon={ITEM_ICONS[ItemType.STICK]} />
                <ItemCard name="Stone" icon={ITEM_ICONS[ItemType.STONE]} />
                <ItemCard name="Coal" icon={ITEM_ICONS[ItemType.COAL]} />
                <ItemCard name="Iron" icon={ITEM_ICONS[ItemType.IRON]} />
            </Section>

            {/* 5. COMMANDS */}
            <div className="mb-6 border-b-2 border-[#555] pb-4">
                <h3 className="text-2xl text-blue-400 font-bold mb-4 pixel-shadow">Commands (Press T or /)</h3>
                <div className="bg-[#a0a0a0] border-2 border-[#555] p-4 text-[#222]">
                    <ul className="list-disc list-inside space-y-2 font-mono text-sm md:text-base">
                        <li><strong>/give &lt;Item&gt; [count]</strong> - Give yourself items (e.g., /give diamond 64).</li>
                        <li><strong>/spawn &lt;Mob&gt;</strong> - Spawn an entity (e.g., /spawn creeper).</li>
                        <li><strong>/time set &lt;day|night|value&gt;</strong> - Change time of day.</li>
                        <li><strong>/heal</strong> - Restore HP and Hunger to max.</li>
                        <li><strong>/clear</strong> - Clear entire inventory.</li>
                        <li><strong>/kill</strong> - Kill your character (Respawn).</li>
                    </ul>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
