// Colour coding for priority and sentiment (Tailwind utility classes).
import type { Urgency, Sentiment } from '../types'

export const urgencyColor: Record<Urgency, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export const sentimentColor: Record<Sentiment, string> = {
  Angry: 'bg-red-100 text-red-800',
  Frustrated: 'bg-orange-100 text-orange-800',
  Neutral: 'bg-slate-100 text-slate-700',
  Happy: 'bg-emerald-100 text-emerald-800',
}
