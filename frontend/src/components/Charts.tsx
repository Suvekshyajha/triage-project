import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Summary } from '../types'

const URGENCY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}

const SENTIMENT_COLORS: Record<string, string> = {
  Angry: '#ef4444',
  Frustrated: '#f97316',
  Neutral: '#94a3b8', 
  Happy: '#22c55e',
}

const CATEGORY_COLORS: Record<string, string> = {
  Technical: '#ec4899',
  Billing: '#0ea5e9',
  Account: '#8b5cf6',
  Feedback: '#14b8a6',
  Other: '#94a3b8',
}

const URGENCY_ORDER = ['Critical', 'High', 'Medium', 'Low']
const SENTIMENT_ORDER = ['Angry', 'Frustrated', 'Neutral', 'Happy']
const DEFAULT_COLOR = '#6366f1'

function toData(record: Record<string, number>, order?: string[]) {
  const entries = Object.entries(record).map(([name, value]) => ({ name, value }))
  if (!order) return entries
  const rank = (name: string) => {
    const i = order.indexOf(name)
    return i === -1 ? order.length : i
  }
  return entries.sort((a, b) => rank(a.name) - rank(b.name))
}

function ChartCard({
  title,
  data,
  colors,
}: {
  title: string
  data: { name: string; value: number }[]
  colors?: Record<string, string>
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <h3 className="mb-2 text-sm font-medium text-slate-700">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 16 }}>
          <XAxis dataKey="name" fontSize={12} />
          <YAxis allowDecimals={false} fontSize={12} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={colors?.[entry.name] ?? DEFAULT_COLOR} />
            ))}
            <LabelList dataKey="value" position="top" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Charts({ summary }: { summary: Summary }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ChartCard
        title="By category"
        data={toData(summary.by_category)}
        colors={CATEGORY_COLORS}
      />
      <ChartCard
        title="By urgency"
        data={toData(summary.by_urgency, URGENCY_ORDER)}
        colors={URGENCY_COLORS}
      />
      <ChartCard
        title="By sentiment"
        data={toData(summary.by_sentiment, SENTIMENT_ORDER)}
        colors={SENTIMENT_COLORS}
      />
    </div>
  )
}