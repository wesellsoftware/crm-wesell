'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Check } from 'lucide-react'

const DrawerSaveContext = createContext<(() => void) | null>(null)

export function useDrawerSaveNotify() {
  return useContext(DrawerSaveContext)
}

export function DrawerSaveProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const notifySaved = useCallback(() => {
    setTick(t => t + 1)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setTick(0), 2400)
  }, [])

  return (
    <DrawerSaveContext.Provider value={notifySaved}>
      <div className="relative flex flex-col flex-1 min-h-0">
        {tick > 0 && (
          <div
            key={tick}
            className="drawer-save-toast absolute bottom-3 left-0 right-0 z-20 flex justify-center pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-we-green/15 border border-we-green/25 text-we-green text-xs font-body shadow-lg backdrop-blur-md">
              <Check className="size-3.5 shrink-0" strokeWidth={2.5} />
              Salvo
            </div>
          </div>
        )}
        {children}
      </div>
    </DrawerSaveContext.Provider>
  )
}
