import React from 'react';
import { PlayerStats } from '../../types';

interface HudProps {
    stats: PlayerStats;
}

export const Hud: React.FC<HudProps> = ({ stats }) => {
    return (
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
            {/* HP Bar */}
            <div className="flex items-center gap-2">
                <span className="text-white font-bold w-24 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-sm">HP</span>
                <div className="w-48 h-5 bg-gray-800 border-2 border-white/50 relative rounded-sm overflow-hidden shadow-lg">
                    <div 
                        className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100))}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold drop-shadow-md tracking-wider">
                        {Math.ceil(stats.hp)} / {stats.maxHp}
                    </span>
                </div>
            </div>

            {/* Tension Bar */}
            <div className="flex items-center gap-2">
                <span className="text-white font-bold w-24 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-sm">TENSION</span>
                <div className="w-48 h-5 bg-gray-800 border-2 border-white/50 relative rounded-sm overflow-hidden shadow-lg">
                    <div 
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, (stats.tension / stats.maxTension) * 100))}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold drop-shadow-md tracking-wider">
                        {Math.ceil(stats.tension)} / {stats.maxTension}
                    </span>
                </div>
            </div>

            {/* Precision Bar */}
            <div className="flex items-center gap-2">
                <span className="text-white font-bold w-24 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-sm">PRECISION</span>
                <div className="w-48 h-5 bg-gray-800 border-2 border-white/50 relative rounded-sm overflow-hidden shadow-lg">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, (stats.precision / stats.maxPrecision) * 100))}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold drop-shadow-md tracking-wider">
                        {Math.ceil(stats.precision)} / {stats.maxPrecision}
                    </span>
                </div>
            </div>
        </div>
    );
};
