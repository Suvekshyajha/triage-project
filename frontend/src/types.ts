// Mirror of the backend schema (backend/schemas.py). Keep in sync.
export type Urgency = 'Critical' | 'High' | 'Medium' | 'Low'
export type Category = 'Billing' | 'Technical' | 'Account' | 'Feedback' | 'Other'
export type Sentiment = 'Angry' | 'Frustrated' | 'Neutral' | 'Happy'

export interface TriagedTicket {
  id: number
  message: string
  urgency: Urgency
  category: Category
  sentiment: Sentiment
  suggested_reply: string
}

export interface Summary {
  total: number
  by_urgency: Record<string, number>
  by_category: Record<string, number>
  by_sentiment: Record<string, number>
}

export interface TicketsResponse {
  tickets: TriagedTicket[]
  summary: Summary
}
