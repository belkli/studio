'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useBrandTheme } from '@/components/brand-theme-provider'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { updateBrandPreferenceAction } from '@/app/actions/user-preferences'
import type { BrandId } from '@/lib/themes/active-theme'

function BrandIcon({ displayBrand }: { displayBrand: BrandId }) {
  return (
    <svg
      width="18"
      height="10"
      viewBox="0 0 18 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Indigo circle — left */}
      <circle
        cx="5"
        cy="5"
        r="4.5"
        fill="#6366f1"
        opacity={displayBrand === 'indigo' ? 1 : 0.35}
      />
      {/* Gold circle — right */}
      <circle
        cx="13"
        cy="5"
        r="4.5"
        fill="#C9A84C"
        opacity={displayBrand === 'gold' ? 1 : 0.35}
      />
    </svg>
  )
}

export function BrandToggle({ className }: { className?: string }) {
  const t = useTranslations('Common.shared')
  const { brand } = useBrandTheme()
  const router = useRouter()
  const [optimisticBrand, setOptimisticBrand] = useState<BrandId | null>(null)

  // Reset optimistic state once server re-render propagates the new brand through context
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOptimisticBrand(null)
  }, [brand])

  const displayBrand = optimisticBrand ?? brand
  const next: BrandId = displayBrand === 'indigo' ? 'gold' : 'indigo'
  const label = displayBrand === 'indigo' ? t('brandIndigoLabel') : t('brandGoldLabel')

  const handleClick = async () => {
    setOptimisticBrand(next)
    await updateBrandPreferenceAction({ brand: next })
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn('h-9 w-9 cursor-pointer', className)}
      onClick={handleClick}
    >
      <BrandIcon displayBrand={displayBrand} />
    </Button>
  )
}
