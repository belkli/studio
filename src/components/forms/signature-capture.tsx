'use client';

import { useCallback, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import SignatureCanvas from 'react-signature-canvas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash, Check, AlertTriangle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignatureCaptureResult {
  /** Base-64 data URL (image/png) of the trimmed signature */
  dataUrl: string;
  /** SHA-256 hex digest of the dataUrl for audit trail integrity */
  signatureHash: string;
}

export interface SignatureCaptureProps {
  /** Called when the user confirms their signature */
  onConfirm: (result: SignatureCaptureResult) => void | Promise<void>;
  /** Called when the user cancels without signing */
  onCancel?: () => void;
  /** Optional SHA-256 of the form content for document-level integrity */
  documentHash?: string;
  /** Whether submission is in progress (disables buttons) */
  isSubmitting?: boolean;
  /** Override pen colour (defaults to black) */
  penColor?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute SHA-256 hex digest of an arbitrary string using the Web Crypto API.
 * Works in all modern browsers and in Node 18+.
 */
async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SignatureCapture({
  onConfirm,
  onCancel,
  isSubmitting = false,
  penColor = 'black',
}: SignatureCaptureProps) {
  const t = useTranslations('Signature');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const canvasRef = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleEnd = useCallback(() => {
    setIsEmpty(canvasRef.current?.isEmpty() ?? true);
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    canvasRef.current?.clear();
    setIsEmpty(true);
    setError(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (canvasRef.current?.isEmpty()) {
      setError(t('errorEmpty'));
      return;
    }

    const dataUrl = canvasRef.current!.getTrimmedCanvas().toDataURL('image/png');
    const signatureHash = await sha256(dataUrl);

    await onConfirm({ dataUrl, signatureHash });
  }, [onConfirm, t]);

  return (
    <Card dir={isRtl ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas wrapper */}
        <div
          className="relative w-full rounded-lg border-2 border-dashed bg-background focus-within:border-primary"
          style={{ aspectRatio: '3 / 1' }}
        >
          <SignatureCanvas
            ref={canvasRef}
            penColor={penColor}
            onEnd={handleEnd}
            canvasProps={{
              className: 'w-full h-full rounded-lg',
              role: 'img',
              'aria-label': t('canvasAriaLabel'),
              tabIndex: 0,
            }}
          />

          {/* Clear button — positioned in the logical start corner */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 start-2"
            onClick={handleClear}
            disabled={isEmpty || isSubmitting}
            aria-label={t('clear')}
          >
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {/* Validation error */}
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isEmpty || isSubmitting}
          >
            <Check className="me-2 h-4 w-4" />
            {t('confirm')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
