export function sm2(
  quality: number,
  repetition: number,
  easeFactor: number,
  interval: number
): { repetition: number; easeFactor: number; interval: number } {
  let newRepetition: number;
  let newInterval: number;

  if (quality >= 3) {
    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetition = repetition + 1;
  } else {
    newRepetition = 0;
    newInterval = 1;
  }

  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return {
    repetition: newRepetition,
    easeFactor: newEaseFactor,
    interval: newInterval,
  };
}
