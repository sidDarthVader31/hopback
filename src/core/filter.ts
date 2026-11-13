import type { Question } from './tracker';

/** Case-insensitive match on every whitespace-separated term. */
export function filterQuestions(questions: Question[], query: string): Question[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return questions;
  return questions.filter((q) => {
    const text = q.text.toLowerCase();
    return terms.every((t) => text.includes(t));
  });
}
