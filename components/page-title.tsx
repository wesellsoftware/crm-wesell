import { cn } from '@/lib/utils'

interface PageTitleProps {
  children: React.ReactNode
  className?: string
}

export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1
      className={cn(
        'font-display text-3xl leading-none text-we-paper',
        className
      )}
    >
      {children}
    </h1>
  )
}
