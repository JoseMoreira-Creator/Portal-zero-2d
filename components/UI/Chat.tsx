
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../../types';

interface ChatProps {
  isOpen: boolean;
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  onClose: () => void;
  initialChar?: string;
}

export const Chat: React.FC<ChatProps> = ({ isOpen, messages, onSendMessage, onClose, initialChar = '' }) => {
    const [inputValue, setInputValue] = useState(initialChar);
    const [activeMessage, setActiveMessage] = useState<ChatMessage | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when open
    useEffect(() => {
        if (isOpen) {
            setInputValue(initialChar);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 10);
        }
    }, [isOpen, initialChar]);

    // Handle new messages and expiration (5 seconds)
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg) {
            // Check if message is already too old (in case of re-render)
            const age = Date.now() - lastMsg.timestamp;
            if (age < 5000) {
                setActiveMessage(lastMsg);
                const timer = setTimeout(() => {
                    setActiveMessage(null);
                }, 5000 - age);
                return () => clearTimeout(timer);
            }
        }
    }, [messages]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (inputValue.trim()) {
                onSendMessage(inputValue);
            }
            setInputValue('');
            onClose();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    // Determine bubble styles based on sender
    const getBubbleStyles = (sender: string) => {
        switch (sender) {
            case 'ERROR': return 'bg-red-200 border-red-900 text-red-900';
            case 'SYSTEM': return 'bg-yellow-100 border-yellow-800 text-yellow-900';
            default: return 'bg-white border-black text-black'; // PLAYER
        }
    };
    
    // Determine triangle color class for the inner triangle (to match background)
    const getTriangleColor = (sender: string) => {
        switch (sender) {
            case 'ERROR': return 'border-t-red-200';
            case 'SYSTEM': return 'border-t-yellow-100';
            default: return 'border-t-white';
        }
    };

    return (
        <>
            {/* SPEECH BUBBLE - Centered above player (Screen Center) */}
            {activeMessage && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60px] z-[45] pointer-events-none flex flex-col items-center">
                    <div className={`
                        max-w-[250px] px-3 py-2 rounded-lg text-center font-bold font-mono text-sm leading-tight
                        relative border-2 shadow-lg
                        ${getBubbleStyles(activeMessage.sender)}
                        transition-opacity duration-500
                    `}>
                        {/* Sender Label for non-player messages */}
                        {activeMessage.sender !== 'PLAYER' && (
                            <div className="text-[10px] opacity-75 uppercase mb-0.5 tracking-wider">
                                {activeMessage.sender}
                            </div>
                        )}
                        
                        {activeMessage.text}
                        
                        {/* Triangle Pointer Border (Outer - Black) */}
                        <div className="absolute -bottom-[10px] left-1/2 transform -translate-x-1/2 w-0 h-0 
                            border-l-[10px] border-l-transparent
                            border-r-[10px] border-r-transparent
                            border-t-[10px] border-t-black">
                        </div>
                        
                        {/* Triangle Pointer Fill (Inner - Matches BG) */}
                        <div className={`absolute -bottom-[7px] left-1/2 transform -translate-x-1/2 w-0 h-0 
                            border-l-[7px] border-l-transparent
                            border-r-[7px] border-r-transparent
                            border-t-[7px] ${getTriangleColor(activeMessage.sender)}`}>
                        </div>
                    </div>
                </div>
            )}

            {/* INPUT BAR - Centered Bottom */}
            {isOpen && (
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-[400px] z-50">
                    <div className="bg-[#1a1a1a]/90 p-2 border-2 border-white rounded-md flex items-center shadow-2xl">
                        <span className="text-yellow-400 mr-2 font-bold font-mono text-xl">&gt;</span>
                        <input
                            ref={inputRef}
                            type="text"
                            className="bg-transparent border-none text-black w-full focus:outline-none font-mono text-lg shadow-none placeholder-gray-500"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            maxLength={80}
                            placeholder="Chat or /command..."
                            autoComplete="off"
                        />
                    </div>
                </div>
            )}
        </>
    );
};
