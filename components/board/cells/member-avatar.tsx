'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { OrgMember } from '@/lib/boards/types'
import { cn } from '@/lib/utils'

interface MemberAvatarProps {
  member: Pick<OrgMember, 'full_name' | 'avatar_url'>
  size?: 'sm' | 'default' | 'lg'
  className?: string
  title?: string
}

export function MemberAvatar({ member, size = 'sm', className, title }: MemberAvatarProps) {
  const initials = (member.full_name ?? '?').charAt(0).toUpperCase()

  return (
    <Avatar size={size} className={cn('bg-we-blue/30', className)} title={title}>
      {member.avatar_url ? (
        <AvatarImage src={member.avatar_url} alt={member.full_name ?? ''} />
      ) : null}
      <AvatarFallback className="bg-we-blue/30 text-we-blue font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
