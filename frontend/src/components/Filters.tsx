type Props = {
  urgency: string
  onUrgency: (v: string) => void
  category: string
  onCategory: (v: string) => void
  sentiment: string
  onSentiment: (v: string) => void
  query: string
  onQuery: (v: string) => void
  onClear: () => void
}

const URGENCIES = ['Critical', 'High', 'Medium', 'Low']
const CATEGORIES = ['Billing', 'Technical', 'Account', 'Feedback', 'Other']
const SENTIMENTS = ['Angry', 'Frustrated', 'Neutral', 'Happy']

const control =
  'rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

function Select({
  value,
  onChange,
  allLabel,
  options,
}: {
  value: string
  onChange: (v: string) => void
  allLabel: string
  options: string[]
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={control}>
      <option value="All">{allLabel}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

export default function Filters(p: Props) {
  const active =
    p.urgency !== 'All' || p.category !== 'All' || p.sentiment !== 'All' || p.query !== ''

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <input
        value={p.query}
        onChange={(e) => p.onQuery(e.target.value)}
        placeholder="Search messages…"
        className={`${control} md:flex-1`}
      />
      <div className="grid grid-cols-3 gap-3 md:flex">
        <Select value={p.urgency} onChange={p.onUrgency} allLabel="All urgencies" options={URGENCIES} />
        <Select value={p.category} onChange={p.onCategory} allLabel="All categories" options={CATEGORIES} />
        <Select value={p.sentiment} onChange={p.onSentiment} allLabel="All sentiments" options={SENTIMENTS} />
      </div>
      {active && (
        <button
          onClick={p.onClear}
          className="rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}