'use client'

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export const cellPopoverOptionClass =
  'w-full text-left px-2.5 py-1.5 rounded-md text-xs font-body whitespace-nowrap mb-0.5 last:mb-0'

export const cellPopoverMenuClass =
  'fixed z-50 glass-dark rounded-lg p-1.5 shadow-xl border border-white/10 inline-grid grid-cols-1 w-max'

interface CellPopoverProps {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  children: ReactNode
  className?: string
  maxHeight?: number
}

function computePosition(
  anchor: HTMLElement,
  popover: HTMLElement | null,
) {
  const rect = anchor.getBoundingClientRect()
  const gap = 4
  const padding = 8
  const popoverWidth = popover?.offsetWidth ?? 0
  const popoverHeight = popover?.offsetHeight ?? 0
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  let top = rect.bottom + gap
  let left = rect.left

  if (popoverHeight > 0 && top + popoverHeight > viewportHeight - padding) {
    const above = rect.top - popoverHeight - gap
    if (above >= padding) top = above
  }

  if (left + popoverWidth > viewportWidth - padding) {
    left = viewportWidth - popoverWidth - padding
  }
  if (left < padding) left = padding

  return { top, left }
}

export function CellPopover({
  open,
  onClose,
  anchorRef,
  children,
  className,
  maxHeight,
}: CellPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPosition(null)
      return
    }

    function updatePosition() {
      const anchor = anchorRef.current
      if (!anchor) return
      setPosition(computePosition(anchor, popoverRef.current))
    }

    updatePosition()

    const observer = new ResizeObserver(updatePosition)
    if (popoverRef.current) observer.observe(popoverRef.current)

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, anchorRef, children])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div
        ref={popoverRef}
        className={cn(
          cellPopoverMenuClass,
          maxHeight && 'overflow-y-auto',
          !position && 'invisible',
          className
        )}
        style={{
          top: position?.top ?? 0,
          left: position?.left ?? 0,
          maxHeight,
        }}
      >
        {children}
      </div>
    </>,
    document.body
  )
}
