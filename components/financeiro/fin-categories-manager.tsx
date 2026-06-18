'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { createCategory, deleteCategory, updateCategory } from '@/app/actions/financeiro'
import type { FinCategory, FinTransactionType } from '@/lib/financeiro/types'
import { finInputCls } from './fin-input-styles'

interface FinCategoriesManagerProps {
  categories: FinCategory[]
  type: FinTransactionType
}

const inputCls = `w-full h-9 px-3 rounded-[8px] ${finInputCls} font-body text-sm`

export function FinCategoriesManager({ categories: initialCategories, type }: FinCategoriesManagerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [createState, createAction, createPending] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await createCategory(_, formData)
      if (result?.success) {
        router.refresh()
      }
      return result
    },
    undefined,
  )

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  return (
    <div className="space-y-4">
      <p className="font-body text-xs text-we-paper/35">
        Categorias de {type === 'receita' ? 'receita' : 'despesa'} usadas para classificar lançamentos e relatórios.
      </p>

      <div className="space-y-1.5">
        {categories.map(category => (
          <CategoryRow
            key={category.id}
            category={category}
            onDelete={() => setCategories(prev => prev.filter(c => c.id !== category.id))}
            onUpdate={name =>
              setCategories(prev => prev.map(c => (c.id === category.id ? { ...c, name } : c)))
            }
          />
        ))}
        {categories.length === 0 && (
          <p className="font-mono text-xs text-we-paper/25 py-6 text-center">
            Nenhuma categoria cadastrada. Crie a primeira abaixo.
          </p>
        )}
      </div>

      <form action={createAction} className="pt-4 border-t border-white/[0.07] space-y-3">
        <input type="hidden" name="type" value={type} />
        {createState?.error && (
          <p className="font-body text-xs text-we-red">{createState.error}</p>
        )}
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-body text-we-paper/45">Nova categoria</label>
            <input
              key={categories.length}
              name="name"
              type="text"
              required
              placeholder={type === 'receita' ? 'Ex: Licença / SaaS' : 'Ex: Ferramentas SaaS'}
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={createPending}
            className="h-9 px-4 rounded-[8px] bg-we-blue text-white font-body text-sm font-semibold hover:bg-we-blue-deep disabled:opacity-60 transition-colors flex items-center gap-2 shrink-0"
          >
            <Plus size={14} />
            {createPending ? 'Criando…' : 'Adicionar'}
          </button>
        </div>
      </form>
    </div>
  )
}

function CategoryRow({
  category,
  onDelete,
  onUpdate,
}: {
  category: FinCategory
  onDelete: () => void
  onUpdate: (name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const [deletePending, startDelete] = useTransition()
  const [savePending, startSave] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setEditName(category.name)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function cancelEdit() {
    setEditing(false)
    setEditName(category.name)
  }

  function saveEdit() {
    if (!editName.trim()) return
    onUpdate(editName.trim())
    setEditing(false)
    startSave(async () => {
      await updateCategory(category.id, editName.trim())
    })
  }

  function handleDelete() {
    onDelete()
    startDelete(async () => {
      await deleteCategory(category.id)
    })
  }

  const accentColor = category.type === 'receita' ? '#45F47F' : '#F45F5F'

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border glass border-transparent hover:border-white/[0.08] transition-colors">
      <span className="size-2.5 rounded-full shrink-0" style={{ background: accentColor }} />

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') cancelEdit()
          }}
          className="flex-1 h-8 px-2 rounded-[6px] glass-input text-we-paper/90 font-body text-sm focus:outline-none focus:ring-1 focus:ring-we-blue/60"
        />
      ) : (
        <span className="flex-1 font-body text-sm text-we-paper/80">{category.name}</span>
      )}

      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <button
              type="button"
              onClick={saveEdit}
              disabled={savePending || !editName.trim()}
              className="size-7 flex items-center justify-center rounded-[6px] text-we-green hover:bg-we-green/15 disabled:opacity-40 transition-colors"
              aria-label="Salvar"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="size-7 flex items-center justify-center rounded-[6px] text-we-paper/40 hover:bg-white/[0.06] transition-colors"
              aria-label="Cancelar"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={startEdit}
              className="size-7 flex items-center justify-center rounded-[6px] text-we-paper/25 hover:text-we-paper/60 hover:bg-white/[0.06] transition-colors"
              aria-label="Editar categoria"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              disabled={deletePending}
              onClick={handleDelete}
              className="size-7 flex items-center justify-center rounded-[6px] text-we-paper/25 hover:text-we-red hover:bg-we-red/10 disabled:opacity-40 transition-colors"
              aria-label="Excluir categoria"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
