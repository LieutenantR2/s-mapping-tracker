export type RegionData = {
  id: string;
  name: string;
  patch: number;
  croppedBounds: [[number, number], [number, number]];
  scale: number;
  spawns: Record<string, [number, number][]>;
};
