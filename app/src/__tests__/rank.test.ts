import { getRank } from '../utils/rank';

describe('Rank Logic', () => {
  test('returns level 1 for 0 points', () => {
    const rank = getRank(0);
    expect(rank.level).toBe(1);
    expect(rank.name).toBe('STATIC');
  });

  test('returns level 2 for 500 points', () => {
    const rank = getRank(500);
    expect(rank.level).toBe(2);
    expect(rank.name).toBe('FREQUENCY');
  });

  test('returns level 3 for 1500 points', () => {
    const rank = getRank(1500);
    expect(rank.level).toBe(3);
    expect(rank.name).toBe('RESONANCE');
  });

  test('returns level 4 for 3500 points', () => {
    const rank = getRank(3500);
    expect(rank.level).toBe(4);
    expect(rank.name).toBe('THE SOURCE');
  });
});
