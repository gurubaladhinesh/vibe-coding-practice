const GRAPHQL_ENDPOINT = import.meta.env.DEV
  ? '/graphql'
  : 'https://api.github.com/graphql'

export const CONTRIBUTIONS_QUERY = `
query {
  viewer {
    login
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}
`

export type ContributionDay = {
  date: string
  contributionCount: number
}

export type ContributionDataset = {
  login: string
  totalContributions: number
  days: ContributionDay[]
}

export type MergedDay = {
  date: string
  contributionCount: number
  level: number
}

export type TokenFetchSuccess = {
  token: string
  ok: true
  data: ContributionDataset
}

export type TokenFetchFailure = {
  token: string
  ok: false
  error: string
}

export type TokenFetchResult = TokenFetchSuccess | TokenFetchFailure

type GraphQLDay = {
  contributionCount: number
  date: string
}

type GraphQLResponse = {
  data?: {
    viewer?: {
      login: string
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions: number
          weeks?: { contributionDays?: GraphQLDay[] }[]
        }
      }
    }
  }
  errors?: { message: string }[]
}

export function maskToken(token: string): string {
  const knownPrefix = token.match(/^(gh[pousr]_|github_pat_)/)?.[0]
  const prefix = knownPrefix ?? token.slice(0, Math.min(4, token.length))
  return `${prefix}${'*'.repeat(4)}`
}

export function contributionLevel(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

export function mergeContributions(datasets: ContributionDataset[]): MergedDay[] {
  const byDate = new Map<string, number>()

  for (const dataset of datasets) {
    for (const day of dataset.days) {
      byDate.set(day.date, (byDate.get(day.date) ?? 0) + day.contributionCount)
    }
  }

  const max = Math.max(0, ...byDate.values())

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, contributionCount]) => ({
      date,
      contributionCount,
      level: contributionLevel(contributionCount, max),
    }))
}

function flattenCalendar(payload: GraphQLResponse): ContributionDataset {
  const viewer = payload.data?.viewer
  const calendar = viewer?.contributionsCollection?.contributionCalendar

  if (!viewer?.login || !calendar) {
    throw new Error('Unexpected GitHub response shape')
  }

  const days = (calendar.weeks ?? []).flatMap((week) => week.contributionDays ?? [])

  return {
    login: viewer.login,
    totalContributions: calendar.totalContributions,
    days: days.map((day) => ({
      date: day.date,
      contributionCount: day.contributionCount,
    })),
  }
}

export async function fetchViewerContributions(token: string): Promise<ContributionDataset> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    mode: 'cors',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: CONTRIBUTIONS_QUERY }),
  })

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${response.statusText}`)
  }

  const payload = (await response.json()) as GraphQLResponse

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '))
  }

  return flattenCalendar(payload)
}

export async function fetchAllContributions(tokens: string[]): Promise<TokenFetchResult[]> {
  return Promise.all(
    tokens.map(async (token): Promise<TokenFetchResult> => {
      try {
        const data = await fetchViewerContributions(token)
        return { token, ok: true, data }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { token, ok: false, error: message }
      }
    }),
  )
}
