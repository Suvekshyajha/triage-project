import type { Summary, Urgency } from '../types'

interface TileProps {
  label: string
  value: string | number
  note?: string
  valueColor: string
  labelColor: string
  bg: string
  border: string
  onClick?: () => void
}

function Tile({ label, value, note, valueColor, labelColor, bg, border, onClick }: TileProps) {
  const classes = `rounded-xl border p-4 text-left shadow-sm transition-colors ${bg} ${border} ${
    onClick ? 'cursor-pointer hover:border-slate-300' : ''
  }`

  const content = (
    <>
      <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
      <div className={`text-sm ${labelColor}`}>{label}</div>
      {note && <div className="text-xs text-slate-500">{note}</div>}
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    )
  }

  return <div className={classes}>{content}</div>
}

interface Props {
  summary: Summary
  onFilterUrgency: (urgency: Urgency) => void
}

export default function StatsOverview({ summary, onFilterUrgency }: Props) {
  const critical = summary.by_urgency['Critical'] ?? 0
  const high = summary.by_urgency['High'] ?? 0
  const upset =
    (summary.by_sentiment['Angry'] ?? 0) + (summary.by_sentiment['Frustrated'] ?? 0)
  const upsetPct = summary.total ? Math.round((upset / summary.total) * 100) : 0

  const tiles: TileProps[] = [
    {
      label: 'Total tickets',
      value: summary.total,
      valueColor: 'text-slate-900',
      labelColor: 'text-slate-600',
      bg: 'bg-white',
      border: 'border-slate-200',
    },
    {
      label: 'Critical',
      value: critical,
      valueColor: 'text-red-700',
      labelColor: 'text-red-700',
      bg: critical > 0 ? 'bg-red-50' : 'bg-white',
      border: critical > 0 ? 'border-red-200' : 'border-slate-200',
      note: critical > 0 ? 'Needs attention now' : undefined,
      onClick: () => onFilterUrgency('Critical'),
    },
    {
      label: 'High',
      value: high,
      valueColor: 'text-orange-700',
      labelColor: 'text-slate-600',
      bg: 'bg-white',
      border: 'border-slate-200',
      onClick: () => onFilterUrgency('High'),
    },
    {
      label: 'Upset customers',
      value: `${upsetPct}%`,
      valueColor: 'text-slate-900',
      labelColor: 'text-slate-600',
      bg: 'bg-white',
      border: 'border-slate-200',
      note: `${upset} angry or frustrated`,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {tiles.map((t) => (
        <Tile key={t.label} {...t} />
      ))}
    </div>
  )
}