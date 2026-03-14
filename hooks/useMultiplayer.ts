
import React, { useEffect, useRef, useState } from 'react';
import { GameState, WorldState, ItemType, RemotePlayer } from '../types';

declare global {
    interface Window {
        Peer: any;
    }
}

interface UseMultiplayerProps {
    gameState: GameState;
    world: React.MutableRefObject<WorldState>;
    setChatMessages: React.Dispatch<React.SetStateAction<any[]>>;
}

export interface MultiplayerControls {
    hostGame: () => Promise<string>;
    joinGame: (hostId: string) => Promise<void>;
    disconnect: () => void;
    peerId: string | null;
    connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
}

export const useMultiplayer = ({ gameState, world, setChatMessages }: UseMultiplayerProps): MultiplayerControls => {
    const [peerId, setPeerId] = useState<string | null>(null);
    const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('DISCONNECTED');
    
    const peerRef = useRef<any>(null);
    const connectionsRef = useRef<any[]>([]); // For Host: list of clients
    const hostConnRef = useRef<any>(null); // For Client: connection to host

    // Clean up on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    const disconnect = () => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        connectionsRef.current = [];
        hostConnRef.current = null;
        setStatus('DISCONNECTED');
        setPeerId(null);
        
        if (world.current) {
            world.current.isMultiplayer = false;
            world.current.remotePlayers = {};
        }
    };

    const initializePeer = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!window.Peer) {
                console.error("PeerJS not loaded");
                reject("PeerJS library missing");
                return;
            }

            const peer = new window.Peer(null, {
                debug: 1,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' },
                    ]
                }
            });

            peer.on('open', (id: string) => {
                setPeerId(id);
                resolve(peer);
            });

            peer.on('error', (err: any) => {
                console.error("Peer Error:", err);
                setStatus('ERROR');
                reject(err);
            });

            peerRef.current = peer;
        });
    };

    const initializingRef = useRef(false);

    // --- HOST LOGIC ---
    const hostGame = async () => {
        if (initializingRef.current || status === 'CONNECTED' || status === 'CONNECTING') {
            console.log("Already initializing or connected, skipping hostGame");
            return peerId || "";
        }
        
        initializingRef.current = true;
        setStatus('CONNECTING');
        
        try {
            const peer = await initializePeer();
            setStatus('CONNECTED');
            initializingRef.current = false;
            
            if (world.current) {
                world.current.isMultiplayer = true;
                world.current.isHost = true;
                world.current.myId = peer.id;
            }

            peer.on('connection', (conn: any) => {
                console.log("New connection from:", conn.peer);
                connectionsRef.current.push(conn);
                
                conn.on('data', (data: any) => {
                    handleDataFromClient(data, conn.peer);
                });

                conn.on('close', () => {
                    console.log("Connection closed:", conn.peer);
                    connectionsRef.current = connectionsRef.current.filter((c: any) => c !== conn);
                    if (world.current) {
                        if (world.current.remotePlayers) {
                            delete world.current.remotePlayers[conn.peer];
                        }
                        setChatMessages(prev => [...prev, { id: Math.random().toString(), text: `Player left`, sender: 'SYSTEM', timestamp: Date.now() }]);
                    }
                });
                
                // Send Initial World State (Simplified)
                const sendInit = () => {
                    if (world.current) {
                        conn.send({
                            type: 'INIT',
                            world: {
                                entities: world.current.entities,
                                items: world.current.items,
                                timeOfDay: world.current.timeOfDay,
                                dimension: world.current.dimension,
                                waterBodies: world.current.waterBodies
                            }
                        });
                    }
                };

                if (conn.open) {
                    sendInit();
                } else {
                    conn.on('open', sendInit);
                }

                setChatMessages(prev => [...prev, { id: Math.random().toString(), text: `Player joined!`, sender: 'SYSTEM', timestamp: Date.now() }]);
            });
            
            return peer.id;
        } catch (e) {
            console.error("Host Game Error:", e);
            setStatus('ERROR');
            initializingRef.current = false;
            throw e;
        }
    };

    // --- CLIENT LOGIC ---
    const joinGame = async (hostId: string) => {
        const cleanHostId = hostId.trim();
        if (!cleanHostId) return;

        if (initializingRef.current || status === 'CONNECTED' || status === 'CONNECTING') {
             console.log("Already initializing or connected, skipping joinGame");
             return;
        }

        initializingRef.current = true;
        setStatus('CONNECTING');
        
        try {
            const peer = await initializePeer();
            console.log("Peer initialized, connecting to:", cleanHostId);
            const conn = peer.connect(cleanHostId, {
                reliable: true
            });

            peer.on('error', (err: any) => {
                if (err.type === 'peer-unavailable') {
                    console.error("Host not found!");
                    setStatus('ERROR');
                    initializingRef.current = false;
                    alert("Host not found! Check the ID.");
                }
            });
            
            conn.on('open', () => {
                console.log("Connected to Host:", cleanHostId);
                setStatus('CONNECTED');
                initializingRef.current = false;
                hostConnRef.current = conn;
                
                if (world.current) {
                    world.current.isMultiplayer = true;
                    world.current.isHost = false;
                    world.current.myId = peer.id;
                }
                setChatMessages(prev => [...prev, { id: Math.random().toString(), text: `Connected to Host!`, sender: 'SYSTEM', timestamp: Date.now() }]);
            });

            conn.on('data', (data: any) => {
                handleDataFromHost(data);
            });
            
            conn.on('close', () => {
                console.log("Disconnected from Host");
                setStatus('DISCONNECTED');
                alert("Disconnected from Host");
                initializingRef.current = false;
            });

            conn.on('error', (err: any) => {
                 console.error("Connection Error", err);
                 setStatus('ERROR');
                 initializingRef.current = false;
            });

            // If connection fails to open within a timeout
            setTimeout(() => {
                if (initializingRef.current) {
                    console.error("Connection timeout");
                    setStatus('ERROR');
                    initializingRef.current = false;
                    peer.destroy();
                }
            }, 10000);

        } catch (e) {
            console.error("Join Game Error:", e);
            setStatus('ERROR');
            initializingRef.current = false;
            throw e;
        }
    };

    // --- DATA HANDLERS ---

    const handleDataFromClient = (data: any, clientId: string) => {
        if (!world.current) return;

        if (data.type === 'PLAYER_UPDATE') {
            world.current.remotePlayers[clientId] = {
                id: clientId,
                ...data.player
            };
        } else if (data.type === 'CHAT') {
            setChatMessages(prev => [...prev, data.msg]);
            // Relay to others
            connectionsRef.current.forEach(c => {
                if (c.peer !== clientId) c.send(data);
            });
        }
    };

    const handleDataFromHost = (data: any) => {
        if (!world.current) return;

        if (data.type === 'INIT') {
            // Load initial world state
            world.current.entities = data.world.entities;
            world.current.items = data.world.items;
            world.current.waterBodies = data.world.waterBodies; // Important for map consistency
            world.current.timeOfDay = data.world.timeOfDay;
            world.current.dimension = data.world.dimension;
        } 
        else if (data.type === 'WORLD_UPDATE') {
            // Sync Entities (Mobs, drops, projectiles)
            // Naive replace for now (smooth interpolation is hard in this limited scope)
            world.current.entities = data.entities;
            world.current.items = data.items;
            world.current.projectiles = data.projectiles;
            world.current.timeOfDay = data.timeOfDay;
            world.current.remotePlayers = data.remotePlayers; // Includes Host and other clients
        }
        else if (data.type === 'CHAT') {
            setChatMessages(prev => [...prev, data.msg]);
        }
    };

    // --- GAME LOOP SYNC ---
    useEffect(() => {
        if (status !== 'CONNECTED') return;

        const interval = setInterval(() => {
            if (!world.current) return;
            const w = world.current;

            // Prepare My Player Data
            const myData = {
                pos: w.cursor.pos,
                faceDirection: w.cursor.faceDirection,
                heldItem: w.cursor.inventory[w.cursor.hotbarSelectedIndex].item,
                isMoving: w.cursor.keys.w || w.cursor.keys.a || w.cursor.keys.s || w.cursor.keys.d,
                hp: 100, // TODO: Pass real HP from stats prop if available, using 100 for now or add stats to worldState
                maxHp: 100
            };

            if (w.isHost) {
                // Host: Broadcast World State to all clients
                const updatePacket = {
                    type: 'WORLD_UPDATE',
                    entities: w.entities,
                    items: w.items,
                    projectiles: w.projectiles,
                    timeOfDay: w.timeOfDay,
                    // Send remote players map, BUT include Host as a remote player for them
                    remotePlayers: {
                        ...w.remotePlayers,
                        [w.myId]: { id: w.myId, ...myData }
                    }
                };

                connectionsRef.current.forEach(conn => {
                    conn.send(updatePacket);
                });
            } else {
                // Client: Send only my data to Host
                if (hostConnRef.current) {
                    hostConnRef.current.send({
                        type: 'PLAYER_UPDATE',
                        player: myData
                    });
                }
            }
        }, 50); // 20 Updates per second

        return () => clearInterval(interval);
    }, [status, world]);

    return {
        hostGame,
        joinGame,
        disconnect,
        peerId,
        connectionStatus: status
    };
};
