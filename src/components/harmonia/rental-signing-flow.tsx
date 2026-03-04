'use client';

import { useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import SignatureCanvas from 'react-signature-canvas';

import { useAuth } from '@/hooks/use-auth';
import type { InstrumentRental } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const modelKeyByValue = {
  deposit: 'modelDeposit',
  monthly: 'modelMonthly',
  rent_to_own: 'modelRentToOwn',
} as const;

export function RentalSigningFlow({ rental, token }: { rental: InstrumentRental; token: string }) {
  const { confirmRentalSignature, users, mockInstrumentInventory } = useAuth();
  const t = useTranslations('InstrumentRental');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [confirmOnly, setConfirmOnly] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sigRef = useRef<SignatureCanvas | null>(null);

  const parent = useMemo(() => users.find((entry) => entry.id === rental.parentId), [users, rental.parentId]);
  const student = useMemo(() => users.find((entry) => entry.id === rental.studentId), [users, rental.studentId]);
  const instrument = useMemo(() => mockInstrumentInventory.find((entry) => entry.id === rental.instrumentId), [mockInstrumentInventory, rental.instrumentId]);

  const sendOtp = () => {
    setOtpSent(true);
    setOtpError(null);
  };

  const verifyOtp = () => {
    if (otpCode.trim() !== '123456') {
      setOtpError(t('otpInvalid'));
      return;
    }
    setOtpError(null);
    setStep(2);
  };

  const submitSignature = () => {
    const isEmpty = sigRef.current?.isEmpty() ?? true;
    if (isEmpty && !confirmOnly) {
      setSubmitError(t('signatureRequired'));
      return;
    }

    const signatureUrl = isEmpty
      ? `manual-confirm://${Date.now()}`
      : (sigRef.current?.getTrimmedCanvas().toDataURL('image/png') || `manual-confirm://${Date.now()}`);

    const result = confirmRentalSignature(token, signatureUrl);
    if (!result.success) {
      setSubmitError(t('tokenExpired'));
      return;
    }

    setSubmitError(null);
    setStep(4);
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="mx-auto w-full max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-start">{t('signingPageTitle')}</CardTitle>
          <CardDescription className="text-start">{t('signingPageDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={step >= 1 ? 'default' : 'secondary'}>1</Badge>
            <Badge variant={step >= 2 ? 'default' : 'secondary'}>2</Badge>
            <Badge variant={step >= 3 ? 'default' : 'secondary'}>3</Badge>
            <Badge variant={step >= 4 ? 'default' : 'secondary'}>4</Badge>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-start">
                {t('otpStepDesc', { phone: parent?.phone || t('unknown') })}
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <Button type="button" onClick={sendOtp}>{otpSent ? t('otpResend') : t('otpSend')}</Button>
                <div className="min-w-[220px] flex-1 space-y-2">
                  <Label htmlFor="otp">{t('otpLabel')}</Label>
                  <Input id="otp" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" inputMode="numeric" />
                </div>
                <Button type="button" variant="outline" onClick={verifyOtp} disabled={!otpSent}>{t('otpVerify')}</Button>
              </div>
              {otpError && <p className="text-sm text-destructive text-start">{otpError}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-start">{t('termsTitle')}</h2>
              <ul className="space-y-2 text-sm text-start">
                <li>{t('instrumentType')}: {instrument?.type || t('unknown')}</li>
                <li>{t('rentedTo')}: {student?.name || t('unknown')}</li>
                <li>{t('rentalModel')}: {t(modelKeyByValue[rental.rentalModel])}</li>
                {rental.depositAmountILS ? <li>{t('depositAmount')}: {rental.depositAmountILS}</li> : null}
                {rental.monthlyFeeILS ? <li>{t('monthlyFee')}: {rental.monthlyFeeILS}</li> : null}
                {rental.purchasePriceILS ? <li>{t('purchasePrice')}: {rental.purchasePriceILS}</li> : null}
                {rental.monthsUntilPurchaseEligible ? <li>{t('monthsUntilPurchase')}: {rental.monthsUntilPurchaseEligible}</li> : null}
                <li>{t('startDate')}: {rental.startDate}</li>
                {rental.expectedReturnDate ? <li>{t('expectedReturnDate')}: {rental.expectedReturnDate}</li> : null}
                <li>{t('damagePolicy')}</li>
              </ul>
              <Button type="button" onClick={() => setStep(3)}>{t('continueToSignature')}</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-start">{t('signatureTitle')}</h2>
              <div className="rounded-md border bg-background p-2">
                <SignatureCanvas
                  ref={(ref) => {
                    sigRef.current = ref;
                  }}
                  penColor="black"
                  canvasProps={{ className: 'h-44 w-full rounded-md border bg-white' }}
                />
                <div className="mt-2 flex gap-2">
                  <Button type="button" variant="outline" onClick={() => sigRef.current?.clear()}>{t('clearSignature')}</Button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={confirmOnly} onChange={(e) => setConfirmOnly(e.target.checked)} />
                <span>{t('confirmAndAgree')}</span>
              </label>
              {submitError && <p className="text-sm text-destructive text-start">{submitError}</p>}
              <Button type="button" onClick={submitSignature}>{t('submitSignature')}</Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2">
              <h2 className="font-semibold text-start">{t('signatureCompleteTitle')}</h2>
              <p className="text-sm text-muted-foreground text-start">{t('signatureCompleteDesc')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}