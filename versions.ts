
export interface Version {
  version: string;
  title: string;
  date: string;
  changes: string[];
}

export const VERSION_HISTORY: Version[] = [
  {
    version: '1.0.0',
    title: 'Forest Duel (Initial Release)',
    date: 'Initial',
    changes: [
      'Core Movement (WASD).',
      'Combat System (Melee Attack & Parry/Shield).',
      'Basic Physics and Collision.',
      'Initial World Generation.'
    ]
  },
  {
    version: '1.2.0',
    title: 'UI Overhaul',
    date: 'Previous',
    changes: [
      'Implemented Minecraft-style Inventory UI.',
      'Added Drag-and-Drop item mechanics.',
      'Added Item Splitting (Right Click) and Quick Move (Shift Click logic).',
      'Added Hotbar selection system.'
    ]
  },
  {
    version: '1.3.0',
    title: 'Crafting & Resources',
    date: 'Previous',
    changes: [
      'Added Crafting Table and 3x3 Crafting Grid.',
      'Added Resources: Wood, Planks, Sticks.',
      'Added Tools: Wooden Sword, Wooden Axe.',
      'Implemented Tree chopping and durability.',
      'Added logic for tool efficiency (Axe vs Sword).'
    ]
  },
  {
    version: '1.4.0',
    title: 'The Living World Update',
    date: 'Previous',
    changes: [
      'Added Passive Mobs: Cows, Sheep, Chickens.',
      'Added Hostile Mobs: Zombies, Skeletons, Creepers.',
      'Implemented Mob AI (Wandering, Chasing, Fleeing).',
      'Added Mob Drops (Beef, Wool, etc.).',
      'Added Hunger System and Starvation damage.',
      'Added Food consumption mechanics.'
    ]
  },
  {
    version: '1.4.1',
    title: 'Bug Fixes',
    date: 'Previous',
    changes: [
      'Fixed bug where items disappeared when closing inventory while holding them.',
      'Items in crafting grid now return to inventory on close.'
    ]
  },
  {
    version: '1.5.0',
    title: 'Mining & Lighting Update',
    date: 'Previous',
    changes: [
      'Added Stone and Coal Ore generation to the world.',
      'Added Furnace block and Charcoal item.',
      'Added Torches with dynamic lighting system.',
      'Torches can be thrown (Left Click) or placed (Right Click).',
      'Implemented Torch decay (burn out after 5 minutes).',
      'Implemented Day/Night light masking system.',
      'Reduced Tree wood drops from 5 to 3 for balance.',
      'Added Stone and Coal drop logic.'
    ]
  },
  {
    version: '1.6.0',
    title: 'Water & Exploration Update',
    date: 'Previous',
    changes: [
      'Added Water bodies (Lakes) to the world generation.',
      'Implemented Breath system. Players take damage if they run out of air.',
      'Movement speed is reduced in water.',
      'Added Birch Trees and Birch Wood.',
      'Added Paper (Crafted from 3 Birch Wood).',
      'Added Map Item (Crafted from 4 Paper).',
      'Map is now an item that must be held to view (Right-click or M).',
      'Fixed animals sliding/bobbing while standing still.'
    ]
  },
  {
    version: '1.7.0',
    title: 'The Slime King Update',
    date: 'Previous',
    changes: [
      'Added Slimes (Daytime spawn).',
      'Added Slime Balls (Dropped by Slimes).',
      'Added Craftable Boss Summon: Slime Crown (Requires 4 Slime Balls).',
      'Added First Boss: GIANT SLIME.',
      'Boss AI: Giant leaps and massive damage.'
    ]
  },
  {
    version: '1.8.0',
    title: 'Visuals & Viewport Update',
    date: 'Previous',
    changes: [
      'Added Zoom Controls (+ and - keys).',
      'Added Zoom indicator to HUD.',
      'Overhauled Tree Textures: Larger, multi-layered canopy and thicker trunks.',
      'Overhauled Rock Textures: Irregular boulder shapes with shading.',
      'Fixed rendering order for tall entities.'
    ]
  },
  {
    version: '1.9.0',
    title: 'Infinite World Update',
    date: 'Previous',
    changes: [
      'Expanded World Size significantly (3000x3000px).',
      'Implemented Camera Follow logic (Camera now tracks the player).',
      'Updated Mob Spawning to happen around the player.',
      'Optimized Background Rendering to only draw visible tiles.',
      'Increased resource density for the larger world.'
    ]
  },
  {
    version: '1.9.1',
    title: 'Spawn Safety Patch',
    date: 'Previous',
    changes: [
      'Added Safe Zone logic to World Generation.',
      'Trees, Rocks, and Lakes can no longer spawn on top of the player start position.'
    ]
  },
  {
    version: '1.9.2',
    title: 'Input Fix',
    date: 'Previous',
    changes: [
      'Fixed cursor drift issue when moving the player.',
      'Crosshair now stays locked to screen position correctly.'
    ]
  },
  {
    version: '1.10.0',
    title: 'Heavy Metal Update',
    date: 'Previous',
    changes: [
      'Added Iron Ore generation.',
      'Added Anvil (Craftable with 8 Iron).',
      'Implemented 4x4 Crafting Grid for Anvil interaction.',
      'Implemented Iron drops from Iron Ore.',
      'Added Door mechanics (Open/Close).'
    ]
  },
  {
    version: '1.11.0',
    title: 'The Depths Update',
    date: 'Current',
    changes: [
      'Added Underground/Mining Dimension.',
      'Added Ladder Item (Crafted with 7 Planks).',
      'Ladders allow travel between Surface and Underground.',
      'Underground is a dense cave system filled with Rocks, Coal, and Iron.',
      'Implemented Dimension Switching logic.'
    ]
  }
];

// Start from the end of array for "Current"
export const CURRENT_VERSION = VERSION_HISTORY[VERSION_HISTORY.length - 1];
