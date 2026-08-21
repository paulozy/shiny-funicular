export type TeamRole = 'member' | 'lead'
export type TeamSource = 'local' | 'github'

export interface Team {
  id: string
  name: string
  slug: string
  description?: string
  source: TeamSource
  member_count: number
  repository_count: number
  created_at: string
}

export interface TeamListResponse {
  items: Team[]
  total: number
}

export interface TeamMember {
  user_id: string
  email: string
  full_name: string
  role: TeamRole
}

export interface TeamMemberListResponse {
  items: TeamMember[]
  total: number
}

export interface CreateTeamRequest {
  name: string
  description?: string
}

/** The owner summary embedded in repository payloads. */
export interface TeamRef {
  id: string
  name: string
  slug: string
}
