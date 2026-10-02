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

// h-11 = 44px, a comfortable tap size.
const control =
  'h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={allLabel}
      className={control}
    >
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
        aria-label="Search messages"
        className={`${control} md:flex-1`}
      />
      <div className="grid grid-cols-3 gap-3 md:flex">
        <Select value={p.urgency} onChange={p.onUrgency} allLabel="All urgencies" options={URGENCIES} />
        <Select value={p.category} onChange={p.onCategory} allLabel="All categories" options={CATEGORIES} />
        <Select value={p.sentiment} onChange={p.onSentiment} allLabel="All sentiments" options={SENTIMENTS} />
      </div>
      {active && (
        <button
          type="button"
          onClick={p.onClear}
          className="h-11 rounded-lg px-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}