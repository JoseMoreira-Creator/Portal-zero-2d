import React from 'react';
import { VERSION_HISTORY } from '../../versions';

interface ChangelogProps {
  onClose: () => void;
}

export const Changelog: React.FC<ChangelogProps> = ({ onClose }) => {
  // Reverse copy of history to show newest first
  const history = [...VERSION_HISTORY].reverse();

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
      <div className="mc-panel w-full max-w-3xl h-[80vh] flex flex-col relative bg-[#c6c6c6]">
        
        {/* Header */}
        <div className="p-4 border-b-4 border-[#555] bg-[#a0a0a0] flex justify-between items-center shadow-md">
            <h2 className="text-3xl text-[#222] font-bold pixel-shadow tracking-wide">Version History</h2>
            <button 
                onClick={onClose}
                className="mc-btn px-4 py-1 text-xl font-bold text-red-900"
            >
                X
            </button>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#1a1a1a] shadow-inner">
            {history.map((ver, i) => (
                <div key={i} className="border-l-4 border-[#555] pl-4 pb-4">
                    <div className="flex items-baseline gap-3 mb-2">
                        <span className={`text-2xl font-bold ${i === 0 ? 'text-yellow-400' : 'text-[#aaa]'}`}>
                            v{ver.version}
                        </span>
                        <span className="text-black text-xl">{ver.title}</span>
                        {i === 0 && (
                            <span className="bg-red-600 text-black text-xs px-2 py-0.5 animate-pulse">
                                LATEST
                            </span>
                        )}
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                        {ver.changes.map((change, idx) => (
                            <li key={idx} className="text-[#ccc] text-lg pl-2 border-l border-[#444] ml-1">
                                {change}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-4 border-white bg-[#c6c6c6] flex justify-center">
             <button 
                onClick={onClose}
                className="mc-btn px-12 py-2 text-xl font-bold"
            >
                Back to Menu
            </button>
        </div>
      </div>
    </div>
  );
};