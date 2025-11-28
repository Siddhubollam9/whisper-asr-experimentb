import { WerResult } from '../types';

/**
 * Calculates the Levenshtein distance between two arrays of strings.
 * Used for Word Error Rate (WER) calculation.
 */
export const calculateWER = (reference: string, hypothesis: string): WerResult => {
  // Normalize texts: remove punctuation, lowercase, trim extra spaces
  const clean = (text: string) => text.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase().trim();
  
  const refWords = clean(reference).split(" ");
  const hypWords = clean(hypothesis).split(" ");

  if (refWords.length === 0 || (refWords.length === 1 && refWords[0] === '')) {
     return { wer: 0, distance: 0, substitutions: 0, deletions: 0, insertions: hypWords.length };
  }

  const r = refWords.length;
  const h = hypWords.length;
  
  // Matrix initialization
  const d: number[][] = Array.from({ length: r + 1 }, () => Array(h + 1).fill(0));
  
  for (let i = 0; i <= r; i++) d[i][0] = i;
  for (let j = 0; j <= h; j++) d[0][j] = j;

  // Compute distance
  for (let i = 1; i <= r; i++) {
    for (let j = 1; j <= h; j++) {
      if (refWords[i - 1] === hypWords[j - 1]) {
        d[i][j] = d[i - 1][j - 1];
      } else {
        d[i][j] = Math.min(
          d[i - 1][j] + 1,     // Deletion
          d[i][j - 1] + 1,     // Insertion
          d[i - 1][j - 1] + 1  // Substitution
        );
      }
    }
  }

  const distance = d[r][h];
  const wer = distance / r;

  // Backtracking to find error types (simplified approximation for stats)
  // Note: A full backtracking is needed for exact counts, but for this overview, 
  // we return the distance and calculated WER. 
  // We can approximate insertions/deletions/subs or implement full backtrace if strictly needed.
  // For the purpose of this UI, raw WER and Distance is sufficient.

  return {
    wer,
    distance,
    substitutions: 0, // Placeholder
    deletions: 0,     // Placeholder
    insertions: 0,    // Placeholder
  };
};

export const getWerColor = (wer: number) => {
  if (wer < 0.1) return 'text-green-400';
  if (wer < 0.25) return 'text-yellow-400';
  return 'text-red-400';
};
