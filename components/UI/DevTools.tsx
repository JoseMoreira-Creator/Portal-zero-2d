import React, { useState, useRef, useEffect } from 'react';
import { playSound } from '../../utils/audio';

interface DevToolsProps {
    onClose: () => void;
}

export const DevTools: React.FC<DevToolsProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'EDITOR' | 'FILES' | 'TERMINAL'>('EDITOR');

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="mc-panel w-full max-w-4xl h-[80vh] flex flex-col bg-[#c6c6c6] border-4 border-black">
                {/* Header */}
                <div className="flex justify-between items-center p-2 bg-[#8b8b8b] border-b-4 border-black">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { playSound('click'); setActiveTab('EDITOR'); }}
                            className={`px-4 py-2 font-bold ${activeTab === 'EDITOR' ? 'bg-[#c6c6c6] border-2 border-white border-b-black' : 'bg-[#a0a0a0] border-2 border-transparent'}`}
                        >
                            Image Editor (16x16)
                        </button>
                        <button 
                            onClick={() => { playSound('click'); setActiveTab('FILES'); }}
                            className={`px-4 py-2 font-bold ${activeTab === 'FILES' ? 'bg-[#c6c6c6] border-2 border-white border-b-black' : 'bg-[#a0a0a0] border-2 border-transparent'}`}
                        >
                            File Manager
                        </button>
                        <button 
                            onClick={() => { playSound('click'); setActiveTab('TERMINAL'); }}
                            className={`px-4 py-2 font-bold ${activeTab === 'TERMINAL' ? 'bg-[#c6c6c6] border-2 border-white border-b-black' : 'bg-[#a0a0a0] border-2 border-transparent'}`}
                        >
                            Terminal
                        </button>
                    </div>
                    <button onClick={() => { playSound('click'); onClose(); }} className="mc-btn px-4 py-2 font-bold text-red-600">X</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'EDITOR' && <ImageEditor />}
                    {activeTab === 'FILES' && <FileManager />}
                    {activeTab === 'TERMINAL' && <Terminal />}
                </div>
            </div>
        </div>
    );
};

const ImageEditor = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState('#000000');
    const [isDrawing, setIsDrawing] = useState(false);
    const [pixels, setPixels] = useState<string[]>(Array(16 * 16).fill('transparent'));

    const drawPixel = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / (rect.width / 16));
        const y = Math.floor((e.clientY - rect.top) / (rect.height / 16));
        
        if (x >= 0 && x < 16 && y >= 0 && y < 16) {
            const index = y * 16 + x;
            const newPixels = [...pixels];
            newPixels[index] = color;
            setPixels(newPixels);
        }
    };

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, 16, 16);
        pixels.forEach((p, i) => {
            if (p !== 'transparent') {
                ctx.fillStyle = p;
                const x = i % 16;
                const y = Math.floor(i / 16);
                ctx.fillRect(x, y, 1, 1);
            }
        });
    }, [pixels]);

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 gap-4">
            <div className="flex-1 flex items-center justify-center">
                <div className="relative" style={{ width: 256, height: 256, imageRendering: 'pixelated' }}>
                    {/* Grid Background */}
                    <div className="absolute inset-0" style={{ 
                        backgroundImage: 'conic-gradient(#ccc 25%, white 25%, white 50%, #ccc 50%, #ccc 75%, white 75%, white)',
                        backgroundSize: '32px 32px'
                    }} />
                    <canvas 
                        ref={canvasRef}
                        width={16} 
                        height={16} 
                        className="absolute inset-0 w-full h-full cursor-crosshair border-2 border-black"
                        onMouseDown={(e) => { setIsDrawing(true); drawPixel(e); }}
                        onMouseMove={(e) => { if (isDrawing) drawPixel(e); }}
                        onMouseUp={() => setIsDrawing(false)}
                        onMouseLeave={() => setIsDrawing(false)}
                    />
                </div>
            </div>
            
            {/* Tools at the bottom */}
            <div className="w-full bg-[#8b8b8b] p-4 border-t-4 border-black flex gap-4 items-center justify-center">
                <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 cursor-pointer"
                />
                <button 
                    onClick={() => { playSound('click'); setColor('transparent'); }}
                    className="mc-btn px-4 py-2 font-bold bg-white"
                >
                    Eraser
                </button>
                <button 
                    onClick={() => { playSound('click'); setPixels(Array(16 * 16).fill('transparent')); }}
                    className="mc-btn px-4 py-2 font-bold text-red-600"
                >
                    Clear
                </button>
                <button 
                    onClick={() => {
                        playSound('click');
                        if (!canvasRef.current) return;
                        const link = document.createElement('a');
                        link.download = 'texture.png';
                        link.href = canvasRef.current.toDataURL();
                        link.click();
                    }}
                    className="mc-btn px-4 py-2 font-bold text-green-600"
                >
                    Export PNG
                </button>
            </div>
        </div>
    );
};

const FileManager = () => {
    const [files, setFiles] = useState<{name: string, type: 'folder' | 'file'}[]>([
        { name: 'textures', type: 'folder' },
        { name: 'skins', type: 'folder' },
        { name: 'mods', type: 'folder' },
        { name: 'worlds', type: 'folder' },
        { name: 'config.json', type: 'file' }
    ]);

    return (
        <div className="h-full flex flex-col p-4 gap-4">
            <div className="flex gap-2">
                <button className="mc-btn px-4 py-2 font-bold" onClick={() => { playSound('click'); setFiles([...files, { name: 'New Folder', type: 'folder' }]); }}>+ Folder</button>
                <button className="mc-btn px-4 py-2 font-bold" onClick={() => { playSound('click'); setFiles([...files, { name: 'new_file.txt', type: 'file' }]); }}>+ File</button>
            </div>
            <div className="flex-1 bg-white border-2 border-black p-2 overflow-y-auto">
                {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 hover:bg-gray-200 cursor-pointer border-b border-gray-300">
                        <span className="text-2xl">{f.type === 'folder' ? '📁' : '📄'}</span>
                        <span className="font-mono">{f.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Terminal = () => {
    const [history, setHistory] = useState<string[]>(['Portal Zero OS v1.0', 'Type "help" for commands.']);
    const [input, setInput] = useState('');

    const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && input.trim()) {
            const newHistory = [...history, `> ${input}`];
            
            if (input.trim().toLowerCase() === 'help') {
                newHistory.push('Available commands: help, clear, load_mod, list_mods');
            } else if (input.trim().toLowerCase() === 'clear') {
                setHistory([]);
                setInput('');
                return;
            } else {
                newHistory.push(`Command not found: ${input}`);
            }
            
            setHistory(newHistory);
            setInput('');
        }
    };

    return (
        <div className="h-full bg-black p-4 flex flex-col font-mono text-green-400">
            <div className="flex-1 overflow-y-auto mb-2 flex flex-col justify-end">
                {history.map((line, i) => (
                    <div key={i}>{line}</div>
                ))}
            </div>
            <div className="flex gap-2 items-center">
                <span>&gt;</span>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleCommand}
                    className="flex-1 bg-transparent outline-none text-green-400"
                    autoFocus
                />
            </div>
        </div>
    );
};
