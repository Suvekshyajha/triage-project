import { useEffect, useMemo, useState } from 'react'
import { fetchTickets } from './api'
import type { TicketsResponse, TriagedTicket } from './types'
import StatsOverview from './components/StatsOverview'
import Charts from './components/Charts'
import Filters from './components/Filters'
import TicketList from './components/TicketList'
import TicketDetail from './components/TicketDetail'

export default function App() {
  const [data, setData] = useState<TicketsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [urgency, setUrgency] = useState('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<TriagedTicket | null>(null)

  useEffect(() => {
    fetchTickets()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    return data.tickets.filter(
      (t) =>
        (urgency === 'All' || t.urgency === urgency) &&
        t.message.toLowerCase().includes(query.toLowerCase()),
    )
    // TODO: add sorting (e.g. by urgency rank) here.
  }, [data, urgency, query])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Caregene · Support Triage</h1>
        <p className="text-sm text-slate-500">AI-assisted triage for incoming support tickets</p>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-6">
        {loading && <p className="text-sm text-slate-500">Loading tickets…</p>}
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Failed to load tickets: {error}
          </p>
        )}

        {data && (
          <>
            <StatsOverview summary={data.summary} />
            <Charts summary={data.summary} />
            <Filters urgency={urgency} onUrgency={setUrgency} query={query} onQuery={setQuery} />
            <TicketList tickets={filtered} onSelect={setSelected} />
          </>
        )}
      </main>

      {selected && <TicketDetail ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
