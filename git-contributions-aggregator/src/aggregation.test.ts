import { describe, expect, it } from 'vitest'
import { mergeContributions, type ContributionDataset } from './api'

describe('mergeContributions', () => {
  it('sums contributionCount for matching dates across accounts', () => {
    const accountA: ContributionDataset = {
      login: 'account-a',
      totalContributions: 2,
      days: [{ date: '2024-01-01', contributionCount: 2 }],
    }

    const accountB: ContributionDataset = {
      login: 'account-b',
      totalContributions: 3,
      days: [{ date: '2024-01-01', contributionCount: 3 }],
    }

    const merged = mergeContributions([accountA, accountB])
    const janFirst = merged.find((day) => day.date === '2024-01-01')

    expect(janFirst?.contributionCount).toBe(5)
    expect(janFirst?.byAccount).toEqual([
      { login: 'account-a', contributionCount: 2 },
      { login: 'account-b', contributionCount: 3 },
    ])
  })

  it('keeps unique dates and assigns a 0-4 intensity level', () => {
    const datasets: ContributionDataset[] = [
      {
        login: 'a',
        totalContributions: 2,
        days: [
          { date: '2024-01-01', contributionCount: 2 },
          { date: '2024-01-02', contributionCount: 0 },
        ],
      },
      {
        login: 'b',
        totalContributions: 3,
        days: [{ date: '2024-01-01', contributionCount: 3 }],
      },
    ]

    const merged = mergeContributions(datasets)

    expect(merged).toHaveLength(2)
    expect(merged.find((day) => day.date === '2024-01-02')?.contributionCount).toBe(0)
    expect(merged.find((day) => day.date === '2024-01-02')?.level).toBe(0)
    expect(merged.find((day) => day.date === '2024-01-01')?.level).toBeGreaterThan(0)
    expect(merged.find((day) => day.date === '2024-01-01')?.level).toBeLessThanOrEqual(4)
    expect(merged.find((day) => day.date === '2024-01-02')?.byAccount).toEqual([
      { login: 'a', contributionCount: 0 },
      { login: 'b', contributionCount: 0 },
    ])
  })

  it('sums counts when two datasets share the same login', () => {
    const merged = mergeContributions([
      {
        login: 'same',
        totalContributions: 1,
        days: [{ date: '2024-01-01', contributionCount: 1 }],
      },
      {
        login: 'same',
        totalContributions: 4,
        days: [{ date: '2024-01-01', contributionCount: 4 }],
      },
    ])

    expect(merged[0]?.byAccount).toEqual([{ login: 'same', contributionCount: 5 }])
  })
})
