
import React, { useEffect, useCallback } from 'react';
import { GameState, ItemType, WorldState } from '../types';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '../constants';

interface UseGameInputProps {
  gameState: GameState;
  world: React.MutableRefObject<WorldState>;
  setActiveSlot: (item: ItemType) => void;
  toggleMap: () => void;
  isChatOpen: boolean;
  currentZoom: number;
  onZoomChange: (zoom: number) => void;
  controlScheme: 'TAP_TO_MOVE' | 'JOYSTICK';
}

export const useGameInput = ({ gameState, world, toggleMap, isChatOpen, currentZoom, onZoomChange, controlScheme }: UseGameInputProps) => {
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!world.current) return;
    
    // In Joystick mode, do NOT update mousePos from mouse movement for aiming
    // But we still need screenMousePos for UI interactions if inventory is open
    world.current.cursor.screenMousePos = { x: e.clientX, y: e.clientY };
    
    if (world.current.cursor.isInventoryOpen) {
         world.current.cursor.mousePos = { x: e.clientX, y: e.clientY };
    } else if (controlScheme === 'TAP_TO_MOVE') {
         // Only update world mousePos if in Tap/Mouse mode
         // In Joystick mode, JoystickControls handles this
         // We don't update it here to avoid overwriting joystick aim
    }
  }, [world, controlScheme]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== GameState.PLAYING || !world.current) return;
    if (isChatOpen) return; // BLOCK INPUTS WHEN CHAT IS OPEN
    
    const key = e.key.toLowerCase();
    const c = world.current.cursor;

    if (key === 'w') c.keys.w = true;
    if (key === 'a') c.keys.a = true;
    if (key === 's') c.keys.s = true;
    if (key === 'd') c.keys.d = true;

    if (key === 'q') c.isRightDown = true;

    if (key === 'e') {
        c.isInventoryOpen = !c.isInventoryOpen;
        if (c.isInventoryOpen) {
            const held = c.inventory[c.hotbarSelectedIndex].item;
            c.isCraftingTableOpen = held === ItemType.CRAFTING_TABLE;
            // Ensure Anvil state is reset if opening from key, unless logic overrides elsewhere (logic.ts overrides for right click)
            c.isAnvilOpen = false;
        } else {
            // Reset special states on close
            c.isCraftingTableOpen = false;
            c.isAnvilOpen = false;
        }
    }

    if (key === 'm') toggleMap();

    if (['1','2'].includes(key)) {
        c.hotbarSelectedIndex = parseInt(key) - 1;
    }
    
    // Zoom Controls
    if (e.key === '+' || e.key === '=') {
        const nextZoom = Math.min(ZOOM_MAX, currentZoom + ZOOM_STEP);
        onZoomChange(nextZoom);
    }
    if (e.key === '-' || e.key === '_') {
        const nextZoom = Math.max(ZOOM_MIN, currentZoom - ZOOM_STEP);
        onZoomChange(nextZoom);
    }

  }, [gameState, world, toggleMap, isChatOpen, currentZoom, onZoomChange]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // We allow KeyUp even if chat is open to prevent "stuck" keys if user opens chat while walking
    if (!world.current) return;
    const key = e.key.toLowerCase();
    if (key === 'w') world.current.cursor.keys.w = false;
    if (key === 'a') world.current.cursor.keys.a = false;
    if (key === 's') world.current.cursor.keys.s = false;
    if (key === 'd') world.current.cursor.keys.d = false;
    if (key === 'q') world.current.cursor.isRightDown = false;
  }, [world]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (gameState !== GameState.PLAYING || !world.current) return;
    if (world.current.cursor.isInventoryOpen || isChatOpen) return; 

    const cursor = world.current.cursor;
    // Update mouse pos immediately on click to ensure direction is correct
    cursor.screenMousePos = { x: e.clientX, y: e.clientY };
    
    if (e.button === 2) cursor.isRightDown = true;

  }, [gameState, world, isChatOpen]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!world.current) return;
    if (e.button === 2) world.current.cursor.isRightDown = false;
  }, [world]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (gameState !== GameState.PLAYING || !world.current) return;
    if (world.current.cursor.isInventoryOpen || isChatOpen) return;

    const direction = e.deltaY > 0 ? 1 : -1;
    let newIndex = world.current.cursor.hotbarSelectedIndex + direction;

    if (newIndex > 1) newIndex = 0;
    if (newIndex < 0) newIndex = 1;

    world.current.cursor.hotbarSelectedIndex = newIndex;
  }, [gameState, world, isChatOpen]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [handleMouseMove, handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp, handleWheel]);
};
