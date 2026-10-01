import type { Summary } from '../types'

const tile = 'rounded-xl border bg-white p-4 shadow-sm'

export default function StatsOverview({ summary }: { summary: Summary }) {
  const negative = (summary.by_sentiment['Angry'] ?? 0) + (summary.by_sentiment['Frustrated'] ?? 0)
  const tiles = [
    { label: 'Total tickets', value: summary.total },
    { label: 'Critical', value: summary.by_urgency['Critical'] ?? 0 },
    { label: 'Categories', value: Object.keys(summary.by_category).length },
    { label: 'Negative sentiment', value: negative },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className={tile}>
          <div className="text-2xl font-semibold">{t.value}</div>
          <div className="text-sm text-slate-500">{t.label}</div>
        </div>
      ))}
    </div>
  )
}
