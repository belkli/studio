'use client';

/**
 * @fileoverview Reusable PDPPA consent checkboxes component for the Lyriosa registration flow.
 *
 * Renders three consent checkboxes per Israeli Standard IS 5568 for accessibility:
 * - Data processing consent (mandatory) — wording adapts when isMinor=true
 * - Terms of service (mandatory)
 * - Marketing communications (optional)
 * - Video recording consent (optional, shown when isMinor=true)
 *
 * Must be used inside a react-hook-form <FormProvider> or receive `control` directly.
 */

import { Controller, type Control } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

// ── Types ──────────────────────────────────────────────────────────────────

export type ConsentFormValues = {
  consentDataProcessing: boolean;
  consentTerms: boolean;
  consentMarketing: boolean;
  consentVideoRecording?: boolean;
};

interface ConsentCheckboxesProps {
  control: Control<ConsentFormValues>;
  customTerms?: string;
  /** When true, shows parental consent wording and VIDEO_RECORDING checkbox */
  isMinor?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ConsentCheckboxes({ control, customTerms, isMinor = false }: ConsentCheckboxesProps) {
  const t = useTranslations('Consent');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const dataProcessingLabel = isMinor
    ? t('dataProcessingLabelMinor')
    : t('dataProcessingLabel');

  type ConsentField = {
    name: keyof ConsentFormValues;
    label: string;
    required: boolean;
  };

  const CONSENT_FIELDS: ConsentField[] = [
    { name: 'consentDataProcessing', label: dataProcessingLabel, required: true },
    { name: 'consentTerms', label: t('termsLabel'), required: true },
    { name: 'consentMarketing', label: t('marketingLabel'), required: false },
    ...(isMinor
      ? [{ name: 'consentVideoRecording' as const, label: t('videoRecordingLabel'), required: false }]
      : []),
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      role="group"
      aria-label={t('groupLabel')}
      className="space-y-4"
    >
      {CONSENT_FIELDS.map(({ name, label, required }) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => {
            const checkboxId = `consent-${name}`;
            return (
              <div className="flex items-start gap-3">
                <Checkbox
                  id={checkboxId}
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  aria-required={required ? 'true' : 'false'}
                  aria-invalid={fieldState.error ? 'true' : 'false'}
                  aria-describedby={
                    fieldState.error ? `${checkboxId}-error` : undefined
                  }
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor={checkboxId}
                    className="text-sm font-normal leading-relaxed cursor-pointer select-none"
                  >
                    {label}
                    {required && (
                      <span
                        className="text-destructive me-1"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    )}
                  </label>
                  {fieldState.error && (
                    <p
                      id={`${checkboxId}-error`}
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              </div>
            );
          }}
        />
      ))}
      {customTerms && (
        <div className="border rounded-md p-3 text-sm text-muted-foreground leading-relaxed">
          <p className="font-medium mb-1">{t('customTermsTitle')}</p>
          <p>{customTerms}</p>
        </div>
      )}
    </div>
  );
}
