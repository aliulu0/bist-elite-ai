export function normalizeTurkish(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı');
}
