"use client"

import { useEffect, useState } from "react"

const CONSENT_STORAGE_KEY = "mjs-cookie"
const CONSENT_EXPIRY_DAYS = 365

export interface ConsentPreferences {
  analytics: boolean
  timestamp: number
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentPreferences | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load consent from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const expiryTime = parsed.timestamp + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000

        // Check if consent has expired
        if (Date.now() < expiryTime) {
          setConsent(parsed)
        } else {
          localStorage.removeItem(CONSENT_STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error("Failed to load consent preferences:", error)
    }
    setIsLoaded(true)
  }, [])

  const saveConsent = (preferences: Omit<ConsentPreferences, "timestamp">) => {
    const consentData: ConsentPreferences = {
      ...preferences,
      timestamp: Date.now(),
    }
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData))
    setConsent(consentData)
  }

  const clearConsent = () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY)
    setConsent(null)
  }

  return {
    consent,
    isLoaded,
    saveConsent,
    clearConsent,
    hasConsent: consent !== null,
    analyticsConsent: consent?.analytics ?? false,
  }
}
