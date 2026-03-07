

import React, { useState, useEffect, useRef } from 'react';
import { InventorySlot, ItemType, CursorState, Equipment } from '../../types';
import { CRAFTING_RECIPES, MAX_STACK } from '../../constants';
import { ITEM_ICONS, ITEM_DETAILS } from '../../assets/art';
import { playSound } from '../../utils/audio';

interface InventoryProps {
  cursor: CursorState;
  updateInventory: (newInv: InventorySlot[]) => void;
  close: () => void;
  onOpenOptions: () => void;
  addSystemMsg: (msg: string, isError?: boolean) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ cursor, updateInventory, close, onOpenOptions, addSystemMsg }) => {
  const [hand, setHand] = useState<InventorySlot>({ item: ItemType.EMPTY, count: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isRightDragging, setIsRightDragging] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<ItemType | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, index: number, isCraft: boolean } | null>(null);
  
  // Force update trigger for Equipment changes
  const [_, setForceUpdate] = useState(0);

  // Local state for crafting grid
  const [craftGrid, setCraftGrid] = useState<InventorySlot[]>(
      Array.from({ length: 16 }, () => ({ item: ItemType.EMPTY, count: 0 }))
  ); 
  const [craftOutput, setCraftOutput] = useState<InventorySlot | null>(null);

  // Refs to track state for cleanup (when inventory closes via 'E' or button)
  const handRef = useRef(hand);
  const craftGridRef = useRef(craftGrid);
  
  useEffect(() => { handRef.current = hand; }, [hand]);
  useEffect(() => { craftGridRef.current = craftGrid; }, [craftGrid]);

  const isAnvil = cursor.isAnvilOpen;
  const is3x3 = cursor.isCraftingTableOpen;
  const gridSize = isAnvil ? 4 : (is3x3 ? 3 : 2);

  // Cleanup: Return items to inventory when closing
  useEffect(() => {
    return () => {
        const itemsToReturn = [];
        if (handRef.current.item !== ItemType.EMPTY) itemsToReturn.push(handRef.current);
        craftGridRef.current.forEach(slot => {
            if (slot.item !== ItemType.EMPTY) itemsToReturn.push(slot);
        });
        
        if (itemsToReturn.length === 0) return;

        // Direct mutation of cursor.inventory since component is unmounting
        const inv = cursor.inventory; 
        
        itemsToReturn.forEach(toReturn => {
            let remaining = toReturn.count;
            
            // 1. Stack
            for (let i = 0; i < inv.length; i++) {
                if (inv[i].item === toReturn.item && inv[i].count < MAX_STACK) {
                    const space = MAX_STACK - inv[i].count;
                    const add = Math.min(space, remaining);
                    inv[i].count += add;
                    remaining -= add;
                    if (remaining <= 0) break;
                }
            }
            
            // 2. Empty
            if (remaining > 0) {
                for (let i = 0; i < inv.length; i++) {
                    if (inv[i].item === ItemType.EMPTY) {
                        inv[i].item = toReturn.item;
                        inv[i].count = remaining;
                        remaining = 0;
                        break;
                    }
                }
            }
        });
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => {
        setIsRightDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
      checkRecipe(craftGrid);
  }, [craftGrid]);

  // --- HELPER LOGIC ---

  const simulateAdd = (list: InventorySlot[], item: ItemType, count: number): { updatedList: InventorySlot[], remaining: number } => {
    const newList = list.map(s => ({...s}));
    let remaining = count;

    // 1. Fill existing stacks
    for (let slot of newList) {
        if (remaining <= 0) break;
        if (slot.item === item && slot.count < MAX_STACK) {
            const space = MAX_STACK - slot.count;
            const toAdd = Math.min(space, remaining);
            slot.count += toAdd;
            remaining -= toAdd;
        }
    }

    // 2. Fill empty slots
    for (let slot of newList) {
        if (remaining <= 0) break;
        if (slot.item === ItemType.EMPTY) {
            const toAdd = Math.min(MAX_STACK, remaining);
            slot.item = item;
            slot.count = toAdd;
            remaining -= toAdd;
        }
    }

    return { updatedList: newList, remaining };
  };

  const updateSlot = (index: number, newSlot: InventorySlot, isCraftingInput: boolean) => {
      if (isCraftingInput) {
          const newGrid = [...craftGrid];
          newGrid[index] = newSlot;
          setCraftGrid(newGrid);
      } else {
          const newInv = [...cursor.inventory];
          newInv[index] = newSlot;
          updateInventory(newInv);
      }
  };

  const getArmorType = (item: ItemType): keyof Equipment | null => {
      if (item.includes('HELMET')) return 'head';
      if (item.includes('CHEST')) return 'chest';
      if (item.includes('LEGS')) return 'legs';
      if (item.includes('BOOTS')) return 'feet';
      return null;
  };

  const handleEquipmentClick = (slotKey: keyof Equipment) => {
      const slot = cursor.equipment[slotKey];
      if (slot.item === ItemType.EMPTY) return;
      
      // Unequip to inventory
      const { updatedList: newInv, remaining } = simulateAdd(cursor.inventory, slot.item, slot.count);
      
      if (remaining === 0) {
          cursor.equipment[slotKey] = { item: ItemType.EMPTY, count: 0 };
          updateInventory(newInv);
          setForceUpdate(p => p + 1);
      } else {
          addSystemMsg("Inventory full!");
      }
  };

  const consumeCraftingIngredients = () => {
      const newGrid = craftGrid.map(slot => {
          if (slot.item === ItemType.EMPTY) return slot;
          if (slot.count > 1) return { ...slot, count: slot.count - 1 };
          return { item: ItemType.EMPTY, count: 0 };
      });
      setCraftGrid(newGrid);
  };

  // --- INTERACTION HANDLERS ---

  const handleDoubleClick = (index: number) => {
      const clickedSlot = cursor.inventory[index];
      let targetType = hand.item;
      let currentHandCount = hand.count;

      if (hand.item === ItemType.EMPTY && clickedSlot.item !== ItemType.EMPTY) {
          targetType = clickedSlot.item;
          currentHandCount = 0; 
      } else if (hand.item !== ItemType.EMPTY && clickedSlot.item === hand.item) {
          // match
      } else {
          return;
      }

      if (targetType === ItemType.EMPTY) return;

      const newInv = [...cursor.inventory];
      const newCraftGrid = [...craftGrid];

      const gatherFromList = (list: InventorySlot[]) => {
          for (let i = 0; i < list.length; i++) {
              if (currentHandCount >= MAX_STACK) break;
              if (list[i].item === targetType) {
                  const spaceInHand = MAX_STACK - currentHandCount;
                  const take = Math.min(list[i].count, spaceInHand);
                  currentHandCount += take;
                  list[i].count -= take;
                  if (list[i].count <= 0) list[i] = { item: ItemType.EMPTY, count: 0 };
              }
          }
      };

      gatherFromList(newInv);
      gatherFromList(newCraftGrid);

      setHand({ item: targetType, count: currentHandCount });
      updateInventory(newInv);
      setCraftGrid(newCraftGrid);
  };

  const handleShiftClick = (index: number, isCraftingInput: boolean, isCraftingOutput: boolean) => {
      // 1. MASS CRAFTING (Output Slot)
      if (isCraftingOutput && craftOutput) {
          let maxCrafts = 999;
          craftGrid.forEach(slot => {
              if (slot.item !== ItemType.EMPTY) {
                  if (slot.count < maxCrafts) maxCrafts = slot.count;
              }
          });
          if (maxCrafts === 0 || maxCrafts === 999) maxCrafts = 0;

          if (maxCrafts > 0) {
              let currentInv = cursor.inventory.map(s => ({...s}));
              let craftedCount = 0;

              for (let i = 0; i < maxCrafts; i++) {
                   const { updatedList, remaining } = simulateAdd(currentInv, craftOutput.item, craftOutput.count);
                   if (remaining === 0) {
                       currentInv = updatedList;
                       craftedCount++;
                   } else {
                       break; 
                   }
              }
              
              if (craftedCount > 0) {
                  const finalGrid = craftGrid.map(s => {
                       if (s.item !== ItemType.EMPTY) {
                           const newCount = s.count - craftedCount;
                           return newCount > 0 ? { ...s, count: newCount } : { item: ItemType.EMPTY, count: 0 };
                       }
                       return s;
                  });
                  updateInventory(currentInv);
                  setCraftGrid(finalGrid);
              }
          }
      } 
      // 2. INVENTORY -> CRAFT GRID / EQUIPMENT (Auto Equip not implemented, prioritizes Craft grid)
      else if (!isCraftingInput && !isCraftingOutput) {
           const slot = cursor.inventory[index];
           if (slot.item === ItemType.EMPTY) return;

           // Try equip first?
           const armorType = getArmorType(slot.item);
           if (armorType) {
               // Check if empty
               if (cursor.equipment[armorType].item === ItemType.EMPTY) {
                   cursor.equipment[armorType] = { ...slot };
                   const newInv = [...cursor.inventory];
                   newInv[index] = { item: ItemType.EMPTY, count: 0 };
                   updateInventory(newInv);
                   setForceUpdate(p => p+1);
                   return;
               }
           }

           const { updatedList: newGrid, remaining } = simulateAdd(craftGrid, slot.item, slot.count);
           
           if (remaining !== slot.count) {
               setCraftGrid(newGrid);
               const newInv = [...cursor.inventory];
               newInv[index] = remaining === 0 
                   ? { item: ItemType.EMPTY, count: 0 } 
                   : { ...slot, count: remaining };
               updateInventory(newInv);
           }
      }
      // 3. CRAFT GRID -> INVENTORY
      else if (isCraftingInput) {
          const slot = craftGrid[index];
          if (slot.item === ItemType.EMPTY) return;

          const { updatedList: newInv, remaining } = simulateAdd(cursor.inventory, slot.item, slot.count);
          
          if (remaining !== slot.count) {
              updateInventory(newInv);
              const newGrid = [...craftGrid];
              newGrid[index] = remaining === 0 
                  ? { item: ItemType.EMPTY, count: 0 } 
                  : { ...slot, count: remaining };
              setCraftGrid(newGrid);
          }
      }
  };

  const handleSlotClick = (e: React.MouseEvent, index: number, isCraftingInput: boolean = false, isCraftingOutput: boolean = false) => {
      if (e.shiftKey) {
          handleShiftClick(index, isCraftingInput, isCraftingOutput);
          return;
      }

      if (isCraftingOutput && craftOutput) {
          if (hand.item === ItemType.EMPTY) {
              playSound('craft');
              setHand({ ...craftOutput });
              consumeCraftingIngredients();
          } else if (hand.item === craftOutput.item && hand.count + craftOutput.count <= MAX_STACK) {
              playSound('craft');
              setHand({ ...hand, count: hand.count + craftOutput.count });
              consumeCraftingIngredients();
          }
          return;
      }

      const currentSlot = isCraftingInput ? craftGrid[index] : cursor.inventory[index];

      // 1. Pick up
      if (hand.item === ItemType.EMPTY) {
          if (currentSlot.item !== ItemType.EMPTY) {
              playSound('pickup');
              setHand(currentSlot);
              updateSlot(index, { item: ItemType.EMPTY, count: 0 }, isCraftingInput);
          }
          return;
      }

      // 2. Place
      if (currentSlot.item === ItemType.EMPTY) {
          updateSlot(index, hand, isCraftingInput);
          setHand({ item: ItemType.EMPTY, count: 0 });
          return;
      }

      // 3. Stack
      if (currentSlot.item === hand.item) {
          const space = MAX_STACK - currentSlot.count;
          if (space > 0) {
              const toAdd = Math.min(space, hand.count);
              updateSlot(index, { ...currentSlot, count: currentSlot.count + toAdd }, isCraftingInput);
              
              const newHandCount = hand.count - toAdd;
              setHand(newHandCount > 0 ? { ...hand, count: newHandCount } : { item: ItemType.EMPTY, count: 0 });
          }
          return;
      }

      // 4. Swap
      if (currentSlot.item !== hand.item) {
          const temp = currentSlot;
          updateSlot(index, hand, isCraftingInput);
          setHand(temp);
          return;
      }
  };

  const handleRightClickDown = (e: React.MouseEvent, index: number, isCraftingInput: boolean = false) => {
      e.preventDefault();
      
      const currentSlot = isCraftingInput ? craftGrid[index] : cursor.inventory[index];

      // Open context menu if hand is empty
      if (hand.item === ItemType.EMPTY && currentSlot.item !== ItemType.EMPTY) {
          setContextMenu({ x: e.clientX, y: e.clientY, index, isCraft: isCraftingInput });
          return;
      }

      // Case 1: Hand has items -> Place 1
      if (hand.item !== ItemType.EMPTY) {
          setIsRightDragging(true); 
          
          if (currentSlot.item === ItemType.EMPTY) {
              updateSlot(index, { item: hand.item, count: 1 }, isCraftingInput);
              setHand(prev => prev.count > 1 ? { ...prev, count: prev.count - 1 } : { item: ItemType.EMPTY, count: 0 });
          } else if (currentSlot.item === hand.item && currentSlot.count < MAX_STACK) {
              updateSlot(index, { ...currentSlot, count: currentSlot.count + 1 }, isCraftingInput);
              setHand(prev => prev.count > 1 ? { ...prev, count: prev.count - 1 } : { item: ItemType.EMPTY, count: 0 });
          }
          return;
      }

      // Case 2: Hand empty -> Pick up half
      if (hand.item === ItemType.EMPTY && currentSlot.item !== ItemType.EMPTY) {
           const take = Math.ceil(currentSlot.count / 2);
           const leave = currentSlot.count - take;
           
           setHand({ item: currentSlot.item, count: take });
           updateSlot(index, leave > 0 ? { ...currentSlot, count: leave } : { item: ItemType.EMPTY, count: 0 }, isCraftingInput);
      }
  };

  const handleMouseEnter = (index: number, isCraftingInput: boolean = false) => {
      const currentSlot = isCraftingInput ? craftGrid[index] : cursor.inventory[index];
      if (currentSlot.item !== ItemType.EMPTY) setHoveredItem(currentSlot.item);
      else setHoveredItem(null);

      // Drag Paint
      if (isRightDragging && hand.item !== ItemType.EMPTY) {
           if (currentSlot.item === ItemType.EMPTY) {
               updateSlot(index, { item: hand.item, count: 1 }, isCraftingInput);
               setHand(prev => prev.count > 1 ? { ...prev, count: prev.count - 1 } : { item: ItemType.EMPTY, count: 0 });
           } else if (currentSlot.item === hand.item && currentSlot.count < MAX_STACK) {
               updateSlot(index, { ...currentSlot, count: currentSlot.count + 1 }, isCraftingInput);
               setHand(prev => prev.count > 1 ? { ...prev, count: prev.count - 1 } : { item: ItemType.EMPTY, count: 0 });
           }
      }
  };
  
  const handleMouseLeave = () => {
      setHoveredItem(null);
  };

  const checkRecipe = (grid: InventorySlot[]) => {
      const inputTypes = grid.map(s => s.item).filter(t => t !== ItemType.EMPTY).sort();
      let found = null;
      for (const r of CRAFTING_RECIPES) {
          const req = [...r.inputs].sort();
          if (JSON.stringify(req) === JSON.stringify(inputTypes)) {
              found = { item: r.output as ItemType, count: r.count };
              break;
          }
      }

      if (!found && gridSize >= 3) {
          const g = grid.map(s => s.item);
          const isPlank = (i: number) => g[i] === ItemType.PLANKS;
          const isStone = (i: number) => g[i] === ItemType.STONE;
          const isStick = (i: number) => g[i] === ItemType.STICK;
          const isEmpty = (i: number) => g[i] === ItemType.EMPTY;
          
          if (isStick(4) && isStick(7) && isEmpty(3) && isEmpty(5) && isEmpty(6) && isEmpty(8)) {
              if (isPlank(0) && isPlank(1) && isPlank(2)) found = { item: ItemType.PICKAXE_WOOD, count: 1 };
              else if (isStone(0) && isStone(1) && isStone(2)) found = { item: ItemType.PICKAXE_STONE, count: 1 };
          }
          else if (isStick(4) && isStick(7) && isEmpty(2) && isEmpty(5) && isEmpty(6) && isEmpty(8)) {
              if (isPlank(0) && isPlank(1) && isPlank(3)) found = { item: ItemType.AXE_WOOD, count: 1 };
              else if (isStone(0) && isStone(1) && isStone(3)) found = { item: ItemType.AXE_STONE, count: 1 };
          }
          else if (isStick(7) && isEmpty(0) && isEmpty(2) && isEmpty(3) && isEmpty(5) && isEmpty(6) && isEmpty(8)) {
              if (isPlank(1) && isPlank(4)) found = { item: ItemType.SWORD_WOOD, count: 1 };
              else if (isStone(1) && isStone(4)) found = { item: ItemType.SWORD_STONE, count: 1 };
          }
      }
      
      setCraftOutput(found);
  };

  const renderSlot = (slot: InventorySlot, idx: number, isCraft: boolean = false) => {
      return (
          <div 
            key={`${isCraft ? 'c' : 'i'}-${idx}`}
            onClick={(e) => handleSlotClick(e, idx, isCraft)}
            onMouseDown={(e) => {
                if(e.button === 2) handleRightClickDown(e, idx, isCraft);
            }}
            onMouseEnter={() => handleMouseEnter(idx, isCraft)}
            onMouseLeave={handleMouseLeave}
            onContextMenu={(e) => e.preventDefault()}
            onDoubleClick={() => !isCraft && handleDoubleClick(idx)}
            className="w-4 h-4 bg-[#8b8b8b] border border-[#373737] hover:bg-[#a0a0a0] flex items-center justify-center relative cursor-pointer select-none shadow-inner group"
          >
              {slot.item !== ItemType.EMPTY && (
                  <>
                    <span className="text-[10px] pointer-events-none filter drop-shadow-sm">{ITEM_ICONS[slot.item] || '?'}</span>
                    <span className="absolute bottom-0 right-0 text-black text-[8px] font-bold shadow-black drop-shadow-md pointer-events-none mb-0.5 mr-1">{slot.count}</span>
                  </>
              )}
          </div>
      );
  };

  const renderEquipmentSlot = (slotKey: keyof Equipment, bgIcon: string, isCosmetic: boolean = false) => {
      const slot = cursor.equipment[slotKey];
      return (
          <div 
             onClick={() => handleEquipmentClick(slotKey)}
             onMouseEnter={() => slot.item !== ItemType.EMPTY ? setHoveredItem(slot.item) : null}
             onMouseLeave={handleMouseLeave}
             className={`w-12 h-12 border-2 flex items-center justify-center relative cursor-pointer shadow-inner
                ${isCosmetic ? 'bg-[#777] border-[#444]' : 'bg-[#8b8b8b] border-[#373737] hover:bg-[#a0a0a0]'}
             `}
          >
              {slot.item === ItemType.EMPTY ? (
                  <span className="text-2xl opacity-20 pointer-events-none grayscale">{bgIcon}</span>
              ) : (
                  <span className="text-3xl pointer-events-none filter drop-shadow-sm">{ITEM_ICONS[slot.item]}</span>
              )}
          </div>
      );
  };

  return (
    <div 
        className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" 
        onContextMenu={e => e.preventDefault()}
        onClick={close}
    >
        {/* Main Panel */}
        <div 
            className="mc-panel p-4 bg-[#c6c6c6] flex flex-col gap-4 relative"
            onClick={e => e.stopPropagation()}
        >
            {/* Close Button */}
            <button 
                onClick={close}
                className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 border-2 border-black text-white font-bold flex items-center justify-center hover:bg-red-500 shadow-lg z-[60]"
            >
                X
            </button>
            
            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="absolute z-[100] bg-[#c6c6c6] border-2 border-black p-1 shadow-xl flex flex-col gap-1"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button 
                        className="mc-btn px-4 py-1 text-sm font-bold text-left hover:bg-[#d6d6d6]"
                        onClick={() => {
                            // Equip logic
                            const slot = contextMenu.isCraft ? craftGrid[contextMenu.index] : cursor.inventory[contextMenu.index];
                            if (slot.item === ItemType.BACKPACK && !cursor.isBackpackEquipped) {
                                cursor.isBackpackEquipped = true;
                                // Increase inventory size
                                const newInv = [...cursor.inventory];
                                // Remove backpack from inventory
                                newInv[contextMenu.index] = { item: ItemType.EMPTY, count: 0 };
                                // Add more slots
                                for(let i=0; i<36; i++) newInv.push({ item: ItemType.EMPTY, count: 0 });
                                updateInventory(newInv);
                                addSystemMsg(`Equipped Backpack! Inventory expanded.`);
                            } else if (slot.item.includes('HELMET') || slot.item.includes('CHEST') || slot.item.includes('LEGS') || slot.item.includes('BOOTS')) {
                                addSystemMsg(`Equipped ${slot.item}`);
                            }
                            setContextMenu(null);
                        }}
                    >
                        🛡️ EQUIP
                    </button>
                    <button 
                        className="mc-btn px-4 py-1 text-sm font-bold text-left hover:bg-[#d6d6d6]"
                        onClick={() => {
                            // Drop logic
                            const index = contextMenu.index;
                            const isCraft = contextMenu.isCraft;
                            
                            if (isCraft) {
                                const newGrid = [...craftGrid];
                                newGrid[index] = { item: ItemType.EMPTY, count: 0 };
                                setCraftGrid(newGrid);
                            } else {
                                const newInv = [...cursor.inventory];
                                newInv[index] = { item: ItemType.EMPTY, count: 0 };
                                updateInventory(newInv);
                            }
                            setContextMenu(null);
                        }}
                    >
                        🗑️ DROP
                    </button>
                    <button 
                        className="mc-btn px-4 py-1 text-sm font-bold text-left hover:bg-[#d6d6d6]"
                        onClick={() => setContextMenu(null)}
                    >
                        ❌ CLOSE
                    </button>
                </div>
            )}
            
            {/* Top Section: Crafting */}
            <div className="flex gap-4">
                {/* Right Column: Crafting */}
                <div className="flex flex-col gap-2 flex-1">
                    <h2 className="text-[#444] text-2xl font-bold px-1">
                        {isAnvil ? 'Anvil' : (is3x3 ? 'Crafting Table' : 'Crafting')}
                    </h2>
                    <div className="flex justify-center items-start gap-4 p-4 bg-[#c6c6c6] border-2 border-transparent">
                        <div className="flex flex-col items-center">
                            <div className="grid gap-1 bg-[#8b8b8b] p-0.5 border-2 border-[#373737] shadow-inner" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                                {Array(gridSize * gridSize).fill(0).map((_, i) => renderSlot(craftGrid[i], i, true))}
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center h-full pt-8">
                            <div className="w-10 h-8 bg-[#c6c6c6] flex items-center justify-center text-[#444] text-4xl">→</div>
                        </div>
                        <div className="flex flex-col items-center justify-center pt-6">
                            <div 
                                onClick={(e) => handleSlotClick(e, 0, false, true)}
                                onMouseEnter={() => {
                                    if(craftOutput) setHoveredItem(craftOutput.item);
                                }}
                                onMouseLeave={handleMouseLeave}
                                className="w-20 h-20 bg-[#8b8b8b] border-2 border-[#373737] flex items-center justify-center cursor-pointer hover:bg-[#a0a0a0] relative shadow-inner"
                            >
                                {craftOutput && (
                                    <div className="flex flex-col items-center pointer-events-none">
                                        <span className="text-5xl">{ITEM_ICONS[craftOutput.item] || '?'}</span>
                                        <span className="text-base font-bold absolute bottom-0.5 right-0.5 text-black shadow-black drop-shadow-md">{craftOutput.count}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-1 flex justify-between items-center">
                <h2 className="text-[#444] text-2xl font-bold">Inventory</h2>
                <button 
                    onClick={onOpenOptions}
                    className="mc-btn px-4 py-1 text-sm font-bold text-[#222]"
                >
                    Settings
                </button>
            </div>
            
            {/* Inventory Slots */}
            <div className="p-0">
                <div className="flex gap-1 pt-2 border-t-2 border-[#888]">
                    {cursor.inventory.slice(0, 4).map((slot, i) => renderSlot(slot, i))}
                </div>
            </div>
        </div>

        {hand.item !== ItemType.EMPTY && (
            <div 
                className="fixed pointer-events-none z-[100] drop-shadow-xl"
                style={{ 
                    left: mousePos.x, 
                    top: mousePos.y,
                    transform: 'translate(-50%, -50%)' 
                }}
            >
                <div className="w-14 h-14 flex items-center justify-center relative">
                    <span className="text-4xl">{ITEM_ICONS[hand.item]}</span>
                    <span className="absolute bottom-0 right-0 text-black text-base font-bold pixel-shadow">{hand.count}</span>
                </div>
            </div>
        )}

        {/* TOOLTIP */}
        {hoveredItem && hand.item === ItemType.EMPTY && ITEM_DETAILS[hoveredItem] && (
             <div 
                className="fixed z-[110] pointer-events-none bg-[#100010] border-2 border-[#5000ff] p-3 flex flex-col gap-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]"
                style={{
                    left: mousePos.x + 20,
                    top: mousePos.y
                }}
             >
                 <span className="text-[#55ffff] font-bold text-3xl leading-none pixel-shadow">{ITEM_DETAILS[hoveredItem].name}</span>
                 {ITEM_DETAILS[hoveredItem].desc && (
                     <span className="text-[#aaaaaa] text-xl leading-tight max-w-[250px]">{ITEM_DETAILS[hoveredItem].desc}</span>
                 )}
                 <span className="text-[#555555] text-sm italic mt-1">minecraft:item</span>
             </div>
        )}
    </div>
  );
};
