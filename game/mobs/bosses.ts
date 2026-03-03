
import { Entity, MobType, Vector2, WorldState } from '../../types';
import { getDistance, getVector, normalizeVector, getAngle } from '../../utils/math';

export const updateBoss = (ent: Entity, playerPos: Vector2, world: WorldState, setStats: any) => {
    
    // --- GIANT SLIME BOSS AI ---
    if (ent.type === MobType.GIANT_SLIME) {
        const dist = getDistance(ent.pos, playerPos);
        
        // Boss is always aggressive if spawned
        ent.state = 'CHASING';
        
        // Logic: Charge (Stationary) -> Jump (Move) -> Land/Wait
        // Cycle: 100 frames
        // Jump: Last 25 frames
        
        const cycleTime = 100;
        const jumpTime = 25;
        const jumpSpeed = 8; // Very fast jump
        
        if (ent.attackTimer <= 0) {
            ent.attackTimer = cycleTime; // Reset cycle
        }
        
        ent.attackTimer--;

        // Movement Phase (The Jump)
        // attackTimer counts DOWN from 100 to 0
        if (ent.attackTimer < jumpTime) {
            const move = normalizeVector(getVector(ent.pos, playerPos));
            ent.pos.x += move.x * jumpSpeed;
            ent.pos.y += move.y * jumpSpeed;
        } else {
            // Charging phase (Stationary, jiggling handled by renderer)
            ent.vel = { x: 0, y: 0 };
        }

        // Hit Player Logic
        const hitRange = 60; // Larger hit box for boss
        if (dist < hitRange) {
             // Check Player Parry
            if (world.cursor.parryActive) {
                const blockAngle = getAngle(playerPos, world.cursor.mousePos);
                const attackAngle = getAngle(playerPos, ent.pos);
                let diff = Math.abs(blockAngle - attackAngle);
                if (diff > Math.PI) diff = (Math.PI*2) - diff;
                
                if (diff < Math.PI / 2) {
                    const isPerfectParry = world.cursor.parryTimer <= 15 && world.cursor.parryCooldown <= 0;
                    const bounce = normalizeVector(getVector(ent.pos, playerPos));
                    
                    if (isPerfectParry) {
                        // Perfect Parry
                        ent.pos.x -= bounce.x * 40; 
                        ent.pos.y -= bounce.y * 40;
                        ent.attackTimer = cycleTime * 1.5; // Stunned
                        world.camShake = 15;
                    } else {
                        // Normal Block!
                        // Boss Knockback (Heavy resistance compared to normal mobs)
                        ent.pos.x -= bounce.x * 15; 
                        ent.pos.y -= bounce.y * 15;
                        ent.attackTimer = cycleTime; // Stun/Reset cycle briefly
                    }
                    return;
                }
            }

            // Deal Massive Damage
            setStats((prev: any) => ({...prev, hp: prev.hp - 30}));
            world.camShake = 20; // Heavy shake
            
            // Bounce back slightly
            const bounce = normalizeVector(getVector(ent.pos, playerPos));
            ent.pos.x -= bounce.x * 10;
            ent.pos.y -= bounce.y * 10;

            ent.attackTimer = cycleTime; // Force reset to wait after hit
        }
    }
};
