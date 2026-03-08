'use client';

import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface RegistrationAgreementProps {
  customAddendum?: string;
  mode?: 'enrollment' | 'admin-preview';
  vatRate?: number;       // percentage integer, e.g. 18. Default: 18
  maxMakeups?: number;    // e.g. 3. Default: 3
}

const SECTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function RegistrationAgreement({ customAddendum, mode = 'enrollment', vatRate = 18, maxMakeups = 3 }: RegistrationAgreementProps) {
  const t = useTranslations('EnrollmentWizard');
  const params = { vatRate, maxMakeups };

  return (
    <Accordion type="multiple" className="w-full rounded-md border">
      {SECTIONS.map((n) => (
        <AccordionItem key={n} value={`s${n}`}>
          <AccordionTrigger className="px-4 text-sm font-medium">
            {t(`contract.s${n}Title` as Parameters<typeof t>[0])}
          </AccordionTrigger>
          <AccordionContent className="px-4 text-sm text-muted-foreground leading-relaxed">
            {t(`contract.s${n}Body` as Parameters<typeof t>[0], params as Record<string, string | number>)}
          </AccordionContent>
        </AccordionItem>
      ))}
      {mode === 'enrollment' && (
        <AccordionItem value="s10">
          <AccordionTrigger className="px-4 text-sm font-medium">
            {t('contract.s10Title')}
          </AccordionTrigger>
          <AccordionContent className="px-4 text-sm text-muted-foreground leading-relaxed">
            {customAddendum || t('contract.s10BodyDefault')}
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
