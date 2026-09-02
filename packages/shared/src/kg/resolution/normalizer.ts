/**
 * Normalizes text for deterministic entity comparison:
 * 1. Unicode NFKD decomposition
 * 2. Lowercasing
 * 3. Punctuation stripping (., -, _, ,, /, (, ), ", ')
 * 4. Collapsing whitespace
 * 5. Singularization of standard plural inflections
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }

  // 1. Unicode NFKD decomposition
  let t = text.normalize('NFKD');

  // 2. Lowercase and trim
  t = t.toLowerCase().trim();

  // 3. Punctuation stripping replaced with space
  t = t.replace(/[.\-_,/()"']+/g, ' ');

  // 4. Collapse whitespace
  t = t.replace(/\s+/g, ' ').trim();

  // 5. Singularization: strip trailing 's' if word length > 3 and not ending in 'ss'
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) {
    t = t.slice(0, -1);
  }

  return t;
}
