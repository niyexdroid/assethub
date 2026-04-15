import { calculateCompatibility } from '../../src/modules/roommates/matching.algorithm';

const base = {
  id: '1', tenant_id: 'a',
  gender: 'female',
  budget_min: 50000, budget_max: 100000,
  sleep_schedule: 'early_bird',
  cleanliness: 'very_clean',
  noise_tolerance: 'quiet',
  school: 'UNILAG',
};

describe('calculateCompatibility', () => {
  it('returns 100 for identical profiles', () => {
    expect(calculateCompatibility(base, { ...base, id: '2', tenant_id: 'b' })).toBe(100);
  });

  it('returns 0 gender points for gender mismatch', () => {
    const score = calculateCompatibility(base, { ...base, id: '2', tenant_id: 'b', gender: 'male' });
    expect(score).toBeLessThanOrEqual(70); // max without 30 gender pts
  });

  it('gives partial budget overlap score', () => {
    // Only 50% overlap
    const score = calculateCompatibility(base, {
      ...base, id: '2', tenant_id: 'b',
      budget_min: 75000, budget_max: 150000,
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it('awards 8 pts for flexible vs early_bird sleep schedule', () => {
    const perfectExceptSleep = calculateCompatibility(base, {
      ...base, id: '2', tenant_id: 'b', sleep_schedule: 'flexible',
    });
    const perfectScore = calculateCompatibility(base, { ...base, id: '2', tenant_id: 'b' });
    expect(perfectScore - perfectExceptSleep).toBe(7); // 15 - 8
  });

  it('awards 0 cleanliness pts for very_clean vs relaxed', () => {
    const score = calculateCompatibility(base, {
      ...base, id: '2', tenant_id: 'b', cleanliness: 'relaxed',
    });
    const full = calculateCompatibility(base, { ...base, id: '2', tenant_id: 'b' });
    expect(full - score).toBe(15);
  });

  it('gives 5pts for same school, 0 for different school', () => {
    const sameSchool = calculateCompatibility(base, { ...base, id: '2', tenant_id: 'b' });
    const diffSchool = calculateCompatibility(base, { ...base, id: '2', tenant_id: 'b', school: 'LASU' });
    expect(sameSchool - diffSchool).toBe(5);
  });

  it('never exceeds 100', () => {
    const score = calculateCompatibility(base, { ...base, id: '2', tenant_id: 'b' });
    expect(score).toBeLessThanOrEqual(100);
  });
});
