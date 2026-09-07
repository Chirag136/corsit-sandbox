export interface Point {
  x: number;
  y: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface RobotState {
  x: number;
  y: number;
  heading: number; // in radians (0 = facing right)
  width: number;
  length: number;
  speedLeft: number;  // -255 to 255
  speedRight: number; // -255 to 255
  sensorRangeCm: number;
  detectedDistanceCm: number;
  sensorRayEnd: Point;
  pathHistory: Point[];
  isColliding: boolean;
}

export interface RaycastHit {
  distanceCm: number;
  point: Point;
  hitObstacleId?: string;
}
