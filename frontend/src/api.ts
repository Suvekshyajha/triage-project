import type { TicketsResponse } from './types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function fetchTickets(): Promise<TicketsResponse> {
  const res = await fetch(`${BASE}/api/tickets`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}
