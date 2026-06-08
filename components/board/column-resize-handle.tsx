'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH } from '@/lib/boards/column-layout'

interface ColumnResizeHandleProps {
  onResize: (width: number) => void
  onResizeEnd: (width: number) => void
  minWidth?: number
  maxWidth?: number
}

export function ColumnResizeHandle({
  onResize,
  onResizeEnd,
  minWidth = MIN_COLUMN_WIDTH,
  maxWidth = MAX_COLUMN_WIDTH,
}: ColumnResizeHandleProps) {
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const th = (e.target as HTMLElement).closest('th')
    if (!th) return
    startX.current = e.clientX
    startWidth.current = th.offsetWidth
    setDragging(true)
  }, [])

  useEffect(() => {
    if (!dragging) return

    function clampWidth(width: number) {
      return Math.min(maxWidth, Math.max(minWidth, width))
    }

    function handleMouseMove(e: MouseEvent) {
      onResize(clampWidth(startWidth.current + (e.clientX - startX.current)))
    }

    function handleMouseUp(e: MouseEvent) {
      onResizeEnd(clampWidth(startWidth.current + (e.clientX - startX.current)))
      setDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, maxWidth, minWidth, onResize, onResizeEnd])

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionar coluna"
      onMouseDown={handleMouseDown}
      className={cn(
        'absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-10 touch-none',
        'hover:bg-we-blue/40 active:bg-we-blue/60',
        dragging && 'bg-we-blue/60'
      )}
    />
  )
}
