export type MatchStatus =
  | 'scheduled'
  | 'open'
  | 'locked'
  | 'live'
  | 'finished'
  | 'scored'
  | 'postponed'
  | 'cancelled'
export type MatchStage =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarterfinal'
  | 'semifinal'
  | 'third_place'
  | 'final'
export type PredictionStatus = 'not_submitted' | 'saved' | 'locked' | 'finished' | 'scored'
export type UserRole = 'user' | 'admin' | 'super_admin'

export interface Team {
  id: string
  name: string
  shortName: string
  fifaCode: string
  countryCode: string // for FlagCDN
  flagUrl: string
  groupName?: string
  primaryColor?: string
}

export interface Match {
  id: string
  matchNumber: number
  stage: MatchStage
  groupName?: string
  teamA: Team
  teamB: Team
  teamAPlaceholder?: string
  teamBPlaceholder?: string
  kickoffUtc: string // ISO UTC
  kickoffKuwait: string // display string in Kuwait Time
  venue: string
  city: string
  status: MatchStatus
  fullTimeScoreA?: number
  fullTimeScoreB?: number
  wentToPenalties?: boolean
  penaltyScoreA?: number
  penaltyScoreB?: number
  winnerTeamId?: string
  minute?: number // live match minute
}

export interface Prediction {
  id: string
  userId: string
  matchId: string
  predictedScoreA: number
  predictedScoreB: number
  predictedOutcome?: 'team_a' | 'draw' | 'team_b'
  predictedWinnerTeamId?: string
  predictspenalties?: boolean
  predictedPenaltyScoreA?: number
  predictedPenaltyScoreB?: number
  lastUpdatedAt: string
  isLocked: boolean
  status: PredictionStatus
  points?: number
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  avatarUrl?: string
  favoriteTeamCode?: string
  totalPoints: number
  exactScoresCount: number
  correctOutcomesCount: number
  submissionsCount: number
  todayPoints: number
  badges: BadgeType[]
}

export type BadgeType =
  | 'exact_score_king'
  | 'penalty_genius'
  | 'comeback_master'
  | 'final_boss'
  | 'underdog_whisperer'
  | 'last_minute_predictor'
  | 'best_streak'
  | 'unlucky'
  | 'late_predictor'

export interface UserStats {
  totalPoints: number
  currentRank: number
  totalParticipants: number
  exactScores: number
  correctOutcomes: number
  predictionsSubmitted: number
  predictionsAvailable: number
  lastMatchPoints?: number
  lastMatchName?: string
  todayPoints: number
}

export interface GroupStanding {
  teamId: string
  team: {
    id: string
    name: string
    shortName: string
    flagCode: string
  }
  groupLetter: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface GroupData {
  letter: string
  name: string
  standings: GroupStanding[]
}

export interface ScoringRules {
  validSubmission: number
  lockedAtKickoff: number
  correctWinnerOrOutcome: number
  exactFullTimeScore: number
  correctlyPredictedPenalties: number
  exactPenaltyScore: number
  stageBonus: Record<MatchStage, number>
}
