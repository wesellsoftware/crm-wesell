'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isRichTextEmpty, sanitizeRichText } from '@/lib/rich-text/sanitize'
import { uploadActivityImage } from '@/app/actions/board-item-activities'

interface RichTextEditorProps {
  itemId: string
  initialHtml?: string
  placeholder?: string
  submitLabel?: string
  onSubmit: (html: string) => void | Promise<void>
  onCancel?: () => void
  disabled?: boolean
  autoFocus?: boolean
}

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-md text-we-paper/45 hover:text-we-paper/75 hover:bg-white/[0.06] transition-colors',
        active && 'bg-white/[0.08] text-we-paper/85'
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  itemId,
  initialHtml = '',
  placeholder = 'Adicionar comentário...',
  submitLabel = 'Comentar',
  onSubmit,
  onCancel,
  disabled,
  autoFocus,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (editorRef.current && initialHtml) {
      editorRef.current.innerHTML = initialHtml
    }
  }, [initialHtml])

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus()
    }
  }, [autoFocus])

  const exec = useCallback((command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
  }, [])

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('itemId', itemId)

    const result = await uploadActivityImage(formData)
    setUploading(false)

    if (result.url) {
      exec('insertImage', result.url)
    }
  }

  async function handleSubmit() {
    const raw = editorRef.current?.innerHTML ?? ''
    const html = sanitizeRichText(raw)
    if (isRichTextEmpty(html)) return

    setIsSubmitting(true)
    try {
      await onSubmit(html)
      if (editorRef.current) editorRef.current.innerHTML = ''
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={cn(
          'min-h-[88px] max-h-40 overflow-y-auto px-3 py-2.5 outline-none font-body text-sm text-we-paper',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-we-paper/30',
          '[&_img]:max-w-full [&_img]:rounded-md [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5'
        )}
      />

      <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-0.5">
          <ToolbarButton onClick={() => exec('bold')} title="Negrito">
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('italic')} title="Itálico">
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('underline')} title="Sublinhado">
            <Underline size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('strikeThrough')} title="Tachado">
            <Strikethrough size={14} />
          </ToolbarButton>

          <span className="w-px h-4 bg-white/[0.08] mx-0.5" />

          <ToolbarButton onClick={() => exec('justifyLeft')} title="Alinhar à esquerda">
            <AlignLeft size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('justifyCenter')} title="Centralizar">
            <AlignCenter size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('justifyRight')} title="Alinhar à direita">
            <AlignRight size={14} />
          </ToolbarButton>

          <span className="w-px h-4 bg-white/[0.08] mx-0.5" />

          <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Lista com marcadores">
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('insertOrderedList')} title="Lista numerada">
            <ListOrdered size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('indent')} title="Aumentar recuo">
            <IndentIncrease size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('outdent')} title="Diminuir recuo">
            <IndentDecrease size={14} />
          </ToolbarButton>

          <span className="w-px h-4 bg-white/[0.08] mx-0.5" />

          <ToolbarButton onClick={() => exec('formatBlock', 'pre')} title="Bloco de código">
            <Code size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            title="Inserir imagem"
          >
            <ImagePlus size={14} className={uploading ? 'animate-pulse' : ''} />
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={disabled || isSubmitting || uploading}
          >
            {isSubmitting ? 'Salvando...' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
