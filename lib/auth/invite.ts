import type { User } from '@supabase/supabase-js'

export function hasInviteMetadata(user: User): boolean {
  const orgId = user.user_metadata?.organization_id
  return typeof orgId === 'string' && orgId.length > 0
}

export type MemberPlatformStatus = 'active' | 'pending'

export function getMemberPlatformStatus(user: User | null | undefined): MemberPlatformStatus {
  if (!user) return 'pending'
  if (user.user_metadata?.invite_completed === true) return 'active'
  if (user.user_metadata?.invite_completed === false) return 'pending'
  if (hasInviteMetadata(user)) {
    if (user.user_metadata?.invite_completed === undefined && user.last_sign_in_at) {
      return 'active'
    }
    return 'pending'
  }
  if (user.invited_at && !user.email_confirmed_at) return 'pending'
  return 'active'
}

/** @deprecated use getMemberPlatformStatus */
export function isInvitePendingForAdmin(user: User | null | undefined): boolean {
  return getMemberPlatformStatus(user) === 'pending'
}

export function isPendingInvite(user: User): boolean {
  if (!hasInviteMetadata(user)) return false
  return user.user_metadata?.invite_completed !== true
}

export function getPostAuthRedirect(user: User | null, next?: string | null): string {
  if (user && isPendingInvite(user)) return '/convite'
  return next ?? '/dashboard'
}
