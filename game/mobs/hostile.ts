

import { Entity, MobType, Vector2, WorldState } from '../../types';
import { getDistance, getVector, normalizeVector, getAngle } from '../../utils/math';

export const updateHostileMob = (ent: Entity, playerPos: Vector2, world: WorldState, setStats: any) => {
    const dist = getDistance(ent.pos, playerPos);
    
    // SKELETON AI (Ranged)
    if (ent.type === MobType.SKELETON) {
         if (dist < 400) {
             ent.state = 'CHASING';
             // Keep distance (strafe/kite logic simplified)
             if (dist > 250) {
                const move = normalizeVector(getVector(ent.pos, playerPos));
                ent.pos.x += move.x * 1.3;
                ent.pos.y += move.y * 1.3;
                ent.faceDirection = move.x > 0 ? 1 : -1;
             } else {
                 // Face player
                 ent.faceDirection = playerPos.x > ent.pos.x ? 1 : -1;
             }
             
             // Shooting
             if (ent.attackTimer <= 0 && dist < 350) {
                 const angle = getAngle(ent.pos, playerPos);
                 // Add randomness
                 const spread = (Math.random() - 0.5) * 0.2;
                 const finalAngle = angle + spread;
                 
                 world.projectiles.push({
                     id: Math.random().toString(),
                     pos: { ...ent.pos },
                     vel: { x: Math.cos(finalAngle) * 6, y: Math.sin(finalAngle) * 6 },
                     radius: 4,
                     isEnemy: true,
                     damage: 10,
                     color: '#fff'
                 });
                 
                 ent.attackTimer = 120; // 2 seconds reload
             }
         } else {
             ent.state = 'IDLE';
         }
         
         if (ent.attackTimer > 0) ent.attackTimer--;
         return; // Skip melee logic
    }

    // SLIME AI (Normal only)
    if (ent.type === MobType.SLIME) {
        if (dist < 500) {
            ent.state = 'CHASING';
            
            // Slime Movement Logic: Wait -> Explode forward -> Wait
            // Cycle: 80 frames
            // Jump: Last 20 frames
            
            const cycleTime = 80;
            const jumpTime = 20;
            // Increased speed significantly for a "leap" feel
            const jumpSpeed = 6; 
            
            if (ent.attackTimer <= 0) {
                ent.attackTimer = cycleTime; // Reset cycle
            }
            
            ent.attackTimer--;

            // Note: attackTimer counts DOWN.
            if (ent.attackTimer < jumpTime) {
                // Jumping phase (Active Movement)
                const move = normalizeVector(getVector(ent.pos, playerPos));
                ent.pos.x += move.x * jumpSpeed;
                ent.pos.y += move.y * jumpSpeed;
            } else {
                // Charging phase (stationary on ground)
                ent.vel = { x: 0, y: 0 };
            }

            // Hit Player Logic
            const hitRange = 35;
            if (dist < hitRange) {
                 // Check Player Parry
                if (world.cursor.parryActive) {
                    const blockAngle = getAngle(playerPos, world.cursor.mousePos);
                    const attackAngle = getAngle(playerPos, ent.pos);
                    let diff = Math.abs(blockAngle - attackAngle);
                    if (diff > Math.PI) diff = (Math.PI*2) - diff;
                    
                    if (diff < Math.PI / 2) {
                        // Blocked
                        const bounce = normalizeVector(getVector(ent.pos, playerPos));
                        ent.pos.x -= bounce.x * 40;
                        ent.pos.y -= bounce.y * 40;
                        ent.attackTimer = cycleTime; // Force reset to wait
                        return;
                    }
                }

                // Damage
                // Only deal damage if in the "jump" phase or very close, 
                // but usually collision checks are constant.
                setStats((prev: any) => ({...prev, hp: prev.hp - 8}));
                world.camShake = 5;
                
                // Bounce back slightly on hit
                const bounce = normalizeVector(getVector(ent.pos, playerPos));
                ent.pos.x -= bounce.x * 20;
                ent.pos.y -= bounce.y * 20;
                
                ent.attackTimer = cycleTime; // Reset to wait after hit
            }
            
        } else {
            ent.state = 'IDLE';
            ent.attackTimer = 0;
        }
        return;
    }


    // MELEE AI (Zombie, Creeper, Spider)
    if (dist < 400) { // Aggro range
        ent.state = 'CHASING';
        const move = normalizeVector(getVector(ent.pos, playerPos));
        
        // Speed varies by mob
        let speed = 1.5;
        if (ent.type === MobType.ZOMBIE) speed = 1.2;
        if (ent.type === MobType.CREEPER) speed = 1.0;
        if (ent.type === MobType.SPIDER) speed = 2.5; // Spiders are fast!

        ent.pos.x += move.x * speed;
        ent.pos.y += move.y * speed;
        
        // Update facing direction
        ent.faceDirection = move.x > 0 ? 1 : -1;

        // Attack Logic
        if (dist < 35 && ent.attackTimer <= 0) {
            // Check Player Parry
            if (world.cursor.parryActive) {
                const blockAngle = getAngle(playerPos, world.cursor.mousePos);
                const attackAngle = getAngle(playerPos, ent.pos);
                let diff = Math.abs(blockAngle - attackAngle);
                if (diff > Math.PI) diff = (Math.PI*2) - diff;
                
                if (diff < Math.PI / 2) {
                    // Blocked!
                    // Knockback mob
                    ent.pos.x -= move.x * 20;
                    ent.pos.y -= move.y * 20;
                    ent.attackTimer = 60;
                    return; 
                }
            }
            
            // Hit Player
            if (ent.type === MobType.CREEPER) {
                // Explode
                world.camShake = 15;
                setStats((prev: any) => ({...prev, hp: prev.hp - 40}));
                ent.hp = 0; // Suicide
            } else {
                setStats((prev: any) => ({...prev, hp: prev.hp - 10}));
                world.camShake = 5;
                ent.attackTimer = 60;
            }
        }
    } else {
        ent.state = 'IDLE';
    }

    if (ent.attackTimer > 0) ent.attackTimer--;
};
