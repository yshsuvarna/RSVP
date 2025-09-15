// Calculate pause multiplier based on punctuation
export function getPauseMultiplier(token: string): number {
  // Period, exclamation, question mark - longer pause
  if (/[.!?]$/.test(token)) {
    return 2.0;
  }
  
  // Comma, semicolon, colon - medium pause
  if (/[,:;]$/.test(token)) {
    return 1.5;
  }
  
  // Dash, parentheses - slight pause
  if (/[—\-()]/.test(token)) {
    return 1.2;
  }
  
  // Default - no extra pause
  return 1.0;
}