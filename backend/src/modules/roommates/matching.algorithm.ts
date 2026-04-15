/**
 * Roommate Compatibility Scoring Algorithm
 *
 * Max score: 100 points
 * Only matches above the min_score threshold (default 60) are returned.
 *
 * Weights:
 *   Gender preference   30
 *   Budget overlap      25
 *   Sleep schedule      15
 *   Cleanliness         15
 *   Noise tolerance     10
 *   School match         5
 *                      ---
 *   Total              100
 */

interface RoommateProfile {
  id:              string;
  tenant_id:       string;
  gender:          string;
  budget_min:      number;
  budget_max:      number;
  sleep_schedule:  string;
  cleanliness:     string;
  noise_tolerance: string;
  school:          string;
}

export function calculateCompatibility(a: RoommateProfile, b: RoommateProfile): number {
  let score = 0;

  // 1. Gender preference (30pts) — both must accept the other's gender
  const genderMatch = (a.gender === b.gender);
  score += genderMatch ? 30 : 0;

  // 2. Budget overlap (25pts) — sliding scale based on % overlap
  const overlapMin = Math.max(a.budget_min, b.budget_min);
  const overlapMax = Math.min(a.budget_max, b.budget_max);
  if (overlapMax >= overlapMin) {
    const aRange = a.budget_max - a.budget_min || 1;
    const bRange = b.budget_max - b.budget_min || 1;
    const overlapSize = overlapMax - overlapMin;
    const overlapPct  = (overlapSize / Math.max(aRange, bRange));
    score += Math.round(25 * Math.min(overlapPct, 1));
  }

  // 3. Sleep schedule (15pts)
  if (a.sleep_schedule === b.sleep_schedule) {
    score += 15;
  } else if (a.sleep_schedule === 'flexible' || b.sleep_schedule === 'flexible') {
    score += 8; // flexible partially matches any
  }

  // 4. Cleanliness (15pts)
  const cleanMap: Record<string, number> = { very_clean: 3, clean: 2, relaxed: 1 };
  const cleanDiff = Math.abs((cleanMap[a.cleanliness] ?? 2) - (cleanMap[b.cleanliness] ?? 2));
  score += cleanDiff === 0 ? 15 : cleanDiff === 1 ? 8 : 0;

  // 5. Noise tolerance (10pts)
  const noiseMap: Record<string, number> = { quiet: 1, moderate: 2, lively: 3 };
  const noiseDiff = Math.abs((noiseMap[a.noise_tolerance] ?? 2) - (noiseMap[b.noise_tolerance] ?? 2));
  score += noiseDiff === 0 ? 10 : noiseDiff === 1 ? 5 : 0;

  // 6. School match (5pts)
  if (a.school && b.school && a.school.toLowerCase() === b.school.toLowerCase()) {
    score += 5;
  }

  return Math.min(score, 100);
}
