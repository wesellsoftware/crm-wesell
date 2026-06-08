'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import type { BoardColumn, BoardItemValue, CellValue, ColumnSettings, OrgMember, RelatedItem } from '@/lib/boards/types'
import { TextCell } from './text-cell'
import { StatusCell } from './status-cell'
import { PersonCell } from './person-cell'
import { DateCell } from './date-cell'
import { TimelineCell } from './timeline-cell'
import { CurrencyCell } from './currency-cell'
import { NumberCell } from './number-cell'
import { EmailCell } from './email-cell'
import { PhoneCell } from './phone-cell'
import { UrlCell } from './url-cell'
import { TagsCell } from './tags-cell'
import { RelationCell } from './relation-cell'
import { fireConfettiSideCannons } from '@/lib/confetti-side-cannons'
import { isWonGroupName } from '@/lib/boards/won-group'

interface CellRendererProps {
  column: BoardColumn
  itemId: string
  value: CellValue | undefined
  slug: string
  members: OrgMember[]
  relatedItems: RelatedItem[]
  onUpdate: (itemId: string, columnId: string, value: CellValue) => void
}

export function CellRenderer({
  column,
  itemId,
  value,
  slug,
  members,
  relatedItems,
  onUpdate,
}: CellRendererProps) {
  const [, startTransition] = useTransition()

  function handleChange(newValue: CellValue) {
    onUpdate(itemId, column.id, newValue)
    startTransition(async () => {
      const { upsertItemValue } = await import('@/app/actions/boards')
      await upsertItemValue(itemId, column.id, newValue, slug)
    })
  }

  const settings = column.settings as ColumnSettings

  switch (column.type) {
    case 'text':
      return (
        <TextCell
          value={(value as { text?: string })?.text ?? ''}
          onChange={v => handleChange({ text: v })}
        />
      )
    case 'status': {
      const currentOptionId = (value as { option_id?: string })?.option_id
      const isEtapaColumn = column.name === 'Etapa' && slug === 'negociacoes'
      return (
        <StatusCell
          value={currentOptionId}
          options={settings.options ?? []}
          onChange={optionId => {
            const option = (settings.options ?? []).find(o => o.id === optionId)
            if (
              option &&
              isWonGroupName(option.label) &&
              currentOptionId !== optionId
            ) {
              fireConfettiSideCannons()
            }
            onUpdate(itemId, column.id, { option_id: optionId })
            startTransition(async () => {
              if (isEtapaColumn) {
                const { updateDealEtapa } = await import('@/app/actions/boards')
                await updateDealEtapa(itemId, optionId, slug)
              } else {
                const { upsertItemValue } = await import('@/app/actions/boards')
                await upsertItemValue(itemId, column.id, { option_id: optionId }, slug)
              }
            })
          }}
        />
      )
    }
    case 'person':
      return (
        <PersonCell
          value={(value as { user_ids?: string[] })?.user_ids ?? []}
          members={members}
          onChange={userIds => handleChange({ user_ids: userIds })}
        />
      )
    case 'date':
      return (
        <DateCell
          value={(value as { date?: string })?.date ?? ''}
          onChange={date => handleChange({ date })}
        />
      )
    case 'timeline':
      return (
        <TimelineCell
          start={(value as { start?: string })?.start ?? ''}
          end={(value as { end?: string })?.end ?? ''}
          onChange={(start, end) => handleChange({ start, end })}
        />
      )
    case 'number':
      return (
        <NumberCell
          value={(value as { number?: number })?.number ?? 0}
          onChange={n => handleChange({ number: n })}
        />
      )
    case 'currency':
      return (
        <CurrencyCell
          value={(value as { amount?: number })?.amount ?? 0}
          currency={settings.currency ?? 'BRL'}
          onChange={amount => handleChange({ amount, currency: settings.currency ?? 'BRL' })}
        />
      )
    case 'email':
      return (
        <EmailCell
          value={(value as { value?: string })?.value ?? ''}
          onChange={v => handleChange({ value: v })}
        />
      )
    case 'phone':
      return (
        <PhoneCell
          value={(value as { value?: string })?.value ?? ''}
          onChange={v => handleChange({ value: v })}
        />
      )
    case 'url':
      return (
        <UrlCell
          value={(value as { value?: string })?.value ?? ''}
          onChange={v => handleChange({ value: v })}
        />
      )
    case 'tags':
      return (
        <TagsCell
          value={(value as { option_ids?: string[] })?.option_ids ?? []}
          options={settings.options ?? []}
          onChange={optionIds => handleChange({ option_ids: optionIds })}
        />
      )
    case 'relation':
      return (
        <RelationCell
          value={(value as { item_ids?: string[] })?.item_ids ?? []}
          relatedItems={relatedItems}
          targetBoardSlug={settings.target_board_slug ?? ''}
          slug={slug}
          onChange={itemIds => handleChange({ item_ids: itemIds })}
        />
      )
    default:
      return <span className="text-we-paper/30 text-xs">—</span>
  }
}

export function getItemValue(
  values: BoardItemValue[],
  itemId: string,
  columnId: string
): CellValue | undefined {
  return values.find(v => v.item_id === itemId && v.column_id === columnId)?.value
}
