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
export type ApprovalStatus = 'pending' | 'approved'

export interface Profile {
  id: string
  email: string | null
  fullName: string | null
  displayName: string
  avatarUrl: string | null
  flagCode: string
  favoriteTeamId: string | null
  role: UserRole
  approvalStatus: ApprovalStatus
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: string
  name: string
  shortName: string
  fifaCode: string | null
  countryCode: string | null
  flagUrl: string | null
  groupName: string | null
  primaryColor: string | null
  secondaryColor: string | null
}

export interface Match {
  id: string
  matchNumber: number | null
  stage: MatchStage
  groupName: string | null
  teamA: Team | null
  teamB: Team | null
  teamAPlaceholder: string | null
  teamBPlaceholder: string | null
  kickoffUtc: string
  venue: string | null
  city: string | null
  country: string | null
  status: MatchStatus
  fullTimeScoreA: number | null
  fullTimeScoreB: number | null
  wentToPenalties: boolean
  penaltyScoreA: number | null
  penaltyScoreB: number | null
  winnerTeamId: string | null
  externalMatchId: string | null
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Prediction {
  id: string
  userId: string
  matchId: string
  predictedScoreA: number
  predictedScoreB: number
  predictedOutcome: string | null
  predictedWinnerTeamId: string | null
  predictsPenalties: boolean
  predictedPenaltyScoreA: number | null
  predictedPenaltyScoreB: number | null
  firstSubmittedAt: string | null
  lastUpdatedAt: string | null
  lockedAt: string | null
  isLocked: boolean
  isValid: boolean
  isSubmitted: boolean // computed: firstSubmittedAt !== null
  // from prediction_scores join (optional):
  totalPoints?: number
  isExactScore?: boolean
  isCorrectOutcome?: boolean
  breakdown?: Record<string, number>
}

export interface LeaderboardEntry {
  userId: string
  profile: Pick<Profile, 'displayName' | 'flagCode' | 'avatarUrl'>
  totalPoints: number
  exactScoresCount: number
  correctOutcomesCount: number
  submissionsCount: number
  todayPoints: number
  rank: number | null
  snapshotAt: string
}

export interface UserStats {
  totalPoints: number
  rank: number | null
  matchesPredicted: number
  exactScores: number
  correctOutcomes: number
  todayPoints: number
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string | null
  isRead: boolean
  data: Record<string, unknown> | null
  createdAt: string
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
