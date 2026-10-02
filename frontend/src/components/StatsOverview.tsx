import type { Summary } from '../types'

export default function StatsOverview({ summary }: { summary: Summary }) {
  const critical = summary.by_urgency['Critical'] ?? 0
  const high = summary.by_urgency['High'] ?? 0
  const upset =
    (summary.by_sentiment['Angry'] ?? 0) + (summary.by_sentiment['Frustrated'] ?? 0)
  const upsetPct = summary.total ? Math.round((upset / summary.total) * 100) : 0

  const tiles = [
    {
      label: 'Total tickets',
      value: summary.total,
      valueColor: 'text-slate-900',
      labelColor: 'text-slate-600',
      bg: 'bg-white',
      note: '',
    },
    {
      label: 'Critical',
      value: critical,
      valueColor: 'text-red-700',
      labelColor: 'text-red-700',
      bg: 'bg-transparent',
      note: '',
    },
    {
      label: 'High',
      value: high,
      valueColor: 'text-orange-700',
      labelColor: 'text-slate-600',
      bg: 'bg-white',
      note: '',
    },
    {
      label: 'Upset customers',
      value: `${upsetPct}%`,
      valueColor: 'text-slate-900',
      labelColor: 'text-slate-600',
      bg: 'bg-white',
      note: `${upset} angry or frustrated`,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {tiles.map((t) => (
        <div key={t.label} className={`rounded-xl border p-4 shadow-sm ${t.bg}`}>
          <div className={`text-3xl font-bold ${t.valueColor}`}>{t.value}</div>
          <div className={`text-sm ${t.labelColor}`}>{t.label}</div>
          {t.note && <div className="text-xs text-slate-500">{t.note}</div>}
        </div>
      ))}
    </div>
  )
}