// Stub function for punctuation-aware pause calculation
// In a future version, this would return different multipliers based on punctuation
export function getPauseMultiplier(_token: string): number {
  // For now, return 1.0 for all tokens
  // Future: return different values based on punctuation
  // e.g., 1.5 for periods, 2.0 for exclamation marks, etc.
  return 1.0;
}
