'use client';

/**
 * @fileoverview Installment payment selector for Israeli parents.
 * SDD-P4 (Parent) specifies installment support (תשלומים)
 * which is standard in the Israeli market.
 * Options: 1, 3, 6, 10, or 12 payments.
 */

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { InstallmentOption } from '@/lib/types';

interface InstallmentSelectorProps {
    totalAmount: number;
    options: InstallmentOption[];
    selectedCount: number;
    onSelect: (option: InstallmentOption) => void;
    currency?: string;
    disabled?: boolean;
}

function formatCurrency(amount: number, currency = '₪'): string {
    return `${currency}${amount.toLocaleString()}`;
}

export function InstallmentSelector({
    totalAmount,
    options,
    selectedCount,
    onSelect,
    currency = '₪',
    disabled = false,
}: InstallmentSelectorProps) {
    const t = useTranslations('InstallmentSelector');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const dir = isRtl ? 'rtl' : 'ltr';

    return (
        <div className="space-y-3" dir={dir}>
            <label className="block text-sm font-medium text-foreground">
                {t('selectPayments')}
            </label>
            <div className="grid grid-cols-5 gap-2">
                {options.map((option) => {
                    const isSelected = option.count === selectedCount;
                    return (
                        <button
                            key={option.count}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelect(option)}
                            className={`
                relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200
                ${isSelected
                                    ? 'border-primary bg-primary/5 shadow-md scale-105'
                                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
                        >
                            <span className={`text-lg font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {option.count}
                            </span>
                            <span className="text-xs text-muted-foreground mt-0.5">
                                {option.count === 1 ? t('payment') : t('payments')}
                            </span>
                            <span className={`text-sm font-medium mt-1 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {formatCurrency(option.monthlyAmount, currency)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {t('perMonth')}
                            </span>
                            {isSelected && (
                                <div className="absolute -top-1 -end-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border text-sm">
                <span className="text-muted-foreground">{t('totalToPay')}</span>
                <span className="font-bold text-foreground">{formatCurrency(totalAmount, currency)}</span>
            </div>
            {selectedCount > 1 && (
                <p className="text-xs text-muted-foreground text-center">
                    {t('noInterest')}
                </p>
            )}
        </div>
    );
}
