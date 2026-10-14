import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const dismissedKey = 'kombine-install-dismissed'

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    window.dispatchEvent(new Event('kombine:installable'))
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    window.dispatchEvent(new Event('kombine:installable'))
  })
}

export function useInstall() {
  const [canInstall, setCanInstall] = useState(Boolean(deferred))
  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true,
  )
  const [dismissed, setDismissed] = useState(localStorage.getItem(dismissedKey) === '1')

  useEffect(() => {
    const update = () => setCanInstall(Boolean(deferred))
    window.addEventListener('kombine:installable', update)
    return () => window.removeEventListener('kombine:installable', update)
  }, [])

  const promptInstall = async () => {
    if (!deferred) return false
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') {
      setInstalled(true)
    }
    deferred = null
    setCanInstall(false)
    return choice.outcome === 'accepted'
  }

  const dismiss = () => {
    localStorage.setItem(dismissedKey, '1')
    setDismissed(true)
  }

  return { canInstall: canInstall && !installed && !dismissed, installed, promptInstall, dismiss }
}
