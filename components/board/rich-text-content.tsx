'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { sanitizeRichText } from '@/lib/rich-text/sanitize'

interface RichTextContentProps {
  html: string
  className?: string
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const safeHtml = useMemo(() => sanitizeRichText(html), [html])

  if (!safeHtml) return null

  return (
    <div
      className={cn(
        'rich-text-content font-body text-sm text-we-paper/85 [&_img]:max-w-full [&_img]:rounded-md [&_img]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:bg-white/[0.06] [&_pre]:rounded-md [&_pre]:p-2 [&_pre]:text-xs [&_code]:font-mono',
        className
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
