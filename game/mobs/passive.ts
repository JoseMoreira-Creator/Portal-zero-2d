import { Entity, Vector2, WorldState } from '../../types';
import { getDistance, getVector, normalizeVector } from '../../utils/math';

export const updatePassiveMob = (ent: Entity, world: WorldState) => {
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

    // Water Collision (Avoid Water)
    if (world.waterBodies) {
        for (const lake of world.waterBodies) {
            for (const circle of lake.circles) {
                const dist = getDistance(ent.pos, circle);
                if (dist < circle.radius) {
                    // Inside water, push out
                    const pushVec = normalizeVector(getVector(circle, ent.pos));
                    if (pushVec.x === 0 && pushVec.y === 0) {
                        pushVec.x = 1; 
                    }
                    const overlap = circle.radius - dist + 2; // +2 buffer
                    ent.pos.x += pushVec.x * overlap;
                    ent.pos.y += pushVec.y * overlap;
                    
                    // Reverse velocity to bounce off
                    ent.vel.x *= -1;
                    ent.vel.y *= -1;
                }
            }
        }
    }
};