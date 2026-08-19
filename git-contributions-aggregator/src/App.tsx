import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Activity, CalendarDays, KeyRound, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import {
  fetchAllContributions,
  maskToken,
  mergeContributions,
  type MergedDay,
  type TokenFetchResult,
  type TokenFetchSuccess,
} from './api'

const STORAGE_KEY = 'unified-github-pats'
const LEVEL_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39ff14'] as const

type StoredToken = {
  id: string
  value: string
}

function loadTokens(): StoredToken[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredToken[]
    return Array.isArray(parsed) ? parsed.filter((item) => item.id && item.value) : []
  } catch {
    return []
  }
}

function monthLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  })
}

function formatTooltip(day: MergedDay): string {
  const label = new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const count = day.contributionCount
  return `${count} contribution${count === 1 ? '' : 's'} on ${label}`
}

function Heatmap({ days }: { days: MergedDay[] }) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  const weeks = useMemo(() => {
    if (days.length === 0) return [] as MergedDay[][]

    const byDate = new Map(days.map((day) => [day.date, day]))
    const ordered = [...days].sort((a, b) => a.date.localeCompare(b.date))
    const start = new Date(`${ordered[0].date}T00:00:00Z`)
    start.setUTCDate(start.getUTCDate() - start.getUTCDay())
    const end = new Date(`${ordered[ordered.length - 1].date}T00:00:00Z`)

    const columns: MergedDay[][] = []
    const cursor = new Date(start)

    while (cursor <= end) {
      const week: MergedDay[] = []
      for (let i = 0; i < 7; i += 1) {
        const key = cursor.toISOString().slice(0, 10)
        week.push(byDate.get(key) ?? { date: key, contributionCount: 0, level: 0 })
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
      columns.push(week)
    }

    return columns
  }, [days])

  const monthLabels = useMemo(() => {
    return weeks.map((week, index) => {
      const firstOfMonth = week.find((day) => day.date.endsWith('-01'))
      if (firstOfMonth) return monthLabel(firstOfMonth.date)
      if (index === 0) return monthLabel(week[0].date)
      return ''
    })
  }, [weeks])

  if (days.length === 0) {
    return (
      <p className="text-sm text-emerald-200/50">
        Add at least one valid token to render the unified graph.
      </p>
    )
  }

  return (
    <div className="relative overflow-x-auto pb-2">
      <div className="inline-flex gap-3">
        <div className="mt-6 flex flex-col justify-between py-[2px] text-[10px] text-emerald-200/40">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>
        <div>
          <div className="mb-1 flex gap-[3px] text-[10px] text-emerald-300/60">
            {weeks.map((week, index) => (
              <div key={week[0].date} className="w-[11px] overflow-visible">
                {monthLabels[index] ? <span className="inline-block w-8">{monthLabels[index]}</span> : null}
              </div>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((week) => (
              <div key={week[0].date} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    aria-label={formatTooltip(day)}
                    className="h-[11px] w-[11px] rounded-[2px] border border-emerald-500/10 transition hover:ring-1 hover:ring-lime-300"
                    style={{ backgroundColor: LEVEL_COLORS[day.level] ?? LEVEL_COLORS[0] }}
                    onMouseEnter={(event) => {
                      setTooltip({
                        text: formatTooltip(day),
                        x: event.clientX,
                        y: event.clientY,
                      })
                    }}
                    onMouseMove={(event) => {
                      setTooltip({
                        text: formatTooltip(day),
                        x: event.clientX,
                        y: event.clientY,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {tooltip ? (
        <div
          className="pointer-events-none fixed z-20 rounded border border-lime-400/40 bg-[#07140c] px-2 py-1 text-xs text-lime-200 shadow-[0_0_18px_#39ff1440]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          {tooltip.text}
        </div>
      ) : null}
    </div>
  )
}

export default function App() {
  const [tokens, setTokens] = useState<StoredToken[]>(() => loadTokens())
  const [draft, setDraft] = useState('')
  const [results, setResults] = useState<TokenFetchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  }, [tokens])

  useEffect(() => {
    const values = tokens.map((token) => token.value)
    if (values.length === 0) {
      setResults([])
      return
    }

    let cancelled = false
    setLoading(true)

    fetchAllContributions(values)
      .then((next) => {
        if (!cancelled) setResults(next)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tokens])

  const successful = results.filter((result): result is TokenFetchSuccess => result.ok)
  const merged = useMemo(() => {
    const datasets = results
      .filter((result): result is TokenFetchSuccess => result.ok)
      .map((result) => result.data)
    return mergeContributions(datasets)
  }, [results])
  const totalContributions = merged.reduce((sum, day) => sum + day.contributionCount, 0)
  const totalContributionDays = merged.filter((day) => day.contributionCount > 0).length

  function addToken(event: FormEvent) {
    event.preventDefault()
    const value = draft.trim()
    if (!value) {
      setFormError('Paste a GitHub personal access token.')
      return
    }
    if (tokens.some((token) => token.value === value)) {
      setFormError('That token is already stored.')
      return
    }
    setTokens((current) => [...current, { id: crypto.randomUUID(), value }])
    setDraft('')
    setFormError(null)
  }

  function removeToken(id: string) {
    setTokens((current) => current.filter((token) => token.id !== id))
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="border-b border-lime-500/20 pb-6">
        <h1 className="text-3xl font-semibold text-lime-100">Unified GitHub Contribution Graph</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-xs text-emerald-200/70">
            Combine contribution graphs from multiple GitHub accounts into one heatmap.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 px-5 py-3 text-right shadow-[0_0_24px_#39ff141a]">
              <p className="text-[10px] tracking-[0.25em] text-lime-400/70 uppercase">Total contributions</p>
              <p className="font-mono text-3xl text-lime-300">{totalContributions.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 px-5 py-3 text-right shadow-[0_0_24px_#39ff141a]">
              <p className="inline-flex items-center justify-end gap-1 text-[10px] tracking-[0.25em] text-lime-400/70 uppercase">
                <CalendarDays size={12} />
                Total contribution days
              </p>
              <p className="font-mono text-3xl text-lime-300">{totalContributionDays.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <form
          onSubmit={addToken}
          className="rounded-2xl border border-emerald-500/20 bg-[#07110c]/80 p-5 shadow-[inset_0_0_40px_#0b3d1e22]"
        >
          <div className="mb-4 flex items-center gap-2 text-lime-200">
            <KeyRound size={18} />
            <h2 className="text-sm tracking-wide uppercase">Your GitHub tokens</h2>
          </div>
          <div
            role="note"
            className="mb-4 flex gap-2 rounded-lg border border-lime-400/25 bg-lime-400/10 px-3 py-2 text-xs leading-relaxed text-lime-100"
          >
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-lime-300" />
            <p>
              <strong className="font-semibold">Tokens are not stored on our side.</strong> They
              stay in this browser and go only to GitHub.
            </p>
          </div>
          <label className="mb-2 block text-xs text-emerald-200/70" htmlFor="pat">
            GitHub personal access token (classic: <code>read:user</code>)
          </label>
          <div className="flex gap-2">
            <input
              id="pat"
              type="password"
              autoComplete="off"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="ghp_..."
              className="w-full rounded-lg border border-emerald-500/20 bg-[#05080a] px-3 py-2 text-sm text-lime-100 outline-none ring-lime-400/40 placeholder:text-emerald-200/30 focus:ring-2"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-lime-400 px-3 py-2 text-sm font-medium text-[#04140a] hover:bg-lime-300"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          {formError ? <p className="mt-2 text-xs text-red-400">{formError}</p> : null}

          <ul className="mt-5 space-y-2">
            {tokens.length === 0 ? (
              <li className="text-xs text-emerald-200/40">No tokens added in this browser yet.</li>
            ) : (
              tokens.map((token) => {
                const result = results.find((item) => item.token === token.value)
                return (
                  <li
                    key={token.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/15 bg-black/30 px-3 py-2"
                  >
                    <div>
                      <p className="font-mono text-sm text-lime-200">{maskToken(token.value)}</p>
                      {result?.ok ? (
                        <p className="text-[11px] text-emerald-300/80">@{result.data.login}</p>
                      ) : result && !result.ok ? (
                        <span className="mt-1 inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
                          Error: {result.error}
                        </span>
                      ) : (
                        <p className="text-[11px] text-emerald-200/40">Waiting…</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeToken(token.id)}
                      className="rounded-md p-2 text-emerald-200/50 hover:bg-red-500/10 hover:text-red-300"
                      aria-label={`Remove ${maskToken(token.value)}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </form>

        <section className="rounded-2xl border border-emerald-500/20 bg-[#07110c]/80 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-lime-200">
              <Activity size={18} />
              <h2 className="text-sm tracking-wide uppercase">Aggregated heatmap</h2>
            </div>
            {loading ? (
              <span className="inline-flex items-center gap-1 text-xs text-lime-300/70">
                <RefreshCw size={12} className="animate-spin" />
                Syncing
              </span>
            ) : (
              <span className="text-xs text-emerald-200/40">
                {successful.length} account{successful.length === 1 ? '' : 's'} merged
              </span>
            )}
          </div>
          <Heatmap days={merged} />
          <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-emerald-200/50">
            <span>Less</span>
            {LEVEL_COLORS.map((color) => (
              <span
                key={color}
                className="h-[11px] w-[11px] rounded-[2px] border border-emerald-500/10"
                style={{ backgroundColor: color }}
              />
            ))}
            <span>More</span>
          </div>
        </section>
      </section>
    </div>
  )
}
