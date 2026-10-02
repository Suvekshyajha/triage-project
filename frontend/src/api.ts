import type { TicketsResponse } from './types'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface Progress {
  running: boolean
  current: number
  total: number
  ticket_id: number | null
}

/** GET results. Returns null if triage hasn't run yet (409). */
export async function fetchTickets(): Promise<TicketsResponse | null> {
  const res = await fetch(`${API}/api/tickets`)
  if (res.status === 409) return null
  if (!res.ok) throw new Error(`Failed to load tickets (${res.status})`)
  return res.json()
}

/** POST to start the batch once (safe to call even if already running). */
export async function startTriage(): Promise<void> {
  const res = await fetch(`${API}/api/triage`, { method: 'POST' })
  if (!res.ok) throw new Error(`Failed to start triage (${res.status})`)
}

/** GET current progress for the loading bar. */
export async function fetchProgress(): Promise<Progress> {
  const res = await fetch(`${API}/api/progress`)
  if (!res.ok) throw new Error(`Failed to get progress (${res.status})`)
  return res.json()
}