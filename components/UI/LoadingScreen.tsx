
import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#121212]">
      <div className="flex flex-col items-center gap-4">
          <h2 className="text-4xl text-black font-bold pixel-shadow animate-pulse">GENERATING TERRAIN...</h2>
          <div className="w-64 h-4 bg-[#333] border-2 border-[#555] relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-green-500 animate-[loading_1s_ease-in-out_infinite] w-full origin-left"></div>
          </div>
          <p className="text-gray-500 text-sm mt-2">Please wait while the world loads.</p>
      </div>
      <style>{`
        @keyframes loading {
            0% { transform: scaleX(0); }
            100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
};
