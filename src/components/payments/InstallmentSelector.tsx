'use client';

/**
 * @fileoverview Installment payment selector for Israeli parents.
 * SDD-P4 (Parent) specifies installment support (תשלומים)
 * which is standard in the Israeli market.
 * Options: 1, 3, 6, 10, or 12 payments.
 */

import React from 'react';
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
    return `${currency}${amount.toLocaleString('he-IL')}`;
}

export function InstallmentSelector({
    totalAmount,
    options,
    selectedCount,
    onSelect,
    currency = '₪',
    disabled = false,
}: InstallmentSelectorProps) {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground" dir="rtl">
                בחר מספר תשלומים
            </label>
            <div className="grid grid-cols-5 gap-2" dir="rtl">
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
                                {option.count === 1 ? 'תשלום' : 'תשלומים'}
                            </span>
                            <span className={`text-sm font-medium mt-1 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {formatCurrency(option.monthlyAmount, currency)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                /חודש
                            </span>
                            {isSelected && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border text-sm" dir="rtl">
                <span className="text-muted-foreground">סה"כ לתשלום:</span>
                <span className="font-bold text-foreground">{formatCurrency(totalAmount, currency)}</span>
            </div>
            {selectedCount > 1 && (
                <p className="text-xs text-muted-foreground text-center" dir="rtl">
                    ללא ריבית · חיוב אוטומטי חודשי
                </p>
            )}
        </div>
    );
}
