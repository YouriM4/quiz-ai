export interface Question {
  id: string
  question: string
  options: string[]
  correctIndex: number
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface LeaderboardEntry {
  id: string
  name: string
  score: number
  total: number
  percentage: number
  date: string
  timeSeconds: number
  maxStreak?: number
  usedJokers?: boolean
  skips?: number
}

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
}
