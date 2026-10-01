import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Summary } from '../types'

function toData(record: Record<string, number>) {
  return Object.entries(record).map(([name, value]) => ({ name, value }))
}

function ChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-medium text-slate-700">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="name" fontSize={12} />
          <YAxis allowDecimals={false} fontSize={12} />
          <Tooltip />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Charts({ summary }: { summary: Summary }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ChartCard title="By category" data={toData(summary.by_category)} />
      <ChartCard title="By urgency" data={toData(summary.by_urgency)} />
      <ChartCard title="By sentiment" data={toData(summary.by_sentiment)} />
    </div>
  )
}
