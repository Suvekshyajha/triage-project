import { useEffect, useMemo, useState } from 'react'
import { fetchTickets, startTriage, fetchProgress } from './api'
import type { TicketsResponse, TriagedTicket } from './types'
import StatsOverview from './components/StatsOverview'
import Charts from './components/Charts'
import Filters from './components/Filters'
import TicketList from './components/TicketList'
import type { SortDir } from './components/TicketList'
import TicketDetail from './components/TicketDetail'

const URGENCY_RANK: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
}

export default function App() {
  const [data, setData] = useState<TicketsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progressText, setProgressText] = useState('Starting triage…')

  const [urgency, setUrgency] = useState('All')
  const [category, setCategory] = useState('All')
  const [sentiment, setSentiment] = useState('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortDir>('off')
  const [selected, setSelected] = useState<TriagedTicket | null>(null)

  useEffect(() => {
    let cancelled = false

    async function runTriage() {
      try {
        setLoading(true)
        setError(null)

        // 1. Already triaged? Load cached results immediately (handles reloads).
        let result = await fetchTickets()
        if (result) {
          if (!cancelled) {
            setData(result)
            setLoading(false)
          }
          return
        }

        // 2. Not ready → start the batch ONCE.
        await startTriage()

        // 3. Poll progress; only fetch tickets once the batch reports done.
        while (!cancelled) {
          const progress = await fetchProgress()

          if (progress.total > 0 && !progress.running) {
            result = await fetchTickets()
            if (result) {
              if (!cancelled) {
                setData(result)
                setLoading(false)
              }
              return
            }
          }

          setProgressText(
            progress.total > 0
              ? `Processing ticket ${progress.current} of ${progress.total}…`
              : 'Starting triage…',
          )

          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Something went wrong')
          setLoading(false)
        }
      }
    }

    runTriage()

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []

    const rows = data.tickets.filter(
      (t) =>
        (urgency === 'All' || t.urgency === urgency) &&
        (category === 'All' || t.category === category) &&
        (sentiment === 'All' || t.sentiment === sentiment) &&
        t.message.toLowerCase().includes(query.toLowerCase()),
    )

    if (sort === 'off') return rows

    return [...rows].sort((a, b) => {
      const diff =
        (URGENCY_RANK[a.urgency] ?? 99) -
        (URGENCY_RANK[b.urgency] ?? 99)

      return sort === 'asc' ? diff : -diff
    })
  }, [data, urgency, category, sentiment, query, sort])

  const toggleSort = () =>
    setSort((s) =>
      s === 'off' ? 'asc' : s === 'asc' ? 'desc' : 'off',
    )

  const clearFilters = () => {
    setUrgency('All')
    setCategory('All')
    setSentiment('All')
    setQuery('')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
              C
            </div>

            <div>
              <h1 className="text-base font-semibold leading-tight md:text-lg">
                Caregene{' '}
                <span className="font-normal text-slate-400">·</span>{' '}
                Support Triage
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block md:text-sm">
                AI-assisted triage for incoming support tickets
              </p>
            </div>
          </div>

          {(data || error) && (
            <span className="inline-flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <span
                className={`h-2 w-2 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500'}`}
              />
              {error ? 'Error' : `${data?.summary.total ?? 0} tickets triaged`}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        {loading && (
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">{progressText}</p>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Failed to load tickets: {error}
          </p>
        )}

        {data && (
          <>
            <StatsOverview summary={data.summary} />

            <Charts summary={data.summary} />

            <Filters
              urgency={urgency}
              onUrgency={setUrgency}
              category={category}
              onCategory={setCategory}
              sentiment={sentiment}
              onSentiment={setSentiment}
              query={query}
              onQuery={setQuery}
              onClear={clearFilters}
            />

            <p className="text-sm text-slate-500">
              Showing {filtered.length} of {data.tickets.length} tickets
            </p>

            <TicketList
              tickets={filtered}
              onSelect={setSelected}
              sort={sort}
              onToggleSort={toggleSort}
            />
          </>
        )}
      </main>

      {selected && (
        <TicketDetail
          ticket={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}