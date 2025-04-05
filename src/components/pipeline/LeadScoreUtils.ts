
export function getScoreColorClass(score: number) {
  if (score < 3) return 'bg-red-500 text-white';
  if (score < 7) return 'bg-amber-500 text-white';
  return 'bg-green-500 text-white';
}

export function getScoreCircleClass(colorClass: string) {
  let baseClass = "flex items-center justify-center rounded-full w-12 h-12 font-bold text-lg";
  
  if (colorClass.includes('red')) {
    return `${baseClass} bg-red-500/10 text-red-500 border-2 border-red-500`;
  }
  if (colorClass.includes('amber')) {
    return `${baseClass} bg-amber-500/10 text-amber-500 border-2 border-amber-500`;
  }
  return `${baseClass} bg-green-500/10 text-green-500 border-2 border-green-500`;
}
