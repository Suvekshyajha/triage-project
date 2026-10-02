// Colour coding (Tailwind utility classes).
import type { Urgency, Sentiment } from '../types'

// Urgency = filled pills. Critical is the only solid one so it stands out.
export const urgencyColor: Record<Urgency, string> = {
  Critical: 'bg-red-700 text-white border-red-700',
  High: 'bg-orange-100 text-orange-900 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-900 border-yellow-200',
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
}

// Left-border accent used on a selected ticket row and its detail panel, so
// the two stay visually linked. Matches urgencyColor's hues.
export const urgencyAccent: Record<Urgency, string> = {
  Critical: 'border-l-red-700',
  High: 'border-l-orange-400',
  Medium: 'border-l-yellow-400',
  Low: 'border-l-slate-300',
}

// Sentiment = a small coloured dot next to plain text. Kept more muted than
// urgencyColor above so sentiment and urgency don't both read as "alarms" in
// the same row.
export const sentimentDot: Record<Sentiment, string> = {
  Angry: 'bg-rose-400',
  Frustrated: 'bg-amber-400',
  Neutral: 'bg-slate-300',
  Happy: 'bg-emerald-500',
}