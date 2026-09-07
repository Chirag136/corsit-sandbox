import { Obstacle, Point, RaycastHit } from '../types/simulation';

export function lineIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): { point: Point; t: number } | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 1e-8) return null;

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      point: {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y),
      },
      t: ua,
    };
  }
  return null;
}

export function castRay(
  origin: Point,
  headingRad: number,
  maxDistancePx: number,
  obstacles: Obstacle[],
  arenaWidth: number,
  arenaHeight: number
): RaycastHit {
  const rayEnd: Point = {
    x: origin.x + Math.cos(headingRad) * maxDistancePx,
    y: origin.y + Math.sin(headingRad) * maxDistancePx,
  };

  let closestHit: RaycastHit = {
    distanceCm: (maxDistancePx / 2), // 2px ≈ 1cm
    point: rayEnd,
  };
  let minT = 1.0;

  // 1. Check arena boundary walls (4 segments)
  const walls: [Point, Point][] = [
    [{ x: 0, y: 0 }, { x: arenaWidth, y: 0 }],
    [{ x: arenaWidth, y: 0 }, { x: arenaWidth, y: arenaHeight }],
    [{ x: arenaWidth, y: arenaHeight }, { x: 0, y: arenaHeight }],
    [{ x: 0, y: arenaHeight }, { x: 0, y: 0 }],
  ];

  for (const [w1, w2] of walls) {
    const hit = lineIntersection(origin, rayEnd, w1, w2);
    if (hit && hit.t < minT && hit.t > 0.001) {
      minT = hit.t;
      closestHit = {
        distanceCm: Math.round((hit.t * maxDistancePx) / 2),
        point: hit.point,
        hitObstacleId: 'wall',
      };
    }
  }

  // 2. Check each obstacle's 4 sides
  for (const obs of obstacles) {
    const corners: Point[] = [
      { x: obs.x, y: obs.y },
      { x: obs.x + obs.width, y: obs.y },
      { x: obs.x + obs.width, y: obs.y + obs.height },
      { x: obs.x, y: obs.y + obs.height },
    ];

    const obsSegments: [Point, Point][] = [
      [corners[0], corners[1]],
      [corners[1], corners[2]],
      [corners[2], corners[3]],
      [corners[3], corners[0]],
    ];

    for (const [s1, s2] of obsSegments) {
      const hit = lineIntersection(origin, rayEnd, s1, s2);
      if (hit && hit.t < minT && hit.t > 0.001) {
        minT = hit.t;
        closestHit = {
          distanceCm: Math.round((hit.t * maxDistancePx) / 2),
          point: hit.point,
          hitObstacleId: obs.id,
        };
      }
    }
  }

  // HC-SR04 has realistic max range: clamp to 400cm, minimum 2cm
  closestHit.distanceCm = Math.max(2, Math.min(400, closestHit.distanceCm));
  return closestHit;
}
