import React, { useEffect, useRef, useState } from 'react';
import { WorldState } from '../../types';

interface MobileControlsProps {
  world: React.MutableRefObject<WorldState>;
  onInventory: () => void;
  onMap: () => void;
  controlStyle: 'joystick' | 'dpad';
}

export const MobileControls: React.FC<MobileControlsProps> = ({ world, onInventory, onMap, controlStyle }) => {
  const dpadRef = useRef<HTMLDivElement>(null);
  const leftJoystickRef = useRef<HTMLDivElement>(null);
  const rightJoystickRef = useRef<HTMLDivElement>(null);
  
  const [activeDir, setActiveDir] = useState<string | null>(null);
  const [leftPos, setLeftPos] = useState({ x: 0, y: 0 });
  const [rightPos, setRightPos] = useState({ x: 0, y: 0 });

  const updateDirection = (touch: React.Touch | undefined) => {
    if (!touch || !dpadRef.current) {
      setActiveDir(null);
      world.current.cursor.keys = { w: false, a: false, s: false, d: false };
      return;
    }

    const rect = dpadRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    
    // Deadzone
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      setActiveDir(null);
      world.current.cursor.keys = { w: false, a: false, s: false, d: false };
      return;
    }

    let dir = '';
    const keys = { w: false, a: false, s: false, d: false };
    
    // 8-way movement support
    if (dy < -20) { keys.w = true; dir += 'w'; }
    if (dy > 20) { keys.s = true; dir += 's'; }
    if (dx < -20) { keys.a = true; dir += 'a'; }
    if (dx > 20) { keys.d = true; dir += 'd'; }

    setActiveDir(dir);
    world.current.cursor.keys = keys;

    // Update aim direction based on movement
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    let aimX = 0;
    let aimY = 0;
    
    if (keys.w) aimY = -1;
    if (keys.s) aimY = 1;
    if (keys.a) aimX = -1;
    if (keys.d) aimX = 1;
    
    // Default to right if no direction
    if (aimX === 0 && aimY === 0) aimX = 1;

    world.current.cursor.screenMousePos = {
      x: screenCenterX + aimX * 100,
      y: screenCenterY + aimY * 100
    };
  };

  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.touches).find(t => 
      ((t as any).target as HTMLElement) === dpadRef.current || dpadRef.current?.contains((t as any).target as Node)
    );
    updateDirection(touch);
  };

  const handleEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    updateDirection(undefined);
  };

  const handleLeftTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!leftJoystickRef.current) return;
    const touch = Array.from(e.touches).find(t => ((t as any).target as HTMLElement) === leftJoystickRef.current || leftJoystickRef.current?.contains((t as any).target as Node));
    if (!touch) {
      setLeftPos({ x: 0, y: 0 });
      world.current.cursor.keys = { w: false, a: false, s: false, d: false };
      return;
    }

    const rect = leftJoystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = (touch as any).clientX - centerX;
    let dy = (touch as any).clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2;

    if (distance > maxDist) {
      dx = (dx / distance) * maxDist;
      dy = (dy / distance) * maxDist;
    }

    setLeftPos({ x: dx, y: dy });

    const threshold = maxDist * 0.3;
    world.current.cursor.keys = {
      w: dy < -threshold,
      s: dy > threshold,
      a: dx < -threshold,
      d: dx > threshold,
    };
  };

  const handleLeftEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setLeftPos({ x: 0, y: 0 });
    world.current.cursor.keys = { w: false, a: false, s: false, d: false };
  };

  const handleRightTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!rightJoystickRef.current) return;
    const touch = Array.from(e.touches).find(t => ((t as any).target as HTMLElement) === rightJoystickRef.current || rightJoystickRef.current?.contains((t as any).target as Node));
    if (!touch) {
      setRightPos({ x: 0, y: 0 });
      world.current.cursor.isLeftDown = false;
      return;
    }

    const rect = rightJoystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = (touch as any).clientX - centerX;
    let dy = (touch as any).clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2;

    if (distance > maxDist) {
      dx = (dx / distance) * maxDist;
      dy = (dy / distance) * maxDist;
    }

    setRightPos({ x: dx, y: dy });

    if (distance > maxDist * 0.1) {
      const screenCenterX = window.innerWidth / 2;
      const screenCenterY = window.innerHeight / 2;
      world.current.cursor.screenMousePos = {
        x: screenCenterX + (dx / maxDist) * 300,
        y: screenCenterY + (dy / maxDist) * 300
      };
      world.current.cursor.isLeftDown = true;
    } else {
      world.current.cursor.isLeftDown = false;
    }
  };

  const handleRightEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setRightPos({ x: 0, y: 0 });
    world.current.cursor.isLeftDown = false;
  };

  // Ensure aim is set initially
  useEffect(() => {
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    world.current.cursor.screenMousePos = {
      x: screenCenterX + 100,
      y: screenCenterY
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex justify-between items-end p-8 pb-12">
      {controlStyle === 'dpad' ? (
        <>
          {/* D-Pad */}
          <div 
            ref={dpadRef}
            className="w-40 h-40 relative pointer-events-auto touch-none opacity-60"
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
          >
            {/* Up */}
            <div className={`absolute top-0 left-1/3 w-1/3 h-1/3 bg-black border-2 border-gray-600 rounded-t-lg ${activeDir?.includes('w') ? 'bg-gray-700' : ''}`} />
            {/* Down */}
            <div className={`absolute bottom-0 left-1/3 w-1/3 h-1/3 bg-black border-2 border-gray-600 rounded-b-lg ${activeDir?.includes('s') ? 'bg-gray-700' : ''}`} />
            {/* Left */}
            <div className={`absolute left-0 top-1/3 w-1/3 h-1/3 bg-black border-2 border-gray-600 rounded-l-lg ${activeDir?.includes('a') ? 'bg-gray-700' : ''}`} />
            {/* Right */}
            <div className={`absolute right-0 top-1/3 w-1/3 h-1/3 bg-black border-2 border-gray-600 rounded-r-lg ${activeDir?.includes('d') ? 'bg-gray-700' : ''}`} />
            {/* Center */}
            <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-black border-2 border-gray-600" />
          </div>

          {/* Action Buttons (A and B) */}
          <div className="flex gap-6 pointer-events-auto items-end mb-4 mr-4">
            <button 
              className="w-16 h-16 bg-red-600/80 rounded-full border-4 border-red-800 text-white font-bold text-2xl active:bg-red-700/80 shadow-lg flex items-center justify-center"
              onTouchStart={(e) => { e.preventDefault(); world.current.cursor.isRightDown = true; }}
              onTouchEnd={(e) => { e.preventDefault(); world.current.cursor.isRightDown = false; }}
            >
              B
            </button>
            <button 
              className="w-16 h-16 bg-green-600/80 rounded-full border-4 border-green-800 text-white font-bold text-2xl active:bg-green-700/80 shadow-lg flex items-center justify-center mb-8"
              onTouchStart={(e) => { e.preventDefault(); world.current.cursor.isLeftDown = true; }}
              onTouchEnd={(e) => { e.preventDefault(); world.current.cursor.isLeftDown = false; }}
            >
              A
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Left Joystick - Movement */}
          <div 
            ref={leftJoystickRef}
            className="w-32 h-32 bg-white/20 rounded-full border-2 border-white/40 relative pointer-events-auto touch-none"
            onTouchStart={handleLeftTouch}
            onTouchMove={handleLeftTouch}
            onTouchEnd={handleLeftEnd}
            onTouchCancel={handleLeftEnd}
          >
            <div 
              className="w-12 h-12 bg-white/60 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg"
              style={{ transform: `translate(calc(-50% + ${leftPos.x}px), calc(-50% + ${leftPos.y}px))` }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 pointer-events-auto items-end">
            <div className="flex gap-4">
              <button 
                className="w-16 h-16 bg-blue-500/50 rounded-full border-2 border-white/40 text-white font-bold text-xl active:bg-blue-600/50"
                onTouchStart={() => { world.current.cursor.isRightDown = true; }}
                onTouchEnd={() => { world.current.cursor.isRightDown = false; }}
              >
                🛡️
              </button>
              <button 
                className="w-16 h-16 bg-green-500/50 rounded-full border-2 border-white/40 text-white font-bold text-xl active:bg-green-600/50"
                onClick={onInventory}
              >
                🎒
              </button>
              <button 
                className="w-16 h-16 bg-yellow-500/50 rounded-full border-2 border-white/40 text-white font-bold text-xl active:bg-yellow-600/50"
                onClick={onMap}
              >
                🗺️
              </button>
            </div>

            {/* Right Joystick - Aim/Attack */}
            <div 
              ref={rightJoystickRef}
              className="w-32 h-32 bg-red-500/20 rounded-full border-2 border-red-500/40 relative touch-none mt-4"
              onTouchStart={handleRightTouch}
              onTouchMove={handleRightTouch}
              onTouchEnd={handleRightEnd}
              onTouchCancel={handleRightEnd}
            >
              <div 
                className="w-12 h-12 bg-red-500/60 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg"
                style={{ transform: `translate(calc(-50% + ${rightPos.x}px), calc(-50% + ${rightPos.y}px))` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
