import type { Urgency, Sentiment } from '../types'
import { urgencyColor, sentimentDot } from '../lib/colors'

export function UrgencyPill({ urgency }: { urgency: Urgency }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${urgencyColor[urgency]}`}
    >
      {urgency}
    </span>
  )
}

export function SentimentLabel({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-700">
      <span
        className={`h-2.5 w-2.5 rounded-full ${sentimentDot[sentiment]}`}
        aria-hidden="true"
      />
      {sentiment}
    </span>
  )
}