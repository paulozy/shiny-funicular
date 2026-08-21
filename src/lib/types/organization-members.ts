import { UserRole } from '@/lib/types/auth'

export interface OrganizationMember {
  user_id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  joined_at: string
}

export interface MemberListResponse {
  items: OrganizationMember[]
  total: number
}

export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired'

export interface OrganizationInvite {
  id: string
  email: string
  role: UserRole
  status: InviteStatus
  expires_at: string
  created_at: string
  accepted_at?: string
  revoked_at?: string
}

export interface InviteListResponse {
  items: OrganizationInvite[]
  total: number
}

export interface CreateInviteRequest {
  email: string
  role?: UserRole
  ttl_hours?: number
}

/**
 * The API returns the plaintext token exactly once, on creation. It is never
 * recoverable afterwards, so the UI has to surface it immediately.
 */
export interface CreateInviteResult {
  invite: OrganizationInvite
  token: string
}
