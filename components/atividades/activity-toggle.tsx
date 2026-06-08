'use client'

import { useTransition } from 'react'
import { completeActivity, uncompleteActivity } from '@/app/actions/activities'
import { CheckCircle2, Circle } from 'lucide-react'

interface ActivityToggleProps {
  id: string
  completed: boolean
}

export function ActivityToggle({ id, completed }: ActivityToggleProps) {
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(() => {
      if (completed) uncompleteActivity(id)
      else completeActivity(id)
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="shrink-0 text-we-paper/30 hover:text-we-green disabled:opacity-50 transition-colors"
      aria-label={completed ? 'Marcar como pendente' : 'Marcar como concluída'}
    >
      {completed
        ? <CheckCircle2 size={18} className="text-we-green" />
        : <Circle size={18} />
      }
    </button>
  )
}
