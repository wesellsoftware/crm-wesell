"use client"

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react"
import { animate, useInView, useMotionValue } from "motion/react"

import { cn } from "@/lib/utils"

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
  locale?: string
  duration?: number
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  locale = "pt-BR",
  duration = 1,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : startValue)
  const isInView = useInView(ref, { once: true, margin: "0px" })

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat(locale, {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(Number(latest.toFixed(decimalPlaces)))
      }
    })

    return unsubscribe
  }, [motionValue, decimalPlaces, locale])

  useEffect(() => {
    if (!isInView) return

    const target = direction === "down" ? startValue : value
    let controls: { stop: () => void } | undefined

    const timer = setTimeout(() => {
      controls = animate(motionValue, target, {
        duration,
        ease: "easeOut",
      })
    }, delay * 1000)

    return () => {
      clearTimeout(timer)
      controls?.stop()
    }
  }, [motionValue, isInView, delay, value, direction, startValue, duration])

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tracking-wider tabular-nums text-black dark:text-white",
        className
      )}
      {...props}
    >
      {startValue}
    </span>
  )
}
