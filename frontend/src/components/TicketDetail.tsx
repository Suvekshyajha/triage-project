import type { TriagedTicket } from '../types'
import { urgencyColor, sentimentColor } from '../lib/colors'

interface Props {
  ticket: TriagedTicket
  onClose: () => void
}

export default function TicketDetail({ ticket, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-xs ${urgencyColor[ticket.urgency]}`}>
            {ticket.urgency}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{ticket.category}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${sentimentColor[ticket.sentiment]}`}>
            {ticket.sentiment}
          </span>
        </div>
        <h3 className="mb-1 text-sm font-medium text-slate-500">Ticket #{ticket.id}</h3>
        <p className="mb-4 text-slate-800">{ticket.message}</p>
        <h4 className="mb-1 text-sm font-medium text-slate-500">Suggested reply</h4>
        <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-800">
          {ticket.suggested_reply}
        </p>
        <button
          onClick={onClose}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
        >
          Close
        </button>
      </div>
    </div>
  )
}
