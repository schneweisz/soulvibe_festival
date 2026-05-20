export type Rank = {
  level: number;
  name: string;
  next: number | null;
};

export function getRank(pts: number): Rank {
  if (pts >= 3500) return { level: 4, name: 'THE SOURCE', next: null };
  if (pts >= 1500) return { level: 3, name: 'RESONANCE', next: 3500 };
  if (pts >= 500)  return { level: 2, name: 'FREQUENCY', next: 1500 };
  return { level: 1, name: 'STATIC', next: 500 };
}
