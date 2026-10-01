import type { Summary } from '../types'

const tile =
  'rounded-xl border bg-white p-3 shadow-sm transition duration-200 ' +
  'hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 md:p-4'

export default function StatsOverview({ summary }: { summary: Summary }) {
  const negative = (summary.by_sentiment['Angry'] ?? 0) + (summary.by_sentiment['Frustrated'] ?? 0)
  const negativePct = summary.total ? Math.round((negative / summary.total) * 100) : 0

  const tiles = [
    { label: 'Total tickets', value: summary.total, color: 'text-slate-900' },
    { label: 'Critical', value: summary.by_urgency['Critical'] ?? 0, color: 'text-red-500' },
    { label: 'Negative sentiment', value: negative, color: 'text-orange-500' },
    { label: 'Negative share', value: `${negativePct}%`, color: 'text-slate-900' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {tiles.map((t) => (
        <div key={t.label} className={tile}>
          <div className={`text-2xl font-semibold md:text-3xl ${t.color}`}>{t.value}</div>
          <div className="text-xs text-slate-500 md:text-sm">{t.label}</div>
        </div>
      ))}
    </div>
  )
}