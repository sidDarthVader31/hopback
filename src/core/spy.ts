/**
 * Scroll position helpers. They work on plain numbers (the viewport-relative
 * top of each question, in document order) so they are trivially testable.
 */

/** Index of the last question that starts at or above `line`, or -1. */
export function currentIndex(tops: number[], line: number): number {
  let index = -1;
  for (let i = 0; i < tops.length; i++) {
    if (tops[i]! <= line) index = i;
  }
  return index;
}

const SLACK = 6;

/**
 * Which question a "previous" (-1) or "next" (+1) hop should land on, given
 * that hops rest at `offset` px from the top. Returns -1 when there is nowhere to go.
 */
export function hopTarget(tops: number[], offset: number, direction: -1 | 1): number {
  const current = currentIndex(tops, offset + SLACK);
  if (direction === 1) return current + 1 < tops.length ? current + 1 : -1;
  if (current < 0) return -1;
  // Part-way through an answer: first hop back goes to the question above it.
  const resting = Math.abs(tops[current]! - offset) <= SLACK;
  return resting ? current - 1 : current;
}
