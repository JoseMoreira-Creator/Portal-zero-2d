import { Vector2 } from '../types';

export const getDistance = (v1: Vector2, v2: Vector2): number => {
  const dx = v1.x - v2.x;
  const dy = v1.y - v2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const getVector = (from: Vector2, to: Vector2): Vector2 => {
  return { x: to.x - from.x, y: to.y - from.y };
};

export const getAngle = (from: Vector2, to: Vector2): number => {
  return Math.atan2(to.y - from.y, to.x - from.x);
};

export const normalizeVector = (v: Vector2): Vector2 => {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
};

export const scaleVector = (v: Vector2, s: number): Vector2 => {
  return { x: v.x * s, y: v.y * s };
};

export const clamp = (val: number, min: number, max: number): number => {
  return Math.min(Math.max(val, min), max);
};

export const checkCircleCollision = (p1: Vector2, r1: number, p2: Vector2, r2: number): boolean => {
  return getDistance(p1, p2) < r1 + r2;
};