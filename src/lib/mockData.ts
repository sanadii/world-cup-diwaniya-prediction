import type { Match, LeaderboardEntry, UserStats } from '@/types/app'

export const mockUserStats: UserStats = {
  totalPoints: 47,
  currentRank: 3,
  totalParticipants: 18,
  exactScores: 4,
  correctOutcomes: 11,
  predictionsSubmitted: 14,
  predictionsAvailable: 3,
  lastMatchPoints: 6,
  lastMatchName: 'Brazil vs Argentina',
  todayPoints: 8,
}

export const mockTodayMatches: Match[] = [
  {
    id: 'm1',
    matchNumber: 1,
    stage: 'group',
    groupName: 'A',
    teamA: {
      id: 't1', name: 'Brazil', shortName: 'BRA', fifaCode: 'BRA',
      countryCode: 'br', flagUrl: 'https://flagcdn.com/w80/br.png', primaryColor: '#009C3B',
    },
    teamB: {
      id: 't2', name: 'Mexico', shortName: 'MEX', fifaCode: 'MEX',
      countryCode: 'mx', flagUrl: 'https://flagcdn.com/w80/mx.png', primaryColor: '#006847',
    },
    kickoffUtc: '2026-06-11T16:00:00Z',
    kickoffKuwait: 'Today · 19:00 AST',
    venue: 'SoFi Stadium',
    city: 'Los Angeles',
    status: 'live',
    fullTimeScoreA: 1,
    fullTimeScoreB: 0,
    minute: 67,
  },
  {
    id: 'm2',
    matchNumber: 2,
    stage: 'group',
    groupName: 'B',
    teamA: {
      id: 't3', name: 'France', shortName: 'FRA', fifaCode: 'FRA',
      countryCode: 'fr', flagUrl: 'https://flagcdn.com/w80/fr.png', primaryColor: '#003189',
    },
    teamB: {
      id: 't4', name: 'Portugal', shortName: 'POR', fifaCode: 'POR',
      countryCode: 'pt', flagUrl: 'https://flagcdn.com/w80/pt.png', primaryColor: '#006600',
    },
    kickoffUtc: '2026-06-11T19:00:00Z',
    kickoffKuwait: 'Today · 22:00 AST',
    venue: 'MetLife Stadium',
    city: 'New York / New Jersey',
    status: 'open',
    minute: undefined,
  },
  {
    id: 'm3',
    matchNumber: 3,
    stage: 'group',
    groupName: 'C',
    teamA: {
      id: 't5', name: 'Argentina', shortName: 'ARG', fifaCode: 'ARG',
      countryCode: 'ar', flagUrl: 'https://flagcdn.com/w80/ar.png', primaryColor: '#74ACDF',
    },
    teamB: {
      id: 't6', name: 'England', shortName: 'ENG', fifaCode: 'ENG',
      countryCode: 'gb-eng', flagUrl: 'https://flagcdn.com/w80/gb-eng.png', primaryColor: '#CF081F',
    },
    kickoffUtc: '2026-06-11T22:00:00Z',
    kickoffKuwait: 'Today · 01:00 AST +1',
    venue: 'AT&T Stadium',
    city: 'Dallas',
    status: 'open',
  },
]

export const mockTomorrowMatches: Match[] = [
  {
    id: 'm4',
    matchNumber: 4,
    stage: 'group',
    groupName: 'D',
    teamA: {
      id: 't7', name: 'Spain', shortName: 'ESP', fifaCode: 'ESP',
      countryCode: 'es', flagUrl: 'https://flagcdn.com/w80/es.png', primaryColor: '#AA151B',
    },
    teamB: {
      id: 't8', name: 'Germany', shortName: 'GER', fifaCode: 'GER',
      countryCode: 'de', flagUrl: 'https://flagcdn.com/w80/de.png', primaryColor: '#000000',
    },
    kickoffUtc: '2026-06-12T17:00:00Z',
    kickoffKuwait: 'Tomorrow · 20:00 AST',
    venue: 'Arrowhead Stadium',
    city: 'Kansas City',
    status: 'scheduled',
  },
  {
    id: 'm5',
    matchNumber: 5,
    stage: 'group',
    groupName: 'E',
    teamA: {
      id: 't9', name: 'Morocco', shortName: 'MAR', fifaCode: 'MAR',
      countryCode: 'ma', flagUrl: 'https://flagcdn.com/w80/ma.png', primaryColor: '#C1272D',
    },
    teamB: {
      id: 't10', name: 'Japan', shortName: 'JPN', fifaCode: 'JPN',
      countryCode: 'jp', flagUrl: 'https://flagcdn.com/w80/jp.png', primaryColor: '#BC0029',
    },
    kickoffUtc: '2026-06-12T20:00:00Z',
    kickoffKuwait: 'Tomorrow · 23:00 AST',
    venue: 'Levi\'s Stadium',
    city: 'San Francisco',
    status: 'scheduled',
  },
]

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1, userId: 'u1', displayName: 'Sanad K.', favoriteTeamCode: 'ar',
    totalPoints: 58, exactScoresCount: 7, correctOutcomesCount: 15,
    submissionsCount: 17, todayPoints: 12,
    badges: ['exact_score_king', 'best_streak'],
  },
  {
    rank: 2, userId: 'u2', displayName: 'Ahmad M.', favoriteTeamCode: 'br',
    totalPoints: 52, exactScoresCount: 5, correctOutcomesCount: 13,
    submissionsCount: 16, todayPoints: 9,
    badges: ['underdog_whisperer'],
  },
  {
    rank: 3, userId: 'u3', displayName: 'You', favoriteTeamCode: 'fr',
    totalPoints: 47, exactScoresCount: 4, correctOutcomesCount: 11,
    submissionsCount: 14, todayPoints: 8,
    badges: ['penalty_genius'],
  },
  {
    rank: 4, userId: 'u4', displayName: 'Khalid A.', favoriteTeamCode: 'es',
    totalPoints: 44, exactScoresCount: 3, correctOutcomesCount: 12,
    submissionsCount: 15, todayPoints: 6,
    badges: [],
  },
  {
    rank: 5, userId: 'u5', displayName: 'Nasser B.', favoriteTeamCode: 'pt',
    totalPoints: 39, exactScoresCount: 2, correctOutcomesCount: 10,
    submissionsCount: 13, todayPoints: 4,
    badges: ['unlucky'],
  },
]
