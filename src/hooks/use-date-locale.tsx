'use client';

import { useLocale } from 'next-intl';
import { getDateLocale } from '../lib/utils/get-date-locale';

export function useDateLocale() {
    const locale = useLocale();
    return getDateLocale(locale);
}
