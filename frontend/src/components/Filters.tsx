import type { Urgency } from '../types'

interface Props {
  urgency: string
  onUrgency: (v: string) => void
  query: string
  onQuery: (v: string) => void
}

const URGENCIES: (Urgency | 'All')[] = ['All', 'Critical', 'High', 'Medium', 'Low']
const control = 'rounded-lg border px-3 py-2 text-sm'

export default function Filters({ urgency, onUrgency, query, onQuery }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Search messages…"
        className={`${control} flex-1 min-w-[200px]`}
      />
      <select value={urgency} onChange={(e) => onUrgency(e.target.value)} className={control}>
        {URGENCIES.map((u) => (
          <option key={u} value={u}>
            {u === 'All' ? 'All urgencies' : u}
          </option>
        ))}
      </select>
      {/* TODO: add category + sentiment filters and a sort control. */}
    </div>
  )
}
