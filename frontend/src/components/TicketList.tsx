import type { TriagedTicket } from '../types'
import { urgencyColor, sentimentColor } from '../lib/colors'

export type SortDir = 'off' | 'asc' | 'desc'

interface Props {
  tickets: TriagedTicket[]
  onSelect: (t: TriagedTicket) => void
  sort: SortDir
  onToggleSort: () => void
}

export default function TicketList({ tickets, onSelect, sort, onToggleSort }: Props) {
  if (tickets.length === 0) {
    return <p className="text-sm text-slate-500">No tickets match your filters.</p>
  }

  const sortIndicator = sort === 'asc' ? '▲' : sort === 'desc' ? '▼' : '↕'
  const ariaSort =
    sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : 'none'

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">Message</th>
            <th className="px-4 py-2" aria-sort={ariaSort}>
              <button
                type="button"
                onClick={onToggleSort}
                className="inline-flex items-center gap-1 font-semibold hover:text-slate-900"
              >
                Urgency
                <span className={sort === 'off' ? 'text-slate-400' : 'text-indigo-600'}>
                  {sortIndicator}
                </span>
              </button>
            </th>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Sentiment</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              onClick={() => onSelect(t)}
              className="cursor-pointer border-t hover:bg-slate-50"
            >
              <td className="px-4 py-2 text-slate-400">{t.id}</td>
              <td className="max-w-md truncate px-4 py-2">{t.message}</td>
              <td className="px-4 py-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs ${urgencyColor[t.urgency]}`}>
                  {t.urgency}
                </span>
              </td>
              <td className="px-4 py-2">{t.category}</td>
              <td className="px-4 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${sentimentColor[t.sentiment]}`}>
                  {t.sentiment}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}