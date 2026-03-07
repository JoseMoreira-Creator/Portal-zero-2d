
import React from 'react';
import { GameSettings } from '../../types';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../../constants';

interface OptionsProps {
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  onClose: () => void;
  onOpenWiki: () => void;
  onOpenChangelog: () => void;
  onSave: () => void;
  onSaveAndQuit: () => void;
}

export const Options: React.FC<OptionsProps> = ({ settings, setSettings, onClose, onOpenWiki, onOpenChangelog, onSave, onSaveAndQuit }) => {
  
  const toggleAnimations = () => {
      setSettings(prev => ({ ...prev, animations: !prev.animations }));
  };

  const toggleCoordinates = () => {
      setSettings(prev => ({ ...prev, showCoordinates: !prev.showCoordinates }));
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setSettings(prev => ({ ...prev, zoom: val }));
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mc-panel w-full max-w-md p-6 bg-[#c6c6c6] flex flex-col items-center">
        
        <h2 className="text-3xl text-[#222] font-bold mb-8 pixel-shadow tracking-wide">OPTIONS</h2>

        <div className="flex flex-col gap-4 w-full mb-8">
            {/* Animation Toggle */}
            <div className="flex justify-between items-center bg-[#a0a0a0] p-3 border-2 border-[#555]">
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-[#222]">Animations</span>
                    <span className="text-xs text-[#444]">Tree swaying, etc.</span>
                </div>
                <button 
                    onClick={toggleAnimations}
                    className={`mc-btn w-24 py-2 font-bold ${settings.animations ? 'text-green-800' : 'text-red-800'}`}
                >
                    {settings.animations ? 'ON' : 'OFF'}
                </button>
            </div>

            {/* Coordinates Toggle */}
            <div className="flex justify-between items-center bg-[#a0a0a0] p-3 border-2 border-[#555]">
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-[#222]">Coordinates</span>
                    <span className="text-xs text-[#444]">Show player position</span>
                </div>
                <button 
                    onClick={toggleCoordinates}
                    className={`mc-btn w-24 py-2 font-bold ${settings.showCoordinates ? 'text-green-800' : 'text-red-800'}`}
                >
                    {settings.showCoordinates ? 'ON' : 'OFF'}
                </button>
            </div>

             {/* Zoom Slider */}
             <div className="flex flex-col gap-2 bg-[#a0a0a0] p-3 border-2 border-[#555]">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-[#222]">Camera Zoom</span>
                    <span className="text-sm font-bold text-[#444]">{settings.zoom.toFixed(1)}x</span>
                </div>
                <input 
                    type="range" 
                    min={ZOOM_MIN} 
                    max={ZOOM_MAX} 
                    step={ZOOM_STEP} 
                    value={settings.zoom}
                    onChange={handleZoomChange}
                    className="w-full accent-[#555] h-4 bg-[#8b8b8b] border-2 border-[#373737] appearance-none cursor-pointer p-0.5"
                />
            </div>

            {/* Extras Section */}
             <div className="flex flex-col gap-2 mt-4 pt-4 border-t-2 border-[#777]">
                 <span className="text-center text-[#555] font-bold mb-1">EXTRAS</span>
                 
                 <button 
                    onClick={onOpenWiki}
                    className="mc-btn w-full py-2 text-base font-bold text-[#222] bg-[#a7f3d0]"
                 >
                    Game Encyclopedia / Wiki
                 </button>

                 <button 
                    onClick={onOpenChangelog}
                    className="mc-btn w-full py-2 text-base font-bold text-[#222] bg-[#ddd]"
                 >
                    Changelog / Versions
                 </button>
             </div>
        </div>

        <div className="w-full flex gap-2">
            <button 
                onClick={onSave}
                className="mc-btn flex-1 py-3 text-lg font-bold text-green-900 bg-green-200 border-green-800"
            >
                SAVE
            </button>
            <button 
                onClick={onSaveAndQuit}
                className="mc-btn flex-1 py-3 text-lg font-bold text-red-900 bg-red-200 border-red-800"
            >
                SAVE & QUIT
            </button>
            
            <button 
                onClick={onClose}
                className="mc-btn flex-1 py-3 text-lg font-bold"
            >
                RESUME
            </button>
        </div>
      </div>
    </div>
  );
};
