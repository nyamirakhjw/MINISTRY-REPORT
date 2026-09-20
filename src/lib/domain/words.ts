export const COMMENT_WORD_LIMIT = 50;
export const COMMENT_CHAR_LIMIT = 600;

/** Words are runs of characters separated by spaces or line breaks (PRD §6.7). */
export function countWords(text: string): number {
  const t = text.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

export function commentError(text: string): "too_many_words" | "too_long" | null {
  if (countWords(text) > COMMENT_WORD_LIMIT) return "too_many_words";
  if (text.trim().length > COMMENT_CHAR_LIMIT) return "too_long";
  return null;
}
