
export function normalizeLeadScore(score: number): number {
  // Normalize score to a range of 0-10 (assuming the original score might be in a different range)
  return Math.min(10, Math.max(0, Math.round(score / 10)));
}

export function getScoreColorClass(score: number): string {
  if (score >= 8) return "bg-green-500 text-white";
  if (score >= 5) return "bg-yellow-500 text-white";
  if (score >= 3) return "bg-orange-500 text-white";
  return "bg-red-500 text-white";
}
