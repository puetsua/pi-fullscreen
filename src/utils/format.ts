/** Replace newlines, tabs, carriage returns with space, then collapse multiple spaces and trim. */
export function sanitizeText(text: string): string {
  return text
    .replace(/[\r\n\t]/g, " ")
    .replace(/ +/g, " ")
    .trim();
}