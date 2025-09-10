"use client"

import { cn } from '@mjs/ui/lib/utils'
import { useEffect, useState } from "react"


interface TimerProgressProps {
  className?: string
  size?: number
  strokeWidth?: number
  onReset?: () => void
  direction?: "countdown" | "countup"
}

export function TimerProgress({ className, size = 32, strokeWidth = 2, onReset, direction = "countdown" }: TimerProgressProps) {
  const [timeLeft, setTimeLeft] = useState(60)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (direction === "countdown") {
          if (prev <= 1) {
            onReset?.()
            return 60 // Reset to 60 when it reaches 0
          }
          return prev - 1
        } else {
          if (prev >= 59) {
            onReset?.()
            return 0 // Reset to 0 when it reaches 60
          }
          return prev + 1
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [direction])

  const progress =
    direction === "countdown"
      ? (timeLeft / 60) * 100 // Full to empty
      : ((60 - timeLeft) / 60) * 100 // Empty to full

  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2)
  const strokeDashoffset = circumference - (progress / 100) * circumference


  return (
    <div className={cn("relative inline-flex items-center justify-center cursor-default", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
          strokeLinecap="round"
        />
      </svg>
      {/* Timer text */}
      <span className="absolute text-xs font-medium tabular-nums">{timeLeft}</span>
    </div>
  )
}
