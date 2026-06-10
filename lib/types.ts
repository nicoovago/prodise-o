export interface Match {
  id: string
  home_team: string
  away_team: string
  home_flag: string
  away_flag: string
  match_date: string
  stage: string
  group_label: string | null
  home_score: number | null
  away_score: number | null
  finished: boolean
  sort_order: number
}

export interface Group {
  id: string
  name: string
  code: string
  created_by: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  display_name: string
  joined_at: string
}

export interface Prediction {
  id: string
  user_id: string
  group_id: string
  match_id: string
  home_score: number
  away_score: number
  points: number
  updated_at: string
}

export interface LeaderboardEntry {
  user_id: string
  display_name: string
  total_points: number
  exact_results: number
  correct_results: number
}
