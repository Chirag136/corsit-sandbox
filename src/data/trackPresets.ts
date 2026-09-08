import { Obstacle } from '../types/simulation';

export interface TrackPreset {
  id: string;
  name: string;
  description: string;
  robotStart: { x: number; y: number; heading: number };
  obstacles: Obstacle[];
}

export const TRACK_PRESETS: TrackPreset[] = [
  {
    id: 'corsit_standard',
    name: 'CorSIT Standard',
    description: 'Balanced test field with staggered pillars and blocks',
    robotStart: { x: 80, y: 190, heading: 0 },
    obstacles: [
      { id: 'obs_1', x: 250, y: 60, width: 80, height: 80, label: 'Block A' },
      { id: 'obs_2', x: 160, y: 220, width: 110, height: 60, label: 'Wall B' },
      { id: 'obs_3', x: 390, y: 190, width: 70, height: 110, label: 'Pillar C' },
    ],
  },
  {
    id: 'slalom',
    name: 'Slalom (Zig-Zag)',
    description: 'Alternating barriers testing rapid left-right avoidance turns',
    robotStart: { x: 60, y: 190, heading: 0 },
    obstacles: [
      { id: 'obs_s1', x: 170, y: 0, width: 30, height: 230, label: 'Barrier 1' },
      { id: 'obs_s2', x: 300, y: 150, width: 30, height: 230, label: 'Barrier 2' },
      { id: 'obs_s3', x: 430, y: 0, width: 30, height: 230, label: 'Barrier 3' },
    ],
  },
  {
    id: 'bottleneck',
    name: 'Bottleneck Corridor',
    description: 'Narrow gateway testing precision path alignment',
    robotStart: { x: 70, y: 190, heading: 0 },
    obstacles: [
      { id: 'obs_b1', x: 250, y: 0, width: 60, height: 140, label: 'North Gate' },
      { id: 'obs_b2', x: 250, y: 240, width: 60, height: 140, label: 'South Gate' },
      { id: 'obs_b3', x: 430, y: 140, width: 80, height: 100, label: 'Exit Guard' },
    ],
  },
  {
    id: 'uturn',
    name: 'U-Turn Trap',
    description: 'Enclosed cup testing 180° escape and turnaround behavior',
    robotStart: { x: 70, y: 190, heading: 0 },
    obstacles: [
      { id: 'obs_u1', x: 240, y: 100, width: 180, height: 25, label: 'Roof' },
      { id: 'obs_u2', x: 240, y: 255, width: 180, height: 25, label: 'Floor' },
      { id: 'obs_u3', x: 395, y: 100, width: 25, height: 180, label: 'Dead End' },
    ],
  },
  {
    id: 'clear',
    name: 'Clear Arena',
    description: 'Empty boundary field for free-range motion or custom building',
    robotStart: { x: 80, y: 190, heading: 0 },
    obstacles: [],
  },
];
