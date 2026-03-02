'use client';
import { useLocale } from 'next-intl';
import { he, ar, ru, enUS } from 'date-fns/locale';

export const useDateLocale = () => {
    const locale = useLocale();

    switch (locale) {
        case 'he': return he;
        case 'ar': return ar;
        case 'ru': return ru;
        case 'en': return enUS;
        default: return he;
    }
};
