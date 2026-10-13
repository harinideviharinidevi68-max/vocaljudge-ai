export function formatSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export function formatTimeShort(seconds: number): string {
  if (isNaN(seconds)) return '0.0s';
  return `${seconds.toFixed(2)}s`;
}

export function formatPercent(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

export function getSeverityBadgeClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'high':
    case 'severe':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
    case 'medium':
    case 'moderate':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
    case 'low':
    case 'mild':
      return 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-rose-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 75) return 'bg-blue-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}
