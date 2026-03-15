// src/components/color-mode-toggle.tsx
'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useColorMode, type ColorModePreference } from '@/hooks/use-color-mode'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const CYCLE: ColorModePreference[] = ['system', 'dark', 'light']

const ICON = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export function ColorModeToggle({ className }: { className?: string }) {
  const t = useTranslations('Common.shared')
  const { preference, setMode } = useColorMode()

  const next = CYCLE[(CYCLE.indexOf(preference) + 1) % CYCLE.length]
  const Icon = ICON[preference]

  const label = preference === 'light'
    ? t('colorModeLightLabel')
    : preference === 'dark'
      ? t('colorModeDarkLabel')
      : t('colorModeSystemLabel')

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn('h-9 w-9 cursor-pointer', className)}
      onClick={() => setMode(next)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}
