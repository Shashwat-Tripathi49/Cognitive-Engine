import { normalizeText } from './normalizer.js';

interface Match {
  aIndex: number;
  bIndex: number;
  length: number;
}

/**
 * Finds the longest common matching contiguous substring between a[alo..ahi] and b[blo..bhi]
 */
function findLongestMatch(
  a: string,
  alo: number,
  ahi: number,
  _b: string,
  blo: number,
  bhi: number,
  b2j: Map<string, number[]>
): Match {
  let bestI = alo;
  let bestJ = blo;
  let bestSize = 0;

  // j2len stores match length ending at j in b for current i in a
  let j2len = new Map<number, number>();

  for (let i = alo; i < ahi; i++) {
    const ch = a[i];
    const newJ2len = new Map<number, number>();
    const occurrences = b2j.get(ch) || [];

    for (const j of occurrences) {
      if (j < blo) continue;
      if (j >= bhi) break;

      const k = (j2len.get(j - 1) || 0) + 1;
      newJ2len.set(j, k);

      if (k > bestSize) {
        bestI = i - k + 1;
        bestJ = j - k + 1;
        bestSize = k;
      }
    }
    j2len = newJ2len;
  }

  return { aIndex: bestI, bIndex: bestJ, length: bestSize };
}

/**
 * Recursively extracts all non-overlapping matching blocks
 */
function getMatchingBlocks(
  a: string,
  alo: number,
  ahi: number,
  b: string,
  blo: number,
  bhi: number,
  b2j: Map<string, number[]>
): Match[] {
  const match = findLongestMatch(a, alo, ahi, b, blo, bhi, b2j);
  if (match.length === 0) {
    return [];
  }

  const leftMatches =
    match.aIndex > alo && match.bIndex > blo
      ? getMatchingBlocks(a, alo, match.aIndex, b, blo, match.bIndex, b2j)
      : [];

  const rightAStart = match.aIndex + match.length;
  const rightBStart = match.bIndex + match.length;
  const rightMatches =
    rightAStart < ahi && rightBStart < bhi
      ? getMatchingBlocks(a, rightAStart, ahi, b, rightBStart, bhi, b2j)
      : [];

  return [...leftMatches, match, ...rightMatches];
}

/**
 * Calculates Python difflib.SequenceMatcher.ratio() between two strings.
 * Returns a value in [0.0, 1.0].
 */
export function sequenceMatcherRatio(s1: string, s2: string): number {
  if (!s1 && !s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1 === s2) return 1.0;

  const totalLen = s1.length + s2.length;
  if (totalLen === 0) return 1.0;

  // Build index table for s2 characters
  const b2j = new Map<string, number[]>();
  for (let j = 0; j < s2.length; j++) {
    const ch = s2[j];
    const list = b2j.get(ch);
    if (!list) {
      b2j.set(ch, [j]);
    } else {
      list.push(j);
    }
  }

  const matches = getMatchingBlocks(s1, 0, s1.length, s2, 0, s2.length, b2j);
  const totalMatches = matches.reduce((sum, m) => sum + m.length, 0);

  return (2.0 * totalMatches) / totalLen;
}

/**
 * Calculates string similarity over normalized strings matching Experiment 004C.
 */
export function stringSimilarity(s1: string, s2: string): number {
  const n1 = normalizeText(s1);
  const n2 = normalizeText(s2);
  if (!n1 || !n2) {
    return 0.0;
  }
  if (n1 === n2) {
    return 1.0;
  }
  return sequenceMatcherRatio(n1, n2);
}
