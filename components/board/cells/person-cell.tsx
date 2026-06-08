'use client'

import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrgMember } from '@/lib/boards/types'
import { AvatarGroup } from '@/components/ui/avatar'
import { CellPopover, cellPopoverOptionClass } from './cell-popover'
import { MemberAvatar } from './member-avatar'

interface PersonCellProps {
  value: string[]
  members: OrgMember[]
  onChange: (userIds: string[]) => void
}

export function PersonCell({ value, members, onChange }: PersonCellProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selected = members.filter(m => value.includes(m.id))

  return (
    <div className="flex items-center gap-1 flex-wrap min-h-[28px]">
      {selected.length > 0 && (
        <AvatarGroup className="*:data-[slot=avatar]:ring-we-ink/80">
          {selected.map(m => (
            <MemberAvatar
              key={m.id}
              member={m}
              size="sm"
              title={m.full_name ?? ''}
            />
          ))}
        </AvatarGroup>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/[0.05] transition-colors',
          selected.length === 0 ? 'text-we-paper/25' : 'text-we-paper/40'
        )}
        title={selected.length === 0 ? 'Adicionar responsável' : 'Adicionar outro responsável'}
      >
        {selected.length === 0 ? (
          <span className="text-xs">+</span>
        ) : (
          <Plus size={12} />
        )}
      </button>
      <CellPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        maxHeight={220}
        className="glass-scrollbar"
      >
        {members.map(m => {
          const isSelected = value.includes(m.id)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                const next = isSelected
                  ? value.filter(id => id !== m.id)
                  : [...value, m.id]
                onChange(next)
              }}
              className={cn(
                cellPopoverOptionClass,
                'flex items-center gap-2 transition-colors',
                isSelected ? 'bg-we-blue/20 text-we-paper' : 'text-we-paper/60 hover:bg-white/[0.05]'
              )}
            >
              <MemberAvatar member={m} size="sm" />
              <span>{m.full_name ?? 'Sem nome'}</span>
              {isSelected && (
                <span className="text-[10px] text-we-blue shrink-0">✓</span>
              )}
            </button>
          )
        })}
        {members.length === 0 && (
          <p className="px-2.5 py-1.5 text-xs text-we-paper/30 font-body">Nenhum membro</p>
        )}
      </CellPopover>
    </div>
  )
}
