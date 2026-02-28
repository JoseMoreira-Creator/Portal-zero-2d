import { Entity, Vector2 } from '../../types';

export const updatePassiveMob = (ent: Entity) => {
    // Wander Logic
    if (Math.random() < 0.02) {
        // Change direction occasionally
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5;
        ent.vel = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
    }

    // Apply velocity
    ent.pos.x += ent.vel.x;
    ent.pos.y += ent.vel.y;

    // Face direction of movement
    if (Math.abs(ent.vel.x) > 0.1) {
        ent.faceDirection = ent.vel.x > 0 ? 1 : -1;
    }
    
    // Bounds check and stop
    if (Math.random() < 0.01) {
        ent.vel = { x: 0, y: 0 }; // Full stop to prevent sliding/bobbing
    }
};