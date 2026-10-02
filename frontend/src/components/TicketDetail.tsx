import { useState } from 'react'
import type { TriagedTicket } from '../types'
import { UrgencyPill, SentimentLabel } from './Badges'
import { urgencyAccent } from '../lib/colors'

export default function TicketDetail({ ticket }: { ticket: TriagedTicket | null }) {
  const [draft, setDraft] = useState(ticket?.suggested_reply ?? '')
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!ticket) {
    return (
      <aside className="rounded-xl border bg-white p-5 text-sm text-slate-600 shadow-sm">
        Select a ticket to see the full message and the suggested reply.
      </aside>
    )
  }

  async function copyReply() {
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (for example on an insecure page). Ignore.
    }
  }

  return (
    <aside
      className={`flex flex-col gap-4 rounded-xl border border-l-4 bg-white p-5 shadow-sm ${urgencyAccent[ticket.urgency]}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Ticket #{ticket.id}</h2>
        <UrgencyPill urgency={ticket.urgency} />
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span>{ticket.category}</span>
        <SentimentLabel sentiment={ticket.sentiment} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
          Customer message
        </p>
        <p className="text-sm leading-relaxed text-slate-800">{ticket.message}</p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
          Suggested reply
        </p>
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={9}
            aria-label="Edit suggested reply"
            className="w-full rounded-lg border border-slate-300 p-3 text-sm leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        ) : (
          <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">
            {draft}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={copyReply}
          className="h-11 flex-1 rounded-lg bg-[#0b1c9b] text-sm font-medium text-white hover:bg-indigo-800"
        >
          {copied ? 'Copied ✓' : 'Copy reply'}
        </button>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="h-11 flex-1 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
    </aside>
  )
}