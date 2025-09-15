export interface Token {
  text: string;
  isSentenceEnd: boolean;
  index: number;
}

export function tokenizeText(text: string): Token[] {
  // Clean up the text - normalize whitespace and remove extra newlines
  const cleanedText = text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
  
  // Split on whitespace but keep punctuation attached
  const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
  
  const tokens: Token[] = [];
  
  words.forEach((word, index) => {
    // Check if this word ends with sentence-ending punctuation
    const isSentenceEnd = /[.!?]$/.test(word);
    
    tokens.push({
      text: word,
      isSentenceEnd,
      index
    });
  });
  
  return tokens;
}

export function getProgressPercentage(currentIndex: number, totalTokens: number): number {
  if (totalTokens === 0) return 0;
  return Math.round((currentIndex / totalTokens) * 100);
}
