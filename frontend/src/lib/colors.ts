// Colour coding (Tailwind utility classes).
import type { Urgency, Sentiment } from '../types'

// Urgency = filled pills. Critical is the only solid one so it stands out.
export const urgencyColor: Record<Urgency, string> = {
  Critical: 'bg-red-700 text-white border-red-700',
  High: 'bg-orange-100 text-orange-900 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-900 border-yellow-200',
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
}

// Sentiment = just a small coloured dot next to plain text.
export const sentimentDot: Record<Sentiment, string> = {
  Angry: 'bg-red-600',
  Frustrated: 'bg-orange-500',
  Neutral: 'bg-slate-400',
  Happy: 'bg-emerald-500',
}