import type { TriagedTicket } from '../types'
import { UrgencyPill, SentimentLabel } from './Badges'
import { urgencyAccent } from '../lib/colors'

export type SortDir = 'off' | 'asc' | 'desc'

interface Props {
  tickets: TriagedTicket[]
  selectedId: number | null
  onSelect: (id: number) => void
  sort: SortDir
  onToggleSort: () => void
}

export default function TicketList({
  tickets,
  selectedId,
  onSelect,
  sort,
  onToggleSort,
}: Props) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-slate-600 shadow-sm">
        No tickets match your filters.
      </div>
    )
  }

  const sortIndicator = sort === 'asc' ? '▲' : sort === 'desc' ? '▼' : '↕'
  const ariaSort = sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : 'none'

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-slate-600">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Message</th>
            <th className="px-4 py-3 font-medium" aria-sort={ariaSort}>
              <button
                type="button"
                onClick={onToggleSort}
                className="inline-flex items-center gap-1 font-medium hover:text-slate-900"
              >
                Urgency
                <span className={sort === 'off' ? 'text-slate-400' : 'text-indigo-600'}>
                  {sortIndicator}
                </span>
              </button>
            </th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Sentiment</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => {
            const isSelected = t.id === selectedId
            return (
              <tr
                key={t.id}
                tabIndex={0}
                aria-current={isSelected ? 'true' : undefined}
                onClick={() => onSelect(t.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(t.id)
                  }
                }}
                className={`cursor-pointer border-t border-l-4 border-slate-100 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                  isSelected
                    ? `bg-indigo-50 ${urgencyAccent[t.urgency]}`
                    : 'border-l-transparent hover:bg-slate-50'
                }`}
              >
                <td className="px-4 py-4 align-top text-slate-500">{t.id}</td>
                <td className="px-4 py-4 align-top">
                  <div className="line-clamp-2 min-w-[240px] leading-snug">{t.message}</div>
                </td>
                <td className="px-4 py-4 align-top">
                  <UrgencyPill urgency={t.urgency} />
                </td>
                <td className="px-4 py-4 align-top text-slate-700">{t.category}</td>
                <td className="px-4 py-4 align-top">
                  <SentimentLabel sentiment={t.sentiment} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}